// Payroll runs: draft -> reviewed -> approved -> paid (or cancelled), with a permanent record.
// Only this function writes runs, payslips and events (service role); the database also freezes approved,
// paid and cancelled runs, so nothing here can rewrite history.
//
// Who may do what:
//   admin or hr : create_run, recalc_run, save_inputs, submit_review, return_to_draft, cancel (draft/reviewed)
//   admin only  : approve, mark_paid, cancel (approved)
// Maker-checker: when more than one administrator exists, the approver must not be the person who reviewed.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { authenticate, corsHeadersFor, jsonResponse, serviceClient } from '../_shared/runtime.ts';
import {
  Citizenship, EmployeeForPay, PayInputs, PayLineInput, RateRow, calculatePayslip, runBlockers, summariseRun, validateInputs,
} from '../_shared/payrollCalc.ts';

const MONTH = /^(\d{4})-(0[1-9]|1[0-2])$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeadersFor(req) });
  if (req.method !== 'POST') return jsonResponse(req, { error: 'Method not allowed' }, 405);

  const caller = await authenticate(req);
  if (!caller) return jsonResponse(req, { error: 'Unauthorized' }, 401);
  if (caller.role !== 'admin' && caller.role !== 'hr') return jsonResponse(req, { error: 'Forbidden' }, 403);
  const isAdmin = caller.role === 'admin';

  let body: Record<string, any>;
  try { body = await req.json(); } catch { return jsonResponse(req, { error: 'Invalid JSON' }, 400); }
  const action = String(body.action ?? '');
  const db = serviceClient();
  const fail = (message: string, status = 200) => jsonResponse(req, { ok: false, message }, status);
  const ok = (message: string, extra: Record<string, unknown> = {}) => jsonResponse(req, { ok: true, message, ...extra });
  const event = (runId: string, act: string, detail?: string) =>
    db.from('payroll_events').insert({ run_id: runId, action: act, actor: caller.userId, detail: detail ?? null });

  // ---------- data loading ----------
  async function loadRates(): Promise<RateRow[]> {
    const { data } = await db.from('payroll_rates').select('*');
    return (data ?? []).map((r: any) => ({
      id: r.id, scheme: r.scheme, label: r.label, effectiveFrom: String(r.effective_from).slice(0, 10), priority: r.priority,
      eligibility: r.eligibility ?? {}, config: r.config, active: r.active, verified: r.verified,
    }));
  }

  const staffSelect = 'id, name, email, role, department, status, salary_base, dob, ic_number, citizenship, epf_number, socso_number, tax_ref, bank_name, bank_account_holder, bank_account_number';

  async function loadRecurring(staffIds: string[]) {
    const map = new Map<string, { allowances: PayLineInput[]; deductions: PayLineInput[] }>();
    if (staffIds.length === 0) return map;
    const { data } = await db.from('staff_pay_items').select('staff_id, kind, label, amount, contributory').eq('active', true).in('staff_id', staffIds);
    for (const i of data ?? []) {
      const entry = map.get(i.staff_id) ?? { allowances: [], deductions: [] };
      const line = { label: i.label, amount: Number(i.amount), contributory: i.contributory };
      (i.kind === 'allowance' ? entry.allowances : entry.deductions).push(line);
      map.set(i.staff_id, entry);
    }
    return map;
  }

  const employeeSnapshot = (s: any) => ({
    name: s.name, email: s.email, jobTitle: s.role, department: s.department, icNumber: s.ic_number, dob: s.dob,
    citizenship: (s.citizenship ?? 'citizen') as Citizenship, baseSalary: Number(s.salary_base) || 0,
    epfNumber: s.epf_number, socsoNumber: s.socso_number, taxRef: s.tax_ref,
    bank: { name: s.bank_name, holder: s.bank_account_holder, number: s.bank_account_number },
  });

  const forPay = (staffId: string, snap: ReturnType<typeof employeeSnapshot>): EmployeeForPay =>
    ({ id: staffId, name: snap.name, baseSalary: snap.baseSalary, dob: snap.dob, citizenship: snap.citizenship });

  const noRecurring = { allowances: [] as PayLineInput[], deductions: [] as PayLineInput[] };

  async function loadRun(id: string) {
    const { data } = await db.from('payroll_runs').select('*').eq('id', id).maybeSingle();
    return data as any | null;
  }

  async function adminCount(): Promise<number> {
    const { count } = await db.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin');
    return count ?? 0;
  }

  /** Refresh the run's totals and the snapshot of the rate rows it relied on. */
  async function refreshRunSummary(runId: string, rates: RateRow[]) {
    const { data: slips } = await db.from('payslips').select('gross, total_deductions, net_pay, employer_contributions, lines, warnings').eq('run_id', runId);
    const totals = summariseRun((slips ?? []).map((s: any) => ({
      gross: Number(s.gross), totalDeductions: Number(s.total_deductions), netPay: Number(s.net_pay),
      employerContributions: Number(s.employer_contributions), lines: s.lines,
    })));
    // While a draft, keep every rate as it was at calculation time; approval narrows this to the rows actually used.
    await db.from('payroll_runs').update({ totals, rate_snapshot: rates }).eq('id', runId);
    return totals;
  }

  // ---------- create_run ----------
  if (action === 'create_run') {
    const month = String(body.month ?? '');
    const m = month.match(MONTH);
    if (!m) return fail('Month must look like 2026-10.');
    const workingDays = Number(body.workingDays ?? 26);
    const hoursPerDay = Number(body.hoursPerDay ?? 8);
    if (!Number.isInteger(workingDays) || workingDays < 1 || workingDays > 31) return fail('Working days must be a whole number from 1 to 31.');
    if (!(hoursPerDay > 0 && hoursPerDay <= 24)) return fail('Hours per day must be between 0 and 24.');

    const { data: staff } = await db.from('staff').select(staffSelect).eq('status', 'Active').order('name');
    if (!staff || staff.length === 0) return fail('There are no Active staff to pay.');

    const { data: run, error } = await db.from('payroll_runs').insert({
      period_month: `${m[1]}-${m[2]}-01`, working_days: workingDays, hours_per_day: hoursPerDay,
      notes: typeof body.notes === 'string' ? body.notes.slice(0, 500) : null, created_by: caller.userId,
    }).select('id').single();
    if (error || !run) return fail(/unique|duplicate/i.test(error?.message ?? '') ? `A payroll run for ${month} already exists.` : 'Could not create the payroll run.');

    const rates = await loadRates();
    const recurring = await loadRecurring(staff.map((s: any) => s.id));
    const runParams = { periodStart: `${m[1]}-${m[2]}-01`, workingDays, hoursPerDay };

    const rows = staff.map((s: any) => {
      const snap = employeeSnapshot(s);
      const res = calculatePayslip(forPay(s.id, snap), runParams, {}, recurring.get(s.id) ?? noRecurring, rates);
      return { run_id: run.id, staff_id: s.id, employee: snap, inputs: {}, lines: res.lines, gross: res.gross, total_deductions: res.totalDeductions, net_pay: res.netPay, employer_contributions: res.employerContributions, warnings: res.warnings };
    });
    const { error: insertError } = await db.from('payslips').insert(rows);
    if (insertError) return fail('Could not create the payslips.');

    await refreshRunSummary(run.id, rates);
    await event(run.id, 'created', `${month}, ${rows.length} payslips`);
    return ok(`Payroll run for ${month} created with ${rows.length} payslips.`, { runId: run.id });
  }

  // ---------- everything else needs a run or payslip ----------
  let runId = String(body.runId ?? '');
  let slipForInputs: any = null;
  if (action === 'save_inputs') {
    const { data } = await db.from('payslips').select('*').eq('id', String(body.payslipId ?? '')).maybeSingle();
    slipForInputs = data;
    if (!slipForInputs) return fail('Payslip not found.', 404);
    runId = slipForInputs.run_id;
  }
  const run = await loadRun(runId);
  if (!run) return fail('Payroll run not found.', 404);
  const period = String(run.period_month).slice(0, 10);
  const runParams = { periodStart: period, workingDays: run.working_days, hoursPerDay: Number(run.hours_per_day) };

  const editable = run.status === 'draft';
  const needDraft = () => (editable ? null : fail(`The run is ${run.status}; only a draft can be changed.`));

  // ---------- save_inputs ----------
  if (action === 'save_inputs') {
    const blocked = needDraft(); if (blocked) return blocked;
    const inputs = (body.inputs ?? {}) as PayInputs;
    const problems = validateInputs(inputs, run.working_days);
    if (problems.length) return fail(problems.join('. ') + '.');
    const rates = await loadRates();
    const recurring = await loadRecurring(slipForInputs.staff_id ? [slipForInputs.staff_id] : []);
    const res = calculatePayslip(forPay(slipForInputs.staff_id, slipForInputs.employee), runParams, inputs, recurring.get(slipForInputs.staff_id) ?? noRecurring, rates);
    const { error } = await db.from('payslips').update({
      inputs, lines: res.lines, gross: res.gross, total_deductions: res.totalDeductions, net_pay: res.netPay,
      employer_contributions: res.employerContributions, warnings: res.warnings,
    }).eq('id', slipForInputs.id);
    if (error) return fail('Could not save the payslip.');
    await refreshRunSummary(runId, rates);
    await event(runId, 'inputs_saved', `payslip ${slipForInputs.id}`);
    return ok('Payslip updated.', { netPay: res.netPay });
  }

  // ---------- recalc_run ----------
  if (action === 'recalc_run') {
    const blocked = needDraft(); if (blocked) return blocked;
    const rates = await loadRates();
    const { data: slips } = await db.from('payslips').select('*').eq('run_id', runId);
    const { data: staff } = await db.from('staff').select(staffSelect).eq('status', 'Active');
    const activeIds = new Set((staff ?? []).map((s: any) => s.id));
    const staffById = new Map((staff ?? []).map((s: any) => [s.id, s]));
    const recurring = await loadRecurring((staff ?? []).map((s: any) => s.id));
    let updated = 0, added = 0, removed = 0;

    for (const slip of slips ?? []) {
      if (!slip.staff_id || !activeIds.has(slip.staff_id)) {
        await db.from('payslips').delete().eq('id', slip.id); removed++; continue;
      }
      const snap = employeeSnapshot(staffById.get(slip.staff_id));   // pick up salary, bank and ID changes
      const res = calculatePayslip(forPay(slip.staff_id, snap), runParams, slip.inputs ?? {}, recurring.get(slip.staff_id) ?? noRecurring, rates);
      await db.from('payslips').update({ employee: snap, lines: res.lines, gross: res.gross, total_deductions: res.totalDeductions, net_pay: res.netPay, employer_contributions: res.employerContributions, warnings: res.warnings }).eq('id', slip.id);
      updated++;
    }
    const have = new Set((slips ?? []).map((s: any) => s.staff_id));
    for (const s of staff ?? []) {
      if (have.has(s.id)) continue;
      const snap = employeeSnapshot(s);
      const res = calculatePayslip(forPay(s.id, snap), runParams, {}, recurring.get(s.id) ?? noRecurring, rates);
      await db.from('payslips').insert({ run_id: runId, staff_id: s.id, employee: snap, inputs: {}, lines: res.lines, gross: res.gross, total_deductions: res.totalDeductions, net_pay: res.netPay, employer_contributions: res.employerContributions, warnings: res.warnings });
      added++;
    }
    await refreshRunSummary(runId, rates);
    await event(runId, 'recalculated', `updated ${updated}, added ${added}, removed ${removed}`);
    return ok(`Recalculated ${updated} payslip${updated === 1 ? '' : 's'}${added ? `, added ${added}` : ''}${removed ? `, removed ${removed} (no longer active)` : ''}.`);
  }

  // ---------- submit_review / return_to_draft ----------
  if (action === 'submit_review') {
    if (run.status !== 'draft') return fail(`The run is ${run.status}, not a draft.`);
    const { count } = await db.from('payslips').select('id', { count: 'exact', head: true }).eq('run_id', runId);
    if (!count) return fail('The run has no payslips.');
    const { error } = await db.from('payroll_runs').update({ status: 'reviewed', reviewed_by: caller.userId, reviewed_at: new Date().toISOString() }).eq('id', runId);
    if (error) return fail('Could not submit the run for approval.');
    await event(runId, 'submitted_for_approval');
    return ok('Submitted for approval. An administrator can now approve it.');
  }

  if (action === 'return_to_draft') {
    if (run.status !== 'reviewed') return fail('Only a run waiting for approval can be returned to draft.');
    const { error } = await db.from('payroll_runs').update({ status: 'draft', reviewed_by: null, reviewed_at: null }).eq('id', runId);
    if (error) return fail('Could not return the run to draft.');
    await event(runId, 'returned_to_draft', typeof body.reason === 'string' ? body.reason.slice(0, 300) : undefined);
    return ok('Returned to draft.');
  }

  // ---------- approve ----------
  if (action === 'approve') {
    if (!isAdmin) return fail('Only an administrator can approve payroll.', 403);
    if (run.status !== 'reviewed') return fail('Only a run that was submitted for approval can be approved.');
    if (run.reviewed_by === caller.userId && (await adminCount()) > 1) return fail('A different administrator must approve a run you submitted.');

    const rates = await loadRates();
    const { data: slips } = await db.from('payslips').select('*').eq('run_id', runId);
    const recurring = await loadRecurring((slips ?? []).map((s: any) => s.staff_id).filter(Boolean));

    // The figures must still be what today's rates and pay items produce: if not, the run is stale.
    const used: string[] = [];
    const stale: string[] = [];
    for (const slip of slips ?? []) {
      const res = calculatePayslip(forPay(slip.staff_id, slip.employee), runParams, slip.inputs ?? {}, recurring.get(slip.staff_id) ?? noRecurring, rates);
      used.push(...res.usedRates);
      if (res.netPay !== Number(slip.net_pay) || res.gross !== Number(slip.gross) || res.employerContributions !== Number(slip.employer_contributions)) stale.push(slip.employee?.name ?? slip.id);
    }
    const blockers = runBlockers(rates, used, (slips ?? []).map((s: any) => ({ employee: s.employee, warnings: s.warnings, netPay: Number(s.net_pay) })));
    if (stale.length) blockers.unshift(`Rates or pay items changed since this run was calculated (${stale.slice(0, 3).join(', ')}${stale.length > 3 ? ', …' : ''}). Return it to draft and recalculate.`);
    if (blockers.length) return fail(blockers.join(' '));

    const totals = summariseRun((slips ?? []).map((s: any) => ({ gross: Number(s.gross), totalDeductions: Number(s.total_deductions), netPay: Number(s.net_pay), employerContributions: Number(s.employer_contributions), lines: s.lines })));
    const usedRows = rates.filter((r) => used.includes(r.id));
    const { error } = await db.from('payroll_runs').update({ status: 'approved', approved_by: caller.userId, approved_at: new Date().toISOString(), totals, rate_snapshot: usedRows }).eq('id', runId);
    if (error) return fail('Could not approve the run.');
    await event(runId, 'approved', `net ${totals.netPay}, employer cost ${totals.employerCost}`);
    return ok('Payroll approved. It is now frozen: the payslips and exports are final.');
  }

  // ---------- mark_paid ----------
  if (action === 'mark_paid') {
    if (!isAdmin) return fail('Only an administrator can mark payroll as paid.', 403);
    if (run.status !== 'approved') return fail('Only an approved run can be marked paid.');
    const paidOn = String(body.paidOn ?? '');
    if (!DATE.test(paidOn) || Number.isNaN(Date.parse(paidOn))) return fail('Enter the date the salaries were paid.');
    if (paidOn > new Date(Date.now() + 24 * 3600_000).toISOString().slice(0, 10)) return fail('The payment date cannot be in the future.');
    const { error } = await db.from('payroll_runs').update({ status: 'paid', paid_by: caller.userId, paid_at: new Date().toISOString(), paid_on: paidOn }).eq('id', runId);
    if (error) return fail('Could not mark the run as paid.');
    await event(runId, 'paid', paidOn);
    return ok(`Marked as paid on ${paidOn}.`);
  }

  // ---------- cancel ----------
  if (action === 'cancel') {
    const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 300) : '';
    if (!reason) return fail('A reason is required to cancel a payroll run.');
    if (run.status === 'paid') return fail('A paid run cannot be cancelled.');
    if (run.status === 'cancelled') return fail('The run is already cancelled.');
    if (run.status === 'approved' && !isAdmin) return fail('Only an administrator can cancel an approved run.', 403);
    const { error } = await db.from('payroll_runs').update({ status: 'cancelled', cancelled_by: caller.userId, cancelled_at: new Date().toISOString(), cancel_reason: reason }).eq('id', runId);
    if (error) return fail('Could not cancel the run.');
    await event(runId, 'cancelled', reason);
    return ok('Payroll run cancelled. It stays on record.');
  }

  return fail('Unknown action.', 400);
});
