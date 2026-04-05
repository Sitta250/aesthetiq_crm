-- Speed up GET /api/leads filters by staffId and source (equality lookups).
CREATE INDEX IF NOT EXISTS "Lead_staffId_idx" ON "Lead"("staffId");

CREATE INDEX IF NOT EXISTS "Lead_source_idx" ON "Lead"("source");
