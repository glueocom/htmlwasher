# Best npm packages for YAML parsing in TypeScript

**Zod combined with either `yaml` (eemeli) or `js-yaml` has emerged as the industry standard** for type-safe YAML configuration in TypeScript projects. The `yaml` package offers superior TypeScript integration with built-in types, while `js-yaml` provides the smallest bundle and fastest parsing. For validation, Zod dominates with **46M weekly downloads**, excellent developer experience, and seamless type inference from schemas.

## The two winning YAML parsers serve different needs

The YAML parsing landscape has consolidated around two actively-maintained libraries, with two others effectively abandoned.

| Library | Weekly Downloads | Bundle (gzipped) | TypeScript | YAML Spec | Status |
|---------|-----------------|------------------|------------|-----------|--------|
| **js-yaml** | ~155M | **13 kB** | @types/js-yaml | 1.2 | Active |
| **yaml** (eemeli) | ~80M | 27 kB | **Built-in** | 1.1 & 1.2 | Very Active |
| yamljs | ~2M | ~50 kB | @types/yamljs | 1.2 | ⚠️ Abandoned (6+ years) |
| yaml-js | ~247K | N/A | None | 1.1 | ⚠️ Archived |

**js-yaml** remains the pragmatic choice for most projects. It delivers **10x faster parsing** on large files (64ms vs 600ms on yarn.lock benchmarks), the smallest footprint, and massive ecosystem adoption with **22,630+ dependent packages**. The tradeoff is requiring a separate `@types/js-yaml` package and lacking comment preservation.

**yaml (eemeli)** excels for TypeScript-first development. Written entirely in TypeScript, it provides superior type inference and unique capabilities: comment preservation, full AST access, streaming support, and never throws on invalid input. VS Code's YAML extension, Prettier, and the Kubernetes JavaScript client all use this package. The **v2.8.2 release in November 2025** demonstrates active maintenance.

```typescript
// js-yaml: Simple, fast, requires type assertion
import yaml from 'js-yaml';
const config = yaml.load(yamlString) as MyConfig;

// yaml (eemeli): Built-in generics, comment preservation
import YAML from 'yaml';
const config = YAML.parse<MyConfig>(yamlString);
const doc = YAML.parseDocument(yamlString); // Full AST access
```

**Avoid yamljs and yaml-js entirely**—both are abandoned with potential security vulnerabilities that will never be patched.

## Zod dominates TypeScript runtime validation

For validating parsed YAML against TypeScript schemas, runtime validators have replaced manual type guards. The ecosystem has matured significantly:

| Library | Weekly Downloads | Bundle (gzipped) | Type Inference | Performance |
|---------|-----------------|------------------|----------------|-------------|
| **Zod** | ~46-49M | 13.5 kB | ⭐⭐⭐⭐⭐ | Medium |
| **Valibot** | ~1.5-2M | **1-5 kB** (tree-shaken) | ⭐⭐⭐⭐⭐ | 2x Zod |
| **Ajv** | ~150M+ | 55 kB | ⭐⭐⭐⭐ | **Fastest** |
| **TypeBox** | ~3M+ | 8 kB | ⭐⭐⭐⭐⭐ | Very Fast |
| **io-ts** | ~1.1M | 10 kB | ⭐⭐⭐⭐⭐ | Slow |
| **Yup** | ~7-8M | 12.2 kB | ⭐⭐⭐ | Medium |

**Zod** has become the default choice through its intuitive API, excellent error messages, and deep ecosystem integration with tRPC, React Hook Form, and Next.js. The killer feature is `z.infer<typeof schema>` which derives TypeScript types directly from runtime schemas—no duplication needed.

**Valibot** emerges as the bundle-size champion. Through aggressive tree-shaking, it achieves **90-98% smaller bundles** than Zod while maintaining API familiarity. The Guardian and React Router have adopted it for edge/serverless deployments.

**TypeBox + Ajv** deliver maximum performance through JIT compilation—**50-100x faster** than Zod in benchmarks. Choose this combination for high-throughput APIs or when JSON Schema compatibility matters.

## The recommended pattern combines parsing and validation

The industry-standard workflow parses YAML to a JavaScript object, then validates against a Zod schema to produce fully-typed output:

