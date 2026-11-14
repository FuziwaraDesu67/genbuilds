# Comprehensive Codebase Analysis: Enka Ingestion, Parsing, Types, and Metadata

## Executive Summary
This survey investigated the data ingestion, parsing, domain typing, and caching architecture of the `genshin-leaderboard` project in preparation for the Character Showcase, Build Card, and Artifacts UI overhaul. 

Key discoveries:
1. **100x Multiplication Bug Identified**: Percentage stats display as `4660.0%` due to a mismatch between raw Enka API values and double multiplication in `src/components/character/ArtifactDisplay.tsx` line 27 (`formatPercentage(value * 100, 1)`), coupled with fragile roll count scaling in `src/lib/enka/parser.ts` line 209.
2. **Missing Artifact Set Skill Descriptions**: `src/lib/enka/static-data.ts` only contains 14 set IDs mapped to set names (`Record<number, string>`). Complete in-game 2-piece and 4-piece set bonus descriptions are completely absent from the codebase.
3. **Missing Weapon Metadata**: The `Weapon` domain interface in `src/lib/enka/types.ts` does not include passive skill names, passive descriptions, or refinement scaling. Neither `static-data.ts` nor `game-data.generated.ts` defines weapon passive metadata.
4. **Talent Constellation Boost (+3) Omission**: `AvatarInfoSchema` in `types.ts` currently omits `proudSkillExtraLevelMap` (which Enka uses to report constellation-boosted talents), and `TalentLevels` has no flags for boosted talents.
5. **Crit Value & Roll Pips Gaps**: `calculateCritValue` exists for overall character stats, but artifact pieces do not compute or store individual `cv`, nor do they render visual roll pips `[●●●○]`.

---

## 1. Deep Dive: `src/lib/enka/` Architecture

The `src/lib/enka/` directory comprises 6 key modules:
- `client.ts`: HTTP client communicating with `https://enka.network/api/uid/{uid}/`.
- `parser.ts`: Parses raw Enka payloads into domain-level structures.
- `types.ts`: Zod validation schemas for API responses and TypeScript domain interfaces.
- `static-data.ts`: Fight prop mappings, slot enums, set dictionary, roll tables, and stat utility functions.
- `game-data.generated.ts`: Auto-generated catalog containing character metadata (118+ entries) and text localization hashes.
- `index.ts`: Barrel export re-exporting client, parser, types, and static data.

### 1.1 Data Ingestion & Client Flow (`client.ts`)
- **Endpoint**: `https://enka.network/api/uid/${uid}/` with User-Agent `GenshinLeaderboard/1.0`.
- **Validation**: Enforces 9-10 digit UID format using `UIDSchema`.
- **Response Validation**: Validates HTTP response JSON using `EnkaResponseSchema.parse(rawData)`.
- **Error Handling**: Custom `handleErrorResponse` maps Enka status codes:
  - 400: `INVALID_UID`
  - 404: `PLAYER_NOT_FOUND`
  - 424: `GAME_MAINTENANCE`
  - 429: `RATE_LIMITED`
  - 500: `SERVER_ERROR`
  - 503: `SERVICE_UNAVAILABLE`
- **Output**: Hands validated raw payload to `parseEnkaResponse(validated)` in `parser.ts`.

### 1.2 Parsing Pipeline (`parser.ts`)
- **`parsePlayerInfo`**: Extracts `uid`, `nickname`, `level` (Adventure Rank), `signature`, `nameCardId`, and `profilePictureId`.
- **`parseCharacter`**:
  - Fetches character metadata via `getCharacterData(avatarId)`.
  - Fallback logic creates an "Unknown Character" with default rarity 4 and Pyro element if unknown.
  - Sub-parsers:
    - `parseStats(fightPropMap)`: Maps Enka combat properties to `CharacterStats`.
    - `parseWeapon(equipList)`: Extracts weapon object, calculates refinement (`Object.values(affixMap)[0] + 1`), base ATK, and secondary substat.
    - `parseArtifacts(equipList)`: Filters reliquary items, extracts slot, main stat, and substats.
    - `countArtifactSets(artifacts)`: Tally of equipped set pieces (`Record<number, number>`).
    - `parseTalents(skillLevelMap)`: Sorts skill IDs ascending into `normal`, `skill`, `burst`.
    - Constellation count: `raw.talentIdList?.length || 0`.

---

## 2. Artifact Set Skills & Weapon Metadata Investigation

