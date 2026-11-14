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
        <div className="flex items-center gap-3">
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

                {/* Bookmark Favorite Button */}
                <button
                  type="button"
                  onClick={() => toggleFavorite(data.player.uid, data.player.nickname, data.player.profilePicture)}
                  className={cn(
                    "ml-1 px-2.5 py-1 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95",
                    isFavorited(data.player.uid)
                      ? "bg-amber-400/20 text-amber-300 border-amber-400/40 hover:bg-amber-400/30 shadow-md shadow-amber-400/10"
                      : "bg-black/50 text-zinc-300 border-white/10 hover:text-white hover:bg-white/10"
                  )}
                  title={isFavorited(data.player.uid) ? "Saved in your Watchlist" : "Bookmark to your Watchlist"}
                >
                  <Star className={cn("w-3.5 h-3.5", isFavorited(data.player.uid) ? "text-amber-400 fill-amber-400" : "text-zinc-400")} />
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

          {/* Right: Live Fetched Player Badges */}
          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            <span
              className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 text-xs font-semibold tracking-wider uppercase shadow-sm"
              title="Server Region"
            >
              {serverRegion}
            </span>
            {achievements !== undefined && (
              <span
                className="px-2.5 py-1 rounded-lg bg-black/65 backdrop-blur-md border border-white/15 text-zinc-100 text-xs font-medium flex items-center gap-1.5 shadow-sm"
                title="Achievements Unlocked"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <CountUp
                  to={achievements}
                  separator=","
                  duration={0.85}
                  trigger="load"
                />
              </span>
            )}
            <span
              className="px-2.5 py-1 rounded-lg bg-black/65 backdrop-blur-md border border-white/15 text-zinc-100 text-xs font-medium shadow-sm"
              title="Adventure Rank"
            >
              AR{data.player.level}
            </span>
            {stygianSeconds !== undefined && stygianSeconds > 0 && (
              <span
                className="px-2.5 py-1 rounded-lg bg-black/65 backdrop-blur-md border border-white/15 text-zinc-100 text-xs font-medium flex items-center gap-1 shadow-sm"
                title={
                  data.player.stygianIndex
                    ? `Stygian Onslaught Difficulty ${data.player.stygianIndex}`
                    : 'Stygian Onslaught Clear Time'
                }
              >
                <Timer className="w-3.5 h-3.5 text-purple-300" />
                <span>{stygianSeconds}s</span>
              </span>
            )}
            {theaterAct !== undefined && theaterAct > 0 && (
              <span
                className="px-2.5 py-1 rounded-lg bg-black/65 backdrop-blur-md border border-white/15 text-zinc-100 text-xs font-medium flex items-center gap-1 shadow-sm"
                title="Imaginarium Theater (Stella / Act)"
              >
                <Layers className="w-3.5 h-3.5 text-cyan-300" />
                <span>{theaterStars ?? 0}/{theaterAct}</span>
              </span>
            )}
            {abyssBadge && (
              <span
                className="px-2.5 py-1 rounded-lg bg-black/65 backdrop-blur-md border border-white/15 text-zinc-100 text-xs font-medium flex items-center gap-1 shadow-sm"
                title="Spiral Abyss"
              >
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>{abyssBadge}</span>
              </span>
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
                  : char.damageCalc?.totalDamage
                  ? `${formatCompactCount(char.damageCalc.totalDamage)} DMG`
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
            <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Character Showcase</span>
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800/90 text-zinc-300 border border-zinc-700/80 font-mono font-semibold">
                  {data.characters.length} Available
                </span>
              </div>

              {/* Interactive Element Filter Bar */}
              <div className="flex items-center gap-1.5 flex-wrap">
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
                        "flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all duration-200 border",
                        isActive
                          ? isAll
                            ? "bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                            : "text-white shadow-md"
                          : "bg-zinc-900/80 text-zinc-400 border-zinc-800/90 hover:text-zinc-200 hover:border-zinc-700"
                      )}
                      style={
                        isActive && theme
                          ? {
                              backgroundColor: `rgba(${theme.glowRgb}, 0.22)`,
                              borderColor: theme.color,
                              color: theme.color,
                              boxShadow: `0 0 12px rgba(${theme.glowRgb}, 0.35)`,
                            }
                          : undefined
                      }
                    >
                      {!isAll && (
                        <ElementIcon
                          element={elem as any}
                          size={13}
                          className={cn("shrink-0", isActive ? "" : "opacity-75")}
                        />
                      )}
                      <span>{elem}</span>
                      <span
                        className={cn(
                          "text-[10px] font-mono px-1 rounded",
                          isActive ? "bg-black/40 text-white" : "bg-zinc-800 text-zinc-500"
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}

                <button
                  onClick={() => setIsFilterCollapsed((prev) => !prev)}
                  className="p-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition ml-1"
                  title={isFilterCollapsed ? "Expand table" : "Collapse table"}
                >
                  {isFilterCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
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
              const filteredCharacters = (data.characters || []).filter((char) => {
                if (selectedElementFilter === 'All') return true;
                return char.element.toLowerCase() === selectedElementFilter.toLowerCase();
              });

              return (
                <div className="rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0c0e15]/90 backdrop-blur-xl shadow-2xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-zinc-200">
                      <thead className="bg-[#131622]/95 text-zinc-400 uppercase text-[11px] tracking-wider font-semibold border-b border-zinc-800/80">
                        <tr>
                          <th className="py-3 px-3 w-10 text-center">#</th>
                          <th className="py-3 px-3">Character</th>
                          <th className="py-3 px-2.5 text-center">Const.</th>
                          <th className="py-3 px-3">Weapon</th>
                          <th className="py-3 px-3">Sets</th>
                          <th className="py-3 px-3">Crit Value</th>
                          <th className="py-3 px-3">Elem. DMG</th>
                          <th className="py-3 px-3">ATK</th>
                          <th className="py-3 px-3">EM</th>
                          <th className="py-3 px-3">ER</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/40 font-mono">
                        {filteredCharacters.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="py-10 text-center text-zinc-400 font-sans">
                              No {selectedElementFilter} characters found in showcase.
                              <button
                                onClick={() => setSelectedElementFilter('All')}
                                className="ml-2 text-xs text-amber-400 hover:underline font-mono"
                              >
                                View all ({data.characters.length})
                              </button>
                            </td>
                          </tr>
                        ) : (
                          filteredCharacters.map((char, index) => {
                            const isSelected = char.id === selectedCharacterId;
                            const charCv = getEffectiveAkashaCv(char);
                            const formattedCharCv = (Math.abs(charCv - Math.round(charCv)) < 0.15)
                              ? `${Math.round(charCv)} cv`
                              : `${charCv.toFixed(1)} cv`;
                            const elemKey = char.element.toLowerCase();
                            const elemDmg = char.stats.dmgBonus?.[elemKey] || 0;
                            const theme = ELEMENT_THEMES[char.element] || ELEMENT_THEMES.Pyro;

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
                            let setBadgeText = 'Rainbow';
                            if (fourPieceSet) {
                              setBadgeText = `4pc ${fourPieceSet.name}`;
                            } else if (twoPieceSets.length >= 2) {
                              setBadgeText = '2pc + 2pc';
                            } else if (twoPieceSets.length === 1) {
                              setBadgeText = `2pc ${twoPieceSets[0].name}`;
                            }

                            // Weapon rarity & framing
                            const weaponRarity = char.weapon.rarity || 4;
                            const is5StarWeapon = weaponRarity === 5;
                            const resolvedWeaponName = resolveWeaponName(char.weapon.id, char.weapon.name);

                            // Akasha top percent
                            const isRanked = Boolean(char.akasha && char.akasha.topPercent > 0);
                            const topPct = char.akasha?.topPercent;

                            return (
                              <tr
                                key={char.id}
                                onClick={() => handleSelectCharacter(char)}
                                className={cn(
                                  "cursor-pointer transition-all duration-150 border-l-[3.5px] group",
                                  isSelected
                                    ? "border-l-current"
                                    : "border-l-transparent hover:bg-white/[0.04]"
                                )}
                                style={
                                  isSelected
                                    ? {
                                        borderLeftColor: theme.color,
                                        background: `linear-gradient(90deg, rgba(${theme.glowRgb}, 0.18) 0%, rgba(${theme.glowRgb}, 0.04) 38%, transparent 100%)`,
                                      }
                                    : undefined
                                }
                              >
                                {/* Index */}
                                <td className="py-3 px-3 text-center text-xs font-mono">
                                  <span className={cn(
                                    "transition-colors",
                                    isSelected ? "font-bold text-white" : "text-zinc-500 group-hover:text-zinc-300"
                                  )}>
                                    {index + 1}
                                  </span>
                                </td>

                                {/* Character: Avatar + Name + Subtitle */}
                                <td className="py-3 px-3 font-sans">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className="relative w-10 h-10 rounded-xl overflow-hidden bg-zinc-950 border shrink-0 shadow-md transition-colors"
                                      style={{ borderColor: isSelected ? theme.color : `rgba(${theme.glowRgb}, 0.35)` }}
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
                                      <div
                                        className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-zinc-950/95 border flex items-center justify-center p-0.5 shadow-sm"
                                        style={{ borderColor: theme.color }}
                                      >
                                        <ElementIcon element={char.element} size={11} />
                                      </div>
                                    </div>

                                    <div className="flex flex-col min-w-0">
                                      <span className="text-sm font-bold text-white whitespace-nowrap group-hover:text-amber-200 transition-colors">
                                        {char.name}
                                      </span>
                                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 whitespace-nowrap">
                                        <span style={{ color: theme.color }} className="font-semibold">{char.element}</span>
                                        <span className="text-zinc-600">•</span>
                                        <span>Lv. {char.level || 90}</span>
                                        {isRanked && (
                                          <>
                                            <span className="text-zinc-600">•</span>
                                            <span
                                              className="px-1 py-0.2 rounded font-bold font-mono text-[9px] shrink-0"
                                              style={{
                                                backgroundColor: topPct! <= 1 ? 'rgba(251, 191, 36, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                                                color: topPct! <= 1 ? '#fbbf24' : '#34d399',
                                                border: `1px solid ${topPct! <= 1 ? 'rgba(251, 191, 36, 0.4)' : 'rgba(16, 185, 129, 0.3)'}`,
                                              }}
                                            >
                                              top {formatTopPercent(topPct!)}
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* Constellation */}
                                <td className="py-3 px-2.5 text-center">
                                  {char.constellation === 0 ? (
                                    <span className="px-2 py-0.5 rounded-md bg-zinc-900/80 border border-zinc-700/60 text-xs font-mono font-medium text-zinc-400">
                                      C0
                                    </span>
                                  ) : char.constellation === 6 ? (
                                    <span className="px-2 py-0.5 rounded-md font-mono text-xs font-black bg-amber-500/20 border border-amber-400/60 text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.25)] inline-flex items-center gap-0.5">
                                      <Crown className="w-3 h-3 text-amber-300 shrink-0" />
                                      <span>C6</span>
                                    </span>
                                  ) : (
                                    <span
                                      className="px-2 py-0.5 rounded-md font-mono text-xs font-bold border inline-block"
                                      style={{
                                        backgroundColor: `rgba(${theme.glowRgb}, 0.16)`,
                                        borderColor: `rgba(${theme.glowRgb}, 0.45)`,
                                        color: theme.color,
                                      }}
                                    >
                                      C{char.constellation}
                                    </span>
                                  )}
                                </td>

                                {/* Weapon */}
                                <td className="py-3 px-3 font-sans">
                                  <div className="flex items-center gap-2.5">
                                    <div
                                      className={cn(
                                        "w-8 h-8 rounded-lg overflow-hidden p-0.5 shrink-0 border relative shadow-sm",
                                        is5StarWeapon
                                          ? "border-amber-400/60 bg-gradient-to-br from-amber-500/25 via-amber-950/40 to-black shadow-[0_0_8px_rgba(245,158,11,0.25)]"
                                          : "border-purple-400/50 bg-gradient-to-br from-purple-500/20 via-purple-950/30 to-black shadow-[0_0_8px_rgba(168,85,247,0.2)]"
                                      )}
                                    >
                                      <img
                                        src={char.weapon.icon}
                                        alt={resolvedWeaponName}
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          if (!target.src.includes('enka.network')) {
                                            target.src = `https://enka.network/ui/UI_EquipIcon_Weapon_${resolvedWeaponName.replace(/\s+/g, '')}.png`;
                                          }
                                        }}
                                      />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <span
                                        className="truncate max-w-[150px] text-xs font-semibold text-zinc-100 group-hover:text-white"
                                        title={resolvedWeaponName}
                                      >
                                        {resolvedWeaponName}
                                      </span>
                                      <span className="text-[10px] font-mono text-zinc-400">
                                        Lv. {char.weapon.level || 90}
                                      </span>
                                    </div>
                                    <span
                                      className={cn(
                                        "px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ml-auto",
                                        char.weapon.refinement === 5
                                          ? "bg-amber-500/20 border border-amber-400/50 text-amber-300 shadow-[0_0_6px_rgba(245,158,11,0.2)]"
                                          : "bg-zinc-800/90 border border-zinc-700 text-zinc-300"
                                      )}
                                    >
                                      R{char.weapon.refinement}
                                    </span>
                                  </div>
                                </td>

                                {/* Artifact Sets */}
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center -space-x-1 shrink-0">
                                      {(char.artifacts || []).slice(0, 2).map((art, aIdx) => (
                                        <img
                                          key={aIdx}
                                          src={art.icon}
                                          alt={art.setName}
                                          className="w-7 h-7 rounded-md object-contain border border-zinc-700/80 p-0.5 bg-black/60 shrink-0 shadow"
                                          title={art.setName}
                                        />
                                      ))}
                                    </div>
                                    <span
                                      className={cn(
                                        "text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border truncate max-w-[110px]",
                                        fourPieceSet
                                          ? "bg-emerald-500/10 border-emerald-400/30 text-emerald-300"
                                          : twoPieceSets.length >= 2
                                          ? "bg-sky-500/10 border-sky-400/30 text-sky-300"
                                          : "bg-zinc-800/80 border-zinc-700 text-zinc-400"
                                      )}
                                      title={setBadgeText}
                                    >
                                      {setBadgeText}
                                    </span>
                                  </div>
                                </td>

                                {/* Crit Value */}
                                <td className="py-3 px-3 whitespace-nowrap">
                                  <div className="flex items-center gap-2 font-mono">
                                    <span className="text-zinc-300 text-xs">
                                      {(char.stats.cr || 0).toFixed(1)} : {(char.stats.cd || 0).toFixed(1)}
                                    </span>
                                    {charCv >= 220 ? (
                                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/60 shadow-[0_0_10px_rgba(251,191,36,0.3)] inline-flex items-center gap-1 shrink-0">
                                        <Sparkles className="w-2.5 h-2.5 text-amber-300 shrink-0" />
                                        <ShinyText text={formattedCharCv} color="#fcd34d" shineColor="#ffffff" speed={2} className="text-xs font-black" />
                                      </span>
                                    ) : charCv >= 200 ? (
                                      <span className="px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-400/40 text-purple-300 font-black text-xs shrink-0">
                                        {formattedCharCv}
                                      </span>
                                    ) : charCv >= 170 ? (
                                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 font-bold text-xs shrink-0">
                                        {formattedCharCv}
                                      </span>
                                    ) : (
                                      <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-medium text-xs shrink-0">
                                        {formattedCharCv}
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Elemental DMG */}
                                <td className="py-3 px-3 text-sm font-mono whitespace-nowrap">
                                  {elemDmg > 0 ? (
                                    <span className="font-bold font-mono text-xs flex items-center gap-1" style={{ color: theme.color }}>
                                      <span>+{elemDmg.toFixed(1)}%</span>
                                    </span>
                                  ) : (
                                    <span className="text-zinc-600 font-mono text-xs">—</span>
                                  )}
                                </td>

                                {/* ATK */}
                                <td className="py-3 px-3 text-xs font-mono font-medium text-zinc-100">
                                  {formatNumber(char.stats.atk)}
                                </td>

                                {/* EM */}
                                <td className="py-3 px-3 text-xs font-mono">
                                  <span className={cn(
                                    char.stats.em > 100 ? "text-emerald-300 font-semibold" : "text-zinc-200"
                                  )}>
                                    {char.stats.em}
                                  </span>
                                </td>

                                {/* ER */}
                                <td className="py-3 px-3 text-xs font-mono whitespace-nowrap">
                                  <span className={cn(
                                    (char.stats.er || 100) > 140 ? "text-sky-300 font-semibold" : "text-zinc-200"
                                  )}>
                                    {(char.stats.er || 100).toFixed(1)}%
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
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
