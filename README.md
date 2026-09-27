# Genshin Impact Build & Damage Leaderboard

A full-stack web application for viewing Genshin Impact character builds and competing on damage leaderboards. Built with Next.js, featuring an interactive WebGL fluid simulation background and real-time data from Enka.Network.

## Features

- 🔍 **Player Profile Lookup** - Search any UID and view showcase characters
- 📊 **Damage Leaderboards** - Compare builds across all players for each character
- 🎯 **Detailed Build Analysis** - Stats, artifacts, weapons, talent levels, and calculated damage
- 🌊 **Interactive Background** - GPU-accelerated fluid simulation with element theming
- ⚡ **Real-time Caching** - Redis-backed caching with TTL countdown
- 🎨 **Glassmorphism UI** - Modern dark theme with smooth animations

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Background**: WebGL (OGL library)
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Cache**: Upstash Redis
- **Data Source**: Enka.Network API
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Neon free tier works)
- Upstash Redis instance

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd genshin-leaderboard
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
# Database (Neon Postgres)
DATABASE_URL=postgresql://user:password@host/dbname

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here

# Enka API
ENKA_USER_AGENT=GenshinLeaderboard/1.0 (contact: your-email@example.com)

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Generate and run database migrations:
```bash
npm run db:generate
npm run db:migrate
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm test` - Run unit tests
- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:migrate` - Apply database migrations

## Project Structure

```
genshin-leaderboard/
├── src/
│   ├── app/                        # Next.js App Router pages
│   │   ├── api/                    # API routes
│   │   │   ├── player/[uid]/       # Fetch player data from Enka
│   │   │   └── leaderboard/[characterId]/ # Leaderboard data
│   │   ├── u/[uid]/                # Player profile page
│   │   ├── leaderboard/[characterId]/ # Character leaderboard page
│   │   └── layout.tsx              # Root layout
│   ├── components/
│   │   ├── background/             # WebGL fluid simulation
│   │   ├── character/              # Character cards & stats
│   │   ├── leaderboard/            # Leaderboard table
│   │   └── ui/                     # Reusable UI components
│   ├── lib/
│   │   ├── enka/                   # Enka API client & parser
│   │   ├── db/                     # Database schema & queries
│   │   ├── damage-calc/            # Damage calculation engine
│   │   ├── redis.ts                # Redis cache utilities
│   │   └── utils.ts                # Helper functions
│   └── styles/
│       └── globals.css             # Global styles
├── tests/                          # Unit tests
├── drizzle/                        # Database migrations
└── public/                         # Static assets
```

## API Routes

### GET `/api/player/[uid]`

Fetch player data from Enka.Network. Automatically caches responses and upserts to database.

**Query params**: None

**Response**:
```json
{
  "player": { "uid": "123456789", "nickname": "...", "level": 60 },
  "characters": [...],
  "ttl": 300,
  "fromCache": false
}
```

### GET `/api/leaderboard/[characterId]`

Get leaderboard rankings for a specific character.

**Query params**:
- `weaponId` (optional) - Filter by weapon
- `minConstellation` (optional) - Filter by minimum constellation
- `limit` (optional, default 50) - Results per page
- `offset` (optional, default 0) - Pagination offset

**Response**:
```json
{
  "results": [...],
  "total": 1000,
  "hasMore": true
}
```

## Damage Calculation

Damage is calculated using a standardized formula against a level 90 enemy with 10% base RES. Each character has a configuration defining:
- Primary talent (normal/skill/burst)
- Base multipliers and scaling
- Reaction types (Vaporize, Melt, etc.)
- Additional buffs (passives, weapon effects)

Currently configured characters:
- Hu Tao (Vaporize CA)
- Neuvillette (Charged Attack)
- Arlecchino (Normal Attack combo)
- Raiden Shogun (Burst combo)
- Ayaka (Burst)
- Ganyu (Melt CA)

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

The app is optimized for Vercel's free tier with:
- ISR caching for profile/leaderboard pages
- Redis for Enka response caching
- Serverless API routes

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Disclaimer

This site is not affiliated with HoYoverse. Genshin Impact and all related assets are property of HoYoverse. Player data is provided by Enka.Network.

## Acknowledgments

- [Enka.Network](https://enka.network) for providing the API
- [akasha.cv](https://akasha.cv) for feature inspiration
- HoYoverse for Genshin Impact
