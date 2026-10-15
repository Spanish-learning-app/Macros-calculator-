# Review: S3 variety add-on (alcohol rule and backlog, riskiest first)

**Reviewer:** Dr. Ayesha Siddiqui. **Date:** 2026-10-15 (night). **Rules:** 1.7.1. **Ledger:** `research/review/reviewed.mjs` (+38 ids).

**Scope, riskiest first:**
1. Zainab's 17 kam tel (`home-light`) records, against RULES.kamTel (§6.1).
2. Javier's 24 Sprint 3 base foods (halal statuses first, then his label-versus-USDA choices).
3. Javier's 9 seafood records and Yusuf's preps #26–40, done earlier tonight (`s3-wave1.md`). Re-checked.
4. Yusuf's new preps (#41 onwards): **not reviewed, because they have not landed** (`foods-mealprep.js` still has 40 records).

**Result:** 38 PASS (16 Zainab + 22 Javier), 3 FIX/HOLD (2 Javier, 1 Zainab hold), 0 REJECT. The 24 earlier
passes still hold.

## 1. Alcohol rule (rules 1.7.1, NUTRITION.md §4.6, gate G21)

- **Listed alcoholic ingredient → `not-halal`.** This applies when the label or the standard recipe lists wine,
  mirin, sake, beer or a spirit. The reason names the ingredient, the same way lard is handled. Cooking does not
  change the status.
