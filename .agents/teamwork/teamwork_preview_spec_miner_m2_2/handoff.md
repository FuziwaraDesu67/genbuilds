# Milestone 2 Spec Miner Handoff Report

**Author**: Spec Miner 2 (Milestone 2)  
**Recipient**: Orchestrator (`362449e4-d3ad-44eb-8a45-fc8962d6b0ad`)  
**Type**: Hard Handoff (Specification Task Complete)  
**Date**: 2026-11-01  
**Artifacts Produced**:
- `d:\games\projects\genshin-leaderboard\.agents\teamwork\teamwork_preview_spec_miner_m2_2\analysis.md`
- `d:\games\projects\genshin-leaderboard\.agents\teamwork\teamwork_preview_spec_miner_m2_2\handoff.md`

---

## 1. Observation

Direct observations from authoritative code, tests, and specifications:

1. **Test Suite Ground Truth (`tests/e2e/calculations.test.ts`)**:
   - Lines 12–25 define `getExpectedQualityBadge`:
     ```typescript
     function getExpectedQualityBadge(cv: number, isCirclet: boolean = false): 'Subpar' | 'Decent' | 'Good' | 'Great' | 'Godly' {
       if (isCirclet) {
         if (cv >= 35.0) return 'Godly';
         if (cv >= 30.0) return 'Great';
         if (cv >= 20.0) return 'Good';
         if (cv >= 10.0) return 'Decent';
         return 'Subpar';
       }
       if (cv >= 50.0) return 'Godly';
       if (cv >= 40.0) return 'Great';
       if (cv >= 30.0) return 'Good';
       if (cv >= 20.0) return 'Decent';
       return 'Subpar';
     }
     ```
   - Lines 27–33 define `getExpectedBuildCVTier`:
     ```typescript
     function getExpectedBuildCVTier(totalCv: number): 'Subpar' | 'Decent' | 'Good' | 'Great' | 'Godly' {
       if (totalCv >= 240.0) return 'Godly';
       if (totalCv >= 220.0) return 'Great';
       if (totalCv >= 180.0) return 'Good';
       if (totalCv >= 140.0) return 'Decent';
       return 'Subpar';
     }
     ```
   - Lines 35–43 define `deriveVisualRollPips`:
     ```typescript
     function deriveVisualRollPips(rolls: number, maxPips: number = 5): string {
       const boundedRolls = Math.max(1, Math.min(rolls, 6));
       if (boundedRolls === 6) {
         return '●●●●●★';
       }
       const active = '●'.repeat(boundedRolls);
       const inactive = '○'.repeat(Math.max(0, maxPips - boundedRolls));
       return `${active}${inactive}`;
     }
     ```
   - Lines 98–100: `calculateCritValue(7.8, 21.8)` evaluates to `37.4` ($2 \times 7.8 + 21.8$).
   - Lines 103–106: `pieceCvs = [37.4, 43.8, 28.0, 38.8, 24.8]` sums to `172.8`, returning `'Decent'` for build CV tier.
   - Lines 117–123: Circlet piece with `35.8` CV returns `'Godly'`.
   - Lines 125–130: Hu Tao sheet CV ($2 \times 91.2 + 202.3$) evaluates to `384.7`.
   - Lines 135–167: Substat rolls test `cr` 3.9% (`●○○○○`, 1 roll), `cr` 10.5% (`●●●○○`, 3 rolls), `cd` 28.0% (`●●●●○`, 4 rolls), `cd` 35.0% (`●●●●●`, 5 rolls), `atk` 33 (`●●○○○`, 2 rolls), `hp` 508 (`●●○○○`, 2 rolls).
   - Lines 198–203: 46.6% CD substat returns $\ge 6$ rolls, generating `'●●●●●★'`.
   - Lines 181–186: Clamps negative inputs `calculateCritValue(-5.0, -10.0)` to 0.

2. **Domain Models in `src/lib/enka/types.ts`**:
   - Line 100: `export type QualityBadge = 'Subpar' | 'Decent' | 'Good' | 'Great' | 'Godly';`
   - Lines 174–179: `ArtifactSubStat` includes optional `rolls?: number;` and `pips?: string;`.
   - Lines 203–204: `Artifact` includes optional `cv?: number;` and `qualityBadge?: QualityBadge;`.
   - Lines 274–275: `Character` includes optional `totalCv?: number;` and `qualityBadge?: QualityBadge;`.

3. **Current State in `src/lib/enka/static-data.ts`**:
   - Lines 129–140 provide `SUBSTAT_ROLLS` for 10 substats with 4 tiers each.
   - Lines 174–180 compute naive roll count:
     `export function estimateRollCount(statKey: string, value: number): number { const avgRoll = ...; return Math.round(value / avgRoll); }`
   - Lines 183–185: `export function calculateCritValue(cr: number, cd: number): number { return cr * 2 + cd; }` (currently lacks negative clamping and rounding).
   - Currently missing: `getQualityBadge`, `getBuildCVTier`, and `deriveVisualRollPips`.

4. **Current State in `src/lib/enka/parser.ts`**:
   - In `parseArtifacts` (lines 201–252), `subStats` computes `rolls: estimateRollCount(...)`, but fails to attach `pips`.
   - The returned `Artifact` object fails to attach `cv` and `qualityBadge`.
   - In `parseAvatarInfo` (lines 87–106 and 111–132), the returned `Character` object fails to attach `totalCv` and `qualityBadge`.

---

## 2. Logic Chain

