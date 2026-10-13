# Meeting 002 input: Dr. Ayesha Siddiqui, Nutrition Lab

**Topic:** Barcelona, PhD, halal meal prep. 2026-10-13.

**Short version:**
- Batch boxes are safe if rice is frozen and use-by is worked out from what is in the box.
- I propose 12 halal boxes, each with 35–50 g of protein.
- Halal gets 3 values, each with a reason, plus a seafood setting.
- Targets get Spanish meal times; the formula does not change.
- I need one hire.

## 1. Meal-prep food safety

| Cooked component | Fridge (≤ 5 °C) | Freezer | Source |
|---|---|---|---|
| Rice, pasta, couscous, bulgur | **1 day** | 1 month | NHS / FSA |
| Chicken, meat, keema, kebabs | **3 days** (FSIS says 3–4; we use the lower) | 3 months | USDA FSIS |
| Tortilla, egg dishes | 3 days | no | USDA FSIS |
| Tuna or chickpea salad, raita, cut salad | 2 days | no | Lab rule |

**Rice: the *B. cereus* risk**
- *B. cereus* spores survive cooking. The toxin they make survives reheating, so microwaving a box
  that has gone off does not make it safe.
- Chill rice within 1 hour.
- Of the 4 boxes, **box 1 goes in the fridge and boxes 2–4 go in the freezer**. Move the next day's
  box to the fridge the night before.
- Reheat **once**, until steaming hot right through (75 °C).

**Use-by in the app**
- Use-by = cooked date + the **shortest** fridge life of the box's components.
- A frozen box has no use-by. "Move to fridge" gives it 1 day.
- On the use-by date the Day view says "last day". After it, it says "past use-by, best not to eat",
  with no red.
- **A18 needs to change:** a Sunday rice batch is past use-by on Tuesday unless the later boxes are
  frozen.

**Cold or reheated**
- Cold boxes need an insulated bag and an ice pack. Discard after 2 hours unchilled (1 hour above
  32 °C).
- No fish or eggs in boxes that get reheated.
- Sauce goes in a separate pot.

## 2. Sprint 2 recipe library: 12 halal lunch boxes

Per box: 550–750 kcal, 35–50 g protein, at least 8 g fibre. The Lab computes the exact macros
(NUTRITION.md §6). Weights are raw, per box.

| # | Box | Protein / base | Eat | Freeze |
|---|---|---|---|---|
| 1 | Chicken tikka rice bowl, raita pot on the side | 180 g thigh / 60 g basmati | hot | yes |
| 2 | Keema matar with rice | 150 g lean mince + 40 g peas / 60 g rice | hot | yes |
| 3 | Yakhni chicken pulao | 170 g chicken / 70 g basmati | hot | yes |
| 4 | Shami kebab wrap, mint-yogurt pot | 3 kebabs (beef + chana) / wholemeal wrap | cold or warm | kebabs |
| 5 | Pollo al ajillo *sin vino* (lemon instead of wine), rice, green beans | 180 g thigh / 60 g rice | hot | yes |
| 6 | Halal albóndigas in thick tomato sauce, couscous | 160 g mince / 60 g couscous | hot | yes |
| 7 | Moroccan chicken couscous, roast vegetables | 170 g breast / 60 g couscous | either | chicken |
| 8 | Chicken seekh kebab with tabbouleh | 160 g chicken mince / 50 g bulgur | cold | kebabs |
| 9 | Chicken chana chaat | 150 g breast + 120 g chickpeas | **cold** | no |
| 10 | Chickpea and tuna salad | 110 g tuna (drained) + 120 g chickpeas | **cold** | no |
| 11 | Chicken and hummus pasta salad | 150 g breast / 75 g wholewheat pasta | **cold** | no |
| 12 | Protein tortilla wedge (eggs + egg whites) with skyr | ¼ tortilla + 150 g skyr | **cold** | no |

