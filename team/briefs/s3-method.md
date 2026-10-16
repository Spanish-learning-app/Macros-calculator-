# Sprint 3 add-on: "How to make it" in every prep (Boss's note, 2026-10-15 night)

## What the Boss said

> "In the Prep options it shows the recipes, the amounts and the shopping list, but it does not tell
> how to prepare them. I'm not an expert cook… which pieces (cut, powder, liquid), how much, what to
> add first and later, how long to cook, whether to cook at all, which heat, oven or pan. Otherwise I
> have to look it up on the internet."

## What we found (Omar)

All 40 recipe sheets in `research/yusuf/recipes/*.md` already have a `## Method` and an
"Eating and reheating" section. But `app/data/recipes-mealprep.js` carries no method at all, so the
app cannot show one. The methods are also written for a cook, not a beginner. They are short and
assume knowledge ("soften the onion", no heat level, no cut size).

## The contract (Lena adds this to ARCHITECTURE §13.1; it is optional and additive)

```js
LibraryRecipe += {
  method?: {
    equipment: string[],            // "large frying pan with a lid", "oven tray", "pot for 2 l of water"
    prep: string[],                 // before you start: "Dice the onion small (1 cm)", "Cut the chicken into 3 cm cubes"
    steps: [{ text, heat?, minutes? }],
    //   heat: 'none' | 'low' | 'medium' | 'medium-high' | 'high' | 'oven-180' | 'oven-200' | 'oven-220' | 'microwave'
    doneWhen?: string,              // "chicken is white all through, no pink; juices run clear"
    boxUp: string,                  // how to cool and pack: fridge/freezer split, what goes in which compartment
    reheat: string,                 // "Microwave 2½–3 min, stir halfway, until piping hot" or "Eat cold"
    tips?: string[],                // optional: swaps, halal notes, what to do if…
  }
}
```

## Yusuf: write a method for every prep, for a beginner

- Write one for all 40 existing preps and every new variety prep.
- Write in plain language, numbered, one action per step. Give the **order** (what goes in first and
  what later), **amounts**, the **form** of each ingredient (diced 1 cm, grated, crushed, powder, liquid), the
  **heat** and the **time**, plus a **doneness cue** a beginner can see. For no-cook preps, say "no cooking"
  and give the assembly order (wet ingredients away from the bread, dressing apart, and so on).
- Food safety in plain words: when to cool, the fridge and freezer split (from storage), how to
  reheat until piping hot, and that rice must be cooled fast.
- Generate it from the recipe sheets through `build.mjs`, so the sheets and the app never drift apart. Update
  the sheets' `## Method` to the same beginner text.

## Lena: show it in the app (after Ramadan mode)

- Add a **"How to make it"** section on every library recipe card and in the Cook / Make dialog:
  equipment, "Before you start" (prep), numbered steps with a small heat and time chip each, "Done
  when", "Box it up" and "Reheat".
- Add a simple **step-by-step mode** (one step at a time, big text, Next/Back) for cooking with messy
  hands. It is optional if time is short, but the list itself is required.
- On the user's own recipes, add an optional free-text "My method" box.
- No schema bump: the method is library data, and "My method" is an optional recipe field.

## Kenji

Test the contract: every library recipe has a method with at least equipment, steps, boxUp and reheat,
and every heat value comes from the allowed list. Add an e2e test that opens one recipe and walks through
the steps.

## Addendum (Omar, 2026-10-16 03:50 Madrid): how the work is split, and the exact sheet format

The sheets are `research/yusuf/recipes/NN-*.mjs`. Today each has `method: [ 'string', … ]`, which
`build.mjs` reads but never writes to `app/data`. This was the bug (see `team/MISTAKES.md` M-01).
Replace the array with an object in exactly the contract shape:

```js
method: {
  equipment: ['Large frying pan (28 cm) with a lid', 'Pot for 2 l of water', '4 lunch boxes'],
  prep: ['Cut the chicken thighs into 4 cm pieces.', 'Peel 12 garlic cloves and slice them thin.'],
  steps: [
    { text: 'Put the pan on the hob. Add 2 tbsp (30 g) olive oil and let it heat for 1 minute.', heat: 'medium-high', minutes: 1 },
    { text: 'Add the chicken in one layer. Do not move it for 3 minutes, then turn the pieces.', heat: 'medium-high', minutes: 7 },
    // … one action per step; say what goes in FIRST and what goes in LATER, the form (diced 1 cm, powder, liquid), the amount
  ],
  doneWhen: 'Cut the biggest piece: white all through, no pink, juices clear (75 °C if you have a thermometer).',
  boxUp: 'Cool on the counter for 30–60 min, no longer. Boxes 1–2 to the fridge (eat by day 3), boxes 3–4 to the freezer.',
  reheat: 'From the fridge: microwave with the lid loose, 2½–3 min, stir halfway, until steaming hot all through. From the freezer: move to the fridge the night before.',
  tips: ['No guindilla? Use a pinch of chilli flakes or leave it out.'],
}
```

- `heat` is one of: none, low, medium, medium-high, high, oven-180, oven-200, oven-220, microwave. Give `minutes` whenever there is a time.
- No-cook preps: `steps` say "No cooking." in the first step (`heat: 'none'`) and give the assembly order (wet away from bread, dressing in a separate pot, and so on).
- Food safety in plain words: rice is cooled fast (spread it out, in the fridge within 1 h) and reheated once only until steaming; the fridge/freezer split must match the record's `storage`.
- Amounts must match the sheet's `lines` (grams plus household words: "2 tbsp (30 g)").
- **Yusuf owns `build.mjs`.** It copies `method` to the library recipe in `app/data/recipes-mealprep.js`, renders the `.md` sheet's `## Method` from the same object, and fails the build if a sheet has no method or an unknown heat value.
- **Split:** Zainab writes the desi sheets (01, 02, 03, 04, 08, 09, 14, 16–24, 28, 35, 39). Yusuf writes all the others. Each edits only the `method` key of their own sheets.