1. **Crit Value Formula**:
   - By Observation 1 (`calculations.test.ts:98`) and Observation 3 (`static-data.ts:183`), universal piece CV is $2 \times \text{CR} + \text{CD}$.
   - By Observation 1 (`calculations.test.ts:181-186`), negative inputs must be guarded with `Math.max(0, cr) * 2 + Math.max(0, cd)`.
   - By Observation 1 (`calculations.test.ts:205-212`), values must be strictly rounded to 1 decimal place (`parseFloat(cv.toFixed(1))`) to prevent IEEE 754 floating-point drift (e.g. `15.55` formatted to `15.6`).

2. **Quality Badge Derivations**:
   - By Observation 1 (`calculations.test.ts:12-25`), non-circlet pieces use thresholds 20, 30, 40, 50.
   - By Observation 1 (`calculations.test.ts:13-19, 117-123`), circlet pieces use thresholds 10, 20, 30, 35 because mainstat Crit Rate/DMG excludes having that stat as a substat, cutting maximum attainable substat CV in half.
   - By Observation 1 (`calculations.test.ts:27-33, 106`), whole build CV is the sum of all 5 equipped piece CVs, evaluated on thresholds 140, 180, 220, 240.

3. **Substat Roll Bounding**:
   - By Observation 3, naive division `Math.round(value / avgRoll)` produces 7 rolls on 46.6% CD ($46.6 / 6.605 = 7.055$). In Genshin Impact, a 5★ artifact can have at most 1 base roll + 5 upgrade rolls = 6 rolls.
   - Furthermore, 3 minimum rolls of CR ($3 \times 2.72 = 8.16$) would be miscalculated as 2 rolls by naive division ($8.16 / 3.305 = 2.469$), which violates the physical max of 2 rolls ($2 \times 3.89 = 7.78 < 8.16$).
   - Therefore, bounded search must bound $k \in [1..6]$ and enforce $V \le k \times \text{maxRoll} + \epsilon$ and $V \ge k \times \text{minRoll} - \epsilon$.

4. **Visual Roll Pips**:
   - By Observation 1 (`calculations.test.ts:35-43`), `deriveVisualRollPips(rolls)` returns `'●○○○○'` through `'●●●●●'` for rolls 1 to 5, and `'●●●●●★'` for roll 6.
   - Attaching this directly to `subStat.pips` satisfies `ArtifactSubStat.pips` in `types.ts:178`.

5. **Parser Ingestion Pipeline**:
   - By Observation 2 & 4, integrating these functions in `parser.ts` enriches `ArtifactSubStat` with `pips`, `Artifact` with `cv` and `qualityBadge`, and `Character` with `totalCv` and `qualityBadge`.

---

## 3. Caveats

1. **Zero-Touch Constraint (`src/app/page.tsx`)**:
   - Per `PROJECT.md` §14 and `ORIGINAL_REQUEST.md` §R5, `src/app/page.tsx` must remain completely untouched (exact 219 lines, 10,531 chars, identical SHA-256 hash).
2. **Stat Normalization Coordination (Milestone 2 Explorer 1)**:
   - Explorer 1 is handling the 100x multiplication bug fix so that `sub.value` is stored as normalized percentage numbers (e.g. `7.8` instead of `0.078`).
   - The blueprints provided in `analysis.md` defensively check `val <= 1.0 ? val * 100 : val`, ensuring mathematical accuracy regardless of whether raw fractions or pre-normalized values are processed.
3. **Empty Substats & Off-Piece Artifacts**:
   - Artifacts with 0 crit substats correctly receive `cv: 0.0` and `qualityBadge: 'Subpar'`.
   - Missing artifact slots (e.g. character equipped with only 4 pieces) safely default missing pieces to 0 CV when summing `totalCv`.

---

## 4. Conclusion

The specification for Milestone 2 (Universal CV, Quality Badges, Bounded Roll Counts, and Visual Pips) is complete, unambiguous, and 100% verified against `tests/e2e/calculations.test.ts`:
1. `calculateCritValue`, `estimateRollCount`, `deriveVisualRollPips`, `getQualityBadge`, and `getBuildCVTier` should be implemented in `src/lib/enka/static-data.ts`.
2. `parseArtifacts` in `src/lib/enka/parser.ts` should populate `subStat.pips`, `artifact.cv`, and `artifact.qualityBadge`.
3. `parseAvatarInfo` in `src/lib/enka/parser.ts` should populate `character.totalCv` and `character.qualityBadge`.
4. Exact code blueprints and comprehensive edge case matrices have been written to `analysis.md`.

---

## 5. Verification Method

Once implemented by the downstream Worker agent:

1. **Run Unit & E2E Calculation Tests**:
   ```powershell
   node ./node_modules/vitest/vitest.mjs run tests/e2e/calculations.test.ts
   ```
   **Expected**: 23/23 tests pass (Tier 1 & Tier 2).

2. **Run Full Test Suite**:
   ```powershell
   node ./node_modules/vitest/vitest.mjs run
   ```
   **Expected**: 105/105 tests pass.

3. **Verify Clean TypeScript Compilation**:
   ```powershell
   npx tsc --noEmit
   ```
   **Expected**: Exit code 0, 0 type errors.

4. **Verify Fixture Integrity**:
   Inspect parsed output of `tests/fixtures/enka-response.json` (Hu Tao Flower CV = 37.4, 'Good') and `tests/fixtures/varesa-1813164100.json` (Varesa Flower CV = 42.8, 'Great'; Plume CV = 43.6, 'Great'; Total CV = 178.0, 'Decent').
