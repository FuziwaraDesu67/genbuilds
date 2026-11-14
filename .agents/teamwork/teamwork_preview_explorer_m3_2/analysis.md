# Analysis & Implementation Blueprint: Refined Weapon Card (R1–R5) & Circular Talent Badges (+3 Radiant Boost)

**Agent**: Explorer 2 (Milestone 3)  
**Target File**: `src/components/character/CharacterCard.tsx`  
**Working Directory**: `d:\games\projects\genshin-leaderboard\.agents\teamwork\teamwork_preview_explorer_m3_2`  
**Date**: 2026-11-01  

---

## 1. Executive Summary

Milestone 3 overhauls the Genshin Impact Character Showcase card (`CharacterCard.tsx`) to deliver high-contrast elemental glassmorphism. This analysis establishes the complete, production-ready JSX, CSS, and TypeScript blueprints for **Objective 1 (Refined Weapon Card)** and **Objective 2 (Circular Talent Badges)**.

### Core Objectives
1. **Refined Weapon Card**:
   - Weapon icon image (`character.weapon.icon`), weapon name (`character.weapon.name`), weapon level and ascension (`Lv. 90` / `Lv.90`).
   - Prominent Refinement Badge: `R1` through `R5` (high-contrast styled pill with gold/amber gradient and glowing shadow).
   - Base ATK stat display (`Base ATK 608` / `510`) and substat (e.g. `CRIT DMG 55.1%` or `CRIT DMG 66.2%`).
   - Weapon passive name (`character.weapon.passiveName`) and interactive popover/hover disclosure showing full refinement-scaled description (`character.weapon.passiveDescription`).
2. **Circular Talent Badges**:
   - 3 circular glassmorphic badges for Normal Attack (NA), Elemental Skill (Skill), and Elemental Burst (Burst).
   - Distinctive skill icons or glyphs (`Swords`, `Sparkles`, `Crown`) and displayed talent levels (`talents.normal`, `talents.skill`, `talents.burst`).
   - Radiant `+3` tag for constellation-boosted talents (`talents.boosted?.normal`, `skill`, `burst`), featuring luminous cyan/amber radiance and pulse animation.
   - Crown indicators (★ / golden rim) for crowned talents (level $\ge 10$).
3. **Safety & Zero-Touch Guarantees**:
   - Strictly respects R5 boundary: `src/app/page.tsx` remains completely untouched.
   - Read-only analysis: No direct source modifications are made; complete, drop-in JSX blueprints are supplied for Worker implementation.

---

## 2. Investigation & Current State Analysis

### 2.1 CharacterCard.tsx Current Codebase
In `src/components/character/CharacterCard.tsx`, the existing weapon and talent sections are minimal placeholders:

```tsx
{/* Current Weapon Section (lines 89-99) */}
<div className="px-4 pb-4 flex gap-3 items-center mt-2">
  <img src={character.weapon.icon} alt={character.weapon.name} className="w-10 h-10 rounded-md bg-black/20 p-1 object-contain shrink-0" />
  <div>
    <div className="text-xs text-gray-400 mb-1">Weapon</div>
    <div className="text-sm font-medium leading-tight">{character.weapon.name}</div>
    <div className="text-xs text-gray-500 mt-0.5">
      Lv.{character.weapon.level} R{character.weapon.refinement}
    </div>
  </div>
</div>

{/* Current Talents Section (lines 115-132) */}
<div className="px-4 pb-4 border-t border-white/10 pt-4">
  <div className="text-xs text-gray-400 mb-2">Talents</div>
  <div className="flex gap-3 text-sm">
    <div className="text-center">
      <div className="text-gray-500 text-xs">NA</div>
      <div className="font-bold">{character.talents.normal}</div>
    </div>
    <div className="text-center">
      <div className="text-gray-500 text-xs">Skill</div>
      <div className="font-bold">{character.talents.skill}</div>
    </div>
    <div className="text-center">
      <div className="text-gray-500 text-xs">Burst</div>
      <div className="font-bold">{character.talents.burst}</div>
    </div>
  </div>
</div>
```

