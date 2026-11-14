## 2026-11-01T14:12:53Z
You are the Implementation Worker for Milestone 2: Core Mathematical & Stat Formatting Fixes (R2).

Your working directory is:
d:\games\projects\genshin-leaderboard\.agents\teamwork\teamwork_preview_worker_m2_1

MANDATORY: You MUST read:
1. d:\games\projects\genshin-leaderboard\.agents\teamwork\ORIGINAL_REQUEST.md
2. d:\games\projects\genshin-leaderboard\.agents\teamwork\PROJECT.md
3. Blueprint 1 (Stat Normalization & 100x fix): d:\games\projects\genshin-leaderboard\.agents\teamwork\teamwork_preview_explorer_m2_1\analysis.md
4. Blueprint 2 (CV, Quality Badges, Bounded Rolls & Pips): d:\games\projects\genshin-leaderboard\.agents\teamwork\teamwork_preview_spec_miner_m2_2\analysis.md
5. Blueprint 3 (UID 1813164100 Fallback & SSR): d:\games\projects\genshin-leaderboard\.agents\teamwork\teamwork_preview_explorer_m2_3\analysis.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Scope & Exclusive Write Ownership:
1. `src/lib/enka/static-data.ts`:
   - Implement `calculateCritValue(cr: number, cd: number): number`: guard negative inputs to 0, return `parseFloat((cr * 2 + cd).toFixed(1))`.
   - Implement `getQualityBadge(cv: number, isCirclet: boolean = false): QualityBadge`:
     - Standard: <20 Subpar, 20-29.9 Decent, 30-39.9 Good, 40-49.9 Great, >=50 Godly.
     - Circlet: <10 Subpar, 10-19.9 Decent, 20-29.9 Good, 30-34.9 Great, >=35 Godly.
   - Implement `getBuildCVTier(totalCv: number): QualityBadge`:
     - <140 Subpar, 140-179.9 Decent, 180-219.9 Good, 220-239.9 Great, >=240 Godly.
   - Implement `estimateRollCount(statKey: string, value: number): number` with bounded checks $k \in [1..6]$ per blueprint 2.
   - Implement `deriveVisualRollPips(rolls: number, maxPips: number = 5): string`: 1-5 rolls -> `●` and `○` (e.g. `●○○○○`, `●●●●●`), 6 rolls -> `●●●●●★`.
2. `src/lib/enka/parser.ts`:
   - Implement `normalizeArtifactStat(key: string, val: number): number`: if percentage stat (`cr`, `cd`, `er`, `hpPercent`, `atkPercent`, `defPercent`, DMG bonuses, `healingBonus`), if `val > 0 && val <= 1.0` then `val * 100`, otherwise `val`.
   - In `parseArtifacts`: normalize `mainStat.value` and `subStats[].value`. Attach `rolls` and `pips` to each `subStat`. Calculate artifact piece `cv` ($2 \times \text{CR} + \text{CD}$ from substats) and `qualityBadge` and attach them to `Artifact`.
   - In `parseCharacter`: calculate `totalCv` (sum of 5 equipped pieces CVs) and `qualityBadge` and attach to `Character`.
3. `src/components/character/ArtifactDisplay.tsx`:
   - In `getStatDisplay`: remove `value * 100`. Call `formatPercentage(value, 1)` directly so `46.6` renders as `46.6%`, NOT `4660.0%`. Add `healingBonus` to percentage keys.
4. `src/lib/enka/client.ts` & `src/app/api/player/[uid]/route.ts`:
   - Add `DEMO_FALLBACK_UID = '1813164100'` and `getVaresaMockData()` loading `tests/fixtures/varesa-1813164100.json`.
   - When fetching for `DEMO_FALLBACK_UID`, fall back to this data on network failure/rate limiting/offline.
   - In route.ts: exempt `1813164100` from rate limiting and catch errors with fallback.
5. `src/app/u/[uid]/page.tsx` & `src/components/profile/ProfileClient.tsx`:
   - Convert `ProfilePage` to async server component, prefetching `initialData` for `1813164100` and passing to `ProfileClient`.
   - `ProfileClient` accepts `initialData` and initializes with `loading: false` if data provided, enabling full SSR markup.
6. `tests/enka-parser.test.ts`:
   - Ensure all existing unit tests align with normalized stat values (e.g. `mainStat.value: 46.6`, `subStats[0].value: 7.8`).

STRICT BOUNDARY:
- NEVER touch `src/app/page.tsx` (R5 constraint).

Verification Requirements:
1. `npx tsc --noEmit` — 0 errors.
2. `npx vitest run` — all 10 test files pass with 0 failures (specifically check `calculations.test.ts` 23/23 passing).
3. Report exact terminal commands and results in `handoff.md`.
