const TZ = "Asia/Bangkok";

/**
 * Format a UTC date/string as a short date in Asia/Bangkok time.
 * e.g. "Apr 5, 2026"
 */
export function formatBangkok(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

/**
 * Format a UTC date/string as a short datetime in Asia/Bangkok time.
 * e.g. "Apr 5, 2:30 PM"
 */
export function formatBangkokDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}
