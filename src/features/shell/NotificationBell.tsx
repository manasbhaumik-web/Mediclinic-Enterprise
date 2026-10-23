import React, { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { AppNotification, Severity, useNotifications } from '../../hooks/useNotifications';

const DOT: Record<Severity, string> = { critical: 'bg-rose-400', warn: 'bg-amber-300', info: 'bg-sky-300' };

/** Header bell: what needs this person's attention right now, from the live records. */
export default function NotificationBell({ onOpenTab, onOpenAdmin }: { onOpenTab: (tab: string) => void; onOpenAdmin?: (tab?: string) => void }) {
  const { items, count } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [open]);

  const go = (n: AppNotification) => {
    setOpen(false);
    if (n.target.kind === 'tab') onOpenTab(n.target.tab); else onOpenAdmin?.(n.target.tab);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={count > 0 ? `Notifications, ${count} need attention` : 'Notifications, nothing needs attention'}
        className="relative flex items-center justify-center w-10 h-10 rounded-full bg-chrome-deep hover:bg-chrome-line border border-teal-300/40 cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:outline-none"
      >
        <Bell className="w-4 h-4 text-teal-100" />
        {count > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-2xs font-bold flex items-center justify-center">{count > 99 ? '99+' : count}</span>
        )}
      </button>
      {open && (
        <div role="dialog" aria-label="Notifications" className="absolute right-0 top-12 w-96 max-w-[90vw] bg-surface dark:bg-night-900 border border-line dark:border-teal-800/80 shadow-2xl text-xs text-ink dark:text-white z-50 animate-fadeIn">
          <p className="px-4 py-2.5 border-b border-line dark:border-teal-800/40 font-bold text-accent dark:text-teal-300 uppercase text-2xs tracking-wider">Needs attention</p>
          {items.length === 0 ? (
            <p className="px-4 py-6 text-center text-ink dark:text-teal-100">Nothing needs attention.</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto divide-y divide-line-subtle dark:divide-teal-800/30">
              {items.slice(0, 30).map((n) => (
                <li key={n.id}>
                  <button type="button" onClick={() => go(n)} className="w-full text-left px-4 py-2.5 flex gap-3 hover:bg-surface-accent dark:hover:bg-night-800 cursor-pointer focus-visible:bg-surface-accent dark:focus-visible:bg-night-800 focus-visible:outline-none">
                    <span className={`mt-1 w-2 h-2 shrink-0 rounded-full ${DOT[n.severity]}`} aria-hidden="true" />
                    <span><b className="block text-ink dark:text-white">{n.title}</b><span className="text-ink dark:text-teal-100">{n.detail}</span></span>
                  </button>
                </li>
              ))}
              {items.length > 30 && <li className="px-4 py-2 text-muted dark:text-teal-200">and {items.length - 30} more</li>}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
