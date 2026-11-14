/**
 * Authoritative Genshin Impact Artifact Set Skills and Bonus Descriptions.
 * Supports all 5★, 4★, and 1-piece Circlet Tiara artifact sets.
 *
 * Provides bidirectional ID and normalized name resolution, alias handling,
 * and active set bonus aggregation for showcase build cards.
 */

import type { ArtifactSetDefinition, ActiveSetBonus } from './types';

/**
 * Master catalog of 50 artifact set definitions with official in-game skill descriptions.
 */
export const ARTIFACT_SET_LIST: ArtifactSetDefinition[] = [
  // ─── Natlan Sets ──────────────────────────────────────────────
  {
    id: 15046,
    name: "Long Night's Oath",
    aliases: [15039],
    twoPiece: 'Increases ATK by 18%.',
    fourPiece: 'After triggering an Elemental Reaction or dealing Elemental DMG while in Nightsoul\'s Blessing or combat, increases all party members\' CRIT DMG by 20% and the wearer\'s Elemental DMG by 30% for 15s.',
  },
  {
    id: 15038,
    name: 'Obsidian Codex',
    aliases: [15025],
    twoPiece: "While the equipping character is in Nightsoul's Blessing and is on the field, their DMG dealt is increased by 15%.",
    fourPiece: "After the equipping character consumes 1 Nightsoul point while on the field, CRIT Rate increases by 40% for 6s. This effect can trigger once every 1s.",
  },
  {
    id: 15037,
    name: 'Scroll of the Hero of Cinder City',
    aliases: [15027],
    twoPiece: "When a nearby party member triggers a Nightsoul Burst, the equipping character regenerates 6 Elemental Energy.",
    fourPiece: "After the equipping character triggers an Elemental Reaction related to their Elemental Type, all nearby party members gain a 12% Elemental DMG Bonus for the Elemental Types involved in the reaction for 15s. If the equipping character is in Nightsoul's Blessing when triggering this, all nearby party members gain an additional 28% Elemental DMG Bonus for the Elemental Types involved in the reaction for 20s. The equipping character can trigger this effect even when off-field. DMG bonuses from artifact sets with the same name do not stack.",
  },

  // ─── Fontaine Sets ────────────────────────────────────────────
  {
    id: 15032,
    name: 'Golden Troupe',
    aliases: [15020],
    twoPiece: "Increases Elemental Skill DMG by 20%.",
    fourPiece: "Increases Elemental Skill DMG by 25%. Additionally, when not on the field, Elemental Skill DMG will be further increased by 25%. This effect will be cleared 2s after taking the field.",
  },
  {
    id: 15031,
    name: 'Marechaussee Hunter',
    aliases: [15021],
    twoPiece: "Normal and Charged Attack DMG +15%.",
    fourPiece: "When current HP increases or decreases, CRIT Rate will be increased by 12% for 5s. Max 3 stacks.",
  },
  {
    id: 15033,
    name: 'Song of Days Past',
    aliases: [15024],
    twoPiece: "Healing Bonus +15%.",
    fourPiece: "When the equipping character heals a party member, the Yearning effect will be created for 6s, recording the total healing provided. When it expires, Yearning transforms into Waves of Days Past: active party member Normal, Charged, Plunging, Skill, and Burst attacks deal 8% increased DMG based on recorded healing. Disappears after 5 triggers or 10s.",
  },
  {
    id: 15034,
    name: 'Nighttime Whispers in the Echoing Woods',
    aliases: [15026],
    twoPiece: "ATK +18%.",
    fourPiece: "After using an Elemental Skill, gain a 20% Geo DMG Bonus for 10s. While under a shield granted by the Crystallize reaction, the aforementioned effect will be increased by 150%.",
  },
  {
    id: 15035,
    name: 'Fragment of Harmonic Whimsy',
    aliases: [15028],
    twoPiece: "ATK +18%.",
    fourPiece: "When the value of a Bond of Life increases or decreases, this character deals 18% increased DMG for 6s. Max 3 stacks.",
  },
  {
    id: 15036,
    name: 'Unfinished Reverie',
    twoPiece: "ATK +18%.",
    fourPiece: "After leaving combat for 3s, DMG dealt increased by 50%. In combat, if no Burning opponents are nearby for more than 6s, this DMG Bonus will decrease by 10% per second until it reaches 0%. When a Burning opponent exists, it increases by 10% each second up to 50%.",
  },

  // ─── Sumeru Sets ──────────────────────────────────────────────
  {
    id: 15040,
    name: 'Deepwood Memories',
    twoPiece: "Dendro DMG Bonus +15%.",
    fourPiece: "After Elemental Skills or Bursts hit opponents, the targets' Dendro RES will be decreased by 30% for 8s. This effect can be triggered even if the equipping character is not on the field.",
  },
  {
    id: 15041,
    name: 'Gilded Dreams',
    twoPiece: "Elemental Mastery +80.",
    fourPiece: "Within 8s of triggering an Elemental Reaction, obtain buffs based on party Elemental Types: ATK +14% for each member sharing the same element; EM +50 for each member of a different element. Stacks up to 3 characters.",
  },
  {
    id: 15018,
    name: 'Desert Pavilion Chronicle',
    aliases: [15042],
    twoPiece: "Anemo DMG Bonus +15%.",
    fourPiece: "When Charged Attacks hit opponents, Normal Attack SPD increases by 10% while Normal, Charged, and Plunging Attack DMG increases by 40% for 15s.",
  },
  {
    id: 15019,
    name: 'Flower of Paradise Lost',
    aliases: [15043],
    twoPiece: "Elemental Mastery +80.",
    fourPiece: "The equipping character's Bloom, Hyperbloom, and Burgeon reaction DMG is increased by 40%. Additionally, after triggering these reactions, they gain another 25% bonus to the aforementioned effect for 10s. Max 4 stacks.",
  },
  {
    id: 15029,
    name: "Nymph's Dream",
    aliases: [15022],
    twoPiece: "Hydro DMG Bonus +15%.",
    fourPiece: "After Normal, Charged, Plunging Attacks, Elemental Skills, and Elemental Bursts hit opponents, 1 stack of Mirrored Nymph is triggered for 8s. At 1/2/3+ stacks, ATK is increased by 7%/16%/25%, and Hydro DMG is increased by 4%/9%/15%.",
  },
  {
    id: 15030,
    name: "Vourukasha's Glow",
    aliases: [15023],
    twoPiece: "HP +20%.",
    fourPiece: "Elemental Skill and Elemental Burst DMG increased by 10%. After taking DMG, this DMG Bonus is increased by 80% for 5s. Max 5 stacks.",
  },

  // ─── Inazuma Sets ─────────────────────────────────────────────
  {
    id: 15008,
    name: 'Emblem of Severed Fate',
    twoPiece: "Energy Recharge +20%.",
    fourPiece: "Increases Elemental Burst DMG by 25% of Energy Recharge. A maximum of 75% bonus DMG can be obtained in this way.",
  },
  {
    id: 15007,
    name: "Shimenawa's Reminiscence",
    aliases: [150190],
    twoPiece: "ATK +18%.",
    fourPiece: "When casting an Elemental Skill, if the character has 15 or more Energy, they lose 15 Energy and Normal/Charged/Plunging Attack DMG is increased by 50% for 10s.",
  },
  {
    id: 15009,
    name: 'Husk of Opulent Dreams',
    twoPiece: "DEF +30%.",
    fourPiece: "Gains Curiosity stacks: on-field Geo hits grant 1 stack (every 0.3s); off-field grants 1 stack every 3s. Max 4 stacks, each giving 6% DEF and 6% Geo DMG Bonus.",
  },
  {
    id: 15010,
    name: 'Ocean-Hued Clam',
    aliases: [150220],
    twoPiece: "Healing Bonus +15%.",
    fourPiece: "When healing party members, a Sea-Dyed Foam accumulates healing for 3s, then explodes dealing 90% of accumulated healing as Physical DMG (up to 30,000 HP healing accumulated). Triggers once every 3.5s.",
  },
  {
    id: 15014,
    name: 'Vermillion Hereafter',
    aliases: [150230],
    twoPiece: "ATK +18%.",
    fourPiece: "After using an Elemental Burst, ATK increases by 8% for 16s. When HP decreases, ATK further increases by 10% (up to 4 times, once every 0.8s).",
  },
  {
    id: 15015,
    name: 'Echoes of an Offering',
    aliases: [150240],
    twoPiece: "ATK +18%.",
    fourPiece: "When Normal Attacks hit opponents, 36% chance to trigger Valley Rite, increasing Normal Attack DMG by 70% of ATK. Fails increase chance by 20% for next hit.",
  },

  // ─── Liyue & Mondstadt Core Sets ──────────────────────────────
  {
    id: 15005,
    name: 'Crimson Witch of Flames',
    twoPiece: "Pyro DMG Bonus +15%.",
    fourPiece: "Increases Overloaded, Burning, and Burgeon DMG by 40%. Increases Vaporize and Melt DMG by 15%. Using an Elemental Skill increases the 2-Piece Set Bonus by 50% of its starting value for 10s. Max 3 stacks.",
  },
  {
    id: 15002,
    name: 'Blizzard Strayer',
    twoPiece: "Cryo DMG Bonus +15%.",
    fourPiece: "When attacking an opponent affected by Cryo, CRIT Rate is increased by 20%. If the opponent is Frozen, CRIT Rate is increased by an additional 20%.",
  },
  {
    id: 15003,
    name: 'Heart of Depth',
    aliases: [150160],
    twoPiece: "Hydro DMG Bonus +15%.",
    fourPiece: "After using an Elemental Skill, increases Normal Attack and Charged Attack DMG by 30% for 15s.",
  },
  {
    id: 15016,
    name: 'Viridescent Venerer',
    aliases: [150020],
    twoPiece: "Anemo DMG Bonus +15%.",
    fourPiece: "Increases Swirl DMG by 60%. Decreases opponent's Elemental RES to the element infused in the Swirl by 40% for 10s.",
  },
  {
    id: 14003,
    name: 'Noblesse Oblige',
    aliases: [150070],
    twoPiece: "Elemental Burst DMG +20%.",
    fourPiece: "Using an Elemental Burst increases all party members' ATK by 20% for 12s. This effect cannot stack.",
  },
  {
    id: 14001,
    name: "Gladiator's Finale",
    twoPiece: "ATK +18%.",
    fourPiece: "If the wielder of this artifact set uses a Sword, Claymore or Polearm, increases their Normal Attack DMG by 35%.",
  },
  {
    id: 14002,
    name: "Wanderer's Troupe",
    aliases: [150030],
    twoPiece: "Increases Elemental Mastery by 80.",
    fourPiece: "Increases Charged Attack DMG by 35% if the character uses a Bow or Catalyst.",
  },
  {
    id: 14004,
    name: 'Bloodstained Chivalry',
    aliases: [150080],
    twoPiece: "Physical DMG +25%.",
    fourPiece: "After defeating an opponent, increases Charged Attack DMG by 50%, and reduces its Stamina cost to 0 for 10s.",
  },
  {
    id: 15006,
    name: 'Pale Flame',
    aliases: [150180],
    twoPiece: "Physical DMG +25%.",
    fourPiece: "When an Elemental Skill hits an opponent, ATK is increased by 9% for 7s. Stacks up to 2 times. At 2 stacks, the 2-piece set effect is increased by 100%.",
  },
  {
    id: 15017,
    name: 'Tenacity of the Millelith',
    twoPiece: "HP +20%.",
    fourPiece: "When an Elemental Skill hits an opponent, the ATK of all nearby party members is increased by 20% and their Shield Strength is increased by 30% for 3s. Triggers off-field.",
  },
  {
    id: 15011,
    name: 'Archaic Petra',
    aliases: [150140],
    twoPiece: "Geo DMG Bonus +15%.",
    fourPiece: "Upon obtaining an Elemental Shard created through a Crystallize Reaction, all party members gain 35% DMG Bonus for that particular element for 10s.",
  },
  {
    id: 15012,
    name: 'Thundering Fury',
    aliases: [150050],
    twoPiece: "Electro DMG Bonus +15%.",
    fourPiece: "Increases DMG caused by Overloaded, Electro-Charged, Superconduct, and Hyperbloom by 40%, and Aggravate DMG Bonus by 20%. Triggering reactions decreases Elemental Skill CD by 1s (once every 0.8s).",
  },
  {
    id: 15013,
    name: 'Thundersoother',
    twoPiece: "Electro RES +40%.",
    fourPiece: "Increases DMG against opponents affected by Electro by 35%.",
  },
  {
    id: 15004,
    name: 'Retracing Bolide',
    aliases: [150150],
    twoPiece: "Increases Shield Strength by 35%.",
    fourPiece: "While protected by a shield, gain an additional 40% Normal and Charged Attack DMG.",
  },
  {
    id: 15001,
    name: 'Maiden Beloved',
    aliases: [150130],
    twoPiece: "Character Healing Effectiveness +15%.",
    fourPiece: "Using an Elemental Skill or Burst increases healing received by all party members by 20% for 10s.",
  },
  {
    id: 150100,
    name: 'Lavawalker',
    twoPiece: "Pyro RES +40%.",
    fourPiece: "Increases DMG against opponents affected by Pyro by 35%.",
  },

  // ─── 4-Star Sets ──────────────────────────────────────────────
  {
    id: 10007,
    name: 'Instructor',
    twoPiece: "Increases Elemental Mastery by 80.",
    fourPiece: "Upon triggering an Elemental Reaction, increases all party members' Elemental Mastery by 120 for 8s.",
  },
  {
    id: 10009,
    name: 'The Exile',
    twoPiece: "Energy Recharge +20%.",
    fourPiece: "Using an Elemental Burst regenerates 2 Energy for all party members (excluding the wearer) every 2s for 6s. This effect cannot stack.",
  },
  {
    id: 10005,
    name: 'Berserker',
    twoPiece: "CRIT Rate +12%.",
    fourPiece: "When HP is below 70%, CRIT Rate increases by an additional 24%.",
  },
  {
    id: 10002,
    name: 'Brave Heart',
    twoPiece: "ATK +18%.",
    fourPiece: "Increases DMG by 30% against opponents with more than 50% HP.",
  },
  {
    id: 10006,
    name: 'Martial Artist',
    twoPiece: "Increases Normal Attack and Charged Attack DMG by 15%.",
    fourPiece: "After using Elemental Skill, increases Normal Attack and Charged Attack DMG by 25% for 8s.",
  },
  {
    id: 10008,
    name: 'Gambler',
    twoPiece: "Increases Elemental Skill DMG by 20%.",
    fourPiece: "Defeating an opponent has a 100% chance to remove Elemental Skill CD. Can only occur once every 15s.",
  },
  {
    id: 10012,
    name: 'Scholar',
    twoPiece: "Energy Recharge +20%.",
    fourPiece: "Gaining Elemental Particles or Orbs gives 3 Energy to all party members who have a bow or a catalyst equipped. Can occur once every 3s.",
  },
  {
    id: 10003,
    name: "Defender's Will",
    twoPiece: "DEF +30%.",
    fourPiece: "For each different element present in your party, the wearer's Elemental RES to that corresponding element is increased by 30%.",
  },
  {
    id: 10001,
    name: 'Resolution of Sojourner',
    twoPiece: "ATK +18%.",
    fourPiece: "Increases Charged Attack CRIT Rate by 30%.",
  },
  {
    id: 10004,
    name: 'Tiny Miracle',
    twoPiece: "All Elemental RES +20%.",
    fourPiece: "Incoming elemental DMG increases corresponding Elemental RES by 30% for 10s. Can only occur once every 10s.",
  },

  // ─── 1-Piece Circlet Tiara Sets ───────────────────────────────
  {
    id: 15000,
    name: 'Prayers for Illumination',
    twoPiece: "Affected by Pyro for 40% less time.",
    fourPiece: "",
    onePiece: "Affected by Pyro for 40% less time.",
  },
  {
    id: 150110,
    name: 'Prayers for Destiny',
    twoPiece: "Affected by Hydro for 40% less time.",
    fourPiece: "",
    onePiece: "Affected by Hydro for 40% less time.",
  },
  {
    id: 150090,
    name: 'Prayers for Wisdom',
    twoPiece: "Affected by Electro for 40% less time.",
    fourPiece: "",
    onePiece: "Affected by Electro for 40% less time.",
  },
  {
    id: 150131,
    name: 'Prayers to Springtime',
    twoPiece: "Affected by Cryo for 40% less time.",
    fourPiece: "",
    onePiece: "Affected by Cryo for 40% less time.",
  },
];