### 2.1 Current State of Artifact Sets
In `src/lib/enka/static-data.ts` (lines 68–83):
```typescript
export const ARTIFACT_SETS: Record<number, string> = {
  15008: 'Emblem of Severed Fate',
  15020: 'Golden Troupe',
  15025: 'Obsidian Codex',
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
};
```
**Observations**:
- Only 14 artifact sets are listed.
- Sets are mapped only to English names (`string`), with no skill text.
- Missing popular and modern sets required by R1, such as:
  - Noblesse Oblige (`15001`)
  - Viridescent Venerer (`15004`)
  - Deepwood Memories (`15022`)
  - Gilded Dreams (`15023`)
  - Marechaussee Hunter (`15024`)
  - Tenacity of the Millelith (`15009`)
  - Husk of Opulent Dreams (`15010`)
  - Ocean-Hued Clam (`15011`)
  - Wanderer's Troupe (`14002`)
  - Fragment of Harmonic Whimsy (`15028`)
  - Unfinished Reverie (`15029`)
- UI components (`CharacterCard.tsx`, `ArtifactDisplay.tsx`, `CharacterDetailModal.tsx`) have no access to 2-piece or 4-piece descriptions.

### 2.2 Proposed Artifact Set Skill Schema
To satisfy R1, R3, and R4, an artifact set registry in `src/lib/enka/` should define:
```typescript
export interface ArtifactSetSkill {
  id: number;
  name: string;
  twoPiece: string;
  fourPiece: string;
}
```
Example entries:
- **Crimson Witch of Flames** (`15005`):
  - 2-Piece: `Pyro DMG Bonus +15%`
  - 4-Piece: `Increases Overloaded, Burning, and Burgeon DMG by 40%. Increases Vaporize and Melt DMG by 15%. Using an Elemental Skill increases the 2-Piece Set Bonus by 50% of its initial value for 10s. Max 3 stacks.`
- **Obsidian Codex** (`15025`):
  - 2-Piece: `While the equipping character is in Nightsoul's Blessing and is on the field, their DMG dealt is increased by 15%.`
  - 4-Piece: `After the equipping character consumes 1 Nightsoul point while on the field, CRIT Rate increases by 40% for 6s. This effect can trigger once every 1s.`
- **Golden Troupe** (`15020`):
  - 2-Piece: `Increases Elemental Skill DMG by 20%.`
  - 4-Piece: `Increases Elemental Skill DMG by 25%. Additionally, when not on the field, Elemental Skill DMG will be further increased by 25%. This effect will be cleared 2s after taking the field.`
- **Noblesse Oblige** (`15001`):
  - 2-Piece: `Elemental Burst DMG +20%`
  - 4-Piece: `Using an Elemental Burst increases all party members' ATK by 20% for 12s. This effect cannot stack.`
- **Deepwood Memories** (`15022`):
  - 2-Piece: `Dendro DMG Bonus +15%`
  - 4-Piece: `After Elemental Skills or Bursts hit opponents, the targets' Dendro RES will be decreased by 30% for 8s. This effect can be triggered even if the equipping character is not on the field.`

### 2.3 Current State of Weapon Metadata
In `src/lib/enka/types.ts`:
```typescript
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
  icon: string;
}
```
**Observations**:
- In Enka's raw API response, `flat.weaponStats` only contains Base ATK (index 0) and the secondary substat (index 1).
- `weapon.affixMap` contains `{ "affixId": refinementLevel - 1 }` (e.g. `{ "111510": 0 }` for R1 Staff of Homa).
- The API response does **NOT** contain the weapon passive name or description strings.
- Currently, `parseWeapon` does not resolve passive names or refinement scaling.
- In `CharacterCard.tsx`, the weapon card displays only Lv. and Refinement (`Lv.90 R1`). Base ATK, Substat, and Passive Name are omitted.

### 2.4 Proposed Weapon Metadata Schema
```typescript
export interface WeaponMetadata {
  id: number;
  name: string;
  type: 'Sword' | 'Claymore' | 'Polearm' | 'Bow' | 'Catalyst';
  rarity: number;
  baseAtk: number;
  subStat: {
    key: string;
    value: number;
  };
  passiveName: string;
  refinements: string[]; // R1 to R5 passive descriptions
}
```
And extending `Weapon` in `src/lib/enka/types.ts`:
```typescript
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
  passiveDesc?: string;
  icon: string;
}
```

