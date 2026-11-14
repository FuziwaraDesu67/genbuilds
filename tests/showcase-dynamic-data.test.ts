/// <reference types="vitest/globals" />
import React from 'react';
import { renderToString } from 'react-dom/server';
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import ProfileClient from '@/components/profile/ProfileClient';
import AkashaShowcaseCard from '@/components/character/AkashaShowcaseCard';
import { parseEnkaResponse } from '@/lib/enka/parser';
import { getGameCharacter } from '@/lib/enka/game-data.generated';
import { getConstellationDetail } from '@/lib/enka/static-data';
import { evaluateTalentBoosts } from '@/lib/enka/talent-boost-data';
import { getNameCardUrl } from '@/lib/enka/namecard-data';
import { EnkaResponseSchema, type Character, type EnkaData } from '@/lib/enka/types';
import { extractTeammatesFromDetails } from '@/lib/akasha/client';
import { getLeaderboardCharactersSummary } from '@/lib/akasha/leaderboards';
import {
  formatCompactCount,
  formatRelativeTime,
  getEffectiveAkashaCv,
  getServerRegion,
} from '@/lib/utils';
import liveFixture from './fixtures/live-1813164100.json';

const clean = (html: string) => html.replace(/<!--.*?-->/g, '');

describe('Dynamic Player & Akasha Showcase Integration (No Hardcoded Static Fallbacks)', () => {
  const parsedLive = parseEnkaResponse(EnkaResponseSchema.parse(liveFixture));
  const sandroneChar = parsedLive.characters.find((c) => c.id === 10000133)!;

  it('parses all Enka player progression metrics (achievements, abyss, theater, stygian, region)', () => {
    expect(parsedLive.player.region).toBe('ASIA');
    expect(parsedLive.player.finishAchievementNum).toBe(1539);
    expect(parsedLive.player.towerStarIndex).toBe(36);
    expect(parsedLive.player.towerFloorIndex).toBe(12);
    expect(parsedLive.player.towerLevelIndex).toBe(3);
    expect(parsedLive.player.theaterActIndex).toBe(10);
    expect(parsedLive.player.theaterStarIndex).toBe(7);
    expect(parsedLive.player.stygianIndex).toBe(5);
    expect(parsedLive.player.stygianSeconds).toBe(340);
  });

  it('derives server region accurately from 9-digit and 10-digit UIDs and respects explicit region', () => {
    expect(getServerRegion('1813164100')).toBe('ASIA');
    expect(getServerRegion('808667328')).toBe('ASIA');
    expect(getServerRegion('600000001')).toBe('NA');
    expect(getServerRegion('1600000001')).toBe('NA');
    expect(getServerRegion('700000001')).toBe('EU');
    expect(getServerRegion('1700000001')).toBe('EU');
    expect(getServerRegion('900000001')).toBe('TW/HK');
    expect(getServerRegion('100000001')).toBe('CN');
    expect(getServerRegion('1813164100', 'eu')).toBe('EU');
  });

  it('formats relative update times and compact leaderboard counts accurately', () => {
    const base = 1_800_000_000_000;
    expect(formatRelativeTime(base - 10_000, base)).toBe('just now');
    expect(formatRelativeTime(base - 5 * 60_000, base)).toBe('5 mins ago');
    expect(formatRelativeTime(base - 2 * 3_600_000, base)).toBe('2 hours ago');
    expect(formatRelativeTime(base - 4 * 86_400_000, base)).toBe('4 days ago');

    expect(formatCompactCount(6967)).toBe('6967');
    expect(formatCompactCount(25916)).toBe('25.9k');
    expect(formatCompactCount(171794)).toBe('172k');
    expect(formatCompactCount(1280000)).toBe('1.28m');
  });

  it('extracts authentic teammate portraits from Akasha calculation details strings', () => {
    const sandroneTeam = extractTeammatesFromDetails(
      'C1 Yae + 4-pc Tenacity Qiqi + Escoffier. 3(CA E) with Q anywhere.',
      10000133,
      'Sandrone'
    );
    expect(sandroneTeam.map((m) => m.name)).toEqual([
      'Sandrone',
      'Yae Miko',
      'Qiqi',
      'Escoffier',
    ]);

    const ayakaTeam = extractTeammatesFromDetails(
      'C0 Ayaka, C0R5 TTDS Mona @ 4pc Tenacity, C0R1 Kazuha @ 4pc VV, C6R5 Diona @ 4pc Noblesse. Combo: ...',
      10000002,
      'Kamisato Ayaka'
    );
    expect(ayakaTeam.map((m) => m.name)).toEqual([
      'Kamisato Ayaka',
      'Mona',
      'Kaedehara Kazuha',
      'Diona',
    ]);

    const yaeTeam = extractTeammatesFromDetails(
      'C1 Yae + Sandrone + 4-pc Tenacity Qiqi + Cryo Flex. 14 E hits + 7 Stellar-Conduct hits.',
      10000058,
      'Yae Miko'
    );
    expect(yaeTeam.map((m) => m.name)).toEqual([
      'Yae Miko',
      'Sandrone',
      'Qiqi',
      'Cryo Flex',
    ]);
    expect(yaeTeam[3]?.flexElement).toBe('Cryo');
  });

  it('resolves Namecard banner URLs and renders Equipped Namecard + element theme styling', () => {
    expect(getNameCardUrl(210284)).toContain('UI_NameCardPic_MarionetteNew_P.png');
    expect(getNameCardUrl(210301)).toContain('UI_NameCardPic_Snezhnaya2_P.png');
    expect(parsedLive.player.nameCardUrl).toContain('UI_NameCardPic_MarionetteNew_P.png');

    const yaeChar = parsedLive.characters.find((c) => c.id === 10000058)!;
    const html = clean(
      renderToString(
        React.createElement(ProfileClient, {
          uid: '1813164100',
          initialData: parsedLive,
        })
      )
    );
    expect(html).toContain('alt="Equipped Namecard"');
    expect(html).toContain('UI_NameCardPic_MarionetteNew_P.png');

    const electroCardHtml = clean(
      renderToString(
        React.createElement(AkashaShowcaseCard, {
          character: yaeChar,
          uid: '1813164100',
          playerNickname: 'Addy',
        })
      )
    );
    expect(electroCardHtml).toContain('#150d21');
    expect(electroCardHtml).toContain(`Lv. ${yaeChar.weapon.level} / 80`);

    const lowLvWidsithHtml = clean(
      renderToString(
        React.createElement(AkashaShowcaseCard, {
          character: { ...yaeChar, weapon: { ...yaeChar.weapon, level: 20, ascension: 0 } },
          uid: '1813164100',
          playerNickname: 'Addy',
        })
      )
    );
    expect(lowLvWidsithHtml).toContain('Lv. 20 / 20');
  });

  it('ensures normal_claymore.png matches Skill_A_04 and normal_bow.png matches Skill_A_02 (not swapped)', () => {
    const md5 = (rel: string) =>
      crypto.createHash('md5').update(fs.readFileSync(path.resolve(process.cwd(), rel))).digest('hex');

    expect(md5('public/icons/talents/normal_claymore.png')).toBe(
      md5('public/icons/talents/Skill_A_04.png')
    );
    expect(md5('public/icons/talents/normal_bow.png')).toBe(
      md5('public/icons/talents/Skill_A_02.png')
    );
  });

  it('renders custom player badges and Akasha carousel ranks without hardcoded Addy fallbacks', () => {
    const otherPlayerData: EnkaData = {
      player: {
        uid: '600000001',
        nickname: 'TravelerNA',
        level: 45,
        region: 'NA',
        finishAchievementNum: 412,
        towerFloorIndex: 9,
        towerLevelIndex: 2,
        // No Stygian, Theater, or 36 Abyss stars
      },
      characters: [
        {
          ...sandroneChar,
          akasha: undefined,
        },
      ],
      ttl: 60,
      fetchedAt: new Date(),
    };

    const html = clean(
      renderToString(
        React.createElement(ProfileClient, {
          uid: '600000001',
          initialData: otherPlayerData,
        })
      )
    );

    expect(html).toContain('NA');
    expect(html).toContain('412');
    expect(html).toContain('AR45');
    expect(html).toContain('9-2');
    expect(html).not.toContain('Last updated 3 days ago');
    expect(html).not.toContain('1532');
    expect(html).not.toContain('340s');
    expect(html).not.toContain('7/10');
    expect(html).not.toContain('113k/953k');
    expect(html).not.toContain('112998');
    expect(html).not.toContain('952766');
    expect(html).toContain('Cryo DMG Bonus');
    expect(html).toContain('0.0%');
    expect(html).toContain('Unranked');
  });

  it('renders fetched Akasha leaderboard ranking, team icons, and Top Avg radar polygon on AkashaShowcaseCard', () => {
    const rankedSandrone: Character = {
      ...sandroneChar,
      akasha: {
        calculationId: '1000013300',
        category: 'STELLAR 110% ER',
        title: 'Stellar-Conduct Basic Team, Avg DMG',
        ranking: 25916,
        outOf: 171794,
        topPercent: 15.09,
        result: 2234417,
        teammates: [
          { id: 10000133, name: 'Sandrone', icon: '/icons/characters/10000133.png' },
          { id: 10000058, name: 'Yae Miko', icon: '/icons/characters/10000058.png' },
          { id: 10000035, name: 'Qiqi', icon: '/icons/characters/10000035.png' },
          { id: 10000112, name: 'Escoffier', icon: '/icons/characters/10000112.png' },
        ],
        topStats: {
          hp: 18500,
          atk: 2700,
          def: 800,
          em: 80,
          er: 112.5,
          dmgBonus: 0,
          cr: 75.0,
          cd: 255.0,
          sampleSize: 5,
        },
        source: 'akasha',
      },
    };

    const html = clean(
      renderToString(
        React.createElement(AkashaShowcaseCard, {
          character: rankedSandrone,
          uid: '1813164100',
          playerNickname: 'Addy',
        })
      )
    );

    expect(html).toContain('STELLAR 110% ER');
    expect(html).toContain('TOP 15%');
    expect(html).toContain('25,916');
    expect(html).toContain('171,794');
    expect(html).toContain('Yae Miko');
    expect(html).toContain('Escoffier');
    expect(html).not.toContain('112998');
    expect(html).not.toContain('952766');
    expect(html).not.toContain('Citlali');
    expect(html).toContain('TOP 1% AVG');
    expect(html).toContain('0.0%');
    expect(getEffectiveAkashaCv(rankedSandrone)).toBe(227.8);
  });

  it('resolves Vesna (10000143) metadata, assets, constellations, talent boosts, and showcase rendering', () => {
    const meta = getGameCharacter(10000143);
    expect(meta).not.toBeNull();
    expect(meta?.name).toBe('Vesna');
    expect(meta?.element).toBe('Anemo');
    expect(meta?.rarity).toBe(5);
    expect(meta?.weaponType).toBe('Sword');

    expect(evaluateTalentBoosts(10000143, 3)).toEqual({ normal: false, skill: true, burst: false });
    expect(evaluateTalentBoosts(10000143, 5)).toEqual({ normal: false, skill: true, burst: true });

    const c1 = getConstellationDetail(10000143, 'Vesna', 1);
    const c6 = getConstellationDetail(10000143, 'Vesna', 6);
    expect(c1.name).toBe("Winter's Farewell Feast");
    expect(c6.name).toBe('Unwavering Ardor');

    const publicDir = path.resolve(process.cwd(), 'public');
    const requiredAssets = [
      'icons/characters/10000143.png',
      'icons/characters/10000143_gacha.png',
      'icons/characters/10000143_const_0.png',
      'icons/characters/10000143_const_1.png',
      'icons/characters/10000143_const_2.png',
      'icons/characters/10000143_const_3.png',
      'icons/characters/10000143_const_4.png',
      'icons/characters/10000143_const_5.png',
      'icons/talents/10000143_skill.png',
      'icons/talents/10000143_burst.png',
    ];
    for (const rel of requiredAssets) {
      expect(fs.existsSync(path.join(publicDir, rel))).toBe(true);
    }

    const vesnaChar: Character = {
      ...sandroneChar,
      id: 10000143,
      name: 'Vesna',
      element: 'Anemo',
      rarity: 5,
      icon: '/icons/characters/10000143.png',
      gachaSplash: '/icons/characters/10000143_gacha.png',
      stats: {
        ...sandroneChar.stats,
        dmgBonus: { ...sandroneChar.stats.dmgBonus, anemo: 46.6 },
      },
      akasha: undefined,
    };

    const html = clean(
      renderToString(
        React.createElement(AkashaShowcaseCard, {
          character: vesnaChar,
          uid: '1813164100',
          playerNickname: 'Addy',
        })
      )
    );

    expect(html).toContain('Vesna');
    expect(html).toContain('/icons/characters/10000143_gacha.png');
    expect(html).toContain('Anemo DMG Bonus');
    expect(html).toContain("Winter&#x27;s Farewell Feast");
  });

  it('returns local configured leaderboard directory entries safely in offline/test mode', async () => {
    const summary = await getLeaderboardCharactersSummary();
    expect(summary.length).toBeGreaterThan(0);
    expect(summary.every((entry) => entry.source === 'local')).toBe(true);
    const huTaoBoard = summary.find((entry) => entry.characterId === 10000046);
    expect(huTaoBoard).toBeDefined();
    expect(huTaoBoard?.categories.length).toBeGreaterThan(0);
  });

  it('renders people-build radar comparison with effective playerStats override and TOP 1% AVG benchmark', () => {
    const rankedWithPlayerStats: Character = {
      ...sandroneChar,
      akasha: {
        calculationId: '1000013300',
        category: 'STELLAR 110% ER',
        title: 'Stellar 110% ER',
        details: 'C1 Yae + 4-pc Tenacity Qiqi + Escoffier',
        ranking: 25916,
        outOf: 171794,
        topPercent: 15.0855,
        result: 985432,
        topStats: {
          hp: 18619,
          atk: 3034.7,
          def: 763,
          em: 95.3,
          er: 114.2,
          cr: 71.1,
          cd: 237.9,
          dmgBonus: 0,
          sourceLabel: 'TOP 1% AVG',
        },
        playerStats: {
          hp: 18655,
          atk: 2917.7,
          def: 787,
          em: 72,
          er: 116.2,
          cr: 64.6,
          cd: 241.0,
          dmgBonus: 0,
        },
      },
    };

    const html = clean(
      renderToString(
        React.createElement(AkashaShowcaseCard, {
          character: rankedWithPlayerStats,
          uid: '1813164100',
          playerNickname: 'Addy',
        })
      )
    );

    expect(html).toContain('TOP 1% AVG');
    expect(html).toContain('ATK: 2917.7 (TOP 1% AVG: 3034.7)');
    expect(html).toContain('TOP 1% AVG • ATK: 3034.7');
  });

  it('resolves Weapon 14525 as Starsealed Edict · Awakened across parser and showcase UI', () => {
    const rawAvatar = structuredClone((liveFixture as { avatarInfoList: any[] }).avatarInfoList[0]);
    const weaponIdx = rawAvatar.equipList.findIndex((e: any) => e.weapon);
    rawAvatar.equipList[weaponIdx] = {
      ...rawAvatar.equipList[weaponIdx],
      itemId: 14525,
      flat: {
        ...rawAvatar.equipList[weaponIdx].flat,
        nameTextMapHash: '99988877714525',
        rankLevel: 5,
        weaponStats: [
          { appendPropId: 'FIGHT_PROP_BASE_ATTACK', statValue: 542 },
          { appendPropId: 'FIGHT_PROP_CRITICAL_HURT', statValue: 88.2 },
        ],
      },
    };

    const parsed = parseEnkaResponse(
      EnkaResponseSchema.parse({
        ...liveFixture,
        avatarInfoList: [rawAvatar],
      })
    );
    expect(parsed.characters[0].weapon.name).toBe('Starsealed Edict · Awakened');
    expect(parsed.characters[0].weapon.passiveName).toBe("Dawnstar's Flowing Trail");

    // Verify stale cached "Weapon 14525" payloads also self-heal in ProfileClient & AkashaShowcaseCard
    const staleCachedChar: Character = {
      ...sandroneChar,
      weapon: {
        ...sandroneChar.weapon,
        id: 14525,
        name: 'Weapon 14525',
        rarity: 5,
        baseAtk: 542,
      },
    };

    const html = clean(
      renderToString(
        React.createElement(AkashaShowcaseCard, {
          character: staleCachedChar,
          uid: '1813164100',
          playerNickname: 'Addy',
        })
      )
    );
    expect(html).toContain('Starsealed Edict · Awakened');
    expect(html).not.toContain('Weapon 14525');
  });
});
