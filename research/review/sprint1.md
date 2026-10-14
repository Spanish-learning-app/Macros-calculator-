# Nutrition Lab review: Sprint 1 (all food files)

**Reviewer:** Dr. Ayesha Siddiqui · **Date:** 2026-10-14 (Meeting 003 fix wave)
**Scope:** all nine `app/data/foods-*.js` files, 184 records after this wave (181 delivered by the
researchers + 3 new Lab records). Javier's files were reviewed this morning
([javier-sprint1.md](javier-sprint1.md)); those verdicts are carried over here and their fixes are now
applied.
**Gate:** `node research/check-foods.mjs` passes **184 / 184** (G1–G23). G19 counts 57 records still
under a researcher's name: the unsampled direct records (the sample stands for them) and the 6 FIX
records below.

## Method (NUTRITION.md §9)

1. **Every composite** (`method: recipe`, 91 records): Javier 17, Zainab 62, Yusuf 12. For each I read
   the recipe sheet and checked:
   - the ingredients against their table codes;
   - the added fat against the §6 ranges;
   - the yield method and the energy check;
   - the serving grams and density;
   - the cross-checks.
   Every gap of more than 25% must be explained in the sheet (§6 step 8). Where the sheet only said
   "see note", I wrote the explanation into the record spec's cross-check note, so it is printed in
   the sheet after "Why:".
2. **Every confidence-C or flagged non-composite.** These are falafel plus Javier's 9 flagged records
   (see javier-sprint1.md).
3. **A seeded 20% sample of the rest, across all files.**
   - Pool: all 90 non-recipe records, sorted by id. The 3 records I added this wave are excluded.
   - Shuffle: Fisher–Yates driven by mulberry32, seeded with the FNV-1a hash of
     `"katori-sprint1-review"` (24229694).
   - The first ⌈20%⌉ = **18** were taken.
   - Values were checked as follows: USDA with `node research/usda.mjs get`; CoFID against
     `research/cache/cofid/proximates.tsv`; BEDCA against the cached XML; labels against the cached
     Open Food Facts JSON.
4. **Recording.** Passed and fixed records are listed in `research/review/reviewed.mjs`. All three
   build scripts call `stampReview()`, which sets `source.reviewer: 'ayesha'` and the review date,
   so the stamp survives every rebuild. FIX records keep the researcher's name until they are
   re-checked.

Verdicts:
- **PASS:** matches its source and the rules.
- **PASS (note):** passes, with a non-blocking comment.
- **FIXED:** I fixed it in this wave and re-checked it.
- **FIX → S2:** needs a researcher in Sprint 2; ships as is, not blocking.
- **REJECT:** must not ship.

## Counts

