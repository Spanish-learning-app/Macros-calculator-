# Mistakes and lessons

Every team member and every new Claude Code session reads this file **before starting work**
(PLAYBOOK §4 step 1, `team/briefs/_common.md`). It exists because the Boss asked for it on
2026-10-16 after finding that the recipe methods were written but never reached the app.

**How to add an entry:** whoever makes or finds a mistake adds it here the same day: newest first,
one block each. Say it plainly, with no excuses. The **Rule** line is what everyone must do from now on.
The Manager (Omar) checks this file at every review meeting and before every report to the Boss.

## Standing rules (short list, from the entries below)

1. **Done means the Boss can see it in the app.** Research, sheets and docs are inputs. A task that
   produces something for the user is not done until it is in `app/data` or the UI, or a written
   decision says it stays out. (M-01)
2. **Every brief names the app field or screen the output lands in.** If the contract has no field
   for it, add one or decide in writing to leave it out. (M-01)
3. **Before each report to the Boss, run the orphan check:** compare what the Lab wrote with what
   the app shows (see `team/STATUS.md` → "Not in the app yet"). (M-01)
4. **Restart people with fresh agents. Never replay transcripts.** At most 3 at once. (M-02)
5. **Timestamps come from `date -u`.** Never guess the time. (M-03)
6. **A count is a number you checked.** Pack sizes, egg weights and portion grams are worked from a
   cited unit weight, and a test checks them. (M-04, M-08)
7. **Tests must not depend on machine load or the clock's time zone.** (M-06, M-12)
8. **Never `git stash`, reset or checkout while others are working.** The working tree is shared. (M-07)
9. **Match a recipe ingredient to the record for the same cut and fat level**, and sanity-check
   the per-box numbers against the source. (M-09)
10. **Check what the Boss eats, not what is easy for us to make.** Variety rules are in
    `team/briefs/s3-variety.md`. (M-11)
11. **Answer a Boss message first, before restarting the team.** (M-13)
12. **Never claim a feature in a report before tapping it in the running app.** (M-14)

## Log

### M-14 · 2026-10-15 (found 2026-10-16 by the orphan audit) · Omar · Report #2 claimed a feature the app doesn't have
- **What happened:**
  - Report #2 told the Boss "the feta salad box has a one-tap halal swap (Burgos 0%)".
  - In fact the Burgos version is a separate prep you have to find yourself, and there is no swap button.
- **Root cause:** I wrote the report from Yusuf's data report ("a real alternative record") and never tapped through it in the app.
- **Fix:** I told the Boss. A real swap button is now planned (STATUS O6).
- **Rule:** every feature claimed in a report to the Boss is checked in the running app first: open it and tap it.

### M-13 · 2026-10-15 · Omar · A Boss message waited behind a usage pause
- **What happened:** a Boss message arrived just before a session limit. The reply came hours later, after the restart work.
- **Root cause:** the resume protocol starts agents before it reads the conversation.
- **Fix:** Boss messages and the dashboard inbox now come first.
- **Rule:** answer the Boss first, then restart the team.

### M-12 · 2026-10-15 · Hamza (test), Omar · Flaky search speed test
- **What happened:** the "search < 16 ms" test failed when other sessions loaded the machine. It looked like a regression but was not.
- **Root cause:** the test measured wall-clock time.
- **Fix:** it now measures process CPU time, takes the median of 7 trials, and has 3 warm-ups.
- **Rule:** speed tests measure CPU time and use medians.

### M-11 · 2026-10-15 · Yusuf, Omar · Meal prep was mostly desi and thin
- **What happened:** of 40 preps, dinners were 7/10 curries with roti, and lunches had near-repeats (lentil or chickpea with tuna). There were no sandwiches, pastas, wraps or bowls. The Boss had to point it out.
- **Root cause:** we built from the team's own cooking, and nobody checked the spread per slot against how the Boss eats.
- **Fix:** brief s3-variety: at least 4 styles per slot, at most about 1 in 4 desi lunches, never roti with salan at lunch. Yusuf is adding 20–25 international, easy preps.
- **Rule:** count variety per slot before calling a library done.

### M-10 · 2026-10-15 · Lena, Javier · Shopping list in grams, not packs
- **What happened:** the first shopping list said "1,350 g chickpeas" where a shopper needs "3 × 400 g jars". Mariam found it in Review 2.
- **Root cause:** the list was built from the data model, not from a trip to Mercadona.
- **Fix:** `pack` sizes on records, and the list shows packs, then counts, then grams.
- **Rule:** design outputs for the moment the user uses them (in the shop, at the stove).

