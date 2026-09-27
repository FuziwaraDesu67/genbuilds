/**
 * Downloads all game data from Enka.Network's GitHub repository
 * and generates a comprehensive TypeScript data module + downloads all icons.
 *
 * Run: npm run data:update
 *
 * Sources:
 *   - characters.json: Character metadata (element, weapon, skills, icons, etc.)
 *   - loc.json:        Text hash → localized string (EN only extracted)
 *   - Icons:           https://enka.network/ui/{icon}.png
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

const GITHUB_RAW = 'https://raw.githubusercontent.com/EnkaNetwork/API-docs/master/store';
const ENKA_UI_BASE = 'https://enka.network/ui';

const OUT_DIR = path.resolve(__dirname, '../src/lib/enka');
const ICONS_DIR = path.resolve(__dirname, '../public/icons');
const CHARS_ICON_DIR = path.join(ICONS_DIR, 'characters');
const WEAPONS_ICON_DIR = path.join(ICONS_DIR, 'weapons');
const ARTIFACTS_ICON_DIR = path.join(ICONS_DIR, 'artifacts');

// ─── Helpers ──────────────────────────────────────────────────────

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  console.log(`  📥 Fetching ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json() as Promise<T>;
}

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) {
      resolve();
      return;
    }
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlinkSync(dest);
        downloadFile(res.headers.location!, dest).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      reject(err);
    });
  });
}

async function downloadBatch(items: { url: string; dest: string }[], label: string) {
  console.log(`  🎨 Downloading ${items.length} ${label} icons...`);
  let done = 0;
  const CONCURRENCY = 10;
  const queue = [...items];

  async function worker() {
    while (queue.length > 0) {
      const item = queue.shift()!;
      try {
        await downloadFile(item.url, item.dest);
      } catch {
        // Silently skip missing icons
      }
      done++;
      if (done % 20 === 0 || done === items.length) {
        process.stdout.write(`\r     ${done}/${items.length}`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  console.log(''); // newline
}

// ─── Types for Enka's raw data ───────────────────────────────────

interface EnkaCharacter {
  Element: string;
  Consts: string[];
  SkillOrder: number[];
  Skills: Record<string, string>;
  ProudMap: Record<string, number>;
  NameTextMapHash: number;
  SideIconName: string;
  QualityType: string;
  WeaponType: string;
  Costumes?: Record<string, {
    sideIconName: string;
    icon: string;
    art: string;
    avatarId: number;
  }>;
}

// ─── Element mapping ─────────────────────────────────────────────

const ELEMENT_MAP: Record<string, string> = {
  Fire: 'Pyro',
  Water: 'Hydro',
  Wind: 'Anemo',
  Electric: 'Electro',
  Ice: 'Cryo',
  Rock: 'Geo',
  Grass: 'Dendro',
};

const WEAPON_TYPE_MAP: Record<string, string> = {
  WEAPON_SWORD_ONE_HAND: 'Sword',
  WEAPON_CLAYMORE: 'Claymore',
  WEAPON_POLE: 'Polearm',
  WEAPON_CATALYST: 'Catalyst',
  WEAPON_BOW: 'Bow',
};

const QUALITY_MAP: Record<string, number> = {
  QUALITY_PURPLE: 4,
  QUALITY_ORANGE: 5,
  QUALITY_ORANGE_SP: 5, // Special 5-star (Aloy etc.)
};

// ─── Main ────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Updating game data from Enka.Network...\n');

  // 1. Fetch raw data
  console.log('Step 1: Fetching data files...');
  const [characters, loc] = await Promise.all([
    fetchJson<Record<string, EnkaCharacter>>(`${GITHUB_RAW}/characters.json`),
    fetchJson<Record<string, Record<string, string>>>(`${GITHUB_RAW}/loc.json`),
  ]);

  const en = loc.en;
  if (!en) throw new Error('English localization not found in loc.json');

  console.log(`  ✅ ${Object.keys(characters).length} characters loaded`);
  console.log(`  ✅ ${Object.keys(en).length} localization strings loaded\n`);

  // 2. Process characters
  console.log('Step 2: Processing character data...');
  const processedChars: Record<string, {
    name: string;
    element: string;
    rarity: number;
    weaponType: string;
    nameTextMapHash: number;
    sideIconName: string;
    skillOrder: number[];
    consts: string[];
  }> = {};

  // Collect icon download tasks
  const iconTasks: { url: string; dest: string }[] = [];

  // Prepare icon directories
  ensureDir(CHARS_ICON_DIR);
  ensureDir(WEAPONS_ICON_DIR);
  ensureDir(ARTIFACTS_ICON_DIR);

  for (const [id, char] of Object.entries(characters)) {
    // Skip malformed entries
    if (!char || !char.SideIconName || !char.SkillOrder || !char.WeaponType) {
      console.warn(`  ⚠️  Skipping ${id}: missing required fields`);
      continue;
    }

    const nameHash = char.NameTextMapHash?.toString() || '';
    const name = (nameHash && en[nameHash]) || `Character ${id}`;
    const element = ELEMENT_MAP[char.Element] || char.Element || 'Unknown';
    const rarity = QUALITY_MAP[char.QualityType] || 4;
    const weaponType = WEAPON_TYPE_MAP[char.WeaponType] || char.WeaponType;

    processedChars[id] = {
      name,
      element,
      rarity,
      weaponType,
      nameTextMapHash: char.NameTextMapHash || 0,
      sideIconName: char.SideIconName,
      skillOrder: char.SkillOrder,
      consts: char.Consts || [],
    };

    // Character icon: side icon → derive main icon
    // SideIconName = "UI_AvatarIcon_Side_Ayaka" → main = "UI_AvatarIcon_Ayaka"
    const mainIcon = char.SideIconName.replace('_Side', '');
    iconTasks.push({
      url: `${ENKA_UI_BASE}/${mainIcon}.png`,
      dest: path.join(CHARS_ICON_DIR, `${id}.png`),
    });

    // Also download gacha splash
    // "UI_AvatarIcon_Ayaka" → "UI_Gacha_AvatarImg_Ayaka"
    const gachaIcon = mainIcon.replace('UI_AvatarIcon_', 'UI_Gacha_AvatarImg_');
    iconTasks.push({
      url: `${ENKA_UI_BASE}/${gachaIcon}.png`,
      dest: path.join(CHARS_ICON_DIR, `${id}_gacha.png`),
    });

    // Download costume icons
    if (char.Costumes) {
      for (const [costumeId, costume] of Object.entries(char.Costumes)) {
        iconTasks.push({
          url: `${ENKA_UI_BASE}/${costume.icon}.png`,
          dest: path.join(CHARS_ICON_DIR, `${id}_costume_${costumeId}.png`),
        });
      }
    }

    // Download constellation icons
    if (char.Consts) {
      for (let i = 0; i < char.Consts.length; i++) {
        iconTasks.push({
          url: `${ENKA_UI_BASE}/${char.Consts[i]}.png`,
          dest: path.join(CHARS_ICON_DIR, `${id}_const_${i}.png`),
        });
      }
    }
  }

  console.log(`  ✅ ${Object.keys(processedChars).length} characters processed\n`);

  // 3. Extract weapon and artifact names from loc.json
  // The loc.json contains ALL text hashes — weapons, artifacts, everything
  // We'll store the full EN loc as a map for runtime hash resolution
  console.log('Step 3: Building localization index...');

  // We only keep entries that are actual names (non-FIGHT_PROP, non-empty)
  const textMap: Record<string, string> = {};
  let nameCount = 0;
  for (const [hash, text] of Object.entries(en)) {
    if (text && !hash.startsWith('FIGHT_PROP_') && text !== 'TBD') {
      textMap[hash] = text;
      nameCount++;
    }
  }

  // Also keep fight prop translations separately for stat display
  const fightPropNames: Record<string, string> = {};
  for (const [key, text] of Object.entries(en)) {
    if (key.startsWith('FIGHT_PROP_') && text) {
      fightPropNames[key] = text;
    }
  }

  console.log(`  ✅ ${nameCount} name strings indexed`);
  console.log(`  ✅ ${Object.keys(fightPropNames).length} fight prop names indexed\n`);

  // 4. Download icons
  console.log('Step 4: Downloading icons...');
  await downloadBatch(iconTasks, 'character');

  // Download commonly used artifact set icons (by set ID pattern)
  // Artifact icons follow: UI_RelicIcon_{setId}_{slotNum}
  // We'll download for all known set IDs from loc
  const artifactSetIds = new Set<number>();
  // Artifact set IDs from the game typically range from 10001 to 15xxx
  // We'll download icons for common sets
  const knownSets = [
    10001, 10002, 10003, 10004, 10005, 10006, 10007, 10008, 10009, 10010,
    10011, 10012, 10013, 10014, 10015, 10016,
    14001, 14002, 14003, 14004,
    15001, 15002, 15003, 15004, 15005, 15006, 15007, 15008, 15009, 15010,
    15011, 15012, 15013, 15014, 15015, 15016, 15017, 15018, 15019, 15020,
    15021, 15022, 15023, 15024, 15025, 15026, 15027, 15028, 15029, 15030,
    15031, 15032, 15033, 15034, 15035,
  ];

  const artifactIconTasks: { url: string; dest: string }[] = [];
  for (const setId of knownSets) {
    for (let slot = 1; slot <= 5; slot++) {
      artifactIconTasks.push({
        url: `${ENKA_UI_BASE}/UI_RelicIcon_${setId}_${slot}.png`,
        dest: path.join(ARTIFACTS_ICON_DIR, `${setId}_${slot}.png`),
      });
    }
  }
  await downloadBatch(artifactIconTasks, 'artifact');

  // Download common weapon icons
  // Weapon icons: UI_EquipIcon_{type}_{name}
  // We'll grab them from the loc hashes — weapon names are in the loc but we
  // can't easily derive icon names from hashes. Instead, we'll rely on the
  // Enka API response providing flat.icon for each equipped weapon, and we
  // download those on-demand or use the CDN URL.
  // For now, we skip batch weapon icon downloads — icons come from the API response.

  console.log('');

  // 5. Generate TypeScript module
  console.log('Step 5: Generating TypeScript data module...');

  const output = `// AUTO-GENERATED — DO NOT EDIT
// Generated by scripts/update-game-data.ts
// Source: Enka.Network API-docs (https://github.com/EnkaNetwork/API-docs)
// Last updated: ${new Date().toISOString()}

import type { Element } from './types';

// ─── Character Data ──────────────────────────────────────────────

export interface GameCharacter {
  name: string;
  element: Element;
  rarity: number;
  weaponType: string;
  nameTextMapHash: number;
  /** Enka icon asset name (side icon) */
  sideIconName: string;
  /** Skill IDs in order: [normal, skill, burst] */
  skillOrder: number[];
  /** Constellation icon asset names */
  consts: string[];
}

