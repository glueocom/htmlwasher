#!/bin/bash
# packto.sh - Build and copy htmlsanitization-server package to a destination folder
#
# Usage: bash packto.sh <destination-path>
# Example: bash packto.sh /path/to/project/packages/htmlsanitization-server/

set -e

if [ -z "$1" ]; then
    echo "Error: Destination path required"
    echo "Usage: bash packto.sh <destination-path>"
    exit 1
fi

DEST="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Installing dependencies..."
cd "$SCRIPT_DIR"
pnpm install

echo "Building package..."
pnpm run pack:folder

echo "Copying to $DEST..."
# Ensure destination exists and is empty
if [ -d "$DEST" ]; then
    rm -rf "$DEST"
fi
mkdir -p "$DEST"
cp -r "$SCRIPT_DIR/package-out/"* "$DEST/"

echo "Done! Package copied to $DEST"
