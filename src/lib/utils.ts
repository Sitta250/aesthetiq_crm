import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format a staff name as "John D." or "Dr. John D." */
export function staffShortName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const hasTitle = parts[0].endsWith(".");
  if (hasTitle && parts.length >= 3) {
    return `${parts[0]} ${parts[1]} ${parts[2][0]}.`;
  }
  return `${parts[0]} ${parts[1][0]}.`;
}
