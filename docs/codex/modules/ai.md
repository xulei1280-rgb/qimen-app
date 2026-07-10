# AI Analysis Module

## Goal

Keep AI prompts, follow-up context, fact checks, and saved conversations aligned
with the latest chart analysis and selected luck state.

## Primary File

Start with `bazi.html`. Search only these anchors:

```powershell
rg -n "selectedLuckContextText|buildAiContextSnapshot|renderAiPanel|renderAiHistory|renderFactCheck|analyzeBazi|saveBaziRecord|loadBaziRecord" bazi.html check-bazi-page.js
```

Relevant state: `aiHistory`, `luckSelection`, `currentBazi`.

## Allowed Scope

- AI prompt and mode instructions.
- Initial question and follow-up context.
- Selected luck/year/month context copied into prompts and records.
- AI history rendering, collapse/delete behavior, and local validation messages.
- Save/load persistence for AI conversation state.

## Out of Scope

- Pillar, solar-term, strength, pattern, useful-element, or luck calculations.
- Bazi engine changes unless a required output field does not exist. Report that
  missing interface to the coordinator before expanding scope.
- General page redesign.

## Required Checks

```powershell
node .\check-bazi-page.js
node --check .\check-bazi-page.js
```

If `bazi-engine.js` was touched, also run `node .\check-baselines.js`.
