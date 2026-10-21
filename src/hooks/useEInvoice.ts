import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import {
  EInvoiceConfig, EInvoiceConnection, EInvoiceRow, EInvoiceStatus, connectionFromRow, invoiceFromRow,
} from '../domain/einvoice';

const KEYS = { connection: ['einvoice', 'connection'] as const, invoices: ['einvoice', 'invoices'] as const };

export interface ActionResult {
  ok?: boolean;
  message?: string;
  [key: string]: unknown;
}

export interface BuyerInput {
  type: 'general_public' | 'individual' | 'business';
  name: string;
  tin: string;
  idType?: string;
  idValue?: string;
  address1?: string;
  city?: string;
  postcode?: string;
  stateCode?: string;
  phone?: string;
  email?: string;
}

export function useEInvoice(statusFilter: EInvoiceStatus | 'all' = 'all') {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ['einvoice'] });

  const connection = useQuery({
    queryKey: KEYS.connection,
    queryFn: async (): Promise<EInvoiceConnection | null> => {
      const { data, error } = await supabase.from('integration_connections').select('*').eq('type', 'einvoice').order('created_at').limit(1).maybeSingle();
      if (error) throw error;
      return data ? connectionFromRow(data) : null;
    },
  });

  const invoices = useQuery({
    queryKey: [...KEYS.invoices, statusFilter],
    queryFn: async (): Promise<EInvoiceRow[]> => {
      let q = supabase.from('einvoices').select('*').order('issued_at', { ascending: false }).limit(200);
      if (statusFilter !== 'all') q = q.eq('status', statusFilter);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map(invoiceFromRow);
    },
  });

  // Status counts ignore the filter so the summary tiles stay stable.
  const counts = useQuery({
    queryKey: [...KEYS.invoices, 'counts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('einvoices').select('status').limit(5000);
      if (error) throw error;
      return data ?? [];
    },
  });

  const invoke = async (fn: string, body: Record<string, unknown>): Promise<ActionResult> => {
    const { data, error } = await supabase.functions.invoke(fn, { body });
    if (error) throw new Error(error.message || 'Request failed');
    return (data ?? {}) as ActionResult;
  };

  const saveConfig = useMutation({
    mutationFn: async ({ id, mode, config, secret }: { id?: string; mode: 'sandbox' | 'live'; config: EInvoiceConfig; secret?: string }) => {
      const row = { type: 'einvoice', name: 'LHDN MyInvois', auth_type: 'oauth_client_credentials', mode, config };
      let connectionId = id;
      if (connectionId) {
        const { error } = await supabase.from('integration_connections').update(row).eq('id', connectionId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('integration_connections').insert(row).select('id').single();
        if (error) throw error;
        connectionId = data.id as string;
      }
      if (secret) await invoke('integrations-admin', { action: 'set_secret', connectionId, secret });
      return connectionId;
    },
    onSuccess: refresh,
  });

  const setEnabled = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from('integration_connections').update({ enabled }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  const action = useMutation({
    mutationFn: (body: Record<string, unknown>) => invoke('einvoice-admin', body),
    onSettled: refresh,
  });

  return { connection, invoices, counts, saveConfig, setEnabled, action, refresh };
}
