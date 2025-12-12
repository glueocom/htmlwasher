import { parseSetup, presets, wash } from "./index";

describe("wash", () => {
	it("should sanitize HTML with default preset", () => {
		const result = wash("<p>Hello</p><script>alert(1)</script>");
		expect(result.html).toBe("<p>Hello</p>");
		expect(result.warnings).toEqual([]);
	});

	it("should remove script tags regardless of config", () => {
		const result = wash("<div><script>alert(1)</script><p>Hello</p></div>");
		expect(result.html).not.toContain("script");
		expect(result.html).toContain("Hello");
	});

	it("should remove iframe tags regardless of config", () => {
		const result = wash('<iframe src="evil.com"></iframe><p>Text</p>');
		expect(result.html).not.toContain("iframe");
		expect(result.html).toContain("Text");
	});

	it("should remove style tags", () => {
		const result = wash("<style>body { color: red }</style><p>Text</p>");
		expect(result.html).not.toContain("style");
	});

	it("should preserve allowed tags", () => {
		const result = wash("<p>Hello <strong>World</strong></p>");
		expect(result.html).toBe("<p>Hello <strong>World</strong></p>");
	});

	it("should use custom setup", () => {
		const setup = `
allowedTags:
  - p
`;
		const result = wash("<p>Hello</p><div>World</div>", { setup });
		expect(result.html).toBe("<p>Hello</p>World");
	});

	it("should add empty alt to images without alt", () => {
		const setup = `
allowedTags:
  - img
allowedAttributes:
  img:
    - src
`;
		const result = wash('<img src="test.jpg">', { setup });
		expect(result.html).toContain('alt=""');
		expect(result.warnings).toContain("Image(s) found without alt attribute, empty alt added");
	});

	it("should preserve images with alt attribute", () => {
		const setup = `
allowedTags:
  - img
allowedAttributes:
  img:
    - src
    - alt
`;
		const result = wash('<img src="test.jpg" alt="Test">', { setup });
		expect(result.html).toContain('alt="Test"');
		expect(result.warnings).toEqual([]);
	});

	it("should add title when provided and missing", () => {
		const result = wash("<p>Content</p>", { title: "My Page" });
		expect(result.html).toContain("<title>My Page</title>");
	});

	it("should escape special characters in title", () => {
		const result = wash("<p>Content</p>", { title: "<script>" });
		expect(result.html).toContain("&lt;script&gt;");
		expect(result.html).not.toContain("<script>");
	});

	it("should fallback to standard preset on invalid setup", () => {
		const result = wash("<p>Hello</p>", { setup: "invalid: [yaml" });
		expect(result.warnings.length).toBeGreaterThan(0);
		expect(result.html).toBe("<p>Hello</p>");
	});
});

describe("parseSetup", () => {
	it("should parse valid YAML config", () => {
		const yaml = `
allowedTags:
  - p
  - a
allowedAttributes:
  a:
    - href
`;
		const result = parseSetup(yaml);
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.config.allowedTags).toEqual(["p", "a"]);
			expect(result.config.allowedAttributes).toEqual({ a: ["href"] });
		}
	});

	it("should return error for invalid YAML syntax", () => {
		const yaml = "invalid: [yaml";
		const result = parseSetup(yaml);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errorCode).toBe("YAML_SYNTAX_ERROR");
		}
	});

	it("should return error for schema validation failure", () => {
		const yaml = `
allowedTags: "not-an-array"
`;
		const result = parseSetup(yaml);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errorCode).toBe("SCHEMA_VALIDATION_ERROR");
		}
	});

	it("should reject unknown properties", () => {
		const yaml = `
unknownProperty: true
`;
		const result = parseSetup(yaml);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errorCode).toBe("SCHEMA_VALIDATION_ERROR");
		}
	});

	it("should validate disallowedTagsMode enum", () => {
		const validYaml = `
disallowedTagsMode: escape
`;
		const validResult = parseSetup(validYaml);
		expect(validResult.ok).toBe(true);

		const invalidYaml = `
disallowedTagsMode: invalid
`;
		const invalidResult = parseSetup(invalidYaml);
		expect(invalidResult.ok).toBe(false);
	});
});

describe("presets", () => {
	it("should have minimal preset", () => {
		expect(presets.minimal).toBeDefined();
		expect(typeof presets.minimal).toBe("string");
		const result = parseSetup(presets.minimal);
		expect(result.ok).toBe(true);
	});

	it("should have standard preset", () => {
		expect(presets.standard).toBeDefined();
		expect(typeof presets.standard).toBe("string");
		const result = parseSetup(presets.standard);
		expect(result.ok).toBe(true);
	});

	it("should have permissive preset", () => {
		expect(presets.permissive).toBeDefined();
		expect(typeof presets.permissive).toBe("string");
		const result = parseSetup(presets.permissive);
		expect(result.ok).toBe(true);
	});

	it("minimal preset should allow basic tags", () => {
		const result = parseSetup(presets.minimal);
		if (result.ok) {
			expect(result.config.allowedTags).toContain("p");
			expect(result.config.allowedTags).toContain("a");
			expect(result.config.allowedTags).toContain("strong");
		}
	});

	it("standard preset should allow tables", () => {
		const result = parseSetup(presets.standard);
		if (result.ok) {
			expect(result.config.allowedTags).toContain("table");
			expect(result.config.allowedTags).toContain("tr");
			expect(result.config.allowedTags).toContain("td");
		}
	});

	it("permissive preset should allow div and span", () => {
		const result = parseSetup(presets.permissive);
		if (result.ok) {
			expect(result.config.allowedTags).toContain("div");
			expect(result.config.allowedTags).toContain("span");
			expect(result.config.allowedTags).toContain("code");
		}
	});
});

describe("XSS prevention", () => {
	it("should remove javascript: URLs", () => {
		const setup = `
allowedTags:
  - a
allowedAttributes:
  a:
    - href
`;
		const result = wash('<a href="javascript:alert(1)">Click</a>', { setup });
		expect(result.html).not.toContain("javascript:");
	});

	it("should remove event handlers", () => {
		const setup = `
allowedTags:
  - div
allowedAttributes:
  div:
    - onclick
`;
		const result = wash('<div onclick="alert(1)">Test</div>', { setup });
		expect(result.html).not.toContain("onclick");
	});

	it("should handle nested dangerous content", () => {
		const result = wash("<div><script><script>alert(1)</script></script></div>");
		expect(result.html).not.toContain("script");
	});
});
