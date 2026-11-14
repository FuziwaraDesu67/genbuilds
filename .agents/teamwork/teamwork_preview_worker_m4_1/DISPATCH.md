## 2026-11-01T15:38:43Z

You are the Implementation Worker for Milestone 4: Artifact Detail & Roll Analysis Grid (R4).

Your working directory is:
d:\games\projects\genshin-leaderboard\.agents\teamwork\teamwork_preview_worker_m4_1

MANDATORY: You MUST read:
1. d:\games\projects\genshin-leaderboard\.agents\teamwork\ORIGINAL_REQUEST.md
2. d:\games\projects\genshin-leaderboard\.agents\teamwork\PROJECT.md
3. Blueprint 1 (Active Set Bonuses Banner & Component Architecture): d:\games\projects\genshin-leaderboard\.agents\teamwork\teamwork_preview_explorer_m4_1\analysis.md
4. Blueprint 2 (5-Piece Artifact Card & Stat Formatting): d:\games\projects\genshin-leaderboard\.agents\teamwork\teamwork_preview_explorer_m4_2\analysis.md
5. Blueprint 3 (Roll Analysis Pips & Piece CV Badges): d:\games\projects\genshin-leaderboard\.agents\teamwork\teamwork_preview_explorer_m4_3\analysis.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Scope & Exclusive Write Ownership:
You own exclusively:
- `src/components/character/ArtifactDisplay.tsx`
- `src/components/character/CharacterDetailModal.tsx`

Features to Implement:
1. In `src/components/character/ArtifactDisplay.tsx`:
   - `ActiveSetBonusesBanner`:
     - Prominently display all active 2-piece (luminous cyan) and 4-piece (radiant amber) set bonuses for equipped artifacts.
     - Render set name, piece counts (`Obsidian Codex (4-Piece Set)` or `2-Piece Set`), and full in-game skill text (`setBonusText.twoPiece`, `setBonusText.fourPiece`).
     - Graceful fallback for mixed/rainbow builds without active set bonuses.
   - `ArtifactPieceCard`:
     - 5-piece slot representation: Flower, Plume, Sands, Goblet, Circlet with slot icons, piece name, set name, +level (`+20`), rarity stars (`★★★★★`), and watermark relic icon.
     - Main stat: large high-contrast display (`text-2xl font-black font-mono text-cyan-300`), correct stat formatting (`XX.X%` for percentages, flat integer strings like `4780` for flat HP/ATK/DEF).
     - Substats: clean tabular list with formatted values.
     - Roll Analysis Visual Pips: Monospace tabular alignment (`min-w-[5.2rem]`), rendering `[●○○○○]` through `[●●●●●]` and `[●●●●●★]`, with roll count highlighting and tooltip.
     - Piece CV Rating: Universal Crit Value ($2 \times \text{CR} + \text{CD}$ from substats) with dual-scale Quality Badges (Standard 50/40/30/20 vs Circlet 35/30/20/10: `Subpar`, `Decent`, `Good`, `Great`, `Godly`) with tier-specific gradient badges and glowing borders.
   - `ArtifactsGrid`:
     - Canonical slot ordering: `flower` → `plume` → `sands` → `goblet` → `circlet`.
     - Responsive grid layout (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4`).
     - Option to include `ActiveSetBonusesBanner` at top.
   - Polymorphic Default Export `ArtifactDisplay`:
     - If passed `{ artifact: Artifact }`, render `ArtifactPieceCard` (preserving 100% backward compatibility with existing tests in `tests/e2e/e2e-showcase.test.ts`).
     - If passed `{ artifacts: Artifact[] }`, render `ArtifactsGrid`.
2. In `src/components/character/CharacterDetailModal.tsx`:
   - Seamlessly integrate `ActiveSetBonusesBanner` and `ArtifactsGrid` in the Artifacts tab.
3. Tests:
   - Add/update tests in `tests/e2e/m4-artifacts-grid.test.ts` to thoroughly verify all R4 requirements.

STRICT BOUNDARY:
- NEVER touch `src/app/page.tsx` (R5 constraint).

Verification Requirements:
1. Run `npx tsc --noEmit` — must exit with 0 errors.
2. Run `npx vitest run` — all test suites must pass (100% pass rate).
3. Document exact terminal command lines and full output summaries in your handoff report.
