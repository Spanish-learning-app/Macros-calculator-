# Katori: project status

**Read this first.** It is the short, human version of `team/state.json`. It is kept current after
every event (an agent starts or finishes, a Boss message, a meeting, a report, a pause), so the Boss,
the team and any new Claude Code session can see what was done, what is next and how to pick up.
Mistakes and the rules they taught us are in `team/MISTAKES.md`.

_Last updated: 2026-10-16 07:06 UTC by Omar._

## Links

- **The app:** https://claude.ai/artifact/GusJdyjFkPK4yftNRPzFrY (published version: Sprint 2 v3, 2026-10-15 16:17 UTC; republish with `npm run publish:files`, see the Publishing notes below)
- **Team HQ dashboard:** https://claude.ai/artifact/PMwzk6CNUn4p8BX6d1Smaq (the Boss's inbox is there)
- **Branch:** `ccr-247c106e-lzhd86`. Every task is committed and pushed.

## Where we are

- **Sprint 1** (logging, targets, Pakistani and Spanish food data): done. Report #1.
- **Sprint 2** (halal meal prep, no-cook tier, shopping list, design refresh): done and published. Report #2.
- **Sprint 3** (habit and finish): in progress.

| Item | State |
|---|---|
| Rules 1.7.x (nudges, Ramadan, weight trend, kam-tel, shortName, alcohol rule) | done (Ayesha) |
| Kam-tel variants (17), short names | done (Zainab, Javier) |
| Base foods for variety (24), packs, seafood | done (Javier) |
| Weight log and trend, spare-box line, meal-name choice, short names in rows, cuisine chips | done in code, **not yet published** (Lena) |
| Variety preps 41–64 (sandwiches, pastas, bowls, tray bakes, soups, breakfasts) | **done in data** (64 preps; lunch 29, 6 desi; ≥4 styles every slot). Not yet published |
| Cost per box, pitch, references on all recipes; weekly plans + ready picks as data (`app/data/plans-mealprep.js`) | done in data (Yusuf, 58/64 have a cost: 6 lack a current price). UI: Lena now |
| **"How to make it": beginner methods in the app** | **UI done** (Lena; Omar tapped through it at 400 px: 45 links, method sheet, step mode, no errors). Data: **64/64 in app data**; the build now fails if any recipe lacks a method. Not yet published |
| Protein tips and Ramadan mode | done in code, checked in Chromium (Lena). Not yet published |
| Sprint 3 wave 1 tests | partial; restarts after Yusuf lands (Kenji) |

## Working now

_Paused 02:06–06:59 UTC (session limit). Restarted at 06:59 UTC with a hard stop at 07:50 UTC; the team is off duty 10:00–18:00 Madrid._

_Max 3 agents at once._

- **Kenji:** Sprint 3 tests (weight, kam-tel, short names, method contract, e2e).
- **Yusuf:** pitch, cost per box and references into app data; weekly plans and ready picks as app data.
- **Priya:** serve chips, saved-meal kcal/protein, wording fixes, kam-tel line, accessibility and speed pass.

## Next, in order

1. When Zainab finishes: set `LEGACY_OK = false` in build.mjs so any recipe without a method stops the build. Kenji adds the e2e step walkthrough after Lena.
2. Yusuf: weekly plans redo (low-cook and budget weeks) as one-tap plans in the app.
3. Lena: Ramadan-mode UI. Priya: accessibility and speed pass.
4. Ayesha: review backlog (129 records awaiting review), and the open bhindi fix.
5. Orphan items O3–O16 below (Priya takes the small UI items, Lena the rest after methods).
6. Review 3 (customer panel, a full week, including cooking from the app), fix wave, final audit, **republish**, delivery report.

## Not in the app yet (orphan check, MISTAKES M-01)

Full audit on 2026-10-16 at about 01:55 UTC. Each item gets an owner and a plan, or a written decision to leave it
out (DECISIONS 2026-10-16). When an item reaches the app, move it to "Done" with the commit.