- **Fermentation trace → `check`.** Brewed soy sauce stays `check`. A soy sauce or tamari with a halal seal is `halal`.
- **Vinegar → `halal`.** This covers wine vinegar and alcohol vinegar.
- **Restaurant dishes** that are sometimes cooked with wine stay `check`.
- **Drinks:** alcoholic drinks still never ship (banned words, G17).
- **G21:** a `not-halal` reason must name the lard or the alcoholic ingredient (`notHalal.reasonMustMention`, which
  Kenji's test gate also reads). A `halal` or `check` reason that says an alcoholic ingredient is listed now fails.
  Examples are "the label lists red wine" and "made with mirin". A reason does not fail when the mention is hedged
  ("often cooked with wine"), negated ("no wine") or vinegar.
- **Scratch test (11 cases):** every case behaves as intended.
- **intl-teriyaki-sauce** is now `not-halal` with the reason "The label lists red wine (vino tinto) as an
  ingredient", plus Javier's swap. I also removed its `slots`, because Kenji's data gate fails a `not-halal` record
  that has slot hints. After the rebuild, only those two lines and the review stamps differ.
- **Also in 1.7.1:** glycerine (*glicerina*, E-422) of unstated origin joins the label `check` list (see the corn
  tortilla below).

## 2. Zainab: 17 kam tel records (16 PASS, 1 HOLD)

**Method:** each record was recomputed independently from its `home` partner:
- removed oil r = 0.5 × home `addedFatPer100g`;
- light value = (home − r) × 100 / (100 − r), with r counted as pure fat at 9 kcal/g.

**Findings:**
- **Numbers:** all 17 agree within ±1 kcal and ±0.1 g for fat, protein, carbs, fibre and added fat.
- **Energy drop:** 11–29 % below the home record.
- **Tarka:** within 1 g per 100 g served on the four tarka dishes (masoor 9.5 g/976 g, moong 7.5/763, chana
  6.5/684, saag 15.5/1555). No record reaches the 2 g floor.
- **Matching fields:** servings, group, tags, halal status, confidence C and method `recipe` match the home record.

| Verdict | Records |
|---|---|
| PASS (16) | karahi, chicken salan, masoor, moong, mash, chana daal, aloo gobi, biryani, pulao, aloo gosht, keema, cholay, anda curry, sarson ka saag, korma, aloo palak |
| HOLD (1) | **pk-bhindi-light.** Its arithmetic is correct, but it is derived from pk-bhindi-home, which still has the Sprint 1 FIX open (oil vs CoFID, +93 %). It will be stamped when the home record is fixed and the light record rebuilt. |

## 3. Javier: 24 Sprint 3 base foods (22 PASS, 2 FIX)

**Method:**
- **USDA values:** compared with the FDC cache. All 10 match exactly.
- **Label values:** compared with the cached Open Food Facts entry for the same EAN, with kcal checked against kJ.
  All 14 match. The OFF kcal typos that Javier caught are real (cheese mix 177 → 351; soy 74 → 65 per 100 ml).
- **Halal statuses:** compared with the cached Mercadona ingredient lists.

**Halal statuses: all 24 are correct except the corn tortilla (FIX 2).**
- Microbial coagulant, so `halal`: fresh mozzarella, grated mozzarella and the 4-cheese mix.
- *Cuajo*, so `check`: Grana Padano and pesto.
- Cheese powder, so `check`: Caesar dressing.
- Sweet whey from cheese-making, so `check`: crema de calabacín. This is consistent with the rennet rule.
- Bocadillo roll: flour, water, yeast and salt only, so `halal`.
- Wine vinegar, so `halal`: salsa mexicana.
- Soy sauce: fermentation trace, so `check`.
- Teriyaki: red wine, so `not-halal` (§1).

**Label versus USDA:**
- **Soy and teriyaki per 100 ml ÷ density:** accepted. Our soy sauce is 60 kcal and Na 5722 mg; USDA shoyu
  174277 is 53 kcal and Na 5493 mg.
- **Black beans restated to 4/4/9/2 (116 kcal):** accepted. USDA boiled black beans 173735 gives 118 kcal with
  our factors.
- **Sweetcorn on USDA:** accepted. The label (75 kcal) is in the same range.

| Id | Verdict | Fix (Javier, via build.mjs) |
|---|---|---|
| intl-quinoa-cooked | **FIX** | Values are home-boiled quinoa (USDA 168917, 120 kcal), but the **default serving is "1 pouch (125 g)"** and the aliases include the Sabroz pouch. The pouch has olive oil and less water. Its OFF macros (P 5.9, C 30, F 3.9, fibre 3.75) agree with its kJ (784 kJ = 187 kcal); only the printed 147 kcal is wrong. A pouch eater is under-counted by 23–36 %. Do one of two things. (a) Make a katori or cup the default, and drop the pouch serving and the pouch aliases from this record. (b) Add a separate pouch record from the label (187 kcal from kJ, B), and move the pouch serving and aliases there. |
| intl-tortilla-corn | **FIX** | (1) **Halal:** the label (OFF 8402001019623) lists **glicerina** (E-422) as a stabiliser, and glycerine can be made from animal fat. Change it to `check`: "lists glycerine (E-422) of unstated origin". The current reason leaves the glycerine out. Then correct the swap note on intl-tortilla-wrap-wholewheat so it points only to the pitta. (2) **Values:** the label is not inconsistent. Its kJ (986.7 = 236 kcal) and its macros (234 by 4/4/9/2) agree; only the printed 204 kcal is a typo. The flour is wholegrain (fibre 7.6 vs USDA 6.3). Use the label (236 kcal, B) and keep USDA 175036 (218) as the cross-check. |
| intl-teriyaki-sauce | PASS (numbers) | I set the status and removed the slots (§1). Nothing is left for Javier. |
| The other 21 | PASS | — |

## 4. Earlier tonight, re-checked

- **Javier's 9 seafood records:** PASS. They were stamped in `s3-wave1.md` and are already applied in his files.
- **Yusuf's preps #26–40:**
  - Recomputed again from the current `recipes-mealprep.js` foodIds. All are within −1 to +7 % for kcal and
    −2 to +5 % for protein. The +7 % on the fruit chaat is a factor difference (see s3-wave1 note 3).
  - Halal and seafood tags follow the ingredients.
  - They are still stamped. The stamps take effect when Yusuf next runs his build.
  - If that rebuild changes any of their numbers by more than 5 %, take the id out of `reviewed.mjs` and send it
    back to me.

## 5. Fixes by owner

- **Javier (build.mjs):**
  1. intl-quinoa-cooked: fix the pouch serving and aliases, or split out a pouch record (above).
  2. intl-tortilla-corn: set it to `check` for glycerine and switch to the label values; correct the swap note on
     the wholewheat wrap.
  3. Optional: add glycerine to the wholewheat wrap's reason (its Mercadona label also lists it).
- **Zainab:**
  1. Rebuild (`node research/zainab/build.mjs`) to apply 16 stamps.
  2. pk-bhindi-light follows pk-bhindi-home's Sprint 1 FIX.
- **Yusuf:**
  1. Rebuild to apply the 15 stamps on #26–40.
  2. Never use intl-teriyaki-sauce in a prep: it is `not-halal`, so the prep would be too, and it would never be
     suggested. Use `soy-sauce-halal` + honey + rice vinegar + ginger.
  3. **His `quinoa-cooked` ingredient** (research/yusuf/ingredients.mjs, used by sheet 49) has the same problem
     as Javier's record. It is the Sabroz pouch costed at USDA home-boiled values (120 kcal/100 g), but the
     pouch is about 187 kcal/100 g. Either cost it from the pouch label (kJ-based, once Javier adds the record),
     or cook quinoa from `intl-quinoa-dry`.
  4. **His `tortilla-corn` ingredient** links to intl-tortilla-corn, which becomes `check` (glycerine). Any prep
     using it will take `check` with that reason, or use the pitta instead.
  5. New preps #41 onwards: review once they land. Sheets 41–51 exist, but no records have been built yet.
- **Kenji:** tests/data/_gate.js still says "must name the lard" in its message. Its check reads
  `reasonMustMention`, so it accepts alcohol reasons. The listed-alcohol check is in check-foods only.
- **Omar:** docs/ARCHITECTURE.md line 122 ("A few not-halal non-meat foods (e.g. ensaïmada)") could mention
  alcohol-ingredient products. This is optional.

## 6. Gate

**check-foods:** 323/323 pass, 0 warnings.

**npm test:** in all three time zones, the only failures are 3 from Lena's in-flight app/core/days.js work. None
of them come from the data.

**G19:** 128 records are awaiting review.
- After Zainab and Yusuf rebuild: 97. That is Javier's 86 older unsampled Sprint 1/2 records and Zainab's 11:
  - 5 open Sprint 1 FIXes: bhindi, haleem ×2, kadhi pakora, ras malai;
  - bhindi-light;
  - 5 not yet sampled: puri, cola, gulab jamun, sheer khurma, pakora.
- Yusuf's new preps will add to G19 when they land.
