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
- Last shared baseline: `b470ff0`
- Changed: 紫微低风险 P1 完成：公开并冻结“大限宫干沿用本命原宫干”及01:00起丑、03:00起寅、23:00起晚子的整点规则；AI 证据新增命迁、兄友、夫官、子田、财福、父疾六组对宫轴。排盘结果、历史快照和旧模块均未修改。
- Checks: `node .\check-ziwei-page.js`（30 个固定盘、1159 项断言，包含30盘大限宫干及26个时辰边界点）；`node .\check-qimen-page.js`; `node .\check-bazi-page.js`; `node .\check-liuyao-page.js`; `node .\check-baselines.js`（18 个基线）；`node .\check-deepseek-client.js`; `node --check .\ziwei-engine.js`; `node --check .\ziwei-page.js`; `node --check .\check-ziwei-page.js`; `git diff --check`。本地 `http://127.0.0.1:8082/ziwei.html` 已确认加载新规则说明和 `20260825.2` 脚本版本。
- Next task: 用户在 Pages 或本地实际使用紫微 AI；出现解盘问题后按当时冻结证据复核。
- Caution: 本次只冻结现行口径，没有采用资料作者的晚子时、闰月或大限宫干替代算法。`check-daily-page.js` 仍因既有 V3.1 资源版本断言失败，日运及共享 AI 文件均未在本次修改。

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
