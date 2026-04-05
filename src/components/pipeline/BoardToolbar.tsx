"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Staff } from "@/types";

const SOURCES = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "line", label: "LINE" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
  { value: "other", label: "Other" },
];

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  // '' = no filter, 'true' = foreign only, 'false' = local only
  foreign: string;
  onForeignChange: (v: string) => void;
  hot: boolean;
  onHotChange: (v: boolean) => void;
  staffId: string;
  onStaffIdChange: (v: string) => void;
  source: string;
  onSourceChange: (v: string) => void;
  onNewLead: () => void;
  isFetching?: boolean;
}

const FOREIGN_PILLS = [
  { value: "", label: "All" },
  { value: "true", label: "Foreign" },
  { value: "false", label: "Local" },
] as const;

export default function BoardToolbar({
  search,
  onSearchChange,
  foreign,
  onForeignChange,
  hot,
  onHotChange,
  staffId,
  onStaffIdChange,
  source,
  onSourceChange,
  onNewLead,
  isFetching = false,
}: Props) {
  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: ["staff"],
    queryFn: async () => {
      const res = await fetch("/api/staff");
      if (!res.ok) throw new Error("Failed to fetch staff");
      return res.json();
    },
  });

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 bg-zinc-950 px-4 py-2.5">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search leads…"
          className="h-8 w-44 border-zinc-700 bg-zinc-900 pl-8 text-sm placeholder:text-zinc-500 focus-visible:border-zinc-500"
        />
        {isFetching && (
          <Loader2 className="absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 animate-spin text-zinc-500" />
        )}
      </div>

      <div className="h-5 w-px bg-zinc-800" />

      {/* All / Foreign / Local pills */}
      {FOREIGN_PILLS.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onForeignChange(foreign === value ? "" : value)}
          className={cn(
            "h-8 rounded-md px-3 text-xs font-medium transition-colors",
            foreign === value
              ? "bg-zinc-700 text-zinc-100"
              : "text-zinc-400 hover:text-zinc-200"
          )}
        >
          {label}
        </button>
      ))}

      {/* Hot toggle */}
      <button
        onClick={() => onHotChange(!hot)}
        className={cn(
          "h-8 rounded-md px-3 text-xs font-medium transition-colors",
          hot
            ? "bg-amber-600/20 text-amber-400"
            : "text-zinc-400 hover:text-zinc-200"
        )}
      >
        Hot
      </button>

      <div className="h-5 w-px bg-zinc-800" />

      {/* Staff filter */}
      <Select
        value={staffId || "_all"}
        onValueChange={(v) =>
          onStaffIdChange(!v || v === "_all" ? "" : v)
        }
      >
        <SelectTrigger className="h-8 w-32 border-zinc-700 bg-zinc-900 text-xs text-zinc-300">
          <SelectValue placeholder="All staff" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">All staff</SelectItem>
          {staff.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Source filter */}
      <Select
        value={source || "_all"}
        onValueChange={(v) =>
          onSourceChange(!v || v === "_all" ? "" : v)
        }
      >
        <SelectTrigger className="h-8 w-32 border-zinc-700 bg-zinc-900 text-xs text-zinc-300">
          <SelectValue placeholder="All sources" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">All sources</SelectItem>
          {SOURCES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* New Lead — right side */}
      <div className="ml-auto">
        <Button onClick={onNewLead} size="sm" className="h-8 gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          New Lead
        </Button>
      </div>
    </div>
  );
}