| # | Item (where it lives now) | Plan | Owner | State |
|---|---|---|---|---|
| O1 | Cooking methods, 64 preps (`research/yusuf/recipes/*.mjs` `method`) | "How to make it" section and step mode | Yusuf, Zainab (data), Lena (UI) | in progress |
| O2 | Reheating notes, food-safety rules (cool within 1 h, reheat once until steaming, ice pack), per-recipe storage plan (sheets, `RULES.mealPrep`) | Goes into each method's `boxUp`/`reheat`, plus one "Keeping boxes safe" note in Prep | Yusuf, Zainab, Lena | in progress |
| O3 | `serve` cold/hot/either on 21 preps (data only) | "Good cold" / "Microwave" chip on library cards and prep rows | Priya | queued |
| O4 | One-line pitch and cost per box, 64 sheets (`pitch`, `## Cost per box`) | Pitch plus "≈ 1.90 € a box (prices 15 Oct)" on library cards | Yusuf (data), Priya (UI) | queued |
| O5 | "Where to buy" notes on 27 ingredients (e.g. garam masala at the Pakistani grocery) | Shown in the weekly shopping list | Lena | queued |
| O6 | Feta → Burgos halal swap: a separate record with no swap button. **Report #2 wrongly said "one-tap swap"** (MISTAKES M-14) | A "Halal swap" button on the feta box that opens the Burgos version | Lena | queued |
| O7 | Low-cook week, budget week and ready-to-eat picks (`docs/MEALPREP.md`) | One-tap plans and picks per slot in Prep | Yusuf (data), Lena (UI) | queued |
| O8 | Halal shopping guide for Barcelona (manteca, gelatina, E-471/472, "¿lleva manteca de cerdo?", butchers) | A section on the About page | Ayesha (text), Priya (UI) | queued |
| O9 | Recipe references, 2–5 links per prep | Listed in the prep's Source panel | Yusuf (data), Lena (UI) | queued |
| O10 | Saved-meal row shows no kcal or protein (Bilal, Nasreen) | Show kcal · protein on the row | Priya | queued |
| O11 | Nasreen's wording carry-overs; kam-tel "half the oil" line | Copy fixes | Priya with Ayesha | queued |
| O12 | Ramadan: full day-by-day table, ±30 min time edit (`RULES.ramadan`) | Part of the Ramadan UI | Lena | queued |
| O13 | Urdu serving labels (`labelUr`, 454 foods) | Shown when "Pakistani meal names" is chosen | Lena | low priority |
| O14 | E2E tests for Sprint 3 features (weight, spare box, meal names, cuisine chips, tips, Ramadan, methods) | E2E suite | Kenji | queued |
| O15 | Two possible bugs from Mariam (Fill Mon–Thu after Monday; "30 g – 30 g" on picos) | Verify, then fix | Kenji, Lena | queued |
| O16 | Accessibility and speed pass (Meeting 005) | As planned | Priya | queued |

**Left out on purpose (DECISIONS 2026-10-16):**
- Per-ingredient Mercadona product and price lines: prices change weekly, so the app shows cost per box with its price date instead.
- `sharePct` and the vocabulary descriptions: internal.
- The sample-day templates (`app/data/templates.js`, never wired up): the weekly plans replace them, and the file is removed in the final audit.
- Diet tag filters (vegetarian/vegan): revisited at Review 3.

## How to resume (for a new session or after a pause)

1. `git pull` the branch. Read this file, `team/MISTAKES.md`, `team/state.json` and the latest meeting in `team/meetings/`.
2. Read the dashboard inbox (`ArtifactData list`, collection `inbox`). The Boss comes first.
3. Restart each `state.json → inFlight` person with a **fresh** agent that reads their brief and journal (`team/journals/<id>.md`). Never replay a transcript. Max 3 at once.
4. The team works 18:00–10:00 Madrid. The hourly check-in routine fires at :09. At the 09:09 check-in, start no new agents: commit, push, and set the dashboard to off duty.
5. Commit and push after every task, and update this file at the same time.

## Publishing notes

- The page wrapper is `tools/artifact-page.html`. `npm run publish:files` prints the files map (keys relative to `app/`, use absolute source paths).
- If this session did not publish the last version, run `Artifact action:list scope:files` on the app URL before republishing.
