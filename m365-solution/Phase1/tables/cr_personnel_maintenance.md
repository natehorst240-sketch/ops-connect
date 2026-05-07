# Table: `cr_personnel_maintenance`

Maintenance roster. **~85 rows** per the canonical CSV. AMTs,
supervisors, RMMs, DOMs, QA, QA Manager, Parts, Schedulers, plus the
Senior Director Aviation Operations.

## Display name

**Personnel — Maintenance**

Use a regular hyphen (`Personnel - Maintenance`) for ease of typing in
formulas and CSV imports. Power Apps Studio renders both versions the
same.

## Schema name

`cr_personnel_maintenance`

## Primary column

`cr_full_name` — Text (100). `First Last`.

## Columns

| Schema name              | Display              | Type                       | Required | Default     | Notes                                                              |
| ------------------------ | -------------------- | -------------------------- | -------- | ----------- | ------------------------------------------------------------------ |
| `cr_full_name`           | Full Name            | Text (100)                 | Yes      | —           | `First Last`. Primary column.                                      |
| `cr_first_name`          | First Name           | Text (50)                  | Yes      | —           |                                                                    |
| `cr_last_name`           | Last Name            | Text (50)                  | Yes      | —           |                                                                    |
| `cr_email`               | Email                | Email                      | Yes      | —           | E.g., `Nathan.Horstmeier@imail.org`.                              |
| `cr_phone`               | Phone                | Phone                      | No       | —           | E.g., `801-946-2497`. CSV has 5 rows with blank phone.            |
| `cr_role`                | Role                 | Choice                     | Yes      | —           | See § *Choice values*.                                            |
| `cr_region`              | Region               | Text (16)                  | No       | —           | Free-text in CSV. Includes `ALL` for org-wide roles (Senior Director, DOMs). Phase 2: split into Lookup + a separate org-wide flag. |
| `cr_primary_base`        | Primary Base         | Text (50)                  | No       | —           | Free-text in CSV. Includes `Rover` for the 3 AMT (Rover) personnel. Phase 2: convert to Lookup once Rover-base records added. |
| `cr_coverage_bases`      | Coverage Bases       | Multiline text (500)       | No       | —           | Semicolon-delimited base names. CSV has `ALL` for org-wide roles. |
| `cr_leader`              | Leader               | Text (60)                  | No       | —           | CSV stores leader as a name string. Phase 2: convert to Lookup → `systemuser`. |
| `cr_active`              | Active               | Yes/No                     | Yes      | Yes         | All 85 CSV rows = Yes.                                            |
| `cr_notes`               | Notes                | Multiline text (1000)      | No       | —           | E.g., "Phone missing in source", "Cross-region".                  |

**Why Region / Primary Base / Leader are Text in the canonical schema:**
the CSV has values that don't map cleanly to Lookup targets:
- Region `ALL` for Senior Director Aviation Operations + DOMs (3 rows)
- Region `RW Rover` for the 3 AMT (Rover) rows
- Primary Base `Rover` for the 3 AMT (Rover) rows (no Rover row in `cr_base`)
- Leader stored as full name string, not a `systemuser` reference

Phase 1 keeps them as text to import the CSV verbatim. Phase 2 normalizes.

## Choice values

### `cr_role`

Shared global option set used by both `cr_personnel_maintenance` and
`cr_personnel_crew`. Define all 12 options on the global option set;
each table's column references the same set.

| Label        | Value |
| ------------ | ----- |
| AMT          | 1     |
| RMM          | 2     |
| DOM          | 3     |
| Director     | 4     |
| QA           | 5     |
| ADOM         | 6     |
| Supervisor   | 7     |
| Scheduler    | 8     |
| Pilot        | 9     |
| Chief Pilot  | 10    |
| PR           | 11    |
| Payroll      | 12    |

**AMT (Rover)** personnel in the CSV are imported with Role = `AMT`
(value 1); the Rover distinction is carried by `cr_primary_base =
"Rover"` and `cr_coverage_bases`. No separate option needed.

**QA Manager / Parts / Senior Director Aviation Operations** from the
earlier spec are collapsed: QA Manager → `QA`, Parts and Senior
Director → `Director` or `DOM` depending on the individual. Update the
seed CSV labels before import.

## Permissions

- **Read:** All app users (regional scoping for AMT/RMM via BU).
- **Create / Update general fields:** Director, DOM, RMM (regional), QA.
- **Reassign (change Primary Base):** RMM (regional), Director, DOM.
- **Delete:** Director, DOM (rare — personnel offboarding).

## Indexes

- `cr_email` — used as the natural key for app user lookups.
- `cr_role` — dashboard filters.
- `cr_region` — region scoping (text contains-match).

## Seed data

Populate from `m365-solution/sharepoint-lists/05-personnel-maintenance.csv`.
**~85 rows.**

Key RMMs (used as Aircraft.RMM string references):
- Nate Horstmeier — 109 UT (8 AW109SP tails + 2 floats)
- Tevita Silatolu — WY/MT
- John Cutright — ID/NV
- Chris Gibson — CO/NM
- Dwight Brooks — UT/AZ
- Sean Brown — PAGE (also tagged Supervisor in personnel; functions as RMM in aircraft refs)
- Casey Stockall — NC Region
- Chris Eells — WI Region
- Scott Winberg — SLC FW
- Martin Hodo — WOODSCROSS
