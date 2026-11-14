# Milestone 4 Analysis: Roll Analysis Visual Pips & Piece CV Badges

**Author**: Explorer 3 (Milestone 4: Roll Analysis Pips & Piece CV Badges)  
**Date**: 2026-11-01  
**Target Component**: `src/components/character/ArtifactDisplay.tsx`  
**Related Modules**: `src/lib/enka/static-data.ts`, `src/lib/enka/parser.ts`, `src/lib/enka/types.ts`  

---

## 1. Executive Summary

Milestone 4 focuses on overhauling the Artifact Detail and Roll Analysis Grid in `ArtifactDisplay.tsx`. As Explorer 3, our primary investigation and design mandate encompasses:
1. **Substat Roll Analysis Visual Pips**: Designing high-contrast, monospace-aligned pip rendering showing authentic substat roll counts $k \in [1..6]$ (`[●○○○○]` through `[●●●●●]`, and `[●●●●●★]`), complete with informative tooltips detailing base rolls vs. upgrades.
2. **Piece Crit Value (CV) & Quality Badges**: Establishing universal Crit Value calculation ($2 \times \text{CR} + \text{CD}$) from substats, applying the dual-scale Quality Badge taxonomy (Standard 50/40/30/20 vs Circlet 35/30/20/10), and crafting distinctive visual badge styles with radiant glassmorphic glow borders.
3. **Defensive Integration**: Guaranteeing zero `NaN` / `undefined` regressions, full backward compatibility with existing tests in `tests/e2e/e2e-showcase.test.ts`, and strict compliance with the **R5 Home UI constraint** (`src/app/page.tsx` unmodified).

---

## 2. Core Mathematical Specifications & Formulas

### 2.1 Universal Crit Value (CV) Formula

The universal community-standard Crit Value (CV) formula measures offensive investment on gear:
$$\text{CV}_{\text{piece}} = 2 \times \text{CR}_{\text{substat}} + \text{CD}_{\text{substat}}$$

#### Calculation Rules:
1. **Substats Only**: Crit Value on an individual artifact piece is derived strictly from its **substats**. The main stat of a Circlet (which can be 31.1% CR or 62.2% CD) is excluded from piece CV to assess roll quality and substat RNG.
2. **Normalized Input**: Input values are percentages on a $0 - 100$ scale (e.g. 7.8% CR, 21.8% CD). If a raw decimal fraction $\le 1.0$ is encountered, it is normalized: $\text{val} \le 1.0 \implies \text{val} \times 100$.
3. **Negative Clamping**: Negative or malformed numbers are strictly clamped to $0$:
   $$\text{CR}_{\text{safe}} = \max(0, \text{CR}), \quad \text{CD}_{\text{safe}} = \max(0, \text{CD})$$
4. **Precision**: The output is formatted strictly to 1 decimal place without floating-point artifacts:
   $$\text{CV} = \text{parseFloat}((2 \times \text{CR}_{\text{safe}} + \text{CD}_{\text{safe}}).\text{toFixed}(1))$$

### 2.2 Dual-Scale Piece CV Quality Badge Matrix

Genshin Impact features 5 artifact slots:
- **Standard Slots**: Flower (`EQUIP_BRACER`), Plume (`EQUIP_NECKLACE`), Sands (`EQUIP_SHOES`), Goblet (`EQUIP_RING`). These pieces can roll both Crit Rate and Crit DMG as substats.
- **Circlet Slot**: Circlet of Logos (`EQUIP_DRESS`). If a Circlet has Crit Rate or Crit DMG as its main stat, it cannot roll that same stat as a substat. Therefore, Circlet substat CV is structurally constrained, requiring an adjusted threshold scale:

