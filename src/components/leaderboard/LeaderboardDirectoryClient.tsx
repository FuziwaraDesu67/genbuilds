'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import BlurText from '@/components/BlurText/BlurText';
import SpotlightCard from '@/components/SpotlightCard/SpotlightCard';
import { ELEMENT_COLORS } from '@/lib/enka/static-data';
import { formatCompactCount } from '@/lib/utils';
import { ElementIcon } from '@/components/ui/element-icons';
import type { Element } from '@/lib/enka/types';
import type { LeaderboardCharacterSummary } from '@/lib/akasha/leaderboards';
import { Search, Users, Trophy } from 'lucide-react';

interface LeaderboardDirectoryClientProps {
  characters: LeaderboardCharacterSummary[];
}

const ELEMENTS: Array<'All' | Element> = [
  'All',
  'Pyro',
  'Hydro',
  'Electro',
  'Cryo',
  'Dendro',
  'Anemo',
  'Geo',
];

function CharacterAvatar({
  characterId,
  name,
  element,
  iconUrl,
  sizeClass,
  initialTextClass,
}: {
  characterId: number;
  name: string;
  element: Element;
  iconUrl?: string;
  sizeClass: string;
  initialTextClass: string;
}) {
  const [fallbackStep, setFallbackStep] = useState(0);
  const colors = ELEMENT_COLORS[element] || ELEMENT_COLORS.Pyro;

  const cleanName = name.replace(/\s+/g, '');
  const activeSrc =
    fallbackStep === 0
      ? iconUrl || `/icons/characters/${characterId}.png`
      : fallbackStep === 1
      ? `https://enka.network/ui/UI_AvatarIcon_${cleanName}.png`
      : null;

  return (
    <div className={`${sizeClass} relative shrink-0`}>
      <div
        className="w-full h-full rounded-full overflow-hidden border-2 flex items-center justify-center bg-slate-950/90"
        style={{ borderColor: `${colors.primary}66` }}
      >
        {activeSrc ? (
          <img
            src={activeSrc}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            onError={() => setFallbackStep((s) => s + 1)}
          />
        ) : (
          <div
            className={`w-full h-full flex items-center justify-center rounded-full text-white font-bold ${initialTextClass}`}
            style={{
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
            }}
          >
            {name.charAt(0)}
          </div>
        )}
      </div>
      <div
        className="absolute -bottom-1 -right-0.5 w-6 h-6 rounded-full flex items-center justify-center bg-gray-950 border border-white/20 shadow-md"
        style={{ color: colors.primary }}
        title={element}
      >
        <ElementIcon element={element} size={13} />
      </div>
    </div>
  );
}

