// Tiny DOM helper. Owner: Priya. Contract: docs/ARCHITECTURE.md §7.5.
// Text always goes in through text nodes (never innerHTML), so food names and imported text can
// never become markup.

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Properties set as DOM properties rather than attributes (live form state). */
const PROPS = new Set(['value', 'checked', 'selected', 'indeterminate', 'defaultValue']);

/**
 * Create an element.
 * - `class`: string, or an array of strings/falsy values (falsy ones are dropped).
 * - `style`: object of CSS properties (custom properties allowed: `{ '--pct': '40%' }`).
 * - `dataset`: object of data-* values.
 * - `on<event>`: a function becomes an event listener (`onclick`, `oninput`, `onkeydown`, …).
 * - `true` sets an empty attribute; `false`, `null` and `undefined` skip it.
 * - Children: strings and numbers become text nodes; arrays are flattened; null/false are dropped.
 * @param {string} tag
 * @param {Record<string, unknown>|null} [attrs]
 * @param {...unknown} children
 * @returns {HTMLElement}
 */
export function h(tag, attrs = null, ...children) {
  const node = document.createElement(tag);
  applyAttrs(node, attrs);
  append(node, children);
  return node;
}

/**
 * Same as `h` for SVG elements (icons and drawings). Never takes user text as markup either.
 * @param {string} tag @param {Record<string, unknown>|null} [attrs] @param {...unknown} children
 * @returns {SVGElement}
 */
export function svg(tag, attrs = null, ...children) {
  const node = document.createElementNS(SVG_NS, tag);
  applyAttrs(node, attrs);
  append(node, children);
  return node;
}

/**
 * Append children (same rules as `h`).
 * @param {Node} parent @param {unknown[]} children @returns {Node} parent
 */
export function append(parent, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false || child === true) continue;
    parent.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return parent;
}

/**
 * Replace all children of `parent` (same rules as `h`).
 * @param {Element} parent @param {...unknown} children @returns {Element}
 */
export function mountChildren(parent, ...children) {
  parent.replaceChildren();
  append(parent, children);
  return parent;
}

/**
 * Set `textContent` only when it changed (avoids needless layout work and live-region chatter).
 * @param {Element} node @param {string|number} text
 */
export function setText(node, text) {
  const value = String(text);
  if (node.textContent !== value) node.textContent = value;
}

/** Visually hidden text for screen readers. @param {string} text @returns {HTMLElement} */
export function srOnly(text) {
  return h('span', { class: 'sr-only' }, text);
}

let idCounter = 0;
/** A document-unique id for label/aria wiring. @param {string} [prefix] @returns {string} */
export function uid(prefix = 'k') {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

function applyAttrs(node, attrs) {
  if (!attrs) return;
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') {
      const cls = Array.isArray(value) ? value.filter(Boolean).join(' ') : String(value);
      if (cls) node.setAttribute('class', cls);
    } else if (key === 'style' && typeof value === 'object') {
      for (const [prop, v] of Object.entries(value)) {
        if (v !== null && v !== undefined) node.style.setProperty(prop, String(v));
      }
    } else if (key === 'dataset' && typeof value === 'object') {
      for (const [k, v] of Object.entries(value)) {
        if (v !== null && v !== undefined) node.dataset[k] = String(v);
      }
    } else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (PROPS.has(key)) {
      node[key] = value;
    } else if (value === true) {
      node.setAttribute(key, '');
    } else {
      node.setAttribute(key, String(value));
    }
  }
}
