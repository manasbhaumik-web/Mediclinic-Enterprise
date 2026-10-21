import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import {
  IntegrationConnection, connectionFromRow, eventFromRow, healthFromRow, summariseOutbox,
} from '../domain/integrations';

const KEYS = {
  connections: ['integrations', 'connections'] as const,
  health: ['integrations', 'health'] as const,
  events: ['integrations', 'events'] as const,
  outbox: ['integrations', 'outbox'] as const,
};

export interface TestResult {
  ok: boolean;
  message?: string;
  httpStatus?: number;
  latencyMs?: number;
  fhirVersion?: string;
  software?: string;
}

export interface ConnectionDraft {
  id?: string;
  type: IntegrationConnection['type'];
  name: string;
  endpointUrl: string;
  authType: IntegrationConnection['authType'];
  authHeaderName: string;
  mode: IntegrationConnection['mode'];
  sendNric: boolean;
}

export function useIntegrations() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ['integrations'] });

  const connections = useQuery({
    queryKey: KEYS.connections,
    queryFn: async () => {
      const { data, error } = await supabase.from('integration_connections').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []).map(connectionFromRow);
    },
  });

  const health = useQuery({
    queryKey: KEYS.health,
    queryFn: async () => {
      const { data, error } = await supabase.from('integration_health').select('*');
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((r) => [r.connection_id as string, healthFromRow(r)]));
    },
  });

  const events = useQuery({
    queryKey: KEYS.events,
    queryFn: async () => {
      const { data, error } = await supabase.from('integration_events').select('*').order('created_at', { ascending: false }).limit(30);
      if (error) throw error;
      return (data ?? []).map(eventFromRow);
    },
  });

  const outbox = useQuery({
    queryKey: KEYS.outbox,
    queryFn: async () => {
      const { data, error } = await supabase.from('integration_outbox').select('status').limit(1000);
      if (error) throw error;
      return summariseOutbox(data ?? []);
    },
  });

  const invokeAdmin = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke('integrations-admin', { body });
    if (error) throw new Error(error.message || 'Request failed');
    return data;
  };

  const save = useMutation({
    mutationFn: async ({ draft, secret }: { draft: ConnectionDraft; secret?: string }) => {
      const row = {
        type: draft.type,
        name: draft.name.trim(),
        endpoint_url: draft.endpointUrl.trim() || null,
        auth_type: draft.authType,
        auth_header_name: draft.authType === 'api_key_header' ? draft.authHeaderName.trim() : null,
        mode: draft.mode,
        config: { sendNric: draft.sendNric },
      };
      let id = draft.id;
      if (id) {
        const { error } = await supabase.from('integration_connections').update(row).eq('id', id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('integration_connections').insert(row).select('id').single();
        if (error) throw error;
        id = data.id as string;
      }
      if (secret) await invokeAdmin({ action: 'set_secret', connectionId: id, secret });
      return id;
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

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('integration_connections').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  const clearSecret = useMutation({
    mutationFn: (id: string) => invokeAdmin({ action: 'clear_secret', connectionId: id }),
    onSuccess: refresh,
  });

  const test = useMutation({
    mutationFn: async (id: string): Promise<TestResult> => (await invokeAdmin({ action: 'test', connectionId: id })) as TestResult,
    onSettled: refresh,
  });

  return { connections, health, events, outbox, save, setEnabled, remove, clearSecret, test, refresh };
}
