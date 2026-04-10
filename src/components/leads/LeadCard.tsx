"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import {
  fetchLeadDetail,
  fetchTemplatesByLanguage,
} from "@/lib/lead-queries";
import { hasLateFollowUp } from "@/lib/urgency";
import { cn, staffShortName } from "@/lib/utils";
import type { LeadWithBoardRelations } from "@/types";

const SOURCE_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  line: "LINE",
  whatsapp: "WhatsApp",
  website: "Website",
  referral: "Referral",
  other: "Other",
};


interface Props {
  lead: LeadWithBoardRelations;
  onSelect: (lead: LeadWithBoardRelations) => void;
}

export default function LeadCard({ lead, onSelect }: Props) {
  const queryClient = useQueryClient();

  const now = new Date();
  const overdueCount = lead.tasks.filter(
    (t) => !t.done && new Date(t.dueAt) < now
  ).length;
  const lateFollowUp = hasLateFollowUp(lead.tasks);

  const prefetchDetail = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: ["lead", lead.id],
      queryFn: () => fetchLeadDetail(lead.id),
      staleTime: 60_000,
    });
    queryClient.prefetchQuery({
      queryKey: ["templates", lead.language],
      queryFn: () => fetchTemplatesByLanguage(lead.language),
      staleTime: 5 * 60_000,
    });
  }, [queryClient, lead.id, lead.language]);

  return (
    <button
      type="button"
      onMouseEnter={prefetchDetail}
      onFocus={prefetchDetail}
      onClick={() => onSelect(lead)}
      className={cn(
        "relative w-full text-left rounded-md border bg-white px-3 py-2.5 transition-colors",
        lateFollowUp
          ? "border-red-300 hover:border-red-400"
          : "border-gray-200 hover:border-gray-300"
      )}
    >
      {/* Late follow-up: count + dot (red border only for overdue tasks, not for “hot”) */}
      {lateFollowUp && (
        <div className="absolute top-2 right-2 flex items-center gap-1">
          {overdueCount > 0 && (
            <span className="rounded-full bg-red-500 px-1.5 py-0 font-mono text-[9px] font-semibold leading-4 text-white">
              {overdueCount}
            </span>
          )}
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        </div>
      )}

      {/* Name — hot tag is separate from overdue styling */}
      <p className="flex min-w-0 items-center gap-1.5 pr-10 text-sm font-medium text-gray-900">
        {lead.isHot && (
          <Badge
            variant="outline"
            className="shrink-0 border-amber-400/80 bg-amber-50 px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wide text-amber-900"
          >
            Hot
          </Badge>
        )}
        <span className="truncate">{lead.name}</span>
      </p>

      {/* Treatment */}
      <p className="mt-0.5 truncate text-xs text-gray-500">
        {lead.treatmentInterest}
      </p>

      {/* Meta row */}
      <div className="mt-1.5 flex items-center gap-1.5">
        {lead.nationality && (
          <span className="text-[10px] text-gray-400">{lead.nationality}</span>
        )}
        <Badge
          variant="outline"
          className="border-gray-300 px-1 py-0 text-[10px] text-gray-500"
        >
          {SOURCE_LABELS[lead.source] ?? lead.source}
        </Badge>
        {lead.staff && (
          <span className="ml-auto text-[10px] text-gray-400">
            {staffShortName(lead.staff.name)}
          </span>
        )}
      </div>
    </button>
  );
}
