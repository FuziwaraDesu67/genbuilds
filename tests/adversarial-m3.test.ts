/// <reference types="vitest/globals" />
import React from 'react';
import { renderToString } from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { parseEnkaResponse } from '@/lib/enka/parser';
import {
  EnkaResponseSchema,
  type Character,
  type Element,
  type QualityBadge,
  type EnkaData,
} from '@/lib/enka/types';
import CharacterCard, { ELEMENT_THEMES } from '@/components/character/CharacterCard';
import CharacterDetailModal from '@/components/character/CharacterDetailModal';
import ProfileClient from '@/components/profile/ProfileClient';
import enkaSample from './fixtures/enka-response.json';
import varesaSample from './fixtures/varesa-1813164100.json';

const clean = (html: string) => html.replace(/<!--.*?-->/g, '');

describe('Milestone 3 Adversarial Challenge: Component Props, SSR & Edge Elements', () => {
  let baseCharacter: Character;
  let ororonCharacter: Character;

  beforeAll(() => {
    const validatedEnka = EnkaResponseSchema.parse(enkaSample);
    baseCharacter = parseEnkaResponse(validatedEnka).characters[0];

    const validatedVaresa = EnkaResponseSchema.parse(varesaSample);
    ororonCharacter = parseEnkaResponse(validatedVaresa).characters[0];
  });

  // =========================================================================
  // 1. ALL 7 ELEMENTS STYLING & CLASS INTEGRITY
  // =========================================================================
  describe('Adversarial 1: All 7 Elements Visual Styling & Theming', () => {
    const ALL_ELEMENTS: Array<{
      element: Element;
      expectedPrimary: string;
      expectedRgb: string;
      expectedBadgeBg: string;
      expectedBadgeText: string;
    }> = [
      {
        element: 'Pyro',
        expectedPrimary: '#FF6B2C',
        expectedRgb: '255, 107, 44',
        expectedBadgeBg: 'bg-orange-500/15',
        expectedBadgeText: 'text-orange-300',
      },
      {
        element: 'Hydro',
        expectedPrimary: '#00BFFF',
        expectedRgb: '0, 191, 255',
        expectedBadgeBg: 'bg-sky-500/15',
        expectedBadgeText: 'text-sky-300',
      },
      {
        element: 'Anemo',
        expectedPrimary: '#4FC3F7',
        expectedRgb: '79, 195, 247',
        expectedBadgeBg: 'bg-cyan-500/15',
        expectedBadgeText: 'text-cyan-300',
      },
      {
        element: 'Electro',
        expectedPrimary: '#9B59D6',
        expectedRgb: '155, 89, 214',
        expectedBadgeBg: 'bg-purple-500/15',
        expectedBadgeText: 'text-purple-300',
      },
      {
        element: 'Dendro',
        expectedPrimary: '#7CB342',
        expectedRgb: '124, 179, 66',
        expectedBadgeBg: 'bg-lime-500/15',
        expectedBadgeText: 'text-lime-300',
      },
      {
        element: 'Cryo',
        expectedPrimary: '#4DD0E1',
        expectedRgb: '77, 208, 225',
        expectedBadgeBg: 'bg-teal-500/15',
        expectedBadgeText: 'text-teal-300',
      },
      {
        element: 'Geo',
        expectedPrimary: '#FFB74D',
        expectedRgb: '255, 183, 77',
        expectedBadgeBg: 'bg-amber-500/15',
        expectedBadgeText: 'text-amber-300',
      },
    ];

    ALL_ELEMENTS.forEach(({ element, expectedPrimary, expectedRgb, expectedBadgeBg, expectedBadgeText }) => {
      it(`renders ${element} element card without style, class, or markup errors`, () => {
        const char: Character = {
          ...baseCharacter,
          id: 20000000 + element.charCodeAt(0),
          name: `Test ${element} Hero`,
          element,
          stats: {
            ...baseCharacter.stats,
            dmgBonus: {
              [element.toLowerCase()]: 46.6,
            },
          },
        };

        const theme = ELEMENT_THEMES[element];
        expect(theme).toBeDefined();
        expect(theme.primary).toBe(expectedPrimary);
        expect(theme.rgb).toBe(expectedRgb);
        expect(theme.badgeBg).toBe(expectedBadgeBg);
        expect(theme.badgeText).toBe(expectedBadgeText);

        const html = clean(renderToString(React.createElement(CharacterCard, {
          character: char,
          uid: '100000001',
        })));

        // Element name in badge chip
        expect(html).toContain(`>${element}</span>`);
        // Primary color in container border styling
        expect(html).toContain(expectedPrimary);
        // RGB glow in box-shadow
        expect(html).toContain(expectedRgb);
        // Elemental DMG bonus row label
        expect(html).toContain(`${element} DMG`);
        // Value formatted cleanly as 46.6%
        expect(html).toContain('46.6%');
      });
    });

    it('dynamically prioritizes Physical DMG bonus label when physical bonus exceeds elemental bonus', () => {
      const eulaLikeChar: Character = {
        ...baseCharacter,
        element: 'Cryo',
        stats: {
          ...baseCharacter.stats,
          dmgBonus: {
            cryo: 15.0,
            physical: 83.3,
          },
        },
      };

      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: eulaLikeChar,
        uid: '100000001',
      })));

      expect(html).toContain('Physical DMG');
      expect(html).toContain('83.3%');
      expect(html).not.toContain('Cryo DMG');
    });

    it('falls back safely to Pyro theme without crashing if unknown element is provided', () => {
      const unknownElementChar: Character = {
        ...baseCharacter,
        element: 'Omni' as unknown as Element,
      };

      expect(() => {
        renderToString(React.createElement(CharacterCard, {
          character: unknownElementChar,
          uid: '100000001',
        }));
      }).not.toThrow();

      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: unknownElementChar,
        uid: '100000001',
      })));

      expect(html).toContain('#FF6B2C');
    });
  });

  // =========================================================================
  // 2. EDGE CONSTELLATIONS (C0, C1, C3, C5, C6 & BOUNDARIES)
  // =========================================================================
  describe('Adversarial 2: Edge Constellations (C0, C1, C3, C5, C6 & Boundaries)', () => {
    it('C0: renders C0 pill with muted styling, no active progress line, and all 6 nodes locked', () => {
      const c0Char: Character = {
        ...baseCharacter,
        constellation: 0,
      };

      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: c0Char,
        uid: '100000001',
      })));

      // C0 Pill
      expect(html).toContain('>C0</div>');
      expect(html).toContain('rgba(255,255,255,0.06)');

      // Progress line should not render for constellation <= 1
      expect(html).not.toContain('transition-all duration-300 -z-0');

      // All 6 celestial nodes should be rendered as Locked
      for (let i = 1; i <= 6; i++) {
        expect(html).toContain(`title="Constellation ${i}: Locked"`);
        expect(html).not.toContain(`title="Constellation ${i}: Unlocked"`);
      }
    });

    it('C1: renders C1 pill, exactly 1 unlocked node, 5 locked nodes, and no progress line', () => {
      const c1Char: Character = {
        ...baseCharacter,
        constellation: 1,
      };

      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: c1Char,
        uid: '100000001',
      })));

      expect(html).toContain('>C1</div>');
      // Progress line only renders when constellation > 1
      expect(html).not.toContain('transition-all duration-300 -z-0');

      // Node 1 unlocked, nodes 2-6 locked
      expect(html).toContain('title="Constellation 1: Unlocked"');
      for (let i = 2; i <= 6; i++) {
        expect(html).toContain(`title="Constellation ${i}: Locked"`);
      }
    });

    it('C3: renders C3 pill, 3 unlocked nodes, 3 locked nodes, and 40% progress bar', () => {
      const c3Char: Character = {
        ...baseCharacter,
        constellation: 3,
      };

      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: c3Char,
        uid: '100000001',
      })));

      expect(html).toContain('>C3</div>');
      // ((3 - 1) / 5) * 100 = 40%
      expect(html).toContain('transition-all duration-300 -z-0');
      expect(html).toContain('width:40%');

      // Nodes 1, 2, 3 unlocked
      expect(html).toContain('title="Constellation 1: Unlocked"');
      expect(html).toContain('title="Constellation 2: Unlocked"');
      expect(html).toContain('title="Constellation 3: Unlocked"');

      // Nodes 4, 5, 6 locked
      expect(html).toContain('title="Constellation 4: Locked"');
      expect(html).toContain('title="Constellation 5: Locked"');
      expect(html).toContain('title="Constellation 6: Locked"');
    });

    it('C5: renders C5 pill, 5 unlocked nodes, 1 locked node, and 80% progress bar', () => {
      const c5Char: Character = {
        ...baseCharacter,
        constellation: 5,
      };

      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: c5Char,
        uid: '100000001',
      })));

      expect(html).toContain('>C5</div>');
      // ((5 - 1) / 5) * 100 = 80%
      expect(html).toContain('transition-all duration-300 -z-0');
      expect(html).toContain('width:80%');

      // Nodes 1-5 unlocked, node 6 locked
      for (let i = 1; i <= 5; i++) {
        expect(html).toContain(`title="Constellation ${i}: Unlocked"`);
      }
      expect(html).toContain('title="Constellation 6: Locked"');
    });

    it('C6: renders C6 pill, all 6 nodes unlocked, and 100% progress bar', () => {
      const c6Char: Character = {
        ...baseCharacter,
        constellation: 6,
      };

      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: c6Char,
        uid: '100000001',
      })));

      expect(html).toContain('>C6</div>');
      // ((6 - 1) / 5) * 100 = 100%
      expect(html).toContain('transition-all duration-300 -z-0');
      expect(html).toContain('width:100%');

      // All 6 nodes unlocked
      for (let i = 1; i <= 6; i++) {
        expect(html).toContain(`title="Constellation ${i}: Unlocked"`);
      }
      expect(html).not.toContain('Locked');
    });

    it('handles out-of-bounds constellations gracefully (negative or > 6)', () => {
      const negativeChar: Character = {
        ...baseCharacter,
        constellation: -1,
      };
      const negHtml = clean(renderToString(React.createElement(CharacterCard, {
        character: negativeChar,
        uid: '100000001',
      })));
      expect(negHtml).toContain('>C-1</div>');
      for (let i = 1; i <= 6; i++) {
        expect(negHtml).toContain(`title="Constellation ${i}: Locked"`);
      }

      const highChar: Character = {
        ...baseCharacter,
        constellation: 10,
      };
      const highHtml = clean(renderToString(React.createElement(CharacterCard, {
        character: highChar,
        uid: '100000001',
      })));
      expect(highHtml).toContain('>C10</div>');
      expect(highHtml).toContain('width:100%');
      for (let i = 1; i <= 6; i++) {
        expect(highHtml).toContain(`title="Constellation ${i}: Unlocked"`);
      }
    });
  });

  // =========================================================================
  // 3. CONSTELLATION TALENT BOOST PERMUTATIONS
  // =========================================================================
  describe('Adversarial 3: Constellation Talent Boost Permutations', () => {
    it('Permutation 1: Normal Attack boosted only -> renders +3 on NA only', () => {
      const char: Character = {
        ...baseCharacter,
        talents: {
          normal: 10,
          skill: 8,
          burst: 8,
          boosted: {
            normal: true,
            skill: false,
            burst: false,
          },
        },
      };

      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: char,
        uid: '100000001',
      })));

      // Exactly 1 instance of +3 badge span
      const boostSpans = html.match(/<span>\+3<\/span>/g);
      expect(boostSpans).not.toBeNull();
      expect(boostSpans!.length).toBe(1);

      // NA container has cyan border
      expect(html).toContain('#22d3ee');
    });

    it('Permutation 2: Skill boosted only -> renders +3 on Skill and cyan sparkles icon', () => {
      const char: Character = {
        ...baseCharacter,
        talents: {
          normal: 8,
          skill: 11,
          burst: 8,
          boosted: {
            normal: false,
            skill: true,
            burst: false,
          },
        },
      };

      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: char,
        uid: '100000001',
      })));

      const boostSpans = html.match(/<span>\+3<\/span>/g);
      expect(boostSpans).not.toBeNull();
      expect(boostSpans!.length).toBe(1);

      // Skill sparkles icon styled with #22d3ee
      expect(html).toContain('style="color:#22d3ee"');
    });

    it('Permutation 3: Burst boosted only -> renders +3 on Burst and cyan crown icon', () => {
      const char: Character = {
        ...baseCharacter,
        talents: {
          normal: 8,
          skill: 8,
          burst: 11,
          boosted: {
            normal: false,
            skill: false,
            burst: true,
          },
        },
      };

      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: char,
        uid: '100000001',
      })));

      const boostSpans = html.match(/<span>\+3<\/span>/g);
      expect(boostSpans).not.toBeNull();
      expect(boostSpans!.length).toBe(1);
    });

    it('Permutation 4: Skill AND Burst boosted (C3/C5 standard) -> renders exactly two +3 tags', () => {
      const char: Character = {
        ...baseCharacter,
        talents: {
          normal: 10,
          skill: 13,
          burst: 13,
          boosted: {
            normal: false,
            skill: true,
            burst: true,
          },
        },
      };

      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: char,
        uid: '100000001',
      })));

      const boostSpans = html.match(/<span>\+3<\/span>/g);
      expect(boostSpans).not.toBeNull();
      expect(boostSpans!.length).toBe(2);
    });

    it('Permutation 5: None boosted (C0/C1/C2) -> renders zero +3 tags', () => {
      const char: Character = {
        ...baseCharacter,
        talents: {
          normal: 9,
          skill: 9,
          burst: 9,
          boosted: {
            normal: false,
            skill: false,
            burst: false,
          },
        },
      };

      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: char,
        uid: '100000001',
      })));

      const boostSpans = html.match(/<span>\+3<\/span>/g);
      expect(boostSpans).toBeNull();
      expect(html).not.toContain('+3');
    });

    it('Permutation 6: All three boosted -> renders three +3 tags cleanly', () => {
      const char: Character = {
        ...baseCharacter,
        talents: {
          normal: 13,
          skill: 13,
          burst: 13,
          boosted: {
            normal: true,
            skill: true,
            burst: true,
          },
        },
      };

      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: char,
        uid: '100000001',
      })));

      const boostSpans = html.match(/<span>\+3<\/span>/g);
      expect(boostSpans).not.toBeNull();
      expect(boostSpans!.length).toBe(3);
    });

    it('handles undefined talents.boosted object without runtime exception', () => {
      const char: Character = {
        ...baseCharacter,
        talents: {
          normal: 6,
          skill: 6,
          burst: 6,
        },
      };

      expect(() => {
        renderToString(React.createElement(CharacterCard, {
          character: char,
          uid: '100000001',
        }));
      }).not.toThrow();

      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: char,
        uid: '100000001',
      })));
      expect(html).not.toContain('+3');
    });
  });

  // =========================================================================
  // 4. CROWNED TALENTS (LEVEL 10+) VS STANDARD TALENTS
  // =========================================================================
  describe('Adversarial 4: Crowned Talents (Level 10+) vs Standard Talents', () => {
    it('standard uncrowned talents (level 1-9) do not display golden crown star badge (★)', () => {
      const char: Character = {
        ...baseCharacter,
        talents: {
          normal: 8,
          skill: 8,
          burst: 8,
          boosted: { normal: false, skill: false, burst: false },
        },
      };

      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: char,
        uid: '100000001',
      })));

      expect(html).not.toContain('title="Crowned Talent"');
      expect(html).not.toContain('>★</div>');
    });

    it('true crowned unboosted talent (level 10) renders golden crown badge (★) and amber styling', () => {
      const char: Character = {
        ...baseCharacter,
        talents: {
          normal: 10,
          skill: 8,
          burst: 8,
          boosted: { normal: false, skill: false, burst: false },
        },
      };

      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: char,
        uid: '100000001',
      })));

      expect(html).toContain('title="Crowned Talent"');
      expect(html).toContain('>★</div>');
      expect(html).toContain('border-amber-400');
      expect(html).toContain('#f59e0b');
      expect(html).toContain('text-amber-300 font-extrabold');
      expect(html).not.toContain('+3');
    });

    it('triple crowned unboosted build (10/10/10) renders exactly three crown badges (★)', () => {
      const char: Character = {
        ...baseCharacter,
        talents: {
          normal: 10,
          skill: 10,
          burst: 10,
          boosted: { normal: false, skill: false, burst: false },
        },
      };

      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: char,
        uid: '100000001',
      })));

      const crownMatches = html.match(/title="Crowned Talent"/g);
      expect(crownMatches).not.toBeNull();
      expect(crownMatches!.length).toBe(3);
    });

    it('boosted talent at level 13 renders +3 tag and does not render duplicate ★ crown badge', () => {
      const char: Character = {
        ...baseCharacter,
        talents: {
          normal: 9,
          skill: 13,
          burst: 9,
          boosted: { normal: false, skill: true, burst: false },
        },
      };

      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: char,
        uid: '100000001',
      })));

      // Skill has +3
      expect(html).toContain('+3');
      // But not the unboosted crown badge ★
      expect(html).not.toContain('title="Crowned Talent"');
      // Border is cyan #22d3ee rather than amber
      expect(html).toContain('#22d3ee');
    });
  });

  // =========================================================================
  // 5. WEAPON EDGE CASES & ROBUSTNESS
  // =========================================================================
  describe('Adversarial 5: Weapon Edge Cases & Robustness', () => {
    it('handles weapon with missing substat gracefully (omits substat badge, keeps Base ATK)', () => {
      const charWithoutSubstat: Character = {
        ...baseCharacter,
        weapon: {
          ...baseCharacter.weapon,
          subStat: undefined,
        },
      };

      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: charWithoutSubstat,
        uid: '100000001',
      })));

      // Base ATK still rendered
      expect(html).toContain('Base ATK');
      expect(html).toContain(String(baseCharacter.weapon.baseAtk));

      // No broken substat markup, NaN, or undefined
      expect(html).not.toContain('NaN%');
      expect(html).not.toContain('undefined%');
      expect(html).not.toContain('undefined');
    });

    it('handles weapon with missing passive name/description and unknown weapon ID gracefully', () => {
      const charUnknownWeapon: Character = {
        ...baseCharacter,
        weapon: {
          id: 999999,
          name: 'Custom Mystery Sword',
          rarity: 4,
          level: 90,
          ascension: 6,
          refinement: 1,
          baseAtk: 510,
          icon: 'https://enka.network/ui/UI_EquipIcon_Sword.png',
          passiveName: undefined,
          passiveDescription: undefined,
        },
      };

      expect(() => {
        renderToString(React.createElement(CharacterCard, {
          character: charUnknownWeapon,
          uid: '100000001',
        }));
      }).not.toThrow();

      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: charUnknownWeapon,
        uid: '100000001',
      })));

      expect(html).toContain('Custom Mystery Sword');
      expect(html).toContain('Base ATK');
      expect(html).toContain('510');
      // No passive disclosure button rendered
      expect(html).not.toContain('group/passive');
    });

    it('renders R1 refinement badge with standard amber styling', () => {
      const charR1: Character = {
        ...baseCharacter,
        weapon: {
          ...baseCharacter.weapon,
          refinement: 1,
        },
      };

      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: charR1,
        uid: '100000001',
      })));

      expect(html).toContain('>R1</span>');
      expect(html).toContain('border-amber-400/40');
      expect(html).not.toContain('shadow-[0_0_10px_rgba(251,191,36,0.35)]');
    });

    it('renders R5 refinement badge with enhanced glowing gold gradient styling', () => {
      const charR5: Character = {
        ...baseCharacter,
        weapon: {
          ...baseCharacter.weapon,
          refinement: 5,
        },
      };

      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: charR5,
        uid: '100000001',
      })));

      expect(html).toContain('>R5</span>');
      expect(html).toContain('via-yellow-400/40');
      expect(html).toContain('shadow-[0_0_10px_rgba(251,191,36,0.35)]');
      expect(html).toContain('border-amber-400/60');
    });

    it('correctly formats various weapon substat types (CRIT DMG%, ATK%, EM flat)', () => {
      const weaponSubstats = [
        { key: 'cd', value: 0.662, expectedLabel: 'CRIT DMG', expectedVal: '66.2%' },
        { key: 'cr', value: 33.1, expectedLabel: 'CRIT Rate', expectedVal: '33.1%' },
        { key: 'atkpercent', value: 49.6, expectedLabel: 'ATK', expectedVal: '49.6%' },
        { key: 'em', value: 165, expectedLabel: 'Elemental Mastery', expectedVal: '165' },
        { key: 'er', value: 55.1, expectedLabel: 'Energy Recharge', expectedVal: '55.1%' },
        { key: 'physicaldmgbonus', value: 0.69, expectedLabel: 'Physical DMG', expectedVal: '69.0%' },
      ];

      weaponSubstats.forEach(({ key, value, expectedLabel, expectedVal }) => {
        const char: Character = {
          ...baseCharacter,
          weapon: {
            ...baseCharacter.weapon,
            subStat: { key, value },
          },
        };

        const html = clean(renderToString(React.createElement(CharacterCard, {
          character: char,
          uid: '100000001',
        })));

        expect(html).toContain(expectedLabel);
        expect(html).toContain(expectedVal);
      });
    });

    it('safely omits Base ATK badge if weapon baseAtk is 0 or negative', () => {
      const zeroAtkChar: Character = {
        ...baseCharacter,
        weapon: {
          ...baseCharacter.weapon,
          baseAtk: 0,
        },
      };

      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: zeroAtkChar,
        uid: '100000001',
      })));

      expect(html).not.toContain('Base ATK');
    });
  });

  // =========================================================================
  // 6. RAINBOW ARTIFACT BUILDS & SET BONUS FALLBACK
  // =========================================================================
  describe('Adversarial 6: Rainbow Artifact Builds & Set Bonus Fallback', () => {
    it('renders fallback message for rainbow build with no active set bonuses in CharacterCard', () => {
      const rainbowChar: Character = {
        ...baseCharacter,
        activeSetBonuses: [],
        artifactSets: {
          15001: 1,
          15002: 1,
          15003: 1,
          15004: 1,
          15005: 1,
        },
      };

      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: rainbowChar,
        uid: '100000001',
      })));

      expect(html).toContain('No active set bonus (mixed artifacts)');
      expect(html).not.toContain('4-Piece Active');
      expect(html).not.toContain('2-Piece Active');
    });

    it('renders fallback message for rainbow build in CharacterDetailModal when viewing artifacts tab', () => {
      const rainbowChar: Character = {
        ...baseCharacter,
        activeSetBonuses: [],
        artifactSets: {
          15001: 1,
          15002: 1,
          15003: 1,
          15004: 1,
          15005: 1,
        },
      };

      // Mock initial activeTab to 'artifacts'
      const useStateSpy = vi.spyOn(React, 'useState');
      useStateSpy.mockImplementationOnce(() => ['artifacts', vi.fn()] as any);

      const html = clean(renderToString(React.createElement(CharacterDetailModal, {
        character: rainbowChar,
        onClose: () => {},
      })));

      useStateSpy.mockRestore();

      expect(html).toContain('No active set bonus (mixed artifacts)');
      // Artifact inspection breakdown grid still renders all 5 artifacts
      expect(html).toContain('5-Piece Artifact Breakdown');
      expect(html).toContain('FLOWER');
      expect(html).toContain('PLUME');
      expect(html).toContain('SANDS');
      expect(html).toContain('GOBLET');
      expect(html).toContain('CIRCLET');
    });

    it('renders 2pc chip with 2pc tag and popover details for a build with only 2-piece active', () => {
      const twoPieceChar: Character = {
        ...baseCharacter,
        activeSetBonuses: [
          {
            setId: 15001,
            setName: "Gladiator's Finale",
            twoPieceActive: true,
            fourPieceActive: false,
            twoPieceText: 'ATK +18%.',
            fourPieceText: 'If the wielder of this artifact set uses a Sword, Claymore or Polearm, increases their Normal Attack DMG by 35%.',
          },
        ],
      };

      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: twoPieceChar,
        uid: '100000001',
      })));

      expect(html).toContain("Gladiator&#x27;s Finale (2)");
      expect(html).toContain('2pc');
      expect(html).toContain('2-Piece Active');
      expect(html).toContain('4-Piece Bonus');
      expect(html).toContain('(Inactive)');
      expect(html).toContain('ATK +18%.');
    });

    it('renders 4pc chip with 4pc tag and popover details for a build with 4-piece active', () => {
      const fourPieceChar: Character = {
        ...baseCharacter,
        activeSetBonuses: [
          {
            setId: 15006,
            setName: 'Crimson Witch of Flames',
            twoPieceActive: true,
            fourPieceActive: true,
            twoPieceText: 'Pyro DMG Bonus +15%.',
            fourPieceText: 'Increases Overloaded, Burning, and Burgeon DMG by 40%.',
          },
        ],
      };

      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: fourPieceChar,
        uid: '100000001',
      })));

      expect(html).toContain('Crimson Witch of Flames (4)');
      expect(html).toContain('4pc');
      expect(html).toContain('4-Piece Active');
      expect(html).toContain('Pyro DMG Bonus +15%.');
      expect(html).toContain('Increases Overloaded, Burning, and Burgeon DMG by 40%.');
    });
  });

  // =========================================================================
  // 7. SSR RENDER INTEGRITY & HYDRATION SAFETY
  // =========================================================================
  describe('Adversarial 7: SSR Render Integrity & Hydration Safety', () => {
    it('executes ReactDOMServer.renderToString(<CharacterCard />) cleanly with full markup', () => {
      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: baseCharacter,
        uid: '1813164100',
      })));

      // Specular top highlight line present
      expect(html).toContain('bg-gradient-to-r from-transparent via-white/25 to-transparent');
      // Avatar image present with proper loading attribute
      expect(html).toContain('loading="lazy"');
      expect(html).toContain(baseCharacter.icon);
      // Character identity present
      expect(html).toContain(baseCharacter.name);
      expect(html).toContain('Lv.90');
      // 6 primary combat stats present
      expect(html).toContain('HP');
      expect(html).toContain('ATK');
      expect(html).toContain('DEF');
      expect(html).toContain('EM');
      expect(html).toContain('ER');
      expect(html).toContain('Crit Ratio');
      // Weapon details present
      expect(html).toContain(baseCharacter.weapon.name);
      expect(html).toContain(`Lv.${baseCharacter.weapon.level}`);
      // Build CV tier present
      expect(html).toContain('Build CV');
      expect(html).toContain('CV');
      // Navigation action present
      expect(html).toContain('View on Leaderboard');
    });

    it('executes ReactDOMServer.renderToString(<CharacterDetailModal />) cleanly with tabs and export target', () => {
      const html = clean(renderToString(React.createElement(CharacterDetailModal, {
        character: baseCharacter,
        onClose: () => {},
      })));

      expect(html).toContain('modal-export-target');
      expect(html).toContain('Export Build');
      expect(html).toContain('Stats');
      expect(html).toContain('Artifacts');
      expect(html).toContain('Damage');
      expect(html).toContain(baseCharacter.name);
      expect(html).toContain('Total Build Crit Value');
      expect(html).toContain('Crit Ratio (CR : CD)');
    });

    it('executes ReactDOMServer.renderToString(<ProfileClient />) cleanly with Showcase Overview Banner', () => {
      const mockEnkaData: EnkaData = {
        player: {
          uid: '1813164100',
          nickname: 'Addy',
          level: 60,
          signature: 'Showcase ready',
          worldLevel: 8,
          profilePicture: 'https://enka.network/ui/UI_AvatarIcon_Varesa.png',
        },
        characters: [ororonCharacter, baseCharacter],
        ttl: 120,
      };

      const html = clean(renderToString(React.createElement(ProfileClient, {
        uid: '1813164100',
        initialData: mockEnkaData,
      })));

      // Player details
      expect(html).toContain('Addy');
      expect(html).toContain('1813164100');
      expect(html).toContain('Showcase ready');
      // Showcase Overview Statistics Banner
      expect(html).toContain('Showcase Characters:');
      expect(html).toContain('Average Build CV:');
      expect(html).toContain('Top Build:');
      expect(html).toContain('Refresh available in');
      // Both character cards rendered
      expect(html).toContain(ororonCharacter.name);
      expect(html).toContain('Hu Tao');
    });

    it('executes ReactDOMServer.renderToString(<ProfileClient />) on empty showcase without throwing', () => {
      const emptyData: EnkaData = {
        player: {
          uid: '999999999',
          nickname: 'EmptyAccount',
          level: 10,
          worldLevel: 1,
          profilePicture: '',
        },
        characters: [],
        ttl: 0,
      };

      const html = clean(renderToString(React.createElement(ProfileClient, {
        uid: '999999999',
        initialData: emptyData,
      })));

      expect(html).toContain('EmptyAccount');
      expect(html).toContain('No characters in showcase');
      expect(html).toContain('Enable character showcase in-game:');
    });
  });

  // =========================================================================
  // 8. BUILD CV TIER BOUNDARIES & CRIT RATIO RESILIENCE
  // =========================================================================
  describe('Adversarial 8: Build CV Tier Boundaries & Crit Ratio Resilience', () => {
    const TIER_BOUNDARIES: Array<{ cv: number; expectedTier: QualityBadge }> = [
      { cv: 0.0, expectedTier: 'Subpar' },
      { cv: 139.9, expectedTier: 'Subpar' },
      { cv: 140.0, expectedTier: 'Decent' },
      { cv: 179.9, expectedTier: 'Decent' },
      { cv: 180.0, expectedTier: 'Good' },
      { cv: 219.9, expectedTier: 'Good' },
      { cv: 220.0, expectedTier: 'Great' },
      { cv: 239.9, expectedTier: 'Great' },
      { cv: 240.0, expectedTier: 'Godly' },
      { cv: 320.5, expectedTier: 'Godly' },
    ];

    TIER_BOUNDARIES.forEach(({ cv, expectedTier }) => {
      it(`assigns exactly ${expectedTier} tier for ${cv} CV`, () => {
        const char: Character = {
          ...baseCharacter,
          totalCv: cv,
          qualityBadge: expectedTier,
        };

        const html = clean(renderToString(React.createElement(CharacterCard, {
          character: char,
          uid: '100000001',
        })));

        expect(html).toContain(`${cv.toFixed(1)} CV`);
        expect(html).toContain(`>${expectedTier}</span>`);
      });
    });

    it('safely computes CR:CD ratio without NaN or Infinity when CR is 0', () => {
      const zeroCrChar: Character = {
        ...baseCharacter,
        stats: {
          ...baseCharacter.stats,
          cr: 0,
          cd: 140.0,
        },
      };

      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: zeroCrChar,
        uid: '100000001',
      })));

      expect(html).toContain('1:0.0');
      expect(html).not.toContain('Infinity');
      expect(html).not.toContain('NaN');
    });

    it('safely clamps negative CR to 0 without throwing or breaking ratio', () => {
      const negCrChar: Character = {
        ...baseCharacter,
        stats: {
          ...baseCharacter.stats,
          cr: -15.0,
          cd: 120.0,
        },
      };

      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: negCrChar,
        uid: '100000001',
      })));

      expect(html).toContain('1:0.0');
      expect(html).not.toContain('Infinity');
      expect(html).not.toContain('NaN');
    });
  });

  // =========================================================================
  // 9. R5 HOME UI ZERO-TOUCH CONSTRAINT
  // =========================================================================
  describe('Adversarial 9: R5 Home UI Zero-Touch Immutability', () => {
    const homeFilePath = path.resolve(process.cwd(), 'src/app/page.tsx');

    it('verifies src/app/page.tsx exists', () => {
      expect(fs.existsSync(homeFilePath)).toBe(true);
    });

    it('verifies src/app/page.tsx has exact line count (236) and byte length (10596)', () => {
      const content = fs.readFileSync(homeFilePath, 'utf-8');
      expect(content.length).toBe(10596);
      const lines = content.split('\n');
      expect(lines.length).toBe(236);
    });

    it('verifies src/app/page.tsx matches exact SHA-256 integrity hash', () => {
      const content = fs.readFileSync(homeFilePath, 'utf-8');
      const hash = crypto.createHash('sha256').update(content).digest('hex');
      expect(hash).toBe('01628bc2982be1d3706086d8f707ed3a1155361d2416408453f31ef11245679b');
    });
  });
});
