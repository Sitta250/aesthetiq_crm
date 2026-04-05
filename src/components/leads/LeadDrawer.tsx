"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatBangkokDateTime } from "@/lib/dates";
import { Copy, Check } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LeadWithBoardRelations, NoteWithStaff, Template } from "@/types";

const STAGE_OPTIONS = [
  { value: "new_lead", label: "New Lead" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "consultation_booked", label: "Consultation Booked" },
  { value: "deposit_pending", label: "Deposit Pending" },
  { value: "deposit_paid", label: "Deposit Paid" },
  { value: "treatment_booked", label: "Treatment Booked" },
  { value: "lost", label: "Lost" },
] as const;

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
  leadId: string | null;
  open: boolean;
  onClose: () => void;
}

export default function LeadDrawer({ leadId, open, onClose }: Props) {
  const queryClient = useQueryClient();
  const [noteContent, setNoteContent] = useState("");
  const [pendingLost, setPendingLost] = useState(false);
  const [lostReason, setLostReason] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [copied, setCopied] = useState(false);

  // Fetch full lead detail on open
  const { data: lead, isLoading } = useQuery<LeadWithBoardRelations>({
    queryKey: ["lead", leadId],
    queryFn: async () => {
      const res = await fetch(`/api/leads/${leadId}`);
      if (!res.ok) throw new Error("Failed to fetch lead");
      return res.json();
    },
    enabled: open && !!leadId,
  });

  // Fetch templates filtered by lead language
  const { data: templates = [] } = useQuery<Template[]>({
    queryKey: ["templates", lead?.language],
    queryFn: async () => {
      const res = await fetch(`/api/templates?language=${lead!.language}`);
      if (!res.ok) throw new Error("Failed to fetch templates");
      return res.json();
    },
    enabled: !!lead?.language,
  });

  // PATCH lead (stage, lostReason, etc.)
  const patchMutation = useMutation({
    mutationFn: async (data: object) => {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Failed to update lead");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
      setPendingLost(false);
      setLostReason("");
    },
  });

  // POST note
  const noteMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, content }),
      });
      if (!res.ok) throw new Error("Failed to create note");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
      setNoteContent("");
    },
  });

  const handleStageChange = (newStage: string | null) => {
    if (newStage == null) return;
    if (newStage === "lost") {
      setPendingLost(true);
      setLostReason(lead?.lostReason ?? "");
    } else {
      setPendingLost(false);
      patchMutation.mutate({ stage: newStage });
    }
  };

  const handleConfirmLost = () => {
    if (!lostReason.trim()) return;
    patchMutation.mutate({ stage: "lost", lostReason: lostReason.trim() });
  };

  const handleCopy = async () => {
    const template = templates.find((t) => t.id === selectedTemplateId);
    if (!template) return;
    await navigator.clipboard.writeText(template.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setPendingLost(false);
      setLostReason("");
      setNoteContent("");
      setSelectedTemplateId("");
      onClose();
    }
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} direction="right">
      <DrawerContent className="sm:max-w-[480px] flex flex-col bg-zinc-900 border-zinc-800">
        {/* Header */}
        <DrawerHeader className="border-b border-zinc-800 pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <DrawerTitle className="truncate text-zinc-100">
                {isLoading ? "Loading…" : (lead?.name ?? "—")}
              </DrawerTitle>
              {lead && (
                <p className="mt-0.5 text-xs text-zinc-400">
                  {SOURCE_LABELS[lead.source] ?? lead.source}
                  {lead.nationality ? ` · ${lead.nationality}` : ""}
                </p>
              )}
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon-sm" className="shrink-0 text-zinc-400 hover:text-zinc-100" />
            </DrawerClose>
          </div>
        </DrawerHeader>

        {/* Scrollable body */}
        {lead && (
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
            {/* ── Profile ────────────────────────────────────── */}
            <section>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Profile
              </h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-zinc-500">Treatment</dt>
                <dd className="text-zinc-200">{lead.treatmentInterest}</dd>

                <dt className="text-zinc-500">Language</dt>
                <dd className="text-zinc-200">{lead.language}</dd>

                {lead.phone && (
                  <>
                    <dt className="text-zinc-500">Phone</dt>
                    <dd className="text-zinc-200">{lead.phone}</dd>
                  </>
                )}
                {lead.email && (
                  <>
                    <dt className="text-zinc-500">Email</dt>
                    <dd className="truncate text-zinc-200">{lead.email}</dd>
                  </>
                )}
                {lead.staff && (
                  <>
                    <dt className="text-zinc-500">Owner</dt>
                    <dd className="text-zinc-200">{lead.staff.name}</dd>
                  </>
                )}
              </dl>
              <div className="mt-2 flex gap-1.5">
                {lead.isForeign && (
                  <Badge variant="outline" className="border-blue-500/40 text-blue-400 text-[10px] px-1.5 py-0">
                    Foreign
                  </Badge>
                )}
                {lead.isHot && (
                  <Badge variant="outline" className="border-amber-500/40 text-amber-400 text-[10px] px-1.5 py-0">
                    Hot
                  </Badge>
                )}
                {lead.lostReason && lead.stage === "lost" && (
                  <p className="mt-1 text-xs text-zinc-400">
                    Reason: {lead.lostReason}
                  </p>
                )}
              </div>
            </section>

            <Separator className="bg-zinc-800" />

            {/* ── Stage ──────────────────────────────────────── */}
            <section>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Stage
              </h3>
              <Select value={lead.stage} onValueChange={handleStageChange}>
                <SelectTrigger className="h-9 w-full border-zinc-700 bg-zinc-800 text-sm text-zinc-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGE_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {pendingLost && (
                <div className="mt-2 space-y-2">
                  <Textarea
                    value={lostReason}
                    onChange={(e) => setLostReason(e.target.value)}
                    placeholder="Reason for losing this lead…"
                    className="min-h-[72px] border-zinc-700 bg-zinc-800 text-sm text-zinc-200 placeholder:text-zinc-500"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleConfirmLost}
                      disabled={!lostReason.trim() || patchMutation.isPending}
                      className="h-7 bg-red-600 hover:bg-red-700 text-xs"
                    >
                      Mark as lost
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPendingLost(false)}
                      className="h-7 text-xs text-zinc-400"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {patchMutation.isError && (
                <p className="mt-1 text-xs text-red-400">
                  {patchMutation.error?.message}
                </p>
              )}
            </section>

            <Separator className="bg-zinc-800" />

            {/* ── Notes ──────────────────────────────────────── */}
            <section>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Notes
              </h3>

              {/* Note list */}
              <div className="space-y-3">
                {(lead.notes as NoteWithStaff[]).length === 0 && (
                  <p className="text-xs text-zinc-500">No notes yet.</p>
                )}
                {(lead.notes as NoteWithStaff[]).map((note) => (
                  <div key={note.id} className="rounded-md border border-zinc-800 bg-zinc-800/50 p-2.5">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[10px] font-medium text-zinc-400">
                        {note.staff?.name ?? "Unknown"}
                      </span>
                      <span className="text-[10px] text-zinc-600">
                        {formatBangkokDateTime(note.createdAt)}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-xs text-zinc-300">{note.content}</p>
                  </div>
                ))}
              </div>

              {/* Add note */}
              <div className="mt-3 space-y-2">
                <Textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Add a note or conversation log…"
                  className="min-h-[72px] border-zinc-700 bg-zinc-800 text-sm text-zinc-200 placeholder:text-zinc-500"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    if (noteContent.trim()) noteMutation.mutate(noteContent.trim());
                  }}
                  disabled={!noteContent.trim() || noteMutation.isPending}
                  className="h-7 text-xs"
                >
                  {noteMutation.isPending ? "Saving…" : "Add note"}
                </Button>
              </div>
            </section>

            <Separator className="bg-zinc-800" />

            {/* ── Templates ──────────────────────────────────── */}
            <section className="pb-2">
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Templates ({lead.language})
              </h3>
              {templates.length === 0 ? (
                <p className="text-xs text-zinc-500">
                  No templates for {lead.language}.
                </p>
              ) : (
                <div className="space-y-2">
                  <Select
                    value={selectedTemplateId}
                    onValueChange={(v) => setSelectedTemplateId(v ?? "")}
                  >
                    <SelectTrigger className="h-9 w-full border-zinc-700 bg-zinc-800 text-sm text-zinc-200">
                      <SelectValue placeholder="Select a template…" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedTemplateId && (
                    <>
                      <div className="rounded-md border border-zinc-700 bg-zinc-800 p-2.5">
                        <p className="whitespace-pre-wrap text-xs text-zinc-300">
                          {templates.find((t) => t.id === selectedTemplateId)?.body}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCopy}
                        className="h-7 gap-1.5 border-zinc-700 text-xs text-zinc-300 hover:text-zinc-100"
                      >
                        {copied ? (
                          <Check className="h-3 w-3 text-green-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        {copied ? "Copied!" : "Copy to clipboard"}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
