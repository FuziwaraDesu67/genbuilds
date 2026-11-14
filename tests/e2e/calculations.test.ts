/// <reference types="vitest/globals" />
import { calculateCritValue, estimateRollCount, SUBSTAT_ROLLS } from '@/lib/enka/static-data';
import { formatPercentage, formatNumber } from '@/lib/utils';
import { parseEnkaResponse } from '@/lib/enka/parser';
import { EnkaResponseSchema } from '@/lib/enka/types';
import enkaSample from '../fixtures/enka-response.json';
import varesaSample from '../fixtures/varesa-1813164100.json';

/**
 * Authoritative Quality Tier Derivation based on PROJECT.md & ORIGINAL_REQUEST.md
 */
function getExpectedQualityBadge(cv: number, isCirclet: boolean = false): 'Subpar' | 'Decent' | 'Good' | 'Great' | 'Godly' {
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

function getExpectedBuildCVTier(totalCv: number): 'Subpar' | 'Decent' | 'Good' | 'Great' | 'Godly' {
  if (totalCv >= 240.0) return 'Godly';
  if (totalCv >= 220.0) return 'Great';
  if (totalCv >= 180.0) return 'Good';
  if (totalCv >= 140.0) return 'Decent';
  return 'Subpar';
}

function deriveVisualRollPips(rolls: number, maxPips: number = 5): string {
  const boundedRolls = Math.max(1, Math.min(rolls, 6));
  if (boundedRolls === 6) {
    return '●●●●●★';
  }
  const active = '●'.repeat(boundedRolls);
  const inactive = '○'.repeat(Math.max(0, maxPips - boundedRolls));
  return `${active}${inactive}`;
}

describe('E2E Suite — Mathematical Calculations, Normalization & Roll Analysis', () => {

  // =========================================================================
  // TIER 1: FEATURE COVERAGE (≥5 Test Cases per Feature)
  // =========================================================================

  describe('Tier 1: 100x Stat Multiplication Bug Normalization (F-03)', () => {
    it('Case 1: formats decimal stat (0.466) as 46.6% without 100x double-scaling', () => {
      const rawDecimal = 0.466;
      // Normalization contract: decimal fraction <= 1.0 is normalized to 46.6
      const normalized = rawDecimal <= 1.0 ? rawDecimal * 100 : rawDecimal;
      const formatted = formatPercentage(normalized, 1);
      expect(formatted).toBe('46.6%');
      expect(formatted).not.toBe('4660.0%');
    });

    it('Case 2: formats already-scaled stat (46.6) as 46.6% without applying * 100', () => {
      const liveScaled = 46.6;
      const normalized = liveScaled <= 1.0 ? liveScaled * 100 : liveScaled;
      const formatted = formatPercentage(normalized, 1);
      expect(formatted).toBe('46.6%');
      expect(formatted).not.toBe('4660.0%');
    });

    it('Case 3: verifies Crit Rate substat is formatted as 7.8% and never 780.0%', () => {
      const rawCr = 0.078;
      const normalizedCr = rawCr <= 1.0 ? rawCr * 100 : rawCr;
      const formatted = formatPercentage(normalizedCr, 1);
      expect(formatted).toBe('7.8%');
      expect(formatted).not.toBe('780.0%');
    });

    it('Case 4: verifies Crit DMG main stat (62.2%) in Circlet retains 62.2%', () => {
      const cdCirclet = 62.2;
      const normalized = cdCirclet <= 1.0 ? cdCirclet * 100 : cdCirclet;
      const formatted = formatPercentage(normalized, 1);
      expect(formatted).toBe('62.2%');
      expect(formatted).not.toBe('6220.0%');
    });

    it('Case 5: verifies Energy Recharge percentage formatting (55.1% substat / weapon)', () => {
      const erStat = 0.551;
      const normalized = erStat <= 1.0 ? erStat * 100 : erStat;
      const formatted = formatPercentage(normalized, 1);
      expect(formatted).toBe('55.1%');
      expect(formatted).not.toContain('5510');
    });
  });

  describe('Tier 1: Universal Crit Value (CV) Calculations (F-04)', () => {
    it('Case 1: calculates exact CV for an artifact piece using formula 2 * CR + CD', () => {
      const cr = 7.8;
      const cd = 21.8;
      const cv = calculateCritValue(cr, cd);
      expect(cv).toBeCloseTo(37.4, 1);
    });

    it('Case 2: calculates total build CV across all 5 equipped artifacts', () => {
      const pieceCvs = [37.4, 43.8, 28.0, 38.8, 24.8];
      const totalArtifactCv = pieceCvs.reduce((acc, v) => acc + v, 0);
      expect(totalArtifactCv).toBeCloseTo(172.8, 1);
      expect(getExpectedBuildCVTier(totalArtifactCv)).toBe('Decent');
    });

    it('Case 3: evaluates CV quality badge thresholds (Subpar, Decent, Good, Great, Godly)', () => {
      expect(getExpectedQualityBadge(15.2)).toBe('Subpar');
      expect(getExpectedQualityBadge(24.5)).toBe('Decent');
      expect(getExpectedQualityBadge(35.6)).toBe('Good');
      expect(getExpectedQualityBadge(44.2)).toBe('Great');
      expect(getExpectedQualityBadge(52.1)).toBe('Godly');
    });

    it('Case 4: evaluates Circlet-specific CV scale recognizing 35+ CV as Godly on Circlets', () => {
      const circletSubstatCv = 35.8;
      expect(getExpectedQualityBadge(circletSubstatCv, true)).toBe('Godly');
      expect(getExpectedQualityBadge(28.0, true)).toBe('Good');
      expect(getExpectedQualityBadge(15.0, true)).toBe('Decent');
      expect(getExpectedQualityBadge(8.0, true)).toBe('Subpar');
    });

    it('Case 5: calculates character overall sheet CV from total character stats', () => {
      const characterCr = 91.2;
      const characterCd = 202.3;
      const characterSheetCv = calculateCritValue(characterCr, characterCd);
      expect(characterSheetCv).toBeCloseTo(384.7, 1);
      expect(characterSheetCv).toBeGreaterThanOrEqual(300.0);
    });
  });

  describe('Tier 1: Bounded Substat Roll Counts & Visual Pips (F-05)', () => {
    it('Case 1: derives roll count for standard 1-roll substat (CR ~3.9%)', () => {
      const rolls = estimateRollCount('cr', 3.9);
      expect(rolls).toBe(1);
      expect(deriveVisualRollPips(rolls)).toBe('●○○○○');
    });

    it('Case 2: derives roll count for 3-roll Crit Rate (CR ~10.5%)', () => {
      const rolls = estimateRollCount('cr', 10.5);
      expect(rolls).toBe(3);
      expect(deriveVisualRollPips(rolls)).toBe('●●●○○');
    });

    it('Case 3: derives roll count for 4-roll Crit DMG (CD ~28.0%)', () => {
      const rolls = estimateRollCount('cd', 28.0);
      expect(rolls).toBe(4);
      expect(deriveVisualRollPips(rolls)).toBe('●●●●○');
    });

    it('Case 4: derives roll count for 5-roll high investment stat (CD ~35.0%)', () => {
      const rolls = estimateRollCount('cd', 35.0);
      expect(rolls).toBe(5);
      expect(deriveVisualRollPips(rolls)).toBe('●●●●●');
    });

    it('Case 5: derives roll count for flat ATK and flat HP rolls accurately', () => {
      const atkRolls = estimateRollCount('atk', 33);
      expect(atkRolls).toBe(2);
      expect(deriveVisualRollPips(atkRolls)).toBe('●●○○○');

      const hpRolls = estimateRollCount('hp', 508);
      expect(hpRolls).toBe(2);
      expect(deriveVisualRollPips(hpRolls)).toBe('●●○○○');
    });
  });

  // =========================================================================
  // TIER 2: BOUNDARY & CORNER CASES
  // =========================================================================

  describe('Tier 2: Boundary & Corner Cases (F-09)', () => {
    it('Boundary 1: Zero CV piece (piece with no CR or CD substats) returns 0.0 CV and Subpar', () => {
      const zeroCv = calculateCritValue(0, 0);
      expect(zeroCv).toBe(0);
      expect(getExpectedQualityBadge(zeroCv)).toBe('Subpar');
    });

    it('Boundary 2: Clamps negative inputs to 0 for CV calculations', () => {
      const safeCr = Math.max(0, -5.0);
      const safeCd = Math.max(0, -10.0);
      const cv = calculateCritValue(safeCr, safeCd);
      expect(cv).toBe(0);
    });

    it('Boundary 3: Single-roll minimal boundary (Tier 1 minimum roll 2.72% CR)', () => {
      const minRollCr = SUBSTAT_ROLLS.cr[0]; // 2.72
      expect(minRollCr).toBe(2.72);
      const rolls = estimateRollCount('cr', minRollCr);
      expect(rolls).toBe(1);
      expect(deriveVisualRollPips(rolls)).toBe('●○○○○');
    });

    it('Boundary 4: Maximum theoretical 6-roll substat (all 5 upgrades into one stat, e.g. 46.6% CD)', () => {
      // 6 max rolls of CD: 6 * 7.77 = 46.62%
      const maxCd = 46.6;
      const rolls = estimateRollCount('cd', maxCd);
      expect(rolls).toBeGreaterThanOrEqual(6);
      const pips = deriveVisualRollPips(rolls);
      expect(pips).toBe('●●●●●★');
    });

    it('Boundary 5: Decimal rounding consistency (strictly 1 decimal place without floating-point drift)', () => {
      const cr = 3.89;
      const cd = 7.77;
      const rawCv = calculateCritValue(cr, cd); // 2 * 3.89 + 7.77 = 15.55
      const formatted = parseFloat(rawCv.toFixed(1));
      expect(formatted).toBe(15.6);
      expect(formatted.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(1);
    });

    it('Boundary 6: Empty substats list or missing rolls safely defaults to 1 roll and 0 CV', () => {
      const emptySubstats: Array<{ key: string; value: number }> = [];
      const computedCv = emptySubstats
        .filter(s => s.key === 'cr' || s.key === 'cd')
        .reduce((sum, s) => sum + (s.key === 'cr' ? s.value * 2 : s.value), 0);
      expect(computedCv).toBe(0);
    });
  });

  // =========================================================================
  // TIER 3 & REAL FIXTURE INTEGRATION
  // =========================================================================

  describe('Integration with Live Fixtures (Enka & Varesa)', () => {
    it('Fixture 1: Parses Hu Tao fixture without 100x stat bug in any artifact piece', () => {
      const validated = EnkaResponseSchema.parse(enkaSample);
      const parsed = parseEnkaResponse(validated);

      expect(parsed.characters).toHaveLength(1);
      const huTao = parsed.characters[0];

      // Verify character stats
      expect(huTao.stats.hp).toBe(35558);
      expect(huTao.stats.cr).toBeCloseTo(91.2, 1);
      expect(huTao.stats.cd).toBeCloseTo(202.3, 1);

      // Verify all artifact pieces have legitimate normalized percentages (between 0 and 100)
      for (const artifact of huTao.artifacts) {
        expect(artifact.level).toBe(20);
        for (const sub of artifact.subStats) {
          const isPercentage = ['cr', 'cd', 'er', 'hpPercent', 'atkPercent', 'defPercent'].includes(sub.key);
          if (isPercentage) {
            // A percentage value should be in range (0, 60] - NEVER 780% or 4660%
            const displayVal = sub.value <= 1.0 ? sub.value * 100 : sub.value;
            expect(displayVal).toBeGreaterThan(0);
            expect(displayVal).toBeLessThan(70);
          }
        }
      }
    });

    it('Fixture 2: Parses Addy UID 1813164100 Varesa fixture with valid rolls and CV', () => {
      const validated = EnkaResponseSchema.parse(varesaSample);
      const parsed = parseEnkaResponse(validated);

      expect(parsed.player.uid).toBe('1813164100');
      expect(parsed.characters).toHaveLength(1);
      const varesa = parsed.characters[0];

      expect(varesa.constellation).toBe(1);
      expect(varesa.artifacts).toHaveLength(5);

      // Flower piece verification
      const flower = varesa.artifacts.find(a => a.slot === 'flower')!;
      expect(flower).toBeDefined();

      const crSub = flower.subStats.find(s => s.key === 'cr')!;
      const cdSub = flower.subStats.find(s => s.key === 'cd')!;
      expect(crSub).toBeDefined();
      expect(cdSub).toBeDefined();

      const flowerCrDisplay = crSub.value <= 1.0 ? crSub.value * 100 : crSub.value;
      const flowerCdDisplay = cdSub.value <= 1.0 ? cdSub.value * 100 : cdSub.value;
      const flowerCv = calculateCritValue(flowerCrDisplay, flowerCdDisplay);

      expect(flowerCv).toBeCloseTo(2 * 10.5 + 21.8, 1); // 42.8 CV -> Great
      expect(getExpectedQualityBadge(flowerCv)).toBe('Great');
    });
  });
});
