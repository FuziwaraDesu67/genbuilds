# Genshin Impact Build & Damage Leaderboard - Architecture Plan

## Overview
Full-stack Next.js app for viewing Genshin Impact character builds and comparing them on damage leaderboards. Data sourced from Enka.Network API. Original branding/design, inspired by akasha.cv functionality.

## Tech Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion
- **Background**: WebGL (OGL library for fluid simulation)
- **Database**: Postgres (Neon free tier) with Drizzle ORM
- **Cache**: Upstash Redis for Enka response caching and rate limiting
- **Deploy**: Vercel free tier

## Enka API Integration (from official docs)
- **Endpoint**: `https://enka.network/api/uid/{UID}/`
- **Headers**: Must include custom User-Agent: `GenshinLeaderboard/1.0 (contact: dev@example.com)`
- **Response**: `{playerInfo, avatarInfoList, ttl}`
- **TTL**: Cache responses in Redis until ttl expires, show countdown in UI
- **Error codes**: 400 (bad UID), 404 (not found), 424 (maintenance), 429 (rate limit), 500/503 (server)
- **Rate limiting**: Dynamic; respect ttl to avoid quota burn
- **Static data**: Need to source separately (character names, element mappings, skill data, etc.)

## Architecture

### Folder Structure
```
genshin-leaderboard/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Home with UID search
│   │   ├── u/[uid]/page.tsx         # Player profile
│   │   ├── leaderboard/[characterId]/page.tsx
│   │   ├── api/
│   │   │   ├── player/[uid]/route.ts       # Fetch from Enka + cache
│   │   │   ├── leaderboard/[charId]/route.ts
│   │   │   └── refresh/[uid]/route.ts
│   │   └── layout.tsx               # Root layout with WebGL background
│   ├── lib/
│   │   ├── enka/
│   │   │   ├── client.ts            # Enka API client
│   │   │   ├── parser.ts            # Raw response → domain types
│   │   │   ├── types.ts             # Zod schemas + TS types
│   │   │   └── static-data.ts       # Character/weapon/artifact metadata
│   │   ├── db/
│   │   │   ├── schema.ts            # Drizzle schema
│   │   │   └── queries.ts           # Leaderboard queries
│   │   ├── redis.ts                 # Upstash client + cache helpers
│   │   ├── damage-calc/
│   │   │   ├── engine.ts            # Core damage formula
│   │   │   └── configs/             # Per-character JSON configs
│   │   └── utils.ts
│   ├── components/
│   │   ├── background/
│   │   │   └── WebGLBackground.tsx  # Fluid simulation canvas
│   │   ├── character/
│   │   │   ├── CharacterCard.tsx
│   │   │   ├── StatsPanel.tsx
│   │   │   └── ArtifactDisplay.tsx
│   │   ├── leaderboard/
│   │   │   └── LeaderboardTable.tsx
│   │   └── ui/                      # Reusable UI components
│   └── styles/
│       └── globals.css
├── public/
├── drizzle/                          # Migrations
├── tests/
│   └── enka-parser.test.ts
├── .env.example
└── README.md
```

### Database Schema (Drizzle)
```sql
-- players table
CREATE TABLE players (
  uid TEXT PRIMARY KEY,
  nickname TEXT NOT NULL,
  ar INTEGER NOT NULL,
  signature TEXT,
  namecard_id INTEGER,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- builds table
CREATE TABLE builds (
  id SERIAL PRIMARY KEY,
  uid TEXT NOT NULL,
  avatar_id INTEGER NOT NULL,
  weapon_id INTEGER NOT NULL,
  artifact_sets JSONB NOT NULL,        -- {set_id: piece_count}
  stats JSONB NOT NULL,                 -- {hp, atk, def, cr, cd, em, er, dmg_bonus}
  talent_levels JSONB NOT NULL,         -- {normal, skill, burst}
  constellation INTEGER NOT NULL,
  calculated_damage DECIMAL(12,2),     -- Primary leaderboard metric
  calc_details JSONB,                   -- Full calc breakdown
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(uid, avatar_id)
);

CREATE INDEX idx_builds_leaderboard ON builds(avatar_id, calculated_damage DESC);
CREATE INDEX idx_builds_uid ON builds(uid);
```

