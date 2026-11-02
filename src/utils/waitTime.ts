/** Compact wait-time label: 45m, 2h 14m, 3d 4h. Long waits stay readable instead of "8414 min". */
export function formatWait(totalMinutes: number): string {
  const mins = Math.max(0, Math.floor(Number.isFinite(totalMinutes) ? totalMinutes : 0));
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${mins % 60}m`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}
