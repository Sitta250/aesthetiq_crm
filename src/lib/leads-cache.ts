import type { QueryClient } from "@tanstack/react-query";
import type { LeadWithBoardRelations } from "@/types";
import { normalizeLeadForDrawer } from "@/lib/lead-queries";

/**
 * Patch every cached `["leads", …]` list in place so the Kanban updates without
 * refetching GET /api/leads (avoids slow saves after PATCH).
 */
export function mergeLeadIntoLeadsListCaches(
  queryClient: QueryClient,
  updated: LeadWithBoardRelations
): void {
  const normalized = normalizeLeadForDrawer(updated);
  queryClient.setQueriesData(
    {
      predicate: (q) =>
        Array.isArray(q.queryKey) && q.queryKey[0] === "leads",
    },
    (old: LeadWithBoardRelations[] | undefined) => {
      if (!old) return old;
      const i = old.findIndex((l) => l.id === normalized.id);
      if (i === -1) return old;
      const next = [...old];
      next[i] = normalized;
      return next;
    }
  );
}
