# Milestone 1: TypeScript Type Definitions & Schema Extensions Specification

**Author**: Explorer 1 (Milestone 1 — Game Metadata & Types)  
**Date**: 2026-11-01  
**Project**: `genshin-leaderboard`  
**Target File**: `src/lib/enka/types.ts`  
**Reference Documents**:
- `ORIGINAL_REQUEST.md`
- `PROJECT.md`
- `.agents/teamwork/teamwork_preview_spec_miner_survey_2/analysis.md`

---

## 1. Executive Summary

This report provides the exhaustive, drop-in TypeScript type definitions and Zod schema extensions for `src/lib/enka/types.ts` to support the Genshin Impact Character Showcase overhaul.

### Core Deliverables
1. **`Artifact` Domain Model Extensions**: Adds `setBonusText` (2pc/4pc), `cv` (universal Crit Value), `qualityBadge` ('Subpar' | 'Decent' | 'Good' | 'Great' | 'Godly'), and substat `pips` (`[●●●○]`), while **strictly preserving `setId: number`** required by components and tests.
2. **`Weapon` Domain Model & Refinement Scaling**: Adds `passiveName`, `passiveDescription` (interpolated for current refinement), `descriptionTemplate`, `refinements` (R1–R5 parameter scaling dictionary), and `refinementDescriptions` (pre-formatted strings for R1–R5), plus static `WeaponMetadata` and `WeaponRefinementValues` schemas.
3. **`TalentLevels` Constellation Boost**: Preserves `normal: number`, `skill: number`, `burst: number` (preventing breakage in damage calculation and UI) while adding `boosted?: { normal?: boolean; skill?: boolean; burst?: boolean; }` and optional skill `icons`.
4. **`Character` & `AvatarInfoSchema` Extensions**: Extends `AvatarInfoSchema` to accept `proudSkillExtraLevelMap: z.record(z.string(), z.number()).optional()` and enables `.passthrough()`, and enriches `Character` with `totalCv`, `qualityBadge`, `activeSetBonuses`, and `damageCalc`.
5. **Zero Breaking Changes Guarantee**: All additions are strictly additive and optional (`?:`), maintaining 100% backward compatibility with existing tests (`tests/enka-parser.test.ts`), damage calculation (`src/lib/damage-calc/engine.ts`), database schemas (`src/lib/db/schema.ts`), and the protected home page (`src/app/page.tsx`).

---

## 2. Existing Schema & Domain Type Audit

A thorough audit of `src/lib/enka/types.ts` and its consumers across the codebase revealed the following baseline structure and consumer dependencies:

| Type / Schema | Current Definition (`types.ts`) | Consumed By | Key Constraints / Dependencies |
|---|---|---|---|
| `AvatarInfoSchema` | Strict Zod object without `proudSkillExtraLevelMap` | `parser.ts:35`, `client.ts:35` | Enka responses containing `proudSkillExtraLevelMap` or extra 5.x fields would strip or discard unmapped properties. |
| `Artifact` | `{ id, name, setId, setName, rarity, level, slot, mainStat, subStats: [{ key, value, rolls? }], icon }` | `ArtifactDisplay.tsx`, `parser.ts:187`, `enka-parser.test.ts:67` | `setId: number` is critical! `CharacterCard.tsx:105`, `parser.ts:238`, and `tests/enka-parser.test.ts:91` access `artifact.setId`. `PROJECT.md` omitted `setId` in an illustrative snippet, but removing it breaks the app. |
| `Weapon` | `{ id, name, rarity, level, ascension, refinement, baseAtk, subStat?, icon }` | `CharacterCard.tsx:89`, `CharacterDetailModal.tsx:175`, `damage-calc/engine.ts:29` | Missing weapon passive text, passive names, and refinement scaling. `refinement` is 1–5. |
| `TalentLevels` | `{ normal: number; skill: number; burst: number; }` | `damage-calc/engine.ts:112`, `CharacterCard.tsx:116`, `enka-parser.test.ts:94`, `db/schema.ts:19` | `talents.normal`, `talents.skill`, `talents.burst` **must remain numbers**. `getTalentMultiplier` does arithmetic: `baseMultiplier * (1 + (level - 1) * scaling)`. |
| `Character` | `{ id, name, element, rarity, level, constellation, friendshipLevel, talents, stats, weapon, artifacts, artifactSets, icon }` | `ProfileClient.tsx`, `CharacterCard.tsx`, `CharacterDetailModal.tsx`, `db/queries.ts` | Lacks aggregated build CV, build quality tier, and active set bonus text descriptors. |