### Redis Keys
- `enka:uid:{uid}` → full Enka response JSON, TTL = response.ttl
- `ratelimit:ip:{ip}` → request counter for rate limiting our own API

## Core Flows

### 1. Player Lookup Flow
```
User enters UID → 
  Check Redis cache → 
    HIT: return cached + calc remaining TTL for countdown → 
    MISS: fetch Enka API → 
      Parse response → 
      Cache in Redis with TTL → 
      Upsert player + builds to DB → 
      Return data
```

### 2. Damage Calculation
```typescript
// Simplified formula (per character config)
damage = (
  (base_atk * talent_multiplier + flat_dmg) 
  * (1 + dmg_bonus_pct) 
  * crit_multiplier 
  * def_multiplier 
  * res_multiplier 
  * reaction_multiplier
)

// Standard test enemy: Lv90, 10% base RES, DEF multiplier ~0.5
// Config per character: talent_multiplier, rotation steps, reaction type
```

### 3. Leaderboard Query
```sql
SELECT 
  b.*,
  p.nickname,
  PERCENT_RANK() OVER (
    PARTITION BY avatar_id 
    ORDER BY calculated_damage DESC
  ) as percentile
FROM builds b
JOIN players p ON b.uid = p.uid
WHERE avatar_id = ?
  AND (weapon_id = ? OR ? IS NULL)
  AND (constellation >= ? OR ? IS NULL)
ORDER BY calculated_damage DESC
LIMIT 50 OFFSET ?;
```

## WebGL Background Implementation
- **Library**: OGL (lightweight WebGL wrapper)
- **Effect**: Fluid simulation using fragment shader ping-pong
  - Velocity field with curl noise
  - Cursor injects velocity + force
  - Advection step with domain warping
  - Soft glow post-processing
- **Elemental theming**: Swap shader uniforms for element colors
  - Pyro: #FF6B2C → #FF4500
  - Hydro: #00BFFF → #1E90FF
  - Electro: #9B59D6 → #8A2BE2
  - Cryo: #4DD0E1 → #00CED1
  - Dendro: #7CB342 → #9ACD32
  - Anemo: #4FC3F7 → #87CEEB
  - Geo: #FFB74D → #DAA520
  - Default: #1A237E → #0D47A1
- **Performance**:
  - Cap devicePixelRatio at 1.5
  - Adaptive resolution (downscale if <50fps)
  - Pause on visibilitychange
  - Mobile: lower resolution + simplified shader
  - prefers-reduced-motion: static gradient fallback

## Milestones

### Milestone A: Foundation + Enka Client ✅ COMPLETE
- [x] Project scaffold (Next.js 14 + TypeScript + Tailwind)
- [x] Enka client module with Zod validation
- [x] Static data loader (character/weapon/artifact mappings)
- [x] Redis cache layer
- [x] Parser (raw Enka → domain types)
- [x] Unit tests with fixture data (9/9 passing)
- [x] Typecheck + build (both passing)

### Milestone B: Database + Upsert Logic ✅ COMPLETE
- [x] Drizzle schema + migrations
- [x] Migration scripts (generate, migrate, push)
- [x] Database connection with lazy initialization
- [x] Player/builds upsert on Enka fetch
- [x] Basic leaderboard query
- [x] Test data seeding script
- [x] Database setup documentation

### Milestone C: Profile UI ✅ COMPLETE
- [x] Home page (UID search + validation)
- [x] Profile page layout (/u/[uid])
- [x] Character showcase carousel
- [x] Character cards with quick stats
- [x] Character detail modal (stats, artifacts, weapon, damage)
- [x] Artifact display with roll quality indicators
- [x] Stats panel with crit value calculation
- [x] Refresh countdown timer
- [x] Error handling and loading states
- [x] 404 page for invalid UIDs
- [x] Responsive design
- [x] SSR + dynamic metadata

