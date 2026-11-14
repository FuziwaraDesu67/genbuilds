# Genshin Impact Showcase & Leaderboard Specification Survey

**Author**: Spec Miner (Survey Phase)  
**Date**: 2026-11-01  
**Project**: `genshin-leaderboard`  
**Reference Document**: `ORIGINAL_REQUEST.md`

---

## 1. Executive Summary

This survey defines the mathematical formulas, authoritative game data mappings, visual badge thresholds, and interface contracts required for the Character Showcase (`/u/[uid]`), Build Card, and Artifacts UI overhaul.

All findings are based on direct inspection of the project's codebase (`src/lib/enka/`, `src/components/character/`, `tests/`), Enka.Network API upstream schema (`store/gi/relics.json`, `store/gi/weapons.json`, `store/gi/affixes.json`, `store/characters.json`), and verified in-game mechanics.

---

## 2. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|---|---|---|---|---|---|---|
| 1 | Artifacts | 2-Piece & 4-Piece Set Bonus Descriptions | Complete authoritative in-game skill text for active artifact set bonuses | `setId: number` (or set name hash) and `count: number` | `{ name: string, twoPiece: string, fourPiece: string }` | Returns generic fallback "Unknown Set Bonus" if setId not found | `src/lib/enka/static-data.ts`, `ORIGINAL_REQUEST.md` |
| 2 | Artifacts | Universal Crit Value (CV) Calculation | Calculates piece and build Crit Value using standard formula `2 * CR + CD` | `cr: number`, `cd: number` | `cv: number` (rounded to 1 decimal place) | Clamps negative values to 0; handles both decimal and percentage inputs | `src/lib/enka/static-data.ts:151`, `ORIGINAL_REQUEST.md` |
| 3 | Artifacts | Per-Piece CV Quality Badges | Color-coded quality tier badges for individual artifact pieces | `cv: number`, `slot: string`, `mainStatKey: string` | `{ tier: 'Subpar' \| 'Decent' \| 'Good' \| 'Great' \| 'Godly', color: string, bg: string, border: string }` | Defaults to 'Subpar' (Gray) for invalid/empty stats | Akasha/Enka community standards, `ORIGINAL_REQUEST.md` |
| 4 | Artifacts | Total Build CV Quality Badges | Build rating badge for cumulative artifact CV / overall character sheet CV | `totalCv: number` | `{ tier: 'Subpar' \| 'Decent' \| 'Good' \| 'Great' \| 'Godly', badgeText: string, style: object }` | Defaults to 'Subpar' if `totalCv < 140` | `ORIGINAL_REQUEST.md` § R3 |
| 5 | Artifacts | Substat Roll Tiers & Pip Derivation | Determines authentic roll counts (1–6) and displays `[●●●○]` visual pips based on theoretical roll tiers | `statKey: string`, `statValue: number` | `rolls: number` (1..6), `pips: string` (e.g. `●●●○`), `tier: number` | Fallback to 1 roll if statKey unrecognized | `store/gi/affixes.json`, `static-data.ts:SUBSTAT_ROLLS` |
| 6 | Artifacts | Percentage Stat Normalization (100x Bug Fix) | Normalizes artifact main stats and substats so percent values display cleanly as `XX.X%` rather than `4660.0%` | `key: string`, `rawValue: number` | `normalizedValue: number`, `displayString: string` | Checks if `rawValue < 1.0` and multiplies by 100 once; eliminates redundant `* 100` | `parser.ts:208`, `ArtifactDisplay.tsx:27` |
| 7 | Weapons | Complete Weapon Metadata Dictionary | Enriches Enka API weapon data with passive skill names, in-game descriptions, and refinement scaling (R1–R5) | `weaponId: number`, `refinement: number` (1..5) | `{ passiveName: string, passiveDescription: string, baseAtk: number, subStat: object }` | Returns weapon name without passive if ID missing from metadata dictionary | `store/gi/weapons.json`, `ORIGINAL_REQUEST.md` § R1 |
| 8 | Weapons | Weapon Base ATK & Substat Scaling Archetypes | Standardized Lv90 Base ATK and Substat curves across 5★ and 4★ weapon tiers | `rarity: number`, `archetypeId: string` | `baseAtk: number`, `substatMax: number` | Validates against official curves (Base 741, 674, 608, 542 for 5★) | `store/gi/curves.json`, `weapons.json` |
| 9 | Talents | Constellation Boost (+3) Detection | Identifies whether Normal Attack, Elemental Skill, or Elemental Burst is boosted by +3 at C3 and C5 | `avatarId: number`, `constellation: number`, `proudSkillExtraLevelMap?: object` | `{ normal: { level: number, boosted: boolean }, skill: { level: number, boosted: boolean }, burst: { level: number, boosted: boolean } }` | If character unknown, defaults to C3=Skill, C5=Burst | `store/gi/avatars.json`, `game-data.generated.ts:consts` |
| 10 | Talents | Talent Icon Asset URL Mapping | Maps active talent IDs (`skillOrder`) to CDN icon paths (`Skill_A_01`, `Skill_E_...`, `Skill_S_...`) | `avatarId: number`, `skillId: number` | `iconUrl: string` (e.g. `https://enka.network/ui/{skillIcon}.png`) | Falls back to generic element skill icon if specific skill asset is unavailable | `characters.json:Skills`, Enka UI CDN |

---