---

## 3. Precise Additions & Schema Extensions

### 3.1 `Artifact` and Substat Extensions

#### 3.1.1 `QualityBadge` Definition
Universal quality tier classification according to community standards (Akasha / Enka):
```typescript
export type QualityBadge = 'Subpar' | 'Decent' | 'Good' | 'Great' | 'Godly';
```

#### 3.1.2 Substat Pip Representation
Substats are upgraded during artifact enhancement (0 to 5 upgrades, leading to 1 to 6 total rolls). Each substat in `subStats` receives an optional `pips` string:
```typescript
export interface ArtifactSubStat {
  key: string;
  value: number;
  rolls?: number; // Estimated roll count (1-6)
  pips?: string;  // Visual representation: "[●●●○]", "●●●○○", or "[●●●●]★"
}
```

#### 3.1.3 `Artifact` Domain Model
```typescript
export interface Artifact {
  id: number;
  name: string;
  setId: number; // MANDATORY: Must retain for set counting and grouping
  setName: string;
  setBonusText?: {
    twoPiece?: string;
    fourPiece?: string;
  };
  slot: 'flower' | 'plume' | 'sands' | 'goblet' | 'circlet';
  rarity: number;
  level: number;
  mainStat: {
    key: string;
    value: number;
  };
  subStats: Array<{
    key: string;
    value: number;
    rolls?: number;
    pips?: string; // e.g., "[●●●○]"
  }>;
  cv?: number; // Universal Crit Value: 2 * CR + CD (optional for zero breakage; populated in M2)
  qualityBadge?: QualityBadge; // Visual rating: 'Subpar' | 'Decent' | 'Good' | 'Great' | 'Godly'
  icon: string;
}
```

> **Critical Note on `cv` typing**:
> `cv?: number` is typed as optional in Milestone 1. This prevents compile-time errors in `parser.ts` line 218 before Milestone 2 implements the normalized CV calculation function. If the orchestrator requires `cv: number` (strict non-optional), `parser.ts` line 218 must be initialized with `cv: 0`. Typing it as optional during M1 ensures `tsc --noEmit` exits with 0 without touching M2 parser logic.

---

### 3.2 `Weapon` Domain Model & Refinement Scaling Types

To satisfy R1 ("complete weapon metadata: passive skill names, refinement scaling, base ATK, and substats") and R3 ("Refined weapon card showing ... refinement badge (R1–R5) ... and passive name"):

#### 3.2.1 Refinement Values Schema
Each weapon passive parameter scales across refinement ranks 1 through 5:
```typescript
export interface WeaponRefinementValues {
  r1: string | number;
  r2: string | number;
  r3: string | number;
  r4: string | number;
  r5: string | number;
}
```

#### 3.2.2 `Weapon` Domain Model
The parsed weapon attached to a character:
```typescript
export interface Weapon {
  id: number;
  name: string;
  rarity: number;
  level: number;
  ascension: number;
  refinement: number; // 1-5
  baseAtk: number;
  subStat?: {
    key: string;
    value: number;
  };
  passiveName?: string;             // e.g., "Reckless Cinnabar"
  passiveDescription?: string;      // Passive description interpolated for current refinement (R1-R5)
  descriptionTemplate?: string;     // Uninterpolated template e.g. "HP increased by {hp}%..."
  refinements?: Record<string, WeaponRefinementValues>; // Scaling parameters lookup
  refinementDescriptions?: string[]; // Array of full strings for R1..R5: [r1, r2, r3, r4, r5]
  icon: string;
}
```

