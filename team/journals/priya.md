# Journal — priya

## Sprint 1 (brief: team/briefs/priya-sprint1.md)

Timestamps are UTC.

- 2026-10-13 23:15 Started Sprint 1. Journal was empty: fresh start. Read the brief (incl. Meeting
  002 additions), _common, priya.md, PLAYBOOK §3, DECISIONS.md, meeting 002, ARCHITECTURE (§2, §4,
  §7, §8), CUSTOMER.md v2 (§2, A1–A20, D0–D5), NUTRITION.md §2.1a (skip = reference targets),
  §2.3–2.5, §4.4–4.6, §5, §7.4 (About text, "show as written"), the Customer Panel "before"
  interviews (Nasreen, Mariam), index.html, main.js, router.js, starter CSS, fixtures, rules.js.
- State of others: Hamza's `core/units.js` is DONE (round, formatQty usable). Other core modules
  are still stubs. Lena's `ui/store.js` is in progress (untracked); it adds selectors beyond §7.3:
  `settings()`, `slots()`, `targetKind()`, `targetInfo()`, `loggedDates()`, `portionFor(id)`,
  `previewImport(text)`, `dismissUndo()`, `needsOnboarding()`, `onboardingState()`. My fake store
  mirrors that surface so the views switch over without edits.
- Plan: tokens/base CSS + dom.js → fake store + harness (`app/ui/dev/`) → Day view → add sheet →
  portion picker + details → welcome → week/month → profile → data/about → banner → screenshots.

### Selector contract for Kenji (stable; roles and names first, `data-testid` second)

| What | Selector |
|---|---|
| Totals bar | `data-testid="totals"` (sticky, `aria-live="polite"`) |
| kcal left / over | `data-testid="kcal-left"`, plain digits (no thousands separator), text "1234 kcal left" or "120 kcal over"; `data-value` = signed remaining (target − eaten, unrounded→rounded) |
| protein left / over | `data-testid="protein-left"`, "86 g protein left" / "12 g protein over"; `data-value` likewise |
| Planned figure | `data-testid="planned-total"` ("Planned: 450 kcal · 30 g protein") |
| Target kind chip | `data-testid="target-kind"` ("Estimate" or "Reference") |
| Slot section | `data-testid="slot-<id>"` (`slot-breakfast` … `slot-snacks`), heading = `store.slotLabel(id)` |
| Slot add button | button "Add to <slot label>" |
| Slot tick all | button "Mark all <slot label> eaten" (only when the slot has planned entries) |
| Slot menu | button "More for <slot label>" → "Copy from yesterday", "Copy from another day…" |
| Entry row | `data-testid="entry"`, `data-entry-id`, `data-status="planned|eaten"`, `data-food-id` |
| Entry status toggle | button "Mark <name> as eaten" / "Mark <name> as planned" (`aria-pressed`) |
| Entry edit | the row's main button (name + portion line) opens the portion picker in edit mode |
| Entry menu | button "More for <name>" → "Move to yesterday (…)", "Move to tomorrow (…)", "Move to another day…", "Delete" |
| Undo toast | `data-testid="undo"`, button "Undo"; stays 8 s (pauses on hover/focus) |
| Day navigation | buttons "Previous day", "Next day", "Today"; `data-testid="day-title"` holds the date heading (`data-date`) |
| Day copy | `data-testid="copy-yesterday"` (button "Copy yesterday"), `data-testid="copy-day"` (button "Copy another day…") |
| Add food (no slot) | `data-testid="add-food"` (button "Add food", uses `store.defaultSlot()`) |
| Add sheet | `data-testid="add-sheet"` (role dialog, name "Add to <slot label>"); search input = searchbox "Search foods" |
| Add sheet slot | select "Meal" inside the sheet |
| Halal only toggle | checkbox (role switch) "Halal only" |
| Recents / results | `data-testid="recents"`, `data-testid="results"`; rows `data-testid="food-row"` with `data-food-id` |
| One-tap add | button "Add <food name>" ("+") on every recents and result row |
| Hidden by filter | `data-testid="hidden-note"` (names the food + reason), button "Show hidden" |
| Halal chip | `data-testid="halal-chip"` (button, `aria-expanded`), reason `data-testid="halal-reason"` |
| Estimate badge | `data-testid="estimate-badge"` |
| Quick add | button "Quick add" → form `data-testid="quick-add"` (Name, kcal, optional macros) |
| Portion picker | `data-testid="portion-picker"` (dialog); serving chips = radio group "Portion"; qty chips ½ 1 1½ 2; input "Quantity" (`data-testid="qty-input"`); buttons "Less", "More" (step 0.5); error `data-testid="qty-error"`; preview `data-testid="portion-preview"`; button "Add to <slot>" / "Save" |
| Variant switch | `data-testid="variant-switch"` (radio group "Style": Home-made / Restaurant / Dhaba …) |
| Food details | button "Source and details"; dialog `data-testid="food-details"`; button "Close" |
| Storage banner | `data-testid="storage-banner"` (role status) |
| Week rows | `data-testid="week-row"` (`data-date`), average `data-testid="week-average"`; buttons "Previous week", "Next week" |
| Month grid | `data-testid="month-grid"`; logged days carry `data-logged="true"`; each day is a link to `#/day/<date>` |
| Onboarding | `data-testid="welcome"`; buttons "Start", "Skip for now"; results `data-testid="targets-result"`; button "Start logging" |
| Data view | `data-testid="export-text"`, button "Copy"; `data-testid="import-text"`, file input "Choose a backup file", button "Check backup"; dialog buttons "Replace", "Merge" |

