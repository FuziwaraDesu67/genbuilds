# Database Setup Guide

This guide walks you through setting up the PostgreSQL database and Redis cache for the Genshin Impact Leaderboard.

## Prerequisites

- Node.js 18+ and npm installed
- Project dependencies installed (`npm install`)

## Option 1: Neon (Recommended for Development)

Neon provides a free PostgreSQL database with generous limits.

### Step 1: Create a Neon Account

1. Go to https://neon.tech
2. Sign up for a free account
3. Create a new project (name it something like "genshin-leaderboard")
4. Select your preferred region

### Step 2: Get Database URL

1. In your Neon dashboard, go to your project
2. Copy the connection string (it looks like: `postgresql://user:password@host.region.neon.tech/dbname`)
3. Make sure it includes `?sslmode=require` at the end

### Step 3: Set Environment Variable

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your Neon database URL:

```env
DATABASE_URL=postgresql://user:password@host.region.neon.tech/dbname?sslmode=require
```

## Option 2: Local PostgreSQL

If you prefer running PostgreSQL locally:

### Step 1: Install PostgreSQL

**Windows:**
- Download from https://www.postgresql.org/download/windows/
- Run the installer and set a password for the `postgres` user

**Mac:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Linux:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Step 2: Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE genshin_leaderboard;

# Exit
\q
```

### Step 3: Set Environment Variable

Add to `.env`:

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/genshin_leaderboard
```

## Redis Setup (Upstash)

Upstash provides a free Redis instance perfect for development.

### Step 1: Create Upstash Account

1. Go to https://upstash.com
2. Sign up for a free account
3. Click "Create Database"
4. Choose a name and select your region
5. Select "Free" tier

### Step 2: Get Redis Credentials

1. In your database dashboard, click "REST API"
2. Copy the `UPSTASH_REDIS_REST_URL`
3. Copy the `UPSTASH_REDIS_REST_TOKEN`

### Step 3: Add to Environment Variables

Add to `.env`:

```env
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

## Running Migrations

Once you have your database and Redis configured:

### Step 1: Generate Migrations (Already Done)

The migration files are already generated in the `drizzle/` folder.

### Step 2: Push Schema to Database

```bash
npm run db:push
```

This will create the `players` and `builds` tables with all indexes and constraints.

### Step 3: Seed Test Data (Optional)

To populate the database with sample data for testing:

```bash
npm run db:seed
```

This creates:
- 3 sample players
- 4 sample builds (Hu Tao, Neuvillette, Raiden)

## Verify Setup

### Check Database Connection

```bash
npm run db:studio
```

This opens Drizzle Studio at http://localhost:4983 where you can browse your database.

### Check Tables

You should see:
- `players` table with columns: uid, nickname, ar, signature, namecard_id, updated_at
- `builds` table with columns: id, uid, avatar_id, weapon_id, artifact_sets, stats, talent_levels, constellation, calculated_damage, calc_details, updated_at

### Indexes

The following indexes should be created:
- `idx_builds_leaderboard` on (avatar_id, calculated_damage) for fast leaderboard queries
- `idx_builds_uid` on (uid) for fast player lookup

## Troubleshooting

### Connection Issues

**Error: "getaddrinfo ENOTFOUND"**
- Check your DATABASE_URL is correct
- Ensure you have internet access for cloud databases

**Error: "password authentication failed"**
- Verify your username and password in DATABASE_URL
- For Neon, regenerate the connection string from the dashboard

**Error: "SSL connection required"**
- Add `?sslmode=require` to your Neon connection string

### Migration Issues

**Error: "relation already exists"**
- Your tables may already be created
- Run `npm run db:studio` to check existing tables
- If needed, drop tables and re-run migrations

### Redis Issues

**Error: "Missing Redis environment variables"**
- Ensure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set in `.env`
- Check for typos in the variable names

**Error: "Unauthorized"**
- Verify your UPSTASH_REDIS_REST_TOKEN is correct
- Regenerate the token from Upstash dashboard if needed

## Environment Variables Checklist

Make sure your `.env` file has all required variables:

```env
# ✓ Database
DATABASE_URL=postgresql://...

# ✓ Redis
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# ✓ Enka API
ENKA_USER_AGENT=GenshinLeaderboard/1.0 (contact: your-email@example.com)

# ✓ App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Next Steps

Once your database is set up:

1. Start the development server: `npm run dev`
2. Test the API: Visit http://localhost:3000/api/player/123456789 (will show error for invalid UID, which is expected)
3. Continue to Milestone C to build the profile UI

## Production Deployment

For production (Vercel):

1. Add environment variables in Vercel dashboard under Settings → Environment Variables
2. Migrations run automatically on build
3. Use Neon's connection pooler for production: replace the host with `pooler.host.region.neon.tech`
