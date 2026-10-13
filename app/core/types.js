// Shared JSDoc types for Katori. No runtime code. Owner: Lena (contract).
// Source of truth: docs/ARCHITECTURE.md §4. Keep both in step.

/**
 * @typedef {'kcal'|'protein'|'carbs'|'fat'|'fiber'} NutrientKey
 * @typedef {{ kcal: number, protein: number, carbs: number, fat: number, fiber: number }} Nutrients
 *   Grams, except kcal. `carbs` = available carbohydrate (fibre excluded).
 *
 * @typedef {Nutrients & { sugars?: number, satFat?: number, sodium?: number }} Per100g
 *   sodium in mg; everything else in g (kcal in kcal). kcal whole, macros to 0.1 g.
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
 * @property {string} group         HARD. An id from RULES.vocab.groups.
 * @property {string} state         HARD for the Lab. What the numbers describe.
 * @property {'home'|'restaurant'|'dhaba'|'street'} [style]
 * @property {string} [family]      Links style variants of one dish.
 * @property {Per100g} per100g      HARD. Five required keys, all >= 0.
 * @property {number} [addedFatPer100g]
 * @property {Serving[]} servings   HARD. At least one; exactly one `default: true`.
 * @property {string[]} tags        HARD. Ids from RULES.vocab.tags (RULES.vocab.tagRules apply).
 * @property {string[]} [slots]     Meal-slot hints. Slot ids.
 * @property {Source} source        HARD `citation`.
 * @property {Halal} halal          HARD (meeting 002). Replaces the halal tags.
 *
 * @typedef {{ status: 'halal'|'check'|'not-halal', reason?: string }} Halal
 *   reason: required and non-empty unless status is 'halal'. Shown one tap from the chip.
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
 * @typedef {string} HealthFlag  an id from RULES.healthFlags (pregnant, breastfeeding,
 *   eating_disorder, kidney_disease, diabetes_hypo_risk at Step 0). Derived flags (minor,
 *   underweight, age_over_80) are computed from the profile, never stored.
 *
 * @typedef {object} Profile
 * @property {'male'|'female'} sex
 * @property {number} ageYears
 * @property {number} heightCm
 * @property {number} weightKg
 * @property {number} [bodyFatPct]
 * @property {ActivityLevel} activity
 * @property {'lose'|'maintain'|'gain'} goal
 * @property {number} rateKgPerWeek   one of RULES.goals[goal].ratesKgPerWeek (0 for maintain).
 * @property {boolean} lifts          Weight training at least twice a week.
 * @property {HealthFlag[]} healthFlags
 *
 * @typedef {{ proteinGPerKg?: number|null, fatPct?: number|null }} TargetPrefs
 *   The user's own choices (NUTRITION.md §2.1): proteinGPerKg (per kg PRW) clamped to
 *   RULES.protein.overrideGPerKgPrw; fatPct (of kcal) clamped to RULES.fat.pctOfKcalRange.
 *
 * @typedef {object} TargetResult
 * @property {boolean} ok            false = a noTargets effect applies (e.g. minor): logging only.
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
 * @property {'lose'|'maintain'|'gain'} effectiveGoal  After flag effects (lockGoal, disallowGoals).
 * @property {number|null} energyDelta            Unrounded kcal/day vs TDEE after rails (negative = deficit).
 * @property {number|null} effectiveRateKgPerWeek Signed kg/week after rails (negative = loss).
 * @property {string[]} warnings                  NUTRITION.md §2.2: 'estimate' first when ok, then
 *   the RULES.warnings codes that fired and the ids of active health and derived flags (order
 *   after 'estimate' not significant).
 *
 * @typedef {{ servingId: string, qty: number, count: number, lastUsed: string,
 *   slots: Partial<Record<SlotId, number>> }} Recent
 *
 * @typedef {object} Settings
 * @property {'default'|'spain'} slotPreset  RULES.mealSlots preset; 'spain' by default on Madrid time
 * @property {Partial<Record<SlotId, string>>} slotLabels  user renames; missing = the preset's label
 * @property {boolean} halalOnly       default true: hide 'not-halal' foods (meeting 002)
 * @property {'all'|'fish-prawns'|'fish-only'} seafood  reserved (Sprint 2 question); default 'all'
 * @property {number} dayStartMinutes  logging day starts here; default 240 (04:00), 0..300
 * @property {'pending'|'done'|'skipped'} onboarding  default 'pending'; skipped = reference targets
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
 * @property {object[]} recipes   reserved for Sprint 2 (whole-pot recipes); [] in Sprint 1
 * @property {object[]} batches   reserved for Sprint 2 (meal-prep batches and boxes); [] in Sprint 1
 */

export {};
