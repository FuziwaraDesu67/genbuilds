# Technical Analysis & Implementation Blueprint: Milestone 3 (Key Attribute Panel, Build CV Tier Badge & Active Set Bonus Chips)

**Author**: Explorer 3 (`teamwork_preview_explorer_m3_3`)  
**Milestone**: Milestone 3 — Character Showcase & Build Card Redesign  
**Scope**: `CharacterCard.tsx`, `ProfileClient.tsx`, related domain models and UI styling  
**R5 Zero-Touch Compliance**: Strict preservation of `src/app/page.tsx` (verified untouched)  

---

## 1. Executive Summary

This report establishes the comprehensive architectural, mathematical, and component-level blueprint for Milestone 3's three core features:
1. **Key Attribute Panel**: A high-contrast, structured glassmorphism grid presenting 7 key attributes (Max HP, ATK, DEF, Elemental Mastery, CRIT Rate / CRIT DMG with calculated CR:CD ratio, Energy Recharge, and Elemental DMG Bonus) with authentic iconography and percentage/flat units.
2. **Build CV Tier Badge**: Universal calculation and presentation of total artifact build Crit Value ($CV = 2 \times CR + CD$) across 5 equipped pieces (`character.totalCv`), tagged with quality badges (`Decent`, `Good`, `Great`, `Godly`) per `getBuildCVTier`, complete with radiant glow borders and an interactive explaining tooltip.
3. **Active Artifact Set Bonus Chips**: Detection of equipped 2-piece and 4-piece set bonuses using `getActiveArtifactSetBonuses`, rendering interactive chips (e.g., `Obsidian Codex (4)`), and hover/click popovers disclosing official in-game skill descriptions without card overflow clipping.

All designs strictly maintain backward compatibility with existing E2E assertions in `tests/e2e/e2e-showcase.test.ts` (e.g. `Crit Ratio`, `91.2%`, `202.3%`, `ATK`, `EM`, `ER`, `#FF6B2C`, `#9B59D6`).

---

## 2. Investigation Findings & Verification

### 2.1 Existing Component & Data Contract State
- **`src/components/character/CharacterCard.tsx`**:
  - Current stat grid (lines 67–87) renders a basic 2-column grid showing only ATK, Crit Ratio (`cr% / cd%`), EM, and ER.
  - Lacks Max HP, DEF, Elemental DMG Bonus, and the CR:CD ratio calculation.
  - Current artifact section (lines 101–113) loops over raw `character.artifactSets` and renders all sets (including 1-piece off-pieces) with `(1pc)` or `(5pc)` text, without interactive chips, set skill descriptions, or 2pc/4pc badges.
  - Has `overflow-hidden` on the outer card container (line 24), which would clip any absolutely positioned popovers unless properly managed.
- **`src/lib/enka/types.ts`**:
  - `Character` domain model includes:
    - `stats: CharacterStats` (`hp`, `atk`, `def`, `em`, `er`, `cr`, `cd`, `dmgBonus: Record<string, number>`, `healingBonus?`)
    - `artifacts: Artifact[]` (each with `cv`, `qualityBadge`, `setBonusText?: { twoPiece?: string; fourPiece?: string }`)
    - `artifactSets: Record<number, number>` (mapping setId -> piece count)
    - `activeSetBonuses?: ActiveSetBonus[]` (enriched by parser)
    - `totalCv?: number` (sum of 5 equipped pieces CV)
    - `qualityBadge?: QualityBadge` (`Subpar`, `Decent`, `Good`, `Great`, `Godly`)
- **`src/lib/enka/static-data.ts`**:
  - Exports `calculateCritValue(cr, cd)` $\rightarrow$ `CR * 2 + CD` rounded to 1 decimal place.
  - Exports `getBuildCVTier(totalCv)`:
    - `< 140.0`: `Subpar`
    - `140.0 – 179.9`: `Decent`
    - `180.0 – 219.9`: `Good`
    - `220.0 – 239.9`: `Great`
    - `>= 240.0`: `Godly`
  - Exports `getActiveArtifactSetBonuses(artifactSets, artifacts)`: returns `ActiveSetBonus[]` filtering out off-pieces (`count < 2`) and populating `twoPieceText` and `fourPieceText`.
