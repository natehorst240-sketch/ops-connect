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
