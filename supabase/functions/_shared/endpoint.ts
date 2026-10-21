/**
 * Validation for admin-supplied integration endpoints.
 *
 * The edge functions call these URLs from inside Supabase's network, so an unchecked URL would let an
 * admin (or anyone who compromises an admin account) probe internal services or cloud metadata
 * endpoints (server-side request forgery). Pure TypeScript with no Deno globals, so it is shared by the
 * functions, the admin form and the unit tests.
 *
 * Limitation: this checks the literal host. It does not resolve DNS, so a public name that resolves to a
 * private address is not caught here; keep egress restrictions at the network layer too.
 */

export interface EndpointCheck {
  ok: boolean;
  reason?: string;
  /** Normalised URL without a trailing slash when ok. */
  url?: string;
}

const BLOCKED_SUFFIXES = ['.localhost', '.local', '.internal', '.intranet', '.lan', '.home', '.corp'];

function isPrivateIPv4(host: string): boolean {
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  return (
    a === 0 || a === 10 || a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||   // carrier-grade NAT
    (a === 169 && b === 254) ||              // link-local, incl. cloud metadata 169.254.169.254
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224                                  // multicast and reserved
  );
}

export function validateEndpoint(raw: string | null | undefined): EndpointCheck {
  const value = (raw ?? '').trim();
  if (!value) return { ok: false, reason: 'Endpoint URL is required.' };

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { ok: false, reason: 'Endpoint is not a valid URL.' };
  }

  if (url.protocol !== 'https:') return { ok: false, reason: 'Endpoint must use https.' };
  if (url.username || url.password) return { ok: false, reason: 'Do not put credentials in the URL; use the secret field.' };

  const host = url.hostname.toLowerCase();
  if (host.startsWith('[')) return { ok: false, reason: 'IPv6 literal addresses are not allowed; use a hostname.' };
  if (host === 'localhost' || BLOCKED_SUFFIXES.some((s) => host.endsWith(s))) {
    return { ok: false, reason: 'Internal and local hostnames are not allowed.' };
  }
  if (/^[\d.]+$/.test(host)) {
    if (isPrivateIPv4(host)) return { ok: false, reason: 'Private and reserved IP addresses are not allowed.' };
  } else if (!host.includes('.')) {
    return { ok: false, reason: 'Hostname must be a fully qualified domain name.' };
  }

  url.hash = '';
  return { ok: true, url: url.toString().replace(/\/+$/, '') };
}
