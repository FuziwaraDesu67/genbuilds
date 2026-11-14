import { Metadata } from 'next';
import { getLeaderboardCharactersSummary } from '@/lib/akasha/leaderboards';
import { LeaderboardDirectoryClient } from '@/components/leaderboard/LeaderboardDirectoryClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Genshin Impact Leaderboards | GENBUILDS',
  description: 'Explore live Akasha.cv character damage leaderboards, categories, and top ranked player builds.',
};

export default async function LeaderboardsPage() {
  const characters = await getLeaderboardCharactersSummary();

  return <LeaderboardDirectoryClient characters={characters} />;
}
