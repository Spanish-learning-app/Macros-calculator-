# Mariam Iqbal: Review 1 (first build)

*Wed 14 Oct 2026, Madrid clock. 400x860, dark, browser in Spanish, plus one light desktop pass at 1280. Script and screenshots: `team/feedback/screens/mariam/`. An action is one tap or one typed phrase.*

## My five checks: 4 pass, 1 fail

- **M1 Café breakfast: PASS.** `cafe amb llet` gave café con leche at rank 1; `cruasan` gave the croissant at rank 1; `cortado` rank 1. All three landed in Breakfast, the 11:15 cortado too. The croissant shows an amber `Check`, and one tap opens "may contain lard (manteca de cerdo) or E471, check the label or ask the bakery" (`m1-7-croissant-reason-open.png`). No accents needed. Café + croissant took 6 actions with Done; the cortado took 4. About 10 in all (`m1-6-day-after-cortado.png`). Not truly one-handed: Done sits at the top of the sheet (y 39-83 of 860).
- **M2 Lunch box: PASS.** `tikka` gives the box at rank 2, after the single leg piece. It defaults to "1 box · 650 kcal"; no grams needed. Day 1: 4 actions. Day 2, from the Lunch recents, took 3 taps (FAB, +, Done); the box was first in the list (`m2-4-day2-recents.png`, `m2-5-day2-lunch.png`). There is no halal chip on the box.
- **M3 Late evening: PASS.** Chai at 17:30 went to the merienda slot, dinner at 21:45 to Dinner. I reopened the app at 00:30 on the 15th. It said "Today, Wed 14 Oct", so the toast stayed with tonight (`m3-3-open-at-0030.png`). Clock-change night (Sat 24 to Sun 25 Oct): the day stayed Sat 24 at 00:30, 02:30 CEST, 02:30 CET and 03:30 CET, and only flipped at 04:10 (`cc-1-0030.png`, `cc-2-0330-cet.png`). Nothing shifted.
- **M4 Halal honesty: PASS.** "Halal only" is on by default. `ensaimada` says "1 hidden: not halal" with the lard reason, and a Show hidden button (`m4-on-ensaimada.png`). Revealed or with the filter off, it carries a "Not halal" chip with the reason, and is never suggested. `napolitana` is `Check` with the lard reason. `bocadillo` finds tortilla and atún, and I saw no pork meat.
- **M5 Gym day: FAIL.** Protein left sits at y 119-163 with 0 taps and stays pinned while scrolling. There is no sideways scroll (400 = 400) and dark mode reads well (`m5-2-day-top.png`). But I could not log a skyr: `skyr` only finds the protein-tortilla lunch box, and it went into my merienda at 607 kcal. See the protein target below.

## What works for a PhD weekday

- Search is forgiving: Catalan, Spanish without accents and English all land.
- Madrid time is right: the Spanish meal-time preset applied by itself, and the 04:00 day start keeps midnight toast with tonight.
- Calm tone: no red, no sign-up, no ads.

## What doesn't

- **A literal "null" appears under every search result list** that has no hidden items (`m1-3-cruasan.png`, `m2-1-tikka-search.png`). It looks broken; probably `results.replaceChildren(list, null)` in `add-sheet.js`.
- The slots are "Nashta" and "Shaam ki chai" on a Barcelona preset. I say "merienda", and the UI is English-only in a Spanish browser.
- The 00:30 toast goes into the Dinner slot beside tortilla, because Dinner runs until 01:00. It is the right day, but the wrong meal.
- The first `chai` hit is dhaba karak at 239 kcal. My lab chai (teabag, milk, one sugar) is the third hit at 111 kcal.
- The "Add food" button covers the last line of an entry.
- The protein target is 60 g (1 g/kg). A gym-goer who wants more protein sees "31 g protein over" after lunch and a box. That is backwards.

## Halal trust

I trusted the pastry labels. The croissant and napolitana say `Check` with one plain lard reason, and ensaïmada is hidden with its reason, not preached about. I distrusted two things. First, foods rated halal show no chip at all, so "Lentejas (Spanish lentil stew, halal)" has no visible basis. A menú lentejas has chorizo. Second, `jamon`, `chorizo`, `gambas` and `calamares` return nothing, with no hidden note. An empty search is not the same as "hidden because pork".

## Top 7 changes, ranked

1. Remove the stray "null" under search results.
2. Add skyr and plain Greek yogurt as foods, with skyr as an alias.
3. Fix protein wording and target. Replace "protein over" with "protein so far, goal reached". On the profile, offer "more protein" (about 1.6 g/kg) when I say I lift or gym.
4. Spanish slot names under the Madrid preset: Desayuno, Comida, Merienda, Cena, and a late slot. Let me rename them during onboarding, not only in Profile.
5. Between 00:00 and 05:00, default the sheet to Snacks, and show "still Wed 14 Oct" in the sheet header.
6. Let me save "my usual" (chai, or café con leche + croissant) as one tap. Rank home doodh patti, 1 sugar, first for `chai`, and show only this slot's foods in Recents (my day-1 Lunch recents were breakfast foods).
7. Make halal honesty complete. Show a quiet reason on tap for halal foods ("halal butcher, label checked"). Add jamón, chorizo and calamares as hidden-with-reason rows, so a pork search is never silently empty.

**Verdict: 7/10.** The logging loop, Madrid clock and halal honesty beat MyFitnessPal and Yazio. The "null" bug, no skyr and the Urdu-first meal names are what stop me from keeping it.
