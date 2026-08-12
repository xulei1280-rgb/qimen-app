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
- Last shared baseline: `6d6abc3`
- Changed: 六爻成卦后收起问事表单，新增问题模板、阅读聚焦、自动/手动用神定位，并以可交互星图展示用神与日月、世应、动变的生克冲合关系；旧初判继续只读兼容。
- Checks: `node .\check-liuyao-page.js`（4096 种输入、64 卦、八纯卦纳甲及用神关系）；`node .\check-qimen-page.js`; `node .\check-bazi-page.js`; `node .\check-baselines.js`; `node --check .\liuyao-engine.js`; `node --check .\check-liuyao-page.js`; `git diff --check`; 本地 320px、390px、1024px、八节点星图、关系点击/键盘/再次点击取消验证。
- Next task: 用户从 GitHub Pages 验收六爻新版界面，并用代表卦例继续人工核对用神关系。
- Caution: 本次未改 `qimen.js`、`bazi-engine.js`、奇门/八字计算、现有历史记录结构或 AI 提示词；`buildPlate()` 输出保持不变。

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
