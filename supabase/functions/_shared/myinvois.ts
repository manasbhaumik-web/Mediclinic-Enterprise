/**
 * Minimal MyInvois (LHDN) API client: token, submit, status, cancel.
 *
 * The base URLs are fixed constants, never admin-supplied, so this cannot be pointed at an internal address.
 * `fetchFn` is injectable for tests. Written from LHDN's public API description and NOT yet exercised against
 * the pre-production environment; treat response parsing as provisional until it has been.
 *
 * Pure TypeScript with no Deno globals (uses the standard Web Crypto and fetch APIs).
 */

export type Environment = 'sandbox' | 'production';

export const BASE_URLS: Record<Environment, string> = {
  sandbox: 'https://preprod-api.myinvois.hasil.gov.my',
  production: 'https://api.myinvois.hasil.gov.my',
};

/** Public portal used to build the validation link / QR for a validated document. */
export const PORTAL_URLS: Record<Environment, string> = {
  sandbox: 'https://preprod.myinvois.hasil.gov.my',
  production: 'https://myinvois.hasil.gov.my',
};

type FetchFn = typeof fetch;

export class MyInvoisError extends Error {
  constructor(message: string, public httpStatus: number | null, public retryable: boolean) {
    super(message);
  }
}

const retryable = (status: number) => status === 408 || status === 429 || status >= 500;

async function call(fetchFn: FetchFn, url: string, init: RequestInit, timeoutMs = 20_000): Promise<{ status: number; body: any }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // Redirects are not followed: LHDN endpoints do not redirect, and a redirect could leave the fixed host.
    const res = await fetchFn(url, { ...init, redirect: 'manual', signal: controller.signal });
    let body: any = null;
    const raw = await res.text();
    if (raw) { try { body = JSON.parse(raw); } catch { body = { raw: raw.slice(0, 300) }; } }
    return { status: res.status, body };
  } catch (e) {
    const aborted = e instanceof Error && e.name === 'AbortError';
    throw new MyInvoisError(aborted ? 'Timed out calling MyInvois' : 'Could not reach MyInvois', null, true);
  } finally {
    clearTimeout(timer);
  }
}

export async function getToken(
  env: Environment, clientId: string, clientSecret: string, onBehalfOfTin?: string, fetchFn: FetchFn = fetch,
): Promise<string> {
  const form = new URLSearchParams({ client_id: clientId, client_secret: clientSecret, grant_type: 'client_credentials', scope: 'InvoicingAPI' });
  const headers: Record<string, string> = { 'Content-Type': 'application/x-www-form-urlencoded' };
  if (onBehalfOfTin) headers['onbehalfof'] = onBehalfOfTin;
  const { status, body } = await call(fetchFn, `${BASE_URLS[env]}/connect/token`, { method: 'POST', headers, body: form.toString() });
  if (status !== 200 || !body?.access_token) {
    throw new MyInvoisError(
      status === 400 || status === 401 ? 'MyInvois rejected the client credentials' : `Token request failed (HTTP ${status})`,
      status, retryable(status),
    );
  }
  return body.access_token as string;
}

export async function sha256Hex(data: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function toBase64(data: string): string {
  const bytes = new TextEncoder().encode(data);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

export interface SubmitResult {
  submissionUid: string | null;
  accepted: { uuid: string; invoiceCodeNumber: string } | null;
  rejected: { invoiceCodeNumber: string; message: string; details: string[] } | null;
  documentHash: string;
}

/** Submit one document. LHDN accepts a batch; we send one at a time so each outcome maps cleanly to a row. */
export async function submitDocument(
  env: Environment, token: string, document: unknown, codeNumber: string, onBehalfOfTin?: string, fetchFn: FetchFn = fetch,
): Promise<SubmitResult> {
  const json = JSON.stringify(document);
  const documentHash = await sha256Hex(json);
  const headers: Record<string, string> = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  if (onBehalfOfTin) headers['onbehalfof'] = onBehalfOfTin;

  const { status, body } = await call(fetchFn, `${BASE_URLS[env]}/api/v1.0/documentsubmissions`, {
    method: 'POST', headers,
    body: JSON.stringify({ documents: [{ format: 'JSON', document: toBase64(json), documentHash, codeNumber }] }),
  });

  if (status === 202 || status === 200) {
    const accepted = body?.acceptedDocuments?.[0];
    const rejected = body?.rejectedDocuments?.[0];
    return {
      submissionUid: body?.submissionUid ?? null,
      accepted: accepted ? { uuid: accepted.uuid, invoiceCodeNumber: accepted.invoiceCodeNumber } : null,
      rejected: rejected ? {
        invoiceCodeNumber: rejected.invoiceCodeNumber,
        message: rejected.error?.message ?? 'Rejected by MyInvois',
        details: (rejected.error?.details ?? []).map((d: any) => `${d.target ?? ''} ${d.message ?? ''}`.trim()).slice(0, 20),
      } : null,
      documentHash,
    };
  }
  throw new MyInvoisError(body?.error?.message ?? `Submission failed (HTTP ${status})`, status, retryable(status));
}

export type LhdnStatus = 'Submitted' | 'Valid' | 'Invalid' | 'Cancelled' | string;

export interface DocumentDetails { status: LhdnStatus; longId: string | null; errors: string[] }

export async function getDocumentDetails(
  env: Environment, token: string, uuid: string, onBehalfOfTin?: string, fetchFn: FetchFn = fetch,
): Promise<DocumentDetails> {
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (onBehalfOfTin) headers['onbehalfof'] = onBehalfOfTin;
  const { status, body } = await call(fetchFn, `${BASE_URLS[env]}/api/v1.0/documents/${encodeURIComponent(uuid)}/details`, { method: 'GET', headers });
  if (status !== 200) throw new MyInvoisError(`Status lookup failed (HTTP ${status})`, status, retryable(status));
  const steps = body?.validationResults?.validationSteps ?? [];
  const errors = steps
    .filter((s: any) => s.status === 'Invalid')
    .map((s: any) => `${s.name ?? 'Validation'}: ${s.error?.error ?? s.error?.errorCode ?? 'failed'}`)
    .slice(0, 20);
  return { status: body?.status ?? 'Submitted', longId: body?.longId ?? null, errors };
}


export async function cancelDocument(
  env: Environment, token: string, uuid: string, reason: string, onBehalfOfTin?: string, fetchFn: FetchFn = fetch,
): Promise<void> {
  const headers: Record<string, string> = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  if (onBehalfOfTin) headers['onbehalfof'] = onBehalfOfTin;
  const { status, body } = await call(fetchFn, `${BASE_URLS[env]}/api/v1.0/documents/state/${encodeURIComponent(uuid)}/state`, {
    method: 'PUT', headers, body: JSON.stringify({ status: 'cancelled', reason: reason.slice(0, 300) }),
  });
  if (status !== 200) throw new MyInvoisError(body?.error?.message ?? `Cancellation failed (HTTP ${status})`, status, retryable(status));
}

/** Link a buyer can use to view the validated e-invoice (and the target of the QR code). */
export function validationUrl(env: Environment, uuid: string, longId: string): string {
  return `${PORTAL_URLS[env]}/${uuid}/share/${longId}`;
}

/** Map MyInvois document status to our invoice status. */
export function mapLhdnStatus(s: LhdnStatus): 'submitted' | 'valid' | 'invalid' | 'cancelled' {
  switch (s) {
    case 'Valid': return 'valid';
    case 'Invalid': return 'invalid';
    case 'Cancelled': return 'cancelled';
    default: return 'submitted';
  }
}