| Tier | Quality Badge | Standard Pieces CV (Flower, Plume, Sands, Goblet) | Circlet CV (`isCirclet === true`) | Aesthetic Tone |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 5** | **Godly** | $\ge 50.0\text{ CV}$ | $\ge 35.0\text{ CV}$ | Radiant Amber / Gold Glow |
| **Tier 4** | **Great** | $40.0 - 49.9\text{ CV}$ | $30.0 - 34.9\text{ CV}$ | Vibrant Violet / Purple Glow |
| **Tier 3** | **Good** | $30.0 - 39.9\text{ CV}$ | $20.0 - 29.9\text{ CV}$ | Luminous Cyan / Blue Glow |
| **Tier 2** | **Decent** | $20.0 - 29.9\text{ CV}$ | $10.0 - 19.9\text{ CV}$ | Fresh Emerald / Green Glow |
| **Tier 1** | **Subpar** | $< 20.0\text{ CV}$ | $< 10.0\text{ CV}$ | Muted Slate / Gray (No Glow) |

### 2.3 Substat Roll Estimation & Pip Generation

In Genshin Impact:
- A 5-star artifact starts with 3 or 4 substats at Level 0 (1 base roll each).
- It gains 5 upgrade rolls at levels +4, +8, +12, +16, and +20.
- A single substat can receive between 0 and 5 upgrades, yielding total roll counts $k \in [1..6]$.

#### Substat Roll Value Baseline (`SUBSTAT_ROLLS`):
- `cr`: `[2.72, 3.11, 3.50, 3.89]` (avg: 3.305)
- `cd`: `[5.44, 6.22, 6.99, 7.77]` (avg: 6.605)
- `atkPercent`: `[4.08, 4.66, 5.25, 5.83]` (avg: 4.955)
- `hpPercent`: `[4.08, 4.66, 5.25, 5.83]` (avg: 4.955)
- `defPercent`: `[5.10, 5.83, 6.56, 7.29]` (avg: 6.195)
- `er`: `[4.53, 5.18, 5.83, 6.48]` (avg: 5.505)
- `em`: `[16.32, 18.65, 20.98, 23.31]` (avg: 19.815)
- `atk`: `[14, 16, 18, 19]` (avg: 16.75)
- `hp`: `[209, 239, 269, 299]` (avg: 254)
- `def`: `[16, 19, 21, 23]` (avg: 19.75)

#### Pip String Representation (`deriveVisualRollPips`):
- $k = 1$: `[●○○○○]` (1 base roll, 0 upgrades)
- $k = 2$: `[●●○○○]` (1 base roll, 1 upgrade)
- $k = 3$: `[●●●○○]` (1 base roll, 2 upgrades)
- $k = 4$: `[●●●●○]` (1 base roll, 3 upgrades)
- $k = 5$: `[●●●●●]` (1 base roll, 4 upgrades)
- $k = 6$: `[●●●●●★]` (1 base roll, 5 max upgrades — theoretical max "unicorn")

---

## 3. Visual Styling System & High-Contrast Design

### 3.1 Piece CV Quality Badge Styling Matrix

The quality badge rendered in the artifact card header provides instant visual feedback on the piece's Crit quality:

```tsx
export const PIECE_CV_BADGE_CONFIG: Record<QualityBadge, {
  label: QualityBadge;
  badgeClass: string;
  glowClass: string;
  icon?: string;
  description: string;
  standardRange: string;
  circletRange: string;
}> = {
  Godly: {
    label: 'Godly',
    badgeClass: 'bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-orange-500/25 text-amber-300 border-amber-400/80',
    glowClass: 'shadow-[0_0_12px_rgba(245,158,11,0.45)] ring-1 ring-amber-400/30',
    icon: '✦',
    description: 'Top-tier unicorn artifact with exceptional Crit roll density.',
    standardRange: '≥ 50.0 CV',
    circletRange: '≥ 35.0 CV',
  },
  Great: {
    label: 'Great',
    badgeClass: 'bg-gradient-to-r from-purple-500/25 to-pink-500/25 text-purple-300 border-purple-400/70',
    glowClass: 'shadow-[0_0_10px_rgba(168,85,247,0.35)] ring-1 ring-purple-400/20',
    description: 'High-investment piece with strong Crit substat upgrades.',
    standardRange: '40.0 – 49.9 CV',
    circletRange: '30.0 – 34.9 CV',
  },
  Good: {
    label: 'Good',
    badgeClass: 'bg-gradient-to-r from-cyan-500/25 to-blue-500/25 text-cyan-300 border-cyan-400/60',
    glowClass: 'shadow-[0_0_8px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/20',
    description: 'Solid endgame piece ready for Abyss Floor 12 clears.',
    standardRange: '30.0 – 39.9 CV',
    circletRange: '20.0 – 29.9 CV',
  },
  Decent: {
    label: 'Decent',
    badgeClass: 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-400/50',
    glowClass: 'shadow-[0_0_6px_rgba(16,185,129,0.25)] ring-1 ring-emerald-400/20',
    description: 'Functional mid-game piece with usable Crit stats.',
    standardRange: '20.0 – 29.9 CV',
    circletRange: '10.0 – 19.9 CV',
  },
  Subpar: {
    label: 'Subpar',
    badgeClass: 'bg-slate-800/60 text-slate-400 border-slate-700/60',
    glowClass: 'shadow-none',
    description: 'Low or zero Crit substat investment; potential fodder or niche support.',
    standardRange: '< 20.0 CV',
    circletRange: '< 10.0 CV',
  },
};
```

