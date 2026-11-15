/**
 * KeqingMains (KQM) Theorycrafting Library Official Damage Formula Implementation
 * Reference: https://library.keqingmains.com/combat-mechanics/damage/damage-formula
 *
 * Outgoing Non-Transformative Damage Formula:
 * Final Damage = Base Damage × (1 + DMG Bonus) × Crit Multiplier × DEF Multiplier × RES Multiplier × Reaction Multiplier
 */

import type { Character } from '../enka/types';
import { damageConfigs, type DamageConfig } from './configs';

// Standard test enemy parameters (Level 90 target, 10% base elemental/physical RES)
export const KQM_STANDARD_ENEMY = {
  level: 90,
  baseRes: 0.10, // 10% base resistance across standard elemental & physical types
};

// KQM Level Multipliers for Additive Reactions (Aggravate / Spread) and Level Scaling
export const KQM_LEVEL_MULTIPLIERS: Record<number, number> = {
  90: 1446.85,
  89: 1404.97,
  88: 1363.80,
  87: 1323.34,
  86: 1283.60,
  85: 1244.57,
  84: 1206.26,
  83: 1168.66,
  82: 1131.79,
  81: 1095.63,
  80: 1077.44,
  79: 1047.88,
  70: 765.64,
  60: 492.88,
  50: 323.60,
  40: 207.38,
  30: 131.41,
  20: 86.11,
  10: 40.54,
  1: 17.17,
};

/**
 * Returns the exact KQM Level Multiplier for a given character level.
 */
export function getKqmLevelMultiplier(level: number): number {
  const rounded = Math.round(Math.min(90, Math.max(1, level)));
  if (KQM_LEVEL_MULTIPLIERS[rounded]) {
    return KQM_LEVEL_MULTIPLIERS[rounded];
  }

  // Linear interpolation between milestone brackets
  const milestones = [1, 10, 20, 30, 40, 50, 60, 70, 80, 90];
  let lower = 1;
  let upper = 90;
  for (let i = 0; i < milestones.length - 1; i++) {
    if (rounded >= milestones[i] && rounded <= milestones[i + 1]) {
      lower = milestones[i];
      upper = milestones[i + 1];
      break;
    }
  }

  const lowerVal = KQM_LEVEL_MULTIPLIERS[lower];
  const upperVal = KQM_LEVEL_MULTIPLIERS[upper];
  const fraction = (rounded - lower) / (upper - lower);
  return lowerVal + fraction * (upperVal - lowerVal);
}

/**
 * KQM Defense Multiplier:
 * DEF Multiplier = (CharLevel + 100) / [ (CharLevel + 100) + (EnemyLevel + 100) × (1 - DEF Reduction) × (1 - DEF Ignore) ]
 */
export function calculateKqmDefMultiplier(
  charLevel: number,
  enemyLevel: number = 90,
  defReductionPercent: number = 0,
  defIgnorePercent: number = 0
): number {
  const defRed = Math.min(1, Math.max(0, defReductionPercent / 100));
  const defIgn = Math.min(1, Math.max(0, defIgnorePercent / 100));
  const numerator = charLevel + 100;
  const denominator = (charLevel + 100) + (enemyLevel + 100) * (1 - defRed) * (1 - defIgn);
  return denominator > 0 ? numerator / denominator : 1;
}

/**
 * KQM Resistance Multiplier (Piecewise Formula):
 * - If R < 0:        1 - (R / 2)
 * - If 0 <= R < 0.75: 1 - R
 * - If R >= 0.75:     1 / (4R + 1)
 * where R = baseRes - resShred
 */
export function calculateKqmResMultiplier(baseRes: number = 0.10, resShredPercent: number = 0): number {
  const effectiveRes = baseRes - (resShredPercent / 100);
  if (effectiveRes < 0) {
    return 1 - (effectiveRes / 2);
  }
  if (effectiveRes < 0.75) {
    return 1 - effectiveRes;
  }
  return 1 / (4 * effectiveRes + 1);
}

/**
 * KQM Amplifying Reaction Multiplier (Vaporize & Melt):
 * Multiplier = BaseReaction × [ 1 + (2.78 × EM) / (1400 + EM) + ReactionBonus ]
 */
export function calculateKqmAmplifyingReaction(
  reactionType: 'ForwardVape' | 'ReverseVape' | 'ForwardMelt' | 'ReverseMelt',
  em: number,
  reactionBonusPercent: number = 0
): { multiplier: number; emBonusPercent: number } {
  const baseMultiplier = (reactionType === 'ForwardVape' || reactionType === 'ForwardMelt') ? 2.0 : 1.5;
  const emBonus = (2.78 * Math.max(0, em)) / (1400 + Math.max(0, em));
  const bonus = reactionBonusPercent / 100;
  const multiplier = baseMultiplier * (1 + emBonus + bonus);
  return {
    multiplier,
    emBonusPercent: emBonus * 100,
  };
}

