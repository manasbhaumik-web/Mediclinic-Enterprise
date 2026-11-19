import { describe, it, expect } from 'vitest';
import { buildWhatsAppPayload, classifyResponse, providerConfigured, retryDelayMinutes } from './messaging';

describe('buildWhatsAppPayload', () => {
  it('builds a template message with the parameters in order', () => {
    const p = buildWhatsAppPayload({ id: '1', to_phone: '60123456789', template: 'appointment_reminder', params: ['Siti', '19 Nov 2026', '10:30 AM'], language: 'en' }) as any;
    expect(p).toMatchObject({ messaging_product: 'whatsapp', to: '60123456789', type: 'template' });
    expect(p.template.name).toBe('appointment_reminder');
    expect(p.template.language.code).toBe('en');
    expect(p.template.components[0].parameters.map((x: any) => x.text)).toEqual(['Siti', '19 Nov 2026', '10:30 AM']);
  });

  it('sends no components for a template without parameters, and caps long text', () => {
    expect((buildWhatsAppPayload({ id: '1', to_phone: '6012', template: 't', params: [], language: '' }) as any).template.components).toEqual([]);
    const long = buildWhatsAppPayload({ id: '1', to_phone: '6012', template: 't', params: ['x'.repeat(500)], language: 'ms' }) as any;
    expect(long.template.components[0].parameters[0].text).toHaveLength(200);
    expect(long.template.language.code).toBe('ms');
  });
});

describe('classifyResponse', () => {
  it('reads the message id on success', () => {
    expect(classifyResponse(200, { messages: [{ id: 'wamid.ABC' }] })).toEqual({ ok: true, providerId: 'wamid.ABC' });
  });

  it('does not call a success with no id a success', () => {
    expect(classifyResponse(200, {})).toMatchObject({ ok: false, retry: false });
  });

  it('retries a rate limit, a provider outage and a bad token', () => {
    expect(classifyResponse(429, { error: { message: 'slow down' } })).toMatchObject({ ok: false, retry: true });
    expect(classifyResponse(503, {})).toMatchObject({ ok: false, retry: true });
    expect(classifyResponse(401, { error: { code: 190, message: 'token expired' } })).toMatchObject({ ok: false, retry: true });
  });

  it('does not retry a message the provider says is wrong', () => {
    const r = classifyResponse(400, { error: { code: 132001, message: 'Template does not exist' } });
    expect(r).toMatchObject({ ok: false, retry: false });
    expect((r as any).error).toContain('132001');
  });

  it('keeps the error short and free of the request body', () => {
    const r = classifyResponse(400, { error: { message: 'x'.repeat(1000) } });
    expect((r as any).error.length).toBeLessThan(260);
  });
});

describe('provider setup and retries', () => {
  it('needs both keys', () => {
    expect(providerConfigured({ WHATSAPP_PHONE_NUMBER_ID: '123', WHATSAPP_ACCESS_TOKEN: 'tok' })).toBe(true);
    expect(providerConfigured({ WHATSAPP_PHONE_NUMBER_ID: '123' })).toBe(false);
    expect(providerConfigured({ WHATSAPP_PHONE_NUMBER_ID: ' ', WHATSAPP_ACCESS_TOKEN: 'tok' })).toBe(false);
    expect(providerConfigured({})).toBe(false);
  });

  it('backs off 2, 8, 18, 32 minutes and caps at an hour', () => {
    expect([1, 2, 3, 4].map(retryDelayMinutes)).toEqual([2, 8, 18, 32]);
    expect(retryDelayMinutes(10)).toBe(60);
  });
});
