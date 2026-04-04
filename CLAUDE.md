# AesthetiQ CRM — project context

## Stack
- Next.js 14 App Router (TypeScript)
- Supabase (Postgres + Auth + Realtime)
- Prisma ORM
- Tailwind CSS + shadcn/ui
- Deployed on Vercel

## Conventions
- All components in /components, named PascalCase
- All API routes in /app/api/[resource]/route.ts
- Use server components by default, add "use client" only when needed
- All DB queries go through Prisma client in /lib/prisma.ts
- Zod for all input validation in API routes
- Use React Query (TanStack) for client-side data fetching
- Dates stored as UTC, displayed in Asia/Bangkok timezone
- cn() utility from /lib/utils.ts for className merging

## Domain language
- Lead = a potential patient inquiry
- Stage = pipeline step (new_lead, contacted, qualified, consultation_booked, deposit_pending, deposit_paid, treatment_booked, lost)
- Staff = clinic employee who owns leads
- Template = canned reply in a specific language

## Key files
- /lib/prisma.ts — Prisma client singleton
- /lib/supabase.ts — Supabase client
- /types/index.ts — all shared TypeScript types

## Do not
- Do not use Pages Router
- Do not use CSS-in-JS
- Do not create new UI primitives — use shadcn/ui
- Do not write raw SQL — use Prisma
- Do not add "use client" unless the component needs browser APIs or interactivity
