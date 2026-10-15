// Onboarding (route `welcome`). Owner: Priya.
// A1: P1 in ≤ 15 actions, Skip in ≤ 2. No account, data stays on the phone. Height in cm or
// ft/in, weight in kg. Activity labels/descriptions, goals, rates, health flags, warning texts and
// flag notes all come from RULES (never hard-coded nutrition text). Targets are labelled as
// estimates; after Skip the Lab's reference values carry the "Reference" chip (NUTRITION §2.1a).
import { h, mountChildren } from '../dom.js';
import { fmtKcal, fmtGrams, paceNote, ESTIMATE_LINE } from '../components/format.js';
import { createProfileForm } from '../components/profile-form.js';
import { katoriMark } from '../components/icons.js';
import { renderMealNames } from '../components/meal-names.js';

/**
 * Texts for the warning codes and flag ids of a TargetResult (RULES.warnings and flag notes).
 * 'estimate' is said once next to the chip (ESTIMATE_LINE), and a capped pace is told as the pace
 * the target keeps, with its number (Meeting 003 item 6).
 */
export function targetNotes(result, rules) {
  const flags = [...(rules.healthFlags ?? []), ...(rules.derivedFlags ?? [])];
  return (result?.warnings ?? [])
    .filter((code) => code !== 'estimate')
    .map(
      (code) =>
        paceNote(code, result) ??
        rules.warnings?.[code] ??
        flags.find((f) => f.id === code)?.note ??
        null,
    )
    .filter(Boolean);
}

/**
 * @param {HTMLElement} container @param {{ store: object, router: object, rules: object }} ctx
 */
export function mount(container, ctx) {
  const { store, router, rules } = ctx;
  const root = h('div', { class: 'view view-welcome', 'data-testid': 'welcome' });
  mountChildren(container, root);
  let screen = store.onboardingState() === 'pending' ? 'intro' : 'form';

  function go(next) {
    screen = next;
    render();
    window.scrollTo(0, 0);
    root.querySelector('h2')?.focus();
  }

  function skip() {
    store.skipOnboarding();
    router.go({ name: 'day', params: { date: null } });
  }

  function intro() {
    return [
      h(
        'div',
        { class: 'welcome-hero' },
        katoriMark(64),
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
      // Sprint 3 (Meeting 005): meal names, pre-chosen by time zone; one tap changes them.
      renderMealNames({ store, help: 'Only the names change. You can change them in Profile.' }),
      h(
        'div',
        { class: 'form-actions' },
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
          'Skip uses everyday reference numbers. You can set up your own later.',
        ),
      ),
    ];
  }

  function formScreen() {
    const units = store.settings().units ?? { weight: 'kg', height: 'cm' };
    return [
      h('h2', { class: 'view-title', tabindex: '-1' }, 'A few questions about you'),
      h(
        'p',
        { class: 'field-help welcome-lead' },
        'They give you a starting number. You can change everything later.',
      ),
      createProfileForm({
        rules,
        profile: store.getState().data.profile,
        heightUnit: units.height,
        weightUnit: 'kg',
        submitLabel: 'See my targets',
        secondary: h(
          'button',
          { type: 'button', class: 'btn btn-quiet', onclick: skip },
          'Skip for now',
        ),
        onSubmit(profile, chosen) {
          if (units.height !== chosen.height) {
            store.updateSettings({ units: { ...units, height: chosen.height } });
          }
          store.completeOnboarding(profile);
          go('result');
        },
      }),
    ];
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
              h('span', null, ESTIMATE_LINE),
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
              'kcal means calories: the energy in food. Protein helps build and keep muscle.',
            ),
          ]
        : null,
      h(
        'ul',
        { class: 'result-notes', role: 'list' },
        targetNotes(store.targetResult(), rules).map((t) => h('li', null, t)),
      ),
      seafoodQuestion(),
      h(
        'div',
        { class: 'form-actions' },
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

  /**
   * Seafood (meeting 002, decision 6), asked once after the targets so it adds no step before
   * them. Already answered with the default; one tap changes it. Never a ruling.
   */
  function seafoodQuestion() {
    const halalRules = rules?.vocab?.halalRules;
    const choices = halalRules?.seafoodChoices ?? [];
    if (!choices.length) return null;
    const current = store.settings().seafood ?? halalRules.seafoodDefault ?? 'all';
    return h(
      'fieldset',
      { class: 'field welcome-seafood', 'data-testid': 'seafood-question' },
      h('legend', { class: 'field-label' }, 'Which seafood do you eat?'),
      h(
        'div',
        { class: 'choice-row' },
        choices.map((c) =>
          h(
            'label',
            { class: 'choice' },
            h('input', {
              type: 'radio',
              name: 'welcome-seafood',
              value: c.id,
              checked: c.id === current,
              onchange: () => store.updateSettings({ seafood: c.id }),
            }),
            h('span', { class: 'choice-text' }, h('span', { class: 'choice-label' }, c.label)),
          ),
        ),
      ),
      h(
        'p',
        { class: 'field-help' },
        `Anything else is marked “check”. ${halalRules.seafoodNote ?? 'Depends on your school of thought.'} You can change this in Profile.`,
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