**Shopping**
- **Halal butcher (carnicería halal):** chicken and lean beef mince.
- **Mercadona:** grains, wholewheat pasta, tinned chickpeas and tuna, skyr or Greek yogurt, wraps,
  egg whites, vegetables, olive oil, spices.
- Check the labels on wraps and hummus for *manteca*, *gelatina* and animal-derived E471.
- Each recipe gets a shopping list that scales with the box count, and a cost per box.

## 3. Halal model

Each record gets a `halal: { status, reason }` field, replacing today's two halal tags.
- The reason is one line, required unless the status is `halal`.
- A recipe takes the worst status of its ingredients.

| Status | When | Example reason |
|---|---|---|
| `halal` | Plants, dairy, eggs, fish. Meat **only** from a halal butcher or with certification. | — |
| `check` | Possible lard, gelatine, often cooked with wine, restaurant meat in Spain, imports without a seal | "Cheap pastries may use lard (manteca). Ask the bakery." |
| `not-halal` | The standard recipe contains pork, lard or alcohol | "Ensaïmada is made with pork lard (saïm)." |

**Proposed change to the minutes:** ship a few `not-halal` foods the Boss will search for, such as
ensaïmada (A19).
- They show their reason.
- They are never suggested, and never appear in templates or recipe pickers.
- They are hidden by "Halal only", which is on by default.
- We still ship no pork meat products.

**Cross-contact** (shared slicers or fryers) is not tagged per food, because everything would become
`check`. One line on the About screen covers it.

**Seafood**
- The Hanafi school, which most Pakistanis follow, permits fish. Many Hanafi scholars differ on
  prawns and do not permit squid, octopus, mussels or crab. Other schools allow all of them.
- Tags: `seafood-fish`, `seafood-prawn`, `seafood-other`.
- Onboarding asks once: "Which seafood do you eat? All / Fish and prawns / Fish only". Skipping means
  "All".
- Anything outside the user's choice shows `check` with "Depends on your school of thought". No
  rulings and no red.

## 4. Targets for a PhD weekday

The formula is unchanged. A desk PhD who walks around Barcelona is `light`.

**New slot preset, `RULES.mealSlots.spain`** (same slot ids):

| Slot | Share | Hours |
|---|---|---|
| Breakfast and mid-morning café | 20% | 05:00–12:30 |
| Lunch box | 35% | 12:30–16:30 |
| Merienda / chai | 10% | 16:30–20:00 |
| Dinner | 30% | 20:00–01:00 |
| Snacks | 5% | 01:00–05:00 |

- With today's hours, A19's 11:30 cortado lands in Lunch; the preset fixes that.
- The app defaults to this preset when the device time zone is Europe/Madrid.
- The lunch box should cover at least 30% of daily protein. At 2,160 kcal that is about 750 kcal and
  45 g.
- Engineering should test Madrid dates across the 25 October daylight-saving change.

## 5. Hiring: yes, a Barcelona Halal Meal-Prep & Catalan Cuisine Specialist

**Brief**
- **Who:** a Spain-registered dietitian-nutritionist (*dietista-nutricionista colegiado*) living in
  Barcelona, who eats halal or knows the halal supply well.
- **Knows:** the halal butchers; Mercadona, Bonpreu and Carrefour own brands and labels (*manteca*,
  *gelatina*, E-numbers); the fats used in Catalan bakeries.
- **Delivers:** the 12 boxes as standard recipes (yields, oil in grams), each with a scaled shopping
  list, a cost per box, storage per component, and Catalan, Spanish and English names. Also
  cross-checks Javier's café records.
- **Why:** this is a full Sprint 2 workload that needs local, first-hand sourcing. Zainab and Javier
  are fully booked on the Sprint 1 coverage list.

**Lab follow-up after the decision:** add to `rules.js` the `spain` slot preset, a
`mealPrep.storage` table, the `halal` field and the seafood tags, and update `NUTRITION.md` to match.
