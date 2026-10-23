import React from 'react';
import { useEquipmentList } from '../../hooks/useEquipment';
import { bookValue } from '../../domain/equipment';
import { myr, todayStr } from '../inventory/shared';

/** Straight-line book value of the equipment register, from each device's cost, purchase date, useful life and salvage value. */
export default function EquipmentBookValueCard() {
  const list = useEquipmentList();
  const today = todayStr();
  const rows = (list.data ?? []).filter((e) => e.status !== 'Decommissioned').map((e) => ({ e, v: bookValue(e, today) }));
  const valued = rows.filter((r) => r.v);
  const total = valued.reduce((a, r) => a + (r.v?.bookValue ?? 0), 0);
  const missing = rows.length - valued.length;
  return (
    <div className="bg-surface p-5 rounded-none shadow-xs border border-line-subtle">
      <h3 className="type-heading-caps text-ink border-b border-teal-100 bg-surface-muted -mx-5 -mt-5 p-4 mb-4 flex items-center justify-between">
        Equipment Depreciation Book Value
        <span className="text-2xs bg-teal-100 text-teal-800 px-2 py-0.5 rounded-none font-bold border border-teal-200">Straight-line</span>
      </h3>
      {valued.length === 0 ? (
        <p className="text-xs text-subtle">No equipment has a cost, purchase date and useful life yet. Add them in Equipment &amp; Assets.</p>
      ) : (
        <div className="space-y-3">
          {valued.slice(0, 8).map(({ e, v }) => (
            <div key={e.id} className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div>
                <h4 className="type-card-title text-ink">{e.name}</h4>
                <p className="text-2xs text-subtle">Purchased {e.purchaseDate} ({myr(e.costPrice)}), {e.usefulLifeYears}-year life</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-mono font-bold text-strong">{myr(v!.bookValue)}</span>
                <p className="text-2xs text-subtle">-{myr(v!.accumulated)} depreciated</p>
              </div>
            </div>
          ))}
          <p className="text-xs font-bold text-ink flex justify-between"><span>Total book value ({valued.length} items)</span><span className="font-mono">{myr(total)}</span></p>
        </div>
      )}
      {missing > 0 && <p className="text-2xs text-subtle mt-3">{missing} item{missing === 1 ? '' : 's'} not valued: cost, purchase date or useful life is missing.</p>}
    </div>
  );
}
