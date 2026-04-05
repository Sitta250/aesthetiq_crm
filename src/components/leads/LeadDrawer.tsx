"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatBangkokDateTime } from "@/lib/dates";
import { formatApiError } from "@/lib/api-errors";
import { mergeLeadIntoLeadsListCaches } from "@/lib/leads-cache";
import {
  fetchLeadDetail,
  fetchTemplatesByLanguage,
  normalizeLeadForDrawer,
} from "@/lib/lead-queries";
import { Check, Copy, Pencil, X } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LeadWithBoardRelations, NoteWithStaff, Staff, Template } from "@/types";

// ── Constants ────────────────────────────────────────────────────────────────

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

const LEAD_SOURCES = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "line", label: "LINE" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
  { value: "other", label: "Other" },
] as const;

const LANGUAGES = ["EN", "TH", "ZH", "JA", "RU", "KO", "AR", "OTHER"] as const;

const SOURCE_LABELS: Record<string, string> = Object.fromEntries(
  LEAD_SOURCES.map((s) => [s.value, s.label])
);

// ── Edit form type ────────────────────────────────────────────────────────────

type EditForm = {
  name: string;
  treatmentInterest: string;
  source: string;
  language: string;
  nationality: string;
  phone: string;
  email: string;
  isForeign: boolean;
  isHot: boolean;
  staffId: string; // '' or '_none' = unassigned
};

