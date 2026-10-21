import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import {
  DrugItem, InventoryEvent, PurchaseOrder, RegisterEntry, StockMovement, Supplier,
  drugFromRow, inventoryEventFromRow, movementFromRow, poFromRow, registerFromRow, supplierFromRow,
} from '../domain/inventory';
import { INVENTORY_KEY } from '../context/InventoryContext';

/** All drugs, including retired ones, with their batches (the Inventory screens; other screens use the context). */
export function useDrugs(enabled = true) {
  return useQuery({
    queryKey: [...INVENTORY_KEY, 'drugs'],
    enabled,
    queryFn: async (): Promise<DrugItem[]> => {
      const { data, error } = await supabase.from('inventory').select('*, drug_batches(*)').order('drug_name');
      if (error) throw error;
      return (data ?? []).map(drugFromRow);
    },
  });
}

export function useMovements(inventoryId?: string | null, limit = 200) {
  return useQuery({
    queryKey: [...INVENTORY_KEY, 'movements', inventoryId ?? 'all', limit],
    queryFn: async (): Promise<StockMovement[]> => {
      let q = supabase.from('stock_movements').select('*').order('seq', { ascending: false }).limit(limit);
      if (inventoryId) q = q.eq('inventory_id', inventoryId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map(movementFromRow);
    },
  });
}

export function useSuppliers() {
  return useQuery({
    queryKey: [...INVENTORY_KEY, 'suppliers'],
    queryFn: async (): Promise<Supplier[]> => {
      const { data, error } = await supabase.from('suppliers').select('*').order('name');
      if (error) throw error;
      return (data ?? []).map(supplierFromRow);
    },
  });
}

export function usePurchaseOrders() {
  return useQuery({
    queryKey: [...INVENTORY_KEY, 'orders'],
    queryFn: async (): Promise<PurchaseOrder[]> => {
      const { data, error } = await supabase.from('purchase_orders').select('*, purchase_order_lines(*)').order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      return (data ?? []).map(poFromRow);
    },
  });
}

export function useRegister(inventoryId?: string | null, enabled = true) {
  return useQuery({
    queryKey: [...INVENTORY_KEY, 'register', inventoryId ?? 'all'],
    enabled,
    queryFn: async (): Promise<RegisterEntry[]> => {
      let q = supabase.from('controlled_register').select('*, controlled_register_signatures(*)').order('seq', { ascending: false }).limit(500);
      if (inventoryId) q = q.eq('inventory_id', inventoryId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map(registerFromRow);
    },
  });
}

/** Register entries for one visit, used by the dispensary to see whether a second signature is still needed. */
export function useVisitRegister(visitId: string | null | undefined) {
  return useQuery({
    queryKey: [...INVENTORY_KEY, 'visit-register', visitId ?? 'none'],
    enabled: !!visitId,
    refetchInterval: 5000,
    queryFn: async (): Promise<RegisterEntry[]> => {
      const { data, error } = await supabase.from('controlled_register').select('*, controlled_register_signatures(*)').eq('visit_id', visitId!);
      if (error) throw error;
      return (data ?? []).map(registerFromRow);
    },
  });
}

export function useInventoryEvents() {
  return useQuery({
    queryKey: [...INVENTORY_KEY, 'events'],
    queryFn: async (): Promise<InventoryEvent[]> => {
      const { data, error } = await supabase.from('inventory_events').select('*').order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      return (data ?? []).map(inventoryEventFromRow);
    },
  });
}

export function useInventorySettings() {
  const qc = useQueryClient();
  const settings = useQuery({
    queryKey: [...INVENTORY_KEY, 'settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('inventory_settings').select('*').maybeSingle();
      if (error) throw error;
      return { nearExpiryDays: (data?.near_expiry_days as number | undefined) ?? 60 };
    },
  });
  const save = useMutation({
    mutationFn: async (nearExpiryDays: number) => {
      const { error } = await supabase.from('inventory_settings').update({ near_expiry_days: nearExpiryDays, updated_at: new Date().toISOString() }).eq('id', true);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: INVENTORY_KEY }),
  });
  return { settings, save };
}

/** Calls an inv_* database function. A business-rule refusal comes back as an Error whose message is the sentence to show. */
async function rpc<T = unknown>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export interface DispenseLine { prescription_id: string; action: 'dispense' | 'skip'; inventory_id?: string | null; quantity?: number; reason?: string }
export interface DispenseResult { dispensed: number; skipped: number; pending_signatures: number }

export function useInventoryActions() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: INVENTORY_KEY });
  const opts = { onSettled: refresh };

  return {
    saveDrug: useMutation({ mutationFn: (v: { id?: string | null; data: Record<string, unknown> }) => rpc<string>('inv_save_drug', { p_id: v.id ?? null, p: v.data }), ...opts }),
    retireDrug: useMutation({ mutationFn: (v: { id: string; reason: string }) => rpc('inv_retire_drug', { p_id: v.id, p_reason: v.reason }), ...opts }),
    restoreDrug: useMutation({ mutationFn: (id: string) => rpc('inv_restore_drug', { p_id: id }), ...opts }),
    receiveStock: useMutation({
      mutationFn: (v: { inventoryId: string; quantity: number; batchNumber: string; expiry: string; supplierId?: string | null; unitCost?: number | null; notes?: string }) =>
        rpc('inv_receive_stock', { p_inventory_id: v.inventoryId, p_quantity: v.quantity, p_batch_number: v.batchNumber, p_expiry: v.expiry, p_supplier_id: v.supplierId ?? null, p_unit_cost: v.unitCost ?? null, p_notes: v.notes ?? null }),
      ...opts,
    }),
    adjustStock: useMutation({
      mutationFn: (v: { batchId: string; type: 'dispose' | 'internal_use' | 'decrease' | 'increase'; quantity: number; reason: string }) =>
        rpc('inv_adjust_stock', { p_batch_id: v.batchId, p_type: v.type, p_quantity: v.quantity, p_reason: v.reason }),
      ...opts,
    }),
    dispenseVisit: useMutation({ mutationFn: (v: { visitId: string; lines: DispenseLine[] }) => rpc<DispenseResult>('inv_dispense_visit', { p_visit_id: v.visitId, p_lines: v.lines }), ...opts }),
    signEntry: useMutation({ mutationFn: (v: { entryId: string; note?: string }) => rpc('inv_sign_register_entry', { p_entry_id: v.entryId, p_note: v.note ?? null }), ...opts }),
    savePo: useMutation({
      mutationFn: (v: { id?: string | null; supplierId: string; expected?: string | null; notes?: string; lines: { inventory_id: string; quantity: number; unit_cost?: number | null }[] }) =>
        rpc<string>('inv_save_po', { p_po_id: v.id ?? null, p_supplier_id: v.supplierId, p_expected: v.expected || null, p_notes: v.notes ?? null, p_lines: v.lines }),
      ...opts,
    }),
    setPoStatus: useMutation({ mutationFn: (v: { id: string; status: 'ordered' | 'cancelled'; reason?: string }) => rpc('inv_set_po_status', { p_po_id: v.id, p_status: v.status, p_reason: v.reason ?? null }), ...opts }),
    receivePo: useMutation({
      mutationFn: (v: { id: string; lines: { line_id: string; quantity: number; batch_number: string; expiry_date: string }[] }) => rpc<{ status: string }>('inv_receive_po', { p_po_id: v.id, p_lines: v.lines }),
      ...opts,
    }),
    saveSupplier: useMutation({
      mutationFn: async (s: { id?: string; name: string; contactName?: string; phone?: string; email?: string; address?: string; notes?: string; active?: boolean }) => {
        const row = { name: s.name.trim(), contact_name: s.contactName || null, phone: s.phone || null, email: s.email || null, address: s.address || null, notes: s.notes || null, active: s.active ?? true };
        const { error } = s.id ? await supabase.from('suppliers').update(row).eq('id', s.id) : await supabase.from('suppliers').insert(row);
        if (error) throw new Error(/duplicate|unique/i.test(error.message) ? 'A supplier with that name already exists.' : error.message);
      },
      ...opts,
    }),
  };
}
