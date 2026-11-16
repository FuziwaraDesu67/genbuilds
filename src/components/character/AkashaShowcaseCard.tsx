'use client';

import React, { useRef, useState, useMemo } from 'react';
import type { Character, Element, Artifact, ArtifactSubStat } from '@/lib/enka/types';
import { calculateDamage } from '@/lib/damage-calc';
import { ELEMENT_COLORS, getBuildCVTier, getActiveArtifactSetBonuses, calculateCritValue, getConstellationDetail, getConstellationRoman } from '@/lib/enka/static-data';
import { getGameCharacter } from '@/lib/enka/game-data.generated';
import { getWeaponPassive, resolveWeaponName } from '@/lib/enka/weapon-data';
import { formatNumber, formatTopPercent, getEffectiveAkashaCv, cn } from '@/lib/utils';
import { ElementIcon } from '@/components/ui/element-icons';
import { StatIcon } from '@/components/ui/stat-icons';
import BorderGlow from '@/components/BorderGlow/BorderGlow';
import GlareHover from '@/components/GlareHover/GlareHover';
import CountUp from '@/components/CountUp/CountUp';
import ConstellationTrack from './ConstellationTrack';
import {
  Download,
  ExternalLink,
  Settings,
  ChevronDown,
  ChevronUp,
  Lock,
  Swords,
  Heart,
  Zap,
  Sparkles,
  Crown,
} from 'lucide-react';
import * as htmlToImage from 'html-to-image';

const ELEMENT_BORDER_GLOW: Record<Element, { glowColor: string; colors: string[] }> = {
  Pyro: { glowColor: '14 95 60', colors: ['#ff6b2c', '#fb923c', '#ff4500'] },
  Hydro: { glowColor: '195 100 52', colors: ['#00bfff', '#38bdf8', '#1e90ff'] },
  Electro: { glowColor: '271 65 62', colors: ['#c084fc', '#9b59d6', '#a855f7'] },
  Cryo: { glowColor: '187 72 60', colors: ['#4dd0e1', '#22d3ee', '#67e8f9'] },
  Dendro: { glowColor: '88 55 50', colors: ['#84cc16', '#7cb342', '#bef264'] },
  Anemo: { glowColor: '196 90 64', colors: ['#4fc3f7', '#5eead4', '#38bdf8'] },
  Geo: { glowColor: '36 95 62', colors: ['#ffb74d', '#fbbf24', '#f59e0b'] },
};

interface AkashaShowcaseCardProps {
  character: Character & { damageCalc?: any };
  uid: string;
  playerNickname?: string;
  className?: string;
}

// Substat Roll Value limits for RV% computation
const SUBSTAT_MAX_ROLLS: Record<string, number> = {
  cr: 3.89,
  cd: 7.77,
  atkPercent: 5.83,
  hpPercent: 5.83,
  defPercent: 7.29,
  em: 23.31,
  er: 6.48,
  atk: 19,
  hp: 299,
  def: 23,
};

// Calculate RV% for an individual substat
function getSubstatRv(key: string, value: number): number {
  const max = SUBSTAT_MAX_ROLLS[key];
  if (!max || value <= 0) return 0;
  return Math.round((value / max) * 100);
}

// Calculate total piece RV%
function getPieceTotalRv(subStats: ArtifactSubStat[]): number {
  return subStats.reduce((sum, s) => sum + getSubstatRv(s.key, s.value), 0);
}

// Count Crit upgrades (C x1, C x2, etc.)
function getCritRollsCount(subStats: ArtifactSubStat[]): number {
  let critRolls = 0;
  for (const s of subStats) {
    if (s.key === 'cr' || s.key === 'cd') {
      const rolls = s.rolls || 1;
      if (rolls > 1) {
        critRolls += (rolls - 1);
      }
    }
  }
  return critRolls;
}

function formatStatDisplay(key: string, value: number): string {
  const isPercent = ['cr', 'cd', 'er', 'atkPercent', 'hpPercent', 'defPercent', 'healingBonus', 'pyroDmgBonus', 'hydroDmgBonus', 'electroDmgBonus', 'cryoDmgBonus', 'dendroDmgBonus', 'anemoDmgBonus', 'geoDmgBonus', 'physicalDmgBonus'].includes(key);
  return isPercent ? `${value.toFixed(1)}%` : formatNumber(Math.round(value));
}

export const SUBSTAT_STYLE_CONFIG: Record<
  string,
  {
    iconColor: string;
    valueClass: string;
    pipClass: string;
    label: string;
  }
> = {
  cr: {
    iconColor: '#f59e0b',
    valueClass: 'text-amber-300 font-black',
    pipClass: 'text-amber-400',
    label: 'CR',
  },
  cd: {
    iconColor: '#fbbf24',
    valueClass: 'text-amber-300 font-black',
    pipClass: 'text-amber-400',
    label: 'CD',
  },
  atkPercent: {
    iconColor: '#fb923c',
    valueClass: 'text-orange-200 font-bold',
    pipClass: 'text-orange-400',
    label: 'ATK%',
  },
  atk: {
    iconColor: '#fdba74',
    valueClass: 'text-zinc-100 font-semibold',
    pipClass: 'text-zinc-400',
    label: 'ATK',
  },
  em: {
    iconColor: '#34d399',
    valueClass: 'text-emerald-300 font-bold',
    pipClass: 'text-emerald-400',
    label: 'EM',
  },
  er: {
    iconColor: '#38bdf8',
    valueClass: 'text-sky-300 font-bold',
    pipClass: 'text-sky-400',
    label: 'ER',
  },
  hpPercent: {
    iconColor: '#2dd4bf',
    valueClass: 'text-teal-200 font-bold',
    pipClass: 'text-teal-400',
    label: 'HP%',
  },
  hp: {
    iconColor: '#5eead4',
    valueClass: 'text-zinc-100 font-semibold',
    pipClass: 'text-zinc-400',
    label: 'HP',
  },
  defPercent: {
    iconColor: '#facc15',
    valueClass: 'text-yellow-200 font-bold',
    pipClass: 'text-yellow-400',
    label: 'DEF%',
  },
  def: {
    iconColor: '#fde047',
    valueClass: 'text-zinc-100 font-semibold',
    pipClass: 'text-zinc-400',
    label: 'DEF',
  },
};

const SHOWCASE_ELEMENT_THEMES: Record<
  Element,
  {
    base: string;
    gradient: string;
    border: string;
    divider: string;
    trayBg: string;
    glow: string;
  }
