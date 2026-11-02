import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  className?: string;
  itemLabel?: string;
}

export default function Pagination({
  currentPage,
  totalItems,
  pageSize = 15,
  onPageChange,
  className = '',
  itemLabel = 'records',
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const startRecord = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endRecord = Math.min(safePage * pageSize, totalItems);

  if (totalItems <= pageSize && safePage === 1) {
    return (
      <div className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-surface-muted/30 border-t border-line text-xs font-mono text-muted select-none ${className}`}>
        <div>
          Showing <strong className="text-ink font-bold tabular-nums">{startRecord}</strong> to{' '}
          <strong className="text-ink font-bold tabular-nums">{endRecord}</strong> of{' '}
          <strong className="text-ink font-bold tabular-nums">{totalItems}</strong> {itemLabel}
        </div>
        <div className="text-2xs text-muted/80">Page 1 of 1 (15 per page)</div>
      </div>
    );
  }

  // Generate page numbers with ellipses
  const getPageNumbers = () => {
    const delta = 1;
    const range: (number | string)[] = [];
    for (
      let i = Math.max(2, safePage - delta);
      i <= Math.min(totalPages - 1, safePage + delta);
      i++
    ) {
      range.push(i);
    }

    if (safePage - delta > 2) {
      range.unshift('...');
    }
    if (safePage + delta < totalPages - 1) {
      range.push('...');
    }

    range.unshift(1);
    if (totalPages > 1) {
      range.push(totalPages);
    }
    return range;
  };

  const pages = getPageNumbers();

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-surface-muted/30 border-t border-line text-xs font-mono select-none ${className}`}>
      {/* Record summary */}
      <div className="text-muted text-xs">
        Showing <strong className="text-ink font-bold tabular-nums">{startRecord}</strong> to{' '}
        <strong className="text-ink font-bold tabular-nums">{endRecord}</strong> of{' '}
        <strong className="text-ink font-bold tabular-nums">{totalItems}</strong> {itemLabel}
      </div>

      {/* Paging controls */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={safePage === 1}
          className="w-8 h-8 flex items-center justify-center rounded-none border border-line bg-surface text-ink hover:bg-surface-accent disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          title="First page"
          aria-label="First page"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        {/* Previous Page */}
        <button
          type="button"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage === 1}
          className="w-8 h-8 flex items-center justify-center rounded-none border border-line bg-surface text-ink hover:bg-surface-accent disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          title="Previous page"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Page Buttons */}
        <div className="hidden sm:flex items-center gap-1 mx-1">
          {pages.map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="w-7 text-center text-muted select-none">
                  …
                </span>
              );
            }
            const isCurrent = p === safePage;
            return (
              <button
                key={`page-${p}`}
                type="button"
                onClick={() => onPageChange(Number(p))}
                aria-current={isCurrent ? 'page' : undefined}
                className={`w-8 h-8 flex items-center justify-center font-mono text-xs font-bold rounded-none border transition-colors cursor-pointer ${
                  isCurrent
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-surface text-ink border-line hover:bg-surface-accent'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-none border border-line bg-surface text-ink hover:bg-surface-accent disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          title="Next page"
          aria-label="Next page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Last Page */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={safePage === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-none border border-line bg-surface text-ink hover:bg-surface-accent disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          title="Last page"
          aria-label="Last page"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}


export { Pagination };
