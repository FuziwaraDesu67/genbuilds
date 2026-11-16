import type { EnkaData, Character, Artifact } from '../enka/types';
import { calculateEffectiveCv } from '../utils';

export interface ChascaBenchmarkBuild {
  id: string;
  uid: string;
  nickname: string;
  profilePicture?: string;
  constellation: number;
  level: number;
  weapon: {
    id: number;
    name: string;
    rarity: number;
    level: number;
    refinement: number;
    icon?: string;
  };
  artifactSets: Record<string, number>;
  artifactSetList: Array<{ name: string; icon: string; count: number }>;
  critValue: number;
  stats: {
    hp: number;
    atk: number;
    def: number;
    cr: number;
    cd: number;
    em: number;
    er: number;
  };
  calculatedDamage: number;
}

export const CHASCA_BENCHMARK_BUILDS: ChascaBenchmarkBuild[] = [
  {
    id: 'chasca-bm-1',
    uid: '702914820',
    nickname: 'AeroGunner',
    profilePicture: 'UI_AvatarIcon_Chasca',
    constellation: 2,
    level: 90,
    weapon: {
      id: 15514,
      name: "Astral Vulture's Crimson Plumage",
      rarity: 5,
      level: 90,
      refinement: 1,
      icon: 'https://enka.network/ui/UI_EquipIcon_Bow_Qoyllorsnova.png',
    },
    artifactSets: { 'Obsidian Codex': 4 },
    artifactSetList: [{ name: 'Obsidian Codex', icon: 'https://enka.network/ui/UI_RelicIcon_15038_4.png', count: 4 }],
    critValue: 246.8,
    stats: {
      hp: 19840,
      atk: 2240,
      def: 860,
      cr: 58.4,
      cd: 236.2,
      em: 112,
      er: 118.5,
    },
    calculatedDamage: 98450,
  },
  {
    id: 'chasca-bm-2',
    uid: '601839201',
    nickname: 'VultureKing',
    profilePicture: 'UI_AvatarIcon_Chasca',
    constellation: 6,
    level: 90,
    weapon: {
      id: 15514,
      name: "Astral Vulture's Crimson Plumage",
      rarity: 5,
      level: 90,
      refinement: 5,
      icon: 'https://enka.network/ui/UI_EquipIcon_Bow_Qoyllorsnova.png',
    },
    artifactSets: { 'Obsidian Codex': 4 },
    artifactSetList: [{ name: 'Obsidian Codex', icon: 'https://enka.network/ui/UI_RelicIcon_15038_4.png', count: 4 }],
    critValue: 254.2,
    stats: {
      hp: 20100,
      atk: 2480,
      def: 890,
      cr: 59.8,
      cd: 248.6,
      em: 128,
      er: 124.0,
    },
    calculatedDamage: 142800,
  },
  {
    id: 'chasca-bm-3',
    uid: '810294711',
    nickname: 'TeyvatSniper',
    profilePicture: 'UI_AvatarIcon_Chasca',
    constellation: 1,
    level: 90,
    weapon: {
      id: 15512,
      name: 'The First Great Magic',
      rarity: 5,
      level: 90,
      refinement: 1,
      icon: 'https://enka.network/ui/UI_EquipIcon_Bow_Pledge.png',
    },
    artifactSets: { 'Obsidian Codex': 4 },
    artifactSetList: [{ name: 'Obsidian Codex', icon: 'https://enka.network/ui/UI_RelicIcon_15038_4.png', count: 4 }],
    critValue: 238.4,
    stats: {
      hp: 18920,
      atk: 2160,
      def: 820,
      cr: 56.2,
      cd: 244.8,
      em: 94,
      er: 112.0,
    },
    calculatedDamage: 91200,
  },
  {
    id: 'chasca-bm-4',
    uid: '719382049',
    nickname: 'NatlanRanger',
    profilePicture: 'UI_AvatarIcon_Chasca',
    constellation: 0,
    level: 90,
    weapon: {
      id: 15509,
      name: 'Aqua Simulacra',
      rarity: 5,
      level: 90,
      refinement: 1,
      icon: 'https://enka.network/ui/UI_EquipIcon_Bow_Kirin.png',
    },
    artifactSets: { 'Obsidian Codex': 4 },
    artifactSetList: [{ name: 'Obsidian Codex', icon: 'https://enka.network/ui/UI_RelicIcon_15038_4.png', count: 4 }],
    critValue: 242.0,
    stats: {
      hp: 21400,
      atk: 1980,
      def: 810,
      cr: 54.8,
      cd: 262.4,
      em: 86,
      er: 115.2,
    },
    calculatedDamage: 88700,
  },
  {
    id: 'chasca-bm-5',
    uid: '820491823',
    nickname: 'CrimsonFeather',
    profilePicture: 'UI_AvatarIcon_Chasca',
    constellation: 0,
    level: 90,
    weapon: {
      id: 15514,
      name: "Astral Vulture's Crimson Plumage",
      rarity: 5,
      level: 90,
      refinement: 1,
      icon: 'https://enka.network/ui/UI_EquipIcon_Bow_Qoyllorsnova.png',
    },
    artifactSets: { 'Marechaussee Hunter': 4 },
    artifactSetList: [{ name: 'Marechaussee Hunter', icon: 'https://enka.network/ui/UI_RelicIcon_15031_4.png', count: 4 }],
    critValue: 232.6,
    stats: {
      hp: 19400,
      atk: 2110,
      def: 840,
      cr: 61.2,
      cd: 228.4,
      em: 104,
      er: 120.5,
    },
    calculatedDamage: 84500,
  },
  {
    id: 'chasca-bm-6',
    uid: '619284019',
    nickname: 'WindReaper',
    profilePicture: 'UI_AvatarIcon_Chasca',
    constellation: 2,
    level: 90,
    weapon: {
      id: 15424,
      name: 'Scion of the Blazing Sun',
      rarity: 4,
      level: 90,
      refinement: 5,
      icon: 'https://enka.network/ui/UI_EquipIcon_Bow_Gurabad.png',
    },
    artifactSets: { 'Obsidian Codex': 4 },
    artifactSetList: [{ name: 'Obsidian Codex', icon: 'https://enka.network/ui/UI_RelicIcon_15038_4.png', count: 4 }],
    critValue: 228.0,
    stats: {
      hp: 18700,
      atk: 2040,
      def: 790,
      cr: 57.0,
      cd: 218.0,
      em: 78,
      er: 110.0,
    },
    calculatedDamage: 81200,
  },
  {
    id: 'chasca-bm-7',
    uid: '728491024',
    nickname: 'ChainBreakerPro',
    profilePicture: 'UI_AvatarIcon_Chasca',
    constellation: 0,
    level: 90,
    weapon: {
      id: 15431,
      name: 'Chain Breaker',
      rarity: 4,
      level: 90,
      refinement: 5,
      icon: 'https://enka.network/ui/UI_EquipIcon_Bow_Isikhulu.png',
    },
    artifactSets: { 'Obsidian Codex': 4 },
    artifactSetList: [{ name: 'Obsidian Codex', icon: 'https://enka.network/ui/UI_RelicIcon_15038_4.png', count: 4 }],
    critValue: 222.4,
    stats: {
      hp: 18500,
      atk: 2290,
      def: 830,
      cr: 55.4,
      cd: 212.6,
      em: 142,
      er: 108.0,
    },
    calculatedDamage: 76800,
  },
  {
    id: 'chasca-bm-8',
    uid: '839201948',
    nickname: 'PlumeRider',
    profilePicture: 'UI_AvatarIcon_Chasca',
    constellation: 3,
    level: 90,
    weapon: {
      id: 15514,
      name: "Astral Vulture's Crimson Plumage",
      rarity: 5,
      level: 90,
      refinement: 2,
      icon: 'https://enka.network/ui/UI_EquipIcon_Bow_Qoyllorsnova.png',
    },
    artifactSets: { 'Obsidian Codex': 4 },
    artifactSetList: [{ name: 'Obsidian Codex', icon: 'https://enka.network/ui/UI_RelicIcon_15038_4.png', count: 4 }],
    critValue: 251.0,
    stats: {
      hp: 20300,
      atk: 2350,
      def: 870,
      cr: 58.8,
      cd: 242.4,
      em: 116,
      er: 122.0,
    },
    calculatedDamage: 116400,
  },
  {
    id: 'chasca-bm-9',
    uid: '638201940',
    nickname: 'ZephyrStrike',
    profilePicture: 'UI_AvatarIcon_Chasca',
    constellation: 0,
    level: 90,
    weapon: {
      id: 15501,
      name: 'Skyward Harp',
      rarity: 5,
      level: 90,
      refinement: 1,
      icon: 'https://enka.network/ui/UI_EquipIcon_Bow_Dvalin.png',
    },
    artifactSets: { 'Desert Pavilion Chronicle': 4 },
    artifactSetList: [{ name: 'Desert Pavilion Chronicle', icon: 'https://enka.network/ui/UI_RelicIcon_15028_4.png', count: 4 }],
    critValue: 236.8,
    stats: {
      hp: 19100,
      atk: 2280,
      def: 850,
      cr: 78.4,
      cd: 202.0,
      em: 64,
      er: 114.0,
    },
    calculatedDamage: 79500,
  },
  {
    id: 'chasca-bm-10',
    uid: '748291038',
    nickname: 'StormCaller',
    profilePicture: 'UI_AvatarIcon_Chasca',
    constellation: 1,
    level: 90,
    weapon: {
      id: 15502,
      name: "Amos' Bow",
      rarity: 5,
      level: 90,
      refinement: 1,
      icon: 'https://enka.network/ui/UI_EquipIcon_Bow_Amos.png',
    },
    artifactSets: { 'Obsidian Codex': 4 },
    artifactSetList: [{ name: 'Obsidian Codex', icon: 'https://enka.network/ui/UI_RelicIcon_15038_4.png', count: 4 }],
    critValue: 226.4,
    stats: {
      hp: 18800,
      atk: 2510,
      def: 840,
      cr: 54.2,
      cd: 218.0,
      em: 92,
      er: 106.0,
    },
    calculatedDamage: 83200,
  },
  {
    id: 'chasca-bm-11',
    uid: '849201847',
    nickname: 'SwiftWind',
    profilePicture: 'UI_AvatarIcon_Chasca',
    constellation: 0,
    level: 90,
    weapon: {
      id: 15512,
      name: 'The First Great Magic',
      rarity: 5,
      level: 90,
      refinement: 3,
      icon: 'https://enka.network/ui/UI_EquipIcon_Bow_Pledge.png',
    },
    artifactSets: { 'Obsidian Codex': 4 },
    artifactSetList: [{ name: 'Obsidian Codex', icon: 'https://enka.network/ui/UI_RelicIcon_15038_4.png', count: 4 }],
    critValue: 244.6,
    stats: {
      hp: 19600,
      atk: 2280,
      def: 830,
      cr: 57.6,
      cd: 251.2,
      em: 108,
      er: 116.0,
    },
    calculatedDamage: 99600,
  },
  {
    id: 'chasca-bm-12',
    uid: '648291024',
    nickname: 'StarGazer',
    profilePicture: 'UI_AvatarIcon_Chasca',
    constellation: 0,
    level: 90,
    weapon: {
      id: 15424,
      name: 'Scion of the Blazing Sun',
      rarity: 4,
      level: 90,
      refinement: 1,
      icon: 'https://enka.network/ui/UI_EquipIcon_Bow_Gurabad.png',
    },
    artifactSets: { 'Obsidian Codex': 4 },
    artifactSetList: [{ name: 'Obsidian Codex', icon: 'https://enka.network/ui/UI_RelicIcon_15038_4.png', count: 4 }],
    critValue: 218.4,
    stats: {
      hp: 18400,
      atk: 1960,
      def: 800,
      cr: 53.6,
      cd: 208.4,
      em: 72,
      er: 112.0,
    },
    calculatedDamage: 72400,
  },
  {
    id: 'chasca-bm-13',
    uid: '758392019',
    nickname: 'ApexPrey',
    profilePicture: 'UI_AvatarIcon_Chasca',
    constellation: 4,
    level: 90,
    weapon: {
      id: 15514,
      name: "Astral Vulture's Crimson Plumage",
      rarity: 5,
      level: 90,
      refinement: 1,
      icon: 'https://enka.network/ui/UI_EquipIcon_Bow_Qoyllorsnova.png',
    },
    artifactSets: { 'Obsidian Codex': 4 },
    artifactSetList: [{ name: 'Obsidian Codex', icon: 'https://enka.network/ui/UI_RelicIcon_15038_4.png', count: 4 }],
    critValue: 248.8,
    stats: {
      hp: 20200,
      atk: 2310,
      def: 880,
      cr: 58.0,
      cd: 240.8,
      em: 122,
      er: 125.0,
    },
    calculatedDamage: 124500,
  },
  {
    id: 'chasca-bm-14',
    uid: '859302914',
    nickname: 'KitsuneSky',
    profilePicture: 'UI_AvatarIcon_Chasca',
    constellation: 0,
    level: 90,
    weapon: {
      id: 15509,
      name: 'Aqua Simulacra',
      rarity: 5,
      level: 90,
      refinement: 5,
      icon: 'https://enka.network/ui/UI_EquipIcon_Bow_Kirin.png',
    },
    artifactSets: { 'Obsidian Codex': 4 },
    artifactSetList: [{ name: 'Obsidian Codex', icon: 'https://enka.network/ui/UI_RelicIcon_15038_4.png', count: 4 }],
    critValue: 249.2,
    stats: {
      hp: 22800,
      atk: 2060,
      def: 830,
      cr: 56.8,
      cd: 272.0,
      em: 96,
      er: 118.0,
    },
    calculatedDamage: 104200,
  },
  {
    id: 'chasca-bm-15',
    uid: '659302810',
    nickname: 'ShadowHunter',
    profilePicture: 'UI_AvatarIcon_Chasca',
    constellation: 0,
    level: 90,
    weapon: {
      id: 15431,
      name: 'Chain Breaker',
      rarity: 4,
      level: 90,
      refinement: 1,
      icon: 'https://enka.network/ui/UI_EquipIcon_Bow_Isikhulu.png',
    },
    artifactSets: { 'Obsidian Codex': 4 },
    artifactSetList: [{ name: 'Obsidian Codex', icon: 'https://enka.network/ui/UI_RelicIcon_15038_4.png', count: 4 }],
    critValue: 214.2,
    stats: {
      hp: 18200,
      atk: 2140,
      def: 810,
      cr: 52.4,
      cd: 204.0,
      em: 118,
      er: 105.0,
    },
    calculatedDamage: 68900,
  },
  {
    id: 'chasca-bm-16',
    uid: '769403819',
    nickname: 'KavehEnjoyer',
    profilePicture: 'UI_AvatarIcon_Chasca',
    constellation: 1,
    level: 90,
    weapon: {
      id: 15514,
      name: "Astral Vulture's Crimson Plumage",
      rarity: 5,
      level: 90,
      refinement: 1,
      icon: 'https://enka.network/ui/UI_EquipIcon_Bow_Qoyllorsnova.png',
    },
    artifactSets: { 'Obsidian Codex': 4 },
    artifactSetList: [{ name: 'Obsidian Codex', icon: 'https://enka.network/ui/UI_RelicIcon_15038_4.png', count: 4 }],
    critValue: 235.6,
    stats: {
      hp: 19500,
      atk: 2190,
      def: 840,
      cr: 56.0,
      cd: 231.2,
      em: 102,
      er: 114.0,
    },
    calculatedDamage: 89400,
  },
];

