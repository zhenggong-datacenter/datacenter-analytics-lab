import { describe, expect, it } from 'vitest';
import { vi } from 'vitest';
import { openAlertDestination } from './alertNavigation';
import type { Alert } from './model';

function alert(targetType: Alert['targetType'], sourceId: string, sourceName: string): Alert {
  return {
    id: `${sourceId}:alert`,
    datacenterId: 'dc-south',
    datacenterName: 'Meridian South',
    sourceId,
    sourceName,
    targetType,
    resource: targetType === 'rack' ? 'Rack power' : 'CPU utilization',
    value: 91,
    unit: targetType === 'rack' ? 'kW' : '%',
    threshold: 85,
    timestamp: '2026-10-23T12:00:00.000Z',
  };
}

describe('resolveAlertDestination', () => {
  it('opens the affected server by ID even when its data center is filtered out', () => {
    const openServer = vi.fn();
    const openRack = vi.fn();
    const serverAlert = alert('server', 'srv-17', 'compute-17');
    const currentFilter = 'dc-north';

    expect(serverAlert.datacenterId).not.toBe(currentFilter);
    openAlertDestination(serverAlert, { server: openServer, rack: openRack });

    expect(openServer).toHaveBeenCalledExactlyOnceWith('srv-17');
    expect(openRack).not.toHaveBeenCalled();
  });

  it('opens rack details by rack ID rather than its display name', () => {
    const openServer = vi.fn();
    const openRack = vi.fn();

    openAlertDestination(alert('rack', 'rack-s2', 'S-02'), { server: openServer, rack: openRack });

    expect(openRack).toHaveBeenCalledExactlyOnceWith('rack-s2');
    expect(openServer).not.toHaveBeenCalled();
  });
});