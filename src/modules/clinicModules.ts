import type { SettingsModuleKey } from './types';

/**
 * The clinic's module switches (`settings.modules`, stored as `clinic_settings.active_modules`). A switched-off
 * module disappears everywhere: its staff pages (routes, navbar, command palette) and its admin console sections.
 * Pages and sections opt in with `moduleKey` in the registry; everything without one is always on.
 */
export type ClinicModuleSwitches = Record<SettingsModuleKey, boolean>;

export const CLINIC_MODULE_KEYS: readonly SettingsModuleKey[] = ['staff', 'medicine', 'equipment', 'billing', 'reports'];

export const DEFAULT_MODULE_SWITCHES: ClinicModuleSwitches = {
  staff: true,
  medicine: true,
  equipment: true,
  billing: true,
  reports: true,
};

/**
 * The switches to use for stored data: anything missing or not a true/false value is on, so an older clinic
 * record without a key keeps that module.
 */
export function resolveModuleSwitches(stored: unknown): ClinicModuleSwitches {
  const source = stored && typeof stored === 'object' ? (stored as Record<string, unknown>) : {};
  const out = { ...DEFAULT_MODULE_SWITCHES };
  for (const key of CLINIC_MODULE_KEYS) {
    if (typeof source[key] === 'boolean') out[key] = source[key] as boolean;
  }
  return out;
}

/** Whether a page or section with this switch (if any) is available. */
export const isModuleOn = (switches: ClinicModuleSwitches, key: SettingsModuleKey | undefined): boolean => !key || switches[key];
