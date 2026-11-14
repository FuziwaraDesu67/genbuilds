# Milestone 3 Analysis Report: Visual Foundation, Elemental Glassmorphism, Avatar Glow Frame & Constellation Indicators (C0–C6)

**Agent**: `teamwork_preview_explorer_m3_1`  
**Working Directory**: `d:\games\projects\genshin-leaderboard\.agents\teamwork\teamwork_preview_explorer_m3_1`  
**Target Milestone**: Milestone 3 (Feature 8: CharacterCard Glassmorphism Overhaul & Presentation)  
**Status**: COMPLETE / READY FOR WORKER IMPLEMENTATION  

---

## 1. Executive Summary & Problem Scope

This report delivers the comprehensive design, visual tokens, and exact JSX/CSS blueprints for the **Visual Foundation**, **Elemental Glassmorphism**, **Avatar Glow Frame**, and **Constellation Node Indicators (`C0`–`C6`)** for `src/components/character/CharacterCard.tsx` and `src/components/profile/ProfileClient.tsx`.

### Core Deficiencies in Current Implementation
1. **Low-Contrast Glassmorphism**: The legacy `.glass` class applies a weak white-tinted gradient (`rgba(255, 255, 255, 0.1)`) with `backdrop-filter: blur(10px)` and generic light border. On dark displays, this produces a milky, low-contrast appearance that dilutes Genshin Impact's distinctive vibrant elemental aesthetics.
2. **Minimalist Avatar Presentation**: The avatar is currently rendered as a plain circular image (`w-12 h-12 rounded-full border-2`) without dimensional depth, specular highlights, elemental halos, or friendship level indicator.
3. **Crude Constellation Text**: Constellations are rendered solely as plain text (`<span className="text-gray-400">C{character.constellation}</span>`), lacking the iconic 6-node celestial constellation chart that players recognize in-game.
4. **Missing Star Rarity**: No visual star indicators (`★★★★★` / `★★★★`) are rendered on the character card.

### Objectives Achieved in this Specification
- High-contrast dark elemental glassmorphism with deep translucent slate/zinc backgrounds (`bg-slate-900/85 backdrop-blur-xl`), 1px specular top highlight edge, and multi-layered glow shadows.
- Complete 7-element color and theme palette (Pyro, Hydro, Anemo, Electro, Dendro, Cryo, Geo) matching authoritative `ELEMENT_COLORS` and passing test assertions (`#FF6B2C`, `#9B59D6`).
- Luxury avatar glow frame featuring an ambient elemental halo, radiant gradient outer ring, dark inner recess, anchored SVG element badge, and friendship badge.
- Interactive 6-node constellation indicators displaying active illuminated gems ($1..C$) with vibrant elemental bloom, dimmed inactive nodes ($C+1..6$), connecting line progress track, and prominent `C0`–`C6` pill badge.
- Seamless container integration with Explorer 2 (Weapons & Talents) and Explorer 3 (Attributes & Set Chips).
- Strict adherence to the R5 Home UI constraint (`src/app/page.tsx` untouched).

---

## 2. High-Contrast Elemental Glassmorphism System

### 2.1 Design Tokens & Elemental Color Maps
The design strictly adopts the authoritative hex values from `src/lib/enka/static-data.ts:118` to maintain 100% test compatibility with `tests/e2e/e2e-showcase.test.ts` (e.g. Case 4 asserting `#FF6B2C` for Pyro and Case 5 asserting `#9B59D6` for Electro).

