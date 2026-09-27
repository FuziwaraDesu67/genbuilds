import { db } from './index';
import { players, builds, type NewPlayer, type NewBuild } from './schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import type { Character, PlayerInfo } from '../enka/types';

// Upsert player data
export async function upsertPlayer(playerInfo: PlayerInfo) {
  const player: NewPlayer = {
    uid: playerInfo.uid,
    nickname: playerInfo.nickname,
    ar: playerInfo.level,
    signature: playerInfo.signature,
    namecardId: playerInfo.nameCardId,
  };

  await db
    .insert(players)
    .values(player)
    .onConflictDoUpdate({
      target: players.uid,
      set: {
        nickname: player.nickname,
        ar: player.ar,
        signature: player.signature,
        namecardId: player.namecardId,
        updatedAt: sql`NOW()`,
      },
    });
}

// Upsert build data
export async function upsertBuild(
  uid: string,
  character: Character,
  calculatedDamage?: number,
  calcDetails?: any
) {
  const build: NewBuild = {
    uid,
    avatarId: character.id,
    weaponId: character.weapon.id,
    artifactSets: character.artifactSets,
    stats: character.stats,
    talentLevels: character.talents,
    constellation: character.constellation,
    calculatedDamage: calculatedDamage?.toString(),
    calcDetails,
  };

  await db
    .insert(builds)
    .values(build)
    .onConflictDoUpdate({
      target: [builds.uid, builds.avatarId],
      set: {
        weaponId: build.weaponId,
        artifactSets: build.artifactSets,
        stats: build.stats,
        talentLevels: build.talentLevels,
        constellation: build.constellation,
        calculatedDamage: build.calculatedDamage,
        calcDetails: build.calcDetails,
        updatedAt: sql`NOW()`,
      },
    });
}

// Get leaderboard for a character
export async function getLeaderboard(
  avatarId: number,
  options: {
    weaponId?: number;
    minConstellation?: number;
    limit?: number;
    offset?: number;
  } = {}
) {
  const { weaponId, minConstellation, limit = 50, offset = 0 } = options;

  let query = db
    .select({
      build: builds,
      player: players,
      rank: sql<number>`ROW_NUMBER() OVER (ORDER BY ${builds.calculatedDamage} DESC)`.as('rank'),
      percentile: sql<number>`PERCENT_RANK() OVER (ORDER BY ${builds.calculatedDamage} DESC) * 100`.as('percentile'),
    })
    .from(builds)
    .innerJoin(players, eq(builds.uid, players.uid))
    .where(eq(builds.avatarId, avatarId))
    .$dynamic();

  if (weaponId) {
    query = query.where(eq(builds.weaponId, weaponId));
  }

  if (minConstellation !== undefined) {
    query = query.where(sql`${builds.constellation} >= ${minConstellation}`);
  }

  const results = await query
    .orderBy(desc(builds.calculatedDamage))
    .limit(limit)
    .offset(offset);

  return results;
}

// Get total count for a character (for pagination)
export async function getLeaderboardCount(
  avatarId: number,
  options: {
    weaponId?: number;
    minConstellation?: number;
  } = {}
) {
  const { weaponId, minConstellation } = options;

  let query = db
    .select({ count: sql<number>`COUNT(*)` })
    .from(builds)
    .where(eq(builds.avatarId, avatarId))
    .$dynamic();

  if (weaponId) {
    query = query.where(eq(builds.weaponId, weaponId));
  }

  if (minConstellation !== undefined) {
    query = query.where(sql`${builds.constellation} >= ${minConstellation}`);
  }

  const result = await query;
  return result[0]?.count || 0;
}

// Get builds for a specific UID
export async function getBuildsByUID(uid: string) {
  return await db
    .select()
    .from(builds)
    .where(eq(builds.uid, uid))
    .orderBy(desc(builds.calculatedDamage));
}

// Get player rank for a specific character
export async function getPlayerRank(uid: string, avatarId: number) {
  const result = await db
    .select({
      rank: sql<number>`ROW_NUMBER() OVER (ORDER BY ${builds.calculatedDamage} DESC)`,
      percentile: sql<number>`PERCENT_RANK() OVER (ORDER BY ${builds.calculatedDamage} DESC) * 100`,
    })
    .from(builds)
    .where(and(eq(builds.uid, uid), eq(builds.avatarId, avatarId)));

  return result[0] || null;
}

// Get top N characters across all players (for homepage featured section)
export async function getTopBuilds(limit: number = 10) {
  return await db
    .select({
      build: builds,
      player: players,
    })
    .from(builds)
    .innerJoin(players, eq(builds.uid, players.uid))
    .orderBy(desc(builds.calculatedDamage))
    .limit(limit);
}
