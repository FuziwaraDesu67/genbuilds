import { Metadata } from 'next';
import { getCharacterData } from '@/lib/enka/static-data';
import LeaderboardClient from '@/app/leaderboard/LeaderboardClient';
import { notFound } from 'next/navigation';
import { getConfiguredCharacters } from '@/lib/damage-calc/configs';

interface PageProps {
  params: { characterId: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const characterId = parseInt(params.characterId);
  const character = getCharacterData(characterId);

  if (!character) {
    return {
      title: 'Character Not Found',
    };
  }

  return {
    title: `${character.name!} Leaderboard | Genshin Leaderboard`,
    description: `View the top ${character.name!} builds and damage rankings in Genshin Impact`,
  };
}

export default function LeaderboardPage({ params }: PageProps) {
  const characterId = parseInt(params.characterId);
  const character = getCharacterData(characterId);
  const configuredCharacters = getConfiguredCharacters();

  if (!character) {
    notFound();
  }

  // Check if this character has damage calculation configured
  const hasConfig = configuredCharacters.includes(characterId);

  if (!hasConfig) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">{character.name}</h1>
            <p className="text-white/60 text-lg">
              Damage calculation is not yet configured for this character.
            </p>
            <p className="text-white/40 mt-2">
              Only the following characters are currently supported for leaderboards.
            </p>
            <div className="mt-8">
              <a
                href="/leaderboard"
                className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                View Available Characters
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <LeaderboardClient characterId={characterId} />;
}
