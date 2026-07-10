# Bazi Module Guide

This is the required entry point for every Bazi worktree. Read this file and one
module document only. Expand scope only when the named interface is missing.

## Working Rules

- Base branch: `codex/bazi-local-work`.
- One worktree owns one module. Keep edits inside that module's boundary.
- Preserve all user changes already present in the worktree.
- Do not push GitHub or merge branches from a module worktree.
- The coordinator window reviews, integrates, runs the full checks, and pushes.
- Bazi conclusions must expose evidence and uncertainty. Do not turn a weak clue
  into a definitive pattern, special structure, strength, or useful-element claim.
- Do not change pillar calculation or solar-term boundaries from AI or UI work.

## File Map

| File | Responsibility |
| --- | --- |
| `bazi-engine.js` | Pillars, ten gods, strength, pattern/useful analysis, luck data |
| `bazi.html` | Page markup/CSS, rendering, UI state, AI prompt/history, local records |
| `check-bazi-page.js` | Page contracts and focused Bazi behavior checks |
| `check-baselines.js` | 18 reference-chart regression checks |

## Minimum Read Protocol

1. Read this guide and the assigned module document.
2. Use the listed `rg` search anchors in the named files.
3. Read only the matched function plus its direct callers.
4. Edit the smallest shared function that fixes the behavior.
5. Run the module checks listed below.
6. Report changed files, checks, and any uncertainty to the coordinator.

Avoid `rg --files`, broad repository searches, repeated whole-file reads, and
unrelated formatting. A second file is justified only by a direct interface named
in the module document.

## Verification

Run the focused page check for every Bazi change:

```powershell
node .\check-bazi-page.js
```

Run the baseline suite when calculation output can change:

```powershell
node .\check-baselines.js
```

Run syntax checks for modified JavaScript files:

```powershell
node --check .\bazi-engine.js
node --check .\check-bazi-page.js
```

## Integration Contract

Module worktrees must leave a small commit or a clean diff for coordinator review.
The coordinator decides merge order because `bazi.html` is currently shared by AI,
luck rendering, and UI work. Physical extraction from `bazi.html` will be handled as
a separate refactor after module behavior is stable.
