// Spanish meal names on the Spanish clock (Meeting 003 item 3, CUSTOMER A19): on Madrid time the Day
// view shows Breakfast / café, Lunch, Merienda, Dinner, Snacks, and food added after midnight goes
// to Snacks. The Pakistani preset keeps its own names. Owner: Kenji.
import { test, expect, seed, userDoc, ui, setClock, RULES } from './_app.js';

const SPANISH = ['Breakfast / café', 'Lunch', 'Merienda', 'Dinner', 'Snacks'];
const SLOT_IDS = ['breakfast', 'lunch', 'evening', 'dinner', 'snacks'];
const PAKISTANI = RULES.mealSlots.default.map((s) => s.label);

const headings = (page) =>
  page
    .locator('[data-testid^="slot-"]')
    .evaluateAll((els) => els.map((el) => el.querySelector('h2, h3')?.textContent.trim()));

test('RULES: the Spanish preset carries the Meeting 003 names, the Pakistani preset differs', () => {
  expect(RULES.mealSlots.spain.map((s) => s.label)).toEqual(SPANISH);
  expect(RULES.mealSlots.spain.map((s) => s.id)).toEqual(SLOT_IDS);
  expect(PAKISTANI).toContain('Shaam ki chai');
  expect(RULES.mealSlotPresetDefault.byTimeZone['Europe/Madrid']).toBe('spain');
});

test('Madrid, Spanish preset: the Day view lists the five Spanish slot names in order', async ({
  page,
}) => {
  await seed(page, userDoc({ settings: { slotPreset: 'spain' } }));
  await setClock(page, '2026-10-14T13:00:00+02:00');
  await page.goto('/#/day');
  await expect(ui.slot(page, 'lunch')).toBeVisible();
  expect(await headings(page)).toEqual(SPANISH);
  for (const id of SLOT_IDS) await expect(ui.slot(page, id)).toBeVisible();
  const text = await page.locator('#view').innerText();
  for (const name of ['Nashta', 'Shaam ki chai']) expect(text).not.toContain(name);
});

test('Pakistani preset keeps the Pakistani slot names', async ({ page }) => {
  await seed(page, userDoc({ settings: { slotPreset: 'default' } }));
  await setClock(page, '2026-10-14T13:00:00+02:00');
  await page.goto('/#/day');
  await expect(ui.slot(page, 'lunch')).toBeVisible();
  expect(await headings(page)).toEqual(PAKISTANI);
});

test('a new user on Madrid time gets the Spanish names after "Skip for now"', async ({ page }) => {
  await setClock(page, '2026-10-14T13:00:00+02:00');
  await page.goto('/');
  await page.getByRole('button', { name: 'Skip for now' }).click();
  await page.goto('/#/day');
  await expect(ui.slot(page, 'lunch')).toBeVisible();
  expect(await headings(page)).toEqual(SPANISH);
});

test.describe('Karachi time zone', () => {
  test.use({ timezoneId: 'Asia/Karachi' });
  test('a new user on Karachi time gets the Pakistani names', async ({ page }) => {
    await setClock(page, '2026-10-14T20:30:00+05:00');
    await page.goto('/');
    await page.getByRole('button', { name: 'Skip for now' }).click();
    await page.goto('/#/day');
    await expect(ui.slot(page, 'lunch')).toBeVisible();
    expect(await headings(page)).toEqual(PAKISTANI);
  });
});

test('the add sheet is titled with the Spanish slot name', async ({ page }) => {
  await seed(page, userDoc({ settings: { slotPreset: 'spain' } }));
  await setClock(page, '2026-10-14T13:00:00+02:00');
  await page.goto('/#/day');
  await ui.addTo(page, 'Merienda').click();
  await expect(ui.sheet(page).getByRole('heading', { name: 'Add to Merienda' })).toBeVisible();
  // the Meal selector offers the same five names
  const options = await ui.sheet(page).getByLabel('Meal').locator('option').allTextContents();
  expect(options.map((o) => o.trim())).toEqual(SPANISH);
});

// Where "Add food" lands by the Madrid clock (RULES.mealSlots.spain hours; minutes after 00:00):
//   08:00 Breakfast / café (300–750) · 13:30 Lunch (750–990) · 17:30 Merienda (990–1200)
//   21:00 Dinner (1200–1440) · 00:30 Snacks (0–300, Meeting 003: after midnight → Snacks)
for (const [time, label] of [
  ['2026-10-14T08:00:00+02:00', 'Breakfast / café'],
  ['2026-10-14T13:30:00+02:00', 'Lunch'],
  ['2026-10-14T17:30:00+02:00', 'Merienda'],
  ['2026-10-14T21:00:00+02:00', 'Dinner'],
  ['2026-10-15T00:30:00+02:00', 'Snacks'],
  ['2026-10-15T04:59:00+02:00', 'Snacks'],
  ['2026-10-15T05:00:00+02:00', 'Breakfast / café'],
]) {
  test(`at ${time.slice(11, 16)} Madrid "Add food" opens "Add to ${label}"`, async ({ page }) => {
    await seed(page, userDoc({ settings: { slotPreset: 'spain' } }));
    await setClock(page, time);
    await page.goto('/#/day');
    await ui.addFood(page).click();
    await expect(ui.sheet(page).getByRole('heading', { name: `Add to ${label}` })).toBeVisible();
  });
}
