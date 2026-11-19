/** Signing out an unattended screen. Pure rules, so the timing can be tested without a browser. */
export type IdleState = 'active' | 'warning' | 'expired';

/** Minutes of no activity before sign-out. A doctor in a consultation gets longer: reading a result is not idling. */
export const IDLE_MINUTES = 15;
export const IDLE_MINUTES_CONSULTING = 30;
/** The last minute shows a warning with a button to stay signed in. */
export const WARNING_SECONDS = 60;

export const idleMinutes = (inConsultation: boolean) => (inConsultation ? IDLE_MINUTES_CONSULTING : IDLE_MINUTES);

export function idleState(lastActivityMs: number, nowMs: number, timeoutMinutes: number, warnSeconds = WARNING_SECONDS): IdleState {
  const left = timeoutMinutes * 60_000 - (nowMs - lastActivityMs);
  if (left <= 0) return 'expired';
  return left <= warnSeconds * 1000 ? 'warning' : 'active';
}

/** Whole seconds left before sign-out, never below zero. */
export const secondsLeft = (lastActivityMs: number, nowMs: number, timeoutMinutes: number) =>
  Math.max(0, Math.ceil((timeoutMinutes * 60_000 - (nowMs - lastActivityMs)) / 1000));
