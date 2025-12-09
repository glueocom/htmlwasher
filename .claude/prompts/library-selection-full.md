# Library Selection (Full): htmlwasher

## Overview

This document provides complete implementation guidance for replacing the .NET HTML processing stack with pure JavaScript.

## Selected Libraries

### Primary Stack

| Library | Version | Purpose | Environment |
|---------|---------|---------|-------------|
| `dompurify` | ^3.3.x | HTML sanitization, XSS prevention | Browser |
| `isomorphic-dompurify` | ^2.x | DOMPurify wrapper with jsdom | Node.js |
| `cheerio` | ^1.1.x | DOM manipulation, tag replacement | Both |
| `jsdom` | ^25.x | DOM environment (via isomorphic-dompurify) | Node.js |

### Package.json Conditional Exports

```json
{
  "name": "htmlwasher",
  "type": "module",
  "exports": {
    ".": {
      "browser": "./dist/browser.js",
      "node": "./dist/node.js",
      "default": "./dist/node.js"
    }
  },
  "main": "./dist/node.js",
  "browser": "./dist/browser.js",
  "types": "./dist/index.d.ts",
  "dependencies": {
    "cheerio": "^1.1.0",
    "dompurify": "^3.3.0",
    "isomorphic-dompurify": "^2.0.0"
  }
}
```

---

## Configuration Presets

### Tag Whitelist Presets

```typescript
export const TAG_PRESETS = {
  minimal: ['p', 'a', 'strong', 'em', 'br'],
  
  standard: [
    'html', 'head', 'body', 'title',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'a', 'strong', 'i', 'hr',
    'ul', 'ol', 'li',
    'table', 'tbody', 'tr', 'td', 'th',
    'img', 'ruby'
  ],
  
  permissive: [
    'html', 'head', 'body', 'title',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'div', 'span', 'a', 'strong', 'em', 'b', 'i', 'u', 'hr', 'br',
    'ul', 'ol', 'li', 'dl', 'dt', 'dd',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'caption',
    'img', 'figure', 'figcaption',
    'blockquote', 'pre', 'code',
    'ruby', 'rt', 'rp'
  ]
} as const;
```

### Attribute Whitelist (per tag)

```typescript
export const ATTRIBUTE_PRESETS = {
  minimal: {
    a: ['href']
  },
  
  standard: {
    a: ['href'],
    img: ['src', 'alt', 'width', 'height'],
    td: ['colspan', 'rowspan'],
    th: ['colspan', 'rowspan']
  },
  
  permissive: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height', 'loading'],
    td: ['colspan', 'rowspan'],
    th: ['colspan', 'rowspan', 'scope'],
    blockquote: ['cite'],
    code: ['class'],
    pre: ['class']
  }
} as const;
```

### Tag Replacement Presets

```typescript
export const REPLACEMENT_PRESETS = {
  none: {},
  
  semantic: {
    b: 'strong',
    div: 'p'
  }
} as const;
```

### Delete With Content (always applied)

```typescript
export const DELETE_WITH_CONTENT = [
  'script', 'style', 'object', 'embed', 'applet', 
  'area', 'audio', 'video', 'track',
  'base', 'basefont', 'canvas',
  'del', 's', 'strike',
  'frame', 'iframe',
  'keygen', 'map', 'param', 'var'
];
```

---

## Code Implementation Patterns

### C# Original → JavaScript Equivalent

#### 1. Delete Tags With Content

**C# (HtmlAgilityPack):**
```csharp
foreach (HtmlNode node in html.DocumentNode.DescendantsAndSelf().ToArray())
{
    string deleteTag = HtmlCleanerConfiguration.Instance.DeleteWithContent
        .FirstOrDefault(item => string.Equals(node.Name, item, StringComparison.OrdinalIgnoreCase));
    if (!string.IsNullOrWhiteSpace(deleteTag))
    {
        node.Remove();
    }
}
```

**JavaScript (Cheerio):**
```typescript
import * as cheerio from 'cheerio';

function deleteTagsWithContent(html: string, tags: string[]): string {
  const $ = cheerio.load(html);
  $(tags.join(', ')).remove();
  return $.html();
}
```

#### 2. Replace Tags

