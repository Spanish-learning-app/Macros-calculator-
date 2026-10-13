// Shell smoke test. Owner: Kenji (starter by Lena in Step 0).
import { test, expect } from 'playwright/test';

test('shell loads, shows Katori, and never scrolls sideways', async ({ page }) => {
  const foreign = [];
  page.on('request', (req) => {
    const url = new URL(req.url());
    if (url.hostname !== 'localhost') foreign.push(req.url());
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Katori' })).toBeVisible();
  await expect(page).toHaveTitle(/Katori/);
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
  await expect(page.getByTestId('data-status')).not.toHaveText('Loading foods…');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  expect(foreign).toEqual([]);
});

test('hash routes mark the active tab', async ({ page }) => {
  await page.goto('/#/week');
  await expect(page.getByRole('link', { name: 'Week' })).toHaveAttribute('aria-current', 'page');
  await page.getByRole('link', { name: 'Profile' }).click();
  await expect(page).toHaveURL(/#\/profile$/);
  await expect(page.getByRole('link', { name: 'Profile' })).toHaveAttribute('aria-current', 'page');
});
