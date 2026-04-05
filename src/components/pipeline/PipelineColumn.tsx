import type { LeadStage, LeadWithBoardRelations } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import LeadCard from "@/components/leads/LeadCard";

interface Props {
  stage: LeadStage;
  label: string;
  leads: LeadWithBoardRelations[];
  onSelectLead: (id: string) => void;
}

export default function PipelineColumn({
  stage,
  label,
  leads,
  onSelectLead,
}: Props) {
  return (
    <div className="flex w-64 shrink-0 flex-col rounded-lg border border-zinc-800 bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2.5">
        <span
          className={cn(
            "text-sm font-medium",
            stage === "lost" ? "text-red-400" : "text-zinc-200"
          )}
        >
          {label}
        </span>
        <Badge
          variant="outline"
          className="border-zinc-700 px-1.5 py-0 text-[11px] text-zinc-400"
        >
          {leads.length}
        </Badge>
      </div>

      {/* Cards */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} onSelect={onSelectLead} />
        ))}
      </div>
    </div>
  );
}
