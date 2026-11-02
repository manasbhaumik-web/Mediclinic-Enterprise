import { useColorTheme } from '../../hooks/useColorTheme';
import type { PanelId } from './types';
import type { DrugItem } from '../../context/InventoryContext';
import { CreditCard } from 'lucide-react';
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

      {/* Pharmacy stock: lowest reserves against the reorder level */}
      {showPanel('pharmacy') && (
        <section
          aria-labelledby="pharmacy-stock-title"
          className={`${showPanel('payer') ? 'lg:col-span-6' : 'lg:col-span-12'} bg-surface border border-line`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-line">
            <div>
              <h3 id="pharmacy-stock-title" className="text-base font-bold text-ink">Pharmacy stock</h3>
              <p className="text-xs text-muted mt-0.5">Lowest reserves against the reorder level</p>
            </div>
            <span className={`px-2.5 py-1 text-xs font-bold ${lowStockDrugs.length > 0 ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200' : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200'}`}>
              {lowStockDrugs.length} below reorder
            </span>
          </div>

          <ul>
            {lowestStockDrugs.map((drug, idx) => (
              <li key={idx} className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3.5 border-b border-line-subtle last:border-b-0">
                <div className="flex-[1_1_16rem] min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-ink">{drug.name}</span>
                    <span className={`px-2 py-0.5 text-xs font-bold ${drug.isLow ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200' : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200'}`}>
                      {drug.isLow ? 'Low reserve' : 'Adequate'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted tabular-nums">
                    Stock {drug.stock} · Reorder at {drug.reorderAt} · Dispensed today {drug.dispensed}
                  </p>
                </div>
                <div className="flex-[1_1_10rem] min-w-0">
                  <ProgressBar value={drug.percentage} tone={drug.isLow ? 'warning' : 'primary'} label={`${drug.name} stock`} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
