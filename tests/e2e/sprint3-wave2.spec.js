// Sprint 3 wave 2 in the browser, on the real Lab data (Meeting 005 / STATUS O3-O13, Lena, Priya, Yusuf, Ayesha):
// weekly plans and ready picks, the halal swap, serve chips, saved-meal totals, the kam-tel line, the where-to-buy
// notes in the shopping list, the Lab's pitch / cost / references in the method sheet, the spare-box "Plan it"
// (a planned entry), the step-mode live region, the Ramadan offsets and day-by-day table, and the Urdu serving names.
// Written from the journals' test ids and the Lab's data contract (ARCHITECTURE 13.1), with expected values taken from
// hand-worked sums or from the data files themselves. Yusuf, Javier and Zainab are rebuilding data in parallel, so
// every data-dependent assertion reads the live data module (structure, not frozen numbers). Owner: Kenji.
// Test ids read: plan-card/-facts/-cost/-batches/-use/-note, ready-row/-pick, halal-swap (data-swap-to), serve-chip,
// saved-meal-row, kamtel-line, shop-note, recipe-about/-pitch/-cost/-references, spare-plan-*, stepper-text/-count/
// -next, ramadan-offsets/-offset-fajr/-offset-maghrib/-table/-day/-day-edit/-day-editor/-day-fajr/-day-maghrib/
// -day-save/-day-reset/-day-cancel, serving-ur.
import { FOODS, RULES } from '../../app/data/index.js';
import RECIPES from '../../app/data/recipes-mealprep.js';
import { PLANS, READY_PICKS } from '../../app/data/plans-mealprep.js';
import { test, expect, seed, setUpDoc, userDoc, setClock, savedDoc, ui } from './_app.js';

const NOON = '2026-10-14T12:00:00+02:00'; // Wednesday 14 Oct 2026, Madrid
const TODAY = '2026-10-14';
const MONDAY = '2026-10-19'; // the Monday after TODAY: the week a plan fills

const foodById = (id) => {
  const f = FOODS.find((x) => x.id === id);
  if (!f) throw new Error(`test data: no food ${id}`);
  return f;
};

async function saved(page, pred, what) {
  let doc = null;
  await expect
    .poll(
      async () => {
        doc = await savedDoc(page);
        try {
          return Boolean(doc && pred(doc));
        } catch {
          return false;
        }
      },
      { message: `${what} is saved` },
    )
    .toBe(true);
  return doc;
}

const openPrep = async (page, doc = userDoc({ settings: { slotPreset: 'spain' } })) => {
  await seed(page, doc);
  await setClock(page, NOON);
  await page.goto('/#/prep');
  await expect(page.getByTestId('library-row').first()).toBeVisible();
};

const euro = (n) => `€${n.toFixed(2)}`;

// ===================================================================== weekly plans

