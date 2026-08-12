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
- Last shared baseline: `461a705`（本次交接提交的父提交）
- Changed: 完成紫微斗数排盘内核专项评估；固定 30 个本命/大限/流年对照盘，选择 `iztro 2.5.8` 为后续基线，`fortel-ziweidoushu 1.3.4` 仅作独立对照，淘汰 `@ziweijs/core 0.3.0`；未集成依赖或页面。
- Checks: 紫微 fixture JSON 解析、30 盘分组/必填字段/SHA-256/大限区间/重复确定性/零无法解释差异检查通过；`node .\check-qimen-page.js`; `node .\check-bazi-page.js`; `node .\check-liuyao-page.js`（4096 种输入、64 卦、8 个八纯卦纳甲 fixture）；`node .\check-baselines.js`（18 个基线）；`git diff --check`。
- Next task: 评审紫微内核结论后，单独制定本地固定 UMD、三接口适配层、真太阳时确认和紫微页面的实施计划。
- Caution: 30 盘是两个开源实现的工程交叉验证，不是专家金标准；真太阳时修正仍属于未来适配层；本次未改奇门、八字、六爻代码、历史记录、AI 上下文或存储键。

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
