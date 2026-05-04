# Table: `cr_base`

Lookup list. ~44 IHC bases. References `cr_region`.

## Display name

**Base**

## Schema name

`cr_base`

## Primary column

`cr_title` — Text (50). Format `City, ST`, e.g., `Logan, UT`.

## Columns

| Schema name              | Display              | Type                  | Required | Notes                                                          |
| ------------------------ | -------------------- | --------------------- | -------- | -------------------------------------------------------------- |
| `cr_title`               | Title                | Text (50)             | Yes      | `City, ST`. Primary column.                                    |
| `cr_city`                | City                 | Text (32)             | Yes      |                                                                |
| `cr_state`               | State                | Text (2)              | Yes      | 2-letter code.                                                 |
| `cr_primary_region_id`   | Primary region       | Lookup → `cr_region`  | No       |                                                                |
| `cr_operations`          | Operations           | Choice                | No       | `RW` / `FW` / `RW + FW` / `Office` / `Storage` / `Coverage`.   |
| `cr_has_mx_office`       | Has Maintenance Office | Yes/No              | No       | Default Yes.                                                   |
| `cr_notes`               | Notes                | Multiline text (1000) | No       |                                                                |

## Permissions

- **Read:** All.
- **Create / Update / Delete:** Director, DOM, Scheduler.

## Seed data

Populate from `m365-solution/sharepoint-lists/02-bases.csv`. 44 rows.

## Indexes

- `cr_primary_region_id` — region grouping in views.
