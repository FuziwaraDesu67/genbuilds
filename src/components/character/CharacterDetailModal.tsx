'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Character } from '@/lib/enka/types';
import { ELEMENT_COLORS } from '@/lib/enka/static-data';
import { formatNumber } from '@/lib/utils';
import StatsPanel from './StatsPanel';
import ArtifactDisplay from './ArtifactDisplay';
import * as htmlToImage from 'html-to-image';
import { LiquidButton } from '@/components/ui/liquid-glass-button';

interface CharacterDetailModalProps {
  character: Character & { damageCalc?: any };
  onClose: () => void;
}

export default function CharacterDetailModal({ character, onClose }: CharacterDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'stats' | 'artifacts' | 'damage'>('stats');
  const [isExporting, setIsExporting] = useState(false);
  const elementColor = ELEMENT_COLORS[character.element];

  const handleExportBuild = async () => {
    setIsExporting(true);
    try {
      const modalElement = document.querySelector('.glass-darker.rounded-2xl') as HTMLElement;
      if (!modalElement) throw new Error('Modal element not found');

      const dataUrl = await htmlToImage.toPng(modalElement, {
        width: modalElement.scrollWidth,
        height: modalElement.scrollHeight,
        style: {
          backgroundColor: '#fff',
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-darker rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="p-6 border-b border-white/10 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${elementColor.primary}15, ${elementColor.secondary}05)`,
          }}
        >
          <img src={character.icon.replace('.png', '_gacha.png')} alt={character.name} className="absolute -right-20 top-1/2 -translate-y-1/2 h-full scale-[2] opacity-30 object-contain pointer-events-none" style={{ WebkitMaskImage: 'linear-gradient(to right, transparent 20%, black)' }} />
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-5">
              <img src={character.icon} alt={character.name} className="w-20 h-20 rounded-full border-4 bg-black/40 shadow-xl shrink-0" style={{ borderColor: elementColor.primary }} />
              <div>
                <h2 className="text-3xl font-bold mb-2">{character.name}</h2>
                <div className="flex items-center gap-3 text-sm">
                <span
                  className="px-3 py-1 rounded-full font-medium"
                  style={{
                    backgroundColor: elementColor.primary + '30',
                    color: elementColor.primary,
                  }}
                >
                  {character.element}
                </span>
                <span className="text-gray-400">Level {character.level}</span>
                <span className="text-gray-400">C{character.constellation}</span>
                <span className="text-gray-400">
                  Friendship {character.friendshipLevel}
                </span>
              </div>
            </div>
            </div>
            <div className="flex items-center gap-2">
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
                className="text-gray-400 hover:text-white transition-colors text-2xl"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {(['stats', 'artifacts', 'damage'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 text-sm font-medium transition-colors relative ${
                activeTab === tab
                  ? 'text-cyan-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400"
                />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'stats' && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
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
                {/* Weapon */}
                <div className="glass rounded-xl p-6 relative overflow-hidden">
                  <img src={character.weapon.icon} alt={character.weapon.name} className="absolute -right-4 top-1/2 -translate-y-1/2 w-40 h-40 opacity-10 pointer-events-none object-contain" />
                  <h3 className="text-xl font-bold mb-4 relative z-10">Weapon</h3>
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                      <img src={character.weapon.icon} alt={character.weapon.name} className="w-16 h-16 rounded-lg bg-black/30 p-2 object-contain shadow-lg" />
                      <div>
                        <div className="font-semibold text-lg">{character.weapon.name}</div>
                        <div className="text-sm text-gray-400 mt-1">
                          Level {character.weapon.level} • R{character.weapon.refinement}
                        </div>
                        {character.weapon.subStat && (
                          <div className="text-sm text-cyan-400 mt-1 font-medium">
                            {character.weapon.subStat.key}: {character.weapon.subStat.value.toFixed(1)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Base ATK</div>
                      <div className="text-3xl font-bold">{character.weapon.baseAtk}</div>
                    </div>
                  </div>
                </div>

                {/* Artifacts */}
                <div>
                  <h3 className="text-xl font-bold mb-4">Artifacts</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {character.artifacts.map((artifact) => (
                      <ArtifactDisplay key={artifact.id} artifact={artifact} />
                    ))}
                  </div>
                </div>
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
                    <div className="glass rounded-xl p-8 text-center">
                      <div className="text-sm text-gray-400 mb-2">Estimated Damage</div>
                      <div className="text-5xl font-bold text-cyan-400 mb-4">
                        {formatNumber(character.damageCalc.totalDamage)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Against Lv90 enemy with 10% base RES
                      </div>
                    </div>

                    {/* Rotation */}
                    {character.damageCalc.rotation && character.damageCalc.rotation.length > 0 && (
                      <div className="glass rounded-xl p-6">
                        <h3 className="text-lg font-bold mb-3">Rotation</h3>
                        <ul className="space-y-2">
                          {character.damageCalc.rotation.map((step: string, index: number) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <span className="text-cyan-400 font-mono">{index + 1}.</span>
                              <span className="text-gray-300">{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Breakdown */}
                    <div className="glass rounded-xl p-6">
                      <h3 className="text-lg font-bold mb-3">Damage Breakdown</h3>
                      <div className="space-y-3">
                        {character.damageCalc.breakdown.map((step: any, index: number) => (
                          <div key={index} className="pb-3 border-b border-white/10 last:border-0">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium">{step.step}</span>
                              <span className="font-bold text-cyan-400">
                                {formatNumber(step.value)}
                              </span>
                            </div>
                            <div className="text-xs text-gray-400">{step.formula}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="glass-darker rounded-xl p-12 text-center">
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
