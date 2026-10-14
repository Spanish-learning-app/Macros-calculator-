# Sprint 2 add-on: less cooking, more market food (Boss's note, 2026-10-14 evening)

**Owners:** Yusuf Benali (leads: assemblies and the weekly plan) and Javier Morales (market and
ready-to-eat food records). Ayesha reviews. Lena adds a small UI hook (below).

## What the Boss asked

> "For the meal preps, do consider adding fruits and other market things which are healthy and can
> be bought from market. Just to reduce the cooking load. And also other things which can be bought
> from Mercadona etc. and cook or prepare at home like salads and other things as well. The things
> I say as an example, like salad, don't be limited to that."

The examples are only examples. The goal is a **PhD-week meal prep that needs much less cooking**,
using healthy, halal food you can buy in Barcelona (Mercadona first; also Lidl, Consum, Bonpreu,
Carrefour, the halal butcher, and fruit shops and markets such as La Boqueria or a local frutería).

## Three tiers in the library

| Tier | `effort` | What it means | Examples (not a limit) |
|---|---|---|---|
| Cook | `cook` | Batch-cooked: the 25 preps we have | Tikka rice box, keema, karahi |
| Assemble | `assemble` | 15 minutes or less, little or no cooking: open, chop, mix, pack | Salad boxes from bagged leaves + canned chickpeas or tuna + feta + olive oil; grain bowls with microwave rice cups or 5-minute couscous; wraps; skyr or yogurt parfait jars with fruit and oats; hummus + veg sticks + pitta snack box; quick pasta salad; cold chicken-salad sandwich |
| Ready | `ready` | Buy and eat, no prep | Fruit (banana, apple, mandarin, seasonal), cut-fruit cups, dates and nuts, skyr/yogurt pots, queso fresco batido, boiled-egg packs, canned tuna/salmon, gazpacho, hummus, guacamole, jarred cooked chickpeas/lentils, microwave rice cups, wholegrain bread or picos |

Every item gets an honest `halal` status:
- **`check`:** non-halal-certified chicken (for example supermarket `pollo asado`).
- **`not-halal`:** anything with pork, `cerdo`, `manteca`, `gelatina` of unstated origin, wine or `vino`. Jamón toppings on salmorejo or salads are excluded.

The halal-only filter stays on by default.

## Javier: market food records (first)

- Check what already exists before adding anything (fruit is partly done: banana, apple, orange).
  Search `app/data/` first. Reuse ids; never duplicate.
- Add about 25–40 records for healthy, halal ready-to-eat and quick-prep supermarket and market foods,
  using the Mercadona label (per 100 g) where possible, else USDA/BEDCA. Each record needs a citation,
  a confidence grade and a realistic serving (1 pot, 1 can drained, 1 piece, 1 handful).
- Also add the raw basics Yusuf's recipes list by name only, wherever they are market staples:
  - bagged spinach and leaves, peppers, courgette, frozen peas and green beans
  - jarred chickpeas, crushed tomato, pitta
  - couscous, bulgur, wholewheat pasta, dry basmati and brown rice, chia, liquid egg whites

  Ayesha owns the raw meats. Note which are left for her.
- Your files: `app/data/foods-es-med.js`, `app/data/foods-intl.js`, `app/data/foods-basics.js`
  (where the record fits), `research/javier/**`. Run `node research/check-foods.mjs`.

## Yusuf: assemblies, ready picks and a low-cook week (after or alongside Javier)

- **12–16 `assemble` preps** across breakfast, lunch, dinner and snacks, as records in
  `foods-mealprep.js` with a `recipes-mealprep.js` entry each (§13.1 shape plus `effort` and
  `minutes`). Use Javier's records as ingredient foodIds where they exist. Targets per slot are from
  `RULES` (`targetsBySlot`). Lunch assemblies must pass the lunch-box test: portable, fine cold or
  microwaved, not messy.
- Tag the existing 25 preps `effort: 'cook'` with honest `minutes` (hands-on time).
- **"Ready to eat" picks:** a short list in `docs/MEALPREP.md` of the best grab-and-go items by slot,
  for example a protein snack under 200 kcal or a fruit plus protein for merienda.
- **A low-cook week plan** in `docs/MEALPREP.md`: one 60–90-minute Sunday cook, plus assemblies, plus
  ready items, covering Monday to Friday breakfast, lunch and dinner. Include the Mercadona shopping
  list and the approximate cost with the date of the prices.
- Your files: as before (`foods-mealprep.js`, `recipes-mealprep.js`, `research/yusuf/**`,
  `docs/MEALPREP.md`). Rebuild through `build.mjs`.

## Lena: UI hook (small)

- `LibraryRecipe += { effort?: 'cook'|'assemble'|'ready', minutes?: number }` (optional; absent =
  `cook`). Add it to §13.1.
- In the Prep library, add a filter row "All · Cook · No-cook (≤15 min)", and show the time on each
  card ("10 min, no cooking").
- Ready items need no batch. They are normal foods, so the existing search and "+" cover them. If it
  is cheap, add a "Ready to eat" row of picks per slot from the Lab's list. If not, do it in Sprint 3.

## Done means

- Records pass check-foods; `npm run check` is green in Madrid and Karachi.
- A Day can be planned with at most one batch cook a week.
- Review 2's PhD-week test (Mariam) includes a low-cook week.
