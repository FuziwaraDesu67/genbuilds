import fs from 'fs';
import path from 'path';
import { GAME_CHARACTERS } from '../src/lib/enka/game-data.generated';

// Ensure directories exist
const charsDir = 'public/icons/characters';
const talentsDir = 'public/icons/talents';
const constsDir = 'public/icons/constellations';

[charsDir, talentsDir, constsDir].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// 1. Copy Character Icons & Splash Art
const explicitIcons: Record<string, string> = {
  '10000125': 'design-source/Character Icons/Columbina · Icon · Genshin Impact.png',
  '10000150': 'design-source/Character Icons/Odette · Icon · Genshin Impact.png',
  '10000133': 'design-source/Character Icons/Sandrone · Icon · Genshin Impact.png',
  '10000136': 'design-source/Character Icons/Mitya · Icon · Genshin Impact.png',
  '10000137': 'design-source/Character Icons/Valeriy · Icon · Genshin Impact.png',
};

const explicitSplashes: Record<string, string> = {
  '10000125': 'design-source/Splash Art/Columbina · Wish splash art · Genshin Impact.png',
  '10000150': 'design-source/Splash Art/Odette · Wish splash art · Genshin Impact.png',
  '10000136': 'design-source/Splash Art/Mitya · Wish splash art · Genshin Impact.png',
  '10000137': 'design-source/Splash Art/Valeriy · Wish splash art · Genshin Impact.png',
};

for (const [id, src] of Object.entries(explicitIcons)) {
  if (fs.existsSync(src)) {
    const dest = path.join(charsDir, `${id}.png`);
    fs.copyFileSync(src, dest);
    console.log(`Copied icon ${src} -> ${dest}`);
  }
}

for (const [id, src] of Object.entries(explicitSplashes)) {
  if (fs.existsSync(src)) {
    const dest = path.join(charsDir, `${id}_gacha.png`);
    fs.copyFileSync(src, dest);
    console.log(`Copied splash ${src} -> ${dest}`);
  }
}

// 2. Index all talents and skills by character name
const folders = ['design-source/talents', 'design-source/skills'];
const charFiles: Record<string, Record<string, string>> = {};

for (const folder of folders) {
  if (!fs.existsSync(folder)) continue;
  for (const f of fs.readdirSync(folder)) {
    const parts = f.split(' · ');
    if (parts.length >= 2) {
      const char = parts[0].trim();
      const action = parts[1].trim();
      if (!charFiles[char]) charFiles[char] = {};
      // Prioritize full size elemental burst over (small icon)
      if (action.includes('(small icon)') && charFiles[char]['Elemental burst']) {
        continue;
      }
      charFiles[char][action] = path.join(folder, f);
    }
  }
}

console.log(`Indexed ${Object.keys(charFiles).length} characters from design-source.`);

// Character alias mapping for special cases
const NAME_ALIASES: Record<string, string> = {
  'Yae Miko': 'Yae Miko',
  'Raiden Shogun': 'Raiden Shogun',
  'Kaedehara Kazuha': 'Kaedehara Kazuha',
  'Kamisato Ayaka': 'Kamisato Ayaka',
  'Kamisato Ayato': 'Kamisato Ayato',
  'Sangonomiya Kokomi': 'Sangonomiya Kokomi',
  'Kujou Sara': 'Kujou Sara',
  'Kuki Shinobu': 'Kuki Shinobu',
  'Shikanoin Heizou': 'Shikanoin Heizou',
  'Arataki Itto': 'Arataki Itto',
  'Hu Tao': 'Hu Tao',
  'Yun Jin': 'Yun Jin',
  'Lan Yan': 'Lan Yan',
};

let constCopies = 0;
let skillCopies = 0;
let burstCopies = 0;

for (const [idStr, charMeta] of Object.entries(GAME_CHARACTERS)) {
  const id = parseInt(idStr);
  const name = charMeta.name;
  const lookupName = NAME_ALIASES[name] || name;

  // Find character entry in charFiles
  let files = charFiles[lookupName];
  if (!files) {
    // Try relaxed search (case-insensitive)
    const lower = lookupName.toLowerCase();
    for (const [k, v] of Object.entries(charFiles)) {
      if (k.toLowerCase() === lower || k.toLowerCase().replace(/[^a-z]/g, '') === lower.replace(/[^a-z]/g, '')) {
        files = v;
        break;
      }
    }
  }

  if (!files) {
    continue;
  }

  const norm = name.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Constellations 1 to 6
  for (let c = 1; c <= 6; c++) {
    const key = `Constellation ${c}`;
    const srcPath = files[key];
    if (srcPath && fs.existsSync(srcPath)) {
      // Copy to public/icons/characters/${id}_const_${c - 1}.png
      const destId = path.join(charsDir, `${id}_const_${c - 1}.png`);
      fs.copyFileSync(srcPath, destId);

      // Copy to public/icons/constellations/${norm}_${c}.png
      const destName = path.join(constsDir, `${norm}_${c}.png`);
      fs.copyFileSync(srcPath, destName);

      constCopies++;
    }
  }

  // Elemental Skill
  let skillSrc = files['Elemental skill'];
  if (!skillSrc) {
    // Try variant
    const variantKey = Object.keys(files).find(k => k.startsWith('Elemental skill'));
    if (variantKey) skillSrc = files[variantKey];
  }
  if (skillSrc && fs.existsSync(skillSrc)) {
    const destId = path.join(talentsDir, `${id}_skill.png`);
    fs.copyFileSync(skillSrc, destId);

    const destName = path.join(talentsDir, `${norm}_skill.png`);
    fs.copyFileSync(skillSrc, destName);

    skillCopies++;
  }

  // Elemental Burst
  let burstSrc = files['Elemental burst'];
  if (!burstSrc) {
    const variantKey = Object.keys(files).find(k => k.startsWith('Elemental burst'));
    if (variantKey) burstSrc = files[variantKey];
  }
  if (burstSrc && fs.existsSync(burstSrc)) {
    const destId = path.join(talentsDir, `${id}_burst.png`);
    fs.copyFileSync(burstSrc, destId);

    const destName = path.join(talentsDir, `${norm}_burst.png`);
    fs.copyFileSync(burstSrc, destName);

    burstCopies++;
  }
}

console.log(`Assets integrated:
- Constellations: ${constCopies} files
- Elemental Skills: ${skillCopies} characters
- Elemental Bursts: ${burstCopies} characters`);
