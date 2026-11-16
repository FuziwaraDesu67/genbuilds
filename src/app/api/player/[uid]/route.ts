import { NextRequest, NextResponse } from 'next/server';
import {
  enkaClient,
  getVaresaMockData,
  getShowcase855842984Data,
  getChascaBenchmarkEnkaData,
  isChascaBenchmarkUid,
  DEMO_FALLBACK_UID,
} from '@/lib/enka';
import {
  getCachedEnkaResponse,
  cacheEnkaResponse,
  getCachedEnkaTTL,
  checkRateLimit,
  getStaleEnkaResponse,
} from '@/lib/redis';
import { upsertPlayer, upsertBuild, getPlayerRank, getLeaderboardCount } from '@/lib/db/queries';
import { calculateDamage } from '@/lib/damage-calc';
import { enrichEnkaWithAkasha } from '@/lib/akasha/client';
import { resolveWeaponName } from '@/lib/enka/weapon-data';
import type { EnkaData } from '@/lib/enka/types';
import { getClientIP } from '@/lib/utils';
import { z } from 'zod';

export async function GET(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  const uid = params.uid;

  try {
    // Rate limiting (exempt demo UID 1813164100 and benchmark showcase UIDs)
    if (uid !== DEMO_FALLBACK_UID && !isChascaBenchmarkUid(uid)) {
      const ip = getClientIP(request.headers);
      const rateLimit = await checkRateLimit(ip);

      if (!rateLimit.allowed) {
        return NextResponse.json(
          { error: 'Rate limit exceeded', retryAfter: rateLimit.resetIn },
          { status: 429, headers: { 'Retry-After': rateLimit.resetIn.toString() } }
        );
      }
    }

    // Check cache first (and heal any stale "Weapon <id>" placeholders from newly registered weapons)
    const cached = (await getCachedEnkaResponse(uid)) as EnkaData | null;
    if (cached) {
      const ttl = await getCachedEnkaTTL(uid);
      const characters = Array.isArray(cached.characters)
        ? cached.characters.map((char) =>
            char?.weapon
              ? {
                  ...char,
                  weapon: {
                    ...char.weapon,
                    name: resolveWeaponName(char.weapon.id, char.weapon.name),
                  },
                }
              : char
          )
        : cached.characters;
      return NextResponse.json({ ...cached, characters, ttl, fromCache: true });
    }

    // Fetch from Enka & enrich with live Akasha leaderboard calculations
    const rawEnkaData = await enkaClient.fetchPlayerData(uid);
    const enkaData = await enrichEnkaWithAkasha(rawEnkaData);

    // Calculate damage for each character
    const charactersWithDamage = enkaData.characters.map(char => {
      const damageCalc = calculateDamage(char);
      return {
        ...char,
        damageCalc,
      };
    });

    // Upsert to database in parallel and fill local rank fallback when Akasha rank is unavailable
    try {
      await Promise.race([
        (async () => {
          await upsertPlayer(enkaData.player);
          await Promise.all(
            charactersWithDamage.map(async (char) => {
              await upsertBuild(uid, char, char.damageCalc?.totalDamage, char.damageCalc);

              if ((!char.akasha || char.akasha.ranking <= 0) && char.damageCalc?.totalDamage) {
                const [localRank, localTotal] = await Promise.all([
                  getPlayerRank(uid, char.id),
                  getLeaderboardCount(char.id),
                ]);
                if (localRank && localTotal > 0) {
                  const rankNum = Number(localRank.rank) || 1;
                  char.akasha = {
                    ...(char.akasha || {}),
                    calculationId: char.akasha?.calculationId || `local-${char.id}`,
                    category: char.akasha?.category || `${char.element.toUpperCase()} DMG`,
                    ranking: rankNum,
                    outOf: localTotal,
                    topPercent: parseFloat(((rankNum / localTotal) * 100).toFixed(2)),
                    result: char.damageCalc.totalDamage,
                    source: 'local',
                  };
                }
              }
            })
          );
        })(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('DB sync timeout')), 2500)),
      ]);
    } catch (dbError) {
      console.error('Failed to upsert player/build to database:', dbError);
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

    // 1. Resilient Stale-If-Error: serve previous successful response if Enka has temporary outages
    try {
      const staleData = await getStaleEnkaResponse<EnkaData>(uid);
      if (staleData) {
        console.warn(`[API] Enka fetch failed for ${uid}; serving stale cache snapshot:`, (error as any)?.message || error);
        return NextResponse.json({
          ...staleData,
          fromCache: true,
          isStale: true,
        });
      }
    } catch (staleErr) {
      console.warn('[API] Stale cache lookup failed:', staleErr);
    }

    // 2. Secondary defense-in-depth: guarantee valid data for featured demo UIDs
    if (uid === DEMO_FALLBACK_UID) {
      try {
        const fallbackData = getVaresaMockData();
        return NextResponse.json({
          ...fallbackData,
          fromCache: false,
          fallback: true,
        });
      } catch (fallbackError) {
        console.error('Mock fallback resolution failed:', fallbackError);
      }
    }

    if (uid === '855842984') {
      try {
        const fallbackData = getShowcase855842984Data();
        return NextResponse.json({
          ...fallbackData,
          fromCache: false,
          fallback: true,
        });
      } catch (fallbackError) {
        console.error('Showcase snapshot resolution failed:', fallbackError);
      }
    }

    // 3. Structured validation & error reporting
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid UID format' },
        { status: 400 }
      );
    }

    const errCode = (error as any)?.code || (error as any)?.status;
    const errMsg = (error as any)?.message || (error instanceof Error ? error.message : null);

    if (errCode && errMsg) {
      const statusCode = typeof errCode === 'number' && errCode >= 400 && errCode < 600 ? errCode : 500;
      return NextResponse.json(
        { error: errMsg },
        { status: statusCode }
      );
    }

    return NextResponse.json(
      { error: errMsg || 'Enka.Network service error. Please try again in a few moments.' },
      { status: 500 }
    );
  }
}
