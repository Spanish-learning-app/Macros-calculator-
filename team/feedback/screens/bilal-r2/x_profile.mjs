import * as L from './lib.mjs';
const run = await L.launch({time:'2026-10-19T13:00:00+02:00'}); const p = run.page;
await L.onboardP1(run);
await p.goto(L.URL+'#/profile'); await p.waitForTimeout(500);
console.log((await p.innerText('body')).replace(/\n+/g,' | ').slice(0,2500));
await L.shot(run,'profile-full',{fullPage:true});
console.log(await p.evaluate(()=>[...document.querySelectorAll('select, input[type=radio], input[type=checkbox]')].map(e=>e.tagName+':'+(e.name||e.id)+':'+(e.closest('label')?.innerText||'').replace(/\n/g,' ').slice(0,50))));
await run.browser.close();
