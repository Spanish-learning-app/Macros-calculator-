import * as L from './lib.mjs';
const run = await L.launch({time:'2026-10-19T13:00:00+02:00'}); const p = run.page;
await L.onboardP1(run);
await L.openSlot(run,'Lunch');
for (const q of ['kela','naan','whey','truita','salad','biscuit','omelette','karahi','roghni naan','daal']) { await L.search(run,q); console.log(q.padEnd(11),'->',(await L.rowTexts(run,5)).map(s=>s.split(' | ')[0].slice(0,38)+(/ \| \d+ kcal|kcal/.test(s)?' ['+(s.match(/(\d+) kcal/)||[])[1]+']':'')).join(' / ')); }
await L.search(run,'omelette'); console.log('omelette chips:', (await L.rowTexts(run,3)));
await L.done(run);
// toast copy yesterday
await run.browser.close();
// roghni vs naan numbers
