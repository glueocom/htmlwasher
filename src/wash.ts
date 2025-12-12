import sanitizeHtml from "sanitize-html";
import { parseSetup } from "./parse-setup.ts";
import { presets } from "./presets/index.ts";
import type { SanitizeConfigSchema } from "./schema/sanitize-config.ts";

const ALWAYS_BLOCKED = [
	"script",
	"style",
	"iframe",
	"object",
	"embed",
	"applet",
	"frame",
	"frameset",
];

export interface WashOptions {
	/** YAML configuration string (sanitize-html format) */
	setup?: string;
	/** Document title (added to <title> if missing) */
	title?: string;
}

export interface WashResult {
	html: string;
	warnings: string[];
}

export function wash(html: string, options?: WashOptions): WashResult {
	const warnings: string[] = [];

	// 1. Parse setup YAML (or use default)
	const setupYaml = options?.setup ?? presets.standard;
	const parsed = parseSetup(setupYaml);

	let config: SanitizeConfigSchema;
	if (!parsed.ok) {
		warnings.push(`Setup error: ${parsed.errorMessage}`);
		// Fall back to standard preset
		const fallback = parseSetup(presets.standard);
		config = fallback.ok ? fallback.config : {};
	} else {
		config = parsed.config;
	}

	// 2. Build sanitize-html options with security overrides
	// Only include defined properties to avoid sanitize-html issues with undefined
	const sanitizeOptions: sanitizeHtml.IOptions = {
		// Always block dangerous tags regardless of config
		exclusiveFilter: (frame) => ALWAYS_BLOCKED.includes(frame.tag),
	};

	if (config.allowedTags !== undefined) {
		sanitizeOptions.allowedTags = config.allowedTags;
	}
	if (config.allowedAttributes !== undefined) {
		// Filter out event handler attributes (on*) for security
		sanitizeOptions.allowedAttributes = filterEventHandlers(config.allowedAttributes);
	}
	if (config.allowedClasses !== undefined) {
		sanitizeOptions.allowedClasses = config.allowedClasses;
	}
	if (config.disallowedTagsMode !== undefined) {
		sanitizeOptions.disallowedTagsMode = config.disallowedTagsMode;
	}
	if (config.selfClosing !== undefined) {
		sanitizeOptions.selfClosing = config.selfClosing;
	}
	if (config.allowProtocolRelative !== undefined) {
		sanitizeOptions.allowProtocolRelative = config.allowProtocolRelative;
	}

	// 3. Sanitize
	let result = sanitizeHtml(html, sanitizeOptions);

	// 4. Post-process
	result = ensureTitle(result, options?.title);
	result = ensureImageAlt(result, warnings);

	return { html: result, warnings };
}

function ensureTitle(html: string, title?: string): string {
	if (!title) return html;

	// Check if <title> already exists
	if (/<title[^>]*>/i.test(html)) {
		return html;
	}

	// Check if there's a <head> tag
	if (/<head[^>]*>/i.test(html)) {
		return html.replace(/<head([^>]*)>/i, `<head$1><title>${escapeHtml(title)}</title>`);
	}

	// If no head tag, just prepend the title element
	return `<title>${escapeHtml(title)}</title>${html}`;
}

function ensureImageAlt(html: string, warnings: string[]): string {
	// Find images without alt attribute and add empty alt
	const imgWithoutAlt = /<img(?![^>]*\salt(?:=|\s|>))[^>]*>/gi;
	const matches = html.match(imgWithoutAlt);

	if (!matches || matches.length === 0) {
		return html;
	}

	warnings.push("Image(s) found without alt attribute, empty alt added");

	let modified = html;
	for (const originalImg of matches) {
		// Insert alt="" before the closing >
		const fixedImg = originalImg.replace(/>$/, ' alt="">');
		modified = modified.replace(originalImg, fixedImg);
	}

	return modified;
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

function filterEventHandlers(attrs: Record<string, string[]>): Record<string, string[]> {
	const result: Record<string, string[]> = {};
	for (const [tag, attrList] of Object.entries(attrs)) {
		// Filter out any attribute starting with "on" (event handlers)
		result[tag] = attrList.filter((attr) => !attr.toLowerCase().startsWith("on"));
	}
	return result;
}
