/* 紫微斗数 · 星夜视觉层（ziwei-premium.js）
 * 在共用 premium-base 之上：输入折叠、命盘总览、视图标签、命盘连线图层（三方四正 / 生年四化 /
 * 宫干飞化 / 大限·流年四化）、手机宫位底部面板、大限时间轴与动效。
 * 只读取 ziwei-page.js 广播的冻结盘面（ziwei:view 事件），不改任何排盘与解盘逻辑。
 * 宫干飞化只调用本页已加载的 iztro 默认十干四化表（与生年、大限、流年四化同源），不自建表。 */
(function (root, factory) {
  "use strict";
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZiweiPremium = api;
  if (root.document && typeof root.document.getElementById === "function" && typeof root.addEventListener === "function") {
    if (root.document.readyState === "loading") root.document.addEventListener("DOMContentLoaded", () => api.mount());
    else api.mount();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  const LABELS = ["禄", "权", "科", "忌"];
  const KIND = Object.freeze({ 禄: "lu", 权: "quan", 科: "ke", 忌: "ji" });
  const LAYER_IDS = ["rel", "birth", "fly", "luck"];
  const DEFAULT_LAYERS = Object.freeze({ rel: true, birth: false, fly: false, luck: false });
  const LAYER_STORAGE_KEY = "ziwei_layers_v1";
  const EARTHLY = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  // 与 ziwei.html 宫格位置一致：[行, 列]
  const GRID_POS = Object.freeze({ 巳: [0, 0], 午: [0, 1], 未: [0, 2], 申: [0, 3], 辰: [1, 0], 酉: [1, 3], 卯: [2, 0], 戌: [2, 3], 寅: [3, 0], 丑: [3, 1], 子: [3, 2], 亥: [3, 3] });

  /* ---------------- 纯函数（可在 Node 中测试） ---------------- */
  function palaceStars(palace) {
    return [...(palace.majorStars || []), ...(palace.minorStars || []), ...(palace.adjectiveStars || [])];
  }

  function starPalaceIndex(palaces, starName) {
    if (!starName) return -1;
    const palace = palaces.find((item) => palaceStars(item).some((star) => star.name === starName));
    return palace ? palace.index : -1;
  }

  function mutagenTargets(palaces, mutagenMap) {
    return LABELS.map((label) => {
      const star = (mutagenMap && mutagenMap[label]) || "";
      return { label, kind: KIND[label], star, to: starPalaceIndex(palaces, star) };
    }).filter((item) => item.to >= 0);
  }

  function defaultStemTable(stem) {
    const util = root.iztro && root.iztro.util;
    if (!util || typeof util.getMutagensByHeavenlyStem !== "function") return [];
    return util.getMutagensByHeavenlyStem(stem) || [];
  }

  // 宫干飞化：所选宫的天干 → 十干四化表 → 化星所在宫；落回本宫即自化。
  function flyingFrom(palaces, sourceIndex, stemTable) {
    const source = palaces.find((palace) => palace.index === Number(sourceIndex));
    if (!source) return [];
    const stars = (stemTable || defaultStemTable)(source.heavenlyStem) || [];
    return LABELS.map((label, i) => ({ label, kind: KIND[label], star: stars[i] || "", to: starPalaceIndex(palaces, stars[i]) }))
      .filter((item) => item.to >= 0)
      .map((item) => ({ ...item, from: source.index, stem: source.heavenlyStem, self: item.to === source.index }));
  }

  function relationIndexes(palaces, selectedIndex) {
    const target = palaces.find((palace) => palace.index === Number(selectedIndex));
    if (!target) return null;
    const base = EARTHLY.indexOf(target.earthlyBranch);
    const at = (offset) => palaces.find((palace) => palace.earthlyBranch === EARTHLY[(base + offset) % 12]).index;
    return { target: target.index, opposite: at(6), wealth: at(8), career: at(4) };
  }

  function normalizeLayers(value) {
    const out = { ...DEFAULT_LAYERS };
    if (value && typeof value === "object") LAYER_IDS.forEach((id) => { if (typeof value[id] === "boolean") out[id] = value[id]; });
    return out;
  }

  function toggleLayer(layers, id) {
    const out = normalizeLayers(layers);
    if (LAYER_IDS.includes(id)) out[id] = !out[id];
    return out;
  }

  // 把开启的图层转成连线清单；from 为宫位 index 或 "center"（生年四化从中宫年干发出）。
  function buildArrows(snapshot, horoscope, selectedIndex, layers, stemTable) {
    if (!snapshot || !snapshot.natal) return [];
    const palaces = snapshot.natal.palaces;
    const on = normalizeLayers(layers);
    const arrows = [];
    if (on.rel) {
      const rel = relationIndexes(palaces, selectedIndex);
      if (rel) {
        arrows.push({ layer: "rel", style: "opposite", from: rel.target, to: rel.opposite });
        arrows.push({ layer: "rel", style: "trine", from: rel.target, to: rel.wealth });
        arrows.push({ layer: "rel", style: "trine", from: rel.wealth, to: rel.career });
        arrows.push({ layer: "rel", style: "trine", from: rel.career, to: rel.target });
      }
    }
    if (on.birth) {
      const stem = String(snapshot.calendar?.sexagenary || "").charAt(0);
      mutagenTargets(palaces, snapshot.natal.birthMutagen).forEach((item) => arrows.push({ layer: "birth", style: "birth", from: "center", to: item.to, kind: item.kind, label: item.label, star: item.star, text: `生${item.label}`, stem }));
    }
    if (on.fly) {
      flyingFrom(palaces, selectedIndex, stemTable).forEach((item) => arrows.push({ layer: "fly", style: "fly", from: item.from, to: item.to, kind: item.kind, label: item.label, star: item.star, self: item.self, text: `${item.self ? "自" : "飞"}${item.label}`, stem: item.stem }));
    }
    if (on.luck && horoscope) {
      for (const [scope, style, prefix] of [[horoscope.decadal, "decadal", "限"], [horoscope.yearly, "yearly", "年"]]) {
        if (!scope) continue;
        mutagenTargets(palaces, scope.mutagen).forEach((item) => arrows.push({ layer: "luck", style, from: scope.palaceIndex, to: item.to, kind: item.kind, label: item.label, star: item.star, self: item.to === scope.palaceIndex, text: `${prefix}${item.label}`, stem: scope.heavenlyStem }));
      }
    }
    return arrows;
  }

  function palaceName(name) {
    return String(name).endsWith("宫") ? String(name) : `${name}宫`;
  }

  function decadalTimeline(snapshot, horoscope) {
    if (!snapshot) return [];
    return [...snapshot.natal.palaces]
      .sort((a, b) => a.decadal.range[0] - b.decadal.range[0])
      .map((palace) => ({
        index: palace.index,
        name: palaceName(palace.name),
        ganzhi: palace.heavenlyStem + palace.earthlyBranch,
        range: [...palace.decadal.range],
        current: Boolean(horoscope && horoscope.decadal && horoscope.decadal.palaceIndex === palace.index),
        yearly: Boolean(horoscope && horoscope.yearly && horoscope.yearly.palaceIndex === palace.index),
      }));
  }

  function overviewModel(snapshot, horoscope) {
    if (!snapshot) return null;
    const palaces = snapshot.natal.palaces;
    const soul = palaces.find((palace) => palace.name === "命宫") || palaces[0];
    const rel = relationIndexes(palaces, soul.index);
    const opposite = palaces.find((palace) => palace.index === rel.opposite);
    const birthStem = String(snapshot.calendar.sexagenary || "").charAt(0);
    const model = {
      fiveElementsClass: snapshot.natal.fiveElementsClass,
      soulBranch: snapshot.natal.soulPalace,
      bodyBranch: snapshot.natal.bodyPalace,
      soulStar: snapshot.natal.soulStar,
      bodyStar: snapshot.natal.bodyStar,
      soulMajors: soul.majorStars.map((star) => ({ name: star.name, brightness: star.brightness, mutagen: star.mutagen })),
      borrowed: soul.majorStars.length ? null : { palace: palaceName(opposite.name), stars: opposite.majorStars.map((star) => star.name) },
      birthStem,
      birthMutagen: LABELS.map((label) => {
        const star = snapshot.natal.birthMutagen[label] || "";
        const index = starPalaceIndex(palaces, star);
        return { label, kind: KIND[label], star, palace: index >= 0 ? palaceName(palaces.find((palace) => palace.index === index).name) : "" };
      }),
      luck: null,
    };
    if (horoscope) {
      const decadalPalace = palaces.find((palace) => palace.index === horoscope.decadal.palaceIndex);
      const yearlyPalace = palaces.find((palace) => palace.index === horoscope.yearly.palaceIndex);
      model.luck = {
        date: horoscope.targetSolarDate,
        nominalAge: horoscope.nominalAge,
        decadalRange: [...horoscope.decadal.ageRange],
        decadalPalace: decadalPalace ? palaceName(decadalPalace.name) : "",
        decadalGanzhi: horoscope.decadal.heavenlyStem + horoscope.decadal.earthlyBranch,
        yearlyGanzhi: horoscope.yearly.heavenlyStem + horoscope.yearly.earthlyBranch,
        yearlyPalace: yearlyPalace ? palaceName(yearlyPalace.name) : "",
        yearlyMutagen: LABELS.map((label) => ({ label, kind: KIND[label], star: horoscope.yearly.mutagen[label] || "" })),
      };
    }
    return model;
  }

  // 底部面板左右滑动：按宫位 index 相邻切换（0–11 循环）。
  function adjacentIndex(index, step) {
    return ((Number(index) + step) % 12 + 12) % 12;
  }

  /* ---------------- 页面挂载（只在浏览器中运行） ---------------- */
  function mount() {
    const doc = root.document;
    const $ = (id) => doc.getElementById(id);
    const html = doc.documentElement;
    const body = doc.body;
    const UI = root.PremiumUI || null;
    const els = {
      main: $("main"), status: $("statusBanner"), entryCard: $("entryCard"), entryBody: $("entryBody"), entrySummary: $("entrySummary"),
      entrySummaryText: $("entrySummaryText"), entryEdit: $("entryEdit"), entryMore: $("entryMore"), personLabel: $("personLabel"),
      overview: $("zwOverview"), tabs: $("zwTabs"), layers: $("zwLayers"), legend: $("zwLegend"), grid: $("chartGrid"),
      viewport: $("chartViewport"), chartPanel: $("chartPanel"), detailCard: $("detailCard"), flyDetail: $("zwFlyDetail"),
      sheetPrev: $("sheetPrev"), sheetNext: $("sheetNext"), sheetClose: $("sheetClose"), timeline: $("zwTimeline"),
      targetDate: $("targetDate"), horoscopeButton: $("horoscopeButton"), aiMode: $("aiMode"), aiModeSummary: $("aiModeSummary"),
      infoBtn: $("zwInfoBtn"), info: $("zwInfo"), emptyState: $("emptyState"),
    };
    if (!els.grid || !els.main) return;
    const view = { snapshot: null, horoscope: null, selected: null, tab: "natal", layers: readLayers(), lastKey: "", sheetOpen: false };
    const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c]);
    const motion = () => (UI ? UI.motionOK() : true);
    const mq = root.matchMedia ? root.matchMedia("(max-width: 760px)") : null;
    const sheetMode = () => Boolean(mq && mq.matches) && html.dataset.density !== "pro";

    function readLayers() {
      try { return normalizeLayers(JSON.parse(root.localStorage.getItem(LAYER_STORAGE_KEY) || "null")); } catch (_) { return normalizeLayers(null); }
    }
    function writeLayers() {
      try { root.localStorage.setItem(LAYER_STORAGE_KEY, JSON.stringify(view.layers)); } catch (_) { /* 只是显示偏好 */ }
    }

    /* 题头：星盘环 + 北斗星点 */
    if (UI) {
      const dipper = [[150, 168], [178, 160], [204, 172], [226, 190], [236, 222], [268, 232], [276, 200]];
      const center = '<g class="zw-dipper">' + dipper.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="${i === 3 ? 3.4 : 2.6}" fill="currentColor" class="zw-twinkle" style="--zw-t:${i}"/>`).join("") +
        `<path d="M${dipper.map((p) => p.join(" ")).join(" L")} L${dipper[3].join(" ")}" stroke="currentColor" stroke-width=".6" stroke-dasharray="2 3" fill="none"/></g>`;
      UI.decorateHero({ seal: "紫", eyebrow: "星曜 · 四化 · 运限", outer: "子丑寅卯辰巳午未申酉戌亥", inner: "紫微天机太阳武曲天同廉贞", centerSvg: center });
      const top = doc.querySelector(".zw-top");
      if (top && !top.querySelector(".zw-stars")) {
        const stars = doc.createElement("div");
        stars.className = "zw-stars";
        stars.setAttribute("aria-hidden", "true");
        const spots = [[8, 22], [17, 64], [26, 38], [39, 18], [47, 72], [58, 30], [66, 58], [74, 16], [83, 44], [92, 70], [12, 84], [53, 88], [35, 52]];
        stars.innerHTML = spots.map((s, i) => `<i style="left:${s[0]}%;top:${s[1]}%;--zw-t:${i % 5}"${i % 4 === 0 ? ' class="zw-twinkle"' : ""}></i>`).join("");
        top.insertBefore(stars, top.firstChild);
      }
    }

    /* ⓘ 规则说明 */
    if (els.infoBtn && els.info) {
      els.infoBtn.addEventListener("click", () => {
        els.info.hidden = !els.info.hidden;
        els.infoBtn.setAttribute("aria-expanded", String(!els.info.hidden));
      });
    }

    /* 状态提示：成功/普通提示几秒后淡出，错误保留 */
    let statusTimer = null;
    if (els.status && root.MutationObserver) {
      let lastStatus = "";
      // 收起时丢弃本次 class 变化记录，否则观察者会把“收起”误当成新提示又弹出来（旧版提示条一直不消失的原因）。
      const hide = () => { root.clearTimeout(statusTimer); lastStatus = ""; els.status.classList.remove("zw-show"); observer.takeRecords(); };
      const observer = new root.MutationObserver(() => {
        const signature = `${els.status.className.replace(/\s*zw-show/g, "")}|${els.status.textContent}`;
        if (signature === lastStatus) return;
        lastStatus = signature;
        root.clearTimeout(statusTimer);
        els.status.classList.add("zw-show");
        // 提示都会自动收起（错误多停留几秒），也可点 × 立即关闭；完整错误仍留在对应面板里。
        statusTimer = root.setTimeout(hide, els.status.classList.contains("error") ? 7000 : 4200);
      });
      observer.observe(els.status, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ["class"] });
      els.status.title = "点击关闭";
      els.status.addEventListener("click", hide);
    }

    /* 输入卡：排盘后收成一行摘要 */
    function setEntryCollapsed(collapsed) {
      els.entryCard.classList.toggle("zw-collapsed", collapsed);
      els.entrySummary.hidden = !collapsed;
      els.entryBody.hidden = collapsed;
      els.entryEdit.setAttribute("aria-expanded", String(!collapsed));
    }
    els.entryEdit.addEventListener("click", () => {
      setEntryCollapsed(false);
      els.entryCard.scrollIntoView({ behavior: motion() ? "smooth" : "auto", block: "start" });
    });
    function entrySummary(snapshot) {
      const label = els.personLabel && els.personLabel.value.trim();
      const basis = snapshot.input.timeBasis === "trueSolar" ? "真太阳时" : "北京时间";
      const time = snapshot.input.clockTime || "";
      return [label || "匿名命盘", snapshot.input.gender === "male" ? "男" : "女", `${snapshot.calendar.solarDate} ${time}`.trim(), `${snapshot.calendar.timeLabel}`, basis].filter(Boolean).join(" · ");
    }

    /* 视图标签 */
    const ink = UI ? UI.tabInk("#zwTabs", "button.active") : null;
    const panels = () => Array.from(doc.querySelectorAll("[data-zw-panel]"));
    function applyPanels() {
      const cast = Boolean(view.snapshot);
      panels().forEach((panel) => {
        const id = panel.dataset.zwPanel;
        const visible = cast ? id === view.tab : id === "records";
        panel.classList.toggle("zw-off", !visible);
      });
    }
    function setTab(tab, options = {}) {
      view.tab = tab;
      els.main.dataset.zwTab = tab;
      els.tabs.querySelectorAll("[data-zw-tab]").forEach((button) => {
        const active = button.dataset.zwTab === tab;
        button.classList.toggle("active", active);
        button.setAttribute("aria-selected", String(active));
        button.tabIndex = active ? 0 : -1;
      });
      applyPanels();
      if (ink) ink.place();
      if (tab !== "natal") closeSheet();
      if (tab === "natal") root.requestAnimationFrame(() => draw(false));
      if (options.scroll) els.tabs.scrollIntoView({ behavior: motion() ? "smooth" : "auto", block: "start" });
      const active = panels().find((panel) => panel.dataset.zwPanel === tab);
      if (active && UI && options.animate !== false) UI.replay(active, "pm-refresh");
    }
    els.tabs.addEventListener("click", (event) => {
      const button = event.target.closest("[data-zw-tab]");
      if (button) setTab(button.dataset.zwTab);
    });
    els.tabs.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      const ids = ["natal", "luck", "ai", "records"];
      const next = ids[(ids.indexOf(view.tab) + (event.key === "ArrowRight" ? 1 : 3)) % 4];
      setTab(next);
      els.tabs.querySelector(`[data-zw-tab="${next}"]`).focus();
    });
    root.addEventListener("resize", () => { if (ink) ink.instant(); });

    /* 图层开关 */
    function syncLayerButtons() {
      els.layers.querySelectorAll("[data-zw-layer]").forEach((button) => button.setAttribute("aria-pressed", String(Boolean(view.layers[button.dataset.zwLayer]))));
    }
    els.layers.addEventListener("click", (event) => {
      const button = event.target.closest("[data-zw-layer]");
      if (!button) return;
      view.layers = toggleLayer(view.layers, button.dataset.zwLayer);
      writeLayers();
      syncLayerButtons();
      draw(true);
    });
    syncLayerButtons();

    /* 连线绘制 */
    const SVG_NS = "http://www.w3.org/2000/svg";
    let svg = null;
    function ensureSvg() {
      if (svg && svg.parentNode === els.grid) return svg;
      svg = doc.createElementNS(SVG_NS, "svg");
      svg.setAttribute("class", "zw-lines");
      svg.setAttribute("aria-hidden", "true");
      els.grid.appendChild(svg);
      return svg;
    }
    function palaceNodes() {
      const map = new Map();
      els.grid.querySelectorAll(".palace").forEach((node) => map.set(Number(node.dataset.index), node));
      return map;
    }
    function geometry() {
      const W = els.grid.offsetWidth, H = els.grid.offsetHeight;
      const nodes = palaceNodes();
      const boxes = new Map();
      nodes.forEach((node, index) => boxes.set(index, { x: node.offsetLeft, y: node.offsetTop, w: node.offsetWidth, h: node.offsetHeight, branch: node.dataset.branch }));
      return { W, H, C: { x: W / 2, y: H / 2 }, boxes };
    }
    function anchor(geo, index, slot) {
      const box = geo.boxes.get(index);
      if (!box) return null;
      const [row, col] = GRID_POS[box.branch] || [1, 1];
      let x = col === 0 ? box.x + box.w : col === 3 ? box.x : box.x + box.w / 2;
      let y = row === 0 ? box.y + box.h : row === 3 ? box.y : box.y + box.h / 2;
      const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
      const inset = Math.min(box.w, box.h) * 0.16;
      const dx = cx - x, dy = cy - y, len = Math.hypot(dx, dy) || 1;
      x += dx / len * inset; y += dy / len * inset;
      if (slot) {
        const tx = -(geo.C.y - y), ty = geo.C.x - x, tl = Math.hypot(tx, ty) || 1;
        const gap = Math.min(box.w, box.h) * 0.09;
        x += tx / tl * slot * gap; y += ty / tl * slot * gap;
      }
      return { x, y };
    }
    const SLOT = { lu: -1.5, quan: -0.5, ke: 0.5, ji: 1.5 };
    function curve(a, b, C, bend) {
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const c = { x: mx + (C.x - mx) * bend, y: my + (C.y - my) * bend };
      return { d: `M${a.x.toFixed(1)} ${a.y.toFixed(1)} Q${c.x.toFixed(1)} ${c.y.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`, at: (t) => ({ x: (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * c.x + t * t * b.x, y: (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * c.y + t * t * b.y }) };
    }
    function el(name, attrs, text) {
      const node = doc.createElementNS(SVG_NS, name);
      Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
      if (text != null) node.textContent = text;
      return node;
    }
    function draw(animate) {
      if (!view.snapshot || !els.grid.querySelector(".palace")) { if (svg) svg.innerHTML = ""; return; }
      if (els.chartPanel.offsetParent === null) return;
      const arrows = buildArrows(view.snapshot, view.horoscope, view.selected, view.layers);
      const key = JSON.stringify([view.selected, arrows.map((a) => [a.layer, a.style, a.from, a.to, a.kind])]);
      const fresh = animate !== false && key !== view.lastKey && motion();
      view.lastKey = key;
      const geo = geometry();
      const s = ensureSvg();
      s.setAttribute("viewBox", `0 0 ${geo.W} ${geo.H}`);
      s.innerHTML = "";
      const small = geo.W < 560;
      const defs = el("defs", {});
      ["lu", "quan", "ke", "ji"].forEach((kind) => {
        const marker = el("marker", { id: `zwArrow-${kind}`, viewBox: "0 0 10 10", refX: "8", refY: "5", markerWidth: "4.2", markerHeight: "4.2", orient: "auto", class: `zw-k-${kind}` });
        marker.appendChild(el("path", { d: "M0 0 L10 5 L0 10 z", fill: "currentColor" }));
        defs.appendChild(marker);
      });
      s.appendChild(defs);
      const gHalo = el("g", { class: "zw-halo" }), gLine = el("g", { class: "zw-line" }), gLabel = el("g", { class: "zw-label" });
      s.append(gHalo, gLine, gLabel);
      const placed = [];
      const labelAt = (p, text, kind, style) => {
        let q = { x: p.x, y: p.y };
        for (let k = 0; k < 6 && placed.some((o) => Math.hypot(o.x - q.x, o.y - q.y) < (small ? 15 : 19)); k++) q = { x: q.x + (small ? 6 : 8), y: q.y + (small ? 9 : 11) };
        placed.push(q);
        const w = small ? 20 : 26, h = small ? 13 : 16;
        const g = el("g", { class: `zw-tag zw-k-${kind} zw-s-${style}${fresh ? " zw-pop" : ""}`, transform: `translate(${q.x.toFixed(1)} ${q.y.toFixed(1)})` });
        g.appendChild(el("rect", { x: -w / 2, y: -h / 2, width: w, height: h, rx: h / 2 }));
        g.appendChild(el("text", { x: 0, y: 0.5, "text-anchor": "middle", "dominant-baseline": "central" }, text));
        gLabel.appendChild(g);
      };
      arrows.forEach((arrow, i) => {
        const slot = arrow.kind ? SLOT[arrow.kind] : 0;
        if (arrow.layer === "rel") {
          const a = anchor(geo, arrow.from, 0), b = anchor(geo, arrow.to, 0);
          if (!a || !b) return;
          const c = curve(a, b, geo.C, arrow.style === "opposite" ? 0 : 0.12);
          gHalo.appendChild(el("path", { d: c.d }));
          gLine.appendChild(el("path", { d: c.d, class: `zw-rel zw-s-${arrow.style}${fresh ? " zw-draw" : ""}`, pathLength: "1", style: `--zw-i:${i}` }));
          return;
        }
        const end = anchor(geo, arrow.to, slot);
        if (!end) return;
        const cls = `zw-arrow zw-k-${arrow.kind} zw-s-${arrow.style}${fresh ? " zw-draw" : ""}`;
        const common = { "marker-end": `url(#zwArrow-${arrow.kind})`, style: `--zw-i:${i}` };
        if (arrow.self) {
          const r = small ? 7 : 10;
          const p = { x: end.x, y: end.y };
          const d = `M${(p.x + r).toFixed(1)} ${p.y.toFixed(1)} A${r} ${r} 0 1 1 ${(p.x + r * Math.cos(-0.9)).toFixed(1)} ${(p.y + r * Math.sin(-0.9)).toFixed(1)}`;
          gHalo.appendChild(el("path", { d }));
          gLine.appendChild(el("path", { d, class: cls, pathLength: "1", ...common }));
          labelAt({ x: p.x, y: p.y - r - (small ? 8 : 10) }, arrow.text, arrow.kind, arrow.style);
          return;
        }
        const start = arrow.from === "center" ? { x: geo.C.x + slot * (small ? 6 : 9), y: geo.C.y } : anchor(geo, arrow.from, slot);
        if (!start) return;
        const c = curve(start, end, geo.C, arrow.from === "center" ? 0.05 : 0.38);
        gHalo.appendChild(el("path", { d: c.d }));
        gLine.appendChild(el("path", { d: c.d, class: cls, pathLength: "1", ...common }));
        labelAt(c.at(0.66), arrow.text, arrow.kind, arrow.style);
      });
      if (view.layers.birth) {
        const g = el("g", { class: "zw-origin", transform: `translate(${geo.C.x.toFixed(1)} ${geo.C.y.toFixed(1)})` });
        g.appendChild(el("circle", { r: small ? 9 : 12 }));
        g.appendChild(el("text", { "text-anchor": "middle", "dominant-baseline": "central" }, String(view.snapshot.calendar.sexagenary || "").charAt(0)));
        gLabel.appendChild(g);
      }
      markPalaces();
      renderLegend(arrows);
    }

    function markPalaces() {
      els.grid.classList.toggle("zw-busy", Boolean(view.layers.birth || view.layers.fly || view.layers.luck));
      const rel = view.layers.rel ? relationIndexes(view.snapshot.natal.palaces, view.selected) : null;
      const keep = rel ? new Set([rel.target, rel.opposite, rel.wealth, rel.career]) : null;
      els.grid.querySelectorAll(".palace").forEach((node) => {
        const index = Number(node.dataset.index);
        node.classList.toggle("zw-dim", Boolean(keep) && !keep.has(index));
        node.classList.toggle("zw-selected", index === view.selected);
      });
    }

    function renderLegend(arrows) {
      if (!els.legend) return;
      const palaces = view.snapshot.natal.palaces;
      const name = (index) => { const p = palaces.find((item) => item.index === index); return p ? palaceName(p.name) : ""; };
      const parts = [];
      const selected = palaces.find((p) => p.index === view.selected);
      if (selected) parts.push(`<span class="zw-lg-sel">所选 <b>${escapeHtml(palaceName(selected.name))}</b> ${escapeHtml(selected.heavenlyStem + selected.earthlyBranch)}</span>`);
      if (view.layers.rel) {
        const rel = relationIndexes(palaces, view.selected);
        parts.push(`<span><i class="zw-sw zw-sw-rel"></i>三方四正：对宫 ${escapeHtml(name(rel.opposite))} · 三合 ${escapeHtml(name(rel.wealth))}、${escapeHtml(name(rel.career))}</span>`);
      }
      if (view.layers.luck && !view.horoscope) parts.push('<span class="zw-lg-warn">大限·流年四化需先在“运限”中固定日期</span>');
      if (arrows.some((a) => a.kind)) parts.push('<span class="zw-lg-hua"><i class="zw-k-lu">禄</i><i class="zw-k-quan">权</i><i class="zw-k-ke">科</i><i class="zw-k-ji">忌</i>' + (view.layers.luck && view.horoscope ? '<em>实线 生年/飞化 · 长虚线 大限 · 点线 流年</em>' : "") + "</span>");
      els.legend.innerHTML = parts.join("");
    }

    /* 宫干飞化文字明细（详情面板内） */
    function renderFlyDetail() {
      if (!els.flyDetail || !view.snapshot) return;
      const palaces = view.snapshot.natal.palaces;
      const source = palaces.find((p) => p.index === view.selected);
      if (!source) { els.flyDetail.innerHTML = ""; return; }
      const items = flyingFrom(palaces, view.selected);
      const name = (index) => palaceName(palaces.find((p) => p.index === index).name);
      els.flyDetail.innerHTML = `<strong>宫干飞化 · ${escapeHtml(source.heavenlyStem)}干</strong><ul>${items.map((item) => `<li class="zw-k-${item.kind}"><b>${item.label}</b>${escapeHtml(item.star)} → ${item.self ? "<em>自化</em>" : escapeHtml(name(item.to))}</li>`).join("")}</ul>`;
    }

    /* 命盘总览卡 */
    function renderOverview() {
      const model = overviewModel(view.snapshot, view.horoscope);
      if (!model) { els.overview.hidden = true; return; }
      const snapshot = view.snapshot;
      const label = els.personLabel && els.personLabel.value.trim();
      const majors = model.soulMajors.length
        ? model.soulMajors.map((star) => `${escapeHtml(star.name)}${star.brightness ? `<em>${escapeHtml(star.brightness)}</em>` : ""}${star.mutagen ? `<i class="zw-dot zw-k-${KIND[star.mutagen]}">${escapeHtml(star.mutagen)}</i>` : ""}`).join("<span class='zw-sep'>·</span>")
        : `空宫<em>借${escapeHtml(model.borrowed.palace)}</em>`;
      const luck = model.luck
        ? `<div class="zw-ov-luck">
            <span class="zw-ov-date">${escapeHtml(model.luck.date)} · 虚岁 ${escapeHtml(model.luck.nominalAge)}</span>
            <span><small>大限</small><b>${escapeHtml(model.luck.decadalRange[0])}–${escapeHtml(model.luck.decadalRange[1])} 岁</b> ${escapeHtml(model.luck.decadalPalace)} · ${escapeHtml(model.luck.decadalGanzhi)}</span>
            <span><small>流年</small><b>${escapeHtml(model.luck.yearlyGanzhi)}</b> 流年命宫在 ${escapeHtml(model.luck.yearlyPalace)}</span>
            <span class="zw-ov-yh">${model.luck.yearlyMutagen.map((m) => `<i class="zw-k-${m.kind}">${m.label}</i>${escapeHtml(m.star || "—")}`).join(" ")}</span>
            <button class="zw-ov-link" type="button" data-zw-goto="luck">运限详情 →</button>
          </div>`
        : `<div class="zw-ov-luck"><span>尚未固定运限</span><button class="zw-ov-link" type="button" data-zw-goto="luck">选择日期 →</button></div>`;
      els.overview.innerHTML = `
        <div class="zw-ov-head">
          <div><small>命盘总览</small><h2>${escapeHtml(label || "匿名命盘")}</h2><p>${snapshot.input.gender === "male" ? "男" : "女"} · ${escapeHtml(snapshot.calendar.solarDate)} ${escapeHtml(snapshot.calendar.timeLabel)} · ${escapeHtml(snapshot.calendar.lunarDate)}</p></div>
        </div>
        <div class="zw-ov-grid">
          <div class="zw-ov-cell"><small>五行局</small><strong>${escapeHtml(model.fiveElementsClass)}</strong><span>命宫在${escapeHtml(model.soulBranch)} · 身宫在${escapeHtml(model.bodyBranch)}</span></div>
          <div class="zw-ov-cell"><small>命宫主星</small><strong class="zw-ov-stars">${majors}</strong><span>${model.borrowed ? `借星 ${escapeHtml(model.borrowed.stars.join("、") || "—")}` : "看命宫三方四正合参"}</span></div>
          <div class="zw-ov-cell"><small>命主 · 身主</small><strong>${escapeHtml(model.soulStar)}<span class="zw-sep">·</span>${escapeHtml(model.bodyStar)}</strong><span>${escapeHtml(snapshot.calendar.sexagenary)}</span></div>
          <div class="zw-ov-cell zw-ov-hua"><small>生年四化 · ${escapeHtml(model.birthStem)}干</small><ul>${model.birthMutagen.map((m) => `<li class="zw-k-${m.kind}"><i>${m.label}</i><b>${escapeHtml(m.star || "—")}</b><span>${escapeHtml(m.palace)}</span></li>`).join("")}</ul></div>
        </div>
        ${luck}`;
      els.overview.hidden = false;
    }
    els.overview.addEventListener("click", (event) => {
      const go = event.target.closest("[data-zw-goto]");
      if (go) setTab(go.dataset.zwGoto, { scroll: true });
    });

    /* 大限时间轴 */
    function renderTimeline() {
      if (!els.timeline) return;
      const items = decadalTimeline(view.snapshot, view.horoscope);
      els.timeline.innerHTML = items.map((item) => `<li class="${item.current ? "current" : ""}${item.yearly ? " yearly" : ""}"${item.current ? ' aria-current="step"' : ""}><b>${item.range[0]}–${item.range[1]}</b><span>${escapeHtml(item.name)}</span><small>${escapeHtml(item.ganzhi)}${item.yearly ? " · 流年" : ""}</small></li>`).join("");
    }

    /* 宫位标记（命 / 身）与入场 */
    function decoratePalaces(stagger) {
      const palaces = view.snapshot.natal.palaces;
      els.grid.querySelectorAll(".palace").forEach((node, i) => {
        const palace = palaces.find((p) => p.index === Number(node.dataset.index));
        node.classList.toggle("zw-soul", palace && palace.name === "命宫");
        node.classList.toggle("zw-body", Boolean(palace && palace.isBodyPalace));
        if (stagger && UI && motion()) {
          UI.enter(node, Math.min(i, 11));
          node.addEventListener("animationend", () => node.classList.remove("pm-enter"), { once: true });
        }
      });
    }

    /* 手机底部面板 */
    function openSheet() {
      if (!sheetMode()) return;
      view.sheetOpen = true;
      body.classList.add("zw-sheet-open");
      els.detailCard.setAttribute("aria-modal", "false");
      els.detailCard.style.transform = "";
      root.requestAnimationFrame(() => {
        const top = els.viewport.getBoundingClientRect().top + root.scrollY - 10;
        if (Math.abs(top - root.scrollY) > 4) root.scrollTo({ top, behavior: motion() ? "smooth" : "auto" });
      });
    }
    function closeSheet() {
      if (!view.sheetOpen) return;
      view.sheetOpen = false;
      body.classList.remove("zw-sheet-open");
      els.detailCard.style.transform = "";
    }
    function goPalace(index) {
      const node = els.grid.querySelector(`.palace[data-index="${index}"]`);
      if (node) node.click();
    }
    els.grid.addEventListener("click", (event) => {
      if (event.target.closest(".palace") && sheetMode()) openSheet();
    });
    els.sheetClose.addEventListener("click", closeSheet);
    els.sheetPrev.addEventListener("click", () => goPalace(adjacentIndex(view.selected, -1)));
    els.sheetNext.addEventListener("click", () => goPalace(adjacentIndex(view.selected, 1)));
    doc.addEventListener("keydown", (event) => { if (event.key === "Escape" && view.sheetOpen) closeSheet(); });
    let touch = null;
    els.detailCard.addEventListener("touchstart", (event) => {
      if (!view.sheetOpen || event.touches.length !== 1) return;
      touch = { x: event.touches[0].clientX, y: event.touches[0].clientY, dy: 0, atTop: els.detailCard.scrollTop <= 0 };
    }, { passive: true });
    els.detailCard.addEventListener("touchmove", (event) => {
      if (!touch) return;
      const dx = event.touches[0].clientX - touch.x, dy = event.touches[0].clientY - touch.y;
      if (touch.atTop && dy > 0 && Math.abs(dy) > Math.abs(dx)) {
        touch.dy = dy;
        els.detailCard.style.transform = `translateY(${Math.min(dy, 400)}px)`;
      }
    }, { passive: true });
    els.detailCard.addEventListener("touchend", (event) => {
      if (!touch) return;
      const t = event.changedTouches[0];
      const dx = t.clientX - touch.x, dy = t.clientY - touch.y;
      const pulled = touch.dy;
      touch = null;
      els.detailCard.style.transform = "";
      if (pulled > 80) { closeSheet(); return; }
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) goPalace(adjacentIndex(view.selected, dx < 0 ? 1 : -1));
    }, { passive: true });
    if (mq && mq.addEventListener) mq.addEventListener("change", () => { if (!sheetMode()) closeSheet(); draw(false); });
    if (root.MutationObserver) {
      new root.MutationObserver(() => { if (!sheetMode()) closeSheet(); root.requestAnimationFrame(() => draw(false)); }).observe(html, { attributes: true, attributeFilter: ["data-density", "data-theme"] });
    }
    if (root.ResizeObserver) new root.ResizeObserver(() => draw(false)).observe(els.grid);

    /* AI 设置摘要 */
    const syncMode = () => { if (els.aiMode && els.aiModeSummary) els.aiModeSummary.textContent = els.aiMode.options[els.aiMode.selectedIndex]?.text || ""; };
    if (els.aiMode) els.aiMode.addEventListener("change", syncMode);
    syncMode();

    if (UI) UI.smoothDetails(".zw-more,.zw-ai-settings,.zw-footer,.key-box");

    /* 接收 ziwei-page.js 广播 */
    root.addEventListener("ziwei:view", (event) => {
      const detail = event.detail || {};
      const reason = detail.reason;
      view.snapshot = detail.snapshot || null;
      view.horoscope = detail.horoscope || null;
      view.selected = detail.selectedPalaceIndex;
      if (reason === "reset") {
        body.classList.remove("zw-cast");
        setEntryCollapsed(false);
        els.overview.hidden = true;
        els.tabs.hidden = true;
        closeSheet();
        if (svg) svg.innerHTML = "";
        view.lastKey = "";
        applyPanels();
        return;
      }
      if (!view.snapshot) return;
      if (reason === "snapshot") {
        body.classList.add("zw-cast");
        els.tabs.hidden = false;
        els.entrySummaryText.textContent = entrySummary(view.snapshot);
        setEntryCollapsed(true);
        decoratePalaces(true);
        renderOverview();
        renderTimeline();
        renderFlyDetail();
        view.lastKey = "";
        setTab("natal", { animate: false });
        if (UI && motion()) { UI.enter(els.overview, 0); UI.enter(els.tabs, 1); }
        if (!view.horoscope && els.horoscopeButton && els.targetDate) {
          // 默认固定“今天”的大限与流年（与手动点击“查看运限”完全相同）。
          root.setTimeout(() => { if (view.snapshot && !view.horoscope) els.horoscopeButton.click(); }, 0);
        }
        return;
      }
      if (reason === "palace") {
        renderFlyDetail();
        if (view.tab !== "natal" && body.classList.contains("zw-cast")) setTab("natal");
        root.requestAnimationFrame(() => draw(true));
        return;
      }
      if (reason === "horoscope") {
        renderOverview();
        renderTimeline();
        root.requestAnimationFrame(() => draw(true));
      }
    });

    applyPanels();
  }

  return Object.freeze({
    LABELS, LAYER_IDS, DEFAULT_LAYERS, LAYER_STORAGE_KEY, GRID_POS,
    starPalaceIndex, mutagenTargets, flyingFrom, relationIndexes, normalizeLayers, toggleLayer,
    buildArrows, decadalTimeline, overviewModel, adjacentIndex, mount,
  });
});
