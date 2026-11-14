import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import ArtifactDisplay, {
  ActiveSetBonusesBanner,
  ArtifactPieceCard,
  ArtifactsGrid,
  ARTIFACT_SLOT_ORDER,
  ARTIFACT_SLOT_CONFIG,
  formatStatValue,
  getStatName,
  isPercentageStat,
  formatRollPips,
  getPipBadgeClass,
  getRollTooltip,
  PIECE_CV_BADGE_CONFIG,
} from '@/components/character/ArtifactDisplay';
import CharacterDetailModal from '@/components/character/CharacterDetailModal';
import type { Artifact, ActiveSetBonus, Character, QualityBadge } from '@/lib/enka/types';
import { calculateCritValue, getQualityBadge, deriveVisualRollPips } from '@/lib/enka/static-data';

// Helper to normalize HTML output
function clean(html: string): string {
  return html.replace(/<!--.*?-->/g, '').replace(/\s+/g, ' ').trim();
}

// Deterministic baseline fixtures
const baseFlower: Artifact = {
  id: 201,
  name: "Witch's Flower of Blaze",
  setId: 15006,
  setName: 'Crimson Witch of Flames',
  setBonusText: {
    twoPiece: 'Pyro DMG Bonus +15%.',
    fourPiece: 'Increases Overloaded, Burning, and Burgeon DMG by 40%.',
  },
  slot: 'flower',
  rarity: 5,
  level: 20,
  mainStat: { key: 'hp', value: 4780 },
  subStats: [
    { key: 'cr', value: 3.9, rolls: 1, pips: '●○○○○' },
    { key: 'cd', value: 27.2, rolls: 4, pips: '●●●●○' },
    { key: 'atkPercent', value: 9.9, rolls: 2, pips: '●●○○○' },
    { key: 'em', value: 42, rolls: 2, pips: '●●○○○' },
  ],
  cv: 35.0,
  qualityBadge: 'Good',
  icon: 'https://enka.network/ui/UI_RelicIcon_15006_4.png',
};

const basePlume: Artifact = {
  id: 202,
  name: "Witch's Ever-Burning Plume",
  setId: 15006,
  setName: 'Crimson Witch of Flames',
  slot: 'plume',
  rarity: 5,
  level: 20,
  mainStat: { key: 'atk', value: 311 },
  subStats: [
    { key: 'cr', value: 10.5, rolls: 3, pips: '●●●○○' },
    { key: 'cd', value: 21.0, rolls: 3, pips: '●●●○○' },
    { key: 'er', value: 11.0, rolls: 2, pips: '●●○○○' },
    { key: 'hpPercent', value: 4.7, rolls: 1, pips: '●○○○○' },
  ],
  cv: 42.0,
  qualityBadge: 'Great',
  icon: 'https://enka.network/ui/UI_RelicIcon_15006_2.png',
};

const baseSands: Artifact = {
  id: 203,
  name: "Witch's End Time",
  setId: 15006,
  setName: 'Crimson Witch of Flames',
  slot: 'sands',
  rarity: 5,
  level: 20,
  mainStat: { key: 'hpPercent', value: 46.6 },
  subStats: [
    { key: 'cr', value: 13.6, rolls: 4, pips: '●●●●○' },
    { key: 'cd', value: 24.9, rolls: 4, pips: '●●●●○' },
    { key: 'em', value: 23, rolls: 1, pips: '●○○○○' },
    { key: 'def', value: 19, rolls: 1, pips: '●○○○○' },
  ],
  cv: 52.1,
  qualityBadge: 'Godly',
  icon: 'https://enka.network/ui/UI_RelicIcon_15006_5.png',
};

const baseGoblet: Artifact = {
  id: 204,
  name: "Witch's Heart Flames",
  setId: 15006,
  setName: 'Crimson Witch of Flames',
  slot: 'goblet',
  rarity: 5,
  level: 20,
  mainStat: { key: 'pyroDmgBonus', value: 46.6 },
  subStats: [
    { key: 'cr', value: 7.0, rolls: 2, pips: '●●○○○' },
    { key: 'cd', value: 14.8, rolls: 2, pips: '●●○○○' },
    { key: 'atkPercent', value: 10.5, rolls: 2, pips: '●●○○○' },
    { key: 'hp', value: 508, rolls: 2, pips: '●●○○○' },
  ],
  cv: 28.8,
  qualityBadge: 'Decent',
  icon: 'https://enka.network/ui/UI_RelicIcon_15006_1.png',
};

