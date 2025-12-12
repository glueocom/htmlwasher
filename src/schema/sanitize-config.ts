/**
 * Safe subset of sanitize-html options for YAML configuration.
 * Only JSON-serializable options are exposed (no functions, RegExp, etc.)
 *
 * @additionalProperties false
 */
export interface SanitizeConfigSchema {
	/**
	 * Tags to allow in the output.
	 * @example ["p", "a", "strong", "em"]
	 */
	allowedTags?: string[];

	/**
	 * Attributes allowed per tag.
	 * Key is tag name, value is array of allowed attribute names.
	 * @example { "a": ["href"], "img": ["src", "alt"] }
	 */
	allowedAttributes?: Record<string, string[]>;

	/**
	 * CSS classes allowed per tag.
	 * Key is tag name, value is array of allowed class names.
	 * @example { "p": ["intro", "highlight"] }
	 */
	allowedClasses?: Record<string, string[]>;

	/**
	 * How to handle disallowed tags.
	 * - "discard": Remove tag, keep content (default)
	 * - "escape": Convert to HTML entities
	 * - "recursiveEscape": Escape tag and all children
	 * - "completelyDiscard": Remove tag and all content
	 */
	disallowedTagsMode?: "discard" | "escape" | "recursiveEscape" | "completelyDiscard";

	/**
	 * Tags that are self-closing.
	 * @example ["img", "br", "hr"]
	 */
	selfClosing?: string[];

	/**
	 * Allow protocol-relative URLs (//example.com).
	 * @default false
	 */
	allowProtocolRelative?: boolean;
}
