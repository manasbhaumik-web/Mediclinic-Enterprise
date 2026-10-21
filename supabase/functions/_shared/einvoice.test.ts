import { describe, expect, it } from 'vitest';
import {
  GENERAL_PUBLIC_TIN, Snapshot, Supplier, allocate, buildConsolidatedDocument, buildInvoiceDocument, r2, validateSupplier,
} from './ubl';
import {
  BASE_URLS, MyInvoisError, cancelDocument, getDocumentDetails, getToken, mapLhdnStatus, sha256Hex, submitDocument, validationUrl,
} from './myinvois';

const supplier: Supplier = {
  name: 'Klinik Mediclinic Sdn Bhd', tin: 'C12345678901', brn: '202001012345', msicCode: '86201',
  msicDescription: 'General medical practice activities', address1: '12 Jalan Contoh', city: 'Shah Alam',
  postcode: '40000', stateCode: '10', phone: '+60355108899',
};

const snapshot: Snapshot = {
  lines: [
    { description: 'Consultation Fee', quantity: 1, unitPrice: 35, amount: 35 },
    { description: 'Paracetamol 500mg', quantity: 10, unitPrice: 2, amount: 20 },
  ],
  discountAmount: 5.5, subtotal: 49.5, taxRate: 0.06, taxAmount: 2.97, grandTotal: 52.47,
};

const opts = { invoiceNumber: 'INV-2026-000001', issuedAt: new Date('2026-10-21T04:56:32Z'), supplier, taxCategory: '02' as const };
const general = { name: 'General Public', tin: GENERAL_PUBLIC_TIN };

const val = (x: any) => x[0]._;

describe('allocate', () => {
  it('splits a total exactly, putting the rounding remainder on the last part', () => {
    const parts = allocate(10, [1, 1, 1]);
    expect(parts.reduce((a, b) => a + b, 0)).toBeCloseTo(10, 10);
    expect(parts).toEqual([3.33, 3.33, 3.34]);
  });

  it('handles zero weights and empty input', () => {
    expect(allocate(5, [0, 0])).toEqual([0, 5]);
    expect(allocate(5, [])).toEqual([]);
  });
});

describe('buildInvoiceDocument', () => {
  const doc = buildInvoiceDocument(snapshot, { ...opts, buyer: general });
  const inv = doc.Invoice[0] as any;

  it('has the UBL namespaces and header fields', () => {
    expect(doc._D).toContain('Invoice-2');
    expect(val(inv.ID)).toBe('INV-2026-000001');
    expect(val(inv.IssueDate)).toBe('2026-10-21');
    expect(val(inv.IssueTime)).toBe('04:56:32Z');
    expect(inv.InvoiceTypeCode[0]).toEqual({ _: '01', listVersionID: '1.0' });
    expect(val(inv.DocumentCurrencyCode)).toBe('MYR');
  });

  it('identifies supplier and buyer by TIN', () => {
    const supplierIds = inv.AccountingSupplierParty[0].Party[0].PartyIdentification.map((p: any) => p.ID[0]);
    expect(supplierIds).toContainEqual({ _: 'C12345678901', schemeID: 'TIN' });
    expect(supplierIds).toContainEqual({ _: '202001012345', schemeID: 'BRN' });
    const buyerIds = inv.AccountingCustomerParty[0].Party[0].PartyIdentification.map((p: any) => p.ID[0]);
    expect(buyerIds).toContainEqual({ _: GENERAL_PUBLIC_TIN, schemeID: 'TIN' });
    expect(inv.AccountingSupplierParty[0].Party[0].IndustryClassificationCode[0]._).toBe('86201');
  });

  it('totals match the billed snapshot to the sen', () => {
    const t = inv.LegalMonetaryTotal[0];
    expect(val(t.TaxExclusiveAmount)).toBe(49.5);
    expect(val(inv.TaxTotal[0].TaxAmount)).toBe(2.97);
    expect(val(t.PayableAmount)).toBe(52.47);
  });

  it('line extension amounts and line taxes add up to the document totals', () => {
    const lines = inv.InvoiceLine as any[];
    const net = r2(lines.reduce((s, l) => s + val(l.LineExtensionAmount), 0));
    const tax = r2(lines.reduce((s, l) => s + val(l.TaxTotal[0].TaxAmount), 0));
    expect(net).toBe(49.5);
    expect(tax).toBe(2.97);
  });

  it('spreads the discount across lines as line-level allowances', () => {
    const lines = inv.InvoiceLine as any[];
    const allowances = lines.map((l) => l.AllowanceCharge?.[0].Amount[0]._ ?? 0);
    expect(r2(allowances.reduce((a, b) => a + b, 0))).toBe(5.5);
    expect(lines[0].ItemPriceExtension[0].Amount[0]._).toBe(35);
  });

  it('uses the classification code and tax category given', () => {
    const line = inv.InvoiceLine[0];
    expect(line.Item[0].CommodityClassification[0].ItemClassificationCode[0]._).toBe('022');
    expect(line.TaxTotal[0].TaxSubtotal[0].TaxCategory[0].ID[0]._).toBe('02');
    expect(line.TaxTotal[0].TaxSubtotal[0].Percent[0]._).toBe(6);
  });

  it('charges no tax when the category is not applicable', () => {
    const d = buildInvoiceDocument(snapshot, { ...opts, buyer: general, taxCategory: '06' }).Invoice[0] as any;
    expect(val(d.TaxTotal[0].TaxAmount)).toBe(0);
    expect(val(d.LegalMonetaryTotal[0].PayableAmount)).toBe(49.5);
  });

  it('puts a named individual buyer NRIC in the identifiers', () => {
    const d = buildInvoiceDocument(snapshot, { ...opts, buyer: { name: 'Aina Ali', tin: 'IG12345678901', idType: 'NRIC', idValue: '900101145555' } }).Invoice[0] as any;
    const ids = d.AccountingCustomerParty[0].Party[0].PartyIdentification.map((p: any) => p.ID[0]);
    expect(ids).toContainEqual({ _: '900101145555', schemeID: 'NRIC' });
  });
});

