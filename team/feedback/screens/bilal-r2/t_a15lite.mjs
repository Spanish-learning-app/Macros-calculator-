import * as L from './lib.mjs';
import { readFileSync } from 'node:fs';
const audit = readFileSync('../bilal/audit.js','utf8');
for (const [w,h,scheme] of [[360,780,'light'],[400,860,'dark'],[1280,800,'light']]) {
  const run = await L.launch({width:w,height:h,colorScheme:scheme,time:'2026-11-01T18:00:00+01:00'}); const p = run.page;
  await L.onboardP1(run);
  await p.goto(L.URL+'#/prep'); await p.waitForSelector('[data-testid=prep-view]');
  await p.locator('[data-testid=library-row]').filter({hasText:/Chicken tikka rice bowl/}).getByTestId('library-cook').click();
  await p.waitForSelector('[data-testid=cook-dialog]'); 
  const a1 = await p.evaluate(audit); await L.shot(run,`r2-prep-${w}-${scheme}-cookdialog`);
  console.log(w,scheme,'cook dialog: overflow', a1.scrollW-a1.innerW, 'small', a1.small.slice(0,6), 'low', a1.low.slice(0,4));
  await p.getByTestId('cook-save').click(); await p.waitForTimeout(400);
  await p.getByTestId('batch-card').first().getByTestId('fill-mon-thu').click(); await p.waitForTimeout(300);
  const a2 = await p.evaluate(audit);
  console.log(w,scheme,'prep: overflow', a2.scrollW-a2.innerW, 'small', a2.small.slice(0,8), 'low', a2.low.slice(0,4), 'clipped', a2.clipped.slice(0,3));
  await p.getByTestId('batch-card').first().scrollIntoViewIfNeeded();
  await L.shot(run,`r2-prep-${w}-${scheme}-batch`);
  await p.goto(L.URL+'#/day'); await p.waitForSelector('[data-testid=kcal-left]'); await L.setTime(run,'2026-11-02T12:00:00+01:00'); await p.reload(); await p.waitForSelector('[data-testid=kcal-left]');
  await p.evaluate(()=>window.scrollTo(0,99999)); await p.waitForTimeout(200);
  await L.shot(run,`r2-day-${w}-${scheme}-bottom`);
  const a3 = await p.evaluate(audit);
  console.log(w,scheme,'day: overflow', a3.scrollW-a3.innerW, 'small', a3.small.slice(0,8), 'low', a3.low.slice(0,4));
  await run.browser.close();
}
