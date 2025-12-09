#!/bin/bash
set -e

# Release workflow for npm packages
# Usage: ./release.sh [patch|minor|major] [--dry-run]

VERSION_TYPE=${1:-patch}
DRY_RUN=false

if [ "$2" = "--dry-run" ]; then
  DRY_RUN=true
  echo "🔍 DRY RUN MODE - no changes will be made"
fi

echo "📦 Starting $VERSION_TYPE release..."

# 1. Ensure clean working directory
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ Error: Working directory not clean. Commit or stash changes first."
  exit 1
fi
echo "✓ Working directory clean"

# 2. Ensure on main branch
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ] && [ "$BRANCH" != "master" ]; then
  echo "❌ Error: Must be on main/master branch. Currently on: $BRANCH"
  exit 1
fi
echo "✓ On $BRANCH branch"

# 3. Pull latest
echo "📥 Pulling latest changes..."
git pull origin "$BRANCH"

# 4. Install dependencies
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# 5. Run tests
echo "🧪 Running tests..."
pnpm test

# 6. Run build
echo "🔨 Building..."
pnpm build

# 7. Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📌 Current version: $CURRENT_VERSION"

if [ "$DRY_RUN" = true ]; then
  echo "🔍 Would bump $VERSION_TYPE version from $CURRENT_VERSION"
  echo "🔍 Dry run complete. No changes made."
  exit 0
fi

# 8. Bump version
echo "📈 Bumping version ($VERSION_TYPE)..."
pnpm version "$VERSION_TYPE" --no-git-tag-version > /dev/null
NEW_VERSION=$(node -p "require('./package.json').version")
echo "📌 New version: $NEW_VERSION"

# 9. Generate changelog entry (if git-cliff is available)
if command -v git-cliff &> /dev/null; then
  echo "📝 Generating changelog..."
  git-cliff --unreleased --prepend CHANGELOG.md 2>/dev/null || true
fi

# 10. Stage files
echo "📋 Staging files..."
git add package.json
[ -f pnpm-lock.yaml ] && git add pnpm-lock.yaml
[ -f CHANGELOG.md ] && git add CHANGELOG.md

# 11. Commit version bump
echo "💾 Committing version bump..."
git commit -m "chore: release v$NEW_VERSION"

# 12. Create git tag
echo "🏷️  Creating tag v$NEW_VERSION..."
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"

# 13. Push commit and tag
echo "🚀 Pushing to remote..."
git push origin "$BRANCH"
git push origin "v$NEW_VERSION"

# 14. Publish to npm
echo "📤 Publishing to npm..."
if [ -n "$CI" ]; then
  # In CI, use provenance
  pnpm publish --provenance --access public --no-git-checks
else
  # Local publish without provenance
  pnpm publish --access public --no-git-checks
fi

# 15. Create GitHub release (if gh CLI is available)
if command -v gh &> /dev/null; then
  echo "🎉 Creating GitHub release..."
  gh release create "v$NEW_VERSION" --title "v$NEW_VERSION" --generate-notes
else
  echo "ℹ️  Skipping GitHub release (gh CLI not installed)"
fi

echo ""
echo "✅ Release v$NEW_VERSION complete!"
echo ""
echo "📦 npm: https://www.npmjs.com/package/$(node -p "require('./package.json').name")"
