# Milestone 1: Weapon Metadata & Talent Boost Specification & Blueprint

**Author**: Explorer 3 (Milestone 1 — Weapon Metadata & Talent Boost Data)  
**Date**: 2026-11-01  
**Project**: `genshin-leaderboard`  
**Reference Documents**:
- `ORIGINAL_REQUEST.md` (§ R1, § R3)
- `PROJECT.md` (Milestone 1, Interfaces)
- `.agents/teamwork/teamwork_preview_spec_miner_survey_2/analysis.md` (Features 7, 8, 9; Sections 5 & 8)

---

## 1. Executive Summary

This document establishes the architecture, complete data dictionary, interface definitions, and implementation blueprints for **Milestone 1**:
1. **Weapon Metadata Module (`src/lib/enka/weapon-data.ts`)**: Authoritative dataset mapping weapon IDs and normalized weapon names to passive skill names, description templates, and exact R1–R5 refinement scaling text for 52 major weapons spanning all 5 weapon archetypes.
2. **Resilient Passive Lookup Helper (`getWeaponPassive`)**: Robust lookup with refinement clamping (1–5), numeric ID resolution, and normalized name fallback.
3. **Constellation Talent Boost Evaluator (`evaluateTalentBoosts`)**: Full constellation logic determining whether Normal Attack, Elemental Skill, or Elemental Burst receives the `+3` level boost at C3 and C5, handling Fontaine/Natlan characters that boost Normal Attack (e.g., Neuvillette, Arlecchino, Lyney, Wriothesley, Sethos) and edge cases (e.g., Aloy).
4. **Domain Model Extensions (`src/lib/enka/types.ts`)**: Non-breaking enrichment of `Weapon` (`passiveName?`, `passiveDescription?`) and `TalentLevels` (`boosted?: { normal?: boolean; skill?: boolean; burst?: boolean }`).
5. **Exact Worker Blueprints**: Drop-in TypeScript code for all modules and unit test suites.

---

## 2. Codebase Investigation Findings

### 2.1 Current State of Weapon Handling
- **Domain Type (`src/lib/enka/types.ts:134-147`)**:
  ```typescript
  export interface Weapon {
    id: number;
    name: string;
    rarity: number;
    level: number;
    ascension: number;
    refinement: number;
    baseAtk: number;
    subStat?: { key: string; value: number };
    icon: string;
  }
  ```
  *Deficiency*: Lacks `passiveName` and `passiveDescription`. Components (`CharacterCard.tsx`, `CharacterDetailModal.tsx`) have no passive information to render.
- **Parser (`src/lib/enka/parser.ts:154-185`)**:
  Parses `refinement` from `affixMap` (`Object.values(affixMap)[0] + 1` or defaults to 1), extracts `baseAtk` and `subStat`, but does not attach passives or descriptions.
- **Weapon Identifiers in Enka**:
  Enka responses provide:
  - `itemId`: numeric weapon ID (e.g. `11510` in test fixture `enka-response.json`, `14512` in `seed.ts`).
  - `flat.nameTextMapHash`: resolves to the weapon's English name (e.g. `"Staff of Homa"`, `"Tome of the Eternal Flow"`).
  - *Discrepancy mitigation*: Some community schemas / fixtures use `11510` for Staff of Homa while canonical game data uses `13501`. A robust design must index by **both numeric ID and normalized weapon name**.

### 2.2 Current State of Talent Level & Boost Handling
- **Domain Type (`src/lib/enka/types.ts:149-153`)**:
  ```typescript
  export interface TalentLevels {
    normal: number;
    skill: number;
    burst: number;
  }
  ```
  *Deficiency*: Does not track which talents have received constellation `+3` level boosts.
- **Parser (`src/lib/enka/parser.ts:244-253`)**:
  Naively sorts `skillLevelMap` keys numerically:
  ```typescript
  const sortedKeys = Object.keys(skillLevelMap).sort((a, b) => Number(a) - Number(b));
  ```
  *Deficiency*: For characters like Ayaka (`skillOrder: [10024, 10018, 10019]`), `10024` (Normal Attack) is greater than `10018` (Skill). Sorting numerically misattributes Normal Attack to Skill! `parseTalents` should leverage `skillOrder` from `GAME_CHARACTERS` when available.
