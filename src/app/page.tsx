'use client';

import { useState } from 'react';
import { sanitizeUID } from '@/lib/utils';
import { LiquidButton } from '@/components/ui/liquid-glass-button';
import StarBorder from '@/components/StarBorder/StarBorder';
import SpotlightCard from '@/components/SpotlightCard/SpotlightCard';
import DoodleCrewFooter, { CrewMember } from '@/components/ui/doodle-crew-footer';
import { Search, Sparkles, Trophy, Swords, ShieldCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const GENBUILDS_CREW: CrewMember[] = [
  { kind: 'yeti', letter: 0, seat: 'front', offset: -0.22, name: 'Bruno', says: 'Got high roll quality artifacts?' },
  { kind: 'bird', letter: 1, seat: 'top', offset: 0.05, name: 'Pip', says: 'Check your Crit Ratio!' },
  { kind: 'mushroom', letter: 3, seat: 'front', offset: 0.1, scale: 0.95, name: 'Morel', says: 'Rotation damage calculated!' },
  { kind: 'kid', letter: 4, seat: 'top', offset: -0.02, name: 'Juno', says: 'Is that a 50 CV piece?!' },
  { kind: 'ghost', letter: 6, seat: 'behind', offset: 0, name: 'Boo', says: 'Enka showcase sync ready!' },
  { kind: 'cat', letter: 8, seat: 'front', offset: 0.35, flip: true, name: 'Patch', says: 'Rank 1 on the leaderboard?' },
];

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

    window.location.href = `/u/${sanitized}`;
  };

  return (
    <main className="min-h-screen bg-black-950 text-black-50 flex flex-col items-center justify-between selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Dynamic Ambient Elemental Glow */}
      <div
        className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full blur-[150px] pointer-events-none opacity-20 bg-cyan-500 transition-all duration-700 -z-10"
      />

      {/* Top Navigation Bar */}
      <header className="w-full max-w-6xl px-6 py-4 flex items-center justify-end z-20">
        <nav className="flex items-center gap-4">
          <Link
            href="/leaderboard"
            className="text-sm font-medium text-black-400 hover:text-black-100 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-black-900 border border-transparent hover:border-black-800"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Leaderboards</span>
          </Link>
        </nav>
      </header>

      {/* Upper Side: Giant GENBUILDS Doodle Crew Wordmark + Tagline + UID Search Option */}
      <div className="w-full flex flex-col items-center">
        <DoodleCrewFooter
          as="section"
          showTop={false}
          showBar={false}
          actions={[]}
          wordmark="GENBUILDS"
          tagline="Fetch data from your Character Showcase and display a build card, instantly."
          preset="night"
          height="auto"
          className="pt-6 pb-2"
          palette={{
            background: '#000000',
            ink: '#fafafa',
            accent: '#00BFFF',
          }}
          crew={GENBUILDS_CREW}
        >
          {/* UID Search Option directly under the tagline */}
          <div className="w-full max-w-xl flex flex-col items-center mt-6">
            {/* UID Search Capsule with Animated Comet Border & Liquid Glass Button */}
            <StarBorder
              as="div"
              radius={24}
              thickness={1.5}
              color="#22d3ee"
              trailColor="#6366f1"
              duration={7}
              backgroundColor="rgba(10, 14, 22, 0.72)"
              borderColor="rgba(255, 255, 255, 0.08)"
              hover="brighten"
              className="!block w-full !px-0 !py-0 rounded-3xl"
            >
              <div className="w-full p-8 rounded-3xl backdrop-blur-2xl shadow-2xl relative overflow-hidden group text-left">
                {/* Subtle Inner Refraction Halo */}
                <div
                  className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-44 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-500 bg-cyan-500"
                />

                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                  <div className="text-left space-y-2">
                    <label htmlFor="uid-input" className="block text-xs font-bold tracking-wider uppercase text-black-400">
                      Genshin Impact UID
                    </label>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-black-500">
                        <Search className="w-5 h-5" />
                      </div>
                      <input
                        id="uid-input"
                        type="text"
                        value={uid}
                        onChange={(e) => {
                          setUid(e.target.value);
                          setError('');
                        }}
                        placeholder="Enter 9 or 10 digit UID (e.g. 1813164100)"
                        maxLength={10}
                        className="w-full pl-12 pr-4 py-3.5 bg-black-950/80 border border-black-700/80 rounded-xl text-black-50 placeholder:text-black-500 text-lg font-mono focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all shadow-inner"
                      />
                    </div>

                    {error && (
                      <p className="text-sm text-red-400 font-medium pt-1 animate-pulse">{error}</p>
                    )}
                  </div>

                  {/* Liquid Glass Button */}
                  <div className="pt-2">
                    <LiquidButton
                      type="submit"
                      className="w-full py-4 text-lg font-bold text-black-50 transition-all flex items-center justify-center gap-2"
                      variant="default"
                    >
                      <span>Analyze Showcase</span>
                      <ArrowRight className="w-5 h-5" />
                    </LiquidButton>
                  </div>
                </form>
              </div>
            </StarBorder>
          </div>
        </DoodleCrewFooter>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl w-full px-4 my-14 text-left">
          <SpotlightCard
            spotlightColor="#fb923c"
            intensity={0.22}
            spotlightSize={250}
            borderGlow={0.85}
            className="!p-5 !rounded-2xl backdrop-blur-md transition-colors"
            style={
              {
                '--spotlight-card-surface': 'rgba(13, 17, 26, 0.55)',
                '--spotlight-card-border': 'rgba(255, 255, 255, 0.08)',
              } as React.CSSProperties
            }
          >
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 mb-3.5">
              <Swords className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-black-100 mb-1">Rotation DPS Engine</h3>
            <p className="text-xs text-black-400 leading-relaxed">
              Real-time damage calculation accounting for weapon refinements, artifact set procs, and talent scalings.
            </p>
          </SpotlightCard>

          <SpotlightCard
            spotlightColor="#22d3ee"
            intensity={0.22}
            spotlightSize={250}
            borderGlow={0.85}
            className="!p-5 !rounded-2xl backdrop-blur-md transition-colors"
            style={
              {
                '--spotlight-card-surface': 'rgba(13, 17, 26, 0.55)',
                '--spotlight-card-border': 'rgba(255, 255, 255, 0.08)',
              } as React.CSSProperties
            }
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-black-100 mb-1">Crit Value & Roll Pips</h3>
            <p className="text-xs text-black-400 leading-relaxed">
              Detailed substat efficiency analysis displaying accurate roll counts [●●●○] and CV ratings per artifact.
            </p>
          </SpotlightCard>

          <SpotlightCard
            spotlightColor="#fbbf24"
            intensity={0.22}
            spotlightSize={250}
            borderGlow={0.85}
            className="!p-5 !rounded-2xl backdrop-blur-md transition-colors"
            style={
              {
                '--spotlight-card-surface': 'rgba(13, 17, 26, 0.55)',
                '--spotlight-card-border': 'rgba(255, 255, 255, 0.08)',
              } as React.CSSProperties
            }
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3.5">
              <Trophy className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-black-100 mb-1">Character Leaderboards</h3>
            <p className="text-xs text-black-400 leading-relaxed">
              Compare your showcased characters against global player builds segmented by weapon categories.
            </p>
          </SpotlightCard>
        </div>
      </div>

      {/* Clean Site Footer */}
      <footer className="w-full max-w-6xl px-6 py-8 border-t border-black-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-black-400 z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>© 2026 GENBUILDS. Fan-made tool not affiliated with HoYoverse.</span>
        </div>
        <div className="flex items-center gap-4 text-black-400">
          <Link href="/leaderboard" className="hover:text-black-100 transition-colors">
            Leaderboard
          </Link>
          <a
            href="https://enka.network"
            target="_blank"
            rel="noreferrer"
            className="hover:text-black-100 transition-colors"
          >
            Data: Enka.Network
          </a>
        </div>
      </footer>
    </main>
  );
}
