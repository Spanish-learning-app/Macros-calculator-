import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
export const DIR = '/home/user/Macros-calculator-/team/feedback/screens/nasreen/';
export async function open(time, existing) {
  const browser = existing ? existing.browser : await chromium.launch();
  const ctx = existing ? existing.ctx : await browser.newContext({ viewport: { width: 400, height: 860 }, timezoneId: 'Europe/Madrid', locale: 'en-GB', deviceScaleFactor: 1 });
  if (time) await ctx.clock.setFixedTime(new Date(time));
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  page.on('console', m => { if (m.type()==='error') console.log('CONSOLE', m.text()); });
  await page.goto('http://localhost:8772/');
  await page.waitForTimeout(800);
  return { browser, ctx, page };
}
export const shot = (page, n) => page.screenshot({ path: DIR + n + '.png' });
export const fullshot = (page, n) => page.screenshot({ path: DIR + n + '.png', fullPage: true });
export const txt = async page => (await page.evaluate(() => document.body.innerText));
