import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const LEAD_SOURCES = [
  "instagram",
  "facebook",
  "line",
  "whatsapp",
  "website",
  "referral",
  "other",
] as const;

const LANGUAGES = [
  "EN",
  "TH",
  "ZH",
  "JA",
  "RU",
  "KO",
  "AR",
  "OTHER",
] as const;

// ── Query params ────────────────────────────────────────────────────────────
const ListQuerySchema = z.object({
  search: z.string().optional(),
  // URL params arrive as strings; convert to boolean in the where clause
  isForeign: z.enum(["true", "false"]).optional(),
  isHot: z.enum(["true", "false"]).optional(),
  staffId: z.string().min(1).optional(),
  source: z.enum(LEAD_SOURCES).optional(),
});

// ── Create body ─────────────────────────────────────────────────────────────
const CreateLeadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  nationality: z.string().optional(),
  language: z.enum(LANGUAGES).default("EN"),
  treatmentInterest: z.string().min(1, "Treatment interest is required"),
  travelDateStart: z.coerce.date().optional(),
  travelDateEnd: z.coerce.date().optional(),
  source: z.enum(LEAD_SOURCES),
  isForeign: z.boolean().default(false),
  isHot: z.boolean().default(false),
  // Optional — omit or send null to create unassigned
  staffId: z.string().min(1).optional(),
});

// ── Prisma include shared by list and create ────────────────────────────────
// Notes are NOT included here — the drawer fetches the single lead for those.
const boardInclude = {
  staff: true,
  tasks: {
    include: { staff: true },
    orderBy: { createdAt: "asc" as const },
  },
} as const;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const parsed = ListQuerySchema.safeParse({
    search: searchParams.get("search") ?? undefined,
    isForeign: searchParams.get("isForeign") ?? undefined,
    isHot: searchParams.get("isHot") ?? undefined,
    staffId: searchParams.get("staffId") ?? undefined,
    source: searchParams.get("source") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { search, isForeign, isHot, staffId, source } = parsed.data;

  const leads = await prisma.lead.findMany({
    where: {
      ...(search && { name: { contains: search, mode: "insensitive" } }),
      ...(isForeign !== undefined && { isForeign: isForeign === "true" }),
      ...(isHot !== undefined && { isHot: isHot === "true" }),
      ...(staffId && { staffId }),
      ...(source && { source }),
    },
    include: boardInclude,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(leads);
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CreateLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { staffId, ...data } = parsed.data;

  const lead = await prisma.lead.create({
    data: {
      ...data,
      ...(staffId ? { staffId } : {}),
    },
    include: boardInclude,
  });

  return NextResponse.json(lead, { status: 201 });
}
