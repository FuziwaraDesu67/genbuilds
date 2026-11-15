// Character damage calculation configurations based on KeqingMains (KQM) Theorycrafting Library
// Reference: https://library.keqingmains.com/combat-mechanics/damage/damage-formula

export interface DamageConfig {
  characterId: number;
  characterName: string;
  primaryTalent: 'normal' | 'skill' | 'burst';
  scalingStat?: 'atk' | 'hp' | 'def' | 'em' | 'hybrid';
  baseMultiplier: number; // Base talent multiplier at level 1 (e.g. 2.43 = 243%)
  talentScaling?: number; // Scaling per talent level (default ~0.08)
  skillMultiplier?: number; // Elemental Skill base multiplier at Lv 1
  burstMultiplier?: number; // Elemental Burst base multiplier at Lv 1
  secondaryStat?: 'atk' | 'hp' | 'def' | 'em';
  secondaryMultiplier?: number; // e.g. Alhaitham / Nahida EM portion
  reactionType?: 'Vaporize' | 'Melt' | 'Aggravate' | 'Spread' | 'Swirl' | 'None';
  reactionAmplification?: 'ForwardVape' | 'ReverseVape' | 'ForwardMelt' | 'ReverseMelt';
  reactionAdditive?: 'Aggravate' | 'Spread';
  reactionMultiplier?: number; // Optional manual override
  additionalMultipliers?: Record<string, number>; // Passive talents, buffs, BoL, etc.
  flatBonus?: number; // Flat damage additions (Yun Jin, Shenhe, etc.)
  defIgnorePercent?: number; // DEF ignore (e.g. Raiden C2 60%)
  resShredPercent?: number; // RES shred (e.g. 4pc VV 40%)
  rotation?: string[]; // Human-readable rotation steps
  notes?: string;
}

