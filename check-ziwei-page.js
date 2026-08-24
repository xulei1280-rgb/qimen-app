"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

global.self = global;
const iztro = require("./vendor/iztro/2.5.8/iztro.min.js");
const engine = require("./ziwei-engine.js");
const deepseekClient = require("./deepseek-client.js");

const ROOT = __dirname;
const FIXTURE_PATH = path.join(ROOT, "docs", "codex", "fixtures", "ziwei-evaluation.json");
const HTML_PATH = path.join(ROOT, "ziwei.html");
const PAGE_PATH = path.join(ROOT, "ziwei-page.js");
const KEY_MINOR_NAMES = new Set(["左辅", "右弼", "文昌", "文曲", "天魁", "天钺", "禄存", "擎羊", "陀罗", "火星", "铃星", "地空", "地劫", "天马"]);
const MUTAGEN_LABELS = ["禄", "权", "科", "忌"];

let assertions = 0;

function assert(condition, message) {
  assertions += 1;
  if (!condition) throw new Error(message);
}

function stable(value) {
  return JSON.stringify(value);
}

function normalizedDate(value) {
  return value.split("-").map(Number).join("-");
}

function compactNatal(snapshot) {
  const byBranch = [...snapshot.natal.palaces].sort((a, b) => a.index - b.index);
  const palaceLayout = byBranch
    .map((palace) => `${palace.earthlyBranch}:${palace.name}${palace.isBodyPalace ? "*" : ""}`)
    .join("|");
  const collect = (selector) => byBranch
    .flatMap((palace) => selector(palace).map((star) => `${star.name}@${palace.earthlyBranch}`))
    .sort()
    .join("|");
  return {
    soulPalace: snapshot.natal.soulPalace,
    bodyPalace: snapshot.natal.bodyPalace,
    fiveElementsClass: snapshot.natal.fiveElementsClass,
    palaceLayout,
    majorStarPlacements: collect((palace) => palace.majorStars),
    keyMinorStarPlacements: collect((palace) => palace.minorStars.filter((star) => KEY_MINOR_NAMES.has(star.name))),
    birthMutagen: MUTAGEN_LABELS.map((label) => `${label}:${snapshot.natal.birthMutagen[label]}`).join("|"),
    decadalRanges: byBranch.map((palace) => `${palace.earthlyBranch}:${palace.decadal.range[0]}-${palace.decadal.range[1]}`).join("|"),
  };
}

function compactHoroscope(horoscope) {
  return {
    targetSolarDate: horoscope.targetSolarDate,
    targetLunarDate: horoscope.targetLunarDate,
    nominalAge: horoscope.nominalAge,
    decadal: {
      palaceIndex: horoscope.decadal.palaceIndex,
      palaceName: horoscope.decadal.palaceName,
      heavenlyStem: horoscope.decadal.heavenlyStem,
      earthlyBranch: horoscope.decadal.earthlyBranch,
      ageRange: horoscope.decadal.ageRange,
    },
    yearly: {
      palaceIndex: horoscope.yearly.palaceIndex,
      palaceName: horoscope.yearly.palaceName,
      heavenlyStem: horoscope.yearly.heavenlyStem,
      earthlyBranch: horoscope.yearly.earthlyBranch,
      mutagen: MUTAGEN_LABELS.map((label) => `${label}:${horoscope.yearly.mutagen[label]}`).join("|"),
    },
  };
}

function fixtureInput(fixture, confirmedTimeShift = true) {
  return {
    calendarType: "solar",
    date: fixture.input.solarDate,
    time: fixture.input.clockTime,
    gender: fixture.input.gender,
    timeBasis: fixture.input.useTrueSolarTime ? "trueSolar" : "beijing",
    longitude: fixture.input.longitude,
    confirmedTimeShift,
  };
}

function checkDeepFrozen(value, label) {
  assert(Object.isFrozen(value), `${label} 顶层未冻结`);
  if (value && typeof value === "object") {
    for (const [key, nested] of Object.entries(value)) {
      if (nested && typeof nested === "object") checkDeepFrozen(nested, `${label}.${key}`);
    }
  }
}

