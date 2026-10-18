// Review 3 regression tests (Mariam, Bilal, Nasreen; fix wave R3-A/R3-B). Each test replays a tester's
// must-fix steps in the running app on the real Lab data, with a fixed clock (Europe/Madrid). Owner: Kenji.
// Clock: Sun 18 Oct 2026 17:00 is the day the Low-cook week is used; the plan fills Mon 19 to Fri 23 Oct
// (DST in Madrid ends Sun 25 Oct, so every date here is UTC+2).
import { PLANS } from '../../app/data/plans-mealprep.js';
import { test, expect, seed, setUpDoc, setClock, savedDoc, ui } from './_app.js';

const SUN = '2026-10-18T17:00:00+02:00';
const at = (day, hhmm) => `2026-10-${day}T${hhmm}:00+02:00`;
const LOW = PLANS.find((p) => p.id === 'low-cook-week');

const BOCADILLO = 'es-bocadillo-atun-huevo-box';
const BOLOGNESE = 'intl-beef-bolognese-pasta-box';

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

/** Moves the browser clock and reloads (the app keeps its saved data). */
async function timeTravel(page, iso, hash) {
  await page.clock.setSystemTime(new Date(iso));
  if (hash) await page.goto(hash);
  await page.reload();
}

/** Sunday 17:00, Prep tab, "Use this week" on the Low-cook week. */
async function useLowCookWeek(page, doc = setUpDoc()) {
  await seed(page, doc);
  await setClock(page, SUN);
  await page.goto('/#/prep');
  const card = page.locator(`[data-testid="plan-card"][data-plan="${LOW.id}"]`);
  await expect(card).toBeVisible();
  await card.getByTestId('plan-use').click();
  await expect(card.getByTestId('plan-note')).toContainText('planned Mon–Fri');
  return card;
}

const flat = (s) => s.replace(/\s+/g, ' ').trim();

test.describe('M1 a weekday batch fills the meal the plan put there', () => {
  test('Wed night: make the bocadillo; Thursday lunch is that box, once, with no Plan-it nag', async ({
    page,
  }) => {
    await useLowCookWeek(page);
    await timeTravel(page, at('21', '21:00'), '/#/day/2026-10-22');
    const planned = flat(await ui.plannedTotal(page).innerText());
    await expect(ui.entries(ui.slot(page, 'lunch'))).toHaveCount(1);
    await expect(ui.entries(ui.slot(page, 'lunch'))).not.toContainText(/Box 1/);

    await page.goto('/#/day');
    const row = page
      .locator('[data-testid="tonight-make"],[data-testid="tonight-plan-job"]')
      .filter({ hasText: /bocadillo/i });
    await expect(row.first()).toBeVisible();
    await row.first().getByTestId('tonight-make-btn').click();
    const dlg = page.getByTestId('cook-dialog');
    await expect(dlg).toBeVisible();
    // The plan says 1 box and the dialog opens on 1 (Mariam: it used to open on 2).
    await expect(dlg.getByTestId('cook-save')).toContainText(/Make 1 box\b/);
    await dlg.getByTestId('cook-save').click();
    await expect(dlg).toBeHidden();
    const doc = await saved(page, (d) => d.batches?.some((b) => b.recipeId === BOCADILLO), 'batch');

    // Thursday 08:00: the plan's own lunch row now is the box. One lunch entry, one box, nothing to plan.
    await timeTravel(page, at('22', '08:00'), '/#/day');
    const lunch = ui.slot(page, 'lunch');
    await expect(ui.entries(lunch)).toHaveCount(1);
    await expect(ui.entries(lunch).first()).toContainText('Box 1');
    await expect(ui.entries(lunch).first()).toContainText('Planned');
    await expect(page.getByTestId('spare-box')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Plan it/ })).toHaveCount(0);
    expect(flat(await ui.plannedTotal(page).innerText()), 'no kcal were added').toBe(planned);

    const saveddoc = await savedDoc(page);
    const batch = saveddoc.batches.find((b) => b.recipeId === BOCADILLO);
    expect(batch.boxes.length).toBe(1);
    expect(batch.boxes[0].status).toBe('placed');
    const entries = saveddoc.days['2026-10-22'].entries.filter((e) => e.slot === 'lunch');
    expect(entries.length).toBe(1);
    expect(entries[0].boxRef).toBeTruthy();
    expect(doc.batches.length).toBeGreaterThan(0);
  });
});

