# Table: `cr_region`

Lookup list. 12 IHC operational regions.

## Display name

**Region**

## Schema name

`cr_region`

## Primary column

`cr_name` — Text (32). Region name, e.g., `109 UT`, `WY/MT`, `NC Region`.

## Columns

| Schema name | Display | Type                | Required | Notes                                       |
| ----------- | ------- | ------------------- | -------- | ------------------------------------------- |
| `cr_name`   | Name    | Text (32)           | Yes      | Primary column. Region name.                |
| `cr_type`   | Type    | Choice              | No       | `Field` / `HQ` / `Field/HQ` / `Rover`.      |
| `cr_notes`  | Notes   | Multiline text (1000) | No     |                                             |

## Permissions

- **Read:** All.
- **Create / Update / Delete:** Director, DOM (rare).

## Seed data

Populate from `m365-solution/sharepoint-lists/01-regions.csv` (the
canonical source). 12 rows:

| Name         | Type      | Notes                                                |
| ------------ | --------- | ---------------------------------------------------- |
| `109 UT`     | Field     | Northern Utah rotor-wing region (109 RW fleet)       |
| `CO/NM`      | Field     | Colorado + New Mexico                                |
| `ID/NV`      | Field     | Idaho + Nevada                                       |
| `NC Region`  | Field     | North Carolina + South Carolina + Virginia           |
| `PAGE`       | Field     | Page Arizona                                         |
| `SLC`        | HQ        | SLC headquarters — QA / Schedulers / Parts / DOM     |
| `SLC FW`     | Field     | SLC Fixed-Wing operations                            |
| `UT/AZ`      | Field     | Southern Utah + Northern Arizona                     |
| `WI Region`  | Field     | Wisconsin                                            |
| `WOODSCROSS` | Field/HQ  | Bountiful Utah maintenance center                    |
| `WY/MT`      | Field     | Wyoming + Montana                                    |
| `RW Rover`   | Rover     | Rotor-Wing roving mechanics (cross-base)             |