**C# (HtmlAgilityPack):**
```csharp
foreach (HtmlNode node in html.DocumentNode.DescendantsAndSelf().ToArray())
{
    ReplaceTag replaceTag = HtmlCleanerConfiguration.Instance.Replace
        .FirstOrDefault(item => string.Equals(node.Name, item.Tag, StringComparison.OrdinalIgnoreCase));
    if (replaceTag != null)
    {
        node.Name = replaceTag.NewTag;
    }
}
```

**JavaScript (Cheerio):**
```typescript
function replaceTags(html: string, replacements: Record<string, string>): string {
  const $ = cheerio.load(html);
  
  for (const [oldTag, newTag] of Object.entries(replacements)) {
    $(oldTag).each((_, el) => {
      el.tagName = newTag;
    });
  }
  
  return $.html();
}
```

#### 3. Remove Unallowed Tags (keep children)

**C# (HtmlAgilityPack):**
```csharp
foreach (HtmlNode node in all)
{
    if (node.NodeType == HtmlNodeType.Element)
    {
        AllowedTag allowedTag = HtmlCleanerConfiguration.Instance.Allowed
            .FirstOrDefault(item => string.Equals(node.Name, item.Tag, StringComparison.OrdinalIgnoreCase));
        if (allowedTag == null)
        {
            if (node.ParentNode != null)
            {
                node.ParentNode.RemoveChild(node, true); // true = keep children
            }
        }
    }
}
```

**JavaScript (Cheerio):**
```typescript
function removeUnallowedTags(html: string, allowedTags: string[]): string {
  const $ = cheerio.load(html);
  const allowed = new Set(allowedTags.map(t => t.toLowerCase()));
  
  $('*').each((_, el) => {
    if (el.type === 'tag' && !allowed.has(el.tagName.toLowerCase())) {
      $(el).replaceWith($(el).contents());
    }
  });
  
  return $.html();
}
```

#### 4. Remove Unallowed Attributes

**C# (HtmlAgilityPack):**
```csharp
foreach (HtmlNode node in html.DocumentNode.DescendantsAndSelf())
{
    AllowedTag allowedTag = HtmlCleanerConfiguration.Instance.Allowed
        .FirstOrDefault(item => string.Equals(node.Name, item.Tag, StringComparison.OrdinalIgnoreCase));
    foreach (HtmlAttribute attribute in node.Attributes.ToArray())
    {
        bool allowedAttribute = allowedTag != null && allowedTag.AllowedAttributes
            .Any(a => string.Equals(a, attribute.Name, StringComparison.OrdinalIgnoreCase));
        if (!allowedAttribute)
        {
            attribute.Remove();
        }
    }
}
```

**JavaScript (Cheerio):**
```typescript
function removeUnallowedAttributes(
  html: string, 
  allowedAttributes: Record<string, string[]>
): string {
  const $ = cheerio.load(html);
  
  $('*').each((_, el) => {
    if (el.type !== 'tag') return;
    
    const tagName = el.tagName.toLowerCase();
    const allowed = new Set(
      (allowedAttributes[tagName] || []).map(a => a.toLowerCase())
    );
    
    const attribs = el.attribs || {};
    for (const attr of Object.keys(attribs)) {
      if (!allowed.has(attr.toLowerCase())) {
        $(el).removeAttr(attr);
      }
    }
  });
  
  return $.html();
}
```

#### 5. HTML Tidy Equivalent (repair/sanitize)

**C# (Tidy wrapper):**
```csharp
string arguments = "--quiet -ashtml -indent -utf8 --hide-comments yes --wrap 0 --tidy-mark no --show-body-only auto --force-output yes";
if (cleanup) arguments += " -clean -bare -gdoc";
```

**JavaScript (DOMPurify):**
```typescript
// Browser
import DOMPurify from 'dompurify';

function sanitizeHtml(dirty: string, allowedTags: string[]): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: allowedTags,
    KEEP_CONTENT: true,
    WHOLE_DOCUMENT: true,  // preserve html/head/body structure
  });
}

// Node.js
import DOMPurify from 'isomorphic-dompurify';
// Same API
```

#### 6. Add Alt to Images

