/** A visit's queue ticket, restarting each clinic day: 7 becomes "#007". Visits from before tickets existed have none. */
export function formatTicket(ticketNo: number | null | undefined): string {
  if (ticketNo === null || ticketNo === undefined || !Number.isInteger(ticketNo) || ticketNo < 1) return '';
  return `#${String(ticketNo).padStart(3, '0')}`;
}
