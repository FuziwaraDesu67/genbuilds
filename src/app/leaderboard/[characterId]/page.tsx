import { Metadata } from 'next';
import { getCharacterData } from '@/lib/enka/static-data';
import { getLeaderboardCharactersSummary } from '@/lib/akasha/leaderboards';
import LeaderboardClient from '@/app/leaderboard/LeaderboardClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { characterId: string };
  searchParams?: { calc?: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const characterId = parseInt(params.characterId);
  const local = getCharacterData(characterId);
  const summaries = await getLeaderboardCharactersSummary();
  const matched = summaries.find((s) => s.characterId === characterId);
  const charName = matched?.name || local?.name;

  if (!charName) {
    return {
      title: 'Character Not Found | GENBUILDS',
    };
  }

  return {
    title: `${charName} Leaderboard | GENBUILDS`,
    description: `View the top ${charName} builds and damage rankings in Genshin Impact`,
  };
}

export default async function LeaderboardPage({ params, searchParams }: PageProps) {
  const characterId = parseInt(params.characterId);
  if (isNaN(characterId)) {
    notFound();
  }

  const summaries = await getLeaderboardCharactersSummary();
  const matched = summaries.find((s) => s.characterId === characterId);
  const local = getCharacterData(characterId);

  if (!matched && !local) {
    notFound();
  }

  return (
    <LeaderboardClient
      characterId={characterId}
      characterMeta={
        matched
          ? {
              name: matched.name,
              element: matched.element,
              iconUrl: matched.iconUrl,
              totalBuilds: matched.totalBuilds,
              categories: matched.categories,
              defaultCalculationId: matched.defaultCalculationId,
            }
          : {
              name: local!.name,
              element: local!.element,
              iconUrl: local!.iconUrl,
              totalBuilds: 0,
              categories: [],
              defaultCalculationId: String(characterId),
            }
      }
      initialCalculationId={searchParams?.calc}
    />
  );
}
