import { describe, it, expect } from 'vitest';
import { formatHourLabel, formatClockTime, formatTimeRange } from './timeFormat';

describe('timeFormat utilities', () => {
  it('formats valid ISO timestamps cleanly and falls back gracefully on non-ISO input', () => {
    const valid = formatHourLabel('2026-11-19T13:00:00');
    expect(valid).toMatch(/1\s?PM/i);

    expect(formatHourLabel('14:00')).toBe('14:00');
    expect(formatClockTime('2026-11-19T14:30:00')).toMatch(/02:30|14:30/);
    expect(formatTimeRange('2026-11-19T13:00:00', '2026-11-19T15:00:00')).toContain('–');
  });
});
