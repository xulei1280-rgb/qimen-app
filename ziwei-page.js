(function () {
  "use strict";

  const engine = window.ZiweiEngine;
  const STORAGE_KEY = "ziwei_records_v1";
  const API_KEY_STORAGE = "qimen_deepseek_api_key";
  const THEME_STORAGE_KEY = "ziwei_theme_v1";
  const DENSITY_STORAGE_KEY = "ziwei_density_v1";
  const AI_MODEL = window.DeepSeekClient.MODEL;
  const BRANCH_ORDER = ["巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑", "寅", "卯", "辰"];
  const EARTHLY_BRANCH_ORDER = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  const TIME_BRANCH_LABELS = ["早子时", "丑时", "寅时", "卯时", "辰时", "巳时", "午时", "未时", "申时", "酉时", "戌时", "亥时", "晚子时"];
  const MUTAGEN_LABELS = ["禄", "权", "科", "忌"];
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
  const REQUIRED_AI_SECTIONS = Object.freeze(["总论", "关键结构", "本命基础", "运限合参", "支持与制约", "现实观察", "不确定边界"]);
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
    "先抓主线再展开：本命定基础；提供运限时，再以大限定阶段、流年看触发。优先三方四正、星曜组合、亮度、四化和辅煞关系，不得逐宫流水账或逐星套话。",
    "每次回答必须严格使用七个二级标题：『## 总论』『## 关键结构』『## 本命基础』『## 运限合参』『## 支持与制约』『## 现实观察』『## 不确定边界』。关键结构最多三项，按重要性排序。",
    "每项盘面事实后必须引用提供的证据编号，例如 [P01]、[D01]、[Y01]；只能引用证据目录中真实存在的编号。支持与制约必须同时出现，不能把禄权科一概视为吉，也不能把忌煞一概视为凶。",
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
    aiPresetQuestions: $("aiPresetQuestions"),
    aiQuestion: $("aiQuestion"),
    askAi: $("askAi"),
    aiState: $("aiState"),
    recordSearch: $("recordSearch"),
    exportRecords: $("exportRecords"),
    importRecords: $("importRecords"),
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
      elements.solarPreview.innerHTML = `原北京时间 <strong>${escapeHtml(preview.inputDateTime)}</strong><br>经度修正 ${escapeHtml(formatCorrection(longitudeCorrection))} · 均时差 ${escapeHtml(formatCorrection(equationCorrection))}<br>生效真太阳时 <strong>${escapeHtml(preview.effectiveDateTime)}</strong>${preview.crossesDate ? " · 跨日期" : ""}${preview.crossesTimeBranch ? " · 跨时辰，排盘时须确认" : " · 未跨时辰"}`;
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

  function clearCurrentRecordBinding() {
    state.currentRecordId = null;
    renderRecords();
  }

  function buildFromForm(confirmedTimeShift) {
    const input = collectBirthInput(confirmedTimeShift);
    try {
      if (input.timeBasis === "trueSolar" && !state.selectedLocation) throw new Error("请选择出生地点后再使用真太阳时排盘。");
      const snapshot = engine.buildNatal(input);
      state.snapshot = snapshot;
      state.horoscope = null;
      state.selectedPalaceIndex = snapshot.natal.palaces.find((palace) => palace.name === "命宫")?.index ?? 0;
      state.dirtyBirth = false;
      state.dirtyHoroscope = false;
      state.pendingBirthInput = null;
      clearCurrentRecordBinding();
      renderSnapshot();
      elements.inputState.textContent = `已排盘：${snapshot.calendar.solarDate} ${snapshot.calendar.timeLabel}`;
      elements.inputState.className = "input-state";
      setStatus("本命盘已生成。可直接进行本命 AI 解读，也可先选择目标日期查看运限。", "success");
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
    elements.correctionNote.textContent = `修正 ${formatCorrection(details.correctionMinutes)}；${TIME_BRANCH_LABELS[details.inputTimeIndex] || "原时辰"} → ${TIME_BRANCH_LABELS[details.timeIndex] || "生效时辰"}${details.crossesDate ? "，同时跨越日期" : ""}。确认后将以真太阳时重新排盘。`;
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
          <span>时间口径<strong>${timeBasis}</strong></span>
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
  }

  function calculateHoroscope() {
    if (!state.snapshot) return;
    try {
      state.horoscope = engine.getHoroscope(state.snapshot, elements.targetDate.value);
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
        turn.horoscopeSnapshot,
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
      longitude: elements.longitude.value,
      location: state.selectedLocation ? clone(state.selectedLocation) : null,
    };
  }

  function createRecordIfNeeded() {
    let record = currentRecord();
    if (record) return record;
    const now = new Date().toISOString();
    record = {
      schemaVersion: 1,
      id: randomId("ziwei"),
      title: elements.personLabel.value.trim() || `${state.snapshot.calendar.solarDate} 命盘`,
      localBirthData: localBirthData(),
      natalSnapshot: clone(state.snapshot),
      currentHoroscope: state.horoscope ? clone(state.horoscope) : null,
      aiHistory: [],
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: now,
    };
    state.records.unshift(record);
    state.currentRecordId = record.id;
    if (!saveRecords()) throw new Error(state.storageError);
    renderRecords();
    return record;
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
      references: entries.map(({ id, layer, palaceIndex }) => ({ id, label: layer, palaceIndex })),
    };
  }

  function buildAiMessages(question, history, snapshot, horoscope, selectedPalaceIndex, requestedMode) {
    const mode = normalizeAiMode(requestedMode);
    const evidence = buildAiEvidence(snapshot, horoscope, selectedPalaceIndex, mode);
    const anonymous = anonymousNatal(snapshot);
    const context = {
      analysisMode: { id: mode, guide: aiModeGuide(mode, Boolean(horoscope)) },
      analysisScope: horoscope ? "本命＋已选大限＋已选流年" : "仅本命；未提供大限与流年，不得推断运限",
      frozenMeta: { engine: anonymous.engine, rules: anonymous.rules },
      evidenceCatalog: evidence.entries,
    };
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `以下是按重要层级整理的冻结证据目录（JSON）。目录包含本命十二宫完整星曜和三方四正；选择运限时还包含大限、流年的完整十二宫映射、四化与流曜。不要重新排盘：\n${JSON.stringify(context)}` },
      { role: "assistant", content: horoscope ? "我会从整张命盘提炼主线，按本命—大限—流年合参，并用证据编号标注支持与制约。" : "我会只依据本命冻结证据提炼主线，不推断未提供的大限和流年。" },
    ];
    for (const turn of history) {
      const priorMeta = [turn.mode ? `模式:${turn.mode}` : "", turn.horoscopeSnapshot?.targetSolarDate ? `当时目标日期:${turn.horoscopeSnapshot.targetSolarDate}` : ""].filter(Boolean).join("；");
      messages.push({ role: "user", content: `${priorMeta ? `历史追问（${priorMeta}）\n` : ""}${turn.question}` });
      messages.push({ role: "assistant", content: `历史回答仅用于保持对话语义，不能把其中证据编号当作本次证据：\n${turn.answer.replace(/\[[A-Z]\d{2}\]/g, "")}` });
    }
    messages.push({ role: "user", content: `本次分析模式：${aiModeGuide(mode, Boolean(horoscope))}\n当前查看宫位：${evidence.selectedPalace}（只是观察焦点，不限制全盘）\n${horoscope ? `已选运限：${evidence.targetDate}` : "未选择运限：只分析本命；“运限合参”须明确写明未提供，不能推断。"}\n用户问题：${question}\n请先完成内部核对，再严格按七个标题输出；不要复述整份数据。` });
    return messages;
  }

  function aiPresetQuestions(snapshot, horoscope, selectedPalaceIndex, requestedMode) {
    if (!snapshot) return [];
    const mode = normalizeAiMode(requestedMode);
    const palace = snapshot.natal.palaces.find((item) => item.index === Number(selectedPalaceIndex));
    const palaceName = palace ? palaceDisplayName(palace.name) : "所选宫位";
    const modeQuestion = {
      comprehensive: horoscope ? "请从整张命盘提炼最重要的三项结构，并综合说明事业、财富、关系与当前运限。" : "请从整张命盘提炼最重要的三项结构，并综合说明事业、财富、关系与身心倾向。",
      natal: "请分析本命盘的稳定底色、主要优势、核心制约和现实兑现条件。",
      career: horoscope ? "请综合本命与当前运限，分析事业发展的主要路线、优势、代价和观察点。" : "请从本命盘分析事业发展的主要路线、优势、代价和观察点。",
      wealth: horoscope ? "请综合本命与当前运限，分析财富取得方式、承载条件和主要风险。" : "请从本命盘分析财富取得方式、承载条件和主要风险。",
      relationship: horoscope ? "请综合本命与当前运限，分析关系模式、核心需求、冲突点和现实观察点。" : "请从本命盘分析关系模式、核心需求、冲突点和现实观察点。",
      wellbeing: "请只从传统盘面角度说明身心压力倾向、生活观察点和不能下结论的部分。",
      decadal: "请说明当前十年大限的主线、机会、代价，以及本命能否承接。",
      yearly: "请说明指定流年最值得关注的领域、触发条件和反向证据。",
      conclusion: "请用简明结论概括当前命盘最重要的三点和现实建议，但保留证据编号。",
    }[mode];
    return [
      modeQuestion,
      "请概括本命盘最突出的三项结构，并按重要性排序，逐项列出支持和制约证据。",
      ...(horoscope ? [
        "当前大限的核心主题是什么？请分别说明支持证据、制约因素和现实观察点。",
        "当前流年最值得留意哪些领域？请区分机会、风险和触发条件。",
      ] : [
        "请从本命十二宫中找出最重要的两组相互支持结构，并说明成立条件。",
        "请从本命盘找出最需要留意的制约结构，并给出可现实核对的观察点。",
      ]),
      `请结合${palaceName}及其三方四正，说明这个宫位在全盘${horoscope ? "和当前运限" : ""}中的位置。`,
      "请检查最主要结论的反向证据，并说明哪些内容仍需现实验证。",
    ];
  }

  function renderAiPresetQuestions() {
    const questions = aiPresetQuestions(state.snapshot, state.horoscope, state.selectedPalaceIndex, elements.aiMode.value);
    const disabled = !state.snapshot || (!state.horoscope && ["decadal", "yearly"].includes(normalizeAiMode(elements.aiMode.value)));
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

  function validateAiAnswer(answer, evidence) {
    const errors = [];
    const lines = answer.split(/\r?\n/);
    const sectionBody = (section) => {
      const start = lines.findIndex((line) => line.trim() === `## ${section}`);
      if (start < 0) return "";
      const next = lines.findIndex((line, index) => index > start && /^##\s+/.test(line.trim()));
      return lines.slice(start + 1, next < 0 ? lines.length : next).join("\n");
    };
    const sectionReferences = (section) => [...new Set([...sectionBody(section).matchAll(/\[([A-Z]\d{2})\]/g)].map((match) => match[1]))];
    for (const section of REQUIRED_AI_SECTIONS) {
      if (!new RegExp(`^##\\s*${section}\\s*$`, "m").test(answer)) errors.push(`缺少“${section}”`);
    }
    const validIds = new Set(evidence.references.map((item) => item.id));
    const references = [...new Set([...answer.matchAll(/\[([A-Z]\d{2})\]/g)].map((match) => match[1]))];
    const invalid = references.filter((id) => !validIds.has(id));
    if (invalid.length) errors.push(`引用了不存在的证据 ${invalid.join("、")}`);
    if (references.length < 5) errors.push("可核对证据少于 5 项");
    if (!references.some((id) => /^[NPR]/.test(id))) errors.push("缺少本命证据");
    if (evidence.includesHoroscope && !references.some((id) => id.startsWith("D"))) errors.push("缺少大限证据");
    if (evidence.includesHoroscope && !references.some((id) => id.startsWith("Y"))) errors.push("缺少流年证据");
    if (sectionReferences("关键结构").length < 2) errors.push("关键结构缺少多项证据");
    if (!sectionReferences("本命基础").some((id) => /^[NPR]/.test(id))) errors.push("本命基础没有引用本命证据");
    if (evidence.includesHoroscope && (!sectionReferences("运限合参").some((id) => id.startsWith("D")) || !sectionReferences("运限合参").some((id) => id.startsWith("Y")))) errors.push("运限合参没有同时引用大限与流年证据");
    if (sectionReferences("支持与制约").length < 2) errors.push("支持与制约缺少双向证据");
    return { valid: errors.length === 0, errors, references };
  }

  function renderAiAnswer(answer, references) {
    const referenceMap = new Map((references || []).map((item) => [item.id, item]));
    const inline = (text) => escapeHtml(text).replace(/\[([A-Z]\d{2})\]/g, (match, id) => {
      const reference = referenceMap.get(id);
      if (!reference) return match;
      const label = escapeHtml(`${reference.label} ${id}`);
      if (reference.palaceIndex == null) return `<span class="evidence-ref static" title="${label}">[${id}]</span>`;
      return `<button class="evidence-ref" type="button" data-evidence-palace="${reference.palaceIndex}" title="定位到${label}" aria-label="定位到${label}">[${id}]</button>`;
    });
    return String(answer).split(/\r?\n/).map((line) => {
      const heading = line.match(/^##\s+(.+)$/);
      if (heading) return `<h3>${inline(heading[1])}</h3>`;
      const bullet = line.match(/^[-*]\s+(.+)$/);
      if (bullet) return `<div class="ai-answer-bullet">${inline(bullet[1])}</div>`;
      if (!line.trim()) return '<span class="ai-answer-space" aria-hidden="true"></span>';
      return `<p>${inline(line)}</p>`;
    }).join("");
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
    const mode = normalizeAiMode(elements.aiMode.value);
    const horoscope = state.horoscope;
    if (!horoscope && ["decadal", "yearly"].includes(mode)) throw new Error("当前分析模式需要先选择目标日期并点击“查看运限”。");
    const record = createRecordIfNeeded();
    const evidence = buildAiEvidence(state.snapshot, horoscope, state.selectedPalaceIndex, mode);
    const messages = buildAiMessages(question, record.aiHistory, state.snapshot, horoscope, state.selectedPalaceIndex, mode);
    let answer = await requestAiCompletion(messages);
    let validation = validateAiAnswer(answer, evidence);
    if (!validation.valid) {
      answer = await requestAiCompletion([...messages, { role: "assistant", content: answer }, { role: "user", content: `上面的草稿未通过本地校验：${validation.errors.join("；")}。请不要增加任何新事实，重新严格按七个标题输出，并只引用证据目录中的编号。` }]);
      validation = validateAiAnswer(answer, evidence);
    }
    if (!validation.valid) throw new Error(`AI 回答未通过结构与证据校验：${validation.errors.join("；")}。已拒绝保存。`);
    const now = new Date().toISOString();
    const turn = {
      id: randomId("turn"),
      question,
      answer,
      mode,
      model: AI_MODEL,
      createdAt: now,
      horoscopeSnapshot: horoscope ? clone(horoscope) : null,
      evidenceRefs: clone(evidence.references),
    };
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
    elements.conversation.innerHTML = history.map((turn) => `
      <article class="turn">
        <div class="turn-question"><small>${escapeHtml(turn.mode ? `分析模式 · ${aiModeLabel(turn.mode)} · ` : "问题 · ")}${escapeHtml(turn.horoscopeSnapshot?.targetSolarDate || "未选运限")}</small>${escapeHtml(turn.question)}</div>
        <div class="turn-answer"><small>${escapeHtml(turn.model)} · ${escapeHtml(formatDateTime(turn.createdAt))}</small>${renderAiAnswer(turn.answer, turn.evidenceRefs)}</div>
        <div class="turn-actions"><button class="text-button" type="button" data-delete-turn="${escapeHtml(turn.id)}">删除这条问答</button></div>
      </article>`).join("");
    elements.conversation.querySelectorAll("[data-delete-turn]").forEach((button) => {
      button.addEventListener("click", () => deleteTurn(button.dataset.deleteTurn));
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
      elements.recordList.innerHTML = `<p class="privacy-note">${query ? "没有匹配记录。" : "第一次调用 AI 时会自动建立记录。"}</p>`;
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
    selectLocation(normalizeStoredLocation(data), false);
    syncConditionalFields();
  }

  function openRecord(recordId) {
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
    if (state.horoscope) elements.targetDate.value = state.horoscope.targetDate;
    saveRecords();
    renderSnapshot();
    setStatus(`已重新打开“${record.title}”。`, "success");
  }

  function deleteRecord(recordId) {
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
  }

  function exportRecords() {
    const data = createExportBundle(state.records);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ziwei-records-${todayText()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus(`已导出 ${state.records.length} 条记录；API Key 不在导出文件中。`, "success");
  }

  async function importRecords(file) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const result = mergeImportBundle(state.records, parsed);
      const previous = state.records;
      state.records = result.records;
      if (!saveRecords()) {
        state.records = previous;
        return;
      }
      renderRecords();
      setStatus(`导入完成：读取 ${result.read} 条，新增或更新 ${result.updated} 条。`, "success");
    } catch (error) {
      setStatus(`导入失败：${error.message}`, "error");
    } finally {
      elements.importRecords.value = "";
    }
  }

  function resetPage() {
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
  elements.saveApiKey.addEventListener("click", () => {
    try {
      localStorage.setItem(API_KEY_STORAGE, elements.apiKey.value.trim());
      setStatus("DeepSeek API Key 已保存到当前浏览器，不会导出。", "success");
    } catch (error) {
      setStatus(`API Key 保存失败：${error.message}`, "error");
    }
  });
  elements.aiMode.addEventListener("change", renderAiPresetQuestions);
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
      setStatus("AI 回答已保存。传统解读不是科学验证或权威结论。", "success");
    } catch (error) {
      elements.aiState.textContent = error.message;
      setStatus(error.message, "error");
    } finally {
      elements.askAi.disabled = false;
    }
  });
  elements.recordSearch.addEventListener("input", renderRecords);
  elements.exportRecords.addEventListener("click", exportRecords);
  elements.importRecords.addEventListener("change", () => importRecords(elements.importRecords.files[0]));

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
    aiModeLabel,
    buildAiEvidence,
    buildAiMessages,
    aiPresetQuestions,
    validateAiAnswer,
    renderAiAnswer,
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
