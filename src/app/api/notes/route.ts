import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const CreateNoteSchema = z.object({
  leadId: z.string().min(1),
  content: z.string().min(1, "Content is required"),
  staffId: z.string().min(1).optional(),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CreateNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { leadId, content, staffId } = parsed.data;

  // Verify lead exists before creating the note
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true },
  });

  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const note = await prisma.note.create({
    data: {
      leadId,
      content,
      ...(staffId ? { staffId } : {}),
    },
    include: { staff: true },
  });

  return NextResponse.json(note, { status: 201 });
}
