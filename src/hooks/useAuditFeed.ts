import { useMemo } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import {
  AuditEntry, AuditSource, SOURCE_LABEL, equipmentEntry, hrEntry, integrationEntry, inventoryEntry, mergeFeed, payrollEntry,
} from '../domain/audit';

const PER_SOURCE_LIMIT = 100;

const SOURCES: { source: AuditSource; table: string; map: (row: any) => AuditEntry }[] = [
  { source: 'inventory', table: 'inventory_events', map: inventoryEntry },
  { source: 'hr', table: 'hr_events', map: hrEntry },
  { source: 'payroll', table: 'payroll_events', map: payrollEntry },
  { source: 'equipment', table: 'equipment_events', map: equipmentEntry },
  { source: 'integration', table: 'integration_events', map: integrationEntry },
];

/**
 * One activity feed over the app's event tables. Row-level security decides what the signed-in user may read;
 * a source that fails to load is reported rather than hidden.
 */
export function useAuditFeed() {
  const results = useQueries({
    queries: SOURCES.map(({ source, table, map }) => ({
      queryKey: ['audit', source],
      queryFn: async (): Promise<AuditEntry[]> => {
        const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false }).limit(PER_SOURCE_LIMIT);
        if (error) throw error;
        return (data ?? []).map(map);
      },
    })),
  });

  // Event rows store the actor's auth id; staff records link that id to a name.
  const staff = useQuery({
    queryKey: ['audit', 'staff-names'],
    queryFn: async (): Promise<Record<string, string>> => {
      const { data, error } = await supabase.from('staff').select('auth_id, name').not('auth_id', 'is', null);
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((s) => [s.auth_id as string, s.name as string]));
    },
  });

  const loaded = results.map((r) => r.data);
  const entries = useMemo(() => {
    const names = staff.data ?? {};
    return mergeFeed(loaded.map((l) => l ?? [])).map((e) => ({ ...e, actorName: e.actorName ?? (e.actor ? names[e.actor] ?? null : null) }));
    // `loaded` is rebuilt every render; its members are stable references from the query cache.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...loaded, staff.data]);

  return {
    entries,
    isPending: results.some((r) => r.isPending),
    failedSources: SOURCES.filter((_, i) => results[i].isError).map((s) => SOURCE_LABEL[s.source]),
    perSourceLimit: PER_SOURCE_LIMIT,
  };
}
