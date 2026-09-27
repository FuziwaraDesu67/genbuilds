import { notFound } from 'next/navigation';
import ProfileClient from '@/components/profile/ProfileClient';
import { UIDSchema } from '@/lib/enka/types';

interface ProfilePageProps {
  params: {
    uid: string;
  };
}

export async function generateMetadata({ params }: ProfilePageProps) {
  const uid = params.uid;

  return {
    title: `Player ${uid} - AetherRank`,
    description: `View ${uid}'s Genshin Impact character builds and leaderboard rankings.`,
  };
}

export default function ProfilePage({ params }: ProfilePageProps) {
  // Validate UID
  const result = UIDSchema.safeParse(params.uid);

  if (!result.success) {
    notFound();
  }

  return <ProfileClient uid={params.uid} />;
}
