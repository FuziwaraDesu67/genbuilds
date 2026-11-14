/**
 * Authoritative Genshin Impact Weapon Metadata, Passives, and R1-R5 Refinement Scaling.
 * Covers 52 major weapons across all 5 archetypes (Swords, Claymores, Polearms, Catalysts, Bows).
 */

import type { WeaponMetadata } from './types';

export const WEAPON_LIST: WeaponMetadata[] = [
  // ─── Polearms ─────────────────────────────────────────────────
  {
    id: 13415,
    name: 'Rightful Reward',
    type: 'Polearm',
    rarity: 4,
    baseAtkLv90: 565,
    subStat: { type: 'hpPercent', key: 'hpPercent', label: 'HP', displayLabel: 'HP', valueLv90: 27.6 },
    passiveName: 'Tip of the Spear',
    descriptionTemplate: 'When being healed, restore {energy} Energy. This can be triggered once every 10s, even when the character is not on the field.',
    refinements: {
      1: 'When being healed, restore 8 Energy. This can be triggered once every 10s, even when the character is not on the field.',
      2: 'When being healed, restore 10 Energy. This can be triggered once every 10s, even when the character is not on the field.',
      3: 'When being healed, restore 12 Energy. This can be triggered once every 10s, even when the character is not on the field.',
      4: 'When being healed, restore 14 Energy. This can be triggered once every 10s, even when the character is not on the field.',
      5: 'When being healed, restore 16 Energy. This can be triggered once every 10s, even when the character is not on the field.',
      r1: 'When being healed, restore 8 Energy. This can be triggered once every 10s, even when the character is not on the field.',
      r2: 'When being healed, restore 10 Energy. This can be triggered once every 10s, even when the character is not on the field.',
      r3: 'When being healed, restore 12 Energy. This can be triggered once every 10s, even when the character is not on the field.',
      r4: 'When being healed, restore 14 Energy. This can be triggered once every 10s, even when the character is not on the field.',
      r5: 'When being healed, restore 16 Energy. This can be triggered once every 10s, even when the character is not on the field.',
    },
  },
  {
    id: 11510,
    name: 'Staff of Homa',
    type: 'Polearm',
    rarity: 5,
    baseAtkLv90: 608,
    subStat: { type: 'cd', key: 'cd', label: 'CRIT DMG', displayLabel: 'CRIT DMG', valueLv90: 66.2 },
    passiveName: 'Reckless Cinnabar',
    descriptionTemplate: "HP increased by {hp}%. Additionally, provides an ATK Bonus based on {atk}% of the wielder's Max HP. When the wielder's HP drops below 50%, this ATK bonus is increased by an additional {low_atk}% of Max HP.",
    refinements: {
      1: "HP increased by 20%. Additionally, provides an ATK Bonus based on 0.8% of the wielder's Max HP. When the wielder's HP drops below 50%, this ATK bonus is increased by an additional 1% of Max HP.",
      2: "HP increased by 25%. Additionally, provides an ATK Bonus based on 1.0% of the wielder's Max HP. When the wielder's HP drops below 50%, this ATK bonus is increased by an additional 1.2% of Max HP.",
      3: "HP increased by 30%. Additionally, provides an ATK Bonus based on 1.2% of the wielder's Max HP. When the wielder's HP drops below 50%, this ATK bonus is increased by an additional 1.4% of Max HP.",
      4: "HP increased by 35%. Additionally, provides an ATK Bonus based on 1.4% of the wielder's Max HP. When the wielder's HP drops below 50%, this ATK bonus is increased by an additional 1.6% of Max HP.",
      5: "HP increased by 40%. Additionally, provides an ATK Bonus based on 1.6% of the wielder's Max HP. When the wielder's HP drops below 50%, this ATK bonus is increased by an additional 1.8% of Max HP.",
      r1: "HP increased by 20%. Additionally, provides an ATK Bonus based on 0.8% of the wielder's Max HP. When the wielder's HP drops below 50%, this ATK bonus is increased by an additional 1% of Max HP.",
      r2: "HP increased by 25%. Additionally, provides an ATK Bonus based on 1.0% of the wielder's Max HP. When the wielder's HP drops below 50%, this ATK bonus is increased by an additional 1.2% of Max HP.",
      r3: "HP increased by 30%. Additionally, provides an ATK Bonus based on 1.2% of the wielder's Max HP. When the wielder's HP drops below 50%, this ATK bonus is increased by an additional 1.4% of Max HP.",
      r4: "HP increased by 35%. Additionally, provides an ATK Bonus based on 1.4% of the wielder's Max HP. When the wielder's HP drops below 50%, this ATK bonus is increased by an additional 1.6% of Max HP.",
      r5: "HP increased by 40%. Additionally, provides an ATK Bonus based on 1.6% of the wielder's Max HP. When the wielder's HP drops below 50%, this ATK bonus is increased by an additional 1.8% of Max HP.",
    },
  },
  {
    id: 11509,
    name: 'Engulfing Lightning',
    type: 'Polearm',
    rarity: 5,
    baseAtkLv90: 608,
    subStat: { type: 'er', key: 'er', label: 'Energy Recharge', displayLabel: 'Energy Recharge', valueLv90: 55.1 },
    passiveName: 'Timeless Dream: Eternal Stove',
    descriptionTemplate: 'ATK increased by {atk}% of Energy Recharge over the base 100%. You can gain a maximum bonus of {max_atk}% ATK. Gain {er}% Energy Recharge for 12s after using an Elemental Burst.',
    refinements: {
      1: 'ATK increased by 28% of Energy Recharge over the base 100%. You can gain a maximum bonus of 80% ATK. Gain 30% Energy Recharge for 12s after using an Elemental Burst.',
      2: 'ATK increased by 35% of Energy Recharge over the base 100%. You can gain a maximum bonus of 90% ATK. Gain 35% Energy Recharge for 12s after using an Elemental Burst.',
      3: 'ATK increased by 42% of Energy Recharge over the base 100%. You can gain a maximum bonus of 100% ATK. Gain 40% Energy Recharge for 12s after using an Elemental Burst.',
      4: 'ATK increased by 49% of Energy Recharge over the base 100%. You can gain a maximum bonus of 110% ATK. Gain 45% Energy Recharge for 12s after using an Elemental Burst.',
      5: 'ATK increased by 56% of Energy Recharge over the base 100%. You can gain a maximum bonus of 120% ATK. Gain 50% Energy Recharge for 12s after using an Elemental Burst.',
      r1: 'ATK increased by 28% of Energy Recharge over the base 100%. You can gain a maximum bonus of 80% ATK. Gain 30% Energy Recharge for 12s after using an Elemental Burst.',
      r2: 'ATK increased by 35% of Energy Recharge over the base 100%. You can gain a maximum bonus of 90% ATK. Gain 35% Energy Recharge for 12s after using an Elemental Burst.',
      r3: 'ATK increased by 42% of Energy Recharge over the base 100%. You can gain a maximum bonus of 100% ATK. Gain 40% Energy Recharge for 12s after using an Elemental Burst.',
      r4: 'ATK increased by 49% of Energy Recharge over the base 100%. You can gain a maximum bonus of 110% ATK. Gain 45% Energy Recharge for 12s after using an Elemental Burst.',
      r5: 'ATK increased by 56% of Energy Recharge over the base 100%. You can gain a maximum bonus of 120% ATK. Gain 50% Energy Recharge for 12s after using an Elemental Burst.',
    },
  },
  {
    id: 11501,
    name: 'Primordial Jade Winged-Spear',
    type: 'Polearm',
    rarity: 5,
    baseAtkLv90: 674,
    subStat: { type: 'cr', key: 'cr', label: 'CRIT Rate', displayLabel: 'CRIT Rate', valueLv90: 22.1 },
    passiveName: 'Eagle Spear of Justice',
    descriptionTemplate: 'On hit, increases ATK by {atk}% for 6s. Max 7 stacks. While at max stacks, DMG dealt is increased by {dmg}%.',
    refinements: {
      1: 'On hit, increases ATK by 3.2% for 6s. Max 7 stacks. This effect can only occur once every 0.3s. While in possession of the maximum possible stacks, DMG dealt is increased by 12%.',
      2: 'On hit, increases ATK by 3.9% for 6s. Max 7 stacks. This effect can only occur once every 0.3s. While in possession of the maximum possible stacks, DMG dealt is increased by 15%.',
      3: 'On hit, increases ATK by 4.6% for 6s. Max 7 stacks. This effect can only occur once every 0.3s. While in possession of the maximum possible stacks, DMG dealt is increased by 18%.',
      4: 'On hit, increases ATK by 5.3% for 6s. Max 7 stacks. This effect can only occur once every 0.3s. While in possession of the maximum possible stacks, DMG dealt is increased by 21%.',
      5: 'On hit, increases ATK by 6.0% for 6s. Max 7 stacks. This effect can only occur once every 0.3s. While in possession of the maximum possible stacks, DMG dealt is increased by 24%.',
      r1: 'On hit, increases ATK by 3.2% for 6s. Max 7 stacks. This effect can only occur once every 0.3s. While in possession of the maximum possible stacks, DMG dealt is increased by 12%.',
      r5: 'On hit, increases ATK by 6.0% for 6s. Max 7 stacks. This effect can only occur once every 0.3s. While in possession of the maximum possible stacks, DMG dealt is increased by 24%.',
    },
  },
  {
    id: 11415,
    name: 'The Catch',
    type: 'Polearm',
    rarity: 4,
    baseAtkLv90: 510,
    subStat: { type: 'er', key: 'er', label: 'Energy Recharge', displayLabel: 'Energy Recharge', valueLv90: 45.9 },
    passiveName: 'Shanty',
    descriptionTemplate: 'Increases Elemental Burst DMG by {burst_dmg}% and Elemental Burst CRIT Rate by {burst_cr}%.',
    refinements: {
      1: 'Increases Elemental Burst DMG by 16% and Elemental Burst CRIT Rate by 6%.',
      2: 'Increases Elemental Burst DMG by 20% and Elemental Burst CRIT Rate by 7.5%.',
      3: 'Increases Elemental Burst DMG by 24% and Elemental Burst CRIT Rate by 9%.',
      4: 'Increases Elemental Burst DMG by 28% and Elemental Burst CRIT Rate by 10.5%.',
      5: 'Increases Elemental Burst DMG by 32% and Elemental Burst CRIT Rate by 12%.',
      r1: 'Increases Elemental Burst DMG by 16% and Elemental Burst CRIT Rate by 6%.',
      r2: 'Increases Elemental Burst DMG by 20% and Elemental Burst CRIT Rate by 7.5%.',
      r3: 'Increases Elemental Burst DMG by 24% and Elemental Burst CRIT Rate by 9%.',
      r4: 'Increases Elemental Burst DMG by 28% and Elemental Burst CRIT Rate by 10.5%.',
      r5: 'Increases Elemental Burst DMG by 32% and Elemental Burst CRIT Rate by 12%.',
    },
  },
  {
    id: 11403,
    name: "Dragon's Bane",
    type: 'Polearm',
    rarity: 4,
    baseAtkLv90: 454,
    subStat: { type: 'em', key: 'em', label: 'Elemental Mastery', displayLabel: 'Elemental Mastery', valueLv90: 221 },
    passiveName: 'Bane of Flame and Water',
    descriptionTemplate: 'Increases DMG against opponents affected by Hydro or Pyro by {dmg}%.',
    refinements: {
      1: 'Increases DMG against opponents affected by Hydro or Pyro by 20%.',
      2: 'Increases DMG against opponents affected by Hydro or Pyro by 24%.',
      3: 'Increases DMG against opponents affected by Hydro or Pyro by 28%.',
      4: 'Increases DMG against opponents affected by Hydro or Pyro by 32%.',
      5: 'Increases DMG against opponents affected by Hydro or Pyro by 36%.',
      r1: 'Increases DMG against opponents affected by Hydro or Pyro by 20%.',
      r5: 'Increases DMG against opponents affected by Hydro or Pyro by 36%.',
    },
  },
  {
    id: 11406,
    name: 'Favonius Lance',
    type: 'Polearm',
    rarity: 4,
    baseAtkLv90: 565,
    subStat: { type: 'er', key: 'er', label: 'Energy Recharge', displayLabel: 'Energy Recharge', valueLv90: 30.6 },
    passiveName: 'Windfall',
    descriptionTemplate: 'CRIT hits have a {chance}% chance to generate a small amount of Elemental Particles, which will regenerate 6 Energy for the character. Can only occur once every {cd}s.',
    refinements: {
      1: 'CRIT hits have a 60% chance to generate a small amount of Elemental Particles, which will regenerate 6 Energy for the character. Can only occur once every 12s.',
      2: 'CRIT hits have a 70% chance to generate a small amount of Elemental Particles, which will regenerate 6 Energy for the character. Can only occur once every 10.5s.',
      3: 'CRIT hits have a 80% chance to generate a small amount of Elemental Particles, which will regenerate 6 Energy for the character. Can only occur once every 9s.',
      4: 'CRIT hits have a 90% chance to generate a small amount of Elemental Particles, which will regenerate 6 Energy for the character. Can only occur once every 7.5s.',
      5: 'CRIT hits have a 100% chance to generate a small amount of Elemental Particles, which will regenerate 6 Energy for the character. Can only occur once every 6s.',
      r1: 'CRIT hits have a 60% chance to generate a small amount of Elemental Particles, which will regenerate 6 Energy for the character. Can only occur once every 12s.',
      r5: 'CRIT hits have a 100% chance to generate a small amount of Elemental Particles, which will regenerate 6 Energy for the character. Can only occur once every 6s.',
    },
  },
  {
    id: 13405,
    name: 'Deathmatch',
    type: 'Polearm',
    rarity: 4,
    baseAtkLv90: 454,
    subStat: { type: 'cr', key: 'cr', label: 'CRIT Rate', displayLabel: 'CRIT Rate', valueLv90: 36.8 },
    passiveName: 'Gladiator',
    descriptionTemplate: 'If there are at least 2 opponents nearby, ATK is increased by {atk}% and DEF is increased by {def}%. If fewer than 2 opponents nearby, ATK is increased by {single_atk}%.',
    refinements: {
      1: 'If there are at least 2 opponents nearby, ATK is increased by 16% and DEF is increased by 16%. If there are fewer than 2 opponents nearby, ATK is increased by 24%.',
      2: 'If there are at least 2 opponents nearby, ATK is increased by 20% and DEF is increased by 20%. If there are fewer than 2 opponents nearby, ATK is increased by 30%.',
      3: 'If there are at least 2 opponents nearby, ATK is increased by 24% and DEF is increased by 24%. If there are fewer than 2 opponents nearby, ATK is increased by 36%.',
      4: 'If there are at least 2 opponents nearby, ATK is increased by 28% and DEF is increased by 28%. If there are fewer than 2 opponents nearby, ATK is increased by 42%.',
      5: 'If there are at least 2 opponents nearby, ATK is increased by 32% and DEF is increased by 32%. If there are fewer than 2 opponents nearby, ATK is increased by 48%.',
      r1: 'If there are at least 2 opponents nearby, ATK is increased by 16% and DEF is increased by 16%. If there are fewer than 2 opponents nearby, ATK is increased by 24%.',
      r5: 'If there are at least 2 opponents nearby, ATK is increased by 32% and DEF is increased by 32%. If there are fewer than 2 opponents nearby, ATK is increased by 48%.',
    },
  },
  {
    id: 13303,
    name: 'Black Tassel',
    type: 'Polearm',
    rarity: 3,
    baseAtkLv90: 354,
    subStat: { type: 'hpPercent', key: 'hpPercent', label: 'HP', displayLabel: 'HP', valueLv90: 46.9 },
    passiveName: 'Bane of the Soft',
    descriptionTemplate: 'Increases DMG against slimes by {dmg}%.',
    refinements: {
      1: 'Increases DMG against slimes by 40%.',
      2: 'Increases DMG against slimes by 50%.',
      3: 'Increases DMG against slimes by 60%.',
      4: 'Increases DMG against slimes by 70%.',
      5: 'Increases DMG against slimes by 80%.',
      r1: 'Increases DMG against slimes by 40%.',
      r5: 'Increases DMG against slimes by 80%.',
    },
  },
  {
    id: 13301,
    name: 'White Tassel',
    type: 'Polearm',
    rarity: 3,
    baseAtkLv90: 401,
    subStat: { type: 'cr', key: 'cr', label: 'CRIT Rate', displayLabel: 'CRIT Rate', valueLv90: 23.4 },
    passiveName: 'Sharp',
    descriptionTemplate: 'Increases Normal Attack DMG by {dmg}%.',
    refinements: {
      1: 'Increases Normal Attack DMG by 24%.',
      2: 'Increases Normal Attack DMG by 30%.',
      3: 'Increases Normal Attack DMG by 36%.',
      4: 'Increases Normal Attack DMG by 42%.',
      5: 'Increases Normal Attack DMG by 48%.',
      r1: 'Increases Normal Attack DMG by 24%.',
      r5: 'Increases Normal Attack DMG by 48%.',
    },
  },
  {
    id: 13511,
    name: 'Staff of the Scarlet Sands',
    type: 'Polearm',
    rarity: 5,
    baseAtkLv90: 542,
    subStat: { type: 'cr', key: 'cr', label: 'CRIT Rate', displayLabel: 'CRIT Rate', valueLv90: 44.1 },
    passiveName: 'Heat Haze at Horizon\'s End',
    descriptionTemplate: 'The equipping character gains {em_atk}% of their Elemental Mastery as bonus ATK.',
    refinements: {
      1: 'The equipping character gains 52% of their Elemental Mastery as bonus ATK. When an Elemental Skill hits opponents, 1 stack of the Dream of the Scarlet Sands will be gained for 10s: ATK is increased by 28% of their Elemental Mastery. Max 3 stacks.',
      5: 'The equipping character gains 104% of their Elemental Mastery as bonus ATK. When an Elemental Skill hits opponents, 1 stack of the Dream of the Scarlet Sands will be gained for 10s: ATK is increased by 56% of their Elemental Mastery. Max 3 stacks.',
      r1: 'The equipping character gains 52% of their Elemental Mastery as bonus ATK. When an Elemental Skill hits opponents, 1 stack of the Dream of the Scarlet Sands will be gained for 10s: ATK is increased by 28% of their Elemental Mastery. Max 3 stacks.',
      r5: 'The equipping character gains 104% of their Elemental Mastery as bonus ATK. When an Elemental Skill hits opponents, 1 stack of the Dream of the Scarlet Sands will be gained for 10s: ATK is increased by 56% of their Elemental Mastery. Max 3 stacks.',
    },
  },
  {
    id: 13512,
    name: "Crimson Moon's Semblance",
    type: 'Polearm',
    rarity: 5,
    baseAtkLv90: 674,
    subStat: { type: 'cr', key: 'cr', label: 'CRIT Rate', displayLabel: 'CRIT Rate', valueLv90: 22.1 },
    passiveName: "Ashen Sun's Shadow",
    descriptionTemplate: 'Grants a Bond of Life equal to 25% of Max HP when a Charged Attack hits an opponent. Character deals {dmg}% increased DMG while having a Bond of Life.',
    refinements: {
      1: 'Grants a Bond of Life equal to 25% of Max HP when a Charged Attack hits an opponent. In addition, character deals 12% increased DMG while having a Bond of Life (increased by an extra 24% if Bond of Life is >= 30% of Max HP).',
      5: 'Grants a Bond of Life equal to 25% of Max HP when a Charged Attack hits an opponent. In addition, character deals 28% increased DMG while having a Bond of Life (increased by an extra 56% if Bond of Life is >= 30% of Max HP).',
      r1: 'Grants a Bond of Life equal to 25% of Max HP when a Charged Attack hits an opponent. In addition, character deals 12% increased DMG while having a Bond of Life (increased by an extra 24% if Bond of Life is >= 30% of Max HP).',
      r5: 'Grants a Bond of Life equal to 25% of Max HP when a Charged Attack hits an opponent. In addition, character deals 28% increased DMG while having a Bond of Life (increased by an extra 56% if Bond of Life is >= 30% of Max HP).',
    },
  },
  {
    id: 13507,
    name: 'Calamity Queller',
    type: 'Polearm',
    rarity: 5,
    baseAtkLv90: 741,
    subStat: { type: 'atkPercent', key: 'atkPercent', label: 'ATK', displayLabel: 'ATK', valueLv90: 16.5 },
    passiveName: 'Extinguishing Precept',
    descriptionTemplate: 'Gain {elem_dmg}% All Elemental DMG Bonus. Skill grants ATK increase per second.',
    refinements: {
      1: 'Gain 12% All Elemental DMG Bonus. Obtain Consummation for 20s after using an Elemental Skill, increasing ATK by 3.2% per second (max 6 stacks). When equipping character is off-field, this ATK increase is doubled.',
      5: 'Gain 24% All Elemental DMG Bonus. Obtain Consummation for 20s after using an Elemental Skill, increasing ATK by 6.4% per second (max 6 stacks). When equipping character is off-field, this ATK increase is doubled.',
      r1: 'Gain 12% All Elemental DMG Bonus. Obtain Consummation for 20s after using an Elemental Skill, increasing ATK by 3.2% per second (max 6 stacks). When equipping character is off-field, this ATK increase is doubled.',
      r5: 'Gain 24% All Elemental DMG Bonus. Obtain Consummation for 20s after using an Elemental Skill, increasing ATK by 6.4% per second (max 6 stacks). When equipping character is off-field, this ATK increase is doubled.',
    },
  },
  {
    id: 11504,
    name: 'Skyward Spine',
    type: 'Polearm',
    rarity: 5,
    baseAtkLv90: 674,
    subStat: { type: 'er', key: 'er', label: 'Energy Recharge', displayLabel: 'Energy Recharge', valueLv90: 36.8 },
    passiveName: 'Black Wing',
    descriptionTemplate: 'Increases CRIT Rate by {cr}% and Normal ATK SPD by 12%.',
    refinements: {
      1: 'Increases CRIT Rate by 8% and Normal ATK SPD by 12%. Normal and Charged Attacks have a 50% chance to trigger a vacuum blade that deals 40% of ATK as DMG.',
      5: 'Increases CRIT Rate by 16% and Normal ATK SPD by 12%. Normal and Charged Attacks have a 50% chance to trigger a vacuum blade that deals 100% of ATK as DMG.',
      r1: 'Increases CRIT Rate by 8% and Normal ATK SPD by 12%. Normal and Charged Attacks have a 50% chance to trigger a vacuum blade that deals 40% of ATK as DMG.',
      r5: 'Increases CRIT Rate by 16% and Normal ATK SPD by 12%. Normal and Charged Attacks have a 50% chance to trigger a vacuum blade that deals 100% of ATK as DMG.',
    },
  },

  // ─── Swords ───────────────────────────────────────────────────
  {
    id: 11409,
    name: 'The Black Sword',
    type: 'Sword',
    rarity: 4,
    baseAtkLv90: 510,
    subStat: { type: 'cr', key: 'cr', label: 'CRIT Rate', displayLabel: 'CRIT Rate', valueLv90: 27.6 },
    passiveName: 'Justice',
    descriptionTemplate: 'Increases DMG dealt by Normal and Charged Attacks by {dmg}%. Additionally, regenerates {heal}% of ATK as HP when Normal and Charged Attacks score a CRIT Hit. This effect can occur once every 5s.',
    refinements: {
      1: 'Increases DMG dealt by Normal and Charged Attacks by 20%. Additionally, regenerates 60% of ATK as HP when Normal and Charged Attacks score a CRIT Hit. This effect can occur once every 5s.',
      2: 'Increases DMG dealt by Normal and Charged Attacks by 25%. Additionally, regenerates 70% of ATK as HP when Normal and Charged Attacks score a CRIT Hit. This effect can occur once every 5s.',
      3: 'Increases DMG dealt by Normal and Charged Attacks by 30%. Additionally, regenerates 80% of ATK as HP when Normal and Charged Attacks score a CRIT Hit. This effect can occur once every 5s.',
      4: 'Increases DMG dealt by Normal and Charged Attacks by 35%. Additionally, regenerates 90% of ATK as HP when Normal and Charged Attacks score a CRIT Hit. This effect can occur once every 5s.',
      5: 'Increases DMG dealt by Normal and Charged Attacks by 40%. Additionally, regenerates 100% of ATK as HP when Normal and Charged Attacks score a CRIT Hit. This effect can occur once every 5s.',
      r1: 'Increases DMG dealt by Normal and Charged Attacks by 20%. Additionally, regenerates 60% of ATK as HP when Normal and Charged Attacks score a CRIT Hit. This effect can occur once every 5s.',
      r2: 'Increases DMG dealt by Normal and Charged Attacks by 25%. Additionally, regenerates 70% of ATK as HP when Normal and Charged Attacks score a CRIT Hit. This effect can occur once every 5s.',
      r3: 'Increases DMG dealt by Normal and Charged Attacks by 30%. Additionally, regenerates 80% of ATK as HP when Normal and Charged Attacks score a CRIT Hit. This effect can occur once every 5s.',
      r4: 'Increases DMG dealt by Normal and Charged Attacks by 35%. Additionally, regenerates 90% of ATK as HP when Normal and Charged Attacks score a CRIT Hit. This effect can occur once every 5s.',
      r5: 'Increases DMG dealt by Normal and Charged Attacks by 40%. Additionally, regenerates 100% of ATK as HP when Normal and Charged Attacks score a CRIT Hit. This effect can occur once every 5s.',
    },
  },
  {
    id: 11507,
    name: 'Mistsplitter Reforged',
    type: 'Sword',
    rarity: 5,
    baseAtkLv90: 674,
    subStat: { type: 'cd', key: 'cd', label: 'CRIT DMG', displayLabel: 'CRIT DMG', valueLv90: 44.1 },
    passiveName: "Mistsplitter's Edge",
    descriptionTemplate: "Gain a {elem_dmg}% Elemental DMG Bonus for all elements. Gain Mistsplitter's Emblem stacks.",
    refinements: {
      1: "Gain a 12% Elemental DMG Bonus for all elements. Gain Mistsplitter's Emblem stacks for 8/16/28% Elemental DMG Bonus to equipping character's Elemental Type.",
      5: "Gain a 24% Elemental DMG Bonus for all elements. Gain Mistsplitter's Emblem stacks for 16/32/56% Elemental DMG Bonus to equipping character's Elemental Type.",
      r1: "Gain a 12% Elemental DMG Bonus for all elements. Gain Mistsplitter's Emblem stacks for 8/16/28% Elemental DMG Bonus to equipping character's Elemental Type.",
      r5: "Gain a 24% Elemental DMG Bonus for all elements. Gain Mistsplitter's Emblem stacks for 16/32/56% Elemental DMG Bonus to equipping character's Elemental Type.",
    },
  },
  {
    id: 11505,
    name: 'Primordial Jade Cutter',
    type: 'Sword',
    rarity: 5,
    baseAtkLv90: 542,
    subStat: { type: 'cr', key: 'cr', label: 'CRIT Rate', displayLabel: 'CRIT Rate', valueLv90: 44.1 },
    passiveName: "Protector's Virtue",
    descriptionTemplate: "HP is increased by {hp}%. Additionally, provides an ATK Bonus based on {atk}% of the wielder's Max HP.",
    refinements: {
      1: "HP is increased by 20%. Additionally, provides an ATK Bonus based on 1.2% of the wielder's Max HP.",
      5: "HP is increased by 40%. Additionally, provides an ATK Bonus based on 2.4% of the wielder's Max HP.",
      r1: "HP is increased by 20%. Additionally, provides an ATK Bonus based on 1.2% of the wielder's Max HP.",
      r5: "HP is increased by 40%. Additionally, provides an ATK Bonus based on 2.4% of the wielder's Max HP.",
    },
  },
  {
    id: 11513,
    name: 'Splendor of Tranquil Waters',
    type: 'Sword',
    rarity: 5,
    baseAtkLv90: 542,
    subStat: { type: 'cd', key: 'cd', label: 'CRIT DMG', displayLabel: 'CRIT DMG', valueLv90: 88.2 },
    passiveName: 'Dawn and Dusk by the Lake',
    descriptionTemplate: 'When current HP increases or decreases, Elemental Skill DMG is increased by {skill_dmg}%.',
    refinements: {
      1: "When the current HP increases or decreases, Elemental Skill DMG dealt is increased by 8% for 6s (max 3 stacks). When other party members' HP increases or decreases, equipping character's Max HP is increased by 14% for 6s (max 2 stacks).",
      5: "When the current HP increases or decreases, Elemental Skill DMG dealt is increased by 16% for 6s (max 3 stacks). When other party members' HP increases or decreases, equipping character's Max HP is increased by 28% for 6s (max 2 stacks).",
      r1: "When the current HP increases or decreases, Elemental Skill DMG dealt is increased by 8% for 6s (max 3 stacks). When other party members' HP increases or decreases, equipping character's Max HP is increased by 14% for 6s (max 2 stacks).",
      r5: "When the current HP increases or decreases, Elemental Skill DMG dealt is increased by 16% for 6s (max 3 stacks). When other party members' HP increases or decreases, equipping character's Max HP is increased by 28% for 6s (max 2 stacks).",
    },
  },
  {
    id: 11503,
    name: 'Freedom-Sworn',
    type: 'Sword',
    rarity: 5,
    baseAtkLv90: 608,
    subStat: { type: 'em', key: 'em', label: 'Elemental Mastery', displayLabel: 'Elemental Mastery', valueLv90: 198 },
    passiveName: 'Revolutionary Chorale',
    descriptionTemplate: 'Increases DMG by {dmg}%. Millennial Movement grants team buffs.',
    refinements: {
      1: 'Increases DMG by 10%. Millennial Movement: Song of Resistance increases Normal, Charged and Plunging Attack DMG by 16% and ATK by 20% for 12s.',
      5: 'Increases DMG by 20%. Millennial Movement: Song of Resistance increases Normal, Charged and Plunging Attack DMG by 32% and ATK by 40% for 12s.',
      r1: 'Increases DMG by 10%. Millennial Movement: Song of Resistance increases Normal, Charged and Plunging Attack DMG by 16% and ATK by 20% for 12s.',
      r5: 'Increases DMG by 20%. Millennial Movement: Song of Resistance increases Normal, Charged and Plunging Attack DMG by 32% and ATK by 40% for 12s.',
    },
  },
  {
    id: 11511,
    name: 'Haran Geppaku Futsu',
    type: 'Sword',
    rarity: 5,
    baseAtkLv90: 608,
    subStat: { type: 'cr', key: 'cr', label: 'CRIT Rate', displayLabel: 'CRIT Rate', valueLv90: 33.1 },
    passiveName: 'Honed Flow',
    descriptionTemplate: 'Obtain {elem_dmg}% All Elemental DMG Bonus. Normal Attack DMG increased by Wavespike.',
    refinements: {
      1: 'Obtain 12% All Elemental DMG Bonus. When nearby party members use Elemental Skills, obtain Wavespike (max 2 stacks). When using Elemental Skill, consume Wavespike to increase Normal Attack DMG by 20% per stack for 8s.',
      5: 'Obtain 24% All Elemental DMG Bonus. When nearby party members use Elemental Skills, obtain Wavespike (max 2 stacks). When using Elemental Skill, consume Wavespike to increase Normal Attack DMG by 40% per stack for 8s.',
      r1: 'Obtain 12% All Elemental DMG Bonus. When nearby party members use Elemental Skills, obtain Wavespike (max 2 stacks). When using Elemental Skill, consume Wavespike to increase Normal Attack DMG by 20% per stack for 8s.',
      r5: 'Obtain 24% All Elemental DMG Bonus. When nearby party members use Elemental Skills, obtain Wavespike (max 2 stacks). When using Elemental Skill, consume Wavespike to increase Normal Attack DMG by 40% per stack for 8s.',
    },
  },
  {
    id: 11512,
    name: 'Key of Khaj-Nisut',
    type: 'Sword',
    rarity: 5,
    baseAtkLv90: 542,
    subStat: { type: 'hpPercent', key: 'hpPercent', label: 'HP', displayLabel: 'HP', valueLv90: 66.2 },
    passiveName: 'Sunken Song of the Sands',
    descriptionTemplate: 'HP increased by {hp}%. Skill hits grant Elemental Mastery based on Max HP.',
    refinements: {
      1: "HP increased by 20%. When an Elemental Skill hits opponents, gain Grand Hymn for 20s, increasing Elemental Mastery by 0.12% of Max HP (max 3 stacks). At 3 stacks, all party members gain 0.2% of wielder's Max HP as Elemental Mastery for 20s.",
      5: "HP increased by 40%. When an Elemental Skill hits opponents, gain Grand Hymn for 20s, increasing Elemental Mastery by 0.24% of Max HP (max 3 stacks). At 3 stacks, all party members gain 0.4% of wielder's Max HP as Elemental Mastery for 20s.",
      r1: "HP increased by 20%. When an Elemental Skill hits opponents, gain Grand Hymn for 20s, increasing Elemental Mastery by 0.12% of Max HP (max 3 stacks). At 3 stacks, all party members gain 0.2% of wielder's Max HP as Elemental Mastery for 20s.",
      r5: "HP increased by 40%. When an Elemental Skill hits opponents, gain Grand Hymn for 20s, increasing Elemental Mastery by 0.24% of Max HP (max 3 stacks). At 3 stacks, all party members gain 0.4% of wielder's Max HP as Elemental Mastery for 20s.",
    },
  },
  {
    id: 11514,
    name: 'Light of Foliar Sanction',
    type: 'Sword',
    rarity: 5,
    baseAtkLv90: 542,
    subStat: { type: 'cd', key: 'cd', label: 'CRIT DMG', displayLabel: 'CRIT DMG', valueLv90: 88.2 },
    passiveName: 'Whitemoon Brash',
    descriptionTemplate: 'CRIT Rate is increased by {cr}%. Normal Attacks dealing Elemental DMG buff Normal and Skill DMG.',
    refinements: {
      1: 'CRIT Rate is increased by 4%. Normal Attacks dealing Elemental DMG increase DMG dealt by Normal Attacks and Elemental Skills by 120% of Elemental Mastery for 12s (max 28 DMG increases).',
      5: 'CRIT Rate is increased by 8%. Normal Attacks dealing Elemental DMG increase DMG dealt by Normal Attacks and Elemental Skills by 240% of Elemental Mastery for 12s (max 28 DMG increases).',
      r1: 'CRIT Rate is increased by 4%. Normal Attacks dealing Elemental DMG increase DMG dealt by Normal Attacks and Elemental Skills by 120% of Elemental Mastery for 12s (max 28 DMG increases).',
      r5: 'CRIT Rate is increased by 8%. Normal Attacks dealing Elemental DMG increase DMG dealt by Normal Attacks and Elemental Skills by 240% of Elemental Mastery for 12s (max 28 DMG increases).',
    },
  },
  {
    id: 11515,
    name: 'Absolution',
    type: 'Sword',
    rarity: 5,
    baseAtkLv90: 674,
    subStat: { type: 'cd', key: 'cd', label: 'CRIT DMG', displayLabel: 'CRIT DMG', valueLv90: 44.1 },
    passiveName: 'Root of the Reason',
    descriptionTemplate: 'CRIT DMG increased by {cd}%. Increasing Bond of Life increases DMG dealt.',
    refinements: {
      1: 'CRIT DMG increased by 20%. Increasing the value of a Bond of Life increases DMG dealt by 16% for 6s (max 3 stacks).',
      5: 'CRIT DMG increased by 40%. Increasing the value of a Bond of Life increases DMG dealt by 32% for 6s (max 3 stacks).',
      r1: 'CRIT DMG increased by 20%. Increasing the value of a Bond of Life increases DMG dealt by 16% for 6s (max 3 stacks).',
      r5: 'CRIT DMG increased by 40%. Increasing the value of a Bond of Life increases DMG dealt by 32% for 6s (max 3 stacks).',
    },
  },
  {
    id: 11516,
    name: 'Uraku Misugiri',
    type: 'Sword',
    rarity: 5,
    baseAtkLv90: 542,
    subStat: { type: 'cd', key: 'cd', label: 'CRIT DMG', displayLabel: 'CRIT DMG', valueLv90: 88.2 },
    passiveName: 'Brocade Bloom, Shrine Spliced',
    descriptionTemplate: 'Normal Attack DMG increased by {normal}%, Elemental Skill DMG increased by {skill}%. DEF +{def}%.',
    refinements: {
      1: 'Normal Attack DMG is increased by 16% and Elemental Skill DMG is increased by 24%. After dealing Geo DMG, the aforementioned effects increase by 100% for 15s. Additionally, DEF is increased by 20%.',
      5: 'Normal Attack DMG is increased by 32% and Elemental Skill DMG is increased by 48%. After dealing Geo DMG, the aforementioned effects increase by 100% for 15s. Additionally, DEF is increased by 40%.',
      r1: 'Normal Attack DMG is increased by 16% and Elemental Skill DMG is increased by 24%. After dealing Geo DMG, the aforementioned effects increase by 100% for 15s. Additionally, DEF is increased by 20%.',
      r5: 'Normal Attack DMG is increased by 32% and Elemental Skill DMG is increased by 48%. After dealing Geo DMG, the aforementioned effects increase by 100% for 15s. Additionally, DEF is increased by 40%.',
    },
  },
  {
    id: 11517,
    name: 'Peak Patrol Song',
    type: 'Sword',
    rarity: 5,
    baseAtkLv90: 542,
    subStat: { type: 'defPercent', key: 'defPercent', label: 'DEF', displayLabel: 'DEF', valueLv90: 82.7 },
    passiveName: 'Autumn Winds in the Mountain Prime',
    descriptionTemplate: 'Gain {def}% DEF and {elem}% All Elemental DMG Bonus. Team gains buffs based on DEF.',
    refinements: {
      1: 'Gain 8% DEF and 10% All Elemental DMG Bonus. All party members gain 8% Elemental DMG Bonus for every 1,000 DEF of equipping character (max 25.6%).',
      5: 'Gain 16% DEF and 20% All Elemental DMG Bonus. All party members gain 16% Elemental DMG Bonus for every 1,000 DEF of equipping character (max 51.2%).',
      r1: 'Gain 8% DEF and 10% All Elemental DMG Bonus. All party members gain 8% Elemental DMG Bonus for every 1,000 DEF of equipping character (max 25.6%).',
      r5: 'Gain 16% DEF and 20% All Elemental DMG Bonus. All party members gain 16% Elemental DMG Bonus for every 1,000 DEF of equipping character (max 51.2%).',
    },
  },
  {
    id: 11401,
    name: 'Favonius Sword',
    type: 'Sword',
    rarity: 4,
    baseAtkLv90: 454,
    subStat: { type: 'er', key: 'er', label: 'Energy Recharge', displayLabel: 'Energy Recharge', valueLv90: 61.3 },
    passiveName: 'Windfall',
    descriptionTemplate: 'CRIT hits have a {chance}% chance to generate a small amount of Elemental Particles.',
    refinements: {
      1: 'CRIT hits have a 60% chance to generate a small amount of Elemental Particles, regenerating 6 Energy. CD: 12s.',
      5: 'CRIT hits have a 100% chance to generate a small amount of Elemental Particles, regenerating 6 Energy. CD: 6s.',
      r1: 'CRIT hits have a 60% chance to generate a small amount of Elemental Particles, regenerating 6 Energy. CD: 12s.',
      r5: 'CRIT hits have a 100% chance to generate a small amount of Elemental Particles, regenerating 6 Energy. CD: 6s.',
    },
  },
  {
    id: 11402,
    name: 'Sacrificial Sword',
    type: 'Sword',
    rarity: 4,
    baseAtkLv90: 454,
    subStat: { type: 'er', key: 'er', label: 'Energy Recharge', displayLabel: 'Energy Recharge', valueLv90: 61.3 },
    passiveName: 'Composed',
    descriptionTemplate: 'After damaging an opponent with an Elemental Skill, the skill has a {chance}% chance to end its own CD.',
    refinements: {
      1: 'After damaging an opponent with an Elemental Skill, the skill has a 40% chance to end its own CD. Can only occur once every 30s.',
      5: 'After damaging an opponent with an Elemental Skill, the skill has an 80% chance to end its own CD. Can only occur once every 16s.',
      r1: 'After damaging an opponent with an Elemental Skill, the skill has a 40% chance to end its own CD. Can only occur once every 30s.',
      r5: 'After damaging an opponent with an Elemental Skill, the skill has an 80% chance to end its own CD. Can only occur once every 16s.',
    },
  },
  {
    id: 11407,
    name: 'Iron Sting',
    type: 'Sword',
    rarity: 4,
    baseAtkLv90: 510,
    subStat: { type: 'em', key: 'em', label: 'Elemental Mastery', displayLabel: 'Elemental Mastery', valueLv90: 165 },
    passiveName: 'Infusion Stinger',
    descriptionTemplate: 'Dealing Elemental DMG increases all DMG by {dmg}% for 6s. Max 2 stacks.',
    refinements: {
      1: 'Dealing Elemental DMG increases all DMG by 6% for 6s. Max 2 stacks. Can only occur once every 1s.',
      5: 'Dealing Elemental DMG increases all DMG by 12% for 6s. Max 2 stacks. Can only occur once every 1s.',
      r1: 'Dealing Elemental DMG increases all DMG by 6% for 6s. Max 2 stacks. Can only occur once every 1s.',
      r5: 'Dealing Elemental DMG increases all DMG by 12% for 6s. Max 2 stacks. Can only occur once every 1s.',
    },
  },
  {
    id: 11413,
    name: 'Amenoma Kageuchi',
    type: 'Sword',
    rarity: 4,
    baseAtkLv90: 454,
    subStat: { type: 'atkPercent', key: 'atkPercent', label: 'ATK', displayLabel: 'ATK', valueLv90: 55.1 },
    passiveName: 'Iwagakura Seed',
    descriptionTemplate: 'After casting an Elemental Skill, gain 1 Succession Seed. Burst consumes seeds to restore {energy} Energy.',
    refinements: {
      1: 'After casting an Elemental Skill, gain 1 Succession Seed. After using an Elemental Burst, consume all seeds to regenerate 6 Energy per seed consumed.',
      5: 'After casting an Elemental Skill, gain 1 Succession Seed. After using an Elemental Burst, consume all seeds to regenerate 12 Energy per seed consumed.',
      r1: 'After casting an Elemental Skill, gain 1 Succession Seed. After using an Elemental Burst, consume all seeds to regenerate 6 Energy per seed consumed.',
      r5: 'After casting an Elemental Skill, gain 1 Succession Seed. After using an Elemental Burst, consume all seeds to regenerate 12 Energy per seed consumed.',
    },
  },
  {
    id: 11422,
    name: 'Fleuve Cendre Ferryman',
    type: 'Sword',
    rarity: 4,
    baseAtkLv90: 510,
    subStat: { type: 'er', key: 'er', label: 'Energy Recharge', displayLabel: 'Energy Recharge', valueLv90: 45.9 },
    passiveName: 'Ironbone',
    descriptionTemplate: 'Increases Elemental Skill CRIT Rate by {cr}%. Post-skill ER increases by {er}%.',
    refinements: {
      1: 'Increases Elemental Skill CRIT Rate by 8%. Additionally, increases Energy Recharge by 16% for 5s after using an Elemental Skill.',
      5: 'Increases Elemental Skill CRIT Rate by 16%. Additionally, increases Energy Recharge by 32% for 5s after using an Elemental Skill.',
      r1: 'Increases Elemental Skill CRIT Rate by 8%. Additionally, increases Energy Recharge by 16% for 5s after using an Elemental Skill.',
      r5: 'Increases Elemental Skill CRIT Rate by 16%. Additionally, increases Energy Recharge by 32% for 5s after using an Elemental Skill.',
    },
  },
  {
    id: 11502,
    name: 'Skyward Blade',
    type: 'Sword',
    rarity: 5,
    baseAtkLv90: 608,
    subStat: { type: 'er', key: 'er', label: 'Energy Recharge', displayLabel: 'Energy Recharge', valueLv90: 55.1 },
    passiveName: 'Sky-Piercing Fang',
    descriptionTemplate: 'CRIT Rate increased by {cr}%. Post-burst SPD and Normal/Charged DMG increased.',
    refinements: {
      1: 'CRIT Rate increased by 4%. Upon using an Elemental Burst: increases Movement SPD by 10%, ATK SPD by 10%, and Normal and Charged Attack hits deal additional DMG equal to 20% of ATK for 12s.',
      5: 'CRIT Rate increased by 8%. Upon using an Elemental Burst: increases Movement SPD by 10%, ATK SPD by 10%, and Normal and Charged Attack hits deal additional DMG equal to 40% of ATK for 12s.',
      r1: 'CRIT Rate increased by 4%. Upon using an Elemental Burst: increases Movement SPD by 10%, ATK SPD by 10%, and Normal and Charged Attack hits deal additional DMG equal to 20% of ATK for 12s.',
      r5: 'CRIT Rate increased by 8%. Upon using an Elemental Burst: increases Movement SPD by 10%, ATK SPD by 10%, and Normal and Charged Attack hits deal additional DMG equal to 40% of ATK for 12s.',
    },
  },

  // ─── Catalysts ────────────────────────────────────────────────
  {
    id: 12516,
    name: 'A Teaspoon of Transcendence',
    type: 'Claymore',
    rarity: 5,
    baseAtkLv90: 674,
    subStat: { type: 'cd', key: 'cd', label: 'CRIT DMG', displayLabel: 'CRIT DMG', valueLv90: 44.1 },
    passiveName: 'Clockwork Elegance',
    descriptionTemplate: 'Increases ATK by {atk}%. When the equipping character deals damage via Charged Attack, they gain 1 stack of Transcendence, up to 3 stacks. Each stack increases Stellar-Conduct DMG by {dmg}%.',
    refinements: {
      1: 'Increases ATK by 28%. When the equipping character deals damage via Charged Attack, they gain 1 stack of Transcendence, up to 3 stacks. Each stack increases Stellar-Conduct DMG by 16%.',
      2: 'Increases ATK by 35%. When the equipping character deals damage via Charged Attack, they gain 1 stack of Transcendence, up to 3 stacks. Each stack increases Stellar-Conduct DMG by 20%.',
      3: 'Increases ATK by 42%. When the equipping character deals damage via Charged Attack, they gain 1 stack of Transcendence, up to 3 stacks. Each stack increases Stellar-Conduct DMG by 24%.',
      4: 'Increases ATK by 49%. When the equipping character deals damage via Charged Attack, they gain 1 stack of Transcendence, up to 3 stacks. Each stack increases Stellar-Conduct DMG by 28%.',
      5: 'Increases ATK by 56%. When the equipping character deals damage via Charged Attack, they gain 1 stack of Transcendence, up to 3 stacks. Each stack increases Stellar-Conduct DMG by 32%.',
      r1: 'Increases ATK by 28%. When the equipping character deals damage via Charged Attack, they gain 1 stack of Transcendence, up to 3 stacks. Each stack increases Stellar-Conduct DMG by 16%.',
      r2: 'Increases ATK by 35%. When the equipping character deals damage via Charged Attack, they gain 1 stack of Transcendence, up to 3 stacks. Each stack increases Stellar-Conduct DMG by 20%.',
      r3: 'Increases ATK by 42%. When the equipping character deals damage via Charged Attack, they gain 1 stack of Transcendence, up to 3 stacks. Each stack increases Stellar-Conduct DMG by 24%.',
      r4: 'Increases ATK by 49%. When the equipping character deals damage via Charged Attack, they gain 1 stack of Transcendence, up to 3 stacks. Each stack increases Stellar-Conduct DMG by 28%.',
      r5: 'Increases ATK by 56%. When the equipping character deals damage via Charged Attack, they gain 1 stack of Transcendence, up to 3 stacks. Each stack increases Stellar-Conduct DMG by 32%.',
    },
  },
  {
    id: 14519,
    name: 'Vivid Notions',
    type: 'Catalyst',
    rarity: 5,
    baseAtkLv90: 674,
    subStat: { type: 'cd', key: 'cd', label: 'CRIT DMG', displayLabel: 'CRIT DMG', valueLv90: 44.1 },
    passiveName: 'Rainbow Radiance',
    descriptionTemplate: 'Increases ATK by {atk}%. After triggering an Electro-related reaction, Normal and Charged Attack DMG is increased by {dmg}% for 12s.',
    refinements: {
      1: 'Increases ATK by 20%. After triggering an Electro-related reaction, Normal and Charged Attack DMG is increased by 28% for 12s.',
      5: 'Increases ATK by 40%. After triggering an Electro-related reaction, Normal and Charged Attack DMG is increased by 56% for 12s.',
      r1: 'Increases ATK by 20%. After triggering an Electro-related reaction, Normal and Charged Attack DMG is increased by 28% for 12s.',
      r5: 'Increases ATK by 40%. After triggering an Electro-related reaction, Normal and Charged Attack DMG is increased by 56% for 12s.',
    },
  },
  {
    id: 14524,
    name: 'Hymn of the Maelstrom',
    type: 'Catalyst',
    rarity: 5,
    baseAtkLv90: 542,
    subStat: { type: 'hp', key: 'hp', label: 'HP', displayLabel: 'HP', valueLv90: 88.2 },
    passiveName: 'Abyssal Choral',
    descriptionTemplate: 'Increases Max HP by {hp}%. When healing party members, increases party Elemental Mastery by {em} and Hydro DMG Bonus by {dmg}% for 15s.',
    refinements: {
      1: 'Increases Max HP by 20%. When healing party members, increases party Elemental Mastery by 80 and Hydro DMG Bonus by 15% for 15s.',
      2: 'Increases Max HP by 25%. When healing party members, increases party Elemental Mastery by 100 and Hydro DMG Bonus by 18.75% for 15s.',
      3: 'Increases Max HP by 30%. When healing party members, increases party Elemental Mastery by 120 and Hydro DMG Bonus by 22.5% for 15s.',
      4: 'Increases Max HP by 35%. When healing party members, increases party Elemental Mastery by 140 and Hydro DMG Bonus by 26.25% for 15s.',
      5: 'Increases Max HP by 40%. When healing party members, increases party Elemental Mastery by 160 and Hydro DMG Bonus by 30% for 15s.',
      r1: 'Increases Max HP by 20%. When healing party members, increases party Elemental Mastery by 80 and Hydro DMG Bonus by 15% for 15s.',
      r5: 'Increases Max HP by 40%. When healing party members, increases party Elemental Mastery by 160 and Hydro DMG Bonus by 30% for 15s.',
    },
  },
  {
    id: 14525,
    name: 'Starsealed Edict · Awakened',
    type: 'Catalyst',
    rarity: 5,
    baseAtkLv90: 542,
    subStat: { type: 'cd', key: 'cd', label: 'CRIT DMG', displayLabel: 'CRIT DMG', valueLv90: 88.2 },
    passiveName: "Dawnstar's Flowing Trail",
    descriptionTemplate: "Increases CRIT DMG by {cd}%. Casting an Elemental Skill grants Crystal Compounding for 20s, increasing Elemental Mastery by {em}. While active, nearby party members triggering Elemental Reactions grant 1 stack of Law of Combustion (max 3 stacks), each increasing Elemental Mastery by {stack_em} and Stellar-Conduct CRIT DMG by {sc_cd}%.",
    refinements: {
      1: 'Increases CRIT DMG by 24%. Casting an Elemental Skill grants Crystal Compounding for 20s, increasing Elemental Mastery by 48. While active, nearby party members triggering Elemental Reactions grant 1 stack of Law of Combustion (max 3 stacks), each increasing Elemental Mastery by 24 and Stellar-Conduct CRIT DMG by 12%.',
      2: 'Increases CRIT DMG by 30%. Casting an Elemental Skill grants Crystal Compounding for 20s, increasing Elemental Mastery by 60. While active, nearby party members triggering Elemental Reactions grant 1 stack of Law of Combustion (max 3 stacks), each increasing Elemental Mastery by 30 and Stellar-Conduct CRIT DMG by 15%.',
      3: 'Increases CRIT DMG by 36%. Casting an Elemental Skill grants Crystal Compounding for 20s, increasing Elemental Mastery by 72. While active, nearby party members triggering Elemental Reactions grant 1 stack of Law of Combustion (max 3 stacks), each increasing Elemental Mastery by 36 and Stellar-Conduct CRIT DMG by 18%.',
      4: 'Increases CRIT DMG by 42%. Casting an Elemental Skill grants Crystal Compounding for 20s, increasing Elemental Mastery by 84. While active, nearby party members triggering Elemental Reactions grant 1 stack of Law of Combustion (max 3 stacks), each increasing Elemental Mastery by 42 and Stellar-Conduct CRIT DMG by 21%.',
      5: 'Increases CRIT DMG by 48%. Casting an Elemental Skill grants Crystal Compounding for 20s, increasing Elemental Mastery by 96. While active, nearby party members triggering Elemental Reactions grant 1 stack of Law of Combustion (max 3 stacks), each increasing Elemental Mastery by 48 and Stellar-Conduct CRIT DMG by 24%.',
      r1: 'Increases CRIT DMG by 24%. Casting an Elemental Skill grants Crystal Compounding for 20s, increasing Elemental Mastery by 48. While active, nearby party members triggering Elemental Reactions grant 1 stack of Law of Combustion (max 3 stacks), each increasing Elemental Mastery by 24 and Stellar-Conduct CRIT DMG by 12%.',
      r2: 'Increases CRIT DMG by 30%. Casting an Elemental Skill grants Crystal Compounding for 20s, increasing Elemental Mastery by 60. While active, nearby party members triggering Elemental Reactions grant 1 stack of Law of Combustion (max 3 stacks), each increasing Elemental Mastery by 30 and Stellar-Conduct CRIT DMG by 15%.',
      r3: 'Increases CRIT DMG by 36%. Casting an Elemental Skill grants Crystal Compounding for 20s, increasing Elemental Mastery by 72. While active, nearby party members triggering Elemental Reactions grant 1 stack of Law of Combustion (max 3 stacks), each increasing Elemental Mastery by 36 and Stellar-Conduct CRIT DMG by 18%.',
      r4: 'Increases CRIT DMG by 42%. Casting an Elemental Skill grants Crystal Compounding for 20s, increasing Elemental Mastery by 84. While active, nearby party members triggering Elemental Reactions grant 1 stack of Law of Combustion (max 3 stacks), each increasing Elemental Mastery by 42 and Stellar-Conduct CRIT DMG by 21%.',
      r5: 'Increases CRIT DMG by 48%. Casting an Elemental Skill grants Crystal Compounding for 20s, increasing Elemental Mastery by 96. While active, nearby party members triggering Elemental Reactions grant 1 stack of Law of Combustion (max 3 stacks), each increasing Elemental Mastery by 48 and Stellar-Conduct CRIT DMG by 24%.',
    },
  },
  {
    id: 11521,
    name: 'Whitelake Frostfeather',
    type: 'Sword',
    rarity: 5,
    baseAtkLv90: 608,
    subStat: { type: 'cd', key: 'cd', label: 'CRIT DMG', displayLabel: 'CRIT DMG', valueLv90: 66.2 },
    passiveName: 'Swan Song of the Glacial Mere',
    descriptionTemplate: 'Increases Cryo DMG Bonus by {dmg}%. Normal Attacks and Skill casts grant 1 stack of Pale Shroud for 8s (max 3 stacks), increasing Elemental Skill and Burst DMG by {buff}%.',
    refinements: {
      1: 'Increases Cryo DMG Bonus by 12%. Normal Attacks and Skill casts grant 1 stack of Pale Shroud for 8s (max 3 stacks), increasing Elemental Skill and Burst DMG by 16%.',
      2: 'Increases Cryo DMG Bonus by 15%. Normal Attacks and Skill casts grant 1 stack of Pale Shroud for 8s (max 3 stacks), increasing Elemental Skill and Burst DMG by 20%.',
      3: 'Increases Cryo DMG Bonus by 18%. Normal Attacks and Skill casts grant 1 stack of Pale Shroud for 8s (max 3 stacks), increasing Elemental Skill and Burst DMG by 24%.',
      4: 'Increases Cryo DMG Bonus by 21%. Normal Attacks and Skill casts grant 1 stack of Pale Shroud for 8s (max 3 stacks), increasing Elemental Skill and Burst DMG by 28%.',
      5: 'Increases Cryo DMG Bonus by 24%. Normal Attacks and Skill casts grant 1 stack of Pale Shroud for 8s (max 3 stacks), increasing Elemental Skill and Burst DMG by 32%.',
      r1: 'Increases Cryo DMG Bonus by 12%. Normal Attacks and Skill casts grant 1 stack of Pale Shroud for 8s (max 3 stacks), increasing Elemental Skill and Burst DMG by 16%.',
      r2: 'Increases Cryo DMG Bonus by 15%. Normal Attacks and Skill casts grant 1 stack of Pale Shroud for 8s (max 3 stacks), increasing Elemental Skill and Burst DMG by 20%.',
      r3: 'Increases Cryo DMG Bonus by 18%. Normal Attacks and Skill casts grant 1 stack of Pale Shroud for 8s (max 3 stacks), increasing Elemental Skill and Burst DMG by 24%.',
      r4: 'Increases Cryo DMG Bonus by 21%. Normal Attacks and Skill casts grant 1 stack of Pale Shroud for 8s (max 3 stacks), increasing Elemental Skill and Burst DMG by 28%.',
      r5: 'Increases Cryo DMG Bonus by 24%. Normal Attacks and Skill casts grant 1 stack of Pale Shroud for 8s (max 3 stacks), increasing Elemental Skill and Burst DMG by 32%.',
    },
  },
  {
    id: 14401,
    name: 'Favonius Codex',
    type: 'Catalyst',
    rarity: 4,
    baseAtkLv90: 510,
    subStat: { type: 'er', key: 'er', label: 'Energy Recharge', displayLabel: 'Energy Recharge', valueLv90: 45.9 },
    passiveName: 'Windfall',
    descriptionTemplate: 'CRIT hits have a {chance}% chance to generate a small amount of Elemental Particles, which will regenerate 6 Energy for the character. Can only occur once every {cd}s.',
    refinements: {
      1: 'CRIT hits have a 60% chance to generate a small amount of Elemental Particles, which will regenerate 6 Energy for the character. Can only occur once every 12s.',
      2: 'CRIT hits have a 70% chance to generate a small amount of Elemental Particles, which will regenerate 6 Energy for the character. Can only occur once every 10.5s.',
      3: 'CRIT hits have a 80% chance to generate a small amount of Elemental Particles, which will regenerate 6 Energy for the character. Can only occur once every 9s.',
      4: 'CRIT hits have a 90% chance to generate a small amount of Elemental Particles, which will regenerate 6 Energy for the character. Can only occur once every 7.5s.',
      5: 'CRIT hits have a 100% chance to generate a small amount of Elemental Particles, which will regenerate 6 Energy for the character. Can only occur once every 6s.',
      r1: 'CRIT hits have a 60% chance to generate a small amount of Elemental Particles, which will regenerate 6 Energy for the character. Can only occur once every 12s.',
      r2: 'CRIT hits have a 70% chance to generate a small amount of Elemental Particles, which will regenerate 6 Energy for the character. Can only occur once every 10.5s.',
      r3: 'CRIT hits have a 80% chance to generate a small amount of Elemental Particles, which will regenerate 6 Energy for the character. Can only occur once every 9s.',
      r4: 'CRIT hits have a 90% chance to generate a small amount of Elemental Particles, which will regenerate 6 Energy for the character. Can only occur once every 7.5s.',
      r5: 'CRIT hits have a 100% chance to generate a small amount of Elemental Particles, which will regenerate 6 Energy for the character. Can only occur once every 6s.',
    },
  },
  {
    id: 14512,
    name: 'Tome of the Eternal Flow',
    type: 'Catalyst',
    rarity: 5,
    baseAtkLv90: 542,
    subStat: { type: 'cd', key: 'cd', label: 'CRIT DMG', displayLabel: 'CRIT DMG', valueLv90: 88.2 },
    passiveName: 'Aeon Wave',
    descriptionTemplate: 'HP is increased by {hp}%. HP changes increase Charged Attack DMG by {dmg}%.',
    refinements: {
      1: 'HP is increased by 16%. When current HP increases or decreases, Charged Attack DMG is increased by 14% for 4s (max 3 stacks). At 3 stacks or refresh, restore 8 Energy.',
      5: 'HP is increased by 32%. When current HP increases or decreases, Charged Attack DMG is increased by 30% for 4s (max 3 stacks). At 3 stacks or refresh, restore 12 Energy.',
      r1: 'HP is increased by 16%. When current HP increases or decreases, Charged Attack DMG is increased by 14% for 4s (max 3 stacks). At 3 stacks or refresh, restore 8 Energy.',
      r5: 'HP is increased by 32%. When current HP increases or decreases, Charged Attack DMG is increased by 30% for 4s (max 3 stacks). At 3 stacks or refresh, restore 12 Energy.',
    },
  },
  {
    id: 14502,
    name: 'Lost Prayer to Sacred Winds',
    type: 'Catalyst',
    rarity: 5,
    baseAtkLv90: 608,
    subStat: { type: 'cr', key: 'cr', label: 'CRIT Rate', displayLabel: 'CRIT Rate', valueLv90: 33.1 },
    passiveName: 'Boundless Blessing',
    descriptionTemplate: 'Increases Movement SPD by 10%. When in battle, gain an {elem_dmg}% Elemental DMG Bonus every 4s.',
    refinements: {
      1: 'Increases Movement SPD by 10%. When in battle, gain an 8% Elemental DMG Bonus every 4s. Max 4 stacks. Lasts until the character falls or leaves combat.',
      5: 'Increases Movement SPD by 10%. When in battle, gain a 16% Elemental DMG Bonus every 4s. Max 4 stacks. Lasts until the character falls or leaves combat.',
      r1: 'Increases Movement SPD by 10%. When in battle, gain an 8% Elemental DMG Bonus every 4s. Max 4 stacks. Lasts until the character falls or leaves combat.',
      r5: 'Increases Movement SPD by 10%. When in battle, gain a 16% Elemental DMG Bonus every 4s. Max 4 stacks. Lasts until the character falls or leaves combat.',
    },
  },
  {
    id: 14506,
    name: "Kagura's Verity",
    type: 'Catalyst',
    rarity: 5,
    baseAtkLv90: 608,
    subStat: { type: 'cd', key: 'cd', label: 'CRIT DMG', displayLabel: 'CRIT DMG', valueLv90: 66.2 },
    passiveName: 'Kagura Dance',
    descriptionTemplate: 'Skill use increases Elemental Skill DMG by {skill_dmg}%.',
    refinements: {
      1: 'Gains the Kagura Dance effect when using an Elemental Skill, causing the Elemental Skill DMG of the wielding character to increase by 12% for 16s. Max 3 stacks. At 3 stacks, gain 12% All Elemental DMG Bonus.',
      5: 'Gains the Kagura Dance effect when using an Elemental Skill, causing the Elemental Skill DMG of the wielding character to increase by 24% for 16s. Max 3 stacks. At 3 stacks, gain 24% All Elemental DMG Bonus.',
      r1: 'Gains the Kagura Dance effect when using an Elemental Skill, causing the Elemental Skill DMG of the wielding character to increase by 12% for 16s. Max 3 stacks. At 3 stacks, gain 12% All Elemental DMG Bonus.',
      r5: 'Gains the Kagura Dance effect when using an Elemental Skill, causing the Elemental Skill DMG of the wielding character to increase by 24% for 16s. Max 3 stacks. At 3 stacks, gain 24% All Elemental DMG Bonus.',
    },
  },
  {
    id: 14511,
    name: 'A Thousand Floating Dreams',
    type: 'Catalyst',
    rarity: 5,
    baseAtkLv90: 542,
    subStat: { type: 'em', key: 'em', label: 'Elemental Mastery', displayLabel: 'Elemental Mastery', valueLv90: 265 },
    passiveName: "A Thousand Nights' Dawnsong",
    descriptionTemplate: 'Party members provide buffs based on element types.',
    refinements: {
      1: 'Party members with same element provide +32 Elemental Mastery; different elements provide +10% DMG Bonus. Nearby party members gain +40 Elemental Mastery.',
      5: 'Party members with same element provide +64 Elemental Mastery; different elements provide +26% DMG Bonus. Nearby party members gain +48 Elemental Mastery.',
      r1: 'Party members with same element provide +32 Elemental Mastery; different elements provide +10% DMG Bonus. Nearby party members gain +40 Elemental Mastery.',
      r5: 'Party members with same element provide +64 Elemental Mastery; different elements provide +26% DMG Bonus. Nearby party members gain +48 Elemental Mastery.',
    },
  },
  {
    id: 14515,
    name: "Surf's Up",
    type: 'Catalyst',
    rarity: 5,
    baseAtkLv90: 542,
    subStat: { type: 'cd', key: 'cd', label: 'CRIT DMG', displayLabel: 'CRIT DMG', valueLv90: 88.2 },
    passiveName: 'Aqua Tempest',
    descriptionTemplate: 'Max HP increased by {hp}%. Skill grants Scorching Summer stacks.',
    refinements: {
      1: 'Max HP increased by 20%. Using an Elemental Skill grants 4 stacks of Scorching Summer, each increasing Normal Attack DMG by 12%.',
      5: 'Max HP increased by 40%. Using an Elemental Skill grants 4 stacks of Scorching Summer, each increasing Normal Attack DMG by 24%.',
      r1: 'Max HP increased by 20%. Using an Elemental Skill grants 4 stacks of Scorching Summer, each increasing Normal Attack DMG by 12%.',
      r5: 'Max HP increased by 40%. Using an Elemental Skill grants 4 stacks of Scorching Summer, each increasing Normal Attack DMG by 24%.',
    },
  },
  {
    id: 14402,
    name: 'The Widsith',
    type: 'Catalyst',
    rarity: 4,
    baseAtkLv90: 510,
    subStat: { type: 'cd', key: 'cd', label: 'CRIT DMG', displayLabel: 'CRIT DMG', valueLv90: 55.1 },
    passiveName: 'Debut',
    descriptionTemplate: 'When taking field, gains random theme song: Recitative (ATK +{atk}%), Aria (All Elem DMG +{elem}%), Interlude (EM +{em}).',
    refinements: {
      1: 'When a character takes the field, they will gain a random theme song for 10s: Recitative: ATK is increased by 60%. Aria: Increases all Elemental DMG by 48%. Interlude: Elemental Mastery is increased by 240.',
      2: 'When a character takes the field, they will gain a random theme song for 10s: Recitative: ATK is increased by 75%. Aria: Increases all Elemental DMG by 60%. Interlude: Elemental Mastery is increased by 300.',
      3: 'When a character takes the field, they will gain a random theme song for 10s: Recitative: ATK is increased by 90%. Aria: Increases all Elemental DMG by 72%. Interlude: Elemental Mastery is increased by 360.',
      4: 'When a character takes the field, they will gain a random theme song for 10s: Recitative: ATK is increased by 105%. Aria: Increases all Elemental DMG by 84%. Interlude: Elemental Mastery is increased by 420.',
      5: 'When a character takes the field, they will gain a random theme song for 10s: Recitative: ATK is increased by 120%. Aria: Increases all Elemental DMG by 96%. Interlude: Elemental Mastery is increased by 480.',
      r1: 'When a character takes the field, they will gain a random theme song for 10s: Recitative: ATK is increased by 60%. Aria: Increases all Elemental DMG by 48%. Interlude: Elemental Mastery is increased by 240.',
      r2: 'When a character takes the field, they will gain a random theme song for 10s: Recitative: ATK is increased by 75%. Aria: Increases all Elemental DMG by 60%. Interlude: Elemental Mastery is increased by 300.',
      r3: 'When a character takes the field, they will gain a random theme song for 10s: Recitative: ATK is increased by 90%. Aria: Increases all Elemental DMG by 72%. Interlude: Elemental Mastery is increased by 360.',
      r4: 'When a character takes the field, they will gain a random theme song for 10s: Recitative: ATK is increased by 105%. Aria: Increases all Elemental DMG by 84%. Interlude: Elemental Mastery is increased by 420.',
      r5: 'When a character takes the field, they will gain a random theme song for 10s: Recitative: ATK is increased by 120%. Aria: Increases all Elemental DMG by 96%. Interlude: Elemental Mastery is increased by 480.',
    },
  },
  {
    id: 14403,
    name: 'Sacrificial Fragments',
    type: 'Catalyst',
    rarity: 4,
    baseAtkLv90: 454,
    subStat: { type: 'em', key: 'em', label: 'Elemental Mastery', displayLabel: 'Elemental Mastery', valueLv90: 221 },
    passiveName: 'Composed',
    descriptionTemplate: 'Skill hit has a {chance}% chance to reset CD.',
    refinements: {
      1: 'After damaging an opponent with an Elemental Skill, the skill has a 40% chance to end its own CD. Can only occur once every 30s.',
      5: 'After damaging an opponent with an Elemental Skill, the skill has an 80% chance to end its own CD. Can only occur once every 16s.',
      r1: 'After damaging an opponent with an Elemental Skill, the skill has a 40% chance to end its own CD. Can only occur once every 30s.',
      r5: 'After damaging an opponent with an Elemental Skill, the skill has an 80% chance to end its own CD. Can only occur once every 16s.',
    },
  },
  {
    id: 14302,
    name: 'Thrilling Tales of Dragon Slayers',
    type: 'Catalyst',
    rarity: 3,
    baseAtkLv90: 401,
    subStat: { type: 'hpPercent', key: 'hpPercent', label: 'HP', displayLabel: 'HP', valueLv90: 35.2 },
    passiveName: 'Heritage',
    descriptionTemplate: 'When switching characters, new active character ATK +{atk}% for 10s.',
    refinements: {
      1: 'When switching characters, the new character taking the field has their ATK increased by 24% for 10s. This effect can only occur once every 20s.',
      5: 'When switching characters, the new character taking the field has their ATK increased by 48% for 10s. This effect can only occur once every 20s.',
      r1: 'When switching characters, the new character taking the field has their ATK increased by 24% for 10s. This effect can only occur once every 20s.',
      r5: 'When switching characters, the new character taking the field has their ATK increased by 48% for 10s. This effect can only occur once every 20s.',
    },
  },
  {
    id: 14501,
    name: 'Skyward Atlas',
    type: 'Catalyst',
    rarity: 5,
    baseAtkLv90: 674,
    subStat: { type: 'atkPercent', key: 'atkPercent', label: 'ATK', displayLabel: 'ATK', valueLv90: 33.1 },
    passiveName: 'Wandering Clouds',
    descriptionTemplate: 'Increases Elemental DMG Bonus by {dmg}%. Normal attacks have a 50% chance to seek opponents.',
    refinements: {
      1: 'Increases Elemental DMG Bonus by 12%. Normal Attack hits have a 50% chance to earn the favor of the clouds, actively seeking out opponents to deal 160% ATK DMG for 15s.',
      5: 'Increases Elemental DMG Bonus by 24%. Normal Attack hits have a 50% chance to earn the favor of the clouds, actively seeking out opponents to deal 320% ATK DMG for 15s.',
      r1: 'Increases Elemental DMG Bonus by 12%. Normal Attack hits have a 50% chance to earn the favor of the clouds, actively seeking out opponents to deal 160% ATK DMG for 15s.',
      r5: 'Increases Elemental DMG Bonus by 24%. Normal Attack hits have a 50% chance to earn the favor of the clouds, actively seeking out opponents to deal 320% ATK DMG for 15s.',
    },
  },

  // ─── Bows ─────────────────────────────────────────────────────
  {
    id: 15509,
    name: 'Aqua Simulacra',
    type: 'Bow',
    rarity: 5,
    baseAtkLv90: 542,
    subStat: { type: 'cd', key: 'cd', label: 'CRIT DMG', displayLabel: 'CRIT DMG', valueLv90: 88.2 },
    passiveName: 'The Cleansing Form',
    descriptionTemplate: 'HP is increased by {hp}%. Foes nearby increase DMG dealt by {dmg}%.',
    refinements: {
      1: 'HP is increased by 16%. When there are opponents nearby, the DMG dealt by the wielder of this weapon is increased by 20%. This will take effect whether the character is on-field or off-field.',
      5: 'HP is increased by 32%. When there are opponents nearby, the DMG dealt by the wielder of this weapon is increased by 40%. This will take effect whether the character is on-field or off-field.',
      r1: 'HP is increased by 16%. When there are opponents nearby, the DMG dealt by the wielder of this weapon is increased by 20%. This will take effect whether the character is on-field or off-field.',
      r5: 'HP is increased by 32%. When there are opponents nearby, the DMG dealt by the wielder of this weapon is increased by 40%. This will take effect whether the character is on-field or off-field.',
    },
  },
  {
    id: 15507,
    name: 'Thundering Pulse',
    type: 'Bow',
    rarity: 5,
    baseAtkLv90: 608,
    subStat: { type: 'cd', key: 'cd', label: 'CRIT DMG', displayLabel: 'CRIT DMG', valueLv90: 66.2 },
    passiveName: 'Rule By Thunder',
    descriptionTemplate: 'Increases ATK by {atk}% and grants Thunder Emblem stacks.',
    refinements: {
      1: 'Increases ATK by 20% and grants Thunder Emblem stacks for 12/24/40% Normal Attack DMG Bonus.',
      5: 'Increases ATK by 40% and grants Thunder Emblem stacks for 24/48/80% Normal Attack DMG Bonus.',
      r1: 'Increases ATK by 20% and grants Thunder Emblem stacks for 12/24/40% Normal Attack DMG Bonus.',
      r5: 'Increases ATK by 40% and grants Thunder Emblem stacks for 24/48/80% Normal Attack DMG Bonus.',
    },
  },
  {
    id: 15506,
    name: 'Polar Star',
    type: 'Bow',
    rarity: 5,
    baseAtkLv90: 608,
    subStat: { type: 'cr', key: 'cr', label: 'CRIT Rate', displayLabel: 'CRIT Rate', valueLv90: 33.1 },
    passiveName: "Daylight's Augur",
    descriptionTemplate: 'Elemental Skill and Elemental Burst DMG increased by {dmg}%. Stacks grant ATK.',
    refinements: {
      1: "Elemental Skill and Elemental Burst DMG increased by 12%. Hits grant Ashen Nightstar stacks for 10/20/30/48% ATK.",
      5: "Elemental Skill and Elemental Burst DMG increased by 24%. Hits grant Ashen Nightstar stacks for 20/40/60/96% ATK.",
      r1: "Elemental Skill and Elemental Burst DMG increased by 12%. Hits grant Ashen Nightstar stacks for 10/20/30/48% ATK.",
      r5: "Elemental Skill and Elemental Burst DMG increased by 24%. Hits grant Ashen Nightstar stacks for 20/40/60/96% ATK.",
    },
  },
  {
    id: 15512,
    name: 'The First Great Magic',
    type: 'Bow',
    rarity: 5,
    baseAtkLv90: 608,
    subStat: { type: 'cd', key: 'cd', label: 'CRIT DMG', displayLabel: 'CRIT DMG', valueLv90: 66.2 },
    passiveName: 'Parsifal the Great',
    descriptionTemplate: 'DMG dealt by Charged Attacks increased by {ca}%. Team elemental composition grants ATK or SPD.',
    refinements: {
      1: 'DMG dealt by Charged Attacks increased by 16%. Party members sharing element grant Gimmick stacks for 16/32/48% ATK; different elements grant Movement SPD by 4/7/10%.',
      5: 'DMG dealt by Charged Attacks increased by 32%. Party members sharing element grant Gimmick stacks for 32/64/96% ATK; different elements grant Movement SPD by 8/12/15%.',
      r1: 'DMG dealt by Charged Attacks increased by 16%. Party members sharing element grant Gimmick stacks for 16/32/48% ATK; different elements grant Movement SPD by 4/7/10%.',
      r5: 'DMG dealt by Charged Attacks increased by 32%. Party members sharing element grant Gimmick stacks for 32/64/96% ATK; different elements grant Movement SPD by 8/12/15%.',
    },
  },
  {
    id: 15503,
    name: 'Elegy for the End',
    type: 'Bow',
    rarity: 5,
    baseAtkLv90: 608,
    subStat: { type: 'er', key: 'er', label: 'Energy Recharge', displayLabel: 'Energy Recharge', valueLv90: 55.1 },
    passiveName: 'The Parting Refrain',
    descriptionTemplate: 'Increases Elemental Mastery by {em}. Millennial Movement buff increases EM and ATK.',
    refinements: {
      1: 'Increases Elemental Mastery by 60. Millennial Movement: Farewell Song increases Elemental Mastery by 100 and ATK by 20% for all party members for 12s.',
      5: 'Increases Elemental Mastery by 120. Millennial Movement: Farewell Song increases Elemental Mastery by 200 and ATK by 40% for all party members for 12s.',
      r1: 'Increases Elemental Mastery by 60. Millennial Movement: Farewell Song increases Elemental Mastery by 100 and ATK by 20% for all party members for 12s.',
      r5: 'Increases Elemental Mastery by 120. Millennial Movement: Farewell Song increases Elemental Mastery by 200 and ATK by 40% for all party members for 12s.',
    },
  },
  {
    id: 15514,
    name: "Astral Vulture's Crimson Plumage",
    type: 'Bow',
    rarity: 5,
    baseAtkLv90: 608,
    subStat: { type: 'cd', key: 'cd', label: 'CRIT DMG', displayLabel: 'CRIT DMG', valueLv90: 66.2 },
    passiveName: 'Shadow of the Lone Plume',
    descriptionTemplate: 'Triggering Swirl grants ATK. Different party elements buff Charged Attack DMG.',
    refinements: {
      1: 'Triggering Swirl grants ATK +24% for 12s. Having different elements in party increases Charged Attack DMG by 20/48/96%.',
      5: 'Triggering Swirl grants ATK +48% for 12s. Having different elements in party increases Charged Attack DMG by 40/96/192%.',
      r1: 'Triggering Swirl grants ATK +24% for 12s. Having different elements in party increases Charged Attack DMG by 20/48/96%.',
      r5: 'Triggering Swirl grants ATK +48% for 12s. Having different elements in party increases Charged Attack DMG by 40/96/192%.',
    },
  },
  {
    id: 15502,
    name: "Amos' Bow",
    type: 'Bow',
    rarity: 5,
    baseAtkLv90: 608,
    subStat: { type: 'atkPercent', key: 'atkPercent', label: 'ATK', displayLabel: 'ATK', valueLv90: 49.6 },
    passiveName: 'Strong-Willed',
    descriptionTemplate: 'Increases Normal Attack and Charged Attack DMG by {dmg}%. Arrow flight time increases DMG.',
    refinements: {
      1: 'Increases Normal Attack and Charged Attack DMG by 12%. Arrows in flight increase DMG by an additional 8% every 0.1s up to 5 times.',
      5: 'Increases Normal Attack and Charged Attack DMG by 24%. Arrows in flight increase DMG by an additional 16% every 0.1s up to 5 times.',
      r1: 'Increases Normal Attack and Charged Attack DMG by 12%. Arrows in flight increase DMG by an additional 8% every 0.1s up to 5 times.',
      r5: 'Increases Normal Attack and Charged Attack DMG by 24%. Arrows in flight increase DMG by an additional 16% every 0.1s up to 5 times.',
    },
  },
  {
    id: 15501,
    name: 'Skyward Harp',
    type: 'Bow',
    rarity: 5,
    baseAtkLv90: 674,
    subStat: { type: 'cr', key: 'cr', label: 'CRIT Rate', displayLabel: 'CRIT Rate', valueLv90: 22.1 },
    passiveName: 'Echoing Ballad',
    descriptionTemplate: 'Increases CRIT DMG by {cd}%. Hits have a chance to inflict small AoE DMG.',
    refinements: {
      1: 'Increases CRIT DMG by 20%. Hits have a 60% chance to inflict a small AoE attack, dealing 125% Physical ATK DMG. Can only occur once every 4s.',
      5: 'Increases CRIT DMG by 40%. Hits have a 100% chance to inflict a small AoE attack, dealing 125% Physical ATK DMG. Can only occur once every 2s.',
      r1: 'Increases CRIT DMG by 20%. Hits have a 60% chance to inflict a small AoE attack, dealing 125% Physical ATK DMG. Can only occur once every 4s.',
      r5: 'Increases CRIT DMG by 40%. Hits have a 100% chance to inflict a small AoE attack, dealing 125% Physical ATK DMG. Can only occur once every 2s.',
    },
  },
  {
    id: 15402,
    name: 'The Stringless',
    type: 'Bow',
    rarity: 4,
    baseAtkLv90: 510,
    subStat: { type: 'em', key: 'em', label: 'Elemental Mastery', displayLabel: 'Elemental Mastery', valueLv90: 165 },
    passiveName: 'Songless Ballad',
    descriptionTemplate: 'Increases Elemental Skill and Elemental Burst DMG by {dmg}%.',
    refinements: {
      1: 'Increases Elemental Skill and Elemental Burst DMG by 24%.',
      5: 'Increases Elemental Skill and Elemental Burst DMG by 48%.',
      r1: 'Increases Elemental Skill and Elemental Burst DMG by 24%.',
      r5: 'Increases Elemental Skill and Elemental Burst DMG by 48%.',
    },
  },
  {
    id: 15405,
    name: 'Rust',
    type: 'Bow',
    rarity: 4,
    baseAtkLv90: 510,
    subStat: { type: 'atkPercent', key: 'atkPercent', label: 'ATK', displayLabel: 'ATK', valueLv90: 41.3 },
    passiveName: 'Rapid Firing',
    descriptionTemplate: 'Increases Normal Attack DMG by {normal}% but decreases Charged Attack DMG by 10%.',
    refinements: {
      1: 'Increases Normal Attack DMG by 40% but decreases Charged Attack DMG by 10%.',
      5: 'Increases Normal Attack DMG by 80% but decreases Charged Attack DMG by 10%.',
      r1: 'Increases Normal Attack DMG by 40% but decreases Charged Attack DMG by 10%.',
      r5: 'Increases Normal Attack DMG by 80% but decreases Charged Attack DMG by 10%.',
    },
  },
  {
    id: 15401,
    name: 'Favonius Warbow',
    type: 'Bow',
    rarity: 4,
    baseAtkLv90: 454,
    subStat: { type: 'er', key: 'er', label: 'Energy Recharge', displayLabel: 'Energy Recharge', valueLv90: 61.3 },
    passiveName: 'Windfall',
    descriptionTemplate: 'CRIT hits have a {chance}% chance to generate a small amount of Elemental Particles.',
    refinements: {
      1: 'CRIT hits have a 60% chance to generate a small amount of Elemental Particles, which will regenerate 6 Energy for the character. CD: 12s.',
      5: 'CRIT hits have a 100% chance to generate a small amount of Elemental Particles, which will regenerate 6 Energy for the character. CD: 6s.',
      r1: 'CRIT hits have a 60% chance to generate a small amount of Elemental Particles, which will regenerate 6 Energy for the character. CD: 12s.',
      r5: 'CRIT hits have a 100% chance to generate a small amount of Elemental Particles, which will regenerate 6 Energy for the character. CD: 6s.',
    },
  },
  {
    id: 15304,
    name: 'Slingshot',
    type: 'Bow',
    rarity: 3,
    baseAtkLv90: 354,
    subStat: { type: 'cr', key: 'cr', label: 'CRIT Rate', displayLabel: 'CRIT Rate', valueLv90: 31.2 },
    passiveName: 'Slingshot',
    descriptionTemplate: 'If a Normal or Charged Attack hits a target within 0.3s of being fired, increases DMG by {dmg}%.',
    refinements: {
      1: 'If a Normal or Charged Attack hits a target within 0.3s of being fired, increases DMG by 36%. Otherwise, decreases DMG by 10%.',
      5: 'If a Normal or Charged Attack hits a target within 0.3s of being fired, increases DMG by 60%. Otherwise, decreases DMG by 10%.',
      r1: 'If a Normal or Charged Attack hits a target within 0.3s of being fired, increases DMG by 36%. Otherwise, decreases DMG by 10%.',
      r5: 'If a Normal or Charged Attack hits a target within 0.3s of being fired, increases DMG by 60%. Otherwise, decreases DMG by 10%.',
    },
  },

  // ─── Claymores ────────────────────────────────────────────────
  {
    id: 12517,
    name: 'Clockwork Heart',
    type: 'Claymore',
    rarity: 5,
    baseAtkLv90: 674,
    subStat: { type: 'cr', key: 'cr', label: 'CRIT Rate', displayLabel: 'CRIT Rate', valueLv90: 22.1 },
    passiveName: 'Marionette Precision',
    descriptionTemplate: 'Increases Cryo and Physical DMG by {dmg}%. Normal or Charged Attacks hitting opponents increase ATK by {atk}% for 12s (max 3 stacks).',
    refinements: {
      1: 'Increases Cryo and Physical DMG by 20%. Normal or Charged Attacks hitting opponents increase ATK by 16% for 12s (max 3 stacks).',
      2: 'Increases Cryo and Physical DMG by 25%. Normal or Charged Attacks hitting opponents increase ATK by 20% for 12s (max 3 stacks).',
      3: 'Increases Cryo and Physical DMG by 30%. Normal or Charged Attacks hitting opponents increase ATK by 24% for 12s (max 3 stacks).',
      4: 'Increases Cryo and Physical DMG by 35%. Normal or Charged Attacks hitting opponents increase ATK by 28% for 12s (max 3 stacks).',
      5: 'Increases Cryo and Physical DMG by 40%. Normal or Charged Attacks hitting opponents increase ATK by 32% for 12s (max 3 stacks).',
      r1: 'Increases Cryo and Physical DMG by 20%. Normal or Charged Attacks hitting opponents increase ATK by 16% for 12s (max 3 stacks).',
      r2: 'Increases Cryo and Physical DMG by 25%. Normal or Charged Attacks hitting opponents increase ATK by 20% for 12s (max 3 stacks).',
      r3: 'Increases Cryo and Physical DMG by 30%. Normal or Charged Attacks hitting opponents increase ATK by 24% for 12s (max 3 stacks).',
      r4: 'Increases Cryo and Physical DMG by 35%. Normal or Charged Attacks hitting opponents increase ATK by 28% for 12s (max 3 stacks).',
      r5: 'Increases Cryo and Physical DMG by 40%. Normal or Charged Attacks hitting opponents increase ATK by 32% for 12s (max 3 stacks).',
    },
  },
  {
    id: 12514,
    name: 'A Thousand Blazing Suns',
    type: 'Claymore',
    rarity: 5,
    baseAtkLv90: 741,
    subStat: { type: 'cd', key: 'cd', label: 'CRIT Rate', displayLabel: 'CRIT Rate', valueLv90: 11.0 },
    passiveName: 'Daybreak of the Blazing Sun',
    descriptionTemplate: 'When the equipping character uses an Elemental Skill or Elemental Burst, they gain the "Scorching Sun" effect: CRIT DMG increases by {cd}%, and ATK increases by {atk}% for 6s. If in Nightsoul\'s Blessing, these effects are increased by 75%.',
    refinements: {
      1: 'When using Elemental Skill or Burst, gain Scorching Sun: CRIT DMG increases by 20%, ATK increases by 28% for 6s. While in Nightsoul\'s Blessing, effects increase by 75%.',
      2: 'When using Elemental Skill or Burst, gain Scorching Sun: CRIT DMG increases by 25%, ATK increases by 35% for 6s. While in Nightsoul\'s Blessing, effects increase by 75%.',
      3: 'When using Elemental Skill or Burst, gain Scorching Sun: CRIT DMG increases by 30%, ATK increases by 42% for 6s. While in Nightsoul\'s Blessing, effects increase by 75%.',
      4: 'When using Elemental Skill or Burst, gain Scorching Sun: CRIT DMG increases by 35%, ATK increases by 49% for 6s. While in Nightsoul\'s Blessing, effects increase by 75%.',
      5: 'When using Elemental Skill or Burst, gain Scorching Sun: CRIT DMG increases by 40%, ATK increases by 56% for 6s. While in Nightsoul\'s Blessing, effects increase by 75%.',
      r1: 'When using Elemental Skill or Burst, gain Scorching Sun: CRIT DMG increases by 20%, ATK increases by 28% for 6s. While in Nightsoul\'s Blessing, effects increase by 75%.',
      r2: 'When using Elemental Skill or Burst, gain Scorching Sun: CRIT DMG increases by 25%, ATK increases by 35% for 6s. While in Nightsoul\'s Blessing, effects increase by 75%.',
      r3: 'When using Elemental Skill or Burst, gain Scorching Sun: CRIT DMG increases by 30%, ATK increases by 42% for 6s. While in Nightsoul\'s Blessing, effects increase by 75%.',
      r4: 'When using Elemental Skill or Burst, gain Scorching Sun: CRIT DMG increases by 35%, ATK increases by 49% for 6s. While in Nightsoul\'s Blessing, effects increase by 75%.',
      r5: 'When using Elemental Skill or Burst, gain Scorching Sun: CRIT DMG increases by 40%, ATK increases by 56% for 6s. While in Nightsoul\'s Blessing, effects increase by 75%.',
    },
  },
  {
    id: 12510,
    name: 'Beacon of the Reed Sea',
    type: 'Claymore',
    rarity: 5,
    baseAtkLv90: 608,
    subStat: { type: 'cr', key: 'cr', label: 'CRIT Rate', displayLabel: 'CRIT Rate', valueLv90: 33.1 },
    passiveName: 'Desert Watch',
    descriptionTemplate: 'Elemental Skill hit grants ATK increase. Taking DMG grants ATK increase.',
    refinements: {
      1: "After the character's Elemental Skill hits an opponent, their ATK will be increased by 20% for 8s. After taking DMG, ATK is increased by 20% for 8s. When not shielded, Max HP is increased by 32%.",
      5: "After the character's Elemental Skill hits an opponent, their ATK will be increased by 40% for 8s. After taking DMG, ATK is increased by 40% for 8s. When not shielded, Max HP is increased by 64%.",
      r1: "After the character's Elemental Skill hits an opponent, their ATK will be increased by 20% for 8s. After taking DMG, ATK is increased by 20% for 8s. When not shielded, Max HP is increased by 32%.",
      r5: "After the character's Elemental Skill hits an opponent, their ATK will be increased by 40% for 8s. After taking DMG, ATK is increased by 40% for 8s. When not shielded, Max HP is increased by 64%.",
    },
  },
  {
    id: 12509,
    name: 'Redhorn Stonethresher',
    type: 'Claymore',
    rarity: 5,
    baseAtkLv90: 542,
    subStat: { type: 'cd', key: 'cd', label: 'CRIT DMG', displayLabel: 'CRIT DMG', valueLv90: 88.2 },
    passiveName: 'Gokadaiou Otogibanashi',
    descriptionTemplate: 'DEF is increased by {def}%. Normal and Charged Attack DMG is increased by {dmg}% of DEF.',
    refinements: {
      1: 'DEF is increased by 28%. Normal and Charged Attack DMG is increased by 40% of DEF.',
      5: 'DEF is increased by 56%. Normal and Charged Attack DMG is increased by 80% of DEF.',
      r1: 'DEF is increased by 28%. Normal and Charged Attack DMG is increased by 40% of DEF.',
      r5: 'DEF is increased by 56%. Normal and Charged Attack DMG is increased by 80% of DEF.',
    },
  },
  {
    id: 12503,
    name: 'Song of Broken Pines',
    type: 'Claymore',
    rarity: 5,
    baseAtkLv90: 741,
    subStat: { type: 'physDmg', key: 'physDmg', label: 'Physical DMG Bonus', displayLabel: 'Physical DMG Bonus', valueLv90: 20.7 },
    passiveName: "Rebel's Banner-Hymn",
    descriptionTemplate: 'Increases ATK by {atk}%. Millennial Movement buff grants Normal ATK SPD and ATK.',
    refinements: {
      1: "Increases ATK by 16%. Millennial Movement: Banner-Hymn increases Normal ATK SPD by 12% and ATK by 20% for 12s.",
      5: "Increases ATK by 32%. Millennial Movement: Banner-Hymn increases Normal ATK SPD by 24% and ATK by 40% for 12s.",
      r1: "Increases ATK by 16%. Millennial Movement: Banner-Hymn increases Normal ATK SPD by 12% and ATK by 20% for 12s.",
      r5: "Increases ATK by 32%. Millennial Movement: Banner-Hymn increases Normal ATK SPD by 24% and ATK by 40% for 12s.",
    },
  },
  {
    id: 12502,
    name: "Wolf's Gravestone",
    type: 'Claymore',
    rarity: 5,
    baseAtkLv90: 608,
    subStat: { type: 'atkPercent', key: 'atkPercent', label: 'ATK', displayLabel: 'ATK', valueLv90: 49.6 },
    passiveName: 'Wolfish Tracker',
    descriptionTemplate: 'Increases ATK by {atk}%. Attacks against opponents with less than 30% HP increase all party members\' ATK.',
    refinements: {
      1: "Increases ATK by 20%. On hit, attacks against opponents with less than 30% HP increase all party members' ATK by 40% for 12s. Can only occur once every 30s.",
      5: "Increases ATK by 40%. On hit, attacks against opponents with less than 30% HP increase all party members' ATK by 80% for 12s. Can only occur once every 30s.",
      r1: "Increases ATK by 20%. On hit, attacks against opponents with less than 30% HP increase all party members' ATK by 40% for 12s. Can only occur once every 30s.",
      r5: "Increases ATK by 40%. On hit, attacks against opponents with less than 30% HP increase all party members' ATK by 80% for 12s. Can only occur once every 30s.",
    },
  },
  {
    id: 12513,
    name: 'Fang of the Mountain King',
    type: 'Claymore',
    rarity: 5,
    baseAtkLv90: 608,
    subStat: { type: 'cr', key: 'cr', label: 'CRIT Rate', displayLabel: 'CRIT Rate', valueLv90: 33.1 },
    passiveName: 'Turquoise Dawn',
    descriptionTemplate: "Gain Canopy's Favor when hitting an opponent with an Elemental Skill or triggering Burning/Burgeon.",
    refinements: {
      1: "Gain 1 stack of Canopy's Favor when hitting an opponent with an Elemental Skill or triggering Burning/Burgeon, increasing Elemental Skill and Burst DMG by 10% for 6s (max 6 stacks).",
      5: "Gain 1 stack of Canopy's Favor when hitting an opponent with an Elemental Skill or triggering Burning/Burgeon, increasing Elemental Skill and Burst DMG by 20% for 6s (max 6 stacks).",
      r1: "Gain 1 stack of Canopy's Favor when hitting an opponent with an Elemental Skill or triggering Burning/Burgeon, increasing Elemental Skill and Burst DMG by 10% for 6s (max 6 stacks).",
      r5: "Gain 1 stack of Canopy's Favor when hitting an opponent with an Elemental Skill or triggering Burning/Burgeon, increasing Elemental Skill and Burst DMG by 20% for 6s (max 6 stacks).",
    },
  },
  {
    id: 12511,
    name: 'Verdict',
    type: 'Claymore',
    rarity: 5,
    baseAtkLv90: 674,
    subStat: { type: 'cr', key: 'cr', label: 'CRIT Rate', displayLabel: 'CRIT Rate', valueLv90: 22.1 },
    passiveName: 'Many Oaths of Dawn and Dusk',
    descriptionTemplate: 'Increases ATK by {atk}%. Crystallize seals grant Elemental Skill DMG.',
    refinements: {
      1: 'Increases ATK by 20%. Obtaining Elemental Shards from Crystallize reactions grants 1 Seal, increasing Elemental Skill DMG by 18% (max 2 seals).',
      5: 'Increases ATK by 40%. Obtaining Elemental Shards from Crystallize reactions grants 1 Seal, increasing Elemental Skill DMG by 36% (max 2 seals).',
      r1: 'Increases ATK by 20%. Obtaining Elemental Shards from Crystallize reactions grants 1 Seal, increasing Elemental Skill DMG by 18% (max 2 seals).',
      r5: 'Increases ATK by 40%. Obtaining Elemental Shards from Crystallize reactions grants 1 Seal, increasing Elemental Skill DMG by 36% (max 2 seals).',
    },
  },
  {
    id: 12409,
    name: 'Serpent Spine',
    type: 'Claymore',
    rarity: 4,
    baseAtkLv90: 510,
    subStat: { type: 'cr', key: 'cr', label: 'CRIT Rate', displayLabel: 'CRIT Rate', valueLv90: 27.6 },
    passiveName: 'Wavesplitter',
    descriptionTemplate: 'Every 4s on field, deal {deal}% more DMG and take {take}% more DMG. Max 5 stacks.',
    refinements: {
      1: 'Every 4s a character is on the field, they will deal 6% more DMG and take 3% more DMG. Max 5 stacks.',
      5: 'Every 4s a character is on the field, they will deal 10% more DMG and take 1.8% more DMG. Max 5 stacks.',
      r1: 'Every 4s a character is on the field, they will deal 6% more DMG and take 3% more DMG. Max 5 stacks.',
      r5: 'Every 4s a character is on the field, they will deal 10% more DMG and take 1.8% more DMG. Max 5 stacks.',
    },
  },
];

