'use client';

import type { CharacterStats } from '@/lib/enka/types';
import { formatNumber, formatPercentage } from '@/lib/utils';
import { calculateCritValue } from '@/lib/enka/static-data';

interface StatsPanelProps {
  stats: CharacterStats;
  element: string;
}

export default function StatsPanel({ stats, element }: StatsPanelProps) {
  const critValue = calculateCritValue(stats.cr, stats.cd);

  // Get the primary damage bonus for this element
  const primaryDmgBonus = stats.dmgBonus[element.toLowerCase()] || 0;

  const statRows = [
    { label: 'HP', value: formatNumber(stats.hp), icon: '❤️' },
    { label: 'ATK', value: formatNumber(stats.atk), icon: '⚔️' },
    { label: 'DEF', value: formatNumber(stats.def), icon: '🛡️' },
    { label: 'Elemental Mastery', value: formatNumber(stats.em), icon: '✨' },
    { label: 'Energy Recharge', value: formatPercentage(stats.er, 1), icon: '⚡' },
    { label: 'CRIT Rate', value: formatPercentage(stats.cr, 1), icon: '🎯', highlight: true },
    { label: 'CRIT DMG', value: formatPercentage(stats.cd, 1), icon: '💥', highlight: true },
    { label: `${element} DMG Bonus`, value: formatPercentage(primaryDmgBonus, 1), icon: '🔥' },
  ];

  if (stats.healingBonus) {
    statRows.push({
      label: 'Healing Bonus',
      value: formatPercentage(stats.healingBonus, 1),
      icon: '💚',
    });
  }

  return (
    <div className="glass rounded-xl p-6">
      <h3 className="text-xl font-bold mb-4">Character Stats</h3>

      {/* Crit Value Highlight */}
      <div className="mb-6 p-4 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg border border-cyan-400/30">
        <div className="text-center">
          <div className="text-sm text-gray-300 mb-1">Crit Value</div>
          <div className="text-4xl font-bold text-cyan-400">
            {critValue.toFixed(1)}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            (CR × 2 + CD)
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="space-y-3">
        {statRows.map((stat) => (
          <div
            key={stat.label}
            className={`flex items-center justify-between py-2 px-3 rounded-lg ${
              stat.highlight ? 'bg-white/5' : ''
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{stat.icon}</span>
              <span className="text-sm text-gray-300">{stat.label}</span>
            </div>
            <span className={`font-bold ${stat.highlight ? 'text-cyan-400' : ''}`}>
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      {/* Additional DMG Bonuses */}
      {Object.entries(stats.dmgBonus).length > 1 && (
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="text-sm text-gray-400 mb-2">Other DMG Bonuses</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(stats.dmgBonus)
              .filter(([key]) => key !== element.toLowerCase())
              .map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-gray-400 capitalize">{key}</span>
                  <span>{formatPercentage(value, 1)}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
