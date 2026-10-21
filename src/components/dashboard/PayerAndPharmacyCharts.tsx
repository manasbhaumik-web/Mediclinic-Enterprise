import type { PanelId } from './types';
import type { DrugItem } from '../../context/InventoryContext';
import { CreditCard, Pill } from 'lucide-react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts';
import { chartTheme } from '../../theme/chartTheme';
import { palette } from '../../theme/palette';
import ProgressBar from '../ui/ProgressBar';

interface PayerAndPharmacyChartsProps {
  showPanel: (id: PanelId) => boolean;
  payerMixData: { provider: string; amount: number; }[];
  payerSummary: string;
  lowStockDrugs: DrugItem[];
  lowestStockDrugs: { name: string; stock: number; reorderAt: number; dispensed: number; percentage: number; isLow: boolean; }[];
}

export default function PayerAndPharmacyCharts({ showPanel, payerMixData, payerSummary, lowStockDrugs, lowestStockDrugs }: PayerAndPharmacyChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      
      {/* Payer Mix Bar Chart (6 Cols) */}
      {showPanel('payer') && (
        <div className={`${showPanel('pharmacy') ? 'lg:col-span-6' : 'lg:col-span-12'} bg-surface-muted border border-line-subtle rounded-none p-6 shadow-xs`}>
          <div className="pb-4 border-b border-line-subtle mb-5 flex items-center justify-between">
            <div>
              <h3 className="type-card-title text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-sky-600" />
                Payer & TPA Panel Settlement Mix
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">Revenue split across Corporate Panels and Self-Pay.</p>
            </div>
            <span className="text-2xs text-sky-600 bg-sky-50 px-2.5 py-1 rounded-none font-mono font-bold uppercase tracking-wider border border-sky-200">
              MYR Currency
            </span>
          </div>
    
          {payerMixData.length === 0 ? (
            <p className="h-56 flex items-center justify-center text-sm text-slate-600">No completed payments yet today.</p>
          ) : (
          <div className="h-56 w-full" role="img" aria-label={payerSummary}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={payerMixData} layout="vertical" margin={{ top: 0, right: 20, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartTheme.grid} />
                <XAxis type="number" tick={chartTheme.tick} />
                <YAxis dataKey="provider" type="category" tick={chartTheme.tick} width={120} />
                <Tooltip 
                  contentStyle={chartTheme.tooltip}
                />
                <Bar dataKey="amount" name="Total Claims (RM)" fill={palette.brand} radius={[0, 0, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          )}
          {payerMixData.length > 0 && (
            <table className="sr-only">
              <caption>Revenue by payer today, in Malaysian ringgit</caption>
              <thead><tr><th scope="col">Payer</th><th scope="col">Amount (RM)</th></tr></thead>
              <tbody>
                {payerMixData.map((d) => (<tr key={d.provider}><th scope="row">{d.provider}</th><td>{d.amount.toFixed(2)}</td></tr>))}
              </tbody>
            </table>
          )}
        </div>
      )}
    
      {/* Fast-Moving Medications Progress Meters (6 Cols) */}
      {showPanel('pharmacy') && (
        <div className={`${showPanel('payer') ? 'lg:col-span-6' : 'lg:col-span-12'} bg-surface-muted border border-line-subtle rounded-none p-6 shadow-xs`}>
          <div className="pb-4 border-b border-line-subtle mb-5 flex items-center justify-between">
            <div>
              <h3 className="type-card-title text-slate-900 flex items-center gap-2">
                <Pill className="w-5 h-5 text-amber-600" />
                Pharmacy stock overview
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">Lowest stock against reorder level.</p>
            </div>
            <span className="text-2xs bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-none font-mono font-bold uppercase tracking-wider border border-emerald-200">
              {lowStockDrugs.length} below reorder
            </span>
          </div>
    
          <div className="space-y-4">
            {lowestStockDrugs.map((drug, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-900 flex items-center gap-2">
                    <span>{drug.name}</span>
                    {drug.isLow ? (
                      <span className="text-2xs bg-amber-100 text-amber-800 px-2 py-0.2 rounded-none font-bold border border-amber-300">
                        Low reserve
                      </span>
                    ) : (
                      <span className="text-2xs bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-none font-bold border border-emerald-300">
                        Healthy
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-slate-600 text-xs">
                    Stock: <strong className="text-accent">{drug.stock}</strong> · Reorder at {drug.reorderAt} · Dispensed: {drug.dispensed}
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
