# Katori: project status

**Read this first.** It is the short, human version of `team/state.json`. It is kept current after
every event (an agent starts or finishes, a Boss message, a meeting, a report, a pause), so the Boss,
the team and any new Claude Code session can see what was done, what is next and how to pick up.
Mistakes and the rules they taught us are in `team/MISTAKES.md`.

_Last updated: 2026-10-17 00:10 UTC by Omar._

## Links

- **The app:** https://claude.ai/artifact/GusJdyjFkPK4yftNRPzFrY (published **Sprint 3 preview v4**, 2026-10-16 07:33 UTC: How to make it on all 64 preps, weekly plans, ready picks, halal swap, cost per box, serve chips, weight log, protein tips, Ramadan mode). Republish with `npm run publish:files`; see the Publishing notes below.
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
| Weight log and trend, spare-box line, meal-name choice, short names in rows, cuisine chips | done in code, **published in v4** (Lena) |
| Variety preps 41–64 (sandwiches, pastas, bowls, tray bakes, soups, breakfasts) | **done in data** (64 preps; lunch 29, 6 desi; ≥4 styles every slot). Published in v4 |
| Cost per box, pitch, references on all recipes; weekly plans + ready picks as data (`app/data/plans-mealprep.js`) | done in data (Yusuf, 58/64 have a cost: 6 lack a current price). UI: Lena now |
| **"How to make it": beginner methods in the app** | **UI done** (Lena; Omar tapped through it at 400 px: 45 links, method sheet, step mode, no errors). Data: **64/64 in app data**; the build now fails if any recipe lacks a method. Published in v4 |
| Protein tips and Ramadan mode | done in code, checked in Chromium (Lena). Published in v4 |
| Sprint 3 wave 1 tests | partial; restarts after Yusuf lands (Kenji) |

## Working now (night shift)

_Paused 19:30–00:10 UTC (session limit). Lena, Yusuf and Bilal restarted fresh at 00:10 UTC._

- **Nasreen:** Review 3, cooking as a first-time cook from the methods.
- Done: **Kenji**: everything green, 735 unit tests and 524 e2e (incl. plans, picks, swap, chips, Ramadan table, halal guide).
- **Bilal:** Review 3, a lifter's week (numbers, speed, tap counts) on snapshot 4a702b5.
- Done: **Priya**: first load 10–17 % faster (recipes load later), "2 biscuits" plurals, a11y re-check of the new dialogs; the halal guide card and Check button.
- **Lena:** fix wave R3-A from Mariam's Review 3 (team/feedback/mariam-review3.md): plan ↔ batch link, the plan's fridge/freezer split, evening nudges on screen, a whole-week shopping list, the Merienda slot, the protein tip with a plan on.
- **Yusuf:** fix wave R3-B (recipe data): one storage truth across method, record and plan; "Done when" before packing; safe roti timing; honest total minutes; shopping names that match the methods; household measures; evening jobs in the plans.
- Done: **Nasreen Review 3: 7/10** (about 6 at Review 2). The methods are well ordered and the roti is doable, but the recipe doesn't scale to the portions cooked, the storage answer differs between screens, and "null" shows in the ingredient picker.
- Done: **Mariam Review 3: 8.5/10** (from 8). Plans hold together until the week starts, then batches, nudges and the shopping list drift (6 must-fix).
- Done: **Lab rebuild**: G19 = **0** (every record reviewed), 351/351 pass, no numbers moved, cola names split.
- Done: **Ayesha**: all 14 remaining records pass; new R4 check on meal-prep ingredient links (M-16); cola kept as two clearly named records (saved logs stay valid).
- **Timeline (told to the Boss):** finish tonight, then Review 3, the fix wave, the final audit, a republish and the delivery report. Target was Sat 17 Oct about 10:00 Madrid; after tonight's 4.5 h pause the realistic target is **Saturday night (from 18:00 Madrid)**.
- Done tonight:
  - **Yusuf:** budget week **58.97 €** (was 77.17 €), every figure generated (M-15 closed), the `halalSwap` field, 3 more prices, Ayesha's fixes (light mozzarella, halal soy sauce, smoothie 1 day). Omar tapped the budget plan and the swap in the app: both work.
  - **Javier:** 3 records.
  - **Lena:** Plan it, step-mode a11y, editor wording, Ramadan table (O12), Urdu labels (O13).
  - **Ayesha:** rules 1.7.2, the halal guide as data, 111 reviews, the bhindi ruling.
- Next: Ayesha re-checks the 6 held preps; then Review 3.

## Next, in order (from 18:09 Madrid)