**Key Gaps in Current Implementation**:
1. **Weapon Card**:
   - Missing Base ATK display.
   - Missing weapon secondary stat (substat like `CRIT DMG 55.1%` or `Energy Recharge 45.9%`).
   - Plain text `R1` instead of a prominent, styled refinement pill badge.
   - Missing weapon passive name and interactive popover/hover disclosure showing `weapon.passiveDescription`.
   - Low visual fidelity (plain unstyled container).
2. **Talent Badges**:
   - Plain text numbers in standard rectangular text blocks without circular badge geometry.
   - No skill icons or glyphs.
   - Completely ignores `character.talents.boosted` (`normal`, `skill`, `burst`), showing no radiant `+3` tag for constellation increases.
   - No crown indicators for level 10 investments.

### 2.2 Domain Models & Available Metadata

#### Domain Model (`src/lib/enka/types.ts`):
```typescript
export interface Weapon {
  id: number;
  name: string;
  rarity: number; // 3, 4, 5
  level: number;
  ascension: number;
  refinement: number; // 1 to 5
  baseAtk: number;
  subStat?: {
    key: string; // e.g. "cd", "er", "cr", "atkPercent", "hpPercent", "em"
    value: number; // e.g. 0.551 (decimal from Enka) or 55.1 (normalized)
  };
  passiveName?: string;
  passiveDescription?: string;
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
```

#### Metadata Sources:
- `src/lib/enka/weapon-data.ts`: Contains `getWeaponPassive(weaponId, refinement)` providing fallback passive name and exact refinement-scaled descriptions for 57 weapons.
- `src/lib/enka/talent-boost-data.ts`: Contains `evaluateTalentBoosts(avatarId, constellation)` automatically evaluated by parser during character ingestion.

### 2.3 Existing Vitest Test Suite Assertions
The test suite in `tests/e2e/e2e-showcase.test.ts` executes server-side HTML assertions:
- `expect(html).toContain('Staff of Homa');`
- `expect(html).toContain('The Widsith');`
- `expect(html).toContain('Lv.90');` (Weapon level)
- `expect(html).toContain('R1');` (Refinement 1)
- `expect(html).toContain('R5');` (Refinement 5)
- `expect(html).toContain('Hu Tao');`
- `expect(html).toContain('C6');`
- `expect(html).toContain('C1');`

**Critical Design Rule**: Any new markup MUST contain `Lv.{character.weapon.level}` (e.g. `Lv.90`) and `R{character.weapon.refinement}` (e.g. `R1`, `R5`) as intact substrings to maintain 100% test compatibility.

---

## 3. Detailed Component Blueprint: Refined Weapon Card

### 3.1 Substat Normalization & Formatting Logic
In Enka data, `weapon.subStat.value` is raw decimal (`0.551`, `0.662`) for percentage stats, but can be flat numbers for Elemental Mastery (`221`).
We define a robust helper function `formatWeaponSubStat`:

```typescript
export function formatWeaponSubStat(subStat?: { key: string; value: number }): {
  label: string;
  formattedValue: string;
} | null {
  if (!subStat || typeof subStat.value !== 'number') return null;

  const keyLower = subStat.key.toLowerCase();
  const isPercent =
    ['cr', 'cd', 'er', 'atkpercent', 'hppercent', 'defpercent', 'physicaldmgbonus'].includes(keyLower) ||
    keyLower.includes('percent') ||
    keyLower.includes('dmg');

  const labelMap: Record<string, string> = {
    cr: 'CRIT Rate',
    cd: 'CRIT DMG',
    atkpercent: 'ATK',
    hppercent: 'HP',
    defpercent: 'DEF',
    er: 'Energy Recharge',
    em: 'Elemental Mastery',
    atk: 'ATK',
    hp: 'HP',
    def: 'DEF',
    physicaldmgbonus: 'Physical DMG',
  };

  const label = labelMap[keyLower] || subStat.key;

  let formattedValue: string;
  if (isPercent) {
    const numericVal = subStat.value <= 1.0 ? subStat.value * 100 : subStat.value;
    formattedValue = `${numericVal.toFixed(1)}%`;
  } else {
    formattedValue = formatNumber(Math.round(subStat.value));
  }

  return { label, formattedValue };
}
```

