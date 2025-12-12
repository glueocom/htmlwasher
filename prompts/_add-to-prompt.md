ok, rewrite it for sanitize-html

thhe configuration will have a different syntax - it will be YAML equivalent of the sanitize-html config, not current structure.

There will be two steps, two methods
1. just the `wash()` method, accepting `WashOptions` type. one field in the `WashOptions` will be `setup` - it will be the serialized YAML. Then there can be one or more fields like the 
```
	/** Document title (used if <title> is missing) */
	title?: string;
```
2. `parseSetup` will be used to validate and parse the YAML setup. In case of error, it will return an error object with errorCode and errorMessage.


for YAML and YAML validation, use thos libs in the report: /Users/miroslavsekera/r/htmlwasher/prompts/YALM-lib-research.md



also, there wont be the `/Users/miroslavsekera/r/htmlwasher/prompts/library-selection-full.md
and `/Users/miroslavsekera/r/htmlwasher/prompts/library-selection.md`

specify libs in the `/Users/miroslavsekera/r/htmlwasher/prompts/implement.md`

 only the simp

so completelly rewrite the prompts

ask questions if you need to 