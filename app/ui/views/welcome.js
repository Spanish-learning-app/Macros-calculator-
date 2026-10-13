// Onboarding (route `welcome`). Owner: Priya.
// A1: P1 in ≤ 15 actions, Skip in ≤ 2. No account, data stays on the phone. Height in cm or
// ft/in, weight in kg. Activity labels/descriptions, goals, rates, health flags, warning texts and
// flag notes all come from RULES (never hard-coded nutrition text). Targets are labelled as
// estimates; after Skip the Lab's reference values carry the "Reference" chip (NUTRITION §2.1a).
import { h, mountChildren, uid } from '../dom.js';
import { cmFromFtIn, ftInFromCm } from '../../core/units.js';
import { fmtKcal, fmtGrams } from '../components/format.js';

/**
 * @param {HTMLElement} container @param {{ store: object, router: object, rules: object }} ctx
 */
export function mount(container, ctx) {
  const { store, router, rules } = ctx;
  const root = h('div', { class: 'view view-welcome', 'data-testid': 'welcome' });
  mountChildren(container, root);
  let screen = store.onboardingState() === 'pending' ? 'intro' : 'form';

  // form state survives "Change my answers"
  const existing = store.getState().data.profile ?? {};
  const form = {
    sex: existing.sex ?? null,
    age: existing.ageYears ?? '',
    heightUnit: store.settings().units?.height === 'ftin' ? 'ftin' : 'cm',
    cm: existing.heightCm ?? '',
    ft: '',
    inches: '',
    kg: existing.weightKg ?? '',
    activity: existing.activity ?? rules.defaultActivity,
    lifts: existing.lifts ?? false,
    goal: existing.goal ?? rules.defaultGoal,
    rate: existing.rateKgPerWeek ?? null,
    flags: new Set(existing.healthFlags ?? []),
  };
  if (form.cm !== '') {
    const fi = ftInFromCm(Number(form.cm));
    form.ft = fi.ft;
    form.inches = fi.inches;
  }

  const go = (next) => {
    screen = next;
    render();
    window.scrollTo(0, 0);
    root.querySelector('h2')?.focus();
  };

  function skip() {
    store.skipOnboarding();
    router.go({ name: 'day', params: { date: null } });
  }

  // ------------------------------------------------------------------ intro

  function intro() {
    return [
      h(
        'div',
        { class: 'welcome-hero' },
        h(
          'h2',
          { class: 'welcome-title', tabindex: '-1' },
          'Write what you eat. See how much is left today.',
        ),
        h(
          'ul',
          { class: 'welcome-points', role: 'list' },
          h('li', null, 'No account, no sign-up, no password.'),
          h('li', null, 'Your data stays on this phone. Nothing is sent anywhere.'),
          h('li', null, 'Desi, Spanish and café food, in katori, roti and cup sizes.'),
        ),
      ),
      h(
        'div',
        { class: 'welcome-actions' },
        h(
          'button',
          { type: 'button', class: 'btn btn-primary btn-block', onclick: () => go('form') },
          'Start',
        ),
        h(
          'button',
          { type: 'button', class: 'btn btn-secondary btn-block', onclick: skip },
          'Skip for now',
        ),
        h(
          'p',
          { class: 'field-help' },
          'Skip uses everyday reference numbers. You can set up your own later in Profile.',
        ),
      ),
    ];
  }

  // ------------------------------------------------------------------ form

  function choice(name, value, label, checked, onChange, description = null) {
    return h(
      'label',
      { class: ['choice', description ? 'choice--card' : null] },
      h('input', { type: 'radio', name, value, checked, onchange: onChange }),
      h(
        'span',
        { class: 'choice-text' },
        h('span', { class: 'choice-label' }, label),
        description ? h('span', { class: 'choice-desc' }, description) : null,
      ),
    );
  }

  function numberField(label, value, onInput, { suffix = '', id = uid('f'), help = null } = {}) {
    const input = h('input', {
      id,
      class: 'input input--num',
      type: 'text',
      inputmode: 'decimal',
      autocomplete: 'off',
      value: String(value),
      oninput: (e) => onInput(e.target.value),
    });
    return h(
      'div',
      { class: 'field', dataset: { field: id } },
      h('label', { class: 'field-label', for: id }, label),
      h(
        'div',
        { class: 'input-suffix' },
        input,
        suffix ? h('span', { 'aria-hidden': 'true' }, suffix) : null,
      ),
      help ? h('p', { class: 'field-help' }, help) : null,
      h('p', { class: 'field-error', hidden: true }),
    );
  }

  function formScreen() {
    const sexName = uid('sex');
    const actName = uid('act');
    const goalName = uid('goal');
    const rateName = uid('rate');
    const goal = rules.goals.find((g) => g.id === form.goal);
    if (form.rate === null || !goal.ratesKgPerWeek.includes(form.rate)) {
      form.rate = goal.defaultRateKgPerWeek;
    }

    const heightBox = h('div', { class: 'height-inputs' });
    const renderHeight = () => {
      heightBox.replaceChildren(
        form.heightUnit === 'cm'
          ? numberField('Height', form.cm, (v) => (form.cm = v), { suffix: 'cm', id: 'height-cm' })
          : h(
              'div',
              { class: 'field-row field-row--2' },
              numberField('Height, feet', form.ft, (v) => (form.ft = v), {
                suffix: 'ft',
                id: 'height-ft',
              }),
              numberField('Inches', form.inches, (v) => (form.inches = v), {
                suffix: 'in',
                id: 'height-in',
              }),
            ),
      );
    };
    renderHeight();
    const unitName = uid('hu');

    const rateBox = h('div');
    const renderRate = () => {
      const g = rules.goals.find((x) => x.id === form.goal);
      if (g.ratesKgPerWeek.length < 2) {
        rateBox.replaceChildren();
        return;
      }
      if (!g.ratesKgPerWeek.includes(form.rate)) form.rate = g.defaultRateKgPerWeek;
      rateBox.replaceChildren(
        h(
          'fieldset',
          { class: 'field' },
          h('legend', { class: 'field-label' }, 'How fast'),
          h(
            'div',
            { class: 'choice-row' },
            g.ratesKgPerWeek.map((r) =>
              choice(rateName, String(r), `${r} kg a week`, r === form.rate, () => (form.rate = r)),
            ),
          ),
          h('p', { class: 'field-help' }, `If unsure, keep ${g.defaultRateKgPerWeek} kg a week.`),
        ),
      );
    };
    renderRate();

    const flagsBox = h('div', { class: 'flag-list' });
    const renderFlags = () => {
      flagsBox.replaceChildren(
        ...rules.healthFlags
          .filter((f) => !form.sex || f.appliesToSex.includes(form.sex))
          .map((f) =>
            h(
              'label',
              { class: 'check-row' },
              h('input', {
                type: 'checkbox',
                checked: form.flags.has(f.id),
                onchange: (e) =>
                  e.target.checked ? form.flags.add(f.id) : form.flags.delete(f.id),
              }),
              h('span', null, f.label),
            ),
          ),
      );
    };
    renderFlags();

    const formEl = h(
      'form',
      {
        class: 'welcome-form',
        novalidate: true,
        onsubmit: (event) => {
          event.preventDefault();
          submit(formEl);
        },
      },
      h('h2', { class: 'view-title', tabindex: '-1' }, 'A few questions about you'),
      h(
        'p',
        { class: 'field-help welcome-lead' },
        'They give you a starting number. You can change everything later.',
      ),

      h(
        'fieldset',
        { class: 'field', dataset: { field: 'sex' } },
        h('legend', { class: 'field-label' }, 'I am a'),
        h(
          'div',
          { class: 'choice-row' },
          rules.sexes.map((s) =>
            choice(sexName, s.id, s.label, form.sex === s.id, () => {
              form.sex = s.id;
              for (const id of [...form.flags]) {
                const flag = rules.healthFlags.find((f) => f.id === id);
                if (flag && !flag.appliesToSex.includes(s.id)) form.flags.delete(id);
              }
              renderFlags();
            }),
          ),
        ),
        h('p', { class: 'field-error', hidden: true }),
      ),

      numberField('Age', form.age, (v) => (form.age = v), {
        suffix: 'years',
        id: 'age',
      }),

      h(
        'fieldset',
        { class: 'field field--tight' },
        h('legend', { class: 'sr-only' }, 'Height unit'),
        h(
          'div',
          { class: 'segmented segmented--small' },
          [
            ['cm', 'cm'],
            ['ftin', 'feet and inches'],
          ].map(([value, label]) =>
            h(
              'label',
              { class: 'seg' },
              h('input', {
                type: 'radio',
                name: unitName,
                value,
                checked: form.heightUnit === value,
                onchange: () => {
                  form.heightUnit = value;
                  renderHeight();
                },
              }),
              h('span', null, label),
            ),
          ),
        ),
      ),
      heightBox,

      numberField('Weight', form.kg, (v) => (form.kg = v), { suffix: 'kg', id: 'weight' }),

      h(
        'fieldset',
        { class: 'field' },
        h('legend', { class: 'field-label' }, 'How active is a normal day?'),
        h(
          'div',
          { class: 'choice-list' },
          rules.activityLevels.map((a) =>
            choice(
              actName,
              a.id,
              a.label,
              form.activity === a.id,
              () => (form.activity = a.id),
              a.description,
            ),
          ),
        ),
        h(
          'p',
          { class: 'field-help' },
          `Not sure? Pick “${rules.activityLevels.find((a) => a.id === rules.defaultActivity)?.label}”.`,
        ),
      ),

      h(
        'label',
        { class: 'switch switch--row' },
        h('input', {
          type: 'checkbox',
          role: 'switch',
          class: 'switch-input',
          checked: form.lifts,
          onchange: (e) => (form.lifts = e.target.checked),
        }),
        h('span', { class: 'switch-track', 'aria-hidden': 'true' }),
        h('span', null, 'I do weight training at least 2 days a week'),
      ),

      h(
        'fieldset',
        { class: 'field' },
        h('legend', { class: 'field-label' }, 'What do you want?'),
        h(
          'div',
          { class: 'choice-row' },
          rules.goals.map((g) =>
            choice(goalName, g.id, g.label, form.goal === g.id, () => {
              form.goal = g.id;
              renderRate();
            }),
          ),
        ),
      ),
      rateBox,

      h(
        'details',
        { class: 'welcome-flags', open: form.flags.size > 0 },
        h('summary', null, 'Anything we should know? (optional)'),
        h(
          'p',
          { class: 'field-help' },
          'Tick any that apply. This changes your targets to keep you safe.',
        ),
        flagsBox,
      ),

      h(
        'div',
        { class: 'welcome-actions' },
        h('button', { type: 'submit', class: 'btn btn-primary btn-block' }, 'See my targets'),
        h('button', { type: 'button', class: 'btn btn-quiet', onclick: skip }, 'Skip for now'),
      ),
    );
    return formEl;
  }

  function setError(formEl, field, text) {
    const box = formEl.querySelector(`[data-field="${field}"]`);
    const err = box?.querySelector('.field-error');
    const input = box?.querySelector('input');
    if (!err) return;
    err.hidden = !text;
    err.textContent = text ?? '';
    if (input && input.type !== 'radio') {
      if (text) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    }
  }

  function submit(formEl) {
    const limits = rules.profileLimits;
    const num = (v) => Number(String(v).trim().replace(',', '.'));
    const problems = [];
    const check = (field, value, lim, what) => {
      const n = num(value);
      let msg = null;
      if (String(value).trim() === '') msg = `Please type your ${what}.`;
      else if (!Number.isFinite(n)) msg = `Use a number for your ${what}.`;
      else if (n < lim.min || n > lim.max) msg = `Use a number between ${lim.min} and ${lim.max}.`;
      setError(formEl, field, msg);
      if (msg) problems.push(field);
      return n;
    };
    setError(formEl, 'sex', form.sex ? null : 'Please choose one.');
    if (!form.sex) problems.push('sex');
    const age = check('age', form.age, limits.ageYears, 'age');
    let heightCm;
    if (form.heightUnit === 'cm') {
      heightCm = check('height-cm', form.cm, limits.heightCm, 'height');
    } else {
      const ft = num(form.ft);
      const inches = String(form.inches).trim() === '' ? 0 : num(form.inches);
      heightCm = Number.isFinite(ft) && Number.isFinite(inches) ? cmFromFtIn(ft, inches) : NaN;
      const bad =
        String(form.ft).trim() === ''
          ? 'Please type your height.'
          : !Number.isFinite(heightCm) ||
              heightCm < limits.heightCm.min ||
              heightCm > limits.heightCm.max
            ? 'That height looks too small or too big. Check feet and inches.'
            : null;
      setError(formEl, 'height-ft', bad);
      if (bad) problems.push('height-ft');
    }
    const weight = check('weight', form.kg, limits.weightKg, 'weight');
    if (problems.length) {
      const first = formEl.querySelector(`[data-field="${problems[0]}"] input`);
      first?.focus();
      return;
    }
    const profile = {
      sex: form.sex,
      ageYears: Math.round(age),
      heightCm: Math.round(heightCm * 10) / 10,
      weightKg: weight,
      activity: form.activity,
      goal: form.goal,
      rateKgPerWeek: form.goal === 'maintain' ? 0 : form.rate,
      lifts: form.lifts,
      healthFlags: [...form.flags],
    };
    const units = store.settings().units ?? { weight: 'kg', height: 'cm' };
    if (units.height !== form.heightUnit) {
      store.updateSettings({ units: { ...units, height: form.heightUnit } });
    }
    store.completeOnboarding(profile);
    go('result');
  }

  // ------------------------------------------------------------------ result

  function warningTexts() {
    const result = store.targetResult();
    const codes = result?.warnings ?? [];
    const flags = [...rules.healthFlags, ...rules.derivedFlags];
    return codes
      .map((code) => rules.warnings[code] ?? flags.find((f) => f.id === code)?.note ?? null)
      .filter(Boolean);
  }

  function result() {
    const targets = store.targets();
    const info = store.targetInfo();
    const items = [
      ['kcal', 'Energy', (v) => `${fmtKcal(v)} kcal`],
      ['protein', 'Protein', (v) => `${fmtGrams(v)} g`],
      ['carbs', 'Carbs', (v) => `${fmtGrams(v)} g`],
      ['fat', 'Fat', (v) => `${fmtGrams(v)} g`],
      ['fiber', 'Fibre', (v) => `${fmtGrams(v)} g`],
    ];
    return h(
      'div',
      { class: 'welcome-result', 'data-testid': 'targets-result' },
      h(
        'h2',
        { class: 'view-title', tabindex: '-1' },
        targets ? 'Your daily targets' : 'You can start logging',
      ),
      targets
        ? [
            h(
              'p',
              { class: 'result-kind' },
              info.chip
                ? h('span', { class: 'chip-kind', 'data-testid': 'target-kind' }, info.chip)
                : null,
              ' ',
              h('span', null, 'An estimate, you can change it.'),
            ),
            h(
              'dl',
              { class: 'result-list' },
              items.map(([key, label, fmt]) => [
                h('dt', null, label),
                h('dd', { 'data-testid': `target-${key}` }, fmt(targets[key])),
              ]),
            ),
            h(
              'p',
              { class: 'field-help' },
              'kcal means calories: the energy in food. Protein helps build and keep muscle. Watch your weight for two weeks and change the numbers if needed.',
            ),
          ]
        : null,
      h(
        'ul',
        { class: 'result-notes', role: 'list' },
        warningTexts().map((t) => h('li', null, t)),
      ),
      h(
        'div',
        { class: 'welcome-actions' },
        h(
          'button',
          {
            type: 'button',
            class: 'btn btn-primary btn-block',
            onclick: () => router.go({ name: 'day', params: { date: null } }),
          },
          'Start logging',
        ),
        h(
          'button',
          { type: 'button', class: 'btn btn-quiet', onclick: () => go('form') },
          'Change my answers',
        ),
      ),
    );
  }

  function render() {
    mountChildren(root, screen === 'intro' ? intro() : screen === 'form' ? formScreen() : result());
  }

  return {
    update() {
      render();
    },
    unmount() {
      container.replaceChildren();
    },
  };
}
