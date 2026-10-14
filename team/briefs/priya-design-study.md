# Priya — Design study: what the market leaders do (Boss's suggestion, 2026-10-14)

**Owner:** Priya Raman (UI Engineer). No new hire: Priya is free since Sprint 1 ended.
**Asked by:** the Boss, via Omar. **Decided at:** Meeting 004 (design review), after this study.

## Why

The Boss wants Katori to look and feel at least as good as the big apps people already use, not
like a generic tracker. Before Sprint 3 polish, we check our design against the market leaders and
decide: keep it, refine it, or change direction.

## What to study

The big ones only (large install base, big teams, design that users praise):

| App | Why it is on the list |
|-----|-----------------------|
| MyFitnessPal | The largest food tracker; the logging flow most users know |
| MacroFactor | Widely praised for fast logging and a calm, data-first design |
| Cronometer | Accuracy and micronutrients; how it shows sources and data quality |
| Lose It! | Simple, friendly onboarding and daily budget view |
| Yazio | Very large in Europe and Spain; fasting and recipes |
| Lifesum | Known for its visual design and food ratings |
| HealthifyMe | South Asian food at scale; how it handles desi dishes and portions |
| Apple Health / Google Fit | The platform design languages (Apple HIG, Material 3) our users see every day |

Also look at how these apps handle **recipes and meal prep** (batch → portions), because that is
Sprint 2's headline feature.

## How

- Use public material only: app store pages and screenshots, the companies' websites, help
  centres, design write-ups and reviews, and published design guidelines. Use web search and fetch
  if available. If the web is not reachable from the session, say so plainly and work from what
  you already know, marked as such.
- Ask Bilal (7 years on MyFitnessPal, Cronometer, MacroFactor and HealthifyMe) for his likes and
  dislikes through your report; do not wait for him.
- Take screenshots of **our** app at 400 px (light and dark, Madrid time) for side-by-side notes.
  Import Playwright from /opt/node22/lib/node_modules/playwright/index.mjs; never install it.
- Inspiration, not copying: no logos, brand colours, icons or copied layouts.

## Deliverable

`docs/DESIGN-STUDY.md`, short and plain:

1. One block per app: what it does well, what it does badly, what users say (cite sources).
2. **Patterns the leaders share**: logging flow, daily summary, macro display, search, portions,
   empty states, onboarding, colour, type, icons, motion, dark mode.
3. **Katori today vs the leaders**: where we are already better (desi food, katori portions, halal
   status, Madrid slots, honest sources) and where we look or feel worse.
4. **Recommendation**, with three options and your pick:
   - Keep the current design.
   - Refine it: a ranked list of changes, each with an effort estimate (S/M/L) and the files touched.
   - Change direction, if you really think we should.
5. Anything that should change in Lena's Sprint 2 meal-prep screens now, rather than later.

Your files: `docs/DESIGN-STUDY.md`, `team/feedback/design-study/**` (screenshots, notes) and your
journal. Do not edit app code: changes come after Meeting 004 decides.

Final reply, 8–12 lines: the apps covered, your top five findings, your recommended option, and
the effort.
