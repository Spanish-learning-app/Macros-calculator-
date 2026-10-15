import { start } from './lib.mjs';
// 400 dark: hscroll on each tab with data
let S = await start({ stateFrom: 's5-thu-morning' });
for (const tab of ['Day', 'Week', 'Prep', 'Profile', 'Data']) {
  await S.open('2026-10-22T18:00:00+02:00');
  await S.page.getByText(tab, { exact: true }).click(); await S.page.waitForTimeout(400);
  await S.hscroll('400-dark-' + tab);
}
await S.open('2026-10-22T18:00:00+02:00');
await S.page.getByText('Week', { exact: true }).click(); await S.page.waitForTimeout(400);
await S.shot('s10-1-week-400-dark');
S.log('week-text', (await S.page.evaluate(() => document.querySelector('#app').innerText)).replace(/\n+/g, ' | ').slice(0, 1200));
await S.finish('s10a');
// desktop light
S = await start({ stateFrom: 's5-thu-morning', scheme: 'light', width: 1280, height: 900 });
await S.open('2026-10-22T18:00:00+02:00');
await S.shot('s10-2-day-1280-light');
await S.page.getByText('Prep', { exact: true }).click(); await S.page.waitForTimeout(400);
await S.shot('s10-3-prep-1280-light');
await S.hscroll('1280-light-prep');
await S.finish('s10b');
