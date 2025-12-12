export const presets = {
	minimal: `# Minimal preset - basic text formatting only
allowedTags:
  - p
  - a
  - strong
  - em
  - br

allowedAttributes:
  a:
    - href

disallowedTagsMode: discard
allowProtocolRelative: false
`,
	standard: `# Standard preset - common HTML elements for content
allowedTags:
  - p
  - a
  - strong
  - em
  - b
  - i
  - u
  - br
  - ul
  - ol
  - li
  - h1
  - h2
  - h3
  - h4
  - h5
  - h6
  - img
  - table
  - thead
  - tbody
  - tr
  - th
  - td

allowedAttributes:
  a:
    - href
    - title
    - target
  img:
    - src
    - alt
    - width
    - height
  td:
    - colspan
    - rowspan
  th:
    - colspan
    - rowspan

selfClosing:
  - img
  - br
  - hr

disallowedTagsMode: discard
allowProtocolRelative: false
`,
	permissive: `# Permissive preset - extended with div, span, code, pre, blockquote
allowedTags:
  - p
  - a
  - strong
  - em
  - b
  - i
  - u
  - br
  - ul
  - ol
  - li
  - h1
  - h2
  - h3
  - h4
  - h5
  - h6
  - img
  - table
  - thead
  - tbody
  - tr
  - th
  - td
  - div
  - span
  - code
  - pre
  - blockquote
  - hr
  - sub
  - sup

allowedAttributes:
  a:
    - href
    - title
    - target
  img:
    - src
    - alt
    - width
    - height
  td:
    - colspan
    - rowspan
  th:
    - colspan
    - rowspan
  div:
    - class
  span:
    - class
  code:
    - class
  pre:
    - class

allowedClasses:
  div:
    - container
    - wrapper
    - content
  span:
    - highlight
    - note
  code:
    - language-javascript
    - language-typescript
    - language-python
    - language-html
    - language-css

selfClosing:
  - img
  - br
  - hr

disallowedTagsMode: discard
allowProtocolRelative: false
`,
} as const;

export type PresetName = keyof typeof presets;
