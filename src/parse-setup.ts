import Ajv from "ajv";
import YAML from "yaml";
import schema from "../schema.json" with { type: "json" };
import type { SanitizeConfigSchema } from "./schema/sanitize-config.ts";

const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile<SanitizeConfigSchema>(schema);

export type ErrorCode = "YAML_SYNTAX_ERROR" | "SCHEMA_VALIDATION_ERROR";

export type ParseSetupResult =
	| { ok: true; config: SanitizeConfigSchema }
	| { ok: false; errorCode: ErrorCode; errorMessage: string };

export function parseSetup(yamlString: string): ParseSetupResult {
	// 1. Parse YAML
	let doc: YAML.Document;
	try {
		doc = YAML.parseDocument(yamlString);
	} catch (error) {
		return {
			ok: false,
			errorCode: "YAML_SYNTAX_ERROR",
			errorMessage: error instanceof Error ? error.message : "Unknown YAML error",
		};
	}

	if (doc.errors.length > 0) {
		const firstError = doc.errors[0];
		return {
			ok: false,
			errorCode: "YAML_SYNTAX_ERROR",
			errorMessage: firstError?.message ?? "Unknown YAML syntax error",
		};
	}

	const data: unknown = doc.toJS();

	// 2. Validate against JSON Schema
	if (!validate(data)) {
		const error = validate.errors?.[0];
		const path = error?.instancePath ?? "";
		const message = error?.message ?? "Unknown validation error";

		return {
			ok: false,
			errorCode: "SCHEMA_VALIDATION_ERROR",
			errorMessage: path ? `${path}: ${message}` : message,
		};
	}

	return { ok: true, config: data };
}
