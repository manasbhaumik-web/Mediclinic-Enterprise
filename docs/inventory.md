# Inventory & Pharmacy

Admin console > Clinical > **Inventory & Pharmacy**, and **Inventory** in the pharmacist's navigation. Doctors prescribe from the catalogue; the Dispensary dispenses from it.

## How stock works

- Stock is held in **batches** (batch number, expiry date, quantity). A drug's total is the sum of its batches, kept in step by a trigger.
- **Nobody writes stock from the browser.** There are no client write rules on drugs, batches or the ledger. Every change goes through a database function that checks the caller's role, locks the rows it touches and writes the ledger in the same transaction: either everything is applied or nothing is.
- Opening balance: when v22 was applied, stock that was not in any batch became an `OPENING` batch (expiry copied from the drug if it had one, otherwise unknown and flagged as an alert).

## Dispensing (`inv_dispense_visit`)

The pharmacist confirms once. In one transaction the function:

1. checks the caller is a pharmacist or administrator and the visit is at the pharmacy,
2. requires a decision (dispense or skip, with a reason) for **every** prescription line,
3. for each dispensed line, checks there is enough **in-date** stock, then takes it from the soonest-expiring batches (unknown expiry last; expired batches are never used),
4. writes one ledger line per batch used, marks the prescription line dispensed (with quantity, who and when), and, for a controlled drug, writes the register entry.

If any line fails (not enough stock, retired drug, missing prescriber on a controlled drug), nothing is changed. Repeating the call is harmless: lines already decided are left alone.

Prescription lines link to stock **by id** (`prescriptions.inventory_id`, set when the doctor picks a drug that is in stock). A line without a link (typed by hand, or from the built-in formulary) needs the pharmacist to choose the stock item; it is never matched by fuzzy name. Dispensed or skipped lines cannot be edited or deleted, and a visit cannot leave the pharmacy while a line is undecided or a controlled entry lacks its second signature (database trigger).

## Catalogue: add, edit, retire

- Add and edit go through `inv_save_drug` (pharmacist or administrator). Stock is not set there; it is received.
- **Delete does not exist.** A drug is *retired* with a reason (only when its stock is zero and it is on no open purchase order). Retired drugs disappear from prescribing; their history stays. They can be restored.
- Only an **administrator** can put a drug in, or take it out of, the controlled register.

## Receiving, disposal and corrections

- Receive stock (with or without a purchase order): batch number and expiry are required; an expired batch is refused; a batch number reused with a different expiry is refused.
- Adjust a batch: dispose, used in the clinic, or a stock-count correction up or down. A reason is always required and a batch cannot go below zero.

## Alerts

Driven by each drug's own reorder level and a clinic-wide near-expiry window (default 60 days, administrator can change it): out of stock, low stock, expired stock still on the shelf, near-expiry batches, batches with no expiry date. The Alerts tab also shows overdue purchase orders and controlled entries waiting for a signature, and lets you start a purchase order from the low-stock items (suggested quantity = the drug's usual reorder quantity, else enough to reach twice its reorder level).

## Suppliers and purchase orders

Draft -> ordered -> partially received -> received, or cancelled (with a reason; not after goods have arrived). A draft can be edited; an ordered one cannot. Goods are received against order lines with the batch number and expiry from the pack; receiving more than is outstanding is refused. Orders get numbers like `PO-2026-0001`. There is no approval step for orders: any pharmacist or administrator can place one.

## Controlled-drug register

For drugs marked controlled (class chosen by the administrator: poison group B or C, dangerous drug, psychotropic, other). Every receipt, dispense, disposal, clinic use and correction writes a register entry with a **running balance**. Dispensing records the patient (name and IC, snapshotted) and the prescriber (the doctor who signed off the consultation). A different pharmacist or administrator must give the **second signature** on each entry; signing your own entry is refused. Entries and signatures are append-only. The Register tab compares each balance with the stock on hand and flags a mismatch.

This is a working record. It is not an official poison book or controlled-drug register format, and the system does not decide which drugs the law treats as controlled: confirm what your licence requires.

## History

`stock_movements` (every change to stock, signed, with the balance after), `controlled_register` and `controlled_register_signatures`, and `inventory_events` (drug created/edited/retired, supplier and order changes, settings) are append-only: a trigger blocks update and delete, for the service role too. The old `inventory_logs` table is kept for reading and can no longer change.

## What changed from the old module

The built-in 50-drug catalogue and the "load sample catalogue" button are gone: an empty database shows an empty state. The "Supply Chain AI" tab is replaced by real alerts and purchase orders. The old direct stock updates and the fuzzy-name matching are removed. "Controlled" used to be a free flag set on antibiotics; it now means "in the register" and starts switched off for every existing drug. Review and set it for the drugs that really are controlled. The unused mock in `src/lib/poisonActDigitalSignature.ts` was deleted.

## Deploying

1. Apply `supabase/migrations/20261021160000_v22_inventory_pharmacy.sql` (the live database currently has stock in 21 drugs with no batch record; they become OPENING batches).
2. Deploy the front end. No edge function is involved: the `inv_*` functions are database functions called with the user's login.
3. Run the security advisor. Expect the `inv_*` functions to appear under "signed-in users can execute SECURITY DEFINER functions": that is intended, each checks the caller's role itself.
4. Set the controlled flag on the drugs that need it, check expiry dates on OPENING batches, enter suppliers.

## Limits

- No stock transfer between locations, recalls by batch, or barcode scanning.
- Purchase orders have no approval limit and no printed PO document.
- Doctors are not warned about stock levels when prescribing.
- The prescriber on a register entry is whoever signed off the consultation; visits where nobody signed off cannot have a controlled drug dispensed.