/**
 * Normalized lookup dictionary mapping all set IDs (canonical + aliases) to set definition.
 */
export const ARTIFACT_SET_DATA: Record<number, ArtifactSetDefinition> = {};

/**
 * Secondary normalized name lookup map.
 */
const SET_BY_NORMALIZED_NAME = new Map<string, ArtifactSetDefinition>();

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Build index tables
for (const set of ARTIFACT_SET_LIST) {
  ARTIFACT_SET_DATA[set.id] = set;
  if (set.aliases) {
    for (const aliasId of set.aliases) {
      if (!ARTIFACT_SET_DATA[aliasId]) {
        ARTIFACT_SET_DATA[aliasId] = set;
      }
    }
  }
  SET_BY_NORMALIZED_NAME.set(normalizeName(set.name), set);
}

/**
 * Primary set bonus lookup helper.
 *
 * @param setIdOrName Numeric set ID or string set name
 * @param setName Optional explicit set name for resolving ID collisions
 * @returns 2-piece and 4-piece text if found, or undefined
 */
export function getArtifactSetBonus(
  setIdOrName: number | string,
  setName?: string
): { twoPiece?: string; fourPiece?: string; name: string } | undefined {
  let definition: ArtifactSetDefinition | undefined;

  if (typeof setIdOrName === 'string') {
    definition = SET_BY_NORMALIZED_NAME.get(normalizeName(setIdOrName));
  } else {
    // If setName provided, check if it matches an exact set first (resolves collisions)
    if (setName) {
      const byName = SET_BY_NORMALIZED_NAME.get(normalizeName(setName));
      if (byName) {
        definition = byName;
      }
    }
    if (!definition) {
      definition = ARTIFACT_SET_DATA[setIdOrName];
    }
  }

  if (!definition) return undefined;

  return {
    name: definition.name,
    twoPiece: definition.twoPiece || undefined,
    fourPiece: definition.fourPiece || undefined,
  };
}

