import React, { createContext, useContext, useEffect, useMemo, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { DrugItem, InventoryLog, drugFromRow, movementFromRow, toLog } from '../domain/inventory';

export type { DrugItem, DrugBatch, InventoryLog } from '../domain/inventory';

/**
 * Read-only view of the drug catalogue for screens that only need to look things up (prescribing, dashboards).
 * It holds NO data of its own: if the database has no drugs yet, the catalogue is empty. Stock only changes through
 * the inv_* database functions (see useInventoryData), never from here.
 */
interface InventoryContextType {
  /** Active drugs with their batches. */
  catalog: DrugItem[];
  inventory: DrugItem[];
  /** Recent dispensed / disposed / used-in-clinic movements. */
  logs: InventoryLog[];
  isLoading: boolean;
  error: Error | null;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const INVENTORY_KEY = ['inventory'] as const;

export function InventoryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const items = useQuery({
    queryKey: [...INVENTORY_KEY, 'catalog'],
    enabled: !!user,
    queryFn: async (): Promise<DrugItem[]> => {
      const { data, error } = await supabase.from('inventory').select('*, drug_batches(*)').eq('status', 'active').order('drug_name');
      if (error) throw error;
      return (data ?? []).map(drugFromRow);
    },
  });

  const moves = useQuery({
    queryKey: [...INVENTORY_KEY, 'usage-log'],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('stock_movements').select('*').in('movement_type', ['dispense', 'dispose', 'internal_use']).order('seq', { ascending: false }).limit(1000);
      if (error) throw error;
      return (data ?? []).map(movementFromRow);
    },
  });

  // Any change to stock refreshes every inventory view.
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('inventory_sync_' + Math.random().toString(36).substring(2, 9))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, () => qc.invalidateQueries({ queryKey: INVENTORY_KEY }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drug_batches' }, () => qc.invalidateQueries({ queryKey: INVENTORY_KEY }))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stock_movements' }, () => qc.invalidateQueries({ queryKey: INVENTORY_KEY }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, qc]);

  const value = useMemo<InventoryContextType>(() => {
    const catalog = items.data ?? [];
    const name = new Map(catalog.map((d) => [d.id, d.name]));
    const logs = (moves.data ?? []).map((m) => toLog(m, name.get(m.inventoryId) ?? 'Unknown')).filter((l): l is InventoryLog => l !== null);
    return { catalog, inventory: catalog, logs, isLoading: items.isLoading, error: (items.error as Error | null) ?? null };
  }, [items.data, items.isLoading, items.error, moves.data]);

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}