### Milestone D: WebGL Background ✅ COMPLETE
- [x] Canvas-based particle system with fluid simulation
- [x] Element-themed color gradients (Pyro, Hydro, Cryo, etc.)
- [x] Smooth color transitions when element changes
- [x] Cursor interaction (velocity injection, particle influence)
- [x] Touch support for mobile devices
- [x] Performance monitoring (60 FPS target, capped DPR at 1.5)
- [x] Adaptive quality based on device capabilities
- [x] Pause rendering on visibility change
- [x] Fallbacks: reduced-motion (static gradient), no-webgl (CSS gradient)
- [x] Background context provider for global element theming
- [x] Integration with profile pages (first character's element)
- [x] Fixed z-index positioning behind content
- [x] Pointer-events: none to allow interaction with UI

### Milestone E: Damage Engine + Leaderboards
- [ ] Damage calc engine core
- [ ] 6-8 character configs (popular DPS: Hu Tao, Neuvillette, Arlecchino, Raiden, Ayaka, Ganyu)
- [ ] Leaderboard page with filters
- [ ] Rank + percentile display
- [ ] Animated list reordering on filter change

### Milestone F: Polish + Export
- [ ] Framer Motion shared-element transitions
- [ ] Staggered reveals, number count-ups
- [ ] Build card PNG export (html-to-image)
- [ ] Skeleton loaders
- [ ] Dark glassmorphism theme polish
- [ ] Responsive design pass
- [ ] Accessibility audit (ARIA, keyboard nav, focus states)

### Milestone G: Deploy
- [ ] Environment variables setup
- [ ] .env.example + README
- [ ] Vercel deployment
- [ ] Test production build
- [ ] Footer disclaimers

## Static Data Strategy
Since Enka API docs don't provide static data endpoints, we'll:
1. Create a `src/lib/enka/static-data.json` with essential mappings:
   - Character ID → name, element, weapon type, icon path
   - Weapon ID → name, rarity, base ATK
   - Artifact set ID → name, piece count for bonus
   - Fight prop ID → stat name (FIGHT_PROP_HP → "HP")
2. Source from community resources or manual entry for initial 6-8 characters
3. Icons via `https://enka.network/ui/{asset}.png` (configure next/image remotePatterns)

## Rate Limiting Strategy
- Per-IP rate limit: 10 requests/minute to our API routes
- Redis counter with 60s sliding window
- Return 429 with Retry-After header
- Client shows rate limit cooldown

## Caching Strategy
- **Enka responses**: Redis with TTL from response (typically 5-10 min)
- **Static data**: In-memory after first load, revalidate daily
- **Leaderboard pages**: ISR with 5min revalidate
- **Profile pages**: ISR with 1min revalidate

## Notes & Decisions
- **Original branding**: Placeholder name "AetherRank" (to be replaced), custom logo, distinct UI style
- **Damage calc accuracy**: Labeled as "estimated" with standardized enemy, not a simulation
- **Character priority**: Start with 6-8 popular DPS, data-driven config for easy expansion
- **Mobile**: Full responsive, lighter WebGL quality, touch interactions
- **Phase 2 scope**: Weapon/artifact leaderboards (structure DB for it, implement if time allows)

## Dependencies
```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "framer-motion": "^11.0.0",
    "ogl": "^1.0.0",
    "drizzle-orm": "^0.33.0",
    "@neondatabase/serverless": "^0.9.0",
    "@upstash/redis": "^1.34.0",
    "zod": "^3.23.0",
    "html-to-image": "^1.11.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "typescript": "^5.5.0",
    "tailwindcss": "^3.4.0",
    "drizzle-kit": "^0.24.0",
    "vitest": "^2.0.0"
  }
}
```

---
**Start date**: 2026-09-21
**Target completion**: Milestone F (full feature set)
