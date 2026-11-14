# Milestone 4 Handoff Report: 5-Piece Artifact Card & Stat Formatting

**Agent**: Explorer 2 (`teamwork_preview_explorer_m4_2`)  
**Milestone**: Milestone 4 (Artifact Detail & Roll Analysis Grid)  
**Target Component**: `src/components/character/ArtifactDisplay.tsx`  
**Recipient**: Worker / Orchestrator  
**Date**: 2026-11-01  

---

## 1. Observation

1. **Current `ArtifactDisplay.tsx` implementation** (`src/components/character/ArtifactDisplay.tsx:1-134`):
   - Line 66: `<span className="text-sm font-semibold">{artifact.slot.toUpperCase()}</span>`. It renders only `'FLOWER'`, `'PLUME'`, `'SANDS'`, `'GOBLET'`, `'CIRCLET'`. It lacks official in-game lore titles (`Flower of Life`, `Plume of Death`, `Sands of Eon`, `Goblet of Eonothem`, `Circlet of Logos`) and has no slot icons.
   - Line 73: `<div className="text-xs text-gray-400">{artifact.setName}</div>`. It completely omits the piece name (`artifact.name`, e.g. `Witch's Flower of Blaze`), which is parsed from `flat.nameTextMapHash` in `src/lib/enka/parser.ts:279`.
   - Lines 83-92: Main stat is rendered as a plain row with small text (`text-sm font-bold text-cyan-400`), lacking visual hierarchy as the hero element.
   - Lines 23-32: `getStatDisplay` calls `formatPercentage(value, 1)` for percentage stats and `value.toFixed(0)` for flat stats. Flat stats like `4780` on Flower must remain without commas because tests assert `toContain('4780')`.
   - Lines 98-113: Substats are rendered in a vertical stack, but lack monospace tabular alignment, which makes roll pips `[●●●○○]` uneven across rows.

2. **Test Invariants in `tests/e2e/e2e-showcase.test.ts`** (`tests/e2e/e2e-showcase.test.ts:97-151` & `336-347`):
   - Line 104: `expect(html).toContain('FLOWER');`
   - Line 105: `expect(html).toContain('Crimson Witch of Flames');`
   - Line 106: `expect(html).toContain('+20');`
   - Line 115: `expect(html).toContain('Main Stat');`
   - Line 116: `expect(html).toContain('HP');`
   - Line 118: `expect(html).toContain('4780');`
   - Line 127: `expect(html).toContain('CRIT DMG');`
   - Line 136: `expect(html).toContain('Sub Stats');`
   - Line 137: `expect(html).toContain('CRIT Rate');`
   - Line 138: `expect(html).toContain('CRIT DMG');`
   - Line 139: `expect(html).toContain('ATK%');`
   - Line 140: `expect(html).toContain('Elemental Mastery');`
   - Line 149: `expect(html).toContain('★★★★★');`
   - Line 342-346: `expect(html).not.toContain('NaN'); expect(html).not.toContain('undefined'); expect(html).toContain(artifact.slot.toUpperCase()); expect(html).toContain('+20');`

3. **Domain Models in `src/lib/enka/types.ts`** (`src/lib/enka/types.ts:181-206`):
   - `Artifact`: `{ id, name, setId, setName, setBonusText?, slot, rarity, level, mainStat: { key, value }, subStats: Array<{ key, value, rolls?, pips? }>, cv?, qualityBadge?, icon }`.
   - `QualityBadge`: `'Subpar' | 'Decent' | 'Good' | 'Great' | 'Godly'`.

4. **Static Data Formulas in `src/lib/enka/static-data.ts`** (`src/lib/enka/static-data.ts:173-240`):
   - `estimateRollCount(statKey, value)` calculates authentic roll counts $k \in [1..6]$.
   - `deriveVisualRollPips(rolls)` yields `●○○○○` through `●●●●●` and `●●●●●★`.
   - `calculateCritValue(cr, cd)` evaluates $2 \times \text{CR} + \text{CD}$.
   - `getQualityBadge(cv, isCirclet)` classifies quality into 5 tiers.

5. **Home UI Boundary Isolation** (`src/app/page.tsx`):
   - `src/app/page.tsx` is 219 lines and 10,531 bytes. It is completely untouched.

---

## 2. Logic Chain

1. **Slot Representation (Premise from Obs 1 & 2)**:
   - Because existing tests assert `toContain('FLOWER')` and `toContain(artifact.slot.toUpperCase())`, the slot header MUST render `artifact.slot.toUpperCase()`.
   - To elevate the card to authentic in-game showcase quality, pairing this uppercase key with the full in-game lore name (`Flower of Life`, `Plume of Death`, `Sands of Eon`, `Goblet of Eonothem`, `Circlet of Logos`) and matching Lucide icons (`Flower2`, `Feather`, `Hourglass`, `Wine`, `Crown`) delivers both visual richness and 100% test pass fidelity.
   - Displaying `artifact.name` (`Witch's Flower of Blaze`) prominently alongside `artifact.setName` (`Crimson Witch of Flames`) resolves the missing piece name deficiency noted in Obs 1.

