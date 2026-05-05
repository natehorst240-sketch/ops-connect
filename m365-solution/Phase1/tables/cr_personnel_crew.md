# Table: `cr_personnel_crew`

Flight + dispatch roster: pilots, flight nurses, flight paramedics,
respiratory therapists, communication specialists, crew schedulers.

**Phase 1 ships the schema only — header-only CSV.** Population happens
in Phase 2 from ProteanHub / CompleteFlight nightly sync.

## Display name

**Personnel — Crew**

Use a regular hyphen (`Personnel - Crew`) for ease of typing.

## Schema name

`cr_personnel_crew`

## Primary column

`cr_full_name` — Text (100). `First Last`.

## Columns

Matches the header in `m365-solution/sharepoint-lists/11-personnel-crew.csv`:

| Schema name              | Display              | Type                       | Required | Default     | Notes                                                              |
| ------------------------ | -------------------- | -------------------------- | -------- | ----------- | ------------------------------------------------------------------ |
| `cr_full_name`           | Title                | Text (100)                 | Yes      | —           | Primary column.                                                    |
| `cr_first_name`          | First Name           | Text (50)                  | Yes      | —           |                                                                    |
| `cr_last_name`           | Last Name            | Text (50)                  | Yes      | —           |                                                                    |
| `cr_email`               | Email                | Email                      | Yes      | —           |                                                                    |
| `cr_phone`               | Phone                | Phone                      | No       | —           |                                                                    |
| `cr_role`                | Role                 | Choice                     | Yes      | —           | Phase 2 enum (Pilot / Flight Nurse / etc.) — not yet in canonical CSV. |
| `cr_specialty`           | Specialty            | Choice (multi)             | No       | —           | Phase 2.                                                          |
| `cr_region`              | Region               | Text (16)                  | No       | —           |                                                                    |
| `cr_primary_base`        | Primary Base         | Text (50)                  | No       | —           |                                                                    |
| `cr_coverage_bases`      | Coverage Bases       | Multiline text (500)       | No       | —           |                                                                    |
| `cr_certifications`      | Certifications       | Multiline text (500)       | No       | —           | Semicolon-delimited (`PALS;ACLS;NRP;FP-C`).                        |
| `cr_cert_earliest_expiry`| Cert Earliest Expiry | Date and time              | No       | —           |                                                                    |
| `cr_hired_date`          | Hired Date           | Date and time              | No       | —           |                                                                    |
| `cr_leader`              | Leader               | Text (60)                  | No       | —           | Phase 2: convert to Lookup → `systemuser`.                          |
| `cr_active`              | Active               | Yes/No                     | Yes      | Yes         |                                                                    |
| `cr_notes`               | Notes                | Multiline text (1000)      | No       | —           |                                                                    |

Phase 1 builds this table empty. Phase 2 populates from external
rosters and locks down the Choice options for Role + Specialty based
on the actual data.

## Permissions

- **Read:** All app users.
- **Create / Update / Delete:** Director, DOM, Scheduler. Phase 2 service
  account refreshes Cert Earliest Expiry nightly.
