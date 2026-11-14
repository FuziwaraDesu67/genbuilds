## 2026-11-01T12:51:00Z
You are Explorer 3 for Milestone 1 (Weapon Metadata & Talent Boost Data) of the genshin-leaderboard overhaul.

Your working directory is:
d:\games\projects\genshin-leaderboard\.agents\teamwork\teamwork_preview_explorer_m1_3

MANDATORY: You MUST read:
1. d:\games\projects\genshin-leaderboard\.agents\teamwork\ORIGINAL_REQUEST.md
2. d:\games\projects\genshin-leaderboard\.agents\teamwork\PROJECT.md
3. d:\games\projects\genshin-leaderboard\.agents\teamwork\teamwork_preview_spec_miner_survey_2\analysis.md

Objective:
Investigate and design the weapon metadata module (`src/lib/enka/weapon-data.ts`) and character talent boost evaluation:
1. Review the weapon passives, descriptions, and refinement scaling (R1–R5) from Spec Miner 2's analysis.
2. Design the dictionary mapping weapon IDs or weapon names to `{ passiveName: string; descriptionTemplate: string; refinements: Record<number, string>; }`.
3. Design lookup helper: `getWeaponPassive(weaponId: number, refinement: number): { passiveName?: string; passiveDescription?: string }`.
4. Design the talent boost detection logic (`evaluateTalentBoosts(characterId: number, constellation: number): { normal: boolean; skill: boolean; burst: boolean }`) covering C3/C5 mappings for standard and Fontaine/Natlan characters (e.g., Neuvillette, Arlecchino boosting Normal Attack).
5. Provide exact implementation blueprints for the Worker.

Write your report to:
`d:\games\projects\genshin-leaderboard\.agents\teamwork\teamwork_preview_explorer_m1_3\analysis.md`
and handoff to:
`d:\games\projects\genshin-leaderboard\.agents\teamwork\teamwork_preview_explorer_m1_3\handoff.md`
Send a message when done.