/**
 * Normalized dictionary mapping numeric weapon IDs to WeaponMetadata.
 */
export const WEAPON_DATA: Record<number, WeaponMetadata> = {};

/**
 * Normalized dictionary mapping normalized weapon names to WeaponMetadata.
 */
export const WEAPON_DATA_BY_NAME: Record<string, WeaponMetadata> = {};

/**
 * Alternate ID aliases for community / Enka fixture discrepancies.
 */
const WEAPON_ID_ALIASES: Record<number, number> = {
  13501: 11510, // Staff of Homa (canonical game polearm ID -> fixture ID)
  13509: 11509, // Engulfing Lightning
  13505: 11501, // Primordial Jade Winged-Spear
  13414: 11415, // The Catch
  13401: 11403, // Dragon's Bane
  13407: 11406, // Favonius Lance
  13502: 11504, // Skyward Spine
  12501: 12502, // Wolf's Gravestone
  14513: 14512, // Tome of the Eternal Flow
  15508: 15509, // Aqua Simulacra
};

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// ─── Refinement Interpolation & Special Overrides ──────────────────────────

/**
 * Linearly interpolates numeric parameters between authentic R1 and R5 in-game strings.
 */
function interpolateRank(r1Text: string, r5Text: string, r: number): string | null {
  const tokens1 = r1Text.split(/(\d+(?:\.\d+)?)/);
  const tokens5 = r5Text.split(/(\d+(?:\.\d+)?)/);
  if (tokens1.length !== tokens5.length) return null;

  const result: string[] = [];
  for (let i = 0; i < tokens1.length; i++) {
    if (i % 2 === 1) {
      const n1 = parseFloat(tokens1[i]);
      const n5 = parseFloat(tokens5[i]);
      if (tokens1[i] === tokens5[i]) {
        result.push(tokens1[i]);
      } else {
        const val = n1 + ((n5 - n1) / 4) * (r - 1);
        const precision = Math.max(
          (tokens1[i].split('.')[1] || '').length,
          (tokens5[i].split('.')[1] || '').length
        );
        const str = Number.isInteger(val)
          ? val.toString()
          : val.toFixed(Math.max(precision, 1)).replace(/\.?0+$/, '');
        result.push(str);
      }
    } else {
      result.push(tokens1[i]);
    }
  }
  return result.join('');
}

