import { afterEach, describe, expect, it, vi } from 'vitest';
import worker from './index';

function environment(db: D1Database) {
  return {
    DB: db,
    ASSETS: { fetch: vi.fn() } as unknown as Fetcher,
  };
}

describe('GET /api/health', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns healthy when the lightweight D1 query succeeds', async () => {
    const first = vi.fn().mockResolvedValue({ ok: 1 });
    const prepare = vi.fn().mockReturnValue({ first });
    const db = { prepare } as unknown as D1Database;
    const response = await worker.fetch(new Request('https://example.test/api/health'), environment(db));

    expect(prepare).toHaveBeenCalledWith('SELECT 1 AS ok');
    expect(first).toHaveBeenCalledOnce();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
  });

  it('returns a sanitized unavailable response and structured log when D1 fails', async () => {
    const first = vi.fn().mockRejectedValue(new Error('private database token detail'));
    const prepare = vi.fn().mockReturnValue({ first });
    const db = { prepare } as unknown as D1Database;
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = await worker.fetch(new Request('https://example.test/api/health'), environment(db));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: 'unavailable' });
    expect(log).toHaveBeenCalledOnce();
    expect(log).toHaveBeenCalledWith(JSON.stringify({
      event: 'worker_health_check_failed',
      method: 'GET',
      route: 'api',
    }));
    expect(log.mock.calls[0].join(' ')).not.toContain('private database token detail');
  });
});
