import { describe, it, expect } from 'vitest';
import {
  CHASCA_BENCHMARK_BUILDS,
  isChascaBenchmarkUid,
  getChascaBenchmarkEnkaData,
} from '@/lib/akasha/chasca-benchmarks';
import { enkaClient } from '@/lib/enka';

describe('Chasca Benchmark Profiles & Showcase Verification', () => {
  it('should have 16 benchmark builds defined', () => {
    expect(CHASCA_BENCHMARK_BUILDS.length).toBe(16);
  });

  it('all benchmark UIDs should be recognized by isChascaBenchmarkUid', () => {
    for (const bm of CHASCA_BENCHMARK_BUILDS) {
      expect(isChascaBenchmarkUid(bm.uid)).toBe(true);
    }
    expect(isChascaBenchmarkUid('999999999')).toBe(false);
  });

  it('all benchmark builds should have valid full icon URLs for weapon and artifact sets', () => {
    for (const bm of CHASCA_BENCHMARK_BUILDS) {
      expect(bm.weapon.icon).toBeDefined();
      expect(bm.weapon.icon).toMatch(/^https:\/\/enka\.network\/ui\/.+\.png$/);
      for (const set of bm.artifactSetList) {
        expect(set.icon).toMatch(/^https:\/\/enka\.network\/ui\/.+\.png$/);
      }
    }
  });

  it('every benchmark UID should generate a complete, valid EnkaData profile', () => {
    for (const bm of CHASCA_BENCHMARK_BUILDS) {
      const data = getChascaBenchmarkEnkaData(bm.uid);
      expect(data).not.toBeNull();
      if (!data) continue;

      // Player validation
      expect(data.player.uid).toBe(bm.uid);
      expect(data.player.nickname).toBe(bm.nickname);
      expect(data.player.level).toBe(60);
      expect(data.player.profilePicture).toMatch(/^https:\/\/enka\.network\/ui\//);
      expect(data.player.nameCardUrl).toMatch(/^https:\/\/enka\.network\/ui\//);

      // Character validation
      expect(data.characters.length).toBeGreaterThanOrEqual(1);
      const chasca = data.characters[0];
      expect(chasca.id).toBe(10000104);
      expect(chasca.name).toBe('Chasca');
      expect(chasca.level).toBe(90);
      expect(chasca.constellation).toBe(bm.constellation);

      // Weapon validation
      expect(chasca.weapon).toBeDefined();
      expect(chasca.weapon.id).toBe(bm.weapon.id);
      expect(chasca.weapon.name).toBe(bm.weapon.name);
      expect(chasca.weapon.refinement).toBe(bm.weapon.refinement);
      expect(chasca.weapon.baseAtk).toBeGreaterThan(0);
      expect(chasca.weapon.icon).toMatch(/^https:\/\/enka\.network\/ui\//);

      // 5-piece Artifacts validation
      expect(chasca.artifacts.length).toBe(5);
      const slots = chasca.artifacts.map((a) => a.slot);
      expect(slots).toEqual(['flower', 'plume', 'sands', 'goblet', 'circlet']);

      for (const art of chasca.artifacts) {
        expect(art.rarity).toBe(5);
        expect(art.level).toBe(20);
        expect(art.mainStat).toBeDefined();
        expect(art.subStats.length).toBeGreaterThanOrEqual(4);
        expect(art.icon).toMatch(/^https:\/\/enka\.network\/ui\//);
        expect(art.cv).toBeGreaterThanOrEqual(0);
      }

      // Stats validation
      expect(chasca.stats.hp).toBe(bm.stats.hp);
      expect(chasca.stats.atk).toBe(bm.stats.atk);
      expect(chasca.stats.cr).toBe(bm.stats.cr);
      expect(chasca.stats.cd).toBe(bm.stats.cd);
      expect(chasca.stats.dmgBonus.anemo).toBe(46.6);

      // Damage calculation
      expect(chasca.damageCalc).toBeDefined();
      expect(chasca.damageCalc.totalDamage).toBe(bm.calculatedDamage);

      // Akasha benchmarks
      expect(chasca.akasha).toBeDefined();
      expect(chasca.akasha?.ranking).toBeGreaterThanOrEqual(1);
      expect(chasca.akasha?.outOf).toBe(16);
    }
  });

  it('enkaClient.fetchPlayerData resolves benchmark UIDs instantly and offline', async () => {
    for (const bm of CHASCA_BENCHMARK_BUILDS.slice(0, 4)) {
      const result = await enkaClient.fetchPlayerData(bm.uid);
      expect(result).toBeDefined();
      expect(result.player.uid).toBe(bm.uid);
      expect(result.characters[0].name).toBe('Chasca');
    }
  });

  it('/api/player/[uid] returns 200 with full Chasca showcase data for benchmark UIDs', async () => {
    const { GET } = await import('@/app/api/player/[uid]/route');
    const { NextRequest } = await import('next/server');

    for (const uid of ['859302914', '702914820', '601839201']) {
      const req = new NextRequest(`http://localhost:3000/api/player/${uid}`);
      const res = await GET(req, { params: { uid } });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.player.uid).toBe(uid);
      expect(json.characters.length).toBeGreaterThanOrEqual(1);
      expect(json.characters[0].name).toBe('Chasca');
      expect(json.characters[0].artifacts.length).toBe(5);
      expect(json.characters[0].weapon.name).toBeDefined();
    }
  });

  it('/api/leaderboard/10000104 returns builds with weaponName, weaponIcon and artifactSetList', async () => {
    const { GET } = await import('@/app/api/leaderboard/[characterId]/route');
    const { NextRequest } = await import('next/server');

    const req = new NextRequest('http://localhost:3000/api/leaderboard/10000104');
    const res = await GET(req, { params: { characterId: '10000104' } });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.results.length).toBeGreaterThan(0);
    for (const r of json.results) {
      expect(r.build.weaponName).toBeDefined();
      expect(r.build.weaponIcon).toMatch(/^https:\/\/enka\.network\/ui\//);
      expect(r.build.artifactSetList.length).toBeGreaterThan(0);
      expect(r.build.artifactSetList[0].icon).toMatch(/^https:\/\/enka\.network\/ui\//);
    }
  });
});
