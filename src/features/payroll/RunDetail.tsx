import React, { useState } from 'react';
import { ArrowLeft, Download } from 'lucide-react';
import Button from '../../components/ui/Button';
import { usePayrollActions, usePayrollRun } from '../../hooks/usePayroll';
import { Payslip, STATUS_STYLE, monthLabel, runActions } from '../../domain/payroll';
import {
  ExportResult, bankPaymentCsv, downloadText, eisCsv, epfCsv, pcbCsv, socsoCsv, summaryCsv,
} from '../../domain/payrollExports';
import { generatePayslipPdf, generateRunPayslipsPdf, payslipFilename } from '../../utils/payslipPdf';
import SlipInputs from './SlipInputs';
import { errorMessage, inputClass, myr, toneClass } from './shared';

export default function RunDetail({ runId, role, onBack }: { runId: string; role: 'admin' | 'hr'; onBack: () => void }) {
  const { run: runQ, slips: slipsQ, events } = usePayrollRun(runId);
  const api = usePayrollActions();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [editing, setEditing] = useState<Payslip | null>(null);
  const [viewing, setViewing] = useState<Payslip | null>(null);
  const [exportProblems, setExportProblems] = useState<string[]>([]);
  const [paidOn, setPaidOn] = useState(new Date().toISOString().slice(0, 10));

  const run = runQ.data;
  const slips = slipsQ.data ?? [];
  if (runQ.isLoading) return <p className="text-xs text-subtle">Loading…</p>;
  if (!run) return <div className="space-y-3"><p className="text-xs text-rose-700 font-bold">This run could not be found.</p><Button variant="outline" size="sm" onClick={onBack}>Back</Button></div>;

  const st = STATUS_STYLE[run.status];
  const can = runActions(run.status, role);
  const totals = run.status === 'draft' || run.status === 'reviewed' ? liveTotals(slips) : run.totals;

  const act = async (body: Record<string, unknown>, confirm?: string) => {
    if (confirm && !window.confirm(confirm)) return;
    setMsg(null);
    try {
      const res = await api.call.mutateAsync({ runId, ...body });
      setMsg({ ok: res.ok !== false, text: res.message ?? 'Done.' });
    } catch (e) { setMsg({ ok: false, text: errorMessage(e) }); }
  };

  const exportCsv = (build: (r: typeof run, s: Payslip[]) => ExportResult) => {
    const out = build(run, slips);
    setExportProblems(out.problems);
    downloadText(out.filename, out.csv);
  };

  const cancel = () => {
    const reason = window.prompt('Reason for cancelling this payroll run? It stays on record.');
    if (reason && reason.trim()) void act({ action: 'cancel', reason: reason.trim() });
  };

  const warned = slips.filter((s) => s.warnings.length > 0);

  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="flex items-center gap-1 text-xs font-bold text-accent cursor-pointer"><ArrowLeft className="w-3.5 h-3.5" /> All runs</button>

      <div className="bg-surface border border-line-subtle p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-bold text-ink">{monthLabel(run.periodMonth)}</h2>
          <span className={`text-2xs font-bold px-2 py-0.5 border uppercase ${toneClass[st.tone]}`}>{st.label}</span>
          <span className="text-xs text-subtle">{st.hint}</span>
        </div>
        {run.cancelReason && <p className="text-xs text-rose-700">Cancelled: {run.cancelReason}</p>}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {([['People', String(totals.headcount ?? slips.length)], ['Gross', myr(totals.gross)], ['Deductions', myr(totals.totalDeductions)], ['Net pay', myr(totals.netPay)], ['Employer cost', myr(totals.employerCost)]] as [string, string][]).map(([k, v]) => (
            <div key={k} className="bg-surface-accent border border-line-subtle p-3"><div className="text-2xs font-bold uppercase tracking-wider text-subtle">{k}</div><div className="text-base font-bold text-ink font-mono">{v}</div></div>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-2">
          {can.recalc && <Button variant="outline" size="sm" disabled={api.call.isPending} onClick={() => act({ action: 'recalc_run' })}>Recalculate</Button>}
          {can.submit && <Button size="sm" disabled={api.call.isPending} onClick={() => act({ action: 'submit_review' }, 'Submit this run for approval? You will not be able to edit figures unless it is returned to draft.')}>Submit for approval</Button>}
          {can.returnToDraft && <Button variant="outline" size="sm" disabled={api.call.isPending} onClick={() => act({ action: 'return_to_draft' })}>Return to draft</Button>}
          {can.approve && <Button size="sm" disabled={api.call.isPending} onClick={() => act({ action: 'approve' }, 'Approve this payroll? It becomes frozen and cannot be edited.')}>Approve</Button>}
          {can.markPaid && (
            <>
              <label className="space-y-1 block"><span className="text-2xs font-bold uppercase text-subtle">Paid on</span>
                <input className={`${inputClass} !w-40`} type="date" value={paidOn} onChange={(e) => setPaidOn(e.target.value)} /></label>
              <Button size="sm" disabled={api.call.isPending} onClick={() => act({ action: 'mark_paid', paidOn }, 'Record that salaries were paid? This cannot be undone.')}>Mark as paid</Button>
            </>
          )}
          {can.cancel && <Button variant="outline" size="sm" disabled={api.call.isPending} onClick={cancel}>Cancel run</Button>}
        </div>
        {msg && <p role="status" className={`text-xs font-bold whitespace-pre-line ${msg.ok ? 'text-emerald-700' : 'text-rose-700'}`}>{msg.text}</p>}
        {role === 'hr' && run.status === 'reviewed' && <p className="text-xs text-muted">Waiting for an administrator to approve.</p>}
      </div>

      {warned.length > 0 && (run.status === 'draft' || run.status === 'reviewed') && (
        <div role="status" className="bg-amber-50 border border-amber-300 p-3 space-y-1">
          <div className="text-xs font-bold text-amber-900">Check before submitting ({warned.length})</div>
          <ul className="text-xs text-amber-900 list-disc pl-5">{warned.slice(0, 8).map((s) => <li key={s.id}><b>{s.employee.name}:</b> {s.warnings.join(' ')}</li>)}</ul>
        </div>
      )}

      {can.export && (
        <div className="bg-surface border border-line-subtle p-4 space-y-2">
          <h3 className="type-heading-caps text-ink">Payslips and exports</h3>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" icon={<Download className="w-3.5 h-3.5" />} onClick={() => generateRunPayslipsPdf(run, slips).save(`payslips-${run.periodMonth.slice(0, 7)}.pdf`)}>All payslips (PDF)</Button>
            <Button variant="outline" size="sm" icon={<Download className="w-3.5 h-3.5" />} onClick={() => exportCsv(bankPaymentCsv)}>Bank payments</Button>
            <Button variant="outline" size="sm" icon={<Download className="w-3.5 h-3.5" />} onClick={() => exportCsv(epfCsv)}>EPF</Button>
            <Button variant="outline" size="sm" icon={<Download className="w-3.5 h-3.5" />} onClick={() => exportCsv(socsoCsv)}>SOCSO</Button>
            <Button variant="outline" size="sm" icon={<Download className="w-3.5 h-3.5" />} onClick={() => exportCsv(eisCsv)}>EIS</Button>
            <Button variant="outline" size="sm" icon={<Download className="w-3.5 h-3.5" />} onClick={() => exportCsv(pcbCsv)}>PCB</Button>
            <Button variant="outline" size="sm" icon={<Download className="w-3.5 h-3.5" />} onClick={() => exportCsv(summaryCsv)}>Summary</Button>
          </div>
          <p className="text-2xs text-subtle leading-relaxed">
            These are clean working schedules and a generic payment list. Banks and the KWSP, PERKESO and LHDN portals each have their own upload layouts, so copy or map the columns into the format they ask for; they are not the official upload files.
          </p>
          {exportProblems.length > 0 && (
            <ul role="alert" className="text-xs text-amber-900 bg-amber-50 border border-amber-300 p-3 list-disc pl-6">{exportProblems.map((p, i) => <li key={i}>{p}</li>)}</ul>
          )}
        </div>
      )}

      <div className="bg-surface border border-line-subtle overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-2xs uppercase tracking-wider text-subtle border-b border-line-subtle">
              <th className="p-3">Employee</th><th className="p-3 text-right">Basic</th><th className="p-3 text-right">Gross</th><th className="p-3 text-right">Deductions</th><th className="p-3 text-right">Net pay</th><th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {slips.map((s) => (
              <tr key={s.id} className="border-b border-line-subtle">
                <td className="p-3 font-bold text-ink">{s.employee.name}{s.warnings.length > 0 && <span className="ml-2 text-amber-700" title={s.warnings.join(' ')}>⚠</span>}</td>
                <td className="p-3 text-right font-mono">{myr(s.employee.baseSalary)}</td>
                <td className="p-3 text-right font-mono">{myr(s.gross)}</td>
                <td className="p-3 text-right font-mono">{myr(s.totalDeductions)}</td>
                <td className={`p-3 text-right font-mono ${s.netPay < 0 ? 'text-rose-700 font-bold' : ''}`}>{myr(s.netPay)}</td>
                <td className="p-3 text-right space-x-3 whitespace-nowrap">
                  <button type="button" className="font-bold text-accent cursor-pointer" onClick={() => setViewing(s)}>Details</button>
                  {can.editInputs && <button type="button" className="font-bold text-accent cursor-pointer" onClick={() => setEditing(s)}>Adjust</button>}
                  {can.export && <button type="button" className="font-bold text-accent cursor-pointer" onClick={() => generatePayslipPdf(run, s).save(payslipFilename(run, s))}>PDF</button>}
                </td>
              </tr>
            ))}
            {slips.length === 0 && <tr><td className="p-4 text-subtle" colSpan={6}>No payslips in this run.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="bg-surface border border-line-subtle p-4 space-y-2">
        <h3 className="type-heading-caps text-ink">History</h3>
        {(events.data ?? []).length === 0 && <p className="text-xs text-subtle">No activity yet.</p>}
        <ul className="text-xs space-y-1">
          {(events.data ?? []).map((e) => (
            <li key={e.id}><span className="font-mono text-subtle">{new Date(e.createdAt).toLocaleString()}</span> · <b>{e.action.replace(/_/g, ' ')}</b>{e.detail ? ` · ${e.detail}` : ''}</li>
          ))}
        </ul>
      </div>

      {editing && <SlipInputs slip={editing} run={run} onClose={() => setEditing(null)} />}
      {viewing && <SlipView slip={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

function liveTotals(slips: Payslip[]) {
  const sum = (f: (s: Payslip) => number) => Math.round(slips.reduce((a, s) => a + f(s), 0) * 100) / 100;
  const gross = sum((s) => s.gross);
  const employer = sum((s) => s.employerContributions);
  return { headcount: slips.length, gross, totalDeductions: sum((s) => s.totalDeductions), netPay: sum((s) => s.netPay), employerCost: Math.round((gross + employer) * 100) / 100 };
}

function SlipView({ slip, onClose }: { slip: Payslip; onClose: () => void }) {
  return (
    <div role="dialog" aria-modal="true" aria-label={`Payslip for ${slip.employee.name}`} className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-surface border border-line w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 space-y-3">
        <h3 className="type-heading-caps text-ink">{slip.employee.name}</h3>
        <table className="w-full text-xs">
          <tbody>
            {slip.lines.map((l) => (
              <tr key={l.code} className="border-b border-line-subtle">
                <td className="py-1.5">{l.label}{l.kind === 'employer' && <span className="text-subtle"> (employer)</span>}{l.note && <div className="text-2xs text-subtle">{l.note}</div>}</td>
                <td className={`py-1.5 text-right font-mono ${l.kind === 'deduction' ? 'text-rose-700' : ''}`}>{myr(l.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-between text-sm font-bold"><span>Net pay</span><span className="font-mono">{myr(slip.netPay)}</span></div>
        {slip.warnings.length > 0 && <ul className="text-xs text-amber-900 bg-amber-50 border border-amber-300 p-3 list-disc pl-6">{slip.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>}
        <div className="flex justify-end"><Button variant="outline" size="sm" onClick={onClose}>Close</Button></div>
      </div>
    </div>
  );
}
