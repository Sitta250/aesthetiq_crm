import { prisma } from "@/lib/prisma";
import { sortTasksByUrgency } from "@/lib/task-queue";
import FollowUpClient from "@/components/follow-up/FollowUpClient";
import type { TaskWithLead } from "@/types";

export default async function FollowUpPage() {
  const rows = await prisma.task.findMany({
    where: { done: false },
    orderBy: { dueAt: "asc" },
    include: {
      lead: { include: { staff: true } },
      staff: true,
    },
  });

  const sorted = sortTasksByUrgency(rows as TaskWithLead[]);

  return <FollowUpClient initialTasks={sorted} />;
}
