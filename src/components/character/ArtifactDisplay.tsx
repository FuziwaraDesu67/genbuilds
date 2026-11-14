'use client';

import React from 'react';
import type { Artifact, ActiveSetBonus, QualityBadge } from '@/lib/enka/types';
import {
  calculateCritValue,
  getQualityBadge,
  estimateRollCount,
  deriveVisualRollPips,
} from '@/lib/enka/static-data';
import { getActiveArtifactSetBonuses, getArtifactSetDetails } from '@/lib/enka/artifact-set-data';
import { formatPercentage, formatNumber, cn } from '@/lib/utils';
import {
  Flower2,
  Feather,
  Hourglass,
  Wine,
  Crown,
  Sparkles,
  Info,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react';

// ============================================================================
// Canonical Slot Metadata & Ordering
// ============================================================================

export const ARTIFACT_SLOT_ORDER: Record<string, number> = {
  flower: 0,
  plume: 1,
  sands: 2,
  goblet: 3,
  circlet: 4,
};

export interface SlotConfig {
  name: string;
  shortName: string;
  label: string;
  icon: LucideIcon;
  bg: string;
  border: string;
  text: string;
}

export const ARTIFACT_SLOT_CONFIG: Record<string, SlotConfig> = {
  flower: {
    name: 'Flower of Life',
    shortName: 'Flower',
    label: 'FLOWER',
    icon: Flower2,
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
  },
  plume: {
    name: 'Plume of Death',
    shortName: 'Plume',
    label: 'PLUME',
    icon: Feather,
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    text: 'text-rose-400',
  },
  sands: {
    name: 'Sands of Eon',
    shortName: 'Sands',
    label: 'SANDS',
    icon: Hourglass,
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
  },
  goblet: {
    name: 'Goblet of Eonothem',
    shortName: 'Goblet',
    label: 'GOBLET',
    icon: Wine,
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
  },
  circlet: {
    name: 'Circlet of Logos',
    shortName: 'Circlet',
    label: 'CIRCLET',
    icon: Crown,
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
  },
};

// ============================================================================
// Stat Dictionary & Formatting
// ============================================================================

export const STAT_NAMES: Record<string, string> = {
  hp: 'HP',
  atk: 'ATK',
  def: 'DEF',
  hpPercent: 'HP%',
  atkPercent: 'ATK%',
  defPercent: 'DEF%',
  cr: 'CRIT Rate',
  cd: 'CRIT DMG',
  er: 'Energy Recharge',
  em: 'Elemental Mastery',
  healingBonus: 'Healing Bonus',
  physicalDmgBonus: 'Physical DMG',
  pyroDmgBonus: 'Pyro DMG',
  hydroDmgBonus: 'Hydro DMG',
  electroDmgBonus: 'Electro DMG',
  cryoDmgBonus: 'Cryo DMG',
  dendroDmgBonus: 'Dendro DMG',
  anemoDmgBonus: 'Anemo DMG',
  geoDmgBonus: 'Geo DMG',
  FIGHT_PROP_HP: 'HP',
  FIGHT_PROP_ATTACK: 'ATK',
  FIGHT_PROP_DEFENSE: 'DEF',
  FIGHT_PROP_HP_PERCENT: 'HP%',
  FIGHT_PROP_ATTACK_PERCENT: 'ATK%',
  FIGHT_PROP_DEFENSE_PERCENT: 'DEF%',
  FIGHT_PROP_CRITICAL: 'CRIT Rate',
  FIGHT_PROP_CRITICAL_HURT: 'CRIT DMG',
  FIGHT_PROP_CHARGE_EFFICIENCY: 'Energy Recharge',
  FIGHT_PROP_ELEMENT_MASTERY: 'Elemental Mastery',
  FIGHT_PROP_HEAL_ADD: 'Healing Bonus',
  FIGHT_PROP_PHYSICAL_ADD_HURT: 'Physical DMG',
  FIGHT_PROP_FIRE_ADD_HURT: 'Pyro DMG',
  FIGHT_PROP_ELEC_ADD_HURT: 'Electro DMG',
  FIGHT_PROP_WATER_ADD_HURT: 'Hydro DMG',
  FIGHT_PROP_GRASS_ADD_HURT: 'Dendro DMG',
  FIGHT_PROP_WIND_ADD_HURT: 'Anemo DMG',
  FIGHT_PROP_ROCK_ADD_HURT: 'Geo DMG',
  FIGHT_PROP_ICE_ADD_HURT: 'Cryo DMG',
};

export function getStatName(key: string): string {
  return STAT_NAMES[key] || key;
}

export function isPercentageStat(key: string): boolean {
  const k = key.toLowerCase();
  return (
    ['cr', 'cd', 'er', 'hppercent', 'atkpercent', 'defpercent', 'healingbonus'].includes(k) ||
    k.includes('percent') ||
    k.includes('dmgbonus') ||
    k.includes('add_hurt') ||
    k.includes('critical') ||
    k.includes('efficiency')
  );
}

export function formatStatValue(key: string, value: number): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '0';
  }
  if (isPercentageStat(key)) {
    // Normalization protection: values already <= 1.0 (e.g. 0.466) convert to 46.6%
    const normalized = value > 0 && value <= 1.0 ? value * 100 : value;
    return formatPercentage(normalized, 1);
  }
  // Flat integer stats like 4780 (never comma formatted to satisfy tests)
  return value.toFixed(0);
}