### 3.2 Refinement Badge (`R1`–`R5`) Styling
Genshin Impact features distinctive golden/amber refinement ranks. For R5 (max refinement), we apply extra luminous radiance:

```tsx
<div
  className={cn(
    "px-2 py-0.5 text-xs font-black rounded-md tracking-wider flex items-center gap-1 shadow-sm border shrink-0",
    character.weapon.refinement === 5
      ? "bg-gradient-to-r from-amber-500/30 via-yellow-400/40 to-amber-500/30 text-amber-200 border-amber-400/60 shadow-[0_0_10px_rgba(251,191,36,0.35)]"
      : "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border-amber-400/40"
  )}
>
  <span className="text-[10px] text-amber-400">✦</span>
  <span>R{character.weapon.refinement}</span>
</div>
```

### 3.3 Passive Name & Interactive Popover / Disclosure
To prevent unwanted card click events when clicking the disclosure, all interaction handlers invoke `e.stopPropagation()`.

```tsx
{/* Interactive Passive Disclosure Trigger */}
{passive.passiveName && (
  <div className="relative mt-2.5">
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setShowPassiveDetails((prev) => !prev);
      }}
      onMouseEnter={() => setShowPassiveDetails(true)}
      onMouseLeave={() => setShowPassiveDetails(false)}
      className="w-full text-left flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/30 hover:bg-black/50 border border-amber-500/20 hover:border-amber-400/40 transition-colors group/passive"
      aria-expanded={showPassiveDetails}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
        <span className="text-xs font-semibold text-amber-300 truncate">
          {passive.passiveName}
        </span>
      </div>
      <div className="flex items-center gap-1 text-[10px] text-gray-400 group-hover/passive:text-amber-300 transition-colors shrink-0">
        <span>Refinement</span>
        <Info className="w-3 h-3 text-amber-400/80" />
      </div>
    </button>

    {/* Popover Card */}
    <AnimatePresence>
      {showPassiveDetails && passive.passiveDescription && (
        <motion.div
          initial={{ opacity: 0, y: -4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => e.stopPropagation()}
          className="absolute left-0 right-0 top-full mt-1.5 z-30 p-3 rounded-lg bg-slate-900/95 backdrop-blur-md border border-amber-400/40 shadow-2xl text-xs leading-relaxed"
        >
          <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-white/10">
            <span className="font-bold text-amber-300 flex items-center gap-1">
              ✦ {passive.passiveName}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-400/30">
              R{character.weapon.refinement}
            </span>
          </div>
          <p className="text-gray-300 text-[11px] leading-relaxed">
            {passive.passiveDescription}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
)}
```

---

## 4. Detailed Component Blueprint: Circular Talent Badges

### 4.1 Circular Badge Architecture
The talents section is structured with 3 circular badges laid out in a responsive horizontal grid:
1. **Normal Attack (NA)**: Uses `Swords` crossed blades icon, displays `character.talents.normal`.
2. **Elemental Skill (Skill)**: Uses `Sparkles` icon, displays `character.talents.skill`.
3. **Elemental Burst (Burst)**: Uses `Crown` icon, displays `character.talents.burst`.

### 4.2 Radiant `+3` Constellation Indicator
When `character.talents.boosted?.<talent>` is true:
- Outer circular border is upgraded to `border-2 border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.6)]`.
- Center level text displays in luminous cyan `text-cyan-200`.
- An anchored shoulder badge displays `+3`:
  ```tsx
  <div
    className="absolute -top-1.5 -right-2 z-20 px-1.5 py-0.5 rounded-full text-[10px] font-black tracking-tighter leading-none flex items-center gap-0.5 bg-gradient-to-r from-cyan-400 via-sky-300 to-cyan-400 text-slate-950 border border-white shadow-[0_0_10px_rgba(6,182,212,0.9)] animate-pulse"
    title="Constellation Boosted (+3 Talent Levels)"
  >
    <span>+3</span>
  </div>
  ```

