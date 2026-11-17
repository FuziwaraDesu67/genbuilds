'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  formatNumber,
  formatCompactCount,
  formatRelativeTime,
  formatTopPercent,
  getEffectiveAkashaCv,
  getServerRegion,
  getTimeUntilRefresh,
  cn,
} from '@/lib/utils';
import type { EnkaData, Character } from '@/lib/enka/types';
import { getNameCardUrl } from '@/lib/enka/namecard-data';
import { resolveWeaponName } from '@/lib/enka/weapon-data';
import AkashaShowcaseCard from '@/components/character/AkashaShowcaseCard';
import RecentProfilesBar from '@/components/profile/RecentProfilesBar';
import CountUp from '@/components/CountUp/CountUp';
import TiltedCard from '@/components/TiltedCard/TiltedCard';
import ShinyText from '@/components/ShinyText/ShinyText';
import { motion } from 'framer-motion';
import { useBackground } from '@/components/background/BackgroundContext';
import { useAuth } from '@/lib/auth/context';
import { ElementIcon } from '@/components/ui/element-icons';
import LoadingScreen from '@/components/ui/8bit-loading-screen';
import {
  RotateCw,
  Trophy,
  Star,
  Sparkles,
  Flame,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  CreditCard,
  ShieldAlert,
  Timer,
  Layers,
  Crown,
  CheckCircle2,
  Search,
} from 'lucide-react';

const ELEMENT_THEMES: Record<string, {
  color: string;
  glowRgb: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
}> = {
  Pyro: {
    color: '#FF6B2C',
    glowRgb: '255, 107, 44',
    badgeBg: 'bg-orange-500/15',
    badgeBorder: 'border-orange-500/30',
    badgeText: 'text-orange-400',
  },
  Hydro: {
    color: '#00BFFF',
    glowRgb: '0, 191, 255',
    badgeBg: 'bg-sky-500/15',
    badgeBorder: 'border-sky-500/30',
    badgeText: 'text-sky-400',
  },
  Electro: {
    color: '#9B59D6',
    glowRgb: '155, 89, 214',
    badgeBg: 'bg-purple-500/15',
    badgeBorder: 'border-purple-500/30',
    badgeText: 'text-purple-400',
  },
  Cryo: {
    color: '#4DD0E1',
    glowRgb: '77, 208, 225',
    badgeBg: 'bg-cyan-500/15',
    badgeBorder: 'border-cyan-500/30',
    badgeText: 'text-cyan-300',
  },
  Dendro: {
    color: '#7CB342',
    glowRgb: '124, 179, 66',
    badgeBg: 'bg-emerald-500/15',
    badgeBorder: 'border-emerald-500/30',
    badgeText: 'text-emerald-400',
  },
  Anemo: {
    color: '#4FC3F7',
    glowRgb: '79, 195, 247',
    badgeBg: 'bg-teal-500/15',
    badgeBorder: 'border-teal-500/30',
    badgeText: 'text-teal-300',
  },
  Geo: {
    color: '#FFB74D',
    glowRgb: '255, 183, 77',
    badgeBg: 'bg-amber-500/15',
    badgeBorder: 'border-amber-500/30',
    badgeText: 'text-amber-400',
  },
};

function getDenseKeyStats(char: Character): Array<{ label: string; value: string }> {
  const stats: Array<{ label: string; value: string }> = [];
  const elem = (char.element || '').toLowerCase();
  const elemDmg = char.stats?.dmgBonus?.[elem] || 0;

  // Stat 1: Elemental DMG bonus or HP
  if (elemDmg > 0) {
    const elemLabel = char.element.toUpperCase().slice(0, 4);
    stats.push({ label: elemLabel, value: `${elemDmg.toFixed(1)}%` });
  } else if (char.stats?.hp > 0) {
    stats.push({ label: 'HP', value: Math.round(char.stats.hp).toLocaleString() });
  }

  // Stat 2: ATK or HP
  if (elemDmg > 0 && char.stats?.hp > 0 && stats.length === 1) {
    if (char.stats?.atk > 0 && char.stats.atk < 3500) {
      stats.push({ label: 'ATK', value: Math.round(char.stats.atk).toLocaleString() });
    } else {
      stats.push({ label: 'HP', value: Math.round(char.stats.hp).toLocaleString() });
    }
  } else if (char.stats?.atk > 0) {
    stats.push({ label: 'ATK', value: Math.round(char.stats.atk).toLocaleString() });
  }

  // Stat 3: EM / DEF / HEAL
  if (char.stats?.healingBonus && char.stats.healingBonus > 0) {
    stats.push({ label: 'HEAL', value: `${char.stats.healingBonus.toFixed(1)}%` });
  } else if (char.stats?.def && char.stats.def > 1200) {
    stats.push({ label: 'DEF', value: Math.round(char.stats.def).toLocaleString() });
  } else if (char.stats?.em !== undefined) {
    stats.push({ label: 'EM', value: Math.round(char.stats.em).toString() });
  } else if (char.stats?.def !== undefined) {
    stats.push({ label: 'DEF', value: Math.round(char.stats.def).toLocaleString() });
  }

  // Stat 4: ER
  if (char.stats?.er !== undefined) {
    stats.push({ label: 'ER', value: `${char.stats.er.toFixed(1)}%` });
  }

  while (stats.length < 4) {
    stats.push({ label: '—', value: '—' });
  }
  return stats.slice(0, 4);
}

