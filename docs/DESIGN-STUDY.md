# Design study: Katori against the market leaders

**Author:** Priya Raman (UI Engineer) · **Asked by:** the Boss, via Omar · **Date:** 2026-10-14 ·
**For:** Meeting 004 (design review)

**Method.** The web was reachable. I used about 22 public sources ([list at the end](#sources)):
app store pages, the companies' own sites and help centres, one design critique, review sites and
review-mining write-ups, and the Apple and Material design guidelines. Many review sites are
affiliate blogs, so I use them only for what users say, never for numbers. Where I rely on what I
already knew about an app and could not check it this time, the text says **[from memory]**.
I did not install or open the competitors' apps, so I have no screenshots of them, which suits the
"inspiration, not copying" rule.

Our own screens: 32 PNGs at 400 × 860, light and dark, Europe/Madrid, in
`team/feedback/design-study/`. `shoot.mjs` covers welcome, onboarding, targets, the Day view (empty
and logged), the add sheet, the portion picker, Week, Prep and Profile at 13:10. `shoot-prep.mjs`
covers the cook dialog, a batch card, "Fill Mon–Thu" and the Day view with a box, on Sunday at
18:00. The Prep screens were **mid-change**. My first pass had them unstyled. Lena's new
`app/styles/prep.css` (not yet committed) landed during the study, so I took the Prep shots
(`*-09`, `*-11` to `*-14`) again with it. Section 5 is based on the second pass.

---

## 1. The apps, one block each

### MyFitnessPal: the logging flow most people know
- **Good:** the biggest database. Most users already know its meal-bucket diary (Breakfast, Lunch,
  Dinner, Snacks), and that familiarity is worth something.
- **Bad:** the April 2026 "Today" redesign (v26.16.0) replaced the classic Diary. In an analysis
  of 202 negative recent Play reviews, 23 were about the redesign: *"You turned simple tasks into
  4-5 clicks instead of 1-2"*, *"I could see everything I'd eaten in one place. Not anymore!"*,
  and micronutrients now sit behind *"buried menus and endless scrolling"* [5]. 59 of the 202 named
  the paywall, 27 of them because the barcode scanner moved behind it, and 9% named ads, including a
  banner that covers controls [5]. The MFP team announced the Today tab in October 2025 as a way to
  "bring the diary front and center" [6]. A market note says the store rating fell sharply after
  the rollout, but I could not open that page, so treat it as unverified [7].
- **Users say:** they want one screen with the whole day on it, and few taps. A redesign that hides
  totals or adds taps is punished at once.
- **Lesson for us:** never trade the one-screen day for a prettier one. Our Day view already shows
  the whole day. Keep it that way.

### MacroFactor: fast logging, calm and data-first
- **Good:** it measures logging speed in actions and publishes the results (FLSI 2025). It scores
  24 actions over four tasks, against 32 for Lose It!, and MyFitnessPal, Cronometer, Lifesum and
  Yazio each miss the "strong" mark on at least one task [1]. It uses a timeline instead of fixed
  meals, and has copy and paste of one food, many foods or a whole day [2][4]. Its store page
  promises *no warnings, red numbers or shaming* when you go over [2], the same rule we chose.
- **Bad:** a 2025 reviewer says it *"can feel overwhelming at first"* [2]. MacroFactor itself
  says its speed index does not judge visual design [1].
- **Recipes and meal prep:** you build a recipe from its ingredients and type the number of servings
  it made. You do not weigh the cooked pot [3]. "Explode" logs part of a recipe. One reviewer says
  batch portions *"sometimes felt inaccurate"* [2].
- **Lesson for us:** count actions as a design metric (Bilal already does), put the search box
  within one tap of every screen, and keep "over" calm and neutral.

### Cronometer: accuracy and sources
- **Good:** a curated, "verified" database (USDA, NCCDB) that users cannot flood with bad entries.
  Custom foods are kept apart and labelled [9][10]. Version 4.57 added "new ways to visualise your
  targets" that are *"more neutral and educational"* [9].
- **Bad:** reviewers call it *"functional rather than beautiful"* and say it has *"a dated mobile
  experience"* and a learning curve [10]. One long-standing request is to show how much protein,
  carbs and fat are **left**, not only eaten and % [9]. Text search is slow for whole meals [10].
- **Lesson for us:** our source panel and A/B/C confidence grades already match Cronometer's trust
  story, in a friendlier shell. Show "left", which we do, and keep the source one tap away.

### Lose It!: friendly onboarding, a daily budget
- **Good:** the home screen is simple: *calories remaining, a quick-add log and a progress bar*
  [11]. Onboarding is framed as a "Program" with a checklist [11].
- **Bad:** onboarding runs past 30 steps, by one count [11]. Shacknews says *"the UI could use some
  work"* [12]. Barcode, photo and voice logging are behind Premium [11].
- **Lesson for us:** our one big "kcal left" with a bar is the same proven idea. Our onboarding is
  much shorter (10 actions, from Bilal's A1), and we should keep it short.

### Yazio: Europe and Spain, fasting and recipes
- **Good:** well liked in Europe (4.6 on the App Store from 300k+ reviews, 4.5 on Trustpilot) and
  called *"very practical and well-designed"* and *"easy to navigate"* [13][14]. It has 2,500–2,900
  recipes, sized to the calories of each meal [13][14].
- **Bad:** pricing confusion is the main complaint [14]. On Yazio's own feature board, users ask to
  **log a whole dish by weight** instead of adding up ingredients, and to put their own recipes in
  meal plans [15]. A "meal" is always one portion, and only recipes have several portions [16].
- **Lesson for us:** a batch you cook once and eat as boxes is still a gap in a big European app.
  This is Sprint 2's headline, so it has to look first-class.

### Lifesum: known for visual design
- **Good:** one review calls it the *"best-designed UI of any calorie tracker we tested"*: warm,
  lifestyle-led, with illustrations and gradual colour transitions [17]. A Pratt design critique
  praises the progress circle on the home screen, which shows calories left and whether macros are
  on target at a glance, and its real food photos [18].
- **Bad:** the same critique finds logging takes many steps per food, editing an amount means going
  back into the meal (it suggests plus and minus buttons), and a bottom "+" duplicates the meal
  cards' own add buttons [18]. The food rating weighs nutrients to increase against nutrients to
  limit [19], and some users find it **judgmental** and cannot turn it off [20]. Reviewers say the
  design strength becomes *"a liability"* for serious tracking [17].
- **Lesson for us:** warmth and illustration help, but never grade food. Our halal and estimate
  chips inform without judging, and we must keep that tone. Our own "Add food" button plus the
  slot "Add" buttons is the same duplication the critique flags (Bilal's fix 6 says it too).

### HealthifyMe: South Asian food at scale
- **Good:** it built its Indian food database with India's National Institute of Nutrition, and
  had 10,000+ regional foods in 13 languages by 2015 [21]. Portions come in **katoris**, *"an
  easier way to measure the food intake for most Indians"* [21]. Its Alexa skill logs "two katori
  of sambhar" [21]. "Snap" photo logging (2023) is trained on Indian dishes, with a claimed 60–75%
  accuracy [22].
- **Bad:** users complain that basic features are paywalled and coaching is pushed hard [21][22]
  **[from memory]:** the home screen is busy, with coach and upsell cards between you and your log.
- **Lesson for us:** katori portions are a proven idea, not a gimmick. We also go further: a
  drawn katori, plate and cup, Urdu names, a Home-made / Restaurant / Dhaba switch, and halal status.

### Apple HIG and Material 3: what our users see every day
- **Tab bars (Apple):** *"Use a tab bar to support navigation, not to provide actions."* Include
  labels, *"use single words"*, and prefer filled symbols. The tab bar stays visible except under a
  modal [23].
- **Navigation bar (Material 3):** three to five destinations, *"each destination is represented by
  an icon and label text"*, with a pill-shaped active indicator behind the active icon [25].
- **Dark mode (Apple):** respect the system setting and *"avoid offering an app-specific appearance
  setting"*. Dark colours are not plain inversions. Aim for at least 4.5:1 contrast, and *"strive
  for 7:1, especially in small text"* [24].

---

## 2. Patterns the leaders share

| Area | What the leaders do | Katori today |
|---|---|---|
| Logging flow | A search box one tap away on every screen, then one tap per food with a remembered serving [1][2]. Copying a meal or day is common. | Same model. Slot "Add" leads to a search with recents, and a one-tap "+" per row. Copy yesterday or a day, with Undo. Bilal's runs: a normal day in 23 actions. ✔ |
| Daily summary | One big "left" number with a ring or bar at the top (Lose It!, Lifesum) [11][18]. | Big "kcal left" and "protein left" with a bar. ✔ |
| Macro display | Carbs, fat and fibre near the top, usually as three small bars or rings. MFP was punished for hiding them [5][18]. | Carbs, fat and fibre are in a panel **below all five slots**, a long scroll down (`05b-day-logged-full`). ✘ |
| Search | Typo-tolerant, instant, with recents first [1]. | Instant (<20 ms), recents first, Urdu and Spanish names. Some fuzzy junk (Bilal's fix 7). ~ |
| Portions | Grams always available, plus a typical serving [2]. HealthifyMe uses katoris [21]. | Drawn katori, plate and cup chips, ½ 1 1½ 2, grams, a typed quantity. Better than all of them. ✔ |
| Empty states | One friendly empty state with the next action. | Five separate "Nothing yet" lines, plus copy buttons at the bottom. ~ |
| Onboarding | Short quiz, then targets, then a skip option (Lose It! is long) [11]. | 10 actions, with a Skip and an "Estimate" label. ✔ |
| Colour | One brand accent plus a nutrient colour code. Calm about going over (MacroFactor) [2]. | Warm cream, clay and ink, nutrient colours, no red. ✔ (and our own) |
| Type | System font, very large tabular numbers for the totals. | System font and a large total. The numbers are not tabular (digits shift as they change). ~ |
| Icons | Icon plus label in the tab bar (HIG, M3) [23][25]. | **Text-only tabs.** Our own icon set (katori, plate, box…) is used only inside the sheets. ✘ |
| Motion | Rings fill, sheets slide, small confirmations on add. | Sheets and toast animate. The bars jump and a one-tap add gives no feedback on the row. ~ |
| Dark mode | Follow the system. Raised surfaces are lighter than the base [24]. | Follows the system (the Profile override defaults to "System", as HIG asks), raised cards are lighter, all text is at least 4.7:1. Small faint text is 5.2:1 (light) and 6.4:1 (dark), under Apple's 7:1 goal. ~ |
| Recipes and meal prep | Recipe = ingredients ÷ servings (MacroFactor, MFP, Yazio) [3][16]. Nobody tracks boxes left, fridge or freezer, or use-by dates **[from memory, not found in any source]**. | Batch → boxes → fridge or freezer → place on days → appears as planned on the Day view. Unique. With Lena's `prep.css` it now looks like the rest of the app. A few details are open (§5). ✔ |

---

## 3. Katori today against the leaders

**Where we are already better**
- **Desi food, properly:** Urdu names under every food, a Home-made / Restaurant / Dhaba switch with
  visible kcal changes, and katori, plate, cup and roti drawings in the picker
  (`light-07-portion-picker`). HealthifyMe has katoris but not the variants or the drawings.
- **Halal status** on every food, with a reason one tap away and a "Halal only" filter. None of the
  seven apps do this.
- **Madrid slots and planning:** Breakfast / café, Lunch, Merienda, Dinner, Snacks. Planned and
  eaten foods are counted separately, which only MacroFactor-style tools come close to.
- **Honest sources:** an "estimate" chip, A/B/C grades and a source panel, at least Cronometer's
  level of trust, without its density.
- **No account, ads or paywall,** and no red "over". This is the opposite of what MyFitnessPal users
  are angry about [5].
- **Meal prep as boxes,** with use-by dates and Fill Mon–Thu. I found no leader that does this.

**Where we look or feel worse**
1. **Macros are a long scroll down.** Carbs, fat and fibre sit under the last slot. The leaders put
   them under the big number.
2. **Text-only tab bar.** It looks unfinished next to every app on the phone, and HIG and M3 both
   pair an icon with a label.
3. **Two "Add" buttons on the Day view.** The big "Add food" covers content at 360 px (Bilal's fix
   6) and duplicates the slot buttons, the same flaw the Lifesum critique finds [18].
4. **Long food names and portion labels.** "Chai, doodh patti (home), 1 tsp sugar" and "small
   katori, edible part" take two lines each, so rows look heavy. The leaders show a short name, with
   detail in a grey second line.
5. **Prep screen:** on the first pass it used grey browser buttons and bullet lists. Lena's
   `prep.css` has since fixed most of it. What is left is listed in section 5.
6. **A weak identity.** "Katori" is plain clay text. There is no mark, and nothing on the screen says
   "this is the katori app" until you open the picker.
7. **No feedback on a one-tap add.** The "+" in the sheet adds silently apart from the toast, while
   the leaders tick the row or pulse the total.

---

## 4. Recommendation

### Option A: keep the current design
The bones are right: one-screen day, big "left", fast add, katori portions, calm colours. But the
seven gaps above are visible in the first ten seconds and make us look less finished than the
leaders. **Not recommended.**

### Option B: refine it (my pick)
Keep the structure and fix what the leaders do better. Ranked by impact per effort:

| # | Change | Why (evidence) | Effort | Files |
|---|---|---|---|---|
| 1 | **Finish the Prep screens in the same system** as the Day view (see §5). | It is the Sprint 2 headline. `prep.css` already covers most of it, and the rest is small. | S (Lena, now) | `app/ui/views/prep.js`, `app/ui/components/prep-bits.js`, `app/styles/prep.css` |
| 2 | **Macro strip under the big number:** three thin bars for carbs, fat and fibre, with "g left", in the sticky totals bar. Tap to open the full panel. The bottom panel stays for the "Estimate" note. | Leaders show macros at a glance. MFP was punished for hiding them [5]. Cronometer users ask for "left" [9]. | S–M | `app/ui/components/totals-bar.js`, `app/styles/views.css` |
| 3 | **Icons plus labels in the tab bar**, drawn in our own style (a katori for Day, a calendar for Week, a box for Prep, a person for Profile, a folder for Data), with a filled active state and an indicator pill. | HIG [23], M3 [25]. The cheapest way to look native. | S | `app/main.js` (Lena's: `renderShell`), `app/ui/components/icons.js`, `app/styles/base.css` |
| 4 | **One add entry point:** drop the floating "Add food" on the Day view. Keep the slot "Add" buttons, and put a slim "Search foods" field at the top of the Day view that opens the sheet on the current slot. | Duplicated "+" [18], Bilal's fix 6. MacroFactor's search is one tap from every screen [1]. | S | `app/ui/views/day.js`, `app/styles/views.css` (Kenji: the `add-food` test id moves) |
| 5 | **Shorter names and portion labels:** a short display name (alias) in rows, with detail in the grey line. Portion chips read "katori" with "160 g" under it, and "edible part" moves into the details. | Rows are heavy (section 3, gap 4). | S (UI) + S (Lab adds short names) | `app/ui/components/entry-row.js`, `app/ui/components/portion-picker.js`, `app/ui/components/format.js`, Lab data (Yusuf/Zainab) |
| 6 | **Feedback and motion:** a tick on the row after a "+" add, bars that animate to their new width, all under `prefers-reduced-motion`. | Leaders confirm every add. With only a toast, it is easy to tap "+" twice and not notice. | S | `app/ui/components/add-sheet.js`, `app/styles/base.css` |
| 7 | **Tabular numbers and contrast:** `font-variant-numeric: tabular-nums` on every figure, and darken `--text-faint` to about 7:1 for 13 px captions. | HIG asks 7:1 for small text [24]. Stops numbers jumping. | S | `app/styles/tokens.css`, `app/styles/base.css` |
| 8 | **One friendly empty day:** if the day is empty, show one card ("Nothing logged yet. Copy yesterday / Copy a day / Search") and keep the slots compact. | Leaders lead with the next action. | S | `app/ui/views/day.js`, `app/ui/components/slot-section.js` |
| 9 | **A small identity:** an original katori mark beside the wordmark (our own drawing from `icons.js`), and the same katori used once as an illustration in onboarding and empty states. Not a Lifesum-style illustration set, just one warm motif. | Lifesum shows warmth sells [17]. We have the motif already. | S | `app/main.js` (Lena's), `app/ui/views/welcome.js`, `app/ui/components/icons.js` |

**Effort:** items 2–9 are about **3–4 working days for me**, plus Kenji updating a few selectors
(items 4 and 5) and the Lab adding short names. Item 1 is Lena's and belongs inside Sprint 2. No
item changes the store, the data model or the Artifact rules.

### Option C: change direction
The two real alternatives are a **timeline instead of slots** (MacroFactor) or a **ring dashboard
with a food score** (Lifesum). I do not recommend either. Slots carry the Madrid day (merienda),
planned-versus-eaten and meal-prep placement, which a timeline loses. A ring hides protein, the
Boss's main number. A food score contradicts our "inform, never judge" rule [20]. A redirect would
cost a sprint and repeat MyFitnessPal's 2026 mistake [5].

---

## 5. What should change in Lena's Sprint 2 meal-prep screens now

Seen in `*-09-prep`, `*-11-cook-dialog`, `*-12-batch-card`, `*-13-batch-filled` and
`*-14-day-with-box`, light and dark. I took them again after Lena's `prep.css` landed.

**Already fixed by `prep.css` (no action):** the Fridge / Freezer segmented control, no bullets,
two-line day chips ("Mon" over "19"), the big "4 of 4 left", library rows with a grey kcal and
protein line and a Cook button, and the joined-up text ("Halal1 box", "Today18"). It now looks like
the same app as the Day view, in both themes.

**Still worth changing now:**

1. **Show halal as our halal chip** (`food-bits.js` `halalChip`) on the batch card and in the cook
   dialog, not the plain word "Halal". The chip is how every other screen says halal.
2. **Shorter box rows.** Each box takes three or four lines ("Lunch, Tomorrow, Mon, 19 Oct" / "Use
   by Tomorrow, Mon, 19 Oct"). Use one line for the day and one for storage: "Lunch · Mon 19 Oct" and
   "Eat by Mon 19 Oct" or "In the freezer". Four boxes then fit on one screen.
3. **Calm, consistent date words:** "tomorrow" in lowercase mid-sentence, and the same short date
   style as the Day view ("Mon 19 Oct", with no commas).
4. **"Fill Mon–Thu" on one line:** the label wraps at 400 px. Put the dates in the caption under it.
5. **Cooked on:** the native date field shows 10/18/2026 (US order) in Chromium. Show "Today, Sun 18
   Oct" with a "Change" link that opens the date field, so it matches our date style.
6. **"Meal" select next to the day chips:** "Put a box in [Lunch ▾]" works, but it should be our chip
   row (Breakfast / Lunch / Dinner) so the whole placing flow is taps, not a native drop-down.

None of this changes Lena's logic. It is markup and CSS only, and I can pair on it if Omar wants.

---

## Questions for Bilal (from my report, not waiting on him)

From his review 1 he likes our speed, desi names and copy-day, and misses MyFitnessPal's database
size, Cronometer's micronutrients and MacroFactor's weight trend. For Meeting 004 I would like to
hear: (a) which MacroFactor or Cronometer screen he finds the most calm and readable, and why;
(b) whether he wants the macro strip (item 2) to show "left" or "eaten / target"; and (c) what
annoyed him most in HealthifyMe's home screen.

---

## Sources

Read in full with WebFetch unless marked *(search summary)*, which means I saw only the search
engine's summary of the page.

1. MacroFactor, "Is MacroFactor Still the Fastest Food Logger? (2025 FLSI Update)". https://macrofactor.com/fastest-food-logger-2025/
2. MacroFactor on the US App Store (description and reviews). https://apps.apple.com/us/app/macrofactor-macro-tracker/id1553503471
3. MacroFactor Help, "Tips for creating recipes for dishes comprised of multiple servings" *(search summary)*. https://help.macrofactorapp.com/en/articles/223-tips-for-creating-recipes-for-dishes-comprised-of-multiple-servings
4. MacroFactor, "10 MacroFactor Features You Might Have Missed". https://macrofactor.com/10-macrofactor-features/
5. Unstar, "Is MyFitnessPal Premium worth it? (app reviews, 2026)": analysis of 300 recent Play reviews. https://unstar.app/blog/is-myfitnesspal-premium-worth-it-paywall-app-reviews-2026
6. MyFitnessPal team, "Introducing the Brand New Today Tab" (Oct 2025), read through a Reddit mirror *(search summary)*. https://redlib.hackliberty.org/r/Myfitnesspal
7. mwm.ai, "MyFitnessPal v26.16.0 replaces Diary with new UI" *(search summary; the page returned 410, so unverified)*. https://mwm.ai/articles/myfitnesspal-v26-16-0-replaces-diary-with-new-ui-sparking-rating-drop-in-april-2026
8. uxdesign.cc, "UI/UX case study: designing an improved MyFitnessPal experience" (background only, *search summary*). https://uxdesign.cc/ui-ux-case-study-designing-an-improved-myfitnesspal-experience-3492bbe4923c/
9. Cronometer on the US App Store (description, release notes, reviews). https://apps.apple.com/us/app/cronometer-calorie-tracker/id1145935738
10. Cronometer reviews: calorie-trackers.com, promealplan.com, Fortune *(search summary)*. https://www.calorie-trackers.com/reviews/cronometer/ · https://www.promealplan.com/en/blog/cronometer-review-2026 · https://fortune.com/article/cronometer-review/
11. Lose It! reviews and design showcase: calorie-trackers.com, screensdesign.com *(search summary)*. https://calorie-trackers.com/reviews/lose-it/ · https://screensdesign.com/showcase/lose-it-calorie-counter
12. Shacknews, "Lose It! review: Effective but wonky" *(search summary)*. https://www.shacknews.com/cortex/article/1215/lose-it-review-effective-but-wonky
13. Yazio on the US App Store *(search summary)*. https://apps.apple.com/us/app/yazio-calorie-counter-app/id946099227
14. Yazio on Trustpilot *(search summary)*. https://www.trustpilot.com/review/yazio.com?page=7
15. Yazio feature-request board, "Meals" tag *(search summary)*. https://yazioen.featureupvote.com/?tag=Meals
16. GIGA, "Yazio: eigene Rezepte erstellen" *(search summary)*. https://www.giga.de/tipp/yazio-eigene-rezepte-erstellen/
17. calorie-trackers.com, "Lifesum Review 2026". https://calorie-trackers.com/reviews/lifesum/
18. Pratt Institute IxD, "Design Critique – Lifesum (iOS App)". https://ixd.prattsi.org/?p=11002
19. Lifesum, "How to use the Lifesum food, meal and day rating". https://lifesum.com/nutrition-explained/how-to-use-the-lifesum-food-meal-and-day-rating-to-achieve-healthy-habits
20. Kimola, Lifesum App Store feedback report *(search summary)*. https://kimola.com/reports/unlock-insights-with-lifesum-app-feedback-analysis-report-app-store-no-152097
21. YourStory (2012, 2015) on HealthifyMe's database and katori portions; AJuniorVC case study; MediaNews4U on the Alexa skill *(search summary)*. https://yourstory.com/2012/12/healthifyme-an-indian-nutrition-tracker-from-the-people-behind-the-rs100-a-day-experiment · https://yourstory.com/2015/05/healthifyme-funding · https://www.ajuniorvc.com/healthifyme-business-case-study-startup-tech-india-explained-weight-loss · https://www.medianews4u.com/healthifyme-launches-skill-for-amazon-alexa/
22. TechCrunch, "HealthifyMe introduces AI-powered image recognition for Indian food" (2023) *(search summary)*. https://techcrunch.com/2023/09/21/khosla-backed-healthifyme-introduces-ai-powered-image-recognition-for-indian-food
23. Apple Human Interface Guidelines, "Tab bars" (read from Apple's JSON feed; the HTML page is script-only). https://developer.apple.com/design/human-interface-guidelines/tab-bars
24. Apple Human Interface Guidelines, "Dark Mode". https://developer.apple.com/design/human-interface-guidelines/dark-mode
25. Material Components for Android, "Navigation bar" (Material 3) docs. https://github.com/material-components/material-components-android/blob/master/docs/components/BottomNavigation.md
