// Staff onboarding with system access (RBAC), admin and HR only.
//
//   create        add a staff record; if roles are chosen, also grant access (login) and then notify
//   grant_access  give an existing staff record a login with roles, then notify
//   resend_invite email the access notification again (to someone who has not signed in yet)
//   send_reset    email a password-reset link to someone who has already signed in
//   change_role   change the access role(s) of an existing login (a person may hold several)
//   revoke/restore  block or re-enable sign-in (the staff record is kept)
//   access_status   invited / active / revoked for every staff record with a login
//
// Access is granted straight away: the login is created and linked with no invitation email. A notification
// (a link to choose their own password) is then emailed as a separate, best-effort step. If that email cannot be
// sent the access still stands, and the result says so, so it can be re-sent from the staff list. No password is ever
// generated, emailed or visible to the person who gave the access.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { authenticate, corsHeadersFor, jsonResponse, recordEvent, serviceClient } from '../_shared/runtime.ts';
import {
  AccessState, SystemRole, canGrantAll, canManageAccessOf, normalizeRoleSet, validateStaffInput,
} from '../_shared/staffAccess.ts';
import { duplicateMessage, duplicateMessageFromDbError, findStaffDuplicate } from '../_shared/staffIdentity.ts';

const BAN_FOREVER = '876000h'; // about 100 years

function redirectUrl(): string | undefined {
  const site = Deno.env.get('SITE_URL') || (Deno.env.get('ALLOWED_ORIGIN') ?? '').split(',')[0]?.trim();
  return site ? `${site.replace(/\/+$/, '')}/set-password` : undefined;
}

