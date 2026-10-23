PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS data_centers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS racks (
  id TEXT PRIMARY KEY,
  datacenter_id TEXT NOT NULL REFERENCES data_centers(id),
  name TEXT NOT NULL,
  power_capacity_kw REAL NOT NULL CHECK (power_capacity_kw > 0),
  UNIQUE (datacenter_id, name)
);

CREATE TABLE IF NOT EXISTS servers (
  id TEXT PRIMARY KEY,
  rack_id TEXT NOT NULL REFERENCES racks(id),
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS server_readings (
  server_id TEXT PRIMARY KEY REFERENCES servers(id),
  recorded_at TEXT NOT NULL,
  cpu_pct REAL,
  memory_pct REAL,
  storage_pct REAL,
  temperature_c REAL
);

CREATE TABLE IF NOT EXISTS rack_readings (
  rack_id TEXT PRIMARY KEY REFERENCES racks(id),
  recorded_at TEXT NOT NULL,
  power_kw REAL
);

CREATE INDEX IF NOT EXISTS racks_datacenter_id_idx ON racks(datacenter_id);
CREATE INDEX IF NOT EXISTS servers_rack_id_idx ON servers(rack_id);