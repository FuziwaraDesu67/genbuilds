import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, it, expect, vi } from 'vitest';
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
  PIECE_CV_BADGE_CONFIG,
} from '@/components/character/ArtifactDisplay';
import CharacterDetailModal from '@/components/character/CharacterDetailModal';
import type { Artifact, ActiveSetBonus, Character } from '@/lib/enka/types';
import { calculateCritValue, getQualityBadge, deriveVisualRollPips } from '@/lib/enka/static-data';

// Helper to normalize HTML strings
function clean(html: string): string {
  return html.replace(/<!--.*?-->/g, '').replace(/\s+/g, ' ').trim();
}

// Sample 5-piece artifacts fixture
const mockFlower: Artifact = {
  id: 101,
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
  mainStat: {
    key: 'hp',
    value: 4780,
  },
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

const mockPlume: Artifact = {
  id: 102,
  name: "Witch's Ever-Burning Plume",
  setId: 15006,
  setName: 'Crimson Witch of Flames',
  slot: 'plume',
  rarity: 5,
  level: 20,
  mainStat: {
    key: 'atk',
    value: 311,
  },
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

const mockSands: Artifact = {
  id: 103,
  name: "Witch's End Time",
  setId: 15006,
  setName: 'Crimson Witch of Flames',
  slot: 'sands',
  rarity: 5,
  level: 20,
  mainStat: {
    key: 'hpPercent',
    value: 46.6,
  },
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

const mockGoblet: Artifact = {
  id: 104,
  name: "Witch's Heart Flames",
  setId: 15006,
  setName: 'Crimson Witch of Flames',
  slot: 'goblet',
  rarity: 5,
  level: 20,
  mainStat: {
    key: 'pyroDmgBonus',
    value: 46.6,
  },
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

const mockCirclet: Artifact = {
  id: 105,
  name: "Mocking Mask",
  setId: 15001,
  setName: "Gladiator's Finale",
  slot: 'circlet',
  rarity: 5,
  level: 20,
  mainStat: {
    key: 'cd',
    value: 62.2,
  },
  subStats: [
    { key: 'cr', value: 17.5, rolls: 5, pips: '●●●●●' },
    { key: 'atkPercent', value: 5.8, rolls: 1, pips: '●○○○○' },
    { key: 'er', value: 6.5, rolls: 1, pips: '●○○○○' },
    { key: 'defPercent', value: 7.3, rolls: 1, pips: '●○○○○' },
  ],
  cv: 35.0, // 2 * 17.5 = 35.0 CV on circlet -> Godly (>= 35.0)
  qualityBadge: 'Godly',
  icon: 'https://enka.network/ui/UI_RelicIcon_15001_3.png',
};

const mockArtifacts: Artifact[] = [
  mockFlower,
  mockPlume,
  mockSands,
  mockGoblet,
  mockCirclet,
];

const mockActiveBonuses: ActiveSetBonus[] = [
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
];

describe('Milestone 4: Artifact Detail & Roll Analysis Grid (R4)', () => {
  // =========================================================================
  // 1. ActiveSetBonusesBanner Tests
  // =========================================================================
  describe('ActiveSetBonusesBanner', () => {
    it('renders 4-piece active set bonus with radiant amber theme and full skill descriptions', () => {
      const html = clean(
        renderToString(
          React.createElement(ActiveSetBonusesBanner, {
            activeBonuses: mockActiveBonuses,
          })
        )
      );

      expect(html).toContain('Active Set Bonuses');
      expect(html).toContain('1 Active Set');
      expect(html).toContain('Crimson Witch of Flames');
      expect(html).toContain('4-Piece Set');
      expect(html).toContain('4 pieces equipped');
      expect(html).toContain('2-Piece Bonus');
      expect(html).toContain('Pyro DMG Bonus +15%.');
      expect(html).toContain('4-Piece Bonus');
      expect(html).toContain('Increases Overloaded, Burning, and Burgeon DMG by 40%.');
    });

    it('renders 2-piece active set bonus with luminous cyan theme', () => {
      const twoPieceBonuses: ActiveSetBonus[] = [
        {
          setId: 15020,
          setName: 'Golden Troupe',
          count: 2,
          twoPieceActive: true,
          fourPieceActive: false,
          twoPieceText: 'Increases Elemental Skill DMG by 20%.',
          fourPieceText: 'Increases Elemental Skill DMG by 25%.',
          activeTier: '2pc',
        },
      ];

      const html = clean(
        renderToString(
          React.createElement(ActiveSetBonusesBanner, {
            activeBonuses: twoPieceBonuses,
          })
        )
      );

      expect(html).toContain('Golden Troupe');
      expect(html).toContain('2-Piece Set');
      expect(html).toContain('2 pieces equipped');
      expect(html).toContain('2-Piece Bonus');
      expect(html).toContain('Increases Elemental Skill DMG by 20%.');
      expect(html).toContain('Inactive — Requires 4 pieces');
    });

    it('renders multiple active set bonuses (2pc + 2pc combination)', () => {
      const dualBonuses: ActiveSetBonus[] = [
        {
          setId: 15001,
          setName: "Gladiator's Finale",
          count: 2,
          twoPieceActive: true,
          fourPieceActive: false,
          twoPieceText: 'ATK +18%.',
          activeTier: '2pc',
        },
        {
          setId: 15008,
          setName: 'Emblem of Severed Fate',
          count: 2,
          twoPieceActive: true,
          fourPieceActive: false,
          twoPieceText: 'Energy Recharge +20%.',
          activeTier: '2pc',
        },
      ];

      const html = clean(
        renderToString(
          React.createElement(ActiveSetBonusesBanner, {
            activeBonuses: dualBonuses,
          })
        )
      );

      expect(html).toContain('2 Active Sets');
      expect(html).toContain("Gladiator&#x27;s Finale");
      expect(html).toContain('ATK +18%.');
      expect(html).toContain('Emblem of Severed Fate');
      expect(html).toContain('Energy Recharge +20%.');
    });

    it('renders graceful fallback for mixed/rainbow builds without active bonuses', () => {
      const html = clean(
        renderToString(
          React.createElement(ActiveSetBonusesBanner, {
            activeBonuses: [],
          })
        )
      );

      expect(html).toContain('Mixed Build');
      expect(html).toContain('No active set bonus (mixed artifacts)');
    });

    it('auto-derives set bonuses when activeBonuses prop is omitted but artifacts array is provided', () => {
      const html = clean(
        renderToString(
          React.createElement(ActiveSetBonusesBanner, {
            artifacts: mockArtifacts,
          })
        )
      );

      // mockArtifacts has 4 Crimson Witch pieces
      expect(html).toContain('Crimson Witch of Flames');
      expect(html).toContain('4-Piece Set');
      expect(html).toContain('Pyro DMG Bonus +15%.');
    });
  });

  // =========================================================================
  // 2. ArtifactPieceCard Tests
  // =========================================================================
  describe('ArtifactPieceCard', () => {
    it('renders 5-piece slot headers with slot icons, piece names, and in-game lore subtitles', () => {
      const flowerHtml = clean(
        renderToString(React.createElement(ArtifactPieceCard, { artifact: mockFlower }))
      );
      expect(flowerHtml).toContain('FLOWER');
      expect(flowerHtml).toContain('Flower of Life');
      expect(flowerHtml).toContain("Witch&#x27;s Flower of Blaze");
      expect(flowerHtml).toContain('Crimson Witch of Flames');
      expect(flowerHtml).toContain('+20');
      expect(flowerHtml).toContain('★★★★★');

      const sandsHtml = clean(
        renderToString(React.createElement(ArtifactPieceCard, { artifact: mockSands }))
      );
      expect(sandsHtml).toContain('SANDS');
      expect(sandsHtml).toContain('Sands of Eon');
      expect(sandsHtml).toContain("Witch&#x27;s End Time");
    });

    it('renders Main Stat with high contrast typography and correct formatting (no 100x bug)', () => {
      // Flat HP: 4780
      const flowerHtml = clean(
        renderToString(React.createElement(ArtifactPieceCard, { artifact: mockFlower }))
      );
      expect(flowerHtml).toContain('Main Stat');
      expect(flowerHtml).toContain('HP');
      expect(flowerHtml).toContain('4780');

      // Flat ATK: 311
      const plumeHtml = clean(
        renderToString(React.createElement(ArtifactPieceCard, { artifact: mockPlume }))
      );
      expect(plumeHtml).toContain('ATK');
      expect(plumeHtml).toContain('311');

      // Percentage: 46.6% HP
      const sandsHtml = clean(
        renderToString(React.createElement(ArtifactPieceCard, { artifact: mockSands }))
      );
      expect(sandsHtml).toContain('HP%');
      expect(sandsHtml).toContain('46.6%');

      // Percentage: 62.2% CRIT DMG
      const circletHtml = clean(
        renderToString(React.createElement(ArtifactPieceCard, { artifact: mockCirclet }))
      );
      expect(circletHtml).toContain('CRIT DMG');
      expect(circletHtml).toContain('62.2%');
    });

    it('renders substats with clean tabular alignment and correct visual roll pips', () => {
      const flowerHtml = clean(
        renderToString(React.createElement(ArtifactPieceCard, { artifact: mockFlower }))
      );

      expect(flowerHtml).toContain('Sub Stats');
      expect(flowerHtml).toContain('CRIT Rate');
      expect(flowerHtml).toContain('+3.9%');
      expect(flowerHtml).toContain('[●○○○○]'); // 1 roll

      expect(flowerHtml).toContain('CRIT DMG');
      expect(flowerHtml).toContain('+27.2%');
      expect(flowerHtml).toContain('[●●●●○]'); // 4 rolls

      expect(flowerHtml).toContain('ATK%');
      expect(flowerHtml).toContain('+9.9%');
      expect(flowerHtml).toContain('[●●○○○]'); // 2 rolls

      expect(flowerHtml).toContain('Elemental Mastery');
      expect(flowerHtml).toContain('+42');
      expect(flowerHtml).toContain('[●●○○○]'); // 2 rolls
    });

    it('renders roll count tooltips on roll pips', () => {
      const pipData1 = formatRollPips({ key: 'cr', value: 3.9, rolls: 1 });
      expect(pipData1.tooltip).toContain('1 Roll');

      const pipData4 = formatRollPips({ key: 'cd', value: 27.2, rolls: 4 });
      expect(pipData4.tooltip).toContain('4 Rolls');
      expect(pipData4.tooltip).toContain('3 upgrade procs');

      const pipData6 = formatRollPips({ key: 'cd', value: 46.6, rolls: 6 });
      expect(pipData6.pipsText).toBe('[●●●●●★]');
      expect(pipData6.tooltip).toContain('6 Rolls');
      expect(pipData6.tooltip).toContain('Theoretical Maximum');
    });

    it('renders universal Piece CV and dual-scale Quality Badges accurately', () => {
      // Standard piece: mockSands has 13.6 CR + 24.9 CD = 52.1 CV -> Godly (>= 50)
      const sandsHtml = clean(
        renderToString(React.createElement(ArtifactPieceCard, { artifact: mockSands }))
      );
      expect(sandsHtml).toContain('Godly (52.1 CV)');
      expect(sandsHtml).toContain('✦'); // Gold star icon for Godly

      // Standard piece: mockPlume has 10.5 CR + 21.0 CD = 42.0 CV -> Great (40.0 - 49.9)
      const plumeHtml = clean(
        renderToString(React.createElement(ArtifactPieceCard, { artifact: mockPlume }))
      );
      expect(plumeHtml).toContain('Great (42.0 CV)');

      // Circlet dual-scale: mockCirclet has 17.5 CR = 35.0 CV -> Godly (>= 35 on Circlet)
      const circletHtml = clean(
        renderToString(React.createElement(ArtifactPieceCard, { artifact: mockCirclet }))
      );
      expect(circletHtml).toContain('Godly (35.0 CV)');
    });

    it('renders Roll Quality indicator progress bar', () => {
      const flowerHtml = clean(
        renderToString(React.createElement(ArtifactPieceCard, { artifact: mockFlower }))
      );
      expect(flowerHtml).toContain('Roll Quality');
      expect(flowerHtml).toMatch(/\d+%/);
    });
  });

  // =========================================================================
  // 3. ArtifactsGrid Tests
  // =========================================================================
  describe('ArtifactsGrid', () => {
    it('orders artifacts in canonical sequence (flower -> plume -> sands -> goblet -> circlet)', () => {
      // Feed unordered artifacts: circlet, goblet, sands, plume, flower
      const shuffled: Artifact[] = [
        mockCirclet,
        mockGoblet,
        mockSands,
        mockPlume,
        mockFlower,
      ];

      const html = clean(
        renderToString(
          React.createElement(ArtifactsGrid, {
            artifacts: shuffled,
            showBanner: false,
          })
        )
      );

      const flowerIdx = html.indexOf('FLOWER');
      const plumeIdx = html.indexOf('PLUME');
      const sandsIdx = html.indexOf('SANDS');
      const gobletIdx = html.indexOf('GOBLET');
      const circletIdx = html.indexOf('CIRCLET');

      expect(flowerIdx).toBeGreaterThan(-1);
      expect(plumeIdx).toBeGreaterThan(flowerIdx);
      expect(sandsIdx).toBeGreaterThan(plumeIdx);
      expect(gobletIdx).toBeGreaterThan(sandsIdx);
      expect(circletIdx).toBeGreaterThan(gobletIdx);
    });

    it('renders section header and equipped count (5 / 5 Equipped)', () => {
      const html = clean(
        renderToString(
          React.createElement(ArtifactsGrid, {
            artifacts: mockArtifacts,
            showBanner: false,
          })
        )
      );

      expect(html).toContain('5-Piece Artifact Breakdown');
      expect(html).toContain('5 / 5 Equipped');
      expect(html).toContain('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4');
    });

    it('renders integrated banner when showBanner=true', () => {
      const html = clean(
        renderToString(
          React.createElement(ArtifactsGrid, {
            artifacts: mockArtifacts,
            activeBonuses: mockActiveBonuses,
            showBanner: true,
          })
        )
      );

      expect(html).toContain('Active Set Bonuses');
      expect(html).toContain('Crimson Witch of Flames');
      expect(html).toContain('5-Piece Artifact Breakdown');
    });
  });

  // =========================================================================
  // 4. Default Export Polymorphic ArtifactDisplay Tests
  // =========================================================================
  describe('Polymorphic Default Export ArtifactDisplay', () => {
    it('renders single artifact piece when passed { artifact: Artifact } (100% backward compatibility)', () => {
      const html = clean(
        renderToString(
          React.createElement(ArtifactDisplay, {
            artifact: mockFlower,
          })
        )
      );

      expect(html).toContain('FLOWER');
      expect(html).toContain('Crimson Witch of Flames');
      expect(html).toContain('+20');
      expect(html).toContain('Main Stat');
      expect(html).toContain('HP');
      expect(html).toContain('4780');
      expect(html).toContain('Sub Stats');
      expect(html).toContain('★★★★★');
    });

    it('renders artifacts grid when passed { artifacts: Artifact[] }', () => {
      const html = clean(
        renderToString(
          React.createElement(ArtifactDisplay, {
            artifacts: mockArtifacts,
          })
        )
      );

      expect(html).toContain('5-Piece Artifact Breakdown');
      expect(html).toContain('FLOWER');
      expect(html).toContain('PLUME');
      expect(html).toContain('SANDS');
      expect(html).toContain('GOBLET');
      expect(html).toContain('CIRCLET');
    });

    it('returns null when neither artifact nor artifacts is provided', () => {
      const html = clean(
        renderToString(React.createElement(ArtifactDisplay, {} as any))
      );
      expect(html).toBe('');
    });
  });

  // =========================================================================
  // 5. CharacterDetailModal Integration Tests
  // =========================================================================
  describe('CharacterDetailModal Integration', () => {
    const mockCharacter: Character = {
      id: 10000046,
      name: 'Hu Tao',
      element: 'Pyro',
      rarity: 5,
      level: 90,
      friendshipLevel: 10,
      icon: '',
      constellation: 1,
      talents: {
        normal: 10,
        skill: 10,
        burst: 9,
      },
      weapon: {
        id: 13501,
        name: 'Staff of Homa',
        rarity: 5,
        level: 90,
        ascension: 6,
        refinement: 1,
        baseAtk: 608,
        subStat: {
          key: 'cd',
          value: 66.2,
        },
        passiveName: 'Reckless Cinnabar',
        passiveDescription: 'HP increased by 20%. Gives ATK Bonus based on 0.8% of Max HP.',
        icon: 'https://enka.network/ui/UI_EquipIcon_Pole_Homa.png',
      },
      artifacts: mockArtifacts,
      activeSetBonuses: mockActiveBonuses,
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

    it('renders ActiveSetBonusesBanner and ArtifactsGrid in artifacts tab', () => {
      // Mock initial activeTab to 'artifacts'
      const useStateSpy = vi.spyOn(React, 'useState');
      useStateSpy.mockImplementationOnce(() => ['artifacts', vi.fn()] as any);

      const html = clean(
        renderToString(
          React.createElement(CharacterDetailModal, {
            character: mockCharacter,
            onClose: () => {},
          })
        )
      );

      useStateSpy.mockRestore();

      // Banner checks
      expect(html).toContain('Active Set Bonuses');
      expect(html).toContain('Crimson Witch of Flames');
      expect(html).toContain('4-Piece Set');
      expect(html).toContain('Pyro DMG Bonus +15%.');

      // Weapon checks
      expect(html).toContain('Staff of Homa');
      expect(html).toContain('R1');
      expect(html).toContain('Reckless Cinnabar');

      // ArtifactsGrid checks
      expect(html).toContain('5-Piece Artifact Breakdown');
      expect(html).toContain('FLOWER');
      expect(html).toContain('PLUME');
      expect(html).toContain('SANDS');
      expect(html).toContain('GOBLET');
      expect(html).toContain('CIRCLET');
    });

    it('renders mixed build fallback message in modal artifacts tab', () => {
      const rainbowChar: Character = {
        ...mockCharacter,
        activeSetBonuses: [],
        artifactSets: { 15001: 1, 15002: 1, 15003: 1, 15004: 1, 15005: 1 },
      };

      const useStateSpy = vi.spyOn(React, 'useState');
      useStateSpy.mockImplementationOnce(() => ['artifacts', vi.fn()] as any);

      const html = clean(
        renderToString(
          React.createElement(CharacterDetailModal, {
            character: rainbowChar,
            onClose: () => {},
          })
        )
      );

      useStateSpy.mockRestore();

      expect(html).toContain('No active set bonus (mixed artifacts)');
      expect(html).toContain('5-Piece Artifact Breakdown');
    });
  });

  // =========================================================================
  // 6. Defensive Formatting & Zero NaN/Undefined Invariants
  // =========================================================================
  describe('Defensive Formatting & Zero NaN/Undefined Invariants', () => {
    it('formatStatValue handles null, undefined, NaN, and unnormalized fractions', () => {
      expect(formatStatValue('hp', NaN)).toBe('0');
      expect(formatStatValue('hp', undefined as any)).toBe('0');
      expect(formatStatValue('hp', null as any)).toBe('0');

      // Flat HP integer string
      expect(formatStatValue('hp', 4780)).toBe('4780');

      // Percentage stat normalized
      expect(formatStatValue('hpPercent', 46.6)).toBe('46.6%');

      // Defense against raw decimal fraction (0.466 -> 46.6%)
      expect(formatStatValue('hpPercent', 0.466)).toBe('46.6%');
    });

    it('renders artifact card with zero substats or missing fields without throwing or outputting NaN', () => {
      const sparseArtifact: Artifact = {
        id: 999,
        name: 'Sparse Artifact',
        setId: 15001,
        setName: 'Sparse Set',
        slot: 'flower',
        rarity: 4,
        level: 0,
        mainStat: {
          key: 'hp',
          value: 645,
        },
        subStats: [],
        icon: '',
      };

      const html = clean(
        renderToString(
          React.createElement(ArtifactDisplay, { artifact: sparseArtifact })
        )
      );

      expect(html).not.toContain('NaN');
      expect(html).not.toContain('undefined');
      expect(html).toContain('FLOWER');
      expect(html).toContain('+0');
      expect(html).toContain('★★★★');
      expect(html).toContain('Subpar (0.0 CV)');
    });
  });
});
