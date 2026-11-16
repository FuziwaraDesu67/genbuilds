import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard, getLeaderboardCount } from '@/lib/db/queries';
import {
  fetchAkashaLeaderboardEntries,
  getLeaderboardCharactersSummary,
} from '@/lib/akasha/leaderboards';
import { calculateEffectiveCv } from '@/lib/utils';
import { CHASCA_BENCHMARK_BUILDS } from '@/lib/akasha/chasca-benchmarks';
import { z } from 'zod';

const querySchema = z.object({
  calculationId: z.string().optional(),
  rankingType: z.enum(['damage', 'overallCv', 'effectiveCv']).optional(),
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
      rankingType,
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
        rankingType,
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

    // 2.5. Dedicated Chasca Benchmark Pool & DB Merging
    if (characterId === 10000104) {
      const benchmarkRows = CHASCA_BENCHMARK_BUILDS.map((bm) => {
        const eff = calculateEffectiveCv({
          stats: { cr: bm.stats.cr, cd: bm.stats.cd },
          artifactSets: bm.artifactSets,
        });

        return {
          rank: 0,
          uid: bm.uid,
          player: {
            nickname: bm.nickname,
            profilePicture: bm.profilePicture,
          },
          build: {
            id: bm.id,
            uid: bm.uid,
            characterId: 10000104,
            characterName: 'Chasca',
            avatarId: 10000104,
            constellation: bm.constellation,
            level: bm.level,
            weapon: bm.weapon,
            weaponId: bm.weapon.id,
            weaponName: bm.weapon.name,
            weaponIcon: bm.weapon.icon,
            refinement: bm.weapon.refinement,
            artifactSets: bm.artifactSets,
            artifactSetList: bm.artifactSetList,
            critValue: bm.critValue,
            effectiveCv: eff.effectiveArtifactCv,
            overallCombatCv: eff.overallCombatCv,
            setBonusCr: eff.effectiveSetBonusCr,
            setBonusName: eff.activeBonusName,
            isCvCapped: eff.isCapped,
            stats: {
              ...bm.stats,
              dmgBonus: {},
            },
            calculatedDamage: String(bm.calculatedDamage),
            damage: bm.calculatedDamage,
            score: bm.calculatedDamage,
          },
          calculation: {
            id: '10000104',
            name: 'Shadows of the Night Winds',
            weapon: bm.weapon.name,
          },
        };
      });

      let combined = [...benchmarkRows] as any[];
      if (process.env.DATABASE_URL) {
        try {
          const dbResults = await getLeaderboard(10000104, {
            weaponId,
            minConstellation,
            limit: 100,
            offset: 0,
          });

          for (const row of dbResults) {
            const rowUid = row.build?.uid || (row as any).player?.uid || (row as any).uid;
            if (rowUid === '855842984') continue;

            const stats = (row.build?.stats as any) || {};
            const cr = Number(stats.cr || 0);
            const cd = Number(stats.cd || 0);
            const artifactSets = (row.build?.artifactSets as any) || {};
            const effResult = calculateEffectiveCv({
              stats: { cr, cd },
              artifactSets,
            });

            const enriched = {
              ...row,
              uid: rowUid,
              build: {
                ...row.build,
                effectiveCv: effResult.effectiveArtifactCv,
                overallCombatCv: effResult.overallCombatCv,
                setBonusCr: effResult.effectiveSetBonusCr,
                setBonusName: effResult.activeBonusName,
                isCvCapped: effResult.isCapped,
              },
            };

            const existingIdx = combined.findIndex((b) => b.uid === rowUid);
            if (existingIdx >= 0) {
              combined[existingIdx] = enriched;
            } else {
              combined.push(enriched);
            }
          }
        } catch {
          // Keep benchmark pool if DB fails or is unreachable
        }
      }

      let filtered = combined.filter((row: any) => {
        if (row.uid === '855842984') return false;
        if (weaponId && row.build?.weapon?.id !== weaponId && row.build?.weaponId !== weaponId) {
          return false;
        }
        if (weaponName) {
          const wName = (row.build?.weapon?.name || row.build?.weaponName || '').toLowerCase();
          if (!wName.includes(weaponName.toLowerCase())) return false;
        }
        if (minConstellation !== undefined && (row.build?.constellation ?? 0) < minConstellation) {
          return false;
        }
        return true;
      });

      if (rankingType === 'overallCv' || rankingType === 'effectiveCv') {
        filtered.sort((a: any, b: any) => {
          const cvB = b.build.overallCombatCv ?? b.build.effectiveCv ?? 0;
          const cvA = a.build.overallCombatCv ?? a.build.effectiveCv ?? 0;
          return cvB - cvA;
        });
      } else {
        filtered.sort((a: any, b: any) => {
          const dmgB = Number(b.build.calculatedDamage || b.build.damage || 0);
          const dmgA = Number(a.build.calculatedDamage || a.build.damage || 0);
          return dmgB - dmgA;
        });
      }

      const total = filtered.length;
      filtered.forEach((e: any, idx: number) => {
        e.rank = idx + 1;
        e.percentile = parseFloat(Math.max(0.01, (e.rank / total) * 100).toFixed(2));
      });

      const paginated = filtered.slice(safeOffset, safeOffset + safeLimit);

      return NextResponse.json({
        results: paginated,
        total,
        limit: safeLimit,
        offset: safeOffset,
        hasMore: safeOffset + safeLimit < total,
        source: 'local',
      });
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

      const enrichedResults = results.map((row: any) => {
        const stats = row.build?.stats || {};
        const cr = Number(stats.cr || 0);
        const cd = Number(stats.cd || 0);
        const artifactSets = row.build?.artifactSets || {};
        const effResult = calculateEffectiveCv({
          stats: { cr, cd },
          artifactSets,
        });

        return {
          ...row,
          build: {
            ...row.build,
            effectiveCv: effResult.effectiveArtifactCv,
            overallCombatCv: effResult.overallCombatCv,
            setBonusCr: effResult.effectiveSetBonusCr,
            setBonusName: effResult.activeBonusName,
            isCvCapped: effResult.isCapped,
          },
        };
      });

      if (rankingType === 'overallCv' || rankingType === 'effectiveCv') {
        enrichedResults.sort((a: any, b: any) => {
          const cvB = b.build.overallCombatCv ?? b.build.effectiveCv ?? 0;
          const cvA = a.build.overallCombatCv ?? a.build.effectiveCv ?? 0;
          return cvB - cvA;
        });
        enrichedResults.forEach((e: any, idx: number) => {
          e.rank = safeOffset + idx + 1;
          e.percentile = parseFloat(Math.max(0.01, (e.rank / (total || enrichedResults.length)) * 100).toFixed(2));
        });
      }

      return NextResponse.json({
        results: enrichedResults,
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