// Backward compatibility alias
export const getStatDisplay = formatStatValue;

// ============================================================================
// Piece CV Quality Badge Configuration
// ============================================================================

export const PIECE_CV_BADGE_CONFIG: Record<QualityBadge, {
  label: QualityBadge;
  badgeClass: string;
  glowClass: string;
  description: string;
  thresholdStandard: string;
  thresholdCirclet: string;
}> = {
  Godly: {
    label: 'Godly',
    badgeClass: 'bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-orange-500/25 text-amber-300 border-amber-400/80',
    glowClass: 'shadow-[0_0_12px_rgba(245,158,11,0.45)] ring-1 ring-amber-400/30',
    description: 'Top-tier unicorn artifact with exceptional Crit roll density.',
    thresholdStandard: '≥ 50.0 CV',
    thresholdCirclet: '≥ 35.0 CV',
  },
  Great: {
    label: 'Great',
    badgeClass: 'bg-gradient-to-r from-purple-500/25 to-pink-500/25 text-purple-300 border-purple-400/70',
    glowClass: 'shadow-[0_0_10px_rgba(168,85,247,0.35)] ring-1 ring-purple-400/20',
    description: 'High-investment piece with strong Crit substat upgrades.',
    thresholdStandard: '40.0 – 49.9 CV',
    thresholdCirclet: '30.0 – 34.9 CV',
  },
  Good: {
    label: 'Good',
    badgeClass: 'bg-gradient-to-r from-cyan-500/25 to-blue-500/25 text-cyan-300 border-cyan-400/60',
    glowClass: 'shadow-[0_0_8px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/20',
    description: 'Solid endgame piece ready for Abyss Floor 12 clears.',
    thresholdStandard: '30.0 – 39.9 CV',
    thresholdCirclet: '20.0 – 29.9 CV',
  },
  Decent: {
    label: 'Decent',
    badgeClass: 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-400/50',
    glowClass: 'shadow-[0_0_6px_rgba(16,185,129,0.25)] ring-1 ring-emerald-400/20',
    description: 'Functional build piece with usable Crit stats.',
    thresholdStandard: '20.0 – 29.9 CV',
    thresholdCirclet: '10.0 – 19.9 CV',
  },
  Subpar: {
    label: 'Subpar',
    badgeClass: 'bg-slate-800/60 text-slate-400 border-slate-700/60',
    glowClass: 'shadow-none',
    description: 'Low or zero Crit substat investment.',
    thresholdStandard: '< 20.0 CV',
    thresholdCirclet: '< 10.0 CV',
  },
};

