# Consolidating Base Communications in Microsoft Teams

## Problem
Each base runs its own WhatsApp group. Managers who oversee multiple bases must monitor 10+ separate chats on a personal app, with no search, no archive, no compliance, and no central visibility.

## Proposed Solution
A single Microsoft Teams "Operations" Team with one channel per base. Managers join once and see every base in one searchable, sortable pane. Employees use only their own base's channel — same experience as their current WhatsApp group, but on a company-licensed platform.

## Why Teams (vs. alternatives)

| Factor | WhatsApp (today) | Teams |
|---|---|---|
| Cost | Free, but personal phones | $0 extra — already licensed |
| Search across bases | None | Full-text, all channels |
| Mobile push | Yes | Yes (iOS/Android app) |
| Records / compliance | None | Retained, eDiscovery |
| Manager view | 10 separate chats | One unified view |
| Off-boarding | Manual removal | Automatic via M365 |
| File sharing | Lossy, lost in scroll | SharePoint-backed, searchable |

## Structure

**One Team: "Base Operations"**

- One **standard channel per base** (e.g., `Base-Alpha`, `Base-Bravo`, …)
- Managers are members of the parent Team → see all channels
- Employees are added only to their base's channel (private channels if bases need isolation)
- A **General** channel for cross-base announcements

**Scale check:** ~25 employees × 10 bases = ~250 members. Well under Teams' 25,000-member limit. Up to 1,000 standard channels per Team — plenty of headroom.

## Day-to-Day Experience

- **Employees:** Open Teams mobile app → see their base channel → post/read like WhatsApp. Push notifications work the same.
- **Managers:** Open Teams → "Activity" feed shows mentions and unread across every base. "Announcement" post type for important items. Filter/search by base, person, or keyword.
- **No more:** scrolling between 10 WhatsApp threads, missing messages, untracked off-boarding.

## Governance & Policy

- **Posting permissions:** Standard posts open to all; Announcements optional per channel
- **Notifications:** Default to "all new posts" on mobile so it matches WhatsApp behavior
- **Retention:** Set a retention policy (e.g., 1 year) via Purview
- **Off-boarding:** Removing M365 license automatically removes Teams access
- **Naming convention:** `Base-[Name]` so channels sort alphabetically

## Rollout Plan (4 weeks)

| Week | Action |
|---|---|
| 1 | IT creates Team, channels, policies. Pilot with 1 base + managers. |
| 2 | Train pilot base. Collect feedback. Adjust notification defaults. |
| 3 | Roll out to remaining bases. 30-min training per base. WhatsApp groups marked "read-only / archive." |
| 4 | Decommission WhatsApp groups. Managers operate fully in Teams. |

## Risks & Mitigations

- **Adoption resistance** → Pilot one base first; show managers the unified view; keep mobile push on by default so it *feels* like WhatsApp.
- **Notification fatigue for managers** → Channels can be individually muted; @mentions still cut through.
- **Personal device use** → Teams mobile app supports the same BYOD model as WhatsApp; optional Intune policies if tighter control is needed.

## Asks

1. Approval to proceed
2. Teams Administrator access (or sponsor in IT)
3. One pilot base volunteer
4. 30 minutes per base for training during rollout
