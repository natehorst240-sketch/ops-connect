# Phase 1 — Naming Conventions

Canonical source of truth for every name in the Phase 1 build. If any
other doc disagrees with this one, **this doc wins**. Fix the other
doc, don't fork the convention.

The spec docs in `tables/cr_*.md`, the flow JSON in
`flows/mxr-approval-flow-v2.json`, and the canvas app guide in
`powerfx/canvas-app.md` are the runtime source — this doc reconciles
the prose around them.

---

## 1. Solution + publisher

| Item                    | Value         | Notes                                            |
| ----------------------- | ------------- | ------------------------------------------------ |
| Solution display name   | `MX Connect`  | With space.                                      |
| Solution unique name    | `MXConnect`   | No space, PascalCase.                            |
| Publisher display name  | `IHC`         |                                                  |
| Publisher unique name   | `ihc`         | Lowercase.                                       |
| **Publisher prefix**    | `cr`          | Resulting schema names: `cr_*`. **Critical** — every spec assumes this. |
| Choice value prefix     | `10000`       | Default.                                         |

If your environment auto-set a different prefix (`cr87b_`, `new_`),
follow `rebuild-from-clean-state.md` to fix before continuing.

---

## 2. Table names

**Convention:** Display name in **singular**. Power Apps auto-generates
the plural. Schema name in singular `cr_*`.

| #  | Schema name (singular)       | Display name (singular)    | Display name (plural — auto)  |
| -- | ---------------------------- | -------------------------- | ----------------------------- |
| 1  | `cr_region`                  | Region                     | Regions                       |
| 2  | `cr_aircraft_type`           | Aircraft Type              | Aircraft Types                |
| 3  | `cr_base`                    | Base                       | Bases                         |
| 4  | `cr_aircraft`                | Aircraft                   | Aircraft *(invariant)*        |
| 5  | `cr_personnel_maintenance`   | `Personnel - Maintenance`  | `Personnel - Maintenance` *(invariant)* |
| 6  | `cr_personnel_crew`          | `Personnel - Crew`         | `Personnel - Crew` *(invariant)* |
| 7  | `cr_mx_request`              | MX Request                 | MX Requests                   |
| 8  | `cr_audit`                   | MX Audit                   | MX Audits                     |
| 9  | `cr_operational_bulletin`    | Operational Bulletin       | Operational Bulletins         |
| 10 | `cr_safety_report`           | Safety Report              | Safety Reports                |
| 11 | `cr_aircraft_status_log`     | Aircraft Status Log        | Aircraft Status Logs          |
| 12 | `cr_personnel_status_log`    | Personnel Status Log       | Personnel Status Logs         |
| 13 | `cr_mx_request_comment`      | MX Request Comment         | MX Request Comments           |
| 14 | `cr_user_filter_pref`        | User Filter Preference     | User Filter Preferences       |
| 15 | `cr_schedule_event`          | Schedule Event             | Schedule Events               |

### Personnel tables — separator

**Use a regular hyphen `-` (with one space on each side), NOT an em
dash (—).** Reasons:

- Easier to type without a special-character lookup
- Doesn't break in CSV import / Excel / SQL contexts
- Renders identically in all browsers and the Power Apps Studio data
  pane

So: `Personnel - Maintenance` ✅ — `Personnel — Maintenance` ❌.

If older docs show em dash, treat as a typo. The schema name stays
`cr_personnel_maintenance` either way (Dataverse strips
non-alphanumerics for schema names).

### Power Fx reference style

In Power Fx formulas, Power Apps surfaces tables by their **plural
display name** when there's a space:

```powerapps
Filter('MX Requests', Status = 'Status (MX Request)'.Submitted)
LookUp('Personnel - Maintenance', Email = User().Email)
Filter(Aircraft, Status = 'Status (Aircraft)'.AOG)    // singular when invariant
```

Quotes are required when the name has a space or hyphen. Schema names
(`cr_mx_request`) are NEVER referenced from Power Fx — only display
names.

---

## 3. Schema name format (columns)

**Convention:** all lowercase, snake_case, prefixed with `cr_`. Power
Apps auto-generates these from the column display name; only override
if it's wrong.

| Column display name      | Schema name                |
| ------------------------ | -------------------------- |
| Tail                     | `cr_tail`                  |
| Aircraft Tail            | `cr_aircraft_tail`         |
| Window Start             | `cr_window_start`          |
| Audit Correlation        | `cr_audit_correlation`     |
| More Info Request        | `cr_more_info_request`     |
| Posted By                | `cr_posted_by`             |
| Resolution Notes         | `cr_resolution_notes`      |