function runFixtures() {
  const fixtureData = JSON.parse(fs.readFileSync(FIXTURE_PATH, "utf8"));
  assert(fixtureData.fixtures.length === 30, "固定对照盘不是 30 个");
  for (const fixture of fixtureData.fixtures) {
    const snapshot = engine.buildNatal(fixtureInput(fixture));
    const repeat = engine.buildNatal(fixtureInput(fixture));
    const horoscope = engine.getHoroscope(snapshot, fixture.input.targetDate);
    const before = stable(snapshot);

    assert(stable(snapshot) === stable(repeat), `${fixture.id} 重复执行不确定`);
    assert(normalizedDate(snapshot.calendar.solarDate) === fixture.expected.calendar.solarDate, `${fixture.id} 公历不符`);
    assert(snapshot.calendar.lunarYear === fixture.expected.calendar.lunarYear, `${fixture.id} 农历年不符`);
    assert(snapshot.calendar.lunarMonth === fixture.expected.calendar.lunarMonth, `${fixture.id} 农历月不符`);
    assert(snapshot.calendar.lunarDay === fixture.expected.calendar.lunarDay, `${fixture.id} 农历日不符`);
    assert(snapshot.calendar.isLeapMonth === fixture.expected.calendar.isLeapMonth, `${fixture.id} 闰月标记不符`);
    assert(snapshot.calendar.sexagenary === fixture.expected.calendar.sexagenary, `${fixture.id} 干支不符`);
    assert(snapshot.calendar.timeLabel === fixture.expected.calendar.timeLabel, `${fixture.id} 时辰不符`);
    assert(snapshot.calendar.timeRange === fixture.expected.calendar.timeRange, `${fixture.id} 时段不符`);
    assert(snapshot.effective.solarDate === fixture.effectiveEngineInput.solarDate, `${fixture.id} 生效公历不符`);
    assert(snapshot.effective.clockTime === fixture.effectiveEngineInput.clockTime, `${fixture.id} 生效时间不符`);
    assert(snapshot.effective.timeIndex === fixture.effectiveEngineInput.timeIndex, `${fixture.id} 生效时辰序号不符`);
    if (fixture.trueSolarTime) {
      assert(snapshot.effective.trueSolar.correctionMinutes === fixture.trueSolarTime.correctionMinutes, `${fixture.id} 真太阳时修正值不符`);
      assert(snapshot.effective.trueSolar.crossesDate === fixture.trueSolarTime.crossesDate, `${fixture.id} 真太阳时跨日期标记不符`);
      assert(snapshot.effective.trueSolar.crossesTimeBranch === fixture.trueSolarTime.crossesTimeBranch, `${fixture.id} 真太阳时跨时辰标记不符`);
    }

    const natal = compactNatal(snapshot);
    for (const [key, expected] of Object.entries(fixture.expected.natal)) {
      assert(natal[key] === expected, `${fixture.id} 本命字段 ${key} 不符\n实际: ${natal[key]}\n预期: ${expected}`);
    }
    assert(stable(compactHoroscope(horoscope)) === stable(fixture.expected.horoscope), `${fixture.id} 运限不符`);
    assert(stable(snapshot) === before, `${fixture.id} 运限修改了本命盘`);
  }
}

function runEngineContracts() {
  const rules = engine.getRuleMeta();
  assert(rules.engine.version === "2.5.8", "引擎版本元数据错误");
  assert(rules.engine.browserArtifactSha256 === "4b8eca323e5d4291471567c62255a2166471c55c77ebe8f0d2d38240e69d12b1", "引擎哈希错误");
  assert(rules.rules.yearDivide === "lunar_new_year", "分年规则错误");
  assert(rules.rules.horoscopeDivide === "lunar_new_year", "切运规则错误");
  assert(rules.rules.nominalAge.startsWith("natural_year"), "虚岁规则错误");
  assert(rules.rules.leapMonth.includes("1-15"), "闰月规则错误");
  assert(rules.rules.ratHour.includes("early and late rat separated"), "子时规则错误");
  assert(rules.rules.algorithm.includes("do not mix Zhongzhou"), "门派隔离规则错误");
  assert(stable(Object.keys(engine).sort()) === stable(["buildNatal", "getHoroscope", "getRuleMeta"].sort()), "公开接口发生意外变化");
  checkDeepFrozen(rules, "ruleMeta");

  const solar = engine.buildNatal({ calendarType: "solar", date: "2000-08-16", time: "00:30", gender: "male", timeBasis: "beijing" });
  const lunar = engine.buildNatal({ calendarType: "lunar", lunarDate: { year: 2000, month: 7, day: 17, isLeap: false }, time: "00:30", gender: "male", timeBasis: "beijing" });
  assert(solar.coreSignature === lunar.coreSignature, "公历与农历等价盘不一致");
  checkDeepFrozen(solar, "snapshot");
  const horoscope = engine.getHoroscope(solar, "2025-08-16");
  checkDeepFrozen(horoscope, "horoscope");
  let preBirthError = null;
  try {
    engine.getHoroscope(solar, "2000-08-15");
  } catch (error) {
    preBirthError = error;
  }
  assert(preBirthError?.code === "TARGET_BEFORE_BIRTH", "出生日前运限没有被明确拦截");
  assert(preBirthError.details.birthDate === "2000-08-16" && preBirthError.details.targetDate === "2000-08-15", "出生日前运限错误缺少可核对日期");
  assert(engine.getHoroscope(solar, "2000-08-16").nominalAge === 1, "出生当日运限不应被拦截");

  let confirmationError = null;
  try {
    engine.buildNatal({ calendarType: "solar", date: "2024-06-01", time: "01:10", gender: "male", timeBasis: "trueSolar", longitude: 87.6168 });
  } catch (error) {
    confirmationError = error;
  }
  assert(confirmationError?.code === "TIME_BRANCH_CONFIRMATION_REQUIRED", "真太阳时跨时辰未要求确认");
  assert(confirmationError.details.crossesDate === true, "真太阳时跨日期未标记");
  const confirmed = engine.buildNatal({ calendarType: "solar", date: "2024-06-01", time: "01:10", gender: "male", timeBasis: "trueSolar", longitude: 87.6168, confirmedTimeShift: true });
  assert(confirmed.calendar.solarDate === "2024-05-31" && confirmed.calendar.timeLabel === "晚子时", "确认后的真太阳时盘错误");
  const unchangedBranch = engine.buildNatal({ calendarType: "solar", date: "2024-06-01", time: "01:05", gender: "female", timeBasis: "trueSolar", longitude: 121.4737 });
  assert(unchangedBranch.calendar.timeLabel === "丑时", "不跨时辰盘不应要求确认");
}