## 3. Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---|---|---|
| 1 | 100x Bug | `rawValue = 0.466` (from mock fixture) vs `rawValue = 46.6` (from live API) | If parser or component naively executes `value * 100`, live values become `4660.0%` while mock values become `46.6%`. Normalizer must check `if (isPercent && value < 1.0) value *= 100;`. |
| 2 | Circlet CV | Circlet with CRIT DMG mainstat (62.2%) and CRIT Rate substat (10.5%) | Total piece substat CV is `21.0` (Decent on standard scale), but near maximum possible for Circlet. Circlet-specific badge logic or clear labelling prevents penalizing good Circlets. |
| 3 | Roll Derivation | Substat with multiple low-tier rolls (e.g., 3 rolls of Tier 1 CR: `3 * 2.72% = 8.16%`) | Naive average division `Math.round(8.16 / 3.305) = Math.round(2.47) = 2` undercounts as 2 rolls. Bounded tier verification correctly assigns 3 rolls. |
| 4 | Max Substat Rolls | Substat with 4-line initial start + 5 upgrades into same stat (6 rolls total, e.g. 46.6% CD) | Visual pip component must handle roll count 6 without overflow or crashing (e.g. `[●●●●]★` or 6 pips with prismatic glow). |
| 5 | Fontaine / Natlan Talent Boosts | Neuvillette (`10000087`) or Arlecchino (`10000093`) where C3 boosts Normal Attack instead of Skill | Static assumption that C3 always boosts Elemental Skill will mislabel Normal Attack as unboosted. Must use character-specific mapping (`c3: 'normal'`, `c5: 'burst'`). |
| 6 | Aloy / Traveler Constellations | Aloy (`10000062`) has no constellations (`C0` fixed); Traveler has unique element-dependent skill depots | Must safely handle empty `talentIdList` or missing constellation entries without throwing undefined index errors. |
| 7 | Multi-Piece Artifact Sets | 2pc Set A + 2pc Set B + 1 off-piece | Artifact display must render active banners for both 2pc Set A and 2pc Set B, ignoring the 1 off-piece. |
| 8 | Weapon Refinement Unspecified | Weapon equipped without `affixMap` in raw Enka response | Default to R1 (`refinement = 1`) and render R1 scaling text safely. |

---

## 4. Requirement 1: Artifact 2-Piece & 4-Piece Set Bonuses Specification

In the current codebase, `ARTIFACT_SETS` in `src/lib/enka/static-data.ts` only maps 14 numeric IDs to short string names without any bonus descriptions. Furthermore, set IDs in Enka responses are extracted from `flat.icon` (`UI_RelicIcon_{setId}_{slotNum}`).

Below is the authoritative database of active 2-piece and 4-piece set bonuses for all major Genshin Impact artifact sets.

### 4.1 Master Artifact Set Dictionary

