# Handoff Report — Milestone 2 Explorer 1 (100x Stat Multiplication Fix)

## 1. Observation

1. **`src/lib/enka/parser.ts` (lines 216-232)**:
   ```typescript
   const mainStat = {
     key: getStatName(flat.reliquaryMainstat.mainPropId),
     value: flat.reliquaryMainstat.statValue,
   };

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
   - `flat.reliquaryMainstat.statValue` is assigned directly to `mainStat.value` with zero normalization.
   - `sub.value` is assigned the raw `sub.statValue` (`0.078`, `0.218`, etc.), even though `displayValue` was scaled by 100 for `estimateRollCount`.

2. **Fixture disparity in raw data**:
   - In `tests/fixtures/enka-response.json` (line 136, 162, 188):
     - Sands `reliquaryMainstat.statValue`: `0.466`
     - Goblet `reliquaryMainstat.statValue`: `0.466`
     - Circlet `reliquaryMainstat.statValue`: `0.622`
     - Flower substats (lines 87-89): `0.078`, `0.218`, `0.146`
   - In `tests/fixtures/varesa-1813164100.json` (line 136, 162, 188):
     - Sands `reliquaryMainstat.statValue`: `46.6`
     - Goblet `reliquaryMainstat.statValue`: `46.6`
     - Circlet `reliquaryMainstat.statValue`: `62.2`
     - Flower substats (lines 87-89): `0.105`, `0.218`, `0.099`

3. **`src/components/character/ArtifactDisplay.tsx` (lines 23-30)**:
   ```typescript
   const getStatDisplay = (key: string, value: number) => {
     const isPercentage = ['cr', 'cd', 'er', 'hpPercent', 'atkPercent', 'defPercent'].includes(key) || key.includes('DmgBonus');

     if (isPercentage) {
       return formatPercentage(value * 100, 1);
     }
     return value.toFixed(0);
   };
   ```
   - Unconditionally multiplies `value * 100` before calling `formatPercentage(value * 100, 1)`.
   - When `value` is `46.6` (from `varesa-1813164100.json`), `value * 100` is `4660.0`, rendering `4660.0%`.
   - Missing `healingBonus` in `isPercentage`.

4. **`src/lib/utils.ts` (lines 15-17)**:
   ```typescript
   export function formatPercentage(num: number, decimals: number = 1): string {
     return `${num.toFixed(decimals)}%`;
   }
   ```
   - Expects `num` to already be scaled to percentage (e.g. `46.6` -> `'46.6%'`).

5. **Scan of all other rendering sites in `src/`**:
   - `CharacterCard.tsx` (lines 76, 85): `formatPercentage(character.stats.cr, 1)` uses character-level stat already scaled by `parseStats`. No redundant `* 100`.
   - `StatsPanel.tsx` (lines 23-26, 32, 84): `formatPercentage(stats.cr, 1)` uses character-level stat. No redundant `* 100`.
   - `LeaderboardTable.tsx` (line 172): `build.stats.cr.toFixed(1)%` uses character-level stat. No redundant `* 100`.
   - No other component in `src/` defines or calls `getStatDisplay`.

6. **`tests/e2e/calculations.test.ts` (lines 51-91)**:
   - Case 1: `rawDecimal = 0.466` normalized to `46.6`, formatted as `'46.6%'`, not `'4660.0%'`.
   - Case 2: `liveScaled = 46.6` normalized to `46.6`, formatted as `'46.6%'`, not `'4660.0%'`.
   - Case 3: `rawCr = 0.078` normalized to `7.8`, formatted as `'7.8%'`, not `'780.0%'`.
   - Case 4: `cdCirclet = 62.2` normalized to `62.2`, formatted as `'62.2%'`, not `'6220.0%'`.
   - Case 5: `erStat = 0.551` normalized to `55.1`, formatted as `'55.1%'`.
   - Fixture 1: Hu Tao substats - `displayVal` in range `(0, 60]`, never `780%` or `4660%`.
   - Fixture 2: Varesa Flower - Crit Value `2 * 10.5 + 21.8 = 42.8` (Great).

---

## 2. Logic Chain

1. From **Observation 2**, incoming artifact data exhibits two distinct scales for percentage stats: decimal fractions in `(0, 1.0]` (such as `0.466` or `0.078` from Enka API) and pre-scaled percentage numbers `> 1.0` (such as `46.6` or `62.2` in `varesa-1813164100.json`).
2. From **Observation 1**, `src/lib/enka/parser.ts` currently performs no normalization on `mainStat.value` or `sub.value`. It blindly passes whatever scale came from the payload.
3. From **Observation 3** and **Observation 4**, `ArtifactDisplay.tsx` assumes all values are decimal fractions and applies `value * 100`. When encountering `46.6`, it outputs `4660.0%`. If `sub.value` is normalized to `7.8` without modifying `ArtifactDisplay.tsx`, it outputs `780.0%`.
4. Therefore, the defect can only be resolved by fixing both sides:
   - Normalizing all percentage stats in `src/lib/enka/parser.ts` at the ingestion boundary: if a percentage stat has `value > 0 && value <= 1.0`, multiply by 100 (e.g. `0.466` -> `46.6`, `0.078` -> `7.8`); if `value > 1.0`, preserve the value.
   - Storing the normalized value in `mainStat.value` and `sub.value`.
   - Removing `value * 100` in `ArtifactDisplay.tsx` `getStatDisplay`, calling `formatPercentage(value, 1)` directly.
5. From **Observation 5**, no other component in `src/` touches `getStatDisplay` or performs redundant `* 100` on artifact stats. Thus, no regressions will be introduced elsewhere.
6. From **Observation 6**, the proposed normalization and formatting blueprints satisfy 100% of the expectations in `tests/e2e/calculations.test.ts` and `tests/e2e/e2e-showcase.test.ts`.

---

## 3. Caveats

1. **Weapon Substat Scale**: In `src/lib/enka/parser.ts` line 178, `weapon.subStat.value` remains raw `0.662` as required by existing unit test `tests/enka-parser.test.ts` line 64 (`expect(weapon.subStat?.value).toBeCloseTo(0.662, 3)`). Weapon metadata display in Milestone 3 relies on `WEAPON_DATA` (`valueLv90: 66.2`). Do not alter `parseWeapon` stat scaling.
2. **Character Sheet Stats**: In `src/lib/enka/parser.ts` `parseStats`, `fightPropMap` properties (`cr`, `cd`, `er`, `dmgBonus`, `healingBonus`) are already correctly scaled by `* 100` and consumed directly by `CharacterCard` and `StatsPanel`. Do not alter `parseStats`.
3. No other caveats.

---

## 4. Conclusion

The 100x stat multiplication bug is completely mapped, root-caused, and solvable with surgical changes to two files:

1. **`src/lib/enka/parser.ts`**:
   - Add helper functions `isPercentageStat` and `normalizeArtifactStat`.
   - In `parseArtifacts`: normalize `mainStat.value` and `subStats[].value`.
   - Feed `normalizedValue` into `estimateRollCount(key, normalizedValue)`.

2. **`src/components/character/ArtifactDisplay.tsx`**:
   - In `getStatDisplay`: change `return formatPercentage(value * 100, 1)` to `return formatPercentage(value, 1)`.
   - Include `healingBonus` in the percentage stat key list.

---

## 5. Verification Method

1. **Unit & E2E Test Execution**:
   - Run Vitest suite:
     ```powershell
     npx vitest run tests/e2e/calculations.test.ts
     npx vitest run tests/enka-parser.test.ts
     npx vitest run tests/e2e/e2e-showcase.test.ts
     ```
2. **TypeScript Typecheck**:
   - Run:
     ```powershell
     npx tsc --noEmit
     ```
3. **Inspection of Rendered Markup**:
   - Inspect UID showcase at `http://localhost:3000/u/1813164100` or via snapshot test:
     - Sands main stat: `ATK% 46.6%` (never `4660.0%`).
     - Goblet main stat: `Electro DMG 46.6%` (never `4660.0%`).
     - Circlet main stat: `CRIT DMG 62.2%` (never `6220.0%`).
     - Flower substats: `CRIT Rate 10.5%` (never `1050.0%`), `CRIT DMG 21.8%` (never `2180.0%`).
4. **Invalidation Conditions**:
   - Any test case in `tests/e2e/calculations.test.ts` fails or generates percentage `> 100%` for artifact substats.
   - `weapon.subStat.value` in `tests/enka-parser.test.ts` fails.
