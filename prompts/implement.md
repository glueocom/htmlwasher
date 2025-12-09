# Implement htmlwasher-lib

Create the `htmlwasher-lib` npm package in this directory.

## Reference Docs

Read these first:
1. `prompts/prd.md` — Requirements, API design, pipeline
2. `prompts/library-selection.md` — Library choices
3. `prompts/library-selection-full.md` — Code patterns, C#→JS mapping

## Agent

Use this agent: @agent-ts-coder

## Skills

Use these skills (in `.claude/skills/`):
- `dual-package-build` — For conditional exports setup and build
- `typescript-strict` — For type-safe library code
- `testing-html-processing` — For test patterns

## Stack

- TypeScript (strict)
- pnpm
- Biome (lint/format)
- Jest (tests)

## Implementation Order

1. `pnpm init` + dependencies (cheerio, dompurify, isomorphic-dompurify)
2. `tsconfig.json` + `biome.json`
3. `package.json` conditional exports (browser/node) → use `dual-package-build` skill
4. `src/presets.ts` — TAG_PRESETS, ATTRIBUTE_PRESETS, REPLACEMENT_PRESETS, DELETE_WITH_CONTENT
5. `src/browser.ts` — sanitize() using DOMPurify
6. `src/node.ts` — sanitize() using isomorphic-dompurify
7. `src/wash.ts` — main pipeline (see PRD §Processing Pipeline)
8. `src/index.ts` — exports
9. Tests for each preset combination → use `testing-html-processing` skill
10. Build + verify both entry points work

## Key Constraint

Single `wash(html, options?)` function returning `{ html, warnings }`.
