# Milestone 2 Review & Adversarial Stress Report — Reviewer 1

## Review Summary

**Verdict**: **APPROVE**  
**Overall Risk Assessment**: **LOW**

The Milestone 2 implementation satisfies all functional, mathematical, architectural, and boundary requirements specified in `ORIGINAL_REQUEST.md` (§R2, §R5) and `PROJECT.md`. The 100x multiplication error is eliminated, percentages format consistently as `XX.X%`, universal Crit Value (`2 * CR + CD`) is evaluated per piece and across builds with proper quality badge tiers, substat rolls are bounded in $[1..6]$ with authentic visual roll pips (`●●●○○` / `●●●●●★`), deterministic UID `1813164100` fallback is in place, and `src/app/page.tsx` remains completely untouched (219 lines). No integrity violations, hardcoded facades, or regressions were detected.

---

## 1. Observation

Direct observations from codebase inspection, tests, and static analysis:

1. **Elimination of 100x Multiplication Bug**:
   - `src/lib/enka/parser.ts` (lines 43–58):
     ```typescript
     export function isPercentageStat(key: string): boolean {
       return (
         ['cr', 'cd', 'er', 'hpPercent', 'atkPercent', 'defPercent', 'healingBonus'].includes(key) ||
         key.includes('DmgBonus')
       );
     }

     export function normalizeArtifactStat(key: string, val: number): number {
       if (isPercentageStat(key)) {
         if (val > 0 && val <= 1.0) {
           return parseFloat((val * 100).toFixed(1));
         }
         return parseFloat(val.toFixed(1));
       }
       return val;
     }
     ```
   - `src/components/character/ArtifactDisplay.tsx` (lines 23–32):
     ```typescript
     const getStatDisplay = (key: string, value: number) => {
       const isPercentage =
         ['cr', 'cd', 'er', 'hpPercent', 'atkPercent', 'defPercent', 'healingBonus'].includes(key) ||
         key.includes('DmgBonus');

       if (isPercentage) {
         return formatPercentage(value, 1);
       }
       return value.toFixed(0);
     };
     ```
     The former redundant multiplication `value * 100` before calling `formatPercentage` has been removed. Values normalized by `parser.ts` pass directly to `formatPercentage(value, 1)` in `src/lib/utils.ts` (`${num.toFixed(1)}%`), formatting as `46.6%` rather than `4660.0%`. Flat stats format with `value.toFixed(0)` (e.g. `4780`).

2. **Universal Crit Value (CV) & Quality Badges**:
   - `src/lib/enka/static-data.ts` (lines 211–240):
     - `calculateCritValue(cr, cd)`: guards negative numbers to 0 (`Math.max(0, cr || 0) * 2 + Math.max(0, cd || 0)`) and rounds to 1 decimal place (`parseFloat(...toFixed(1))`).
     - `getQualityBadge(cv, isCirclet)`:
       - Standard pieces: `<20` Subpar, `20.0–29.9` Decent, `30.0–39.9` Good, `40.0–49.9` Great, `≥50.0` Godly.
       - Circlets: `<10` Subpar, `10.0–19.9` Decent, `20.0–29.9` Good, `30.0–34.9` Great, `≥35.0` Godly.
     - `getBuildCVTier(totalCv)`:
       - `<140` Subpar, `140.0–179.9` Decent, `180.0–219.9` Good, `220.0–239.9` Great, `≥240.0` Godly.
   - `src/lib/enka/parser.ts` (lines 270–294, 111–114, 143–146): attaches computed `cv` and `qualityBadge` to each `Artifact`, and computes `totalCv` (sum of 5 equipped artifact CVs) and `qualityBadge` on `Character`.

3. **Substat Roll Estimation & Visual Roll Pips**:
   - `src/lib/enka/static-data.ts` (lines 174–207):
     - `estimateRollCount(statKey, value)`: looks up `SUBSTAT_ROLLS[statKey]` (defined for all 10 substats: `hpPercent`, `atkPercent`, `defPercent`, `hp`, `atk`, `def`, `em`, `er`, `cr`, `cd`). Uses an epsilon-adjusted bound search strictly returning an integer $k \in [1..6]$.
     - `deriveVisualRollPips(rolls, maxPips = 5)`: generates `●○○○○` through `●●●●●` for rolls 1–5, and `●●●●●★` for 6 rolls.
   - `src/components/character/ArtifactDisplay.tsx` (lines 102–106): renders `[{subStat.pips}]` beside each substat value.

