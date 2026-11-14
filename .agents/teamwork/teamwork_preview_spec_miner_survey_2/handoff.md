# Handoff Report: Survey Phase Specification Mining

**Agent**: Spec Miner Survey 2  
**Working Directory**: `d:\games\projects\genshin-leaderboard\.agents\teamwork\teamwork_preview_spec_miner_survey_2`  
**Recipient**: Project Orchestrator (`362449e4-d3ad-44eb-8a45-fc8962d6b0ad`)  
**Type**: Hard Handoff  

---

## 1. Observation

1. **`src/lib/enka/static-data.ts` (lines 68–83)**:
   ```ts
   export const ARTIFACT_SETS: Record<number, string> = {
     15008: 'Emblem of Severed Fate',
     15020: 'Golden Troupe',
     15025: 'Obsidian Codex',
     14001: 'Gladiator\'s Finale',
     ...
   };
   ```
   Only 14 sets are mapped to plain string names. Zero 2-piece and 4-piece set bonus descriptions exist anywhere in the codebase.

2. **`src/components/character/ArtifactDisplay.tsx` (lines 23–30)**:
   ```tsx
   const getStatDisplay = (key: string, value: number) => {
     const isPercentage = ['cr', 'cd', 'er', 'hpPercent', 'atkPercent', 'defPercent'].includes(key) || key.includes('DmgBonus');

     if (isPercentage) {
       return formatPercentage(value * 100, 1);
     }
     return value.toFixed(0);
   };
   ```
   And `src/lib/utils.ts` (line 16):
   ```ts
   export function formatPercentage(num: number, decimals: number = 1): string {
     return `${num.toFixed(decimals)}%`;
   }
   ```
   When `value` is already a percentage (e.g. `46.6`), line 27 passes `46.6 * 100 = 4660` into `formatPercentage`, resulting in `4660.0%`.

3. **`src/lib/enka/parser.ts` (lines 207–215)**:
   ```ts
   const isPercentageStat = ['cr', 'cd', 'er', 'hpPercent', 'atkPercent', 'defPercent'].includes(key) || key.includes('DmgBonus');
   const displayValue = isPercentageStat ? sub.statValue * 100 : sub.statValue;

   return {
     key,
     value: sub.statValue,
     rolls: estimateRollCount(key, displayValue),
   };
   ```
   In live Enka API responses, `sub.statValue` is already `7.8` or `14.0`. Multiplying by 100 sets `displayValue` to `780` or `1400`, corrupting `estimateRollCount`.

4. **`src/lib/enka/static-data.ts` (lines 142–148)**:
   ```ts
   export function estimateRollCount(statKey: string, value: number): number {
     const rolls = SUBSTAT_ROLLS[statKey];
     if (!rolls) return 0;

     const avgRoll = (rolls[0] + rolls[1] + rolls[2] + rolls[3]) / 4;
     return Math.round(value / avgRoll);
   }
   ```
   For 3 Tier 1 rolls of CR (`3 * 2.72 = 8.16%`), `Math.round(8.16 / 3.305) = Math.round(2.468) = 2`, incorrectly undercounting 3 rolls as 2 rolls even though 2 rolls cannot mathematically exceed `2 * 3.89 = 7.78%`.

5. **`store/gi/weapons.json` & Enka API `flat.weaponStats`**:
   Enka responses only return `baseAtk` and `subStat` in `flat.weaponStats`. They do NOT provide weapon passive names, refinement scaling templates, or passive descriptions.

6. **`src/lib/enka/game-data.generated.ts` (`GAME_CHARACTERS[id].consts`)**:
   Constellation asset icon naming directly encodes talent boosts:
   - Line 40: `"UI_Talent_U_Ayaka_02"` (`_02` = Burst at C3)
   - Line 42: `"UI_Talent_U_Ayaka_01"` (`_01` = Skill at C5)
   - Line 1573: `"UI_Talent_U_Neuvillette_01"` (`_01` = Normal Attack at C3)
   - Line 1575: `"UI_Talent_U_Neuvillette_02"` (`_02` = Burst at C5)

---

## 2. Logic Chain