1. Yusuf: the budget week costs 77.17 €, and the guide wrongly says "60 € or less" (M-15). Bring it under 60 € or fix the text, and generate the figure. Add `halalSwap` to the feta recipe so Lena can drop her map.
2. Kenji: turn the BUG-M0/M1/M2 todo tests into plain tests (all fixed), and add e2e for plans, ready picks, swap and serve chips.
3. Lena: "Plan it" on today's spare box logs it as eaten (design call); step-mode aria-live; Nasreen's recipe-editor wording; Ramadan table and time edit (O12); Urdu labels (O13, low).
4. Priya: lazy-load the recipe data (first load 1.4 s); the "2 biscuit" plural.
5. Ayesha: Priya's rules.js wording proposals; the smoothie's 24 h fridge life; 138 records awaiting review (G19); the bhindi fix; the halal shopping guide text (O8).
6. Review 3 (customer panel: a full week, cooking from the app), fix wave, final audit, delivery report.

## Not in the app yet (orphan check, MISTAKES M-01)

Full audit on 2026-10-16 at about 01:55 UTC. Each item gets an owner and a plan, or a written decision to leave it
out (DECISIONS 2026-10-16). When an item reaches the app, move it to "Done" with the commit.

| # | Item (where it lives now) | Plan | Owner | State |
|---|---|---|---|---|
| O1 | Cooking methods, 64 preps (`research/yusuf/recipes/*.mjs` `method`) | "How to make it" section and step mode | Yusuf, Zainab (data), Lena (UI) | **done, published v4** (2026-10-16) |
| O2 | Reheating notes, food-safety rules (cool within 1 h, reheat once until steaming, ice pack), per-recipe storage plan (sheets, `RULES.mealPrep`) | Goes into each method's `boxUp`/`reheat`, plus one "Keeping boxes safe" note in Prep | Yusuf, Zainab, Lena | **done, published v4** (2026-10-16) |
| O3 | `serve` cold/hot/either on 21 preps (data only) | "Good cold" / "Microwave" chip on library cards and prep rows | Priya | **done in code** (Priya, 2026-10-16; published in v4) |
| O4 | One-line pitch and cost per box, 64 sheets (`pitch`, `## Cost per box`) | Pitch plus "≈ 1.90 € a box (prices 15 Oct)" on library cards | Yusuf (data), Priya (UI) | **done, published v4** (2026-10-16) |
| O5 | "Where to buy" notes on 27 ingredients (e.g. garam masala at the Pakistani grocery) | Shown in the weekly shopping list | Lena | **done, published v4** (2026-10-16) |
| O6 | Feta → Burgos halal swap: a separate record with no swap button. **Report #2 wrongly said "one-tap swap"** (MISTAKES M-14) | A "Halal swap" button on the feta box that opens the Burgos version | Lena | **done, published v4** (2026-10-16) |
| O7 | Low-cook week, budget week and ready-to-eat picks (`docs/MEALPREP.md`) | One-tap plans and picks per slot in Prep | Yusuf (data), Lena (UI) | **done, published v4** (2026-10-16) |
| O8 | Halal shopping guide for Barcelona (manteca, gelatina, E-471/472, "¿lleva manteca de cerdo?", butchers) | A section on the About page | Ayesha (text), Priya (UI) | **done in code** (About card + Check button, Priya; not yet published) |
| O9 | Recipe references, 2–5 links per prep | Listed in the prep's Source panel | Yusuf (data), Lena (UI) | **done, published v4** (2026-10-16) |
| O10 | Saved-meal row shows no kcal or protein (Bilal, Nasreen) | Show kcal · protein on the row | Priya | **done in code** (Priya, 2026-10-16; published in v4) |
| O11 | Nasreen's wording carry-overs; kam-tel "half the oil" line | Copy fixes | Priya with Ayesha | **done in code** (Priya, 2026-10-16; published in v4) |
| O12 | Ramadan: full day-by-day table, ±30 min time edit (`RULES.ramadan`) | Part of the Ramadan UI | Lena | **done in code** (2026-10-16; not yet published) |
| O13 | Urdu serving labels (`labelUr`, 454 foods) | Shown when "Pakistani meal names" is chosen | Lena | **done in code** (2026-10-16; not yet published) |
| O14 | E2E tests for Sprint 3 features (weight, spare box, meal names, cuisine chips, tips, Ramadan, methods) | E2E suite | Kenji | **done** (2026-10-16: 524 e2e incl. all Sprint 3 features) |
| O15 | Two possible bugs from Mariam (Fill Mon–Thu after Monday; "30 g – 30 g" on picos) | Verify, then fix | Kenji, Lena | queued |
| O16 | Accessibility and speed pass (Meeting 005) | As planned | Priya | **done in code** (2026-10-16: lazy-load, a11y re-check; not yet published) |

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
