// ESLint flat config for Katori. No plugins and no imports, so it runs with the preinstalled
// global ESLint 10 and needs no `npm install`. Owner: Lena. See docs/ARCHITECTURE.md §9.

const browserGlobals = Object.fromEntries(
  [
    'window',
    'document',
    'navigator',
    'location',
    'history',
    'localStorage',
    'sessionStorage',
    'console',
    'setTimeout',
    'clearTimeout',
    'setInterval',
    'clearInterval',
    'requestAnimationFrame',
    'cancelAnimationFrame',
    'queueMicrotask',
    'structuredClone',
    'matchMedia',
    'getComputedStyle',
    'performance',
    'crypto',
    'URL',
    'URLSearchParams',
    'Event',
    'CustomEvent',
    'EventTarget',
    'KeyboardEvent',
    'FileReader',
    'Blob',
    'File',
    'Node',
    'Element',
    'HTMLElement',
    'HTMLInputElement',
    'HTMLDialogElement',
    'DocumentFragment',
    'DOMException',
    'AbortController',
    'ResizeObserver',
    'IntersectionObserver',
    'MutationObserver',
    'CSS',
  ].map((name) => [name, 'readonly']),
);

const nodeGlobals = Object.fromEntries(
  [
    'process',
    'console',
    'setTimeout',
    'clearTimeout',
    'setInterval',
    'clearInterval',
    'queueMicrotask',
    'structuredClone',
    'performance',
    'URL',
    'URLSearchParams',
    'Buffer',
  ].map((name) => [name, 'readonly']),
);

const correctness = {
  'no-undef': 'error',
  'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }],
  'no-redeclare': 'error',
  'no-dupe-keys': 'error',
  'no-dupe-class-members': 'error',
  'no-duplicate-case': 'error',
  'no-unreachable': 'error',
  'no-constant-condition': ['error', { checkLoops: false }],
  'no-self-assign': 'error',
  'no-self-compare': 'error',
  'no-cond-assign': 'error',
  'no-fallthrough': 'error',
  'no-sparse-arrays': 'error',
  'no-unsafe-finally': 'error',
  'no-unsafe-negation': 'error',
  'no-const-assign': 'error',
  'no-func-assign': 'error',
  'no-import-assign': 'error',
  'no-shadow-restricted-names': 'error',
  'no-loss-of-precision': 'error',
  'no-empty': 'error',
  'use-isnan': 'error',
  'valid-typeof': 'error',
  eqeqeq: ['error', 'always'],
  'no-var': 'error',
  'prefer-const': 'error',
  'no-eval': 'error',
  'no-implied-eval': 'error',
  'no-new-func': 'error',
  'no-throw-literal': 'error',
};

export default [
  {
    ignores: ['node_modules/**', 'research/**', 'test-results/**', 'playwright-report/**'],
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: { ecmaVersion: 2024, sourceType: 'module' },
    rules: correctness,
  },
  // Product code: runs in the browser and inside a claude.ai Artifact.
  {
    files: ['app/**/*.js'],
    languageOptions: { globals: browserGlobals },
    rules: {
      'no-alert': 'error', // alert/confirm/prompt do nothing inside an Artifact
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-restricted-properties': [
        'error',
        {
          property: 'toISOString',
          message:
            'Dates are local YYYY-MM-DD strings. Use core/dates.js (todayISO, localDateTime).',
        },
      ],
    },
  },
  // The core must stay pure: no DOM, no storage, no clock, no randomness.
  {
    files: ['app/core/**/*.js'],
    rules: {
      'no-restricted-globals': [
        'error',
        ...[
          'window',
          'document',
          'navigator',
          'location',
          'history',
          'localStorage',
          'sessionStorage',
          'fetch',
          'setTimeout',
          'setInterval',
          'requestAnimationFrame',
          'matchMedia',
          'crypto',
        ].map((name) => ({ name, message: 'app/core is pure. Inject this from the UI layer.' })),
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message: 'app/core is pure. Take `now` as a parameter.',
        },
        {
          selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
          message: 'app/core is pure. Take `now` as a parameter.',
        },
        {
          selector: "CallExpression[callee.object.name='Math'][callee.property.name='random']",
          message: 'app/core is pure. Take `makeId` as a parameter.',
        },
      ],
    },
  },
  // Food data modules: plain data only.
  {
    files: ['app/data/**/*.js'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'FunctionDeclaration, FunctionExpression, ArrowFunctionExpression',
          message: 'app/data holds plain data only (no functions).',
        },
      ],
    },
  },
  // Tests, Playwright config and tooling run in Node.
  {
    files: ['tests/**/*.js', '*.config.js'],
    languageOptions: { globals: { ...nodeGlobals, ...browserGlobals } },
  },
];