> = {
  Pyro: {
    base: '#190d0b',
    gradient:
      'radial-gradient(ellipse 85% 95% at 72% 22%, rgba(239, 68, 68, 0.24) 0%, rgba(255, 107, 44, 0.14) 42%, transparent 75%), radial-gradient(ellipse 65% 80% at 15% 80%, rgba(185, 28, 28, 0.20) 0%, transparent 70%), linear-gradient(135deg, #24100d 0%, #170d0c 52%, #110b0d 100%)',
    border: 'rgba(255, 107, 44, 0.32)',
    divider: 'rgba(255, 145, 95, 0.14)',
    trayBg: 'rgba(18, 9, 9, 0.62)',
    glow: '0 12px 45px rgba(255, 107, 44, 0.12)',
  },
  Hydro: {
    base: '#0a1420',
    gradient:
      'radial-gradient(ellipse 85% 95% at 72% 22%, rgba(0, 191, 255, 0.22) 0%, rgba(37, 99, 235, 0.16) 44%, transparent 75%), radial-gradient(ellipse 65% 80% at 15% 80%, rgba(14, 165, 233, 0.18) 0%, transparent 70%), linear-gradient(135deg, #0b192b 0%, #0a1421 52%, #09101a 100%)',
    border: 'rgba(0, 191, 255, 0.30)',
    divider: 'rgba(125, 211, 252, 0.14)',
    trayBg: 'rgba(8, 16, 28, 0.62)',
    glow: '0 12px 45px rgba(0, 191, 255, 0.12)',
  },
  Electro: {
    base: '#150d21',
    gradient:
      'radial-gradient(ellipse 85% 95% at 72% 22%, rgba(168, 85, 247, 0.28) 0%, rgba(155, 89, 214, 0.18) 44%, transparent 76%), radial-gradient(ellipse 65% 80% at 15% 80%, rgba(126, 34, 206, 0.22) 0%, transparent 70%), linear-gradient(135deg, #211133 0%, #160e24 52%, #100b1a 100%)',
    border: 'rgba(168, 85, 247, 0.34)',
    divider: 'rgba(192, 132, 252, 0.15)',
    trayBg: 'rgba(15, 10, 24, 0.62)',
    glow: '0 12px 45px rgba(155, 89, 214, 0.15)',
  },
  Cryo: {
    base: '#0b161f',
    gradient:
      'radial-gradient(ellipse 85% 95% at 72% 22%, rgba(77, 208, 225, 0.22) 0%, rgba(56, 189, 248, 0.14) 44%, transparent 75%), radial-gradient(ellipse 65% 80% at 15% 80%, rgba(14, 116, 144, 0.20) 0%, transparent 70%), linear-gradient(135deg, #0d1f2b 0%, #0b1620 52%, #09121a 100%)',
    border: 'rgba(77, 208, 225, 0.30)',
    divider: 'rgba(103, 232, 249, 0.14)',
    trayBg: 'rgba(8, 17, 24, 0.62)',
    glow: '0 12px 45px rgba(77, 208, 225, 0.12)',
  },
  Dendro: {
    base: '#0d190e',
    gradient:
      'radial-gradient(ellipse 85% 95% at 72% 22%, rgba(124, 179, 66, 0.24) 0%, rgba(34, 197, 94, 0.14) 44%, transparent 75%), radial-gradient(ellipse 65% 80% at 15% 80%, rgba(21, 128, 61, 0.20) 0%, transparent 70%), linear-gradient(135deg, #112313 0%, #0d190f 52%, #0a120b 100%)',
    border: 'rgba(124, 179, 66, 0.32)',
    divider: 'rgba(134, 239, 172, 0.14)',
    trayBg: 'rgba(10, 19, 11, 0.62)',
    glow: '0 12px 45px rgba(124, 179, 66, 0.12)',
  },
  Anemo: {
    base: '#0a1919',
    gradient:
      'radial-gradient(ellipse 85% 95% at 72% 22%, rgba(79, 195, 247, 0.22) 0%, rgba(45, 212, 191, 0.16) 44%, transparent 75%), radial-gradient(ellipse 65% 80% at 15% 80%, rgba(13, 148, 136, 0.20) 0%, transparent 70%), linear-gradient(135deg, #0b2221 0%, #0a1818 52%, #081213 100%)',
    border: 'rgba(79, 195, 247, 0.30)',
    divider: 'rgba(94, 234, 212, 0.14)',
    trayBg: 'rgba(8, 19, 19, 0.62)',
    glow: '0 12px 45px rgba(79, 195, 247, 0.12)',
  },
  Geo: {
    base: '#19130a',
    gradient:
      'radial-gradient(ellipse 85% 95% at 72% 22%, rgba(255, 183, 77, 0.22) 0%, rgba(217, 119, 6, 0.15) 44%, transparent 75%), radial-gradient(ellipse 65% 80% at 15% 80%, rgba(180, 83, 9, 0.20) 0%, transparent 70%), linear-gradient(135deg, #241b0d 0%, #18130c 52%, #120e09 100%)',
    border: 'rgba(255, 183, 77, 0.32)',
    divider: 'rgba(253, 224, 71, 0.14)',
    trayBg: 'rgba(19, 15, 9, 0.62)',
    glow: '0 12px 45px rgba(255, 183, 77, 0.12)',
  },
};

function getWeaponMaxLevel(level: number, ascension?: number): number {
  const caps = [20, 40, 50, 60, 70, 80, 90];
  if (typeof ascension === 'number' && caps[ascension] !== undefined && level <= caps[ascension]) {
    return caps[ascension];
  }
  return caps.find((cap) => level <= cap) || 90;
}

function getCharacterMaxLevel(level: number): number {
  if (level > 95) return 100;
  if (level > 90) return 95;
  return 90;
}

