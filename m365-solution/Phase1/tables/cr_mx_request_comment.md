# Table: `cr_mx_request_comment`

> **EXTENSION TABLE — BUILT DURING PHASE 1 ASK LEADERSHIP MODULE.**
>
> This table was added during the role-capability-matrix expansion
> and is **now active** — it was built as part of the Phase 1 Ask
> Leadership (`scr_AskDetail`) screen. It does **not** appear in
> `m365-solution/sharepoint-lists/` and has no canonical seed data.
>
> **Power Apps data source name:** `'MX Request Comments'` (plural, adds `s`)
>
> **Column history:** A column `cr_comment` was created during Phase 1
> build and later deleted. Only `cr_body` (display name: `Body`) remains
> as the comment text column. Any Power Apps schema-cache error referencing
> `cr_body` means the data source must be removed and re-added in Power Apps
> Studio to force a metadata refresh.
>
> **Phase 1 interim:** `scr_AskDetail` stores comments in a local collection
> (`colComments`) rather than patching Dataverse, due to Power Apps schema
> cache limitations encountered during Phase 1 build. The Dataverse Patch is
> spec'd in `powerfx/canvas-app.md §9` and will be activated in Phase 2
> once the schema-cache issue is fully resolved.

---

Threaded replies on Ask Leadership and Safety Report items. Drives the
"full conversation thread visible to all approvers" requirement —
Director can see + respond to any point in the thread.

## Display name

**MX Request Comment**

## Schema name

`cr_mx_request_comment`

## Primary column

`cr_comment_id` — Autonumber, format `CMT-{SEQNUM:000000}`.

## Columns

| Schema name              | Display              | Type                       | Required | Notes                                                      |
| ------------------------ | -------------------- | -------------------------- | -------- | ---------------------------------------------------------- |
| `cr_comment_id`          | Comment ID           | Autonumber                 | System   | Format `CMT-{SEQNUM:000000}`.                              |
| `cr_mx_request_id`       | MX Request           | Lookup → `cr_mx_request`  | Yes      | Parent record.                                            |
| `cr_body`                | Body                 | Single line of text (100)  | Yes      | **Built as single-line text.** Spec originally called for Multiline text (4000) — upgrade in Phase 2. 100 chars is limiting for longer comments. |
| `cr_posted_at`           | Posted At            | Date and time              | Yes      | UTC. Display name confirmed: capital A ("Posted At" not "Posted at"). |
| `cr_posted_by`           | Posted By            | Lookup → `systemuser`      | Yes      | **Set Dataverse column default to "Current User"** — do NOT pass this in canvas Patch. Passing a string to a systemuser Lookup throws a type error in Power Fx. |
| `cr_visible_to_roles`    | Visible to roles     | Choice                     | No       | `All approvers` / `Director only` / `RMM only` / `Submitter`. Default `All approvers`. |

## Choice values

### `cr_visible_to_roles`

| Label          | Value | Filters who sees this reply in the thread     |
| -------------- | ----- | --------------------------------------------- |
| All approvers  | 1     | Default. Visible to RMM/Director/QA/Submitter. |
| Director only  | 2     | Director sees only.                            |
| RMM only       | 3     | RMM sees only.                                 |
| Submitter      | 4     | Submitter sees only (used for follow-up Q’s). |

## Permissions

- **Create:** Submitter + all approvers in the routing chain.
- **Read:** Filtered by `cr_visible_to_roles`. Implementation: a
  per-role view that filters comments using a fetch XML expression
  combining the role with `cr_visible_to_roles`.
- **Update / Delete:** None. Append-only.

## Indexes

- `cr_mx_request_id` — thread queries are always per-request.
- `cr_posted_at` — chronological in-thread.

## Comments Count maintenance

On comment Patch, the canvas app increments
`cr_mx_request.cr_comments_count` to keep a fast count without
aggregating the comments table. Phase 2 — swap to a calculated column on
`cr_mx_request` that counts related comments.
