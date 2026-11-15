/// <reference types="vitest/globals" />
import {
  calculateDamage,
  calculateKqmDefMultiplier,
  calculateKqmResMultiplier,
  calculateKqmAmplifyingReaction,
  calculateKqmAdditiveReactionBonus,
  calculateKqmAverageCritMultiplier,
  getKqmLevelMultiplier,
  KQM_STANDARD_ENEMY,
} from '@/lib/damage-calc';
import type { Character } from '@/lib/enka/types';

describe('KeqingMains (KQM) Official Damage Formula Suite', () => {

  describe('1. KQM Defense Multiplier', () => {
    it('calculates equal level character vs enemy (Lv90 vs Lv90) as exactly 0.5 (50% reduction)', () => {
      const def = calculateKqmDefMultiplier(90, 90);
      expect(def).toBeCloseTo(0.5, 4);
    });

    it('calculates level disadvantage correctly (Lv80 character vs Lv90 enemy)', () => {
      // (80 + 100) / [(80 + 100) + (90 + 100)] = 180 / 370 ~ 0.486486
      const def = calculateKqmDefMultiplier(80, 90);
      expect(def).toBeCloseTo(180 / 370, 4);
    });

    it('applies DEF Ignore correctly (e.g. Raiden C2 60% DEF ignore)', () => {
      // (90 + 100) / [(90 + 100) + (90 + 100) * (1 - 0.6)] = 190 / [190 + 76] = 190 / 266 ~ 0.714285
      const def = calculateKqmDefMultiplier(90, 90, 0, 60);
      expect(def).toBeCloseTo(190 / 266, 4);
      expect(def).toBeGreaterThan(0.5);
    });

    it('applies DEF Reduction correctly (e.g. Klee C2 23% DEF shred)', () => {
      // 190 / [190 + 190 * 0.77] = 190 / 336.3 ~ 0.56497
      const def = calculateKqmDefMultiplier(90, 90, 23, 0);
      expect(def).toBeCloseTo(190 / 336.3, 4);
    });
  });

  describe('2. KQM Resistance Multiplier (Piecewise)', () => {
    it('applies standard 10% base resistance (0.90x multiplier)', () => {
      const res = calculateKqmResMultiplier(0.10, 0);
      expect(res).toBeCloseTo(0.90, 4);
    });

    it('applies negative resistance formula (1 - R/2) when resistance is shredded below 0 (e.g. 4pc VV -40%)', () => {
      // base 10% - 40% shred = -30% (-0.30)
      // 1 - (-0.30 / 2) = 1 + 0.15 = 1.15x multiplier
      const res = calculateKqmResMultiplier(0.10, 40);
      expect(res).toBeCloseTo(1.15, 4);
    });

    it('applies high resistance formula (1 / (4R + 1)) when R >= 75%', () => {
      // R = 80% = 0.80
      // 1 / (4 * 0.80 + 1) = 1 / 4.2 ~ 0.2381
      const res = calculateKqmResMultiplier(0.80, 0);
      expect(res).toBeCloseTo(1 / 4.2, 4);
    });

    it('handles neutral resistance (0% RES = 1.0x multiplier)', () => {
      const res = calculateKqmResMultiplier(0, 0);
      expect(res).toBe(1.0);
    });
  });

  describe('3. KQM Amplifying Reaction Multiplier (Vaporize & Melt)', () => {
    it('calculates Forward Vaporize with 0 EM as 2.0x', () => {
      const result = calculateKqmAmplifyingReaction('ForwardVape', 0);
      expect(result.multiplier).toBe(2.0);
      expect(result.emBonusPercent).toBe(0);
    });

    it('calculates Reverse Vaporize with 0 EM as 1.5x', () => {
      const result = calculateKqmAmplifyingReaction('ReverseVape', 0);
      expect(result.multiplier).toBe(1.5);
    });

    it('calculates Reverse Vaporize with 200 EM using official KQM formula: 2.78 * EM / (1400 + EM)', () => {
      // emBonus = (2.78 * 200) / 1600 = 556 / 1600 = 0.3475 (+34.75%)
      // total = 1.5 * (1 + 0.3475) = 2.02125
      const result = calculateKqmAmplifyingReaction('ReverseVape', 200);
      expect(result.emBonusPercent).toBeCloseTo(34.75, 2);
      expect(result.multiplier).toBeCloseTo(2.02125, 4);
    });

    it('adds flat reaction bonus percent (e.g. 4pc Crimson Witch 15%)', () => {
      // 1.5 * (1 + 0 + 0.15) = 1.725
      const result = calculateKqmAmplifyingReaction('ReverseVape', 0, 15);
      expect(result.multiplier).toBeCloseTo(1.725, 4);
    });
  });

  describe('4. KQM Additive Reaction Bonus (Spread & Aggravate)', () => {
    it('returns exact KQM Lv90 multiplier (1446.85)', () => {
      expect(getKqmLevelMultiplier(90)).toBe(1446.85);
      expect(getKqmLevelMultiplier(80)).toBe(1077.44);
    });

    it('calculates Aggravate flat bonus at Lv90 with 0 EM: 1446.85 * 1.15', () => {
      const result = calculateKqmAdditiveReactionBonus('Aggravate', 90, 0);
      expect(result.flatBonus).toBeCloseTo(1446.85 * 1.15, 2);
    });

    it('calculates Spread flat bonus at Lv90 with 0 EM: 1446.85 * 1.25', () => {
      const result = calculateKqmAdditiveReactionBonus('Spread', 90, 0);
      expect(result.flatBonus).toBeCloseTo(1446.85 * 1.25, 2);
    });

    it('calculates Additive EM scaling: 5 * EM / (1200 + EM)', () => {
      // EM 200: (5 * 200) / 1400 = 1000 / 1400 ~ 0.714285 (+71.43%)
      const result = calculateKqmAdditiveReactionBonus('Aggravate', 90, 200);
      expect(result.emBonusPercent).toBeCloseTo(71.4285, 2);
      expect(result.flatBonus).toBeCloseTo(1446.85 * 1.15 * (1 + 0.714285), 1);
    });
  });

  describe('5. KQM Expected Average Crit Multiplier', () => {
    it('calculates 100% CR and 200% CD as 3.0x expected damage', () => {
      const avg = calculateKqmAverageCritMultiplier(100, 200);
      expect(avg).toBe(3.0);
    });

    it('calculates 50% CR and 200% CD as 2.0x expected damage', () => {
      const avg = calculateKqmAverageCritMultiplier(50, 200);
      expect(avg).toBe(2.0);
    });

    it('clamps overcapped Crit Rate to 100%', () => {
      const avg = calculateKqmAverageCritMultiplier(125, 200);
      expect(avg).toBe(3.0);
    });
  });

  describe('6. Full Character Damage Calculations', () => {
    const mockHuTao: Character = {
      id: 10000046,
      name: 'Hu Tao',
      rarity: 5,
      level: 90,
      constellation: 1,
      element: 'Pyro',
      icon: 'https://enka.network/ui/UI_AvatarIcon_Hutao.png',
      friendship: 10,
      weapon: {
        id: 11510,
        name: 'Staff of Homa',
        rarity: 5,
        level: 90,
        ascension: 6,
        refinement: 1,
        baseAtk: 608,
        icon: 'https://enka.network/ui/UI_EquipIcon_Pole_Homa.png',
      },
      talents: { normal: 10, skill: 10, burst: 10 },
      artifacts: [],
      stats: {
        hp: 34500,
        atk: 2950,
        def: 876,
        em: 165,
        er: 110,
        cr: 72.5,
        cd: 235.4,
        dmgBonus: { pyro: 61.6 },
      },
    };

    const mockNeuvillette: Character = {
      id: 10000087,
      name: 'Neuvillette',
      rarity: 5,
      level: 90,
      constellation: 1,
      element: 'Hydro',
      icon: 'https://enka.network/ui/UI_AvatarIcon_Neuvillette.png',
      friendship: 10,
      weapon: {
        id: 14511,
        name: 'Tome of the Eternal Flow',
        rarity: 5,
        level: 90,
        ascension: 6,
        refinement: 1,
        baseAtk: 542,
        icon: 'https://enka.network/ui/UI_EquipIcon_Catalyst_Iudex.png',
      },
      talents: { normal: 10, skill: 10, burst: 10 },
      artifacts: [],
      stats: {
        hp: 41200,
        atk: 1150,
        def: 950,
        em: 42,
        er: 125,
        cr: 64.2,
        cd: 284.5,
        dmgBonus: { hydro: 46.6 },
      },
    };

    it('calculates Hu Tao reverse vaporize charged attack with full KQM breakdown', () => {
      const result = calculateDamage(mockHuTao);
      expect(result).toBeDefined();
      expect(result.totalDamage).toBeGreaterThan(50000);
      expect(result.averageDamage).toBeGreaterThan(0);
      expect(result.skillDamage).toBeGreaterThan(0);
      expect(result.burstDamage).toBeGreaterThan(0);
      expect(result.breakdown.length).toBeGreaterThanOrEqual(5);

      // Verify breakdown steps contain KQM terminology
      const steps = result.breakdown.map(b => b.step);
      expect(steps.some(s => s.includes('Base Damage'))).toBe(true);
      expect(steps.some(s => s.includes('DEF'))).toBe(true);
      expect(steps.some(s => s.includes('RES'))).toBe(true);
      expect(steps.some(s => s.includes('Reaction'))).toBe(true);
    });

    it('calculates Neuvillette Equitable Judgment beam using HP scaling', () => {
      const result = calculateDamage(mockNeuvillette);
      expect(result).toBeDefined();
      expect(result.assumptions.scalingStat).toBe('Max HP');
      expect(result.totalDamage).toBeGreaterThan(100000); // 8-tick full beam
      expect(result.averageDamage).toBeGreaterThan(0);
    });

    it('provides Universal Fallback calculation for unlisted/future characters without throwing or returning null', () => {
      const unlistedChar: Character = {
        id: 99999999,
        name: 'Custom New Character',
        rarity: 5,
        level: 90,
        constellation: 0,
        element: 'Electro',
        icon: '',
        friendship: 1,
        weapon: { id: 1, name: 'Weapon', rarity: 4, level: 90, ascension: 6, refinement: 1, baseAtk: 510, icon: '' },
        talents: { normal: 8, skill: 8, burst: 8 },
        artifacts: [],
        stats: {
          hp: 18000,
          atk: 2200,
          def: 800,
          em: 150,
          er: 130,
          cr: 60,
          cd: 150,
          dmgBonus: { electro: 46.6 },
        },
      };

      const result = calculateDamage(unlistedChar);
      expect(result).toBeDefined();
      expect(result.totalDamage).toBeGreaterThan(0);
      expect(result.skillDamage).toBeGreaterThan(0);
      expect(result.burstDamage).toBeGreaterThan(0);
      expect(result.averageDamage).toBeGreaterThan(0);
      expect(result.breakdown.length).toBeGreaterThan(0);
    });

    it('computes realistic KQM damage distribution summing exactly to 100%', () => {
      const huTaoResult = calculateDamage(mockHuTao);
      expect(huTaoResult.distribution).toBeDefined();
      expect(huTaoResult.distribution.normalChargedPercent + huTaoResult.distribution.skillPercent + huTaoResult.distribution.burstPercent).toBe(100);
      // Hu Tao is CA-heavy DPS (~70-80% normal/CA)
      expect(huTaoResult.distribution.normalChargedPercent).toBeGreaterThanOrEqual(60);

      const neuviResult = calculateDamage(mockNeuvillette);
      expect(neuviResult.distribution).toBeDefined();
      expect(neuviResult.distribution.normalChargedPercent + neuviResult.distribution.skillPercent + neuviResult.distribution.burstPercent).toBe(100);
      expect(neuviResult.distribution.normalChargedPercent).toBeGreaterThanOrEqual(60);
    });
  });
});
