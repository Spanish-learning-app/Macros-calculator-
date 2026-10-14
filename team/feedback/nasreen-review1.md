# Nasreen Akhtar: Review 1 (first build)

*2026-10-14 · 400 px phone, Madrid time, first-time user. Screenshots: `team/feedback/screens/nasreen/`.*

## What was easy

- The first screen says what I wanted to hear: "Write what you eat. See how much is left today." and "No account, no sign-up, no password." Two big buttons (`01-first-open.png`).
- Height in feet and inches works. I typed 5 and 3 (`03-feet-inches.png`).
- Searching works the way I type on WhatsApp. "chaye", "saalan", "anday", "chawal", "samosay" and "pakoray" all found the right food.
- The portion screen is the best part: big ½, 1, 1½ and 2 buttons, with grams small underneath (`13-roti-half-picker.png`, `15-roti-1half-picker.png`). I never typed a number.
- "1370 kcal left" is one big number at the top of Today. The day starts fresh tomorrow (`18-day-after-logging.png`, `26-shaadi-next-day.png`).
- The next day my salan was in "Recent", and it took two taps: Add, then the + (`20-next-day-add-sheet-empty.png`).

## What confused me (exact words)

- **"null"** is printed on screen under the search results, every time (`10-search-chicken-salan.png`, `23-search-tasting.png`). It looks broken. I'd think I had done something wrong.
- **"Estimate"** is everywhere (on my target and on most foods), and nothing says what it means. "An estimate, you can change it." is okay, but "this is a guess" is plainer.
- **"We slowed your weight-loss pace to a safer rate."** I didn't ask for a pace. Who slowed it, and why? It sounds like I did something wrong (`05-after-onboarding.png`).
- **"Keep my weight"** was already selected, though I came to lose weight. I nearly didn't notice.
- **"Active: On your feet most of the day (busy housework, shop or ward work), or exercise 3 to 5 days a week, for example the gym 4 days."** What is ward work? I don't go to a gym. I wanted "housework, no exercise".
- **"katori, edible part"** in the picker, but "1 katori (medium, 200 ml), edible part" in the list. Which katori is mine? The bowl pictures are tiny (`11-salan-portion-picker.png`).
- **"Source and details"** shows "Citation: Recipe R-pk-chicken-salan-home" and "Confidence C: Estimate". That is for engineers (`36-source-details.png`).
- After tapping + the sheet stays open. The only sign is a small grey line, "Added Roti / chapati (home, no ghee), ½ roti, medium, to Nashta. 2 added so far." I wasn't sure it had worked.

## What made me feel stupid or rushed

- Searching "chai" put a pizza in the list, and "naan" put Banana third. Odd answers make me doubt myself.
- "Eaten so far: 2852 of 1370 kcal" and decimals like "2.1 / 159 g" look like a bank statement. "2 biscuit" should say biscuits.
- The round "Add food" button sits on top of the food rows, so I can't read the kcal on the last line (`18-day-after-logging.png`).

## My checks

| # | Result | Screenshots | Notes |
|---|--------|-------------|-------|
| N1 | **Pass** | `01`, `02-onboarding-full`, `03`, `05`, `12-after-first-chai` | No sign-up. Feet and inches work. The target is labelled "Estimate", not "guess".  Small wording problems (above). |
| N2 | **Pass** | `13`, `15`, `16-daal-picker` | ½ and 1½ are buttons. Katori sizes have pictures, but they are small. Typing "aadhi roti" finds nothing. |
| N3 | **Pass** | `11`, `17`, `20`, `21`, `22` | Home-made is a choice on one screen, with no pot to build. The next day it was in Recent, 2 taps. |
| N4 | **Fail** | `23-search-tasting`, `24-quick-add` | "tasting", "taste", "leftover", "bacha hua", "thora sa" and "small" all say "Nothing found". Quick add wants a name and kcal, and I don't know the kcal. So I would skip it. |
| N5 | **Pass** | `25-shaadi-day-top`, `25-shaadi-day-full`, `26-shaadi-next-day` | 2852 kcal against 1370 shows "1482 kcal over" in plain dark text, with no red and no scolding. Tomorrow is empty and fresh. But nothing kind is said, and there is no sideways scroll. |

**4 pass, 1 fail.**

The other tests:

- **A1, A2, A3:** pass. No other-origin requests, and Skip works.
- **A4 / D0:** pass. 7 entries, and the total is the sum of the rows.
- **A8:** half pass. Daal mash 1½ katori and 0.33 work. 0, empty and -1 are refused inline, no pop-up. But plain rice has no plate. It only has small katori, katori, large katori, tablespoon and cup, so "half plate chawal" is impossible (`32-a8-rice-picker.png`).

## Top 7 changes, ranked

1. Remove the "null" text under the search results.
2. Add a tasting and leftovers option, such as "Chakhna / bacha hua (thora sa)" with a small / medium choice. Quick add must not need kcal.
3. Explain "estimate" in one plain line ("a good guess"), and change "We slowed your weight-loss pace to a safer rate." to something calm that says why.
4. Add a plate (and a picture) for chawal, and draw the three katoris big and clearly. Use one name for the katori everywhere. Drop "edible part" and "as notified".
5. After a tap on +, show a clear green line like "Added" at the top, not small grey text. Don't let the "Add food" button cover food rows.
6. Fix the form. Preselect nothing or "Lose weight", and use words like "housework, no exercise" in place of "ward work" and "the gym 4 days".
7. Clean up search junk (pizza for "chai"). Make "aadhi" and "dairh" searchable. On a big day add one kind line, like "Shaadi day, tomorrow starts fresh".
