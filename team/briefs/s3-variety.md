# Sprint 3 add-on: real variety in meal prep (Boss's note, 2026-10-15 evening)

**Owners:** Yusuf (preps and plans) and Javier (base foods). Ayesha reviews. Lena adds a small UI
hook.

## What the Boss said

> "Check if the meal preps are only around Pakistani dishes mainly? Don't limit there. I'm not
> going to bring any Pakistani food to lunch except the rice etc. For sure not roti salan. Do
> consider some easy cooking options like sandwiches or salads or pastas etc. Just don't be
> limited. There should be a variety."

## What the library looks like today (Omar's count, 40 preps)

| Slot | Total | Pakistani | Other |
|---|---|---|---|
| Lunch | 18 | 6 (tikka rice bowl, keema rice, pulao, shami pita, seekh + tabbouleh, chana chaat) | 12, but 5 of them are near-repeats of lentil or chickpea with tuna |
| Breakfast | 9 | 4 (2 parathas, a roti wrap, fruit chaat) | 5 |
| Dinner | 10 | 7 (curries with roti, chana masala) | 3 |
| Snacks | 3 | 1 | 2 |

There is no roti-with-salan lunch, but the variety is thin. There are **no sandwiches or bocadillos,
no hot pasta, no wraps at lunch, no noodles or stir-fry, no burrito bowls, no soups, and no simple
oven tray bakes.** Dinners are mostly curry and roti.

## Rules from now on

1. **Lunch:** desi food only when it is rice-based and portable (tikka rice bowl, pulao, keema with
   rice). Never roti with salan or curry. At most about 1 in 4 lunch options is desi.
2. **Variety is required in every slot:** breakfast, lunch, dinner and snacks each get options from
   at least four styles, for example Spanish/Catalan, Mediterranean, Mexican-style,
   Asian-style, Italian, desi and Middle Eastern.
3. **Easy cooking first:** most new preps are 30 minutes or less of hands-on time, or no-cook.
4. **Halal honesty stays:** soy sauce (it can contain alcohol from fermentation), mirin, wine in
   sauces, rennet in cheese (mozzarella, parmesan) and E-471 in breads or wraps all need a `check`
   with the reason, or a halal swap in the recipe (for example a halal-certified soy sauce or
   tamari without alcohol, microbial-rennet cheese, or a bakery barra).

## Javier: base foods (first, small)

Add what the new preps need and is missing. Search app/data first and never duplicate.
- **Bread and wraps:** bocadillo barra (bakery, generic), pan de molde integral (already in: check), and a
  wrap option that is not `check` if one exists.
- **Cooked chicken:** halal pechuga, cooked or grilled.
- **Pasta and grains:** dry pasta (exists), quinoa, egg noodles and rice noodles.
- **Sauces and spreads:** tomate frito, pesto (check its cheese rennet), soy sauce or tamari (status per the
  label), teriyaki (mirin means not-halal or check), salsa.
- **Cheese and dairy:** mozzarella and grated cheese (status per rennet).
- **Beans and vegetables:** tinned black and kidney beans, sweetcorn, broccoli, mushrooms, carrots, onion and
  cherry tomatoes if missing.
- **Ready soups:** a crema de verduras or calabacín (a Mercadona carton).
- Packs as before. Your files only.

## Yusuf: 20–25 new preps, mostly international and easy

Each prep gets a record plus a library recipe, with honest `effort`, `minutes` and `serve`. Lunch
preps must pass the lunch-box test. Suggestions only; don't be limited by them:
- **Sandwiches and wraps (lunch):**
  - chicken, pesto and roast pepper bocadillo
  - tuna, egg and tomato bocadillo
  - tortilla de patatas bocadillo
  - hummus and roast vegetable sandwich
  - halal chicken caesar wrap
  - falafel and salad wrap
- **Pastas:**
  - halal beef bolognese (batch, freezer)
  - chicken and broccoli pesto pasta (hot or cold)
  - tuna and tomato pasta
  - Greek pasta salad
  - lentil bolognese
  - pasta al horno (a baked pasta)
- **Bowls and salads:**
  - halal chicken burrito bowl with beans and corn
  - chicken caesar salad box
  - Greek salad with chicken and quinoa
  - halal-soy chicken and vegetable noodle stir-fry
  - a Mediterranean quinoa salad
- **Dinners, beyond curries:**
  - oven tray bake (chicken thighs, potatoes, peppers)
  - baked salmon with potatoes and green beans
  - chicken fajitas
  - shakshuka
  - tortilla española
  - lentil soup or a crema with egg
- **Breakfasts:**
  - tostada with tomato, tuna or egg
  - egg and cheese breakfast sandwich
  - Greek yogurt bowl
  - banana-oat smoothie jar

Then update the **low-cook week** and **budget week** so lunches mix sandwiches, pasta, bowls and
salads, with at most one desi rice lunch a week and no lentil-tuna repeats. Rebuild through
`build.mjs`. Every number is sourced, as always.

## Lena: UI hook (small, in wave 2)

Add an optional `cuisine` tag on library recipes (`desi`, `spanish`, `mediterranean`, `italian`,
`mexican`, `asian`, `middle-eastern`, `international`). The Prep library gets a cuisine chip row
under the Cook / No-cook filter, and no-cook stays as it is.
