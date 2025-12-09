# Strict tsconfig.json Options

Detailed explanation of strict TypeScript compiler options.

## Essential Strict Options

### `strict: true`

Enables all strict type-checking options:
- `strictNullChecks`
- `strictFunctionTypes`
- `strictBindCallApply`
- `strictPropertyInitialization`
- `noImplicitAny`
- `noImplicitThis`
- `alwaysStrict`

### `noUncheckedIndexedAccess: true`

Adds `undefined` to index signature results:

```typescript
const arr: string[] = ['a', 'b']
const item = arr[0]  // string | undefined (not just string)

// Forces explicit checks
if (item !== undefined) {
  console.log(item.toUpperCase())
}
```

### `noImplicitOverride: true`

Requires `override` keyword when overriding base class methods:

```typescript
class Base {
  greet() { return 'hello' }
}

class Derived extends Base {
  override greet() { return 'hi' }  // Required
}
```

### `exactOptionalPropertyTypes: true`

Distinguishes between `undefined` value and missing property:

```typescript
interface Options {
  name?: string
}

const a: Options = {}           // OK
const b: Options = { name: undefined }  // Error with this option
```

## Additional Recommended Options

### `noUnusedLocals: true`

Error on unused local variables.

### `noUnusedParameters: true`

Error on unused function parameters. Prefix with `_` to ignore:

```typescript
function handler(_event: Event, data: string) {
  console.log(data)
}
```

### `noImplicitReturns: true`

Error when not all code paths return a value:

```typescript
// Error: not all paths return
function getValue(condition: boolean) {
  if (condition) {
    return 'yes'
  }
  // Missing return
}
```

### `noFallthroughCasesInSwitch: true`

Error on fallthrough cases in switch statements.

## Full Recommended Config

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```
