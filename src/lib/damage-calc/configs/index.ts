// Character damage calculation configurations
// Each config defines how to calculate "optimal rotation" damage for leaderboard comparison

export interface DamageConfig {
  characterId: number;
  characterName: string;
  primaryTalent: 'normal' | 'skill' | 'burst';
  baseMultiplier: number; // Base talent multiplier at level 1
  talentScaling?: number; // Scaling per talent level (default 0.08)
  reactionType?: string; // 'Vaporize', 'Melt', etc.
  reactionMultiplier?: number; // 1.5 or 2.0 for amplifying reactions
  additionalMultipliers?: Record<string, number>; // Passive talents, weapon effects, etc.
  rotation?: string[]; // Human-readable rotation steps
  notes?: string;
}

export const damageConfigs: Record<number, DamageConfig> = {
  // Hu Tao - Vaporize CA combo
  10000046: {
    characterId: 10000046,
    characterName: 'Hu Tao',
    primaryTalent: 'normal',
    baseMultiplier: 2.43, // CA multiplier at level 1
    talentScaling: 0.09,
    reactionType: 'Vaporize',
    reactionMultiplier: 1.5,
    additionalMultipliers: {
      'E Skill ATK Bonus': 1.05, // Simplified HP scaling bonus
      'A4 Passive (low HP)': 1.33,
    },
    rotation: [
      'E → N1C (repeat) with Vaporize',
      'Assumes <50% HP for A4 passive',
    ],
    notes: 'Calculated as single vaporized charged attack with typical buffs',
  },

  // Neuvillette - Charged Attack
  10000087: {
    characterId: 10000087,
    characterName: 'Neuvillette',
    primaryTalent: 'normal',
    baseMultiplier: 3.68, // Empowered CA at level 1
    talentScaling: 0.095,
    additionalMultipliers: {
      'HP Scaling': 1.08, // Simplified HP bonus
    },
    rotation: [
      'E → CA (charged) → CA (charged)',
      'Full charge empowered attacks',
    ],
    notes: 'Single empowered charged attack with HP scaling',
  },

  // Arlecchino - Normal Attack combo
  10000093: {
    characterId: 10000093,
    characterName: 'Arlecchino',
    primaryTalent: 'normal',
    baseMultiplier: 2.15,
    talentScaling: 0.087,
    additionalMultipliers: {
      'Bond of Life Bonus': 1.40, // Passive DMG bonus
    },
    rotation: [
      'E → N5 combo with Bond of Life stacks',
    ],
    notes: 'Normal attack combo with Bond of Life DMG bonus',
  },

  // Raiden Shogun - Burst combo
  10000052: {
    characterId: 10000052,
    characterName: 'Raiden Shogun',
    primaryTalent: 'burst',
    baseMultiplier: 4.21, // Initial hit + resolve stacks
    talentScaling: 0.093,
    additionalMultipliers: {
      'Resolve Stacks': 1.60, // Max resolve bonus
      'E Skill Bonus': 1.27,
    },
    rotation: [
      'Q → N3C combo',
      'Assumes max resolve stacks',
    ],
    notes: 'Burst initial hit + normal attacks during Musou Isshin',
  },

  // Ayaka - Burst
  10000042: {
    characterId: 10000042,
    characterName: 'Ayaka',
    primaryTalent: 'burst',
    baseMultiplier: 18.95, // All 19 ticks hitting (ideal)
    talentScaling: 0.085,
    reactionType: 'Freeze',
    additionalMultipliers: {
      'Cryo RES Shred': 1.075, // From 4pc Blizzard
      'Freeze Crit': 1.15, // Crit boost from freeze
    },
    rotation: [
      'Dash → Q (all ticks hit)',
      'Assumes frozen enemy',
    ],
    notes: 'Full burst damage assuming all ticks hit frozen enemy',
  },

  // Ganyu - Charged Attack (Bloom)
  10000037: {
    characterId: 10000037,
    characterName: 'Ganyu',
    primaryTalent: 'normal',
    baseMultiplier: 3.92, // Frostflake Arrow + Bloom combined
    talentScaling: 0.082,
    reactionType: 'Melt',
    reactionMultiplier: 2.0,
    rotation: [
      'CA (Frostflake + Bloom) with Melt',
    ],
    notes: 'Single melted charged attack (arrow + bloom)',
  },

  // Xiao - Plunge Damage
  10000015: {
    characterId: 10000015,
    characterName: 'Xiao',
    primaryTalent: 'burst',
    baseMultiplier: 13.56, // Plunge damage multiplier at level 1
    talentScaling: 0.09,
    reactionType: 'Swirl',
    additionalMultipliers: {
      'Lemmings Buff': 1.25, // 4pc Viridescent Venerer bonus
      'A4 Passive': 1.15, // Increased DMG based on party's elemental types
    },
    rotation: [
      'E → N3D (plunge)',
      'Assumes optimal plunging',
    ],
    notes: 'Plunge damage during burst with swirl reaction bonus',
  },

  // Yoimiya - Normal Attack
  10000056: {
    characterId: 10000056,
    characterName: 'Yoimiya',
    primaryTalent: 'normal',
    baseMultiplier: 3.45, // Normal attack combo multiplier
    talentScaling: 0.088,
    reactionType: 'Melt',
    reactionMultiplier: 2.0,
    additionalMultipliers: {
      'A4 Passive': 1.20, // ATK buff based on party's elemental types
      'Nintendo Switch': 1.10, // Attack speed buff (simplified)
    },
    rotation: [
      'E → N5C (Melt)',
      'Normal attack chain with melt reactions',
    ],
    notes: 'Normal attack combo with melt reactions and attack speed buff',
  },
};

// Helper to check if a character has damage config
export function hasDamageConfig(characterId: number): boolean {
  return characterId in damageConfigs;
}

// Get all configured character IDs
export function getConfiguredCharacters(): number[] {
  return Object.keys(damageConfigs).map(Number);
}
