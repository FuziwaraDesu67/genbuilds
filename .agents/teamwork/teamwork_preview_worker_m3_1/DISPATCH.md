## 2026-11-01T15:00:40Z

You are the Implementation Worker for Milestone 3: Character Showcase & Build Card Redesign (R3).

Your working directory is:
d:\games\projects\genshin-leaderboard\.agents\teamwork\teamwork_preview_worker_m3_1

MANDATORY: You MUST read:
1. d:\games\projects\genshin-leaderboard\.agents\teamwork\ORIGINAL_REQUEST.md
2. d:\games\projects\genshin-leaderboard\.agents\teamwork\PROJECT.md
3. Blueprint 1 (Visual Foundation, Elemental Glassmorphism, Avatar Glow Frame & C0-C6): d:\games\projects\genshin-leaderboard\.agents\teamwork\teamwork_preview_explorer_m3_1\analysis.md
4. Blueprint 2 (Refined Weapon Card R1-R5 & Circular Talent Badges +3 Boost): d:\games\projects\genshin-leaderboard\.agents\teamwork\teamwork_preview_explorer_m3_2\analysis.md
5. Blueprint 3 (Key Attributes Panel, Build CV Tier Badge & Active Set Bonus Chips): d:\games\projects\genshin-leaderboard\.agents\teamwork\teamwork_preview_explorer_m3_3\analysis.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Scope & Exclusive Write Ownership:
You own exclusively:
- `src/components/character/CharacterCard.tsx`
- `src/components/profile/ProfileClient.tsx`
- `src/components/character/CharacterDetailModal.tsx`

Features to Implement:
1. In `CharacterCard.tsx`:
   - High-contrast elemental glassmorphism (`bg-slate-900/85 backdrop-blur-xl`, subtle border, multi-layer glow shadow per Pyro, Hydro, Anemo, Electro, Dendro, Cryo, Geo using `ELEMENT_THEMES` adhering strictly to `#FF6B2C` for Pyro and `#9B59D6` for Electro).
   - Avatar Visual Frame: Avatar image with elemental ambient glow halo, star rarity (`★★★★★`/`★★★★`), exact `Lv.{character.level}` formatting, friendship badge, and element icon.
   - Constellation Node Indicators: Elemental `C0`–`C6` pill badge paired with an interactive 6-node progress track (illuminated gems with bloom for active $1..C$, dimmed circles for $C+1..6$).
   - Refined Weapon Card: Weapon icon, name, level, prominent amber/gold refinement badge (`R1` through `R5`), base ATK badge (`Base ATK 608`), formatted substat badge (e.g., `CRIT DMG 55.1%`), and interactive popover/tooltip disclosing full `weapon.passiveDescription`.
   - Circular Talent Badges: 3 circular badges for NA, Skill, and Burst (`talents.normal`, `skill`, `burst`), with radiant luminous `+3` tag (cyan/amber glow) when constellation-boosted (`talents.boosted?.normal`, `skill`, `burst`), and crown indicator for level 10+.
   - Key Attribute Breakdown Panel: High-contrast 7-stat grid (Max HP, ATK, DEF, EM, ER, Crit Ratio with inline `1:X.X` ratio, and Elemental DMG bonus) preserving exact string values for E2E assertions (`1,945`, `65.4% / 188.4%`, `160`, `125.0%`).
   - Build CV Tier Badge: Displaying total artifact Crit Value (`totalCv`, e.g. `178.0 CV`) and styled quality tier badge (`Decent`, `Good`, `Great`, `Godly`) with tooltip.
   - Active Set Bonus Chips: Render 2-piece and 4-piece set bonus chips (e.g. `Obsidian Codex (4)`) with interactive hover/click popovers displaying complete `setBonusText.twoPiece` and `fourPiece`.
2. In `ProfileClient.tsx`:
   - Enhance showcase styling, ensuring responsive grid and clean presentation of the overhauled `CharacterCard` components.
3. In `CharacterDetailModal.tsx`:
   - Ensure seamless alignment with the overhauled visual components and themes.

STRICT BOUNDARY:
- NEVER touch `src/app/page.tsx` (R5 constraint).

Verification Requirements:
1. Run `npx tsc --noEmit` — must exit with 0 errors.
2. Run `npx vitest run` — all 12 test suites must pass (390+ tests, 0 failures).
3. Document exact terminal command lines and full output summaries in your handoff report.

Write your handoff report following the Handoff Protocol to:
`d:\games\projects\genshin-leaderboard\.agents\teamwork\teamwork_preview_worker_m3_1\handoff.md`
Send a message when complete.
