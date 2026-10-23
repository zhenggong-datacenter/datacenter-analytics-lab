import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, ArrowLeft, ChevronRight, Cpu, HardDrive, MemoryStick, Server, Thermometer, Zap } from 'lucide-react';
import type { ReactNode } from 'react';
import { api } from './api';
import type { Alert, DataCenter, RackDetail, RackSummary, ServerDetail, ServerSummary } from '../shared/model';
import { summarizeRackPower } from '../shared/rackPowerSummary';
import { openAlertDestination } from '../shared/alertNavigation';

type View = 'overview' | 'servers' | 'alerts';
type MetricKey = 'cpuPct' | 'memoryPct' | 'storagePct' | 'temperatureC';
const metrics: { key: MetricKey; label: string; unit: string; Icon: typeof Cpu }[] = [
  { key: 'cpuPct', label: 'CPU', unit: '%', Icon: Cpu },
  { key: 'memoryPct', label: 'Memory', unit: '%', Icon: MemoryStick },
  { key: 'storagePct', label: 'Storage', unit: '%', Icon: HardDrive },
  { key: 'temperatureC', label: 'Temperature', unit: '°C', Icon: Thermometer },
];

const stamp = (value: string | null) => value === null ? 'Unavailable' :
  `${new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })} UTC`;
const valueText = (value: number | null, unit: string, digits = 1) => value === null ? 'Unavailable' : `${value.toFixed(digits)} ${unit}`;

