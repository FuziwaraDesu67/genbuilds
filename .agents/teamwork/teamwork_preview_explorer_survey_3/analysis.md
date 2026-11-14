# Architectural Survey & Analysis Report: UI, Routes, Styling, & Test Infrastructure

**Surveyor**: Teamwork Explorer (Survey Phase 3)  
**Date**: 2026-11-01  
**Project**: `genshin-leaderboard`  
**Reference Document**: `.agents/teamwork/ORIGINAL_REQUEST.md` (Requirements R1–R5)

---

## 1. Executive Summary

This investigation surveys the frontend components, App Router routes, design system, asset ecosystem, and test infrastructure of `genshin-leaderboard` ahead of the Character Showcase and Artifact UI overhaul.

Key findings:
1. **Critical 100x Multiplication Bug Confirmed**: In `src/lib/enka/parser.ts` (lines 208–215) and `src/components/character/ArtifactDisplay.tsx` (lines 23–30), stat values already scaled or decimal values are redundantly multiplied by 100 or misattributed, displaying percentages as `4660.0%`.
2. **Missing Universal Crit Value (CV) & Roll Pips**: While `StatsPanel.tsx` calculates whole-character CV (`cr * 2 + cd`), individual artifacts in `ArtifactDisplay.tsx` lack piece CV calculations, quality badges (`Decent`, `Good`, `Great`, `Godly`), and visual roll pips `[●●●○]`.
3. **Showcase Component Deficits (`CharacterCard.tsx`, `CharacterDetailModal.tsx`)**:
   - Weapons show only basic icon/name/level/refinement text; missing base ATK in cards, weapon substat, refinement badges (`R1`–`R5`), and weapon passive names/effects.
   - Talents are rendered as plain numbers without skill icons or radiant `+3` indicators for constellation boosts (e.g. C3/C5).
   - Artifact sets display only piece counts (e.g., `(4pc)`) with no skill bonus descriptions or interactive popovers.
4. **Asset Availability**: `public/icons/characters/` contains 1,032 character icons, constellation icons (`_const_0` through `_const_5`), and gacha splash art (`_gacha.png`). `public/icons/artifacts/` contains 234 icons for sets 10001–15035. Weapon icons are dynamically loaded via Enka CDN (`getEnkaIconUrl(flat.icon)`).
5. **Home Page Inviolability (R5)**: `src/app/page.tsx` is strictly self-contained with its Doodle Crew banner and search bar navigating to `/u/[uid]`. It has zero dependencies on `CharacterCard` or `ArtifactDisplay` and can remain 100% untouched.
6. **UID `1813164100` Status**: Defined as quick link `"Addy (C1 Varesa)"` in `page.tsx`. Currently, no static mock fixture exists for `1813164100` (the only fixture is `tests/fixtures/enka-response.json` for Hu Tao `1234567890`). An offline mock or fallback route strategy is recommended to ensure `GET /u/1813164100` satisfies Acceptance Criteria deterministically.

---

## 2. Component Analysis (`src/components/character/` & `src/components/profile/`)

