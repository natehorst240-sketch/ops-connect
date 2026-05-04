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
`cr87b_cr_*` means search-and-replacing every prompt, every formula,
every JSON token from now until prod.

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

Write down the list. Mine looked like:

```
☐ Aircrafts          (cr87b_aircrafts)
☐ Aircraft Types     (cr87b_aircraft_types)
☐ Bases              (cr87b_bases)
☐ Regions            (cr87b_regions)
☐ Personnel — Maintenance
☐ MX Requests
☐ ... etc
```

### 1.2 Note the dependency order

Dataverse blocks deletion if other tables reference a table via lookup.
So you have to delete in **reverse** build order:

```
Delete order (from spec — reverse dependency):
1. cr_schedule_event
2. cr_user_filter_pref
3. cr_mx_request_comment
4. cr_personnel_status_log
5. cr_aircraft_status_log
6. cr_safety_report
7. cr_operational_bulletin
8. cr_audit
9. cr_mx_request
10. cr_personnel_crew
11. cr_personnel_maintenance
12. cr_aircraft
13. cr_base
14. cr_aircraft_type
15. cr_region
```

You may not have all 15 — Plan mode may have stopped early. Delete
what's there, in reverse build order.

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

Same path under `Solutions → MX Connect → Apps`. We'll rebuild from the
canvas-app.md guide instead.

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

## Step 5 — Rebuild correctly (incremental, ~3.5 hours)

**Do not use Plan mode this time.** Use chunked single-table prompts
from `copilot-prompts.md`.

### 5.1 Build the global Choices first (~45 min)

Use **Prompt 2** from the cookbook, **one Choice at a time, not all 22
at once**:

```
Solutions → MX Connect → + New → More → Choice
   [paste Prompt 2 with the specific Choice you want]
   Save
   Wait → verify → next Choice
```

Build all 22 Choices before starting tables. Tables that reference
Choice columns expect them to exist already.

### 5.2 Build lookup tables (~30 min)

In dependency order:

```
1. cr_region                  → use Prompt 3
2. cr_aircraft_type           → use Prompt 3
3. cr_base                    → use Prompt 3 (Base references Region)
```

After each: verify schema name is `cr_*`, not `cr87b_*`.

### 5.3 Build master tables (~75 min)

```
4. cr_aircraft                → use Prompt 1 with the populated CSV
5. cr_personnel_maintenance   → use Prompt 1 with the populated CSV
6. cr_personnel_crew          → use Prompt 3 (no CSV; schema only for Phase 2)
```

For Prompt 1 CSV uploads: load `04-aircraft.csv`,
`05-personnel-maintenance.csv` from
`m365-solution/sharepoint-lists/`. **Real IHC fleet data**, not the
fake Boeing 737s Plan mode generated.

### 5.4 Build transactional tables (~60 min)

```
7. cr_mx_request              → use Prompt 3 (largest spec)
8. cr_audit                   → use Prompt 3
9. cr_operational_bulletin    → use Prompt 3
10. cr_safety_report          → use Prompt 3
11. cr_aircraft_status_log    → use Prompt 3
12. cr_personnel_status_log   → use Prompt 3
13. cr_mx_request_comment     → use Prompt 3
14. cr_user_filter_pref       → use Prompt 3
15. cr_schedule_event         → use Prompt 3
```

After every single one: open the table, look at one column's schema
name. If it shows `cr_*` you're good. If `cr87b_*` shows up again,
**stop immediately** — something reverted on the publisher. Fix
before continuing.

### 5.5 Build the flow + canvas app

Once all 15 tables are correct:
- Flow: follow `build-walkthrough.md §B` step by step
- Canvas app: follow `powerfx/canvas-app.md` section by section

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
   Should show 15 tables, all prefixed cr_

Solutions → MX Connect → Components count: 15+ tables, 22 Choices, 1 publisher
Solutions → MX Connect → Tables → click any table → first column
   Schema name format: cr_<column_name>     ✅
                       cr87b_cr_<column>    ❌
```

If everything checks out, you're back to clean state and ready to keep
building per `build-walkthrough.md` and `copilot-prompts.md`.

---

## What NOT to use again

- ❌ **Plan mode** for the whole foundation — chunked single prompts only
- ❌ **"Apply to existing solution"** if a saved plan asks — always create
  to a fresh solution then merge selectively
- ❌ **The `cr87b_` publisher** — delete it; don't try to keep it as fallback
- ❌ Generated **seed data** that's not from your real CSV — delete and
  import the real populated CSVs from `sharepoint-lists/`
- ❌ Auto-generated **flows / canvas apps** from Plan mode — they assume
  the wrong schema names; rebuild from the spec

---

## Companion docs

- `build-walkthrough.md` — manual click-by-click table + flow build
- `copilot-prompts.md` — chunked AI prompts (use these, not Plan mode)
- `tables/README.md` + `tables/cr_*.md` — column-by-column specs
- `flows/mxr-approval-flow-v2.json` — flow recipe
