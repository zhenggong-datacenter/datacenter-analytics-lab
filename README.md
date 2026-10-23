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

The local Worker provides `GET /api/datacenters`, `GET /api/servers?datacenterId=...`, `GET /api/servers/:id`, `GET /api/racks?datacenterId=...`, `GET /api/alerts?datacenterId=...`, and `GET /api/health`. The health endpoint runs a read-only `SELECT 1` against D1, returning `200 {"status":"ok"}` when healthy and `503 {"status":"unavailable"}` when D1 cannot be reached. It does not reveal internal error details and remains behind the existing Cloudflare Access protection.

### Inspect Worker logs

Worker logs are persisted with query-string redaction enabled. In the Cloudflare dashboard, open **Workers & Pages**, select **datacenter-analytics-lab**, then open **Logs** (or **Observability → Logs**) to inspect invocation logs and structured application errors. To stream logs from an authenticated local terminal, run:

```sh
npx wrangler tail datacenter-analytics-lab
```

Application error events are JSON records containing an event name, HTTP method, and API route category; exception messages and request URLs are intentionally omitted.

The local D1 database is named `datacenter-analytics-db`; Wrangler stores its emulator state under `.wrangler/` (not committed). Rerunning `npm run db:setup` applies the seed deterministically.

## Deploy to Cloudflare

The Worker is `datacenter-analytics-lab` and uses the existing D1 database `datacenter-analytics-db` through the `DB` binding. The Worker URL is <https://datacenter-analytics-lab.zheng-gong.workers.dev>.

Before deployment, authenticate Wrangler with the Cloudflare account that owns these resources:

```sh
npx wrangler login
```

Run the following from the project root. The migration and seed commands are separate so you can review and run them independently. Remote database commands modify the existing D1 database; do not run them for a dry run or local preview.

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run deploy:dry-run
npm run db:migrate:remote
npm run db:seed:remote
npm run deploy
```

`db:migrate:remote` applies unapplied SQL files from `db/migrations` to the remote D1 database. `db:seed:remote` executes `db/seed.sql`. The seed uses upserts for its known synthetic IDs: it updates/replaces the matching synthetic rows and is repeatable, but it does **not** delete rows that are not named in the seed. Deployment publishes the built Worker and `dist/` assets.

Cloudflare Access protection is managed in the Cloudflare dashboard, not in this Wrangler configuration. Keep the existing Access policy protecting all traffic to the Worker URL; verify that policy remains enabled after deployment. This project adds no public endpoints or Access bypasses.
