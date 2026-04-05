# AesthetiQ CRM — Project Reference

## What We're Building
A web-based CRM tool that helps Bangkok-based premium aesthetic and anti-aging clinics
convert more foreign and local patient inquiries into confirmed bookings.
It organizes lead follow-up, qualification, and staff handoff in one system.

## The Problem It Solves
Clinic staff currently manage inquiries across LINE, WhatsApp, Instagram DMs, Facebook,
and website forms — all in separate places. Leads fall through the cracks, follow-ups
are missed, and there's no visibility into which sources or staff drive the most bookings.

---

## Target Users
- Clinic coordinators and front desk staff (daily use)
- Clinic managers and owners (dashboard + reporting)
- Doctors (consultation stage handoff)

---

## Tech Stack
- **Framework:** Next.js 14 App Router (TypeScript)
- **Database:** Supabase (Postgres + Auth + Realtime)
- **ORM:** Prisma
- **UI:** Tailwind CSS + shadcn/ui
- **Data fetching:** TanStack React Query
- **Validation:** Zod
- **Deployment:** Vercel

---

## Database Tables
- `leads` — patient inquiries with full profile
- `tasks` — follow-up reminders linked to leads
- `notes` — conversation history and internal notes
- `staff` — clinic employees who own and manage leads (Role: `admin` | `staff` | `doctor`). Supabase Auth user ↔ Staff row linking is deferred until login is implemented; the schema stays clinic-domain roles only.
- `templates` — canned reply messages in multiple languages

---

## Pipeline Stages (in order)
1. `new_lead` — just came in, not yet contacted
2. `contacted` — staff has reached out
3. `qualified` — treatment interest and budget confirmed
4. `consultation_booked` — appointment scheduled
5. `deposit_pending` — awaiting deposit payment
6. `deposit_paid` — deposit received
7. `treatment_booked` — full booking confirmed
8. `lost` — lead dropped off, reason recorded

---

## Lead Sources
- Instagram
- Facebook
- LINE
- WhatsApp
- Website form
- Referral
- Other

---

## Supported Languages (for templates)
EN, TH, ZH, JA, RU, KO, AR, OTHER

---

## Template Categories (enum → display label)
| Enum value | Display label |
|---|---|
| `welcome` | Welcome |
| `follow_up` | Follow-up |
| `deposit_reminder` | Deposit reminder |
| `confirmation` | Consultation confirmation |
| `re_engage` | Re-engagement |

Seed data uses the enum values; UI renders the display labels from this mapping.

---

## Core Features by Phase

### Phase 1 — Project Setup ✅
- Next.js 14 project scaffolded
- Supabase project created and connected
- Prisma initialized and connected to Supabase
- Folder structure established
- CLAUDE.md written for AI tool context
- Environment variables configured

### Phase 2 — Database Schema ✅

