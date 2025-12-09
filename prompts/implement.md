# Implement htmlwasher

Create the `htmlwasher` npm package in this directory.

## Reference Docs

Read these first:
1. `.claude/prompts/prd.md` — Requirements, API design, pipeline
2. `.claude/prompts/library-selection.md` — Library choices
3. `.claude/prompts/library-selection-full.md` — Code patterns, C#→JS mapping

## Stack

- TypeScript (strict)
- pnpm
- Biome (lint/format)
- Vitest (tests)

## Implementation Order

1. `pnpm init` + dependencies (cheerio, dompurify, isomorphic-dompurify)
2. `tsconfig.json` + `biome.json`
3. `package.json` conditional exports (browser/node)
4. `src/presets.ts` — TAG_PRESETS, ATTRIBUTE_PRESETS, REPLACEMENT_PRESETS, DELETE_WITH_CONTENT
5. `src/browser.ts` — sanitize() using DOMPurify
6. `src/node.ts` — sanitize() using isomorphic-dompurify
7. `src/wash.ts` — main pipeline (see PRD §Processing Pipeline)
8. `src/index.ts` — exports
9. Tests for each preset combination
10. Build + verify both entry points work

## Key Constraint

Single `wash(html, options?)` function returning `{ html, warnings }`.
