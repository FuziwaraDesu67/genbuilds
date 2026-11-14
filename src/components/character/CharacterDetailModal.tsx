'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Character, QualityBadge, ActiveSetBonus } from '@/lib/enka/types';
import { ELEMENT_COLORS, getBuildCVTier, getActiveArtifactSetBonuses, calculateCritValue } from '@/lib/enka/static-data';
import { getWeaponPassive, resolveWeaponName } from '@/lib/enka/weapon-data';
import { formatNumber, formatPercentage, cn } from '@/lib/utils';
import StatsPanel from './StatsPanel';
import ArtifactDisplay, { ActiveSetBonusesBanner, ArtifactsGrid } from './ArtifactDisplay';
import * as htmlToImage from 'html-to-image';
import { LiquidButton } from '@/components/ui/liquid-glass-button';
import { ElementIcon } from '@/components/ui/element-icons';
import { Sparkles, Swords, Info } from 'lucide-react';

interface CharacterDetailModalProps {
  character: Character & { damageCalc?: any };
  onClose: () => void;
}

// Substat formatter helper for weapon
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

export default function CharacterDetailModal({ character, onClose }: CharacterDetailModalProps) {
  const [activeTab, setActiveTab] = React.useState<'stats' | 'artifacts' | 'damage'>('stats');
  const [isExporting, setIsExporting] = React.useState(false);
  const elementColor = ELEMENT_COLORS[character.element] || ELEMENT_COLORS.Pyro;

  // Total Build CV & Tier
  const totalCv = character.totalCv !== undefined
    ? character.totalCv
    : parseFloat(
        (character.artifacts || []).reduce((sum, a) => sum + (a.cv || 0), 0).toFixed(1)
      );
  const buildTier: QualityBadge = character.qualityBadge || getBuildCVTier(totalCv);

  // Weapon details & passive
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

  const handleExportBuild = async () => {
    setIsExporting(true);
    try {
      const modalElement = document.querySelector('.modal-export-target') as HTMLElement;
      if (!modalElement) throw new Error('Modal element not found');

      const dataUrl = await htmlToImage.toPng(modalElement, {
        width: modalElement.scrollWidth,
        height: modalElement.scrollHeight,
        style: {
          backgroundColor: '#090d16',
          transform: 'scale(1)',
        },
      });

      const link = document.createElement('a');
      link.download = `${character.name}-build.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to export build:', error);
      alert('Failed to export build. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="modal-export-target rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-slate-900/95 backdrop-blur-2xl border border-white/10 ring-1 ring-inset ring-white/5 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: `0 20px 50px -10px rgba(0, 0, 0, 0.8), 0 0 25px -5px ${elementColor.primary}30`,
        }}
      >
        {/* Specular Top Edge Light */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent z-20 pointer-events-none rounded-t-2xl" />

        {/* Modal Header */}
        <div
          className="p-6 border-b border-white/10 relative overflow-hidden rounded-t-2xl"
          style={{
            background: `linear-gradient(135deg, ${elementColor.primary}25, ${elementColor.secondary}08)`,
          }}
        >
          <img
            src={character.icon.replace('.png', '_gacha.png')}
            alt={character.name}
            className="absolute -right-20 top-1/2 -translate-y-1/2 h-full scale-[2] opacity-25 object-contain pointer-events-none"
            style={{ WebkitMaskImage: 'linear-gradient(to right, transparent 20%, black)' }}
          />
          <div className="flex items-start justify-between relative z-10 gap-4">
            <div className="flex items-center gap-5">
              {/* Avatar Frame with Elemental Halo */}
              <div className="relative shrink-0">
                <div
                  className="absolute -inset-1.5 rounded-full blur-md opacity-60"
                  style={{ backgroundColor: elementColor.primary }}
                />
                <div
                  className="relative w-20 h-20 rounded-full p-[3px]"
                  style={{
                    background: `linear-gradient(135deg, ${elementColor.primary}, ${elementColor.secondary} 70%, rgba(255,255,255,0.4))`,
                    boxShadow: `0 0 20px ${elementColor.primary}60`,
                  }}
                >
                  <div className="w-full h-full rounded-full overflow-hidden bg-slate-950/90 border border-white/20">
                    <img
                      src={character.icon}
                      alt={character.name}
                      className="w-full h-full object-cover object-center"
                    />
                  </div>
                </div>

                {/* Anchored Element Icon */}
                <div
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center p-1.5 border shadow-lg"
                  style={{
                    backgroundColor: '#090d16',
                    borderColor: elementColor.primary,
                    boxShadow: `0 0 10px ${elementColor.primary}90`,
                    color: elementColor.primary,
                  }}
                  title={character.element}
                >
                  <ElementIcon element={character.element} size={16} className="w-4 h-4" />
                </div>
              </div>

              {/* Character Identity */}
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-3xl font-bold text-white tracking-tight">{character.name}</h2>
                  <div
                    className="text-sm tracking-wider"
                    style={{ color: character.rarity === 5 ? '#FBBF24' : '#C084FC' }}
                  >
                    {character.rarity === 5 ? '★★★★★' : '★★★★'}
                  </div>
                </div>
                <div className="flex items-center gap-2.5 text-xs flex-wrap mt-2">
                  <span
                    className="px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 border"
                    style={{
                      backgroundColor: elementColor.primary + '25',
                      borderColor: elementColor.primary + '50',
                      color: elementColor.primary,
                    }}
                  >
                    <ElementIcon element={character.element} size={12} className="w-3 h-3" />
                    {character.element}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full font-semibold bg-white/10 text-gray-200 border border-white/10">
                    Lv.{character.level}
                  </span>
                  <span
                    className="px-2.5 py-0.5 rounded-full font-bold border"
                    style={{
                      backgroundColor: character.constellation > 0 ? elementColor.primary + '25' : 'rgba(255,255,255,0.08)',
                      borderColor: character.constellation > 0 ? elementColor.primary + '60' : 'rgba(255,255,255,0.15)',
                      color: character.constellation > 0 ? elementColor.primary : '#94a3b8',
                    }}
                  >
                    C{character.constellation}
                  </span>
                  {character.friendshipLevel > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full font-medium bg-pink-500/10 text-pink-300 border border-pink-500/25 flex items-center gap-1">
                      <span className="text-[10px] text-pink-400">❤</span> {character.friendshipLevel}
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-full font-mono font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-400/30">
                    {totalCv.toFixed(1)} CV ({buildTier})
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <LiquidButton
                onClick={handleExportBuild}
                disabled={isExporting}
                variant="default"
                size="sm"
                className="text-white"
              >
                {isExporting ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 animate-spin mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-14.736 0m14.736 0a8.003 8.003 0 00-4.71 4.043m0 0A8.001 8.001 0 0112 20a8.001 8.001 0 015.736-2.957m0 0a8.003 8.003 0 004.71-4.042z" />
                    </svg>
                    Exporting...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Export Build
                  </>
                )}
              </LiquidButton>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 bg-slate-950/40">
          {(['stats', 'artifacts', 'damage'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-3.5 text-sm font-semibold transition-colors relative tracking-wide",
                activeTab === tab
                  ? "text-cyan-400"
                  : "text-gray-400 hover:text-gray-200"
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTabModal"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 via-sky-400 to-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'stats' && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Build CV & Crit Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">
                        Total Build Crit Value
                      </div>
                      <div className="text-3xl font-bold font-mono text-cyan-400">
                        {totalCv.toFixed(1)} <span className="text-sm font-sans text-gray-400">CV</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 rounded-full text-xs font-bold border bg-cyan-500/15 border-cyan-400/40 text-cyan-300">
                        {buildTier} Tier
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/60 border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">
                        Crit Ratio (CR : CD)
                      </div>
                      <div className="text-xl font-bold font-mono text-white">
                        {formatPercentage(character.stats.cr, 1)} / {formatPercentage(character.stats.cd, 1)}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-white/10 border border-white/15 text-gray-200">
                        1:{(character.stats.cd / Math.max(0.1, character.stats.cr)).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>

                <StatsPanel stats={character.stats} element={character.element} />
              </motion.div>
            )}

            {activeTab === 'artifacts' && (
              <motion.div
                key="artifacts"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Active Set Bonuses Banner */}
                <ActiveSetBonusesBanner
                  activeBonuses={activeBonuses}
                  artifacts={character.artifacts}
                  artifactSets={character.artifactSets}
                />

                {/* Refined Weapon Section */}
                <div className="rounded-xl p-5 bg-black/40 border border-white/10 relative overflow-hidden">
                  <img
                    src={character.weapon.icon}
                    alt={character.weapon.name}
                    className="absolute -right-4 top-1/2 -translate-y-1/2 w-40 h-40 opacity-10 pointer-events-none object-contain"
                  />
                  <div className="flex items-center justify-between relative z-10 mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
                      <Swords className="w-4 h-4 text-amber-400" />
                      Weapon
                    </h3>
                    <div
                      className={cn(
                        "px-2.5 py-0.5 text-xs font-black rounded-md tracking-wider flex items-center gap-1 shadow-sm border",
                        character.weapon.refinement === 5
                          ? "bg-gradient-to-r from-amber-500/30 via-yellow-400/40 to-amber-500/30 text-amber-200 border-amber-400/60 shadow-[0_0_10px_rgba(251,191,36,0.35)]"
                          : "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border-amber-400/40"
                      )}
                    >
                      <span className="text-[10px] text-amber-400">✦</span>
                      <span>R{character.weapon.refinement}</span>
                    </div>
                  </div>

                  <div className="flex items-start justify-between relative z-10 gap-4 flex-wrap">
                    <div className="flex items-center gap-4 min-w-0">
                      <img
                        src={character.weapon.icon}
                        alt={weaponName}
                        className="w-16 h-16 rounded-xl bg-black/40 border border-white/15 p-2 object-contain shadow-lg shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-lg text-white truncate">{weaponName}</div>
                        <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                          <span className="font-medium text-gray-300">Level {character.weapon.level}</span>
                          <span>•</span>
                          <span className="text-amber-400 font-bold">R{character.weapon.refinement}</span>
                        </div>
                        {weaponSubStat && (
                          <div className="text-xs text-cyan-300 mt-1.5 font-medium flex items-center gap-1.5">
                            <span className="text-cyan-400/80">{weaponSubStat.label}:</span>
                            <span className="font-bold font-mono text-cyan-200">{weaponSubStat.formattedValue}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-400">Base ATK</div>
                      <div className="text-3xl font-bold text-white font-mono">{character.weapon.baseAtk}</div>
                    </div>
                  </div>

                  {/* Passive Description */}
                  {passiveName && passiveDescription && (
                    <div className="mt-4 pt-3 border-t border-white/10 relative z-10">
                      <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5 mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        {passiveName}
                      </div>
                      <p className="text-gray-300 text-xs leading-relaxed">
                        {passiveDescription}
                      </p>
                    </div>
                  )}
                </div>

                {/* 5-Piece Artifact Breakdown */}
                <ArtifactsGrid
                  artifacts={character.artifacts}
                  showBanner={false}
                />
              </motion.div>
            )}

            {activeTab === 'damage' && (
              <motion.div
                key="damage"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {character.damageCalc ? (
                  <div className="space-y-6">
                    {/* Total Damage */}
                    <div className="rounded-xl p-8 text-center bg-black/40 border border-white/10">
                      <div className="text-sm text-gray-400 mb-2 font-medium">Estimated Damage</div>
                      <div className="text-5xl font-bold text-cyan-400 mb-4 drop-shadow-[0_0_12px_rgba(34,211,238,0.5)]">
                        {formatNumber(character.damageCalc.totalDamage)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Against Lv90 enemy with 10% base RES
                      </div>
                    </div>

                    {/* Rotation */}
                    {character.damageCalc.rotation && character.damageCalc.rotation.length > 0 && (
                      <div className="rounded-xl p-6 bg-black/40 border border-white/10">
                        <h3 className="text-lg font-bold mb-3 text-white">Rotation</h3>
                        <ul className="space-y-2">
                          {character.damageCalc.rotation.map((step: string, index: number) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <span className="text-cyan-400 font-mono font-bold">{index + 1}.</span>
                              <span className="text-gray-300">{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Breakdown */}
                    <div className="rounded-xl p-6 bg-black/40 border border-white/10">
                      <h3 className="text-lg font-bold mb-3 text-white">Damage Breakdown</h3>
                      <div className="space-y-3">
                        {character.damageCalc.breakdown.map((step: any, index: number) => (
                          <div key={index} className="pb-3 border-b border-white/10 last:border-0">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium text-gray-200">{step.step}</span>
                              <span className="font-bold text-cyan-400 font-mono">
                                {formatNumber(step.value)}
                              </span>
                            </div>
                            <div className="text-xs text-gray-400 font-mono">{step.formula}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl p-12 text-center bg-black/40 border border-white/10">
                    <p className="text-gray-400">
                      Damage calculation not available for this character yet.
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
