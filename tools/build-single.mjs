// Builds dist/katori.html: the whole app (JS, CSS, data) in one self-contained file that opens
// offline by double-click (file://). Usage: node tools/build-single.mjs
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const js = await build({
  entryPoints: ['app/main.js'],
  bundle: true,
  format: 'iife',
  minify: true,
  write: false,
  target: 'es2020',
  logLevel: 'warning',
});
const css = await build({
  stdin: { contents: "@import './tokens.css'; @import './base.css';", resolveDir: 'app/styles', loader: 'css' },
  bundle: true,
  minify: true,
  write: false,
  logLevel: 'warning',
});
const head = readFileSync('app/index.html', 'utf8').match(/<head>([\s\S]*?)<\/head>/)[1]
  .replace(/<link rel="stylesheet"[^>]*>\s*/g, '')
  .replace(/<script[^>]*><\/script>\s*/g, '');
const safe = (s) => s.replace(/<\/script/gi, '<\\/script');
const html = `<!doctype html>
<html lang="en">
<head>${head}<style>${css.outputFiles[0].text}</style>
</head>
<body>
<div id="app"><noscript>Katori needs JavaScript to run.</noscript></div>
<script>${safe(js.outputFiles[0].text)}</script>
</body>
</html>
`;
mkdirSync('dist', { recursive: true });
writeFileSync('dist/katori.html', html);
console.log(`dist/katori.html ${(html.length / 1024).toFixed(0)} KB`);
