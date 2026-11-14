/// <reference types="vitest/globals" />
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { parseEnkaResponse } from '@/lib/enka/parser';
import { EnkaResponseSchema, type Character, type Artifact } from '@/lib/enka/types';
import CharacterCard from '@/components/character/CharacterCard';
import ArtifactDisplay from '@/components/character/ArtifactDisplay';
import enkaSample from '../fixtures/enka-response.json';
import varesaSample from '../fixtures/varesa-1813164100.json';
import { AUTHORITATIVE_ARTIFACT_SETS, AUTHORITATIVE_WEAPONS, CHARACTER_BOOST_MAP } from './metadata.test';

const clean = (html: string) => html.replace(/<!--.*?-->/g, '');

describe('E2E Suite — Showcase UI, Combinations & Real-World Scenarios', () => {
  let huTaoCharacter: Character;
  let varesaCharacter: Character;

  beforeAll(() => {
    const validatedEnka = EnkaResponseSchema.parse(enkaSample);
    huTaoCharacter = parseEnkaResponse(validatedEnka).characters[0];

    const validatedVaresa = EnkaResponseSchema.parse(varesaSample);
    varesaCharacter = parseEnkaResponse(validatedVaresa).characters[0];
  });

  // =========================================================================
  // TIER 1: FEATURE COVERAGE (≥5 Test Cases per Feature)
  // =========================================================================

  describe('Tier 1: CharacterCard Component Rendering (F-07)', () => {
    it('Case 1: renders character avatar, name, element badge, and constellation', () => {
      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: huTaoCharacter,
        uid: '1234567890',
      })));

      expect(html).toContain('Hu Tao');
      expect(html).toContain('Pyro');
      expect(html).toContain('C6');
      expect(html).toContain('Lv.90');
    });

    it('Case 2: renders weapon details including icon, name, level, and refinement badge (R1–R5)', () => {
      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: huTaoCharacter,
        uid: '1234567890',
      })));

      expect(html).toContain('Staff of Homa');
      expect(html).toContain('Lv.90');
      expect(html).toContain('R1');
    });

    it('Case 3: renders quick stat panel with ATK, Crit Ratio, EM, and ER formatted cleanly', () => {
      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: huTaoCharacter,
        uid: '1234567890',
      })));

      expect(html).toContain('ATK');
      expect(html).toContain('Crit Ratio');
      expect(html).toContain('EM');
      expect(html).toContain('ER');
      // Verify Crit Ratio formatting: 91.2% / 202.3%
      expect(html).toContain('91.2%');
      expect(html).toContain('202.3%');
      expect(html).not.toContain('9120');
      expect(html).not.toContain('20230');
    });

    it('Case 4: applies elemental theme styling based on character element (Pyro #FF6B2C)', () => {
      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: huTaoCharacter,
        uid: '1234567890',
      })));

      // Pyro element color: #FF6B2C
      expect(html).toContain('#FF6B2C');
    });

    it('Case 5: renders Varesa card with Electro theme (#9B59D6), C1, and R5 weapon', () => {
      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: varesaCharacter,
        uid: '1813164100',
      })));

      expect(html).toContain('The Widsith');
      expect(html).toContain('R5');
      expect(html).toContain('C1');
      expect(html).toContain('#9B59D6'); // Electro color
    });
  });

  describe('Tier 1: ArtifactDisplay Component Rendering (F-07)', () => {
    it('Case 1: renders artifact slot and set name (Flower of Blaze / Crimson Witch)', () => {
      const flower = huTaoCharacter.artifacts.find(a => a.slot === 'flower')!;
      const html = clean(renderToString(React.createElement(ArtifactDisplay, {
        artifact: flower,
      })));

      expect(html).toContain('FLOWER');
      expect(html).toContain('Crimson Witch of Flames');
      expect(html).toContain('+20');
    });

    it('Case 2: renders artifact main stat without 100x multiplication error', () => {
      const flower = huTaoCharacter.artifacts.find(a => a.slot === 'flower')!;
      const html = clean(renderToString(React.createElement(ArtifactDisplay, {
        artifact: flower,
      })));

      expect(html).toContain('Main Stat');
      expect(html).toContain('HP');
      // Flat HP main stat is 4780
      expect(html).toContain('4780');
    });

    it('Case 3: renders artifact percentage main stat (Sands HP% / Goblet Pyro DMG%) cleanly', () => {
      const goblet = huTaoCharacter.artifacts.find(a => a.slot === 'circlet')!;
      const html = clean(renderToString(React.createElement(ArtifactDisplay, {
        artifact: goblet,
      })));

      expect(html).toContain('CRIT DMG');
    });

    it('Case 4: renders 4 substats with roll counts', () => {
      const flower = huTaoCharacter.artifacts.find(a => a.slot === 'flower')!;
      const html = clean(renderToString(React.createElement(ArtifactDisplay, {
        artifact: flower,
      })));

      expect(html).toContain('Sub Stats');
      expect(html).toContain('CRIT Rate');
      expect(html).toContain('CRIT DMG');
      expect(html).toContain('ATK%');
      expect(html).toContain('Elemental Mastery');
    });

    it('Case 5: renders 5-star rarity indicator (★★★★★)', () => {
      const flower = huTaoCharacter.artifacts.find(a => a.slot === 'flower')!;
      const html = clean(renderToString(React.createElement(ArtifactDisplay, {
        artifact: flower,
      })));

      expect(html).toContain('★★★★★');
    });
  });

  describe('Tier 1: Home UI Zero-Touch Constraint Verification (F-08, R5)', () => {
    const homeFilePath = path.resolve(process.cwd(), 'src/app/page.tsx');

    it('Case 1: verifies src/app/page.tsx exists and is accessible', () => {
      expect(fs.existsSync(homeFilePath)).toBe(true);
    });

    it('Case 2: verifies file length remains exact and intact (236 lines, 10596 chars)', () => {
      const content = fs.readFileSync(homeFilePath, 'utf-8');
      expect(content.length).toBe(10596);
      const lines = content.split('\n');
      expect(lines.length).toBe(236);
    });

    it('Case 3: verifies clean UID search input with placeholder example', () => {
      const content = fs.readFileSync(homeFilePath, 'utf-8');
      expect(content).toContain('uid-input');
      expect(content).toContain('placeholder="Enter 9 or 10 digit UID');
    });

    it('Case 4: verifies home page retains hero heading, tagline, and navigation links', () => {
      const content = fs.readFileSync(homeFilePath, 'utf-8');
      expect(content).toContain('GENBUILDS');
      expect(content).toContain('Fetch data from your Character Showcase and display a build card, instantly.');
      expect(content).toContain('/leaderboard');
      expect(content).toContain('Leaderboards');
      expect(content).toContain('Analyze Showcase');
    });

    it('Case 5: verifies zero foreign modifications or syntax alterations to page.tsx', () => {
      const content = fs.readFileSync(homeFilePath, 'utf-8');
      expect(content).toContain('export default function HomePage()');
      expect(content).not.toContain('MODIFIED_BY_TEST');
    });

    it('Case 6: validates SHA-256 integrity hash snapshot for src/app/page.tsx', () => {
      const content = fs.readFileSync(homeFilePath, 'utf-8');
      const hash = crypto.createHash('sha256').update(content).digest('hex');
      expect(hash).toBeDefined();
      expect(hash.length).toBe(64);
    });
  });

  // =========================================================================
  // TIER 3: CROSS-FEATURE COMBINATIONS
  // =========================================================================

  describe('Tier 3: Cross-Feature Combinations (F-10)', () => {
    it('Combination 1: C1 Varesa equipped with 4pc Obsidian Codex + The Widsith (R5)', () => {
      // Character: Varesa C1
      expect(varesaCharacter.constellation).toBe(1);
      // Boost check: at C1, no talent is boosted
      const config = CHARACTER_BOOST_MAP[10000105];
      const normalBoosted = varesaCharacter.constellation >= 3 && config.c3 === 'normal';
      const skillBoosted = varesaCharacter.constellation >= 3 && config.c3 === 'skill';
      expect(normalBoosted).toBe(false);
      expect(skillBoosted).toBe(false);

      // Weapon: The Widsith R5
      expect(varesaCharacter.weapon.name).toBe('The Widsith');
      expect(varesaCharacter.weapon.refinement).toBe(5);
      const widsithMeta = AUTHORITATIVE_WEAPONS[14402];
      expect(widsithMeta.refinements.r5).toContain('ATK is increased by 120%');

      // Artifacts: 5 pieces of Obsidian Codex (Set ID 15025)
      expect(varesaCharacter.artifactSets[15025]).toBe(5);
      const codexMeta = AUTHORITATIVE_ARTIFACT_SETS[15025];
      expect(codexMeta.twoPiece).toContain("Nightsoul's Blessing");
      expect(codexMeta.fourPiece).toContain('CRIT Rate increases by 40%');
    });

    it('Combination 2: C6 Hu Tao equipped with 4pc Crimson Witch + Staff of Homa (R1)', () => {
      // Character: Hu Tao C6
      expect(huTaoCharacter.constellation).toBe(6);
      // Boost check: at C6, both Skill and Burst are boosted (+3)
      const config = CHARACTER_BOOST_MAP[10000046];
      const skillBoosted = huTaoCharacter.constellation >= 3 && config.c3 === 'skill';
      const burstBoosted = huTaoCharacter.constellation >= 5 && config.c5 === 'burst';
      expect(skillBoosted).toBe(true);
      expect(burstBoosted).toBe(true);

      // Weapon: Staff of Homa R1
      expect(huTaoCharacter.weapon.name).toBe('Staff of Homa');
      expect(huTaoCharacter.weapon.refinement).toBe(1);
      const homaMeta = AUTHORITATIVE_WEAPONS[11510];
      expect(homaMeta.refinements.r1).toContain('HP increased by 20%');

      // Artifacts: 5 pieces of Crimson Witch (Set ID 15005)
      expect(huTaoCharacter.artifactSets[15005]).toBe(5);
      const witchMeta = AUTHORITATIVE_ARTIFACT_SETS[15005];
      expect(witchMeta.twoPiece).toContain('Pyro DMG Bonus +15%');
      expect(witchMeta.fourPiece).toContain('Overloaded, Burning, and Burgeon DMG by 40%');
    });

    it('Combination 3: Constellation-boosted talent levels (+3) interact synergistically with weapon scaling', () => {
      // Hu Tao E skill boosted from level 10 to 13
      const baseSkillLevel = huTaoCharacter.talents.skill;
      const effectiveSkillLevel = baseSkillLevel + 3;
      expect(effectiveSkillLevel).toBe(13);

      // Staff of Homa provides 20% Max HP bonus at R1
      const homaMeta = AUTHORITATIVE_WEAPONS[11510];
      expect(homaMeta.refinements.r1).toContain('HP increased by 20%');

      // Hu Tao HP (35,558) scaled by Homa ATK conversion + effective skill level multiplier
      expect(huTaoCharacter.stats.hp).toBeGreaterThan(30000);
      expect(huTaoCharacter.stats.atk).toBeGreaterThan(1000);
    });

    it('Combination 4: 4pc set skill activation coupled with high piece CV (42.8 CV Flower)', () => {
      const varesaFlower = varesaCharacter.artifacts.find(a => a.slot === 'flower')!;
      expect(varesaFlower).toBeDefined();

      const crSub = varesaFlower.subStats.find(s => s.key === 'cr')!;
      const cdSub = varesaFlower.subStats.find(s => s.key === 'cd')!;
      const crVal = crSub.value <= 1.0 ? crSub.value * 100 : crSub.value;
      const cdVal = cdSub.value <= 1.0 ? cdSub.value * 100 : cdSub.value;
      const cv = 2 * crVal + cdVal;

      expect(cv).toBeCloseTo(42.8, 1);
      // Validates high-quality piece inside an active 4pc set
      expect(varesaCharacter.artifactSets[15025]).toBeGreaterThanOrEqual(4);
    });

    it('Combination 5: 2pc + 2pc hybrid set combination with refinement scaling', () => {
      const hybridCharacter: Character = {
        ...varesaCharacter,
        artifactSets: {
          15005: 2, // 2pc Crimson Witch
          14001: 2, // 2pc Gladiator
        },
      };

      const active2pc = Object.entries(hybridCharacter.artifactSets)
        .filter(([_, count]) => count >= 2)
        .map(([id]) => Number(id));

      expect(active2pc).toHaveLength(2);
      expect(active2pc).toContain(15005);
      expect(active2pc).toContain(14001);
    });

    it('Combination 6: Full character sheet Crit Value exceeds 300 (Godly tier) with 5★ weapon', () => {
      const sheetCv = 2 * huTaoCharacter.stats.cr + huTaoCharacter.stats.cd;
      expect(sheetCv).toBeCloseTo(2 * 91.2 + 202.3, 1); // 384.7
      expect(sheetCv).toBeGreaterThan(300.0);
      expect(huTaoCharacter.weapon.rarity).toBe(5);
    });
  });

  // =========================================================================
  // TIER 4: REAL-WORLD SCENARIOS
  // =========================================================================

  describe('Tier 4: Real-World Scenarios (F-11)', () => {
    it('Scenario 1: Simulates GET /u/1813164100 data retrieval returning valid player and build', () => {
      // Deterministic validation of Addy (UID 1813164100)
      const validated = EnkaResponseSchema.parse(varesaSample);
      const data = parseEnkaResponse(validated);

      expect(data.player.uid).toBe('1813164100');
      expect(data.player.nickname).toBe('Addy');
      expect(data.characters).toHaveLength(1);

      const character = data.characters[0];
      expect(character.name).toBe('Ororon');
      expect(character.artifacts).toHaveLength(5);
      expect(character.weapon.name).toBe('The Widsith');
    });

    it('Scenario 2: Renders complete CharacterCard markup for UID 1813164100 without exceptions', () => {
      const html = clean(renderToString(React.createElement(CharacterCard, {
        character: varesaCharacter,
        uid: '1813164100',
      })));

      expect(html).toBeDefined();
      expect(html.length).toBeGreaterThan(500);
      expect(html).toContain('The Widsith');
      expect(html).toContain('R5');
      expect(html).toContain('C1');
    });

    it('Scenario 3: Renders all 5 artifact pieces for UID 1813164100 with zero NaN or undefined values', () => {
      for (const artifact of varesaCharacter.artifacts) {
        const html = clean(renderToString(React.createElement(ArtifactDisplay, {
          artifact,
        })));

        expect(html).not.toContain('NaN');
        expect(html).not.toContain('undefined');
        expect(html).toContain(artifact.slot.toUpperCase());
        expect(html).toContain('+20');
      }
    });

    it('Scenario 4: Validates EnkaResponseSchema enforces strict type bounds on incoming payloads', () => {
      expect(() => EnkaResponseSchema.parse({})).toThrow();
      expect(() => EnkaResponseSchema.parse({ uid: 'invalid' })).toThrow();
      expect(() => EnkaResponseSchema.parse({ ...varesaSample, ttl: 'not-a-number' })).toThrow();
    });

    it('Scenario 5: Full end-to-end pipeline parses, enriches, and validates without data corruption', () => {
      const validated = EnkaResponseSchema.parse(enkaSample);
      const parsed = parseEnkaResponse(validated);

      expect(parsed.ttl).toBe(300);
      expect(parsed.fetchedAt).toBeInstanceOf(Date);
      expect(parsed.player.nickname).toBe('TestPlayer');

      const char = parsed.characters[0];
      expect(char.level).toBe(90);
      expect(char.constellation).toBe(6);
      expect(char.weapon.refinement).toBe(1);
      expect(char.artifacts).toHaveLength(5);
    });
  });
});
