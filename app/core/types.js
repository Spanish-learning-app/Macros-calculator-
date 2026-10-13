// Shared JSDoc types for Katori. No runtime code. Owner: Lena (contract).
// Source of truth: docs/ARCHITECTURE.md §4. Keep both in step.

/**
 * @typedef {'kcal'|'protein'|'carbs'|'fat'|'fiber'} NutrientKey
 * @typedef {{ kcal: number, protein: number, carbs: number, fat: number, fiber: number }} Nutrients
 *   Grams, except kcal. `carbs` = available carbohydrate (fibre excluded).
 *
 * @typedef {Nutrients & { sugars?: number, satFat?: number, sodium?: number }} Per100g
 *   sodium in mg; everything else in g (kcal in kcal).
 *
 * @typedef {{ id: string, label: string, labelUr?: string, grams: number, default?: boolean }} Serving
 *
 * @typedef {{ citation: string, method?: 'direct'|'recipe'|'label'|'analogue',
 *   confidence?: 'A'|'B'|'C', reviewer?: string, date?: string, notes?: string }} Source
 *
 * @typedef {object} Food
 * @property {string} id            HARD. Permanent kebab-case id, prefix pk-|es-|med-|intl- (my- for user foods).
 * @property {string} name          HARD. English display name.
 * @property {string} [nameUr]      Urdu script.
 * @property {string} [nameRoman]   Roman Urdu.
 * @property {string[]} aliases     HARD (may be empty).
 * @property {string} group         HARD. From RULES.vocab.groups.
 * @property {string} state         HARD for the Lab. What the numbers describe.
 * @property {'home'|'restaurant'|'dhaba'|'street'} [style]
 * @property {string} [family]      Links style variants of one dish.
 * @property {Per100g} per100g      HARD. Five required keys, all >= 0.
 * @property {number} [addedFatPer100g]
 * @property {Serving[]} servings   HARD. At least one; exactly one `default: true`.
 * @property {string[]} tags        HARD (may be empty). From RULES.vocab.tags.
 * @property {string[]} [slots]     Meal-slot hints. Slot ids.
 * @property {Source} source        HARD `citation`.
 *
 * @typedef {'breakfast'|'lunch'|'evening'|'dinner'|'snacks'} SlotId
 * @typedef {'planned'|'eaten'} EntryStatus
 *
 * @typedef {object} Entry
 * @property {string} id
 * @property {SlotId} slot
 * @property {string|null} foodId     null for a quick-add entry.
 * @property {string|null} servingId  'g' = grams; null for quick add.
 * @property {number} qty             > 0. Fractions allowed (0.5, 1.5).
 * @property {EntryStatus} status
 * @property {{ name: string, grams: number|null } & Nutrients} snapshot  Values at log time.
 *
 * @typedef {{ date: string, entries: Entry[] }} Day   date = local 'YYYY-MM-DD'
 *
 * @typedef {'sedentary'|'light'|'moderate'|'very_active'|'extra_active'} ActivityLevel
 * @typedef {'pregnant'|'breastfeeding'|'eating_disorder'|'kidney_disease'|'diabetes_hypo_risk'} HealthFlag
 *
 * @typedef {object} Profile
 * @property {'male'|'female'} sex
 * @property {number} ageYears
 * @property {number} heightCm
 * @property {number} weightKg
 * @property {number} [bodyFatPct]
 * @property {ActivityLevel} activity
 * @property {'lose'|'maintain'|'gain'} goal
 * @property {number} rateKgPerWeek   0 for maintain; positive number for lose and gain.
 * @property {boolean} lifts          Weight training at least twice a week.
 * @property {HealthFlag[]} healthFlags
 *
 * @typedef {{ proteinGPerKg?: number|null, fatPct?: number|null }} TargetPrefs
 *
 * @typedef {object} TargetResult
 * @property {boolean} ok            false = no targets may be shown (logging only).
 * @property {number|null} kcal
 * @property {number|null} protein
 * @property {number|null} carbs
 * @property {number|null} fat
 * @property {number|null} fiber
 * @property {number|null} bmr
 * @property {number|null} tdee
 * @property {number|null} bmi
 * @property {number|null} prw
 * @property {'mifflin'|'katch'|null} bmrFormula
 * @property {'lose'|'maintain'|'gain'|null} effectiveGoal
 * @property {number|null} energyDelta            Unrounded kcal/day vs TDEE (negative = deficit).
 * @property {number|null} effectiveRateKgPerWeek Signed (negative = loss).
 * @property {string[]} flags                     Machine codes; see ARCHITECTURE.md §5.5.
 *
 * @typedef {{ servingId: string, qty: number, count: number, lastUsed: string,
 *   slots: Partial<Record<SlotId, number>> }} Recent
 *
 * @typedef {object} Settings
 * @property {{ id: SlotId, label: string }[]} slots
 * @property {{ weight: 'kg'|'lb', height: 'cm'|'ftin' }} units
 * @property {0|1|6} weekStartsOn
 * @property {'system'|'light'|'dark'} theme
 * @property {boolean} hideCalories
 *
 * @typedef {object} UserData
 * @property {number} schemaVersion
 * @property {Profile|null} profile
 * @property {TargetPrefs} targetPrefs
 * @property {Partial<Nutrients>} targetOverrides
 * @property {Settings} settings
 * @property {Record<string, Day>} days
 * @property {Food[]} customFoods
 * @property {Record<string, Recent>} recents
 */

export {};
