# Original User Request

## Initial Request — 2026-11-01T12:30:27Z

Overhaul the Genshin Impact Character Showcase (`/u/[uid]`), Build Card, and Artifacts UI in the `genshin-leaderboard` project: implement full in-game artifact 2-piece and 4-piece set skill descriptions, fix stat calculation bugs (100x multiplier on percentages and rolls), calculate universal Crit Value (CV) and roll pips, display weapon passives with refinement levels, and highlight constellation-boosted talent levels (+3). Do not alter or redesign the already-finalized Home UI.

Working directory: d:/games/projects/genshin-leaderboard
Integrity mode: development

## Requirements

### R1. Artifact Set Skills & Game Metadata Ingestion
Provide complete in-game skill descriptions for all active 2-piece and 4-piece artifact set bonuses (e.g., Crimson Witch, Obsidian Codex, Golden Troupe, Noblesse Oblige, Deepwood Memories, etc.) and complete weapon metadata (passive skill names, refinement scaling, base ATK, and substats) in `src/lib/enka/`.

### R2. Core Mathematical & Stat Formatting Fixes
Correct the 100x multiplication bug in `src/lib/enka/parser.ts` and `src/components/character/ArtifactDisplay.tsx` where percent stats were displayed as `4660.0%`. Implement universal Crit Value calculation (`CV = 2 * CR + CD`) per artifact piece and for the whole build. Calculate authentic substat roll counts and visual pips `[●●●○]` based on theoretical roll thresholds.

### R3. Character Card & Showcase Overhaul (`CharacterCard.tsx`, `ProfileClient.tsx`, `CharacterDetailModal.tsx`)
Redesign the character cards and build modal with high-contrast elemental glassmorphism:
- High-res character avatar with elemental glow frame, star rating, and constellation nodes (`C0`–`C6`).
- Refined weapon card showing weapon icon, level, refinement badge (`R1`–`R5`), base ATK, substat, and passive name.
- Circular talent badges with skill icons, showing talent levels and radiant `+3` tags for constellation-boosted talents.
- Active artifact set bonus chips with interactive popover/hover revealing full 2-piece and 4-piece skill descriptions.
- Key attribute panel (HP, ATK, DEF, EM, CR/CD ratio, ER, Elemental DMG bonus) and overall build CV badge (`Decent`, `Good`, `Great`, `Godly`).

### R4. Artifacts Detail & Roll Analysis Grid (`ArtifactDisplay.tsx`)
In the artifacts inspection view and detail modal:
- Display a dedicated **Active Set Bonuses Banner** with complete 2-piece and 4-piece skill text.
- Render 5 artifact pieces (Flower, Plume, Sands, Goblet, Circlet) with correct stat formatting (e.g. `HP% 46.6%`), substat values, visual roll pips `[●●●○]`, and individual piece CV ratings with quality badges.

### R5. Home UI Constraint
Do not modify or redesign the existing home page UI (`src/app/page.tsx`), which is already completed and finalized.

## Acceptance Criteria

### Correctness & Calculations
- [ ] No artifact stat or roll exhibits the 100x multiplication error (all percentage stats display as `XX.X%`).
- [ ] Every artifact piece calculates and displays its Crit Value (`2 * CR + CD`).
- [ ] Substats display visual roll pips `[●●●○]` accurately reflecting roll counts (1 to 5).
- [ ] Active 2-piece and 4-piece artifact set bonuses render their exact in-game skill descriptions.

### Visual & Interactive Quality
- [ ] Character cards display weapon icon, refinement (`R1`–`R5`), and base ATK.
- [ ] Talents display skill icons, level numbers, and `+3` indicators for boosted talents.
- [ ] Build modal displays full character build card with active set bonuses and 5-piece artifact breakdown.
- [ ] Home UI (`src/app/page.tsx`) remains intact and unmodified.

### Automated Verification
- [ ] `tsc --noEmit` exits with code 0 without any TypeScript type errors.
- [ ] `npm test` / `vitest run` passes all test suites.
- [ ] HTTP `GET /u/1813164100` returns `200 OK` with valid build card markup.
