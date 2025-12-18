import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Remove verification phone from performer description
 * The phone is stored in format: [Телефон для верификации: +71234567890]
 */
export function cleanVerificationPhone(description: string | null | undefined): string {
  if (!description) return '';
  // Remove the verification phone block and any extra newlines before it
  return description
    .replace(/\n*\[Телефон для верификации:\s*[^\]]+\]/gi, '')
    .trim();
}
