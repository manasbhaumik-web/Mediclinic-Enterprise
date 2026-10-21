/** "MEDICLINIC ENTERPRISE" -> "Mediclinic Enterprise". A name already in mixed case is left exactly as the administrator typed it. */
export function brandName(name: string): string {
  if (name !== name.toUpperCase()) return name;
  return name.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (_m, sep: string, ch: string) => sep + ch.toUpperCase());
}
