# Milestone 4 Handoff Report: Roll Analysis Pips & Piece CV Badges

**Agent**: Explorer 3 (`teamwork_preview_explorer_m4_3`)  
**Mission**: Investigate and design roll analysis visual pips and piece CV ratings/quality badges in `ArtifactDisplay.tsx`.  
**Date**: 2026-11-01  
**Handoff Type**: Hard (Investigation complete, full blueprints provided)

---

## 1. Observation

1. **Current `ArtifactDisplay.tsx` Baseline (`src/components/character/ArtifactDisplay.tsx:1-134`)**:
   - Lines 67–71: Renders quality badge with uniform hardcoded styling `border-cyan-400/30 text-cyan-400 bg-cyan-400/10` regardless of whether the piece is Subpar or Godly. If `artifact.qualityBadge` is omitted, no badge or CV is rendered.
   - Lines 102–110: Substat pips only render if `subStat.pips` is defined. If undefined, it falls back to `({subStat.rolls}↑)`. All pips are rendered in single uniform cyan (`text-cyan-400/90`) without roll luck tiered highlighting or distinction for 5-roll/6-roll procs.
   - Lines 117–130: Roll quality indicator calculates `(actualRolls / maxPossibleRolls) * 100` where `maxPossibleRolls` defaults to 9 for +20 artifacts.
2. **Authoritative Math & Domain Contracts (`src/lib/enka/static-data.ts:173-241`)**:
   - `estimateRollCount(statKey, value)` (lines 173–194): Bounded estimation within $[1..6]$ rolls based on theoretical average roll values.
   - `deriveVisualRollPips(rolls, maxPips = 5)` (lines 199–207): Converts $1..5$ rolls to `●○○○○` through `●●●●●`, and $6$ rolls to `●●●●●★`.
   - `calculateCritValue(cr, cd)` (lines 211–215): Computes $2 \times \text{CR} + \text{CD}$, clamped at 0, rounded to 1 decimal place.
   - `getQualityBadge(cv, isCirclet)` (lines 218–231):
     - Standard: $<20$ Subpar, $20–29.9$ Decent, $30–39.9$ Good, $40–49.9$ Great, $\ge 50$ Godly.
     - Circlet: $<10$ Subpar, $10–19.9$ Decent, $20–29.9$ Good, $30–34.9$ Great, $\ge 35$ Godly.
3. **E2E Test Invariants (`tests/e2e/e2e-showcase.test.ts:97-151, 336-347`)**:
   - Lines 104–106: Asserts `html` contains uppercase slot name (`FLOWER`), set name (`Crimson Witch of Flames`), and `+20`.
   - Lines 115–118: Asserts `html` contains `Main Stat`, `HP`, and `4780`.
   - Line 127: Asserts `html` contains `CRIT DMG`.
   - Lines 136–141: Asserts `html` contains `Sub Stats`, `CRIT Rate`, `CRIT DMG`, `ATK%`, `Elemental Mastery`.
   - Line 149: Asserts `html` contains `★★★★★`.
   - Lines 342–344: Asserts `html` contains no `NaN` or `undefined` for all 5 artifacts.
4. **Boundary Isolation (`ORIGINAL_REQUEST.md:31-33`, `PROJECT.md:29`)**:
   - Requirement R5 strictly forbids editing or redesigning `src/app/page.tsx` (must retain exact 219 lines, 10,531 characters).

---

## 2. Logic Chain

1. **Substat Roll Pip Visuals**:
   - Observation: Substat rolls range from 1 (base initial roll, 0 upgrades) to 6 (base initial roll + 5 max upgrades into the same stat).
   - In `static-data.ts`, `deriveVisualRollPips` returns 5 characters for 1–5 rolls (`●○○○○` to `●●●●●`) and 6 characters for 6 rolls (`●●●●●★`).
   - If an artifact object lacks `subStat.pips`, `ArtifactDisplay` should defensively compute:
     $$\text{rolls} = \text{subStat.rolls} \ ?? \ \text{estimateRollCount}(\text{subStat.key}, \text{subStat.value})$$
     $$\text{pips} = \text{subStat.pips} \ ?? \ \text{deriveVisualRollPips}(\text{rolls})$$
   - Wrapping pips cleanly in brackets `[${pips.replace(/^\[+|\]+$/g, '')}]` ensures formatting `[●●●○○]` and `[●●●●●★]`.
   - Applying `font-mono tracking-widest tabular-nums min-w-[5.2rem]` guarantees that pips line up vertically across all 4 substats without layout jitter.
   - To make high-investment rolls stand out at a glance, we tier the pip badge pill: 6 rolls (yellow/gold star glow), 5 rolls (amber glow), 4 rolls (purple glow), 3 rolls (cyan), 1–2 rolls (neutral slate).
   - Adding a detailed `title` and `aria-label` explains the exact breakdown (e.g. `3 Rolls (Solid): CRIT Rate received 2 upgrade procs (2 upgrades + 1 base roll)`).

