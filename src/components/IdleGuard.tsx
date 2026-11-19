import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Timer } from 'lucide-react';
import { idleState, secondsLeft } from '../domain/idleTimeout';

interface IdleGuardProps {
  timeoutMinutes: number;
  /** Signs the person out. Called once when the time runs out. */
  onTimeout: () => void | Promise<void>;
}

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'] as const;

/**
 * Signs the person out after a period with no activity, and warns for the last minute so nothing is lost by surprise.
 * A shared clinic computer should not stay signed in on a patient's record when the person has walked away.
 */
export default function IdleGuard({ timeoutMinutes, onTimeout }: IdleGuardProps) {
  const last = useRef(Date.now());
  const fired = useRef(false);
  const timeout = useRef(onTimeout);
  timeout.current = onTimeout;
  const [left, setLeft] = useState<number | null>(null);

  const touch = useCallback(() => {
    last.current = Date.now();
    setLeft((v) => (v === null ? v : null));
  }, []);

  useEffect(() => {
    last.current = Date.now();
    fired.current = false;
    let lastSet = 0;
    // Mouse moves fire constantly; one update a second is plenty.
    const onActivity = () => {
      const now = Date.now();
      if (now - lastSet < 1000) return;
      lastSet = now;
      touch();
    };
    for (const e of ACTIVITY_EVENTS) window.addEventListener(e, onActivity, { passive: true });

    const tick = () => {
      const now = Date.now();
      const state = idleState(last.current, now, timeoutMinutes);
      if (state === 'expired') {
        if (!fired.current) {
          fired.current = true;
          void timeout.current();
        }
      } else {
        setLeft(state === 'warning' ? secondsLeft(last.current, now, timeoutMinutes) : null);
      }
    };
    const timer = setInterval(tick, 1000);
    // A laptop that slept: check at once when the tab comes back.
    document.addEventListener('visibilitychange', tick);
    return () => {
      for (const e of ACTIVITY_EVENTS) window.removeEventListener(e, onActivity);
      document.removeEventListener('visibilitychange', tick);
      clearInterval(timer);
    };
  }, [timeoutMinutes, touch]);

  if (left === null) return null;
  return (
    <div role="alertdialog" aria-live="assertive" aria-label="Signing out soon" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-night-900 text-white border border-white/20 shadow-2xl px-5 py-4 flex flex-wrap items-center gap-4 max-w-[92vw]">
      <Timer className="w-5 h-5 text-amber-300 shrink-0" aria-hidden="true" />
      <p className="text-sm font-semibold">You will be signed out in {left} second{left === 1 ? '' : 's'} because nothing has happened for a while.</p>
      <button type="button" onClick={touch} className="min-h-11 px-4 bg-primary text-white text-sm font-bold hover:bg-primary-hover cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Stay signed in</button>
    </div>
  );
}
