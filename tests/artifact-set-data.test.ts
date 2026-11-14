/// <reference types="vitest/globals" />
import {
  getArtifactSetBonus,
  getArtifactSetBonusByName,
  getArtifactSetDetails,
  getArtifactSetName,
  getActiveArtifactSetBonuses,
  ARTIFACT_SET_DATA,
  ARTIFACT_SET_LIST,
} from '../src/lib/enka/artifact-set-data';

describe('Artifact Set Skills Module', () => {
  it('resolves canonical Natlan sets with full 2pc and 4pc descriptions', () => {
    const obsidian = getArtifactSetBonus(15038);
    expect(obsidian).toBeDefined();
    expect(obsidian?.name).toBe('Obsidian Codex');
    expect(obsidian?.twoPiece).toContain('Nightsoul');
    expect(obsidian?.twoPiece).toContain('15%');
    expect(obsidian?.fourPiece).toContain('CRIT Rate increases by 40%');

    const cinder = getArtifactSetBonus(15037);
    expect(cinder).toBeDefined();
    expect(cinder?.name).toBe('Scroll of the Hero of Cinder City');
    expect(cinder?.twoPiece).toContain('Nightsoul Burst');
    expect(cinder?.fourPiece).toContain('12% Elemental DMG Bonus');
    expect(cinder?.fourPiece).toContain('additional 28% Elemental DMG Bonus');
  });

  it('resolves legacy and icon alias IDs', () => {
    // Emblem of Severed Fate icon ID 15008
    const emblemByIcon = getArtifactSetBonus(15008);
    expect(emblemByIcon?.name).toBe('Emblem of Severed Fate');
    expect(emblemByIcon?.twoPiece).toBe('Energy Recharge +20%.');
    expect(emblemByIcon?.fourPiece).toContain('maximum of 75% bonus DMG');

    // Crimson Witch icon ID 15005
    const witch = getArtifactSetBonus(15005);
    expect(witch?.name).toBe('Crimson Witch of Flames');
    expect(witch?.twoPiece).toBe('Pyro DMG Bonus +15%.');
    expect(witch?.fourPiece).toContain('Overloaded, Burning, and Burgeon DMG by 40%');

    // Golden Troupe alias 15020 vs 15032
    const golden = getArtifactSetBonus(15020);
    expect(golden?.name).toBe('Golden Troupe');
    expect(golden?.twoPiece).toBe('Increases Elemental Skill DMG by 20%.');

    // Marechaussee Hunter alias 15021 vs 15031
    const mare = getArtifactSetBonus(15021);
    expect(mare?.name).toBe('Marechaussee Hunter');
    expect(mare?.twoPiece).toBe('Normal and Charged Attack DMG +15%.');

    // Obsidian Codex alias 15025
    const codexAlias = getArtifactSetBonus(15025);
    expect(codexAlias?.name).toBe('Obsidian Codex');
  });

  it('performs case-insensitive and punctuation-tolerant name lookup', () => {
    const shimenawa = getArtifactSetBonusByName("shimenawas reminiscence");
    expect(shimenawa?.name).toBe("Shimenawa's Reminiscence");
    expect(shimenawa?.twoPiece).toBe('ATK +18%.');

    const gladiators = getArtifactSetBonusByName('Gladiators Finale');
    expect(gladiators?.name).toBe("Gladiator's Finale");
    expect(gladiators?.fourPiece).toContain('increases their Normal Attack DMG by 35%');

    const viridescent = getArtifactSetBonusByName('viridescent venerer');
    expect(viridescent?.name).toBe('Viridescent Venerer');
    expect(viridescent?.fourPiece).toContain('Swirl DMG by 60%');
  });

  it('calculates active set bonuses correctly for 2pc+2pc+1off build', () => {
    const counts = {
      15031: 2, // 2pc Marechaussee
      15032: 2, // 2pc Golden Troupe
      15005: 1, // 1pc off-piece Crimson Witch
    };

    const active = getActiveArtifactSetBonuses(counts);
    expect(active).toHaveLength(2);

    const mare = active.find((a) => a.setName === 'Marechaussee Hunter');
    expect(mare?.twoPieceActive).toBe(true);
    expect(mare?.fourPieceActive).toBe(false);
    expect(mare?.twoPieceText).toBeDefined();
    expect(mare?.fourPieceText).toBeUndefined();

    const golden = active.find((a) => a.setName === 'Golden Troupe');
    expect(golden?.twoPieceActive).toBe(true);
    expect(golden?.fourPieceActive).toBe(false);
  });

  it('calculates 4pc set bonus for 4pc+1off build', () => {
    const counts = {
      15038: 4, // 4pc Obsidian Codex
      15006: 1, // 1pc off-piece
    };

    const active = getActiveArtifactSetBonuses(counts);
    expect(active).toHaveLength(1);
    expect(active[0].setName).toBe('Obsidian Codex');
    expect(active[0].twoPieceActive).toBe(true);
    expect(active[0].fourPieceActive).toBe(true);
    expect(active[0].twoPieceText).toBeDefined();
    expect(active[0].fourPieceText).toBeDefined();
  });

  it('handles 1-piece Circlet Tiara sets', () => {
    const tiara = getArtifactSetBonus(15000);
    expect(tiara).toBeDefined();
    expect(tiara?.name).toBe('Prayers for Illumination');
    expect(tiara?.twoPiece).toContain('Affected by Pyro for 40% less time.');
  });

  it('handles classic 4-star sets like Instructor and The Exile', () => {
    const instructor = getArtifactSetBonus(10007);
    expect(instructor?.name).toBe('Instructor');
    expect(instructor?.twoPiece).toContain('Elemental Mastery by 80');

    const exile = getArtifactSetBonus(10009);
    expect(exile?.name).toBe('The Exile');
    expect(exile?.fourPiece).toContain('regenerates 2 Energy');
  });

  it('returns undefined for non-existent set IDs without throwing', () => {
    expect(getArtifactSetBonus(9999999)).toBeUndefined();
    expect(getArtifactSetBonusByName('Nonexistent Set Name')).toBeUndefined();
    expect(getArtifactSetDetails(9999999)).toBeUndefined();
    expect(getArtifactSetName(9999999)).toBeUndefined();
  });

  it('contains at least 50 artifact set definitions in catalog', () => {
    expect(ARTIFACT_SET_LIST.length).toBeGreaterThanOrEqual(50);
  });

  it('should verify Thundersoother 4pc description references Electro instead of Pyro', () => {
    const ts = getArtifactSetBonus(15013);
    expect(ts).toBeDefined();
    expect(ts?.name).toBe('Thundersoother');
    expect(ts?.fourPiece).toContain('affected by Electro by 35%');
    expect(ts?.fourPiece).not.toContain('Pyro');
  });
});
