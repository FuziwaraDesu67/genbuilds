import { Element, QualityBadge } from './types';
import { getGameCharacter, getCharacterIconPath, FIGHT_PROP_NAMES, TEXT_MAP } from './game-data.generated';
import {
  ARTIFACT_SET_DATA,
  ARTIFACT_SET_LIST,
  getArtifactSetBonus,
  getArtifactSetBonusByName,
  getArtifactSetDetails,
  getArtifactSetName,
  getActiveArtifactSetBonuses,
} from './artifact-set-data';
import {
  WEAPON_DATA,
  WEAPON_LIST,
  getWeaponPassive,
  getWeaponMetadata,
} from './weapon-data';
import {
  CHARACTER_TALENT_BOOSTS,
  evaluateTalentBoosts,
} from './talent-boost-data';
import { getConfiguredCharacters as getDamageConfiguredCharacters } from '../damage-calc/configs';

// Re-export text resolver and icon functions for other modules
export { resolveTextHash, getCharacterIconPath, getArtifactIconPath } from './game-data.generated';
export * from './artifact-set-data';
export * from './weapon-data';
export * from './constellation-data';
export * from './talent-boost-data';

// Fight prop mappings (stat IDs from Enka API)
export const FIGHT_PROPS: Record<string, string> = {
  '1': 'baseHP',
  '2': 'hp',
  '3': 'hpPercent',
  '4': 'baseATK',
  '5': 'atk',
  '6': 'atkPercent',
  '7': 'baseDEF',
  '8': 'def',
  '9': 'defPercent',
  '20': 'cr', // Crit Rate
  '22': 'cd', // Crit DMG
  '23': 'er', // Energy Recharge
  '26': 'healingBonus',
  '27': 'incomingHealingBonus',
  '28': 'em', // Elemental Mastery
  '29': 'physicalRes',
  '30': 'physicalDmgBonus',
  '40': 'pyroDmgBonus',
  '41': 'electroDmgBonus',
  '42': 'hydroDmgBonus',
  '43': 'dendroDmgBonus',
  '44': 'anemoDmgBonus',
  '45': 'geoDmgBonus',
  '46': 'cryoDmgBonus',
  '2000': 'maxHP',
  '2001': 'atk',
  '2002': 'def',
  // String-based mappings (from flat artifact/weapon stats)
  'FIGHT_PROP_HP': 'hp',
  'FIGHT_PROP_HP_PERCENT': 'hpPercent',
  'FIGHT_PROP_ATTACK': 'atk',
  'FIGHT_PROP_ATTACK_PERCENT': 'atkPercent',
  'FIGHT_PROP_DEFENSE': 'def',
  'FIGHT_PROP_DEFENSE_PERCENT': 'defPercent',
  'FIGHT_PROP_CRITICAL': 'cr',
  'FIGHT_PROP_CRITICAL_HURT': 'cd',
  'FIGHT_PROP_CHARGE_EFFICIENCY': 'er',
  'FIGHT_PROP_ELEMENT_MASTERY': 'em',
  'FIGHT_PROP_HEAL_ADD': 'healingBonus',
  'FIGHT_PROP_PHYSICAL_ADD_HURT': 'physicalDmgBonus',
  'FIGHT_PROP_FIRE_ADD_HURT': 'pyroDmgBonus',
  'FIGHT_PROP_ELEC_ADD_HURT': 'electroDmgBonus',
  'FIGHT_PROP_WATER_ADD_HURT': 'hydroDmgBonus',
  'FIGHT_PROP_GRASS_ADD_HURT': 'dendroDmgBonus',
  'FIGHT_PROP_WIND_ADD_HURT': 'anemoDmgBonus',
  'FIGHT_PROP_ROCK_ADD_HURT': 'geoDmgBonus',
  'FIGHT_PROP_ICE_ADD_HURT': 'cryoDmgBonus',
};

// Artifact slot mappings
export const ARTIFACT_SLOTS: Record<string, 'flower' | 'plume' | 'sands' | 'goblet' | 'circlet'> = {
  'EQUIP_BRACER': 'flower',
  'EQUIP_NECKLACE': 'plume',
  'EQUIP_SHOES': 'sands',
  'EQUIP_RING': 'goblet',
  'EQUIP_DRESS': 'circlet',
};

// Artifact set bonuses (setId -> name)
export const ARTIFACT_SETS: Record<number, string> = {
  15008: 'Emblem of Severed Fate',
  15020: 'Golden Troupe',
  15025: 'Obsidian Codex',
  15038: 'Obsidian Codex',
  15037: 'Scroll of the Hero of Cinder City',
  15039: 'Night of the Sky-Scorching Sun',
  15040: 'Finale of the Deep Gallantry',
  15042: 'Spindle of the Ancient Flute',
  15046: "Long Night's Oath",
  15048: 'Obsidian Guard',
  14001: "Gladiator's Finale",
  15007: "Shimenawa's Reminiscence",
  15006: 'Pale Flame',
  15014: 'Vermillion Hereafter',
  15015: 'Echoes of an Offering',
  15018: 'Desert Pavilion Chronicle',
  15019: 'Flower of Paradise Lost',
  15002: 'Blizzard Strayer',
  15003: 'Heart of Depth',
  15005: 'Crimson Witch of Flames',
  15027: 'Scroll of the Hero of Cinder City',
  ...Object.entries(ARTIFACT_SET_DATA).reduce(
    (acc, [id, def]) => {
      const numId = Number(id);
      if (!acc[numId]) {
        acc[numId] = def.name;
      }
      return acc;
    },
    {} as Record<number, string>
  ),
};

