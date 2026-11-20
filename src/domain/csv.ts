/**
 * One CSV field, safe to open in a spreadsheet. Text that would run as a formula (starts with = + - @ or a tab or return)
 * gets a leading apostrophe; a plain negative number such as -1.00 is left alone, since a number cannot be a formula. Commas, quotes and line
 * breaks are quoted.
 */
export function csvField(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  let text = String(value);
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text) && !/^-\d+(\.\d+)?$/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** A row of fields as one CSV line. */
export const csvRow = (cells: readonly (string | number | boolean | null | undefined)[]): string => cells.map(csvField).join(',');
