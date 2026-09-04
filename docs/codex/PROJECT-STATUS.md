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
- Last shared baseline: `b6dfef3`
- Changed: 六爻新增独立的用神状态判断内核，按冻结月日、用原忌仇、明动/暗动、空破和动变生成带编号证据；AI 固定采用规则建议或人工确认的用神，回答须引用真实证据并通过本地校验，失败自动纠正一次且不保存不合格结果。`buildPlate()`、旧记录结构及奇门、八字、紫微计算均未修改。
- Checks: `node .\check-ziwei-page.js`; `node .\check-qimen-page.js`; `node .\check-bazi-page.js`; `node .\check-liuyao-page.js`（4096 种输入、64 卦、关系与用神判断）；`node .\check-baselines.js`（18 个基线）；`node .\check-deepseek-client.js`; `node --check .\liuyao-engine.js`; `node --check .\check-liuyao-page.js`; `git diff --check`。
- Next task: 用户在 Pages 以已知卦例核对用神内核，并用真实 DeepSeek Key 验证首答、自动纠正及连续追问。
- Caution: 判断内核是《增删卜易》主线的第一版可核查事实层，不包含墓绝、三刑等全部流派规则，也不能保证现实预测准确。`check-daily-page.js` 仍因既有 V3.1 资源版本断言失败，日运文件未在本次修改。

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
