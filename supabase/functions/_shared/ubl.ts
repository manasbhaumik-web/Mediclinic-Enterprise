/**
 * Builds MyInvois (LHDN) e-invoice documents in UBL 2.1 JSON, unsigned "version 1.0".
 *
 * IMPORTANT: this follows LHDN's published document structure from the SDK as the author understood it.
 * It has NOT been validated against the MyInvois pre-production environment. Validate every document type
 * there (and confirm whether your submissions must be digitally signed, version 1.1) before using it live.
 *
 * Pure TypeScript, no Deno globals, so it is unit tested and shared by the edge functions.
 */

export const GENERAL_PUBLIC_TIN = 'EI00000000010';

export interface Supplier {
  name: string;
  tin: string;
  brn: string;
  sstNo?: string;
  tourismTaxNo?: string;
  msicCode: string;
  msicDescription: string;
  address1: string;
  address2?: string;
  city: string;
  postcode: string;
  stateCode: string;     // LHDN state code list, e.g. '10' Selangor, '14' Kuala Lumpur
  country?: string;      // ISO 3166-1 alpha-3, default MYS
  phone: string;
  email?: string;
}

export interface Buyer {
  name: string;
  tin: string;
  idType?: 'NRIC' | 'PASSPORT' | 'BRN' | 'ARMY';
  idValue?: string;
  address1?: string;
  city?: string;
  postcode?: string;
  stateCode?: string;
  phone?: string;
  email?: string;
}

export interface SnapshotLine { description: string; quantity: number; unitPrice: number; amount: number }

/** What the cashier desk billed, captured at payment time. Amounts are MYR. */
export interface Snapshot {
  lines: SnapshotLine[];
  discountAmount: number;
  subtotal: number;      // after discount, before tax
  taxRate: number;       // fraction, 0.06 for 6%
  taxAmount: number;
  grandTotal: number;
}

export type TaxCategory = '01' | '02' | '06';   // sales tax, service tax, not applicable

export interface DocumentOptions {
  invoiceNumber: string;
  issuedAt: Date;
  supplier: Supplier;
  buyer: Buyer;
  taxCategory: TaxCategory;
  classificationCode?: string;   // default '022' (others)
}

type Money = { _: number; currencyID: 'MYR' };

export const r2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;
const money = (n: number): Money => ({ _: r2(n), currencyID: 'MYR' });
const text = (v: string) => [{ _: v }];

/** Split `total` across `weights` so the parts add up exactly, putting the rounding remainder on the last part. */
export function allocate(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (weights.length === 0) return [];
  if (sum <= 0) return weights.map((_, i) => (i === weights.length - 1 ? r2(total) : 0));
  const parts = weights.map((w) => r2((total * w) / sum));
  const drift = r2(total - parts.reduce((a, b) => a + b, 0));
  parts[parts.length - 1] = r2(parts[parts.length - 1] + drift);
  return parts;
}

function party(p: { name: string; tin: string; brn?: string; sst?: string; ttx?: string; idType?: string; idValue?: string;
  address1?: string; address2?: string; city?: string; postcode?: string; stateCode?: string; country?: string;
  phone?: string; email?: string; msicCode?: string; msicDescription?: string }) {
  const ids: unknown[] = [{ ID: [{ _: p.tin, schemeID: 'TIN' }] }];
  if (p.brn !== undefined) ids.push({ ID: [{ _: p.brn, schemeID: 'BRN' }] });
  if (p.idType) ids.push({ ID: [{ _: p.idValue || 'NA', schemeID: p.idType }] });
  if (p.sst !== undefined) ids.push({ ID: [{ _: p.sst || 'NA', schemeID: 'SST' }] });
  if (p.ttx !== undefined) ids.push({ ID: [{ _: p.ttx || 'NA', schemeID: 'TTX' }] });

  return {
    Party: [{
      ...(p.msicCode ? { IndustryClassificationCode: [{ _: p.msicCode, name: p.msicDescription ?? '' }] } : {}),
      PartyIdentification: ids,
      PostalAddress: [{
        CityName: text(p.city || 'NA'),
        PostalZone: text(p.postcode || 'NA'),
        CountrySubentityCode: text(p.stateCode || '17'),   // '17' = Not Applicable
        AddressLine: [{ Line: text(p.address1 || 'NA') }, { Line: text(p.address2 || '') }, { Line: text('') }],
        Country: [{ IdentificationCode: [{ _: p.country || 'MYS', listID: 'ISO3166-1', listAgencyID: '6' }] }],
      }],
      PartyLegalEntity: [{ RegistrationName: text(p.name) }],
      Contact: [{ Telephone: text(p.phone || 'NA'), ElectronicMail: text(p.email || 'NA') }],
    }],
  };
}

