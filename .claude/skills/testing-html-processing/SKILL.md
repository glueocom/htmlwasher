---
name: testing-html-processing
description: Test patterns for HTML sanitization libraries. Use when writing tests for tag whitelisting, malformed HTML repair, XSS prevention, preset configurations (minimal/standard/permissive), or browser vs Node.js output parity.
---

# Testing HTML Processing

Test patterns for HTML sanitization and washing libraries.

## Test Structure

Organize tests by category:

```
src/
├── wash.test.ts           # Main function tests
├── presets.test.ts        # Preset configuration tests
├── sanitize.test.ts       # XSS and security tests
└── parity.test.ts         # Browser/Node output comparison
```

## Tag Whitelisting Tests

```typescript
describe('tag whitelisting', () => {
  it('keeps allowed tags', () => {
    const input = '<p>Hello <strong>world</strong></p>'
    const result = wash(input, { tagPreset: 'minimal' })
    expect(result.html).toContain('<p>')
    expect(result.html).toContain('<strong>')
  })

  it('removes disallowed tags, keeps content', () => {
    const input = '<div><span>text</span></div>'
    const result = wash(input, { tagPreset: 'minimal' })
    expect(result.html).not.toContain('<div>')
    expect(result.html).not.toContain('<span>')
    expect(result.html).toContain('text')
  })

  it('removes dangerous tags with content', () => {
    const input = '<p>before</p><script>alert(1)</script><p>after</p>'
    const result = wash(input)
    expect(result.html).not.toContain('<script>')
    expect(result.html).not.toContain('alert')
  })
})
```

## Malformed HTML Tests

```typescript
describe('malformed HTML repair', () => {
  it('closes unclosed tags', () => {
    const input = '<p>unclosed paragraph'
    const result = wash(input)
    expect(result.html).toContain('</p>')
  })

  it('handles nested unclosed tags', () => {
    const input = '<div><p>text'
    const result = wash(input)
    expect(result.html).toMatch(/<\/p>.*<\/div>/s)
  })

  it('removes stray closing tags', () => {
    const input = '</p>text<p>valid</p>'
    const result = wash(input)
    expect(result.html).toContain('text')
  })
})
```

## XSS Prevention Tests

See [references/xss-vectors.md](references/xss-vectors.md) for comprehensive test vectors.

```typescript
describe('XSS prevention', () => {
  it('removes javascript: URLs', () => {
    const input = '<a href="javascript:alert(1)">click</a>'
    const result = wash(input)
    expect(result.html).not.toContain('javascript:')
  })

  it('removes event handlers', () => {
    const input = '<img src="x" onerror="alert(1)">'
    const result = wash(input)
    expect(result.html).not.toContain('onerror')
  })

  it('removes data: URLs in images', () => {
    const input = '<img src="data:text/html,<script>alert(1)</script>">'
    const result = wash(input)
    expect(result.html).not.toContain('data:')
  })
})
```

## Preset Configuration Tests

```typescript
describe('presets', () => {
  describe('minimal', () => {
    it('allows only p, a, strong, em, br', () => {
      const input = '<div><p><a href="#">link</a></p><table><tr><td>x</td></tr></table></div>'
      const result = wash(input, { tagPreset: 'minimal' })
      expect(result.html).toContain('<p>')
      expect(result.html).toContain('<a')
      expect(result.html).not.toContain('<div>')
      expect(result.html).not.toContain('<table>')
    })
  })

  describe('standard', () => {
    it('allows tables and headings', () => {
      const input = '<h1>Title</h1><table><tr><td>cell</td></tr></table>'
      const result = wash(input, { tagPreset: 'standard' })
      expect(result.html).toContain('<h1>')
      expect(result.html).toContain('<table>')
    })
  })

  describe('permissive', () => {
    it('allows div, span, and code blocks', () => {
      const input = '<div><span>inline</span><pre><code>code</code></pre></div>'
      const result = wash(input, { tagPreset: 'permissive' })
      expect(result.html).toContain('<div>')
      expect(result.html).toContain('<span>')
      expect(result.html).toContain('<pre>')
    })
  })
})
```

## Browser/Node Parity Tests

Run same inputs through both environments and compare:

```typescript
describe('browser/node parity', () => {
  const testCases = [
    '<p>simple</p>',
    '<div><p>nested</p></div>',
    '<a href="http://example.com">link</a>',
    '<img src="test.jpg" alt="test">',
  ]

  testCases.forEach((input) => {
    it(`produces identical output for: ${input.slice(0, 30)}...`, () => {
      const browserResult = washBrowser(input)
      const nodeResult = washNode(input)
      expect(browserResult.html).toBe(nodeResult.html)
    })
  })
})
```
