// Shared helpers for Mariam's Review 2 scripts (Katori Sprint 2 build). Not app code.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';

export const APP = 'http://localhost:8774/';
export const OUT = new URL('./', import.meta.url).pathname;
export const STATE = OUT + 'state-';

export async function start({ stateFrom = null, scheme = 'dark', width = 400, height = 860 } = {}) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width, height }, colorScheme: scheme, timezoneId: 'Europe/Madrid', locale: 'es-ES',
    hasTouch: width < 600, isMobile: width < 600, deviceScaleFactor: 2,
    ...(stateFrom ? { storageState: STATE + stateFrom + '.json' } : {}),
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
  const R = { actions: {}, notes: {}, errors };
  const S = { browser, ctx, page, R, counter: null, t0: 0 };
  S.log = (k, v) => { R.notes[k] = v; console.log('>>', k, typeof v === 'string' ? v : JSON.stringify(v)); };
  S.startCount = (name) => { S.counter = { name, taps: 0, types: 0, chars: 0, ms: 0 }; S.t0 = Date.now(); R.actions[name] = S.counter; };
  S.stopCount = () => { if (S.counter) S.counter.ms = Date.now() - S.t0; const c = S.counter; S.counter = null; return c; };
  S.tap = async (loc) => { if (S.counter) S.counter.taps++; await loc.click(); await page.waitForTimeout(120); };
  S.type = async (loc, text) => { if (S.counter) { S.counter.types++; S.counter.chars += text.length; } await loc.fill(''); await loc.pressSequentially(text, { delay: 15 }); await page.waitForTimeout(250); };
  S.shot = (n, opts = {}) => page.screenshot({ path: OUT + n + '.png', ...opts });
  S.open = async (iso, hash = '') => { await page.clock.setFixedTime(new Date(iso)); await page.goto(APP + hash); await page.waitForTimeout(700); };
  S.save = async (name) => { await page.waitForTimeout(700); await page.evaluate(() => window.dispatchEvent(new Event('pagehide'))); await ctx.storageState({ path: STATE + name + '.json' }); };
  S.finish = async (name) => { fs.writeFileSync(OUT + name + '-results.json', JSON.stringify(R, null, 1)); await browser.close(); };
  S.store = () => page.evaluate(() => JSON.parse(localStorage.getItem(Object.keys(localStorage)[0])));
  S.hscroll = async (label) => { const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth })); S.log('hscroll-' + label, r); return r; };
  S.text = (sel) => page.evaluate((s) => document.querySelector(s)?.innerText ?? null, sel);
  return S;
}
