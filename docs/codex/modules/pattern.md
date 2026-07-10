# Pattern And Useful-Element Module

## Goal

Produce evidence-based strength, main pattern, pattern condition, special-pattern
status, useful elements, and favorable/unfavorable interaction conclusions.

## Primary File

Start with `bazi-engine.js`. Search only these anchors:

```powershell
rg -n "analyzePattern|strength|pattern|useful|special|comboConflict|remedy" bazi-engine.js check-bazi-page.js
```

## Decision Boundary

- `命格` is the principal conventional pattern supported by the chart.
- `格局层次` describes completion, defects, rescue, and stability; it is not a
  duplicate list of candidate patterns.
- Only the highest-weight main pattern is displayed as the principal pattern.
- From/transform/special patterns require their full conditions. If conditions are
  incomplete, label them as a reference clue, not an established pattern.
- Favorable and damaging combinations may coexist. Preserve main structure, damage,
  rescue, and luck-trigger evidence instead of forcing one good/bad verdict.

## Out of Scope

- UI layout beyond rendering fields already returned by the engine.
- AI prompt/history and saved-record behavior.
- Luck selector interaction.

## Required Checks

```powershell
node --check .\bazi-engine.js
node .\check-bazi-page.js
node .\check-baselines.js
```
