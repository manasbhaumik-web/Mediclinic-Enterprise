import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { navModules, type NavBadge } from '../../modules';
import type { UserRole } from '../../types';
import { useSettings } from '../../context/SettingsContext';

interface NavTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  /** Every role the person holds. */
  held: readonly UserRole[];
  /** The translation object (`t`); a tab's label is `t[labelKey]` with its English fallback. */
  t: Record<string, string | undefined>;
  badges: Record<NavBadge, number>;
  onOpenAdmin?: () => void;
}

/** The navbar tabs, built from the module registry (`src/modules/appModules.ts`). */
export default function NavTabs({ activeTab, setActiveTab, held, t, badges, onOpenAdmin }: NavTabsProps) {
  const { settings } = useSettings();
  const isAdmin = held.includes('admin') || held.includes('hr');
  const adminButton = isAdmin && (
    <button
      key="admin"
      type="button"
      id="sidebar-link-admin"
      onClick={() => onOpenAdmin?.()}
      className="nav-btn nav-btn-inactive"
    >
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-teal-100/90" />
        <span>{t.administration || 'Administration'}</span>
      </div>
    </button>
  );

  return (
    <div className="flex items-stretch h-full" id="sidebar-navigation-links">
      {navModules(held, settings.modules).map((m, i) => {
        const nav = m.nav!;
        const active = activeTab === m.id;
        const Icon = m.icon;
        const count = nav.badge ? badges[nav.badge] : 0;
        const showBadge = count > 0 && activeTab !== nav.badgeHiddenOn;
        return (
          <React.Fragment key={m.id}>
            <button
              type="button"
              id={`sidebar-link-${m.id}`}
              onClick={() => setActiveTab(m.id)}
              aria-current={active ? 'page' : undefined}
              className={`nav-btn ${active ? 'nav-btn-active' : 'nav-btn-inactive'}`}
            >
              <div className="flex items-center gap-2">
                {active && <span className="w-1.5 h-1.5 rounded-none bg-white"></span>}
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-teal-100/90'}`} />
                <span>{t[nav.labelKey] || nav.fallback}</span>
              </div>
              {showBadge && (
                <span className={`text-2xs font-bold font-mono px-1.5 py-0.5 rounded-none min-w-[16px] flex items-center justify-center ml-2 ${
                  active ? 'bg-white text-chrome font-bold' : 'bg-black/25 text-white border border-white/20'
                }`}>
                  {count}
                </span>
              )}
            </button>
            {/* The administration console link sits right after the first tab (the dashboard) */}
            {i === 0 && adminButton}
          </React.Fragment>
        );
      })}
    </div>
  );
}
