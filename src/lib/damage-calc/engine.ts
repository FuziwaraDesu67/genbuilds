import type { Character } from '../enka/types';
import { damageConfigs, type DamageConfig } from './configs';

// Standard test enemy
const STANDARD_ENEMY = {
  level: 90,
  defMultiplier: 0.5, // Simplified DEF calculation for level 90 character vs level 90 enemy
  resMultiplier: 0.9, // 10% base resistance
};

export interface DamageCalculationResult {
  totalDamage: number;
  breakdown: {
    step: string;
    value: number;
    formula: string;
  }[];
  rotation: string[];
}

export function calculateDamage(character: Character): DamageCalculationResult | null {
  const config = damageConfigs[character.id];

  if (!config) {
    console.warn(`No damage config for character ${character.name} (${character.id})`);
    return null;
  }

  const { stats, talents, weapon } = character;
  const breakdown: DamageCalculationResult['breakdown'] = [];

  // Step 1: Base damage calculation
  const talentMultiplier = getTalentMultiplier(config, talents);
  const baseDamage = stats.atk * talentMultiplier;

  breakdown.push({
    step: 'Base Damage',
    value: baseDamage,
    formula: `${stats.atk} ATK × ${talentMultiplier.toFixed(2)} talent multiplier`,
  });

  // Step 2: Apply DMG bonus
  const dmgBonusKey = character.element.toLowerCase();
  const dmgBonus = (stats.dmgBonus[dmgBonusKey] || 0) / 100;
  const dmgWithBonus = baseDamage * (1 + dmgBonus);

  breakdown.push({
    step: 'DMG Bonus',
    value: dmgWithBonus,
    formula: `${baseDamage.toFixed(0)} × (1 + ${(dmgBonus * 100).toFixed(1)}% ${character.element} DMG)`,
  });

  // Step 3: Apply crit
  const critMultiplier = 1 + (stats.cd / 100);
  const critDamage = dmgWithBonus * critMultiplier;

  breakdown.push({
    step: 'Crit Damage',
    value: critDamage,
    formula: `${dmgWithBonus.toFixed(0)} × (1 + ${stats.cd.toFixed(1)}% CRIT DMG)`,
  });

  // Step 4: Apply enemy DEF
  const afterDef = critDamage * STANDARD_ENEMY.defMultiplier;

  breakdown.push({
    step: 'Enemy DEF',
    value: afterDef,
    formula: `${critDamage.toFixed(0)} × ${STANDARD_ENEMY.defMultiplier} DEF multiplier`,
  });

  // Step 5: Apply enemy RES
  const afterRes = afterDef * STANDARD_ENEMY.resMultiplier;

  breakdown.push({
    step: 'Enemy RES',
    value: afterRes,
    formula: `${afterDef.toFixed(0)} × ${STANDARD_ENEMY.resMultiplier} RES multiplier`,
  });

  // Step 6: Apply reaction multiplier (if configured)
  let finalDamage = afterRes;
  if (config.reactionMultiplier) {
    finalDamage = afterRes * config.reactionMultiplier;
    breakdown.push({
      step: `Reaction (${config.reactionType || 'Amplifying'})`,
      value: finalDamage,
      formula: `${afterRes.toFixed(0)} × ${config.reactionMultiplier} reaction`,
    });
  }

  // Apply additional multipliers from config (buffs, passives, etc.)
  if (config.additionalMultipliers) {
    for (const [name, multiplier] of Object.entries(config.additionalMultipliers)) {
      const before = finalDamage;
      finalDamage *= multiplier;
      breakdown.push({
        step: name,
        value: finalDamage,
        formula: `${before.toFixed(0)} × ${multiplier} (${name})`,
      });
    }
  }

  return {
    totalDamage: Math.round(finalDamage),
    breakdown,
    rotation: config.rotation || [],
  };
}

function getTalentMultiplier(config: DamageConfig, talents: Character['talents']): number {
  // Use the primary talent level (usually burst or skill)
  const level = config.primaryTalent === 'normal'
    ? talents.normal
    : config.primaryTalent === 'skill'
    ? talents.skill
    : talents.burst;

  // Get base multiplier and scale with talent level
  // Most talents scale roughly 7-10% per level from level 1 to 10
  const baseMultiplier = config.baseMultiplier;
  const scalingPerLevel = config.talentScaling || 0.08;

  return baseMultiplier * (1 + (level - 1) * scalingPerLevel);
}

export function calculateCritValue(cr: number, cd: number): number {
  return cr * 2 + cd;
}
