#!/usr/bin/env node
// Print the pack recipe ("COOKING RECIPE … Steps of Cooking") from a Shan Foods product page.
//   node research/zainab/shan-recipe.mjs <product url>   (page cached in research/cache/shan/, parsed as text)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const cache = path.join(here, '..', 'cache', 'shan');
fs.mkdirSync(cache, { recursive: true });
const url = process.argv[2];
const file = path.join(cache, crypto.createHash('sha1').update(url).digest('hex').slice(0, 16) + '.html');
if (!fs.existsSync(file)) execFileSync('curl', ['-sSL', '-A', 'Mozilla/5.0 (research)', '-o', file, url]);
let s = fs.readFileSync(file, 'utf8').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '');
s = s.replace(/<[^>]+>/g, '\n').replace(/&amp;/g, '&').replace(/&#8217;|&rsquo;/g, "'").replace(/&nbsp;/g, ' ').replace(/&#[0-9]+;/g, '');
const lines = s.split('\n').map((l) => l.trim()).filter(Boolean);
const a = lines.findIndex((l) => /^RECIPE$/i.test(l) || /^COOKING$/i.test(l));
const b = lines.findIndex((l, i) => i > a && /^(join our|Rice|Curry|BBQ|Fried|Haleem)$/i.test(l) && i > a + 8);
console.log(`# ${url}`);
console.log(a < 0 ? 'NO RECIPE SECTION' : lines.slice(a, b > a ? b : a + 60).join(' | '));
