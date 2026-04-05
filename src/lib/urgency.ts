import type { Task } from "@/types";

/**
 * A lead is urgent when it is marked hot OR has at least one open task
 * past its due date. Both `dueAt` and `now` are compared as UTC timestamps,
 * consistent with how Prisma stores DateTime fields.
 */
export function isUrgent(
  isHot: boolean,
  tasks: Pick<Task, "done" | "dueAt">[]
): boolean {
  if (isHot) return true;
  const now = new Date();
  return tasks.some((t) => !t.done && new Date(t.dueAt) < now);
}
