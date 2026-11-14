/// <reference types="vitest/globals" />
import {
  calculateCritValue,
  getQualityBadge,
  getBuildCVTier,
  estimateRollCount,
  deriveVisualRollPips,
  SUBSTAT_ROLLS,
} from '../src/lib/enka/static-data';
import {
  isPercentageStat,
  normalizeArtifactStat,
  parseEnkaResponse,
} from '../src/lib/enka/parser';

describe('Adversarial Stress Suite M2: Mathematical & Roll Calculations', () => {

  // =========================================================================
  // 1. EXTREME CRIT VALUES & BOUNDARY DEFENSIVE CALCULATIONS
  // =========================================================================

  describe('1. Extreme Crit Values (CV Calculation Robustness)', () => {
    it('calculates 0.0 CV for zero crit rate and zero crit damage', () => {
      const cv = calculateCritValue(0, 0);
      expect(cv).toBe(0);
      expect(getQualityBadge(cv)).toBe('Subpar');
      expect(getQualityBadge(cv, true)).toBe('Subpar');
    });

    it('clamps negative inputs to 0 for both CR and CD', () => {
      expect(calculateCritValue(-5, -10)).toBe(0);
      expect(calculateCritValue(-0.01, -0.01)).toBe(0);
      expect(calculateCritValue(-100, -200)).toBe(0);
    });

    it('clamps one negative input while preserving the other valid positive input', () => {
      // Negative CR (-5) clamped to 0, positive CD (20.0) preserved -> 20.0
      expect(calculateCritValue(-5, 20.0)).toBe(20.0);
      // Positive CR (10.0) doubled (20.0), negative CD (-15) clamped to 0 -> 20.0
      expect(calculateCritValue(10.0, -15)).toBe(20.0);
    });

    it('calculates extremely high CV (> 60 CV) accurately without integer overflow or distortion', () => {
      // 6-roll CR (23.3) * 2 = 46.6 CV
      expect(calculateCritValue(23.3, 0)).toBe(46.6);

      // Max theoretical 4-line start god piece: 3 rolls CR (~10.5) + 3 rolls CD (~23.3)
      // 2 * 10.5 + 23.3 = 44.3 CV
      expect(calculateCritValue(10.5, 23.3)).toBe(44.3);

      // Hypothetical >60 CV artifact (e.g. 15.6 CR + 35.0 CD = 66.2 CV)
      const godlyCv = calculateCritValue(15.6, 35.0);
      expect(godlyCv).toBe(66.2);
      expect(getQualityBadge(godlyCv)).toBe('Godly');

      // Character overall sheet CV (e.g. 91.2 CR + 202.3 CD = 384.7 CV)
      const sheetCv = calculateCritValue(91.2, 202.3);
      expect(sheetCv).toBe(384.7);
    });

    it('defensively handles undefined, null, NaN, and infinite inputs', () => {
      expect(calculateCritValue(undefined, undefined)).toBe(0);
      expect(calculateCritValue(null as any, null as any)).toBe(0);
      expect(calculateCritValue(NaN, NaN)).toBe(0);
      expect(calculateCritValue(NaN, 20)).toBe(20.0);
      expect(calculateCritValue(10, NaN)).toBe(20.0);
      expect(calculateCritValue(-Infinity, -Infinity)).toBe(0);
    });

    it('enforces strict single decimal place rounding without floating point drift', () => {
      // 2 * 3.89 + 7.77 = 7.78 + 7.77 = 15.55 -> should round to 15.5 or 15.6, strictly 1 decimal place
      const cv1 = calculateCritValue(3.89, 7.77);
      const str1 = cv1.toString();
      const decimals1 = str1.includes('.') ? str1.split('.')[1].length : 0;
      expect(decimals1).toBeLessThanOrEqual(1);

      // Typical floating point drift: 0.1 + 0.2 = 0.30000000000000004
      const cvDrift = calculateCritValue(0.1, 0.2);
      expect(cvDrift).toBe(0.4);
      expect(cvDrift.toString()).toBe('0.4');
    });
  });

  // =========================================================================
  // 2. QUALITY BADGE BOUNDARIES FOR STANDARD PIECES
  // =========================================================================

  describe('2. Quality Badge Boundaries for Standard Pieces (Flower, Plume, Sands, Goblet)', () => {
    // Standard piece tiers:
    // < 20.0: Subpar
    // 20.0 - 29.9: Decent
    // 30.0 - 39.9: Good
    // 40.0 - 49.9: Great
    // >= 50.0: Godly

    it('evaluates Subpar vs Decent threshold at 20.0 CV', () => {
      expect(getQualityBadge(19.9, false)).toBe('Subpar');
      expect(getQualityBadge(19.99, false)).toBe('Subpar');
      expect(getQualityBadge(20.0, false)).toBe('Decent');
      expect(getQualityBadge(20.01, false)).toBe('Decent');
    });

    it('evaluates Decent vs Good threshold at 30.0 CV', () => {
      expect(getQualityBadge(29.9, false)).toBe('Decent');
      expect(getQualityBadge(29.99, false)).toBe('Decent');
      expect(getQualityBadge(30.0, false)).toBe('Good');
      expect(getQualityBadge(30.01, false)).toBe('Good');
    });

    it('evaluates Good vs Great threshold at 40.0 CV', () => {
      expect(getQualityBadge(39.9, false)).toBe('Good');
      expect(getQualityBadge(39.99, false)).toBe('Good');
      expect(getQualityBadge(40.0, false)).toBe('Great');
      expect(getQualityBadge(40.01, false)).toBe('Great');
    });

    it('evaluates Great vs Godly threshold at 50.0 CV', () => {
      expect(getQualityBadge(49.9, false)).toBe('Great');
      expect(getQualityBadge(49.99, false)).toBe('Great');
      expect(getQualityBadge(50.0, false)).toBe('Godly');
      expect(getQualityBadge(50.01, false)).toBe('Godly');
      expect(getQualityBadge(65.4, false)).toBe('Godly');
    });

    it('defaults isCirclet parameter to false', () => {
      expect(getQualityBadge(32.0)).toBe('Good');
      expect(getQualityBadge(42.0)).toBe('Great');
      expect(getQualityBadge(52.0)).toBe('Godly');
    });
  });

  // =========================================================================
  // 3. QUALITY BADGE BOUNDARIES FOR CIRCLETS
  // =========================================================================

  describe('3. Quality Badge Boundaries for Circlets (Circlet Specific Scale)', () => {
    // Circlet piece tiers (substat CV only, since main stat is already CR/CD):
    // < 10.0: Subpar
    // 10.0 - 19.9: Decent
    // 20.0 - 29.9: Good
    // 30.0 - 34.9: Great
    // >= 35.0: Godly

    it('evaluates Subpar vs Decent threshold at 10.0 CV for circlets', () => {
      expect(getQualityBadge(9.9, true)).toBe('Subpar');
      expect(getQualityBadge(9.99, true)).toBe('Subpar');
      expect(getQualityBadge(10.0, true)).toBe('Decent');
      expect(getQualityBadge(10.01, true)).toBe('Decent');
    });

    it('evaluates Decent vs Good threshold at 20.0 CV for circlets', () => {
      expect(getQualityBadge(19.9, true)).toBe('Decent');
      expect(getQualityBadge(19.99, true)).toBe('Decent');
      expect(getQualityBadge(20.0, true)).toBe('Good');
      expect(getQualityBadge(20.01, true)).toBe('Good');
    });

    it('evaluates Good vs Great threshold at 30.0 CV for circlets', () => {
      expect(getQualityBadge(29.9, true)).toBe('Good');
      expect(getQualityBadge(29.99, true)).toBe('Good');
      expect(getQualityBadge(30.0, true)).toBe('Great');
      expect(getQualityBadge(30.01, true)).toBe('Great');
    });

    it('evaluates Great vs Godly threshold at 35.0 CV for circlets', () => {
      expect(getQualityBadge(34.9, true)).toBe('Great');
      expect(getQualityBadge(34.99, true)).toBe('Great');
      expect(getQualityBadge(35.0, true)).toBe('Godly');
      expect(getQualityBadge(35.01, true)).toBe('Godly');
      expect(getQualityBadge(46.6, true)).toBe('Godly');
    });

    it('contrasts standard piece vs circlet badge for the same CV value', () => {
      // 32.0 CV: 'Good' on standard piece, but 'Great' on a circlet
      expect(getQualityBadge(32.0, false)).toBe('Good');
      expect(getQualityBadge(32.0, true)).toBe('Great');

      // 36.0 CV: 'Good' on standard piece, but 'Godly' on a circlet
      expect(getQualityBadge(36.0, false)).toBe('Good');
      expect(getQualityBadge(36.0, true)).toBe('Godly');

      // 12.0 CV: 'Subpar' on standard piece, but 'Decent' on a circlet
      expect(getQualityBadge(12.0, false)).toBe('Subpar');
      expect(getQualityBadge(12.0, true)).toBe('Decent');
    });
  });

  // =========================================================================
  // 4. BUILD CV TIER BOUNDARIES
  // =========================================================================

  describe('4. Build CV Tier Boundaries (Total Character Artifact CV)', () => {
    // Total Build CV tiers:
    // < 140.0: Subpar
    // 140.0 - 179.9: Decent
    // 180.0 - 219.9: Good
    // 220.0 - 239.9: Great
    // >= 240.0: Godly

    it('evaluates Subpar vs Decent threshold at 140.0 Total CV', () => {
      expect(getBuildCVTier(139.9)).toBe('Subpar');
      expect(getBuildCVTier(139.99)).toBe('Subpar');
      expect(getBuildCVTier(140.0)).toBe('Decent');
      expect(getBuildCVTier(140.01)).toBe('Decent');
    });

    it('evaluates Decent vs Good threshold at 180.0 Total CV', () => {
      expect(getBuildCVTier(179.9)).toBe('Decent');
      expect(getBuildCVTier(179.99)).toBe('Decent');
      expect(getBuildCVTier(180.0)).toBe('Good');
      expect(getBuildCVTier(180.01)).toBe('Good');
    });

    it('evaluates Good vs Great threshold at 220.0 Total CV', () => {
      expect(getBuildCVTier(219.9)).toBe('Good');
      expect(getBuildCVTier(219.99)).toBe('Good');
      expect(getBuildCVTier(220.0)).toBe('Great');
      expect(getBuildCVTier(220.01)).toBe('Great');
    });

    it('evaluates Great vs Godly threshold at 240.0 Total CV', () => {
      expect(getBuildCVTier(239.9)).toBe('Great');
      expect(getBuildCVTier(239.99)).toBe('Great');
      expect(getBuildCVTier(240.0)).toBe('Godly');
      expect(getBuildCVTier(240.01)).toBe('Godly');
      expect(getBuildCVTier(300.0)).toBe('Godly');
    });

    it('evaluates negative and zero total CV as Subpar', () => {
      expect(getBuildCVTier(0)).toBe('Subpar');
      expect(getBuildCVTier(-50)).toBe('Subpar');
    });
  });

  // =========================================================================
  // 5. BOUNDED SUBSTAT ROLL COUNTS FOR ALL 10 SUBSTATS
  // =========================================================================

  describe('5. Bounded Substat Roll Counts (k in [1..6]) for All 10 Substats', () => {
    const all10Substats = [
      'hpPercent',
      'atkPercent',
      'defPercent',
      'hp',
      'atk',
      'def',
      'em',
      'er',
      'cr',
      'cd',
    ] as const;

    it('verifies SUBSTAT_ROLLS contains all 10 substats with 4 ascending roll tiers', () => {
      expect(Object.keys(SUBSTAT_ROLLS)).toHaveLength(10);
      for (const stat of all10Substats) {
        const tiers = SUBSTAT_ROLLS[stat];
        expect(tiers, `Missing rolls definition for ${stat}`).toBeDefined();
        expect(tiers).toHaveLength(4);
        expect(tiers[0]).toBeLessThan(tiers[1]);
        expect(tiers[1]).toBeLessThan(tiers[2]);
        expect(tiers[2]).toBeLessThan(tiers[3]);
      }
    });

    all10Substats.forEach((statKey) => {
      describe(`Substat: ${statKey}`, () => {
        const tiers = SUBSTAT_ROLLS[statKey];
        const minRoll = tiers[0];
        const maxRoll = tiers[3];
        const avgRoll = (tiers[0] + tiers[1] + tiers[2] + tiers[3]) / 4;

        it('derives 1 roll for minimum single-roll tier', () => {
          const rollsMin = estimateRollCount(statKey, minRoll);
          expect(rollsMin).toBe(1);

          const rollsMax = estimateRollCount(statKey, maxRoll);
          expect(rollsMax).toBe(1);
        });

        it('derives 2 rolls for 2x average roll', () => {
          const rolls = estimateRollCount(statKey, 2 * avgRoll);
          expect(rolls).toBe(2);
        });

        it('derives 3 rolls for 3x average roll', () => {
          const rolls = estimateRollCount(statKey, 3 * avgRoll);
          expect(rolls).toBe(3);
        });

        it('derives 4 rolls for 4x average roll', () => {
          const rolls = estimateRollCount(statKey, 4 * avgRoll);
          expect(rolls).toBe(4);
        });

        it('derives 5 rolls for 5x average roll', () => {
          const rolls = estimateRollCount(statKey, 5 * avgRoll);
          expect(rolls).toBe(5);
        });

        it('derives 6 rolls for 6x max theoretical roll', () => {
          const rolls = estimateRollCount(statKey, 6 * maxRoll);
          expect(rolls).toBe(6);
        });

        it('bounds roll count to at most 6 even for impossible high values (overflow resistance)', () => {
          const extremeValue = 10 * maxRoll;
          const rolls = estimateRollCount(statKey, extremeValue);
          expect(rolls).toBe(6);
          expect(rolls).toBeLessThanOrEqual(6);
        });

        it('bounds roll count to at least 1 for any positive non-zero value', () => {
          const tinyValue = minRoll * 0.1;
          const rolls = estimateRollCount(statKey, tinyValue);
          expect(rolls).toBe(1);
        });

        it('returns 0 for non-positive values (zero or negative)', () => {
          expect(estimateRollCount(statKey, 0)).toBe(0);
          expect(estimateRollCount(statKey, -10)).toBe(0);
        });
      });
    });

    it('returns 0 for unregistered or unknown substat keys', () => {
      expect(estimateRollCount('nonExistentStat', 50)).toBe(0);
      expect(estimateRollCount('', 50)).toBe(0);
      expect(estimateRollCount('physicalRes', 50)).toBe(0);
    });
  });

  // =========================================================================
  // 6. VISUAL ROLL PIPS FORMAT STRING TESTS
  // =========================================================================

  describe('6. Visual Roll Pips Format String (`deriveVisualRollPips`)', () => {
    it('generates standard 5-pip strings for rolls 1 through 5', () => {
      expect(deriveVisualRollPips(1)).toBe('●○○○○');
      expect(deriveVisualRollPips(2)).toBe('●●○○○');
      expect(deriveVisualRollPips(3)).toBe('●●●○○');
      expect(deriveVisualRollPips(4)).toBe('●●●●○');
      expect(deriveVisualRollPips(5)).toBe('●●●●●');
    });

    it('generates 6-pip star string for 6 rolls', () => {
      expect(deriveVisualRollPips(6)).toBe('●●●●●★');
    });

    it('clamps overflow rolls (> 6) to 6-pip star representation', () => {
      expect(deriveVisualRollPips(7)).toBe('●●●●●★');
      expect(deriveVisualRollPips(10)).toBe('●●●●●★');
      expect(deriveVisualRollPips(999)).toBe('●●●●●★');
    });

    it('clamps underflow rolls (< 1) to minimum 1-pip representation', () => {
      expect(deriveVisualRollPips(0)).toBe('●○○○○');
      expect(deriveVisualRollPips(-1)).toBe('●○○○○');
      expect(deriveVisualRollPips(-99)).toBe('●○○○○');
    });

    it('supports custom maxPips parameter correctly', () => {
      // 4 max pips: 2 rolls -> ●●○○
      expect(deriveVisualRollPips(2, 4)).toBe('●●○○');
      // 3 max pips: 1 roll -> ●○○
      expect(deriveVisualRollPips(1, 3)).toBe('●○○');
      // 6 rolls always returns 6-pip star representation regardless of maxPips
      expect(deriveVisualRollPips(6, 4)).toBe('●●●●●★');
      expect(deriveVisualRollPips(6, 7)).toBe('●●●●●★');
    });
  });

  // =========================================================================
  // 7. STAT NORMALIZATION IDEMPOTENCY & PERCENTAGE STAT FILTERING
  // =========================================================================

  describe('7. Stat Normalization Idempotency & Percentage Stat Filtering', () => {
    describe('isPercentageStat', () => {
      it('correctly identifies standard percentage stats', () => {
        const percentKeys = ['cr', 'cd', 'er', 'hpPercent', 'atkPercent', 'defPercent', 'healingBonus'];
        for (const key of percentKeys) {
          expect(isPercentageStat(key), `Expected ${key} to be percentage stat`).toBe(true);
        }
      });

      it('correctly identifies all elemental and physical DMG bonus stats', () => {
        const dmgBonusKeys = [
          'physicalDmgBonus',
          'pyroDmgBonus',
          'hydroDmgBonus',
          'electroDmgBonus',
          'cryoDmgBonus',
          'dendroDmgBonus',
          'anemoDmgBonus',
          'geoDmgBonus',
        ];
        for (const key of dmgBonusKeys) {
          expect(isPercentageStat(key), `Expected ${key} to be percentage stat`).toBe(true);
        }
      });

      it('correctly rejects flat and base stats from being considered percentage stats', () => {
        const flatKeys = ['hp', 'atk', 'def', 'em', 'baseHP', 'baseATK', 'baseDEF', 'maxHP', 'level', 'unknown'];
        for (const key of flatKeys) {
          expect(isPercentageStat(key), `Expected ${key} to NOT be percentage stat`).toBe(false);
        }
      });
    });

    describe('normalizeArtifactStat', () => {
      it('scales raw decimal fractions (0 < val <= 1.0) by 100 for percentage stats', () => {
        expect(normalizeArtifactStat('hpPercent', 0.466)).toBe(46.6);
        expect(normalizeArtifactStat('atkPercent', 0.466)).toBe(46.6);
        expect(normalizeArtifactStat('defPercent', 0.583)).toBe(58.3);
        expect(normalizeArtifactStat('cr', 0.078)).toBe(7.8);
        expect(normalizeArtifactStat('cd', 0.218)).toBe(21.8);
        expect(normalizeArtifactStat('er', 0.551)).toBe(55.1);
        expect(normalizeArtifactStat('healingBonus', 0.359)).toBe(35.9);
        expect(normalizeArtifactStat('pyroDmgBonus', 0.466)).toBe(46.6);
      });

      it('preserves already-scaled values (> 1.0) without double-scaling (no 100x bug)', () => {
        expect(normalizeArtifactStat('hpPercent', 46.6)).toBe(46.6);
        expect(normalizeArtifactStat('cr', 7.8)).toBe(7.8);
        expect(normalizeArtifactStat('cd', 21.8)).toBe(21.8);
        expect(normalizeArtifactStat('cd', 62.2)).toBe(62.2);
        expect(normalizeArtifactStat('er', 55.1)).toBe(55.1);
        expect(normalizeArtifactStat('pyroDmgBonus', 46.6)).toBe(46.6);
      });

      it('proves strict mathematical idempotency: f(f(x)) === f(x) and f(f(f(x))) === f(x)', () => {
        const testCases: Array<{ key: string; val: number }> = [
          { key: 'hpPercent', val: 0.466 },
          { key: 'hpPercent', val: 46.6 },
          { key: 'cr', val: 0.039 },
          { key: 'cr', val: 3.9 },
          { key: 'cd', val: 0.622 },
          { key: 'cd', val: 62.2 },
          { key: 'er', val: 0.518 },
          { key: 'er', val: 51.8 },
          { key: 'pyroDmgBonus', val: 0.466 },
          { key: 'pyroDmgBonus', val: 46.6 },
          // Flat stats
          { key: 'hp', val: 4780 },
          { key: 'atk', val: 311 },
          { key: 'def', val: 876 },
          { key: 'em', val: 105 },
        ];

        for (const { key, val } of testCases) {
          const pass1 = normalizeArtifactStat(key, val);
          const pass2 = normalizeArtifactStat(key, pass1);
          const pass3 = normalizeArtifactStat(key, pass2);
          const pass5 = normalizeArtifactStat(key, normalizeArtifactStat(key, pass3));

          expect(pass2, `Failed idempotency on pass 2 for ${key} = ${val}`).toBe(pass1);
          expect(pass3, `Failed idempotency on pass 3 for ${key} = ${val}`).toBe(pass1);
          expect(pass5, `Failed idempotency on pass 5 for ${key} = ${val}`).toBe(pass1);
        }
      });

      it('preserves flat stat values exactly without any modification', () => {
        expect(normalizeArtifactStat('hp', 4780)).toBe(4780);
        expect(normalizeArtifactStat('atk', 311)).toBe(311);
        expect(normalizeArtifactStat('def', 23)).toBe(23);
        expect(normalizeArtifactStat('em', 105)).toBe(105);
      });

      it('handles boundary values (0, 1.0, negative) gracefully', () => {
        // val = 0 -> returns 0
        expect(normalizeArtifactStat('cr', 0)).toBe(0);
        // val = 1.0 -> 100%
        expect(normalizeArtifactStat('cr', 1.0)).toBe(100.0);
        // negative value
        expect(normalizeArtifactStat('cr', -5)).toBe(-5);
      });
    });
  });

  // =========================================================================
  // 8. ADVERSARIAL PARSER STRESS TEST WITH SYNTHESIZED PAYLOADS
  // =========================================================================

  describe('8. Adversarial Parser Ingestion Stress Tests', () => {
    it('processes artifact with zero crit substats resulting in 0.0 CV and Subpar badge', () => {
      const payload: any = {
        playerInfo: { nickname: 'StressTester', level: 60 },
        avatarInfoList: [
          {
            avatarId: 10000046, // Hu Tao
            propMap: { '4001': { type: 1001, val: '90' } },
            fightPropMap: { '2000': 15000, '2001': 1000, '2002': 800 },
            skillLevelMap: { '10461': 10, '10462': 10, '10463': 10 },
            equipList: [
              {
                itemId: 11510,
                weapon: { level: 90, promoteLevel: 6, affixMap: { '11510': 0 } },
                flat: {
                  nameTextMapHash: 'Staff of Homa',
                  rankLevel: 5,
                  itemType: 'ITEM_WEAPON',
                  icon: 'UI_EquipIcon_Pole_Homa',
                  weaponStats: [{ appendPropId: 'FIGHT_PROP_BASE_ATTACK', statValue: 608 }],
                },
              },
              // Flower with DEF, HP%, ATK, EM (Zero CR and CD)
              {
                itemId: 88881,
                reliquary: { level: 21, mainPropId: 10001 },
                flat: {
                  nameTextMapHash: 'Zero Crit Flower',
                  setNameTextMapHash: 'Crimson Witch of Flames',
                  rankLevel: 5,
                  itemType: 'ITEM_RELIQUARY',
                  equipType: 'EQUIP_BRACER',
                  icon: 'UI_RelicIcon_15005_4',
                  reliquaryMainstat: { mainPropId: 'FIGHT_PROP_HP', statValue: 4780 },
                  reliquarySubstats: [
                    { appendPropId: 'FIGHT_PROP_DEFENSE', statValue: 23 },
                    { appendPropId: 'FIGHT_PROP_HP_PERCENT', statValue: 0.099 },
                    { appendPropId: 'FIGHT_PROP_ATTACK', statValue: 19 },
                    { appendPropId: 'FIGHT_PROP_ELEMENT_MASTERY', statValue: 42 },
                  ],
                },
              },
            ],
          },
        ],
      };

      const parsed = parseEnkaResponse(payload);
      const flower = parsed.characters[0].artifacts[0];

      expect(flower.cv).toBe(0);
      expect(flower.qualityBadge).toBe('Subpar');
      expect(parsed.characters[0].totalCv).toBe(0);
      expect(parsed.characters[0].qualityBadge).toBe('Subpar');
    });

    it('processes 6-roll CD artifact piece assigning 6 rolls, special star pip, and correct CV', () => {
      const payload: any = {
        playerInfo: { nickname: 'StressTester', level: 60 },
        avatarInfoList: [
          {
            avatarId: 10000046,
            propMap: { '4001': { type: 1001, val: '90' } },
            fightPropMap: { '2000': 15000, '2001': 1000, '2002': 800 },
            skillLevelMap: { '10461': 10, '10462': 10, '10463': 10 },
            equipList: [
              {
                itemId: 11510,
                weapon: { level: 90, promoteLevel: 6, affixMap: { '11510': 0 } },
                flat: {
                  nameTextMapHash: 'Staff of Homa',
                  rankLevel: 5,
                  itemType: 'ITEM_WEAPON',
                  icon: 'UI_EquipIcon_Pole_Homa',
                  weaponStats: [{ appendPropId: 'FIGHT_PROP_BASE_ATTACK', statValue: 608 }],
                },
              },
              // Plume with 46.6% CD (6 max rolls!)
              {
                itemId: 88882,
                reliquary: { level: 21, mainPropId: 10002 },
                flat: {
                  nameTextMapHash: 'Godly Plume',
                  setNameTextMapHash: 'Crimson Witch of Flames',
                  rankLevel: 5,
                  itemType: 'ITEM_RELIQUARY',
                  equipType: 'EQUIP_NECKLACE',
                  icon: 'UI_RelicIcon_15005_2',
                  reliquaryMainstat: { mainPropId: 'FIGHT_PROP_ATTACK', statValue: 311 },
                  reliquarySubstats: [
                    { appendPropId: 'FIGHT_PROP_CRITICAL_HURT', statValue: 0.466 }, // 46.6% CD
                    { appendPropId: 'FIGHT_PROP_ATTACK_PERCENT', statValue: 0.058 },
                  ],
                },
              },
            ],
          },
        ],
      };

      const parsed = parseEnkaResponse(payload);
      const plume = parsed.characters[0].artifacts[0];
      const cdSub = plume.subStats.find((s) => s.key === 'cd')!;

      expect(cdSub.value).toBe(46.6);
      expect(cdSub.rolls).toBe(6);
      expect(cdSub.pips).toBe('●●●●●★');
      expect(plume.cv).toBe(46.6);
      expect(plume.qualityBadge).toBe('Great');
    });

    it('accurately evaluates Circlet piece CV with CR main stat and high CD substat', () => {
      const payload: any = {
        playerInfo: { nickname: 'StressTester', level: 60 },
        avatarInfoList: [
          {
            avatarId: 10000046,
            propMap: { '4001': { type: 1001, val: '90' } },
            fightPropMap: { '2000': 15000, '2001': 1000, '2002': 800 },
            skillLevelMap: { '10461': 10, '10462': 10, '10463': 10 },
            equipList: [
              {
                itemId: 11510,
                weapon: { level: 90, promoteLevel: 6, affixMap: { '11510': 0 } },
                flat: {
                  nameTextMapHash: 'Staff of Homa',
                  rankLevel: 5,
                  itemType: 'ITEM_WEAPON',
                  icon: 'UI_EquipIcon_Pole_Homa',
                  weaponStats: [{ appendPropId: 'FIGHT_PROP_BASE_ATTACK', statValue: 608 }],
                },
              },
              // Circlet with CR main stat (31.1%) and 35.0% CD substat -> 35.0 CV -> Godly for Circlet
              {
                itemId: 88885,
                reliquary: { level: 21, mainPropId: 10005 },
                flat: {
                  nameTextMapHash: 'Godly Circlet',
                  setNameTextMapHash: 'Crimson Witch of Flames',
                  rankLevel: 5,
                  itemType: 'ITEM_RELIQUARY',
                  equipType: 'EQUIP_DRESS',
                  icon: 'UI_RelicIcon_15005_3',
                  reliquaryMainstat: { mainPropId: 'FIGHT_PROP_CRITICAL', statValue: 0.311 },
                  reliquarySubstats: [
                    { appendPropId: 'FIGHT_PROP_CRITICAL_HURT', statValue: 0.350 }, // 35.0% CD
                  ],
                },
              },
            ],
          },
        ],
      };

      const parsed = parseEnkaResponse(payload);
      const circlet = parsed.characters[0].artifacts[0];

      expect(circlet.slot).toBe('circlet');
      expect(circlet.mainStat.value).toBe(31.1);
      expect(circlet.cv).toBe(35.0);
      expect(circlet.qualityBadge).toBe('Godly');
    });
  });
});
