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
- `staff` — clinic employees who own and manage leads
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

## Core Features by Phase

### Phase 1 — Project Setup ✅
- Next.js 14 project scaffolded
- Supabase project created and connected
- Prisma initialized and connected to Supabase
- Folder structure established
- CLAUDE.md written for AI tool context
- Environment variables configured

### Phase 2 — Database Schema
- Prisma schema for all 5 tables
- Enums for stage, source, language, role
- Relations between tables
- Migration pushed to Supabase
- Seed file with sample staff and templates

### Phase 3 — Pipeline Board
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

## Coding Conventions
- Server components by default — add `"use client"` only when needed
- All DB queries go through Prisma (never raw SQL)
- Zod validation on every API route input
- `cn()` from `/lib/utils.ts` for all className merging
- Dates stored as UTC, displayed in Asia/Bangkok timezone
- Component names: PascalCase
- API routes: `/app/api/[resource]/route.ts` pattern
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
- [ ] Phase 2 — Database schema
- [ ] Phase 3 — Pipeline board
- [ ] Phase 4 — Follow-up + tasks
- [ ] Phase 5 — Dashboard
- [ ] Phase 6 — Templates + polish
- [ ] Phase 7 — Lead capture + webhooks