export function LeaderboardDirectoryClient({
  characters,
}: LeaderboardDirectoryClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedElement, setSelectedElement] = useState<'All' | Element>('All');

  const filteredCharacters = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return characters.filter((c) => {
      if (selectedElement !== 'All' && c.element !== selectedElement) return false;
      if (!q) return true;
      if (c.name.toLowerCase().includes(q)) return true;
      return c.categories.some(
        (cat) =>
          cat.name.toLowerCase().includes(q) ||
          cat.short.toLowerCase().includes(q)
      );
    });
  }, [characters, searchQuery, selectedElement]);

  const showFeaturedBanner =
    searchQuery.trim() === '' && selectedElement === 'All' && filteredCharacters.length > 3;

  const featured = showFeaturedBanner ? filteredCharacters.slice(0, 3) : [];
  const directoryList = showFeaturedBanner ? filteredCharacters.slice(3) : filteredCharacters;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
      {/* Header */}
      <div className="bg-white/5 border-b border-white/10 py-6">
        <div className="container mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="sr-only">Genshin Impact Leaderboards</h1>
            <div aria-hidden="true">
              <BlurText
                text="Genshin Impact Leaderboards"
                animateBy="words"
                direction="bottom"
                delay={65}
                trigger="load"
                className="text-3xl font-bold text-white tracking-tight"
              />
            </div>
            <p className="text-white/60 mt-1.5 text-sm">
              Compare real player builds and Akasha combo rankings across{' '}
              <span className="text-cyan-300 font-semibold">{characters.length}</span> characters
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Home
            </Link>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="container mx-auto px-4 pt-6">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white/[0.03] border border-white/10 rounded-xl p-3.5">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search character or leaderboard category..."
              className="w-full pl-10 pr-4 py-2 bg-zinc-900/90 border border-white/15 rounded-lg text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {ELEMENTS.map((el) => {
              const active = selectedElement === el;
              const colors = el !== 'All' ? ELEMENT_COLORS[el] : null;
              return (
                <button
                  key={el}
                  type="button"
                  onClick={() => setSelectedElement(el)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                    active
                      ? 'bg-white/15 text-white border-white/35 shadow-sm'
                      : 'bg-black/30 text-white/60 border-white/10 hover:text-white hover:bg-white/10'
                  }`}
                  style={
                    active && colors
                      ? {
                          borderColor: `${colors.primary}90`,
                          backgroundColor: `${colors.primary}22`,
                          color: '#ffffff',
                        }
                      : undefined
                  }
                >
                  {el !== 'All' && (
                    <span style={{ color: colors?.primary }}>
                      <ElementIcon element={el} size={13} />
                    </span>
                  )}
                  <span>{el}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Leaderboards Grid */}
      <div className="px-4 py-7">
        <div className="container mx-auto">
          {filteredCharacters.length === 0 ? (
            <div className="text-center py-16 bg-white/[0.02] border border-white/10 rounded-2xl">
              <Trophy className="w-8 h-8 text-white/30 mx-auto mb-3" />
              <p className="text-white/70 text-lg font-medium">
                No leaderboards match &ldquo;{searchQuery}&rdquo;
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedElement('All');
                }}
                className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Featured Top 3 Highest-Volume Leaderboards */}
              {featured.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300 mb-3">
                    <Trophy className="w-3.5 h-3.5" />
                    <span>Most Popular Leaderboards</span>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    {featured.map((character) => {
                      const colors = ELEMENT_COLORS[character.element] || ELEMENT_COLORS.Pyro;
                      return (
                        <SpotlightCard
                          key={character.characterId}
                          spotlightColor={colors.primary}
                          intensity={0.22}
                          spotlightSize={290}
                          borderGlow={0.85}
                          className="!p-5 !rounded-xl backdrop-blur-sm transition-transform duration-200 hover:-translate-y-0.5 group"
                          style={
                            {
                              '--spotlight-card-surface': 'rgba(17, 24, 39, 0.78)',
                              '--spotlight-card-border': 'rgba(255, 255, 255, 0.12)',
                            } as React.CSSProperties
                          }
                        >
                          <Link
                            href={`/leaderboard/${character.characterId}?calc=${encodeURIComponent(
                              character.defaultCalculationId
                            )}`}
                            className="flex items-center gap-4"
                          >
                            <CharacterAvatar
                              characterId={character.characterId}
                              name={character.name}
                              element={character.element}
                              iconUrl={character.iconUrl}
                              sizeClass="w-16 h-16"
                              initialTextClass="text-xl"
                            />
                            <div className="min-w-0 flex-1">
                              <h2 className="text-lg font-bold text-white group-hover:text-cyan-200 transition-colors truncate">
                                {character.name}
                              </h2>
                              <p className="text-white/60 text-xs flex items-center gap-2 mt-0.5">
                                <span style={{ color: colors.primary }} className="font-semibold">
                                  {character.element}
                                </span>
                                {character.totalBuilds > 0 && (
                                  <>
                                    <span>•</span>
                                    <span className="inline-flex items-center gap-1 font-mono text-white/75">
                                      <Users className="w-3 h-3" />
                                      {formatCompactCount(character.totalBuilds)} builds
                                    </span>
                                  </>
                                )}
                              </p>
                            </div>
                          </Link>

                          <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap gap-1.5">
                            {character.categories.slice(0, 3).map((cat) => (
                              <Link
                                key={cat.calculationId}
                                href={`/leaderboard/${character.characterId}?calc=${encodeURIComponent(
                                  cat.calculationId
                                )}`}
                                className="px-2 py-1 rounded-md bg-white/[0.06] hover:bg-white/[0.14] border border-white/10 text-[11px] font-semibold text-zinc-200 transition-colors truncate max-w-[160px]"
                                title={cat.name}
                              >
                                {cat.short}
                              </Link>
                            ))}
                          </div>
                        </SpotlightCard>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* All Available Character Leaderboards */}
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-white">
                  {showFeaturedBanner ? 'All Character Leaderboards' : 'Matching Leaderboards'}
                </h2>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                  {directoryList.map((character) => {
                    const colors = ELEMENT_COLORS[character.element] || ELEMENT_COLORS.Pyro;

                    return (
                      <SpotlightCard
                        key={character.characterId}
                        spotlightColor={colors.primary}
                        intensity={0.18}
                        spotlightSize={250}
                        borderGlow={0.75}
                        className="!p-4 !rounded-xl backdrop-blur-sm transition-colors group flex flex-col justify-between"
                        style={
                          {
                            '--spotlight-card-surface': 'rgba(17, 24, 39, 0.68)',
                            '--spotlight-card-border': 'rgba(255, 255, 255, 0.1)',
                          } as React.CSSProperties
                        }
                      >
                        <Link
                          href={`/leaderboard/${character.characterId}?calc=${encodeURIComponent(
                            character.defaultCalculationId
                          )}`}
                          className="flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <CharacterAvatar
                              characterId={character.characterId}
                              name={character.name}
                              element={character.element}
                              iconUrl={character.iconUrl}
                              sizeClass="w-12 h-12"
                              initialTextClass="text-lg"
                            />
                            <div className="min-w-0">
                              <h3 className="text-base font-semibold text-white group-hover:text-cyan-200 transition-colors truncate">
                                {character.name}
                              </h3>
                              <p className="text-white/55 text-xs flex items-center gap-1.5">
                                <span style={{ color: colors.primary }}>{character.element}</span>
                                {character.totalBuilds > 0 && (
                                  <>
                                    <span>•</span>
                                    <span className="font-mono text-white/70">
                                      {formatCompactCount(character.totalBuilds)} builds
                                    </span>
                                  </>
                                )}
                              </p>
                            </div>
                          </div>
                          <span className="text-white/55 group-hover:text-white text-xs font-medium shrink-0 transition-colors">
                            View →
                          </span>
                        </Link>

                        {character.categories.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-white/[0.07] flex flex-wrap gap-1.5">
                            {character.categories.slice(0, 3).map((cat) => (
                              <Link
                                key={cat.calculationId}
                                href={`/leaderboard/${character.characterId}?calc=${encodeURIComponent(
                                  cat.calculationId
                                )}`}
                                className="px-2 py-0.5 rounded bg-black/40 hover:bg-white/10 border border-white/10 text-[10px] font-medium text-zinc-300 truncate max-w-[140px]"
                                title={cat.name}
                              >
                                {cat.short}
                              </Link>
                            ))}
                            {character.categories.length > 3 && (
                              <span className="px-1.5 py-0.5 text-[10px] text-zinc-500 font-mono">
                                +{character.categories.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </SpotlightCard>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-10 pb-8 text-center text-gray-500 text-xs">
        <p>
          Damage leaderboards powered by live Akasha.cv category calculations &amp; local showcase records.
        </p>
      </div>
    </div>
  );
}
