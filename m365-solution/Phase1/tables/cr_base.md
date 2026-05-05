# Table: `cr_base`

Lookup list. 44 IHC bases. References `cr_region`.

## Display name

**Base**

## Schema name

`cr_base`

## Primary column

`cr_title` — Text (50). Format `City, ST` for normal bases (e.g.,
`Logan, UT`), or `Spare` for the spare-rotation row, or special hangar
labels like `(FW) SLC, UT` / `(RW) SLC, UT` / `SLC HQ, UT` /
`IMED Hangar, UT`.

## Columns

| Schema name              | Display              | Type                  | Required | Notes                                                          |
| ------------------------ | -------------------- | --------------------- | -------- | -------------------------------------------------------------- |
| `cr_title`               | Title                | Text (50)             | Yes      | Primary column. See note above for format.                     |
| `cr_city`                | City                 | Text (32)             | Yes      | E.g., `Logan`, `Salt Lake City`.                               |
| `cr_state`               | State                | Text (4)              | Yes      | 2-letter code, or `—` for the Spare row.                       |
| `cr_primary_region`      | Primary Region       | Text (40)             | No       | Free-text in the CSV (some bases use `109 UT + SLC FW` combo). Phase 2: convert to multi-Lookup. |
| `cr_operations`          | Operations           | Choice                | No       | See § *Choice values*.                                         |
| `cr_has_mx_office`       | Has Maintenance Office | Yes/No              | No       | Default Yes.                                                   |
| `cr_notes`               | Notes                | Multiline text (1000) | No       | Often lists the tails based here.                              |

**Why Primary Region is Text not Lookup:** the canonical CSV has
`St. George, UT` with Primary Region = `109 UT + SLC FW` (combo of two
regions). A single-Lookup column can't hold that, and a multi-Lookup
requires a many-to-many table. Phase 1 keeps it as text; Phase 2 can
refactor.

## Choice values

### `cr_operations`

| Label         | Value | Notes                                                  |
| ------------- | ----- | ------------------------------------------------------ |
| RW            | 1     | Rotor-wing only.                                       |
| FW            | 2     | Fixed-wing only.                                       |
| RW + FW       | 3     | Both.                                                  |
| Office        | 4     | Office space (e.g., SLC HQ).                           |
| Storage       | 5     | Spare aircraft storage.                                |
| Coverage      | 6     | Coverage-only (no based aircraft, e.g., Las Vegas).    |
| RW + Office   | 7     | Maintenance facility with offices (e.g., Bountiful).   |

## Permissions

- **Read:** All.
- **Create / Update / Delete:** Director, DOM, Scheduler.

## Seed data

Populate from `m365-solution/sharepoint-lists/02-bases.csv`. **44 rows.**

The 44 base titles, in CSV order:

```
Logan, UT             McKay Dee, UT         IMED Hangar, UT
Provo, UT             Roosevelt, UT         Cedar City, UT
St. George, UT        (FW) SLC, UT          (RW) SLC, UT
SLC HQ, UT            Bountiful, UT         Burley, ID
Cortez, CO            Elko, NV              Ely, NV
Fort Mohave, AZ       Glenwood Springs, CO  Greybull, WY
Kingman, AZ           Lander, WY            Las Vegas, NV
Los Alamos, NM        Moab, UT              Page, AZ
Pagosa Springs, CO    Rawlins, WY           Rexburg, ID
Richfield, UT         Riverton, WY          Steamboat Springs, CO
Vernal, UT            Winnemucca, NV        Billings, MT
Concord, NC           Davidson County, NC   Hickory, NC
Martinsville, VA      Rock Hill, SC         Wadesboro, NC
Wilkesboro, NC        Burlington, WI        Hartford, WI
Waukesha, WI          Spare
```

## Indexes

- `cr_primary_region` — region grouping in views (text contains-match).
