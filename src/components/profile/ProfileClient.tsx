'use client';

import { useEffect, useState } from 'react';
import { formatNumber, formatPercentage, getTimeUntilRefresh } from '@/lib/utils';
import type { EnkaData } from '@/lib/enka/types';
import CharacterCard from '@/components/character/CharacterCard';
import { useBackground } from '@/components/background/BackgroundContext';

interface ProfileClientProps {
  uid: string;
}

export default function ProfileClient({ uid }: ProfileClientProps) {
  const [data, setData] = useState<EnkaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ttl, setTtl] = useState(0);
  const { setElement } = useBackground();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/player/${uid}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch player data');
        }

        const result = await response.json();
        setData(result);
        setTtl(result.ttl);

        // Set background element to first character's element
        if (result.characters && result.characters.length > 0) {
          setElement(result.characters[0].element);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Reset element when leaving
    return () => {
      setElement(undefined);
    };
  }, [uid, setElement]);

  // Countdown timer for refresh
  useEffect(() => {
    if (ttl <= 0) return;

    const interval = setInterval(() => {
      setTtl(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [ttl]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="glass rounded-2xl p-8">
          {/* Skeleton Loader for Player Header */}
          <div className="space-y-6">
            <div className="h-4 bg-white/5 rounded-lg animate-pulse" style={{ width: '60%' }}></div>
            <div className="flex items-center gap-4 space-y-2">
              <div className="h-4 bg-white/5 rounded-lg animate-pulse" style={{ width: '30%' }}></div>
              <div className="h-4 bg-white/5 rounded-lg animate-pulse" style={{ width: '20%' }}></div>
              <div className="h-4 bg-white/5 rounded-lg animate-pulse" style={{ width: '20%' }}></div>
              {false && (
                <>
                  <div className="h-4 bg-white/5 rounded-lg animate-pulse" style={{ width: '30%' }}></div>
                  <div className="h-4 bg-white/5 rounded-lg animate-pulse" style={{ width: '20%' }}></div>
                  <div className="h-4 bg-white/5 rounded-lg animate-pulse" style={{ width: '20%' }}></div>
                </>
              )}
            </div>
          </div>

          {/* Skeleton Loader for Character Showcase */}
          <div className="mt-6">
            <h2 className="text-2xl font-bold mb-6">
              <div className="h-6 bg-white/5 rounded-lg animate-pulse" style={{ width: '40%' }}></div>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white/5 rounded-xl p-4 animate-pulse">
                  <div className="space-y-4">
                    <div className="h-4 bg-white/5 rounded-lg animate-pulse" style={{ width: '60%' }}></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-white/5 rounded-lg animate-pulse" style={{ width: '50%' }}></div>
                      <div className="h-4 bg-white/5 rounded-lg animate-pulse" style={{ width: '40%' }}></div>
                      <div className="h-4 bg-white/5 rounded-lg animate-pulse" style={{ width: '30%' }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-darker rounded-2xl p-8 max-w-md w-full text-center">
          <div className="text-red-400 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg hover:from-cyan-400 hover:to-blue-500 transition-all"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Player Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="glass rounded-2xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {data.player.nickname}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-gray-300">
                <span className="flex items-center gap-2">
                  <span className="text-cyan-400">UID:</span>
                  {data.player.uid}
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-cyan-400">AR:</span>
                  {data.player.level}
                </span>
                {data.player.signature && (
                  <span className="flex items-center gap-2">
                    <span className="text-cyan-400">💬</span>
                    {data.player.signature}
                  </span>
                )}
              </div>
            </div>

            {/* Refresh Timer */}
            <div className="text-center md:text-right">
              {ttl > 0 ? (
                <>
                  <p className="text-sm text-gray-400 mb-1">Refresh available in</p>
                  <p className="text-2xl font-bold text-cyan-400">
                    {getTimeUntilRefresh(ttl)}
                  </p>
                </>
              ) : (
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg hover:from-cyan-400 hover:to-blue-500 transition-all"
                >
                  Refresh Data
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Characters Showcase */}
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Character Showcase</h2>

        {data.characters.length === 0 ? (
          <div className="glass-darker rounded-2xl p-12 text-center">
            <p className="text-xl text-gray-400 mb-4">No characters in showcase</p>
            <p className="text-sm text-gray-500">
              Enable character showcase in-game:<br />
              Character Details → Show Character in Battle Showcase
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.characters.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                uid={uid}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