1. **Missing Set Bonuses**: Because `static-data.ts` and `game-data.generated.ts` lack bonus descriptions (Obs 1), interactive chips and active set banners cannot render without a newly provided lookup dictionary (`ARTIFACT_SET_DATA` in `src/lib/enka/`).
2. **100x Multiplication Bug**: Live Enka data supplies `statValue` in percentage units (`46.6`), while `parser.ts` line 208 and `ArtifactDisplay.tsx` line 27 both independently attempted to multiply by 100 (Obs 2 & 3). Therefore, fixing this requires normalizing incoming `statValue` once in `parser.ts` (checking `if (isPercent && val <= 1.0) val *= 100`) and removing `* 100` from `ArtifactDisplay.tsx:27`.
3. **Roll Count Accuracy**: Average division `Math.round(val / avg)` fails for multi-tier combinations near boundary conditions (Obs 4). A bounded search iterating $k \in [1, 6]$ against $[k \times \text{minRoll}, k \times \text{maxRoll}]$ guarantees 100% authentic roll counts.
4. **Weapon Passives**: Since Enka API does not return passive text (Obs 5), a client-side dictionary mapping `itemId` to `{ passiveName, descriptionTemplate, refinements }` must be introduced in `src/lib/enka/`.
5. **Constellation Boosts**: Because Fontaine/Natlan characters (e.g. Neuvillette, Arlecchino) boost Normal Attack at C3 rather than Elemental Skill (Obs 6), a deterministic character talent boost dictionary (`CHARACTER_TALENT_BOOSTS`) is required to drive the `+3` visual badge.

---

## 3. Caveats

1. **Traveler Elements**: The Traveler (Aether/Lumine) switches elements, changing skill depot IDs and talent boost assignments. The survey accounts for standard Traveler elements, but default fallback should handle unmapped depot configurations gracefully.
2. **Weapons Beyond Featured Roster**: Over 200 weapons exist in Genshin Impact. The specification includes 25+ top meta and showcase weapons. For uncataloged 3★/4★ weapons, a fallback rendering mechanism (displaying base ATK, substat, and weapon name without passive description) must be implemented.
3. **No Code Modification Constraint**: In adherence to the survey phase rules, no source files were edited or created outside `.agents/teamwork/teamwork_preview_spec_miner_survey_2/`.

---

## 4. Conclusion

All 5 survey objectives are thoroughly specified and documented with complete data tables in `analysis.md`:
1. Full 2pc and 4pc set skill descriptions for 39 artifact sets (all 5★ sets and key 4★ sets).
2. Complete weapon metadata specifications covering Lv90 Base ATK curves, substat ranges, passive names, and R1–R5 refinement scaling.
3. Universal Crit Value formula (`CV = 2 * CR + CD`) and badge thresholds for individual pieces (Subpar, Decent, Good, Great, Godly) and total builds.
4. Theoretical 4-tier roll values for all 10 substats, bounded roll derivation logic, visual pips `[●●●○]`, and the exact fix for the 100x multiplication error.
5. Accurate constellation boost (+3) detection logic distinguishing Normal Attack, Skill, and Burst across characters.

---

## 5. Verification Method

1. **Inspection**:
   - Inspect `d:\games\projects\genshin-leaderboard\.agents\teamwork\teamwork_preview_spec_miner_survey_2\analysis.md` for full tables and code snippets.
2. **Formula Verification**:
   - Check bounded roll count: for `cr = 8.16`, `calculateRollCount('cr', 8.16) === 3` (avoids naive division result of 2).
   - Check CV: for `cr = 10.5, cd = 14.0`, `calculateCritValue(10.5, 14.0) === 35.0` (Good tier).
   - Check 100x fix: for `value = 46.6`, `formatPercentage(value, 1) === "46.6%"`.
   - Check talent boost: `evaluateTalents(10000087, 3, { normal: 10, skill: 10, burst: 10 })` gives `normal.boosted === true`.
3. **Invalidation Conditions**:
   - Any stat value rendering with double percentages (e.g. `4660.0%`).
   - Hardcoding C3 to always boost Elemental Skill for all characters.
   - Any modification to `src/app/page.tsx`.