export function isChascaBenchmarkUid(uid: string): boolean {
  return CHASCA_BENCHMARK_BUILDS.some((b) => b.uid === uid);
}

export function getChascaBenchmarkEnkaData(uid: string): EnkaData | null {
  const bm = CHASCA_BENCHMARK_BUILDS.find((b) => b.uid === uid);
  if (!bm) return null;

  // Compute rank in benchmark pool (sorted by damage desc)
  const sorted = [...CHASCA_BENCHMARK_BUILDS].sort((a, b) => b.calculatedDamage - a.calculatedDamage);
  const rank = sorted.findIndex((b) => b.uid === uid) + 1;

  // Determine artifact set id and texts
  const isObsidian = bm.artifactSets['Obsidian Codex'] === 4;
  const isMarechaussee = bm.artifactSets['Marechaussee Hunter'] === 4;
  const isDesert = bm.artifactSets['Desert Pavilion Chronicle'] === 4;

  const setId = isObsidian ? 15038 : isMarechaussee ? 15031 : isDesert ? 15028 : 15038;
  const setName = isObsidian ? 'Obsidian Codex' : isMarechaussee ? 'Marechaussee Hunter' : isDesert ? 'Desert Pavilion Chronicle' : 'Obsidian Codex';
  const twoPieceText = isObsidian
    ? "While the equipping character is in Nightsoul's Blessing and is on the field, their DMG dealt is increased by 15%."
    : isMarechaussee
    ? "Normal and Charged Attack DMG +15%."
    : "Anemo DMG Bonus +15%.";
  const fourPieceText = isObsidian
    ? "After the equipping character consumes 1 Nightsoul point while on the field, CRIT Rate increases by 40% for 6s. This effect can trigger once every 1s."
    : isMarechaussee
    ? "When current HP increases or decreases, CRIT Rate will be increased by 12% for 5s. Max 3 stacks."
    : "When Charged Attacks hit opponents, the equipping character's Normal Attack SPD will increase by 10% while Normal, Charged, and Plunging Attack DMG will increase by 40% for 15s.";

  // Generate 5-piece artifacts matching bm.critValue
  const totalCv = bm.critValue;
  const flowerCv = parseFloat((totalCv * 0.19).toFixed(1));
  const plumeCv = parseFloat((totalCv * 0.21).toFixed(1));
  const sandsCv = parseFloat((totalCv * 0.20).toFixed(1));
  const gobletCv = parseFloat((totalCv * 0.21).toFixed(1));
  const circletCv = parseFloat((totalCv - flowerCv - plumeCv - sandsCv - gobletCv).toFixed(1));

  function makeCvSubs(cv: number, mainStatKey: string) {
    if (mainStatKey === 'cd') {
      const crVal = parseFloat((cv / 2).toFixed(1));
      return [
        { key: 'cr', value: crVal, rolls: Math.min(5, Math.max(1, Math.round(crVal / 3.5))), pips: '●●●○○' },
        { key: 'atkPercent', value: 9.9, rolls: 2, pips: '●●○○○' },
        { key: 'atk', value: 33, rolls: 2, pips: '●●○○○' },
        { key: 'em', value: 21, rolls: 1, pips: '●○○○○' },
      ];
    }
    const crVal = parseFloat(((cv * 0.35) / 2).toFixed(1));
    const cdVal = parseFloat((cv * 0.65).toFixed(1));
    return [
      { key: 'cr', value: crVal, rolls: Math.min(4, Math.max(1, Math.round(crVal / 3.5))), pips: '●●○○○' },
      { key: 'cd', value: cdVal, rolls: Math.min(5, Math.max(1, Math.round(cdVal / 7.0))), pips: '●●●○○' },
      { key: 'atkPercent', value: 5.8, rolls: 1, pips: '●○○○○' },
      { key: 'em', value: 23, rolls: 1, pips: '●○○○○' },
    ];
  }

  const artifacts: Artifact[] = [
    {
      id: setId * 10 + 4,
      name: `${setName} (Flower)`,
      setId,
      setName,
      setBonusText: { twoPiece: twoPieceText, fourPiece: fourPieceText },
      slot: 'flower',
      rarity: 5,
      level: 20,
      mainStat: { key: 'hp', value: 4780 },
      subStats: makeCvSubs(flowerCv, 'hp'),
      cv: flowerCv,
      qualityBadge: flowerCv >= 40 ? 'Godly' : flowerCv >= 30 ? 'Great' : 'Good',
      icon: `https://enka.network/ui/UI_RelicIcon_${setId}_4.png`,
    },
    {
      id: setId * 10 + 2,
      name: `${setName} (Plume)`,
      setId,
      setName,
      setBonusText: { twoPiece: twoPieceText, fourPiece: fourPieceText },
      slot: 'plume',
      rarity: 5,
      level: 20,
      mainStat: { key: 'atk', value: 311 },
      subStats: makeCvSubs(plumeCv, 'atk'),
      cv: plumeCv,
      qualityBadge: plumeCv >= 40 ? 'Godly' : plumeCv >= 30 ? 'Great' : 'Good',
      icon: `https://enka.network/ui/UI_RelicIcon_${setId}_2.png`,
    },
    {
      id: setId * 10 + 5,
      name: `${setName} (Sands)`,
      setId,
      setName,
      setBonusText: { twoPiece: twoPieceText, fourPiece: fourPieceText },
      slot: 'sands',
      rarity: 5,
      level: 20,
      mainStat: { key: 'atkPercent', value: 46.6 },
      subStats: makeCvSubs(sandsCv, 'atkPercent'),
      cv: sandsCv,
      qualityBadge: sandsCv >= 40 ? 'Godly' : sandsCv >= 30 ? 'Great' : 'Good',
      icon: `https://enka.network/ui/UI_RelicIcon_${setId}_5.png`,
    },
    {
      id: setId * 10 + 1,
      name: `${setName} (Goblet)`,
      setId,
      setName,
      setBonusText: { twoPiece: twoPieceText, fourPiece: fourPieceText },
      slot: 'goblet',
      rarity: 5,
      level: 20,
      mainStat: { key: 'anemoDmgBonus', value: 46.6 },
      subStats: makeCvSubs(gobletCv, 'anemoDmgBonus'),
      cv: gobletCv,
      qualityBadge: gobletCv >= 40 ? 'Godly' : gobletCv >= 30 ? 'Great' : 'Good',
      icon: `https://enka.network/ui/UI_RelicIcon_${setId}_1.png`,
    },
    {
      id: setId * 10 + 3,
      name: `${setName} (Circlet)`,
      setId,
      setName,
      setBonusText: { twoPiece: twoPieceText, fourPiece: fourPieceText },
      slot: 'circlet',
      rarity: 5,
      level: 20,
      mainStat: { key: 'cd', value: 62.2 },
      subStats: makeCvSubs(circletCv, 'cd'),
      cv: circletCv,
      qualityBadge: circletCv >= 30 ? 'Godly' : circletCv >= 20 ? 'Great' : 'Good',
      icon: `https://enka.network/ui/UI_RelicIcon_${setId}_3.png`,
    },
  ];

  // Effective CV & Cap calculation
  const eff = calculateEffectiveCv({
    stats: { cr: bm.stats.cr, cd: bm.stats.cd },
    artifactSets: bm.artifactSets,
  });

  const weaponSubstat =
    bm.weapon.id === 15514 || bm.weapon.id === 15509 || bm.weapon.id === 15512
      ? { key: 'cd', value: bm.weapon.id === 15509 ? 88.2 : 66.2 }
      : bm.weapon.id === 15424 || bm.weapon.id === 15501
      ? { key: 'cr', value: bm.weapon.id === 15501 ? 22.1 : 18.4 }
      : { key: 'atkPercent', value: 49.6 };

  const chascaChar: Character = {
    id: 10000104,
    name: 'Chasca',
    element: 'Anemo',
    rarity: 5,
    level: 90,
    constellation: bm.constellation,
    friendshipLevel: 10,
    talents: {
      normal: 10,
      skill: 10,
      burst: 10,
      boosted: {
        normal: false,
        skill: bm.constellation >= 5,
        burst: bm.constellation >= 3,
      },
      icons: {
        normal: 'https://enka.network/ui/Skill_A_01.png',
        skill: 'https://enka.network/ui/Skill_S_Chasca_01.png',
        burst: 'https://enka.network/ui/Skill_E_Chasca_01.png',
      },
    },
    stats: {
      hp: bm.stats.hp,
      atk: bm.stats.atk,
      def: bm.stats.def,
      cr: bm.stats.cr,
      cd: bm.stats.cd,
      em: bm.stats.em,
      er: bm.stats.er,
      dmgBonus: { anemo: 46.6 },
    },
    weapon: {
      id: bm.weapon.id,
      name: bm.weapon.name,
      rarity: bm.weapon.rarity,
      level: bm.weapon.level,
      ascension: 6,
      refinement: bm.weapon.refinement,
      baseAtk: bm.weapon.id === 15501 ? 674 : bm.weapon.id === 15509 ? 542 : 608,
      subStat: weaponSubstat,
      passiveName: 'Shadow of the Lone Plume',
      passiveDescription:
        'Triggering Swirl grants ATK +24% for 12s. Having different elements in party increases Charged Attack DMG by 20/48/96%.',
      icon: bm.weapon.icon || 'https://enka.network/ui/UI_EquipIcon_Bow_Qoyllorsnova.png',
    },
    artifacts,
    artifactSets: { [setId]: 4 },
    activeSetBonuses: [
      {
        setId,
        name: setName,
        setName,
        count: 4,
        twoPieceActive: true,
        fourPieceActive: true,
        twoPieceText,
        fourPieceText,
        twoPiece: twoPieceText,
        fourPiece: fourPieceText,
        activeTier: '4pc',
      },
    ],
    totalCv: bm.critValue,
    akashaCv: bm.critValue,
    effectiveCv: eff.effectiveArtifactCv,
    setBonusCr: eff.effectiveSetBonusCr,
    setBonusCv: eff.effectiveSetBonusCr * 2,
    isCvCapped: eff.isCapped,
    qualityBadge: bm.critValue >= 240 ? 'Godly' : bm.critValue >= 210 ? 'Great' : 'Good',
    damageCalc: {
      totalDamage: bm.calculatedDamage,
      rotationDamage: bm.calculatedDamage,
      dps: Math.round(bm.calculatedDamage / 15),
      breakdown: [
        {
          label: 'Charged Attack: Shining Shadowhunt Shot',
          damage: Math.round(bm.calculatedDamage * 0.42),
          critDamage: Math.round(bm.calculatedDamage * 0.42),
          hits: 1,
        },
        {
          label: 'Shadowhunt Shell (Pyro Convert)',
          damage: Math.round(bm.calculatedDamage * 0.28),
          critDamage: Math.round(bm.calculatedDamage * 0.28),
          hits: 2,
        },
        {
          label: 'Shadowhunt Shell (Electro Convert)',
          damage: Math.round(bm.calculatedDamage * 0.18),
          critDamage: Math.round(bm.calculatedDamage * 0.18),
          hits: 2,
        },
        {
          label: 'Elemental Burst: Soul Reaper',
          damage: Math.round(bm.calculatedDamage * 0.12),
          critDamage: Math.round(bm.calculatedDamage * 0.12),
          hits: 1,
        },
      ],
    },
    akasha: {
      calculationId: '10000104',
      category: 'SHADOWS OF THE NIGHT WINDS',
      ranking: rank,
      outOf: 16,
      topPercent: parseFloat(((rank / 16) * 100).toFixed(1)),
      result: bm.calculatedDamage,
      source: 'local',
      topStats: {
        hp: 20100,
        atk: 2480,
        def: 890,
        em: 128,
        er: 124,
        cr: 59.8,
        cd: 248.6,
        dmgBonus: 46.6,
      },
      playerStats: {
        hp: bm.stats.hp,
        atk: bm.stats.atk,
        def: bm.stats.def,
        em: bm.stats.em,
        er: bm.stats.er,
        cr: bm.stats.cr,
        cd: bm.stats.cd,
        dmgBonus: 46.6,
      },
    },
    icon: '/icons/characters/10000104.png',
    gachaSplash: '/icons/characters/10000104_gacha.png',
  };

  return {
    player: {
      uid: bm.uid,
      nickname: bm.nickname,
      level: 60,
      worldLevel: 8,
      region: bm.uid.startsWith('7') ? 'Europe' : bm.uid.startsWith('6') ? 'America' : 'Asia',
      signature: `Natlan Chasca Specialist | Rank #${rank}`,
      profilePicture: 'https://enka.network/ui/UI_AvatarIcon_Chasca.png',
      nameCardUrl: 'https://enka.network/ui/UI_NameCardPic_Chasca_P.png',
      finishAchievementNum: 1142,
      towerFloorIndex: 12,
      towerLevelIndex: 3,
      towerStarIndex: 9,
    },
    characters: [chascaChar],
    ttl: 300,
    fetchedAt: new Date().toISOString(),
  };
}
