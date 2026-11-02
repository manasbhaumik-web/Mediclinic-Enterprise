import { describe, it, expect } from 'vitest';
import { forecastStockDepletion } from './predictiveStock';

describe('AI Predictive Pharmacy Stock Forecaster', () => {
  it('correctly calculates 0 days runway for out-of-stock items', () => {
    const item = {
      id: 'D001',
      name: 'Amoxicillin 500mg',
      currentStock: 0,
      reorderLevel: 50,
      packageSize: 10,
    };

    const forecast = forecastStockDepletion(item);
    expect(forecast.runwayDays).toBe(0);
    expect(forecast.status).toBe('critical');
    expect(forecast.badgeTone).toBe('bad');
    expect(forecast.suggestedReorderQty).toBeGreaterThanOrEqual(50);
  });

  it('flags reorder status when runway is below 14 days', () => {
    const item = {
      id: 'D002',
      name: 'Paracetamol 500mg',
      currentStock: 35,
      reorderLevel: 50,
      dailyBurnRate: 5,
    };

    const forecast = forecastStockDepletion(item);
    expect(forecast.runwayDays).toBe(7);
    expect(forecast.status).toBe('reorder');
    expect(forecast.badgeTone).toBe('warn');
  });

  it('marks stock as adequate when runway exceeds 14 days', () => {
    const item = {
      id: 'D003',
      name: 'Omeprazole 20mg',
      currentStock: 200,
      reorderLevel: 30,
      dailyBurnRate: 4,
    };

    const forecast = forecastStockDepletion(item);
    expect(forecast.runwayDays).toBe(50);
    expect(forecast.status).toBe('adequate');
    expect(forecast.badgeTone).toBe('ok');
  });
});
