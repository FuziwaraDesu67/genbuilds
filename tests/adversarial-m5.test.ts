/// <reference types="vitest/globals" />
import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

import {
  parseEnkaResponse,
  normalizeArtifactStat,
  isPercentageStat,
} from '@/lib/enka/parser';
import {
  calculateCritValue,
  getQualityBadge,
  getBuildCVTier,
  estimateRollCount,
  deriveVisualRollPips,
  getCharacterData,
  getStatName as getStaticStatName,
  FIGHT_PROPS,
  ARTIFACT_SLOTS,
  ARTIFACT_SETS,
  ELEMENT_COLORS,
  SUBSTAT_ROLLS,
} from '@/lib/enka/static-data';
import {
  getActiveArtifactSetBonuses,
  getArtifactSetDetails,
  getArtifactSetName,
  getArtifactSetBonus,
  ARTIFACT_SET_DATA,
  ARTIFACT_SET_LIST,
} from '@/lib/enka/artifact-set-data';
import {
  getWeaponPassive,
  getWeaponMetadata,
  WEAPON_DATA,
  WEAPON_LIST,
} from '@/lib/enka/weapon-data';
import {
  evaluateTalentBoosts,
  CHARACTER_TALENT_BOOSTS,
} from '@/lib/enka/talent-boost-data';
import {
  EnkaResponseSchema,
  type Character,
  type Artifact,
  type Weapon,
  type Element,
  type QualityBadge,
  type ActiveSetBonus,
  type EnkaData,
} from '@/lib/enka/types';

import CharacterCard, { ELEMENT_THEMES } from '@/components/character/CharacterCard';
import CharacterDetailModal from '@/components/character/CharacterDetailModal';
import ArtifactDisplay, {
  ActiveSetBonusesBanner,
  ArtifactsGrid,
  ARTIFACT_SLOT_CONFIG,
  ARTIFACT_SLOT_ORDER,
  formatStatValue,
  PIECE_CV_BADGE_CONFIG,
} from '@/components/character/ArtifactDisplay';
import ProfileClient from '@/components/profile/ProfileClient';

import enkaSample from './fixtures/enka-response.json';
import varesaSample from './fixtures/varesa-1813164100.json';

// Helper to normalize rendered HTML output for assertion
const clean = (html: string) => html.replace(/<!--.*?-->/g, '').replace(/\s+/g, ' ').trim();

