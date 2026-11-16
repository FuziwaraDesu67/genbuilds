import { z } from 'zod';

// ============================================================================
// Enka API Raw Response Schemas
// ============================================================================

export const PlayerInfoSchema = z.object({
  nickname: z.string(),
  level: z.number(), // Adventure Rank
  signature: z.string().optional(),
  worldLevel: z.number().optional(),
  nameCardId: z.number().optional(),
  finishAchievementNum: z.number().optional(),
  towerFloorIndex: z.number().optional(),
  towerLevelIndex: z.number().optional(),
  towerStarIndex: z.number().optional(),
  theaterActIndex: z.number().optional(),
  theaterModeIndex: z.number().optional(),
  theaterStarIndex: z.number().optional(),
  stygianIndex: z.number().optional(),
  stygianSeconds: z.number().optional(),
  stygianId: z.number().optional(),
  fetterCount: z.number().optional(),
  showAvatarInfoList: z.array(z.object({
    avatarId: z.number(),
    level: z.number(),
  }).passthrough()).optional(),
  showNameCardIdList: z.array(z.number()).optional(),
  profilePicture: z.object({
    id: z.number().optional(),
    avatarId: z.number().optional(),
  }).passthrough().optional(),
}).passthrough();

export const FightPropMapSchema = z.record(z.string(), z.number());

export const EquipSchema = z.object({
  itemId: z.number(),
  reliquary: z.object({
    level: z.number(),
    mainPropId: z.number(),
    appendPropIdList: z.array(z.number()).optional(),
  }).optional(),
  flat: z.object({
    nameTextMapHash: z.string(),
    setNameTextMapHash: z.string().optional(),
    rankLevel: z.number(),
    reliquaryMainstat: z.object({
      mainPropId: z.string(),
      statValue: z.number(),
    }).optional(),
    reliquarySubstats: z.array(z.object({
      appendPropId: z.string(),
      statValue: z.number(),
    })).optional(),
    itemType: z.string(),
    icon: z.string(),
    equipType: z.string().optional(),
    weaponStats: z.array(z.object({
      appendPropId: z.string(),
      statValue: z.number(),
    })).optional(),
  }),
  weapon: z.object({
    level: z.number(),
    promoteLevel: z.number().optional(),
    affixMap: z.record(z.string(), z.number()).optional(),
  }).optional(),
});

export const AvatarInfoSchema = z.object({
  avatarId: z.number(),
  propMap: z.record(z.string(), z.object({
    type: z.number(),
    ival: z.string().optional(),
    val: z.string().optional(),
  })),
  talentIdList: z.array(z.number()).optional(),
  fightPropMap: FightPropMapSchema,
  skillDepotId: z.number().optional(),
  inherentProudSkillList: z.array(z.number()).optional(),
  skillLevelMap: z.record(z.string(), z.number()),
  proudSkillExtraLevelMap: z.record(z.string(), z.number()).optional(),
  equipList: z.array(EquipSchema),
  fetterInfo: z.object({
    expLevel: z.number(),
  }),
}).passthrough();

export const EnkaResponseSchema = z.object({
  playerInfo: PlayerInfoSchema,
  avatarInfoList: z.array(AvatarInfoSchema).optional(),
  ttl: z.number(),
  uid: z.string(),
  region: z.string().optional(),
  owner: z.object({
    username: z.string().optional(),
    profile: z.string().optional(),
    verified: z.boolean().optional(),
  }).optional(),
}).passthrough();

// ============================================================================
// Domain Quality & Metadata Types
// ============================================================================

export type Element = 'Pyro' | 'Hydro' | 'Electro' | 'Cryo' | 'Dendro' | 'Anemo' | 'Geo';

export type QualityBadge = 'Subpar' | 'Decent' | 'Good' | 'Great' | 'Godly';

export interface WeaponRefinementValues {
  r1?: string | number;
  r2?: string | number;
  r3?: string | number;
  r4?: string | number;
  r5?: string | number;
  1?: string | number;
  2?: string | number;
  3?: string | number;
  4?: string | number;
  5?: string | number;
  [key: string | number]: any;
}

export interface WeaponMetadata {
  id: number;
  name: string;
  type: 'Sword' | 'Claymore' | 'Polearm' | 'Catalyst' | 'Bow';
  rarity: 3 | 4 | 5;
  baseAtkLv90?: number;
  subStat?: {
    type?: 'cr' | 'cd' | 'atkPercent' | 'hpPercent' | 'defPercent' | 'er' | 'em' | 'physDmg' | string;
    key?: string;
    label?: string;
    displayLabel?: string;
    valueLv90?: number;
  };
  passiveName: string;
  descriptionTemplate: string;
  refinements: Record<string | number, any>;
  refinementDescriptions?: string[];
}

export interface ArtifactSetDefinition {
  id: number;
  name: string;
  aliases?: number[];
  twoPiece: string;
  fourPiece: string;
  onePiece?: string;
}

export interface TalentBoostConfig {
  c3: 'normal' | 'skill' | 'burst';
  c5: 'normal' | 'skill' | 'burst';
}

