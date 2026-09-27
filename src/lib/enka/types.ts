import { z } from 'zod';

// Enka API raw response schemas
export const PlayerInfoSchema = z.object({
  nickname: z.string(),
  level: z.number(), // Adventure Rank
  signature: z.string().optional(),
  worldLevel: z.number().optional(),
  nameCardId: z.number().optional(),
  finishAchievementNum: z.number().optional(),
  towerFloorIndex: z.number().optional(),
  towerLevelIndex: z.number().optional(),
  showAvatarInfoList: z.array(z.object({
    avatarId: z.number(),
    level: z.number(),
  })).optional(),
  showNameCardIdList: z.array(z.number()).optional(),
  profilePicture: z.object({
    id: z.number().optional(),
    avatarId: z.number().optional(),
  }).optional(),
});

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
  skillDepotId: z.number(),
  inherentProudSkillList: z.array(z.number()).optional(),
  skillLevelMap: z.record(z.string(), z.number()),
  equipList: z.array(EquipSchema),
  fetterInfo: z.object({
    expLevel: z.number(),
  }),
});

export const EnkaResponseSchema = z.object({
  playerInfo: PlayerInfoSchema,
  avatarInfoList: z.array(AvatarInfoSchema).optional(),
  ttl: z.number(),
  uid: z.string(),
  owner: z.object({
    username: z.string().optional(),
    profile: z.string().optional(),
    verified: z.boolean().optional(),
  }).optional(),
});

// Domain types (parsed, clean)
export type Element = 'Pyro' | 'Hydro' | 'Electro' | 'Cryo' | 'Dendro' | 'Anemo' | 'Geo';

export interface PlayerInfo {
  uid: string;
  nickname: string;
  level: number;
  signature?: string;
  nameCardId?: number;
  profilePictureId?: number;
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

export interface Artifact {
  id: number;
  name: string;
  setId: number;
  setName: string;
  rarity: number;
  level: number;
  slot: 'flower' | 'plume' | 'sands' | 'goblet' | 'circlet';
  mainStat: {
    key: string;
    value: number;
  };
  subStats: Array<{
    key: string;
    value: number;
    rolls?: number; // Estimated roll count
  }>;
  icon: string;
}

export interface Weapon {
  id: number;
  name: string;
  rarity: number;
  level: number;
  ascension: number;
  refinement: number;
  baseAtk: number;
  subStat?: {
    key: string;
    value: number;
  };
  icon: string;
}

export interface TalentLevels {
  normal: number;
  skill: number;
  burst: number;
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
  icon: string;
}

export interface EnkaData {
  player: PlayerInfo;
  characters: Character[];
  ttl: number;
  fetchedAt: Date;
}

// UID validation
export const UIDSchema = z.string().regex(/^\d{9,10}$/, 'UID must be 9 or 10 digits');

// Enka API error types
export interface EnkaError {
  code: number;
  message: string;
}

export const EnkaErrorCodes = {
  INVALID_UID: 400,
  PLAYER_NOT_FOUND: 404,
  GAME_MAINTENANCE: 424,
  RATE_LIMITED: 429,
  SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;
