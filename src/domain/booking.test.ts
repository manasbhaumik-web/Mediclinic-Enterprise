import { describe, expect, it } from 'vitest';
import { bookableDays, clinicDateKey, dayLabel, groupSlots, phoneDigits, slotLabel, validateBookingDetails, whenLabel } from './booking';

describe('validateBookingDetails', () => {
  const ok = { name: 'Ahmad Firdaus', ic: '900101-14-5555', phone: '+60 12-345 6789' };
  it('accepts complete details', () => {
    expect(validateBookingDetails(ok)).toEqual({});
  });
  it('rejects a short name, a bad MyKad and a short phone number', () => {
    const e = validateBookingDetails({ name: 'A', ic: '12345', phone: '123' });
    expect(Object.keys(e).sort()).toEqual(['ic', 'name', 'phone']);
  });
  it('rejects a MyKad whose date of birth does not exist', () => {
    expect(validateBookingDetails({ ...ok, ic: '901301-14-5555' }).ic).toBeTruthy();
  });
  it('speaks Malay when asked', () => {
    expect(validateBookingDetails({ ...ok, name: '' }, true).name).toContain('Sila');
  });
});

describe('phoneDigits', () => {
  it('keeps digits only', () => {
    expect(phoneDigits('+60 12-345 6789')).toBe('60123456789');
  });
});

describe('days and slots', () => {
  it('uses the clinic date, not the viewer\'s', () => {
    // 20:00 UTC on 25 Oct is already 26 Oct in Kuala Lumpur
    expect(clinicDateKey(new Date('2026-10-25T20:00:00Z'))).toBe('2026-10-26');
  });
  it('lists today plus 30 days, in order, across a month end', () => {
    const days = bookableDays(new Date('2026-10-25T02:00:00Z'));
    expect(days).toHaveLength(31);
    expect(days[0]).toBe('2026-10-25');
    expect(days[7]).toBe('2026-11-01');
    expect(days[30]).toBe('2026-11-24');
  });
  it('labels a day and a time at the clinic', () => {
    expect(dayLabel('2026-10-26')).toMatchObject({ day: '26' });
    expect(slotLabel('2026-10-26T01:30:00Z')).toBe('9:30 AM');
    expect(whenLabel('2026-10-26T06:00:00Z')).toContain('2:00 PM');
  });
  it('groups slots into morning and afternoon and drops empty groups', () => {
    const g = groupSlots(['2026-10-26T01:00:00Z', '2026-10-26T02:30:00Z', '2026-10-26T06:00:00Z']);
    expect(g.map((x) => [x.key, x.slots.length])).toEqual([['morning', 2], ['afternoon', 1]]);
    expect(groupSlots(['2026-10-26T06:00:00Z']).map((x) => x.key)).toEqual(['afternoon']);
  });
});