export default function App() {
  const [centers, setCenters] = useState<DataCenter[]>([]);
  const [center, setCenter] = useState('');
  const [servers, setServers] = useState<ServerSummary[]>([]);
  const [racks, setRacks] = useState<RackSummary[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [detail, setDetail] = useState<ServerDetail | null>(null);
  const [rackDetail, setRackDetail] = useState<RackDetail | null>(null);
  const [view, setView] = useState<View>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.datacenters().then((items) => { if (active) setCenters(items); })
      .catch((e: unknown) => { if (active) setError(e instanceof Error ? e.message : 'Unable to load data centers'); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    Promise.all([api.servers(center), api.racks(center), api.alerts(center)])
      .then(([serverData, rackData, alertData]) => {
        if (!active) return;
        setServers(serverData); setRacks(rackData); setAlerts(alertData);
      })
      .catch((e: unknown) => { if (active) setError(e instanceof Error ? e.message : 'Unable to load dashboard data'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [center]);

  const openServer = async (serverId: string) => {
    setRackDetail(null);
    try { setDetail(await api.server(serverId)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to load server details'); }
  };
  const open = (server: ServerSummary) => openServer(server.id);
  const openRack = async (rackId: string) => {
    setDetail(null);
    try { setRackDetail(await api.rack(rackId)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to load rack details'); }
  };
  const openAlert = (alert: Alert) => openAlertDestination(alert, { server: openServer, rack: openRack });
  const go = (next: View) => { setDetail(null); setRackDetail(null); setView(next); };
  const title = detail?.name ?? rackDetail?.name ?? (view === 'overview' ? 'Overview' : view === 'servers' ? 'Servers' : 'Alerts');

  return <div className="shell">
    <aside className="sidebar">
      <a className="brand" href="#overview" onClick={() => go('overview')}><span className="brand-icon"><Activity size={18} /></span><span>meridian<small>INFRASTRUCTURE</small></span></a>
      <div className="side-label">MONITORING</div>
      <nav aria-label="Main navigation">
        <NavButton active={view === 'overview' && !detail} onClick={() => go('overview')} Icon={Activity}>Overview</NavButton>
        <NavButton active={view === 'servers' && !detail} onClick={() => go('servers')} Icon={Server}>Servers <small>{servers.length}</small></NavButton>
        <NavButton active={view === 'alerts'} onClick={() => go('alerts')} Icon={AlertTriangle}>Alerts <small>{alerts.length}</small></NavButton>
      </nav>
      <div className="side-state"><i /> Simulation active <span>LOCAL</span></div>
    </aside>
    <main>
      <header className="topbar">
        <div className="crumb">Infrastructure <ChevronRight size={14} /> <strong>{title}</strong></div>
        <div className="top-actions"><span className="sim-tag"><i /> SIMULATED DATA</span><label htmlFor="center">Data center</label>
          <select id="center" value={center} onChange={(event) => { setCenter(event.target.value); setDetail(null); setRackDetail(null); }}>
            <option value="">All data centers</option>{centers.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
          </select>
        </div>
      </header>
      <div className="content">
        {error && <div className="error" role="alert">{error}</div>}
        {detail ? <ServerPage server={detail} onBack={() => setDetail(null)} onOpenRack={openRack} /> : rackDetail ?
          <RackPage rack={rackDetail} onBack={() => setRackDetail(null)} onOpenServer={openServer} /> : view === 'alerts' ? <AlertsPage alerts={alerts} loading={loading} onOpen={openAlert} /> : view === 'servers' ?
          <ServersPage servers={servers} loading={loading} onOpen={open} /> :
          <Overview servers={servers} racks={racks} alerts={alerts} loading={loading} centerName={centers.find((item) => item.id === center)?.name ?? 'All data centers'} onOpen={open} onAlerts={() => go('alerts')} />}
        <footer><span>SIMULATION ONLY · NOT CONNECTED TO LIVE INFRASTRUCTURE</span><span>Readings shown in UTC</span></footer>
      </div>
    </main>
  </div>;
}

function NavButton({ active, onClick, Icon, children }: { active: boolean; onClick: () => void; Icon: typeof Activity; children: ReactNode }) {
  return <button className={`nav-button${active ? ' active' : ''}`} onClick={onClick}><Icon size={17} />{children}</button>;
}

function Heading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

function Overview({ servers, racks, alerts, loading, centerName, onOpen, onAlerts }: { servers: ServerSummary[]; racks: RackSummary[]; alerts: Alert[]; loading: boolean; centerName: string; onOpen: (server: ServerSummary) => void; onAlerts: () => void }) {
  const average = (key: MetricKey) => {
    const samples = servers.map((server) => server.metrics[key]).filter((v): v is number => v !== null);
    return samples.length ? samples.reduce((sum, v) => sum + v, 0) / samples.length : null;
  };
  const power = summarizeRackPower(racks);
  const readings = servers.filter((server) => server.metrics.recordedAt !== null).length;
  return <>
    <Heading eyebrow="CAPACITY & HEALTH" title="Infrastructure overview" description={`${centerName} · Snapshot of simulated infrastructure`} />
    <div className="snapshot"><i /> SYNTHETIC SNAPSHOT <span>/</span> 23 OCT 2026 · 12:00 UTC</div>
    <section className="stats" aria-label="Infrastructure summary">
      <Stat label="Servers" value={loading ? '—' : String(servers.length)} note={`${readings} with latest readings`} Icon={Server} tone="green" />
      <Stat label="Active alerts" value={loading ? '—' : String(alerts.length)} note={alerts.length ? 'Thresholds exceeded' : 'No thresholds exceeded'} Icon={AlertTriangle} tone={alerts.length ? 'red' : 'green'} />
      <Stat label="Average CPU" value={valueText(average('cpuPct'), '%')} note="Available readings only" Icon={Cpu} tone="blue" />
      <Stat label="Rack power" value={loading && !racks.length ? '—' : power.measuredKw === null ? 'Unavailable' : `${power.measuredKw.toFixed(1)} kW measured`} note={`Racks missing readings: ${power.missingReadings}`} Icon={Zap} tone="orange" />
    </section>
    <div className="section-head"><div><h2>Server fleet</h2><span>{servers.length} INVENTORY ITEMS · {readings} WITH READINGS</span></div><button className="text-link" onClick={onAlerts}>View alerts <ChevronRight size={14} /></button></div>
    <ServerTable servers={servers} loading={loading} onOpen={onOpen} />
    <div className="section-head"><div><h2>Rack power</h2><span>POWER IS MEASURED ONCE PER RACK</span></div></div>
    <RackTable racks={racks} loading={loading} />
  </>;
}

function Stat({ label, value, note, Icon, tone }: { label: string; value: string; note: string; Icon: typeof Cpu; tone: string }) {
  return <article className="stat"><div>{label}<span className={`stat-icon ${tone}`}><Icon size={16} /></span></div><strong>{value}</strong><small>{note}</small></article>;
}

function ServersPage({ servers, loading, onOpen }: { servers: ServerSummary[]; loading: boolean; onOpen: (server: ServerSummary) => void }) {
  return <><Heading eyebrow="INVENTORY" title="Servers" description="Latest utilization and thermal readings for each server." /><ServerTable servers={servers} loading={loading} onOpen={onOpen} /></>;
}

function ServerTable({ servers, loading, onOpen }: { servers: ServerSummary[]; loading: boolean; onOpen: (server: ServerSummary) => void }) {
  return <div className="table-wrap"><table><thead><tr><th>Server</th><th>Data center / rack</th><th>CPU</th><th>Memory</th><th>Storage</th><th>Temperature</th><th /></tr></thead><tbody>
    {loading ? <tr><td colSpan={7} className="empty">Loading readings…</td></tr> : !servers.length ? <tr><td colSpan={7} className="empty">No servers found for this data center.</td></tr> : servers.map((s) => <tr key={s.id} className="server-row" tabIndex={0} onClick={() => onOpen(s)} onKeyDown={(e) => { if (e.key === 'Enter') onOpen(s); }}>
      <td><strong>{s.name}</strong><small>{s.id}</small></td><td><strong>{s.datacenterName}</strong><small>Rack {s.rackName}</small></td>
      {metrics.map(({ key, unit }) => <MetricCell key={key} value={s.metrics[key]} unit={unit} />)}<td><ChevronRight className="chevron" size={15} /></td>
    </tr>)}
  </tbody></table></div>;
}

function MetricCell({ value, unit }: { value: number | null; unit: string }) {
  return <td className={value !== null && ((unit === '°C' && value > 80) || (unit === '%' && value > 85)) ? 'high' : ''}>{value === null ? <em>Unavailable</em> : <>{value.toFixed(1)} <small>{unit}</small></>}</td>;
}

function RackTable({ racks, loading }: { racks: RackSummary[]; loading: boolean }) {
  return <div className="table-wrap"><table><thead><tr><th>Rack</th><th>Data center</th><th>Power used</th><th>Capacity</th><th>Load</th><th>Reading time</th></tr></thead><tbody>
    {loading ? <tr><td colSpan={6} className="empty">Loading rack readings…</td></tr> : !racks.length ? <tr><td colSpan={6} className="empty">No racks found.</td></tr> : racks.map((r) => {
      const load = r.powerKw === null ? null : r.powerKw / r.powerCapacityKw * 100;
      return <tr key={r.id}><td><strong>{r.name}</strong><small>{r.id}</small></td><td>{r.datacenterName}</td><td>{valueText(r.powerKw, 'kW')}</td><td>{r.powerCapacityKw} kW</td><td>{load === null ? <em>Unavailable</em> : `${load.toFixed(1)}%`}</td><td>{stamp(r.recordedAt)}</td></tr>;
    })}
  </tbody></table></div>;
}

function AlertsPage({ alerts, loading, onOpen }: { alerts: Alert[]; loading: boolean; onOpen: (alert: Alert) => void }) {
  return <>
    <Heading eyebrow="THRESHOLD MONITORING" title="Alerts" description="Latest readings above documented demonstration thresholds." action={<span className="alert-count"><AlertTriangle size={14} /> {alerts.length} ACTIVE</span>} />
    <div className="thresholds"><strong>DEMONSTRATION THRESHOLDS</strong><span>CPU &gt; 85%</span><span>Memory &gt; 90%</span><span>Storage &gt; 90%</span><span>Temperature &gt; 80 °C</span><span>Rack power &gt; 90% capacity</span></div>
    <div className="alerts">{loading ? <div className="empty-panel">Evaluating latest readings…</div> : !alerts.length ? <div className="empty-panel"><Activity size={21} /><strong>No active alerts</strong><span>No available reading exceeds its demonstration threshold.</span></div> : alerts.map((a) => <article className="alert-row" key={a.id}>
      <AlertTriangle size={16} /><div><strong>{a.resource}</strong><small><button className="alert-resource-link" aria-label={`Open ${a.targetType} details for ${a.sourceName}`} onClick={() => onOpen(a)}>{a.sourceName}</button> · {a.datacenterName}</small></div>
      <div className="reading"><strong>{a.value.toFixed(1)} {a.unit}</strong><small>Threshold {a.threshold.toFixed(1)} {a.unit}</small></div><time>{stamp(a.timestamp)}</time>
    </article>)}</div>
  </>;
}

function ServerPage({ server, onBack, onOpenRack }: { server: ServerDetail; onBack: () => void; onOpenRack: (rackId: string) => void }) {
  return <>
    <button className="back" onClick={onBack}><ArrowLeft size={14} /> Back to servers</button>
    <Heading eyebrow={`${server.datacenterName.toUpperCase()} · RACK ${server.rackName}`} title={server.name} description={`${server.id} · Latest reading ${stamp(server.metrics.recordedAt)}`} />
    <div className="details">{metrics.map(({ key, label, unit, Icon }) => <article key={key}><Icon size={17} /><span>{label}</span><strong>{valueText(server.metrics[key], unit)}</strong><small>{key === 'temperatureC' ? 'degrees Celsius' : 'utilization'}</small></article>)}</div>
    <div className="section-head"><div><h2>Rack context</h2><span>POWER IS MEASURED ONCE PER RACK</span></div></div>
    <div className="table-wrap"><table><thead><tr><th>Rack</th><th>Current power</th><th>Power capacity</th><th>Reading time</th></tr></thead><tbody><tr><td><button className="alert-resource-link" onClick={() => onOpenRack(server.rackId)}>{server.rackName}</button><small>{server.rackId}</small></td><td>{valueText(server.rackPowerKw, 'kW')}</td><td>{server.rackPowerCapacityKw} kW</td><td>{stamp(server.rackRecordedAt)}</td></tr></tbody></table></div>
  </>;
}

function RackPage({ rack, onBack, onOpenServer }: { rack: RackDetail; onBack: () => void; onOpenServer: (serverId: string) => void }) {
  const load = rack.powerKw === null ? null : rack.powerKw / rack.powerCapacityKw * 100;
  return <>
    <button className="back" onClick={onBack}><ArrowLeft size={14} /> Back</button>
    <Heading eyebrow={`${rack.datacenterName.toUpperCase()} · RACK`} title={rack.name} description={`${rack.id} · Latest reading ${stamp(rack.recordedAt)}`} />
    <div className="details rack-details">
      <article><Zap size={17} /><span>Power used</span><strong>{valueText(rack.powerKw, 'kW')}</strong><small>Current rack reading</small></article>
      <article><Activity size={17} /><span>Power capacity</span><strong>{rack.powerCapacityKw} kW</strong><small>Configured rack capacity</small></article>
      <article><Activity size={17} /><span>Capacity load</span><strong>{load === null ? 'Unavailable' : `${load.toFixed(1)}%`}</strong><small>Based on available reading</small></article>
      <article><Server size={17} /><span>Associated servers</span><strong>{rack.servers.length}</strong><small>Inventory in this rack</small></article>
    </div>
    <div className="section-head"><div><h2>Associated servers</h2><span>SERVER DETAILS LOAD BY ID, REGARDLESS OF THE ACTIVE FILTER</span></div></div>
    <div className="table-wrap"><table><thead><tr><th>Server</th><th>CPU</th><th>Memory</th><th>Storage</th><th>Temperature</th></tr></thead><tbody>
      {rack.servers.length ? rack.servers.map((server) => <tr key={server.id}><td><button className="alert-resource-link" onClick={() => onOpenServer(server.id)}>{server.name}</button><small>{server.id}</small></td>{metrics.map(({ key, unit }) => <MetricCell key={key} value={server.metrics[key]} unit={unit} />)}</tr>) : <tr><td colSpan={5} className="empty">No servers are assigned to this rack.</td></tr>}
    </tbody></table></div>
  </>;
}