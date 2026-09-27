# AetherRank - Project Context for AI Assistants

## Overview
**AetherRank** is a modern Genshin Impact Build & Damage Leaderboard web application. It allows users to enter their Genshin Impact UID, fetches their publicly showcased characters in real-time, calculates optimal rotation damage, and ranks them against other players.

## Tech Stack
*   **Framework**: Next.js 14 (App Router)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS (emphasizing dark mode, glassmorphism panels, and neon cyan/blue accents)
*   **Animations**: Framer Motion
*   **Icons & Assets**: Hosted locally in `public/icons/`
*   **Third-Party API**: [Enka.Network](https://enka.network/) (for real-time user showcase data)

## Core Architecture

### 1. Game Data Pipeline (Static Data)
To avoid hardcoding character and item metadata, the project utilizes a dynamic data-fetching script:
*   **Script Location**: `scripts/update-game-data.ts`
*   **Command**: `npm run data:update`
*   **Functionality**: 
    *   Downloads the latest `characters.json` and `loc.json` from Enka's open-source API-docs repository.
    *   Downloads over 1,000+ high-quality game assets (character avatars, gacha splashes, artifact icons) directly into the `public/icons/` directory.
    *   Generates a strongly-typed TypeScript dictionary at `src/lib/enka/game-data.generated.ts` containing elements, rarities, weapon types, text map hashes, and skill orders.

### 2. Enka API Integration
The app fetches real-time player showcases when a UID is queried.
*   **`src/lib/enka/client.ts`**: Handles the HTTP requests to the Enka API.
*   **`src/lib/enka/parser.ts`**: Takes the raw JSON response from Enka and parses it into a clean, strongly-typed `Character` object (defined in `types.ts`). It cross-references hashes with `game-data.generated.ts` to output localized names and assigns the correct local image paths.
*   **Fallback Logic**: For brand new patches, if a character/artifact isn't in the generated data, the parser gracefully falls back to using Enka Network's live CDN URLs and default strings to ensure the UI never breaks.

### 3. Frontend / UI Components
The UI is strictly designed with a premium, futuristic gaming aesthetic.
*   **Home Page (`src/app/page.tsx`)**: Features a clean UID search bar, gradient text, and a feature grid highlighting the app's capabilities.
*   **Character Rendering**: 
    *   `src/components/character/CharacterCard.tsx`: A compact preview of a character's core stats, crits, and equipped weapon.
    *   `src/components/character/CharacterDetailModal.tsx`: A stunning full-screen modal showcasing the character's Gacha splash art, detailed artifact roll analysis, and a damage calculator breakdown.
    *   `src/components/character/ArtifactDisplay.tsx`: Renders individual artifact pieces with their sub-stat roll qualities.

## Development Guidelines for AI
1.  **Styling**: Always adhere to the established glassmorphism design. Use `glass` or `glass-darker` utility classes for panels. Always include subtle hover animations (`framer-motion` or Tailwind `hover:scale`) for interactivity.
2.  **Images**: Game icons should use standard HTML `<img>` tags pointing to local paths (e.g., `/icons/characters/{id}.png`) or `character.icon` as processed by `parser.ts`. 
3.  **Data Integrity**: Never hardcode new Genshin Impact characters, weapons, or artifacts. Instead, instruct the user to run `npm run data:update` to sync the newest patch data into `game-data.generated.ts`.
4.  **Error Handling**: Always account for missing data. Assume new patches may introduce "Unknown Characters" and ensure fallback URLs and strings are safely handled.
