import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number, decimals: number = 0): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPercentage(num: number, decimals: number = 1): string {
  return `${num.toFixed(decimals)}%`;
}

export function getTimeUntilRefresh(ttl: number): string {
  if (ttl <= 0) return 'Available now';

  const minutes = Math.floor(ttl / 60);
  const seconds = ttl % 60;

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

export function calculatePercentile(rank: number, total: number): number {
  if (total <= 1) return 100;
  return parseFloat((((total - rank) / (total - 1)) * 100).toFixed(1));
}

export function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;

  if (j === 1 && k !== 11) return `${num}st`;
  if (j === 2 && k !== 12) return `${num}nd`;
  if (j === 3 && k !== 13) return `${num}rd`;
  return `${num}th`;
}

// Validate and sanitize UID input
export function sanitizeUID(input: string): string {
  return input.trim().replace(/\D/g, '').slice(0, 10);
}

// Get client IP from headers (for rate limiting)
export function getClientIP(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0] ||
    headers.get('x-real-ip') ||
    'unknown'
  );
}
