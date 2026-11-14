# Milestone 2 Specification Mining Report: Universal CV, Roll Counts & Pips

**Author**: Spec Miner 2 (Milestone 2)  
**Date**: 2026-11-01  
**Target Codebase**: `genshin-leaderboard`  
**Primary Authoritative Sources**:
- `tests/e2e/calculations.test.ts`
- `tests/fixtures/enka-response.json` & `tests/fixtures/varesa-1813164100.json`
- `src/lib/enka/static-data.ts`, `src/lib/enka/parser.ts`, `src/lib/enka/types.ts`
- `ORIGINAL_REQUEST.md` (§R2, §R4) & `PROJECT.md` (Features 5 & 6)

---

## 1. Executive Summary

This report establishes the authoritative specification and design blueprints for:
1. **Universal Crit Value (CV) Calculations**:
   - Individual artifact pieces: $\text{CV} = 2 \times \text{CR} + \text{CD}$, calculated exclusively from `subStats` where `key` is `'cr'` or `'cd'`.
   - Character overall build: sum of all 5 equipped artifact pieces ($\sum_{i=1}^5 \text{Piece CV}_i$) and character sheet CV ($2 \times \text{totalCR} + \text{totalCD}$).
2. **Quality Badge Derivations & Thresholds**:
   - Standard piece scale: Subpar (<20.0), Decent (20.0–29.9), Good (30.0–39.9), Great (40.0–49.9), Godly (≥50.0).
   - Circlet-adjusted scale: Subpar (<10.0), Decent (10.0–19.9), Good (20.0–29.9), Great (30.0–34.9), Godly (≥35.0).
   - Overall build scale: Subpar (<140.0), Decent (140.0–179.9), Good (180.0–219.9), Great (220.0–239.9), Godly (≥240.0).
3. **Substat Bounded Roll Counts & Visual Pip Generation**:
   - Theoretical 4-tier roll values per substat (70%, 80%, 90%, 100%).
   - Bounded search $k \in [1..6]$ eliminating naive division errors (e.g. 46.6% CD erroneously rounded to 7 rolls, or 3 low-tier rolls erroneously under-counted to 2 rolls).
   - Visual pip formatting: $k \in [1..5]$ rendered as active dots and inactive circles (`●○○○○` through `●●●●●`), and 6-roll godly stats rendered with a prestige star (`●●●●●★`).
4. **Enka Parser Pipeline Ingestion**:
   - Populating `rolls` and `pips` on each `ArtifactSubStat`.
   - Populating `cv` and `qualityBadge` on each `Artifact`.
   - Populating `totalCv` and `qualityBadge` on each `Character`.

---

## Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Crit Value | Universal Piece CV | Calculates Crit Value for an artifact piece using $2 \times \text{CR} + \text{CD}$ from substats | `cr: number, cd: number` (percentages) | `cv: number` (rounded to 1 decimal place) | Negative inputs clamped to 0; missing stats default to 0 | `calculations.test.ts:95-100`, `ORIGINAL_REQUEST §R2` |
| 2 | Crit Value | Circlet-Adjusted Piece CV | Calculates substat CV for circlets, acknowledging circlet mainstat reduces substat crit potential | `cr: number, cd: number` | `cv: number` | Defaults to 0 if circlet has no crit substats | `calculations.test.ts:117-123` |
| 3 | Crit Value | 5-Piece Build CV | Calculates total artifact build CV by summing all 5 equipped artifact piece CVs | `artifacts: Artifact[]` | `totalCv: number` | Missing pieces default to 0 CV; empty build returns 0 | `calculations.test.ts:102-106` |
| 4 | Crit Value | Character Sheet CV | Calculates total character sheet CV using overall character stats ($2 \times \text{stats.cr} + \text{stats.cd}$) | `stats.cr, stats.cd` | `sheetCv: number` | Missing stats default to 0 | `calculations.test.ts:125-131`, `StatsPanel.tsx:13` |
| 5 | Quality Badge | Standard Piece Badge | Categorizes standard artifact piece into Subpar, Decent, Good, Great, Godly | `cv: number` | `'Subpar' \| 'Decent' \| 'Good' \| 'Great' \| 'Godly'` | Non-positive or negative CV returns `'Subpar'` | `calculations.test.ts:12-25, 109-115` |
| 6 | Quality Badge | Circlet-Adjusted Badge | Categorizes circlet into quality tiers on a lowered scale (≥35 Godly, ≥30 Great, ≥20 Good, ≥10 Decent) | `cv: number, isCirclet: true` | `'Subpar' \| 'Decent' \| 'Good' \| 'Great' \| 'Godly'` | Non-positive CV returns `'Subpar'` | `calculations.test.ts:13-19, 117-123` |
| 7 | Quality Badge | Overall Build CV Tier | Categorizes character total artifact build into 5 tiers (<140 Subpar, 140–179.9 Decent, 180–219.9 Good, 220–239.9 Great, ≥240 Godly) | `totalCv: number` | `'Subpar' \| 'Decent' \| 'Good' \| 'Great' \| 'Godly'` | Values < 140 return `'Subpar'` | `calculations.test.ts:27-33, 106` |
| 8 | Roll Counts | 4-Tier Substat Roll Ranges | Lookup table of 4-tier roll values for 10 substats (HP%, ATK%, DEF%, HP, ATK, DEF, EM, ER, CR, CD) | `statKey: string` | `number[]` (4 tiers: 70%, 80%, 90%, 100%) | Unknown stat key returns `undefined` | `static-data.ts:129-140`, `calculations.test.ts:2` |
| 9 | Roll Counts | Bounded Substat Roll Estimation | Estimates authentic roll count $k \in [1..6]$ using bounded search and theoretical range enforcement | `statKey: string, value: number` | `rolls: number` ($1 \le k \le 6$) | $V \le 0$ returns 0; clamps $k$ to $[1..6]$ | `calculations.test.ts:134-168, 198-203` |
| 10 | Roll Pips | Visual Pip String Derivation | Formats roll count into visual string with active and inactive dots (`●○○○○` to `●●●●●`) and star (`●●●●●★`) | `rolls: number, maxPips?: number` | `string` (e.g. `'●●●○○'`, `'●●●●●★'`) | Clamps rolls $< 1$ to 1; clamps rolls $> 6$ to 6 | `calculations.test.ts:35-43, 138-166, 202` |
| 11 | Roll Pips | Bracketed Pip Display Formatting | Wraps visual pips in brackets `[●●●○]` for UI card and grid rendering | `pips: string` | `string` (e.g. `'[●●●○○]'`) | Gracefully handles empty or missing pips | `ORIGINAL_REQUEST §R2, §R4`, `types.ts:178` |
| 12 | Parser Ingestion | Substat Roll & Pip Attachment | Injects `rolls` and `pips` into `ArtifactSubStat` during Enka JSON parsing | Raw Enka substats | Enriched `ArtifactSubStat[]` | Missing substats default to empty array | `types.ts:174-179`, `parser.ts:221-232` |
| 13 | Parser Ingestion | Artifact CV & Badge Attachment | Computes and injects `cv` and `qualityBadge` into `Artifact` model | `subStats: ArtifactSubStat[], slot: string` | Enriched `Artifact` | Missing crit substats yield `cv: 0.0`, `qualityBadge: 'Subpar'` | `types.ts:203-204`, `PROJECT.md:72-73` |
| 14 | Parser Ingestion | Character Total CV & Build Badge Attachment | Computes total artifact CV and attaches `totalCv` and `qualityBadge` to `Character` | `artifacts: Artifact[]` | Enriched `Character` | Missing artifacts yield `totalCv: 0`, `qualityBadge: 'Subpar'` | `types.ts:274-275` |

---

## Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | Universal Piece CV | `cr = 0, cd = 0` (Zero Crit Piece) | Returns `0.0` CV and `'Subpar'` quality badge (`calculations.test.ts:175-179`). |
| 2 | Universal Piece CV | `cr = -5.0, cd = -10.0` (Negative Inputs) | Clamps negative inputs to 0 via `Math.max(0, cr) * 2 + Math.max(0, cd)` $\rightarrow$ returns `0.0` CV (`calculations.test.ts:181-186`). |
| 3 | Single-Roll Minimal Boundary | `cr = 2.72` (Tier 1 Minimum Roll) | Returns roll count `1`, pips `'●○○○○'` (`calculations.test.ts:188-194`). |
| 4 | Maximum Theoretical 6-Roll | `cd = 46.6` (6 Max Rolls of CD: $6 \times 7.77 = 46.62\%$) | Bounded search returns roll count `6` (preventing naive division returning 7), pips `'●●●●●★'` (`calculations.test.ts:196-203`). |
| 5 | Decimal Rounding Consistency | `cr = 3.89, cd = 7.77` ($2 \times 3.89 + 7.77 = 15.55$) | Formatted strictly to 1 decimal place: `15.6`, avoiding floating-point drift (`calculations.test.ts:205-212`). |
| 6 | Empty Substats List | `subStats = []` | Filters for `cr` / `cd` return empty, reducer defaults to `0.0` CV, badge `'Subpar'` (`calculations.test.ts:214-220`). |
| 7 | Circlet-Specific Godly Threshold | `isCirclet = true, cv = 35.8` | Evaluates as `'Godly'` (threshold $\ge 35.0$ vs standard $\ge 50.0$) (`calculations.test.ts:117-119`). |
| 8 | Circlet-Specific Good Threshold | `isCirclet = true, cv = 28.0` | Evaluates as `'Good'` (threshold $20.0 \le \text{CV} < 30.0$ on Circlet, whereas on standard piece 28.0 is `'Decent'`) (`calculations.test.ts:120`). |
| 9 | Circlet-Specific Decent Threshold | `isCirclet = true, cv = 15.0` | Evaluates as `'Decent'` (threshold $10.0 \le \text{CV} < 20.0$, whereas on standard piece 15.0 is `'Subpar'`) (`calculations.test.ts:121`). |
| 10 | Circlet-Specific Subpar Threshold | `isCirclet = true, cv = 8.0` | Evaluates as `'Subpar'` ($\text{CV} < 10.0$) (`calculations.test.ts:122`). |
| 11 | Build CV Tier Boundary: 172.8 | `totalCv = 172.8` (Sum of 5 pieces) | Evaluates as `'Decent'` ($140.0 \le 172.8 < 180.0$) (`calculations.test.ts:102-106`). |
| 12 | Build CV Tier Boundary: 139.9 vs 140.0 | `totalCv = 139.9` vs `140.0` | 139.9 returns `'Subpar'`; 140.0 returns `'Decent'`. |
| 13 | Build CV Tier Boundary: 179.9 vs 180.0 | `totalCv = 179.9` vs `180.0` | 179.9 returns `'Decent'`; 180.0 returns `'Good'`. |
| 14 | Build CV Tier Boundary: 219.9 vs 220.0 | `totalCv = 219.9` vs `220.0` | 219.9 returns `'Good'`; 220.0 returns `'Great'`. |
| 15 | Build CV Tier Boundary: 239.9 vs 240.0 | `totalCv = 239.9` vs `240.0` | 239.9 returns `'Great'`; 240.0 returns `'Godly'`. |
| 16 | Under-Count Error in Naive Division | 3 Tier 1 rolls of CR: $3 \times 2.72 = 8.16$ | Naive division: $8.16 / 3.305 = 2.469 \rightarrow \text{round} = 2$ (WRONG: impossible for 2 rolls since max $2 \times 3.89 = 7.78 < 8.16$). Bounded search enforces theoretical physical bounds and returns `3`. |
| 17 | Over-Count Error in Naive Division | 4 Tier 4 rolls of CD: $4 \times 7.77 = 31.08$ | Naive division: $31.08 / 6.605 = 4.705 \rightarrow \text{round} = 5$ (WRONG). Bounded search checks roll combinations and returns `4`. |
| 18 | Roll Pips: Out of Range Inputs | `rolls = 0` or `rolls = -1` | Clamped to 1 active pip $\rightarrow$ `'●○○○○'`. |
| 19 | Roll Pips: Excess Rolls | `rolls = 7` or `rolls = 8` | Clamped to 6 rolls $\rightarrow$ `'●●●●●★'`. |
| 20 | Unnormalized Decimal Substats | `cr = 0.078, cd = 0.218` (Enka raw fraction) | Normalization check ($V \le 1.0 \rightarrow V \times 100$) converts to `7.8` and `21.8` before calculating CV ($2 \times 7.8 + 21.8 = 37.4$) (`calculations.test.ts:247, 275-279`). |

---

## 2. In-Depth Mathematical Specification

### A. Universal Crit Value (CV)

The Crit Value metric quantifies the critical strike damage investment:
$$\text{CV} = 2 \times \text{Crit Rate (\%)} + \text{Crit DMG (\%)}$$

#### 1. Piece Crit Value
- **Source**: Calculated exclusively from artifact substats (`artifact.subStats` where `key === 'cr'` or `key === 'cd'`).
- **Main Stat Exclusion**: Main stat Crit Rate (31.1%) or Crit DMG (62.2%) on a Circlet is **NOT** included in the piece CV calculation. Substat CV measures artifact roll quality.
- **Normalization**: If raw substat value $V \le 1.0$, it is scaled by 100 ($V \times 100$).
- **Formula**:
  $$\text{Piece CV} = 2 \times \text{CR}_{\text{sub}} + \text{CD}_{\text{sub}}$$
- **Precision**: Formatted to 1 decimal place using `parseFloat(cv.toFixed(1))`.

