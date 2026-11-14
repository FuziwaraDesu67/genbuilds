'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { getCharacterData } from '@/lib/enka/static-data';
import { resolveWeaponName } from '@/lib/enka/weapon-data';
import { formatNumber, formatTopPercent } from '@/lib/utils';
import BorderGlow from '@/components/BorderGlow/BorderGlow';
import LatticeLoader from '@/components/LatticeLoader/LatticeLoader';
import type { LeaderboardRowItem } from '@/lib/akasha/leaderboards';

interface LeaderboardTableProps {
  entries: LeaderboardRowItem[];
  isLoading?: boolean;
}

export function LeaderboardTable({ entries, isLoading }: LeaderboardTableProps) {
  if (isLoading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center gap-3">
        <LatticeLoader
          label="Loading rankings"
          pattern="orbit"
          grid={4}
          shape="round"
          color="#22d3ee"
          cellSize={9}
          gap={4}
          glow={true}
          className="text-white/80"
        />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 rounded-xl bg-white/[0.02] border border-white/10">
        <p className="text-white/65 text-base font-medium">No builds found with the current filters</p>
        <p className="text-white/40 text-xs mt-1">
          Try lowering constellation filters or analyze a player showcase first.
        </p>
      </div>
    );
  }

  return (
    <div className="relative space-y-2.5">
      <AnimatePresence mode="popLayout">
        {entries.map((entry, index) => (
          <motion.div
            key={`${entry.build.uid}-${entry.build.avatarId}-${entry.rank}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{
              delay: Math.min(index * 0.02, 0.3),
              duration: 0.35,
              type: 'spring',
              stiffness: 300,
              damping: 22,
            }}
            layout
          >
            <LeaderboardRow entry={entry} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

const PODIUM_GLOW_MAP: Record<number, { hsl: string; colors: string[] }> = {
  1: { hsl: '45 93 58', colors: ['#facc15', '#f59e0b', '#fef08a'] },
  2: { hsl: '215 20 75', colors: ['#e2e8f0', '#94a3b8', '#cbd5e1'] },
  3: { hsl: '28 85 55', colors: ['#fb923c', '#ea580c', '#fdba74'] },
};

function LeaderboardRow({ entry }: { entry: LeaderboardRowItem }) {
  const { build, player, rank, percentile } = entry;
  const character = getCharacterData(build.avatarId);

  const damage = parseInt(build.calculatedDamage || '0');
  const critValue = (build.critValue ?? build.stats.cr * 2 + build.stats.cd).toFixed(1);

  const getRankColor = (r: number) => {
    if (r === 1) return 'from-yellow-400 to-amber-600';
    if (r === 2) return 'from-slate-300 to-slate-500';
    if (r === 3) return 'from-orange-400 to-orange-600';
    return 'from-white/10 to-white/5';
  };

  const charIconSrc =
    character?.iconUrl || `/icons/characters/${build.avatarId}.png`;

  const rowContent = (
    <div className="flex flex-wrap md:flex-nowrap items-center gap-4">
      {/* Rank */}
      <div
        className={`flex-shrink-0 w-14 h-14 rounded-lg bg-gradient-to-br ${getRankColor(
          rank
        )} flex items-center justify-center shadow-inner`}
      >
        <span className={`text-xl font-bold ${rank <= 3 ? 'text-white' : 'text-white/90'}`}>
          #{rank}
        </span>
      </div>

      {/* Character Icon + Constellation */}
      <div className="flex-shrink-0 w-12 h-12 relative">
        <div className="w-full h-full rounded-full bg-white/10 overflow-hidden border border-white/25">
          <img
            src={charIconSrc}
            alt={character?.name || `Character ${build.avatarId}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              const cleanName = (character?.name || '').replace(/\s+/g, '');
              if (cleanName && !target.src.includes('enka.network')) {
                target.src = `https://enka.network/ui/UI_AvatarIcon_${cleanName}.png`;
              } else {
                target.style.display = 'none';
              }
            }}
          />
        </div>
        <div className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded-full bg-zinc-900 border border-white/25 text-[10px] font-bold text-amber-300">
          C{build.constellation}
        </div>
      </div>

      {/* Player Info */}
      <div className="flex-1 min-w-[160px]">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-base font-semibold text-white truncate group-hover:text-cyan-200 transition-colors">
            {player.nickname}
          </h3>
          {player.region && (
            <span className="px-1.5 py-0.2 rounded bg-amber-400/90 text-slate-950 text-[10px] font-bold uppercase">
              {player.region}
            </span>
          )}
          <span className="text-xs font-mono text-white/40">UID: {build.uid}</span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-white/60">
          <span>AR {player.ar}</span>
          <span>•</span>
          <span className="text-emerald-400 font-semibold">
            Top {formatTopPercent(percentile)}
          </span>
        </div>
      </div>

      {/* Weapon + Artifact Sets */}
      <div className="hidden lg:flex items-center gap-3 shrink-0">
        {build.weaponIcon && (
          <div className="flex items-center gap-2 bg-black/35 border border-white/10 rounded-lg px-2 py-1">
            <img
              src={build.weaponIcon}
              alt={resolveWeaponName(build.weaponId, build.weaponName)}
              className="w-7 h-7 object-contain"
            />
            <div className="text-xs">
              <div className="text-zinc-200 font-medium max-w-[140px] truncate">
                {resolveWeaponName(build.weaponId, build.weaponName)}
              </div>
              <div className="text-[10px] font-bold text-amber-300">
                R{build.refinement || 1}
              </div>
            </div>
          </div>
        )}

        {build.artifactSetList && build.artifactSetList.length > 0 && (
          <div className="flex items-center gap-1">
            {build.artifactSetList.slice(0, 2).map((s) => (
              <div
                key={s.name}
                className="relative w-8 h-8 rounded-md bg-black/45 border border-white/10 p-0.5"
                title={`${s.name} (${s.count}pc)`}
              >
                <img src={s.icon} alt={s.name} className="w-full h-full object-contain" />
                <span className="absolute -bottom-1 -right-1 px-1 rounded bg-zinc-900 border border-white/20 text-[9px] font-bold text-emerald-300">
                  {s.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Build Stats */}
      <div className="hidden sm:flex items-center gap-5 text-xs font-mono shrink-0">
        <div className="text-center min-w-[110px]">
          <div className="text-white/40 text-[10px] mb-0.5 font-sans">CRIT / CV</div>
          <div className="text-white font-semibold">
            {build.stats.cr.toFixed(1)}% / {build.stats.cd.toFixed(1)}%
          </div>
          <div className="text-amber-300 text-[11px] font-bold">{critValue} CV</div>
        </div>
        <div className="text-center min-w-[54px]">
          <div className="text-white/40 text-[10px] mb-0.5 font-sans">ATK</div>
          <div className="text-white font-semibold">{formatNumber(build.stats.atk)}</div>
        </div>
        <div className="text-center min-w-[54px]">
          <div className="text-white/40 text-[10px] mb-0.5 font-sans">ER</div>
          <div className="text-white font-semibold">{build.stats.er.toFixed(1)}%</div>
        </div>
      </div>

      {/* Damage */}
      <div className="flex-shrink-0 text-right min-w-[100px]">
        <div className="text-xl font-bold bg-gradient-to-r from-cyan-300 to-purple-400 bg-clip-text text-transparent font-mono">
          {damage.toLocaleString('en-US')}
        </div>
        <div className="text-[10px] text-white/45 mt-0.5 uppercase tracking-wider">Combo DMG</div>
      </div>
    </div>
  );

  const podiumGlow = PODIUM_GLOW_MAP[rank];

  return (
    <a href={`/u/${build.uid}`} className="block group">
      {podiumGlow ? (
        <BorderGlow
          glowColor={podiumGlow.hsl}
          colors={podiumGlow.colors}
          backgroundColor="rgba(17, 24, 39, 0.84)"
          borderRadius={12}
          glowRadius={24}
          glowIntensity={rank === 1 ? 1.15 : 0.9}
          fillOpacity={0.32}
          animated={rank === 1}
          overflowVisible={true}
          className="w-full"
        >
          <div className="p-3.5 sm:p-4 rounded-[12px] transition-colors group-hover:bg-white/[0.04]">
            {rowContent}
          </div>
        </BorderGlow>
      ) : (
        <div className="bg-white/[0.04] hover:bg-white/[0.08] backdrop-blur-sm rounded-xl p-3.5 sm:p-4 transition-all border border-white/10 hover:border-white/25">
          {rowContent}
        </div>
      )}
    </a>
  );
}
