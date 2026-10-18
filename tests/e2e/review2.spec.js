// Review 2 fix wave (Meeting 004, decision A), in the browser, on the real Lab data. Written from the
// decisions (A1 ranking and tags, A2 ingredient quantities, A4 weekly shopping list, A5 pork/alcohol
// note, A7 family pot), not from the app code. The same rules, as units with hand-worked values:
// tests/unit/qa/review2.test.js. Owner: Kenji.
// Selectors: the test ids food-row, prep-tag, own-tag, search-note, ingredient-row/-search,
// recipe-makes, recipe-katori, week-shopping-open/-list, and roles with accessible names.
import { FOODS } from '../../app/data/index.js';
import RECIPES from '../../app/data/recipes-mealprep.js';
import { test, expect, seed, setUpDoc, userDoc, setClock, savedDoc, ui } from './_app.js';

const NOON = '2026-10-14T13:30:00+02:00'; // Lunch in the Spanish preset
const CALM = 'Katori has no pork or alcohol foods. Everything here is pork-free.';
const byId = (id) => {
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

/** Day view at Lunch, add sheet open. */
async function openAddSheet(page, doc = userDoc({ settings: { slotPreset: 'spain' } })) {
  await seed(page, doc);
  await setClock(page, NOON);
  await page.goto('/#/day');
  await ui.addFood(page).click();
  await expect(ui.sheet(page).getByRole('heading', { name: 'Add to Lunch' })).toBeVisible();
}

const rows = (page) => ui.results(page).getByTestId('food-row');
const rowIds = (page) => rows(page).evaluateAll((els) => els.map((e) => e.dataset.foodId));

// ===================================================================== A1 ranking and the two tags

test.describe('A1 search ranking', () => {
  const ROTI = byId('pk-roti');
  const own = {
    id: 'my-recipe-qa1',
    name: 'Salan with roti, my way',
    createdAt: '2026-10-10',
    updatedAt: '2026-10-10',
    ingredients: [{ foodId: 'pk-roti', servingId: ROTI.servings[0].id, qty: 2 }],
    cookedWeightG: null,
    boxes: 1,
  };

  test('"roti" at Lunch: single rotis first, preps after them and tagged "Prep", no tag on singles', async ({
    page,
  }) => {
    await openAddSheet(page);
    await ui.search(page).fill('roti');
    await expect(rows(page).first()).toBeVisible();
    const found = await rows(page).evaluateAll((els) =>
      els.map((e) => ({
        id: e.dataset.foodId,
        prep: Boolean(e.querySelector('[data-testid="prep-tag"]')),
      })),
    );
    expect(found.length).toBeGreaterThan(5);
    expect(found[0].id, 'Roti / chapati leads').toBe('pk-roti');
    // every prep (a Lab lunchbox record) carries the tag, no single food does
    for (const f of found) {
      expect(f.prep, `${f.id} tag`).toBe(byId(f.id).group === 'lunchbox');
    }
    // no single food after the first prep
    const firstPrep = found.findIndex((f) => f.prep);
    expect(firstPrep).toBeGreaterThan(2);
    expect(
      found.slice(firstPrep).every((f) => f.prep),
      found.map((f) => `${f.prep ? 'P' : 'S'}:${f.id}`).join(' '),
    ).toBe(true);
    await expect(ui.sheet(page).getByTestId('own-tag')).toHaveCount(0);
    await expect(ui.sheet(page).getByTestId('search-note')).toHaveCount(0);
  });

  test('your own recipe comes first for "roti", with "My recipe"; Prep tags stay on the preps only', async ({
    page,
  }) => {
    await openAddSheet(page, userDoc({ settings: { slotPreset: 'spain' }, recipes: [own] }));
    await ui.search(page).fill('roti');
    await expect(rows(page).first()).toBeVisible();
    const ids = await rowIds(page);
    expect(ids[0], 'the own recipe is the first row').toBe(own.id);
    const first = rows(page).first();
    await expect(first.getByTestId('own-tag')).toHaveText('My recipe');
    await expect(first.getByTestId('prep-tag')).toHaveCount(0);
    await expect(ui.sheet(page).getByTestId('own-tag')).toHaveCount(1);
    expect(ids[1], 'then the plain roti').toBe('pk-roti');
  });
});

// ======================================================================= A2 ingredient quantities

test.describe('A2 ingredient quantities in the recipe picker', () => {
  test('"3 medium potatoes", "5 eggs" and "250 g lentils" pick the raw potato, the raw egg and dry lentils, with those amounts', async ({
    page,
  }) => {
    await seed(page, setUpDoc());
    await setClock(page, NOON);
    await page.goto('/#/prep');
    await page.getByTestId('new-recipe').click();
    await page.getByTestId('recipe-name').fill('Amount check');
    await page.getByTestId('add-ingredient').click();
    const search = page.getByTestId('ingredient-search');
    const plus = (row) => row.getByRole('button', { name: /^Add .* to the recipe$/ });

    // 3 medium potatoes: raw potato, 3 x 213 g
    await search.fill('3 medium potatoes');
    const potato = page.getByTestId('ingredient-row').first();
    await expect(potato).toHaveAttribute('data-food-id', 'intl-potato-raw');
    await expect(potato.locator('.food-portion')).toContainText(/3 medium potatoes/i);
    await expect(potato.locator('.food-portion')).toContainText('639 g');
    await plus(potato).click();

    // 5 eggs: the raw egg, not the boiled, fried or omelette
    await search.fill('5 eggs');
    const egg = page.getByTestId('ingredient-row').first();
    await expect(egg).toHaveAttribute('data-food-id', 'intl-egg-raw');
    await expect(egg.locator('.food-portion')).toContainText(/5 /);
    await plus(egg).click();

    // 250 g lentils: a dry lentil, not the cooked stew or the jar
    await search.fill('250 g lentils');
    const lentil = page.getByTestId('ingredient-row').first();
    const lentilId = await lentil.getAttribute('data-food-id');
    expect(byId(lentilId).state, `${lentilId} is a dry or raw food`).toMatch(/\b(dry|raw)\b/i);
    expect(lentilId).not.toBe('es-lentejas');
    await expect(lentil.locator('.food-portion')).toContainText('250 g');
    await plus(lentil).click();

    await page.getByTestId('ingredient-sheet').getByRole('button', { name: 'Done' }).click();
    await page.getByTestId('recipe-save').click();
    const doc = await saved(page, (d) => d.recipes?.length === 1, 'the recipe');
    const [pot, eggs, lent] = doc.recipes[0].ingredients;
    expect(pot).toMatchObject({ foodId: 'intl-potato-raw', servingId: 'medium', qty: 3 });
    expect(eggs.foodId).toBe('intl-egg-raw');
    expect(eggs.qty).toBe(5);
    expect(['large', 'medium']).toContain(eggs.servingId);
    expect(lent).toMatchObject({ foodId: lentilId, servingId: 'g', qty: 250 });
  });
});

// ========================================================================== A5 pork, alcohol, seafood

test.describe('A5 search notes', () => {
  for (const q of ['chorizo', 'cerveza', 'jamón serrano', 'bacon', 'vino tinto']) {
    test(`"${q}" shows one calm line, not "Nothing found"`, async ({ page }) => {
      await openAddSheet(page);
      await ui.search(page).fill(q);
      const note = ui.sheet(page).getByTestId('search-note');
      await expect(note).toBeVisible();
      await expect(note).toHaveText(CALM);
      await expect(rows(page)).toHaveCount(0);
      await expect(ui.sheet(page)).not.toContainText(/nothing found/i);
    });
  }

  test('the line goes away when the word does (no stale note)', async ({ page }) => {
    await openAddSheet(page);
    await ui.search(page).fill('chorizo');
    await expect(ui.sheet(page).getByTestId('search-note')).toBeVisible();
    await ui.search(page).fill('chicken');
    await expect(rows(page).first()).toBeVisible();
    await expect(ui.sheet(page).getByTestId('search-note')).toHaveCount(0);
  });

  test('"gambas" finds the seafood records and shows no pork line', async ({ page }) => {
    await openAddSheet(page);
    await ui.search(page).fill('gambas');
    await expect(rows(page).first()).toBeVisible();
    const ids = await rowIds(page);
    expect(ids).toContain('es-gambas-al-ajillo');
    expect(ids.some((id) => byId(id).tags?.includes('seafood-prawn'))).toBe(true);
    await expect(ui.sheet(page).getByTestId('search-note')).toHaveCount(0);
  });

  for (const [q, id] of [
    ['calamares', 'seafood-other'],
    ['pulpo', 'seafood-other'],
    ['mejillones', 'seafood-other'],
  ]) {
    test(`"${q}" finds a ${id} record`, async ({ page }) => {
      await openAddSheet(page);
      await ui.search(page).fill(q);
      await expect(rows(page).first()).toBeVisible();
      const ids = await rowIds(page);
      expect(ids.some((x) => byId(x).tags?.includes(id))).toBe(true);
    });
  }
});

// ======================================================================== A7 the family pot, katori

test.describe('A7 family pot', () => {
  test('"Family pot" asks for katori instead of a weight, saves boxes 1 + potKatori, ranks first, logs on a katori and explains itself', async ({
    page,
  }) => {
    await seed(page, setUpDoc({ settings: { slotPreset: 'spain' } }));
    await setClock(page, NOON);
    await page.goto('/#/prep');
    await page.getByTestId('new-recipe').click();
    const editor = page.getByTestId('recipe-editor');
    await page.getByTestId('recipe-name').fill('Salan pot');
    await page.getByTestId('add-ingredient').click();
    const search = page.getByTestId('ingredient-search');
    for (const [text, id] of [
      ['800 g chicken thigh', 'intl-chicken-thigh-raw'],
      ['2 tbsp oil', 'intl-cooking-oil'],
    ]) {
      await search.fill(text);
      const row = page.locator(`[data-testid="ingredient-row"][data-food-id="${id}"]`);
      await expect(row).toBeVisible();
      await row.getByRole('button', { name: /^Add .* to the recipe$/ }).click();
    }
    await page.getByTestId('ingredient-sheet').getByRole('button', { name: 'Done' }).click();

    // "It makes": Boxes / 1 dish / Family pot. Boxes is the starting choice, with a weight field.
    const makes = editor.getByTestId('recipe-makes');
    await expect(makes.getByRole('button', { name: 'Boxes' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(editor.getByTestId('recipe-weight')).toBeVisible();
    await expect(editor.getByTestId('recipe-katori')).toBeHidden();
    await makes.getByRole('button', { name: 'Family pot' }).click();
    await expect(makes.getByRole('button', { name: 'Family pot' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(editor.getByTestId('recipe-weight')).toBeHidden();
    await expect(editor.getByText('How many katori does your pot make?')).toBeVisible();
    await editor.getByTestId('recipe-katori').fill('8');
    await page.getByTestId('recipe-save').click();
    await expect(editor).toBeHidden();

    const doc = await saved(page, (d) => d.recipes?.length === 1, 'the pot recipe');
    const recipe = doc.recipes[0];
    expect(recipe.potKatori).toBe(8);
    expect(recipe.boxes).toBe(1);
    expect(recipe.cookedWeightG, '8 katori x 200 ml').toBe(1600);

    // it is the first thing "salan" finds, tagged "My recipe", and the library salans follow
    await page.goto('/#/day');
    await ui.addFood(page).click();
    await ui.search(page).fill('salan');
    await expect(rows(page).first()).toBeVisible();
    const first = rows(page).first();
    await expect(first).toHaveAttribute('data-food-id', recipe.id);
    await expect(first.getByTestId('own-tag')).toHaveText('My recipe');
    expect((await rowIds(page)).length).toBeGreaterThan(1);

    // logging opens on a katori: one tap on Add stores 1 katori, not the whole pot
    await first.locator('button').first().click();
    await expect(ui.picker(page)).toBeVisible();
    await expect(ui.qtyInput(page)).toHaveValue('1');
    await ui.picker(page).getByRole('button', { name: 'Source and details' }).click();
    await expect(ui.details(page)).toContainText(/your own pot/i);
    await expect(ui.details(page)).toContainText(/your amounts of oil/i);
    await ui
      .details(page)
      .getByRole('button', { name: /close|back|done/i })
      .first()
      .click();
    await ui
      .picker(page)
      .getByRole('button', { name: /^Add to Lunch$/ })
      .click();
    const day = await saved(
      page,
      (d) => Object.values(d.days ?? {}).some((x) => x.entries?.length),
      'the entry',
    );
    const entry = Object.values(day.days).flatMap((x) => x.entries)[0];
    expect(entry.foodId).toBe(recipe.id);
    expect(entry.servingId).toBe('katori');
    expect(entry.qty).toBe(1);
    // one katori is 200 g of the pot (8 katori = 1600 g)
    expect(Math.abs(entry.snapshot.grams - 200)).toBeLessThan(0.6);
    // and the sum of the ingredients' kcal / 8, worked from the foods' per-100 g values
    const kcal =
      (byId('intl-chicken-thigh-raw').per100g.kcal * 8 +
        (byId('intl-cooking-oil').per100g.kcal * 27.2) / 100) /
      8;
    expect(Math.abs(entry.snapshot.kcal - kcal)).toBeLessThanOrEqual(1.5);
  });
});

// ========================================================================= A4 the week's shopping

test.describe('A4 the weekly shopping list', () => {
  const A = 'pk-chicken-tikka-rice-box';
  const B = 'pk-keema-matar-rice-box';
  const recipe = (id) => RECIPES.find((r) => r.foodId === id);

  test('two batches merge by food; butcher, supermarket, then "Check you have"; packs and counts; copies as text', async ({
    context,
    page,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
    await seed(page, setUpDoc());
    await setClock(page, '2026-11-01T19:00:00+01:00');
    await page.goto('/#/prep');
    for (const id of [A, B]) {
      await page
        .locator(`[data-testid="library-row"][data-food-id="${id}"]`)
        .getByTestId('library-cook')
        .click();
      await page.getByTestId('cook-save').click();
      await expect(page.getByTestId('cook-dialog')).toBeHidden();
    }
    await expect(page.getByTestId('batch-card')).toHaveCount(2);
    await page.getByTestId('week-shopping-open').click();
    const dialog = page.getByTestId('week-shopping-dialog');
    await expect(dialog).toBeVisible();
    const list = page.getByTestId('week-shopping-list');
    await expect(list.locator('li').first()).toBeVisible();

    const sections = await list.locator('section[data-section]').evaluateAll((els) =>
      els.map((s) => ({
        id: s.dataset.section,
        label: s.querySelector('h3')?.textContent.trim(),
        items: [...s.querySelectorAll('li')].map((li) => li.textContent.trim()),
      })),
    );
    const order = sections.map((s) => s.id);
    expect(order[0], 'the halal butcher first').toBe('butcher');
    expect(order.indexOf('supermarket')).toBeGreaterThan(order.indexOf('butcher'));
    expect(order.at(-1), 'Check you have is last').toBe('cupboard');
    expect(sections.find((s) => s.id === 'cupboard').label).toBe('Check you have');
    expect(sections.find((s) => s.id === 'butcher').label).toMatch(/halal butcher/i);

    // each food once across the whole list
    const all = sections.flatMap((s) =>
      s.items.map((text) => ({ section: s.id, text, name: text.split(':')[0].trim() })),
    );
    const names = all.map((i) => i.name.toLowerCase());
    expect(new Set(names).size, `each food once: ${names.join(', ')}`).toBe(names.length);

    // salt and spices are in the cupboard group, the meat in the butcher's, rice and dahi are not
    const where = (re) => all.filter((i) => re.test(i.name)).map((i) => i.section);
    expect(where(/^salt$/i)).toEqual(['cupboard']);
    // Two cumin lines since the Lab split them: the seeds (zeera) and the powder (comino molido).
    const cuminLines = all.filter((i) => /cumin/i.test(i.name));
    expect(cuminLines.length, `cumin lines: ${cuminLines.map((i) => i.text).join(' | ')}`).toBe(2);
    const seedLines = cuminLines.filter((i) => /seeds|zeera/i.test(i.name));
    const powder = cuminLines.filter((i) => /ground|powder|molido/i.test(i.name));
    expect(seedLines.length, 'one line for the whole seeds').toBe(1);
    expect(powder.length, 'one line for the powder').toBe(1);
    expect(seedLines[0].name).not.toBe(powder[0].name);
    expect(cuminLines.every((i) => i.section === 'cupboard')).toBe(true);
    // Seeds: tikka 3 g + keema 3 g merged = 6 g; powder: tikka only, 4 g.
    expect(seedLines[0].text).toMatch(/\b6 g\b/);
    expect(powder[0].text).toMatch(/\b4 g\b/);
    expect(where(/chicken|beef|mince/i).every((s) => s === 'butcher')).toBe(true);
    expect(where(/rice/i).every((s) => s === 'supermarket')).toBe(true);

    // merged by food: dahi is 450 g (tikka) + 450 g (keema) worth, bought in 6 x 125 g pots
    const gramsOf = (r, foodId) =>
      r.ingredients.filter((i) => i.foodId === foodId).reduce((s, i) => s + i.grams, 0);
    const dahiG = gramsOf(recipe(A), 'intl-dahi') + gramsOf(recipe(B), 'intl-dahi');
    expect(dahiG).toBeGreaterThan(0);
    const dahi = all.find((i) => /yog?urt|dahi/i.test(i.name));
    expect(dahi, 'yoghurt is on the list').toBeTruthy();
    const packs = Math.ceil(dahiG / 750);
    expect(dahi.text, "packs, from the food's pack label").toContain('6 × 125 g pots');
    expect(dahi.text).toMatch(new RegExp(`${packs} packs? of 6 × 125 g pots`));
    // basmati: 240 g (tikka) + keema's own amount, from the 1 kg bag
    const riceG =
      gramsOf(recipe(A), 'intl-rice-basmati-dry') + gramsOf(recipe(B), 'intl-rice-basmati-dry');
    const rice = all.find((i) => /basmati/i.test(i.name));
    expect(rice.text).toMatch(new RegExp(`${Math.ceil(riceG / 1000)} × 1 kg bag`));
    // an onion is counted, not weighed
    const onionG = gramsOf(recipe(A), 'intl-onion') + gramsOf(recipe(B), 'intl-onion');
    const onion = all.find((i) => /onion/i.test(i.name));
    expect(onion, `onion is on the list: ${names.join(' | ')}`).toBeTruthy();
    expect(onionG).toBeGreaterThan(0);
    // no pack, so a whole count of medium onions (110 g each), rounded up with the 0.05 allowance
    const n = Math.max(1, Math.ceil(onionG / 110 - 0.05));
    expect(onion.text).toContain(n === 1 ? '1 medium onion (' : `${n} medium onions (`);

    // copy: plain text, the same sections in the same order, one "- " line per food
    await page.getByTestId('week-shopping-copy').click();
    const copied = await page.evaluate(() => navigator.clipboard.readText()).catch(() => null);
    test.skip(copied === null, 'the browser would not let the test read the clipboard');
    expect(copied.split('\n')[0]).toMatch(/^Shopping for this week: 2 batches$/);
    const heads = sections.map((s) => s.label);
    const at = heads.map((h) => copied.indexOf(`\n${h}\n`));
    expect(
      at.every((i) => i > 0),
      `${heads} in the copy`,
    ).toBe(true);
    expect(at).toEqual([...at].sort((x, y) => x - y));
    expect(copied.split('\n').filter((l) => l.startsWith('- ')).length).toBe(all.length);
    expect(copied).not.toMatch(/<[a-z]/i);
    for (const i of all) expect(copied).toContain(i.text);
  });
});