test.describe('weekly plans (Prep)', () => {
  const plan = PLANS[0];
  const card = (page, id = plan.id) => page.locator(`[data-testid="plan-card"][data-plan="${id}"]`);
  // R3 (Mariam #5): the plan's afternoon snacks are Merienda ('evening' in the app), not the Snacks slot.
  const slotOf = (item) => (item.slot === 'snacks' ? 'evening' : item.slot);
  /** The entries of one saved day, [] when none. */
  const entriesOn = (doc, date) => doc.days?.[date]?.entries ?? [];

  test('the Lab ships two plans with numbers a shopper can read', async () => {
    expect(PLANS.length).toBeGreaterThanOrEqual(2);
    for (const p of PLANS) {
      expect(p.days.length, p.id).toBe(5);
      expect(p.tillEur, p.id).toBeGreaterThan(0);
      expect(p.eatenEur, p.id).toBeLessThanOrEqual(p.tillEur);
    }
  });

  test('each plan-card shows its name, average kcal and protein a day, the till price and the hands-on minutes', async ({
    page,
  }) => {
    await openPrep(page);
    await expect(page.getByTestId('plan-card')).toHaveCount(PLANS.length);
    for (const p of PLANS) {
      const c = card(page, p.id);
      await expect(c).toBeVisible();
      await expect(c.getByRole('heading', { name: p.name })).toBeVisible();
      const avg = (k) => Math.round(p.days.reduce((s, d) => s + d[k], 0) / p.days.length);
      const facts = c.getByTestId('plan-facts');
      await expect(facts).toContainText(
        `About ${avg('kcal')} kcal · ${avg('protein')} g protein a day`,
      );
      await expect(c.getByTestId('plan-cost')).toContainText(`${euro(p.tillEur)} at the till`);
      await expect(c.getByTestId('plan-cost')).toContainText(`${euro(p.eatenEur)} of it eaten`);
      await expect(c.getByTestId('plan-cost')).toContainText('prices from');
      await expect(facts).toContainText(`Sunday ${p.sundayMinutes} min hands-on`);
      // The button names the week it fills: Mon 19 to Fri 23 Oct.
      await expect(c.getByTestId('plan-use')).toContainText('Use this week · 19–23 Oct');
      // The batches are folded and list what to make.
      await expect(c.getByTestId('plan-batches').locator('summary')).toContainText(
        `${p.batches.length} batch`,
      );
    }
  });

  test('"Use this week" plans Mon-Fri: a toast "Planned ..." with Undo, planned entries on Monday, a Sunday batch', async ({
    page,
  }) => {
    await openPrep(page);
    await card(page).getByTestId('plan-use').click();
    const toast = ui.undo(page);
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(`Planned ${plan.name}`);
    await expect(toast.getByRole('button', { name: 'Undo' })).toBeVisible();
    // The card says what happened.
    await expect(card(page).getByTestId('plan-note')).toContainText(plan.name);
    await expect(card(page).getByTestId('plan-note')).toContainText('planned Mon–Fri');

    const monday = plan.days[0];
    const doc = await saved(
      page,
      (d) => (d.days?.[MONDAY]?.entries ?? []).length > 0,
      'Monday planned',
    );
    const entries = entriesOn(doc, MONDAY);
    // Every food of the plan's Monday is there once, in the plan's slot, still to be eaten (planned).
    expect(entries.length).toBe(monday.items.length);
    for (const item of monday.items) {
      const hit = entries.filter((e) => e.slot === slotOf(item) && e.foodId === item.foodId);
      expect(hit.length, `${slotOf(item)}: ${item.foodId}`).toBeGreaterThanOrEqual(1);
    }
    expect(new Set(entries.map((e) => e.status))).toEqual(new Set(['planned']));
    // Friday has entries too, and nothing leaked into the weekend or into today.
    expect(entriesOn(doc, '2026-10-23').length).toBe(plan.days[4].items.length);
    expect(entriesOn(doc, '2026-10-24')).toEqual([]);
    expect(entriesOn(doc, TODAY)).toEqual([]);
    // The Sunday batches are cooked (a batch with boxes) and the boxes are placed on the entries.
    expect(doc.batches.length).toBeGreaterThan(0);
    const sundayCount = new Set(
      plan.batches.filter((b) => b.when === 'Sunday' && !b.from).map((b) => b.foodId),
    ).size;
    expect(doc.batches.length).toBeLessThanOrEqual(sundayCount);
    expect(entries.filter((e) => e.boxRef).length).toBeGreaterThan(0);
  });

  test("Monday's Day view shows the planned meals (not ticked), with the plan's foods in their slots", async ({
    page,
  }) => {
    await openPrep(page);
    await card(page).getByTestId('plan-use').click();
    await saved(page, (d) => (d.days?.[MONDAY]?.entries ?? []).length > 0, 'Monday planned');
    await page.goto(`/#/day/${MONDAY}`);
    await expect(ui.dayTitle(page)).toBeVisible();
    const monday = plan.days[0];
    const slots = [...new Set(monday.items.map(slotOf))];
    for (const slot of slots) {
      const n = monday.items.filter((i) => slotOf(i) === slot).length;
      await expect(ui.entries(ui.slot(page, slot))).toHaveCount(n);
    }
    // Nothing from the plan lands in the Snacks slot.
    await expect(ui.entries(ui.slot(page, 'snacks'))).toHaveCount(0);
    // All of them are planned, none eaten.
    const status = await ui
      .entries(page.locator('main'))
      .evaluateAll((els) => els.map((e) => e.dataset.status));
    expect(status.length).toBe(monday.items.length);
    expect(new Set(status)).toEqual(new Set(['planned']));
  });

  test('a meal that already has food is kept: its entry stays, the plan skips that slot and says how many were skipped', async ({
    page,
  }) => {
    const mine = {
      id: 'e-mine',
      slot: 'lunch',
      foodId: 'intl-banana',
      servingId: 'medium',
      qty: 1,
      status: 'planned',
      snapshot: {
        name: 'Banana',
        grams: 118,
        kcal: 105,
        protein: 1.3,
        carbs: 24,
        fat: 0.4,
        fiber: 3,
      },
    };
    const lunchItems = plan.days[0].items.filter((i) => i.slot === 'lunch').length;
    expect(lunchItems, 'test data: the plan has a Monday lunch').toBeGreaterThan(0);
    await openPrep(
      page,
      userDoc({
        settings: { slotPreset: 'spain' },
        days: { [MONDAY]: { date: MONDAY, entries: [mine] } },
      }),
    );
    await card(page).getByTestId('plan-use').click();
    await expect(ui.undo(page)).toContainText(`Planned ${plan.name}`);
    const doc = await saved(
      page,
      (d) => (d.days?.[MONDAY]?.entries ?? []).length > 1,
      'Monday planned around the old lunch',
    );
    const entries = entriesOn(doc, MONDAY);
    const lunch = entries.filter((e) => e.slot === 'lunch');
    expect(
      lunch.map((e) => e.id),
      'the old lunch is the only lunch',
    ).toEqual(['e-mine']);
    expect(entries.length).toBe(plan.days[0].items.length - lunchItems + 1);
    // The note counts the skipped meal(s): at least Monday's lunch.
    const note = card(page).getByTestId('plan-note');
    await expect(note).toContainText('skipped because you already had food there');
    await expect(note).toContainText(/\b[1-9]\d* meals? skipped\b/);
  });

  test('Undo takes the whole plan back: no planned entries, no Sunday batch, the old meal still there', async ({
    page,
  }) => {
    const mine = {
      id: 'e-mine',
      slot: 'lunch',
      foodId: 'intl-banana',
      servingId: 'medium',
      qty: 1,
      status: 'planned',
      snapshot: {
        name: 'Banana',
        grams: 118,
        kcal: 105,
        protein: 1.3,
        carbs: 24,
        fat: 0.4,
        fiber: 3,
      },
    };
    await openPrep(
      page,
      userDoc({
        settings: { slotPreset: 'spain' },
        days: { [MONDAY]: { date: MONDAY, entries: [mine] } },
      }),
    );
    await card(page).getByTestId('plan-use').click();
    await saved(page, (d) => (d.batches ?? []).length > 0, 'a Sunday batch exists');
    await ui.undo(page).getByRole('button', { name: 'Undo' }).click();
    const doc = await saved(page, (d) => (d.batches ?? []).length === 0, 'the batches are gone');
    expect(entriesOn(doc, MONDAY).map((e) => e.id)).toEqual(['e-mine']);
    for (const date of ['2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23'])
      expect(entriesOn(doc, date), date).toEqual([]);
    await expect(ui.undo(page)).toBeHidden();
  });
});

// ===================================================================== ready picks

test.describe('ready picks (Prep)', () => {
  const SLOTS = ['breakfast', 'lunch', 'dinner', 'snacks'].filter((s) => READY_PICKS[s]?.length);

  test('one ready-row per slot with picks, each pick showing its kcal and protein', async ({
    page,
  }) => {
    expect(SLOTS.length, 'test data: ready picks for every meal').toBe(4);
    await openPrep(page);
    await expect(page.getByTestId('ready-row')).toHaveCount(SLOTS.length);
    for (const slot of SLOTS) {
      const row = page.locator(`[data-testid="ready-row"][data-slot="${slot}"]`);
      await expect(row).toBeVisible();
      const picks = row.getByTestId('ready-pick');
      await expect(picks).toHaveCount(READY_PICKS[slot].length);
      for (const [i, pick] of READY_PICKS[slot].entries()) {
        await expect(picks.nth(i)).toContainText(pick.name);
        await expect(picks.nth(i)).toContainText(
          `${Math.round(pick.kcal)} kcal · ${Math.round(pick.protein)} g protein`,
        );
      }
    }
  });

  test("one tap on a lunch pick adds its foods to today's lunch, with an Undo that takes them out again", async ({
    page,
  }) => {
    await openPrep(page);
    const pick = READY_PICKS.lunch[0];
    await page
      .locator('[data-testid="ready-row"][data-slot="lunch"]')
      .getByTestId('ready-pick')
      .first()
      .click();
    const toast = ui.undo(page);
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(`Added ${pick.name}`);
    const doc = await saved(
      page,
      (d) => (d.days?.[TODAY]?.entries ?? []).length === pick.items.length,
      'the pick is on today',
    );
    const entries = doc.days[TODAY].entries;
    expect(entries.map((e) => e.slot)).toEqual(pick.items.map(() => 'lunch'));
    expect(entries.map((e) => e.foodId).sort()).toEqual(pick.items.map((i) => i.foodId).sort());
    // It shows on the Day view.
    await page.goto('/#/day');
    await expect(ui.entries(ui.slot(page, 'lunch'))).toHaveCount(pick.items.length);
    // Undo, on the Prep tab again, empties the day.
    await page.goto('/#/prep');
    await page
      .locator('[data-testid="ready-row"][data-slot="snacks"]')
      .getByTestId('ready-pick')
      .first()
      .click();
    const snack = READY_PICKS.snacks[0];
    await expect(ui.undo(page)).toContainText(`Added ${snack.name}`);
    await ui.undo(page).getByRole('button', { name: 'Undo' }).click();
    const after = await saved(
      page,
      (d) => (d.days?.[TODAY]?.entries ?? []).length === pick.items.length,
      'the snack is undone, the lunch stays',
    );
    expect(after.days[TODAY].entries.every((e) => e.slot === 'lunch')).toBe(true);
  });
});

