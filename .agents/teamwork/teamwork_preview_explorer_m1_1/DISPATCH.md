## 2026-11-01T12:51:00Z
You are Explorer 1 for Milestone 1 (Game Metadata & Types) of the genshin-leaderboard overhaul.

Your working directory is:
d:\games\projects\genshin-leaderboard\.agents\teamwork\teamwork_preview_explorer_m1_1

MANDATORY: You MUST read:
1. d:\games\projects\genshin-leaderboard\.agents\teamwork\ORIGINAL_REQUEST.md
2. d:\games\projects\genshin-leaderboard\.agents\teamwork\PROJECT.md
3. d:\games\projects\genshin-leaderboard\.agents\teamwork\teamwork_preview_spec_miner_survey_2\analysis.md

Objective:
Investigate and design the exact TypeScript type definitions and schema extensions in `src/lib/enka/types.ts`:
1. Detail the precise additions to `Artifact` (adding `setBonusText`, `cv`, `qualityBadge`, `pips`).
2. Detail the additions to `Weapon` (adding `passiveName`, `passiveDescription`, and refinement scaling fields).
3. Detail the additions to `TalentLevels` (adding `boosted?: { normal?: boolean; skill?: boolean; burst?: boolean; }`).
4. Detail the additions to `Character` and `AvatarInfoSchema` (ensuring `proudSkillExtraLevelMap` or equivalent is accepted).
5. Ensure zero breaking changes to existing tests and components.

Write your report to:
`d:\games\projects\genshin-leaderboard\.agents\teamwork\teamwork_preview_explorer_m1_1\analysis.md`
and handoff to:
`d:\games\projects\genshin-leaderboard\.agents\teamwork\teamwork_preview_explorer_m1_1\handoff.md`
Send a message when done.