### 2.1 `ProfileClient.tsx` (`src/components/profile/ProfileClient.tsx`)
- **Role**: Root client component for `/u/[uid]`.
- **Observed Behavior**:
  - Fetches `/api/player/${uid}` on mount (line 26).
  - Integrates with `BackgroundContext` via `useBackground().setElement(result.characters[0].element)` (lines 18, 38–40) to drive dynamic WebGL/ambient background element theming.
  - Manages TTL refresh countdown timer (lines 57–65).
  - Renders Player Header (`nickname`, `uid`, `level`, `signature`, refresh timer) and Character Showcase grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`).
  - Maps `data.characters` to `<CharacterCard key={character.id} character={character} uid={uid} />` (lines 199–205).
- **Gaps / Action Items**:
  - Layout is solid; needs styling polish to harmonize with high-contrast glassmorphism standards.

### 2.2 `CharacterCard.tsx` (`src/components/character/CharacterCard.tsx`)
- **Lines**: 1–160
- **Props**: `character: Character & { damageCalc?: any }`, `uid: string`.
- **Current State**:
  - Header: Circular icon (`<img src={character.icon} />`), element pill (`{character.element}`), constellation (`C{character.constellation}`), level, and estimated damage.
  - Quick Stats: 2-column grid showing only ATK, Crit Ratio (`CR / CD`), EM, ER.
  - Weapon: Weapon icon, name, and `Lv.{weapon.level} R{weapon.refinement}`.
  - Artifact Sets: Plain text list: `{artifact?.setName} ({count}pc)`.
  - Talents: Plain text row: `NA`, `Skill`, `Burst` with numeric levels.
  - Leaderboard CTA: `LiquidButton` redirecting to `/leaderboard/${character.id}`.
  - Click opens `<CharacterDetailModal>`.
- **R3 Deficits & Required Changes**:
  1. **Character Avatar & Glow Frame**:
     - Upgrade avatar to high-res portrait with elemental glow border (using `ELEMENT_CONFIGS[element].glowClass` / `borderColor`).
     - Display star rating (4★ or 5★) using star icons or gold/purple accents.
     - Display constellation progression nodes `C0`–`C6` (e.g. interactive or visual pips showing unlocked constellations using `/icons/characters/${id}_const_${index}.png`).
  2. **Refined Weapon Card**:
     - Add refinement badge chip (`R1`–`R5`) with distinct styling.
     - Display weapon base ATK and secondary stat (key + value).
     - Display weapon passive skill name (from weapon metadata).
  3. **Circular Talent Badges**:
     - Replace plain text numbers with circular talent badges displaying skill icons.
     - Highlight constellation-boosted talents (e.g., C3 = Skill/Burst +3, C5 = Burst/Skill +3) with a radiant `+3` badge.
  4. **Active Artifact Set Bonus Chips**:
     - Convert text list into active set bonus chips (e.g., `2pc`, `4pc`).
     - Provide interactive popover / tooltip on hover/click revealing full in-game 2-piece and 4-piece set skill descriptions.
  5. **Key Attribute Panel & Overall Build CV**:
     - Expand stat panel to include HP, ATK, DEF, EM, CR/CD ratio, ER, and Elemental DMG bonus.
     - Add universal build Crit Value badge (`CV = 2 * CR + CD` from artifacts) with rating tiers:
       - `< 140`: `Decent`
       - `140–180`: `Good`
       - `180–220`: `Great`
       - `> 220`: `Godly`

### 2.3 `CharacterDetailModal.tsx` (`src/components/character/CharacterDetailModal.tsx`)
- **Lines**: 1–281
- **Current State**:
  - Full-screen modal backdrop (`fixed inset-0 z-50 bg-black/80 backdrop-blur-sm`).
  - Gacha splash background (`character.icon.replace('.png', '_gacha.png')` with right-side gradient mask).
  - Three tabs: `'stats'`, `'artifacts'`, `'damage'`.
  - 'artifacts' tab displays:
    - Weapon summary card.
    - Grid of 5 artifacts using `<ArtifactDisplay>`.
  - Export build feature using `htmlToImage.toPng()`.
- **R3/R4 Deficits & Required Changes**:
  1. **Active Set Bonuses Banner**:
     - In the artifacts inspection view, render a dedicated banner prominently listing all active 2-piece and 4-piece set bonuses with full in-game skill text.
  2. **Talent Level & Constellation Integration**:
     - Currently, talents are omitted from `CharacterDetailModal`! Add circular talent badges with skill icons, talent levels, and radiant `+3` indicators into the modal build view.
  3. **Build CV Quality Header**:
     - Display overall build CV score and quality badge in the modal header or key attributes section.
  4. **Weapon Passive Ingestion**:
     - Display full weapon passive skill name and refinement scaling text in the modal weapon section.

### 2.4 `ArtifactDisplay.tsx` (`src/components/character/ArtifactDisplay.tsx`)
- **Lines**: 1–121
- **Current State & 100x Bug Analysis**:
  - Lines 23–30:
    ```typescript
    const getStatDisplay = (key: string, value: number) => {
      const isPercentage = ['cr', 'cd', 'er', 'hpPercent', 'atkPercent', 'defPercent'].includes(key) || key.includes('DmgBonus');
      if (isPercentage) {
        return formatPercentage(value * 100, 1);
      }
      return value.toFixed(0);
    };
    ```
  - When `parser.ts` outputs `sub.statValue` or `mainStat.value`:
    - In `parser.ts` lines 205–215:
      ```typescript
      const isPercentageStat = ['cr', 'cd', 'er', 'hpPercent', 'atkPercent', 'defPercent'].includes(key) || key.includes('DmgBonus');
      const displayValue = isPercentageStat ? sub.statValue * 100 : sub.statValue;
      return {
        key,
        value: sub.statValue,
        rolls: estimateRollCount(key, displayValue),
      };
      ```
    - If `statValue` from Enka or parsed data is already in percentage format (e.g. `46.6` for 46.6% HP, or `7.8` for 7.8% CR), multiplying by 100 produces `4660.0%`!
    - Normalization rule: Enka `flat.reliquaryMainstat.statValue` for percentage stats in game is often provided as `46.6` or decimal `0.466`. If `statValue < 1` (decimal format like `0.078`), multiplying by 100 yields `7.8`. But if already `>= 1` or normalized in parser, multiplying by 100 creates the 100x multiplication error.
    - The fix must establish a single canonical representation: In domain model `Artifact.subStats` and `mainStat`, store either normalized percentage numbers (e.g. `46.6`), and `getStatDisplay` must only append `%` without an additional `* 100`.
- **R4 Deficits & Required Changes**:
  1. **Piece Crit Value (CV) Calculation**:
     - Calculate for each piece: `CV = (CR * 2) + CD`.
     - Flower, Plume, Sands, Goblet, and Circlet all calculate piece CV.
     - Display piece CV with tier badge:
       - `Decent`: CV < 20
       - `Good`: 20 <= CV < 30
       - `Great`: 30 <= CV < 40
       - `Godly`: CV >= 40 (or 50+ max CV unicorn pieces)
  2. **Visual Roll Pips `[●●●○]`**:
     - Instead of just `({subStat.rolls}↑)`, render accurate roll pip dots (1 to 5 dots: filled `●` for roll count, hollow `○` for remaining capacity up to 5 max rolls for 5★ pieces).
  3. **Slot Ordering & Layout**:
     - Ensure the 5 pieces are rendered in authentic in-game order:
       1. Flower of Life (`flower` / `EQUIP_BRACER`)
       2. Plume of Death (`plume` / `EQUIP_NECKLACE`)
       3. Sands of Eon (`sands` / `EQUIP_SHOES`)
       4. Goblet of Eonothem (`goblet` / `EQUIP_RING`)
       5. Circlet of Logos (`circlet` / `EQUIP_DRESS`)

### 2.5 `StatsPanel.tsx` (`src/components/character/StatsPanel.tsx`)
- **Lines**: 1–93
- **Current State**:
  - Calculates `critValue = calculateCritValue(stats.cr, stats.cd)`.
  - Displays HP, ATK, DEF, EM, ER, CRIT Rate, CRIT DMG, and Element DMG Bonus.
  - Highlights Crit Value at the top.
  - Works well, but can be visually enhanced to match the glassmorphic card overhaul.

---

## 3. Route `/u/[uid]` Architecture

### 3.1 Route File: `src/app/u/[uid]/page.tsx`
- **Lines**: 1–30
- **Structure**:
  ```tsx
  export async function generateMetadata({ params }: ProfilePageProps) { ... }
  export default function ProfilePage({ params }: ProfilePageProps) {
    const result = UIDSchema.safeParse(params.uid);
    if (!result.success) notFound();
    return <ProfileClient uid={params.uid} />;
  }
  ```
- **Execution Flow**:
  1. User navigates to `/u/[uid]`.
  2. Next.js Server Component runs `generateMetadata()` and validates `params.uid` with `UIDSchema` (`/^\d{9,10}$/`).
  3. Invalid UIDs trigger Next.js `notFound()`, rendering `src/app/not-found.tsx`.
  4. Valid UIDs render `<ProfileClient uid={params.uid} />` with HTTP `200 OK`.
  5. In client runtime, `ProfileClient` calls `fetch('/api/player/${uid}')`.

### 3.2 API Route: `src/app/api/player/[uid]/route.ts`
- **Lines**: 1–108
- **Pipeline**:
  1. Rate Limiting via `checkRateLimit(ip)` (`src/lib/redis.ts`, in-memory fallback if Upstash credentials are missing).
  2. Cache Check via `getCachedEnkaResponse(uid)`.
  3. Enka Fetch via `enkaClient.fetchPlayerData(uid)`.
  4. Damage Calculation: maps characters through `calculateDamage(char)`.
  5. DB Upsert: `upsertPlayer()` and `upsertBuild()`.
  6. Cache Write: `cacheEnkaResponse(uid, responseData, enkaData.ttl)`.
  7. Return JSON response.

---

## 4. Design System, Styling & Asset Inventory

### 4.1 Tailwind & CSS Utility Architecture
- **Configuration** (`tailwind.config.ts`):
  - Elemental palette:
    - `pyro`: `#FF6B2C`, dark `#FF4500`
    - `hydro`: `#00BFFF`, dark `#1E90FF`
    - `electro`: `#9B59D6`, dark `#8A2BE2`
    - `cryo`: `#4DD0E1`, dark `#00CED1`
    - `dendro`: `#7CB342`, dark `#9ACD32`
    - `anemo`: `#4FC3F7`, dark `#87CEEB`
    - `geo`: `#FFB74D`, dark `#DAA520`
  - Extended grays: `black-50` through `black-950` (`#000000`).
  - Font families: `sans` (`--font-inter`), `serif` (`--font-playfair`).