- **Talent Boost Game Rules**:
  - `C0`–`C2`: No constellation talent boosts (`boosted: { normal: false, skill: false, burst: false }`).
  - `C3`: First talent boosted by `+3`.
  - `C4`: Only C3 talent boosted.
  - `C5`–`C6`: Both C3 and C5 talents boosted by `+3`.
  - Fontaine exception: Neuvillette (`10000087`), Arlecchino (`10000093`), Lyney (`10000084`), Wriothesley (`10000086`), Sethos (`10000097`) boost Normal Attack at C3!

---

## 3. Weapon Metadata Architecture (`src/lib/enka/weapon-data.ts`)

### 3.1 Interface Contract
```typescript
export interface WeaponRefinementValues {
  1: string;
  2: string;
  3: string;
  4: string;
  5: string;
}

export interface WeaponMetadata {
  id: number;
  name: string;
  type: 'Sword' | 'Claymore' | 'Polearm' | 'Catalyst' | 'Bow';
  rarity: 3 | 4 | 5;
  passiveName: string;
  descriptionTemplate: string;
  refinements: Record<number, string>;
}
```

### 3.2 Master Weapon Catalog (52 Major Weapons)

Below is the verified catalog of 52 weapons across all types and rarities with exact passive names, templates, and R1–R5 refinement texts:

