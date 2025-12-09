#!/bin/bash
set -e

# npm-release: Automated release workflow
# Usage: ./release.sh [patch|minor|major]

VERSION_TYPE=${1:-patch}

echo "Starting $VERSION_TYPE release..."

# 1. Ensure clean working directory
if [ -n "$(git status --porcelain)" ]; then
  echo "Error: Working directory not clean. Commit or stash changes first."
  exit 1
fi

# 2. Ensure on main branch
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ] && [ "$BRANCH" != "master" ]; then
  echo "Error: Must be on main/master branch. Currently on: $BRANCH"
  exit 1
fi

# 3. Pull latest
echo "Pulling latest changes..."
git pull

# 4. Install dependencies
echo "Installing dependencies..."
pnpm install

# 5. Run tests
echo "Running tests..."
pnpm test

# 6. Run build
echo "Building..."
pnpm build

# 7. Bump version
echo "Bumping version ($VERSION_TYPE)..."
NEW_VERSION=$(pnpm version $VERSION_TYPE --no-git-tag-version)
echo "New version: $NEW_VERSION"

# 8. Generate changelog entry (if git-cliff is available)
if command -v git-cliff &> /dev/null; then
  echo "Generating changelog..."
  git-cliff --unreleased --prepend CHANGELOG.md
fi

# 9. Commit version bump
echo "Committing version bump..."
git add package.json pnpm-lock.yaml CHANGELOG.md 2>/dev/null || git add package.json pnpm-lock.yaml 2>/dev/null || git add package.json
git commit -m "chore: release $NEW_VERSION"

# 10. Create git tag
echo "Creating tag..."
git tag -a "$NEW_VERSION" -m "Release $NEW_VERSION"

# 11. Push commit and tag
echo "Pushing to remote..."
git push
git push --tags

# 12. Publish to npm
echo "Publishing to npm..."
pnpm publish --provenance --access public

# 13. Create GitHub release (if gh CLI is available)
if command -v gh &> /dev/null; then
  echo "Creating GitHub release..."
  gh release create "$NEW_VERSION" --title "$NEW_VERSION" --generate-notes
fi

echo "Release $NEW_VERSION complete!"