const taxScheme = [{ ID: [{ _: 'OTH', schemeID: 'UN/ECE 5153', schemeAgencyID: '6' }] }];

/**
 * Builds an invoice (type 01) from a billing snapshot. The discount is spread across the lines so each
 * line's tax and extension amounts add up to the document totals exactly.
 */
export function buildInvoiceDocument(snapshot: Snapshot, o: DocumentOptions) {
  const classification = o.classificationCode ?? '022';
  const rate = o.taxCategory === '06' ? 0 : snapshot.taxRate;

  const gross = snapshot.lines.map((l) => r2(l.amount));
  const discounts = allocate(snapshot.discountAmount, gross);
  const net = gross.map((g, i) => r2(g - discounts[i]));
  const netTotal = r2(net.reduce((a, b) => a + b, 0));
  const taxTotal = r2(netTotal * rate);
  const lineTaxes = allocate(taxTotal, net);

  const lines = snapshot.lines.map((l, i) => ({
    ID: text(String(i + 1)),
    InvoicedQuantity: [{ _: l.quantity, unitCode: 'C62' }],
    LineExtensionAmount: [money(net[i])],
    ...(discounts[i] > 0 ? {
      AllowanceCharge: [{ ChargeIndicator: [{ _: false }], AllowanceChargeReason: text('Discount'), Amount: [money(discounts[i])] }],
    } : {}),
    TaxTotal: [{
      TaxAmount: [money(lineTaxes[i])],
      TaxSubtotal: [{
        TaxableAmount: [money(net[i])],
        TaxAmount: [money(lineTaxes[i])],
        Percent: [{ _: r2(rate * 100) }],
        TaxCategory: [{ ID: text(o.taxCategory), TaxScheme: taxScheme }],
      }],
    }],
    Item: [{
      CommodityClassification: [{ ItemClassificationCode: [{ _: classification, listID: 'CLASS' }] }],
      Description: text(l.description),
    }],
    Price: [{ PriceAmount: [money(l.unitPrice)] }],
    ItemPriceExtension: [{ Amount: [money(gross[i])] }],
  }));

  return wrap({
    ID: text(o.invoiceNumber),
    IssueDate: text(o.issuedAt.toISOString().slice(0, 10)),
    IssueTime: text(o.issuedAt.toISOString().slice(11, 19) + 'Z'),
    InvoiceTypeCode: [{ _: '01', listVersionID: '1.0' }],
    DocumentCurrencyCode: text('MYR'),
    TaxCurrencyCode: text('MYR'),
    AccountingSupplierParty: [party({
      name: o.supplier.name, tin: o.supplier.tin, brn: o.supplier.brn, sst: o.supplier.sstNo, ttx: o.supplier.tourismTaxNo,
      address1: o.supplier.address1, address2: o.supplier.address2, city: o.supplier.city, postcode: o.supplier.postcode,
      stateCode: o.supplier.stateCode, country: o.supplier.country, phone: o.supplier.phone, email: o.supplier.email,
      msicCode: o.supplier.msicCode, msicDescription: o.supplier.msicDescription,
    })],
    AccountingCustomerParty: [party({
      name: o.buyer.name, tin: o.buyer.tin,
      brn: o.buyer.idType === 'BRN' ? o.buyer.idValue ?? 'NA' : undefined,
      idType: o.buyer.idType && o.buyer.idType !== 'BRN' ? o.buyer.idType : undefined,
      idValue: o.buyer.idValue,
      sst: 'NA',
      address1: o.buyer.address1, city: o.buyer.city, postcode: o.buyer.postcode, stateCode: o.buyer.stateCode,
      phone: o.buyer.phone, email: o.buyer.email,
    })],
    TaxTotal: [{
      TaxAmount: [money(taxTotal)],
      TaxSubtotal: [{
        TaxableAmount: [money(netTotal)],
        TaxAmount: [money(taxTotal)],
        TaxCategory: [{ ID: text(o.taxCategory), TaxScheme: taxScheme }],
      }],
    }],
    LegalMonetaryTotal: [{
      LineExtensionAmount: [money(netTotal)],
      TaxExclusiveAmount: [money(netTotal)],
      TaxInclusiveAmount: [money(netTotal + taxTotal)],
      AllowanceTotalAmount: [money(snapshot.discountAmount)],
      PayableAmount: [money(netTotal + taxTotal)],
    }],
    InvoiceLine: lines,
  });
}

export interface ConsolidatedMember { invoiceNumber: string; netAmount: number; taxAmount: number }

/**
 * Builds a consolidated e-invoice for general-public sales in a period: one line per receipt, classification
 * code 004 (consolidated e-invoice), buyer = general public.
 */