const SPECIAL_REFINEMENT_OVERRIDES: Record<string, Record<number, string>> = {
  'Sacrificial Sword': {
    2: 'After damaging an opponent with an Elemental Skill, the skill has a 50% chance to end its own CD. Can only occur once every 26s.',
    3: 'After damaging an opponent with an Elemental Skill, the skill has a 60% chance to end its own CD. Can only occur once every 22s.',
    4: 'After damaging an opponent with an Elemental Skill, the skill has a 70% chance to end its own CD. Can only occur once every 19s.',
  },
  'Sacrificial Fragments': {
    2: 'After damaging an opponent with an Elemental Skill, the skill has a 50% chance to end its own CD. Can only occur once every 26s.',
    3: 'After damaging an opponent with an Elemental Skill, the skill has a 60% chance to end its own CD. Can only occur once every 22s.',
    4: 'After damaging an opponent with an Elemental Skill, the skill has a 70% chance to end its own CD. Can only occur once every 19s.',
  },
  'Lost Prayer to Sacred Winds': {
    2: 'Increases Movement SPD by 10%. When in battle, gain a 10% Elemental DMG Bonus every 4s. Max 4 stacks. Lasts until the character falls or leaves combat.',
    3: 'Increases Movement SPD by 10%. When in battle, gain a 12% Elemental DMG Bonus every 4s. Max 4 stacks. Lasts until the character falls or leaves combat.',
    4: 'Increases Movement SPD by 10%. When in battle, gain a 14% Elemental DMG Bonus every 4s. Max 4 stacks. Lasts until the character falls or leaves combat.',
  },
};

