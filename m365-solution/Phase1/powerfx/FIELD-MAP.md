# MX Connect — Field Map & Formula Dependency Reference

Power Apps Studio pluralizes table display names. All custom columns carry
the `cr_` prefix. Use this doc to trace any formula error back to its
table column and vice versa.

---

## Table name translation

| Spec name                  | Power Apps data source name      | Logical name              |
|----------------------------|----------------------------------|---------------------------|
| MX Request                 | `'MX Requests'`                  | `cr_mx_request`           |
| MX Audit                   | `'MX Audits'`                    | `cr_audit`                |
| Aircraft                   | `Aircrafts`                      | `cr_aircraft`             |
| Aircraft Type              | `'Aircraft Types'`               | `cr_aircraft_type`        |
| Personnel - Maintenance    | `'Personnel - Maintenances'`     | `cr_personnel_maintenance`|
| Personnel - Crew           | `'Personnel - Crews'`            | `cr_personnel_crew`       |
| Region                     | `Regions`                        | `cr_region`               |
| Base                       | `Bases`                          | `cr_base`                 |

---

## MX Requests — column map

| Display name (spec)  | Power Apps formula ref       | Logical name          | Type            | Required | Used by                                      |
|----------------------|------------------------------|-----------------------|-----------------|----------|----------------------------------------------|
| Request Label        | `'Request Label'`            | `cr_request_label`    | Text (primary)  | Yes      | Display only                                 |
| Request Number       | `cr_request_number`          | `cr_request_number`   | Autonumber      | Auto     | Gallery filter, ClearCollect remove          |
| Status               | `'Status (cr_status)'`       | `cr_status`           | Choice          | Yes      | OnVisible filter, all 4 Patch buttons        |
| Decision             | `cr_decision`                | `cr_decision`         | Choice          | No       | All 4 Patch buttons, OnVisible IsBlank check |
| Decision Reason      | `'Decision Reason'`          | `cr_decision_reason`  | Text            | No       | btn_Deny Patch                               |
| Decision Comment     | `'Decision Comment'`         | `cr_decision_comment` | Text            | No       | All 4 Patch buttons                          |
| More Info Request    | `'More Info Request'`        | `cr_more_info_request`| Text            | No       | btn_Return Patch                             |
| Approver             | `Approver`                   | `cr_approver`         | Text            | No       | btn_Approve, btn_Deny, btn_Return Patch      |
| Decided At           | `'Decided At'`               | `cr_decided_at`       | DateTime        | No       | btn_Approve, btn_Deny, btn_Return Patch      |
| Requested By         | `'Requested By'`             | `cr_requested_by`     | Text            | **Yes**  | btn_Submit Patch → `User().FullName`         |
| Requested By Email   | `'Requested By Email'`       | `cr_requested_by_email`| Text           | No       | Not yet used in canvas                       |
| Request Type         | `'Request Type'`             | `cr_request_type`     | Choice          | Yes      | btn_Submit Patch, gallery Subtitle           |
| Aircraft Tail        | `'Aircraft Tail'`            | `cr_aircraft_tail`    | Lookup→Aircraft | No       | btn_Submit Patch, OnVisible RMM filter       |
| Priority             | `Priority`                   | `cr_priority`         | Choice          | No       | btn_Submit Patch, Routing logic              |
| Routing              | `Routing`                    | `cr_routing`          | Choice          | No       | OnVisible filter, btn_Escalate, btn_Submit   |
| Base                 | `Base`                       | `cr_base_lookup`      | Lookup→Base     | No       | btn_Submit Patch                             |
| Reason               | `Reason`                     | `cr_reason`           | Text            | No       | btn_Submit Patch, gallery Body               |
| Window Start         | `'Window Start'`             | `cr_window_start`     | DateTime        | No       | btn_Submit Patch                             |
| Window End           | `'Window End'`               | `cr_window_end`       | DateTime        | No       | btn_Submit Patch                             |
| Audit Correlation    | `'Audit Correlation'`        | `cr_audit_correlation`| Text            | No       | btn_Submit Patch → `GUID()`                  |

### Status (cr_status) choice values
| Label      | OptionSet ref                          | Int |
|------------|----------------------------------------|-----|
| Submitted  | `'Status (MX Requests)'.Submitted`     | 1   |
| Approved   | `'Status (MX Requests)'.Approved`      | 2   |
| Denied     | `'Status (MX Requests)'.Denied`        | 3   |
| Escalated  | `'Status (MX Requests)'.Escalated`     | 4   |
| Returned   | `'Status (MX Requests)'.Returned`      | 5   |
| Cancelled  | `'Status (MX Requests)'.Cancelled`     | 6   |