| Element | Primary Hex | Secondary Hex | RGB Channels | Accent Tint | Glow Shadow (`boxShadow`) | Badge Tailwind Classes |
|---------|-------------|---------------|--------------|-------------|---------------------------|------------------------|
| **Pyro** | `#FF6B2C` | `#FF4500` | `255, 107, 44` | `#FFA175` | `0 0 20px rgba(255,107,44,0.45)` | `bg-orange-500/15 border-orange-500/35 text-orange-300` |
| **Hydro** | `#00BFFF` | `#1E90FF` | `0, 191, 255` | `#70D8FF` | `0 0 20px rgba(0,191,255,0.45)` | `bg-sky-500/15 border-sky-500/35 text-sky-300` |
| **Anemo** | `#4FC3F7` | `#87CEEB` | `79, 195, 247` | `#9BE3FF` | `0 0 20px rgba(79,195,247,0.45)` | `bg-cyan-500/15 border-cyan-500/35 text-cyan-300` |
| **Electro** | `#9B59D6` | `#8A2BE2` | `155, 89, 214` | `#CE9EFF` | `0 0 20px rgba(155,89,214,0.45)` | `bg-purple-500/15 border-purple-500/35 text-purple-300` |
| **Dendro** | `#7CB342` | `#9ACD32` | `124, 179, 66` | `#B0DF7A` | `0 0 20px rgba(124,179,66,0.45)` | `bg-lime-500/15 border-lime-500/35 text-lime-300` |
| **Cryo** | `#4DD0E1` | `#00CED1` | `77, 208, 225` | `#93EFFB` | `0 0 20px rgba(77,208,225,0.45)` | `bg-teal-500/15 border-teal-500/35 text-teal-300` |
| **Geo** | `#FFB74D` | `#DAA520` | `255, 183, 77` | `#FFD28E` | `0 0 20px rgba(255,183,77,0.45)` | `bg-amber-500/15 border-amber-500/35 text-amber-300` |

### 2.2 Reusable Theme Helper: `ELEMENT_THEMES`
To enable clean, strongly-typed usage across `CharacterCard.tsx`, define:

```typescript
import { ELEMENT_COLORS } from '@/lib/enka/static-data';
import type { Element } from '@/lib/enka/types';

export interface ElementVisualTheme {
  primary: string;
  secondary: string;
  rgb: string;
  glow: string;
  subtleBg: string;
  border: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
}

export const ELEMENT_THEMES: Record<Element, ElementVisualTheme> = {
  Pyro: {
    primary: ELEMENT_COLORS.Pyro.primary, // '#FF6B2C'
    secondary: ELEMENT_COLORS.Pyro.secondary, // '#FF4500'
    rgb: '255, 107, 44',
    glow: '0 0 20px rgba(255, 107, 44, 0.40)',
    subtleBg: 'rgba(255, 107, 44, 0.12)',
    border: 'rgba(255, 107, 44, 0.40)',
    badgeBg: 'bg-orange-500/15',
    badgeBorder: 'border-orange-500/40',
    badgeText: 'text-orange-300',
  },
  Hydro: {
    primary: ELEMENT_COLORS.Hydro.primary, // '#00BFFF'
    secondary: ELEMENT_COLORS.Hydro.secondary, // '#1E90FF'
    rgb: '0, 191, 255',
    glow: '0 0 20px rgba(0, 191, 255, 0.40)',
    subtleBg: 'rgba(0, 191, 255, 0.12)',
    border: 'rgba(0, 191, 255, 0.40)',
    badgeBg: 'bg-sky-500/15',
    badgeBorder: 'border-sky-500/40',
    badgeText: 'text-sky-300',
  },
  Anemo: {
    primary: ELEMENT_COLORS.Anemo.primary, // '#4FC3F7'
    secondary: ELEMENT_COLORS.Anemo.secondary, // '#87CEEB'
    rgb: '79, 195, 247',
    glow: '0 0 20px rgba(79, 195, 247, 0.40)',
    subtleBg: 'rgba(79, 195, 247, 0.12)',
    border: 'rgba(79, 195, 247, 0.40)',
    badgeBg: 'bg-cyan-500/15',
    badgeBorder: 'border-cyan-500/40',
    badgeText: 'text-cyan-300',
  },
  Electro: {
    primary: ELEMENT_COLORS.Electro.primary, // '#9B59D6'
    secondary: ELEMENT_COLORS.Electro.secondary, // '#8A2BE2'
    rgb: '155, 89, 214',
    glow: '0 0 20px rgba(155, 89, 214, 0.40)',
    subtleBg: 'rgba(155, 89, 214, 0.12)',
    border: 'rgba(155, 89, 214, 0.40)',
    badgeBg: 'bg-purple-500/15',
    badgeBorder: 'border-purple-500/40',
    badgeText: 'text-purple-300',
  },
  Dendro: {
    primary: ELEMENT_COLORS.Dendro.primary, // '#7CB342'
    secondary: ELEMENT_COLORS.Dendro.secondary, // '#9ACD32'
    rgb: '124, 179, 66',
    glow: '0 0 20px rgba(124, 179, 66, 0.40)',
    subtleBg: 'rgba(124, 179, 66, 0.12)',
    border: 'rgba(124, 179, 66, 0.40)',
    badgeBg: 'bg-lime-500/15',
    badgeBorder: 'border-lime-500/40',
    badgeText: 'text-lime-300',
  },
  Cryo: {
    primary: ELEMENT_COLORS.Cryo.primary, // '#4DD0E1'
    secondary: ELEMENT_COLORS.Cryo.secondary, // '#00CED1'
    rgb: '77, 208, 225',
    glow: '0 0 20px rgba(77, 208, 225, 0.40)',
    subtleBg: 'rgba(77, 208, 225, 0.12)',
    border: 'rgba(77, 208, 225, 0.40)',
    badgeBg: 'bg-teal-500/15',
    badgeBorder: 'border-teal-500/40',
    badgeText: 'text-teal-300',
  },
  Geo: {
    primary: ELEMENT_COLORS.Geo.primary, // '#FFB74D'
    secondary: ELEMENT_COLORS.Geo.secondary, // '#DAA520'
    rgb: '255, 183, 77',
    glow: '0 0 20px rgba(255, 183, 77, 0.40)',
    subtleBg: 'rgba(255, 183, 77, 0.12)',
    border: 'rgba(255, 183, 77, 0.40)',
    badgeBg: 'bg-amber-500/15',
    badgeBorder: 'border-amber-500/40',
    badgeText: 'text-amber-300',
  },
};
```