// Guarantee all 57 weapons have complete, non-placeholder R1-R5 descriptions
for (const weapon of WEAPON_LIST) {
  const r1 = weapon.refinements[1] || weapon.refinements.r1;
  const r5 = weapon.refinements[5] || weapon.refinements.r5;

  for (let r = 1; r <= 5; r++) {
    const existing = weapon.refinements[r] || weapon.refinements[`r${r}`];
    if (!existing || (typeof existing === 'string' && existing.includes('{'))) {
      const text =
        SPECIAL_REFINEMENT_OVERRIDES[weapon.name]?.[r] ||
        (r1 && r5 ? interpolateRank(r1, r5, r) : null) ||
        r1 ||
        '';
      weapon.refinements[r] = text;
      weapon.refinements[`r${r}`] = text;
    } else {
      if (!weapon.refinements[r]) {
        weapon.refinements[r] = existing;
      }
      if (!weapon.refinements[`r${r}`]) {
        weapon.refinements[`r${r}`] = existing;
      }
    }
  }
}

// Populate primary lookup dictionaries
for (const weapon of WEAPON_LIST) {
  WEAPON_DATA[weapon.id] = weapon;
  WEAPON_DATA_BY_NAME[normalizeName(weapon.name)] = weapon;
}

// Populate aliases
for (const [aliasId, canonicalId] of Object.entries(WEAPON_ID_ALIASES)) {
  const target = WEAPON_DATA[canonicalId];
  if (target) {
    WEAPON_DATA[Number(aliasId)] = target;
  }
}

