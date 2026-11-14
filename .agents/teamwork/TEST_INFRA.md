# Test Architecture & Feature Coverage Matrix (`TEST_INFRA.md`)

## 1. Executive Summary

This document establishes the test architecture, execution harness, and feature coverage matrix for the Genshin Impact Character Showcase (`/u/[uid]`), Build Card, and Artifacts UI overhaul in `genshin-leaderboard`.

The test suite is built strictly to opaque-box standards, derived from `ORIGINAL_REQUEST.md` and `PROJECT.md`, verifying system behavior across 4 primary tiers with progressive testability and complete independence.

---

## 2. Test Architecture & Directory Layout

```
genshin-leaderboard/
├── tests/
│   ├── fixtures/
│   │   ├── enka-response.json          # Hu Tao (C6) + Staff of Homa (R1) + Crimson Witch fixture
│   │   └── varesa-1813164100.json      # Addy (UID 1813164100, C1 Varesa) + Widsith + Obsidian Codex
│   ├── e2e/
│   │   ├── calculations.test.ts        # Stat normalization (100x fix), CV math, roll counts & pips
│   │   ├── metadata.test.ts            # 2pc/4pc set skills, weapon metadata (R1–R5), talent boosts (+3)
│   │   └── e2e-showcase.test.ts        # UI rendering, Home UI preservation, pairwise combinations, UID 1813164100 E2E
│   ├── enka-parser.test.ts             # Baseline schema and parser tests
│   └── redis-fallback.test.ts          # Cache and rate-limiting tests
├── vitest.config.ts                    # Vitest configuration (globals: true, react plugin)
├── .agents/teamwork/
│   ├── TEST_INFRA.md                   # This document
│   └── TEST_READY.md                   # Test suite publication & sign-off
└── TEST_READY.md                       # Root test readiness contract
```

### Technology Stack & Runtime Configuration
- **Test Runner**: Vitest 2.1.9 (`@vitejs/plugin-react` for JSX/TSX support).
- **Type Checker**: TypeScript 5.9.3 (`tsc --noEmit`).
- **Assertion Framework**: Vitest globals (`describe`, `it`, `expect`, `beforeAll`, `afterAll`).
- **Isolation Principle**: Each test sets up independent state, creates isolated mock payloads, and cleans up resources.

---

## 3. Multi-Tiered Test Suite Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       TIER 4: REAL-WORLD SCENARIOS                          │
│     • GET /u/1813164100 E2E Showcase Markup Validation                      │
│     • Profile Route & Client Component Integration                          │
│     • Full Pipeline Schema Validation & TypeScript Clean Compile           │
├─────────────────────────────────────────────────────────────────────────────┤
│                    TIER 3: CROSS-FEATURE COMBINATIONS                       │
│     • C1 Varesa + Obsidian Codex (4pc) + The Widsith (R5)                   │
│     • C6 Hu Tao + Crimson Witch of Flames (4pc) + Staff of Homa (R1)       │
│     • Constellation +3 Talent Boost with Weapon Scaling Interactions        │
│     • 2pc + 2pc Split Sets with CV and Substat Roll Pips                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                    TIER 2: BOUNDARY & CORNER CASES                          │
│     • Single-roll & empty substats (1 roll floor, 6 roll ceiling)          │
│     • 0 Crit Value, negative clamps, extreme theoretical maximum CV        │
│     • Weapon R1 vs R5 scaling boundary extremes                             │
│     • Constellation C0 vs C6 boundary states (Aloy C0 vs C6 characters)     │
│     • Decimal precision rounding (1 decimal place consistency)              │
├─────────────────────────────────────────────────────────────────────────────┤
│                        TIER 1: FEATURE COVERAGE                             │
│  [1] Artifact 2pc/4pc Set Skills (≥5 cases)  [2] Weapon Metadata (≥5 cases)│
│  [3] 100x Stat Normalization (≥5 cases)       [4] Universal CV (≥5 cases)   │
│  [5] Roll Counts & Pips (≥5 cases)           [6] Talent +3 Boost (≥5 cases)│
│  [7] Card & Modal Rendering (≥5 cases)       [8] UI Preservation (≥5 cases)│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Feature Coverage Matrix

