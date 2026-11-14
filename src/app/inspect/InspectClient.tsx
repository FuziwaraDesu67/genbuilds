'use client';

import { Fragment, useMemo, useState } from 'react';
import Link from 'next/link';
import { ELEMENT_COLORS } from '@/lib/enka/static-data';
import { ElementIcon } from '@/components/ui/element-icons';
import type { Element } from '@/lib/enka/types';
import { Search, AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, ArrowLeft } from 'lucide-react';

export interface InspectCharacterItem {
  id: number;
  name: string;
  registeredInGameData: boolean;
  element: Element | 'Unknown';
  rarity: number;
  weaponType: string;
  nameTextMapHash: number | null;
  sideIconName: string | null;
  iconPath: string | null;
  gachaPath: string | null;
  skillOrder: number[];
  consts: string[];
  assets: {
    icon: boolean;
    gacha: boolean;
    skill: boolean;
    burst: boolean;
    constIcons: number;
  };
  metadata: {
    constLoreCount: number;
    c3Boost: string | null;
    c5Boost: string | null;
    hasDamageConfig: boolean;
  };
  issues: string[];
}

export interface InspectWeaponItem {
  id: number;
  aliasIds: number[];
  name: string;
  type: 'Sword' | 'Claymore' | 'Polearm' | 'Catalyst' | 'Bow';
  rarity: 3 | 4 | 5;
  baseAtkLv90: number | null;
  subStatLabel: string | null;
  subStatValueLv90: number | null;
  passiveName: string;
  refinements: Array<{ rank: number; text: string }>;
  issues: string[];
}

interface InspectClientProps {
  characters: InspectCharacterItem[];
  weapons: InspectWeaponItem[];
}

const ELEMENTS: Array<'All' | Element> = [
  'All',
  'Pyro',
  'Hydro',
  'Electro',
  'Cryo',
  'Dendro',
  'Anemo',
  'Geo',
];

