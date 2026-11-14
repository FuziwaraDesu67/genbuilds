/// <reference types="vitest/globals" />
import {
  getWeaponPassive,
  getWeaponMetadata,
  resolveWeaponName,
  WEAPON_LIST,
  WEAPON_DATA,
} from '../src/lib/enka/weapon-data';

describe('Weapon Data Module', () => {
  it('should return correct passive and R1 description for Staff of Homa', () => {
    const res = getWeaponPassive(11510, 1);
    expect(res.passiveName).toBe('Reckless Cinnabar');
    expect(res.passiveDescription).toContain('HP increased by 20%');
    expect(res.passiveDescription).toContain("0.8% of the wielder's Max HP");
    expect(res.passiveDescription).toContain('1% of Max HP');
  });

  it('should scale correctly to R5 for Staff of Homa', () => {
    const res = getWeaponPassive(11510, 5);
    expect(res.passiveName).toBe('Reckless Cinnabar');
    expect(res.passiveDescription).toContain('HP increased by 40%');
    expect(res.passiveDescription).toContain("1.6% of the wielder's Max HP");
    expect(res.passiveDescription).toContain('1.8% of Max HP');
  });

  it('should look up weapons by alternative ID or weapon name', () => {
    const resId = getWeaponPassive(13501, 1);
    expect(resId.passiveName).toBe('Reckless Cinnabar');

    const resName = getWeaponPassive('Staff of Homa', 1);
    expect(resName.passiveName).toBe('Reckless Cinnabar');

    const resCase = getWeaponPassive('the widsith', 1);
    expect(resCase.passiveName).toBe('Debut');
  });

  it('should verify The Widsith R1 vs R5 theme songs', () => {
    const r1 = getWeaponPassive(14402, 1);
    expect(r1.passiveName).toBe('Debut');
    expect(r1.passiveDescription).toContain('Recitative: ATK is increased by 60%');
    expect(r1.passiveDescription).toContain('Aria: Increases all Elemental DMG by 48%');
    expect(r1.passiveDescription).toContain('Interlude: Elemental Mastery is increased by 240');

    const r5 = getWeaponPassive(14402, 5);
    expect(r5.passiveDescription).toContain('Recitative: ATK is increased by 120%');
    expect(r5.passiveDescription).toContain('Aria: Increases all Elemental DMG by 96%');
    expect(r5.passiveDescription).toContain('Interlude: Elemental Mastery is increased by 480');
  });

  it('should verify The Catch R1 vs R5 Burst DMG scaling', () => {
    const r1 = getWeaponPassive(11415, 1);
    expect(r1.passiveName).toBe('Shanty');
    expect(r1.passiveDescription).toContain('Burst DMG by 16%');
    expect(r1.passiveDescription).toContain('CRIT Rate by 6%');

    const r5 = getWeaponPassive(11415, 5);
    expect(r5.passiveDescription).toContain('Burst DMG by 32%');
    expect(r5.passiveDescription).toContain('CRIT Rate by 12%');
  });

  it('should verify Engulfing Lightning R1 vs R5 ER scaling', () => {
    const r1 = getWeaponPassive(11509, 1);
    expect(r1.passiveName).toBe('Timeless Dream: Eternal Stove');
    expect(r1.passiveDescription).toContain('ATK increased by 28%');
    expect(r1.passiveDescription).toContain('maximum bonus of 80% ATK');

    const r5 = getWeaponPassive(11509, 5);
    expect(r5.passiveDescription).toContain('ATK increased by 56%');
    expect(r5.passiveDescription).toContain('maximum bonus of 120% ATK');
  });

  it('should clamp refinement levels outside 1-5', () => {
    const res0 = getWeaponPassive(11510, 0);
    expect(res0.passiveDescription).toContain('HP increased by 20%');

    const resNegative = getWeaponPassive(11510, -3);
    expect(resNegative.passiveDescription).toContain('HP increased by 20%');

    const res10 = getWeaponPassive(11510, 10);
    expect(res10.passiveDescription).toContain('HP increased by 40%');
  });

  it('should return empty object for unknown weapon ID without throwing', () => {
    const res = getWeaponPassive(999999, 1);
    expect(res).toEqual({});
  });

  it('should retrieve full metadata with getWeaponMetadata', () => {
    const meta = getWeaponMetadata(11510);
    expect(meta).toBeDefined();
    expect(meta?.name).toBe('Staff of Homa');
    expect(meta?.type).toBe('Polearm');
    expect(meta?.rarity).toBe(5);
    expect(meta?.baseAtkLv90).toBe(608);
    expect(meta?.subStat?.valueLv90).toBeCloseTo(66.2, 1);

    const metaByName = getWeaponMetadata('Mistsplitter Reforged');
    expect(metaByName).toBeDefined();
    expect(metaByName?.type).toBe('Sword');
  });

  it('contains at least 52 major weapons in the master catalog', () => {
    expect(WEAPON_LIST.length).toBeGreaterThanOrEqual(52);
  });

  it('should ensure all 57 weapons have complete, formatted R1-R5 descriptions without template braces', () => {
    WEAPON_LIST.forEach((weapon) => {
      for (let r = 1; r <= 5; r++) {
        const passive = getWeaponPassive(weapon.id, r);
        expect(passive.passiveName).toBeDefined();
        expect(passive.passiveDescription, `${weapon.name} R${r} should have description`).toBeDefined();
        expect(passive.passiveDescription, `${weapon.name} R${r} should not have '{'`).not.toContain('{');
        expect(passive.passiveDescription, `${weapon.name} R${r} should not have '}'`).not.toContain('}');
      }
    });
  });

  it('resolves Weapon 14525 as Starsealed Edict · Awakened with Catalyst stats, alias lookup, and R1-R5 passive', () => {
    const meta = getWeaponMetadata(14525);
    expect(meta).toBeDefined();
    expect(meta?.name).toBe('Starsealed Edict · Awakened');
    expect(meta?.type).toBe('Catalyst');
    expect(meta?.rarity).toBe(5);
    expect(meta?.baseAtkLv90).toBe(542);
    expect(meta?.subStat?.key).toBe('cd');
    expect(meta?.subStat?.valueLv90).toBeCloseTo(88.2, 1);

    expect(getWeaponMetadata('Starsealed Edict')?.id).toBe(14525);

    const r1 = getWeaponPassive(14525, 1);
    expect(r1.passiveName).toBe("Dawnstar's Flowing Trail");
    expect(r1.passiveDescription).toContain('CRIT DMG by 24%');
    expect(r1.passiveDescription).toContain('Elemental Mastery by 48');
    expect(r1.passiveDescription).toContain('Stellar-Conduct CRIT DMG by 12%');

    const r5 = getWeaponPassive(14525, 5);
    expect(r5.passiveDescription).toContain('CRIT DMG by 48%');
    expect(r5.passiveDescription).toContain('Elemental Mastery by 96');
    expect(r5.passiveDescription).toContain('Stellar-Conduct CRIT DMG by 24%');

    expect(resolveWeaponName(14525, 'Weapon 14525')).toBe('Starsealed Edict · Awakened');
    expect(resolveWeaponName(14525, '')).toBe('Starsealed Edict · Awakened');
    expect(resolveWeaponName(999999, 'Weapon 999999')).toBe('Weapon 999999');
  });
});