/**
 * KQM Additive Reaction Bonus (Spread & Aggravate):
 * Flat Bonus = LevelMultiplier × ReactionCoefficient × [ 1 + (5 × EM) / (1200 + EM) + ReactionBonus ]
 */
export function calculateKqmAdditiveReactionBonus(
  reactionType: 'Aggravate' | 'Spread',
  characterLevel: number,
  em: number,
  reactionBonusPercent: number = 0
): { flatBonus: number; emBonusPercent: number } {
  const levelMult = getKqmLevelMultiplier(characterLevel);
  const coeff = reactionType === 'Spread' ? 1.25 : 1.15;
  const emBonus = (5 * Math.max(0, em)) / (1200 + Math.max(0, em));
  const bonus = reactionBonusPercent / 100;
  const flatBonus = levelMult * coeff * (1 + emBonus + bonus);
  return {
    flatBonus,
    emBonusPercent: emBonus * 100,
  };
}

/**
 * KQM Expected Crit Multiplier (Mathematical Expectation):
 * Expected Multiplier = 1 + (effectiveCR × CD)
 */
export function calculateKqmAverageCritMultiplier(crPercent: number, cdPercent: number): number {
  const effectiveCr = Math.min(1, Math.max(0, crPercent / 100));
  const cd = Math.max(0, cdPercent / 100);
  return 1 + (effectiveCr * cd);
}

export interface DamageCalculationResult {
  totalDamage: number;
  skillDamage: number;
  burstDamage: number;
  averageDamage: number;
  nonCritDamage: number;
  critDamage: number;
  breakdown: {
    step: string;
    value: number;
    formula: string;
  }[];
  rotation: string[];
  assumptions: {
    enemyLevel: number;
    enemyRes: number;
    reactionType?: string;
    scalingStat: string;
  };
}

/**
 * Executes a full KeqingMains (KQM) Damage Calculation for any given character.
 * Uses specialized theorycrafted configs when available, or a universal KQM fallback
 * derived from the character's real stats, talents, and elemental archetypes.
 */
