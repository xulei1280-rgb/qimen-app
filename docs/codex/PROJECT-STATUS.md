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
- Last shared baseline: `ed03bef`（本次提交前）
- Changed: 五个模块的 AI 共用客户端切换为 `deepseek-v4-flash` 思考模式；八字/日运改用节气时刻、真太阳时与虚岁起运年统一大运，已固定对照“1998-10-10 01:50、云南师宗、男”为 2008 年 11 岁起癸亥。
- Checks: `node .\check-deepseek-client.js`; `node .\check-qimen-page.js`; `node .\check-bazi-page.js`; `node .\check-liuyao-page.js`（4096 种输入、64 卦、8 个八纯卦纳甲 fixture）；`node .\check-ziwei-page.js`（30 个固定盘、1048 项断言）；`node .\check-daily-page.js`; `node .\check-baselines.js`（18 个基线）；`node --check .\bazi-engine.js`; `node --check .\daily-engine.js`; `git diff --check`。`http://127.0.0.1:8082/bazi.html` 已以固定对照资料实际排盘核验。
- Next task: 推送后核对 GitHub Pages 构建，再在手机端确认新缓存版本的 AI 与八字大运页面。
- Caution: DeepSeek API 请求未在本机发送真实 API Key；命理现实领域是传统规则的现代产品翻译，不代表统计概率或必然事件。

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
