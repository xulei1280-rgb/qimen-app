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
- Last shared baseline: `10e78f9`（本次交接提交的父提交）
- Changed: 四个模块统一接入本地 `deepseek-client.js`，继续使用 `deepseek-v4-pro` 高强度思考；若新版接口只返回思考过程或空正文，自动以关闭思考模式重试一次，奇门和六爻输出额度同步提高到 16384。未改计算内核、AI 提示词、记录结构或存储键。
- Checks: `node .\check-deepseek-client.js`（思考空正文兜底、过滤及 HTTP 错误）；`node .\check-qimen-page.js`; `node .\check-bazi-page.js`; `node .\check-liuyao-page.js`（4096 种输入、64 卦、8 个八纯卦纳甲 fixture）；`node .\check-ziwei-page.js`（30 个固定盘、1048 项断言）；`node .\check-baselines.js`（18 个基线）；相关 JavaScript `node --check`; `git diff --check`。
- Next task: 使用真实 DeepSeek API Key 分别抽测四页首问与连续追问；若仍失败，保留页面显示的原始 API 错误再定位账号或服务端问题。
- Caution: 本次没有读取用户浏览器中的 API Key，网络返回以确定性模拟覆盖；紫微对照盘仍属于开源实现的工程交叉验证，不是专家金标准或科学权威结论。

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
