# Project: Genshin Impact Character Showcase & Build Card Overhaul

## Architecture
- **Framework**: Next.js 14 App Router, TypeScript, Tailwind CSS, Lucide icons, Radix UI primitives.
- **Data Flow**:
  1. Ingestion: `src/lib/enka/client.ts` fetches player showcase data from Enka.Network API with Redis caching & local deterministic fallback fixtures (`tests/fixtures/`).
  2. Parsing & Normalization: `src/lib/enka/parser.ts` parses raw Enka `AvatarInfo` into strongly-typed `Character`, `Artifact`, `Weapon`, and `Stats` domain models, normalizing percent stats to consistent scale (e.g. 46.6 for 46.6%).
  3. Metadata Enrichment: `src/lib/enka/static-data.ts`, `artifact-set-data.ts`, `weapon-data.ts`, and `talent-boost-data.ts` enrich characters with full 2pc/4pc artifact set skills, weapon passives/refinements, talent boost evaluations, and Crit Values.
  4. Presentation:
     - `/u/[uid]`: `ProfileClient.tsx` manages view state and renders player header and character showcase grid.
     - `CharacterCard.tsx`: Compact elemental glassmorphic card with avatar glow, `C0`–`C6` constellations, `R1`–`R5` weapon card, circular talent badges with `+3` tags, active set chips with popovers, key attributes, build CV badge.
     - `CharacterDetailModal.tsx`: Comprehensive modal with full build breakdown, weapon details, active set bonuses, and 5-piece artifact grid.
     - `ArtifactDisplay.tsx`: Active Set Bonuses Banner, 5 artifact pieces (Flower, Plume, Sands, Goblet, Circlet), formatted stats (`XX.X%`), visual roll pips `[●●●○]`, piece CV ratings with quality badges.
  5. Boundary Protection: `src/app/page.tsx` is completely isolated and unmodified (R5).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Artifact Set Skills Ingestion | Full 2pc and 4pc in-game descriptions for 50 sets | M1 | ORIGINAL_REQUEST §R1 (DONE) |
| 2 | Weapon Metadata Ingestion | Passive names, descriptions, R1–R5 refinement scaling for 57 weapons, base ATK, substats | M1 | ORIGINAL_REQUEST §R1 (DONE) |
| 3 | Talent Boost (+3) Evaluation | Detect C3/C5/C0-C6 talent level boosts (Normal/Skill/Burst) across all archetypes | M1 | ORIGINAL_REQUEST §R3 (DONE) |
| 4 | Fix 100x Multiplication Bug | Normalize percent stats so values display as `XX.X%` without extra `* 100` | M2 | ORIGINAL_REQUEST §R2 |
| 5 | Universal Crit Value (CV) | Calculate `CV = 2 * CR + CD` for artifact pieces and overall build | M2 | ORIGINAL_REQUEST §R2 |
| 6 | Bounded Substat Roll Counts & Pips | Calculate authentic roll counts (1–6) and render visual pips `[●●●○]` | M2 | ORIGINAL_REQUEST §R2, §R4 |
| 7 | UID 1813164100 Mock Fixture | Deterministic fallback fixture for Addy (C1 Varesa) | M2 | ORIGINAL_REQUEST Acceptance |
| 8 | CharacterCard Glassmorphism Overhaul | Glow frame, C0–C6 nodes, R1–R5 weapon card, circular talents with +3, set chips with popovers, attributes panel, CV badge | M3 | ORIGINAL_REQUEST §R3 |
| 9 | CharacterDetailModal Overhaul | Dedicated Active Set Bonuses Banner, full build card integration | M3 | ORIGINAL_REQUEST §R3, §R4 |
| 10 | ArtifactDisplay Grid & Banner Overhaul | Active Set Bonuses Banner, 5 pieces with correct formatting, roll pips, CV badges | M4 | ORIGINAL_REQUEST §R4 |
| 11 | Home UI Zero-Touch Boundary | Strict preservation of `src/app/page.tsx` | M3/M5 | ORIGINAL_REQUEST §R5 (VERIFIED) |
| 12 | Comprehensive E2E Testing & Hardening | Complete Tiers 1–4 tests + Tier 5 adversarial verification | M5 / E2E Track | ORIGINAL_REQUEST Acceptance (TEST_READY.md published) |