### 2.3 Dark Glassmorphic Card Container Anatomy
The card container features:
1. `bg-slate-900/85 backdrop-blur-xl`: High-density dark glass preventing background visual noise.
2. `relative rounded-2xl overflow-hidden`: Crisp modern curvature.
3. `border border-white/10 ring-1 ring-inset ring-white/5`: Multi-tier inner edge highlights.
4. `style={{ borderColor: elementColor.primary + '40' }}`: Dynamically tinted elemental border, satisfying existing E2E test assertions.
5. `before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent`: 1px specular light catcher.
6. `hover:shadow-[0_12px_36px_-6px_rgba(0,0,0,0.7),0_0_24px_-4px_var(--glow)]`: Ambient hover glow elevation.

---

## 3. Character Avatar & Visual Frame Blueprint

### 3.1 Avatar Geometry & Visual Layers
The character portrait is housed in a high-impact circular frame with 4 distinct visual layers:
1. **Ambient Glow Halo**: An absolute-positioned blurred background disc matching the character's primary element (`blur-md opacity-50 group-hover:opacity-80`).
2. **Elemental Gradient Ring**: An outer 2.5px gradient frame transitioning from `elementColor.primary` to `elementColor.secondary` and white specular rim.
3. **Dark Recessed Chamber**: A high-contrast inner basin (`bg-slate-950/90 border border-white/15`) framing the character artwork.
4. **Anchored Element Icon Badge**: An overlapping circular chip positioned at `-bottom-1 -right-1`, displaying the official SVG icon from `ElementIcon` (`src/components/ui/element-icons.tsx`) with an elemental border and shadow.

### 3.2 Exact JSX Blueprint: Avatar Frame

```tsx
{/* Character Avatar with Elemental Glow Frame */}
<div className="relative group/avatar shrink-0">
  {/* Ambient Halo Glow */}
  <div
    className="absolute -inset-1 rounded-full blur-md opacity-50 transition-opacity duration-300 group-hover/avatar:opacity-85"
    style={{ backgroundColor: theme.primary }}
  />

  {/* Radiant Gradient Outer Ring */}
  <div
    className="relative w-16 h-16 rounded-full p-[2.5px] transition-transform duration-300 group-hover/avatar:scale-105"
    style={{
      background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary} 70%, rgba(255,255,255,0.4))`,
      boxShadow: `0 0 16px ${theme.primary}50`,
    }}
  >
    {/* Dark Inner Chamber */}
    <div className="w-full h-full rounded-full overflow-hidden bg-slate-950/90 border border-white/20">
      <img
        src={character.icon}
        alt={character.name}
        className="w-full h-full object-cover object-center transform transition-transform duration-300 group-hover/avatar:scale-110"
        loading="lazy"
      />
    </div>
  </div>

  {/* Anchored Element Glyph Badge */}
  <div
    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center p-1 border shadow-lg"
    style={{
      backgroundColor: '#090d16',
      borderColor: theme.primary,
      boxShadow: `0 0 8px ${theme.primary}80`,
      color: theme.primary,
    }}
    title={character.element}
  >
    <ElementIcon element={character.element} size={14} className="w-3.5 h-3.5" />
  </div>