if (WEAPON_DATA[14525]) {
  WEAPON_DATA_BY_NAME[normalizeName('Starsealed Edict')] = WEAPON_DATA[14525];
}

/**
 * Robust weapon passive lookup helper.
 * Clamps refinement level between 1 and 5.
 * Resolves by numeric ID (primary + aliases) or string weapon name.
 *
 * @param weaponId Numeric weapon ID or string weapon name
 * @param refinement Refinement rank (1 to 5)
 */
export function getWeaponPassive(
  weaponId: number | string,
  refinement: number = 1
): { passiveName?: string; passiveDescription?: string } {
  const r = Math.min(Math.max(refinement || 1, 1), 5);

  let weapon: WeaponMetadata | undefined;

  if (typeof weaponId === 'number') {
    weapon = WEAPON_DATA[weaponId];
  }

  if (!weapon) {
    const key = normalizeName(String(weaponId));
    weapon = WEAPON_DATA_BY_NAME[key];
  }

  if (!weapon) {
    return {};
  }

  let passiveDescription = weapon.refinements[r] || weapon.refinements[`r${r}`];
  if (!passiveDescription || passiveDescription.includes('{')) {
    const r1 = weapon.refinements[1] || weapon.refinements.r1;
    const r5 = weapon.refinements[5] || weapon.refinements.r5;
    passiveDescription =
      SPECIAL_REFINEMENT_OVERRIDES[weapon.name]?.[r] ||
      (r1 && r5 ? interpolateRank(r1, r5, r) : null) ||
      r1 ||
      '';
  }

  return {
    passiveName: weapon.passiveName,
    passiveDescription,
  };
}

/**
 * Retrieves full weapon metadata by ID or name.
 */
export function getWeaponMetadata(weaponId: number | string): WeaponMetadata | undefined {
  if (typeof weaponId === 'number') {
    return WEAPON_DATA[weaponId];
  }
  return WEAPON_DATA_BY_NAME[normalizeName(String(weaponId))];
}

/**
 * Resolves a human-readable weapon name from static metadata when a parsed
 * or cached weapon entry only contains an empty string or numeric fallback ("Weapon <id>").
 */
export function resolveWeaponName(weaponId: number, currentName?: string): string {
  const trimmed = currentName?.trim();
  if (trimmed && !/^Weapon\s+\d+$/i.test(trimmed)) {
    return trimmed;
  }
  return WEAPON_DATA[weaponId]?.name || trimmed || `Weapon ${weaponId}`;
}