function buildEditForm(lead: LeadWithBoardRelations): EditForm {
  return {
    name: lead.name,
    treatmentInterest: lead.treatmentInterest,
    source: lead.source,
    language: lead.language,
    nationality: lead.nationality ?? "",
    phone: lead.phone ?? "",
    email: lead.email ?? "",
    isForeign: lead.isForeign,
    isHot: lead.isHot,
    staffId: lead.staffId ?? "_none",
  };
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  leadId: string | null;
  open: boolean;
  onClose: () => void;
  previewLead?: LeadWithBoardRelations | null;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function LeadDrawer({ leadId, open, onClose, previewLead }: Props) {
  const queryClient = useQueryClient();

  // ── Notes state
  const [noteContent, setNoteContent] = useState("");

  // ── Stage / lost state
  const [pendingLost, setPendingLost] = useState(false);
  const [lostReason, setLostReason] = useState("");

  // ── Template state
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [copied, setCopied] = useState(false);

  // ── Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditForm | null>(null);

  // ── Seed from board list for instant drawer shell
  const initialLead = useMemo(() => {
    if (!leadId || !previewLead || previewLead.id !== leadId) return undefined;
    return normalizeLeadForDrawer(previewLead);
  }, [leadId, previewLead]);

  const { data: lead, isPending } = useQuery<LeadWithBoardRelations>({
    queryKey: ["lead", leadId],
    queryFn: () => fetchLeadDetail(leadId!),
    enabled: open && !!leadId,
    initialData: initialLead,
    staleTime: 60_000,
    refetchOnMount: "always",
  });

  const templateLanguage = lead?.language ?? initialLead?.language;

  const { data: templates = [] } = useQuery<Template[]>({
    queryKey: ["templates", templateLanguage],
    queryFn: () => fetchTemplatesByLanguage(templateLanguage!),
    enabled: open && !!templateLanguage,
    staleTime: 5 * 60_000,
  });

  // Staff list — needed for owner dropdown in edit mode
  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: ["staff"],
    queryFn: async () => {
      const res = await fetch("/api/staff");
      if (!res.ok) throw new Error("Failed to fetch staff");
      return res.json();
    },
    enabled: open,
  });

  // ── PATCH mutation (stage changes + profile edits)
  const patchMutation = useMutation({
    mutationFn: async (data: object): Promise<LeadWithBoardRelations> => {
      if (!leadId) throw new Error("No lead selected");
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(formatApiError(body, "Failed to update lead"));
      }
      return res.json();
    },
    onSuccess: (updatedLead) => {
      if (leadId) {
        queryClient.setQueryData<LeadWithBoardRelations>(
          ["lead", leadId],
          updatedLead
        );
      }
      // Update Kanban caches in place — avoids a slow full GET /api/leads refetch after save.
      mergeLeadIntoLeadsListCaches(queryClient, updatedLead);
      setPendingLost(false);
      setLostReason("");
    },
  });

  // ── Note mutation
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

  // ── Edit mode handlers
  const handleEnterEdit = () => {
    if (!lead) return;
    setEditForm(buildEditForm(lead));
    setIsEditing(true);
  };

  const handleSaveChanges = () => {
    if (!editForm) return;
    const payload = {
      name: editForm.name,
      treatmentInterest: editForm.treatmentInterest,
      source: editForm.source,
      language: editForm.language,
      nationality: editForm.nationality.trim() || undefined,
      phone: editForm.phone.trim() || undefined,
      email: editForm.email.trim() || undefined,
      isForeign: editForm.isForeign,
      isHot: editForm.isHot,
      staffId:
        editForm.staffId && editForm.staffId !== "_none"
          ? editForm.staffId
          : null,
    };
    patchMutation.mutate(payload, {
      onSuccess: () => {
        setIsEditing(false);
        setEditForm(null);
      },
    });
  };

  // ── Stage handlers (immediate PATCH, unaffected by edit mode)
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

  // ── Template copy
  const handleCopy = async () => {
    const template = templates.find((t) => t.id === selectedTemplateId);
    if (!template) return;
    await navigator.clipboard.writeText(template.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Drawer close — reset all local state
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setPendingLost(false);
      setLostReason("");
      setNoteContent("");
      setSelectedTemplateId("");
      setIsEditing(false);
      setEditForm(null);
      onClose();
    }
  };

  // ── Helpers
  const ef = editForm; // shorthand

  return (
    <>
      <Drawer open={open} onOpenChange={handleOpenChange} direction="right">
        <DrawerContent className="sm:max-w-[480px] flex flex-col bg-white border-gray-200">
          {/* ── Header ─────────────────────────────────────── */}
          <DrawerHeader className="border-b border-gray-200 pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <DrawerTitle className="truncate text-gray-900">
                  {isPending && !lead ? "Loading…" : (lead?.name ?? "—")}
                </DrawerTitle>
                {lead && !isEditing && (
                  <p className="mt-0.5 text-xs text-gray-500">
                    {SOURCE_LABELS[lead.source] ?? lead.source}
                    {lead.nationality ? ` · ${lead.nationality}` : ""}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-1">
                {lead && !isEditing && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleEnterEdit}
                    className="text-gray-500 hover:text-gray-900"
                    title="Edit lead"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                )}
                {isEditing && (
                  <Button
                    size="sm"
                    onClick={handleSaveChanges}
                    disabled={!ef?.name.trim() || !ef?.treatmentInterest.trim() || patchMutation.isPending}
                    className="h-7 text-xs"
                  >
                    {patchMutation.isPending ? "Saving…" : "Save changes"}
                  </Button>
                )}
                <DrawerClose asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-gray-500 hover:text-gray-900"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </DrawerClose>
              </div>
            </div>
          </DrawerHeader>

          {/* ── Scrollable body ─────────────────────────────── */}
          {lead && (
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

              {/* ── Profile (read-only) ──────────────────────── */}
              {!isEditing && (
                <section>
                  <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Profile
                  </h3>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <dt className="text-gray-400">Treatment</dt>
                    <dd className="text-gray-800">{lead.treatmentInterest}</dd>

                    <dt className="text-gray-400">Language</dt>
                    <dd className="text-gray-800">{lead.language}</dd>

                    {lead.phone && (
                      <>
                        <dt className="text-gray-400">Phone</dt>
                        <dd className="text-gray-800">{lead.phone}</dd>
                      </>
                    )}
                    {lead.email && (
                      <>
                        <dt className="text-gray-400">Email</dt>
                        <dd className="truncate text-gray-800">{lead.email}</dd>
                      </>
                    )}
                    {lead.staff && (
                      <>
                        <dt className="text-gray-400">Owner</dt>
                        <dd className="text-gray-800">{lead.staff.name}</dd>
                      </>
                    )}
                  </dl>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {lead.isForeign && (
                      <Badge variant="outline" className="border-blue-300 text-blue-600 text-[10px] px-1.5 py-0">
                        Foreign
                      </Badge>
                    )}
                    {lead.isHot && (
                      <Badge variant="outline" className="border-amber-300 text-amber-600 text-[10px] px-1.5 py-0">
                        Hot
                      </Badge>
                    )}
                    {lead.lostReason && lead.stage === "lost" && (
                      <p className="mt-1 w-full text-xs text-gray-500">
                        Reason: {lead.lostReason}
                      </p>
                    )}
                  </div>
                </section>
              )}

              {/* ── Profile (edit mode) ──────────────────────── */}
              {isEditing && ef && (
                <section className="space-y-3">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Edit Profile
                  </h3>

                  {/* Name */}
                  <div className="grid gap-1">
                    <Label className="text-xs text-gray-500">Name</Label>
                    <Input
                      value={ef.name}
                      onChange={(e) => setEditForm((f) => f && { ...f, name: e.target.value })}
                      className="h-8 border-gray-300 bg-gray-100 text-sm text-gray-900 placeholder:text-gray-400"
                    />
                  </div>

                  {/* Treatment interest */}
                  <div className="grid gap-1">
                    <Label className="text-xs text-gray-500">Treatment interest</Label>
                    <Input
                      value={ef.treatmentInterest}
                      onChange={(e) => setEditForm((f) => f && { ...f, treatmentInterest: e.target.value })}
                      className="h-8 border-gray-300 bg-gray-100 text-sm text-gray-900 placeholder:text-gray-400"
                    />
                  </div>

                  {/* Source + Language */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1">
                      <Label className="text-xs text-gray-500">Source</Label>
                      <Select
                        value={ef.source}
                        onValueChange={(v) => v && setEditForm((f) => f && { ...f, source: v })}
                      >
                        <SelectTrigger className="h-8 border-gray-300 bg-gray-100 text-xs text-gray-800">
                          <SelectValue>
                            {LEAD_SOURCES.find((s) => s.value === ef.source)?.label ?? ef.source}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {LEAD_SOURCES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-xs text-gray-500">Language</Label>
                      <Select
                        value={ef.language}
                        onValueChange={(v) => v && setEditForm((f) => f && { ...f, language: v })}
                      >
                        <SelectTrigger className="h-8 border-gray-300 bg-gray-100 text-xs text-gray-800">
                          <SelectValue>{ef.language}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGES.map((l) => (
                            <SelectItem key={l} value={l}>{l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Nationality + Phone */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1">
                      <Label className="text-xs text-gray-500">Nationality</Label>
                      <Input
                        value={ef.nationality}
                        onChange={(e) => setEditForm((f) => f && { ...f, nationality: e.target.value })}
                        className="h-8 border-gray-300 bg-gray-100 text-sm text-gray-900 placeholder:text-gray-400"
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-xs text-gray-500">Phone</Label>
                      <Input
                        value={ef.phone}
                        onChange={(e) => setEditForm((f) => f && { ...f, phone: e.target.value })}
                        className="h-8 border-gray-300 bg-gray-100 text-sm text-gray-900 placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="grid gap-1">
                    <Label className="text-xs text-gray-500">Email</Label>
                    <Input
                      type="email"
                      value={ef.email}
                      onChange={(e) => setEditForm((f) => f && { ...f, email: e.target.value })}
                      className="h-8 border-gray-300 bg-gray-100 text-sm text-gray-900 placeholder:text-gray-400"
                    />
                  </div>

                  {/* Owner */}
                  <div className="grid gap-1">
                    <Label className="text-xs text-gray-500">Owner</Label>
                    <Select
                      value={ef.staffId || "_none"}
                      onValueChange={(v) =>
                        setEditForm((f) => f && { ...f, staffId: !v || v === "_none" ? "_none" : v })
                      }
                    >
                      <SelectTrigger className="h-8 border-gray-300 bg-gray-100 text-xs text-gray-800">
                        <SelectValue>
                          {ef.staffId && ef.staffId !== "_none"
                            ? (staff.find((s) => s.id === ef.staffId)?.name ?? "Unassigned")
                            : "Unassigned"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">Unassigned</SelectItem>
                        {staff.map((s: Staff) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Flags */}
                  <div className="flex items-center gap-5">
                    <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-700">
                      <input
                        type="checkbox"
                        checked={ef.isForeign}
                        onChange={(e) => setEditForm((f) => f && { ...f, isForeign: e.target.checked })}
                        className="h-3.5 w-3.5 rounded border-gray-400 accent-gray-600"
                      />
                      Foreign patient
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-700">
                      <input
                        type="checkbox"
                        checked={ef.isHot}
                        onChange={(e) => setEditForm((f) => f && { ...f, isHot: e.target.checked })}
                        className="h-3.5 w-3.5 rounded border-gray-400 accent-amber-500"
                      />
                      Hot lead
                    </label>
                  </div>

                  {patchMutation.isError && (
                    <p className="text-xs text-red-400">{patchMutation.error?.message}</p>
                  )}
                </section>
              )}

              <Separator className="bg-gray-100" />

              {/* ── Stage ──────────────────────────────────────── */}
              <section>
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Stage
                </h3>
                <Select value={lead.stage} onValueChange={handleStageChange}>
                  <SelectTrigger className="h-9 w-full border-gray-300 bg-gray-100 text-sm text-gray-800">
                    <SelectValue>
                      {STAGE_OPTIONS.find((s) => s.value === lead.stage)?.label ?? lead.stage}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {STAGE_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {pendingLost && (
                  <div className="mt-2 space-y-2">
                    <Textarea
                      value={lostReason}
                      onChange={(e) => setLostReason(e.target.value)}
                      placeholder="Reason for losing this lead…"
                      className="min-h-[72px] border-gray-300 bg-gray-100 text-sm text-gray-800 placeholder:text-gray-400"
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
                        className="h-7 text-xs text-gray-500"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {!isEditing && patchMutation.isError && (
                  <p className="mt-1 text-xs text-red-400">{patchMutation.error?.message}</p>
                )}
              </section>

              <Separator className="bg-gray-100" />

              {/* ── Notes ──────────────────────────────────────── */}
              <section>
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Notes
                </h3>
                <div className="space-y-3">
                  {(lead.notes as NoteWithStaff[]).length === 0 && (
                    <p className="text-xs text-gray-400">No notes yet.</p>
                  )}
                  {(lead.notes as NoteWithStaff[]).map((note) => (
                    <div key={note.id} className="rounded-md border border-gray-200 bg-gray-100/50 p-2.5">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[10px] font-medium text-gray-500">
                          {note.staff?.name ?? "Unknown"}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {formatBangkokDateTime(note.createdAt)}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-xs text-gray-700">{note.content}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 space-y-2">
                  <Textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Add a note or conversation log…"
                    className="min-h-[72px] border-gray-300 bg-gray-100 text-sm text-gray-800 placeholder:text-gray-400"
                  />
                  <Button
                    size="sm"
                    onClick={() => { if (noteContent.trim()) noteMutation.mutate(noteContent.trim()); }}
                    disabled={!noteContent.trim() || noteMutation.isPending}
                    className="h-7 text-xs"
                  >
                    {noteMutation.isPending ? "Saving…" : "Add note"}
                  </Button>
                </div>
              </section>

              <Separator className="bg-gray-100" />

              {/* ── Templates ──────────────────────────────────── */}
              <section className="pb-2">
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Templates ({lead.language})
                </h3>
                {templates.length === 0 ? (
                  <p className="text-xs text-gray-400">No templates for {lead.language}.</p>
                ) : (
                  <div className="space-y-2">
                    <Select
                      value={selectedTemplateId}
                      onValueChange={(v) => setSelectedTemplateId(v ?? "")}
                    >
                      <SelectTrigger className="h-9 w-full border-gray-300 bg-gray-100 text-sm text-gray-800">
                        <SelectValue placeholder="Select a template…">
                          {selectedTemplateId
                            ? templates.find((t) => t.id === selectedTemplateId)?.name
                            : undefined}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {selectedTemplateId && (
                      <>
                        <div className="rounded-md border border-gray-300 bg-gray-100 p-2.5">
                          <p className="whitespace-pre-wrap text-xs text-gray-700">
                            {templates.find((t) => t.id === selectedTemplateId)?.body}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCopy}
                          className="h-7 gap-1.5 border-gray-300 text-xs text-gray-700 hover:text-gray-900"
                        >
                          {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
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

    </>
  );
}
