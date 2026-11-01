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

### Bazi Luck Concise Local Preview — 2026-10-14

- Owner: current local checkout; branch `codex/bazi-ui-preview-20261014`，沿用下方界面预览。
- Changed: 岁运四项结论默认仅显示标签与一句解释，依据、合冲口径和流月按需展开；规则 `luck-outlook-20261014.1` 修正破坏检查跳过、无实际七杀的裁食触发与已核对未补足条件被误当空证据。用户授权有明确部分依据时显示带“需复核”的倾向，最终未定状态与分歧继续保留。详见规则审查文档第 15 节。
- Delivery: 仅本地修改，尚未提交推送或发布。
- Checks: `node --check bazi-engine.js`、`node --check check-bazi-page.js`、`node check-bazi-page.js`、`node check-baselines.js`（18 基线）、`git diff --check`；真实本地浏览器桌面及 390px 视口的简明结论、依据折叠、流月展开选择与流年切换，无页面横向溢出和浏览器错误。设计检测仅保留既有纸色风格提示。
- Next task: 用户验收简明展示、四项参照与复核倾向。
- Caution: 倾向仅代表已有明确依据；关键资料或比较口径不足仍待判。条件测试不证明现实预测准确率，未调用真实 AI API。

### Bazi UI Local Preview — 2026-10-14

- Owner: current local checkout; branch `codex/bazi-ui-preview-20261014`.
- Changed: 八字页纸色与墨绿界面；分清模块导航、出生信息、命盘摘要与分析；完整格局依据按需展开；加入编辑与结果出现动效、键盘及减少动态效果适配。计算引擎和 AI 分析语义保持原样。
- Checks: `node check-bazi-page.js`；`git diff --check`；本地真实浏览器桌面及 390px 视口的出生时间、地址搜索、排盘、标准/专业、依据展开、大运流年选择和局部表格滚动。浏览器无错误日志。
- Delivery: 本地预览，未推送或发布。技能 `impeccable`、`emil-design-eng` 安装在用户级技能目录，不随项目提交。
- Next task: 用户验收八字界面的视觉、层级和动效，再决定是否推广或发布。
- Caution: 手机验证为浏览器视口模拟；未调用真实 AI API。机械设计扫描中的纸色提示为本次选定风格，紧凑表格保留数据字号；正文对比度提示已修正。

### Bazi Luck Pending Refinement — 2026-10-10

- Owner: current local checkout; previous published baseline `24a22c3`; delivery on `main`.
- Changed: 岁运判断 `luck-outlook-20261010.3`，先确认实际任用、先结算有效救应，再按未定项的实际可能作用判断是否阻断方向。详情见 `docs/specs/2026-10-09-bazi-luck-rule-audit.md` 第 14 节。
- Checks: `node --check bazi-engine.js`; `node --check check-bazi-page.js`; `node check-bazi-page.js`; `node check-baselines.js`（18 基线）; `git diff --check`；真实本地浏览器的新资源、相邻大运、年度标签与证据展开。全部通过。
- Delivery: 2026-10-10 用户授权提交推送本次待判优化及对应文档；当前交接以本文件所在提交为准；不包含本地 `.agents/` 技能文件。
- Next task: 验收发布页面的四项结论、待判原因及作用条件展开。
- Caution: 关键未定项可能改变结论时仍待判；条件检查不证明现实预测准确率，未调用真实 AI API。以下是此前已发布模块的历史交接记录。

### Previous Published Handoff

- Owner: P1
- Working branch: `main` (use the I-drive checkout only)
- Last shared baseline: `b6e0e33`; release code baseline: `2909d8b`（包含 `db10da1`、`2488459`、`2909d8b` 三次六爻修复）
- Changed: 六爻判断内核 v4 修复问题主体和欠款目标路由、休囚空破原神误计有效、静用神休囚月破日克的规则优先级、AI 世应/六亲干支/生克方向错配及无条件结果承诺；旧版 AI 回答保留原文并标识版本，不再作为新版追问上下文。排盘和记录 schema 保持兼容。
- Checks: `node .\check-liuyao-page.js`（4096 输入、12 月建 × 60 日辰 × 4 代表盘、伏神、优先级、AI 错配和页面用神入口）；4096 个 `buildPlate()` 快照与修复前 `HEAD` 完全一致；`node .\check-qimen-page.js`; `node .\check-bazi-page.js`; `node .\check-baselines.js`（18 基线）；`node .\check-deepseek-client.js`; 两个修改 JS 的 `node --check`; `git diff --check`；`node .\check-ziwei-page.js`（30 固定盘，1159 断言）。全部通过。
- Next task: 手机线上验收用神纠错和真实 AI 返回；随后用问题、占时与结果均已冻结的独立卦例验证实际表现。六爻线上资源版本 `20260905.4`。
- Caution: 无根优先规则仅覆盖明确的休囚静用神月破日克组合（来源：https://zh.wikisource.org/zh-hans/增刪卜易/10），不是完整流派仲裁器。AI 校验覆盖明确事实对应与常见确定性承诺，不能证明所有自然语言推论；本轮未请求真实付费 API。`check-daily-page.js` 的既有 V3.1 资源断言问题未改动。

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
