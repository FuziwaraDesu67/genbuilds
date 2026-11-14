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
  deriveVisualRollPips,
  calculateCritValue,
  getQualityBadge,
  getBuildCVTier,
  getEnkaIconUrl,
  FIGHT_PROPS,
  resolveTextHash,
  getCharacterIconPath,
  getArtifactIconPath,
  getWeaponPassive,
  resolveWeaponName,
  getArtifactSetBonus,
  getActiveArtifactSetBonuses,
  evaluateTalentBoosts,
} from './static-data';
import { getNameCardUrl } from './namecard-data';
import { getServerRegion } from '../utils';

// Helper to safely resolve names that might already be strings in tests
function getResolvedName(hashOrName: string | number | undefined, fallback = 'Unknown'): string {
  if (!hashOrName) return fallback;
  if (typeof hashOrName === 'string' && isNaN(Number(hashOrName))) return hashOrName;
  const resolved = resolveTextHash(hashOrName);
  return resolved.startsWith('Unknown') ? fallback : resolved;
}

export function isPercentageStat(key: string): boolean {
  return (
    ['cr', 'cd', 'er', 'hpPercent', 'atkPercent', 'defPercent', 'healingBonus'].includes(key) ||
    key.includes('DmgBonus')
  );
}

export function normalizeArtifactStat(key: string, val: number): number {
  if (isPercentageStat(key)) {
    if (val > 0 && val <= 1.0) {
      return parseFloat((val * 100).toFixed(1));
    }
    return parseFloat(val.toFixed(1));
  }
  return val;
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
  const { playerInfo, uid, region } = raw;
  const profileAvatarId = playerInfo.profilePicture?.avatarId;

  return {
    uid,
    nickname: playerInfo.nickname,
    level: playerInfo.level,
    region: getServerRegion(uid, region),
    worldLevel: playerInfo.worldLevel,
    signature: playerInfo.signature,
    nameCardId: playerInfo.nameCardId,
    nameCardUrl: getNameCardUrl(playerInfo.nameCardId),
    profilePictureId: profileAvatarId,
    profilePicture: profileAvatarId ? getCharacterIconPath(profileAvatarId) : undefined,
    finishAchievementNum: playerInfo.finishAchievementNum,
    towerFloorIndex: playerInfo.towerFloorIndex,
    towerLevelIndex: playerInfo.towerLevelIndex,
    towerStarIndex: playerInfo.towerStarIndex,
    theaterActIndex: playerInfo.theaterActIndex,
    theaterStarIndex: playerInfo.theaterStarIndex,
    theaterModeIndex: playerInfo.theaterModeIndex,
    stygianIndex: playerInfo.stygianIndex,
    stygianSeconds: playerInfo.stygianSeconds,
  };
}

function parseCharacter(raw: RawAvatarInfo): Character | null {
  const charData = getCharacterData(raw.avatarId);
  const constellation = raw.talentIdList?.length || 0;

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
    const talents = parseTalents(raw.skillLevelMap);
    talents.boosted = evaluateTalentBoosts(raw.avatarId, constellation);
    const artifacts = parseArtifacts(raw.equipList);
    const artifactSets = countArtifactSets(artifacts);
    const activeSetBonuses = getActiveArtifactSetBonuses(artifactSets, artifacts);
    const totalCv = parseFloat(
      artifacts.reduce((sum, a) => sum + (a.cv || 0), 0).toFixed(1)
    );
    const circlet = artifacts.find(a => a.slot === 'circlet');
    let circletMainCv = 0;
    if (circlet?.mainStat) {
      if (circlet.mainStat.key === 'cr') circletMainCv = circlet.mainStat.value * 2;
      else if (circlet.mainStat.key === 'cd') circletMainCv = circlet.mainStat.value;
    }
    const akashaCv = parseFloat((totalCv + circletMainCv).toFixed(1));
    const qualityBadge = getBuildCVTier(totalCv);

    return {
      id: raw.avatarId,
      name: `Unknown Character (${raw.avatarId})`,
      element,
      rarity: 4, // Default rarity
      level: parseInt(raw.propMap['4001']?.val || '1'),
      constellation,
      friendshipLevel: raw.fetterInfo?.expLevel || 0,
      talents,
      stats: parseStats(raw.fightPropMap),
      weapon: parseWeapon(raw.equipList),
      artifacts,
      artifactSets,
      activeSetBonuses,
      totalCv,
      akashaCv,
      qualityBadge,
      icon: getEnkaIconUrl(`UI_AvatarIcon_${raw.avatarId}`),
      gachaSplash: `/icons/characters/${raw.avatarId}_gacha.png`,
    };
  }

  const stats = parseStats(raw.fightPropMap);
  const weapon = parseWeapon(raw.equipList);
  const artifacts = parseArtifacts(raw.equipList);
  const artifactSets = countArtifactSets(artifacts);
  const activeSetBonuses = getActiveArtifactSetBonuses(artifactSets, artifacts);
  const talents = parseTalents(raw.skillLevelMap, charData.skillOrder);
  talents.boosted = evaluateTalentBoosts(raw.avatarId, constellation);
  const totalCv = parseFloat(
    artifacts.reduce((sum, a) => sum + (a.cv || 0), 0).toFixed(1)
  );
  const circlet = artifacts.find(a => a.slot === 'circlet');
  let circletMainCv = 0;
  if (circlet?.mainStat) {
    if (circlet.mainStat.key === 'cr') circletMainCv = circlet.mainStat.value * 2;
    else if (circlet.mainStat.key === 'cd') circletMainCv = circlet.mainStat.value;
  }
  const akashaCv = parseFloat((totalCv + circletMainCv).toFixed(1));
  const qualityBadge = getBuildCVTier(totalCv);

  return {
    id: raw.avatarId,
    name: charData.name,
    element: charData.element,
    rarity: charData.rarity,
    level: parseInt(raw.propMap['4001']?.val || '1'),
    constellation,
    friendshipLevel: raw.fetterInfo?.expLevel || 0,
    talents,
    stats,
    weapon,
    artifacts,
    artifactSets,
    activeSetBonuses,
    totalCv,
    akashaCv,
    qualityBadge,
    icon: getCharacterIconPath(raw.avatarId),
    gachaSplash: `/icons/characters/${raw.avatarId}_gacha.png`,
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

  const resolvedFromNameHash = getResolvedName(flat.nameTextMapHash, '');
  const weaponName = resolveWeaponName(itemId, resolvedFromNameHash);
  const passiveById = getWeaponPassive(itemId, refinement);
  const passive = passiveById.passiveName ? passiveById : getWeaponPassive(weaponName, refinement);

  return {
    id: itemId,
    name: weaponName,
    rarity: flat.rankLevel,
    level: weapon.level,
    ascension: weapon.promoteLevel || 0,
    refinement,
    baseAtk: flat.weaponStats?.[0]?.statValue || 0,
    subStat,
    passiveName: passive.passiveName,
    passiveDescription: passive.passiveDescription,
    icon: getEnkaIconUrl(flat.icon),
  };
}

