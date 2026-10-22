import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useFinancials } from '../context/FinancialContext';
import { SettleResult, Settlement, buildSettlementArgs, validateSettlement } from '../domain/billing';

const NETWORK_MESSAGE = 'Could not reach the server. Check the connection and try again.';

/** A database refusal carries the sentence to show; anything else is treated as a connection problem. */
function messageFrom(error: { message?: string; code?: string; name?: string }): string {
  if (error.name === 'AuthRetryableFetchError' || /fetch|network/i.test(error.message ?? '')) return NETWORK_MESSAGE;
  return error.message || 'The server could not complete this. Try again.';
}

/**
 * Payments and claim updates. Each is one database function call, so a payment either is recorded in full
 * (visit marked paid, ledger row written and a receipt number issued) or not at all.
 */
export function useBillingActions() {
  const queryClient = useQueryClient();
  const { refresh } = useFinancials();

  const settleVisit = async (visitId: string, settlement: Settlement): Promise<SettleResult> => {
    const invalid = validateSettlement(settlement);
    if (invalid) return { ok: false, error: invalid };
    let receiptNo: string;
    try {
      const { data, error } = await supabase.rpc('billing_settle_visit', buildSettlementArgs(visitId, settlement));
      if (error) return { ok: false, error: messageFrom(error) };
      receiptNo = String((data as { receipt_no?: string } | null)?.receipt_no ?? '');
    } catch {
      return { ok: false, error: NETWORK_MESSAGE };
    }
    await Promise.all([queryClient.invalidateQueries({ queryKey: ['visits'] }), refresh()]);
    return { ok: true, receiptNo };
  };

  const markClaimPaid = async (transactionId: string, reference: string, receivedOn: string): Promise<string | null> => {
    try {
      const { error } = await supabase.rpc('billing_mark_claim_paid', { p_transaction_id: transactionId, p_reference: reference, p_received_on: receivedOn });
      if (error) return messageFrom(error);
    } catch {
      return NETWORK_MESSAGE;
    }
    await refresh();
    return null;
  };

  return { settleVisit, markClaimPaid };
}
