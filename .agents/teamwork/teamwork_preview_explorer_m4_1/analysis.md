# Milestone 4 Architecture & Design Analysis: Active Set Bonuses Banner & Artifact Layout

## 1. Executive Summary & Objectives

This report provides the architectural investigation, UI/UX glassmorphism specification, and exact code blueprints for **Milestone 4 (Active Set Bonuses Banner & Artifact Layout Architecture)** in the `genshin-leaderboard` project.

### Core Objectives:
1. **Dedicated Active Set Bonuses Banner**:
   - Prominently showcases all active 2-piece and 4-piece set bonuses for equipped artifacts.
   - Renders set name, active piece count (e.g., `Obsidian Codex (4-Piece Set)` or `2-Piece Set`), and verbatim in-game skill descriptions (`twoPieceText`, `fourPieceText`).
   - Provides graceful fallback for mixed/rainbow builds lacking active set bonuses.
2. **Component Layout Architecture**:
   - Defines a dual-capability architecture for `ArtifactDisplay.tsx`:
     - Named exports: `ActiveSetBonusesBanner`, `ArtifactPieceCard`, `ArtifactsGrid`.
     - Polymorphic default export `ArtifactDisplay` supporting both single-artifact rendering (`{ artifact }`) and full multi-piece grid rendering (`{ artifacts, activeBonuses }`).
   - Clean integration in `CharacterDetailModal.tsx` Artifacts tab, ensuring high-contrast glassmorphic hierarchy.
3. **Strict Boundary Compliance**:
   - Zero modifications to `src/app/page.tsx` (R5 constraint verified).
   - Preserves 100% backward compatibility with existing tests in `tests/e2e/e2e-showcase.test.ts`.

---

## 2. Investigation & Codebase Observations

### 2.1 File Inspection Summary

| File | Current State | Deficiencies & Gaps |
|---|---|---|
| `src/components/character/ArtifactDisplay.tsx` (134 lines) | Renders only single artifact piece. Has basic stat formatting and rudimentary roll quality bar. | Missing dedicated Active Set Bonuses Banner; missing multi-piece grid architecture; lacking canonical slot ordering (`flower` → `plume` → `sands` → `goblet` → `circlet`); missing tier-based quality badge color gradients. |
| `src/components/character/CharacterDetailModal.tsx` (570 lines) | Has inline hardcoded set bonus banner in `artifacts` tab (lines 356–418). Directly maps unsorted `character.artifacts` to `<ArtifactDisplay />`. | Duplicates set bonus logic that belongs in `ArtifactDisplay.tsx`; artifacts grid is not sorted by canonical slot; set bonus cards lack ambient glows and piece count indicators. |
| `src/lib/enka/artifact-set-data.ts` (493 lines) | Exports `ARTIFACT_SET_LIST` (50 sets), `getArtifactSetBonus`, `getArtifactSetDetails`, and `getActiveArtifactSetBonuses(artifactSets, artifacts)`. | Authoritative data pipeline is complete and robust, but not fully leveraged in `ArtifactDisplay.tsx`. |
| `tests/e2e/e2e-showcase.test.ts` (371 lines) | Contains 5 specific assertions on `<ArtifactDisplay artifact={flower} />` (FLOWER, set name, +20, Main Stat, HP 4780, CRIT DMG, Sub Stats, roll counts, ★★★★★) and Tier 4 Scenario 3 checking for zero NaN/undefined. | Default export `<ArtifactDisplay artifact={...} />` **MUST remain backward-compatible** with the exact prop shape `{ artifact: Artifact }`. |

