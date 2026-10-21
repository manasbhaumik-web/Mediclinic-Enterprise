export type AuthType = 'none' | 'bearer' | 'basic' | 'api_key_header';

/**
 * Builds the outbound auth header for a connection.
 * - bearer: secret is the token.
 * - basic: secret is "username:password".
 * - api_key_header: secret is sent in the named header.
 */
export function buildAuthHeaders(authType: AuthType, secret: string | null, headerName?: string | null): Record<string, string> {
  if (authType === 'none') return {};
  if (!secret) throw new Error('This connection requires a secret, but none is stored.');

  switch (authType) {
    case 'bearer':
      return { Authorization: `Bearer ${secret}` };
    case 'basic':
      return { Authorization: `Basic ${btoa(secret)}` };
    case 'api_key_header': {
      const name = (headerName ?? '').trim();
      // Header names are tokens; reject anything that could smuggle in extra headers.
      if (!/^[A-Za-z0-9-]{1,64}$/.test(name)) throw new Error('Invalid API key header name.');
      return { [name]: secret };
    }
    default:
      throw new Error(`Unsupported auth type: ${authType}`);
  }
}
