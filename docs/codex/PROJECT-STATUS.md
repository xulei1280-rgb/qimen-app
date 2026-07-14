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
- Last shared commit: `b5c013a`
- Changed: completed the `PAT-LV-DESIGN-v1` audit-only implementation: unified
  `causeId / numericOwner`, generated and checked all 518,400 equal-weight legal
  four-pillar structures, compared `20/25/20/15/15/5` with
  `10/25/25/15/20/5`, and published histograms, exact tie intervals, extrema,
  P5/P20/P50/P80/P95 boundaries and sensitivity results; active scoring, Bazi
  UI and all Qimen files remain unchanged.
- Checks: `node --check bazi-engine.js`; `node --check check-bazi-page.js`;
  `node check-bazi-page.js` (`bazi page checks ok`); `node check-baselines.js`
  (`18 baselines ok`); `$env:BAZI_FULL_PATTERN_BASELINE='1'; node
  check-bazi-page.js; Remove-Item Env:BAZI_FULL_PATTERN_BASELINE`
  (`bazi page checks ok`, 518,400/518,400); `git diff --check`.
- Next task: user reviews
  `docs/codex/modules/pattern-percentile-audit-v1.md`; after an explicit choice,
  audit either dimension anchors/discreteness or candidate weights as one
  isolated variable family. Do not start UI integration yet.
- Caution: the candidate is not frozen. It lowers potential dominance but
  compresses the score range, expands the 75-point tie bucket to 14.644290%,
  leaves formation correlation at 0.903677, and moves 16,922 charts into the
  candidate P95 tie bucket after derived-clarity deduplication. Flow, remedy
  and balance also retain concentrated neutral anchors.

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
