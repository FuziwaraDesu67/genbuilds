// @ts-check
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://gi.yatta.moe/api/v2/en/avatar';
const OUTPUT_FILE = path.resolve(__dirname, '../src/lib/enka/constellations.generated.json');

/**
 * @typedef {Object} ConstellationEntry
 * @property {number} level
 * @property {string} name
 * @property {string} description
 * @property {string} [icon]
 */

/**
 * @typedef {Object} CharacterConstellationData
 * @property {string} id
 * @property {string} name
 * @property {string} element
 * @property {number} rank
 * @property {ConstellationEntry[]} constellations
 */

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, retries = 3, delay = 500) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      return await res.json();
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`[Retry ${attempt}/${retries}] Failed to fetch ${url}: ${err.message}. Waiting ${delay}ms...`);
      await sleep(delay);
    }
  }
}

async function main() {
  console.log('📡 Fetching character list from Yatta API...');
  const indexJson = await fetchWithRetry(BASE_URL);
  if (!indexJson || !indexJson.data || !indexJson.data.items) {
    throw new Error('Invalid response structure from Yatta API');
  }

  const items = indexJson.data.items;
  const charIds = Object.keys(items);
  console.log(`✅ Discovered ${charIds.length} characters in Yatta database.`);

  /** @type {Record<string, CharacterConstellationData>} */
  const resultsById = {};
  /** @type {Record<string, ConstellationEntry[]>} */
  const constellationsById = {};
  /** @type {Record<string, ConstellationEntry[]>} */
  const constellationsByName = {};

  const BATCH_SIZE = 5;
  const DELAY_BETWEEN_BATCHES_MS = 150;

  let completed = 0;

  for (let i = 0; i < charIds.length; i += BATCH_SIZE) {
    const batch = charIds.slice(i, i + BATCH_SIZE);
    
    await Promise.all(
      batch.map(async (charId) => {
        try {
          const detailUrl = `${BASE_URL}/${charId}`;
          const detailJson = await fetchWithRetry(detailUrl);
          const charData = detailJson?.data;
          if (!charData) return;

          const rawConsts = charData.constellation || {};
          // Yatta constellation keys are '0', '1', '2', '3', '4', '5' (C1 - C6)
          const constList = Object.keys(rawConsts)
            .sort((a, b) => Number(a) - Number(b))
            .map((k, idx) => {
              const item = rawConsts[k];
              return {
                level: idx + 1,
                name: (item.name || '').trim(),
                description: (item.description || '').replace(/\\n/g, '\n').trim(),
                icon: (item.icon || '').trim(),
              };
            });

          resultsById[charId] = {
            id: charId,
            name: charData.name,
            element: charData.element,
            rank: charData.rank,
            constellations: constList,
          };

          constellationsById[charId] = constList;

          // Normalized name index for flexible lookups
          const normName = (charData.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          if (normName) {
            // If character is traveler, keep element variant e.g. traveleranemo, travelergeo
            if (charId.includes('-')) {
              const suffix = charId.split('-')[1];
              constellationsByName[`${normName}${suffix}`] = constList;
            } else {
              constellationsByName[normName] = constList;
            }
          }

          // Special handling for Traveler IDs (Aether 10000005 and Lumine 10000007)
          if (charId.startsWith('10000007-')) {
            const element = charId.replace('10000007-', '');
            // Alias for Lumine and Aether
            constellationsById[`10000005-${element}`] = constList;
          }

          completed++;
          process.stdout.write(`\rProgress: [${completed}/${charIds.length}] Fetched ${charData.name} (${charId})...`);
        } catch (err) {
          console.error(`\n❌ Failed to fetch character ${charId}:`, err.message);
        }
      })
    );

    if (i + BATCH_SIZE < charIds.length) {
      await sleep(DELAY_BETWEEN_BATCHES_MS);
    }
  }

  console.log(`\n\n🎉 Successfully fetched ${Object.keys(resultsById).length} characters!`);

  const outputPayload = {
    updatedAt: new Date().toISOString(),
    totalCharacters: Object.keys(resultsById).length,
    byId: constellationsById,
    byName: constellationsByName,
    characters: resultsById,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputPayload, null, 2), 'utf-8');
  console.log(`💾 Saved to ${OUTPUT_FILE} (${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(1)} KB)`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
