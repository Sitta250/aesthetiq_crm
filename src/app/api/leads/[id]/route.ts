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

const LEAD_STAGES = [
  "new_lead",
  "contacted",
  "qualified",
  "consultation_booked",
  "deposit_pending",
  "deposit_paid",
  "treatment_booked",
  "lost",
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

const PatchLeadSchema = z
  .object({
    name: z.string().min(1).optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    nationality: z.string().optional(),
    language: z.enum(LANGUAGES).optional(),
    treatmentInterest: z.string().min(1).optional(),
    travelDateStart: z.coerce.date().optional(),
    travelDateEnd: z.coerce.date().optional(),
    source: z.enum(LEAD_SOURCES).optional(),
    stage: z.enum(LEAD_STAGES).optional(),
    isForeign: z.boolean().optional(),
    isHot: z.boolean().optional(),
    lostReason: z.string().optional(),
    // Send null to explicitly unassign; omit to leave unchanged
    staffId: z.string().min(1).nullable().optional(),
  })
  .strict();

// Full include for the detail/drawer view
const detailInclude = {
  staff: true,
  tasks: {
    include: { staff: true },
    orderBy: { createdAt: "asc" as const },
  },
  notes: {
    include: { staff: true },
    orderBy: { createdAt: "asc" as const },
  },
} as const;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: detailInclude,
  });

  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  return NextResponse.json(lead);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = PatchLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const data = parsed.data;

  // Fetch current lead to apply conditional logic
  const current = await prisma.lead.findUnique({
    where: { id },
    select: { firstContactedAt: true, lostReason: true },
  });

  if (!current) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  // Enforce lostReason when transitioning to lost
  if (data.stage === "lost") {
    const resolvedReason = data.lostReason ?? current.lostReason;
    if (!resolvedReason) {
      return NextResponse.json(
        { error: "lostReason is required when stage is 'lost'" },
        { status: 422 }
      );
    }
  }

  // Set firstContactedAt once on first transition to 'contacted'
  const setFirstContacted =
    data.stage === "contacted" && current.firstContactedAt === null;

  const lead = await prisma.lead.update({
    where: { id },
    data: {
      ...data,
      ...(setFirstContacted && { firstContactedAt: new Date() }),
    },
    include: detailInclude,
  });

  return NextResponse.json(lead);
}
