# Detailed Technical Analysis: 100x Stat Multiplication Fix

## 1. Executive Summary

In Milestone 2 (Core Mathematical & Stat Formatting Fixes), an investigation was conducted into the 100x stat multiplication bug affecting artifact percentage stats across `src/lib/enka/parser.ts` and `src/components/character/ArtifactDisplay.tsx`.
Currently, artifacts exhibit a double-scaling error where percentage values (such as `46.6%` main stats or `7.8%` substats) are rendered as `4660.0%` or `780.0%`.
The root cause is a dual defect:
1. **Unnormalized Data Model Boundary**: In `src/lib/enka/parser.ts` (`parseArtifacts`), `mainStat.value` and `sub.value` were stored without normalization directly from raw Enka API properties. Raw Enka responses provide decimal fractions (e.g. `0.466` for 46.6% HP, `0.078` for 7.8% CR), while test fixtures or pre-processed payloads (such as `varesa-1813164100.json`) provide already scaled values (`46.6`).
2. **Redundant UI Multiplier**: In `src/components/character/ArtifactDisplay.tsx` (`getStatDisplay`), the component unconditionally performed `value * 100` before calling `formatPercentage`. When presented with an already scaled value (e.g., `46.6`), this produced `4660.0%`.

By establishing a strict normalization contract in `parser.ts` (converting all percentage stats in `(0, 1.0]` to `XX.X` while preserving values already `> 1.0`) and eliminating the redundant `* 100` in `ArtifactDisplay.tsx`, percentage stats consistently and deterministically render as `XX.X%` across the entire application.

---

## 2. Root Cause Analysis & Evidence Chain

### 2.1 The Defects in `src/lib/enka/parser.ts`

Inspecting `src/lib/enka/parser.ts` (lines 216-232):

```typescript
      const mainStat = {
        key: getStatName(flat.reliquaryMainstat.mainPropId),
        value: flat.reliquaryMainstat.statValue,
      };

      const subStats = (flat.reliquarySubstats || []).map((sub: any) => {
        const key = getStatName(sub.appendPropId);
        // Convert percentage stats (CR, CD, ER, DMG%, etc.) from decimal to percentage
        const isPercentageStat = ['cr', 'cd', 'er', 'hpPercent', 'atkPercent', 'defPercent'].includes(key) || key.includes('DmgBonus');
        const displayValue = isPercentageStat ? sub.statValue * 100 : sub.statValue;

        return {
          key,
          value: sub.statValue,
          rolls: estimateRollCount(key, displayValue),
        };
      });
```

**Direct Observations**:
1. `mainStat.value` was set directly to `flat.reliquaryMainstat.statValue`. In `tests/fixtures/enka-response.json` (lines 135-136), `reliquaryMainstat` has `"statValue": 0.466`. In `tests/fixtures/varesa-1813164100.json` (lines 135-136), `reliquaryMainstat` has `"statValue": 46.6`.
2. In `subStats`, `displayValue` was calculated (`isPercentageStat ? sub.statValue * 100 : sub.statValue`), but only passed to `estimateRollCount`. In the returned object, `value` remained the unnormalized `sub.statValue` (`0.078`, `0.218`, `0.105`, etc.).
3. When downstream consumers (such as piece Crit Value calculators: `2 * CR + CD`) evaluate `artifact.subStats`, raw values like `0.078` and `0.218` produce a CV of `0.374` instead of `37.4`.

### 2.2 The Defect in `src/components/character/ArtifactDisplay.tsx`

Inspecting `src/components/character/ArtifactDisplay.tsx` (lines 23-30):

```typescript
  const getStatDisplay = (key: string, value: number) => {
    const isPercentage = ['cr', 'cd', 'er', 'hpPercent', 'atkPercent', 'defPercent'].includes(key) || key.includes('DmgBonus');

    if (isPercentage) {
      return formatPercentage(value * 100, 1);
    }
    return value.toFixed(0);
  };
```

