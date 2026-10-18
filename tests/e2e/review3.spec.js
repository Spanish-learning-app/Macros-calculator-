// Review 3 regression tests (Mariam, Bilal, Nasreen; fix wave R3-A/R3-B). Each test replays a tester's
// must-fix steps in the running app on the real Lab data, with a fixed clock (Europe/Madrid). Owner: Kenji.
// Clock: Sun 18 Oct 2026 17:00 is the day the Low-cook week is used; the plan fills Mon 19 to Fri 23 Oct
// (DST in Madrid ends Sun 25 Oct, so every date here is UTC+2).
import { PLANS } from '../../app/data/plans-mealprep.js';
import { test, expect, seed, setUpDoc, userDoc, setClock, savedDoc, ui } from './_app.js';

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

    // Monday: no "last day" line, no spare-box nag, and Wednesday's lunch holds the box.
    await timeTravel(page, at('19', '12:00'), '/#/day');
    await expect(ui.dayTitle(page)).toBeVisible();
    await expect(page.getByTestId('spare-box')).toHaveCount(0);
    await expect(page.locator('main')).not.toContainText(/last day/i);
    await expect(page.locator('main')).not.toContainText(/Plan it/);
    // Thursday 08:00: nothing was thrown away by the use-by rule.
    await timeTravel(page, at('22', '08:00'), '/#/day');
    await expect(page.locator('main')).not.toContainText(/past its use-by|Discard/i);
  });
});
