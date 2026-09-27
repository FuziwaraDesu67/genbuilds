'use client';

import type { Artifact } from '@/lib/enka/types';
import { formatPercentage } from '@/lib/utils';

interface ArtifactDisplayProps {
  artifact: Artifact;
}

export default function ArtifactDisplay({ artifact }: ArtifactDisplayProps) {
  // Calculate roll quality (simplified - assumes max rolls)
  const maxPossibleRolls = artifact.level >= 20 ? 9 : Math.floor(artifact.level / 4) + 1;
  const actualRolls = artifact.subStats.reduce((sum, sub) => sum + (sub.rolls || 0), 0);
  const rollQuality = (actualRolls / maxPossibleRolls) * 100;

  const getQualityColor = (quality: number) => {
    if (quality >= 75) return 'text-purple-400';
    if (quality >= 50) return 'text-blue-400';
    if (quality >= 25) return 'text-green-400';
    return 'text-gray-400';
  };

  const getStatDisplay = (key: string, value: number) => {
    const isPercentage = ['cr', 'cd', 'er', 'hpPercent', 'atkPercent', 'defPercent'].includes(key) || key.includes('DmgBonus');

    if (isPercentage) {
      return formatPercentage(value * 100, 1);
    }
    return value.toFixed(0);
  };

  const getStatName = (key: string) => {
    const names: Record<string, string> = {
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
    };
    return names[key] || key;
  };

  return (
    <div className="glass rounded-lg p-4 relative overflow-hidden">
      <img src={artifact.icon} alt={artifact.setName} className="absolute right-[-10px] top-[-10px] w-24 h-24 opacity-20 pointer-events-none object-contain" />
      {/* Header */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div>
          <div className="text-sm font-semibold">{artifact.slot.toUpperCase()}</div>
          <div className="text-xs text-gray-400">{artifact.setName}</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold">+{artifact.level}</div>
          <div className="text-xs text-yellow-400">
            {'★'.repeat(artifact.rarity)}
          </div>
        </div>
      </div>

      {/* Main Stat */}
      <div className="mb-3 pb-3 border-b border-white/10">
        <div className="text-xs text-gray-400 mb-1">Main Stat</div>
        <div className="flex justify-between items-center">
          <span className="text-sm">{getStatName(artifact.mainStat.key)}</span>
          <span className="font-bold text-cyan-400">
            {getStatDisplay(artifact.mainStat.key, artifact.mainStat.value)}
          </span>
        </div>
      </div>

      {/* Sub Stats */}
      <div className="space-y-2">
        <div className="text-xs text-gray-400">Sub Stats</div>
        {artifact.subStats.map((subStat, index) => (
          <div key={index} className="flex justify-between items-center text-sm">
            <span className="text-gray-300">{getStatName(subStat.key)}</span>
            <div className="flex items-center gap-2">
              <span>{getStatDisplay(subStat.key, subStat.value)}</span>
              {subStat.rolls && subStat.rolls > 0 && (
                <span className="text-xs text-gray-500">
                  ({subStat.rolls}↑)
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Roll Quality Indicator */}
      <div className="mt-3 pt-3 border-t border-white/10">
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-400">Roll Quality</span>
          <span className={getQualityColor(rollQuality)}>
            {rollQuality.toFixed(0)}%
          </span>
        </div>
        <div className="mt-1 h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
            style={{ width: `${rollQuality}%` }}
          />
        </div>
      </div>
    </div>
  );
}
