import { open, shot, fullshot, txt, onboard } from './lib.mjs';
export { open, shot, fullshot, txt, onboard };
export async function tab(page, name){ await page.locator('nav').getByText(name,{exact:true}).click(); await page.waitForTimeout(450); }
