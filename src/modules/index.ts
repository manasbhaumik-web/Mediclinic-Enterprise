import type { UserRole } from '../types';
import { APP_MODULES, type AppTab } from './appModules';
import type { AppModule, SettingsModuleKey } from './types';
import { ADMIN_SECTIONS } from './adminSections';
import { DEFAULT_MODULE_SWITCHES, isModuleOn, type ClinicModuleSwitches } from './clinicModules';

export { APP_MODULES } from './appModules';
export type { AppTab } from './appModules';
export { ADMIN_SECTIONS, ADMIN_CATEGORIES, visibleAdminSections } from './adminSections';
export type { AdminTab } from './adminSections';
export type * from './types';
export { CLINIC_MODULE_KEYS, DEFAULT_MODULE_SWITCHES, resolveModuleSwitches, isModuleOn } from './clinicModules';
export type { ClinicModuleSwitches } from './clinicModules';

const MODULES: readonly AppModule[] = APP_MODULES;

/** Whether anyone holding `roles` may open this page. A person with several roles gets the union of their pages. */
const holdsAny = (held: readonly UserRole[], allowed: readonly UserRole[]) => held.some((r) => allowed.includes(r));

/** Pages that show in the navbar for these roles, in navbar order, minus any the clinic has switched off. */
export function navModules(held: readonly UserRole[], switches: ClinicModuleSwitches = DEFAULT_MODULE_SWITCHES): AppModule[] {
  return MODULES.filter((m) => {
    if (!m.nav || !isModuleOn(switches, m.moduleKey)) return false;
    if (m.nav.always) return true;
    return holdsAny(held, m.roles) && (!m.nav.roles || holdsAny(held, m.nav.roles));
  });
}

/** Pages the command palette offers: every page these roles may open that the clinic has not switched off. */
export function paletteModules(held: readonly UserRole[], switches: ClinicModuleSwitches = DEFAULT_MODULE_SWITCHES): AppModule[] {
  return MODULES.filter((m) => holdsAny(held, m.roles) && isModuleOn(switches, m.moduleKey));
}

/** What a clinic module switch controls, in English: the staff pages and the admin console sections. */
export function modulePages(key: SettingsModuleKey): { staffPages: string[]; adminSections: string[] } {
  return {
    staffPages: MODULES.filter((m) => m.moduleKey === key).map((m) => m.label.en),
    adminSections: ADMIN_SECTIONS.filter((s) => 'moduleKey' in s && s.moduleKey === key).map((s) => s.label.en),
  };
}

export function moduleById(id: AppTab): AppModule {
  return MODULES.find((m) => m.id === id) as AppModule;
}
