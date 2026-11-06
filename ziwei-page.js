(function () {
  "use strict";

  const engine = window.ZiweiEngine;
  const pad = (value) => String(value).padStart(2, '0');
  const STORAGE_KEY = "ziwei_records_v1";
  const API_KEY_STORAGE = "qimen_deepseek_api_key";
  const THEME_STORAGE_KEY = "ziwei_theme_v1";
  const DENSITY_STORAGE_KEY = "ziwei_density_v1";
  const AI_MODEL = window.DeepSeekClient.MODEL;
  const BRANCH_ORDER = ["巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑", "寅", "卯", "辰"];
  const EARTHLY_BRANCH_ORDER = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  const TIME_BRANCH_LABELS = ["早子时", "丑时", "寅时", "卯时", "辰时", "巳时", "午时", "未时", "申时", "酉时", "戌时", "亥时", "晚子时"];
  const MUTAGEN_LABELS = ["禄", "权", "科", "忌"];
  const NATAL_AXES = [
    ["R10", "命迁轴", "命宫", "迁移"],
    ["R11", "兄友轴", "兄弟", "仆役"],
    ["R12", "夫官轴", "夫妻", "官禄"],
    ["R13", "子田轴", "子女", "田宅"],
    ["R14", "财福轴", "财帛", "福德"],
    ["R15", "父疾轴", "父母", "疾厄"],
  ];
  const CHART_ZOOM_MIN = 0.75;
  const CHART_ZOOM_MAX = 1.5;
  const CHART_ZOOM_STEP = 0.1;
  const KEY_MINOR_STARS = new Set(["左辅", "右弼", "文昌", "文曲", "天魁", "天钺", "禄存", "擎羊", "陀罗", "火星", "铃星", "地空", "地劫", "天马"]);
  const AI_MODE_GUIDES = Object.freeze({
    comprehensive: "综合总览：从整张命盘提炼最重要的结构，并兼顾事业、财富、关系、身心倾向与当前运限；不要把回答限制为一个主题。",
    natal: "本命结构：重点说明稳定底色、优势、制约和三方四正，运限只用于说明当下如何承接本命。",
    career: "事业发展：以官禄相关结构为观察重点，同时合参命、财、迁等关联宫位和当前运限，不孤立看单宫。",
    wealth: "财富方式：以财帛相关结构为观察重点，同时合参取得方式、承载条件、风险与当前运限，不做收益保证。",
    relationship: "感情关系：以夫妻相关结构为观察重点，同时合参命盘整体关系模式与当前运限，不替代现实沟通。",
    wellbeing: "身心倾向：只解释传统盘面中的压力与生活观察点，不作医学诊断，不推断具体疾病。",
    decadal: "当前大限：说明这十年的主线、机会、代价及本命承接条件，并指出流年如何触发。",
    yearly: "指定流年：说明该年最值得关注的领域、触发条件和反向证据，必须回到本命与大限判断。",
    conclusion: "只看结论：保留完整证据链，但全文尽量控制在 500 字以内，先给最重要结论和现实建议。",
  });
  const AI_STYLE_GUIDES = Object.freeze({
    brief: ["简断", "正文尽量控制在 500 字以内，先给主线，重点清楚，不逐星展开。"],
    detail: ["详断", "正文约 800–1200 字，围绕重点展开成立依据、制约条件和现实建议；六个标题保持不变，各段可按需要展开，不受简断的句数限制。"],
    conclusion: ["只看结论", "正文尽量控制在 300 字以内；六个标题仍保留，每段只写核心结论或行动建议，最后保留可核对的依据。"],
    palaces: ["逐宫细断", "先总论，再在“重点关注”中按十二宫逐宫简述并合参三方四正，不逐星套话；其余段落提炼共性，正文尽量控制在 1500 字以内。"],
    timing: ["运限重点", "以已提供的大限和指定流年为重点，说明阶段主线、触发条件、机会和风险；缺少流月、流日证据时不得推断具体月份、日期或必然应期。正文尽量控制在 800 字以内。"],
  });

  function normalizeAiStyle(value) {
    return Object.hasOwn(AI_STYLE_GUIDES, value) ? value : "brief";
  }

  function aiStyleLabel(value) {
    return AI_STYLE_GUIDES[normalizeAiStyle(value)][0];
  }
  // 2026-11-02 白话五段 + 依据：正文给完全不懂紫微的人看，证据编号只集中在最后的“依据”里。
  const REQUIRED_AI_SECTIONS = Object.freeze(["一句话总结", "重点关注", "顺的地方", "要留意的", "建议怎么做", "依据"]);
  const AI_BODY_SECTIONS = Object.freeze(REQUIRED_AI_SECTIONS.slice(0, 5));
  const LOCATIONS = [
    { preset: true, name: "云南省 昆明市", aliases: ["昆明", "云南昆明", "kunming"], lat: 25.0389, lng: 102.7183 },
    { preset: true, name: "云南省 曲靖市 麒麟区", aliases: ["曲靖", "麒麟", "麒麟区", "曲靖麒麟"], lat: 25.4951, lng: 103.8050 },
    { preset: true, name: "云南省 曲靖市 师宗县", aliases: ["师宗", "师宗县"], lat: 24.8222, lng: 103.9936 },
    { preset: true, name: "北京市", aliases: ["北京", "beijing"], lat: 39.9042, lng: 116.4074 },
    { preset: true, name: "上海市", aliases: ["上海", "shanghai"], lat: 31.2304, lng: 121.4737 },
    { preset: true, name: "广东省 广州市", aliases: ["广州", "guangzhou"], lat: 23.1291, lng: 113.2644 },
    { name: "广东省 深圳市", aliases: ["深圳", "shenzhen"], lat: 22.5431, lng: 114.0579 },
    { name: "四川省 成都市", aliases: ["成都", "chengdu"], lat: 30.5728, lng: 104.0668 },
    { name: "重庆市", aliases: ["重庆", "chongqing"], lat: 29.563, lng: 106.5516 },
    { name: "湖北省 武汉市", aliases: ["武汉", "wuhan"], lat: 30.5928, lng: 114.3055 },
    { name: "浙江省 杭州市", aliases: ["杭州", "hangzhou"], lat: 30.2741, lng: 120.1551 },
    { name: "江苏省 南京市", aliases: ["南京", "nanjing"], lat: 32.0603, lng: 118.7969 },
    { name: "陕西省 西安市", aliases: ["西安", "xian"], lat: 34.3416, lng: 108.9398 },
    { name: "贵州省 贵阳市", aliases: ["贵阳", "guiyang"], lat: 26.647, lng: 106.6302 },
  ];
  const SYSTEM_PROMPT = [
    "你是紫微斗数盘面解读助手。你只能解释用户提供的冻结盘面，以及用户已经选择时才提供的冻结运限；不能自行安星、修改宫位、推算未提供的字段或补造证据。",
    "本盘固定 iztro default（以《紫微斗数全书》为基础）的四化、亮度与安星规则；不得混入中州派或其他门派表格。",
    "紫微用于观察整张命盘：用户可以同时询问全盘或多个生活领域，不得套用六爻的一事一问限制。分析模式只是观察重点，不是排他范围。",
    "先抓主线再展开：本命定基础；提供运限时，再以大限定阶段、流年看触发。优先三方四正、六组对宫轴、星曜组合、亮度、四化和辅煞关系，不得逐宫流水账或逐星套话。",
    "每次回答必须严格使用六个二级标题，顺序固定：『## 一句话总结』『## 重点关注』『## 顺的地方』『## 要留意的』『## 建议怎么做』『## 依据』。",
    "读者完全不懂紫微斗数：用直白口语短句。『一句话总结』只写一句；『重点关注』写已选流年（或用户所问）的重点；其余每段 2–3 句。少用术语，必须用时在括号里用几个字解释，例如：化忌（容易操心、放不下的地方）。不要逐宫流水账，不要用加粗、表格或多级列表。",
    "前五段正文里不得出现任何证据编号。所有证据编号只写在最后『## 依据』里，用英文方括号，每段一行，格式照抄下面的样子（编号换成证据目录里真实存在的）：\n## 依据\n- 一句话总结：[P01] [N01]\n- 重点关注：[D02] [Y03] [P05]\n- 顺的地方：[P07] [R01]\n- 要留意的：[P04] [Y05]\n- 建议怎么做：[N01]\n已选运限时，依据里要同时出现大限（D 开头）和流年（Y 开头）编号，最好写在“重点关注”这一行。只能引用证据目录中真实存在的编号。",
    "『顺的地方』与『要留意的』必须同时有内容并各有依据，不能把禄权科一概视为吉，也不能把忌煞一概视为凶。重点先在内部按『成立依据—制约条件—运限触发』核对，再用白话写出；没有运限时只解释本命条件。使用传统格局名称时必须核对成立条件与破格因素，证据不足只描述星曜组合，不强行定格。四化是星曜的属性，必须连同化星及所在宫位理解，不能当成独立星曜。",
    "『建议怎么做』给可执行的现实建议，最后一句提醒这是传统解读、需要结合现实验证，不是确定会发生的事。",
    "若证据不足，直接说证据不足。不得声称科学证实、权威定论、必然吉凶，不替代医疗、法律、投资等专业意见。",
    "不要尝试推断或索要姓名、经度、原始出生日期和原始出生时间。",
  ].join("\n");

  const state = {
    snapshot: null,
    horoscope: null,
    selectedPalaceIndex: null,
    dirtyBirth: false,
    dirtyHoroscope: false,
    pendingBirthInput: null,
    currentRecordId: null,
    records: [],
    storageError: "",
    selectedLocation: null,
    theme: "light",
    density: "clear",
    chartZoom: 1,
    collapsedTurns: new Set(),
  };

  const $ = (id) => document.getElementById(id);
  const elements = {
    birthForm: $("birthForm"),
    themeLight: $("themeLight"),
    themeDark: $("themeDark"),
    densityClear: $("densityClear"),
    densityPro: $("densityPro"),
    chartZoomOut: $("chartZoomOut"),
    chartZoomReset: $("chartZoomReset"),
    chartZoomIn: $("chartZoomIn"),
    personLabel: $("personLabel"),
    solarFields: $("solarFields"),
    lunarFields: $("lunarFields"),
    solarDate: $("solarDate"),
    lunarYear: $("lunarYear"),
    lunarMonth: $("lunarMonth"),
    lunarDay: $("lunarDay"),
    isLeapMonth: $("isLeapMonth"),
    birthTime: $("birthTime"),
    longitudeField: $("longitudeField"),
    longitude: $("longitude"),
    locationTrigger: $("locationTrigger"),
    locationPanel: $("locationPanel"),
    locationSearch: $("locationSearch"),
    locationList: $("locationList"),
    customLocationName: $("customLocationName"),
    customLongitude: $("customLongitude"),
    useCustomLocation: $("useCustomLocation"),
    birthLocationDisplay: $("birthLocationDisplay"),
    birthLocationCoord: $("birthLocationCoord"),
    solarPreview: $("solarPreview"),
    resetBirth: $("resetBirth"),
    inputState: $("inputState"),
    statusBanner: $("statusBanner"),
    emptyState: $("emptyState"),
    chartPanel: $("chartPanel"),
    detailSection: $("detailSection"),
    lowerSection: $("lowerSection"),
    aiPanel: $("aiPanel"),
    chartViewport: $("chartViewport"),
    chartGrid: $("chartGrid"),
    chartCenter: $("chartCenter"),
    chartVersion: $("chartVersion"),
    palaceDetail: $("palaceDetail"),
    targetDate: $("targetDate"),
    horoscopeButton: $("horoscopeButton"),
    horoscopeState: $("horoscopeState"),
    horoscopeSummary: $("horoscopeSummary"),
    apiKey: $("apiKey"),
    saveApiKey: $("saveApiKey"),
    conversation: $("conversation"),
    aiForm: $("aiForm"),
    aiMode: $("aiMode"),
    aiStyle: $("aiStyle"),
    aiPresetQuestions: $("aiPresetQuestions"),
    aiQuestion: $("aiQuestion"),
    askAi: $("askAi"),
    aiState: $("aiState"),
    recordSearch: $("recordSearch"),
    recordList: $("recordList"),
    timeConfirmDialog: $("timeConfirmDialog"),
    inputDateTime: $("inputDateTime"),
    effectiveDateTime: $("effectiveDateTime"),
    correctionNote: $("correctionNote"),
    cancelTimeShift: $("cancelTimeShift"),
    confirmTimeShift: $("confirmTimeShift"),
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeDisplayPreference(value, allowed, fallback) {
    return allowed.includes(value) ? value : fallback;
  }

  function readDisplayPreference(storage, key, allowed, fallback) {
    try {
      return normalizeDisplayPreference(storage.getItem(key), allowed, fallback);
    } catch (_) {
      return fallback;
    }
  }

  function writeDisplayPreference(storage, key, value) {
    try {
      storage.setItem(key, value);
      return true;
    } catch (_) {
      return false;
    }
  }

  function applyTheme(value, persist) {
    const theme = normalizeDisplayPreference(value, ["light", "dark"], "light");
    state.theme = theme;
    document.documentElement.dataset.theme = theme;
    elements.themeLight.setAttribute("aria-pressed", String(theme === "light"));
    elements.themeDark.setAttribute("aria-pressed", String(theme === "dark"));
    if (persist) writeDisplayPreference(localStorage, THEME_STORAGE_KEY, theme);
    return theme;
  }

  function applyDensity(value, persist) {
    const density = normalizeDisplayPreference(value, ["clear", "pro"], "clear");
    state.density = density;
    document.documentElement.dataset.density = density;
    elements.densityClear.setAttribute("aria-pressed", String(density === "clear"));
    elements.densityPro.setAttribute("aria-pressed", String(density === "pro"));
    if (persist) writeDisplayPreference(localStorage, DENSITY_STORAGE_KEY, density);
    return density;
  }

  function normalizeChartZoom(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 1;
    return Math.min(CHART_ZOOM_MAX, Math.max(CHART_ZOOM_MIN, Math.round(numeric * 10) / 10));
  }

  function applyChartZoom(value) {
    const zoom = normalizeChartZoom(value);
    const percent = Math.round(zoom * 100);
    state.chartZoom = zoom;
    elements.chartGrid.style.zoom = String(zoom);
    elements.chartZoomReset.textContent = `${percent}%`;
    elements.chartZoomReset.setAttribute("aria-label", `命盘当前缩放 ${percent}%，点击还原`);
    elements.chartZoomOut.disabled = zoom <= CHART_ZOOM_MIN;
    elements.chartZoomIn.disabled = zoom >= CHART_ZOOM_MAX;
    return zoom;
  }

  function touchDistance(touches) {
    return Math.hypot(touches[1].clientX - touches[0].clientX, touches[1].clientY - touches[0].clientY);
  }

  let chartPinch = null;

  function beginChartPinch(event) {
    if (event.touches.length !== 2 || (window.matchMedia && !window.matchMedia("(max-width: 760px)").matches)) return;
    const rect = elements.chartViewport.getBoundingClientRect();
    const centerX = (event.touches[0].clientX + event.touches[1].clientX) / 2 - rect.left;
    const centerY = (event.touches[0].clientY + event.touches[1].clientY) / 2 - rect.top;
    chartPinch = {
      distance: touchDistance(event.touches),
      zoom: state.chartZoom,
      centerX,
      centerY,
      contentX: (elements.chartViewport.scrollLeft + centerX) / state.chartZoom,
      contentY: (elements.chartViewport.scrollTop + centerY) / state.chartZoom,
    };
  }

  function moveChartPinch(event) {
    if (!chartPinch || event.touches.length !== 2) return;
    event.preventDefault();
    const zoom = applyChartZoom(chartPinch.zoom * touchDistance(event.touches) / chartPinch.distance);
    elements.chartViewport.scrollLeft = chartPinch.contentX * zoom - chartPinch.centerX;
    elements.chartViewport.scrollTop = chartPinch.contentY * zoom - chartPinch.centerY;
  }

  function endChartPinch(event) {
    if (event.touches.length < 2) chartPinch = null;
  }

  function randomId(prefix) {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return `${prefix}-${window.crypto.randomUUID()}`;
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function todayText() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }

  // 只把当前盘面状态广播给展示层（ziwei-premium.js），不改排盘与解盘逻辑。
  function notifyView(reason) {
    if (typeof window.dispatchEvent !== "function" || typeof window.CustomEvent !== "function") return;
    window.dispatchEvent(new window.CustomEvent("ziwei:view", { detail: { reason, snapshot: state.snapshot, horoscope: state.horoscope, selectedPalaceIndex: state.selectedPalaceIndex } }));
  }

  function setStatus(message, kind) {
    elements.statusBanner.textContent = message;
    elements.statusBanner.className = `notice${kind ? ` ${kind}` : ""}`;
  }

  function formatDateTime(value) {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString("zh-CN", { hour12: false });
  }

  function formValue(name) {
    return elements.birthForm.elements[name].value;
  }

  function locationCoordText(location) {
    if (!location || !Number.isFinite(Number(location.lng))) return "尚未选择地点";
    const latitude = location.lat == null ? "" : ` · 北纬 ${Number(location.lat).toFixed(4)}°`;
    return `东经 ${Number(location.lng).toFixed(4)}°${latitude}`;
  }

  function selectLocation(location, markDirty = true) {
    state.selectedLocation = location ? {
      name: String(location.name || "自定义地点"),
      lng: Number(location.lng),
      lat: location.lat == null ? null : Number(location.lat),
    } : null;
    elements.longitude.value = state.selectedLocation ? String(state.selectedLocation.lng) : "";
    elements.birthLocationDisplay.textContent = state.selectedLocation?.name || "尚未选择";
    elements.birthLocationCoord.textContent = locationCoordText(state.selectedLocation);
    elements.locationPanel.hidden = true;
    elements.locationTrigger.setAttribute("aria-expanded", "false");
    renderLocations();
    refreshSolarPreview();
    if (markDirty) markBirthDirty();
  }

  function renderLocations() {
    const query = elements.locationSearch.value.trim().toLowerCase();
    const matches = LOCATIONS.filter((location) => {
      if (!query) return location.preset;
      return location.name.toLowerCase().includes(query) || location.aliases.some((alias) => alias.toLowerCase().includes(query));
    });
    elements.locationList.innerHTML = matches.length ? matches.map((location) => {
      const selected = state.selectedLocation?.name === location.name && Number(state.selectedLocation?.lng) === location.lng;
      return `<button class="location-option" type="button" role="option" aria-current="${selected}" data-location-name="${escapeHtml(location.name)}"><strong>${escapeHtml(location.name)}</strong><span>${escapeHtml(locationCoordText(location))}</span></button>`;
    }).join("") : '<div class="privacy-note">没有匹配地点，可使用下方自定义经度。</div>';
    elements.locationList.querySelectorAll("[data-location-name]").forEach((button) => {
      button.addEventListener("click", () => selectLocation(LOCATIONS.find((location) => location.name === button.dataset.locationName)));
    });
  }

  function customLocationFromValues(name, longitude) {
    const lng = Number(longitude);
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) throw new Error("请输入 -180 到 180 之间的有效经度。");
    return { name: String(name || "自定义地点").trim() || "自定义地点", lng, lat: null };
  }

  function normalizeStoredLocation(data) {
    if (data?.location && Number.isFinite(Number(data.location.lng))) {
      return { name: String(data.location.name || "自定义地点"), lng: Number(data.location.lng), lat: data.location.lat == null ? null : Number(data.location.lat) };
    }
    const longitude = data?.longitude === "" || data?.longitude == null ? null : Number(data.longitude);
    return Number.isFinite(longitude) ? { name: "自定义地点", lng: longitude, lat: null } : null;
  }

  function previewInput() {
    const input = collectBirthInput(true);
    if (input.timeBasis !== "trueSolar") return null;
    if (!state.selectedLocation) throw new Error("请先选择出生地点。");
    return engine.buildNatal(input).effective.trueSolar;
  }

  function formatCorrection(value) {
    const rounded = Math.round(Number(value) * 100) / 100;
    return `${rounded >= 0 ? "+" : ""}${rounded} 分钟`;
  }

  function refreshSolarPreview() {
    const option = $("useDaylightSaving"), panel = $("daylightSavingPreview");
    try {
      const input = collectBirthInput(true);
      const original = engine.getInputClock(input);
      const status = window.BirthTime.daylightStatus(original);
      const cleared = option.checked && !status.applicable;
      if (cleared) option.checked = input.useDaylightSaving = false;
      option.disabled = !status.applicable;
      let text = cleared ? "日期已离开适用时段，已取消夏令时。" : window.BirthTime.hint(status);
      if (option.checked) {
        const standard = window.BirthTime.normalize(original, true).standard;
        text += ` 夏令时已校正 −1小时；标准北京时间：${standard.year}-${pad(standard.month)}-${pad(standard.day)} ${pad(standard.hour)}:${pad(standard.minute)}。`;
      }
      panel.textContent = text;
      panel.hidden = !text;
    } catch (error) {
      panel.textContent = error.message;
      panel.hidden = false;
      elements.solarPreview.textContent = "请先核对出生时间。";
      return;
    }
    if (formValue("timeBasis") !== "trueSolar") return;
    if (!state.selectedLocation) {
      elements.solarPreview.className = "solar-preview";
      elements.solarPreview.textContent = "请选择出生地点后预览真太阳时。地点数据只保存在本机。";
      return;
    }
    try {
      const preview = previewInput();
      const longitudeCorrection = (state.selectedLocation.lng - 120) * 4;
      const equationCorrection = preview.correctionMinutes - longitudeCorrection;
      const warning = preview.crossesTimeBranch || preview.crossesDate;
      elements.solarPreview.className = `solar-preview${warning ? " warning" : ""}`;
      elements.solarPreview.innerHTML = `标准北京时间 <strong>${escapeHtml(preview.inputDateTime)}</strong><br>经度修正 ${escapeHtml(formatCorrection(longitudeCorrection))} · 均时差 ${escapeHtml(formatCorrection(equationCorrection))}<br>生效真太阳时 <strong>${escapeHtml(preview.effectiveDateTime)}</strong>${preview.crossesDate ? " · 跨日期" : ""}${preview.crossesTimeBranch ? " · 跨时辰，排盘时须确认" : " · 未跨时辰"}`;
    } catch (error) {
      elements.solarPreview.className = "solar-preview error";
      elements.solarPreview.textContent = error.message;
    }
  }

  function syncConditionalFields() {
    const lunar = formValue("calendarType") === "lunar";
    elements.solarFields.hidden = lunar;
    elements.lunarFields.hidden = !lunar;
    elements.longitudeField.hidden = formValue("timeBasis") !== "trueSolar";
    refreshSolarPreview();
  }

  function collectBirthInput(confirmedTimeShift) {
    const calendarType = formValue("calendarType");
    const input = {
      calendarType,
      gender: formValue("gender"),
      time: elements.birthTime.value,
      timeBasis: formValue("timeBasis"),
      useDaylightSaving: $("useDaylightSaving").checked,
      longitude: elements.longitude.value === "" ? null : Number(elements.longitude.value),
      confirmedTimeShift: Boolean(confirmedTimeShift),
    };
    if (calendarType === "solar") input.date = elements.solarDate.value;
    else {
      input.lunarDate = {
        year: Number(elements.lunarYear.value),
        month: Number(elements.lunarMonth.value),
        day: Number(elements.lunarDay.value),
        isLeap: elements.isLeapMonth.checked,
      };
    }
    return input;
  }

  function markBirthDirty() {
    syncConditionalFields();
    if (!state.snapshot) return;
    state.dirtyBirth = true;
    elements.inputState.textContent = "输入已修改；当前仍显示上一次命盘，请重新点击排盘。";
    elements.inputState.className = "input-state dirty";
  }

  function syncRecordControls() {
    const saved = Boolean(currentRecord());
    $("saveBirth").hidden = $("entrySave").hidden = !state.snapshot || saved;
    elements.birthForm.querySelector('button[type="submit"]').textContent = saved ? "更新并保存当前命盘" : "排出命盘";
    if (state.snapshot && !state.dirtyBirth) {
      elements.inputState.textContent = `${saved ? "已保存" : "未保存预览"}：${state.snapshot.calendar.solarDate} ${state.snapshot.calendar.timeLabel}`;
      elements.inputState.className = "input-state";
    }
  }

  function aiBusy() {
    if (!elements.askAi.disabled) return false;
    setStatus("AI 正在解读，请等待回答完成后再修改、切换或新建命盘。", "error");
    return true;
  }

  function birthInputFingerprint(input) {
    return JSON.stringify([input.calendarType, input.sourceDate, input.clockTime, input.gender, input.timeBasis, input.longitude, Boolean(input.useDaylightSaving)]);
  }

  function buildFromForm(confirmedTimeShift) {
    if (aiBusy()) return;
    const input = collectBirthInput(confirmedTimeShift);
    try {
      if (input.timeBasis === "trueSolar" && !state.selectedLocation) throw new Error("请选择出生地点后再使用真太阳时排盘。");
      const snapshot = engine.buildNatal(input);
      const existing = currentRecord();
      const changed = existing && birthInputFingerprint(existing.natalSnapshot.input) !== birthInputFingerprint(snapshot.input);
      if (changed && existing.aiHistory.length && !window.confirm("出生资料已改变。更新当前命盘会覆盖原出生资料，并清空该盘的旧 AI 问答，避免旧解读混入新盘；此操作无法撤销。确定更新吗？（取消可保留原盘，或点击新建命盘）")) return;
      let saved = null;
      if (existing || $("autoSaveBuild").checked) {
        saved = makeRecord(snapshot, existing, Boolean(changed));
        const previous = state.records;
        state.records = existing ? previous.map((record) => record.id === existing.id ? saved : record) : [saved, ...previous];
        if (!saveRecords()) { state.records = previous; return; }
      }
      state.snapshot = snapshot;
      state.horoscope = saved?.currentHoroscope || null;
      state.selectedPalaceIndex = snapshot.natal.palaces.find((palace) => palace.name === "命宫")?.index ?? 0;
      state.dirtyBirth = false;
      state.dirtyHoroscope = false;
      state.pendingBirthInput = null;
      state.currentRecordId = saved?.id || null;
      elements.aiQuestion.value = "";
      elements.aiState.textContent = "";
      renderSnapshot();
      elements.inputState.textContent = `${saved ? "已保存" : "未保存预览"}：${snapshot.calendar.solarDate} ${snapshot.calendar.timeLabel}`;
      elements.inputState.className = "input-state";
      setStatus(saved ? "命盘已保存到本地；修改会更新同一份记录，另起一份请点击“新建命盘”。" : "命盘仅供预览，尚未保存；可点击“保存命盘”，AI 解读前也会自动保存。", "success");
      elements.chartPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      if (error.code === "TIME_BRANCH_CONFIRMATION_REQUIRED") {
        state.pendingBirthInput = input;
        showTimeConfirmation(error.details);
        return;
      }
      setStatus(error.message || "排盘失败。", "error");
    }
  }

  function showTimeConfirmation(details) {
    elements.inputDateTime.textContent = details.inputDateTime;
    elements.effectiveDateTime.textContent = details.effectiveDateTime;
    elements.correctionNote.textContent = `${state.pendingBirthInput?.useDaylightSaving ? "已先减去夏令时1小时；" : ""}修正 ${formatCorrection(details.correctionMinutes)}；${TIME_BRANCH_LABELS[details.inputTimeIndex] || "原时辰"} → ${TIME_BRANCH_LABELS[details.timeIndex] || "生效时辰"}${details.crossesDate ? "，同时跨越日期" : ""}。确认后将以真太阳时重新排盘。`;
    elements.timeConfirmDialog.showModal();
  }

  function palaceDisplayName(name) {
    return String(name).endsWith("宫") ? String(name) : `${name}宫`;
  }

  function palaceRelations(palaces, selectedIndex) {
    const target = palaces.find((palace) => palace.index === Number(selectedIndex));
    if (!target) throw new Error("找不到所选宫位");
    const branchIndex = EARTHLY_BRANCH_ORDER.indexOf(target.earthlyBranch);
    const palaceAtOffset = (offset) => {
      const branch = EARTHLY_BRANCH_ORDER[(branchIndex + offset) % 12];
      return palaces.find((palace) => palace.earthlyBranch === branch);
    };
    return { target, opposite: palaceAtOffset(6), wealth: palaceAtOffset(8), career: palaceAtOffset(4) };
  }

  function starTypeClass(star) {
    const safe = ["major", "soft", "tough", "lucun", "tianma", "flower", "helper", "adjective"].includes(star.type) ? star.type : "adjective";
    return `star-${safe}`;
  }

  function brightnessClass(value) {
    return ({ 庙: "miao", 旺: "wang", 得: "de", 利: "li", 平: "ping", 不: "bu", 陷: "xian" })[value] || "ping";
  }

  function mutagenClass(value) {
    return ({ 禄: "lu", 权: "quan", 科: "ke", 忌: "ji" })[value] || "";
  }

  function starBadges(star) {
    const badges = [];
    if (star.brightness) badges.push(`<span class="star-badge brightness-${brightnessClass(star.brightness)}">${escapeHtml(star.brightness)}</span>`);
    if (star.mutagen) badges.push(`<span class="star-badge mutagen-${mutagenClass(star.mutagen)}">${escapeHtml(star.mutagen)}</span>`);
    return badges.length ? `<span class="star-badges">${badges.join("")}</span>` : "";
  }

  function starMarkup(star) {
    return `<span class="star ${starTypeClass(star)}">${escapeHtml(star.name)}${starBadges(star)}</span>`;
  }

  function minorStarMarkup(star) {
    return `<span class="minor-star ${starTypeClass(star)}">${escapeHtml(star.name)}${starBadges(star)}</span>`;
  }

  function relationItem(role, label, palace) {
    return `<div class="relation-item relation-${role}"><small>${label}</small><strong>${escapeHtml(palaceDisplayName(palace.name))} · ${escapeHtml(palace.earthlyBranch)}</strong></div>`;
  }

  const CENTER_ANCHORS = Object.freeze({
    巳: [0, 0], 午: [34, 0], 未: [66, 0], 申: [100, 0],
    辰: [0, 34], 酉: [100, 34], 卯: [0, 66], 戌: [100, 66],
    寅: [0, 100], 丑: [34, 100], 子: [66, 100], 亥: [100, 100],
  });

  function relationSvg(relations) {
    const point = (palace) => CENTER_ANCHORS[palace.earthlyBranch];
    const target = point(relations.target);
    const opposite = point(relations.opposite);
    const wealth = point(relations.wealth);
    const career = point(relations.career);
    return `<svg class="relation-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <line x1="${target[0]}" y1="${target[1]}" x2="${opposite[0]}" y2="${opposite[1]}"></line>
      <polyline points="${target.join(",")} ${wealth.join(",")} ${career.join(",")} ${target.join(",")}"></polyline>
      <circle cx="${target[0]}" cy="${target[1]}" r="1.4" stroke="var(--gold)"></circle>
      <circle cx="${opposite[0]}" cy="${opposite[1]}" r="1.4" stroke="var(--violet)"></circle>
      <circle cx="${wealth[0]}" cy="${wealth[1]}" r="1.4" stroke="var(--jade)"></circle>
      <circle cx="${career[0]}" cy="${career[1]}" r="1.4" stroke="var(--blue)"></circle>
    </svg>`;
  }

  function birthMutagenMarkup(mutagen) {
    return MUTAGEN_LABELS.map((label) => `<span class="star-badge mutagen-${mutagenClass(label)}">${label} · ${escapeHtml(mutagen[label] || "—")}</span>`).join("");
  }

  function renderCenter() {
    const snapshot = state.snapshot;
    const relations = palaceRelations(snapshot.natal.palaces, state.selectedPalaceIndex);
    const timeBasis = snapshot.input.timeBasis === "trueSolar" ? `真太阳时 · ${escapeHtml(state.selectedLocation?.name || "自定义地点")}` : "北京时间";
    elements.chartCenter.innerHTML = `${relationSvg(relations)}
      <div class="center-content">
        <div class="center-kicker">Natal Astrolabe · 三方四正</div>
        <div class="center-title">${escapeHtml(elements.personLabel.value.trim() || "匿名命盘")}</div>
        <div class="center-meta">${snapshot.input.gender === "male" ? "男" : "女"} · ${escapeHtml(snapshot.calendar.solarDate)} · ${escapeHtml(snapshot.calendar.lunarDate)}</div>
        <div class="center-key">${escapeHtml(snapshot.natal.fiveElementsClass)} · 命主 ${escapeHtml(snapshot.natal.soulStar)} · 身主 ${escapeHtml(snapshot.natal.bodyStar)}</div>
        <div class="center-grid">
          <span>命身宫<strong>命宫 ${escapeHtml(snapshot.natal.soulPalace)} · 身宫 ${escapeHtml(snapshot.natal.bodyPalace)}</strong></span>
          <span>四柱干支<strong>${escapeHtml(snapshot.calendar.sexagenary)}</strong></span>
          <span>时间口径<strong>${timeBasis}${snapshot.input.useDaylightSaving ? " · 夏令时已校正" : ""}</strong></span>
          <span>固定规则<strong>正月初一分年 · 自然年虚岁</strong></span>
        </div>
        <div class="birth-mutagens" aria-label="生年四化">${birthMutagenMarkup(snapshot.natal.birthMutagen)}</div>
        <div class="relation-legend" aria-label="所选宫位三方四正">
          ${relationItem("target", "本宫", relations.target)}
          ${relationItem("opposite", "对宫", relations.opposite)}
          ${relationItem("wealth", "财帛位", relations.wealth)}
          ${relationItem("career", "官禄位", relations.career)}
        </div>
      </div>`;
  }

  function renderSnapshot() {
    const snapshot = state.snapshot;
    elements.emptyState.hidden = true;
    elements.chartPanel.hidden = false;
    elements.detailSection.hidden = false;
    elements.lowerSection.hidden = false;
    elements.lowerSection.classList.remove("records-only");
    elements.aiPanel.hidden = false;
    elements.chartVersion.textContent = `iztro ${snapshot.ruleMeta.engine.version} · 本地固定`;
    elements.chartGrid.querySelectorAll(".palace").forEach((node) => node.remove());
    [...snapshot.natal.palaces]
      .sort((a, b) => BRANCH_ORDER.indexOf(a.earthlyBranch) - BRANCH_ORDER.indexOf(b.earthlyBranch))
      .forEach((palace) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "palace";
        button.dataset.index = palace.index;
        button.dataset.branch = palace.earthlyBranch;
        const displayName = palaceDisplayName(palace.name);
        button.setAttribute("aria-label", `${displayName}，${palace.heavenlyStem}${palace.earthlyBranch}`);
        const keyMinors = palace.minorStars.filter((star) => KEY_MINOR_STARS.has(star.name));
        const adjectiveSummary = palace.adjectiveStars.slice(0, 4);
        const flags = [
          palace.earthlyBranch === snapshot.natal.soulPalace ? '<span class="flag soul">命宫位</span>' : "",
          palace.isBodyPalace ? '<span class="flag body">身宫</span>' : "",
          palace.isOriginalPalace ? '<span class="flag original">来因宫</span>' : "",
        ].filter(Boolean).join("");
        button.innerHTML = `
          <span class="palace-head"><span class="palace-seal">${escapeHtml(displayName.replace(/宫$/, ""))}</span><span class="palace-identity"><span class="palace-branch">${escapeHtml(palace.heavenlyStem + palace.earthlyBranch)}</span><span class="relation-role" aria-hidden="true"></span></span></span>
          <span class="palace-flags">${flags}</span>
          <span class="palace-layer palace-layer-major"><span class="palace-layer-label">主曜</span><span class="star-list">${palace.majorStars.length ? palace.majorStars.map(starMarkup).join("") : '<span class="star-empty">空宫 · 借对宫主星</span>'}</span></span>
          <span class="palace-layer palace-layer-support"><span class="palace-layer-label">辅曜</span><span class="minor-stars"><span class="minor-stars-key">${keyMinors.length ? keyMinors.map(minorStarMarkup).join("") : '<span class="star-empty">关键辅曜 —</span>'}</span>${adjectiveSummary.length ? `<span class="minor-stars-extra density-detailed">${adjectiveSummary.map(minorStarMarkup).join("")}</span>` : ""}</span></span>
          <span class="palace-cycles">
            <span class="cycle-row cycle-primary"><span class="cycle-label">大限</span><strong>${palace.decadal.range[0]}–${palace.decadal.range[1]} 岁</strong></span>
            <span class="cycle-row cycle-small-limit density-detailed"><span class="cycle-label">小限</span><span>${escapeHtml((palace.ages || []).join(" "))}</span></span>
            <span class="cycle-row cycle-stage density-detailed"><span class="cycle-label">长生 · 博士</span><span>${escapeHtml(palace.changsheng12 || "—")} · ${escapeHtml(palace.boshi12 || "—")}</span></span>
            <span class="cycle-row cycle-gods density-detailed"><span class="cycle-label">岁前 · 将前</span><span>${escapeHtml(palace.suiqian12 || "—")} · ${escapeHtml(palace.jiangqian12 || "—")}</span></span>
          </span>`;
        button.addEventListener("click", () => selectPalace(palace.index));
        button.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            selectPalace(palace.index);
          }
        });
        elements.chartGrid.appendChild(button);
      });
    selectPalace(state.selectedPalaceIndex);
    renderHoroscope();
    renderConversation();
    renderRecords();
    syncRecordControls();
    notifyView("snapshot");
  }

  function selectPalace(index) {
    state.selectedPalaceIndex = Number(index);
    const relations = palaceRelations(state.snapshot.natal.palaces, state.selectedPalaceIndex);
    const classesByIndex = new Map([
      [relations.target.index, "relation-target"],
      [relations.opposite.index, "relation-opposite"],
      [relations.wealth.index, "relation-wealth"],
      [relations.career.index, "relation-career"],
    ]);
    elements.chartGrid.querySelectorAll(".palace").forEach((node) => {
      const selected = Number(node.dataset.index) === state.selectedPalaceIndex;
      node.classList.remove("relation-target", "relation-opposite", "relation-wealth", "relation-career");
      const relationClass = classesByIndex.get(Number(node.dataset.index));
      if (relationClass) node.classList.add(relationClass);
      node.setAttribute("aria-pressed", String(selected));
    });
    renderCenter();
    renderPalaceDetail();
    renderAiPresetQuestions();
    notifyView("palace");
  }

  function starDetailMarkup(star) {
    const details = [star.brightness, star.mutagen].filter(Boolean).join(" · ");
    return `<span class="${starTypeClass(star)}">${escapeHtml(star.name)}${details ? ` <small>${escapeHtml(details)}</small>` : ""}</span>`;
  }

  function renderPalaceDetail() {
    if (!state.snapshot) return;
    const palace = state.snapshot.natal.palaces[state.selectedPalaceIndex];
    const allAuxiliary = [...palace.minorStars, ...palace.adjectiveStars];
    const relations = palaceRelations(state.snapshot.natal.palaces, state.selectedPalaceIndex);
    elements.palaceDetail.innerHTML = `
      <p><strong>${escapeHtml(palaceDisplayName(palace.name))} · ${escapeHtml(palace.heavenlyStem + palace.earthlyBranch)}</strong>${palace.isBodyPalace ? " · 身宫所在" : ""}</p>
      <div class="detail-block"><strong>三方四正</strong><div class="relation-detail">
        <div class="relation-target"><small>本宫</small><strong>${escapeHtml(palaceDisplayName(relations.target.name))} · ${escapeHtml(relations.target.earthlyBranch)}</strong></div>
        <div class="relation-opposite"><small>对宫</small><strong>${escapeHtml(palaceDisplayName(relations.opposite.name))} · ${escapeHtml(relations.opposite.earthlyBranch)}</strong></div>
        <div class="relation-wealth"><small>财帛位</small><strong>${escapeHtml(palaceDisplayName(relations.wealth.name))} · ${escapeHtml(relations.wealth.earthlyBranch)}</strong></div>
        <div class="relation-career"><small>官禄位</small><strong>${escapeHtml(palaceDisplayName(relations.career.name))} · ${escapeHtml(relations.career.earthlyBranch)}</strong></div>
      </div></div>
      <div class="detail-block"><strong>十四主星</strong><div class="detail-stars">${palace.majorStars.length ? palace.majorStars.map(starDetailMarkup).join("") : "空宫"}</div></div>
      <div class="detail-block"><strong>辅星与杂曜</strong><div class="detail-stars">${allAuxiliary.length ? allAuxiliary.map(starDetailMarkup).join("") : "无"}</div></div>
      <div class="detail-block"><strong>运限与神煞</strong><p>大限 ${palace.decadal.range[0]}–${palace.decadal.range[1]} 虚岁 · ${escapeHtml(palace.decadal.heavenlyStem + palace.decadal.earthlyBranch)}；小限 ${escapeHtml((palace.ages || []).join("、") || "—")}；长生 ${escapeHtml(palace.changsheng12 || "—")}；博士十二神 ${escapeHtml(palace.boshi12 || "—")}；将前 ${escapeHtml(palace.jiangqian12 || "—")}；岁前 ${escapeHtml(palace.suiqian12 || "—")}。</p></div>`;
  }

  function renderHoroscope() {
    elements.chartGrid.querySelectorAll(".palace").forEach((node) => {
      node.classList.remove("current-decadal", "current-yearly");
      delete node.dataset.limitLabel;
    });
    if (!state.horoscope) {
      elements.horoscopeSummary.hidden = true;
      elements.horoscopeSummary.innerHTML = "";
      elements.horoscopeState.textContent = "选择日期后点击按钮，不会自动切换。";
      elements.horoscopeState.className = "horoscope-state";
      renderAiPresetQuestions();
      notifyView("horoscope");
      return;
    }
    const horoscope = state.horoscope;
    elements.horoscopeSummary.hidden = false;
    elements.horoscopeSummary.innerHTML = `
      <div class="metric"><small>虚岁</small><strong>${horoscope.nominalAge}</strong></div>
      <div class="metric"><small>目标农历</small><strong>${escapeHtml(horoscope.targetLunarDate)}</strong></div>
      <div class="metric"><small>当前大限</small><strong>${horoscope.decadal.ageRange[0]}–${horoscope.decadal.ageRange[1]} 岁 · ${escapeHtml(horoscope.decadal.earthlyBranch)}宫</strong></div>
      <div class="metric"><small>流年命宫</small><strong>${escapeHtml(horoscope.yearly.heavenlyStem + horoscope.yearly.earthlyBranch)}</strong></div>
      <div class="metric" style="grid-column:1/-1"><small>流年四化</small><strong>${MUTAGEN_LABELS.map((label) => `${label}·${horoscope.yearly.mutagen[label] || "—"}`).join("　")}</strong></div>`;
    elements.horoscopeState.textContent = `当前固定：${horoscope.targetSolarDate}；修改日期后须再次点击查看。`;
    elements.horoscopeState.className = "horoscope-state";
    const decadalNode = elements.chartGrid.querySelector(`[data-index="${horoscope.decadal.palaceIndex}"]`);
    const yearlyNode = elements.chartGrid.querySelector(`[data-index="${horoscope.yearly.palaceIndex}"]`);
    if (decadalNode) {
      decadalNode.classList.add("current-decadal");
      decadalNode.dataset.limitLabel = "大限";
    }
    if (yearlyNode) {
      yearlyNode.classList.add("current-yearly");
      yearlyNode.dataset.limitLabel = yearlyNode === decadalNode ? "大限 · 流年" : "流年";
    }
    renderAiPresetQuestions();
    notifyView("horoscope");
  }

  function calculateHoroscope() {
    if (aiBusy()) return;
    if (!state.snapshot) return;
    try {
      const horoscope = engine.getHoroscope(state.snapshot, elements.targetDate.value);
      const record = currentRecord();
      if (record) {
        const previous = state.records;
        state.records = previous.map((item) => item.id === record.id ? { ...item, currentHoroscope: clone(horoscope) } : item);
        if (!saveRecords()) { state.records = previous; return; }
      }
      state.horoscope = horoscope;
      state.dirtyHoroscope = false;
      renderHoroscope();
      setStatus(`已固定 ${state.horoscope.targetSolarDate} 的大限与流年。`, "success");
    } catch (error) {
      setStatus(error.message || "运限计算失败。", "error");
    }
  }

  function loadRecords() {
    try {
      return readRecordStorage(localStorage);
    } catch (error) {
      state.storageError = `读取本地记录失败：${error.message}`;
      setStatus(state.storageError, "error");
      return [];
    }
  }

  function saveRecords() {
    try {
      writeRecordStorage(localStorage, state.records);
      state.storageError = "";
      return true;
    } catch (error) {
      state.storageError = `本地存储失败，记录没有被静默截断：${error.message}`;
      setStatus(state.storageError, "error");
      return false;
    }
  }

  function isValidRecord(record) {
    const snapshot = record?.natalSnapshot;
    return Boolean(
      record &&
      record.schemaVersion === 1 &&
      typeof record.id === "string" &&
      typeof record.title === "string" &&
      snapshot?.schemaVersion === 1 &&
      snapshot?.ruleMeta?.engine?.version === "2.5.8" &&
      snapshot?.calendar?.solarDate &&
      Array.isArray(snapshot?.natal?.palaces) &&
      snapshot.natal.palaces.length === 12 &&
      Array.isArray(record.aiHistory) &&
      record.aiHistory.every((turn) =>
        turn &&
        typeof turn.id === "string" &&
        typeof turn.question === "string" &&
        typeof turn.answer === "string" &&
        (turn.horoscopeSnapshot === null || (turn.horoscopeSnapshot && typeof turn.horoscopeSnapshot === "object")),
      ),
    );
  }

  function readRecordStorage(storage) {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("记录根节点不是数组");
    if (parsed.some((record) => !isValidRecord(record))) throw new Error("记录包含无效条目");
    return parsed;
  }

  function writeRecordStorage(storage, records) {
    const serialized = JSON.stringify(records);
    storage.setItem(STORAGE_KEY, serialized);
    if (storage.getItem(STORAGE_KEY) !== serialized) throw new Error("写入后校验不一致");
    return serialized;
  }

  function filterRecords(records, query) {
    const normalized = String(query || "").trim().toLowerCase();
    return records.filter((record) => !normalized || recordSearchText(record).includes(normalized));
  }

  function withoutRecord(records, recordId) {
    return records.filter((record) => record.id !== recordId);
  }

  function withoutTurn(record, turnId) {
    return { ...record, aiHistory: record.aiHistory.filter((turn) => turn.id !== turnId) };
  }

  function createExportBundle(records, exportedAt = new Date().toISOString()) {
    return { schemaVersion: 1, exportedAt, storageKey: STORAGE_KEY, records };
  }

  function mergeImportBundle(records, bundle) {
    if (!bundle || bundle.schemaVersion !== 1 || !Array.isArray(bundle.records)) throw new Error("不是紫微记录 v1 导出文件");
    if (bundle.records.some((record) => !isValidRecord(record))) throw new Error("文件包含格式不完整的记录");
    const merged = new Map(records.map((record) => [record.id, record]));
    let updated = 0;
    for (const record of bundle.records) {
      const existing = merged.get(record.id);
      if (!existing || String(record.updatedAt) > String(existing.updatedAt)) {
        merged.set(record.id, record);
        updated += 1;
      }
    }
    return {
      records: [...merged.values()].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))),
      read: bundle.records.length,
      updated,
    };
  }

  function currentRecord() {
    return state.records.find((record) => record.id === state.currentRecordId) || null;
  }

  function localBirthData() {
    return {
      personLabel: elements.personLabel.value.trim(),
      calendarType: formValue("calendarType"),
      gender: formValue("gender"),
      solarDate: elements.solarDate.value,
      lunarYear: elements.lunarYear.value,
      lunarMonth: elements.lunarMonth.value,
      lunarDay: elements.lunarDay.value,
      isLeapMonth: elements.isLeapMonth.checked,
      birthTime: elements.birthTime.value,
      timeBasis: formValue("timeBasis"),
      useDaylightSaving: $("useDaylightSaving").checked,
      longitude: elements.longitude.value,
      location: state.selectedLocation ? clone(state.selectedLocation) : null,
    };
  }

  function makeRecord(snapshot, existing = null, changed = false) {
    const now = new Date().toISOString();
    return {
      ...existing,
      schemaVersion: 1,
      id: existing?.id || randomId("ziwei"),
      title: elements.personLabel.value.trim() || `${snapshot.calendar.solarDate} 命盘`,
      localBirthData: localBirthData(),
      natalSnapshot: clone(snapshot),
      currentHoroscope: existing && !changed ? existing.currentHoroscope : null,
      aiHistory: existing && !changed ? existing.aiHistory : [],
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      lastOpenedAt: now,
    };
  }

  function createRecordIfNeeded() {
    const existing = currentRecord();
    if (existing) return existing;
    const record = makeRecord(state.snapshot);
    record.currentHoroscope = state.horoscope ? clone(state.horoscope) : null;
    const previous = state.records;
    state.records = [record, ...previous];
    if (!saveRecords()) { state.records = previous; throw new Error(state.storageError); }
    state.currentRecordId = record.id;
    renderRecords();
    syncRecordControls();
    return record;
  }

  function saveCurrentChart() {
    if (aiBusy()) return;
    if (!state.snapshot || state.dirtyBirth) { setStatus("请先点击排盘，确认当前出生资料后再保存。", "error"); return; }
    try { createRecordIfNeeded(); setStatus("当前命盘已保存到本地记录。", "success"); }
    catch (error) { setStatus(error.message, "error"); }
  }

  function anonymousNatal(snapshot) {
    return {
      schemaVersion: snapshot.schemaVersion,
      engine: {
        name: snapshot.ruleMeta.engine.name,
        version: snapshot.ruleMeta.engine.version,
        sourceCommit: snapshot.ruleMeta.engine.sourceCommit,
      },
      rules: clone(snapshot.ruleMeta.rules),
      calendar: {
        sexagenary: snapshot.calendar.sexagenary,
        timeLabel: snapshot.calendar.timeLabel,
      },
      natal: clone(snapshot.natal),
    };
  }

  function normalizeAiMode(value) {
    return Object.hasOwn(AI_MODE_GUIDES, value) ? value : "comprehensive";
  }

  function aiModeLabel(value) {
    return AI_MODE_GUIDES[normalizeAiMode(value)].split("：")[0];
  }

  function aiModeGuide(value, includesHoroscope) {
    const mode = normalizeAiMode(value);
    if (includesHoroscope) return AI_MODE_GUIDES[mode];
    return {
      comprehensive: "综合总览：从整张本命盘提炼最重要的结构，并兼顾事业、财富、关系与身心倾向；不要推断未提供的运限。",
      natal: "本命结构：重点说明稳定底色、优势、制约和三方四正；不要推断未提供的运限。",
      career: "事业发展：以官禄相关结构为观察重点，同时合参命、财、迁等关联宫位；不要推断未提供的运限。",
      wealth: "财富方式：以财帛相关结构为观察重点，同时合参取得方式、承载条件与风险；不要推断未提供的运限。",
      relationship: "感情关系：以夫妻相关结构为观察重点，同时合参命盘整体关系模式；不要推断未提供的运限。",
      wellbeing: AI_MODE_GUIDES.wellbeing,
      conclusion: AI_MODE_GUIDES.conclusion,
    }[mode] || AI_MODE_GUIDES[mode];
  }

  function starEvidenceText(star) {
    return [star.name, star.brightness, star.mutagen].filter(Boolean).join("/");
  }

  function starsEvidenceText(stars) {
    return stars.length ? stars.map(starEvidenceText).join("、") : "—";
  }

  function natalStarPalace(snapshot, starName) {
    return snapshot.natal.palaces.find((palace) => [...palace.majorStars, ...palace.minorStars, ...palace.adjectiveStars].some((star) => star.name === starName)) || null;
  }

  function scopeStarPlacements(scope) {
    const placements = [];
    (scope.stars || []).forEach((stars, index) => {
      for (const star of stars) placements.push(`${scope.palaceNames[index] || `第${index + 1}宫`}:${starEvidenceText(star)}`);
    });
    return placements.join("；") || "—";
  }

  function scopePalaceMapping(scope, palaces) {
    return palaces.map((palace) => {
      const evidenceId = `P${String(palace.index + 1).padStart(2, "0")}`;
      return `${palaceDisplayName(scope.palaceNames[palace.index])}→本命${palaceDisplayName(palace.name)}(${palace.heavenlyStem}${palace.earthlyBranch},${evidenceId})`;
    }).join("；");
  }

  function focalPalaceName(mode) {
    return {
      career: "官禄",
      wealth: "财帛",
      relationship: "夫妻",
      wellbeing: "疾厄",
    }[normalizeAiMode(mode)] || null;
  }

  function buildAiEvidence(snapshot, horoscope, selectedPalaceIndex, requestedMode) {
    const palaces = [...snapshot.natal.palaces].sort((a, b) => a.index - b.index);
    const selected = palaces.find((palace) => palace.index === Number(selectedPalaceIndex)) || palaces.find((palace) => palace.name === "命宫") || palaces[0];
    const relations = palaceRelations(palaces, selected.index);
    const entries = [];
    const add = (id, layer, fact, palaceIndex = null) => entries.push({ id, layer, fact, palaceIndex });
    const birthMutagen = MUTAGEN_LABELS.map((label) => `${label}:${snapshot.natal.birthMutagen[label] || "—"}`).join("、");
    add("N01", "本命总览", `命宫地支:${snapshot.natal.soulPalace}；身宫地支:${snapshot.natal.bodyPalace}；五行局:${snapshot.natal.fiveElementsClass}；命主:${snapshot.natal.soulStar}；身主:${snapshot.natal.bodyStar}；生年四化:${birthMutagen}；四柱干支:${snapshot.calendar.sexagenary}`);
    for (const palace of palaces) {
      const id = `P${String(palace.index + 1).padStart(2, "0")}`;
      const flags = [palace.earthlyBranch === snapshot.natal.soulPalace ? "命宫" : "", palace.isBodyPalace ? "身宫" : "", palace.isOriginalPalace ? "来因宫" : ""].filter(Boolean).join("、") || "无";
      add(id, "本命宫位", `${palaceDisplayName(palace.name)}；宫干支:${palace.heavenlyStem}${palace.earthlyBranch}；标记:${flags}；主星:${starsEvidenceText(palace.majorStars)}；辅星:${starsEvidenceText(palace.minorStars)}；杂曜:${starsEvidenceText(palace.adjectiveStars)}；本宫大限:${palace.decadal.range[0]}-${palace.decadal.range[1]}岁；小限:${(palace.ages || []).join("、") || "—"}；长生:${palace.changsheng12 || "—"}；博士:${palace.boshi12 || "—"}；岁前:${palace.suiqian12 || "—"}；将前:${palace.jiangqian12 || "—"}`, palace.index);
    }
    add("R01", "所选三方四正", `当前查看:${palaceDisplayName(relations.target.name)}；对宫:${palaceDisplayName(relations.opposite.name)}；三合位:${palaceDisplayName(relations.wealth.name)}、${palaceDisplayName(relations.career.name)}。所选宫位只是当前观察焦点，不限制全盘分析。`, selected.index);
    const focalName = focalPalaceName(requestedMode);
    const focal = focalName && palaces.find((palace) => palace.name === focalName);
    if (focal && focal.index !== selected.index) {
      const focalRelations = palaceRelations(palaces, focal.index);
      add("R02", "主题三方四正", `分析主题:${aiModeLabel(requestedMode)}；本宫:${palaceDisplayName(focalRelations.target.name)}；对宫:${palaceDisplayName(focalRelations.opposite.name)}；三合位:${palaceDisplayName(focalRelations.wealth.name)}、${palaceDisplayName(focalRelations.career.name)}。`, focal.index);
    }
    for (const [id, label, leftName, rightName] of NATAL_AXES) {
      const left = palaces.find((palace) => palace.name === leftName);
      const right = palaces.find((palace) => palace.name === rightName);
      const evidenceId = (palace) => `P${String(palace.index + 1).padStart(2, "0")}`;
      add(id, "本命对宫轴", `${label}:${palaceDisplayName(left.name)}(${left.heavenlyStem}${left.earthlyBranch},${evidenceId(left)})↔${palaceDisplayName(right.name)}(${right.heavenlyStem}${right.earthlyBranch},${evidenceId(right)})；两宫互为对宫。`);
    }
    if (horoscope) {
      add("D01", "大限总览", `目标日期:${horoscope.targetSolarDate}；虚岁:${horoscope.nominalAge}；当前大限:${horoscope.decadal.ageRange[0]}-${horoscope.decadal.ageRange[1]}岁；大限命宫:${palaceDisplayName(horoscope.decadal.palaceName)}；宫干支:${horoscope.decadal.heavenlyStem}${horoscope.decadal.earthlyBranch}`, horoscope.decadal.palaceIndex);
      add("Y01", "流年总览", `目标日期:${horoscope.targetSolarDate}；目标农历:${horoscope.targetLunarDate}；流年命宫:${palaceDisplayName(horoscope.yearly.palaceName)}；宫干支:${horoscope.yearly.heavenlyStem}${horoscope.yearly.earthlyBranch}`, horoscope.yearly.palaceIndex);
      for (const [prefix, label, scope] of [["D", "大限四化", horoscope.decadal], ["Y", "流年四化", horoscope.yearly]]) {
        MUTAGEN_LABELS.forEach((mutagen, index) => {
          const starName = scope.mutagen[mutagen] || "—";
          const palace = natalStarPalace(snapshot, starName);
          add(`${prefix}${String(index + 2).padStart(2, "0")}`, label, `${mutagen}:${starName}${palace ? `；本命落点:${palaceDisplayName(palace.name)}(${palace.heavenlyStem}${palace.earthlyBranch})` : "；本命落点:未在冻结盘中找到"}`, palace?.index ?? null);
        });
        add(`${prefix}06`, label.replace("四化", "流曜"), scopeStarPlacements(scope));
        add(`${prefix}07`, label.replace("四化", "十二宫映射"), scopePalaceMapping(scope, palaces));
      }
    }
    return {
      selectedPalace: palaceDisplayName(selected.name),
      targetDate: horoscope?.targetSolarDate || null,
      includesHoroscope: Boolean(horoscope),
      entries,
      references: entries.map(({ id, layer, fact, palaceIndex }) => ({ id, label: layer, fact, palaceIndex })),
    };
  }

  function buildAiMessages(question, history, snapshot, horoscope, selectedPalaceIndex, requestedMode, requestedStyle) {
    const mode = normalizeAiMode(requestedMode);
    const style = normalizeAiStyle(requestedStyle);
    const styleGuide = `解读方式：${aiStyleLabel(style)}。${AI_STYLE_GUIDES[style][1]}`;
    const evidence = buildAiEvidence(snapshot, horoscope, selectedPalaceIndex, mode);
    const anonymous = anonymousNatal(snapshot);
    const context = {
      analysisMode: { id: mode, guide: aiModeGuide(mode, Boolean(horoscope)) },
      readingStyle: { id: style, guide: styleGuide },
      analysisScope: horoscope ? "本命＋已选大限＋已选流年" : "仅本命；未提供大限与流年，不得推断运限",
      frozenMeta: { engine: anonymous.engine, rules: anonymous.rules },
      evidenceCatalog: evidence.entries,
    };
    const messages = [
      { role: "system", content: `${SYSTEM_PROMPT}\n本次输出篇幅与展开程度遵循：${styleGuide} 六个标题及证据规则始终保留，详断/逐宫细断可突破默认每段 2–3 句。方向与方式不限制用户同时询问多个生活领域。${!horoscope ? "未提供运限：即使问题要求应期，也不得推断任何未提供的大限、流年、流月或流日。" : ""}` },
      { role: "user", content: `以下是按重要层级整理的冻结证据目录（JSON）。目录包含本命十二宫完整星曜、三方四正和六组对宫轴；选择运限时还包含大限、流年的完整十二宫映射、四化与流曜。不要重新排盘：\n${JSON.stringify(context)}` },
      { role: "assistant", content: horoscope ? "我会从整张命盘提炼主线，按本命—大限—流年合参，正文用白话写，证据编号只放在最后的依据里。" : "我会只依据本命冻结证据提炼主线，不推断未提供的大限和流年；正文用白话写，证据编号只放在最后的依据里。" },
    ];
    for (const turn of history) {
      const priorMeta = [turn.mode ? `模式:${turn.mode}` : "", turn.style ? `解读方式:${aiStyleLabel(turn.style)}` : "", turn.horoscopeSnapshot?.targetSolarDate ? `当时目标日期:${turn.horoscopeSnapshot.targetSolarDate}` : ""].filter(Boolean).join("；");
      messages.push({ role: "user", content: `${priorMeta ? `历史追问（${priorMeta}）\n` : ""}${turn.question}` });
      messages.push({ role: "assistant", content: `历史回答仅用于保持对话语义，不能把其中证据编号当作本次证据：\n${turn.answer.replace(/\[[A-Z]\d{2}\]/g, "")}` });
    }
    messages.push({ role: "user", content: `本次分析模式：${aiModeGuide(mode, Boolean(horoscope))}\n当前查看宫位：${evidence.selectedPalace}（只是观察焦点，不限制全盘）\n${horoscope ? `已选运限：${evidence.targetDate}` : "未选择运限：只分析本命；“重点关注”须写明未提供运限，不能推断。"}\n用户问题：${question}\n请先完成内部核对，再严格按六个标题用白话输出；正文不写证据编号，编号只放在“依据”；不要复述整份数据。` });
    messages[messages.length - 1].content += `\n${styleGuide}`;
    return messages;
  }

  function aiPresetQuestions(snapshot, horoscope, selectedPalaceIndex, requestedMode) {
    if (!snapshot) return [];
    const mode = normalizeAiMode(requestedMode);
    const palace = snapshot.natal.palaces.find((item) => item.index === Number(selectedPalaceIndex));
    const palaceName = palace ? palaceDisplayName(palace.name) : "所选宫位";
    return {
      comprehensive: [
        horoscope ? "请从整张命盘提炼最重要的三项结构，综合说明事业、财富、关系与当前运限。" : "请从整张命盘提炼最重要的三项结构，综合说明事业、财富、关系与身心倾向。",
        "请把全盘的优势与制约放在一起比较，说明最值得发挥和最需留意的各是什么。",
        horoscope ? "当前大限给整张命盘带来的核心主题是什么？哪些生活领域会相互牵动？" : "请找出本命中最重要的两组相互支持结构，说明需要哪些现实条件才能发挥。",
        horoscope ? "当前流年应优先关注哪些领域？请按重要性排序，并区分机会、风险和触发条件。" : "请从本命盘找出最需留意的制约结构，说明它可能怎样影响现实选择。",
        `请结合${palaceName}及其三方四正，解释这个宫位在整张命盘中的作用，别只看单宫。`,
        "请综合各领域给我三条现实建议，并指出整盘结论中仍需核对的不确定之处。",
      ],
      natal: [
        "请只从本命结构分析我的稳定底色、主要优势、核心制约和现实兑现条件。",
        "命宫、身宫和命迁轴怎样共同体现性格与做事方式？请同时说明优点和代价。",
        "本命的生年四化分别落在哪些生活领域？哪些动力和牵挂可能长期反复出现？",
        "请合参六组对宫轴，找出本命中最重要的两组张力，说明怎样取得平衡。",
        `请从本命角度解释${palaceName}与三方四正的组合，不借未来年份替它下结论。`,
        "哪些本命优势需要环境配合才能兑现？请列出可用经历核对的条件，避免只贴性格标签。",
      ],
      career: [
        horoscope ? "请合参本命与当前运限，分析事业发展的主线、可发挥的优势和需要付出的代价。" : "请合参本命的命、官、财、迁，分析事业发展的主线、优势和代价。",
        "从官禄宫及其关联结构看，我更适合怎样的工作方式、职责和组织环境？不要武断指定职业。",
        "事业上哪些能力更值得长期积累？哪些沟通、合作或执行习惯可能拖后腿？",
        horoscope ? "当前大限与流年对事业的支持和压力分别是什么？考虑变动前应先核对哪些现实条件？" : "本命中哪些条件有助于事业变动，哪些因素更支持稳定积累？请给出判断依据。",
        "工作中的收入、外部机会与合作关系如何相互影响？请不要只凭官禄单宫判断事业。",
        `若把${palaceName}作为补充观察点，它对事业路线有什么提示？请给出三条可执行的工作建议。`,
      ],
      wealth: [
        horoscope ? "请合参本命与当前运限，分析财富取得方式、积累条件和主要风险，不作收益保证。" : "请从本命财帛、福德、官禄与田宅的联系，分析财富取得方式和积累条件。",
        "财帛宫及其三方四正更支持怎样的赚钱方式？请区分能力所得、合作资源与额外风险。",
        "从财福轴看，我在消费、储蓄和金钱安全感上可能有哪些倾向？哪些需要现实核对？",
        horoscope ? "当前大限和流年在收入、支出与资金安排上有哪些支持或制约？不推断确定赚赔。" : "本命中影响守财与资金承载能力的主要结构是什么？请同时说明支持和制约。",
        "事业收入、家庭资产与人情合作可能怎样相互牵动？请指出应先厘清的责任和边界。",
        `结合${palaceName}对财富议题的关联，给出三条财务习惯与风险管理建议，不推荐具体投资。`,
      ],
      relationship: [
        horoscope ? "请结合本命与当前运限，解释关系模式、情感需求和相处中最值得关注的主题。" : "请从本命夫妻宫、命宫与福德宫的联系，解释关系模式和情感需求。",
        "夫妻宫与夫官轴呈现怎样的相处需求和事业关系平衡？不要据此断言婚姻必然好坏。",
        "在亲密关系中，我可能如何表达关心、处理分歧？哪些优点容易在压力下变成负担？",
        horoscope ? "当前大限和流年对关系沟通有哪些支持、压力与触发条件？不推断必婚、必离或对方想法。" : "本命中哪些关系摩擦可能反复出现？请说明成立条件，而不是给伴侣贴标签。",
        "家庭、金钱、社交与工作安排，哪些更可能牵动关系？请说明适合提前沟通的边界。",
        `把${palaceName}作为补充，给出三条改善相处的实际做法，并指出仍需双方沟通确认的部分。`,
      ],
      wellbeing: [
        "请只从传统盘面解释压力与生活状态倾向，不作医学诊断，不推断具体疾病。",
        "福德、疾厄与命宫的关联，能提供哪些关于休息、情绪负担和生活节奏的观察线索？",
        "哪些工作、关系或家庭责任可能成为压力来源？请说明盘面条件，避免把压力等同疾病。",
        horoscope ? "当前大限与流年中，有哪些生活负担或节奏变化值得留意？只谈观察与调适，不作健康预测。" : "本命中有哪些容易透支或反复操心的倾向？请给出可在日常生活中核对的表现。",
        "命盘中哪些支持结构可能有助于恢复与调节？请转化为休息、沟通和寻求支持的建议。",
        `结合${palaceName}与身心议题的关联，区分可参考的生活建议和术数无法判断、应咨询专业人士的问题。`,
      ],
      decadal: [
        "请说明当前十年大限的核心主线，并解释本命的哪些条件能承接、哪些条件会制约它。",
        "大限命宫及其三方四正把重点放在哪些生活领域？请按重要性排序，不作逐星罗列。",
        "大限四化把资源、责任、表现与牵挂带到哪里？请连同化星和所在宫位解释。",
        "当前大限与本命有哪些相互支持或抵牾的结构？哪些看似机会的事也伴随代价？",
        "已选流年怎样承接或触发当前大限？请区分十年的稳定主题和这一年的短期重点。",
        `结合${palaceName}在本命中的基础作用，为当前大限提出三条阶段性安排，并说明需现实验证的条件。`,
      ],
      yearly: [
        "请综合本命、大限与指定流年，给出这一年最值得关注的三件事，区分机会与压力。",
        "指定流年的命宫及其三方四正，将注意力引向哪些生活领域？不要脱离本命承载条件。",
        "流年四化分别触动哪些宫位和化星？请说明支持、制约与可能的现实观察点。",
        "这一年的事业、财富和关系重点怎样相互牵动？哪些选择需要先处理资源或责任冲突？",
        "请找出指定流年主要判断的反向证据，说明哪些条件不成立时应降低判断信心。",
        `结合${palaceName}的本命基础，给出指定流年的行动优先级；未提供流月流日，不推断具体月日。`,
      ],
      conclusion: [
        "请用白话概括全盘最重要的一个结论，说明它为何值得优先关注。",
        "请各用一句话说明命盘中最能发挥的优势和最需管理的代价。",
        "如果只抓三个生活重点，应怎样排列优先级？请保留简短依据。",
        horoscope ? "请用简短结论区分当前大限主线与指定流年的触发重点。" : "请仅从本命给出简短建议，不推断尚未提供的运限。",
        `关于${palaceName}，最值得记住的一条提醒是什么？请避免孤立判断。`,
        "请给出现在能做的一项行动，并说明这个建议的适用条件和不确定性。",
      ],
    }[mode];
  }

  function renderAiPresetQuestions() {
    const questions = aiPresetQuestions(state.snapshot, state.horoscope, state.selectedPalaceIndex, elements.aiMode.value);
    const disabled = !state.snapshot || (!state.horoscope && (["decadal", "yearly"].includes(normalizeAiMode(elements.aiMode.value)) || normalizeAiStyle(elements.aiStyle.value) === "timing"));
    elements.aiPresetQuestions.innerHTML = questions.map((question, index) => `<button type="button" data-ai-preset="${index}"${disabled ? ' disabled title="该分析模式需要先查看目标运限"' : ""}>${escapeHtml(question.replace(/[？。]$/, ""))}</button>`).join("");
    elements.aiPresetQuestions.querySelectorAll("[data-ai-preset]").forEach((button) => {
      button.addEventListener("click", () => {
        elements.aiQuestion.value = questions[Number(button.dataset.aiPreset)] || "";
        elements.aiQuestion.focus();
      });
    });
  }

  function extractAiAnswer(body) {
    return window.DeepSeekClient.extractAnswer(body);
  }

  // 把模型常见的格式偏差先规范化：全角括号、### / **标题** / “1. 标题”、依据里的裸编号。
  function normalizeAiAnswer(answer) {
    const headings = [...REQUIRED_AI_SECTIONS, "总论", "关键结构", "本命基础", "运限合参", "支持与制约", "现实观察", "不确定边界"];
    const headingRe = new RegExp(`^\\s*(?:#{1,4}\\s*)?(?:\\*\\*)?\\s*(?:[一二三四五六七八九十\\d]+[.、)）]\\s*)?(?:\\*\\*)?\\s*(${headings.join("|")})(?:（[^）]*）|\\([^)]*\\))?\\s*(?:\\*\\*)?\\s*[：:]?\\s*(?:\\*\\*)?\\s*$`);
    let inBasis = false;
    return String(answer || "")
      .replace(/[【［\[]\s*([NPRDY]\d{2})\s*[】］\]]/g, "[$1]")
      .split(/\r?\n/)
      .map((line) => {
        const heading = line.match(headingRe);
        if (heading) { inBasis = heading[1] === "依据"; return `## ${heading[1]}`; }
        if (/^\s*#{1,4}\s+/.test(line)) inBasis = false;
        return inBasis ? line.replace(/(^|[^[A-Z\d])([NPRDY]\d{2})(?![\d\]])/g, "$1[$2]") : line;
      })
      .join("\n");
  }

  function aiSectionBody(answer, section) {
    const lines = String(answer).split(/\r?\n/);
    const start = lines.findIndex((line) => new RegExp(`^#{2,3}\\s*${section}\\s*$`).test(line.trim()));
    if (start < 0) return "";
    const next = lines.findIndex((line, index) => index > start && /^#{2,3}\s+/.test(line.trim()));
    return lines.slice(start + 1, next < 0 ? lines.length : next).join("\n");
  }

  // 硬性：引用不存在的编号、整篇没有任何编号 → 拒绝。其余只是格式/依据不全 → 重写一次，仍不全就带“仅供参考”标记显示并保存。
  function validateAiAnswer(rawAnswer, evidence) {
    const answer = normalizeAiAnswer(rawAnswer);
    const hardErrors = [];
    const softErrors = [];
    const ids = (text) => [...new Set([...String(text).matchAll(/\[([A-Z]\d{2})\]/g)].map((match) => match[1]))];
    const basis = aiSectionBody(answer, "依据");
    const basisFor = (section) => ids(basis.split(/\r?\n/).filter((line) => line.includes(section)).join(" "));
    const validIds = new Set(evidence.references.map((item) => item.id));
    const references = ids(answer);
    const invalid = references.filter((id) => !validIds.has(id));
    if (invalid.length) hardErrors.push(`引用了不存在的证据 ${invalid.join("、")}`);
    if (!references.length) hardErrors.push("没有任何可核对的依据编号");
    for (const section of REQUIRED_AI_SECTIONS) {
      if (!new RegExp(`^##\\s*${section}\\s*$`, "m").test(answer)) softErrors.push(`缺少“${section}”`);
    }
    if (!aiSectionBody(answer, "一句话总结").trim()) softErrors.push("一句话总结为空");
    if (references.length && references.length < 5) softErrors.push("可核对证据少于 5 项");
    if (!references.some((id) => /^[NPR]/.test(id))) softErrors.push("缺少本命证据");
    if (evidence.includesHoroscope && !references.some((id) => id.startsWith("D"))) softErrors.push("缺少大限证据");
    if (evidence.includesHoroscope && !references.some((id) => id.startsWith("Y"))) softErrors.push("缺少流年证据");
    if (basis && (!basisFor("顺的地方").length || !basisFor("要留意的").length)) softErrors.push("顺的地方与要留意的没有各自的依据");
    const errors = [...hardErrors, ...softErrors];
    return { valid: errors.length === 0, hard: hardErrors.length > 0, errors, hardErrors, softErrors, references, answer };
  }

  // 白话渲染：正文去掉行内证据编号（旧回答也一样），**加粗**正常显示，编号统一收进可展开的“依据”。
  function renderAiAnswer(answer, references) {
    const referenceMap = new Map((references || []).map((item) => [item.id, item]));
    const cited = [];
    const cite = (id) => { if (!cited.includes(id)) cited.push(id); };
    const refButton = (id) => {
      const reference = referenceMap.get(id);
      if (!reference) return `<span class="evidence-ref static">[${escapeHtml(id)}]</span>`;
      const label = escapeHtml(`${reference.label} ${id}`);
      if (reference.palaceIndex == null) return `<span class="evidence-ref static" title="${label}">[${id}]</span>`;
      return `<button class="evidence-ref" type="button" data-evidence-palace="${reference.palaceIndex}" title="定位到${label}" aria-label="定位到${label}">[${id}]</button>`;
    };
    const stripTags = (text) => String(text)
      .replace(/[（(]\s*((?:\[[A-Z]\d{2}\][\s、，,;；]*)+)[）)]/g, (match, group) => { [...group.matchAll(/\[([A-Z]\d{2})\]/g)].forEach((m) => cite(m[1])); return ""; })
      .replace(/\s*\[([A-Z]\d{2})\]/g, (match, id) => { cite(id); return ""; })
      .replace(/\s+([；;，,。．.、])/g, "$1")
      .replace(/([；;，,、])\s*(?=[。．.])/g, "");
    const md = (text) => escapeHtml(stripTags(text)).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/__(.+?)__/g, "<strong>$1</strong>").replace(/\*\*/g, "");
    const lines = String(answer).split(/\r?\n/);
    const basisAt = lines.findIndex((line) => /^#{2,3}\s*依据\s*$/.test(line.trim()));
    const bodyLines = basisAt < 0 ? lines : lines.slice(0, basisAt);
    const basisLines = basisAt < 0 ? [] : lines.slice(basisAt + 1).filter((line) => line.trim());
    const body = bodyLines.map((line) => {
      const trimmed = line.trim();
      if (/^(-{3,}|\*{3,})$/.test(trimmed)) return "";
      const heading = trimmed.match(/^#{1,4}\s+(.+)$/);
      if (heading) return `<h3>${md(heading[1].replace(/\*\*/g, ""))}</h3>`;
      const bullet = trimmed.match(/^[-*•]\s+(.+)$/);
      if (bullet) return `<div class="ai-answer-bullet">${md(bullet[1])}</div>`;
      const numbered = trimmed.match(/^(\d{1,2})[.、)]\s*(.+)$/);
      if (numbered) return `<div class="ai-answer-num"><b>${numbered[1]}</b><span>${md(numbered[2])}</span></div>`;
      if (!trimmed) return '<span class="ai-answer-space" aria-hidden="true"></span>';
      return `<p>${md(trimmed.replace(/^>\s*/, ""))}</p>`;
    }).join("");
    const basisMarkup = basisLines.map((line) => {
      const text = line.trim().replace(/^[-*•]\s+/, "");
      [...text.matchAll(/\[([A-Z]\d{2})\]/g)].forEach((m) => cite(m[1]));
      return `<div class="ai-basis-line">${escapeHtml(text.replace(/\*\*/g, "")).replace(/\[([A-Z]\d{2})\]/g, (match, id) => refButton(id))}</div>`;
    }).join("");
    if (!cited.length && !basisMarkup) return body;
    const list = cited.map((id) => {
      const reference = referenceMap.get(id);
      const fact = reference?.fact ? String(reference.fact) : "";
      return `<li>${refButton(id)}<span>${escapeHtml(reference?.label || "未知编号")}</span>${fact ? `<small>${escapeHtml(fact.length > 180 ? `${fact.slice(0, 180)}…` : fact)}</small>` : ""}</li>`;
    }).join("");
    return `${body}<details class="ai-basis"><summary>依据（点开核对）<small>${cited.length} 条</small></summary>${basisMarkup ? `<div class="ai-basis-map">${basisMarkup}</div>` : ""}${list ? `<ul class="ai-basis-list">${list}</ul>` : ""}</details>`;
  }

  async function requestAiCompletion(messages) {
    const apiKey = elements.apiKey.value.trim();
    const result = await window.DeepSeekClient.requestFinal({
      apiKey,
      messages,
      maxTokens: 16384,
      onRetry() { elements.aiState.textContent = "思考已完成，正在获取最终回答…"; },
    });
    return result.answer;
  }

  async function askAi(question) {
    const apiKey = elements.apiKey.value.trim();
    if (!apiKey) throw new Error("请先填写并保存 DeepSeek API Key。");
    if (!state.snapshot) throw new Error("请先排出本命盘。");
    if (state.dirtyBirth) throw new Error("出生资料已修改，请先更新命盘，再进行 AI 解读。");
    const mode = normalizeAiMode(elements.aiMode.value);
    const style = normalizeAiStyle(elements.aiStyle.value);
    const horoscope = state.horoscope;
    if (!horoscope && ["decadal", "yearly"].includes(mode)) throw new Error("当前分析模式需要先选择目标日期并点击“查看运限”。");
    if (!horoscope && style === "timing") throw new Error("“运限重点”需要先选择目标日期并点击“查看运限”。");
    const record = createRecordIfNeeded();
    const evidence = buildAiEvidence(state.snapshot, horoscope, state.selectedPalaceIndex, mode);
    const messages = buildAiMessages(question, record.aiHistory, state.snapshot, horoscope, state.selectedPalaceIndex, mode, style);
    let answer = await requestAiCompletion(messages);
    let validation = validateAiAnswer(answer, evidence);
    if (!validation.valid) {
      elements.aiState.textContent = "回答格式不完整，正在请 AI 按格式重写一次…";
      const retry = await requestAiCompletion([...messages, { role: "assistant", content: answer }, { role: "user", content: `上面的草稿未通过本地校验：${validation.errors.join("；")}。请不要增加任何新事实，重新严格按六个标题用白话输出，正文不写证据编号，并在“## 依据”里按示例逐行列出编号，只引用证据目录中的编号。` }]);
      const retried = validateAiAnswer(retry, evidence);
      // 重写后若更差（出现硬性问题）而原稿只是格式问题，就保留原稿。
      if (!retried.hard || validation.hard) { answer = retry; validation = retried; }
    }
    if (validation.hard) throw new Error(`AI 回答引用了无法核对的依据（${validation.hardErrors.join("；")}），已拒绝保存，请重新提问。`);
    answer = validation.answer;
    const now = new Date().toISOString();
    const turn = {
      id: randomId("turn"),
      question,
      answer,
      mode,
      style,
      model: AI_MODEL,
      createdAt: now,
      horoscopeSnapshot: horoscope ? clone(horoscope) : null,
      evidenceRefs: clone(evidence.references),
    };
    if (!validation.valid) turn.formatWarning = validation.softErrors.slice(0, 6);
    record.aiHistory.push(turn);
    record.currentHoroscope = horoscope ? clone(horoscope) : null;
    record.updatedAt = now;
    if (!saveRecords()) {
      record.aiHistory.pop();
      throw new Error(state.storageError);
    }
    return turn;
  }

  function renderConversation() {
    const record = currentRecord();
    const history = record?.aiHistory || [];
    if (!history.length) {
      elements.conversation.innerHTML = '<p class="privacy-note">还没有问答。回答会按当时本命盘与已选运限冻结，不随以后切换年份而改变。</p>';
      return;
    }
    elements.conversation.innerHTML = history.map((turn, index) => `
      <details class="turn" data-turn-id="${escapeHtml(turn.id)}" ${state.collapsedTurns.has(`${record.id}:${turn.id}`) ? "" : "open"}>
        <summary class="turn-question"><span class="turn-heading"><b>第 ${index + 1} 问</b><span class="turn-toggle"></span><button class="text-button turn-delete" type="button" data-delete-turn="${escapeHtml(turn.id)}">删除</button></span><small>${escapeHtml(turn.mode ? `解读方向 · ${aiModeLabel(turn.mode)} · ` : "问题 · ")}${escapeHtml(turn.style ? `${aiStyleLabel(turn.style)} · ` : "")}${escapeHtml(turn.horoscopeSnapshot?.targetSolarDate || "未选运限")}</small><strong>${escapeHtml(turn.question)}</strong></summary>
        <div class="turn-answer"><small>${escapeHtml(turn.model)} · ${escapeHtml(formatDateTime(turn.createdAt))}</small>${Array.isArray(turn.formatWarning) && turn.formatWarning.length ? `<p class="ai-format-note" title="${escapeHtml(turn.formatWarning.join("；"))}">未完全按格式/依据不全，仅供参考</p>` : ""}${renderAiAnswer(normalizeAiAnswer(turn.answer), turn.evidenceRefs)}</div>
      </details>`).join("");
    elements.conversation.querySelectorAll("details[data-turn-id]").forEach((details) => {
      details.addEventListener("toggle", () => {
        const key = `${record.id}:${details.dataset.turnId}`;
        if (details.open) state.collapsedTurns.delete(key);
        else state.collapsedTurns.add(key);
      });
    });
    elements.conversation.querySelectorAll("[data-delete-turn]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        deleteTurn(button.dataset.deleteTurn);
      });
    });
    elements.conversation.querySelectorAll("[data-evidence-palace]").forEach((button) => {
      button.addEventListener("click", () => {
        const palaceIndex = Number(button.dataset.evidencePalace);
        if (!state.snapshot || !Number.isInteger(palaceIndex)) return;
        selectPalace(palaceIndex);
        const palaceButton = elements.chartGrid.querySelector(`[data-index="${palaceIndex}"]`);
        if (palaceButton) {
          palaceButton.focus();
          palaceButton.scrollIntoView({ block: "center" });
        }
      });
    });
  }

  function deleteTurn(turnId) {
    const record = currentRecord();
    if (!record || !window.confirm("确定删除这条问答？该操作无法撤销。")) return;
    const previous = clone(record);
    Object.assign(record, withoutTurn(record, turnId));
    record.updatedAt = new Date().toISOString();
    if (!saveRecords()) Object.assign(record, previous);
    renderConversation();
    renderRecords();
  }

  function recordSearchText(record) {
    return [record.title, record.localBirthData?.personLabel, ...(record.aiHistory || []).flatMap((turn) => [turn.question, turn.answer])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }

  function renderRecords() {
    const query = elements.recordSearch.value.trim().toLowerCase();
    const records = filterRecords(state.records, query);
    if (!records.length) {
      elements.recordList.innerHTML = `<p class="privacy-note">${query ? "没有匹配记录。" : "勾选“排盘后保存”或点击“保存命盘”后，命盘会显示在这里。"}</p>`;
      return;
    }
    elements.recordList.innerHTML = records.map((record) => `
      <article class="record-item${record.id === state.currentRecordId ? " current" : ""}">
        <h3 class="record-title">${escapeHtml(record.title)}</h3>
        <p class="record-meta">${escapeHtml(record.natalSnapshot.calendar.solarDate)} · ${record.aiHistory.length} 条问答 · ${escapeHtml(formatDateTime(record.updatedAt))}</p>
        <div class="record-actions">
          <button class="button" type="button" data-open-record="${escapeHtml(record.id)}">重新打开</button>
          <button class="button danger" type="button" data-delete-record="${escapeHtml(record.id)}">删除命盘</button>
        </div>
      </article>`).join("");
    elements.recordList.querySelectorAll("[data-open-record]").forEach((button) => button.addEventListener("click", () => openRecord(button.dataset.openRecord)));
    elements.recordList.querySelectorAll("[data-delete-record]").forEach((button) => button.addEventListener("click", () => deleteRecord(button.dataset.deleteRecord)));
  }

  function populateBirthForm(data) {
    elements.personLabel.value = data.personLabel || "";
    elements.birthForm.elements.gender.value = data.gender || "male";
    elements.birthForm.elements.calendarType.value = data.calendarType || "solar";
    elements.solarDate.value = data.solarDate || "";
    elements.lunarYear.value = data.lunarYear || "";
    elements.lunarMonth.value = data.lunarMonth || "";
    elements.lunarDay.value = data.lunarDay || "";
    elements.isLeapMonth.checked = Boolean(data.isLeapMonth);
    elements.birthTime.value = data.birthTime || "";
    elements.birthForm.elements.timeBasis.value = data.timeBasis || "beijing";
    $("useDaylightSaving").checked = Boolean(data.useDaylightSaving);
    selectLocation(normalizeStoredLocation(data), false);
    syncConditionalFields();
  }

  function openRecord(recordId) {
    if (aiBusy()) return;
    const record = state.records.find((item) => item.id === recordId);
    if (!record) return;
    state.currentRecordId = record.id;
    state.snapshot = record.natalSnapshot;
    state.horoscope = record.currentHoroscope || null;
    state.selectedPalaceIndex = state.snapshot.natal.palaces.find((palace) => palace.name === "命宫")?.index ?? 0;
    state.dirtyBirth = false;
    state.dirtyHoroscope = false;
    record.lastOpenedAt = new Date().toISOString();
    populateBirthForm(record.localBirthData || {});
    if (state.horoscope) elements.targetDate.value = state.horoscope.targetSolarDate;
    saveRecords();
    renderSnapshot();
    setStatus(`已重新打开“${record.title}”。`, "success");
  }

  function deleteRecord(recordId) {
    if (aiBusy()) return;
    const record = state.records.find((item) => item.id === recordId);
    if (!record || !window.confirm(`确定删除“${record.title}”及其全部问答？`)) return;
    const previous = state.records;
    state.records = withoutRecord(previous, recordId);
    if (!saveRecords()) {
      state.records = previous;
      return;
    }
    if (state.currentRecordId === recordId) state.currentRecordId = null;
    renderRecords();
    renderConversation();
    syncRecordControls();
  }

  function resetPage() {
    if (aiBusy()) return;
    if (state.snapshot && (!currentRecord() || state.dirtyBirth) && !window.confirm("当前有未保存的命盘或出生资料修改。确定放弃这些未保存内容并新建命盘？已保存记录不会删除。")) return;
    elements.birthForm.reset();
    elements.solarDate.value = "1990-01-01";
    elements.birthTime.value = "12:00";
    elements.lunarYear.value = "1990";
    elements.lunarMonth.value = "1";
    elements.lunarDay.value = "1";
    elements.targetDate.value = todayText();
    state.snapshot = null;
    state.horoscope = null;
    state.currentRecordId = null;
    state.dirtyBirth = false;
    state.dirtyHoroscope = false;
    state.selectedLocation = null;
    state.pendingBirthInput = null;
    elements.aiQuestion.value = "";
    elements.aiState.textContent = "";
    elements.locationSearch.value = "";
    selectLocation(null, false);
    syncConditionalFields();
    elements.emptyState.hidden = false;
    elements.chartPanel.hidden = true;
    elements.detailSection.hidden = true;
    elements.lowerSection.hidden = false;
    elements.lowerSection.classList.add("records-only");
    elements.aiPanel.hidden = true;
    elements.inputState.textContent = "尚未排盘";
    elements.inputState.className = "input-state";
    setStatus("请填写出生资料并点击“排出命盘”。修改输入不会自动改盘。", "");
    renderRecords();
    renderConversation();
    syncRecordControls();
    notifyView("reset");
    elements.personLabel.focus();
  }

  elements.birthForm.addEventListener("submit", (event) => {
    event.preventDefault();
    buildFromForm(false);
  });
  elements.themeLight.addEventListener("click", () => applyTheme("light", true));
  elements.themeDark.addEventListener("click", () => applyTheme("dark", true));
  elements.densityClear.addEventListener("click", () => applyDensity("clear", true));
  elements.densityPro.addEventListener("click", () => applyDensity("pro", true));
  elements.chartZoomOut.addEventListener("click", () => applyChartZoom(state.chartZoom - CHART_ZOOM_STEP));
  elements.chartZoomReset.addEventListener("click", () => applyChartZoom(1));
  elements.chartZoomIn.addEventListener("click", () => applyChartZoom(state.chartZoom + CHART_ZOOM_STEP));
  elements.chartViewport.addEventListener("touchstart", beginChartPinch, { passive: true });
  elements.chartViewport.addEventListener("touchmove", moveChartPinch, { passive: false });
  elements.chartViewport.addEventListener("touchend", endChartPinch, { passive: true });
  elements.chartViewport.addEventListener("touchcancel", endChartPinch, { passive: true });
  if (window.matchMedia) window.matchMedia("(max-width: 760px)").addEventListener("change", (event) => { if (!event.matches) applyChartZoom(1); });
  elements.birthForm.querySelectorAll(".chart-input").forEach((input) => input.addEventListener("input", markBirthDirty));
  elements.birthForm.querySelectorAll('input[type="radio"]').forEach((input) => input.addEventListener("change", markBirthDirty));
  elements.locationTrigger.addEventListener("click", () => {
    elements.locationPanel.hidden = !elements.locationPanel.hidden;
    elements.locationTrigger.setAttribute("aria-expanded", String(!elements.locationPanel.hidden));
    if (!elements.locationPanel.hidden) elements.locationSearch.focus();
  });
  elements.locationSearch.addEventListener("input", renderLocations);
  elements.useCustomLocation.addEventListener("click", () => {
    try {
      selectLocation(customLocationFromValues(elements.customLocationName.value, elements.customLongitude.value));
      elements.customLocationName.value = "";
      elements.customLongitude.value = "";
    } catch (error) {
      setStatus(error.message, "error");
      elements.customLongitude.focus();
    }
  });
  elements.resetBirth.addEventListener("click", resetPage);
  $("newBirth").addEventListener("click", resetPage);
  $("saveBirth").addEventListener("click", saveCurrentChart);
  $("entrySave").addEventListener("click", saveCurrentChart);
  elements.targetDate.addEventListener("input", () => {
    if (!state.horoscope) return;
    state.dirtyHoroscope = true;
    elements.horoscopeState.textContent = "目标日期已修改；当前仍显示上一次运限，请点击查看。";
    elements.horoscopeState.className = "horoscope-state dirty";
  });
  elements.horoscopeButton.addEventListener("click", calculateHoroscope);
  elements.cancelTimeShift.addEventListener("click", () => {
    elements.timeConfirmDialog.close();
    state.pendingBirthInput = null;
  });
  elements.confirmTimeShift.addEventListener("click", () => {
    elements.timeConfirmDialog.close();
    buildFromForm(true);
  });
  $("openApiKey").addEventListener("click", () => { $("apiKeyStatus").textContent = ""; $("apiKeyDialog").showModal(); });
  $("closeApiKey").addEventListener("click", () => $("apiKeyDialog").close());
  elements.saveApiKey.addEventListener("click", () => {
    try {
      localStorage.setItem(API_KEY_STORAGE, elements.apiKey.value.trim());
      $("apiKeyDialog").close();
      setStatus("DeepSeek API Key 已保存到当前浏览器，不会导出。", "success");
    } catch (error) {
      $("apiKeyStatus").textContent = `API Key 保存失败：${error.message}`;
      setStatus(`API Key 保存失败：${error.message}`, "error");
    }
  });
  elements.aiMode.addEventListener("change", renderAiPresetQuestions);
  elements.aiStyle.addEventListener("change", renderAiPresetQuestions);
  elements.aiForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const question = elements.aiQuestion.value.trim();
    if (!question) return;
    elements.askAi.disabled = true;
    elements.aiState.textContent = "正在请求 deepseek-v4-flash（思考）…";
    try {
      const turn = await askAi(question);
      elements.aiQuestion.value = "";
      elements.aiState.textContent = turn.horoscopeSnapshot ? "回答和当时运限已冻结到本地记录。" : "本命回答已冻结到本地记录。";
      renderConversation();
      renderRecords();
      setStatus(turn.formatWarning ? "AI 回答已显示并保存（未完全按格式，仅供参考）。" : "AI 回答已保存。传统解读不是科学验证或权威结论。", "success");
    } catch (error) {
      elements.aiState.textContent = error.message;
      setStatus(error.message, "error");
    } finally {
      elements.askAi.disabled = false;
    }
  });
  elements.recordSearch.addEventListener("input", renderRecords);

  state.theme = readDisplayPreference(localStorage, THEME_STORAGE_KEY, ["light", "dark"], "light");
  state.density = readDisplayPreference(localStorage, DENSITY_STORAGE_KEY, ["clear", "pro"], "clear");
  applyTheme(state.theme, false);
  applyDensity(state.density, false);
  state.records = loadRecords();
  elements.solarDate.value = "1990-01-01";
  elements.birthTime.value = "12:00";
  elements.lunarYear.value = "1990";
  elements.lunarMonth.value = "1";
  elements.lunarDay.value = "1";
  elements.targetDate.value = todayText();
  try { elements.apiKey.value = localStorage.getItem(API_KEY_STORAGE) || ""; } catch (_) { /* shown on save */ }
  renderLocations();
  syncConditionalFields();
  renderRecords();

  window.ZiweiPageTest = Object.freeze({
    STORAGE_KEY,
    API_KEY_STORAGE,
    THEME_STORAGE_KEY,
    DENSITY_STORAGE_KEY,
    AI_MODEL,
    LOCATIONS,
    anonymousNatal,
    normalizeAiMode,
    normalizeAiStyle,
    aiStyleLabel,
    aiModeLabel,
    buildAiEvidence,
    buildAiMessages,
    aiPresetQuestions,
    validateAiAnswer,
    renderAiAnswer,
    normalizeAiAnswer,
    extractAiAnswer,
    isValidRecord,
    readRecordStorage,
    writeRecordStorage,
    filterRecords,
    withoutRecord,
    withoutTurn,
    createExportBundle,
    mergeImportBundle,
    customLocationFromValues,
    normalizeStoredLocation,
    palaceRelations,
    starTypeClass,
    brightnessClass,
    mutagenClass,
    normalizeDisplayPreference,
    readDisplayPreference,
    writeDisplayPreference,
    applyTheme,
    applyDensity,
    normalizeChartZoom,
    applyChartZoom,
    touchDistance,
  });
})();
