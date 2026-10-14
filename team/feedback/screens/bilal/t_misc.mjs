import * as L from './lib.mjs';
import { computeTargets } from '/home/user/Macros-calculator-/app/core/targets.js';
try { console.log('computeTargets P1', JSON.stringify(computeTargets({sex:'male',ageYears:31,heightCm:178,weightKg:82,activity:'moderate',goal:'lose',rateKgPerWeek:0.5,lifts:true}))); } catch(e){ console.log('computeTargets err', e.message); }
// 360 long names
let run = await L.launch({width:360,height:740,time:'2026-10-14T21:30:00+02:00'}); let p = run.page;
await L.skipOnboarding(run);
await L.openSlot(run,'Dinner');
await L.logFood(run,'karahi',/Chicken karahi \(rest/);
await L.logFood(run,'tortilla',/^Tortilla de patatas/);
await L.shot(run,'a15-360-sheet-longnames');
await L.done(run);
await L.shot(run,'a15-360-day-longnames');
console.log('360 entries', await L.entries(run));
await run.browser.close();
// dark first paint
run = await L.launch({colorScheme:'dark'}); p = run.page;
await p.goto(L.URL,{waitUntil:'commit'});
const bg0 = await p.evaluate(()=>getComputedStyle(document.documentElement).backgroundColor + ' / body ' + (document.body?getComputedStyle(document.body).backgroundColor:'n/a'));
await p.screenshot({path:L.OUT+'a15-dark-firstpaint.png'});
console.log('dark first-paint bg:', bg0);
await run.browser.close();