---

## 3. The 100x Multiplication Bug & Stat Calculation Analysis

### 3.1 Mechanics and Root Cause
The `4660.0%` display bug occurs due to two compounding factors:

#### 1. Enka Network API Data Format vs Test Mock Discrepancy
- In real live Enka API responses:
  - `AvatarInfo.fightPropMap`: properties like `20` (CRIT Rate) and `22` (CRIT DMG) are ratios (e.g. `0.912` = 91.2%, `2.023` = 202.3%).
  - `reliquaryMainstat.statValue`: **ALREADY** a percentage value (e.g. `46.6` for 46.6% ATK% or HP%).
  - `reliquarySubstats.statValue`: **ALREADY** a percentage value (e.g. `10.5` for 10.5% CRIT Rate, `7.8` for 7.8% CRIT Rate).
- In the local test fixture (`tests/fixtures/enka-response.json`):
  - Mocked artifact stats were erroneously written as decimal fractions:
    `{ "appendPropId": "FIGHT_PROP_HP_PERCENT", "statValue": 0.466 }`
    `{ "appendPropId": "FIGHT_PROP_CRITICAL", "statValue": 0.078 }`

#### 2. The Flaw in `src/lib/enka/parser.ts` (lines 205–216):
```typescript
const subStats = (flat.reliquarySubstats || []).map((sub: any) => {
  const key = getStatName(sub.appendPropId);
  const isPercentageStat = ['cr', 'cd', 'er', 'hpPercent', 'atkPercent', 'defPercent'].includes(key) || key.includes('DmgBonus');
  const displayValue = isPercentageStat ? sub.statValue * 100 : sub.statValue;

  return {
    key,
    value: sub.statValue,
    rolls: estimateRollCount(key, displayValue),
  };
});
```
When live data is received (`sub.statValue = 7.8`):
- `displayValue = 7.8 * 100 = 780`
- `estimateRollCount('cr', 780) = Math.round(780 / 3.305) = 236` rolls!
- Meanwhile `value` was passed through as `sub.statValue` (`7.8` in live data, `0.078` in fixture).

#### 3. The Flaw in `src/components/character/ArtifactDisplay.tsx` (lines 23–30):
```typescript
const getStatDisplay = (key: string, value: number) => {
  const isPercentage = ['cr', 'cd', 'er', 'hpPercent', 'atkPercent', 'defPercent'].includes(key) || key.includes('DmgBonus');

  if (isPercentage) {
    return formatPercentage(value * 100, 1);
  }
  return value.toFixed(0);
};
```
In `ArtifactDisplay.tsx`, `getStatDisplay` unconditionally executes `value * 100`:
- For main stats from live API (`value = 46.6`): `46.6 * 100 = 4660` -> `4660.0%`!
- For substats from live API (`value = 7.8`): `7.8 * 100 = 780` -> `780.0%`!
- In `formatPercentage(num, decimals)`: returns `${num.toFixed(decimals)}%`.

### 3.2 Robust Normalization Solution
In `parser.ts`:
1. Normalize both main stats and substats to standard percentage units (e.g. `46.6` and `7.8`):
   ```typescript
   // Normalize decimal fraction (mock fixture: 0.078 or 0.466) vs percent (live Enka: 7.8 or 46.6)
   const normalizedValue = (isPercentageStat && rawValue > 0 && rawValue <= 1)
     ? Number((rawValue * 100).toFixed(1))
     : rawValue;
   ```
2. Store `value: normalizedValue` in `Artifact.mainStat` and `Artifact.subStats`.
3. Pass `normalizedValue` directly to `estimateRollCount(key, normalizedValue)`.
4. In `ArtifactDisplay.tsx`:
   ```typescript
   if (isPercentage) {
     return formatPercentage(value, 1); // No 100x multiplication!
   }
   ```
This eliminates the 100x multiplier error completely, maintains backward compatibility with test fixtures, and accurately calculates substat roll counts.

### 3.3 Crit Value (CV) & Roll Pips Formulation

#### Crit Value Calculation
Universal formula: `CV = (2 * CR) + CD`.
- **Per Artifact Piece**: Sum of substats where `key === 'cr'` and `key === 'cd'`.
  `const pieceCV = Number(((crVal * 2) + cdVal).toFixed(1));`
  Rating thresholds for individual pieces:
  - `< 20 CV`: Decent
  - `20 – 29.9 CV`: Good
  - `30 – 39.9 CV`: Great
  - `40+ CV`: Godly
