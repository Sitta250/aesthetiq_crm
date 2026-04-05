"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import {
  fetchLeadDetail,
  fetchTemplatesByLanguage,
} from "@/lib/lead-queries";
import { isUrgent } from "@/lib/urgency";
import { cn } from "@/lib/utils";
import type { LeadWithBoardRelations } from "@/types";

const SOURCE_LABELS: Record<string, string> = {
  instagram: "IG",
  facebook: "FB",
  line: "LINE",
  whatsapp: "WA",
  website: "Web",
  referral: "Ref",
  other: "Other",
};

interface Props {
  lead: LeadWithBoardRelations;
  onSelect: (lead: LeadWithBoardRelations) => void;
}

export default function LeadCard({ lead, onSelect }: Props) {
  const queryClient = useQueryClient();
  const urgent = isUrgent(lead.isHot, lead.tasks);

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
        "relative w-full text-left rounded-md border bg-zinc-800 px-3 py-2.5 transition-colors",
        urgent
          ? "border-red-500/40 hover:border-red-500/60"
          : "border-zinc-700 hover:border-zinc-600"
      )}
    >
      {/* Urgency dot */}
      {urgent && (
        <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 rounded-full bg-red-500" />
      )}

      {/* Name */}
      <p className="truncate pr-4 text-sm font-medium text-zinc-100">
        {lead.name}
      </p>

      {/* Treatment */}
      <p className="mt-0.5 truncate text-xs text-zinc-400">
        {lead.treatmentInterest}
      </p>

      {/* Meta row */}
      <div className="mt-1.5 flex items-center gap-1.5">
        {lead.nationality && (
          <span className="text-[10px] text-zinc-500">{lead.nationality}</span>
        )}
        <Badge
          variant="outline"
          className="border-zinc-700 px-1 py-0 text-[10px] text-zinc-500"
        >
          {SOURCE_LABELS[lead.source] ?? lead.source}
        </Badge>
        {lead.staff && (
          <span className="ml-auto font-mono text-[10px] font-medium text-zinc-500">
            {lead.staff.avatarInitials}
          </span>
        )}
      </div>
    </button>
  );
}
