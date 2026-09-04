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
- Last shared baseline: `db10da1`（P1 本地 `main`，尚未推送）
- Changed: 六爻判断内核升级至 v3：补入旺相静爻作用休囚用神、休囚动爻仍可作用、发动逢空破延期而不删除、生旺墓绝、动墓及强弱限定；弱而化退墓绝或回头受制者不再误计直接作用，仇神作用链须有有效忌神承接，三刑明确不单独改写倾向。`buildPlate()`、记录 schema、AI 提示词及奇门、八字、紫微计算均未修改。
- Checks: `node .\check-qimen-page.js`; `node .\check-bazi-page.js`; `node .\check-liuyao-page.js`（4096 种输入、64 卦、关系、用神判断、生旺墓绝及动静定点卦例）；`node .\check-baselines.js`（18 个基线）；`node .\check-deepseek-client.js`; `node --check .\liuyao-engine.js`; `node --check .\check-liuyao-page.js`; `git diff --check`。提交后再运行 `node .\check-ziwei-page.js`。
- Next task: 用来源明确、问题和结果均已冻结的真实卦例建立回放集，区分“排盘事实正确”“规则链一致”和“现实结果命中”，再决定是否继续补规则或推送 Pages。
- Caution: 当前只是可复现的传统规则内核，不等于现实预测准确率保证，也未覆盖所有流派。`check-daily-page.js` 仍有既有 V3.1 资源版本断言问题，日运文件未在本次修改。

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