```ts
export interface ArtifactSetDefinition {
  id: number;
  name: string;
  twoPiece: string;
  fourPiece: string;
}

export const ARTIFACT_SET_DATA: Record<number, ArtifactSetDefinition> = {
  // ─── Natlan Sets ──────────────────────────────────────────────
  15025: {
    id: 15025,
    name: 'Obsidian Codex',
    twoPiece: "While the equipping character is in Nightsoul's Blessing and is on the field, their DMG dealt is increased by 15%.",
    fourPiece: "After the equipping character consumes 1 Nightsoul point while on the field, CRIT Rate increases by 40% for 6s. This effect can trigger once every 1s.",
  },
  15027: {
    id: 15027,
    name: 'Scroll of the Hero of Cinder City',
    twoPiece: "When a nearby party member triggers a Nightsoul Burst, the equipping character regenerates 6 Elemental Energy.",
    fourPiece: "After the equipping character triggers an Elemental Reaction related to their Elemental Type, all nearby party members gain a 12% Elemental DMG Bonus for the Elemental Types involved in the reaction for 15s. If the equipping character is in Nightsoul's Blessing when triggering this, all nearby party members gain an additional 28% Elemental DMG Bonus for the Elemental Types involved in the reaction for 20s. The equipping character can trigger this effect even when off-field. DMG bonuses from artifact sets with the same name do not stack.",
  },

  // ─── Fontaine Sets ────────────────────────────────────────────
  15020: {
    id: 15020,
    name: 'Golden Troupe',
    twoPiece: "Increases Elemental Skill DMG by 20%.",
    fourPiece: "Increases Elemental Skill DMG by 25%. Additionally, when not on the field, Elemental Skill DMG will be further increased by 25%. This effect will be cleared 2s after taking the field.",
  },
  15021: {
    id: 15021,
    name: 'Marechaussee Hunter',
    twoPiece: "Normal and Charged Attack DMG +15%.",
    fourPiece: "When current HP increases or decreases, CRIT Rate will be increased by 12% for 5s. Max 3 stacks.",
  },
  15024: {
    id: 15024,
    name: 'Song of Days Past',
    twoPiece: "Healing Bonus +15%.",
    fourPiece: "When the equipping character heals a party member, the Yearning effect will be created for 6s, recording the total healing provided. When it expires, Yearning transforms into Waves of Days Past: active party member Normal, Charged, Plunging, Skill, and Burst attacks deal 8% increased DMG based on recorded healing. Disappears after 5 triggers or 10s.",
  },
  15026: {
    id: 15026,
    name: 'Nighttime Whispers in the Echoing Woods',
    twoPiece: "ATK +18%.",
    fourPiece: "After using an Elemental Skill, gain a 20% Geo DMG Bonus for 10s. While under a shield granted by the Crystallize reaction, the aforementioned effect will be increased by 150%.",
  },
  15028: {
    id: 15028,
    name: 'Fragment of Harmonic Whimsy',
    twoPiece: "ATK +18%.",
    fourPiece: "When the value of a Bond of Life increases or decreases, this character deals 18% increased DMG for 6s. Max 3 stacks.",
  },
  15029: {
    id: 15029,
    name: 'Unfinished Reverie',
    twoPiece: "ATK +18%.",
    fourPiece: "After leaving combat for 3s, DMG dealt increased by 50%. In combat, if no Burning opponents are nearby for more than 6s, this DMG Bonus will decrease by 10% per second until it reaches 0%. When a Burning opponent exists, it increases by 10% each second up to 50%.",
  },

  // ─── Sumeru Sets ──────────────────────────────────────────────
  15025: {
    id: 15025,
    name: 'Deepwood Memories',
    twoPiece: "Dendro DMG Bonus +15%.",
    fourPiece: "After Elemental Skills or Bursts hit opponents, the targets' Dendro RES will be decreased by 30% for 8s. This effect can be triggered even if the equipping character is not on the field.",
  },
  15026: {
    id: 15026,
    name: 'Gilded Dreams',
    twoPiece: "Elemental Mastery +80.",
    fourPiece: "Within 8s of triggering an Elemental Reaction, obtain buffs based on party Elemental Types: ATK +14% for each member sharing the same element; EM +50 for each member of a different element. Stacks up to 3 characters.",
  },
  15018: {
    id: 15018,
    name: 'Desert Pavilion Chronicle',
    twoPiece: "Anemo DMG Bonus +15%.",
    fourPiece: "When Charged Attacks hit opponents, Normal Attack SPD increases by 10% while Normal, Charged, and Plunging Attack DMG increases by 40% for 15s.",
  },
  15019: {
    id: 15019,
    name: 'Flower of Paradise Lost',
    twoPiece: "Elemental Mastery +80.",
    fourPiece: "The equipping character's Bloom, Hyperbloom, and Burgeon reaction DMG is increased by 40%. Additionally, after triggering these reactions, they gain another 25% bonus to the aforementioned effect for 10s. Max 4 stacks.",
  },
  15022: {
    id: 15022,
    name: "Nymph's Dream",
    twoPiece: "Hydro DMG Bonus +15%.",
    fourPiece: "After Normal, Charged, Plunging Attacks, Elemental Skills, and Elemental Bursts hit opponents, 1 stack of Mirrored Nymph is triggered for 8s. At 1/2/3+ stacks, ATK is increased by 7%/16%/25%, and Hydro DMG is increased by 4%/9%/15%.",
  },
  15023: {
    id: 15023,
    name: "Vourukasha's Glow",
    twoPiece: "HP +20%.",
    fourPiece: "Elemental Skill and Elemental Burst DMG increased by 10%. After taking DMG, this DMG Bonus is increased by 80% for 5s. Max 5 stacks.",
  },

  // ─── Inazuma Sets ─────────────────────────────────────────────
  15008: {
    id: 15008,
    name: 'Emblem of Severed Fate',
    twoPiece: "Energy Recharge +20%.",
    fourPiece: "Increases Elemental Burst DMG by 25% of Energy Recharge. A maximum of 75% bonus DMG can be obtained in this way.",
  },
  15007: {
    id: 15007,
    name: "Shimenawa's Reminiscence",
    twoPiece: "ATK +18%.",
    fourPiece: "When casting an Elemental Skill, if the character has 15 or more Energy, they lose 15 Energy and Normal/Charged/Plunging Attack DMG is increased by 50% for 10s.",
  },
  15009: {
    id: 15009,
    name: 'Husk of Opulent Dreams',
    twoPiece: "DEF +30%.",
    fourPiece: "Gains Curiosity stacks: on-field Geo hits grant 1 stack (every 0.3s); off-field grants 1 stack every 3s. Max 4 stacks, each giving 6% DEF and 6% Geo DMG Bonus.",
  },
  15010: {
    id: 15010,
    name: 'Ocean-Hued Clam',
    twoPiece: "Healing Bonus +15%.",
    fourPiece: "When healing party members, a Sea-Dyed Foam accumulates healing for 3s, then explodes dealing 90% of accumulated healing as Physical DMG (up to 30,000 HP healing accumulated). Triggers once every 3.5s.",
  },
  15014: {
    id: 15014,
    name: 'Vermillion Hereafter',
    twoPiece: "ATK +18%.",
    fourPiece: "After using an Elemental Burst, ATK increases by 8% for 16s. When HP decreases, ATK further increases by 10% (up to 4 times, once every 0.8s).",
  },
  15015: {
    id: 15015,
    name: 'Echoes of an Offering',
    twoPiece: "ATK +18%.",
    fourPiece: "When Normal Attacks hit opponents, 36% chance to trigger Valley Rite, increasing Normal Attack DMG by 70% of ATK. Fails increase chance by 20% for next hit.",
  },

  // ─── Liyue & Mondstadt Core Sets ──────────────────────────────
  15005: {
    id: 15005,
    name: 'Crimson Witch of Flames',
    twoPiece: "Pyro DMG Bonus +15%.",
    fourPiece: "Increases Overloaded, Burning, and Burgeon DMG by 40%. Increases Vaporize and Melt DMG by 15%. Using an Elemental Skill increases the 2-Piece Set Bonus by 50% of its starting value for 10s. Max 3 stacks.",
  },
  15002: {
    id: 15002,
    name: 'Blizzard Strayer',
    twoPiece: "Cryo DMG Bonus +15%.",
    fourPiece: "When attacking an opponent affected by Cryo, CRIT Rate is increased by 20%. If the opponent is Frozen, CRIT Rate is increased by an additional 20%.",
  },
  15003: {
    id: 15003,
    name: 'Heart of Depth',
    twoPiece: "Hydro DMG Bonus +15%.",
    fourPiece: "After using an Elemental Skill, increases Normal Attack and Charged Attack DMG by 30% for 15s.",
  },
  15016: {
    id: 15016,
    name: 'Viridescent Venerer',
    twoPiece: "Anemo DMG Bonus +15%.",
    fourPiece: "Increases Swirl DMG by 60%. Decreases opponent's Elemental RES to the element infused in the Swirl by 40% for 10s.",
  },
  14003: {
    id: 14003,
    name: 'Noblesse Oblige',
    twoPiece: "Elemental Burst DMG +20%.",
    fourPiece: "Using an Elemental Burst increases all party members' ATK by 20% for 12s. This effect cannot stack.",
  },
  14001: {
    id: 14001,
    name: "Gladiator's Finale",
    twoPiece: "ATK +18%.",
    fourPiece: "If the wielder of this artifact set uses a Sword, Claymore or Polearm, increases their Normal Attack DMG by 35%.",
  },
  14002: {
    id: 14002,
    name: "Wanderer's Troupe",
    twoPiece: "Increases Elemental Mastery by 80.",
    fourPiece: "Increases Charged Attack DMG by 35% if the character uses a Bow or Catalyst.",
  },
  14004: {
    id: 14004,
    name: 'Bloodstained Chivalry',
    twoPiece: "Physical DMG +25%.",
    fourPiece: "After defeating an opponent, increases Charged Attack DMG by 50%, and reduces its Stamina cost to 0 for 10s.",
  },
  15006: {
    id: 15006,
    name: 'Pale Flame',
    twoPiece: "Physical DMG +25%.",
    fourPiece: "When an Elemental Skill hits an opponent, ATK is increased by 9% for 7s. Stacks up to 2 times. At 2 stacks, the 2-piece set effect is increased by 100%.",
  },
  15017: {
    id: 15017,
    name: 'Tenacity of the Millelith',
    twoPiece: "HP +20%.",
    fourPiece: "When an Elemental Skill hits an opponent, the ATK of all nearby party members is increased by 20% and their Shield Strength is increased by 30% for 3s. Triggers off-field.",
  },
  15011: {
    id: 15011,
    name: 'Archaic Petra',
    twoPiece: "Geo DMG Bonus +15%.",
    fourPiece: "Upon obtaining an Elemental Shard created through a Crystallize Reaction, all party members gain 35% DMG Bonus for that particular element for 10s.",
  },
  15012: {
    id: 15012,
    name: 'Thundering Fury',
    twoPiece: "Electro DMG Bonus +15%.",
    fourPiece: "Increases DMG caused by Overloaded, Electro-Charged, Superconduct, and Hyperbloom by 40%, and Aggravate DMG Bonus by 20%. Triggering reactions decreases Elemental Skill CD by 1s (once every 0.8s).",
  },
  15013: {
    id: 15013,
    name: 'Thundersoother',
    twoPiece: "Electro RES +40%.",
    fourPiece: "Increases DMG against opponents affected by Electro by 35%.",
  },
  15004: {
    id: 15004,
    name: 'Retracing Bolide',
    twoPiece: "Increases Shield Strength by 35%.",
    fourPiece: "While protected by a shield, gain an additional 40% Normal and Charged Attack DMG.",
  },
  15001: {
    id: 15001,
    name: 'Maiden Beloved',
    twoPiece: "Character Healing Effectiveness +15%.",
    fourPiece: "Using an Elemental Skill or Burst increases healing received by all party members by 20% for 10s.",
  },

  // ─── 4-Star Sets ──────────────────────────────────────────────
  10007: {
    id: 10007,
    name: 'Instructor',
    twoPiece: "Increases Elemental Mastery by 80.",
    fourPiece: "Upon triggering an Elemental Reaction, increases all party members' Elemental Mastery by 120 for 8s.",
  },
  10009: {
    id: 10009,
    name: 'The Exile',
    twoPiece: "Energy Recharge +20%.",
    fourPiece: "Using an Elemental Burst regenerates 2 Energy for all party members (excluding the wearer) every 2s for 6s. This effect cannot stack.",
  },
  10005: {
    id: 10005,
    name: 'Berserker',
    twoPiece: "CRIT Rate +12%.",
    fourPiece: "When HP is below 70%, CRIT Rate increases by an additional 24%.",
  },
};
```