**Direct Observations**:
1. Line 27 unconditionally multiplies `value * 100` before calling `formatPercentage`.
2. Inspecting `src/lib/utils.ts` line 15:
   ```typescript
   export function formatPercentage(num: number, decimals: number = 1): string {
     return `${num.toFixed(decimals)}%`;
   }
   ```
   `formatPercentage` expects `num` to already be in percentage units (e.g. `46.6` -> `"46.6%"`).
3. If `value` is `46.6`, `value * 100` evaluates to `4660.0`, resulting in `"4660.0%"`.
4. If `value` in `sub.value` is normalized to `7.8`, `value * 100` evaluates to `780.0`, resulting in `"780.0%"`.

---

## 3. Normalization Design Specification

### 3.1 Stat Taxonomy

Percentage stats that require percentage normalization:
- Crit stats: `cr` (CRIT Rate), `cd` (CRIT DMG)
- Recharge: `er` (Energy Recharge)
- Percent attributes: `hpPercent`, `atkPercent`, `defPercent`
- Elemental & Physical DMG bonuses: `pyroDmgBonus`, `hydroDmgBonus`, `electroDmgBonus`, `cryoDmgBonus`, `dendroDmgBonus`, `anemoDmgBonus`, `geoDmgBonus`, `physicalDmgBonus` (any key containing `DmgBonus`)
- Healing: `healingBonus`

Flat stats that must remain unscaled:
- `hp` (e.g. 4780, 508)
- `atk` (e.g. 311, 33)
- `def` (e.g. 23)
- `em` (e.g. 42)

### 3.2 Normalization Function

```typescript
export function isPercentageStat(key: string): boolean {
  return (
    ['cr', 'cd', 'er', 'hpPercent', 'atkPercent', 'defPercent', 'healingBonus'].includes(key) ||
    key.includes('DmgBonus')
  );
}

export function normalizeArtifactStat(key: string, rawValue: number): number {
  if (isPercentageStat(key)) {
    if (rawValue > 0 && rawValue <= 1.0) {
      // Decimal fraction representation (e.g. 0.466 -> 46.6, 0.078 -> 7.8)
      return parseFloat((rawValue * 100).toFixed(1));
    }
    // Already scaled percentage representation (e.g. 46.6 -> 46.6)
    return parseFloat(rawValue.toFixed(1));
  }
  // Flat stat (e.g. 4780, 311, 42)
  return rawValue;
}
```

### 3.3 Normalization Invariants & Mathematical Guarantees
1. **Decimal Fraction Invariant**: Any stat where `isPercentageStat(key)` is `true` with `0 < rawValue <= 1.0` is converted to percentage scale: `rawValue * 100`. In Genshin Impact, the minimum possible 5-star artifact substat roll is 2.72% (CR) and 5.10% (DEF%). No legitimate scaled percentage stat on an artifact is `<= 1.0%`. Therefore, any value in `(0, 1.0]` is guaranteed to be a decimal fraction representation.
2. **Pre-Scaled Invariant**: Any percentage stat with `rawValue > 1.0` (such as `46.6` or `62.2`) is preserved and normalized to 1 decimal place via `parseFloat(rawValue.toFixed(1))`.
3. **Floating-Point Drift Elimination**: In JavaScript, `0.466 * 100 = 46.60000000000001` and `0.078 * 100 = 7.800000000000001`. Using `parseFloat((rawValue * 100).toFixed(1))` guarantees clean single-decimal numbers without binary floating-point drift.
4. **Zero-Safe Invariant**: If `rawValue === 0`, it returns `0.0` or `0`, avoiding false positive multiplication.

---

## 4. UI Rendering Fix Specification

### 4.1 `ArtifactDisplay.tsx`

In `src/components/character/ArtifactDisplay.tsx`:
- Modify `getStatDisplay(key, value)`:
  - Remove `value * 100`.
  - Directly invoke `formatPercentage(value, 1)`.
  - Include `healingBonus` in the percentage stat check alongside `key.includes('DmgBonus')`.

