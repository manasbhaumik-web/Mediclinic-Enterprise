import { useColorTheme } from '../../hooks/useColorTheme';
import type { PanelId } from './types';
import type { DrugItem } from '../../context/InventoryContext';
import { CreditCard, Pill } from 'lucide-react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts';
import { chartTheme } from '../../theme/chartTheme';
import { palette } from '../../theme/palette';
import ProgressBar from '../../components/ui/ProgressBar';

interface PayerAndPharmacyChartsProps {
  showPanel: (id: PanelId) => boolean;
  payerMixData: { provider: string; amount: number; }[];
  payerSummary: string;
  lowStockDrugs: DrugItem[];
  lowestStockDrugs: { name: string; stock: number; reorderAt: number; dispensed: number; percentage: number; isLow: boolean; }[];
}

export default function PayerAndPharmacyCharts({
  showPanel,
  payerMixData,
  payerSummary,
  lowStockDrugs,
  lowestStockDrugs,
}: PayerAndPharmacyChartsProps) {
  useColorTheme(); // re-render when the colour theme changes so palette colours refresh

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
      {/* Payer Mix Bar Chart (6 Cols) */}
      {showPanel('payer') && (
        <div
          className={`${
            showPanel('pharmacy') ? 'lg:col-span-6' : 'lg:col-span-12'
          } bg-surface border border-line rounded-none p-3.5 shadow-none`}
        >
          <div className="pb-2 border-b border-line mb-2.5 flex items-center justify-between">
            <div>
              <h3 className="type-card-title text-ink flex items-center gap-2">
                <CreditCard className="w-4.5 h-4.5 text-sky-600" />
                Payer & TPA Panel Settlement Mix
              </h3>
              <p className="text-xs text-muted mt-0.5">Revenue split across Corporate Panels, e-GL, and Self-Pay.</p>
            </div>
            <span className="text-2xs text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-1 rounded-none font-mono font-bold uppercase tracking-wider border border-sky-300 dark:border-sky-800">
              MYR Currency
            </span>
          </div>

          {payerMixData.length === 0 ? (
            <p className="h-56 flex items-center justify-center text-sm text-muted font-mono">No completed payments yet today.</p>
          ) : (
            <div className="h-56 w-full" role="img" aria-label={payerSummary}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={payerMixData} layout="vertical" margin={{ top: 0, right: 20, left: 30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartTheme.grid} />
                  <XAxis type="number" tick={chartTheme.tick} />
                  <YAxis dataKey="provider" type="category" tick={chartTheme.tick} width={120} />
                  <Tooltip contentStyle={chartTheme.tooltip} />
                  <Bar dataKey="amount" name="Total Claims (RM)" fill={palette.brand} radius={[0, 0, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {payerMixData.length > 0 && (
            <div className="sr-only">
            <table>
              <caption>Revenue by payer today, in Malaysian ringgit</caption>
              <thead>
                <tr>
                  <th scope="col">Payer</th>
                  <th scope="col">Amount (RM)</th>
                </tr>
              </thead>
              <tbody>
                {payerMixData.map((d) => (
                  <tr key={d.provider}>
                    <th scope="row">{d.provider}</th>
                    <td>{d.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}

      {/* Fast-Moving Medications Progress Meters (6 Cols) */}
      {showPanel('pharmacy') && (
        <div
          className={`${
            showPanel('payer') ? 'lg:col-span-6' : 'lg:col-span-12'
          } bg-surface border border-line rounded-none p-3.5 shadow-none`}
        >
          <div className="pb-2 border-b border-line mb-2.5 flex items-center justify-between">
            <div>
              <h3 className="type-card-title text-ink flex items-center gap-2">
                <Pill className="w-4.5 h-4.5 text-amber-600" />
                Pharmacy Stock & Critical Inventory
              </h3>
              <p className="text-xs text-muted mt-0.5">Lowest stock reserves against reorder threshold.</p>
            </div>
            <span
              className={`text-2xs px-2.5 py-1 rounded-none font-mono font-bold uppercase tracking-wider border ${
                lowStockDrugs.length > 0
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800'
              }`}
            >
              {lowStockDrugs.length} below reorder
            </span>
          </div>

          <div className="space-y-2">
            {lowestStockDrugs.map((drug, idx) => (
              <div key={idx} className="space-y-1.5 p-2 bg-surface-muted/30 border border-line-subtle rounded-none">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-ink flex items-center gap-2">
                    <span>{drug.name}</span>
                    {drug.isLow ? (
                      <span className="text-2xs bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded-none font-mono font-bold border border-amber-300 dark:border-amber-800">
                        Low reserve
                      </span>
                    ) : (
                      <span className="text-2xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 px-1.5 py-0.5 rounded-none font-mono font-bold border border-emerald-300 dark:border-emerald-800">
                        Adequate
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-muted text-xs tabular-nums">
                    Stock: <strong className="text-accent font-bold">{drug.stock}</strong> · Reorder at {drug.reorderAt} · Dispensed: {drug.dispensed}
                  </span>
                </div>
                <ProgressBar value={drug.percentage} tone={drug.isLow ? 'warning' : 'primary'} label={`${drug.name} stock`} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
