import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import {
  AttendanceRecord, DEFAULT_SETTINGS, Holiday, HrEvent, LeaveBalanceRow, LeaveRequest, LeaveRuleRow, LeaveSettings, LeaveType,
  attendanceFromRow, eventFromRow, holidayFromRow, requestFromRow, ruleFromRow, settingsFromRow, typeFromRow,
} from '../domain/leave';

const K = ['leave'] as const;

export interface LeaveResult {
  ok?: boolean;
  message?: string;
  valid?: boolean;
  days?: number;
  warnings?: string[];
  year?: number;
  staffId?: string;
  hireDate?: string | null;
  balances?: LeaveBalanceRow[];
  [k: string]: unknown;
}

/** Calls the leave function. Business-rule refusals come back as ok:false with a sentence to show. */
async function invoke(body: Record<string, unknown>): Promise<LeaveResult> {
  const { data, error } = await supabase.functions.invoke('leave', { body });
  if (error) {
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === 'function') {
      try {
        const j = await ctx.json();
        if (j?.message || j?.error) throw new Error(String(j.message ?? j.error));
      } catch (e) { if (e instanceof Error && e.message !== 'Unexpected end of JSON input') throw e; }
    }
    throw new Error(error.message || 'Request failed');
  }
  return (data ?? {}) as LeaveResult;
}

