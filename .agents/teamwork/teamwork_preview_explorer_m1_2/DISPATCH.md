## 2026-11-01T12:51:00Z
You are Explorer 2 for Milestone 1 (Artifact Set Skills Data) of the genshin-leaderboard overhaul.

Your working directory is:
d:\games\projects\genshin-leaderboard\.agents\teamwork\teamwork_preview_explorer_m1_2

MANDATORY: You MUST read:
1. d:\games\projects\genshin-leaderboard\.agents\teamwork\ORIGINAL_REQUEST.md
2. d:\games\projects\genshin-leaderboard\.agents\teamwork\PROJECT.md
3. d:\games\projects\genshin-leaderboard\.agents\teamwork\teamwork_preview_spec_miner_survey_2\analysis.md

Objective:
Investigate and design the artifact set skills module (`src/lib/enka/artifact-set-data.ts` or integrated in `static-data.ts`):
1. Review the 39+ artifact set descriptions provided in Spec Miner 2's analysis.
2. Design a clean data structure mapping set IDs (e.g. 15008, 15020, 15025, 14001, etc.) to `{ name: string; twoPiece: string; fourPiece: string; }`.
3. Design lookup helpers: `getArtifactSetBonus(setId: number): { twoPiece?: string; fourPiece?: string; } | undefined`, and set name matching for sets where ID might not be directly known.
4. Provide the exact code and export structure for the Worker to implement.

Write your report to:
`d:\games\projects\genshin-leaderboard\.agents\teamwork\teamwork_preview_explorer_m1_2\analysis.md`
and handoff to:
`d:\games\projects\genshin-leaderboard\.agents\teamwork\teamwork_preview_explorer_m1_2\handoff.md`
Send a message when done.