describe('buildConsolidatedDocument', () => {
  const members = [
    { invoiceNumber: 'INV-2026-000001', netAmount: 49.5, taxAmount: 2.97 },
    { invoiceNumber: 'INV-2026-000002', netAmount: 100, taxAmount: 6 },
  ];
  const inv = buildConsolidatedDocument(members, 0.06, { ...opts, invoiceNumber: 'CON-2026-10' }).Invoice[0] as any;

  it('has one line per receipt with the consolidated classification code', () => {
    expect(inv.InvoiceLine).toHaveLength(2);
    expect(inv.InvoiceLine[0].Item[0].CommodityClassification[0].ItemClassificationCode[0]._).toBe('004');
    expect(inv.InvoiceLine[1].Item[0].Description[0]._).toBe('Receipt INV-2026-000002');
  });

  it('is addressed to the general public and totals the members', () => {
    const ids = inv.AccountingCustomerParty[0].Party[0].PartyIdentification.map((p: any) => p.ID[0]);
    expect(ids).toContainEqual({ _: GENERAL_PUBLIC_TIN, schemeID: 'TIN' });
    expect(val(inv.LegalMonetaryTotal[0].TaxExclusiveAmount)).toBe(149.5);
    expect(val(inv.TaxTotal[0].TaxAmount)).toBe(8.97);
    expect(val(inv.LegalMonetaryTotal[0].PayableAmount)).toBe(158.47);
  });
});

describe('validateSupplier', () => {
  it('accepts a complete supplier', () => {
    expect(validateSupplier(supplier)).toEqual([]);
  });

  it('reports every missing or malformed field', () => {
    const problems = validateSupplier({ name: '', tin: 'x', msicCode: '123', postcode: '4000', stateCode: '99' });
    expect(problems).toEqual(expect.arrayContaining([
      'Legal name is required', 'MSIC code must be 5 digits', 'Postcode must be 5 digits',
      'State code must be 01 to 17', 'TIN looks malformed (8 to 14 letters/digits)', 'Business registration number is required',
    ]));
  });
});

// ---- MyInvois client with a fake fetch ----

const reply = (status: number, body: unknown) => async () => new Response(JSON.stringify(body), { status });

