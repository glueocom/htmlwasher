---
name: testing-html-processing
description: Test patterns for HTML sanitization libraries. Use when writing tests for tag whitelisting, attribute filtering, tag replacement, malformed HTML repair, XSS prevention, preset configurations (minimal/standard/permissive), or browser vs Node.js output parity.
---

# Testing HTML Processing

Test patterns for HTML sanitization and washing libraries using Vitest.

## Test Structure

```
src/
├── __tests__/
│   ├── wash.test.ts           # Main function tests
│   ├── presets.test.ts        # Preset configuration tests
│   ├── sanitize.test.ts       # XSS and security tests
│   ├── attributes.test.ts     # Attribute whitelisting tests
│   ├── replacement.test.ts    # Tag replacement tests
│   └── parity.test.ts         # Browser/Node output comparison
```

## Tag Whitelisting Tests

```typescript
import { describe, it, expect } from 'vitest'
import { wash } from '../wash'

describe('tag whitelisting', () => {
  it('keeps allowed tags', () => {
    const input = '<p>Hello <strong>world</strong></p>'
    const result = wash(input, { tagPreset: 'minimal' })
    expect(result.html).toContain('<p>')
    expect(result.html).toContain('<strong>')
  })

  it('removes disallowed tags, keeps content (unwrap)', () => {
    const input = '<div><span>text</span></div>'
    const result = wash(input, { tagPreset: 'minimal' })
    expect(result.html).not.toContain('<div>')
    expect(result.html).not.toContain('<span>')
    expect(result.html).toContain('text')
  })

  it('removes dangerous tags WITH content (no unwrap)', () => {
    const input = '<p>before</p><script>alert(1)</script><p>after</p>'
    const result = wash(input)
    expect(result.html).not.toContain('<script>')
    expect(result.html).not.toContain('alert')
    expect(result.html).toContain('before')
    expect(result.html).toContain('after')
  })
})
```

## Attribute Whitelisting Tests

```typescript
describe('attribute whitelisting', () => {
  it('keeps allowed attributes', () => {
    const input = '<a href="https://example.com" title="link">click</a>'
    const result = wash(input, { tagPreset: 'standard' })
    expect(result.html).toContain('href="https://example.com"')
  })

  it('removes disallowed attributes', () => {
    const input = '<a href="https://example.com" onclick="alert(1)" class="btn">click</a>'
    const result = wash(input, { tagPreset: 'standard' })
    expect(result.html).toContain('href=')
    expect(result.html).not.toContain('onclick')
    expect(result.html).not.toContain('class')
  })

  it('keeps colspan/rowspan on table cells', () => {
    const input = '<table><tr><td colspan="2" style="color:red">cell</td></tr></table>'
    const result = wash(input, { tagPreset: 'standard' })
    expect(result.html).toContain('colspan="2"')
    expect(result.html).not.toContain('style')
  })

  it('keeps img attributes', () => {
    const input = '<img src="test.jpg" alt="test" width="100" height="50" class="img">'
    const result = wash(input, { tagPreset: 'standard' })
    expect(result.html).toContain('src="test.jpg"')
    expect(result.html).toContain('alt="test"')
    expect(result.html).toContain('width="100"')
    expect(result.html).not.toContain('class')
  })
})
```

## Tag Replacement Tests

```typescript
describe('tag replacement', () => {
  describe('semantic preset', () => {
    it('replaces b with strong', () => {
      const input = '<p><b>bold text</b></p>'
      const result = wash(input, { replacementPreset: 'semantic' })
      expect(result.html).toContain('<strong>bold text</strong>')
      expect(result.html).not.toContain('<b>')
    })

    it('replaces div with p', () => {
      const input = '<div>paragraph text</div>'
      const result = wash(input, { replacementPreset: 'semantic' })
      expect(result.html).toContain('<p>paragraph text</p>')
      expect(result.html).not.toContain('<div>')
    })
  })

  describe('none preset', () => {
    it('keeps b as b', () => {
      const input = '<p><b>bold text</b></p>'
      const result = wash(input, { 
        replacementPreset: 'none',
        customTags: ['p', 'b']
      })
      expect(result.html).toContain('<b>bold text</b>')
    })
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
    const result = wash(input, { tagPreset: 'permissive' })
    expect(result.html).toMatch(/<\/p>/)
  })

  it('handles mismatched tags', () => {
    const input = '<p>text</div>'
    const result = wash(input)
    expect(result.html).toContain('<p>')
    expect(result.html).toContain('</p>')
  })

  it('handles deeply nested broken HTML', () => {
    const input = '<div><p><span>text'
    const result = wash(input, { tagPreset: 'permissive' })
    expect(result.html).toContain('text')
  })
})
```

## XSS Prevention Tests

See [references/xss-vectors.md](references/xss-vectors.md) for comprehensive vectors.