export function buildConsolidatedDocument(members: ConsolidatedMember[], taxRate: number, o: Omit<DocumentOptions, 'buyer'>) {
  const rate = o.taxCategory === '06' ? 0 : taxRate;
  const lines = members.map((m, i) => ({
    ID: text(String(i + 1)),
    InvoicedQuantity: [{ _: 1, unitCode: 'C62' }],
    LineExtensionAmount: [money(m.netAmount)],
    TaxTotal: [{
      TaxAmount: [money(m.taxAmount)],
      TaxSubtotal: [{
        TaxableAmount: [money(m.netAmount)],
        TaxAmount: [money(m.taxAmount)],
        Percent: [{ _: r2(rate * 100) }],
        TaxCategory: [{ ID: text(o.taxCategory), TaxScheme: taxScheme }],
      }],
    }],
    Item: [{
      CommodityClassification: [{ ItemClassificationCode: [{ _: '004', listID: 'CLASS' }] }],
      Description: text(`Receipt ${m.invoiceNumber}`),
    }],
    Price: [{ PriceAmount: [money(m.netAmount)] }],
    ItemPriceExtension: [{ Amount: [money(m.netAmount)] }],
  }));

  const net = r2(members.reduce((a, m) => a + m.netAmount, 0));
  const tax = r2(members.reduce((a, m) => a + m.taxAmount, 0));

  return buildShell(o, { name: 'General Public', tin: GENERAL_PUBLIC_TIN }, net, tax, lines);
}

function buildShell(o: Omit<DocumentOptions, 'buyer'>, buyer: Buyer, net: number, tax: number, lines: unknown[]) {
  return wrap({
    ID: text(o.invoiceNumber),
    IssueDate: text(o.issuedAt.toISOString().slice(0, 10)),
    IssueTime: text(o.issuedAt.toISOString().slice(11, 19) + 'Z'),
    InvoiceTypeCode: [{ _: '01', listVersionID: '1.0' }],
    DocumentCurrencyCode: text('MYR'),
    TaxCurrencyCode: text('MYR'),
    AccountingSupplierParty: [party({
      name: o.supplier.name, tin: o.supplier.tin, brn: o.supplier.brn, sst: o.supplier.sstNo, ttx: o.supplier.tourismTaxNo,
      address1: o.supplier.address1, address2: o.supplier.address2, city: o.supplier.city, postcode: o.supplier.postcode,
      stateCode: o.supplier.stateCode, country: o.supplier.country, phone: o.supplier.phone, email: o.supplier.email,
      msicCode: o.supplier.msicCode, msicDescription: o.supplier.msicDescription,
    })],
    AccountingCustomerParty: [party({ name: buyer.name, tin: buyer.tin, brn: 'NA', sst: 'NA' })],
    TaxTotal: [{
      TaxAmount: [money(tax)],
      TaxSubtotal: [{
        TaxableAmount: [money(net)],
        TaxAmount: [money(tax)],
        TaxCategory: [{ ID: text(o.taxCategory), TaxScheme: taxScheme }],
      }],
    }],
    LegalMonetaryTotal: [{
      LineExtensionAmount: [money(net)],
      TaxExclusiveAmount: [money(net)],
      TaxInclusiveAmount: [money(net + tax)],
      PayableAmount: [money(net + tax)],
    }],
    InvoiceLine: lines,
  });
}

function wrap(invoice: Record<string, unknown>) {
  return {
    _D: 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
    _A: 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
    _B: 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
    Invoice: [invoice],
  };
}

export type UblDocument = ReturnType<typeof wrap>;

/** Pre-flight check of supplier details so obviously incomplete setups are rejected before calling LHDN. */
export function validateSupplier(s: Partial<Supplier>): string[] {
  const problems: string[] = [];
  const need = (v: string | undefined, label: string) => { if (!v || !v.trim()) problems.push(`${label} is required`); };
  need(s.name, 'Legal name'); need(s.tin, 'TIN'); need(s.brn, 'Business registration number');
  need(s.msicCode, 'MSIC code'); need(s.msicDescription, 'MSIC description');
  need(s.address1, 'Address line 1'); need(s.city, 'City'); need(s.phone, 'Phone');
  if (s.msicCode && !/^\d{5}$/.test(s.msicCode)) problems.push('MSIC code must be 5 digits');
  if (s.postcode && !/^\d{5}$/.test(s.postcode)) problems.push('Postcode must be 5 digits');
  if (!s.postcode) problems.push('Postcode is required');
  if (!s.stateCode || !/^(0[1-9]|1[0-7])$/.test(s.stateCode)) problems.push('State code must be 01 to 17');
  if (s.tin && !/^[A-Z0-9]{8,14}$/i.test(s.tin.trim())) problems.push('TIN looks malformed (8 to 14 letters/digits)');
  return problems;
}
