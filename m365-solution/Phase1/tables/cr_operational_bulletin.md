# Table: `cr_operational_bulletin`

Director / RMM / QA-posted operational bulletins. Three levels (Alert /
Advisory / Info) drive home-screen color treatment. Resolve requires
written Resolution Notes.

## Display name

**Operational Bulletin**

## Schema name

`cr_operational_bulletin`

## Primary column

`cr_bulletin_id` — Autonumber, format `BUL-{SEQNUM:000000}`.

## Ownership + scope

- **Ownership:** User or team owned.
- **Business unit scoping:** Yes (regional bulletins scope to BU).

## Columns

| Schema name             | Display              | Type                       | Required | Default     | Notes                                                        |
| ----------------------- | -------------------- | -------------------------- | -------- | ----------- | ------------------------------------------------------------ |
| `cr_bulletin_id`        | Bulletin ID          | Autonumber                 | System   | —           | Format `BUL-{SEQNUM:000000}`. Primary column.                |
| `cr_subject`            | Subject              | Text (200)                 | Yes      | —           | One-line headline shown on every persona's home.             |
| `cr_body`               | Body                 | Multiline text (4000)      | Yes      | —           | Markdown supported (rendered as HtmlText in canvas).         |
| `cr_level`              | Level                | Choice                     | Yes      | Info        | `Alert` (red) / `Advisory` (amber) / `Info` (blue).          |
| `cr_audience`           | Audience             | Choice (multi)             | No       | All         | `All` / `AMT` / `RMM` / `Director` / `QA` / `Pilot` / `Scheduler` / `PR`. |
| `cr_region_id`          | Region               | Lookup → `cr_region`       | No       | —           | Optional region scoping; blank = all regions.                |
| `cr_status`             | Status               | Choice                     | Yes      | Active      | `Active` / `Resolved` / `Archived`.                          |
| `cr_posted_at`          | Posted at            | Date and time              | Yes      | `utcNow()`  | Set on canvas Patch.                                          |
| `cr_posted_by`          | Posted by            | Lookup → `systemuser`      | Yes      | `User()`    | Auto-set on canvas Patch.                                     |
| `cr_resolved_at`        | Resolved at          | Date and time              | No       | —           | Set when Status → Resolved.                                  |
| `cr_resolved_by`        | Resolved by          | Lookup → `systemuser`      | No       | —           | Set when Status → Resolved.                                  |
| `cr_resolution_notes`   | Resolution notes     | Multiline text (2000)      | No       | —           | **Required to set Status = Resolved.** Enforce in flow.      |
| `cr_audit_correlation`  | Audit correlation ID | Text (50)                  | Yes      | `GUID()`    | Joins post + resolve audit rows.                              |
| `createdon` / `modifiedon` / `createdby` | (system) | Date / Lookup       | System   | —           | Built-in.                                                     |

## Choice values

### `cr_level`

| Label    | Value | Color (UX) |
| -------- | ----- | ---------- |
| Alert    | 1     | Red        |
| Advisory | 2     | Amber      |
| Info     | 3     | Blue       |

### `cr_audience` (multi)

See `cr_mx_request.md` — same values.

### `cr_status`

| Label    | Value | Notes                                                       |
| -------- | ----- | ----------------------------------------------------------- |
| Active   | 1     | Default. Visible on home feed.                              |
| Resolved | 2     | Resolution Notes required. Moves to Bulletin Archive view.  |
| Archived | 3     | Manually archived (rare; usually goes Active → Resolved).   |

## Permissions

- **Create:** RMM, Director, QA (matrix § Submit row).
- **Read:** All roles except Payroll (matrix § See row).
- **Resolve (write to Status / Resolved\* / Resolution Notes):** RMM, Director, QA.
- **Permanent Delete:** Director only. Logged in audit with action
  `bulletin.permanently_deleted`.

## Indexes

- `cr_status` — home feed filters on Active.
- `cr_level` — sorting on home feed.
- `cr_posted_at` — chronological sort.
- `cr_region_id` — region scoping.

## Auto-bulletin on AOG flag (Phase 2 hook)

A `status-change-broadcast` flow watches `cr_aircraft.cr_status` and, on
transition to `AOG`, auto-creates an Active Alert bulletin with
`Subject = '{Tail} AOG — {Base}'` and the original status change reason
as the Body. Posted by the service account.