export function getQualityBadgeClass(badge?: QualityBadge): string {
  const cfg = badge ? PIECE_CV_BADGE_CONFIG[badge] : PIECE_CV_BADGE_CONFIG.Subpar;
  return cn(cfg.badgeClass, cfg.glowClass);
}

// ============================================================================
// Substat Roll Pips & Tooltip Helpers
// ============================================================================

export function getPipBadgeClass(rolls: number): string {
  if (rolls >= 6) {
    return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/60 shadow-[0_0_8px_rgba(250,204,21,0.4)] font-bold';
  }
  if (rolls === 5) {
    return 'bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-[0_0_6px_rgba(245,158,11,0.3)] font-bold';
  }
  if (rolls === 4) {
    return 'bg-purple-500/15 text-purple-300 border-purple-400/40 shadow-[0_0_6px_rgba(168,85,247,0.25)] font-semibold';
  }
  if (rolls === 3) {
    return 'bg-cyan-500/15 text-cyan-300 border-cyan-400/40 shadow-[0_0_4px_rgba(6,182,212,0.2)] font-medium';
  }
  if (rolls === 2) {
    return 'bg-emerald-500/10 text-emerald-300/90 border-emerald-500/30 font-normal';
  }
  return 'bg-slate-800/40 text-slate-400 border-slate-700/50 font-normal';
}

export function getRollTooltip(statName: string, rolls: number): string {
  if (rolls >= 6) {
    return `${rolls} Rolls (★ Theoretical Maximum): ${statName} received all 5 upgrade procs (5 upgrades + 1 base roll).`;
  }
  if (rolls === 5) {
    return `${rolls} Rolls (Exceptional): ${statName} received 4 upgrade procs (4 upgrades + 1 base roll).`;
  }
  if (rolls === 4) {
    return `${rolls} Rolls (High Investment): ${statName} received 3 upgrade procs (3 upgrades + 1 base roll).`;
  }
  if (rolls === 3) {
    return `${rolls} Rolls (Solid): ${statName} received 2 upgrade procs (2 upgrades + 1 base roll).`;
  }
  if (rolls === 2) {
    return `${rolls} Rolls: ${statName} received 1 upgrade proc (1 upgrade + 1 base roll).`;
  }
  return `1 Roll (Base stat): ${statName} received 0 upgrades (Initial base roll only).`;
}

export function formatRollPips(subStat: { key: string; value: number; rolls?: number; pips?: string }): {
  pipsText: string;
  rolls: number;
  pipBadgeClass: string;
  tooltip: string;
} {
  const rolls = subStat.rolls ?? estimateRollCount(subStat.key, subStat.value) ?? 1;
  const boundedRolls = Math.max(1, Math.min(rolls, 6));
  let cleanPips: string;
  if (subStat.pips) {
    cleanPips = subStat.pips.replace(/[\[\]]/g, '');
  } else {
    cleanPips = deriveVisualRollPips(boundedRolls);
  }
  const pipsText = `[${cleanPips}]`;
  const pipBadgeClass = getPipBadgeClass(boundedRolls);
  const tooltip = getRollTooltip(getStatName(subStat.key), boundedRolls);

  return { pipsText, rolls: boundedRolls, pipBadgeClass, tooltip };
}

// ============================================================================
// Component 1: ActiveSetBonusesBanner
// ============================================================================

export interface ActiveSetBonusesBannerProps {
  activeBonuses?: ActiveSetBonus[];
  artifacts?: Artifact[];
  artifactSets?: Record<number | string, number>;
  className?: string;
}

