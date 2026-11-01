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

### Ziwei Input and AI Controls Release — 2026-11-02

- 用户授权将下方几轮紫微改动合并提交推送到 `main`：姓名/时间口径直显，自动/手动保存、同记录修改及独立新建；出生资料改变后确认清理旧解读；解读方向/方式直显；右上角有底色 API Key 按钮与原生设置弹窗；八方向各六个独立预设问题。
- 发布前复核通过：30 紫微固定盘/3714 断言、AI 控件浏览器检查、命盘保存修改新建浏览器检查、18 基线、DeepSeek 客户端检查、页面及展示脚本语法与 diff 检查。未调用真实 AI、未验证实体手机。计算内核和其他模块本轮未改，六爻试验工作树不纳入提交。
- 本节覆盖以下两项“未提交”状态，以下内容保留为实施历史；后续从最新 main 开始。此前日运旧版本断言问题仍未改，不宣称全仓检查全绿。

### Ziwei AI Direction / Reading Style — 2026-11-02

- 追加：移除标题右侧模型徽标，API Key 使用有底色的“设置 API Key”按钮并适配明暗主题。八个可选解读方向各重写完整六问（共 48 个），不再共用后五问；本命/无运限状态仍不强制请求运限分析，逐条点击只填入问题、不自动发送。紫微检查增至 3714 断言，浏览器逐方向核对六问独立、填入正确且不改盘/记录。
- 追加控件精简：解读类型/方式取消折叠并直接显示；API Key 改为模型标签旁的右上角小按钮，使用原生模态弹窗，保留原保存逻辑并在弹窗内显示保存错误。验证保存/关闭、Escape 与焦点返回和手机弹窗宽度。
- 参照奇门拆分“解读类型/方向”和“解读方式”：方向保留综合、本命、事业、财富、关系、身心、大限、流年；方式新增简断、详断、只看结论、逐宫细断、运限重点，默认简断，设置区默认展开。
- 请求独立携带方向与方式并控制篇幅/展开；每条问答冻结当时方式，旧记录无该字段仍兼容。保留六段白话/依据结构与多领域合参，不移植奇门的一事一断或其用神规则；运限重点需已有运限，不推断未提供的流月/流日。
- 检查：紫微 30 固定盘/3585 断言（包含五种方式的请求上下文与隐私边界）；AI 控件浏览器检查（切换设置不改盘/记录、摘要与选项一致）；记录新建/修改回归。均使用独立存储，未调用真实 AI。与下方输入保存流程一并保留为本地修改，未提交推送。

### Ziwei Chart Save/Edit/New Flow — 2026-11-02

- 追加输入区简化：移除“更多选项”折叠层，姓名与时间口径均直接可见；选择真太阳时后显示出生地点设置。同步移除折叠层脚本/样式引用，验证桌面与手机可见性及地点显隐。
- 本地新增：姓名移出更多选项；“排盘后保存”默认勾选，新盘可取消自动保存并手动保存；修改已存命盘更新同一 ID/创建时间；摘要区和输入区均有新建入口，新建不删除旧记录。运限日期随当前记录保存恢复。
- 修改出生资料若已有 AI 问答，先明确确认覆盖与清空旧解读，取消不落盘；只改姓名保留问答。写入失败回滚原记录且不切换展示盘；AI 请求期间禁止切换/重排/新建，避免回答串盘。修复纯本命问答的 null 运限导致旧记录无法重新打开。
- 检查：紫微 30 固定盘/3569 断言；`check-ziwei-record-flow.cjs` 独立浏览器验证自动/手动保存、同 ID 修改、改名、覆盖确认、失败回滚、新建与手机模拟；既有 AI 折叠删除浏览器检查。未调用真实 AI；本轮未提交推送。

### Ziwei Consolidated Release — 2026-11-02

- 用户明确授权全部紫微本地修改一起提交推送至 `main`：紫微星夜界面与多图层/运限展示、本地术语解释卡、白话 AI 五段正文及独立依据、农历闰月输入校验、回答折叠/删除、移除记录导入导出入口。包括相应测试；不含六爻设计试验工作树。
- 验证通过：紫微 30 固定盘及 3567 断言、AI 控件真实浏览器检查（独立存储、键盘折叠/删除/回滚、手机模拟）、八字检查、六爻检查、18 基线、共享 DeepSeek 客户端检查、4 个紫微 JS 语法检查与 diff 空白检查。未调用真实 AI，未测试实体手机。
- 已知既有检查问题：`check-daily-page.js:135` 仍要求 `bazi-engine.js?v=20260820.1`，而日运页面使用 `.2`，导致日运检查失败；相关文件与远端基线一致，本次不修改日运、不宣称全仓检查全绿。
- 发布目标：`main`；本节汇总覆盖下面两项“未提交”的历史交接状态。后续若继续改动，从最新 main 开始；未采用的设计技能尚未删除。

### Ziwei AI Answer Controls — 2026-11-02

- 本次只补紫微问答操作：参照八字使用原生 details/summary，默认展开、可键盘折叠；会话内重绘保留折叠状态，不改记录格式。删除移到每条问题标题栏，保留确认、持久化与写入失败回滚。
- 移除记录区 JSON 导入/导出按钮及页面事件，搜索占满原工具行；不删除已有记录，不改排盘、提示词或模型配置。页面脚本/视觉缓存版本已更新。
- 检查：`node check-ziwei-page.js`（30 固定盘、3567 断言）；`node check-ziwei-ai-ui.cjs`（独立浏览器存储验证键盘折叠、重绘保持、取消/确认删除、刷新恢复、存储异常回滚、390px 手机与入口移除）；未调用真实 AI 或读取用户浏览器记录。
- 本地修改，未提交推送；八字仅作只读参考。原有紫微修改保留。

### Ziwei Lunar Input Validation — 2026-11-02

- Owner: current local checkout，`codex/bazi-ui-preview-20261014`；本次仅修改紫微文件。
- Changed: 农历转公历后用原始历法回查年月日及闰月标记，拒绝不存在的闰月；吸收条件式解释结构（成立依据、制约条件、运限触发），四化必须绑定化星与宫位。页面资源版本 `20261102.1`。
- Checks: `node check-ziwei-page.js`（30 固定盘、2930 断言，含无效闰月与合法闰月早晚子时等价盘）；`node check-baselines.js`（18 基线）；`node check-deepseek-client.js`；两个修改 JS 的语法检查；`git diff --check`。全部通过。
- Delivery: 本地修改，未提交、推送；未调用真实 AI，未做本轮真实浏览器验收。
- Next task: 本地验收农历输入报错及新 AI 解读结构；历史夏令时/海外时区、新亮度表尚未接入，时间公式和有效历史盘保持不变。

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