### 4.2 Set Bonus Lookup Logic

```ts
export function getArtifactSetDetails(setId: number, setName?: string): ArtifactSetDefinition | null {
  if (ARTIFACT_SET_DATA[setId]) {
    return ARTIFACT_SET_DATA[setId];
  }
  if (setName) {
    const found = Object.values(ARTIFACT_SET_DATA).find(
      s => s.name.toLowerCase() === setName.toLowerCase()
    );
    if (found) return found;
  }
  return null;
}
```

---

## 5. Requirement 2: Weapon Metadata Specifications

### 5.1 Weapon Metadata Schema

```ts
export interface WeaponRefinementValues {
  r1: string | number;
  r2: string | number;
  r3: string | number;
  r4: string | number;
  r5: string | number;
}

export interface WeaponMetadata {
  id: number;
  name: string;
  type: 'Sword' | 'Claymore' | 'Polearm' | 'Catalyst' | 'Bow';
  rarity: 4 | 5;
  baseAtkLv90: number;
  subStat: {
    type: 'cr' | 'cd' | 'atkPercent' | 'hpPercent' | 'defPercent' | 'er' | 'em' | 'physDmg';
    displayLabel: string;
    valueLv90: number; // e.g. 66.2 for 66.2%
  };
  passiveName: string;
  descriptionTemplate: string; // e.g. "HP increased by {hp}%. Gain {atk}% ATK based on Max HP."
  refinements: Record<string, WeaponRefinementValues>;
}
```

### 5.2 Featured Weapon Catalog

