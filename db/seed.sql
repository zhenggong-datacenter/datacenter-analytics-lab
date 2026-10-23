INSERT INTO data_centers (id, name) VALUES
  ('dc-north', 'Meridian North'),
  ('dc-south', 'Meridian South')
ON CONFLICT(id) DO UPDATE SET name = excluded.name;

INSERT INTO racks (id, datacenter_id, name, power_capacity_kw) VALUES
  ('rack-n1', 'dc-north', 'N-01', 32.0),
  ('rack-n2', 'dc-north', 'N-02', 32.0),
  ('rack-s1', 'dc-south', 'S-01', 32.0),
  ('rack-s2', 'dc-south', 'S-02', 32.0)
ON CONFLICT(id) DO UPDATE SET
  datacenter_id = excluded.datacenter_id,
  name = excluded.name,
  power_capacity_kw = excluded.power_capacity_kw;

WITH RECURSIVE slots(n) AS (
  SELECT 1
  UNION ALL SELECT n + 1 FROM slots WHERE n < 20
)
INSERT INTO servers (id, rack_id, name)
SELECT
  printf('srv-%02d', n),
  CASE
    WHEN n <= 5 THEN 'rack-n1'
    WHEN n <= 10 THEN 'rack-n2'
    WHEN n <= 15 THEN 'rack-s1'
    ELSE 'rack-s2'
  END,
  printf('compute-%02d', n)
FROM slots
WHERE 1
ON CONFLICT(id) DO UPDATE SET rack_id = excluded.rack_id, name = excluded.name;

WITH RECURSIVE slots(n) AS (
  SELECT 1
  UNION ALL SELECT n + 1 FROM slots WHERE n < 20
)
INSERT INTO server_readings (server_id, recorded_at, cpu_pct, memory_pct, storage_pct, temperature_c)
SELECT
  printf('srv-%02d', n),
  '2026-10-23T12:00:00.000Z',
  CASE WHEN n = 20 THEN NULL WHEN n = 4 THEN 91.0 WHEN n = 13 THEN 88.0 ELSE 22.0 + (n * 3 % 48) END,
  CASE WHEN n = 19 THEN NULL WHEN n = 9 THEN 94.0 WHEN n = 14 THEN 92.0 ELSE 48.0 + (n * 2 % 28) END,
  CASE WHEN n = 18 THEN NULL WHEN n = 6 THEN 93.0 ELSE 39.0 + (n * 4 % 41) END,
  CASE WHEN n = 17 THEN NULL WHEN n = 2 THEN 83.0 ELSE 37.0 + (n * 3 % 29) END
FROM slots
WHERE 1
ON CONFLICT(server_id) DO UPDATE SET
  recorded_at = excluded.recorded_at,
  cpu_pct = excluded.cpu_pct,
  memory_pct = excluded.memory_pct,
  storage_pct = excluded.storage_pct,
  temperature_c = excluded.temperature_c;

INSERT INTO rack_readings (rack_id, recorded_at, power_kw) VALUES
  ('rack-n1', '2026-10-23T12:00:00.000Z', 24.8),
  ('rack-n2', '2026-10-23T12:00:00.000Z', 29.4),
  ('rack-s1', '2026-10-23T12:00:00.000Z', 27.6),
  ('rack-s2', '2026-10-23T12:00:00.000Z', NULL)
ON CONFLICT(rack_id) DO UPDATE SET
  recorded_at = excluded.recorded_at,
  power_kw = excluded.power_kw;