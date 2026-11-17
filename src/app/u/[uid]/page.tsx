import { notFound } from 'next/navigation';
import ProfileClient from '@/components/profile/ProfileClient';
import { UIDSchema, type EnkaData } from '@/lib/enka/types';
import { enkaClient, DEMO_FALLBACK_UID, isChascaBenchmarkUid } from '@/lib/enka';
import { enrichEnkaWithAkasha } from '@/lib/akasha/client';

interface ProfilePageProps {
  params: {
    uid: string;
  };
}

export async function generateMetadata({ params }: ProfilePageProps) {
  const uid = params.uid;

  return {
    title: `Player ${uid} - Genbuilds`,
    description: `View ${uid}'s Genshin Impact character builds and leaderboard rankings on Genbuilds.`,
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  // Validate UID
  const result = UIDSchema.safeParse(params.uid);

  if (!result.success) {
    notFound();
  }

  // Pre-fetch initial data during SSR for featured showcase UIDs and benchmark profiles
  // to ensure server HTML contains complete build card markup immediately
  let initialData: EnkaData | undefined;
  if (
    params.uid === DEMO_FALLBACK_UID ||
    params.uid === '855842984' ||
    params.uid === '1818407519' ||
    isChascaBenchmarkUid(params.uid)
  ) {
    try {
      const fetched = await enkaClient.fetchPlayerData(params.uid);
      initialData = await enrichEnkaWithAkasha(fetched);
    } catch (e) {
      console.warn(`[ProfilePage] SSR prefetch failed for ${params.uid}:`, e);
    }
  }

  return <ProfileClient uid={params.uid} initialData={initialData} />;
}
