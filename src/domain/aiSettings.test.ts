import { describe, expect, it } from 'vitest';
import { DEFAULT_AI_SETTINGS, AISettings } from '../context/SettingsContext';

describe('AI & Generative LLM Gateway Configuration', () => {
  it('provides secure, clinical-grade defaults', () => {
    expect(DEFAULT_AI_SETTINGS.enabled).toBe(true);
    expect(DEFAULT_AI_SETTINGS.provider).toBe('gemini');
    expect(DEFAULT_AI_SETTINGS.modelName).toBe('gemini-1.5-flash');
    expect(DEFAULT_AI_SETTINGS.temperature).toBe(0.2); // low temperature for clinical deterministic precision
    expect(DEFAULT_AI_SETTINGS.features.ambientScribe).toBe(true);
    expect(DEFAULT_AI_SETTINGS.features.drugSafety).toBe(true);
    expect(DEFAULT_AI_SETTINGS.features.mewsTriage).toBe(true);
    expect(DEFAULT_AI_SETTINGS.features.claimsPreAudit).toBe(true);
    expect(DEFAULT_AI_SETTINGS.features.stockForecasting).toBe(true);
  });

  it('supports On-Premise Ollama air-gapped configuration without cloud API key', () => {
    const onPremiseConfig: AISettings = {
      ...DEFAULT_AI_SETTINGS,
      provider: 'on-premise',
      modelName: 'meditron:7b',
      endpointUrl: 'http://localhost:11434/v1',
      apiKey: '',
    };

    expect(onPremiseConfig.provider).toBe('on-premise');
    expect(onPremiseConfig.endpointUrl).toBe('http://localhost:11434/v1');
    expect(onPremiseConfig.apiKey).toBe('');
  });

  it('allows granular feature toggles for clinical compliance', () => {
    const customized: AISettings = {
      ...DEFAULT_AI_SETTINGS,
      features: {
        ...DEFAULT_AI_SETTINGS.features,
        ambientScribe: false, // clinic disables speech scribe, keeps safety & triage
      },
    };

    expect(customized.features.ambientScribe).toBe(false);
    expect(customized.features.drugSafety).toBe(true);
    expect(customized.features.mewsTriage).toBe(true);
  });
});
