'use client';

import { useState } from 'react';
import type { Character } from '@/lib/enka/types';
import { ELEMENT_COLORS } from '@/lib/enka/static-data';
import { formatNumber, formatPercentage } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import CharacterDetailModal from './CharacterDetailModal';
import { LiquidButton } from '@/components/ui/liquid-glass-button';

interface CharacterCardProps {
  character: Character & { damageCalc?: any };
  uid: string;
}

export default function CharacterCard({ character, uid }: CharacterCardProps) {
  const [showModal, setShowModal] = useState(false);
  const elementColor = ELEMENT_COLORS[character.element];

  return (
    <>
      <motion.div
        layout
        className="glass rounded-xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform"
        onClick={() => setShowModal(true)}
        style={{
          borderColor: elementColor.primary + '40',
        }}
      >
        {/* Header */}
        <div
          className="p-4 bg-gradient-to-br relative"
          style={{
            background: `linear-gradient(135deg, ${elementColor.primary}20, ${elementColor.secondary}10)`,
          }}
        >
          <div className="flex items-start justify-between relative z-10">
            <div className="flex-1 flex gap-3 items-center">
              <img src={character.icon} alt={character.name} className="w-12 h-12 rounded-full border-2 bg-black/20 shadow-lg shrink-0" style={{ borderColor: elementColor.primary }} />
              <div>
                <h3 className="text-xl font-bold mb-1">{character.name}</h3>
                <div className="flex items-center gap-2 text-sm flex-wrap">
                <span
                  className="px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: elementColor.primary + '30',
                    color: elementColor.primary,
                  }}
                >
                  {character.element}
                </span>
                <span className="text-gray-400">C{character.constellation}</span>
                <span className="text-gray-400">Lv.{character.level}</span>
              </div>
            </div>
            </div>

            <div className="text-right">
              <div className="text-sm text-gray-400">Damage</div>
              <div className="text-2xl font-bold text-cyan-400">
                {character.damageCalc ? formatNumber(character.damageCalc.totalDamage) : '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="p-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-gray-400 text-xs mb-1">ATK</div>
            <div className="font-semibold">{formatNumber(character.stats.atk)}</div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1">Crit Ratio</div>
            <div className="font-semibold">
              {formatPercentage(character.stats.cr, 1)} / {formatPercentage(character.stats.cd, 1)}
            </div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1">EM</div>
            <div className="font-semibold">{formatNumber(character.stats.em)}</div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1">ER</div>
            <div className="font-semibold">{formatPercentage(character.stats.er, 1)}</div>
          </div>
        </div>

        {/* Weapon */}
        <div className="px-4 pb-4 flex gap-3 items-center mt-2">
          <img src={character.weapon.icon} alt={character.weapon.name} className="w-10 h-10 rounded-md bg-black/20 p-1 object-contain shrink-0" />
          <div>
            <div className="text-xs text-gray-400 mb-1">Weapon</div>
            <div className="text-sm font-medium leading-tight">{character.weapon.name}</div>
            <div className="text-xs text-gray-500 mt-0.5">
              Lv.{character.weapon.level} R{character.weapon.refinement}
            </div>
          </div>
        </div>

        {/* Artifact Sets */}
        <div className="px-4 pb-4">
          <div className="text-xs text-gray-400 mb-1">Artifacts</div>
          {Object.entries(character.artifactSets).map(([setId, count]) => {
            const artifact = character.artifacts.find(a => a.setId === parseInt(setId));
            return (
              <div key={setId} className="text-sm">
                <span className="font-medium">{artifact?.setName || 'Unknown'}</span>
                <span className="text-gray-500 ml-1">({count}pc)</span>
              </div>
            );
          })}
        </div>

        {/* Talents */}
        <div className="px-4 pb-4 border-t border-white/10 pt-4">
          <div className="text-xs text-gray-400 mb-2">Talents</div>
          <div className="flex gap-3 text-sm">
            <div className="text-center">
              <div className="text-gray-500 text-xs">NA</div>
              <div className="font-bold">{character.talents.normal}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-500 text-xs">Skill</div>
              <div className="font-bold">{character.talents.skill}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-500 text-xs">Burst</div>
              <div className="font-bold">{character.talents.burst}</div>
            </div>
          </div>
        </div>

        {/* View Details Button */}
        <div className="px-4 pb-4">
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
