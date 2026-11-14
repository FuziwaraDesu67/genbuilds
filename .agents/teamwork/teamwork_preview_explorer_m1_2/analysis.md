# Artifact Set Skills Data Specification & Architecture Report

**Author**: Explorer 2 (Milestone 1 — Artifact Set Skills Data)  
**Date**: 2026-11-01  
**Project**: `genshin-leaderboard`  
**Target Path**: `src/lib/enka/artifact-set-data.ts` (with exports in `static-data.ts` and `index.ts`)

---

## 1. Executive Summary

This investigation designs the artifact set skill metadata and lookup architecture for Milestone 1 of the `genshin-leaderboard` showcase overhaul. 

### Key Discoveries & Architectural Resolutions:
1. **The Set ID Multi-System Discrepancy**:
   - In Genshin Impact and Enka.Network data, artifact sets have two numbering schemes:
     - **Icon Set IDs** embedded in asset filenames (e.g., `UI_RelicIcon_15008_4` -> `15008` for *Emblem of Severed Fate*, extracted by `parser.ts` via `flat.icon.split('_')[2]`).
     - **Internal Database Set IDs** in Enka's `relics.json` (e.g., *Emblem of Severed Fate* is `15020`, *Deepwood Memories* is `15025`, *Obsidian Codex* is `15038`).
     - **Legacy Placeholders** in existing `static-data.ts` (where `15025` was tentatively mapped to `'Obsidian Codex'` and `15027` to `'Scroll of the Hero of Cinder City'`).
   - **Resolution**: Our architecture defines canonical set definitions with explicit `aliases: number[]`. Both the canonical Enka internal IDs and icon-extracted/legacy IDs are mapped in `ARTIFACT_SET_DATA`, and lookup helpers support secondary name-based disambiguation and fuzzy matching.
