#!/bin/zsh

set -e

echo "🚀 Initializing htmlwasher-lib package..."

# Initialize pnpm package
pnpm init

# Install TypeScript
echo "📦 Installing TypeScript..."
pnpm add -D typescript @types/node

# Install Biome
echo "📦 Installing Biome..."
pnpm add -D @biomejs/biome

# Install Jest with SWC (modern approach)
echo "📦 Installing Jest with SWC..."
pnpm add -D jest @swc/core @swc/jest @types/jest

# Create src directory and index.ts
echo "📁 Creating src/index.ts..."
mkdir -p src
cat > src/index.ts << 'EOF'
export function hello(name: string): string {
	return `Hello, ${name}!`;
}
EOF

# Create sample test
echo "📁 Creating src/index.test.ts..."
cat > src/index.test.ts << 'EOF'
import { hello } from "./index";

describe("hello", () => {
	it("should greet by name", () => {
		expect(hello("World")).toBe("Hello, World!");
	});
});
EOF

# Create tsconfig.json (TypeScript-only, no compilation)
echo "📝 Creating tsconfig.json..."
cat > tsconfig.json << 'EOF'
{
	"$schema": "https://json.schemastore.org/tsconfig",
	"compilerOptions": {
		"target": "ESNext",
		"module": "ESNext",
		"moduleResolution": "bundler",
		"lib": ["ESNext"],
		"strict": true,
		"esModuleInterop": true,
		"skipLibCheck": true,
		"declaration": true,
		"declarationMap": true,
		"noEmit": true,
		"resolveJsonModule": true,
		"isolatedModules": true,
		"verbatimModuleSyntax": true,
		"baseUrl": ".",
		"paths": {
			"@/*": ["src/*"]
		}
	},
	"include": ["src/**/*"],
	"exclude": ["node_modules", "dist", "package-out"]
}
EOF

# Create biome.json
echo "📝 Creating biome.json..."
cat > biome.json << 'EOF'
{
	"$schema": "https://biomejs.dev/schemas/2.3.8/schema.json",
	"vcs": {
		"enabled": true,
		"clientKind": "git",
		"useIgnoreFile": true
	},
	"linter": {
		"enabled": true,
		"rules": {
			"recommended": true
		}
	},
	"formatter": {
		"enabled": true,
		"indentStyle": "tab",
		"lineWidth": 100
	},
	"files": {
		"includes": ["src/**/*.ts", "*.json", "*.ts"]
	},
	"assist": {
		"actions": {
			"source": {
				"organizeImports": {
					"level": "on"
				}
			}
		}
	}
}
EOF

# Create jest.config.ts
echo "📝 Creating jest.config.ts..."
cat > jest.config.ts << 'EOF'
import type { Config } from "jest";

const config: Config = {
	testEnvironment: "node",
	roots: ["<rootDir>/src"],
	testMatch: ["**/*.test.ts"],
	transform: {
		"^.+\\.ts$": [
			"@swc/jest",
			{
				jsc: {
					parser: {
						syntax: "typescript",
					},
					target: "esnext",
				},
			},
		],
	},
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/src/$1",
	},
	collectCoverageFrom: ["src/**/*.ts", "!src/**/*.test.ts"],
};

export default config;
EOF

# Create .gitignore
echo "📝 Creating/updating .gitignore..."
cat > .gitignore << 'EOF'
# Dependencies
node_modules/

# Build outputs
dist/
package-out/
*.tgz

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Test coverage
coverage/

# Environment
.env
.env.local
EOF

# Update package.json with scripts and exports
echo "📝 Updating package.json..."
node << 'EOF'
const fs = require("fs");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

pkg.type = "module";
pkg.main = "./src/index.ts";
pkg.types = "./src/index.ts";
pkg.exports = {
  ".": {
    "import": "./src/index.ts",
    "types": "./src/index.ts"
  },
  "./*": {
    "import": "./src/*.ts",
    "types": "./src/*.ts"
  }
};
pkg.files = ["src/**/*.ts", "!src/**/*.test.ts"];
pkg.scripts = {
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "lint": "biome check .",
  "lint:fix": "biome check --write .",
  "format": "biome format --write .",
  "pack:folder": "zsh -c 'rm -rf package-out && mkdir -p package-out && pnpm pack --pack-destination package-out && cd package-out && tar -xzf *.tgz --strip-components=1 && rm -f *.tgz'",
  "typecheck": "tsc --noEmit",
  "prepublishOnly": "pnpm typecheck && pnpm test"
};
pkg.publishConfig = {
  "access": "public"
};

fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
EOF

# Initialize git if not already initialized
if [ ! -d ".git" ]; then
  echo "📦 Initializing git repository..."
  git init
fi

echo ""
echo "🧪 Running all verification scripts..."
echo ""

echo "▶ pnpm typecheck"
pnpm typecheck

echo ""
echo "▶ pnpm format (auto-fix formatting)"
pnpm format

echo ""
echo "▶ pnpm lint"
pnpm lint

echo ""
echo "▶ pnpm test"
pnpm test

echo ""
echo "▶ pnpm pack:folder"
pnpm pack:folder

echo ""
echo "✅ All scripts passed! Your TypeScript-only package is ready."
echo ""
echo "Available commands:"
echo "  pnpm test          - Run tests"
echo "  pnpm test:watch    - Run tests in watch mode"
echo "  pnpm test:coverage - Run tests with coverage"
echo "  pnpm lint          - Check code with Biome"
echo "  pnpm lint:fix      - Fix linting issues"
echo "  pnpm format        - Format code with Biome"
echo "  pnpm typecheck     - Type-check without emitting"
echo "  pnpm pack:folder   - Create package in ./package-out/ folder"
echo ""
