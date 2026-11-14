## 2026-11-01T13:00:20Z

You are the Implementation Worker for Milestone 1: Game Metadata & Skills Ingestion (R1).

Your working directory is:
d:\games\projects\genshin-leaderboard\.agents\teamwork\teamwork_preview_worker_m1_1

MANDATORY: You MUST read the authoritative user request at:
d:\games\projects\genshin-leaderboard\.agents\teamwork\ORIGINAL_REQUEST.md
and the project roadmap at:
d:\games\projects\genshin-leaderboard\.agents\teamwork\PROJECT.md
before starting any implementation work.

You MUST also read the detailed analysis blueprints provided by the three Milestone 1 Explorers:
1. Types & Schema: d:\games\projects\genshin-leaderboard\.agents\teamwork\teamwork_preview_explorer_m1_1\analysis.md
2. Artifact Set Skills Data: d:\games\projects\genshin-leaderboard\.agents\teamwork\teamwork_preview_explorer_m1_2\analysis.md
3. Weapon Metadata & Talent Boost Data: d:\games\projects\genshin-leaderboard\.agents\teamwork\teamwork_preview_explorer_m1_3\analysis.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Scope & Exclusive Write Ownership:
You own exclusively the following files:
- `src/lib/enka/types.ts` (extend domain models per explorer 1 blueprint: retain `setId: number` on `Artifact`, keep `talents.normal`, `skill`, `burst` as numbers and add `boosted?: { normal?: boolean; skill?: boolean; burst?: boolean }`, extend `Weapon` with `passiveName?: string; passiveDescription?: string`)
- `src/lib/enka/artifact-set-data.ts` (implement full 50-set catalog with 2pc and 4pc descriptions and robust lookup helpers)
- `src/lib/enka/weapon-data.ts` (implement master 52-weapon catalog with R1-R5 scaling and robust `getWeaponPassive`)
- `src/lib/enka/talent-boost-data.ts` (implement `evaluateTalentBoosts` supporting Fontaine/Natlan C3/C5 logic)
- `src/lib/enka/static-data.ts` (re-export metadata and helpers cleanly with backward compatibility)
- `src/lib/enka/index.ts` (re-export all new modules)
- `src/lib/enka/parser.ts` (wire up setBonusText in parseArtifacts, weapon passives in parseWeapon, and talent boost flags in parseTalents; fix Ayaka skill order sorting)
- `tests/artifact-set-data.test.ts`
- `tests/weapon-data.test.ts`
- `tests/talent-boost.test.ts`

STRICT BOUNDARY:
- NEVER touch `src/app/page.tsx` (R5 constraint).
- DO NOT edit UI components in this milestone (that is Milestone 3/4).

Verification Requirements:
1. Run TypeScript check: `npx tsc --noEmit`
2. Run Vitest test suites: `npx vitest run`
3. Document exact terminal commands and results in your handoff report.

Write your handoff report following the Handoff Protocol to:
`d:\games\projects\genshin-leaderboard\.agents\teamwork\teamwork_preview_worker_m1_1\handoff.md`
Send a message to the Project Orchestrator when complete.
