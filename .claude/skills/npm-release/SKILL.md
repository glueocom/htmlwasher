---
name: npm-release
description: Release workflow for npm packages. Use when publishing a new version, bumping versions (patch/minor/major), generating changelogs, creating git tags, GitHub releases, or running npm publish with provenance.
---

# npm Release

Workflow for releasing npm packages with proper versioning, changelog, and provenance.

## Quick Release

Run the release script:

```bash
./scripts/release.sh patch   # 1.0.0 -> 1.0.1
./scripts/release.sh minor   # 1.0.0 -> 1.1.0
./scripts/release.sh major   # 1.0.0 -> 2.0.0
```

The script handles: clean check, tests, build, version bump, changelog, commit, tag, push, npm publish, and GitHub release.

## Manual Steps

### 1. Pre-flight Checks

```bash
# Ensure clean working directory
git status

# Ensure on main branch
git branch --show-current

# Pull latest
git pull

# Run tests
pnpm test

# Run build
pnpm build
```

### 2. Version Bump

```bash
# Bump version (updates package.json)
npm version patch --no-git-tag-version
# or: minor, major, prepatch, preminor, premajor, prerelease
```

### 3. Changelog (optional)

Using git-cliff:
```bash
git-cliff --unreleased --prepend CHANGELOG.md
```

Or manually add entry to CHANGELOG.md.

### 4. Commit and Tag

```bash
git add package.json CHANGELOG.md
git commit -m "chore: release v1.0.1"
git tag -a "v1.0.1" -m "Release v1.0.1"
```

### 5. Push

```bash
git push
git push --tags
```

### 6. Publish to npm

```bash
npm publish --provenance --access public
```

The `--provenance` flag adds supply chain security attestations (requires npm 9.5+).

### 7. GitHub Release (optional)

```bash
gh release create "v1.0.1" --title "v1.0.1" --generate-notes
```

## Versioning Guidelines

- **patch**: Bug fixes, documentation updates
- **minor**: New features (backward compatible)
- **major**: Breaking changes

## Pre-release Versions

```bash
npm version prerelease --preid=beta   # 1.0.0 -> 1.0.1-beta.0
npm version prerelease                 # 1.0.1-beta.0 -> 1.0.1-beta.1
npm publish --tag beta                 # Publish as beta
```

## Troubleshooting

**"npm ERR! 403 Forbidden"**: Check npm login (`npm whoami`) and package name availability.

**"npm ERR! ENEEDAUTH"**: Run `npm login` first.

**Provenance fails**: Ensure running in GitHub Actions or supported CI with OIDC.
