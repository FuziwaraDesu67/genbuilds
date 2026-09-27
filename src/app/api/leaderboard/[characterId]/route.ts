import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard, getLeaderboardCount } from '@/lib/db/queries';
import { z } from 'zod';

const querySchema = z.object({
  weaponId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  minConstellation: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 50),
  offset: z.string().optional().transform(val => val ? parseInt(val) : 0),
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

    // Parse query params
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const { weaponId, minConstellation, limit, offset } = querySchema.parse(searchParams);

    // Fetch leaderboard
    const results = await getLeaderboard(characterId, {
      weaponId,
      minConstellation,
      limit,
      offset,
    });

    // Get total count for pagination
    const total = await getLeaderboardCount(characterId, {
      weaponId,
      minConstellation,
    });

    return NextResponse.json({
      results,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    });
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
