# Create Skills for htmlsanitization-server

Use the skill-creator at `.claude/skills/skill-creator` to generate the following skills in `.claude/skills/`.

## Skills to Create

### 1. `dual-package-build`
Build isomorphic TypeScript library with conditional exports.
- tsup configuration for ESM output
- package.json `exports` field with `browser`/`node`/`default`
- Verify both entry points work after build

### 2. `testing-html-processing`
Test patterns for HTML sanitization using sanitize-html.
- Input/output test cases for tag whitelisting
- Attribute filtering tests
- Tag transformation tests (b→strong, div→p)
- YAML config parsing tests
- XSS prevention tests
- Error handling for invalid YAML

### 3. `release`
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
- Zod schemas for runtime validation
- Discriminated unions for results (ok/error pattern)

## Skill Format

Each skill needs `SKILL.md` with:
```yaml
---
name: skill-name
description: What it does. When to use it.
---
```

Keep instructions under 500 lines. Use imperative language.