### Decision (cr_decision) choice values
| Label      | OptionSet ref                            | Int |
|------------|------------------------------------------|-----|
| Approved   | `'Decision (MX Requests)'.Approved`      | 1   |
| Denied     | `'Decision (MX Requests)'.Denied`        | 2   |
| Escalated  | `'Decision (MX Requests)'.Escalated`     | 3   |
| Returned   | `'Decision (MX Requests)'.Returned`      | 4   |

### Request Type (cr_request_type) choice values
| Label           | OptionSet ref                                       |
|-----------------|-----------------------------------------------------|
| Phase Inspection| `'Request Type (MX Requests)'.'Phase Inspection'`   |
| Repair          | `'Request Type (MX Requests)'.Repair`               |
| Overhaul        | `'Request Type (MX Requests)'.Overhaul`             |
| Time Off        | `'Request Type (MX Requests)'.'Time Off'`           |
| Open Shift      | `'Request Type (MX Requests)'.'Open Shift'`         |
| AOG             | `'Request Type (MX Requests)'.AOG`                  |

### Priority (cr_priority) choice values
| Label  | OptionSet ref                       |
|--------|-------------------------------------|
| Normal | `'Priority (MX Requests)'.Normal`   |
| High   | `'Priority (MX Requests)'.High`     |
| AOG    | `'Priority (MX Requests)'.AOG`      |

### Routing (cr_routing) choice values
| Label    | OptionSet ref                         |
|----------|---------------------------------------|
| RMM      | `'Routing (MX Requests)'.RMM`         |
| Director | `'Routing (MX Requests)'.Director`    |

---

## Aircrafts — column map

| Display name   | Power Apps formula ref | Logical name   | Type             | Used by                          |
|----------------|------------------------|----------------|------------------|----------------------------------|
| Tail           | `cr_tail`              | `cr_tail`      | Text (primary)   | dd_AircraftPicker display field  |
| Aircraft Type  | `'Aircraft Type'`      | `cr_aircraft_type_lookup` | Lookup→Aircraft Type | btn_Submit (Type.Title)|
| Base           | `Base`                 | `cr_base`      | Text             | Display only                     |
| Region         | `Region`               | `cr_region`    | Text             | Personnel filter                 |
| RMM            | `RMM`                  | `cr_rmm`       | Text             | OnVisible approval filter        |
| Status         | `'Status (Aircraft)'`  | `cr_status`    | Choice           | Status Dashboard count           |

> **dd_AircraftPicker fix:** `ShowColumns(SortByColumns(Aircrafts, "cr_tail", SortOrder.Ascending), "cr_tail")`

---

## Bases — column map

| Display name    | Power Apps formula ref | Logical name   | Type           | Used by                    |
|-----------------|------------------------|----------------|----------------|----------------------------|
| title           | `cr_title`             | `cr_title`     | Text (primary) | dd_Base display field      |
| City            | `City`                 | `cr_city`      | Text           | Display only               |
| Primary Region  | `'Primary Region'`     | `cr_primary_region` | Text      | Reference only             |

> **dd_Base fix:** `ShowColumns(SortByColumns(Bases, "cr_title", SortOrder.Ascending), "cr_title")`

---

## Personnel - Maintenances — column map

| Display name  | Power Apps formula ref   | Logical name   | Type        | Used by                              |
|---------------|--------------------------|----------------|-------------|--------------------------------------|
| Full Name     | `'Full Name'`            | `cr_full_name` | Text (primary)| Display only                       |
| Email         | `Email`                  | `cr_email`     | Text        | App.OnStart LookUp                   |
| Role          | `Role.Value`             | `cr_role`      | **Choice — use `.Value`** | varRole detection   |
| Region        | `Region`                 | `cr_region`    | Text        | OnVisible region filter              |
| Primary Base  | `'Primary Base'`         | `cr_primary_base` | Text     | Display only                         |
| On Shift      | `'On Shift'`             | `cr_on_shift`  | Boolean     | On Call Now KPI count                |

> **Critical:** `Role` is a Choice column. Always use `Role.Value` when
> comparing to strings like `"RMM"`, `"Director"` etc. Direct comparison
> causes "Incompatible types" error.

### Role (cr_role) choice values — shared global option set

Used by both `cr_personnel_maintenance` and `cr_personnel_crew`.

| Label       | Value | Power Apps ref                  |
|-------------|-------|---------------------------------|
| AMT         | 1     | `'Role (Personnel)'.AMT`        |
| RMM         | 2     | `'Role (Personnel)'.RMM`        |
| DOM         | 3     | `'Role (Personnel)'.DOM`        |
| Director    | 4     | `'Role (Personnel)'.Director`   |
| QA          | 5     | `'Role (Personnel)'.QA`         |
| ADOM        | 6     | `'Role (Personnel)'.ADOM`       |
| Supervisor  | 7     | `'Role (Personnel)'.Supervisor` |
| Scheduler   | 8     | `'Role (Personnel)'.Scheduler`  |
| Pilot       | 9     | `'Role (Personnel)'.Pilot`      |
| Chief Pilot | 10    | `'Role (Personnel)'.'Chief Pilot'` |
| PR          | 11    | `'Role (Personnel)'.PR`         |
| Payroll     | 12    | `'Role (Personnel)'.Payroll`    |