- **Build Crit Value**:
  Overall CV calculated on `stats.cr` and `stats.cd`: `(2 * stats.cr) + stats.cd`.
  Rating thresholds for entire build:
  - `< 140 CV`: Decent
  - `140 – 179.9 CV`: Good
  - `180 – 219.9 CV`: Great
  - `220+ CV`: Godly

#### Substat Roll Count & Visual Pips
From `SUBSTAT_ROLLS` in `static-data.ts`:
For 5-star artifacts, each substat tier average is:
- `cr`: `3.305`
- `cd`: `6.605`
- `atkPercent`: `4.955`
- `hpPercent`: `4.955`
- `defPercent`: `6.195`
- `er`: `5.505`
- `em`: `19.815`
- `atk`: `16.75`
- `hp`: `254.0`
- `def`: `19.75`

Roll count ranges between 1 (base drop) and 6 (base + 5 upgrades).
For UI pips representation `[●●●○]`:
- Pips can be rendered using filled and hollow circles based on roll count (clamped between 1 and 5, or 1 to 6).
- Example: 3 rolls -> `●●●○` or `●●●○○`.

---

## 4. Frontend Data Flow & Interface Enumeration

### 4.1 Data Flow Pipeline
```
[Enka.Network API]
       │ (JSON payload)
       ▼
[EnkaClient.fetchPlayerData(uid)] (src/lib/enka/client.ts)
       │ (validated by EnkaResponseSchema)
       ▼
[parseEnkaResponse()] (src/lib/enka/parser.ts)
       │ (returns EnkaData: PlayerInfo, Character[])
       ▼
[Route Handler GET /api/player/[uid]] (src/app/api/player/[uid]/route.ts)
  ├─► Redis Cache (`cacheEnkaResponse(uid, responseData, ttl)`)
  ├─► Neon Postgres (`upsertPlayer()`, `upsertBuild()`)
  └─► JSON Response -> `ProfileClient.tsx`
           │
           ▼
    [CharacterCard.tsx]
           │ (user click opens modal)
           ▼
    [CharacterDetailModal.tsx]
       ├─► [StatsPanel.tsx]
       └─► [ArtifactDisplay.tsx] (x5 artifact pieces)
```

### 4.2 Interfaces and Properties

#### `PlayerInfo`
```typescript
export interface PlayerInfo {
  uid: string;
  nickname: string;
  level: number; // Adventure Rank (AR)
  signature?: string;
  nameCardId?: number;
  profilePictureId?: number;
}
```

#### `CharacterStats`
```typescript
export interface CharacterStats {
  hp: number;
  atk: number;
  def: number;
  em: number;
  er: number; // Stored as percentage, e.g. 100.0
  cr: number; // Stored as percentage, e.g. 91.2
  cd: number; // Stored as percentage, e.g. 202.3
  healingBonus?: number;
  dmgBonus: Record<string, number>; // e.g. { pyro: 61.6, physical: 0 }
}
```

