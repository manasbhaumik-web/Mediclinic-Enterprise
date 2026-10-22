import React, { createContext, useCallback, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export interface Transaction {
  id: string;
  date: string;
  patientId: string;
  visitId: string;
  paymentMethod: 'Cash' | 'Credit Card' | 'e-Wallet' | 'Panel';
  paidAmount: number;
  panelClaimed: number;
  glNumber?: string;
  status: 'Completed' | 'Pending Claim' | 'Claim Paid';
  /** Card payment intent id, or the e-wallet / bank reference. */
  paymentReference?: string;
  /** The panel's remittance reference and the day it paid, once the claim is settled. */
  claimReference?: string;
  claimReceivedOn?: string;
}

interface FinancialContextType {
  transactions: Transaction[];
  /** Re-reads the ledger. Payments and claim updates are written through billing_* database functions (see useBilling). */
  refresh: () => Promise<void>;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

const fromRow = (t: any): Transaction => ({
  id: t.id,
  date: t.date,
  patientId: t.patient_id,
  visitId: t.visit_id,
  paymentMethod: t.payment_method,
  paidAmount: Number(t.paid_amount),
  panelClaimed: Number(t.panel_claimed),
  glNumber: t.gl_number ?? undefined,
  status: t.status,
  paymentReference: t.payment_reference ?? undefined,
  claimReference: t.claim_reference ?? undefined,
  claimReceivedOn: t.claim_received_on ?? undefined,
});

export function FinancialProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const refresh = useCallback(async () => {
    const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false });
    if (data && !error) setTransactions(data.map(fromRow));
  }, []);

  // The ledger needs a signed-in user, so load it (and follow changes) per user rather than once at start-up.
  useEffect(() => {
    if (!userId) { setTransactions([]); return; }
    void refresh();

    const channel = supabase.channel('financial_sync_' + Math.random().toString(36).substring(2, 9))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => { void refresh(); })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh, userId]);

  return (
    <FinancialContext.Provider value={{ transactions, refresh }}>
      {children}
    </FinancialContext.Provider>
  );
}

export function useFinancials() {
  const context = useContext(FinancialContext);
  if (context === undefined) {
    throw new Error('useFinancials must be used within a FinancialProvider');
  }
  return context;
}
