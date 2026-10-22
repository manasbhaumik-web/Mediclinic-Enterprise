import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useFinancials } from '../context/FinancialContext';
import { Settlement, buildSettlementArgs, validateSettlement } from '../domain/billing';

const NETWORK_MESSAGE = 'Could not reach the server. Check the connection and try again.';

/** A database refusal carries the sentence to show; anything else is treated as a connection problem. */
function messageFrom(error: { message?: string; code?: string; name?: string }): string {
  if (error.name === 'AuthRetryableFetchError' || /fetch|network/i.test(error.message ?? '')) return NETWORK_MESSAGE;
  return error.message || 'The server could not complete this. Try again.';
}

/**
 * Payments and claim updates. Each is one database function call, so a payment either is recorded in full
 * (visit marked paid and ledger row written) or not at all. Resolves to an error message, or null on success.
 */
export function useBillingActions() {
  const queryClient = useQueryClient();
  const { refresh } = useFinancials();

  const settleVisit = async (visitId: string, settlement: Settlement): Promise<string | null> => {
    const invalid = validateSettlement(settlement);
    if (invalid) return invalid;
    try {
      const { error } = await supabase.rpc('billing_settle_visit', buildSettlementArgs(visitId, settlement));
      if (error) return messageFrom(error);
    } catch {
      return NETWORK_MESSAGE;
    }
    await Promise.all([queryClient.invalidateQueries({ queryKey: ['visits'] }), refresh()]);
    return null;
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