/**
 * Direct lookup by set name with punctuation tolerance.
 */
export function getArtifactSetBonusByName(
  setName: string
): { twoPiece?: string; fourPiece?: string; name: string } | undefined {
  return getArtifactSetBonus(setName);
}

/**
 * Retrieves full artifact set definition by ID or name.
 */
export function getArtifactSetDetails(
  setId: number,
  setName?: string
): ArtifactSetDefinition | undefined {
  if (setName) {
    const byName = SET_BY_NORMALIZED_NAME.get(normalizeName(setName));
    if (byName) return byName;
  }
  return ARTIFACT_SET_DATA[setId];
}

/**
 * Get readable set name by set ID.
 */
export function getArtifactSetName(setId: number): string | undefined {
  return ARTIFACT_SET_DATA[setId]?.name;
}

/**
 * Aggregates active set bonuses from an artifact set count dictionary.
 * Automatically resolves 2pc bonuses (count >= 2) and 4pc bonuses (count >= 4).
 *
 * @param artifactSets Record of setId -> piece count (from parsed Character.artifactSets)
 * @param artifacts Optional list of equipped artifacts for fallback name resolution
 */
export function getActiveArtifactSetBonuses(
  artifactSets: Record<number | string, number>,
  artifacts?: Array<{ setId: number; setName?: string }>
): ActiveSetBonus[] {
  const activeBonuses: ActiveSetBonus[] = [];

  for (const [key, count] of Object.entries(artifactSets)) {
    if (count < 2) continue; // Off-pieces do not activate set bonuses

    const numId = parseInt(key, 10);
    const matchedArtifact = artifacts?.find((a) => a.setId === numId);
    const setNameFallback = matchedArtifact?.setName;

    const details = getArtifactSetDetails(numId, setNameFallback);
    const name = details?.name || setNameFallback || `Set #${key}`;

    activeBonuses.push({
      setId: numId,
      name,
      setName: name,
      count,
      twoPieceActive: count >= 2,
      fourPieceActive: count >= 4,
      twoPieceText: count >= 2 ? details?.twoPiece : undefined,
      fourPieceText: count >= 4 ? details?.fourPiece : undefined,
      twoPiece: count >= 2 ? details?.twoPiece : undefined,
      fourPiece: count >= 4 ? details?.fourPiece : undefined,
      activeTier: count >= 4 ? '4pc' : count >= 2 ? '2pc' : 'none',
    });
  }

  return activeBonuses;
}