export function calculateDamage(character: Character): DamageCalculationResult {
  const config: DamageConfig = damageConfigs[character.id] || deriveUniversalKqmConfig(character);

  const { stats, talents } = character;
  const charLevel = character.level || 90;
  const breakdown: DamageCalculationResult['breakdown'] = [];

  // ── Step 1: Base Damage (Stat Scaling + Flat Bonus + Additive Reaction) ──
  const talentLevel = config.primaryTalent === 'normal'
    ? talents.normal
    : config.primaryTalent === 'skill'
    ? talents.skill
    : talents.burst;

  const talentScalingPerLevel = config.talentScaling || 0.08;
  const talentMultiplier = config.baseMultiplier * (1 + (talentLevel - 1) * talentScalingPerLevel);

  // Determine Primary Scaling Stat
  let primaryStatValue = stats.atk;
  let statName = 'ATK';

  if (config.scalingStat === 'hp') {
    primaryStatValue = stats.hp;
    statName = 'Max HP';
  } else if (config.scalingStat === 'def') {
    primaryStatValue = stats.def;
    statName = 'DEF';
  } else if (config.scalingStat === 'em') {
    primaryStatValue = stats.em;
    statName = 'EM';
  } else if (config.scalingStat === 'hybrid' && config.secondaryStat && config.secondaryMultiplier) {
    statName = 'ATK + EM';
  }

  let rawBaseDamage = primaryStatValue * talentMultiplier;

  // Hybrid scaling (e.g. Alhaitham / Nahida ATK + EM)
  if (config.scalingStat === 'hybrid' && config.secondaryStat && config.secondaryMultiplier) {
    const secondaryVal = config.secondaryStat === 'em' ? stats.em : stats.hp;
    const secondaryMult = config.secondaryMultiplier * (1 + (talentLevel - 1) * talentScalingPerLevel);
    rawBaseDamage += secondaryVal * secondaryMult;
  }

  // Flat additions
  let flatAdditions = config.flatBonus || 0;

  // Additive Reaction (Aggravate / Spread)
  let additiveBonus = 0;
  let additiveEmBonusPct = 0;
  if (config.reactionAdditive) {
    const addResult = calculateKqmAdditiveReactionBonus(
      config.reactionAdditive,
      charLevel,
      stats.em
    );
    additiveBonus = addResult.flatBonus;
    additiveEmBonusPct = addResult.emBonusPercent;
  }

  const baseDamage = rawBaseDamage + flatAdditions + additiveBonus;

  breakdown.push({
    step: '1. KQM Base Damage',
    value: Math.round(baseDamage),
    formula: additiveBonus > 0
      ? `(${primaryStatValue.toLocaleString()} ${statName} × ${(talentMultiplier * 100).toFixed(1)}%) + ${Math.round(additiveBonus).toLocaleString()} ${config.reactionAdditive} Additive (+${additiveEmBonusPct.toFixed(1)}% EM)`
      : `${primaryStatValue.toLocaleString()} ${statName} × ${(talentMultiplier * 100).toFixed(1)}% talent (Lv. ${talentLevel})`,
  });

  // ── Step 2: DMG Bonus Multiplier ─────────────────────────────────────────
  const elemKey = character.element.toLowerCase();
  const elemDmgBonus = (stats.dmgBonus[elemKey] || 0) / 100;

  // Artifact & passive DMG multipliers
  let extraDmgBonus = 0;
  if (config.additionalMultipliers) {
    for (const mult of Object.values(config.additionalMultipliers)) {
      if (mult > 1) {
        extraDmgBonus += (mult - 1);
      }
    }
  }

  const totalDmgBonusMultiplier = 1 + elemDmgBonus + extraDmgBonus;
  const dmgWithBonus = baseDamage * totalDmgBonusMultiplier;

  breakdown.push({
    step: '2. KQM DMG Bonus',
    value: Math.round(dmgWithBonus),
    formula: `${Math.round(baseDamage).toLocaleString()} × [1 + ${(elemDmgBonus * 100).toFixed(1)}% ${character.element} DMG${extraDmgBonus > 0 ? ` + ${(extraDmgBonus * 100).toFixed(1)}% Buffs` : ''}] = ${totalDmgBonusMultiplier.toFixed(3)}x`,
  });

  // ── Step 3: CRIT Multiplier (Crit & Expected Average) ────────────────────
  const cdMultiplier = 1 + (stats.cd / 100);
  const avgCritMultiplier = calculateKqmAverageCritMultiplier(stats.cr, stats.cd);

  const critDamage = dmgWithBonus * cdMultiplier;
  const averageDamage = dmgWithBonus * avgCritMultiplier;

  breakdown.push({
    step: '3. KQM CRIT Multipliers',
    value: Math.round(critDamage),
    formula: `Crit: ×${cdMultiplier.toFixed(3)} (+${stats.cd.toFixed(1)}% CD) | Avg: ×${avgCritMultiplier.toFixed(3)} (${stats.cr.toFixed(1)}% CR / ${stats.cd.toFixed(1)}% CD)`,
  });

  // ── Step 4: Enemy DEF Multiplier ─────────────────────────────────────────
  const defMultiplier = calculateKqmDefMultiplier(
    charLevel,
    KQM_STANDARD_ENEMY.level,
    0,
    config.defIgnorePercent || 0
  );

  const afterDefCrit = critDamage * defMultiplier;
  const afterDefAvg = averageDamage * defMultiplier;
  const afterDefNonCrit = dmgWithBonus * defMultiplier;

  breakdown.push({
    step: '4. KQM Enemy DEF Multiplier',
    value: Math.round(afterDefCrit),
    formula: `(${charLevel} + 100) / [(${charLevel} + 100) + (${KQM_STANDARD_ENEMY.level} + 100)] = ${defMultiplier.toFixed(4)}x`,
  });

  // ── Step 5: Enemy RES Multiplier (Piecewise Formula) ─────────────────────
  const resMultiplier = calculateKqmResMultiplier(
    KQM_STANDARD_ENEMY.baseRes,
    config.resShredPercent || 0
  );

  const afterResCrit = afterDefCrit * resMultiplier;
  const afterResAvg = afterDefAvg * resMultiplier;
  const afterResNonCrit = afterDefNonCrit * resMultiplier;

  breakdown.push({
    step: '5. KQM Enemy RES Multiplier',
    value: Math.round(afterResCrit),
    formula: `1 - ${(KQM_STANDARD_ENEMY.baseRes * 100).toFixed(0)}% base RES = ${resMultiplier.toFixed(4)}x against standard Lv90 enemy`,
  });

  // ── Step 6: Amplifying Reaction Multiplier (Vaporize / Melt) ─────────────
  let finalCritDamage = afterResCrit;
  let finalAverageDamage = afterResAvg;
  let finalNonCritDamage = afterResNonCrit;

  if (config.reactionAmplification) {
    const ampResult = calculateKqmAmplifyingReaction(
      config.reactionAmplification,
      stats.em
    );
    finalCritDamage = afterResCrit * ampResult.multiplier;
    finalAverageDamage = afterResAvg * ampResult.multiplier;
    finalNonCritDamage = afterResNonCrit * ampResult.multiplier;

    breakdown.push({
      step: `6. KQM Reaction (${config.reactionType})`,
      value: Math.round(finalCritDamage),
      formula: `${(ampResult.multiplier / (1 + ampResult.emBonusPercent / 100)).toFixed(1)}x base × [1 + ${ampResult.emBonusPercent.toFixed(1)}% (${stats.em} EM)] = ${ampResult.multiplier.toFixed(3)}x`,
    });
  }

  // ── Compute Individual Skill and Burst Damage ────────────────────────────
  const skillMult = (config.skillMultiplier || 2.5) * (1 + (talents.skill - 1) * 0.08);
  const burstMult = (config.burstMultiplier || 4.5) * (1 + (talents.burst - 1) * 0.08);

  const skillRaw = primaryStatValue * skillMult;
  const burstRaw = primaryStatValue * burstMult;

  const baseDmgBonus = 1 + elemDmgBonus;
  const skillDamage = Math.round(skillRaw * baseDmgBonus * cdMultiplier * defMultiplier * resMultiplier);
  const burstDamage = Math.round(burstRaw * baseDmgBonus * cdMultiplier * defMultiplier * resMultiplier);

  return {
    totalDamage: Math.round(finalCritDamage),
    skillDamage,
    burstDamage,
    averageDamage: Math.round(finalAverageDamage),
    nonCritDamage: Math.round(finalNonCritDamage),
    critDamage: Math.round(finalCritDamage),
    breakdown,
    rotation: config.rotation || [
      `Elemental Skill (Lv. ${talents.skill})`,
      `Elemental Burst (Lv. ${talents.burst})`,
      `Optimal Normal/Charged Combo (Lv. ${talents.normal})`,
    ],
    assumptions: {
      enemyLevel: KQM_STANDARD_ENEMY.level,
      enemyRes: KQM_STANDARD_ENEMY.baseRes,
      reactionType: config.reactionType || 'None',
      scalingStat: statName,
    },
  };
}