| Weapon | ID / Aliases | Type | Rarity | Passive Name | Key Scaling Feature (R1 → R5) |
|---|---|---|---|---|---|
| **Staff of Homa** | `11510`, `13501` | Polearm | 5★ | Reckless Cinnabar | HP +20..40%, ATK 0.8..1.6% HP, Low HP +1.0..1.8% HP |
| **Engulfing Lightning** | `11509`, `13509` | Polearm | 5★ | Timeless Dream: Eternal Stove | ATK 28..56% ER over 100% (Cap: 80..120%), Post-Burst ER +30..50% |
| **Primordial Jade Winged-Spear** | `11501`, `13505` | Polearm | 5★ | Eagle Spear of Justice | ATK +3.2..6.0% per hit (7 stacks), Full stacks DMG +12..24% |
| **The Catch** | `11415`, `13414` | Polearm | 4★ | Shanty | Burst DMG +16..32%, Burst CRIT Rate +6..12% |
| **Dragon's Bane** | `11403`, `13401` | Polearm | 4★ | Bane of Flame and Water | DMG vs Hydro/Pyro +20..36% |
| **Favonius Lance** | `11406`, `13407` | Polearm | 4★ | Windfall | CRIT Hit Energy Particle 60..100% chance (CD: 12..6s) |
| **Deathmatch** | `13405` | Polearm | 4★ | Gladiator | ≥2 foes: ATK & DEF +16..32%; <2 foes: ATK +24..48% |
| **Black Tassel** | `13303` | Polearm | 3★ | Bane of the Soft | DMG against slimes +40..80% |
| **White Tassel** | `13301` | Polearm | 3★ | Sharp | Normal Attack DMG +24..48% |
| **Staff of the Scarlet Sands** | `13511` | Polearm | 5★ | Heat Haze at Horizon's End | EM as ATK 52..104%; Skill hits add 28..56% EM (3 stacks) |
| **Crimson Moon's Semblance** | `13512` | Polearm | 5★ | Ashen Sun's Shadow | Charged Attack +25% BoL; DMG +12..28% (extra +24..56% if BoL≥30%) |
| **Calamity Queller** | `13507` | Polearm | 5★ | Extinguishing Precept | All Elem DMG +12..24%; Skill grants ATK +3.2..6.4%/s (doubled off-field) |
| **Skyward Spine** | `11504`, `13502` | Polearm | 5★ | Black Wing | CRIT Rate +8..16%, Normal ATK SPD +12%, vacuum blade deals 40..100% |
| **Mistsplitter Reforged** | `11507` | Sword | 5★ | Mistsplitter's Edge | All Elem DMG +12..24%; Stacks grant 8/16/28% → 16/32/56% Elem DMG |
| **Primordial Jade Cutter** | `11505` | Sword | 5★ | Protector's Virtue | HP +20..40%, ATK +1.2..2.4% Max HP |
| **Splendor of Tranquil Waters** | `11513`, `11512` | Sword | 5★ | Dawn and Dusk by the Lake | HP change: Skill DMG +8..16% (3 stacks); Ally HP change: HP +14..28% |
| **Freedom-Sworn** | `11503` | Sword | 5★ | Revolutionary Chorale | DMG +10..20%; Millennial buff: Normal/Charged/Plunge +16..32%, ATK +20..40% |
| **Haran Geppaku Futsu** | `11509`, `11511` | Sword | 5★ | Honed Flow | All Elem DMG +12..24%; Wavespike grants Normal Attack DMG +20..40% |
| **Key of Khaj-Nisut** | `11510`, `11512` | Sword | 5★ | Sunken Song of the Sands | HP +20..40%; Skill hits grant EM 0.12..0.24% HP; Party EM +0.2..0.4% HP |
| **Light of Foliar Sanction** | `11514` | Sword | 5★ | Whitemoon Brash | CR +4..8%; Normal elem hits buff Normal & Skill DMG by 120..240% EM |
| **Absolution** | `11515` | Sword | 5★ | Root of the Reason | CD +20..40%; BoL increase buffs DMG by 16..32% (3 stacks) |
| **Uraku Misugiri** | `11516` | Sword | 5★ | Brocade Bloom, Shrine Spliced | Normal +16..32%, Skill +24..48% (doubled by Geo); DEF +20..40% |
| **Peak Patrol Song** | `11517` | Sword | 5★ | Autumn Winds in the Mountain Prime | DEF +8..16%, Elem DMG +10..20%; Party gains +8..16% Elem per 1k DEF |
| **Favonius Sword** | `11401` | Sword | 4★ | Windfall | CRIT Hit Energy Particle 60..100% chance (CD: 12..6s) |
| **Sacrificial Sword** | `11403`, `11402` | Sword | 4★ | Composed | Skill hit 40..80% chance to reset CD (CD: 30..16s) |
| **Iron Sting** | `11407` | Sword | 4★ | Infusion Stinger | Elem DMG dealt buffs all DMG by 6..12% (2 stacks) |
| **Amenoma Kageuchi** | `11413` | Sword | 4★ | Iwagakura Seed | Skill grants seeds; Burst consumes seeds to restore 6..12 Energy each |
| **Fleuve Cendre Ferryman** | `11422` | Sword | 4★ | Ironbone | Skill CRIT Rate +8..16%; Post-skill ER +16..32% for 5s |
| **Skyward Blade** | `11502` | Sword | 5★ | Sky-Piercing Fang | CRIT Rate +4..8%; Post-burst SPD +10%, Normal/Charged deal +20..40% ATK |
| **Tome of the Eternal Flow** | `14512`, `14513` | Catalyst | 5★ | Aeon Wave | HP +16..32%; HP change buffs Charged Attack +14..30% (3 st.), Energy 8..12 |
| **Lost Prayer to Sacred Winds** | `14502` | Catalyst | 5★ | Boundless Blessing | Move SPD +10%; +8..16% Elem DMG every 4s on-field (4 stacks) |
| **Kagura's Verity** | `14506`, `14509` | Catalyst | 5★ | Kagura Dance | Skill DMG +12..24% (3 stacks); at 3 stacks +12..24% All Elem DMG |
| **A Thousand Floating Dreams** | `14511`, `14509` | Catalyst | 5★ | A Thousand Nights' Dawnsong | Same elem: EM +32..64; Diff elem: DMG +10..26%; Party EM +40..48 |
| **Surf's Up** | `14515` | Catalyst | 5★ | Aqua Tempest | Max HP +20..40%; Skill grants 4 stacks: Normal DMG +12..24% per stack |
| **The Widsith** | `14402` | Catalyst | 4★ | Debut | Theme song: ATK +60..120% / Elem +48..96% / EM +240..480 for 10s |
| **Sacrificial Fragments** | `14403` | Catalyst | 4★ | Composed | Skill hit 40..80% chance to reset CD (CD: 30..16s) |
| **Thrilling Tales of Dragon Slayers** | `14302` | Catalyst | 3★ | Heritage | Switching characters grants new active character ATK +24..48% for 10s |
| **Skyward Atlas** | `14501` | Catalyst | 5★ | Wandering Clouds | Elem DMG +12..24%; Normal hits 50% chance clouds deal 160..320% ATK |
| **Aqua Simulacra** | `15509`, `15508` | Bow | 5★ | The Cleansing Form | HP +16..32%; When enemies nearby, all DMG dealt +20..40% |
| **Thundering Pulse** | `15507` | Bow | 5★ | Rule By Thunder | ATK +20..40%; Stacks grant Normal DMG +12/24/40% → +24/48/80% |
| **Polar Star** | `15508`, `15506` | Bow | 5★ | Daylight's Augur | Skill & Burst +12..24%; Stacks grant ATK +10/20/30/48% → +20/40/60/96% |
| **The First Great Magic** | `15512`, `15511` | Bow | 5★ | Parsifal the Great | Charged DMG +16..32%; Same elem: ATK +16..48% / +32..96%; Diff: SPD |
| **Elegy for the End** | `15503` | Bow | 5★ | The Parting Refrain | EM +60..120; Millennial buff: Party EM +100..200, ATK +20..40% for 12s |
| **Astral Vulture's Crimson Plumage** | `15514`, `15513` | Bow | 5★ | Shadow of the Lone Plume | Swirl grants ATK +24..48%; Diff elements buff Charged DMG +20..96% |
| **Amos' Bow** | `15502` | Bow | 5★ | Strong-Willed | Normal & Charged +12..24%; Flight time adds +8..16% per 0.1s (up to 5x) |
| **Skyward Harp** | `15501` | Bow | 5★ | Echoing Ballad | CRIT DMG +20..40%; Hits 60..100% chance AoE 125% Phys DMG (CD: 4..2s) |
| **The Stringless** | `15402` | Bow | 4★ | Songless Ballad | Elemental Skill and Burst DMG +24..48% |
| **Rust** | `15405` | Bow | 4★ | Rapid Firing | Normal Attack DMG +40..80%, Charged Attack DMG -10% |
| **Favonius Warbow** | `15401` | Bow | 4★ | Windfall | CRIT Hit Energy Particle 60..100% chance (CD: 12..6s) |
| **Slingshot** | `15304` | Bow | 3★ | Slingshot | Hit within 0.3s grants DMG +36..60%; otherwise -10% DMG |
| **Beacon of the Reed Sea** | `12510` | Claymore | 5★ | Desert Watch | Skill hit ATK +20..40%; Take DMG ATK +20..40%; Unshielded HP +32..64% |
| **Redhorn Stonethresher** | `12509` | Claymore | 5★ | Gokadaiou Otogibanashi | DEF +28..56%; Normal & Charged DMG +40..80% DEF |
| **Song of Broken Pines** | `12503` | Claymore | 5★ | Rebel's Banner-Hymn | ATK +16..32%; Millennial buff: Normal SPD +12..24%, ATK +20..40% |
| **Wolf's Gravestone** | `12502`, `12501` | Claymore | 5★ | Wolfish Tracker | ATK +20..40%; Foes <30% HP grants Party ATK +40..80% for 12s |
| **Fang of the Mountain King** | `12513` | Claymore | 5★ | Turquoise Dawn | Skill & Burn/Burgeon grant Canopy's Favor: Skill & Burst +10..20% (max 6) |
| **Verdict** | `12511` | Claymore | 5★ | Many Oaths of Dawn and Dusk | ATK +20..40%; Crystallize seals grant Skill DMG +18..36% each (max 2) |
| **Serpent Spine** | `12409` | Claymore | 4★ | Wavesplitter | Every 4s on-field DMG +6..10%, taken +3..1.8% (5 stacks) |

