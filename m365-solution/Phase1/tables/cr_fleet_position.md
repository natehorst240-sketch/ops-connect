# Table: `cr_fleet_position`

**Phase 2 canonical.** Live aircraft positions from SkyRouter (Iridium
satellite tracking). Polled by a Power Automate flow on a 1-minute
recurrence; written here for the live Fleet Map.

> **Not part of Phase 1.** Phase 1 has no SkyRouter integration. The
> seed data in the CSV exists for Phase 2 development reference.

## Display name

**Fleet Position**

## Schema name

`cr_fleet_position`

## Primary column

`cr_tail` — Text (8). E.g., `N431HC`. The tail is the natural key —
one row per aircraft, upserted by the sync flow on every poll.

## Columns

Matches `m365-solution/sharepoint-lists/09-fleet-positions.csv` (8 seed
rows):

| Schema name              | Display              | Type                       | Required | Notes                                                                                |
| ------------------------ | -------------------- | -------------------------- | -------- | ------------------------------------------------------------------------------------ |
| `cr_tail`                | Tail                 | Lookup → `cr_aircraft`     | Yes      | Primary identifier. The tail is the natural key.                                    |
| `cr_latitude`            | Latitude             | Floating point             | Yes      | E.g., `41.7878`. Decimal degrees, WGS84.                                             |
| `cr_longitude`           | Longitude            | Floating point             | Yes      | E.g., `-111.852`. Decimal degrees, WGS84.                                            |
| `cr_altitude`            | Altitude             | Whole number               | No       | Feet MSL. `0` when on ground.                                                        |
| `cr_bearing`             | Bearing              | Whole number               | No       | Degrees from true north (0–359). `0` when stationary.                                |
| `cr_speed`               | Speed                | Whole number               | No       | Knots. `0` when stationary.                                                          |
| `cr_in_flight`           | In Flight            | Yes/No                     | Yes      | True when speed > 30 kt or altitude > 500 ft AGL. Computed by the poll flow.        |
| `cr_last_seen_at`        | Last Seen At         | Date and time              | Yes      | When SkyRouter last received a position fix from the aircraft.                       |
| `cr_last_polled_at`      | Last Polled At       | Date and time              | Yes      | When the sync flow last queried SkyRouter.                                           |

**Why `cr_tail` is the primary identifier:** SkyRouter's API returns
one latest-position record per asset. We don't keep position history
in Phase 2 (would need archival rotation; Power BI Phase 3 streaming
dataset handles history instead). One row per aircraft, upsert on poll.

## Permissions

- **Read:** All app users with map access (RMM/Director/QA/Scheduler
  via the role matrix).
- **Create / Update:** Service account only (the SkyRouter poll flow).
- **Delete:** None. Service account upserts; rows persist even when
  aircraft are inactive.

## Indexes

- `cr_in_flight` — dashboard filter for active flights.
- `cr_last_seen_at` — stale-data detection (alert if > 15 min for an
  in-service tail).
- `cr_last_polled_at` — sync-flow health monitoring.

## Seed data

Populate from `m365-solution/sharepoint-lists/09-fleet-positions.csv`.
**8 seed rows** with realistic coordinates for development.

## Stale-row alert (Phase 2 flow)

A second flow runs every 15 minutes and checks for any aircraft where
`cr_aircraft.cr_status = In Service` AND
`cr_last_seen_at < utcNow() - 15 minutes`. Posts a Teams advisory to
the Director channel — likely a SkyRouter outage or aircraft comm
issue.