2. **Main Stat High-Contrast Display & 100x Bug Prevention (Premise from Obs 1, 2, 4)**:
   - Percentage stats (`cr`, `cd`, `er`, `hpPercent`, `atkPercent`, `defPercent`, `healingBonus`, and `*DmgBonus`) in Enka parser are already stored normalized (e.g. `46.6` for 46.6%, not `0.466` and not `4660`).
   - `formatStatValue` uses `formatPercentage(normalized, 1)` with defense against raw fractions (`value <= 1.0 ? value * 100 : value`), strictly avoiding `value * 100` on normalized numbers.
   - Flat stats (e.g. `hp` on Flower: `4780`) use `value.toFixed(0)`, outputting `"4780"` directly. This is required because using comma-formatted strings like `"4,780"` would break `expect(html).toContain('4780')`.
   - Wrapping the main stat in a dedicated glass container with `text-2xl font-black font-mono text-cyan-300` transforms it into the primary visual anchor of each card.

3. **Substats List & Visual Pips Alignment (Premise from Obs 1, 2, 4)**:
   - Substats require a tabular row structure: stat label on the left (`text-xs text-gray-300 font-medium`), and value (`font-mono font-bold text-white`) plus roll pips (`font-mono text-cyan-400 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/20`) on the right.
   - This prevents variable-length numbers from misaligning roll pips.
   - Quality badges (`Godly`, `Great`, `Good`, `Decent`, `Subpar`) receive dedicated glowing border colors (amber, purple, blue, emerald, gray) reflecting piece Crit Value.

---

## 3. Caveats

- **Active Set Bonuses Banner**: As planned in the Milestone 4 split, Explorer 1 focuses on the Active Set Bonuses Banner and layout architecture. Explorer 2 focuses on the 5-piece individual card and stat formatting. Both designs seamlessly connect via `ArtifactDisplay.tsx` and `ArtifactsGrid`.
- **Custom Slot SVGs vs Lucide Icons**: Lucide icons (`Flower2`, `Feather`, `Hourglass`, `Wine`, `Crown`) are standard project dependencies in `package.json` (`lucide-react: ^1.48.0`). No external image assets or SVGs are required, guaranteeing zero broken image links.
- No other caveats.

---

## 4. Conclusion

The individual piece cards and stat formatting for the 5 artifact slots have been completely investigated, designed, and specified in `analysis.md`:
1. **5-Piece Slot Cards**:
   - Distinctive icons (`Flower2`, `Feather`, `Hourglass`, `Wine`, `Crown`)
   - In-game lore titles (`Flower of Life`, `Plume of Death`, `Sands of Eon`, `Goblet of Eonothem`, `Circlet of Logos`)
   - Piece name (`artifact.name`), set name (`artifact.setName`), level badge (`+20`), rarity stars (`★★★★★`), watermark relic icon.
2. **Main Stat Display**:
   - Large `text-2xl font-black font-mono text-cyan-300` value in a dedicated high-contrast glass panel.
   - Bulletproof `formatStatValue` prevents the 100x bug while outputting exact strings (`4780`, `46.6%`, `62.2%`).
3. **Substats List**:
   - Clean tabular alignment, monospace numeric values, roll pips `[●●●○○]`, and CV quality badges.
4. **Complete Worker Blueprint**:
   - Full TypeScript JSX/CSS drop-in replacement provided in Section 5 of `analysis.md`.
   - Also exports `ArtifactsGrid` container for multi-piece canonical sorting.

---

## 5. Verification Method

1. **Verify Complete Analysis Blueprint**:
   - Inspect `d:/games/projects/genshin-leaderboard/.agents/teamwork/teamwork_preview_explorer_m4_2/analysis.md`.
2. **Run E2E Showcase Tests**:
   ```powershell
   node ./node_modules/vitest/vitest.mjs run tests/e2e/e2e-showcase.test.ts
   ```
   *Expected*: All 49 tests in `e2e-showcase.test.ts` pass, including Tier 1 ArtifactDisplay rendering tests (Cases 1–5).
3. **Run Full Test Suite**:
   ```powershell
   node ./node_modules/vitest/vitest.mjs run
   ```
   *Expected*: All 105 tests pass with 100% success rate.
4. **Typecheck Verification**:
   ```powershell
   npm run typecheck
   ```
   *Expected*: Exits with code 0.
5. **Home UI Boundary Check**:
   - Inspect `src/app/page.tsx` — verify 0 modifications, SHA-256 matches snapshot.