```typescript
import { z } from 'zod';
import YAML from 'yaml';
import fs from 'fs';

// Define schema once—types are automatically inferred
const configSchema = z.object({
  server: z.object({
    host: z.string(),
    port: z.coerce.number().positive().default(3000),
  }),
  database: z.object({
    url: z.string().url(),
    maxConnections: z.coerce.number().optional().default(10),
  }),
  features: z.record(z.string(), z.boolean()).optional(),
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  }).optional(),
});

// Infer TypeScript type from schema
type Config = z.infer<typeof configSchema>;

// Load and validate with full type safety
function loadConfig(path: string): Config {
  const raw = YAML.parse(fs.readFileSync(path, 'utf8'));
  return configSchema.parse(raw); // Throws ZodError on failure
}

// Safe parsing alternative
const result = configSchema.safeParse(raw);
if (!result.success) {
  console.error(result.error.format()); // Detailed path-aware errors
}
```

**zod-config** provides an official abstraction for this pattern, featured in Zod's documentation:

```typescript
import { loadConfig } from 'zod-config';
import { yamlAdapter } from 'zod-config/yaml-adapter';

const config = await loadConfig({
  schema: configSchema,
  adapters: yamlAdapter({ path: './config.yaml' }),
});
```

## How major projects handle YAML configuration

Real-world implementations reveal consistent patterns across the ecosystem:

**VS Code's YAML extension** (Red Hat) uses `yaml` (eemeli) with JSON Schema validation. The extension provides schema associations, custom tag support, and full YAML 1.2 compliance through yaml-language-server.

**cosmiconfig**—used by Prettier, ESLint, PostCSS, and many others—relies on `js-yaml` for universal configuration file discovery. With **~4M weekly downloads**, it represents the de facto standard for finding config files:

```typescript
import { cosmiconfig } from 'cosmiconfig';
const explorer = cosmiconfig('myapp', {
  searchPlaces: ['.myapprc.yaml', 'myapp.config.js', 'package.json'],
});
const result = await explorer.search();
```

**NestJS** applications typically combine `js-yaml` with class-validator or Zod through `@nestjs/config`:

```typescript
// NestJS pattern
import * as yaml from 'js-yaml';
export default () => configSchema.parse(
  yaml.load(readFileSync('config.yaml', 'utf8'))
);
```

## Critical coercion behavior affects YAML string booleans

YAML parsers may represent booleans as strings in certain contexts. Understanding coercion behavior prevents subtle bugs:

```typescript
// ⚠️ DANGER: z.coerce.boolean() uses Boolean(), so "false" → true!
const broken = z.coerce.boolean().parse("false"); // Returns true!

// ✅ CORRECT: Use transform for string boolean coercion
const boolFromString = z.string().transform(val => val === 'true');

// ✅ Or use z.union with preprocessing
const flexibleBool = z.preprocess(
  (val) => val === 'true' ? true : val === 'false' ? false : val,
  z.boolean()
);
```

Ajv handles this correctly with `coerceTypes: true`, converting `"true"`/`"false"` strings to proper booleans.

## Security requires safe defaults for untrusted input

Historical vulnerabilities in js-yaml (CVE-2013-4660) enabled arbitrary code execution through `!!js/function` tags. Modern versions have removed dangerous tags by default, but vigilance remains essential:

```typescript
// For untrusted YAML input, use restricted schemas
import yaml from 'js-yaml';
const data = yaml.load(untrustedInput, { schema: yaml.JSON_SCHEMA });

// The yaml (eemeli) package uses safe defaults in v2
const data = YAML.parse(untrustedInput); // Safe by default
```

Best practices include: always validating against schemas, keeping libraries updated, using strict schemas for untrusted input, and considering JSON for user-controlled data sources.

## Conclusion

For TypeScript projects parsing YAML configuration files, the optimal stack depends on priorities:

- **Best overall**: `yaml` (eemeli) + Zod—superior TypeScript support, modern features, and the most widely-adopted validation library
- **Smallest bundle**: `js-yaml` + Valibot—combined footprint under **18 kB gzipped** with full tree-shaking
- **Maximum performance**: `js-yaml` + TypeBox/Ajv—fastest parsing combined with JIT-compiled validation
- **Universal config discovery**: cosmiconfig + Zod—handles YAML, JSON, and JS config files with schema validation

The pattern of separating YAML parsing from TypeScript validation has won. Define your schema once with Zod, parse YAML with either major library, validate at runtime, and enjoy full type safety throughout your application. This approach is used by VS Code extensions, modern CLI tools, and production TypeScript applications across the industry.