import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS classes safely, resolving any conflicts.
 * Example: cn('px-2 py-1 bg-red-500', isHovered && 'bg-red-600')
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}