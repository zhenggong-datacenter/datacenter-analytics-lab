# datacenter-analytics-lab
Data center capacity and health analytics using synthetic infrastructure data, built through agent-assisted software development.

## Start and preview in Codespaces

Requirements: Node.js 22.12+, 24.x, or 26+ and npm.

```sh
npm install
npm run db:setup
npm run dev
```

On first setup, Wrangler asks you to confirm the local D1 migration. `db:setup` then loads the repeatable synthetic seed. `npm run dev` builds the React app and starts the Cloudflare Worker emulator at `http://localhost:8787`. In Codespaces, open or forward port 8787 to preview the app. No Cloudflare account or deployment is needed.

To build and serve the production bundle locally after setup, run:

```sh
npm run preview
```

The preview is also served at `http://localhost:8787`.

Useful checks:

```sh
npm run typecheck
npm test
npm run build
```

## Dashboard and API

The dashboard covers 20 fictional servers across Meridian North and Meridian South, with overview, server details, rack power, data-center filtering, and latest-reading alerts. All values are simulated. Missing metric and rack readings remain unavailable rather than being interpreted as zero. Thresholds are demonstration values from [docs/requirements.md](docs/requirements.md).

The local Worker provides `GET /api/datacenters`, `GET /api/servers?datacenterId=...`, `GET /api/servers/:id`, `GET /api/racks?datacenterId=...`, and `GET /api/alerts?datacenterId=...`.

The local D1 database is named `capacity-db`; Wrangler stores its emulator state under `.wrangler/` (not committed). Rerunning `npm run db:setup` reapplies the seed deterministically.