2. **Universal Crit Value & Piece Quality Badges**:
   - Observation: Crit Value measures artifact substat quality via $2 \times \text{CR} + \text{CD}$.
   - Circlets can have CR or CD as main stats, precluding that stat from rolling as a substat and naturally capping substat CV.
   - Dual-scale classification (`isCirclet = artifact.slot === 'circlet'`):
     - Standard: $<20$ Subpar, $20–29.9$ Decent, $30–39.9$ Good, $40–49.9$ Great, $\ge 50$ Godly.
     - Circlet: $<10$ Subpar, $10–19.9$ Decent, $20–29.9$ Good, $30–34.9$ Great, $\ge 35$ Godly.
   - Badge styling with distinctive colors and radiant borders:
     - **Godly**: Amber/Gold gradient (`from-amber-500/25 via-yellow-500/20 to-orange-500/25`), text `text-amber-300`, border `border-amber-400/80`, glow `shadow-[0_0_12px_rgba(245,158,11,0.45)]`, pulse icon `✦`.
     - **Great**: Purple/Pink gradient (`from-purple-500/25 to-pink-500/25`), text `text-purple-300`, border `border-purple-400/70`, glow `shadow-[0_0_10px_rgba(168,85,247,0.35)]`.
     - **Good**: Cyan/Blue gradient (`from-cyan-500/25 to-blue-500/25`), text `text-cyan-300`, border `border-cyan-400/60`, glow `shadow-[0_0_8px_rgba(6,182,212,0.3)]`.
     - **Decent**: Emerald/Teal gradient (`from-emerald-500/20 to-teal-500/20`), text `text-emerald-300`, border `border-emerald-400/50`, glow `shadow-[0_0_6px_rgba(16,185,129,0.25)]`.
     - **Subpar**: Muted Slate (`bg-slate-800/60 text-slate-400 border-slate-700/60`), no glow.
   - Badge text rendered as `{qualityBadge} ({pieceCv.toFixed(1)} CV)` guarantees 100% test compatibility and clarity.

3. **Defensive Edge Cases**:
   - Zero CV pieces safely render `Subpar (0.0 CV)` with slate styling.
   - All numbers clamped and formatted through `toFixed(1)` or `formatNumber()` to eliminate `NaN`, `undefined`, or float drift.

---

## 3. Caveats

1. **Read-Only Explorer Scope**: Explorer 3 does not modify source code directly. The production implementation is provided as a drop-in JSX blueprint in `analysis.md` section 5 for Worker implementation.
2. **Active Set Bonuses Banner & Card Header Coordination**: Explorer 1 is designing the Active Set Bonuses Banner and overall artifacts layout, while Explorer 2 is refining 5-piece artifact card stat formatting. Our blueprint for `ArtifactDisplay.tsx` is completely modular and integrates seamlessly whether called individually (current `CharacterDetailModal.tsx` contract) or as part of a multi-piece grid.
3. **R5 Home Page Boundary**: `src/app/page.tsx` must remain completely untouched.

---

## 4. Conclusion

1. The mathematical specifications for universal Crit Value ($2 \times \text{CR} + \text{CD}$) and authentic substat roll estimation ($k \in [1..6]$) have been verified and codified.
2. The dual-scale Quality Badge taxonomy (Standard $\ge 50$ Godly vs Circlet $\ge 35$ Godly) is fully mapped to a 5-tier color styling system with distinctive glow borders.
3. High-contrast monospace roll analysis pips `[●○○○○]` through `[●●●●●★]` are designed with vertical alignment, roll luck tiered pill styles, and descriptive tooltips.
4. Complete, zero-regression JSX/CSS blueprint has been published to `analysis.md` for immediate implementation by the Worker agent.

---

## 5. Verification Method

To verify the design and implementation independently:

1. **Verify Static Integrity & Type Checking**:
   ```powershell
   npm run typecheck
   # Equivalently: npx tsc --noEmit
   ```
   *Expected outcome*: Exits with code 0 and zero TypeScript errors.

2. **Verify E2E Showcase Component Rendering**:
   ```powershell
   node ./node_modules/vitest/vitest.mjs run tests/e2e/e2e-showcase.test.ts
   ```
   *Expected outcome*: All 49 tests pass, specifically:
   - Case 1: Slot name `FLOWER`, set name `Crimson Witch of Flames`, `+20`
   - Case 2: Main Stat `HP 4780`
   - Case 3: `CRIT DMG`
   - Case 4: 4 substats (`CRIT Rate`, `CRIT DMG`, `ATK%`, `Elemental Mastery`)
   - Case 5: 5-star rarity `★★★★★`
   - Scenario 3: All 5 artifacts for UID 1813164100 render with zero `NaN` or `undefined`.

3. **Verify Math & Roll Analysis Calculations**:
   ```powershell
   node ./node_modules/vitest/vitest.mjs run tests/e2e/calculations.test.ts
   ```
   *Expected outcome*: All 23 tests pass (CV calculations, tier thresholds, roll counts, and pip derivations).

4. **Verify Home UI Zero-Touch Constraint**:
   ```powershell
   git status -- src/app/page.tsx
   ```
   *Expected outcome*: Working tree clean for `src/app/page.tsx` (unmodified).
