# Sprint 1 assignment: Priya Raman, UI Engineer (mobile-first)

**From:** Lena (Lead Software Engineer) · **Date:** 2026-10-13 · **Starts:** now (Step 0 has landed)

## Read first

1. `team/briefs/_common.md`, `team/briefs/priya.md`, `team/PLAYBOOK.md` §3, and your journal
   `team/journals/priya.md`. If the journal has entries, continue from where it stops.
2. `docs/ARCHITECTURE.md`. §2 (Artifact constraints), §4 (data model), §7 (UI architecture: routes,
   store API, view contract, rendering rules, theming) and §8 (budgets) are binding.
3. `docs/CUSTOMER.md`:
   - §2 conventions: an action is a tap or a field; budgets count actions.
   - §4 acceptance tests: A1, A2, A4–A9 and A12–A15 are yours to make pass.
   - §5 test days: these are the flows Bilal will time.
4. `app/index.html`, `app/main.js`, `app/ui/router.js` (Lena's) and the starter
   `app/styles/tokens.css` and `base.css` (now yours).

## You own

`app/ui/views/**`, `app/ui/components/**`, `app/ui/dom.js`, `app/ui/dev/**` (your harness, never
published) and `app/styles/**`. Do not edit `app/main.js`, `app/ui/store.js`, `app/ui/router.js`,
`app/core/**`, `app/data/**` or `tests/**`; ask Lena.

## Rules

- **No dependencies, no build step.**
  - Use `ui/dom.js` (`h(tag, attrs, ...children)`) and plain DOM.
  - Never put data into `innerHTML`.
  - Never call `alert`, `confirm` or `prompt`; use `<dialog>` and toasts.
  - Never make a request to another origin.
- **Views follow §7.4:** `export function mount(container, ctx) → { update(route), unmount() }`, with
  `ctx = { store, router, rules }`. Read data only through the store API in §7.3.
- **Store not ready yet:** Lena delivers `ui/store.js` right after Step 0. Until then, build against
  `app/ui/dev/fake-store.js`, which you write, with the same API. Copy the data from
  `tests/fixtures/foods.js` into `app/ui/dev/`: `npm run serve` serves only `app/`, so the browser
  cannot reach `tests/`. Add a harness page `app/ui/dev/index.html` that mounts one view at a time.
  `app/ui/dev/` is never published.
- **Display maths:** use `core/units.js` (`round`, `formatQty`) from Hamza. He delivers it first.
  Until it lands, keep the display formatting in one helper inside your files so you can switch it
  in one place.
- **Phone first:**
  - Check 360 px, 412 px and 1280 px, in light and dark.
  - No horizontal scroll.
  - Targets of at least 44 × 44 px.
  - AA contrast, visible focus, `prefers-reduced-motion`.
  - Planned and eaten differ by text or icon, not by colour alone.
  - Keep the theming structure in `tokens.css` (§7.5).
- **Use stable selectors** so Kenji's tests are robust: real roles and names, plus `data-testid`
  for the totals ("kcal-left", "protein-left"), slot sections (`slot-<id>`), entry rows (`entry`),
  the add sheet (`add-sheet`), the portion picker (`portion-picker`) and the undo toast (`undo`).
  List them in your journal.
- **Gate:** `npm run check` must pass before each hand-off.
- **Journal** after each component or view.

## Tasks, in order

1. **Look and tokens.**
   - Refine `tokens.css` and `base.css`: a warm, calm palette, the type scale, spacing, and the
     nutrient colours (kcal, protein, carbs, fat, fibre) in both themes.
   - Write `ui/dom.js`.
   - Done when the shell looks right at 360, 412 and 1280 px in both themes, with no white flash
     in dark mode.
2. **Day view** (`views/day.js`), with its components.
   - **Totals bar:**
     - Sticky "kcal left" and "protein left". They count eaten food only and are visible without
       scrolling at 360 px (A7).
     - When over target they read "N over", in the same style.
     - Planned food appears as a separate figure (A12).
     - It also shows carbs, fat and fibre against targets, labelled as estimates.
   - **Five slot sections**, each with a subtotal and a "tick all" control (A12).
   - **Entry rows:** read like `1½ katori · 300 g · 480 kcal`. One tap toggles planned or eaten.
     Tapping the row edits it. Delete has an Undo toast that stays at least 5 s (A13).
   - **Day navigation:** previous and next day, and back to today.
   - **Copy:** "Copy yesterday" or copy another day (A5 b, ≤ 4 actions), and copy a slot.
3. **Add sheet** (route `add`, opened from a slot's "+").
   - The search box gets focus on open. Results update as you type, with no search button, and
     the input is never re-created while typing (A2).
   - With an empty query, it lists the slot's recents. Their "+" adds the last portion in one tap
     (A6: chai in ≤ 2 actions).
   - Each result shows its default portion and kcal, and an "estimate" badge for confidence C
     (A14).
   - The sheet stays open for the next food.
   - **Quick add:** name and kcal, with optional macros.
   - Android Back (`history.back`) closes it.
4. **Portion picker.**
   - Serving chips.
   - A quantity stepper in steps of 0.5 that also accepts typed decimals.
   - Live grams and kcal before adding.
   - Inline errors for 0, an empty box or a negative number, with no pop-up (A8).
   - The **variant switch** (home, restaurant, dhaba) when a food has a family. The kcal changes
     (A9).
   - **Food details:** the source in one tap: citation, method, confidence and state (A9, A14).
5. **Onboarding** (`views/welcome.js`).
   - P1 takes ≤ 15 actions and Skip takes ≤ 2 (A1).
   - Height in cm or ft/in; weight in kg.
   - Activity labels and descriptions, goals and rates, and health flags all come from `RULES`.
     Never hard-code nutrition text.
   - Targets are labelled as estimates.
   - It shows the text for each code in `RULES.warnings` and each active flag's `note`.
6. **Week and month** (`views/week.js`).
   - Seven rows, each with kcal and protein against target. Weekly averages.
   - Previous and next.
   - A month grid with a dot on logged days. One tap opens a day.
7. **Profile** (`views/profile.js`).
   - Edit the profile, and the protein g/kg and fat % preferences (ranges from RULES).
   - Manual target overrides.
   - Units, first day of the week, slot labels and theme (system, light or dark). The theme sets
     `data-theme` on `<html>`.
8. **Data** (`views/data.js`) and **About the data** (`views/about.js`).
   - Data:
     - Export: a read-only textarea and a Copy button.
     - Import: paste or file input, then a summary, then a Replace or Merge `<dialog>`.
     - Reset: with Undo.
     - Storage status: the banner text for `unavailable`, `corrupt` and `future`.
   - About: credits every source the Lab uses (kickoff decision 9). Ayesha supplies the text.
9. **Storage banner** component. It shows on every view when the storage status is not `ok` or
   `empty`.

## Done for the sprint

On the integrated build:

- Kenji's E2E for A1, A2, A4–A9 and A12–A15 pass on all four Playwright projects.
- Bilal logs D0 (the Boss's day) in ≤ 60 s at phone size.
- `npm run check` passes.

## Cross-testing

Kenji tests your views end to end. Hamza reviews them by hand at 360 px. You run Lena's
integrated flows (store and router) by hand and report problems to her. Bugs go to the owner;
do not fix other people's files.

## Final report (to Lena)

Report:

- which views and components are done
- screenshots at 360 px light and 1280 px dark
- the selector list
- what you need from Lena (store API gaps), Ayesha (texts) or Hamza
- risks

Do not commit.