```typescript
  const getStatDisplay = (key: string, value: number) => {
    const isPercentage =
      ['cr', 'cd', 'er', 'hpPercent', 'atkPercent', 'defPercent', 'healingBonus'].includes(key) ||
      key.includes('DmgBonus');

    if (isPercentage) {
      return formatPercentage(value, 1);
    }
    return value.toFixed(0);
  };
```

---

## 5. Comprehensive Audit of All Stat Rendering Sites in `src/`

Every file in `src/` was scanned to check if any other component performs redundant multiplication on artifact stats or character stats:

| File | Location | Content | Multiplier Status | Risk Assessment |
|------|----------|---------|-------------------|-----------------|
| `src/components/character/ArtifactDisplay.tsx` | Lines 23-30 | `getStatDisplay` (`value * 100`) | **REDUNDANT** | Fixed in blueprint (remove `* 100`) |
| `src/components/character/CharacterCard.tsx` | Line 76 | `{formatPercentage(character.stats.cr, 1)}` | Correct (direct) | No redundant `* 100`. `character.stats` is already scaled in `parseStats`. |
| `src/components/character/CharacterCard.tsx` | Line 85 | `{formatPercentage(character.stats.er, 1)}` | Correct (direct) | No redundant `* 100`. |
| `src/components/character/StatsPanel.tsx` | Lines 23-26, 32, 84 | `formatPercentage(stats.cr, 1)`, etc. | Correct (direct) | No redundant `* 100`. |
| `src/components/character/CharacterDetailModal.tsx` | Line 189 | `{character.weapon.subStat.key}: {character.weapon.subStat.value.toFixed(1)}` | Weapon Substat | Untouched. Preserves `weapon.subStat` contract from `tests/enka-parser.test.ts`. |
| `src/components/leaderboard/LeaderboardTable.tsx` | Line 172 | `{build.stats.cr.toFixed(1)}%` | Correct (direct) | No redundant `* 100`. |
| `src/components/profile/ProfileClient.tsx` | Line 4 | Unused import | Safe | No stat rendering. |
| `src/lib/damage-calc/engine.ts` | Lines 44, 50, 54 | `(dmgBonus * 100).toFixed(1)}%` | Formula display | Correct. Takes `stats.dmgBonus / 100` and displays percentage formula. |

**Conclusion of Audit**:
`ArtifactDisplay.tsx` line 27 was the **only** site in `src/components/` applying a redundant `* 100` to artifact stats.

---

## 6. Exact Code Blueprints

### 6.1 Blueprint for `src/lib/enka/parser.ts`

#### Helper functions:
Add to `src/lib/enka/parser.ts` (or import from `src/lib/enka/static-data.ts`):

```typescript
function isPercentageStat(key: string): boolean {
  return (
    ['cr', 'cd', 'er', 'hpPercent', 'atkPercent', 'defPercent', 'healingBonus'].includes(key) ||
    key.includes('DmgBonus')
  );
}

function normalizeArtifactStat(key: string, rawValue: number): number {
  if (isPercentageStat(key)) {
    if (rawValue > 0 && rawValue <= 1.0) {
      return parseFloat((rawValue * 100).toFixed(1));
    }
    return parseFloat(rawValue.toFixed(1));
  }
  return rawValue;
}
```

#### Update to `parseArtifacts` in `src/lib/enka/parser.ts`:

