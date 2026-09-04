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
- Last shared baseline: `b6e0e33`
- Changed: 六爻修复 AI 拒答句绕过、证据与段落事实不绑定、改用神后旧请求/旧回答串入、弱而化退的忌神误计直克、自身疾病用神误选、日月反制文案与历史快照未验真；新 AI 记录不再重复保存整份判断快照。`buildPlate()`、记录 schema 及奇门、八字、紫微计算均未修改。
- Checks: `node .\check-ziwei-page.js`; `node .\check-qimen-page.js`; `node .\check-bazi-page.js`; `node .\check-liuyao-page.js`（4096 种输入、64 卦、关系、用神判断及定点漏洞）；`node .\check-baselines.js`（18 个基线）；`node .\check-deepseek-client.js`; `node --check .\liuyao-engine.js`; `node --check .\check-liuyao-page.js`; `git diff --check`。
- Next task: 用户在本地以真实 DeepSeek Key 验证首答与改用神后旧请求作废，再决定是否推送 Pages。
- Caution: 程序现在可核对 AI 所引证据编号与明示盘面事实，但不能数学证明所有自然语言推论。内核仍不包含墓绝、三刑等全部流派规则，也不能保证现实预测准确。`check-daily-page.js` 仍有既有 V3.1 资源版本断言问题，日运文件未在本次修改。

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
