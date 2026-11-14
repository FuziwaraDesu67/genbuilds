import { pgTable, text, integer, decimal, jsonb, timestamp, serial, unique, index, boolean } from 'drizzle-orm/pg-core';

export const players = pgTable('players', {
  uid: text('uid').primaryKey(),
  nickname: text('nickname').notNull(),
  ar: integer('ar').notNull(), // Adventure Rank
  signature: text('signature'),
  namecardId: integer('namecard_id'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const builds = pgTable('builds', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().references(() => players.uid),
  avatarId: integer('avatar_id').notNull(),
  weaponId: integer('weapon_id').notNull(),
  artifactSets: jsonb('artifact_sets').notNull(), // Record<number, number> - setId -> piece count
  stats: jsonb('stats').notNull(), // CharacterStats
  talentLevels: jsonb('talent_levels').notNull(), // TalentLevels
  constellation: integer('constellation').notNull(),
  calculatedDamage: decimal('calculated_damage', { precision: 12, scale: 2 }),
  calcDetails: jsonb('calc_details'), // Full calc breakdown
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  uniqueUidAvatar: unique().on(table.uid, table.avatarId),
  leaderboardIdx: index('idx_builds_leaderboard').on(table.avatarId, table.calculatedDamage),
  uidIdx: index('idx_builds_uid').on(table.uid),
}));

export const users = pgTable('users', {
  id: text('id').primaryKey(), // Generated UUID or string
  username: text('username').notNull().unique(),
  email: text('email').unique(),
  passwordHash: text('password_hash'),
  linkedUid: text('linked_uid'),
  isVerified: boolean('is_verified').default(false).notNull(),
  verificationCode: text('verification_code'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const favorites = pgTable('favorites', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  targetUid: text('target_uid').notNull(),
  targetNickname: text('target_nickname'),
  targetAvatarUrl: text('target_avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  uniqueUserTarget: unique().on(table.userId, table.targetUid),
  userIdIdx: index('idx_favorites_user_id').on(table.userId),
}));

export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;
export type Build = typeof builds.$inferSelect;
export type NewBuild = typeof builds.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Favorite = typeof favorites.$inferSelect;
export type NewFavorite = typeof favorites.$inferInsert;
