import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patchNoteSchema = z.object({
  content: z.string().min(1),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = patchNoteSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.note.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ error: "Note not found" }, { status: 404 });
  }

  const note = await prisma.note.update({
    where: { id },
    data: { content: parsed.data.content },
    include: { staff: true },
  });

  return Response.json(note);
}
