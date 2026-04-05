"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Staff } from "@/types";

const LEAD_SOURCES = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "line", label: "LINE" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
  { value: "other", label: "Other" },
] as const;

const LANGUAGES = [
  "EN", "TH", "ZH", "JA", "RU", "KO", "AR", "OTHER",
] as const;

const CreateLeadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  treatmentInterest: z.string().min(1, "Treatment interest is required"),
  source: z.enum(["instagram", "facebook", "line", "whatsapp", "website", "referral", "other"], {
    error: "Source is required",
  }),
  language: z.enum(["EN", "TH", "ZH", "JA", "RU", "KO", "AR", "OTHER"]),
  nationality: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional(),
  isForeign: z.boolean(),
  isHot: z.boolean(),
  staffId: z.string().min(1).optional(),
});

type FormState = {
  name: string;
  treatmentInterest: string;
  source: string;
  language: string;
  nationality: string;
  phone: string;
  email: string;
  isForeign: boolean;
  isHot: boolean;
  staffId: string;
};

const INITIAL_FORM: FormState = {
  name: "",
  treatmentInterest: "",
  source: "",
  language: "EN",
  nationality: "",
  phone: "",
  email: "",
  isForeign: false,
  isHot: false,
  staffId: "",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateLeadDialog({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: ["staff"],
    queryFn: async () => {
      const res = await fetch("/api/staff");
      if (!res.ok) throw new Error("Failed to fetch staff");
      return res.json();
    },
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: async (data: object) => {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? "Failed to create lead");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setForm(INITIAL_FORM);
      setErrors({});
      onOpenChange(false);
    },
  });

  const field = (key: keyof FormState) => ({
    value: form[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = CreateLeadSchema.safeParse({
      ...form,
      source: form.source || undefined,
      nationality: form.nationality.trim() || undefined,
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      staffId: form.staffId || undefined,
    });

    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setErrors(
        Object.fromEntries(
          Object.entries(flat).map(([k, v]) => [k, (v as string[])[0] ?? ""])
        )
      );
      return;
    }

    mutation.mutate(parsed.data);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setForm(INITIAL_FORM);
      setErrors({});
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>New Lead</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          {/* Name */}
          <div className="grid gap-1.5">
            <Label htmlFor="name">
              Name <span className="text-red-400">*</span>
            </Label>
            <Input id="name" {...field("name")} placeholder="Patient name" />
            {errors.name && (
              <p className="text-xs text-red-400">{errors.name}</p>
            )}
          </div>

          {/* Treatment interest */}
          <div className="grid gap-1.5">
            <Label htmlFor="treatmentInterest">
              Treatment interest <span className="text-red-400">*</span>
            </Label>
            <Input
              id="treatmentInterest"
              {...field("treatmentInterest")}
              placeholder="e.g. Facial rejuvenation, Botox"
            />
            {errors.treatmentInterest && (
              <p className="text-xs text-red-400">{errors.treatmentInterest}</p>
            )}
          </div>

          {/* Source + Language */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>
                Source <span className="text-red-400">*</span>
              </Label>
              <Select
                value={form.source}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, source: v ?? "" }))
                }
              >
                <SelectTrigger className="h-9 w-full border-input">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_SOURCES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.source && (
                <p className="text-xs text-red-400">{errors.source}</p>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label>Language</Label>
              <Select
                value={form.language}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, language: v ?? f.language }))
                }
              >
                <SelectTrigger className="h-9 w-full border-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Nationality + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="nationality">Nationality</Label>
              <Input
                id="nationality"
                {...field("nationality")}
                placeholder="e.g. Japanese"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...field("phone")} placeholder="+66 XX XXXX" />
            </div>
          </div>

          {/* Email */}
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...field("email")}
              placeholder="patient@example.com"
            />
            {errors.email && (
              <p className="text-xs text-red-400">{errors.email}</p>
            )}
          </div>

          {/* Owner */}
          <div className="grid gap-1.5">
            <Label>Owner</Label>
            <Select
              value={form.staffId || "_none"}
              onValueChange={(v) =>
                setForm((f) => ({
                  ...f,
                  staffId: !v || v === "_none" ? "" : v,
                }))
              }
            >
              <SelectTrigger className="h-9 w-full border-input">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Unassigned</SelectItem>
                {staff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Flags */}
          <div className="flex items-center gap-6">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={form.isForeign}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isForeign: e.target.checked }))
                }
                className="h-4 w-4 rounded border-zinc-600 accent-zinc-400"
              />
              Foreign patient
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={form.isHot}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isHot: e.target.checked }))
                }
                className="h-4 w-4 rounded border-zinc-600 accent-amber-400"
              />
              Hot lead
            </label>
          </div>

          {mutation.isError && (
            <p className="text-sm text-red-400">{mutation.error?.message}</p>
          )}

          <DialogFooter showCloseButton>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating…" : "Create lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
