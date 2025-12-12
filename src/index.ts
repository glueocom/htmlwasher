// Main API

export type { ErrorCode, ParseSetupResult } from "./parse-setup.ts";
export { parseSetup } from "./parse-setup.ts";
export type { PresetName } from "./presets/index.ts";
// Presets
export { presets } from "./presets/index.ts";
// Schema type
export type { SanitizeConfigSchema } from "./schema/sanitize-config.ts";
export type { WashOptions, WashResult } from "./wash.ts";
export { wash } from "./wash.ts";
