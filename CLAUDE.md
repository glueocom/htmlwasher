# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `pnpm test` - Run all tests
- `pnpm test -- path/to/file.test.ts` - Run a single test file
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Run tests with coverage
- `pnpm typecheck` - Type check without emitting
- `pnpm lint` - Check linting with Biome
- `pnpm lint:fix` - Auto-fix linting issues
- `pnpm format` - Format code with Biome
- `pnpm pack:folder` - Create package output in `package-out/`

## Architecture

This is a TypeScript-only library (no build step). Source TypeScript files are published directly via the `exports` field in package.json.

- **Source**: `src/` - All source and test files
- **Tests**: Co-located with source as `*.test.ts` files
- **Path alias**: `@/*` maps to `src/*`

## Code Style

- Uses Biome for linting and formatting
- Tab indentation, 100 char line width
- ESM modules (`"type": "module"`)