> The OptionSet display name in Power Apps is `Role (Personnel)` — the
> parenthetical disambiguates it from other `Role` columns in the
> environment. If Power Apps shows a different auto-generated name,
> note it here and update all formula refs.

---

---

## MX Request Comments — column map

Power Apps data source name: **`'MX Request Comments'`** (plural, with `s`).

> Column `cr_comment` was created during Phase 1 build and deleted. Only
> `cr_body` (display: `Body`) remains as the comment text column. If Power
> Apps shows a "cr_body does not exist" error, remove and re-add the data
> source to flush the schema cache.

| Display name | Power Apps formula ref | Logical name | Type | Notes |
|---|---|---|---|---|
| Body | `Body` | `cr_body` | Single line of text (100) | Comment text. Phase 2: upgrade to Multiline text (2000+). No quotes needed in formula — single word. |
| MX Request | `'MX Request'` | `cr_mx_request_id` | Lookup → `cr_mx_request` | Parent record. Quotes required — contains space. |
| Posted At | `'Posted At'` | `cr_posted_at` | Date and time | UTC. Quotes required. |
| Posted By | `'Posted By'` | `cr_posted_by` | Lookup → systemuser | **Set Dataverse column default = "Current User". Do NOT set in canvas Patch** — passing a string to a systemuser Lookup causes a type error. |

### Phase 1 interim formula shapes

```powerapps
// gal_Comment.Items — local collection (Phase 1 interim)
colComments

// lbl_commentBody.Text (matches colComments schema)
ThisItem.PostedBy & " — " & Text(ThisItem.PostedAt, "mmm d h:mm AM/PM") & Char(10) & ThisItem.Body

// btn_PostComment.OnSelect (Phase 1 interim — colComments)
If(IsBlank(txt_NewComment.Text),
    Notify("Enter a comment.", NotificationType.Warning),
    Collect(colComments, { Body: txt_NewComment.Text, PostedBy: varCurrentUser.FullName, PostedAt: Now() });
    Reset(txt_NewComment)
)

// btn_PostComment.OnSelect (Phase 2 — Dataverse Patch)
// See canvas-app.md §9 for full formula
```

---

## Formula → column dependency cross-reference

| Formula location              | Columns consumed                                                                                          |
|-------------------------------|-----------------------------------------------------------------------------------------------------------|
| `App.OnStart`                 | Personnel-Maintenances: `Email`, `Role.Value` · Personnel-Crews: `Email`, `Role.Value` · MX Requests: `'Status (cr_status)'`, `cr_decision`, `Routing`, `Aircraft Tail`.RMM.Email |
| `scr_ApprovalInbox.OnVisible` | MX Requests: `'Status (cr_status)'`, `cr_decision`, `Routing`                                            |
| `gal_ApprovalList.Items`      | `colMyApprovals` (cached) → `'Requested By'`, `cr_request_number`, `'Request Type'`, `Reason`            |
| `btn_Approve.OnSelect`        | MX Requests: `'Status (cr_status)'`, `cr_decision`, `Approver`, `'Decided At'`, `'Decision Comment'`, `cr_request_number` |
| `btn_Deny.OnSelect`           | MX Requests: `'Status (cr_status)'`, `cr_decision`, `'Decision Reason'`, `Approver`, `'Decided At'`, `'Decision Comment'`, `cr_request_number` |
| `btn_Escalate.OnSelect`       | MX Requests: `'Status (cr_status)'`, `cr_decision`, `Routing`, `'Decision Comment'`, `cr_request_number` |
| `btn_Return.OnSelect`         | MX Requests: `'Status (cr_status)'`, `cr_decision`, `'More Info Request'`, `Approver`, `'Decided At'`, `'Decision Comment'`, `cr_request_number` |
| `btn_Submit.OnSelect`         | MX Requests: `'Aircraft Tail'`, `'Request Type'`, `'Window Start'`, `'Window End'`, `Base`, `Reason`, `Priority`, `'Status (cr_status)'`, `Routing`, `'Requested By'`→`User().FullName`, `'Audit Correlation'` · Aircrafts: `cr_tail` · Bases: `cr_title` |
| `dd_AircraftPicker`           | Aircrafts: `cr_tail` (Items + display)                                                                    |
| `dd_Base`                     | Bases: `cr_title` (Items + display)                                                                       |
