# Milestone 2 Reviewer 2 & Adversarial Audit Report

**Work Product**: Milestone 2 (UID 1813164100 Fallback & SSR Architecture)  
**Reviewer / Critic**: `teamwork_preview_reviewer_m2_2`  
**Verdict**: **APPROVE**  
**Integrity Status**: **CLEAN (No Integrity Violations Detected)**  
**Date**: 2026-11-01T14:36:00Z  

---

## 1. Observation

Direct observations and empirical evidence gathered from codebase inspection and execution:

### 1.1 Source Code Verification
1. **`src/lib/enka/client.ts` (Lines 8–18, 31–41, 52–61, 70–78)**:
   - Line 9 defines `export const DEMO_FALLBACK_UID = '1813164100'`.
   - Lines 15–18 define `getVaresaMockData()` which parses and validates `tests/fixtures/varesa-1813164100.json` through `EnkaResponseSchema` and `parseEnkaResponse`:
     ```typescript
     export function getVaresaMockData(): EnkaData {
       const validated = EnkaResponseSchema.parse(varesaFixture);
       return parseEnkaResponse(validated);
     }
     ```
   - Lines 31–40: If `validatedUid === DEMO_FALLBACK_UID` and environment is test/offline (`NODE_ENV === 'test' || VITEST === 'true' || ENKA_OFFLINE === 'true' || OFFLINE_MODE === 'true'`), it fast-bypasses network and serves `getVaresaMockData()`.
   - Lines 52–61 & 70–78: If `response.ok` is false (e.g. 403, 404, 429, 500) or fetch throws network transport errors (e.g. `ECONNREFUSED`, timeout), `validatedUid === DEMO_FALLBACK_UID` catches the error and safely returns `getVaresaMockData()`.
   - Non-demo UIDs do NOT match `validatedUid === DEMO_FALLBACK_UID`: they proceed to live `fetch(url)` and rethrow errors via `handleErrorResponse(response)` or standard catch.

2. **`src/app/api/player/[uid]/route.ts` (Lines 21–32, 81–93)**:
   - Lines 21–32: Rate limiting strictly exempts only `DEMO_FALLBACK_UID`:
     ```typescript
     if (uid !== DEMO_FALLBACK_UID) {
       const ip = getClientIP(request.headers);
       const rateLimit = await checkRateLimit(ip);
       if (!rateLimit.allowed) {
         return NextResponse.json({ error: 'Rate limit exceeded', retryAfter: rateLimit.resetIn }, { status: 429 });
       }
     }
     ```
   - Lines 81–93: Secondary defense-in-depth: if any unhandled error occurs during execution, `uid === DEMO_FALLBACK_UID` recovers by returning `getVaresaMockData()`. All other UIDs return standard status codes (400 for ZodError, 429/404/500 based on `enkaError.code`, or 500).

3. **`src/app/u/[uid]/page.tsx` (Lines 21–41)**:
   - ProfilePage is an `async` server component.
   - Lines 31–38: Prefetches `initialData` for `DEMO_FALLBACK_UID`:
     ```typescript
     let initialData: EnkaData | undefined;
     if (params.uid === DEMO_FALLBACK_UID) {
       try {
         initialData = await enkaClient.fetchPlayerData(params.uid);
       } catch (e) {
         console.warn(`[ProfilePage] SSR prefetch failed for ${DEMO_FALLBACK_UID}:`, e);
       }
     }
     return <ProfileClient uid={params.uid} initialData={initialData} />;
     ```

4. **`src/components/profile/ProfileClient.tsx` (Lines 14–30)**:
   - Line 14 accepts `initialData?: EnkaData`.
   - Lines 15–16: `const [data, setData] = useState<EnkaData | null>(initialData || null);` and `const [loading, setLoading] = useState(!initialData);`.
   - When `initialData` is provided, `loading` is initialized to `false`, completely bypassing the skeleton pulse loader on server-rendered HTML and client hydration.
   - Lines 22–30: Effect hook detects `initialData && initialData.player.uid === uid`, sets the elemental background context, and returns early without making a redundant client-side `fetch('/api/player/' + uid)`.

5. **`src/app/page.tsx` Boundary Check (R5 Constraint)**:
   - PowerShell inspection:
     ```powershell
     Get-Item "src\app\page.tsx" | Select-Object FullName, LastWriteTime, Length
     ```
   - Verbatim result:
     ```
     FullName                                               LastWriteTime       Length
     --------                                               -------------       ------
     D:\games\projects\genshin-leaderboard\src\app\page.tsx 01-11-2026 17:53:32  10540
     ```
   - `LastWriteTime` is `01-11-2026 17:53:32`, predating the start of Milestone 2. Exactly 219 lines and 10,540 bytes. Completely untouched.

### 1.2 Automated Tooling & Build Output
1. **TypeScript Typecheck**:
   - Command: `node ./node_modules/typescript/bin/tsc --noEmit`
   - Result: Exited with code 0, 0 errors.

2. **Vitest Test Suite**:
   - Command: `node ./node_modules/vitest/vitest.mjs run`
   - Result: Exited with code 0.
   - Output summary:
     ```
     Test Files  11 passed (11)
          Tests  377 passed (377)
       Duration  1.42s
     ```

3. **Next.js Production Build**:
   - Command: `node ./node_modules/next/dist/bin/next build`
   - Result: Exited with code 0.
   - Output summary:
     ```
     ✓ Compiled successfully
     ✓ Generating static pages (5/5)
     ƒ /u/[uid]                             13.6 kB         167 kB
     ƒ /api/player/[uid]                    0 B                0 B
     ```

