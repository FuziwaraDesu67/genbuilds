/// <reference types="vitest/globals" />
import { describe, it, expect } from 'vitest';
import {
  getArtifactSetCritRateBonus,
  getArtifactSetBonus,
  getArtifactSetDetails,
} from '../src/lib/enka/artifact-set-data';
import { calculateEffectiveCv, getEffectiveAkashaCv } from '../src/lib/utils';

describe('Artifact Set Crit Rate Bonus & Capped Overall CV Engine', () => {
  describe('Set Identification & CR Bonuses', () => {
    it('detects 4pc Obsidian Codex bonus (+40% CR)', () => {
      const result = getArtifactSetCritRateBonus({ 15038: 4 });
      expect(result.totalBonusCr).toBe(40.0);
      expect(result.activeBonuses).toHaveLength(1);
      expect(result.activeBonuses[0].name).toBe('Obsidian Codex');
      expect(result.activeBonuses[0].bonusCr).toBe(40.0);
    });

    it('detects 4pc Marechaussee Hunter bonus (+36% CR)', () => {
      const result = getArtifactSetCritRateBonus({ 15031: 4 });
      expect(result.totalBonusCr).toBe(36.0);
      expect(result.activeBonuses[0].name).toBe('Marechaussee Hunter');
      expect(result.activeBonuses[0].bonusCr).toBe(36.0);
    });

    it("detects 4pc Night of the Sky's Unveiling bonus (+30% CR)", () => {
      const result = getArtifactSetCritRateBonus({ 15051: 4 });
      expect(result.totalBonusCr).toBe(30.0);
      expect(result.activeBonuses[0].name).toBe("Night of the Sky's Unveiling");
      expect(result.activeBonuses[0].bonusCr).toBe(30.0);
    });

    it('detects 4pc Scarlet Proof bonus (+16% CR)', () => {
      const result = getArtifactSetCritRateBonus({ 15053: 4 });
      expect(result.totalBonusCr).toBe(16.0);
      expect(result.activeBonuses[0].name).toBe('Scarlet Proof');
      expect(result.activeBonuses[0].bonusCr).toBe(16.0);
    });

    it('detects 4pc Blizzard Strayer bonus (+20% CR baseline)', () => {
      const result = getArtifactSetCritRateBonus({ 15003: 4 });
      expect(result.totalBonusCr).toBe(20.0);
      expect(result.activeBonuses[0].name).toBe('Blizzard Strayer');
    });

    it('detects 2pc and 4pc Berserker bonuses', () => {
      const twoPiece = getArtifactSetCritRateBonus({ 10005: 2 });
      expect(twoPiece.totalBonusCr).toBe(12.0);

      const fourPiece = getArtifactSetCritRateBonus({ 10005: 4 });
      expect(fourPiece.totalBonusCr).toBe(36.0);
    });

    it('returns 0% bonus for non-CR sets or incomplete pieces', () => {
      // Incomplete 3pc Obsidian Codex (needs 4pc)
      const incomplete = getArtifactSetCritRateBonus({ 15038: 3 });
      expect(incomplete.totalBonusCr).toBe(0);

      // Emblem of Severed Fate 4pc (provides ER and Burst DMG, not CR)
      const emblem = getArtifactSetCritRateBonus({ 15008: 4 });
      expect(emblem.totalBonusCr).toBe(0);
      expect(emblem.activeBonuses).toHaveLength(0);
    });

    it('resolves set by name string fallback', () => {
      const byName = getArtifactSetCritRateBonus({ 'Obsidian Codex': 4 });
      expect(byName.totalBonusCr).toBe(40.0);
    });
  });

  describe('calculateEffectiveCv (100% Crit Rate Capping)', () => {
    it('calculates full set bonus when total Crit Rate <= 100%', () => {
      // Chasca test case: 57.2% CR + 40% Codex = 97.2% (under 100%)
      const chascaBuild = {
        stats: { cr: 57.2, cd: 237.6 },
        artifactSets: { 15038: 4 },
        artifacts: [
          { slot: 'flower', cv: 35.0 },
          { slot: 'plume', cv: 42.0 },
          { slot: 'sands', cv: 38.5 },
          { slot: 'goblet', cv: 32.0 },
          { slot: 'circlet', cv: 32.0, mainStat: { key: 'cd', value: 62.2 } },
        ],
      };

      const result = calculateEffectiveCv(chascaBuild);
      expect(result.baseCr).toBe(57.2);
      expect(result.setBonusCr).toBe(40.0);
      expect(result.effectiveCr).toBe(97.2);
      expect(result.effectiveSetBonusCr).toBe(40.0);
      expect(result.isCapped).toBe(false);
      expect(result.overcapCr).toBe(0);

      // Raw CV = 35 + 42 + 38.5 + 32 + 32 + 62.2 = 241.7
      expect(result.rawArtifactCv).toBe(241.7);
      // Effective Artifact CV = 241.7 + (40 * 2) = 321.7
      expect(result.effectiveArtifactCv).toBe(321.7);
      // Overall Combat CV = (97.2 * 2) + 237.6 = 194.4 + 237.6 = 432.0
      expect(result.overallCombatCv).toBe(432.0);
    });

    it('strictly caps effective Crit Rate at 100% and does not reward overcapped CR', () => {
      // Overcapped build: 68.0% sheet CR + 40% Codex = 108.0% CR
      const overcappedBuild = {
        stats: { cr: 68.0, cd: 200.0 },
        artifactSets: { 15038: 4 },
        akashaCv: 200.0,
      };

      const result = calculateEffectiveCv(overcappedBuild);
      expect(result.baseCr).toBe(68.0);
      expect(result.setBonusCr).toBe(40.0);
      expect(result.effectiveCr).toBe(100.0); // CAPPED
      expect(result.effectiveSetBonusCr).toBe(32.0); // 100 - 68 = 32% utilized
      expect(result.isCapped).toBe(true);
      expect(result.overcapCr).toBe(8.0); // 8% wasted

      // Effective Artifact CV should add only 32% * 2 = 64 CV, NOT 40% * 2 = 80 CV
      expect(result.rawArtifactCv).toBe(200.0);
      expect(result.effectiveArtifactCv).toBe(264.0);
      // Overall Combat CV = (100 * 2) + 200 = 400.0
      expect(result.overallCombatCv).toBe(400.0);
    });

    it('handles heavy overcap with Marechaussee Hunter (+36% CR)', () => {
      // 90% sheet CR + 36% = 126% CR
      const heavyOvercap = {
        stats: { cr: 90.0, cd: 180.0 },
        artifactSets: { 15031: 4 },
        akashaCv: 210.0,
      };

      const result = calculateEffectiveCv(heavyOvercap);
      expect(result.effectiveCr).toBe(100.0);
      expect(result.effectiveSetBonusCr).toBe(10.0); // only 10% needed to reach 100%
      expect(result.overcapCr).toBe(26.0);
      expect(result.isCapped).toBe(true);
      // Effective Artifact CV = 210 + (10 * 2) = 230
      expect(result.effectiveArtifactCv).toBe(230.0);
      // Combat CV = (100 * 2) + 180 = 380.0
      expect(result.overallCombatCv).toBe(380.0);
    });

    it('leaves standard non-CR builds unadjusted', () => {
      const standardBuild = {
        stats: { cr: 75.0, cd: 150.0 },
        artifactSets: { 15008: 4 }, // Emblem
        akashaCv: 225.0,
      };

      const result = calculateEffectiveCv(standardBuild);
      expect(result.setBonusCr).toBe(0);
      expect(result.effectiveCr).toBe(75.0);
      expect(result.effectiveArtifactCv).toBe(225.0);
      expect(result.overallCombatCv).toBe((75 * 2) + 150);
      expect(result.isCapped).toBe(false);
    });

    it('integrates with getEffectiveAkashaCv seamlessly', () => {
      const chasca = {
        stats: { cr: 50.0, cd: 200.0 },
        artifactSets: { 15038: 4 },
        akashaCv: 180.0,
      };

      // With set bonus included (default): 180 + (40 * 2) = 260
      expect(getEffectiveAkashaCv(chasca)).toBe(260.0);

      // Raw unadjusted without set bonus: 180
      expect(getEffectiveAkashaCv(chasca, { includeSetBonus: false })).toBe(180.0);
    });
  });
});
