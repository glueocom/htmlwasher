# Strict tsconfig.json Options

Recommended TypeScript compiler options for strict library development.

## Essential Strict Options

### `strict: true`

Enables all strict type-checking options:
- `strictNullChecks` — null/undefined are distinct types
- `strictFunctionTypes` — stricter function parameter checking
- `strictBindCallApply` — strict bind/call/apply checking
- `strictPropertyInitialization` — class properties must be initialized
- `noImplicitAny` — error on implicit any
- `noImplicitThis` — error on implicit this
- `alwaysStrict` — emit "use strict"

### `noUncheckedIndexedAccess: true`

Adds `undefined` to index signature results:

```typescript
const arr: string[] = ['a', 'b']
const item = arr[0]  // string | undefined (not just string)

// Forces null checks
if (item !== undefined) {
  console.log(item.toUpperCase())
}

const record: Record<string, number> = { a: 1 }
const value = record['b']  // number | undefined
```

### `exactOptionalPropertyTypes: true`

Distinguishes between `undefined` value and missing property:

```typescript
interface Options {
  name?: string
}

const a: Options = {}                      // ✅ OK - property missing
const b: Options = { name: 'test' }        // ✅ OK - property present
const c: Options = { name: undefined }     // ❌ Error - explicit undefined not allowed
```

### `noImplicitOverride: true`

Requires `override` keyword when overriding methods:

```typescript
class Base {
  greet() { return 'hello' }
}

class Derived extends Base {
  override greet() { return 'hi' }  // ✅ Required
  greet() { return 'hi' }           // ❌ Error without override
}
```

### `verbatimModuleSyntax: true`

Replaces `isolatedModules`. Enforces explicit type-only imports:

```typescript
// ✅ Correct
import type { WashOptions } from './types'
import { wash } from './wash'

// ❌ Error - type used as value
import { WashOptions } from './types'
```

## Additional Recommended Options

### `noUnusedLocals: true`

Error on unused local variables.

### `noUnusedParameters: true`

Error on unused function parameters. Prefix with `_` to ignore:

```typescript
function handler(_event: Event, data: string) {
  console.log(data)  // _event intentionally unused
}
```

### `noImplicitReturns: true`

Error when not all code paths return a value:

```typescript
// ❌ Error: not all paths return
function getValue(condition: boolean): string {
  if (condition) {
    return 'yes'
  }
  // Missing return
}
```

### `noFallthroughCasesInSwitch: true`

Error on fallthrough cases in switch statements.

### `noPropertyAccessFromIndexSignature: true`

Requires bracket notation for index signatures:

```typescript
interface Config {
  [key: string]: string
}
const config: Config = { debug: 'true' }

config.debug    // ❌ Error
config['debug'] // ✅ OK
```

## Full Recommended Config for Libraries

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "verbatimModuleSyntax": true,
    
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

## Biome Integration

When using Biome for linting, some TS options can be handled by Biome instead:

```json
{
  "linter": {
    "rules": {
      "correctness": {
        "noUnusedVariables": "error",
        "noUnusedImports": "error"
      },
      "suspicious": {
        "noExplicitAny": "error",
        "noImplicitAnyLet": "error"
      }
    }
  }
}
```
