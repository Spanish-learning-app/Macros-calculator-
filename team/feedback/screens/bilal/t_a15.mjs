import fs from 'fs';
import * as L from './lib.mjs';
const AUDIT = fs.readFileSync(L.OUT+'audit.js','utf8');
const ST='/tmp/claude-0/d1-state.json';
async function pass(name, opts, scheme='light') {
  const run = await L.launch({time:'2026-10-14T21:30:00+02:00', storageState:ST, colorScheme:scheme, ...opts}); const p = run.page;
  const tag = `${name}-${opts.width}${scheme==='dark'?'-dark':''}`;
  const rep = {};
  const audit = async (view) => { await p.waitForTimeout(350); const r = await p.evaluate(AUDIT); rep[view]=r; };
  await p.goto(L.URL); await p.waitForSelector('[data-testid=kcal-left]');
  await audit('day'); await L.shot(run, `a15-${tag}-day`);
  await p.locator('a[data-route=week], a:has-text("Week")').first().click(); await p.waitForTimeout(400); await audit('week'); await L.shot(run, `a15-${tag}-week`);
  await p.locator('a:has-text("Profile")').first().click(); await p.waitForTimeout(400); await audit('profile'); await L.shot(run, `a15-${tag}-profile`);
  await p.locator('a:has-text("Data")').first().click(); await p.waitForTimeout(400); await audit('data'); await L.shot(run, `a15-${tag}-data`);
  await p.locator('a:has-text("Day")').first().click(); await p.waitForSelector('[data-testid=kcal-left]');
  await L.openSlot(run,'Dinner'); await audit('addsheet-empty'); await L.shot(run, `a15-${tag}-sheet`);
  await L.search(run,'chicken karahi'); await audit('addsheet-results');
  await L.tap(run, L.rows(run).filter({hasText:/restaurant/}).first().locator('.food-main'));
  await p.locator('[data-testid=portion-picker]').waitFor(); await p.waitForTimeout(400);
  await audit('picker'); await L.shot(run, `a15-${tag}-picker`);
  await L.tap(run, p.locator('[data-testid=portion-picker]').getByRole('button',{name:/Source and details/}));
  await audit('details'); await L.shot(run, `a15-${tag}-details`);
  await run.browser.close();
  // onboarding fresh
  const r2 = await L.launch({time:'2026-10-14T21:30:00+02:00', colorScheme:scheme, ...opts});
  await r2.page.goto(L.URL); await r2.page.waitForTimeout(400);
  rep.welcome = await r2.page.evaluate(AUDIT); await L.shot(r2, `a15-${tag}-welcome`);
  await L.tap(r2, r2.page.getByRole('button',{name:'Start'})); await r2.page.waitForTimeout(400);
  rep.onboarding = await r2.page.evaluate(AUDIT); await L.shot(r2, `a15-${tag}-onboarding`);
  await r2.browser.close();
  console.log(`\n===== ${tag}`);
  for (const [v,r] of Object.entries(rep)) {
    console.log(v.padEnd(16), 'scrollW', r.scrollW, 'innerW', r.innerW, r.scrollW>r.innerW?'OVERFLOW':'ok', '| small targets', r.small.length, '| low contrast', r.low.length, '| clipped', r.clipped.length);
    if (r.small.length) console.log('     small:', [...new Set(r.small)].slice(0,12).join('; '));
    if (r.low.length) console.log('     low:', [...new Set(r.low)].slice(0,6).join('; '));
    if (r.clipped.length) console.log('     clipped:', r.clipped.slice(0,5).join('; '));
  }
}
await pass('p',{width:400,height:860});
await pass('p',{width:400,height:860},'dark');
await pass('s',{width:360,height:740});
await pass('d',{width:1280,height:800});
