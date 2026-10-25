/**
 * AI-Assisted Pharmacy Inventory & Stock Runway Forecaster.
 * Projects stock depletion rates and computes economic reorder quantities
 * based on clinical consumption velocity.
 */

export interface StockForecastInput {
  id: string;
  name: string;
  currentStock: number;
  reorderLevel: number;
  packageSize?: number;
  dailyBurnRate?: number; // average units dispensed per day
}

export interface StockForecastResult {
  runwayDays: number;
  status: 'critical' | 'reorder' | 'adequate';
  badgeTone: 'bad' | 'warn' | 'ok';
  suggestedReorderQty: number;
  summary: string;
  urgencyPrompt: string;
}

export function forecastStockDepletion(input: StockForecastInput): StockForecastResult {
  const stock = Math.max(0, Number(input.currentStock) || 0);
  const reorderPoint = Math.max(1, Number(input.reorderLevel) || 10);
  const burn = Math.max(0.5, Number(input.dailyBurnRate) || Math.max(1, Math.round(reorderPoint / 10)));
  const pack = Math.max(1, Number(input.packageSize) || 1);

  if (stock === 0) {
    const rawSuggested = reorderPoint * 3;
    const roundedQty = Math.ceil(rawSuggested / pack) * pack;
    return {
      runwayDays: 0,
      status: 'critical',
      badgeTone: 'bad',
      suggestedReorderQty: roundedQty,
      summary: 'Out of stock (0 days runway). Immediate supplier PO required.',
      urgencyPrompt: 'Stock exhausted. Emergency replenishment recommended.',
    };
  }

  const runwayDays = Math.floor(stock / burn);

  let status: 'critical' | 'reorder' | 'adequate' = 'adequate';
  let badgeTone: 'bad' | 'warn' | 'ok' = 'ok';
  let urgencyPrompt = 'Stock levels adequate for current outpatient volume.';

  if (runwayDays <= 5 || stock <= reorderPoint * 0.5) {
    status = 'critical';
    badgeTone = 'bad';
    urgencyPrompt = `Critical: Only ~${runwayDays} days of medication remaining before stockout.`;
  } else if (runwayDays <= 14 || stock <= reorderPoint) {
    status = 'reorder';
    badgeTone = 'warn';
    urgencyPrompt = `Reorder Recommended: Stock runway is ~${runwayDays} days.`;
  }

  // 30-day buffer supply + safety threshold
  const targetBuffer = Math.max(reorderPoint * 2, Math.ceil(burn * 30));
  const deficit = Math.max(0, targetBuffer - stock);
  const suggestedReorderQty = Math.max(reorderPoint, Math.ceil(deficit / pack) * pack);

  const summary = `Runway: ~${runwayDays} days (${stock} units left @ ~${burn.toFixed(1)}/day).`;

  return {
    runwayDays,
    status,
    badgeTone,
    suggestedReorderQty,
    summary,
    urgencyPrompt,
  };
}