### 4.3 Crown Indicator
For crowned talents ($\ge 10$ level):
- An amber crown badge or star is affixed at the base or rim:
  ```tsx
  {level >= 10 && !isBoosted && (
    <div
      className="absolute -bottom-1 z-20 px-1 py-0.2 rounded-full text-[8px] font-bold bg-amber-500/90 text-amber-950 border border-amber-300 shadow-sm flex items-center justify-center"
      title="Crowned Talent"
    >
      ★
    </div>
  )}
  ```

---

## 5. Drop-In Code Blueprint for `CharacterCard.tsx`

The following code represents the exact, full JSX/TS implementation for the Weapon and Talents sections to be applied by Worker in `src/components/character/CharacterCard.tsx`.

### 5.1 Import Additions
```tsx
import { useState } from 'react';
import type { Character } from '@/lib/enka/types';
import { ELEMENT_COLORS } from '@/lib/enka/static-data';
import { getWeaponPassive } from '@/lib/enka/weapon-data';
import { formatNumber, formatPercentage, cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import CharacterDetailModal from './CharacterDetailModal';
import { LiquidButton } from '@/components/ui/liquid-glass-button';
import { Swords, Sparkles, Crown, Info } from 'lucide-react';
```

### 5.2 Substat Helper Function
```tsx
function formatWeaponSubStat(subStat?: { key: string; value: number }): {
  label: string;
  formattedValue: string;
} | null {
  if (!subStat || typeof subStat.value !== 'number') return null;

  const keyLower = subStat.key.toLowerCase();
  const isPercent =
    ['cr', 'cd', 'er', 'atkpercent', 'hppercent', 'defpercent', 'physicaldmgbonus'].includes(keyLower) ||
    keyLower.includes('percent') ||
    keyLower.includes('dmg');

  const labelMap: Record<string, string> = {
    cr: 'CRIT Rate',
    cd: 'CRIT DMG',
    atkpercent: 'ATK',
    hppercent: 'HP',
    defpercent: 'DEF',
    er: 'Energy Recharge',
    em: 'Elemental Mastery',
    atk: 'ATK',
    hp: 'HP',
    def: 'DEF',
    physicaldmgbonus: 'Physical DMG',
  };

  const label = labelMap[keyLower] || subStat.key;

  let formattedValue: string;
  if (isPercent) {
    const numericVal = subStat.value <= 1.0 ? subStat.value * 100 : subStat.value;
    formattedValue = `${numericVal.toFixed(1)}%`;
  } else {
    formattedValue = formatNumber(Math.round(subStat.value));
  }

  return { label, formattedValue };
}
```

