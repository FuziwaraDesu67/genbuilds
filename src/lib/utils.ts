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

/**
 * Resolve Genshin Impact server region from Enka's region field or UID prefix.
 * Handles both 9-digit (6/7/8/9) and 10-digit (16/17/18/19) UID formats.
 */
export function getServerRegion(uid: string, explicitRegion?: string | null): string {
  if (explicitRegion && explicitRegion.trim().length > 0) {
    return explicitRegion.trim().toUpperCase();
  }
  const clean = (uid || '').trim();
  if (!clean) return 'GLB';

  if (clean.length === 10) {
    const two = clean.slice(0, 2);
    if (two === '18') return 'ASIA';
    if (two === '16') return 'NA';
    if (two === '17') return 'EU';
    if (two === '19') return 'TW/HK';
  }

  switch (clean[0]) {
    case '8':
      return 'ASIA';
    case '6':
      return 'NA';
    case '7':
      return 'EU';
    case '9':
      return 'TW/HK';
    case '1':
    case '2':
    case '3':
    case '5':
      return 'CN';
    default:
      return 'GLB';
  }
}

/**
 * Format an ISO timestamp / Date / epoch ms into a human-readable relative string.
 */
export function formatRelativeTime(
  timestamp: Date | string | number | undefined | null,
  nowMs: number = Date.now()
): string {
  if (!timestamp) return 'just now';
  const ms =
    timestamp instanceof Date
      ? timestamp.getTime()
      : typeof timestamp === 'number'
      ? timestamp
      : Date.parse(timestamp);
  if (!Number.isFinite(ms)) return 'just now';

  const diffSec = Math.max(0, Math.floor((nowMs - ms) / 1000));
  if (diffSec < 45) return 'just now';

  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

/**
 * Format Akasha top-percent ranking accurately across 0.0001% to 100%.
 */
export function formatTopPercent(topPercent: number): string {
  if (!Number.isFinite(topPercent) || topPercent <= 0) return '<0.01%';
  if (topPercent < 0.01) return '<0.01%';
  if (topPercent < 0.1) return `${topPercent.toFixed(2)}%`;
  if (topPercent < 10) return `${topPercent.toFixed(1).replace(/\.0$/, '')}%`;
  return `${Math.round(topPercent)}%`;
}

/**
 * Format leaderboard rank/population counts compactly (e.g. 6967, 25.9k, 172k, 1.28m).
 */
export function formatCompactCount(num: number): string {
  if (!Number.isFinite(num) || num < 0) return '0';
  if (num < 10_000) return String(Math.round(num));
  if (num < 100_000) return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  if (num < 1_000_000) return `${Math.round(num / 1000)}k`;
  return `${(num / 1_000_000).toFixed(2).replace(/\.?0+$/, '')}m`;
}

/**
 * Compute authentic Akasha CV (artifact substats CV + circlet CR/CD main stat).
 */
export function getEffectiveAkashaCv(character?: {
  akashaCv?: number;
  totalCv?: number;
  artifacts?: Array<{
    slot: string;
    cv?: number;
    mainStat?: { key?: string; value?: number };
  }>;
}): number {
  if (!character) return 0;
  if (character.akashaCv !== undefined) return character.akashaCv;
  const artifacts = character.artifacts || [];
  const substatsCv = artifacts.reduce((sum, a) => sum + (a.cv || 0), 0);
  const circlet = artifacts.find((a) => a.slot === 'circlet');
  let circletMainCv = 0;
  if (circlet?.mainStat) {
    const key = circlet.mainStat.key?.toLowerCase() || '';
    if (key === 'cr' || key.includes('critical') || key === 'critrate') {
      circletMainCv = (circlet.mainStat.value || 0) * 2;
    } else if (key === 'cd' || key.includes('hurt') || key === 'critdmg') {
      circletMainCv = circlet.mainStat.value || 0;
    }
  }
  if (artifacts.length === 0 && character.totalCv !== undefined) {
    return character.totalCv;
  }
  return parseFloat((substatsCv + circletMainCv).toFixed(1));
}
