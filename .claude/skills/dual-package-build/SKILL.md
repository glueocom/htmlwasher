---
name: dual-package-build
description: Build isomorphic TypeScript libraries with conditional exports for browser and Node.js. Use when setting up package.json exports, configuring tsup/esbuild for dual bundles, creating separate entry points (browser.ts/node.ts), or verifying both bundles work correctly.
---

# Dual Package Build

Build TypeScript libraries that work in both browser and Node.js environments.

## Package.json Exports

Configure conditional exports:

```json
{
  "type": "module",
  "exports": {
    ".": {
      "browser": {
        "types": "./dist/browser.d.ts",
        "default": "./dist/browser.js"
      },
      "node": {
        "types": "./dist/node.d.ts",
        "default": "./dist/node.js"
      },
      "default": {
        "types": "./dist/node.d.ts",
        "default": "./dist/node.js"
      }
    }
  },
  "main": "./dist/node.js",
  "browser": "./dist/browser.js",
  "types": "./dist/node.d.ts"
}
```

## Entry Point Structure

```
src/
├── index.ts        # Shared types and re-exports
├── browser.ts      # Browser-specific implementation
├── node.ts         # Node.js-specific implementation
└── shared/         # Shared utilities
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
  },
  {
    entry: { node: 'src/node.ts' },
    format: ['esm'],
    dts: true,
    platform: 'node',
    outDir: 'dist',
  },
])
```

## Verification

After building:

1. Check bundles exist: `ls -la dist/`
2. Check browser bundle size: `du -h dist/browser.js`
3. Test Node.js import: `node -e "import('./dist/node.js').then(m => console.log(Object.keys(m)))"`
4. Test browser bundle in a test HTML file or bundler

## Common Issues

**Browser bundle too large**: Check for Node.js dependencies leaking in. Use `external` option.

**Types not resolving**: Ensure `types` field comes before `default` in exports.

**Conditional export not working**: Bundlers may ignore conditions. Check bundler documentation.
