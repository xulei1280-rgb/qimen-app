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
- Last shared commit: `f2cf809`
- Changed: implemented the `PAT-208` `v4` Bazi scoring candidate with five
  weighted dimensions, a reproducible score ledger, independent score-model
  versioning, friendly percentile endpoints, and a two-pass 23,916-chart
  theoretical baseline; no Qimen files changed and the pre-optimization backup
  remains untouched.
- Checks: `node --check bazi-engine.js`; `node --check check-bazi-page.js`;
  `node check-bazi-page.js` (`bazi page checks ok`); `node check-baselines.js`
  (`18 baselines ok`); `$env:BAZI_FULL_PATTERN_BASELINE='1'; node
  check-bazi-page.js; Remove-Item Env:BAZI_FULL_PATTERN_BASELINE`
  (`bazi page checks ok`); `git diff --check`; local browser QA at desktop and
  390px mobile widths (no horizontal overflow or console errors).
- Next task: let the user review the `v4` output; only after explicit approval
  replace the active scoring backup with this version, otherwise adjust the
  candidate weights and rebuild the frozen baseline.
- Caution: the active rollback source is still `d95c0fd`; 9.66% of the fixed
  grid changes final grade in `v4`, including the representative 官杀混杂盘
  moving from 偏低 to 中等. Caps, diminishing returns, positive/negative
  balance, and parameter-level calibration remain explicitly deferred.

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