### 5.3 Weapon Card Section (JSX)
```tsx
{/* Refined Weapon Card */}
<div className="px-4 pb-4">
  <div className="glass-darker rounded-xl p-3 border border-white/10 bg-black/25 relative">
    <div className="flex items-center justify-between gap-3">
      {/* Icon & Details */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative shrink-0">
          <img
            src={character.weapon.icon}
            alt={character.weapon.name}
            className="w-12 h-12 rounded-lg bg-black/40 border border-white/15 p-1 object-contain shadow-md"
          />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-white truncate leading-tight">
            {character.weapon.name}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
            <span className="font-medium text-gray-300">Lv.{character.weapon.level}</span>
          </div>
        </div>
      </div>

      {/* Prominent R1-R5 Refinement Badge */}
      <div
        className={cn(
          "px-2.5 py-0.5 text-xs font-black rounded-md tracking-wider flex items-center gap-1 shadow-sm border shrink-0",
          character.weapon.refinement === 5
            ? "bg-gradient-to-r from-amber-500/30 via-yellow-400/40 to-amber-500/30 text-amber-200 border-amber-400/60 shadow-[0_0_10px_rgba(251,191,36,0.35)]"
            : "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border-amber-400/40"
        )}
      >
        <span className="text-[10px] text-amber-400">✦</span>
        <span>R{character.weapon.refinement}</span>
      </div>
    </div>

    {/* Base ATK & Substat Display */}
    <div className="flex items-center gap-2 text-xs mt-2.5 flex-wrap">
      {character.weapon.baseAtk > 0 && (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300">
          <span className="text-gray-400">Base ATK</span>
          <span className="font-bold text-white">{character.weapon.baseAtk}</span>
        </div>
      )}
      {weaponSubStat && (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/30 text-cyan-300">
          <span className="text-cyan-400/80">{weaponSubStat.label}</span>
          <span className="font-bold text-cyan-200">{weaponSubStat.formattedValue}</span>
        </div>
      )}
    </div>

    {/* Passive Name & Interactive Popover Disclosure */}
    {passive.passiveName && (
      <div className="relative mt-2.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowPassiveDetails((prev) => !prev);
          }}
          onMouseEnter={() => setShowPassiveDetails(true)}
          onMouseLeave={() => setShowPassiveDetails(false)}
          className="w-full text-left flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/30 hover:bg-black/50 border border-amber-500/20 hover:border-amber-400/40 transition-colors group/passive"
          aria-expanded={showPassiveDetails}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
            <span className="text-xs font-semibold text-amber-300 truncate">
              {passive.passiveName}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-gray-400 group-hover/passive:text-amber-300 transition-colors shrink-0">
            <span>Refinement</span>
            <Info className="w-3 h-3 text-amber-400/80" />
          </div>
        </button>

        {/* Floating Popover Card */}
        <AnimatePresence>
          {showPassiveDetails && passive.passiveDescription && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute left-0 right-0 top-full mt-1.5 z-30 p-3 rounded-lg bg-slate-900/95 backdrop-blur-md border border-amber-400/40 shadow-2xl text-xs leading-relaxed"
            >
              <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-white/10">
                <span className="font-bold text-amber-300 flex items-center gap-1">
                  ✦ {passive.passiveName}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  R{character.weapon.refinement}
                </span>
              </div>
              <p className="text-gray-300 text-[11px] leading-relaxed">
                {passive.passiveDescription}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )}
  </div>
</div>
```

