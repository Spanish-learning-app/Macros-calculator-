// Shell smoke test. Owner: Kenji (starter by Lena in Step 0).
// Global guards (no other origin, no alert/confirm/prompt, no console error, no sideways scroll)
// come from ./_app.js. Tab checks start from a skipped-onboarding document, because day, add and
// week redirect to #/welcome while onboarding is pending.
import { test, expect, seed, userDoc, ui, needs } from './_app.js';

test('shell loads: brand, title, navigation, a mounted view, no storage banner', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Katori' })).toBeVisible();
  await expect(page).toHaveTitle('Katori Meal Planner');
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
  const view = page.locator('#view');
  await expect(view).not.toBeEmpty();
  await expect(view).not.toHaveText('Loading…');
  await expect(ui.banner(page)).toBeHidden();
});

test('hash routes mark the active tab', async ({ page }) => {
  await seed(page, userDoc());
  // Tabs are looked up in the main navigation: Profile also links to the Data page.
  const nav = page.getByRole('navigation', { name: 'Main' });
  await page.goto('/#/week');
  await expect(nav.getByRole('link', { name: 'Week' })).toHaveAttribute('aria-current', 'page');
  await nav.getByRole('link', { name: 'Profile' }).click();
  await expect(page).toHaveURL(/#\/profile$/);
  await expect(nav.getByRole('link', { name: 'Profile' })).toHaveAttribute('aria-current', 'page');
  await expect(nav.getByRole('link', { name: 'Week' })).not.toHaveAttribute('aria-current', 'page');
  await nav.getByRole('link', { name: 'Data' }).click();
  await expect(nav.getByRole('link', { name: 'Data' })).toHaveAttribute('aria-current', 'page');
});

test('a fresh user is sent to onboarding from the day and week routes', async ({ page }) => {
  needs('store');
  await page.goto('/#/week');
  await expect(page).toHaveURL(/#\/welcome$/);
  await page.goto('/#/day/2026-10-13');
  await expect(page).toHaveURL(/#\/welcome$/);
});

test('an unknown hash falls back to the day view', async ({ page }) => {
  needs('store');
  await seed(page, userDoc());
  await page.goto('/#/no-such-page');
  await expect(page).toHaveURL(/#\/(day)?$/);
  await expect(page.getByRole('link', { name: 'Day' })).toHaveAttribute('aria-current', 'page');
});
