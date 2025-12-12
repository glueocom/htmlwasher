Read and execute:
1. `/Users/miroslavsekera/r/htmlsanitization-server/prompts/prd.md` — Requirements
2. `/Users/miroslavsekera/r/htmlsanitization-server/prompts/implement.md` — Implementation guide

---
when executed last time, threw was a question:
Question:
The current project publishes TypeScript directly (no build step), but the PRD requires `dist/schema.json`. How should
 I handle the JSON schema?

 1. Generate to src/
     Generate schema.json into src/ folder, publish alongside TypeScript files (no build step)
  2. Add build step
     Add tsc build, output schema.json to dist/, change exports to compiled JS
  3. Type something.

Answer:
  2. Add build step

ask questions if  you need to, but in that case, after answering the questions to `/Users/miroslavsekera/r/htmlsanitization-server/prompts/implement.md`