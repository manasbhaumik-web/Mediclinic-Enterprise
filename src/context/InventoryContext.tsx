import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export interface DrugBatch {
  id?: string;
  batchId: string;
  stock: number;
  expiryDate: string;
}

export interface DrugItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minThreshold: number;
  price: number;
  
  expiryDate?: string;
  batches?: DrugBatch[];
  consumptionVelocity?: number;
  
  brandName?: string;
  genericName?: string;
  manufacturer?: string;
  strength?: string;
  strengthUnit?: string;
  drugType?: string; 

  packagingType?: string;
  uom?: string; 
  storageConditions?: string;
  
  isControlledDrug?: boolean;
  contraindications?: string;
  pregnancyCategory?: string;
  indications?: string; 
  sideEffects?: string;
  suggestedDosage?: {
    adults?: string;
    children?: string;
  };

  costPrice?: number;
  taxRate?: number;
  isInsuranceClaimable?: boolean;
}

export interface InventoryLog {
  id: string;
  date: string;
  drugId: string;
  drugName: string;
  type: 'Disposal' | 'Internal Use' | 'Dispensed';
  amount: number;
  reason: string;
}

interface InventoryContextType {
  catalog: DrugItem[];
  inventory: DrugItem[];
  logs: InventoryLog[];
  addDrug: (drug: Omit<DrugItem, 'id'>) => void;
  restockDrug: (id: string, amount: number, expiryDate?: string) => void;
  deleteDrug: (id: string) => void;
  dispenseDrug: (drugName: string, quantity: number) => void;
  disposeDrug: (id: string, amount: number, reason: string) => void;
  useDrugInternally: (id: string, amount: number, reason: string) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<DrugItem[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const { user } = useAuth();

  const fetchInventory = async () => {
    const { data: invData, error: invErr } = await supabase.from('inventory').select('*, drug_batches(*)');
    if (invData && !invErr) {
      const mapped = invData.map((d: any) => ({
        id: d.id,
        name: d.drug_name,
        category: d.category,
        currentStock: d.stock_level,
        minThreshold: d.min_threshold,
        price: Number(d.price),
        expiryDate: d.expiry_date,
        drugType: d.drug_type,
        manufacturer: d.manufacturer,
        genericName: d.generic_name,
        isControlledDrug: d.is_controlled_drug,
        indications: d.indications,
        sideEffects: d.side_effects,
        suggestedDosage: d.suggested_dosage,
        batches: d.drug_batches?.map((b: any) => ({
          id: b.id,
          batchId: b.batch_number,
          stock: b.stock_level,
          expiryDate: b.expiry_date
        })) || []
      }));
      setCatalog(mapped);
    }
  };

  const fetchLogs = async () => {
    const { data, error } = await supabase.from('inventory_logs').select('*, inventory(drug_name)').order('created_at', { ascending: false });
    if (data && !error) {
      setLogs(data.map((l: any) => ({
        id: l.id,
        date: l.created_at,
        drugId: l.inventory_id,
        drugName: l.inventory?.drug_name || 'Unknown',
        type: l.type as any,
        amount: l.amount,
        reason: l.reason
      })));
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchLogs();

    const channel = supabase.channel('inventory_sync_' + Math.random().toString(36).substring(2, 9))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, fetchInventory)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drug_batches' }, fetchInventory)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_logs' }, fetchLogs)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addDrug = async (drugData: Omit<DrugItem, 'id'>) => {
    try {
      await supabase.from('inventory').insert([{
        drug_name: drugData.name,
        category: drugData.category,
        stock_level: drugData.currentStock || 0,
        min_threshold: drugData.minThreshold,
        price: drugData.price,
        drug_type: drugData.drugType,
        manufacturer: drugData.manufacturer,
        generic_name: drugData.genericName,
        is_controlled_drug: drugData.isControlledDrug,
        indications: drugData.indications,
        side_effects: drugData.sideEffects,
        suggested_dosage: drugData.suggestedDosage,
        expiry_date: drugData.expiryDate
      }]);
    } catch (err) {
      console.error('Add drug error', err);
    }
  };

  const restockDrug = async (id: string, amount: number, expiryDate?: string) => {
    const drug = catalog.find(d => d.id === id);
    if (!drug) return;
    
    const newBatchId = `B-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const newExpiry = expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    try {
      await supabase.from('drug_batches').insert([{
        inventory_id: id,
        batch_number: newBatchId,
        stock_level: amount,
        expiry_date: newExpiry
      }]);

      await supabase.from('inventory').update({
        stock_level: drug.currentStock + amount
      }).eq('id', id);

      await supabase.from('inventory_logs').insert([{
        inventory_id: id,
        user_id: user?.id,
        type: 'Restock',
        amount: amount,
        reason: `Batch ${newBatchId} received`
      }]);
    } catch (err) {
      console.error('Restock error', err);
    }
  };

  const deleteDrug = async (id: string) => {
    try {
      await supabase.from('inventory').delete().eq('id', id);
    } catch (err) {
      console.error('Delete error', err);
    }
  };

  const processFIFODeduction = async (drug: DrugItem, quantityToDeduct: number, reason: string, logType: string) => {
    if (!drug.batches || drug.batches.length === 0) {
      // Just deduct main stock
      await supabase.from('inventory').update({
        stock_level: Math.max(0, drug.currentStock - quantityToDeduct)
      }).eq('id', drug.id);
      
      await supabase.from('inventory_logs').insert([{
        inventory_id: drug.id,
        user_id: user?.id,
        type: logType,
        amount: quantityToDeduct,
        reason: reason
      }]);
      return;
    }

    let remaining = quantityToDeduct;
    const sortedBatches = [...drug.batches].sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
    
    for (const batch of sortedBatches) {
      if (remaining <= 0) break;
      
      if (batch.stock > 0) {
        const deductFromBatch = Math.min(batch.stock, remaining);
        remaining -= deductFromBatch;
        
        // Update this batch in Supabase
        await supabase.from('drug_batches').update({
          stock_level: batch.stock - deductFromBatch
        }).eq('id', batch.id);
      }
    }

    // Update main stock
    await supabase.from('inventory').update({
      stock_level: Math.max(0, drug.currentStock - quantityToDeduct)
    }).eq('id', drug.id);

    // Add log
    await supabase.from('inventory_logs').insert([{
      inventory_id: drug.id,
      user_id: user?.id,
      type: logType,
      amount: quantityToDeduct,
      reason: reason
    }]);
  };

  const dispenseDrug = async (drugName: string, quantity: number) => {
    const matchedDrug = catalog.find(drug => 
      drug.name.toLowerCase().includes(drugName.toLowerCase()) || 
      drugName.toLowerCase().includes(drug.name.toLowerCase())
    );

    if (matchedDrug) {
      await processFIFODeduction(matchedDrug, quantity, 'Patient Prescription', 'Dispensed');
    }
  };

  const disposeDrug = async (id: string, amount: number, reason: string) => {
    const drug = catalog.find(d => d.id === id);
    if (drug) await processFIFODeduction(drug, amount, reason, 'Disposal');
  };

  const useDrugInternally = async (id: string, amount: number, reason: string) => {
    const drug = catalog.find(d => d.id === id);
    if (drug) await processFIFODeduction(drug, amount, reason, 'Internal Use');
  };

  return (
    <InventoryContext.Provider value={{ catalog, inventory: catalog, logs, addDrug, restockDrug, deleteDrug, dispenseDrug, disposeDrug, useDrugInternally }}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}