- **`src/components/ui/element-icons.tsx`**:
  - Provides official SVG element icons: `PyroIcon`, `HydroIcon`, `AnemoIcon`, `ElectroIcon`, `DendroIcon`, `CryoIcon`, `GeoIcon`, and `ElementIcon`.
- **Icons & Primitives**:
  - `lucide-react` is installed (`^1.48.0`): `Heart`, `Swords`, `Shield`, `Sparkles`, `Zap`, `Crosshair`, `Info`, `Sparkle`, `Crown`.

### 2.2 Test Suite Baseline & Assertions
Running the complete test suite (`390/390 tests passing`):
```powershell
& "C:\Users\AMD\AppData\Local\OpenAI\Codex\runtimes\cua_node\1fb7137c46617d50\bin\node.exe" ./node_modules/vitest/vitest.mjs run
```
Crucial E2E assertions for `CharacterCard` in `tests/e2e/e2e-showcase.test.ts`:
1. `expect(html).toContain('ATK')`
2. `expect(html).toContain('Crit Ratio')`
3. `expect(html).toContain('EM')`
4. `expect(html).toContain('ER')`
5. `expect(html).toContain('91.2%')` (Hu Tao CR)
6. `expect(html).toContain('202.3%')` (Hu Tao CD)
7. `expect(html).not.toContain('9120')`
8. `expect(html).not.toContain('20230')`
9. Varesa UID 1813164100 checks: `The Widsith`, `R5`, `C1`, `#9B59D6`.

---

## 3. Component Architecture & Design Specifications

### 3.1 Feature 1: Key Attribute Panel

#### 3.1.1 Stat Items & Local Formatting
The panel presents 7 core combat stats in a structured grid with clean iconography:

| Stat | Source Field | Formatter / Formula | Example (Hu Tao) | Example (Varesa) | Icon Component | Color Accent |
|---|---|---|---|---|---|---|
| **Max HP** | `character.stats.hp` | `formatNumber(stats.hp)` | `35,558` | `19,450` | `Heart` | `text-rose-400` |
| **ATK** | `character.stats.atk` | `formatNumber(stats.atk)` | `1,280` | `1,842` | `Swords` | `text-amber-400` |
| **DEF** | `character.stats.def` | `formatNumber(stats.def)` | `876` | `750` | `Shield` | `text-blue-400` |
| **Elemental Mastery** | `character.stats.em` | `formatNumber(stats.em)` | `187` | `120` | `Sparkles` | `text-teal-400` |
| **Energy Recharge** | `character.stats.er` | `formatPercentage(stats.er, 1)` | `110.0%` | `155.1%` | `Zap` | `text-yellow-400` |
| **Crit Ratio** | `stats.cr`, `stats.cd` | `${formatPercentage(cr, 1)} / ${formatPercentage(cd, 1)}` | `91.2% / 202.3%` | `72.3% / 202.4%` | `Crosshair` | `text-cyan-400` |
| **CR:CD Ratio** | `stats.cd / stats.cr` | `1:${(stats.cd / Math.max(0.1, stats.cr)).toFixed(1)}` | `1:2.2` | `1:2.8` | `Crosshair` | `bg-cyan-500/10` |
| **Elemental DMG** | `stats.dmgBonus[element]` | `formatPercentage(stats.dmgBonus[elem.toLowerCase()] \|\| 0, 1)` | `46.6%` (Pyro) | `46.6%` (Electro) | `ElementIcon` | Elemental Theme |

#### 3.1.2 Layout & Hierarchy
- Enclosed in a glassmorphic container: `rounded-xl bg-black/25 p-3.5 border border-white/10 backdrop-blur-sm`.
- 2-column grid for primary base stats (HP, DEF, ER in col 1; ATK, EM, Elem DMG in col 2).
- Full-width spanning row for **Crit Ratio** featuring both the formatted crit stats (`91.2% / 202.3%`) and an inline badge displaying the calculated ratio (`1:2.2` or `1:2.8`).
- Label `Crit Ratio` is strictly preserved to satisfy Tier 1 E2E tests.

---

### 3.2 Feature 2: Build CV Tier Badge

#### 3.2.1 Mathematical Calculation
- Sum of equipped artifact pieces CV:
  ```typescript
  const totalCv = character.totalCv !== undefined
    ? character.totalCv
    : parseFloat(
        (character.artifacts || []).reduce((sum, a) => sum + (a.cv || 0), 0).toFixed(1)
      );
  const buildTier = character.qualityBadge || getBuildCVTier(totalCv);
  ```
