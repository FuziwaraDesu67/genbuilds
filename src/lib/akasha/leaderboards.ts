import type { Element } from '../enka/types';
import { getCharacterData } from '../enka/static-data';
import { getConfiguredCharacters } from '../damage-calc/configs';
import { cacheKeys, getCachedJson, setCachedJson } from '../redis';
import { calculateEffectiveCv } from '../utils';

const AKASHA_BASE_URL = 'https://akasha.cv/api';
const CATEGORIES_TTL_SECONDS = 3600;
const ENTRIES_TTL_SECONDS = 120;

export function isOfflineOrTestEnv(): boolean {
  return (
    process.env.NODE_ENV === 'test' ||
    process.env.VITEST === 'true' ||
    process.env.ENKA_OFFLINE === 'true' ||
    process.env.OFFLINE_MODE === 'true'
  );
}

async function fetchAkashaJson<T>(url: string, timeoutMs: number = 4500): Promise<T | null> {
  if (isOfflineOrTestEnv()) return null;
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

export interface AkashaCategoryWeaponOption {
  calculationId: string;
  name: string;
  icon: string;
  refinement: number;
  rarity: number;
  substat: string;
  defaultVariant?: {
    name?: string;
    displayName?: string;
  } | null;
}

export interface AkashaCategoryRaw {
  characterId: number;
  characterName: string;
  element: Element;
  rarity: number;
  count: number;
  short: string;
  name: string;
  details: string;
  hidden?: boolean;
  weapons?: Array<{
    name: string;
    icon: string;
    substat: string;
    rarity: number;
    refinement: number;
    calculationId: string;
    defaultVariant?: { name?: string; displayName?: string } | null;
  }>;
}

export interface LeaderboardCategoryOption {
  calculationId: string;
  short: string;
  name: string;
  details: string;
  count: number;
  weapons: AkashaCategoryWeaponOption[];
}

export interface LeaderboardCharacterSummary {
  characterId: number;
  name: string;
  element: Element;
  rarity: number;
  weaponType: string;
  iconUrl: string;
  totalBuilds: number;
  defaultCalculationId: string;
  categories: LeaderboardCategoryOption[];
  source: 'akasha' | 'local';
}

export interface LeaderboardRowItem {
  build: {
    id: string | number;
    uid: string;
    avatarId: number;
    weaponId: number;
    weaponName?: string;
    weaponIcon?: string;
    refinement?: number;
    constellation: number;
    calculatedDamage: string;
    critValue?: number;
    effectiveCv?: number;
    overallCombatCv?: number;
    setBonusCr?: number;
    setBonusName?: string;
    isCvCapped?: boolean;
    stats: {
      hp: number;
      atk: number;
      def: number;
      cr: number;
      cd: number;
      em: number;
      er: number;
      dmgBonus: Record<string, number>;
    };
    artifactSets: Record<string, number>;
    artifactSetList?: Array<{ name: string; icon: string; count: number }>;
  };
  player: {
    uid: string;
    nickname: string;
    ar: number;
    region?: string;
  };
  rank: number;
  percentile: number;
}

function normalizeElement(el: unknown): Element {
  const valid: Element[] = ['Pyro', 'Hydro', 'Electro', 'Cryo', 'Dendro', 'Anemo', 'Geo'];
  if (typeof el === 'string' && valid.includes(el as Element)) {
    return el as Element;
  }
  return 'Pyro';
}

export async function fetchAkashaLeaderboardCategories(): Promise<AkashaCategoryRaw[]> {
  if (isOfflineOrTestEnv()) return [];

  const cached = await getCachedJson<AkashaCategoryRaw[]>(cacheKeys.akashaCategories());
  if (cached && Array.isArray(cached) && cached.length > 0) {
    return cached;
  }

  const payload = await fetchAkashaJson<{ data?: AkashaCategoryRaw[] }>(
    `${AKASHA_BASE_URL}/v2/leaderboards/categories`,
    5000
  );

  const list = (payload?.data || []).filter(
    (c) => c && !c.hidden && c.characterId && c.characterName && Array.isArray(c.weapons) && c.weapons.length > 0
  );

  if (list.length > 0) {
    await setCachedJson(cacheKeys.akashaCategories(), list, CATEGORIES_TTL_SECONDS);
  }

  return list;
}

export async function getLeaderboardCharactersSummary(): Promise<LeaderboardCharacterSummary[]> {
  const [akashaCats, configuredIds] = await Promise.all([
    fetchAkashaLeaderboardCategories(),
    Promise.resolve(getConfiguredCharacters()),
  ]);

  const byChar = new Map<number, LeaderboardCharacterSummary>();

  for (const cat of akashaCats) {
    const weapons: AkashaCategoryWeaponOption[] = (cat.weapons || [])
      .filter((w) => w?.calculationId)
      .map((w) => ({
        calculationId: String(w.calculationId),
        name: w.name,
        icon: w.icon,
        refinement: w.refinement || 1,
        rarity: w.rarity || 5,
        substat: w.substat || '',
        defaultVariant: w.defaultVariant || null,
      }));

    if (weapons.length === 0) continue;

    const charId = Number(cat.characterId);
    const localMeta = getCharacterData(charId);
    const categoryOption: LeaderboardCategoryOption = {
      calculationId: weapons[0].calculationId,
      short: cat.short || 'BUILD',
      name: cat.name,
      details: cat.details || '',
      count: Number(cat.count) || 0,
      weapons,
    };

    const existing = byChar.get(charId);
    if (existing) {
      existing.categories.push(categoryOption);
      if (categoryOption.count > existing.totalBuilds) {
        existing.totalBuilds = categoryOption.count;
        existing.defaultCalculationId = categoryOption.calculationId;
      }
    } else {
      byChar.set(charId, {
        characterId: charId,
        name: cat.characterName,
        element: normalizeElement(cat.element || localMeta?.element),
        rarity: Number(cat.rarity) || localMeta?.rarity || 5,
        weaponType: localMeta?.weaponType || 'Sword',
        iconUrl: `/icons/characters/${charId}.png`,
        totalBuilds: categoryOption.count,
        defaultCalculationId: categoryOption.calculationId,
        categories: [categoryOption],
        source: 'akasha',
      });
    }
  }

  // Merge local damage-configured characters so test/offline mode and extra local characters stay accessible
  for (const id of configuredIds) {
    if (byChar.has(id)) continue;
    const local = getCharacterData(id);
    if (!local || !local.name || !local.element) continue;

    const isChasca = id === 10000104;
    const chascaWeapons: AkashaCategoryWeaponOption[] = isChasca ? [
      { calculationId: '10000104-15514', name: "Astral Vulture's Crimson Plumage", icon: 'UI_EquipIcon_Bow_FearsomeFeather', refinement: 1, rarity: 5, substat: 'CRIT DMG' },
      { calculationId: '10000104-15512', name: 'The First Great Magic', icon: 'UI_EquipIcon_Bow_Pledge', refinement: 1, rarity: 5, substat: 'CRIT DMG' },
      { calculationId: '10000104-15509', name: 'Aqua Simulacra', icon: 'UI_EquipIcon_Bow_Kirin', refinement: 1, rarity: 5, substat: 'CRIT DMG' },
      { calculationId: '10000104-15424', name: 'Scion of the Blazing Sun', icon: 'UI_EquipIcon_Bow_Sunfrost', refinement: 5, rarity: 4, substat: 'CRIT Rate' },
      { calculationId: '10000104-15427', name: 'Chain Breaker', icon: 'UI_EquipIcon_Bow_Isikhulu', refinement: 5, rarity: 4, substat: 'ATK' },
      { calculationId: '10000104-15502', name: "Amos' Bow", icon: 'UI_EquipIcon_Bow_Amos', refinement: 1, rarity: 5, substat: 'ATK' },
      { calculationId: '10000104-15501', name: 'Skyward Harp', icon: 'UI_EquipIcon_Bow_Dvalin', refinement: 1, rarity: 5, substat: 'CRIT Rate' },
    ] : [];

    byChar.set(id, {
      characterId: id,
      name: local.name,
      element: normalizeElement(local.element),
      rarity: local.rarity || 5,
      weaponType: local.weaponType || 'Sword',
      iconUrl: local.iconUrl,
      totalBuilds: isChasca ? 16 : 0,
      defaultCalculationId: String(id),
      categories: [
        {
          calculationId: String(id),
          short: local.element.toUpperCase(),
          name: isChasca ? 'Shadows of the Night Winds' : `${local.name} Local Build Rankings`,
          details: isChasca ? 'Rankings computed from analyzed Natlan Chasca showcases and benchmark builds.' : 'Local database rankings computed from analyzed UID showcases.',
          count: isChasca ? 16 : 0,
          weapons: chascaWeapons,
        },
      ],
      source: 'local',
    });
  }

  return Array.from(byChar.values()).sort((a, b) => {
    if (b.totalBuilds !== a.totalBuilds) return b.totalBuilds - a.totalBuilds;
    return a.name.localeCompare(b.name);
  });
}

function readRatioStat(raw: unknown): number {
  const num = Number(raw);
  if (!Number.isFinite(num)) return 0;
  return num <= 15 ? num * 100 : num;
}

export async function fetchAkashaLeaderboardEntries(
  calculationId: string,
  options: {
    page?: number;
    limit?: number;
    totalPool?: number;
    minConstellation?: number;
    weaponName?: string;
    rankingType?: 'damage' | 'overallCv' | 'effectiveCv';
  } = {}
): Promise<{ entries: LeaderboardRowItem[]; total: number; source: 'akasha' | 'local' } | null> {
  if (isOfflineOrTestEnv() || !calculationId) return null;

  const limit = Math.min(Math.max(options.limit || 50, 1), 50);
  const page = Math.max(options.page || 1, 1);

  const cacheKey = cacheKeys.akashaLeaderboardEntries(calculationId, page, limit);
  let rows = await getCachedJson<any[]>(cacheKey);

  if (!rows) {
    const url = `${AKASHA_BASE_URL}/leaderboards?calculationId=${encodeURIComponent(
      calculationId
    )}&sort=calculation.result&order=-1&size=${limit}&page=${page}&p=`;

    const payload = await fetchAkashaJson<{ data?: any[] }>(url, 5000);
    if (!payload || !Array.isArray(payload.data) || payload.data.length === 0) {
      return null;
    }
    rows = payload.data;
    await setCachedJson(cacheKey, rows, ENTRIES_TTL_SECONDS);
  }

  const totalPool = Math.max(options.totalPool || 0, rows.length);
  const offset = (page - 1) * limit;

  let entries: LeaderboardRowItem[] = rows.map((row, idx) => {
    const rank = offset + idx + 1;
    const stats = row.stats || {};
    const cr = parseFloat(readRatioStat(stats.critRate?.value).toFixed(1));
    const cd = parseFloat(readRatioStat(stats.critDamage?.value).toFixed(1));
    const er = parseFloat(readRatioStat(stats.energyRecharge?.value ?? 1).toFixed(1));
    const weaponRef = Number(row.weapon?.weaponInfo?.refinementLevel?.value);
    const refinement = Number.isFinite(weaponRef) ? weaponRef + 1 : 1;

    const setEntries = Object.entries((row.artifactSets || {}) as Record<string, { icon?: string; count?: number }>);
    const artifactSets: Record<string, number> = {};
    const artifactSetList: Array<{ name: string; icon: string; count: number }> = [];
    for (const [setName, meta] of setEntries) {
      const cnt = Number(meta?.count) || 0;
      artifactSets[setName] = cnt;
      if (meta?.icon) {
        artifactSetList.push({ name: setName, icon: meta.icon, count: cnt });
      }
    }

    const effResult = calculateEffectiveCv({
      stats: { cr, cd },
      artifactSets,
      akashaCv: typeof row.critValue === 'number' ? row.critValue : undefined,
    });

    return {
      build: {
        id: row._id || `${row.uid}-${rank}`,
        uid: String(row.uid || ''),
        avatarId: Number(row.characterId) || 0,
        weaponId: Number(row.weapon?.weaponId) || 0,
        weaponName: row.weapon?.name || undefined,
        weaponIcon: row.weapon?.icon || undefined,
        refinement,
        constellation: Number(row.constellation) || 0,
        calculatedDamage: String(Math.round(Number(row.calculation?.result) || 0)),
        critValue: typeof row.critValue === 'number' ? parseFloat(row.critValue.toFixed(1)) : undefined,
        effectiveCv: effResult.effectiveArtifactCv,
        overallCombatCv: effResult.overallCombatCv,
        setBonusCr: effResult.effectiveSetBonusCr,
        setBonusName: effResult.activeBonusName,
        isCvCapped: effResult.isCapped,
        stats: {
          hp: Math.round(Number(stats.maxHp?.value) || 0),
          atk: Math.round(Number(stats.atk?.value) || 0),
          def: Math.round(Number(stats.def?.value) || 0),
          cr,
          cd,
          em: Math.round(Number(stats.elementalMastery?.value) || 0),
          er,
          dmgBonus: {},
        },
        artifactSets,
        artifactSetList,
      },
      player: {
        uid: String(row.uid || ''),
        nickname: row.owner?.nickname || `UID ${row.uid}`,
        ar: Math.round(Number(row.owner?.adventureRank) || 60),
        region: row.owner?.region || undefined,
      },
      rank,
      percentile: parseFloat(Math.max(0.01, (rank / totalPool) * 100).toFixed(2)),
    };
  });

  if (options.minConstellation !== undefined) {
    entries = entries.filter((e) => e.build.constellation >= options.minConstellation!);
  }

  if (options.weaponName) {
    const q = options.weaponName.toLowerCase();
    entries = entries.filter((e) => (e.build.weaponName || '').toLowerCase() === q);
  }

  if (options.rankingType === 'overallCv' || options.rankingType === 'effectiveCv') {
    entries.sort((a, b) => {
      const cvB = b.build.overallCombatCv ?? b.build.effectiveCv ?? (b.build.stats.cr * 2 + b.build.stats.cd);
      const cvA = a.build.overallCombatCv ?? a.build.effectiveCv ?? (a.build.stats.cr * 2 + a.build.stats.cd);
      return cvB - cvA;
    });
    entries.forEach((e, idx) => {
      e.rank = offset + idx + 1;
      e.percentile = parseFloat(Math.max(0.01, (e.rank / totalPool) * 100).toFixed(2));
    });
  }

  return {
    entries,
    total: totalPool,
    source: 'akasha',
  };
}
