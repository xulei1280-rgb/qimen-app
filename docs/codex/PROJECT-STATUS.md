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
- Project pages: Qimen homepage `index.html`; Bazi page `bazi.html`; Liuyao page `liuyao.html`
- Bazi calculation: `bazi-engine.js`
- Liuyao calculation: `liuyao-engine.js`
- Bazi validation: `check-bazi-page.js` and `check-baselines.js`
- Liuyao validation: `check-liuyao-page.js`
- Module rules: `AGENTS.md` and `docs/codex/modules/`

## Active Handoff

- Owner: P1
- Working branch: `main` (use the I-drive checkout only)
- Last shared baseline: `ba7cbba`
- Changed: 新增独立纳甲六爻模块，包含逐爻/一键/手动起卦、标准/专业盘面、AI 解卦、浏览器本地记录与事后复盘；奇门和八字只增加六爻导航。
- Checks: `node .\check-liuyao-page.js`（4096 种输入、64 卦、八纯卦纳甲）；`node .\check-qimen-page.js`; `node .\check-bazi-page.js`; `node .\check-baselines.js`; `node --check .\liuyao-engine.js`; `node --check .\check-liuyao-page.js`; `git diff --check`; 本地逐爻、一键、手动、保存/重开/复盘及 320px、390px、1024px 浏览器验证。
- Next task: 用户人工核对代表卦例，并使用自己的 DeepSeek Key 验收六爻 AI 解读。
- Caution: 本次未改 `qimen.js`、`bazi-engine.js`、奇门/八字计算、历史结构或既有 AI 提示词；AI 网络请求未代用户发送。

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
