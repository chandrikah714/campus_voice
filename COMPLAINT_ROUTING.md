# Campus Voice — Complaint Routing Workflow

## The definitive answer

**Routing is fully automatic, immediate, and category-based — there is no
admin approval or triage step.** This isn't a design choice I'm proposing;
it's what the deployed code actually does today, confirmed by reading
`ReportIssue.jsx`, `PendingIssues.jsx`, and `ManageComplaints.jsx`:

1. A student fills out the Report Issue form and **picks the department
   themselves** from a fixed list (`src/config/departments.js`) — this is
   the entire "matching logic." It is category-based in the loosest
   sense: the reporter is the classifier. There is no keyword matching and
   no ML classification anywhere in the codebase.
2. The complaint is written straight to Firestore with `status: "Pending"`
   the moment the form is submitted. No admin sees it first, no queue
   holds it, nothing needs to "approve" it before staff can see it.
3. Any staff account whose `department` field matches the complaint's
   `department` field sees it immediately in their Pending Issues queue
   (`PendingIssues.jsx` filters `c.department === user.department` on a
   live Firestore listener — no polling delay).
4. Admins see and can act on every complaint regardless of department, at
   any time, via Manage Complaints.

If a student mis-categorizes their own report (picks "Electrical" when it
was really a Wi-Fi issue that should've gone to "Information Technology"),
there is currently no reassignment path for staff to hand it to the right
department — only an admin can, from Manage Complaints. That's a real gap;
see recommendations below.

## Complete state machine

```
                    +-------------+
   Student submits  |             |
   --------------->  |   Pending   | <----------+
                     |             |            |
                     +------+------+            |
                            |                    |
              Staff (own dept) or Admin          |
              marks "Mark resolved" +            | Staff/Admin can
              required resolution note           | revert via
                            |                     | "Mark pending"
                            v                     |
                     +-------------+              |
                     |             |--------------+
                     |  Completed  |
                     |             |
                     +-------------+

  Orthogonal to status at every stage:
   - Any signed-in user can upvote/downvote (community-priority signal --
     not read by the routing logic anywhere, currently informational only)
   - Any signed-in user can add a discussion comment
   - Admin can delete a complaint outright, from either state
```

There is no "In Progress," "Acknowledged," or "Rejected" state — only
`Pending` and `Completed`. If you want a richer pipeline (e.g. "Staff
reviewing" as a distinct step before "Completed"), that's a schema change
(`status` becomes a 3+ value enum) plus updated filters everywhere `status`
is checked (`Home.jsx`, `MyIssues.jsx`, `PendingIssues.jsx`,
`ManageComplaints.jsx`, `AdminHome.jsx`, `MapView.jsx`) — a contained but
real change across ~6 files; ask if you want it built.

## User-facing status visibility, by stage

| Stage | Student sees | Staff (matching dept) sees | Admin sees |
|---|---|---|---|
| Submitted | Appears in "My Issues" as Pending | Appears in "Pending Issues" immediately | Appears in Manage Complaints + Analytics immediately |
| Resolved | Status flips to "Resolved" stamp on the card; if the Cloud Function is deployed and email is configured, they also get an email + in-app notification | Moves to "Recently resolved" list | Reflected in Analytics stats |

## Escalation — currently none

There is no automatic escalation for tickets sitting in Pending too long —
no aging check, no reminder, no auto-reassignment. This matches the
"SLA / resolution-time tracking" and "aging-ticket escalation" features
flagged as recommendations in an earlier round; they're still unbuilt.
If escalation matters now, the smallest version is:

- A scheduled Cloud Function (daily) that queries `complaints` where
  `status == "Pending"` and `timestamp` is older than N days, and either
  (a) notifies the department's staff again, or (b) notifies admins for
  manual triage of stale tickets.

## Notification protocol — currently

- **On submission:** nothing is sent to staff. They only find out a new
  ticket exists by having Pending Issues open (it updates live via
  Firestore) or checking back later. There's no "new ticket in your
  department" push/email today.
- **On resolution:** the reporting student gets an in-app notification
  always, plus an email and push notification *if* the
  `notifyComplaintCompletion` Cloud Function is deployed and its Gmail
  credentials/FCM token are configured (see the email-delivery fixes made
  alongside this document).

If you want staff notified the moment a ticket lands in their department
(a reasonable ask — right now they only find out by looking), that's a
small addition: a Firestore trigger on `complaints` **onCreate** that
writes a `notifications` doc for each staff member in the matching
department, following the same pattern as `notifyComplaintCompletion`.

## If you want to move to admin-gated triage instead

Everything above describes the fully-automatic system as it exists. If you
instead want admin approval **before** a complaint becomes visible to
staff (e.g. to filter spam/duplicates, or to manually re-route
mis-categorized reports before they reach a department), the shape of that
change would be:

1. New status value `"Awaiting Review"` as the initial state instead of
   `"Pending"`.
2. `PendingIssues.jsx`'s staff query already filters on `status ==
   "Pending"` explicitly, so staff simply never see `"Awaiting Review"`
   tickets — no other staff-side change needed.
3. A new admin queue (`/admin/triage`) showing `"Awaiting Review"`
   tickets, where an admin can edit the department (fixing
   mis-categorization) and flip status to `"Pending"` to release it to
   staff, or reject it outright.
4. An SLA field on that queue — e.g. a red flag if a ticket has sat in
   `"Awaiting Review"` for more than a configurable number of hours.

This is a meaningfully bigger change than a bug fix (new page, new status
value, updated filters in ~4 files, a real product decision about whether
*all* complaints need triage or only some) — let me know if this is the
direction you actually want and it can be built out properly rather than
guessed at.
