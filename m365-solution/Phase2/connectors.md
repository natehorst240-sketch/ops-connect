# Phase 2 Custom Connectors

Four custom connectors bridge MX Connect to source systems. Each is
defined in OpenAPI 2.0 (Swagger) and lives in the `MXConnect` solution.
Auth: API key in header. One key per environment.

None of the four expose write APIs back — MX Connect is a read-only
mirror at the data layer. Edits happen at source.

## SkyRouter · fleet position polling

**Vendor:** Blue Sky Network. **Auth:** API key in `Authorization: Bearer`
header.

**Operation:** `GET /v1/positions`

Returns the latest position for every tail in the IHC fleet. Single call
polls all aircraft.

```yaml
swagger: "2.0"
info:
  title: SkyRouter
  version: "1.0"
host: api.skyrouter.com
schemes: [https]
basePath: /v1
securityDefinitions:
  apiKey:
    type: apiKey
    in: header
    name: Authorization
security: [{ apiKey: [] }]
paths:
  /positions:
    get:
      operationId: GetPositions
      summary: Latest position for every aircraft
      responses:
        "200":
          schema:
            type: array
            items:
              type: object
              properties:
                tail:           { type: string,  example: "N431HC" }
                lat:            { type: number,  format: double }
                lon:            { type: number,  format: double }
                altitude_ft:    { type: integer }
                bearing_deg:    { type: integer }
                speed_kt:       { type: integer }
                last_seen_at:   { type: string, format: date-time }
```

Polling cadence: every 15 min. Quota: ~96 calls/day (well within most API
tiers).

## Veryon (Flightdocs) · inspection due list

**Vendor:** Veryon. **Auth:** API key + tenant ID in header.

**Operations needed for Phase 2:**
- `GET /tenants/{tenantId}/aircraft` — master list (one-time + weekly
  reconciliation)
- `GET /tenants/{tenantId}/aircraft/{tail}/due-items` — inspection due
  list per tail

Polled by `scheduler-poll-flow-v1` daily for the master list, every 15
min for due items. Upserts to `cr_schedule_event` (event_type =
`inspection`).

## CompleteFlight · certs + training

**Vendor:** CompleteFlight. **Auth:** API key in `X-API-Key` header.

**Operations needed for Phase 2:**
- `GET /v2/inspections?status=upcoming&days=14`
- `GET /v2/training/scheduled`
- `GET /v2/certs?expiring_within_days=90` (Phase 3 cert dashboards)

Polling cadence: every 15 min. Upserts to `cr_schedule_event` with
`source = CompleteFlight`. Deep-link URL pattern:
`https://app.completeflight.com/inspections/{event_id}` (verify with
vendor).

## ProteanHub · missions + MX + AOG

**Vendor:** ProteanHub. **Auth:** API key in `X-API-Key` header (also
accepts OAuth client credentials — use API key for simplicity).

**Operations needed for Phase 2:**
- `GET /api/v1/missions?from={iso8601}&to={iso8601}`
- `GET /api/v1/maintenance/scheduled`
- `GET /api/v1/aog`
- `GET /api/v1/pr-flights`

Polling cadence: every 15 min. Upserts to `cr_schedule_event`. AOG events
are hot-pathed: any new AOG triggers an immediate Adaptive Card to the
Director + region RMM in addition to the standard polling sync.

## DLP classification

All four are custom connectors and default to the **Custom** classification
in a default DLP policy. IHC IT must explicitly classify each one as
Business so the Phase 2 flows can use them alongside the Microsoft
(Dataverse, Teams, Outlook) connectors. Coordinate this in Week 1.
