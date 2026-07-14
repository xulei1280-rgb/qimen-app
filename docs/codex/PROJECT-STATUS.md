# Project Status

`main` is the only shared, publishable source of truth. Git commits are the
detailed change history; this file records only the latest handoff state.

## Start Here

1. `git switch main`
2. `git pull --rebase origin main`
3. Read this file, then `AGENTS.md` and the relevant Bazi module document.

Do not begin a new task while another computer has uncommitted work on `main`.
Use a dedicated module worktree when work must happen in parallel.

## Current Shared Baseline

- Shared branch: `main`
- Project pages: Qimen homepage `index.html`; Bazi page `bazi.html`
- Bazi calculation: `bazi-engine.js`
- Bazi validation: `check-bazi-page.js` and `check-baselines.js`
- Module rules: `AGENTS.md` and `docs/codex/modules/`

## Active Handoff

- Owner: P2
- Working branch: `main`
- Last shared commit: `b16682a`
- Changed: confirmed and published `PAT-LV-DESIGN-v1`, the formal design for
  natal structure scoring, the 518,400-chart equal-weight theoretical set,
  midpoint tie percentiles, five candidate grades, Zi Ping hard gates,
  cross-dimension numeric ownership, and shared ordinary/professional outputs;
  no runtime or Qimen files changed.
- Checks: `node --check bazi-engine.js`; `node --check check-bazi-page.js`;
  `node check-bazi-page.js` (`bazi page checks ok`); `node check-baselines.js`
  (`18 baselines ok`); `git diff --check`.
- Next task: P2 pulls `main`, reads
  `docs/codex/modules/pattern-percentile-design.md`, and implements the design
  in order: unified `causeId / numericOwner`, the pure 518,400-chart generator,
  full-set distribution and boundary audit, then a sensitivity report for user
  review. Do not start display integration before the score model is frozen.
- Caution: `10/25/25/15/20/5` is the approved audit candidate, not a frozen
  production weight set. Keep the active `20/25/20/15/15/5` model as the
  comparison baseline, and do not change rule conditions and weights in the
  same audit run.

## Replace At Each Handoff

```text
Owner: P1 or P2
Last shared commit: <short SHA>
Changed: <one-line module summary>
Checks: <exact commands and result>
Next task: <one clear task>
Caution: <known limitation or none>
```

## Worktree Policy

- Module worktrees are for parallel or risky edits only.
- Each module worktree commits a focused change for coordinator review.
- Only the coordinator integrates that commit into `main`, updates this file,
  verifies the combined state, and pushes it.
