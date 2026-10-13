# Meeting 002 input: Bilal Ahmed, Customer Lead

**Topic:** the Boss's update (Barcelona, PhD, halal meal prep). 2026-10-13.

**Short version:** the Boss's lunch is now a box from the fridge, so batch recipes become central.
Our test clock is also wrong: it should be Europe/Madrid, not Karachi.

## 1. How meal prep really works

- **Cooking:** on Sunday, making 4 boxes for Monday to Thursday. Friday is leftovers or eating out.
- **Keeps 3–4 days:** cooked chicken, dry keema, rice, pasta, roast veg, boiled eggs, tortilla.
  Ayesha sets the real days.
- **Freezes:** kebabs, keema, cooked chicken, parathas, rice. Never salad or raita.
- **Cold vs microwave:** the uni microwave has a queue at 14:00, so half the week is cold (pasta
  salad, chana chaat, tortilla). Rice bowls and keema get reheated.
- **Boring by Thursday:** the same chicken and rice every day. The fix is two proteins and two bases
  a week, plus sauce in a separate pot.

## 2. The "in front of colleagues" test

A lunch passes if it's dry, needs only a fork, and doesn't smell.

- **Pass:** chicken tikka rice bowl (raita on the side), keema matar with rice, yakhni pulao, a
  shami kebab wrap, cold chana chaat, tortilla wedges.
- **Fail:** daal (it leaks), gravy salan, oily karahi, biryani (smell), reheated fish or eggs, and
  roti packed at 8 am (leather by 14:00).

## 3. Halal in Barcelona, as a customer

- **Meat:** the halal butchers (carnicerías halal) around the Raval.
- **Labels:** look for a certifier's seal. "Sin cerdo" (no pork) isn't enough. *Manteca* is lard,
  *mantequilla* is butter. Watch for *gelatina*, and for jamón, chorizo, fuet and sobrasada, which
  are all pork.
- **Bakeries:** a croissant *de mantequilla* is fine, but cheap pastries may use lard, and
  ensaïmada is made with lard. Pa amb tomàquet and café con leche are safe.
- **Cafeteria and menú del día:** most bocadillos are pork, so pick tortilla or tuna (atún). At a
  menú del día, grilled fish or salad is fine. Lentejas usually come with chorizo, and the chicken
  is almost never halal.

**For the app:** every food needs a halal tag (halal / check / not halal) with a reason.

## 4. Meal prep in the app

**Walkthrough:** I open "Tikka bowls", set 4 boxes and see the per-box macros. I tap Lunch for
Monday to Thursday, copy the shopping list on Saturday, and on Thursday I see "last box today". I
don't need push notifications.

| Step | Must or nice | Budget |
|------|--------------|--------|
| Build a batch recipe the first time | Must | ≤ 2 min, ≤ 25 actions |
| Cook a saved recipe again | Must | ≤ 3 actions |
| Set the box count and see per-box macros | Must | 1 action |
| Put a box into Lunch | Must | 1 action per day |
| Boxes left; halal tag | Must | 0 (always visible) |
| Shopping list, copied as text | Nice | ≤ 3 actions |
| Use-by note; freezer stock | Nice | 0; ≤ 2 actions |

## 5. Acceptance tests (clock on Europe/Madrid)

- **A16: batch recipe to boxes**
  - *Steps:* Build "Tikka bowls" (800 g chicken thigh, 200 g dahi, 2 tbsp oil, 320 g dry basmati,
    2 cucumbers) with 4 boxes, then change it to 5.
  - *Pass:* For every nutrient, per box = total ÷ boxes. The count changes with no re-entry. Halal
    status comes from the ingredients.
  - *Budget:* ≤ 25 actions; ≤ 2 actions to change the count.
- **A17: boxes into Lunch**
  - *Start:* Sunday 20:00.
  - *Steps:* Place one box in Lunch for each day, Monday to Thursday.
  - *Pass:* Four planned entries, and the recipe shows "0 of 4 left". A fifth placement shows an
    inline note but is allowed. Ticking an entry eaten takes 1 action.
  - *Budget:* ≤ 6 actions and ≤ 15 s.
- **A18: shopping list and use-by (nice-to-have)**
  - *Steps:* Open the list for 4 boxes, then for 8. Copy it. Set the clock to Thursday, then Friday.
  - *Pass:* Amounts double at 8 boxes, and the list copies as plain text. The Day view says "last
    day" on Thursday and "past use-by" on Friday. Frozen boxes get no warning.
  - *Budget:* ≤ 3 actions.
- **A19: Barcelona café breakfast**
  - *Start:* 09:00.
  - *Steps:* Log café con leche, a croissant and a zumo de naranja, then a cortado at 11:30. Also
    search `cafe amb llet` and `ensaimada`.
  - *Pass:* Each is in the top 3 by its Spanish, Catalan (no accents needed) or English name. The
    croissant shows halal "check" with a reason. An entry at 00:30 lands on Madrid's date.
  - *Budget:* ≤ 12 actions; ≤ 30 s for a person.

## 6. Hiring view

Yes. Add a halal-eating PhD student in Barcelona who meal-preps on Sundays and eats café breakfasts.
My year in Spain was a while ago and not as a student, and I don't know today's butchers, cafeteria
menus or labels first-hand. Nasreen covers beginners and I cover veteran desi trackers, but nobody
on the panel lives the Boss's weekday: the microwave queue, the bakery lard check, the Friday menú
del día. This tester would run A16–A19 at every review.

**Follow-up for me:** update CUSTOMER.md with the Madrid clock, a D5 PhD weekday, the Barcelona
foods and A16–A19.