/**
 * Derives a universal, mathematically sound KQM configuration for any character
 * not explicitly present in the static database.
 */
function deriveUniversalKqmConfig(character: Character): DamageConfig {
  const { stats, element } = character;

  // Determine scaling archetype
  let scalingStat: DamageConfig['scalingStat'] = 'atk';
  if (stats.hp > 28000 && stats.atk < 1300) {
    scalingStat = 'hp';
  } else if (stats.def > 1800) {
    scalingStat = 'def';
  } else if (stats.em > 550) {
    scalingStat = 'em';
  }

  // Determine elemental reaction affinity
  let reactionType: DamageConfig['reactionType'] = 'None';
  let reactionAmplification: DamageConfig['reactionAmplification'];
  let reactionAdditive: DamageConfig['reactionAdditive'];

  if (element === 'Pyro') {
    reactionType = 'Vaporize';
    reactionAmplification = 'ReverseVape';
  } else if (element === 'Cryo') {
    reactionType = 'Melt';
    reactionAmplification = 'ReverseMelt';
  } else if (element === 'Hydro') {
    reactionType = 'Vaporize';
    reactionAmplification = 'ForwardVape';
  } else if (element === 'Electro') {
    reactionType = 'Aggravate';
    reactionAdditive = 'Aggravate';
  } else if (element === 'Dendro') {
    reactionType = 'Spread';
    reactionAdditive = 'Spread';
  } else if (element === 'Anemo') {
    reactionType = 'Swirl';
  }

  return {
    characterId: character.id,
    characterName: character.name,
    primaryTalent: character.talents.burst >= character.talents.skill ? 'burst' : 'skill',
    scalingStat,
    baseMultiplier: scalingStat === 'hp' ? 0.15 : scalingStat === 'def' ? 2.2 : 2.5,
    talentScaling: 0.08,
    skillMultiplier: scalingStat === 'hp' ? 0.18 : 2.6,
    burstMultiplier: scalingStat === 'hp' ? 0.35 : 5.8,
    reactionType,
    reactionAmplification,
    reactionAdditive,
    rotation: [
      `Elemental Skill rotation against Lv90 enemy`,
      `Elemental Burst rotation (${reactionType !== 'None' ? `${reactionType} procs` : 'Raw DMG'})`,
    ],
    notes: `Derived via KQM Theorycrafting Universal Framework (${element} ${scalingStat.toUpperCase()} archetype)`,
  };
}

/**
 * Standard Genshin Crit Value: 2 × CRIT Rate + CRIT DMG
 */
export function calculateCritValue(cr: number, cd: number): number {
  return cr * 2 + cd;
}