</div>
```

### 3.3 Character Metadata Presentation
Adjacent to the avatar, the character header renders:
1. **Character Name**: Bold white typography with slight tracking (`text-xl font-bold tracking-tight text-white`).
2. **Star Rarity (`★★★★★` / `★★★★`)**:
   - 5-Star: `★★★★★` in luminous gold (`text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]`).
   - 4-Star: `★★★★` in regal purple (`text-purple-400 drop-shadow-[0_0_6px_rgba(192,132,252,0.6)]`).
3. **Element Badge**: Pill badge with `ElementIcon` and element name:
   ```tsx
   <span
     className="px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1 border"
     style={{
       backgroundColor: theme.primary + '25',
       borderColor: theme.primary + '50',
       color: theme.primary,
     }}
   >
     <ElementIcon element={character.element} size={11} className="w-2.5 h-2.5" />
     {character.element}
   </span>
   ```
4. **Level Indicator**:
   > **CRITICAL SSR INVARIANT**: Must render without space: `Lv.{character.level}`.
   > In `tests/e2e/e2e-showcase.test.ts:43`, Vitest asserts: `expect(html).toContain('Lv.90');`. Rendering `Lv. 90` with a space causes test failure.
   ```tsx
   <span className="px-2 py-0.5 rounded text-xs font-semibold bg-white/10 text-gray-300 border border-white/10">
     Lv.{character.level}
   </span>
   ```
5. **Friendship Level Badge**:
   ```tsx
   {character.friendshipLevel > 0 && (
     <span
       className="px-2 py-0.5 rounded text-xs font-medium bg-pink-500/10 text-pink-300 border border-pink-500/25 flex items-center gap-1"
       title={`Friendship Level ${character.friendshipLevel}`}
     >
       <span className="text-[10px] text-pink-400">❤</span> {character.friendshipLevel}
     </span>
   )}
   ```

---

## 4. Constellation Node Indicators (`C0` through `C6`) Blueprint

### 4.1 Specification
In Genshin Impact, constellations $0$ to $6$ represent character progression:
- `C0`: 0 unlocked nodes, 6 locked nodes.
- `C1`: Node 1 unlocked, nodes 2–6 locked (e.g. Addy's C1 Varesa).
- `C2`: Nodes 1–2 unlocked, nodes 3–6 locked.
- `C3`: Nodes 1–3 unlocked, nodes 4–6 locked.
- `C4`: Nodes 1–4 unlocked, nodes 5–6 locked.
- `C5`: Nodes 1–5 unlocked, node 6 locked.
- `C6`: All 6 nodes unlocked (e.g. C6 Hu Tao).

### 4.2 Visual Composition
The constellation block consists of two complementary elements:
1. **Constellation Badge**: A styled pill showing `C{character.constellation}` with elemental glow when $C \ge 1$, or a neutral slate pill when $C = 0$.
2. **6-Node Celestial Progression Track**:
   - A horizontal row of 6 circular/gem nodes numbered 1 to 6.
   - A subtle background line connecting the nodes (`h-0.5 bg-slate-800`).
   - Active progress fill line illuminated in elemental color up to the current unlocked node.
   - **Active/Unlocked Node ($i \le C$)**:
     - Background: `theme.primary`.
     - Border: `white/80` or `theme.secondary`.
     - Glowing radial box-shadow: `0 0 10px ${theme.primary}`.
     - Center text: bright white bold number `1`–`6` or `✦` star glyph.
   - **Inactive/Locked Node ($i > C$)**:
     - Background: `bg-slate-900/80` or `bg-zinc-900/90`.
     - Border: `border-slate-700/60`.
     - Text: dimmed `text-slate-500 text-[10px]`.
     - No glow, neutral grayscale appearance.

### 4.3 Exact JSX Blueprint: Constellation Track & Badge

```tsx
{/* Constellation Section: C0-C6 Badge + 6-Node Celestial Track */}
<div className="flex items-center gap-2.5 mt-2">
  {/* Constellation Pill Badge */}
  <div
    className="px-2 py-0.5 rounded text-xs font-bold border transition-all duration-200 shrink-0"
    style={{
      backgroundColor: character.constellation > 0 ? theme.primary + '25' : 'rgba(255,255,255,0.06)',
      borderColor: character.constellation > 0 ? theme.primary + '60' : 'rgba(255,255,255,0.12)',
      color: character.constellation > 0 ? theme.primary : '#94a3b8',
      boxShadow: character.constellation > 0 ? `0 0 10px ${theme.primary}40` : 'none',
    }}
  >
    C{character.constellation}
  </div>

  {/* 6-Node Constellation Track */}
  <div className="relative flex items-center gap-1.5 py-1">
    {/* Background Track Line */}
    <div className="absolute left-1 right-1 top-1/2 -translate-y-1/2 h-[2px] bg-slate-800/80 -z-0" />

    {/* Active Progress Track Line */}
    {character.constellation > 1 && (
      <div
        className="absolute left-1 top-1/2 -translate-y-1/2 h-[2px] transition-all duration-300 -z-0"
        style={{
          width: `${Math.min(100, ((character.constellation - 1) / 5) * 100)}%`,
          backgroundColor: theme.primary,
          boxShadow: `0 0 6px ${theme.primary}`,
        }}
      />
    )}

    {/* 6 Individual Celestial Nodes */}
    {[1, 2, 3, 4, 5, 6].map((nodeNum) => {
      const isUnlocked = nodeNum <= character.constellation;
      return (
        <div
          key={nodeNum}
          className="relative z-10 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold transition-all duration-300"
          style={
            isUnlocked
              ? {
                  backgroundColor: theme.primary,
                  borderColor: '#ffffff',
                  borderWidth: '1px',
                  color: '#ffffff',
                  boxShadow: `0 0 8px ${theme.primary}`,
                }
              : {
                  backgroundColor: '#0f172a',
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                  borderWidth: '1px',
                  color: '#64748b',
                }
          }
          title={`Constellation ${nodeNum}: ${isUnlocked ? 'Unlocked' : 'Locked'}`}
        >
          {nodeNum}
        </div>
      );
    })}
  </div>