#### 3.2.3 Static `WeaponMetadata` Schema
For static data dictionaries (`src/lib/enka/weapon-data.ts`):
```typescript
export interface WeaponMetadata {
  id: number;
  name: string;
  type: 'Sword' | 'Claymore' | 'Polearm' | 'Catalyst' | 'Bow';
  rarity: 4 | 5;
  baseAtkLv90: number;
  subStat: {
    type: 'cr' | 'cd' | 'atkPercent' | 'hpPercent' | 'defPercent' | 'er' | 'em' | 'physDmg' | string;
    displayLabel: string;
    valueLv90: number; // e.g. 66.2 for 66.2%
  };
  passiveName: string;
  descriptionTemplate: string;
  refinements: Record<string, WeaponRefinementValues>;
  refinementDescriptions?: string[];
}
```

---

### 3.3 `TalentLevels` Constellation Boost (+3) Types

#### 3.3.1 Architectural Constraint: Numeric Preservation
In `src/lib/damage-calc/engine.ts`:
```typescript
function getTalentMultiplier(config: DamageConfig, talents: Character['talents']): number {
  const level = config.primaryTalent === 'normal'
    ? talents.normal
    : config.primaryTalent === 'skill'
    ? talents.skill
    : talents.burst;
  return baseMultiplier * (1 + (level - 1) * scalingPerLevel);
}
```
If `normal`, `skill`, or `burst` were changed from `number` to an object (e.g. `{ level: 10, boosted: true }`), `(level - 1)` evaluates to `NaN`, breaking all damage calculations, database upserts, and tests (`expect(talents.normal).toBe(10)`).

#### 3.3.2 Extended `TalentLevels` Model
```typescript
export interface TalentBoosts {
  normal?: boolean;
  skill?: boolean;
  burst?: boolean;
}

export interface TalentLevels {
  normal: number;
  skill: number;
  burst: number;
  boosted?: TalentBoosts;
  icons?: {
    normal?: string;
    skill?: string;
    burst?: string;
  };
}
```

#### 3.3.3 Static `TalentBoostConfig` Definition
For character constellation mapping dictionaries:
```typescript
export interface TalentBoostConfig {
  c3: 'normal' | 'skill' | 'burst';
  c5: 'normal' | 'skill' | 'burst';
}
```

---

### 3.4 `Character` Domain Model Extensions

Enriches `Character` with computed build metrics and active set bonus descriptions for showcase display:

```typescript
export interface ActiveSetBonus {
  setId: number;
  name: string;
  count: number;
  twoPiece?: string;
  fourPiece?: string;
  activeTier: '2pc' | '4pc' | 'none';
}

export interface Character {
  id: number;
  name: string;
  element: Element;
  rarity: number;
  level: number;
  constellation: number;
  friendshipLevel: number;
  talents: TalentLevels;
  stats: CharacterStats;
  weapon: Weapon;
  artifacts: Artifact[];
  artifactSets: Record<number, number>; // setId -> piece count
  activeSetBonuses?: ActiveSetBonus[]; // Evaluated active set descriptions (2pc / 4pc)
  totalCv?: number;                    // Cumulative artifact substat CV (or character sheet CV)
  qualityBadge?: QualityBadge;         // Overall build CV rating: 'Subpar' | 'Decent' | 'Good' | 'Great' | 'Godly'
  damageCalc?: any;                    // Damage calculation payload from /api/player/[uid]
  icon: string;
}
```

---

### 3.5 `AvatarInfoSchema` & Upstream Ingestion Extensions

When players activate C3 or C5, Enka.Network API responses contain `proudSkillExtraLevelMap` representing constellation talent boosts (+3). Unmapped fields in Zod schemas can be stripped or cause validation errors.