export default function AkashaShowcaseCard({
  character,
  uid,
  playerNickname = 'Addy',
  className,
}: AkashaShowcaseCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showDamageBreakdown, setShowDamageBreakdown] = useState(false);
  const [activeConst, setActiveConst] = useState<number | null>(null);

  // Dynamically calculate KQM rotation damage distribution if not pre-attached
  const damageCalcResult = useMemo(() => {
    if (character.damageCalc && character.damageCalc.totalDamage) return character.damageCalc;
    try {
      return calculateDamage(character);
    } catch (e) {
      console.warn('Damage calculation fallback error for', character.name, e);
      return null;
    }
  }, [character]);
  const [hoveredRadarPoint, setHoveredRadarPoint] = useState<{
    series: 'build' | 'avg';
    index: number;
    x: number;
    y: number;
  } | null>(null);

  const elementColor = ELEMENT_COLORS[character.element] || ELEMENT_COLORS.Pyro;
  const elementTheme = SHOWCASE_ELEMENT_THEMES[character.element] || SHOWCASE_ELEMENT_THEMES.Pyro;
  const charMaxLevel = getCharacterMaxLevel(character.level);
  const weaponMaxLevel = getWeaponMaxLevel(character.weapon.level, character.weapon.ascension);

  // Total Build CV (including Circlet Crit Main Stat for authentic Akasha score)
  const totalCv = getEffectiveAkashaCv(character);

  const formattedCv = (Math.abs(totalCv - Math.round(totalCv)) < 0.15)
    ? `${Math.round(totalCv)} cv`
    : `${totalCv.toFixed(1)} cv`;

  // Weapon details
  const weaponName = resolveWeaponName(character.weapon.id, character.weapon.name);
  const passive = getWeaponPassive(
    character.weapon.id || weaponName,
    character.weapon.refinement
  );
  const weaponPassiveName = character.weapon.passiveName || passive.passiveName;

  // Active Set
  const activeBonuses = character.activeSetBonuses && character.activeSetBonuses.length > 0
    ? character.activeSetBonuses
    : getActiveArtifactSetBonuses(character.artifactSets || {}, character.artifacts);

  const primaryActiveBonus = activeBonuses.find(b => b.fourPieceActive) || activeBonuses[0];

  // Artifact slots in canonical order
  const slotOrder: Array<'flower' | 'plume' | 'sands' | 'goblet' | 'circlet'> = [
    'flower',
    'plume',
    'sands',
    'goblet',
    'circlet',
  ];
  const sortedArtifacts = slotOrder.map(slot =>
    (character.artifacts || []).find(a => a.slot === slot)
  );

  // Global rolls aggregation across all 5 artifacts
  const rollTotals: Record<string, { rolls: number; value: number }> = {};
  let totalRv = 0;
  let totalRollCount = 0;

  for (const art of character.artifacts || []) {
    for (const sub of art.subStats || []) {
      const rolls = sub.rolls || 1;
      totalRollCount += rolls;
      totalRv += getSubstatRv(sub.key, sub.value);

      if (!rollTotals[sub.key]) {
        rollTotals[sub.key] = { rolls: 0, value: 0 };
      }
      rollTotals[sub.key].rolls += rolls;
      rollTotals[sub.key].value += sub.value;
    }
  }

  // Primary DMG bonus (never fabricate 46.6% when character wears ATK%/HP%/EM goblet)
  const elemKey = character.element.toLowerCase();
  const elemDmgValue = character.stats.dmgBonus?.[elemKey] ?? 0;
  const physDmgValue = character.stats.dmgBonus?.physical ?? 0;
  const usePhysicalDmg = physDmgValue > elemDmgValue && physDmgValue > 0;
  const dmgBonusLabel = usePhysicalDmg ? 'Physical DMG' : `${character.element} DMG`;
  const dmgBonusValue = usePhysicalDmg ? physDmgValue : elemDmgValue;

  // Radar chart points generator (based on Akasha's Top 1% Avg / community builds & effective build stats)
  const topStats = character.akasha?.topStats;
  const effectivePlayer = character.akasha?.playerStats;
  const benchmarkLabel = topStats?.sourceLabel || 'TOP 1% AVG';
  const formatRadarNum = (v: number) =>
    Math.abs(v - Math.round(v)) < 0.05 ? String(Math.round(v)) : v.toFixed(1);

  const playerHp = effectivePlayer?.hp ?? (character.stats.hp || 0);
  const playerAtk = effectivePlayer?.atk ?? (character.stats.atk || 0);
  const playerDef = effectivePlayer?.def ?? (character.stats.def || 0);
  const playerEm = effectivePlayer?.em ?? (character.stats.em || 0);
  const playerEr = effectivePlayer?.er ?? (character.stats.er || 100);
  const playerCr = effectivePlayer?.cr ?? (character.stats.cr || 0);
  const playerCd = effectivePlayer?.cd ?? (character.stats.cd || 0);
  const playerDmgVal = effectivePlayer?.dmgBonus && effectivePlayer.dmgBonus > 0.1
    ? effectivePlayer.dmgBonus
    : dmgBonusValue;

  const includeDmgAxis = playerDmgVal > 0.1 || (topStats?.dmgBonus ?? 0) > 0.1;

  const radarAxesRaw = [
    { key: 'hp', label: 'HP', value: playerHp, display: formatRadarNum(playerHp), ref: topStats?.hp, fallbackAvg: 21000, sens: 2.5, formatRef: formatRadarNum },
    { key: 'atk', label: 'ATK', value: playerAtk, display: formatRadarNum(playerAtk), ref: topStats?.atk, fallbackAvg: 2100, sens: 3.0, formatRef: formatRadarNum },
    { key: 'def', label: 'DEF', value: playerDef, display: formatRadarNum(playerDef), ref: topStats?.def, fallbackAvg: 850, sens: 3.0, formatRef: formatRadarNum },
    { key: 'em', label: 'EM', value: playerEm, display: formatRadarNum(playerEm), ref: topStats?.em, fallbackAvg: 120, sens: 2.0, formatRef: formatRadarNum },
    { key: 'er', label: 'ER%', value: playerEr, display: `${playerEr.toFixed(1)}%`, ref: topStats?.er, fallbackAvg: 135, sens: 3.0, formatRef: (v: number) => `${v.toFixed(1)}%` },
    ...(includeDmgAxis
      ? [{ key: 'dmg', label: dmgBonusLabel, value: playerDmgVal, display: `${playerDmgVal.toFixed(1)}%`, ref: topStats?.dmgBonus, fallbackAvg: 46.6, sens: 1.5, formatRef: (v: number) => `${v.toFixed(1)}%` }]
      : []),
    { key: 'cr', label: 'Crit Rate', value: playerCr, display: `${playerCr.toFixed(1)}%`, ref: topStats?.cr, fallbackAvg: 70, sens: 2.0, formatRef: (v: number) => `${v.toFixed(1)}%` },
    { key: 'cd', label: 'Crit DMG', value: playerCd, display: `${playerCd.toFixed(1)}%`, ref: topStats?.cd, fallbackAvg: 160, sens: 2.0, formatRef: (v: number) => `${v.toFixed(1)}%` },
  ];

  const RADAR_MAX = 120;
  const BENCHMARK_SCORE = 100;

  const radarAxes = radarAxesRaw.map((a) => {
    const avg = topStats && a.ref !== undefined && a.ref > 0 ? a.ref : a.fallbackAvg;
    const sens = topStats ? a.sens : 1.0;

    let normRatio: number;
    if (a.key === 'def') {
      const denom = avg + 750;
      normRatio = 1 + ((a.value - avg) / denom) * sens;
    } else if (a.key === 'em') {
      const denom = a.value > avg ? avg + 150 : Math.max(avg, 50);
      normRatio = 1 + ((a.value - avg) / denom) * sens;
    } else {
      normRatio = 1 + ((a.value - avg) / Math.max(avg, 1)) * sens;
    }

    const score = Math.max(14, Math.min(122, BENCHMARK_SCORE * normRatio));
    const norm = score / RADAR_MAX;
    const hasRef = Boolean(topStats && a.ref !== undefined && (a.ref > 0 || a.key === 'em'));
    const refNorm = hasRef ? BENCHMARK_SCORE / RADAR_MAX : 14 / RADAR_MAX;

    return {
      key: a.key,
      label: a.label,
      display: a.display,
      refDisplay: a.ref !== undefined ? a.formatRef(a.ref) : undefined,
      norm,
      refNorm,
    };
  });

  const cx = 105;
  const cy = 105;
  const radius = 72;

  const radarPolygonPoints = radarAxes
    .map((axis, i) => {
      const angle = (i * 2 * Math.PI) / radarAxes.length - Math.PI / 2;
      const x = cx + radius * axis.norm * Math.cos(angle);
      const y = cy + radius * axis.norm * Math.sin(angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const benchmarkPolygonPoints = topStats
    ? radarAxes
        .map((axis, i) => {
          const angle = (i * 2 * Math.PI) / radarAxes.length - Math.PI / 2;
          const x = cx + radius * axis.refNorm * Math.cos(angle);
          const y = cy + radius * axis.refNorm * Math.sin(angle);
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ')
    : null;

  // Handle PNG export
  const handleExport = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: elementTheme.base,
      });
      const link = document.createElement('a');
      link.download = `${character.name}_Build_Akasha.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('Export failed:', e);
    } finally {
      setIsExporting(false);
    }
  };

  const glowPalette = ELEMENT_BORDER_GLOW[character.element] || ELEMENT_BORDER_GLOW.Pyro;

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* ── Main Akasha Card Frame (Element-Themed Atmosphere) ────────────── */}
      <BorderGlow
        glowColor={glowPalette.glowColor}
        colors={glowPalette.colors}
        backgroundColor={elementTheme.base}
        borderRadius={16}
        glowRadius={28}
        glowIntensity={0.95}
        fillOpacity={0.28}
        animated={true}
        overflowVisible={true}
        className="w-full !border-transparent shadow-2xl"
      >
        <div
          ref={cardRef}
          className="relative rounded-2xl overflow-hidden text-white border"
          style={{
            backgroundColor: elementTheme.base,
            backgroundImage: elementTheme.gradient,
            borderColor: elementTheme.border,
            boxShadow: elementTheme.glow,
          }}
        >
        {/* ── Card Upper Section (Grid 3 Columns) ─────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[480px] relative">
          {/* ── Col 1: Character Gacha Splash & Constellations (5 Cols) ─────── */}
          <div className="lg:col-span-5 relative z-30 flex flex-col justify-between p-6 min-h-[420px] lg:min-h-[480px]">
            {/* Full Gacha Splash Background with Smooth Horizontal Dissolve */}
            <div
              className="absolute inset-0 z-0 overflow-hidden rounded-l-2xl pointer-events-none"
              style={{
                WebkitMaskImage:
                  'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.96) 54%, rgba(0,0,0,0.55) 78%, rgba(0,0,0,0) 100%)',
                maskImage:
                  'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.96) 54%, rgba(0,0,0,0.55) 78%, rgba(0,0,0,0) 100%)',
              }}
            >
              <img
                src={character.gachaSplash || `/icons/characters/${character.id}_gacha.png`}
                alt={character.name}
                className="w-full h-full object-cover object-top pointer-events-none"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  const norm = character.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                  if (!target.src.includes(norm)) {
                    target.src = `/icons/characters/${norm}_gacha.png`;
                  } else if (!target.src.includes('enka.network')) {
                    target.src = `https://enka.network/ui/UI_Gacha_AvatarImg_${character.name.replace(/\s+/g, '')}.png`;
                  }
                }}
              />
              {/* Soft Edge Legibility Scrim */}
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to right, rgba(6,8,14,0.65) 0%, rgba(6,8,14,0.14) 55%, transparent 100%), linear-gradient(to top, rgba(6,8,14,0.55) 0%, transparent 35%)`,
                }}
              />
            </div>

            {/* Top Identity Block */}
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <div className="flex items-baseline gap-2.5">
                  <h1 className="text-3xl font-semibold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                    {character.name}
                  </h1>
                  <span className="text-zinc-200/80 font-normal text-sm drop-shadow">
                    {playerNickname}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs font-medium text-zinc-200 mt-1 drop-shadow">
                  <span>Lv. {character.level} / {charMaxLevel}</span>
                  <span className="flex items-center gap-1 text-zinc-200">
                    <Heart className="w-3 h-3 text-zinc-300" />
                    <span>{character.friendshipLevel || 10}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Left Edge: Vertical Constellation Track (C1-C6) with Seamless Hover & Tap Popover */}
            <ConstellationTrack
              character={character}
              activeConst={activeConst}
              setActiveConst={setActiveConst}
              className="absolute left-4 top-[54%] -translate-y-1/2 z-40"
            />

            {/* Vertical Talents Column (Right of character torso) */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3">
              {[
                {
                  label: 'NA',
                  level: character.talents.normal,
                  boosted: character.talents.boosted?.normal,
                  type: 'normal',
                },
                {
                  label: 'Skill',
                  level: character.talents.skill,
                  boosted: character.talents.boosted?.skill,
                  type: 'skill',
                },
                {
                  label: 'Burst',
                  level: character.talents.burst,
                  boosted: character.talents.boosted?.burst,
                  type: 'burst',
                },
              ].map((talent, idx) => {
                const isCrowned = talent.level >= 10 && !talent.boosted;
                const normName = character.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                const skillLocal = `/icons/talents/${character.id}_skill.png`;
                const skillNamed = `/icons/talents/${normName}_skill.png`;
                const burstLocal = `/icons/talents/${character.id}_burst.png`;
                const burstNamed = `/icons/talents/${normName}_burst.png`;

                const charMeta = getGameCharacter(character.id);
                const wType = (charMeta?.weaponType || 'Sword').toLowerCase();
                const normalIcon = wType.includes('bow')
                  ? '/icons/talents/normal_bow.png'
                  : wType.includes('claymore')
                  ? '/icons/talents/normal_claymore.png'
                  : wType.includes('pole')
                  ? '/icons/talents/normal_polearm.png'
                  : wType.includes('catalyst')
                  ? '/icons/talents/normal_catalyst.png'
                  : '/icons/talents/normal_sword.png';

                return (
                  <div key={idx} className="flex flex-col items-center group/talent">
                    <div
                      className={cn(
                        "relative w-10 h-10 rounded-full flex items-center justify-center bg-zinc-950 border border-zinc-700 p-1.5 transition-colors",
                        talent.boosted && "border-cyan-400"
                      )}
                    >
                      {talent.type === 'normal' ? (
                        <>
                          <img
                            src={normalIcon}
                            alt="Normal Attack"
                            className="w-full h-full object-contain filter drop-shadow brightness-0 invert"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.parentElement?.querySelector('.fallback-normal');
                              if (fallback) fallback.classList.remove('hidden');
                            }}
                          />
                          <Swords className="fallback-normal hidden w-5 h-5 text-zinc-200" />
                        </>
                      ) : talent.type === 'skill' ? (
                        <img
                          src={skillLocal}
                          alt="Elemental Skill"
                          className="w-full h-full object-contain filter drop-shadow"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (!target.src.includes(normName)) {
                              target.src = skillNamed;
                            } else {
                              target.style.display = 'none';
                              const fallback = target.parentElement?.querySelector('.fallback-skill');
                              if (fallback) fallback.classList.remove('hidden');
                            }
                          }}
                        />
                      ) : (
                        <img
                          src={burstLocal}
                          alt="Elemental Burst"
                          className="w-full h-full object-contain filter drop-shadow"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (!target.src.includes(normName)) {
                              target.src = burstNamed;
                            } else {
                              target.style.display = 'none';
                              const fallback = target.parentElement?.querySelector('.fallback-burst');
                              if (fallback) fallback.classList.remove('hidden');
                            }
                          }}
                        />
                      )}

                      {/* SVG Fallbacks */}
                      {talent.type === 'skill' && (
                        <Sparkles className="fallback-skill hidden w-5 h-5 text-zinc-200" />
                      )}
                      {talent.type === 'burst' && (
                        <Zap className="fallback-burst hidden w-5 h-5 text-zinc-200" />
                      )}

                      {/* Talent Level Pill */}
                      <span className="absolute -bottom-1 -right-1 text-[10px] font-bold px-1 rounded bg-black/90 border border-zinc-600 text-zinc-200">
                        {talent.level}
                      </span>
                      {/* Crown indicator */}
                      {isCrowned && (
                        <span className="absolute -top-1.5 -right-1" title="Crowned Talent">
                          <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        </span>
                      )}
                      {talent.boosted && (
                        <span className="absolute -top-1.5 -right-2 text-[9px] font-black bg-cyan-400 text-slate-950 px-1 rounded-full leading-none" title="Constellation Boosted (+3 Talent Levels)">
                          +3
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Left: Player UID */}
            <div className="relative z-10 text-xs font-mono text-zinc-400 drop-shadow">
              {uid}
            </div>
          </div>

          {/* ── Col 2: Weapon & Primary Stats (4 Cols) ─────────────────────── */}
          <div
            className="lg:col-span-4 p-5 flex flex-col justify-between border-l z-10"
            style={{ borderColor: elementTheme.divider }}
          >
            {/* Weapon Block */}
            <div
              className="flex items-center gap-4 pb-3.5 border-b"
              style={{ borderColor: elementTheme.divider }}
            >
              <GlareHover
                width="84px"
                height="84px"
                background="rgba(0, 0, 0, 0.45)"
                borderRadius="14px"
                borderColor="rgba(251, 191, 36, 0.38)"
                glareColor="#fde68a"
                glareOpacity={0.35}
                transitionDuration={500}
                mode="hover"
                className="shrink-0 shadow-lg p-1.5"
              >
                <img
                  src={character.weapon.icon}
                  alt={weaponName}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.src.includes('enka.network')) {
                      target.src = `https://enka.network/ui/UI_EquipIcon_Weapon_${weaponName.replace(/\s+/g, '')}.png`;
                    }
                  }}
                />
              </GlareHover>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-white truncate leading-snug">
                  {weaponName}
                </h2>
                <div className="text-amber-400 text-sm tracking-wider mt-0.5">
                  {'★'.repeat(character.weapon.rarity || 5)}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-200 font-medium mt-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-black/50 border border-white/15 text-[11px] font-bold text-amber-300">
                    R{character.weapon.refinement}
                  </span>
                  <span>Lv. {character.weapon.level} / {weaponMaxLevel}</span>
                  <span className="text-zinc-500">|</span>
                  <span className="inline-flex items-center gap-1">
                    <StatIcon statKey="atk" size={13} className="text-zinc-200 shrink-0" />
                    <span>{character.weapon.baseAtk}</span>
                  </span>
                  {character.weapon.subStat && (
                    <span className="text-zinc-200 font-semibold inline-flex items-center gap-1">
                      <StatIcon statKey={character.weapon.subStat.key} size={13} className="text-zinc-200 shrink-0" />
                      <span>{formatStatDisplay(character.weapon.subStat.key, character.weapon.subStat.value)}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Primary 8-Stat List */}
            <div className="py-3 space-y-2 text-[13px]">
              {[
                { label: 'Max HP', statKey: 'hp', raw: Math.round(character.stats.hp || 0), separator: ',', decimals: 0, suffix: '' },
                { label: 'ATK', statKey: 'atk', raw: Math.round(character.stats.atk || 0), separator: ',', decimals: 0, suffix: '' },
                { label: 'DEF', statKey: 'def', raw: Math.round(character.stats.def || 0), separator: ',', decimals: 0, suffix: '' },
                { label: 'Elemental Mastery', statKey: 'em', raw: Math.round(character.stats.em || 0), separator: '', decimals: 0, suffix: '' },
                { label: 'Crit Rate', statKey: 'cr', raw: character.stats.cr || 0, separator: '', decimals: 1, suffix: '%' },
                { label: 'Crit DMG', statKey: 'cd', raw: character.stats.cd || 0, separator: '', decimals: 1, suffix: '%' },
                { label: 'Energy Recharge', statKey: 'er', raw: character.stats.er || 100, separator: '', decimals: 1, suffix: '%' },
                {
                  label: `${dmgBonusLabel} Bonus`,
                  statKey: usePhysicalDmg ? 'physicalDmgBonus' : 'dmgBonus',
                  raw: dmgBonusValue,
                  separator: '',
                  decimals: 1,
                  suffix: '%',
                },
              ].map((stat, i) => (
                <div key={i} className="flex items-center justify-between text-zinc-200 hover:text-white transition-colors">
                  <div className="flex items-center gap-2.5">
                    <StatIcon
                      statKey={stat.statKey}
                      element={character.element}
                      size={16}
                      className="text-zinc-100/95 shrink-0"
                    />
                    <span className="font-medium text-zinc-200">{stat.label}</span>
                  </div>
                  <span className="font-mono font-bold text-white text-sm">
                    <CountUp
                      key={`${character.id}-${stat.label}`}
                      to={stat.raw}
                      separator={stat.separator}
                      decimals={stat.decimals}
                      suffix={stat.suffix}
                      duration={0.75}
                      trigger="load"
                    />
                  </span>
                </div>
              ))}
            </div>

            {/* Active Set Bonus Banner */}
            <div
              className="pt-2 border-t flex items-center justify-between"
              style={{ borderColor: elementTheme.divider }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={cn("w-2 h-2 rounded-full", primaryActiveBonus ? "bg-emerald-400" : "bg-zinc-600")} />
                <span className={cn("text-xs font-semibold truncate", primaryActiveBonus ? "text-emerald-400" : "text-zinc-400")}>
                  {primaryActiveBonus?.setName || 'No Active Set Bonus'}
                </span>
              </div>
              <span className={cn("text-xs font-bold font-mono", primaryActiveBonus ? "text-emerald-400" : "text-zinc-500")}>
                {primaryActiveBonus
                  ? `x${primaryActiveBonus.fourPieceActive ? 4 : primaryActiveBonus.twoPieceActive ? 2 : 1}`
                  : '—'}
              </span>
            </div>
          </div>

          {/* ── Col 3: Radar Spider Graph, Team & Ranking (3 Cols) ───────────── */}
          <div
            className="lg:col-span-3 p-5 flex flex-col justify-between border-l z-10"
            style={{ borderColor: elementTheme.divider }}
          >
            {/* Dynamic SVG Radar Graph (People's Build Comparison + Interactive Vertex Tooltips) */}
            <div
              className="relative flex flex-col items-center justify-center"
              onMouseLeave={() => setHoveredRadarPoint(null)}
            >
              <div className="relative w-[210px] h-[210px]">
                <svg width="210" height="210" viewBox="0 0 210 210" className="overflow-visible">
                  {/* Concentric Web Rings (20..120 scale, ring 5 = 100% Top 1% Avg) */}
                  {[1 / 6, 2 / 6, 3 / 6, 4 / 6, 5 / 6, 1.0].map((level, idx) => (
                    <polygon
                      key={idx}
                      points={radarAxes
                        .map((_, i) => {
                          const a = (i * 2 * Math.PI) / radarAxes.length - Math.PI / 2;
                          return `${(cx + radius * level * Math.cos(a)).toFixed(1)},${(cy + radius * level * Math.sin(a)).toFixed(1)}`;
                        })
                        .join(' ')}
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.12)"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Axis Web Spoke Lines */}
                  {radarAxes.map((_, i) => {
                    const a = (i * 2 * Math.PI) / radarAxes.length - Math.PI / 2;
                    const x = Number((cx + radius * Math.cos(a)).toFixed(1));
                    const y = Number((cy + radius * Math.sin(a)).toFixed(1));
                    return (
                      <line
                        key={i}
                        x1={cx}
                        y1={cy}
                        x2={x}
                        y2={y}
                        stroke="rgba(255, 255, 255, 0.15)"
                        strokeWidth="1"
                      />
                    );
                  })}

                  {/* Top 1% Leaderboard Benchmark Reference Polygon & Dots */}
                  {benchmarkPolygonPoints && (
                    <>
                      <polygon
                        points={benchmarkPolygonPoints}
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.35)"
                        strokeWidth="1.6"
                      />
                      {radarAxes.map((axis, i) => {
                        const a = (i * 2 * Math.PI) / radarAxes.length - Math.PI / 2;
                        const x = Number((cx + radius * axis.refNorm * Math.cos(a)).toFixed(1));
                        const y = Number((cy + radius * axis.refNorm * Math.sin(a)).toFixed(1));
                        const isHovered =
                          hoveredRadarPoint?.series === 'avg' && hoveredRadarPoint.index === i;
                        const tip = `${benchmarkLabel} • ${axis.label}: ${axis.refDisplay ?? '—'}`;
                        return (
                          <g key={`avg-${i}`}>
                            <circle
                              cx={x}
                              cy={y}
                              r={isHovered ? 4.5 : 3}
                              fill={isHovered ? '#ef4444' : 'rgba(255, 255, 255, 0.48)'}
                              stroke={isHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.25)'}
                              strokeWidth={isHovered ? 1.5 : 1}
                              className="transition-all duration-150 pointer-events-none"
                            />
                            <circle
                              cx={x}
                              cy={y}
                              r="9"
                              fill="transparent"
                              className="cursor-pointer"
                              onMouseEnter={() =>
                                setHoveredRadarPoint({ series: 'avg', index: i, x, y })
                              }
                              onClick={() =>
                                setHoveredRadarPoint({ series: 'avg', index: i, x, y })
                              }
                            >
                              <title>{tip}</title>
                            </circle>
                          </g>
                        );
                      })}
                    </>
                  )}

                  {/* Filled Player Build Radar Polygon */}
                  <polygon
                    points={radarPolygonPoints}
                    fill={`${elementColor.primary}42`}
                    stroke={elementColor.primary}
                    strokeWidth="2"
                  />

                  {/* Interactive Build Vertex Dots */}
                  {radarAxes.map((axis, i) => {
                    const a = (i * 2 * Math.PI) / radarAxes.length - Math.PI / 2;
                    const x = Number((cx + radius * axis.norm * Math.cos(a)).toFixed(1));
                    const y = Number((cy + radius * axis.norm * Math.sin(a)).toFixed(1));
                    const isHovered =
                      hoveredRadarPoint?.series === 'build' && hoveredRadarPoint.index === i;
                    const tip = axis.refDisplay
                      ? `${character.name} • ${axis.label}: ${axis.display} (${benchmarkLabel}: ${axis.refDisplay})`
                      : `${character.name} • ${axis.label}: ${axis.display}`;
                    return (
                      <g key={`build-${i}`}>
                        <circle
                          cx={x}
                          cy={y}
                          r={isHovered ? 4.5 : 3.2}
                          fill={isHovered ? '#ef4444' : elementColor.primary}
                          stroke="#ffffff"
                          strokeWidth={isHovered ? 1.5 : 1}
                          className="transition-all duration-150 pointer-events-none"
                        />
                        <circle
                          cx={x}
                          cy={y}
                          r="9"
                          fill="transparent"
                          className="cursor-pointer"
                          onMouseEnter={() =>
                            setHoveredRadarPoint({ series: 'build', index: i, x, y })
                          }
                          onClick={() =>
                            setHoveredRadarPoint({ series: 'build', index: i, x, y })
                          }
                        >
                          <title>{tip}</title>
                        </circle>
                      </g>
                    );
                  })}

                  {/* Axis Outer Text Labels */}
                  {radarAxes.map((axis, i) => {
                    const a = (i * 2 * Math.PI) / radarAxes.length - Math.PI / 2;
                    const lx = Number((cx + (radius + 17) * Math.cos(a)).toFixed(1));
                    const ly = Number((cy + (radius + 17) * Math.sin(a)).toFixed(1));
                    const tip = axis.refDisplay
                      ? `${axis.label}: ${axis.display} (${benchmarkLabel}: ${axis.refDisplay})`
                      : `${axis.label}: ${axis.display}`;
                    return (
                      <text
                        key={i}
                        x={lx}
                        y={ly}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="9"
                        fill="#e4e4e7"
                        fontWeight="bold"
                      >
                        <title>{tip}</title>
                        {axis.label}
                      </text>
                    );
                  })}
                </svg>

                {/* Akasha-Style Floating Vertex Hover Tooltip */}
                {hoveredRadarPoint && radarAxes[hoveredRadarPoint.index] && (
                  <div
                    className="absolute bg-[#0b0d13]/95 border border-white/20 rounded-lg px-2.5 py-1.5 shadow-2xl pointer-events-none z-50 whitespace-nowrap"
                    style={{
                      left: `${hoveredRadarPoint.x}px`,
                      top: `${hoveredRadarPoint.y}px`,
                      transform:
                        hoveredRadarPoint.x > cx + 5
                          ? 'translate(calc(-100% - 8px), -50%)'
                          : 'translate(10px, -50%)',
                    }}
                  >
                    <div className="text-[11px] font-bold text-white leading-tight">
                      {hoveredRadarPoint.series === 'avg' ? benchmarkLabel : character.name}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[11px] font-mono text-zinc-200">
                      <span
                        className="w-2.5 h-2.5 rounded-[2px] inline-block shrink-0"
                        style={{
                          backgroundColor:
                            hoveredRadarPoint.series === 'avg'
                              ? '#e4e4e7'
                              : elementColor.primary,
                        }}
                      />
                      <span>
                        {radarAxes[hoveredRadarPoint.index].label}:{' '}
                        {hoveredRadarPoint.series === 'avg'
                          ? radarAxes[hoveredRadarPoint.index].refDisplay ?? '—'
                          : radarAxes[hoveredRadarPoint.index].display}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {benchmarkPolygonPoints && (
                <div className="flex items-center gap-3 text-[10px] text-zinc-400 mt-0.5">
                  <span className="flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full inline-block"
                      style={{ backgroundColor: elementColor.primary }}
                    />
                    {character.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 border-t-2 border-white/40 inline-block" />
                    {benchmarkLabel}
                  </span>
                </div>
              )}
            </div>

            {/* Teammates Showcase Row (Parsed from Akasha calculation) */}
            <div className="flex items-center justify-center gap-2 pt-2">
              {character.akasha?.teammates && character.akasha.teammates.length > 0 ? (
                character.akasha.teammates.map((teamMember, i) => (
                  <div
                    key={teamMember.id || `${teamMember.name}-${i}`}
                    className={cn(
                      "relative w-8 h-8 rounded-lg overflow-hidden border bg-black/50 flex items-center justify-center",
                      i === 0 ? "border-amber-400/70" : "border-white/15"
                    )}
                    title={teamMember.name}
                  >
                    {teamMember.flexElement ? (
                      <ElementIcon element={teamMember.flexElement} size={18} />
                    ) : (
                      <img
                        src={teamMember.icon}
                        alt={teamMember.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          const cleanName = teamMember.name.replace(/\s+/g, '');
                          if (!target.src.includes('enka.network')) {
                            target.src = `https://enka.network/ui/UI_AvatarIcon_${cleanName}.png`;
                          } else {
                            target.style.display = 'none';
                          }
                        }}
                      />
                    )}
                  </div>
                ))
              ) : (
                <span className="text-[11px] font-mono text-zinc-400">
                  No preset team data
                </span>
              )}
            </div>

            {/* Leaderboard Rank & Category Badge */}
            <div className="pt-2 text-center">
              {character.akasha && character.akasha.ranking > 0 && character.akasha.outOf > 0 ? (
                <>
                  <div className="flex items-center justify-center gap-2 mb-1 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-bold tracking-wide flex items-center gap-1">
                      TOP {formatTopPercent(character.akasha.topPercent)}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-700/80 flex items-center gap-1"
                      title={character.akasha.title || character.akasha.category}
                    >
                      <ElementIcon element={character.element} size={12} />
                      <span>{character.akasha.category}</span>
                    </span>
                  </div>
                  <div className="font-mono text-xs text-zinc-400">
                    <span className="text-white font-bold">
                      {formatNumber(character.akasha.ranking)}
                    </span>{' '}
                    / {formatNumber(character.akasha.outOf)}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-2 mb-1 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-semibold tracking-wide">
                      {character.qualityBadge || getBuildCVTier(totalCv)} Build
                    </span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-700/80 flex items-center gap-1">
                      <ElementIcon element={character.element} size={12} />
                      <span>{character.element.toUpperCase()}</span>
                    </span>
                  </div>
                  <div className="font-mono text-xs text-zinc-500">
                    Unranked on Akasha
                  </div>
                </>
              )}
            </div>

            {/* Total Crit Value Badge */}
            <div
              className="text-right pt-2 border-t flex items-center justify-end gap-1.5"
              style={{ borderColor: elementTheme.divider }}
            >
              <span className="text-xs text-amber-400 font-bold tracking-tight font-mono">
                {formattedCv}
              </span>
              {character.setBonusCr ? (
                <span
                  className="text-[10px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono"
                  title={`${character.isCvCapped ? 'Capped at 100% CR' : 'Set Bonus'}: +${character.setBonusCr}% CR (+${character.setBonusCv || 0} CV)`}
                >
                  +{character.setBonusCr}%
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* ── Card Lower Section: The 5 Canonical Artifact Pieces ─────────── */}
        <div
          className="p-4 sm:p-5 border-t backdrop-blur-sm"
          style={{
            backgroundColor: elementTheme.trayBg,
            borderColor: elementTheme.divider,
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
            {sortedArtifacts.map((art, idx) => {
              if (!art) {
                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-dashed border-white/15 bg-black/25 p-4 text-center text-xs text-zinc-500 flex items-center justify-center min-h-[192px]"
                  >
                    Empty {slotOrder[idx]}
                  </div>
                );
              }

              const pieceRv = getPieceTotalRv(art.subStats || []);
              const critRolls = getCritRollsCount(art.subStats || []);

              // Border and glare color per slot matching official Akasha aesthetic
              const slotThemes: Record<string, { border: string; glare: string }> = {
                flower: { border: 'rgba(249, 115, 22, 0.45)', glare: '#fb923c' },
                plume: { border: 'rgba(59, 130, 246, 0.45)', glare: '#60a5fa' },
                sands: { border: 'rgba(251, 191, 36, 0.45)', glare: '#fbbf24' },
                goblet: { border: 'rgba(250, 204, 21, 0.45)', glare: '#facc15' },
                circlet: { border: 'rgba(255, 255, 255, 0.16)', glare: '#e4e4e7' },
              };
              const slotTheme = slotThemes[art.slot] || { border: 'rgba(255, 255, 255, 0.16)', glare: '#e4e4e7' };

              return (
                <GlareHover
                  key={art.id || idx}
                  width="100%"
                  height="100%"
                  background="rgba(14, 17, 24, 0.76)"
                  borderRadius="12px"
                  borderColor={slotTheme.border}
                  glareColor={slotTheme.glare}
                  glareOpacity={0.25}
                  transitionDuration={550}
                  mode="hover"
                  className="min-h-[192px] !place-items-stretch backdrop-blur-sm transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <div className="w-full h-full p-3.5 flex flex-col justify-between text-xs">
                    {/* Artifact Piece Header: RV% & Crit Rolls */}
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                      <span className="text-xs font-bold text-amber-400 font-mono">
                        {pieceRv}% RV
                      </span>
                      {critRolls > 0 && (
                        <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold text-[11px] border border-sky-400/40">
                          C ×{critRolls}
                        </span>
                      )}
                    </div>

                    {/* Artifact Body: Icon + Mainstat (Left) & Substats (Right) */}
                    <div className="grid grid-cols-12 gap-2.5 py-2.5 items-center flex-1">
                      {/* Left 5 cols: Relic Icon & Main Stat Pill */}
                      <div className="col-span-5 flex flex-col items-center justify-center">
                        <div className="relative w-14 h-14 xl:w-16 xl:h-16 rounded-xl overflow-hidden bg-black/45 border border-zinc-700/80 shadow-inner">
                          <img
                            src={art.icon}
                            alt={art.name}
                            className="w-full h-full object-contain p-1"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://enka.network/ui/UI_RelicIcon_${art.setId}_4.png`;
                            }}
                          />
                        </div>
                        <div
                          className="mt-2.5 px-2.5 py-1 rounded-lg bg-black/90 border shadow-md flex items-center justify-center gap-1.5 font-mono whitespace-nowrap"
                          style={{
                            borderColor: (SUBSTAT_STYLE_CONFIG[art.mainStat.key]?.iconColor || '#e4e4e7') + '66',
                          }}
                        >
                          <StatIcon
                            statKey={art.mainStat.key}
                            size={14}
                            style={{ color: SUBSTAT_STYLE_CONFIG[art.mainStat.key]?.iconColor || '#e4e4e7' }}
                            className="shrink-0 drop-shadow-sm"
                          />
                          <span className="text-xs md:text-[13px] font-black text-white tracking-tight">
                            {formatStatDisplay(art.mainStat.key, art.mainStat.value)}
                          </span>
                        </div>
                      </div>

                      {/* Right 7 cols: 4 Substats with Roll Dots */}
                      <div className="col-span-7 space-y-2 py-0.5">
                        {art.subStats.map((sub, sIdx) => {
                          const styleCfg = SUBSTAT_STYLE_CONFIG[sub.key] || {
                            iconColor: '#e4e4e7',
                            valueClass: 'text-white font-semibold',
                            pipClass: 'text-zinc-400',
                            label: sub.key,
                          };
                          const rolls = Math.min(5, Math.max(1, sub.rolls || 1));
                          const dots = '●'.repeat(rolls);
                          const isCrit = sub.key === 'cr' || sub.key === 'cd';

                          return (
                            <div
                              key={sIdx}
                              className="flex items-center justify-between font-mono"
                            >
                              {/* Roll Pips: Bold, distinct, colored by stat tier */}
                              <span
                                className={cn(
                                  "tracking-tight text-xs font-black",
                                  styleCfg.pipClass,
                                  rolls > 2 && isCrit && "drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]"
                                )}
                                title={`${rolls} roll${rolls > 1 ? 's' : ''}`}
                              >
                                {dots}
                              </span>

                              {/* Stat Icon + High-Contrast Formatted Value */}
                              <div className="flex items-center gap-1.5 text-right">
                                <StatIcon
                                  statKey={sub.key}
                                  size={15}
                                  style={{ color: styleCfg.iconColor }}
                                  className="shrink-0 drop-shadow-sm"
                                />
                                <span
                                  className={cn(
                                    "text-xs md:text-[13px] font-black tracking-tight",
                                    styleCfg.valueClass
                                  )}
                                >
                                  {formatStatDisplay(sub.key, sub.value)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </GlareHover>
              );
            })}
          </div>

          {/* ── Bottom Summary Ribbon: Global Substat Roll Breakdown ───────── */}
          <div
            className="mt-3.5 pt-3 border-t flex flex-wrap items-center justify-center gap-2 text-xs font-mono"
            style={{ borderColor: elementTheme.divider }}
          >
            {Object.entries(rollTotals).map(([key, data]) => {
              const cfg = SUBSTAT_STYLE_CONFIG[key];
              return (
                <span
                  key={key}
                  className="px-2.5 py-1 rounded-full bg-black/60 border border-white/10 text-zinc-200 font-medium flex items-center gap-1.5 shadow-sm"
                >
                  <span className={cn("font-bold", cfg ? cfg.pipClass : "text-amber-400")}>×{data.rolls}</span>
                  <StatIcon
                    statKey={key}
                    size={13}
                    style={{ color: cfg?.iconColor || '#e4e4e7' }}
                    className="shrink-0"
                  />
                  <span className="text-white font-semibold">{formatStatDisplay(key, data.value)}</span>
                </span>
              );
            })}
            <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 font-bold flex items-center gap-1.5">
              <span className="font-bold">×{totalRollCount}</span>
              <span>⚡ RV {totalRv}%</span>
            </span>
          </div>
        </div>
        </div>
      </BorderGlow>

      {/* ── Action Bar below the Showcase Card ───────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4 text-xs text-zinc-400 px-1">
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition font-medium border border-zinc-700/80 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Exporting...' : 'Download'}</span>
          </button>
          <button
            onClick={() => window.open(character.icon, '_blank')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition font-medium border border-zinc-700/80 shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open</span>
          </button>
          <button
            onClick={() => alert('Image customizer options')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition font-medium border border-zinc-700/80 shadow-sm"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configure Image</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-zinc-400 font-mono text-xs">
          <span>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}</span>
          <button
            onClick={() => setShowDamageBreakdown(prev => !prev)}
            className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition font-semibold"
          >
            <span>Show damage distribution</span>
            {showDamageBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable Damage Distribution Panel */}
      {showDamageBreakdown && (
        <div className="p-4 rounded-xl bg-[#10121a] border border-white/[0.08] shadow-2xl space-y-3.5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-2.5">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Swords className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Damage Distribution (KQM 20s Standard)</span>
            </h4>
            <span className="text-[10px] font-mono text-zinc-400 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.08]">
              Lv. 90 Target • 10% Base RES • KQM Theorycrafting
            </span>
          </div>

          {damageCalcResult ? (() => {
            const dist = damageCalcResult.distribution || {
              normalChargedPercent: 74,
              skillPercent: 12,
              burstPercent: 14,
              normalChargedDamage: Math.round(damageCalcResult.totalDamage * 0.74),
              skillDamage: damageCalcResult.skillDamage || Math.round(damageCalcResult.totalDamage * 0.12),
              burstDamage: damageCalcResult.burstDamage || Math.round(damageCalcResult.totalDamage * 0.14),
            };

            return (
              <div className="space-y-3.5">
                {/* Visual Stacked Distribution Bar */}
                <div className="space-y-2">
                  <div className="h-4 w-full rounded-full overflow-hidden flex bg-zinc-950 border border-white/10 shadow-inner p-0.5">
                    {dist.normalChargedPercent > 0 && (
                      <div
                        style={{ width: `${dist.normalChargedPercent}%` }}
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-300 rounded-l-full relative group"
                        title={`Normal / Charged Attack: ${dist.normalChargedPercent}% (${formatNumber(dist.normalChargedDamage || 0)})`}
                      />
                    )}
                    {dist.skillPercent > 0 && (
                      <div
                        style={{ width: `${dist.skillPercent}%` }}
                        className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-300 relative group"
                        title={`Elemental Skill: ${dist.skillPercent}% (${formatNumber(dist.skillDamage || 0)})`}
                      />
                    )}
                    {dist.burstPercent > 0 && (
                      <div
                        style={{ width: `${dist.burstPercent}%` }}
                        className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-300 rounded-r-full relative group"
                        title={`Elemental Burst: ${dist.burstPercent}% (${formatNumber(dist.burstDamage || 0)})`}
                      />
                    )}
                  </div>

                  {/* Distribution Legend */}
                  <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
                    <div className="flex items-center gap-1.5 bg-white/[0.03] px-2.5 py-1.5 rounded-lg border border-white/[0.06]">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shrink-0 shadow-sm" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-zinc-400 text-[10px]">Normal / CA</span>
                        <span className="text-amber-300 font-bold">{dist.normalChargedPercent}%</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 bg-white/[0.03] px-2.5 py-1.5 rounded-lg border border-white/[0.06]">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block shrink-0 shadow-sm" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-zinc-400 text-[10px]">Elem. Skill</span>
                        <span className="text-cyan-300 font-bold">{dist.skillPercent}%</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 bg-white/[0.03] px-2.5 py-1.5 rounded-lg border border-white/[0.06]">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block shrink-0 shadow-sm" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-zinc-400 text-[10px]">Elem. Burst</span>
                        <span className="text-purple-300 font-bold">{dist.burstPercent}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4 Stat Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  <div className="p-2.5 rounded-lg bg-zinc-950/80 border border-white/[0.08]">
                    <span className="text-zinc-400 text-[11px] block">Total Rotation DMG</span>
                    <p className="font-bold text-cyan-400 text-base font-mono mt-0.5">{formatNumber(damageCalcResult.totalDamage)}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-950/80 border border-white/[0.08]">
                    <span className="text-zinc-400 text-[11px] block">Skill Strike DMG</span>
                    <p className="font-bold text-white text-base font-mono mt-0.5">{formatNumber(damageCalcResult.skillDamage || 0)}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-950/80 border border-white/[0.08]">
                    <span className="text-zinc-400 text-[11px] block">Burst Finisher DMG</span>
                    <p className="font-bold text-white text-base font-mono mt-0.5">{formatNumber(damageCalcResult.burstDamage || 0)}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-950/80 border border-white/[0.08]">
                    <span className="text-zinc-400 text-[11px] block">Crit Average (Exp.)</span>
                    <p className="font-bold text-amber-300 text-base font-mono mt-0.5">{formatNumber(damageCalcResult.averageDamage || 0)}</p>
                  </div>
                </div>

                {/* Rotation Steps Preview */}
                {damageCalcResult.rotation && damageCalcResult.rotation.length > 0 && (
                  <div className="pt-1 text-[11px] font-sans text-zinc-400 flex items-start gap-2 bg-white/[0.02] p-2 rounded-lg border border-white/[0.05]">
                    <span className="font-mono text-cyan-400 font-semibold shrink-0">Rotation:</span>
                    <span className="text-zinc-300">
                      {damageCalcResult.rotation.join(' → ')}
                    </span>
                  </div>
                )}
              </div>
            );
          })() : (
            <p className="text-zinc-500">Damage formulas not configured for this character type yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