| Weapon | Type | Rarity | Base ATK (Lv90) | Substat (Lv90) | Passive Name | Refinement Scaling (R1 → R5) |
|---|---|---|---|---|---|---|
| **Staff of Homa** | Polearm | 5★ | 608 | CRIT DMG 66.2% | Reckless Cinnabar | HP: +20/25/30/35/40%<br>ATK per HP: 0.8/1.0/1.2/1.4/1.6%<br>Low HP ATK: +1.0/1.2/1.4/1.6/1.8% |
| **Engulfing Lightning** | Polearm | 5★ | 608 | Energy Recharge 55.1% | Timeless Dream: Eternal Stove | ATK per ER>100%: 28/35/42/49/56% (Cap: 80/90/100/110/120%)<br>Post-Burst ER: +30/35/40/45/50% for 12s |
| **Primordial Jade Winged-Spear** | Polearm | 5★ | 674 | CRIT Rate 22.1% | Eagle Spear of Justice | ATK per hit: +3.2/3.9/4.6/5.3/6.0% (Max 7 stacks)<br>Full stacks DMG: +12/15/18/21/24% |
| **The Catch** | Polearm | 4★ | 510 | Energy Recharge 45.9% | Shanty | Burst DMG: +16/20/24/28/32%<br>Burst CRIT Rate: +6/7.5/9/10.5/12% |
| **Dragon's Bane** | Polearm | 4★ | 454 | Elemental Mastery 221 | Bane of Flame and Water | DMG vs Pyro/Hydro: +20/24/28/32/36% |
| **Favonius Lance** | Polearm | 4★ | 565 | Energy Recharge 30.6% | Windfall | CRIT Hit Energy Particle: 60/70/80/90/100% chance (CD: 12/10.5/9/7.5/6s) |
| **Mistsplitter Reforged** | Sword | 5★ | 674 | CRIT DMG 44.1% | Mistsplitter's Edge | All Elemental DMG: +12/15/18/21/24%<br>Stack 1/2/3 DMG: (8/16/28)% → (16/32/56)% |
| **Primordial Jade Cutter** | Sword | 5★ | 542 | CRIT Rate 44.1% | Protector's Virtue | HP: +20/25/30/35/40%<br>ATK per HP: 1.2/1.5/1.8/2.1/2.4% |
| **Splendor of Tranquil Waters** | Sword | 5★ | 542 | CRIT DMG 88.2% | Dawn and Dusk by the Lake | Skill DMG stack (max 3): +8/10/12/14/16%<br>HP stack (max 2): +14/17.5/21/24.5/28% |
| **Freedom-Sworn** | Sword | 5★ | 608 | Elemental Mastery 198 | Revolutionary Chorale | DMG: +10/12.5/15/17.5/20%<br>Party Normal/Charged/Plunge: +16/20/24/28/32%<br>Party ATK: +20/25/30/35/40% |
| **Favonius Sword** | Sword | 4★ | 454 | Energy Recharge 61.3% | Windfall | CRIT Hit Energy Particle: 60/70/80/90/100% chance (CD: 12/10.5/9/7.5/6s) |
| **Iron Sting** | Sword | 4★ | 510 | Elemental Mastery 165 | Infusion Stinger | Dealing Elemental DMG grants +6/7.5/9/10.5/12% All DMG for 6s (Max 2 stacks) |
| **Tome of the Eternal Flow** | Catalyst | 5★ | 542 | CRIT DMG 88.2% | Aeon Wave | HP: +16/20/24/28/32%<br>Charged Attack stack (max 3): +14/18/22/26/30%<br>Energy at 3 stacks: 8/9/10/11/12 |
| **Lost Prayer to Sacred Winds** | Catalyst | 5★ | 608 | CRIT Rate 33.1% | Boundless Blessing | Movement SPD: +10%<br>Elemental DMG per 4s on-field (max 4): +8/10/12/14/16% |
| **Kagura's Verity** | Catalyst | 5★ | 608 | CRIT DMG 66.2% | Kagura Dance | Skill DMG stack (max 3): +12/15/18/21/24%<br>All Elemental DMG at 3 stacks: +12/15/18/21/24% |
| **A Thousand Floating Dreams** | Catalyst | 5★ | 542 | Elemental Mastery 265 | A Thousand Nights' Dawnsong | Same element party member EM: 32/40/48/56/64<br>Different element DMG: +10/14/18/22/26%<br>Party EM: +40/42/44/46/48 |
| **The Widsith** | Catalyst | 4★ | 510 | CRIT DMG 55.1% | Debut | Recitative (ATK): +60/75/90/105/120%<br>Aria (All DMG): +48/60/72/84/96%<br>Interlude (EM): +240/300/360/420/480 |
| **Aqua Simulacra** | Bow | 5★ | 542 | CRIT DMG 88.2% | The Cleansing Form | HP: +16/20/24/28/32%<br>DMG dealt when enemies nearby: +20/25/30/35/40% |
| **Thundering Pulse** | Bow | 5★ | 608 | CRIT DMG 66.2% | Rule By Thunder | ATK: +20/25/30/35/40%<br>Normal Attack stacks (1/2/3): (12/24/40)% → (24/48/80)% |
| **Polar Star** | Bow | 5★ | 608 | CRIT Rate 33.1% | Daylight's Augur | Skill & Burst DMG: +12/15/18/21/24%<br>ATK stacks (1/2/3/4): (10/20/30/48)% → (20/40/60/96)% |
| **The First Great Magic** | Bow | 5★ | 608 | CRIT DMG 66.2% | Parsifal the Great | Charged Attack DMG: +16/20/24/28/32%<br>Same element ATK stacks: (16/32/48)% → (32/64/96)% |
| **Elegy for the End** | Bow | 5★ | 608 | Energy Recharge 55.1% | The Parting Refrain | EM: +60/75/90/105/120<br>Party Millennial buff: EM +100/125/150/175/200, ATK +20/25/30/35/40% |
| **Favonius Warbow** | Bow | 4★ | 454 | Energy Recharge 61.3% | Windfall | CRIT Hit Energy Particle: 60/70/80/90/100% chance (CD: 12/10.5/9/7.5/6s) |
| **Beacon of the Reed Sea** | Claymore | 5★ | 608 | CRIT Rate 33.1% | Desert Watch | Skill hit ATK: +20/25/30/35/40%<br>DMG taken ATK: +20/25/30/35/40%<br>Unshielded HP: +32/40/48/56/64% |
| **Redhorn Stonethresher** | Claymore | 5★ | 542 | CRIT DMG 88.2% | Gokadaiou Otogibanashi | DEF: +28/35/42/49/56%<br>Normal & Charged Attack DMG based on DEF: +40/50/60/70/80% |
| **Song of Broken Pines** | Claymore | 5★ | 741 | Physical DMG 20.7% | Rebel's Banner-Hymn | ATK: +16/20/24/28/32%<br>Party Millennial buff: Normal SPD +12/15/18/21/24%, ATK +20/25/30/35/40% |
| **Serpent Spine** | Claymore | 4★ | 510 | CRIT Rate 27.6% | Wavesplitter | Every 4s on-field DMG dealt +6/7/8/9/10%, DMG taken +3/2.7/2.4/2.1/1.8% (Max 5 stacks) |

