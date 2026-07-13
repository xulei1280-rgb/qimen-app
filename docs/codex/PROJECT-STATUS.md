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

- Owner: P1
- Working branch: `main`
- Last shared commit: `e00b12a`
- Changed: Bazi pattern/useful presentation now separates natal pattern,
  disease-remedy state, useful elements, clarity, hierarchy, and current luck
  influence; interaction conclusions are refined without changing chart math.
- Checks: `node --check bazi-engine.js`; `node --check check-bazi-page.js`;
  `node check-bazi-page.js` (`bazi page checks ok`); `node check-baselines.js`
  (`18 baselines ok`); `git diff --check`.
- Next task: continue the next requested Bazi or Qimen module in a dedicated
  worktree, then integrate through a clean coordinator worktree.
- Caution: P1's existing `codex/bazi-local-work` branch remains isolated and
  must pull or rebase the latest `main` before any future integration.

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