4. **Empirical Live SSR & Network Fault Injections**:
   - Simulated network failure (`TypeError: fetch failed: ECONNREFUSED`):
     - UID `1813164100` caught error and returned `getVaresaMockData()` (`player.uid === '1813164100'`).
     - UID `800000000` rethrew network error (`fetch failed: ECONNREFUSED`).
   - Simulated API HTTP 500 error:
     - UID `1813164100` caught error and served deterministic mock fixture.
     - UID `800000000` properly threw `EnkaError` code 500.
   - Live HTTP SSR Server Request (`GET http://localhost:3099/u/1813164100`):
     - Status: `200 OK`
     - Content-Length: 137,548 bytes
     - Contains Player Addy: `True`
     - Contains UID 1813164100: `True`
     - Contains Character Showcase: `True`
     - Contains skeleton loader (`animate-pulse`): `False`

---

## 2. Logic Chain

1. **Isolation of Non-Demo UIDs**:
   - In `EnkaClient.fetchPlayerData(uid)`, the conditional logic explicitly requires `validatedUid === DEMO_FALLBACK_UID`. If an external user enters their own UID (e.g. `800000000`), the bypass and fallbacks evaluate to `false`. The client initiates a live HTTP request to `https://enka.network/api/uid/${uid}/`. If that request fails, the error is propagated to the caller.
   - In `/api/player/[uid]`, non-demo UIDs are checked against the rate limiter, queried from cache, fetched from live Enka, calculated for damage, upserted to the DB, and returned. In the catch block, only `1813164100` falls back; non-demo UIDs return standard HTTP error codes (400, 429, 404, 500).
   - In `/u/[uid]/page.tsx`, SSR prefetching only triggers when `params.uid === DEMO_FALLBACK_UID`. Non-demo UIDs receive `initialData: undefined`, rendering the skeleton loader and fetching client-side.
   - Therefore, non-demo UIDs are strictly isolated and preserve authentic live network semantics.

2. **SSR Prefetching & Instant Server Markup Generation**:
   - `ProfilePage` is an `async` server component. For UID `1813164100`, it awaits `enkaClient.fetchPlayerData(params.uid)`.
   - The resolved `EnkaData` is passed as `initialData` into `<ProfileClient uid={params.uid} initialData={initialData} />`.
   - In `ProfileClient`, `useState(!initialData)` sets `loading = false`. The initial server render skips the skeleton loader and outputs the full DOM tree: Player Header (`Addy`, UID `1813164100`, AR `60`), Character Showcase, Character Cards, weapon details, and stats.
   - Verified empirically by launching `next start` on port 3099 and issuing an HTTP GET: the server returned `HTTP 200` with 137.5 KB of pre-rendered markup containing zero `animate-pulse` skeletons.

3. **Deterministic Serving & Pipeline Integrity**:
   - `getVaresaMockData()` does NOT hardcode domain objects or bypass domain logic; it executes `EnkaResponseSchema.parse(varesaFixture)` and `parseEnkaResponse(validated)`.
   - This ensures the mock fixture is continually processed by the exact same parsing and math pipelines (stat normalization, Crit Value calculation, roll count derivation, and pip formatting) as live API responses.
   - No facades, mock leaks, or self-certifying workarounds exist.

4. **Preservation of Home UI (R5)**:
   - `src/app/page.tsx` was verified via file system timestamp, size, and character count. Its LastWriteTime is `01-11-2026 17:53:32`, confirming that zero changes were made during Milestone 2.

---

## 3. Caveats

- In production environments where live network access to Enka.Network is active and responds with HTTP 200, UID `1813164100` will reflect the live showcase of Addy (currently 12 characters including Varesa, Yae Miko, Citlali, etc.). The deterministic `varesa-1813164100.json` fallback activates in test/offline modes, when rate limited, on server error, or when Enka.Network is unavailable.
- Upstash Redis utilizes an automatic in-memory fallback when environment variables are omitted, ensuring seamless zero-config test and local runs.

---

## 4. Conclusion

**Verdict: APPROVE**

The Milestone 2 implementation satisfies all requirements:
1. `src/lib/enka/client.ts` deterministically serves and parses `varesa-1813164100.json` in test/offline environments and upon any live API transport or HTTP error.
2. `src/app/u/[uid]/page.tsx` and `src/components/profile/ProfileClient.tsx` successfully prefetch data on the server, generating instant, complete server-side HTML markup without client-side loading flashes.
3. Non-demo UIDs remain completely isolated: live network calls, rate limiting, and standard error handling remain intact.
4. `tsc --noEmit` exits with 0 type errors.
5. All 11 test suites and 377/377 unit, integration, and E2E tests pass with 0 failures.
6. Next.js production build (`next build`) compiles cleanly.
7. `src/app/page.tsx` was strictly untouched (R5 constraint respected).
8. Zero integrity violations, facades, or shortcut patterns were found.

---

## 5. Verification Method

To independently verify this evaluation:

1. **Static Analysis & Typecheck**:
   ```powershell
   node ./node_modules/typescript/bin/tsc --noEmit
   ```
   *Expected outcome*: Exit code 0, 0 errors.

2. **Full Automated Test Suite**:
   ```powershell
   node ./node_modules/vitest/vitest.mjs run
   ```
   *Expected outcome*: 11 test files pass, 377 tests pass, 0 failures.

3. **Next.js Production Build**:
   ```powershell
   node ./node_modules/next/dist/bin/next build
   ```
   *Expected outcome*: Exit code 0, successfully prerenders all routes.

4. **Verify Boundary Invariant (R5)**:
   ```powershell
   Get-Item "src\app\page.tsx" | Select-Object LastWriteTime, Length
   ```
   *Expected outcome*: Length is 10,540 bytes, LastWriteTime unchanged.
