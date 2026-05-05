# Rebuild From Clean State — When Plan Mode Used The Wrong Publisher

If Plan mode created tables under the auto-generated Default Publisher
(`cr87b_` or similar) instead of your IHC publisher (`cr_` or `ihc_`),
the cleanest fix is to wipe the bad tables and rebuild correctly.

This sequence: ~45–60 minutes total. Most of it waiting on Dataverse
deletes.

---

## Why this is worth doing now

The wrong publisher prefix bleeds into **every** schema name, every
formula, every flow JSON expression for the rest of the project. The
spec docs in this repo all assume `cr_*` schema names. Living with
`cr87b_cr_*` means search-and-replacing every formula and every JSON
token from now until prod.

Better: 45 minutes of cleanup now → 0 minutes of friction later.

---

## Step 0 — Pre-flight (5 min)

### 0.1 Snapshot the current state

```
Solutions → MX Connect → ⋯ → Versions → + New version
   Display name: "Pre-rebuild 2026-05-04"
   Save
```

If everything goes sideways, you can restore here. (Restore creates a
new version; doesn't overwrite.)

### 0.2 Confirm your IHC publisher exists with the right prefix

```
Solutions → left nav → Publishers
   Look for one named: IHC
   With prefix:        cr   (or ihc — whatever your team agreed on)
```

If you don't see it, create it now:

```
+ New publisher
   Display name: IHC
   Name:         ihc
   Prefix:       cr            ← this is the part that goes in front of every column name
   Choice value prefix: 10000  (or accept default)
   Save
```

### 0.3 Confirm MX Connect's publisher is set to IHC

```
Solutions → MX Connect → ⋯ → Edit
   Publisher: IHC (cr_)         ← if it shows "Default Publisher" or "CDS Default", change it
   Save
```

This is the step Plan mode skipped — when MX Connect's publisher isn't
explicitly IHC, anything Plan mode creates falls back to Default
Publisher.

---

## Step 1 — Inventory what got created (5 min)

You need to know exactly which tables to delete so you don't miss any.

### 1.1 List the bad tables

```
Solutions → MX Connect → Tables
```

Note every table with the wrong prefix in its schema name (column on
the right). Likely all of them, if Plan mode built the foundation.

Also check:

```
Tables → All (left nav, not in solution view)
   Filter: Custom only
```

The bad tables may not be in the MX Connect solution at all — they
might live in Default Solution. You'll see them here.

### 1.2 Note the dependency order

Dataverse blocks deletion if other tables reference a table via lookup.
So you have to delete in **reverse** build order. Canonical Phase 1
has 8 tables — if you also created any extension or Phase 2 tables,
delete those first:

```
Delete order (reverse dependency):

Extension (delete first if present):
  cr_user_filter_pref
  cr_mx_request_comment
  cr_personnel_status_log
  cr_aircraft_status_log
  cr_safety_report
  cr_operational_bulletin

Phase 2 (delete next if present):
  cr_conflict
  cr_fleet_position
  cr_schedule_event

Canonical Phase 1 (delete in this reverse order):
  cr_audit
  cr_mx_request
  cr_personnel_crew
  cr_personnel_maintenance
  cr_aircraft
  cr_base
  cr_aircraft_type
  cr_region
```

Delete what's there in this order.

---

## Step 2 — Delete the bad tables (20–30 min)

### 2.1 Per-table delete

For each table in reverse build order:

```
Tables → click the table → ⋯ menu (top right) → Delete table
   Confirm dialog: type the table name → Delete
   Wait for confirmation (5–30 seconds per table)
```

If it errors with **"Cannot delete because other components reference it"**:

- Note which table is referencing it (Dataverse usually says which)
- Skip this one for now; delete the referencing table first
- Come back

### 2.2 Delete the bad publisher (optional)

If Plan mode created an extra publisher (`cr87b...`), delete it after
all its tables are gone:

```
Solutions → Publishers → cr87b... → ⋯ → Delete
```

This prevents Default Publisher from re-attaching.

### 2.3 Delete bad seed rows in tables you're keeping

If any IHC-correct table has fake data (Boeing 737 in Seattle, etc.):

```
Tables → [table] → top toolbar → ⋯ → Delete all rows
```

Or select rows individually and delete. Either way — clean slate before
rebuilding.

### 2.4 Delete any flows Plan mode created

```
Solutions → MX Connect → Flows
   Identify any auto-generated flows
   ⋯ → Delete
```

You'll rebuild these manually using `flows/mxr-approval-flow-v2.json`
as the recipe.

### 2.5 Delete any canvas apps Plan mode created

Same path under `Solutions → MX Connect → Apps`. We'll rebuild from
the `powerfx/canvas-app.md` guide instead.

---

## Step 3 — Verify clean state (5 min)

### 3.1 Tables view should show only system tables

```
Tables → Custom (filter)
```

Should be empty (or only show tables you genuinely want to keep).

### 3.2 Solutions view of MX Connect should be empty-ish

```
Solutions → MX Connect
```

Should show: just the publisher, no components. (Or only the things
you want to keep.)

### 3.3 No orphan publishers

```
Solutions → Publishers
   Should be: IHC + Microsoft system publishers + nothing else
```

---

## Step 4 — Set up correctly before rebuilding (5 min)

### 4.1 Make MX Connect the preferred solution

This is the **critical step Plan mode missed**:

```
Solutions → MX Connect → ⋯ → Set as preferred solution
   (Or in newer UI: pin/star icon at top)
```

Now every new table you create in this environment goes into MX
Connect with the correct publisher.

### 4.2 Verify by creating a throwaway table

Spend 30 seconds confirming the prefix is right:

```
Solutions → MX Connect → + New → Table → New table (advanced properties)
   Display name: Test Delete Me
   Save
```

Check the schema name on the columns:
- ✅ Right: `cr_test_delete_me` (or `ihc_test_delete_me`)
- ❌ Wrong: `cr87b_test_delete_me` or `new_test_delete_me`

Delete the test table immediately:

```
Tables → Test Delete Me → ⋯ → Delete table
```

If the prefix was wrong, fix the publisher (Step 0.3) before
proceeding. **Don't start rebuilding until the test confirms the
right prefix.**

---

## Step 5 — Rebuild correctly

**Do not use Plan mode this time.** Build manually using
`build-walkthrough.md` as the click-by-click guide.

### 5.1 Build the canonical 11 Choices first (~25 min)

Per `build-walkthrough.md §A.5`, the 11 Choice columns canonical Phase 1
needs:

```
Region Type, Operations, Aircraft Class, Aircraft Status, Personnel Role,
MX Request Type, MX Request Priority, MX Request Status, MX Request Routing,
MX Request Decision, Audit Action
```

Build them one at a time so you can verify each before moving on.
Tables that reference Choice columns expect them to exist already.

### 5.2 Build lookup tables (~20 min)

In dependency order:

```
1. cr_region          (12 rows from 01-regions.csv)
2. cr_aircraft_type   (19 rows from 03-aircraft-types.csv)
3. cr_base            (44 rows from 02-bases.csv)
```

After each: verify schema name is `cr_*`, not `cr87b_*`.

### 5.3 Build master tables (~75 min)

```
4. cr_aircraft                (61 rows from 04-aircraft.csv)
5. cr_personnel_maintenance   (~85 rows from 05-personnel-maintenance.csv)
6. cr_personnel_crew          (header-only — Phase 2 populates)
```

The spec docs (`tables/cr_aircraft.md`, etc.) explicitly keep
Base / Region / RMM / Leader as **Text** in Phase 1 because the CSV
has values that don't fit a Lookup (`Spare`, `Unassigned`,
`NC Region (TBD)`, `—`, `ALL`, `Rover`). Don't try to convert to
Lookup yet — that's Phase 2 cleanup work.

