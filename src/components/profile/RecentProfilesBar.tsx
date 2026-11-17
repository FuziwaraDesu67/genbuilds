'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/context';

export interface RecentProfileItem {
  uid: string;
  nickname: string;
  profilePicture?: string;
  timestamp: number;
}

const STORAGE_KEY = 'genbuilds_recent_profiles_tabs';

const DEFAULT_SEEDED_PROFILES: RecentProfileItem[] = [
  { uid: '1818407519', nickname: 'Sancho', timestamp: 1700000007 },
  { uid: '702914820', nickname: 'DianaLegend', timestamp: 1700000006 },
  { uid: '1813164100', nickname: 'Addy', timestamp: 1700000005 },
  { uid: '810294711', nickname: 'ZENNY', timestamp: 1700000004 },
  { uid: '719382049', nickname: 'Aether_Rathod', timestamp: 1700000003 },
  { uid: '859302914', nickname: 'Goofy', timestamp: 1700000002 },
  { uid: '855842984', nickname: 'AnirudhArcade', timestamp: 1700000001 },
];

function loadStoredProfiles(): RecentProfileItem[] {
  if (typeof window === 'undefined') return DEFAULT_SEEDED_PROFILES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SEEDED_PROFILES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SEEDED_PROFILES;
  } catch {
    return DEFAULT_SEEDED_PROFILES;
  }
}

function saveProfiles(items: RecentProfileItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

interface RecentProfilesBarProps {
  currentUid: string;
  currentNickname: string;
  currentAvatar?: string;
}

export default function RecentProfilesBar({
  currentUid,
  currentNickname,
  currentAvatar,
}: RecentProfilesBarProps) {
  const { isFavorited, toggleFavorite } = useAuth();
  const [profiles, setProfiles] = useState<RecentProfileItem[]>(DEFAULT_SEEDED_PROFILES);
  const [mounted, setMounted] = useState(false);

  // Sync current profile into recent profiles
  useEffect(() => {
    setMounted(true);
    const existing = loadStoredProfiles();
    const updated = [
      {
        uid: currentUid,
        nickname: currentNickname || 'Player',
        profilePicture: currentAvatar,
        timestamp: Date.now(),
      },
      ...existing.filter((p) => p.uid !== currentUid),
    ].slice(0, 15);

    setProfiles(updated);
    saveProfiles(updated);
  }, [currentUid, currentNickname, currentAvatar]);

  const handleRemove = useCallback(
    (e: React.MouseEvent, uidToRemove: string) => {
      e.stopPropagation();
      e.preventDefault();
      const next = profiles.filter((p) => p.uid !== uidToRemove);
      setProfiles(next);
      saveProfiles(next);

      // If removed current UID and other tabs exist, navigate to first remaining
      if (uidToRemove === currentUid && next.length > 0 && typeof window !== 'undefined') {
        window.location.href = `/u/${next[0].uid}`;
      }
    },
    [profiles, currentUid]
  );

  const handleToggleStar = useCallback(
    async (e: React.MouseEvent, item: RecentProfileItem) => {
      e.stopPropagation();
      e.preventDefault();
      await toggleFavorite(item.uid, item.nickname, item.profilePicture);
    },
    [toggleFavorite]
  );

  return (
    <div className="w-full bg-[#0a0e12] border border-[#1b252f] rounded-xl overflow-hidden select-none shadow-md mb-2">
      <div className="flex items-center overflow-x-auto no-scrollbar">
        {profiles.map((item) => {
          const isActive = item.uid === currentUid;
          const favorited = isFavorited(item.uid);

          return (
            <a
              key={item.uid}
              href={isActive ? undefined : `/u/${item.uid}`}
              onClick={(e) => {
                if (isActive) {
                  e.preventDefault();
                }
              }}
              className={cn(
                "group relative flex items-center gap-2 h-9 px-3.5 text-xs border-r border-[#1e2a35] cursor-pointer whitespace-nowrap transition-colors duration-150 shrink-0 decoration-transparent",
                isActive
                  ? "bg-[#18313a] text-white font-medium border-b-2 border-b-cyan-400"
                  : "bg-[#111920] text-[#8fa3b3] hover:bg-[#16212b] hover:text-[#f1f5f9]"
              )}
            >
              {/* Nickname */}
              <span className="font-sans tracking-tight text-[12.5px]">
                {item.nickname}
              </span>

              {/* Four-pointed Primogem / Star Icon (matches image ✦) */}
              <button
                type="button"
                onClick={(e) => handleToggleStar(e, item)}
                className="p-0.5 rounded hover:bg-white/10 transition-colors cursor-pointer"
                title={favorited ? "Favorited in Watchlist" : "Bookmark this player"}
              >
                <svg
                  className={cn(
                    "w-3.5 h-3.5 transition-colors",
                    favorited
                      ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.5)]"
                      : isActive
                      ? "text-cyan-400 fill-cyan-400"
                      : "text-cyan-600/70 fill-cyan-600/70 group-hover:text-cyan-400 group-hover:fill-cyan-400"
                  )}
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
                </svg>
              </button>

              {/* Close Button × */}
              <button
                type="button"
                onClick={(e) => handleRemove(e, item.uid)}
                className="p-0.5 rounded-full text-[#5d7182] hover:text-white hover:bg-white/10 transition-colors cursor-pointer opacity-70 group-hover:opacity-100"
                title={`Close ${item.nickname}`}
              >
                <svg
                  className="w-3 h-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </a>
          );
        })}
      </div>
    </div>
  );
}
