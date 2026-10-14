# Sprint 2 market add-on review (2026-10-14, evening)

**Reviewer:** Dr. Ayesha Siddiqui. **Scope:** Javier's 48 market and ready-to-eat records, Yusuf's 13
breakfast and dinner preps, and the Lab's own raw meats and aromatics. Ledger: `reviewed.mjs`.

## Lab additions (Ayesha, `research/javier/build.mjs`, block "Sprint 2: raw meats and aromatics")

| id | kcal / P per 100 g | Source |
|---|---|---|
| intl-chicken-thigh-raw | 149 / 18.6 | USDA Foundation 2646171 (retail boneless skinless). Spanish labels 127–155 (OFF, Hacendado / Uvesa / Pujante); SR 173627 meat-only 121 |
| intl-chicken-mince-raw | 143 / 17.4 | USDA SR 171116 |
| intl-beef-mince-lean-raw | 176 / 20.0 | USDA SR 174030 (90 % lean), the mince Yusuf's recipes are calculated with |
| intl-beef-cubes-raw | 128 / 21.8 | USDA SR 171206 (chuck for stew, lean and fat) |
| intl-garlic (condiment), intl-ginger, intl-green-chilli, intl-lemon-juice (condiment), intl-coriander-fresh, intl-mint-fresh, intl-parsley-fresh, intl-spinach-frozen | | USDA SR 169230, 169231, 170497, 167747, 169997, 173475, 170416, 169287 (same codes as Yusuf's registry) |

Meats carry `halal` with "Assumes halal meat (from a halal butcher in Spain)."

## Javier (12 checked: the 6 riskiest + seeded 6 of the other 42, seed FNV-1a "katori-s2-market-review" = 438735539)

| Record | Verdict | Notes |
|---|---|---|
| es-garbanzos-cocidos | PASS | USDA 173801 drained (138) agrees with BEDCA 2191 *Garbanzo, en conserva* (133) and CoFID 13-670 (129). The Hacendado label (90) fits per net contents: 400 g drained × ~130 ÷ 570 g = 91. Drained weight 400 g confirmed on the Mercadona page. Add the BEDCA cross-check to the note. |
| es-lentejas-cocidas | PASS | Label values match OFF. Derived fibre 4.9 g agrees with BEDCA 1126 *Lenteja, en conserva* (5.1). Protein sits between BEDCA canned (6.3) and USDA boiled (9.0). |
| med-guacamole | PASS (note) | 155 kcal is right for 95 % avocado: CoFID 14-386 Hass × 0.95 ≈ 162 kcal, F 16.5 (−4 %). The label (203 kcal, C 10.6, fibre 10.7) is not plausible, so the record does not "read low". Replace that sentence with the Hass cross-check. |
| intl-feta | PASS | 1147 kJ = 274 kcal. `check` for cuajo of unstated origin is the rule (NUTRITION §4.6, now explicit). |
| intl-bread-wholemeal-sliced | PASS (note) | The current Mercadona page lists **E-472e and E-471** and wine vinegar. The OFF entry is an older formula (57 % flour, E-481). Name E-472e in the reason. |
| intl-tortilla-wrap-wholewheat | PASS | E 471 confirmed on the label. |
| intl-peas-frozen, intl-courgette | PASS | Exact USDA 170016 / 169291. |
| es-gazpacho-envasado, intl-mackerel-olive-oil, intl-pasta-wholewheat-dry, es-picos-integrales | PASS | Exact match with the OFF labels. Mackerel uses kJ ÷ 4.184 = 305 correctly. |

Minor (Javier): `intl-bread-white` (Sprint 1, `halal`) is the generic USDA loaf. Spanish sliced white bread
usually has E-471/E-472e, as `es-pan-integral` already says. Consider `check` with the same reason.

## Yusuf (all 13 breakfast and dinner preps)

Each was recomputed independently from the `recipes-mealprep.js` lines, using the Lab records for the
named lines and about 300 kcal/100 g for dry spices. With the correct foodIds (below), all 13 are within
±5 % of the stored per-portion kcal and protein.

- **Energy band by slot:** breakfasts are 360–479 kcal with 27–31 g protein and ≥ 6.6 g fibre. Dinners are
  544–688 kcal with 37–46 g protein and ≥ 10 g fibre. All are inside `targetsBySlot`.
- **Portions:** realistic. 2 medium roti (40 g, FNDDS medium) at dinner. 1 roti (40 g) with egg muffins.
  A 60 g large wrap roti. 1 paratha of 67 g (reference 70) or 164 g stuffed. 3 muffins of 100 g.
  Daal palak at 625 g is the heaviest box, but still within the 800 kcal band.
- **Verdict:** all 13 record values PASS (stamped).

**FIX for Yusuf: foodId links in `research/yusuf/build.mjs` (DB map), then rebuild.** The app's
"Cook a batch" recomputes from these ids, and today it reads 5–12 % high on three dinners:

| Ingredient key | Now | Change to | Effect today |
|---|---|---|---|
| beef-mince | intl-beef-mince-raw (85 %, "close") | **intl-beef-mince-lean-raw** (same SR 174030) | keema-matar-roti +8 %, seekh-kebab-roti +9 %, mandonguilles +14 %; lunch boxes keema-matar-rice +12 %, albóndigas +9 %, shami |
| milk-semi | intl-milk-whole | **intl-milk-semi-skimmed** (same EAN) | overnight oats |
| protein-yogurt | intl-skyr (Arla) | **es-yogur-proteinas-natural** (same EAN 8480000212566) | oats, pancakes, aloo-paratha raita, tortilla-skyr box |
| chicken-mince, beef-cubes | name only | intl-chicken-mince-raw, intl-beef-cubes-raw (same USDA codes) | none |
| garlic, ginger, green-chilli, lemon-juice, coriander, mint, parsley, spinach-frozen | name only | intl-garlic, intl-ginger, intl-green-chilli, intl-lemon-juice, intl-coriander-fresh, intl-mint-fresh, intl-parsley-fresh, intl-spinach-frozen (same USDA codes) | none |
| chicken-thigh | name only, SR 173627 (121) | **intl-chicken-thigh-raw**, with the registry code changed to 2646171 (149) | tikka-rice box ≈ +50 kcal/box, pollo-ajillo box ≈ +50 (both stay in the lunch band; pre-approved if each box rises by ≤ 60 kcal) |
| yogurt-greek-light | intl-greek-yogurt (now 0 % nonfat) | name only until Javier adds the Hacendado griego ligero record (EAN 8480000213587) | daal-palak protein +6 g on recompute, shami box |

Optional: chicken-breast is SR 171077 in the registry (120 kcal) but Foundation 2646170 in
intl-chicken-breast-raw (112). Use `src: 'db'` to make them agree.