#### `TalentLevels`
```typescript
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

#### `Weapon`
```typescript
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
  passiveDesc?: string;
  icon: string;
}
```

#### `Artifact`
```typescript
export interface Artifact {
  id: number;
  name: string;
  setId: number;
  setName: string;
  rarity: number;
  level: number; // 0 to 20
  slot: 'flower' | 'plume' | 'sands' | 'goblet' | 'circlet';
  mainStat: {
    key: string;
    value: number; // e.g. 46.6 for HP%
  };
  subStats: Array<{
    key: string;
    value: number; // e.g. 7.8 for CR%
    rolls?: number; // 1 to 5
  }>;
  cv?: number; // Calculated Crit Value
  icon: string;
}
```

#### `Character`
```typescript
export interface Character {
  id: number;
  name: string;
  element: Element;
  rarity: number;
  level: number;
  constellation: number; // 0 to 6
  friendshipLevel: number;
  talents: TalentLevels;
  stats: CharacterStats;
  weapon: Weapon;
  artifacts: Artifact[];
  artifactSets: Record<number, number>; // setId -> count
  icon: string;
}
```

#### `EnkaData`
```typescript
export interface EnkaData {
  player: PlayerInfo;
  characters: Character[];
  ttl: number;
  fetchedAt: Date;
}
```

---

## 5. Dependencies, Types, and Utility Functions

### 5.1 Project Dependencies
- **Core Framework**: `next: ^14.2.18`, `react: ^18.3.1`, `typescript: ^5.9.3`
- **Validation**: `zod: ^3.23.8` (critical for API request/response integrity)
- **Styling & UI**:
  - `tailwindcss: ^3.4.19`
  - `framer-motion: ^11.11.11`
  - `lucide-react: ^1.48.0`
  - `clsx: ^2.1.1` & `tailwind-merge: ^3.7.0` (combined in `src/lib/utils.ts` as `cn`)
- **Exporting**: `html-to-image: ^1.11.11` (used for build card PNG export)
- **Cache & Storage**:
  - `@upstash/redis: ^1.34.3` (with in-memory fallback in `src/lib/redis.ts`)
  - `drizzle-orm: ^0.33.0` & `@neondatabase/serverless: ^0.9.5`
- **Test Runner**: `vitest: ^2.1.9`

### 5.2 Key Utility Functions
- **`src/lib/utils.ts`**:
  - `formatPercentage(num, decimals)`: formats numbers as `${num.toFixed(decimals)}%`.
  - `formatNumber(num, decimals)`: formats numbers with locale commas.
  - `getTimeUntilRefresh(ttl)`: converts TTL seconds to `${m}m ${s}s`.
  - `sanitizeUID(input)`: removes non-digits, slices to 10 characters.
- **`src/lib/enka/static-data.ts`**:
  - `calculateCritValue(cr, cd)`: computes `cr * 2 + cd`.
  - `estimateRollCount(statKey, value)`: calculates roll counts using `SUBSTAT_ROLLS`.
  - `getStatName(propId)`: maps fight prop IDs/names to camelCase keys (`hp`, `atk`, `cr`, `cd`, etc.).
  - `getEnkaIconUrl(iconPath)`: formats `https://enka.network/ui/{iconPath}.png`.
- **`src/lib/enka/game-data.generated.ts`**:
  - `resolveTextHash(hash)`: looks up hash in `TEXT_MAP`.
  - `getCharacterIconPath(id)`: returns `/icons/characters/{id}.png`.
  - `getCharacterGachaPath(id)`: returns `/icons/characters/{id}_gacha.png`.
  - `getConstellationIconPath(id, index)`: returns `/icons/characters/{id}_const_{index}.png`.
  - `getArtifactIconPath(setId, slotNum)`: returns `/icons/artifacts/{setId}_{slotNum}.png`.

---

## 6. Implementation Readiness & Recommendations for Downstream Agents

1. **Create Metadata Files in `src/lib/enka/`**:
   - `artifact-data.ts`: Comprehensive set dictionary with exact 2-piece and 4-piece text map, supporting fast lookup by `setId`.
   - `weapon-data.ts`: Comprehensive weapon dictionary with weapon passives, refinement scaling arrays, and substats.
2. **Refactor `src/lib/enka/parser.ts`**:
   - Normalize artifact stats to prevent the 100x multiplication bug while preserving compatibility with test fixtures.
   - Attach weapon passive names and descriptions during `parseWeapon`.
   - Compute artifact piece CV (`cv = 2 * cr + cd`) in `parseArtifacts`.
   - Extract constellation boosted talents from `proudSkillExtraLevelMap` or constellation count thresholds.
3. **Refactor `src/components/character/ArtifactDisplay.tsx`**:
   - Fix `getStatDisplay` to use `formatPercentage(value, 1)` directly.
   - Render visual roll pips `[●●●○]` for substats.
   - Display dedicated **Active Set Bonuses Banner** with complete 2-piece and 4-piece descriptions.
   - Display piece Crit Value badge (Decent/Good/Great/Godly).
4. **Refactor `src/components/character/CharacterCard.tsx`**:
   - High-res avatar with elemental glow frame, star rating, and constellation nodes (`C0`–`C6`).
   - Weapon card showing icon, level, refinement badge (`R1`–`R5`), base ATK, substat, and passive name.
   - Circular talent badges with skill icons, talent levels, and radiant `+3` boost indicators.
   - Active artifact set bonus chips with interactive popover/hover revealing 2-piece and 4-piece descriptions.
   - Overall build CV badge (`Decent`, `Good`, `Great`, `Godly`).
5. **Preserve `src/app/page.tsx` Intact**:
   - Zero edits allowed to `src/app/page.tsx` as mandated by R5.
