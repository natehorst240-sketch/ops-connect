# Phase 2 Tables

Four new Dataverse tables for the operations layer. Each spec keeps the
same structure as Phase 1 (`cr_mx_request.md`, `cr_audit.md`) but with
less ceremony — Phase 2 work happens after Phase 1 is in production, so
the pattern is established.

## `cr_aircraft`

**Display name:** Aircraft. **Schema:** `cr_aircraft`. **Primary:** `cr_tail`
(Text 8, e.g., `N431HC`).

| Schema             | Display       | Type                         | Notes                                          |
| ------------------ | ------------- | ---------------------------- | ---------------------------------------------- |
| `cr_tail`          | Tail          | Text (8)                     | Primary column                                 |
| `cr_type`          | Type          | Text (32)                    | E.g., AW109SP, Bell 407                        |
| `cr_base_id`       | Base          | Lookup → `cr_base`           | Home base (Phase 2 also adds a `cr_base` table) |
| `cr_region`        | Region        | Choice                       | 109 UT, SLC FW, WY/MT, ID/NV, CO/NM, UT/AZ, ...|
| `cr_status`        | Status        | Choice                       | IN_SERVICE, AOG, MAINTENANCE, AWAY_FROM_BASE   |
| `cr_status_reason` | Status reason | Text (200)                   | Free text                                      |
| `cr_serial`        | Serial number | Text (32)                    | From Veryon                                    |
| `cr_year`          | Year          | Whole number                 |                                                |
| `createdon`        | (system)      | Date and time                |                                                |

**Auditing:** enabled. **Index:** `cr_region`, `cr_status`.

---

## `cr_schedule_event`

**Display name:** Schedule Event. **Schema:** `cr_schedule_event`.
**Primary:** auto-numbered `cr_event_id` (format `EVT-{0:000000}`).

Mirror of CompleteFlight + ProteanHub schedule data. **Read-only** for
IHC users; only the polling flow writes here.

| Schema                | Display          | Type                         | Notes                                                       |
| --------------------- | ---------------- | ---------------------------- | ----------------------------------------------------------- |
| `cr_event_id`         | Event ID         | Autonumber                   | Primary                                                     |
| `cr_source_system`    | Source           | Choice                       | `CompleteFlight`, `ProteanHub`                              |
| `cr_source_event_id`  | Source event ID  | Text (50)                    | The ID at the source; used to upsert                        |
| `cr_aircraft_id`      | Aircraft         | Lookup → `cr_aircraft`       |                                                             |
| `cr_event_type`       | Type             | Choice                       | `inspection`, `mx`, `aog`, `pr`, `training`, `mission`      |
| `cr_label`            | Label            | Text (200)                   | Display label, e.g., "30-day Phase Inspection"              |
| `cr_window_start`     | Window start     | Date and time                |                                                             |
| `cr_window_end`       | Window end       | Date and time                |                                                             |
| `cr_priority`         | Priority         | Choice                       | `Normal`, `High`, `Critical`                                |
| `cr_base`             | Base             | Text (32)                    |                                                             |
| `cr_source_url`       | Source URL       | Text (500)                   | Deep link to the event in the source system                 |
| `cr_last_synced_at`   | Last synced      | Date and time                |                                                             |
| `createdon`           | (system)         | Date and time                |                                                             |

**Auditing:** enabled. **Index:** `cr_aircraft_id`, `cr_window_start`,
`cr_event_type`.

Upsert key: `(cr_source_system, cr_source_event_id)`.

---

## `cr_fleet_position`

**Display name:** Fleet Position. **Schema:** `cr_fleet_position`. **Primary:**
`cr_tail` (Text 8) — one row per aircraft, upserted on every SkyRouter
poll.

| Schema             | Display       | Type                         | Notes                                          |
| ------------------ | ------------- | ---------------------------- | ---------------------------------------------- |
| `cr_tail`          | Tail          | Text (8)                     | Primary; matches `cr_aircraft.cr_tail`         |
| `cr_lat`           | Latitude      | Decimal (8)                  |                                                |
| `cr_lon`           | Longitude     | Decimal (8)                  |                                                |
| `cr_altitude`      | Altitude (ft) | Whole number                 |                                                |
| `cr_bearing`       | Bearing (°)   | Whole number                 | 0–359                                          |
| `cr_speed`         | Speed (kt)    | Whole number                 |                                                |
| `cr_in_flight`     | In flight     | Yes/No                       | True if `cr_speed > 30`                        |
| `cr_last_seen_at`  | Last seen     | Date and time                |                                                |
| `cr_last_polled_at`| Last polled   | Date and time                | When SkyRouter was last queried                |

**Auditing:** disabled (high write volume; would bloat audit log).
**Index:** `cr_in_flight`.

---

## `cr_conflict`

**Display name:** Conflict. **Schema:** `cr_conflict`. **Primary:** auto-
numbered `cr_conflict_id` (format `CFL-{0:00000}`).

Computed by the conflict-detection flow. **Server-side write only**;
canvas app reads only. Acknowledgements (locally stored) update
`cr_acknowledged_by`.

| Schema                  | Display          | Type                       | Notes                                          |
| ----------------------- | ---------------- | -------------------------- | ---------------------------------------------- |
| `cr_conflict_id`        | Conflict ID      | Autonumber                 | Primary                                        |
| `cr_type`               | Type             | Choice                     | `double_booked`, `aog_cascade`, `overdue`, `coverage_gap`, `resource_conflict` |
| `cr_severity`           | Severity         | Choice                     | `critical`, `warning`                          |
| `cr_title`              | Title            | Text (200)                 | Human-readable summary                         |
| `cr_detail`             | Detail           | Multiline text (1000)      |                                                |
| `cr_suggestion`         | Suggested fix    | Multiline text (500)       | Plain-language remediation                     |
| `cr_event_ids`          | Event IDs        | Multiline text (500)       | JSON array of `cr_schedule_event` IDs          |
| `cr_actionable_event_id`| Actionable event | Lookup → `cr_schedule_event` | The event the user is asked to change          |
| `cr_actionable_source`  | Actionable source| Choice                     | `CompleteFlight` or `ProteanHub` (deep-link target) |
| `cr_acknowledged_by`    | Acknowledged by  | Lookup → `systemuser`      | Local acknowledgement; does not propagate      |
| `cr_acknowledged_at`    | Acknowledged at  | Date and time              |                                                |
| `cr_first_detected_at`  | First detected   | Date and time              |                                                |
| `cr_last_detected_at`   | Last detected    | Date and time              | Updated each detection run                     |

**Auditing:** enabled. **Index:** `cr_severity`, `cr_acknowledged_by`,
`cr_first_detected_at`.

Upsert key: deterministic ID derived from event IDs (e.g.,
`hash(sorted(cr_event_ids))`) so re-running detection doesn't dupe.