- **Global Styles** (`src/styles/globals.css`):
  - Glass classes:
    - `.glass`: 10px blur, `1px solid rgba(255, 255, 255, 0.18)`, subtle background gradient.
    - `.glass-darker`: 16px blur, `1px solid rgba(255, 255, 255, 0.1)`, dark rgba gradient.
  - Number counter animation: `@keyframes countUp`, `.count-up`.
- **UI Element System** (`src/components/ui/element-icons.tsx`):
  - Dedicated vector icons: `PyroIcon`, `HydroIcon`, `AnemoIcon`, `ElectroIcon`, `DendroIcon`, `CryoIcon`, `GeoIcon`.
  - Unified dispatcher: `<ElementIcon element="Pyro" size={24} />`.
  - `ELEMENT_CONFIGS`: Maps each element to its primary hex `color`, `bgColor` (e.g. `bg-red-500/10`), `borderColor` (e.g. `border-red-500/30`), and `glowClass` (e.g. `shadow-[0_0_20px_rgba(255,93,65,0.35)]`).

### 4.2 Asset Inventory
- **Characters** (`public/icons/characters/`):
  - **1,032 assets** present locally.
  - Avatars: `public/icons/characters/${avatarId}.png` (e.g. `10000111.png` for Varesa, `10000046.png` for Hu Tao).
  - Constellations: `public/icons/characters/${avatarId}_const_${0..5}.png`.
  - Gacha Splash Art: `public/icons/characters/${avatarId}_gacha.png`.