### M-09 · 2026-10-14 · Yusuf (found by Ayesha's review) · Beef mince linked to the wrong record
- **What happened:** the keema preps were costed and counted on a generic beef-mince record, not the lean mince the recipe uses, so fat per box was too high.
- **Root cause:** we matched the record by name, not by cut and fat level.
- **Fix:** relinked to `intl-beef-mince-lean-raw` and rebuilt, with Ayesha's other remaps.
- **Rule:** match on cut and fat level, and compare per-box macros with the source.

### M-08 · 2026-10-15 · Javier · Quinoa pouch undercounted
- **What happened:** one quinoa record mixed home-boiled values (120 kcal/100 g) with a pouch serving. Pouch eaters were logged 36 % under (150 kcal against a real 234).
- **Root cause:** two different foods shared one record.
- **Fix:** split into home-boiled quinoa and `intl-quinoa-pouch` from the label.
- **Rule:** one record per real product, and the source note states the label basis.

### M-07 · 2026-10-14 · Lena · `git stash` during parallel work
- **What happened:** a `git stash` / `stash pop` in the shared working tree hid Ayesha's unsaved files for about 10 seconds. It popped cleanly, but it could have lost her work.
- **Root cause:** git was used like a solo repo.
- **Fix:** none needed this time. The rule is now in the briefs.
- **Rule:** no stash, reset or checkout. Only the Manager commits.

### M-06 · 2026-10-14 · Kenji · Test expected values worked out wrongly
- **What happened:** QA tests failed against correct app code twice because the hand-worked value was wrong (`lbFromKg(82)`, and an Arabic-letter fold).
- **Root cause:** the expected value was not re-derived from the rule text.
- **Fix:** the test was corrected.
- **Rule:** when a test fails, check the test's arithmetic before filing a bug.

### M-05 · 2026-10-15 · Hamza (code), Kenji (found) · "rotis" did not find roti
- **What happened:** `singularWord` kept every word ending in "-is", so "2 rotis" found only preps (BUG-S1).
- **Root cause:** the guard was meant for "-ss/-us/-is" Latin words and did not think of desi "-i" foods.
- **Fix:** the guard is now only `-ss/-us`.
- **Rule:** test search with how the Boss types: plurals, Urdu and Spanish names.

### M-04 · 2026-10-15 · Javier · 12 eggs = 720 g
- **What happened:** the egg pack was 720 g for 12 eggs, but a large egg is about 50 g edible, so 600 g. The list came up two eggs short (BUG-SH1).
- **Root cause:** we used the shell weight, not the edible weight.
- **Fix:** `pack.grams` 600, and a test sweeps every pack that has a count.
- **Rule:** see standing rule 6.

### M-03 · 2026-10-14/15 · Omar · Future-dated dashboard timestamps
- **What happened:** feed entries on the dashboard showed times hours ahead.
- **Root cause:** I wrote times from memory instead of the clock.
- **Fix:** I corrected them, and run `date -u` before every write.
- **Rule:** see standing rule 5.

### M-02 · 2026-10-14 · Omar · Usage window burned in ten minutes
- **What happened:** six agents were resumed by replaying their long transcripts, and a whole usage window was gone in about 10 minutes.
- **Root cause:** a resume replays the full context.
- **Fix:** fresh agents restart from their journals, at most 3 at once (PLAYBOOK §4.7).
- **Rule:** see standing rule 4.

### M-01 · 2026-10-14 → found 2026-10-15 by the Boss · Omar (owner), Lena, Yusuf · Recipe methods never reached the app
- **What happened:**
  - Yusuf wrote a `## Method` plus reheating, shopping, cost-per-box and references sections for all 40 preps in `research/yusuf/recipes/*.md`.
  - The app showed ingredients, amounts and the shopping list, but no way to cook them.
  - The Boss found it.
- **Root cause:** it was a mistake, not a plan to do it later.
  - Lena's recipe contract (ARCHITECTURE §13.1) had no `method` field.
  - Yusuf's `build.mjs` copied only the numeric fields into `app/data`.
  - Omar's checks (tests, data gates, tester scores) proved the numbers were right. Nothing checked that what the Lab wrote for the user reached the user.
  - The testers also did not ask how to cook, because they tested logging, not cooking.
  - Three people each assumed another stage covered it.
- **Fix:**
  - Brief s3-method: a beginner `method` on every library recipe, generated from the sheets by `build.mjs`.
  - A "How to make it" section and a step mode in the app.
  - A full orphan audit (`team/STATUS.md`).
- **Rule:** standing rules 1–3. Briefs say where each output lands in the app. Done = visible in the app. There is an orphan check before every report.
