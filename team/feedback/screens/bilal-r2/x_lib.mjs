import * as L from './lib.mjs';
const run = await L.launch({time:'2026-10-18T18:00:00+02:00'}); const p = run.page;
await L.skipOnboarding(run);
await p.goto(L.URL+'#/prep'); await p.waitForSelector('[data-testid=prep-view]');
const rows = await p.locator('[data-testid=library-row]').evaluateAll(els=>els.map(e=>e.innerText.replace(/\n+/g,' | ')));
const out=[]; for (const r of rows){ const m=r.match(/^(.*?) \| 1 (\w+): (\d+) kcal · (\d+) g protein \| (\d+) min(, no cooking)?/); if(m) out.push({n:m[1].slice(0,55),u:m[2],k:+m[3],p:+m[4],min:+m[5],nc:!!m[6]}); else console.log('?',r);}
out.sort((a,b)=>b.p/b.k-a.p/a.k);
for (const o of out) console.log(String(o.p).padStart(3)+' g', String(o.k).padStart(4)+' kcal', (o.p/o.k*100).toFixed(1).padStart(5)+' g/100kcal', o.nc?'NC':'  ', o.u.padEnd(7), o.n);
const lunch = out.filter(o=>o.u==='box'); console.log('boxes avg protein', (lunch.reduce((s,o)=>s+o.p,0)/lunch.length).toFixed(1), 'n', lunch.length);
await run.browser.close();