describe('Milestone 5 Tier 5 Adversarial Coverage Hardening & Gap Analysis', () => {
  let baseCharacter: Character;
  let varesaCharacter: Character;
  let sampleEnkaData: EnkaData;

  beforeAll(() => {
    const validatedEnka = EnkaResponseSchema.parse(enkaSample);
    sampleEnkaData = parseEnkaResponse(validatedEnka);
    baseCharacter = sampleEnkaData.characters[0];

    const validatedVaresa = EnkaResponseSchema.parse(varesaSample);
    const parsedVaresa = parseEnkaResponse(validatedVaresa);
    varesaCharacter = parsedVaresa.characters[0];
  });

  // =========================================================================
  // 1. MALFORMED & PATHOLOGICAL API PAYLOAD INGESTION
  // =========================================================================
  describe('Adversarial 1: Malformed & Pathological API Payloads', () => {
    it('handles empty avatarInfoList gracefully without exceptions', () => {
      const minimalPayload = {
        playerInfo: {
          nickname: 'EmptyPlayer',
          level: 45,
        },
        uid: '123456789',
        ttl: 60,
        avatarInfoList: [],
      };

      const parsed = parseEnkaResponse(minimalPayload as any);
      expect(parsed.player.nickname).toBe('EmptyPlayer');
      expect(parsed.player.uid).toBe('123456789');
      expect(parsed.characters).toHaveLength(0);
      expect(parsed.ttl).toBe(60);
      expect(parsed.fetchedAt).toBeInstanceOf(Date);
    });

    it('handles missing playerInfo optional attributes (signature, profilePicture, nameCardId)', () => {
      const payloadMissingOptionals = {
        playerInfo: {
          nickname: 'GhostTraveler',
          level: 12,
        },
        uid: '987654321',
      };

      const parsed = parseEnkaResponse(payloadMissingOptionals as any);
      expect(parsed.player.nickname).toBe('GhostTraveler');
      expect(parsed.player.signature).toBeUndefined();
      expect(parsed.player.profilePictureId).toBeUndefined();
      expect(parsed.player.nameCardId).toBeUndefined();
    });

    it('handles character with missing propMap level and fetterInfo expLevel', () => {
      const rawChar: any = {
        avatarId: 10000046, // Hu Tao
        propMap: {}, // Missing 4001 level
        talentIdList: undefined,
        fetterInfo: undefined,
        fightPropMap: {},
        skillLevelMap: {},
        equipList: [
          {
            weapon: { level: 90, promoteLevel: 6, affixMap: { '11510': 0 } },
            itemId: 11510,
            flat: {
              rankLevel: 5,
              nameTextMapHash: 'Staff of Homa',
              weaponStats: [{ statValue: 608 }, { appendPropId: 'FIGHT_PROP_CRITICAL_HURT', statValue: 66.2 }],
              icon: 'UI_EquipIcon_Pole_Homa',
            },
          },
        ],
      };

      const payload = {
        playerInfo: { nickname: 'Tester', level: 60 },
        uid: '1813164100',
        avatarInfoList: [rawChar],
      };

      const parsed = parseEnkaResponse(payload as any);
      expect(parsed.characters).toHaveLength(1);
      const char = parsed.characters[0];
      expect(char.level).toBe(1); // Safely defaulted from parseInt('1')
      expect(char.constellation).toBe(0);
      expect(char.friendshipLevel).toBe(0);
      expect(char.artifacts).toHaveLength(0);
      expect(char.totalCv).toBe(0.0);
      expect(char.qualityBadge).toBe('Subpar');
    });

    it('handles unregistered/unknown character avatar ID with graceful fallback', () => {
      const unknownAvatarRaw: any = {
        avatarId: 99999999, // Non-existent character
        propMap: { '4001': { val: '80' } },
        talentIdList: [1, 2, 3], // C3
        fetterInfo: { expLevel: 10 },
        fightPropMap: {
          '2000': 15000,
          '2001': 1200,
          '2002': 600,
          '20': 0.65,
          '22': 1.5,
        },
        skillLevelMap: { '101': 6, '102': 8, '103': 8 },
        equipList: [
          {
            weapon: { level: 90, promoteLevel: 6 },
            itemId: 11510,
            flat: {
              rankLevel: 5,
              nameTextMapHash: 'Unknown Weapon',
              weaponStats: [{ statValue: 510 }],
              icon: 'UI_EquipIcon_Pole_Homa',
            },
          },
        ],
      };

      const payload = {
        playerInfo: { nickname: 'FutureHero', level: 60 },
        uid: '800000000',
        avatarInfoList: [unknownAvatarRaw],
      };

      const parsed = parseEnkaResponse(payload as any);
      expect(parsed.characters).toHaveLength(1);
      const fallbackChar = parsed.characters[0];
      expect(fallbackChar.id).toBe(99999999);
      expect(fallbackChar.name).toBe('Unknown Character (99999999)');
      expect(fallbackChar.element).toBe('Pyro');
      expect(fallbackChar.level).toBe(80);
      expect(fallbackChar.constellation).toBe(3);
      expect(fallbackChar.talents.boosted?.skill).toBe(true); // Fallback C3 boost
    });

    it('handles artifact with empty or missing reliquarySubstats gracefully', () => {
      const rawChar: any = {
        avatarId: 10000046,
        propMap: { '4001': { val: '90' } },
        fightPropMap: {},
        skillLevelMap: { '1': 1, '2': 1, '3': 1 },
        equipList: [
          {
            weapon: { level: 90 },
            itemId: 11510,
            flat: { rankLevel: 5, nameTextMapHash: 'Homa', weaponStats: [{ statValue: 608 }], icon: 'icon' },
          },
          {
            reliquary: { level: 21 }, // level 20 in-game
            itemId: 95534,
            flat: {
              equipType: 'EQUIP_BRACER',
              icon: 'UI_RelicIcon_15005_4',
              nameTextMapHash: 'Witch Flower',
              setNameTextMapHash: 'Crimson Witch of Flames',
              rankLevel: 5,
              reliquaryMainstat: { mainPropId: 'FIGHT_PROP_HP', statValue: 4780 },
              // reliquarySubstats is missing/undefined
            },
          },
        ],
      };

      const payload = {
        playerInfo: { nickname: 'Tester', level: 60 },
        uid: '1813164100',
        avatarInfoList: [rawChar],
      };

      const parsed = parseEnkaResponse(payload as any);
      expect(parsed.characters[0].artifacts).toHaveLength(1);
      const art = parsed.characters[0].artifacts[0];
      expect(art.subStats).toEqual([]);
      expect(art.cv).toBe(0.0);
      expect(art.qualityBadge).toBe('Subpar');
      expect(art.level).toBe(20);
    });

    it('handles weapon missing flat.weaponStats or with only 1 weaponStat', () => {
      const rawCharSingleStat: any = {
        avatarId: 10000046,
        propMap: { '4001': { val: '90' } },
        fightPropMap: {},
        skillLevelMap: {},
        equipList: [
          {
            weapon: { level: 1 },
            itemId: 11101, // Dull Blade
            flat: {
              rankLevel: 1,
              nameTextMapHash: 'Dull Blade',
              weaponStats: [{ statValue: 23 }], // Only Base ATK, no secondary stat
              icon: 'UI_EquipIcon_Sword_Blunt',
            },
          },
        ],
      };

      const payload = {
        playerInfo: { nickname: 'Novice', level: 1 },
        uid: '100000001',
        avatarInfoList: [rawCharSingleStat],
      };

      const parsed = parseEnkaResponse(payload as any);
      const weapon = parsed.characters[0].weapon;
      expect(weapon.name).toBe('Dull Blade');
      expect(weapon.baseAtk).toBe(23);
      expect(weapon.subStat).toBeUndefined();
      expect(weapon.refinement).toBe(1);
    });
  });

  // =========================================================================
  // 2. CONSTELLATION EDGE CASES & TALENT BOOST MATRIX
  // =========================================================================
  describe('Adversarial 2: Constellation Edge Cases & Talent Boost Matrix', () => {
    it('enforces Aloy (10000062) has zero boosted talents at ALL constellation levels (C0 to C6)', () => {
      for (let c = 0; c <= 6; c++) {
        const boosts = evaluateTalentBoosts(10000062, c);
        expect(boosts).toEqual({ normal: false, skill: false, burst: false });
      }
    });

    it('enforces all characters receive zero talent boosts at C0, C1, and C2', () => {
      const testCharacters = [
        10000046, // Hu Tao
        10000052, // Raiden Shogun
        10000087, // Neuvillette
        10000089, // Furina
        10000096, // Arlecchino
        10000002, // Ayaka
        10000030, // Zhongli
        99999999, // Unknown
      ];

      for (const charId of testCharacters) {
        for (let c = 0; c <= 2; c++) {
          const boosts = evaluateTalentBoosts(charId, c);
          expect(boosts.normal).toBe(false);
          expect(boosts.skill).toBe(false);
          expect(boosts.burst).toBe(false);
        }
      }
    });

    it('accurately distinguishes Fontaine Normal Attack boosters (Lyney, Wriothesley, Neuvillette, Arlecchino, Sethos)', () => {
      const fontaineNormalBoosters = [
        10000084, // Lyney
        10000086, // Wriothesley
        10000087, // Neuvillette
        10000096, // Arlecchino
        10000097, // Sethos
      ];

      for (const id of fontaineNormalBoosters) {
        // C3: Normal Attack boosted ONLY
        const c3 = evaluateTalentBoosts(id, 3);
        expect(c3.normal).toBe(true);
        expect(c3.skill).toBe(false);
        expect(c3.burst).toBe(false);

        // C4: Same as C3
        const c4 = evaluateTalentBoosts(id, 4);
        expect(c4.normal).toBe(true);
        expect(c4.skill).toBe(false);
        expect(c4.burst).toBe(false);

        // C5: Normal Attack AND Burst boosted
        const c5 = evaluateTalentBoosts(id, 5);
        expect(c5.normal).toBe(true);
        expect(c5.skill).toBe(false);
        expect(c5.burst).toBe(true);

        // C6: Normal Attack AND Burst boosted
        const c6 = evaluateTalentBoosts(id, 6);
        expect(c6.normal).toBe(true);
        expect(c6.skill).toBe(false);
        expect(c6.burst).toBe(true);
      }
    });

    it('accurately verifies Standard C3: Skill, C5: Burst characters', () => {
      const skillFirstChars = [
        10000046, // Hu Tao
        10000030, // Zhongli
        10000032, // Bennett
        10000073, // Nahida
        10000047, // Kaedehara Kazuha
        10000101, // Kinich
        10000103, // Xilonen
        10000106, // Mavuika
      ];

      for (const id of skillFirstChars) {
        const c3 = evaluateTalentBoosts(id, 3);
        expect(c3.normal).toBe(false);
        expect(c3.skill).toBe(true);
        expect(c3.burst).toBe(false);

        const c5 = evaluateTalentBoosts(id, 5);
        expect(c5.normal).toBe(false);
        expect(c5.skill).toBe(true);
        expect(c5.burst).toBe(true);
      }
    });

    it('accurately verifies Standard C3: Burst, C5: Skill characters', () => {
      const burstFirstChars = [
        10000052, // Raiden Shogun
        10000002, // Kamisato Ayaka
        10000023, // Xiangling
        10000025, // Xingqiu
        10000060, // Yelan
        10000089, // Furina
        10000070, // Nilou
        10000071, // Cyno
      ];

      for (const id of burstFirstChars) {
        const c3 = evaluateTalentBoosts(id, 3);
        expect(c3.normal).toBe(false);
        expect(c3.skill).toBe(false);
        expect(c3.burst).toBe(true);

        const c5 = evaluateTalentBoosts(id, 5);
        expect(c5.normal).toBe(false);
        expect(c5.skill).toBe(true);
        expect(c5.burst).toBe(true);
      }
    });

    it('safely evaluates negative or out-of-range constellation values', () => {
      expect(evaluateTalentBoosts(10000046, -1)).toEqual({ normal: false, skill: false, burst: false });
      expect(evaluateTalentBoosts(10000046, -100)).toEqual({ normal: false, skill: false, burst: false });
      // Beyond C6 still caps logic cleanly
      const highC = evaluateTalentBoosts(10000046, 12);
      expect(highC.skill).toBe(true);
      expect(highC.burst).toBe(true);
    });
  });

  // =========================================================================
  // 3. WEAPON REFINEMENT SCALING & SUBSTAT FORMATTER HARDENING
  // =========================================================================
  describe('Adversarial 3: Weapon Refinements, Scaling & Substat Formatter', () => {
    it('clamps weapon refinements strictly to [1..5]', () => {
      // 0 or negative clamps to 1
      const homaR0 = getWeaponPassive(11510, 0);
      const homaR1 = getWeaponPassive(11510, 1);
      expect(homaR0.passiveDescription).toBe(homaR1.passiveDescription);

      const homaNeg = getWeaponPassive(11510, -10);
      expect(homaNeg.passiveDescription).toBe(homaR1.passiveDescription);

      // Above 5 clamps to 5
      const homaR6 = getWeaponPassive(11510, 6);
      const homaR5 = getWeaponPassive(11510, 5);
      expect(homaR6.passiveDescription).toBe(homaR5.passiveDescription);

      const homaR99 = getWeaponPassive(11510, 99);
      expect(homaR99.passiveDescription).toBe(homaR5.passiveDescription);
    });

    it('verifies exact refinement scaling across diverse weapon archetypes (Polearms, Catalysts, Bows, Swords)', () => {
      // Staff of Homa: Polearm (HP 20% -> 40%, ATK 0.8% -> 1.6%)
      const homaR1 = getWeaponPassive('Staff of Homa', 1);
      expect(homaR1.passiveName).toBe('Reckless Cinnabar');
      expect(homaR1.passiveDescription).toContain('HP increased by 20%');
      expect(homaR1.passiveDescription).toContain('0.8% of the wielder\'s Max HP');

      const homaR5 = getWeaponPassive('Staff of Homa', 5);
      expect(homaR5.passiveDescription).toContain('HP increased by 40%');
      expect(homaR5.passiveDescription).toContain('1.6% of the wielder\'s Max HP');

      // The Widsith: Catalyst (ATK 60% -> 120%, DMG 48% -> 96%, EM 240 -> 480)
      const widsithR1 = getWeaponPassive('The Widsith', 1);
      expect(widsithR1.passiveName).toBe('Debut');
      expect(widsithR1.passiveDescription).toContain('ATK is increased by 60%');
      expect(widsithR1.passiveDescription).toContain('Increases all Elemental DMG by 48%');
      expect(widsithR1.passiveDescription).toContain('Elemental Mastery is increased by 240');

      const widsithR5 = getWeaponPassive('The Widsith', 5);
      expect(widsithR5.passiveDescription).toContain('ATK is increased by 120%');
      expect(widsithR5.passiveDescription).toContain('Increases all Elemental DMG by 96%');
      expect(widsithR5.passiveDescription).toContain('Elemental Mastery is increased by 480');

      // The Catch: Polearm (Burst DMG 16% -> 32%, Burst CR 6% -> 12%)
      const catchR1 = getWeaponPassive('The Catch', 1);
      expect(catchR1.passiveName).toBe('Shanty');
      expect(catchR1.passiveDescription).toContain('Burst DMG by 16%');
      expect(catchR1.passiveDescription).toContain('CRIT Rate by 6%');

      const catchR5 = getWeaponPassive('The Catch', 5);
      expect(catchR5.passiveDescription).toContain('Burst DMG by 32%');
      expect(catchR5.passiveDescription).toContain('CRIT Rate by 12%');

      // Mistsplitter Reforged: Sword
      const mistsplitterR1 = getWeaponPassive('Mistsplitter Reforged', 1);
      expect(mistsplitterR1.passiveName).toBe('Mistsplitter\'s Edge');
      expect(mistsplitterR1.passiveDescription).toContain('12% Elemental DMG Bonus');

      const mistsplitterR5 = getWeaponPassive('Mistsplitter Reforged', 5);
      expect(mistsplitterR5.passiveDescription).toContain('24% Elemental DMG Bonus');
    });

    it('safely handles unknown weapon ID or name without throwing', () => {
      const unknownById = getWeaponPassive(9999999, 3);
      expect(unknownById.passiveName).toBeUndefined();
      expect(unknownById.passiveDescription).toBeUndefined();

      const unknownByName = getWeaponPassive('Excalibur of Unknown Lands', 1);
      expect(unknownByName.passiveName).toBeUndefined();
      expect(unknownByName.passiveDescription).toBeUndefined();

      const meta = getWeaponMetadata(9999999);
      expect(meta).toBeUndefined();
    });
  });

  // =========================================================================
  // 4. DUAL-SCALE PIECE & BUILD CRIT VALUE (CV) RATING BOUNDARIES
  // =========================================================================
  describe('Adversarial 4: Dual-Scale Piece CV & Build CV Rating Boundaries', () => {
    it('verifies standard artifact pieces (Flower, Plume, Sands, Goblet) exact threshold boundaries', () => {
      // Subpar: < 20.0
      expect(getQualityBadge(0.0, false)).toBe('Subpar');
      expect(getQualityBadge(19.9, false)).toBe('Subpar');

      // Decent: 20.0 - 29.9
      expect(getQualityBadge(20.0, false)).toBe('Decent');
      expect(getQualityBadge(25.5, false)).toBe('Decent');
      expect(getQualityBadge(29.9, false)).toBe('Decent');

      // Good: 30.0 - 39.9
      expect(getQualityBadge(30.0, false)).toBe('Good');
      expect(getQualityBadge(35.0, false)).toBe('Good');
      expect(getQualityBadge(39.9, false)).toBe('Good');

      // Great: 40.0 - 49.9
      expect(getQualityBadge(40.0, false)).toBe('Great');
      expect(getQualityBadge(45.0, false)).toBe('Great');
      expect(getQualityBadge(49.9, false)).toBe('Great');

      // Godly: >= 50.0
      expect(getQualityBadge(50.0, false)).toBe('Godly');
      expect(getQualityBadge(54.4, false)).toBe('Godly');
    });

    it('verifies Circlet piece dual-scale adjusted threshold boundaries (>= 35.0 Godly)', () => {
      // Subpar: < 10.0
      expect(getQualityBadge(0.0, true)).toBe('Subpar');
      expect(getQualityBadge(9.9, true)).toBe('Subpar');

      // Decent: 10.0 - 19.9
      expect(getQualityBadge(10.0, true)).toBe('Decent');
      expect(getQualityBadge(15.0, true)).toBe('Decent');
      expect(getQualityBadge(19.9, true)).toBe('Decent');

      // Good: 20.0 - 29.9
      expect(getQualityBadge(20.0, true)).toBe('Good');
      expect(getQualityBadge(25.0, true)).toBe('Good');
      expect(getQualityBadge(29.9, true)).toBe('Good');

      // Great: 30.0 - 34.9
      expect(getQualityBadge(30.0, true)).toBe('Great');
      expect(getQualityBadge(32.5, true)).toBe('Great');
      expect(getQualityBadge(34.9, true)).toBe('Great');

      // Godly: >= 35.0
      expect(getQualityBadge(35.0, true)).toBe('Godly');
      expect(getQualityBadge(42.0, true)).toBe('Godly');
    });

    it('verifies differential behavior between Circlet and Standard pieces at identical CV values', () => {
      // At 15.0 CV: Standard is Subpar (<20), Circlet is Decent (>=10)
      expect(getQualityBadge(15.0, false)).toBe('Subpar');
      expect(getQualityBadge(15.0, true)).toBe('Decent');

      // At 32.0 CV: Standard is Good (30-39.9), Circlet is Great (30-34.9)
      expect(getQualityBadge(32.0, false)).toBe('Good');
      expect(getQualityBadge(32.0, true)).toBe('Great');

      // At 36.0 CV: Standard is Good (<40), Circlet is Godly (>=35)
      expect(getQualityBadge(36.0, false)).toBe('Good');
      expect(getQualityBadge(36.0, true)).toBe('Godly');
    });

    it('verifies Build CV tier boundaries (getBuildCVTier)', () => {
      // Subpar: < 140.0
      expect(getBuildCVTier(0.0)).toBe('Subpar');
      expect(getBuildCVTier(139.9)).toBe('Subpar');

      // Decent: 140.0 - 179.9
      expect(getBuildCVTier(140.0)).toBe('Decent');
      expect(getBuildCVTier(179.9)).toBe('Decent');

      // Good: 180.0 - 219.9
      expect(getBuildCVTier(180.0)).toBe('Good');
      expect(getBuildCVTier(219.9)).toBe('Good');

      // Great: 220.0 - 239.9
      expect(getBuildCVTier(220.0)).toBe('Great');
      expect(getBuildCVTier(239.9)).toBe('Great');

      // Godly: >= 240.0
      expect(getBuildCVTier(240.0)).toBe('Godly');
      expect(getBuildCVTier(320.0)).toBe('Godly');
    });

    it('verifies calculateCritValue protects against negative values and handles floating point precision', () => {
      expect(calculateCritValue(-10, -20)).toBe(0.0);
      expect(calculateCritValue(-5, 50)).toBe(50.0);
      expect(calculateCritValue(10, -50)).toBe(20.0);
      // 2 * 3.89 + 7.77 = 15.55 -> rounds to 15.6
      expect(calculateCritValue(3.89, 7.77)).toBe(15.6);
    });
  });

  // =========================================================================
  // 5. BOUNDED SUBSTAT ROLL COUNTS, PIPS & STAT NORMALIZATION
  // =========================================================================
  describe('Adversarial 5: Bounded Substat Roll Counts & Visual Pips', () => {
    it('returns 0 rolls for non-positive or unknown stats in estimateRollCount', () => {
      expect(estimateRollCount('cr', 0)).toBe(0);
      expect(estimateRollCount('cr', -10)).toBe(0);
      expect(estimateRollCount('unknownStatKey', 50)).toBe(0);
    });

    it('accurately estimates single-roll boundaries for all 10 standard substats', () => {
      for (const [statKey, rolls] of Object.entries(SUBSTAT_ROLLS)) {
        const minRoll = rolls[0];
        const estimated = estimateRollCount(statKey, minRoll);
        expect(estimated).toBe(1);
      }
    });

    it('clamps theoretical maximum roll counts to [1..6] regardless of extreme hacked numbers', () => {
      expect(estimateRollCount('cr', 23.34)).toBe(6); // 6 max rolls (3.89 * 6)
      expect(estimateRollCount('cr', 50.0)).toBe(6);  // Hacked/extreme value clamps to 6
      expect(estimateRollCount('cd', 100.0)).toBe(6);
      expect(estimateRollCount('hp', 5000)).toBe(6);
      expect(estimateRollCount('atk', 200)).toBe(6);
    });

    it('verifies deriveVisualRollPips accurately handles [1..6] and out-of-range bounds', () => {
      expect(deriveVisualRollPips(0)).toBe('●○○○○'); // Clamped to 1
      expect(deriveVisualRollPips(-5)).toBe('●○○○○');
      expect(deriveVisualRollPips(1)).toBe('●○○○○');
      expect(deriveVisualRollPips(2)).toBe('●●○○○');
      expect(deriveVisualRollPips(3)).toBe('●●●○○');
      expect(deriveVisualRollPips(4)).toBe('●●●●○');
      expect(deriveVisualRollPips(5)).toBe('●●●●●');
      expect(deriveVisualRollPips(6)).toBe('●●●●●★');
      expect(deriveVisualRollPips(10)).toBe('●●●●●★'); // Clamped to 6
    });

    it('verifies normalizeArtifactStat correctly handles unscaled decimals vs already scaled percentages', () => {
      // Unscaled decimals (0.466 -> 46.6)
      expect(normalizeArtifactStat('cr', 0.039)).toBe(3.9);
      expect(normalizeArtifactStat('cd', 0.622)).toBe(62.2);
      expect(normalizeArtifactStat('hpPercent', 0.466)).toBe(46.6);
      expect(normalizeArtifactStat('er', 0.551)).toBe(55.1);

      // Already scaled numbers (46.6 -> 46.6, no 100x multiplication)
      expect(normalizeArtifactStat('cr', 3.9)).toBe(3.9);
      expect(normalizeArtifactStat('cd', 62.2)).toBe(62.2);
      expect(normalizeArtifactStat('hpPercent', 46.6)).toBe(46.6);

      // Flat stats (never multiplied)
      expect(normalizeArtifactStat('hp', 4780)).toBe(4780);
      expect(normalizeArtifactStat('atk', 311)).toBe(311);
    });
  });

  // =========================================================================
  // 6. ARTIFACT SET SKILLS & MULTI-PIECE AGGREGATION
  // =========================================================================
  describe('Adversarial 6: Artifact Set Skills & Multi-Piece Aggregation', () => {
    it('aggregates zero active set bonuses when all 5 pieces are from different sets (rainbow build)', () => {
      const counts: Record<number, number> = {
        15001: 1,
        15002: 1,
        15003: 1,
        15004: 1,
        15005: 1,
      };

      const active = getActiveArtifactSetBonuses(counts);
      expect(active).toHaveLength(0);
    });

    it('aggregates two 2pc bonuses for 2pc + 2pc + 1 off-piece build', () => {
      const counts: Record<number, number> = {
        15020: 2, // Golden Troupe
        15008: 2, // Emblem of Severed Fate
        15025: 1, // Obsidian Codex (off-piece)
      };

      const active = getActiveArtifactSetBonuses(counts);
      expect(active).toHaveLength(2);
      expect(active.every((b) => b.twoPieceActive && !b.fourPieceActive && b.activeTier === '2pc')).toBe(true);
      expect(active.map((b) => b.name)).toContain('Golden Troupe');
      expect(active.map((b) => b.name)).toContain('Emblem of Severed Fate');
    });

    it('aggregates single 4pc bonus for 4pc + 1 off-piece build', () => {
      const counts: Record<number, number> = {
        15038: 4, // Obsidian Codex
        15006: 1, // Crimson Witch (off-piece)
      };

      const active = getActiveArtifactSetBonuses(counts);
      expect(active).toHaveLength(1);
      const bonus = active[0];
      expect(bonus.name).toBe('Obsidian Codex');
      expect(bonus.twoPieceActive).toBe(true);
      expect(bonus.fourPieceActive).toBe(true);
      expect(bonus.activeTier).toBe('4pc');
      expect(bonus.twoPiece).toContain('Nightsoul');
      expect(bonus.fourPiece).toContain('CRIT Rate increases by 40%');
    });

    it('safely resolves unknown set ID with fallback Set #ID without throwing', () => {
      const counts: Record<number, number> = {
        999999: 2,
      };

      const active = getActiveArtifactSetBonuses(counts);
      expect(active).toHaveLength(1);
      expect(active[0].name).toBe('Set #999999');
      expect(active[0].twoPieceActive).toBe(true);
      expect(active[0].fourPieceActive).toBe(false);
    });
  });

  // =========================================================================
  // 7. SSR SAFETY & HYDRATION RESILIENCE ACROSS UI COMPONENTS
  // =========================================================================
  describe('Adversarial 7: SSR Safety & Hydration Resilience Across UI Components', () => {
    it('executes renderToString on CharacterCard with all 7 elements without throwing', () => {
      const ALL_ELEMENTS: Element[] = ['Pyro', 'Hydro', 'Anemo', 'Electro', 'Dendro', 'Cryo', 'Geo'];

      for (const elem of ALL_ELEMENTS) {
        const char: Character = {
          ...baseCharacter,
          element: elem,
        };

        const html = clean(renderToString(React.createElement(CharacterCard, { character: char, uid: '1813164100' })));
        expect(html).toContain(char.name);
        expect(html).toContain(elem);
        expect(html).not.toContain('NaN%');
        expect(html).not.toContain('undefined%');
      }
    });

    it('executes renderToString on CharacterCard with minimal/sparse character build', () => {
      const minimalChar: Character = {
        id: 10000046,
        name: 'Sparse Hero',
        element: 'Pyro',
        rarity: 5,
        level: 1,
        constellation: 0,
        friendshipLevel: 0,
        talents: { normal: 1, skill: 1, burst: 1, boosted: { normal: false, skill: false, burst: false } },
        stats: {
          hp: 1000,
          atk: 100,
          def: 50,
          em: 0,
          er: 100,
          cr: 5,
          cd: 50,
          dmgBonus: {},
        },
        weapon: {
          id: 11101,
          name: 'Dull Blade',
          rarity: 1,
          level: 1,
          ascension: 0,
          refinement: 1,
          baseAtk: 23,
          icon: 'https://enka.network/ui/UI_EquipIcon_Sword_Blunt.png',
        },
        artifacts: [],
        artifactSets: {},
        activeSetBonuses: [],
        totalCv: 0.0,
        qualityBadge: 'Subpar',
        icon: 'https://enka.network/ui/UI_AvatarIcon_Hutao.png',
      };

      const html = clean(renderToString(React.createElement(CharacterCard, { character: minimalChar, uid: '1813164100' })));
      expect(html).toContain('Sparse Hero');
      expect(html).toContain('Dull Blade');
      expect(html).toContain('0.0 CV');
      expect(html).toContain('Subpar');
      expect(html).not.toContain('NaN%');
    });

    it('executes renderToString on CharacterDetailModal cleanly with full build data', () => {
      const html = clean(
        renderToString(
          React.createElement(CharacterDetailModal, {
            character: varesaCharacter,
            onClose: () => {},
          })
        )
      );

      expect(html).toContain('modal-export-target');
      expect(html).toContain('Export Build');
      expect(html).toContain('Stats');
      expect(html).toContain('Artifacts');
      expect(html).toContain('Damage');
      expect(html).toContain(varesaCharacter.name);
      expect(html).toContain('Total Build Crit Value');
      expect(html).toContain('Crit Ratio (CR : CD)');
      expect(html).not.toContain('NaN%');
    });

    it('executes renderToString on ArtifactDisplay and ArtifactsGrid with partial and empty artifacts', () => {
      // Empty artifacts array
      const emptyHtml = clean(renderToString(React.createElement(ArtifactDisplay, { artifacts: [] })));
      expect(emptyHtml).toBeDefined();

      // Partial artifacts (only Flower and Plume)
      const partialHtml = clean(
        renderToString(
          React.createElement(ArtifactDisplay, {
            artifacts: varesaCharacter.artifacts.slice(0, 2),
          })
        )
      );
      expect(partialHtml).toContain(varesaCharacter.artifacts[0].name);
      expect(partialHtml).toContain(varesaCharacter.artifacts[1].name);
      expect(partialHtml).not.toContain('NaN%');
    });

    it('executes renderToString on ActiveSetBonusesBanner with 0, 1, and 2 active set bonuses', () => {
      // 0 bonuses
      const banner0 = clean(renderToString(React.createElement(ActiveSetBonusesBanner, { activeBonuses: [] })));
      expect(banner0).toContain('No active set bonus (mixed artifacts)');
      expect(banner0).toContain('Equip at least 2 pieces from the same artifact set');

      // 1 bonus
      const bonus1: ActiveSetBonus = {
        setId: 15038,
        name: 'Obsidian Codex',
        setName: 'Obsidian Codex',
        count: 4,
        twoPieceActive: true,
        fourPieceActive: true,
        twoPieceText: 'DMG dealt is increased by 15%.',
        fourPieceText: 'CRIT Rate increases by 40% for 6s.',
        twoPiece: 'DMG dealt is increased by 15%.',
        fourPiece: 'CRIT Rate increases by 40% for 6s.',
        activeTier: '4pc',
      };
      const banner1 = clean(renderToString(React.createElement(ActiveSetBonusesBanner, { activeBonuses: [bonus1] })));
      expect(banner1).toContain('Obsidian Codex');
      expect(banner1).toContain('4-Piece Set');
      expect(banner1).toContain('4-Piece Bonus');
      expect(banner1).toContain('CRIT Rate increases by 40%');
    });

    it('executes renderToString on ProfileClient with mock initialData without throwing', () => {
      const mockData: EnkaData = {
        player: {
          uid: '1813164100',
          nickname: 'Addy',
          level: 60,
          signature: 'Showcase ready',
          nameCardId: 210001,
          profilePictureId: 10000105,
        },
        characters: [varesaCharacter, baseCharacter],
        ttl: 120,
        fetchedAt: new Date(),
      };

      const html = clean(
        renderToString(
          React.createElement(ProfileClient, {
            uid: '1813164100',
            initialData: mockData,
          })
        )
      );

      expect(html).toContain('Addy');
      expect(html).toContain('1813164100');
      expect(html).toContain('Character Showcase');
      expect(html).toContain('Showcase Characters:');
      expect(html).toContain('Average Build CV:');
      expect(html).toContain(varesaCharacter.name);
      expect(html).not.toContain('NaN%');
    });
  });

  // =========================================================================
  // 8. STRICT HOME UI IMMUTABILITY (R5) VERIFICATION
  // =========================================================================
  describe('Adversarial 8: Strict Home UI Immutability (R5) Cryptographic Verification', () => {
    const homeFilePath = path.resolve(process.cwd(), 'src/app/page.tsx');

    it('verifies src/app/page.tsx exists and is readable', () => {
      expect(fs.existsSync(homeFilePath)).toBe(true);
    });

    it('verifies src/app/page.tsx has exact line count (236) and byte length (10596)', () => {
      const content = fs.readFileSync(homeFilePath, 'utf8');
      const lines = content.split(/\r?\n/);
      expect(lines.length).toBe(236);
      expect(content.length).toBe(10596);
    });

    it('verifies src/app/page.tsx matches exact pristine SHA-256 integrity hash', () => {
      const content = fs.readFileSync(homeFilePath, 'utf8');
      const hash = crypto.createHash('sha256').update(content).digest('hex');
      expect(hash).toBe('01628bc2982be1d3706086d8f707ed3a1155361d2416408453f31ef11245679b');
    });

    it('confirms src/app/page.tsx does not import CharacterCard or showcase components', () => {
      const content = fs.readFileSync(homeFilePath, 'utf8');
      expect(content).not.toContain('CharacterCard');
      expect(content).not.toContain('ArtifactDisplay');
      expect(content).not.toContain('CharacterDetailModal');
      expect(content).not.toContain('ProfileClient');
    });
  });
});