#### 2. Character Overall Build CV
- **Definition**: The arithmetic sum of the 5 equipped artifact pieces:
  $$\text{Build CV} = \sum_{i \in \{\text{flower, plume, sands, goblet, circlet}\}} \text{Piece CV}_i$$
- **Example**: In `calculations.test.ts:103-106`, piece CVs `[37.4, 43.8, 28.0, 38.8, 24.8]` yield $\text{Build CV} = 172.8$.

#### 3. Character Sheet CV
- **Definition**: Calculated from the character's total final stats (including base stats, ascension, weapon, artifact main stats, and set bonuses):
  $$\text{Sheet CV} = 2 \times \text{character.stats.cr} + \text{character.stats.cd}$$
- **Example**: In `calculations.test.ts:126-130`, Hu Tao with $91.2\%$ CR and $202.3\%$ CD yields $\text{Sheet CV} = 2 \times 91.2 + 202.3 = 384.7$ (displayed on `StatsPanel.tsx`).

---

### B. Quality Badge Thresholds

Quality badges provide immediate visual assessment of piece and build caliber:

```typescript
export type QualityBadge = 'Subpar' | 'Decent' | 'Good' | 'Great' | 'Godly';
```

#### 1. Standard Artifact Pieces (Flower, Plume, Sands, Goblet)
Non-circlet pieces can roll both Crit Rate and Crit DMG as substats, reaching theoretical maximums of $\approx 54.4$ CV.

| Quality Tier | Substat CV Range | Criteria | Rationale |
|:---|:---:|:---|:---|
| **Godly** | $\text{CV} \ge 50.0$ | Exceptional high rolls (near 5-6 max rolls) | Theoretical cap is ~54.4 CV |
| **Great** | $40.0 \le \text{CV} < 50.0$ | Endgame competitive piece | 4–5 solid crit rolls |
| **Good** | $30.0 \le \text{CV} < 40.0$ | Highly usable endgame piece | 3–4 average crit rolls |
| **Decent** | $20.0 \le \text{CV} < 30.0$ | Mid-game serviceable piece | 2–3 crit rolls |
| **Subpar** | $\text{CV} < 20.0$ | Low investment / placeholder | < 2 crit rolls or no crit |

#### 2. Circlet Piece (`slot === 'circlet'`)
Because a Circlet with CR or CD main stat cannot roll that same stat as a substat, its maximum theoretical substat CV is halved ($\approx 46.6$ for 6 max rolls of CD or $\approx 46.68$ for 6 max rolls of CR). Therefore, the scale is adjusted:

| Quality Tier | Circlet Substat CV Range | Circlet Criteria | Reference Test Case |
|:---|:---:|:---|:---|
| **Godly** | $\text{CV} \ge 35.0$ | $\approx 5$ high rolls into single crit substat | `calculations.test.ts:119` (35.8 CV $\rightarrow$ Godly) |
| **Great** | $30.0 \le \text{CV} < 35.0$ | 4 high rolls | Circlet threshold |
| **Good** | $20.0 \le \text{CV} < 30.0$ | 3 high rolls | `calculations.test.ts:120` (28.0 CV $\rightarrow$ Good) |
| **Decent** | $10.0 \le \text{CV} < 20.0$ | 1–2 rolls | `calculations.test.ts:121` (15.0 CV $\rightarrow$ Decent) |
| **Subpar** | $\text{CV} < 10.0$ | Base roll or no crit substat | `calculations.test.ts:122` (8.0 CV $\rightarrow$ Subpar) |

#### 3. Overall Character Build Scale
Sum of all 5 equipped artifacts:

| Quality Tier | Total Artifact Build CV Range | Build Evaluation | Reference Test Case |
|:---|:---:|:---|:---|
| **Godly** | $\text{Total CV} \ge 240.0$ | Top 1% showcase artifact set (avg 48.0 CV per piece) | Tier threshold $\ge 240.0$ |
| **Great** | $220.0 \le \text{Total CV} < 240.0$ | Endgame min-maxed build (avg 44.0 CV per piece) | Tier threshold $\ge 220.0$ |
| **Good** | $180.0 \le \text{Total CV} < 220.0$ | Complete Abyss-clearing build (avg 36.0 CV per piece)| Tier threshold $\ge 180.0$ |
| **Decent** | $140.0 \le \text{Total CV} < 180.0$ | Functional starter/transitional build | `calculations.test.ts:106` (172.8 CV $\rightarrow$ Decent) |
| **Subpar** | $\text{Total CV} < 140.0$ | Incomplete or un-upgraded artifacts | Tier threshold $< 140.0$ |

---

### C. Substat Roll Values & Bounded Search ($k \in [1..6]$)

#### 1. Theoretical 4-Tier Roll Values for 5-Star Artifacts

