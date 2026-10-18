// The "about you" form, shared by onboarding (welcome) and Profile. Owner: Priya.
// Every label, description, goal, rate, limit and health flag comes from RULES. Height in cm or
// feet and inches; weight in kg (or lb when the user chose it in Profile).
import { h, uid } from '../dom.js';
import { cmFromFtIn, ftInFromCm, kgFromLb, lbFromKg, round } from '../../core/units.js';

/**
 * @param {{ rules: object, profile: object|null, heightUnit?: 'cm'|'ftin',
 *   weightUnit?: 'kg'|'lb', showBodyFat?: boolean, submitLabel: string,
 *   onSubmit: (profile: object, units: { height: 'cm'|'ftin' }) => void,
 *   secondary?: HTMLElement|null }} props
 * @returns {HTMLFormElement}
 */
export function createProfileForm(props) {
  const { rules, profile = null, showBodyFat = false } = props;
  const p = profile ?? {};
  const weightUnit = props.weightUnit === 'lb' ? 'lb' : 'kg';
  const form = {
    sex: p.sex ?? null,
    age: p.ageYears ?? '',
    heightUnit: props.heightUnit === 'ftin' ? 'ftin' : 'cm',
    cm: p.heightCm ?? '',
    ft: '',
    inches: '',
    weight:
      p.weightKg == null ? '' : weightUnit === 'lb' ? round(lbFromKg(p.weightKg), 1) : p.weightKg,
    bodyFat: p.bodyFatPct ?? '',
    activity: p.activity ?? rules.defaultActivity,
    lifts: p.lifts ?? false,
    // No goal is preselected (Ayesha, rules 1.7.3): the person picks one, like sex. A saved goal
    // stays ticked. RULES.defaultGoal is only the fallback for a profile with none (skip path).
    goal: p.goal ?? null,
    rate: p.rateKgPerWeek ?? null,
    flags: new Set(p.healthFlags ?? []),
  };
  if (form.cm !== '') {
    const fi = ftInFromCm(Number(form.cm));
    form.ft = fi.ft;
    form.inches = fi.inches;
  }
  const ids = {
    sex: uid('sex'),
    act: uid('act'),
    goal: uid('goal'),
    rate: uid('rate'),
    hu: uid('hu'),
  };

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

  function numberField(label, value, onInput, { suffix = '', id, help = null }) {
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

  // height
  const heightBox = h('div', { class: 'height-inputs' });
  function renderHeight() {
    heightBox.replaceChildren(
      form.heightUnit === 'cm'
        ? numberField('Height', form.cm, (v) => (form.cm = v), {
            suffix: 'cm',
            id: uid('height-cm'),
          })
        : h(
            'div',
            { class: 'field-row field-row--2' },
            numberField('Height, feet', form.ft, (v) => (form.ft = v), {
              suffix: 'ft',
              id: uid('height-ft'),
            }),
            numberField('and inches', form.inches, (v) => (form.inches = v), {
              suffix: 'in',
              id: uid('height-in'),
            }),
          ),
    );
  }
  renderHeight();

  // rate
  const rateBox = h('div');
  function renderRate() {
    const g = rules.goals.find((x) => x.id === form.goal);
    if (!g) {
      rateBox.replaceChildren();
      return;
    }
    if (!g.ratesKgPerWeek.includes(form.rate)) form.rate = g.defaultRateKgPerWeek;
    if (g.ratesKgPerWeek.length < 2) {
      rateBox.replaceChildren();
      return;
    }
    rateBox.replaceChildren(
      h(
        'fieldset',
        { class: 'field' },
        h('legend', { class: 'field-label' }, 'How fast'),
        h(
          'div',
          { class: 'choice-row' },
          g.ratesKgPerWeek.map((r) =>
            choice(ids.rate, String(r), `${r} kg a week`, r === form.rate, () => (form.rate = r)),
          ),
        ),
        h('p', { class: 'field-help' }, `If unsure, keep ${g.defaultRateKgPerWeek} kg a week.`),
      ),
    );
  }
  renderRate();

  // health flags
  const flagsBox = h('div', { class: 'flag-list' });
  function renderFlags() {
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
              onchange: (e) => (e.target.checked ? form.flags.add(f.id) : form.flags.delete(f.id)),
            }),
            h('span', null, f.label),
          ),
        ),
    );
  }
  renderFlags();

  const weightId = uid('weight');
  const ageId = uid('age');
  const bodyFatId = uid('bodyfat');

  const el = h(
    'form',
    {
      class: 'profile-form',
      novalidate: true,
      onsubmit: (event) => {
        event.preventDefault();
        submit();
      },
    },
    h(
      'fieldset',
      { class: 'field', dataset: { field: 'sex' } },
      h('legend', { class: 'field-label' }, 'I am a'),
      h(
        'div',
        { class: 'choice-row' },
        rules.sexes.map((s) =>
          choice(ids.sex, s.id, s.label, form.sex === s.id, () => {
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
    numberField('Age', form.age, (v) => (form.age = v), { suffix: 'years', id: ageId }),
    h(
      'fieldset',
      { class: 'field field--tight' },
      h('legend', { class: 'sr-only' }, 'Height in'),
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
              name: ids.hu,
              value,
              checked: form.heightUnit === value,
              onchange: () => {
                if (form.heightUnit === 'cm' && Number(form.cm)) {
                  const fi = ftInFromCm(Number(form.cm));
                  form.ft = fi.ft;
                  form.inches = fi.inches;
                } else if (form.heightUnit === 'ftin' && Number(form.ft)) {
                  form.cm = round(cmFromFtIn(Number(form.ft), Number(form.inches) || 0));
                }
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
    numberField('Weight', form.weight, (v) => (form.weight = v), {
      suffix: weightUnit,
      id: weightId,
    }),
    showBodyFat
      ? numberField('Body fat (optional)', form.bodyFat, (v) => (form.bodyFat = v), {
          suffix: '%',
          id: bodyFatId,
          help: 'Only if you know it from a body scan. Leave empty otherwise.',
        })
      : null,
    h(
      'fieldset',
      { class: 'field' },
      h('legend', { class: 'field-label' }, 'How active is a normal day?'),
      h(
        'div',
        { class: 'choice-list' },
        rules.activityLevels.map((a) =>
          choice(
            ids.act,
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
      { class: 'field', dataset: { field: 'goal' } },
      h('legend', { class: 'field-label' }, 'What do you want?'),
      h(
        'div',
        { class: 'choice-row' },
        rules.goals.map((g) =>
          choice(ids.goal, g.id, g.label, form.goal === g.id, () => {
            form.goal = g.id;
            setError('goal', null);
            renderRate();
          }),
        ),
      ),
      h(
        'p',
        { class: 'field-help' },
        'Not sure? Keep my weight is a safe place to start. You can change it any time.',
      ),
      h('p', { class: 'field-error', hidden: true }),
    ),
    rateBox,
    h(
      'details',
      { class: 'form-flags', open: form.flags.size > 0 },
      h('summary', null, 'Anything we should know? (optional)'),
      h('p', { class: 'field-help' }, 'Tick any that apply. Your targets change to keep you safe.'),
      flagsBox,
    ),
    h(
      'div',
      { class: 'form-actions' },
      h('button', { type: 'submit', class: 'btn btn-primary btn-block' }, props.submitLabel),
      props.secondary ?? null,
    ),
  );

  function setError(field, text) {
    const box = el.querySelector(`[data-field="${field}"]`);
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

  function submit() {
    const limits = rules.profileLimits;
    const num = (v) => Number(String(v).trim().replace(',', '.'));
    const problems = [];
    const check = (field, value, lim, what, convert = (x) => x) => {
      const n = num(value);
      let msg = null;
      if (String(value).trim() === '') msg = `Please type your ${what}.`;
      else if (!Number.isFinite(n)) msg = `Use a number for your ${what}.`;
      else if (convert(n) < lim.min || convert(n) > lim.max) {
        msg = 'That number looks too small or too big. Please check it.';
      }
      setError(field, msg);
      if (msg) problems.push(field);
      return convert(n);
    };
    setError('sex', form.sex ? null : 'Please choose one.');
    if (!form.sex) problems.push('sex');
    const age = check(ageId, form.age, limits.ageYears, 'age');
    let heightCm;
    const heightField = heightBox.querySelector('[data-field]')?.dataset.field;
    if (form.heightUnit === 'cm') {
      heightCm = check(heightField, form.cm, limits.heightCm, 'height');
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
      setError(heightField, bad);
      if (bad) problems.push(heightField);
    }
    const weightKg = check(weightId, form.weight, limits.weightKg, 'weight', (n) =>
      weightUnit === 'lb' ? kgFromLb(n) : n,
    );
    let bodyFatPct;
    if (showBodyFat && String(form.bodyFat).trim() !== '') {
      bodyFatPct = check(bodyFatId, form.bodyFat, limits.bodyFatPct, 'body fat');
    } else if (showBodyFat) {
      setError(bodyFatId, null);
    }
    // In screen order, after the numbers: the goal fieldset comes below them.
    setError('goal', form.goal ? null : 'Please choose what you want.');
    if (!form.goal) problems.push('goal');
    if (problems.length) {
      el.querySelector(`[data-field="${problems[0]}"] input`)?.focus();
      return;
    }
    const next = {
      sex: form.sex,
      ageYears: Math.round(age),
      heightCm: round(heightCm, 1),
      weightKg: round(weightKg, 1),
      activity: form.activity,
      goal: form.goal,
      rateKgPerWeek: form.goal === 'maintain' ? 0 : form.rate,
      lifts: form.lifts,
      healthFlags: [...form.flags],
    };
    if (bodyFatPct !== undefined) next.bodyFatPct = bodyFatPct;
    props.onSubmit(next, { height: form.heightUnit });
  }

  return el;
}
