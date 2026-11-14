/// <reference types="vitest/globals" />
import { parseEnkaResponse } from '../src/lib/enka/parser';
import { EnkaResponseSchema } from '../src/lib/enka/types';
import sampleResponse from './fixtures/enka-response.json';

describe('Enka Parser', () => {
  it('should validate and parse a valid Enka response', () => {
    // Validate schema
    const validated = EnkaResponseSchema.parse(sampleResponse);
    expect(validated).toBeDefined();
    expect(validated.uid).toBe('1234567890');

    // Parse to domain types
    const parsed = parseEnkaResponse(validated);

    expect(parsed.player.uid).toBe('1234567890');
    expect(parsed.player.nickname).toBe('TestPlayer');
    expect(parsed.player.level).toBe(60);
    expect(parsed.ttl).toBe(300);
    expect(parsed.characters).toHaveLength(1);
  });

  it('should correctly parse character data', () => {
    const validated = EnkaResponseSchema.parse(sampleResponse);
    const parsed = parseEnkaResponse(validated);

    const character = parsed.characters[0];

    expect(character.name).toBe('Hu Tao');
    expect(character.element).toBe('Pyro');
    expect(character.level).toBe(90);
    expect(character.constellation).toBe(6);
    expect(character.rarity).toBe(5);
  });

  it('should correctly parse character stats', () => {
    const validated = EnkaResponseSchema.parse(sampleResponse);
    const parsed = parseEnkaResponse(validated);

    const stats = parsed.characters[0].stats;

    expect(stats.hp).toBe(35558);
    expect(stats.atk).toBe(1234);
    expect(stats.def).toBe(876);
    expect(stats.em).toBe(105);
    expect(stats.cr).toBeCloseTo(91.2, 1);
    expect(stats.cd).toBeCloseTo(202.3, 1);
    expect(stats.er).toBeCloseTo(100, 1);
    expect(stats.dmgBonus.pyro).toBeCloseTo(61.6, 1);
  });

  it('should correctly parse weapon data', () => {
    const validated = EnkaResponseSchema.parse(sampleResponse);
    const parsed = parseEnkaResponse(validated);

    const weapon = parsed.characters[0].weapon;

    expect(weapon.id).toBe(11510);
    expect(weapon.level).toBe(90);
    expect(weapon.rarity).toBe(5);
    expect(weapon.refinement).toBe(1);
    expect(weapon.baseAtk).toBe(608);
    expect(weapon.subStat?.key).toBe('cd');
    expect(weapon.subStat?.value).toBeCloseTo(0.662, 3);
  });

  it('should correctly parse artifacts', () => {
    const validated = EnkaResponseSchema.parse(sampleResponse);
    const parsed = parseEnkaResponse(validated);

    const artifacts = parsed.characters[0].artifacts;

    expect(artifacts).toHaveLength(5);

    // Check flower
    const flower = artifacts.find(a => a.slot === 'flower');
    expect(flower).toBeDefined();
    expect(flower!.level).toBe(20);
    expect(flower!.rarity).toBe(5);
    expect(flower!.mainStat.key).toBe('hp');
    expect(flower!.mainStat.value).toBe(4780);
    expect(flower!.subStats).toHaveLength(4);
    // Normalized percentage substats (7.8 instead of 0.078)
    expect(flower!.subStats[0].key).toBe('cr');
    expect(flower!.subStats[0].value).toBe(7.8);
    expect(flower!.subStats[0].pips).toBeDefined();
    expect(flower!.subStats[1].key).toBe('cd');
    expect(flower!.subStats[1].value).toBe(21.8);
    // Piece CV calculation (2 * 7.8 + 21.8 = 37.4)
    expect(flower!.cv).toBe(37.4);
    expect(flower!.qualityBadge).toBe('Good');

    // Check sands with percentage main stat normalized (0.466 -> 46.6)
    const sands = artifacts.find(a => a.slot === 'sands');
    expect(sands).toBeDefined();
    expect(sands!.mainStat.key).toBe('hpPercent');
    expect(sands!.mainStat.value).toBe(46.6);

    // Check character total build CV and badge
    expect(parsed.characters[0].totalCv).toBeGreaterThan(0);
    expect(parsed.characters[0].qualityBadge).toBeDefined();
  });

  it('should correctly count artifact sets', () => {
    const validated = EnkaResponseSchema.parse(sampleResponse);
    const parsed = parseEnkaResponse(validated);

    const artifactSets = parsed.characters[0].artifactSets;

    // All 5 pieces should be Crimson Witch (set ID 15005)
    expect(artifactSets[15005]).toBe(5);
  });

  it('should correctly parse talent levels', () => {
    const validated = EnkaResponseSchema.parse(sampleResponse);
    const parsed = parseEnkaResponse(validated);

    const talents = parsed.characters[0].talents;

    expect(talents.normal).toBe(10);
    expect(talents.skill).toBe(10);
    expect(talents.burst).toBe(10);
  });

  it('should estimate substat roll counts', () => {
    const validated = EnkaResponseSchema.parse(sampleResponse);
    const parsed = parseEnkaResponse(validated);

    const artifacts = parsed.characters[0].artifacts;
    const flower = artifacts.find(a => a.slot === 'flower');

    // Check that rolls and pips are estimated
    expect(flower!.subStats[0].rolls).toBeGreaterThan(0);
    expect(flower!.subStats[0].pips).toBeDefined();
    expect(flower!.subStats[0].pips).toMatch(/^[●○★]+$/);
  });

  it('should handle missing avatarInfoList', () => {
    const emptyResponse = {
      ...sampleResponse,
      avatarInfoList: undefined,
    };

    const validated = EnkaResponseSchema.parse(emptyResponse);
    const parsed = parseEnkaResponse(validated);

    expect(parsed.characters).toHaveLength(0);
  });
});