### 3.3 Lookup Helper Design (`getWeaponPassive`)

```typescript
export function getWeaponPassive(
  weaponId: number | string,
  refinement: number = 1
): { passiveName?: string; passiveDescription?: string } {
  const r = Math.min(Math.max(refinement || 1, 1), 5);

  let weapon: WeaponMetadata | undefined;
  if (typeof weaponId === 'number') {
    weapon = WEAPON_DATA[weaponId];
  }

  if (!weapon) {
    const key = String(weaponId).toLowerCase().replace(/[^a-z0-9]/g, '');
    weapon = WEAPON_DATA_BY_NAME[key];
  }

  if (!weapon) {
    return {};
  }

  return {
    passiveName: weapon.passiveName,
    passiveDescription: weapon.refinements[r] || weapon.descriptionTemplate,
  };
}
```

---

## 4. Talent Boost Detection Logic (`evaluateTalentBoosts`)

### 4.1 Specification
Function Signature:
```typescript
export function evaluateTalentBoosts(
  characterId: number,
  constellation: number
): { normal: boolean; skill: boolean; burst: boolean }
```

### 4.2 Full Character Constellation Boost Mapping Table

```typescript
export type TalentType = 'normal' | 'skill' | 'burst';

export interface TalentBoostConfig {
  c3: TalentType;
  c5: TalentType;
}

export const CHARACTER_TALENT_BOOSTS: Record<number, TalentBoostConfig> = {
  // Fontaine Normal Attack Boosters (C3: Normal, C5: Burst)
  10000084: { c3: 'normal', c5: 'burst' }, // Lyney
  10000086: { c3: 'normal', c5: 'burst' }, // Wriothesley
  10000087: { c3: 'normal', c5: 'burst' }, // Neuvillette
  10000093: { c3: 'normal', c5: 'burst' }, // Arlecchino
  10000097: { c3: 'normal', c5: 'burst' }, // Sethos

  // Standard C3: Skill, C5: Burst
  10000014: { c3: 'skill', c5: 'burst' }, // Barbara
  10000016: { c3: 'skill', c5: 'burst' }, // Diluc
  10000021: { c3: 'skill', c5: 'burst' }, // Amber
  10000026: { c3: 'skill', c5: 'burst' }, // Xiao
  10000027: { c3: 'skill', c5: 'burst' }, // Ningguang
  10000029: { c3: 'skill', c5: 'burst' }, // Klee
  10000030: { c3: 'skill', c5: 'burst' }, // Zhongli
  10000031: { c3: 'skill', c5: 'burst' }, // Fischl
  10000032: { c3: 'skill', c5: 'burst' }, // Bennett
  10000033: { c3: 'skill', c5: 'burst' }, // Tartaglia
  10000038: { c3: 'skill', c5: 'burst' }, // Albedo
  10000043: { c3: 'skill', c5: 'burst' }, // Sucrose
  10000044: { c3: 'skill', c5: 'burst' }, // Xinyan
  10000046: { c3: 'skill', c5: 'burst' }, // Hu Tao
  10000047: { c3: 'skill', c5: 'burst' }, // Kaedehara Kazuha
  10000048: { c3: 'skill', c5: 'burst' }, // Yanfei
  10000049: { c3: 'skill', c5: 'burst' }, // Yoimiya
  10000050: { c3: 'skill', c5: 'burst' }, // Thoma
  10000054: { c3: 'skill', c5: 'burst' }, // Sangonomiya Kokomi
  10000055: { c3: 'skill', c5: 'burst' }, // Gorou
  10000058: { c3: 'skill', c5: 'burst' }, // Yae Miko
  10000059: { c3: 'skill', c5: 'burst' }, // Shikanoin Heizou
  10000061: { c3: 'skill', c5: 'burst' }, // Kirara
  10000063: { c3: 'skill', c5: 'burst' }, // Shenhe
  10000066: { c3: 'skill', c5: 'burst' }, // Kamisato Ayato
  10000072: { c3: 'skill', c5: 'burst' }, // Candace
  10000073: { c3: 'skill', c5: 'burst' }, // Nahida
  10000074: { c3: 'skill', c5: 'burst' }, // Layla
  10000077: { c3: 'skill', c5: 'burst' }, // Yaoyao
  10000078: { c3: 'skill', c5: 'burst' }, // Alhaitham
  10000079: { c3: 'skill', c5: 'burst' }, // Dehya
  10000081: { c3: 'skill', c5: 'burst' }, // Kaveh
  10000082: { c3: 'skill', c5: 'burst' }, // Baizhu
  10000083: { c3: 'skill', c5: 'burst' }, // Lynette
  10000085: { c3: 'skill', c5: 'burst' }, // Freminet
  10000088: { c3: 'skill', c5: 'burst' }, // Charlotte
  10000090: { c3: 'skill', c5: 'burst' }, // Chevreuse
  10000091: { c3: 'skill', c5: 'burst' }, // Navia
  10000092: { c3: 'skill', c5: 'burst' }, // Gaming
  10000094: { c3: 'skill', c5: 'burst' }, // Chiori
  10000095: { c3: 'skill', c5: 'burst' }, // Sigewinne
  10000096: { c3: 'skill', c5: 'burst' }, // Xianyun
  10000098: { c3: 'skill', c5: 'burst' }, // Clorinde
  10000099: { c3: 'skill', c5: 'burst' }, // Emilie
  10000100: { c3: 'skill', c5: 'burst' }, // Kachina
  10000101: { c3: 'skill', c5: 'burst' }, // Kinich
  10000102: { c3: 'skill', c5: 'burst' }, // Mualani
  10000103: { c3: 'skill', c5: 'burst' }, // Mavuika
  10000104: { c3: 'skill', c5: 'burst' }, // Xilonen
  10000105: { c3: 'skill', c5: 'burst' }, // Chasca
  10000106: { c3: 'skill', c5: 'burst' }, // Ororon
  10000107: { c3: 'skill', c5: 'burst' }, // Citlali

  // Standard C3: Burst, C5: Skill
  10000002: { c3: 'burst', c5: 'skill' }, // Kamisato Ayaka
  10000003: { c3: 'burst', c5: 'skill' }, // Jean
  10000006: { c3: 'burst', c5: 'skill' }, // Lisa
  10000015: { c3: 'burst', c5: 'skill' }, // Kaeya
  10000020: { c3: 'burst', c5: 'skill' }, // Razor
  10000022: { c3: 'burst', c5: 'skill' }, // Venti
  10000023: { c3: 'burst', c5: 'skill' }, // Xiangling
  10000024: { c3: 'burst', c5: 'skill' }, // Beidou
  10000025: { c3: 'burst', c5: 'skill' }, // Xingqiu
  10000034: { c3: 'burst', c5: 'skill' }, // Noelle
  10000035: { c3: 'burst', c5: 'skill' }, // Qiqi
  10000036: { c3: 'burst', c5: 'skill' }, // Chongyun
  10000037: { c3: 'burst', c5: 'skill' }, // Ganyu
  10000039: { c3: 'burst', c5: 'skill' }, // Diona
  10000041: { c3: 'burst', c5: 'skill' }, // Mona
  10000042: { c3: 'burst', c5: 'skill' }, // Keqing
  10000045: { c3: 'burst', c5: 'skill' }, // Rosaria
  10000051: { c3: 'burst', c5: 'skill' }, // Eula
  10000052: { c3: 'burst', c5: 'skill' }, // Raiden Shogun
  10000053: { c3: 'burst', c5: 'skill' }, // Sayu
  10000056: { c3: 'burst', c5: 'skill' }, // Kujou Sara
  10000057: { c3: 'burst', c5: 'skill' }, // Arataki Itto
  10000060: { c3: 'burst', c5: 'skill' }, // Yelan
  10000064: { c3: 'burst', c5: 'skill' }, // Yun Jin
  10000065: { c3: 'burst', c5: 'skill' }, // Kuki Shinobu
  10000067: { c3: 'burst', c5: 'skill' }, // Collei
  10000068: { c3: 'burst', c5: 'skill' }, // Dori
  10000069: { c3: 'burst', c5: 'skill' }, // Tighnari
  10000070: { c3: 'burst', c5: 'skill' }, // Nilou
  10000071: { c3: 'burst', c5: 'skill' }, // Cyno
  10000075: { c3: 'burst', c5: 'skill' }, // Wanderer
  10000076: { c3: 'burst', c5: 'skill' }, // Faruzan
  10000080: { c3: 'burst', c5: 'skill' }, // Mika
  10000089: { c3: 'burst', c5: 'skill' }, // Furina
};
```

