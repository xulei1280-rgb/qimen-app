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
- Last shared commit: `602a8b7`
- Changed: implemented the `PAT-208` `v5` Bazi authority-scoring candidate with
  six attributable dimensions, one verified classical-potential award, strict
  special-pattern qualification and independent natal context, plus a frozen
  23,916-chart theoretical baseline; no Qimen files changed and the active
  rollback backup remains untouched.
- Checks: `node --check bazi-engine.js`; `node --check check-bazi-page.js`;
  `node check-bazi-page.js` (`bazi page checks ok`); `node check-baselines.js`
  (`18 baselines ok`); `$env:BAZI_FULL_PATTERN_BASELINE='1'; node
  check-bazi-page.js; Remove-Item Env:BAZI_FULL_PATTERN_BASELINE`
  (`bazi page checks ok`); `git diff --check`.
- Next task: let the user review the `v5` output; only after explicit approval
  replace the active scoring backup with this version, otherwise adjust the
  candidate weights and rebuild the frozen baseline.
- Caution: the active rollback source is still `d95c0fd`; the `v5` standard
  deviation is 1.369258 times `v4`, slightly above the 1.35 engineering warning
  while the largest score bucket remains 12.4101%. Special-pattern luck-cycle
  rechecking remains deferred to the luck module; caps, diminishing returns,
  positive/negative balance, and parameter calibration also remain deferred.

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