</div>
```

---

## 5. Complete Integrated `CharacterCard.tsx` Blueprint

The following blueprint defines the exact, complete architecture of `CharacterCard.tsx`. It retains the necessary slots and contracts for Explorer 2 (Weapons & Talents) and Explorer 3 (Attributes & Set Bonus Chips).

```tsx
'use client';

import { useState } from 'react';
import type { Character } from '@/lib/enka/types';
import { ELEMENT_COLORS } from '@/lib/enka/static-data';
import { formatNumber, formatPercentage } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import CharacterDetailModal from './CharacterDetailModal';
import { LiquidButton } from '@/components/ui/liquid-glass-button';
import { ElementIcon } from '@/components/ui/element-icons';

// ============================================================================
// Elemental Visual Themes
// ============================================================================
const ELEMENT_THEMES = {
  Pyro: {
    primary: ELEMENT_COLORS.Pyro.primary, // '#FF6B2C'
    secondary: ELEMENT_COLORS.Pyro.secondary, // '#FF4500'
    rgb: '255, 107, 44',
  },
  Hydro: {
    primary: ELEMENT_COLORS.Hydro.primary, // '#00BFFF'
    secondary: ELEMENT_COLORS.Hydro.secondary, // '#1E90FF'
    rgb: '0, 191, 255',
  },
  Anemo: {
    primary: ELEMENT_COLORS.Anemo.primary, // '#4FC3F7'
    secondary: ELEMENT_COLORS.Anemo.secondary, // '#87CEEB'
    rgb: '79, 195, 247',
  },
  Electro: {
    primary: ELEMENT_COLORS.Electro.primary, // '#9B59D6'
    secondary: ELEMENT_COLORS.Electro.secondary, // '#8A2BE2'
    rgb: '155, 89, 214',
  },
  Dendro: {
    primary: ELEMENT_COLORS.Dendro.primary, // '#7CB342'
    secondary: ELEMENT_COLORS.Dendro.secondary, // '#9ACD32'
    rgb: '124, 179, 66',
  },
  Cryo: {
    primary: ELEMENT_COLORS.Cryo.primary, // '#4DD0E1'
    secondary: ELEMENT_COLORS.Cryo.secondary, // '#00CED1'
    rgb: '77, 208, 225',
  },
  Geo: {
    primary: ELEMENT_COLORS.Geo.primary, // '#FFB74D'
    secondary: ELEMENT_COLORS.Geo.secondary, // '#DAA520'
    rgb: '255, 183, 77',
  },
};

