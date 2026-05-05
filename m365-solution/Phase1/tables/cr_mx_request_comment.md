# Table: `cr_mx_request_comment`

> **⚠️ EXTENSION TABLE — NOT IN CANONICAL CSV.**
>
> This table was added during the role-capability-matrix expansion
> (MC Documentation v3). It does **not** appear in
> `m365-solution/sharepoint-lists/` and has no canonical seed data.
>
> **Don't build this table for the canonical Phase 1 deployment.** The
> canonical 11 tables cover the documented IHC requirements. This
> table is reserved for the **Ask Leadership module** from the role
> matrix — threaded replies on Ask Leadership / Safety Report items.
>
> If you proceed with this table, treat the spec as speculative —
> column names + Choice enums are not validated against real IHC data.

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
| `cr_body`                | Body                 | Multiline text (4000)      | Yes      |                                                            |
| `cr_posted_at`           | Posted at            | Date and time              | Yes      | UTC.                                                       |
| `cr_posted_by`           | Posted by            | Lookup → `systemuser`      | Yes      |                                                            |
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
