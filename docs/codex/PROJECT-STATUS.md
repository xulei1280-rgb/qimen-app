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
- Last shared baseline: `67d76bb`
- Changed: 紫微 P0 完成：AI 证据增加大限与流年完整十二宫映射，事业/财富/关系/身心模式自动补充主题三方四正；允许不选运限时只解本命；运限目标早于生效出生日期时明确拒绝。排盘规则与冻结盘结构未改。
- Checks: `node .\check-ziwei-page.js`（30 个固定盘、1087 项断言）；`node .\check-qimen-page.js`; `node .\check-bazi-page.js`; `node .\check-liuyao-page.js`; `node .\check-baselines.js`（18 个基线）；`node .\check-deepseek-client.js`; `node --check .\ziwei-engine.js`; `node --check .\ziwei-page.js`; `node --check .\check-ziwei-page.js`; `git diff --check`。本地浏览器验证纯本命预设可用、无运限时大限模式禁用、出生日前目标被拒绝、正常运限可恢复且控制台无错误；紫微改动脚本已增加发布缓存版本。
- Next task: 用户在 Pages 或本地实际使用紫微 AI；出现解盘问题后按当时冻结证据复核。
- Caution: 本次未实际调用付费 AI；请求结构和匿名化由本地契约覆盖。`check-daily-page.js` 仍因既有 V3.1 资源版本断言失败，日运及共享 AI 文件均未在本次修改。

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
