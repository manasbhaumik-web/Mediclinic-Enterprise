/** Retry policy for the integration outbox. Pure functions so they can be unit tested. */

export const MAX_ATTEMPTS = 6;
const BASE_DELAY_MS = 60_000;          // 1 minute
const MAX_DELAY_MS = 6 * 60 * 60_000;  // 6 hours

export type OutboxOutcome =
  | { status: 'sent' }
  | { status: 'failed'; nextRetryAt: Date }
  | { status: 'dead' };

/** Delay before retry number `attempt` (1-based): 1m, 2m, 4m, ... capped at 6h, plus up to 10% jitter. */
export function backoffDelayMs(attempt: number, random: () => number = Math.random): number {
  const exp = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** Math.max(0, attempt - 1));
  return Math.round(exp + exp * 0.1 * random());
}

/** Decide what happens to a message after a send attempt. `attemptsSoFar` includes the attempt just made. */
export function outcomeAfterAttempt(success: boolean, attemptsSoFar: number, now: Date, random: () => number = Math.random): OutboxOutcome {
  if (success) return { status: 'sent' };
  if (attemptsSoFar >= MAX_ATTEMPTS) return { status: 'dead' };
  return { status: 'failed', nextRetryAt: new Date(now.getTime() + backoffDelayMs(attemptsSoFar, random)) };
}

/** Responses worth retrying: network errors, timeouts, rate limits and server errors. */
export function isRetryableStatus(httpStatus: number | null): boolean {
  if (httpStatus === null) return true;
  return httpStatus === 408 || httpStatus === 429 || httpStatus >= 500;
}

/**
 * Single decision point for what happens to a message after a send attempt.
 * `permanent` marks failures that retrying cannot fix (bad endpoint, missing data).
 */
export function resolveOutcome(a: {
  success: boolean;
  httpStatus: number | null;
  attemptsSoFar: number;
  now: Date;
  permanent?: boolean;
  random?: () => number;
}): OutboxOutcome {
  if (a.success) return { status: 'sent' };
  if (a.permanent || !isRetryableStatus(a.httpStatus)) return { status: 'dead' };
  return outcomeAfterAttempt(false, a.attemptsSoFar, a.now, a.random);
}
