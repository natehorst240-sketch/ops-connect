# Table: `cr_schedule_event`

Mirror of approved MX Requests for the MX Tracking calendar + My Team
Gantt views. Power Automate creates one `cr_schedule_event` row per
approved `cr_mx_request` so the calendar query is fast.

## Display name

**Schedule Event**

## Schema name

`cr_schedule_event`

## Primary column

`cr_event_id` — Autonumber, format `EVT-{SEQNUM:000000}`.

## Columns

| Schema name             | Display              | Type                       | Required | Notes                                                          |
| ----------------------- | -------------------- | -------------------------- | -------- | -------------------------------------------------------------- |
| `cr_event_id`           | Event ID             | Autonumber                 | System   | Format `EVT-{SEQNUM:000000}`. Primary column.                 |
| `cr_mx_request_id`      | MX Request           | Lookup → `cr_mx_request`  | Yes      | Source of truth.                                              |
| `cr_aircraft_id`        | Aircraft             | Lookup → `cr_aircraft`    | No       | Denormalized for fast filter.                                 |
| `cr_subject`            | Subject              | Text (200)                 | Yes      | E.g., `N431HC · 100-hr inspection`.                          |
| `cr_window_start`       | Window start         | Date and time              | Yes      |                                                                |
| `cr_window_end`         | Window end           | Date and time              | Yes      |                                                                |
| `cr_base_id`            | Base                 | Lookup → `cr_base`         | No       |                                                                |
| `cr_region_id`          | Region               | Lookup → `cr_region`       | No       |                                                                |
| `cr_request_type`       | Request type         | Choice                     | Yes      | Same enum as `cr_mx_request.cr_request_type`.                 |
| `cr_assigned_to`        | Assigned to          | Lookup → `systemuser`      | No       | Tech assigned (Phase 2 fills via scheduler).                  |
| `cr_outlook_event_id`   | Outlook event ID     | Text (200)                 | No       | Mirrors `cr_mx_request.cr_outlook_event_id`.                  |
| `cr_status`             | Status               | Choice                     | Yes      | `Scheduled` / `In Progress` / `Completed` / `Cancelled`.       |

## Choice values

### `cr_status`

| Label       | Value | Notes                                                       |
| ----------- | ----- | ----------------------------------------------------------- |
| Scheduled   | 1     | Default. Window in the future.                              |
| In Progress | 2     | Window started, not closed.                                 |
| Completed   | 3     | Closed by AMT (Phase 2).                                     |
| Cancelled   | 4     | MX Request cancelled → schedule event cancelled.            |

## Permissions

- **Read:** All app users.
- **Create / Update:** Scheduler (full); flow service account on approve.
- **Delete:** Scheduler.

## Indexes

- `cr_window_start` + `cr_window_end` — calendar queries.
- `cr_aircraft_id` — per-tail Gantt rows.
- `cr_base_id` + `cr_region_id` — filter views.

## Why a separate table from `cr_mx_request`

MX Requests includes Time Off, Ask Leadership, Safety Reports — things
that aren't on the maintenance calendar. Schedule Events is a denormalized
view limited to actually-on-the-calendar items. Calendar queries scan a
smaller table; permission model differs (everyone sees schedule, not
everyone sees raw MX Requests).
