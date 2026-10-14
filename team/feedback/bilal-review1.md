# Bilal: Review 1 (hands-on, Sprint 1 build)

*2026-10-14 · Chromium, Europe/Madrid, 400×860 plus a 1280 desktop pass. Seconds come from my script with a thumb-speed pause per tap, so a real person is about 2× slower. Screenshots and `t_*.mjs` scripts are in `team/feedback/screens/bilal/`.*

Short version: the first desi-aware tracker that doesn't make me fight it. Logging is fast and the halal flow is smart. It still has a visible bug on every search, a wrong chai default, and missing foods.

## Pass / fail

| Test | Result | Evidence |
|---|---|---|
| A1 onboarding | PASS | 10 actions, 5 s. Targets 2210 kcal, 161 g protein (matches the kickoff figures), labelled Estimate. Skip = 1 action and shows "Reference" 2000 kcal / 50 g. No foreign requests. `a1-targets`, `a1-skip-day` |
| A2 roti search | PASS | All 7 queries correct, results in under 20 ms, no search button. `a2-roti-results` |
| A3 spellings | PASS | dal/daal/dhal/دال, chaye, karhai, croissant, pa amb tomàquet all land. Junk lower down (fix 7). `a3-kela` |
| A4 / D0 | PASS | 23 actions, 13.7 s. 7 entries, 1723 kcal (sum 1724, rounding). Desktop is the same. `d0-04-day-final` |
| A5a / D1 | PASS | 57 actions, 35 s (I'd say about 100 s in real life). 17 entries in the right slots. `d1-02-final-top` |
| A5b copy | PASS | 2 actions, 1.4 s. One Undo removes all 17. `a5b-02-after-copy` |
| A6 chai | PASS | 2 actions. Four taps give 520 kcal (4×130). `a6-01-recents` |
| A7 left at 18:00 | PASS | 483 kcal and 97 g left, visible with no scroll and still pinned at Dinner. `a7-01`, `a7-02` |
| A8 fractions | **FAIL** | Daal mash 1.5 katori = 300 g / 504 kcal and 0.33 works. Errors for 0, empty and -1 are inline. But plain rice has **no plate serving**, so "plate × 0.5" is impossible. `a8-02-rice-picker` |
| A9 home/restaurant | PASS | Switch = 1 action, 317 → 425 kcal, source = 1 action. `a9-02`, `a9-03` |
| A12 plan and tick | PASS | Copy slot = 2 actions. Planned items are dashed, tagged "Planned", and counted separately. `a12-04-after-ticks` |
| A13 mistakes | PASS | Delete = 2 actions, no pop-up. Undo stays about 8 s. Edit 2→3→2 = 3 actions. Reload, import-Replace and the no-storage banner all work. `a13-04`, `a13-10` |
| A14 trust | **FAIL** | Atwater check 180/180 OK. A/B/C and a citation on all 12 sources I opened. But #48 skyr is not in the library, and from a search row the source is 2 actions. |
| A15 phone/dark | PASS, one nit | No horizontal scroll at 360, 400 or 1280. No dark flash. At 360 the month cells are 43×44 px (1 px short). `a15-s-360-week` |
| A19 café | **FAIL** | Search is excellent. All four entries land in Nashta, 12 actions, and the croissant's Check reason opens in 1 tap. ensaïmada is hidden with its reason. But the slot labels are Nashta/Lunch/Shaam ki chai, not the spec's Breakfast / café, Lunch box, Merienda. `a19-03`, `a19-05` |

**12 pass, 3 fail** (A8, A14, A19). Also checked: karahi switch, 1 box of chicken tikka rice (650 kcal, 50 g protein, 1 tap), halal chips on ensaïmada and napolitana.

## After vs the apps I use

- **MyFitnessPal.** Better: desi names, no account or ads, protein left always on screen, quicker repeats. Worse: database size (180 foods). Missing: barcode, CSV export.
- **Cronometer.** Better: source and confidence panel, halal flag. Worse: no recipe builder yet. Missing: micronutrient and sodium totals.
- **MacroFactor.** Better: planned versus eaten, copy-day with Undo. Worse: no device sync. Missing: weight log, adaptive targets.

## Top 10 fixes, ranked

1. **Chai search, Lunch and Shaam ki chai slots.** With no history, "chai" ranks Dhaba karak chai (239 kcal) above home doodh patti (111). One "+" tap logs double the calories. The slot-hint boost must never beat the home default. Check at 13:00 and 17:00.
2. **Literal "null" under every result list.** `add-sheet.js` ~line 322, `results.replaceChildren(list, hidden.length ? hiddenNote(hidden) : null)`, renders the text "null" (`a19-03`). Only append the note when it exists.
3. **Rice has no plate.** Add a plate serving (about 2 katori) to `pk-rice-plain`. A8 step 2 fails without it.
4. **Plain skyr (#48) is missing.** "skyr" only finds a tortilla lunch box. Add a halal skyr with a pot serving and the aliases skyr and yogur proteico. D5 can't be logged.
5. **Spanish-preset labels.** Rename them in `rules.js` `mealSlots.spain` to Breakfast / café, Lunch box and Merienda / chai.
6. **The "Add food" button covers things.** It sits over the slot Add buttons, the ⋯ menus and entry text (`a15-360-day-longnames`). Add bottom padding and shrink the button or hide it on scroll.
7. **Fuzzy junk.** "kela" returns shami kebab and corn flakes. "naan" #3 is Banana. "whey" #2 is Roti. "truita" #4 is mango juice. Raise the fuzzy threshold for short words.
8. **Source panel shows internals.** It says "research/zainab/recipes/pk-roti.md", "NUTRITION.md §4.4", reviewer first names, and "120 g, as notified". It also shows "CoFID +80%" with no explanation. Write plain-language citations.
9. **Wrong ranking and labels.** "salad" ranks Ensalada mixta with tuna above kachumber. "biscuit" ranks Gluco above Marie. The omelette chips are both named "omelette" (180 g / 270 g), so they should read "(2 eggs)" and "(3 eggs)".
10. **Polish.** The toast says "Copied 2026-10-14" and should say "Copied Wed 14 Oct". Plurals read "2 biscuit" and "3 egg". Month cells need 44 px at 360 wide.

## Numbers that look wrong

- **Roghni naan is 290 kcal, but plain naan is 349.** The roghni serving is 89 g against 120 g for naan. A buttery roghni can't be lighter.
- **Desi omelette is 146 kcal per egg**, against 106 for a fried egg. A 3-egg omelette is 440 kcal. Oil looks heavy.
- **Home daal is 252 to 338 kcal per katori** (mash 336, chana 338). That feels like restaurant daal, and masoor is 252.
- **My D1 weekday comes to 2567 kcal against 2210.** Four chais (520), the omelette and the daal drive it. Probably real, but it looks harsh.
- **Karahi's source note says "CoFID +80%".** Don't show a customer an unexplained 80% gap.

## Overall verdict: 7.5 / 10
