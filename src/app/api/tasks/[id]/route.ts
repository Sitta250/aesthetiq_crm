import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patchTaskSchema = z.object({
  done: z.boolean().optional(),
  title: z.string().min(1).optional(),
  dueAt: z.string().datetime().optional(),
  staffId: z.string().nullable().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = patchTaskSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { dueAt, ...rest } = parsed.data;

  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ error: "Task not found" }, { status: 404 });
  }

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...rest,
      ...(dueAt !== undefined ? { dueAt: new Date(dueAt) } : {}),
    },
    include: {
      lead: { include: { staff: true } },
      staff: true,
    },
  });

  return Response.json(task);
}
