import type { Task } from "@/types";

/**
 * Open follow-up task past its due time (UTC comparison, same as stored DateTime).
 */
export function hasLateFollowUp(
  tasks: Pick<Task, "done" | "dueAt">[]
): boolean {
  const now = new Date();
  return tasks.some((t) => !t.done && new Date(t.dueAt) < now);
}
