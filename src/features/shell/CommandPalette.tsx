import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, CornerDownLeft } from 'lucide-react';
import { paletteModules, type AppModule } from '../../modules';
import type { UserRole } from '../../types';

/**
 * A quick switcher: Ctrl+K (or Cmd+K) opens it, type to filter the pages you can open, Enter goes there.
 * It lists only pages the signed-in roles may open, the same rule the navbar uses.
 */
export default function CommandPalette({ roles, onOpenTab }: { roles: readonly UserRole[]; onOpenTab: (tab: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return paletteModules(roles).filter((m) => !q || `${m.label.en} ${m.hint}`.toLowerCase().includes(q));
  }, [roles, query]);

  const go = (entry: AppModule | undefined) => {
    if (!entry) return;
    setOpen(false);
    onOpenTab(entry.id);
  };

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setIndex((i) => Math.min(results.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIndex((i) => Math.max(0, i - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); go(results[index]); }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden lg:inline-flex items-center gap-2 min-h-10 px-3 bg-surface border border-line text-muted hover:bg-surface-strong hover:text-ink text-sm cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-label="Jump to a page (Ctrl K)"
        title="Jump to a page (Ctrl K)"
      >
        <Search className="w-4 h-4" aria-hidden="true" />
        <span>Jump to</span>
        <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-surface-muted border border-line text-muted">Ctrl K</kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[110] bg-night-950/60 backdrop-blur-xs flex items-start justify-center p-4 pt-[12vh]"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div role="dialog" aria-modal="true" aria-label="Jump to a page" className="w-full max-w-lg bg-surface border border-line text-ink">
            <div className="relative border-b border-line">
              <Search className="w-4 h-4 text-muted absolute left-4 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setIndex(0); }}
                onKeyDown={onInputKey}
                placeholder="Jump to a page"
                aria-label="Search pages"
                role="combobox"
                aria-expanded="true"
                aria-controls="command-palette-list"
                aria-activedescendant={results[index] ? `cmd-${results[index].id}` : undefined}
                className="w-full min-h-14 pl-11 pr-4 bg-transparent text-base text-ink placeholder:text-muted outline-none"
              />
            </div>
            <ul id="command-palette-list" role="listbox" className="max-h-80 overflow-y-auto">
              {results.length === 0 ? (
                <li className="px-4 py-6 text-sm text-muted text-center">No page matches that.</li>
              ) : (
                results.map((p, i) => (
                  <li key={p.id} id={`cmd-${p.id}`} role="option" aria-selected={i === index}>
                    <button
                      type="button"
                      tabIndex={-1}
                      onMouseEnter={() => setIndex(i)}
                      onClick={() => go(p)}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left cursor-pointer ${i === index ? 'bg-surface-accent shadow-[inset_3px_0_0_var(--color-primary)]' : ''}`}
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-ink">{p.label.en}</span>
                        <span className="block text-xs text-muted truncate">{p.hint}</span>
                      </span>
                      {i === index && <CornerDownLeft className="w-4 h-4 text-accent shrink-0" aria-hidden="true" />}
                    </button>
                  </li>
                ))
              )}
            </ul>
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-line text-xs text-muted">
              <span>Up and down to choose, Enter to open</span>
              <span>Esc to close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
