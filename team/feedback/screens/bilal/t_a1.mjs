import * as L from './lib.mjs';
// A1 full onboarding with P1, phone
let run = await L.launch();
let p = run.page;
L.start(run);
await L.onboardP1(run);
console.log('A1 onboarding actions', run.actions, 'seconds(paced)', L.elapsed(run));
await L.shot(run, 'a1-day-after-onboarding');
console.log('targets', await L.totals(run));
console.log('Day text', (await p.innerText('body')).slice(0,400).replace(/\n+/g,' | '));
console.log('foreign', run.foreign, 'errors', run.errors, 'dialogs', run.dialogs);
console.log('slot labels:', await p.locator('.slot h3, .slot h2').allInnerTexts());
await run.browser.close();

// onboarding screens screenshot: targets result
run = await L.launch(); p = run.page;
await p.goto(L.URL);
await L.tap(run, p.getByRole('button',{name:'Start'}));
await L.shot(run,'a1-onboarding-empty');
await L.check(run, p.getByRole('radio',{name:'Man',exact:true}));
await L.type(run, p.getByRole('textbox',{name:'Age'}),'31');
await L.type(run, p.getByRole('textbox',{name:'Height',exact:true}),'178');
await L.type(run, p.getByRole('textbox',{name:'Weight'}),'82');
await L.check(run, p.getByRole('radio',{name:/^Active/}));
await L.check(run, p.getByRole('switch'));
await L.check(run, p.getByRole('radio',{name:/Lose weight/}));
await L.shot(run,'a1-onboarding-filled');
await L.tap(run, p.getByRole('button',{name:'See my targets'}));
await p.waitForSelector('[data-testid=targets-result]');
await L.shot(run,'a1-targets');
console.log('RESULT', (await p.innerText('[data-testid=targets-result]')).replace(/\n+/g,' | '));
await run.browser.close();

// Skip
run = await L.launch(); p = run.page;
L.start(run);
await L.skipOnboarding(run);
console.log('A1 skip actions', run.actions, 'secs', L.elapsed(run));
await L.shot(run,'a1-skip-day');
console.log('skip targets', await L.totals(run));
console.log('skip slot labels', await p.locator('.slot h3, .slot h2').allInnerTexts());
console.log('skip bodytext', (await p.innerText('body')).slice(0,500).replace(/\n+/g,' | '));
console.log('foreign', run.foreign, 'errors', run.errors);
await run.browser.close();
