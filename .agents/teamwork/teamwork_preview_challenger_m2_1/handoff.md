# Challenger Report: Milestone 2 Mathematical & Roll Calculations

**Verdict**: **APPROVE**  
**Role**: Challenger 1 (Empirical Challenger, critic & specialist)  
**Target Milestone**: Milestone 2 (Core Math, Parser Normalization & Mock Fixture)

---

## 1. Observation

Direct observations from codebase inspection, empirical test execution, and type checking:

1. **Source Code Implementation Inspection**:
   - `src/lib/enka/static-data.ts`:
     - Lines 211–215: `calculateCritValue(cr, cd)` clamps inputs via `Math.max(0, cr || 0) * 2 + Math.max(0, cd || 0)` and formats via `parseFloat((safeCr * 2 + safeCd).toFixed(1))`.
     - Lines 218–231: `getQualityBadge(cv, isCirclet)` defines standard tiers (`<20` Subpar, `20–29.9` Decent, `30–39.9` Good, `40–49.9` Great, `>=50` Godly) and circlet tiers (`<10` Subpar, `10–19.9` Decent, `20–29.9` Good, `30–34.9` Great, `>=35` Godly).
     - Lines 234–240: `getBuildCVTier(totalCv)` defines build tiers (`<140` Subpar, `140–179.9` Decent, `180–219.9` Good, `220–239.9` Great, `>=240` Godly).
     - Lines 174–194: `estimateRollCount(statKey, value)` looks up `SUBSTAT_ROLLS[statKey]`, rounds initial value by average roll, adjusts with epsilon tolerance against physical limits, and clamps to `Math.max(1, Math.min(6, estimated))`.
     - Lines 199–207: `deriveVisualRollPips(rolls, maxPips = 5)` bounds rolls to `[1..6]`, returns `'●●●●●★'` for roll count 6, and otherwise repeats `'●'` and `'○'`.
   - `src/lib/enka/parser.ts`:
     - Lines 43–48: `isPercentageStat(key)` identifies percent stats (`cr`, `cd`, `er`, `hpPercent`, `atkPercent`, `defPercent`, `healingBonus`, and `*DmgBonus`).
     - Lines 50–58: `normalizeArtifactStat(key, val)` converts decimal fractions `0 < val <= 1.0` via `parseFloat((val * 100).toFixed(1))` and preserves values `> 1.0` via `parseFloat(val.toFixed(1))`.
     - Lines 234–297: `parseArtifacts` parses artifact slots, resolves set data, normalizes main/substats, calculates piece CV, attaches quality badges, roll counts, and pips.

2. **Empirical Adversarial Test Suite Execution**:
   - Authored 129 rigorous stress tests in `tests/adversarial-m2.test.ts`.
   - Executed via Vitest runner:
     ```
     Command: & "c:\Users\AMD\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" ./node_modules/vitest/vitest.mjs run tests/adversarial-m2.test.ts
     Output:
     RUN  v2.1.9 D:/games/projects/genshin-leaderboard
     ✓ tests/adversarial-m2.test.ts (129 tests) 26ms
     Test Files  1 passed (1)
          Tests  129 passed (129)
     ```

3. **Full Project Test Suite & Regression Verification**:
   - Executed all 11 test suites across the repository:
     ```
     Command: & "c:\Users\AMD\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" ./node_modules/vitest/vitest.mjs run
     Output:
     ✓ tests/artifact-set-data.test.ts (10 tests)
     ✓ tests/talent-boost.test.ts (11 tests)
     ✓ tests/redis-fallback.test.ts (2 tests)
     ✓ tests/e2e/metadata.test.ts (22 tests)
     ✓ tests/adversarial-m2.test.ts (129 tests)
     ✓ tests/weapon-data.test.ts (11 tests)
     ✓ tests/talent-boost-adversarial.test.ts (36 tests)
     ✓ tests/adversarial-m1.test.ts (75 tests)
     ✓ tests/enka-parser.test.ts (9 tests)
     ✓ tests/e2e/calculations.test.ts (23 tests)
     ✓ tests/e2e/e2e-showcase.test.ts (49 tests)

     Test Files  11 passed (11)
          Tests  377 passed (377)
     ```

4. **Static Typecheck Verification**:
   - Executed TypeScript compiler:
     ```
     Command: & "c:\Users\AMD\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" ./node_modules/typescript/bin/tsc --noEmit
     Output: Exit code 0, 0 type errors.
     ```

5. **Boundary Constraint Verification (R5 Zero-Touch Home Page)**:
   - `src/app/page.tsx` line count: exactly 218 lines, 10,540 bytes, identical to origin state.

---

## 2. Logic Chain

1. **Extreme Crit Values (CV Calculation Robustness)**:
   - *Observation 1 & 2*: `calculateCritValue(cr, cd)` was tested against `(0, 0)`, negative inputs `(-5, -10)`, mixed negative/positive `(-5, 20)`, extremely high values `(15.6, 35.0)` -> 66.2 CV, sheet CV `(91.2, 202.3)` -> 384.7 CV, as well as `NaN`, `undefined`, `null`, and `Infinity`.
   - *Deduction*: Negative values are clamped to 0 immediately via `Math.max(0, ...)`. High CV calculations preserve linear scaling $2 \times CR + CD$ without precision loss or distortion. All outputs are strictly formatted to at most 1 decimal place (`parseFloat(val.toFixed(1))`), eliminating floating-point drift (e.g. `15.550000000000002`).

