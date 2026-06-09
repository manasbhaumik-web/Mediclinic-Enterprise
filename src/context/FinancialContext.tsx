import React, { createContext, useContext, useState, ReactNode } from 'react';

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

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 'TRX-1001', date: '2026-06-05T09:30:00Z', patientId: 'P004', visitId: 'V-MOCK-101', paymentMethod: 'Cash', paidAmount: 85.00, panelClaimed: 0, status: 'Completed' },
  { id: 'TRX-1002', date: '2026-06-05T11:15:00Z', patientId: 'P002', visitId: 'V-MOCK-102', paymentMethod: 'Panel', paidAmount: 0, panelClaimed: 120.50, glNumber: 'PM-GL-8912', status: 'Pending Claim' },
  { id: 'TRX-1003', date: '2026-06-05T14:20:00Z', patientId: 'P005', visitId: 'V-MOCK-103', paymentMethod: 'Credit Card', paidAmount: 210.00, panelClaimed: 0, status: 'Completed' },
  { id: 'TRX-1004', date: '2026-06-05T16:05:00Z', patientId: 'P003', visitId: 'V-MOCK-104', paymentMethod: 'Panel', paidAmount: 15.00, panelClaimed: 60.00, glNumber: 'MIC-GL-2291', status: 'Claim Paid' },
];

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export function FinancialProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);

  const recordTransaction = (transactionData: Omit<Transaction, 'id' | 'date' | 'status'>) => {
    const newTrx: Transaction = {
      id: `TRX-${Math.floor(Math.random() * 9000) + 1000}`,
      date: new Date().toISOString(),
      status: transactionData.panelClaimed > 0 ? 'Pending Claim' : 'Completed',
      ...transactionData
    };
    setTransactions(prev => [newTrx, ...prev]);
  };

  const markClaimAsPaid = (transactionId: string) => {
    setTransactions(prev => prev.map(trx => 
      trx.id === transactionId ? { ...trx, status: 'Claim Paid' } : trx
    ));
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
