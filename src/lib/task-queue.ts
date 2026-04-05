import type { TaskWithLead } from "@/types";

export function sortTasksByUrgency(tasks: TaskWithLead[]): TaskWithLead[] {
  const now = new Date();

  return [...tasks].sort((a, b) => {
    const aOverdue = new Date(a.dueAt) < now;
    const bOverdue = new Date(b.dueAt) < now;

    // Overdue tasks come first
    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;

    // Both in same overdue bucket — sort by soonest dueAt
    const dateDiff = new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
    if (dateDiff !== 0) return dateDiff;

    // Tie-break: hot lead first
    if (a.lead.isHot !== b.lead.isHot) return a.lead.isHot ? -1 : 1;

    // Final tie-break: lead name alpha
    return a.lead.name.localeCompare(b.lead.name);
  });
}
