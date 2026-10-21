/** Types and pure helpers for the admin e-Invoice (LHDN MyInvois) screen. */
import { Supplier, validateSupplier } from '../../supabase/functions/_shared/ubl';

export type EInvoiceStatus = 'pending' | 'needs_buyer' | 'submitted' | 'valid' | 'invalid' | 'cancelled' | 'error' | 'consolidated';
export type BuyerType = 'general_public' | 'individual' | 'business';
export type SubmissionMode = 'per_invoice' | 'consolidated';
export type TaxCategoryCode = '01' | '02' | '06';

export interface EInvoiceConfig {
  clientId: string;
  intermediaryTin: string;
  submissionMode: SubmissionMode;
  taxCategory: TaxCategoryCode;
  classificationCode: string;
  supplier: Supplier;
}

export const EMPTY_CONFIG: EInvoiceConfig = {
  clientId: '',
  intermediaryTin: '',
  submissionMode: 'consolidated',
  taxCategory: '06',
  classificationCode: '022',
  supplier: {
    name: '', tin: '', brn: '', sstNo: '', tourismTaxNo: '', msicCode: '', msicDescription: '',
    address1: '', address2: '', city: '', postcode: '', stateCode: '', country: 'MYS', phone: '', email: '',
  },
};

export interface EInvoiceConnection {
  id: string;
  enabled: boolean;
  mode: 'sandbox' | 'live';
  secretSet: boolean;
  config: EInvoiceConfig;
}

export interface EInvoiceRow {
  id: string;
  invoiceNumber: string;
  kind: 'invoice' | 'consolidated';
  status: EInvoiceStatus;
  buyerType: BuyerType;
  buyer: { name?: string; tin?: string; idType?: string; idValue?: string; address1?: string; city?: string; postcode?: string; stateCode?: string; phone?: string; email?: string };
  totalPayable: number;
  taxTotal: number;
  periodMonth: string | null;
  consolidatedInto: string | null;
  lhdnUuid: string | null;
  longId: string | null;
  validationErrors: string[] | null;
  lastError: string | null;
  attempts: number;
  issuedAt: string;
  submittedAt: string | null;
  validatedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
}

export type Tone = 'ok' | 'warn' | 'bad' | 'idle' | 'info';

export const STATUS_LABELS: Record<EInvoiceStatus, { label: string; tone: Tone; hint: string }> = {
  pending: { label: 'Ready', tone: 'info', hint: 'Waiting to be submitted to LHDN.' },
  needs_buyer: { label: 'Needs buyer details', tone: 'warn', hint: 'A panel or named buyer needs a TIN before submission.' },
  submitted: { label: 'Submitted', tone: 'info', hint: 'Sent to LHDN; validation result pending.' },
  valid: { label: 'Valid', tone: 'ok', hint: 'Validated by LHDN.' },
  invalid: { label: 'Rejected', tone: 'bad', hint: 'LHDN rejected it. See the errors, fix and retry.' },
  cancelled: { label: 'Cancelled', tone: 'idle', hint: 'Cancelled with LHDN.' },
  error: { label: 'Failed', tone: 'bad', hint: 'Could not be submitted. See the error, then retry.' },
  consolidated: { label: 'In consolidated', tone: 'idle', hint: 'Included in a monthly consolidated e-invoice.' },
};

/** Statuses an admin may edit the buyer of, or retry. */
export const EDITABLE: readonly EInvoiceStatus[] = ['pending', 'needs_buyer', 'invalid', 'error'];

export const canCancel = (r: Pick<EInvoiceRow, 'status' | 'lhdnUuid'>) => (r.status === 'submitted' || r.status === 'valid') && !!r.lhdnUuid;

/** LHDN allows cancelling a validated e-invoice only within 72 hours. */
export function cancelWindowOpen(validatedAt: string | null, now: Date = new Date()): boolean {
  if (!validatedAt) return true;
  return now.getTime() - new Date(validatedAt).getTime() <= 72 * 3600_000;
}

/** Consolidated e-invoices for a month are due within 7 calendar days after month end. */
export function consolidatedDueDate(month: string): Date | null {
  const m = month.match(/^(\d{4})-(0[1-9]|1[0-2])$/);
  if (!m) return null;
  const monthEnd = new Date(Date.UTC(Number(m[1]), Number(m[2]), 0));
  return new Date(monthEnd.getTime() + 7 * 86400_000);
}

/** The last `count` calendar months as YYYY-MM, newest first, in Malaysia time. */
export function recentMonths(count = 6, now: Date = new Date()): string[] {
  const kl = new Date(now.getTime() + 8 * 3600_000);
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(Date.UTC(kl.getUTCFullYear(), kl.getUTCMonth() - i, 1));
    out.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
  }
  return out;
}

export interface SetupCheck { ok: boolean; problems: string[] }

/** Everything that must be true before the connection can be switched on. */
export function checkSetup(config: EInvoiceConfig, secretSet: boolean): SetupCheck {
  const problems = [...validateSupplier(config.supplier)];
  if (!config.clientId.trim()) problems.push('MyInvois client ID is required');
  if (!secretSet) problems.push('MyInvois client secret has not been saved');
  return { ok: problems.length === 0, problems };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function connectionFromRow(r: any): EInvoiceConnection {
  const c = r.config ?? {};
  return {
    id: r.id,
    enabled: !!r.enabled,
    mode: r.mode === 'live' ? 'live' : 'sandbox',
    secretSet: !!r.secret_set,
    config: {
      ...EMPTY_CONFIG,
      ...c,
      supplier: { ...EMPTY_CONFIG.supplier, ...(c.supplier ?? {}) },
    },
  };
}

export function invoiceFromRow(r: any): EInvoiceRow {
  return {
    id: r.id,
    invoiceNumber: r.invoice_number,
    kind: r.kind,
    status: r.status,
    buyerType: r.buyer_type,
    buyer: r.buyer ?? {},
    totalPayable: Number(r.total_payable),
    taxTotal: Number(r.tax_total),
    periodMonth: r.period_month,
    consolidatedInto: r.consolidated_into,
    lhdnUuid: r.lhdn_uuid,
    longId: r.long_id,
    validationErrors: Array.isArray(r.validation_errors) ? r.validation_errors : null,
    lastError: r.last_error,
    attempts: r.attempts ?? 0,
    issuedAt: r.issued_at,
    submittedAt: r.submitted_at,
    validatedAt: r.validated_at,
    cancelledAt: r.cancelled_at,
    cancelReason: r.cancel_reason,
  };
}

export function summariseInvoices(rows: Pick<EInvoiceRow, 'status'>[]): Record<EInvoiceStatus, number> {
  const out = { pending: 0, needs_buyer: 0, submitted: 0, valid: 0, invalid: 0, cancelled: 0, error: 0, consolidated: 0 } as Record<EInvoiceStatus, number>;
  for (const r of rows) out[r.status]++;
  return out;
}
