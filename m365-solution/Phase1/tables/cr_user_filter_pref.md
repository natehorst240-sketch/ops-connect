# Table: `cr_user_filter_pref`

> **⚠️ EXTENSION TABLE — NOT IN CANONICAL CSV.**
>
> This table was added during the role-capability-matrix expansion
> (MC Documentation v3). It does **not** appear in
> `m365-solution/sharepoint-lists/` and has no canonical seed data.
>
> **Don't build this table for the canonical Phase 1 deployment.** The
> canonical 11 tables cover the documented IHC requirements. This
> table is reserved for the **MX Tracking module's saved filter
> preferences** — per-user persistent filter state.
>
> Alternative: use Power Apps' built-in `SaveData` / `LoadData` for
> device-local persistence (no Dataverse table needed). The table-backed
> approach gains cross-device persistence; the local-storage approach is
> simpler.

---

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

## Implementation note (alternative, no table needed)

If you'd rather avoid a Dataverse table for trivial per-user state,
store in the canvas app's local user settings instead:

```powerapps
SaveData(varSavedFilters, "mxTrackingFilters")
LoadData(varSavedFilters, "mxTrackingFilters", false)
```

The table-backed approach gives cross-device persistence; `SaveData`
is device-local. Pick one based on whether users expect their filters
to follow them across devices.
