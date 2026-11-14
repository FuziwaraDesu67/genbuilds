/// <reference types="vitest/globals" />
import {
  getArtifactSetBonus,
  getArtifactSetBonusByName,
  getArtifactSetDetails,
  getArtifactSetName,
  getActiveArtifactSetBonuses,
  ARTIFACT_SET_LIST,
  ARTIFACT_SET_DATA,
} from '../src/lib/enka/artifact-set-data';
import {
  getWeaponPassive,
  getWeaponMetadata,
  WEAPON_LIST,
  WEAPON_DATA,
} from '../src/lib/enka/weapon-data';
import { evaluateTalentBoosts } from '../src/lib/enka/talent-boost-data';
import { parseEnkaResponse } from '../src/lib/enka/parser';

describe('Adversarial Stress Suite: Artifact Set Metadata', () => {
  describe('Malformed & Unknown Artifact Set IDs', () => {
    const malformedIds = [
      99999,
      99999999,
      -1,
      -999,
      0,
      NaN,
      Infinity,
      -Infinity,
      3.14159,
      15038.99,
    ];

    malformedIds.forEach((id) => {
      it(`handles malformed/unknown ID (${id}) in getArtifactSetBonus without throwing`, () => {
        expect(() => getArtifactSetBonus(id)).not.toThrow();
        const res = getArtifactSetBonus(id);
        expect(res).toBeUndefined();
      });

      it(`handles malformed/unknown ID (${id}) in getArtifactSetDetails without throwing`, () => {
        expect(() => getArtifactSetDetails(id)).not.toThrow();
        const res = getArtifactSetDetails(id);
        expect(res).toBeUndefined();
      });

      it(`handles malformed/unknown ID (${id}) in getArtifactSetName without throwing`, () => {
        expect(() => getArtifactSetName(id)).not.toThrow();
        const res = getArtifactSetName(id);
        expect(res).toBeUndefined();
      });
    });

    it('handles non-numeric string IDs and malicious strings gracefully', () => {
      const maliciousStrings = [
        '',
        '   ',
        'undefined',
        'null',
        '[object Object]',
        '<script>alert("xss")</script>',
        "'; DROP TABLE artifacts; --",
        'NaN',
        '-1',
        '999999999',
      ];

      maliciousStrings.forEach((str) => {
        expect(() => getArtifactSetBonus(str)).not.toThrow();
        expect(getArtifactSetBonus(str)).toBeUndefined();

        expect(() => getArtifactSetBonusByName(str)).not.toThrow();
        expect(getArtifactSetBonusByName(str)).toBeUndefined();
      });
    });

    it('resolves valid set even when malformed ID is paired with valid set name', () => {
      // getArtifactSetBonus should prioritize setName collision resolution
      const res = getArtifactSetBonus(99999, 'Obsidian Codex');
      expect(res).toBeDefined();
      expect(res?.name).toBe('Obsidian Codex');
      expect(res?.twoPiece).toContain('Nightsoul');

      const details = getArtifactSetDetails(-1, 'Golden Troupe');
      expect(details).toBeDefined();
      expect(details?.name).toBe('Golden Troupe');
    });

    it('stress-tests getActiveArtifactSetBonuses with adversarial counts and IDs', () => {
      const adversarialSets: Record<string, number> = {
        '99999': 4,
        '-1': 2,
        '0': 2,
        'NaN': 2,
        'invalid_key': 3,
        '15038': -5,        // Negative count -> should ignore
        '15037': 0,         // Zero count -> should ignore
        '15032': 1,         // Off-piece -> should ignore
        '15031': 2,         // Valid 2pc
        '15008': 5,         // Valid 4pc (oversaturated 5pc)
      };

      expect(() => getActiveArtifactSetBonuses(adversarialSets)).not.toThrow();
      const active = getActiveArtifactSetBonuses(adversarialSets);

      // Should only include sets with count >= 2
      const set38 = active.find((a) => a.setId === 15038);
      const set37 = active.find((a) => a.setId === 15037);
      const set32 = active.find((a) => a.setId === 15032);
      expect(set38).toBeUndefined();
      expect(set37).toBeUndefined();
      expect(set32).toBeUndefined();

      // Valid sets
      const mare = active.find((a) => a.setId === 15031);
      expect(mare).toBeDefined();
      expect(mare?.twoPieceActive).toBe(true);
      expect(mare?.fourPieceActive).toBe(false);

      const emblem = active.find((a) => a.setId === 15008);
      expect(emblem).toBeDefined();
      expect(emblem?.twoPieceActive).toBe(true);
      expect(emblem?.fourPieceActive).toBe(true);

      // Malformed sets should have safe fallback names and not crash
      const unknown99 = active.find((a) => a.setId === 99999);
      expect(unknown99).toBeDefined();
      expect(unknown99?.name).toBe('Set #99999');
      expect(unknown99?.twoPieceActive).toBe(true);
      expect(unknown99?.fourPieceActive).toBe(true);
      expect(unknown99?.twoPieceText).toBeUndefined();
    });
  });

  describe('Case-Insensitive & Punctuation-Tolerant Set Name Lookups', () => {
    const testCases = [
      {
        input: 'crimson witch of flames',
        expectedName: 'Crimson Witch of Flames',
        twoPieceCheck: 'Pyro DMG Bonus +15%',
      },
      {
        input: 'CRIMSON WITCH OF FLAMES',
        expectedName: 'Crimson Witch of Flames',
        twoPieceCheck: 'Pyro DMG Bonus +15%',
      },
      {
        input: "GLADIATOR'S FINALE",
        expectedName: "Gladiator's Finale",
        twoPieceCheck: 'ATK +18%',
      },
      {
        input: 'gladiators finale',
        expectedName: "Gladiator's Finale",
        twoPieceCheck: 'ATK +18%',
      },
      {
        input: "   Shimenawa's    Reminiscence   ",
        expectedName: "Shimenawa's Reminiscence",
        twoPieceCheck: 'ATK +18%',
      },
      {
        input: 'shimenawas-reminiscence',
        expectedName: "Shimenawa's Reminiscence",
        twoPieceCheck: 'ATK +18%',
      },
      {
        input: 'viriDescent  venErEr!?',
        expectedName: 'Viridescent Venerer',
        twoPieceCheck: 'Anemo DMG Bonus +15%',
      },
      {
        input: "nymphs_dream",
        expectedName: "Nymph's Dream",
        twoPieceCheck: 'Hydro DMG Bonus +15%',
      },
      {
        input: "VOURUKASHA'S GLOW",
        expectedName: "Vourukasha's Glow",
        twoPieceCheck: 'HP +20%',
      },
      {
        input: 'ocean-hued clam',
        expectedName: 'Ocean-Hued Clam',
        twoPieceCheck: 'Healing Bonus +15%',
      },
      {
        input: 'scroll of the hero of cinder city',
        expectedName: 'Scroll of the Hero of Cinder City',
        twoPieceCheck: 'Nightsoul Burst',
      },
      {
        input: 'FRAGMENT OF HARMONIC WHIMSY',
        expectedName: 'Fragment of Harmonic Whimsy',
        twoPieceCheck: 'ATK +18%',
      },
      {
        input: 'Gladiator\u2019s Finale', // Curly right single quotation mark
        expectedName: "Gladiator's Finale",
        twoPieceCheck: 'ATK +18%',
      },
      {
        input: 'Nymph\u2019s Dream', // Curly apostrophe
        expectedName: "Nymph's Dream",
        twoPieceCheck: 'Hydro DMG Bonus +15%',
      },
      {
        input: 'Ocean\u2014Hued Clam', // Em-dash
        expectedName: 'Ocean-Hued Clam',
        twoPieceCheck: 'Healing Bonus +15%',
      },
      {
        input: 'Golden\u00A0Troupe', // Non-breaking space
        expectedName: 'Golden Troupe',
        twoPieceCheck: 'Elemental Skill DMG by 20%',
      },
    ];

    testCases.forEach(({ input, expectedName, twoPieceCheck }) => {
      it(`resolves "${input}" -> "${expectedName}"`, () => {
        const bonus = getArtifactSetBonusByName(input);
        expect(bonus).toBeDefined();
        expect(bonus?.name).toBe(expectedName);
        expect(bonus?.twoPiece).toContain(twoPieceCheck);

        // Also test getArtifactSetBonus directly
        const direct = getArtifactSetBonus(input);
        expect(direct).toBeDefined();
        expect(direct?.name).toBe(expectedName);
      });
    });

    it('exhaustively verifies all catalog sets resolve under lowercase, uppercase, and stripped punctuation', () => {
      for (const set of ARTIFACT_SET_LIST) {
        // Lowercase lookup
        const lower = getArtifactSetBonusByName(set.name.toLowerCase());
        expect(lower, `Lowercase lookup failed for ${set.name}`).toBeDefined();
        expect(lower?.name).toBe(set.name);

        // Uppercase lookup
        const upper = getArtifactSetBonusByName(set.name.toUpperCase());
        expect(upper, `Uppercase lookup failed for ${set.name}`).toBeDefined();
        expect(upper?.name).toBe(set.name);

        // Stripped punctuation lookup
        const stripped = getArtifactSetBonusByName(set.name.replace(/[^a-zA-Z0-9 ]/g, ''));
        expect(stripped, `Stripped lookup failed for ${set.name}`).toBeDefined();
        expect(stripped?.name).toBe(set.name);
      }
    });

    it('checks for ID and alias collisions across artifact set definitions', () => {
      const seenIds = new Map<number, string>();
      const collisions: string[] = [];

      for (const set of ARTIFACT_SET_LIST) {
        if (seenIds.has(set.id)) {
          collisions.push(`Primary ID collision: ${set.id} used by "${seenIds.get(set.id)}" and "${set.name}"`);
        } else {
          seenIds.set(set.id, set.name);
        }

        if (set.aliases) {
          for (const aliasId of set.aliases) {
            if (seenIds.has(aliasId)) {
              collisions.push(`Alias collision: ${aliasId} (alias for "${set.name}") already used by "${seenIds.get(aliasId)}"`);
            } else {
              seenIds.set(aliasId, `${set.name} (alias)`);
            }
          }
        }
      }

      // Record any detected collisions
      expect(collisions, `Detected collisions in ARTIFACT_SET_LIST: ${collisions.join('; ')}`).toEqual([]);
    });

    it('demonstrates that alias collision causes Unfinished Reverie alias 15029 to misresolve as Nymph\'s Dream', () => {
      // In ARTIFACT_SET_LIST, 15029 is declared as an alias for Unfinished Reverie,
      // but also defined as the primary ID of Nymph's Dream.
      // Because Nymph's Dream overwrites ARTIFACT_SET_DATA[15029], Unfinished Reverie cannot be resolved by 15029.
      const res = getArtifactSetBonus(15029);
      expect(res?.name).toBe("Nymph's Dream");
    });
  });

  describe('1-Piece Tiaras vs 2pc/4pc Sets', () => {
    const tiaraSets = [
      { id: 150110, name: 'Prayers for Destiny', element: 'Hydro' },
      { id: 15000, name: 'Prayers for Illumination', element: 'Pyro' },
      { id: 150090, name: 'Prayers for Wisdom', element: 'Electro' },
      { id: 150131, name: 'Prayers to Springtime', element: 'Cryo' },
    ];

    tiaraSets.forEach(({ id, name, element }) => {
      it(`resolves 1-piece Tiara ${name} via ID (${id}) and normalized name`, () => {
        const byId = getArtifactSetBonus(id);
        expect(byId).toBeDefined();
        expect(byId?.name).toBe(name);
        expect(byId?.twoPiece).toContain(`Affected by ${element} for 40% less time.`);
        // Tiaras do NOT have a 4-piece bonus in game or catalog
        expect(byId?.fourPiece).toBeUndefined();

        const byName = getArtifactSetBonusByName(name);
        expect(byName).toBeDefined();
        expect(byName?.name).toBe(name);
        expect(byName?.twoPiece).toContain(`Affected by ${element} for 40% less time.`);
        expect(byName?.fourPiece).toBeUndefined();

        const details = getArtifactSetDetails(id);
        expect(details).toBeDefined();
        expect(details?.onePiece).toContain(`Affected by ${element} for 40% less time.`);
        expect(details?.fourPiece).toBe('');
      });
    });

    it('differentiates 1-piece Tiaras from 2pc/4pc standard sets', () => {
      // Standard set: Crimson Witch of Flames (15005)
      const witch = getArtifactSetBonus(15005);
      expect(witch?.twoPiece).toBeDefined();
      expect(witch?.fourPiece).toBeDefined();
      const witchDetails = getArtifactSetDetails(15005);
      expect(witchDetails?.onePiece).toBeUndefined();
      expect(witchDetails?.fourPiece).not.toBe('');

      // Tiara set: Prayers for Illumination (15000)
      const tiara = getArtifactSetBonus(15000);
      expect(tiara?.twoPiece).toBeDefined();
      expect(tiara?.fourPiece).toBeUndefined(); // Tiara has no 4pc bonus
      const tiaraDetails = getArtifactSetDetails(15000);
      expect(tiaraDetails?.onePiece).toBeDefined();
      expect(tiaraDetails?.fourPiece).toBe('');
    });
  });
});