4. **Demo UID 1813164100 Mock Fallback & SSR Pre-rendering**:
   - `src/lib/enka/client.ts` (lines 9–18, 38–40, 54–59, 72–77): defines `DEMO_FALLBACK_UID = '1813164100'`, provides `getVaresaMockData()` loading `tests/fixtures/varesa-1813164100.json`, and falls back to deterministic mock data when in test/offline environments or upon network/API errors.
   - `src/app/api/player/[uid]/route.ts` (lines 22, 82–93): exempts `1813164100` from rate limiting and provides defensive catch block recovery.
   - `src/app/u/[uid]/page.tsx` (lines 29–38): async server component that prefetches `initialData` for `1813164100` during SSR.
   - `src/components/profile/ProfileClient.tsx` (lines 15–29): consumes `initialData` to immediately hydrate without skeleton flash.

5. **Strict Boundary Preservation (R5 Constraint)**:
   - File `src/app/page.tsx` was inspected and verified to contain exactly 219 lines and 10,540 bytes, identical to its original baseline.

6. **Static Analysis & Test Verification**:
   - TypeScript compiler: `tsc --noEmit` exited with code 0 (0 type errors).
   - Vitest suite: 12 test files passed, 390/390 tests passed.
     - `tests/e2e/calculations.test.ts` (23 tests passed)
     - `tests/adversarial-m2.test.ts` (129 tests passed)
     - `tests/adversarial-m2-uid1813164100.test.ts` (13 tests passed)
     - `tests/enka-parser.test.ts` (9 tests passed)
     - `tests/e2e/e2e-showcase.test.ts` (49 tests passed)
     - `tests/e2e/metadata.test.ts` (22 tests passed)
     - `tests/weapon-data.test.ts` (11 tests passed)
     - `tests/artifact-set-data.test.ts` (10 tests passed)
     - `tests/talent-boost.test.ts` (11 tests passed)
     - `tests/talent-boost-adversarial.test.ts` (36 tests passed)
     - `tests/adversarial-m1.test.ts` (75 tests passed)
     - `tests/redis-fallback.test.ts` (2 tests passed)

7. **Integrity Violations Check**:
   - No hardcoded test results embedded in source logic.
   - No dummy facades or shortcuts bypassing calculation requirements.
   - No fabricated verification outputs.

---

## 2. Logic Chain

1. **Bug Resolution**:
   - *Observation 1* establishes that `normalizeArtifactStat` normalizes decimal percentages ($0 < \text{val} \le 1.0$) to standard percentage scale (e.g. $0.466 \to 46.6$) and leaves already-scaled values ($\text{val} > 1.0$) unchanged.
   - *Observation 1* also demonstrates that `ArtifactDisplay.tsx` uses `formatPercentage(value, 1)` directly on the normalized value.
   - *Inference*: The 100x multiplication error is eliminated, displaying `46.6%` rather than `4660.0%`.

2. **Crit Value & Quality Badges**:
   - *Observation 2* verifies that `calculateCritValue(cr, cd)` implements $\text{CV} = 2 \cdot \text{CR} + \text{CD}$, guards against negatives and invalid numbers, and rounds to 1 decimal place.
   - *Observation 2* verifies that `getQualityBadge` implements distinct standards for normal pieces vs. circlets, and `getBuildCVTier` correctly evaluates total build CV tiers according to `PROJECT.md` specifications.
   - *Inference*: Crit Value and quality badges are mathematically sound, bounded, and attached across domain entities.

3. **Roll Counts & Pips**:
   - *Observation 3* verifies that `estimateRollCount` searches roll ranges bounded within $[1..6]$ for all 10 substat categories, preventing impossible roll estimates.
   - *Observation 3* verifies that `deriveVisualRollPips` constructs exact visual representations `[●●●○○]` and `[●●●●●★]`, rendered directly in `ArtifactDisplay.tsx`.
   - *Inference*: Roll count estimation and pip visualization adhere strictly to Genshin Impact artifact roll mechanics.

4. **Fixture & SSR Delivery**:
   - *Observation 4* confirms deterministic offline support for demo UID `1813164100` via `tests/fixtures/varesa-1813164100.json`, with rate limit exemption and SSR prefetching.
   - *Inference*: Demo showcase endpoint `/u/1813164100` and API `/api/player/1813164100` provide resilient, deterministic delivery without depending on live Enka API availability.

5. **Boundary Compliance & Non-Regression**:
   - *Observation 5* verifies that `src/app/page.tsx` was not modified.
   - *Observation 6* confirms zero type errors and 100% test pass rate across 390 test cases.
   - *Observation 7* confirms absence of any integrity violations.
   - *Inference*: Milestone 2 meets all acceptance criteria and is ready for Milestone 3.

---

## 3. Caveats

- Live Enka API requests for non-demo UIDs remain subject to upstream Enka service availability, external network connectivity, and HoYoverse maintenance windows. This is expected and handled gracefully via error responses and in-memory caching.
- In React 18 server-side rendering, JSX string interpolations produce `<!-- -->` comment markers between adjacent expressions in raw HTML strings (e.g. `Lv.<!-- -->90<!-- --> R<!-- -->5`). Any downstream HTML string assertions should strip HTML comments (`html.replace(/<!--.*?-->/g, '')`) before asserting substring matches.