const WEAPON_TYPES = ['All', 'Sword', 'Claymore', 'Polearm', 'Catalyst', 'Bow'] as const;

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono border ${
        ok
          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
          : 'bg-amber-500/15 text-amber-300 border-amber-500/35'
      }`}
    >
      {ok ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
      {label}
    </span>
  );
}

export default function InspectClient({ characters, weapons }: InspectClientProps) {
  const [tab, setTab] = useState<'characters' | 'weapons'>('characters');
  const [query, setQuery] = useState('');
  const [elementFilter, setElementFilter] = useState<'All' | Element>('All');
  const [weaponTypeFilter, setWeaponTypeFilter] = useState<string>('All');
  const [rarityFilter, setRarityFilter] = useState<'All' | 5 | 4 | 3>('All');
  const [onlyIssues, setOnlyIssues] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (key: string) => {
    setExpandedIds((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const charIssueCount = useMemo(
    () => characters.filter((c) => c.issues.length > 0).length,
    [characters]
  );
  const weaponIssueCount = useMemo(
    () => weapons.filter((w) => w.issues.length > 0).length,
    [weapons]
  );

  const filteredCharacters = useMemo(() => {
    const q = query.trim().toLowerCase();
    return characters.filter((c) => {
      if (elementFilter !== 'All' && c.element !== elementFilter) return false;
      if (weaponTypeFilter !== 'All' && c.weaponType !== weaponTypeFilter) return false;
      if (rarityFilter !== 'All' && c.rarity !== rarityFilter) return false;
      if (onlyIssues && c.issues.length === 0) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        String(c.id).includes(q) ||
        String(c.nameTextMapHash || '').includes(q) ||
        c.element.toLowerCase().includes(q) ||
        c.weaponType.toLowerCase().includes(q)
      );
    });
  }, [characters, query, elementFilter, weaponTypeFilter, rarityFilter, onlyIssues]);

  const filteredWeapons = useMemo(() => {
    const q = query.trim().toLowerCase();
    return weapons.filter((w) => {
      if (weaponTypeFilter !== 'All' && w.type !== weaponTypeFilter) return false;
      if (rarityFilter !== 'All' && w.rarity !== rarityFilter) return false;
      if (onlyIssues && w.issues.length === 0) return false;
      if (!q) return true;
      return (
        w.name.toLowerCase().includes(q) ||
        String(w.id).includes(q) ||
        w.aliasIds.some((a) => String(a).includes(q)) ||
        w.passiveName.toLowerCase().includes(q) ||
        (w.subStatLabel || '').toLowerCase().includes(q) ||
        w.type.toLowerCase().includes(q)
      );
    });
  }, [weapons, query, weaponTypeFilter, rarityFilter, onlyIssues]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-16">
      {/* Header */}
      <div className="border-b border-white/10 bg-zinc-900/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Data Inspection Registry
              </h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-amber-500/15 text-amber-300 border border-amber-400/30">
                Temp Debug Page (/inspect)
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Inspecting {characters.length} characters ({charIssueCount} with missing assets/lore) and{' '}
              {weapons.length} weapons ({weaponIssueCount} with gaps).
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              href="/leaderboard"
              className="px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-zinc-200 transition-colors"
            >
              Leaderboards
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Home
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-5">
        {/* Tabs + Summary */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-xl bg-zinc-900 border border-white/10 p-1">
            <button
              type="button"
              onClick={() => setTab('characters')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tab === 'characters'
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Characters ({characters.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('weapons')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tab === 'weapons'
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-400/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Weapons ({weapons.length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => setOnlyIssues((v) => !v)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors ${
              onlyIssues
                ? 'bg-amber-500/20 text-amber-200 border-amber-400/50'
                : 'bg-zinc-900 text-zinc-300 border-white/10 hover:bg-zinc-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Missing / Incomplete Only
          </button>
        </div>

        {/* Search & Filters */}
        <div className="bg-zinc-900/70 border border-white/10 rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  tab === 'characters'
                    ? 'Filter by ID, name, element, weapon type, or hash...'
                    : 'Filter by weapon ID, alias ID, name, substat, or passive...'
                }
                className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-white/15 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <select
              value={rarityFilter}
              onChange={(e) =>
                setRarityFilter(e.target.value === 'All' ? 'All' : (Number(e.target.value) as 5 | 4 | 3))
              }
              className="px-3 py-2 bg-zinc-950 border border-white/15 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="All" className="bg-zinc-950 text-white">All Rarities</option>
              <option value="5" className="bg-zinc-950 text-white">5★ Only</option>
              <option value="4" className="bg-zinc-950 text-white">4★ Only</option>
              <option value="3" className="bg-zinc-950 text-white">3★ Only</option>
            </select>

            <div className="flex flex-wrap gap-1.5">
              {WEAPON_TYPES.map((wt) => (
                <button
                  key={wt}
                  type="button"
                  onClick={() => setWeaponTypeFilter(wt)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    weaponTypeFilter === wt
                      ? 'bg-white/15 text-white border-white/35'
                      : 'bg-zinc-950 text-zinc-400 border-white/10 hover:text-zinc-200'
                  }`}
                >
                  {wt}
                </button>
              ))}
            </div>
          </div>

          {tab === 'characters' && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {ELEMENTS.map((el) => {
                const active = elementFilter === el;
                const color = el === 'All' ? undefined : ELEMENT_COLORS[el]?.primary;
                return (
                  <button
                    key={el}
                    type="button"
                    onClick={() => setElementFilter(el)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      active
                        ? 'bg-white/15 text-white border-white/40'
                        : 'bg-zinc-950 text-zinc-400 border-white/10 hover:text-zinc-200'
                    }`}
                    style={active && color ? { borderColor: color, color } : undefined}
                  >
                    {el !== 'All' && <ElementIcon element={el} size={13} />}
                    {el}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Characters Table */}
        {tab === 'characters' && (
          <div className="rounded-xl border border-white/10 bg-zinc-900/50 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/10 text-xs text-zinc-400 flex items-center justify-between">
              <span>
                Showing <strong className="text-white">{filteredCharacters.length}</strong> of{' '}
                {characters.length} characters
              </span>
              <span className="font-mono text-[11px] text-zinc-500">
                Click a row to inspect skillOrder &amp; const keys
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-zinc-950/60 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    <th className="py-3 px-4">ID / Hash</th>
                    <th className="py-3 px-4">Character</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Local Assets</th>
                    <th className="py-3 px-4">Registry / Lore</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredCharacters.map((c) => {
                    const key = `char-${c.id}`;
                    const expanded = Boolean(expandedIds[key]);
                    const elColor =
                      c.element !== 'Unknown' ? ELEMENT_COLORS[c.element]?.primary : '#a1a1aa';

                    return (
                      <Fragment key={key}>
                        <tr
                          onClick={() => toggleExpand(key)}
                          className="hover:bg-white/[0.03] cursor-pointer transition-colors"
                        >
                          <td className="py-2.5 px-4 font-mono text-xs whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              {expanded ? (
                                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                              )}
                              <span className="text-cyan-300 font-semibold">{c.id}</span>
                            </div>
                            <div className="text-[11px] text-zinc-500 pl-5">
                              {c.nameTextMapHash ?? 'no hash'}
                            </div>
                          </td>

                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-zinc-950 border border-white/15 overflow-hidden shrink-0 flex items-center justify-center">
                                {c.iconPath ? (
                                  <img
                                    src={c.iconPath}
                                    alt={c.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xs font-mono text-zinc-600">?</span>
                                )}
                              </div>
                              <div>
                                <div className="font-semibold text-white flex items-center gap-2">
                                  <span>{c.name}</span>
                                  {!c.registeredInGameData && (
                                    <span className="px-1.5 py-0.5 rounded bg-red-500/20 border border-red-400/40 text-[10px] font-mono text-red-300">
                                      UNREGISTERED
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-amber-400">
                                  {c.rarity > 0 ? '★'.repeat(c.rarity) : 'Unknown rarity'}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-2.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-950 border border-white/10"
                                style={{ color: elColor }}
                              >
                                {c.element !== 'Unknown' && <ElementIcon element={c.element} size={12} />}
                                {c.element}
                              </span>
                              <span className="text-xs text-zinc-300">{c.weaponType}</span>
                            </div>
                          </td>

                          <td className="py-2.5 px-4">
                            <div className="flex flex-wrap gap-1">
                              <StatusPill ok={c.assets.icon} label="Icon" />
                              <StatusPill ok={c.assets.gacha} label="Splash" />
                              <StatusPill ok={c.assets.skill && c.assets.burst} label="E/Q" />
                              <StatusPill
                                ok={c.assets.constIcons === 6}
                                label={`C:${c.assets.constIcons}/6`}
                              />
                            </div>
                          </td>

                          <td className="py-2.5 px-4">
                            <div className="flex flex-wrap gap-1">
                              <StatusPill
                                ok={c.metadata.constLoreCount >= 6}
                                label={`Lore:${c.metadata.constLoreCount}/6`}
                              />
                              <StatusPill
                                ok={Boolean(c.metadata.c3Boost || c.metadata.c5Boost)}
                                label={
                                  c.metadata.c3Boost || c.metadata.c5Boost
                                    ? `C3:${c.metadata.c3Boost || '-'} C5:${c.metadata.c5Boost || '-'}`
                                    : 'Default C3/C5'
                                }
                              />
                              {c.metadata.hasDamageConfig && (
                                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
                                  DmgCfg
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>

                        {expanded && (
                          <tr key={`${key}-details`} className="bg-zinc-950/80">
                            <td colSpan={5} className="px-6 py-3 text-xs font-mono text-zinc-300 space-y-1.5">
                              <div>
                                <span className="text-zinc-500">sideIconName:</span>{' '}
                                {c.sideIconName || '—'} &nbsp;|&nbsp;{' '}
                                <span className="text-zinc-500">skillOrder:</span>{' '}
                                [{c.skillOrder.join(', ')}]
                              </div>
                              <div>
                                <span className="text-zinc-500">consts:</span>{' '}
                                {c.consts.length > 0 ? c.consts.join(', ') : 'none'}
                              </div>
                              {c.issues.length > 0 && (
                                <div className="text-amber-300">
                                  <span className="text-zinc-500">notes:</span> {c.issues.join(' • ')}
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Weapons Table */}
        {tab === 'weapons' && (
          <div className="rounded-xl border border-white/10 bg-zinc-900/50 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/10 text-xs text-zinc-400 flex items-center justify-between">
              <span>
                Showing <strong className="text-white">{filteredWeapons.length}</strong> of{' '}
                {weapons.length} weapons
              </span>
              <span className="font-mono text-[11px] text-zinc-500">
                Click a row to inspect R1–R5 passive descriptions
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-zinc-950/60 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    <th className="py-3 px-4">ID / Aliases</th>
                    <th className="py-3 px-4">Weapon</th>
                    <th className="py-3 px-4">Type / Rarity</th>
                    <th className="py-3 px-4">Lv.90 Stats</th>
                    <th className="py-3 px-4">Passive / Health</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredWeapons.map((w) => {
                    const key = `weapon-${w.id}`;
                    const expanded = Boolean(expandedIds[key]);

                    return (
                      <Fragment key={key}>
                        <tr
                          onClick={() => toggleExpand(key)}
                          className="hover:bg-white/[0.03] cursor-pointer transition-colors"
                        >
                          <td className="py-2.5 px-4 font-mono text-xs whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              {expanded ? (
                                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                              )}
                              <span className="text-amber-300 font-semibold">{w.id}</span>
                            </div>
                            {w.aliasIds.length > 0 && (
                              <div className="text-[11px] text-zinc-500 pl-5">
                                alias: {w.aliasIds.join(', ')}
                              </div>
                            )}
                          </td>

                          <td className="py-2.5 px-4 font-semibold text-white">
                            {w.name}
                          </td>

                          <td className="py-2.5 px-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-zinc-950 border border-white/10 text-xs text-zinc-200 mr-2">
                              {w.type}
                            </span>
                            <span className="text-xs text-amber-400">{'★'.repeat(w.rarity)}</span>
                          </td>

                          <td className="py-2.5 px-4 font-mono text-xs whitespace-nowrap text-zinc-200">
                            <div>ATK: {w.baseAtkLv90 ?? '—'}</div>
                            <div className="text-cyan-300">
                              {w.subStatLabel || '—'}:{' '}
                              {w.subStatValueLv90 !== null
                                ? `${w.subStatValueLv90}${
                                    w.subStatLabel === 'Elemental Mastery' || w.subStatLabel === 'EM'
                                      ? ''
                                      : '%'
                                  }`
                                : '—'}
                            </div>
                          </td>

                          <td className="py-2.5 px-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-medium text-zinc-200">
                                {w.passiveName || '—'}
                              </span>
                              <StatusPill
                                ok={w.issues.length === 0}
                                label={w.issues.length === 0 ? 'R1–R5 OK' : w.issues.join(', ')}
                              />
                            </div>
                          </td>
                        </tr>

                        {expanded && (
                          <tr key={`${key}-details`} className="bg-zinc-950/80">
                            <td colSpan={5} className="px-6 py-3 text-xs text-zinc-300 space-y-1.5">
                              {w.refinements.map((rf) => (
                                <div key={rf.rank} className="leading-relaxed">
                                  <span className="font-mono font-bold text-amber-300 mr-2">
                                    R{rf.rank}:
                                  </span>
                                  <span>{rf.text || '—'}</span>
                                </div>
                              ))}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
