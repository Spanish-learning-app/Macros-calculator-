# Meeting 005 — Sprint 3 plan

**Date:** 2026-10-15, 18:25 Barcelona · **Chair:** Omar Farooq
**Basis:** Meeting 004 decision D, Review 2 reports, the kickoff and Meeting 002 sprint plans.
Held by the Manager alone to save budget. Leads can reopen any item in their first report.

**Goal:** make Katori a daily habit and finish it. Protein help, Ramadan, a weight trend, lighter
home cooking, then polish and a final audit before delivery.

## Wave 1 (tonight, 3 people at once)

| Owner | Work | Files |
|---|---|---|
| **Ayesha** | Rules and NUTRITION.md sections (one rules version bump) for **(a)** protein nudges, **(b)** Ramadan mode in Barcelona, **(c)** weight trend, **(d)** kam-tel, **(e)** optional `shortName` and `serve`. Then, time permitting, the review backlog (118 records), riskiest first. See the notes below. | `app/data/rules.js`, `docs/NUTRITION.md`, `research/check-foods.mjs`, `research/review/**` |
| **Zainab** | **Kam-tel variants** (`home-light`) of the oily desi home dishes that people cook lighter (karahi, salans, daals with tarka, keema, aloo gosht, bhindi, saag, korma, biryani/pulao), from her own recipe sheets with the oil reduced as Ayesha's rule says. Each variant sits next to its home record (same family). **Short names** (`shortName`) for every Pakistani record whose name is longer than about 22 characters. | `app/data/foods-pk-*.js`, `research/zainab/**` |
| **Lena** | Features that need no new rules: **weight log** (core plus Profile/Week UI, kg/lb, one entry per day, edit/delete, export/import) with the trend line drawn once Ayesha's rule lands (fixture first); a **spare/old box warning on the Day view**; a **first-run choice of meal names** (Pakistani or Spanish) on the welcome screen; **short names** in rows when a food has `shortName`. | `app/**` (not data), `tests/unit/dev/**` |

### Notes for Ayesha's rules

- **(a) Protein nudges:** inform, never judge. When does the app suggest something? For example after lunch with less than 40 % of protein, or at merienda. Which halal, desi and Barcelona foods does it suggest, per slot, and how many grams of protein does each give? Never more than one nudge a day, it can be turned off, and nothing shows when the user is on track.
- **(b) Ramadan mode in Barcelona:** slots are sehri, iftar, after taraweeh and snacks. The day boundary follows the DECISIONS 04:00 rule as written. Fajr and maghrib times are typed in or taken from a small Barcelona table (Ramadan 2027 is about 8 Feb – 9 Mar). There is a `minProteinGAtSehri` and a fluids reminder, and the diabetes and hypo flag note shows. No fatwas.
- **(c) Weight trend:** smoothing (EMA or similar, with parameters), the weekly rate, and when to *suggest* (never auto-apply) a target change, inside the existing rails.
- **(d) Kam-tel:** the `home-light` style, how much oil is removed, how it is cited, and the gate.
- **(e) Fields:** optional `shortName` (at most about 22 characters) and `serve` (already added by Yusuf). Add them to the field table and the gates.

## Wave 2 (after wave 1)

- **Lena:** protein nudges and Ramadan mode in the app, per Ayesha's rules.
- **Yusuf:** the low-cook and budget weeks as one-tap **plans** (Lab data that the app turns into saved meals and batches), plus `shortName` for the meal-prep records. **Javier:** `shortName` for his records.
- **Priya:** accessibility pass (screen reader, keyboard, contrast, 200 % text), performance (first load on a slow phone), and the Week view polish.
- **Kenji:** independent tests for wave 1 and wave 2, and the full e2e suite.

## Wave 3: finish

- **Review 3:** the customer panel tests a full week, including Ramadan mode.
- Fix wave, the final data audit (Ayesha's review backlog at 0), republish, and the **delivery report**.

Budget rule unchanged: at most 3 people at once, fresh agents, short final reports.