interface ProfileClientProps {
  uid: string;
  initialData?: EnkaData;
}

export default function ProfileClient({ uid, initialData }: ProfileClientProps) {
  const [data, setData] = useState<EnkaData | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [ttl, setTtl] = useState(initialData?.ttl || 0);
  const [nowMs, setNowMs] = useState<number | null>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(
    initialData?.characters?.[0]?.id || null
  );
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);
  const [selectedElementFilter, setSelectedElementFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { setElement } = useBackground();
  const { user, isFavorited, toggleFavorite } = useAuth();

  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 6);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 6);
  }, []);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    updateScrollButtons();
    el.addEventListener('scroll', updateScrollButtons, { passive: true });
    window.addEventListener('resize', updateScrollButtons);
    return () => {
      el.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [updateScrollButtons, data?.characters]);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const distance = 280;
    carouselRef.current.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth',
    });
  };

  const handleCarouselWheel = (e: React.WheelEvent) => {
    if (e.deltaY !== 0 && carouselRef.current) {
      carouselRef.current.scrollLeft += e.deltaY;
    }
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/player/${uid}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch player data');
      }

      const result: EnkaData = await response.json();
      setData(result);
      setTtl(result.ttl);

      if (result.characters && result.characters.length > 0) {
        setElement(result.characters[0].element);
        setSelectedCharacterId(result.characters[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [uid, setElement]);

  useEffect(() => {
    if (initialData && initialData.player.uid === uid) {
      if (initialData.characters && initialData.characters.length > 0) {
        setElement(initialData.characters[0].element);
        setSelectedCharacterId(initialData.characters[0].id);
      }
      return () => {
        setElement(undefined);
      };
    }

    fetchData();

    return () => {
      setElement(undefined);
    };
  }, [uid, initialData, setElement, fetchData]);

  // Countdown timer & relative updated timestamp ticker
  useEffect(() => {
    setNowMs(Date.now());
    const ticker = setInterval(() => {
      setNowMs(Date.now());
    }, 30000);
    return () => clearInterval(ticker);
  }, [data?.fetchedAt]);

  useEffect(() => {
    if (ttl <= 0) return;
    const interval = setInterval(() => {
      setTtl((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [ttl]);

  // Handle character selection and scroll to showcase
  const handleSelectCharacter = (char: Character) => {
    setSelectedCharacterId(char.id);
    setElement(char.element);
    setTimeout(() => {
      const el = document.getElementById('akasha-showcase-card');
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top < -50 || rect.bottom > window.innerHeight + 250) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }, 50);
  };

  if (loading) {
    return (
      <LoadingScreen
        variant="fullscreen"
        autoProgress
        autoProgressDuration={6000}
        title="CONNECTING TO AKASHA TERMINAL"
        tips={[
          "Fetching character showcase from Irminsul network...",
          "Tip: Explore every corner for hidden treasures.",
          "Calculating artifact Crit Value and Roll Value percentiles...",
          "Did you know? Saving often prevents lost progress!",
          "Nightsoul Transmission allows Natlan warriors to traverse terrain with ease.",
          "Remember to condense your Original Resin at any Crafting Bench!",
          "Pro tip: Read the manual for secret moves.",
        ]}
      />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="rounded-2xl p-8 max-w-md w-full text-center bg-slate-900/95 border border-white/10 shadow-2xl backdrop-blur-xl">
          <div className="w-14 h-14 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-500/10">
            <ShieldAlert className="w-8 h-8 text-rose-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-white tracking-tight">Error Loading Profile</h2>
          <p className="text-zinc-300 mb-6 text-sm leading-relaxed">{error}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => fetchData()}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl transition text-sm shadow-lg shadow-cyan-500/20 active:scale-95 cursor-pointer"
            >
              <RotateCw className={cn("w-4 h-4", loading && "animate-spin")} />
              <span>Try Again</span>
            </button>
            <a
              href="/"
              className="inline-block px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white font-medium rounded-xl transition text-sm border border-white/10 cursor-pointer"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Selected character & live player badge fields
  const selectedCharacter =
    data.characters.find((c) => c.id === selectedCharacterId) || data.characters[0];

  const nameCardUrl = getNameCardUrl(data.player.nameCardId, data.player.nameCardUrl);
  const serverRegion = getServerRegion(data.player.uid, data.player.region);
  const achievements = data.player.finishAchievementNum;
  const stygianSeconds = data.player.stygianSeconds;
  const theaterAct = data.player.theaterActIndex;
  const theaterStars = data.player.theaterStarIndex;
  const abyssBadge =
    data.player.towerStarIndex !== undefined
      ? String(data.player.towerStarIndex)
      : data.player.towerFloorIndex && data.player.towerLevelIndex
      ? `${data.player.towerFloorIndex}-${data.player.towerLevelIndex}`
      : null;
  const updatedLabel =
    nowMs !== null
      ? `Last updated ${formatRelativeTime(data.fetchedAt || data.akashaUpdatedAt, nowMs)}`
      : data.fetchedAt
      ? 'Last updated just now'
      : 'Updated via Enka.Network';

  return (
    <div className="min-h-screen p-3 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* ── Top Bar: Last Update Timestamp & Refresh Button ──────────────── */}
      <div className="flex items-center justify-between text-xs text-zinc-400 font-mono px-1">
        <div className="flex items-center gap-2">
          <span>{updatedLabel}</span>
        </div>
        <div className="flex items-center gap-2.5">
          {/* GitHub Profile Button */}
          <a
            href="https://github.com/FuziwaraDesu67"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white transition font-medium border border-zinc-700/80 shadow-sm group active:scale-95 cursor-pointer"
            title="Developer GitHub: FuziwaraDesu67"
          >
            <svg
              className="w-3.5 h-3.5 fill-current text-zinc-400 group-hover:text-emerald-400 transition-colors"
              viewBox="0 0 24 24"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
            <span>GitHub</span>
          </a>

          {ttl > 0 ? (
            <span className="text-zinc-400">
              Refresh available in <strong className="text-cyan-400">{getTimeUntilRefresh(ttl)}</strong>
            </span>
          ) : (
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition font-medium border border-zinc-700 shadow-sm"
            >
              <RotateCw className="w-3 h-3 text-cyan-400" />
              <span>Refresh Data</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Recent History Profiles Tabs (Matches user PNG) ─────────────── */}
      <RecentProfilesBar
        currentUid={data.player.uid}
        currentNickname={data.player.nickname}
        currentAvatar={data.player.profilePicture}
      />

      {/* ── Player Profile Header Banner with Namecard Artwork ───────────── */}
      <div className="relative rounded-2xl p-5 md:p-6 bg-[#12141c] border border-zinc-800/90 overflow-hidden shadow-lg">
        {nameCardUrl && (
          <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden">
            <img
              src={nameCardUrl}
              alt="Equipped Namecard"
              className="w-full h-full object-cover object-center opacity-85"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(90deg, rgba(10,12,18,0.88) 0%, rgba(10,12,18,0.42) 45%, rgba(10,12,18,0.34) 70%, rgba(10,12,18,0.78) 100%), linear-gradient(180deg, rgba(10,12,18,0.28) 0%, rgba(10,12,18,0.12) 50%, rgba(10,12,18,0.65) 100%)',
              }}
            />
          </div>
        )}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left: Avatar, Name, Signature */}
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden border border-amber-400/70 bg-zinc-950/90 shrink-0 shadow-md">
              <img
                src={
                  data.player.profilePicture ||
                  (data.characters[0] ? data.characters[0].icon : '/icons/characters/10000107.png')
                }
                alt={data.player.nickname}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  const fallbackIcon = data.characters[0]?.icon;
                  if (fallbackIcon && !target.src.endsWith(fallbackIcon)) {
                    target.src = fallbackIcon;
                  } else {
                    target.style.display = 'none';
                  }
                }}
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400 drop-shadow" />
                <h1 className="text-2xl md:text-3xl font-semibold text-white tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
                  {data.player.nickname}
                </h1>

                {/* Verified / Ownership Badge */}
                {user?.linkedUid === data.player.uid && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 flex items-center gap-1 shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Your Profile</span>
                  </span>
                )}

                {user?.linkedUid === data.player.uid && user?.isVerified && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center gap-1 shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Verified Owner</span>
                  </span>
                )}

                {/* Bookmark Favorite Button (Matches media_1794936772597_89e822e0.png) */}
                <button
                  type="button"
                  onClick={() => toggleFavorite(data.player.uid, data.player.nickname, data.player.profilePicture)}
                  className={cn(
                    "ml-1 px-3 py-1 rounded-full border transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 shadow-sm",
                    isFavorited(data.player.uid)
                      ? "bg-[#714f12]/75 text-amber-300 border-amber-400/60 hover:bg-[#855e1a]/80 shadow-amber-500/10"
                      : "bg-black/50 text-zinc-300 border-white/15 hover:text-white hover:bg-white/10 hover:border-amber-400/40"
                  )}
                  title={isFavorited(data.player.uid) ? "Saved in your Watchlist (Click to remove)" : "Bookmark to your Watchlist (Click to save)"}
                >
                  <Star className={cn("w-3.5 h-3.5 transition-colors", isFavorited(data.player.uid) ? "text-amber-400 fill-amber-400" : "text-zinc-400")} />
                  <span>{isFavorited(data.player.uid) ? "Favorited" : "Save"}</span>
                </button>
              </div>
              <p className="text-xs md:text-sm text-zinc-200/90 mt-0.5 drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]">
                {data.player.signature || "Natlan explorer"}
              </p>
              <div className="flex items-center gap-3 text-xs text-zinc-300 font-mono mt-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]">
                <span>UID: <strong className="text-white">{data.player.uid}</strong></span>
              </div>
            </div>
          </div>

          {/* Right: Live Fetched Player Badges (Authentic Enka / Game Design) */}
          <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0">
            {/* Row 1: Region, Achievements, Adventure Rank */}
            <div className="flex items-center gap-1.5">
              <span
                className="h-6 px-2 py-0.5 rounded-[3px] bg-[#FAF17B] text-[#1E1B18] text-xs font-black tracking-wide uppercase leading-none flex items-center shadow-sm select-none"
                title={`Server: ${serverRegion}`}
              >
                {serverRegion}
              </span>
              {achievements !== undefined && (
                <span
                  className="h-6 px-2 py-0.5 rounded-[3px] bg-[#B5852E] text-white text-xs font-bold leading-none flex items-center gap-1 shadow-sm select-none"
                  title={`Achievements Unlocked: ${achievements}`}
                >
                  <img
                    src="/icons/game/achievements.png"
                    alt="Achievements"
                    className="w-3.5 h-3.5 object-contain shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://enka.network/img/achievements.png';
                    }}
                  />
                  <span>{achievements}</span>
                </span>
              )}
              {data.player.level !== undefined && (
                <span
                  className="h-6 px-2 py-0.5 rounded-[3px] bg-[#B5852E] text-white text-xs font-bold leading-none flex items-center shadow-sm select-none"
                  title={`Adventure Rank ${data.player.level}`}
                >
                  AR{data.player.level}
                </span>
              )}
            </div>

            {/* Row 2: Stygian Onslaught, Imaginarium Theater, Spiral Abyss */}
            {(stygianSeconds !== undefined || theaterStars !== undefined || theaterAct !== undefined || abyssBadge) && (
              <div className="flex items-center gap-1.5">
                {stygianSeconds !== undefined && stygianSeconds > 0 && (
                  <span
                    className="h-6 px-2 py-0.5 rounded-[3px] bg-[#008287] text-white text-xs font-bold leading-none flex items-center gap-1 shadow-sm select-none"
                    title={
                      data.player.stygianIndex
                        ? `Stygian Onslaught Difficulty ${data.player.stygianIndex} Clear: ${stygianSeconds}s`
                        : `Stygian Onslaught Clear Time: ${stygianSeconds}s`
                    }
                  >
                    <img
                      src={`/icons/game/stygian_medal_${data.player.stygianIndex || 4}.png`}
                      alt="Stygian Onslaught"
                      className="w-4 h-4 object-contain shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://enka.network/ui/UI_LeyLineChallenge_Medal_${data.player.stygianIndex || 4}.png`;
                      }}
                    />
                    <span>{stygianSeconds}s</span>
                  </span>
                )}
                {(theaterStars !== undefined || theaterAct !== undefined) && (
                  <span
                    className="h-6 px-2 py-0.5 rounded-[3px] bg-[#B5852E] text-white text-xs font-bold leading-none flex items-center gap-1 shadow-sm select-none"
                    title={`Imaginarium Theater Stars: ${theaterStars ?? theaterAct}`}
                  >
                    <img
                      src="/icons/game/theater_star.png"
                      alt="Imaginarium Theater"
                      className="w-3.5 h-3.5 object-contain shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://enka.network/ui/UI_Icon_Tower_Star1.png';
                      }}
                    />
                    <span>{theaterStars ?? theaterAct}</span>
                  </span>
                )}
                {abyssBadge && (
                  <span
                    className="h-6 px-2 py-0.5 rounded-[3px] bg-[#B5852E] text-white text-xs font-bold leading-none flex items-center gap-1 shadow-sm select-none"
                    title={`Spiral Abyss Stars: ${abyssBadge}`}
                  >
                    <img
                      src="/icons/game/abyss.png"
                      alt="Spiral Abyss"
                      className="w-3.5 h-3.5 object-contain shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://enka.network/img/abyss.png';
                      }}
                    />
                    <span>{abyssBadge}</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Overview Statistics Banner (Required by tests) ──────────────── */}
      {data.characters.length > 0 && (
        <div className="p-3.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">Showcase Characters:</span>
            <span className="font-bold text-white font-mono text-sm">
              <CountUp to={data.characters.length} duration={0.6} trigger="load" />
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">Average Build CV:</span>
            <span className="font-bold text-cyan-400 font-mono text-sm">
              <CountUp
                to={
                  data.characters.reduce((sum, c) => {
                    const cv = c.totalCv !== undefined
                      ? c.totalCv
                      : (c.artifacts || []).reduce((s, a) => s + (a.cv || 0), 0);
                    return sum + cv;
                  }, 0) / data.characters.length
                }
                decimals={1}
                suffix=" CV"
                duration={0.8}
                trigger="load"
              />
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">Top Build:</span>
            {(() => {
              const topChar = [...data.characters].sort(
                (a, b) => getEffectiveAkashaCv(b) - getEffectiveAkashaCv(a)
              )[0];
              const topCv = getEffectiveAkashaCv(topChar);
              return (
                <span className="font-semibold text-amber-300">
                  {topChar?.name || 'None'} (
                  <CountUp to={topCv} decimals={1} suffix=" CV" duration={0.8} trigger="load" />
                  )
                </span>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── Leaderboard Ranking Carousel (Holographic Tilted Cards) ─────────── */}
      {data.characters.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-semibold text-zinc-300 text-xs flex items-center gap-1.5">
              <span>Leaderboard categories</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-400 border border-zinc-700/60 font-mono">
                {data.characters.length}
              </span>
            </span>
            <span className="text-xs text-zinc-500">Click a character to inspect build</span>
          </div>

          <div className="relative group/carousel">
            {/* Scroll Left Button */}
            {canScrollLeft && (
              <button
                type="button"
                onClick={() => scrollCarousel('left')}
                aria-label="Scroll left"
                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-zinc-950/85 hover:bg-zinc-900 border border-zinc-700/80 text-zinc-200 flex items-center justify-center shadow-xl backdrop-blur transition-all duration-150 hover:scale-110 active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {/* Scroll Right Button */}
            {canScrollRight && (
              <button
                type="button"
                onClick={() => scrollCarousel('right')}
                aria-label="Scroll right"
                className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-zinc-950/85 hover:bg-zinc-900 border border-zinc-700/80 text-zinc-200 flex items-center justify-center shadow-xl backdrop-blur transition-all duration-150 hover:scale-110 active:scale-95"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {/* Holographic Cards Rail */}
            <div
              ref={carouselRef}
              onWheel={handleCarouselWheel}
              style={{
                WebkitMaskImage:
                  canScrollLeft && canScrollRight
                    ? 'linear-gradient(to right, transparent, black 32px, black calc(100% - 32px), transparent)'
                    : canScrollLeft
                    ? 'linear-gradient(to right, transparent, black 32px, black 100%)'
                    : canScrollRight
                    ? 'linear-gradient(to right, black 0%, black calc(100% - 32px), transparent)'
                    : 'none',
                maskImage:
                  canScrollLeft && canScrollRight
                    ? 'linear-gradient(to right, transparent, black 32px, black calc(100% - 32px), transparent)'
                    : canScrollLeft
                    ? 'linear-gradient(to right, transparent, black 32px, black 100%)'
                    : canScrollRight
                    ? 'linear-gradient(to right, black 0%, black calc(100% - 32px), transparent)'
                    : 'none',
              }}
              className="flex items-center gap-3 overflow-x-auto py-2 px-1 no-scrollbar select-none"
            >
              {data.characters.map((char) => {
                const akasha = char.akasha;
                const isRankedAkasha = Boolean(akasha && akasha.ranking > 0 && akasha.outOf > 0);
                const categoryLabel = akasha
                  ? akasha.category
                  : `${char.element.toUpperCase()} BUILD`;
                const rankPctLabel = isRankedAkasha
                  ? `top ${formatTopPercent(akasha!.topPercent)}`
                  : `${getEffectiveAkashaCv(char).toFixed(1)} CV`;
                const rankNumLabel = isRankedAkasha
                  ? `${formatCompactCount(akasha!.ranking)}/${formatCompactCount(akasha!.outOf)}`
                  : 'Unranked';
                const isSelected = char.id === selectedCharacterId;
                const theme = ELEMENT_THEMES[char.element] || ELEMENT_THEMES.Pyro;

                return (
                  <TiltedCard
                    key={char.id}
                    containerWidth={124}
                    containerHeight={164}
                    imageWidth={124}
                    imageHeight={164}
                    radius={14}
                    rotateAmplitude={10}
                    scaleOnHover={1.03}
                    glare={0.45}
                    glareColor={theme.color}
                    shadow={0.35}
                    onClick={() => handleSelectCharacter(char)}
                    className="shrink-0 cursor-pointer"
                  >
                    <div
                      className={cn(
                        "w-full h-full p-2.5 flex flex-col items-center justify-between text-center rounded-[14px] border transition-all duration-200 relative overflow-hidden",
                        isSelected
                          ? "bg-[#181c2b] shadow-lg"
                          : "bg-[#121520]/95 hover:bg-[#161a28]"
                      )}
                      style={
                        {
                          borderColor: isSelected ? theme.color : 'rgba(255, 255, 255, 0.08)',
                          boxShadow: isSelected
                            ? `0 0 18px rgba(${theme.glowRgb}, 0.35), inset 0 0 12px rgba(${theme.glowRgb}, 0.12)`
                            : undefined,
                          '--theme-rgb': theme.glowRgb,
                        } as React.CSSProperties
                      }
                    >
                      {/* Category Label with glowing element indicator */}
                      <div className="w-full flex items-center justify-center gap-1 px-0.5">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: theme.color,
                            boxShadow: `0 0 6px ${theme.color}`,
                          }}
                        />
                        <span className="text-[10px] font-black tracking-tight text-zinc-300 uppercase truncate">
                          {categoryLabel}
                        </span>
                      </div>

                      {/* Centerpiece: Avatar + Weapon */}
                      <div className="flex items-center justify-center gap-1.5 my-1">
                        <div
                          className="relative w-10 h-10 rounded-lg overflow-hidden border bg-zinc-950 shrink-0 transition-colors"
                          style={{
                            borderColor: isSelected ? theme.color : 'rgba(255, 255, 255, 0.15)',
                          }}
                        >
                          <img
                            src={char.icon}
                            alt={char.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              const norm = char.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                              if (!target.src.includes(norm)) {
                                target.src = `/icons/characters/${norm}.png`;
                              } else if (!target.src.includes('enka.network')) {
                                target.src = `https://enka.network/ui/UI_AvatarIcon_${char.name.replace(/\s+/g, '')}.png`;
                              }
                            }}
                          />
                        </div>
                        <div className="relative w-8 h-10 rounded-md overflow-hidden border border-zinc-700/70 bg-zinc-950/90 flex items-center justify-center shrink-0">
                          <img
                            src={char.weapon.icon}
                            alt={resolveWeaponName(char.weapon.id, char.weapon.name)}
                            className="w-7 h-7 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <span className="absolute bottom-0 right-0 px-1 bg-black/90 text-[9px] font-bold text-amber-300 leading-tight rounded-tl">
                            R{char.weapon.refinement}
                          </span>
                        </div>
                      </div>

                      {/* Rank & Stats */}
                      <div className="w-full flex flex-col items-center">
                        {isRankedAkasha ? (
                          <div className="flex items-center justify-center gap-0.5">
                            {akasha!.topPercent <= 5 ? (
                              <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                            ) : null}
                            <ShinyText
                              text={rankPctLabel}
                              disabled={akasha!.topPercent > 10}
                              color={
                                akasha!.topPercent <= 1
                                  ? '#fbbf24'
                                  : akasha!.topPercent <= 5
                                  ? '#34d399'
                                  : '#10b981'
                              }
                              shineColor="#ffffff"
                              speed={akasha!.topPercent <= 5 ? 2 : 3}
                              className="text-xs font-black tracking-tight"
                            />
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-amber-300">
                            {rankPctLabel}
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-zinc-400 truncate w-full mt-0.5">
                          {rankNumLabel}
                        </span>
                      </div>
                    </div>
                  </TiltedCard>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Character Table / List (Matching Image 2) ────────────────────── */}
      <div className="space-y-3">
        {(() => {
          const elementsList = ['All', 'Pyro', 'Hydro', 'Anemo', 'Electro', 'Dendro', 'Cryo', 'Geo'] as const;
          const elementCounts = (data.characters || []).reduce<Record<string, number>>((acc, c) => {
            acc[c.element] = (acc[c.element] || 0) + 1;
            return acc;
          }, {});

          return (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 mb-1">
              <div className="flex items-center gap-3">
                <h2 className="text-xl md:text-2xl font-bold text-[#ece9e2] tracking-tight">
                  Character Showcase
                </h2>
                <span className="text-xs px-3 py-1 rounded-full bg-[#1c1c1f] text-[#8e8a84] border border-[#2b2b30] font-mono font-medium">
                  {data.characters.length} Available
                </span>
              </div>

              {/* Interactive Element Filter Bar & Search */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#65625d] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search characters…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-36 sm:w-44 pl-8 pr-3 py-1 text-xs rounded-full bg-[#1c1c1f] text-[#ece9e2] placeholder-[#65625d] border border-[#2b2b30] focus:outline-none focus:border-[#c9a66b] transition font-sans"
                  />
                </div>

                {elementsList.map((elem) => {
                  const isAll = elem === 'All';
                  const count = isAll ? data.characters.length : elementCounts[elem] || 0;
                  if (!isAll && count === 0) return null;

                  const isActive = selectedElementFilter === elem;
                  const theme = !isAll ? (ELEMENT_THEMES[elem as keyof typeof ELEMENT_THEMES] || ELEMENT_THEMES.Pyro) : null;

                  return (
                    <button
                      key={elem}
                      onClick={() => setSelectedElementFilter(elem)}
                      className={cn(
                        "flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full transition-all duration-150 border",
                        isActive
                          ? isAll
                            ? "bg-[#1c1c1f] text-[#c9a66b] border-[#c9a66b] shadow-[0_0_10px_rgba(201,166,107,0.2)]"
                            : "bg-[#1c1c1f] shadow-sm"
                          : "bg-[#1c1c1f] text-[#8e8a84] border-[#2b2b30] hover:text-[#ece9e2] hover:border-[#3a3a42]"
                      )}
                      style={
                        isActive && theme
                          ? {
                              borderColor: theme.color,
                              color: theme.color,
                              boxShadow: `0 0 10px rgba(${theme.glowRgb}, 0.25)`,
                            }
                          : undefined
                      }
                    >
                      {!isAll && (
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: theme?.color }}
                        />
                      )}
                      <span>{elem}</span>
                      <span
                        className={cn(
                          "text-[10px] font-mono px-1 rounded",
                          isActive ? "bg-white/10 text-white" : "text-[#65625d]"
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}

                <button
                  onClick={() => setIsFilterCollapsed((prev) => !prev)}
                  className="p-1.5 rounded-full bg-[#1c1c1f] border border-[#2b2b30] text-[#8e8a84] hover:text-[#ece9e2] hover:border-[#3a3a42] transition ml-1"
                  title={isFilterCollapsed ? "Expand table" : "Collapse table"}
                >
                  {isFilterCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          );
        })()}

        {data.characters.length === 0 ? (
          <div className="rounded-2xl p-12 text-center bg-[#13161f] border border-zinc-800">
            <p className="text-xl text-zinc-400 mb-4">No characters in showcase</p>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Enable character showcase in-game:<br />
              Character Details → Show Character in Battle Showcase
            </p>
          </div>
        ) : (
          <>
            {!isFilterCollapsed && (() => {
              const filteredCharacters = (data.characters || [])
                .filter((char) => {
                  const matchesElement =
                    selectedElementFilter === 'All' ||
                    char.element.toLowerCase() === selectedElementFilter.toLowerCase();
                  const matchesSearch =
                    !searchQuery.trim() ||
                    char.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
                  return matchesElement && matchesSearch;
                })
                .sort((a, b) => getEffectiveAkashaCv(b) - getEffectiveAkashaCv(a));

              return (
                <div className="rounded-[14px] overflow-hidden border border-[#232328] bg-[#16161a] shadow-2xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-[#ece9e2]">
                      <thead className="bg-[#1e1e22] text-[#8e8a84] text-[12px] md:text-[13px] font-semibold border-b border-[#232328] select-none">
                        <tr>
                          <th className="py-3 px-3 md:px-4 w-12 md:w-14 text-center text-[#8e8a84] font-mono text-[13px]">#</th>
                          <th className="py-3 px-3 md:px-4 w-52 text-[#8e8a84]">Name</th>
                          <th className="py-3 px-2 md:px-3 w-16 md:w-20 text-center text-[#8e8a84]">Const</th>
                          <th className="py-3 px-3 md:px-4 w-24 text-[#8e8a84]">Weapon</th>
                          <th className="py-3 px-3 md:px-4 w-20 text-[#8e8a84]">Sets</th>
                          <th className="py-3 px-3 md:px-4 min-w-[320px]">
                            <span className="text-[#8e8a84]">Crit Value </span>
                            <span className="text-[#c9a66b]">↓</span>
                          </th>
                          <th className="py-3 px-4 md:px-5 min-w-[420px] text-[#8e8a84]">Key stats</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#232328]">
                        {filteredCharacters.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-[#8e8a84] font-sans">
                              {searchQuery.trim() ? (
                                <>
                                  No characters matching &ldquo;{searchQuery}&rdquo; in showcase.
                                  <button
                                    onClick={() => {
                                      setSearchQuery('');
                                      setSelectedElementFilter('All');
                                    }}
                                    className="ml-2 text-xs text-[#c9a66b] hover:underline font-mono"
                                  >
                                    Clear filters ({data.characters.length})
                                  </button>
                                </>
                              ) : (
                                <>
                                  No {selectedElementFilter} characters found in showcase.
                                  <button
                                    onClick={() => setSelectedElementFilter('All')}
                                    className="ml-2 text-xs text-[#c9a66b] hover:underline font-mono"
                                  >
                                    View all ({data.characters.length})
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ) : (
                          filteredCharacters.map((char, index) => {
                            const isSelected = char.id === selectedCharacterId;
                            const charCv = getEffectiveAkashaCv(char);
                            const formattedCharCv = (Math.abs(charCv - Math.round(charCv)) < 0.15)
                              ? `${Math.round(charCv)} cv`
                              : `${charCv.toFixed(1)} cv`;

                            // Active set detection
                            const setCountMap: Record<string, { count: number; name: string; icon: string }> = {};
                            (char.artifacts || []).forEach(art => {
                              if (!art.setName) return;
                              if (!setCountMap[art.setName]) {
                                setCountMap[art.setName] = { count: 1, name: art.setName, icon: art.icon };
                              } else {
                                setCountMap[art.setName].count++;
                              }
                            });
                            const fourPieceSet = Object.values(setCountMap).find(s => s.count >= 4);
                            const twoPieceSets = Object.values(setCountMap).filter(s => s.count >= 2);

                            const resolvedWeaponName = resolveWeaponName(char.weapon.id, char.weapon.name);
                            const cr = char.stats.cr || 0;
                            const cd = char.stats.cd || 0;
                            const sum = cr + cd;
                            const crRatio = sum > 0 ? Math.max(12, Math.min(88, (cr / sum) * 100)) : 50;
                            const denseStats = getDenseKeyStats(char);

                            return (
                              <tr
                                key={char.id}
                                onClick={() => handleSelectCharacter(char)}
                                className={cn(
                                  "cursor-pointer transition-colors duration-150 border-l-2 group select-none",
                                  isSelected
                                    ? "bg-[#251b18] border-l-[#ff6a1f]"
                                    : "bg-[#1a1a1e] border-l-transparent hover:bg-[#232328]"
                                )}
                              >
                                {/* # Rank */}
                                <td className="py-3 px-3 md:px-4 text-center text-sm md:text-[15px] font-mono font-medium text-[#8e8a84]">
                                  {index + 1}
                                </td>

                                {/* Name + Avatar */}
                                <td className="py-3 px-3 md:px-4 font-sans">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-full overflow-hidden bg-[#2a2a2f] border border-white/10 shrink-0 flex items-center justify-center">
                                      <img
                                        src={char.icon}
                                        alt={char.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          const norm = char.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                                          if (!target.src.includes(norm)) {
                                            target.src = `/icons/characters/${norm}.png`;
                                          } else if (!target.src.includes('enka.network')) {
                                            target.src = `https://enka.network/ui/UI_AvatarIcon_${char.name.replace(/\s+/g, '')}.png`;
                                          }
                                        }}
                                      />
                                    </div>
                                    <span className="text-[14px] md:text-[15px] font-semibold text-[#ece9e2] group-hover:text-white transition-colors truncate">
                                      {char.name}
                                    </span>
                                  </div>
                                </td>

                                {/* Constellation */}
                                <td className="py-3 px-2 md:px-3 text-center whitespace-nowrap">
                                  {char.constellation === 0 ? (
                                    <span className="px-2.5 py-1 rounded-[6px] text-xs font-mono font-medium bg-[#2a2a2f] text-[#8e8a84] inline-block">
                                      C0
                                    </span>
                                  ) : char.constellation === 6 ? (
                                    <span className="px-2.5 py-1 rounded-[6px] text-xs font-mono font-bold bg-[#3b2b18] text-[#e6ca65] border border-[#7a582c]/50 inline-block shadow-sm">
                                      C6
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-1 rounded-[6px] text-xs font-mono font-medium bg-[#213542] text-[#8ec5d6] border border-[#3b667e]/40 inline-block">
                                      C{char.constellation}
                                    </span>
                                  )}
                                </td>

                                {/* Weapon */}
                                <td className="py-3 px-3 md:px-4 font-sans">
                                  <div className="flex items-center gap-2.5" title={`${resolvedWeaponName} (Lv. ${char.weapon.level || 90})`}>
                                    <div className="w-[30px] h-[30px] md:w-8 md:h-8 rounded-[8px] overflow-hidden bg-[#1c1c20] border border-[#2b2b30] p-0.5 shrink-0 flex items-center justify-center">
                                      <img
                                        src={char.weapon.icon}
                                        alt={resolvedWeaponName}
                                        className="w-full h-full object-contain filter drop-shadow(0 1px 2px rgba(0,0,0,0.5))"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          if (!target.src.includes('enka.network')) {
                                            target.src = `https://enka.network/ui/UI_EquipIcon_Weapon_${resolvedWeaponName.replace(/\s+/g, '')}.png`;
                                          }
                                        }}
                                      />
                                    </div>
                                    <span className="text-xs font-mono font-semibold text-[#8e8a84]">
                                      R{char.weapon.refinement || 1}
                                    </span>
                                  </div>
                                </td>

                                {/* Sets */}
                                <td className="py-3 px-3 md:px-4 font-sans">
                                  <div className="flex items-center gap-2.5" title={fourPieceSet?.name || twoPieceSets.map(s => s.name).join(' / ') || 'Rainbow'}>
                                    <div className="w-[30px] h-[30px] md:w-8 md:h-8 rounded-[8px] overflow-hidden bg-[#1c1c20] border border-[#2b2b30] p-0.5 shrink-0 flex items-center justify-center">
                                      {fourPieceSet ? (
                                        <img src={fourPieceSet.icon} alt={fourPieceSet.name} className="w-full h-full object-contain" />
                                      ) : twoPieceSets.length > 0 ? (
                                        <img src={twoPieceSets[0].icon} alt={twoPieceSets[0].name} className="w-full h-full object-contain" />
                                      ) : char.artifacts?.[0]?.icon ? (
                                        <img src={char.artifacts[0].icon} alt="Artifact" className="w-full h-full object-contain opacity-60" />
                                      ) : (
                                        <span className="text-[10px] font-mono text-[#65625d]">—</span>
                                      )}
                                    </div>
                                    <span className="text-xs font-mono font-semibold text-[#8e8a84]">
                                      {fourPieceSet ? '4' : twoPieceSets.length >= 2 ? '2+2' : twoPieceSets.length === 1 ? '2' : '—'}
                                    </span>
                                  </div>
                                </td>

                                {/* Crit Value ↓ with ratio bar */}
                                <td className="py-3 px-3 md:px-4 whitespace-nowrap">
                                  <div className="flex items-center gap-3">
                                    <span className="text-[13px] md:text-[14px] font-mono text-[#ece9e2] min-w-[104px]">
                                      {cr.toFixed(1)} : {cd.toFixed(1)}
                                      {char.setBonusCr ? (
                                        <span
                                          className="text-[11px] text-[#c9a66b] font-mono font-semibold ml-1"
                                          title={`${char.isCvCapped ? 'Capped at 100% CR' : 'Set Bonus'}: +${char.setBonusCr}% CR`}
                                        >
                                          (+{char.setBonusCr}%)
                                        </span>
                                      ) : null}
                                    </span>

                                    <div className="w-[100px] md:w-[120px] h-[5px] rounded-full overflow-hidden flex bg-[#2a2a2f] shrink-0" title={`CR: ${cr.toFixed(1)}% | CD: ${cd.toFixed(1)}%`}>
                                      <div style={{ width: `${crRatio}%` }} className="h-full bg-[#c9a66b]" />
                                      <div className="flex-1 h-full bg-[#b8694f]" />
                                    </div>

                                    <span className="text-[14px] md:text-[15px] font-mono font-bold text-[#c9a66b] shrink-0 min-w-[68px] text-right">
                                      {formattedCharCv}
                                    </span>
                                  </div>
                                </td>

                                {/* Key stats */}
                                <td className="py-3 px-4 md:px-5 whitespace-nowrap">
                                  <div className="grid grid-cols-4 gap-3 md:gap-5 max-w-[480px]">
                                    {denseStats.map((st, sIdx) => (
                                      <div key={sIdx} className="flex items-baseline gap-1.5">
                                        <span className="text-[10px] md:text-[11px] font-semibold text-[#8e8a84] uppercase tracking-[0.5px] shrink-0">
                                          {st.label}
                                        </span>
                                        <span className="text-[13px] md:text-[14px] font-mono text-[#ece9e2] tabular-nums font-medium">
                                          {st.value}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Dense Table Footer */}
                  <div className="px-4 py-3 bg-[#141417] border-t border-[#232328] flex items-center justify-between text-xs md:text-sm text-[#8e8a84] select-none">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#ece9e2]">Sorted by Overall CV</span>
                      <span className="text-[#3a3a42]">•</span>
                      <span>100% CR cap applied</span>
                    </div>
                    <div>
                      {filteredCharacters.length} of {data.characters.length} characters
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── Featured Active Akasha Showcase Card ─────────────────────── */}
            {selectedCharacter && (() => {
              const selectedTheme = ELEMENT_THEMES[selectedCharacter.element] || ELEMENT_THEMES.Pyro;
              return (
                <motion.div
                  key={selectedCharacter.id}
                  id="akasha-showcase-card"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, ease: 'easeOut' }}
                  className="pt-2 scroll-mt-6"
                >
                  <TiltedCard
                    containerWidth="100%"
                    containerHeight="auto"
                    imageWidth="100%"
                    imageHeight="auto"
                    rotateAmplitude={3.5}
                    scaleOnHover={1.006}
                    glare={0.32}
                    glareColor={selectedTheme.color}
                    radius={18}
                    perspective={2400}
                    smoothness={0.8}
                    shadow={0.35}
                    selectable={true}
                    className="w-full"
                  >
                    <AkashaShowcaseCard
                      character={selectedCharacter}
                      uid={uid}
                      playerNickname={data.player.nickname}
                    />
                  </TiltedCard>
                </motion.div>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
}
