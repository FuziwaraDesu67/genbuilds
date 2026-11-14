/// <reference types="vitest/globals" />
import { evaluateTalentBoosts, CHARACTER_TALENT_BOOSTS } from '../src/lib/enka/talent-boost-data';
import { parseEnkaResponse } from '../src/lib/enka/parser';
import { GAME_CHARACTERS } from '../src/lib/enka/game-data.generated';

describe('Constellation Talent Boost & Parser Adversarial Test Suite', () => {
  // Helper to create minimal valid EnkaResponse mock for any character
  const createMockEnkaPayload = (options: {
    avatarId: number;
    constellationCount: number;
    skillLevelMap: Record<string, number>;
    weaponId?: number;
  }) => ({
    playerInfo: {
      nickname: 'AdversarialTester',
      level: 60,
    },
    ttl: 300,
    uid: '888888888',
    avatarInfoList: [
      {
        avatarId: options.avatarId,
        propMap: {
          '4001': { type: 4001, val: '90' },
        },
        talentIdList: Array.from({ length: options.constellationCount }, (_, i) => 1000 + i),
        fightPropMap: {
          '2000': 25000,
          '2001': 2000,
          '2002': 900,
          '20': 0.7,
          '22': 1.6,
          '23': 1.2,
        },
        skillLevelMap: options.skillLevelMap,
        equipList: [
          {
            itemId: options.weaponId || 11507,
            weapon: {
              level: 90,
              promoteLevel: 6,
              affixMap: { '111507': 0 },
            },
            flat: {
              nameTextMapHash: 'Test Weapon',
              rankLevel: 5,
              itemType: 'ITEM_WEAPON',
              icon: 'UI_EquipIcon_Sword_Narukami',
              weaponStats: [
                { appendPropId: 'FIGHT_PROP_BASE_ATTACK', statValue: 674 },
              ],
            },
          },
        ],
        fetterInfo: { expLevel: 10 },
      },
    ],
  });

  // ==========================================================================
  // 1. Fontaine Normal Attack Boosters (Neuvillette & Arlecchino)
  // ==========================================================================
  describe('Fontaine Normal Attack Boosters', () => {
    describe('Neuvillette (10000087)', () => {
      it('verifies Neuvillette C3 has Normal Attack boosted, Skill not boosted, Burst not boosted', () => {
        const boostsC3 = evaluateTalentBoosts(10000087, 3);
        expect(boostsC3).toEqual({
          normal: true,
          skill: false,
          burst: false,
        });
      });

      it('verifies Neuvillette progression from C0 through C6', () => {
        // C0 - C2: No boosts
        expect(evaluateTalentBoosts(10000087, 0)).toEqual({ normal: false, skill: false, burst: false });
        expect(evaluateTalentBoosts(10000087, 1)).toEqual({ normal: false, skill: false, burst: false });
        expect(evaluateTalentBoosts(10000087, 2)).toEqual({ normal: false, skill: false, burst: false });

        // C3 & C4: Normal boosted only
        expect(evaluateTalentBoosts(10000087, 3)).toEqual({ normal: true, skill: false, burst: false });
        expect(evaluateTalentBoosts(10000087, 4)).toEqual({ normal: true, skill: false, burst: false });

        // C5 & C6: Normal + Burst boosted, Skill unboosted
        expect(evaluateTalentBoosts(10000087, 5)).toEqual({ normal: true, skill: false, burst: true });
        expect(evaluateTalentBoosts(10000087, 6)).toEqual({ normal: true, skill: false, burst: true });
      });

      it('verifies Neuvillette C3 talent boosts via full parseEnkaResponse pipeline', () => {
        const payload = createMockEnkaPayload({
          avatarId: 10000087,
          constellationCount: 3,
          skillLevelMap: {
            '10871': 10,
            '10872': 8,
            '10873': 8,
          },
        });

        const parsed = parseEnkaResponse(payload);
        expect(parsed.characters).toHaveLength(1);
        const neuv = parsed.characters[0];
        expect(neuv.name).toBe('Neuvillette');
        expect(neuv.constellation).toBe(3);
        expect(neuv.talents.boosted).toEqual({
          normal: true,
          skill: false,
          burst: false,
        });
      });
    });

    describe('Arlecchino (10000096) and Xianyun (10000093) ID Integrity', () => {
      it('verifies that Arlecchino in game data is avatar ID 10000096, not 10000093', () => {
        expect(GAME_CHARACTERS[10000096]?.name).toBe('Arlecchino');
        expect(GAME_CHARACTERS[10000093]?.name).toBe('Xianyun');
      });

      it('verifies Arlecchino (10000096) at C3 has Normal Attack boosted (NOT Skill boosted)', () => {
        // Arlecchino C3: "You Shall Dine on Iron and Tears" -> Increases Normal Attack level by 3.
        const arleBoosts = evaluateTalentBoosts(10000096, 3);
        expect(arleBoosts).toEqual({
          normal: true,
          skill: false,
          burst: false,
        });
      });

      it('verifies Xianyun (10000093) at C3 does NOT have Normal Attack boosted', () => {
        // Xianyun is an Anemo catalyst plunge healer. Her C3 boosts Burst, NOT Normal Attack.
        const xianyunBoosts = evaluateTalentBoosts(10000093, 3);
        expect(xianyunBoosts.normal).toBe(false);
      });

      it('verifies Arlecchino C3 talent boosts via full parseEnkaResponse pipeline with true avatarId 10000096', () => {
        const payload = createMockEnkaPayload({
          avatarId: 10000096,
          constellationCount: 3,
          skillLevelMap: {
            '10961': 10,
            '10962': 8,
            '10965': 8,
          },
        });

        const parsed = parseEnkaResponse(payload);
        const arle = parsed.characters[0];
        expect(arle.name).toBe('Arlecchino');
        expect(arle.constellation).toBe(3);
        expect(arle.talents.boosted).toEqual({
          normal: true,
          skill: false,
          burst: false,
        });
      });
    });
  });

  // ==========================================================================
  // 2. Raiden Shogun (10000052)
  // ==========================================================================
  describe('Raiden Shogun (10000052)', () => {
    it('verifies Raiden Shogun C3 has Burst boosted, Skill not boosted, Normal not boosted', () => {
      const boostsC3 = evaluateTalentBoosts(10000052, 3);
      expect(boostsC3).toEqual({
        normal: false,
        skill: false,
        burst: true,
      });
    });

    it('verifies Raiden Shogun progression from C0 through C6', () => {
      // C0 - C2
      expect(evaluateTalentBoosts(10000052, 0)).toEqual({ normal: false, skill: false, burst: false });
      expect(evaluateTalentBoosts(10000052, 1)).toEqual({ normal: false, skill: false, burst: false });
      expect(evaluateTalentBoosts(10000052, 2)).toEqual({ normal: false, skill: false, burst: false });

      // C3 & C4: Burst boosted only
      expect(evaluateTalentBoosts(10000052, 3)).toEqual({ normal: false, skill: false, burst: true });
      expect(evaluateTalentBoosts(10000052, 4)).toEqual({ normal: false, skill: false, burst: true });

      // C5 & C6: Burst + Skill boosted
      expect(evaluateTalentBoosts(10000052, 5)).toEqual({ normal: false, skill: true, burst: true });
      expect(evaluateTalentBoosts(10000052, 6)).toEqual({ normal: false, skill: true, burst: true });
    });

    it('verifies Raiden Shogun C3 via full parseEnkaResponse pipeline', () => {
      const payload = createMockEnkaPayload({
        avatarId: 10000052,
        constellationCount: 3,
        skillLevelMap: {
          '10521': 6,
          '10522': 9,
          '10523': 10,
        },
      });

      const parsed = parseEnkaResponse(payload);
      const raiden = parsed.characters[0];
      expect(raiden.name).toBe('Raiden Shogun');
      expect(raiden.constellation).toBe(3);
      expect(raiden.talents.boosted).toEqual({
        normal: false,
        skill: false,
        burst: true,
      });
    });
  });

  // ==========================================================================
  // 3. Standard C3/C5 Characters (Hu Tao, Bennett, Xingqiu)
  // ==========================================================================
  describe('Standard C3/C5 Characters', () => {
    describe('Hu Tao (10000046) - C3 Skill, C5 Burst archetype', () => {
      it('verifies Hu Tao at C3 has Skill boosted, Burst not boosted, Normal not boosted', () => {
        expect(evaluateTalentBoosts(10000046, 3)).toEqual({
          normal: false,
          skill: true,
          burst: false,
        });
      });

      it('verifies Hu Tao at C5 has both Skill and Burst boosted', () => {
        expect(evaluateTalentBoosts(10000046, 5)).toEqual({
          normal: false,
          skill: true,
          burst: true,
        });
      });

      it('verifies Hu Tao end-to-end parser integration at C3 and C5', () => {
        const parsedC3 = parseEnkaResponse(createMockEnkaPayload({
          avatarId: 10000046,
          constellationCount: 3,
          skillLevelMap: { '10461': 10, '10462': 10, '10463': 9 },
        })).characters[0];
        expect(parsedC3.talents.boosted).toEqual({ normal: false, skill: true, burst: false });

        const parsedC5 = parseEnkaResponse(createMockEnkaPayload({
          avatarId: 10000046,
          constellationCount: 5,
          skillLevelMap: { '10461': 10, '10462': 10, '10463': 10 },
        })).characters[0];
        expect(parsedC5.talents.boosted).toEqual({ normal: false, skill: true, burst: true });
      });
    });

    describe('Bennett (10000032) - C3 Skill, C5 Burst archetype', () => {
      it('verifies Bennett at C3 has Skill boosted, Burst not boosted', () => {
        expect(evaluateTalentBoosts(10000032, 3)).toEqual({
          normal: false,
          skill: true,
          burst: false,
        });
      });

      it('verifies Bennett at C5 has both Skill and Burst boosted', () => {
        expect(evaluateTalentBoosts(10000032, 5)).toEqual({
          normal: false,
          skill: true,
          burst: true,
        });
      });

      it('verifies Bennett end-to-end parser integration at C3 and C5', () => {
        const parsedC3 = parseEnkaResponse(createMockEnkaPayload({
          avatarId: 10000032,
          constellationCount: 3,
          skillLevelMap: { '10321': 1, '10322': 8, '10323': 10 },
        })).characters[0];
        expect(parsedC3.name).toBe('Bennett');
        expect(parsedC3.talents.boosted).toEqual({ normal: false, skill: true, burst: false });

        const parsedC5 = parseEnkaResponse(createMockEnkaPayload({
          avatarId: 10000032,
          constellationCount: 5,
          skillLevelMap: { '10321': 1, '10322': 8, '10323': 10 },
        })).characters[0];
        expect(parsedC5.talents.boosted).toEqual({ normal: false, skill: true, burst: true });
      });
    });

    describe('Xingqiu (10000025) - C3 Burst, C5 Skill archetype', () => {
      it('verifies Xingqiu at C3 has Burst boosted, Skill not boosted', () => {
        expect(evaluateTalentBoosts(10000025, 3)).toEqual({
          normal: false,
          skill: false,
          burst: true,
        });
      });

      it('verifies Xingqiu at C5 has both Skill and Burst boosted', () => {
        expect(evaluateTalentBoosts(10000025, 5)).toEqual({
          normal: false,
          skill: true,
          burst: true,
        });
      });

      it('verifies Xingqiu end-to-end parser integration at C3 and C5', () => {
        const parsedC3 = parseEnkaResponse(createMockEnkaPayload({
          avatarId: 10000025,
          constellationCount: 3,
          skillLevelMap: { '10251': 1, '10252': 9, '10253': 10 },
        })).characters[0];
        expect(parsedC3.name).toBe('Xingqiu');
        expect(parsedC3.talents.boosted).toEqual({ normal: false, skill: false, burst: true });

        const parsedC5 = parseEnkaResponse(createMockEnkaPayload({
          avatarId: 10000025,
          constellationCount: 5,
          skillLevelMap: { '10251': 1, '10252': 9, '10253': 10 },
        })).characters[0];
        expect(parsedC5.talents.boosted).toEqual({ normal: false, skill: true, burst: true });
      });
    });
  });

  // ==========================================================================
  // 4. Aloy C0-C6 (Constellation Invariance)
  // ==========================================================================
  describe('Aloy (10000062) Invariance', () => {
    it('verifies Aloy always returns all false across all standard constellations C0 through C6', () => {
      for (let c = 0; c <= 6; c++) {
        expect(evaluateTalentBoosts(10000062, c)).toEqual({
          normal: false,
          skill: false,
          burst: false,
        });
      }
    });

    it('verifies Aloy returns all false even with adversarial constellation values (negative, extreme, out-of-bounds)', () => {
      expect(evaluateTalentBoosts(10000062, -1)).toEqual({ normal: false, skill: false, burst: false });
      expect(evaluateTalentBoosts(10000062, -99)).toEqual({ normal: false, skill: false, burst: false });
      expect(evaluateTalentBoosts(10000062, 7)).toEqual({ normal: false, skill: false, burst: false });
      expect(evaluateTalentBoosts(10000062, 99)).toEqual({ normal: false, skill: false, burst: false });
    });

    it('verifies Aloy end-to-end parser integration at synthetic C3 and C6', () => {
      const parsedC3 = parseEnkaResponse(createMockEnkaPayload({
        avatarId: 10000062,
        constellationCount: 3,
        skillLevelMap: { '10621': 8, '10622': 8, '10623': 8 },
      })).characters[0];
      expect(parsedC3.name).toBe('Aloy');
      expect(parsedC3.talents.boosted).toEqual({ normal: false, skill: false, burst: false });

      const parsedC6 = parseEnkaResponse(createMockEnkaPayload({
        avatarId: 10000062,
        constellationCount: 6,
        skillLevelMap: { '10621': 8, '10622': 8, '10623': 8 },
      })).characters[0];
      expect(parsedC6.talents.boosted).toEqual({ normal: false, skill: false, burst: false });
    });
  });

  // ==========================================================================
  // 5. Unknown / Unregistered Character IDs Fallback
  // ==========================================================================
  describe('Unknown / Unregistered Character IDs Fallback', () => {
    it('verifies unknown character IDs default to C3 Skill, C5 Burst standard mapping', () => {
      const unknownIds = [99999999, 10000999, 77777777, -1, 0];

      for (const id of unknownIds) {
        // C0 - C2: all false
        expect(evaluateTalentBoosts(id, 0)).toEqual({ normal: false, skill: false, burst: false });
        expect(evaluateTalentBoosts(id, 1)).toEqual({ normal: false, skill: false, burst: false });
        expect(evaluateTalentBoosts(id, 2)).toEqual({ normal: false, skill: false, burst: false });

        // C3 & C4: Skill true, Burst false, Normal false
        expect(evaluateTalentBoosts(id, 3)).toEqual({ normal: false, skill: true, burst: false });
        expect(evaluateTalentBoosts(id, 4)).toEqual({ normal: false, skill: true, burst: false });

        // C5 & C6: Skill true, Burst true, Normal false
        expect(evaluateTalentBoosts(id, 5)).toEqual({ normal: false, skill: true, burst: true });
        expect(evaluateTalentBoosts(id, 6)).toEqual({ normal: false, skill: true, burst: true });
      }
    });

    it('verifies adversarial constellation inputs for unknown characters', () => {
      // Negative constellation
      expect(evaluateTalentBoosts(99999999, -5)).toEqual({ normal: false, skill: false, burst: false });

      // Out-of-bounds high constellation (>= 5 keeps skill and burst boosted)
      expect(evaluateTalentBoosts(99999999, 10)).toEqual({ normal: false, skill: true, burst: true });
      expect(evaluateTalentBoosts(99999999, 99)).toEqual({ normal: false, skill: true, burst: true });
    });

    it('verifies parser handles unknown character ID at C3 without throwing and attaches fallback boost', () => {
      const payload = createMockEnkaPayload({
        avatarId: 99999999,
        constellationCount: 3,
        skillLevelMap: {
          '9901': 6,
          '9902': 8,
          '9903': 10,
        },
      });

      const parsed = parseEnkaResponse(payload);
      expect(parsed.characters).toHaveLength(1);
      const unknownChar = parsed.characters[0];
      expect(unknownChar.name).toBe('Unknown Character (99999999)');
      expect(unknownChar.constellation).toBe(3);
      expect(unknownChar.talents.boosted).toEqual({
        normal: false,
        skill: true,
        burst: false,
      });
    });

    it('verifies parser handles unknown character ID at C5 and attaches both Skill and Burst boosts', () => {
      const payload = createMockEnkaPayload({
        avatarId: 99999999,
        constellationCount: 5,
        skillLevelMap: {
          '9901': 6,
          '9902': 8,
          '9903': 10,
        },
      });

      const parsed = parseEnkaResponse(payload);
      const unknownChar = parsed.characters[0];
      expect(unknownChar.talents.boosted).toEqual({
        normal: false,
        skill: true,
        burst: true,
      });
    });
  });

  // ==========================================================================
  // 6. Ayaka Skill Order Parsing (Real & Synthetic Payloads)
  // ==========================================================================
  describe('Ayaka Skill Order Parsing', () => {
    // Ayaka: ID 10000002, skillOrder: [10024, 10018, 10019]
    // 10024: Normal Attack
    // 10018: Elemental Skill (Kamisato Art: Hyouka)
    // 10019: Elemental Burst (Kamisato Art: Soumetsu)
    // 10023: Alternate Sprint (Kamisato Art: Senho)

    it('correctly maps real Ayaka in-game payload with alternate sprint present', () => {
      const realAyakaPayload = createMockEnkaPayload({
        avatarId: 10000002,
        constellationCount: 3, // C3 -> Burst boosted
        skillLevelMap: {
          '10024': 10, // Normal Attack (level 10)
          '10018': 8,  // Skill (level 8)
          '10019': 13, // Burst (level 13)
          '10023': 1,  // Alternate Sprint (level 1)
        },
      });

      const parsed = parseEnkaResponse(realAyakaPayload);
      const ayaka = parsed.characters[0];

      // Skill order must preserve:
      // Normal: 10024 -> 10
      // Skill: 10018 -> 8
      // Burst: 10019 -> 13
      // Alternate Sprint (10023) MUST NOT be mapped to normal, skill, or burst!
      expect(ayaka.talents.normal).toBe(10);
      expect(ayaka.talents.skill).toBe(8);
      expect(ayaka.talents.burst).toBe(13);

      // Verify C3 boost: Ayaka is C3 Burst, C5 Skill archetype
      expect(ayaka.talents.boosted).toEqual({
        normal: false,
        skill: false,
        burst: true,
      });
    });

    it('correctly parses Ayaka at C5 with both Burst and Skill boosted', () => {
      const ayakaC5Payload = createMockEnkaPayload({
        avatarId: 10000002,
        constellationCount: 5,
        skillLevelMap: {
          '10024': 10,
          '10018': 13,
          '10019': 13,
          '10023': 1,
        },
      });

      const parsed = parseEnkaResponse(ayakaC5Payload);
      const ayaka = parsed.characters[0];
      expect(ayaka.talents.normal).toBe(10);
      expect(ayaka.talents.skill).toBe(13);
      expect(ayaka.talents.burst).toBe(13);
      expect(ayaka.talents.boosted).toEqual({
        normal: false,
        skill: true,
        burst: true,
      });
    });

    it('gracefully handles synthetic payload where skill IDs do not match real Ayaka skillOrder', () => {
      // In synthetic tests, skillLevelMap might use generic keys '1', '2', '3'
      const syntheticPayload = createMockEnkaPayload({
        avatarId: 10000002,
        constellationCount: 0,
        skillLevelMap: {
          '1': 6,
          '2': 7,
          '3': 8,
        },
      });

      const parsed = parseEnkaResponse(syntheticPayload);
      const ayaka = parsed.characters[0];

      // Because '1', '2', '3' don't match Ayaka's skillOrder [10024, 10018, 10019],
      // parseTalents should safely fall back to numeric key ascending sort: '1', '2', '3'
      expect(ayaka.talents.normal).toBe(6);
      expect(ayaka.talents.skill).toBe(7);
      expect(ayaka.talents.burst).toBe(8);
      expect(ayaka.talents.boosted).toEqual({
        normal: false,
        skill: false,
        burst: false,
      });
    });

    it('handles synthetic payload with reversed arbitrary skill IDs', () => {
      const reversedSyntheticPayload = createMockEnkaPayload({
        avatarId: 10000002,
        constellationCount: 0,
        skillLevelMap: {
          '300': 10,
          '200': 9,
          '100': 8,
        },
      });

      const parsed = parseEnkaResponse(reversedSyntheticPayload);
      const ayaka = parsed.characters[0];

      // Sorted numeric keys: 100, 200, 300
      expect(ayaka.talents.normal).toBe(8);
      expect(ayaka.talents.skill).toBe(9);
      expect(ayaka.talents.burst).toBe(10);
    });

    it('handles partial skillOrder matches (only 1 matching key out of 3)', () => {
      // If only 1 key matches, the condition (matching >= 2) fails and triggers fallback
      const partialPayload = createMockEnkaPayload({
        avatarId: 10000002,
        constellationCount: 0,
        skillLevelMap: {
          '10024': 10,
          '9999': 5,
        },
      });

      const parsed = parseEnkaResponse(partialPayload);
      const ayaka = parsed.characters[0];

      // Fallback sorted keys: 9999, 10024
      // normal -> 9999 (5), skill -> 10024 (10), burst -> undefined fallback to 1
      expect(ayaka.talents.normal).toBe(5);
      expect(ayaka.talents.skill).toBe(10);
      expect(ayaka.talents.burst).toBe(1);
    });

    it('handles Ayaka with exactly 2 matching skillOrder keys', () => {
      // If 2 keys match (matching >= 2), skillOrder logic applies
      const twoKeyPayload = createMockEnkaPayload({
        avatarId: 10000002,
        constellationCount: 0,
        skillLevelMap: {
          '10024': 9,
          '10018': 8,
          // '10019' is omitted
        },
      });

      const parsed = parseEnkaResponse(twoKeyPayload);
      const ayaka = parsed.characters[0];

      // normal -> 10024 (9), skill -> 10018 (8), burst -> 10019 (missing, defaults to 1)
      expect(ayaka.talents.normal).toBe(9);
      expect(ayaka.talents.skill).toBe(8);
      expect(ayaka.talents.burst).toBe(1);
    });

    it('handles empty skillLevelMap safely without crashing', () => {
      const emptySkillPayload = createMockEnkaPayload({
        avatarId: 10000002,
        constellationCount: 0,
        skillLevelMap: {},
      });

      const parsed = parseEnkaResponse(emptySkillPayload);
      const ayaka = parsed.characters[0];

      expect(ayaka.talents.normal).toBe(1);
      expect(ayaka.talents.skill).toBe(1);
      expect(ayaka.talents.burst).toBe(1);
    });
  });

  // ==========================================================================
  // 7. Comprehensive Roster Integrity & Edge Cases
  // ==========================================================================
  describe('Comprehensive Roster Archetype Integrity', () => {
    it('verifies all registered characters in CHARACTER_TALENT_BOOSTS have valid c3 and c5 config', () => {
      const validTalentTypes = new Set(['normal', 'skill', 'burst']);

      for (const [charIdStr, config] of Object.entries(CHARACTER_TALENT_BOOSTS)) {
        const charId = Number(charIdStr);
        expect(charId).toBeGreaterThan(10000000);
        expect(validTalentTypes.has(config.c3)).toBe(true);
        expect(validTalentTypes.has(config.c5)).toBe(true);

        // At C0, no boosts
        const c0 = evaluateTalentBoosts(charId, 0);
        expect(c0.normal || c0.skill || c0.burst).toBe(false);

        // At C3, exactly one talent boosted
        const c3 = evaluateTalentBoosts(charId, 3);
        const c3BoostCount = [c3.normal, c3.skill, c3.burst].filter(Boolean).length;
        expect(c3BoostCount).toBe(1);
        expect(c3[config.c3]).toBe(true);

        // At C5, exactly two talents boosted
        const c5 = evaluateTalentBoosts(charId, 5);
        const c5BoostCount = [c5.normal, c5.skill, c5.burst].filter(Boolean).length;
        expect(c5BoostCount).toBe(2);
        expect(c5[config.c3]).toBe(true);
        expect(c5[config.c5]).toBe(true);
      }
    });

    it('verifies Lyney, Wriothesley, and Sethos C3 Normal Attack boost behavior', () => {
      // Lyney (10000084)
      expect(evaluateTalentBoosts(10000084, 3)).toEqual({ normal: true, skill: false, burst: false });
      // Wriothesley (10000086)
      expect(evaluateTalentBoosts(10000086, 3)).toEqual({ normal: true, skill: false, burst: false });
      // Sethos (10000097)
      expect(evaluateTalentBoosts(10000097, 3)).toEqual({ normal: true, skill: false, burst: false });
    });

    it('handles negative constellation inputs gracefully across all characters', () => {
      expect(evaluateTalentBoosts(10000087, -1)).toEqual({ normal: false, skill: false, burst: false });
      expect(evaluateTalentBoosts(10000096, -10)).toEqual({ normal: false, skill: false, burst: false });
      expect(evaluateTalentBoosts(10000052, -999)).toEqual({ normal: false, skill: false, burst: false });
    });
  });
});
