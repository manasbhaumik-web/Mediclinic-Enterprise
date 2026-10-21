import React, { useMemo } from 'react';
import { useApprovedLeaveDays, useAttendance, useLeaveReference, useStaffForLeave } from '../../hooks/useLeave';
import { DEFAULT_SETTINGS, addDays, localParts, pickLeaveRule, summariseAttendance } from '../../domain/leave';
import { entitlementDays } from '../../../supabase/functions/_shared/leaveCalc';

/** Read-only overview for the Staff Directory: annual leave left and this month's attendance, both calculated. */
export default function LeaveStatusList() {
  const { settings, holidays, rules } = useLeaveReference();
  const cfg = settings.data ?? DEFAULT_SETTINGS;
  const today = localParts(Date.now(), cfg.timezone).date;
  const year = +today.slice(0, 4);
  const monthStart = today.slice(0, 7) + '-01';
  const monthEnd = addDays(addDays(monthStart, 31).slice(0, 7) + '-01', -1);
  const staff = useStaffForLeave();
  const yearLeave = useApprovedLeaveDays(`${year}-01-01`, `${year}-12-31`);
  const records = useAttendance(monthStart, monthEnd);
  const holidaySet = useMemo(() => new Set((holidays.data ?? []).map((h) => h.date)), [holidays.data]);

  return (
    <div className="space-y-3 animate-fadeIn">
      <p className="text-xs text-slate-600">Figures are calculated from approved leave and daily attendance records. Manage leave, attendance and rules under <b>Leave &amp; Attendance</b> in the admin console.</p>
      {(staff.error || yearLeave.error) && <p role="alert" className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2">Could not load leave data. Has the v21 leave migration been applied?</p>}
      <div className="bg-surface border border-line-subtle rounded-none shadow-2xs overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-accent text-ink font-bold uppercase text-2xs tracking-wider border-b border-line">
            <tr><th className="px-6 py-3.5">Employee</th><th className="px-6 py-3.5 text-right">Leave taken ({year})</th><th className="px-6 py-3.5 text-right">Annual leave left</th><th className="px-6 py-3.5 text-right">Attendance this month</th></tr>
          </thead>
          <tbody className="divide-y divide-line-subtle">
            {(staff.data ?? []).map((p) => {
              const mine = (yearLeave.data ?? []).filter((d) => d.staffId === p.id);
              const taken = mine.reduce((s, d) => s + d.fraction, 0);
              const annualTaken = mine.filter((d) => d.leaveType === 'annual').reduce((s, d) => s + d.fraction, 0);
              const rule = pickLeaveRule((rules.data ?? []), 'annual', year, { gender: p.gender, hireDate: p.hireDate });
              const ent = rule ? entitlementDays(rule, { gender: p.gender, hireDate: p.hireDate }, year).days : null;
              const left = rule ? (ent === null ? 'No limit' : String(Math.round((ent - annualTaken) * 10) / 10)) : '–';
              const att = summariseAttendance((records.data ?? []).filter((r) => r.staffId === p.id).map((r) => ({ date: r.date, status: r.status })), mine.filter((d) => d.date >= monthStart && d.date <= monthEnd), cfg, holidaySet, monthStart, monthEnd, today);
              return (
                <tr key={p.id} className="hover:bg-surface-muted">
                  <td className="px-6 py-3 font-bold text-ink">{p.name}<div className="font-medium text-slate-500">{p.role}</div></td>
                  <td className="px-6 py-3 text-right font-mono">{Math.round(taken * 10) / 10} days</td>
                  <td className="px-6 py-3 text-right font-mono">{left}{rule && typeof ent === 'number' ? ' days' : ''}</td>
                  <td className="px-6 py-3 text-right font-mono">{att.rate === null ? '–' : `${att.rate}%`}{att.unrecorded > 0 && <span className="ml-2 text-amber-700 font-bold" title="Days with no attendance record">{att.unrecorded} unrecorded</span>}</td>
                </tr>
              );
            })}
            {(staff.data ?? []).length === 0 && <tr><td className="px-6 py-4 text-slate-500" colSpan={4}>No active staff.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