export const GAME_CHARACTERS: Record<number, GameCharacter> = ${JSON.stringify(
    Object.fromEntries(
      Object.entries(processedChars).map(([id, c]) => [
        Number(id),
        {
          name: c.name,
          element: c.element,
          rarity: c.rarity,
          weaponType: c.weaponType,
          nameTextMapHash: c.nameTextMapHash,
          sideIconName: c.sideIconName,
          skillOrder: c.skillOrder,
          consts: c.consts,
        },
      ])
    ),
    null,
    2
  )};

// ─── Text Hash Localization (EN) ─────────────────────────────────
// Maps numeric text hashes to English strings.
// Used to resolve weapon names, artifact names, etc. from Enka API responses.

export const TEXT_MAP: Record<string, string> = ${JSON.stringify(textMap, null, 2)};

// ─── Fight Prop Display Names ────────────────────────────────────

export const FIGHT_PROP_NAMES: Record<string, string> = ${JSON.stringify(fightPropNames, null, 2)};

// ─── Element Mapping (Enka internal → display) ──────────────────

export const ENKA_ELEMENT_MAP: Record<string, Element> = {
  Fire: 'Pyro',
  Water: 'Hydro',
  Wind: 'Anemo',
  Electric: 'Electro',
  Ice: 'Cryo',
  Rock: 'Geo',
  Grass: 'Dendro',
};

