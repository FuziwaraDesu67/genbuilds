/**
 * Authoritative Genshin Impact Constellation Talent Boost (+3) Mappings and Logic.
 * Evaluates whether Normal Attack, Elemental Skill, or Elemental Burst receives
 * constellation level boosts (+3) at C3 and C5.
 */

import type { TalentBoostConfig } from './types';

export type TalentType = 'normal' | 'skill' | 'burst';

export const CHARACTER_TALENT_BOOSTS: Record<number, TalentBoostConfig> = {
  // Fontaine Normal Attack Boosters (C3: Normal, C5: Burst)
  10000084: { c3: 'normal', c5: 'burst' }, // Lyney
  10000086: { c3: 'normal', c5: 'burst' }, // Wriothesley
  10000087: { c3: 'normal', c5: 'burst' }, // Neuvillette
  10000096: { c3: 'normal', c5: 'burst' }, // Arlecchino
  10000097: { c3: 'normal', c5: 'burst' }, // Sethos

  // Standard C3: Skill, C5: Burst
  10000014: { c3: 'skill', c5: 'burst' }, // Barbara
  10000016: { c3: 'skill', c5: 'burst' }, // Diluc
  10000021: { c3: 'skill', c5: 'burst' }, // Amber
  10000026: { c3: 'skill', c5: 'burst' }, // Xiao
  10000027: { c3: 'skill', c5: 'burst' }, // Ningguang
  10000029: { c3: 'skill', c5: 'burst' }, // Klee
  10000030: { c3: 'skill', c5: 'burst' }, // Zhongli
  10000031: { c3: 'skill', c5: 'burst' }, // Fischl
  10000032: { c3: 'skill', c5: 'burst' }, // Bennett
  10000033: { c3: 'skill', c5: 'burst' }, // Tartaglia
  10000038: { c3: 'skill', c5: 'burst' }, // Albedo
  10000043: { c3: 'skill', c5: 'burst' }, // Sucrose
  10000044: { c3: 'skill', c5: 'burst' }, // Xinyan
  10000046: { c3: 'skill', c5: 'burst' }, // Hu Tao
  10000047: { c3: 'skill', c5: 'burst' }, // Kaedehara Kazuha
  10000048: { c3: 'skill', c5: 'burst' }, // Yanfei
  10000049: { c3: 'skill', c5: 'burst' }, // Yoimiya
  10000050: { c3: 'skill', c5: 'burst' }, // Thoma
  10000054: { c3: 'skill', c5: 'burst' }, // Sangonomiya Kokomi
  10000055: { c3: 'skill', c5: 'burst' }, // Gorou
  10000058: { c3: 'skill', c5: 'burst' }, // Yae Miko
  10000059: { c3: 'skill', c5: 'burst' }, // Shikanoin Heizou
  10000061: { c3: 'skill', c5: 'burst' }, // Kirara
  10000063: { c3: 'skill', c5: 'burst' }, // Shenhe
  10000066: { c3: 'skill', c5: 'burst' }, // Kamisato Ayato
  10000072: { c3: 'skill', c5: 'burst' }, // Candace
  10000073: { c3: 'skill', c5: 'burst' }, // Nahida
  10000074: { c3: 'skill', c5: 'burst' }, // Layla
  10000077: { c3: 'skill', c5: 'burst' }, // Yaoyao
  10000078: { c3: 'skill', c5: 'burst' }, // Alhaitham
  10000079: { c3: 'skill', c5: 'burst' }, // Dehya
  10000081: { c3: 'skill', c5: 'burst' }, // Kaveh
  10000082: { c3: 'skill', c5: 'burst' }, // Baizhu
  10000083: { c3: 'skill', c5: 'burst' }, // Lynette
  10000085: { c3: 'skill', c5: 'burst' }, // Freminet
  10000088: { c3: 'skill', c5: 'burst' }, // Charlotte
  10000090: { c3: 'skill', c5: 'burst' }, // Chevreuse
  10000091: { c3: 'skill', c5: 'burst' }, // Navia
  10000092: { c3: 'skill', c5: 'burst' }, // Gaming
  10000094: { c3: 'skill', c5: 'burst' }, // Chiori
  10000095: { c3: 'skill', c5: 'burst' }, // Sigewinne
  10000098: { c3: 'skill', c5: 'burst' }, // Clorinde
  10000099: { c3: 'skill', c5: 'burst' }, // Emilie
  10000100: { c3: 'skill', c5: 'burst' }, // Kachina
  10000101: { c3: 'skill', c5: 'burst' }, // Kinich
  10000102: { c3: 'skill', c5: 'burst' }, // Mualani
  10000103: { c3: 'skill', c5: 'burst' }, // Xilonen
  10000104: { c3: 'skill', c5: 'burst' }, // Chasca
  10000105: { c3: 'skill', c5: 'burst' }, // Ororon
  10000106: { c3: 'skill', c5: 'burst' }, // Mavuika
  10000107: { c3: 'skill', c5: 'burst' }, // Citlali
  10000111: { c3: 'skill', c5: 'burst' }, // Varesa
  10000112: { c3: 'skill', c5: 'burst' }, // Escoffier
  10000114: { c3: 'skill', c5: 'burst' }, // Skirk
  10000119: { c3: 'skill', c5: 'burst' }, // Lauma
  10000122: { c3: 'skill', c5: 'burst' }, // Nefer
  10000125: { c3: 'skill', c5: 'burst' }, // Columbina
  10000126: { c3: 'skill', c5: 'burst' }, // Zibai
  10000130: { c3: 'skill', c5: 'burst' }, // Linnea
  10000133: { c3: 'skill', c5: 'burst' }, // Sandrone
  10000136: { c3: 'skill', c5: 'burst' }, // Mitya
  10000137: { c3: 'skill', c5: 'burst' }, // Valeriy
  10000140: { c3: 'skill', c5: 'burst' }, // Vodyanitsa
  10000143: { c3: 'skill', c5: 'burst' }, // Vesna
  10000150: { c3: 'skill', c5: 'burst' }, // Odette

  // Standard C3: Burst, C5: Skill
  10000002: { c3: 'burst', c5: 'skill' }, // Kamisato Ayaka
  10000003: { c3: 'burst', c5: 'skill' }, // Jean
  10000006: { c3: 'burst', c5: 'skill' }, // Lisa
  10000015: { c3: 'burst', c5: 'skill' }, // Kaeya
  10000020: { c3: 'burst', c5: 'skill' }, // Razor
  10000022: { c3: 'burst', c5: 'skill' }, // Venti
  10000023: { c3: 'burst', c5: 'skill' }, // Xiangling
  10000024: { c3: 'burst', c5: 'skill' }, // Beidou
  10000025: { c3: 'burst', c5: 'skill' }, // Xingqiu
  10000034: { c3: 'burst', c5: 'skill' }, // Noelle
  10000035: { c3: 'burst', c5: 'skill' }, // Qiqi
  10000036: { c3: 'burst', c5: 'skill' }, // Chongyun
  10000037: { c3: 'burst', c5: 'skill' }, // Ganyu
  10000039: { c3: 'burst', c5: 'skill' }, // Diona
  10000041: { c3: 'burst', c5: 'skill' }, // Mona
  10000042: { c3: 'burst', c5: 'skill' }, // Keqing
  10000045: { c3: 'burst', c5: 'skill' }, // Rosaria
  10000051: { c3: 'burst', c5: 'skill' }, // Eula
  10000052: { c3: 'burst', c5: 'skill' }, // Raiden Shogun
  10000053: { c3: 'burst', c5: 'skill' }, // Sayu
  10000056: { c3: 'burst', c5: 'skill' }, // Kujou Sara
  10000057: { c3: 'burst', c5: 'skill' }, // Arataki Itto
  10000060: { c3: 'burst', c5: 'skill' }, // Yelan
  10000064: { c3: 'burst', c5: 'skill' }, // Yun Jin
  10000065: { c3: 'burst', c5: 'skill' }, // Kuki Shinobu
  10000067: { c3: 'burst', c5: 'skill' }, // Collei
  10000068: { c3: 'burst', c5: 'skill' }, // Dori
  10000069: { c3: 'burst', c5: 'skill' }, // Tighnari
  10000070: { c3: 'burst', c5: 'skill' }, // Nilou
  10000071: { c3: 'burst', c5: 'skill' }, // Cyno
  10000075: { c3: 'burst', c5: 'skill' }, // Wanderer
  10000076: { c3: 'burst', c5: 'skill' }, // Faruzan
  10000080: { c3: 'burst', c5: 'skill' }, // Mika
  10000093: { c3: 'burst', c5: 'skill' }, // Xianyun
  10000089: { c3: 'burst', c5: 'skill' }, // Furina
};

/**
 * Evaluates whether Normal, Skill, or Burst talent levels have been boosted (+3)
 * by constellation activation.
 *
 * @param characterId Character avatar ID
 * @param constellation Current constellation level (0 to 6)
 */
export function evaluateTalentBoosts(
  characterId: number,
  constellation: number
): { normal: boolean; skill: boolean; burst: boolean } {
  // Edge Case: Aloy has no constellations
  if (constellation < 3 || characterId === 10000062) {
    return { normal: false, skill: false, burst: false };
  }

  const config = CHARACTER_TALENT_BOOSTS[characterId] || { c3: 'skill', c5: 'burst' };
  const hasC3 = constellation >= 3;
  const hasC5 = constellation >= 5;

  return {
    normal: (hasC3 && config.c3 === 'normal') || (hasC5 && config.c5 === 'normal'),
    skill: (hasC3 && config.c3 === 'skill') || (hasC5 && config.c5 === 'skill'),
    burst: (hasC3 && config.c3 === 'burst') || (hasC5 && config.c5 === 'burst'),
  };
}
