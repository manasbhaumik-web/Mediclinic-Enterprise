import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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
}

interface FinancialContextType {
  transactions: Transaction[];
  recordTransaction: (transaction: Omit<Transaction, 'id' | 'date' | 'status'>) => void;
  markClaimAsPaid: (transactionId: string) => void;
}

// Mock transactions are replaced by Supabase DB
const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export function FinancialProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false });
      if (data && !error) {
        setTransactions(data.map(t => ({
          id: t.id,
          date: t.date,
          patientId: t.patient_id,
          visitId: t.visit_id,
          paymentMethod: t.payment_method,
          paidAmount: Number(t.paid_amount),
          panelClaimed: Number(t.panel_claimed),
          glNumber: t.gl_number,
          status: t.status
        })));
      }
    };

    fetchTransactions();

    const channel = supabase.channel('financial_sync_' + Math.random().toString(36).substring(2, 9))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        fetchTransactions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const recordTransaction = async (transactionData: Omit<Transaction, 'id' | 'date' | 'status'>) => {
    const status = transactionData.panelClaimed > 0 ? 'Pending Claim' : 'Completed';
    
    // For fast UI update
    const tempId = `TRX-${Date.now()}`;
    const newTrx: Transaction = {
      id: tempId,
      date: new Date().toISOString(),
      status,
      ...transactionData
    };
    setTransactions(prev => [newTrx, ...prev]);

    // Insert to DB
    try {
      // Find UUID for patient and visit, assuming local IDs might still be used in UI temporarily
      let patientUuid = null;
      let visitUuid = null;
      
      // If patientId doesn't look like UUID, attempt to resolve it or just send it if it's already a UUID
      if (transactionData.patientId && transactionData.patientId.length > 20) patientUuid = transactionData.patientId;
      if (transactionData.visitId && transactionData.visitId.length > 20) visitUuid = transactionData.visitId;

      const { data, error } = await supabase.from('transactions').insert([{
        patient_id: patientUuid,
        visit_id: visitUuid,
        payment_method: transactionData.paymentMethod,
        paid_amount: transactionData.paidAmount,
        panel_claimed: transactionData.panelClaimed,
        gl_number: transactionData.glNumber,
        status: status,
        date: new Date().toISOString()
      }]).select().single();

      if (data) {
        setTransactions(prev => prev.map(t => t.id === tempId ? { ...t, id: data.id } : t));
      }
    } catch (err) {
      console.error('Failed to record transaction', err);
    }
  };

  const markClaimAsPaid = async (transactionId: string) => {
    setTransactions(prev => prev.map(trx => 
      trx.id === transactionId ? { ...trx, status: 'Claim Paid' } : trx
    ));

    try {
      await supabase.from('transactions').update({ status: 'Claim Paid' }).eq('id', transactionId);
    } catch (err) {
      console.error('Failed to update claim', err);
    }
  };

  return (
    <FinancialContext.Provider value={{ transactions, recordTransaction, markClaimAsPaid }}>
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
