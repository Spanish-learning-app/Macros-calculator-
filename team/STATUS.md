# Katori: project status

**Read this first.** It is the short, human version of `team/state.json`. It is kept current after
every event (an agent starts or finishes, a Boss message, a meeting, a report, a pause), so the Boss,
the team and any new Claude Code session can see what was done, what is next and how to pick up.
Mistakes and the rules they taught us are in `team/MISTAKES.md`.

_Last updated: 2026-10-16 01:58 UTC (03:58 Madrid) by Omar._

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
| Variety preps 41–64 (sandwiches, pastas, bowls, tray bakes, soups, breakfasts) | sheets written, build and checks in progress (Yusuf) |
| **"How to make it": beginner methods in the app** | in progress: data (Yusuf for the international sheets, Zainab for the desi ones), UI (Lena) |
| Protein tips and Ramadan mode | core done; the UI is after "How to make it" (Lena) |
| Sprint 3 wave 1 tests | partial; restarts after Yusuf lands (Kenji) |

## Working now

_Max 3 agents at once._

- **Yusuf:** finishing variety preps 41–64, the method pipeline in `build.mjs`, and beginner methods for the non-desi sheets.
- **Lena:** stabilising the protein-tip UI, then "How to make it" (recipe cards, Cook dialog, step-by-step mode, "My method").
- **Zainab:** next, when a desk frees: beginner methods for the 20 desi sheets.

## Next, in order

1. Kenji: tests for wave 1, the method contract, and an e2e step walkthrough.
2. Yusuf: weekly plans redo (low-cook and budget weeks) as one-tap plans in the app.
3. Lena: Ramadan-mode UI. Priya: accessibility and speed pass.
4. Ayesha: review backlog (129 records awaiting review), and the open bhindi fix.
5. Orphan items below: each one either goes into the app or gets a written decision.
6. Review 3 (customer panel, a full week, including cooking from the app), fix wave, final audit, **republish**, delivery report.

## Not in the app yet (orphan check, MISTAKES M-01)

Things the team wrote for the Boss that the app does not show yet. Each needs an owner and a plan.

| Item | Where it lives now | Plan |
|---|---|---|
| Cooking methods for every prep | `research/yusuf/recipes/*.mjs` `method` | in progress (s3-method) |
| _Full audit results are being added. See the next update._ | | |

## How to resume (for a new session or after a pause)

1. `git pull` the branch. Read this file, `team/MISTAKES.md`, `team/state.json` and the latest meeting in `team/meetings/`.
2. Read the dashboard inbox (`ArtifactData list`, collection `inbox`). The Boss comes first.
3. Restart each `state.json → inFlight` person with a **fresh** agent that reads their brief and journal (`team/journals/<id>.md`). Never replay a transcript. Max 3 at once.
4. The team works 18:00–10:00 Madrid. The hourly check-in routine fires at :09. At the 09:09 check-in, start no new agents: commit, push, and set the dashboard to off duty.
5. Commit and push after every task, and update this file at the same time.

## Publishing notes

- The page wrapper is `tools/artifact-page.html`. `npm run publish:files` prints the files map (keys relative to `app/`, use absolute source paths).
- If this session did not publish the last version, run `Artifact action:list scope:files` on the app URL before republishing.
