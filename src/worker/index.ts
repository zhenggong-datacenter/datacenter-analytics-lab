import { evaluateAlerts } from '../server/alerts';
import type { DataCenter, RackDetail, RackSummary, ServerDetail, ServerSummary } from '../shared/model';

interface Env { DB: D1Database; ASSETS: Fetcher }
interface ServerRow {
  id: string; name: string; datacenter_id: string; datacenter_name: string;
  rack_id: string; rack_name: string; cpu_pct: number | null; memory_pct: number | null;
  storage_pct: number | null; temperature_c: number | null; server_recorded_at: string | null;
}
interface RackRow {
  id: string; name: string; datacenter_id: string; datacenter_name: string;
  power_capacity_kw: number; power_kw: number | null; recorded_at: string | null;
}

const serverSql = `SELECT s.id, s.name, dc.id AS datacenter_id, dc.name AS datacenter_name,
  r.id AS rack_id, r.name AS rack_name, sr.cpu_pct, sr.memory_pct, sr.storage_pct,
  sr.temperature_c, sr.recorded_at AS server_recorded_at
  FROM servers s JOIN racks r ON r.id = s.rack_id
  JOIN data_centers dc ON dc.id = r.datacenter_id
  LEFT JOIN server_readings sr ON sr.server_id = s.id`;
const rackSql = `SELECT r.id, r.name, dc.id AS datacenter_id, dc.name AS datacenter_name,
  r.power_capacity_kw, rr.power_kw, rr.recorded_at
  FROM racks r JOIN data_centers dc ON dc.id = r.datacenter_id
  LEFT JOIN rack_readings rr ON rr.rack_id = r.id`;

const nullableNumber = (value: number | null | undefined) => value == null ? null : Number(value);

function toServer(row: ServerRow): ServerSummary {
  return {
    id: row.id, name: row.name, datacenterId: row.datacenter_id,
    datacenterName: row.datacenter_name, rackId: row.rack_id, rackName: row.rack_name,
    metrics: {
      cpuPct: nullableNumber(row.cpu_pct), memoryPct: nullableNumber(row.memory_pct),
      storagePct: nullableNumber(row.storage_pct), temperatureC: nullableNumber(row.temperature_c),
      recordedAt: row.server_recorded_at,
    },
  };
}

function toRack(row: RackRow): RackSummary {
  return {
    id: row.id, name: row.name, datacenterId: row.datacenter_id,
    datacenterName: row.datacenter_name, powerCapacityKw: Number(row.power_capacity_kw),
    powerKw: nullableNumber(row.power_kw), recordedAt: row.recorded_at,
  };
}

async function servers(db: D1Database, center?: string): Promise<ServerSummary[]> {
  const sql = center ? `${serverSql} WHERE dc.id = ? ORDER BY s.name` : `${serverSql} ORDER BY s.name`;
  const result = center ? await db.prepare(sql).bind(center).all<ServerRow>() : await db.prepare(sql).all<ServerRow>();
  return result.results.map(toServer);
}

async function racks(db: D1Database, center?: string): Promise<RackSummary[]> {
  const sql = center ? `${rackSql} WHERE dc.id = ? ORDER BY r.name` : `${rackSql} ORDER BY r.name`;
  const result = center ? await db.prepare(sql).bind(center).all<RackRow>() : await db.prepare(sql).all<RackRow>();
  return result.results.map(toRack);
}

const json = (body: unknown, status = 200) => Response.json(body, {
  status, headers: { 'Cache-Control': 'no-store' },
});

function logApiError(event: string, method: string): void {
  console.error(JSON.stringify({ event, method, route: 'api' }));
}

async function api(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
  const url = new URL(request.url);
  const center = url.searchParams.get('datacenterId') || undefined;
  const path = url.pathname;

  if (path === '/api/health') {
    try {
      const result = await env.DB.prepare('SELECT 1 AS ok').first<{ ok: number }>();
      if (result?.ok !== 1) throw new Error('Health query returned no result');
      return json({ status: 'ok' });
    } catch {
      logApiError('worker_health_check_failed', request.method);
      return json({ status: 'unavailable' }, 503);
    }
  }

  if (path === '/api/datacenters') {
    const result = await env.DB.prepare('SELECT id, name FROM data_centers ORDER BY name').all<DataCenter>();
    return json(result.results);
  }
  if (path === '/api/servers') return json(await servers(env.DB, center));
  if (path === '/api/racks') return json(await racks(env.DB, center));
  if (path === '/api/alerts') {
    const [serverRows, rackRows] = await Promise.all([servers(env.DB, center), racks(env.DB, center)]);
    return json(evaluateAlerts(serverRows, rackRows));
  }

  const match = path.match(/^\/api\/servers\/([^/]+)$/);
  if (match) {
    const row = await env.DB.prepare(`${serverSql} WHERE s.id = ?`)
      .bind(decodeURIComponent(match[1])).first<ServerRow>();
    if (!row) return json({ error: 'Server not found' }, 404);
    const rack = await env.DB.prepare(`SELECT r.power_capacity_kw, rr.power_kw, rr.recorded_at
      FROM racks r LEFT JOIN rack_readings rr ON rr.rack_id = r.id WHERE r.id = ?`)
      .bind(row.rack_id).first<{ power_capacity_kw: number; power_kw: number | null; recorded_at: string | null }>();
    const detail: ServerDetail = {
      ...toServer(row), rackPowerCapacityKw: Number(rack?.power_capacity_kw),
      rackPowerKw: nullableNumber(rack?.power_kw), rackRecordedAt: rack?.recorded_at ?? null,
    };
    return json(detail);
  }

  const rackMatch = path.match(/^\/api\/racks\/([^/]+)$/);
  if (rackMatch) {
    const rackId = decodeURIComponent(rackMatch[1]);
    const rackRow = await env.DB.prepare(`${rackSql} WHERE r.id = ?`).bind(rackId).first<RackRow>();
    if (!rackRow) return json({ error: 'Rack not found' }, 404);

    const serverResult = await env.DB.prepare(`${serverSql} WHERE r.id = ? ORDER BY s.name`)
      .bind(rackId).all<ServerRow>();
    const detail: RackDetail = {
      ...toRack(rackRow),
      servers: serverResult.results.map(toServer),
    };
    return json(detail);
  }
  return json({ error: 'Not found' }, 404);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (!new URL(request.url).pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    try { return await api(request, env); }
    catch {
      logApiError('worker_api_request_failed', request.method);
      return json({ error: 'Unable to load dashboard data' }, 500);
    }
  },
};