**C# (HtmlAgilityPack):**
```csharp
if (string.Equals(node.Name, "img", StringComparison.OrdinalIgnoreCase))
{
    HtmlAttribute alt = node.Attributes.FirstOrDefault(
        item => string.Equals(item.Name, "alt", StringComparison.OrdinalIgnoreCase));
    if (alt == null)
    {
        node.Attributes.Add("alt", string.Empty);
    }
    if (string.IsNullOrWhiteSpace(alt.Value))
    {
        alt.Value = CreateAlt(srcValue);
    }
}
```

**JavaScript (Cheerio):**
```typescript
function ensureImageAlt(html: string): string {
  const $ = cheerio.load(html);
  
  $('img').each((_, el) => {
    const $img = $(el);
    if (!$img.attr('alt')) {
      const src = $img.attr('src') || '';
      const filename = src.split('/').pop()?.split('?')[0] || '';
      const alt = filename.split('.')[0] || '';
      $img.attr('alt', alt);
    }
  });
  
  return $.html();
}
```

---

## Full Pipeline Implementation

```typescript
import * as cheerio from 'cheerio';
import type { CheerioAPI } from 'cheerio';

// Platform-specific import handled by conditional exports
import { sanitize } from './platform'; // resolves to browser.ts or node.ts

export interface WashOptions {
  tagPreset?: 'minimal' | 'standard' | 'permissive';
  replacementPreset?: 'none' | 'semantic';
  customTags?: string[];
  customAttributes?: Record<string, string[]>;
  customReplacements?: Record<string, string>;
  title?: string;
}

export interface WashResult {
  html: string;
  warnings: string[];
}

export function wash(dirty: string, options: WashOptions = {}): WashResult {
  const warnings: string[] = [];
  
  if (!dirty?.trim()) {
    return { html: '', warnings: ['Empty input'] };
  }
  
  const {
    tagPreset = 'standard',
    replacementPreset = 'none',
    customTags,
    customAttributes,
    customReplacements,
    title = 'New Page'
  } = options;
  
  // Resolve presets
  const allowedTags = customTags || TAG_PRESETS[tagPreset];
  const allowedAttrs = customAttributes || ATTRIBUTE_PRESETS[tagPreset];
  const replacements = customReplacements || REPLACEMENT_PRESETS[replacementPreset];
  
  let html = dirty;
  
  // 1. First pass: sanitize and repair malformed HTML
  html = sanitize(html, allowedTags);
  
  // 2. Delete dangerous tags with content
  html = deleteTagsWithContent(html, DELETE_WITH_CONTENT);
  
  // 3. Replace tags (if preset is not 'none')
  if (Object.keys(replacements).length > 0) {
    html = replaceTags(html, replacements);
  }
  
  // 4. Remove unallowed tags (keep children)
  html = removeUnallowedTags(html, allowedTags);
  
  // 5. Remove unallowed attributes
  html = removeUnallowedAttributes(html, allowedAttrs);
  
  // 6. Ensure title exists
  html = ensureTitle(html, title);
  
  // 7. Ensure image alt attributes
  html = ensureImageAlt(html);
  
  // 8. Final sanitize pass
  html = sanitize(html, allowedTags);
  
  return { html, warnings };
}
```

---

## Configuration Mapping: htmlcleaner.json → TypeScript

**Original C# config:**
```json
{
  "htmlCleaner": {
    "replace": [
      { "tag": "b", "newTag": "strong" },
      { "tag": "div", "newTag": "p" }
    ],
    "allowed": [
      { "tag": "a", "attributes": ["href"] },
      { "tag": "img", "attributes": ["src", "width", "height", "alt"] },
      { "tag": "td", "attributes": ["colspan", "rowspan"] }
    ],
    "deleteWithContent": ["script", "style", "iframe"]
  }
}
```

**Equivalent TypeScript config:**
```typescript
const config: WashOptions = {
  tagPreset: 'standard',           // or customTags: [...]
  replacementPreset: 'semantic',   // or customReplacements: { b: 'strong', div: 'p' }
  // customAttributes: { a: ['href'], img: ['src', 'alt', 'width', 'height'] }
};

const result = wash(dirtyHtml, config);
```
