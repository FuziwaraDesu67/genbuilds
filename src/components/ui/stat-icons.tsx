'use client';

import * as React from 'react';
import { ElementIcon } from './element-icons';
import type { Element } from '@/lib/enka/types';

export interface StatIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
}

/** Max HP — Genshin pointed teardrop with filled lower fluid bowl */
export function StatHpIcon({ size = 16, className = '', ...props }: StatIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" className={className} {...props}>
      <path
        d="M12 2.4C12 2.4 5.5 10.1 5.5 14.8C5.5 18.6 8.4 21.5 12 21.5C15.6 21.5 18.5 18.6 18.5 14.8C18.5 10.1 12 2.4 12 2.4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M6.2 13.6C7.9 12.7 9.8 14.8 12 14C14.2 13.2 16 12.1 17.8 13.3C18.3 14.1 18.4 14.8 18.4 15.1C18.2 18.5 15.4 21.2 12 21.2C8.6 21.2 5.8 18.5 5.6 15.1C5.6 14.6 5.9 14.0 6.2 13.6Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** ATK — Classic single Genshin broadsword tilted top-right */
export function StatAtkIcon({ size = 16, className = '', ...props }: StatIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className} {...props}>
      <path d="M20.8 3.2L14.2 5.1L8.8 11.9L7.4 10.5L5.8 12.1L8.1 14.4L4.2 18.3L3.1 17.6L2.4 18.3L4.9 20.8L5.6 20.1L4.9 19L8.8 15.1L11.1 17.4L12.7 15.8L11.3 14.4L18.1 9L20.8 3.2Z" />
    </svg>
  );
}

/** DEF — Vertical shield split down the center (left solid, right outline) */
export function StatDefIcon({ size = 16, className = '', ...props }: StatIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" className={className} {...props}>
      <path
        d="M12 2.7L4.5 5.4V11.3C4.5 16.3 7.7 19.9 12 21.5C16.3 19.9 19.5 16.3 19.5 11.3V5.4L12 2.7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M12 2.9L4.8 5.5V11.3C4.8 16.0 7.8 19.5 12 21.2V2.9Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Elemental Mastery — Three interlocking rings arranged in a triad */
export function StatEmIcon({ size = 16, className = '', ...props }: StatIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" className={className} {...props}>
      <circle cx="12" cy="7.2" r="3.9" stroke="currentColor" strokeWidth="1.95" />
      <circle cx="7.3" cy="15.4" r="3.9" stroke="currentColor" strokeWidth="1.95" />
      <circle cx="16.7" cy="15.4" r="3.9" stroke="currentColor" strokeWidth="1.95" />
    </svg>
  );
}

/** Crit Rate — Crisp tilted hollow 4-point star */
export function StatCritRateIcon({ size = 16, className = '', ...props }: StatIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" className={className} {...props}>
      <path
        transform="rotate(14 12 12)"
        d="M12 2.4C13.1 8.4 15.6 10.9 21.6 12C15.6 13.1 13.1 15.6 12 21.6C10.9 15.6 8.4 13.1 2.4 12C8.4 10.9 10.9 8.4 12 2.4Z"
        stroke="currentColor"
        strokeWidth="1.95"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.18"
      />
    </svg>
  );
}

/** Crit DMG — Sharp 4-point star over a glowing rounded-halo backdrop */
export function StatCritDmgIcon({ size = 16, className = '', ...props }: StatIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" className={className} {...props}>
      <circle cx="12" cy="12" r="7.2" fill="currentColor" fillOpacity="0.34" />
      <path
        d="M12 2.1C13.3 8.1 15.9 10.7 21.9 12C15.9 13.3 13.3 15.9 12 21.9C10.7 15.9 8.1 13.3 2.1 12C8.1 10.7 10.7 8.1 12 2.1Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Energy Recharge — Clockwise circular arrow loop */
export function StatErIcon({ size = 16, className = '', ...props }: StatIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" className={className} {...props}>
      <path
        d="M5.6 15.3A7.5 7.5 0 1 1 12 19.5A7.4 7.4 0 0 1 8.4 18.6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path d="M4.2 13.2L8.9 14.3L5.0 18.0L4.2 13.2Z" fill="currentColor" />
    </svg>
  );
}

/** Universal Stat Icon selector for primary stats, artifact mainstats, substats & roll pills */
export function StatIcon({
  statKey,
  element,
  size = 15,
  className = '',
  style,
}: {
  statKey: string;
  element?: Element;
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
}) {
  switch (statKey) {
    case 'hp':
    case 'hpPercent':
      return <StatHpIcon size={size} className={className} style={style} />;
    case 'atk':
    case 'atkPercent':
      return <StatAtkIcon size={size} className={className} style={style} />;
    case 'def':
    case 'defPercent':
      return <StatDefIcon size={size} className={className} style={style} />;
    case 'em':
      return <StatEmIcon size={size} className={className} style={style} />;
    case 'cr':
      return <StatCritRateIcon size={size} className={className} style={style} />;
    case 'cd':
      return <StatCritDmgIcon size={size} className={className} style={style} />;
    case 'er':
      return <StatErIcon size={size} className={className} style={style} />;
    case 'healingBonus':
      return <StatHpIcon size={size} className={className} style={style} />;
    case 'pyroDmgBonus':
      return <ElementIcon element="Pyro" size={size} className={className} style={style} />;
    case 'hydroDmgBonus':
      return <ElementIcon element="Hydro" size={size} className={className} style={style} />;
    case 'electroDmgBonus':
      return <ElementIcon element="Electro" size={size} className={className} style={style} />;
    case 'cryoDmgBonus':
      return <ElementIcon element="Cryo" size={size} className={className} style={style} />;
    case 'dendroDmgBonus':
      return <ElementIcon element="Dendro" size={size} className={className} style={style} />;
    case 'anemoDmgBonus':
      return <ElementIcon element="Anemo" size={size} className={className} style={style} />;
    case 'geoDmgBonus':
      return <ElementIcon element="Geo" size={size} className={className} style={style} />;
    case 'physicalDmgBonus':
      return <StatAtkIcon size={size} className={className} style={style} />;
    case 'dmgBonus':
      return element ? (
        <ElementIcon element={element} size={size} className={className} style={style} />
      ) : (
        <StatAtkIcon size={size} className={className} style={style} />
      );
    default:
      return <StatCritRateIcon size={size} className={className} style={style} />;
  }
}
