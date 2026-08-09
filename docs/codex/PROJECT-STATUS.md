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
- Working branch: `main` (use the I-drive checkout only)
- Last shared baseline: `34d0f08`
- Changed: Qimen AI keeps DeepSeek V4 Flash thinking mode enabled, raises the
  output allowance to 3000 tokens, and refuses to save an empty final answer.
- Checks: `qimen thinking response checks ok`; `git diff --check`.
- Next task: user acceptance check of the Qimen AI conversation flow.
- Caution: retain the C-drive worktree temporarily only as a migration backup;
  do not develop or validate from its `file://` page. Do not change score bands,
  weights, or qualification gates without a new theoretical audit and explicit
  user confirmation. A document-only proposal is not an implemented feature.

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