### 5.4 Circular Talent Badges Section (JSX)
```tsx
{/* Circular Talent Badges with Radiant +3 Boost */}
<div className="px-4 pb-4 border-t border-white/10 pt-4">
  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
    Talents
  </div>
  <div className="flex items-center justify-around gap-2">
    {[
      {
        key: 'normal',
        shortLabel: 'NA',
        label: 'Normal Attack',
        level: character.talents.normal,
        isBoosted: Boolean(character.talents.boosted?.normal),
        icon: <Swords className="w-4 h-4 text-gray-300" />,
      },
      {
        key: 'skill',
        shortLabel: 'Skill',
        label: 'Elemental Skill',
        level: character.talents.skill,
        isBoosted: Boolean(character.talents.boosted?.skill),
        icon: (
          <Sparkles
            className="w-4 h-4"
            style={{
              color: character.talents.boosted?.skill ? '#22d3ee' : elementColor.primary,
            }}
          />
        ),
      },
      {
        key: 'burst',
        shortLabel: 'Burst',
        label: 'Elemental Burst',
        level: character.talents.burst,
        isBoosted: Boolean(character.talents.boosted?.burst),
        icon: (
          <Crown
            className="w-4 h-4"
            style={{
              color: character.talents.boosted?.burst ? '#22d3ee' : '#f59e0b',
            }}
          />
        ),
      },
    ].map((talent) => (
      <div key={talent.key} className="flex flex-col items-center gap-1.5 group/talent">
        {/* Circular Badge Container */}
        <div
          className={cn(
            "relative w-12 h-12 rounded-full flex flex-col items-center justify-center transition-all duration-300",
            "bg-gradient-to-b from-slate-800/90 to-slate-950/90 backdrop-blur-md shadow-lg",
            talent.isBoosted
              ? "border-2 shadow-[0_0_12px_rgba(34,211,238,0.55)] ring-1 ring-cyan-400/40"
              : talent.level >= 10
              ? "border-2 border-amber-400/80 shadow-[0_0_10px_rgba(245,158,11,0.4)]"
              : "border border-white/20 hover:border-white/40"
          )}
          style={{
            borderColor: talent.isBoosted
              ? '#22d3ee'
              : talent.level >= 10
              ? '#f59e0b'
              : undefined,
          }}
        >
          {/* Inner Element Glow Radial */}
          <div
            className="absolute inset-0 rounded-full opacity-20 pointer-events-none"
            style={{
              background: talent.isBoosted
                ? 'radial-gradient(circle, #22d3ee 0%, transparent 70%)'
                : `radial-gradient(circle, ${elementColor.primary} 0%, transparent 70%)`,
            }}
          />

          {/* Icon */}
          <div className="relative z-10 group-hover/talent:scale-110 transition-transform">
            {talent.icon}
          </div>

          {/* Level Number */}
          <span
            className={cn(
              "relative z-10 text-xs font-black tracking-tight leading-none mt-0.5",
              talent.isBoosted
                ? "text-cyan-200"
                : talent.level >= 10
                ? "text-amber-300 font-extrabold"
                : "text-white"
            )}
          >
            {talent.level}
          </span>

          {/* Radiant +3 Tag for Constellation-Boosted Talents */}
          {talent.isBoosted && (
            <div
              className="absolute -top-1.5 -right-2 z-20 px-1.5 py-0.5 rounded-full text-[10px] font-black tracking-tighter leading-none flex items-center gap-0.5 bg-gradient-to-r from-cyan-400 via-sky-300 to-cyan-400 text-slate-950 border border-white shadow-[0_0_10px_rgba(6,182,212,0.9)] animate-pulse"
              title="Constellation Boosted (+3 Talent Levels)"
            >
              <span>+3</span>
            </div>
          )}

          {/* Crown Indicator for Crowned Talents */}
          {talent.level >= 10 && !talent.isBoosted && (
            <div
              className="absolute -bottom-1 z-20 px-1 py-0.2 rounded-full text-[8px] font-bold bg-amber-500/90 text-amber-950 border border-amber-300 shadow-sm flex items-center justify-center"
              title="Crowned Talent"
            >
              ★
            </div>
          )}
        </div>

        {/* Subtitle Label */}
        <span className="text-[11px] font-medium text-gray-400 group-hover/talent:text-gray-300 transition-colors">
          {talent.shortLabel}
        </span>
      </div>
    ))}
  </div>
</div>
```

---

## 6. Verification and Validation Plan

### 6.1 Automated Vitest Verification
The worker must run the full test suite using the cached Node runtime:
```powershell
& "C:\Users\AMD\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" ./node_modules/vitest/vitest.mjs run
```
**Expected Outcome**: 100% of tests pass across all 12 test files (390 tests).

### 6.2 TypeScript Compilation
```powershell
& "C:\Users\AMD\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" ./node_modules/typescript/bin/tsc --noEmit
```
**Expected Outcome**: Exits with code 0 without any type or lint errors.

### 6.3 E2E Showcase HTML Assertions
Ensure all server-side render tests in `tests/e2e/e2e-showcase.test.ts` pass:
- Case 2: `Staff of Homa`, `Lv.90`, `R1`
- Case 5: `The Widsith`, `R5`
- Case 1: `Hu Tao`, `Pyro`, `C6`, `Lv.90`
- Case 4: Pyro color `#FF6B2C`
- All other tests unchanged.
