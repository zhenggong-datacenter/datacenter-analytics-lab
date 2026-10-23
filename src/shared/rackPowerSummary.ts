import type { RackSummary } from './model';

export interface RackPowerSummary {
  measuredKw: number | null;
  missingReadings: number;
}

export function summarizeRackPower(racks: Pick<RackSummary, 'powerKw'>[]): RackPowerSummary {
  let measuredKw = 0;
  let measuredCount = 0;

  for (const rack of racks) {
    if (rack.powerKw === null) continue;
    measuredKw += rack.powerKw;
    measuredCount += 1;
  }

  return {
    measuredKw: measuredCount === 0 ? null : measuredKw,
    missingReadings: racks.length - measuredCount,
  };
}