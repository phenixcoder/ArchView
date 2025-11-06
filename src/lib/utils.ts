import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get health status color for badges
 */
export function getHealthColor(status?: string): string {
  switch (status) {
    case 'healthy':
      return 'bg-green-500';
    case 'degraded':
      return 'bg-yellow-500';
    case 'down':
      return 'bg-red-500';
    case 'unknown':
    default:
      return 'bg-gray-400';
  }
}

/**
 * Deduplicate array of objects by a key function
 */
export function deduplicateBy<T>(arr: T[], keyFn: (item: T) => string): T[] {
  const seen = new Map<string, T>();
  for (const item of arr) {
    const key = keyFn(item);
    if (!seen.has(key)) {
      seen.set(key, item);
    }
  }
  return Array.from(seen.values());
}
