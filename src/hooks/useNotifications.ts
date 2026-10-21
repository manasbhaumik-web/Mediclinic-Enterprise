import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDrugs, useInventorySettings, useRegister } from './useInventoryData';
import { useEquipmentList, useEquipmentSettings } from './useEquipment';
import { useLeaveRequests } from './useLeave';
import { buildAlerts } from '../domain/inventory';
import { buildEquipmentAlerts } from '../domain/equipment';

export type Severity = 'critical' | 'warn' | 'info';
/** Where a notification leads: a tab in the clinic shell or the admin console. */
export interface AppNotification { id: string; severity: Severity; title: string; detail: string; target: { kind: 'tab'; tab: string } | { kind: 'admin'; tab?: string } }

const today = () => new Date().toISOString().slice(0, 10);
const rank: Record<Severity, number> = { critical: 0, warn: 1, info: 2 };

/**
 * What needs this person's attention, taken from the live records: stock and expiry, controlled-drug entries waiting for a
 * second signature, equipment due or faulty, and leave awaiting a decision. Each source is read only by the roles that can see it.
 */
export function useNotifications(): { items: AppNotification[]; count: number } {
  const { role, user } = useAuth();
  const pharmacy = role === 'pharmacist' || role === 'admin';
  const manager = role === 'admin' || role === 'hr';
  const admin = role === 'admin';

  const drugs = useDrugs(pharmacy);
  const register = useRegister(null, pharmacy);
  const { settings: invSettings } = useInventorySettings();
  const equipment = useEquipmentList(admin);
  const { settings: eqSettings } = useEquipmentSettings();
  const leave = useLeaveRequests({ status: 'pending', enabled: manager });

  const items = useMemo(() => {
    const out: AppNotification[] = [];
    const d = today();
    if (pharmacy) {
      const stock = buildAlerts(drugs.data ?? [], invSettings.data?.nearExpiryDays ?? 60, d).filter((a) => a.severity !== 'info');
      for (const a of stock) {
        out.push({ id: `stock-${a.drugId}-${a.kind}-${a.batchId ?? ''}`, severity: a.severity, title: `${a.drugName}`, detail: a.detail,
                   target: role === 'admin' ? { kind: 'admin', tab: 'medicine' } : { kind: 'tab', tab: 'inventory' } });
      }
      const waiting = (register.data ?? []).filter((e) => !e.signedBy && e.performedBy !== user?.id);
      if (waiting.length > 0) {
        out.push({ id: 'register-unsigned', severity: 'warn', title: 'Controlled-drug entries need a second signature',
                   detail: `${waiting.length} entr${waiting.length === 1 ? 'y is' : 'ies are'} waiting for you`, target: role === 'admin' ? { kind: 'admin', tab: 'medicine' } : { kind: 'tab', tab: 'inventory' } });
      }
    }
    if (admin) {
      for (const a of buildEquipmentAlerts(equipment.data ?? [], eqSettings.data?.dueSoonDays ?? 30, d).filter((x) => x.severity !== 'info')) {
        const name = (equipment.data ?? []).find((e) => e.id === a.equipmentId)?.name ?? 'Equipment';
        out.push({ id: `eq-${a.equipmentId}-${a.kind}`, severity: a.severity, title: name, detail: a.detail, target: { kind: 'admin', tab: 'equipment' } });
      }
    }
    if (manager) {
      const pending = leave.data ?? [];
      if (pending.length > 0) {
        out.push({ id: 'leave-pending', severity: 'info', title: 'Leave requests awaiting a decision',
                   detail: `${pending.length} pending`, target: { kind: 'admin', tab: 'leave' } });
      }
    }
    return out.sort((a, b) => rank[a.severity] - rank[b.severity]);
  }, [pharmacy, admin, manager, role, user?.id, drugs.data, register.data, invSettings.data, equipment.data, eqSettings.data, leave.data]);

  return { items, count: items.length };
}
