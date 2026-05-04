# Table: `cr_personnel_crew`

Flight + dispatch roster: pilots, flight nurses, flight paramedics,
respiratory therapists, communication specialists, crew schedulers.

**Phase 1 ships the schema only.** Phase 2 flows (Open Shift Claim,
Shift Swap, Time-Off, Cert Expiry) will read + write this table.

## Display name

**Personnel — Crew**

## Schema name

`cr_personnel_crew`

## Primary column

`cr_full_name` — Text (100). `First Last`.

## Columns

| Schema name              | Display              | Type                       | Required | Default     | Notes                                                              |
| ------------------------ | -------------------- | -------------------------- | -------- | ----------- | ------------------------------------------------------------------ |
| `cr_full_name`           | Full name            | Text (100)                 | Yes      | —           | Primary column.                                                    |
| `cr_first_name`          | First name           | Text (50)                  | Yes      | —           |                                                                    |
| `cr_last_name`           | Last name            | Text (50)                  | Yes      | —           |                                                                    |
| `cr_email`               | Email                | Email                      | Yes      | —           |                                                                    |
| `cr_phone`               | Phone                | Phone                      | No       | —           |                                                                    |
| `cr_role`                | Role                 | Choice                     | Yes      | —           | See § *Choice values*.                                            |
| `cr_specialty`           | Specialty            | Choice (multi)             | No       | —           | See § *Choice values*.                                            |
| `cr_region_id`           | Region               | Lookup → `cr_region`       | No       | —           |                                                                    |
| `cr_primary_base_id`     | Primary base         | Lookup → `cr_base`         | No       | —           |                                                                    |
| `cr_coverage_bases`      | Coverage bases       | Multiline text (500)       | No       | —           |                                                                    |
| `cr_certifications`      | Certifications       | Multiline text (500)       | No       | —           | Semicolon-delimited (`PALS;ACLS;NRP;FP-C`). Cache from CompleteFlight. |
| `cr_cert_earliest_expiry`| Cert earliest expiry | Date and time              | No       | —           | Earliest across all certs; nightly refresh.                       |
| `cr_hired_date`          | Hired date           | Date and time              | No       | —           | Used for seniority tiebreaks.                                     |
| `cr_leader`              | Leader               | Lookup → `systemuser`      | No       | —           |                                                                    |
| `cr_active`              | Active               | Yes/No                     | Yes      | Yes         |                                                                    |
| `cr_notes`               | Notes                | Multiline text (1000)      | No       | —           |                                                                    |

## Choice values

### `cr_role`

| Label                       | Value |
| --------------------------- | ----- |
| Pilot                       | 1     |
| Chief Pilot                 | 2     |
| Flight Nurse                | 3     |
| Flight Paramedic            | 4     |
| Respiratory Therapist       | 5     |
| Crew Scheduler              | 6     |
| Communication Specialist    | 7     |
| Comm Lead                   | 8     |
| Lead Nurse                  | 9     |
| Lead Paramedic              | 10    |

### `cr_specialty` (multi)

| Label              | Value |
| ------------------ | ----- |
| Urban              | 1     |
| Rural              | 2     |
| Pediatric          | 3     |
| Neonatal           | 4     |
| Adult              | 5     |
| Helicopter IFR     | 6     |
| Helicopter VFR     | 7     |
| Fixed Wing         | 8     |
| Multi-engine       | 9     |
| IFR / FW Captain   | 10    |
| IFR / FW SIC       | 11    |

## Permissions

- **Read:** All app users.
- **Create / Update:** Director, DOM, Scheduler. Cert Earliest Expiry
  refreshed by service account via Power Automate.
- **Delete:** Director, DOM.

## Phase 1 vs Phase 2

Phase 1: schema only, blank table. Phase 2: populated from ProteanHub /
CompleteFlight nightly sync flow. Open Shift Claim flow eligibility filter
uses `cr_certifications` + `cr_specialty` + `cr_active` + `cr_region_id`.
