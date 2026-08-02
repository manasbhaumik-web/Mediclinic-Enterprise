export function maskICNumber(icNumber: string | undefined | null, showPII: boolean = false): string {
  if (!icNumber) return '';
  if (showPII) return icNumber;
  
  // Clean it up first in case it's not formatted
  const clean = icNumber.replace(/-/g, '');
  
  // If it's a standard length 12 digit IC: YYMMDD-XX-XXXX
  if (clean.length === 12) {
    const last4 = clean.slice(-4);
    return `XXXXXX-XX-${last4}`;
  }
  
  // If it's some other format, mask all but the last 4 characters
  if (clean.length > 4) {
    return '*'.repeat(clean.length - 4) + clean.slice(-4);
  }
  
  return '****';
}