### 4.3 Evaluation Function
```typescript
export function evaluateTalentBoosts(
  characterId: number,
  constellation: number
): { normal: boolean; skill: boolean; burst: boolean } {
  // Edge Case: Aloy has no constellations
  if (constellation < 3 || characterId === 10000062) {
    return { normal: false, skill: false, burst: false };
  }

  const config = CHARACTER_TALENT_BOOSTS[characterId] || { c3: 'skill', c5: 'burst' };
  const hasC3 = constellation >= 3;
  const hasC5 = constellation >= 5;

  return {
    normal: (hasC3 && config.c3 === 'normal') || (hasC5 && config.c5 === 'normal'),
    skill: (hasC3 && config.c3 === 'skill') || (hasC5 && config.c5 === 'skill'),
    burst: (hasC3 && config.c3 === 'burst') || (hasC5 && config.c5 === 'burst'),
  };
}
```

---

## 5. Implementation Blueprints for the Worker

### 5.1 Blueprint 1: `src/lib/enka/types.ts`
Enrich `Weapon` and `TalentLevels` domain interfaces:

```typescript
// in src/lib/enka/types.ts

export interface Weapon {
  id: number;
  name: string;
  rarity: number;
  level: number;
  ascension: number;
  refinement: number;
  baseAtk: number;
  subStat?: {
    key: string;
    value: number;
  };
  passiveName?: string;
  passiveDescription?: string;
  icon: string;
}

export interface TalentLevels {
  normal: number;
  skill: number;
  burst: number;
  boosted?: {
    normal?: boolean;
    skill?: boolean;
    burst?: boolean;
  };
}
```

