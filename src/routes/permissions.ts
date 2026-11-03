import { UserRole } from '../types';
import { APP_MODULES, type AppTab } from '../modules/appModules';
import { PRIVILEGED_ROLES } from '../../supabase/functions/_shared/staffAccess';

export type { AppTab };

/** Roles allowed on each /app/* page. Derived from the module registry (`src/modules/appModules.ts`). */
export const TAB_ROLES = Object.fromEntries(APP_MODULES.map((m) => [m.id, m.roles])) as Record<AppTab, readonly UserRole[]>;

/** Whether anyone holding `roles` may open `tab`. A person with several roles gets the union of their pages. */
export const canOpenTab = (roles: readonly UserRole[] | null | undefined, tab: AppTab): boolean =>
  !!roles && roles.some((r) => TAB_ROLES[tab].includes(r));

/** Roles that can open the admin console: the same ones that may manage other people's access. */
export const ADMIN_ROLES: readonly UserRole[] = PRIVILEGED_ROLES;

export const tabPath = (tab: string) => `/app/${tab}`;