| Feature ID | Feature Name | Target Specification | Primary Tier | Target Test File | Required Cases | Actual Cases | Status |
|---|---|---|---|---|---|---|---|
| **F-01** | Artifact 2pc/4pc Set Skills | `ORIGINAL_REQUEST.md` § R1 | Tier 1, 2, 3 | `metadata.test.ts` | ≥ 5 | 8 | READY |
| **F-02** | Weapon Metadata & Refinement | `ORIGINAL_REQUEST.md` § R1 | Tier 1, 2, 3 | `metadata.test.ts` | ≥ 5 | 8 | READY |
| **F-03** | 100x Stat Normalization | `ORIGINAL_REQUEST.md` § R2 | Tier 1, 2 | `calculations.test.ts` | ≥ 5 | 7 | READY |
| **F-04** | Universal Crit Value (CV) | `ORIGINAL_REQUEST.md` § R2 | Tier 1, 2, 3 | `calculations.test.ts` | ≥ 5 | 8 | READY |
| **F-05** | Bounded Roll Counts & Pips | `ORIGINAL_REQUEST.md` § R2, § R4 | Tier 1, 2 | `calculations.test.ts` | ≥ 5 | 8 | READY |
| **F-06** | Talent Constellation Boosts (+3) | `ORIGINAL_REQUEST.md` § R3 | Tier 1, 2, 3 | `metadata.test.ts` | ≥ 5 | 7 | READY |
| **F-07** | CharacterCard & Artifact Grid UI | `ORIGINAL_REQUEST.md` § R3, § R4 | Tier 1, 3, 4 | `e2e-showcase.test.ts` | ≥ 5 | 8 | READY |
| **F-08** | Home UI Preservation (R5) | `ORIGINAL_REQUEST.md` § R5 | Tier 1 | `e2e-showcase.test.ts` | ≥ 5 | 6 | READY |
| **F-09** | Boundary & Corner Cases | Test Spec Tier 2 | Tier 2 | `calculations.test.ts`, `metadata.test.ts` | ≥ 6 | 10 | READY |
| **F-10** | Cross-Feature Combinations | Test Spec Tier 3 | Tier 3 | `e2e-showcase.test.ts` | ≥ 5 | 6 | READY |
| **F-11** | Real-World Scenarios (UID 1813164100) | `ORIGINAL_REQUEST.md` Acceptance | Tier 4 | `e2e-showcase.test.ts` | ≥ 5 | 6 | READY |

**Total Planned Test Cases**: 82+ test assertions spanning 3 dedicated E2E test suites and 2 baseline integration test suites.

---

## 5. Authoritative Expected Output Derivation

Every expected value in the test suite is derived from explicit authoritative sources:

1. **Stat Normalization Formula**:
   $$\text{displayValue} = \begin{cases} \text{value} \times 100 & \text{if } 0 < \text{value} \le 1.0 \text{ and stat is percentage} \\ \text{value} & \text{otherwise} \end{cases}$$
   Formatted output: `${displayValue.toFixed(1)}%` (e.g. `46.6%`, strictly preventing `4660.0%`).

2. **Universal Crit Value (CV) Formula**:
   $$\text{CV}_{\text{piece}} = 2 \times \text{CR} + \text{CD}$$
   Quality Badges:
   - `< 20.0`: `Subpar`
   - `20.0 – 29.9`: `Decent`
   - `30.0 – 39.9`: `Good`
   - `40.0 – 49.9`: `Great`
   - `≥ 50.0`: `Godly`
   Circlet Adjusted Substat Scale:
   - `< 10.0`: `Subpar`, `10.0–19.9`: `Decent`, `20.0–29.9`: `Good`, `30.0–34.9`: `Great`, `≥ 35.0`: `Godly`.

3. **Substat Roll Counts & Visual Pips**:
   Theoretical 5★ substat roll averages:
   - `CR`: [2.72, 3.11, 3.50, 3.89] (avg 3.305%)
   - `CD`: [5.44, 6.22, 6.99, 7.77] (avg 6.605%)
   - `ATK% / HP%`: [4.08, 4.66, 5.25, 5.83] (avg 4.955%)
   - `ER`: [4.53, 5.18, 5.83, 6.48] (avg 5.505%)
   Roll bounds: clamped to $[1, 6]$.
   Pips format: `[●○○○○]` (1 roll) to `[●●●●●★]` (6 rolls).

4. **Talent Constellation Boost (+3)**:
   - C0–C2: None boosted.
   - C3: Boosts character's C3-designated talent (e.g. Skill for Hu Tao, Normal for Neuvillette, Burst for Raiden).
   - C5–C6: Boosts both C3 and C5-designated talents.
   - Boost tag: `+3` visual pill.

5. **Home UI Zero-Touch Constraint**:
   - `src/app/page.tsx` must remain identical to commit baseline.
   - Verified via SHA-256 hash or content snapshot match.

---

## 6. How to Run the Tests

```bash
# Run all E2E test suites
node ./node_modules/vitest/vitest.mjs run tests/e2e/

# Run complete test suite (unit + E2E)
node ./node_modules/vitest/vitest.mjs run

# Run TypeScript typecheck
node ./node_modules/typescript/bin/tsc --noEmit
```
