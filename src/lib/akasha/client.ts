import type {
  AkashaBenchmarkStats,
  AkashaCharacterData,
  AkashaTeammate,
  Element,
  EnkaData,
} from '../enka/types';
import { GAME_CHARACTERS, getCharacterIconPath } from '../enka/game-data.generated';
import { cacheKeys, getCachedJson, setCachedJson } from '../redis';
import { getServerRegion } from '../utils';
import { getLeaderboard } from '../db/queries';
import { fetchAkashaLeaderboardCategories } from './leaderboards';

const AKASHA_BASE_URL = 'https://akasha.cv/api';
const BENCHMARK_TTL_SECONDS = 3600; // 1 hour

function isOfflineOrTestEnv(): boolean {
  return (
    process.env.NODE_ENV === 'test' ||
    process.env.VITEST === 'true' ||
    process.env.ENKA_OFFLINE === 'true' ||
    process.env.OFFLINE_MODE === 'true'
  );
}

async function fetchJsonSafe<T>(url: string, timeoutMs: number = 3500): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 GenshinLeaderboard/1.0',
        Accept: 'application/json',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return null;

    return (await res.json()) as T;
  } catch {
    return null;
  }
}

interface CharacterAliasEntry {
  alias: string;
  id: number;
  name: string;
}

const CHARACTER_ALIAS_INDEX: CharacterAliasEntry[] = (() => {
  const entries: CharacterAliasEntry[] = [];
  const seen = new Set<string>();

  const add = (alias: string, id: number, name: string) => {
    const norm = alias.toLowerCase();
    if (!norm || seen.has(norm) || !GAME_CHARACTERS[id]) return;
    seen.add(norm);
    entries.push({ alias: norm, id, name });
  };

  for (const [idStr, meta] of Object.entries(GAME_CHARACTERS)) {
    const id = Number(idStr);
    // Skip duplicate Traveler variants except canonical name match
    if (meta.name === 'Traveler') continue;
    add(meta.name, id, meta.name);
    const parts = meta.name.split(/\s+/);
    if (parts.length > 1) {
      // Common Inazuma / Liyue surname-first short names (e.g. "Kamisato Ayaka" -> "Ayaka", "Yae Miko" -> "Yae")
      const last = parts[parts.length - 1];
      const first = parts[0];
      if (last.length >= 4 && last !== 'Shogun') add(last, id, meta.name);
      if (first.length >= 4 && ['Yae', 'Raiden'].includes(first)) add(first, id, meta.name);
    }
  }

  // Common Akasha short-hand overrides (ordered & explicit)
  add('yae', 10000058, 'Yae Miko');
  add('raiden', 10000052, 'Raiden Shogun');
  add('kazuha', 10000047, 'Kaedehara Kazuha');
  add('kokomi', 10000054, 'Sangonomiya Kokomi');
  add('ayaka', 10000002, 'Kamisato Ayaka');
  add('ayato', 10000066, 'Kamisato Ayato');
  add('sara', 10000056, 'Kujou Sara');
  add('shinobu', 10000065, 'Kuki Shinobu');
  add('heizou', 10000059, 'Shikanoin Heizou');
  add('itto', 10000057, 'Arataki Itto');
  add('childe', 10000033, 'Tartaglia');

  // Match longer full names before short tokens (e.g. "Yae Miko" before "Yae")
  entries.sort((a, b) => b.alias.length - a.alias.length);
  return entries;
})();

/**
 * Extract structured teammate portraits from Akasha calculation details text
 * (e.g. "C0 Mavuika + C0R5 TTDS Citlali ... + C0R1 Xilonen ... + C6R1 Aquila Bennett...").
 */