// ─── Helper Functions ────────────────────────────────────────────

/** Resolve a text hash to its English string */
export function resolveTextHash(hash: string | number): string {
  return TEXT_MAP[hash.toString()] || \`Unknown (\${hash})\`;
}

/** Get character data by ID */
export function getGameCharacter(id: number): GameCharacter | null {
  return GAME_CHARACTERS[id] || null;
}

/** Get local icon path for a character */
export function getCharacterIconPath(id: number): string {
  return \`/icons/characters/\${id}.png\`;
}

/** Get gacha splash path for a character */
export function getCharacterGachaPath(id: number): string {
  return \`/icons/characters/\${id}_gacha.png\`;
}

/** Get constellation icon path */
export function getConstellationIconPath(id: number, index: number): string {
  return \`/icons/characters/\${id}_const_\${index}.png\`;
}

/** Get artifact icon path (local) */
export function getArtifactIconPath(setId: number, slotNum: number): string {
  return \`/icons/artifacts/\${setId}_\${slotNum}.png\`;
}

/** Get Enka CDN URL for any icon asset name */
export function getEnkaCdnUrl(iconName: string): string {
  return \`https://enka.network/ui/\${iconName}.png\`;
}

/** Get all character IDs */
export function getAllCharacterIds(): number[] {
  return Object.keys(GAME_CHARACTERS).map(Number);
}

/** Search characters by name (case-insensitive partial match) */
export function searchCharacters(query: string): Array<{ id: number } & GameCharacter> {
  const q = query.toLowerCase();
  return Object.entries(GAME_CHARACTERS)
    .filter(([, c]) => c.name.toLowerCase().includes(q))
    .map(([id, c]) => ({ id: Number(id), ...c }));
}
`;

  const outFile = path.join(OUT_DIR, 'game-data.generated.ts');
  fs.writeFileSync(outFile, output, 'utf-8');
  console.log(`  ✅ Written to ${path.relative(process.cwd(), outFile)}`);

  // 6. Summary
  const charIconCount = fs.readdirSync(CHARS_ICON_DIR).length;
  const artifactIconCount = fs.readdirSync(ARTIFACTS_ICON_DIR).length;

  console.log('\n🎉 Game data update complete!');
  console.log(`   Characters:      ${Object.keys(processedChars).length}`);
  console.log(`   Text strings:    ${nameCount}`);
  console.log(`   Fight props:     ${Object.keys(fightPropNames).length}`);
  console.log(`   Character icons: ${charIconCount}`);
  console.log(`   Artifact icons:  ${artifactIconCount}`);
  console.log(`\n   Output: ${path.relative(process.cwd(), outFile)}`);
  console.log(`   Icons:  ${path.relative(process.cwd(), ICONS_DIR)}/`);
}

main().catch((err) => {
  console.error('❌ Failed:', err);
  process.exit(1);
});
