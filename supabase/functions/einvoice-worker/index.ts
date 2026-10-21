// Scheduled e-Invoice run: submits ready invoices (per-invoice mode) and refreshes the status of submitted ones.
// Call it every few minutes with the header `x-worker-secret: $INTEGRATIONS_WORKER_SECRET` (same secret as the
// integrations worker). Consolidated monthly submission is deliberately manual: an admin triggers it.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { serviceClient } from '../_shared/runtime.ts';
import { loadContext, processPending, refreshSubmitted } from '../_shared/einvoiceService.ts';

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

serve(async (req) => {
  const expected = Deno.env.get('INTEGRATIONS_WORKER_SECRET') ?? '';
  const provided = req.headers.get('x-worker-secret') ?? '';
  if (!expected || !timingSafeEqual(provided, expected)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const db = serviceClient();
  const { ctx, error } = await loadContext(db, { requireEnabled: true });
  if (!ctx) return new Response(JSON.stringify({ skipped: error }), { headers: { 'Content-Type': 'application/json' } });

  const submitted = await processPending(db, ctx);
  const refreshed = await refreshSubmitted(db, ctx);
  return new Response(JSON.stringify({ submitted, refreshed }), { headers: { 'Content-Type': 'application/json' } });
});
