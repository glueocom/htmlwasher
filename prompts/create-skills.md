# Create Skills for htmlwasher-lib

Use the skill-creator at `.claude/skills/skill-creator` to generate the following skills in `.claude/skills/`.

## Skills to Create

### 1. `dual-package-build`
Build isomorphic TypeScript library with conditional exports.
- tsup/esbuild configuration for browser + Node.js
- package.json `exports` field with `browser`/`node`/`default`
- Separate entry points: `src/browser.ts`, `src/node.ts`
- Verify both bundles work after build

### 2. `testing-html-processing`
Test patterns for HTML sanitization libraries.
- Input/output test cases for tag whitelisting
- Malformed HTML repair verification
- XSS vector testing (ensure sanitization works)
- Preset configuration testing (minimal/standard/permissive)
- Browser vs Node.js output parity checks

### 3. `npm-release`
Release workflow for npm packages.
- Version bump (patch/minor/major)
- Changelog generation
- Build verification before publish
- Git tag + GitHub release
- npm publish with provenance

### 4. `typescript-strict`
Strict TypeScript patterns for library code.
- No `any` types
- Explicit return types on public API
- Readonly where applicable
- Discriminated unions for options/results

## Skill Format

Each skill needs `SKILL.md` with:
```yaml
---
name: skill-name
description: What it does. When to use it.
---
```

Keep instructions under 500 lines. Use imperative language.
