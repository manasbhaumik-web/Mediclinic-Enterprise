import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./SettingsContext.tsx', import.meta.url), 'utf8');

describe('SettingsContext loads the settings after sign-in', () => {
  it('reads clinic_settings, which only a signed-in person may read', () => {
    expect(source).toContain("from('clinic_settings').select('*')");
  });
  it('fetches again when a session starts, not only once at app load', () => {
    expect(source).toContain('onAuthStateChange');
    expect(source).toMatch(/SIGNED_IN/);
    expect(source).toMatch(/INITIAL_SESSION/);
  });
  it('stops listening when the provider unmounts', () => {
    expect(source).toContain('authSub.subscription.unsubscribe()');
  });
});

const aiCard = readFileSync(new URL('../features/admin/AIGatewayCard.tsx', import.meta.url), 'utf8');

describe('the AI gateway settings say only what is true', () => {
  it('never keeps an API key in browser storage', () => {
    expect(source).toContain("apiKey: ''");
    expect(source).not.toMatch(/localStorage\.setItem\('mediclinic_ai_settings', JSON\.stringify\(newSettings\.aiConfig\)\)/);
  });
  it('does not invent a connection test result', () => {
    expect(aiCard).not.toContain('Math.random');
    expect(aiCard).not.toMatch(/Connected to .* successfully/);
  });
  it('does not claim the key is encrypted', () => {
    expect(aiCard).not.toMatch(/Encrypted locally/);
  });
});

const hardwareCard = readFileSync(new URL('../features/admin/HardwarePeripheralsCard.tsx', import.meta.url), 'utf8');

describe('the hardware settings say only what is true', () => {
  it('does not report a reply from a device that was never contacted', () => {
    expect(hardwareCard).not.toMatch(/Ping ACK received/);
    expect(hardwareCard).not.toMatch(/ok: true/);
  });
  it('does not call a switched-on device online', () => {
    expect(hardwareCard).not.toMatch(/'Online'/);
  });
});

const cmsCard = readFileSync(new URL('../features/admin/WebsiteCMSCard.tsx', import.meta.url), 'utf8');

describe('the website settings say only what is true', () => {
  it('does not claim to publish content that is saved in one browser', () => {
    expect(cmsCard).not.toContain('Publish Website Changes');
    expect(cmsCard).not.toMatch(/successfully published/);
    expect(cmsCard).toContain('Saved in this browser only');
  });
});