function createPageSandbox(pageSource) {
  const storage = new Map();
  const element = () => ({
    value: "",
    checked: false,
    hidden: false,
    disabled: false,
    className: "",
    textContent: "",
    innerHTML: "",
    files: [],
    dataset: {},
    elements: { gender: { value: "male" }, calendarType: { value: "solar" }, timeBasis: { value: "beijing" } },
    addEventListener() {},
    querySelectorAll() { return []; },
    querySelector() { return null; },
    appendChild() {},
    remove() {},
    setAttribute() {},
    classList: { add() {}, remove() {}, toggle() {} },
    reset() {},
    scrollIntoView() {},
  });
  const elements = new Map();
  const document = {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, element());
      return elements.get(id);
    },
    createElement() { return element(); },
    body: element(),
    documentElement: element(),
  };
  const sandbox = {
    window: null,
    document,
    console,
    Date,
    Math,
    JSON,
    Object,
    Array,
    Set,
    Map,
    Blob: function Blob() {},
    URL: { createObjectURL() { return "blob:test"; }, revokeObjectURL() {} },
    localStorage: {
      getItem(key) { return storage.has(key) ? storage.get(key) : null; },
      setItem(key, value) { storage.set(key, String(value)); },
    },
    crypto: { randomUUID() { return "00000000-0000-4000-8000-000000000000"; } },
    confirm() { return true; },
    fetch() { throw new Error("checker must not call network"); },
    ZiweiEngine: engine,
    DeepSeekClient: deepseekClient,
  };
  sandbox.window = sandbox;
  vm.runInNewContext(pageSource, sandbox, { filename: "ziwei-page.js" });
  return sandbox;
}

