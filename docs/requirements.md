# Data Center Capacity and Health Dashboard

## Business problem
Data center operators need to identify resource constraints
and investigate unhealthy infrastructure before they affect services.

## Target user
A data center operations manager or capacity planner.

## Initial scope
- Use synthetic data only.
- Model 20 servers across two fictional data centers.
- Track CPU utilization, memory utilization, storage utilization,
  server temperature, and rack power consumption.
- Show an overview and individual server details.
- Allow filtering by data center.
- Display alerts with the affected resource, measured value,
  threshold, and timestamp.

## Initial alert rules
These are demonstration thresholds, not production standards.
- CPU utilization above 85%.
- Memory utilization above 90%.
- Storage utilization above 90%.
- Server temperature above 80 degrees Celsius.
- Rack power above 90% of its configured capacity.

## Acceptance criteria
- The overview displays all 20 servers.
- Selecting a data center shows only its servers.
- Each metric displays its unit.
- Alerts match the documented rules.
- Missing readings appear as unavailable, not zero.
- The interface clearly labels all data as simulated.
- `GET /api/health` performs a read-only D1 connectivity check and returns
  HTTP 200 when healthy or 503 when the database check fails.
- Health responses and server-side error logs do not expose credentials,
  tokens, or internal error details.
- The health endpoint remains protected by the existing Cloudflare Access
  policy.

## Later phases
- Historical trends and capacity forecasting.
- An AI assistant that explains alerts using available evidence.
- CI/CD, deployment, and expanded monitoring.

## Constraints
- Start within free service allowances.
- Never commit credentials or API keys.
- No real infrastructure changes or autonomous remediation.