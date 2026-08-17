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
- Project pages: Qimen homepage `index.html`; Bazi page `bazi.html`; Liuyao page `liuyao.html`; Ziwei page `ziwei.html`
- Bazi calculation: `bazi-engine.js`
- Liuyao calculation: `liuyao-engine.js`
- Ziwei engine evaluation: `docs/codex/ziwei-engine-evaluation.md`; fixed fixtures: `docs/codex/fixtures/ziwei-evaluation.json`
- Bazi validation: `check-bazi-page.js` and `check-baselines.js`
- Liuyao validation: `check-liuyao-page.js`
- Module rules: `AGENTS.md` and `docs/codex/modules/`

## Active Handoff

- Owner: P1
- Working branch: `main` (use the I-drive checkout only)
- Last shared baseline: `10cf892`（本次日运模块提交的父提交）
- Changed: 新增独立日运日记与可折叠时间轴，接入可复算的日运 V3.1 解释核心、旧快照复算、日记与 AI 历史保留；现实落点改为“主领域、发生场景、具体事项”，五个模块入口统一为奇门、八字、六爻、紫微、日运。
- Checks: `node .\check-daily-page.js`; `node .\check-bazi-page.js`; `node .\check-baselines.js`（18 个基线）；`node .\check-qimen-page.js`; `node .\check-liuyao-page.js`（4096 种输入、64 卦、8 个八纯卦纳甲 fixture）；`node .\check-ziwei-page.js`（30 个固定盘、1048 项断言）；`node .\check-deepseek-client.js`; 相关 JavaScript `node --check`; 五页面导航顺序与唯一当前项检查；`git diff --check`；日运页面 320px/390px 无横向溢出且控制台无错误。
- Next task: 推送后核对 GitHub Pages 构建与线上 `daily.html`，再用真实命主连续记录验证现实落点是否仍有泛化或重复。
- Caution: 命理现实领域是传统规则的现代产品翻译，不代表统计概率或必然事件；日运页本地测试未发送日记或 API Key。

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
