import { z } from 'zod';
import {
  EnkaResponseSchema,
  EnkaData,
  Character,
  PlayerInfo,
  CharacterStats,
  Artifact,
  Weapon,
  TalentLevels,
  Element,
  type AvatarInfoSchema,
} from './types';
import {
  getCharacterData,
  getStatName,
  ARTIFACT_SLOTS,
  ARTIFACT_SETS,
  estimateRollCount,
  getEnkaIconUrl,
  FIGHT_PROPS,
  resolveTextHash,
  getCharacterIconPath,
  getArtifactIconPath,
} from './static-data';

// Helper to safely resolve names that might already be strings in tests
function getResolvedName(hashOrName: string | number | undefined, fallback = 'Unknown'): string {
  if (!hashOrName) return fallback;
  if (typeof hashOrName === 'string' && isNaN(Number(hashOrName))) return hashOrName;
  const resolved = resolveTextHash(hashOrName);
  return resolved.startsWith('Unknown') ? fallback : resolved;
}

type RawAvatarInfo = NonNullable<z.infer<typeof EnkaResponseSchema>['avatarInfoList']>[number];

export function parseEnkaResponse(rawResponse: z.infer<typeof EnkaResponseSchema>): EnkaData {
  const player = parsePlayerInfo(rawResponse);
  const characters = (rawResponse.avatarInfoList || []).map(parseCharacter).filter((c): c is Character => c !== null);

  return {
    player,
    characters,
    ttl: rawResponse.ttl,
    fetchedAt: new Date(),
  };
}

function parsePlayerInfo(raw: z.infer<typeof EnkaResponseSchema>): PlayerInfo {
  const { playerInfo, uid } = raw;

  return {
    uid,
    nickname: playerInfo.nickname,
    level: playerInfo.level,
    signature: playerInfo.signature,
    nameCardId: playerInfo.nameCardId,
    profilePictureId: playerInfo.profilePicture?.avatarId,
  };
}

function parseCharacter(raw: RawAvatarInfo): Character | null {
  const charData = getCharacterData(raw.avatarId);

  // For unknown characters, create basic fallback data
  if (!charData) {
    console.warn(`Unknown character ID: ${raw.avatarId}, creating fallback data`);
    // Try to get element from fightPropMap if possible, otherwise default to Pyro
    const elementMap: Record<string, Element> = {
      '40': 'Pyro',
      '41': 'Electro',
      '42': 'Hydro',
      '43': 'Dendro',
      '44': 'Anemo',
      '45': 'Geo',
      '46': 'Cryo'
    };

    const element = elementMap[raw.fightPropMap['40']?.toString() || ''] || 'Pyro';

    return {
      id: raw.avatarId,
      name: `Unknown Character (${raw.avatarId})`,
      element,
      rarity: 4, // Default rarity
      level: parseInt(raw.propMap['4001']?.val || '1'),
      constellation: raw.talentIdList?.length || 0,
      friendshipLevel: raw.fetterInfo.expLevel || 0,
      talents: {
        normal: 1,
        skill: 1,
        burst: 1
      },
      stats: parseStats(raw.fightPropMap),
      weapon: parseWeapon(raw.equipList),
      artifacts: parseArtifacts(raw.equipList),
      artifactSets: countArtifactSets(parseArtifacts(raw.equipList)),
      icon: getEnkaIconUrl(`UI_AvatarIcon_${raw.avatarId}`),
    };
  }

  const stats = parseStats(raw.fightPropMap);
  const weapon = parseWeapon(raw.equipList);
  const artifacts = parseArtifacts(raw.equipList);
  const artifactSets = countArtifactSets(artifacts);
  const talents = parseTalents(raw.skillLevelMap);
  const constellation = raw.talentIdList?.length || 0;

  return {
    id: raw.avatarId,
    name: charData.name,
    element: charData.element,
    rarity: charData.rarity,
    level: parseInt(raw.propMap['4001']?.val || '1'),
    constellation,
    friendshipLevel: raw.fetterInfo.expLevel,
    talents,
    stats,
    weapon,
    artifacts,
    artifactSets,
    icon: getCharacterIconPath(raw.avatarId),
  };
}

