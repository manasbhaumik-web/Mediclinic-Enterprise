import { describe, it, expect } from 'vitest';
import { getPaginationMeta, getPageNumbers } from './pagination';

describe('Pagination Domain Logic', () => {
  it('calculates metadata correctly for empty list', () => {
    const meta = getPaginationMeta(0, 15, 1);
    expect(meta.totalPages).toBe(1);
    expect(meta.totalItems).toBe(0);
    expect(meta.startRecord).toBe(0);
    expect(meta.endRecord).toBe(0);
    expect(meta.hasNextPage).toBe(false);
    expect(meta.hasPrevPage).toBe(false);
  });

  it('calculates metadata correctly for single page (<= 15 items)', () => {
    const meta = getPaginationMeta(12, 15, 1);
    expect(meta.totalPages).toBe(1);
    expect(meta.totalItems).toBe(12);
    expect(meta.startRecord).toBe(1);
    expect(meta.endRecord).toBe(12);
    expect(meta.hasNextPage).toBe(false);
    expect(meta.hasPrevPage).toBe(false);
  });

  it('calculates metadata correctly for multi-page lists (e.g. 45 items)', () => {
    const page1 = getPaginationMeta(45, 15, 1);
    expect(page1.totalPages).toBe(3);
    expect(page1.startRecord).toBe(1);
    expect(page1.endRecord).toBe(15);
    expect(page1.hasNextPage).toBe(true);
    expect(page1.hasPrevPage).toBe(false);

    const page2 = getPaginationMeta(45, 15, 2);
    expect(page2.startRecord).toBe(16);
    expect(page2.endRecord).toBe(30);
    expect(page2.hasNextPage).toBe(true);
    expect(page2.hasPrevPage).toBe(true);

    const page3 = getPaginationMeta(45, 15, 3);
    expect(page3.startRecord).toBe(31);
    expect(page3.endRecord).toBe(45);
    expect(page3.hasNextPage).toBe(false);
    expect(page3.hasPrevPage).toBe(true);
  });

  it('clamps out-of-range page requests', () => {
    const metaHigh = getPaginationMeta(20, 15, 99);
    expect(metaHigh.currentPage).toBe(2);
    expect(metaHigh.startRecord).toBe(16);
    expect(metaHigh.endRecord).toBe(20);

    const metaLow = getPaginationMeta(20, 15, -5);
    expect(metaLow.currentPage).toBe(1);
    expect(metaLow.startRecord).toBe(1);
    expect(metaLow.endRecord).toBe(15);
  });

  it('generates page numbers without ellipsis for <= 7 pages', () => {
    const pages = getPageNumbers(2, 5);
    expect(pages).toEqual([1, 2, 3, 4, 5]);
  });

  it('generates ellipsis for large page ranges', () => {
    const startPages = getPageNumbers(1, 10);
    expect(startPages).toContain('ellipsis-right');
    expect(startPages).not.toContain('ellipsis-left');

    const middlePages = getPageNumbers(5, 10);
    expect(middlePages).toContain('ellipsis-left');
    expect(middlePages).toContain('ellipsis-right');

    const endPages = getPageNumbers(10, 10);
    expect(endPages).toContain('ellipsis-left');
    expect(endPages).not.toContain('ellipsis-right');
  });
});