const baseCirclet: Artifact = {
  id: 205,
  name: "Mocking Mask",
  setId: 15001,
  setName: "Gladiator's Finale",
  slot: 'circlet',
  rarity: 5,
  level: 20,
  mainStat: { key: 'cd', value: 62.2 },
  subStats: [
    { key: 'cr', value: 17.5, rolls: 5, pips: '●●●●●' },
    { key: 'atkPercent', value: 5.8, rolls: 1, pips: '●○○○○' },
    { key: 'er', value: 6.5, rolls: 1, pips: '●○○○○' },
    { key: 'defPercent', value: 7.3, rolls: 1, pips: '●○○○○' },
  ],
  cv: 35.0,
  qualityBadge: 'Godly',
  icon: 'https://enka.network/ui/UI_RelicIcon_15001_3.png',
};

const base5PieceArtifacts: Artifact[] = [
  baseFlower,
  basePlume,
  baseSands,
  baseGoblet,
  baseCirclet,
];

const mockBaseCharacter: Character = {
  id: 10000046,
  name: 'Hu Tao',
  element: 'Pyro',
  rarity: 5,
  level: 90,
  friendshipLevel: 10,
  icon: '',
  constellation: 1,
  talents: { normal: 10, skill: 10, burst: 9 },
  weapon: {
    id: 13501,
    name: 'Staff of Homa',
    rarity: 5,
    level: 90,
    ascension: 6,
    refinement: 1,
    baseAtk: 608,
    subStat: { key: 'cd', value: 66.2 },
    passiveName: 'Reckless Cinnabar',
    passiveDescription: 'HP increased by 20%. Gives ATK Bonus based on 0.8% of Max HP.',
    icon: 'https://enka.network/ui/UI_EquipIcon_Pole_Homa.png',
  },
  artifacts: base5PieceArtifacts,
  activeSetBonuses: [
    {
      setId: 15006,
      setName: 'Crimson Witch of Flames',
      count: 4,
      twoPieceActive: true,
      fourPieceActive: true,
      twoPieceText: 'Pyro DMG Bonus +15%.',
      fourPieceText: 'Increases Overloaded, Burning, and Burgeon DMG by 40%.',
      activeTier: '4pc',
    },
  ],
  artifactSets: { 15006: 4, 15001: 1 },
  stats: {
    hp: 31450,
    atk: 1250,
    def: 876,
    em: 105,
    er: 110.0,
    cr: 65.4,
    cd: 242.8,
    dmgBonus: { pyro: 61.6 },
  },
};

