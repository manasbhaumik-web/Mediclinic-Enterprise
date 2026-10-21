// Leave requests and attendance. Only this function writes requests, leave days and attendance (service
// role); the database also makes decided requests and the history permanent.
//
// Who may do what:
//   any linked employee : my_balances, preview, request (for themselves), cancel (their own pending request), clock_in, clock_out
//   admin or hr         : request / preview / balances for anyone, approve, reject, cancel (pending or approved),
//                         record_attendance, delete_attendance
// Maker-checker: nobody approves their own request while another admin or HR user exists who could.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { authenticate, corsHeadersFor, jsonResponse, serviceClient } from '../_shared/runtime.ts';
import {
  DEFAULT_SETTINGS, LeaveRuleRow, LeaveSettings, clockStatus, computeBalance, expandLeaveDays, isDate, localParts, pickLeaveRule, sumDays,
  validateRequestDates, zonedTimeToIso,
} from '../_shared/leaveCalc.ts';

const STATUSES = ['present', 'late', 'half_day', 'absent'];
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeadersFor(req) });
  if (req.method !== 'POST') return jsonResponse(req, { error: 'Method not allowed' }, 405);

  const caller = await authenticate(req);
  if (!caller) return jsonResponse(req, { error: 'Unauthorized' }, 401);
  const isManager = caller.role === 'admin' || caller.role === 'hr';

  let body: Record<string, any>;
  try { body = await req.json(); } catch { return jsonResponse(req, { error: 'Invalid JSON' }, 400); }
  const action = String(body.action ?? '');
  const db = serviceClient();
  const fail = (message: string, status = 200) => jsonResponse(req, { ok: false, message }, status);
  const ok = (message: string, extra: Record<string, unknown> = {}) => jsonResponse(req, { ok: true, message, ...extra });
  const event = (entity: string, entityId: string | null, staffId: string | null, act: string, detail?: Record<string, unknown>) =>
    db.from('hr_events').insert({ entity, entity_id: entityId, staff_id: staffId, action: act, actor: caller.userId, detail: detail ?? null });

  // ---------- data loading ----------
  async function loadSettings(): Promise<LeaveSettings> {
    const { data } = await db.from('leave_settings').select('*').maybeSingle();
    if (!data) return DEFAULT_SETTINGS;
    return {
      workDays: data.work_days, workStart: String(data.work_start).slice(0, 5), lateGraceMinutes: data.late_grace_minutes,
      timezone: data.timezone, backdateDays: data.backdate_days,
    };
  }
  async function loadHolidays(): Promise<Set<string>> {
    const { data } = await db.from('public_holidays').select('holiday_date');
    return new Set((data ?? []).map((h: any) => String(h.holiday_date).slice(0, 10)));
  }
  async function loadRules(): Promise<LeaveRuleRow[]> {
    const { data } = await db.from('leave_rules').select('*');
    return (data ?? []).map((r: any) => ({
      id: r.id, leaveType: r.leave_type, label: r.label, effectiveFrom: String(r.effective_from).slice(0, 10), priority: r.priority,
      eligibility: r.eligibility ?? {}, config: r.config, active: r.active, verified: r.verified,
    }));
  }
  const staffCols = 'id, name, status, gender, hire_date, auth_id';
  async function ownStaff() {
    const { data } = await db.from('staff').select(staffCols).eq('auth_id', caller.userId).maybeSingle();
    return data as any | null;
  }
  async function staffById(id: string) {
    const { data } = await db.from('staff').select(staffCols).eq('id', id).maybeSingle();
    return data as any | null;
  }

  /** The person an action is about: the caller, or (managers only) someone else. */
  async function target(): Promise<{ staff: any; self: boolean } | { error: Response }> {
    const own = await ownStaff();
    const wanted = typeof body.staffId === 'string' && body.staffId ? body.staffId : own?.id;
    if (!wanted) return { error: fail('Your login is not linked to a staff record. Ask HR to link it.') };
    if (own && wanted === own.id) return { staff: own, self: true };
    if (!isManager) return { error: fail('You can only act on your own record.', 403) };
    const s = await staffById(wanted);
    if (!s) return { error: fail('Staff record not found.', 404) };
    return { staff: s, self: false };
  }

  /** Approved and pending days per leave type in a calendar year for one person. */
  async function usage(staffId: string, year: number) {
    const { data: days } = await db.from('leave_days').select('request_id, fraction').eq('staff_id', staffId).gte('leave_date', `${year}-01-01`).lte('leave_date', `${year}-12-31`);
    const ids = [...new Set((days ?? []).map((d: any) => d.request_id))];
    const taken = new Map<string, number>(), pending = new Map<string, number>();
    if (ids.length) {
      const { data: reqs } = await db.from('leave_requests').select('id, leave_type, status').in('id', ids);
      const info = new Map((reqs ?? []).map((r: any) => [r.id, r]));
      for (const d of days ?? []) {
        const r: any = info.get(d.request_id);
        if (!r) continue;
        const bucket = r.status === 'approved' ? taken : r.status === 'pending' ? pending : null;
        if (bucket) bucket.set(r.leave_type, (bucket.get(r.leave_type) ?? 0) + Number(d.fraction));
      }
    }
    return { taken, pending };
  }

  async function balancesFor(staff: any, year: number, rules: LeaveRuleRow[]) {
    const { data: types } = await db.from('leave_types').select('*').eq('active', true).order('sort_order');
    const u = await usage(staff.id, year);
    const who = { gender: staff.gender, hireDate: staff.hire_date ? String(staff.hire_date).slice(0, 10) : null };
    return (types ?? []).map((t: any) => ({
      code: t.code, name: t.name, paid: t.paid, balanceLimited: t.balance_limited,
      ...computeBalance(t.code, t.balance_limited ? pickLeaveRule(rules, t.code, year, who) : null, who, year, u.taken.get(t.code) ?? 0, u.pending.get(t.code) ?? 0),
      // Types that are not balance-limited need no rule; do not warn about one.
      ...(t.balance_limited ? {} : { warnings: [], hasRule: true }),
    }));
  }

  /** Validates a prospective request and returns the days it covers, or a message to show. */
  async function planRequest(staff: any, self: boolean) {
    const settings = await loadSettings();
    const holidays = await loadHolidays();
    const today = localParts(Date.now(), settings.timezone).date;
    const start = body.startDate, end = body.endDate, half = body.halfDay ?? null;
    const problems = validateRequestDates(start, end, half, today, settings, self && !isManager);
    if (problems.length) return { message: problems.join(' ') };

    const { data: type } = await db.from('leave_types').select('*').eq('code', String(body.leaveType ?? '')).eq('active', true).maybeSingle();
    if (!type) return { message: 'Choose a leave type.' };

    const days = expandLeaveDays(start, end, half, settings, holidays);
    if (days.length === 0) return { message: 'None of those dates are working days (weekends and public holidays are not counted).' };
    const total = sumDays(days);

    const warnings: string[] = [];
    if (type.balance_limited) {
      const rules = await loadRules();
      const who = { gender: staff.gender, hireDate: staff.hire_date ? String(staff.hire_date).slice(0, 10) : null };
      const years = [...new Set(days.map((d) => +d.date.slice(0, 4)))];
      for (const y of years) {
        const rule = pickLeaveRule(rules, type.code, y, who);
        if (!rule) return { message: `No ${type.name.toLowerCase()} entitlement applies to ${staff.name} for ${y}. Check the entitlement rules, hire date and gender.` };
        const u = await usage(staff.id, y);
        const inYear = sumDays(days.filter((d) => +d.date.slice(0, 4) === y));
        const bal = computeBalance(type.code, rule, who, y, u.taken.get(type.code) ?? 0, u.pending.get(type.code) ?? 0);
        if (bal.remaining !== null && inYear > bal.remaining) {
          return { message: `Not enough ${type.name.toLowerCase()} left for ${y}: ${bal.remaining} day${bal.remaining === 1 ? '' : 's'} available (entitled ${bal.entitled}, approved ${bal.taken}, awaiting approval ${bal.pending}), ${inYear} requested.` };
        }
        warnings.push(...bal.warnings);
        if (!rule.verified) warnings.push('The entitlement rule used has not been verified yet.');
      }
    }
    return { settings, type, days, total, warnings: [...new Set(warnings)], start, end, half };
  }

  /** Other admin or HR users who could approve instead of the requester. */
  async function otherApprovers(userId: string): Promise<number> {
    const { count } = await db.from('profiles').select('id', { count: 'exact', head: true }).in('role', ['admin', 'hr']).neq('id', userId);
    return count ?? 0;
  }

  /** Payroll months touched by a request whose payroll is already approved or paid (so the deduction will not apply there). */
  async function lockedPayrollMonths(requestId: string): Promise<string[]> {
    const { data: days } = await db.from('leave_days').select('leave_date').eq('request_id', requestId);
    const months = [...new Set((days ?? []).map((d: any) => String(d.leave_date).slice(0, 7) + '-01'))];
    if (!months.length) return [];
    const { data: runs } = await db.from('payroll_runs').select('period_month, status').in('period_month', months).in('status', ['approved', 'paid']);
    return (runs ?? []).map((r: any) => String(r.period_month).slice(0, 7));
  }

  async function loadRequest(id: unknown) {
    const { data } = await db.from('leave_requests').select('*').eq('id', String(id ?? '')).maybeSingle();
    return data as any | null;
  }

  // ---------- my_balances / balances ----------
  if (action === 'balances') {
    const t = await target(); if ('error' in t) return t.error;
    const year = Number(body.year) || +localParts(Date.now(), (await loadSettings()).timezone).date.slice(0, 4);
    const rules = await loadRules();
    return ok('Balances loaded.', { year, staffId: t.staff.id, hireDate: t.staff.hire_date, balances: await balancesFor(t.staff, year, rules) });
  }

  // ---------- preview ----------
  if (action === 'preview') {
    const t = await target(); if ('error' in t) return t.error;
    const plan = await planRequest(t.staff, t.self);
    if ('message' in plan) return ok(plan.message, { valid: false });
    return ok('OK', { valid: true, days: plan.total, dates: plan.days, warnings: plan.warnings });
  }

  // ---------- request ----------
  if (action === 'request') {
    const t = await target(); if ('error' in t) return t.error;
    if (t.staff.status !== 'Active') return fail('Leave can only be requested for active staff.');
    const plan = await planRequest(t.staff, t.self);
    if ('message' in plan) return fail(plan.message);
    const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 500) : '';

    const { data: reqRow, error } = await db.from('leave_requests').insert({
      staff_id: t.staff.id, staff_name: t.staff.name, staff_auth_id: t.staff.auth_id ?? null, leave_type: plan.type.code, unpaid: !plan.type.paid,
      start_date: plan.start, end_date: plan.end, half_day: plan.half, days: plan.total, reason: reason || null, requested_by: caller.userId,
    }).select('id').single();
    if (error || !reqRow) return fail(/already has a leave request/i.test(error?.message ?? '') ? 'There is already a leave request covering some of these dates.' : 'Could not file the request.');

    const { error: dayError } = await db.from('leave_days').insert(plan.days.map((d) => ({ request_id: reqRow.id, staff_id: t.staff.id, leave_date: d.date, fraction: d.fraction })));
    if (dayError) {
      await db.from('leave_requests').update({ status: 'cancelled', cancelled_by: caller.userId, cancelled_at: new Date().toISOString(), cancel_reason: 'System error while saving the days' }).eq('id', reqRow.id);
      return fail('Could not save the leave days. Nothing was filed.');
    }
    await event('leave_request', reqRow.id, t.staff.id, 'requested', { type: plan.type.code, start: plan.start, end: plan.end, days: plan.total, onBehalf: !t.self });
    return ok(`Leave request filed (${plan.total} day${plan.total === 1 ? '' : 's'}). It is now waiting for approval.`, { requestId: reqRow.id, warnings: plan.warnings });
  }

  // ---------- approve / reject / cancel ----------
  if (action === 'approve' || action === 'reject' || action === 'cancel') {
    const r = await loadRequest(body.requestId);
    if (!r) return fail('Leave request not found.', 404);
    const own = r.staff_auth_id === caller.userId;
    const note = typeof body.reason === 'string' ? body.reason.trim().slice(0, 300) : '';

    if (action === 'cancel') {
      if (r.status !== 'pending' && r.status !== 'approved') return fail(`The request is already ${r.status}.`);
      if (r.status === 'pending' && !(isManager || own)) return fail('You can only cancel your own request.', 403);
      if (r.status === 'approved' && !isManager) return fail('Only HR or an administrator can cancel approved leave.', 403);
      if (r.status === 'approved' && !note) return fail('A reason is required to cancel approved leave.');
      const { error } = await db.from('leave_requests').update({ status: 'cancelled', cancelled_by: caller.userId, cancelled_at: new Date().toISOString(), cancel_reason: note || null }).eq('id', r.id);
      if (error) return fail('Could not cancel the request.');
      await event('leave_request', r.id, r.staff_id, 'cancelled', { was: r.status, reason: note || null });
      const locked = r.status === 'approved' && r.unpaid ? await lockedPayrollMonths(r.id) : [];
      return ok('Leave request cancelled. It stays on record.', locked.length ? { warnings: [`Payroll for ${locked.join(', ')} is already approved, so a deduction taken for this leave there is not refunded automatically. Adjust it in the next run.`] } : {});
    }

    if (!isManager) return fail('Only HR or an administrator can approve or reject leave.', 403);
    if (r.status !== 'pending') return fail(`The request is already ${r.status}.`);

    if (action === 'reject') {
      if (!note) return fail('A reason is required to reject a request.');
      const { error } = await db.from('leave_requests').update({ status: 'rejected', decided_by: caller.userId, decided_at: new Date().toISOString(), decision_note: note }).eq('id', r.id);
      if (error) return fail('Could not reject the request.');
      await event('leave_request', r.id, r.staff_id, 'rejected', { reason: note });
      return ok('Leave request rejected.');
    }

    // approve
    if (own && (await otherApprovers(caller.userId)) > 0) return fail('You cannot approve your own leave. Another administrator or HR user must approve it.');

    // The balance may have changed since filing: check again, ignoring this request's own pending days.
    const { data: type } = await db.from('leave_types').select('*').eq('code', r.leave_type).maybeSingle();
    const warnings: string[] = [];
    if (type?.balance_limited && r.staff_id) {
      const staff = await staffById(r.staff_id);
      const rules = await loadRules();
      const { data: days } = await db.from('leave_days').select('leave_date, fraction').eq('request_id', r.id);
      const who = { gender: staff?.gender, hireDate: staff?.hire_date ? String(staff.hire_date).slice(0, 10) : null };
      for (const y of [...new Set((days ?? []).map((d: any) => +String(d.leave_date).slice(0, 4)))]) {
        const rule = pickLeaveRule(rules, r.leave_type, y, who);
        if (!rule) return fail(`No ${type.name.toLowerCase()} entitlement applies for ${y} any more. Check the entitlement rules.`);
        const u = await usage(r.staff_id, y);
        const own_ = sumDays((days ?? []).filter((d: any) => +String(d.leave_date).slice(0, 4) === y).map((d: any) => ({ fraction: Number(d.fraction) })));
        const bal = computeBalance(type.code, rule, who, y, u.taken.get(type.code) ?? 0, (u.pending.get(type.code) ?? 0) - own_);
        if (bal.remaining !== null && own_ > bal.remaining) return fail(`Not enough ${type.name.toLowerCase()} left for ${y} (${bal.remaining} available, ${own_} requested).`);
        if (!rule.verified) warnings.push('The entitlement rule used has not been verified yet.');
      }
    }

    const { error } = await db.from('leave_requests').update({ status: 'approved', decided_by: caller.userId, decided_at: new Date().toISOString(), decision_note: note || null }).eq('id', r.id);
    if (error) return fail('Could not approve the request.');
    await event('leave_request', r.id, r.staff_id, 'approved', { note: note || null });
    if (r.unpaid) {
      const locked = await lockedPayrollMonths(r.id);
      if (locked.length) warnings.push(`Payroll for ${locked.join(', ')} is already approved, so the unpaid days will not be deducted there automatically. Adjust them in the next run.`);
      else warnings.push('These are unpaid days. They are deducted when payroll for the month is calculated; recalculate a draft run to pick them up.');
    }
    return ok('Leave approved.', { warnings });
  }

  // ---------- clock_in / clock_out (employees, for themselves) ----------
  if (action === 'clock_in' || action === 'clock_out') {
    const own = await ownStaff();
    if (!own) return fail('Your login is not linked to a staff record. Ask HR to link it.');
    if (own.status !== 'Active') return fail('Only active staff can clock in.');
    const settings = await loadSettings();
    const now = new Date();
    const lp = localParts(now, settings.timezone);
    const { data: existing } = await db.from('attendance_records').select('*').eq('staff_id', own.id).eq('work_date', lp.date).maybeSingle();

    if (action === 'clock_in') {
      if (existing) {
        return fail(existing.clock_in ? `You already clocked in today at ${localParts(existing.clock_in, settings.timezone).time}.` : 'HR has already recorded your attendance for today.');
      }
      const { data: leave } = await db.from('leave_days').select('request_id, fraction').eq('staff_id', own.id).eq('leave_date', lp.date);
      if (leave && leave.length) {
        const { data: reqs } = await db.from('leave_requests').select('id').in('id', leave.map((l: any) => l.request_id)).eq('status', 'approved');
        const approved = new Set((reqs ?? []).map((q: any) => q.id));
        if (leave.some((l: any) => approved.has(l.request_id) && Number(l.fraction) === 1)) return fail('You are on approved leave today.');
      }
      const status = clockStatus(lp.time, settings);
      const { error } = await db.from('attendance_records').insert({ staff_id: own.id, staff_auth_id: own.auth_id, work_date: lp.date, status, clock_in: now.toISOString(), source: 'clock', recorded_by: caller.userId });
      if (error) return fail('Could not record your clock-in.');
      await event('attendance', `${own.id}:${lp.date}`, own.id, 'clock_in', { time: lp.time, status });
      return ok(status === 'late' ? `Clocked in at ${lp.time}. You are marked late (work starts ${settings.workStart}, ${settings.lateGraceMinutes} minutes grace).` : `Clocked in at ${lp.time}.`, { status, time: lp.time });
    }

    if (!existing || !existing.clock_in) return fail('You have not clocked in today.');
    if (existing.clock_out) return fail(`You already clocked out today at ${localParts(existing.clock_out, settings.timezone).time}.`);
    const { error } = await db.from('attendance_records').update({ clock_out: now.toISOString(), updated_at: now.toISOString() }).eq('id', existing.id);
    if (error) return fail('Could not record your clock-out.');
    await event('attendance', `${own.id}:${lp.date}`, own.id, 'clock_out', { time: lp.time });
    return ok(`Clocked out at ${lp.time}.`, { time: lp.time });
  }

  // ---------- record_attendance / delete_attendance (HR and administrators) ----------
  if (action === 'record_attendance' || action === 'delete_attendance') {
    if (!isManager) return fail('Only HR or an administrator can record attendance for others.', 403);
    const staff = await staffById(String(body.staffId ?? ''));
    if (!staff) return fail('Staff record not found.', 404);
    const date = body.date;
    if (!isDate(date)) return fail('Enter the date.');
    const settings = await loadSettings();
    const today = localParts(Date.now(), settings.timezone).date;
    if (date > today) return fail('Attendance cannot be recorded for a future date.');
    const note = typeof body.note === 'string' ? body.note.trim().slice(0, 300) : '';
    if (!note) return fail('A note is required, so the history shows why the record was entered or changed.');
    const { data: before } = await db.from('attendance_records').select('*').eq('staff_id', staff.id).eq('work_date', date).maybeSingle();

    if (action === 'delete_attendance') {
      if (!before) return fail('There is no attendance record for that day.');
      const { error } = await db.from('attendance_records').delete().eq('id', before.id);
      if (error) return fail('Could not remove the record.');
      await event('attendance', `${staff.id}:${date}`, staff.id, 'deleted', { before, reason: note });
      return ok('Attendance record removed. The change stays in the history.');
    }

    const status = String(body.status ?? '');
    if (!STATUSES.includes(status)) return fail('Choose present, late, half day or absent.');
    const clockIn = body.clockIn ? String(body.clockIn) : null, clockOut = body.clockOut ? String(body.clockOut) : null;
    if ((clockIn && !TIME.test(clockIn)) || (clockOut && !TIME.test(clockOut))) return fail('Times must look like 09:05.');
    if (clockIn && clockOut && clockOut < clockIn) return fail('Clock-out is before clock-in.');

    const { data: leave } = await db.from('leave_days').select('request_id, fraction').eq('staff_id', staff.id).eq('leave_date', date);
    if (leave && leave.length) {
      const { data: reqs } = await db.from('leave_requests').select('id').in('id', leave.map((l: any) => l.request_id)).eq('status', 'approved');
      const approved = new Set((reqs ?? []).map((q: any) => q.id));
      if (leave.some((l: any) => approved.has(l.request_id) && Number(l.fraction) === 1)) return fail('That day is approved leave. Cancel the leave first if the person actually worked.');
    }

    const row = {
      staff_id: staff.id, staff_auth_id: staff.auth_id ?? null, work_date: date, status,
      clock_in: clockIn ? zonedTimeToIso(date, clockIn, settings.timezone) : null,
      clock_out: clockOut ? zonedTimeToIso(date, clockOut, settings.timezone) : null,
      source: 'manual', note, recorded_by: caller.userId, updated_at: new Date().toISOString(),
    };
    const { error } = await db.from('attendance_records').upsert(row, { onConflict: 'staff_id,work_date' });
    if (error) return fail('Could not save the attendance record.');
    await event('attendance', `${staff.id}:${date}`, staff.id, before ? 'corrected' : 'recorded', { before: before ?? null, after: { status, clockIn, clockOut }, reason: note });
    return ok(before ? 'Attendance corrected. The previous entry stays in the history.' : 'Attendance recorded.');
  }

  return fail('Unknown action.', 400);
});