describe('Adversarial Stress Suite: Weapon Metadata', () => {
  describe('Refinement Clamping Boundaries', () => {
    const extremeRefinements = [
      { r: 0, expectedR: 1, label: 'zero (0)' },
      { r: -1, expectedR: 1, label: 'negative (-1)' },
      { r: -5, expectedR: 1, label: 'negative (-5)' },
      { r: -999, expectedR: 1, label: 'extreme negative (-999)' },
      { r: 1, expectedR: 1, label: 'standard R1' },
      { r: 2, expectedR: 2, label: 'standard R2' },
      { r: 3, expectedR: 3, label: 'standard R3' },
      { r: 4, expectedR: 4, label: 'standard R4' },
      { r: 5, expectedR: 5, label: 'standard R5' },
      { r: 6, expectedR: 5, label: 'upper overflow (6)' },
      { r: 10, expectedR: 5, label: 'upper overflow (10)' },
      { r: 99, expectedR: 5, label: 'extreme upper overflow (99)' },
      { r: 9999, expectedR: 5, label: 'massive upper overflow (9999)' },
      { r: NaN, expectedR: 1, label: 'NaN' },
    ];

    it('clamps refinement across extreme values for Staff of Homa (11510)', () => {
      const r1Expected = 'HP increased by 20%';
      const r5Expected = 'HP increased by 40%';

      extremeRefinements.forEach(({ r, expectedR, label }) => {
        const passive = getWeaponPassive(11510, r);
        expect(passive.passiveName).toBe('Reckless Cinnabar');
        if (expectedR === 1) {
          expect(passive.passiveDescription, `Failed for ${label}`).toContain(r1Expected);
        } else if (expectedR === 5) {
          expect(passive.passiveDescription, `Failed for ${label}`).toContain(r5Expected);
        }
      });
    });

    it('clamps refinement across extreme values for The Catch (11415)', () => {
      const r1Expected = 'Burst DMG by 16%';
      const r5Expected = 'Burst DMG by 32%';

      extremeRefinements.forEach(({ r, expectedR, label }) => {
        const passive = getWeaponPassive(11415, r);
        expect(passive.passiveName).toBe('Shanty');
        if (expectedR === 1) {
          expect(passive.passiveDescription, `Failed for ${label}`).toContain(r1Expected);
        } else if (expectedR === 5) {
          expect(passive.passiveDescription, `Failed for ${label}`).toContain(r5Expected);
        }
      });
    });

    it('clamps refinement across extreme values for The Widsith (14402)', () => {
      const r1Expected = 'ATK is increased by 60%';
      const r5Expected = 'ATK is increased by 120%';

      extremeRefinements.forEach(({ r, expectedR, label }) => {
        const passive = getWeaponPassive(14402, r);
        expect(passive.passiveName).toBe('Debut');
        if (expectedR === 1) {
          expect(passive.passiveDescription, `Failed for ${label}`).toContain(r1Expected);
        } else if (expectedR === 5) {
          expect(passive.passiveDescription, `Failed for ${label}`).toContain(r5Expected);
        }
      });
    });

    it('handles floating-point refinement gracefully without throwing', () => {
      expect(() => getWeaponPassive(11510, 3.7)).not.toThrow();
      const res = getWeaponPassive(11510, 3.7);
      expect(res.passiveName).toBe('Reckless Cinnabar');
      expect(res.passiveDescription).toBeDefined();
    });

    it('handles undefined/null refinement gracefully', () => {
      expect(() => getWeaponPassive(11510, undefined)).not.toThrow();
      const resUndef = getWeaponPassive(11510, undefined);
      expect(resUndef.passiveDescription).toContain('HP increased by 20%');

      expect(() => getWeaponPassive(11510, null as any)).not.toThrow();
      const resNull = getWeaponPassive(11510, null as any);
      expect(resNull.passiveDescription).toContain('HP increased by 20%');
    });

    it('exhaustively verifies all catalog weapons clamp refinement (-10 -> R1, 99 -> R5) and resolve by name', () => {
      for (const weapon of WEAPON_LIST) {
        // Clamping negative to R1
        const rNeg = getWeaponPassive(weapon.id, -10);
        expect(rNeg.passiveName, `Missing passiveName for ${weapon.name}`).toBe(weapon.passiveName);
        expect(rNeg.passiveDescription, `Missing clamped passiveDescription for ${weapon.name}`).toBeDefined();
        expect(rNeg.passiveDescription?.length).toBeGreaterThan(0);

        // Clamping overflow to R5
        const rOver = getWeaponPassive(weapon.id, 99);
        expect(rOver.passiveName).toBe(weapon.passiveName);
        expect(rOver.passiveDescription).toBeDefined();
        expect(rOver.passiveDescription?.length).toBeGreaterThan(0);

        // Lowercase name lookup
        const byLower = getWeaponPassive(weapon.name.toLowerCase(), 1);
        expect(byLower.passiveName, `Failed lowercase lookup for ${weapon.name}`).toBe(weapon.passiveName);

        // Uppercase name lookup
        const byUpper = getWeaponPassive(weapon.name.toUpperCase(), 1);
        expect(byUpper.passiveName, `Failed uppercase lookup for ${weapon.name}`).toBe(weapon.passiveName);

        // Metadata lookup
        const meta = getWeaponMetadata(weapon.id);
        expect(meta, `getWeaponMetadata failed for ${weapon.id}`).toBeDefined();
        expect(meta?.name).toBe(weapon.name);
      }
    });

    it('checks for ID collisions in WEAPON_LIST', () => {
      const seenWeaponIds = new Map<number, string>();
      const weaponCollisions: string[] = [];

      for (const weapon of WEAPON_LIST) {
        if (seenWeaponIds.has(weapon.id)) {
          weaponCollisions.push(`Weapon primary ID collision: ${weapon.id} used by "${seenWeaponIds.get(weapon.id)}" and "${weapon.name}"`);
        } else {
          seenWeaponIds.set(weapon.id, weapon.name);
        }
      }

      expect(weaponCollisions, `Detected weapon ID collisions: ${weaponCollisions.join('; ')}`).toEqual([]);
    });
  });

  describe('Unknown Weapon IDs Falling Back Gracefully', () => {
    const unknownIds = [
      99999,
      99999999,
      -1,
      -50,
      0,
      NaN,
      Infinity,
      -Infinity,
    ];

    unknownIds.forEach((id) => {
      it(`returns empty object for unknown weapon ID (${id}) without throwing`, () => {
        expect(() => getWeaponPassive(id, 1)).not.toThrow();
        const res = getWeaponPassive(id, 1);
        expect(res).toEqual({});

        expect(() => getWeaponMetadata(id)).not.toThrow();
        expect(getWeaponMetadata(id)).toBeUndefined();
      });
    });

    it('returns empty object for unknown weapon names without throwing', () => {
      const unknownNames = [
        '',
        '   ',
        'Excalibur',
        'Buster Sword',
        'Master Sword',
        '<unknown>',
        'undefined',
        'null',
      ];

      unknownNames.forEach((name) => {
        expect(() => getWeaponPassive(name, 1)).not.toThrow();
        expect(getWeaponPassive(name, 1)).toEqual({});

        expect(() => getWeaponMetadata(name)).not.toThrow();
        expect(getWeaponMetadata(name)).toBeUndefined();
      });
    });
  });
});