## Code Layout
- `src/lib/enka/types.ts`: Domain models (`Artifact`, `Weapon`, `Character`, `TalentLevels`, `Stats`).
- `src/lib/enka/static-data.ts`: Core metadata, lookup dictionaries, formulas (`calculateCritValue`, `estimateRollCount`, `evaluateTalentBoosts`).
- `src/lib/enka/artifact-set-data.ts`: Comprehensive 2pc and 4pc set skill descriptions for 50 sets.
- `src/lib/enka/weapon-data.ts`: Weapon passives, descriptions, and R1–R5 refinement scaling for 57 weapons.
- `src/lib/enka/talent-boost-data.ts`: Constellation talent boost evaluation for 91 characters.
- `src/lib/enka/parser.ts`: Parser logic, stat normalization, roll estimation, artifact piece CV attachment.
- `src/lib/enka/client.ts`: Data fetching with Redis caching and local fallback for UID `1813164100`.
- `tests/fixtures/varesa-1813164100.json`: Mock Enka response fixture for UID `1813164100`.
- `src/components/character/CharacterCard.tsx`: Glassmorphism character showcase card.
- `src/components/character/CharacterDetailModal.tsx`: Full build inspection modal.
- `src/components/character/ArtifactDisplay.tsx`: Active Set Bonuses Banner and 5-piece artifact roll analysis grid.
- `src/components/profile/ProfileClient.tsx`: Showcase profile view container.
- `tests/`: 10 unit, integration, and E2E test suites (248 tests passing).

## Interface Contracts
### `src/lib/enka/types.ts`
```typescript
export interface Artifact {
  id: number;
  name: string;
  setId: number;
  setName: string;
  setBonusText?: {
    twoPiece?: string;
    fourPiece?: string;
  };
  slot: 'flower' | 'plume' | 'sands' | 'goblet' | 'circlet';
  rarity: number;
  level: number;
  mainStat: {
    key: string;
    value: number;
  };
  subStats: Array<{
    key: string;
    value: number;
    rolls: number;
    pips?: string;
  }>;
  cv?: number;
  qualityBadge?: QualityBadge;
  icon: string;
}

export interface Weapon {
  id: number;
  name: string;
  rarity: number;
  level: number;
  ascension: number;
  refinement: number; // 1-5
  baseAtk: number;
  subStat?: {
    key: string;
    value: number;
  };
  passiveName?: string;
  passiveDescription?: string;
  icon: string;
}

export interface TalentLevels {
  normal: number;
  skill: number;
  burst: number;
  boosted?: {
    normal?: boolean;
    skill?: boolean;
    burst?: boolean;
  };
}
```

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Game Metadata & Skills Ingestion | Full 2pc/4pc artifact skills (50 sets), weapon passives/refinements (57 weapons), talent boost mapping (91 chars), extended types | none | DONE |
| M2 | Core Math, Parser Normalization & Mock Fixture | Fix 100x bug in parser, bounded roll counts, piece CV calculation, UID 1813164100 fixture & fallback, CommonJS test harness fix | M1 | DONE |
| M3 | Character Showcase & Build Card Redesign | `CharacterCard.tsx`, `CharacterDetailModal.tsx`, `ProfileClient.tsx` glassmorphism, glow frames, C0-C6, R1-R5, circular talents +3, set chips with popovers | M1, M2 | DONE |
| M4 | Artifact Detail & Roll Analysis Grid | `ArtifactDisplay.tsx` Active Set Bonuses Banner, 5-piece grid, correct formatting, roll pips `[●●●○]`, CV badges | M2, M3 | DONE |
| M5 | Final Milestone: Full E2E & Adversarial Hardening | Pass 100% E2E test suite (Tiers 1-4) + Tier 5 adversarial hardening | M1, M2, M3, M4 | DONE |
| E2E | E2E Testing Track | Independent opaque-box test suite (Tiers 1-4) published to `TEST_READY.md` | none | DONE |