| Set | Reviewed | PASS | FIXED | FIX → S2 | REJECT |
|---|---|---|---|---|---|
| Javier (composites 17, flagged 10, sample 15) | 42 | 39 | 2 | 1 | 0 |
| Zainab composites | 62 | 41 | 16 | 5 | 0 |
| Yusuf lunch boxes | 12 | 11 | 1 | 0 | 0 |
| Seeded sample, all files | 18 | 18 | 0 | 0 | 0 |
| **Total** | **134** (131 records; 3 sample records were also in Javier's sample) | **109** | **19** | **6** | **0** |

No sampled record failed, so no file needs a full re-review (§9 step 3).

## Changes made in this wave (all through the build inputs, then rebuilt)

| Record | Change | Why |
|---|---|---|
| `pk-naan` | 1 naan = 120 g **dough** × baked yield = **98 g** (285 kcal); was 120 g baked (349) | The notified 120 g is the *paira* (dough ball): Karachi's notification fixes "a tandoori naan prepared from 120 grams of paira" (ARY News, 14 Jan 2020). Roghni naan already used dough × yield. Now roghni (89 g, 290 kcal) is heavier than plain (Meeting 003 item 10). |
| `pk-tandoori-roti` | 1 roti = 100 g dough × yield = **83 g** (203 kcal); was 100 g (244) | Same rule (Karachi: "made from 110 grams paira"). |
| `pk-mash-daal-home` | Katori density 1.00 → **0.78 g/ml**: katori 200 → 156 g, **336 → 262 kcal** | Dry bhuna mash has no free liquid. FNDDS 2707424 "Lentils, from dried, fat added", 1 cup = 185 g. Per 100 g (168) matches that FNDDS food to within 1%, so only the katori was wrong. |
| `pk-keema-home` | Katori density 1.00 → **0.85 g/ml**: 472 → 401 kcal; cross-checks added (it had none) | FNDDS 2706396 stewed seasoned ground beef (dry, oily mince stew), 1 cup = 200 g. CoFID 19-587 kheema is wetter (explained). |
| `pk-suji-halwa` | Default katori → **small katori** (171 g, 610 kcal; was 220 g, 785) | A medium katori of halwa is not a usual portion. A sourced halwa-puri portion is needed (S2). |
| `pk-aloo-paratha` | **Released** (it was on hold) | The hold was stale: `bread-fried` has had a minimum of 200 since rules v1.5. +44% vs the analysed mooli paratha is explained: that one was cooked nearly dry; ours has 1 tbsp ghee. |
| `pk-rice-plain` | New **plate** (268 g) and **½ plate** (134 g) servings, labelled "assumed" | Meeting 003 item 5. There is no published served-plate weight, so this is a labelled Lab assumption of 2 medium katori (§5.5, gate G23). |
| `pk-daal-chawal` | Plate labels now say "assumed" | G23. Same 2 + 1 katori plate. |
| `pk-omelette-desi` | State says "about 1½ tsp oil per egg"; numbers unchanged | Recheck: see below. |
| `pk-chai-dhaba-extra-sugar` | `style: 'dhaba'`, `family: 'chai'` | Without a style, search ranked it as everyday chai (Omar/Lena). |
| `pk-moong-daal-home`, `pk-chana-daal-home` | FNDDS cross-checks added (−1%, +2%) | They put the UK survey gaps in context. |
| `pk-fruit-chaat`, `pk-anda-bhurji`, `pk-nihari-home`, `pk-nihari-restaurant`, `pk-shami-kebab`, `pk-chapli-kebab`, `pk-chicken-korma-restaurant` | First cross-check added, with an explanation where the gap is above 25% | §6 step 8 needs at least one independent reference. |
| 18 Zainab sheets | "Why:" explanations for every >25% cross-check gap | §6 step 8. |
| `es-paella-de-pollo` | halal → `check` ("Halal when you cook it with halal chicken. Restaurant chicken in Spain is rarely halal.") | javier-sprint1 fix 1 |
| `es-lentejas` | halal reason: chorizo note | javier-sprint1 fix 2 |
| 7 plain-meat records (`intl-chicken-breast-roasted`, `-raw`, `intl-chicken-thigh-roasted`, `intl-beef-mince-cooked`, `-raw`, `intl-mutton-roasted`, `intl-beef-sausage-halal`) | halal reason "Assumes halal meat (from a halal butcher in Spain)." | javier-sprint1 cross-cutting request 1 |
| `intl-greek-yogurt` | Renamed "nonfat (0%)"; pot label; wrong `dahi` alias removed | javier-sprint1 cross-cutting request 2 |
| **New** `intl-greek-yogurt-whole` | USDA Foundation 2259794 (95 kcal, P 8.8, F 4.4); pot 150 g and 170 g (FNDDS 2705422) | Meeting 003 item 5 |
| **New** `intl-skyr` | Arla Skyr 0% natural spec sheet (EAN 5000181039580): 63 kcal, P 10.6; pot 150 g. Aliases include skyr and yogur proteico. Label, B. | Meeting 003 item 5. No skyr in USDA, CoFID or BEDCA. |
| **New** `es-yogur-griego` | BEDCA 2520 (138 kcal, F 10.2, P 6.4); pot 125 g (UCM) | Spanish *griego* is cream-enriched, not strained (javier-sprint1 request 2). |
| `es-tortilla-proteica-skyr-box` | Bare alias `skyr` → `skyr box`, `tortilla skyr` | A "skyr" search found only this 607 kcal box (Mariam M5). It should find the skyr pot. |

### Meeting 003 rechecks (item 10)

- **Roghni vs plain naan.** Per 100 g both records are right: roghni is 326, plain is 291, and
  roghni has more oil. The plain naan serving was wrong (dough weight used as baked weight). Fixed
  above.
- **Desi omelette (147 kcal per egg, 293 for 2 eggs).** It matches its sources.
  - kfoods Lahori omelette: 1½ tbsp oil per 3 eggs. The other two references are richer: TfT uses
    2 tbsp oil + 2 tbsp butter; Food Fusion uses 60 g butter.
  - Per 100 g it is 15% **below** FNDDS 2707200.
  - Per egg it is heavier than a fried egg (106) because it carries about 40 g of onion and tomato
    and about 7 g of oil.
  - No number change. The state now says how much oil is assumed, so a cook who uses less can log
    ¾.
- **Home daal (252–338 kcal per katori).**
  - Masoor (252) is −11% against CoFID's Punjabi masoor and −13% against FNDDS Dal: PASS.
  - Chana (338) is +11% against CoFID 15-641 and +2% against FNDDS lentils with fat: PASS. A thick
    daal at 169 kcal/100 g really is about 340 kcal per full katori.
  - **Mash was wrong** at the katori level (density): it is now 262 kcal.
  - The §6 rule itself was out of date: the home daal fat range is now **4–8%** (was ~3%), because
    every Pakistani recipe and the CoFID Punjabi survey dals sit there.

## Verdicts: Javier (42), carried from javier-sprint1.md

The per-record reasons are in [javier-sprint1.md](javier-sprint1.md).
- **PASS (39):**
  - Composites: es-tortilla-de-patatas, es-garbanzos-con-espinacas, es-gazpacho, es-pan-con-tomate,
    es-pisto, es-croquetas-de-pollo, es-ensalada-mixta, es-cortado, es-cola-cao-con-leche,
    es-bocadillo-de-tortilla, es-bocadillo-de-atun, es-tostada-con-aceite, intl-salad-kachumber,
    intl-raita, med-chicken-shawarma (note: Barcelona dürüm serving in S2).
  - Flagged: intl-beef-sausage-halal (note), pk-rusk (note), pk-marie-biscuit, pk-sooper-biscuit,
    pk-gluco-biscuit, pk-rio-biscuit, intl-guava (note), intl-dates, med-hummus.
  - Sample: intl-bread-white, intl-pistachios, intl-oats-porridge, intl-cucumber,
    intl-chicken-sandwich, intl-burger-beef, intl-butter, es-croissant, intl-fries, intl-kinnow,
    intl-onion, intl-potato-boiled, intl-mutton-roasted, es-lentejas-pardinas-secas, intl-potato-raw.
- **FIXED (2):** es-paella-de-pollo (halal → check), es-lentejas (halal reason). The numbers were
  unchanged and re-checked.
- **FIX → S2 (1):** med-falafel. CoFID 183 kcal at 60% water under-counts shop falafel. Re-source it
  to a dated Spanish ready-falafel label. The Open Food Facts search was down today (it served an
  HTML error page), so this could not be done in this wave.

## Verdicts: Zainab composites (62)

### Breads and rice (10)

| Record | Verdict | Reason |
|---|---|---|
| pk-roti | PASS | IFCT atta + published chapatti moisture (Rasool 2006); +22% vs moister UK chapati and −18% vs oiled US roti, both explained; FNDDS weights. B is right. |
| pk-roti-ghee | PASS | Roti + 1 tsp ghee, arithmetic exact; the ghee amount is a stated assumption (C). |
| pk-tandoori-roti | FIXED | The serving is now dough × yield (above). |
| pk-naan | FIXED | The serving is now dough × yield (above). +2% vs CoFID naan. |
| pk-roghni-naan | PASS (note) | 326/100 g, +14% vs plain naan (more oil). S2: a bazaar roghni-naan weight; shop ones are often bigger than the 120 g home dough ball. |
| pk-paratha-home | PASS | +2% CoFID, +4% FNDDS. |
| pk-paratha-dhaba | PASS | TfT lachha ghee load; +16% vs CoFID. |
| pk-anda-paratha | PASS | −8% vs plain paratha; egg and ghee assumptions stated. |
| pk-aloo-paratha | FIXED | Released; the cross-check gap is explained. 168 g (415 kcal) follows from Food Fusion's 100 g dough ball + filling. |
| pk-daal-chawal | FIXED | Plate labels say "assumed" (G23); it is a weighted blend of two reviewed records. |

### Drinks and sweets (12 composites; the other 4 records are direct or analogue)

| Record | Verdict | Reason |
|---|---|---|
| pk-chai-doodh-patti-0tsp / -1tsp / -2tsp | PASS | Milk, water, tea and sugar arithmetic checked (47 / 53 / 61 kcal per 100 g); B is right. |
| pk-chai-dhaba | PASS | Milk boiled down by a third + 3 tsp sugar: 239 kcal a cup is right for dhaba chai. |
| pk-chai-dhaba-extra-sugar | FIXED | style and family added. |
| pk-chai-kashmiri | PASS | Nuts are left out and the note says so. |
| pk-rooh-afza, pk-rooh-afza-milk | PASS | 2 tbsp syrup per glass (label serving); arithmetic exact. |
| pk-kulfi | PASS (note) | −26% vs CoFID's cream-based kulfi; ours is reduced-milk kulfi. Explained. |
| pk-kheer | PASS | −1% vs UK whole-milk rice pudding; the FNDDS gap (low-fat milk) is explained. |
| pk-suji-halwa | FIXED (→ S2) | Default is now the small katori; +4% vs CoFID semolina halva. S2: a sourced halwa-puri portion. |
| pk-lassi-sweet | PASS | +15% vs thinner UK lassi. |

### Home cooking (24)

| Record | Verdict | Reason |
|---|---|---|
| pk-chicken-karahi-home | PASS (note) | +37% / +85%, explained: a meat-dense bhuna against saucy curries. Added fat 9.9% is inside home 6–10%. Engineering must not show the raw "+85%" to users (Lena's source panel). |
| pk-chicken-salan-home | PASS | −14% / +16%; added fat 5.9% (home range). |
| pk-masoor-daal-home | PASS | −11% CoFID Punjabi masoor, −13% FNDDS. |
| pk-moong-daal-home | FIXED | FNDDS Dal cross-check (−1%) added; the UK survey gap is explained. |
| pk-mash-daal-home | FIXED | Katori density 0.78 (above). |
| pk-chana-daal-home | PASS | +11% CoFID, +2% FNDDS (added). |
| pk-aloo-gobi-home | PASS | +8% / −31%; the second reference is an oilier version (explained). |
| pk-bhindi-home | **FIX → S2** | +93% vs the analysed Leeds bhindi at the **same water**: the gap is oil (F 10.4 vs 4.6 g). Both blogs use ¼ cup oil per lb of okra, but an analysed dish outranks recipe blogs. Zainab: measure or source how much stir-fry oil stays in the pan, or move toward the analysed value. |
| pk-omelette-desi | PASS | Rechecked (above); the state is clarified. |
| pk-fruit-chaat | FIXED | Cross-check added; +36% explained (37% banana + sugar). |
| pk-chicken-biryani-home | PASS | −10% / −25%. |
| pk-chicken-pulao-home | PASS | +22%. |
| pk-aloo-gosht-home | PASS | −40% vs a meat-only curry (explained), +12% FNDDS. |
| pk-keema-home | FIXED | Density 0.85 and two cross-checks (above). |
| pk-nihari-home | FIXED | Cross-check added (−38% vs beef curry; nihari is gravy-heavy, explained). |
| pk-haleem-home | **FIX → S2** | No independent reference anywhere in CoFID or FNDDS. Values are plausible (137). Zainab: find a published haleem analysis or label (e.g. Shan or a frozen haleem label). |
| pk-shami-kebab | FIXED | Cross-check added (−37% vs all-meat kofta; shami is about half chana daal). |
| pk-cholay-home | PASS | +24%. |
| pk-kadhi-pakora | **FIX → S2** | No cross-check. 149 kcal is plausible (pakora oil from CoFID 15-620). Zainab: find a reference. |
| pk-anda-curry | PASS | −9%. |
| pk-sarson-ka-saag | PASS | +1% / −23%. |
| pk-chicken-korma-home | PASS | +44% vs a lean UK korma, explained (Pakistani korma oil, 9.0%). |
| pk-anda-bhurji | FIXED | Cross-check added (+15% vs plain scrambled egg; ours has onion, tomato and oil). |
| pk-aloo-palak | PASS | −3%. |

### Restaurant, dhaba and street (15 composites)

| Record | Verdict | Reason |
|---|---|---|
| pk-chicken-karahi-restaurant | PASS | +80% explained; added fat 17.9% (inside 12–20%). |
| pk-samosa-aloo | PASS | +3% FNDDS fried samosa; the UK retail (baked) gap is explained. |
| pk-chicken-salan-restaurant | PASS | +21%; added fat 12.2%. |
| pk-chana-daal-restaurant | PASS | +22%; added fat 9.9% fits the revised restaurant daal range (8–12%). |
| pk-mutton-karahi-restaurant | PASS (note) | +64% explained. It has no `style`/`family`. S2: add `style: 'restaurant', family: 'mutton-karahi'` so ranking treats it like the other restaurant records. |
| pk-aloo-gosht-restaurant | PASS (note) | −25% / +38%, explained. Added fat 9.2% is below the restaurant salan range (12–20%); acceptable for a potato-heavy dish, conservative. |
| pk-chicken-biryani-restaurant | PASS | +6% vs UK takeaway biryani (10 samples). |
| pk-chicken-pulao-restaurant | PASS | +37% vs plain pilau, explained. |
| pk-nihari-restaurant | FIXED | Cross-check added (−18%). |
| pk-haleem-restaurant | **FIX → S2** | No reference (as haleem home). |
| pk-seekh-kebab | PASS | +21% vs UK shish. |
| pk-chicken-tikka | PASS (note) | 300 kcal per leg is right. The 163 g piece weight keeps some marinade water (a lemon/yogurt marinade dries more than the meat), so g/100 g is slightly diluted; kcal per piece is unaffected. |
| pk-chapli-kebab | FIXED (→ S2) | Cross-check added (−11% vs beef kofta). S2: a "Peshawari (large)" serving with a cited weight; the 56 g piece is TfT's size. |
| pk-chanay-halwa-puri | PASS | +54% vs home Punjabi chickpea curry, explained (street tarka). |
| pk-chicken-korma-restaurant | FIXED | First cross-check added (+61%, restaurant oil, explained). |

## Verdicts: Yusuf lunch boxes (12)

All 12 are computed by `research/yusuf/calc.mjs` from cited ingredient values and dated labels. I
read the chicken tikka rice sheet line by line and checked its box against a hand sum (≈ 650 kcal).
All 12 meet the G22 lunch band and the design targets. Halal reasons are specific, and labels were
checked for E471, gelatine and lard.

| Record | Verdict | Reason |
|---|---|---|
| pk-chicken-tikka-rice-box (650 kcal), pk-keema-matar-rice-box (654), pk-yakhni-chicken-pulao-box (659), pk-shami-kebab-pita-box (702), es-pollo-ajillo-limon-rice-box (601), es-albondigas-tomate-couscous-box (729), med-moroccan-chicken-couscous-box (610), pk-chicken-seekh-tabbouleh-box (593) | PASS | Recipe triangulated from ≥ 2 references; yields from Bognár/USDA; C is right. |
| pk-chicken-chana-chaat-box (567), es-garbanzos-atun-salad-box (560), med-chicken-hummus-pasta-salad-box (618) | PASS | Mostly no-cook assemblies of labelled foods; B is right. |
| es-tortilla-proteica-skyr-box (607) | FIXED | Bare `skyr` alias replaced (above). |

Note for Yusuf (S2): several references were read from search-engine extracts because the site
returned 403. Where a quantity drives the result (oil, rice), confirm it from the page or a second
reference.

## Verdicts: seeded sample (18): all PASS

| Record | Source | Check |
|---|---|---|
| es-cafe-con-leche | BEDCA 681 | exact (158 kJ = 38 kcal) |
| intl-beef-mince-cooked | USDA SR 174034 | exact |
| intl-beef-mince-raw | USDA SR 171796 | exact |
| pk-juice-apple | Label, Frooto (OFF 8966000006621) | exact after ÷ 1.03 g/ml |
| es-napolitana-chocolate | BEDCA 1062 | exact; `check` with lard reason is right |
| intl-dates-medjool | USDA SR 168191 | exact |
| intl-tuna-canned-oil | USDA SR 173708 | exact; seafood-fish tag present |
| es-ensaimada | BEDCA 2671 | exact; `not-halal` (saïm) is right |
| intl-fries | USDA SR 170698 | exact |
| intl-egg-fried | USDA FNDDS 2707158 | exact; 1 egg 55 g |
| pk-sooper-biscuit | Label (OFF 8964002758999) | exact (carbs 66 − 1.3 fibre) |
| pk-rice-plain | CoFID 11-858 | exact (starch ÷ 1.10); plate servings added this wave |
| intl-chicken-sandwich | USDA FNDDS 2706990 | exact |
| intl-mutton-roasted | USDA SR 175304 (goat) | exact |
| intl-ketchup | CoFID 17-709 | exact |
| pk-uht-milk-full-cream | Label, Olper's (OFF 8964000346549) | exact (per 100 g 62.1 / 2.6 / 5.2 / 3.4) |
| intl-whey-protein | Label, ON Gold Standard DRC (OFF) | matches (374 kcal, P 76) |
| intl-burger-zinger | USDA FNDDS 2707003 | exact; B for the analogue is right |

## The 3 new Lab records

`intl-skyr`, `intl-greek-yogurt-whole` and `es-yogur-griego` were written by me, so they carry my
name. Because no one has checked them but me, **Javier should second-check them in Sprint 2**
(source values, pot weights, aliases).

## For Sprint 2 (researchers, through Omar)

| # | Who | Item |
|---|---|---|
| 1 | Javier | med-falafel: re-source to a dated Spanish ready-falafel label (OFF was down today). |
| 2 | Javier | Second-check intl-skyr, intl-greek-yogurt-whole and es-yogur-griego. Add a Barcelona supermarket skyr label (Lidl or Carrefour own brand) as a second source. |
| 3 | Zainab | pk-bhindi-home: reconcile the oil with the analysed CoFID 15-627 (+93%). |
| 4 | Zainab | pk-haleem-home, pk-haleem-restaurant, pk-kadhi-pakora, pk-ras-malai: find an independent cross-check (§6 step 8). |
| 5 | Zainab | Sourced portions: halwa at halwa puri; a bazaar roghni naan; a Peshawari chapli kebab. |
| 6 | Zainab | pk-mutton-karahi-restaurant: add style and family. |
| 7 | Zainab | Keep looking for a **published served-plate weight** for rice and biryani (replaces the assumed plate). |
| 8 | Zainab | Halal reasons on Pakistani meat dishes, like Javier's 7 ("Assumes halal meat…"), for users cooking or eating out in Spain. |
| 9 | Yusuf | Confirm the quantities that were read from search-engine extracts. |
| 10 | Kenji | `tests/data/_gate.js` should learn gate **G23** (assumed plate) to match check-foods. |
