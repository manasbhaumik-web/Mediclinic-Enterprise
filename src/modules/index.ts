import type { UserRole } from '../types';
import { APP_MODULES, type AppTab } from './appModules';
import type { AppModule } from './types';

export { APP_MODULES } from './appModules';
export type { AppTab } from './appModules';
export { ADMIN_SECTIONS, ADMIN_CATEGORIES, visibleAdminSections } from './adminSections';
export type { AdminTab } from './adminSections';
export type * from './types';

const MODULES: readonly AppModule[] = APP_MODULES;

/** Whether anyone holding `roles` may open this page. A person with several roles gets the union of their pages. */
const holdsAny = (held: readonly UserRole[], allowed: readonly UserRole[]) => held.some((r) => allowed.includes(r));

/** Pages that show in the navbar for these roles, in navbar order. */
export function navModules(held: readonly UserRole[]): AppModule[] {
  return MODULES.filter((m) => {
    if (!m.nav) return false;
    if (m.nav.always) return true;
    return holdsAny(held, m.roles) && (!m.nav.roles || holdsAny(held, m.nav.roles));
  });
}

/** Pages the command palette offers: every page these roles may open. */
export function paletteModules(held: readonly UserRole[]): AppModule[] {
  return MODULES.filter((m) => holdsAny(held, m.roles));
}

export function moduleById(id: AppTab): AppModule {
  return MODULES.find((m) => m.id === id) as AppModule;
}
