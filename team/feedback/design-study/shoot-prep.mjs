// Priya's design study: the meal-prep cook dialog and a batch card, 400 px, light and dark, Madrid.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const URL = 'http://localhost:8790/';
const OUT = '/home/user/Macros-calculator-/team/feedback/design-study/';
for (const scheme of ['light', 'dark']) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 400, height: 860 }, timezoneId: 'Europe/Madrid', locale: 'en-GB', colorScheme: scheme, hasTouch: true, isMobile: true });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e)));
  await p.clock.install({ time: new Date('2026-10-18T18:00:00+02:00') });
  await p.goto(URL);
  await p.getByRole('button', { name: 'Skip for now' }).click();
  await p.waitForSelector('[data-testid=kcal-left]');
  await p.goto(URL + '#/prep');
  await p.waitForTimeout(600);
  try {
    await p.getByRole('button', { name: /^Cook Chicken tikka/ }).first().click();
    await p.waitForTimeout(400);
    await p.screenshot({ path: `${OUT}${scheme}-11-cook-dialog.png` });
    await p.getByTestId('cook-save').click();
    await p.waitForTimeout(500);
    await p.screenshot({ path: `${OUT}${scheme}-12-batch-card.png` });
    await p.getByRole('button', { name: /^Fill Mon/ }).first().click();
    await p.waitForTimeout(400);
    await p.screenshot({ path: `${OUT}${scheme}-13-batch-filled.png` });
    await p.goto(URL + '#/day/2026-10-19');
    await p.waitForTimeout(500);
    await p.screenshot({ path: `${OUT}${scheme}-14-day-with-box.png` });
  } catch (e) { errs.push(e.message.split('\n')[0]); }
  console.log(scheme, errs.join(' | ') || 'ok');
  await browser.close();
}
