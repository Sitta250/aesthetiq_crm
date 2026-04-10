"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { sortTasksByUrgency } from "@/lib/task-queue";
import { formatBangkokDateTime } from "@/lib/dates";
import LeadDrawer from "@/components/leads/LeadDrawer";
import { Badge } from "@/components/ui/badge";
import { cn, staffShortName } from "@/lib/utils";
import type { TaskWithLead } from "@/types";

const STAGE_LABELS: Record<string, string> = {
  new_lead: "New Lead",
  contacted: "Contacted",
  qualified: "Qualified",
  consultation_booked: "Consultation",
  deposit_pending: "Deposit Pending",
  deposit_paid: "Deposit Paid",
  treatment_booked: "Booked",
  lost: "Lost",
};

async function fetchTasks(): Promise<TaskWithLead[]> {
  const res = await fetch("/api/tasks");
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

interface Props {
  /** From server render; dates may hydrate as ISO strings */
  initialTasks: TaskWithLead[];
}

export default function FollowUpClient({ initialTasks }: Props) {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const { data: tasks = initialTasks } = useQuery({
    queryKey: ["tasks"],
    queryFn: fetchTasks,
    initialData: initialTasks,
    staleTime: 30_000,
  });

  const sorted = sortTasksByUrgency(tasks);
  const now = new Date();

  return (
    <div className="px-6 py-6">
      <div className="mb-6">
        <h1 className="text-base font-semibold text-gray-900">Follow-up Queue</h1>
        <p className="mt-0.5 text-xs text-gray-500">
          Open tasks · sorted overdue first
        </p>
      </div>

      {sorted.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
          {sorted.map((task) => {
            const overdue = new Date(task.dueAt) < now;
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => setSelectedLeadId(task.lead.id)}
                className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-gray-50"
              >
                <span
                  className={cn(
                    "mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full",
                    overdue ? "bg-red-500" : "bg-gray-300"
                  )}
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {task.title}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-gray-500">
                    {task.lead.name} · {task.lead.treatmentInterest}
                  </p>
                </div>

                <Badge
                  variant="outline"
                  className="shrink-0 border-gray-300 px-1.5 py-0 text-[10px] text-gray-500"
                >
                  {STAGE_LABELS[task.lead.stage] ?? task.lead.stage}
                </Badge>

                <span
                  className={cn(
                    "shrink-0 font-mono text-xs",
                    overdue ? "font-medium text-red-500" : "text-gray-400"
                  )}
                >
                  {formatBangkokDateTime(task.dueAt)}
                </span>

                {task.lead.staff && (
                  <span className="shrink-0 text-[10px] text-gray-400">
                    · {staffShortName(task.lead.staff.name)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <LeadDrawer
        leadId={selectedLeadId}
        open={!!selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-white py-16">
      <p className="text-sm font-medium text-gray-900">All caught up</p>
      <p className="mt-1 text-xs text-gray-400">No open follow-up tasks</p>
    </div>
  );
}
