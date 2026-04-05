import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createTaskSchema = z.object({
  leadId: z.string(),
  title: z.string().min(1),
  dueAt: z.string().datetime(),
  staffId: z.string().optional(),
});

export async function GET() {
  const tasks = await prisma.task.findMany({
    where: { done: false },
    orderBy: { dueAt: "asc" },
    include: {
      lead: { include: { staff: true } },
      staff: true,
    },
  });

  return Response.json(tasks);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createTaskSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { leadId, title, dueAt, staffId } = parsed.data;

  const task = await prisma.task.create({
    data: {
      leadId,
      title,
      dueAt: new Date(dueAt),
      staffId,
    },
    include: {
      lead: { include: { staff: true } },
      staff: true,
    },
  });

  return Response.json(task, { status: 201 });
}
