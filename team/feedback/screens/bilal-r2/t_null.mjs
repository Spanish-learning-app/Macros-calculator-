import * as L from './lib.mjs';
const run = await L.launch({time:'2026-10-14T09:00:00+02:00'}); const p = run.page;
await L.skipOnboarding(run);
await L.tap(run, p.locator('[data-testid=add-food]')); await L.sheet(run).waitFor();
await L.search(run,'chai');
console.log('sheet text has "null":', /\bnull\b/.test(await L.sheet(run).innerText()));
console.log('chai rows at 09:00:', (await L.rowTexts(run,3)));
await run.browser.close();