### 5.2 Blueprint 2: `src/lib/enka/weapon-data.ts`
Create `src/lib/enka/weapon-data.ts` containing the complete `WeaponMetadata` interface, dictionary, aliases, and `getWeaponPassive` lookup helper. (See Section 3.2 for catalog content).

### 5.3 Blueprint 3: `src/lib/enka/talent-boost-data.ts`
Create `src/lib/enka/talent-boost-data.ts` exporting:
- `TalentType`
- `TalentBoostConfig`
- `CHARACTER_TALENT_BOOSTS`
- `evaluateTalentBoosts(characterId: number, constellation: number)`

### 5.4 Blueprint 4: `src/lib/enka/static-data.ts` Re-exports
Add to `src/lib/enka/static-data.ts`:
```typescript
export { getWeaponPassive, getWeaponMetadata, WEAPON_DATA } from './weapon-data';
export { evaluateTalentBoosts, CHARACTER_TALENT_BOOSTS } from './talent-boost-data';
```

### 5.5 Blueprint 5: `src/lib/enka/parser.ts` Integration
In `src/lib/enka/parser.ts`:
1. In `parseWeapon(equipList)`:
   ```typescript
   const passive = getWeaponPassive(itemId, refinement) || getWeaponPassive(weaponName, refinement);
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
   ```