### Lookup column quirks

When you create a Lookup column with display name `Aircraft Tail`,
Dataverse creates two related fields:

- `cr_aircraft_tail` — Lookup field as referenced in Power Fx + form bindings
- `_cr_aircraft_tail_value` — GUID-only column used in OData / flow JSON
  (`triggerOutputs()?['body/_cr_aircraft_tail_value']`)

Don't get confused. Use:

- **Display name** in Power Fx (`record.'Aircraft Tail'.Tail`)
- **`cr_*` schema** in the column list / Update Record actions
  (`item/cr_aircraft_tail@odata.bind`)
- **`_cr_*_value` form** for reading the raw GUID from a trigger
  payload (`triggerOutputs()?['body/_cr_aircraft_tail_value']`)

---

## 4. Global Choice naming

**Convention:** `<Field display name> (<Singular table display name>)`.
Singular even though tables auto-pluralize — Choice describes one
entity's enum, not a collection.

### All 22 Phase 1 Choices

| Choice display name                       | Choice schema name              | Used by                                     |
| ----------------------------------------- | ------------------------------- | ------------------------------------------- |
| `Status (MX Request)`                     | `cr_mx_request_status`          | `cr_mx_request`                             |
| `Routing (MX Request)`                    | `cr_mx_request_routing`         | `cr_mx_request`                             |
| `Decision (MX Request)`                   | `cr_mx_request_decision`        | `cr_mx_request`                             |
| `Priority (MX Request)`                   | `cr_mx_request_priority`        | `cr_mx_request`                             |
| `Request Type (MX Request)`               | `cr_mx_request_type`            | `cr_mx_request`                             |
| `Audience (MX Request)`                   | `cr_mx_request_audience`        | `cr_mx_request`, `cr_operational_bulletin`  |
| `Status (Aircraft)`                       | `cr_aircraft_status`            | `cr_aircraft`, `cr_aircraft_status_log`     |
| `Status (Personnel - Maintenance)`        | `cr_personnel_status`           | `cr_personnel_maintenance`, `cr_personnel_status_log` |
| `Action Type (Personnel Status Log)`      | `cr_personnel_status_log_action_type` | `cr_personnel_status_log`             |
| `Action (MX Audit)`                       | `cr_audit_action`               | `cr_audit`                                  |
| `Level (Operational Bulletin)`            | `cr_bulletin_level`             | `cr_operational_bulletin`                   |
| `Status (Operational Bulletin)`           | `cr_bulletin_status`            | `cr_operational_bulletin`                   |
| `Severity (Safety Report)`                | `cr_safety_severity`            | `cr_safety_report`                          |
| `Status (Safety Report)`                  | `cr_safety_status`              | `cr_safety_report`                          |
| `Visible To Roles (MX Request Comment)`   | `cr_comment_visible_to_roles`   | `cr_mx_request_comment`                     |
| `View (User Filter Preference)`           | `cr_filter_pref_view`           | `cr_user_filter_pref`                       |
| `Class (Aircraft Type)`                   | `cr_aircraft_class`             | `cr_aircraft_type`, `cr_aircraft`           |
| `Type (Region)`                           | `cr_region_type`                | `cr_region`                                 |
| `Operations (Base)`                       | `cr_base_operations`            | `cr_base`                                   |
| `Role (Personnel - Maintenance)`          | `cr_personnel_maintenance_role` | `cr_personnel_maintenance`                  |
| `Role (Personnel - Crew)`                 | `cr_personnel_crew_role`        | `cr_personnel_crew`                         |
| `Specialty (Personnel - Crew)`            | `cr_personnel_crew_specialty`   | `cr_personnel_crew`                         |

### Power Fx reference

```powerapps
// Read
record.Status                                  // returns the choice option (label + value)
record.Status.Value                            // returns string label like "Submitted"

// Compare (type-safe — preferred)
record.Status = 'Status (MX Request)'.Submitted

// Compare (string — works but loses type safety)
record.Status.Value = "Submitted"

// Patch (write)
Patch('MX Requests', record, {
    Status: 'Status (MX Request)'.Approved
})
```

---

## 5. Choice option labels + numeric values

**Always use Title Case for option labels**, with spaces. **Never**
use snake_case or camelCase.

