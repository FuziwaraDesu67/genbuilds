## 2026-11-01T13:40:41Z
You are the Remediation Implementation Worker for Milestone 1 (Iteration 2).

Your working directory is:
d:\games\projects\genshin-leaderboard\.agents\teamwork\teamwork_preview_worker_m1_remediation

MANDATORY: You MUST read:
1. d:\games\projects\genshin-leaderboard\.agents\teamwork\ORIGINAL_REQUEST.md
2. d:\games\projects\genshin-leaderboard\.agents\teamwork\PROJECT.md
3. Remediation Blueprint: d:\games\projects\genshin-leaderboard\.agents\teamwork\teamwork_preview_explorer_m1_remediation\analysis.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Scope & Exclusive Write Ownership:
Apply the exact fixes specified in the Remediation Blueprint:
1. `src/lib/enka/talent-boost-data.ts`:
   - Map `10000096: { c3: 'normal', c5: 'burst' }` (Arlecchino).
   - Map `10000093: { c3: 'burst', c5: 'skill' }` (Xianyun).
   - Update Natlan character comment annotations.
2. `tests/talent-boost.test.ts` and `tests/e2e/metadata.test.ts`:
   - Update Arlecchino test assertions to use ID `10000096`.
   - Add explicit test assertion for Xianyun ID `10000093`.
3. `src/lib/enka/artifact-set-data.ts`:
   - Remove the 5 colliding alias IDs: `15029` from Unfinished Reverie, `15006` from Crimson Witch, `15004` from Blizzard Strayer, `15001` from Gladiator's Finale, and `150090` from Husk of Opulent Dreams.
   - Fix Thundersoother line 248 4pc text: change "Pyro" to "Electro".
4. `src/lib/enka/weapon-data.ts`:
   - Implement the refinement interpolation helper and overrides so all 57 weapons have complete, authentic, pre-rendered R1 through R5 descriptions with ZERO unrendered template variables or curly braces.
5. `src/lib/enka/parser.ts`:
   - Update line 183 to verify `passiveById.passiveName` before falling back to name lookup, fixing the truthy `{}` short-circuit.

STRICT BOUNDARY:
- NEVER touch `src/app/page.tsx` (R5 constraint).
- DO NOT touch UI components.

Verification Requirements:
1. Run `npx tsc --noEmit` — must exit with 0.
2. Run `npx vitest run` — all 10 test files must pass with 0 failures.
3. Verify zero unrendered weapon passive placeholders:
   `node -e "const { WEAPON_LIST, getWeaponPassive } = require('./src/lib/enka/weapon-data.ts'); let b = 0; WEAPON_LIST.forEach(w => { for (let r = 1; r <= 5; r++) { const p = getWeaponPassive(w.id, r); if (!p.passiveDescription || p.passiveDescription.includes('{') || p.passiveDescription.includes('}')) b++; } }); console.log('Broken instances:', b);"`
   Must report `Broken instances: 0`.

Write your handoff report to:
`d:\games\projects\genshin-leaderboard\.agents\teamwork\teamwork_preview_worker_m1_remediation\handoff.md`
Send a message when complete.
