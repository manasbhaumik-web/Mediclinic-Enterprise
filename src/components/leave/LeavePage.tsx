import React, { useState } from 'react';
import { CalendarClock } from 'lucide-react';
import RequestsPanel from './RequestsPanel';
import AttendancePanel from './AttendancePanel';
import BalancesPanel from './BalancesPanel';
import LeaveSetup from './LeaveSetup';
import HistoryPanel from './HistoryPanel';

type Tab = 'requests' | 'attendance' | 'balances' | 'setup' | 'history';
const TABS: [Tab, string][] = [['requests', 'Leave requests'], ['attendance', 'Attendance'], ['balances', 'Balances'], ['setup', 'Rules & setup'], ['history', 'History']];

/** Leave & Attendance console for HR and administrators. */
export default function LeavePage({ role }: { role: 'admin' | 'hr' }) {
  const [tab, setTab] = useState<Tab>('requests');
  const tabClass = (t: Tab) =>
    `px-4 py-2 text-xs font-bold border-b-2 cursor-pointer transition-colors ${tab === t ? 'border-primary text-accent' : 'border-transparent text-slate-500 hover:text-ink'}`;

  return (
    <div className="animate-fadeIn w-full space-y-5 pb-8">
      <div className="bg-surface-accent border border-line p-5 space-y-1">
        <h1 className="type-page-title text-ink flex items-center gap-2.5"><CalendarClock className="w-6 h-6 text-accent" />Leave &amp; Attendance</h1>
        <p className="text-xs text-slate-600 font-medium max-w-3xl leading-relaxed">
          Employees request leave and clock in from their own page; HR and administrators approve leave and correct attendance. Balances and attendance rates are calculated from approved requests and daily records, and every change is kept in the history. Approved unpaid leave is deducted automatically in payroll.
        </p>
      </div>
      <div role="tablist" className="flex flex-wrap border-b border-line-subtle">
        {TABS.map(([t, label]) => <button key={t} role="tab" aria-selected={tab === t} className={tabClass(t)} onClick={() => setTab(t)}>{label}</button>)}
      </div>
      {tab === 'requests' && <RequestsPanel role={role} />}
      {tab === 'attendance' && <AttendancePanel />}
      {tab === 'balances' && <BalancesPanel />}
      {tab === 'setup' && <LeaveSetup role={role} />}
      {tab === 'history' && <HistoryPanel />}
    </div>
  );
}