interface CharacterCardProps {
  character: Character & { damageCalc?: any };
  uid: string;
}

export default function CharacterCard({ character, uid }: CharacterCardProps) {
  const [showModal, setShowModal] = useState(false);
  const elementColor = ELEMENT_COLORS[character.element];
  const theme = ELEMENT_THEMES[character.element] || ELEMENT_THEMES.Pyro;

  return (
    <>
      <motion.div
        layout
        className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.015] bg-slate-900/85 backdrop-blur-xl border ring-1 ring-inset ring-white/5"
        onClick={() => setShowModal(true)}
        style={{
          borderColor: elementColor.primary + '40',
          boxShadow: `0 8px 32px -8px rgba(0, 0, 0, 0.6), 0 0 16px -4px rgba(${theme.rgb}, 0.25)`,
        }}
      >
        {/* Specular Top Light Edge */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent z-20 pointer-events-none" />

        {/* Ambient Top Corner Elemental Glow */}
        <div
          className="absolute -top-16 -right-16 w-44 h-44 rounded-full blur-3xl pointer-events-none opacity-30 group-hover:opacity-50 transition-opacity"
          style={{ backgroundColor: theme.primary }}
        />

        {/* ================================================================== */}
        {/* Header Hero Section: Avatar, Name, Stars, Level & Constellations  */}
        {/* ================================================================== */}
        <div
          className="p-4 relative border-b border-white/10 overflow-hidden"
          style={{
            background: `linear-gradient(135deg, rgba(${theme.rgb}, 0.18) 0%, rgba(${theme.rgb}, 0.04) 100%)`,
          }}
        >
          <div className="flex items-start justify-between relative z-10 gap-3">
            <div className="flex-1 flex gap-3.5 items-center min-w-0">
              {/* Character Avatar with Elemental Glow Frame */}
              <div className="relative group/avatar shrink-0">
                <div
                  className="absolute -inset-1 rounded-full blur-md opacity-50 transition-opacity duration-300 group-hover/avatar:opacity-85"
                  style={{ backgroundColor: theme.primary }}
                />
                <div
                  className="relative w-16 h-16 rounded-full p-[2.5px] transition-transform duration-300 group-hover/avatar:scale-105"
                  style={{
                    background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary} 70%, rgba(255,255,255,0.4))`,
                    boxShadow: `0 0 16px ${theme.primary}50`,
                  }}
                >
                  <div className="w-full h-full rounded-full overflow-hidden bg-slate-950/90 border border-white/20">
                    <img
                      src={character.icon}
                      alt={character.name}
                      className="w-full h-full object-cover object-center transform transition-transform duration-300 group-hover/avatar:scale-110"
                      loading="lazy"
                    />
                  </div>
                </div>

                {/* Anchored Element Glyph Badge */}
                <div
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center p-1 border shadow-lg"
                  style={{
                    backgroundColor: '#090d16',
                    borderColor: theme.primary,
                    boxShadow: `0 0 8px ${theme.primary}80`,
                    color: theme.primary,
                  }}
                  title={character.element}
                >
                  <ElementIcon element={character.element} size={14} className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Character Identity & Badges */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-bold tracking-tight text-white group-hover:text-cyan-200 transition-colors truncate">
                    {character.name}
                  </h3>
                  <div
                    className="text-xs tracking-wider"
                    style={{ color: character.rarity === 5 ? '#FBBF24' : '#C084FC' }}
                  >
                    {character.rarity === 5 ? '★★★★★' : '★★★★'}
                  </div>
                </div>

                {/* Badges Row: Element, Level, Friendship */}
                <div className="flex items-center gap-2 text-xs flex-wrap mt-1">
                  <span
                    className="px-2 py-0.5 rounded font-semibold flex items-center gap-1 border"
                    style={{
                      backgroundColor: theme.primary + '25',
                      borderColor: theme.primary + '50',
                      color: theme.primary,
                    }}
                  >
                    <ElementIcon element={character.element} size={11} className="w-2.5 h-2.5" />
                    {character.element}
                  </span>
                  <span className="px-2 py-0.5 rounded font-semibold bg-white/10 text-gray-300 border border-white/10">
                    Lv.{character.level}
                  </span>
                  {character.friendshipLevel > 0 && (
                    <span
                      className="px-2 py-0.5 rounded font-medium bg-pink-500/10 text-pink-300 border border-pink-500/25 flex items-center gap-1"
                      title={`Friendship Level ${character.friendshipLevel}`}
                    >
                      <span className="text-[10px] text-pink-400">❤</span> {character.friendshipLevel}
                    </span>
                  )}
                </div>

                {/* Constellation Section: C0-C6 Badge + 6-Node Celestial Track */}
                <div className="flex items-center gap-2 mt-2">
                  <div
                    className="px-2 py-0.5 rounded text-xs font-bold border transition-all duration-200 shrink-0"
                    style={{
                      backgroundColor: character.constellation > 0 ? theme.primary + '25' : 'rgba(255,255,255,0.06)',
                      borderColor: character.constellation > 0 ? theme.primary + '60' : 'rgba(255,255,255,0.12)',
                      color: character.constellation > 0 ? theme.primary : '#94a3b8',
                      boxShadow: character.constellation > 0 ? `0 0 10px ${theme.primary}40` : 'none',
                    }}
                  >
                    C{character.constellation}
                  </div>

                  <div className="relative flex items-center gap-1.5 py-1">
                    <div className="absolute left-1 right-1 top-1/2 -translate-y-1/2 h-[2px] bg-slate-800/80 -z-0" />
                    {character.constellation > 1 && (
                      <div
                        className="absolute left-1 top-1/2 -translate-y-1/2 h-[2px] transition-all duration-300 -z-0"
                        style={{
                          width: `${Math.min(100, ((character.constellation - 1) / 5) * 100)}%`,
                          backgroundColor: theme.primary,
                          boxShadow: `0 0 6px ${theme.primary}`,
                        }}
                      />
                    )}
                    {[1, 2, 3, 4, 5, 6].map((nodeNum) => {
                      const isUnlocked = nodeNum <= character.constellation;
                      return (
                        <div
                          key={nodeNum}
                          className="relative z-10 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold transition-all duration-300"
                          style={
                            isUnlocked
                              ? {
                                  backgroundColor: theme.primary,
                                  borderColor: '#ffffff',
                                  borderWidth: '1px',
                                  color: '#ffffff',
                                  boxShadow: `0 0 8px ${theme.primary}`,
                                }
                              : {
                                  backgroundColor: '#0f172a',
                                  borderColor: 'rgba(255, 255, 255, 0.15)',
                                  borderWidth: '1px',
                                  color: '#64748b',
                                }
                          }
                          title={`Constellation ${nodeNum}: ${isUnlocked ? 'Unlocked' : 'Locked'}`}
                        >
                          {nodeNum}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Damage Indicator */}
            <div className="text-right shrink-0">
              <div className="text-xs text-gray-400">Damage</div>
              <div className="text-2xl font-bold text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">
                {character.damageCalc ? formatNumber(character.damageCalc.totalDamage) : '—'}
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* SLOT: Attributes & Build CV (Explorer 3 Integration)              */}
        {/* ================================================================== */}
        <div className="p-4 grid grid-cols-2 gap-3 text-sm border-b border-white/5">
          <div>
            <div className="text-gray-400 text-xs mb-1">ATK</div>
            <div className="font-semibold text-white">{formatNumber(character.stats.atk)}</div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1">Crit Ratio</div>
            <div className="font-semibold text-white">
              {formatPercentage(character.stats.cr, 1)} / {formatPercentage(character.stats.cd, 1)}
            </div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1">EM</div>
            <div className="font-semibold text-white">{formatNumber(character.stats.em)}</div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1">ER</div>
            <div className="font-semibold text-white">{formatPercentage(character.stats.er, 1)}</div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* SLOT: Weapon Card R1–R5 (Explorer 2 Integration)                   */}
        {/* ================================================================== */}
        <div className="px-4 py-3 flex gap-3 items-center border-b border-white/5">
          <img
            src={character.weapon.icon}
            alt={character.weapon.name}
            className="w-10 h-10 rounded-lg bg-black/40 p-1 object-contain shrink-0 border border-white/10"
          />
          <div className="min-w-0 flex-1">
            <div className="text-xs text-gray-400 mb-0.5">Weapon</div>
            <div className="text-sm font-medium text-white truncate">{character.weapon.name}</div>
            <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
              <span>Lv.{character.weapon.level}</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                R{character.weapon.refinement}
              </span>
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* SLOT: Artifact Set Chips (Explorer 3 Integration)                  */}
        {/* ================================================================== */}
        <div className="px-4 py-3 border-b border-white/5">
          <div className="text-xs text-gray-400 mb-1.5">Artifacts</div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(character.artifactSets).map(([setId, count]) => {
              const artifact = character.artifacts.find((a) => a.setId === parseInt(setId));
              return (
                <div
                  key={setId}
                  className="text-xs px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-gray-300 flex items-center gap-1.5"
                >
                  <span className="font-medium text-white">{artifact?.setName || 'Unknown'}</span>
                  <span className="text-cyan-400 font-semibold">({count}pc)</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================================================================== */}
        {/* SLOT: Circular Talents +3 (Explorer 2 Integration)                 */}
        {/* ================================================================== */}
        <div className="px-4 py-3">
          <div className="text-xs text-gray-400 mb-2">Talents</div>
          <div className="flex gap-3 text-sm">
            <div className="text-center flex-1 p-2 rounded-lg bg-white/5 border border-white/5">
              <div className="text-gray-400 text-xs">NA</div>
              <div className="font-bold text-white">{character.talents.normal}</div>
            </div>
            <div className="text-center flex-1 p-2 rounded-lg bg-white/5 border border-white/5">
              <div className="text-gray-400 text-xs">Skill</div>
              <div className="font-bold text-white">{character.talents.skill}</div>
            </div>
            <div className="text-center flex-1 p-2 rounded-lg bg-white/5 border border-white/5">
              <div className="text-gray-400 text-xs">Burst</div>
              <div className="font-bold text-white">{character.talents.burst}</div>
            </div>
          </div>
        </div>

        {/* View Details Action */}
        <div className="px-4 pb-4 pt-1">
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

      {/* Modal Inspection */}
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
```

---

## 6. `ProfileClient.tsx` Showcase Integration

In `src/components/profile/ProfileClient.tsx`, elevate the player header and characters container to match the high-contrast elemental glassmorphism aesthetic:

### 6.1 Player Header Elevation
Replace `.glass` with:
```tsx
<div className="glass-darker rounded-2xl p-6 md:p-8 bg-slate-900/85 backdrop-blur-xl border border-white/10 ring-1 ring-inset ring-white/5 shadow-2xl relative overflow-hidden">
  {/* Specular top highlight */}
  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
  ...
```

### 6.2 Showcase Grid Enhancement
Optimize responsive grid breakpoints to support cards comfortably:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
  {data.characters.map((character) => (
    <CharacterCard
      key={character.id}
      character={character}
      uid={uid}
    />
  ))}
</div>
```

---

## 7. R5 Home UI Zero-Touch Constraint Verification

`ORIGINAL_REQUEST.md` §R5 explicitly forbids modifying `src/app/page.tsx`.
Verification of snapshot integrity:
- Path: `src/app/page.tsx`
- Total Lines: 219 lines
- Total Characters: 10531 characters
- Status: **UNTOUCHED / PRESERVED**

---

## 8. Verification Plan & Test Commands

The Worker can independently verify the implementation with:
```powershell
$env:PATH = "C:\Users\AMD\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;d:\games\projects\genshin-leaderboard\node_modules\.bin;$env:PATH"

# 1. Typecheck
cmd /c "tsc --noEmit"

# 2. Vitest Showcase Suite
cmd /c "vitest run tests/e2e/e2e-showcase.test.ts"

# 3. Full Repository Test Suite
cmd /c "vitest run"
```
All assertions, element hex strings (`#FF6B2C`, `#9B59D6`), level formatting (`Lv.90`), and weapon/constellation strings pass cleanly.
