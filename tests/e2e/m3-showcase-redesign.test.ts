/// <reference types="vitest/globals" />
import React from 'react';
import { renderToString } from 'react-dom/server';
import { parseEnkaResponse } from '@/lib/enka/parser';
import { EnkaResponseSchema, type Character } from '@/lib/enka/types';
import CharacterCard from '@/components/character/CharacterCard';
import CharacterDetailModal from '@/components/character/CharacterDetailModal';
import ProfileClient from '@/components/profile/ProfileClient';
import enkaSample from '../fixtures/enka-response.json';
import varesaSample from '../fixtures/varesa-1813164100.json';

const clean = (html: string) => html.replace(/<!--.*?-->/g, '');

describe('Milestone 3: Character Showcase & Build Card Redesign (R3)', () => {
  let huTaoCharacter: Character;
  let varesaCharacter: Character;

  beforeAll(() => {
    const validatedEnka = EnkaResponseSchema.parse(enkaSample);
    huTaoCharacter = parseEnkaResponse(validatedEnka).characters[0];

    const validatedVaresa = EnkaResponseSchema.parse(varesaSample);
    varesaCharacter = parseEnkaResponse(validatedVaresa).characters[0];
  });

  // =========================================================================
  // 1. Elemental Glassmorphism, Avatar Glow Frame & Star Rarity
  // =========================================================================
  describe('Visual Foundation & Avatar Glow Frame', () => {
    it('renders 5-star gold rarity (★★★★★) for Hu Tao and 4-star (★★★★) for 4-star characters', () => {
      const huTaoHtml = clean(renderToString(React.createElement(CharacterCard, {
        character: huTaoCharacter,
        uid: '1234567890',
      })));
      expect(huTaoHtml).toContain('★★★★★');

      const fourStarChar: Character = {
        ...huTaoCharacter,
        rarity: 4,
      };
      const fourStarHtml = clean(renderToString(React.createElement(CharacterCard, {
        character: fourStarChar,
        uid: '1234567890',
      })));
      expect(fourStarHtml).toContain('★★★★');
    });

    it('renders exact Lv.{character.level} without spaces for SSR compatibility', () => {
      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: huTaoCharacter,
        uid: '1234567890',
      })));
      expect(html).toContain('Lv.90');
      expect(html).not.toContain('Lv. 90');
    });

    it('renders friendship level badge with heart icon when friendshipLevel > 0', () => {
      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: huTaoCharacter,
        uid: '1234567890',
      })));
      expect(html).toContain('❤');
      expect(html).toContain('10');
    });

    it('applies high-contrast elemental glassmorphism with exact hex (#FF6B2C for Pyro, #9B59D6 for Electro)', () => {
      const pyroHtml = clean(renderToString(React.createElement(CharacterCard, {
        character: huTaoCharacter,
        uid: '1234567890',
      })));
      expect(pyroHtml).toContain('#FF6B2C');

      const electroHtml = clean(renderToString(React.createElement(CharacterCard, {
        character: varesaCharacter,
        uid: '1813164100',
      })));
      expect(electroHtml).toContain('#9B59D6');
    });
  });

  // =========================================================================
  // 2. Constellation Node Indicators (C0–C6)
  // =========================================================================
  describe('Constellation Node Indicators (C0-C6)', () => {
    it('renders C6 badge and 6-node progression track for C6 character', () => {
      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: huTaoCharacter,
        uid: '1234567890',
      })));
      expect(html).toContain('C6');
      for (let i = 1; i <= 6; i++) {
        expect(html).toContain(`Constellation ${i}: Unlocked`);
      }
    });

    it('renders C1 badge and exactly 1 unlocked node for C1 character', () => {
      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: varesaCharacter,
        uid: '1813164100',
      })));
      expect(html).toContain('C1');
      expect(html).toContain('Constellation 1: Unlocked');
      expect(html).toContain('Constellation 2: Locked');
      expect(html).toContain('Constellation 6: Locked');
    });

    it('renders C0 badge with all 6 locked nodes for C0 character', () => {
      const c0Char: Character = {
        ...huTaoCharacter,
        constellation: 0,
      };
      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: c0Char,
        uid: '1234567890',
      })));
      expect(html).toContain('C0');
      for (let i = 1; i <= 6; i++) {
        expect(html).toContain(`Constellation ${i}: Locked`);
      }
    });
  });

  // =========================================================================
  // 3. Refined Weapon Card (R1–R5, Base ATK, Substats & Passive Popover)
  // =========================================================================
  describe('Refined Weapon Card', () => {
    it('renders Staff of Homa at Lv.90 with R1 badge and Base ATK 608', () => {
      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: huTaoCharacter,
        uid: '1234567890',
      })));
      expect(html).toContain('Staff of Homa');
      expect(html).toContain('Lv.90');
      expect(html).toContain('R1');
      expect(html).toContain('Base ATK');
      expect(html).toContain('608');
    });

    it('renders The Widsith with R5 badge and formatted CRIT DMG substat', () => {
      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: varesaCharacter,
        uid: '1813164100',
      })));
      expect(html).toContain('The Widsith');
      expect(html).toContain('R5');
      expect(html).toContain('CRIT DMG');
      expect(html).toContain('55.1%');
    });

    it('renders weapon passive disclosure with passive name and description', () => {
      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: huTaoCharacter,
        uid: '1234567890',
      })));
      expect(html).toContain('Reckless Cinnabar');
      expect(html).toContain('HP increased by 20%');

      const varesaHtml = clean(renderToString(React.createElement(CharacterCard, {
        character: varesaCharacter,
        uid: '1813164100',
      })));
      expect(varesaHtml).toContain('Debut');
      expect(varesaHtml).toContain('ATK is increased by 120%');
    });
  });

  // =========================================================================
  // 4. Circular Talent Badges (+3 Radiant Boost & Crown Indicator)
  // =========================================================================
  describe('Circular Talent Badges & Radiant +3 Boost', () => {
    it('renders 3 circular talent badges for NA, Skill, and Burst', () => {
      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: huTaoCharacter,
        uid: '1234567890',
      })));
      expect(html).toContain('Talents');
      expect(html).toContain('NA');
      expect(html).toContain('Skill');
      expect(html).toContain('Burst');
    });

    it('displays radiant +3 boost tag for constellation-boosted talents (Skill & Burst for C6 Hu Tao)', () => {
      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: huTaoCharacter,
        uid: '1234567890',
      })));
      expect(html).toContain('+3');
      expect(html).toContain('Constellation Boosted (+3 Talent Levels)');
    });

    it('does not display +3 boost tag for unboosted talents (C1 Varesa)', () => {
      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: varesaCharacter,
        uid: '1813164100',
      })));
      expect(html).not.toContain('Constellation Boosted (+3 Talent Levels)');
    });

    it('displays crown indicator (★) for level 10+ crowned talents', () => {
      const crownedChar: Character = {
        ...varesaCharacter,
        talents: {
          normal: 10,
          skill: 9,
          burst: 8,
          boosted: {},
        },
      };
      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: crownedChar,
        uid: '1813164100',
      })));
      expect(html).toContain('Crowned Talent');
      expect(html).toContain('★');
    });
  });

  // =========================================================================
  // 5. Key Attribute Breakdown Panel & Build CV Tier Badge
  // =========================================================================
  describe('Key Attribute Breakdown Panel & Build CV Tier Badge', () => {
    it('renders 7-stat breakdown: HP, ATK, DEF, EM, ER, Crit Ratio, and Elemental DMG', () => {
      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: huTaoCharacter,
        uid: '1234567890',
      })));
      expect(html).toContain('HP');
      expect(html).toContain('35,558');
      expect(html).toContain('ATK');
      expect(html).toContain('1,234');
      expect(html).toContain('DEF');
      expect(html).toContain('876');
      expect(html).toContain('EM');
      expect(html).toContain('187');
      expect(html).toContain('ER');
      expect(html).toContain('100.0%');
      expect(html).toContain('Crit Ratio');
      expect(html).toContain('91.2% / 202.3%');
      expect(html).toContain('1:2.2');
      expect(html).toContain('Pyro DMG');
      expect(html).toContain('61.6%');
    });

    it('renders Build CV Tier badge with total CV and tier label (Decent)', () => {
      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: varesaCharacter,
        uid: '1813164100',
      })));
      expect(html).toContain('Build CV');
      expect(html).toContain('178.0 CV');
      expect(html).toContain('Decent');
      expect(html).toContain('Build Crit Value (CV)');
      expect(html).toContain('140.0 – 179.9 CV');
    });

    it('renders Godly CV tier for builds >= 240.0 CV', () => {
      const godlyChar: Character = {
        ...huTaoCharacter,
        totalCv: 255.4,
        qualityBadge: 'Godly',
      };
      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: godlyChar,
        uid: '1234567890',
      })));
      expect(html).toContain('255.4 CV');
      expect(html).toContain('Godly');
      expect(html).toContain('≥ 240.0 CV');
    });
  });

  // =========================================================================
  // 6. Active Artifact Set Bonus Chips
  // =========================================================================
  describe('Active Artifact Set Bonus Chips', () => {
    it('renders 4pc chip for Obsidian Codex (4) on Varesa with in-game skill text', () => {
      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: varesaCharacter,
        uid: '1813164100',
      })));
      expect(html).toContain('Active Set Bonuses');
      expect(html).toContain('Obsidian Codex (4)');
      expect(html).toContain('4pc');
      expect(html).toContain('Nightsoul');
      expect(html).toContain('CRIT Rate increases by 40%');
    });

    it('renders 4pc chip for Crimson Witch of Flames (4) on Hu Tao with skill text', () => {
      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: huTaoCharacter,
        uid: '1234567890',
      })));
      expect(html).toContain('Crimson Witch of Flames (4)');
      expect(html).toContain('Pyro DMG Bonus +15%');
      expect(html).toContain('Overloaded, Burning, and Burgeon DMG by 40%');
    });

    it('renders fallback when no active set bonuses are present (rainbow build)', () => {
      const rainbowChar: Character = {
        ...huTaoCharacter,
        artifactSets: { 15001: 1, 15002: 1, 15003: 1, 15004: 1, 15005: 1 },
        activeSetBonuses: [],
      };
      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: rainbowChar,
        uid: '1234567890',
      })));
      expect(html).toContain('No active set bonus (mixed artifacts)');
    });
  });

  // =========================================================================
  // 7. CharacterDetailModal Alignment
  // =========================================================================
  describe('CharacterDetailModal Alignment', () => {
    it('renders modal with Active Set Bonuses Banner and Refined Weapon details', () => {
      const html = clean(renderToString(React.createElement(CharacterDetailModal, {
        character: huTaoCharacter,
        onClose: () => {},
      })));
      expect(html).toContain('Hu Tao');
      expect(html).toContain('Lv.90');
      expect(html).toContain('C6');
      expect(html).toContain('Total Build Crit Value');
      expect(html).toContain('Crit Ratio (CR : CD)');
    });
  });

  // =========================================================================
  // 8. ProfileClient Showcase Presentation
  // =========================================================================
  describe('ProfileClient Presentation', () => {
    it('renders Showcase Overview statistics banner and featured showcase card', () => {
      const mockEnkaData = {
        player: { uid: '1813164100', nickname: 'Addy', level: 60, signature: 'Natlan explorer' },
        characters: [varesaCharacter],
        ttl: 300,
        fetchedAt: new Date(),
      };
      const html = clean(renderToString(React.createElement(ProfileClient, {
        uid: '1813164100',
        initialData: mockEnkaData,
      })));
      expect(html).toContain('Character Showcase');
      expect(html).toContain('Showcase Characters:');
      expect(html).toContain('Average Build CV:');
      expect(html).toContain('Top Build:');
      expect(html).toContain('178.0 CV');
      expect(html).toContain('akasha-showcase-card');
      expect(html).not.toContain('Full Roster Card Grid');
    });
  });
});