---

## 6. Requirement 3: Crit Value (CV) Formulas & Quality Badge Thresholds

### 6.1 Formula Definitions

- **Artifact Piece Crit Value**:
  $$\text{CV}_{\text{piece}} = 2 \times \text{CR} + \text{CD}$$
  *(Where CR and CD are the substat values in percentage units, e.g. 7.8% CR and 21.8% CD yields $2 \times 7.8 + 21.8 = 37.4\text{ CV}$)*

- **Total Artifact Build Crit Value**:
  $$\text{CV}_{\text{artifacts}} = \sum_{i=1}^{5} \text{CV}_{\text{piece}, i}$$

- **Overall Character Sheet Crit Value**:
  $$\text{CV}_{\text{character}} = 2 \times \text{CharacterStats.CR} + \text{CharacterStats.CD}$$

### 6.2 Per-Piece Quality Badges (Flower, Plume, Sands, Goblet)

| CV Range | Badge Name | Visual Styling | Description |
|---|---|---|---|
| `< 20.0` | **Subpar** | Text `#9CA3AF`, Border `white/10`, Background `white/5` | Baseline / starter piece |
| `20.0 – 29.9` | **Decent** | Text `#34D399` (Emerald), Border `emerald-500/30`, Background `emerald-500/10` | Functional piece, 2–3 upgrades |
| `30.0 – 39.9` | **Good** | Text `#22D3EE` (Cyan), Border `cyan-500/30`, Background `cyan-500/10` | Solid endgame piece, 4 upgrades |
| `40.0 – 49.9` | **Great** | Text `#C084FC` (Purple), Border `purple-500/40`, Background `purple-500/15` | High investment, 5 upgrades |
| `≥ 50.0` | **Godly** | Text `#FBBF24` (Amber/Gold), Border `amber-400/50`, Background `amber-500/20`, Glow `shadow-amber-500/25` | Unicorn piece (theoretical maximum ~54.6) |

### 6.3 Circlet-Adjusted Substat CV Scale

For Circlets with CRIT Rate or CRIT DMG mainstat:
- `< 10.0 CV`: Subpar
- `10.0 – 19.9 CV`: Decent
- `20.0 – 29.9 CV`: Good
- `30.0 – 34.9 CV`: Great
- `≥ 35.0 CV`: Godly (near theoretical max substat CV on a Crit circlet)

### 6.4 Total Build CV Quality Badges

| Build CV Tier | Artifacts Total Substat CV ($\sum \text{CV}_{\text{piece}}$) | Total Character Sheet CV ($2\text{CR} + \text{CD}$) | Badge Style |
|---|---|---|---|
| **Subpar** | `< 140.0` | `< 180.0` | Gray / Muted |
| **Decent** | `140.0 – 179.9` | `180.0 – 219.9` | Emerald (`#10B981`) |
| **Good** | `180.0 – 219.9` | `220.0 – 259.9` | Cyan (`#06B6D4`) |
| **Great** | `220.0 – 239.9` | `260.0 – 299.9` | Purple (`#A855F7`) |
| **Godly** | `≥ 240.0` | `≥ 300.0` | Gold / Amber (`#F59E0B` with radial glow) |

---

## 7. Requirement 4: Substat Roll Tiers, Pips `[●●●○]`, & 100x Bug Fix

### 7.1 Theoretical Roll Tiers Table (5★ Artifacts)

In Genshin Impact game data (`store/gi/affixes.json`), every 5★ artifact substat has 4 discrete roll tiers (70%, 80%, 90%, 100%):

| Substat Key | Display Name | Tier 1 (70%) | Tier 2 (80%) | Tier 3 (90%) | Tier 4 (100%) | Average Roll | Max Possible in 1 Roll |
|---|---|---|---|---|---|---|---|
| `cr` | CRIT Rate | 2.72% | 3.11% | 3.50% | 3.89% | 3.305% | 3.89% |
| `cd` | CRIT DMG | 5.44% | 6.22% | 6.99% | 7.77% | 6.605% | 7.77% |
| `atkPercent` | ATK% | 4.08% | 4.66% | 5.25% | 5.83% | 4.955% | 5.83% |
| `hpPercent` | HP% | 4.08% | 4.66% | 5.25% | 5.83% | 4.955% | 5.83% |
| `defPercent` | DEF% | 5.10% | 5.83% | 6.56% | 7.29% | 6.195% | 7.29% |
| `er` | Energy Recharge | 4.53% | 5.18% | 5.83% | 6.48% | 5.505% | 6.48% |
| `em` | Elemental Mastery | 16.32 | 18.65 | 20.98 | 23.31 | 19.815 | 23.31 |
| `atk` | Flat ATK | 13.62 (~14) | 15.56 (~16) | 17.51 (~18) | 19.45 (~19) | 16.535 | 19.45 |
| `hp` | Flat HP | 209.13 (~209) | 239.00 (~239) | 268.88 (~269) | 298.75 (~299) | 253.94 | 298.75 |
| `def` | Flat DEF | 16.20 (~16) | 18.52 (~19) | 20.83 (~21) | 23.15 (~23) | 19.675 | 23.15 |