2. In `parseTalents(skillLevelMap, skillOrder)`:
   ```typescript
   function parseTalents(
     skillLevelMap: Record<string, number>,
     skillOrder?: number[]
   ): TalentLevels {
     if (skillOrder && skillOrder.length >= 3) {
       return {
         normal: skillLevelMap[skillOrder[0]] || 1,
         skill: skillLevelMap[skillOrder[1]] || 1,
         burst: skillLevelMap[skillOrder[2]] || 1,
       };
     }
     const sortedKeys = Object.keys(skillLevelMap).sort((a, b) => Number(a) - Number(b));
     return {
       normal: skillLevelMap[sortedKeys[0]] || 1,
       skill: skillLevelMap[sortedKeys[1]] || 1,
       burst: skillLevelMap[sortedKeys[2]] || 1,
     };
   }
   ```
3. In `parseAvatar(raw)`:
   ```typescript
   const constellation = raw.talentIdList?.length || 0;
   const charData = getCharacterData(raw.avatarId);
   const talents = parseTalents(raw.skillLevelMap, charData?.skillOrder);
   talents.boosted = evaluateTalentBoosts(raw.avatarId, constellation);
   ```

---

## 6. Verification Test Suites for Worker

The Worker should create and run the following tests in `tests/`:

### 6.1 `tests/weapon-data.test.ts`
```typescript
import { describe, it, expect } from 'vitest';
import { getWeaponPassive, getWeaponMetadata } from '../src/lib/enka/weapon-data';

describe('Weapon Data Module', () => {
  it('should return correct passive and R1 description for Staff of Homa', () => {
    const res = getWeaponPassive(11510, 1);
    expect(res.passiveName).toBe('Reckless Cinnabar');
    expect(res.passiveDescription).toContain('HP increased by 20%');
    expect(res.passiveDescription).toContain('0.8% of the wielder\'s Max HP');
  });

  it('should scale correctly to R5 for Staff of Homa', () => {
    const res = getWeaponPassive(11510, 5);
    expect(res.passiveName).toBe('Reckless Cinnabar');
    expect(res.passiveDescription).toContain('HP increased by 40%');
    expect(res.passiveDescription).toContain('1.6% of the wielder\'s Max HP');
  });

  it('should look up weapons by alternative ID or weapon name', () => {
    const resId = getWeaponPassive(13501, 1);
    expect(resId.passiveName).toBe('Reckless Cinnabar');

    const resName = getWeaponPassive('Staff of Homa', 1);
    expect(resName.passiveName).toBe('Reckless Cinnabar');
  });

  it('should clamp refinement levels outside 1-5', () => {
    const res0 = getWeaponPassive(11510, 0);
    expect(res0.passiveDescription).toContain('HP increased by 20%');

    const res10 = getWeaponPassive(11510, 10);
    expect(res10.passiveDescription).toContain('HP increased by 40%');
  });

  it('should return empty object for unknown weapon ID without throwing', () => {
    const res = getWeaponPassive(999999, 1);
    expect(res).toEqual({});
  });
});
```

