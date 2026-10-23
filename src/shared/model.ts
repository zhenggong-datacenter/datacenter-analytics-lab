export interface DataCenter {
  id: string;
  name: string;
}

export interface ServerMetrics {
  cpuPct: number | null;
  memoryPct: number | null;
  storagePct: number | null;
  temperatureC: number | null;
  recordedAt: string | null;
}

export interface ServerSummary {
  id: string;
  name: string;
  datacenterId: string;
  datacenterName: string;
  rackId: string;
  rackName: string;
  metrics: ServerMetrics;
}

export interface ServerDetail extends ServerSummary {
  rackPowerCapacityKw: number;
  rackPowerKw: number | null;
  rackRecordedAt: string | null;
}

export interface RackSummary {
  id: string;
  name: string;
  datacenterId: string;
  datacenterName: string;
  powerCapacityKw: number;
  powerKw: number | null;
  recordedAt: string | null;
}

export interface RackDetail extends RackSummary {
  servers: ServerSummary[];
}

export interface Alert {
  id: string;
  datacenterId: string;
  datacenterName: string;
  sourceId: string;
  sourceName: string;
  targetType: 'server' | 'rack';
  resource: string;
  value: number;
  unit: string;
  threshold: number;
  timestamp: string;
}