// ===================================================================== halal swap

test.describe('halal swap (Prep library)', () => {
  const withSwap = RECIPES.filter((r) => r.halalSwap);
  const feta = withSwap.find((r) => /feta/.test(r.foodId));

  test('the Lab names a halal version for the feta salad, and it is a real halal prep', async () => {
    expect(feta, 'test data: a feta recipe with halalSwap').toBeTruthy();
    const alt = foodById(feta.halalSwap);
    expect(alt.halal.status, `${alt.id} halal`).toBe('halal');
    expect(RECIPES.some((r) => r.foodId === alt.id)).toBe(true);
  });

  test('exactly the recipes with a halalSwap in the data show a "Halal swap" link, pointing at the right food', async ({
    page,
  }) => {
    await openPrep(page);
    const links = await page.getByTestId('halal-swap').evaluateAll((els) =>
      els.map((e) => ({
        from: e.closest('[data-testid="library-row"]').dataset.foodId,
        to: e.dataset.swapTo,
      })),
    );
    expect(links.sort((a, b) => a.from.localeCompare(b.from))).toEqual(
      withSwap
        .map((r) => ({ from: r.foodId, to: r.halalSwap }))
        .sort((a, b) => a.from.localeCompare(b.from)),
    );
  });

  test('the link on the feta recipe opens the Burgos version', async ({ page }) => {
    await openPrep(page);
    const row = page.locator(`[data-testid="library-row"][data-food-id="${feta.foodId}"]`);
    const swap = row.getByTestId('halal-swap');
    await expect(swap).toHaveAttribute('data-swap-to', feta.halalSwap);
    const alt = foodById(feta.halalSwap);
    await expect(swap).toContainText('Halal swap');
    await expect(swap).toContainText(alt.shortName ?? alt.name);
    await swap.click();
    const dialog = page.getByTestId('cook-dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(alt.name);
    await expect(dialog).toContainText(/burgos/i);
    await expect(dialog).not.toContainText(/feta/i);
  });
});

// ===================================================================== serve chips, saved meals, kam tel

test.describe('serve chip (Prep library)', () => {
  test('a "Good cold" / "Microwave" / "Hot or cold" chip on exactly the rows the Lab tagged', async ({
    page,
  }) => {
    const WORDS = { cold: 'Good cold', hot: 'Microwave', either: 'Hot or cold' };
    const expected = RECIPES.map((r) => ({
      id: r.foodId,
      serve: foodById(r.foodId).serve ?? r.serve ?? null,
    })).filter((x) => x.serve);
    expect(expected.length, 'test data: the Lab tags lunchbox preps').toBeGreaterThanOrEqual(10);
    expect(new Set(expected.map((x) => x.serve)).size, 'all three words are used').toBe(3);
    await openPrep(page);
    const chips = await page.getByTestId('library-row').evaluateAll((rows) =>
      rows
        .map((r) => ({
          id: r.dataset.foodId,
          serve: r.querySelector('[data-testid="serve-chip"]')?.dataset.serve ?? null,
          text: r.querySelector('[data-testid="serve-chip"]')?.textContent.trim() ?? null,
        }))
        .filter((x) => x.serve),
    );
    expect(chips.map((c) => `${c.id}:${c.serve}`).sort()).toEqual(
      expected.map((c) => `${c.id}:${c.serve}`).sort(),
    );
    for (const c of chips) expect(c.text, c.id).toBe(WORDS[c.serve]);
  });
});

test.describe('saved meals (add sheet)', () => {
  // Hand-worked (M-06): 2 medium bananas = 2 x 118 g = 236 g -> 89 x 2.36 = 210.04 kcal, 1.1 x 2.36 = 2.596 g protein;
  // 3 portions of 10 almonds = 3 x 12 g = 36 g -> 579 x 0.36 = 208.44 kcal, 21.2 x 0.36 = 7.632 g protein.
  // Sum 418.48 kcal -> 418, 10.228 g -> 10.
  const meal = {
    id: 'm-qa',
    name: 'Banana and almonds',
    slot: 'snacks',
    createdAt: '2026-10-01',
    items: [
      { foodId: 'intl-banana', servingId: 'medium', qty: 2 },
      { foodId: 'intl-almonds', servingId: 'ten', qty: 3 },
    ],
  };

  test('a saved-meal-row says how many foods, the kcal and the protein of the whole meal', async ({
    page,
  }) => {
    await seed(page, userDoc({ settings: { slotPreset: 'spain' }, savedMeals: [meal] }));
    await setClock(page, NOON);
    await page.goto('/#/day');
    await ui.addFood(page).click();
    const row = ui.sheet(page).getByTestId('saved-meal-row');
    await expect(row).toHaveCount(1);
    await expect(row).toContainText('Banana and almonds');
    await expect(row).toContainText('2 foods · 418 kcal · 10 g protein');
  });

  test('with calories hidden the line keeps the protein and drops the kcal', async ({ page }) => {
    await seed(
      page,
      userDoc({ settings: { slotPreset: 'spain', hideCalories: true }, savedMeals: [meal] }),
    );
    await setClock(page, NOON);
    await page.goto('/#/day');
    await ui.addFood(page).click();
    const row = ui.sheet(page).getByTestId('saved-meal-row');
    await expect(row).toContainText('2 foods · 10 g protein');
    await expect(row).not.toContainText('kcal');
  });

  test('adding the saved meal puts both foods on the day', async ({ page }) => {
    await seed(page, userDoc({ settings: { slotPreset: 'spain' }, savedMeals: [meal] }));
    await setClock(page, NOON);
    await page.goto('/#/day');
    await ui.addFood(page).click();
    await ui
      .sheet(page)
      .getByTestId('saved-meal-row')
      .getByRole('button', { name: /^Add / })
      .click();
    const doc = await saved(
      page,
      (d) => (d.days?.[TODAY]?.entries ?? []).length === 2,
      'both foods added',
    );
    expect(doc.days[TODAY].entries.map((e) => e.foodId).sort()).toEqual([
      'intl-almonds',
      'intl-banana',
    ]);
  });
});

test.describe('kam tel line', () => {
  const kam = FOODS.filter((f) => f.style === 'home-light');
  const light = foodById('pk-masoor-daal-light');
  // RULES.kamTel.addedFatFraction 0.5 -> "half the oil" (the sentence the Lab's rule produces).
  const SENTENCE = 'Kam tel: made with about half the oil';

  test('the Lab has several kam-tel foods and the rule says half', async () => {
    expect(kam.length).toBeGreaterThanOrEqual(10);
    expect(RULES.kamTel.addedFatFraction).toBe(0.5);
  });

  test('the portion picker of a kam-tel food says it in one line; a normal food has none', async ({
    page,
  }) => {
    await seed(page, userDoc({ settings: { slotPreset: 'spain' } }));
    await setClock(page, NOON);
    await page.goto('/#/day');
    await ui.addFood(page).click();
    await ui.search(page).fill('masoor daal');
    await ui.row(ui.results(page), light.id).click();
    const picker = ui.picker(page);
    await expect(picker).toBeVisible();
    await expect(picker.getByTestId('kamtel-line')).toHaveText(SENTENCE);
  });

  test('food details carry the same line, and a home-style food does not', async ({ page }) => {
    await seed(page, userDoc({ settings: { slotPreset: 'spain' } }));
    await setClock(page, NOON);
    await page.goto('/#/day');
    await ui.addFood(page).click();
    await ui.search(page).fill('masoor daal');
    await ui.row(ui.results(page), light.id).click();
    await ui
      .picker(page)
      .getByRole('button', { name: /details/i })
      .first()
      .click();
    await expect(ui.details(page).getByTestId('kamtel-line')).toHaveText(SENTENCE);
  });
});

// ===================================================================== halal shopping guide (STATUS O8)

test.describe('halal shopping guide', () => {
  const guide = RULES.halalGuide;
  const check = foodById('intl-feta');
  const halal = foodById('intl-banana');

  const detailsOf = async (page, food, query) => {
    await seed(page, userDoc({ settings: { slotPreset: 'spain' } }));
    await setClock(page, NOON);
    await page.goto('/#/day');
    await ui.addFood(page).click();
    await ui.search(page).fill(query);
    await ui.row(ui.results(page), food.id).click();
    await ui
      .picker(page)
      .getByRole('button', { name: /details/i })
      .first()
      .click();
    await expect(ui.details(page)).toBeVisible();
  };

  test('the Lab has the guide: four sections, "What Check means" first', async () => {
    expect(guide.sections.map((x) => x.id)).toEqual([
      'katori-check',
      'label-words',
      'how-to-ask',
      'barcelona-shops',
    ]);
    expect(check.halal.status).toBe('check');
    expect(halal.halal.status).toBe('halal');
  });

  test('About has the guide as a card: every section folded, and a section opens to its lines', async ({
    page,
  }) => {
    await seed(page, userDoc({ settings: { slotPreset: 'spain' } }));
    await setClock(page, NOON);
    await page.goto('/#/about');
    const card = page.getByTestId('halal-guide');
    await expect(card).toBeVisible();
    await expect(card.getByRole('heading', { name: guide.title })).toBeVisible();
    const sections = card.getByTestId('halal-guide-section');
    await expect(sections).toHaveCount(guide.sections.length);
    for (const [i, sec] of guide.sections.entries()) {
      const el = sections.nth(i);
      await expect(el).toHaveAttribute('data-section', sec.id);
      await expect(el.locator('summary')).toHaveText(sec.title);
      await expect(el).not.toHaveAttribute('open', /.*/);
    }
    const how = card.locator('[data-section="how-to-ask"]');
    await how.locator('summary').click();
    await expect(how.locator('li')).toHaveCount(guide.sections[2].items.length);
    // A Spanish question is its own span, in Spanish, followed by its English line.
    await expect(how.locator('li').first().locator('span[lang="es"]')).toContainText('¿Lleva');
  });

  test('a Check food shows "What does Check mean?" and it opens the guide at "What Check means"', async ({
    page,
  }) => {
    await detailsOf(page, check, 'feta');
    const btn = ui.details(page).getByTestId('check-guide');
    await expect(btn).toBeVisible();
    await expect(btn).toHaveText('What does Check mean?');
    await btn.click();
    const dlg = page.getByTestId('halal-guide-dialog');
    await expect(dlg).toBeVisible();
    await expect(dlg).toContainText(guide.title);
    const sections = dlg.getByTestId('halal-guide-section');
    await expect(sections).toHaveCount(guide.sections.length);
    await expect(dlg.locator('[data-section="katori-check"]')).toHaveAttribute('open', '');
    for (const id of ['label-words', 'how-to-ask', 'barcelona-shops'])
      await expect(dlg.locator(`[data-section="${id}"]`)).not.toHaveAttribute('open', /.*/);
    await expect(dlg.locator('[data-section="katori-check"] li').first()).toContainText(
      'Check means: read the label or ask',
    );
    // Closing it returns to the food's details (the add in progress is untouched).
    await page.keyboard.press('Escape');
    await expect(dlg).toBeHidden();
    await expect(ui.details(page)).toBeVisible();
  });

  test('a halal food has no guide button in its details', async ({ page }) => {
    await detailsOf(page, halal, 'banana');
    await expect(ui.details(page).getByTestId('check-guide')).toHaveCount(0);
  });
});

// ===================================================================== shopping list: where to buy

test.describe('shopping list (where to buy)', () => {
  // A prep whose ingredients carry a `note` (the Lab's "Pakistani or Moroccan grocery ...").
  const recipe = RECIPES.find((r) => r.ingredients.some((i) => i.note));
  const notes = [...new Set(recipe.ingredients.filter((i) => i.note).map((i) => i.note))];
  const food = foodById(recipe.foodId);
  const batch = {
    id: 'b1',
    recipeId: food.id,
    name: food.name,
    cookedOn: '2026-10-14',
    boxes: [1, 2, 3, 4].map((n) => ({
      id: `b1-${n}`,
      storage: 'fridge',
      movedToFridgeOn: null,
      placed: null,
      status: 'available',
    })),
  };

  test('one shop-note line per place under its section, not repeated on every item', async ({
    page,
  }) => {
    expect(notes.length, 'test data').toBeGreaterThan(0);
    await openPrep(page, userDoc({ settings: { slotPreset: 'spain' }, batches: [batch] }));
    await page.getByTestId('shopping-open').first().click();
    const list = page.getByTestId('shopping-list');
    await expect(list).toBeVisible();
    const lines = list.getByTestId('shop-note');
    await expect(lines.first()).toBeVisible();
    const texts = await lines.allInnerTexts();
    // Each distinct note appears once as "<note>: <names>", with at least one name.
    for (const note of notes) {
      const hit = texts.filter((t) => t.startsWith(`${note}:`));
      expect(hit.length, note).toBe(1);
      expect(hit[0].slice(note.length + 1).trim().length, `${note} has names`).toBeGreaterThan(0);
    }
    // The item lines stay "Name: amount": the note text is not repeated on them.
    for (const note of notes) {
      const items = await list.locator('li').allInnerTexts();
      expect(
        items.filter((t) => t.includes(note)),
        note,
      ).toEqual([]);
    }
  });
});

// ===================================================================== method sheet: about, pitch, cost, references

test.describe("method sheet: the Lab's pitch, cost and references", () => {
  const full = RECIPES.find((r) => r.method && r.pitch && r.cost && r.references?.length);
  const noCost = RECIPES.find((r) => r.method && r.pitch && !r.cost);
  const sheet = async (page, id) => {
    await openPrep(page);
    await page
      .locator(`[data-testid="library-row"][data-food-id="${id}"]`)
      .getByTestId('library-method')
      .click();
    const dialog = page.getByTestId('method-dialog');
    await expect(dialog).toBeVisible();
    return dialog;
  };

  test('pitch, cost per box with the price date and shop, and the folded published recipes', async ({
    page,
  }) => {
    expect(full, 'test data: a recipe with pitch, cost and references').toBeTruthy();
    const dialog = await sheet(page, full.foodId);
    const about = dialog.getByTestId('recipe-about');
    await expect(about).toBeVisible();
    await expect(about.getByTestId('recipe-pitch')).toHaveText(full.pitch);
    const cost = about.getByTestId('recipe-cost');
    await expect(cost).toContainText(`${euro(full.cost.perBoxEur)} a box`);
    await expect(cost).toContainText(`${euro(full.cost.totalEur)} for the batch`);
    await expect(cost).toContainText('prices from');
    if (full.cost.shop) await expect(cost).toContainText(full.cost.shop);
    const refs = about.getByTestId('recipe-references');
    const n = full.references.filter((r) => r.url.startsWith('https://')).length;
    await expect(refs.locator('summary')).toContainText(
      `Based on · ${n} published ${n === 1 ? 'recipe' : 'recipes'}`,
    );
    await refs.locator('summary').click(); // the list is folded until opened
    const links = refs.getByRole('link');
    await expect(links).toHaveCount(n);
    await expect(links.first()).toHaveText(full.references[0].title);
    await expect(links.first()).toHaveAttribute('href', full.references[0].url);
    await expect(links.first()).toHaveAttribute('target', '_blank');
    await expect(links.first()).toHaveAttribute('rel', /noopener/);
  });

  test('a recipe with no price yet shows its pitch and no cost line (nothing invented)', async ({
    page,
  }) => {
    test.skip(!noCost, 'every recipe with a method has a cost now');
    const dialog = await sheet(page, noCost.foodId);
    await expect(dialog.getByTestId('recipe-pitch')).toHaveText(noCost.pitch);
    await expect(dialog.getByTestId('recipe-cost')).toHaveCount(0);
  });

  test('every recipe: the sheet shows exactly the pitch, cost and references that the data has', async ({
    page,
  }) => {
    await openPrep(page);
    // Spot-check four recipes of different kinds (first, middle, last, one without cost).
    const picks = [
      ...new Set(
        [0, Math.floor(RECIPES.length / 2), RECIPES.length - 1, RECIPES.indexOf(noCost)]
          .filter((i) => i >= 0)
          .map((i) => RECIPES[i]),
      ),
    ].filter((r) => r.method);
    for (const r of picks) {
      await page
        .locator(`[data-testid="library-row"][data-food-id="${r.foodId}"]`)
        .getByTestId('library-method')
        .click();
      const dialog = page.getByTestId('method-dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog.getByTestId('recipe-pitch'), `${r.foodId} pitch`).toHaveCount(
        r.pitch ? 1 : 0,
      );
      await expect(dialog.getByTestId('recipe-cost'), `${r.foodId} cost`).toHaveCount(
        r.cost && Number.isFinite(r.cost.perBoxEur) ? 1 : 0,
      );
      await expect(dialog.getByTestId('recipe-references'), `${r.foodId} refs`).toHaveCount(
        r.references?.length ? 1 : 0,
      );
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
    }
  });
});

// ===================================================================== spare box: "Plan it" makes a planned entry

test.describe('spare-box "Plan it" (Day)', () => {
  const recipe = RECIPES.find((r) => r.storage.length === 2 && r.storage.includes('cooked-starch'));
  const food = foodById(recipe.foodId);
  const batch = {
    id: 'b1',
    recipeId: food.id,
    name: food.name,
    cookedOn: '2026-10-13',
    boxes: [
      {
        id: 'b1-1',
        storage: 'fridge',
        movedToFridgeOn: null,
        placed: null,
        status: 'available',
      },
    ],
  };
  const open = async (page, cookedOn = batch.cookedOn) => {
    await seed(
      page,
      userDoc({ settings: { slotPreset: 'spain' }, batches: [{ ...batch, cookedOn }] }),
    );
    await setClock(page, NOON);
    await page.goto('/#/day');
    await expect(ui.dayTitle(page)).toBeVisible();
  };

  test('today: a planned entry (not eaten), the box is "placed" until it is ticked, Undo puts it back', async ({
    page,
  }) => {
    await open(page);
    await page.getByTestId('spare-plan').click();
    await page.getByTestId('spare-plan-today-lunch').click();
    await expect(page.getByTestId('spare-box')).toHaveCount(0);
    const lunch = ui.slot(page, 'lunch');
    await expect(ui.entries(lunch)).toHaveCount(1);
    await expect(ui.entries(lunch)).toHaveAttribute('data-status', 'planned');
    await expect(ui.undo(page)).toContainText(/^Planned /);
    let doc = await saved(page, (d) => d.batches[0].boxes[0].placed?.date === TODAY, 'placed');
    let entry = doc.days[TODAY].entries.find((e) => e.boxRef?.boxId === 'b1-1');
    expect(entry.status).toBe('planned');
    expect(entry.slot).toBe('lunch');
    expect(doc.batches[0].boxes[0].status).toBe('placed');
    // Ticking the entry eats the box.
    await ui
      .entries(lunch)
      .getByRole('button', { name: /as eaten$/ })
      .click();
    doc = await saved(page, (d) => d.batches[0].boxes[0].status === 'eaten', 'box eaten');
    entry = doc.days[TODAY].entries.find((e) => e.boxRef?.boxId === 'b1-1');
    expect(entry.status).toBe('eaten');
  });

  test('Undo of the plan gives the box back to the spare-box line', async ({ page }) => {
    await open(page);
    await page.getByTestId('spare-plan').click();
    await page.getByTestId('spare-plan-today-lunch').click();
    await expect(ui.undo(page)).toBeVisible();
    await ui.undo(page).getByRole('button', { name: 'Undo' }).click();
    await expect(page.getByTestId('spare-box')).toBeVisible();
    const doc = await saved(
      page,
      (d) => d.batches[0].boxes[0].placed === null && d.batches[0].boxes[0].status === 'available',
      'box available again',
    );
    expect(doc.days?.[TODAY]?.entries ?? []).toEqual([]);
  });

  test("tomorrow: also a planned entry, on tomorrow's page", async ({ page }) => {
    // Cooked today, cooked rice keeps 1 day: the last day is tomorrow, so the sheet offers both days.
    await open(page, TODAY);
    await page.getByTestId('spare-plan').click();
    await page.getByTestId('spare-plan-tomorrow-dinner').click();
    const doc = await saved(
      page,
      (d) => d.batches[0].boxes[0].placed?.date === '2026-10-15',
      'placed tomorrow',
    );
    const entry = doc.days['2026-10-15'].entries.find((e) => e.boxRef?.boxId === 'b1-1');
    expect(entry.slot).toBe('dinner');
    expect(entry.status).toBe('planned');
    expect(doc.batches[0].boxes[0].status).toBe('placed');
  });
});

// ===================================================================== step mode: live region

test.describe('step by step: live region', () => {
  const recipe = RECIPES.find(
    (r) => r.method && (r.effort ?? 'cook') === 'cook' && r.method.steps.length >= 4,
  );
  const m = recipe.method;
  const open = async (page) => {
    await openPrep(page);
    await page
      .locator(`[data-testid="library-row"][data-food-id="${recipe.foodId}"]`)
      .getByTestId('library-method')
      .click();
    await page.getByTestId('method-steps-open').click();
    await expect(page.getByTestId('method-stepper')).toBeVisible();
  };

  test('the step text is the polite, atomic live region and begins with a hidden "Step x of n."', async ({
    page,
  }) => {
    await open(page);
    const stepper = page.getByTestId('method-stepper');
    const text = stepper.getByTestId('stepper-text');
    await expect(text).toHaveAttribute('aria-live', 'polite');
    await expect(text).toHaveAttribute('aria-atomic', 'true');
    // The visible count is not a second live region (nothing is read twice).
    const count = stepper.getByTestId('stepper-count');
    await expect(count).not.toHaveAttribute('aria-live', /./);
    expect(
      await count.evaluate((el) => Boolean(el.closest('[aria-live]:not([aria-live="off"])'))),
      'the count sits outside every live region',
    ).toBe(false);
    const n = m.steps.length;
    await stepper.getByTestId('stepper-next').click(); // Step 1
    await stepper.getByTestId('stepper-next').click(); // Step 2
    await expect(count).toHaveText(`Step 2 of ${n}`);
    await expect(text).toContainText(m.steps[1].text);
    // The first thing in the text is "Step 2 of n." in a visually hidden span: it is announced with the step.
    expect((await text.innerText()).includes('Step 2 of')).toBe(true);
    const lead = await text.evaluate((el) => {
      const first = el.querySelector('.sr-only, .visually-hidden');
      const box = first?.getBoundingClientRect();
      return {
        said: first?.textContent.trim() ?? null,
        // visually hidden: 1 px or clipped, never a visible block
        tiny: box ? box.width <= 2 && box.height <= 2 : false,
        text: el.textContent.trim().slice(0, 14),
      };
    });
    expect(lead.said).toBe(`Step 2 of ${n}.`);
    expect(lead.tiny, 'the lead-in is visually hidden').toBe(true);
    expect(lead.text.startsWith(`Step 2 of ${n}.`)).toBe(true);
  });

  test('the Next button says "Next step", and "Done, close step by step" on the last screen', async ({
    page,
  }) => {
    await open(page);
    const stepper = page.getByTestId('method-stepper');
    const next = stepper.getByTestId('stepper-next');
    await expect(next).toHaveAttribute('aria-label', 'Next step');
    await expect(next).toHaveText('Next');
    for (let i = 0; i < m.steps.length + 1; i++) await next.click();
    await expect(stepper.getByTestId('stepper-count')).toHaveText('Finish');
    await expect(next).toHaveAttribute('aria-label', 'Done, close step by step');
    await expect(next).toHaveText('Done');
    // The dialog's description points at the step body (screen 1 is read on open).
    const describedBy = await stepper.evaluate(
      (el) => el.closest('[aria-describedby]')?.getAttribute('aria-describedby') ?? null,
    );
    expect(describedBy).toBeTruthy();
  });

  test('focus stays on the button that was pressed, and on the first screen Back is disabled', async ({
    page,
  }) => {
    await open(page);
    const stepper = page.getByTestId('method-stepper');
    await expect(stepper.getByTestId('stepper-back')).toBeDisabled();
    await stepper.getByTestId('stepper-next').click();
    await expect(stepper.getByTestId('stepper-next')).toBeFocused();
    await stepper.getByTestId('stepper-next').click();
    await stepper.getByTestId('stepper-back').click();
    await expect(stepper.getByTestId('stepper-back')).toBeFocused();
  });
});

// ===================================================================== Ramadan: offsets and the day table

test.describe('Ramadan offsets and day-by-day table (Profile)', () => {
  // Ramadan 2027 starts (expected) on Mon 8 Feb; the clock is Wed 10 Feb 2027 12:00 in Madrid (CET, UTC+1).
  const START = '2027-02-08';
  const TODAY_R = '2027-02-10';
  const CLOCK = '2027-02-10T12:00:00+01:00';
  const rows = RULES.ramadan.timetables.barcelona2027.rows; // [date, fajr, maghrib]
  const table = Object.fromEntries(rows.map(([d, f, m]) => [d, { fajr: f, maghrib: m }]));
  /** 'HH:MM' + n minutes. */
  const shift = (hhmm, n) => {
    const [h, m] = hhmm.split(':').map(Number);
    const t = h * 60 + m + n;
    return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
  };

  const open = async (page, ramadanMode = { on: true, startDate: START }) => {
    await seed(page, setUpDoc({ settings: { slotPreset: 'spain', ramadanMode } }));
    await setClock(page, CLOCK);
    await page.goto('/#/profile');
    await expect(page.getByTestId('ramadan-card')).toBeVisible();
  };
  const day = (page, date) => page.locator(`[data-testid="ramadan-day"][data-date="${date}"]`);
  /** The Fajr and Maghrib cells of one table row, as text. */
  const times = async (page, date) => {
    const cells = await day(page, date).locator('td').allInnerTexts();
    // cells: [n, fajr, maghrib, edit]; the screen-reader suffix " (your time)" is part of innerText only if shown
    return {
      fajr: cells[1].replace(/\s*\(your time\)/, '').trim(),
      maghrib: cells[2].replace(/\s*\(your time\)/, '').trim(),
    };
  };
  const openTable = async (page) => {
    await page.getByTestId('ramadan-table').locator('summary').click();
    await expect(day(page, START)).toBeVisible();
  };

  test('the data: the table covers the 30 fasting days from 8 Feb 2027 (checked against RULES)', async () => {
    expect(table['2027-02-08']).toEqual({ fajr: '06:22', maghrib: '18:16' });
    expect(table['2027-03-09']).toEqual({ fajr: '05:42', maghrib: '18:51' });
    expect(RULES.ramadan.userEdit).toEqual({
      offsetMinRange: { min: -30, max: 30 },
      perDayOverride: true,
    });
  });

  test('the table is folded, lists 30 days with today marked, and shows the built-in times', async ({
    page,
  }) => {
    await open(page);
    const fold = page.getByTestId('ramadan-table');
    await expect(fold).toBeVisible();
    await expect(fold.locator('summary')).toContainText('Day-by-day times · 30 days');
    expect(await fold.evaluate((el) => el.open)).toBe(false);
    await openTable(page);
    await expect(page.getByTestId('ramadan-day')).toHaveCount(30);
    expect(
      await page
        .getByTestId('ramadan-day')
        .evaluateAll((els) => [els[0].dataset.date, els.at(-1).dataset.date]),
    ).toEqual([START, '2027-03-09']);
    // Today (10 Feb) is the only row marked aria-current="date".
    await expect(page.locator('[data-testid="ramadan-day"][aria-current="date"]')).toHaveCount(1);
    await expect(day(page, TODAY_R)).toHaveAttribute('aria-current', 'date');
    // Built-in times for three days (RULES rows).
    for (const date of [START, TODAY_R, '2027-03-09'])
      expect(await times(page, date), date).toEqual(table[date]);
  });

  test('the offsets: 15 min later at fajr and 10 min earlier at maghrib move every day, and are saved', async ({
    page,
  }) => {
    await open(page);
    const box = page.getByTestId('ramadan-offsets');
    await expect(box).toBeVisible();
    // The selects run from 30 min earlier to 30 min later, "Same as the table" selected.
    const fajr = box.getByTestId('ramadan-offset-fajr');
    const maghrib = box.getByTestId('ramadan-offset-maghrib');
    await expect(fajr.locator('option')).toHaveCount(61);
    expect(
      await fajr.locator('option').evaluateAll((os) => [os[0].value, os.at(-1).value]),
    ).toEqual(['-30', '30']);
    await expect(fajr.locator('option:checked')).toHaveText('Same as the table');
    await fajr.selectOption('15');
    await maghrib.selectOption('-10');
    await expect(fajr.locator('option:checked')).toHaveText('15 min later');
    await expect(maghrib.locator('option:checked')).toHaveText('10 min earlier');
    const doc = await saved(
      page,
      (d) =>
        d.settings.ramadanMode?.fajrOffsetMin === 15 &&
        d.settings.ramadanMode?.maghribOffsetMin === -10,
      'offsets stored',
    );
    expect(doc.settings.ramadanMode.on).toBe(true);
    expect(doc.settings.ramadanMode.startDate).toBe(START);
    await openTable(page);
    for (const date of [START, TODAY_R, '2027-03-09'])
      expect(await times(page, date), date).toEqual({
        fajr: shift(table[date].fajr, 15),
        maghrib: shift(table[date].maghrib, -10),
      });
    // The stored offsets survive a reload.
    await page.reload();
    await expect(page.getByTestId('ramadan-offset-fajr')).toHaveValue('15');
    await expect(page.getByTestId('ramadan-offset-maghrib')).toHaveValue('-10');
  });

  test('one day can be changed: the pencil opens an editor, Save keeps it, other days stay on the table, a (your time) mark appears', async ({
    page,
  }) => {
    await open(page);
    await openTable(page);
    const date = '2027-02-12';
    const edit = page.locator(`[data-testid="ramadan-day-edit"][data-date="${date}"]`);
    await expect(edit).toHaveAttribute('aria-expanded', 'false');
    await edit.click();
    await expect(edit).toHaveAttribute('aria-expanded', 'true');
    const editor = page.getByTestId('ramadan-day-editor');
    await expect(editor).toBeVisible();
    // The editor starts from the day's usual times.
    await expect(editor.getByTestId('ramadan-day-fajr')).toHaveValue(table[date].fajr);
    await expect(editor.getByTestId('ramadan-day-maghrib')).toHaveValue(table[date].maghrib);
    // No "usual times" button yet: the day has no times of its own.
    await expect(editor.getByTestId('ramadan-day-reset')).toHaveCount(0);
    await editor.getByTestId('ramadan-day-fajr').fill('06:30');
    await editor.getByTestId('ramadan-day-maghrib').fill('18:40');
    await editor.getByTestId('ramadan-day-save').click();
    await expect(page.getByTestId('ramadan-day-editor')).toHaveCount(0);
    const doc = await saved(
      page,
      (d) => d.settings.ramadanMode?.days?.[date]?.maghrib === '18:40',
      'the day is saved',
    );
    expect(doc.settings.ramadanMode.days).toEqual({ [date]: { fajr: '06:30', maghrib: '18:40' } });
    expect(await times(page, date)).toEqual({ fajr: '06:30', maghrib: '18:40' });
    await expect(day(page, date).locator('.sr-only', { hasText: '(your time)' })).toHaveCount(2);
    await expect(page.getByTestId('ramadan-table').locator('summary')).toContainText('1 changed');
    // Its neighbours are untouched.
    expect(await times(page, '2027-02-11')).toEqual(table['2027-02-11']);
    expect(await times(page, '2027-02-13')).toEqual(table['2027-02-13']);
    // The fold stays open after the save, and the change survives a reload.
    expect(await page.getByTestId('ramadan-table').evaluate((el) => el.open)).toBe(true);
    await page.reload();
    await openTable(page);
    expect(await times(page, date)).toEqual({ fajr: '06:30', maghrib: '18:40' });
  });

  test('a day with its own times offers "Use the usual times", which puts the table (and the offset) back', async ({
    page,
  }) => {
    const date = '2027-02-12';
    await open(page, {
      on: true,
      startDate: START,
      maghribOffsetMin: -10,
      days: { [date]: { fajr: '06:30', maghrib: '18:40' } },
    });
    await openTable(page);
    // The day's own times win over the offset; other days follow the offset.
    expect(await times(page, date)).toEqual({ fajr: '06:30', maghrib: '18:40' });
    expect(await times(page, '2027-02-13')).toEqual({
      fajr: table['2027-02-13'].fajr,
      maghrib: shift(table['2027-02-13'].maghrib, -10),
    });
    await page.locator(`[data-testid="ramadan-day-edit"][data-date="${date}"]`).click();
    const editor = page.getByTestId('ramadan-day-editor');
    await expect(editor.getByTestId('ramadan-day-fajr')).toHaveValue('06:30');
    await editor.getByTestId('ramadan-day-reset').click();
    await expect(page.getByTestId('ramadan-day-editor')).toHaveCount(0);
    const doc = await saved(page, (d) => !d.settings.ramadanMode?.days?.[date], 'day reset');
    expect(doc.settings.ramadanMode.maghribOffsetMin).toBe(-10);
    expect(await times(page, date)).toEqual({
      fajr: table[date].fajr,
      maghrib: shift(table[date].maghrib, -10),
    });
  });

  test('Cancel closes the editor and changes nothing', async ({ page }) => {
    await open(page);
    await openTable(page);
    const date = '2027-02-14';
    await page.locator(`[data-testid="ramadan-day-edit"][data-date="${date}"]`).click();
    await page.getByTestId('ramadan-day-fajr').fill('05:00');
    await page.getByTestId('ramadan-day-cancel').click();
    await expect(page.getByTestId('ramadan-day-editor')).toHaveCount(0);
    expect(await times(page, date)).toEqual(table[date]);
    const doc = await savedDoc(page);
    expect(doc.settings.ramadanMode?.days ?? {}).toEqual({});
  });

  test("a day's own maghrib moves that day's iftar window on the Day view; targets do not change", async ({
    page,
  }) => {
    // Today is the 10th. Its maghrib is typed as 19:30 (table: 18:18): the Ramadan bar must say so.
    await open(page, {
      on: true,
      startDate: START,
      days: { [TODAY_R]: { maghrib: '19:30' } },
    });
    await page.goto('/#/day');
    await expect(ui.dayTitle(page)).toBeVisible();
    const bar = page.getByTestId('ramadan-bar');
    await expect(bar).toBeVisible();
    await expect(bar).toContainText('19:30');
    await expect(bar).not.toContainText(table[TODAY_R].maghrib);
  });
});

// ===================================================================== Urdu serving names

test.describe('Urdu serving names (portion picker)', () => {
  const daal = foodById('pk-moong-daal-home');
  const open = async (page, preset) => {
    await seed(page, userDoc({ settings: { slotPreset: preset } }));
    await setClock(page, NOON);
    await page.goto('/#/day');
    await ui.addFood(page).click();
    await ui.search(page).fill('moong daal');
    await ui.row(ui.results(page), daal.id).click();
    await expect(ui.picker(page)).toBeVisible();
  };

  test("with Pakistani meal names each serving chip shows the Lab's Urdu name, in a right-to-left span", async ({
    page,
  }) => {
    await open(page, 'default');
    const urdu = ui.picker(page).getByTestId('serving-ur');
    const withUr = daal.servings.filter((s) => s.labelUr);
    expect(withUr.length, 'test data: Urdu names on the daal servings').toBeGreaterThanOrEqual(3);
    await expect(urdu).toHaveCount(withUr.length);
    expect(await urdu.allInnerTexts()).toEqual(withUr.map((s) => s.labelUr));
    await expect(urdu.first()).toHaveAttribute('lang', 'ur');
    await expect(urdu.first()).toHaveAttribute('dir', 'rtl');
    // The English name stays on the chip.
    await expect(ui.picker(page).getByText('1 katori', { exact: false }).first()).toBeVisible();
  });

  test('with Spanish meal names the Urdu names are not shown', async ({ page }) => {
    await open(page, 'spain');
    await expect(ui.picker(page).getByTestId('serving-ur')).toHaveCount(0);
  });

  test('with a renamed meal (neither set) the Urdu names are not shown either', async ({
    page,
  }) => {
    await seed(
      page,
      userDoc({ settings: { slotPreset: 'default', slotLabels: { lunch: 'Khana' } } }),
    );
    await setClock(page, NOON);
    await page.goto('/#/day');
    await ui.addFood(page).click();
    await ui.search(page).fill('moong daal');
    await ui.row(ui.results(page), daal.id).click();
    await expect(ui.picker(page)).toBeVisible();
    await expect(ui.picker(page).getByTestId('serving-ur')).toHaveCount(0);
  });
});