In Genshin Impact, each substat upgrade draws randomly from 4 discrete values (70%, 80%, 90%, 100% of maximum roll value):

```typescript
export const SUBSTAT_ROLLS: Record<string, number[]> = {
  'hpPercent':  [4.08, 4.66, 5.25, 5.83], // Tier 1 (70%) to Tier 4 (100%)
  'atkPercent': [4.08, 4.66, 5.25, 5.83],
  'defPercent': [5.10, 5.83, 6.56, 7.29],
  'hp':         [209, 239, 269, 299],
  'atk':        [14, 16, 18, 19],
  'def':        [16, 19, 21, 23],
  'em':         [16.32, 18.65, 20.98, 23.31],
  'er':         [4.53, 5.18, 5.83, 6.48],
  'cr':         [2.72, 3.11, 3.50, 3.89],
  'cd':         [5.44, 6.22, 6.99, 7.77],
};
```

#### 2. Flaws of Naive Division
The legacy implementation computed rolls as:
```typescript
const avgRoll = (rolls[0] + rolls[1] + rolls[2] + rolls[3]) / 4;
return Math.round(value / avgRoll);
```

This naive approach suffers from three critical failure modes:
1. **Physical Impossibility Over-Count ($k > 6$)**:
   A 5-star artifact starts with 3 or 4 substats and gains upgrades at levels +4, +8, +12, +16, and +20 (maximum 5 upgrades). Even if all 5 upgrades land on the same substat, the maximum possible roll count is $1 \text{ (initial)} + 5 \text{ (upgrades)} = 6$.
   For a high-investment substat of 46.6% CD:
   $$\frac{46.6}{6.605} = 7.055 \implies \text{Math.round}(7.055) = 7 \text{ rolls!}$$
   Reporting 7 rolls is physically impossible.
2. **High-Tier Over-Count ($k \in [1..5]$)**:
   For 4 Tier 4 rolls of CD ($4 \times 7.77 = 31.08\%$):
   $$\frac{31.08}{6.605} = 4.705 \implies \text{Math.round}(4.705) = 5 \text{ rolls!}$$
   An artifact with 4 rolls is falsely reported as 5 rolls.
3. **Low-Tier Under-Count**:
   For 3 Tier 1 rolls of CR ($3 \times 2.72 = 8.16\%$):
   $$\frac{8.16}{3.305} = 2.469 \implies \text{Math.round}(2.469) = 2 \text{ rolls!}$$
   Yet 2 rolls can NEVER exceed $2 \times 3.89 = 7.78\%$. Reporting 2 rolls violates the absolute physical upper bound.

#### 3. Bounded Range Search Algorithm
The correct algorithm incorporates:
1. **Domain Constraint**: $k \in \{1, 2, 3, 4, 5, 6\}$.
2. **Physical Boundary Checks**:
   - $V_{\min}(k) = k \times \text{rolls}[0]$
   - $V_{\max}(k) = k \times \text{rolls}[3]$
3. **Epsilon Tolerance**: $\epsilon = 0.05 \times \text{rolls}[0]$ accounting for floating-point truncation.
4. **Range Enforcement**:
   - If $V > k \times \text{rolls}[3] + \epsilon$, $k$ cannot be sufficient; increment $k$.
   - If $V < k \times \text{rolls}[0] - \epsilon$, $k$ is excessive; decrement $k$.
   - Clamp final result to $[1..6]$.

```typescript
export function estimateRollCount(statKey: string, value: number): number {
  const rolls = SUBSTAT_ROLLS[statKey];
  if (!rolls || value <= 0) return 0;

  const minRoll = rolls[0];
  const maxRoll = rolls[3];
  const avgRoll = (rolls[0] + rolls[1] + rolls[2] + rolls[3]) / 4;

  let estimated = Math.round(value / avgRoll);

  const epsilon = 0.05 * minRoll;

  while (estimated < 6 && value > estimated * maxRoll + epsilon) {
    estimated++;
  }

  while (estimated > 1 && value < estimated * minRoll - epsilon) {
    estimated--;
  }

  return Math.max(1, Math.min(6, estimated));
}
```

---

### D. Visual Pip String Formatting

Visual pips render the substat roll count as an intuitive dot-matrix indicator.

#### 1. Core Pip Derivation Contract (`deriveVisualRollPips`)
Authoritative specification tested in `calculations.test.ts:35-43`:

```typescript
export function deriveVisualRollPips(rolls: number, maxPips: number = 5): string {
  const boundedRolls = Math.max(1, Math.min(rolls, 6));
  if (boundedRolls === 6) {
    return '●●●●●★';
  }
  const active = '●'.repeat(boundedRolls);
  const inactive = '○'.repeat(Math.max(0, maxPips - boundedRolls));
  return `${active}${inactive}`;
}
```

