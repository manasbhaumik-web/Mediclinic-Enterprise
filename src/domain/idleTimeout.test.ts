import { describe, it, expect } from 'vitest';
import { IDLE_MINUTES, IDLE_MINUTES_CONSULTING, idleMinutes, idleState, secondsLeft } from './idleTimeout';

const MIN = 60_000;

describe('idleState', () => {
  it('is active until the last minute, then warns, then expires', () => {
    expect(idleState(0, 0, 15)).toBe('active');
    expect(idleState(0, 13 * MIN + 59_000, 15)).toBe('active');
    expect(idleState(0, 14 * MIN, 15)).toBe('warning');
    expect(idleState(0, 14 * MIN + 59_000, 15)).toBe('warning');
    expect(idleState(0, 15 * MIN, 15)).toBe('expired');
    expect(idleState(0, 99 * MIN, 15)).toBe('expired');
  });

  it('starts again from the latest activity', () => {
    expect(idleState(10 * MIN, 23 * MIN, 15)).toBe('active');
    expect(idleState(10 * MIN, 24 * MIN, 15)).toBe('warning');
    expect(idleState(10 * MIN, 25 * MIN, 15)).toBe('expired');
  });
});

describe('secondsLeft', () => {
  it('counts down in whole seconds and stops at zero', () => {
    expect(secondsLeft(0, 14 * MIN, 15)).toBe(60);
    expect(secondsLeft(0, 14 * MIN + 30_500, 15)).toBe(30);
    expect(secondsLeft(0, 20 * MIN, 15)).toBe(0);
  });
});

describe('timeouts', () => {
  it('gives a consultation longer', () => {
    expect(idleMinutes(false)).toBe(IDLE_MINUTES);
    expect(idleMinutes(true)).toBe(IDLE_MINUTES_CONSULTING);
    expect(IDLE_MINUTES_CONSULTING).toBeGreaterThan(IDLE_MINUTES);
  });
});
