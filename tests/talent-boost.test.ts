/// <reference types="vitest/globals" />
import { evaluateTalentBoosts, CHARACTER_TALENT_BOOSTS } from '../src/lib/enka/talent-boost-data';
import { parseEnkaResponse } from '../src/lib/enka/parser';

describe('Talent Boost Evaluation Module', () => {
  it('should return all false for C0 to C2 constellations', () => {
    expect(evaluateTalentBoosts(10000046, 0)).toEqual({ normal: false, skill: false, burst: false });
    expect(evaluateTalentBoosts(10000046, 1)).toEqual({ normal: false, skill: false, burst: false });
    expect(evaluateTalentBoosts(10000046, 2)).toEqual({ normal: false, skill: false, burst: false });
  });

  it('should correctly evaluate standard C3 Skill, C5 Burst archetype (Hu Tao)', () => {
    expect(evaluateTalentBoosts(10000046, 3)).toEqual({ normal: false, skill: true, burst: false });
    expect(evaluateTalentBoosts(10000046, 4)).toEqual({ normal: false, skill: true, burst: false });
    expect(evaluateTalentBoosts(10000046, 5)).toEqual({ normal: false, skill: true, burst: true });
    expect(evaluateTalentBoosts(10000046, 6)).toEqual({ normal: false, skill: true, burst: true });
  });

  it('should correctly evaluate standard C3 Burst, C5 Skill archetype (Raiden Shogun)', () => {
    expect(evaluateTalentBoosts(10000052, 3)).toEqual({ normal: false, skill: false, burst: true });
    expect(evaluateTalentBoosts(10000052, 4)).toEqual({ normal: false, skill: false, burst: true });
    expect(evaluateTalentBoosts(10000052, 5)).toEqual({ normal: false, skill: true, burst: true });
    expect(evaluateTalentBoosts(10000052, 6)).toEqual({ normal: false, skill: true, burst: true });
  });

  it('should correctly evaluate Fontaine Normal Attack boosters (Neuvillette)', () => {
    expect(evaluateTalentBoosts(10000087, 3)).toEqual({ normal: true, skill: false, burst: false });
    expect(evaluateTalentBoosts(10000087, 5)).toEqual({ normal: true, skill: false, burst: true });
  });

  it('should correctly evaluate Fontaine Normal Attack boosters (Arlecchino)', () => {
    expect(evaluateTalentBoosts(10000096, 3)).toEqual({ normal: true, skill: false, burst: false });
    expect(evaluateTalentBoosts(10000096, 5)).toEqual({ normal: true, skill: false, burst: true });
  });

  it('should correctly evaluate Xianyun (10000093) as C3 Burst, C5 Skill', () => {
    expect(evaluateTalentBoosts(10000093, 3)).toEqual({ normal: false, skill: false, burst: true });
    expect(evaluateTalentBoosts(10000093, 5)).toEqual({ normal: false, skill: true, burst: true });
  });

  it('should correctly evaluate other Fontaine/Natlan Normal Attack boosters (Lyney, Wriothesley, Sethos)', () => {
    // Lyney
    expect(evaluateTalentBoosts(10000084, 3)).toEqual({ normal: true, skill: false, burst: false });
    // Wriothesley
    expect(evaluateTalentBoosts(10000086, 3)).toEqual({ normal: true, skill: false, burst: false });
    // Sethos
    expect(evaluateTalentBoosts(10000097, 3)).toEqual({ normal: true, skill: false, burst: false });
  });

  it('should handle Varesa (10000105) at C1 (all false) and C3 (skill true)', () => {
    expect(evaluateTalentBoosts(10000105, 1)).toEqual({ normal: false, skill: false, burst: false });
    expect(evaluateTalentBoosts(10000105, 3)).toEqual({ normal: false, skill: true, burst: false });
    expect(evaluateTalentBoosts(10000105, 5)).toEqual({ normal: false, skill: true, burst: true });
  });

  it('should handle Aloy without crashing (always all false regardless of constellation value)', () => {
    expect(evaluateTalentBoosts(10000062, 0)).toEqual({ normal: false, skill: false, burst: false });
    expect(evaluateTalentBoosts(10000062, 3)).toEqual({ normal: false, skill: false, burst: false });
    expect(evaluateTalentBoosts(10000062, 6)).toEqual({ normal: false, skill: false, burst: false });
  });

  it('should handle unmapped characters by defaulting to C3 Skill, C5 Burst', () => {
    expect(evaluateTalentBoosts(99999999, 3)).toEqual({ normal: false, skill: true, burst: false });
    expect(evaluateTalentBoosts(99999999, 5)).toEqual({ normal: false, skill: true, burst: true });
  });

  it('should correctly attribute Ayaka talents using skillOrder instead of naive key sort', () => {
    // Ayaka: avatarId 10000002, skillOrder: [10024, 10018, 10019]
    // 10024 is Normal Attack, 10018 is Skill, 10019 is Burst, 10023 is Alternate Sprint
    const ayakaMockResponse = {
      playerInfo: { nickname: 'AyakaTester', level: 60 },
      ttl: 300,
      uid: '1234567890',
      avatarInfoList: [
        {
          avatarId: 10000002,
          propMap: { '4001': { type: 4001, val: '90' } },
          talentIdList: [21, 22, 23], // C3 -> Burst boosted
          fightPropMap: { '2000': 20000, '2001': 2000, '2002': 800 },
          skillDepotId: 201,
          skillLevelMap: {
            '10024': 9,  // Normal Attack
            '10018': 8,  // Skill
            '10019': 10, // Burst
            '10023': 1,  // Alternate Sprint
          },
          equipList: [
            {
              itemId: 11507, // Mistsplitter Reforged
              weapon: { level: 90, promoteLevel: 6, affixMap: { '111507': 0 } },
              flat: {
                nameTextMapHash: 'Mistsplitter Reforged',
                rankLevel: 5,
                itemType: 'ITEM_WEAPON',
                icon: 'UI_EquipIcon_Sword_Narukami',
                weaponStats: [{ appendPropId: 'FIGHT_PROP_BASE_ATTACK', statValue: 674 }],
              },
            },
          ],
          fetterInfo: { expLevel: 10 },
        },
      ],
    };

    const parsed = parseEnkaResponse(ayakaMockResponse);
    const ayaka = parsed.characters[0];

    // Verify Ayaka talents were correctly resolved from skillOrder:
    expect(ayaka.talents.normal).toBe(9);
    expect(ayaka.talents.skill).toBe(8);
    expect(ayaka.talents.burst).toBe(10);

    // Verify C3 talent boost logic: Burst is boosted for Ayaka at C3
    expect(ayaka.talents.boosted).toEqual({
      normal: false,
      skill: false,
      burst: true,
    });

    // Verify Mistsplitter weapon passive was attached
    expect(ayaka.weapon.passiveName).toBe("Mistsplitter's Edge");
    expect(ayaka.weapon.passiveDescription).toContain("Mistsplitter's Emblem stacks");
  });
});