function parseArtifacts(equipList: RawAvatarInfo['equipList']): Artifact[] {
  return equipList
    .filter((e: any) => e.reliquary)
    .map((equip: any): Artifact | null => {
      const { flat, reliquary, itemId } = equip;

      if (!reliquary || !flat.reliquaryMainstat) {
        return null;
      }

      const slot = ARTIFACT_SLOTS[flat.equipType || ''] || 'flower';
      const setId = parseInt(flat.icon.split('_')[2]) || 0;
      const setName = getResolvedName(flat.setNameTextMapHash, ARTIFACT_SETS[setId] || 'Unknown Set');
      const setBonus = getArtifactSetBonus(setId, setName);

      const mainStatKey = getStatName(flat.reliquaryMainstat.mainPropId);
      const mainStatValue = normalizeArtifactStat(mainStatKey, flat.reliquaryMainstat.statValue);
      const mainStat = {
        key: mainStatKey,
        value: mainStatValue,
      };

      const rawPieceName = getResolvedName(flat.nameTextMapHash, '');
      const pieceName = rawPieceName && !rawPieceName.startsWith('Artifact')
        ? rawPieceName
        : `${setName} (${slot.charAt(0).toUpperCase() + slot.slice(1)})`;

      const subStats = (flat.reliquarySubstats || []).map((sub: any) => {
        const key = getStatName(sub.appendPropId);
        const normalizedValue = normalizeArtifactStat(key, sub.statValue);
        const rolls = estimateRollCount(key, normalizedValue);
        const pips = deriveVisualRollPips(rolls);

        return {
          key,
          value: normalizedValue,
          rolls,
          pips,
        };
      });

      const crSub = subStats.find((s: any) => s.key === 'cr');
      const cdSub = subStats.find((s: any) => s.key === 'cd');
      const crVal = crSub ? crSub.value : 0;
      const cdVal = cdSub ? cdSub.value : 0;
      const pieceCv = calculateCritValue(crVal, cdVal);
      const qualityBadge = getQualityBadge(pieceCv, slot === 'circlet');

      // Use Enka CDN icon URL for authentic high-resolution artifact art
      const enkaIcon = flat.icon ? getEnkaIconUrl(flat.icon) : '';
      const localIcon = getArtifactIconPath(setId, parseInt(flat.icon.split('_').pop() || '1'));
      const relicIcon = enkaIcon || localIcon;

      return {
        id: itemId,
        name: pieceName,
        setId,
        setName,
        setBonusText: setBonus ? {
          twoPiece: setBonus.twoPiece,
          fourPiece: setBonus.fourPiece,
        } : undefined,
        rarity: flat.rankLevel,
        level: reliquary.level - 1, // Enka returns level+1
        slot,
        mainStat,
        subStats,
        cv: pieceCv,
        qualityBadge,
        icon: relicIcon,
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

function parseTalents(
  skillLevelMap: Record<string, number>,
  skillOrder?: number[]
): TalentLevels {
  if (
    skillOrder &&
    skillOrder.length >= 3 &&
    skillOrder.filter((id) => skillLevelMap[id] !== undefined).length >= 2
  ) {
    return {
      normal: skillLevelMap[skillOrder[0]] || 1,
      skill: skillLevelMap[skillOrder[1]] || 1,
      burst: skillLevelMap[skillOrder[2]] || 1,
    };
  }

  // Fallback: Sort by skill ID (keys) ascending. Usually: Normal < Skill < Burst
  const sortedKeys = Object.keys(skillLevelMap).sort((a, b) => Number(a) - Number(b));

  return {
    normal: skillLevelMap[sortedKeys[0]] || 1,
    skill: skillLevelMap[sortedKeys[1]] || 1,
    burst: skillLevelMap[sortedKeys[2]] || 1,
  };
}
