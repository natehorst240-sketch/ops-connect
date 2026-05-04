# Table: `cr_region`

Lookup list. 12 IHC operational regions.

## Display name

**Region**

## Schema name

`cr_region`

## Primary column

`cr_name` — Text (32). Region name, e.g., `109 UT`, `WY/MT`, `NC`.

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

Populate from `m365-solution/sharepoint-lists/01-regions.csv`. 12 rows:
`109 UT`, `WY/MT`, `ID/NV`, `UT/AZ`, `CO/NM`, `PAGE`, `WOODSCROSS`, `NC`,
`SLC FW`, `OFFICE`, `SLC BASED RTI`, `ROVERS`.
