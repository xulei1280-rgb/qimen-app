# Luck Cycle Module

## Goal

Keep major luck, flow year, and flow month calculations, selection state, rendering,
and AI context consistent with solar-term boundaries and the active chart.

## Files And Anchors

Calculation first in `bazi-engine.js`; rendering/state in `bazi.html` only when needed:

```powershell
rg -n "luck|flowYear|flowMonth|solarTerm|monthPillar|getLuckData|luckStart" bazi-engine.js
rg -n "luckSelection|selectedLuckContextText|renderLuck|switchLuckSelection|restoreLuckSelection" bazi.html check-bazi-page.js
```

## Required Behavior

- A newly opened chart selects that chart's current major luck and current flow year.
- Flow month remains unselected until the user selects one.
- Flow months are based on solar-term boundaries and show the Gregorian boundary.
- Saved records restore their own luck selection; state must not leak between charts.
- AI context follows `大运 -> 流年 -> 流月` and includes only selected levels.

## Out of Scope

- Strength, main-pattern, and useful-element rules.
- AI prose, follow-up chat UI, and unrelated page layout.

## Required Checks

```powershell
node --check .\bazi-engine.js
node .\check-bazi-page.js
node .\check-baselines.js
```
