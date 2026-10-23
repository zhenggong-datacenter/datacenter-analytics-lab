import type { Alert, DataCenter, RackDetail, RackSummary, ServerDetail, ServerSummary } from '../shared/model';

async function request<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(payload?.error ?? `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

const query = (id: string) => id ? `?datacenterId=${encodeURIComponent(id)}` : '';

export const api = {
  datacenters: () => request<DataCenter[]>('/api/datacenters'),
  servers: (id: string) => request<ServerSummary[]>(`/api/servers${query(id)}`),
  server: (id: string) => request<ServerDetail>(`/api/servers/${encodeURIComponent(id)}`),
  racks: (id: string) => request<RackSummary[]>(`/api/racks${query(id)}`),
  rack: (id: string) => request<RackDetail>(`/api/racks/${encodeURIComponent(id)}`),
  alerts: (id: string) => request<Alert[]>(`/api/alerts${query(id)}`),
};