/// <reference types="vitest/globals" />
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { NextRequest } from 'next/server';
import { enkaClient, getVaresaMockData, DEMO_FALLBACK_UID } from '../src/lib/enka';
import { GET } from '../src/app/api/player/[uid]/route';
import ProfilePage from '../src/app/u/[uid]/page';
import { clearRateLimit } from '../src/lib/redis';

describe('Adversarial Test Suite: Milestone 2 UID 1813164100 Route & Markup', () => {

  describe('Objective 1: Offline / Disconnected Network State Resilience', () => {
    const originalFetch = globalThis.fetch;
    const originalEnv = { ...process.env };

    afterEach(() => {
      globalThis.fetch = originalFetch;
      process.env = { ...originalEnv };
    });

    it('serves valid demo fixture when network throws transport error (DNS, offline, ECONNREFUSED)', async () => {
      // Force non-test environment flags to test real catch fallback in enkaClient
      delete (process.env as any).NODE_ENV;
      delete process.env.VITEST;
      delete process.env.ENKA_OFFLINE;
      delete process.env.OFFLINE_MODE;

      globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('fetch failed: ENOTFOUND enka.network'));

      const data = await enkaClient.fetchPlayerData('1813164100');
      expect(data).toBeDefined();
      expect(data.player.nickname).toBe('Addy');
      expect(data.player.uid).toBe('1813164100');
      expect(data.characters).toHaveLength(1);
      expect(data.characters[0].artifacts).toHaveLength(5);
    });

    it('serves valid demo fixture when API returns HTTP 404, 429, 500, or 503 errors', async () => {
      delete (process.env as any).NODE_ENV;
      delete process.env.VITEST;
      delete process.env.ENKA_OFFLINE;
      delete process.env.OFFLINE_MODE;

      for (const status of [404, 429, 500, 503]) {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status,
          statusText: `HTTP Error ${status}`,
          json: async () => ({ error: 'upstream failure' }),
        });

        const data = await enkaClient.fetchPlayerData('1813164100');
        expect(data).toBeDefined();
        expect(data.player.nickname).toBe('Addy');
        expect(data.player.uid).toBe('1813164100');
      }
    });

    it('throws network error for non-demo UIDs when network is offline', async () => {
      delete (process.env as any).NODE_ENV;
      delete process.env.VITEST;
      delete process.env.ENKA_OFFLINE;
      delete process.env.OFFLINE_MODE;

      globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('fetch failed: ENOTFOUND'));

      await expect(enkaClient.fetchPlayerData('800000001')).rejects.toThrow('fetch failed');
    });

    it('/api/player/1813164100 returns 200 OK even when live Enka API throws', async () => {
      delete (process.env as any).NODE_ENV;
      delete process.env.VITEST;
      delete process.env.ENKA_OFFLINE;
      delete process.env.OFFLINE_MODE;

      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Connection timeout'));

      const req = new NextRequest('http://localhost:3000/api/player/1813164100', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      const res = await GET(req, { params: { uid: '1813164100' } });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.player.nickname).toBe('Addy');
      expect(json.player.uid).toBe('1813164100');
      expect(json.characters).toHaveLength(1);
    });
  });

  describe('Objective 2: Player Info Integrity & 5 Artifact Pieces for Addy', () => {
    it('returns valid player metadata for Addy (UID 1813164100)', async () => {
      const data = await enkaClient.fetchPlayerData('1813164100');

      expect(data.player).toBeDefined();
      expect(data.player.nickname).toBe('Addy');
      expect(data.player.uid).toBe('1813164100');
      expect(data.player.level).toBe(60);
      expect(data.player.signature).toBe('Natlan explorer');
      expect(data.ttl).toBeGreaterThan(0);
    });

    it('returns C1 Varesa with The Widsith and exactly 5 equipped artifact pieces', async () => {
      const data = await enkaClient.fetchPlayerData('1813164100');
      expect(data.characters).toHaveLength(1);

      const varesa = data.characters[0];
      expect(varesa.constellation).toBe(1);
      expect(varesa.level).toBe(90);
      expect(varesa.weapon).toBeDefined();
      expect(varesa.weapon.name).toBe('The Widsith');
      expect(varesa.weapon.refinement).toBe(5);

      const artifacts = varesa.artifacts;
      expect(artifacts).toHaveLength(5);

      const slots = artifacts.map(a => a.slot);
      expect(slots).toEqual(expect.arrayContaining(['flower', 'plume', 'sands', 'goblet', 'circlet']));
      expect(new Set(slots).size).toBe(5);
    });

    it('verifies all 5 artifact pieces have normalized stats (no 100x multiplication error)', async () => {
      const data = await enkaClient.fetchPlayerData('1813164100');
      const artifacts = data.characters[0].artifacts;

      for (const piece of artifacts) {
        // Percentage main stats must be between 1.0 and 100.0, never 4660.0%
        if (['FIGHT_PROP_HP_PERCENT', 'FIGHT_PROP_ATTACK_PERCENT', 'FIGHT_PROP_DEFENSE_PERCENT',
             'FIGHT_PROP_CRITICAL', 'FIGHT_PROP_CRITICAL_HURT', 'FIGHT_PROP_CHARGE_EFFICIENCY',
             'FIGHT_PROP_ELEC_ADD_HURT'].includes(piece.mainStat.key)) {
          expect(piece.mainStat.value).toBeLessThanOrEqual(100.0);
          expect(piece.mainStat.value).toBeGreaterThan(1.0);
        }

        // Substats must all be <= 100.0
        for (const sub of piece.subStats) {
          if (['FIGHT_PROP_CRITICAL', 'FIGHT_PROP_CRITICAL_HURT', 'FIGHT_PROP_ATTACK_PERCENT',
               'FIGHT_PROP_CHARGE_EFFICIENCY'].includes(sub.key)) {
            expect(sub.value).toBeLessThanOrEqual(60.0);
            expect(sub.value).toBeGreaterThan(1.0);
          }
        }
      }

      // Check specific sands, goblet, circlet values
      const sands = artifacts.find(a => a.slot === 'sands')!;
      expect(sands.mainStat.value).toBe(46.6); // ATK% 46.6%

      const goblet = artifacts.find(a => a.slot === 'goblet')!;
      expect(goblet.mainStat.value).toBe(46.6); // Electro DMG 46.6%

      const circlet = artifacts.find(a => a.slot === 'circlet')!;
      expect(circlet.mainStat.value).toBe(62.2); // CRIT DMG 62.2%
    });

    it('verifies universal Crit Value (CV) and roll pips on all 5 artifact pieces', async () => {
      const data = await enkaClient.fetchPlayerData('1813164100');
      const artifacts = data.characters[0].artifacts;

      for (const piece of artifacts) {
        expect(piece.cv).toBeDefined();
        expect(piece.cv).toBeGreaterThanOrEqual(0);
        expect(piece.qualityBadge).toBeDefined();
        expect(['Subpar', 'Decent', 'Good', 'Great', 'Godly']).toContain(piece.qualityBadge);

        for (const sub of piece.subStats) {
          expect(sub.rolls).toBeGreaterThanOrEqual(1);
          expect(sub.rolls).toBeLessThanOrEqual(6);
          expect(sub.pips).toBeDefined();
          expect(typeof sub.pips).toBe('string');
          expect(sub.pips).toMatch(/[●○★]/);
        }
      }

      // Flower piece: CR 10.5, CD 21.8 => CV = 2 * 10.5 + 21.8 = 42.8 (Great)
      const flower = artifacts.find(a => a.slot === 'flower')!;
      expect(flower.cv).toBe(42.8);
      expect(flower.qualityBadge).toBe('Great');

      // Feather piece: CR 7.8, CD 28.0 => CV = 2 * 7.8 + 28.0 = 43.6 (Great)
      const plume = artifacts.find(a => a.slot === 'plume')!;
      expect(plume.cv).toBe(43.6);
      expect(plume.qualityBadge).toBe('Great');

      // Total character CV
      const varesa = data.characters[0];
      expect(varesa.totalCv).toBe(178.0);
      expect(varesa.qualityBadge).toBe('Decent');
    });

    it('verifies Obsidian Codex 2pc and 4pc set skill descriptions are present', async () => {
      const data = await enkaClient.fetchPlayerData('1813164100');
      const artifacts = data.characters[0].artifacts;

      for (const piece of artifacts) {
        expect(piece.setName).toBe('Obsidian Codex');
        expect(piece.setBonusText).toBeDefined();
        expect(piece.setBonusText?.twoPiece).toContain('Nightsoul');
        expect(piece.setBonusText?.twoPiece).toContain('15%');
        expect(piece.setBonusText?.fourPiece).toContain('CRIT Rate increases by 40%');
      }
    });
  });

  describe('Objective 3: Rapid Consecutive Requests to /api/player/1813164100 (No HTTP 429)', () => {
    const testIp = '198.51.100.77';

    beforeEach(async () => {
      await clearRateLimit(testIp);
    });

    afterEach(async () => {
      await clearRateLimit(testIp);
    });

    it('handles 50 consecutive requests to /api/player/1813164100 without returning HTTP 429', async () => {
      const req = new NextRequest('http://localhost:3000/api/player/1813164100', {
        headers: { 'x-forwarded-for': testIp },
      });

      const promises = Array.from({ length: 50 }, () =>
        GET(req, { params: { uid: '1813164100' } })
      );

      const responses = await Promise.all(promises);

      // Verify EVERY response is HTTP 200 OK
      for (let i = 0; i < responses.length; i++) {
        expect(responses[i].status).toBe(200);
      }

      // Verify no response has status 429
      const rateLimited = responses.filter(r => r.status === 429);
      expect(rateLimited).toHaveLength(0);
    });

    it('enforces rate limiting (HTTP 429) for non-exempt UIDs after limit threshold', async () => {
      const otherUid = '800000001';
      const req = new NextRequest(`http://localhost:3000/api/player/${otherUid}`, {
        headers: { 'x-forwarded-for': testIp },
      });

      let rateLimitedCount = 0;
      // In-memory limit is 10 requests per window
      for (let i = 0; i < 35; i++) {
        const res = await GET(req, { params: { uid: otherUid } });
        if (res.status === 429) {
          rateLimitedCount++;
          const body = await res.json();
          expect(body.error).toBe('Rate limit exceeded');
        }
      }

      expect(rateLimitedCount).toBeGreaterThan(0);
      expect(rateLimitedCount).toBe(25); // 35 - 10 = 25 rate-limited requests
    });
  });

  describe('Objective 4: ProfilePage Server-Side Rendering (SSR) Markup for 1813164100', () => {
    it('server-renders complete showcase markup containing player Addy and character card', async () => {
      const jsx = await ProfilePage({ params: { uid: '1813164100' } });
      const html = ReactDOMServer.renderToString(jsx);

      expect(html).toBeDefined();

      // Header markup assertions
      expect(html).toContain('Addy');
      expect(html).toContain('1813164100');
      expect(html).toContain('Natlan explorer');
      expect(html).toContain('Character Showcase');

      // Character Card markup assertions
      expect(html).toContain('The Widsith');
      expect(html.replace(/<!-- -->/g, '')).toContain('R5');
      expect(html).toContain('Obsidian Codex');

      // SSR must NOT be in loading skeleton state
      expect(html).not.toContain('No characters in showcase');
      expect(html).toContain('1,945'); // ATK
      expect(html).toContain('65.4%'); // CR
      expect(html).toContain('188.4%'); // CD
    });

    it('mutation safety: multiple getVaresaMockData calls return independent object trees', () => {
      const data1 = getVaresaMockData();
      const data2 = getVaresaMockData();

      expect(data1).not.toBe(data2);
      expect(data1.characters[0]).not.toBe(data2.characters[0]);
      expect(data1.characters[0].artifacts[0]).not.toBe(data2.characters[0].artifacts[0]);

      // Mutate data1
      data1.player.nickname = 'MutatedName';
      data1.characters[0].artifacts[0].cv = 999;

      // Verify data2 remains unmutated
      expect(data2.player.nickname).toBe('Addy');
      expect(data2.characters[0].artifacts[0].cv).toBe(42.8);
    });
  });
});
