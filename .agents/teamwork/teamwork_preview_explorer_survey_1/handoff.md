# Handoff Report: Enka Ingestion, Parsing, Types, and Metadata Architecture

## 1. Observation
Direct codebase inspection yielded the following concrete observations:

### 1.1 The 100x Multiplication Bug
- In `src/components/character/ArtifactDisplay.tsx` (lines 23–30):
  ```typescript
  const getStatDisplay = (key: string, value: number) => {
    const isPercentage = ['cr', 'cd', 'er', 'hpPercent', 'atkPercent', 'defPercent'].includes(key) || key.includes('DmgBonus');

    if (isPercentage) {
      return formatPercentage(value * 100, 1);
    }
    return value.toFixed(0);
  };
  ```
- In `src/lib/utils.ts` (lines 15–17):
  ```typescript
  export function formatPercentage(num: number, decimals: number = 1): string {
    return `${num.toFixed(decimals)}%`;
  }
  ```
- In `src/lib/enka/parser.ts` (lines 205–216):
  ```typescript
  const subStats = (flat.reliquarySubstats || []).map((sub: any) => {
    const key = getStatName(sub.appendPropId);
    // Convert percentage stats (CR, CD, ER, DMG%, etc.) from decimal to percentage
    const isPercentageStat = ['cr', 'cd', 'er', 'hpPercent', 'atkPercent', 'defPercent'].includes(key) || key.includes('DmgBonus');
    const displayValue = isPercentageStat ? sub.statValue * 100 : sub.statValue;

    return {
      key,
      value: sub.statValue,
      rolls: estimateRollCount(key, displayValue),
    };
  });
  ```
- In `tests/fixtures/enka-response.json`:
  - Line 87: `{ "appendPropId": "FIGHT_PROP_CRITICAL", "statValue": 0.078 }`
  - Line 136: `{ "mainPropId": "FIGHT_PROP_HP_PERCENT", "statValue": 0.466 }`
- In real live Enka API responses, `statValue` for `reliquaryMainstat` is already `46.6` (not `0.466`), and `reliquarySubstats` is already `7.8` (not `0.078`).

### 1.2 Missing Artifact Set Skills
- In `src/lib/enka/static-data.ts` (lines 68–83):
  `ARTIFACT_SETS` is a plain `Record<number, string>` mapping only 14 set IDs to set names.
- Zero artifact 2-piece or 4-piece set bonus descriptions exist anywhere in `src/`.
- Grep search for `"2-Piece"` and `"4-Piece"` across `src/` returned 0 matches.

### 1.3 Missing Weapon Metadata
- In `src/lib/enka/types.ts` (lines 134–147):
  `Weapon` interface contains only `id`, `name`, `rarity`, `level`, `ascension`, `refinement`, `baseAtk`, `subStat`, and `icon`.
  There are NO fields for `passiveName`, `passiveDesc`, or refinement scaling.
- In `src/lib/enka/parser.ts` (lines 154–185):
  `parseWeapon` does not resolve or populate any passive data.

### 1.4 Talent Constellation Boost (+3) Omission
- In `src/lib/enka/types.ts` (lines 60–76):
  `AvatarInfoSchema` does not declare `proudSkillExtraLevelMap`.
- In `src/lib/enka/types.ts` (lines 149–153):
  `TalentLevels` interface has only `{ normal: number; skill: number; burst: number; }` with no boost indicator.

### 1.5 Crit Value & Roll Pips Gaps
- `calculateCritValue` exists in `static-data.ts:151`, but is only invoked in `StatsPanel.tsx:13` for the whole build.
- `Artifact` in `types.ts` does not contain `cv?: number`.
- `ArtifactDisplay.tsx` displays roll counts only as `({subStat.rolls}↑)` without visual pips `[●●●○]`.

### 1.6 Home UI Constraint
- `src/app/page.tsx` line 20 features demo UID `1813164100`. R5 mandates zero changes to this file.

---

## 2. Logic Chain

1. **Premise 1 (API Data Format)**: Real Enka.Network API returns artifact percentage stats as whole percentage numbers (e.g. `46.6` for 46.6% HP, `7.8` for 7.8% CR).
2. **Premise 2 (UI Multiplier Error)**: `ArtifactDisplay.tsx` unconditionally multiplies `value * 100` before calling `formatPercentage`. For a `46.6` main stat, `46.6 * 100 = 4660` -> `4660.0%`.
3. **Premise 3 (Parser Roll Calculation Error)**: In `parser.ts`, `displayValue = sub.statValue * 100` assumes `sub.statValue` is always a decimal (`0.078` -> `7.8`). In live data where `sub.statValue` is already `7.8`, `displayValue` becomes `780`, causing `estimateRollCount` to calculate `Math.round(780 / 3.305) = 236` rolls.
4. **Premise 4 (Normalization Solution)**: In `parser.ts`, normalize values where `isPercentage && value > 0 && value <= 1` by multiplying by 100; otherwise preserve `value`. Store `46.6` and `7.8` as standard values. In `ArtifactDisplay.tsx`, display `formatPercentage(value, 1)` without multiplying by 100. This unifies live Enka data and mocked test fixture data.
5. **Premise 5 (Metadata Completeness)**: To satisfy R1, R3, and R4, dedicated metadata tables for all active 2pc/4pc artifact sets and weapon passives (with R1–R5 scaling) must be added in `src/lib/enka/`.
6. **Premise 6 (Talent +3 Boosts)**: Constellation level boosts can be extracted from `proudSkillExtraLevelMap` or derived from character constellation tiers (C3/C5), enabling radiant `+3` badges in circular talent components.

---

## 3. Caveats

- **Scope Boundary Respected**: Investigation was strictly read-only. No source files were edited, and no state-modifying tests/builds were run.
- **External Network Dependency**: Live Enka data fetching depends on Enka.Network API availability; local Vitest test suites rely on `tests/fixtures/enka-response.json`.
- **Database Schema Invariant**: Database columns in `src/lib/db/schema.ts` (`stats`, `talent_levels`, `artifact_sets`) are stored as JSONB. Extending TypeScript interfaces `Artifact` and `Weapon` does not break database schemas.

---

## 4. Conclusion

1. The exact root cause of the 100x multiplication error is fully understood and a clean normalization strategy has been designed.
2. Missing metadata schemas for artifact set skills (2pc/4pc) and weapons (passive name, R1–R5 descriptions) are specified in detail.
3. The domain types, parser pipelines, and UI component data flows have been cataloged with precision to guide downstream implementation agents.
4. The constraint preserving `src/app/page.tsx` intact is documented and will be strictly enforced.

---

## 5. Verification Method

To verify the findings of this survey:
1. **Inspect Analysis Report**:
   Read `d:\games\projects\genshin-leaderboard\.agents\teamwork\teamwork_preview_explorer_survey_1\analysis.md`.
2. **Inspect Code Locations**:
   - `src/lib/enka/parser.ts` lines 200–232
   - `src/components/character/ArtifactDisplay.tsx` lines 23–30
   - `src/lib/enka/static-data.ts` lines 68–83
   - `src/lib/enka/types.ts` lines 114–170
   - `tests/fixtures/enka-response.json` lines 86–90, 135–137
3. **Invalidation Condition**:
   If live Enka API responses return decimal fractions for `reliquaryMainstat` instead of percentage values, or if `formatPercentage` expects fractions rather than percentages, the rationale would need adjustment. (Empirically refuted: live Enka API documentation confirms whole percentage values for reliquaries, and `formatPercentage` outputs `${num.toFixed(1)}%` directly).