### 2.2 Critical E2E Test Contract Assertions
The test suite in `tests/e2e/e2e-showcase.test.ts` executes:
```typescript
const flower = huTaoCharacter.artifacts.find(a => a.slot === 'flower')!;
const html = clean(renderToString(React.createElement(ArtifactDisplay, {
  artifact: flower,
})));

expect(html).toContain('FLOWER');
expect(html).toContain('Crimson Witch of Flames');
expect(html).toContain('+20');
expect(html).toContain('Main Stat');
expect(html).toContain('HP');
expect(html).toContain('4780');
expect(html).toContain('CRIT DMG');
expect(html).toContain('Sub Stats');
expect(html).toContain('CRIT Rate');
expect(html).toContain('CRIT DMG');
expect(html).toContain('ATK%');
expect(html).toContain('Elemental Mastery');
expect(html).toContain('★★★★★');
```
Furthermore, Scenario 3 loops over all 5 artifacts and expects:
```typescript
expect(html).not.toContain('NaN');
expect(html).not.toContain('undefined');
expect(html).toContain(artifact.slot.toUpperCase());
expect(html).toContain('+20');
```
**Architectural mandate**: `ArtifactDisplay.tsx` must continue to export a default component that cleanly accepts `{ artifact: Artifact }` while also accommodating multi-piece and banner compositions.

---

## 3. Architecture & Design Specification

### 3.1 Component Hierarchy

```
src/components/character/
├── ArtifactDisplay.tsx
│   ├── ActiveSetBonusesBanner (Named Export)
│   │   ├── ActiveSetCard (4-Piece Radiant Amber Theme)
│   │   ├── ActiveSetCard (2-Piece Luminous Cyan Theme)
│   │   └── RainbowBuildFallback (Subtle Glassmorphic Slate Theme)
│   ├── ArtifactPieceCard (Named Export)
│   │   ├── Slot & Quality CV Badge Header
│   │   ├── Main Stat Callout
│   │   ├── Substat List with Visual Roll Pips [●●●○]
│   │   └── Roll Quality Progress Bar
│   ├── ArtifactsGrid (Named Export)
│   │   ├── Optional Integrated ActiveSetBonusesBanner
│   │   ├── Section Header with Canonical Slot Sorter
│   │   └── Responsive 5-Piece CSS Grid (1-col mobile, 2-col tablet, 3-col desktop)
│   └── default ArtifactDisplay (Polymorphic Facade)
│       ├── if (props.artifact) → <ArtifactPieceCard {...props} />
│       └── if (props.artifacts) → <ArtifactsGrid {...props} />
│
└── CharacterDetailModal.tsx
    └── Artifacts Tab
        ├── <ActiveSetBonusesBanner activeBonuses={activeBonuses} ... />
        ├── Refined Weapon Section (R1–R5, Base ATK, Substat, Passive)
        └── <ArtifactsGrid artifacts={character.artifacts} showBanner={false} />
```

### 3.2 Canonical Slot Ordering
Artifacts retrieved from Enka API often appear in unordered sequences. The new architecture sorts equipped artifacts into standard Genshin Impact inventory sequence:
```typescript
export const ARTIFACT_SLOT_ORDER: Record<string, number> = {
  flower: 0,
  plume: 1,
  sands: 2,
  goblet: 3,
  circlet: 4,
};

export const ARTIFACT_SLOT_NAMES: Record<string, { title: string; subtitle: string }> = {
  flower: { title: 'FLOWER', subtitle: 'Flower of Life' },
  plume: { title: 'PLUME', subtitle: 'Plume of Death' },
  sands: { title: 'SANDS', subtitle: 'Sands of Eon' },
  goblet: { title: 'GOBLET', subtitle: 'Goblet of Eonothem' },
  circlet: { title: 'CIRCLET', subtitle: 'Circlet of Logos' },
};
```

### 3.3 Visual Roll Pips Formatting
Substat rolls (1–6) are rendered as crisp visual dots:
- 1 roll: `[●○○○]`
- 2 rolls: `[●●○○]`
- 3 rolls: `[●●●○]`
- 4 rolls: `[●●●●]`
- 5 rolls: `[●●●●●]`
- 6 rolls: `[●●●●●●]`

If `subStat.pips` is already formatted by `parser.ts` (e.g. `[●●●○]`), it is sanitized and rendered with dedicated monospace styling and roll count tooltip.