function parseStats(fightPropMap: Record<string, number>): CharacterStats {
  const stats: CharacterStats = {
    hp: Math.round(fightPropMap['2000'] || 0),
    atk: Math.round(fightPropMap['2001'] || 0),
    def: Math.round(fightPropMap['2002'] || 0),
    em: Math.round(fightPropMap['28'] || 0),
    er: parseFloat(((fightPropMap['23'] || 1) * 100).toFixed(1)),
    cr: parseFloat(((fightPropMap['20'] || 0) * 100).toFixed(1)),
    cd: parseFloat(((fightPropMap['22'] || 0) * 100).toFixed(1)),
    dmgBonus: {},
  };

  // Parse damage bonuses
  const dmgBonusProps = ['30', '40', '41', '42', '43', '44', '45', '46'];
  for (const prop of dmgBonusProps) {
    if (fightPropMap[prop]) {
      const key = getStatName(prop).replace('DmgBonus', '');
      stats.dmgBonus[key] = parseFloat(((fightPropMap[prop] || 0) * 100).toFixed(1));
    }
  }

  if (fightPropMap['26']) {
    stats.healingBonus = parseFloat(((fightPropMap['26'] || 0) * 100).toFixed(1));
  }

  return stats;
}

function parseWeapon(equipList: RawAvatarInfo['equipList']): Weapon {
  const weaponEquip = equipList.find((e: any) => e.weapon);

  if (!weaponEquip || !weaponEquip.weapon) {
    throw new Error('No weapon found in equip list');
  }

  const { flat, weapon, itemId } = weaponEquip as any;
  const refinement = weapon.affixMap ? Object.values(weapon.affixMap as Record<string, number>)[0] + 1 : 1;

  let subStat: Weapon['subStat'] | undefined;
  if (flat.weaponStats && flat.weaponStats.length > 1) {
    const subStatRaw = flat.weaponStats[1];
    subStat = {
      key: getStatName(subStatRaw.appendPropId),
      value: subStatRaw.statValue,
    };
  }

  return {
    id: itemId,
    name: getResolvedName(flat.nameTextMapHash, `Weapon ${itemId}`),

    rarity: flat.rankLevel,
    level: weapon.level,
    ascension: weapon.promoteLevel || 0,
    refinement,
    baseAtk: flat.weaponStats?.[0]?.statValue || 0,
    subStat,
    icon: getEnkaIconUrl(flat.icon),
  };
}

function parseArtifacts(equipList: RawAvatarInfo['equipList']): Artifact[] {
  return equipList
    .filter((e: any) => e.reliquary)
    .map((equip: any) => {
      const { flat, reliquary, itemId } = equip;

      if (!reliquary || !flat.reliquaryMainstat) {
        return null;
      }

      const slot = ARTIFACT_SLOTS[flat.equipType || ''] || 'flower';
      const setId = parseInt(flat.icon.split('_')[2]) || 0;

      const mainStat = {
        key: getStatName(flat.reliquaryMainstat.mainPropId),
        value: flat.reliquaryMainstat.statValue,
      };

      const subStats = (flat.reliquarySubstats || []).map((sub: any) => {
        const key = getStatName(sub.appendPropId);
        // Convert percentage stats (CR, CD, ER, DMG%, etc.) from decimal to percentage
        const isPercentageStat = ['cr', 'cd', 'er', 'hpPercent', 'atkPercent', 'defPercent'].includes(key) || key.includes('DmgBonus');
        const displayValue = isPercentageStat ? sub.statValue * 100 : sub.statValue;

        return {
          key,
          value: sub.statValue,
          rolls: estimateRollCount(key, displayValue),
        };
      });

      return {
        id: itemId,
        name: getResolvedName(flat.nameTextMapHash, `Artifact ${itemId}`),
        setId,
        setName: getResolvedName(flat.setNameTextMapHash, ARTIFACT_SETS[setId] || 'Unknown Set'),
        rarity: flat.rankLevel,
        level: reliquary.level - 1, // Enka returns level+1
        slot,
        mainStat,
        subStats,
        icon: getArtifactIconPath(setId, parseInt(flat.icon.split('_').pop() || '1')),
      };
    })
    .filter((a): a is Artifact => a !== null);
}

function countArtifactSets(artifacts: Artifact[]): Record<number, number> {
  const counts: Record<number, number> = {};

  for (const artifact of artifacts) {
    counts[artifact.setId] = (counts[artifact.setId] || 0) + 1;
  }

  return counts;
}

function parseTalents(skillLevelMap: Record<string, number>): TalentLevels {
  // Sort by skill ID (keys) ascending. Usually: Normal < Skill < Burst
  const sortedKeys = Object.keys(skillLevelMap).sort((a, b) => Number(a) - Number(b));

  return {
    normal: skillLevelMap[sortedKeys[0]] || 1,
    skill: skillLevelMap[sortedKeys[1]] || 1,
    burst: skillLevelMap[sortedKeys[2]] || 1,
  };
}