### 5.4 Build transactional tables (~45 min)

```
7. cr_mx_request   (with cr_decision + cr_decision_reason + cr_more_info_request canonical columns)
8. cr_audit
```

After every single one: open the table, look at one column's schema
name. If it shows `cr_*` you're good. If `cr87b_*` shows up again,
**stop immediately** — something reverted on the publisher. Fix
before continuing.

### 5.5 Import canonical CSV seed data

Per `tables/README.md` import order, import the populated CSVs from
`m365-solution/sharepoint-lists/`. Don't generate fake data — the
real IHC data is in the CSVs.

### 5.6 Build the flow + canvas app

Once all 8 canonical tables are correct + populated:
- Flow: follow `build-walkthrough.md §B` step by step (or import
  `flows/mxr-approval-flow-v2.json` via `pac` if you have CLI)
- Canvas app: follow `powerfx/canvas-app.md` for canonical scope
  (Submit form + Approval Inbox — don't build the 8 modules unless
  opting into extension scope)

---

## Common gotchas during rebuild

| Symptom                                                     | Cause                                                              | Fix                                                          |
| ----------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------ |
| New table goes to Default Publisher again                   | MX Connect not set as preferred solution                          | Step 4.1 again                                               |
| "Schema name already exists" error                          | Old table only soft-deleted, still hanging around                  | Power Platform admin → Recycle bin → empty                   |
| Lookup column to deleted table                              | Reference still exists in another table                            | Delete the referencing column first, then the target table   |
| Choice option missing when creating a Choice column         | Global Choice not built yet                                        | Step 5.1 — build all Choices BEFORE starting tables          |
| Dataverse hangs on delete table                             | Other things reference it (often a hidden form / view)             | Cancel, check `... → Settings → Forms / Views / Charts`      |
| "Permission denied" on delete                               | You're missing System Customizer role                              | Power Platform admin → Users → assign role                   |

---

## After rebuild — verify

```
Tables → Filter: Custom
   Should show 8 tables, all prefixed cr_

Solutions → MX Connect → Components count: 8 tables, 11 Choices, 1 publisher
Solutions → MX Connect → Tables → click any table → first column
   Schema name format: cr_<column_name>     ✅
                       cr87b_cr_<column>    ❌
```

If everything checks out, you're back to clean state and ready to keep
building per `build-walkthrough.md` and `runbook.md`.

---

## What NOT to use again

- ❌ **Plan mode** for the whole foundation — manual table-by-table only
- ❌ **"Apply to existing solution"** if a saved plan asks — always
  create to a fresh solution then merge selectively
- ❌ **The `cr87b_` publisher** — delete it; don't try to keep it as
  fallback
- ❌ Generated **seed data** that's not from your real CSV — delete and
  import the real populated CSVs from `sharepoint-lists/`
- ❌ Auto-generated **flows / canvas apps** from Plan mode — they assume
  the wrong schema names; rebuild from the spec

---

## Companion docs

- `build-walkthrough.md` — manual click-by-click table + flow build (canonical)
- `runbook.md` — week-by-week deployment runbook (canonical)
- `tables/README.md` + `tables/cr_*.md` — column-by-column specs
- `flows/mxr-approval-flow-v2.json` — 4-decision flow recipe