- **Artifacts** (`public/icons/artifacts/`):
  - **234 assets** present locally.
  - Sets covered: `10001` through `15035`.
  - Files follow convention: `${setId}_${slotNum}.png` (slots 1 to 5).
  - Examples: `15005_1.png` through `15005_5.png` (Crimson Witch), `15025_1.png` through `15025_5.png` (Obsidian Codex), `15020_1.png` through `15020_5.png` (Golden Troupe).
- **Weapons**:
  - Dynamically resolved to Enka CDN via `getEnkaIconUrl(flat.icon)`: `https://enka.network/ui/${flat.icon}.png`.

---

## 5. Home UI Constraint (`src/app/page.tsx` — R5)

### 5.1 Verification of `src/app/page.tsx`
- **File Path**: `d:\games\projects\genshin-leaderboard\src\app\page.tsx`
- **Lines**: 219 lines.
- **Components Used**:
  - `DoodleCrewFooter` (`GENBUILDS_CREW` crew members: Bruno, Pip, Morel, Juno, Boo, Patch).
  - `LiquidButton` from `@/components/ui/liquid-glass-button`.
  - Icons from `lucide-react`: `Search`, `Sparkles`, `Trophy`, `Swords`, `ShieldCheck`, `ArrowRight`.
  - `QUICK_UIDS`:
    - `1813164100`: Addy (C1 Varesa)
    - `855842984`: Anirudh (C0 Xiao)
- **Navigation Interaction**:
  - `handleSubmit` executes `window.location.href = /u/${sanitized}`.
  - Quick showcase preview buttons populate the UID input.
  - Links to `/leaderboard`.
- **Boundary Guarantee**:
  - Does NOT import `CharacterCard`, `ProfileClient`, `ArtifactDisplay`, or `CharacterDetailModal`.
  - Does NOT render any character showcase data directly.
  - **R5 Compliance**: `src/app/page.tsx` MUST NOT be edited, modified, or refactored. The overhaul is 100% confined to `/u/[uid]`, `src/components/character/`, `src/components/profile/`, and `src/lib/enka/`.

---

## 6. Test Suites, Scripts & Verification Infrastructure

### 6.1 `package.json` Scripts & Dependencies
- **Test Command**: `npm test` runs `vitest`.
- **Typecheck Command**: `npm run typecheck` runs `tsc --noEmit`.
- **Game Data Script**: `npm run data:update` runs `tsx scripts/update-game-data.ts`.
- **Vitest Config** (`vitest.config.ts`):
  - Environment: `'node'`.
  - Globals: `true`.
  - Alias: `'@': './src'`.
  - Plugin: `@vitejs/plugin-react`.
