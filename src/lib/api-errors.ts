/**
 * Turn API JSON error payloads (including Zod flatten objects) into a short user-facing string.
 */
export function formatApiError(body: unknown, fallback = "Request failed"): string {
  if (!body || typeof body !== "object") return fallback;
  const err = (body as { error?: unknown }).error;
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const flat = err as {
      formErrors?: string[]
      fieldErrors?: Record<string, string[] | undefined>
    }
    const parts: string[] = []
    if (Array.isArray(flat.formErrors)) {
      for (const line of flat.formErrors) {
        if (line) parts.push(line)
      }
    }
    if (flat.fieldErrors && typeof flat.fieldErrors === "object") {
      for (const [key, msgs] of Object.entries(flat.fieldErrors)) {
        if (Array.isArray(msgs) && msgs.length) {
          parts.push(`${key}: ${msgs.join(", ")}`)
        }
      }
    }
    if (parts.length) return parts.join(" · ")
    try {
      return JSON.stringify(err)
    } catch {
      return fallback
    }
  }
  return fallback
}
