import { describe, expect, it } from 'vitest';
import { summarizeRackPower } from './rackPowerSummary';

describe('summarizeRackPower', () => {
  it('reports the measured subtotal separately from missing rack readings', () => {
    const summary = summarizeRackPower([
      { powerKw: 24.8 },
      { powerKw: 29.4 },
      { powerKw: 27.6 },
      { powerKw: null },
    ]);

    expect(summary.measuredKw).toBeCloseTo(81.8);
    expect(summary.missingReadings).toBe(1);
  });

  it('reports every rack missing when none have readings', () => {
    expect(summarizeRackPower([{ powerKw: null }, { powerKw: null }]))
      .toEqual({ measuredKw: null, missingReadings: 2 });
  });

  it('reports zero missing readings when every rack has a measurement', () => {
    expect(summarizeRackPower([{ powerKw: 10 }, { powerKw: 12.5 }]))
      .toEqual({ measuredKw: 22.5, missingReadings: 0 });
  });

  it('handles an empty rack list without inventing a measurement', () => {
    expect(summarizeRackPower([])).toEqual({ measuredKw: null, missingReadings: 0 });
  });
});