### 3.2 Substat Roll Pip Styling & Monospace Formatting

To solve the visual alignment and contrast challenges:
1. **Monospace Tabular Alignment**: We use `font-mono tracking-wider tabular-nums` to ensure exact character width alignment across all 4 substat rows. The pip container has a fixed minimum width (`min-w-[5.2rem]`) so that `[●○○○○]` through `[●●●●●★]` line up vertically with zero jitter.
2. **Tiered Roll Luck Highlighting**: Rather than a monochrome cyan for all rolls, roll pips receive tier-sensitive colors:
   - **6 Rolls (`★`)**: `bg-yellow-500/20 text-yellow-300 border-yellow-400/60 shadow-[0_0_8px_rgba(250,204,21,0.4)] font-bold`
   - **5 Rolls**: `bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-[0_0_6px_rgba(245,158,11,0.3)] font-bold`
   - **4 Rolls**: `bg-purple-500/15 text-purple-300 border-purple-400/40 shadow-[0_0_6px_rgba(168,85,247,0.25)] font-semibold`
   - **3 Rolls**: `bg-cyan-500/15 text-cyan-300 border-cyan-400/40 shadow-[0_0_4px_rgba(6,182,212,0.2)] font-medium`
   - **1–2 Rolls**: `bg-slate-800/40 text-slate-400 border-slate-700/50`
3. **Tooltip Explanation Matrix**: The `title` attribute delivers a clear explanation of how many rolls and upgrades occurred:
   ```ts
   function getRollTooltip(statName: string, rolls: number): string {
     const upgrades = Math.max(0, rolls - 1);
     if (rolls === 6) {
       return `${rolls} Rolls (★ Theoretical Maximum): ${statName} received all 5 upgrade procs (5 upgrades + 1 base roll).`;
     }
     if (rolls === 5) {
       return `${rolls} Rolls (Exceptional): ${statName} received 4 upgrade procs (4 upgrades + 1 base roll).`;
     }
     if (rolls === 4) {
       return `${rolls} Rolls (High Investment): ${statName} received 3 upgrade procs (3 upgrades + 1 base roll).`;
     }
     if (rolls === 3) {
       return `${rolls} Rolls (Solid): ${statName} received 2 upgrade procs (2 upgrades + 1 base roll).`;
     }
     if (rolls === 2) {
       return `${rolls} Rolls: ${statName} received 1 upgrade proc (1 upgrade + 1 base roll).`;
     }
     return `1 Roll (Base stat): ${statName} received 0 upgrades (Initial base roll only).`;
   }
   ```

---

## 4. Edge Cases & Defensive Fallbacks