export function ActiveSetBonusesBanner({
  activeBonuses: propBonuses,
  artifacts,
  artifactSets,
  className,
}: ActiveSetBonusesBannerProps) {
  // Resolve active set bonuses from props or fallback to derivation
  const bonuses: ActiveSetBonus[] = React.useMemo(() => {
    if (propBonuses && propBonuses.length > 0) return propBonuses;
    if (artifactSets) return getActiveArtifactSetBonuses(artifactSets, artifacts);
    if (artifacts && artifacts.length > 0) {
      const counts: Record<number, number> = {};
      artifacts.forEach((a) => {
        counts[a.setId] = (counts[a.setId] || 0) + 1;
      });
      return getActiveArtifactSetBonuses(counts, artifacts);
    }
    return [];
  }, [propBonuses, artifactSets, artifacts]);

  const totalActiveSets = bonuses.length;

  return (
    <div
      className={cn(
        "rounded-2xl p-5 sm:p-6 bg-slate-900/90 backdrop-blur-2xl border border-white/10 ring-1 ring-inset ring-white/5 shadow-2xl relative overflow-hidden",
        className
      )}
    >
      {/* Specular Edge Highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none" />

      {/* Banner Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10 relative z-10 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Active Set Bonuses
            </h3>
            <p className="text-xs text-gray-400">
              In-game combat passive skills from equipped artifact sets
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {totalActiveSets > 0 ? (
            <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              {totalActiveSets} Active {totalActiveSets === 1 ? 'Set' : 'Sets'}
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-slate-800 text-slate-400 border border-white/10">
              Mixed Build
            </span>
          )}
        </div>
      </div>

      {/* Set Bonus Cards Grid or Rainbow Fallback */}
      {totalActiveSets === 0 ? (
        <div className="p-6 rounded-xl bg-slate-950/60 border border-white/5 text-center sm:text-left flex flex-col sm:flex-row items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-white/10 flex items-center justify-center text-slate-400 shrink-0">
            <Info className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-gray-300">
              No active set bonus (mixed artifacts)
            </h4>
            <p className="text-xs text-gray-400 leading-relaxed max-w-2xl">
              This character is currently equipped with mixed artifact pieces that do not trigger a 2-piece or 4-piece set bonus. Equip at least 2 pieces from the same artifact set to unlock combat set effects.
            </p>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "grid gap-4 relative z-10",
            totalActiveSets > 1 ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
          )}
        >
          {bonuses.map((bonus) => {
            const isFourPiece = bonus.fourPieceActive;
            const details = getArtifactSetDetails(bonus.setId, bonus.setName);
            const twoPieceSkill =
              bonus.twoPieceText || bonus.twoPiece || details?.twoPiece || 'Increases set stats.';
            const fourPieceSkill =
              bonus.fourPieceText || bonus.fourPiece || details?.fourPiece;
            const pieceCount = bonus.count ?? (isFourPiece ? 4 : 2);

            return (
              <div
                key={bonus.setId}
                className={cn(
                  "p-4 sm:p-5 rounded-xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between space-y-4",
                  isFourPiece
                    ? "bg-gradient-to-br from-amber-950/30 via-slate-900/90 to-amber-950/20 border-amber-500/40 ring-1 ring-inset ring-amber-400/20 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                    : "bg-gradient-to-br from-cyan-950/30 via-slate-900/90 to-sky-950/20 border-cyan-500/40 ring-1 ring-inset ring-cyan-400/20 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                )}
              >
                {/* Header: Set Name & Piece Count Badge */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h4 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                      {bonus.setName}
                    </h4>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {pieceCount} {pieceCount === 1 ? 'piece' : 'pieces'} equipped
                    </div>
                  </div>

                  <span
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold tracking-wide border flex items-center gap-1.5 shadow-md",
                      isFourPiece
                        ? "bg-gradient-to-r from-amber-500/25 to-yellow-500/25 text-amber-200 border-amber-400/60 shadow-[0_0_10px_rgba(251,191,36,0.3)]"
                        : "bg-cyan-500/20 text-cyan-200 border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.25)]"
                    )}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isFourPiece ? '4-Piece Set' : '2-Piece Set'}</span>
                  </span>
                </div>

                {/* Skill Descriptions */}
                <div className="space-y-3 pt-1">
                  {/* 2-Piece Description (Always active for active sets) */}
                  <div className="p-3.5 rounded-lg bg-slate-950/70 border border-cyan-500/25 space-y-1">
                    <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      2-Piece Bonus
                    </div>
                    <p className="text-xs text-gray-200 leading-relaxed pl-3 border-l-2 border-cyan-500/30">
                      {twoPieceSkill}
                    </p>
                  </div>

                  {/* 4-Piece Description */}
                  {fourPieceSkill && (
                    <div
                      className={cn(
                        "p-3.5 rounded-lg border space-y-1",
                        isFourPiece
                          ? "bg-amber-950/30 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.1)]"
                          : "bg-slate-950/40 border-white/5 opacity-60"
                      )}
                    >
                      <div
                        className={cn(
                          "text-xs font-bold flex items-center gap-1.5",
                          isFourPiece ? "text-amber-300" : "text-gray-400"
                        )}
                      >
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            isFourPiece
                              ? "bg-amber-400 shadow-[0_0_6px_#f59e0b]"
                              : "bg-gray-500"
                          )}
                        />
                        <span>
                          4-Piece Bonus{' '}
                          {!isFourPiece && (
                            <span className="text-[10px] text-gray-500 font-normal">
                              (Inactive — Requires 4 pieces)
                            </span>
                          )}
                        </span>
                      </div>
                      <p
                        className={cn(
                          "text-xs leading-relaxed pl-3 border-l-2",
                          isFourPiece
                            ? "text-amber-100/90 border-amber-500/40"
                            : "text-gray-400 border-gray-600"
                        )}
                      >
                        {fourPieceSkill}
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
  );
}

// ============================================================================
// Component 2: ArtifactPieceCard (Individual Artifact Card)
// ============================================================================

export interface ArtifactPieceCardProps {
  artifact: Artifact;
  className?: string;
}

export function ArtifactPieceCard({ artifact, className }: ArtifactPieceCardProps) {
  const slotKey = (artifact.slot || 'flower').toLowerCase();
  const slotConfig = ARTIFACT_SLOT_CONFIG[slotKey] || ARTIFACT_SLOT_CONFIG.flower;
  const SlotIcon = slotConfig.icon;
  const isCirclet = slotKey === 'circlet';

  // Compute piece Crit Value (CV = 2 * CR + CD from substats)
  const pieceCv = React.useMemo(() => {
    if (artifact.cv !== undefined) return artifact.cv;
    const crSub = artifact.subStats.find(
      (s) => s.key === 'cr' || s.key.toLowerCase() === 'crit_rate'
    );
    const cdSub = artifact.subStats.find(
      (s) => s.key === 'cd' || s.key.toLowerCase() === 'crit_dmg'
    );
    const crVal = crSub ? (crSub.value <= 1.0 && crSub.value > 0 ? crSub.value * 100 : crSub.value) : 0;
    const cdVal = cdSub ? (cdSub.value <= 1.0 && cdSub.value > 0 ? cdSub.value * 100 : cdSub.value) : 0;
    return calculateCritValue(crVal, cdVal);
  }, [artifact]);

  const qualityBadge: QualityBadge =
    artifact.qualityBadge || getQualityBadge(pieceCv, isCirclet);
  const badgeConfig = PIECE_CV_BADGE_CONFIG[qualityBadge] || PIECE_CV_BADGE_CONFIG.Subpar;

  // Calculate roll quality (assumes max possible rolls = 9 at +20)
  const maxPossibleRolls = artifact.level >= 20 ? 9 : Math.floor(artifact.level / 4) + 1;
  const actualRolls = artifact.subStats.reduce((sum, sub) => {
    const rolls = sub.rolls ?? estimateRollCount(sub.key, sub.value);
    return sum + (rolls || 1);
  }, 0);
  const rollQuality = Math.min(100, Math.max(0, (actualRolls / maxPossibleRolls) * 100));

  const getQualityColor = (quality: number) => {
    if (quality >= 80) return 'text-amber-400';
    if (quality >= 70) return 'text-purple-400';
    if (quality >= 50) return 'text-cyan-400';
    if (quality >= 30) return 'text-emerald-400';
    return 'text-gray-400';
  };

  const badgeTooltip = `${badgeConfig.label} Piece (${pieceCv.toFixed(1)} CV) — Threshold: ${
    isCirclet ? badgeConfig.thresholdCirclet : badgeConfig.thresholdStandard
  }. ${badgeConfig.description}`;

  const pieceName = artifact.name || artifact.setName || 'Artifact';

  return (
    <div
      className={cn(
        "glass rounded-xl p-4 sm:p-5 relative overflow-hidden bg-slate-900/85 backdrop-blur-xl border border-white/10 ring-1 ring-inset ring-white/5 shadow-lg hover:border-cyan-500/30 transition-all duration-300 flex flex-col justify-between group",
        className
      )}
    >
      {/* Specular Top Edge Light */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

      {/* Watermark Relic Icon */}
      {artifact.icon && (
        <img
          src={artifact.icon}
          alt={artifact.setName}
          className="absolute right-[-10px] top-[-10px] w-28 h-28 opacity-15 pointer-events-none object-contain select-none transition-transform group-hover:scale-110 duration-500"
        />
      )}

      {/* Header: Slot Info, Piece Name, Level & Rarity Stars */}
      <div className="relative z-10 mb-3">
        <div className="flex items-start justify-between gap-2">
          {/* Slot Icon & Names */}
          <div className="flex items-center gap-2 min-w-0">
            <div className={cn("p-1.5 rounded-lg border shrink-0", slotConfig.bg, slotConfig.border)}>
              <SlotIcon className={cn("w-4 h-4", slotConfig.text)} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-cyan-400">
                  {artifact.slot.toUpperCase()}
                </span>
                <span className="text-[11px] text-gray-400 font-medium hidden sm:inline">
                  • {slotConfig.name}
                </span>
              </div>
              <div
                className="text-sm font-bold text-white truncate max-w-[170px]"
                title={pieceName}
              >
                {pieceName}
              </div>
            </div>
          </div>

          {/* Level & Rarity Stars */}
          <div className="text-right shrink-0">
            <div className="text-sm font-black font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30 inline-block shadow-sm">
              {`+${artifact.level}`}
            </div>
            <div className="text-xs text-yellow-400 tracking-tighter mt-0.5 select-none drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]">
              {'★'.repeat(Math.max(1, Math.min(5, artifact.rarity || 5)))}
            </div>
          </div>
        </div>

        {/* Set Name & Piece CV Quality Badge Bar */}
        <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-white/10">
          <div
            className="text-xs text-amber-300/80 truncate font-medium max-w-[140px]"
            title={artifact.setName}
          >
            {artifact.setName}
          </div>
          <span
            className={cn(
              "text-[11px] px-2.5 py-0.5 rounded-full font-bold border transition-all cursor-help flex items-center gap-1 shrink-0",
              badgeConfig.badgeClass,
              badgeConfig.glowClass
            )}
            title={badgeTooltip}
          >
            {qualityBadge === 'Godly' && (
              <span className="text-[10px] text-amber-300 animate-pulse">✦</span>
            )}
            <span>
              {`${qualityBadge} (${pieceCv.toFixed(1)} CV)`}
            </span>
          </span>
        </div>
      </div>

      {/* Main Stat Panel */}
      <div className="relative z-10 mb-3 bg-white/[0.04] rounded-lg p-3 border border-white/10 shadow-inner">
        <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          Main Stat
        </div>
        <div className="flex justify-between items-center gap-2">
          <span className="text-sm font-semibold text-gray-200 truncate">
            {getStatName(artifact.mainStat.key)}
          </span>
          <span className="text-2xl font-black font-mono text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)] shrink-0">
            {formatStatValue(artifact.mainStat.key, artifact.mainStat.value)}
          </span>
        </div>
      </div>

      {/* Sub Stats List */}
      <div className="relative z-10 space-y-1.5 flex-1">
        <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">
          Sub Stats
        </div>
        {(artifact.subStats || []).map((subStat, index) => {
          const statName = getStatName(subStat.key);
          const pipData = formatRollPips(subStat);

          return (
            <div
              key={index}
              className="flex justify-between items-center text-xs py-1 px-2 rounded bg-black/20 hover:bg-white/[0.05] transition-colors"
            >
              <span
                className="text-gray-300 font-medium truncate max-w-[125px]"
                title={statName}
              >
                {statName}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono font-bold text-white">
                  +{formatStatValue(subStat.key, subStat.value)}
                </span>

                {/* Monospace Roll Analysis Pips */}
                <span
                  className={cn(
                    "text-[10px] font-mono tracking-widest px-1.5 py-0.5 rounded border select-none transition-all cursor-help tabular-nums min-w-[5.2rem] text-center inline-block",
                    pipData.pipBadgeClass
                  )}
                  title={pipData.tooltip}
                  aria-label={pipData.tooltip}
                >
                  {pipData.pipsText}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer: Roll Quality Indicator */}
      <div className="relative z-10 mt-3 pt-2.5 border-t border-white/10">
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-400 text-[11px] font-medium">Roll Quality</span>
          <span className={cn("font-mono font-bold text-xs", getQualityColor(rollQuality))}>
            {rollQuality.toFixed(0)}%
          </span>
        </div>
        <div className="mt-1.5 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              rollQuality >= 80
                ? "bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                : rollQuality >= 70
                ? "bg-gradient-to-r from-purple-500 to-pink-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]"
                : rollQuality >= 50
                ? "bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                : "bg-gradient-to-r from-emerald-500 to-teal-500"
            )}
            style={{ width: `${rollQuality}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Component 3: ArtifactsGrid (Master 5-Piece Canonical Grid Container)
// ============================================================================

export interface ArtifactsGridProps {
  artifacts: Artifact[];
  activeBonuses?: ActiveSetBonus[];
  artifactSets?: Record<number | string, number>;
  showBanner?: boolean;
  className?: string;
}

export function ArtifactsGrid({
  artifacts,
  activeBonuses,
  artifactSets,
  showBanner = false,
  className,
}: ArtifactsGridProps) {
  // Sort artifacts in canonical order: flower -> plume -> sands -> goblet -> circlet
  const sortedArtifacts = React.useMemo(() => {
    return [...artifacts].sort((a, b) => {
      const orderA = ARTIFACT_SLOT_ORDER[(a.slot || '').toLowerCase()] ?? 99;
      const orderB = ARTIFACT_SLOT_ORDER[(b.slot || '').toLowerCase()] ?? 99;
      return orderA - orderB;
    });
  }, [artifacts]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Integrated Banner if requested */}
      {showBanner && (
        <ActiveSetBonusesBanner
          activeBonuses={activeBonuses}
          artifacts={artifacts}
          artifactSets={artifactSets}
        />
      )}

      {/* 5-Piece Breakdown Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            5-Piece Artifact Breakdown
          </h3>
          <span className="text-xs text-gray-400 font-mono">
            {sortedArtifacts.length} / 5 Equipped
          </span>
        </div>

        {/* Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {sortedArtifacts.map((artifact) => (
            <ArtifactPieceCard
              key={artifact.id || `${artifact.slot}-${artifact.setId}`}
              artifact={artifact}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Default Polymorphic Export: ArtifactDisplay
// Compatible with both single artifact `{ artifact }` and grid `{ artifacts }`
// ============================================================================

export interface ArtifactDisplayProps {
  artifact?: Artifact;
  artifacts?: Artifact[];
  activeBonuses?: ActiveSetBonus[];
  artifactSets?: Record<number | string, number>;
  showBanner?: boolean;
  className?: string;
}

export default function ArtifactDisplay(props: ArtifactDisplayProps) {
  if (props.artifact) {
    return <ArtifactPieceCard artifact={props.artifact} className={props.className} />;
  }

  if (props.artifacts) {
    return (
      <ArtifactsGrid
        artifacts={props.artifacts}
        activeBonuses={props.activeBonuses}
        artifactSets={props.artifactSets}
        showBanner={props.showBanner ?? false}
        className={props.className}
      />
    );
  }

  return null;
}
