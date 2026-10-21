// Staff onboarding with system access (RBAC), admin and HR only.
//
//   create        add a staff record; if a system role is chosen, also create the login and email an invitation
//   grant_access  give an existing staff record a login with a role (sends the invitation)
//   resend_invite replace a pending invitation with a fresh one
//   send_reset    email a password-reset link to someone who has already signed in
//   change_role   change the access role of an existing login
//   revoke/restore  block or re-enable sign-in (the staff record is kept)
//   access_status   invited / active / revoked for every staff record with a login
//
// New users receive an invitation link and choose their own password: no password is ever generated, emailed
// or visible to the person who created the account.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { authenticate, corsHeadersFor, jsonResponse, recordEvent, serviceClient } from '../_shared/runtime.ts';
import {
  AccessState, SystemRole, canGrant, canManageAccessOf, isSystemRole, validateStaffInput,
} from '../_shared/staffAccess.ts';

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

  /** Create the login, email the invitation and link it to the staff record with the chosen role. */
  async function grantAccess(staff: { id: string; name: string; email: string }, role: SystemRole): Promise<{ ok: boolean; message?: string }> {
    const { data, error } = await db.auth.admin.inviteUserByEmail(staff.email, {
      data: { full_name: staff.name },
      redirectTo: redirectUrl(),
    });
    if (error || !data?.user) {
      const exists = /already|registered|exists/i.test(error?.message ?? '');
      return { ok: false, message: exists ? 'A login with this email already exists.' : `Could not send the invitation: ${error?.message ?? 'unknown error'}` };
    }
    const userId = data.user.id;
    const { error: profileError } = await db.from('profiles').insert({ id: userId, full_name: staff.name, role });
    if (profileError) {
      await db.auth.admin.deleteUser(userId);
      return { ok: false, message: 'Could not assign the access role.' };
    }
    const { error: linkError } = await db.from('staff').update({ auth_id: userId, system_role: role, invited_at: new Date().toISOString() }).eq('id', staff.id);
    if (linkError) {
      await db.auth.admin.deleteUser(userId);
      return { ok: false, message: 'Could not link the login to the staff record.' };
    }
    await audit('staff.access_granted', `staff ${staff.id} granted ${role}`);
    return { ok: true };
  }

  async function loadStaff(id: string) {
    const { data } = await db.from('staff').select('id, name, email, auth_id, system_role').eq('id', id).maybeSingle();
    return data as { id: string; name: string; email: string; auth_id: string | null; system_role: SystemRole | null } | null;
  }

  async function adminCount(): Promise<number> {
    const { count } = await db.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin');
    return count ?? 0;
  }

  // ---------- create ----------
  if (action === 'create') {
    const s = body.staff ?? {};
    const input = { name: clean(s.name), email: clean(s.email, 200).toLowerCase(), role: clean(s.role), department: clean(s.department), salaryBase: Number(s.salaryBase ?? 0) };
    const problems = validateStaffInput(input);
    if (problems.length) return fail(problems.join('. ') + '.');

    const systemRole = body.systemRole ? String(body.systemRole) : null;
    if (systemRole !== null) {
      if (!isSystemRole(systemRole)) return fail('Unknown access role.');
      if (!canGrant(caller.role, systemRole)) return fail('You are not allowed to grant that access role.', 403);
    }

    const { data: row, error } = await db.from('staff').insert({
      name: input.name, email: input.email, role: input.role, department: input.department || null,
      status: ['Active', 'Inactive', 'Suspended', 'On Leave'].includes(s.status) ? s.status : 'Active',
      gender: clean(s.gender, 10) || null, dob: clean(s.dob, 10) || null, ic_number: clean(s.icNumber, 20) || null,
      phone: clean(s.phone, 30) || null, salary_base: Number.isFinite(input.salaryBase) ? input.salaryBase : 0,
    }).select('id, name, email').single();
    if (error || !row) {
      return fail(/duplicate|unique/i.test(error?.message ?? '') ? 'A staff member with this email already exists.' : 'Could not save the staff record.');
    }
    await audit('staff.created', `staff ${row.id}`);

    if (!systemRole) return jsonResponse(req, { ok: true, staffId: row.id, invited: false, message: 'Staff record saved. No system access was granted.' });

    const granted = await grantAccess(row, systemRole);
    if (!granted.ok) {
      await audit('staff.access_failed', `staff ${row.id}: ${granted.message}`, 'failure');
      return jsonResponse(req, { ok: true, staffId: row.id, invited: false, warning: `Staff record saved, but access was not granted. ${granted.message} You can retry from the staff list.` });
    }
    return jsonResponse(req, { ok: true, staffId: row.id, invited: true, message: `Staff record saved. An invitation was emailed to ${row.email}.` });
  }

  // ---------- access status for the directory ----------
  if (action === 'access_status') {
    const { data: staff } = await db.from('staff').select('id, auth_id, system_role').not('auth_id', 'is', null);
    const { data: list } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const users = new Map((list?.users ?? []).map((u) => [u.id, u]));
    const result: Record<string, { state: AccessState; role: SystemRole | null }> = {};
    for (const s of staff ?? []) {
      const u = users.get(s.auth_id);
      let state: AccessState = 'invited';
      if (!u) state = 'none';
      else if (u.banned_until && new Date(u.banned_until) > new Date()) state = 'revoked';
      else if (u.last_sign_in_at) state = 'active';
      result[s.id] = { state, role: s.system_role };
    }
    return jsonResponse(req, { ok: true, access: result });
  }

  // ---------- actions on an existing staff record ----------
  const staff = await loadStaff(String(body.staffId ?? ''));
  if (!staff) return fail('Staff record not found.', 404);
  const isSelf = staff.auth_id === caller.userId;

  if (action === 'grant_access') {
    if (staff.auth_id) return fail('This person already has a login.');
    const role = String(body.systemRole ?? '');
    if (!isSystemRole(role)) return fail('Unknown access role.');
    if (!canGrant(caller.role, role)) return fail('You are not allowed to grant that access role.', 403);
    const granted = await grantAccess(staff, role);
    return jsonResponse(req, granted.ok ? { ok: true, message: `Invitation emailed to ${staff.email}.` } : { ok: false, message: granted.message });
  }

  if (!staff.auth_id) return fail('This person has no login yet. Grant access first.');
  if (!canManageAccessOf(caller.role, staff.system_role)) return fail('You are not allowed to manage this account.', 403);

  if (action === 'resend_invite') {
    const { data: u } = await db.auth.admin.getUserById(staff.auth_id);
    if (u?.user?.last_sign_in_at) return fail('This person has already signed in. Use "Send password reset" instead.');
    const role = staff.system_role;
    if (!role) return fail('This person has no access role recorded.');
    // Unlink first (staff.auth_id references the login), then remove the pending login and its profile.
    await db.from('staff').update({ auth_id: null, system_role: null, invited_at: null }).eq('id', staff.id);
    await db.auth.admin.deleteUser(staff.auth_id);
    const granted = await grantAccess(staff, role);
    return jsonResponse(req, granted.ok ? { ok: true, message: `A new invitation was emailed to ${staff.email}.` } : { ok: false, message: granted.message });
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
    const role = String(body.systemRole ?? '');
    if (!isSystemRole(role)) return fail('Unknown access role.');
    if (!canGrant(caller.role, role)) return fail('You are not allowed to grant that access role.', 403);
    if (staff.system_role === 'admin' && role !== 'admin' && (await adminCount()) <= 1) return fail('That is the last administrator; the system must keep at least one.');
    const { error } = await db.from('profiles').update({ role }).eq('id', staff.auth_id);
    if (error) return fail('Could not change the access role.');
    await db.from('staff').update({ system_role: role }).eq('id', staff.id);
    await audit('staff.role_changed', `staff ${staff.id} ${staff.system_role} -> ${role}`);
    return jsonResponse(req, { ok: true, message: 'Access role updated. It applies the next time they sign in.' });
  }

  if (action === 'revoke') {
    if (staff.system_role === 'admin' && (await adminCount()) <= 1) return fail('That is the last administrator; the system must keep at least one.');
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