describe('Adversarial Test Suite: Milestone 4 Artifact Display & Modal Integration (R4 & R5)', () => {
  // =========================================================================
  // 1. Empty Artifact Lists & Partial Sets (0, 1, 2, 3, 4, 5 Pieces)
  // =========================================================================
  describe('Adversarial 1: Empty Lists & Partial Artifact Sets', () => {
    it('handles empty artifact array (0 pieces) in ArtifactsGrid without crashing', () => {
      const html = clean(
        renderToString(
          React.createElement(ArtifactsGrid, {
            artifacts: [],
            showBanner: true,
          })
        )
      );

      expect(html).toContain('0 / 5 Equipped');
      expect(html).toContain('5-Piece Artifact Breakdown');
      expect(html).toContain('Mixed Build');
      expect(html).toContain('No active set bonus (mixed artifacts)');
    });

    it('handles empty props in polymorphic ArtifactDisplay without crashing (returns null / empty string)', () => {
      const html = clean(renderToString(React.createElement(ArtifactDisplay, {})));
      expect(html).toBe('');
    });

    it('handles 1-piece equipped build in ArtifactsGrid with correct count and fallback banner', () => {
      const html = clean(
        renderToString(
          React.createElement(ArtifactsGrid, {
            artifacts: [baseFlower],
            showBanner: true,
          })
        )
      );

      expect(html).toContain('1 / 5 Equipped');
      expect(html).toContain('FLOWER');
      expect(html).not.toContain('PLUME');
      expect(html).toContain('Mixed Build');
      expect(html).toContain('No active set bonus (mixed artifacts)');
    });

    it('handles 2-piece equipped build (same set) triggering 2-Piece active bonus', () => {
      const html = clean(
        renderToString(
          React.createElement(ArtifactsGrid, {
            artifacts: [baseFlower, basePlume],
            showBanner: true,
          })
        )
      );

      expect(html).toContain('2 / 5 Equipped');
      expect(html).toContain('FLOWER');
      expect(html).toContain('PLUME');
      expect(html).toContain('1 Active Set');
      expect(html).toContain('Crimson Witch of Flames');
      expect(html).toContain('2-Piece Set');
      expect(html).toContain('2 pieces equipped');
      expect(html).toContain('Pyro DMG Bonus +15%.');
      expect(html).toContain('(Inactive — Requires 4 pieces)');
    });

    it('handles 3-piece equipped build (same set) retaining 2-Piece bonus without falsely activating 4-Piece', () => {
      const html = clean(
        renderToString(
          React.createElement(ArtifactsGrid, {
            artifacts: [baseFlower, basePlume, baseSands],
            showBanner: true,
          })
        )
      );

      expect(html).toContain('3 / 5 Equipped');
      expect(html).toContain('1 Active Set');
      expect(html).toContain('2-Piece Set');
      expect(html).toContain('3 pieces equipped');
      expect(html).toContain('(Inactive — Requires 4 pieces)');
    });

    it('handles 4-piece equipped build activating radiant amber 4-Piece set bonus', () => {
      const html = clean(
        renderToString(
          React.createElement(ArtifactsGrid, {
            artifacts: [baseFlower, basePlume, baseSands, baseGoblet],
            showBanner: true,
          })
        )
      );

      expect(html).toContain('4 / 5 Equipped');
      expect(html).toContain('1 Active Set');
      expect(html).toContain('4-Piece Set');
      expect(html).toContain('4 pieces equipped');
      expect(html).toContain('Increases Overloaded, Burning, and Burgeon DMG by 40%.');
      expect(html).not.toContain('(Inactive — Requires 4 pieces)');
    });

    it('handles full 5-piece set from same set (5/5 pieces equipped)', () => {
      const fiveWitchCirclet: Artifact = {
        ...baseCirclet,
        setId: 15006,
        setName: 'Crimson Witch of Flames',
      };
      const html = clean(
        renderToString(
          React.createElement(ArtifactsGrid, {
            artifacts: [baseFlower, basePlume, baseSands, baseGoblet, fiveWitchCirclet],
            showBanner: true,
          })
        )
      );

      expect(html).toContain('5 / 5 Equipped');
      expect(html).toContain('4-Piece Set');
      expect(html).toContain('5 pieces equipped');
    });

    it('handles dual 2-piece sets (2pc Witch + 2pc Gladiator + 1 off-piece)', () => {
      const gladFlower: Artifact = {
        ...baseFlower,
        setId: 14001,
        setName: "Gladiator's Finale",
      };
      const gladPlume: Artifact = {
        ...basePlume,
        setId: 14001,
        setName: "Gladiator's Finale",
      };
      const witchSands: Artifact = {
        ...baseSands,
        setId: 15005,
        setName: 'Crimson Witch of Flames',
      };
      const witchGoblet: Artifact = {
        ...baseGoblet,
        setId: 15005,
        setName: 'Crimson Witch of Flames',
      };
      const offCirclet: Artifact = {
        ...baseCirclet,
        setId: 15032,
        setName: 'Golden Troupe',
      };

      const dualSetArtifacts = [gladFlower, gladPlume, witchSands, witchGoblet, offCirclet];

      const html = clean(
        renderToString(
          React.createElement(ArtifactsGrid, {
            artifacts: dualSetArtifacts,
            showBanner: true,
          })
        )
      );

      expect(html).toContain('5 / 5 Equipped');
      expect(html).toContain('2 Active Sets');
      expect(html).toContain("Gladiator&#x27;s Finale");
      expect(html).toContain('Crimson Witch of Flames');
      expect(html).not.toContain('4-Piece Set');
    });

    it('maintains canonical slot ordering even with unordered partial pieces (Circlet + Sands only)', () => {
      const partialReversed = [baseCirclet, baseSands];
      const html = clean(
        renderToString(
          React.createElement(ArtifactsGrid, {
            artifacts: partialReversed,
            showBanner: false,
          })
        )
      );

      expect(html).toContain('2 / 5 Equipped');
      const sandsIndex = html.indexOf('SANDS');
      const circletIndex = html.indexOf('CIRCLET');
      expect(sandsIndex).toBeGreaterThan(-1);
      expect(circletIndex).toBeGreaterThan(sandsIndex);
    });
  });

  // =========================================================================
  // 2. Incomplete or Malformed Roll Counts & Pips
  // =========================================================================
  describe('Adversarial 2: Incomplete & Malformed Roll Counts and Pips', () => {
    it('derives authentic roll pips when subStat.pips is missing/undefined', () => {
      const pipsResult = formatRollPips({
        key: 'cr',
        value: 10.5,
        rolls: 3,
        pips: undefined,
      });

      expect(pipsResult.rolls).toBe(3);
      expect(pipsResult.pipsText).toBe('[●●●○○]');
      expect(pipsResult.pipBadgeClass).toContain('text-cyan-300');
    });

    it('bounds 0 rolls to minimum 1 roll [●○○○○]', () => {
      const pipsResult = formatRollPips({
        key: 'atkPercent',
        value: 5.8,
        rolls: 0,
        pips: undefined,
      });

      expect(pipsResult.rolls).toBe(1);
      expect(pipsResult.pipsText).toBe('[●○○○○]');
      expect(pipsResult.tooltip).toContain('1 Roll (Base stat)');
    });

    it('bounds extreme roll counts (>6 rolls) to theoretical maximum 6 [●●●●●★]', () => {
      const pipsResultHigh = formatRollPips({
        key: 'cd',
        value: 46.8,
        rolls: 9,
        pips: undefined,
      });

      expect(pipsResultHigh.rolls).toBe(6);
      expect(pipsResultHigh.pipsText).toBe('[●●●●●★]');
      expect(pipsResultHigh.pipBadgeClass).toContain('text-yellow-300');
      expect(pipsResultHigh.tooltip).toContain('★ Theoretical Maximum');
    });

    it('bounds negative rolls to 1 roll [●○○○○]', () => {
      const pipsResultNegative = formatRollPips({
        key: 'em',
        value: 23,
        rolls: -3,
        pips: undefined,
      });

      expect(pipsResultNegative.rolls).toBe(1);
      expect(pipsResultNegative.pipsText).toBe('[●○○○○]');
    });

    it('correctly cleans up brackets in pre-existing subStat.pips without double-wrapping', () => {
      const pipsWithBrackets = formatRollPips({
        key: 'cd',
        value: 21.0,
        rolls: 3,
        pips: '[●●●○○]',
      });

      expect(pipsWithBrackets.pipsText).toBe('[●●●○○]');
      expect(pipsWithBrackets.pipsText).not.toContain('[[');
    });

    it('estimates rolls accurately from statKey and value when both rolls and pips are omitted', () => {
      // CR 13.6% is ~4 rolls
      const pipsEstimated = formatRollPips({
        key: 'cr',
        value: 13.6,
      });

      expect(pipsEstimated.rolls).toBe(4);
      expect(pipsEstimated.pipsText).toBe('[●●●●○]');
      expect(pipsEstimated.pipBadgeClass).toContain('text-purple-300');
    });

    it('renders artifact card with empty substat array without crashing or NaN', () => {
      const noSubstatsArtifact: Artifact = {
        ...baseFlower,
        cv: undefined,
        qualityBadge: undefined,
        subStats: [],
      };

      const html = clean(
        renderToString(
          React.createElement(ArtifactPieceCard, { artifact: noSubstatsArtifact })
        )
      );

      expect(html).not.toContain('NaN');
      expect(html).toContain('0%'); // roll quality 0%
      expect(html).toContain('Subpar (0.0 CV)');
    });

    it('bounds roll quality percentage between 0% and 100% on level 0 artifact', () => {
      const lvl0Artifact: Artifact = {
        ...baseFlower,
        level: 0,
        subStats: [
          { key: 'cr', value: 3.9, rolls: 1, pips: '●○○○○' },
        ],
      };

      const html = clean(
        renderToString(
          React.createElement(ArtifactPieceCard, { artifact: lvl0Artifact })
        )
      );

      expect(html).not.toContain('NaN');
      expect(html).toContain('+0');
      expect(html).toContain('100%'); // 1 roll out of maxPossibleRolls=1
    });
  });

  // =========================================================================
  // 3. Extreme Crit Values (0 CV, Negative, High CV > 60)
  // =========================================================================
  describe('Adversarial 3: Extreme Crit Values', () => {
    it('correctly handles 0.0 CV piece (no crit substats) with Subpar badge', () => {
      const zeroCvArtifact: Artifact = {
        ...basePlume,
        subStats: [
          { key: 'atkPercent', value: 9.9, rolls: 2, pips: '●●○○○' },
          { key: 'em', value: 42, rolls: 2, pips: '●●○○○' },
          { key: 'er', value: 11.0, rolls: 2, pips: '●●○○○' },
          { key: 'def', value: 35, rolls: 1, pips: '●○○○○' },
        ],
        cv: undefined, // allow auto-derivation
        qualityBadge: undefined,
      };

      const html = clean(
        renderToString(
          React.createElement(ArtifactPieceCard, { artifact: zeroCvArtifact })
        )
      );

      expect(html).toContain('Subpar (0.0 CV)');
      expect(html).toContain('Low or zero Crit substat investment');
      expect(html).not.toContain('NaN');
    });

    it('guards against negative values in calculateCritValue and renders safely', () => {
      const guardedCv = calculateCritValue(-5.0, -10.0);
      expect(guardedCv).toBe(0.0);

      const negativeCvArtifact: Artifact = {
        ...baseFlower,
        cv: -10.0, // forced negative
        qualityBadge: undefined,
      };

      const html = clean(
        renderToString(
          React.createElement(ArtifactPieceCard, { artifact: negativeCvArtifact })
        )
      );

      expect(html).toContain('Subpar (-10.0 CV)');
      expect(html).not.toContain('NaN');
    });

    it('handles unicorn god-tier artifact with CV > 60.0 (e.g. 62.2 CV)', () => {
      const extremeGodlyArtifact: Artifact = {
        ...baseSands,
        subStats: [
          { key: 'cr', value: 15.6, rolls: 5, pips: '●●●●●' },
          { key: 'cd', value: 31.0, rolls: 4, pips: '●●●●○' }, // 2 * 15.6 + 31.0 = 62.2 CV
        ],
        cv: 62.2,
        qualityBadge: undefined,
      };

      const html = clean(
        renderToString(
          React.createElement(ArtifactPieceCard, { artifact: extremeGodlyArtifact })
        )
      );

      expect(html).toContain('Godly (62.2 CV)');
      expect(html).toContain('✦'); // Godly gold pulse icon
      expect(html).toContain('Top-tier unicorn artifact');
      expect(html).toContain('border-amber-400/80');
    });

    it('handles CV of 70.0+ on theoretical artifact', () => {
      const tier70Artifact: Artifact = {
        ...baseFlower,
        cv: 70.0,
        qualityBadge: undefined,
      };

      const html = clean(
        renderToString(
          React.createElement(ArtifactPieceCard, { artifact: tier70Artifact })
        )
      );

      expect(html).toContain('Godly (70.0 CV)');
      expect(html).toContain('✦');
    });
  });

  // =========================================================================
  // 4. Boundary Tests for Piece CV Quality Badges (Standard & Circlets)
  // =========================================================================
  describe('Adversarial 4: Quality Badge Cutoff Boundaries', () => {
    describe('Standard Pieces (Flower, Plume, Sands, Goblet: 50 / 40 / 30 / 20)', () => {
      it('tests Subpar vs Decent boundary at 19.9 vs 20.0 CV', () => {
        expect(getQualityBadge(19.9, false)).toBe('Subpar');
        expect(getQualityBadge(20.0, false)).toBe('Decent');

        const card199 = clean(
          renderToString(
            React.createElement(ArtifactPieceCard, {
              artifact: { ...baseFlower, cv: 19.9, qualityBadge: undefined },
            })
          )
        );
        expect(card199).toContain('Subpar (19.9 CV)');

        const card200 = clean(
          renderToString(
            React.createElement(ArtifactPieceCard, {
              artifact: { ...baseFlower, cv: 20.0, qualityBadge: undefined },
            })
          )
        );
        expect(card200).toContain('Decent (20.0 CV)');
      });

      it('tests Decent vs Good boundary at 29.9 vs 30.0 CV', () => {
        expect(getQualityBadge(29.9, false)).toBe('Decent');
        expect(getQualityBadge(30.0, false)).toBe('Good');

        const card299 = clean(
          renderToString(
            React.createElement(ArtifactPieceCard, {
              artifact: { ...baseFlower, cv: 29.9, qualityBadge: undefined },
            })
          )
        );
        expect(card299).toContain('Decent (29.9 CV)');

        const card300 = clean(
          renderToString(
            React.createElement(ArtifactPieceCard, {
              artifact: { ...baseFlower, cv: 30.0, qualityBadge: undefined },
            })
          )
        );
        expect(card300).toContain('Good (30.0 CV)');
      });

      it('tests Good vs Great boundary at 39.9 vs 40.0 CV', () => {
        expect(getQualityBadge(39.9, false)).toBe('Good');
        expect(getQualityBadge(40.0, false)).toBe('Great');

        const card399 = clean(
          renderToString(
            React.createElement(ArtifactPieceCard, {
              artifact: { ...baseFlower, cv: 39.9, qualityBadge: undefined },
            })
          )
        );
        expect(card399).toContain('Good (39.9 CV)');

        const card400 = clean(
          renderToString(
            React.createElement(ArtifactPieceCard, {
              artifact: { ...baseFlower, cv: 40.0, qualityBadge: undefined },
            })
          )
        );
        expect(card400).toContain('Great (40.0 CV)');
      });

      it('tests Great vs Godly boundary at 49.9 vs 50.0 CV', () => {
        expect(getQualityBadge(49.9, false)).toBe('Great');
        expect(getQualityBadge(50.0, false)).toBe('Godly');

        const card499 = clean(
          renderToString(
            React.createElement(ArtifactPieceCard, {
              artifact: { ...baseFlower, cv: 49.9, qualityBadge: undefined },
            })
          )
        );
        expect(card499).toContain('Great (49.9 CV)');
        expect(card499).not.toContain('✦');

        const card500 = clean(
          renderToString(
            React.createElement(ArtifactPieceCard, {
              artifact: { ...baseFlower, cv: 50.0, qualityBadge: undefined },
            })
          )
        );
        expect(card500).toContain('Godly (50.0 CV)');
        expect(card500).toContain('✦');
      });
    });

    describe('Circlets (35 / 30 / 20 / 10)', () => {
      it('tests Subpar vs Decent boundary on Circlet at 9.9 vs 10.0 CV', () => {
        expect(getQualityBadge(9.9, true)).toBe('Subpar');
        expect(getQualityBadge(10.0, true)).toBe('Decent');

        const circlet99 = clean(
          renderToString(
            React.createElement(ArtifactPieceCard, {
              artifact: { ...baseCirclet, cv: 9.9, qualityBadge: undefined },
            })
          )
        );
        expect(circlet99).toContain('Subpar (9.9 CV)');

        const circlet100 = clean(
          renderToString(
            React.createElement(ArtifactPieceCard, {
              artifact: { ...baseCirclet, cv: 10.0, qualityBadge: undefined },
            })
          )
        );
        expect(circlet100).toContain('Decent (10.0 CV)');
      });

      it('tests Decent vs Good boundary on Circlet at 19.9 vs 20.0 CV', () => {
        expect(getQualityBadge(19.9, true)).toBe('Decent');
        expect(getQualityBadge(20.0, true)).toBe('Good');

        const circlet199 = clean(
          renderToString(
            React.createElement(ArtifactPieceCard, {
              artifact: { ...baseCirclet, cv: 19.9, qualityBadge: undefined },
            })
          )
        );
        expect(circlet199).toContain('Decent (19.9 CV)');

        const circlet200 = clean(
          renderToString(
            React.createElement(ArtifactPieceCard, {
              artifact: { ...baseCirclet, cv: 20.0, qualityBadge: undefined },
            })
          )
        );
        expect(circlet200).toContain('Good (20.0 CV)');
      });

      it('tests Good vs Great boundary on Circlet at 29.9 vs 30.0 CV', () => {
        expect(getQualityBadge(29.9, true)).toBe('Good');
        expect(getQualityBadge(30.0, true)).toBe('Great');

        const circlet299 = clean(
          renderToString(
            React.createElement(ArtifactPieceCard, {
              artifact: { ...baseCirclet, cv: 29.9, qualityBadge: undefined },
            })
          )
        );
        expect(circlet299).toContain('Good (29.9 CV)');

        const circlet300 = clean(
          renderToString(
            React.createElement(ArtifactPieceCard, {
              artifact: { ...baseCirclet, cv: 30.0, qualityBadge: undefined },
            })
          )
        );
        expect(circlet300).toContain('Great (30.0 CV)');
      });

      it('tests Great vs Godly boundary on Circlet at 34.9 vs 35.0 CV', () => {
        expect(getQualityBadge(34.9, true)).toBe('Great');
        expect(getQualityBadge(35.0, true)).toBe('Godly');

        const circlet349 = clean(
          renderToString(
            React.createElement(ArtifactPieceCard, {
              artifact: { ...baseCirclet, cv: 34.9, qualityBadge: undefined },
            })
          )
        );
        expect(circlet349).toContain('Great (34.9 CV)');
        expect(circlet349).not.toContain('✦');

        const circlet350 = clean(
          renderToString(
            React.createElement(ArtifactPieceCard, {
              artifact: { ...baseCirclet, cv: 35.0, qualityBadge: undefined },
            })
          )
        );
        expect(circlet350).toContain('Godly (35.0 CV)');
        expect(circlet350).toContain('✦');
      });

      it('verifies Circlet CRIT DMG main stat (62.2%) does NOT inflate piece substat CV', () => {
        // Circlet has 62.2% CD main stat and 10.5% CR substat
        const circletWithCdMain: Artifact = {
          ...baseCirclet,
          mainStat: { key: 'cd', value: 62.2 },
          subStats: [
            { key: 'cr', value: 10.5, rolls: 3, pips: '●●●○○' },
            { key: 'atk', value: 18, rolls: 1, pips: '●○○○○' },
          ],
          cv: undefined,
          qualityBadge: undefined,
        };

        const html = clean(
          renderToString(
            React.createElement(ArtifactPieceCard, { artifact: circletWithCdMain })
          )
        );

        // 2 * 10.5 = 21.0 CV (NOT 21.0 + 62.2 = 83.2 CV)
        expect(html).toContain('Good (21.0 CV)');
        expect(html).not.toContain('83.2 CV');
        expect(html).not.toContain('Godly (83.2 CV)');
      });
    });
  });

  // =========================================================================
  // 5. Rainbow Builds with 0 Active Set Bonuses (Fallback Banner)
  // =========================================================================
  describe('Adversarial 5: Rainbow Builds & Fallback Banner', () => {
    const rainbowArtifacts: Artifact[] = [
      { ...baseFlower, setId: 15001, setName: "Gladiator's Finale" },
      { ...basePlume, setId: 15002, setName: "Wanderer's Troupe" },
      { ...baseSands, setId: 15003, setName: 'Noblesse Oblige' },
      { ...baseGoblet, setId: 15004, setName: 'Bloodstained Chivalry' },
      { ...baseCirclet, setId: 15005, setName: 'Maiden Beloved' },
    ];

    it('renders fallback banner when activeBonuses is empty array []', () => {
      const html = clean(
        renderToString(
          React.createElement(ActiveSetBonusesBanner, {
            activeBonuses: [],
          })
        )
      );

      expect(html).toContain('Active Set Bonuses');
      expect(html).toContain('Mixed Build');
      expect(html).toContain('No active set bonus (mixed artifacts)');
      expect(html).toContain('This character is currently equipped with mixed artifact pieces');
    });

    it('renders fallback banner when auto-deriving from 5 distinct artifact sets', () => {
      const html = clean(
        renderToString(
          React.createElement(ActiveSetBonusesBanner, {
            artifacts: rainbowArtifacts,
          })
        )
      );

      expect(html).toContain('Mixed Build');
      expect(html).toContain('No active set bonus (mixed artifacts)');
      expect(html).not.toContain('1 Active Set');
    });

    it('renders fallback banner when artifactSets map has all counts of 1', () => {
      const rainbowMap = { 15001: 1, 15002: 1, 15003: 1, 15004: 1, 15005: 1 };
      const html = clean(
        renderToString(
          React.createElement(ActiveSetBonusesBanner, {
            artifactSets: rainbowMap,
            artifacts: rainbowArtifacts,
          })
        )
      );

      expect(html).toContain('Mixed Build');
      expect(html).toContain('No active set bonus (mixed artifacts)');
    });

    it('renders fallback banner when props are completely omitted/undefined', () => {
      const html = clean(
        renderToString(
          React.createElement(ActiveSetBonusesBanner, {})
        )
      );

      expect(html).toContain('Mixed Build');
      expect(html).toContain('No active set bonus (mixed artifacts)');
    });
  });

  // =========================================================================
  // 6. SSR Safety & Zero-Crash Guarantees
  // =========================================================================
  describe('Adversarial 6: SSR Safety across all Components', () => {
    it('successfully renders <ArtifactDisplay artifacts={...} /> via ReactDOMServer without error', () => {
      const html = clean(
        renderToString(
          React.createElement(ArtifactDisplay, {
            artifacts: base5PieceArtifacts,
            showBanner: true,
          })
        )
      );

      expect(html).toBeDefined();
      expect(html).toContain('5-Piece Artifact Breakdown');
      expect(html).toContain('FLOWER');
      expect(html).toContain('CIRCLET');
      expect(html).not.toContain('NaN');
      expect(html).not.toContain('undefined');
    });

    it('successfully renders <ArtifactDisplay artifact={...} /> via ReactDOMServer without error', () => {
      const html = clean(
        renderToString(
          React.createElement(ArtifactDisplay, {
            artifact: baseFlower,
          })
        )
      );

      expect(html).toBeDefined();
      expect(html).toContain('FLOWER');
      expect(html).toContain('Flower of Blaze');
      expect(html).toContain('+20');
      expect(html).not.toContain('NaN');
    });

    it('successfully renders <ActiveSetBonusesBanner /> via ReactDOMServer without error', () => {
      const html = clean(
        renderToString(React.createElement(ActiveSetBonusesBanner, {}))
      );

      expect(html).toBeDefined();
      expect(html).toContain('Active Set Bonuses');
      expect(html).toContain('Mixed Build');
    });

    it('successfully renders <CharacterDetailModal /> via ReactDOMServer without error', () => {
      const html = clean(
        renderToString(
          React.createElement(CharacterDetailModal, {
            character: mockBaseCharacter,
            onClose: () => {},
          })
        )
      );

      expect(html).toBeDefined();
      expect(html).toContain('Hu Tao');
      expect(html).toContain('Total Build Crit Value');
      expect(html).not.toContain('NaN');
    });

    it('renders CharacterDetailModal with modal artifacts tab without hydration mismatch or crashes', () => {
      const useStateSpy = vi.spyOn(React, 'useState');
      useStateSpy.mockImplementationOnce(() => ['artifacts', vi.fn()] as any);

      const html = clean(
        renderToString(
          React.createElement(CharacterDetailModal, {
            character: mockBaseCharacter,
            onClose: () => {},
          })
        )
      );

      useStateSpy.mockRestore();

      expect(html).toContain('Active Set Bonuses');
      expect(html).toContain('Crimson Witch of Flames');
      expect(html).toContain('4-Piece Set');
      expect(html).toContain('5-Piece Artifact Breakdown');
      expect(html).toContain('5 / 5 Equipped');
      expect(html).toContain('FLOWER');
      expect(html).toContain('CIRCLET');
    });
  });

  // =========================================================================
  // 7. R5 Home UI Zero-Touch Immutability
  // =========================================================================
  describe('Adversarial 7: R5 Home UI Zero-Touch Constraint', () => {
    const homeFilePath = path.resolve(process.cwd(), 'src/app/page.tsx');

    it('confirms src/app/page.tsx exists and is readable', () => {
      expect(fs.existsSync(homeFilePath)).toBe(true);
    });

    it('confirms src/app/page.tsx has exact line count (236) and byte length (10596)', () => {
      const content = fs.readFileSync(homeFilePath, 'utf-8');
      expect(content.length).toBe(10596);
      const lines = content.split('\n');
      expect(lines.length).toBe(236);
    });

    it('confirms src/app/page.tsx matches exact pristine SHA-256 integrity hash', () => {
      const content = fs.readFileSync(homeFilePath, 'utf-8');
      const hash = crypto.createHash('sha256').update(content).digest('hex');
      expect(hash).toBe('01628bc2982be1d3706086d8f707ed3a1155361d2416408453f31ef11245679b');
    });
  });
});
