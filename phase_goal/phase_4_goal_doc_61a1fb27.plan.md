---
name: Phase 4 goal doc
overview: Phase 4 doc should be a short intro plus Step 1, Step 2, … — small implementation steps for Claude. When approved, materialize as phase_goal/goal_phase_4.md in the same shape.
todos:
  - id: write-goal-phase-4-md
    content: Create phase_goal/goal_phase_4.md (brief context + numbered steps only; mirror this plan)
    status: pending
  - id: execute-steps-1-n
    content: Implement Phase 4 by following goal_phase_4.md step order; one step per session/PR if desired
    status: pending
isProject: false
---

# Phase 4 plan — shape of `goal_phase_4.md`

The file **phase_goal/goal_phase_4.md** should look like this: a **short context block** at the top, then **Step 1, Step 2, …** only. Each step is one focused unit of work Claude can complete before moving on.

Below is the full content to put in `goal_phase_4.md` (no heavy tables or mermaid unless you add them later).

---

## Copy into `goal_phase_4.md` — starts below

---

**Context (read first)**  
Phase 4 ships **follow-up + tasks**: a urgency-sorted follow-up queue, creating tasks on leads, due dates, marking tasks done, and clear overdue signals on lead cards. **Prerequisites:** Phases 1–3 done ([prisma/schema.prisma](prisma/schema.prisma) has `Task`; pipeline + [LeadDrawer](src/components/leads/LeadDrawer.tsx) exist). **Conventions:** Prisma only, Zod on API bodies, dates UTC in DB / Asia/Bangkok in UI, React Query keys `["leads"]`, `["lead", leadId]`. **Out of scope:** Phase 5 dashboard, Phase 6 template admin, Phase 7 webhooks. **Locked:** In-app reminders only (no email/push). Route for queue: **`/follow-up`**. **Locked (Step 6):** Opening a lead from the follow-up queue uses the **same `LeadDrawer` component** on the follow-up page with **local React state** (`selectedLeadId`). Do **not** rely on `/?leadId=` for Phase 4; the pipeline at `/` still uses its own drawer state and does not read `searchParams` for the drawer today. **Locked (Step 11):** Overdue polish on pipeline **lead cards** is a **badge showing the count** of open overdue tasks (not tooltip-only).

---

### Step 1 — Replace stub `GET /api/tasks`

- **File:** [src/app/api/tasks/route.ts](src/app/api/tasks/route.ts)
- **Do:** Implement `GET` returning tasks where `done === false`, ordered for follow-up use (you will refine sort in Step 4; for now `orderBy: { dueAt: "asc" }` is fine). `include`: `lead` with `staff: true`, and task `staff: true`.
- **Done when:** `GET /api/tasks` returns real rows from the DB (not `[]`), shape matches what the UI will need (lead name, stage, owner on lead).

### Step 2 — Add `POST /api/tasks`

- **File:** same [src/app/api/tasks/route.ts](src/app/api/tasks/route.ts)
- **Do:** Add `POST` with Zod: `leadId` (string), `title` (string), `dueAt` (ISO datetime string), optional `staffId`. Create task; return `201` + JSON task.
- **Done when:** New task appears in DB and shows up on `GET /api/tasks`.

### Step 3 — Add `PATCH /api/tasks/[id]`

- **File:** create [src/app/api/tasks/[id]/route.ts](src/app/api/tasks/[id]/route.ts)
- **Do:** `PATCH` with Zod partial body: `done` (boolean), optional `title`, `dueAt`, `staffId`. Update one task by id; `404` if missing.
- **Done when:** Can mark a task `done: true` via API and it disappears from open-task `GET` (or shows as done if you add a query flag later—default queue is open only).

### Step 4 — Shared sort for “urgency” (queue)

- **File:** add e.g. [src/lib/task-queue.ts](src/lib/task-queue.ts) (or extend [src/lib/urgency.ts](src/lib/urgency.ts))
- **Do:** Export a pure function that takes open tasks (with `dueAt`, and nested `lead` for `isHot` / name) and returns them sorted: **overdue first** (`dueAt < now` UTC), then **soonest `dueAt`**, then tie-break (e.g. hot lead, then lead name).
- **Done when:** Unit clarity: same input always yields same order; use this on the follow-up page (Step 6).

### Step 5 — Page route shell for follow-up queue

- **File:** [src/app/(dashboard)/follow-up/page.tsx](src/app/(dashboard)/follow-up/page.tsx)
- **Do:** New route at **`/follow-up`**. Client component or split: fetch `GET /api/tasks` with React Query, show loading and empty states (match pipeline tone).
- **Done when:** Visiting `/follow-up` shows loading then a list placeholder or data (wired in Step 6).

### Step 6 — Follow-up queue UI (list) + open lead in drawer