### Progress

- 2026-10-13 23:35 Task 1 done: `styles/tokens.css` (warm cream/clay/ink palette, type scale,
  spacing, nutrient colours, halal chip colours, both themes, no red, no green "approved" tick),
  `styles/base.css` (shell, buttons, chips, forms, switch, dialogs, toast, storage banner styled
  for main.js's `.storage-banner`), `styles/views.css` (imported by base.css). `ui/dom.js`:
  `h`, `svg`, `append`, `mountChildren`, `setText`, `srOnly`, `uid`.
- 2026-10-13 23:35 `components/format.js`: the one display helper (kcal whole, grams per §7.5,
  `formatQty` from Hamza's units.js, portion text "1½ katori", typed qty parser that accepts
  "1,5", "½", "1/3"; date labels). Uses core dates/foods/days when implemented, a local fallback
  while they are stubs (probed once at load), so no edit is needed when Hamza lands them.
- 2026-10-13 23:40 Harness: `app/ui/dev/index.html` + `harness.js` (same shell and view host as
  main.js), `fake-store.js` (final §7.3 API incl. targetInfo/portionFor/previewImport/loggedDates),
  `fixture-foods.js` (copy of the 16 fixtures). URL: `/ui/dev/index.html?state=day&time=…#/day`
  (`state=fresh|skip|setup|warm|day|week`, `store=real` once the core lands, `data=real`).
- 2026-10-13 23:50 Day view done (`views/day.js`): totals bar (`components/totals-bar.js`), slot
  sections, entry rows, day nav, copy yesterday / a day, slot menu (copy slot), entry menu (move
  to day before / next day / another day, change portion, delete), Undo toast
  (`components/toast.js`, 8 s). Add sheet (`components/add-sheet.js`), portion picker
  (`components/portion-picker.js`), food details (`components/food-details.js`), halal chip and
  badges (`components/food-bits.js`), dialogs/action sheets (`components/dialog.js`), icons and
  katori/plate/cup/glass/spoon/box/roti drawings (`components/icons.js`).
  Label changes vs the table above: copy button reads "Copy a day…" (testid `copy-day`); tick-all
  reads "Tick all N as eaten" (name stays "Mark all <slot> eaten"); variant legend "Where it was
  made". Entry menu items have testids `move-prev`, `move-next`, `move-other`, `delete-entry`;
  slot menu `copy-slot-yesterday`, `copy-slot-other`.

## Design study (Boss's suggestion, brief `team/briefs/priya-design-study.md`)

- 2026-10-14 Read _common, priya, priya-design-study briefs, BRIEF.md, MEALPREP.md, Bilal review 1.
  Plan: (1) screenshot Katori at 400 px light/dark, Madrid time, into team/feedback/design-study/;
  (2) web research on the 7 apps + HIG/M3 (~20 sources); (3) write docs/DESIGN-STUDY.md.
- 2026-10-14 Screens taken (24 PNGs, light/dark, 400x860, 13:10 Madrid) with team/feedback/design-study/shoot.mjs. Seen: Day/Add/Picker/Week/Welcome/Targets polished; Prep library unstyled mid-change (bullets, grey default buttons, missing spaces 'walnuts1 jar', 'My chaiSet'). Day shows only kcal+protein. Web reachable (WebSearch/WebFetch work).
- 2026-10-14 Research done, ~20 sources: MacroFactor FLSI 2025 + App Store + help (recipes/servings),
  MFP Today-tab backlash (unstar.app analysis, MFP team post via Reddit mirror), Cronometer App Store
  + reviews, Lose It reviews, Lifesum (Pratt IxD critique, rating explainer, calorie-trackers review),
  Yazio (App Store/Trustpilot/feature board/giga.de), HealthifyMe (YourStory 2012/2015, TechCrunch
  Snap 2023), Apple HIG tab bars + dark mode (JSON endpoint; HTML is JS-only), M3 nav bar (MDC docs).
  WebFetch of m3.material.io and HIG HTML returned only titles; worked around via raw sources.
- 2026-10-14 Extra screens via shoot-prep.mjs (cook dialog, batch card, Fill Mon–Thu, Day with box).
  Prep batch card mid-change: native grey buttons for Fridge/Freezer, bullets, joined strings
  ("Halal1 box", "Box 1Not placed yet", "Today18"). Tab bar is text only (main.js, Lena's).
  Contrast check: all text tokens ≥ 4.7:1; HIG asks 7:1 for small custom text: faint text is 5.2 (L) / 6.4 (D).
- 2026-10-14 Writing docs/DESIGN-STUDY.md. Pick: Option 2 (refine), ~3–4 days for me + prep finish for Lena.
- 2026-10-14 docs/DESIGN-STUDY.md written (25 sources, 9 ranked refinements, 8 prep fixes for Lena). Pick: Option B refine; ~3–4 days for me, prep markup/CSS for Lena. Not committed (Omar commits). Server on :8790 used for shots.
- 2026-10-14 Lena's prep.css landed mid-study; re-shot Prep (09, 11–14) and rewrote DESIGN-STUDY §5 to list only what is still open (halal chip, box rows, date words, Fill wrap, Cooked-on field, meal select).

## Design refinements B (Meeting 004, decision B), night of 2026-10-15

- 00:40 UTC Read journal tail, meeting 004 (B: items 2, 3, 6, 7, 8, 9 + scroll-to-meal + "Added";
  panel: keep the floating Add food, keep the cook-date buttons, strip shows "g left"), DESIGN-STUDY §4.
  Baseline: `npm run check` green; e2e 164 pass / 8 skipped. No day.spec.js exists, so I run the full e2e.
- 00:55 Before shots (400×860, light/dark, Madrid): `team/feedback/design-study/after/shoot-b.mjs before`
  (welcome; Mon 2 Nov 13:30 prep day with tikka boxes Mon–Thu and breakfast logged; add sheet after
  "+"; empty day; week). At 13:30 Lunch is fully under the fold: the macro panel (~230 px) and the
  3-line Tonight card push Breakfast to y≈640. Plan: strip in sticky bar, panel collapsed behind it,
  Tonight in one line, empty card, tab icons, tick/"Added" via CSS + day.js (no add-sheet.js edit).
- 2026-10-15 (resume after the usage limit) Code on disk already had items 1–7: strip + folded panel
  (`totals-bar.js`), one-line Tonight, tab icons with filled pill (`renderShell`), "Added" tick on the
  sheet row + status line (CSS + `day.js` `markAdded`, reduced-motion = no animation), tabular nums,
  `--text-faint` #5e5246 (7.0:1) / #b3a796 (7.9:1), empty-day card (`empty-day`, `empty-search`),
  katori mark in header/welcome/empty card, open at the current meal. Shots had failed: the Tonight
  row widened the page (grid track + its sr-only sentence) so the FAB sat off screen.
- Fixes: `.day-prep .prep-tonight` gets `minmax(0,1fr)` and `.tonight-text` `position: relative`
  (page is 360 wide at 360 again); copy buttons keep one-line labels (`nowrap`, stack when cramped);
  `main.js` view host scrolls to top when the tab changes (Day scrolls itself to the meal, and that
  leaked into Week). Shot script reloads before the empty-day shot.
- After-shots re-taken (400×860, light/dark) next to the befores; 360×740 probe: no overflow,
  no target under 44 px, Lunch at y=161 after the open-at-meal scroll. `npm run check` green.
- e2e: 28 fails, all `meal-prep.spec.js` "N of 4 left" vs Lena's new "4 to eat · 1 eaten" wording
  (fix-wave item 3, not mine). With those strings swapped in a temp copy the spec passes (22/22
  phone+small), so my Tonight/Day changes hold. Spec update left for Lena/Kenji.

## Sprint 3 orphan items O3, O10, O11 and the O16 a11y/speed pass, night of 2026-10-16

- 02:05 UTC Read _common, MISTAKES (all), my briefs, STATUS (O3/O10/O11/O16), meeting 004 B/D and 005
  wave 2, Nasreen/Mariam/Bilal Review 2. Plan: (1) serve chips, (2) saved-meal kcal/protein line,
  (3) Nasreen wording (UI strings only; rules.js wording proposed to Ayesha), kam-tel line,
  (4) a11y + speed pass incl. recipe-method sheet and step mode. Yusuf/Kenji work in parallel.
- 07:00 UTC (resume) Found O3 serve chips, O10 saved-meal totals, edible-part labels and the kam-tel helper already on disk.
  Added: kam-tel line in the portion picker subtitle and in food details (it takes the place of "Style: Kam tel");
  food-details Source panel in plain words ("Where these numbers come from" / Source / Worked out by / How sure, no "(C)" and no
  duplicate estimate badge); chai card "One cup: … It comes first when you search “chai”."; batch empty note explains a batch;
  `savedMealLine(meal, store)` exported from add-sheet.js and used in the Day slot menu hint and the Prep saved-meals list.
  Verified at 400×860 light/dark with real data (scratchpad orph.mjs): 21 serve chips in the library, chips on ready rows and
  search rows, "2 foods · 439 kcal · 19 g protein", kam-tel line; no overflow, no console errors.
- 07:12 UTC Food details: kam-tel citations read "The Moong daal (home-made) recipe with less oil: 22.5 g in the whole pot
  instead of 45 g" (all 17 kam-tel records clean, no "→", "home sheet" or "§" left); Portions list drops "edible part" and says
  once "Weights are the part you eat: no bones, peel or stones." (`edible-note`). review1 unit tests pass.
- 07:16 UTC Checks: eslint app/ clean, prettier app/ clean, `npm test` 725/724/724 pass (the lint error in sprint3.spec.js:592
  and prettier warnings in prep-plans.js/store.js/two unit tests are not mine). e2e phone 90 (a first run had 22 fails while the
  shared :4173 server went away; the three specs re-ran 59/59 green), phone-dark + small 174 pass, 4 fail: the shopping-list
  copy test (review2 A4, meal-prep A18 (7)) expects the new "where to buy" line in the copied text (O5, Lena), not mine.
  O16 quick audit (Day/Week/Prep/Profile/Data/add sheet, 400 px): no unnamed controls, no targets under 44 px, no duplicate ids;
  first load ~1.4 s locally, 62 files, ~1.5 MB (recipes-mealprep.js 328 KB is the biggest).
  Left for O16: lazy-load recipes-mealprep.js (methods) until Prep opens; step mode announces only "Step x of n", not the step
  text (Lena's recipe-method.js: aria-live on the body); "2 biscuit" plural in portionText (needs a plural map, touches many e2e
  strings); Source panel grade descriptions are internal (rules.js, proposed to Ayesha). Stopping here, clean.

## O8 halal guide UI, O16 speed (lazy Lab data), plural fix, 2026-10-16 evening

- 16:27 UTC Read _common, MISTAKES, STATUS (O8, O16), my journal tail, Ayesha's 16:16 spec. Plan: (1) halal guide card
  on About (closed details per section, lang="es" on Spanish), maybe a "What does Check mean?" link from food details;
  (2) lazy-load recipes-mealprep.js / plans-mealprep.js (note: Day use-by and add-sheet box rows read the library recipe
  when batches exist, so load when batches exist or Prep opens); (3) "2 biscuit" plural only if contained.
- 16:31 UTC O8 DONE. New `app/ui/components/halal-guide.js` renders RULES.halalGuide: intro, one closed `details.guide-section`
  per section (id `halal-<section id>`, testid `halal-guide-section`, `data-section`), items as a list, note as field-help.
  About: `section.card.halal-guide` (testid `halal-guide`, aria-labelledby `halal-guide-h`) after the first card, before
  the grades card. Spanish: quoted phrases get `lang="es"`; 44 label words get `<i lang="es">` (llard, saïm, Ciutat Vella
  `lang="ca"`), so they stand out and a screen reader says them in Spanish. "How to ask" items show the phrase large on one
  line, the English small under it. CSS in views.css ("Halal shopping guide (O8)"): 44 px summaries, chevron, reduced motion.
  Decision on the Check link: a route link from food details would leave the portion picker and add sheet dialogs stacked
  over the About page (food details only opens from the picker), so instead a quiet button "What does Check mean?"
  (testid `check-guide`, only for status check) opens the same guide in a dialog (testid `halal-guide-dialog`) at the
  "What Check means" section; Escape returns to the food details. Small, local (food-details.js + the new file).
  Verified 400×860 light/dark, real data: 4 sections closed, order first card → guide → grades → reference values,
  57 lang-marked spans, no overflow, no console errors; soy sauce (check) → details → button → dialog opens katori-check.
- 18:56 UTC (resume after usage limit) halal guide card + check-guide button on disk and committed. Next: O16 lazy-load recipes/plans mealprep, plural fix if contained, a11y re-check of the guide dialog and Ramadan controls.
- 19:06 UTC O16: lazy Lab loader was already in main.js (committed in b3c92b2). Measured it: alone it was slower for batch users (Day waited for foods, then recipes, then day.js in series). Added: first view modules fetched in parallel with the food data; Lab modules warmed 1 s after the first screen at idle (no setLabData, so no re-render); 'Loading recipes…' line (testid lab-loading, role=status) after 200 ms when Prep waits. CPU x4, 15 runs each, busy box (load 7-9): Day ready median no-batch 1116 -> 1010 ms, with batch 1199 -> 1001 ms; bytes before first screen 1429 -> 1092 KB (50 -> 48 files) without batches; Prep open ~400 ms both.
