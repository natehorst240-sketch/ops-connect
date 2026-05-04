# Table: `cr_user_filter_pref`

Per-user saved filter state for the MX Tracking + My Team Gantt views.
No flow writes — canvas-only.

## Display name

**User Filter Preference**

## Schema name

`cr_user_filter_pref`

## Primary column

`cr_pref_id` — Autonumber, format `UFP-{SEQNUM:000000}`.

## Columns

| Schema name              | Display              | Type                       | Required | Notes                                              |
| ------------------------ | -------------------- | -------------------------- | -------- | -------------------------------------------------- |
| `cr_pref_id`             | Preference ID        | Autonumber                 | System   | Format `UFP-{SEQNUM:000000}`.                       |
| `cr_user_email`          | User email           | Text (100)                 | Yes      | Effectively the row's natural key.                 |
| `cr_view`                | View                 | Choice                     | Yes      | `MX Tracking` / `My Team Weekly` / `My Team Monthly` / `Bulletin Feed`. |
| `cr_filter_json`         | Filter JSON          | Multiline text (4000)      | Yes      | JSON blob: `{aircraft, base, region, dateRange, levels, ...}` |
| `cr_last_updated`        | Last updated         | Date and time              | Yes      |                                                    |

## Permissions

- **Create / Read / Update:** Self only (item-level: "items where Created By = current user").
- **Delete:** Self.
- **No cross-user visibility.**

## Indexes

- `cr_user_email` + `cr_view` — composite, used as the lookup pattern
  on screen load.

## Implementation note

If you'd rather avoid a Dataverse table for trivial per-user state,
store in the canvas app's local user settings instead:

```powerapps
SaveData(varSavedFilters, "mxTrackingFilters")
LoadData(varSavedFilters, "mxTrackingFilters", false)
```

The table-backed approach gives cross-device persistence; `SaveData`
is device-local. Phase 1 ships with the table; Phase 2 may consolidate
to a Power Apps `User().Properties` extension.