const clean = (v: unknown, max = 120) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeadersFor(req) });
  if (req.method !== 'POST') return jsonResponse(req, { error: 'Method not allowed' }, 405);

  const caller = await authenticate(req);
  if (!caller) return jsonResponse(req, { error: 'Unauthorized' }, 401);
  if (caller.role !== 'admin' && caller.role !== 'hr') return jsonResponse(req, { error: 'Forbidden' }, 403);

  let body: Record<string, any>;
  try { body = await req.json(); } catch { return jsonResponse(req, { error: 'Invalid JSON' }, 400); }
  const action = String(body.action ?? '');
  const db = serviceClient();
  const fail = (message: string, status = 200) => jsonResponse(req, { ok: false, message }, status);
  const audit = (eventType: string, detail: string, status: 'success' | 'failure' = 'success') =>
    recordEvent(db, { connectionId: null, direction: 'admin', eventType, status, detail, actor: caller.userId });

  /** The roles a request asks for: `roles` (first = primary) or the older single `systemRole`. */
  const requestedRoles = (): SystemRole[] => {
    const set = normalizeRoleSet(Array.isArray(body.roles) ? body.roles : body.systemRole ? [body.systemRole] : []);
    return set;
  };

  /**
   * Tell the person their access is ready, with a link to choose their own password. Best effort: it reports
   * whether it worked and never changes the access that was already given.
   */
  async function notifyAccess(email: string): Promise<{ ok: boolean; message?: string }> {
    try {
      const anon = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { auth: { persistSession: false } });
      const { error } = await anon.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl() });
      return error ? { ok: false, message: error.message } : { ok: true };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : 'The email service did not respond.' };
    }
  }

  /** Create the login (no email is sent here) and link it to the staff record with the chosen roles. */
  async function grantAccess(staff: { id: string; name: string; email: string }, roles: SystemRole[]): Promise<{ ok: boolean; message?: string; notified?: boolean; notifyError?: string }> {
    const { data, error } = await db.auth.admin.createUser({
      email: staff.email,
      email_confirm: true,
      user_metadata: { full_name: staff.name },
    });
    if (error || !data?.user) {
      const exists = /already|registered|exists/i.test(error?.message ?? '');
      return { ok: false, message: exists ? 'A login with this email already exists.' : `Could not create the login: ${error?.message ?? 'unknown error'}` };
    }
    const userId = data.user.id;
    const role = roles[0];
    const { error: profileError } = await db.from('profiles').insert({ id: userId, full_name: staff.name, role, roles });
    if (profileError) {
      await db.auth.admin.deleteUser(userId);
      return { ok: false, message: 'Could not assign the access role.' };
    }
    const { error: linkError } = await db.from('staff').update({ auth_id: userId, system_role: role, system_roles: roles, invited_at: new Date().toISOString() }).eq('id', staff.id);
    if (linkError) {
      await db.auth.admin.deleteUser(userId);
      return { ok: false, message: 'Could not link the login to the staff record.' };
    }
    await audit('staff.access_granted', `staff ${staff.id} granted ${roles.join(', ')}`);

    // Access is now given. The notification is a separate step whose outcome is reported, not required.
    const notice = await notifyAccess(staff.email);
    await audit(notice.ok ? 'staff.access_notified' : 'staff.notify_failed', `staff ${staff.id}${notice.ok ? '' : `: ${notice.message}`}`, notice.ok ? 'success' : 'failure');
    return { ok: true, notified: notice.ok, notifyError: notice.message };
  }

  async function loadStaff(id: string) {
    const { data } = await db.from('staff').select('id, name, email, auth_id, system_role, system_roles').eq('id', id).maybeSingle();
    const row = data as { id: string; name: string; email: string; auth_id: string | null; system_role: SystemRole | null; system_roles: SystemRole[] | null } | null;
    return row && { ...row, roles: normalizeRoleSet(row.system_roles ?? (row.system_role ? [row.system_role] : [])) };
  }

  async function adminCount(): Promise<number> {
    const { count } = await db.from('profiles').select('id', { count: 'exact', head: true }).contains('roles', ['admin']);
    return count ?? 0;
  }

  // ---------- create ----------
  if (action === 'create') {
    const s = body.staff ?? {};
    const input = { name: clean(s.name), email: clean(s.email, 200).toLowerCase(), role: clean(s.role), department: clean(s.department), salaryBase: Number(s.salaryBase ?? 0) };
    const problems = validateStaffInput(input);
    if (problems.length) return fail(problems.join('. ') + '.');

    const roles = requestedRoles();
    const asked = Array.isArray(body.roles) ? body.roles.length : body.systemRole ? 1 : 0;
    if (asked > 0 && roles.length !== asked) return fail('Unknown access role.');
    if (roles.length > 0 && !canGrantAll(caller.role, roles)) return fail('You are not allowed to grant that access role.', 403);

    // No duplicate records: the same email or ID number is refused; the same name and date of birth needs confirmation.
    const { data: all } = await db.from('staff').select('id, name, email, ic_number, dob');
    const duplicate = findStaffDuplicate(
      { name: input.name, email: input.email, icNumber: clean(s.icNumber, 20), dob: clean(s.dob, 10) },
      (all ?? []).map((r) => ({ id: r.id, name: r.name, email: r.email, icNumber: r.ic_number, dob: r.dob })),
    );
    if (duplicate?.blocking) return fail(duplicateMessage(duplicate));
    if (duplicate && body.allowPossibleDuplicate !== true) {
      return jsonResponse(req, { ok: false, possibleDuplicate: true, message: duplicateMessage(duplicate) });
    }

    const { data: row, error } = await db.from('staff').insert({
      name: input.name, email: input.email, role: input.role, department: input.department || null,
      status: ['Active', 'Inactive', 'Suspended', 'On Leave'].includes(s.status) ? s.status : 'Active',
      gender: clean(s.gender, 10) || null, dob: clean(s.dob, 10) || null, ic_number: clean(s.icNumber, 20) || null,
      phone: clean(s.phone, 30) || null, salary_base: Number.isFinite(input.salaryBase) ? input.salaryBase : 0,
    }).select('id, name, email').single();
    if (error || !row) {
      return fail(duplicateMessageFromDbError(error?.message) ?? 'Could not save the staff record.');
    }
    await audit('staff.created', `staff ${row.id}`);

    if (roles.length === 0) return jsonResponse(req, { ok: true, staffId: row.id, invited: false, message: 'Staff record saved. No system access was granted.' });

    const granted = await grantAccess(row, roles);
    if (!granted.ok) {
      await audit('staff.access_failed', `staff ${row.id}: ${granted.message}`, 'failure');
      return jsonResponse(req, { ok: true, staffId: row.id, accessGranted: false, notified: false, invited: false, warning: `Staff record saved, but access was not granted. ${granted.message} You can retry from the staff list.` });
    }
    return jsonResponse(req, granted.notified
      ? { ok: true, staffId: row.id, accessGranted: true, notified: true, invited: true, message: `Staff record saved and access granted. A notification was emailed to ${row.email}.` }
      : { ok: true, staffId: row.id, accessGranted: true, notified: false, invited: true, warning: `Staff record saved and access granted, but the notification email could not be sent (${granted.notifyError ?? 'unknown reason'}). Use "Resend notification" in the staff list.` });
  }

  // ---------- access status for the directory ----------
  if (action === 'access_status') {
    const { data: staff } = await db.from('staff').select('id, auth_id, system_role, system_roles').not('auth_id', 'is', null);
    const { data: list } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const users = new Map((list?.users ?? []).map((u) => [u.id, u]));
    const result: Record<string, { state: AccessState; role: SystemRole | null; roles: SystemRole[] }> = {};
    for (const s of staff ?? []) {
      const u = users.get(s.auth_id);
      let state: AccessState = 'invited';
      if (!u) state = 'none';
      else if (u.banned_until && new Date(u.banned_until) > new Date()) state = 'revoked';
      else if (u.last_sign_in_at) state = 'active';
      result[s.id] = { state, role: s.system_role, roles: normalizeRoleSet(s.system_roles ?? (s.system_role ? [s.system_role] : [])) };
    }
    return jsonResponse(req, { ok: true, access: result });
  }

  // ---------- actions on an existing staff record ----------
  const staff = await loadStaff(String(body.staffId ?? ''));
  if (!staff) return fail('Staff record not found.', 404);
  const isSelf = staff.auth_id === caller.userId;

  if (action === 'grant_access') {
    if (staff.auth_id) return fail('This person already has a login.');
    const roles = requestedRoles();
    if (roles.length === 0) return fail('Unknown access role.');
    if (!canGrantAll(caller.role, roles)) return fail('You are not allowed to grant that access role.', 403);
    const granted = await grantAccess(staff, roles);
    if (!granted.ok) return jsonResponse(req, { ok: false, message: granted.message });
    return jsonResponse(req, granted.notified
      ? { ok: true, accessGranted: true, notified: true, message: `Access granted. A notification was emailed to ${staff.email}.` }
      : { ok: true, accessGranted: true, notified: false, warning: `Access granted, but the notification email could not be sent (${granted.notifyError ?? 'unknown reason'}). Use "Resend notification" in the staff list.` });
  }

  if (!staff.auth_id) return fail('This person has no login yet. Grant access first.');
  if (!canManageAccessOf(caller.role, staff.roles)) return fail('You are not allowed to manage this account.', 403);

  if (action === 'resend_invite') {
    const { data: u } = await db.auth.admin.getUserById(staff.auth_id);
    if (u?.user?.last_sign_in_at) return fail('This person has already signed in. Use "Send password reset" instead.');
    const notice = await notifyAccess(staff.email);
    await audit(notice.ok ? 'staff.access_notified' : 'staff.notify_failed', `staff ${staff.id}${notice.ok ? '' : `: ${notice.message}`}`, notice.ok ? 'success' : 'failure');
    return jsonResponse(req, notice.ok
      ? { ok: true, notified: true, message: `Notification emailed to ${staff.email}.` }
      : { ok: false, notified: false, message: `The notification email could not be sent (${notice.message ?? 'unknown reason'}). Their access is unchanged; try again later.` });
  }

  if (action === 'send_reset') {
    const anon = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { auth: { persistSession: false } });
    const { error } = await anon.auth.resetPasswordForEmail(staff.email, { redirectTo: redirectUrl() });
    if (error) return fail(`Could not send the reset email: ${error.message}`);
    await audit('staff.reset_sent', `staff ${staff.id}`);
    return jsonResponse(req, { ok: true, message: `Password reset email sent to ${staff.email}.` });
  }

  // Everything below changes live access: never on your own account, and never remove the last admin.
  if (isSelf) return fail('You cannot change your own access.');

  if (action === 'change_role') {
    const roles = requestedRoles();
    if (roles.length === 0) return fail('Unknown access role.');
    if (!canGrantAll(caller.role, roles)) return fail('You are not allowed to grant that access role.', 403);
    if (staff.roles.includes('admin') && !roles.includes('admin') && (await adminCount()) <= 1) return fail('That is the last administrator; the system must keep at least one.');
    const { error } = await db.from('profiles').update({ role: roles[0], roles }).eq('id', staff.auth_id);
    if (error) return fail('Could not change the access roles.');
    await db.from('staff').update({ system_role: roles[0], system_roles: roles }).eq('id', staff.id);
    await audit('staff.role_changed', `staff ${staff.id} ${staff.roles.join('+')} -> ${roles.join('+')}`);
    return jsonResponse(req, { ok: true, message: 'Access updated. It applies the next time they sign in.' });
  }

  if (action === 'revoke') {
    if (staff.roles.includes('admin') && (await adminCount()) <= 1) return fail('That is the last administrator; the system must keep at least one.');
    const { error } = await db.auth.admin.updateUserById(staff.auth_id, { ban_duration: BAN_FOREVER });
    if (error) return fail('Could not revoke access.');
    await audit('staff.access_revoked', `staff ${staff.id}`);
    return jsonResponse(req, { ok: true, message: 'Access revoked. They can no longer sign in.' });
  }

  if (action === 'restore') {
    const { error } = await db.auth.admin.updateUserById(staff.auth_id, { ban_duration: 'none' });
    if (error) return fail('Could not restore access.');
    await audit('staff.access_restored', `staff ${staff.id}`);
    return jsonResponse(req, { ok: true, message: 'Access restored.' });
  }

  return fail('Unknown action.', 400);
});