test.describe('M2 the Low-cook bolognese is booked right', () => {
  test('box 1 in the fridge for Wednesday, the rest frozen, and no "last day" on Monday', async ({
    page,
  }) => {
    await useLowCookWeek(page);
    const card = page.getByTestId('batch-card').filter({ hasText: /bolognese/i });
    await expect(card.getByTestId('box-row')).toHaveCount(4);
    const box = (n) => card.locator(`[data-testid="box-row"][data-box="${n}"]`);
    // Box 1 is for Wednesday's lunch, in the fridge, use by Wednesday (the sauce keeps 3 days).
    await expect(box(1)).toContainText(/Lunch, Wed 21/);
    await expect(box(1)).toContainText(/Use by Wed/i);
    await expect(box(1).getByRole('button', { name: 'Fridge' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    // The other three are frozen: no use-by, not placed.
    for (const n of [2, 3, 4]) {
      await expect(box(n)).toContainText(/Frozen/);
      await expect(box(n)).not.toContainText(/Use by/i);
      await expect(box(n).getByRole('button', { name: 'Freezer' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    }
    const doc = await saved(
      page,
      (d) => d.batches?.some((b) => b.recipeId === BOLOGNESE),
      'bolognese batch',
    );
    const b = doc.batches.find((x) => x.recipeId === BOLOGNESE);
    expect(b.boxes.map((x) => x.storage)).toEqual(['fridge', 'freezer', 'freezer', 'freezer']);

    // Monday: no "last day" line and no spare-box nag for the bolognese.
    await timeTravel(page, at('19', '12:00'), '/#/day');
    await expect(ui.dayTitle(page)).toBeVisible();
    await expect(page.getByTestId('spare-box')).toHaveCount(0);
    await expect(page.locator('main')).not.toContainText(/last day/i);
    await expect(page.locator('main')).not.toContainText(/Plan it/);
  });
});

test.describe('M3 the Tonight card is on screen', () => {
  test('Tue 20:30: the card is in view and carries the penne job', async ({ page }) => {
    await useLowCookWeek(page);
    await timeTravel(page, at('20', '20:30'), '/#/day');
    const card = page.getByTestId('move-tonight');
    await expect(card).toBeVisible();
    // The Day opens at the current meal; the card must not be scrolled away above the screen.
    await expect(card).toBeInViewport({ ratio: 1 });
    await expect(card).toContainText(/Tonight:/);
    await expect(card).toContainText(/boil 80 g wholewheat penne/i);
    await expect(card.getByTestId('tonight-plan-job').filter({ hasText: /penne/i })).toHaveCount(1);
    // Still in view a moment later (the auto-scroll has finished).
    await page.waitForTimeout(600);
    await expect(card).toBeInViewport({ ratio: 1 });
  });
});

test.describe("M4 the week's shopping covers the whole plan", () => {
  // Foods the old list missed (Mariam #4): the weekday jobs and the plan's ready snacks.
  const WEEKDAY_FOODS = [
    /Tuna/,
    /Avocado/,
    /Bocadillo bread roll/,
    /Egg, whole/,
    /Dijon/,
    /Crema de verduras/,
  ];
  const READY_FOODS = [
    /Protein yogurt/,
    /Banana: /,
    /Kinnow/,
    /Almonds: /,
    /Queso fresco de Burgos/,
    /Apple/,
    /Picos integrales/,
    /Pear: /,
  ];

  test("Week's shopping lists every batch, the weekday jobs and the ready food, once each, and Copy says Copied", async ({
    context,
    page,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
    await useLowCookWeek(page);
    await page.getByTestId('week-shopping-open').click();
    const dlg = page.getByTestId('week-shopping-dialog');
    await expect(dlg).toBeVisible();
    // The lead names the Sunday batches, the weekday jobs and the ready food.
    for (const name of [
      /Chicken tray bake/,
      /Chicken burrito bowl/,
      /Beef bolognese pasta/,
      /Queso batido parfait/,
      /Tuna and egg bocadillo/,
      /Banana oat smoothie/,
      /Chicken caesar salad/,
      /Vegetable crema/,
      /Microwave chana masala/,
      /Ready food your plan puts on the days/,
    ]) {
      await expect(dlg).toContainText(name);
    }
    const items = await dlg.locator('li').allInnerTexts();
    const lines = items.map(flat);
    for (const re of [...WEEKDAY_FOODS, ...READY_FOODS]) {
      expect(lines.filter((l) => re.test(l)).length, `${re} is on the list`).toBeGreaterThanOrEqual(
        1,
      );
    }
    // Each food once: no two lines start with the same name.
    const names = lines.map((l) => l.split(':')[0].trim().toLowerCase());
    expect(new Set(names).size, `each food once: ${names.join(', ')}`).toBe(names.length);

    // Copy shows "Copied" on the button itself (not only in a hidden live region).
    const copy = dlg.getByTestId('week-shopping-copy');
    await expect(copy).toHaveText('Copy list');
    await copy.click();
    await expect(copy).toHaveText('Copied');
    const text = await page.evaluate(() => navigator.clipboard.readText()).catch(() => null);
    if (text !== null) {
      expect(text).toContain('Tuna');
      expect(text).toContain('Pear');
    }
  });

  test('the plan card has its own shopping list with the same foods', async ({ context, page }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
    const card = await useLowCookWeek(page);
    await card.getByTestId('plan-shopping').click();
    const dlg = page.getByTestId('plan-shopping-dialog');
    await expect(dlg).toBeVisible();
    await expect(dlg).toContainText('Shopping: Low-cook week');
    const lines = (await dlg.locator('li').allInnerTexts()).map(flat);
    for (const re of [...WEEKDAY_FOODS, ...READY_FOODS]) {
      expect(lines.filter((l) => re.test(l)).length, `${re} is on the list`).toBeGreaterThanOrEqual(
        1,
      );
    }
    await expect(dlg.getByTestId('plan-shopping-copy')).toHaveText('Copy list');
    await dlg.getByTestId('plan-shopping-copy').click();
    await expect(dlg.getByTestId('plan-shopping-copy')).toHaveText('Copied');
  });
});

test.describe("M5 the plan's merienda is in Merienda", () => {
  test('Mon 17:30: the planned yogurt, banana, kinnow and almonds are in Merienda, Snacks is empty', async ({
    page,
  }) => {
    await useLowCookWeek(page);
    await timeTravel(page, at('19', '17:30'), '/#/day');
    const merienda = ui.slot(page, 'evening');
    await expect(merienda.getByRole('heading', { name: /Merienda/ })).toBeVisible();
    const snackItems = LOW.days[0].items.filter((i) => i.slot === 'snacks');
    expect(snackItems.length).toBe(4);
    await expect(ui.entries(merienda)).toHaveCount(snackItems.length);
    for (const item of snackItems) {
      await expect(
        merienda.locator(`[data-testid="entry"][data-food-id="${item.foodId}"]`),
      ).toHaveCount(1);
    }
    await expect(ui.entries(ui.slot(page, 'snacks'))).toHaveCount(0);
    await expect(merienda).not.toContainText('Nothing yet');
    // Saved that way too: no plan entry kept the old 'snacks' slot.
    const doc = await savedDoc(page);
    const all = Object.values(doc.days).flatMap((d) => d.entries);
    expect(all.filter((e) => e.slot === 'snacks')).toEqual([]);
  });

  test('a ready pick for the afternoon goes to Merienda too', async ({ page }) => {
    await useLowCookWeek(page);
    await timeTravel(page, at('19', '17:30'), '/#/prep');
    const row = page.locator('[data-testid="ready-row"][data-slot="snacks"]');
    await expect(row).toBeVisible();
    const before = await savedDoc(page);
    const count = (d) =>
      (d.days['2026-10-19']?.entries ?? []).filter((e) => e.slot === 'evening').length;
    await row.getByTestId('ready-pick').first().click();
    await expect(ui.undo(page)).toBeVisible();
    const doc = await saved(page, (d) => count(d) > count(before), 'the pick is saved');
    expect((doc.days['2026-10-19'].entries ?? []).filter((e) => e.slot === 'snacks')).toEqual([]);
    await page.goto('/#/day');
    await expect(ui.entries(ui.slot(page, 'snacks'))).toHaveCount(0);
    await expect(ui.entries(ui.slot(page, 'evening'))).not.toHaveCount(0);
  });
});

/** Friday 23 Oct, 09:00: a cafe con leche is eaten; then the clock moves to the afternoon. */
async function fridayAfternoon(page, { plan }) {
  if (plan) await useLowCookWeek(page);
  else {
    await seed(page, setUpDoc());
    await setClock(page, SUN);
  }
  await timeTravel(page, at('23', '09:00'), '/#/day');
  await ui.addFood(page).click();
  await ui.search(page).fill('cafe con leche');
  await ui.foodRows(ui.results(page)).first().locator('.btn-plus').click();
  await page.keyboard.press('Escape');
  await saved(
    page,
    (d) => (d.days['2026-10-23']?.entries ?? []).some((e) => e.status === 'eaten'),
    'the coffee is eaten',
  );
  await timeTravel(page, at('23', '16:45'), '/#/day');
}

test.describe('M6 the protein tip with a plan on', () => {
  test('Fri 16:45 with the Low-cook week on: the tip shows, counting only what was eaten', async ({
    page,
  }) => {
    await fridayAfternoon(page, { plan: true });
    const tip = page.getByTestId('protein-tip');
    await expect(tip).toBeVisible();
    // 4.3 g eaten (the coffee) of the 161 g target: the planned meals do not count as eaten.
    await expect(tip).toContainText(/Protein today: 4\.\d g of 161 g/);
    await expect(tip).toContainText('Merienda');
    expect(await tip.getByTestId('tip-idea').count()).toBeGreaterThanOrEqual(2);
    await expect(ui.plannedTotal(page)).toBeVisible();
  });

  test('without a plan the same day shows the same tip', async ({ page }) => {
    await fridayAfternoon(page, { plan: false });
    await expect(page.getByTestId('protein-tip')).toContainText(/Protein today: 4\.\d g of 161 g/);
  });
});

test.describe('tip-add: one tap adds the idea, with Undo', () => {
  test('Add on a tip idea puts it in Merienda at once; Undo takes it back', async ({ page }) => {
    await fridayAfternoon(page, { plan: false });
    const tip = page.getByTestId('protein-tip');
    await expect(tip).toBeVisible();
    const merienda = ui.slot(page, 'evening');
    await expect(ui.entries(merienda)).toHaveCount(0);
    await tip.getByTestId('tip-add').first().click();
    // One tap: no portion picker opens, the food is in Merienda, and the toast offers Undo.
    await expect(ui.picker(page)).toHaveCount(0);
    await expect(ui.entries(merienda)).toHaveCount(1);
    await expect(ui.undo(page)).toContainText(/Added .+ to Merienda/);
    await expect(ui.undo(page).getByRole('button', { name: 'Undo' })).toBeVisible();
    await ui.undo(page).getByRole('button', { name: 'Undo' }).click();
    await expect(ui.entries(merienda)).toHaveCount(0);
  });

  test('tapping the idea row (not Add) still opens the portion picker', async ({ page }) => {
    await fridayAfternoon(page, { plan: false });
    await page.getByTestId('protein-tip').getByTestId('tip-idea').first().click();
    await expect(ui.picker(page)).toBeVisible();
  });
});

// ===================================================================== time notes (M-17, Bilal R3)

test.describe('timeNote reaches the screen (M-17)', () => {
  const TIKKA = 'pk-chicken-tikka-rice-box';
  const CHAAT = 'pk-chicken-chana-chaat-box';
  const row = (page, id) => page.locator(`[data-testid="library-row"][data-food-id="${id}"]`);
  const openPrep = async (page) => {
    await seed(page, setUpDoc());
    await setClock(page, SUN);
    await page.goto('/#/prep');
    await expect(page.getByTestId('library-row').first()).toBeVisible();
  };

  test('prep-time-note: the chicken tikka row says to start the night before, not just "40 min"', async ({
    page,
  }) => {
    await openPrep(page);
    const r = row(page, TIKKA);
    await expect(r.getByTestId('prep-time-note')).toContainText(/Start the night before/i);
    await expect(r.getByTestId('prep-time-note')).toContainText(/marinate/i);
  });

  test('prep-time-later: the chana chaat row shows its "Later, ..." part', async ({ page }) => {
    await openPrep(page);
    await expect(row(page, CHAAT).getByTestId('prep-time-later')).toContainText(/^Later, /);
    await expect(row(page, CHAAT).getByTestId('prep-time-later')).toContainText(/Tuesday night/);
  });

  test('recipe-time: the "How to make it" sheet shows the full note, with the marinade', async ({
    page,
  }) => {
    await openPrep(page);
    await row(page, TIKKA).getByTestId('library-method').click();
    const dlg = page.getByTestId('method-dialog');
    await expect(dlg).toBeVisible();
    await expect(dlg.getByTestId('recipe-time')).toContainText(/About 5 h 40 min start to finish/);
    await expect(dlg.getByTestId('recipe-time')).toContainText(/marinates at least 4 hours/);
  });

  test('cook-time-note: the Make dialog shows the same note, and the chaat dialog its "Later" part', async ({
    page,
  }) => {
    await openPrep(page);
    await row(page, TIKKA).getByTestId('library-cook').click();
    const dlg = page.getByTestId('cook-dialog');
    await expect(dlg.getByTestId('cook-time-note')).toContainText(/5 h 40 min start to finish/);
    await expect(dlg.getByTestId('cook-time-note')).toContainText(/marinates at least 4 hours/);
    await page.keyboard.press('Escape');
    await row(page, CHAAT).getByTestId('library-cook').click();
    await expect(page.getByTestId('cook-time-note')).toContainText(/Later, on Tuesday night/);
  });
});

test.describe('Week view tells planned from eaten (Bilal R3 a)', () => {
  test('a week that is only planned says "planned (not eaten yet)"; ticking a meal makes the day part-planned', async ({
    page,
  }) => {
    await useLowCookWeek(page);
    await timeTravel(page, at('21', '12:00'), '/#/week');
    const rows = ui.weekRows(page);
    await expect(rows).toHaveCount(7);
    const states = () => rows.evaluateAll((els) => els.map((e) => e.dataset.state));
    expect(await states()).toEqual([
      'planned',
      'planned',
      'planned',
      'planned',
      'planned',
      'empty',
      'empty',
    ]);
    await expect(rows.first().getByTestId('week-planned')).toHaveText('Planned');
    await expect(rows.first()).toHaveAttribute('aria-label', /, planned$/);
    await expect(page.getByTestId('week-average')).toContainText(
      'Average of 5 planned days (not eaten yet)',
    );

    // Tick one of Monday's meals: Monday is now partly planned, the average says how many are only planned.
    await page.goto('/#/day/2026-10-19');
    await ui
      .entries(ui.slot(page, 'breakfast'))
      .first()
      .getByRole('button', { name: /as eaten$/ })
      .click();
    await saved(
      page,
      (d) => d.days['2026-10-19'].entries.some((e) => e.status === 'eaten'),
      'a ticked meal',
    );
    await page.goto('/#/week');
    expect((await states())[0]).toBe('part');
    await expect(ui.weekRows(page).first().getByTestId('week-planned')).toHaveText('Part planned');
    await expect(page.getByTestId('week-average')).toContainText(
      'Average of 5 days (4 only planned so far)',
    );
  });
});

test.describe('Fridge / Freezer buttons are thumb-sized (Bilal R3 d)', () => {
  const expectBig = async (buttons, what) => {
    const n = await buttons.count();
    expect(n, `${what}: buttons found`).toBeGreaterThan(0);
    for (let i = 0; i < n; i += 1) {
      const box = await buttons.nth(i).boundingBox();
      expect(box.height, `${what} #${i} height`).toBeGreaterThanOrEqual(44);
      expect(box.width, `${what} #${i} width`).toBeGreaterThanOrEqual(44);
    }
  };

  test('on the batch card and in the Make dialog, every Fridge and Freezer button is at least 44 x 44 px', async ({
    page,
  }) => {
    await useLowCookWeek(page);
    const card = page.getByTestId('batch-card').filter({ hasText: /bolognese/i });
    await card.scrollIntoViewIfNeeded();
    await expectBig(card.getByRole('button', { name: /^(Fridge|Freezer)$/ }), 'batch card');

    await page
      .locator('[data-testid="library-row"][data-food-id="pk-chicken-tikka-rice-box"]')
      .getByTestId('library-cook')
      .click();
    const dlg = page.getByTestId('cook-dialog');
    await expect(dlg).toBeVisible();
    await expectBig(dlg.getByRole('button', { name: /^(Fridge|Freezer)$/ }), 'Make dialog');
  });
});

test.describe('search order (Bilal R3 e)', () => {
  /** The food ids of the first results for a query typed in the add sheet. */
  const ids = async (page, q, n = 4) => {
    await ui.search(page).fill(q);
    await expect(ui.foodRows(ui.results(page)).first()).toBeVisible();
    const rows = await ui
      .foodRows(ui.results(page))
      .evaluateAll((els, max) => els.slice(0, max).map((e) => e.dataset.foodId), n);
    return rows;
  };
  const openAdd = async (page) => {
    await seed(page, setUpDoc());
    await setClock(page, at('19', '12:00'));
    await page.goto('/#/day');
    await ui.addFood(page).click();
    await expect(ui.sheet(page)).toBeVisible();
  };

  test('"kela" finds Banana first and nothing else fills in after it', async ({ page }) => {
    await openAdd(page);
    expect(await ids(page, 'kela')).toEqual(['intl-banana']);
  });

  test('"salad" puts the plain salad leaves first, then kachumber, then the Spanish mixed salad', async ({
    page,
  }) => {
    await openAdd(page);
    const found = await ids(page, 'salad', 3);
    expect(found).toEqual(['intl-salad-leaves-mixed', 'intl-salad-kachumber', 'es-ensalada-mixta']);
    // The banana smoothie jar (a Prep box) must not outrank them for "salad" either.
    expect(found).not.toContain('intl-banana-oat-smoothie-jar');
  });

  test('"pulpo" finds the octopus and nothing unrelated', async ({ page }) => {
    await openAdd(page);
    expect(await ids(page, 'pulpo')).toEqual(['es-pulpo-cocido']);
  });
});

// ===================================================================== the profile form needs a goal (Ayesha, rules 1.7.3)

test.describe('the profile form asks for a goal', () => {
  const fillBody = async (page) => {
    await page.getByRole('radio', { name: 'Man', exact: true }).check();
    await page.getByRole('textbox', { name: 'Age' }).fill('31');
    await page.getByRole('textbox', { name: 'Height' }).fill('178');
    await page.getByRole('textbox', { name: 'Weight' }).fill('82');
  };

  test('no goal is preselected; submitting without one shows "Please choose what you want." and focuses the goal', async ({
    page,
  }) => {
    await setClock(page, at('19', '12:00'));
    await page.goto('/#/welcome');
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    const goal = page.locator('[data-field="goal"]');
    await expect(goal.getByRole('radio')).toHaveCount(3);
    await expect(goal.getByRole('radio', { checked: true })).toHaveCount(0);
    await fillBody(page);
    await page.getByRole('button', { name: 'See my targets' }).click();

    const error = goal.locator('.field-error');
    await expect(error).toBeVisible();
    await expect(error).toHaveText('Please choose what you want.');
    // The numbers were fine, so the first problem is the goal and the focus goes to it.
    await expect(goal.getByRole('radio').first()).toBeFocused();
    await expect(page.getByTestId('targets-result')).toHaveCount(0);

    // Choosing one clears the error and the form goes through.
    await goal.getByRole('radio', { name: 'Lose weight' }).check();
    await expect(error).toBeHidden();
    await page.getByRole('button', { name: 'See my targets' }).click();
    await expect(page.getByTestId('targets-result')).toBeVisible();
    await expect(page.getByTestId('target-kcal')).toBeVisible();
  });

  test('a number problem is reported first, and the goal error shows alongside it', async ({
    page,
  }) => {
    await setClock(page, at('19', '12:00'));
    await page.goto('/#/welcome');
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await page.getByRole('radio', { name: 'Man', exact: true }).check();
    await page.getByRole('textbox', { name: 'Age' }).fill('31');
    await page.getByRole('textbox', { name: 'Height' }).fill('178');
    // weight left empty
    await page.getByRole('button', { name: 'See my targets' }).click();
    await expect(page.getByRole('textbox', { name: 'Weight' })).toBeFocused();
    await expect(page.locator('[data-field="goal"] .field-error')).toHaveText(
      'Please choose what you want.',
    );
  });
});