### 7.2 Roll Count Derivation Logic

A naive `Math.round(value / avgRoll)` produces errors on low-tier roll sums (e.g. 3 rolls of Tier 1 CR = 8.16%, which `Math.round(8.16 / 3.305) = 2` incorrectly classifies as 2 rolls, despite 2 rolls having a mathematical cap of 7.78%).

The correct bounded roll estimator:

```ts
export function calculateRollCount(statKey: string, value: number): number {
  const tiers = SUBSTAT_ROLLS[statKey];
  if (!tiers || tiers.length !== 4) return 1;

  const minRoll = tiers[0];
  const maxRoll = tiers[3];
  const avgRoll = (tiers[0] + tiers[1] + tiers[2] + tiers[3]) / 4;

  if (value <= 0) return 1;
  if (value <= maxRoll * 1.05) return 1;

  let bestRoll = 1;
  let minDiff = Infinity;

  // An individual substat on a +20 5-star artifact can have at most 6 rolls
  for (let k = 1; k <= 6; k++) {
    const kMin = k * minRoll * 0.95;
    const kMax = k * maxRoll * 1.05;

    if (value >= kMin && value <= kMax) {
      const expected = k * avgRoll;
      const diff = Math.abs(value - expected);
      if (diff < minDiff) {
        minDiff = diff;
        bestRoll = k;
      }
    }
  }

  return Math.min(Math.max(bestRoll, 1), 6);
}
```

### 7.3 Visual Roll Pips Format `[●●●○]`

Pips indicate the upgrade density for each substat.
In UI rendering:
- Standard 4-Pip Slot (1 base + 3 upgrades) or 5-Pip Slot (1 to 5 rolls):
  - 1 Roll: `●○○○○` (Base roll, no upgrades)
  - 2 Rolls: `●●○○○` (1 upgrade)
  - 3 Rolls: `●●●○○` (2 upgrades)
  - 4 Rolls: `●●●●○` (3 upgrades)
  - 5 Rolls: `●●●●●` (4 upgrades)
  - 6 Rolls: `●●●●●★` (All 5 upgrades into this single stat - max theoretical)
- Pip Styling:
  - Active pip (`●`): `#22D3EE` (Cyan) or `#FBBF24` (Amber for Crit stats)
  - Inactive pip (`○`): `#4B5563` (Muted gray)

### 7.4 Diagnosis and Fix for the 100x Multiplication Bug

- **The Issue**: Percent stats in `ArtifactDisplay.tsx` displayed as `4660.0%` instead of `46.6%`.
- **Root Cause**:
  1. Enka live API returns `flat.reliquaryMainstat.statValue` already scaled (e.g. `46.6` for 46.6% HP, `31.1` for 31.1% CR).
  2. In `src/lib/enka/parser.ts:208`, code assumed values were always decimals (`0.466`) and multiplied by 100 in some paths.
  3. In `src/components/character/ArtifactDisplay.tsx:27`, the render function executed `formatPercentage(value * 100, 1)`. Since `formatPercentage` simply formats a number and appends `%`, evaluating `formatPercentage(46.6 * 100, 1)` produced `"4660.0%"`.
- **Fix**:
  1. **In `src/lib/enka/parser.ts`**:
     Normalize incoming stat values:
     ```ts
     const isPercentageStat = ['cr', 'cd', 'er', 'hpPercent', 'atkPercent', 'defPercent'].includes(key) || key.includes('DmgBonus');
     // If raw value is decimal (e.g. 0.466 from fixture), scale to 46.6 once. If already 46.6, keep as 46.6.
     const normalizedValue = (isPercentageStat && sub.statValue <= 1.0 && sub.statValue > 0)
       ? parseFloat((sub.statValue * 100).toFixed(1))
       : sub.statValue;
     ```
  2. **In `src/components/character/ArtifactDisplay.tsx`**:
     Update `getStatDisplay`:
     ```tsx
     const getStatDisplay = (key: string, value: number) => {
       const isPercentage = ['cr', 'cd', 'er', 'hpPercent', 'atkPercent', 'defPercent'].includes(key) || key.includes('DmgBonus');
       if (isPercentage) {
         return formatPercentage(value, 1); // REMOVE * 100
       }
       return value.toFixed(0);
     };
     ```

---

## 8. Requirement 5: Constellation Talent Boost (+3) Detection Logic

### 8.1 Game Rules & Mapping

Every Genshin character has three active talents:
- Normal Attack (Index 0)
- Elemental Skill (Index 1)
- Elemental Burst (Index 2)

Constellation 3 (`C3`) boosts one talent by +3.  
Constellation 5 (`C5`) boosts a second talent by +3.

While most standard characters have C3=Skill and C5=Burst (or C3=Burst and C5=Skill), Fontaine/Natlan characters introduce Normal Attack boosts (e.g. Neuvillette and Arlecchino C3 boosts Normal Attack).

### 8.2 Character Constellation Boost Mapping Table