export function extractTeammatesFromDetails(
  details: string | undefined,
  mainCharId: number,
  mainCharName: string
): AkashaTeammate[] {
  const team: AkashaTeammate[] = [
    {
      id: mainCharId,
      name: mainCharName,
      icon: getCharacterIconPath(mainCharId),
    },
  ];
  if (!details || typeof details !== 'string') return team;

  // Focus on the party setup sentence before "Combo:" / "See " / hit breakdown
  const setupSlice = details.split(/\b(?:Combo:|See |Hits?:|\d+\s*(?:E|Q|CA|N\d)\s+hits)/i)[0] || details;
  const firstSentence = setupSlice.split(/\.\s+/)[0] || setupSlice;

  // Track earliest token offset per matched character so team order matches Akasha string
  const found: Array<{ pos: number; id: number; name: string }> = [];
  const usedIds = new Set<number>([mainCharId]);
  const occupiedRanges: Array<[number, number]> = [];

  for (const entry of CHARACTER_ALIAS_INDEX) {
    if (usedIds.has(entry.id)) continue;
    const escaped = entry.alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?:^|[^a-zA-Z])${escaped}(?:$|[^a-zA-Z])`, 'i');
    const match = regex.exec(firstSentence);
    if (!match) continue;

    const start = match.index + (match[0].length - entry.alias.length > 0 && !firstSentence.slice(match.index).toLowerCase().startsWith(entry.alias) ? 1 : 0);
    const end = start + entry.alias.length;
    const overlaps = occupiedRanges.some(([s, e]) => !(end <= s || start >= e));
    if (overlaps) continue;

    occupiedRanges.push([start, end]);
    usedIds.add(entry.id);
    found.push({ pos: start, id: entry.id, name: entry.name });
  }

  found.sort((a, b) => a.pos - b.pos);
  for (const member of found) {
    if (team.length >= 4) break;
    team.push({
      id: member.id,
      name: member.name,
      icon: getCharacterIconPath(member.id),
    });
  }

  // Detect elemental flex slots like "Cryo Flex" / "Pyro Flex" / "Geo Flex" when < 4 teammates
  if (team.length < 4) {
    const flexMatch = firstSentence.match(/\b(Pyro|Hydro|Electro|Cryo|Dendro|Anemo|Geo)\s+Flex\b/i);
    if (flexMatch) {
      const elRaw = flexMatch[1];
      const flexEl = (elRaw.charAt(0).toUpperCase() + elRaw.slice(1).toLowerCase()) as Element;
      team.push({
        name: `${flexEl} Flex`,
        icon: '',
        flexElement: flexEl,
      });
    }
  }

  return team;
}

const ELEMENT_DMG_STAT_KEY: Record<Element, string> = {
  Pyro: 'pyroDamageBonus',
  Hydro: 'hydroDamageBonus',
  Electro: 'electroDamageBonus',
  Cryo: 'cryoDamageBonus',
  Dendro: 'dendroDamageBonus',
  Anemo: 'anemoDamageBonus',
  Geo: 'geoDamageBonus',
};

const DMG_BONUS_FIELDS: Array<{ apiKey: string; label: string }> = [
  { apiKey: 'pyroDamageBonus', label: 'Pyro DMG' },
  { apiKey: 'hydroDamageBonus', label: 'Hydro DMG' },
  { apiKey: 'electroDamageBonus', label: 'Electro DMG' },
  { apiKey: 'cryoDamageBonus', label: 'Cryo DMG' },
  { apiKey: 'dendroDamageBonus', label: 'Dendro DMG' },
  { apiKey: 'anemoDamageBonus', label: 'Anemo DMG' },
  { apiKey: 'geoDamageBonus', label: 'Geo DMG' },
  { apiKey: 'physicalDamageBonus', label: 'Physical DMG' },
];

function extractRawStatNumber(entry: any, key: string): number {
  const val = entry?.[key];
  const raw = typeof val === 'object' && val !== null ? val.value : val;
  const num = Number(raw);
  return Number.isFinite(num) ? num : 0;
}

function readAkashaStat(stats: Record<string, any> | undefined, key: string, isRatio: boolean): number {
  const raw = extractRawStatNumber(stats, key);
  if (!raw) return 0;
  if (!isRatio) return raw;
  // Akasha stores ratio stats (CR, CD, ER, Elemental DMG) as decimals (e.g. 0.603 -> 60.3%, 2.64 -> 264%)
  return raw <= 15 ? raw * 100 : raw;
}

function parseAkashaStatsBlock(
  stats: Record<string, any> | undefined,
  preferredElement: Element,
  sampleSize: number = 1,
  sourceLabel?: string
): AkashaBenchmarkStats | undefined {
  if (!stats || typeof stats !== 'object') return undefined;

  const hp = extractRawStatNumber(stats, 'maxHp');
  const atk = extractRawStatNumber(stats, 'atk');
  const def = extractRawStatNumber(stats, 'def');
  if (hp <= 0 && atk <= 0) return undefined;

  const em = extractRawStatNumber(stats, 'elementalMastery');
  const er = readAkashaStat(stats, 'energyRecharge', true) || 100;
  const cr = readAkashaStat(stats, 'critRate', true);
  const cd = readAkashaStat(stats, 'critDamage', true);

  let dmgBonus = 0;
  let dmgBonusKey: string | undefined;
  const preferredApiKey = ELEMENT_DMG_STAT_KEY[preferredElement] || 'pyroDamageBonus';
  const preferredVal = readAkashaStat(stats, preferredApiKey, true);
  if (preferredVal > 0.1) {
    dmgBonus = preferredVal;
    dmgBonusKey = preferredApiKey;
  } else {
    for (const field of DMG_BONUS_FIELDS) {
      const val = readAkashaStat(stats, field.apiKey, true);
      if (val > dmgBonus && val > 0.1) {
        dmgBonus = val;
        dmgBonusKey = field.apiKey;
      }
    }
  }

  return {
    hp: parseFloat(hp.toFixed(1)),
    atk: parseFloat(atk.toFixed(1)),
    def: parseFloat(def.toFixed(1)),
    em: parseFloat(em.toFixed(1)),
    er: parseFloat(er.toFixed(1)),
    dmgBonus: parseFloat(dmgBonus.toFixed(1)),
    dmgBonusKey,
    cr: parseFloat(cr.toFixed(1)),
    cd: parseFloat(cd.toFixed(1)),
    sampleSize,
    sourceLabel,
  };
}

/**
 * Fetch and cache the Top 1% leaderboard builds' average stats for a calculationId,
 * using Akasha's exact /api/charts/calculations endpoint first and falling back to top rows.
 */
async function fetchLeaderboardBenchmark(
  calculationId: string,
  element: Element
): Promise<AkashaBenchmarkStats | undefined> {
  if (!calculationId) return undefined;

  const cacheKey = cacheKeys.akashaBenchmark(`v2:${calculationId}:${element.toLowerCase()}`);
  const cached = await getCachedJson<AkashaBenchmarkStats>(cacheKey);
  if (cached) return cached;

  // 1. Primary: Official Akasha Top 1% Avg chart distribution bucket
  const chartPayload = await fetchJsonSafe<{ data?: Array<{ avgStats?: Record<string, any> }> }>(
    `${AKASHA_BASE_URL}/charts/calculations/${encodeURIComponent(calculationId)}`,
    3500
  );
  const top1AvgRaw = chartPayload?.data?.[0]?.avgStats;
  const fromChart = parseAkashaStatsBlock(top1AvgRaw, element, 1, 'TOP 1% AVG');
  if (fromChart) {
    await setCachedJson(cacheKey, fromChart, BENCHMARK_TTL_SECONDS);
    return fromChart;
  }

  // 2. Fallback: Average top 20 leaderboard builds directly
  const url = `${AKASHA_BASE_URL}/leaderboards?calculationId=${encodeURIComponent(
    calculationId
  )}&sort=calculation.result&order=-1&size=20&page=1`;

  const payload = await fetchJsonSafe<{ data?: Array<{ stats?: Record<string, any> }> }>(url, 3500);
  const rows = (payload?.data || []).filter((r) => r?.stats);
  if (rows.length === 0) return undefined;

  const dmgKey = ELEMENT_DMG_STAT_KEY[element] || 'pyroDamageBonus';
  let hp = 0, atk = 0, def = 0, em = 0, er = 0, dmgBonus = 0, cr = 0, cd = 0;

  for (const row of rows) {
    const s = row.stats!;
    hp += readAkashaStat(s, 'maxHp', false);
    atk += readAkashaStat(s, 'atk', false);
    def += readAkashaStat(s, 'def', false);
    em += readAkashaStat(s, 'elementalMastery', false);
    er += readAkashaStat(s, 'energyRecharge', true);
    dmgBonus += Math.max(
      readAkashaStat(s, dmgKey, true),
      readAkashaStat(s, 'physicalDamageBonus', true)
    );
    cr += readAkashaStat(s, 'critRate', true);
    cd += readAkashaStat(s, 'critDamage', true);
  }

  const n = rows.length;
  const benchmark: AkashaBenchmarkStats = {
    hp: Math.round(hp / n),
    atk: Math.round(atk / n),
    def: Math.round(def / n),
    em: Math.round(em / n),
    er: parseFloat((er / n).toFixed(1)),
    dmgBonus: parseFloat((dmgBonus / n).toFixed(1)),
    dmgBonusKey: dmgBonus / n > 0.1 ? dmgKey : undefined,
    cr: parseFloat((cr / n).toFixed(1)),
    cd: parseFloat((cd / n).toFixed(1)),
    sampleSize: n,
    sourceLabel: 'TOP 1% AVG',
  };

  await setCachedJson(cacheKey, benchmark, BENCHMARK_TTL_SECONDS);
  return benchmark;
}

/**
 * Fallback benchmark computed from real community builds saved in local PostgreSQL DB
 * for characters without an official Akasha leaderboard (e.g. Chevreuse, Vesna, etc.).
 */
async function fetchLocalCommunityBenchmark(
  characterId: number,
  element: Element
): Promise<AkashaBenchmarkStats | undefined> {
  try {
    const rows = await Promise.race([
      getLeaderboard(characterId, { limit: 25 }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('DB benchmark timeout')), 800)),
    ]);
    if (!Array.isArray(rows) || rows.length === 0) return undefined;

    const elemKey = element.toLowerCase();
    let hp = 0, atk = 0, def = 0, em = 0, er = 0, cr = 0, cd = 0, dmgBonus = 0;
    let validCount = 0;

    for (const row of rows) {
      const s = row?.build?.stats as any;
      if (!s || (Number(s.hp || 0) <= 0 && Number(s.atk || 0) <= 0)) continue;
      validCount++;
      hp += Number(s.hp) || 0;
      atk += Number(s.atk) || 0;
      def += Number(s.def) || 0;
      em += Number(s.em) || 0;
      er += Number(s.er) || 100;
      cr += Number(s.cr) || 0;
      cd += Number(s.cd) || 0;
      const elemDmg = Number(s.dmgBonus?.[elemKey] ?? 0);
      const physDmg = Number(s.dmgBonus?.physical ?? 0);
      dmgBonus += Math.max(elemDmg, physDmg);
    }

    if (validCount === 0) return undefined;

    return {
      hp: Math.round(hp / validCount),
      atk: Math.round(atk / validCount),
      def: Math.round(def / validCount),
      em: Math.round(em / validCount),
      er: parseFloat((er / validCount).toFixed(1)),
      dmgBonus: parseFloat((dmgBonus / validCount).toFixed(1)),
      cr: parseFloat((cr / validCount).toFixed(1)),
      cd: parseFloat((cd / validCount).toFixed(1)),
      sampleSize: validCount,
      sourceLabel: validCount === 1 ? 'BUILD BENCHMARK' : 'PLAYERS AVG',
    };
  } catch {
    return undefined;
  }
}

/**
 * Enrich EnkaData with live per-player metadata and character leaderboard calculations from Akasha.cv.
 * Fails open smoothly when offline, in tests, or if a player/character is unranked on Akasha.
 */
export async function enrichEnkaWithAkasha(enkaData: EnkaData): Promise<EnkaData> {
  if (isOfflineOrTestEnv() || !enkaData?.player?.uid) {
    return enkaData;
  }

  const uid = enkaData.player.uid;

  try {
    const [akUser, akCalcs, akBuilds, akCategories] = await Promise.all([
      fetchJsonSafe<any>(`${AKASHA_BASE_URL}/user/${uid}`, 3000),
      fetchJsonSafe<any>(`${AKASHA_BASE_URL}/getCalculationsForUser/${uid}`, 3500),
      fetchJsonSafe<any>(`${AKASHA_BASE_URL}/builds/?uid=${uid}`, 3500),
      fetchAkashaLeaderboardCategories(),
    ]);

    // Enrich player metadata only where Enka omitted it (keep Enka's fresher live values)
    const account = akUser?.data?.account;
    const akInfo = account?.playerInfo;
    if (account || akInfo) {
      if (typeof account?.lastProfileUpdate === 'number') {
        enkaData.akashaUpdatedAt = account.lastProfileUpdate;
      }
      enkaData.player.region = getServerRegion(uid, enkaData.player.region || akInfo?.region);
      if (!enkaData.player.profilePicture && typeof account?.profilePictureLink === 'string') {
        enkaData.player.profilePicture = account.profilePictureLink;
      }
      if (typeof account?.nameCardLink === 'string' && account.nameCardLink.startsWith('http')) {
        enkaData.player.nameCardUrl = account.nameCardLink;
      }
      if (enkaData.player.finishAchievementNum === undefined && typeof akInfo?.finishAchievementNum === 'number') {
        enkaData.player.finishAchievementNum = Math.round(akInfo.finishAchievementNum);
      }
      if (enkaData.player.towerStarIndex === undefined && typeof akInfo?.towerStarIndex === 'number') {
        enkaData.player.towerStarIndex = akInfo.towerStarIndex;
      }
      if (enkaData.player.theaterActIndex === undefined && typeof akInfo?.theater?.act === 'number') {
        enkaData.player.theaterActIndex = akInfo.theater.act;
        enkaData.player.theaterStarIndex = typeof akInfo.theater.stars === 'number' ? akInfo.theater.stars : 0;
      }
      if (enkaData.player.stygianSeconds === undefined && typeof akInfo?.stygianSeconds === 'number') {
        enkaData.player.stygianSeconds = akInfo.stygianSeconds;
        enkaData.player.stygianIndex = akInfo.stygianIndex;
      }
    }

    // Map per-character leaderboard calculations
    const calcRows: any[] = Array.isArray(akCalcs?.data) ? akCalcs.data : [];
    const calcByCharId = new Map<number, any>();
    for (const row of calcRows) {
      if (row?.characterId && row?.calculations?.fit) {
        calcByCharId.set(Number(row.characterId), row);
      }
    }

    // Map per-character effective Akasha stats from /api/builds/?uid=...
    const buildRows: any[] = Array.isArray(akBuilds?.data) ? akBuilds.data : [];
    const buildStatsByCharId = new Map<number, Record<string, any>>();
    for (const row of buildRows) {
      if (row?.characterId && row?.stats) {
        buildStatsByCharId.set(Number(row.characterId), row.stats);
      }
    }

    // Default calculationId lookup by characterId from Akasha v2 categories (for unranked showcase characters)
    const defaultCalcByCharId = new Map<number, string>();
    for (const cat of akCategories) {
      const charId = Number(cat.characterId);
      const defaultCalc = cat.weapons?.[0]?.calculationId;
      if (charId && defaultCalc && !defaultCalcByCharId.has(charId)) {
        defaultCalcByCharId.set(charId, String(defaultCalc));
      }
    }

    // Fetch Top 1% benchmark stats in parallel for all matched/categorized characters,
    // falling back to local DB community builds for characters not yet on Akasha.
    const benchmarkRequests = new Map<string, Promise<AkashaBenchmarkStats | undefined>>();
    const localRequests = new Map<number, Promise<AkashaBenchmarkStats | undefined>>();

    for (const char of enkaData.characters) {
      const row = calcByCharId.get(char.id);
      const fit = row?.calculations?.fit;
      const calcId = fit?.calculationId ? String(fit.calculationId) : defaultCalcByCharId.get(char.id);

      if (calcId) {
        const key = `${calcId}:${char.element}`;
        if (!benchmarkRequests.has(key)) {
          benchmarkRequests.set(key, fetchLeaderboardBenchmark(calcId, char.element));
        }
      } else if (!localRequests.has(char.id)) {
        localRequests.set(char.id, fetchLocalCommunityBenchmark(char.id, char.element));
      }
    }

    const [benchmarkEntries, localEntries] = await Promise.all([
      Promise.all(Array.from(benchmarkRequests.entries()).map(async ([k, p]) => [k, await p] as const)),
      Promise.all(Array.from(localRequests.entries()).map(async ([id, p]) => [id, await p] as const)),
    ]);

    const benchmarkMap = new Map<string, AkashaBenchmarkStats | undefined>(benchmarkEntries);
    const localBenchmarkMap = new Map<number, AkashaBenchmarkStats | undefined>(localEntries);

    enkaData.characters = enkaData.characters.map((char) => {
      const row = calcByCharId.get(char.id);
      const fit = row?.calculations?.fit;
      const akBuildRaw = buildStatsByCharId.get(char.id);
      const playerStats = parseAkashaStatsBlock(akBuildRaw, char.element, 1, char.name);

      if (fit && typeof fit.ranking === 'number' && typeof fit.outOf === 'number' && fit.outOf > 0) {
        const calcId = String(fit.calculationId || '');
        const variantLabel = fit.variant?.displayName ? ` ${fit.variant.displayName}` : '';
        const shortLabel = (fit.short || 'BUILD').toString().toUpperCase();
        const category = `${shortLabel}${variantLabel}`.trim();
        const topPercent = parseFloat(((fit.ranking / fit.outOf) * 100).toFixed(2));
        const teammates = extractTeammatesFromDetails(fit.details, char.id, char.name);
        const topStats = (calcId ? benchmarkMap.get(`${calcId}:${char.element}`) : undefined)
          || localBenchmarkMap.get(char.id);

        const akasha: AkashaCharacterData = {
          calculationId: calcId,
          category,
          title: fit.name,
          details: fit.details,
          ranking: fit.ranking,
          outOf: fit.outOf,
          topPercent,
          result: typeof fit.result === 'number' ? Math.round(fit.result) : undefined,
          teammates,
          topStats,
          playerStats,
          source: 'akasha',
        };

        return {
          ...char,
          akasha,
        };
      }

      // Unranked on Akasha: still attach real community benchmark stats (Akasha category avg or local DB players avg)
      const fallbackCalcId = defaultCalcByCharId.get(char.id);
      const fallbackTopStats =
        (fallbackCalcId ? benchmarkMap.get(`${fallbackCalcId}:${char.element}`) : undefined)
        || localBenchmarkMap.get(char.id);

      if (fallbackTopStats || playerStats) {
        return {
          ...char,
          akasha: {
            calculationId: fallbackCalcId || `local-${char.id}`,
            category: `${char.element.toUpperCase()} BUILD`,
            ranking: 0,
            outOf: 0,
            topPercent: 0,
            topStats: fallbackTopStats,
            playerStats,
            source: 'local',
          },
        };
      }

      return char;
    });
  } catch (err) {
    console.warn(`[AkashaClient] Enrichment skipped for UID ${uid}:`, (err as Error)?.message || err);
  }

  return enkaData;
}