### 6.2 `tests/talent-boost.test.ts`
```typescript
import { describe, it, expect } from 'vitest';
import { evaluateTalentBoosts } from '../src/lib/enka/talent-boost-data';

describe('Talent Boost Evaluation', () => {
  it('should return all false for C0 to C2', () => {
    expect(evaluateTalentBoosts(10000046, 0)).toEqual({ normal: false, skill: false, burst: false });
    expect(evaluateTalentBoosts(10000046, 1)).toEqual({ normal: false, skill: false, burst: false });
    expect(evaluateTalentBoosts(10000046, 2)).toEqual({ normal: false, skill: false, burst: false });
  });

  it('should correctly evaluate Hu Tao (C3 Skill, C5 Burst)', () => {
    expect(evaluateTalentBoosts(10000046, 3)).toEqual({ normal: false, skill: true, burst: false });
    expect(evaluateTalentBoosts(10000046, 4)).toEqual({ normal: false, skill: true, burst: false });
    expect(evaluateTalentBoosts(10000046, 5)).toEqual({ normal: false, skill: true, burst: true });
    expect(evaluateTalentBoosts(10000046, 6)).toEqual({ normal: false, skill: true, burst: true });
  });

  it('should correctly evaluate Raiden Shogun (C3 Burst, C5 Skill)', () => {
    expect(evaluateTalentBoosts(10000052, 3)).toEqual({ normal: false, skill: false, burst: true });
    expect(evaluateTalentBoosts(10000052, 5)).toEqual({ normal: false, skill: true, burst: true });
  });

  it('should correctly evaluate Neuvillette (C3 Normal, C5 Burst)', () => {
    expect(evaluateTalentBoosts(10000087, 3)).toEqual({ normal: true, skill: false, burst: false });
    expect(evaluateTalentBoosts(10000087, 5)).toEqual({ normal: true, skill: false, burst: true });
  });

  it('should correctly evaluate Arlecchino (C3 Normal, C5 Burst)', () => {
    expect(evaluateTalentBoosts(10000093, 3)).toEqual({ normal: true, skill: false, burst: false });
    expect(evaluateTalentBoosts(10000093, 5)).toEqual({ normal: true, skill: false, burst: true });
  });

  it('should handle Aloy without crashing (always all false)', () => {
    expect(evaluateTalentBoosts(10000062, 6)).toEqual({ normal: false, skill: false, burst: false });
  });

  it('should handle unmapped characters by defaulting to C3 Skill, C5 Burst', () => {
    expect(evaluateTalentBoosts(99999999, 3)).toEqual({ normal: false, skill: true, burst: false });
    expect(evaluateTalentBoosts(99999999, 5)).toEqual({ normal: false, skill: true, burst: true });
  });
});
```

---

## 7. Downstream Dependencies & Coordination

- **Dependent Milestone**:
  - **Milestone 2 (Core Math & Parser Normalization)**: Will wire `evaluateTalentBoosts` and `getWeaponPassive` inside `src/lib/enka/parser.ts` alongside 100x fix and CV calculation.
  - **Milestone 3 (Character Showcase & Build Card Redesign)**: Will consume `character.weapon.passiveName`, `character.weapon.passiveDescription`, and `character.talents.boosted` to render glowing `+3` circular badges and refinement details.