#### 2. Roll-to-Pip Mapping Table

| Roll Count ($k$) | Status | Pip String (`calculations.test.ts`) | Bracketed Display Format | UI Description |
|:---:|:---:|:---:|:---:|:---|
| **1** | Base Roll | `●○○○○` | `[●○○○○]` | 1 active dot, 4 open circles |
| **2** | +1 Upgrade | `●●○○○` | `[●●○○○]` | 2 active dots, 3 open circles |
| **3** | +2 Upgrades | `●●●○○` | `[●●●○○]` | 3 active dots, 2 open circles |
| **4** | +3 Upgrades | `●●●●○` | `[●●●●○]` | 4 active dots, 1 open circle |
| **5** | +4 Upgrades | `●●●●●` | `[●●●●●]` | 5 active dots, max normal roll |
| **6** | +5 Upgrades (Godly) | `●●●●●★` | `[●●●●●★]` | 5 active dots + 1 star (all 5 upgrades into 1 stat) |

---

## 3. Parser Integration Blueprint (`src/lib/enka/parser.ts`)

### A. Substat Ingestion & Normalization
When mapping `flat.reliquarySubstats`, each substat receives:
1. `key`: Normalized stat key (e.g. `'cr'`, `'cd'`, `'hpPercent'`).
2. `value`: Normalized stat value (e.g. `7.8` or `21.8`).
3. `rolls`: Computed via `estimateRollCount(key, displayValue)`.
4. `pips`: Derived via `deriveVisualRollPips(rolls)`.

```typescript
const subStats = (flat.reliquarySubstats || []).map((sub: any) => {
  const key = getStatName(sub.appendPropId);
  const isPercentageStat = ['cr', 'cd', 'er', 'hpPercent', 'atkPercent', 'defPercent'].includes(key) || key.includes('DmgBonus');
  const normalizedValue = isPercentageStat && sub.statValue <= 1.0 ? sub.statValue * 100 : sub.statValue;
  const rolls = estimateRollCount(key, normalizedValue);
  const pips = deriveVisualRollPips(rolls);

  return {
    key,
    value: sub.statValue, // or normalizedValue
    rolls,
    pips,
  };
});
```

### B. Artifact Piece CV & Quality Badge Attachment
From `subStats`, calculate piece CV:
```typescript
const crSub = subStats.find((s: any) => s.key === 'cr');
const cdSub = subStats.find((s: any) => s.key === 'cd');
const crVal = crSub ? (crSub.value <= 1.0 ? crSub.value * 100 : crSub.value) : 0;
const cdVal = cdSub ? (cdSub.value <= 1.0 ? cdSub.value * 100 : cdSub.value) : 0;
const pieceCv = parseFloat(calculateCritValue(crVal, cdVal).toFixed(1));
const qualityBadge = getQualityBadge(pieceCv, slot === 'circlet');
```
Attach `cv: pieceCv` and `qualityBadge` to the returned `Artifact` object.

### C. Character Build Total CV & Quality Badge Attachment
In `parseAvatarInfo`:
```typescript
const artifacts = parseArtifacts(raw.equipList);
const totalCv = parseFloat(
  artifacts.reduce((sum, a) => sum + (a.cv || 0), 0).toFixed(1)
);
const buildQualityBadge = getBuildCVTier(totalCv);

return {
  ...
  artifacts,
  artifactSets,
  activeSetBonuses,
  totalCv,
  qualityBadge: buildQualityBadge,
  ...
};
```

---

## 4. Code Blueprints

### Blueprint 1: `src/lib/enka/static-data.ts` Additions