| Choice                              | Option label             | Numeric value |
| ----------------------------------- | ------------------------ | ------------- |
| Status (MX Request)                 | `Submitted`              | 1             |
|                                     | `Approved`               | 2             |
|                                     | `Denied`                 | 3             |
|                                     | `More Info Requested`    | 4             |
|                                     | `Escalated`              | 5             |
|                                     | `Cancelled`              | 6             |
| Routing (MX Request)                | `RMM`                    | 1             |
|                                     | `Scheduler`              | 2             |
|                                     | `Director`               | 3             |
| Decision (MX Request)               | `Approve`                | 1             |
|                                     | `Deny`                   | 2             |
|                                     | `Request Info`           | 3             |
|                                     | `Escalate`               | 4             |
| Priority (MX Request)               | `Normal`                 | 1             |
|                                     | `High`                   | 2             |
|                                     | `AOG`                    | 3             |
| Request Type (MX Request)           | `MX Schedule`            | 1             |
|                                     | `Aircraft Movement (PR)` | 2             |
|                                     | `Pilot Training`         | 3             |
|                                     | `Time Off`               | 4             |
|                                     | `Ask Leadership`         | 5             |
|                                     | `Other`                  | 99            |
| Audience (MX Request)               | `All`                    | 1             |
|                                     | `RMM`                    | 2             |
|                                     | `Director`               | 3             |
|                                     | `QA`                     | 4             |
|                                     | `Scheduler`              | 5             |
|                                     | `Pilot`                  | 6             |
|                                     | `PR`                     | 7             |
| Status (Aircraft)                   | `In Service`             | 1             |
|                                     | `AOG`                    | 2             |
|                                     | `Maintenance`            | 3             |
|                                     | `Away from Base`         | 4             |
|                                     | `Unavailable`            | 5             |
|                                     | `Spare`                  | 6             |
| Status (Personnel - Maintenance)    | `Available`              | 1             |
|                                     | `Unavailable`            | 2             |
|                                     | `Red Status`             | 3             |
| Level (Operational Bulletin)        | `Alert`                  | 1             |
|                                     | `Advisory`               | 2             |
|                                     | `Info`                   | 3             |
| Status (Operational Bulletin)       | `Active`                 | 1             |
|                                     | `Resolved`               | 2             |
|                                     | `Archived`               | 3             |
| Severity (Safety Report)            | `Low`                    | 1             |
|                                     | `Medium`                 | 2             |
|                                     | `High`                   | 3             |
|                                     | `Critical`               | 4             |
| Status (Safety Report)              | `Submitted`              | 1             |
|                                     | `Acknowledged`           | 2             |
|                                     | `Investigating`          | 3             |
|                                     | `Escalated`              | 4             |
|                                     | `Closed`                 | 5             |
| Action (MX Audit)                   | `mx_request.submitted`   | 1             |
|                                     | `mx_request.approved`    | 2             |
|                                     | `mx_request.denied`      | 3             |
|                                     | `mx_request.cancelled`   | 4             |
|                                     | `mx_request.escalated`   | 5             |
|                                     | `mx_request.more_info_requested` | 6     |
|                                     | `mx_request.comment_added` | 7           |
|                                     | `mx_request.outlook_created` | 10        |
|                                     | `mx_request.outlook_cancelled` | 11      |
|                                     | `bulletin.posted`        | 20            |
|                                     | `bulletin.resolved`      | 21            |
|                                     | `bulletin.permanently_deleted` | 22      |
|                                     | `safety_report.submitted` | 30           |
|                                     | `safety_report.acknowledged` | 31        |
|                                     | `safety_report.escalated` | 32           |
|                                     | `safety_report.closed`   | 33            |
|                                     | `aircraft.status_changed` | 40           |
|                                     | `personnel.status_changed` | 50          |
|                                     | `personnel.reassigned`   | 51            |
|                                     | `personnel.shift_toggled` | 52           |

**Action labels are an exception** — they use lowercase dotted notation
because they're event names, not user-facing labels. They appear in
audit log JSON metadata and are joined across systems.

### Numeric values matter

The Power Automate flow filters on numeric values:

```
Filter rows: cr_status eq 1 and cr_decision eq null
                       ↑
                       Submitted
```

If you renumber the options, the flow breaks silently. **Use the
numeric values in this doc** when creating Choice options.

---

## 6. Lookup column display names

**Convention:** display name = the role this lookup plays from the
referencing table's perspective, **not** the target table's name.