Phase 2 defines the **single source of truth** for leads, ownership, follow-up artifacts, and multilingual templates so later phases (board, tasks, dashboard, webhooks) read and write consistent data. The schema should support the clinic’s core loop: **capture → qualify → book → deposit → treatment**, with clear attribution to **staff** and **source**, and enough structure to answer the [KPI stack](#kpi-stack) without ad-hoc spreadsheets.

**Tables (Prisma models)**  
Map 1:1 to the five domain tables in [Database Tables](#database-tables): `Lead`, `Task`, `Note`, `Staff`, `Template`. Relations include: lead ↔ staff (owner), tasks and notes scoped to a lead (cascade where appropriate), templates standalone for lookup by language and category.

**Enums**  
- **Pipeline:** `LeadStage` — all eight stages in [Pipeline Stages](#pipeline-stages-in-order), same order conceptually.  
- **Attribution:** `LeadSource` — aligned with [Lead Sources](#lead-sources).  
- **Locales:** `Language` — aligned with [Supported Languages](#supported-languages-for-templates).  
- **Staff:** `Role` — `admin`, `staff`, `doctor` (clinic responsibilities; not the same as a Supabase Auth role until login links a user to a `Staff` row in a later phase).  
- **Templates:** `TemplateCategory` — stored in the DB as stable snake_case keys; UI copy in Phase 6 uses human labels:

| Enum value (`TemplateCategory`) | Product label (Phase 6) |
|---------------------------------|-------------------------|
| `welcome` | Welcome |
| `follow_up` | Follow-up |
| `deposit_reminder` | Deposit reminder |
| `confirmation` | Consultation confirmation |
| `re_engage` | Re-engagement |

**KPI- and UX-ready fields (leads)**  
- **`lostReason`** — optional text when stage is `lost`; powers lost-reason reporting (Phase 5).  
- **`firstContactedAt`** — optional timestamp; set once on first meaningful contact (rule chosen in Phase 3 API/UI, e.g. first transition to `contacted` or first logged outbound touch). Anchors **lead response time** in the [KPI stack](#kpi-stack).  
- **`isForeign` / `isHot`** — support filters and “hot foreign lead” visibility (Phase 3).  
- **Urgency on cards (Phase 3)** — **not** a separate DB column by default; treat urgency as **derived** from open tasks past `dueAt`, `isHot`, and later queue rules (Phase 4). Add a dedicated priority field only if product explicitly requires manual override.

**Tasks & notes**  
Tasks carry `dueAt`, `done`, and optional staff assignment for the follow-up queue and overdue indicators. Notes carry content and optional author staff for conversation and internal history (timestamps UTC; display Asia/Bangkok per conventions).

**Deliverables**  
- Prisma schema for all five models, enums above, and foreign keys / `onDelete` behavior documented in code comments where non-obvious.  
- Versioned SQL migrations; `prisma migrate deploy` applied to Supabase for the target environment.  
- `prisma generate` outputs the client to `src/generated/prisma`; app code imports `PrismaClient` from `@/generated/prisma/client` (see `src/lib/prisma.ts`).  
- **`prisma/seed.ts`** — realistic sample `Staff` (mixed roles) and `Template` rows across languages and categories so Phase 3 can be exercised without manual data entry.  
- Shared TypeScript types in `src/types/index.ts` updated or aligned with the schema for leads (including `firstContactedAt` when present).

**Out of scope for Phase 2**  
REST routes, Zod, and UI — those belong to Phases 3 onward; Phase 2 only ensures the database layer matches this contract.

### Phase 3 — Pipeline Board ✅
- Kanban board with 8 stage columns
- Lead cards showing name, nationality, treatment, source, urgency, staff
- Create new lead form (manual entry)
- Lead profile drawer (click any card)
  - Full profile fields
  - Stage change dropdown
  - Notes and conversation history
  - Quick reply with template selector
- Filter by: All / Foreign / Hot / Local / Staff / Source
- Search leads by name

### Phase 4 — Follow-up + Tasks
- Follow-up queue sorted by urgency (overdue first)
- Task creation linked to a lead
- Due date reminders
- Staff assignment per lead
- Mark task as done
- Overdue alert indicators on lead cards

### Phase 5 — Dashboard
- KPI cards:
  - Leads this week
  - Average response time
  - Consultation booking rate
  - Deposit paid rate
  - Foreign leads active
  - Awaiting follow-up count
  - Booking confirmation rate
  - Foreign vs local conversion rate
- Conversion funnel chart
- Source performance table (leads + booking % per source)
- Lost lead reasons breakdown
- Staff performance table (leads owned + booking % + avg response time)

### Phase 6 — Templates + Polish
- Multilingual canned reply templates
  - Welcome (EN, TH, ZH, JA, RU)
  - Follow-up
  - Deposit reminder
  - Consultation confirmation
  - Re-engagement
- Copy-to-clipboard per template
- Template filtered by lead language in drawer
- Search and filter UI polish
- Mobile-responsive layout cleanup
- Loading states and error handling

### Phase 7 — Lead Capture + Webhooks
- Webhook endpoints for:
  - LINE Official Account
  - WhatsApp Business API
  - Facebook Lead Ads
  - Instagram DM (via Meta API)
- Embeddable website inquiry form
- Auto source-tagging on inbound leads
- Auto-reply trigger (fires language template on lead creation)
- Duplicate lead detection

---

## Key Questions the System Must Answer
- How many leads came in this week?
- Which leads are waiting for follow-up?
- Which foreign leads are hot?
- Which staff member owns each lead?
- Which source brings the best bookings?
- How many leads made it to consultation?
- How many paid a deposit?
- Why were leads lost?

---

## KPI Stack
| KPI | Description |
|-----|-------------|
| Lead response time | Time from lead creation to first staff contact |
| Consultation booking rate | % of leads that reach consultation_booked |
| Deposit paid rate | % of leads that reach deposit_paid |
| Booking confirmation rate | % of leads that reach treatment_booked |
| Lost lead reasons | Breakdown of why leads were marked lost |
| Source-to-booking performance | Which source converts best end-to-end |
| Foreign lead conversion rate | Conversion rate for non-Thai leads vs Thai leads |

---

## Folder Structure
```
aesthetiq-crm/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── page.tsx          # dashboard home
│   │   │   └── layout.tsx
│   │   └── api/
│   │       ├── leads/
│   │       │   └── route.ts      # GET all leads, POST new lead
│   │       ├── leads/[id]/
│   │       │   └── route.ts      # GET, PATCH, DELETE single lead
│   │       ├── tasks/
│   │       │   └── route.ts
│   │       ├── notes/
│   │       │   └── route.ts
│   │       └── templates/
│   │           └── route.ts
│   ├── components/
│   │   ├── pipeline/             # kanban board components
│   │   ├── leads/                # lead card, drawer, form
│   │   └── dashboard/            # KPI cards, charts
│   ├── lib/
│   │   ├── prisma.ts             # Prisma client singleton
│   │   ├── supabase.ts           # Supabase client (browser + server)
│   │   └── utils.ts              # cn() and shared helpers
│   ├── types/
│   │   └── index.ts              # all shared TypeScript types
│   └── hooks/                    # custom React hooks
├── CLAUDE.md                     # AI tool context (do not delete)
├── PROJECT_REFERENCE.md          # this file
└── .env                          # environment variables (never commit)
```

---

## Derived Fields (no DB column)

- **Urgency** — computed at the application layer, not stored. A lead is urgent when `isHot === true` OR it has at least one open task with `dueAt < now()` and `done === false`. No Prisma change unless the product later asks for manual priority overrides.

---

## Coding Conventions
- Server components by default — add `"use client"` only when needed
- All DB queries go through Prisma (never raw SQL)
- Zod validation on every API route input
- `cn()` from `/lib/utils.ts` for all className merging
- Dates stored as UTC, displayed in Asia/Bangkok timezone
- Component names: PascalCase
- API routes: `/src/app/api/[resource]/route.ts` pattern
- No new UI primitives — use shadcn/ui components

---

## Environment Variables (.env)
```
DATABASE_URL=          # Supabase direct connection (port 5432)
DIRECT_URL=            # Supabase direct connection (port 5432, same as above)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## AI Tool Usage
- **Claude Code (terminal):** scaffolding features, running migrations, multi-file tasks, git commits
- **Cursor (IDE):** editing specific files, fixing bugs, UI tweaks, in-context questions
- **CLAUDE.md:** read automatically by both tools — keep it updated as conventions evolve
- **Workflow:** Claude Code scaffolds → Cursor refines → Claude Code runs/tests → Cursor fixes

---

## Build Progress
- [x] Phase 1 — Setup
- [x] Phase 2 — Database schema
  - Prisma schema: `Lead`, `Task`, `Note`, `Staff`, `Template` + all enums
  - `firstContactedAt DateTime?` on `Lead` — anchors lead response time KPI
  - Urgency is derived (not a DB column): `isHot` OR open task with `dueAt < now()`
  - Role enum: `admin | staff | doctor` — Supabase Auth ↔ Staff linking deferred to login phase
  - Template categories: enum values are snake_case; display labels mapped in reference doc
  - Two migrations applied to Supabase; Prisma client regenerated
  - `prisma/seed.ts` wired via `package.json` — 3 staff (varied roles) + 13 templates (5 languages, all 5 categories)
  - `src/types/index.ts` updated to include `firstContactedAt?: Date` on `Lead`
- [ ] Phase 3 — Pipeline board
- [ ] Phase 4 — Follow-up + tasks
- [ ] Phase 5 — Dashboard
- [ ] Phase 6 — Templates + polish
- [ ] Phase 7 — Lead capture + webhooks
