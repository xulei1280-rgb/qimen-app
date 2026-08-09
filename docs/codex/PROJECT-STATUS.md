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
- Last shared baseline: `c9b6a52`
- Changed: 奇门与八字 AI 提问改为自动增高的多行输入框，并在分析期间显示已用时状态。
- Checks: `node .\check-qimen-page.js`; `node .\check-bazi-page.js`; `node .\check-baselines.js`; `git diff --check`; 内联脚本解析及本地桌面、390px 手机宽度验证。
- Next task: 用户验收奇门与八字的 AI 提问输入和分析计时反馈。
- Caution: retain the C-drive worktree temporarily only as a migration backup;
  do not develop or validate from its `file://` page. 本次未改计算、API 模型或提示词。

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