export function useLeaveReference() {
  const types = useQuery({
    queryKey: [...K, 'types'],
    queryFn: async (): Promise<LeaveType[]> => {
      const { data, error } = await supabase.from('leave_types').select('*').order('sort_order');
      if (error) throw error;
      return (data ?? []).map(typeFromRow);
    },
  });
  const settings = useQuery({
    queryKey: [...K, 'settings'],
    queryFn: async (): Promise<LeaveSettings> => {
      const { data, error } = await supabase.from('leave_settings').select('*').maybeSingle();
      if (error) throw error;
      return data ? settingsFromRow(data) : DEFAULT_SETTINGS;
    },
  });
  const holidays = useQuery({
    queryKey: [...K, 'holidays'],
    queryFn: async (): Promise<Holiday[]> => {
      const { data, error } = await supabase.from('public_holidays').select('*').order('holiday_date');
      if (error) throw error;
      return (data ?? []).map(holidayFromRow);
    },
  });
  const rules = useQuery({
    queryKey: [...K, 'rules'],
    queryFn: async (): Promise<(LeaveRuleRow & { note: string | null })[]> => {
      const { data, error } = await supabase.from('leave_rules').select('*').order('leave_type').order('effective_from', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(ruleFromRow);
    },
  });
  return { types, settings, holidays, rules };
}

export function useLeaveRequests(opts: { status?: string; staffId?: string | null; enabled?: boolean } = {}) {
  return useQuery({
    queryKey: [...K, 'requests', opts.status ?? 'all', opts.staffId ?? 'all'],
    enabled: opts.enabled ?? true,
    queryFn: async (): Promise<LeaveRequest[]> => {
      let q = supabase.from('leave_requests').select('*').order('requested_at', { ascending: false }).limit(300);
      if (opts.status && opts.status !== 'all') q = q.eq('status', opts.status);
      if (opts.staffId) q = q.eq('staff_id', opts.staffId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map(requestFromRow);
    },
  });
}

/** Approved leave days inside a period, for attendance rates (admin and HR). */
export function useApprovedLeaveDays(from: string, to: string) {
  return useQuery({
    queryKey: [...K, 'leave-days', from, to],
    queryFn: async () => {
      const { data: days, error } = await supabase.from('leave_days').select('request_id, staff_id, leave_date, fraction').gte('leave_date', from).lte('leave_date', to);
      if (error) throw error;
      const ids = [...new Set((days ?? []).map((d) => d.request_id))];
      if (ids.length === 0) return [] as { staffId: string; date: string; fraction: number; leaveType: string }[];
      const { data: reqs, error: e2 } = await supabase.from('leave_requests').select('id, leave_type').in('id', ids).eq('status', 'approved');
      if (e2) throw e2;
      const typeOf = new Map((reqs ?? []).map((r) => [r.id as string, r.leave_type as string]));
      return (days ?? []).filter((d) => typeOf.has(d.request_id)).map((d) => ({ staffId: d.staff_id as string, date: String(d.leave_date).slice(0, 10), fraction: Number(d.fraction), leaveType: typeOf.get(d.request_id) as string }));
    },
  });
}

export function useAttendance(from: string, to: string, staffId?: string | null) {
  return useQuery({
    queryKey: [...K, 'attendance', from, to, staffId ?? 'all'],
    queryFn: async (): Promise<AttendanceRecord[]> => {
      let q = supabase.from('attendance_records').select('*').gte('work_date', from).lte('work_date', to).limit(5000);
      if (staffId) q = q.eq('staff_id', staffId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map(attendanceFromRow);
    },
  });
}

export function useHrEvents(entity?: string, entityId?: string | null) {
  return useQuery({
    queryKey: [...K, 'events', entity ?? 'all', entityId ?? 'all'],
    queryFn: async (): Promise<HrEvent[]> => {
      let q = supabase.from('hr_events').select('*').order('created_at', { ascending: false }).limit(150);
      if (entity) q = q.eq('entity', entity);
      if (entityId) q = q.eq('entity_id', entityId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map(eventFromRow);
    },
  });
}

export function useBalances(staffId: string | null | undefined, year: number) {
  return useQuery({
    queryKey: [...K, 'balances', staffId ?? 'me', year],
    queryFn: () => invoke({ action: 'balances', year, ...(staffId ? { staffId } : {}) }),
    retry: false,
  });
}

export function useLeaveActions() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: [...K] });

  const call = useMutation({ mutationFn: (body: Record<string, unknown>) => invoke(body), onSettled: refresh });
  const preview = (body: Record<string, unknown>) => invoke({ action: 'preview', ...body });

  const saveRule = useMutation({
    mutationFn: async (r: { id?: string; leaveType: string; label: string; effectiveFrom: string; priority: number; eligibility: unknown; config: unknown; active: boolean; note: string | null }) => {
      const row = { leave_type: r.leaveType, label: r.label, effective_from: r.effectiveFrom, priority: r.priority, eligibility: r.eligibility, config: r.config, active: r.active, note: r.note };
      const { error } = r.id ? await supabase.from('leave_rules').update(row).eq('id', r.id) : await supabase.from('leave_rules').insert(row);
      if (error) throw error;
    },
    onSuccess: refresh,
  });
  const patchRule = useMutation({
    mutationFn: async ({ id, ...patch }: { id: string; verified?: boolean; active?: boolean }) => {
      const { error } = await supabase.from('leave_rules').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: refresh,
  });
  const saveHoliday = useMutation({
    mutationFn: async ({ date, name }: { date: string; name: string }) => {
      const { error } = await supabase.from('public_holidays').insert({ holiday_date: date, name });
      if (error) throw error;
    },
    onSuccess: refresh,
  });
  const deleteHoliday = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('public_holidays').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: refresh,
  });
  const saveSettings = useMutation({
    mutationFn: async (s: LeaveSettings) => {
      const { error } = await supabase.from('leave_settings').update({
        work_days: s.workDays, work_start: s.workStart, late_grace_minutes: s.lateGraceMinutes, timezone: s.timezone, backdate_days: s.backdateDays, updated_at: new Date().toISOString(),
      }).eq('id', true);
      if (error) throw error;
    },
    onSuccess: refresh,
  });
  const saveType = useMutation({
    mutationFn: async (t: { code: string; name: string; paid: boolean; balanceLimited: boolean; active: boolean; sortOrder: number; isNew?: boolean }) => {
      const row = { code: t.code, name: t.name, paid: t.paid, balance_limited: t.balanceLimited, active: t.active, sort_order: t.sortOrder };
      const { error } = t.isNew ? await supabase.from('leave_types').insert(row) : await supabase.from('leave_types').update(row).eq('code', t.code);
      if (error) throw error;
    },
    onSuccess: refresh,
  });
  const setHireDate = useMutation({
    mutationFn: async ({ staffId, hireDate }: { staffId: string; hireDate: string | null }) => {
      const { error } = await supabase.from('staff').update({ hire_date: hireDate }).eq('id', staffId);
      if (error) throw error;
    },
    onSuccess: () => { refresh(); qc.invalidateQueries({ queryKey: ['payroll'] }); },
  });

  return { call, preview, saveRule, patchRule, saveHoliday, deleteHoliday, saveSettings, saveType, setHireDate };
}

/** Active staff for the HR pickers (id, name, role, hire date). */
export function useStaffForLeave() {
  return useQuery({
    queryKey: [...K, 'staff'],
    queryFn: async () => {
      const { data, error } = await supabase.from('staff').select('id, name, role, status, gender, hire_date, auth_id').eq('status', 'Active').order('name');
      if (error) throw error;
      return (data ?? []).map((s) => ({ id: s.id as string, name: s.name as string, role: s.role as string, gender: (s.gender as string | null) ?? null, hireDate: s.hire_date ? String(s.hire_date).slice(0, 10) : null, hasLogin: !!s.auth_id }));
    },
  });
}