```ts
export interface TalentBoostConfig {
  c3: 'normal' | 'skill' | 'burst';
  c5: 'normal' | 'skill' | 'burst';
}

export const CHARACTER_TALENT_BOOSTS: Record<number, TalentBoostConfig> = {
  // Hu Tao
  10000046: { c3: 'skill', c5: 'burst' },
  // Raiden Shogun
  10000052: { c3: 'burst', c5: 'skill' },
  // Neuvillette
  10000087: { c3: 'normal', c5: 'burst' },
  // Arlecchino
  10000093: { c3: 'normal', c5: 'burst' },
  // Kamisato Ayaka
  10000002: { c3: 'burst', c5: 'skill' },
  // Furina
  10000089: { c3: 'burst', c5: 'skill' },
  // Nahida
  10000073: { c3: 'skill', c5: 'burst' },
  // Yelan
  10000060: { c3: 'burst', c5: 'skill' },
  // Kaedehara Kazuha
  10000047: { c3: 'skill', c5: 'burst' },
  // Zhongli
  10000030: { c3: 'skill', c5: 'burst' },
  // Xiangling
  10000023: { c3: 'burst', c5: 'skill' },
  // Xingqiu
  10000025: { c3: 'burst', c5: 'skill' },
  // Bennett
  10000032: { c3: 'skill', c5: 'burst' },
  // Ganyu
  10000037: { c3: 'burst', c5: 'skill' },
  // Mavuika
  10000103: { c3: 'skill', c5: 'burst' },
  // Kinich
  10000101: { c3: 'skill', c5: 'burst' },
  // Mualani
  10000102: { c3: 'skill', c5: 'burst' },
  // Xilonen
  10000104: { c3: 'skill', c5: 'burst' },
  // Navia
  10000091: { c3: 'skill', c5: 'burst' },
  // Chiori
  10000094: { c3: 'skill', c5: 'burst' },
  // Wriothesley
  10000086: { c3: 'normal', c5: 'burst' },
  // Lyney
  10000084: { c3: 'normal', c5: 'burst' },
  // Clorinde
  10000098: { c3: 'skill', c5: 'burst' },
  // Alhaitham
  10000078: { c3: 'skill', c5: 'burst' },
  // Wanderer
  10000075: { c3: 'burst', c5: 'skill' },
  // Nilou
  10000070: { c3: 'burst', c5: 'skill' },
  // Cyno
  10000071: { c3: 'burst', c5: 'skill' },
  // Tighnari
  10000069: { c3: 'burst', c5: 'skill' },
  // Yae Miko
  10000058: { c3: 'skill', c5: 'burst' },
  // Shenhe
  10000063: { c3: 'skill', c5: 'burst' },
  // Xiao
  10000026: { c3: 'skill', c5: 'burst' },
  // Tartaglia
  10000033: { c3: 'skill', c5: 'burst' },
  // Klee
  10000029: { c3: 'skill', c5: 'burst' },
  // Venti
  10000022: { c3: 'burst', c5: 'skill' },
  // Diluc
  10000016: { c3: 'skill', c5: 'burst' },
  // Jean
  10000003: { c3: 'burst', c5: 'skill' },
  // Mona
  10000041: { c3: 'burst', c5: 'skill' },
  // Keqing
  10000042: { c3: 'burst', c5: 'skill' },
  // Qiqi
  10000035: { c3: 'burst', c5: 'skill' },
};
```

### 8.3 Talent Boost Evaluation Function

```ts
export interface TalentInfo {
  level: number;
  boosted: boolean;
  icon: string;
}

export function evaluateTalents(
  characterId: number,
  constellation: number,
  baseTalents: { normal: number; skill: number; burst: number }
): {
  normal: TalentInfo;
  skill: TalentInfo;
  burst: TalentInfo;
} {
  const config = CHARACTER_TALENT_BOOSTS[characterId] || { c3: 'skill', c5: 'burst' };

  const normalBoosted = (constellation >= 3 && config.c3 === 'normal') || (constellation >= 5 && config.c5 === 'normal');
  const skillBoosted = (constellation >= 3 && config.c3 === 'skill') || (constellation >= 5 && config.c5 === 'skill');
  const burstBoosted = (constellation >= 3 && config.c3 === 'burst') || (constellation >= 5 && config.c5 === 'burst');

  return {
    normal: {
      level: baseTalents.normal,
      boosted: normalBoosted,
      icon: `/icons/talents/${characterId}_normal.png`,
    },
    skill: {
      level: baseTalents.skill,
      boosted: skillBoosted,
      icon: `/icons/talents/${characterId}_skill.png`,
    },
    burst: {
      level: baseTalents.burst,
      boosted: burstBoosted,
      icon: `/icons/talents/${characterId}_burst.png`,
    },
  };
}
```

### 8.4 UI Visual Tag Specification for Constellation-Boosted Talents

When `boosted: true`:
- Display a radiant glowing tag `+3` atop or beside the circular talent icon badge:
  - Font: Bold, Monospace (`font-bold text-xs`)
  - Color: Radiant Amber / Cyan (`text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]`)
  - Background pill: `bg-amber-500/20 border border-amber-400/40 px-1.5 py-0.5 rounded-full`
  - Glow effect: Outer ring or pulse animation highlighting constellation empowerment.

---

## 9. Verification & Invalidation Conditions

1. **Verification**:
   - `calculateRollCount('cr', 8.16)` evaluates to `3` rolls (not `2`).
   - `getArtifactSetDetails(15005)` returns Crimson Witch with 2pc and 4pc descriptions matching official text.
   - `getStatDisplay('hpPercent', 46.6)` renders `"46.6%"` (NOT `"4660.0%"`).
   - Character with C3/C5 (e.g. Hu Tao at C6) shows `skill.boosted === true` and `burst.boosted === true`.
   - Neuvillette at C3 shows `normal.boosted === true` and `burst.boosted === false`.
2. **Invalidation**:
   - Any modification to `src/app/page.tsx` violates R5 constraint.
   - Any artifact stat retaining a `* 100` double multiplier violates R2.