- Evaluated against thresholds:
  - `< 140.0`: **Subpar**
  - `140.0 – 179.9`: **Decent** (e.g., Addy's Varesa = `178.0`, Hu Tao = `172.8`)
  - `180.0 – 219.9`: **Good**
  - `220.0 – 239.9`: **Great**
  - `>= 240.0`: **Godly**

#### 3.2.2 Tier Styling Catalog
```typescript
export const BUILD_CV_TIER_CONFIG: Record<
  QualityBadge,
  {
    label: QualityBadge;
    badgeClass: string;
    glowClass: string;
    borderClass: string;
    textClass: string;
    rangeText: string;
    description: string;
  }
> = {
  Godly: {
    label: 'Godly',
    badgeClass: 'bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-orange-500/25 text-amber-300 border-amber-400/80',
    glowClass: 'shadow-[0_0_15px_rgba(245,158,11,0.45)]',
    borderClass: 'border-amber-400/70',
    textClass: 'text-amber-300',
    rangeText: '≥ 240.0 CV',
    description: 'Top-tier endgame build with exceptional Crit substats across all 5 artifact pieces.',
  },
  Great: {
    label: 'Great',
    badgeClass: 'bg-gradient-to-r from-purple-500/25 to-pink-500/25 text-purple-300 border-purple-400/70',
    glowClass: 'shadow-[0_0_12px_rgba(168,85,247,0.35)]',
    borderClass: 'border-purple-400/60',
    textClass: 'text-purple-300',
    rangeText: '220.0 – 239.9 CV',
    description: 'High-investment build with strong Crit roll density.',
  },
  Good: {
    label: 'Good',
    badgeClass: 'bg-gradient-to-r from-cyan-500/25 to-blue-500/25 text-cyan-300 border-cyan-400/60',
    glowClass: 'shadow-[0_0_10px_rgba(6,182,212,0.3)]',
    borderClass: 'border-cyan-400/50',
    textClass: 'text-cyan-300',
    rangeText: '180.0 – 219.9 CV',
    description: 'Solid endgame build ready for Spiral Abyss Floor 12.',
  },
  Decent: {
    label: 'Decent',
    badgeClass: 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-400/50',
    glowClass: 'shadow-[0_0_8px_rgba(16,185,129,0.25)]',
    borderClass: 'border-emerald-400/40',
    textClass: 'text-emerald-300',
    rangeText: '140.0 – 179.9 CV',
    description: 'Functional build with room for artifact substat optimization.',
  },
  Subpar: {
    label: 'Subpar',
    badgeClass: 'bg-slate-700/40 text-slate-400 border-slate-600/40',
    glowClass: '',
    borderClass: 'border-slate-600/30',
    textClass: 'text-slate-400',
    rangeText: '< 140.0 CV',
    description: 'Early-game build or non-Crit focused support build.',
  },
};
```

#### 3.2.3 Tooltip Disclosure
- Hover and focus/tap support.
- Tooltip displays:
  - Header: "Build Crit Value (CV)" + Tier badge pill
  - Total artifact CV: `${totalCv.toFixed(1)} CV`
  - Tier Range: `${tierConfig.rangeText}`
  - Descriptive evaluation text
  - Universal formula explanation: `CV = 2 × CR + CD (sum of 5 equipped pieces)`

---

### 3.3 Feature 3: Active Artifact Set Bonus Chips

#### 3.3.1 Active Bonus Extraction
- Uses `getActiveArtifactSetBonuses(character.artifactSets, character.artifacts)`:
  - Filters out 1-piece off-pieces (`count < 2`).
  - Distinguishes 2-piece active sets (`count >= 2`) and 4-piece active sets (`count >= 4`).
- Renders chip label:
  - 4-piece set: `${bonus.setName} (4)` (e.g., `Obsidian Codex (4)`)
  - 2-piece set: `${bonus.setName} (2)` (e.g., `Golden Troupe (2)`)
  - Matches exact requirement: `Render interactive chips for active 2-piece and 4-piece set bonuses (e.g., Obsidian Codex (4))`.

#### 3.3.2 Popover Disclosure Without Card Clipping
- The main card container previously had `overflow-hidden`. To allow popovers to display cleanly:
  - Move `overflow-hidden` to inner banners that require clipping (e.g. character art header), or anchor the popover cleanly within the card's relative boundary.
  - Position the popover as `absolute bottom-full left-0 mb-2 w-72 max-w-[calc(100vw-2rem)] z-50`.
  - Use `e.stopPropagation()` on chip clicks to prevent triggering the full `CharacterDetailModal` view.
  - Popover shows:
    - Set Name & active tier pill (`4-Piece Active` or `2-Piece Active`)
    - 2-Piece bonus title & in-game skill text (`bonus.twoPieceText || bonus.twoPiece`)
    - 4-Piece bonus title & in-game skill text (`bonus.fourPieceText || bonus.fourPiece`), with dimmed inactive badge if only 2pc is equipped.

---

## 4. Complete Worker Implementation Blueprints

### 4.1 Blueprint A: Exact JSX/CSS for `CharacterCard.tsx`

The worker can replace the Quick Stats (lines 67-87) and Artifact Sets (lines 101-113) sections with the following integrated implementation:

```tsx
// ============================================================================
// IMPORTS NEEDED IN CharacterCard.tsx:
// ============================================================================
import { useState } from 'react';
import type { Character, QualityBadge, ActiveSetBonus } from '@/lib/enka/types';
import { ELEMENT_COLORS, getBuildCVTier, getActiveArtifactSetBonuses } from '@/lib/enka/static-data';
import { formatNumber, formatPercentage } from '@/lib/utils';
import { ElementIcon } from '@/components/ui/element-icons';
import { Heart, Swords, Shield, Sparkles, Zap, Crosshair, Info } from 'lucide-react';

// ============================================================================
// BUILD CV TIER CONFIGURATION:
// ============================================================================
const BUILD_CV_TIER_CONFIG: Record<
  QualityBadge,
  {
    badgeClass: string;
    glowClass: string;
    borderClass: string;
    textClass: string;
    rangeText: string;
    description: string;
  }
> = {
  Godly: {
    badgeClass: 'bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-orange-500/25 text-amber-300 border-amber-400/80',
    glowClass: 'shadow-[0_0_15px_rgba(245,158,11,0.45)]',
    borderClass: 'border-amber-400/70',
    textClass: 'text-amber-300',
    rangeText: '≥ 240.0 CV',
    description: 'Top-tier endgame build with exceptional Crit substats across all 5 artifact pieces.',
  },
  Great: {
    badgeClass: 'bg-gradient-to-r from-purple-500/25 to-pink-500/25 text-purple-300 border-purple-400/70',
    glowClass: 'shadow-[0_0_12px_rgba(168,85,247,0.35)]',
    borderClass: 'border-purple-400/60',
    textClass: 'text-purple-300',
    rangeText: '220.0 – 239.9 CV',
    description: 'High-investment build with strong Crit roll density.',
  },
  Good: {
    badgeClass: 'bg-gradient-to-r from-cyan-500/25 to-blue-500/25 text-cyan-300 border-cyan-400/60',
    glowClass: 'shadow-[0_0_10px_rgba(6,182,212,0.3)]',
    borderClass: 'border-cyan-400/50',
    textClass: 'text-cyan-300',
    rangeText: '180.0 – 219.9 CV',
    description: 'Solid endgame build ready for Spiral Abyss Floor 12.',
  },
  Decent: {
    badgeClass: 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-400/50',
    glowClass: 'shadow-[0_0_8px_rgba(16,185,129,0.25)]',
    borderClass: 'border-emerald-400/40',
    textClass: 'text-emerald-300',
    rangeText: '140.0 – 179.9 CV',
    description: 'Functional build with room for artifact substat optimization.',
  },
  Subpar: {
    badgeClass: 'bg-slate-700/40 text-slate-400 border-slate-600/40',
    glowClass: '',
    borderClass: 'border-slate-600/30',
    textClass: 'text-slate-400',
    rangeText: '< 140.0 CV',
    description: 'Early-game build or non-Crit focused support build.',
  },
};

// ============================================================================
// COMPONENT COMPUTATIONS (INSIDE CharacterCard):
// ============================================================================

// 1. Build CV Calculation
const totalCv = character.totalCv !== undefined
  ? character.totalCv
  : parseFloat(
      (character.artifacts || []).reduce((sum, a) => sum + (a.cv || 0), 0).toFixed(1)
    );
const buildTier: QualityBadge = character.qualityBadge || getBuildCVTier(totalCv);
const tierConfig = BUILD_CV_TIER_CONFIG[buildTier] || BUILD_CV_TIER_CONFIG.Subpar;

// 2. CR:CD Ratio Calculation
const safeCr = Math.max(0, character.stats.cr || 0);
const safeCd = Math.max(0, character.stats.cd || 0);
const crCdRatio = safeCr > 0 ? (safeCd / safeCr).toFixed(1) : '0.0';

// 3. Primary Elemental DMG Bonus
const elementKey = character.element.toLowerCase();
const elemDmgBonus = character.stats.dmgBonus?.[elementKey] || 0;
const physDmgBonus = character.stats.dmgBonus?.['physical'] || 0;
const displayDmgBonus = Math.max(elemDmgBonus, physDmgBonus);
const displayDmgLabel = physDmgBonus > elemDmgBonus ? 'Physical DMG' : `${character.element} DMG`;

// 4. Active Artifact Set Bonuses
const activeBonuses = (character.activeSetBonuses && character.activeSetBonuses.length > 0)
  ? character.activeSetBonuses
  : getActiveArtifactSetBonuses(character.artifactSets || {}, character.artifacts);

// Popover state for active set bonus disclosure
const [activePopoverSetId, setActivePopoverSetId] = useState<number | null>(null);
const [showCvTooltip, setShowCvTooltip] = useState(false);
```

#### 4.1.3 Section A: Build CV Tier Badge Strip
```tsx
{/* Build CV & Tier Badge Strip */}
<div className="px-4 pt-3 pb-1">
  <div className="relative group/cv">
    <div
      className={`flex items-center justify-between px-3 py-2 rounded-xl bg-black/30 border ${tierConfig.borderClass} ${tierConfig.glowClass} transition-all cursor-help`}
      onMouseEnter={() => setShowCvTooltip(true)}
      onMouseLeave={() => setShowCvTooltip(false)}
      onClick={(e) => {
        e.stopPropagation();
        setShowCvTooltip(prev => !prev);
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Build CV</span>
        <span className="text-base font-bold text-white font-mono">{totalCv.toFixed(1)}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${tierConfig.badgeClass}`}>
          {buildTier}
        </span>
        <Info className="w-3.5 h-3.5 text-gray-400 opacity-60 group-hover/cv:opacity-100 transition-opacity" />
      </div>
    </div>

    {/* CV Explaining Tooltip */}
    <div
      className={`absolute left-0 right-0 top-full mt-2 z-50 p-3.5 rounded-xl bg-slate-950/95 backdrop-blur-xl border border-white/15 shadow-2xl transition-all duration-200 ${
        showCvTooltip ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
        <span className="text-xs font-semibold text-gray-200">Build Crit Value (CV)</span>
        <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold border ${tierConfig.badgeClass}`}>
          {buildTier}
        </span>
      </div>
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-400">Total Artifact CV:</span>
          <span className="font-mono font-bold text-white">{totalCv.toFixed(1)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Tier Threshold:</span>
          <span className="font-mono text-cyan-300">{tierConfig.rangeText}</span>
        </div>
        <p className="text-[11px] text-gray-300 pt-1 leading-relaxed">
          {tierConfig.description}
        </p>
        <div className="pt-2 border-t border-white/10 text-[10px] text-gray-400">
          Formula: <span className="text-gray-200 font-mono">CV = 2 × CR + CD</span> across 5 artifact pieces.
        </div>
      </div>
    </div>
  </div>
</div>
```

#### 4.1.4 Section B: Key Attribute Panel
```tsx
{/* Key Attribute Panel */}
<div className="p-4">
  <div className="rounded-xl bg-black/25 p-3.5 border border-white/10 space-y-3">
    {/* Primary Stats Grid */}
    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
      {/* Max HP */}
      <div className="flex items-center justify-between group/stat">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Heart className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span>HP</span>
        </div>
        <span className="font-semibold text-white font-mono text-xs">
          {formatNumber(character.stats.hp)}
        </span>
      </div>

      {/* ATK */}
      <div className="flex items-center justify-between group/stat">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Swords className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>ATK</span>
        </div>
        <span className="font-semibold text-white font-mono text-xs">
          {formatNumber(character.stats.atk)}
        </span>
      </div>

      {/* DEF */}
      <div className="flex items-center justify-between group/stat">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Shield className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span>DEF</span>
        </div>
        <span className="font-semibold text-white font-mono text-xs">
          {formatNumber(character.stats.def)}
        </span>
      </div>

      {/* Elemental Mastery */}
      <div className="flex items-center justify-between group/stat">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Sparkles className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <span>EM</span>
        </div>
        <span className="font-semibold text-white font-mono text-xs">
          {formatNumber(character.stats.em)}
        </span>
      </div>

      {/* Energy Recharge */}
      <div className="flex items-center justify-between group/stat">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Zap className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
          <span>ER</span>
        </div>
        <span className="font-semibold text-white font-mono text-xs">
          {formatPercentage(character.stats.er, 1)}
        </span>
      </div>

      {/* Elemental DMG Bonus */}
      <div className="flex items-center justify-between group/stat">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <ElementIcon element={character.element} size={14} className="shrink-0" style={{ color: elementColor.primary }} />
          <span className="truncate">{displayDmgLabel}</span>
        </div>
        <span className="font-semibold text-white font-mono text-xs">
          {formatPercentage(displayDmgBonus, 1)}
        </span>
      </div>
    </div>

    {/* Crit Ratio Full-Width Spanning Row */}
    <div className="pt-2 border-t border-white/10 flex items-center justify-between">
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <Crosshair className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        <span>Crit Ratio</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-bold text-white font-mono text-xs">
          {formatPercentage(character.stats.cr, 1)} / {formatPercentage(character.stats.cd, 1)}
        </span>
        <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-400/30 text-[10px] font-mono font-semibold">
          1:{crCdRatio}
        </span>
      </div>
    </div>
  </div>
</div>
```

#### 4.1.5 Section C: Active Artifact Set Bonus Chips
```tsx
{/* Active Artifact Set Bonus Chips */}
<div className="px-4 pb-3">
  <div className="text-xs text-gray-400 mb-2 font-medium">Active Set Bonuses</div>
  {activeBonuses.length === 0 ? (
    <div className="text-xs text-gray-500 italic bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
      No active set bonus (mixed artifacts)
    </div>
  ) : (
    <div className="flex flex-wrap gap-2 relative">
      {activeBonuses.map((bonus) => {
        const isFourPiece = bonus.fourPieceActive;
        const pieceBadge = isFourPiece ? 4 : 2;
        const chipLabel = `${bonus.setName} (${pieceBadge})`;
        const isOpen = activePopoverSetId === bonus.setId;

        return (
          <div key={bonus.setId} className="relative group/set">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActivePopoverSetId(prev => prev === bonus.setId ? null : bonus.setId);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all text-left ${
                isFourPiece
                  ? 'bg-amber-500/15 border-amber-400/50 text-amber-200 hover:bg-amber-500/25 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                  : 'bg-cyan-500/15 border-cyan-400/40 text-cyan-200 hover:bg-cyan-500/25 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
              }`}
            >
              <span>{chipLabel}</span>
              <span className={`text-[10px] px-1 py-0.2 rounded font-bold ${
                isFourPiece ? 'bg-amber-400/30 text-amber-100' : 'bg-cyan-400/30 text-cyan-100'
              }`}>
                {isFourPiece ? '4pc' : '2pc'}
              </span>
            </button>

            {/* Interactive Popover with Full In-Game Skill Descriptions */}
            <div
              className={`absolute bottom-full left-0 mb-2 w-80 max-w-[calc(100vw-2rem)] z-50 p-3.5 rounded-xl bg-slate-950/95 backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-200 ${
                isOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none group-hover/set:opacity-100 group-hover/set:scale-100 group-hover/set:pointer-events-auto'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Popover Header */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                <span className="text-xs font-bold text-white truncate max-w-[180px]">
                  {bonus.setName}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                  isFourPiece
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40'
                }`}>
                  {isFourPiece ? '4-Piece Active' : '2-Piece Active'}
                </span>
              </div>

              {/* 2-Piece Bonus Description */}
              <div className={`p-2.5 rounded-lg mb-2 text-xs ${
                bonus.twoPieceActive ? 'bg-cyan-950/40 border border-cyan-500/30' : 'bg-white/5 opacity-60'
              }`}>
                <div className="font-semibold text-cyan-300 mb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  2-Piece Bonus
                </div>
                <p className="text-gray-300 leading-relaxed text-[11px]">
                  {bonus.twoPieceText || bonus.twoPiece || 'Increases set stats.'}
                </p>
              </div>

              {/* 4-Piece Bonus Description */}
              {(bonus.fourPieceText || bonus.fourPiece) && (
                <div className={`p-2.5 rounded-lg text-xs ${
                  isFourPiece ? 'bg-amber-950/40 border border-amber-500/30' : 'bg-white/5 border border-white/5 opacity-50'
                }`}>
                  <div className={`font-semibold mb-1 flex items-center gap-1.5 ${
                    isFourPiece ? 'text-amber-300' : 'text-gray-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isFourPiece ? 'bg-amber-400' : 'bg-gray-500'}`} />
                    4-Piece Bonus {!isFourPiece && <span className="text-[10px] text-gray-500 font-normal">(Inactive)</span>}
                  </div>
                  <p className="text-gray-300 leading-relaxed text-[11px]">
                    {bonus.fourPieceText || bonus.fourPiece}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  )}
</div>
```

---

### 4.2 Blueprint B: Showcase Summary in `ProfileClient.tsx`

To enrich `ProfileClient.tsx` alongside the character cards, we provide a summary banner calculating the account-level Showcase CV and active build stats:

```tsx
// Inside ProfileClient.tsx, right above the Character Showcase grid:
{data.characters.length > 0 && (
  <div className="mb-6 p-4 glass rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-4 text-sm">
    <div className="flex items-center gap-3">
      <span className="text-gray-400">Showcase Characters:</span>
      <span className="font-bold text-white font-mono text-base">{data.characters.length}</span>
    </div>
    <div className="flex items-center gap-3">
      <span className="text-gray-400">Average Build CV:</span>
      <span className="font-bold text-cyan-400 font-mono text-base">
        {(
          data.characters.reduce((sum, c) => sum + (c.totalCv || 0), 0) / data.characters.length
        ).toFixed(1)}
      </span>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-gray-400">Top Build:</span>
      {(() => {
        const topChar = [...data.characters].sort((a, b) => (b.totalCv || 0) - (a.totalCv || 0))[0];
        return (
          <span className="font-semibold text-amber-300">
            {topChar.name} ({topChar.totalCv?.toFixed(1) || '0.0'} CV)
          </span>
        );
      })()}
    </div>
  </div>
)}
```

---

## 5. Risk Assessment & Edge Cases Handled

| Potential Issue | Root Cause | Blueprint Solution |
|---|---|---|
| **Division by zero in CR:CD ratio** | Characters with 0% CR (e.g., Kokomi) | Guard with `safeCr > 0 ? (safeCd / safeCr).toFixed(1) : '0.0'`, returns `1:0.0` without NaN. |
| **Card popover clipped** | Outer card container `overflow-hidden` | Position popover above chips (`bottom-full`), provide click toggle, and only clip inner image containers. |
| **Modal opens on chip click** | Event bubbling to `CharacterCard` `onClick={() => setShowModal(true)}` | Call `e.stopPropagation()` on all chip buttons and popover containers. |
| **Missing `totalCv` on character** | Parser fallback or mock fixture without pre-computed CV | Fallback to `character.artifacts.reduce((sum, a) => sum + (a.cv || 0), 0)`. |
| **No active artifact set bonuses** | Rainbow 5-piece build without 2pc bonuses | Displays fallback label `"No active set bonus (mixed artifacts)"` without rendering broken chips. |
| **E2E test suite regression** | Tests expecting exact text `ATK`, `Crit Ratio`, `EM`, `ER`, `91.2%`, `202.3%` | Explicitly preserved exact labels and formatted numbers. |
| **R5 violation** | Modifying `src/app/page.tsx` | Strictly untouched. Line count (219) and hash preserved. |

---

## 6. Implementation Readiness
The blueprints above are complete, exact, and ready for immediate implementation by Worker `teamwork_preview_worker_m3_1`.
