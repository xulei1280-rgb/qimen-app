"use strict";

const fs = require("fs");
{const readFileSync=fs.readFileSync;fs.readFileSync=function(){const out=readFileSync.apply(fs,arguments);return typeof out==='string'?out.replace(/\r\n/g,'\n'):out}} // 兼容 CRLF 检出
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
    const natalDecadalPalace = snapshot.natal.palaces.find((palace) => palace.index === horoscope.decadal.palaceIndex);
    assert(horoscope.decadal.heavenlyStem === natalDecadalPalace.heavenlyStem, `${fixture.id} 大限宫干没有沿用本命原宫干`);
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
  assert(rules.rules.timeBranchBoundary.includes("[01:00,03:00) ox") && rules.rules.timeBranchBoundary.includes("[23:00,24:00) late rat"), "时辰整点边界没有明确冻结");
  assert(rules.rules.decadalStemMethod === "use natal palace heavenly stem; no direction-based re-layout", "大限宫干口径没有明确冻结");
  assert(rules.rules.algorithm.includes("do not mix Zhongzhou"), "门派隔离规则错误");
  assert(stable(Object.keys(engine).sort()) === stable(["buildNatal", "getInputClock", "getHoroscope", "getRuleMeta"].sort()), "公开接口发生意外变化");
  checkDeepFrozen(rules, "ruleMeta");

  const solar = engine.buildNatal({ calendarType: "solar", date: "2000-08-16", time: "00:30", gender: "male", timeBasis: "beijing" });
  const lunar = engine.buildNatal({ calendarType: "lunar", lunarDate: { year: 2000, month: 7, day: 17, isLeap: false }, time: "00:30", gender: "male", timeBasis: "beijing" });
  assert(solar.coreSignature === lunar.coreSignature, "公历与农历等价盘不一致");
  for (const lunarDate of [
    { year: 2020, month: 5, day: 1, isLeap: true },
    { year: 2024, month: 1, day: 1, isLeap: true },
    { year: 2024, month: 1, day: 30, isLeap: false },
  ]) {
    let error = null;
    try { engine.buildNatal({ calendarType: "lunar", lunarDate, time: "08:00", gender: "male" }); }
    catch (caught) { error = caught; }
    assert(error?.code === "INVALID_LUNAR_DATE", `无效农历日期被接受：${stable(lunarDate)}`);
  }
  for (const day of [1, 15, 16, 29]) {
    for (const time of ["00:30", "23:30"]) {
      const leap = engine.buildNatal({ calendarType: "lunar", lunarDate: { year: 2020, month: 4, day, isLeap: true }, time, gender: "male" });
      const equivalent = engine.buildNatal({ date: leap.engineInput.solarDate, time, gender: "male" });
      assert(leap.coreSignature === equivalent.coreSignature, `合法闰月/子时等价盘错误：${day} ${time}`);
    }
  }
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

  const timeIntervals = [
    [0, "早子时", "00:00", "00:59"],
    [1, "丑时", "01:00", "02:59"],
    [2, "寅时", "03:00", "04:59"],
    [3, "卯时", "05:00", "06:59"],
    [4, "辰时", "07:00", "08:59"],
    [5, "巳时", "09:00", "10:59"],
    [6, "午时", "11:00", "12:59"],
    [7, "未时", "13:00", "14:59"],
    [8, "申时", "15:00", "16:59"],
    [9, "酉时", "17:00", "18:59"],
    [10, "戌时", "19:00", "20:59"],
    [11, "亥时", "21:00", "22:59"],
    [12, "晚子时", "23:00", "23:59"],
  ];
  for (const [timeIndex, label, start, end] of timeIntervals) {
    for (const time of [start, end]) {
      const boundary = engine.buildNatal({ calendarType: "solar", date: "2000-08-16", time, gender: "male", timeBasis: "beijing" });
      assert(boundary.effective.timeIndex === timeIndex && boundary.calendar.timeLabel === label, `${time} 没有按已声明边界归入${label}`);
    }
  }
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
    BirthTime: require('./birth-time.js'),
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
  assert(html.includes('src="birth-time.js?v=20261107.1"') && html.includes('src="ziwei-engine.js?v=20261107.1"') && html.includes('src="ziwei-page.js?v=20261107.1"'), "紫微改动脚本缺少发布缓存版本");
  assert(pageSource.includes("成立依据—制约条件—运限触发") && pageSource.includes("四化是星曜的属性"), "AI 缺少条件式结构解读约束");
  assert(html.includes("大限宫干沿用本命原宫干") && html.includes("01:00 起丑") && html.includes("03:00 起寅") && html.includes("23:00 起晚子"), "页面没有公开大限宫干与时辰整点规则");
  assert(!/https?:\/\/[^"']+\.(?:js|css)/i.test(html), "页面含远程脚本或样式");
  assert(html.includes("[hidden] { display: none !important; }"), "缺少 hidden 样式修复");
  assert(html.includes("@media (prefers-reduced-motion: reduce)"), "缺少减少动态效果支持");
  assert(/href="index\.html">奇门<\/a>[\s\S]*href="bazi\.html">八字<\/a>[\s\S]*href="liuyao\.html">六爻<\/a>[\s\S]*href="ziwei\.html" aria-current="page">紫微<\/a>[\s\S]*href="daily\.html">日运<\/a>/.test(html), "紫微页面缺少统一五模块导航");
  assert(html.includes('src="deepseek-client.js?v=20260817.1"') && pageSource.includes("window.DeepSeekClient.requestFinal"), "紫微 AI 未使用共享最终回答兜底");
  assert(pageSource.includes("const AI_MODEL = window.DeepSeekClient.MODEL"), "紫微 AI 模型未使用共享配置");
  assert(pageSource.includes('const STORAGE_KEY = "ziwei_records_v1"'), "记录存储键错误");
  assert(html.includes('id="autoSaveBuild"') && html.includes('id="newBirth"') && html.includes('id="entrySave"'), "缺少自动保存、新建或手动保存命盘入口");
  assert(html.includes('id="personLabel"') && !html.includes('id="entryMore"') && !html.includes('class="zw-more"'), "出生资料仍有更多选项折叠层");
  assert(!html.includes('id="exportRecords"') && !html.includes('id="importRecords"'), "记录区仍有导入导出入口");
  assert(pageSource.includes('<details class="turn"') && pageSource.includes('<summary class="turn-question">') && pageSource.includes('state.collapsedTurns'), "AI 回答缺少原生折叠及会话内状态保持");
  assert(pageSource.includes('data-delete-turn=') && pageSource.includes('event.stopPropagation()') && pageSource.includes('if (!saveRecords()) Object.assign(record, previous)'), "AI 删除入口或存储失败回滚缺失");
  assert(pageSource.includes('const API_KEY_STORAGE = "qimen_deepseek_api_key"'), "没有复用旧模块 API Key");
  assert(pageSource.includes("maxTokens: 16384"), "紫微思考模式输出额度不足");
  assert(pageSource.includes("本地存储失败，记录没有被静默截断"), "存储异常提示缺失");
  assert(html.includes('id="locationSearch"') && html.includes('id="solarPreview"'), "真太阳时地点选择或预览缺失");
  assert(html.includes('id="aiPresetQuestions"') && html.includes(".ai-preset-list"), "AI 预设问法界面缺失");
  assert(html.includes('id="aiMode"') && ["comprehensive", "natal", "career", "wealth", "relationship", "wellbeing", "decadal", "yearly", "conclusion"].every((mode) => html.includes(`value="${mode}"`)), "AI 分析模式不完整");
  assert(html.includes('id="openApiKey"') && html.includes('<dialog id="apiKeyDialog"') && !html.includes('<details class="zw-ai-settings"') && !html.includes('id="aiModeSummary"'), "AI 设置仍折叠或缺少右上角 Key 设置弹窗");
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
  assert(evidence.entries.length === 34 && new Set(evidence.entries.map((entry) => entry.id)).size === 34, "AI 证据目录编号不完整或重复");
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
  for (const [id, label, leftName, rightName] of [["R10", "命迁轴", "命宫", "迁移"], ["R11", "兄友轴", "兄弟", "仆役"], ["R12", "夫官轴", "夫妻", "官禄"], ["R13", "子田轴", "子女", "田宅"], ["R14", "财福轴", "财帛", "福德"], ["R15", "父疾轴", "父母", "疾厄"]]) {
    const left = snapshot.natal.palaces.find((palace) => palace.name === leftName);
    const right = snapshot.natal.palaces.find((palace) => palace.name === rightName);
    const axis = evidence.entries.find((entry) => entry.id === id);
    const opposite = pageTest.palaceRelations(snapshot.natal.palaces, left.index).opposite;
    assert(opposite.index === right.index, `${label} 两宫不是对宫关系`);
    assert(axis?.fact.includes(label) && axis.fact.includes(left.heavenlyStem + left.earthlyBranch) && axis.fact.includes(right.heavenlyStem + right.earthlyBranch), `${label} 证据缺少两宫干支`);
  }
  assert(!JSON.stringify(evidence).includes("87.6168") && !JSON.stringify(evidence).includes(snapshot.input.sourceDate) && !JSON.stringify(evidence).includes(snapshot.input.clockTime), "AI 证据目录泄露出生隐私");
  const messages = pageTest.buildAiMessages("测试问题", [{ question: "上一问", answer: "上一答 [D01]" }], snapshot, horoscopeForAi, soulIndex, "comprehensive");
  assert(messages.some((message) => message.content === "上一问") && messages.some((message) => message.content.includes("上一答")), "连续对话上下文缺失");
  assert(messages.some((message) => message.content.includes("历史回答仅用于保持对话语义") && !message.content.includes("[D01]")), "历史运限证据编号污染当前冻结盘");
  assert(["## 一句话总结", "## 重点关注", "## 顺的地方", "## 要留意的", "## 建议怎么做", "## 依据"].every((h) => messages[0].content.includes(h)) && messages[0].content.includes("前五段正文里不得出现任何证据编号") && messages[0].content.includes("括号里用几个字解释"), "AI 白话五段 + 依据结构约束缺失");
  assert(messages[0].content.includes("整张命盘") && messages[0].content.includes("不得套用六爻的一事一问"), "AI 被错误限制为单一主题");
  assert(messages[0].content.includes("六组对宫轴") && messages.some((message) => message.content.includes('"decadalStemMethod":"use natal palace heavenly stem; no direction-based re-layout"')), "AI 没有收到对宫轴或大限宫干规则");
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
  assert(html.includes('id="aiStyle"') && pageTest.normalizeAiStyle("invalid") === "brief", "AI 解读方式或默认值缺失");
  for (const style of ["brief", "detail", "conclusion", "palaces", "timing"]) {
    const messages = pageTest.buildAiMessages("事业和感情一起看", [], snapshot, horoscopeForAi, soulIndex, "career", style);
    const context = JSON.parse(messages[1].content.split("\n").slice(1).join("\n"));
    assert(context.readingStyle.id === style && context.analysisMode.id === "career", "解读方向与方式未独立发送");
    assert(messages.at(-1).content.includes(pageTest.aiStyleLabel(style)), "解读方式未影响最终请求");
    assert(messages[0].content.includes("六个标题") && messages[0].content.includes("不限制用户同时询问多个生活领域"), "解读方式破坏证据结构或全盘合参边界");
  }
  const presetQuestions = pageTest.aiPresetQuestions(snapshot, horoscopeForAi, soulIndex, "comprehensive");
  const directions = ["comprehensive", "natal", "career", "wealth", "relationship", "wellbeing", "decadal", "yearly"];
  for (const timing of [null, horoscopeForAi]) {
    const seen = new Set();
    for (const direction of directions) {
      const questions = pageTest.aiPresetQuestions(snapshot, timing, soulIndex, direction);
      assert(questions.length === 6 && new Set(questions).size === 6, `${direction} 缺少六个独立问法`);
      for (const question of questions) {
        assert(!seen.has(question), `${direction} 仍复用其他方向的预设问法`);
        seen.add(question);
      }
      assert(!JSON.stringify(questions).includes(snapshot.input.sourceDate) && !JSON.stringify(questions).includes(snapshot.input.clockTime), `${direction} 问法泄露出生资料`);
    }
  }
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
    "## 一句话总结", "今年重心在工作与家里。", "## 重点关注", "今年事业被推到台前。", "## 顺的地方", "外面的人脉帮得上忙。", "## 要留意的", "家里的事容易操心。", "## 建议怎么做", "先稳住节奏。这是传统解读，需要结合现实验证。",
    "## 依据", "- 一句话总结：[P01] [N01]", "- 重点关注：[D01] [Y01] [D02] [Y02]", "- 顺的地方：[P02] [P03]", "- 要留意的：[P04] [P05]", "- 建议怎么做：[R01]",
  ].join("\n");
  const validAnswerCheck = pageTest.validateAiAnswer(validAnswer, evidence);
  assert(validAnswerCheck.valid, `合格 AI 回答未通过结构与证据校验：${validAnswerCheck.errors.join("；")}`);
  const validNatalAnswer = [
    "## 一句话总结", "本命主线清楚。", "## 重点关注", "未提供运限，只看本命。", "## 顺的地方", "有贵人。", "## 要留意的", "容易操心。", "## 建议怎么做", "多沟通。这是传统解读，需要结合现实验证。",
    "## 依据", "- 一句话总结：[P01] [P02]", "- 重点关注：[N01]", "- 顺的地方：[P03] [P04]", "- 要留意的：[P05] [P06]", "- 建议怎么做：[R01]",
  ].join("\n");
  const validNatalAnswerCheck = pageTest.validateAiAnswer(validNatalAnswer, natalEvidence);
  assert(validNatalAnswerCheck.valid, `纯本命回答被错误要求引用运限：${validNatalAnswerCheck.errors.join("；")}`);
  const invalidAnswer = validAnswer.replace("[Y01]", "[Z99]");
  assert(!pageTest.validateAiAnswer(invalidAnswer, evidence).valid && pageTest.validateAiAnswer(invalidAnswer, evidence).errors.some((error) => error.includes("不存在的证据")), "虚构证据编号未被拦截");
  const answerMarkup = pageTest.renderAiAnswer(validAnswer, evidence.references);
  assert(answerMarkup.includes("<h3>一句话总结</h3>") && answerMarkup.includes('data-evidence-palace=') && answerMarkup.includes('<details class="ai-basis">'), "AI 结构化回答或可点击证据渲染失败");
  // 2026-11-02 白话渲染：正文不出现编号，加粗正常，旧格式回答也折叠编号
  const bodyOf = (markup) => markup.split('<details class="ai-basis">')[0];
  assert(!/\[[A-Z]\d{2}\]/.test(bodyOf(answerMarkup)) && answerMarkup.includes("依据（点开核对）"), "新格式回答正文仍有证据编号");
  const oldAnswer = ["## 总论", "这张盘的主线是命迁轴 [P01] [P07]（[R10]）；官禄表达 [P05]。", "## 关键结构", "1. **命迁轴：空宫借迁移。** 成立依据：命宫无主星 [P01]；迁移宫天同 [P07]。", "- **要点**：家宅 [D01][Y01]"].join("\n");
  const oldMarkup = pageTest.renderAiAnswer(oldAnswer, evidence.references);
  assert(!/\[[A-Z]\d{2}\]/.test(bodyOf(oldMarkup)) && !bodyOf(oldMarkup).includes("**") && oldMarkup.includes("<strong>命迁轴：空宫借迁移。</strong>") && oldMarkup.includes("<h3>总论</h3>"), "旧格式回答未清理行内编号或加粗");
  assert(["P01", "P07", "R10", "P05", "D01", "Y01"].every((id) => oldMarkup.split('<details class="ai-basis">')[1].includes(`[${id}]`)) && !bodyOf(oldMarkup).includes("（）"), "旧格式编号未收进依据");
  const p01 = evidence.references.find((r) => r.id === "P01");
  assert(p01.fact && oldMarkup.includes(p01.fact.slice(0, 20).replace(/&/g, "&amp;")), "依据未列出证据原文");
  const inlineAnswer = validAnswer.replace("今年重心在工作与家里。", "今年重心在工作与家里 [P09]。");
  assert(pageTest.validateAiAnswer(inlineAnswer, evidence).valid && !bodyOf(pageTest.renderAiAnswer(inlineAnswer, evidence.references)).includes("[P09]"), "正文夹带编号时应被渲染清理");
  const oneSided = validAnswer.replace("- 要留意的：[P04] [P05]", "- 要留意的：");
  assert(!pageTest.validateAiAnswer(oneSided, evidence).valid, "缺少要留意的依据未被拦截");
  const noLuck = validAnswer.replace("- 重点关注：[D01] [Y01] [D02] [Y02]", "- 重点关注：[P06]");
  assert(!pageTest.validateAiAnswer(noLuck, evidence).hard, "大限/流年依据写在别处时不应被硬性拒绝");
  // 2026-11-02 真实 DeepSeek 失败形态：重点关注只引流年、正文夹编号、【】括号、### 标题、多出一节 → 只算格式问题，可显示
  const realLike = [
    "### 一句话总结", "这几年重心在工作和家里【P05】。", "### 重点关注", "今年事业被推到台前（流年命宫在官禄宫）［Y01］【Y02】。", "**顺的地方**", "外面人脉帮得上忙 [P07]。",
    "### 要留意的：", "家里的事容易操心 [P04]。", "### 建议怎么做", "先稳住节奏。", "### 补充说明", "以上为传统解读。",
    "### 依据", "- 一句话总结：P05、N01", "- 重点关注：【Y01】【Y02】", "- 顺的地方：[P07]", "- 要留意的：[P04] [D02]", "- 建议怎么做：[R01]",
  ].join("\n");
  const realCheck = pageTest.validateAiAnswer(realLike, evidence);
  assert(!realCheck.hard && realCheck.valid, `真实格式偏差被拒绝：${realCheck.errors.join("；")}`);
  const normalized = pageTest.normalizeAiAnswer(realLike);
  assert(/^## 顺的地方$/m.test(normalized) && /^## 要留意的$/m.test(normalized) && normalized.includes("[N01]") && normalized.includes("[Y02]") && !/[【】［］]/.test(normalized), "格式规范化失败");
  const realMarkup = pageTest.renderAiAnswer(normalized, evidence.references);
  assert(!/\[[A-Z]\d{2}\]|【|】/.test(bodyOf(realMarkup)) && realMarkup.includes("<h3>补充说明</h3>"), "真实格式回答渲染后仍有编号");
  const sparse = ["## 一句话总结", "今年重心在工作 [Y01]。", "## 要留意的", "家里 [P04]。"].join("\n");
  const sparseCheck = pageTest.validateAiAnswer(sparse, evidence);
  assert(!sparseCheck.valid && !sparseCheck.hard && sparseCheck.softErrors.length, "格式不全的回答应显示并标记，而不是拒绝");
  assert(pageTest.validateAiAnswer(realLike.replace("[P07]", "[P99]"), evidence).hard, "虚构证据编号必须硬性拒绝");
  assert(pageTest.validateAiAnswer("## 一句话总结\n没有任何依据。", evidence).hard, "完全没有依据编号必须硬性拒绝");
  assert(messages[0].content.includes("## 依据\n- 一句话总结：[P01] [N01]\n- 重点关注："), "提示词缺少依据行的字面示例");
  const premiumSrc = fs.readFileSync(path.join(ROOT, "ziwei-premium.js"), "utf8");
  assert(premiumSrc.includes("observer.takeRecords()") && /contains\("error"\) \? 7000 : 4200/.test(premiumSrc) && premiumSrc.includes('addEventListener("click", hide)'), "提示条不会自动收起或无法关闭");
  const pageSrc = fs.readFileSync(PAGE_PATH, "utf8");
  assert(pageSrc.includes("turn.formatWarning = validation.softErrors") && pageSrc.includes("未完全按格式/依据不全，仅供参考") && pageSrc.includes("if (validation.hard) throw"), "格式不全回答未标记显示或硬性校验缺失");
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
  const tracked = childProcess.execFileSync("git", ["diff", "--name-only", "main", "--", "qimen.js"], { cwd: ROOT, encoding: "utf8" }).trim();
  assert(tracked === "", `非本次范围的旧模块计算内核出现改动：${tracked}`);
  // 2026-11-01 六爻规则升级后，liuyao-engine.js 允许新增标签与断卦规则，但装卦内核（纳甲、六亲、世应、六神、伏神、变卦）必须与 main 完全一致。
  const vm = require("vm");
  const loadEngine = (source) => { const sandbox = { module: { exports: {} } }; sandbox.globalThis = sandbox; vm.runInNewContext(source, sandbox); return sandbox.module.exports; };
  const baseEngine = loadEngine(childProcess.execFileSync("git", ["show", "main:liuyao-engine.js"], { cwd: ROOT, encoding: "utf8" }));
  const liveEngine = loadEngine(fs.readFileSync(path.join(ROOT, "liuyao-engine.js"), "utf8"));
  const coreOf = (plate) => { const copy = JSON.parse(JSON.stringify(plate)); delete copy.tags; delete copy.tagVersion; delete copy.patterns; return JSON.stringify(copy); };
  const pillarsList = [{ monthGZ: "戊戌", dayGZ: "己卯" }, { monthGZ: "丙寅", dayGZ: "甲子" }, { monthGZ: "壬午", dayGZ: "癸亥" }];
  let coreChecked = 0;
  for (let mask = 0; mask < 4096; mask += 7) {
    const lines = [0, 1, 2, 3, 4, 5].map((index) => [6, 7, 8, 9][(mask >> (index * 2)) & 3]);
    for (const pillars of pillarsList) {
      assert(coreOf(baseEngine.buildPlate({ lines, ...pillars })) === coreOf(liveEngine.buildPlate({ lines, ...pillars })), `六爻装卦内核与 main 不一致：${lines.join("")} ${pillars.dayGZ}`);
      coreChecked++;
    }
  }
  assert(coreChecked > 1700, "六爻装卦内核对照样本不足");
}

// 2026-11-02 星夜视觉层：宫干飞化、图层开关、手机不横向溢出（只校验展示层纯函数与静态契约）。
function runPremiumContracts() {
  const premium = require("./ziwei-premium.js");
  const html = fs.readFileSync(HTML_PATH, "utf8");
  const css = fs.readFileSync(path.join(ROOT, "ziwei-premium.css"), "utf8");
  for (const needle of ['href="premium-base.css', 'href="ziwei-premium.css', 'src="premium-base.js', 'src="ziwei-premium.js', 'data-zw-layer="rel"', 'data-zw-layer="birth"', 'data-zw-layer="fly"', 'data-zw-layer="luck"']) {
    assert(html.includes(needle), `紫微页缺少星夜视觉层：${needle}`);
  }
  assert(/@media[^{]*max-width:\s*[4-8]\d\dpx[\s\S]*\.chart-grid[^{]*\{[^}]*min-width:\s*0/.test(css), "手机宽度下命盘未取消最小宽度，会出现横向拖动");
  assert(/body\.zw\s*\{[^}]*overflow-x:\s*clip/.test(css), "紫微页未防止整页横向溢出");
  assert(/prefers-reduced-motion/.test(css), "紫微动效未尊重减少动态偏好");

  const snapshot = engine.buildNatal({ calendarType: "solar", date: "2000-08-16", time: "00:30", gender: "male", timeBasis: "beijing" });
  const horoscope = engine.getHoroscope(snapshot, "2026-11-02");
  const chart = iztro.astro.bySolar("2000-08-16", 0, "男", true, "zh-CN");
  const palaces = snapshot.natal.palaces;
  let selfCount = 0;
  for (const palace of palaces) {
    const fly = premium.flyingFrom(palaces, palace.index, iztro.util.getMutagensByHeavenlyStem);
    assert(fly.length === 4, `${palace.name} 宫干飞化不足四化`);
    const official = chart.palace(palace.index).mutagedPlaces();
    fly.forEach((item, i) => {
      assert(item.label === MUTAGEN_LABELS[i], `${palace.name} 飞化顺序错误`);
      assert(official[i] && official[i].earthlyBranch === palaces.find((p) => p.index === item.to).earthlyBranch, `${palace.name} 飞${item.label}落宫与 iztro 不一致`);
      assert(item.self === (item.to === palace.index), `${palace.name} 自化标记错误`);
      if (item.self) selfCount += 1;
    });
    assert(fly.some((item) => item.self) === MUTAGEN_LABELS.some((label) => chart.palace(palace.index).selfMutaged(label)), `${palace.name} 自化判断与 iztro 不一致`);
  }
  assert(selfCount > 0, "样例盘未覆盖自化");
  const decadalFly = premium.flyingFrom(palaces, horoscope.decadal.palaceIndex, iztro.util.getMutagensByHeavenlyStem);
  assert(stable(decadalFly.map((item) => item.star)) === stable(MUTAGEN_LABELS.map((label) => horoscope.decadal.mutagen[label])), "大限宫干飞化与引擎大限四化不一致");
  const birth = premium.mutagenTargets(palaces, snapshot.natal.birthMutagen);
  assert(birth.length === 4 && birth.every((item) => palaces.find((p) => p.index === item.to).majorStars.concat(palaces.find((p) => p.index === item.to).minorStars).some((star) => star.name === item.star && star.mutagen === item.label)), "生年四化落宫与盘面标记不一致");

  const soul = palaces.find((palace) => palace.name === "命宫").index;
  assert(premium.buildArrows(snapshot, horoscope, soul, premium.DEFAULT_LAYERS).every((a) => a.layer === "rel") && premium.buildArrows(snapshot, horoscope, soul, premium.DEFAULT_LAYERS).length === 4, "默认图层应只显示三方四正");
  const all = premium.buildArrows(snapshot, horoscope, soul, { rel: true, birth: true, fly: true, luck: true }, iztro.util.getMutagensByHeavenlyStem);
  assert(stable([...new Set(all.map((a) => a.layer))].sort()) === stable(["birth", "fly", "luck", "rel"]), "图层叠加缺失");
  assert(all.filter((a) => a.layer === "luck").length === 8 && all.filter((a) => a.layer === "birth").every((a) => a.from === "center"), "运限/生年四化连线数量或起点错误");
  assert(premium.buildArrows(snapshot, null, soul, { luck: true, rel: false }).length === 0, "未取运限时不应画运限四化");
  let layers = premium.normalizeLayers({ rel: "x", fly: true, bogus: true });
  assert(stable(layers) === stable({ rel: true, birth: false, fly: true, luck: false }), "图层设置归一化错误");
  layers = premium.toggleLayer(premium.toggleLayer(layers, "rel"), "nope");
  assert(layers.rel === false && layers.fly === true && !("nope" in layers), "图层开关切换错误");
  assert(premium.adjacentIndex(0, -1) === 11 && premium.adjacentIndex(11, 1) === 0 && premium.adjacentIndex(5, 1) === 6, "宫位左右切换错误");
  const timeline = premium.decadalTimeline(snapshot, horoscope);
  assert(timeline.length === 12 && timeline.filter((item) => item.current).length === 1 && timeline.every((item, i) => i === 0 || item.range[0] > timeline[i - 1].range[0]), "大限时间轴错误");
  const overview = premium.overviewModel(snapshot, horoscope);
  assert(overview.fiveElementsClass === snapshot.natal.fiveElementsClass && overview.luck && overview.birthMutagen.every((item) => item.palace), "命盘总览字段缺失");
}

// 2026-11-02 新手白话词典：词条完整、页面术语可解析、「在你的盘上」与盘面数据一致。
function runGlossaryContracts() {
  global.iztro = iztro;
  const glossary = require("./ziwei-glossary.js");
  const premium = require("./ziwei-premium.js");
  const html = fs.readFileSync(HTML_PATH, "utf8");
  const css = fs.readFileSync(path.join(ROOT, "ziwei-premium.css"), "utf8");
  assert(html.includes('src="ziwei-glossary.js') && html.indexOf('src="ziwei-glossary.js') > html.indexOf('src="ziwei-premium.js'), "词典脚本未在星夜视觉层之后加载");
  const keys = new Set(glossary.TERMS.map((t) => t.key));
  assert(keys.size === glossary.TERMS.length, "词条 key 重复");
  glossary.TERMS.forEach((t) => {
    assert(glossary.GROUPS.includes(t.group), `${t.key} 分组无效`);
    assert(typeof t.text === "string" && t.text.length >= 8, `${t.key} 缺少白话释义`);
  });
  const required = ["化禄", "化权", "化科", "化忌", "飞禄", "飞权", "飞科", "飞忌", "宫干四化", "自化", "生年四化", "三方四正", "对宫", "大限", "流年", "小限", "五行局", "命主", "身主", "命宫", "身宫", "来因宫", "空宫", "真太阳时", "亮度",
    "兄弟宫", "夫妻宫", "子女宫", "财帛宫", "疾厄宫", "迁移宫", "仆役宫", "官禄宫", "田宅宫", "福德宫", "父母宫",
    "庙", "旺", "得", "利", "平", "不", "陷",
    "紫微", "天机", "太阳", "武曲", "天同", "廉贞", "天府", "太阴", "贪狼", "巨门", "天相", "天梁", "七杀", "破军",
    "左辅", "右弼", "文昌", "文曲", "天魁", "天钺", "禄存", "天马", "擎羊", "陀罗", "火星", "铃星", "地空", "地劫",
    "长生十二神", "博士十二神", "岁前十二神", "将前十二神"];
  required.forEach((key) => assert(keys.has(key), `词典缺少：${key}`));
  Object.values(glossary.LAYER_TERM).forEach((key) => assert(keys.has(key), `图层说明缺少：${key}`));
  [...html.matchAll(/data-zw-term="([^"]+)"/g)].forEach((m) => assert(keys.has(m[1]), `页面 ? 指向不存在的词条：${m[1]}`));
  ["禄", "权", "科", "忌"].forEach((l) => { assert(glossary.resolve(l) === `化${l}`, `${l} 未解析为化${l}`); assert(glossary.resolve(l, "fly") === `飞${l}`, `${l} 未解析为飞${l}`); });
  ["交友", "事业宫", "土五局", "宫干飞化", "长生", "辅星与杂曜", "十四主星"].forEach((w) => assert(glossary.resolve(w), `别名未解析：${w}`));

  const snapshot = engine.buildNatal({ calendarType: "solar", date: "2000-08-16", time: "00:30", gender: "male", timeBasis: "beijing" });
  const horoscope = engine.getHoroscope(snapshot, "2026-11-02");
  const palaces = snapshot.natal.palaces;
  const pn = (p) => (p.name.endsWith("宫") ? p.name : `${p.name}宫`);
  // 页面里实际会出现的文字都能解析：所有宫名、主星、关键辅星、亮度、总览字段
  palaces.forEach((p) => {
    assert(glossary.tokenize(pn(p)).some((x) => x.key), `宫名未标注：${pn(p)}`);
    p.majorStars.forEach((s) => { assert(glossary.tokenize(s.name)[0].key === s.name, `主星未标注：${s.name}`); if (s.brightness) assert(glossary.tokenize(s.brightness, { token: true })[0].key, `亮度未标注：${s.brightness}`); });
    p.minorStars.filter((s) => KEY_MINOR_NAMES.has(s.name)).forEach((s) => assert(glossary.tokenize(s.name)[0].key === s.name, `辅星未标注：${s.name}`));
  });
  assert(glossary.tokenize(snapshot.natal.fiveElementsClass)[0].key === "五行局", "五行局未标注");
  assert(stable(glossary.tokenize("庙 · 忌", { token: true }).filter((x) => x.key).map((x) => x.key)) === stable(["庙", "化忌"]), "徽标小字切分错误");
  assert(!glossary.tokenize("平时").some((x) => x.key) && !glossary.tokenize("得到").some((x) => x.key), "普通文字被误标为亮度");

  const soul = palaces.find((p) => p.name === "命宫");
  const ctx = { snapshot, horoscope, selected: soul.index, stemTable: iztro.util.getMutagensByHeavenlyStem };
  const jiStar = snapshot.natal.birthMutagen["忌"];
  const jiPalace = palaces.find((p) => [...p.majorStars, ...p.minorStars].some((s) => s.name === jiStar));
  const jiLine = glossary.chartLine("化忌", ctx);
  assert(jiLine.includes(`生年化忌是${jiStar}，在${pn(jiPalace)}`), `化忌盘面说明错误：${jiLine}`);
  const flyJi = premium.flyingFrom(palaces, soul.index, iztro.util.getMutagensByHeavenlyStem).find((i) => i.label === "忌");
  assert(glossary.chartLine("飞忌", ctx).includes(flyJi.self ? "落回本宫" : `飞忌入${pn(palaces.find((p) => p.index === flyJi.to))}：${flyJi.star}`), "飞忌盘面说明错误");
  palaces.forEach((p) => p.majorStars.forEach((s) => assert(glossary.chartLine(s.name, ctx).startsWith(`你的${s.name}在${pn(p)}`), `${s.name} 落宫说明错误`)));
  const selfs = palaces.flatMap((p) => premium.flyingFrom(palaces, p.index, iztro.util.getMutagensByHeavenlyStem).filter((i) => i.self).map((i) => `${pn(p)}自${i.label}`));
  const selfLine = glossary.chartLine("自化", ctx);
  assert(selfs.length ? selfs.every((x) => selfLine.includes(x)) : selfLine.includes("没有"), "自化盘面说明错误");
  assert(glossary.chartLine("五行局", ctx).includes(snapshot.natal.fiveElementsClass), "五行局盘面说明错误");
  assert(glossary.chartLine("大限", ctx).includes(`${horoscope.decadal.ageRange[0]}–${horoscope.decadal.ageRange[1]}`), "大限盘面说明错误");
  // 2026-11-02 白话含义：48 条四化×宫、14 主星特质、示例盘浮窗含“这说明”句
  ["禄", "权", "科", "忌"].forEach((l) => palaces.forEach((p) => assert(glossary.huaMeaning(l, pn(p)).length >= 8, `缺少化${l}×${pn(p)} 白话`)));
  assert(Object.values(glossary.HUA_PALACE).reduce((n, row) => n + Object.keys(row).length, 0) === 48, "四化×宫白话不是 48 条");
  assert(Object.keys(glossary.STAR_TRAIT).length === 14 && Object.keys(glossary.PALACE_TOPIC).length === 12, "主星特质或宫位主题不全");
  assert(jiLine.includes(`→ 化忌在${pn(jiPalace)}，这说明${glossary.huaMeaning("忌", pn(jiPalace))}`), `化忌浮窗缺少白话含义：${jiLine}`);
  const flyLine = glossary.chartLine("飞忌", ctx);
  const flyTo = flyJi.self ? pn(soul) : pn(palaces.find((p) => p.index === flyJi.to));
  assert(flyLine.includes(`→ ${glossary.flyMeaning("忌", pn(soul), flyTo)}`) && flyLine.includes("这说明你在"), `飞忌浮窗缺少白话含义：${flyLine}`);
  const tianji = palaces.find((p) => p.majorStars.some((s) => s.name === "天机"));
  const tjLine = glossary.chartLine("天机", ctx);
  assert(tjLine.includes(`→ 这说明在${glossary.PALACE_TOPIC[pn(tianji)]}上，容易表现出${glossary.STAR_TRAIT["天机"]}`), `主星浮窗缺少白话含义：${tjLine}`);
  assert(glossary.starMeaning({ name: "天机", brightness: "陷" }, "命宫").includes("不易发挥") && glossary.starMeaning({ name: "天机", brightness: "庙" }, "命宫").includes("发挥得比较好"), "亮度修饰错误");
  assert(glossary.chartLine(pn(jiPalace), ctx).includes("→ 这一宫管"), "宫位浮窗缺少白话含义");
  assert(glossary.MEANING_NOTE.includes("仅供参考"), "缺少仅供参考说明");
  // 2026-11-02 白话读盘：与浮窗同一生成器；随选宫与运限更新
  const plain = glossary.plainModel(ctx);
  const itemsOf = (key, c = ctx) => glossary.meaningItems(glossary.chartLine(key, c)).map((i) => i.text);
  assert(stable(plain.map((b) => b.id)) === stable(["birth", "decadal", "yearly", "palace"]), "白话读盘分块错误");
  assert(stable(plain[0].items.map((i) => i.text)) === stable(itemsOf("生年四化")) && plain[0].items.length === 4 && stable(itemsOf("生年四化")) === stable(itemsOf("生年四化连线")), "生年四化白话与浮窗不一致");
  assert(stable(plain[1].items.map((i) => i.text)) === stable(itemsOf("大限四化")) && plain[1].items.length >= 2, "大限白话与浮窗不一致");
  assert(stable(plain[2].items.map((i) => i.text)) === stable(itemsOf("流年四化")) && plain[2].items.length >= 2, "流年白话与浮窗不一致");
  assert(stable(plain[3].items.map((i) => i.text)) === stable([...itemsOf(pn(soul)), ...itemsOf("宫干飞化连线")]) && plain[3].sub.startsWith(pn(soul)), "所选宫白话与浮窗不一致");
  assert(plain[0].items.every((i) => i.kind) && plain[0].items[3].label === "忌", "白话读盘四化颜色标记错误");
  const other = palaces.find((p) => p.index !== soul.index && p.majorStars.length);
  const plainOther = glossary.plainModel({ ...ctx, selected: other.index });
  assert(plainOther[3].sub.startsWith(pn(other)) && stable(plainOther[3].items) !== stable(plain[3].items), "白话读盘未随选宫更新");
  const horoscope2 = engine.getHoroscope(snapshot, "2041-03-01");
  const plainLater = glossary.plainModel({ ...ctx, horoscope: horoscope2 });
  assert(plainLater[1].sub !== plain[1].sub && stable(plainLater[2].items) !== stable(plain[2].items), "白话读盘未随运限更新");
  assert(glossary.plainModel({ ...ctx, horoscope: null })[1].empty, "未固定运限时应提示选择日期");
  assert(html.includes('id="zwPlain"') && html.indexOf('id="zwPlain"') < html.indexOf('id="chartPanel"'), "白话读盘不在命盘上方");
  assert(glossary.chartLine("化忌", {}) === "", "未排盘时不应输出盘面说明");
  assert(glossary.aiQuestion("化忌", jiLine).includes("化忌") && glossary.aiQuestion("化忌", jiLine).includes(jiStar), "问 AI 预填问题缺少术语或盘面");
  assert(glossary.search("忌").some((t) => t.key === "化忌") && glossary.search("").length === glossary.TERMS.length, "词典搜索错误");
  assert(/\.zw-pop\.zw-pop-sheet\{[^}]*position:fixed/.test(css) && /prefers-reduced-motion:reduce\)\{[^}]*zw-pop/.test(css), "手机术语卡或减少动态设置缺失");
}

try {
  runFixtures();
  runEngineContracts();
  runPageContracts();
  runBaselineIsolation();
  runPremiumContracts();
  runGlossaryContracts();
  console.log(`PASS 紫微原型检查：30 个固定盘、内核契约、AI 隐私、记录格式与旧模块隔离，共 ${assertions} 项断言。`);
} catch (error) {
  console.error(`FAIL 紫微原型检查：${error.message}`);
  process.exitCode = 1;
}
