# htmlsanitization-server

HTML sanitization library with YAML-based configuration and JSON Schema validation.

## Installation

```bash
pnpm add htmlsanitization-server
```

## Usage

### Basic

```typescript
import { wash } from 'htmlsanitization-server'

const result = wash('<div><script>alert(1)</script><p>Hello</p></div>')
// result.html = '<p>Hello</p>'
// result.warnings = []
```

### With YAML Configuration

```typescript
import { wash } from 'htmlsanitization-server'

const setup = `
allowedTags:
  - p
  - a
  - strong
allowedAttributes:
  a:
    - href
`

const result = wash(html, { setup, title: 'My Document' })
```

### Using Presets

```typescript
import { wash, presets } from 'htmlsanitization-server'

// Available presets: minimal, standard, permissive
const result = wash(html, { setup: presets.minimal })
```

### Validate Configuration

```typescript
import { parseSetup, wash } from 'htmlsanitization-server'

const result = parseSetup(userYaml)

if (!result.ok) {
  console.error(`${result.errorCode}: ${result.errorMessage}`)
  return
}

const washed = wash(html, { setup: userYaml })
```

## API

### `wash(html, options?)`

Sanitizes HTML string.

```typescript
function wash(html: string, options?: WashOptions): WashResult

interface WashOptions {
  setup?: string   // YAML configuration
  title?: string   // Document title (added if missing)
}

interface WashResult {
  html: string
  warnings: string[]
}
```

### `parseSetup(yaml)`

Validates YAML configuration against JSON Schema.

```typescript
function parseSetup(yaml: string): ParseSetupResult

type ParseSetupResult =
  | { ok: true; config: SanitizeConfigSchema }
  | { ok: false; errorCode: ErrorCode; errorMessage: string }

type ErrorCode = 'YAML_SYNTAX_ERROR' | 'SCHEMA_VALIDATION_ERROR'
```

### `presets`

Built-in YAML configurations:

- `presets.minimal` - p, a, strong, em, br
- `presets.standard` - Common HTML elements (headings, lists, tables, images)
- `presets.permissive` - Extended with div, span, code, pre, blockquote

## Configuration Options

```yaml
allowedTags:
  - p
  - a
  - img

allowedAttributes:
  a:
    - href
  img:
    - src
    - alt

allowedClasses:
  p:
    - intro
    - highlight

disallowedTagsMode: discard  # discard | escape | recursiveEscape | completelyDiscard

selfClosing:
  - img
  - br

allowProtocolRelative: false
```

## Security

Always blocked (regardless of configuration):

**Tags**: script, style, iframe, object, embed, applet, frame, frameset

**Attributes**: All `on*` event handlers, `javascript:` URLs

## Development

```bash
pnpm install
pnpm build        # Generate JSON Schema
pnpm test         # Run tests
pnpm typecheck    # Type check
pnpm lint         # Lint
```

## License

ISC
