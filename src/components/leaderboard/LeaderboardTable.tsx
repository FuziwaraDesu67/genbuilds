'use client';

import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { getCharacterData } from '@/lib/enka/static-data';
import Image from 'next/image';

interface LeaderboardEntry {
  build: {
    id: number;
    uid: string;
    avatarId: number;
    weaponId: number;
    constellation: number;
    calculatedDamage: string;
    stats: {
      hp: number;
      atk: number;
      def: number;
      cr: number;
      cd: number;
      em: number;
      er: number;
      dmgBonus: Record<string, number>;
    };
    artifactSets: Record<string, number>;
  };
  player: {
    uid: string;
    nickname: string;
    ar: number;
  };
  rank: number;
  percentile: number;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  isLoading?: boolean;
}

export function LeaderboardTable({ entries, isLoading }: LeaderboardTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`skeleton-${i}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05, duration: 0.8 }}
            className="h-20 bg-white/5 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-white/60 text-lg">No builds found with the current filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {entries.map((entry, index) => (
          <motion.div
            key={`${entry.build.uid}-${entry.build.avatarId}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              delay: index * 0.03,
              duration: 0.4,
              type: 'spring',
              stiffness: 300,
              damping: 20
            }}
            layout
            layoutId={`leaderboard-row-${entry.build.uid}-${entry.build.avatarId}`}
          >
            <LeaderboardRow entry={entry} index={index} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function LeaderboardRow({ entry, index }: { entry: LeaderboardEntry; index: number }) {
  const { build, player, rank, percentile } = entry;
  const character = getCharacterData(build.avatarId);

  // Format damage with commas
  const damage = parseInt(build.calculatedDamage || '0');
  const damageValue = damage;

  // Calculate crit value
  const critValue = (build.stats.cr * 2 + build.stats.cd).toFixed(1);

  // Get rank badge color
  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-400 to-yellow-600';
    if (rank === 2) return 'from-gray-300 to-gray-400';
    if (rank === 3) return 'from-orange-400 to-orange-600';
    return 'from-purple-400/20 to-purple-600/20';
  };

  const getRankTextColor = (rank: number) => {
    if (rank <= 3) return 'text-white';
    return 'text-white/90';
  };

  return (
    <a
      href={`/u/${build.uid}`}
      className="block group"
    >
      <div className="bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-lg p-4 transition-all border border-white/10 hover:border-white/20">
        <div className="flex items-center gap-4">
          {/* Rank */}
          <div className={`flex-shrink-0 w-16 h-16 rounded-lg bg-gradient-to-br ${getRankColor(rank)} flex items-center justify-center`}>
            <span className={`text-2xl font-bold ${getRankTextColor(rank)}`}>
              #{rank}
            </span>
          </div>

          {/* Character Icon */}
          <div className="flex-shrink-0 w-16 h-16 relative">
            <div className="w-full h-full rounded-full bg-white/10 overflow-hidden border-2 border-white/20">
              {character?.iconUrl && (
                <Image
                  src={character.iconUrl}
                  alt={character.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            {/* Constellation Badge */}
            {build.constellation > 0 && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-xs font-bold text-white border-2 border-gray-900">
                C{build.constellation}
              </div>
            )}
          </div>

          {/* Player Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <h3 className="text-lg font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
                {player.nickname}
              </h3>
              <span className="text-sm text-white/40">UID: {build.uid}</span>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-white/60">
              <span>AR {player.ar}</span>
              <span>•</span>
              <span>Top {percentile.toFixed(1)}%</span>
            </div>
          </div>

          {/* Stats */}
          <div className="hidden md:flex items-center gap-6 text-sm">
            <div className="text-center">
              <div className="text-white/40 text-xs mb-1">CRIT</div>
              <div className="text-white font-medium">
                {build.stats.cr.toFixed(1)}% / {build.stats.cd.toFixed(1)}%
              </div>
              <div className="text-white/40 text-xs">CV: {critValue}</div>
            </div>
            <div className="text-center">
              <div className="text-white/40 text-xs mb-1">ATK</div>
              <div className="text-white font-medium">{Math.round(build.stats.atk)}</div>
            </div>
            <div className="text-center">
              <div className="text-white/40 text-xs mb-1">ER</div>
              <div className="text-white font-medium">{build.stats.er.toFixed(1)}%</div>
            </div>
          </div>

          {/* Damage */}
          <div className="flex-shrink-0 text-right">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: index * 0.02 }}
              className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
            >
              {damage.toLocaleString()}
            </motion.div>
            <div className="text-xs text-white/40 mt-1">DMG</div>
          </div>
        </div>
      </div>
    </a>
  );
}
