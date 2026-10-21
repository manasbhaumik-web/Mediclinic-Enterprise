import { supabase } from './supabase';
import { InvoiceSnapshot } from '../domain/billing';

export interface EInvoiceBuyer {
  /** 'general_public' for walk-in self-pay patients; 'business' for panels / TPAs, whose TIN an admin must supply. */
  type: 'general_public' | 'individual' | 'business';
  name?: string;
}

/**
 * Record the bill as an e-invoice once payment is settled. The server ignores the call unless an e-Invoice
 * connection is enabled, and an admin controls when and how it is submitted to LHDN.
 *
 * Failures are logged and swallowed: e-invoicing must never block the cashier.
 */
export async function recordEInvoice(visitId: string, snapshot: InvoiceSnapshot, buyer: EInvoiceBuyer): Promise<void> {
  try {
    const { error } = await supabase.rpc('record_einvoice', { p_visit_id: visitId, p_snapshot: snapshot, p_buyer: buyer });
    if (error) console.warn('e-Invoice not recorded:', error.message);
  } catch (err) {
    console.warn('e-Invoice recording failed:', err);
  }
}
