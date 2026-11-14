import fs from 'node:fs';
import path from 'node:path';
import {
  GAME_CHARACTERS,
  getCharacterIconPath,
  getCharacterGachaPath,
} from '@/lib/enka/game-data.generated';
import { WEAPON_LIST, WEAPON_DATA } from '@/lib/enka/weapon-data';
import { KNOWN_CONSTELLATIONS } from '@/lib/enka/constellation-data';
import { CHARACTER_TALENT_BOOSTS } from '@/lib/enka/talent-boost-data';
import { damageConfigs } from '@/lib/damage-calc/configs';
import InspectClient, {
  type InspectCharacterItem,
  type InspectWeaponItem,
} from './InspectClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Data Inspection - Genbuilds',
  description: 'Temporary registry inspecting all characters, assets, metadata, and weapons.',
};

function listFilesSet(relDir: string): Set<string> {
  const full = path.join(process.cwd(), 'public', relDir);
  try {
    return new Set(fs.readdirSync(full));
  } catch {
    return new Set();
  }
}

export default function InspectPage() {
  const charFiles = listFilesSet('icons/characters');
  const talentFiles = listFilesSet('icons/talents');
  const constFiles = listFilesSet('icons/constellations');

  // Collect all valid numeric character IDs across GAME_CHARACTERS, boosts, constellations, damageConfigs, and disk icons
  const idSet = new Set<number>();
  for (const keys of [
    Object.keys(GAME_CHARACTERS),
    Object.keys(CHARACTER_TALENT_BOOSTS),
    Object.keys(KNOWN_CONSTELLATIONS),
    Object.keys(damageConfigs),
  ]) {
    for (const key of keys) {
      const n = Number(key);
      if (Number.isFinite(n) && n > 0) idSet.add(n);
    }
  }
  for (const file of Array.from(charFiles)) {
    const m = /^(\d+)\.png$/i.exec(file);
    if (m) {
      const n = Number(m[1]);
      if (Number.isFinite(n) && n > 0) idSet.add(n);
    }
  }

  const characters: InspectCharacterItem[] = Array.from(idSet)
    .sort((a, b) => a - b)
    .map((id) => {
      const meta = GAME_CHARACTERS[id];
      const name = meta?.name || damageConfigs[id]?.characterName || `Unregistered (${id})`;
      const norm = name.toLowerCase().replace(/[^a-z0-9]/g, '');

      const hasIcon = charFiles.has(`${id}.png`) || (norm ? charFiles.has(`${norm}.png`) : false);
      const hasGacha = charFiles.has(`${id}_gacha.png`);
      const hasSkillIcon = talentFiles.has(`${id}_skill.png`);
      const hasBurstIcon = talentFiles.has(`${id}_burst.png`);

      let constIconCount = 0;
      for (let i = 0; i < 6; i++) {
        if (
          charFiles.has(`${id}_const_${i}.png`) ||
          (norm && constFiles.has(`${norm}_${i + 1}.png`))
        ) {
          constIconCount++;
        }
      }

      const loreEntry = KNOWN_CONSTELLATIONS[String(id)];
      const hasConstLore = Boolean(loreEntry && loreEntry.length >= 6);
      const boostCfg = CHARACTER_TALENT_BOOSTS[id];
      const hasDamageConfig = Boolean(damageConfigs[id]);

      const issues: string[] = [];
      if (!meta) issues.push('Not in GAME_CHARACTERS');
      if (!hasIcon) issues.push('Missing icon');
      if (!hasGacha) issues.push('Missing gacha splash');
      if (!hasSkillIcon) issues.push('Missing skill icon');
      if (!hasBurstIcon) issues.push('Missing burst icon');
      if (constIconCount < 6) issues.push(`Const icons ${constIconCount}/6`);
      if (!hasConstLore) issues.push('No explicit const lore');
      if (!boostCfg) issues.push('Default C3/C5 boost');

      return {
        id,
        name,
        registeredInGameData: Boolean(meta),
        element: meta?.element || 'Unknown',
        rarity: meta?.rarity || 0,
        weaponType: meta?.weaponType || 'Unknown',
        nameTextMapHash: meta?.nameTextMapHash ?? null,
        sideIconName: meta?.sideIconName ?? null,
        iconPath: hasIcon ? getCharacterIconPath(id) : null,
        gachaPath: hasGacha ? getCharacterGachaPath(id) : null,
        skillOrder: meta?.skillOrder || [],
        consts: meta?.consts || [],
        assets: {
          icon: hasIcon,
          gacha: hasGacha,
          skill: hasSkillIcon,
          burst: hasBurstIcon,
          constIcons: constIconCount,
        },
        metadata: {
          constLoreCount: loreEntry?.length || 0,
          c3Boost: boostCfg?.c3 || null,
          c5Boost: boostCfg?.c5 || null,
          hasDamageConfig,
        },
        issues,
      };
    });

  // Collect alias IDs mapped in WEAPON_DATA that point to a canonical weapon ID
  const aliasesByTargetId = new Map<number, number[]>();
  for (const [keyId, target] of Object.entries(WEAPON_DATA)) {
    const numericId = Number(keyId);
    if (numericId !== target.id) {
      const list = aliasesByTargetId.get(target.id) || [];
      list.push(numericId);
      aliasesByTargetId.set(target.id, list);
    }
  }

  const weapons: InspectWeaponItem[] = [...WEAPON_LIST]
    .sort((a, b) => a.id - b.id)
    .map((w) => {
      const aliasIds = (aliasesByTargetId.get(w.id) || []).sort((a, b) => a - b);
      const refinements: Array<{ rank: number; text: string }> = [];
      const issues: string[] = [];

      if (w.baseAtkLv90 === undefined) issues.push('Missing baseAtkLv90');
      if (!w.subStat?.label && !w.subStat?.displayLabel) issues.push('Missing substat');
      if (!w.passiveName) issues.push('Missing passiveName');

      for (let r = 1; r <= 5; r++) {
        const text = String(w.refinements?.[r] || w.refinements?.[`r${r}`] || '');
        refinements.push({ rank: r, text });
        if (!text) issues.push(`Missing R${r}`);
        else if (text.includes('{') || text.includes('}')) issues.push(`R${r} unresolved placeholder`);
      }

      return {
        id: w.id,
        aliasIds,
        name: w.name,
        type: w.type,
        rarity: w.rarity,
        baseAtkLv90: w.baseAtkLv90 ?? null,
        subStatLabel: w.subStat?.displayLabel || w.subStat?.label || null,
        subStatValueLv90: w.subStat?.valueLv90 ?? null,
        passiveName: w.passiveName || '',
        refinements,
        issues,
      };
    });

  return <InspectClient characters={characters} weapons={weapons} />;
}
