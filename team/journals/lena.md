# Journal — lena

- 2026-10-13 22:03 UTC: Read docs/BRIEF.md, ROSTER, PLAYBOOK, the common brief and all lead briefs. The journal was empty, so this is a fresh start. Kickoff meeting 001 called by Omar; I am writing the engineering memo.
- 2026-10-13 22:05 UTC: Checked the toolchain in the scratchpad (no repo changes): Node 22.22, ESLint 10.1 runs with a flat config that has no plugins, Prettier 3.8, and `node --test` works on ESM. Playwright 1.56.1 is global with Chromium at /opt/pw-browsers. ESM specs cannot resolve it through NODE_PATH (ERR_MODULE_NOT_FOUND), but a `node_modules/playwright` symlink (`npm link playwright`) works: 2/2 passed on phone and desktop against http-server.
- 2026-10-13 22:10 UTC: Wrote team/meetings/001-kickoff/memo-lena.md. Decisions:
  - vanilla ES modules with no build step and zero runtime dependencies
  - a pure `app/core/` whose contracts the memo lists
  - food data as ES modules
  - all user data under one localStorage key `mmc.v1`, with a memory fallback and export/import through a textarea or file input
  - entries keep foodId plus a snapshot, and totals use the live database
  - hiring request: Core Logic, UI and QA engineers (3)
- 2026-10-13 22:11 UTC: Next, after the meeting: wait for Omar's minutes (reconciled food schema, approved hires). Then do Step 0: package.json, eslint/prettier configs, docs/ARCHITECTURE.md, the app shell and core stubs. Open item: Ayesha must confirm that `carbs` means total carbohydrate including fiber.
- 2026-10-13 22:14 UTC: Read Ayesha's memo (read-only) and aligned mine with it.
  - `carbs` = available carbohydrate, fibre excluded. This settles the open item.
  - energyCheck = 4P + 4C + 9F + 2·fibre, passing within the larger of ±10% or ±10 kcal; factors and tolerance go in rules.js.
  - Confidence uses A/B/C.
  - Her fields are adopted in camelCase: nameUr, nameRoman, family, state, style, labelUr, source {citation, method, confidence, reviewer, date}.
  - The code-hard fields are unchanged: id, name, aliases, per100g (5 fields), servings {id, label, grams, default}, tags, source.citation.