| Source table                  | Lookup column display    | Target table              |
| ----------------------------- | ------------------------ | ------------------------- |
| `cr_mx_request`               | Aircraft Tail            | `cr_aircraft`             |
|                               | Base                     | `cr_base`                 |
|                               | Requested By             | `User` (systemuser)       |
|                               | Approver                 | `User`                    |
| `cr_aircraft`                 | Type                     | `cr_aircraft_type`        |
|                               | Base                     | `cr_base`                 |
|                               | Region                   | `cr_region`               |
|                               | RMM                      | `User`                    |
| `cr_safety_report`            | Aircraft                 | `cr_aircraft`             |
|                               | Reporter                 | `User`                    |
|                               | Acknowledged By          | `User`                    |
| `cr_operational_bulletin`     | Posted By                | `User`                    |
|                               | Resolved By              | `User`                    |
|                               | Region                   | `cr_region`               |
| `cr_aircraft_status_log`      | Aircraft Tail            | `cr_aircraft`             |
|                               | Changed By               | `User`                    |
| `cr_personnel_status_log`     | Personnel                | `cr_personnel_maintenance` |
|                               | Changed By               | `User`                    |
| `cr_mx_request_comment`       | MX Request               | `cr_mx_request`           |
|                               | Posted By                | `User`                    |
| `cr_audit`                    | Actor                    | `User`                    |
| `cr_schedule_event`           | MX Request               | `cr_mx_request`           |
|                               | Aircraft                 | `cr_aircraft`             |
|                               | Assigned To              | `User`                    |

---

## 7. Power Automate flow names

| Flow display name              | Solution component name     | Role                              |
| ------------------------------ | --------------------------- | --------------------------------- |
| `mxr-approval-flow-v2`         | `cr_mxr_approval_flow_v2`   | Main approval flow (Phase 1)      |
| `aircraft-status-broadcast`    | `cr_aircraft_status_broadcast` | Auto-bulletin on AOG flag       |
| `safety-report-triage`         | `cr_safety_report_triage`   | Anonymous-handling + DM routing   |

---

## 8. Connection references

| Display name                  | Logical name                  | Connector                |
| ----------------------------- | ----------------------------- | ------------------------ |
| Dataverse — MXConnect         | `cr_DataverseConnection`      | Microsoft Dataverse      |
| Teams — MXConnect             | `cr_TeamsConnection`          | Microsoft Teams          |
| Outlook — MXConnect           | `cr_OutlookConnection`        | Office 365 Outlook       |

(For SharePoint variant — deprecated — there were two more.
`cr_SharePointConnection` and `cr_Office365UsersConnection` are no
longer used.)

---

## 9. Environment variables

All env vars use the prefix `mx_*` for the friendly parameter name and
`cr_mx_*` for the Dataverse schema name (the `metadata.schemaName` in
the flow JSON).

| Param name (in flow)        | Schema name (in solution)        | Type   | Notes                                |
| --------------------------- | -------------------------------- | ------ | ------------------------------------ |
| `mx_approver_team_id`       | `cr_mx_approver_team_id`         | String | IHC Life Flight Team ID              |
| `mx_approver_channel_id`    | `cr_mx_approver_channel_id`      | String | RMM channel (default routing)        |
| `mx_scheduler_channel_id`   | `cr_mx_scheduler_channel_id`     | String | Scheduler channel                    |
| `mx_director_channel_id`    | `cr_mx_director_channel_id`      | String | Director channel                     |
| `mx_safety_channel_id`      | `cr_mx_safety_channel_id`        | String | Safety triage channel                |
| `mx_outlook_calendar`       | `cr_mx_outlook_calendar`         | String | Calendar name or ID                  |
| `mx_request_timeout_hours`  | `cr_mx_request_timeout_hours`    | Int    | 24                                   |
| `mx_audit_retention_days`   | `cr_mx_audit_retention_days`     | Int    | 2555 (7 years HIPAA)                 |
| `mx_safety_retention_days`  | `cr_mx_safety_retention_days`    | Int    | -1 (permanent)                       |
| `mx_app_deeplink_base`      | `cr_mx_app_deeplink_base`        | String | URL prefix                           |
| `mx_director_email`         | `cr_mx_director_email`           | String | Director group email                 |
| `mx_anonymous_account`      | `cr_mx_anonymous_account`        | String | `mx-anonymous@ihc.org`               |

---

## 10. Dataverse security roles

| Display name        | Logical name        | Members                              |
| ------------------- | ------------------- | ------------------------------------ |
| `MXC AMT`           | `MXC_AMT`           | All AMTs                             |
| `MXC RMM`           | `MXC_RMM`           | Regional Maintenance Managers        |
| `MXC Director`      | `MXC_Director`      | Director of Maintenance Operations   |
| `MXC QA`            | `MXC_QA`            | ADOM + QA team                       |
| `MXC Pilot`         | `MXC_Pilot`         | Active pilots                        |
| `MXC Scheduler`     | `MXC_Scheduler`     | MX + Crew schedulers                 |
| `MXC PR`            | `MXC_PR`            | Public Relations team                |
| `MXC Payroll`       | `MXC_Payroll`       | Payroll team (view-only)             |
| `MXC Service`       | `MXC_Service`       | Service account for the flow         |