function runPageContracts() {
  const html = fs.readFileSync(HTML_PATH, "utf8");
  const pageSource = fs.readFileSync(PAGE_PATH, "utf8");
  assert(html.includes('src="vendor/iztro/2.5.8/iztro.min.js"'), "页面未使用本地 iztro");
  assert(!/https?:\/\/[^"']+\.(?:js|css)/i.test(html), "页面含远程脚本或样式");
  assert(html.includes("[hidden] { display: none !important; }"), "缺少 hidden 样式修复");
  assert(html.includes("@media (prefers-reduced-motion: reduce)"), "缺少减少动态效果支持");
  assert(/href="index\.html">奇门<\/a>[\s\S]*href="bazi\.html">八字<\/a>[\s\S]*href="liuyao\.html">六爻<\/a>[\s\S]*href="ziwei\.html" aria-current="page">紫微<\/a>[\s\S]*href="daily\.html">日运<\/a>/.test(html), "紫微页面缺少统一五模块导航");
  assert(html.includes('src="deepseek-client.js?v=20260817.1"') && pageSource.includes("window.DeepSeekClient.requestFinal"), "紫微 AI 未使用共享最终回答兜底");
  assert(pageSource.includes("const AI_MODEL = window.DeepSeekClient.MODEL"), "紫微 AI 模型未使用共享配置");
  assert(pageSource.includes('const STORAGE_KEY = "ziwei_records_v1"'), "记录存储键错误");
  assert(pageSource.includes('const API_KEY_STORAGE = "qimen_deepseek_api_key"'), "没有复用旧模块 API Key");
  assert(pageSource.includes("maxTokens: 16384"), "紫微思考模式输出额度不足");
  assert(pageSource.includes("本地存储失败，记录没有被静默截断"), "存储异常提示缺失");
  assert(html.includes('id="locationSearch"') && html.includes('id="solarPreview"'), "真太阳时地点选择或预览缺失");
  assert(html.includes('id="aiPresetQuestions"') && html.includes(".ai-preset-list"), "AI 预设问法界面缺失");
  assert(html.includes('id="aiMode"') && ["comprehensive", "natal", "career", "wealth", "relationship", "wellbeing", "decadal", "yearly", "conclusion"].every((mode) => html.includes(`value="${mode}"`)), "AI 分析模式不完整");
  assert(pageSource.includes('elements.aiQuestion.value = questions[') && !pageSource.includes('button.addEventListener("click", () => askAi'), "AI 预设问法应只填充输入框而不自动发送");
  assert(pageSource.includes('elements.aiMode.addEventListener("change", renderAiPresetQuestions)') && !pageSource.includes('elements.aiMode.addEventListener("change", buildFromForm'), "切换 AI 模式不应重新排盘");
  assert(pageSource.includes("data-evidence-palace") && pageSource.includes("selectPalace(palaceIndex)"), "AI 证据不能定位回命盘宫位");
  assert(html.includes(".relation-svg") && pageSource.includes("relationSvg(relations)"), "三方四正线缺失");
  assert(html.includes("--jade: #18765f") && html.includes("--blue: #2f67a5") && html.includes("--red: #b74340"), "明亮主题语义色缺失");
  assert(html.includes('html[data-theme="dark"]') && html.includes('data-theme-choice="light"') && html.includes('data-theme-choice="dark"'), "明暗主题切换缺失");
  assert(html.includes('data-density-choice="clear"') && html.includes('data-density-choice="pro"') && html.includes('html[data-density="clear"] .density-detailed'), "清晰与专业密度切换缺失");
  assert(html.includes(".star { gap: .25rem; color: var(--ivory); font-size: 18px") && html.includes(".minor-star { font-size: 14px") && html.includes(".star { font-size: 16px; }") && html.includes(".minor-star { font-size: 13px; }"), "单宫桌面或手机字号层级缺失");
  assert(pageSource.includes('palace-layer palace-layer-major') && pageSource.includes('palace-layer palace-layer-support') && pageSource.includes('cycle-primary') && pageSource.includes('cycle-small-limit'), "单宫主曜、辅曜和运限层级结构缺失");
  assert(html.includes(".palace-layer-major") && html.includes(".palace-layer-support") && html.includes(".cycle-primary") && html.includes(".cycle-label"), "单宫层级视觉样式缺失");
  assert(html.includes('.palace .star-badge[class*="mutagen-"]') && html.includes(".star-badge.mutagen-lu") && html.includes(".star-badge.mutagen-quan") && html.includes(".star-badge.mutagen-ke") && html.includes(".star-badge.mutagen-ji") && html.includes("border-radius: 6px 6px 6px 2px"), "宫内四化独立方印样式缺失");
  assert(html.includes("grid-template-columns: repeat(4, minmax(250px, 1fr))") && html.includes(".chart-viewport") && html.includes("overflow: auto") && !html.includes("grid-row: auto !important"), "手机命盘未保持完整四列或不能独立横向滑动");
  assert(html.includes('id="chartZoomOut"') && html.includes('id="chartZoomReset"') && html.includes('id="chartZoomIn"') && html.includes(".chart-zoom-control { display: none; }") && html.includes(".chart-zoom-control { display: inline-flex; }") && pageSource.includes("function normalizeChartZoom") && pageSource.includes("elements.chartGrid.style.zoom"), "手机命盘独立缩放控制缺失或错误显示在桌面");
  assert(pageSource.includes("function beginChartPinch") && pageSource.includes("function moveChartPinch") && pageSource.includes('addEventListener("touchmove", moveChartPinch, { passive: false })') && html.includes("touch-action: pan-x pan-y"), "手机命盘双指缩放缺失");

  const sandbox = createPageSandbox(pageSource);
  const pageTest = sandbox.ZiweiPageTest;
  assert(pageTest.STORAGE_KEY === "ziwei_records_v1", "页面测试接口存储键错误");
  assert(pageTest.THEME_STORAGE_KEY === "ziwei_theme_v1" && pageTest.DENSITY_STORAGE_KEY === "ziwei_density_v1", "显示偏好存储键错误");
  assert(pageTest.normalizeDisplayPreference("dark", ["light", "dark"], "light") === "dark", "合法主题偏好被错误回退");
  assert(pageTest.normalizeDisplayPreference("unknown", ["light", "dark"], "light") === "light", "非法主题偏好没有回退");
  const preferenceMemory = new Map();
  const preferenceStorage = { getItem: (key) => preferenceMemory.get(key) ?? null, setItem: (key, value) => preferenceMemory.set(key, value) };
  assert(pageTest.writeDisplayPreference(preferenceStorage, pageTest.THEME_STORAGE_KEY, "dark") === true, "主题偏好保存失败");
  assert(pageTest.readDisplayPreference(preferenceStorage, pageTest.THEME_STORAGE_KEY, ["light", "dark"], "light") === "dark", "主题偏好恢复失败");
  assert(pageTest.readDisplayPreference({ getItem() { throw new Error("denied"); } }, pageTest.THEME_STORAGE_KEY, ["light", "dark"], "light") === "light", "主题存储异常未安全回退");
  assert(pageTest.writeDisplayPreference({ setItem() { throw new Error("denied"); } }, pageTest.DENSITY_STORAGE_KEY, "pro") === false, "密度存储异常未安全处理");
  assert(pageTest.applyTheme("dark", false) === "dark" && sandbox.document.documentElement.dataset.theme === "dark", "夜色主题应用失败");
  assert(pageTest.applyDensity("pro", false) === "pro" && sandbox.document.documentElement.dataset.density === "pro", "专业密度应用失败");
  assert(pageTest.normalizeChartZoom(0.1) === 0.75 && pageTest.normalizeChartZoom(1.26) === 1.3 && pageTest.normalizeChartZoom(9) === 1.5 && pageTest.normalizeChartZoom("bad") === 1, "命盘缩放边界或步进错误");
  assert(pageTest.touchDistance([{ clientX: 0, clientY: 0 }, { clientX: 3, clientY: 4 }]) === 5, "命盘双指距离计算错误");
  const snapshot = engine.buildNatal({ calendarType: "solar", date: "2000-08-16", time: "00:30", gender: "male", timeBasis: "trueSolar", longitude: 87.6168, confirmedTimeShift: true });
  const anonymous = pageTest.anonymousNatal(snapshot);
  const serialized = JSON.stringify(anonymous);
  assert(!serialized.includes("87.6168"), "AI 匿名盘包含经度");
  assert(!Object.hasOwn(anonymous, "input") && !Object.hasOwn(anonymous, "effective") && !Object.hasOwn(anonymous, "engineInput"), "AI 匿名盘包含原始引擎输入");
  assert(!Object.hasOwn(anonymous.calendar, "lunarYear") && !Object.hasOwn(anonymous.calendar, "lunarMonth") && !Object.hasOwn(anonymous.calendar, "lunarDay"), "AI 匿名盘包含派生出生日期");
  assert(!serialized.includes(snapshot.input.sourceDate), "AI 匿名盘包含原始出生日期");
  assert(!serialized.includes(snapshot.input.clockTime), "AI 匿名盘包含原始出生时间");
  const horoscopeForAi = engine.getHoroscope(snapshot, "2025-08-16");
  const soulIndex = snapshot.natal.palaces.find((palace) => palace.name === "命宫").index;
  const evidence = pageTest.buildAiEvidence(snapshot, horoscopeForAi, soulIndex, "comprehensive");
  assert(evidence.entries.length === 28 && new Set(evidence.entries.map((entry) => entry.id)).size === 28, "AI 证据目录编号不完整或重复");
  assert(evidence.entries.filter((entry) => entry.id.startsWith("P")).length === 12, "AI 证据目录没有覆盖十二宫");
  assert(evidence.entries.some((entry) => entry.id === "R01" && entry.fact.includes("不限制全盘分析")), "所选宫位被错误设为排他分析范围");
  assert(evidence.entries.some((entry) => entry.id === "D01") && evidence.entries.some((entry) => entry.id === "Y01"), "AI 证据目录缺少大限或流年层");
  for (const [id, scope] of [["D07", horoscopeForAi.decadal], ["Y07", horoscopeForAi.yearly]]) {
    const mapping = evidence.entries.find((entry) => entry.id === id);
    assert(mapping && mapping.fact.split("→本命").length === 13, `${id} 没有明确给出完整十二宫动态映射`);
    for (const palace of snapshot.natal.palaces) {
      const displayName = (name) => String(name).endsWith("宫") ? String(name) : `${name}宫`;
      const expected = `${displayName(scope.palaceNames[palace.index])}→本命${displayName(palace.name)}(${palace.heavenlyStem}${palace.earthlyBranch},P${String(palace.index + 1).padStart(2, "0")})`;
      assert(mapping.fact.includes(expected), `${id} 动态宫位没有准确映射到 ${expected}`);
    }
  }
  for (const [mode, palaceName, label] of [["career", "官禄", "事业发展"], ["wealth", "财帛", "财富方式"], ["relationship", "夫妻", "感情关系"], ["wellbeing", "疾厄", "身心倾向"]]) {
    const focusedEvidence = pageTest.buildAiEvidence(snapshot, horoscopeForAi, soulIndex, mode);
    assert(focusedEvidence.entries.some((entry) => entry.id === "R02" && entry.fact.includes(`本宫:${palaceName}宫`) && entry.fact.includes(`分析主题:${label}`)), `${label}模式没有自动补充${palaceName}宫三方四正`);
  }
  assert(!JSON.stringify(evidence).includes("87.6168") && !JSON.stringify(evidence).includes(snapshot.input.sourceDate) && !JSON.stringify(evidence).includes(snapshot.input.clockTime), "AI 证据目录泄露出生隐私");
  const messages = pageTest.buildAiMessages("测试问题", [{ question: "上一问", answer: "上一答 [D01]" }], snapshot, horoscopeForAi, soulIndex, "comprehensive");
  assert(messages.some((message) => message.content === "上一问") && messages.some((message) => message.content.includes("上一答")), "连续对话上下文缺失");
  assert(messages.some((message) => message.content.includes("历史回答仅用于保持对话语义") && !message.content.includes("[D01]")), "历史运限证据编号污染当前冻结盘");
  assert(messages[0].content.includes("## 总论") && messages[0].content.includes("## 支持与制约") && messages[0].content.includes("## 不确定边界"), "AI 七段输出结构约束缺失");
  assert(messages[0].content.includes("整张命盘") && messages[0].content.includes("不得套用六爻的一事一问"), "AI 被错误限制为单一主题");
  assert(messages[0].content.includes("不得混入中州派"), "AI 门派隔离约束缺失");
  assert(messages.some((message) => message.content.includes("evidenceCatalog")) && messages.at(-1).content.includes("综合总览"), "AI 缺少分层证据或分析模式上下文");
  assert(!JSON.stringify(messages).includes("87.6168"), "AI 请求包含经度");
  assert(!JSON.stringify(messages).includes(snapshot.input.sourceDate) && !JSON.stringify(messages).includes(snapshot.input.clockTime), "AI 请求包含原始出生日期时间");
  assert(pageTest.extractAiAnswer({ choices: [{ finish_reason: "stop", message: { content: "  盘面证据\n测试\n传统解读\n测试  " } }] }).startsWith("盘面证据"), "AI 正文解析失败");
  for (const [finishReason, expected] of [["length", "输出额度"], ["content_filter", "内容过滤"], ["insufficient_system_resource", "资源不足"], ["tool_calls", "工具调用"]]) {
    let responseError = null;
    try { pageTest.extractAiAnswer({ choices: [{ finish_reason: finishReason, message: { content: "" } }] }); } catch (error) { responseError = error; }
    assert(responseError?.message.includes(expected), `AI ${finishReason} 停止原因提示错误`);
  }
  let thinkingOnlyError = null;
  try { pageTest.extractAiAnswer({ choices: [{ finish_reason: "stop", message: { content: "", reasoning_content: "hidden" } }] }); } catch (error) { thinkingOnlyError = error; }
  assert(thinkingOnlyError?.message.includes("只返回了思考过程"), "AI 思考过程独占响应未被识别");
  assert(pageTest.isValidRecord({ schemaVersion: 1, id: "x", title: "测试盘", natalSnapshot: snapshot, aiHistory: [] }), "有效记录校验失败");
  assert(!pageTest.isValidRecord({ schemaVersion: 1, id: "x" }), "无效记录未被拦截");

  const chart = iztro.astro.bySolar("2000-08-16", 0, "男", true, "zh-CN");
  for (const palace of snapshot.natal.palaces) {
    const actual = pageTest.palaceRelations(snapshot.natal.palaces, palace.index);
    const official = chart.surroundedPalaces(palace.index);
    assert(actual.target.earthlyBranch === official.target.earthlyBranch, `${palace.name} 本宫关系错误`);
    assert(actual.opposite.earthlyBranch === official.opposite.earthlyBranch, `${palace.name} 对宫关系错误`);
    assert(actual.wealth.earthlyBranch === official.wealth.earthlyBranch, `${palace.name} 财帛位关系错误`);
    assert(actual.career.earthlyBranch === official.career.earthlyBranch, `${palace.name} 官禄位关系错误`);
  }
  assert(pageTest.normalizeAiMode("yearly") === "yearly" && pageTest.normalizeAiMode("invalid") === "comprehensive", "AI 分析模式合法化错误");
  assert(pageTest.aiModeLabel("comprehensive") === "综合总览", "AI 分析模式标签错误");
  const presetQuestions = pageTest.aiPresetQuestions(snapshot, horoscopeForAi, soulIndex, "comprehensive");
  assert(presetQuestions.length === 6 && presetQuestions.some((question) => question.includes("整张命盘")) && presetQuestions.some((question) => question.includes("当前大限")) && presetQuestions.some((question) => question.includes("当前流年")), "AI 预设问法没有覆盖全盘、本命、大限和流年");
  assert(presetQuestions.some((question) => question.includes("命宫") && question.includes("三方四正")), "AI 预设问法没有跟随所选宫位");
  assert(!JSON.stringify(presetQuestions).includes(snapshot.input.sourceDate) && !JSON.stringify(presetQuestions).includes(snapshot.input.clockTime), "AI 预设问法泄露原始出生资料");
  const natalEvidence = pageTest.buildAiEvidence(snapshot, null, soulIndex, "natal");
  assert(natalEvidence.includesHoroscope === false && !natalEvidence.entries.some((entry) => /^[DY]/.test(entry.id)), "纯本命证据错误包含运限层");
  const natalMessages = pageTest.buildAiMessages("只看本命", [], snapshot, null, soulIndex, "natal");
  assert(natalMessages.some((message) => message.content.includes("仅本命；未提供大限与流年")) && natalMessages.at(-1).content.includes("未选择运限"), "纯本命请求没有明确禁止推断运限");
  assert(!natalMessages.at(-1).content.includes("运限只用于说明当下") && natalMessages.at(-1).content.includes("不要推断未提供的运限"), "纯本命分析模式仍含有相互矛盾的运限说明");
  const natalPresets = pageTest.aiPresetQuestions(snapshot, null, soulIndex, "natal");
  assert(natalPresets.length === 6 && !natalPresets.some((question) => question.includes("当前大限") || question.includes("当前流年")), "纯本命预设问题仍强制要求运限");
  const validAnswer = [
    "## 总论", "全盘主线 [P01] [D01] [Y01]", "## 关键结构", "结构一 [P02] [P03]", "## 本命基础", "本命说明 [N01]", "## 运限合参", "运限说明 [D02] [Y02]", "## 支持与制约", "支持与反证 [P04] [P05]", "## 现实观察", "现实观察 [R01]", "## 不确定边界", "传统解读不是确定事件 [N01]",
  ].join("\n");
  const validAnswerCheck = pageTest.validateAiAnswer(validAnswer, evidence);
  assert(validAnswerCheck.valid, `合格 AI 回答未通过结构与证据校验：${validAnswerCheck.errors.join("；")}`);
  const validNatalAnswer = [
    "## 总论", "本命主线 [P01] [P02]", "## 关键结构", "结构一 [P03] [P04]", "## 本命基础", "本命说明 [N01]", "## 运限合参", "未提供大限和流年，不作推断。", "## 支持与制约", "支持与反证 [P05] [P06]", "## 现实观察", "现实观察 [R01]", "## 不确定边界", "传统解读不是确定事件 [N01]",
  ].join("\n");
  const validNatalAnswerCheck = pageTest.validateAiAnswer(validNatalAnswer, natalEvidence);
  assert(validNatalAnswerCheck.valid, `纯本命回答被错误要求引用运限：${validNatalAnswerCheck.errors.join("；")}`);
  const invalidAnswer = validAnswer.replace("[Y01]", "[Z99]");
  assert(!pageTest.validateAiAnswer(invalidAnswer, evidence).valid && pageTest.validateAiAnswer(invalidAnswer, evidence).errors.some((error) => error.includes("不存在的证据")), "虚构证据编号未被拦截");
  const answerMarkup = pageTest.renderAiAnswer(validAnswer, evidence.references);
  assert(answerMarkup.includes("<h3>总论</h3>") && answerMarkup.includes('data-evidence-palace='), "AI 结构化回答或可点击证据渲染失败");
  const soulRelations = pageTest.palaceRelations(snapshot.natal.palaces, soulIndex);
  assert([soulRelations.target.name, soulRelations.opposite.name, soulRelations.wealth.name, soulRelations.career.name].sort().join("|") === ["命宫", "迁移", "财帛", "官禄"].sort().join("|"), "命财官迁关系错误");
  assert(pageTest.starTypeClass({ type: "tough" }) === "star-tough" && pageTest.starTypeClass({ type: "soft" }) === "star-soft", "星曜类别颜色映射错误");
  assert(pageTest.brightnessClass("庙") === "miao" && pageTest.brightnessClass("陷") === "xian", "亮度颜色映射错误");
  assert(pageTest.mutagenClass("禄") === "lu" && pageTest.mutagenClass("忌") === "ji", "四化颜色映射错误");
  assert(pageTest.LOCATIONS.some((location) => location.name.includes("昆明")) && pageTest.LOCATIONS.some((location) => location.name.includes("师宗")), "八字同口径本地地点数据缺失");
  assert(pageTest.customLocationFromValues("测试地", "121.4737").lng === 121.4737, "自定义经度解析错误");
  let invalidLongitude = null;
  try { pageTest.customLocationFromValues("错误地", "181"); } catch (error) { invalidLongitude = error; }
  assert(Boolean(invalidLongitude), "无效自定义经度未拦截");
  const legacyLocation = pageTest.normalizeStoredLocation({ longitude: "102.7183" });
  assert(legacyLocation.name === "自定义地点" && legacyLocation.lng === 102.7183, "旧记录经度兼容失败");
  const storedLocation = pageTest.normalizeStoredLocation({ location: { name: "云南省 昆明市", lng: 102.7183, lat: 25.0389 } });
  assert(storedLocation.name.includes("昆明") && storedLocation.lat === 25.0389, "地点记录恢复失败");

  const record = {
    schemaVersion: 1,
    id: "record-a",
    title: "本地验盘 A",
    localBirthData: { personLabel: "本地验盘 A", location: { name: "云南省 昆明市", lng: 102.7183, lat: 25.0389 } },
    natalSnapshot: snapshot,
    currentHoroscope: null,
    aiHistory: [{ id: "turn-a", question: "事业证据", answer: "测试回答", horoscopeSnapshot: engine.getHoroscope(snapshot, "2025-08-16") }],
    createdAt: "2026-08-13T00:00:00.000Z",
    updatedAt: "2026-08-13T00:00:00.000Z",
  };
  const memoryStorage = new Map();
  const storage = { getItem: (key) => memoryStorage.get(key) ?? null, setItem: (key, value) => memoryStorage.set(key, value) };
  pageTest.writeRecordStorage(storage, [record]);
  const restored = pageTest.readRecordStorage(storage);
  assert(restored.length === 1 && restored[0].aiHistory[0].question === "事业证据", "记录保存恢复失败");
  assert(pageTest.filterRecords(restored, "事业").length === 1 && pageTest.filterRecords(restored, "无匹配").length === 0, "记录搜索失败");
  assert(pageTest.withoutTurn(record, "turn-a").aiHistory.length === 0, "删除单条问答失败");
  assert(pageTest.withoutRecord(restored, "record-a").length === 0, "删除命盘失败");
  const bundle = pageTest.createExportBundle(restored, "2026-08-13T01:00:00.000Z");
  assert(!JSON.stringify(bundle).includes("qimen_deepseek_api_key") && !Object.hasOwn(bundle, "apiKey"), "记录导出包含 API Key");
  assert(!JSON.stringify(bundle).includes("ziwei_theme_v1") && !JSON.stringify(bundle).includes("ziwei_density_v1"), "记录导出包含显示偏好");
  assert(JSON.stringify(bundle).includes("云南省 昆明市"), "地点没有随本地记录导出");
  const newer = { ...record, title: "更新盘", updatedAt: "2026-08-13T02:00:00.000Z" };
  const imported = pageTest.mergeImportBundle(restored, { schemaVersion: 1, records: [newer] });
  assert(imported.updated === 1 && imported.records[0].title === "更新盘", "记录导入合并失败");
  let storageFailure = null;
  try {
    pageTest.writeRecordStorage({ setItem() { throw new Error("quota"); }, getItem() { return null; } }, [record]);
  } catch (error) {
    storageFailure = error;
  }
  assert(storageFailure?.message === "quota", "存储异常未向上抛出");
  let truncationFailure = null;
  try {
    pageTest.writeRecordStorage({ setItem() {}, getItem() { return "[]"; } }, [record]);
  } catch (error) {
    truncationFailure = error;
  }
  assert(truncationFailure?.message === "写入后校验不一致", "静默截断未被拦截");
}

function runBaselineIsolation() {
  const childProcess = require("child_process");
  const tracked = childProcess.execFileSync("git", ["diff", "--name-only", "main", "--", "qimen.js", "liuyao-engine.js"], { cwd: ROOT, encoding: "utf8" }).trim();
  assert(tracked === "", `非本次范围的旧模块计算内核出现改动：${tracked}`);
}

try {
  runFixtures();
  runEngineContracts();
  runPageContracts();
  runBaselineIsolation();
  console.log(`PASS 紫微原型检查：30 个固定盘、内核契约、AI 隐私、记录格式与旧模块隔离，共 ${assertions} 项断言。`);
} catch (error) {
  console.error(`FAIL 紫微原型检查：${error.message}`);
  process.exitCode = 1;
}