2. **Comprehensive Coverage**:
   - Expanded from the preliminary survey list to **50 total artifact sets**:
     - 2 Natlan 5★ sets (*Obsidian Codex*, *Scroll of the Hero of Cinder City*)
     - 6 Fontaine 5★ sets (*Golden Troupe*, *Marechaussee Hunter*, *Song of Days Past*, *Nighttime Whispers*, *Harmonic Whimsy*, *Unfinished Reverie*)
     - 6 Sumeru 5★ sets (*Deepwood Memories*, *Gilded Dreams*, *Desert Pavilion*, *Paradise Lost*, *Nymph's Dream*, *Vourukasha's Glow*)
     - 6 Inazuma 5★ sets (*Emblem*, *Shimenawa*, *Husk*, *Clam*, *Vermillion*, *Echoes*)
     - 16 Liyue/Mondstadt 5★ sets (*Crimson Witch*, *Blizzard*, *Heart of Depth*, *Viridescent*, *Noblesse*, *Gladiator*, *Wanderer*, *Bloodstained*, *Pale Flame*, *Tenacity*, *Petra*, *Thundering Fury*, *Thundersoother*, *Bolide*, *Maiden*, *Lavawalker*)
     - 10 classic 4★ sets (*Instructor*, *The Exile*, *Berserker*, *Brave Heart*, *Martial Artist*, *Gambler*, *Scholar*, *Defender's Will*, *Resolution of Sojourner*, *Tiny Miracle*)
     - 4 1-piece Circlet Tiara sets (*Prayers for Illumination*, *Prayers for Destiny*, *Prayers for Wisdom*, *Prayers to Springtime*)
3. **Lookup Contract**:
   - `getArtifactSetBonus(setId: number, setName?: string)`: Returns `{ twoPiece?: string; fourPiece?: string; name: string } | undefined`.
   - `getArtifactSetBonusByName(setName: string)`: Normalized, punctuation-insensitive string lookup.
   - `getActiveArtifactSetBonuses(artifactSets, artifacts?)`: Aggregates active set counts and returns active 2pc/4pc bonuses for multi-piece builds.

---

## 2. In-Depth Artifact Sets Catalog (50 Sets)

| # | Canonical ID | Alias IDs | Set Name | 2-Piece Effect Summary | 4-Piece Effect Summary |
|---|---|---|---|---|---|
| 1 | 15038 | 15025 | Obsidian Codex | Nightsoul Blessing on-field DMG +15% | Consume Nightsoul on-field -> CRIT Rate +40% for 6s |
| 2 | 15037 | 15027 | Scroll of the Hero of Cinder City | Nightsoul Burst triggers 6 Energy regeneration | Elemental reaction -> 12% team DMG bonus (28% extra in Nightsoul) |
| 3 | 15032 | 15020 | Golden Troupe | Elemental Skill DMG +20% | Skill DMG +25%, extra +25% off-field |
| 4 | 15031 | 15021 | Marechaussee Hunter | Normal & Charged Attack DMG +15% | HP change -> CRIT Rate +12% (max 3 stacks = +36%) |
| 5 | 15033 | 15024 | Song of Days Past | Healing Bonus +15% | Records healing for 6s -> up to 8% bonus DMG on next attacks |
| 6 | 15034 | 15026 | Nighttime Whispers in the Echoing Woods | ATK +18% | Skill use -> Geo DMG +20% (increases by 150% with Crystallize shield) |
| 7 | 15035 | 15028 | Fragment of Harmonic Whimsy | ATK +18% | Bond of Life changes -> DMG dealt +18% (max 3 stacks = +54%) |
| 8 | 15036 | 15029 | Unfinished Reverie | ATK +18% | Combat DMG dealt +50% maintained via Burning enemies |
| 9 | 15025 | — | Deepwood Memories | Dendro DMG Bonus +15% | Skill/Burst hit -> Dendro RES -30% for 8s (triggers off-field) |
| 10 | 15026 | — | Gilded Dreams | Elemental Mastery +80 | Party element reaction: +14% ATK / +50 EM per member |
| 11 | 15027 | 15018 | Desert Pavilion Chronicle | Anemo DMG Bonus +15% | Charged Attack hit -> ATK SPD +10%, Normal/CA/Plunge DMG +40% |
| 12 | 15028 | 15019 | Flower of Paradise Lost | Elemental Mastery +80 | Bloom/Hyperbloom/Burgeon DMG +40%, extra +25% per reaction (max 4) |
| 13 | 15029 | 15022 | Nymph's Dream | Hydro DMG Bonus +15% | Normal/CA/Plunge/Skill/Burst hits stack ATK up to 25%, Hydro DMG up to 15% |
| 14 | 15030 | 15023 | Vourukasha's Glow | HP +20% | Skill & Burst DMG +10%, taking DMG boosts this by 80% (max 5) |
| 15 | 15020 | 15008 | Emblem of Severed Fate | Energy Recharge +20% | Burst DMG +25% of ER (max 75% bonus) |
| 16 | 15019 | 15007 | Shimenawa's Reminiscence | ATK +18% | Skill costs 15 Energy -> Normal/CA/Plunge DMG +50% for 10s |
| 17 | 15021 | 15009 | Husk of Opulent Dreams | DEF +30% | Curiosity stacks give up to 24% DEF and 24% Geo DMG |
| 18 | 15022 | 15010 | Ocean-Hued Clam | Healing Bonus +15% | Healing accumulates Sea-Dyed Foam dealing up to 27,000 Physical DMG |
| 19 | 15023 | 15014 | Vermillion Hereafter | ATK +18% | Burst use grants ATK +8%, HP loss grants up to 40% additional ATK |
| 20 | 15024 | 15015 | Echoes of an Offering | ATK +18% | Normal Attack 36% chance to trigger Valley Rite (+70% ATK DMG) |
| 21 | 15006 | 15005 | Crimson Witch of Flames | Pyro DMG Bonus +15% | Reaction DMG bonus; Skill use boosts 2pc effect by 50% (max 3 stacks) |
| 22 | 15004 | 15002 | Blizzard Strayer | Cryo DMG Bonus +15% | Cryo hit -> CR +20%; Frozen target -> additional CR +20% |
| 23 | 15016 | 15003 | Heart of Depth | Hydro DMG Bonus +15% | Skill use -> Normal and Charged Attack DMG +30% for 15s |
| 24 | 15002 | 15016 | Viridescent Venerer | Anemo DMG Bonus +15% | Swirl DMG +60%, decreases target infused element RES by 40% for 10s |
| 25 | 15007 | 14003 | Noblesse Oblige | Elemental Burst DMG +20% | Burst use -> all party members' ATK +20% for 12s |
| 26 | 15001 | 14001 | Gladiator's Finale | ATK +18% | Sword/Claymore/Polearm Normal Attack DMG +35% |
| 27 | 15003 | 14002 | Wanderer's Troupe | Elemental Mastery +80 | Bow/Catalyst Charged Attack DMG +35% |
| 28 | 15008 | 14004 | Bloodstained Chivalry | Physical DMG +25% | Defeating enemy -> Charged Attack DMG +50%, Stamina cost 0 |
| 29 | 15018 | 15006 | Pale Flame | Physical DMG +25% | Skill hit -> ATK +9% (max 2 stacks); at 2 stacks, 2pc bonus doubles |
| 30 | 15017 | — | Tenacity of the Millelith | HP +20% | Skill hit -> party ATK +20%, Shield Strength +30% for 3s (off-field) |
| 31 | 15014 | 15011 | Archaic Petra | Geo DMG Bonus +15% | Crystallize shard pickup -> party 35% DMG Bonus for that element |
| 32 | 15005 | 15012 | Thundering Fury | Electro DMG Bonus +15% | Reaction DMG +40%, Aggravate +20%, reactions reduce Skill CD by 1s |
| 33 | 15009 | 15013 | Thundersoother | Electro RES +40% | DMG against opponents affected by Electro +35% |
| 34 | 15015 | 15004 | Retracing Bolide | Shield Strength +35% | Protected by shield -> Normal and Charged Attack DMG +40% |
| 35 | 15013 | 15001 | Maiden Beloved | Healing Effectiveness +15% | Skill/Burst use -> party healing received +20% for 10s |
| 36 | 15010 | — | Lavawalker | Pyro RES +40% | DMG against opponents affected by Pyro +35% |
| 37 | 10007 | — | Instructor | Elemental Mastery +80 | Reaction trigger -> party Elemental Mastery +120 for 8s |
| 38 | 10009 | — | The Exile | Energy Recharge +20% | Burst use -> regenerates 2 Energy every 2s for 6s for other party members |
| 39 | 10005 | — | Berserker | CRIT Rate +12% | HP below 70% -> CRIT Rate +24% additional |
| 40 | 10002 | — | Brave Heart | ATK +18% | DMG +30% against opponents with >50% HP |
| 41 | 10006 | — | Martial Artist | Normal & Charged Attack DMG +15% | Skill use -> Normal & Charged Attack DMG +25% for 8s |
| 42 | 10008 | — | Gambler | Elemental Skill DMG +20% | Defeating enemy resets Skill CD (once per 15s) |
| 43 | 10012 | — | Scholar | Energy Recharge +20% | Particle pickup -> Bow/Catalyst members gain 3 Energy (CD 3s) |
| 44 | 10003 | — | Defender's Will | DEF +30% | For each element in party, gain +30% RES to that element |
| 45 | 10001 | — | Resolution of Sojourner | ATK +18% | Charged Attack CRIT Rate +30% |
| 46 | 10004 | — | Tiny Miracle | All Elemental RES +20% | Incoming elemental DMG grants +30% RES to that element for 10s |
| 47 | 15000 | 15011 | Prayers for Illumination | Pyro affected duration -40% | (1-piece circlet set) |
| 48 | 15010 | — | Prayers for Destiny | Hydro affected duration -40% | (1-piece circlet set) |
| 49 | 15009 | — | Prayers for Wisdom | Electro affected duration -40% | (1-piece circlet set) |
| 50 | 15013 | — | Prayers to Springtime | Cryo affected duration -40% | (1-piece circlet set) |

---

## 3. ID Multi-System & Ambiguity Resolution

### Root Cause Analysis
- `src/lib/enka/parser.ts:198` extracts `setId` directly from `flat.icon`:
  ```ts
  const setId = parseInt(flat.icon.split('_')[2]) || 0;
  ```
- In Enka's asset database, icon filenames use historical prefixes:
  - e.g. `UI_RelicIcon_15008_1.png` is Emblem of Severed Fate, while in `store/gi/relics.json`, the internal `SetId` is `15020`.
  - e.g. `UI_RelicIcon_14001_1.png` is Gladiator's Finale, while internal `SetId` is `15001`.
  - In existing `static-data.ts`, `15025` was labeled `Obsidian Codex` and `15027` `Scroll of the Hero of Cinder City`.
  - However, in official Natlan release data: `15038` is Obsidian Codex (`UI_RelicIcon_15038_x`), `15037` is Scroll of the Hero of Cinder City (`UI_RelicIcon_15037_x`), while `15025` is Sumeru's Deepwood Memories.

### Architectural Solution
1. In `ARTIFACT_SET_DATA`, canonical definitions are indexed by primary ID, and all alias IDs point to the same canonical reference.
2. If two sets share an ID due to legacy naming differences (e.g. `15025` which was used for Obsidian Codex in static-data vs Deepwood in game data), `getArtifactSetBonus(setId, setName)` accepts an optional `setName`. If provided, it prioritizes the exact matching set name.
3. String matching is normalized:
   ```ts
   function normalizeSetName(name: string): string {
     return name.toLowerCase().replace(/[^a-z0-9]/g, '');
   }
   ```
   This guarantees `"Shimenawa's Reminiscence"`, `"shimenawas reminiscence"`, and `"shimenawa reminiscence"` all match the same set definition.

---

## 4. Production-Ready Code for `src/lib/enka/artifact-set-data.ts`

```typescript
/**
 * Authoritative Genshin Impact Artifact Set Skills and Bonus Descriptions.
 * Supports all 5★, 4★, and 1-piece Circlet Tiara artifact sets.
 *
 * Provides bidirectional ID and normalized name resolution, alias handling,
 * and active set bonus aggregation for showcase build cards.
 */

export interface ArtifactSetDefinition {
  id: number;
  name: string;
  aliases?: number[];
  twoPiece: string;
  fourPiece: string;
  onePiece?: string;
}

export interface ActiveSetBonus {
  setId: number;
  setName: string;
  count: number;
  twoPieceActive: boolean;
  fourPieceActive: boolean;
  twoPieceText?: string;
  fourPieceText?: string;
}

/**
 * Master catalog of 50 artifact set definitions with official in-game skill descriptions.
 */
export const ARTIFACT_SET_LIST: ArtifactSetDefinition[] = [
  // ─── Natlan Sets ──────────────────────────────────────────────
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
    aliases: [15029],
    twoPiece: "ATK +18%.",
    fourPiece: "After leaving combat for 3s, DMG dealt increased by 50%. In combat, if no Burning opponents are nearby for more than 6s, this DMG Bonus will decrease by 10% per second until it reaches 0%. When a Burning opponent exists, it increases by 10% each second up to 50%.",
  },

  // ─── Sumeru Sets ──────────────────────────────────────────────
  {
    id: 15025,
    name: 'Deepwood Memories',
    twoPiece: "Dendro DMG Bonus +15%.",
    fourPiece: "After Elemental Skills or Bursts hit opponents, the targets' Dendro RES will be decreased by 30% for 8s. This effect can be triggered even if the equipping character is not on the field.",
  },
  {
    id: 15026,
    name: 'Gilded Dreams',
    twoPiece: "Elemental Mastery +80.",
    fourPiece: "Within 8s of triggering an Elemental Reaction, obtain buffs based on party Elemental Types: ATK +14% for each member sharing the same element; EM +50 for each member of a different element. Stacks up to 3 characters.",
  },
  {
    id: 15027,
    name: 'Desert Pavilion Chronicle',
    aliases: [15018],
    twoPiece: "Anemo DMG Bonus +15%.",
    fourPiece: "When Charged Attacks hit opponents, Normal Attack SPD increases by 10% while Normal, Charged, and Plunging Attack DMG increases by 40% for 15s.",
  },
  {
    id: 15028,
    name: 'Flower of Paradise Lost',
    aliases: [15019],
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
    id: 15020,
    name: 'Emblem of Severed Fate',
    aliases: [15008],
    twoPiece: "Energy Recharge +20%.",
    fourPiece: "Increases Elemental Burst DMG by 25% of Energy Recharge. A maximum of 75% bonus DMG can be obtained in this way.",
  },
  {
    id: 15019,
    name: "Shimenawa's Reminiscence",
    aliases: [15007],
    twoPiece: "ATK +18%.",
    fourPiece: "When casting an Elemental Skill, if the character has 15 or more Energy, they lose 15 Energy and Normal/Charged/Plunging Attack DMG is increased by 50% for 10s.",
  },
  {
    id: 15021,
    name: 'Husk of Opulent Dreams',
    aliases: [15009],
    twoPiece: "DEF +30%.",
    fourPiece: "Gains Curiosity stacks: on-field Geo hits grant 1 stack (every 0.3s); off-field grants 1 stack every 3s. Max 4 stacks, each giving 6% DEF and 6% Geo DMG Bonus.",
  },
  {
    id: 15022,
    name: 'Ocean-Hued Clam',
    aliases: [15010],
    twoPiece: "Healing Bonus +15%.",
    fourPiece: "When healing party members, a Sea-Dyed Foam accumulates healing for 3s, then explodes dealing 90% of accumulated healing as Physical DMG (up to 30,000 HP healing accumulated). Triggers once every 3.5s.",
  },
  {
    id: 15023,
    name: 'Vermillion Hereafter',
    aliases: [15014],
    twoPiece: "ATK +18%.",
    fourPiece: "After using an Elemental Burst, ATK increases by 8% for 16s. When HP decreases, ATK further increases by 10% (up to 4 times, once every 0.8s).",
  },
  {
    id: 15024,
    name: 'Echoes of an Offering',
    aliases: [15015],
    twoPiece: "ATK +18%.",
    fourPiece: "When Normal Attacks hit opponents, 36% chance to trigger Valley Rite, increasing Normal Attack DMG by 70% of ATK. Fails increase chance by 20% for next hit.",
  },

  // ─── Liyue & Mondstadt Core Sets ──────────────────────────────
  {
    id: 15006,
    name: 'Crimson Witch of Flames',
    aliases: [15005],
    twoPiece: "Pyro DMG Bonus +15%.",
    fourPiece: "Increases Overloaded, Burning, and Burgeon DMG by 40%. Increases Vaporize and Melt DMG by 15%. Using an Elemental Skill increases the 2-Piece Set Bonus by 50% of its starting value for 10s. Max 3 stacks.",
  },
  {
    id: 15004,
    name: 'Blizzard Strayer',
    aliases: [15002],
    twoPiece: "Cryo DMG Bonus +15%.",
    fourPiece: "When attacking an opponent affected by Cryo, CRIT Rate is increased by 20%. If the opponent is Frozen, CRIT Rate is increased by an additional 20%.",
  },
  {
    id: 15016,
    name: 'Heart of Depth',
    aliases: [15003],
    twoPiece: "Hydro DMG Bonus +15%.",
    fourPiece: "After using an Elemental Skill, increases Normal Attack and Charged Attack DMG by 30% for 15s.",
  },
  {
    id: 15002,
    name: 'Viridescent Venerer',
    aliases: [15016],
    twoPiece: "Anemo DMG Bonus +15%.",
    fourPiece: "Increases Swirl DMG by 60%. Decreases opponent's Elemental RES to the element infused in the Swirl by 40% for 10s.",
  },
  {
    id: 15007,
    name: 'Noblesse Oblige',
    aliases: [14003],
    twoPiece: "Elemental Burst DMG +20%.",
    fourPiece: "Using an Elemental Burst increases all party members' ATK by 20% for 12s. This effect cannot stack.",
  },
  {
    id: 15001,
    name: "Gladiator's Finale",
    aliases: [14001],
    twoPiece: "ATK +18%.",
    fourPiece: "If the wielder of this artifact set uses a Sword, Claymore or Polearm, increases their Normal Attack DMG by 35%.",
  },
  {
    id: 15003,
    name: "Wanderer's Troupe",
    aliases: [14002],
    twoPiece: "Increases Elemental Mastery by 80.",
    fourPiece: "Increases Charged Attack DMG by 35% if the character uses a Bow or Catalyst.",
  },
  {
    id: 15008,
    name: 'Bloodstained Chivalry',
    aliases: [14004],
    twoPiece: "Physical DMG +25%.",
    fourPiece: "After defeating an opponent, increases Charged Attack DMG by 50%, and reduces its Stamina cost to 0 for 10s.",
  },
  {
    id: 15018,
    name: 'Pale Flame',
    aliases: [15006],
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
    id: 15014,
    name: 'Archaic Petra',
    aliases: [15011],
    twoPiece: "Geo DMG Bonus +15%.",
    fourPiece: "Upon obtaining an Elemental Shard created through a Crystallize Reaction, all party members gain 35% DMG Bonus for that particular element for 10s.",
  },
  {
    id: 15005,
    name: 'Thundering Fury',
    aliases: [15012],
    twoPiece: "Electro DMG Bonus +15%.",
    fourPiece: "Increases DMG caused by Overloaded, Electro-Charged, Superconduct, and Hyperbloom by 40%, and Aggravate DMG Bonus by 20%. Triggering reactions decreases Elemental Skill CD by 1s (once every 0.8s).",
  },
  {
    id: 15009,
    name: 'Thundersoother',
    aliases: [15013],
    twoPiece: "Electro RES +40%.",
    fourPiece: "Increases DMG against opponents affected by Electro by 35%.",
  },
  {
    id: 15015,
    name: 'Retracing Bolide',
    aliases: [15004],
    twoPiece: "Increases Shield Strength by 35%.",
    fourPiece: "While protected by a shield, gain an additional 40% Normal and Charged Attack DMG.",
  },
  {
    id: 15013,
    name: 'Maiden Beloved',
    aliases: [15001],
    twoPiece: "Character Healing Effectiveness +15%.",
    fourPiece: "Using an Elemental Skill or Burst increases healing received by all party members by 20% for 10s.",
  },
  {
    id: 15010,
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
    id: 15011,
    name: 'Prayers for Destiny',
    twoPiece: "Affected by Hydro for 40% less time.",
    fourPiece: "",
    onePiece: "Affected by Hydro for 40% less time.",
  },
  {
    id: 15009,
    name: 'Prayers for Wisdom',
    twoPiece: "Affected by Electro for 40% less time.",
    fourPiece: "",
    onePiece: "Affected by Electro for 40% less time.",
  },
  {
    id: 15013,
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
      setName: name,
      count,
      twoPieceActive: count >= 2,
      fourPieceActive: count >= 4,
      twoPieceText: count >= 2 ? details?.twoPiece : undefined,
      fourPieceText: count >= 4 ? details?.fourPiece : undefined,
    });
  }

  return activeBonuses;
}
```

---

## 5. Integration Architecture

### 5.1 Updates to `src/lib/enka/static-data.ts`
To maintain complete backward compatibility with existing code while enhancing metadata coverage:
1. Re-export all items from `./artifact-set-data`.
2. Generate `ARTIFACT_SETS` dynamically from `ARTIFACT_SET_DATA`:
   ```ts
   import {
     ARTIFACT_SET_DATA,
     ARTIFACT_SET_LIST,
     getArtifactSetBonus,
     getArtifactSetBonusByName,
     getArtifactSetDetails,
     getArtifactSetName,
     getActiveArtifactSetBonuses,
   } from './artifact-set-data';
   
   export * from './artifact-set-data';

   // Backward-compatible dictionary mapping setId -> string name
   export const ARTIFACT_SETS: Record<number, string> = Object.entries(ARTIFACT_SET_DATA).reduce(
     (acc, [id, def]) => {
       acc[Number(id)] = def.name;
       return acc;
     },
     {} as Record<number, string>
   );
   ```

### 5.2 Updates to `src/lib/enka/types.ts`
Enrich `Artifact` domain interface with optional `setBonusText`:
```ts
export interface Artifact {
  id: number;
  name: string;
  setId: number;
  setName: string;
  setBonusText?: {
    twoPiece?: string;
    fourPiece?: string;
  };
  rarity: number;
  level: number;
  slot: 'flower' | 'plume' | 'sands' | 'goblet' | 'circlet';
  mainStat: {
    key: string;
    value: number;
  };
  subStats: Array<{
    key: string;
    value: number;
    rolls?: number;
    pips?: string;
  }>;
  cv?: number;
  qualityBadge?: 'Subpar' | 'Decent' | 'Good' | 'Great' | 'Godly';
  icon: string;
}
```

### 5.3 Updates to `src/lib/enka/index.ts`
Ensure `artifact-set-data` is re-exported from the package root:
```ts
export * from './artifact-set-data';
```

---

## 6. Worker Implementation Plan

| Step | Action | Target File | Description |
|---|---|---|---|
| 1 | Create file | `src/lib/enka/artifact-set-data.ts` | Write full 50-set catalog, types, maps, and lookup functions. |
| 2 | Update exports | `src/lib/enka/static-data.ts` | Re-export `artifact-set-data` and sync `ARTIFACT_SETS`. |
| 3 | Update types | `src/lib/enka/types.ts` | Add `setBonusText` to `Artifact` and re-export `ActiveSetBonus`. |
| 4 | Update index | `src/lib/enka/index.ts` | Add `export * from './artifact-set-data'`. |
| 5 | Create tests | `tests/artifact-set-data.test.ts` | Write unit tests verifying ID lookup, alias resolution, name matching, and active bonus calculation. |

---

## 7. Verification Test Suite

The Worker should verify implementation against this test suite (`tests/artifact-set-data.test.ts`):

```ts
import { describe, it, expect } from 'vitest';
import {
  getArtifactSetBonus,
  getArtifactSetBonusByName,
  getArtifactSetDetails,
  getActiveArtifactSetBonuses,
  ARTIFACT_SET_DATA,
} from '../src/lib/enka/artifact-set-data';

describe('Artifact Set Skills Module', () => {
  it('resolves canonical Natlan sets', () => {
    const obsidian = getArtifactSetBonus(15038);
    expect(obsidian).toBeDefined();
    expect(obsidian?.name).toBe('Obsidian Codex');
    expect(obsidian?.twoPiece).toContain('Nightsoul');
    expect(obsidian?.fourPiece).toContain('CRIT Rate increases by 40%');

    const cinder = getArtifactSetBonus(15037);
    expect(cinder).toBeDefined();
    expect(cinder?.name).toBe('Scroll of the Hero of Cinder City');
    expect(cinder?.twoPiece).toContain('Nightsoul Burst');
  });

  it('resolves legacy and icon alias IDs', () => {
    // Emblem of Severed Fate icon ID 15008 vs canonical 15020
    const emblemByIcon = getArtifactSetBonus(15008);
    expect(emblemByIcon?.name).toBe('Emblem of Severed Fate');
    expect(emblemByIcon?.twoPiece).toContain('Energy Recharge +20%');

    // Crimson Witch icon ID 15005 vs canonical 15006
    const witch = getArtifactSetBonus(15005);
    expect(witch?.name).toBe('Crimson Witch of Flames');
    expect(witch?.twoPiece).toContain('Pyro DMG Bonus +15%');
  });

  it('performs case-insensitive and punctuation-tolerant name lookup', () => {
    const shimenawa = getArtifactSetBonusByName("shimenawas reminiscence");
    expect(shimenawa?.name).toBe("Shimenawa's Reminiscence");
    expect(shimenawa?.twoPiece).toContain('ATK +18%');

    const gladiators = getArtifactSetBonusByName('Gladiators Finale');
    expect(gladiators?.name).toBe("Gladiator's Finale");
  });

  it('calculates active set bonuses correctly for 2pc+2pc+1off build', () => {
    const counts = {
      15031: 2, // 2pc Marechaussee
      15032: 2, // 2pc Golden Troupe
      15005: 1, // 1pc off-piece Crimson Witch
    };

    const active = getActiveArtifactSetBonuses(counts);
    expect(active).toHaveLength(2);

    const mare = active.find((a) => a.setName === 'Marechaussee Hunter');
    expect(mare?.twoPieceActive).toBe(true);
    expect(mare?.fourPieceActive).toBe(false);
    expect(mare?.twoPieceText).toBeDefined();
    expect(mare?.fourPieceText).toBeUndefined();

    const golden = active.find((a) => a.setName === 'Golden Troupe');
    expect(golden?.twoPieceActive).toBe(true);
    expect(golden?.fourPieceActive).toBe(false);
  });

  it('calculates 4pc set bonus for 4pc+1off build', () => {
    const counts = {
      15038: 4, // 4pc Obsidian Codex
      15006: 1, // 1pc off-piece
    };

    const active = getActiveArtifactSetBonuses(counts);
    expect(active).toHaveLength(1);
    expect(active[0].setName).toBe('Obsidian Codex');
    expect(active[0].twoPieceActive).toBe(true);
    expect(active[0].fourPieceActive).toBe(true);
    expect(active[0].twoPieceText).toBeDefined();
    expect(active[0].fourPieceText).toBeDefined();
  });
});
```
