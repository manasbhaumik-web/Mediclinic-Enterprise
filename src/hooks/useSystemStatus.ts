import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  DbFacts, EDGE_FUNCTIONS, FunctionState, ProbeResult, classifyProbe, resolveProbes, summarizeLatency, LatencySummary,
} from '../domain/systemStatus';

const TIMEOUT_MS = 8000;
const API_SAMPLES = 3;

export interface FunctionCheck { slug: string; label: string; scheduled: boolean; state: FunctionState; httpStatus?: number }

export interface StatusSnapshot {
  /** When the checks last finished (ms since epoch). */
  ranAt: number | null;
  api: { latency: LatencySummary | null; error?: string } | null;
  session: { signedIn: boolean; expiresAtSec: number | null } | null;
  realtime: { state: 'connected' | 'failed' | 'timeout'; ms?: number } | null;
  functions: FunctionCheck[] | null;
  db: { facts?: DbFacts; error?: string } | null;
}

const EMPTY: StatusSnapshot = { ranAt: null, api: null, session: null, realtime: null, functions: null, db: null };

const backendUrl = (): string => String(import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/+$/, '');

async function checkApi(): Promise<NonNullable<StatusSnapshot['api']>> {
  const samples: number[] = [];
  for (let i = 0; i < API_SAMPLES; i++) {
    const t0 = performance.now();
    const { error } = await supabase.from('clinic_settings').select('id').limit(1);
    if (error) return { latency: summarizeLatency(samples), error: error.message };
    samples.push(performance.now() - t0);
  }
  return { latency: summarizeLatency(samples) };
}

async function checkSession(): Promise<NonNullable<StatusSnapshot['session']>> {
  const { data } = await supabase.auth.getSession();
  return { signedIn: !!data.session, expiresAtSec: data.session?.expires_at ?? null };
}

/** Opens a throwaway realtime channel and reports whether the connection is accepted. */
function checkRealtime(): Promise<NonNullable<StatusSnapshot['realtime']>> {
  return new Promise((resolve) => {
    const t0 = performance.now();
    const channel = supabase.channel(`status-check-${Math.random().toString(36).slice(2)}`);
    let done = false;
    const finish = (state: 'connected' | 'failed' | 'timeout') => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      void supabase.removeChannel(channel);
      resolve({ state, ms: state === 'connected' ? Math.round(performance.now() - t0) : undefined });
    };
    const timer = setTimeout(() => finish('timeout'), TIMEOUT_MS);
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') finish('connected');
      else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') finish('failed');
    });
  });
}

/**
 * Asks the platform about each function with a plain GET and no credentials. Nothing is executed: a deployed function
 * refuses the request (401) and a missing one is reported as not found.
 */
async function checkFunctions(): Promise<FunctionCheck[]> {
  const base = backendUrl();
  const probes = await Promise.all(EDGE_FUNCTIONS.map(async (fn) => {
    const probe: ProbeResult = {};
    if (!base) return { fn, probe: { failed: true } as ProbeResult };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(`${base}/functions/v1/${fn.slug}`, { method: 'GET', signal: controller.signal });
      probe.status = res.status;
      probe.body = (await res.text().catch(() => '')).slice(0, 200);
    } catch {
      probe.failed = true;
    } finally {
      clearTimeout(timer);
    }
    return { fn, probe };
  }));
  const states = resolveProbes(probes.map((p) => classifyProbe(p.probe)));
  return probes.map((p, i) => ({ slug: p.fn.slug, label: p.fn.label, scheduled: p.fn.scheduled, state: states[i], httpStatus: p.probe.status }));
}

async function checkDatabase(): Promise<NonNullable<StatusSnapshot['db']>> {
  const { data, error } = await supabase.rpc('system_status');
  if (error) return { error: error.message };
  return { facts: data as DbFacts };
}

/** Runs the checks on mount and whenever `run` is called. Every value comes from a real request. */
export function useSystemStatus() {
  const [snapshot, setSnapshot] = useState<StatusSnapshot>(EMPTY);
  const [running, setRunning] = useState(false);
  const alive = useRef(true);
  // Set on every mount (React's dev mode mounts, unmounts and remounts) so results are only dropped after a real unmount.
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const run = useCallback(async () => {
    setRunning(true);
    const patch = <K extends keyof StatusSnapshot>(key: K) => (value: StatusSnapshot[K]) => {
      if (alive.current) setSnapshot((s) => ({ ...s, [key]: value }));
    };
    await Promise.all([
      checkApi().then(patch('api'), (e) => patch('api')({ latency: null, error: String(e?.message ?? e) })),
      checkSession().then(patch('session'), () => patch('session')({ signedIn: false, expiresAtSec: null })),
      checkRealtime().then(patch('realtime')),
      checkFunctions().then(patch('functions'), () => patch('functions')(null)),
      checkDatabase().then(patch('db'), (e) => patch('db')({ error: String(e?.message ?? e) })),
    ]);
    if (alive.current) {
      setSnapshot((s) => ({ ...s, ranAt: Date.now() }));
      setRunning(false);
    }
  }, []);

  useEffect(() => { void run(); }, [run]);

  return { snapshot, running, run };
}

/** Facts about this build and how it is configured. Shown as booleans or public values only; no keys. */
export function buildInfo() {
  const url = backendUrl();
  let host = '';
  try { host = url ? new URL(url).host : ''; } catch { host = ''; }
  return {
    version: __APP_VERSION__,
    builtAt: __BUILD_TIME__,
    commit: __APP_COMMIT__,
    mode: import.meta.env.MODE as string,
    backendHost: host,
    backendConfigured: !!url,
    cardPaymentsKeySet: !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
    demoDataOn: import.meta.env.VITE_USE_MOCK_DATA === 'true',
  };
}
