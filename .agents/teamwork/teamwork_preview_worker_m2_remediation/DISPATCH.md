## 2026-11-01T14:38:57Z
You are the Remediation Worker for Milestone 2 (Test Harness CommonJS/ESM Import Fix).

Your working directory is:
d:\games\projects\genshin-leaderboard\.agents\teamwork\teamwork_preview_worker_m2_remediation

MANDATORY: You MUST read:
1. d:\games\projects\genshin-leaderboard\.agents\teamwork\ORIGINAL_REQUEST.md
2. d:\games\projects\genshin-leaderboard\.agents\teamwork\PROJECT.md
3. Challenger 2 Handoff: d:\games\projects\genshin-leaderboard\.agents\teamwork\teamwork_preview_challenger_m2_2\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Scope & Exclusive Write Ownership:
You own exclusively the following 6 test files:
1. `tests/artifact-set-data.test.ts`
2. `tests/weapon-data.test.ts`
3. `tests/talent-boost.test.ts`
4. `tests/talent-boost-adversarial.test.ts`
5. `tests/adversarial-m1.test.ts`
6. `tests/adversarial-m2.test.ts`

Objective:
1. Challenger 2 discovered that running global `npx vitest run` fails with `Error: No test suite found in file` across these 6 test files because `package.json` does not specify `"type": "module"`, causing Vite to transpile `import { describe, it, expect } from 'vitest'` to CommonJS `require('vitest')`, which throws at runtime (`Vitest cannot be imported in a CommonJS module using require()`).
2. Replace `import { describe, it, expect } from 'vitest';` in each of these 6 files with:
   `/// <reference types="vitest/globals" />`
   (matching the approach in `tests/e2e/calculations.test.ts`, `tests/e2e/e2e-showcase.test.ts`, `tests/e2e/metadata.test.ts`, and `tests/adversarial-m2-uid1813164100.test.ts`).
   If any file imports `beforeEach`, `afterEach`, or `vi` from `'vitest'`, ensure they are also provided by vitest globals or typed references.
3. STRICT BOUNDARY:
   - NEVER touch `src/app/page.tsx` (R5 constraint).
   - DO NOT alter any implementation files in `src/`.

Verification Requirements:
1. Run `npx tsc --noEmit` — must exit with 0 errors.
2. Run `npx vitest run` across the entire repository — every test file MUST run and pass (100% of test files passing, 0 failed).
3. Document exact terminal command lines and full output summaries in your handoff report.

Write your handoff report to:
`d:\games\projects\genshin-leaderboard\.agents\teamwork\teamwork_preview_worker_m2_remediation\handoff.md`
Send a message when complete.
