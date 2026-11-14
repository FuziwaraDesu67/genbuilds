'use client';

import { useState } from 'react';
import type { Character, Element, QualityBadge, ActiveSetBonus } from '@/lib/enka/types';
import { ELEMENT_COLORS, getBuildCVTier, getActiveArtifactSetBonuses } from '@/lib/enka/static-data';
import { getWeaponPassive, resolveWeaponName } from '@/lib/enka/weapon-data';
import { formatNumber, formatPercentage, cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import CharacterDetailModal from './CharacterDetailModal';
import { LiquidButton } from '@/components/ui/liquid-glass-button';
import { ElementIcon } from '@/components/ui/element-icons';
import {
  Heart,
  Swords,
  Shield,
  Sparkles,
  Zap,
  Crosshair,
  Crown,
  Info,
} from 'lucide-react';

// ============================================================================
// Authoritative Elemental Visual Themes
// Strict preservation of #FF6B2C for Pyro and #9B59D6 for Electro
// ============================================================================
export interface ElementVisualTheme {
  primary: string;
  secondary: string;
  rgb: string;
  glow: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
}

export const ELEMENT_THEMES: Record<Element, ElementVisualTheme> = {
  Pyro: {
    primary: ELEMENT_COLORS.Pyro.primary, // '#FF6B2C'
    secondary: ELEMENT_COLORS.Pyro.secondary, // '#FF4500'
    rgb: '255, 107, 44',
    glow: '0 0 20px rgba(255, 107, 44, 0.40)',
    badgeBg: 'bg-orange-500/15',
    badgeBorder: 'border-orange-500/40',
    badgeText: 'text-orange-300',
  },
  Hydro: {
    primary: ELEMENT_COLORS.Hydro.primary, // '#00BFFF'
    secondary: ELEMENT_COLORS.Hydro.secondary, // '#1E90FF'
    rgb: '0, 191, 255',
    glow: '0 0 20px rgba(0, 191, 255, 0.40)',
    badgeBg: 'bg-sky-500/15',
    badgeBorder: 'border-sky-500/40',
    badgeText: 'text-sky-300',
  },
  Anemo: {
    primary: ELEMENT_COLORS.Anemo.primary, // '#4FC3F7'
    secondary: ELEMENT_COLORS.Anemo.secondary, // '#87CEEB'
    rgb: '79, 195, 247',
    glow: '0 0 20px rgba(79, 195, 247, 0.40)',
    badgeBg: 'bg-cyan-500/15',
    badgeBorder: 'border-cyan-500/40',
    badgeText: 'text-cyan-300',
  },
  Electro: {
    primary: ELEMENT_COLORS.Electro.primary, // '#9B59D6'
    secondary: ELEMENT_COLORS.Electro.secondary, // '#8A2BE2'
    rgb: '155, 89, 214',
    glow: '0 0 20px rgba(155, 89, 214, 0.40)',
    badgeBg: 'bg-purple-500/15',
    badgeBorder: 'border-purple-500/40',
    badgeText: 'text-purple-300',
  },
  Dendro: {
    primary: ELEMENT_COLORS.Dendro.primary, // '#7CB342'
    secondary: ELEMENT_COLORS.Dendro.secondary, // '#9ACD32'
    rgb: '124, 179, 66',
    glow: '0 0 20px rgba(124, 179, 66, 0.40)',
    badgeBg: 'bg-lime-500/15',
    badgeBorder: 'border-lime-500/40',
    badgeText: 'text-lime-300',
  },
  Cryo: {
    primary: ELEMENT_COLORS.Cryo.primary, // '#4DD0E1'
    secondary: ELEMENT_COLORS.Cryo.secondary, // '#00CED1'
    rgb: '77, 208, 225',
    glow: '0 0 20px rgba(77, 208, 225, 0.40)',
    badgeBg: 'bg-teal-500/15',
    badgeBorder: 'border-teal-500/40',
    badgeText: 'text-teal-300',
  },
  Geo: {
    primary: ELEMENT_COLORS.Geo.primary, // '#FFB74D'
    secondary: ELEMENT_COLORS.Geo.secondary, // '#DAA520'
    rgb: '255, 183, 77',
    glow: '0 0 20px rgba(255, 183, 77, 0.40)',
    badgeBg: 'bg-amber-500/15',
    badgeBorder: 'border-amber-500/40',
    badgeText: 'text-amber-300',
  },
};

// ============================================================================
// Build Crit Value Tier Configurations
// ============================================================================
const BUILD_CV_TIER_CONFIG: Record<
  QualityBadge,
  {
    label: QualityBadge;
    badgeClass: string;
    glowClass: string;
    borderClass: string;
    textClass: string;
    rangeText: string;
    description: string;
  }
> = {
  Godly: {
    label: 'Godly',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-400/50',
    glowClass: '',
    borderClass: 'border-amber-400/40',
    textClass: 'text-amber-300',
    rangeText: '≥ 240.0 CV',
    description: 'Top-tier endgame build with exceptional Crit substats across all 5 artifact pieces.',
  },
  Great: {
    label: 'Great',
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-400/50',
    glowClass: '',
    borderClass: 'border-purple-400/40',
    textClass: 'text-purple-300',
    rangeText: '220.0 – 239.9 CV',
    description: 'High-investment build with strong Crit roll density.',
  },
  Good: {
    label: 'Good',
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/50',
    glowClass: '',
    borderClass: 'border-cyan-400/40',
    textClass: 'text-cyan-300',
    rangeText: '180.0 – 219.9 CV',
    description: 'Solid endgame build ready for Spiral Abyss Floor 12.',
  },
  Decent: {
    label: 'Decent',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/40',
    glowClass: '',
    borderClass: 'border-emerald-400/30',
    textClass: 'text-emerald-300',
    rangeText: '140.0 – 179.9 CV',
    description: 'Functional build with room for artifact substat optimization.',
  },
  Subpar: {
    label: 'Subpar',
    badgeClass: 'bg-zinc-800/60 text-zinc-400 border-zinc-700/40',
    glowClass: '',
    borderClass: 'border-zinc-700/30',
    textClass: 'text-zinc-400',
    rangeText: '< 140.0 CV',
    description: 'Early-game build or non-Crit focused support build.',
  },
};

// ============================================================================
// Weapon Substat Formatter Helper
// ============================================================================
function formatWeaponSubStat(subStat?: { key: string; value: number }): {
  label: string;
  formattedValue: string;
} | null {
  if (!subStat || typeof subStat.value !== 'number') return null;

  const keyLower = subStat.key.toLowerCase();
  const isPercent =
    ['cr', 'cd', 'er', 'atkpercent', 'hppercent', 'defpercent', 'physicaldmgbonus',
     'fight_prop_critical', 'fight_prop_critical_hurt', 'fight_prop_charge_efficiency',
     'fight_prop_attack_percent', 'fight_prop_hp_percent', 'fight_prop_defense_percent'].includes(keyLower) ||
    keyLower.includes('percent') ||
    keyLower.includes('dmg');

  const labelMap: Record<string, string> = {
    cr: 'CRIT Rate',
    cd: 'CRIT DMG',
    atkpercent: 'ATK',
    hppercent: 'HP',
    defpercent: 'DEF',
    er: 'Energy Recharge',
    em: 'Elemental Mastery',
    atk: 'ATK',
    hp: 'HP',
    def: 'DEF',
    physicaldmgbonus: 'Physical DMG',
  };

  const cleanKey = keyLower.replace('fight_prop_', '').replace('_percent', 'percent');
  const label = labelMap[keyLower] || labelMap[cleanKey] || subStat.key;

  let formattedValue: string;
  if (isPercent) {
    const numericVal = subStat.value <= 1.0 ? subStat.value * 100 : subStat.value;
    formattedValue = `${numericVal.toFixed(1)}%`;
  } else {
    formattedValue = formatNumber(Math.round(subStat.value));
  }

  return { label, formattedValue };
}

interface CharacterCardProps {
  character: Character & { damageCalc?: any };
  uid: string;
  disableModal?: boolean;
  onCardClick?: () => void;
}

export default function CharacterCard({ character, uid, disableModal = false, onCardClick }: CharacterCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [showPassiveDetails, setShowPassiveDetails] = useState(false);
  const [activePopoverSetId, setActivePopoverSetId] = useState<number | null>(null);
  const [showCvTooltip, setShowCvTooltip] = useState(false);

  const elementColor = ELEMENT_COLORS[character.element] || ELEMENT_COLORS.Pyro;
  const theme = ELEMENT_THEMES[character.element] || ELEMENT_THEMES.Pyro;

  // Build CV computation
  const totalCv = character.totalCv !== undefined
    ? character.totalCv
    : parseFloat(
        (character.artifacts || []).reduce((sum, a) => sum + (a.cv || 0), 0).toFixed(1)
      );
  const buildTier: QualityBadge = character.qualityBadge || getBuildCVTier(totalCv);
  const tierConfig = BUILD_CV_TIER_CONFIG[buildTier] || BUILD_CV_TIER_CONFIG.Subpar;

  // CR:CD Ratio computation
  const safeCr = Math.max(0, character.stats.cr || 0);
  const safeCd = Math.max(0, character.stats.cd || 0);
  const crCdRatio = safeCr > 0 ? (safeCd / safeCr).toFixed(1) : '0.0';

  // Primary Elemental DMG computation
  const elementKey = character.element.toLowerCase();
  const elemDmgBonus = character.stats.dmgBonus?.[elementKey] || 0;
  const physDmgBonus = character.stats.dmgBonus?.['physical'] || 0;
  const displayDmgBonus = Math.max(elemDmgBonus, physDmgBonus);
  const displayDmgLabel = physDmgBonus > elemDmgBonus ? 'Physical DMG' : `${character.element} DMG`;

  // Weapon details & passive resolution
  const weaponName = resolveWeaponName(character.weapon.id, character.weapon.name);
  const weaponSubStat = formatWeaponSubStat(character.weapon.subStat);
  const passiveFallback = getWeaponPassive(
    character.weapon.id || weaponName,
    character.weapon.refinement
  );
  const passiveName = character.weapon.passiveName || passiveFallback.passiveName;
  const passiveDescription = character.weapon.passiveDescription || passiveFallback.passiveDescription;

  // Active artifact set bonuses
  const activeBonuses: ActiveSetBonus[] = (character.activeSetBonuses && character.activeSetBonuses.length > 0)
    ? character.activeSetBonuses
    : getActiveArtifactSetBonuses(character.artifactSets || {}, character.artifacts);

  return (
    <>
      <motion.div
        layout
        className="group relative rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.015] bg-slate-900/85 backdrop-blur-xl border ring-1 ring-inset ring-white/5"
        onClick={() => {
          if (onCardClick) {
            onCardClick();
          } else if (!disableModal) {
            setShowModal(true);
          }
        }}
        style={{
          borderColor: elementColor.primary + '40',
          boxShadow: `0 8px 32px -8px rgba(0, 0, 0, 0.6), 0 0 16px -4px rgba(${theme.rgb}, 0.25)`,
        }}
      >
        {/* Specular Top Light Edge */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent z-20 pointer-events-none rounded-t-2xl" />

        {/* Ambient Top Corner Elemental Glow */}
        <div
          className="absolute -top-16 -right-16 w-44 h-44 rounded-full blur-3xl pointer-events-none opacity-30 group-hover:opacity-50 transition-opacity"
          style={{ backgroundColor: theme.primary }}
        />

        {/* ================================================================== */}
        {/* Header Hero Section: Avatar, Name, Stars, Level & Constellations  */}
        {/* ================================================================== */}
        <div
          className="p-4 relative border-b border-white/10 rounded-t-2xl overflow-hidden"
          style={{
            background: `linear-gradient(135deg, rgba(${theme.rgb}, 0.20) 0%, rgba(${theme.rgb}, 0.05) 100%)`,
          }}
        >
          <div className="flex items-start justify-between relative z-10 gap-3">
            <div className="flex-1 flex gap-3.5 items-center min-w-0">
              {/* Character Avatar with Elemental Glow Frame */}
              <div className="relative group/avatar shrink-0">
                {/* Ambient Halo Glow */}
                <div
                  className="absolute -inset-1 rounded-full blur-md opacity-50 transition-opacity duration-300 group-hover/avatar:opacity-85"
                  style={{ backgroundColor: theme.primary }}
                />

                {/* Radiant Gradient Outer Ring */}
                <div
                  className="relative w-16 h-16 rounded-full p-[2.5px] transition-transform duration-300 group-hover/avatar:scale-105"
                  style={{
                    background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary} 70%, rgba(255,255,255,0.4))`,
                    boxShadow: `0 0 16px ${theme.primary}50`,
                  }}
                >
                  {/* Dark Inner Chamber */}
                  <div className="w-full h-full rounded-full overflow-hidden bg-slate-950/90 border border-white/20">
                    <img
                      src={character.icon}
                      alt={character.name}
                      className="w-full h-full object-cover object-center transform transition-transform duration-300 group-hover/avatar:scale-110"
                      loading="lazy"
                    />
                  </div>
                </div>

                {/* Anchored Element Glyph Badge */}
                <div
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center p-1 border shadow-lg"
                  style={{
                    backgroundColor: '#090d16',
                    borderColor: theme.primary,
                    boxShadow: `0 0 8px ${theme.primary}80`,
                    color: theme.primary,
                  }}
                  title={character.element}
                >
                  <ElementIcon element={character.element} size={14} className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Character Identity & Badges */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-bold tracking-tight text-white group-hover:text-cyan-200 transition-colors truncate">
                    {character.name}
                  </h3>
                  <div
                    className="text-xs tracking-wider"
                    style={{ color: character.rarity === 5 ? '#FBBF24' : '#C084FC' }}
                  >
                    {character.rarity === 5 ? '★★★★★' : '★★★★'}
                  </div>
                </div>

                {/* Badges Row: Element, Level, Friendship */}
                <div className="flex items-center gap-2 text-xs flex-wrap mt-1">
                  <span
                    className="px-2 py-0.5 rounded font-semibold flex items-center gap-1 border"
                    style={{
                      backgroundColor: theme.primary + '25',
                      borderColor: theme.primary + '50',
                      color: theme.primary,
                    }}
                  >
                    <ElementIcon element={character.element} size={11} className="w-2.5 h-2.5" />
                    {character.element}
                  </span>
                  <span className="px-2 py-0.5 rounded font-semibold bg-white/10 text-gray-300 border border-white/10">
                    Lv.{character.level}
                  </span>
                  {character.friendshipLevel > 0 && (
                    <span
                      className="px-2 py-0.5 rounded font-medium bg-pink-500/10 text-pink-300 border border-pink-500/25 flex items-center gap-1"
                      title={`Friendship Level ${character.friendshipLevel}`}
                    >
                      <span className="text-[10px] text-pink-400">❤</span> {character.friendshipLevel}
                    </span>
                  )}
                </div>

                {/* Constellation Section: C0-C6 Badge + 6-Node Celestial Track */}
                <div className="flex items-center gap-2.5 mt-2">
                  <div
                    className="px-2 py-0.5 rounded text-xs font-bold border transition-all duration-200 shrink-0"
                    style={{
                      backgroundColor: character.constellation > 0 ? theme.primary + '25' : 'rgba(255,255,255,0.06)',
                      borderColor: character.constellation > 0 ? theme.primary + '60' : 'rgba(255,255,255,0.12)',
                      color: character.constellation > 0 ? theme.primary : '#94a3b8',
                      boxShadow: character.constellation > 0 ? `0 0 10px ${theme.primary}40` : 'none',
                    }}
                  >
                    C{character.constellation}
                  </div>

                  {/* 6-Node Constellation Track */}
                  <div className="relative flex items-center gap-1.5 py-1">
                    {/* Background Track Line */}
                    <div className="absolute left-1 right-1 top-1/2 -translate-y-1/2 h-[2px] bg-slate-800/80 -z-0" />

                    {/* Active Progress Line */}
                    {character.constellation > 1 && (
                      <div
                        className="absolute left-1 top-1/2 -translate-y-1/2 h-[2px] transition-all duration-300 -z-0"
                        style={{
                          width: `${Math.min(100, ((character.constellation - 1) / 5) * 100)}%`,
                          backgroundColor: theme.primary,
                          boxShadow: `0 0 6px ${theme.primary}`,
                        }}
                      />
                    )}

                    {/* 6 Celestial Nodes with Authentic Constellation Icons */}
                    {[1, 2, 3, 4, 5, 6].map((nodeNum) => {
                      const isUnlocked = nodeNum <= character.constellation;
                      const norm = character.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                      return (
                        <div
                          key={nodeNum}
                          className="relative z-10 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 overflow-hidden p-0.5 border"
                          style={
                            isUnlocked
                              ? {
                                  backgroundColor: theme.primary,
                                  borderColor: '#ffffff',
                                  boxShadow: `0 0 8px ${theme.primary}`,
                                }
                              : {
                                  backgroundColor: '#0f172a',
                                  borderColor: 'rgba(255, 255, 255, 0.15)',
                                }
                          }
                          title={`Constellation ${nodeNum}: ${isUnlocked ? 'Unlocked' : 'Locked'}`}
                        >
                          <img
                            src={`/icons/characters/${character.id}_const_${nodeNum - 1}.png`}
                            alt={`C${nodeNum}`}
                            className={cn(
                              "w-full h-full object-contain filter",
                              isUnlocked ? "brightness-0 invert drop-shadow" : "opacity-35 brightness-75 grayscale"
                            )}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              if (!target.src.includes(norm)) {
                                target.src = `/icons/constellations/${norm}_${nodeNum}.png`;
                              } else {
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent && !parent.querySelector('span')) {
                                  const span = document.createElement('span');
                                  span.className = 'text-[9px] font-bold text-zinc-400';
                                  span.innerText = String(nodeNum);
                                  parent.appendChild(span);
                                }
                              }
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Damage Indicator */}
            <div className="text-right shrink-0">
              <div className="text-xs text-gray-400">Damage</div>
              <div className="text-2xl font-bold text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">
                {character.damageCalc ? formatNumber(character.damageCalc.totalDamage) : '—'}
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* Build CV & Tier Badge Strip (Universal CV = 2*CR + CD)             */}
        {/* ================================================================== */}
        <div className="px-4 pt-3 pb-1">
          <div className="relative group/cv">
            <div
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-xl bg-black/35 border transition-all cursor-help",
                tierConfig.borderClass,
                tierConfig.glowClass
              )}
              onMouseEnter={() => setShowCvTooltip(true)}
              onMouseLeave={() => setShowCvTooltip(false)}
              onClick={(e) => {
                e.stopPropagation();
                setShowCvTooltip((prev) => !prev);
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
                  Build CV
                </span>
                <span className="text-sm font-bold text-white font-mono">
                  {totalCv.toFixed(1)} CV
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-bold border", tierConfig.badgeClass)}>
                  {buildTier}
                </span>
                <Info className="w-3.5 h-3.5 text-gray-400 opacity-60 group-hover/cv:opacity-100 transition-opacity" />
              </div>
            </div>

            {/* CV Explaining Tooltip Popover */}
            <div
              className={cn(
                "absolute left-0 right-0 top-full mt-2 z-50 p-3.5 rounded-xl bg-slate-950/95 backdrop-blur-xl border border-white/15 shadow-2xl transition-all duration-200",
                showCvTooltip
                  ? "opacity-100 scale-100 pointer-events-auto"
                  : "opacity-0 scale-95 pointer-events-none"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                <span className="text-xs font-semibold text-gray-200">Build Crit Value (CV)</span>
                <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-bold border", tierConfig.badgeClass)}>
                  {buildTier}
                </span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Artifact CV:</span>
                  <span className="font-mono font-bold text-white">{totalCv.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tier Threshold:</span>
                  <span className="font-mono text-cyan-300">{tierConfig.rangeText}</span>
                </div>
                <p className="text-[11px] text-gray-300 pt-1 leading-relaxed">
                  {tierConfig.description}
                </p>
                <div className="pt-2 border-t border-white/10 text-[10px] text-gray-400">
                  Formula: <span className="text-gray-200 font-mono">CV = 2 × CR + CD</span> across 5 artifact pieces.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* Key Attribute Breakdown Panel: High-Contrast 7-Stat Grid          */}
        {/* ================================================================== */}
        <div className="p-4 pt-2 pb-3">
          <div className="rounded-xl bg-black/30 p-3.5 border border-white/10 space-y-3">
            {/* 6 Primary Combat Stats */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
              {/* Max HP */}
              <div className="flex items-center justify-between group/stat">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Heart className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>HP</span>
                </div>
                <span className="font-semibold text-white font-mono text-xs">
                  {formatNumber(character.stats.hp)}
                </span>
              </div>

              {/* ATK */}
              <div className="flex items-center justify-between group/stat">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Swords className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>ATK</span>
                </div>
                <span className="font-semibold text-white font-mono text-xs">
                  {formatNumber(character.stats.atk)}
                </span>
              </div>

              {/* DEF */}
              <div className="flex items-center justify-between group/stat">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Shield className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>DEF</span>
                </div>
                <span className="font-semibold text-white font-mono text-xs">
                  {formatNumber(character.stats.def)}
                </span>
              </div>

              {/* Elemental Mastery */}
              <div className="flex items-center justify-between group/stat">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Sparkles className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>EM</span>
                </div>
                <span className="font-semibold text-white font-mono text-xs">
                  {formatNumber(character.stats.em)}
                </span>
              </div>

              {/* Energy Recharge */}
              <div className="flex items-center justify-between group/stat">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Zap className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                  <span>ER</span>
                </div>
                <span className="font-semibold text-white font-mono text-xs">
                  {formatPercentage(character.stats.er, 1)}
                </span>
              </div>

              {/* Elemental DMG Bonus */}
              <div className="flex items-center justify-between group/stat">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <ElementIcon element={character.element} size={14} className="shrink-0" style={{ color: elementColor.primary }} />
                  <span className="truncate">{displayDmgLabel}</span>
                </div>
                <span className="font-semibold text-white font-mono text-xs">
                  {formatPercentage(displayDmgBonus, 1)}
                </span>
              </div>
            </div>

            {/* Crit Ratio Full-Width Spanning Row */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Crosshair className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Crit Ratio</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white font-mono text-xs">
                  {formatPercentage(character.stats.cr, 1)} / {formatPercentage(character.stats.cd, 1)}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-400/30 text-[10px] font-mono font-semibold">
                  1:{crCdRatio}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* Refined Weapon Card: R1–R5, Base ATK, Substat & Passive Popover    */}
        {/* ================================================================== */}
        <div className="px-4 pb-3">
          <div className="rounded-xl p-3 border border-white/10 bg-black/30 relative">
            <div className="flex items-center justify-between gap-3">
              {/* Icon & Details */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <img
                    src={character.weapon.icon}
                    alt={weaponName}
                    className="w-12 h-12 rounded-lg bg-black/40 border border-white/15 p-1 object-contain shadow-md"
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white truncate leading-tight">
                    {weaponName}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                    <span className="font-medium text-gray-300">Lv.{character.weapon.level}</span>
                  </div>
                </div>
              </div>

              {/* Prominent R1-R5 Refinement Badge */}
              <div
                className={cn(
                  "px-2.5 py-0.5 text-xs font-black rounded-md tracking-wider flex items-center gap-1 shadow-sm border shrink-0",
                  character.weapon.refinement === 5
                    ? "bg-gradient-to-r from-amber-500/30 via-yellow-400/40 to-amber-500/30 text-amber-200 border-amber-400/60 shadow-[0_0_10px_rgba(251,191,36,0.35)]"
                    : "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border-amber-400/40"
                )}
              >
                <span className="text-[10px] text-amber-400">✦</span>
                <span>R{character.weapon.refinement}</span>
              </div>
            </div>

            {/* Base ATK & Substat Badges */}
            <div className="flex items-center gap-2 text-xs mt-2.5 flex-wrap">
              {character.weapon.baseAtk > 0 && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300">
                  <span className="text-gray-400">Base ATK</span>
                  <span className="font-bold text-white">{character.weapon.baseAtk}</span>
                </div>
              )}
              {weaponSubStat && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/30 text-cyan-300">
                  <span className="text-cyan-400/80">{weaponSubStat.label}</span>
                  <span className="font-bold text-cyan-200">{weaponSubStat.formattedValue}</span>
                </div>
              )}
            </div>

            {/* Passive Name & Interactive Popover Disclosure */}
            {passiveName && (
              <div className="relative mt-2.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPassiveDetails((prev) => !prev);
                  }}
                  onMouseEnter={() => setShowPassiveDetails(true)}
                  onMouseLeave={() => setShowPassiveDetails(false)}
                  className="w-full text-left flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/40 hover:bg-black/60 border border-amber-500/20 hover:border-amber-400/40 transition-colors group/passive"
                  aria-expanded={showPassiveDetails}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                    <span className="text-xs font-semibold text-amber-300 truncate">
                      {passiveName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 group-hover/passive:text-amber-300 transition-colors shrink-0">
                    <span>Refinement</span>
                    <Info className="w-3 h-3 text-amber-400/80" />
                  </div>
                </button>

                {/* Floating Popover Card */}
                <div
                  className={cn(
                    "absolute left-0 right-0 top-full mt-1.5 z-40 p-3 rounded-lg bg-slate-900/95 backdrop-blur-md border border-amber-400/40 shadow-2xl text-xs leading-relaxed transition-all duration-200",
                    showPassiveDetails
                      ? "opacity-100 scale-100 pointer-events-auto"
                      : "opacity-0 scale-95 pointer-events-none group-hover/passive:opacity-100 group-hover/passive:scale-100 group-hover/passive:pointer-events-auto"
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-white/10">
                    <span className="font-bold text-amber-300 flex items-center gap-1">
                      ✦ {passiveName}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-400/30">
                      R{character.weapon.refinement}
                    </span>
                  </div>
                  <p className="text-gray-300 text-[11px] leading-relaxed">
                    {passiveDescription}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ================================================================== */}
        {/* Active Artifact Set Bonus Chips (2-piece and 4-piece)              */}
        {/* ================================================================== */}
        <div className="px-4 pb-3">
          <div className="text-xs text-gray-400 mb-2 font-medium">Active Set Bonuses</div>
          {activeBonuses.length === 0 ? (
            <div className="text-xs text-gray-500 italic bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
              No active set bonus (mixed artifacts)
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 relative">
              {activeBonuses.map((bonus) => {
                const isFourPiece = bonus.fourPieceActive;
                const pieceBadge = isFourPiece ? 4 : 2;
                const chipLabel = `${bonus.setName} (${pieceBadge})`;
                const isOpen = activePopoverSetId === bonus.setId;

                return (
                  <div key={bonus.setId} className="relative group/set">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePopoverSetId((prev) => (prev === bonus.setId ? null : bonus.setId));
                      }}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all text-left",
                        isFourPiece
                          ? "bg-amber-500/15 border-amber-400/50 text-amber-200 hover:bg-amber-500/25 shadow-[0_0_8px_rgba(245,158,11,0.2)]"
                          : "bg-cyan-500/15 border-cyan-400/40 text-cyan-200 hover:bg-cyan-500/25 shadow-[0_0_8px_rgba(6,182,212,0.2)]"
                      )}
                    >
                      <span>{chipLabel}</span>
                      <span
                        className={cn(
                          "text-[10px] px-1 py-0.2 rounded font-bold",
                          isFourPiece ? "bg-amber-400/30 text-amber-100" : "bg-cyan-400/30 text-cyan-100"
                        )}
                      >
                        {isFourPiece ? '4pc' : '2pc'}
                      </span>
                    </button>

                    {/* Popover with Full In-Game Skill Descriptions */}
                    <div
                      className={cn(
                        "absolute bottom-full left-0 mb-2 w-72 max-w-[calc(100vw-2rem)] z-50 p-3.5 rounded-xl bg-slate-950/95 backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-200",
                        isOpen
                          ? "opacity-100 scale-100 pointer-events-auto"
                          : "opacity-0 scale-95 pointer-events-none group-hover/set:opacity-100 group-hover/set:scale-100 group-hover/set:pointer-events-auto"
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Popover Header */}
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                        <span className="text-xs font-bold text-white truncate max-w-[180px]">
                          {bonus.setName}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full font-bold border",
                            isFourPiece
                              ? "bg-amber-500/20 text-amber-300 border-amber-400/40"
                              : "bg-cyan-500/20 text-cyan-300 border-cyan-400/40"
                          )}
                        >
                          {isFourPiece ? '4-Piece Active' : '2-Piece Active'}
                        </span>
                      </div>

                      {/* 2-Piece Bonus Description */}
                      <div
                        className={cn(
                          "p-2.5 rounded-lg mb-2 text-xs",
                          bonus.twoPieceActive ? "bg-cyan-950/40 border border-cyan-500/30" : "bg-white/5 opacity-60"
                        )}
                      >
                        <div className="font-semibold text-cyan-300 mb-1 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          2-Piece Bonus
                        </div>
                        <p className="text-gray-300 leading-relaxed text-[11px]">
                          {bonus.twoPieceText || bonus.twoPiece || 'Increases set stats.'}
                        </p>
                      </div>

                      {/* 4-Piece Bonus Description */}
                      {(bonus.fourPieceText || bonus.fourPiece) && (
                        <div
                          className={cn(
                            "p-2.5 rounded-lg text-xs",
                            isFourPiece
                              ? "bg-amber-950/40 border border-amber-500/30"
                              : "bg-white/5 border border-white/5 opacity-50"
                          )}
                        >
                          <div
                            className={cn(
                              "font-semibold mb-1 flex items-center gap-1.5",
                              isFourPiece ? "text-amber-300" : "text-gray-400"
                            )}
                          >
                            <span
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                isFourPiece ? "bg-amber-400" : "bg-gray-500"
                              )}
                            />
                            4-Piece Bonus {!isFourPiece && <span className="text-[10px] text-gray-500 font-normal">(Inactive)</span>}
                          </div>
                          <p className="text-gray-300 leading-relaxed text-[11px]">
                            {bonus.fourPieceText || bonus.fourPiece}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ================================================================== */}
        {/* Circular Talent Badges: NA, Skill, Burst + Radiant +3 Boost        */}
        {/* ================================================================== */}
        <div className="px-4 pb-4 border-t border-white/10 pt-4">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
            Talents
          </div>
          <div className="flex items-center justify-around gap-2">
            {[
              {
                key: 'normal',
                shortLabel: 'NA',
                label: 'Normal Attack',
                level: character.talents.normal,
                isBoosted: Boolean(character.talents.boosted?.normal),
                icon: <Swords className="w-5 h-5 text-gray-200" />,
              },
              {
                key: 'skill',
                shortLabel: 'Skill',
                label: 'Elemental Skill',
                level: character.talents.skill,
                isBoosted: Boolean(character.talents.boosted?.skill),
                icon: (
                  <div
                    className="relative w-5 h-5 flex items-center justify-center"
                    style={{
                      color: character.talents.boosted?.skill ? '#22d3ee' : elementColor.primary,
                    }}
                  >
                    <img
                      src={`/icons/talents/${character.id}_skill.png`}
                      alt="Skill"
                      className="w-full h-full object-contain filter drop-shadow"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const norm = character.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                        if (!target.src.includes(norm)) {
                          target.src = `/icons/talents/${norm}_skill.png`;
                        }
                      }}
                    />
                  </div>
                ),
              },
              {
                key: 'burst',
                shortLabel: 'Burst',
                label: 'Elemental Burst',
                level: character.talents.burst,
                isBoosted: Boolean(character.talents.boosted?.burst),
                icon: (
                  <div
                    className="relative w-5 h-5 flex items-center justify-center"
                    style={{
                      color: character.talents.boosted?.burst ? '#22d3ee' : '#f59e0b',
                    }}
                  >
                    <img
                      src={`/icons/talents/${character.id}_burst.png`}
                      alt="Burst"
                      className="w-full h-full object-contain filter drop-shadow"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const norm = character.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                        if (!target.src.includes(norm)) {
                          target.src = `/icons/talents/${norm}_burst.png`;
                        }
                      }}
                    />
                  </div>
                ),
              },
            ].map((talent) => (
              <div key={talent.key} className="flex flex-col items-center gap-1.5 group/talent">
                {/* Circular Badge Container */}
                <div
                  className={cn(
                    "relative w-12 h-12 rounded-full flex flex-col items-center justify-center transition-all duration-300",
                    "bg-gradient-to-b from-slate-800/90 to-slate-950/90 backdrop-blur-md shadow-lg",
                    talent.isBoosted
                      ? "border-2 shadow-[0_0_12px_rgba(34,211,238,0.55)] ring-1 ring-cyan-400/40"
                      : talent.level >= 10
                      ? "border-2 border-amber-400/80 shadow-[0_0_10px_rgba(245,158,11,0.4)]"
                      : "border border-white/20 hover:border-white/40"
                  )}
                  style={{
                    borderColor: talent.isBoosted
                      ? '#22d3ee'
                      : talent.level >= 10
                      ? '#f59e0b'
                      : undefined,
                  }}
                >
                  {/* Inner Element Glow Radial */}
                  <div
                    className="absolute inset-0 rounded-full opacity-20 pointer-events-none"
                    style={{
                      background: talent.isBoosted
                        ? 'radial-gradient(circle, #22d3ee 0%, transparent 70%)'
                        : `radial-gradient(circle, ${elementColor.primary} 0%, transparent 70%)`,
                    }}
                  />

                  {/* Icon */}
                  <div className="relative z-10 group-hover/talent:scale-110 transition-transform">
                    {talent.icon}
                  </div>

                  {/* Level Number */}
                  <span
                    className={cn(
                      "relative z-10 text-xs font-black tracking-tight leading-none mt-0.5",
                      talent.isBoosted
                        ? "text-cyan-200"
                        : talent.level >= 10
                        ? "text-amber-300 font-extrabold"
                        : "text-white"
                    )}
                  >
                    {talent.level}
                  </span>

                  {/* Radiant +3 Tag for Constellation-Boosted Talents */}
                  {talent.isBoosted && (
                    <div
                      className="absolute -top-1.5 -right-2 z-20 px-1.5 py-0.5 rounded-full text-[10px] font-black tracking-tighter leading-none flex items-center gap-0.5 bg-gradient-to-r from-cyan-400 via-sky-300 to-cyan-400 text-slate-950 border border-white shadow-[0_0_10px_rgba(6,182,212,0.9)] animate-pulse"
                      title="Constellation Boosted (+3 Talent Levels)"
                    >
                      <span>+3</span>
                    </div>
                  )}

                  {/* Crown Indicator for Crowned Talents */}
                  {talent.level >= 10 && !talent.isBoosted && (
                    <div
                      className="absolute -bottom-1 z-20 px-1 py-0.2 rounded-full text-[8px] font-bold bg-amber-500/90 text-amber-950 border border-amber-300 shadow-sm flex items-center justify-center"
                      title="Crowned Talent"
                    >
                      ★
                    </div>
                  )}
                </div>

                {/* Subtitle Label */}
                <span className="text-[11px] font-medium text-gray-400 group-hover/talent:text-gray-300 transition-colors">
                  {talent.shortLabel}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* View Details Action */}
        <div className="px-4 pb-4 pt-1">
          <LiquidButton
            className="w-full py-2 text-sm text-cyan-400 hover:text-cyan-300"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `/leaderboard/${character.id}`;
            }}
          >
            View on Leaderboard →
          </LiquidButton>
        </div>
      </motion.div>

      {/* Modal Inspection */}
      <AnimatePresence>
        {showModal && (
          <CharacterDetailModal
            character={character}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
