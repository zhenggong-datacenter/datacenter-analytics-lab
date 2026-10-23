import { describe, expect, it } from 'vitest';
import type { RackSummary, ServerSummary } from '../shared/model';
import { evaluateAlerts, filterByDatacenter } from './alerts';

const timestamp = '2026-10-23T12:00:00.000Z';

function server(overrides: Partial<ServerSummary['metrics']> = {}, datacenterId = 'dc-north'): ServerSummary {
  return {
    id: 'srv-01',
    name: 'compute-01',
    datacenterId,
    datacenterName: datacenterId === 'dc-north' ? 'Meridian North' : 'Meridian South',
    rackId: 'rack-n1',
    rackName: 'N-01',
    metrics: {
      cpuPct: 85,
      memoryPct: 90,
      storagePct: 90,
      temperatureC: 80,
      recordedAt: timestamp,
      ...overrides,
    },
  };
}

function rack(overrides: Partial<RackSummary> = {}, datacenterId = 'dc-north'): RackSummary {
  return {
    id: 'rack-n1',
    name: 'N-01',
    datacenterId,
    datacenterName: datacenterId === 'dc-north' ? 'Meridian North' : 'Meridian South',
    powerCapacityKw: 32,
    powerKw: 28.8,
    recordedAt: timestamp,
    ...overrides,
  };
}

describe('evaluateAlerts', () => {
  it('does not alert at or below the documented thresholds', () => {
    expect(evaluateAlerts([server()], [rack()])).toEqual([]);
  });

  it('alerts only when a metric is strictly above its threshold', () => {
    const alerts = evaluateAlerts([
      server({ cpuPct: 85.1, memoryPct: 90.1, storagePct: 90.1, temperatureC: 80.1 }),
    ], []);

    expect(alerts.map(({ resource }) => resource)).toEqual([
      'CPU utilization',
      'Memory utilization',
      'Storage utilization',
      'Server temperature',
    ]);
    expect(alerts[0]).toMatchObject({
      sourceId: 'srv-01', targetType: 'server', value: 85.1, threshold: 85, unit: '%', timestamp,
    });
  });

  it('skips missing metric values and missing timestamps', () => {
    const alerts = evaluateAlerts([
      server({ cpuPct: null, memoryPct: 95, recordedAt: null }),
    ], [rack({ powerKw: null })]);

    expect(alerts).toEqual([]);
  });

  it('compares rack power against 90 percent of capacity', () => {
    const alerts = evaluateAlerts([], [rack({ powerKw: 28.81 })]);

    expect(alerts).toMatchObject([{
      sourceId: 'rack-n1',
      targetType: 'rack',
      resource: 'Rack power',
      value: 28.81,
      threshold: 28.8,
      unit: 'kW',
    }]);
  });
});

describe('filterByDatacenter', () => {
  it('keeps only records for the selected data center', () => {
    const records = [server({}, 'dc-north'), server({ cpuPct: 55 }, 'dc-south')];

    expect(filterByDatacenter(records, 'dc-south').map(({ datacenterId }) => datacenterId)).toEqual(['dc-south']);
  });

  it('returns every record when no data center is selected', () => {
    const records = [server({}, 'dc-north'), server({ cpuPct: 55 }, 'dc-south')];

    expect(filterByDatacenter(records)).toEqual(records);
  });
});