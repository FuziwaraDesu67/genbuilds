import { NextRequest, NextResponse } from 'next/server';
import { enkaClient } from '@/lib/enka';
import {
  getCachedEnkaResponse,
  cacheEnkaResponse,
  getCachedEnkaTTL,
  checkRateLimit
} from '@/lib/redis';
import { upsertPlayer, upsertBuild } from '@/lib/db/queries';
import { calculateDamage } from '@/lib/damage-calc';
import { getClientIP } from '@/lib/utils';
import { z } from 'zod';

export async function GET(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    const uid = params.uid;

    // Rate limiting
    const ip = getClientIP(request.headers);
    const rateLimit = await checkRateLimit(ip);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateLimit.resetIn },
        { status: 429, headers: { 'Retry-After': rateLimit.resetIn.toString() } }
      );
    }

    // Check cache first
    const cached = await getCachedEnkaResponse(uid);
    if (cached) {
      const ttl = await getCachedEnkaTTL(uid);
      return NextResponse.json({ ...cached, ttl, fromCache: true });
    }

    // Fetch from Enka
    const enkaData = await enkaClient.fetchPlayerData(uid);

    // Calculate damage for each character
    const charactersWithDamage = enkaData.characters.map(char => {
      const damageCalc = calculateDamage(char);
      return {
        ...char,
        damageCalc,
      };
    });

    // Upsert to database
    await upsertPlayer(enkaData.player);

    for (const char of charactersWithDamage) {
      await upsertBuild(
        uid,
        char,
        char.damageCalc?.totalDamage,
        char.damageCalc
      );
    }

    // Cache the response
    const responseData = {
      ...enkaData,
      characters: charactersWithDamage,
    };

    await cacheEnkaResponse(uid, responseData, enkaData.ttl);

    return NextResponse.json({ ...responseData, fromCache: false });
  } catch (error) {
    console.error('Error fetching player data:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid UID format' },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      // Check if it's an Enka API error
      const enkaError = error as any;
      if (enkaError.code) {
        return NextResponse.json(
          { error: enkaError.message },
          { status: enkaError.code }
        );
      }

      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