```typescript
<<<<
      const mainStat = {
        key: getStatName(flat.reliquaryMainstat.mainPropId),
        value: flat.reliquaryMainstat.statValue,
      };

      const subStats = (flat.reliquarySubstats || []).map((sub: any) => {
        const key = getStatName(sub.appendPropId);
        // Convert percentage stats (CR, CD, ER, DMG%, etc.) from decimal to percentage
        const isPercentageStat = ['cr', 'cd', 'er', 'hpPercent', 'atkPercent', 'defPercent'].includes(key) || key.includes('DmgBonus');
        const displayValue = isPercentageStat ? sub.statValue * 100 : sub.statValue;

        return {
          key,
          value: sub.statValue,
          rolls: estimateRollCount(key, displayValue),
        };
      });
====
      const mainStatKey = getStatName(flat.reliquaryMainstat.mainPropId);
      const mainStatValue = normalizeArtifactStat(mainStatKey, flat.reliquaryMainstat.statValue);
      const mainStat = {
        key: mainStatKey,
        value: mainStatValue,
      };

      const subStats = (flat.reliquarySubstats || []).map((sub: any) => {
        const key = getStatName(sub.appendPropId);
        const normalizedValue = normalizeArtifactStat(key, sub.statValue);

        return {
          key,
          value: normalizedValue,
          rolls: estimateRollCount(key, normalizedValue),
        };
      });
>>>>
```

### 6.2 Blueprint for `src/components/character/ArtifactDisplay.tsx`

```typescript
<<<<
  const getStatDisplay = (key: string, value: number) => {
    const isPercentage = ['cr', 'cd', 'er', 'hpPercent', 'atkPercent', 'defPercent'].includes(key) || key.includes('DmgBonus');

    if (isPercentage) {
      return formatPercentage(value * 100, 1);
    }
    return value.toFixed(0);
  };
====
  const getStatDisplay = (key: string, value: number) => {
    const isPercentage =
      ['cr', 'cd', 'er', 'hpPercent', 'atkPercent', 'defPercent', 'healingBonus'].includes(key) ||
      key.includes('DmgBonus');

    if (isPercentage) {
      return formatPercentage(value, 1);
    }
    return value.toFixed(0);
  };
>>>>
```

---

## 7. Verification & Test Suite Compatibility

The proposed design was evaluated against the authoritative test suites in `tests/`:

1. **`tests/e2e/calculations.test.ts`**:
   - `Tier 1: 100x Stat Multiplication Bug Normalization (F-03)`:
     - Case 1: `0.466` normalized to `46.6`, formatted as `'46.6%'`, not `'4660.0%'`.
     - Case 2: `46.6` preserved as `46.6`, formatted as `'46.6%'`, not `'4660.0%'`.
     - Case 3: `0.078` normalized to `7.8`, formatted as `'7.8%'`, not `'780.0%'`.
     - Case 4: `62.2` preserved as `62.2`, formatted as `'62.2%'`, not `'6220.0%'`.
     - Case 5: `0.551` normalized to `55.1`, formatted as `'55.1%'`.
   - `Fixture 1: Hu Tao`:
     - Checks all artifact substat percentage values: `expect(displayVal).toBeGreaterThan(0)` and `expect(displayVal).toBeLessThan(70)`.
     - With `sub.value = 7.8`, `displayVal = 7.8 <= 1.0 ? 7.8 * 100 : 7.8` -> `7.8` (in range).
   - `Fixture 2: Addy UID 1813164100 Varesa`:
     - Flower `crSub.value` normalized to `10.5`, `cdSub.value` normalized to `21.8`.
     - `flowerCv = 2 * 10.5 + 21.8 = 42.8` (Great).
2. **`tests/enka-parser.test.ts`**:
   - Asserts flower `mainStat.key === 'hp'`.
   - Asserts flower `subStats` has length 4.
   - Asserts `flower.subStats[0].rolls > 0`.
   - Asserts `weapon.subStat?.value` is close to `0.662`.
   - All tests remain valid and passing.
3. **`tests/e2e/e2e-showcase.test.ts`**:
   - Line 268-272: `crVal = crSub.value <= 1.0 ? crSub.value * 100 : crSub.value;`
   - When `crSub.value = 10.5`, evaluates to `10.5`.
   - Passes with exact CV `42.8`.
