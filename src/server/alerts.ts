import type { Alert, RackSummary, ServerSummary } from '../shared/model';

type MetricRule = {
  key: 'cpuPct' | 'memoryPct' | 'storagePct' | 'temperatureC';
  resource: string;
  unit: string;
  threshold: number;
};

export const SERVER_ALERT_RULES: readonly MetricRule[] = [
  { key: 'cpuPct', resource: 'CPU utilization', unit: '%', threshold: 85 },
  { key: 'memoryPct', resource: 'Memory utilization', unit: '%', threshold: 90 },
  { key: 'storagePct', resource: 'Storage utilization', unit: '%', threshold: 90 },
  { key: 'temperatureC', resource: 'Server temperature', unit: '°C', threshold: 80 },
];

export function evaluateAlerts(
  servers: ServerSummary[],
  racks: RackSummary[],
): Alert[] {
  const alerts: Alert[] = [];

  for (const server of servers) {
    for (const rule of SERVER_ALERT_RULES) {
      const value = server.metrics[rule.key];
      if (value === null || value <= rule.threshold || server.metrics.recordedAt === null) continue;

      alerts.push({
        id: `${server.id}:${rule.key}`,
        datacenterId: server.datacenterId,
        datacenterName: server.datacenterName,
        sourceId: server.id,
        sourceName: server.name,
        targetType: 'server',
        resource: rule.resource,
        value,
        unit: rule.unit,
        threshold: rule.threshold,
        timestamp: server.metrics.recordedAt,
      });
    }
  }

  for (const rack of racks) {
    if (rack.powerKw === null || rack.recordedAt === null || rack.powerKw <= rack.powerCapacityKw * 0.9) continue;

    alerts.push({
      id: `${rack.id}:power`,
      datacenterId: rack.datacenterId,
      datacenterName: rack.datacenterName,
      sourceId: rack.id,
      sourceName: rack.name,
      targetType: 'rack',
      resource: 'Rack power',
      value: rack.powerKw,
      unit: 'kW',
      threshold: rack.powerCapacityKw * 0.9,
      timestamp: rack.recordedAt,
    });
  }

  return alerts.sort((left, right) => right.timestamp.localeCompare(left.timestamp) || left.id.localeCompare(right.id));
}

export function filterByDatacenter<T extends { datacenterId: string }>(
  records: T[],
  datacenterId?: string | null,
): T[] {
  return !datacenterId ? records : records.filter((record) => record.datacenterId === datacenterId);
}