- **TypeScript Config** (`tsconfig.json`):
  - Strict mode enabled (`"strict": true`).
  - Path alias: `"@/*": ["./src/*"]`.

### 6.2 Existing Tests
1. `tests/enka-parser.test.ts`:
   - 9 test cases checking schema parsing, character properties (Hu Tao Lv 90 C6), stats (HP, ATK, DEF, EM, CR, CD, ER, Pyro DMG), weapon (Staff of Homa R1), artifacts (5 pieces, flower level 20), set counts, talent levels, roll estimation, and empty avatar list handling.
   - Fixture used: `tests/fixtures/enka-response.json` (UID `1234567890`).
2. `tests/redis-fallback.test.ts`:
   - 2 test cases checking in-memory cache set/get/TTL fallback and IP rate limiting sliding window.

### 6.3 UID `1813164100` Mock Data Analysis
- **Current Status**:
  - UID `1813164100` is featured on the homepage as `"Addy (C1 Varesa)"`.
  - In `src/lib/enka/game-data.generated.ts`, Varesa is avatar ID `10000111`:
    - Element: `Electro`
    - Rarity: `5`
    - WeaponType: `Catalyst`
    - SkillOrder: `[11111, 11112, 11115]`
    - Constellations: `UI_Talent_S_Varesa_01` (C1), `UI_Talent_S_Varesa_02` (C2), `UI_Talent_U_Varesa_01` (C3, Skill +3), `UI_Talent_S_Varesa_03` (C4), `UI_Talent_U_Varesa_02` (C5, Burst +3), `UI_Talent_S_Varesa_04` (C6).
  - There is currently **no mock fixture file** for UID `1813164100`.
  - If external network calls to `https://enka.network/api/uid/1813164100/` fail or rate-limit during development/testing, `/api/player/1813164100` would return an error.
- **Recommendation for Acceptance Criterion**:
  - The acceptance criteria require: `HTTP GET /u/1813164100 returns 200 OK with valid build card markup`.
  - Since `/u/1813164100` is a Next.js route, `GET /u/1813164100` will return 200 OK directly via `ProfilePage`.
  - To ensure end-to-end functionality even offline, a mock fallback fixture for `1813164100` (Addy's C1 Varesa with catalyst, artifact sets e.g. Obsidian Codex / Golden Troupe, talents, etc.) should be supported in `src/lib/enka/client.ts` or `src/app/api/player/[uid]/route.ts` when external API returns 404/network error.

---

## 7. Implementation Checklist for Subsequent Phases

| ID | Requirement | Key Files Affected | Implementation Directives |
|---|---|---|---|
| **R1** | Artifact Set Skills & Weapon Metadata Ingestion | `src/lib/enka/static-data.ts`, `src/lib/enka/types.ts` | Add dictionary of 2pc & 4pc descriptions for all active sets (Crimson Witch, Obsidian Codex, Golden Troupe, Noblesse Oblige, Deepwood Memories, etc.). Ingest weapon passives and refinement scaling (`R1`–`R5`). |
| **R2** | Fix 100x Multiplication Bug & Math | `src/lib/enka/parser.ts`, `src/components/character/ArtifactDisplay.tsx` | Standardize artifact stat percentages (ensure no double `* 100`). Implement universal Crit Value `CV = 2 * CR + CD` and roll pips `[●●●○]` based on roll tiers. |
| **R3** | Character Card & Showcase Overhaul | `src/components/character/CharacterCard.tsx`, `src/components/profile/ProfileClient.tsx`, `src/components/character/CharacterDetailModal.tsx` | High-contrast glassmorphism, elemental glow frame, star rating, constellation nodes (`C0`–`C6`), weapon card with refinement badge & base ATK, circular talent badges with skill icons & radiant `+3` tags, active set chips with popovers, key attributes & overall CV badge. |
| **R4** | Artifacts Detail & Roll Analysis Grid | `src/components/character/ArtifactDisplay.tsx`, `src/components/character/CharacterDetailModal.tsx` | Dedicated Active Set Bonuses Banner with 2pc & 4pc in-game text. 5-piece breakdown (Flower, Plume, Sands, Goblet, Circlet) with correct stat formats, visual roll pips `[●●●○]`, and individual piece CV ratings with quality badges. |
| **R5** | Home UI Constraint | `src/app/page.tsx` | **DO NOT TOUCH**. Verified independent and intact. |
