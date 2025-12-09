---
name: dual-package-build
description: Build isomorphic TypeScript libraries with conditional exports for browser and Node.js. Use when setting up package.json exports, configuring tsup for dual bundles, creating separate entry points (browser.ts/node.ts), or verifying both bundles work correctly.
---

# Dual Package Build

Build TypeScript libraries that work in both browser and Node.js environments.

## Package.json Exports

Configure conditional exports. Key rules:
- `types` must be nested inside each `import` block (TypeScript requirement)
- Order matters: specific conditions first, `default` last
- `browser` condition is for bundlers only (Webpack, Vite, esbuild), not Node.js

```json
{
  "name": "my-package",
  "type": "module",
  "exports": {
    ".": {
      "browser": {
        "import": {
          "types": "./dist/browser.d.ts",
          "default": "./dist/browser.js"
        }
      },
      "node": {
        "import": {
          "types": "./dist/node.d.ts",
          "default": "./dist/node.js"
        }
      },
      "import": {
        "types": "./dist/node.d.ts",
        "default": "./dist/node.js"
      },
      "default": "./dist/node.js"
    }
  },
  "main": "./dist/node.js",
  "browser": "./dist/browser.js",
  "types": "./dist/node.d.ts"
}
```

## tsconfig.json

Use `NodeNext` for library compatibility:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "declaration": true,
    "declarationMap": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["src"]
}
```

## Entry Point Structure

```
src/
├── index.ts        # Shared types and re-exports
├── browser.ts      # Browser entry (uses native DOM/DOMPurify)
├── node.ts         # Node.js entry (uses jsdom/isomorphic-dompurify)
└── shared/         # Shared utilities (no platform-specific code)
```

## tsup Configuration

Create `tsup.config.ts`:

```typescript
import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: { browser: 'src/browser.ts' },
    format: ['esm'],
    dts: true,
    platform: 'browser',
    outDir: 'dist',
    clean: true,
    external: ['fs', 'path', 'crypto', 'stream', 'util'],
    treeshake: true,
  },
  {
    entry: { node: 'src/node.ts' },
    format: ['esm'],
    dts: true,
    platform: 'node',
    outDir: 'dist',
    treeshake: true,
  },
])
```

## Verification Steps

1. Build: `pnpm build`
2. Check outputs exist:
   ```bash
   ls -la dist/
   # Expected: browser.js, browser.d.ts, node.js, node.d.ts
   ```
3. Check bundle sizes:
   ```bash
   du -h dist/*.js
   ```
4. Test Node.js import:
   ```bash
   node -e "import('./dist/node.js').then(m => console.log(Object.keys(m)))"
   ```
5. Test types resolve:
   ```bash
   npx tsc --noEmit --moduleResolution NodeNext -e "import { wash } from './dist/node.js'"
   ```

## Common Issues

| Problem | Cause | Fix |
|---------|-------|-----|
| Types not found | `types` not nested in `import` | Move `types` inside `import: { types, default }` |
| Browser bundle huge | Node.js deps included | Add to `external` array in tsup config |
| Bundler ignores condition | Wrong condition order | Put `browser` before `node` before `default` |
| ERR_MODULE_NOT_FOUND | Missing file extension | Use `NodeNext` moduleResolution |
