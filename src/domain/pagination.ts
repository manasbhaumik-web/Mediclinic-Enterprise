/**
 * Universal pagination logic and metadata calculation for data grids.
 */

export interface PaginationMeta {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  startRecord: number;
  endRecord: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export function getPaginationMeta(
  totalItems: number,
  pageSize = 15,
  currentPage = 1
): PaginationMeta {
  const safeTotalItems = Math.max(0, totalItems);
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(safeTotalItems / safePageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startRecord = safeTotalItems === 0 ? 0 : (safeCurrentPage - 1) * safePageSize + 1;
  const endRecord = Math.min(safeCurrentPage * safePageSize, safeTotalItems);

  return {
    currentPage: safeCurrentPage,
    pageSize: safePageSize,
    totalPages,
    totalItems: safeTotalItems,
    startRecord,
    endRecord,
    hasNextPage: safeCurrentPage < totalPages,
    hasPrevPage: safeCurrentPage > 1,
  };
}

export function getPageNumbers(currentPage: number, totalPages: number, delta = 1): (number | string)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const range: (number | string)[] = [];
  for (
    let i = Math.max(2, currentPage - delta);
    i <= Math.min(totalPages - 1, currentPage + delta);
    i++
  ) {
    range.push(i);
  }

  if (currentPage - delta > 2) {
    range.unshift('ellipsis-left');
  }
  range.unshift(1);

  if (currentPage + delta < totalPages - 1) {
    range.push('ellipsis-right');
  }
  range.push(totalPages);

  return range;
}