---

## 4. Conclusion

The Milestone 2 work product is verified to be correct, comprehensive, mathematically sound, and fully compliant with project standards. All acceptance criteria for Milestone 2 are satisfied.

**Verdict**: **APPROVE**

---

## 5. Verification Method

To independently reproduce and verify this review:

1. **TypeScript Typecheck**:
   ```powershell
   node .\node_modules\typescript\bin\tsc --noEmit
   ```
   *Expected outcome*: Exits with code 0, 0 errors.

2. **Vitest Automated Test Suite**:
   ```powershell
   node .\node_modules\vitest\vitest.mjs run
   ```
   *Expected outcome*: All 12 test files pass, 390/390 tests pass:
   - `tests/e2e/calculations.test.ts` (23 passed)
   - `tests/adversarial-m2.test.ts` (129 passed)
   - `tests/adversarial-m2-uid1813164100.test.ts` (13 passed)
   - `tests/enka-parser.test.ts` (9 passed)
   - `tests/e2e/e2e-showcase.test.ts` (49 passed)
   - `tests/e2e/metadata.test.ts` (22 passed)
   - `tests/weapon-data.test.ts` (11 passed)
   - `tests/artifact-set-data.test.ts` (10 passed)
   - `tests/talent-boost.test.ts` (11 passed)
   - `tests/talent-boost-adversarial.test.ts` (36 passed)
   - `tests/adversarial-m1.test.ts` (75 passed)
   - `tests/redis-fallback.test.ts` (2 passed)

3. **Verify Boundary Invariant (R5)**:
   ```powershell
   (Get-Content src/app/page.tsx).Length
   ```
   *Expected outcome*: Exactly 219 lines.

---

## Verified Claims

- 100x multiplication bug eliminated → verified via inspection and `tests/e2e/calculations.test.ts` → PASS
- Substat percentage stats format as `XX.X%` → verified via inspection of `ArtifactDisplay.tsx` and `calculations.test.ts` → PASS
- Universal CV formula `2 * CR + CD` handles negatives and rounding → verified via `adversarial-m2.test.ts` → PASS
- Roll count estimation bounded in $[1..6]$ → verified across all 10 substats via `adversarial-m2.test.ts` → PASS
- Visual roll pips format accurately (`●●●○○` / `●●●●●★`) → verified via `adversarial-m2.test.ts` → PASS
- UID 1813164100 offline mock fallback → verified via `adversarial-m2-uid1813164100.test.ts` → PASS
- Home UI (`src/app/page.tsx`) untouched → verified line count (219) and SHA-256 hash → PASS

## Coverage Gaps
- None. All Milestone 2 requirements have full test and adversarial coverage.

## Unverified Items
- None. All items investigated and verified independently.

---

## Adversarial Challenge Report

### Overall Risk Assessment: LOW

### Challenges

#### Challenge 1: Normalization Idempotency Under Re-Parsing
- **Assumption challenged**: Normalization function `normalizeArtifactStat` must not double-scale if invoked repeatedly on already-scaled data (e.g. `46.6` must not become `4660.0`).
- **Attack scenario**: Synthesize values that pass through `normalizeArtifactStat` multiple times ($f(f(x))$, $f(f(f(x)))$).
- **Result**: PASSED. If value $> 1.0$, `val` is preserved. `normalizeArtifactStat('hpPercent', 46.6)` returns `46.6`.

#### Challenge 2: Negative and Non-Numeric Crit Inputs
- **Assumption challenged**: Unsanitized or corrupted API inputs for CR or CD could yield negative or NaN Crit Values.
- **Attack scenario**: Input negative numbers (`-5`, `-10`), `NaN`, `null`, `undefined`.
- **Result**: PASSED. `Math.max(0, cr || 0)` clamps negative values and defaults non-numeric values to 0.

#### Challenge 3: Extreme Roll Boundary Overflow Resistance
- **Assumption challenged**: Naive roll division algorithms can produce impossible roll counts ($> 6$ or $< 1$) on extreme or boundary substats.
- **Attack scenario**: Input 6 max rolls of CD (`46.6%`) or impossible values (`100%` CD).
- **Result**: PASSED. `estimateRollCount` strictly clamps results to $[1..6]$, and `deriveVisualRollPips` represents 6 rolls as `●●●●●★`.

#### Challenge 4: Circlet vs Standard Quality Tier Inversion
- **Assumption challenged**: A circlet with high CD substat could be misclassified under standard piece thresholds (where $\ge 50$ is Godly), making circlets impossible to achieve 'Godly'.
- **Attack scenario**: Evaluate 35.0 CV on standard piece vs circlet.
- **Result**: PASSED. `getQualityBadge(35.0, false)` returns `'Good'`, whereas `getQualityBadge(35.0, true)` returns `'Godly'`.
