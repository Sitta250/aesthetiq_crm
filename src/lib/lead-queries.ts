import type { LeadWithBoardRelations, Template } from "@/types";

export async function fetchLeadDetail(id: string): Promise<LeadWithBoardRelations> {
  const res = await fetch(`/api/leads/${id}`);
  if (!res.ok) throw new Error("Failed to fetch lead");
  return res.json();
}

export async function fetchTemplatesByLanguage(
  language: string
): Promise<Template[]> {
  const res = await fetch(
    `/api/templates?language=${encodeURIComponent(language)}`
  );
  if (!res.ok) throw new Error("Failed to fetch templates");
  return res.json();
}

/** List payload may omit notes; drawer always expects an array. */
export function normalizeLeadForDrawer(
  lead: LeadWithBoardRelations
): LeadWithBoardRelations {
  return {
    ...lead,
    notes: lead.notes ?? [],
  };
}