| Scenario | Risk | Mitigation |
| :--- | :--- | :--- |
| **No CR or CD Substats** | CV returns `NaN` or qualityBadge is missing | Safe defaults: `crVal = 0`, `cdVal = 0`, `cv = 0.0`, returns `Subpar (0.0 CV)`. |
| **Circlet with CR/CD Main Stat** | Circlet CV skewed or incorrectly penalized | Dual-scale threshold: `isCirclet = artifact.slot === 'circlet'`, triggers circlet CV thresholds ($\ge 35$ Godly). |
| **Substat missing `rolls` or `pips`** | Pips undefined or blank space | Compute fallbacks: `rolls = subStat.rolls ?? estimateRollCount(subStat.key, subStat.value)`, `pips = subStat.pips ?? deriveVisualRollPips(rolls)`. |
| **`pips` already has outer brackets** | Redundant double brackets `[[●●●○]]` | Defensive sanitize: strip leading/trailing `[` and `]`, then wrap cleanly in `[${cleanPips}]`. |
| **Decimal Precision Drift** | IEEE 754 float drift (e.g. `37.400000000000006`) | Strictly enforce `cv.toFixed(1)`. |
| **Home UI Isolation** | Inadvertent modification of `src/app/page.tsx` | Strictly untouched. All changes scoped to `src/components/character/ArtifactDisplay.tsx`. |

---

## 5. Complete JSX/CSS Implementation Blueprint for Worker

The following blueprint provides the exact, production-ready implementation of `ArtifactDisplay.tsx`:

```tsx
'use client';

import React from 'react';
import type { Artifact, QualityBadge } from '@/lib/enka/types';
import { formatPercentage, cn } from '@/lib/utils';
import {
  calculateCritValue,
  getQualityBadge,
  estimateRollCount,
  deriveVisualRollPips,
} from '@/lib/enka/static-data';

// ============================================================================
// Quality Badge Visual Configuration
// ============================================================================
export const PIECE_CV_BADGE_CONFIG: Record<QualityBadge, {
  label: QualityBadge;
  badgeClass: string;
  glowClass: string;
  description: string;
  thresholdStandard: string;
  thresholdCirclet: string;
}> = {
  Godly: {
    label: 'Godly',
    badgeClass: 'bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-orange-500/25 text-amber-300 border-amber-400/80',
    glowClass: 'shadow-[0_0_12px_rgba(245,158,11,0.45)] ring-1 ring-amber-400/30',
    description: 'Top-tier unicorn artifact with exceptional Crit roll density.',
    thresholdStandard: '≥ 50.0 CV',
    thresholdCirclet: '≥ 35.0 CV',
  },
  Great: {
    label: 'Great',
    badgeClass: 'bg-gradient-to-r from-purple-500/25 to-pink-500/25 text-purple-300 border-purple-400/70',
    glowClass: 'shadow-[0_0_10px_rgba(168,85,247,0.35)] ring-1 ring-purple-400/20',
    description: 'High-investment piece with strong Crit substat upgrades.',
    thresholdStandard: '40.0 – 49.9 CV',
    thresholdCirclet: '30.0 – 34.9 CV',
  },
  Good: {
    label: 'Good',
    badgeClass: 'bg-gradient-to-r from-cyan-500/25 to-blue-500/25 text-cyan-300 border-cyan-400/60',
    glowClass: 'shadow-[0_0_8px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/20',
    description: 'Solid endgame piece ready for Spiral Abyss Floor 12.',
    thresholdStandard: '30.0 – 39.9 CV',
    thresholdCirclet: '20.0 – 29.9 CV',
  },
  Decent: {
    label: 'Decent',
    badgeClass: 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-400/50',
    glowClass: 'shadow-[0_0_6px_rgba(16,185,129,0.25)] ring-1 ring-emerald-400/20',
    description: 'Functional build piece with room for optimization.',
    thresholdStandard: '20.0 – 29.9 CV',
    thresholdCirclet: '10.0 – 19.9 CV',
  },
  Subpar: {
    label: 'Subpar',
    badgeClass: 'bg-slate-800/60 text-slate-400 border-slate-700/60',
    glowClass: 'shadow-none',
    description: 'Low or zero Crit substat investment.',
    thresholdStandard: '< 20.0 CV',
    thresholdCirclet: '< 10.0 CV',
  },
};

// ============================================================================
// Substat Roll Luck Tier Styling Helper
// ============================================================================
function getPipBadgeClass(rolls: number): string {
  if (rolls >= 6) {
    return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/60 shadow-[0_0_8px_rgba(250,204,21,0.4)] font-bold';
  }
  if (rolls === 5) {
    return 'bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-[0_0_6px_rgba(245,158,11,0.3)] font-bold';
  }
  if (rolls === 4) {
    return 'bg-purple-500/15 text-purple-300 border-purple-400/40 shadow-[0_0_6px_rgba(168,85,247,0.25)] font-semibold';
  }
  if (rolls === 3) {
    return 'bg-cyan-500/15 text-cyan-300 border-cyan-400/40 shadow-[0_0_4px_rgba(6,182,212,0.2)] font-medium';
  }
  if (rolls === 2) {
    return 'bg-emerald-500/10 text-emerald-300/90 border-emerald-500/30 font-normal';
  }
  return 'bg-slate-800/40 text-slate-400 border-slate-700/50 font-normal';
}

function getRollTooltip(statName: string, rolls: number): string {
  const upgrades = Math.max(0, rolls - 1);
  if (rolls >= 6) {
    return `${rolls} Rolls (★ Theoretical Maximum): ${statName} received all 5 upgrade procs (5 upgrades + 1 base roll).`;
  }
  if (rolls === 5) {
    return `${rolls} Rolls (Exceptional): ${statName} received 4 upgrade procs (4 upgrades + 1 base roll).`;
  }
  if (rolls === 4) {
    return `${rolls} Rolls (High Investment): ${statName} received 3 upgrade procs (3 upgrades + 1 base roll).`;
  }
  if (rolls === 3) {
    return `${rolls} Rolls (Solid): ${statName} received 2 upgrade procs (2 upgrades + 1 base roll).`;
  }
  if (rolls === 2) {
    return `${rolls} Rolls: ${statName} received 1 upgrade proc (1 upgrade + 1 base roll).`;
  }
  return `1 Roll (Base stat): ${statName} received 0 upgrades (Initial base roll only).`;
}

interface ArtifactDisplayProps {
  artifact: Artifact;
}

export default function ArtifactDisplay({ artifact }: ArtifactDisplayProps) {
  const isCirclet = artifact.slot === 'circlet';

  // Compute or resolve Crit Value (CV = 2 * CR + CD) from substats
  const crSub = artifact.subStats.find(s => s.key === 'cr' || s.key.toLowerCase() === 'crit_rate');
  const cdSub = artifact.subStats.find(s => s.key === 'cd' || s.key.toLowerCase() === 'crit_dmg');
  const crVal = crSub ? (crSub.value <= 1.0 ? crSub.value * 100 : crSub.value) : 0;
  const cdVal = cdSub ? (cdSub.value <= 1.0 ? cdSub.value * 100 : cdSub.value) : 0;
  
  const pieceCv = artifact.cv !== undefined
    ? artifact.cv
    : calculateCritValue(crVal, cdVal);

  const qualityBadge = artifact.qualityBadge || getQualityBadge(pieceCv, isCirclet);
  const badgeConfig = PIECE_CV_BADGE_CONFIG[qualityBadge] || PIECE_CV_BADGE_CONFIG.Subpar;

  // Calculate roll quality (assumes max possible rolls = 9 at +20)
  const maxPossibleRolls = artifact.level >= 20 ? 9 : Math.floor(artifact.level / 4) + 1;
  const actualRolls = artifact.subStats.reduce((sum, sub) => {
    const rolls = sub.rolls ?? estimateRollCount(sub.key, sub.value);
    return sum + (rolls || 1);
  }, 0);
  const rollQuality = Math.min(100, Math.max(0, (actualRolls / maxPossibleRolls) * 100));

  const getQualityColor = (quality: number) => {
    if (quality >= 80) return 'text-amber-400';
    if (quality >= 70) return 'text-purple-400';
    if (quality >= 50) return 'text-cyan-400';
    if (quality >= 30) return 'text-emerald-400';
    return 'text-gray-400';
  };

  const getStatDisplay = (key: string, value: number) => {
    const isPercentage =
      ['cr', 'cd', 'er', 'hpPercent', 'atkPercent', 'defPercent', 'healingBonus'].includes(key) ||
      key.includes('DmgBonus') ||
      key.toLowerCase().includes('percent');

    if (isPercentage) {
      const normalized = value <= 1.0 ? value * 100 : value;
      return formatPercentage(normalized, 1);
    }
    return value.toFixed(0);
  };

  const getStatName = (key: string) => {
    const names: Record<string, string> = {
      hp: 'HP',
      atk: 'ATK',
      def: 'DEF',
      hpPercent: 'HP%',
      atkPercent: 'ATK%',
      defPercent: 'DEF%',
      cr: 'CRIT Rate',
      cd: 'CRIT DMG',
      er: 'Energy Recharge',
      em: 'Elemental Mastery',
      healingBonus: 'Healing Bonus',
      physicalDmgBonus: 'Physical DMG',
      pyroDmgBonus: 'Pyro DMG',
      hydroDmgBonus: 'Hydro DMG',
      electroDmgBonus: 'Electro DMG',
      cryoDmgBonus: 'Cryo DMG',
      dendroDmgBonus: 'Dendro DMG',
      anemoDmgBonus: 'Anemo DMG',
      geoDmgBonus: 'Geo DMG',
    };
    return names[key] || key;
  };

  const badgeTooltip = `${badgeConfig.label} Piece (${pieceCv.toFixed(1)} CV) — Threshold: ${
    isCirclet ? badgeConfig.thresholdCirclet : badgeConfig.thresholdStandard
  }. ${badgeConfig.description}`;

  return (
    <div className="glass rounded-xl p-4 relative overflow-hidden transition-all duration-200 hover:border-white/20 border border-white/10 bg-slate-900/80 backdrop-blur-md flex flex-col justify-between shadow-lg">
      {/* Background Watermark Icon */}
      {artifact.icon && (
        <img
          src={artifact.icon}
          alt={artifact.setName}
          className="absolute -right-3 -top-3 w-28 h-28 opacity-15 pointer-events-none object-contain select-none"
        />
      )}

      {/* Header: Slot Name, Piece CV Quality Badge, Level, Rarity */}
      <div className="flex items-start justify-between mb-3 relative z-10 gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
              {artifact.slot.toUpperCase()}
            </span>

            {/* Piece CV Quality Badge with Distinctive Color & Glow */}
            <span
              className={cn(
                "text-[11px] px-2.5 py-0.5 rounded-full font-bold border transition-all cursor-help flex items-center gap-1",
                badgeConfig.badgeClass,
                badgeConfig.glowClass
              )}
              title={badgeTooltip}
            >
              {qualityBadge === 'Godly' && (
                <span className="text-[10px] text-amber-300 animate-pulse">✦</span>
              )}
              <span>
                {qualityBadge} ({pieceCv.toFixed(1)} CV)
              </span>
            </span>
          </div>

          <div className="text-xs text-gray-400 truncate mt-0.5" title={artifact.setName}>
            {artifact.setName}
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-sm font-black font-mono text-white">+{artifact.level}</div>
          <div className="text-xs text-amber-400 select-none tracking-tighter">
            {'★'.repeat(Math.min(5, Math.max(1, artifact.rarity || 5)))}
          </div>
        </div>
      </div>

      {/* Main Stat Panel */}
      <div className="mb-3 pb-3 border-b border-white/10 relative z-10">
        <div className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">Main Stat</div>
        <div className="flex justify-between items-baseline">
          <span className="text-sm font-semibold text-gray-200">{getStatName(artifact.mainStat.key)}</span>
          <span className="text-base font-extrabold text-cyan-400 font-mono tracking-tight drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">
            {getStatDisplay(artifact.mainStat.key, artifact.mainStat.value)}
          </span>
        </div>
      </div>

      {/* Sub Stats List with High-Contrast Roll Pips & Monospace Alignment */}
      <div className="space-y-2 relative z-10 flex-1">
        <div className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Sub Stats</div>
        <div className="space-y-1.5">
          {artifact.subStats.map((subStat, index) => {
            const statName = getStatName(subStat.key);
            const isPercent =
              ['cr', 'cd', 'er', 'hpPercent', 'atkPercent', 'defPercent', 'healingBonus'].includes(subStat.key) ||
              subStat.key.includes('DmgBonus') ||
              subStat.key.toLowerCase().includes('percent');

            const rolls = subStat.rolls ?? estimateRollCount(subStat.key, subStat.value);
            const rawPips = subStat.pips ?? deriveVisualRollPips(rolls);
            const cleanPips = rawPips.replace(/^\[+|\]+$/g, '');
            const pipsDisplay = `[${cleanPips}]`;
            const tooltip = getRollTooltip(statName, rolls);
            const pipBadgeClass = getPipBadgeClass(rolls);

            return (
              <div
                key={index}
                className="flex justify-between items-center text-xs py-0.5 hover:bg-white/5 px-1 rounded transition-colors"
              >
                <span className="text-gray-300 font-medium">{statName}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-white">
                    {getStatDisplay(subStat.key, subStat.value)}
                  </span>

                  {/* Monospace Roll Analysis Pips */}
                  <span
                    className={cn(
                      "text-[10px] font-mono tracking-widest px-1.5 py-0.5 rounded border select-none transition-all cursor-help tabular-nums min-w-[5.2rem] text-center inline-block",
                      pipBadgeClass
                    )}
                    title={tooltip}
                    aria-label={tooltip}
                  >
                    {pipsDisplay}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Roll Quality Bar */}
      <div className="mt-3 pt-3 border-t border-white/10 relative z-10">
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-gray-400 font-medium">Roll Quality</span>
          <span className={cn("font-mono font-bold", getQualityColor(rollQuality))}>
            {rollQuality.toFixed(0)}%
          </span>
        </div>
        <div className="mt-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              rollQuality >= 80 ? "bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]" :
              rollQuality >= 70 ? "bg-gradient-to-r from-purple-500 to-pink-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]" :
              rollQuality >= 50 ? "bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]" :
              "bg-gradient-to-r from-emerald-500 to-teal-500"
            )}
            style={{ width: `${rollQuality}%` }}
          />
        </div>
      </div>
    </div>
  );
}
```

