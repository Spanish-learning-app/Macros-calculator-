// Profile (route `profile`). Owner: Priya.
// Edit the profile; protein g/kg and fat % preferences (ranges from RULES); manual target
// overrides; meal times (Pakistani / Spanish preset) and slot names; "My day starts at"
// (00:00–05:00, team/DECISIONS.md); "Halal only"; units, first day of the week, theme and
// (when offered) hiding calories. Everything is labelled as an estimate.
import { h, mountChildren, uid } from '../dom.js';
import { createProfileForm } from '../components/profile-form.js';
import { createUndoToast } from '../components/toast.js';
import { fmtKcal, fmtGrams, fmtMinutes, ESTIMATE_LINE } from '../components/format.js';
import { targetNotes } from './welcome.js';

const PRESET_NAMES = { default: 'Pakistani meal times', spain: 'Spanish meal times' };
const KEYS = [
  ['kcal', 'Energy', 'kcal'],
  ['protein', 'Protein', 'g'],
  ['carbs', 'Carbs', 'g'],
  ['fat', 'Fat', 'g'],
  ['fiber', 'Fibre', 'g'],
];

/**
 * @param {HTMLElement} container @param {{ store: object, router: object, rules: object }} ctx
 */
export function mount(container, ctx) {
  const { store, router, rules } = ctx;
  const toast = createUndoToast({ store });
  const root = h('div', { class: 'view view-profile' });
  const targetsCard = h('section', { class: 'card', 'aria-labelledby': 'targets-h' });
  mountChildren(container, root, toast.el);

  const settings = () => store.settings();
  const num = (v) => Number(String(v).trim().replace(',', '.'));

  // ------------------------------------------------------------------ targets
  function renderTargets() {
    const targets = store.targets();
    const result = store.targetResult();
    const info = store.targetInfo();
    const overrides = store.getState().data.targetOverrides ?? {};
    const prefs = store.getState().data.targetPrefs ?? {};
    const pRange = rules.protein.overrideGPerKgPrw;
    const fRange = rules.fat.pctOfKcalRange;

    const overrideRow = ([key, label, unit]) => {
      const id = uid(`ovr-${key}`);
      const computed =
        info.kind === 'personal' ? result?.[key] : (rules.skipDefaults?.targets?.[key] ?? null);
      const input = h('input', {
        id,
        class: 'input input--num',
        type: 'text',
        inputmode: 'decimal',
        autocomplete: 'off',
        placeholder: computed == null ? '' : String(computed),
        value: overrides[key] == null ? '' : String(overrides[key]),
        onchange: () => {
          const raw = input.value.trim();
          if (raw === '') {
            store.setTargetOverride(key, null);
            return;
          }
          const n = num(raw);
          if (!Number.isFinite(n) || n <= 0) {
            err.hidden = false;
            return;
          }
          err.hidden = true;
          store.setTargetOverride(key, n);
        },
      });
      const err = h('p', { class: 'field-error', hidden: true }, 'Use a number above 0.');
      return h(
        'div',
        { class: 'target-row' },
        h('label', { class: 'target-label', for: id }, label),
        h(
          'span',
          { class: 'target-now', 'data-testid': `target-${key}` },
          targets?.[key] == null
            ? '—'
            : `${key === 'kcal' ? fmtKcal(targets[key]) : fmtGrams(targets[key])} ${unit}`,
        ),
        h(
          'div',
          { class: 'input-suffix target-input' },
          input,
          h('span', { 'aria-hidden': 'true' }, unit),
        ),
        err,
      );
    };

    const prefField = (label, key, range, unit, help) => {
      const id = uid(key);
      const input = h('input', {
        id,
        class: 'input input--num',
        type: 'text',
        inputmode: 'decimal',
        autocomplete: 'off',
        placeholder: 'Default',
        value: prefs[key] == null ? '' : String(prefs[key]),
        onchange: () => {
          const raw = input.value.trim();
          if (raw === '') {
            err.hidden = true;
            store.setTargetPrefs({ [key]: null });
            return;
          }
          const n = num(raw);
          if (!Number.isFinite(n) || n < range.min || n > range.max) {
            err.hidden = false;
            return;
          }
          err.hidden = true;
          store.setTargetPrefs({ [key]: n });
        },
      });
      const err = h(
        'p',
        { class: 'field-error', hidden: true },
        `Use a number from ${range.min} to ${range.max}.`,
      );
      return h(
        'div',
        { class: 'field' },
        h('label', { class: 'field-label', for: id }, label),
        h('div', { class: 'input-suffix' }, input, h('span', { 'aria-hidden': 'true' }, unit)),
        h('p', { class: 'field-help' }, help),
        err,
      );
    };

    mountChildren(
      targetsCard,
      h('h3', { class: 'card-title', id: 'targets-h' }, 'Your daily targets'),
      h(
        'p',
        { class: 'result-kind' },
        info.chip
          ? h('span', { class: 'chip-kind', 'data-testid': 'target-kind' }, info.chip)
          : null,
        ' ',
        h('span', null, info.kind === 'reference' ? info.label : ESTIMATE_LINE),
      ),
      info.kind === 'none'
        ? h('p', { class: 'field-help' }, rules.warnings?.no_targets ?? '')
        : h(
            'div',
            { class: 'target-table' },
            h(
              'p',
              { class: 'target-row target-row--head', 'aria-hidden': 'true' },
              h('span', null, ''),
              h('span', null, 'Now'),
              h('span', null, 'Your own number'),
            ),
            KEYS.map(overrideRow),
            h('p', { class: 'field-help' }, 'Leave a box empty to use the estimate.'),
          ),
      h(
        'ul',
        { class: 'result-notes', role: 'list' },
        targetNotes(result, rules).map((t) => h('li', null, t)),
      ),
      info.kind === 'personal'
        ? h(
            'details',
            { class: 'prefs' },
            h('summary', null, 'Protein and fat choices'),
            prefField(
              'Protein per kg',
              'proteinGPerKg',
              pRange,
              'g/kg',
              `From ${pRange.min} to ${pRange.max} g per kg. Empty uses the usual amount for your goal.`,
            ),
            prefField(
              'Fat share of energy',
              'fatPct',
              fRange,
              '%',
              `From ${fRange.min} to ${fRange.max} %. Empty uses ${rules.fat.defaultPctOfKcal} %.`,
            ),
          )
        : null,
    );
  }

  // ------------------------------------------------------------------ settings
  function radioGroup(legend, name, options, current, onPick, help = null) {
    return h(
      'fieldset',
      { class: 'field' },
      h('legend', { class: 'field-label' }, legend),
      h(
        'div',
        { class: 'choice-row' },
        options.map(([value, label]) =>
          h(
            'label',
            { class: 'choice' },
            h('input', {
              type: 'radio',
              name,
              value: String(value),
              checked: value === current,
              onchange: () => onPick(value),
            }),
            h('span', { class: 'choice-text' }, h('span', { class: 'choice-label' }, label)),
          ),
        ),
      ),
      help ? h('p', { class: 'field-help' }, help) : null,
    );
  }

  function slotTimes(preset) {
    return (rules.mealSlots[preset] ?? [])
      .map((s) => `${s.label} ${fmtMinutes(s.hours[0])}–${fmtMinutes(s.hours[1] % 1440)}`)
      .join(' · ');
  }

  function mealsCard() {
    const s = settings();
    const presets = Object.keys(PRESET_NAMES).filter((p) => rules.mealSlots[p]);
    const labelsBox = h('div', { class: 'slot-names' });
    const renderLabels = () => {
      const preset = settings().slotPreset;
      labelsBox.replaceChildren(
        ...store.slots().map(({ id }) => {
          const inputId = uid(`slot-${id}`);
          const presetLabel = rules.mealSlots[preset]?.find((x) => x.id === id)?.label ?? id;
          const input = h('input', {
            id: inputId,
            class: 'input',
            type: 'text',
            autocomplete: 'off',
            placeholder: presetLabel,
            value: settings().slotLabels?.[id] ?? '',
            onchange: () => {
              const labels = { ...(settings().slotLabels ?? {}) };
              const v = input.value.trim();
              if (v) labels[id] = v;
              else delete labels[id];
              store.updateSettings({ slotLabels: labels });
            },
          });
          return h(
            'div',
            { class: 'field field--slot' },
            h('label', { class: 'field-label', for: inputId }, `Name for ${presetLabel}`),
            input,
          );
        }),
      );
    };
    renderLabels();
    const startOptions = [];
    for (let m = 0; m <= 300; m += 30) startOptions.push(m);
    const dayStart = h(
      'select',
      {
        id: 'day-start',
        class: 'select',
        onchange: (e) => store.updateSettings({ dayStartMinutes: Number(e.target.value) }),
      },
      startOptions.map((m) =>
        h(
          'option',
          { value: String(m), selected: m === (s.dayStartMinutes ?? 240) },
          fmtMinutes(m),
        ),
      ),
    );
    return h(
      'section',
      { class: 'card', 'aria-labelledby': 'meals-h' },
      h('h3', { class: 'card-title', id: 'meals-h' }, 'Meals and days'),
      radioGroup(
        'Meal times',
        uid('preset'),
        presets.map((p) => [p, PRESET_NAMES[p]]),
        s.slotPreset,
        (p) => {
          store.updateSettings({ slotPreset: p });
          renderLabels();
          presetHelp.textContent = slotTimes(p);
        },
      ),
      h('p', { class: 'field-help preset-help' }, slotTimes(s.slotPreset)),
      h(
        'details',
        { class: 'prefs' },
        h('summary', null, 'Rename meals'),
        h('p', { class: 'field-help' }, 'Leave a box empty to keep the usual name.'),
        labelsBox,
      ),
      h(
        'div',
        { class: 'field' },
        h('label', { class: 'field-label', for: 'day-start' }, 'My day starts at'),
        dayStart,
        h(
          'p',
          { class: 'field-help' },
          'Food you eat after midnight and before this time counts for the day before, so a late snack stays with tonight.',
        ),
      ),
    );
  }
  let presetHelp = null;

  function foodCard() {
    const toggle = h('input', {
      type: 'checkbox',
      role: 'switch',
      class: 'switch-input',
      checked: Boolean(settings().halalOnly),
      onchange: () => store.updateSettings({ halalOnly: toggle.checked }),
    });
    return h(
      'section',
      { class: 'card', 'aria-labelledby': 'food-h' },
      h('h3', { class: 'card-title', id: 'food-h' }, 'Food'),
      h(
        'label',
        { class: 'switch switch--row' },
        toggle,
        h('span', { class: 'switch-track', 'aria-hidden': 'true' }),
        h('span', null, 'Halal only'),
      ),
      h(
        'p',
        { class: 'field-help' },
        'Hides foods whose usual recipe has lard. Search always tells you when something is hidden, and why.',
      ),
      seafoodField(),
    );
  }

  /** Seafood (meeting 002, decision 6): the person's own choice; Katori never rules on it. */
  function seafoodField() {
    const choices = rules.vocab?.halalRules?.seafoodChoices ?? [];
    if (!choices.length) return null;
    const note = rules.vocab.halalRules.seafoodNote ?? 'Depends on your school of thought.';
    return radioGroup(
      'Seafood I eat',
      'seafood',
      choices.map((c) => [c.id, c.label]),
      settings().seafood ?? rules.vocab.halalRules.seafoodDefault ?? 'all',
      (value) => store.updateSettings({ seafood: value }),
      `Other seafood shows a “check” label: ${note.charAt(0).toLowerCase()}${note.slice(1)} Katori never decides this for you.`,
    );
  }

  function displayCard() {
    const s = settings();
    const units = s.units ?? { weight: 'kg', height: 'cm' };
    return h(
      'section',
      { class: 'card', 'aria-labelledby': 'display-h' },
      h('h3', { class: 'card-title', id: 'display-h' }, 'Units and look'),
      radioGroup(
        'Weight in',
        uid('wu'),
        [
          ['kg', 'kg'],
          ['lb', 'lb'],
        ],
        units.weight,
        (v) => {
          store.updateSettings({ units: { ...settings().units, weight: v } });
          render();
        },
      ),
      radioGroup(
        'Height in',
        uid('hu'),
        [
          ['cm', 'cm'],
          ['ftin', 'feet and inches'],
        ],
        units.height,
        (v) => {
          store.updateSettings({ units: { ...settings().units, height: v } });
          render();
        },
      ),
      radioGroup(
        'Week starts on',
        uid('ws'),
        [
          [1, 'Monday'],
          [0, 'Sunday'],
          [6, 'Saturday'],
        ],
        s.weekStartsOn ?? 1,
        (v) => store.updateSettings({ weekStartsOn: v }),
      ),
      radioGroup(
        'Theme',
        uid('theme'),
        [
          ['system', 'Same as phone'],
          ['light', 'Light'],
          ['dark', 'Dark'],
        ],
        s.theme ?? 'system',
        (v) => {
          store.updateSettings({ theme: v });
          applyTheme(v);
        },
      ),
      store.hideCaloriesOffered() || s.hideCalories
        ? h(
            'label',
            { class: 'switch switch--row' },
            h('input', {
              type: 'checkbox',
              role: 'switch',
              class: 'switch-input',
              checked: Boolean(s.hideCalories),
              onchange: (e) => store.updateSettings({ hideCalories: e.target.checked }),
            }),
            h('span', { class: 'switch-track', 'aria-hidden': 'true' }),
            h('span', null, 'Hide calorie numbers'),
          )
        : null,
    );
  }

  // ------------------------------------------------------------------ page
  function render() {
    const s = settings();
    const profile = store.getState().data.profile;
    const status = h('p', { class: 'form-status', role: 'status', 'aria-live': 'polite' });
    const meals = mealsCard();
    presetHelp = meals.querySelector('.preset-help');
    renderTargets();
    mountChildren(
      root,
      h('h2', { class: 'view-title' }, 'Profile'),
      h(
        'div',
        { class: 'profile-layout' },
        h(
          'div',
          { class: 'profile-col' },
          targetsCard,
          h(
            'section',
            { class: 'card', 'aria-labelledby': 'you-h' },
            h('h3', { class: 'card-title', id: 'you-h' }, 'About you'),
            profile
              ? null
              : h(
                  'p',
                  { class: 'field-help' },
                  'You are using reference numbers. Fill this in for your own targets.',
                ),
            createProfileForm({
              rules,
              profile,
              heightUnit: s.units?.height,
              weightUnit: s.units?.weight,
              showBodyFat: true,
              submitLabel: profile ? 'Save changes' : 'Set my targets',
              onSubmit(next) {
                store.setProfile(next);
                status.textContent = 'Saved. Your targets are updated.';
              },
            }),
            status,
          ),
        ),
        h(
          'div',
          { class: 'profile-col' },
          meals,
          foodCard(),
          displayCard(),
          h(
            'section',
            { class: 'card', 'aria-labelledby': 'more-h' },
            h('h3', { class: 'card-title', id: 'more-h' }, 'More'),
            h(
              'p',
              null,
              h(
                'a',
                { class: 'link-btn', href: router.href({ name: 'data', params: {} }) },
                'Your data: back up, restore or reset',
              ),
            ),
            h(
              'p',
              null,
              h(
                'a',
                { class: 'link-btn', href: router.href({ name: 'about', params: {} }) },
                'About the data: where the numbers come from',
              ),
            ),
          ),
        ),
      ),
    );
  }

  function applyTheme(theme) {
    if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
    else delete document.documentElement.dataset.theme;
  }

  const unsubscribe = store.subscribe(() => {
    if (!targetsCard.contains(document.activeElement)) renderTargets();
  });

  return {
    update() {
      render();
    },
    unmount() {
      unsubscribe();
      toast.destroy();
      container.replaceChildren();
    },
  };
}