describe('MyInvois client', () => {
  it('requests a token with client credentials and the onbehalfof header', async () => {
    let seen: { url: string; init: RequestInit } | undefined;
    const f = (async (url: string, init: RequestInit) => { seen = { url, init }; return new Response(JSON.stringify({ access_token: 'tok' }), { status: 200 }); }) as unknown as typeof fetch;
    expect(await getToken('sandbox', 'id', 'secret', 'C999', f)).toBe('tok');
    expect(seen!.url).toBe(`${BASE_URLS.sandbox}/connect/token`);
    expect(String(seen!.init.body)).toContain('grant_type=client_credentials');
    expect((seen!.init.headers as Record<string, string>).onbehalfof).toBe('C999');
    expect(seen!.init.redirect).toBe('manual');
  });

  it('never calls anything but the fixed LHDN hosts', () => {
    expect(Object.values(BASE_URLS).every((u) => u.startsWith('https://') && u.endsWith('.myinvois.hasil.gov.my'))).toBe(true);
  });

  it('reports bad credentials as non-retryable and server errors as retryable', async () => {
    await expect(getToken('sandbox', 'id', 'bad', undefined, reply(401, {}) as unknown as typeof fetch)).rejects.toMatchObject({ retryable: false });
    await expect(getToken('sandbox', 'id', 's', undefined, reply(503, {}) as unknown as typeof fetch)).rejects.toMatchObject({ retryable: true });
  });

  it('submits a base64 document with its SHA-256 hash and parses acceptance', async () => {
    let sent: any;
    const f = (async (_u: string, init: RequestInit) => {
      sent = JSON.parse(String(init.body));
      return new Response(JSON.stringify({ submissionUid: 'S1', acceptedDocuments: [{ uuid: 'U1', invoiceCodeNumber: 'INV-1' }], rejectedDocuments: [] }), { status: 202 });
    }) as unknown as typeof fetch;
    const doc = { hello: 'world' };
    const res = await submitDocument('sandbox', 'tok', doc, 'INV-1', undefined, f);
    expect(res.accepted).toEqual({ uuid: 'U1', invoiceCodeNumber: 'INV-1' });
    expect(res.submissionUid).toBe('S1');
    expect(sent.documents[0]).toMatchObject({ format: 'JSON', codeNumber: 'INV-1' });
    expect(atob(sent.documents[0].document)).toBe(JSON.stringify(doc));
    expect(sent.documents[0].documentHash).toBe(await sha256Hex(JSON.stringify(doc)));
    expect(res.documentHash).toBe(sent.documents[0].documentHash);
  });

  it('parses a rejection with its details', async () => {
    const f = reply(202, { submissionUid: 'S2', acceptedDocuments: [], rejectedDocuments: [{ invoiceCodeNumber: 'INV-2', error: { message: 'Validation failed', details: [{ target: 'TIN', message: 'Invalid' }] } }] }) as unknown as typeof fetch;
    const res = await submitDocument('sandbox', 't', {}, 'INV-2', undefined, f);
    expect(res.accepted).toBeNull();
    expect(res.rejected).toEqual({ invoiceCodeNumber: 'INV-2', message: 'Validation failed', details: ['TIN Invalid'] });
  });

  it('reads document status, long id and validation errors', async () => {
    const f = reply(200, { status: 'Invalid', longId: 'LONG', validationResults: { validationSteps: [{ name: 'Step', status: 'Invalid', error: { error: 'Bad TIN' } }, { name: 'ok', status: 'Valid' }] } }) as unknown as typeof fetch;
    expect(await getDocumentDetails('sandbox', 't', 'U1', undefined, f)).toEqual({ status: 'Invalid', longId: 'LONG', errors: ['Step: Bad TIN'] });
  });

  it('cancel throws a MyInvoisError on failure', async () => {
    await expect(cancelDocument('sandbox', 't', 'U1', 'wrong amount', undefined, reply(400, { error: { message: 'Too late' } }) as unknown as typeof fetch))
      .rejects.toBeInstanceOf(MyInvoisError);
  });

  it('maps statuses and builds the validation link', () => {
    expect(mapLhdnStatus('Valid')).toBe('valid');
    expect(mapLhdnStatus('Invalid')).toBe('invalid');
    expect(mapLhdnStatus('Cancelled')).toBe('cancelled');
    expect(mapLhdnStatus('Submitted')).toBe('submitted');
    expect(mapLhdnStatus('something new')).toBe('submitted');
    expect(validationUrl('production', 'U', 'L')).toBe('https://myinvois.hasil.gov.my/U/share/L');
  });
});
