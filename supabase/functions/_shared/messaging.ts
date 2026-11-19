// Pure helpers for the WhatsApp reminder worker: no imports, so the worker and the tests share them.
// Messages carry no clinical detail. They are approved WhatsApp templates filled with a first name and a date or time.

export interface ClaimedMessage {
  id: string;
  to_phone: string;
  template: string;
  params: string[];
  language: string;
}

export type SendOutcome =
  | { ok: true; providerId: string }
  | { ok: false; retry: boolean; error: string };

/** WhatsApp Cloud API payload for one template message. */
export function buildWhatsAppPayload(m: ClaimedMessage): Record<string, unknown> {
  return {
    messaging_product: 'whatsapp',
    to: m.to_phone,
    type: 'template',
    template: {
      name: m.template,
      language: { code: m.language || 'en' },
      components: m.params.length === 0 ? [] : [{ type: 'body', parameters: m.params.map((text) => ({ type: 'text', text: String(text).slice(0, 200) })) }],
    },
  };
}

/**
 * Reads the provider's answer. A temporary problem (rate limit, provider outage) is retried; anything the provider
 * says is wrong with the message itself (bad number, template not approved) is not.
 */
export function classifyResponse(status: number, body: any): SendOutcome {
  if (status >= 200 && status < 300) {
    const id = body?.messages?.[0]?.id;
    return id ? { ok: true, providerId: String(id) } : { ok: false, retry: false, error: 'The provider accepted the request but returned no message id.' };
  }
  const code = body?.error?.code;
  const detail = String(body?.error?.message ?? 'The provider rejected the message.').slice(0, 200);
  const temporary = status === 429 || status >= 500 || code === 4 || code === 80007 || code === 130429;
  // Auth problems affect every message, so they are retried once the keys are fixed rather than failing each one.
  const authProblem = status === 401 || code === 190;
  return { ok: false, retry: temporary || authProblem, error: `${status}${code ? ` (code ${code})` : ''}: ${detail}` };
}

/** Whether the worker has what it needs to call the provider. */
export function providerConfigured(env: { WHATSAPP_PHONE_NUMBER_ID?: string; WHATSAPP_ACCESS_TOKEN?: string }): boolean {
  return !!env.WHATSAPP_PHONE_NUMBER_ID?.trim() && !!env.WHATSAPP_ACCESS_TOKEN?.trim();
}

/** Minutes to wait before the next try, matching the database's schedule (attempts squared times two, at most an hour). */
export const retryDelayMinutes = (attempts: number): number => Math.min(60, attempts * attempts * 2);
