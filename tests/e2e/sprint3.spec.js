// Sprint 3 wave 1 in the browser, on the real Lab data: the weight log and trend (Profile and Week), the Day
// view's spare-box line, the meal-name choice on the welcome screen, the cuisine chips in the Prep library, and
// "How to make it" with its step mode. Written from Meeting 005, ARCHITECTURE section 14 and 13.1 and the
// RULES texts, with hand-worked values. The same rules as units: tests/unit/qa/sprint3-weight.test.js,
// sprint3-wave1.test.js and method-contract.test.js. Owner: Kenji.
// Test ids read: weight-card/-input/-save/-error/-row/-edit/-delete/-empty/-trend/-rate/-too-few/-chart,
// weight-day-yesterday, weight-suggestion(-accept/-dismiss), week-weight, spare-box/-more/-discard/-plan/
// -to-fridge, spare-plan-today-<slot>, meal-names(-spain/-default), library-row/-cuisine/-filter/-empty/
// -method/-cook, cook-method, method-dialog, method-steps(-open), method-step, step-heat, step-minutes,
// method-done/-boxup/-reheat, method-stepper, stepper-count/-text/-next/-back/-close.
import { FOODS, RULES } from '../../app/data/index.js';
import RECIPES from '../../app/data/recipes-mealprep.js';
import { test, expect, seed, setUpDoc, userDoc, setClock, savedDoc, ui } from './_app.js';

const NOON = '2026-10-14T12:00:00+02:00'; // Wednesday 14 Oct 2026, Madrid
const TODAY = '2026-10-14';
const plus = (iso, n) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const foodById = (id) => {
  const f = FOODS.find((x) => x.id === id);
  if (!f) throw new Error(`test data: no food ${id}`);
  return f;
};
const MINUS = '−'; // the app writes a real minus sign

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

/** { 'YYYY-MM-DD': { kg } } from [dayOffsetFromStart, kg] pairs. */
const logOf = (start, pairs) =>
  Object.fromEntries(pairs.map(([n, kg]) => [plus(start, n), { kg }]));
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

// ===================================================================== weight log: add, edit, delete

