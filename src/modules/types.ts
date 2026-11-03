import type { ComponentType } from 'react';
import type { UserRole } from '../types';

export type ModuleIcon = ComponentType<{ className?: string }>;

export interface Bilingual {
  en: string;
  bm: string;
}

/** Which live count a navbar tab shows as its badge. */
export type NavBadge = 'triage' | 'doctor' | 'pharmacy' | 'cashier';

/** Where and how a staff page appears in the navbar. A page with no `nav` is not in the navbar. */
export interface NavConfig {
  /** Key into the translation object (`t`), with the English text used when the key is missing. */
  labelKey: string;
  fallback: string;
  /** Show to everyone, whatever their roles (the dashboard). */
  always?: boolean;
  /** Also require one of these roles to see the tab (appointments are in the navbar for receptionists only). */
  roles?: readonly UserRole[];
  badge?: NavBadge;
  /** Hide the badge while this page is open. */
  badgeHiddenOn?: string;
}

/** One staff page under /app/*. Declared once here; routes, navbar, command palette and access summaries all read it. */
export interface AppModule {
  /** The tab id and URL segment. */
  id: string;
  label: Bilingual;
  /** Search hint in the command palette. */
  hint: string;
  icon: ModuleIcon;
  /** Who may open the page. This is the route guard. */
  roles: readonly UserRole[];
  nav?: NavConfig;
  /** Reachable from the user menu instead of the navbar. */
  userMenu?: boolean;
}

export type AdminCategoryId = 'people' | 'clinical' | 'finance' | 'compliance' | 'platform';

/** The five per-clinic switches in `settings.modules`. Only these can hide an admin section. */
export type SettingsModuleKey = 'staff' | 'medicine' | 'equipment' | 'billing' | 'reports';

/** One section of the admin console. */
export interface AdminSection {
  id: string;
  label: Bilingual;
  category: AdminCategoryId;
  icon: ModuleIcon;
  /** `admin`: administrators only. `all`: administrators and HR. */
  roleReq: 'all' | 'admin';
  /** The clinic switch that turns this section off, if it has one. */
  settingsKey?: SettingsModuleKey;
}