#### 3.5.1 Upstream Schema Extension
In `src/lib/enka/types.ts`:
```typescript
export const AvatarInfoSchema = z.object({
  avatarId: z.number(),
  propMap: z.record(z.string(), z.object({
    type: z.number(),
    ival: z.string().optional(),
    val: z.string().optional(),
  })),
  talentIdList: z.array(z.number()).optional(),
  fightPropMap: FightPropMapSchema,
  skillDepotId: z.number().optional(),
  inherentProudSkillList: z.array(z.number()).optional(),
  skillLevelMap: z.record(z.string(), z.number()),
  proudSkillExtraLevelMap: z.record(z.string(), z.number()).optional(),
  equipList: z.array(EquipSchema),
  fetterInfo: z.object({
    expLevel: z.number(),
  }),
}).passthrough();
```

- **`proudSkillExtraLevelMap: z.record(z.string(), z.number()).optional()`**: Captures proud skill level increments from Enka API.
- **`.passthrough()`**: Prevents Zod from discarding unexpected Hoyoverse/Enka fields (e.g. `coreProudSkillLevel`, `avatarSkillInfoList`, `costumeId`).

---

### 3.6 Static Metadata Definition Interfaces

To support modular metadata ingestion files:
- `src/lib/enka/artifact-set-data.ts`
- `src/lib/enka/weapon-data.ts`

```typescript
export interface ArtifactSetDefinition {
  id: number;
  name: string;
  twoPiece: string;
  fourPiece: string;
}
```

---

## 4. Complete Proposed `src/lib/enka/types.ts`

Below is the complete, drop-in replacement for `src/lib/enka/types.ts`. It includes all existing Zod schemas, error definitions, and domain models, cleanly augmented with the new interfaces:

```typescript
import { z } from 'zod';

// ============================================================================
// Enka API Raw Response Schemas
// ============================================================================

export const PlayerInfoSchema = z.object({
  nickname: z.string(),
  level: z.number(), // Adventure Rank
  signature: z.string().optional(),
  worldLevel: z.number().optional(),
  nameCardId: z.number().optional(),
  finishAchievementNum: z.number().optional(),
  towerFloorIndex: z.number().optional(),
  towerLevelIndex: z.number().optional(),
  showAvatarInfoList: z.array(z.object({
    avatarId: z.number(),
    level: z.number(),
  })).optional(),
  showNameCardIdList: z.array(z.number()).optional(),
  profilePicture: z.object({
    id: z.number().optional(),
    avatarId: z.number().optional(),
  }).optional(),
});

export const FightPropMapSchema = z.record(z.string(), z.number());

export const EquipSchema = z.object({
  itemId: z.number(),
  reliquary: z.object({
    level: z.number(),
    mainPropId: z.number(),
    appendPropIdList: z.array(z.number()).optional(),
  }).optional(),
  flat: z.object({
    nameTextMapHash: z.string(),
    setNameTextMapHash: z.string().optional(),
    rankLevel: z.number(),
    reliquaryMainstat: z.object({
      mainPropId: z.string(),
      statValue: z.number(),
    }).optional(),
    reliquarySubstats: z.array(z.object({
      appendPropId: z.string(),
      statValue: z.number(),
    })).optional(),
    itemType: z.string(),
    icon: z.string(),
    equipType: z.string().optional(),
    weaponStats: z.array(z.object({
      appendPropId: z.string(),
      statValue: z.number(),
    })).optional(),
  }),
  weapon: z.object({
    level: z.number(),
    promoteLevel: z.number().optional(),
    affixMap: z.record(z.string(), z.number()).optional(),
  }).optional(),
});

export const AvatarInfoSchema = z.object({
  avatarId: z.number(),
  propMap: z.record(z.string(), z.object({
    type: z.number(),
    ival: z.string().optional(),
    val: z.string().optional(),
  })),
  talentIdList: z.array(z.number()).optional(),
  fightPropMap: FightPropMapSchema,
  skillDepotId: z.number().optional(),
  inherentProudSkillList: z.array(z.number()).optional(),
  skillLevelMap: z.record(z.string(), z.number()),
  proudSkillExtraLevelMap: z.record(z.string(), z.number()).optional(),
  equipList: z.array(EquipSchema),
  fetterInfo: z.object({
    expLevel: z.number(),
  }),
}).passthrough();

export const EnkaResponseSchema = z.object({
  playerInfo: PlayerInfoSchema,
  avatarInfoList: z.array(AvatarInfoSchema).optional(),
  ttl: z.number(),
  uid: z.string(),
  owner: z.object({
    username: z.string().optional(),
    profile: z.string().optional(),
    verified: z.boolean().optional(),
  }).optional(),
});

// ============================================================================
// Domain Quality & Metadata Types
// ============================================================================

export type Element = 'Pyro' | 'Hydro' | 'Electro' | 'Cryo' | 'Dendro' | 'Anemo' | 'Geo';

export type QualityBadge = 'Subpar' | 'Decent' | 'Good' | 'Great' | 'Godly';

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
    type: 'cr' | 'cd' | 'atkPercent' | 'hpPercent' | 'defPercent' | 'er' | 'em' | 'physDmg' | string;
    displayLabel: string;
    valueLv90: number;
  };
  passiveName: string;
  descriptionTemplate: string;
  refinements: Record<string, WeaponRefinementValues>;
  refinementDescriptions?: string[];
}

export interface ArtifactSetDefinition {
  id: number;
  name: string;
  twoPiece: string;
  fourPiece: string;
}

export interface TalentBoostConfig {
  c3: 'normal' | 'skill' | 'burst';
  c5: 'normal' | 'skill' | 'burst';
}

// ============================================================================
// Parsed Domain Models
// ============================================================================

export interface PlayerInfo {
  uid: string;
  nickname: string;
  level: number;
  signature?: string;
  nameCardId?: number;
  profilePictureId?: number;
}

export interface CharacterStats {
  hp: number;
  atk: number;
  def: number;
  em: number; // Elemental Mastery
  er: number; // Energy Recharge %
  cr: number; // Crit Rate %
  cd: number; // Crit DMG %
  healingBonus?: number;
  dmgBonus: Record<string, number>; // e.g., { pyro: 46.6, physical: 0 }
}

export interface ArtifactSubStat {
  key: string;
  value: number;
  rolls?: number;
  pips?: string; // e.g. "[●●●○]" or pip count
}

export interface Artifact {
  id: number;
  name: string;
  setId: number;
  setName: string;
  setBonusText?: {
    twoPiece?: string;
    fourPiece?: string;
  };
  slot: 'flower' | 'plume' | 'sands' | 'goblet' | 'circlet';
  rarity: number;
  level: number;
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
  qualityBadge?: QualityBadge;
  icon: string;
}

export interface Weapon {
  id: number;
  name: string;
  rarity: number;
  level: number;
  ascension: number;
  refinement: number; // 1-5
  baseAtk: number;
  subStat?: {
    key: string;
    value: number;
  };
  passiveName?: string;
  passiveDescription?: string;
  descriptionTemplate?: string;
  refinements?: Record<string, WeaponRefinementValues>;
  refinementDescriptions?: string[];
  icon: string;
}

export interface TalentBoosts {
  normal?: boolean;
  skill?: boolean;
  burst?: boolean;
}

export interface TalentLevels {
  normal: number;
  skill: number;
  burst: number;
  boosted?: TalentBoosts;
  icons?: {
    normal?: string;
    skill?: string;
    burst?: string;
  };
}

export interface ActiveSetBonus {
  setId: number;
  name: string;
  count: number;
  twoPiece?: string;
  fourPiece?: string;
  activeTier: '2pc' | '4pc' | 'none';
}

export interface Character {
  id: number;
  name: string;
  element: Element;
  rarity: number;
  level: number;
  constellation: number;
  friendshipLevel: number;
  talents: TalentLevels;
  stats: CharacterStats;
  weapon: Weapon;
  artifacts: Artifact[];
  artifactSets: Record<number, number>; // setId -> piece count
  activeSetBonuses?: ActiveSetBonus[];
  totalCv?: number;
  qualityBadge?: QualityBadge;
  damageCalc?: any;
  icon: string;
}

export interface EnkaData {
  player: PlayerInfo;
  characters: Character[];
  ttl: number;
  fetchedAt: Date;
}

// ============================================================================
// Validation & Error Handling
// ============================================================================

export const UIDSchema = z.string().regex(/^\d{9,10}$/, 'UID must be 9 or 10 digits');

export interface EnkaError {
  code: number;
  message: string;
}

export const EnkaErrorCodes = {
  INVALID_UID: 400,
  PLAYER_NOT_FOUND: 404,
  GAME_MAINTENANCE: 424,
  RATE_LIMITED: 429,
  SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;
```