---

## 6. Verification and Regression Checklist

1. **HTML Substring Asserts**:
   - `expect(html).toContain('FLOWER')` -> matches `artifact.slot.toUpperCase()`
   - `expect(html).toContain('Crimson Witch of Flames')` -> matches `artifact.setName`
   - `expect(html).toContain('+20')` -> matches `+{artifact.level}`
   - `expect(html).toContain('Main Stat')` -> matches section header
   - `expect(html).toContain('HP')` -> matches main stat label
   - `expect(html).toContain('4780')` -> matches main stat value
   - `expect(html).toContain('CRIT DMG')` -> matches circlet stat
   - `expect(html).toContain('Sub Stats')` -> matches substat header
   - `expect(html).toContain('★★★★★')` -> matches rarity stars
   - `expect(html).not.toContain('NaN')` -> guaranteed by safe fallbacks
   - `expect(html).not.toContain('undefined')` -> guaranteed by safe fallbacks
2. **Pips Pattern**:
   - Matches bracketed regex `/\[[●○★]+\]/`
   - 1 roll: `[●○○○○]`
   - 2 rolls: `[●●○○○]`
   - 3 rolls: `[●●●○○]`
   - 4 rolls: `[●●●●○]`
   - 5 rolls: `[●●●●●]`
   - 6 rolls: `[●●●●●★]`
3. **Quality Badge Format**:
   - `{badge} ({cv.toFixed(1)} CV)` rendered cleanly in badge element.
4. **Zero-Touch R5 Boundary**:
   - `src/app/page.tsx` remains 100% untouched.