test.describe('weight log (Profile)', () => {
  test.beforeEach(async ({ page }) => {
    await seed(page, setUpDoc());
    await setClock(page, NOON);
    await page.goto('/#/profile');
    await expect(page.getByTestId('weight-card')).toBeVisible();
  });

  const card = (page) => page.getByTestId('weight-card');
  const rows = (page) => card(page).getByTestId('weight-row');
  const rowOf = (page, date) =>
    card(page).locator(`[data-testid="weight-row"][data-date="${date}"]`);
  const save = async (page, text) => {
    await card(page).getByTestId('weight-input').fill(text);
    await card(page).getByTestId('weight-save').click();
  };

  test('add: an empty log says so; a weight is saved for today, shown in the list and stored once a day', async ({
    page,
  }) => {
    await expect(card(page).getByTestId('weight-empty')).toHaveText('No weights yet.');
    await expect(card(page).getByTestId('weight-trend')).toHaveCount(0);
    await save(page, '82.4');
    await expect(card(page).getByRole('status')).toHaveText('Saved 82.4 kg for today.');
    await expect(rows(page)).toHaveCount(1);
    await expect(rowOf(page, TODAY)).toContainText('82.4 kg');
    await expect(card(page).getByTestId('weight-empty')).toHaveCount(0);
    let doc = await saved(page, (d) => d.weightLog?.[TODAY]?.kg === 82.4, 'today 82.4');
    expect(Object.keys(doc.weightLog)).toEqual([TODAY]);
    // The same day again replaces it: one entry per day.
    await save(page, '82');
    await expect(rows(page)).toHaveCount(1);
    await expect(rowOf(page, TODAY)).toContainText('82.0 kg');
    doc = await saved(page, (d) => d.weightLog?.[TODAY]?.kg === 82, 'today replaced by 82');
    expect(Object.keys(doc.weightLog)).toEqual([TODAY]);
    // A comma is a decimal point for people who type 82,6.
    await save(page, '82,6');
    await expect(rowOf(page, TODAY)).toContainText('82.6 kg');
  });

  test('add: a past day through the Yesterday chip, newest first in the list', async ({ page }) => {
    await save(page, '82.0');
    await card(page).getByTestId('weight-day-yesterday').click();
    await expect(card(page).getByTestId('weight-day-yesterday')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(card(page).getByText('Weight on yesterday')).toBeVisible();
    await save(page, '83.1');
    await expect(rows(page)).toHaveCount(2);
    expect(await rows(page).evaluateAll((els) => els.map((e) => e.dataset.date))).toEqual([
      TODAY,
      plus(TODAY, -1),
    ]);
    await expect(rowOf(page, plus(TODAY, -1))).toContainText('83.1 kg');
    await saved(
      page,
      (d) => d.weightLog?.[plus(TODAY, -1)]?.kg === 83.1 && d.weightLog?.[TODAY]?.kg === 82,
      'both days',
    );
  });

  test('edit: tapping a row loads it, saving changes that day only', async ({ page }) => {
    const y = plus(TODAY, -1);
    await save(page, '82.0');
    await card(page).getByTestId('weight-day-yesterday').click();
    await save(page, '83.1');
    await rowOf(page, y).getByTestId('weight-edit').click();
    await expect(card(page).getByTestId('weight-input')).toHaveValue('83.1');
    await save(page, '83.3');
    await expect(rows(page)).toHaveCount(2);
    await expect(rowOf(page, y)).toContainText('83.3 kg');
    await expect(rowOf(page, TODAY)).toContainText('82.0 kg');
    await saved(
      page,
      (d) => d.weightLog?.[y]?.kg === 83.3 && d.weightLog?.[TODAY]?.kg === 82,
      'edit saved',
    );
  });

  test('refused: empty, below 30 kg and above 250 kg say why, and nothing is stored', async ({
    page,
  }) => {
    const error = card(page).getByTestId('weight-error');
    await save(page, '');
    await expect(error).toHaveText('Type your weight.');
    await save(page, '10');
    await expect(error).toHaveText('Type a weight from 30 to 250 kg.');
    await save(page, '300');
    await expect(error).toHaveText('Type a weight from 30 to 250 kg.');
    await save(page, 'abc');
    await expect(error).toBeVisible();
    await expect(rows(page)).toHaveCount(0);
    expect((await savedDoc(page))?.weightLog ?? {}).toEqual({});
    await save(page, '30');
    await expect(error).toBeHidden();
    await expect(rowOf(page, TODAY)).toContainText('30.0 kg');
  });

  test('delete: the row goes, Undo brings it back, and it survives a reload', async ({ page }) => {
    const y = plus(TODAY, -1);
    await save(page, '82.0');
    await card(page).getByTestId('weight-day-yesterday').click();
    await save(page, '83.1');
    await rowOf(page, y).getByTestId('weight-delete').click();
    await expect(rows(page)).toHaveCount(1);
    await expect(rowOf(page, y)).toHaveCount(0);
    await saved(page, (d) => !d.weightLog?.[y] && d.weightLog?.[TODAY]?.kg === 82, 'deleted');
    await ui.undo(page).getByRole('button', { name: 'Undo' }).click();
    await expect(rows(page)).toHaveCount(2);
    await expect(rowOf(page, y)).toContainText('83.1 kg');
    await page.reload();
    await expect(rows(page)).toHaveCount(2);
    await rowOf(page, TODAY).getByTestId('weight-delete').click();
    await rowOf(page, y).getByTestId('weight-delete').click();
    await expect(card(page).getByTestId('weight-empty')).toBeVisible();
  });
});

test('weight log: pounds are typed and shown in lb, and stored in kg (180 lb = 81.647 kg)', async ({
  page,
}) => {
  await seed(page, setUpDoc({ settings: { units: { weight: 'lb', height: 'cm' } } }));
  await setClock(page, NOON);
  await page.goto('/#/profile');
  const card = page.getByTestId('weight-card');
  await card.getByTestId('weight-input').fill('180');
  await card.getByTestId('weight-save').click();
  await expect(card.getByTestId('weight-row')).toContainText('180.0 lb');
  // 180 x 0.45359237 = 81.6466...
  const doc = await saved(
    page,
    (d) => Math.abs((d.weightLog?.[TODAY]?.kg ?? 0) - 81.647) < 0.0015,
    '81.647 kg',
  );
  expect(Object.keys(doc.weightLog)).toEqual([TODAY]);
  await card.getByTestId('weight-input').fill('600');
  await card.getByTestId('weight-save').click();
  await expect(card.getByTestId('weight-error')).toContainText(
    /Type a weight from \d+ to \d+ lb\./,
  );
});

// ===================================================================== the trend line

test.describe('weight trend', () => {
  test('before 5 readings over a week: "Latest", the Lab\'s "too few" sentence, no rate; the 8th reading turns the trend on', async ({
    page,
  }) => {
    // 7 daily readings of 80 kg (7 Oct to 13 Oct): 7 entries but only 6 days apart.
    await seed(
      page,
      setUpDoc({
        weightLog: logOf(
          '2026-10-07',
          range(0, 6).map((n) => [n, 80]),
        ),
      }),
    );
    await setClock(page, NOON);
    await page.goto('/#/profile');
    const card = page.getByTestId('weight-card');
    await expect(card.getByTestId('weight-trend')).toHaveText('Latest 80.0 kg');
    await expect(card.getByTestId('weight-too-few')).toContainText(
      'after 5 weigh-ins across a week',
    );
    await expect(card.getByTestId('weight-rate')).toHaveCount(0);
    // Today 79.0: 8 readings over 7 days. EMA, alpha 0.1 a day: 80 stays 80 for 7 days, then 80 + 0.1 x (79 - 80) = 79.9.
    await card.getByTestId('weight-input').fill('79');
    await card.getByTestId('weight-save').click();
    await expect(card.getByTestId('weight-trend')).toHaveText('Trend 79.9 kg · latest 79.0 kg');
    await expect(card.getByTestId('weight-too-few')).toHaveCount(0);
    await expect(card.getByTestId('weight-rate')).toHaveCount(0);
    await expect(card.getByTestId('weight-chart')).toBeVisible();
    // A weight is only ever words: no target moved.
    expect((await savedDoc(page)).targetOverrides ?? {}).toEqual({});
  });

  test('a falling line shows its weekly rate: 16 days at -0.1 kg a day is -0.7 kg a week, in Profile and on Week', async ({
    page,
  }) => {
    // 29 Sep to 14 Oct, 80.0 down to 78.5. Least squares slope -0.1 a day x 7 = -0.7; window span 15 days = 2 weeks.
    const log = logOf(
      '2026-09-29',
      range(0, 15).map((n) => [n, Number((80 - 0.1 * n).toFixed(1))]),
    );
    await seed(page, setUpDoc({ weightLog: log }));
    await setClock(page, NOON);
    await page.goto('/#/profile');
    const rate = `Trend: ${MINUS}0.7 kg a week over the last 2 weeks.`;
    await expect(page.getByTestId('weight-card').getByTestId('weight-rate')).toHaveText(rate);
    await expect(page.getByTestId('weight-card').getByTestId('weight-trend')).toContainText(
      'latest 78.5 kg',
    );
    // 16 readings over 15 days is not yet the 21 days a suggestion needs.
    await expect(page.getByTestId('weight-suggestion')).toHaveCount(0);
    await page.goto('/#/week');
    const week = page.getByTestId('week-weight');
    await expect(week).toBeVisible();
    await expect(week.getByTestId('weight-rate')).toHaveText(rate);
    await expect(week.getByTestId('weight-chart')).toBeVisible();
    await expect(week.getByTestId('weight-suggestion')).toHaveCount(0);
  });

  test('Week with no weights points to Profile; the unit follows the setting', async ({ page }) => {
    await seed(page, setUpDoc());
    await setClock(page, NOON);
    await page.goto('/#/week');
    const week = page.getByTestId('week-weight');
    await expect(week).toContainText('No weights yet.');
    await expect(week.getByRole('link', { name: 'Add your weight in Profile' })).toBeVisible();
  });
});

// ===================================================================== the suggestion: only on a tap

test.describe('weight suggestion', () => {
  // P1 (lose 0.5 kg a week) who has stayed at 82.0 kg for 23 days: the trend is flat, the goal is -0.5, so the
  // rate is 0.5 kg a week too high and the app may suggest eating a little less. It never does it by itself.
  const flat = () =>
    logOf(
      '2026-09-22',
      range(0, 22).map((n) => [n, 82]),
    );
  const open = async (page) => {
    await seed(page, setUpDoc({ weightLog: flat() }));
    await setClock(page, NOON);
    await page.goto('/#/profile');
    await expect(page.getByTestId('weight-card')).toBeVisible();
  };

  test("shown in Profile with the Lab's words and two buttons; reading it and logging weights change no target", async ({
    page,
  }) => {
    await open(page);
    const s = page.getByTestId('weight-suggestion');
    await expect(s).toBeVisible();
    await expect(s).toContainText('Your trend is');
    await expect(s.getByTestId('weight-suggestion-accept')).toHaveText(/^Use [\d,.]+ kcal$/);
    await expect(s.getByTestId('weight-suggestion-dismiss')).toHaveText('Not now');
    await page.getByTestId('weight-input').fill('82.1');
    await page.getByTestId('weight-save').click();
    await page.goto('/#/week');
    await expect(page.getByTestId('week-weight').getByTestId('weight-suggestion')).toHaveCount(0);
    const doc = await savedDoc(page);
    expect(doc.targetOverrides ?? {}).toEqual({});
  });

  test('"Not now" hides it and records the day; still hidden after a reload', async ({ page }) => {
    await open(page);
    await page.getByTestId('weight-suggestion-dismiss').click();
    await expect(page.getByTestId('weight-suggestion')).toHaveCount(0);
    const doc = await saved(
      page,
      (d) => d.settings?.weightSuggestDismissedOn === TODAY,
      'dismissed today',
    );
    expect(doc.targetOverrides ?? {}).toEqual({});
    await page.reload();
    await expect(page.getByTestId('weight-card')).toBeVisible();
    await expect(page.getByTestId('weight-suggestion')).toHaveCount(0);
  });

  test('"Use N kcal" sets the kcal target to exactly N, the card goes quiet, Undo puts the old target back', async ({
    page,
  }) => {
    await open(page);
    const label = await page.getByTestId('weight-suggestion-accept').innerText();
    const n = Number(label.replace(/[^\d]/g, ''));
    expect(n).toBeGreaterThan(1200);
    expect(n).not.toBe(2210); // P1's own target (NUTRITION 2.2): a suggestion is a change
    expect(Math.abs(n - 2210)).toBeLessThanOrEqual(200); // at most 200 kcal a time
    expect(Math.abs(n - 2210) % 50).toBe(0); // in steps of 50 kcal
    await page.getByTestId('weight-suggestion-accept').click();
    await expect(page.getByTestId('weight-suggestion')).toHaveCount(0);
    const doc = await saved(page, (d) => d.targetOverrides?.kcal === n, `kcal override ${n}`);
    expect(doc.profile.weightKg).toBe(82); // the profile itself is untouched
    await ui.undo(page).getByRole('button', { name: 'Undo' }).click();
    await saved(page, (d) => d.targetOverrides?.kcal === undefined, 'override removed by Undo');
  });
});

// ===================================================================== spare-box line on the Day view

test.describe('spare-box line (Day)', () => {
  // A meat-and-rice prep: rice gives the shortest fridge life (RULES.mealPrep.storage cooked-starch = 1 day), so
  // a box cooked on 12 Oct has its use-by on 13 Oct: "soon" on the 12th, "last day" on the 13th, "past" on the 14th.
  const recipe = RECIPES.find((r) => r.storage.length === 2 && r.storage.includes('cooked-starch'));
  const food = foodById(recipe.foodId);
  const dish = food.shortName || food.name;
  const word = food.servings.find((s) => s.default)?.id; // box, jar or portion
  const Word = `${word.charAt(0).toUpperCase()}${word.slice(1)}`;
  const batch = (id, cookedOn, storages, extra = {}) => ({
    id,
    recipeId: food.id,
    name: food.name,
    cookedOn,
    boxes: storages.map((storage, i) => ({
      id: `${id}-${i + 1}`,
      storage,
      movedToFridgeOn: null,
      placed: null,
      status: 'available',
      ...extra,
    })),
  });
  const line = (page) => page.getByTestId('spare-box');
  const open = async (page, batches, now = NOON) => {
    await seed(page, userDoc({ settings: { slotPreset: 'spain' }, batches }));
    await setClock(page, now);
    await page.goto('/#/day');
    await expect(ui.dayTitle(page)).toBeVisible();
  };

  test('the three calm lines: good until tomorrow, last day today, past its use-by', async ({
    page,
  }) => {
    expect(word).toMatch(/^(box|jar|portion)$/);
    expect(RULES.mealPrep.storage.find((s) => s.id === 'cooked-starch').fridgeDays).toBe(1);
    // cooked 14 Oct, the day itself: use-by 15 Oct
    await open(page, [batch('b1', '2026-10-14', ['fridge'])]);
    await expect(line(page)).toHaveAttribute('data-kind', 'soon');
    await expect(line(page)).toContainText(`${Word} 1 of ${dish} is good until tomorrow.`);
    await page.close();
  });

  test('last day', async ({ page }) => {
    await open(page, [batch('b1', '2026-10-13', ['fridge'])]);
    await expect(line(page)).toHaveAttribute('data-kind', 'last-day');
    await expect(line(page)).toContainText(`${Word} 1 of ${dish}: today is its last day.`);
    await expect(line(page).getByTestId('spare-plan')).toBeVisible();
    await expect(line(page).getByTestId('spare-discard')).toHaveCount(0);
  });

  test('past its use-by: says so, offers Discard only, and Discard removes the line and marks the box thrown away', async ({
    page,
  }) => {
    await open(page, [batch('b1', '2026-10-12', ['fridge'])]);
    await expect(line(page)).toHaveAttribute('data-kind', 'past');
    await expect(line(page)).toContainText(
      `${Word} 1 of ${dish} is past its use-by. Best not to eat it.`,
    );
    await expect(line(page).getByTestId('spare-plan')).toHaveCount(0);
    await line(page).getByTestId('spare-discard').click();
    await expect(line(page)).toHaveCount(0);
    await saved(page, (d) => d.batches[0].boxes[0].status === 'discarded', 'box discarded');
    await page.reload();
    await expect(ui.dayTitle(page)).toBeVisible();
    await expect(line(page)).toHaveCount(0);
  });

  test('nothing to say: a fresh box, a freezer box cooked yesterday, an eaten and a discarded box', async ({
    page,
  }) => {
    await open(
      page,
      [
        batch('fresh', '2026-10-14', ['fridge']).boxes.length
          ? { ...batch('fresh', '2026-10-15', ['fridge']) }
          : null,
        batch('frozen', '2026-10-13', ['freezer', 'freezer']),
        batch('done', '2026-10-01', ['fridge', 'fridge']).boxes.length
          ? {
              ...batch('done', '2026-10-01', ['fridge', 'fridge']),
              boxes: [
                {
                  id: 'done-1',
                  storage: 'fridge',
                  movedToFridgeOn: null,
                  placed: null,
                  status: 'eaten',
                },
                {
                  id: 'done-2',
                  storage: 'fridge',
                  movedToFridgeOn: null,
                  placed: null,
                  status: 'discarded',
                },
              ],
            }
          : null,
      ].filter(Boolean),
    );
    await expect(line(page)).toHaveCount(0);
  });

  test('two spare boxes: the most urgent one shows, "1 more in Prep" links to Prep', async ({
    page,
  }) => {
    await open(page, [
      batch('late', '2026-10-13', ['fridge']), // last day today
      batch('old', '2026-10-10', ['fridge']), // past
    ]);
    await expect(line(page)).toHaveAttribute('data-kind', 'past'); // past before last-day
    const more = line(page).getByTestId('spare-more');
    await expect(more).toHaveText('1 more in Prep');
    await more.click();
    await expect(page).toHaveURL(/#\/prep$/);
  });

  test('a frozen batch with no day planned after a week: one line for the batch, "Move to fridge" starts the clock', async ({
    page,
  }) => {
    await open(page, [batch('ice', '2026-10-04', ['freezer', 'freezer'])]); // cooked 10 days ago
    await expect(line(page)).toHaveAttribute('data-kind', 'frozen');
    await expect(line(page)).toContainText(
      `2 ${word === 'box' ? 'boxes' : `${word}s`} of ${dish} are in the freezer with no day planned.`,
    );
    await line(page).getByTestId('spare-to-fridge').click();
    // Box 1 is now a fridge box moved today: use-by tomorrow (RULES.mealPrep.thawedFridgeDays = 1).
    await expect(line(page)).toHaveAttribute('data-kind', 'soon');
    await expect(line(page)).toContainText(`${Word} 1 of ${dish} is good until tomorrow.`);
    await saved(
      page,
      (d) =>
        d.batches[0].boxes[0].storage === 'fridge' &&
        d.batches[0].boxes[0].movedToFridgeOn === TODAY,
      'box 1 moved today',
    );
  });

  test('"Plan it" puts the box on a meal today, and the line goes away', async ({ page }) => {
    await open(page, [batch('b1', '2026-10-13', ['fridge'])]);
    await line(page).getByTestId('spare-plan').click();
    await page.getByTestId('spare-plan-today-lunch').click();
    await expect(line(page)).toHaveCount(0);
    const lunch = ui.slot(page, 'lunch');
    await expect(ui.entries(lunch)).toHaveCount(1);
    await expect(ui.entries(lunch)).toContainText(food.shortName || food.name);
    // An entry added to today is logged as eaten (the store's statusForAdd), and the box follows its entry.
    const doc = await saved(
      page,
      (d) => d.batches[0].boxes[0].placed?.date === TODAY,
      'box placed on today',
    );
    const entry = doc.days[TODAY].entries.find((e) => e.boxRef?.boxId === 'b1-1');
    expect(entry.slot).toBe('lunch');
    expect(doc.batches[0].boxes[0].placed.entryId).toBe(entry.id);
    expect(doc.batches[0].boxes[0].status).toBe(entry.status === 'eaten' ? 'eaten' : 'placed');
  });

  test("only today's page carries the line, not yesterday's", async ({ page }) => {
    await open(page, [batch('b1', '2026-10-13', ['fridge'])]);
    await expect(line(page)).toBeVisible();
    await ui.prevDay(page).click();
    await expect(line(page)).toHaveCount(0);
  });
});

// ===================================================================== meal names on the welcome screen

test.describe('meal-name choice (welcome)', () => {
  const SPAIN = RULES.mealSlots.spain.map((s) => s.label);
  const PAK = RULES.mealSlots.default.map((s) => s.label);
  const SLOTS = ['breakfast', 'lunch', 'evening', 'dinner', 'snacks'];
  const names = (page) =>
    page
      .locator('[data-testid^="slot-"]')
      .evaluateAll((els) => els.map((el) => el.querySelector('h2, h3')?.textContent.trim()));

  test('a Madrid phone is offered the Spanish names, already chosen, with the Pakistani set one tap away', async ({
    page,
  }) => {
    await page.goto('/#/welcome');
    const box = page.getByTestId('meal-names');
    await expect(box).toBeVisible();
    await expect(box.getByText('What do you call your meals?')).toBeVisible();
    await expect(box.getByTestId('meal-names-spain').getByRole('radio')).toBeChecked();
    await expect(box.getByTestId('meal-names-default').getByRole('radio')).not.toBeChecked();
    // Each choice shows its four main names.
    await expect(box.getByTestId('meal-names-spain')).toContainText(
      'Breakfast / café · Lunch · Merienda · Dinner',
    );
    await expect(box.getByTestId('meal-names-default')).toContainText(
      'Nashta · Lunch · Shaam ki chai · Dinner',
    );
  });

  test('choosing Pakistani names and skipping shows them on the Day view, and they are kept', async ({
    page,
  }) => {
    await setClock(page, NOON);
    await page.goto('/#/welcome');
    await page.getByTestId('meal-names-default').click();
    await expect(page.getByTestId('meal-names-default').getByRole('radio')).toBeChecked();
    await page.getByRole('button', { name: 'Skip for now' }).click();
    await expect(ui.slot(page, 'lunch')).toBeVisible();
    expect(await names(page)).toEqual(PAK);
    await saved(page, (d) => d.settings?.slotLabels?.breakfast === PAK[0], 'names saved');
    await page.reload();
    await expect(ui.slot(page, 'lunch')).toBeVisible();
    expect(await names(page)).toEqual(PAK);
  });

  test('keeping the pre-chosen Spanish names changes nothing', async ({ page }) => {
    await setClock(page, NOON);
    await page.goto('/#/welcome');
    await page.getByRole('button', { name: 'Skip for now' }).click();
    await expect(ui.slot(page, 'lunch')).toBeVisible();
    expect(await names(page)).toEqual(SPAIN);
    for (const id of SLOTS) await expect(ui.slot(page, id)).toBeVisible();
  });

  test.describe('on a Karachi phone', () => {
    test.use({ timezoneId: 'Asia/Karachi' });
    test('the Pakistani names are the pre-chosen set', async ({ page }) => {
      await page.goto('/#/welcome');
      await expect(page.getByTestId('meal-names-default').getByRole('radio')).toBeChecked();
      await expect(page.getByTestId('meal-names-spain').getByRole('radio')).not.toBeChecked();
    });
  });
});

// ===================================================================== cuisine chips in the Prep library

test.describe('cuisine chips (Prep library)', () => {
  // The rows the library shows are the Lab's lunchbox foods; a cuisine is the recipe's tag.
  const LIBRARY_FOODS = FOODS.filter((f) => f.group === 'lunchbox' && !f.userRecipe);
  const recipeOf = (id) => RECIPES.find((r) => r.foodId === id);
  const cuisinesOf = (id) => {
    const c = recipeOf(id)?.cuisine;
    return (Array.isArray(c) ? c : [c]).filter(Boolean);
  };
  const noCook = (id) => {
    const e = recipeOf(id)?.effort;
    return e === 'assemble' || e === 'ready';
  };
  const TAGGED = new Set(LIBRARY_FOODS.flatMap((f) => cuisinesOf(f.id)));

  const open = async (page) => {
    await seed(page, userDoc({ settings: { slotPreset: 'spain' } }));
    await setClock(page, NOON);
    await page.goto('/#/prep');
    await expect(page.getByTestId('library-cuisine')).toBeVisible();
  };
  const shown = (page) =>
    page.getByTestId('library-row').evaluateAll((els) => els.map((e) => e.dataset.foodId).sort());

  test('the Lab tags the library: at least four cuisines, and the chip row shows them', async ({
    page,
  }) => {
    expect(TAGGED.size).toBeGreaterThanOrEqual(4);
    await open(page);
    const group = page.getByTestId('library-cuisine');
    await expect(group.getByRole('button', { name: 'All cuisines', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const chips = await group
      .getByRole('button')
      .evaluateAll((els) => els.map((e) => e.dataset.cuisine));
    expect(chips[0]).toBe('all');
    expect(new Set(chips.slice(1))).toEqual(TAGGED);
    // "All" shows every library row.
    expect(await shown(page)).toEqual(LIBRARY_FOODS.map((f) => f.id).sort());
  });

  test('each chip shows exactly the recipes with that tag, and "All cuisines" brings them all back', async ({
    page,
  }) => {
    await open(page);
    const group = page.getByTestId('library-cuisine');
    for (const id of TAGGED) {
      await group.locator(`[data-cuisine="${id}"]`).click();
      await expect(group.locator(`[data-cuisine="${id}"]`)).toHaveAttribute('aria-pressed', 'true');
      const want = LIBRARY_FOODS.filter((f) => cuisinesOf(f.id).includes(id))
        .map((f) => f.id)
        .sort();
      expect(want.length, `${id} has recipes`).toBeGreaterThan(0);
      expect(await shown(page), `chip ${id}`).toEqual(want);
    }
    await group.locator('[data-cuisine="all"]').click();
    expect(await shown(page)).toHaveLength(LIBRARY_FOODS.length);
  });

  test('a cuisine and Cook / No-cook combine; an empty combination says so and suggests All', async ({
    page,
  }) => {
    await open(page);
    const group = page.getByTestId('library-cuisine');
    const filter = page.getByTestId('library-filter');
    const combos = [...TAGGED].map((id) => ({
      id,
      cook: LIBRARY_FOODS.filter((f) => cuisinesOf(f.id).includes(id) && !noCook(f.id))
        .map((f) => f.id)
        .sort(),
      none: LIBRARY_FOODS.filter((f) => cuisinesOf(f.id).includes(id) && noCook(f.id))
        .map((f) => f.id)
        .sort(),
    }));
    const empty = [];
    for (const c of combos) {
      await group.locator(`[data-cuisine="${c.id}"]`).click();
      await filter.getByRole('button', { name: 'Cook', exact: true }).click();
      expect(await shown(page), `${c.id} + Cook`).toEqual(c.cook);
      await filter.getByRole('button', { name: /^No-cook/ }).click();
      expect(await shown(page), `${c.id} + No-cook`).toEqual(c.none);
      if (!c.none.length) empty.push(c.id);
      if (!c.cook.length) empty.push(c.id);
    }
    // The chips stay put while the filter changes (a cuisine never vanishes because of Cook / No-cook).
    expect(await group.getByRole('button').count()).toBe(TAGGED.size + 1);
    if (empty.length) {
      await group.locator(`[data-cuisine="${empty[0]}"]`).click();
      await expect(page.getByTestId('library-empty')).toContainText('preps yet. Try All.');
    }
  });
});

// ===================================================================== "How to make it" and the step mode

test.describe('How to make it (Prep library)', () => {
  const WITH = RECIPES.filter((r) => r.method);
  // A cooked prep with prep steps, heat chips and times: the full picture.
  const recipe = WITH.find(
    (r) =>
      (r.effort ?? 'cook') === 'cook' &&
      r.method.prep.length &&
      r.method.steps.length >= 5 &&
      r.method.steps.some((s) => s.minutes),
  );
  const food = foodById(recipe.foodId);
  const m = recipe.method;

  const open = async (page) => {
    await seed(page, userDoc({ settings: { slotPreset: 'spain' } }));
    await setClock(page, NOON);
    await page.goto('/#/prep');
    await expect(page.getByTestId('library-row').first()).toBeVisible();
  };
  const row = (page) => page.locator(`[data-testid="library-row"][data-food-id="${food.id}"]`);

  test('orphan check: exactly the recipes that have a method in the data show a "How to make it" link', async ({
    page,
  }) => {
    await open(page);
    const linked = await page.getByTestId('library-row').evaluateAll((els) =>
      els
        .filter((e) => e.querySelector('[data-testid="library-method"]'))
        .map((e) => e.dataset.foodId)
        .sort(),
    );
    expect(linked).toEqual(WITH.map((r) => r.foodId).sort());
    expect(WITH.length).toBeGreaterThanOrEqual(45);
  });

  test('the sheet lists the equipment, the prep, every step with its heat and time, and the three closing parts', async ({
    page,
  }) => {
    await open(page);
    // The sheet is titled with the name the row shows (the Prep list drops the "(lunch box)" brackets).
    const rowName = (await row(page).locator('.prep-name').innerText()).trim();
    await row(page).getByTestId('library-method').click();
    const dialog = page.getByTestId('method-dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'How to make it' })).toBeVisible();
    await expect(dialog.getByRole('heading', { name: rowName }).first()).toBeVisible();
    await expect(dialog.getByTestId('method-equipment').locator('li')).toHaveCount(
      m.equipment.length,
    );
    await expect(dialog.getByTestId('method-prep').locator('li')).toHaveCount(m.prep.length);
    await expect(dialog.getByTestId('method-prep')).toContainText(m.prep[0]);
    const steps = dialog.getByTestId('method-step');
    await expect(steps).toHaveCount(m.steps.length);
    for (const [i, s] of m.steps.entries()) {
      await expect(steps.nth(i)).toContainText(s.text);
      if (s.heat && s.heat !== 'none') {
        await expect(steps.nth(i).getByTestId('step-heat')).toHaveAttribute('data-heat', s.heat);
      }
      if (s.minutes) await expect(steps.nth(i).getByTestId('step-minutes')).toBeVisible();
    }
    if (m.doneWhen) await expect(dialog.getByTestId('method-done')).toContainText(m.doneWhen);
    await expect(dialog.getByTestId('method-boxup')).toContainText(m.boxUp);
    await expect(dialog.getByTestId('method-reheat')).toContainText(m.reheat);
    // The sheet can start the batch from here.
    await expect(dialog.getByTestId('method-action')).toBeVisible();
  });

  test('step by step: Before you start, Step 1 of n ... Step n of n, Finish; Back and Next walk it both ways', async ({
    page,
  }) => {
    await open(page);
    await row(page).getByTestId('library-method').click();
    await page.getByTestId('method-steps-open').click();
    const stepper = page.getByTestId('method-stepper');
    await expect(stepper).toBeVisible();
    const count = stepper.getByTestId('stepper-count');
    const text = stepper.getByTestId('stepper-text');
    const next = stepper.getByTestId('stepper-next');
    const back = stepper.getByTestId('stepper-back');
    const n = m.steps.length;
    await expect(count).toHaveText('Before you start');
    await expect(text).toContainText(m.prep[0]);
    await expect(back).toBeDisabled();
    await expect(next).toHaveText('Next');
    for (let i = 0; i < n; i++) {
      await next.click();
      await expect(count).toHaveText(`Step ${i + 1} of ${n}`);
      await expect(text).toContainText(m.steps[i].text);
      await expect(back).toBeEnabled();
    }
    // Back one and forward again: the same step.
    await back.click();
    await expect(count).toHaveText(`Step ${n - 1} of ${n}`);
    await expect(text).toContainText(m.steps[n - 2].text);
    await next.click();
    await expect(count).toHaveText(`Step ${n} of ${n}`);
    await next.click();
    await expect(count).toHaveText('Finish');
    await expect(text).toContainText(m.boxUp);
    await expect(text).toContainText(m.reheat);
    await expect(next).toHaveText('Done');
    // Back to the start with the keyboard, then through the first step with the arrow key.
    await back.click();
    await expect(count).toHaveText(`Step ${n} of ${n}`);
    await next.click();
    await next.click();
    await expect(stepper).toBeHidden();
    await expect(page.getByTestId('method-dialog')).toBeVisible(); // the sheet it was opened from is still there
  });

  test('step mode closes with the X, and the arrow keys move', async ({ page }) => {
    await open(page);
    await row(page).getByTestId('library-method').click();
    await page.getByTestId('method-steps-open').click();
    const stepper = page.getByTestId('method-stepper');
    await expect(stepper.getByTestId('stepper-count')).toHaveText('Before you start');
    await page.keyboard.press('ArrowRight');
    await expect(stepper.getByTestId('stepper-count')).toHaveText(`Step 1 of ${m.steps.length}`);
    await page.keyboard.press('ArrowLeft');
    await expect(stepper.getByTestId('stepper-count')).toHaveText('Before you start');
    await stepper.getByTestId('stepper-close').click();
    await expect(stepper).toBeHidden();
  });

  test('the Cook dialog carries the same method, folded', async ({ page }) => {
    await open(page);
    await row(page).getByTestId('library-cook').click();
    const fold = page.getByTestId('cook-method');
    await expect(fold).toBeVisible();
    await expect(fold.locator('summary')).toContainText('How to make it');
  });
});
