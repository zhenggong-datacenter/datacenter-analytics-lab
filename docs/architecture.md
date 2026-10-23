# Architecture — Initial Version

## Purpose
Implement the requirements in docs/requirements.md using
synthetic infrastructure data.

## Components
- React and TypeScript dashboard.
- Vite for frontend development and builds.
- Cloudflare Worker serving the API and built frontend assets.
- Cloudflare D1 database for inventory and metric readings.

## Data flow
1. A seed process loads repeatable synthetic data into the database.
2. The browser requests data from the API.
3. The API queries the database and evaluates alert rules.
4. The dashboard displays metrics, filters, details, and alerts.

## Data model
- Data centers: ID and name.
- Racks: ID, data center ID, and power capacity in kW.
- Servers: ID, rack ID, and name.
- Server readings: server ID, timestamp, CPU percentage,
  memory percentage, storage percentage, and temperature in Celsius.
- Rack readings: rack ID, timestamp, and power consumption in kW.

Rack power is recorded once per rack, not repeated for each server.
Missing readings are represented as null, not zero.
All timestamps use UTC.

## API outline
- GET /api/datacenters
- GET /api/servers?datacenterId=...
- GET /api/servers/:id
- GET /api/racks?datacenterId=...
- GET /api/alerts?datacenterId=...

## Alert evaluation
- Apply the thresholds in docs/requirements.md.
- Evaluate the latest available readings.
- Include resource, metric, value, unit, threshold, and timestamp.
- Do not generate a threshold alert from a missing reading.

## Development approach
- Develop and test inside Codespaces.
- Use local emulation for the Worker and database initially.
- Deploy to Cloudflare in a later step.
- Keep alert logic separate from the UI so it can be tested directly.

## Later extensions
- Historical trends and forecasting.
- An AI assistant that explains evidence returned by the API.
- Authentication and access controls before using private data.

## Initial boundaries
- Synthetic data only.
- No external AI API calls yet.
- No automated infrastructure changes.