// Element color mappings for UI
export const ELEMENT_COLORS: Record<Element, { primary: string; secondary: string }> = {
  Pyro: { primary: '#FF6B2C', secondary: '#FF4500' },
  Hydro: { primary: '#00BFFF', secondary: '#1E90FF' },
  Electro: { primary: '#9B59D6', secondary: '#8A2BE2' },
  Cryo: { primary: '#4DD0E1', secondary: '#00CED1' },
  Dendro: { primary: '#7CB342', secondary: '#9ACD32' },
  Anemo: { primary: '#4FC3F7', secondary: '#87CEEB' },
  Geo: { primary: '#FFB74D', secondary: '#DAA520' },
};

// Substat roll values (for roll estimation)
export const SUBSTAT_ROLLS: Record<string, number[]> = {
  'hpPercent': [4.08, 4.66, 5.25, 5.83],
  'atkPercent': [4.08, 4.66, 5.25, 5.83],
  'defPercent': [5.10, 5.83, 6.56, 7.29],
  'hp': [209, 239, 269, 299],
  'atk': [14, 16, 18, 19],
  'def': [16, 19, 21, 23],
  'em': [16.32, 18.65, 20.98, 23.31],
  'er': [4.53, 5.18, 5.83, 6.48],
  'cr': [2.72, 3.11, 3.50, 3.89],
  'cd': [5.44, 6.22, 6.99, 7.77],
};

// Get icon URL for Enka assets
export function getEnkaIconUrl(iconPath: string): string {
  return `https://enka.network/ui/${iconPath}.png`;
}

// Get character data by ID
export function getCharacterData(id: number) {
  const character = getGameCharacter(id);
  if (!character) return null;

  return {
    ...character,
    iconUrl: getCharacterIconPath(id)
  };
}

// Get configured characters (those with damage calculation)
export function getConfiguredCharacters(): number[] {
  return getDamageConfiguredCharacters();
}

// Get readable stat name
export function getStatName(propId: string): string {
  if (FIGHT_PROPS[propId]) return FIGHT_PROPS[propId];
  // Fallback to English localization if available
  if (FIGHT_PROP_NAMES[propId]) return FIGHT_PROP_NAMES[propId];
  return propId;
}

// Estimate authentic substat roll count bounded in [1..6]
export function estimateRollCount(statKey: string, value: number): number {
  const rolls = SUBSTAT_ROLLS[statKey];
  if (!rolls || value <= 0) return 0;

  const minRoll = rolls[0];
  const maxRoll = rolls[3];
  const avgRoll = (rolls[0] + rolls[1] + rolls[2] + rolls[3]) / 4;

  let estimated = Math.round(value / avgRoll);
  const epsilon = 0.05 * minRoll;

  while (estimated < 6 && value > estimated * maxRoll + epsilon) {
    estimated++;
  }

  while (estimated > 1 && value < estimated * minRoll - epsilon) {
    estimated--;
  }

  return Math.max(1, Math.min(6, estimated));
}

// Derive visual roll pip representation string
// rolls 1-5 -> ●○○○○ to ●●●●●
// rolls 6   -> ●●●●●★
export function deriveVisualRollPips(rolls: number, maxPips: number = 5): string {
  const boundedRolls = Math.max(1, Math.min(rolls, 6));
  if (boundedRolls === 6) {
    return '●●●●●★';
  }
  const active = '●'.repeat(boundedRolls);
  const inactive = '○'.repeat(Math.max(0, maxPips - boundedRolls));
  return `${active}${inactive}`;
}

// Calculate crit value (CR * 2 + CD)
// Guards negative inputs to 0, returns value to 1 decimal place
export function calculateCritValue(cr: number = 0, cd: number = 0): number {
  const safeCr = Math.max(0, cr || 0);
  const safeCd = Math.max(0, cd || 0);
  return parseFloat((safeCr * 2 + safeCd).toFixed(1));
}

// Evaluate QualityBadge for an individual artifact piece
export function getQualityBadge(cv: number, isCirclet: boolean = false): QualityBadge {
  if (isCirclet) {
    if (cv >= 35.0) return 'Godly';
    if (cv >= 30.0) return 'Great';
    if (cv >= 20.0) return 'Good';
    if (cv >= 10.0) return 'Decent';
    return 'Subpar';
  }
  if (cv >= 50.0) return 'Godly';
  if (cv >= 40.0) return 'Great';
  if (cv >= 30.0) return 'Good';
  if (cv >= 20.0) return 'Decent';
  return 'Subpar';
}

// Evaluate QualityBadge for total artifact build CV
export function getBuildCVTier(totalCv: number): QualityBadge {
  if (totalCv >= 240.0) return 'Godly';
  if (totalCv >= 220.0) return 'Great';
  if (totalCv >= 180.0) return 'Good';
  if (totalCv >= 140.0) return 'Decent';
  return 'Subpar';
}

