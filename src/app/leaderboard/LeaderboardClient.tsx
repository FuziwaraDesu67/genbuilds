'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable';
import { getCharacterData } from '@/lib/enka/static-data';
import { useRouter } from 'next/navigation';

interface LeaderboardClientProps {
  characterId: number;
}

export default function LeaderboardClient({ characterId }: LeaderboardClientProps) {
  const router = useRouter();
  const character = getCharacterData(characterId);
  const [entries, setEntries] = useState<Array<any>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    weaponId: undefined as number | undefined,
    minConstellation: undefined as number | undefined,
  });

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.weaponId !== undefined) {
        params.append('weaponId', filters.weaponId.toString());
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
      setEntries(data.results);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [filters.weaponId, filters.minConstellation, characterId]);

  useEffect(() => {
    if (!character) {
      router.push('/leaderboard');
      return;
    }

    fetchLeaderboard();
  }, [characterId, character, router, fetchLeaderboard]);

  if (!character) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4">
          <p className="text-red-500 text-center">Character not found</p>
        </div>
      </div>
    );
  }

  // Skeleton loading state
  if (isLoading && entries.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
        {/* Header */}
        <div className="bg-white/5 border-b border-white/10 py-6">
          <div className="container mx-auto px-4 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">
                {character.name} Leaderboard
              </h1>
              <p className="text-white/60 mt-2">
                Top {character.name} builds ranked by calculated damage
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/leaderboard')}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                All Characters
              </button>
            </div>
          </div>
        </div>

        {/* Skeleton Leaderboard */}
        <div className="px-6 py-8">
          <div className="container mx-auto px-4">
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={`leaderboard-skeleton-${i}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.6 }}
                  className="bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-lg p-4 transition-all border border-white/10 hover:border-white/20"
                >
                  <div className="flex items-center gap-4">
                    {/* Rank Skeleton */}
                    <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-white/10 animate-pulse"></div>

                    {/* Icon Skeleton */}
                    <div className="flex-shrink-0 w-16 h-16 relative">
                      <div className="w-full h-full rounded-full bg-white/10 animate-pulse overflow-hidden border-2 border-white/20"></div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white/10 animate-pulse"></div>
                    </div>

                    {/* Player Info Skeleton */}
                    <div className="flex-1 min-w-0">
                      <div className="space-y-2">
                        <div className="h-4 bg-white/5 rounded-lg animate-pulse" style={{ width: '60%' }}></div>
                        <div className="flex items-center gap-4 text-sm text-white/60">
                          <div className="h-4 bg-white/5 rounded-lg animate-pulse" style={{ width: '30%' }}></div>
                          <div className="h-4 bg-white/5 rounded-lg animate-pulse" style={{ width: '20%' }}></div>
                          <div className="h-4 bg-white/5 rounded-lg animate-pulse" style={{ width: '20%' }}></div>
                        </div>
                      </div>
                    </div>

                    {/* Stats Skeleton (hidden on mobile) */}
                    <div className="hidden md:flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="h-4 bg-white/5 rounded-lg animate-pulse" style={{ width: '40%' }}></div>
                        <div className="h-4 bg-white/5 rounded-lg animate-pulse" style={{ width: '40%' }}></div>
                        <div className="h-4 bg-white/5 rounded-lg animate-pulse" style={{ width: '30%' }}></div>
                      </div>
                      <div className="text-center">
                        <div className="h-4 bg-white/5 rounded-lg animate-pulse" style={{ width: '40%' }}></div>
                        <div className="h-4 bg-white/5 rounded-lg animate-pulse" style={{ width: '40%' }}></div>
                      </div>
                      <div className="text-center">
                        <div className="h-4 bg-white/5 rounded-lg animate-pulse" style={{ width: '40%' }}></div>
                        <div className="h-4 bg-white/5 rounded-lg animate-pulse" style={{ width: '40%' }}></div>
                      </div>
                    </div>

                    {/* Damage Skeleton */}
                    <div className="flex-shrink-0 text-right">
                      <div className="h-4 bg-white/5 rounded-lg animate-pulse" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>
            Damage calculations are estimates based on standardized formulas and may not reflect actual in-game performance.
          </p>
          <p>
            Build data sourced from Enka.Network API • Not affiliated with HoYoverse
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
      {/* Header */}
      <div className="bg-white/5 border-b border-white/10 py-6">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              {character.name} Leaderboard
            </h1>
            <p className="text-white/60 mt-2">
              Top {character.name} builds ranked by calculated damage
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/leaderboard')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              All Characters
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/5 border-b border-white/10 px-6 py-4">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Weapon Filter */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">
                Weapon
              </label>
              <select
                onChange={(e) => {
                  const value = e.target.value;
                  setFilters(prev => ({
                    ...prev,
                    weaponId: value === '' ? undefined : parseInt(value),
                  }));
                }}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <option value="">All Weapons</option>
                {/* Weapon options would be populated from static data */}
              </select>
            </div>

            {/* Constellation Filter */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">
                Min Constellation
              </label>
              <select
                onChange={(e) => {
                  const value = e.target.value;
                  setFilters(prev => ({
                    ...prev,
                    minConstellation: value === '' ? undefined : parseInt(value),
                  }));
                }}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <option value="">All Constellations</option>
                {[...Array(7)].map((_, i) => i + 1).map((c) => (
                  <option key={c} value={c}>
                    C{c}
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh Button */}
            <div className="flex items-end">
              <button
                onClick={fetchLeaderboard}
                className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg font-medium transition-all duration-200"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="px-6 py-8">
        <div className="container mx-auto px-4">
          {error && (
            <div className="bg-red-900/50 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}
          <LeaderboardTable entries={entries} isLoading={isLoading} />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-gray-500 text-sm">
        <p>
          Damage calculations are estimates based on standardized formulas and may not reflect actual in-game performance.
        </p>
        <p>
          Build data sourced from Enka.Network API • Not affiliated with HoYoverse
        </p>
      </div>
    </div>
  );
}