- **Files:** [src/app/(dashboard)/follow-up/page.tsx](src/app/(dashboard)/follow-up/page.tsx) (+ small presentational components under [src/components/](src/components/) if needed)
- **Locked decision:** **Reuse `LeadDrawer` on `/follow-up`** (recommended). The pipeline board uses **local state** for the drawer, not URL params—navigating to `/?leadId=…` would **not** open the drawer without extra work. For Phase 4, **do not** add `searchParams` wiring to the pipeline unless you explicitly expand scope.
- **Do:**
  1. Render sorted tasks (use Step 4). Each row: task title, due date/time in Bangkok, lead name, source or stage badge, lead owner initials if useful.
  2. Mount **`LeadDrawer`** from [src/components/leads/LeadDrawer.tsx](src/components/leads/LeadDrawer.tsx) on this page. Hold `selectedLeadId: string | null` (or equivalent). Row `onClick` → `setSelectedLeadId(task.lead.id)`.
  3. Pass `leadId={selectedLeadId}`, `open={!!selectedLeadId}`, `onClose={() => setSelectedLeadId(null)}`. Optionally pass `previewLead` from the task row if you already have list shape (same pattern as pipeline prefetch).
- **Reference pattern:**

```tsx
// follow-up/page.tsx — sketch
<LeadDrawer
  leadId={selectedLeadId}
  open={!!selectedLeadId}
  onClose={() => setSelectedLeadId(null)}
/>
// Row click:
onClick={() => setSelectedLeadId(task.lead.id)}
```

- **Done when:** Queue is readable and sorted overdue-first; clicking a row opens **`LeadDrawer`** on `/follow-up` for that lead (no broken navigation to `/` expecting a drawer).

### Step 7 — Lead drawer: list tasks

- **File:** [src/components/leads/LeadDrawer.tsx](src/components/leads/LeadDrawer.tsx)
- **Do:** For the loaded lead, render existing `lead.tasks`: title, due (Bangkok), done state. Open tasks first or separate sections—keep it simple.
- **Done when:** Tasks from API/detail match what you see in the drawer.

### Step 8 — Lead drawer: create task

- **Files:** [src/components/leads/LeadDrawer.tsx](src/components/leads/LeadDrawer.tsx), reuse [GET /api/staff](src/app/api/staff/route.ts) if you add assignee dropdown
- **Do:** Form: title, due datetime (convert to ISO for API), optional `staffId`. `POST /api/tasks` + invalidate `["leads"]` and `["lead", leadId]` and `["tasks"]` or whatever query key the queue uses.
- **Done when:** New task created from drawer appears in drawer list and on `/follow-up`.

### Step 9 — Lead drawer: mark task done

- **File:** [src/components/leads/LeadDrawer.tsx](src/components/leads/LeadDrawer.tsx)
- **Do:** Per-task control (checkbox or button) calls `PATCH` with `done: true`; invalidate same keys as Step 8.
- **Done when:** Completing a task removes it from open queue and updates drawer.

### Step 10 — Sidebar nav

- **File:** [src/components/layout/AppNav.tsx](src/components/layout/AppNav.tsx)
- **Do:** Add nav item **Follow-up** → `/follow-up` with an icon; active state when pathname matches.
- **Done when:** Sidebar shows Pipeline + Follow-up + disabled Analytics.

### Step 11 — Lead cards: overdue indicator polish (optional but recommended)

- **File:** [src/components/leads/LeadCard.tsx](src/components/leads/LeadCard.tsx)
- **Locked decision:** Use a **badge with count** of open overdue tasks (recommended). Do **not** use tooltip-only for Phase 4; you may add a tooltip *in addition* to the badge if helpful for accessibility.
- **Do:** [src/lib/urgency.ts](src/lib/urgency.ts) already drives red border/dot. Compute `overdueCount` from `lead.tasks` (open + `dueAt < now`, UTC). Show a compact numeric badge (e.g. on the card or next to the urgency dot) when `overdueCount > 0`; hide or show “0” per your UX preference (usually hide when zero).
- **Done when:** Staff see **how many** overdue follow-ups at a glance on the card, plus existing red border/dot when [isUrgent](src/lib/urgency.ts) is true.

### Step 12 — Sanity pass

- **Do:** Create a lead with multiple tasks (overdue + future); confirm queue order, drawer list, PATCH done, pipeline cards still show urgency correctly. Fix any missing React Query invalidation.
- **Done when:** Phase 4 acceptance criteria from [phase_goal/PROJECT_REFERENCE.md](phase_goal/PROJECT_REFERENCE.md) (Phase 4 section) are met.

---

## Notes for maintainers

- If `goal_phase_4.md` is created from this plan, use **optional** YAML frontmatter at the top only if you rely on tooling (same style as [goal_phase_3.md](goal_phase_3.md)); otherwise plain markdown starting with **Context** is fine.
- Implementation order is strict: **Steps 1–3** (API) before **4–6** (queue), **7–9** (drawer) can overlap after Step 3, **10** anytime after Step 5, **11** last.
