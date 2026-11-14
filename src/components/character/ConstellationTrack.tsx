'use client';

import React from 'react';
import type { Character, Element } from '@/lib/enka/types';
import { getConstellationDetail, getConstellationRoman } from '@/lib/enka/static-data';
import { getGameCharacter } from '@/lib/enka/game-data.generated';
import { cn } from '@/lib/utils';
import { Lock } from 'lucide-react';

/**
 * Formats in-game description text by stripping archive link tags
 * and converting <color=#HEX>text</color> into styled spans,
 * matching in-game and Akasha.cv styling.
 */
export function renderFormattedDescription(text: string): React.ReactNode {
  if (!text) return null;

  // 1. Normalize literal escaped newlines and strip in-game archive link tags
  const cleaned = text
    .replace(/\\n/g, '\n')
    .replace(/\{LINK#[^}]*\}/g, '')
    .replace(/\{\/LINK\}/g, '');

  // 2. Tokenize by <color=#[0-9a-fA-F]{6,8}>...</color>
  const parts = cleaned.split(/(<color=#[0-9a-fA-F]{6,8}>[\s\S]*?<\/color>)/g);

  return parts.map((part, idx) => {
    const match = part.match(/^<color=(#[0-9a-fA-F]{6,8})>([\s\S]*?)<\/color>$/);
    if (match) {
      const [, hexColor, innerText] = match;
      const safeColor = hexColor.length === 9 ? hexColor.slice(0, 7) : hexColor;
      return (
        <span key={idx} style={{ color: safeColor, fontWeight: 600 }}>
          {innerText}
        </span>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

export const CONSTELLATION_ELEMENT_THEMES: Record<
  Element,
  {
    primary: string;
    bright: string;
    glow: string;
    bg: string;
    border: string;
  }
> = {
  Anemo: {
    primary: '#2dd4bf',
    bright: '#5eead4',
    glow: 'rgba(45, 212, 191, 0.45)',
    bg: 'rgba(45, 212, 191, 0.14)',
    border: 'rgba(45, 212, 191, 0.85)',
  },
  Hydro: {
    primary: '#00bfff',
    bright: '#38bdf8',
    glow: 'rgba(0, 191, 255, 0.45)',
    bg: 'rgba(0, 191, 255, 0.14)',
    border: 'rgba(0, 191, 255, 0.85)',
  },
  Cryo: {
    primary: '#4dd0e1',
    bright: '#93c5fd',
    glow: 'rgba(77, 208, 225, 0.45)',
    bg: 'rgba(77, 208, 225, 0.14)',
    border: 'rgba(77, 208, 225, 0.85)',
  },
  Pyro: {
    primary: '#ff6b2c',
    bright: '#f97316',
    glow: 'rgba(255, 107, 44, 0.45)',
    bg: 'rgba(255, 107, 44, 0.14)',
    border: 'rgba(255, 107, 44, 0.85)',
  },
  Electro: {
    primary: '#9b59d6',
    bright: '#c084fc',
    glow: 'rgba(155, 89, 214, 0.45)',
    bg: 'rgba(155, 89, 214, 0.14)',
    border: 'rgba(155, 89, 214, 0.85)',
  },
  Dendro: {
    primary: '#7cb342',
    bright: '#4ade80',
    glow: 'rgba(124, 179, 66, 0.45)',
    bg: 'rgba(124, 179, 66, 0.14)',
    border: 'rgba(124, 179, 66, 0.85)',
  },
  Geo: {
    primary: '#ffb74d',
    bright: '#fbbf24',
    glow: 'rgba(255, 183, 77, 0.45)',
    bg: 'rgba(255, 183, 77, 0.14)',
    border: 'rgba(255, 183, 77, 0.85)',
  },
};

interface ConstellationTrackProps {
  character: Character;
  activeConst: number | null;
  setActiveConst: (num: number | null) => void;
  className?: string;
}

export default function ConstellationTrack({
  character,
  activeConst,
  setActiveConst,
  className,
}: ConstellationTrackProps) {
  const theme =
    CONSTELLATION_ELEMENT_THEMES[character.element] ||
    CONSTELLATION_ELEMENT_THEMES.Pyro;

  const gameChar = getGameCharacter(character.id);
  const normName = character.name.toLowerCase().replace(/[^a-z0-9]/g, '');

  return (
    <div className={cn("relative flex flex-col items-center select-none", className)}>
      {/* SVG Connecting Constellation Sky Lines */}
      <svg
        className="absolute top-0 left-0 w-full h-full pointer-events-none z-0"
        viewBox="0 0 44 304"
        style={{ overflow: 'visible' }}
        aria-hidden="true"
      >
        {[1, 2, 3, 4, 5].map((idx) => {
          const y1 = 22 + (idx - 1) * 52;
          const y2 = 22 + idx * 52;
          const isSegmentUnlocked = character.constellation >= idx + 1;

          if (isSegmentUnlocked) {
            return (
              <g key={idx}>
                {/* Glowing stream between unlocked stars */}
                <line
                  x1="22"
                  y1={y1}
                  x2="22"
                  y2={y2}
                  stroke={theme.primary}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <line
                  x1="22"
                  y1={y1}
                  x2="22"
                  y2={y2}
                  stroke={theme.bright}
                  strokeWidth="1.5"
                  className="constellation-flow"
                />
              </g>
            );
          }

          return (
            <line
              key={idx}
              x1="22"
              y1={y1}
              x2="22"
              y2={y2}
              stroke="rgba(255, 255, 255, 0.18)"
              strokeWidth="1.5"
              strokeDasharray="3 4"
            />
          );
        })}
      </svg>

      {/* 6 Constellation Nodes (C1 - C6) */}
      <div className="relative z-10 flex flex-col gap-2">
        {[1, 2, 3, 4, 5, 6].map((constNum) => {
          const isUnlocked = character.constellation >= constNum;
          const detail = getConstellationDetail(character.id, character.name, constNum);
          const constIconLocal = `/icons/characters/${character.id}_const_${constNum - 1}.png`;
          const constIconNamed = `/icons/constellations/${normName}_${constNum}.png`;
          const constIconEnka = detail.icon ? `https://enka.network/ui/${detail.icon}.png` : null;
          const constIconYatta = detail.icon ? `https://gi.yatta.moe/assets/UI/${detail.icon}.png` : null;
          const constIconCdn = gameChar?.consts?.[constNum - 1]
            ? `https://enka.network/ui/${gameChar.consts[constNum - 1]}.png`
            : null;
          const isOpen = activeConst === constNum;

          const handleIconError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
            const target = e.target as HTMLImageElement;
            if (!target.src.includes(normName) && constIconNamed) {
              target.src = constIconNamed;
            } else if (constIconEnka && !target.src.includes('enka.network')) {
              target.src = constIconEnka;
            } else if (constIconYatta && !target.src.includes('yatta.moe')) {
              target.src = constIconYatta;
            } else if (constIconCdn && !target.src.includes('enka.network')) {
              target.src = constIconCdn;
            } else {
              target.style.display = 'none';
            }
          };

          // Vertical positioning clamp so popover stays inside card frame
          const popoverPosClass =
            constNum <= 2
              ? "-top-3"
              : constNum >= 5
              ? "-bottom-3"
              : "top-1/2 -translate-y-1/2";

          return (
            <div
              key={constNum}
              className="relative group/const"
              onClick={(e) => {
                e.stopPropagation();
                setActiveConst(isOpen ? null : constNum);
              }}
            >
              {/* Star Node Container */}
              <div
                className="relative flex items-center justify-center cursor-pointer"
                style={{ width: 44, height: 44 }}
              >
                {isUnlocked ? (
                  <>
                    {/* Outer Cosmic Orbit Ring (Rotating with star notches) */}
                    <svg
                      className="absolute inset-0 w-full h-full orbit-ring pointer-events-none"
                      viewBox="0 0 44 44"
                      aria-hidden="true"
                    >
                      <circle
                        cx="22"
                        cy="22"
                        r="20"
                        fill="none"
                        stroke={theme.primary}
                        strokeWidth="1.2"
                        strokeDasharray="4 6 12 4"
                        strokeOpacity="0.85"
                      />
                      <circle cx="22" cy="2" r="1.5" fill={theme.bright} />
                      <circle cx="22" cy="42" r="1.5" fill={theme.bright} />
                    </svg>

                    {/* Inner Core: Breathing Elemental Aura & Icon */}
                    <div
                      className={cn(
                        "w-[34px] h-[34px] rounded-full flex items-center justify-center transition-all duration-200 constellation-breathe p-1.5",
                        isOpen ? "scale-110" : "group-hover/const:scale-110"
                      )}
                      style={
                        {
                          background: theme.bg,
                          border: `1.5px solid ${theme.primary}`,
                          '--const-glow': theme.glow,
                          '--const-bright': theme.bright,
                        } as React.CSSProperties
                      }
                    >
                      <img
                        src={constIconLocal}
                        alt={`C${constNum}`}
                        className="w-full h-full object-contain filter drop-shadow brightness-0 invert opacity-100"
                        onError={handleIconError}
                      />
                    </div>
                  </>
                ) : (
                  /* Locked Star Node */
                  <div
                    className={cn(
                      "w-[34px] h-[34px] rounded-full flex items-center justify-center transition-all duration-200 bg-black/75 border border-zinc-700/60 p-1.5",
                      isOpen
                        ? "border-zinc-500 bg-zinc-900 scale-105"
                        : "group-hover/const:border-zinc-500 group-hover/const:bg-zinc-900"
                    )}
                  >
                    <img
                      src={constIconLocal}
                      alt={`C${constNum}`}
                      className="w-full h-full object-contain filter drop-shadow brightness-0 invert opacity-45"
                      onError={handleIconError}
                    />
                    {/* Lock Pill Badge */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-zinc-950 border border-zinc-700 flex items-center justify-center pointer-events-none shadow-sm">
                      <Lock className="w-2.5 h-2.5 text-zinc-400" />
                    </div>
                  </div>
                )}
              </div>

              {/* Interactive Constellation Information Popover */}
              <div
                className={cn(
                  "absolute left-full pl-4 z-[100] w-80 sm:w-96 transition-all duration-200 text-left cursor-default",
                  popoverPosClass,
                  isOpen
                    ? "opacity-100 pointer-events-auto visible"
                    : "opacity-0 pointer-events-none invisible group-hover/const:opacity-100 group-hover/const:pointer-events-auto group-hover/const:visible"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className="relative p-4 rounded-xl bg-[#141622]/95 border backdrop-blur-xl shadow-2xl"
                  style={{
                    borderColor: isUnlocked ? theme.border : 'rgba(255, 255, 255, 0.12)',
                    boxShadow: isUnlocked
                      ? `0 12px 36px -6px rgba(0, 0, 0, 0.7), 0 0 16px ${theme.glow}`
                      : '0 12px 36px -6px rgba(0, 0, 0, 0.7)',
                  }}
                >
                  {/* Arrow Pointer */}
                  <div
                    className="absolute -left-1.5 w-3 h-3 bg-[#141622] border-l border-b rotate-45 pointer-events-none"
                    style={{
                      borderColor: isUnlocked ? theme.border : 'rgba(255, 255, 255, 0.12)',
                      top: constNum <= 2 ? '18px' : constNum >= 5 ? 'calc(100% - 24px)' : 'calc(50% - 6px)',
                    }}
                  />

                  <div className="flex items-start gap-3.5 mb-2.5">
                    {/* Emblem Icon */}
                    <div
                      className="w-12 h-12 rounded-full border flex items-center justify-center shrink-0 overflow-hidden p-1.5"
                      style={{
                        background: isUnlocked ? theme.bg : 'rgba(0, 0, 0, 0.6)',
                        borderColor: isUnlocked ? theme.primary : 'rgba(255, 255, 255, 0.15)',
                        boxShadow: isUnlocked ? `0 0 12px ${theme.glow}` : undefined,
                      }}
                    >
                      <img
                        src={constIconLocal}
                        alt={detail.name}
                        className="w-full h-full object-contain filter drop-shadow brightness-0 invert"
                        onError={handleIconError}
                      />
                    </div>

                    {/* Title and Roman Constellation Level */}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-zinc-400">
                        {character.name}
                      </div>
                      <div className="text-base font-bold text-white tracking-tight leading-snug">
                        {detail.name}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span
                          className="px-2 py-0.5 rounded text-[11px] font-semibold border"
                          style={{
                            background: isUnlocked ? theme.bg : 'rgba(255, 255, 255, 0.06)',
                            color: isUnlocked ? theme.bright : '#a1a1aa',
                            borderColor: isUnlocked ? theme.border : 'rgba(255, 255, 255, 0.12)',
                          }}
                        >
                          Constellation {getConstellationRoman(constNum)}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                            isUnlocked
                              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                              : "bg-zinc-800 text-zinc-400 border-zinc-700/50"
                          )}
                        >
                          {isUnlocked ? 'Unlocked' : 'Locked'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Multiline Description Text with In-Game Styled Highlighting */}
                  <p className="text-xs leading-relaxed text-zinc-300 font-sans whitespace-pre-line border-t border-zinc-800/80 pt-2.5">
                    {renderFormattedDescription(detail.description)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