```typescript
describe('XSS prevention', () => {
  it('removes javascript: URLs', () => {
    const input = '<a href="javascript:alert(1)">click</a>'
    const result = wash(input)
    expect(result.html).not.toContain('javascript:')
    expect(result.html).toContain('click')
  })

  it('removes event handlers', () => {
    const input = '<img src="x.jpg" onerror="alert(1)">'
    const result = wash(input)
    expect(result.html).not.toContain('onerror')
    expect(result.html).toContain('src="x.jpg"')
  })

  it('removes data: URLs in images', () => {
    const input = '<img src="data:text/html,<script>alert(1)</script>">'
    const result = wash(input)
    expect(result.html).not.toContain('data:')
  })

  it('removes script tags completely', () => {
    const input = '<script>alert(document.cookie)</script>'
    const result = wash(input)
    expect(result.html).not.toContain('script')
    expect(result.html).not.toContain('alert')
    expect(result.html).not.toContain('cookie')
  })

  it('handles encoded javascript', () => {
    const input = '<a href="&#106;avascript:alert(1)">click</a>'
    const result = wash(input)
    expect(result.html).not.toMatch(/javascript/i)
  })
})
```

## Preset Configuration Tests

```typescript
describe('presets', () => {
  describe('minimal', () => {
    const preset = { tagPreset: 'minimal' as const }
    
    it('allows: p, a, strong, em, br', () => {
      const input = '<p><a href="#">link</a> <strong>bold</strong> <em>italic</em></p>'
      const result = wash(input, preset)
      expect(result.html).toContain('<p>')
      expect(result.html).toContain('<a')
      expect(result.html).toContain('<strong>')
      expect(result.html).toContain('<em>')
    })

    it('removes tables, divs, headings', () => {
      const input = '<h1>title</h1><div><table><tr><td>x</td></tr></table></div>'
      const result = wash(input, preset)
      expect(result.html).not.toContain('<h1>')
      expect(result.html).not.toContain('<div>')
      expect(result.html).not.toContain('<table>')
      expect(result.html).toContain('title')
      expect(result.html).toContain('x')
    })
  })

  describe('standard', () => {
    const preset = { tagPreset: 'standard' as const }
    
    it('allows tables and headings', () => {
      const input = '<h1>Title</h1><table><tr><td>cell</td></tr></table>'
      const result = wash(input, preset)
      expect(result.html).toContain('<h1>')
      expect(result.html).toContain('<table>')
      expect(result.html).toContain('<td>')
    })

    it('allows images with attributes', () => {
      const input = '<img src="photo.jpg" alt="Photo" width="200">'
      const result = wash(input, preset)
      expect(result.html).toContain('<img')
      expect(result.html).toContain('src="photo.jpg"')
      expect(result.html).toContain('alt="Photo"')
    })
  })

  describe('permissive', () => {
    const preset = { tagPreset: 'permissive' as const }
    
    it('allows div, span, and code blocks', () => {
      const input = '<div><span>inline</span><pre><code>code</code></pre></div>'
      const result = wash(input, preset)
      expect(result.html).toContain('<div>')
      expect(result.html).toContain('<span>')
      expect(result.html).toContain('<pre>')
      expect(result.html).toContain('<code>')
    })

    it('allows blockquote', () => {
      const input = '<blockquote>quoted text</blockquote>'
      const result = wash(input, preset)
      expect(result.html).toContain('<blockquote>')
    })
  })
})
```

## Document Structure Tests

```typescript
describe('document structure', () => {
  it('preserves html/head/body structure', () => {
    const input = '<html><head><title>Test</title></head><body><p>content</p></body></html>'
    const result = wash(input)
    expect(result.html).toContain('<html>')
    expect(result.html).toContain('<head>')
    expect(result.html).toContain('<body>')
  })

  it('adds title if missing', () => {
    const input = '<html><body><p>content</p></body></html>'
    const result = wash(input, { title: 'My Title' })
    expect(result.html).toContain('<title>My Title</title>')
  })

  it('adds default title if none provided', () => {
    const input = '<p>content</p>'
    const result = wash(input)
    expect(result.html).toContain('<title>')
  })
})
```

## Output Format Tests

```typescript
describe('output format', () => {
  it('returns WashResult object', () => {
    const result = wash('<p>test</p>')
    expect(result).toHaveProperty('html')
    expect(result).toHaveProperty('warnings')
    expect(typeof result.html).toBe('string')
    expect(Array.isArray(result.warnings)).toBe(true)
  })

  it('returns empty html for empty input', () => {
    const result = wash('')
    expect(result.html).toBe('')
  })

  it('returns empty html for whitespace input', () => {
    const result = wash('   \n\t  ')
    expect(result.html).toBe('')
  })
})
```