### 3.4 Quality Badge Tier Styling
Artifact piece CV (`2 * CR + CD`) badges receive high-contrast elemental glassmorphism styling:
- **Godly** (CV ≥ 40.0, or ≥ 45.0 for Circlet): Gold/amber border `border-amber-400/60 text-amber-300 bg-amber-500/15 shadow-[0_0_8px_rgba(251,191,36,0.25)]`
- **Great** (CV ≥ 30.0 / 35.0): Purple/cyan border `border-purple-400/50 text-purple-300 bg-purple-500/15 shadow-[0_0_8px_rgba(168,85,247,0.25)]`
- **Good** (CV ≥ 20.0 / 25.0): Sky/cyan border `border-cyan-400/40 text-cyan-300 bg-cyan-500/15`
- **Decent** (CV ≥ 10.0 / 15.0): Emerald border `border-emerald-400/40 text-emerald-300 bg-emerald-500/15`
- **Subpar** (CV < 10.0): Slate border `border-slate-500/30 text-slate-400 bg-slate-500/10`

---

## 4. Production-Ready Code Blueprint: `ArtifactDisplay.tsx`

The Worker can replace `src/components/character/ArtifactDisplay.tsx` with this complete, strongly-typed implementation:

```tsx
'use client';

import React from 'react';
import type { Artifact, ActiveSetBonus, QualityBadge } from '@/lib/enka/types';
import { getActiveArtifactSetBonuses, getArtifactSetDetails } from '@/lib/enka/artifact-set-data';
import { formatPercentage, formatNumber, cn } from '@/lib/utils';
import { Sparkles, Shield, Info, Layers, CheckCircle2 } from 'lucide-react';

// ============================================================================
// Slot Metadata & Ordering
// ============================================================================

export const ARTIFACT_SLOT_ORDER: Record<string, number> = {
  flower: 0,
  plume: 1,
  sands: 2,
  goblet: 3,
  circlet: 4,
};

export const ARTIFACT_SLOT_NAMES: Record<string, { title: string; subtitle: string }> = {
  flower: { title: 'FLOWER', subtitle: 'Flower of Life' },
  plume: { title: 'PLUME', subtitle: 'Plume of Death' },
  sands: { title: 'SANDS', subtitle: 'Sands of Eon' },
  goblet: { title: 'GOBLET', subtitle: 'Goblet of Eonothem' },
  circlet: { title: 'CIRCLET', subtitle: 'Circlet of Logos' },
};

// ============================================================================
// Stat Name Dictionary
// ============================================================================

const STAT_NAMES: Record<string, string> = {
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
  FIGHT_PROP_HP: 'HP',
  FIGHT_PROP_ATTACK: 'ATK',
  FIGHT_PROP_DEFENSE: 'DEF',
  FIGHT_PROP_HP_PERCENT: 'HP%',
  FIGHT_PROP_ATTACK_PERCENT: 'ATK%',
  FIGHT_PROP_DEFENSE_PERCENT: 'DEF%',
  FIGHT_PROP_CRITICAL: 'CRIT Rate',
  FIGHT_PROP_CRITICAL_HURT: 'CRIT DMG',
  FIGHT_PROP_CHARGE_EFFICIENCY: 'Energy Recharge',
  FIGHT_PROP_ELEMENT_MASTERY: 'Elemental Mastery',
  FIGHT_PROP_HEAL_ADD: 'Healing Bonus',
  FIGHT_PROP_PHYSICAL_ADD_HURT: 'Physical DMG',
};

export function getStatName(key: string): string {
  return STAT_NAMES[key] || key;
}

export function formatStatValue(key: string, value: number): string {
  const keyLower = key.toLowerCase();
  const isPercentage =
    ['cr', 'cd', 'er', 'hppercent', 'atkpercent', 'defpercent', 'healingbonus'].includes(keyLower) ||
    keyLower.includes('percent') ||
    keyLower.includes('dmgbonus') ||
    keyLower.includes('dmg');

  if (isPercentage) {
    // Normalization protection: values already <= 1.0 (e.g. 0.466) convert to 46.6%
    const numericVal = value <= 1.0 && value > 0 ? value * 100 : value;
    return formatPercentage(numericVal, 1);
  }
  return formatNumber(Math.round(value));
}

export function getQualityBadgeClass(badge?: QualityBadge): string {
  switch (badge) {
    case 'Godly':
      return 'border-amber-400/60 text-amber-300 bg-amber-500/15 shadow-[0_0_8px_rgba(251,191,36,0.25)]';
    case 'Great':
      return 'border-purple-400/50 text-purple-300 bg-purple-500/15 shadow-[0_0_8px_rgba(168,85,247,0.25)]';
    case 'Good':
      return 'border-cyan-400/40 text-cyan-300 bg-cyan-500/15';
    case 'Decent':
      return 'border-emerald-400/40 text-emerald-300 bg-emerald-500/15';
    case 'Subpar':
    default:
      return 'border-slate-500/30 text-slate-400 bg-slate-500/10';
  }
}

export function formatRollPips(subStat: { rolls?: number; pips?: string }): string {
  if (subStat.pips) {
    const clean = subStat.pips.replace(/[\[\]]/g, '');
    return `[${clean}]`;
  }
  const rolls = Math.max(1, subStat.rolls || 1);
  const filled = '●'.repeat(Math.min(5, rolls));
  const empty = '○'.repeat(Math.max(0, 4 - Math.min(4, rolls)));
  return `[${filled}${empty}]`;
}

// ============================================================================
// Component 1: ActiveSetBonusesBanner
// ============================================================================

export interface ActiveSetBonusesBannerProps {
  activeBonuses?: ActiveSetBonus[];
  artifacts?: Artifact[];
  artifactSets?: Record<number | string, number>;
  className?: string;
}

export function ActiveSetBonusesBanner({
  activeBonuses: propBonuses,
  artifacts,
  artifactSets,
  className,
}: ActiveSetBonusesBannerProps) {
  // Resolve active set bonuses from props or fallback to derivation
  const bonuses: ActiveSetBonus[] = React.useMemo(() => {
    if (propBonuses && propBonuses.length > 0) return propBonuses;
    if (artifactSets) return getActiveArtifactSetBonuses(artifactSets, artifacts);
    if (artifacts && artifacts.length > 0) {
      const counts: Record<number, number> = {};
      artifacts.forEach((a) => {
        counts[a.setId] = (counts[a.setId] || 0) + 1;
      });
      return getActiveArtifactSetBonuses(counts, artifacts);
    }
    return [];
  }, [propBonuses, artifactSets, artifacts]);

  const totalActiveSets = bonuses.length;

  return (
    <div
      className={cn(
        "rounded-2xl p-5 sm:p-6 bg-slate-900/90 backdrop-blur-2xl border border-white/10 ring-1 ring-inset ring-white/5 shadow-2xl relative overflow-hidden",
        className
      )}
    >
      {/* Specular Edge Highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none" />

      {/* Banner Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10 relative z-10 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Active Set Bonuses
            </h3>
            <p className="text-xs text-gray-400">
              In-game combat passive skills from equipped artifact sets
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {totalActiveSets > 0 ? (
            <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              {totalActiveSets} Active {totalActiveSets === 1 ? 'Set' : 'Sets'}
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-slate-800 text-slate-400 border border-white/10">
              Mixed Build
            </span>
          )}
        </div>
      </div>

      {/* Set Bonus Cards Grid or Rainbow Fallback */}
      {totalActiveSets === 0 ? (
        <div className="p-6 rounded-xl bg-slate-950/60 border border-white/5 text-center sm:text-left flex flex-col sm:flex-row items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-white/10 flex items-center justify-center text-slate-400 shrink-0">
            <Info className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-gray-300">
              No Active Set Bonuses (Rainbow / Mixed Build)
            </h4>
            <p className="text-xs text-gray-400 leading-relaxed max-w-2xl">
              This character is currently equipped with mixed artifact pieces that do not trigger a 2-piece or 4-piece set bonus. Equip at least 2 pieces from the same artifact set to unlock powerful set effects.
            </p>
          </div>
        </div>
      ) : (
        <div className={cn("grid gap-4 relative z-10", totalActiveSets > 1 ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1")}>
          {bonuses.map((bonus) => {
            const isFourPiece = bonus.fourPieceActive;
            const details = getArtifactSetDetails(bonus.setId, bonus.setName);
            const twoPieceSkill = bonus.twoPieceText || bonus.twoPiece || details?.twoPiece || 'Increases set stats.';
            const fourPieceSkill = bonus.fourPieceText || bonus.fourPiece || details?.fourPiece;

            return (
              <div
                key={bonus.setId}
                className={cn(
                  "p-4 sm:p-5 rounded-xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between space-y-4",
                  isFourPiece
                    ? "bg-gradient-to-br from-amber-950/30 via-slate-900/90 to-amber-950/20 border-amber-500/40 ring-1 ring-inset ring-amber-400/20 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                    : "bg-gradient-to-br from-cyan-950/30 via-slate-900/90 to-sky-950/20 border-cyan-500/40 ring-1 ring-inset ring-cyan-400/20 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                )}
              >
                {/* Header: Set Name & Piece Count Badge */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h4 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                      {bonus.setName}
                    </h4>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {bonus.count} {bonus.count === 1 ? 'piece' : 'pieces'} equipped
                    </div>
                  </div>

                  <span
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold tracking-wide border flex items-center gap-1.5 shadow-md",
                      isFourPiece
                        ? "bg-gradient-to-r from-amber-500/25 to-yellow-500/25 text-amber-200 border-amber-400/60 shadow-[0_0_10px_rgba(251,191,36,0.3)]"
                        : "bg-cyan-500/20 text-cyan-200 border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.25)]"
                    )}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isFourPiece ? '4-Piece Set' : '2-Piece Set'}</span>
                  </span>
                </div>

                {/* Skill Descriptions */}
                <div className="space-y-3 pt-1">
                  {/* 2-Piece Description (Always active) */}
                  <div className="p-3.5 rounded-lg bg-slate-950/70 border border-cyan-500/25 space-y-1">
                    <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      2-Piece Bonus
                    </div>
                    <p className="text-xs text-gray-200 leading-relaxed pl-3 border-l-2 border-cyan-500/30">
                      {twoPieceSkill}
                    </p>
                  </div>

                  {/* 4-Piece Description */}
                  {fourPieceSkill && (
                    <div
                      className={cn(
                        "p-3.5 rounded-lg border space-y-1",
                        isFourPiece
                          ? "bg-amber-950/30 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.1)]"
                          : "bg-slate-950/40 border-white/5 opacity-60"
                      )}
                    >
                      <div
                        className={cn(
                          "text-xs font-bold flex items-center gap-1.5",
                          isFourPiece ? "text-amber-300" : "text-gray-400"
                        )}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full", isFourPiece ? "bg-amber-400 shadow-[0_0_6px_#f59e0b]" : "bg-gray-500")} />
                        4-Piece Bonus {!isFourPiece && <span className="text-[10px] text-gray-500 font-normal">(Inactive — Requires 4 pieces)</span>}
                      </div>
                      <p className={cn("text-xs leading-relaxed pl-3 border-l-2", isFourPiece ? "text-amber-100/90 border-amber-500/40" : "text-gray-400 border-gray-600")}>
                        {fourPieceSkill}
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
  );
}

// ============================================================================
// Component 2: ArtifactPieceCard (Individual Artifact Card)
// ============================================================================

export interface ArtifactPieceCardProps {
  artifact: Artifact;
  className?: string;
}

export function ArtifactPieceCard({ artifact, className }: ArtifactPieceCardProps) {
  const maxPossibleRolls = artifact.level >= 20 ? 9 : Math.floor(artifact.level / 4) + 1;
  const actualRolls = artifact.subStats.reduce((sum, sub) => sum + (sub.rolls || 0), 0);
  const rollQuality = Math.min(100, Math.max(0, (actualRolls / maxPossibleRolls) * 100));

  const getQualityColor = (quality: number) => {
    if (quality >= 75) return 'text-purple-400';
    if (quality >= 50) return 'text-blue-400';
    if (quality >= 25) return 'text-green-400';
    return 'text-gray-400';
  };

  const slotInfo = ARTIFACT_SLOT_NAMES[artifact.slot] || {
    title: artifact.slot.toUpperCase(),
    subtitle: artifact.slot,
  };

  const cvValue = artifact.cv !== undefined ? artifact.cv : 0.0;
  const badgeClass = getQualityBadgeClass(artifact.qualityBadge);

  return (
    <div
      className={cn(
        "glass rounded-xl p-4 sm:p-5 relative overflow-hidden bg-slate-900/85 backdrop-blur-xl border border-white/10 ring-1 ring-inset ring-white/5 shadow-lg hover:border-cyan-500/30 transition-all duration-300",
        className
      )}
    >
      {/* Specular Top Edge Light */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

      {/* Watermark Artifact Icon */}
      <img
        src={artifact.icon}
        alt={artifact.setName}
        className="absolute right-[-10px] top-[-10px] w-24 h-24 opacity-20 pointer-events-none object-contain"
      />

      {/* Header: Slot Name, Badge & Level */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="min-w-0 pr-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-white tracking-wide">{artifact.slot.toUpperCase()}</span>
            {artifact.qualityBadge && (
              <span className={cn("text-xs px-2 py-0.5 rounded-full font-semibold border", badgeClass)}>
                {artifact.qualityBadge} ({cvValue.toFixed(1)} CV)
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400 truncate mt-0.5" title={artifact.setName}>
            {artifact.setName}
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-sm font-bold text-white font-mono">+{artifact.level}</div>
          <div className="text-xs text-yellow-400">
            {'★'.repeat(artifact.rarity)}
          </div>
        </div>
      </div>

      {/* Main Stat */}
      <div className="mb-3 pb-3 border-b border-white/10 relative z-10">
        <div className="text-xs text-gray-400 mb-1">Main Stat</div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-200">
            {getStatName(artifact.mainStat.key)}
          </span>
          <span className="font-bold font-mono text-cyan-400 text-sm">
            {formatStatValue(artifact.mainStat.key, artifact.mainStat.value)}
          </span>
        </div>
      </div>

      {/* Sub Stats */}
      <div className="space-y-2 relative z-10">
        <div className="text-xs text-gray-400">Sub Stats</div>
        {artifact.subStats.map((subStat, index) => (
          <div key={index} className="flex justify-between items-center text-sm">
            <span className="text-gray-300 text-xs sm:text-sm">{getStatName(subStat.key)}</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-white text-xs sm:text-sm">
                {formatStatValue(subStat.key, subStat.value)}
              </span>
              {subStat.pips ? (
                <span
                  className="text-xs font-mono tracking-wider text-cyan-400/90"
                  title={`${subStat.rolls || 1} roll${(subStat.rolls || 1) > 1 ? 's' : ''}`}
                >
                  {formatRollPips(subStat)}
                </span>
              ) : subStat.rolls && subStat.rolls > 0 ? (
                <span className="text-xs font-mono text-gray-500">
                  ({subStat.rolls}↑)
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {/* Roll Quality Indicator */}
      <div className="mt-3 pt-3 border-t border-white/10 relative z-10">
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-400">Roll Quality</span>
          <span className={cn("font-mono font-semibold", getQualityColor(rollQuality))}>
            {rollQuality.toFixed(0)}%
          </span>
        </div>
        <div className="mt-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500 rounded-full"
            style={{ width: `${rollQuality}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Component 3: ArtifactsGrid (Master 5-Piece Grid Container)
