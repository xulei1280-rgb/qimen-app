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
- Last shared baseline: `5727739`
- Changed: 奇门每张盘可选择或新建问事人八字档案；新档案同步保存至八字记录，盘面、自动/手动记录和 AI 对话冻结关联快照。AI 明确以奇门判断当前事项和短期应期为主，八字仅补充长期阶段背景。
- Checks: `node .\check-qimen-page.js`; `node .\check-bazi-page.js`; `node .\check-baselines.js`（18 个基线）；`node --check .\bazi-engine.js`; `node --check .\check-bazi-page.js`; `node --check .\check-qimen-page.js`; 页面内联脚本语法检查；`git diff --check`。`http://127.0.0.1:8082/index.html` 与 `http://127.0.0.1:8082/bazi.html` 已本地核验，奇门 1280px/390px 宽度无横向溢出。
- Next task: 推送后核对 GitHub Pages 构建，并在手机端验证关联八字的新建、选择、清除及 AI 回答。
- Caution: 八字档案与奇门关联均为同一浏览器本地数据；AI 请求才发送所关联快照。命理现实领域是传统规则的现代产品翻译，不代表统计概率或必然事件。

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