describe('Adversarial Stress Suite: Full Parser End-to-End Resilience', () => {
  it('parses raw character payload with unknown weapon and unknown artifact sets without throwing', () => {
    const rawPayload: any = {
      avatarId: 10000046, // Hu Tao
      propMap: {
        '4001': { type: 1001, val: '90' },
      },
      fightPropMap: {
        '10000': 15552,
        '2000': 15552,
        '2001': 1065,
        '2002': 876,
        '28': 100,
        '20': 0.65,
        '22': 1.80,
        '23': 1.15,
      },
      skillLevelMap: {
        '10461': 10,
        '10462': 10,
        '10463': 10,
      },
      equipList: [
        // Unknown weapon with refinement 99
        {
          itemId: 99999,
          weapon: {
            level: 90,
            promoteLevel: 6,
            affixMap: { '199999': 98 }, // 98 + 1 = 99 (extreme refinement)
          },
          flat: {
            nameTextMapHash: 'Unknown Weapon',
            rankLevel: 5,
            itemType: 'ITEM_WEAPON',
            icon: 'UI_EquipIcon_Sword_Unknown',
            weaponStats: [
              { appendPropId: 'FIGHT_PROP_BASE_ATTACK', statValue: 510 },
            ],
          },
        },
        // Artifact with unknown set ID 99999
        {
          itemId: 88881,
          reliquary: { level: 21, mainPropId: 10001 },
          flat: {
            nameTextMapHash: 'Unknown Flower',
            setNameTextMapHash: 'Unknown Set',
            rankLevel: 5,
            itemType: 'ITEM_RELIQUARY',
            equipType: 'EQUIP_BRACER',
            icon: 'UI_RelicIcon_99999_4',
            reliquaryMainstat: { mainPropId: 'FIGHT_PROP_HP', statValue: 4780 },
            reliquarySubstats: [
              { appendPropId: 'FIGHT_PROP_CRITICAL', statValue: 0.105 },
            ],
          },
        },
        // Artifact with another unknown set ID -1
        {
          itemId: 88882,
          reliquary: { level: 21, mainPropId: 10002 },
          flat: {
            nameTextMapHash: 'Unknown Plume',
            setNameTextMapHash: 'Unknown Set 2',
            rankLevel: 5,
            itemType: 'ITEM_RELIQUARY',
            equipType: 'EQUIP_NECKLACE',
            icon: 'UI_RelicIcon_-1_4',
            reliquaryMainstat: { mainPropId: 'FIGHT_PROP_ATTACK', statValue: 311 },
          },
        },
      ],
    };

    const enkaPayload = {
      playerInfo: { nickname: 'Traveler', level: 60 },
      avatarInfoList: [rawPayload],
    };

    expect(() => parseEnkaResponse(enkaPayload as any)).not.toThrow();
    const result = parseEnkaResponse(enkaPayload as any);
    const character = result.characters[0];

    expect(character.id).toBe(10000046);
    expect(character.name).toBe('Hu Tao');
    expect(character.weapon.id).toBe(99999);
    expect(character.weapon.refinement).toBe(99);
    expect(character.weapon.passiveName).toBeUndefined();
    expect(character.weapon.passiveDescription).toBeUndefined();

    expect(character.artifacts).toHaveLength(2);
    expect(character.artifacts[0].setId).toBe(99999);
    expect(character.artifacts[0].setBonusText).toBeUndefined();
    expect(character.artifacts[1].setId).toBe(-1);
    expect(character.artifacts[1].setBonusText).toBeUndefined();
  });

  it('evaluates constellation talent boosts safely for negative/extreme constellations and unknown characters', () => {
    // Negative constellation
    const neg = evaluateTalentBoosts(10000046, -1);
    expect(neg).toEqual({ normal: false, skill: false, burst: false });

    // Aloy (10000062) locked at C0 even if passed C6
    const aloy = evaluateTalentBoosts(10000062, 6);
    expect(aloy).toEqual({ normal: false, skill: false, burst: false });

    // Unknown character ID defaults safely to { c3: 'skill', c5: 'burst' }
    const unknownC3 = evaluateTalentBoosts(9999999, 3);
    expect(unknownC3).toEqual({ normal: false, skill: true, burst: false });

    const unknownC6 = evaluateTalentBoosts(9999999, 6);
    expect(unknownC6).toEqual({ normal: false, skill: true, burst: true });
  });
});
