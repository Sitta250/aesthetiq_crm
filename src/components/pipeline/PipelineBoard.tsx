"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { LeadStage, LeadWithBoardRelations } from "@/types";
import BoardToolbar from "./BoardToolbar";
import PipelineColumn from "./PipelineColumn";
import CreateLeadDialog from "@/components/leads/CreateLeadDialog";
import LeadDrawer from "@/components/leads/LeadDrawer";

const STAGE_CONFIG: { stage: LeadStage; label: string }[] = [
  { stage: "new_lead", label: "New Lead" },
  { stage: "contacted", label: "Contacted" },
  { stage: "qualified", label: "Qualified" },
  { stage: "consultation_booked", label: "Consultation" },
  { stage: "deposit_pending", label: "Deposit Pending" },
  { stage: "deposit_paid", label: "Deposit Paid" },
  { stage: "treatment_booked", label: "Booked" },
  { stage: "lost", label: "Lost" },
];

type LeadFilters = {
  q: string;
  foreign: string;
  hot: string;
  staffId: string;
  source: string;
};

async function fetchLeads(filters: LeadFilters): Promise<LeadWithBoardRelations[]> {
  const params = new URLSearchParams();
  if (filters.q) params.set("search", filters.q);
  if (filters.foreign) params.set("isForeign", filters.foreign);
  if (filters.hot) params.set("isHot", filters.hot);
  if (filters.staffId) params.set("staffId", filters.staffId);
  if (filters.source) params.set("source", filters.source);
  const res = await fetch(`/api/leads?${params}`);
  if (!res.ok) throw new Error("Failed to fetch leads");
  return res.json();
}

export default function PipelineBoard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Search debounce
  const [searchInput, setSearchInput] = useState(
    () => searchParams.get("q") ?? ""
  );
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filters: LeadFilters = {
    q: searchParams.get("q") ?? "",
    foreign: searchParams.get("foreign") ?? "",
    hot: searchParams.get("hot") ?? "",
    staffId: searchParams.get("staffId") ?? "",
    source: searchParams.get("source") ?? "",
  };

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      searchTimerRef.current = setTimeout(() => {
        updateParam("q", value);
      }, 300);
    },
    [updateParam]
  );

  const { data: leads = [], isPending, isFetching, isError } = useQuery({
    queryKey: ["leads", filters],
    queryFn: () => fetchLeads(filters),
    placeholderData: keepPreviousData,
  });

  const grouped = useMemo(() => {
    const map = Object.fromEntries(
      STAGE_CONFIG.map(({ stage }) => [stage, [] as LeadWithBoardRelations[]])
    ) as Record<LeadStage, LeadWithBoardRelations[]>;
    for (const lead of leads) {
      map[lead.stage]?.push(lead);
    }
    return map;
  }, [leads]);

  // True initial load — no data in cache yet, nothing to show
  if (isPending) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-zinc-500">Loading pipeline…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-red-400">Failed to load leads.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <BoardToolbar
        isFetching={isFetching}
        search={searchInput}
        onSearchChange={handleSearchChange}
        foreign={filters.foreign}
        onForeignChange={(v) => updateParam("foreign", v)}
        hot={filters.hot === "true"}
        onHotChange={(v) => updateParam("hot", v ? "true" : "")}
        staffId={filters.staffId}
        onStaffIdChange={(v) => updateParam("staffId", v)}
        source={filters.source}
        onSourceChange={(v) => updateParam("source", v)}
        onNewLead={() => setCreateOpen(true)}
      />

      {/* Board columns */}
      <div className="flex flex-1 gap-3 overflow-x-auto p-4">
        {STAGE_CONFIG.map(({ stage, label }) => (
          <PipelineColumn
            key={stage}
            stage={stage}
            label={label}
            leads={grouped[stage]}
            onSelectLead={setSelectedLeadId}
          />
        ))}
      </div>

      {/* Create lead dialog */}
      <CreateLeadDialog open={createOpen} onOpenChange={setCreateOpen} />

      {/* Lead detail drawer */}
      <LeadDrawer
        leadId={selectedLeadId}
        open={!!selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
      />
    </div>
  );
}
