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
- Ziwei engine evaluation: `docs/codex/ziwei-engine-evaluation.md`; fixed fixtures: `docs/codex/fixtures/ziwei-evaluation.json`
- Bazi validation: `check-bazi-page.js` and `check-baselines.js`
- Liuyao validation: `check-liuyao-page.js`
- Module rules: `AGENTS.md` and `docs/codex/modules/`

## Active Handoff

- Owner: P1
- Working branch: `main` (use the I-drive checkout only)
- Last shared baseline: `d47b380`（本次交接提交的父提交）
- Changed: 新增本地固定 `iztro 2.5.8` 的紫微本命、大限、流年、真太阳时、AI 连续追问和本地记录页面；完成明暗主题、专业宫格、三方四正、手机完整命盘横滑与独立缩放；八字 AI 同步启用 `deepseek-v4-pro` 高强度思考并补充空回答错误处理。
- Checks: `node .\check-ziwei-page.js`（30 个固定盘、1050 项断言）；`node .\check-qimen-page.js`; `node .\check-bazi-page.js`; `node .\check-liuyao-page.js`（4096 种输入、64 卦、8 个八纯卦纳甲 fixture）；`node .\check-baselines.js`（18 个基线）；`git diff --check`。
- Next task: 继续本地验盘和移动端体验验收；确认紫微结果后再统一四模块导航。
- Caution: 紫微对照盘属于开源实现的工程交叉验证，不是专家金标准或科学权威结论；首轮仍不修改三个旧页面的导航结构。

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
