import { Metadata } from 'next';
import { getCharacterData } from '@/lib/enka/static-data';
import Link from 'next/link';
import { getConfiguredCharacters } from '@/lib/damage-calc/configs';

export const metadata: Metadata = {
  title: 'Genshin Impact Leaderboards | AetherRank',
  description: 'View damage leaderboards for Genshin Impact characters',
};

export default function LeaderboardsPage() {
  const configuredCharacterIds = getConfiguredCharacters();
  const characters = configuredCharacterIds
    .map(id => ({
      id,
      ...getCharacterData(id),
    }))
    .filter((char): char is NonNullable<typeof char> => char !== null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
      {/* Header */}
      <div className="bg-white/5 border-b border-white/10 py-6">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Genshin Impact Leaderboards
            </h1>
            <p className="text-white/60 mt-2">
              Compare builds and damage rankings across characters
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              Home
            </Link>
          </div>
        </div>
      </div>

      {/* Characters Grid */}
      <div className="px-6 py-8">
        <div className="container mx-auto px-4">
          {characters.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/60 text-lg">
                No characters have damage calculation configured yet.
              </p>
              <p className="text-white/40 mt-2">
                Check back soon as we add more characters!
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {/* Featured characters (first 3) */}
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                {characters.slice(0, 3).map(character => {
                  // Skip if character data is incomplete
                  if (!character.name || !character.weaponType || !character.element) return null;

                  return (
                    <Link
                      key={character.name}
                      href={`/leaderboard/${character.id}`}
                      className="group"
                    >
                      <div
                        className="bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-xl p-6 transition-all border border-white/10 hover:border-white/20"
                      >
                        <div className="flex items-center gap-4">
                          {/* Character Icon */}
                          <div className="w-20 h-20 relative">
                            <div className="w-full h-full rounded-full bg-white/10 overflow-hidden border-2 border-white/20">
                              {/* In a real app, we'd use next/image with the icon URL */}
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 rounded-full text-white text-xl font-bold">
                                {character.name.charAt(0)}
                              </div>
                            </div>
                            {/* Element Badge */}
                            <div className="absolute -bottom-1 -right-0 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-xs font-bold text-white border-2 border-gray-900">
                              {getElementInitial(character.element)}
                            </div>
                          </div>

                          <div>
                            <h2 className="text-xl font-semibold text-white group-hover:text-purple-300 transition-colors">
                              {character.name}
                            </h2>
                            <p className="text-white/50 text-sm">
                              {character.weaponType} • {character.element}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="flex items-center gap-2 text-white/60 text-sm">
                            <span>⭐</span>
                            <span>Damage Leaderboard</span>
                          </div>
                          <p className="mt-2 text-white/40 text-sm">
                            View top builds and damage rankings
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                }).filter(Boolean)}
              </div>

              {/* All characters list */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white mb-4">
                  All Available Leaderboards
                </h2>
                <div className="grid gap-3">
                  {characters.slice(3).map(character => {
                    // Skip if character data is incomplete
                    if (!character.name || !character.weaponType || !character.element) return null;

                    return (
                      <Link
                        key={character.name}
                        href={`/leaderboard/${character.id}`}
                        className="group"
                      >
                        <div
                          className="bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-lg p-4 transition-all border border-white/10 hover:border-white/20"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {/* Character Icon */}
                              <div className="w-12 h-12 relative">
                                <div className="w-full h-full rounded-full bg-white/10 overflow-hidden border-2 border-white/20">
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 rounded-full text-white text-lg font-bold">
                                    {character.name.charAt(0)}
                                  </div>
                                </div>
                                {/* Element Badge */}
                                <div className="absolute -bottom-1 -right-0 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-xs font-bold text-white border-2 border-gray-900">
                                  {getElementInitial(character.element)}
                                </div>
                              </div>

                              <div>
                                <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">
                                  {character.name}
                                </h3>
                                <p className="text-white/50 text-sm">
                                  {character.weaponType} • {character.element}
                                </p>
                              </div>
                            </div>
                            <span className="text-white/60 text-sm">
                              View Leaderboard
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  }).filter(Boolean)}
                </div>
              </div>
            </div>
          )}
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

// Helper function to get element initial
function getElementInitial(element: string): string {
  const map: Record<string, string> = {
    Pyro: 'P',
    Hydro: 'H',
    Electro: 'E',
    Cryo: 'C',
    Dendro: 'D',
    Anemo: 'A',
    Geo: 'G',
  };
  return map[element] || '?';
}