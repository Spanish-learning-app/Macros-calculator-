# Kickoff memo: Bilal Ahmed, Customer Lead

Meeting 001, 2026-10-13. For Omar, Lena and Dr. Ayesha.

Me: 31, 82 kg, 178 cm, lift 4x a week, on a slow cut. Target is about 2,300 kcal, 160 g protein,
~70 g fat, 30 g fiber (MacroFactor's number; Ayesha, please check it). Seven years of tracking, four
apps quit.

## 1. Before

- **MyFitnessPal.** *Good:* "copy from yesterday" and barcode. *Bad:* desi food is user-entered
  junk. Search "roti" and you get dozens of entries from 70 to 300 kcal, many with no weight.
  "Karahi, 1 serving": what serving? Ads on every screen, barcode went premium, and it bills in dollars.
- **Cronometer.** *Good:* trustworthy sourced numbers, fiber, a good recipe builder. *Bad:* an
  American kitchen. No nihari, paye, haleem or Lahori chanay, so I built everything desi in grams.
  That's 6–8 taps a food.
- **MacroFactor.** *Good:* weekly targets adjusted from my weight trend (my best cut), and no ads.
  *Bad:* paid only, and Western food. I logged roti as "whole wheat tortilla, 8 inch" for a year.
- **HealthifyMe.** *Good:* knows roti, katori, dal and sabzi. *Bad:* the food is Indian, not ours
  (paneer everywhere, karahi with no restaurant ghee). Coach-plan upsells and a notification storm.
- **Others:** a spreadsheet and a scale in year one. An AI photo app guessed
  my karahi confidently and was way off on the oil.

**What every app gets wrong:**
1. Desi foods are missing or come as junk duplicates with no source.
2. Grams only, when I think in roti, katori, plate, boti, cup and chamach.
3. Chai with milk and sugar. 3–4 cups a day is close to a meal, and nobody models it right. MFP
   gives you a British splash of milk or a Starbucks chai latte.
4. Ammi's karahi and a Gawalmandi restaurant's karahi can be a few hundred kcal apart per katori
   (Ayesha has the real gap). No app has a "dhaba" option.
5. Too many taps for a week where I eat almost the same thing every day.
6. No sehri or iftar slots, and my 12:15 am post-taraweeh shake lands on tomorrow.

## 2. What v1 needs

**Must-haves, ranked**
1. Search that knows our names and spellings (roti = chapati = phulka, dal/daal, anda/egg, chawal),
   plus international basics under their real names (lentejas, tortilla). One good entry per food,
   each with a source.
2. Desi portions with the grams shown: roti (ghar ki, tandoori and naan are different), katori,
   plate/half plate, boti, cup, glass, chamach.
3. My chai set up once, then one tap per cup.
4. Copy yesterday, saved meals, recents on top.
5. Protein and kcal left today, in big numbers on the main screen.
6. A home or restaurant choice for oily dishes (karahi, salan, biryani, paratha, nihari).
7. Recipes: enter the whole pot, log my portion ("1 katori", "half the tortilla").
8. A calendar: plan tomorrow, tick meals off, swipe between days, weekly average.
9. Ramadan mode with Sehri, Iftar, Dinner and After-taraweeh slots. After-midnight food counts toward
   the fasting day.
10. Phone-first, no login, no ads, works offline, data stays on my phone, plus a backup (copy as
    text is fine).

**Nice-to-haves:** training-day and rest-day targets; a weight trend; local packaged foods (Olper's,
rusk, Rio biscuits); "40 g protein under 500 kcal" ideas; share my day on WhatsApp.

**Dealbreakers (deleted within a day):** a sign-up or free-trial screen before I can log; ads or
paywalls; a "roti" search where I can't tell which entry is right; more than 3 taps for a chai;
calories that don't match the macros; losing my log on refresh; guilt-trip red warnings on a shaadi
day; slow on a mid-range Android, or sideways scrolling.

## 3. My real eating (test data)

To be honest, I end up short on protein on weekdays and blow the calories on weekends.
**My chai:** doodh patti, a ~150 ml cup, about two-thirds full-cream milk, 1.5 chamach cheeni.

**Weekday (gym at 7 pm)**
- 8:00: 3-anday omelette (1 tsp oil, pyaz, tamatar), 1 ghar ki roti (no ghee), chai
- 11:30: chai, 2 rusk
- 1:30 (tiffin): 2 roti, 1 katori daal mash, salad, half katori dahi
- 5:00: chai, 1 seb
- 6:30: 1 scoop whey in water, 1 kela
- 9:15: 2 roti, 1 bari katori chicken salan (3 boti), half katori aloo gobi, salad
- Wednesday lunch instead: 1 plate chawal, 1 katori chana daal

**Saturday**
- 11:30: 1 anda paratha (desi ghee), half katori dahi, chai
- 4:00: chai, 2 samosay
- 9:30 out: my share of a half-kg chicken karahi split three ways, 2 naan (1 roghni), raita,
  1 regular cold drink (345 ml)
- 11:45: dhaba chai (extra sugar), 1 kulfi
- Sunday swap: halwa puri, which is 2 puri, 1 katori chanay, half katori halwa, chai

**Ramadan day**
- 4:30 sehri: 1 paratha (light ghee), 2 fried anday, 1 katori dahi, chai
- 6:05 iftar: 3 khajoor, 1 glass Rooh Afza, 1 katori fruit chaat, 4 pakoray, 1 samosa
- 8:30: 1 roti, 1 katori chicken salan
- 12:15 am (after taraweeh and gym): 1 glass doodh with 1 scoop whey, chai

**Mixed Spanish day**
- 10:30: pan con tomate (2 slices bread, 1 tbsp olive oil), 2 boiled anday, chai
- 2:30: 2 katori lentejas, 1 roti. The pot is 250 g dry lentils, carrot, aloo, onion, 2 tbsp olive
  oil, and 150 g halal beef sausage because chorizo is out.
- 6:00: chai, 3 Marie biscuits
- 9:30: half my tortilla de patatas (5 anday, 3 aloo, 1 onion, ~100 ml olive oil to fry, mostly
  drained), salad

## 4. Acceptance test (first build)

I'll run these in Chromium at 400 px and on desktop, with a stopwatch. Each is pass or fail.

| # | Task | Pass if |
|---|------|---------|
| A1 | First open, set targets | ≤ 60 s, no account, no ads |
| A2 | Search "roti", "chapati", "phulka" | ghar ki roti in the top 3 for each; tandoori roti and naan separate |
| A3 | Search "dal", "daal", "anda", "chawal", "lentejas" | the right food in the top 3 |
| A4 | Log the Boss's sample day | ≤ 60 s from empty |
| A5 | Log my weekday | ≤ 90 s the first time, ≤ 15 s with copy yesterday |
| A6 | Log one chai | ≤ 2 taps, ≤ 3 s |
| A7 | At 6 pm, check protein left | visible without scrolling or tapping |
| A8 | Enter "1.5 katori" and "half plate" | both accepted, assumed grams shown |
| A9 | Switch karahi from home to restaurant | kcal changes; the source opens in 1 tap |
| A10 | Build the tortilla recipe, log half | ≤ 2 min the first time, ≤ 10 s after |
| A11 | Log a Ramadan day with the 12:15 am shake | all of it on one fasting day |
| A12 | Plan tomorrow, then tick meals off | 1 tap per meal |
| A13 | Delete by mistake, undo, then refresh | nothing lost |
| A14 | Spot-check 10 foods | kcal within ~10% of 4P+4C+9F, fiber shown |
| A15 | Dark mode at 400 px | no sideways scroll, thumb-size buttons |

## 5. Customer Panel hiring request

Hire **a home cook who has never tracked anything.** Ideally a woman around 40 who cooks for a
family of five every day, measures by andaza, has no kitchen scale and needs about 1,600 kcal. I'm
the wrong person to judge ease of use: I know 100 g of chicken breast by heart and I'll put up with
grams. She'll show us within ten minutes whether katori units, the whole-pot recipe flow and
first-open setup work without anyone explaining them. Her lower target is also a stress test: at
1,600 kcal, four chais and a paratha are a third of her day, so any desi-data error hurts her more
than me. She covers the beginner side and the cooking side at once, and the Boss may be closer to
her than to me.

## 6. Name ideas

- **Katori** (my favourite): the unit every Pakistani kitchen thinks in, and my Spanish friends can
  say it.
- **Hisaab**: "khanay ka hisaab", which is exactly what the app does.
- **Niwala**: a bite. It feels homely and fits roti or tapas.
- **Dastarkhwan**: the family spread. It feels like home, though it's long for an icon.
- **Tiffin**: the office lunchbox, a word people know from Lahore to London.
