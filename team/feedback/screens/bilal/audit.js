(() => {
  const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0'; };
  const label = (e) => (e.getAttribute('aria-label') || e.innerText || e.value || e.name || e.id || e.tagName).replace(/\s+/g, ' ').trim().slice(0, 40);
  const inDialog = document.querySelector('dialog[open]');
  const root = inDialog || document;
  const small = [];
  for (const e of root.querySelectorAll('button,a[href],select,input:not([type=hidden]),textarea,summary,[role=button],[role=switch]')) {
    if (!vis(e)) {
      // radio/checkbox visually hidden: use its label wrapper
      continue;
    }
    let t = e; 
    if (e.matches('input[type=radio],input[type=checkbox]')) { const l = e.closest('label') || (e.id && document.querySelector(`label[for="${e.id}"]`)); if (l && vis(l)) t = l; }
    const r = t.getBoundingClientRect();
    if (r.width < 43.5 || r.height < 43.5) small.push(`${label(e)} ${Math.round(r.width)}x${Math.round(r.height)}`);
  }
  // contrast
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] }; };
  const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const bgOf = (e) => { let el = e; let acc = null; const layers = []; while (el) { const c = parse(getComputedStyle(el).backgroundColor); if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break; } el = el.parentElement; } let base = { r: 255, g: 255, b: 255 }; const bodyBg = parse(getComputedStyle(document.documentElement).backgroundColor); if (bodyBg && bodyBg.a > 0) base = bodyBg; for (let i = layers.length - 1; i >= 0; i--) { const l = layers[i]; base = { r: l.r * l.a + base.r * (1 - l.a), g: l.g * l.a + base.g * (1 - l.a), b: l.b * l.a + base.b * (1 - l.a) }; } return base; };
  const low = []; const seen = new Set();
  const walker = document.createTreeWalker(root === document ? document.body : root, NodeFilter.SHOW_TEXT);
  let n; while ((n = walker.nextNode())) {
    const txt = n.textContent.trim(); if (!txt) continue; const e = n.parentElement; if (!e || !vis(e) || seen.has(e)) continue; seen.add(e);
    const cs = getComputedStyle(e); const fg = parse(cs.color); if (!fg) continue; const bg = bgOf(e);
    const a = fg.a; const f = { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a) };
    const L1 = lum(f), L2 = lum(bg); const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const size = parseFloat(cs.fontSize); const bold = parseInt(cs.fontWeight) >= 700; const large = size >= 24 || (size >= 18.66 && bold);
    const need = large ? 3 : 4.5; if (ratio < need) low.push(`${ratio.toFixed(2)} "${txt.slice(0, 28)}" ${cs.color}`);
  }
  // clipped text
  const clipped = [];
  for (const e of root.querySelectorAll('h1,h2,h3,.entry-main span,.food-name,.dlg-title,button span')) { if (vis(e) && e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow !== 'visible') clipped.push(label(e)); }
  return { scrollW: document.documentElement.scrollWidth, innerW: innerWidth, small, low, clipped };
})()
