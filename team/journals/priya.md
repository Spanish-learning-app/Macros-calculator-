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