2. **Quality Badge Boundaries (Standard vs. Circlet)**:
   - *Observation 1 & 2*: Tested boundary pairs:
     - Standard: `19.9` (Subpar) vs `20.0` (Decent), `29.9` (Decent) vs `30.0` (Good), `39.9` (Good) vs `40.0` (Great), `49.9` (Great) vs `50.0` (Godly).
     - Circlet: `9.9` (Subpar) vs `10.0` (Decent), `19.9` (Decent) vs `20.0` (Good), `29.9` (Good) vs `30.0` (Great), `34.9` (Great) vs `35.0` (Godly).
     - Micro-boundaries: `19.99` vs `20.00` vs `20.01`, `34.99` vs `35.00` vs `35.01`.
   - *Deduction*: The branching logic is strict and exact. Crucially, the distinction between standard and circlet thresholds accommodates Genshin artifact mechanics where Circlet main stats cannot repeat as substats (e.g., 32.0 CV evaluates to 'Good' on a Flower, but 'Great' on a Circlet; 36.0 CV evaluates to 'Good' on a Plume, but 'Godly' on a Circlet).

3. **Build CV Tier Boundaries**:
   - *Observation 1 & 2*: Tested total build CV thresholds: `139.9` (Subpar) vs `140.0` (Decent), `179.9` (Decent) vs `180.0` (Good), `219.9` (Good) vs `220.0` (Great), `239.9` (Great) vs `240.0` (Godly), plus negative/zero totals.
   - *Deduction*: Aggregation of equipped artifact piece CVs correctly assigns build-level badges across the full spectrum.

4. **Bounded Substat Roll Counts ($k \in [1..6]$) for all 10 Substats**:
   - *Observation 1 & 2*: Tested all 10 substats defined in `SUBSTAT_ROLLS` (`hpPercent`, `atkPercent`, `defPercent`, `hp`, `atk`, `def`, `em`, `er`, `cr`, `cd`) across rolls 1 to 6, plus extreme overflow ($10 \times \text{maxRoll}$), tiny positive values, zero, and negative values.
   - *Deduction*: The bounded estimation loop correctly guarantees $k \in [1..6]$ for any positive value, preventing physical impossibility in Genshin (maximum 6 rolls on a 5-star artifact). Negative or zero values safely return 0. Unknown stat keys safely return 0 without throwing.

5. **Visual Roll Pips String Representation**:
   - *Observation 1 & 2*: Tested `deriveVisualRollPips(rolls, maxPips)` for values from -99 to 999.
   - *Deduction*: Standard rolls 1 through 5 produce formatted pips `●○○○○` through `●●●●●`. Roll count 6 (and any overflow $> 6$) reliably returns the distinct `'●●●●●★'` string. Underflow $< 1$ clamps to `'●○○○○'`. Custom `maxPips` parameter is supported.

6. **Stat Normalization Idempotency**:
   - *Observation 1 & 2*: Tested `isPercentageStat` against all percentage and flat stats. Evaluated `normalizeArtifactStat` for idempotency: $f(x)$, $f(f(x))$, and $f(f(f(x)))$ for unscaled decimals (`0.466` -> `46.6`), already-scaled values (`46.6` -> `46.6`), flat stats (`4780` -> `4780`, `311` -> `311`), and zero/boundary cases.
   - *Deduction*: Idempotency holds strictly across all stat types. Double application of stat normalization never results in the 100x bug (`4660.0%`). Flat stats are never scaled.

7. **Full Parser Integration**:
   - *Observation 1 & 2*: Evaluated synthetic payloads representing a 0 CV piece, a 6-roll CD piece (46.6%), and a CR-mainstat Circlet with 35.0% CD substat.
   - *Deduction*: The parser accurately coordinates `normalizeArtifactStat`, `calculateCritValue`, `getQualityBadge`, `estimateRollCount`, and `deriveVisualRollPips`, correctly populating all domain model fields without exceptions.

---

## 3. Caveats

- Live network latency and Enka.Network rate limits (HTTP 429) remain external constraints for real-time requests with external non-demo UIDs; however, demo UID `1813164100` is fully isolated via deterministic fallback fixtures.
- No caveats regarding mathematical precision, boundary behavior, or roll bounding logic.

---

## 4. Conclusion

All mathematical formulas, stat normalization rules, quality badge thresholds, bounded roll count estimations ($k \in [1..6]$), visual roll pip string formatters, and parser integrations implemented in Milestone 2 meet and exceed the specification requirements. 

- **129 / 129** adversarial stress tests pass.
- **377 / 377** repository-wide tests pass with 0 failures.
- **0** TypeScript compilation errors under `tsc --noEmit`.
- **R5 Home UI constraint** strictly preserved.

**Explicit Verdict**: **APPROVE**

---

## 5. Verification Method

To independently reproduce and verify this challenger assessment:

1. **Run the Adversarial Test Suite**:
   ```bash
   node ./node_modules/vitest/vitest.mjs run tests/adversarial-m2.test.ts
   ```
   *Expected result*: 129 passed tests across 8 describe blocks.

2. **Run Full Test Suite**:
   ```bash
   node ./node_modules/vitest/vitest.mjs run
   ```
   *Expected result*: 11 test files passed, 377 passed tests, 0 failures.

3. **Verify Type Checking**:
   ```bash
   node ./node_modules/typescript/bin/tsc --noEmit
   ```
   *Expected result*: Exits with code 0 and no output.

4. **Verify Home UI Zero-Touch Constraint**:
   ```powershell
   (Get-Content src/app/page.tsx).Length
   ```
   *Expected result*: Exactly 218 lines.
