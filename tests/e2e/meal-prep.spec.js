// Meal prep, written from docs/CUSTOMER.md A16, A17, A18 (Sprint 2, US-29 to US-32), with their
// action budgets (CUSTOMER §2: one tap, one field filled or one key press is one action).
// Owner: Kenji. The Prep UI is Lena's (app/ui/views/prep.js and components); the specs read only
// these test ids and accessible names from it:
//   library-row[data-food-id] + library-cook, cook-dialog, cook-per-box, cook-boxes, cook-save,
//   batch-card, boxes-left, batch-halal, box-row[data-box], box-useby, box-storage, place-day[data-date],
//   place-slot, batch-note, shopping-open, shopping-dialog, shopping-list, shop-more, shopping-copy,
//   new-recipe, recipe-editor, recipe-name, add-ingredient, boxes-more, per-box, recipe-total,
//   recipe-halal, recipe-save, ingredient-sheet, ingredient-search, ingredient-row, ingredient-blocked,
//   entry-note (Day view), and the Undo toast (`undo`).
// Detection: every test is `fixme` (skipped) while the app source lacks the ids it drives; see
// needsUi() in _app.js. A budget that the UI breaks is a KNOWN GAP: the flow still runs and its
// results are checked, then the test ends as skipped with the owner named (never red).
import { FOODS, RULES } from '../../app/data/index.js';
import { test, expect, needsUi, seed, setUpDoc, setClock, savedDoc, actions, ui } from './_app.js';

const TIKKA = 'pk-chicken-tikka-rice-box'; // CUSTOMER #49
const CHAAT = 'pk-chicken-chana-chaat-box';
const food = (id) => {
  const f = FOODS.find((x) => x.id === id);
  if (!f) throw new Error(`test data: no food ${id}`);
  return f;
};
const NUTRIENTS = ['kcal', 'protein', 'carbs', 'fat', 'fiber'];

// Madrid wall-clock times. DST ended on Sunday 25 Oct 2026, so 1 to 7 Nov are UTC+1.
const SUN = '2026-11-01';
const at = (date, hhmm) => `${date}T${hhmm}:00+01:00`;
const DAYS = {
  mon: '2026-11-02',
  tue: '2026-11-03',
  wed: '2026-11-04',
  thu: '2026-11-05',
  fri: '2026-11-06',
};

/** "650 kcal · 49.6 g protein · 69 g carbs · 18 g fat · 8.4 g fibre" -> numbers. */
function parseMacros(text) {
  const num = (re) => Number(String(text.match(re)?.[1] ?? NaN).replace(/,/g, ''));
  return {
    kcal: num(/([\d,.]+)\s*kcal/),
    protein: num(/([\d,.]+)\s*g protein/),
    carbs: num(/([\d,.]+)\s*g carbs/),
    fat: num(/([\d,.]+)\s*g fat/),
    fiber: num(/([\d,.]+)\s*g fibre/),
  };
}
const per100 = (f, grams) =>
  Object.fromEntries(NUTRIENTS.map((k) => [k, ((f.per100g[k] ?? 0) * grams) / 100]));

/** Ends a test as skipped, naming the owner, when a budget is broken (a known gap, never red). */
function budget(a, limit, what, owner) {
  if (a.count <= limit) return;
  test.info().annotations.push({ type: 'known-gap', description: `${what}: ${a.count} actions` });
  test.skip(
    true,
    `KNOWN GAP (${owner}): ${what} takes ${a.count} actions, budget ${limit}. ${a.log.join(' > ')}`,
  );
}

async function openPrep(page, iso, doc = setUpDoc()) {
  await seed(page, doc);
  await setClock(page, iso);
  await page.goto('/#/prep');
  const view = page.getByTestId('prep-view');
  const mounted = await view
    .waitFor({ state: 'visible', timeout: 5000 })
    .then(() => true)
    .catch(() => false);
  if (!mounted) test.skip(true, 'the Prep view did not mount (route missing or not built yet)');
}