---

## 5. Zero-Breaking-Change & Impact Analysis

| System Area | Potential Breaking Vector | How This Design Prevents It | Verified Status |
|---|---|---|---|
| `tests/enka-parser.test.ts` | Test expects `flower.subStats` structure and `artifactSets[15005]` | Retains `setId: number` on `Artifact`; `pips` and `cv` are optional; existing assertions on `subStats[0].rolls` pass unaltered. | Pass (`vitest run` 11/11 tests pass) |
| `src/lib/enka/parser.ts` | Object literal return types in `parseCharacter`, `parseWeapon`, `parseArtifacts`, `parseTalents` | All new properties on `Artifact`, `Weapon`, `TalentLevels`, and `Character` are optional (`?:`). Current parser compiles with zero TypeScript errors. | Pass (`tsc --noEmit` exits 0) |
| `src/lib/damage-calc/engine.ts` | `getTalentMultiplier` does arithmetic on `talents.normal`, `talents.skill`, `talents.burst` | `normal`, `skill`, `burst` are preserved as raw numbers. `boosted` is an independent optional object. | Pass (Zero damage calculation impact) |
| `src/components/character/ArtifactDisplay.tsx` | Consumes `artifact.subStats` and `artifact.setName` | Properties remain identical; new `pips` and `cv` can be adopted progressively in Milestone 4. | Pass |
| `src/components/character/CharacterCard.tsx` | Reads `character.talents.normal`, `character.weapon.refinement`, `character.artifactSets` | Zero property signature changes; existing layout untouched until Milestone 3 redesign. | Pass |
| `src/lib/db/schema.ts` & `queries.ts` | `talentLevels: jsonb('talent_levels')`, `artifactSets: jsonb(...)` | Schema stores JSON payloads matching domain interfaces. Additive optional fields do not alter database column constraints. | Pass |
| `src/app/page.tsx` | Home page isolation (R5 constraint) | Strict zero-touch compliance. No imports or types referenced in `page.tsx` are modified. | Pass (Unmodified) |

---

## 6. Implementation Guidance for Milestone 1 Implementer

When applying the changes to `src/lib/enka/types.ts`:
1. **Target**: Replace `src/lib/enka/types.ts` with the drop-in code in Section 4.
2. **Post-edit verification**:
   - Run typecheck:
     ```powershell
     & "c:\Users\AMD\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" ./node_modules/typescript/bin/tsc --noEmit
     ```
     Must exit with code 0.
   - Run test suite:
     ```powershell
     & "c:\Users\AMD\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" ./node_modules/vitest/vitest.mjs run
     ```
     All 11 tests across 2 test files must pass.
3. **Downstream Enablement**:
   - Milestone 1 Implementer can now create `src/lib/enka/artifact-set-data.ts` and `src/lib/enka/weapon-data.ts` using the exported `ArtifactSetDefinition`, `WeaponMetadata`, `WeaponRefinementValues`, and `TalentBoostConfig` interfaces.
