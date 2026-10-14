// Priya's design-study screenshots of Katori at 400 px, light and dark, Europe/Madrid.
// Run: (cd app && python3 -m http.server 8790) then node team/feedback/design-study/shoot.mjs
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const URL = 'http://localhost:8790/';
const OUT = '/home/user/Macros-calculator-/team/feedback/design-study/';
const TIME = '2026-10-14T13:10:00+02:00';

async function run(scheme) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 400, height: 860 }, timezoneId: 'Europe/Madrid', locale: 'en-GB',
    colorScheme: scheme, hasTouch: true, isMobile: true, deviceScaleFactor: 1,
  });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e)));
  await p.clock.install({ time: new Date(TIME) });
  const s = (n, o = {}) => p.screenshot({ path: `${OUT}${scheme}-${n}.png`, ...o });
  const step = async (label, fn) => { try { await fn(); } catch (e) { errs.push(`${label}: ${e.message.split('\n')[0]}`); } };

  await p.goto(URL);
  await p.waitForTimeout(600);
  await s('01-welcome');
  await step('onboard', async () => {
    await p.getByRole('button', { name: 'Start' }).click();
    await p.waitForTimeout(300);
    await s('02-onboarding-form', { fullPage: true });
    await p.getByRole('radio', { name: 'Man', exact: true }).check();
    await p.getByRole('textbox', { name: 'Age' }).fill('31');
    await p.getByRole('textbox', { name: 'Height', exact: true }).fill('178');
    await p.getByRole('textbox', { name: 'Weight' }).fill('82');
    await p.getByRole('radio', { name: /^Active/ }).check();
    await p.getByRole('radio', { name: /Lose weight/ }).check();
    await p.getByRole('button', { name: 'See my targets' }).click();
    await p.waitForSelector('[data-testid=targets-result]');
    await s('03-targets');
    await p.getByRole('button', { name: 'Start logging' }).click();
    await p.waitForSelector('[data-testid=kcal-left]');
  });
  await p.waitForTimeout(300);
  await s('04-day-empty');

  const add = async (slot, q, n = 1) => {
    await p.getByRole('button', { name: `Add to ${slot}` }).first().click();
    const box = p.getByRole('searchbox', { name: 'Search foods' });
    await box.fill(q);
    await p.waitForTimeout(250);
    for (let i = 0; i < n; i++) {
      await p.locator('[data-testid=results] [data-testid=food-row]').first().getByRole('button', { name: /^Add / }).click();
      await p.waitForTimeout(150);
    }
    await p.keyboard.press('Escape');
    await p.waitForTimeout(250);
  };
  await step('log', async () => {
    const slots = await p.locator('[data-testid^=slot-]').evaluateAll((els) => els.map((e) => e.querySelector('h2,h3')?.textContent.trim()));
    errs.push('slots: ' + slots.join(' | '));
    await add(slots[0], 'anda paratha');
    await add(slots[0], 'chai');
    await add(slots[1], 'daal');
    await add(slots[1], 'rice');
  });
  await s('05-day-logged');
  await s('05b-day-logged-full', { fullPage: true });

  await step('sheet', async () => {
    await p.getByRole('button', { name: /^Add to / }).nth(2).click();
    await p.getByRole('searchbox', { name: 'Search foods' }).fill('karahi');
    await p.waitForTimeout(300);
    await s('06-add-sheet-search');
    await p.locator('[data-testid=results] [data-testid=food-row]').first().locator('button').first().click();
    await p.waitForSelector('[data-testid=portion-picker]');
    await p.waitForTimeout(300);
    await s('07-portion-picker');
    await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  });
  await step('week', async () => { await p.goto(URL + '#/week'); await p.waitForTimeout(600); await s('08-week', { fullPage: true }); });
  await step('prep', async () => { await p.goto(URL + '#/prep'); await p.waitForTimeout(800); await s('09-prep'); await s('09b-prep-full', { fullPage: true }); });
  await step('profile', async () => { await p.goto(URL + '#/profile'); await p.waitForTimeout(600); await s('10-profile'); });
  console.log(scheme, errs.join('\n  '));
  await browser.close();
}
await run('light');
await run('dark');
