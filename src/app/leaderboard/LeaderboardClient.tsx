'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import LatticeLoader from '@/components/LatticeLoader/LatticeLoader';
import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable';
import { ELEMENT_COLORS, getCharacterData } from '@/lib/enka/static-data';
import { ElementIcon } from '@/components/ui/element-icons';
import { formatCompactCount } from '@/lib/utils';
import type { Element } from '@/lib/enka/types';
import type { LeaderboardCategoryOption, LeaderboardRowItem } from '@/lib/akasha/leaderboards';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface LeaderboardClientMeta {
  name: string;
  element: Element;
  iconUrl: string;
  totalBuilds: number;
  categories: LeaderboardCategoryOption[];
  defaultCalculationId: string;
}

interface LeaderboardClientProps {
  characterId: number;
  characterMeta?: LeaderboardClientMeta;
  initialCalculationId?: string;
}

export default function LeaderboardClient({
  characterId,
  characterMeta,
  initialCalculationId,
}: LeaderboardClientProps) {
  const router = useRouter();
  const localMeta = useMemo(() => getCharacterData(characterId), [characterId]);

  const charName = characterMeta?.name || localMeta?.name || '';
  const charElement = (characterMeta?.element || localMeta?.element || 'Pyro') as Element;
  const charIcon = characterMeta?.iconUrl || localMeta?.iconUrl || `/icons/characters/${characterId}.png`;
  const categories = useMemo(() => characterMeta?.categories || [], [characterMeta?.categories]);

  const [selectedCalcId, setSelectedCalcId] = useState<string>(
    initialCalculationId || characterMeta?.defaultCalculationId || String(characterId)
  );
  const [entries, setEntries] = useState<LeaderboardRowItem[]>([]);
  const [totalEntries, setTotalEntries] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    weaponName: undefined as string | undefined,
    minConstellation: undefined as number | undefined,
  });

  // Resolve active category & weapon metadata
  const activeCategory = useMemo(() => {
    if (categories.length === 0) return null;
    return (
      categories.find(
        (cat) =>
          cat.calculationId === selectedCalcId ||
          cat.weapons.some((w) => w.calculationId === selectedCalcId)
      ) || categories[0]
    );
  }, [categories, selectedCalcId]);

  const activePoolCount = activeCategory?.count || characterMeta?.totalBuilds || 0;
  const elementColor = ELEMENT_COLORS[charElement] || ELEMENT_COLORS.Pyro;

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (selectedCalcId) {
        params.append('calculationId', selectedCalcId);
      }
      if (activePoolCount > 0) {
        params.append('totalPool', activePoolCount.toString());
      }
      if (filters.weaponName) {
        params.append('weaponName', filters.weaponName);
      }
      if (filters.minConstellation !== undefined) {
        params.append('minConstellation', filters.minConstellation.toString());
      }
      params.append('limit', '50');
      params.append('offset', '0');

      const response = await fetch(`/api/leaderboard/${characterId}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch leaderboard: ${response.status}`);
      }

      const data = await response.json();
      setEntries(Array.isArray(data.results) ? data.results : []);
      setTotalEntries(Number(data.total) || 0);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [filters.weaponName, filters.minConstellation, characterId, selectedCalcId, activePoolCount]);

  useEffect(() => {
    if (!charName) {
      router.push('/leaderboard');
      return;
    }

    fetchLeaderboard();
  }, [charName, router, fetchLeaderboard]);

  if (!charName) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4">
          <p className="text-red-500 text-center">Character not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
      {/* Header */}
      <div className="bg-white/5 border-b border-white/10 py-6">
        <div className="container mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full overflow-hidden border-2 bg-slate-950 shrink-0"
              style={{ borderColor: `${elementColor.primary}88` }}
            >
              <img
                src={charIcon}
                alt={charName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  const cleanName = charName.replace(/\s+/g, '');
                  if (!target.src.includes('enka.network')) {
                    target.src = `https://enka.network/ui/UI_AvatarIcon_${cleanName}.png`;
                  }
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  {charName} Leaderboard
                </h1>
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-white/15 bg-black/40"
                  style={{ color: elementColor.primary }}
                >
                  <ElementIcon element={charElement} size={13} />
                  <span>{charElement}</span>
                </span>
                {(activePoolCount > 0 || totalEntries > 0) && (
                  <span className="text-xs font-mono text-zinc-400 bg-white/[0.06] px-2.5 py-0.5 rounded-full border border-white/10">
                    {formatCompactCount(activePoolCount || totalEntries)} ranked builds
                  </span>
                )}
              </div>
              <p className="text-white/60 mt-1 text-sm">
                {activeCategory?.name || `Top ${charName} builds ranked by calculated damage`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/leaderboard"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium"
            >
              All Leaderboards
            </Link>
          </div>
        </div>
      </div>

      {/* Category & Weapon Variants + Filters */}
      <div className="bg-white/[0.03] border-b border-white/10 px-4 py-4">
        <div className="container mx-auto space-y-3">
          {categories.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/45 mr-1">
                Categories:
              </span>
              {categories.map((cat) => {
                const isSelected = activeCategory?.calculationId === cat.calculationId;
                return (
                  <button
                    key={cat.calculationId}
                    type="button"
                    onClick={() => setSelectedCalcId(cat.calculationId)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      isSelected
                        ? 'text-white border-cyan-400/70 bg-cyan-500/20 shadow-sm'
                        : 'text-zinc-300 border-white/10 bg-black/30 hover:bg-white/10'
                    }`}
                    title={cat.name}
                  >
                    <span>{cat.short}</span>
                    {cat.count > 0 && (
                      <span className="ml-1.5 text-[10px] font-mono text-zinc-400">
                        {formatCompactCount(cat.count)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {activeCategory && activeCategory.weapons.length > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/45 mr-1">
                Weapon Board:
              </span>
              {activeCategory.weapons.map((w) => {
                const isSelected = selectedCalcId === w.calculationId;
                return (
                  <button
                    key={w.calculationId}
                    type="button"
                    onClick={() => setSelectedCalcId(w.calculationId)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all border ${
                      isSelected
                        ? 'text-amber-200 border-amber-400/70 bg-amber-500/15'
                        : 'text-zinc-300 border-white/10 bg-black/30 hover:bg-white/10'
                    }`}
                  >
                    {w.icon && (
                      <img
                        src={w.icon}
                        alt={w.name}
                        className="w-4 h-4 object-contain"
                      />
                    )}
                    <span>{w.name}</span>
                    <span className="text-[10px] font-bold text-amber-400">
                      R{w.refinement}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {activeCategory?.details && (
            <p className="text-xs text-zinc-400 leading-relaxed max-w-4xl">
              {activeCategory.details}
            </p>
          )}

          <div className="flex flex-wrap items-end justify-between gap-4 pt-1">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">
                  Min Constellation
                </label>
                <select
                  value={filters.minConstellation ?? ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFilters((prev) => ({
                      ...prev,
                      minConstellation: value === '' ? undefined : parseInt(value),
                    }));
                  }}
                  className="px-3 py-1.5 bg-zinc-900 border border-white/15 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                >
                  <option value="" className="bg-zinc-900 text-white">All Constellations</option>
                  {[0, 1, 2, 3, 4, 5, 6].map((c) => (
                    <option key={c} value={c} className="bg-zinc-900 text-white">
                      C{c}+
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={fetchLeaderboard}
              className="px-5 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg text-sm font-medium transition-all duration-200"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Leaderboard Entries */}
      <div className="px-4 py-7">
        <div className="container mx-auto">
          {error && (
            <div className="bg-red-900/50 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          {isLoading && entries.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <LatticeLoader
                label={`Loading ${charName} leaderboard`}
                pattern="orbit"
                grid={4}
                shape="round"
                color={elementColor.primary}
                cellSize={10}
                gap={4}
                glow={true}
                showTimer={true}
                className="text-white/90"
              />
              <p className="text-sm text-white/50">
                Fetching top ranked player builds and combo damage metrics...
              </p>
            </div>
          ) : (
            <LeaderboardTable entries={entries} isLoading={isLoading} />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pb-8 text-center text-gray-500 text-xs">
        <p>
          Click any player row to inspect their full Enka/Akasha build card and stat radar graph.
        </p>
      </div>
    </div>
  );
}