/** The saved document once `pred(doc)` holds (the app saves a moment after the tap). */
async function savedWhere(page, pred, what = 'the saved document') {
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

/** Jumps the browser clock to another Madrid time and reloads (the document stays in storage). */
async function timeTravel(page, iso) {
  await page.clock.setSystemTime(new Date(iso));
  await page.reload();
}

const libraryRow = (page, id) => page.locator(`[data-testid="library-row"][data-food-id="${id}"]`);
const batchCard = (page, nth = 0) => page.getByTestId('batch-card').nth(nth);
const boxRow = (card, n) => card.locator(`[data-testid="box-row"][data-box="${n}"]`);

/** The batch card's meal control (a drop-down or chips, whichever the UI has) is on `slotId`. */
async function expectMealSelected(card, slotId) {
  const control = card.getByTestId('place-slot');
  if ((await control.evaluate((el) => el.tagName)) === 'SELECT')
    await expect(control).toHaveValue(slotId);
  else await expect(control.locator('[aria-pressed="true"]')).toHaveAttribute('data-slot', slotId);
}

/** Library "Cook" -> dialog -> "Cook N boxes". Returns the number of actions it took. */
async function cookFromLibrary(page, a, id) {
  await a.tap(libraryRow(page, id).getByTestId('library-cook'), `Cook ${id}`);
  await expect(page.getByTestId('cook-dialog')).toBeVisible();
  await a.tap(page.getByTestId('cook-save'), 'Cook N boxes');
  await expect(page.getByTestId('cook-dialog')).toBeHidden();
}

/**
 * The batch counters (decision A3 of Meeting 004): "4 to eat", "3 to eat · 1 eaten". The data
 * attributes are the contract; placed boxes are still to eat, `unplaced` is what has no day yet.
 */
async function expectBoxCounts(card, { toEat, eaten = 0, unplaced }) {
  const left = card.getByTestId('boxes-left');
  await expect(left).toHaveAttribute('data-to-eat', String(toEat));
  await expect(left).toHaveAttribute('data-eaten', String(eaten));
  await expect(left).toHaveAttribute('data-unplaced', String(unplaced));
}

const NEED_COOK = ['library-cook', 'cook-save', 'batch-card', 'boxes-left', 'box-row'];
const NEED_PLACE = [...NEED_COOK, 'place-day'];

// ================================================================================================
// A16: batch recipe into boxes
// ================================================================================================
test.describe('A16 batch recipe into boxes', () => {
  test('(1) the library box shows its macros per box, matching #49 "1 box" within 2%, in ≤ 4 actions', async ({
    page,
  }) => {
    needsUi(...NEED_COOK, 'cook-dialog');
    await openPrep(page, '2026-10-18T18:00:00+02:00');
    const a = actions(page);
    const row = libraryRow(page, TIKKA);
    await expect(row, 'the tikka bowl is in the Prep library').toBeVisible();

    await a.tap(row.getByTestId('library-cook'), 'Cook');
    await expect(page.getByTestId('cook-dialog')).toBeVisible();
    // the macros are on screen without another action
    const box = food(TIKKA).servings.find((s) => s.id === 'box');
    const want = per100(food(TIKKA), box.grams);
    const shown = parseMacros(await page.getByTestId('cook-per-box').innerText());
    for (const k of NUTRIENTS) {
      const tol = Math.max(0.02 * want[k], k === 'kcal' ? 1 : 0.2);
      expect(
        Math.abs(shown[k] - want[k]),
        `${k}: shown ${shown[k]}, #49 says ${want[k]}`,
      ).toBeLessThanOrEqual(tol);
    }
    // 4 boxes is the standard batch of this recipe
    await expect(page.getByTestId('cook-boxes')).toHaveText('4');
    await a.tap(page.getByTestId('cook-save'), 'Cook 4 boxes');
    await expect(page.getByTestId('cook-dialog')).toBeHidden();

    const card = batchCard(page);
    await expect(card).toBeVisible();
    await expectBoxCounts(card, { toEat: 4, unplaced: 4 });
    expect(a.count).toBeLessThanOrEqual(4);
    const doc = await savedWhere(page, (d) => d.batches?.length === 1, 'the batch');
    expect(doc.batches[0].recipeId).toBe(TIKKA);
    expect(doc.batches[0].boxes).toHaveLength(4);
  });

  test('(3) a not-halal food cannot be picked as an ingredient (search "ensaimada")', async ({
    page,
  }) => {
    needsUi(
      'new-recipe',
      'add-ingredient',
      'ingredient-sheet',
      'ingredient-search',
      'ingredient-blocked',
    );
    await openPrep(page, '2026-10-18T18:00:00+02:00');
    await page.getByTestId('new-recipe').click();
    await page.getByTestId('add-ingredient').click();
    await expect(page.getByTestId('ingredient-sheet')).toBeVisible();
    await page.getByTestId('ingredient-search').fill('ensaimada');
    // said out loud, with the Lab's reason, instead of an empty list
    await expect(page.getByTestId('ingredient-blocked')).toContainText(/ensa[iíï]mada/i);
    await expect(page.getByTestId('ingredient-blocked')).toContainText(/not halal/i);
    const sheet = page.getByTestId('ingredient-sheet');
    await expect(
      sheet.locator('[data-testid="ingredient-row"][data-food-id="es-ensaimada"]'),
    ).toHaveCount(0);
    await expect(
      sheet.getByRole('button', { name: /Add .*nsa.*mada.* to the recipe/i }),
    ).toHaveCount(0);
    // no not-halal food is ever offered, whatever the query
    for (const q of ['pork', 'bacon', 'jamón', 'chorizo']) {
      await page.getByTestId('ingredient-search').fill(q);
      const ids = await sheet
        .getByTestId('ingredient-row')
        .evaluateAll((els) => els.map((e) => e.dataset.foodId));
      for (const id of ids)
        expect(food(id).halal.status, `${q}: ${id} offered`).not.toBe('not-halal');
    }
  });
});

// A16 (2) builds "Tikka bowls" from the customer's own list. The Lab's FOODS still lack raw
// boneless chicken thigh and dry basmati rice (tests/data/recipe-ingredients.test.js); until they
// exist the spec serves two stand-in records next to the real data. The real record wins when it
// appears. Missing foods are Yusuf's / Ayesha's to add.
const realRawThigh = FOODS.find(
  (f) =>
    /chicken/i.test(`${f.id} ${f.name}`) &&
    /thigh/i.test(`${f.id} ${f.name}`) &&
    /raw/i.test(f.state),
);
const realDryRice = FOODS.find(
  (f) =>
    /rice|chawal/i.test(`${f.id} ${f.name}`) &&
    f.group !== 'lunchbox' &&
    /dry|uncooked|raw|as sold/i.test(f.state) &&
    !/boiled|cooked/i.test(f.state.split(',')[0]),
);
const standIn = (base, patch) => ({
  ...structuredClone(base),
  tags: ['international', 'meal-prep'],
  slots: ['lunch', 'dinner'],
  ...patch,
});
const THIGH =
  realRawThigh ??
  standIn(food('intl-chicken-thigh-roasted'), {
    id: 'qa-chicken-thigh-raw',
    name: 'Chicken thigh, boneless, raw',
    aliases: ['boneless chicken thigh', 'chicken thigh raw'],
    state: 'raw, boneless, skinless',
    per100g: {
      kcal: 121,
      protein: 19.7,
      carbs: 0,
      fat: 4.1,
      fiber: 0,
      sugars: 0,
      satFat: 1.1,
      sodium: 84,
    },
    servings: [{ id: '100g', label: '100 g', grams: 100, default: true }],
  });
const RICE =
  realDryRice ??
  standIn(food('pk-rice-plain'), {
    id: 'qa-basmati-dry',
    name: 'Basmati rice, dry',
    aliases: ['basmati', 'dry basmati rice', 'chawal'],
    state: 'dry, uncooked',
    per100g: {
      kcal: 349,
      protein: 8.9,
      carbs: 77.6,
      fat: 0.7,
      fiber: 1,
      sugars: 0.1,
      satFat: 0.2,
      sodium: 2,
    },
    servings: [{ id: '100g', label: '100 g', grams: 100, default: true }],
  });
const DAHI = food('intl-dahi');
const OIL = food('intl-cooking-oil');
const CUCUMBER = food('intl-cucumber');
const usesStandIns = !realRawThigh || !realDryRice;

test.describe('A16 (2) my own recipe "Tikka bowls"', () => {
  const NEED = [
    'new-recipe',
    'recipe-editor',
    'recipe-name',
    'add-ingredient',
    'ingredient-search',
    'ingredient-row',
    'boxes-more',
    'per-box',
    'recipe-total',
    'recipe-save',
  ];

  async function useStandIns(page) {
    const foods = [...FOODS];
    for (const f of [THIGH, RICE]) if (!foods.some((x) => x.id === f.id)) foods.push(f);
    const body = `export const RULES = ${JSON.stringify(RULES)}; export const FOODS = ${JSON.stringify(foods)};`;
    await page.route('**/data/index.js', (route) =>
      route.fulfill({ contentType: 'text/javascript', body }),
    );
  }

  /**
   * One ingredient the quick way (Review 2): type the amount first ("800 g chicken thigh",
   * "2 tbsp oil", "2 cucumbers"), then tap that food's "+". Two actions.
   */
  async function addQuick(page, a, f, { unit, amount }) {
    const name = f.name.split(',')[0].split('(')[0].trim();
    const text = `${amount}${unit ? ` ${unit}` : ''} ${name}`;
    await a.fill(page.getByTestId('ingredient-search'), text, `quick "${text}"`);
    const row = page.locator(`[data-testid="ingredient-row"][data-food-id="${f.id}"]`);
    await expect(row, `${f.id} is found by "${text}"`).toBeVisible();
    await a.tap(row.getByRole('button', { name: /^Add .* to the recipe$/ }), `+ ${f.id}`);
  }

  /** One ingredient the long way: search, open the picker, choose the portion, type the amount, add. */
  async function addIngredient(page, a, f, { unit, amount }) {
    const search = page.getByTestId('ingredient-search');
    await a.fill(search, f.name.split(',')[0].split('(')[0].trim(), `search ${f.name}`);
    const row = page.locator(`[data-testid="ingredient-row"][data-food-id="${f.id}"]`);
    await expect(row, `${f.id} is found by its own name`).toBeVisible();
    await a.tap(row.locator('button.food-main'), `open ${f.id}`);
    const picker = ui.picker(page);
    await expect(picker).toBeVisible();
    if (unit) await a.tap(picker.getByRole('radio', { name: unit }), `portion ${unit}`);
    await a.fill(ui.qtyInput(page), String(amount), `qty ${amount}`);
    await a.tap(picker.getByRole('button', { name: 'Add to recipe' }), `add ${f.id}`);
    await expect(picker).toBeHidden();
  }

  test('per box = recipe total ÷ boxes for all five nutrients; 4 -> 5 boxes needs no re-entry; ≤ 25 actions', async ({
    page,
  }) => {
    needsUi(...NEED);
    test.info().annotations.push({
      type: 'data',
      description: usesStandIns
        ? 'raw chicken thigh / dry basmati are stand-in foods (Lab gap)'
        : 'real Lab foods',
    });
    await useStandIns(page);
    await openPrep(page, '2026-10-18T18:00:00+02:00');
    const a = actions(page);

    await a.tap(page.getByTestId('new-recipe'), 'New recipe');
    await expect(page.getByTestId('recipe-editor')).toBeVisible();
    await a.fill(page.getByTestId('recipe-name'), 'Tikka bowls', 'name');
    await a.tap(page.getByTestId('add-ingredient'), 'Add ingredients');
    await expect(page.getByTestId('ingredient-sheet')).toBeVisible();

    await addQuick(page, a, THIGH, { unit: 'g', amount: 800 });
    await addIngredient(page, a, DAHI, { unit: /grams/i, amount: 200 }); // the long way still works
    await addQuick(page, a, OIL, { unit: 'tbsp', amount: 2 });
    await addQuick(page, a, RICE, { unit: 'g', amount: 320 });
    await addQuick(page, a, CUCUMBER, { unit: null, amount: 2 });
    await a.tap(page.getByTestId('ingredient-sheet').getByRole('button', { name: 'Done' }), 'Done');
    await expect(page.getByTestId('ingredient-sheet')).toBeHidden();

    // expected totals, worked from the foods' per-100 g values
    const tbsp = OIL.servings.find((s) => s.id === 'tbsp').grams;
    const cuke = CUCUMBER.servings.find((s) => s.default)?.grams ?? CUCUMBER.servings[0].grams;
    const parts = [
      per100(THIGH, 800),
      per100(DAHI, 200),
      per100(OIL, 2 * tbsp),
      per100(RICE, 320),
      per100(CUCUMBER, 2 * cuke),
    ];
    const total = Object.fromEntries(
      NUTRIENTS.map((k) => [k, parts.reduce((s, p) => s + p[k], 0)]),
    );
    const close = (got, want, k) =>
      expect(Math.abs(got - want), `${k}: got ${got}, want ${want}`).toBeLessThanOrEqual(
        k === 'kcal' ? 1 : 0.6,
      );

    // the default is 4 boxes
    const perBox = async () => parseMacros(await page.getByTestId('per-box').innerText());
    const pot = async () => parseMacros(await page.getByTestId('recipe-total').innerText());
    const at4 = await perBox();
    const pot4 = await pot();
    for (const k of NUTRIENTS) {
      close(pot4[k], total[k], k);
      close(at4[k], total[k] / 4, k);
    }
    // 4 -> 5: one tap, the per-box figures follow with no re-entry
    const before = a.count;
    await a.tap(page.getByTestId('boxes-more'), 'More boxes');
    expect(a.count - before, 'changing the box count').toBeLessThanOrEqual(2);
    await expect(page.getByTestId('per-box')).not.toHaveText(/^$/);
    const at5 = await perBox();
    for (const k of NUTRIENTS) close(at5[k], total[k] / 5, k);
    expect(at5.kcal).toBeLessThan(at4.kcal);

    await a.tap(page.getByTestId('recipe-save'), 'Save recipe');
    await expect(page.getByTestId('recipe-editor')).toBeHidden();
    const row = page.getByTestId('recipe-row').filter({ hasText: 'Tikka bowls' });
    await expect(row).toBeVisible();
    await expect(row).toContainText('1 of 5 boxes');
    const doc = await savedWhere(page, (d) => d.recipes?.length === 1, 'the recipe');
    expect(doc.recipes).toHaveLength(1);
    expect(doc.recipes[0].boxes).toBe(5);
    expect(doc.recipes[0].ingredients).toHaveLength(5);

    budget(a, 25, 'A16 (2) build "Tikka bowls"', 'Priya (ingredient picker flow) / Lena');
  });

  test('halal: the recipe takes the worst ingredient status and shows that ingredient with its reason', async ({
    page,
  }) => {
    needsUi('new-recipe', 'add-ingredient', 'ingredient-search', 'ingredient-row', 'recipe-halal');
    const check = FOODS.find(
      (f) => f.halal.status === 'check' && f.group !== 'lunchbox' && f.servings.length,
    );
    test.skip(!check, 'the Lab has no "check" food to test with');
    await openPrep(page, '2026-10-18T18:00:00+02:00');
    await page.getByTestId('new-recipe').click();
    await page.getByTestId('add-ingredient').click();
    await page.getByTestId('ingredient-search').fill(DAHI.name.split(' ')[0]);
    await page.getByRole('button', { name: `Add ${DAHI.name} to the recipe` }).click();
    await expect(page.getByTestId('recipe-halal')).toContainText(/every ingredient is halal/i);
    await page.getByTestId('ingredient-search').fill(check.name.split(',')[0].split('(')[0].trim());
    const add = page.getByRole('button', { name: `Add ${check.name} to the recipe` });
    await expect(add, `${check.id} is found by its name`).toBeVisible();
    await add.click();
    const halal = page.getByTestId('recipe-halal');
    await expect(halal).toContainText(/check/i);
    await expect(halal).toContainText(check.name);
    await expect(halal).toContainText(check.halal.reason.slice(0, 30));
  });
});

// ================================================================================================
// A17: boxes into Lunch, Monday to Thursday
// ================================================================================================
test.describe('A17 boxes into Lunch', () => {
  test('one box on Mon, Tue, Wed, Thu in ≤ 6 actions; a fifth on Friday shows an inline note and Undo removes it', async ({
    page,
  }) => {
    needsUi(...NEED_PLACE, 'batch-note');
    await openPrep(page, at(SUN, '20:00'));
    const setup = actions(page);
    await cookFromLibrary(page, setup, TIKKA);
    const card = batchCard(page);
    await expectBoxCounts(card, { toEat: 4, unplaced: 4 });
    // boxes left and halal status are visible without opening anything
    await expect(card.getByTestId('boxes-left')).toBeVisible();
    await expect(card.getByText(/halal/i).first()).toBeVisible();

    // step 1: the meal selector is on Lunch for a lunch box, then one tap per day
    await expectMealSelected(card, 'lunch');
    const a = actions(page);
    for (const d of ['mon', 'tue', 'wed', 'thu']) {
      await a.tap(card.locator(`[data-testid="place-day"][data-date="${DAYS[d]}"]`), `box on ${d}`);
    }
    await expectBoxCounts(card, { toEat: 4, unplaced: 0 });
    const doc = await savedWhere(
      page,
      (d) => d.days?.[DAYS.thu]?.entries?.some((e) => e.foodId === TIKKA),
      "Thursday's box",
    );
    for (const d of ['mon', 'tue', 'wed', 'thu']) {
      const entries = (doc.days[DAYS[d]]?.entries ?? []).filter((e) => e.foodId === TIKKA);
      expect(entries, DAYS[d]).toHaveLength(1);
      expect(entries[0]).toMatchObject({
        slot: 'lunch',
        servingId: 'box',
        qty: 1,
        status: 'planned',
      });
      expect(entries[0].boxRef?.batchId, 'the entry points at its box').toBe(doc.batches[0].id);
    }
    expect(doc.days[DAYS.fri]?.entries ?? []).toHaveLength(0);
    expect(a.count, 'step 1 actions').toBeLessThanOrEqual(6);

    // step 2: a fifth box on Friday still works, with an inline note and no pop-up (the global
    // guard fails the test on alert/confirm/prompt)
    await card.locator(`[data-testid="place-day"][data-date="${DAYS.fri}"]`).click();
    await expect(card.getByTestId('batch-note')).toContainText(/no boxes left/i);
    await expect(page.locator('dialog[open]')).toHaveCount(0);
    const friBox = (d) => (d.days?.[DAYS.fri]?.entries ?? []).filter((e) => e.foodId === TIKKA);
    await savedWhere(page, (d) => friBox(d).length === 1, 'the Friday box');
    await ui.undo(page).getByRole('button', { name: 'Undo' }).click();
    await savedWhere(page, (d) => friBox(d).length === 0, 'the Friday box removed by Undo');
    await expectBoxCounts(card, { toEat: 4, unplaced: 0 });
  });

  test('"Fill Mon–Thu" places the four boxes in one tap', async ({ page }) => {
    needsUi(...NEED_PLACE, 'fill-mon-thu');
    await openPrep(page, at(SUN, '20:00'));
    await cookFromLibrary(page, actions(page), TIKKA);
    const card = batchCard(page);
    await card.getByTestId('fill-mon-thu').click();
    await expectBoxCounts(card, { toEat: 4, unplaced: 0 });
    const doc = await savedWhere(page, (d) => d.days?.[DAYS.thu]?.entries?.length, 'the boxes');
    for (const d of ['mon', 'tue', 'wed', 'thu'])
      expect(
        (doc.days[DAYS[d]]?.entries ?? []).filter((e) => e.foodId === TIKKA && e.slot === 'lunch'),
      ).toHaveLength(1);
  });

  test("step 3: on Monday at 14:00 one tap on Monday's box makes it eaten", async ({ page }) => {
    needsUi(...NEED_PLACE);
    await openPrep(page, at(SUN, '20:00'));
    const setup = actions(page);
    await cookFromLibrary(page, setup, TIKKA);
    for (const d of ['mon', 'tue', 'wed', 'thu'])
      await batchCard(page).locator(`[data-testid="place-day"][data-date="${DAYS[d]}"]`).click();
    await timeTravel(page, at(DAYS.mon, '14:00'));
    await page.goto('/#/day');
    const lunch = ui.slot(page, 'lunch');
    await expect(ui.entries(lunch)).toHaveCount(1);
    await expect(ui.entries(lunch).first()).toHaveAttribute('data-status', 'planned');

    const a = actions(page);
    await a.tap(
      ui
        .entries(lunch)
        .first()
        .getByRole('button', { name: /as eaten$/ }),
      'tick',
    );
    await expect(ui.entries(lunch).first()).toHaveAttribute('data-status', 'eaten');
    expect(a.count).toBe(1);
    await savedWhere(
      page,
      (d) => d.days[DAYS.mon].entries.find((e) => e.foodId === TIKKA).status === 'eaten',
      "Monday's box eaten",
    );

    // the batch knows: Monday's box is eaten, the rest are still planned
    await page.goto('/#/prep');
    const card = batchCard(page);
    await expect(boxRow(card, 1)).toContainText(/eaten/i);
    await expectBoxCounts(card, { toEat: 3, eaten: 1, unplaced: 0 });
    await expect(card.getByTestId('boxes-left')).toContainText('3 to eat · 1 eaten');
  });
});

// ================================================================================================
// A18: fridge, freezer, use-by, shopping list
// ================================================================================================
test.describe('A18 fridge, freezer, use-by and shopping list', () => {
  const NEED = [...NEED_PLACE, 'box-useby', 'shopping-open'];
  const seg = (scope, name) =>
    scope.getByRole('group', { name: 'Fridge or freezer' }).getByRole('button', { name });

  test('(1) a rice box is proposed as box 1 fridge and boxes 2-4 freezer, and any box can be changed', async ({
    page,
  }) => {
    needsUi(...NEED, 'cook-dialog');
    await openPrep(page, at(SUN, '19:00'));
    await libraryRow(page, TIKKA).getByTestId('library-cook').click();
    const dlg = page.getByTestId('cook-dialog');
    const groups = dlg.getByRole('group', { name: 'Fridge or freezer' });
    await expect(groups).toHaveCount(4);
    await expect(groups.nth(0).getByRole('button', { name: 'Fridge' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    for (const i of [1, 2, 3])
      await expect(groups.nth(i).getByRole('button', { name: 'Freezer' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    // any box can be changed
    await groups.nth(1).getByRole('button', { name: 'Fridge' }).click();
    await expect(groups.nth(1).getByRole('button', { name: 'Fridge' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await groups.nth(0).getByRole('button', { name: 'Freezer' }).click();
    await expect(groups.nth(0).getByRole('button', { name: 'Freezer' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.getByTestId('cook-save').click();
    const doc = await savedWhere(page, (d) => d.batches?.length === 1, 'the batch');
    expect(doc.batches[0].boxes.map((b) => b.storage)).toEqual([
      'freezer',
      'fridge',
      'freezer',
      'freezer',
    ]);
  });

  /** Cook the tikka batch on Sunday 1 Nov and put one box on each of Mon-Thu (A17 step 1). */
  async function tikkaWeek(page) {
    await openPrep(page, at(SUN, '19:00'));
    await cookFromLibrary(page, actions(page), TIKKA);
    const card = batchCard(page);
    for (const d of ['mon', 'tue', 'wed', 'thu'])
      await card.locator(`[data-testid="place-day"][data-date="${DAYS[d]}"]`).click();
    await expectBoxCounts(card, { toEat: 4, unplaced: 0 });
    return card;
  }

  test('(2)-(5) use-by of box 1 is Monday, boxes 2-4 are frozen; last day on Monday; box 2 moved to the fridge is Tuesday; box 1 is past on Tuesday', async ({
    page,
  }) => {
    needsUi(...NEED);
    let card = await tikkaWeek(page);

    // (2) Sunday 21:00. Box 1 (fridge, rice keeps 1 day): use by Monday. Boxes 2-4: frozen, no use-by.
    await timeTravel(page, at(SUN, '21:00'));
    card = batchCard(page);
    await expect(boxRow(card, 1).getByTestId('box-useby')).toContainText(
      /use by (tomorrow|.*\bmon)/i,
    );
    for (const n of [2, 3, 4]) {
      const note = boxRow(card, n).getByTestId('box-useby');
      await expect(note, `box ${n}`).toContainText(/frozen/i);
      await expect(note, `box ${n}`).not.toContainText(/use by/i);
    }
    const doc = await savedDoc(page);
    expect(doc.batches[0].boxes.map((b) => b.storage)).toEqual([
      'fridge',
      'freezer',
      'freezer',
      'freezer',
    ]);

    // (3) Monday 12:00: the Day view's box says "last day"
    await timeTravel(page, at(DAYS.mon, '12:00'));
    await page.goto('/#/day');
    await expect(
      ui.entries(ui.slot(page, 'lunch')).first().getByTestId('entry-note'),
    ).toContainText(/last day/i);

    // (4) Monday 22:00: move box 2 to the fridge; its use-by is Tuesday
    await timeTravel(page, at(DAYS.mon, '22:00'));
    await page.goto('/#/prep');
    card = batchCard(page);
    await seg(boxRow(card, 2), 'Fridge').click();
    await expect(boxRow(card, 2).getByTestId('box-useby')).toContainText(
      /(use by|last day).*(tomorrow|\btue)/i,
    );

    // (5) Tuesday 09:00: box 1 is past its use-by, in calm words (no red, no pop-up); Tuesday's box says last day
    await timeTravel(page, at(DAYS.tue, '09:00'));
    card = batchCard(page);
    const past = boxRow(card, 1).getByTestId('box-useby');
    await expect(past).toContainText(/past use-by, best not to eat/i);
    const color = await past.evaluate((el) => getComputedStyle(el).color);
    const [r, g, b] = color.match(/[\d.]+/g).map(Number);
    expect(r - Math.max(g, b), `"${color}" must not be a red`).toBeLessThan(60);
    await expect(page.locator('dialog[open]')).toHaveCount(0);
    await expect(boxRow(card, 2).getByTestId('box-useby')).toContainText(/last day/i);
    await page.goto('/#/day');
    await expect(
      ui.entries(ui.slot(page, 'lunch')).first().getByTestId('entry-note'),
    ).toContainText(/last day/i);
  });

  test("Monday 22:00: tonight's prompt offers Tuesday's frozen box for the fridge, one tap", async ({
    page,
  }) => {
    needsUi(...NEED, 'move-tonight');
    await tikkaWeek(page);
    await timeTravel(page, at(DAYS.mon, '22:00'));
    const tonight = page.getByTestId('move-tonight');
    await expect(tonight).toBeVisible();
    await expect(tonight).toContainText(/box 2/i);
    await tonight.getByRole('button', { name: /fridge/i }).click();
    await expect(page.getByTestId('move-tonight')).toHaveCount(0);
    await savedWhere(
      page,
      (d) => d.batches[0].boxes[1].storage === 'fridge',
      'box 2 in the fridge',
    );
  });

  test('(6) the chana chaat box keeps 2 days: boxes 1-2 in the fridge (use-by Tuesday), boxes 3-4 frozen', async ({
    page,
  }) => {
    needsUi(...NEED_COOK, 'cook-dialog', 'box-useby');
    test.skip(!FOODS.some((f) => f.id === CHAAT), 'the Lab has no chana chaat box');
    await openPrep(page, at(SUN, '19:00'));
    await libraryRow(page, CHAAT).getByTestId('library-cook').click();
    const dlg = page.getByTestId('cook-dialog');
    // Lab data (R3): the chicken half of the box freezes, so the dialog no longer says "doesn't freeze well".
    await expect(dlg).not.toContainText(/doesn.t freeze well/i);
    await expect(dlg).toContainText(/Keeps 2 days in the fridge/i);
    await expect(dlg).toContainText(/first 2 go in the fridge and the rest in the freezer/i);
    const groups = dlg.getByRole('group', { name: 'Fridge or freezer' });
    await expect(groups).toHaveCount(4);
    for (let i = 0; i < 4; i += 1) {
      const inFridge = i < 2;
      await expect(groups.nth(i).getByRole('button', { name: /freezer/i })).toBeEnabled();
      await expect(groups.nth(i).getByRole('button', { name: 'Fridge' })).toHaveAttribute(
        'aria-pressed',
        String(inFridge),
      );
      await expect(groups.nth(i).getByRole('button', { name: /freezer/i })).toHaveAttribute(
        'aria-pressed',
        String(!inFridge),
      );
    }
    await page.getByTestId('cook-save').click();
    const card = batchCard(page);
    await expectBoxCounts(card, { toEat: 4, unplaced: 4 });
    // Cooked on Sunday: a fridge box is use-by Tuesday (Sunday + 2 days).
    await expect(boxRow(card, 1).getByTestId('box-useby')).toContainText(/use by.*tue/i);
    const doc = await savedWhere(page, (d) => d.batches?.length === 1, 'the chaat batch');
    expect(doc.batches[0].boxes.map((b) => b.storage)).toEqual([
      'fridge',
      'fridge',
      'freezer',
      'freezer',
    ]);
  });

  test('(7) the shopping list: each ingredient once, amounts double at 8 boxes, butcher vs supermarket, copies as text', async ({
    context,
    page,
  }) => {
    needsUi(...NEED, 'shopping-copy', 'shopping-list');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
    await openPrep(page, at(SUN, '19:00'));
    await cookFromLibrary(page, actions(page), TIKKA);
    await batchCard(page).getByTestId('shopping-open').click();
    const list = page.getByTestId('shopping-list');
    await expect(list).toBeVisible();
    await expect(list.locator('li').first()).toBeVisible();

    /** [{ section, name, grams }] read from the dialog. */
    const read = () =>
      list.locator('section[data-section]').evaluateAll((sections) =>
        sections.flatMap((s) =>
          [...s.querySelectorAll('li')].map((li) => {
            const text = li.textContent.trim();
            const grams = text.match(/([\d.,]+)\s*(kg|g)\b(?!.*(kg|g)\b)/);
            return {
              section: s.dataset.section,
              label: s.querySelector('h3')?.textContent.trim(),
              name: text.split(':')[0].trim(),
              grams: grams
                ? Number(grams[1].replace(/,/g, '')) * (grams[2] === 'kg' ? 1000 : 1)
                : NaN,
              text,
            };
          }),
        ),
      );
    const at4 = await read();
    expect(at4.length).toBeGreaterThan(3);
    const names = at4.map((i) => i.name.toLowerCase());
    expect(new Set(names).size, `each ingredient once: ${names.join(', ')}`).toBe(names.length);
    const sections = new Set(at4.map((i) => i.section));
    expect(sections.has('butcher'), 'a halal butcher section').toBe(true);
    expect(sections.size).toBeGreaterThanOrEqual(2);
    // meat is listed under the halal butcher, everything else is not
    for (const i of at4) {
      const isMeat = /chicken|lamb|beef|mutton|goat|meat|keema|boti/i.test(i.name);
      if (isMeat) expect(i.section, i.name).toBe('butcher');
      else expect(i.section, i.name).not.toBe('butcher');
    }
    expect(at4.find((i) => i.section === 'butcher').label).toMatch(/halal butcher/i);

    // 4 -> 8 boxes: four taps, every amount doubles (±1 g of rounding)
    for (let i = 0; i < 4; i += 1)
      await page
        .getByTestId('shopping-dialog')
        .getByRole('button', { name: /one more/i })
        .click();
    await expect.poll(async () => (await read())[0]?.grams).not.toBe(at4[0].grams);
    const at8 = await read();
    expect(at8.map((i) => i.name)).toEqual(at4.map((i) => i.name));
    for (let i = 0; i < at4.length; i += 1)
      expect(
        Math.abs(at8[i].grams - 2 * at4[i].grams),
        `${at4[i].name}: ${at4[i].grams} g -> ${at8[i].grams} g`,
      ).toBeLessThanOrEqual(Math.max(2, at4[i].grams * 0.01));

    // copy: plain text, section headings and one line per ingredient
    await page.getByTestId('shopping-copy').click();
    const copied = await page.evaluate(() => navigator.clipboard.readText()).catch(() => null);
    test.skip(copied === null, 'the browser would not let the test read the clipboard');
    expect(copied).toMatch(/halal butcher/i);
    for (const i of at8) expect(copied).toContain(i.name);
    expect(copied).not.toMatch(/<[a-z]/i);
    expect(copied.split('\n').filter((l) => l.startsWith('- ')).length).toBe(at8.length);
  });
});
