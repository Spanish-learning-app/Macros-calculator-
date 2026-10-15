import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
export const DIR = '/home/user/Macros-calculator-/team/feedback/screens/nasreen-r2/';
export async function open(time) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 400, height: 860 }, timezoneId: 'Europe/Madrid', locale: 'en-GB', colorScheme: 'light', deviceScaleFactor: 1 });
  if (time) await ctx.clock.setFixedTime(new Date(time));
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => { errs.push(e.message); console.log('PAGEERROR', e.message); });
  page.on('console', m => { if (m.type()==='error') console.log('CONSOLE', m.text()); });
  await page.goto('http://localhost:8773/');
  await page.waitForTimeout(800);
  return { browser, ctx, page };
}
export const shot = (page, n) => page.screenshot({ path: DIR + n + '.png' });
export const fullshot = (page, n) => page.screenshot({ path: DIR + n + '.png', fullPage: true });
export const txt = async page => (await page.evaluate(() => document.body.innerText));
export async function onboard(page) {
  await page.getByRole('button',{name:'Start'}).click();
  await page.locator('input[value=female]').click();
  await page.locator('input[type=text]').nth(0).fill('42');
  await page.locator('input[type=radio]').nth(3).click();
  const ins = page.locator('input[inputmode=decimal]');
  await ins.nth(1).fill('5'); await ins.nth(2).fill('3'); await ins.nth(3).fill('70');
  await page.locator('input[value=lose]').click();
  await page.getByRole('button',{name:'See my targets'}).click();
  await page.getByRole('button',{name:'Start logging'}).click();
  await page.waitForTimeout(500);
}
