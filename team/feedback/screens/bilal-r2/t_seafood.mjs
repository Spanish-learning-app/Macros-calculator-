import * as L from './lib.mjs';
const run = await L.launch({time:'2026-10-19T13:00:00+02:00'}); const p = run.page;
await L.onboardP1(run);
const qs=['prawn','gambas','squid','calamares','octopus','mussels','tuna','salmon','mackerel','sardines'];
for (const mode of ['All seafood','Fish and prawns','Fish only']) {
  await p.goto(L.URL+'#/profile'); await p.waitForTimeout(400);
  L.start(run);
  await L.check(run, p.getByRole('radio',{name:mode}));
  await p.waitForTimeout(200);
  console.log('=== setting:',mode,'(actions',run.actions+')');
  if (mode==='Fish only') await L.shot(run,'seafood-profile-fishonly');
  await p.goto(L.URL+'#/day'); await p.waitForSelector('[data-testid=kcal-left]');
  await L.openSlot(run,'Lunch');
  for (const q of qs) {
    await L.search(run,q);
    const rows = await L.sheet(run).locator('[data-testid=food-row]').evaluateAll(els=>els.slice(0,3).map(e=>e.innerText.replace(/\n+/g,' / ').slice(0,90)));
    const hn = await L.sheet(run).locator('[data-testid=hidden-note]').innerText({timeout:80}).catch(()=>'');
    console.log(' ',q.padEnd(9),'->',rows.join('  ||  '), hn?'| HIDDEN: '+hn.replace(/\n+/g,' '):'');
  }
  if (mode!=='All seafood') { await L.search(run,'prawn'); await L.shot(run,'seafood-prawn-'+mode.replace(/\W+/g,'_')); }
  await L.done(run);
}
await run.browser.close();
