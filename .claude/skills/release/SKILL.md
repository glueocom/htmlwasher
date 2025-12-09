---
name: release
description: Release workflow for npm packages. Use when publishing a new version, bumping versions (patch/minor/major), generating changelogs, creating git tags, GitHub releases, or publishing to npm with provenance.
---

# Release

Workflow for releasing npm packages with proper versioning, changelog, and provenance.

## Quick Release

```bash
./scripts/release.sh patch   # 1.0.0 → 1.0.1
./scripts/release.sh minor   # 1.0.0 → 1.1.0
./scripts/release.sh major   # 1.0.0 → 2.0.0
```

The script performs: clean check → tests → build → version bump → changelog → commit → tag → push → npm publish.

## Manual Steps

### 1. Pre-flight Checks

```bash
# Ensure clean working directory
git status --porcelain  # Should be empty

# Ensure on main branch
git branch --show-current  # Should be main

# Pull latest
git pull origin main

# Run tests and build
pnpm test
pnpm build
```

### 2. Version Bump

```bash
# Bump version (updates package.json, no git tag yet)
pnpm version patch --no-git-tag-version
# Options: patch | minor | major | prepatch | preminor | premajor | prerelease
```

### 3. Changelog

Add entry to CHANGELOG.md:

```markdown
## [1.0.1] - 2025-01-15

### Fixed
- Fixed XSS vector in attribute sanitization
```

Or use git-cliff if installed:
```bash
git-cliff --unreleased --prepend CHANGELOG.md
```

### 4. Commit and Tag

```bash
VERSION=$(node -p "require('./package.json').version")
git add package.json pnpm-lock.yaml CHANGELOG.md
git commit -m "chore: release v$VERSION"
git tag -a "v$VERSION" -m "Release v$VERSION"
```

### 5. Push

```bash
git push origin main
git push origin --tags
```

### 6. Publish to npm

```bash
# Local publish (no provenance)
pnpm publish --access public

# CI publish with provenance (GitHub Actions, GitLab CI)
pnpm publish --provenance --access public
```

> **Note:** `--provenance` requires OIDC-enabled CI (GitHub Actions, GitLab CI). It won't work locally.

### 7. GitHub Release

```bash
gh release create "v$VERSION" --title "v$VERSION" --generate-notes
```

## Versioning Guidelines

| Type | When to Use | Example |
|------|-------------|---------|
| `patch` | Bug fixes, docs, internal changes | 1.0.0 → 1.0.1 |
| `minor` | New features, backward compatible | 1.0.0 → 1.1.0 |
| `major` | Breaking changes | 1.0.0 → 2.0.0 |

## Pre-release Versions

```bash
# Create beta
pnpm version prerelease --preid=beta   # 1.0.0 → 1.0.1-beta.0
pnpm publish --tag beta --access public

# Increment beta
pnpm version prerelease                 # 1.0.1-beta.0 → 1.0.1-beta.1

# Promote to stable
pnpm version patch                      # 1.0.1-beta.1 → 1.0.1
pnpm publish --access public
```

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| 403 Forbidden | Not logged in or no permission | `pnpm login` |
| ENEEDAUTH | Not authenticated | `pnpm login` |
| Package name taken | Name conflict on npm | Change name in package.json |
| Provenance fails | Not in CI with OIDC | Remove `--provenance` for local publish |
| Tag exists | Already released this version | Bump version again |