---

## 11. Power Apps canvas naming conventions

| Prefix     | Meaning                       | Example                  |
| ---------- | ----------------------------- | ------------------------ |
| `scr_`     | Screen                        | `scr_Home`, `scr_Status` |
| `cnt_`     | Container                     | `cnt_Header`             |
| `gal_`     | Gallery                       | `gal_BulletinFeed`       |
| `frm_`     | Edit/Display Form             | `frm_NewMXRequest`       |
| `lbl_`     | Label                         | `lbl_PageTitle`          |
| `btn_`     | Button                        | `btn_Submit`             |
| `txt_`     | Text Input                    | `txt_Comment`            |
| `dd_`      | Dropdown                      | `dd_AircraftPicker`      |
| `dp_`      | Date Picker                   | `dp_WindowStart`         |
| `tgl_`     | Toggle                        | `tgl_Anonymous`          |
| `ico_`     | Icon                          | `ico_Tile`               |
| `cmp`      | Custom Component (no underscore) | `cmpAppShell`         |
| `var`      | Global variable (Set)         | `varCurrentUser`         |
| `col`      | Collection (ClearCollect)     | `colMyApprovals`         |

---

## 12. Capability count (role matrix)

The role capability matrix has **42 capabilities** total:

- **9 submit capabilities** (page 3 of MC Doc v3)
- **11 approve / act capabilities** (page 4)
- **22 see / dashboard capabilities** (page 5)

The canvas app's `varCan` record encodes a subset (~27 active flags) —
some matrix entries are read-only state (e.g., "Operational Bulletin
Feed — Read") which is gated by `Visible` properties on the home
screen, not by `varCan`.

If a doc says "27 capabilities" or "42 capabilities", both are correct
in context — but **prefer "42 capabilities" when describing the source
matrix**, and "varCan record" when describing the canvas implementation.

---

## 13. Common past inconsistencies (to avoid going forward)

| Wrong                         | Right                         | Reason                                   |
| ----------------------------- | ----------------------------- | ---------------------------------------- |
| `Personnel — Maintenance` (em dash) | `Personnel - Maintenance` (hyphen) | Em dash breaks in CSV / scripts |
| `Action (Audit Log)`          | `Action (MX Audit)`           | Choice qualifier should match table display name |
| `Status (MX Requests)` (plural) | `Status (MX Request)` (singular) | Choice describes single entity        |
| `Role (Personnel Maintenance)` (no separator) | `Role (Personnel - Maintenance)` | Match table name |
| `cr_audits` in Power Fx       | `'MX Audits'` in Power Fx     | Power Fx uses plural display name        |
| `cr87b_*` schema prefix       | `cr_*` schema prefix          | Default Publisher leaked in              |
| `MX Request` in collection contexts | `MX Requests` in collection contexts | Power Apps surfaces tables by plural |
| `entityName: cr_mx_requests` in flow JSON | `entityName: cr_mx_requests` (plural collection name) | Dataverse OData uses plural |

---

## When in doubt

- **Schema name in code or JSON** → singular `cr_*` (e.g.,
  `cr_mx_request`)
- **Power Fx formula reference** → quoted plural display name (e.g.,
  `'MX Requests'`)
- **OData collection (flow JSON entityName)** → plural schema-style
  (e.g., `cr_mx_requests`)
- **Choice qualifier in parens** → singular table display name (e.g.,
  `Status (MX Request)`)
- **CSV file path** → kebab-case singular (e.g.,
  `04-aircraft.csv`)
- **Personnel separator** → hyphen, not em dash

If your formula is breaking and you suspect a name issue, paste the
formula here and I'll tell you which form to use.

---

## Companion docs

- `tables/README.md` — the canonical table index (uses these conventions)
- `tables/cr_*.md` — column-by-column specs (use these conventions)
- `flows/mxr-approval-flow-v2.json` — flow JSON (uses these conventions)
- `powerfx/canvas-app.md` — Power Fx reference (uses these conventions)
- `build-walkthrough.md` — manual build (updated to match this doc)
- `copilot-prompts.md` — AI prompts (updated to match this doc)
- `runbook.md` — week-by-week deployment
- `connections.md` — security roles + connection refs
- `roles-capability-matrix.md` — role × capability source of truth
