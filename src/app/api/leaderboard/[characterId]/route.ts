import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard, getLeaderboardCount } from '@/lib/db/queries';
import {
  fetchAkashaLeaderboardEntries,
  getLeaderboardCharactersSummary,
} from '@/lib/akasha/leaderboards';
import { z } from 'zod';

const querySchema = z.object({
  calculationId: z.string().optional(),
  weaponId: z.string().optional().transform((val) => (val ? parseInt(val) : undefined)),
  weaponName: z.string().optional(),
  minConstellation: z.string().optional().transform((val) => (val !== undefined && val !== '' ? parseInt(val) : undefined)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val) : 50)),
  offset: z.string().optional().transform((val) => (val ? parseInt(val) : 0)),
  totalPool: z.string().optional().transform((val) => (val ? parseInt(val) : undefined)),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { characterId: string } }
) {
  try {
    const characterId = parseInt(params.characterId);

    if (isNaN(characterId)) {
      return NextResponse.json(
        { error: 'Invalid character ID' },
        { status: 400 }
      );
    }

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const {
      calculationId,
      weaponId,
      weaponName,
      minConstellation,
      limit,
      offset,
      totalPool,
    } = querySchema.parse(searchParams);

    const safeLimit = Math.min(Math.max(limit || 50, 1), 50);
    const safeOffset = Math.max(offset || 0, 0);
    const page = Math.floor(safeOffset / safeLimit) + 1;

    // 1. Resolve calculationId if omitted
    let resolvedCalcId = calculationId;
    let resolvedPool = totalPool;
    if (!resolvedCalcId || !resolvedPool) {
      const summaries = await getLeaderboardCharactersSummary();
      const charSummary = summaries.find((c) => c.characterId === characterId);
      if (charSummary && charSummary.source === 'akasha') {
        if (!resolvedCalcId) {
          resolvedCalcId = charSummary.defaultCalculationId;
        }
        const matchedCat = charSummary.categories.find(
          (cat) =>
            cat.calculationId === resolvedCalcId ||
            cat.weapons.some((w) => w.calculationId === resolvedCalcId)
        );
        if (!resolvedPool && matchedCat) {
          resolvedPool = matchedCat.count;
        }
      }
    }

    // 2. Try live Akasha.cv leaderboard entries first
    if (resolvedCalcId && !resolvedCalcId.startsWith('local-')) {
      const akashaRes = await fetchAkashaLeaderboardEntries(resolvedCalcId, {
        page,
        limit: safeLimit,
        totalPool: resolvedPool,
        minConstellation,
        weaponName,
      });

      if (akashaRes && (akashaRes.entries.length > 0 || akashaRes.total > 0)) {
        return NextResponse.json({
          results: akashaRes.entries,
          total: akashaRes.total,
          limit: safeLimit,
          offset: safeOffset,
          hasMore: safeOffset + akashaRes.entries.length < akashaRes.total,
          source: 'akasha',
        });
      }
    }

    // 3. Fallback to PostgreSQL database if configured
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        results: [],
        total: 0,
        limit: safeLimit,
        offset: safeOffset,
        hasMore: false,
        source: 'local',
      });
    }

    try {
      const [results, total] = await Promise.all([
        getLeaderboard(characterId, {
          weaponId,
          minConstellation,
          limit: safeLimit,
          offset: safeOffset,
        }),
        getLeaderboardCount(characterId, {
          weaponId,
          minConstellation,
        }),
      ]);

      return NextResponse.json({
        results,
        total,
        limit: safeLimit,
        offset: safeOffset,
        hasMore: safeOffset + safeLimit < total,
        source: 'local',
      });
    } catch (dbErr) {
      console.warn('Database leaderboard unavailable, returning empty fallback:', dbErr);
      return NextResponse.json({
        results: [],
        total: 0,
        limit: safeLimit,
        offset: safeOffset,
        hasMore: false,
        source: 'local',
      });
    }
  } catch (error) {
    console.error('Error fetching leaderboard:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