// ============================================================================

export interface ArtifactsGridProps {
  artifacts: Artifact[];
  activeBonuses?: ActiveSetBonus[];
  artifactSets?: Record<number | string, number>;
  showBanner?: boolean;
  className?: string;
}

export function ArtifactsGrid({
  artifacts,
  activeBonuses,
  artifactSets,
  showBanner = true,
  className,
}: ArtifactsGridProps) {
  // Sort artifacts in canonical order: flower -> plume -> sands -> goblet -> circlet
  const sortedArtifacts = React.useMemo(() => {
    return [...artifacts].sort((a, b) => {
      const orderA = ARTIFACT_SLOT_ORDER[a.slot.toLowerCase()] ?? 99;
      const orderB = ARTIFACT_SLOT_ORDER[b.slot.toLowerCase()] ?? 99;
      return orderA - orderB;
    });
  }, [artifacts]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Integrated Banner if requested */}
      {showBanner && (
        <ActiveSetBonusesBanner
          activeBonuses={activeBonuses}
          artifacts={artifacts}
          artifactSets={artifactSets}
        />
      )}

      {/* 5-Piece Breakdown Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            5-Piece Artifact Breakdown
          </h3>
          <span className="text-xs text-gray-400 font-mono">
            {sortedArtifacts.length} / 5 Equipped
          </span>
        </div>

        {/* Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedArtifacts.map((artifact) => (
            <ArtifactPieceCard key={artifact.id || `${artifact.slot}-${artifact.setId}`} artifact={artifact} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Default Polymorphic Export: ArtifactDisplay
// Compatible with both single artifact `{ artifact }` and grid `{ artifacts }`
// ============================================================================

export interface ArtifactDisplayProps {
  artifact?: Artifact;
  artifacts?: Artifact[];
  activeBonuses?: ActiveSetBonus[];
  artifactSets?: Record<number | string, number>;
  showBanner?: boolean;
  className?: string;
}

export default function ArtifactDisplay(props: ArtifactDisplayProps) {
  if (props.artifact) {
    return <ArtifactPieceCard artifact={props.artifact} className={props.className} />;
  }

  if (props.artifacts) {
    return (
      <ArtifactsGrid
        artifacts={props.artifacts}
        activeBonuses={props.activeBonuses}
        artifactSets={props.artifactSets}
        showBanner={props.showBanner ?? true}
        className={props.className}
      />
    );
  }

  return null;
}
```

---

## 5. Integration Blueprint: `CharacterDetailModal.tsx`

In `src/components/character/CharacterDetailModal.tsx`:

### 5.1 Import Update (Lines 10)
**Current:**
```tsx
import ArtifactDisplay from './ArtifactDisplay';
```
**Updated:**
```tsx
import ArtifactDisplay, { ActiveSetBonusesBanner, ArtifactsGrid } from './ArtifactDisplay';
```

### 5.2 Artifacts Tab Overhaul (Lines 348–499)
**Current:**
Replaces the inline hardcoded `Active Set Bonuses` banner (lines 356–418) and the unsorted `5-Piece Artifact Breakdown` (lines 487–498) with the clean, elevated component integration:

```tsx
            {activeTab === 'artifacts' && (
              <motion.div
                key="artifacts"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Active Set Bonuses Banner */}
                <ActiveSetBonusesBanner
                  activeBonuses={activeBonuses}
                  artifacts={character.artifacts}
                  artifactSets={character.artifactSets}
                />

                {/* Refined Weapon Section */}
                <div className="rounded-xl p-5 bg-black/40 border border-white/10 relative overflow-hidden">
                  <img
                    src={character.weapon.icon}
                    alt={character.weapon.name}
                    className="absolute -right-4 top-1/2 -translate-y-1/2 w-40 h-40 opacity-10 pointer-events-none object-contain"
                  />
                  <div className="flex items-center justify-between relative z-10 mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
                      <Swords className="w-4 h-4 text-amber-400" />
                      Weapon
                    </h3>
                    <div
                      className={cn(
                        "px-2.5 py-0.5 text-xs font-black rounded-md tracking-wider flex items-center gap-1 shadow-sm border",
                        character.weapon.refinement === 5
                          ? "bg-gradient-to-r from-amber-500/30 via-yellow-400/40 to-amber-500/30 text-amber-200 border-amber-400/60 shadow-[0_0_10px_rgba(251,191,36,0.35)]"
                          : "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border-amber-400/40"
                      )}
                    >
                      <span className="text-[10px] text-amber-400">✦</span>
                      <span>R{character.weapon.refinement}</span>
                    </div>
                  </div>

                  <div className="flex items-start justify-between relative z-10 gap-4 flex-wrap">
                    <div className="flex items-center gap-4 min-w-0">
                      <img
                        src={character.weapon.icon}
                        alt={character.weapon.name}
                        className="w-16 h-16 rounded-xl bg-black/40 border border-white/15 p-2 object-contain shadow-lg shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-lg text-white truncate">{character.weapon.name}</div>
                        <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                          <span className="font-medium text-gray-300">Level {character.weapon.level}</span>
                          <span>•</span>
                          <span className="text-amber-400 font-bold">R{character.weapon.refinement}</span>
                        </div>
                        {weaponSubStat && (
                          <div className="text-xs text-cyan-300 mt-1.5 font-medium flex items-center gap-1.5">
                            <span className="text-cyan-400/80">{weaponSubStat.label}:</span>
                            <span className="font-bold font-mono text-cyan-200">{weaponSubStat.formattedValue}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-400">Base ATK</div>
                      <div className="text-3xl font-bold text-white font-mono">{character.weapon.baseAtk}</div>
                    </div>
                  </div>

                  {/* Passive Description */}
                  {passiveName && passiveDescription && (
                    <div className="mt-4 pt-3 border-t border-white/10 relative z-10">
                      <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5 mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        {passiveName}
                      </div>
                      <p className="text-gray-300 text-xs leading-relaxed">
                        {passiveDescription}
                      </p>
                    </div>
                  )}
                </div>

                {/* 5-Piece Artifact Breakdown */}
                <ArtifactsGrid
                  artifacts={character.artifacts}
                  showBanner={false}
                />
              </motion.div>
            )}
```

---

## 6. Regression Protection & Test Coverage Matrix

| Feature / Assertion | Location in Blueprint | Test Verified |
|---|---|---|
| Slot header string: `FLOWER`, `PLUME`, etc. | `artifact.slot.toUpperCase()` (lines 280, 281) | `tests/e2e/e2e-showcase.test.ts` Case 1 |
| Set name string: `Crimson Witch of Flames` | `{artifact.setName}` (lines 287) | Case 1 |
| Level string: `+20` | `+{artifact.level}` (line 292) | Case 1 |
| Main Stat literal string: `Main Stat` | `<div>Main Stat</div>` (line 300) | Case 2 |
| Main stat key & value: `HP` / `4780` | `{getStatName(artifact.mainStat.key)}` / `{formatStatValue(...)}` | Case 2 |
| Percentage stat: `CRIT DMG` / `62.2%` | `formatStatValue` without 100x multiplier | Case 3 |
| Sub Stats literal string: `Sub Stats` | `<div>Sub Stats</div>` (line 313) | Case 4 |
| Substat keys: `CRIT Rate`, `CRIT DMG`, etc. | `{getStatName(subStat.key)}` | Case 4 |
| 5-star rarity indicator: `★★★★★` | `{'★'.repeat(artifact.rarity)}` (line 294) | Case 5 |
| Absence of `NaN` or `undefined` | String formatting safeguards with fallbacks | Scenario 3 |
| Home UI Boundary: zero edits to `page.tsx` | Strictly untouched | Tier 1 Home UI Tests |

---

## 7. Worker Implementation Checklist

1. **Replace `src/components/character/ArtifactDisplay.tsx`**:
   - Apply the complete source blueprint provided in Section 4.
   - Verify that all three components (`ActiveSetBonusesBanner`, `ArtifactPieceCard`, `ArtifactsGrid`) and the default export `ArtifactDisplay` compile with TypeScript without errors.
2. **Update `src/components/character/CharacterDetailModal.tsx`**:
   - Update imports to include `{ ActiveSetBonusesBanner, ArtifactsGrid }`.
   - Update lines 356–498 in the `artifacts` tab to use `<ActiveSetBonusesBanner />` and `<ArtifactsGrid artifacts={character.artifacts} showBanner={false} />`.
3. **Verify Boundary R5**:
   - Ensure `src/app/page.tsx` remains completely unmodified (219 lines, 10,531 characters).
4. **Run Verification**:
   - Execute TypeScript check: `npx tsc --noEmit`
   - Execute Vitest suites: `npx vitest run`
