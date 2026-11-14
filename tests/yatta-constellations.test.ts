import { describe, it, expect } from 'vitest';
import {
  getConstellationDetail,
  getConstellationRoman,
  stripConstellationTags,
} from '@/lib/enka/constellation-data';

describe('Authoritative Yatta Constellation Scraper & Lookup Engine', () => {
  it('correctly resolves Chevreuse (10000090) C1 matching official in-game text', () => {
    const c1 = getConstellationDetail('10000090', 'Chevreuse', 1);
    expect(c1.level).toBe(1);
    expect(c1.name).toBe("Stable Front Line's Resolve");
    expect(c1.description).toContain('Coordinated Tactics');
    expect(c1.description).toContain('6 Energy');
    expect(c1.icon).toBe('UI_Talent_S_Chevreuse_01');
  });

  it('correctly resolves Chasca (10000104) C1 matching official Akasha text', () => {
    const c1 = getConstellationDetail('10000104', 'Chasca', 1);
    expect(c1.level).toBe(1);
    expect(c1.name).toBe('Cylinder, the Restless Roulette');
    expect(c1.description).toContain('Bullet Trick');
    expect(c1.description).toContain('Shadowhunt Shell');
    expect(c1.icon).toBe('UI_Talent_S_Chasca_01');
  });

  it('correctly resolves Skirk (10000114) C1-C6 authentic constellations', () => {
    const c1 = getConstellationDetail('10000114', 'Skirk', 1);
    const c2 = getConstellationDetail('10000114', 'Skirk', 2);
    const c6 = getConstellationDetail('10000114', 'Skirk', 6);
    expect(c1.name).toBe('Far to Fall');
    expect(c2.name).toBe('Into the Abyss');
    expect(c6.name).toBe('To the Source');
  });

  it('correctly resolves Natlan archon Mavuika (10000106) constellations', () => {
    const c1 = getConstellationDetail('10000106', 'Mavuika', 1);
    const c2 = getConstellationDetail('10000106', 'Mavuika', 2);
    expect(c1.name).toBe("The Night-Lord's Explication");
    expect(c2.name).toBe('The Ashen Price');
  });

  it('correctly resolves Citlali (10000107) constellations', () => {
    const c1 = getConstellationDetail('10000107', 'Citlali', 1);
    expect(c1.name).toBe('Radiant Blades of Centzon Mimixcoah');
  });

  it('correctly resolves showcase characters: Flins, Odette, Vodyanitsa, Mitya, Vesna, Ineffa', () => {
    const flinsC1 = getConstellationDetail('10000120', 'Flins', 1);
    expect(flinsC1.name).toBe('Part the Veil of Snow');

    const ineffaC1 = getConstellationDetail('10000116', 'Ineffa', 1);
    expect(ineffaC1.name).toBe('Rectifying Processor');

    const vesnaC1 = getConstellationDetail('10000143', 'Vesna', 1);
    expect(vesnaC1.name).toBe("Winter's Farewell Feast");

    const odetteC1 = getConstellationDetail('10000150', 'Odette', 1);
    expect(odetteC1.name).toContain('On This Danceless Morn');

    const vodyanitsaC1 = getConstellationDetail('10000140', 'Vodyanitsa', 1);
    expect(vodyanitsaC1.name).toBe('Waters in Full Splendor');

    const mityaC1 = getConstellationDetail('10000136', 'Mitya', 1);
    expect(mityaC1.name).toBe('The Observer Seeking What Is Missing');
  });

  it('resolves by character name when ID is missing or non-numeric', () => {
    const chascaByName = getConstellationDetail('unknown-id', 'Chasca', 1);
    expect(chascaByName.name).toBe('Cylinder, the Restless Roulette');

    const neuvByName = getConstellationDetail(0, 'Neuvillette', 1);
    expect(neuvByName.name).toBe('Venerable Institution');
  });

  it('strips archive links and XML color tags properly with stripConstellationTags', () => {
    const raw = 'Enhances {LINK#N11130007}<color=#FFD780FF>Reason Beyond Reason</color>{/LINK} by 50%.';
    const cleaned = stripConstellationTags(raw);
    expect(cleaned).toBe('Enhances Reason Beyond Reason by 50%.');
  });

  it('provides roman numeral representations up to C6', () => {
    expect(getConstellationRoman(1)).toBe('I');
    expect(getConstellationRoman(2)).toBe('II');
    expect(getConstellationRoman(3)).toBe('III');
    expect(getConstellationRoman(4)).toBe('IV');
    expect(getConstellationRoman(5)).toBe('V');
    expect(getConstellationRoman(6)).toBe('VI');
  });
});
