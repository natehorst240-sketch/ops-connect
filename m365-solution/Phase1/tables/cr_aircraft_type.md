# Table: `cr_aircraft_type`

Lookup list. 19 distinct aircraft types in the IHC fleet.

## Display name

**Aircraft Type**

## Schema name

`cr_aircraft_type`

## Primary column

`cr_title` — Text (32). Type designation, e.g., `Bell 407 GXi`,
`AW109SP`, `EC135P3H`.

## Columns

| Schema name | Display | Type      | Required | Notes                              |
| ----------- | ------- | --------- | -------- | ---------------------------------- |
| `cr_title`  | Title   | Text (32) | Yes      | Type designation. Primary column.  |
| `cr_make`   | Make    | Text (32) | Yes      | E.g., `Bell`, `Agusta`, `Airbus`.  |
| `cr_model`  | Model   | Text (32) | Yes      | E.g., `407 GXi`.                   |
| `cr_class`  | Class   | Choice    | Yes      | `Rotary` / `Fixed Wing`.           |
| `cr_notes`  | Notes   | Multiline text (1000) | No |                                    |

## Permissions

- **Read:** All.
- **Create / Update / Delete:** Director, DOM, Scheduler.

## Seed data

Populate from `m365-solution/sharepoint-lists/03-aircraft-types.csv`.
19 rows.