// ============================================================================
// Parsed Domain Models
// ============================================================================

export interface PlayerInfo {
  uid: string;
  nickname: string;
  level: number;
  region?: string;
  worldLevel?: number;
  profilePicture?: string;
  signature?: string;
  nameCardId?: number;
  nameCardUrl?: string;
  profilePictureId?: number;
  finishAchievementNum?: number;
  towerFloorIndex?: number;
  towerLevelIndex?: number;
  towerStarIndex?: number;
  theaterActIndex?: number;
  theaterStarIndex?: number;
  theaterModeIndex?: number;
  stygianIndex?: number;
  stygianSeconds?: number;
}

export interface CharacterStats {
  hp: number;
  atk: number;
  def: number;
  em: number; // Elemental Mastery
  er: number; // Energy Recharge %
  cr: number; // Crit Rate %
  cd: number; // Crit DMG %
  healingBonus?: number;
  dmgBonus: Record<string, number>; // e.g., { pyro: 46.6, physical: 0 }
}

export interface ArtifactSubStat {
  key: string;
  value: number;
  rolls?: number;
  pips?: string; // e.g. "[●●●○]" or pip count
}

export interface Artifact {
  id: number;
  name: string;
  setId: number;
  setName: string;
  setBonusText?: {
    twoPiece?: string;
    fourPiece?: string;
  };
  slot: 'flower' | 'plume' | 'sands' | 'goblet' | 'circlet';
  rarity: number;
  level: number;
  mainStat: {
    key: string;
    value: number;
  };
  subStats: Array<{
    key: string;
    value: number;
    rolls?: number;
    pips?: string;
  }>;
  cv?: number;
  qualityBadge?: QualityBadge;
  icon: string;
}

export interface Weapon {
  id: number;
  name: string;
  rarity: number;
  level: number;
  ascension: number;
  refinement: number; // 1-5
  baseAtk: number;
  subStat?: {
    key: string;
    value: number;
  };
  passiveName?: string;
  passiveDescription?: string;
  descriptionTemplate?: string;
  refinements?: Record<string | number, any>;
  refinementDescriptions?: string[];
  icon: string;
}

export interface TalentBoosts {
  normal?: boolean;
  skill?: boolean;
  burst?: boolean;
}

export interface TalentLevels {
  normal: number;
  skill: number;
  burst: number;
  boosted?: TalentBoosts;
  icons?: {
    normal?: string;
    skill?: string;
    burst?: string;
  };
}

export interface ActiveSetBonus {
  setId: number;
  name?: string;
  setName: string;
  count?: number;
  twoPiece?: string;
  fourPiece?: string;
  twoPieceActive: boolean;
  fourPieceActive: boolean;
  twoPieceText?: string;
  fourPieceText?: string;
  activeTier?: '2pc' | '4pc' | 'none';
}

export interface AkashaBenchmarkStats {
  hp: number;
  atk: number;
  def: number;
  em: number;
  er: number;
  dmgBonus: number;
  cr: number;
  cd: number;
  sampleSize?: number;
  dmgBonusKey?: string;
  sourceLabel?: string;
}

export interface AkashaTeammate {
  id?: number;
  name: string;
  icon: string;
  flexElement?: Element;
}

export interface AkashaCharacterData {
  calculationId: string;
  category: string;
  title?: string;
  details?: string;
  ranking: number;
  outOf: number;
  topPercent: number;
  result?: number;
  teammates?: AkashaTeammate[];
  topStats?: AkashaBenchmarkStats;
  playerStats?: AkashaBenchmarkStats;
  source?: 'akasha' | 'local';
}

export interface Character {
  id: number;
  name: string;
  element: Element;
  rarity: number;
  level: number;
  constellation: number;
  friendshipLevel: number;
  talents: TalentLevels;
  stats: CharacterStats;
  weapon: Weapon;
  artifacts: Artifact[];
  artifactSets: Record<number, number>; // setId -> piece count
  activeSetBonuses?: ActiveSetBonus[];
  totalCv?: number;
  akashaCv?: number;
  effectiveCv?: number;
  setBonusCr?: number;
  setBonusCv?: number;
  isCvCapped?: boolean;
  qualityBadge?: QualityBadge;
  damageCalc?: any;
  akasha?: AkashaCharacterData;
  icon: string;
  gachaSplash?: string;
}

export interface EnkaData {
  player: PlayerInfo;
  characters: Character[];
  ttl: number;
  fetchedAt?: Date | string;
  akashaUpdatedAt?: number;
}

// ============================================================================
// Validation & Error Handling
// ============================================================================

export const UIDSchema = z.string().regex(/^\d{9,10}$/, 'UID must be 9 or 10 digits');

export class EnkaError extends Error {
  code: number;

  constructor(code: number, message: string) {
    super(message);
    this.name = 'EnkaError';
    this.code = code;
    Object.setPrototypeOf(this, EnkaError.prototype);
  }
}

export const EnkaErrorCodes = {
  INVALID_UID: 400,
  PLAYER_NOT_FOUND: 404,
  GAME_MAINTENANCE: 424,
  RATE_LIMITED: 429,
  SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;
