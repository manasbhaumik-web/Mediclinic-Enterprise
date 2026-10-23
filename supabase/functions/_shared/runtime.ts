// Deno-side helpers shared by the integration edge functions.
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const allowedOrigins = (Deno.env.get('ALLOWED_ORIGIN') ?? '').split(',').map((o) => o.trim()).filter(Boolean);

export function corsHeadersFor(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? '';
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
  if (allowedOrigins.includes(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

export function jsonResponse(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeadersFor(req), 'Content-Type': 'application/json' },
  });
}

/** Service-role client. Bypasses RLS: only ever used after the caller has been authorised. */
export function serviceClient(): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });
}

/**
 * Resolves the calling user and their roles from the request's JWT, or null if unauthenticated.
 * A person may hold several roles; `role` is the one the privileged checks compare against: admin if they hold it,
 * else hr, else their primary role. `roles` lists everything they hold.
 */
export async function authenticate(req: Request): Promise<{ userId: string; role: string; roles: string[] } | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;
  const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) return null;
  // `roles` is missing on a database from before several roles per person; fall back to the single role then.
  let { data: profile, error: profileError } = await userClient.from('profiles').select('role, roles').eq('id', user.id).single();
  if (profileError) ({ data: profile } = await userClient.from('profiles').select('role').eq('id', user.id).single() as any);
  if (!profile) return null;
  const primary = profile.role as string;
  const roles = Array.from(new Set([primary, ...(((profile as any).roles as string[] | null) ?? [])]));
  const role = roles.includes('admin') ? 'admin' : roles.includes('hr') ? 'hr' : primary;
  return { userId: user.id, role, roles };
}

export async function recordEvent(
  db: SupabaseClient,
  e: { connectionId: string | null; direction: 'outbound' | 'inbound' | 'admin'; eventType: string; status: 'success' | 'failure' | 'blocked'; httpStatus?: number | null; detail?: string | null; actor?: string | null },
) {
  // `detail` is metadata only: callers must never pass patient data or credentials.
  await db.from('integration_events').insert({
    connection_id: e.connectionId,
    direction: e.direction,
    event_type: e.eventType,
    status: e.status,
    http_status: e.httpStatus ?? null,
    detail: e.detail ? e.detail.slice(0, 300) : null,
    actor: e.actor ?? null,
  });
}

export async function recordHealth(db: SupabaseClient, connectionId: string, ok: boolean, latencyMs: number | null, error?: string | null) {
  const { data: current } = await db.from('integration_health').select('consecutive_failures').eq('connection_id', connectionId).maybeSingle();
  const now = new Date().toISOString();
  await db.from('integration_health').upsert({
    connection_id: connectionId,
    ...(ok ? { last_success_at: now, consecutive_failures: 0, last_error: null } : {
      last_failure_at: now,
      consecutive_failures: (current?.consecutive_failures ?? 0) + 1,
      last_error: (error ?? 'Request failed').slice(0, 300),
    }),
    last_latency_ms: latencyMs,
  });
}

/** fetch with a hard timeout and no automatic redirects (a redirect could point at an internal address). */
export async function safeFetch(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, redirect: 'manual', signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