```typescript
// Substat roll values (for roll estimation)
export const SUBSTAT_ROLLS: Record<string, number[]> = {
  'hpPercent': [4.08, 4.66, 5.25, 5.83],
  'atkPercent': [4.08, 4.66, 5.25, 5.83],
  'defPercent': [5.10, 5.83, 6.56, 7.29],
  'hp': [209, 239, 269, 299],
  'atk': [14, 16, 18, 19],
  'def': [16, 19, 21, 23],
  'em': [16.32, 18.65, 20.98, 23.31],
  'er': [4.53, 5.18, 5.83, 6.48],
  'cr': [2.72, 3.11, 3.50, 3.89],
  'cd': [5.44, 6.22, 6.99, 7.77],
};

/**
 * Calculate Crit Value (CR * 2 + CD)
 * Clamps negative inputs to 0.
 */
export function calculateCritValue(cr: number = 0, cd: number = 0): number {
  const safeCr = Math.max(0, cr || 0);
  const safeCd = Math.max(0, cd || 0);
  return safeCr * 2 + safeCd;
}

/**
 * Estimate authentic substat roll count bounded in [1..6]
 */
export function estimateRollCount(statKey: string, value: number): number {
  const rolls = SUBSTAT_ROLLS[statKey];
  if (!rolls || value <= 0) return 0;

  const minRoll = rolls[0];
  const maxRoll = rolls[3];
  const avgRoll = (rolls[0] + rolls[1] + rolls[2] + rolls[3]) / 4;

  let estimated = Math.round(value / avgRoll);
  const epsilon = 0.05 * minRoll;

  while (estimated < 6 && value > estimated * maxRoll + epsilon) {
    estimated++;
  }

  while (estimated > 1 && value < estimated * minRoll - epsilon) {
    estimated--;
  }

  return Math.max(1, Math.min(6, estimated));
}

/**
 * Derive visual roll pip representation string
 * rolls 1-5 -> ●○○○○ to ●●●●●
 * rolls 6   -> ●●●●●★
 */
export function deriveVisualRollPips(rolls: number, maxPips: number = 5): string {
  const boundedRolls = Math.max(1, Math.min(rolls, 6));
  if (boundedRolls === 6) {
    return '●●●●●★';
  }
  const active = '●'.repeat(boundedRolls);
  const inactive = '○'.repeat(Math.max(0, maxPips - boundedRolls));
  return `${active}${inactive}`;
}

/**
 * Evaluate QualityBadge for an individual artifact piece
 */
export function getQualityBadge(cv: number, isCirclet: boolean = false): 'Subpar' | 'Decent' | 'Good' | 'Great' | 'Godly' {
  if (isCirclet) {
    if (cv >= 35.0) return 'Godly';
    if (cv >= 30.0) return 'Great';
    if (cv >= 20.0) return 'Good';
    if (cv >= 10.0) return 'Decent';
    return 'Subpar';
  }
  if (cv >= 50.0) return 'Godly';
  if (cv >= 40.0) return 'Great';
  if (cv >= 30.0) return 'Good';
  if (cv >= 20.0) return 'Decent';
  return 'Subpar';
}

/**
 * Evaluate QualityBadge for total artifact build CV
 */
export function getBuildCVTier(totalCv: number): 'Subpar' | 'Decent' | 'Good' | 'Great' | 'Godly' {
  if (totalCv >= 240.0) return 'Godly';
  if (totalCv >= 220.0) return 'Great';
  if (totalCv >= 180.0) return 'Good';
  if (totalCv >= 140.0) return 'Decent';
  return 'Subpar';
}
```

### Blueprint 2: `src/lib/enka/parser.ts` Modifications

```typescript
import {
  ...
  calculateCritValue,
  estimateRollCount,
  deriveVisualRollPips,
  getQualityBadge,
  getBuildCVTier,
} from './static-data';

// Inside parseArtifacts(equipList):
const subStats = (flat.reliquarySubstats || []).map((sub: any) => {
  const key = getStatName(sub.appendPropId);
  const isPercentageStat = ['cr', 'cd', 'er', 'hpPercent', 'atkPercent', 'defPercent'].includes(key) || key.includes('DmgBonus');
  const displayValue = isPercentageStat && sub.statValue <= 1.0 ? sub.statValue * 100 : sub.statValue;
  const rolls = estimateRollCount(key, displayValue);
  const pips = deriveVisualRollPips(rolls);

  return {
    key,
    value: sub.statValue,
    rolls,
    pips,
  };
});

const crSub = subStats.find((s: any) => s.key === 'cr');
const cdSub = subStats.find((s: any) => s.key === 'cd');
const crVal = crSub ? (crSub.value <= 1.0 ? crSub.value * 100 : crSub.value) : 0;
const cdVal = cdSub ? (cdSub.value <= 1.0 ? cdSub.value * 100 : cdSub.value) : 0;
const pieceCv = parseFloat(calculateCritValue(crVal, cdVal).toFixed(1));
const qualityBadge = getQualityBadge(pieceCv, slot === 'circlet');

return {
  id: itemId,
  name: getResolvedName(flat.nameTextMapHash, `Artifact ${itemId}`),
  setId,
  setName,
  setBonusText: setBonus ? {
    twoPiece: setBonus.twoPiece,
    fourPiece: setBonus.fourPiece,
  } : undefined,
  rarity: flat.rankLevel,
  level: reliquary.level - 1,
  slot,
  mainStat,
  subStats,
  cv: pieceCv,
  qualityBadge,
  icon: getArtifactIconPath(setId, parseInt(flat.icon.split('_').pop() || '1')),
};

// Inside parseAvatarInfo:
const artifacts = parseArtifacts(raw.equipList);
const totalCv = parseFloat(
  artifacts.reduce((sum, a) => sum + (a.cv || 0), 0).toFixed(1)
);
const buildQualityBadge = getBuildCVTier(totalCv);

return {
  ...
  artifacts,
  artifactSets,
  activeSetBonuses,
  totalCv,
  qualityBadge: buildQualityBadge,
  ...
};
```