export const damageConfigs: Record<number, DamageConfig> = {
  // ─── Pyro DPS ─────────────────────────────────────────────────────────────
  // Hu Tao (10000046) - Reverse Vaporize Charged Attack
  10000046: {
    characterId: 10000046,
    characterName: 'Hu Tao',
    primaryTalent: 'normal',
    scalingStat: 'atk',
    baseMultiplier: 2.426, // CA multiplier at Lv 1 (Lv 10 = ~242.6% * (1 + 9 * 0.088) ~ 435%)
    talentScaling: 0.088,
    skillMultiplier: 1.15,
    burstMultiplier: 4.95,
    reactionType: 'Vaporize',
    reactionAmplification: 'ReverseVape', // Pyro on Hydro (1.5x + EM)
    additionalMultipliers: {
      'E Guide to Afterlife (HP to ATK)': 1.12, // Net boost factoring E ATK conversion
      'A4 Sanguine Rouge (<50% HP)': 1.33, // +33% Pyro DMG
    },
    rotation: [
      'E Guide to Afterlife (HP converted to ATK)',
      'N1C Charged Attack with Reverse Vaporize',
      'Assumes <50% HP for Sanguine Rouge (+33% Pyro DMG)',
      'Q Spirit Soother finisher with Vaporize',
    ],
    notes: 'KQM Standard: Single vaporized N1C charged attack with active E and A4 passive',
  },

  // Arlecchino (10000093) - Normal Attack with Masque of the Red Death
  10000093: {
    characterId: 10000093,
    characterName: 'Arlecchino',
    primaryTalent: 'normal',
    scalingStat: 'atk',
    baseMultiplier: 2.15,
    talentScaling: 0.087,
    skillMultiplier: 2.67,
    burstMultiplier: 6.67,
    reactionType: 'Vaporize',
    reactionAmplification: 'ReverseVape',
    additionalMultipliers: {
      'Masque of the Red Death (BoL)': 1.45, // High BoL normal attack conversion
      'A4 The Balemoon Alone': 1.20, // Pyro DMG bonus from ATK over 1000
    },
    rotation: [
      'E All Is Ash → Blood-Debt Directive',
      'Charged Attack claim → Max Bond of Life (145% BoL)',
      'N5 Normal Attack combo with Masque of the Red Death',
    ],
    notes: 'KQM Standard: N5 normal attack string with active Masque of the Red Death and BoL',
  },

  // Yoimiya (10000056) - Niwabi Fire-Dance Normal Attacks
  10000056: {
    characterId: 10000056,
    characterName: 'Yoimiya',
    primaryTalent: 'normal',
    scalingStat: 'atk',
    baseMultiplier: 3.45,
    talentScaling: 0.088,
    skillMultiplier: 1.617,
    burstMultiplier: 2.27,
    reactionType: 'Vaporize',
    reactionAmplification: 'ReverseVape',
    additionalMultipliers: {
      'Niwabi Fire-Dance Infusion': 1.617, // ~161.7% Blazing Arrow conversion
      'A2 Tricks of the Trouble-Maker': 1.20, // +20% Pyro DMG at 10 stacks
    },
    rotation: [
      'E Niwabi Fire-Dance Infusion',
      'N5 Normal Attack String (Vaporize on N1, N3, N5)',
    ],
    notes: 'KQM Standard: Full N5 normal attack chain with Niwabi Fire-Dance infusion and Vaporize',
  },

  // Mavuika (10000106) - Nightsoul Ancient Sacred Flame
  10000106: {
    characterId: 10000106,
    characterName: 'Mavuika',
    primaryTalent: 'skill',
    scalingStat: 'atk',
    baseMultiplier: 4.85,
    talentScaling: 0.092,
    skillMultiplier: 4.85,
    burstMultiplier: 11.20,
    reactionType: 'Melt',
    reactionAmplification: 'ForwardMelt', // 2.0x base
    additionalMultipliers: {
      'Nightsoul Fighting Spirit': 1.35,
    },
    rotation: [
      'Nightsoul Burst Trigger → Flamestrider State',
      'Blazing Wheel Slash with Melt reaction',
    ],
    notes: 'KQM Standard: Nightsoul empowered strike with forward Melt',
  },

  // Xiangling (10000023) - Pyronado Reverse Vaporize
  10000023: {
    characterId: 10000023,
    characterName: 'Xiangling',
    primaryTalent: 'burst',
    scalingStat: 'atk',
    baseMultiplier: 2.38,
    talentScaling: 0.085,
    skillMultiplier: 2.00,
    burstMultiplier: 2.38,
    reactionType: 'Vaporize',
    reactionAmplification: 'ReverseVape',
    additionalMultipliers: {
      'Pyronado Snapshot': 1.15,
    },
    rotation: [
      'Guoba E → Pyronado Q with continuous Reverse Vaporize',
    ],
    notes: 'KQM Standard: Snapshot Pyronado with 100% Reverse Vaporize uptime',
  },

  // ─── Hydro DPS ────────────────────────────────────────────────────────────
  // Neuvillette (10000087) - Equitable Judgment Charged Attack (Pure HP Scaling)
  10000087: {
    characterId: 10000087,
    characterName: 'Neuvillette',
    primaryTalent: 'normal',
    scalingStat: 'hp', // Pure HP scaler!
    baseMultiplier: 0.1447, // 14.47% Max HP per tick at Lv 10 (~8 ticks = ~115.7% Max HP)
    talentScaling: 0.075,
    skillMultiplier: 0.2316,
    burstMultiplier: 0.4005,
    reactionType: 'None',
    additionalMultipliers: {
      'A1 Past Glories (3 Draconic Stacks)': 1.60, // 160% CA DMG
      'A4 Discipline of the Supreme': 1.30, // +30% Hydro DMG at >80% HP
      'Full 8-Tick Beam Total': 8.0, // 8 continuous ticks of Equitable Judgment
    },
    rotation: [
      'E O Tears → Q O Tides → 6 Sourcewater Droplets',
      'Charged Attack: Equitable Judgment (Full 8-tick Empowered Beam)',
      'Assumes 3 Past Glories Draconic Stacks (160% multiplier)',
    ],
    notes: 'KQM Standard: Full 8-tick Equitable Judgment charged attack beam scaling on Max HP',
  },

  // Furina (10000089) - Salon Solitaire & Fanfare (Pure HP Scaling)
  10000089: {
    characterId: 10000089,
    characterName: 'Furina',
    primaryTalent: 'skill',
    scalingStat: 'hp',
    baseMultiplier: 0.140, // Crabaletta strike ~14% Max HP
    talentScaling: 0.08,
    skillMultiplier: 0.140,
    burstMultiplier: 0.25,
    reactionType: 'None',
    additionalMultipliers: {
      'Max Fanfare (300 Stacks)': 1.75, // +75% DMG bonus
      'Salon Members Combined Wave': 2.20,
    },
    rotation: [
      'E Salon Solitaire (Crabaletta, Chevalmarin, Usher)',
      'Q Let the People Rejoice (Max Fanfare DMG Bonus)',
    ],
    notes: 'KQM Standard: Salon Solitaire team attack coordinated with Max Fanfare burst',
  },

  // Yelan (10000060) - Depth-Clarion Dice (Pure HP Scaling)
  10000060: {
    characterId: 10000060,
    characterName: 'Yelan',
    primaryTalent: 'burst',
    scalingStat: 'hp',
    baseMultiplier: 0.0877, // 8.77% Max HP per arrow x 3 arrows
    talentScaling: 0.078,
    skillMultiplier: 0.407,
    burstMultiplier: 0.263, // 3 arrows combined = ~26.3% Max HP per wave
    reactionType: 'Vaporize',
    reactionAmplification: 'ForwardVape',
    additionalMultipliers: {
      '3-Arrow Wave Multiplier': 3.0,
      'A4 Adapt with Ease (Avg)': 1.25, // Mid-duration ramp buff
    },
    rotation: [
      'E Lingering Lifeline → Q Depth-Clarion Dice',
      'Exquisite Throw coordinated wave (3 water arrows)',
    ],
    notes: 'KQM Standard: Exquisite Throw 3-arrow coordinated volley scaling on Max HP',
  },

  // Mualani (10000102) - Sharky Bite Forward Vaporize (Pure HP Scaling)
  10000102: {
    characterId: 10000102,
    characterName: 'Mualani',
    primaryTalent: 'skill',
    scalingStat: 'hp',
    baseMultiplier: 0.198, // Sharky Bite 19.8% Max HP
    talentScaling: 0.085,
    skillMultiplier: 0.198,
    burstMultiplier: 0.85,
    reactionType: 'Vaporize',
    reactionAmplification: 'ForwardVape', // Hydro on Pyro = 2.0x base
    additionalMultipliers: {
      '3 Wavechaser Momentum Stacks': 2.05, // +40.5% Max HP bonus
    },
    rotation: [
      'E Nightsoul Blessing: Sharky Surf → 3 Target Marks',
      '3 Wavechaser Stacks → Forward Vaporized Sharky Bite (2.0x base)',
    ],
    notes: 'KQM Standard: Max momentum forward vaporized Sharky Bite scaling on Max HP',
  },

  // Tartaglia / Childe (10000033) - Havoc: Obliteration Forward Vaporize
  10000033: {
    characterId: 10000033,
    characterName: 'Tartaglia',
    primaryTalent: 'burst',
    scalingStat: 'atk',
    baseMultiplier: 8.35, // Melee Burst at Lv 10 = ~835%
    talentScaling: 0.09,
    skillMultiplier: 1.45,
    burstMultiplier: 8.35,
    reactionType: 'Vaporize',
    reactionAmplification: 'ForwardVape', // Hydro on Pyro = 2.0x base
    additionalMultipliers: {
      'Riptide Blast': 1.20,
    },
    rotation: [
      'Apply Pyro → E Foul Legacy Melee Stance → Q Havoc: Obliteration Forward Vaporize',
    ],
    notes: 'KQM Standard: Melee stance burst with forward Vaporize and Riptide detonation',
  },

  // ─── Cryo DPS ─────────────────────────────────────────────────────────────
  // Kamisato Ayaka (10000042) - Soumetsu Blizzard Burst
  10000042: {
    characterId: 10000042,
    characterName: 'Kamisato Ayaka',
    primaryTalent: 'burst',
    scalingStat: 'atk',
    baseMultiplier: 20.20, // 20 ticks of Frostflake Sekki combined
    talentScaling: 0.085,
    skillMultiplier: 4.30,
    burstMultiplier: 20.20,
    reactionType: 'None',
    additionalMultipliers: {
      'A1 Amatsumi Kunitsumi': 1.30, // +30% Normal/Charged DMG
      'Frozen Enemy RES / Blizzard': 1.15,
    },
    rotation: [
      'Dash Senho (Infusion + Cryo DMG) → E Hyouka → Q Soumetsu (Full 20 Ticks on Frozen Enemy)',
    ],
    notes: 'KQM Standard: Full 20-tick Soumetsu blizzard burst against Frozen target',
  },

  // Ganyu (10000037) - Frostflake Arrow + Bloom Reverse Melt
  10000037: {
    characterId: 10000037,
    characterName: 'Ganyu',
    primaryTalent: 'normal',
    scalingStat: 'atk',
    baseMultiplier: 6.22, // Frostflake Arrow (230%) + Frostflake Bloom (392%) combined
    talentScaling: 0.082,
    skillMultiplier: 2.37,
    burstMultiplier: 1.26,
    reactionType: 'Melt',
    reactionAmplification: 'ReverseMelt', // Cryo on Pyro = 1.5x base
    additionalMultipliers: {
      'A1 Undivided Heart': 1.20, // +20% Frostflake CRIT Rate
    },
    rotation: [
      'Charged Attack Lv 2: Frostflake Arrow + Bloom (Both Reverse Melted)',
    ],
    notes: 'KQM Standard: Level 2 charged shot Frostflake Arrow + Bloom with Reverse Melt',
  },

  // Wriothesley (10000086) - Chilling Penalty Melt
  10000086: {
    characterId: 10000086,
    characterName: 'Wriothesley',
    primaryTalent: 'normal',
    scalingStat: 'atk',
    baseMultiplier: 3.80,
    talentScaling: 0.086,
    skillMultiplier: 1.70,
    burstMultiplier: 5.10,
    reactionType: 'Melt',
    reactionAmplification: 'ReverseMelt',
    additionalMultipliers: {
      'Chilling Penalty Multiplier': 1.68,
      'A1 There Shall Be a Plea': 1.50, // Rebuke: Vaulting Fist +50% DMG
    },
    rotation: [
      'E Icefang Rush → N5 Normal Combo → Rebuke: Vaulting Fist CA with Reverse Melt',
    ],
    notes: 'KQM Standard: Chilling Penalty enhanced normal string and enhanced CA with Melt',
  },

  // Citlali (10000107) - Spirit Tempest Melt
  10000107: {
    characterId: 10000107,
    characterName: 'Citlali',
    primaryTalent: 'burst',
    scalingStat: 'hybrid',
    baseMultiplier: 4.50,
    talentScaling: 0.085,
    secondaryStat: 'em',
    secondaryMultiplier: 3.20,
    skillMultiplier: 2.10,
    burstMultiplier: 4.50,
    reactionType: 'Melt',
    reactionAmplification: 'ReverseMelt',
    rotation: [
      'E Itzpapa Shield → Q Spirit Tempest with Melt procs',
    ],
    notes: 'KQM Standard: Cryo spirit tempest burst scaling with ATK and EM with Melt',
  },

  // ─── Electro DPS ──────────────────────────────────────────────────────────
  // Raiden Shogun (10000052) - Musou no Hitotachi (ATK + ER Scaling)
  10000052: {
    characterId: 10000052,
    characterName: 'Raiden Shogun',
    primaryTalent: 'burst',
    scalingStat: 'atk',
    baseMultiplier: 7.21, // Initial Slash Lv 10 = ~721%
    talentScaling: 0.093,
    skillMultiplier: 2.11,
    burstMultiplier: 7.21,
    reactionType: 'Aggravate',
    reactionAdditive: 'Aggravate',
    additionalMultipliers: {
      'Chakra Desiderata (60 Resolve)': 1.42, // +39.6% initial slash + resolve
      'Eye of Stormy Judgment': 1.27, // +0.3% Burst DMG per energy cost (90 * 0.3% = +27%)
    },
    rotation: [
      'E Eye of Stormy Judgment → 60 Resolve Stacks',
      'Q Secret Art: Musou Shinsetsu Initial Slash with Aggravate',
      'Musou Isshin N3C sword chain',
    ],
    notes: 'KQM Standard: Max resolve Musou no Hitotachi initial slash with Eye of Stormy Judgment',
  },

  // Keqing (10000041) - Starward Sword Aggravate
  10000041: {
    characterId: 10000041,
    characterName: 'Keqing',
    primaryTalent: 'burst',
    scalingStat: 'atk',
    baseMultiplier: 8.43, // Starward Sword 10 slashes combined
    talentScaling: 0.088,
    skillMultiplier: 3.60,
    burstMultiplier: 8.43,
    reactionType: 'Aggravate',
    reactionAdditive: 'Aggravate',
    additionalMultipliers: {
      'Aggravate Multi-Proc Bonus': 1.30,
    },
    rotation: [
      'EE Stellar Restoration (Electro Infusion) → Q Starward Sword with Aggravate',
    ],
    notes: 'KQM Standard: Full Starward Sword burst with multiple Aggravate procs',
  },

  // Yae Miko (10000058) - Sesshou Sakura Aggravate (ATK + EM Scaling)
  10000058: {
    characterId: 10000058,
    characterName: 'Yae Miko',
    primaryTalent: 'skill',
    scalingStat: 'atk',
    baseMultiplier: 6.13, // 3 Tier-IV Sesshou Sakura strikes
    talentScaling: 0.085,
    skillMultiplier: 6.13,
    burstMultiplier: 22.70, // Great Secret Art: Tenko Kenshin 4 strikes
    reactionType: 'Aggravate',
    reactionAdditive: 'Aggravate',
    additionalMultipliers: {
      'A4 Enlightened Blessing (EM to DMG)': 1.25,
    },
    rotation: [
      'EEE Sesshou Sakura Tier IV Placement → Coordinated Strikes with Aggravate',
      'Q Tenko Kenshin Burst Finisher',
    ],
    notes: 'KQM Standard: Tier IV Sesshou Sakura coordinated strikes with Aggravate',
  },

  // Clorinde (10000098) - Swift Hunt Normal Attacks with BoL
  10000098: {
    characterId: 10000098,
    characterName: 'Clorinde',
    primaryTalent: 'normal',
    scalingStat: 'atk',
    baseMultiplier: 4.20,
    talentScaling: 0.088,
    skillMultiplier: 3.10,
    burstMultiplier: 11.50,
    reactionType: 'Aggravate',
    reactionAdditive: 'Aggravate',
    additionalMultipliers: {
      'Bond of Life Wild Hunt': 1.38,
    },
    rotation: [
      'E Hunter\'s Vigil → Swift Hunt Pistole Strikes (BoL Generation) → Impale the Night',
    ],
    notes: 'KQM Standard: Swift Hunt pierce shooting string and max BoL Impale the Night with Aggravate',
  },

  // ─── Dendro DPS ───────────────────────────────────────────────────────────
  // Alhaitham (10000078) - Chisel-Light Mirror Projection (ATK + EM Scaling)
  10000078: {
    characterId: 10000078,
    characterName: 'Alhaitham',
    primaryTalent: 'skill',
    scalingStat: 'hybrid', // Hybrid ATK + EM
    baseMultiplier: 1.21, // ~121% ATK per wave
    secondaryStat: 'em',
    secondaryMultiplier: 2.42, // ~242% EM per wave
    talentScaling: 0.088,
    skillMultiplier: 3.52,
    burstMultiplier: 6.20,
    reactionType: 'Spread',
    reactionAdditive: 'Spread',
    additionalMultipliers: {
      '3-Mirror Projection Wave': 3.0,
      'A4 Mysteries Laid Bare': 1.25, // Up to +100% Projection DMG based on EM
    },
    rotation: [
      'Hold E / Q Burst → 3 Chisel-Light Mirrors Active',
      'Projection Attack Wave with Dendro Spread Reaction',
    ],
    notes: 'KQM Standard: 3-Mirror Chisel-Light Projection Attack wave with Spread scaling on ATK + EM',
  },

  // Nahida (10000073) - Tri-Karma Purification (ATK + EM Scaling)
  10000073: {
    characterId: 10000073,
    characterName: 'Nahida',
    primaryTalent: 'skill',
    scalingStat: 'hybrid',
    baseMultiplier: 1.858, // 185.8% ATK at Lv 10
    secondaryStat: 'em',
    secondaryMultiplier: 3.715, // 371.5% EM at Lv 10
    talentScaling: 0.086,
    skillMultiplier: 1.858,
    burstMultiplier: 1.0,
    reactionType: 'Spread',
    reactionAdditive: 'Spread',
    additionalMultipliers: {
      'A4 Awakening Elucidated': 1.35, // Up to +80% DMG & +24% CR based on EM
      'Shrine of Maya Pyro Buff': 1.25,
    },
    rotation: [
      'Q Illusory Heart → E Hold: All Schemes to Know (Seed of Skandha)',
      'Tri-Karma Purification Spread Trigger',
    ],
    notes: 'KQM Standard: Tri-Karma Purification proc with Spread under Shrine of Maya',
  },

  // Kinich (10000101) - Scalespiker Cannon Spikeshot
  10000101: {
    characterId: 10000101,
    characterName: 'Kinich',
    primaryTalent: 'skill',
    scalingStat: 'atk',
    baseMultiplier: 12.24, // 1224% Scalespiker Cannon Spikeshot at Lv 10
    talentScaling: 0.094,
    skillMultiplier: 12.24,
    burstMultiplier: 8.50,
    reactionType: 'Spread',
    reactionAdditive: 'Spread',
    additionalMultipliers: {
      'Nightsoul Loop Max Charge': 1.30,
    },
    rotation: [
      'E Canopy Hunter → Loop Nightsoul Points to Max → Scalespiker Cannon Spikeshot',
    ],
    notes: 'KQM Standard: Full nightsoul loop Scalespiker Cannon blast with Spread',
  },

  // Tighnari (10000069) - Wreath Arrow Spread
  10000069: {
    characterId: 10000069,
    characterName: 'Tighnari',
    primaryTalent: 'normal',
    scalingStat: 'hybrid',
    baseMultiplier: 1.54,
    secondaryStat: 'em',
    secondaryMultiplier: 1.80,
    talentScaling: 0.085,
    skillMultiplier: 1.80,
    burstMultiplier: 6.80,
    reactionType: 'Spread',
    reactionAdditive: 'Spread',
    additionalMultipliers: {
      '4 Clusterbloom Arrows': 2.80,
    },
    rotation: [
      'E Vijnana-Phala Mine → Instant Wreath Arrow CA (Spread) → 4 Clusterbloom Arrows',
    ],
    notes: 'KQM Standard: Wreath Arrow plus 4 Clusterbloom arrows with Spread',
  },

  // ─── Geo DPS ──────────────────────────────────────────────────────────────
  // Navia (10000091) - Ceremonial Crystalshot Gunbrella
  10000091: {
    characterId: 10000091,
    characterName: 'Navia',
    primaryTalent: 'skill',
    scalingStat: 'atk',
    baseMultiplier: 7.106, // 710.6% base Gunbrella blast
    talentScaling: 0.09,
    skillMultiplier: 7.106,
    burstMultiplier: 4.80,
    reactionType: 'None',
    additionalMultipliers: {
      '6 Crystal Shrapnel Stacks (11 Bullets)': 2.00, // 200% DMG multiplier for 11 bullets hit
      'A1 Undisclosed Mutual Assistance': 1.40, // +40% ATK from 2 Pyro/Electro/Cryo/Hydro party members
    },
    rotation: [
      'Q As the Sunlit Sky’s Singing Salute → 6 Crystal Shrapnel Stacks',
      'Hold E Ceremonial Crystalshot Gunbrella Blast (All 11 Bullets Hit)',
    ],
    notes: 'KQM Standard: Max 6-shrapnel Ceremonial Crystalshot point-blank blast (200% damage)',
  },

  // Arataki Itto (10000057) - Royal Descent & Kesagiri Slash (DEF to ATK Conversion)
  10000057: {
    characterId: 10000057,
    characterName: 'Arataki Itto',
    primaryTalent: 'normal',
    scalingStat: 'def',
    baseMultiplier: 1.80, // Kesagiri Slash
    talentScaling: 0.088,
    skillMultiplier: 5.53, // Ushi Masacatsu
    burstMultiplier: 1.0,
    reactionType: 'None',
    additionalMultipliers: {
      'Royal Descent DEF to ATK Conversion': 1.70, // ~103.7% DEF converted to ATK
      'A4 Bloodline of the Crimson Oni': 1.35, // +35% DEF bonus damage to Kesagiri
      '5x Kesagiri Slash Chain': 3.20,
    },
    rotation: [
      'Q Royal Descent: Behold, Itto the Evil! (DEF converted to ATK)',
      'E Masatsugu Ushi Strike → Superlative Superstrength Kesagiri Slash x5',
    ],
    notes: 'KQM Standard: Royal Descent DEF-converted Kesagiri slash combo and Ushi toss',
  },

  // Xilonen (10000103) - Source Sample Shred & Geo Strike (DEF Scaling)
  10000103: {
    characterId: 10000103,
    characterName: 'Xilonen',
    primaryTalent: 'skill',
    scalingStat: 'def',
    baseMultiplier: 2.45,
    talentScaling: 0.085,
    skillMultiplier: 2.45,
    burstMultiplier: 5.80,
    reactionType: 'None',
    resShredPercent: 36, // Native 36% Elemental Resistance Shred
    additionalMultipliers: {
      'Nightsoul Sample Active': 1.25,
    },
    rotation: [
      'E Yohual\'s Strike → Blade Rollerblade 3 Source Samples Trigger',
      '36% Elemental RES Shred Active across all elements',
    ],
    notes: 'KQM Standard: Nightsoul Source Sample activation with 36% all-element RES shred',
  },

  // ─── Anemo DPS ────────────────────────────────────────────────────────────
  // Xiao (10000015) - Bane of All Evil High Plunge
  10000015: {
    characterId: 10000015,
    characterName: 'Xiao',
    primaryTalent: 'burst',
    scalingStat: 'atk',
    baseMultiplier: 4.04, // High Plunge Lv 10 = ~404%
    talentScaling: 0.09,
    skillMultiplier: 4.55,
    burstMultiplier: 4.04,
    reactionType: 'None',
    additionalMultipliers: {
      'Bane of All Evil Plunge Buff': 1.952, // +95.2% Plunging Attack DMG
      'A4 Evil Conqueror: Tamer of Demons': 1.15, // Up to +25% DMG ramping
    },
    rotation: [
      'EE Lemniscatic Wind Cycling → Q Bane of All Evil (Yaksha Mask)',
      'High Plunge Attack Spam with Bane of All Evil Plunging DMG bonus',
    ],
    notes: 'KQM Standard: Single high plunge attack under active Bane of All Evil mask',
  },

  // Chasca (10000104) - Shadowhunt Shells
  10000104: {
    characterId: 10000104,
    characterName: 'Chasca',
    primaryTalent: 'skill',
    scalingStat: 'atk',
    baseMultiplier: 5.60,
    talentScaling: 0.09,
    skillMultiplier: 5.60,
    burstMultiplier: 8.90,
    reactionType: 'Melt',
    reactionAmplification: 'ForwardMelt',
    additionalMultipliers: {
      '6 Shadowhunt Shells Combined': 1.80,
    },
    rotation: [
      'E Nightsoul Flight → Aimed Multitarget Revs (6 Converted Elemental Shells)',
    ],
    notes: 'KQM Standard: Nightsoul flight aimed volley with 6 converted elemental shells',
  },

  // Wanderer / Scaramouche (10000075) - Windfavored Normal Attacks
  10000075: {
    characterId: 10000075,
    characterName: 'Wanderer',
    primaryTalent: 'normal',
    scalingStat: 'atk',
    baseMultiplier: 3.10,
    talentScaling: 0.088,
    skillMultiplier: 1.53,
    burstMultiplier: 13.20,
    reactionType: 'Swirl',
    additionalMultipliers: {
      'Windfavored State Multiplier': 1.53, // +53% Normal Attack DMG
      'A4 Gales of Reverie': 1.20,
    },
    rotation: [
      'E Hanega: Song of the Wind (Windfavored Flight) → N3 Normal Attack Combo',
    ],
    notes: 'KQM Standard: Windfavored hover state normal attack string with A4 procs',
  },
};

// Helper to check if a character has damage config
export function hasDamageConfig(characterId: number): boolean {
  return characterId in damageConfigs;
}

// Get all configured character IDs
export function getConfiguredCharacters(): number[] {
  return Object.keys(damageConfigs).map(Number);
}
