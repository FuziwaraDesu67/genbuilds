## 2026-11-01T12:32:49Z
You are a Spec Miner for the survey phase of the genshin-leaderboard overhaul.

Your working directory is:
d:\games\projects\genshin-leaderboard\.agents\teamwork\teamwork_preview_spec_miner_survey_2

MANDATORY: You MUST read the authoritative user request at:
d:\games\projects\genshin-leaderboard\.agents\teamwork\ORIGINAL_REQUEST.md
before starting any investigation.

Objective:
Mine specifications, exact formulas, data definitions, and requirements for:
1. Artifact 2-piece and 4-piece set bonuses across Genshin Impact sets (e.g. Crimson Witch, Obsidian Codex, Golden Troupe, Noblesse Oblige, Deepwood Memories, Marechaussee Hunter, Emblem of Severed Fate, Viridescent Venerer, Gladiator's Finale, Blizzard Strayer, etc.). Check what data already exists in the project or external packages, or what dictionary/lookup table needs to be provided in `src/lib/enka/`.
2. Complete weapon metadata specifications: passive names, descriptions, refinement scaling (R1 to R5), base ATK ranges/scaling, and substats.
3. Precise Crit Value formula: `CV = 2 * CR + CD`. Quality badge thresholds for artifact piece CV and total build CV (e.g., Decent, Good, Great, Godly thresholds).
4. Substat roll calculation logic and visual roll pips `[●●●○]`: theoretical roll tiers (tiers 1-4 roll values per substat type: CR, CD, ATK%, HP%, DEF%, ER, EM, flat stats) and how roll counts (1 to 5 or 6) are derived.
5. Constellation boost levels (+3) detection logic for talents (e.g. C3/C5 talent level boosts).

Scope boundaries:
- DO NOT modify any code.
- Produce exact, precise specifications and structured tables.

Output requirements:
Write your full specification report to:
`d:\games\projects\genshin-leaderboard\.agents\teamwork\teamwork_preview_spec_miner_survey_2\analysis.md`
And your handoff report to:
`d:\games\projects\genshin-leaderboard\.agents\teamwork\teamwork_preview_spec_miner_survey_2\handoff.md`
Send a message to the Project Orchestrator when done.