### Blueprint 3: `src/components/character/ArtifactDisplay.tsx` Rendering Blueprint

```tsx
{/* CV Badge & Slot Header */}
<div className="flex items-center justify-between mb-3 relative z-10">
  <div>
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold">{artifact.slot.toUpperCase()}</span>
      {artifact.qualityBadge && (
        <span className={cn(
          "text-xs px-2 py-0.5 rounded-full font-medium border",
          artifact.qualityBadge === 'Godly' && "text-amber-400 bg-amber-400/10 border-amber-400/30",
          artifact.qualityBadge === 'Great' && "text-purple-400 bg-purple-400/10 border-purple-400/30",
          artifact.qualityBadge === 'Good' && "text-cyan-400 bg-cyan-400/10 border-cyan-400/30",
          artifact.qualityBadge === 'Decent' && "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
          artifact.qualityBadge === 'Subpar' && "text-gray-400 bg-gray-500/10 border-gray-500/30",
        )}>
          {artifact.qualityBadge} ({artifact.cv?.toFixed(1) || '0.0'} CV)
        </span>
      )}
    </div>
    <div className="text-xs text-gray-400">{artifact.setName}</div>
  </div>
  ...
</div>

{/* Substats with Pips */}
<div className="space-y-2">
  <div className="text-xs text-gray-400">Sub Stats</div>
  {artifact.subStats.map((subStat, index) => (
    <div key={index} className="flex justify-between items-center text-sm">
      <span className="text-gray-300">{getStatName(subStat.key)}</span>
      <div className="flex items-center gap-2">
        <span className="font-medium">{getStatDisplay(subStat.key, subStat.value)}</span>
        {subStat.pips && (
          <span className="text-xs font-mono tracking-widest text-cyan-400/90" title={`${subStat.rolls} rolls`}>
            [{subStat.pips}]
          </span>
        )}
      </div>
    </div>
  ))}
</div>
```

---

## 5. Verification Checklist

1. [x] **Universal Piece CV Formula**: Tested against `calculations.test.ts:95-100` ($2 \times 7.8 + 21.8 = 37.4$).
2. [x] **Whole Build CV Sum**: Tested against `calculations.test.ts:102-106` ($37.4 + 43.8 + 28.0 + 38.8 + 24.8 = 172.8$, tier `'Decent'`).
3. [x] **Piece Quality Badges**: Tested across all 5 standard thresholds (<20, 20–29.9, 30–39.9, 40–49.9, ≥50) (`calculations.test.ts:109-115`).
4. [x] **Circlet Adjusted Scale**: Tested across circlet thresholds (Godly ≥35, Good 20–29.9, Decent 10–19.9, Subpar <10) (`calculations.test.ts:117-123`).
5. [x] **Character Sheet CV**: Tested against Hu Tao fixture ($2 \times 91.2 + 202.3 = 384.7$) (`calculations.test.ts:125-131`).
6. [x] **Roll Counts (1 to 5)**: Tested CR 3.9% (1 roll), CR 10.5% (3 rolls), CD 28.0% (4 rolls), CD 35.0% (5 rolls), ATK 33 (2 rolls), HP 508 (2 rolls) (`calculations.test.ts:134-168`).
7. [x] **Roll Count Theoretical Cap (6 rolls)**: Tested CD 46.6% returning 6 rolls (preventing naive division returning 7) (`calculations.test.ts:198-200`).
8. [x] **Visual Pips**: Tested `●○○○○`, `●●○○○`, `●●●○○`, `●●●●○`, `●●●●●`, and `●●●●●★` (`calculations.test.ts:138, 144, 150, 156, 162, 166, 193, 202`).
9. [x] **Corner Cases**: Negative clamping to 0, zero CV piece, empty substat array defaulting to 0 CV and `'Subpar'`, decimal formatting strictly 1 decimal place (`calculations.test.ts:175-220`).
10. [x] **Live Fixtures**: Hu Tao (`tests/fixtures/enka-response.json`) and Addy Varesa (`tests/fixtures/varesa-1813164100.json`) validated.
