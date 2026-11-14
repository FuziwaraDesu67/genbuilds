---
name: react-bits
description: >-
  Install, discover, and integrate animated React UI components, shader backgrounds,
  text effects, and sound utilities from React Bits (https://reactbits.dev/) in any
  React, Next.js, or Vite project. Use when setting up React Bits in a project,
  searching the React Bits catalog, or adding/adapting React Bits components.
---

# React Bits Registry Workflow

React Bits (`https://reactbits.dev/`) distributes component source code via a shadcn-compatible registry (`"@react-bits": "https://reactbits.dev/r/{name}.json"`), not as a single npm package.

## Variant Selection

Match the target project's stack automatically:
- **Visual / UI components**: `<ComponentName>-<Lang>-<Style>`
  - TypeScript + Tailwind CSS: **`-TS-TW`**
  - TypeScript + Plain CSS: **`-TS-CSS`**
  - JavaScript + Tailwind CSS: **`-JS-TW`**
  - JavaScript + Plain CSS: **`-JS-CSS`**
- **Sound utilities** (`Sound*` items): `<SoundName>-TS` or `<SoundName>-JS`

## 1. Quick Setup in Any Project

Run [scripts/react-bits.ps1](./scripts/react-bits.ps1) in the target project root (auto-detects `TS`/`JS`, `TW`/`CSS`, `src/` vs root, CSS entry, and path aliases):

```powershell
# Initialize or update components.json with @react-bits registry
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\.gemini\config\skills\react-bits\scripts\react-bits.ps1" -Init

# Search live components by name or description
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\.gemini\config\skills\react-bits\scripts\react-bits.ps1" -Search "aurora"

# Auto-init + install component(s) directly from the registry
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\.gemini\config\skills\react-bits\scripts\react-bits.ps1" -Add SplitText,Aurora
```

(Replace `$env:USERPROFILE\.gemini\config\skills\react-bits` with `.agents\skills\react-bits` when running from a repo-local copy.)

If `npx` is on `PATH`, you can also use the `shadcn` or `jsrepo` CLI after `components.json` is configured:

```bash
npx shadcn@latest add @react-bits/<ComponentName>-TS-TW
# or without components.json:
npx jsrepo@latest add https://reactbits.dev/r/<ComponentName>-TS-TW.json
```

## 2. Discover Components

- Browse the local 218-component snapshot in [references/catalog.md](./references/catalog.md), or query `https://reactbits.dev/r/registry.json` (via `-List` / `-Search`) for the latest items.
- Never guess component names, props, or peer dependencies — inspect `https://reactbits.dev/r/<ComponentName>-<Variant>.json` before wiring imports.

## 3. Compatibility Checks After Installing

1. **Dependencies**: Install any packages reported from `dependencies[]` (such as `motion`, `gsap`, `@gsap/react`, `three`, or `ogl`). Note that components importing `motion/react` expect the `motion` package rather than `framer-motion`.
2. **Next.js App Router**: Keep `'use client';` at the top of interactive, GSAP, Motion, Canvas, or WebGL components when imported into Server Components.
3. **Tailwind v3 vs v4**: If the project uses Tailwind CSS v3, replace any Tailwind v4-only utilities (such as `bg-linear-to-*` -> `bg-gradient-to-*`) if present.
4. **Motion & existing backgrounds**: Respect `prefers-reduced-motion` and avoid stacking multiple heavy WebGL background canvases on the same screen.
5. **Verify**: Run the project's typecheck/lint/build commands after integrating components.
