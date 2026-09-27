'use client';

import { useState } from 'react';
import { sanitizeUID } from '@/lib/utils';
import { LiquidButton } from '@/components/ui/liquid-glass-button';

export default function HomePage() {
  const [uid, setUid] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitized = sanitizeUID(uid);

    if (sanitized.length !== 9 && sanitized.length !== 10) {
      setError('UID must be 9 or 10 digits');
      return;
    }

    // Navigate to profile page
    window.location.href = `/u/${sanitized}`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center mb-12">
        <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          AetherRank
        </h1>
        <p className="text-xl text-gray-300">
          Genshin Impact Build & Damage Leaderboard
        </p>
      </div>

      <div className="glass rounded-2xl p-8 w-full max-w-md relative z-10 mb-16">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="uid" className="block text-sm font-medium mb-2">
              Enter your Genshin UID
            </label>
            <input
              id="uid"
              type="text"
              value={uid}
              onChange={(e) => {
                setUid(e.target.value);
                setError('');
              }}
              placeholder="1234567890"
              maxLength={10}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 text-lg transition-all"
            />
            {error && (
              <p className="mt-2 text-sm text-red-400">{error}</p>
            )}
          </div>

          <LiquidButton
            type="submit"
            className="w-full py-3 font-semibold text-lg text-white"
            variant="default"
          >
            Analyze Profile
          </LiquidButton>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400 bg-white/5 p-3 rounded-lg border border-white/5">
          <p>Make sure your showcase is enabled in-game</p>
          <p className="mt-1 text-xs text-cyan-400">Character Details → Show Character Details</p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full mb-16">
        <div className="glass p-6 rounded-xl text-center">
          <div className="text-3xl mb-3">⚔️</div>
          <h3 className="font-bold text-lg mb-2">Damage Calculator</h3>
          <p className="text-sm text-gray-400">Advanced math running in the background to calculate your exact rotation DPS.</p>
        </div>
        <div className="glass p-6 rounded-xl text-center">
          <div className="text-3xl mb-3">👑</div>
          <h3 className="font-bold text-lg mb-2">Global Leaderboards</h3>
          <p className="text-sm text-gray-400">Compete against other players to see who has the best build for every character.</p>
        </div>
        <div className="glass p-6 rounded-xl text-center">
          <div className="text-3xl mb-3">⚡</div>
          <h3 className="font-bold text-lg mb-2">Live Enka Sync</h3>
          <p className="text-sm text-gray-400">Directly connected to the Enka API to automatically fetch your showcase in seconds.</p>
        </div>
      </div>

      <footer className="mt-auto pb-8 text-center text-sm text-gray-500 max-w-2xl">
        <p className="mb-2">
          This site is not affiliated with HoYoverse. Genshin Impact and all related assets belong to HoYoverse.
        </p>
        <p>
          Data provided by <a href="https://enka.network" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Enka.Network</a>
        </p>
      </footer>
    </div>
  );
}
