/* 八字分析页 · 只读双可视化模块（bazi-visuals.js）
 * 1) #baziRelationVisual：日主能量与流通图（星盘 + 2×4 四柱位次流通 + 2×4 合冲刑破）
 * 2) #baziLuckVisual：大运流年起伏走势图（方案 A 承接式累积 + 跨年对比 + 与选运双向联动）
 * 严格只读 currentBazi 与 BaziEngine，不改动排盘、格局喜用、AI 或本地记录逻辑。 */
(function (root, factory) {
  'use strict';
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.BaziVisuals = api;
  if (root.document && typeof root.addEventListener === 'function') {
    if (root.document.readyState === 'loading') {
      root.document.addEventListener('DOMContentLoaded', api.mount);
    } else {
      api.mount();
    }
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const GEN_CYCLE = ['木', '火', '土', '金', '水'];
  const WX_GEN = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
  const WX_CTRL = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };
  const STEMS = '甲乙丙丁戊己庚辛壬癸';
  const BRANCHES = '子丑寅卯辰巳午未申酉戌亥';
  const GZ60 = Array.from({ length: 60 }, (_, i) => STEMS[i % 10] + BRANCHES[i % 12]);
  const PILLAR_KEYS = ['year', 'month', 'day', 'hour'];
  const PILLAR_NAMES = ['年柱', '月柱', '日柱', '时柱'];
  const STRENGTH_WEIGHTS = {
    yearStem: 6,
    monthStem: 10,
    hourStem: 9,
    yearBranch: 8,
    monthBranch: 40,
    dayBranch: 15,
    hourBranch: 12
  };
  const SECTOR_ANGLES = [-162, -90, -18, 54, 126];
  const CX = 370;
  const CY = 290;

  const PREV_MAP = { '0': '首年无对照', p: '上升', n: '下降', m: '利弊并见', u: '持平', x: '暂缺结论' };
  const DIR_PRO_MAP = { p: '偏吉', n: '偏凶', m: '吉凶并见', u: '平稳', pending: '待判' };
  const DIR_STD_MAP = { p: '顺利', n: '多留心', m: '有好有坏', u: '平稳', pending: '待定' };
  const DIST_LABELS = ['同柱上下（距 0）', '紧贴邻柱（距 1）', '隔柱作用（距 2）', '年时遥隔（距 3）'];
  const STEM_IMAGERY = {
    甲: '参天大木',
    乙: '花草藤木',
    丙: '旭日骄阳',
    丁: '烛火明灯',
    戊: '高山厚土',
    己: '田园湿土',
    庚: '刀剑矿金',
    辛: '珠玉首饰',
    壬: '江河大海',
    癸: '雨露甘霖'
  };
  const STEM_INK_COLORS = {
    甲: { c1: '#256f54', c2: '#5ea183' },
    乙: { c1: '#3c8a66', c2: '#7ab596' },
    丙: { c1: '#c85a2b', c2: '#e29d48' },
    丁: { c1: '#b54337', c2: '#de834c' },
    戊: { c1: '#8f6428', c2: '#c59d56' },
    己: { c1: '#9e7540', c2: '#c9a66b' },
    庚: { c1: '#4d5d6e', c2: '#8998a8' },
    辛: { c1: '#8b734b', c2: '#cbb17b' },
    壬: { c1: '#265378', c2: '#5d91b5' },
    癸: { c1: '#357482', c2: '#73b0bd' }
  };

  const PALETTE = {
    ink: '#263d34',
    textDark: '#211a12',
    muted: '#647269',
    gold: '#9c722f',
    line: '#cbbba0',
    paper: '#faf5ea',
    pos: '#256f54',
    posSoft: 'rgba(37, 111, 84, 0.16)',
    neg: '#b54337',
    negSoft: 'rgba(181, 67, 55, 0.16)',
    sec: '#2a7b82',
    secSoft: 'rgba(42, 123, 130, 0.14)',
    neuSoft: 'rgba(134, 118, 98, 0.12)',
    mix: '#b7791f',
    drain: '#c25929',
    bronze: '#8c5d2f',
    ctrl: '#3f5785'
  };

  const ELEMENT_AURAS = {
    木: { main: '#2f855a', light: '#a7f3d0', stroke: '#226b48' },
    火: { main: '#f59e0b', light: '#fef3c7', stroke: '#d97706' },
    土: { main: '#b5843a', light: '#f6e7c4', stroke: '#8a5d25' },
    金: { main: '#c59b38', light: '#fef6d8', stroke: '#8f6c22' },
    水: { main: '#2c6896', light: '#cfe8fa', stroke: '#215075' }
  };

  const uiState = {
    chartKey: '',
    relLayer: 'flow',
    showRemote: false,
    motion: !(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches),
    selectedNodeId: null,
    selectedSectorKey: null,
    selectedEdgeId: null,
    relZoomed: false,
    luckZoomDecade: null,
    showWicks: true,
    selectedDecadeIndex: 0,
    selectedYear: null,
    hoverYear: null,
    compare: null
  };

  let mounted = false;
  let lastSnapshot = null;
  let lastLuckContext = null;
  const luckModelCache = { key: '', model: null };
  let luckJobToken = 0;

  function isCompactViewport() {
    return typeof root.innerWidth === 'number' && root.innerWidth > 0 && root.innerWidth <= 640;
  }

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function round2(v) {
    return Math.round(v * 100) / 100;
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function svgEl(tag, attrs, children) {
    const ns = 'http://www.w3.org/2000/svg';
    const el = root.document.createElementNS(ns, tag);
    if (attrs) {
      Object.keys(attrs).forEach(k => {
        if (attrs[k] !== undefined && attrs[k] !== null) el.setAttribute(k, String(attrs[k]));
      });
    }
    if (typeof children === 'string') {
      el.textContent = children;
    } else if (Array.isArray(children)) {
      children.forEach(c => { if (c) el.appendChild(c); });
    }
    return el;
  }

  function polar(cx, cy, r, deg) {
    const rad = deg * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad), rad };
  }

  function annularSectorPath(cx, cy, rIn, rOut, a0Deg, a1Deg) {
    const p1 = polar(cx, cy, rOut, a0Deg);
    const p2 = polar(cx, cy, rOut, a1Deg);
    const p3 = polar(cx, cy, rIn, a1Deg);
    const p4 = polar(cx, cy, rIn, a0Deg);
    const large = Math.abs(a1Deg - a0Deg) > 180 ? 1 : 0;
    return [
      `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`,
      `A ${rOut} ${rOut} 0 ${large} 1 ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`,
      `L ${p3.x.toFixed(1)} ${p3.y.toFixed(1)}`,
      `A ${rIn} ${rIn} 0 ${large} 0 ${p4.x.toFixed(1)} ${p4.y.toFixed(1)}`,
      'Z'
    ].join(' ');
  }

  function hiddenRatioPercents(count) {
    if (count <= 1) return [100];
    if (count === 2) return [70, 30];
    return [70, 20, 10];
  }

  function nodeRadius(weight) {
    if (weight >= 35) return 24;
    if (weight >= 14) return 19;
    if (weight >= 11) return 18;
    if (weight >= 9.5) return 17;
    if (weight >= 8.5) return 16.5;
    if (weight >= 7.5) return 16;
    return 15;
  }

  function isTechnicalMode() {
    const doc = root.document;
    return !!(doc && doc.body && doc.body.getAttribute('data-display-mode') === 'professional');
  }

  function chartFingerprint(data) {
    if (!data || !data.pillars) return '';
    return JSON.stringify([
      data.pillars,
      data.gender || '',
      data.dayStem || '',
      data.time && data.time.used,
      data.useful && data.useful.decision && data.useful.decision.version
    ]);
  }

  function getEngineRef() {
    const eng = root.BaziEngine;
    const c = (eng && eng.constants) || {};
    return {
      eng,
      STEM_WX: c.STEM_WX || root.STEM_WX || {},
      BRANCH_WX: c.BRANCH_WX || root.BRANCH_WX || {},
      HIDDEN: c.HIDDEN || root.HIDDEN || {},
      tenGod: (eng && eng.tenGod) || root.tenGod || (() => '')
    };
  }

  // ---------- Relation Model Extraction from Live BaziProfile ----------
  function getUsefulSummary(data) {
    if (typeof root.usefulDecisionView === 'function') {
      return root.usefulDecisionView(data);
    }
    const u = data.useful || {};
    return {
      primary: u.primaryUse || u.use || [],
      secondary: u.secondaryUse || [],
      avoid: u.avoid || [],
      routes: (u.decision && u.decision.routes) || []
    };
  }

  function buildSectorMap(dayElement, scores, usefulView) {
    const idx = GEN_CYCLE.indexOf(dayElement);
    const defs = [
      { key: 'resource', name: '印星', rel: '生我', wx: GEN_CYCLE[(idx + 4) % 5], gods: ['正印', '偏印'] },
      { key: 'companion', name: '比劫', rel: '同我', wx: GEN_CYCLE[idx], gods: ['比肩', '劫财'] },
      { key: 'output', name: '食伤', rel: '我生', wx: GEN_CYCLE[(idx + 1) % 5], gods: ['食神', '伤官'] },
      { key: 'wealth', name: '财星', rel: '我克', wx: GEN_CYCLE[(idx + 2) % 5], gods: ['正财', '偏财'] },
      { key: 'officer', name: '官杀', rel: '克我', wx: GEN_CYCLE[(idx + 3) % 5], gods: ['正官', '七杀'] }
    ];
    const pri = usefulView.primary || [];
    const sec = usefulView.secondary || [];
    const avd = usefulView.avoid || [];
    return defs.map(d => {
      let role = 'neutral';
      let roleLabel = '中';
      if (pri.indexOf(d.wx) >= 0) { role = 'primaryUse'; roleLabel = '主用'; }
      else if (sec.indexOf(d.wx) >= 0) { role = 'secondaryUse'; roleLabel = '佐用'; }
      else if (avd.indexOf(d.wx) >= 0) { role = 'avoid'; roleLabel = '忌'; }
      return Object.assign({}, d, {
        score: round2((scores && scores[d.wx]) || 0),
        role,
        roleLabel
      });
    });
  }

  function buildNodes(data, sectors, engRef) {
    const pa = data.patternAnalysis || {};
    const parts = (pa.strengthScore && pa.strengthScore.parts) || [];
    const partMap = {};
    parts.forEach(pt => { partMap[pt.label] = pt; });

    const sectorByWx = {};
    sectors.forEach(s => { sectorByWx[s.wx] = s.key; });

    const defs = [
      { id: 'yearStem', pillar: 'year', pillarLabel: '年干', kind: '干', char: data.pillars.year[0], partKey: '年干' },
      { id: 'monthStem', pillar: 'month', pillarLabel: '月干', kind: '干', char: data.pillars.month[0], partKey: '月干' },
      { id: 'hourStem', pillar: 'hour', pillarLabel: '时干', kind: '干', char: data.pillars.hour[0], partKey: '时干' },
      { id: 'yearBranch', pillar: 'year', pillarLabel: '年支', kind: '支', char: data.pillars.year[1], partKey: '年支' },
      { id: 'monthBranch', pillar: 'month', pillarLabel: '月令', kind: '支', char: data.pillars.month[1], partKey: '月令', isMonthCommand: true },
      { id: 'dayBranch', pillar: 'day', pillarLabel: '日支', kind: '支', char: data.pillars.day[1], partKey: '日支' },
      { id: 'hourBranch', pillar: 'hour', pillarLabel: '时支', kind: '支', char: data.pillars.hour[1], partKey: '时支' }
    ];

    return defs.map(d => {
      const pt = partMap[d.partKey] || {};
      const weight = Number.isFinite(pt.weight) ? pt.weight : (STRENGTH_WEIGHTS[d.id] || 0);
      if (d.kind === '干') {
        const wx = engRef.STEM_WX[d.char];
        return {
          id: d.id,
          pillar: d.pillar,
          pillarLabel: d.pillarLabel,
          kind: d.kind,
          char: d.char,
          element: wx,
          sectorKey: sectorByWx[wx],
          tenGod: engRef.tenGod(data.dayStem, d.char),
          weight,
          supportScore: round2(pt.score || 0),
          ratio: pt.ratio || 0,
          attacked: !!pt.attacked,
          attacks: pt.attacks || [],
          groupChange: pt.groupChange || null,
          stemChange: pt.stemChange || null,
          hidden: []
        };
      }
      const hiddenStems = engRef.HIDDEN[d.char] || [];
      const pcts = hiddenRatioPercents(hiddenStems.length);
      const hidden = hiddenStems.map((h, i) => ({
        stem: h,
        element: engRef.STEM_WX[h],
        tenGod: engRef.tenGod(data.dayStem, h),
        pct: pcts[i]
      }));
      const mainStem = hiddenStems[0];
      const wx = mainStem ? engRef.STEM_WX[mainStem] : engRef.BRANCH_WX[d.char];
      return {
        id: d.id,
        pillar: d.pillar,
        pillarLabel: d.pillarLabel,
        kind: d.kind,
        char: d.char,
        element: engRef.BRANCH_WX[d.char],
        sectorKey: sectorByWx[wx],
        tenGod: mainStem ? engRef.tenGod(data.dayStem, mainStem) : '',
        isMonthCommand: !!d.isMonthCommand,
        weight,
        supportScore: round2(pt.score || 0),
        ratio: pt.ratio || 0,
        attacked: !!pt.attacked,
        attacks: pt.attacks || [],
        groupChange: pt.groupChange || null,
        stemChange: pt.stemChange || null,
        hidden
      };
    });
  }

  function resolveNodeId(pillar, kind, nodes) {
    const found = nodes.find(n => n.pillar === pillar && n.kind === kind);
    if (found) return found.id;
    if (pillar === 'day' && kind === '干') return 'dayMaster';
    return null;
  }

  function resolveOutputAction(sectors, strength) {
    const outSec = (sectors || []).find(s => s.key === 'output');
    const role = (outSec && outSec.role) || 'neutral';
    if (role === 'primaryUse' || role === 'secondaryUse') return '泄秀';
    if (role === 'avoid') return '泄气';
    const st = String(strength || '');
    if (/旺|强/.test(st)) return '泄秀';
    if (/弱/.test(st)) return '泄气';
    return '生泄';
  }

  function buildFlowEdges(data, nodes, usefulView, outputAction) {
    const pa = data.patternAnalysis || {};
    const rawSteps = [];
    ((pa.interactionFlow && pa.interactionFlow.steps) || []).forEach(s => {
      rawSteps.push(Object.assign({}, s, { route: '主格作用链', sourceType: 'engine-chain' }));
    });
    ((usefulView && usefulView.routes) || []).forEach(r => {
      (r.steps || []).forEach(s => {
        rawSteps.push(Object.assign({}, s, {
          route: r.name,
          sourceType: r.priority === 'main-remedy' ? 'remedy-chain' : 'route-chain'
        }));
      });
    });

    const seen = new Set();
    const edges = [];
    rawSteps.forEach(s => {
      if (!s.left || !s.right) return;
      const fromId = resolveNodeId(s.left.pillar, s.left.kind, nodes);
      const toId = resolveNodeId(s.right.pillar, s.right.kind, nodes);
      if (!fromId || !toId || fromId === toId) return;
      const key = `${fromId}->${toId}:${s.action}:${!!s.active}`;
      if (seen.has(key)) return;
      seen.add(key);
      edges.push({
        id: `e_${edges.length + 1}`,
        fromId,
        toId,
        fromLabel: s.left.text,
        toLabel: s.right.text,
        action: s.action || '作用于',
        active: s.active !== false,
        status: s.status || '',
        text: s.text || '',
        route: s.route,
        sourceType: s.sourceType
      });
    });

    nodes.forEach(n => {
      if (n.kind === '干') {
        const rel = GEN_CYCLE.indexOf(n.element) - GEN_CYCLE.indexOf(data.dayElement);
        const mod = (rel + 5) % 5;
        let action = '助旺', fromId = n.id, toId = 'dayMaster';
        if (mod === 4) { action = '生助'; fromId = n.id; toId = 'dayMaster'; }
        else if (mod === 1) { action = outputAction || '生泄'; fromId = 'dayMaster'; toId = n.id; }
        else if (mod === 2) { action = '耗力'; fromId = 'dayMaster'; toId = n.id; }
        else if (mod === 3) { action = '克制'; fromId = n.id; toId = 'dayMaster'; }
        edges.push({
          id: `dm_${n.id}`,
          fromId,
          toId,
          fromLabel: fromId === 'dayMaster' ? `${data.dayStem}日主` : n.char + n.tenGod,
          toLabel: toId === 'dayMaster' ? `${data.dayStem}日主` : n.char + n.tenGod,
          action,
          active: !n.stemChange || n.stemChange.effect !== 'bind',
          status: '原局干透直联',
          text: `${fromId === 'dayMaster' ? `${data.dayStem}日主` : `${n.pillarLabel}${n.char}${n.tenGod}`} ${action} ${toId === 'dayMaster' ? `${data.dayStem}日主` : `${n.pillarLabel}${n.char}${n.tenGod}`}`,
          route: '原局干支与日主关系',
          sourceType: 'daymaster-link'
        });
      }
    });
    return edges;
  }

  function buildInteractions(data, nodes) {
    const inter = (data.patternAnalysis && data.patternAnalysis.interactions) || {};
    const list = [];
    (inter.branchPairs || []).forEach((bp, i) => {
      const leftId = resolveNodeId(bp.leftKey, '支', nodes);
      const rightId = resolveNodeId(bp.rightKey, '支', nodes);
      if (!leftId || !rightId) return;
      list.push({
        id: `bp_${i}`,
        kind: 'branch',
        leftId,
        rightId,
        type: bp.type,
        target: bp.target || '',
        effect: bp.effect || '',
        active: bp.active !== false,
        status: bp.status || '',
        text: bp.text || ''
      });
    });
    (inter.stemCombines || []).forEach((sc, i) => {
      const leftId = resolveNodeId(sc.leftKey, '干', nodes);
      const rightId = resolveNodeId(sc.rightKey, '干', nodes);
      if (!leftId || !rightId) return;
      list.push({
        id: `sc_${i}`,
        kind: 'stem',
        leftId,
        rightId,
        type: '天干合',
        target: sc.target || '',
        effect: sc.effect || '',
        active: sc.active !== false,
        status: sc.status || '',
        text: sc.text || ''
      });
    });
    return list;
  }

  function buildRelationModel(data) {
    const engRef = getEngineRef();
    const pa = data.patternAnalysis || {};
    const usefulView = getUsefulSummary(data);
    const sectors = buildSectorMap(data.dayElement, data.scores || {}, usefulView);
    const nodes = buildNodes(data, sectors, engRef);
    const strengthStr = data.strength || pa.strength || '';
    const outputAction = resolveOutputAction(sectors, strengthStr);
    const flowEdges = buildFlowEdges(data, nodes, usefulView, outputAction);
    const interactions = buildInteractions(data, nodes);
    const ss = pa.strengthScore || {};
    return {
      meta: {
        pillars: data.pillars,
        dayStem: data.dayStem,
        dayElement: data.dayElement,
        imagery: STEM_IMAGERY[data.dayStem] || '',
        strength: strengthStr,
        supportScore: round2(ss.support || 0),
        seasonal: ss.seasonal && ss.seasonal.available ? {
          commander: ss.seasonal.commander,
          elapsedDays: ss.seasonal.elapsedDays,
          effect: ss.seasonal.effect
        } : null,
        phenomena: (pa.elementPhenomena || []).map(x => x.canonicalName || x.name)
      },
      sectors,
      nodes,
      flowEdges,
      interactions
    };
  }

  function computeWeightedSectorShares(model) {
    const rawByWx = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
    let totalWeight = 0;
    model.nodes.forEach(node => {
      const w = Number.isFinite(node.weight) ? node.weight : (STRENGTH_WEIGHTS[node.id] || 0);
      if (w <= 0) return;
      totalWeight += w;
      if (node.kind === '支' && Array.isArray(node.hidden) && node.hidden.length) {
        node.hidden.forEach(h => {
          if (rawByWx[h.element] !== undefined) {
            rawByWx[h.element] += w * ((Number(h.pct) || 0) / 100);
          }
        });
      } else if (rawByWx[node.element] !== undefined) {
        rawByWx[node.element] += w;
      }
    });
    const byKey = {};
    let maxPct = 1;
    model.sectors.forEach(sec => {
      const raw = rawByWx[sec.wx] || 0;
      const pct = totalWeight > 0 ? (raw / totalWeight) * 100 : 0;
      byKey[sec.key] = { raw, pct };
      if (pct > maxPct) maxPct = pct;
    });
    return { byKey, maxPct, totalWeight };
  }

  function computeSectorVisualGeometry(pct, maxPct) {
    const rIn = 55;
    const pPct = Number(pct) || 0;
    if (pPct <= 0.05) {
      return {
        tier: 'empty',
        rIn,
        rOut: 64,
        halfSpan: 20,
        labelR: 82,
        fillOpacity: 0.45,
        strokeDash: '3 2.5',
        strokeWidth: 1.15
      };
    }
    const absNorm = clamp(pPct / 55, 0, 1);
    const relNorm = maxPct > 0 ? clamp(pPct / maxPct, 0, 1) : 0;
    const blend = 0.65 * absNorm + 0.35 * relNorm;
    const p = Math.pow(blend, 0.78);
    const rOut = round2(70 + p * 68);
    const halfSpan = round2(22 + p * 12.5);
    const labelR = rOut >= 96
      ? round2(Math.min(102, rIn + (rOut - rIn) * 0.50))
      : round2(Math.max(84, rOut + 14));
    const fillOpacity = round2(0.66 + p * 0.34);
    const strokeWidth = p >= 0.7 ? 1.65 : 1.25;
    const tier = p >= 0.65 ? 'strong' : (p >= 0.3 ? 'mid' : 'weak');
    return { tier, rIn, rOut, halfSpan, labelR, fillOpacity, strokeDash: null, strokeWidth };
  }

  function computeNodePositions(model, compact) {
    const bySector = {};
    model.sectors.forEach((s, idx) => { bySector[s.key] = { idx, angle: SECTOR_ANGLES[idx], nodes: [] }; });
    model.nodes.forEach(n => {
      if (bySector[n.sectorKey]) bySector[n.sectorKey].nodes.push(n);
    });
    const pos = { dayMaster: { x: CX, y: CY, r: 46, angle: -90 } };
    Object.values(bySector).forEach(group => {
      const list = group.nodes;
      const n = list.length;
      let offsets = [0];
      let radii = compact ? [186] : [216];
      if (compact) {
        if (n === 2) { offsets = [-19, 19]; radii = [188, 188]; }
        else if (n === 3) { offsets = [-28, 0, 28]; radii = [186, 200, 186]; }
        else if (n >= 4) { offsets = [-34, -11.5, 11.5, 34]; radii = [184, 204, 204, 184]; }
      } else {
        if (n === 2) { offsets = [-17, 17]; radii = [216, 216]; }
        else if (n === 3) { offsets = [-25, 0, 25]; radii = [214, 224, 214]; }
        else if (n >= 4) { offsets = [-31, -10.5, 10.5, 31]; radii = [210, 234, 234, 210]; }
      }
      list.forEach((node, i) => {
        const deg = group.angle + (offsets[i] || 0);
        const dist = radii[i] || (compact ? 186 : 216);
        const pt = polar(CX, CY, dist, deg);
        pos[node.id] = { x: pt.x, y: pt.y, r: nodeRadius(node.weight), angle: deg, rad: pt.rad, node };
      });
    });
    return pos;
  }

  function roleStyle(role) {
    if (role === 'primaryUse') return { fill: PALETTE.posSoft, stroke: PALETTE.pos, text: PALETTE.pos };
    if (role === 'secondaryUse') return { fill: PALETTE.secSoft, stroke: PALETTE.sec, text: PALETTE.sec };
    if (role === 'avoid') return { fill: PALETTE.negSoft, stroke: PALETTE.neg, text: PALETTE.neg };
    return { fill: PALETTE.neuSoft, stroke: PALETTE.line, text: PALETTE.muted };
  }

  function buildDisplayFlowEdges(model) {
    const dmLinks = {};
    const chains = [];
    model.flowEdges.forEach(e => {
      if (e.sourceType === 'daymaster-link') {
        const nodeId = e.fromId === 'dayMaster' ? e.toId : e.fromId;
        dmLinks[nodeId] = e;
      } else {
        chains.push(Object.assign({}, e));
      }
    });

    const outputAction = resolveOutputAction(model.sectors, model.meta.strength);
    const relMap = {
      resource: { toDM: true, dry: '生助', wet: '生助' },
      companion: { toDM: true, dry: '助旺', wet: '助旺' },
      output: { toDM: false, dry: outputAction, wet: outputAction },
      wealth: { toDM: false, dry: '耗力', wet: '耗力' },
      officer: { toDM: true, dry: '克制', wet: '克压' }
    };

    const edges = [];
    model.nodes.forEach(node => {
      const spec = relMap[node.sectorKey];
      if (!spec) return;
      const existing = dmLinks[node.id];
      if (existing) {
        edges.push(Object.assign({}, existing, {
          nodeId: node.id,
          sectorKey: node.sectorKey,
          weight: node.weight,
          toDM: existing.toId === 'dayMaster',
          isDrain: existing.fromId === 'dayMaster' || node.sectorKey === 'officer'
        }));
        return;
      }
      const action = node.kind === '干' ? spec.dry : spec.wet;
      const fromId = spec.toDM ? node.id : 'dayMaster';
      const toId = spec.toDM ? 'dayMaster' : node.id;
      const isBound = !!(node.groupChange && node.groupChange.status === '合绊');
      edges.push({
        id: `dm_${node.id}`,
        nodeId: node.id,
        sectorKey: node.sectorKey,
        fromId,
        toId,
        fromLabel: spec.toDM ? `${node.pillarLabel}${node.char}` : `${model.meta.dayStem}日主`,
        toLabel: spec.toDM ? `${model.meta.dayStem}日主` : `${node.pillarLabel}${node.char}`,
        action,
        toDM: spec.toDM,
        active: !isBound,
        weight: node.weight,
        isDrain: !spec.toDM || node.sectorKey === 'officer',
        status: isBound ? '合绊牵制，流通受阻' : `原局干支流通（权重 ${node.weight}）`,
        text: isBound
          ? `${node.pillarLabel}${node.char} 受「${node.groupChange.name}」牵制`
          : `${spec.toDM ? node.pillarLabel + node.char : model.meta.dayStem + '日主'} ${action} ${spec.toDM ? model.meta.dayStem + '日主' : node.pillarLabel + node.char}`,
        route: '原局干支与日主关系',
        sourceType: 'daymaster-ambient'
      });
    });

    chains.forEach(c => edges.push(c));
    return edges;
  }

  function semanticStyle(action, active) {
    if (!active) {
      return { color: PALETTE.neg, marker: 'url(#bzvArrowNeg)', shape: 'orb', durFactor: 1.05 };
    }
    if (/^(生助|生|生扶|紧贴生|坐生|隔弱生|通关顺生|隔生)$/.test(action)) {
      return { color: PALETTE.pos, marker: 'url(#bzvArrowPos)', shape: 'orb', durFactor: 1.0 };
    }
    if (/^(助旺|比助|同气|扶助|遥助|隔助)$/.test(action)) {
      return { color: PALETTE.gold, marker: 'url(#bzvArrowGold)', shape: 'twin', durFactor: 0.95 };
    }
    if (action === '泄秀') {
      return { color: PALETTE.sec, marker: 'url(#bzvArrowSec)', shape: 'drop', durFactor: 0.9 };
    }
    if (action === '泄气') {
      return { color: PALETTE.drain, marker: 'url(#bzvArrowDrain)', shape: 'drop', durFactor: 0.94 };
    }
    if (/^(生泄|坐泄|隔泄)$/.test(action)) {
      return { color: PALETTE.bronze, marker: 'url(#bzvArrowBronze)', shape: 'drop', durFactor: 0.96 };
    }
    if (action === '耗力') {
      return { color: PALETTE.bronze, marker: 'url(#bzvArrowBronze)', shape: 'pill', durFactor: 1.05 };
    }
    if (/^(克压|克制|紧贴克|盖头|截脚|隔克|遥克)$/.test(action)) {
      return { color: PALETTE.neg, marker: 'url(#bzvArrowNeg)', shape: 'dart', durFactor: 0.78 };
    }
    if (action === '制' || action === '盖头·制') {
      return { color: PALETTE.ctrl, marker: 'url(#bzvArrowCtrl)', shape: 'dart', durFactor: 0.84 };
    }
    if (/^(六合|合化|自刑)$/.test(action)) {
      const isHarm = action === '自刑';
      return {
        color: isHarm ? PALETTE.neg : PALETTE.sec,
        marker: isHarm ? 'url(#bzvArrowNeg)' : 'url(#bzvArrowSec)',
        shape: 'twin',
        durFactor: 1.0
      };
    }
    return { color: PALETTE.gold, marker: 'url(#bzvArrowGold)', shape: 'orb', durFactor: 1.0 };
  }

  function appendMotionShape(parent, pathD, st, sizeScale, durSec, beginSec, fadeTail) {
    const s = sizeScale || 1;
    const makeNode = (delayOffset) => {
      let el;
      if (st.shape === 'dart') {
        el = svgEl('polygon', {
          points: `${(-5.6 * s).toFixed(1)},${(-3.5 * s).toFixed(1)} ${(5.6 * s).toFixed(1)},0 ${(-5.6 * s).toFixed(1)},${(3.5 * s).toFixed(1)} ${(-2.4 * s).toFixed(1)},0`,
          fill: st.color,
          filter: 'url(#bzvSoftGlow)',
          opacity: 0.95
        });
      } else if (st.shape === 'drop') {
        el = svgEl('path', {
          d: `M ${(-4.5 * s).toFixed(1)},${(-2.3 * s).toFixed(1)} Q ${(1.0 * s).toFixed(1)},${(-2.7 * s).toFixed(1)} ${(5.5 * s).toFixed(1)},0 Q ${(1.0 * s).toFixed(1)},${(2.7 * s).toFixed(1)} ${(-4.5 * s).toFixed(1)},${(2.3 * s).toFixed(1)} Q ${(-2.4 * s).toFixed(1)},0 ${(-4.5 * s).toFixed(1)},${(-2.3 * s).toFixed(1)} Z`,
          fill: st.color,
          filter: 'url(#bzvSoftGlow)',
          opacity: 0.92
        });
      } else if (st.shape === 'pill') {
        el = svgEl('rect', {
          x: (-4.2 * s).toFixed(1),
          y: (-2.2 * s).toFixed(1),
          width: (8.4 * s).toFixed(1),
          height: (4.4 * s).toFixed(1),
          rx: (2.2 * s).toFixed(1),
          fill: st.color,
          filter: 'url(#bzvSoftGlow)',
          opacity: 0.92
        });
      } else {
        el = svgEl('circle', {
          cx: 0, cy: 0, r: (3.2 * s).toFixed(1),
          fill: st.color,
          filter: 'url(#bzvSoftGlow)',
          opacity: 0.94
        });
      }
      const durNum = Math.max(0.1, Number(durSec) || 2);
      const rawOff = (Number(beginSec) || 0) + (delayOffset || 0);
      const negOff = -(((rawOff % durNum) + durNum) % durNum);
      const motAttrs = {
        dur: `${durNum.toFixed(2)}s`,
        begin: `${negOff.toFixed(2)}s`,
        repeatCount: 'indefinite',
        path: pathD
      };
      if (st.shape === 'dart' || st.shape === 'drop' || st.shape === 'pill') {
        motAttrs.rotate = 'auto';
      }
      el.appendChild(svgEl('animateMotion', motAttrs));
      if (fadeTail) {
        el.appendChild(svgEl('animate', {
          attributeName: 'opacity',
          values: '0;0.95;0.95;0',
          keyTimes: '0;0.18;0.84;1',
          dur: `${durNum.toFixed(2)}s`,
          begin: `${negOff.toFixed(2)}s`,
          repeatCount: 'indefinite'
        }));
      }
      parent.appendChild(el);
    };
    makeNode(0);
    if (st.shape === 'twin' && !fadeTail) {
      makeNode(0.16);
    }
  }

  // ---------- 2x4 Matrix Position Geometry & Builder ----------
  function computeMatrixPositions(model) {
    const colX = [115, 285, 455, 625];
    const stemY = 206;
    const branchY = 382;
    const stems = [];
    const branches = [];
    const byId = {};

    PILLAR_KEYS.forEach((pk, col) => {
      if (pk === 'day') {
        const dm = {
          id: 'dayMaster',
          col,
          row: 0,
          x: colX[col],
          y: stemY,
          r: 24,
          char: model.meta.dayStem,
          element: model.meta.dayElement,
          tenGod: '日主',
          pillarLabel: '日主',
          weight: 100,
          isDayMaster: true,
          node: null
        };
        stems.push(dm);
        byId[dm.id] = dm;
      } else {
        const n = model.nodes.find(x => x.pillar === pk && x.kind === '干');
        const cell = {
          id: n.id,
          col,
          row: 0,
          x: colX[col],
          y: stemY,
          r: n.weight >= 10 ? 22 : 20,
          char: n.char,
          element: n.element,
          tenGod: n.tenGod,
          pillarLabel: n.pillarLabel,
          weight: n.weight,
          isDayMaster: false,
          node: n
        };
        stems.push(cell);
        byId[cell.id] = cell;
      }

      const bn = model.nodes.find(x => x.pillar === pk && x.kind === '支');
      const bCell = {
        id: bn.id,
        col,
        row: 1,
        x: colX[col],
        y: branchY,
        r: bn.isMonthCommand ? 26 : (bn.weight >= 15 ? 23 : 21),
        char: bn.char,
        element: bn.element,
        tenGod: bn.tenGod,
        pillarLabel: bn.pillarLabel,
        weight: bn.weight,
        isDayMaster: false,
        node: bn
      };
      branches.push(bCell);
      byId[bCell.id] = bCell;
    });

    return { grid: { stems, branches }, byId, colX, stemY, branchY };
  }

  function cellIsBound(cell, model) {
    if (!cell) return false;
    if (cell.node && cell.node.groupChange && cell.node.groupChange.status === '合绊') return true;
    return (model.interactions || []).some(it =>
      it.active !== false && (it.effect === 'bind' || it.effect === 'contest') &&
      (it.leftId === cell.id || it.rightId === cell.id)
    );
  }

  function buildPositionFlowEdges(model) {
    const matrix = computeMatrixPositions(model);
    const { stems, branches } = matrix.grid;
    const outputAction = resolveOutputAction(model.sectors, model.meta.strength);
    const edges = [];

    const findChain = (idA, idB) => (model.flowEdges || []).find(e =>
      e.sourceType !== 'daymaster-link' &&
      ((e.fromId === idA && e.toId === idB) || (e.fromId === idB && e.toId === idA))
    );
    const findInters = (idA, idB) => (model.interactions || []).filter(i =>
      (i.leftId === idA && i.rightId === idB) || (i.leftId === idB && i.rightId === idA)
    );

    // Tier 0: Same pillar vertical (dist = 0)
    for (let c = 0; c < 4; c++) {
      const sc = stems[c], bc = branches[c];
      const chain = findChain(sc.id, bc.id);
      const bound = cellIsBound(bc, model) || cellIsBound(sc, model);
      let from = sc, to = bc, action = '同气', bidirectional = false;

      if (WX_CTRL[sc.element] === bc.element) {
        from = sc; to = bc;
        action = (chain && chain.action === '制') ? '盖头·制' : '盖头';
      } else if (WX_CTRL[bc.element] === sc.element) {
        from = bc; to = sc;
        action = '截脚';
      } else if (WX_GEN[bc.element] === sc.element) {
        from = bc; to = sc;
        action = '坐生';
      } else if (WX_GEN[sc.element] === bc.element) {
        from = sc; to = bc;
        action = '坐泄';
      } else {
        bidirectional = true;
      }

      const active = !bound && (!chain || chain.active !== false);
      const origin = chain ? 'engine' : 'position-model';
      let status = active
        ? `同柱干支直联（${PILLAR_NAMES[c]}同柱相通）`
        : `合绊受阻（${bc.node && bc.node.groupChange ? bc.node.groupChange.name : '支受牵制'}）`;
      let text = `${from.pillarLabel}${from.char} → ${to.pillarLabel}${to.char}（${action}）`;
      if (bidirectional) text = `${sc.pillarLabel}${sc.char} 与 ${bc.pillarLabel}${bc.char} 同气相应`;
      if (chain) {
        text = action === '盖头·制' ? `${chain.text}（同柱盖头）` : `${text}；关联「${chain.text}」`;
        status = bound ? `合绊受阻：${chain.status}` : `${chain.status}（同柱盖头直达）`;
      }

      edges.push({
        id: `pos_col_${c}`,
        fromId: from.id,
        toId: to.id,
        rowType: 'vertical',
        colA: c,
        colB: c,
        dist: 0,
        isRemote: false,
        weak: false,
        bidirectional,
        action,
        active,
        origin,
        route: `${PILLAR_NAMES[c]} · 同柱上下（距 0）`,
        text,
        status
      });
    }

    // Tiers 1, 2, 3: Same-row cross-column pairs
    [
      { list: stems, row: 0, rowTag: '天干' },
      { list: branches, row: 1, rowTag: '地支' }
    ].forEach(({ list, row, rowTag }) => {
      for (let i = 0; i < 4; i++) {
        for (let j = i + 1; j < 4; j++) {
          const A = list[i], B = list[j];
          const dist = j - i;
          const pairInters = findInters(A.id, B.id);
          const chain = findChain(A.id, B.id);
          const boundAny = cellIsBound(A, model) || cellIsBound(B, model);

          if (dist === 1) {
            const bindInter = pairInters.find(x => x.effect === 'bind');
            if (bindInter) {
              edges.push({
                id: `pos_adj_${row}_${i}`,
                fromId: A.id,
                toId: B.id,
                rowType: row === 0 ? 'stem' : 'branch',
                colA: i,
                colB: j,
                dist: 1,
                isRemote: false,
                weak: false,
                bidirectional: true,
                action: '合绊',
                active: false,
                origin: 'engine',
                route: `${rowTag}紧贴邻柱（距 1）`,
                text: pairInters.map(x => x.text).join('；'),
                status: `${bindInter.text}，邻柱互牵受阻`
              });
              continue;
            }

            const isDM = A.isDayMaster || B.isDayMaster;
            let from = A, to = B, action = '比助', bidirectional = false;
            if (WX_GEN[A.element] === B.element) {
              from = A; to = B;
              action = isDM ? (to.isDayMaster ? '生助' : outputAction) : '紧贴生';
            } else if (WX_GEN[B.element] === A.element) {
              from = B; to = A;
              action = isDM ? (to.isDayMaster ? '生助' : outputAction) : '紧贴生';
            } else if (WX_CTRL[A.element] === B.element) {
              from = A; to = B;
              action = isDM ? (to.isDayMaster ? '克制' : '耗力') : '紧贴克';
            } else if (WX_CTRL[B.element] === A.element) {
              from = B; to = A;
              action = isDM ? (to.isDayMaster ? '克制' : '耗力') : '紧贴克';
            } else {
              action = isDM ? '助旺' : '比助';
              bidirectional = true;
            }

            const active = !boundAny && (!chain || chain.active !== false);
            const origin = chain ? 'engine' : 'position-model';
            const interHint = pairInters.length ? `（兼${pairInters.map(x => x.text.split('：')[0]).join('、')}）` : '';
            let text = bidirectional
              ? `${A.pillarLabel}${A.char} 与 ${B.pillarLabel}${B.char} 紧贴${action}${interHint}`
              : `${from.pillarLabel}${from.char} ${action} ${to.pillarLabel}${to.char}${interHint}`;
            let status = active
              ? `紧贴无阻，${rowTag}直接传导${interHint}`
              : `合绊牵制，邻柱传导受阻${interHint}`;
            if (chain) {
              text = `${text}；关联「${chain.text}」`;
              status = `${chain.status}${interHint}`;
            }

            edges.push({
              id: `pos_adj_${row}_${i}`,
              fromId: from.id,
              toId: to.id,
              rowType: row === 0 ? 'stem' : 'branch',
              colA: i,
              colB: j,
              dist: 1,
              isRemote: false,
              weak: false,
              bidirectional,
              action,
              active,
              origin,
              route: `${rowTag}紧贴邻柱（距 1）`,
              text,
              status
            });
            continue;
          }

          if (dist === 2) {
            const M = list[i + 1];
            const interMain = pairInters[0];
            if (interMain) {
              const isTransform = interMain.effect === 'transform';
              const isClue = interMain.active === false || interMain.effect === 'clue';
              const actLbl = interMain.type === '天干合' ? '隔合' : (isTransform ? '六合' : (interMain.type === '刑' ? '自刑' : interMain.type));
              edges.push({
                id: `pos_gap_${row}_${i}`,
                fromId: A.id,
                toId: B.id,
                rowType: row === 0 ? 'stem' : 'branch',
                colA: i,
                colB: j,
                dist: 2,
                isRemote: false,
                weak: true,
                bidirectional: true,
                action: actLbl,
                active: !isClue,
                origin: 'engine',
                route: `${rowTag}隔柱作用（距 2 · 中隔${M.pillarLabel}${M.char}）`,
                text: interMain.text,
                status: isClue
                  ? `中隔${M.pillarLabel}${M.char}，${interMain.status}不成实合`
                  : `${interMain.text}（隔${M.pillarLabel}${M.char}，${rowTag}隔位感应）`
              });
              continue;
            }

            let from = A, to = B, relKind = 'same';
            if (WX_GEN[A.element] === B.element) { from = A; to = B; relKind = 'gen'; }
            else if (WX_GEN[B.element] === A.element) { from = B; to = A; relKind = 'gen'; }
            else if (WX_CTRL[A.element] === B.element) { from = A; to = B; relKind = 'ctrl'; }
            else if (WX_CTRL[B.element] === A.element) { from = B; to = A; relKind = 'ctrl'; }

            let action = relKind === 'gen' ? '隔生' : (relKind === 'ctrl' ? '隔克' : '比助');
            let active = true;
            let weak = true;
            let status = `隔${M.pillarLabel}${M.char}传导，力度较紧贴减弱`;

            if (boundAny) {
              active = false;
              status = `受合绊牵制并隔${M.pillarLabel}${M.char}，难以越位传力`;
            } else if (relKind === 'ctrl' && WX_GEN[from.element] === M.element && WX_GEN[M.element] === to.element) {
              action = '隔克';
              active = false;
              status = `中柱${M.pillarLabel}${M.char}${M.element}通关（${from.element}生${M.element}生${to.element}，贪生忘克）`;
            } else if (WX_CTRL[M.element] === from.element) {
              active = false;
              status = `发力端遭中柱${M.pillarLabel}${M.char}克制拦截，隔位受阻`;
            } else if (relKind === 'gen' && WX_GEN[from.element] === M.element && WX_GEN[M.element] === to.element) {
              action = '通关顺生';
              weak = false;
              status = `经中柱${M.pillarLabel}${M.char}顺势通关传导`;
            } else if (relKind === 'gen' && M.element === to.element && WX_GEN[from.element] === M.element) {
              action = to.isDayMaster ? '隔生' : '隔泄';
              status = `${from.pillarLabel}${from.char}借中柱${M.pillarLabel}${M.char}同气连传`;
            } else if (WX_CTRL[from.element] === M.element) {
              action = relKind === 'gen' ? '隔弱生' : action;
              status = `近克中柱${M.pillarLabel}${M.char}分力，隔位弱生`;
            }

            edges.push({
              id: `pos_gap_${row}_${i}`,
              fromId: from.id,
              toId: to.id,
              rowType: row === 0 ? 'stem' : 'branch',
              colA: i,
              colB: j,
              dist: 2,
              isRemote: false,
              weak,
              bidirectional: relKind === 'same',
              action,
              active,
              origin: chain ? 'engine' : 'position-model',
              route: `${rowTag}隔柱作用（距 2 · 中隔${M.pillarLabel}${M.char}）`,
              text: `${from.pillarLabel}${from.char} ↔ ${to.pillarLabel}${to.char}（${action}${active ? '' : '受阻'}）`,
              status
            });
            continue;
          }

          if (dist === 3) {
            const interRem = pairInters[0];
            if (interRem) {
              edges.push({
                id: `pos_rem_${row}`,
                fromId: A.id,
                toId: B.id,
                rowType: row === 0 ? 'stem' : 'branch',
                colA: i,
                colB: j,
                dist: 3,
                isRemote: true,
                weak: true,
                bidirectional: true,
                action: interRem.type === '天干合' ? '遥合' : interRem.type,
                active: false,
                origin: 'engine',
                route: `${rowTag}年时遥隔（距 3）`,
                text: interRem.text,
                status: `${interRem.status}（年时遥隔 3 柱，非三会/岁运引动不成实）`
              });
            } else {
              let from = A, to = B, relKind = 'same';
              if (WX_GEN[A.element] === B.element) { from = A; to = B; relKind = 'gen'; }
              else if (WX_GEN[B.element] === A.element) { from = B; to = A; relKind = 'gen'; }
              else if (WX_CTRL[A.element] === B.element) { from = A; to = B; relKind = 'ctrl'; }
              else if (WX_CTRL[B.element] === A.element) { from = B; to = A; relKind = 'ctrl'; }
              const action = relKind === 'same' ? '遥助' : (relKind === 'gen' ? '遥生' : '遥克');
              edges.push({
                id: `pos_rem_${row}`,
                fromId: from.id,
                toId: to.id,
                rowType: row === 0 ? 'stem' : 'branch',
                colA: i,
                colB: j,
                dist: 3,
                isRemote: true,
                weak: true,
                bidirectional: relKind === 'same',
                action,
                active: false,
                origin: 'position-model',
                route: `${rowTag}年时遥隔（距 3）`,
                text: `${from.pillarLabel}${from.char} ↔ ${to.pillarLabel}${to.char}（遥隔无力）`,
                status: '年时相距 3 柱，遥隔难及，通常仅作潜在线索'
              });
            }
          }
        }
      }
    });

    return edges;
  }

  function matrixEdgeGeometry(pA, pB, dist, rowType, matrix) {
    const colA = Math.min(pA.col, pB.col);
    const leftPt = pA.col <= pB.col ? pA : pB;
    const rightPt = pA.col <= pB.col ? pB : pA;

    if (dist === 0) {
      const stemCell = pA.row === 0 ? pA : pB;
      const brCell = pA.row === 1 ? pA : pB;
      const yTop = matrix.stemY + stemCell.r + 28;
      const yBot = matrix.branchY - brCell.r - 5;
      const fromY = pA.row === 0 ? yTop : yBot;
      const toY = pB.row === 0 ? yTop : yBot;
      const x = pA.x;
      return {
        d: `M ${x.toFixed(1)} ${fromY.toFixed(1)} L ${x.toFixed(1)} ${toY.toFixed(1)}`,
        d1: `M ${x.toFixed(1)} ${fromY.toFixed(1)} L ${x.toFixed(1)} ${((fromY + toY) / 2).toFixed(1)}`,
        d2: `M ${x.toFixed(1)} ${((fromY + toY) / 2).toFixed(1)} L ${x.toFixed(1)} ${toY.toFixed(1)}`,
        pillPt: { x, y: (fromY + toY) / 2 }
      };
    }

    if (pA.row !== pB.row) {
      const dx = pB.x - pA.x, dy = pB.y - pA.y;
      const len = Math.hypot(dx, dy) || 1;
      const x1 = pA.x + (dx / len) * (pA.r + 5), y1 = pA.y + (dy / len) * (pA.r + 5);
      const x2 = pB.x - (dx / len) * (pB.r + 5), y2 = pB.y - (dy / len) * (pB.r + 5);
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      return {
        d: `M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}`,
        d1: `M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${mx.toFixed(1)} ${my.toFixed(1)}`,
        d2: `M ${mx.toFixed(1)} ${my.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}`,
        pillPt: { x: mx, y: my }
      };
    }

    if (dist === 1) {
      const dir = pB.x > pA.x ? 1 : -1;
      const x1 = pA.x + dir * (pA.r + 5);
      const x2 = pB.x - dir * (pB.r + 5);
      const y = pA.y;
      const mx = (x1 + x2) / 2;
      return {
        d: `M ${x1.toFixed(1)} ${y.toFixed(1)} L ${x2.toFixed(1)} ${y.toFixed(1)}`,
        d1: `M ${x1.toFixed(1)} ${y.toFixed(1)} L ${mx.toFixed(1)} ${y.toFixed(1)}`,
        d2: `M ${mx.toFixed(1)} ${y.toFixed(1)} L ${x2.toFixed(1)} ${y.toFixed(1)}`,
        pillPt: { x: mx, y }
      };
    }

    const isStem = pA.row === 0 || rowType === 'stem';
    const yAnchor = isStem ? (pA.y - pA.r - 4) : 434;
    const yAnchorB = isStem ? (pB.y - pB.r - 4) : 434;
    const x1 = pA.x;
    const x2 = pB.x;
    let ctrlY;
    if (isStem) ctrlY = dist === 3 ? 16 : (colA === 0 ? 108 : 64);
    else ctrlY = dist === 3 ? 602 : (colA === 0 ? 514 : 558);

    const cpx = (x1 + x2) / 2;
    const cpy = ctrlY;
    const midX = cpx;
    const midY = 0.25 * yAnchor + 0.5 * cpy + 0.25 * yAnchorB;
    const q1x = (x1 + cpx) / 2, q1y = (yAnchor + cpy) / 2;
    const q2x = (cpx + x2) / 2, q2y = (cpy + yAnchorB) / 2;

    return {
      d: `M ${x1.toFixed(1)} ${yAnchor.toFixed(1)} Q ${cpx.toFixed(1)} ${cpy.toFixed(1)} ${x2.toFixed(1)} ${yAnchorB.toFixed(1)}`,
      d1: `M ${x1.toFixed(1)} ${yAnchor.toFixed(1)} Q ${q1x.toFixed(1)} ${q1y.toFixed(1)} ${midX.toFixed(1)} ${midY.toFixed(1)}`,
      d2: `M ${midX.toFixed(1)} ${midY.toFixed(1)} Q ${q2x.toFixed(1)} ${q2y.toFixed(1)} ${x2.toFixed(1)} ${yAnchorB.toFixed(1)}`,
      pillPt: { x: midX, y: midY },
      rawColSpan: [leftPt.col, rightPt.col]
    };
  }

  // ---------- Relation Graph Renderers (Wheel + 2x4 Matrix) ----------
  function appendSvgDefs(svg, dayElement) {
    const defs = svgEl('defs');
    const mkArrow = (id, color) => {
      const m = svgEl('marker', {
        id, viewBox: '0 0 10 10', refX: '8', refY: '5',
        markerWidth: '5.5', markerHeight: '5.5', orient: 'auto-start-reverse'
      });
      m.appendChild(svgEl('path', { d: 'M 1 1.5 L 8.5 5 L 1 8.5 z', fill: color }));
      return m;
    };
    defs.appendChild(mkArrow('bzvArrowPos', PALETTE.pos));
    defs.appendChild(mkArrow('bzvArrowGold', PALETTE.gold));
    defs.appendChild(mkArrow('bzvArrowNeg', PALETTE.neg));
    defs.appendChild(mkArrow('bzvArrowSec', PALETTE.sec));
    defs.appendChild(mkArrow('bzvArrowDrain', PALETTE.drain));
    defs.appendChild(mkArrow('bzvArrowBronze', PALETTE.bronze));
    defs.appendChild(mkArrow('bzvArrowCtrl', PALETTE.ctrl));
    defs.appendChild(mkArrow('bzvArrowMuted', PALETTE.muted));

    const softGlow = svgEl('filter', { id: 'bzvSoftGlow', x: '-60%', y: '-60%', width: '220%', height: '220%' });
    softGlow.appendChild(svgEl('feGaussianBlur', { stdDeviation: '2.0', result: 'blur' }));
    const merge = svgEl('feMerge');
    merge.appendChild(svgEl('feMergeNode', { in: 'blur' }));
    merge.appendChild(svgEl('feMergeNode', { in: 'SourceGraphic' }));
    softGlow.appendChild(merge);
    defs.appendChild(softGlow);

    const motifBlur = svgEl('filter', { id: 'bzvMotifBlur', x: '-60%', y: '-60%', width: '220%', height: '220%' });
    motifBlur.appendChild(svgEl('feGaussianBlur', { stdDeviation: '5.5' }));
    defs.appendChild(motifBlur);

    const auraColor = (ELEMENT_AURAS[dayElement] || ELEMENT_AURAS.火).main;
    const auraGrad = svgEl('radialGradient', { id: 'bzvDmAuraGrad' });
    auraGrad.appendChild(svgEl('stop', { offset: '0%', 'stop-color': auraColor, 'stop-opacity': '0.42' }));
    auraGrad.appendChild(svgEl('stop', { offset: '65%', 'stop-color': auraColor, 'stop-opacity': '0.12' }));
    auraGrad.appendChild(svgEl('stop', { offset: '100%', 'stop-color': auraColor, 'stop-opacity': '0' }));
    defs.appendChild(auraGrad);

    const dmClip = svgEl('clipPath', { id: 'bzvDmCoreClip' });
    dmClip.appendChild(svgEl('circle', { cx: 60, cy: 60, r: 44.8 }));
    defs.appendChild(dmClip);
    svg.appendChild(defs);
  }

  function renderDayMasterInkMotif(parent, cx, cy, radius, model) {
    const stem = (model && model.meta && model.meta.dayStem) || '火';
    const colors = STEM_INK_COLORS[stem] || STEM_INK_COLORS.丁;
    const c1 = colors.c1, c2 = colors.c2;
    const sc = (radius || 46) / 46;
    const tx = (cx - 60 * sc).toFixed(2);
    const ty = (cy - 60 * sc).toFixed(2);
    const outer = svgEl('g', { transform: `translate(${tx}, ${ty}) scale(${sc.toFixed(4)})` });
    const clipped = svgEl('g', { 'clip-path': 'url(#bzvDmCoreClip)' });
    const anim = !!uiState.motion;
    const clsFloat = anim ? 'bzv-anim-ink-float' : undefined;
    const clsSpin = anim ? 'bzv-anim-ink-spin' : undefined;
    const clsFlame = anim ? 'bzv-anim-ink-flame' : undefined;
    const clsRipple = anim ? 'bzv-anim-ink-ripple' : undefined;
    const clsGlint = anim ? 'bzv-anim-ink-glint' : undefined;
    const gWith = (attrs) => {
      const clean = {};
      Object.keys(attrs).forEach(k => { if (attrs[k] !== undefined) clean[k] = attrs[k]; });
      return svgEl('g', clean);
    };

    if (stem === '甲') {
      const g = gWith({ class: clsFloat, opacity: 0.24 });
      g.appendChild(svgEl('path', { d: 'M57 104 L57 42 L63 42 L63 104 Z', fill: c1, opacity: 0.55 }));
      g.appendChild(svgEl('path', { d: 'M60 20 Q42 32 32 39 Q46 37 60 32 Q74 37 88 39 Q78 32 60 20 Z', fill: c1 }));
      g.appendChild(svgEl('path', { d: 'M60 34 Q38 48 25 56 Q44 54 60 48 Q76 54 95 56 Q82 48 60 34 Z', fill: c2 }));
      g.appendChild(svgEl('path', { d: 'M60 50 Q35 66 22 76 Q43 74 60 66 Q77 74 98 76 Q85 66 60 50 Z', fill: c1, opacity: 0.72 }));
      clipped.appendChild(g);
    } else if (stem === '乙') {
      const g = gWith({ class: clsFloat, opacity: 0.28 });
      g.appendChild(svgEl('path', { d: 'M36 96 Q44 68 38 44 Q52 56 44 96 Z', fill: c1 }));
      g.appendChild(svgEl('path', { d: 'M40 95 Q64 76 86 64 Q68 85 45 98 Z', fill: c2 }));
      g.appendChild(svgEl('path', { d: 'M42 94 Q32 76 22 66 Q30 82 39 97 Z', fill: c2, opacity: 0.85 }));
      g.appendChild(svgEl('path', { d: 'M39 86 Q50 56 64 34', fill: 'none', stroke: c1, 'stroke-width': 1.4, 'stroke-linecap': 'round' }));
      g.appendChild(svgEl('circle', { cx: 65, cy: 33, r: 3.4, fill: '#d99a38', opacity: 0.85 }));
      g.appendChild(svgEl('circle', { cx: 57, cy: 43, r: 2.3, fill: '#d99a38', opacity: 0.7 }));
      clipped.appendChild(g);
    } else if (stem === '丙') {
      const glow = gWith({ class: clsFloat });
      glow.appendChild(svgEl('circle', { cx: 60, cy: 48, r: 30, fill: c2, opacity: 0.18 }));
      clipped.appendChild(glow);
      clipped.appendChild(svgEl('circle', { cx: 60, cy: 46, r: 19, fill: c1, opacity: 0.26 }));
      const raysG = gWith({ class: clsSpin, opacity: 0.22 });
      for (let a = 0; a < 360; a += 30) {
        const p1 = polar(60, 46, 22, a);
        const p2 = polar(60, 46, 27, a);
        raysG.appendChild(svgEl('line', {
          x1: p1.x.toFixed(1), y1: p1.y.toFixed(1),
          x2: p2.x.toFixed(1), y2: p2.y.toFixed(1),
          stroke: c1, 'stroke-width': 1.4, 'stroke-linecap': 'round'
        }));
      }
      clipped.appendChild(raysG);
      clipped.appendChild(svgEl('path', { d: 'M18 82 Q38 74 58 80 Q78 86 102 78 L104 92 L16 92 Z', fill: c2, opacity: 0.20 }));
      clipped.appendChild(svgEl('path', { d: 'M22 92 Q46 84 68 90 Q86 95 98 88 L98 106 L22 106 Z', fill: c1, opacity: 0.14 }));
    } else if (stem === '丁') {
      clipped.appendChild(svgEl('circle', { cx: 60, cy: 56, r: 32, fill: c2, opacity: 0.18 }));
      const fg = gWith({ class: clsFlame });
      fg.appendChild(svgEl('path', { d: 'M60 22 C73 39 74 58 60 72 C46 58 47 39 60 22 Z', fill: c1, opacity: 0.26 }));
      fg.appendChild(svgEl('path', { d: 'M60 35 C67 45 67 57 60 66 C53 57 53 45 60 35 Z', fill: c2, opacity: 0.34 }));
      clipped.appendChild(fg);
      clipped.appendChild(svgEl('path', { d: 'M44 74 C40 60 42 40 50 28 L70 28 C78 40 80 60 76 74 Z', fill: 'none', stroke: PALETTE.gold, 'stroke-width': 1.1, opacity: 0.32 }));
      clipped.appendChild(svgEl('path', { d: 'M38 78 Q60 85 82 78 L75 86 Q60 90 45 86 Z', fill: PALETTE.gold, opacity: 0.24 }));
      clipped.appendChild(svgEl('rect', { x: 57, y: 72, width: 6, height: 8, rx: 1.5, fill: c1, opacity: 0.24 }));
    } else if (stem === '戊') {
      const g = gWith({ class: clsFloat });
      g.appendChild(svgEl('path', { d: 'M14 102 L42 54 L62 78 L80 46 L108 102 Z', fill: c2, opacity: 0.22 }));
      g.appendChild(svgEl('path', { d: 'M18 104 L46 68 L60 40 L76 68 L104 104 Z', fill: c1, opacity: 0.24 }));
      g.appendChild(svgEl('path', { d: 'M46 68 L60 40 L65 56 L58 62 L52 72 Z', fill: PALETTE.paper, opacity: 0.28 }));
      g.appendChild(svgEl('path', { d: 'M24 88 Q60 82 96 89', fill: 'none', stroke: c1, 'stroke-width': 1.2, opacity: 0.28 }));
      clipped.appendChild(g);
    } else if (stem === '己') {
      const g = gWith({ class: clsFloat });
      g.appendChild(svgEl('path', { d: 'M26 58 Q60 54 94 58 L106 104 L14 104 Z', fill: c2, opacity: 0.16 }));
      g.appendChild(svgEl('polygon', { points: '34,63 58,63 49,81 18,81', fill: c1, opacity: 0.18 }));
      g.appendChild(svgEl('polygon', { points: '66,63 90,63 102,81 62,81', fill: '#5b8c7a', opacity: 0.16 }));
      g.appendChild(svgEl('polygon', { points: '18,84 48,84 41,102 14,102', fill: c2, opacity: 0.24 }));
      g.appendChild(svgEl('polygon', { points: '62,84 102,84 106,102 58,102', fill: c1, opacity: 0.22 }));
      g.appendChild(svgEl('path', { d: 'M61 58 Q56 76 52 86 Q48 96 47 104', fill: 'none', stroke: '#5d94a6', 'stroke-width': 3.2, 'stroke-linecap': 'round', opacity: 0.28 }));
      g.appendChild(svgEl('path', { d: 'M20 71 L100 71 M15 83 L105 83', fill: 'none', stroke: c1, 'stroke-width': 1, opacity: 0.28 }));
      g.appendChild(svgEl('path', { d: 'M35 55 Q42 48 48 55 Q54 49 60 55', fill: 'none', stroke: c1, 'stroke-width': 1.2, opacity: 0.26 }));
      clipped.appendChild(g);
    } else if (stem === '庚') {
      clipped.appendChild(svgEl('path', {
        d: 'M26 30 Q60 18 93 34', fill: 'none', stroke: c2, 'stroke-width': 1.3, 'stroke-dasharray': '14 4', opacity: 0.28
      }));
      const sw = svgEl('g', { opacity: 0.30 });
      sw.appendChild(svgEl('polygon', { points: '90,22 79,27 39,77 45,83 86,33', fill: c1 }));
      sw.appendChild(svgEl('polygon', { points: '90,22 86,33 45,83 42,80', fill: c2 }));
      sw.appendChild(svgEl('line', { x1: 89, y1: 23, x2: 42, y2: 80, stroke: PALETTE.paper, 'stroke-width': 1.2 }));
      sw.appendChild(svgEl('path', { d: 'M34 71 Q41 75 45 79 Q49 83 53 87 L48 91 Q42 84 32 76 Z', fill: PALETTE.gold }));
      sw.appendChild(svgEl('line', { x1: 39, y1: 83, x2: 31, y2: 93, stroke: c1, 'stroke-width': 3.2, 'stroke-linecap': 'round' }));
      sw.appendChild(svgEl('circle', { cx: 30, cy: 94, r: 3, fill: PALETTE.gold }));
      clipped.appendChild(sw);
      const glintAttrs = { d: 'M89 19 L90.2 22.8 L94 24 L90.2 25.2 L89 29 L87.8 25.2 L84 24 L87.8 22.8 Z', fill: PALETTE.gold, opacity: 0.55 };
      if (clsGlint) glintAttrs.class = clsGlint;
      clipped.appendChild(svgEl('path', glintAttrs));
    } else if (stem === '辛') {
      const g = gWith({ class: clsFloat, opacity: 0.28 });
      g.appendChild(svgEl('polygon', { points: '60,24 84,40 88,66 60,92 32,66 36,40', fill: c2 }));
      g.appendChild(svgEl('polygon', { points: '60,33 75,44 77,63 60,81 43,63 45,44', fill: PALETTE.paper, opacity: 0.38 }));
      g.appendChild(svgEl('line', { x1: 60, y1: 24, x2: 60, y2: 92, stroke: c1, 'stroke-width': 0.9 }));
      g.appendChild(svgEl('line', { x1: 32, y1: 66, x2: 88, y2: 66, stroke: c1, 'stroke-width': 0.9 }));
      g.appendChild(svgEl('circle', { cx: 84, cy: 34, r: 4.5, fill: c1, opacity: 0.65 }));
      g.appendChild(svgEl('path', { d: 'M33 34 L34.5 38.5 L39 40 L34.5 41.5 L33 46 L31.5 41.5 L27 40 L31.5 38.5 Z', fill: PALETTE.gold, opacity: 0.9 }));
      clipped.appendChild(g);
    } else if (stem === '壬') {
      const g = gWith({ class: clsFloat, opacity: 0.26 });
      g.appendChild(svgEl('path', { d: 'M14 78 Q30 62 48 74 T82 70 T106 76 L106 106 L14 106 Z', fill: c1 }));
      g.appendChild(svgEl('path', { d: 'M14 86 Q34 73 56 85 T94 82 L106 86 L106 106 L14 106 Z', fill: c2 }));
      g.appendChild(svgEl('path', { d: 'M24 72 Q33 61 44 69 Q41 72 35 71', fill: 'none', stroke: c1, 'stroke-width': 1.6, 'stroke-linecap': 'round' }));
      g.appendChild(svgEl('path', { d: 'M64 68 Q75 56 87 66 Q83 70 76 69', fill: 'none', stroke: c1, 'stroke-width': 1.6, 'stroke-linecap': 'round' }));
      clipped.appendChild(g);
    } else if (stem === '癸') {
      const drops = svgEl('g', { opacity: 0.28, stroke: c1, 'stroke-width': 1.2, 'stroke-linecap': 'round' });
      [[36,26,29,41],[48,22,41,37],[74,25,67,40],[86,33,79,48],[31,48,24,63],[89,53,82,68]].forEach(([x1,y1,x2,y2]) => {
        drops.appendChild(svgEl('line', { x1, y1, x2, y2 }));
      });
      clipped.appendChild(drops);
      const rg = gWith({ class: clsRipple, opacity: 0.32 });
      rg.appendChild(svgEl('ellipse', { cx: 60, cy: 87, rx: 26, ry: 7.5, fill: 'none', stroke: c1, 'stroke-width': 1.3 }));
      rg.appendChild(svgEl('ellipse', { cx: 60, cy: 87, rx: 15, ry: 4.2, fill: c2, 'fill-opacity': 0.35, stroke: c1, 'stroke-width': 1.1 }));
      rg.appendChild(svgEl('circle', { cx: 60, cy: 85, r: 2.2, fill: c1 }));
      clipped.appendChild(rg);
    }

    outer.appendChild(clipped);
    parent.appendChild(outer);
  }

  function mapMarkerId(baseMarker) {
    return String(baseMarker || '')
      .replace('#arrow', '#bzvArrow')
      .replace('#bzvArrow', '#bzvArrow');
  }

  function resolveSemanticStyle(action, active) {
    const raw = semanticStyle(action, active);
    const idMap = {
      'url(#bzvArrowPos)': 'url(#bzvArrowPos)',
      'url(#bzvArrowGold)': 'url(#bzvArrowGold)',
      'url(#bzvArrowNeg)': 'url(#bzvArrowNeg)',
      'url(#bzvArrowSec)': 'url(#bzvArrowSec)',
      'url(#bzvArrowDrain)': 'url(#bzvArrowDrain)',
      'url(#bzvArrowBronze)': 'url(#bzvArrowBronze)',
      'url(#bzvArrowCtrl)': 'url(#bzvArrowCtrl)'
    };
    return Object.assign({}, raw, { marker: idMap[raw.marker] || mapMarkerId(raw.marker) });
  }

  function resolveStarNodeLabelPlacement(np, node, compact) {
    const cosA = Math.cos(np.rad);
    const sinA = Math.sin(np.rad);
    const labelText = `${node.pillarLabel}·${node.tenGod}`;
    if (compact) {
      const placeAbove = sinA < -0.55;
      const lx = np.x;
      const ly = placeAbove
        ? (np.y - np.r - (node.isMonthCommand ? 13 : 8))
        : (np.y + np.r + 14);
      const estW = labelText.length * 12.8 + 8;
      return {
        x: lx,
        y: ly,
        anchor: 'middle',
        fontSize: 12.5,
        useHalo: true,
        minX: lx - estW * 0.52,
        maxX: lx + estW * 0.52,
        minY: ly - 14,
        maxY: ly + 6,
        text: labelText
      };
    }
    const lx = np.x + cosA * (np.r + 14);
    const ly = np.y + sinA * (np.r + 14) + (sinA > 0.5 ? 8 : (sinA < -0.5 ? -3 : 4));
    const estW = (node.pillarLabel.length + 1 + node.tenGod.length) * 11.5 + 6;
    const anchor = cosA > 0.35 ? 'start' : (cosA < -0.35 ? 'end' : 'middle');
    let minX, maxX;
    if (cosA > 0.35) {
      minX = lx - 4;
      maxX = lx + estW;
    } else if (cosA < -0.35) {
      minX = lx - estW;
      maxX = lx + 4;
    } else {
      minX = lx - estW * 0.52;
      maxX = lx + estW * 0.52;
    }
    return {
      x: lx,
      y: ly,
      anchor,
      fontSize: 11.5,
      useHalo: false,
      minX,
      maxX,
      minY: ly - 16,
      maxY: ly + 14,
      text: labelText
    };
  }

  function computeStarWheelViewBox(model, nodePos, displayEdges, compact) {
    const isCompact = compact !== undefined ? !!compact : isCompactViewport();
    const baseSpan = isCompact ? 148 : 152;
    const pillR = isCompact ? 142 : 156;
    let minX = CX - baseSpan;
    let maxX = CX + baseSpan;
    let minY = CY - baseSpan;
    let maxY = CY + baseSpan;

    (model.nodes || []).forEach(node => {
      const np = nodePos[node.id];
      if (!np) return;
      minX = Math.min(minX, np.x - np.r - 10);
      maxX = Math.max(maxX, np.x + np.r + 10);
      minY = Math.min(minY, np.y - np.r - 12);
      maxY = Math.max(maxY, np.y + np.r + 12);

      if (node.isMonthCommand) {
        maxX = Math.max(maxX, np.x + np.r * 0.76 + 10);
        minY = Math.min(minY, np.y - np.r * 0.76 - 10);
      }

      const lbl = resolveStarNodeLabelPlacement(np, node, isCompact);
      minX = Math.min(minX, lbl.minX);
      maxX = Math.max(maxX, lbl.maxX);
      minY = Math.min(minY, lbl.minY);
      maxY = Math.max(maxY, lbl.maxY);

      if (uiState.selectedNodeId === node.id && node.kind === '支' && node.hidden && node.hidden.length) {
        const count = node.hidden.length;
        const spread = count === 1 ? [0] : (count === 2 ? [-26, 26] : [-38, 0, 38]);
        node.hidden.forEach((hs, hi) => {
          const sp = polar(np.x, np.y, np.r + 44, np.angle + spread[hi]);
          const sx = clamp(sp.x, 58, 682);
          const sy = clamp(sp.y, 22, 556);
          const pillTxt = `${hs.stem}${hs.tenGod} ${hs.pct}%`;
          const pw = pillTxt.length * 8.2 + 16;
          minX = Math.min(minX, sx - pw / 2 - 6);
          maxX = Math.max(maxX, sx + pw / 2 + 6);
          minY = Math.min(minY, sy - 14);
          maxY = Math.max(maxY, sy + 14);
        });
      }
    });

    (displayEdges || []).forEach(e => {
      if (!e.nodeId || !nodePos[e.nodeId]) return;
      const pillPt = polar(CX, CY, pillR, nodePos[e.nodeId].angle);
      minX = Math.min(minX, pillPt.x - 34);
      maxX = Math.max(maxX, pillPt.x + 34);
      minY = Math.min(minY, pillPt.y - 14);
      maxY = Math.max(maxY, pillPt.y + 14);
    });

    const pad = isCompact ? 10 : 14;
    let x0 = Math.max(0, minX - pad);
    let y0 = Math.max(0, minY - pad);
    let x1 = Math.min(740, maxX + pad);
    let y1 = Math.min(580, maxY + pad);

    const minHalfW = 210;
    const halfW = clamp(Math.max(minHalfW, CX - x0, x1 - CX), minHalfW, CX);
    x0 = Math.round(CX - halfW);
    let w = (CX - x0) * 2;
    let h = y1 - y0;
    const minH = isCompact ? 360 : 380;
    if (h < minH) {
      const midY = (y0 + y1) / 2;
      h = minH;
      y0 = clamp(midY - h / 2, 0, 580 - h);
    }
    y0 = Math.round(y0);
    h = Math.round(h);
    return { x: x0, y: y0, w, h, str: `${x0} ${y0} ${w} ${h}` };
  }

  function renderStarWheelView(svg, model, weightedShares, displayEdges, onUpdate) {
    const P = PALETTE;
    const compact = isCompactViewport();
    const nodePos = computeNodePositions(model, compact);
    if (typeof svg.setAttribute === 'function') {
      svg.setAttribute('viewBox', compact ? computeStarWheelViewBox(model, nodePos, displayEdges, true).str : '0 0 740 580');
    }

    const genRingPath = `M ${CX} ${CY - 142} A 142 142 0 1 1 ${(CX - 0.1).toFixed(1)} ${CY - 142} Z`;
    svg.appendChild(svgEl('path', {
      d: genRingPath, fill: 'none', stroke: P.line,
      'stroke-width': 1, 'stroke-dasharray': '3 4', opacity: 0.65
    }));
    svg.appendChild(svgEl('circle', {
      cx: CX, cy: CY, r: 96, fill: 'none', stroke: P.line,
      'stroke-width': 0.8, 'stroke-dasharray': '2 4', opacity: 0.42
    }));

    const sectorShapeGroup = svgEl('g');
    const sectorLabelGroup = svgEl('g');
    model.sectors.forEach((sec, idx) => {
      const cAngle = SECTOR_ANGLES[idx];
      const share = weightedShares.byKey[sec.key] || { pct: 0, raw: 0 };
      const geom = computeSectorVisualGeometry(share.pct, weightedShares.maxPct);
      const a0 = cAngle - geom.halfSpan;
      const a1 = cAngle + geom.halfSpan;
      const rIn = geom.rIn;
      const rOut = geom.rOut;
      const st = roleStyle(sec.role);
      const isSel = uiState.selectedSectorKey === sec.key;
      const dimmed = uiState.selectedSectorKey && !isSel;

      const pathD = annularSectorPath(CX, CY, rIn, rOut, a0, a1);
      const g = svgEl('g', { style: 'cursor:pointer', opacity: dimmed ? 0.35 : 1 });
      const wedgeAttrs = {
        d: pathD,
        fill: st.fill,
        'fill-opacity': isSel ? 0.95 : geom.fillOpacity,
        stroke: isSel ? P.textDark : st.stroke,
        'stroke-width': isSel ? 2.4 : geom.strokeWidth
      };
      if (geom.strokeDash && !isSel) {
        wedgeAttrs['stroke-dasharray'] = geom.strokeDash;
      }
      const wedge = svgEl('path', wedgeAttrs);
      if (sec.role === 'avoid' && uiState.motion && !dimmed) {
        wedge.classList.add('bzv-anim-disease');
      }
      g.appendChild(wedge);
      g.addEventListener('click', () => {
        uiState.selectedSectorKey = uiState.selectedSectorKey === sec.key ? null : sec.key;
        uiState.selectedNodeId = null;
        uiState.selectedEdgeId = null;
        onUpdate();
      });
      sectorShapeGroup.appendChild(g);

      const labelR = geom.labelR;
      const lp = polar(CX, CY, labelR, cAngle);
      const lg = svgEl('g', { style: 'cursor:pointer', opacity: dimmed ? 0.35 : 1 });
      const haloStyle = `paint-order:stroke; stroke:${P.paper}; stroke-width:3.5px; stroke-linejoin:round;`;
      lg.appendChild(svgEl('text', {
        x: lp.x.toFixed(1), y: (lp.y - (compact ? 4 : 3.5)).toFixed(1),
        'text-anchor': 'middle', 'font-size': compact ? 13 : 11.5, 'font-weight': 600, fill: P.textDark,
        style: haloStyle
      }, `${sec.name}·${sec.wx}`));
      const roleTag = sec.role === 'avoid' ? ' 忌' : (sec.roleLabel === '中' ? '' : ` ${sec.roleLabel}`);
      lg.appendChild(svgEl('text', {
        x: lp.x.toFixed(1), y: (lp.y + (compact ? 11.5 : 10.5)).toFixed(1),
        'text-anchor': 'middle', 'font-size': compact ? 11.5 : 10.5, 'font-weight': 600,
        fill: st.text, class: 'bzv-tabular', style: haloStyle
      }, `${share.pct.toFixed(1)}%${roleTag}`));
      lg.addEventListener('click', () => {
        uiState.selectedSectorKey = uiState.selectedSectorKey === sec.key ? null : sec.key;
        uiState.selectedNodeId = null;
        uiState.selectedEdgeId = null;
        onUpdate();
      });
      sectorLabelGroup.appendChild(lg);

      const arrowAngle = cAngle + 36;
      const ap = polar(CX, CY, 142, arrowAngle);
      sectorShapeGroup.appendChild(svgEl('path', {
        d: 'M -3.5 -2.5 L 3.5 0 L -3.5 2.5 z',
        fill: P.gold,
        opacity: 0.6,
        transform: `translate(${ap.x.toFixed(1)}, ${ap.y.toFixed(1)}) rotate(${arrowAngle + 90})`
      }));
    });
    svg.appendChild(sectorShapeGroup);

    const edgeLineGroup = svgEl('g');
    const edgePillGroup = svgEl('g');
    const dmEdges = displayEdges.filter(e => e.sourceType === 'daymaster-link' || e.sourceType === 'daymaster-ambient');
    const groupsMap = {};
    dmEdges.forEach(edge => {
      const gKey = `${edge.sectorKey}|${edge.action}|${edge.active ? '1' : '0'}`;
      if (!groupsMap[gKey]) {
        groupsMap[gKey] = {
          key: gKey,
          sectorKey: edge.sectorKey,
          action: edge.action,
          active: edge.active,
          toDM: edge.toDM,
          edges: []
        };
      }
      groupsMap[gKey].edges.push(edge);
    });

    const hasFocusFilter = (uiState.selectedNodeId && uiState.selectedNodeId !== 'dayMaster') ||
      uiState.selectedEdgeId || uiState.selectedSectorKey;

    Object.values(groupsMap).forEach((grp, gIdx) => {
      grp.edges.sort((a, b) => nodePos[a.nodeId].angle - nodePos[b.nodeId].angle);
      const meanAngle = grp.edges.reduce((acc, e) => acc + nodePos[e.nodeId].angle, 0) / grp.edges.length;
      const totalWeight = grp.edges.reduce((acc, e) => acc + (e.weight || 8), 0);
      const st = resolveSemanticStyle(grp.action, grp.active);
      const primaryEdge = grp.edges.slice().sort((a, b) => (b.weight || 0) - (a.weight || 0))[0];

      const edgeFocused = (e) => {
        if (!hasFocusFilter) return true;
        if (uiState.selectedNodeId && uiState.selectedNodeId !== 'dayMaster') return e.nodeId === uiState.selectedNodeId;
        if (uiState.selectedEdgeId) return e.id === uiState.selectedEdgeId;
        if (uiState.selectedSectorKey) return e.sectorKey === uiState.selectedSectorKey;
        return true;
      };
      const grpFocused = grp.edges.some(edgeFocused);
      const trunkSel = grp.edges.some(e => uiState.selectedEdgeId === e.id);
      const trunkOpacity = trunkSel ? 1 : (grpFocused ? (grp.active ? 0.88 : 0.92) : 0.14);
      const trunkWidth = Math.min(4.0, Math.max(1.7, 1.45 + totalWeight / 26));

      const pillR = compact ? 142 : 156;
      const juncR = compact ? 160 : 178;
      const ctrlR = compact ? 170 : 190;
      const cInner = polar(CX, CY, 52, meanAngle);
      const pillPt = polar(CX, CY, pillR, meanAngle);
      const juncPt = polar(CX, CY, juncR, meanAngle);

      if (grp.edges.length === 1) {
        const e = grp.edges[0];
        const np = nodePos[e.nodeId];
        const outerR = Math.hypot(np.x - CX, np.y - CY) - np.r - 4;
        const cOuter = polar(CX, CY, outerR, meanAngle);
        const fromPt = grp.toDM ? cOuter : cInner;
        const toPt = grp.toDM ? cInner : cOuter;
        const dFull = `M ${fromPt.x.toFixed(1)} ${fromPt.y.toFixed(1)} L ${toPt.x.toFixed(1)} ${toPt.y.toFixed(1)}`;
        const eg = svgEl('g', { style: 'cursor:pointer', opacity: trunkOpacity });

        if (!grp.active) {
          const d1 = `M ${fromPt.x.toFixed(1)} ${fromPt.y.toFixed(1)} L ${pillPt.x.toFixed(1)} ${pillPt.y.toFixed(1)}`;
          const d2 = `M ${pillPt.x.toFixed(1)} ${pillPt.y.toFixed(1)} L ${toPt.x.toFixed(1)} ${toPt.y.toFixed(1)}`;
          eg.appendChild(svgEl('path', {
            d: d1, fill: 'none', stroke: st.color, 'stroke-width': trunkWidth, 'stroke-dasharray': '5 3'
          }));
          eg.appendChild(svgEl('path', {
            d: d2, fill: 'none', stroke: st.color, 'stroke-width': Math.max(1.3, trunkWidth - 0.5),
            'stroke-dasharray': '3 5', opacity: 0.42, 'marker-end': st.marker
          }));
          if (uiState.motion && grpFocused) {
            appendMotionShape(eg, d1, st, 0.95, (1.8 * st.durFactor).toFixed(2), (gIdx * 0.31).toFixed(2), true);
            eg.appendChild(svgEl('circle', {
              cx: pillPt.x.toFixed(1), cy: pillPt.y.toFixed(1), r: 12,
              fill: 'none', stroke: st.color, 'stroke-width': 1.2, class: 'bzv-anim-block'
            }));
          }
        } else {
          eg.appendChild(svgEl('path', {
            d: dFull, fill: 'none', stroke: st.color, 'stroke-width': trunkSel ? 3.2 : trunkWidth,
            'marker-end': st.marker
          }));
          if (uiState.motion && grpFocused) {
            const cnt = (e.weight >= 35 || trunkSel) ? 3 : (e.weight >= 14 ? 2 : 1);
            const sc = e.weight >= 35 ? 1.12 : 0.95;
            const dur = (trunkSel ? 1.75 : 2.35) * st.durFactor;
            for (let k = 0; k < cnt; k++) {
              appendMotionShape(eg, dFull, st, sc, dur.toFixed(2), (k * (dur / cnt) + gIdx * 0.27).toFixed(2), false);
            }
          }
        }
        eg.addEventListener('click', () => {
          uiState.selectedEdgeId = e.id;
          uiState.selectedNodeId = null;
          uiState.selectedSectorKey = null;
          onUpdate();
        });
        edgeLineGroup.appendChild(eg);
      } else {
        const trunkFrom = grp.toDM ? juncPt : cInner;
        const trunkTo = grp.toDM ? cInner : juncPt;
        const tg = svgEl('g', { style: 'cursor:pointer', opacity: trunkOpacity });

        if (!grp.active) {
          const dt1 = `M ${trunkFrom.x.toFixed(1)} ${trunkFrom.y.toFixed(1)} L ${pillPt.x.toFixed(1)} ${pillPt.y.toFixed(1)}`;
          const dt2 = `M ${pillPt.x.toFixed(1)} ${pillPt.y.toFixed(1)} L ${trunkTo.x.toFixed(1)} ${trunkTo.y.toFixed(1)}`;
          tg.appendChild(svgEl('path', {
            d: dt1, fill: 'none', stroke: st.color, 'stroke-width': trunkWidth, 'stroke-dasharray': '5 3'
          }));
          tg.appendChild(svgEl('path', {
            d: dt2, fill: 'none', stroke: st.color, 'stroke-width': Math.max(1.3, trunkWidth - 0.5),
            'stroke-dasharray': '3 5', opacity: 0.42, 'marker-end': grp.toDM ? st.marker : undefined
          }));
          if (uiState.motion && grpFocused) {
            tg.appendChild(svgEl('circle', {
              cx: pillPt.x.toFixed(1), cy: pillPt.y.toFixed(1), r: 12,
              fill: 'none', stroke: st.color, 'stroke-width': 1.2, class: 'bzv-anim-block'
            }));
          }
        } else {
          tg.appendChild(svgEl('path', {
            d: `M ${trunkFrom.x.toFixed(1)} ${trunkFrom.y.toFixed(1)} L ${trunkTo.x.toFixed(1)} ${trunkTo.y.toFixed(1)}`,
            fill: 'none', stroke: st.color, 'stroke-width': trunkSel ? Math.max(3.2, trunkWidth) : trunkWidth,
            'marker-end': grp.toDM ? st.marker : undefined
          }));
          tg.appendChild(svgEl('circle', {
            cx: juncPt.x.toFixed(1), cy: juncPt.y.toFixed(1), r: 3.1, fill: st.color
          }));
        }
        tg.addEventListener('click', () => {
          uiState.selectedEdgeId = primaryEdge.id;
          uiState.selectedNodeId = null;
          uiState.selectedSectorKey = null;
          onUpdate();
        });
        edgeLineGroup.appendChild(tg);

        grp.edges.forEach((e, bIdx) => {
          const np = nodePos[e.nodeId];
          const isEdgeFocused = edgeFocused(e);
          const isEdgeSel = uiState.selectedEdgeId === e.id;
          const branchOp = isEdgeSel ? 1 : (isEdgeFocused ? 0.88 : 0.14);
          const bw = Math.min(3.0, Math.max(1.5, 1.3 + (e.weight || 8) / 22));

          const ux = np.x - juncPt.x;
          const uy = np.y - juncPt.y;
          const dist = Math.hypot(ux, uy) || 1;
          const nEdgeX = np.x - (ux / dist) * (np.r + 4);
          const nEdgeY = np.y - (uy / dist) * (np.r + 4);
          const ctrlPt = polar(CX, CY, ctrlR, meanAngle);

          const bg = svgEl('g', { style: 'cursor:pointer', opacity: branchOp });
          const dBranch = grp.toDM
            ? `M ${nEdgeX.toFixed(1)} ${nEdgeY.toFixed(1)} Q ${ctrlPt.x.toFixed(1)} ${ctrlPt.y.toFixed(1)} ${juncPt.x.toFixed(1)} ${juncPt.y.toFixed(1)}`
            : `M ${juncPt.x.toFixed(1)} ${juncPt.y.toFixed(1)} Q ${ctrlPt.x.toFixed(1)} ${ctrlPt.y.toFixed(1)} ${nEdgeX.toFixed(1)} ${nEdgeY.toFixed(1)}`;
          bg.appendChild(svgEl('path', {
            d: dBranch, fill: 'none', stroke: st.color,
            'stroke-width': isEdgeSel ? 3.0 : bw,
            'stroke-dasharray': grp.active ? 'none' : '5 3',
            'marker-end': grp.toDM ? undefined : st.marker
          }));

          if (uiState.motion && isEdgeFocused) {
            const dur = (e.weight >= 35 ? 2.15 : 2.55) * st.durFactor;
            if (!grp.active) {
              const dBlock = grp.toDM
                ? `M ${nEdgeX.toFixed(1)} ${nEdgeY.toFixed(1)} Q ${ctrlPt.x.toFixed(1)} ${ctrlPt.y.toFixed(1)} ${juncPt.x.toFixed(1)} ${juncPt.y.toFixed(1)} L ${pillPt.x.toFixed(1)} ${pillPt.y.toFixed(1)}`
                : `M ${cInner.x.toFixed(1)} ${cInner.y.toFixed(1)} L ${pillPt.x.toFixed(1)} ${pillPt.y.toFixed(1)}`;
              appendMotionShape(bg, dBlock, st, 0.92, dur.toFixed(2), (bIdx * 0.4).toFixed(2), true);
            } else {
              const dMotion = grp.toDM
                ? `M ${nEdgeX.toFixed(1)} ${nEdgeY.toFixed(1)} Q ${ctrlPt.x.toFixed(1)} ${ctrlPt.y.toFixed(1)} ${juncPt.x.toFixed(1)} ${juncPt.y.toFixed(1)} L ${cInner.x.toFixed(1)} ${cInner.y.toFixed(1)}`
                : `M ${cInner.x.toFixed(1)} ${cInner.y.toFixed(1)} L ${juncPt.x.toFixed(1)} ${juncPt.y.toFixed(1)} Q ${ctrlPt.x.toFixed(1)} ${ctrlPt.y.toFixed(1)} ${nEdgeX.toFixed(1)} ${nEdgeY.toFixed(1)}`;
              const cnt = (e.weight >= 35 || isEdgeSel) ? 2 : 1;
              const sc = e.weight >= 35 ? 1.12 : 0.94;
              for (let k = 0; k < cnt; k++) {
                appendMotionShape(bg, dMotion, st, sc, dur.toFixed(2), (k * (dur / cnt) + bIdx * 0.45 + gIdx * 0.21).toFixed(2), false);
              }
            }
          }

          bg.addEventListener('click', () => {
            uiState.selectedEdgeId = e.id;
            uiState.selectedNodeId = null;
            uiState.selectedSectorKey = null;
            onUpdate();
          });
          edgeLineGroup.appendChild(bg);
        });
      }

      const pillLbl = grp.active ? grp.action : `${grp.action}✕`;
      const pillFont = compact ? 12 : 11;
      const pillH = compact ? 21 : 19;
      const pw = pillLbl.length * pillFont + 14;
      const pg = svgEl('g', { style: 'cursor:pointer', opacity: grpFocused ? 1 : 0.2 });
      pg.appendChild(svgEl('rect', {
        x: (pillPt.x - pw / 2).toFixed(1), y: (pillPt.y - pillH / 2).toFixed(1),
        width: pw, height: pillH, rx: pillH / 2,
        fill: P.paper, stroke: st.color, 'stroke-width': trunkSel ? 1.8 : 1.25
      }));
      pg.appendChild(svgEl('text', {
        x: pillPt.x.toFixed(1), y: (pillPt.y + (compact ? 4.2 : 3.8)).toFixed(1),
        'text-anchor': 'middle', 'font-size': pillFont, 'font-weight': 700, fill: st.color
      }, pillLbl));
      pg.addEventListener('click', () => {
        uiState.selectedEdgeId = primaryEdge.id;
        uiState.selectedNodeId = null;
        uiState.selectedSectorKey = null;
        onUpdate();
      });
      edgePillGroup.appendChild(pg);
    });

    svg.appendChild(edgeLineGroup);
    svg.appendChild(sectorLabelGroup);
    svg.appendChild(edgePillGroup);

    // Center Day Master Core
    const dmGroup = svgEl('g', { style: 'cursor:pointer' });
    const coreR = 46;
    const hasIntake = displayEdges.some(e => e.active && e.toId === 'dayMaster');
    if (hasIntake && uiState.motion) {
      dmGroup.appendChild(svgEl('circle', {
        cx: CX, cy: CY, r: coreR + 10,
        fill: 'none', stroke: P.pos, 'stroke-width': 1.5, class: 'bzv-anim-intake'
      }));
    }
    dmGroup.appendChild(svgEl('circle', {
      cx: CX, cy: CY, r: coreR + 5,
      fill: 'none', stroke: P.line, 'stroke-width': 4, opacity: 0.45
    }));
    const supPct = Math.max(0.05, Math.min(1, (model.meta.supportScore || 0) / 100));
    const circ = 2 * Math.PI * (coreR + 5);
    dmGroup.appendChild(svgEl('circle', {
      cx: CX, cy: CY, r: coreR + 5,
      fill: 'none', stroke: P.gold, 'stroke-width': 4,
      'stroke-dasharray': `${(circ * supPct).toFixed(1)} ${circ.toFixed(1)}`,
      'stroke-linecap': 'round',
      transform: `rotate(-90 ${CX} ${CY})`
    }));
    dmGroup.appendChild(svgEl('circle', {
      cx: CX, cy: CY, r: coreR,
      fill: P.paper, stroke: uiState.selectedNodeId === 'dayMaster' ? P.textDark : P.gold,
      'stroke-width': uiState.selectedNodeId === 'dayMaster' ? 2.4 : 2
    }));

    renderDayMasterInkMotif(dmGroup, CX, CY, coreR, model);

    const dmHalo = `paint-order:stroke; stroke:${P.paper}; stroke-width:2.6px; stroke-linejoin:round;`;
    dmGroup.appendChild(svgEl('text', {
      x: CX, y: CY - 17, 'text-anchor': 'middle', 'font-size': compact ? 11.5 : 10.5, fill: P.muted, style: dmHalo
    }, '日主'));
    dmGroup.appendChild(svgEl('text', {
      x: CX, y: CY + 8, 'text-anchor': 'middle', 'font-size': compact ? 31 : 28, 'font-weight': 700,
      fill: P.textDark, class: 'bzv-serif', style: dmHalo
    }, model.meta.dayStem));
    dmGroup.appendChild(svgEl('text', {
      x: CX, y: CY + 25, 'text-anchor': 'middle', 'font-size': compact ? 11.5 : 10.5, 'font-weight': 600,
      fill: P.gold, class: 'bzv-tabular', style: dmHalo
    }, `${model.meta.dayElement} · 扶身 ${model.meta.supportScore}`));
    dmGroup.addEventListener('click', () => {
      uiState.selectedNodeId = uiState.selectedNodeId === 'dayMaster' ? null : 'dayMaster';
      uiState.selectedSectorKey = null;
      uiState.selectedEdgeId = null;
      onUpdate();
    });
    svg.appendChild(dmGroup);

    // Outer Natal Nodes
    const nodesGroup = svgEl('g');
    model.nodes.forEach(node => {
      const np = nodePos[node.id];
      if (!np) return;
      const sec = model.sectors.find(x => x.key === node.sectorKey);
      const st = roleStyle(sec ? sec.role : 'neutral');
      const isSel = uiState.selectedNodeId === node.id;
      const ng = svgEl('g', { style: 'cursor:pointer' });

      if (node.isMonthCommand || isSel) {
        ng.appendChild(svgEl('circle', {
          cx: np.x.toFixed(1), cy: np.y.toFixed(1), r: np.r + 4.5,
          fill: 'none', stroke: isSel ? P.textDark : P.gold,
          'stroke-width': isSel ? 2.2 : 1.2,
          'stroke-dasharray': node.attacked && !isSel ? '4 3' : 'none'
        }));
      } else if (node.attacked) {
        ng.appendChild(svgEl('circle', {
          cx: np.x.toFixed(1), cy: np.y.toFixed(1), r: np.r + 3.5,
          fill: 'none', stroke: P.neg, 'stroke-width': 1.2, 'stroke-dasharray': '3 3'
        }));
      }

      ng.appendChild(svgEl('circle', {
        cx: np.x.toFixed(1), cy: np.y.toFixed(1), r: np.r,
        fill: P.paper, stroke: st.stroke, 'stroke-width': node.kind === '支' ? 2.2 : 1.5
      }));

      if (node.kind === '支') {
        ng.appendChild(svgEl('circle', {
          cx: np.x.toFixed(1), cy: np.y.toFixed(1), r: np.r - 3.5,
          fill: st.fill, stroke: 'none'
        }));
      }

      ng.appendChild(svgEl('text', {
        x: np.x.toFixed(1), y: (np.y + 6).toFixed(1),
        'text-anchor': 'middle', 'font-size': np.r >= 22 ? (compact ? 21 : 20) : (compact ? 17.5 : 16), 'font-weight': 700,
        fill: P.textDark, class: 'bzv-serif'
      }, node.char));

      if (node.kind === '支' && node.hidden.length) {
        const dotSpan = (node.hidden.length - 1) * 5.5;
        node.hidden.forEach((_, di) => {
          ng.appendChild(svgEl('circle', {
            cx: (np.x - dotSpan / 2 + di * 5.5).toFixed(1),
            cy: (np.y + np.r - 5).toFixed(1),
            r: 1.7, fill: st.text
          }));
        });
      }

      const lbl = resolveStarNodeLabelPlacement(np, node, compact);
      const isExpandedBranch = isSel && node.kind === '支' && node.hidden.length > 0;
      if (!isExpandedBranch) {
        const lblAttrs = {
          x: lbl.x.toFixed(1), y: lbl.y.toFixed(1),
          'text-anchor': lbl.anchor, 'font-size': lbl.fontSize, 'font-weight': 600, fill: P.textDark
        };
        if (lbl.useHalo) {
          lblAttrs.style = `paint-order:stroke; stroke:${P.paper}; stroke-width:3px; stroke-linejoin:round;`;
        }
        ng.appendChild(svgEl('text', lblAttrs, lbl.text));
      }

      if (node.isMonthCommand) {
        ng.appendChild(svgEl('circle', {
          cx: (np.x + np.r * 0.76).toFixed(1), cy: (np.y - np.r * 0.76).toFixed(1),
          r: 8.5, fill: P.gold
        }));
        ng.appendChild(svgEl('text', {
          x: (np.x + np.r * 0.76).toFixed(1), y: (np.y - np.r * 0.76 + 3.5).toFixed(1),
          'text-anchor': 'middle', 'font-size': 10, 'font-weight': 700, fill: '#fff'
        }, '令'));
      }

      ng.addEventListener('click', () => {
        uiState.selectedNodeId = uiState.selectedNodeId === node.id ? null : node.id;
        uiState.selectedSectorKey = null;
        uiState.selectedEdgeId = null;
        onUpdate();
      });
      nodesGroup.appendChild(ng);

      if (isExpandedBranch) {
        const satGroup = svgEl('g', { class: uiState.motion ? 'bzv-anim-sat' : '' });
        const count = node.hidden.length;
        const spread = count === 1 ? [0] : (count === 2 ? [-26, 26] : [-38, 0, 38]);
        node.hidden.forEach((hs, hi) => {
          const satAngle = np.angle + spread[hi];
          const satDist = np.r + 44;
          const sp = polar(np.x, np.y, satDist, satAngle);
          const sx = clamp(sp.x, 58, 682);
          const sy = clamp(sp.y, 22, 556);

          satGroup.appendChild(svgEl('line', {
            x1: np.x.toFixed(1), y1: np.y.toFixed(1),
            x2: sx.toFixed(1), y2: sy.toFixed(1),
            stroke: P.gold, 'stroke-width': 1.2, 'stroke-dasharray': '3 2'
          }));

          const pillTxt = `${hs.stem}${hs.tenGod} ${hs.pct}%`;
          const pw = pillTxt.length * 8.2 + 16;
          satGroup.appendChild(svgEl('rect', {
            x: (sx - pw / 2).toFixed(1), y: (sy - 11).toFixed(1),
            width: pw, height: 22, rx: 11,
            fill: P.paper, stroke: P.gold, 'stroke-width': 1.3
          }));
          satGroup.appendChild(svgEl('text', {
            x: sx.toFixed(1), y: (sy + 4).toFixed(1),
            'text-anchor': 'middle', 'font-size': 11, 'font-weight': 600, fill: P.textDark, class: 'bzv-tabular'
          }, pillTxt));
        });
        nodesGroup.appendChild(satGroup);
      }
    });
    svg.appendChild(nodesGroup);
  }

  function renderMatrixRelationView(svg, model, matrix, posEdges, onUpdate) {
    const P = PALETTE;
    const colGridGroup = svgEl('g');
    const edgeLineGroup = svgEl('g');
    const edgePillGroup = svgEl('g');
    const nodesGroup = svgEl('g');

    const allCells = matrix.grid.stems.concat(matrix.grid.branches);
    const expandedBranchCell = (uiState.selectedNodeId && uiState.selectedNodeId !== 'dayMaster')
      ? matrix.grid.branches.find(b => b.id === uiState.selectedNodeId && b.node && b.node.hidden && b.node.hidden.length)
      : null;

    PILLAR_KEYS.forEach((pk, c) => {
      const xLeft = matrix.colX[c] - 64;
      const isDay = pk === 'day';
      const isMonth = pk === 'month';
      colGridGroup.appendChild(svgEl('rect', {
        x: xLeft.toFixed(1), y: 20, width: 128, height: 426, rx: 16,
        fill: isDay ? 'rgba(156, 114, 47, 0.06)' : (isMonth ? 'rgba(156, 114, 47, 0.032)' : 'rgba(134, 118, 98, 0.025)'),
        stroke: isDay ? P.gold : P.line,
        'stroke-width': isDay ? 1.4 : 0.9,
        opacity: isDay ? 0.85 : 0.6
      }));
      const colTitle = isDay ? '日柱 · 日主' : (isMonth ? '月柱 · 月令' : PILLAR_NAMES[c]);
      colGridGroup.appendChild(svgEl('text', {
        x: matrix.colX[c].toFixed(1), y: 39, 'text-anchor': 'middle',
        'font-size': 12, 'font-weight': 700, fill: isDay ? P.gold : P.muted
      }, colTitle));
    });
    colGridGroup.appendChild(svgEl('text', {
      x: 26, y: matrix.stemY + 4, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 600, fill: P.muted, opacity: 0.78
    }, '天干'));
    colGridGroup.appendChild(svgEl('text', {
      x: 26, y: matrix.branchY + 4, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 600, fill: P.muted, opacity: 0.78
    }, '地支'));
    svg.appendChild(colGridGroup);

    const hasFocusFilter = !!(uiState.selectedNodeId || uiState.selectedEdgeId);

    if (uiState.relLayer === 'interactions') {
      const pairGroups = {};
      (model.interactions || []).forEach(inter => {
        const key = [inter.leftId, inter.rightId].sort().join('|');
        if (!pairGroups[key]) pairGroups[key] = { leftId: inter.leftId, rightId: inter.rightId, items: [] };
        pairGroups[key].items.push(inter);
      });

      Object.values(pairGroups).forEach(grp => {
        const pA = matrix.byId[grp.leftId];
        const pB = matrix.byId[grp.rightId];
        if (!pA || !pB) return;

        const dist = Math.abs(pA.col - pB.col);
        const isRemote = dist >= 3;
        const isNodeFocus = uiState.selectedNodeId && (grp.leftId === uiState.selectedNodeId || grp.rightId === uiState.selectedNodeId);
        const isSel = grp.items.some(it => it.id === uiState.selectedEdgeId);
        if (isRemote && !uiState.showRemote && !isNodeFocus && !isSel) return;

        const involved = !hasFocusFilter || isSel || isNodeFocus;
        const dimLower = expandedBranchCell && pA.row === 1 && dist >= 2 && !involved;
        const opacity = isSel ? 1 : (involved ? (dimLower ? 0.25 : 0.92) : 0.14);

        const hasHarm = grp.items.some(it => it.type === '破' || it.type === '刑' || it.type === '冲' || it.type === '害' || it.effect === 'bind' || it.effect === 'clue');
        const allInactive = grp.items.every(it => it.active === false);
        const strokeColor = hasHarm ? P.neg : P.sec;
        const geom = matrixEdgeGeometry(pA, pB, dist, pA.row === 0 ? 'stem' : 'branch', matrix);

        const eg = svgEl('g', { style: 'cursor:pointer', opacity });
        const path = svgEl('path', {
          d: geom.d, fill: 'none', stroke: strokeColor,
          'stroke-width': isSel ? 3.0 : (dist <= 1 ? 2.4 : 1.8),
          'stroke-dasharray': (hasHarm || allInactive) ? '5 4' : 'none'
        });
        if (uiState.motion && involved && hasHarm) path.classList.add('bzv-anim-flow');
        eg.appendChild(path);

        const distTag = dist === 0 ? '同柱' : (dist === 1 ? '紧贴' : (dist === 2 ? '隔柱' : '遥隔'));
        const tags = grp.items.map(it => {
          if (it.type === '天干合') return '遥合✕';
          if (it.type === '六合') return it.effect === 'transform' ? '合化' : (it.effect === 'bind' ? '合绊' : '六合');
          return it.type;
        });
        const label = `${distTag}·${tags.join('·')}`;
        const pw = Math.max(46, label.length * 9.5 + 14);

        const pg = svgEl('g', { style: 'cursor:pointer', opacity: involved ? (dimLower ? 0.3 : 1) : 0.2 });
        pg.appendChild(svgEl('rect', {
          x: (geom.pillPt.x - pw / 2).toFixed(1), y: (geom.pillPt.y - 9.5).toFixed(1),
          width: pw, height: 19, rx: 9.5,
          fill: P.paper, stroke: strokeColor, 'stroke-width': isSel ? 1.8 : 1.2
        }));
        pg.appendChild(svgEl('text', {
          x: geom.pillPt.x.toFixed(1), y: (geom.pillPt.y + 3.6).toFixed(1),
          'text-anchor': 'middle', 'font-size': 10.5, 'font-weight': 700, fill: strokeColor
        }, label));

        const onPick = () => {
          uiState.selectedEdgeId = grp.items[0].id;
          uiState.selectedNodeId = null;
          uiState.selectedSectorKey = null;
          onUpdate();
        };
        eg.addEventListener('click', onPick);
        pg.addEventListener('click', onPick);
        edgeLineGroup.appendChild(eg);
        edgePillGroup.appendChild(pg);
      });
    } else {
      posEdges.forEach((edge, idx) => {
        const pA = matrix.byId[edge.fromId];
        const pB = matrix.byId[edge.toId];
        if (!pA || !pB) return;

        const isNodeFocus = uiState.selectedNodeId && (edge.fromId === uiState.selectedNodeId || edge.toId === uiState.selectedNodeId);
        const isSel = uiState.selectedEdgeId === edge.id;
        if (edge.isRemote && !uiState.showRemote && !isNodeFocus && !isSel) return;

        const involved = !hasFocusFilter || isSel || isNodeFocus;
        const dimLower = expandedBranchCell && pA.row === 1 && edge.dist >= 2 && !involved;
        const st = resolveSemanticStyle(edge.action, edge.active);
        const geom = matrixEdgeGeometry(pA, pB, edge.dist, edge.rowType, matrix);

        const baseWidth = isSel ? 3.1 : (edge.dist <= 1 ? 2.35 : (edge.weak ? 1.5 : 1.8));
        const opacity = isSel ? 1 : (involved ? (dimLower ? 0.25 : (edge.dist >= 2 && edge.weak ? 0.8 : 0.92)) : 0.13);

        const eg = svgEl('g', { style: 'cursor:pointer', opacity });
        const pg = svgEl('g', { style: 'cursor:pointer', opacity: involved ? (dimLower ? 0.3 : 1) : 0.18 });

        if (!edge.active) {
          eg.appendChild(svgEl('path', {
            d: geom.d1, fill: 'none', stroke: st.color,
            'stroke-width': baseWidth, 'stroke-dasharray': '5 3'
          }));
          eg.appendChild(svgEl('path', {
            d: geom.d2, fill: 'none', stroke: st.color,
            'stroke-width': Math.max(1.2, baseWidth - 0.5),
            'stroke-dasharray': '3 5', opacity: 0.42,
            'marker-end': edge.bidirectional ? undefined : st.marker
          }));
          if (uiState.motion && involved && !dimLower) {
            appendMotionShape(eg, geom.d1, st, edge.dist <= 1 ? 0.96 : 0.85, (1.9 * st.durFactor).toFixed(2), (idx * 0.27).toFixed(2), true);
            eg.appendChild(svgEl('circle', {
              cx: geom.pillPt.x.toFixed(1), cy: geom.pillPt.y.toFixed(1), r: 11.5,
              fill: 'none', stroke: st.color, 'stroke-width': 1.2, class: 'bzv-anim-block'
            }));
          }
        } else {
          eg.appendChild(svgEl('path', {
            d: geom.d, fill: 'none', stroke: st.color,
            'stroke-width': baseWidth,
            'stroke-dasharray': edge.dist >= 2 && edge.weak ? '6 3' : 'none',
            opacity: edge.dist >= 2 ? 0.84 : 0.92,
            'marker-end': edge.bidirectional ? undefined : st.marker
          }));
          if (uiState.motion && involved && !dimLower) {
            const cnt = (edge.dist <= 1 || isSel) ? 2 : 1;
            const dur = (edge.dist <= 1 ? 2.0 : 2.5) * st.durFactor;
            const sc = edge.dist <= 1 ? 0.98 : 0.85;
            for (let k = 0; k < cnt; k++) {
              appendMotionShape(eg, geom.d, st, sc, dur.toFixed(2), (k * (dur / cnt) + idx * 0.19).toFixed(2), false);
            }
          }
        }

        const label = edge.active ? edge.action : `${edge.action}✕`;
        const pw = Math.max(44, label.length * 9.5 + 14);
        pg.appendChild(svgEl('rect', {
          x: (geom.pillPt.x - pw / 2).toFixed(1), y: (geom.pillPt.y - 9.5).toFixed(1),
          width: pw, height: 19, rx: 9.5,
          fill: P.paper, stroke: st.color, 'stroke-width': isSel ? 1.8 : 1.2
        }));
        pg.appendChild(svgEl('text', {
          x: geom.pillPt.x.toFixed(1), y: (geom.pillPt.y + 3.6).toFixed(1),
          'text-anchor': 'middle', 'font-size': 10.5, 'font-weight': 700, fill: st.color
        }, label));

        const onPick = () => {
          uiState.selectedEdgeId = edge.id;
          uiState.selectedNodeId = null;
          uiState.selectedSectorKey = null;
          onUpdate();
        };
        eg.addEventListener('click', onPick);
        pg.addEventListener('click', onPick);
        edgeLineGroup.appendChild(eg);
        edgePillGroup.appendChild(pg);
      });
    }

    svg.appendChild(edgeLineGroup);
    svg.appendChild(edgePillGroup);

    allCells.forEach(cell => {
      const sec = cell.node ? model.sectors.find(x => x.key === cell.node.sectorKey) : null;
      const st = cell.isDayMaster ? { fill: P.paper, stroke: P.gold, text: P.gold } : roleStyle(sec ? sec.role : 'neutral');
      const isSel = uiState.selectedNodeId === cell.id;
      const ng = svgEl('g', { style: 'cursor:pointer' });

      if (cell.isDayMaster) {
        if (uiState.motion) {
          ng.appendChild(svgEl('circle', {
            cx: cell.x, cy: cell.y, r: cell.r + 7,
            fill: 'none', stroke: P.gold, 'stroke-width': 1.4, class: 'bzv-anim-intake'
          }));
        }
        ng.appendChild(svgEl('circle', {
          cx: cell.x, cy: cell.y, r: cell.r,
          fill: P.paper, stroke: isSel ? P.textDark : P.gold, 'stroke-width': isSel ? 2.6 : 2.2
        }));
        renderDayMasterInkMotif(ng, cell.x, cell.y, cell.r, model);
      } else {
        if (cell.node.isMonthCommand || isSel) {
          ng.appendChild(svgEl('circle', {
            cx: cell.x, cy: cell.y, r: cell.r + 4.5,
            fill: 'none', stroke: isSel ? P.textDark : P.gold,
            'stroke-width': isSel ? 2.2 : 1.2,
            'stroke-dasharray': cell.node.attacked && !isSel ? '4 3' : 'none'
          }));
        } else if (cell.node.attacked) {
          ng.appendChild(svgEl('circle', {
            cx: cell.x, cy: cell.y, r: cell.r + 3.5,
            fill: 'none', stroke: P.neg, 'stroke-width': 1.2, 'stroke-dasharray': '3 3'
          }));
        }
        ng.appendChild(svgEl('circle', {
          cx: cell.x, cy: cell.y, r: cell.r,
          fill: P.paper, stroke: st.stroke, 'stroke-width': cell.row === 1 ? 2.2 : 1.6
        }));
        if (cell.row === 1) {
          ng.appendChild(svgEl('circle', {
            cx: cell.x, cy: cell.y, r: cell.r - 3.5,
            fill: st.fill, stroke: 'none'
          }));
        }
      }

      const dmMatrixHalo = cell.isDayMaster
        ? `paint-order:stroke; stroke:${P.paper}; stroke-width:2.4px; stroke-linejoin:round;`
        : '';
      ng.appendChild(svgEl('text', {
        x: cell.x, y: cell.y + 6.5, 'text-anchor': 'middle',
        'font-size': cell.r >= 24 ? 21 : 18, 'font-weight': 700,
        fill: P.textDark, class: 'bzv-serif', style: dmMatrixHalo
      }, cell.char));

      if (cell.node && cell.node.kind === '支' && cell.node.hidden.length) {
        const dotSpan = (cell.node.hidden.length - 1) * 5.2;
        cell.node.hidden.forEach((_, di) => {
          ng.appendChild(svgEl('circle', {
            cx: (cell.x - dotSpan / 2 + di * 5.2).toFixed(1),
            cy: (cell.y + cell.r - 5).toFixed(1),
            r: 1.6, fill: st.text
          }));
        });
      }

      if (cell.node && cell.node.isMonthCommand) {
        ng.appendChild(svgEl('circle', {
          cx: (cell.x + cell.r * 0.76).toFixed(1), cy: (cell.y - cell.r * 0.76).toFixed(1),
          r: 8.5, fill: P.gold
        }));
        ng.appendChild(svgEl('text', {
          x: (cell.x + cell.r * 0.76).toFixed(1), y: (cell.y - cell.r * 0.76 + 3.5).toFixed(1),
          'text-anchor': 'middle', 'font-size': 10, 'font-weight': 700, fill: '#fff'
        }, '令'));
      }

      const subLbl = cell.isDayMaster
        ? `${cell.element}·日主 (${model.meta.supportScore})`
        : `${cell.tenGod}·${cell.element} (${cell.weight})`;
      ng.appendChild(svgEl('text', {
        x: cell.x, y: cell.y + cell.r + 15, 'text-anchor': 'middle',
        'font-size': 11, 'font-weight': 600, fill: cell.isDayMaster ? P.gold : P.textDark,
        class: 'bzv-tabular'
      }, subLbl));

      ng.addEventListener('click', () => {
        uiState.selectedNodeId = uiState.selectedNodeId === cell.id ? null : cell.id;
        uiState.selectedSectorKey = null;
        uiState.selectedEdgeId = null;
        onUpdate();
      });
      nodesGroup.appendChild(ng);
    });

    if (expandedBranchCell) {
      const hidden = expandedBranchCell.node.hidden;
      const satGroup = svgEl('g', { class: uiState.motion ? 'bzv-anim-sat' : '' });
      const sy = 554;
      const spacing = hidden.length >= 3 ? 98 : 96;
      const rawCenter = clamp(expandedBranchCell.x, 150, 590);
      satGroup.appendChild(svgEl('line', {
        x1: expandedBranchCell.x, y1: expandedBranchCell.y + expandedBranchCell.r + 20,
        x2: rawCenter, y2: sy - 14,
        stroke: P.gold, 'stroke-width': 1.2, 'stroke-dasharray': '3 2'
      }));
      hidden.forEach((hs, hi) => {
        const sx = rawCenter + (hi - (hidden.length - 1) / 2) * spacing;
        const pillTxt = `${hs.stem}${hs.tenGod} ${hs.pct}%`;
        const pw = pillTxt.length * 8.2 + 16;
        satGroup.appendChild(svgEl('rect', {
          x: (sx - pw / 2).toFixed(1), y: sy - 11,
          width: pw, height: 22, rx: 11,
          fill: P.paper, stroke: P.gold, 'stroke-width': 1.3
        }));
        satGroup.appendChild(svgEl('text', {
          x: sx.toFixed(1), y: sy + 4,
          'text-anchor': 'middle', 'font-size': 11, 'font-weight': 600, fill: P.textDark, class: 'bzv-tabular'
        }, pillTxt));
      });
      nodesGroup.appendChild(satGroup);
    }

    svg.appendChild(nodesGroup);
  }

  function renderRelationSection(container, data, opts) {
    if (!container || !data) return;
    const recenter = !(opts && opts.recenter === false);
    const prevScrollEl = container.querySelector('#bzvRelScroll');
    const prevScrollLeft = prevScrollEl && typeof prevScrollEl.scrollLeft === 'number' ? prevScrollEl.scrollLeft : null;
    const model = buildRelationModel(data);
    const weightedShares = computeWeightedSectorShares(model);
    const displayEdges = buildDisplayFlowEdges(model);
    const matrix = computeMatrixPositions(model);
    const posEdges = buildPositionFlowEdges(model);
    const P = PALETTE;

    container.classList.toggle('bzv-motion-off', !uiState.motion);
    container.innerHTML = `
      <div class="bzv-panel">
        <div class="bzv-block-title">
          <div class="bzv-block-title-main">
            <strong>原局能量与流通图</strong>
            <span>星盘按位置权重呈强弱 · 位次图按年—月—日—时看远近</span>
          </div>
        </div>
        <div class="bzv-toolbar">
          <div class="bzv-btn-group" id="bzvRelLayers"></div>
          <div class="bzv-btn-group">
            <button type="button" class="bzv-btn" id="bzvRemoteBtn"></button>
            <button type="button" class="bzv-btn" id="bzvMotionBtn"></button>
            <button type="button" class="bzv-btn" id="bzvRelResetBtn">重置焦点</button>
          </div>
        </div>
        <div class="bzv-relation-grid">
          <div class="bzv-stage-wrap">
            <div class="bzv-stage-canvas">
              <button type="button" class="bzv-stage-zoom-btn" id="bzvRelZoomBtn"></button>
              <div class="bzv-stage-scroll" id="bzvRelScroll">
                <svg id="bzvRelationSvg" viewBox="0 0 740 580" class="bzv-svg" role="img" aria-label="原局日主能量与四柱位次流通图"></svg>
              </div>
              <div class="bzv-mobile-hint" id="bzvRelMobileHint"></div>
            </div>
            <div class="bzv-legend" id="bzvRelLegend"></div>
          </div>
          <aside class="bzv-inspector" aria-live="polite">
            <div class="bzv-inspector-head">
              <span class="bzv-inspector-title">交互焦点详解</span>
              <div class="bzv-inspector-head-right">
                <button type="button" class="bzv-back-btn" id="bzvInspBackBtn" hidden>返回全景</button>
                <span class="bzv-pill" id="bzvFocusPill"></span>
              </div>
            </div>
            <div class="bzv-inspector-body" id="bzvInspectorBody"></div>
          </aside>
        </div>
      </div>
    `;

    const rerender = () => renderRelationSection(container, data, { recenter: true });
    const rerenderKeepScroll = () => renderRelationSection(container, data, { recenter: false });

    const layerDefs = [
      ['flow', '日主生克泄耗'],
      ['position', '四柱位次流通'],
      ['interactions', '干支合冲刑破']
    ];
    const layerWrap = container.querySelector('#bzvRelLayers');
    layerWrap.innerHTML = layerDefs.map(([k, lbl]) => `
      <button type="button" data-layer="${k}" class="bzv-btn ${uiState.relLayer === k ? 'is-active' : ''}">${lbl}</button>
    `).join('');
    layerWrap.querySelectorAll('button').forEach(btn => {
      btn.onclick = () => {
        uiState.relLayer = btn.getAttribute('data-layer');
        uiState.selectedEdgeId = null;
        uiState.selectedSectorKey = null;
        rerender();
      };
    });

    const remoteBtn = container.querySelector('#bzvRemoteBtn');
    remoteBtn.hidden = uiState.relLayer === 'flow';
    remoteBtn.textContent = uiState.showRemote ? '遥隔：开' : '遥隔：关';
    remoteBtn.classList.toggle('is-active', !!uiState.showRemote);
    remoteBtn.onclick = () => {
      uiState.showRemote = !uiState.showRemote;
      rerenderKeepScroll();
    };

    const compactViewport = isCompactViewport();
    const relZoomBtn = container.querySelector('#bzvRelZoomBtn');
    if (relZoomBtn) {
      relZoomBtn.hidden = !(uiState.relLayer === 'flow' && compactViewport);
      relZoomBtn.classList.toggle('is-active', !!uiState.relZoomed);
      const zoomLabel = uiState.relZoomed ? '缩小还原星盘' : '放大查看星盘';
      if (typeof relZoomBtn.setAttribute === 'function') {
        relZoomBtn.setAttribute('aria-label', zoomLabel);
        relZoomBtn.setAttribute('title', zoomLabel);
        relZoomBtn.setAttribute('aria-pressed', uiState.relZoomed ? 'true' : 'false');
      }
      relZoomBtn.innerHTML = uiState.relZoomed
        ? `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`
        : `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`;
      relZoomBtn.onclick = () => {
        uiState.relZoomed = !uiState.relZoomed;
        rerender();
      };
    }

    const motionBtn = container.querySelector('#bzvMotionBtn');
    motionBtn.textContent = uiState.motion ? '动效：开' : '动效：关';
    motionBtn.onclick = () => {
      uiState.motion = !uiState.motion;
      rerenderKeepScroll();
    };

    container.querySelector('#bzvRelResetBtn').onclick = () => {
      uiState.selectedNodeId = null;
      uiState.selectedSectorKey = null;
      uiState.selectedEdgeId = null;
      rerender();
    };

    const svg = container.querySelector('#bzvRelationSvg');
    const isWideRel = uiState.relLayer !== 'flow';
    const isZoomedRel = uiState.relLayer === 'flow' && !!uiState.relZoomed;
    const isFlowMobile = uiState.relLayer === 'flow' && !isZoomedRel;
    if (svg.classList) {
      svg.classList.toggle('is-wide-mobile', isWideRel);
      svg.classList.toggle('is-zoomed-mobile', isZoomedRel);
      svg.classList.toggle('is-flow-mobile', isFlowMobile);
    }
    const relHintEl = container.querySelector('#bzvRelMobileHint');
    if (relHintEl) {
      const hintTxt = isWideRel
        ? '← 左右滑动查看四柱全貌 →'
        : (isZoomedRel ? '← 左右滑动细看星盘 · 点右上角缩小 →' : '← 左右滑动查看星盘 · 右上角可放大 →');
      relHintEl.textContent = hintTxt;
      if (relHintEl.classList) relHintEl.classList.toggle('is-active', !!hintTxt);
    }

    appendSvgDefs(svg, model.meta.dayElement);
    if (uiState.relLayer === 'flow') {
      renderStarWheelView(svg, model, weightedShares, displayEdges, rerenderKeepScroll);
    } else {
      if (typeof svg.setAttribute === 'function') {
        svg.setAttribute('viewBox', '0 0 740 580');
      }
      renderMatrixRelationView(svg, model, matrix, posEdges, rerenderKeepScroll);
    }

    const relScrollEl = container.querySelector('#bzvRelScroll');
    if (compactViewport && relScrollEl) {
      const syncRelScroll = () => {
        const maxScroll = relScrollEl.scrollWidth - relScrollEl.clientWidth;
        if (maxScroll > 0) {
          relScrollEl.scrollLeft = (recenter || prevScrollLeft === null)
            ? Math.round(maxScroll / 2)
            : clamp(prevScrollLeft, 0, maxScroll);
        }
      };
      syncRelScroll();
      if (typeof root.requestAnimationFrame === 'function') {
        root.requestAnimationFrame(syncRelScroll);
      }
    }

    // Layer-specific Legend
    const legendEl = container.querySelector('#bzvRelLegend');
    if (uiState.relLayer === 'position') {
      legendEl.innerHTML = `
        <div class="bzv-legend-items">
          <span class="bzv-legend-item"><svg width="16" height="10" viewBox="0 0 16 10"><line x1="1" y1="5" x2="15" y2="5" stroke="${P.textDark}" stroke-width="2.2"/></svg>同柱/紧贴（距 0–1）</span>
          <span class="bzv-legend-item"><svg width="16" height="10" viewBox="0 0 16 10"><line x1="1" y1="5" x2="15" y2="5" stroke="${P.gold}" stroke-width="1.6" stroke-dasharray="4 2"/></svg>隔柱（距 2·通关/减力）</span>
          <span class="bzv-legend-item"><svg width="16" height="10" viewBox="0 0 16 10"><line x1="1" y1="5" x2="15" y2="5" stroke="${P.neg}" stroke-width="1.6" stroke-dasharray="3 2"/></svg>受阻✕ / 遥隔（距 3）</span>
          <span class="bzv-legend-item"><svg width="12" height="10" viewBox="0 0 12 10"><circle cx="6" cy="5" r="3.2" fill="${P.pos}"/></svg>生助</span>
          <span class="bzv-legend-item"><svg width="13" height="10" viewBox="0 0 13 10"><polygon points="1,1.8 11.5,5 1,8.2 4,5" fill="${P.neg}"/></svg>克压/盖头</span>
          <span class="bzv-legend-item"><svg width="13" height="10" viewBox="0 0 13 10"><polygon points="1,1.8 11.5,5 1,8.2 4,5" fill="${P.ctrl}"/></svg>制</span>
        </div>
        <span>点干支可展藏干 · 点连线看推演来源</span>
      `;
    } else if (uiState.relLayer === 'interactions') {
      legendEl.innerHTML = `
        <div class="bzv-legend-items">
          <span class="bzv-legend-item"><svg width="16" height="10" viewBox="0 0 16 10"><line x1="1" y1="5" x2="15" y2="5" stroke="${P.sec}" stroke-width="2.2"/></svg>六合 / 合化倾向</span>
          <span class="bzv-legend-item"><svg width="16" height="10" viewBox="0 0 16 10"><line x1="1" y1="5" x2="15" y2="5" stroke="${P.neg}" stroke-width="2" stroke-dasharray="4 2"/></svg>破 / 刑 / 冲 / 合绊 / 遥合</span>
        </div>
        <span>水平道=紧贴 · 上下弧道=隔柱/遥隔</span>
      `;
    } else {
      legendEl.innerHTML = `
        <div class="bzv-legend-items">
          <span class="bzv-legend-item"><svg width="12" height="10" viewBox="0 0 12 10"><circle cx="6" cy="5" r="3.2" fill="${P.pos}"/></svg>生助（向内）</span>
          <span class="bzv-legend-item"><svg width="16" height="10" viewBox="0 0 16 10"><circle cx="4.5" cy="5" r="2.5" fill="${P.gold}"/><circle cx="11" cy="5" r="2.5" fill="${P.gold}"/></svg>助旺（向内）</span>
          <span class="bzv-legend-item"><svg width="14" height="10" viewBox="0 0 14 10"><path d="M2,2.8 Q7,2.4 12,5 Q7,7.6 2,7.2 Q4,5 2,2.8 Z" fill="${P.sec}"/></svg>泄秀（喜泄向外）</span>
          <span class="bzv-legend-item"><svg width="14" height="10" viewBox="0 0 14 10"><path d="M2,2.8 Q7,2.4 12,5 Q7,7.6 2,7.2 Q4,5 2,2.8 Z" fill="${P.drain}"/></svg>泄气/生泄（耗泄向外）</span>
          <span class="bzv-legend-item"><svg width="14" height="10" viewBox="0 0 14 10"><rect x="2" y="2.8" width="10" height="4.4" rx="2.2" fill="${P.bronze}"/></svg>耗力（向外）</span>
          <span class="bzv-legend-item"><svg width="13" height="10" viewBox="0 0 13 10"><polygon points="1,1.8 11.5,5 1,8.2 4,5" fill="${P.neg}"/></svg>克压/克制（向内）</span>
          <span class="bzv-legend-item"><svg width="16" height="10" viewBox="0 0 16 10"><line x1="1" y1="5" x2="15" y2="5" stroke="${P.neg}" stroke-width="1.6" stroke-dasharray="3 2"/></svg>受阻✕（合绊）</span>
        </div>
        <span>扇瓣大小按强弱分级呈现 · 极弱保底可见（月令 40 最高）</span>
      `;
    }

    renderRelationInspector(container, model, weightedShares, displayEdges, matrix, posEdges, rerender);
  }

  function findRootsForElement(model, wx) {
    const out = [];
    model.nodes.forEach(node => {
      if (node.kind !== '支' || !Array.isArray(node.hidden)) return;
      node.hidden.forEach(h => {
        if (h.element === wx) {
          out.push({
            node,
            stem: h.stem,
            tenGod: h.tenGod,
            pct: h.pct,
            weighted: round2((node.weight || 0) * ((Number(h.pct) || 0) / 100))
          });
        }
      });
    });
    out.sort((a, b) => b.weighted - a.weighted);
    return out;
  }

  function findStemRevealInfo(model, hiddenStem, wx) {
    const stems = model.nodes.filter(n => n.kind === '干');
    const exact = stems.filter(n => n.char === hiddenStem);
    if (exact.length) {
      return `透于${exact.map(n => `${n.pillarLabel}${n.char}`).join('、')}`;
    }
    if (hiddenStem === model.meta.dayStem) {
      return `与日主${model.meta.dayStem}同干显象`;
    }
    const sameWx = stems.filter(n => n.element === wx);
    if (sameWx.length) {
      return `同气透于${sameWx.map(n => `${n.pillarLabel}${n.char}`).join('、')}`;
    }
    if (wx === model.meta.dayElement) {
      return `同五行映于日主${model.meta.dayStem}`;
    }
    return '藏而未透';
  }

  function computeSupportVsDrainSummary(model, weightedShares) {
    const byKey = weightedShares.byKey || {};
    const supportPct = round2(((byKey.resource && byKey.resource.pct) || 0) + ((byKey.companion && byKey.companion.pct) || 0));
    const drainPct = round2(((byKey.output && byKey.output.pct) || 0) + ((byKey.wealth && byKey.wealth.pct) || 0) + ((byKey.officer && byKey.officer.pct) || 0));
    const rows = model.sectors.map(sec => {
      const pct = round2((byKey[sec.key] && byKey[sec.key].pct) || 0);
      const nodes = model.nodes.filter(n => n.sectorKey === sec.key);
      return Object.assign({}, sec, { pct, nodes });
    });
    const dominant = rows.slice().sort((a, b) => b.pct - a.pct)[0] || rows[0];
    return { supportPct, drainPct, rows, dominant };
  }

  function roleBadgeHtml(role, roleLabel) {
    const cls = role === 'primaryUse' ? 'is-pos'
      : (role === 'secondaryUse' ? 'is-sec'
        : (role === 'avoid' ? 'is-neg' : 'is-neu'));
    return `<span class="bzv-role-badge ${cls}">${esc(roleLabel || '中')}</span>`;
  }

  function edgeActionSemantics(action) {
    const map = {
      '生助': '向内生扶日主',
      '助旺': '向内同气帮身',
      '泄秀': '喜用/身旺良性泄秀（向外）',
      '泄气': '身弱/忌神盗泄耗气（向外）',
      '生泄': '中性食伤向外生泄',
      '耗力': '向外耗力克财',
      '克制': '天干向内克制',
      '克压': '地支向内克压'
    };
    return map[action] || (action || '气脉作用');
  }

  function pillarPositionHint(node) {
    const map = {
      monthBranch: '月令提纲 · 权重 40 居全盘之首',
      dayBranch: '日主坐支 · 与日主同柱紧贴',
      monthStem: '月干 · 紧贴日主左侧',
      hourStem: '时干 · 紧贴日主右侧',
      yearStem: '年干 · 远柱透干',
      yearBranch: '年支 · 根基远支',
      hourBranch: '时支 · 晚柱归宿'
    };
    return map[node.id] || `${node.pillarLabel} · 原局干支`;
  }

  function usefulChipsHtml(model) {
    const chips = [];
    model.sectors.filter(s => s.role === 'primaryUse').forEach(s => {
      chips.push(`<span class="bzv-chip is-pos">主用：${esc(s.wx)}（${esc(s.name)}）</span>`);
    });
    model.sectors.filter(s => s.role === 'secondaryUse').forEach(s => {
      chips.push(`<span class="bzv-chip is-sec">佐用：${esc(s.wx)}（${esc(s.name)}）</span>`);
    });
    model.sectors.filter(s => s.role === 'avoid').forEach(s => {
      chips.push(`<span class="bzv-chip is-neg">忌神：${esc(s.wx)}（${esc(s.name)}）</span>`);
    });
    return chips.join('');
  }

  function describeRefNode(model, id) {
    if (id === 'dayMaster') {
      return `${model.meta.dayStem}${model.meta.dayElement}日主（扶身 ${model.meta.supportScore}）`;
    }
    const n = model.nodes.find(x => x.id === id);
    return n ? `${n.pillarLabel}「${n.char}」${n.tenGod}（${n.element} · 权重 ${n.weight}）` : id;
  }

  function renderRelationInspector(container, model, weightedShares, displayEdges, matrix, posEdges, rerender) {
    const focusPill = container.querySelector('#bzvFocusPill');
    const body = container.querySelector('#bzvInspectorBody');
    const backBtn = container.querySelector('#bzvInspBackBtn');
    const hasFocus = !!(uiState.selectedNodeId || uiState.selectedSectorKey || uiState.selectedEdgeId);
    if (backBtn) {
      backBtn.hidden = !hasFocus;
      backBtn.onclick = () => {
        uiState.selectedNodeId = null;
        uiState.selectedSectorKey = null;
        uiState.selectedEdgeId = null;
        rerender();
      };
    }

    const summary = computeSupportVsDrainSummary(model, weightedShares);
    const totalW = weightedShares.totalWeight || 100;

    if (uiState.selectedNodeId === 'dayMaster') {
      focusPill.textContent = '日主核心';
      const dmRoots = findRootsForElement(model, model.meta.dayElement);
      const dmEdges = displayEdges
        .filter(e => e.nodeId && (e.fromId === 'dayMaster' || e.toId === 'dayMaster'))
        .slice()
        .sort((a, b) => (b.weight || 0) - (a.weight || 0));
      const dmAdjPos = posEdges.filter(e => !e.isRemote && e.dist <= 1 && (e.fromId === 'dayMaster' || e.toId === 'dayMaster'));
      const usefulHtml = usefulChipsHtml(model);
      const phenomHtml = (model.meta.phenomena || []).map(p => `<span class="bzv-chip">${esc(p)}</span>`).join('');

      const sectorRowHtml = row => {
        const nodeSummary = row.nodes.length
          ? row.nodes.map(n => `${n.pillarLabel}${n.char}(${n.tenGod})`).join('、')
          : '明字未落入';
        return `<div class="bzv-detail-row"><span><strong>${esc(row.name)}（${esc(row.wx)}）</strong> <span class="bzv-sub-note">${esc(nodeSummary)}</span></span><span>${roleBadgeHtml(row.role, row.roleLabel)} <strong class="bzv-tabular">${row.pct.toFixed(1)}%</strong></span></div>`;
      };

      body.innerHTML = `
        <div class="bzv-inspector-main">
          <span class="bzv-inspector-headline">
            <strong>${esc(model.meta.dayStem)}${esc(model.meta.dayElement)}日主 · ${esc(model.meta.strength)}</strong>
            ${model.meta.imagery ? `<span class="bzv-imagery-tag">意象：${esc(model.meta.imagery)}</span>` : ''}
          </span>
          <span class="bzv-inspector-meta">扶身指数 ${model.meta.supportScore} / 100 · 生扶 ${summary.supportPct.toFixed(1)}% · 泄耗克 ${summary.drainPct.toFixed(1)}%</span>
        </div>
        <p>${model.meta.seasonal
          ? `月令司令「${esc(model.meta.seasonal.commander)}」（节后 ${model.meta.seasonal.elapsedDays} 日 · ${esc(model.meta.seasonal.effect)}），扶身指标须结合有效根透判读。`
          : '扶身指标仅按固定比例作参考，强弱还须结合司令与有效根透核对。'}</p>
        ${(usefulHtml || phenomHtml) ? `<div class="bzv-chip-row">${usefulHtml}${phenomHtml}</div>` : ''}
        <p class="bzv-sub-note">日主地支通根（${esc(model.meta.dayElement)}）：${dmRoots.length
          ? dmRoots.map(r => `${esc(r.node.pillarLabel)}${esc(r.node.char)}藏${esc(r.stem)}(${r.pct}%·折算${r.weighted})`).join('、')
          : '四柱地支无同五行本气/余气通根'}</p>
        <div class="bzv-detail-grid">
          <div class="bzv-detail-card">
            <div class="bzv-detail-card-title"><span>五行力量格局分布</span><span>总权重 ${totalW}</span></div>
            <div class="bzv-sub-note">生扶方 ${summary.supportPct.toFixed(1)}%</div>
            ${summary.rows.slice(0, 2).map(sectorRowHtml).join('')}
            <div class="bzv-sub-note" style="margin-top:4px">泄耗克方 ${summary.drainPct.toFixed(1)}%</div>
            ${summary.rows.slice(2).map(sectorRowHtml).join('')}
          </div>
          <div class="bzv-detail-card">
            <div class="bzv-detail-card-title"><span>直联日主气脉与紧贴关系</span><span>${dmEdges.length} 路干支</span></div>
            ${dmEdges.map(e => `<div>• ${esc(e.text)}（${esc(edgeActionSemantics(e.action))} · 权重 ${e.weight || '-'} · ${e.active ? '畅通' : '<span class="bzv-note-warn">受阻✕</span>'}）</div>`).join('')}
            ${dmAdjPos.length ? `<div class="bzv-list"><div class="bzv-list-title">紧贴日主位次（距 ≤ 1）</div>${dmAdjPos.map(e => `<div>• ${esc(e.text)} <span class="bzv-tag-origin">[${e.origin === 'engine' ? '引擎直出' : '位次模型'}]</span></div>`).join('')}</div>` : ''}
          </div>
        </div>
      `;
    } else if (uiState.selectedNodeId) {
      const node = model.nodes.find(n => n.id === uiState.selectedNodeId);
      if (!node) return;
      const sec = model.sectors.find(s => s.key === node.sectorKey);
      const weightPct = round2((node.weight / totalW) * 100);
      const dmEdge = displayEdges.find(e => e.nodeId === node.id || (e.sourceType && e.sourceType.indexOf('daymaster') === 0 && (e.fromId === node.id || e.toId === node.id)));
      focusPill.textContent = node.kind === '支' ? '地支·藏干已展' : '天干透出';

      const relatedEdges = displayEdges.filter(e => e.fromId === node.id || e.toId === node.id);
      const adjPosEdges = posEdges.filter(e => (!e.isRemote || uiState.showRemote) && e.dist <= 1 && (e.fromId === node.id || e.toId === node.id));
      const samePillarPos = posEdges.filter(e => e.dist === 0 && (e.fromId === node.id || e.toId === node.id));
      const relatedInter = model.interactions.filter(i => i.leftId === node.id || i.rightId === node.id);

      let rootBlockHtml = '';
      if (node.kind === '支') {
        const hiddenChips = node.hidden.length
          ? `<div class="bzv-chip-row">${node.hidden.map(h => `<span class="bzv-chip">${esc(h.stem)} ${esc(h.tenGod)}（${esc(h.element)}）${h.pct}%</span>`).join('')}</div>`
          : '<div class="bzv-sub-note">无藏干记录</div>';
        const hiddenDetail = node.hidden.map(h => {
          const wPart = round2((node.weight || 0) * ((Number(h.pct) || 0) / 100));
          return `<div>• <strong>${esc(h.stem)}</strong> ${esc(h.tenGod)}（${esc(h.element)}） · ${h.pct}% · 折算权重 ${wPart} · ${esc(findStemRevealInfo(model, h.stem, h.element))}</div>`;
        }).join('');
        const commanderNote = (node.isMonthCommand && model.meta.seasonal)
          ? `<div class="bzv-sub-note">月令司令：「${esc(model.meta.seasonal.commander)}」（节后 ${model.meta.seasonal.elapsedDays} 日 · ${esc(model.meta.seasonal.effect)}）</div>`
          : '';
        rootBlockHtml = `
          <div class="bzv-detail-card-title"><span>地支藏干与透干情况</span><span>${node.hidden.length} 藏干</span></div>
          ${hiddenChips}${hiddenDetail}${commanderNote}
        `;
      } else {
        const roots = findRootsForElement(model, node.element);
        const rootChips = roots.length
          ? `<div class="bzv-chip-row">${roots.map(r => `<span class="bzv-chip">${esc(r.node.pillarLabel)}${esc(r.node.char)} 藏${esc(r.stem)}(${r.pct}%)</span>`).join('')}</div>`
          : '';
        const rootList = roots.length
          ? roots.map(r => `<div>• <strong>${esc(r.node.pillarLabel)}「${esc(r.node.char)}」</strong> 藏 ${esc(r.stem)}${esc(r.tenGod)}（${r.pct}% · 折算权重 ${r.weighted}）</div>`).join('')
          : '<div class="bzv-sub-note">四支无根，属虚浮透干，须借岁运通根或他柱生助。</div>';
        const sitHtml = samePillarPos.length
          ? `<div class="bzv-list"><div class="bzv-list-title">同柱坐支作用</div>${samePillarPos.map(e => `<div>• ${esc(e.text)}（${esc(e.status)}） <span class="bzv-tag-origin">[${e.origin === 'engine' ? '引擎直出' : '位次模型'}]</span></div>`).join('')}</div>`
          : '';
        rootBlockHtml = `
          <div class="bzv-detail-card-title"><span>天干通根与坐支剖析</span><span>${roots.length ? `${roots.length} 处通根` : '无根'}</span></div>
          ${rootChips}${rootList}${sitHtml}
        `;
      }

      const feedbackHtml = [
        node.stemChange ? `<p class="bzv-note-gold">天干合化/合绊：${esc(node.stemChange.status || `${node.stemChange.effect || ''} ${node.stemChange.target || ''}`.trim())}</p>` : '',
        node.groupChange ? `<p class="bzv-note-gold">合会反馈：${esc(node.groupChange.name || '')}${node.groupChange.status ? `（${esc(node.groupChange.status)}）` : ''}</p>` : '',
        node.attacks.length ? `<p class="bzv-note-warn">支间受损提示：${esc(node.attacks.join('、'))}</p>` : ''
      ].join('');

      body.innerHTML = `
        <div class="bzv-inspector-main">
          <strong>${esc(node.pillarLabel)}「${esc(node.char)}」· ${esc(node.tenGod)}（${esc(node.element)}）</strong>
          <div class="bzv-inspector-head-right">
            ${sec ? roleBadgeHtml(sec.role, sec.roleLabel) : ''}
            <span class="bzv-inspector-meta">原生权重 ${node.weight}（占全盘 ${weightPct.toFixed(1)}%） · 扶身贡献 ${node.supportScore}</span>
          </div>
        </div>
        <p>${esc(pillarPositionHint(node))}${dmEdge ? ` · 对日主：${esc(dmEdge.action)}（${esc(edgeActionSemantics(dmEdge.action))}，${dmEdge.active ? '畅通' : '受阻✕'}）` : ''}</p>
        ${feedbackHtml}
        <div class="bzv-detail-grid">
          <div class="bzv-detail-card">${rootBlockHtml}</div>
          <div class="bzv-detail-card">
            <div class="bzv-detail-card-title"><span>气脉流向、紧贴位次与合冲刑破</span><span>${sec ? esc(sec.name) : ''}</span></div>
            ${relatedEdges.length ? relatedEdges.map(e => `<div>• ${esc(e.text)}（${esc(e.route)} · ${e.active ? '畅通' : '<span class="bzv-note-warn">受阻✕</span>'}）</div>`).join('') : '<div class="bzv-sub-note">暂无额外气脉</div>'}
            ${adjPosEdges.length ? `<div class="bzv-list"><div class="bzv-list-title">同柱 / 紧贴位次（距 ≤ 1）</div>${adjPosEdges.map(e => `<div>• ${esc(e.text)} <span class="bzv-tag-origin">[${e.origin === 'engine' ? '引擎直出' : '位次模型'}]</span></div>`).join('')}</div>` : ''}
            ${relatedInter.length ? `<div class="bzv-list"><div class="bzv-list-title">合冲刑破条款</div>${relatedInter.map(i => `<div>• ${esc(i.text)}${i.status ? `（${esc(i.status)}）` : ''}</div>`).join('')}</div>` : ''}
          </div>
        </div>
      `;
    } else if (uiState.selectedSectorKey) {
      const sec = model.sectors.find(x => x.key === uiState.selectedSectorKey);
      const share = weightedShares.byKey[sec.key] || { pct: 0 };
      const secNodes = model.nodes.filter(n => n.sectorKey === sec.key);
      const secRoots = findRootsForElement(model, sec.wx);
      const nodeIds = new Set(secNodes.map(n => n.id));
      const secEdges = displayEdges.filter(e => e.sectorKey === sec.key || nodeIds.has(e.fromId) || nodeIds.has(e.toId));
      const secInter = model.interactions.filter(i => nodeIds.has(i.leftId) || nodeIds.has(i.rightId));
      focusPill.textContent = `五行扇区 · ${sec.roleLabel}`;

      body.innerHTML = `
        <div class="bzv-inspector-main">
          <strong>${esc(sec.name)}（${esc(sec.wx)} · ${esc(sec.rel)}）</strong>
          <div class="bzv-inspector-head-right">
            ${roleBadgeHtml(sec.role, sec.roleLabel)}
            <span class="bzv-inspector-meta">加权占比 ${share.pct.toFixed(1)}% · 五行分值 ${sec.score}</span>
          </div>
        </div>
        <div class="bzv-detail-grid">
          <div class="bzv-detail-card">
            <div class="bzv-detail-card-title"><span>能量来源：明字落位 + 地支暗藏</span><span>共 ${secNodes.length} 明字 · ${secRoots.length} 藏干</span></div>
            <div class="bzv-sub-note">天干地支本气明字：</div>
            ${secNodes.length
              ? secNodes.map(n => `<div>• <strong>${esc(n.pillarLabel)}「${esc(n.char)}」</strong> · ${esc(n.tenGod)}（权重 ${n.weight}）</div>`).join('')
              : '<div class="bzv-sub-note">• 本气明字未落入，主要靠地支藏干或岁运补入。</div>'}
            <div class="bzv-list"><div class="bzv-list-title">地支藏干贡献（含权重折算）</div>${secRoots.length
              ? secRoots.map(r => `<div>• ${esc(r.node.pillarLabel)}「${esc(r.node.char)}」藏 <strong>${esc(r.stem)}</strong>（${esc(r.tenGod)} ${r.pct}% · 折算 ${r.weighted} · ${esc(findStemRevealInfo(model, r.stem, sec.wx))}）</div>`).join('')
              : '<div class="bzv-sub-note">• 四柱地支亦无该五行藏干。</div>'}</div>
          </div>
          <div class="bzv-detail-card">
            <div class="bzv-detail-card-title"><span>十神职能与关联气脉</span><span>${esc(sec.rel)}</span></div>
            <div>包含十神：<strong>${esc(sec.gods.join(' / '))}</strong> · 本盘定位：<strong>${esc(sec.roleLabel)}</strong></div>
            ${secEdges.length ? `<div class="bzv-list"><div class="bzv-list-title">经过该扇区的气脉</div>${secEdges.map(e => `<div>• ${esc(e.text)}（${e.active ? '畅通' : '<span class="bzv-note-warn">受阻✕</span>'}）</div>`).join('')}</div>` : ''}
            ${secInter.length ? `<div class="bzv-list"><div class="bzv-list-title">涉及合冲刑破</div>${secInter.map(i => `<div>• ${esc(i.text)}</div>`).join('')}</div>` : ''}
          </div>
        </div>
      `;
    } else if (uiState.selectedEdgeId) {
      const posEdge = posEdges.find(e => e.id === uiState.selectedEdgeId);
      const edge = displayEdges.find(e => e.id === uiState.selectedEdgeId);
      const inter = model.interactions.find(i => i.id === uiState.selectedEdgeId);
      if (posEdge) {
        const isEngine = posEdge.origin === 'engine';
        const pairInter = model.interactions.filter(i =>
          (i.leftId === posEdge.fromId && i.rightId === posEdge.toId) ||
          (i.leftId === posEdge.toId && i.rightId === posEdge.fromId)
        );
        focusPill.textContent = posEdge.isRemote ? '遥隔线索' : (posEdge.active ? '畅通位次脉' : '受阻 / 通关拦截');
        body.innerHTML = `
          <div class="bzv-inspector-main">
            <strong>${esc(posEdge.route)}</strong>
            <span class="bzv-pill ${isEngine ? 'bzv-pill-engine' : 'bzv-pill-model'}">${isEngine ? '引擎主链直出' : '位次模型推演（待补入主引擎）'}</span>
          </div>
          <div class="bzv-detail-grid">
            <div class="bzv-detail-card">
              <div class="bzv-detail-card-title"><span>作用条款与距离层级</span><span>${esc(DIST_LABELS[posEdge.dist] || '')}</span></div>
              <div><strong>${esc(posEdge.text)}</strong></div>
              <div>${esc(posEdge.status)}</div>
            </div>
            <div class="bzv-detail-card">
              <div class="bzv-detail-card-title"><span>两端干支权重与叠见关系</span><span>${posEdge.active ? '畅通' : '受阻✕'}</span></div>
              <div>• 施力方：${esc(describeRefNode(model, posEdge.fromId))}</div>
              <div>• 受力方：${esc(describeRefNode(model, posEdge.toId))}</div>
              ${pairInter.length ? `<div class="bzv-list"><div class="bzv-list-title">同对合冲</div>${pairInter.map(i => `<div>• ${esc(i.text)}</div>`).join('')}</div>` : ''}
            </div>
          </div>
        `;
      } else if (edge) {
        const siblings = (edge.nodeId && edge.sectorKey)
          ? displayEdges.filter(x => x.nodeId && x.sectorKey === edge.sectorKey && x.action === edge.action && x.active === edge.active)
          : [edge];
        const sec = edge.sectorKey ? model.sectors.find(s => s.key === edge.sectorKey) : null;
        const bundleWeight = round2(siblings.reduce((acc, x) => acc + (x.weight || 0), 0));
        const endIds = new Set(siblings.flatMap(x => [x.fromId, x.toId]).filter(id => id && id !== 'dayMaster'));
        const relatedInter = model.interactions.filter(i => endIds.has(i.leftId) || endIds.has(i.rightId));
        const relatedChains = displayEdges.filter(x => !x.nodeId && (endIds.has(x.fromId) || endIds.has(x.toId)));
        focusPill.textContent = edge.active ? '畅通气脉' : '受阻路径';

        body.innerHTML = `
          <div class="bzv-inspector-main">
            <strong>${esc(edge.route)}${siblings.length > 1 ? ` · ${esc(edge.action)}合流（${siblings.length} 柱）` : ''}</strong>
            <div class="bzv-inspector-head-right">
              ${sec ? roleBadgeHtml(sec.role, sec.roleLabel) : ''}
              <span class="bzv-pill bzv-pill-engine">${edge.nodeId ? `合流权重 ${bundleWeight}` : '原局气脉'}</span>
            </div>
          </div>
          <div class="bzv-detail-grid">
            <div class="bzv-detail-card">
              <div class="bzv-detail-card-title"><span>气脉流向与同向分枝明细</span><span>${esc(edgeActionSemantics(edge.action))}</span></div>
              <div><strong>${esc(edge.text)}</strong></div>
              <div class="bzv-sub-note">${esc(edge.status)}</div>
              <div class="bzv-list">${siblings.map(x => {
                const n = x.nodeId ? model.nodes.find(nd => nd.id === x.nodeId) : null;
                return `<div>• ${n ? `${esc(n.pillarLabel)}「${esc(n.char)}」${esc(n.tenGod)}（权重 ${n.weight}）` : `${esc(x.fromLabel)} → ${esc(x.toLabel)}`} · ${x.active ? '畅通' : '<span class="bzv-note-warn">受阻✕</span>'}</div>`;
              }).join('')}</div>
            </div>
            <div class="bzv-detail-card">
              <div class="bzv-detail-card-title"><span>两端与关联主链／合冲</span><span>${sec ? `${esc(sec.name)}·${esc(sec.wx)}` : '作用端详情'}</span></div>
              ${edge.nodeId ? `<div>• 核心受/施力：${esc(model.meta.dayStem)}${esc(model.meta.dayElement)}日主（扶身 ${model.meta.supportScore}）</div>` : `<div>• 施力方：${esc(describeRefNode(model, edge.fromId))}</div><div>• 受力方：${esc(describeRefNode(model, edge.toId))}</div>`}
              ${relatedChains.map(c => `<div>• [${esc(c.route)}] ${esc(c.text)}</div>`).join('')}
              ${relatedInter.length ? `<div class="bzv-list"><div class="bzv-list-title">关联合冲刑破</div>${relatedInter.map(i => `<div>• ${esc(i.text)}</div>`).join('')}</div>` : (!relatedChains.length ? '<div class="bzv-sub-note">关联节点无额外合冲阻隔，气脉直接传导。</div>' : '')}
            </div>
          </div>
        `;
      } else if (inter) {
        const samePair = model.interactions.filter(i =>
          (i.leftId === inter.leftId && i.rightId === inter.rightId) ||
          (i.leftId === inter.rightId && i.rightId === inter.leftId)
        );
        const pA = matrix.byId[inter.leftId], pB = matrix.byId[inter.rightId];
        const dist = (pA && pB) ? Math.abs(pA.col - pB.col) : null;
        focusPill.textContent = dist !== null ? `干支作用 · ${DIST_LABELS[dist]}` : `干支作用 · ${inter.type}`;
        body.innerHTML = `
          <div class="bzv-inspector-main">
            <strong>${esc(samePair.map(i => i.text).join('；'))}</strong>
            <span class="bzv-pill bzv-pill-engine">引擎合冲裁决</span>
          </div>
          <div class="bzv-detail-grid">
            <div class="bzv-detail-card">
              <div class="bzv-detail-card-title"><span>裁决条款</span><span>${dist !== null ? esc(DIST_LABELS[dist]) : esc(inter.type)}</span></div>
              ${samePair.map(i => `<div>• ${esc(i.type)}：${esc(i.status || '原局作用')}</div>`).join('')}
            </div>
            <div class="bzv-detail-card">
              <div class="bzv-detail-card-title"><span>作用两端干支</span><span>权重对照</span></div>
              <div>• ${esc(describeRefNode(model, inter.leftId))}</div>
              <div>• ${esc(describeRefNode(model, inter.rightId))}</div>
            </div>
          </div>
        `;
      }
    } else {
      focusPill.textContent = uiState.relLayer === 'flow' ? '星盘全景' : (uiState.relLayer === 'position' ? '四柱位次' : '合冲明细');
      const blocked = displayEdges.filter(e => !e.active);
      const chains = displayEdges.filter(e => e.sourceType === 'engine-chain' || e.sourceType === 'remedy-chain');
      const topDirect = displayEdges
        .filter(e => e.nodeId)
        .slice()
        .sort((a, b) => (b.weight || 0) - (a.weight || 0))
        .slice(0, 2);
      const layerDesc = uiState.relLayer === 'position'
        ? '按真实「年—月—日—时」排布同柱上下、紧贴邻柱与隔柱十神互作用；点连线或干支看完整拆解。'
        : (uiState.relLayer === 'interactions'
          ? '按四柱位次展示合冲刑破远近：水平主道为紧贴，上下弧道为隔柱与遥合；点连线或干支看完整条款。'
          : '当前展示原局 7 处干支与日主的生克泄耗流向及原生位置权重；点日主、扇瓣、连线或任意干支看完整剖析。');

      const highlights = [];
      if (blocked.length) {
        blocked.slice(0, 2).forEach(e => highlights.push(`<div>• 受阻线索：${esc(e.text)} <span class="bzv-note-warn">（${esc(e.status)}）</span></div>`));
      }
      if (chains.length) {
        chains.slice(0, 2).forEach(e => highlights.push(`<div>• ${esc(e.route)}：${esc(e.text)}</div>`));
      }
      if (!highlights.length) {
        topDirect.forEach(e => highlights.push(`<div>• 强势直联：${esc(e.text)}（权重 ${e.weight}）</div>`));
      }

      body.innerHTML = `
        <div class="bzv-inspector-main">
          <span class="bzv-inspector-headline">
            <strong>${esc(model.meta.dayStem)}${esc(model.meta.dayElement)}日主 · ${esc(model.meta.strength)}</strong>
            ${model.meta.imagery ? `<span class="bzv-imagery-tag">意象：${esc(model.meta.imagery)}</span>` : ''}
          </span>
          <span class="bzv-inspector-meta">扶身指数 ${model.meta.supportScore} / 100 · 月令权重 40 居首</span>
        </div>
        <div class="bzv-chip-row">${usefulChipsHtml(model)}</div>
        <div class="bzv-detail-grid">
          <div class="bzv-detail-card">
            <div class="bzv-detail-card-title"><span>原局能量态势</span><span>${esc(summary.dominant.name)}最旺 ${summary.dominant.pct.toFixed(1)}%</span></div>
            <div>生扶方（印星 + 比劫）：<strong>${summary.supportPct.toFixed(1)}%</strong> · 泄耗克方（食伤 + 财 + 官杀）：<strong>${summary.drainPct.toFixed(1)}%</strong></div>
            <div class="bzv-sub-note">${summary.rows.map(r => `${esc(r.name)} ${r.pct.toFixed(1)}%`).join(' · ')}</div>
          </div>
          <div class="bzv-detail-card">
            <div class="bzv-detail-card-title"><span>关键脉络与交互指引</span><span>${model.interactions.length} 组原局合冲</span></div>
            ${highlights.join('')}
            <div class="bzv-sub-note">${esc(layerDesc)}</div>
          </div>
        </div>
      `;
    }
  }

  // ---------- Luck Curve Data Extraction (Lazy & Memoized) ----------
  function layerWeight(ev) {
    const lv = String((ev && ev.level) || '');
    if (lv === 'Y1' || lv === 'Y2') return 2.6;
    if (lv === 'Y3') return 1.9;
    if (lv === 'Y4') return 1.3;
    if (lv === 'Y5-primary') return 0.95;
    if (lv.indexOf('Y5-') === 0) return 0.65;
    if (lv === 'T-year') return 0.85;
    if (lv === 'T-tone') return 0.55;
    return 0.4;
  }

  function computeSeriesValues(item, dir, toneScore, inc) {
    const ev = (item && item.evidence) || [];
    const res = (item && item.reservations) || [];
    const posEv = ev.filter(e => e.direction === 'positive');
    const negEv = ev.filter(e => e.direction === 'negative');
    const posStr = posEv.length ? Math.max.apply(null, posEv.map(layerWeight)) + 0.2 * (posEv.length - 1) : 0;
    const negStr = negEv.length ? Math.max.apply(null, negEv.map(layerWeight)) + 0.2 * (negEv.length - 1) : 0;
    const resPos = res.some(r => r.direction === 'positive') ? 0.35 : 0;
    const resNeg = res.some(r => r.direction === 'negative') ? 0.35 : 0;

    let base = 0;
    if (dir === 'positive') base = Math.max(posStr, 0.8);
    else if (dir === 'negative') base = -Math.max(negStr, 0.8);
    else if (dir === 'mixed') base = (posStr - negStr) * 0.65;

    const toneAdj = (toneScore || 0) * 0.45;
    const incAdj = inc === 'positive' ? 0.25 : (inc === 'negative' ? -0.25 : 0);
    const yValue = clamp(round2(base + toneAdj + incAdj), -4.8, 4.8);

    const hasDual = dir === 'mixed' || (posStr > 0 && negStr > 0);
    const wickUp = (hasDual || resPos > 0)
      ? clamp(round2(Math.max(posStr, resPos) + Math.max(0, toneScore || 0) * 0.25), 0, 2.2)
      : 0;
    const wickDown = (hasDual || resNeg > 0)
      ? clamp(round2(Math.max(negStr, resNeg) + Math.max(0, -(toneScore || 0)) * 0.25), 0, 2.2)
      : 0;

    return { yValue, wickUp, wickDown };
  }

  function extractOutlookLines(ann) {
    if (!ann) return { posStd: [], negStd: [], resStd: [], posPro: [], negPro: [], resPro: [] };
    if (typeof root.outlookDisplayView === 'function') {
      const view = root.outlookDisplayView(ann);
      const items = (view && view.items) || [];
      const posStd = [], negStd = [], posPro = [], negPro = [];
      items.forEach(it => {
        if (!it) return;
        if (it.direction === 'positive') {
          if (it.standard) posStd.push(it.standard);
          if (it.professional) posPro.push(it.professional);
        } else if (it.direction === 'negative') {
          if (it.standard) negStd.push(it.standard);
          if (it.professional) negPro.push(it.professional);
        }
      });
      if (view && view.mixed) {
        if (view.mixed.benefit && view.mixed.benefit.standard && posStd.indexOf(view.mixed.benefit.standard) < 0) posStd.unshift(view.mixed.benefit.standard);
        if (view.mixed.cost && view.mixed.cost.standard && negStd.indexOf(view.mixed.cost.standard) < 0) negStd.unshift(view.mixed.cost.standard);
        if (view.mixed.benefit && view.mixed.benefit.professional && posPro.indexOf(view.mixed.benefit.professional) < 0) posPro.unshift(view.mixed.benefit.professional);
        if (view.mixed.cost && view.mixed.cost.professional && negPro.indexOf(view.mixed.cost.professional) < 0) negPro.unshift(view.mixed.cost.professional);
      }
      return {
        posStd: Array.from(new Set(posStd)).slice(0, 3),
        negStd: Array.from(new Set(negStd)).slice(0, 3),
        resStd: [],
        posPro: Array.from(new Set(posPro)).slice(0, 3),
        negPro: Array.from(new Set(negPro)).slice(0, 3),
        resPro: []
      };
    }

    const pick = (arr, usePlain) => (arr || []).slice(0, 2).map(e => (usePlain ? (e.plainText || e.text) : (e.text || e.plainText)) || '');
    const ev = ann.evidence || [];
    const res = ann.reservations || [];
    return {
      posStd: pick(ev.filter(e => e.direction === 'positive'), true),
      negStd: pick(ev.filter(e => e.direction === 'negative'), true),
      resStd: pick(res.filter(r => r.direction === 'positive' || r.direction === 'negative'), true),
      posPro: pick(ev.filter(e => e.direction === 'positive'), false),
      negPro: pick(ev.filter(e => e.direction === 'negative'), false),
      resPro: pick(res.filter(r => r.direction === 'positive' || r.direction === 'negative'), false)
    };
  }

  function dirCode(dir) {
    if (dir === 'positive') return 'p';
    if (dir === 'negative') return 'n';
    if (dir === 'mixed') return 'm';
    if (dir === 'neutral') return 'u';
    return 'pending';
  }

  function getLuckCacheKey(data, luck, usefulView) {
    return JSON.stringify([
      chartFingerprint(data),
      (usefulView && usefulView.version) || '',
      luck.currentYear,
      luck.rows.map(r => r.gz)
    ]);
  }

  function computeOneDecadeStep(data, eng, row, dIdx, prevGz, startLevel) {
    const LAMBDA = 0.075, STEP_SCALE = 0.45, DECADE_SCALE = 1.25;
    let S = startLevel;
    const startYear = typeof root.luckStartYear === 'function' ? root.luckStartYear(data, row) : (data.time.used.year + row.from - 1);
    const fy = Array.from({ length: 10 }, (_, i) => {
      const y = startYear + i;
      const prevY = y - 1;
      const prevLuck = i === 0 ? prevGz : row.gz;
      return {
        year: y,
        gz: eng.getFlowYearGZ(y),
        previous: prevLuck ? { year: prevY, gz: eng.getFlowYearGZ(prevY), luckGz: prevLuck } : null
      };
    });
    const out = eng.evaluateLuckOutlook(data, row.gz, prevGz, fy);
    if (typeof root.tagOutlookPeriods === 'function') {
      root.tagOutlookPeriods(out, row.gz, fy);
    }
    const natalTone = out.natal && out.natal.tone ? out.natal.tone.score : 0;
    const decadeSeries = computeSeriesValues(out.natal, out.natal.direction, natalTone, 'neutral');
    const B = decadeSeries.yValue * DECADE_SCALE;
    const natalProLabel = out.natal.label || '持平';
    const natalStdLabel = typeof root.outlookPlainResult === 'function'
      ? root.outlookPlainResult(typeof root.outlookDisplayView === 'function' ? root.outlookDisplayView(out.natal) : out.natal)
      : natalProLabel;

    const dcMeta = {
      index: dIdx,
      gz: row.gz,
      startYear,
      endYear: startYear + 9,
      startAge: row.from,
      endAge: row.to,
      natalDir: out.natal.direction,
      natalProLbl: natalProLabel,
      natalStdLbl: natalStdLabel,
      toneScore: natalTone,
      decadeAttractor: round2(B)
    };

    const years = out.years.map((yObj, yIdx) => {
      const ann = yObj.annual;
      const tone = ann.tone ? ann.tone.score : 0;
      const incDir = yObj.increment ? yObj.increment.direction : 'neutral';
      const metrics = computeSeriesValues(ann, ann.direction, tone, incDir);
      const prevLevel = S;
      const rawDelta = round2(metrics.yValue * STEP_SCALE);
      const pull = LAMBDA * (B - S);
      const nextS = round2(S + rawDelta + pull);
      const netStep = round2(nextS - S);
      S = nextS;

      const lines = extractOutlookLines(ann);
      const annStdLabel = typeof root.outlookPlainResult === 'function'
        ? root.outlookPlainResult(typeof root.outlookDisplayView === 'function' ? root.outlookDisplayView(ann) : ann)
        : (DIR_STD_MAP[dirCode(ann.direction)] || '待定');

      return {
        y: yObj.year,
        a: yObj.year - data.time.used.year + 1,
        gz: yObj.gz,
        decadeIndex: dIdx,
        yearIndexInDecade: yIdx,
        decade: dcMeta,
        d: dirCode(ann.direction),
        rawDir: ann.direction,
        proLbl: ann.label || DIR_PRO_MAP[dirCode(ann.direction)] || '待判',
        stdLbl: annStdLabel,
        tl: ann.tone ? ann.tone.label : '平稳',
        t: tone,
        pv: yObj.previousYear ? dirCode(yObj.previousYear.direction) : '0',
        v: metrics.yValue,
        wu: metrics.wickUp,
        wd: metrics.wickDown,
        level: nextS,
        prevLevel,
        rawDelta,
        netStep,
        bandUp: round2(metrics.wickUp * 0.42),
        bandDown: round2(metrics.wickDown * 0.42),
        lines
      };
    });

    dcMeta.years = years;
    return { dcMeta, nextLevel: S };
  }

  function buildLuckModel(data) {
    const engRef = getEngineRef();
    const eng = engRef.eng;
    if (!data || !eng || !eng.evaluateLuckOutlook || typeof root.getLuckData !== 'function') return null;
    const luck = root.getLuckData(data);
    const usefulView = getUsefulSummary(data);
    const cacheKey = getLuckCacheKey(data, luck, usefulView);
    if (luckModelCache.key === cacheKey && luckModelCache.model) {
      return luckModelCache.model;
    }

    let S = 0;
    const decadesRaw = luck.rows.map((row, dIdx) => {
      const prevGz = dIdx > 0 ? luck.rows[dIdx - 1].gz : null;
      const stepRes = computeOneDecadeStep(data, eng, row, dIdx, prevGz, S);
      S = stepRes.nextLevel;
      return stepRes.dcMeta;
    });

    const model = {
      currentYear: luck.currentYear,
      decades: decadesRaw,
      allYears: decadesRaw.flatMap(d => d.years)
    };
    luckModelCache.key = cacheKey;
    luckModelCache.model = model;
    return model;
  }

  function renderLuckSectionAsync(container, data) {
    if (!container || !data) return Promise.resolve(null);
    const engRef = getEngineRef();
    const eng = engRef.eng;
    if (!eng || !eng.evaluateLuckOutlook || typeof root.getLuckData !== 'function') {
      return Promise.resolve(null);
    }
    const luck = root.getLuckData(data);
    if (!luck || !luck.rows || !luck.rows.length) {
      return Promise.resolve(null);
    }
    const usefulView = getUsefulSummary(data);
    const cacheKey = getLuckCacheKey(data, luck, usefulView);

    if (luckModelCache.key === cacheKey && luckModelCache.model) {
      luckJobToken++;
      if (isLuckViewActive()) {
        renderLuckSection(container, data);
      }
      return Promise.resolve(luckModelCache.model);
    }

    const token = ++luckJobToken;
    const total = luck.rows.length;
    container.innerHTML = `
      <div class="bzv-panel">
        <div class="bzv-block-title">
          <div class="bzv-block-title-main">
            <strong>大运流年起伏走势</strong>
            <span>主线承接上年起落 · 与上方大运流年选择双向联动</span>
          </div>
        </div>
        <div class="bzv-loading" role="status" aria-live="polite">
          <div class="bzv-loading-title">正在推算大运流年走势（0 / ${total} 步大运）…</div>
          <div class="bzv-progress-track"><div class="bzv-progress-fill" style="width:0%"></div></div>
          <div class="bzv-loading-meta">分步推演十年干支与承接水位，完成后自动展开互动图谱</div>
        </div>
      </div>
    `;

    const titleEl = typeof container.querySelector === 'function' ? container.querySelector('.bzv-loading-title') : null;
    const fillEl = typeof container.querySelector === 'function' ? container.querySelector('.bzv-progress-fill') : null;
    const scheduleTick = typeof root.setTimeout === 'function' ? root.setTimeout.bind(root) : setTimeout;

    return new Promise((resolve) => {
      let dIdx = 0;
      let S = 0;
      const decadesRaw = [];

      function tick() {
        if (token !== luckJobToken || container.isConnected === false) {
          resolve(null);
          return;
        }
        try {
          const row = luck.rows[dIdx];
          const prevGz = dIdx > 0 ? luck.rows[dIdx - 1].gz : null;
          const stepRes = computeOneDecadeStep(data, eng, row, dIdx, prevGz, S);
          S = stepRes.nextLevel;
          decadesRaw.push(stepRes.dcMeta);
          dIdx++;

          const pct = Math.round((dIdx / total) * 100);
          if (titleEl) titleEl.textContent = `正在推算大运流年走势（${dIdx} / ${total} 步大运）…`;
          if (fillEl && fillEl.style) fillEl.style.width = `${pct}%`;

          if (dIdx < total) {
            scheduleTick(tick, 0);
            return;
          }

          const model = {
            currentYear: luck.currentYear,
            decades: decadesRaw,
            allYears: decadesRaw.flatMap(d => d.years)
          };
          luckModelCache.key = cacheKey;
          luckModelCache.model = model;

          if (token === luckJobToken && container.isConnected !== false && isLuckViewActive()) {
            renderLuckSection(container, data);
          }
          resolve(model);
        } catch (err) {
          resolve(null);
        }
      }

      scheduleTick(tick, 0);
    });
  }

  function monotonePath(pts) {
    const n = pts.length;
    if (n === 0) return '';
    if (n === 1) return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    if (n === 2) return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)} L ${pts[1].x.toFixed(1)} ${pts[1].y.toFixed(1)}`;

    const d = new Array(n - 1);
    const m = new Array(n);
    for (let i = 0; i < n - 1; i++) {
      d[i] = (pts[i + 1].y - pts[i].y) / (pts[i + 1].x - pts[i].x || 1);
    }
    m[0] = d[0];
    m[n - 1] = d[n - 2];
    for (let i = 1; i < n - 1; i++) {
      if (d[i - 1] * d[i] <= 0) m[i] = 0;
      else m[i] = (d[i - 1] + d[i]) / 2;
    }
    for (let i = 0; i < n - 1; i++) {
      if (d[i] === 0) {
        m[i] = 0;
        m[i + 1] = 0;
      } else {
        const a = m[i] / d[i];
        const b = m[i + 1] / d[i];
        const h2 = a * a + b * b;
        if (h2 > 9) {
          const tau = 3 / Math.sqrt(h2);
          m[i] = tau * a * d[i];
          m[i + 1] = tau * b * d[i];
        }
      }
    }
    let path = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < n - 1; i++) {
      const dx = (pts[i + 1].x - pts[i].x) / 3;
      const c1x = pts[i].x + dx;
      const c1y = pts[i].y + m[i] * dx;
      const c2x = pts[i + 1].x - dx;
      const c2y = pts[i + 1].y - m[i + 1] * dx;
      path += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${pts[i + 1].x.toFixed(1)} ${pts[i + 1].y.toFixed(1)}`;
    }
    return path;
  }

  function notifySelectYear(yrObj) {
    if (!yrObj) return;
    uiState.selectedDecadeIndex = yrObj.decadeIndex;
    uiState.selectedYear = yrObj.y;
    if (typeof root.selectLuckYear === 'function') {
      root.selectLuckYear(yrObj.decadeIndex, yrObj.yearIndexInDecade);
    } else if (typeof root.selectLuckPart === 'function') {
      root.selectLuckPart('luck', yrObj.decadeIndex);
      root.selectLuckPart('year', yrObj.yearIndexInDecade);
    }
  }

  function bindLuckPointerEvents(mainSvg) {
    if (!mainSvg || mainSvg._bzvBound) return;
    mainSvg._bzvBound = true;
    let drag = null;

    function coordsFromEvent(e, ctx) {
      const rect = mainSvg.getBoundingClientRect();
      const width = rect.width || ctx.W;
      const height = rect.height || ctx.H;
      const svgX = ((e.clientX - rect.left) / width) * ctx.W;
      const svgY = ((e.clientY - rect.top) / height) * ctx.H;
      const clamped = clamp(svgX, ctx.M.left, ctx.M.left + ctx.plotW);
      const raw = ctx.n > 1 ? Math.round((clamped - ctx.M.left) / ctx.stepX) : 0;
      const idx = clamp(raw, 0, ctx.n - 1);
      return { svgX, svgY, idx, yr: ctx.flatYears[idx].y, yrObj: ctx.flatYears[idx] };
    }

    mainSvg.addEventListener('pointerdown', e => {
      const ctx = mainSvg._bzvCtx;
      if (!ctx) return;
      const handleEl = e.target && e.target.closest && e.target.closest('[data-handle]');
      if (handleEl && uiState.compare) {
        const which = handleEl.getAttribute('data-handle');
        const fixedYear = which === 'a' ? uiState.compare.b : uiState.compare.a;
        drag = { mode: 'handle', fixedYear, moved: true, anchorObj: ctx.flatYears[0], pointerId: e.pointerId };
        try { mainSvg.setPointerCapture(e.pointerId); } catch (_) {}
        e.preventDefault();
        return;
      }
      const pos = coordsFromEvent(e, ctx);
      if (pos.svgY >= ctx.M.top - 4 && pos.svgX >= ctx.M.left - 12 && pos.svgX <= ctx.M.left + ctx.plotW + 12) {
        if (e.pointerType === 'touch') {
          drag = { mode: 'touch-tap', startX: e.clientX, startY: e.clientY, anchorObj: pos.yrObj, moved: false };
          return;
        }
        drag = { mode: 'sweep', anchorYear: pos.yr, anchorObj: pos.yrObj, startX: e.clientX, moved: false, pointerId: e.pointerId };
        try { mainSvg.setPointerCapture(e.pointerId); } catch (_) {}
      }
    });

    mainSvg.addEventListener('pointermove', e => {
      const ctx = mainSvg._bzvCtx;
      if (!ctx) return;
      if (drag && drag.mode === 'touch-tap') {
        if (!drag.moved && Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > 8) {
          drag.moved = true;
        }
        return;
      }
      const pos = coordsFromEvent(e, ctx);
      if (drag) {
        if (drag.mode === 'handle') {
          const nextA = Math.min(pos.yr, drag.fixedYear);
          const nextB = Math.max(pos.yr, drag.fixedYear);
          if (!uiState.compare || uiState.compare.a !== nextA || uiState.compare.b !== nextB) {
            uiState.compare = { a: nextA, b: nextB };
            ctx.syncCompareUI();
          }
        } else {
          if (!drag.moved && (Math.abs(e.clientX - drag.startX) > 6 || pos.yr !== drag.anchorYear)) {
            drag.moved = true;
          }
          if (drag.moved) {
            const nextA = Math.min(drag.anchorYear, pos.yr);
            const nextB = Math.max(drag.anchorYear, pos.yr);
            if (!uiState.compare || uiState.compare.a !== nextA || uiState.compare.b !== nextB) {
              uiState.compare = { a: nextA, b: nextB };
              ctx.syncHoverUI(null);
              ctx.syncCompareUI();
            }
          }
        }
        return;
      }
      if (e.pointerType === 'touch') return;
      if (pos.svgY >= ctx.M.top - 4 && pos.svgX >= ctx.M.left - 12 && pos.svgX <= ctx.M.left + ctx.plotW + 12) {
        uiState.hoverYear = pos.yr;
        ctx.syncHoverUI(pos.idx);
      } else if (uiState.hoverYear !== null) {
        uiState.hoverYear = null;
        ctx.syncHoverUI(null);
      }
    });

    function endDrag() {
      if (!drag) return;
      const ctx = mainSvg._bzvCtx;
      if (drag.pointerId !== undefined) {
        try { mainSvg.releasePointerCapture(drag.pointerId); } catch (_) {}
      }
      const wasMoved = drag.moved;
      const anchorObj = drag.anchorObj;
      const dragMode = drag.mode;
      drag = null;
      if (!ctx) return;
      if (!wasMoved) {
        uiState.compare = null;
        uiState.hoverYear = null;
        notifySelectYear(anchorObj);
      } else if (dragMode === 'sweep' && uiState.compare && uiState.compare.a === uiState.compare.b) {
        uiState.compare = null;
        notifySelectYear(anchorObj);
      } else if (dragMode !== 'touch-tap') {
        ctx.rerender();
      }
    }

    mainSvg.addEventListener('pointerup', endDrag);
    mainSvg.addEventListener('pointercancel', () => {
      if (drag && drag.pointerId !== undefined) {
        try { mainSvg.releasePointerCapture(drag.pointerId); } catch (_) {}
      }
      drag = null;
    });
    mainSvg.addEventListener('pointerleave', () => {
      if (drag) return;
      const ctx = mainSvg._bzvCtx;
      if (ctx && uiState.hoverYear !== null) {
        uiState.hoverYear = null;
        ctx.syncHoverUI(null);
      }
    });
  }

  function renderLuckSection(container, data) {
    if (!container || !data) return;
    const model = buildLuckModel(data);
    if (!model || !model.decades.length) return;
    const technical = isTechnicalMode();
    const compactViewport = isCompactViewport();
    const P = PALETTE;

    const allFlat = model.allYears;
    if (uiState.selectedYear == null || !allFlat.some(y => y.y === uiState.selectedYear)) {
      const defDc = model.decades[uiState.selectedDecadeIndex] || model.decades[0];
      uiState.selectedYear = defDc && defDc.years[0] ? defDc.years[0].y : allFlat[0].y;
    }

    container.innerHTML = `
      <div class="bzv-panel">
        <div class="bzv-block-title">
          <div class="bzv-block-title-main">
            <strong>大运流年起伏走势</strong>
            <span>主线承接上年起落 · 与上方大运流年选择双向联动</span>
          </div>
        </div>
        <div class="bzv-toolbar">
          <div class="bzv-btn-group">
            <button type="button" class="bzv-btn" id="bzvZoomBackBtn">← 返回总览</button>
            <button type="button" class="bzv-btn" id="bzvZoomCurrentBtn">放大当前十年</button>
            <strong class="bzv-serif" id="bzvLuckScopeLabel" style="font-size:13.5px; color:${P.ink}"></strong>
            <span id="bzvLuckScopeHint" style="font-size:12px; color:${P.muted}"></span>
          </div>
          <div class="bzv-btn-group">
            <button type="button" class="bzv-btn" id="bzvWickBtn"></button>
            <button type="button" class="bzv-btn bzv-btn-primary" id="bzvCompareToggleBtn"></button>
          </div>
        </div>
        <div class="bzv-luck-body">
          <div class="bzv-luck-stage">
            <div class="bzv-luck-scroll" id="bzvLuckScroll">
              <div class="bzv-luck-track" id="bzvLuckTrack">
                <svg id="bzvLuckMainSvg" viewBox="0 0 920 342" class="bzv-svg bzv-luck-main-svg" role="img" aria-label="大运流年承接式起伏走势图"></svg>
                <div class="bzv-luck-delta-wrap">
                  <div class="bzv-delta-sticky-label">单年涨跌（绿升 · 红降 · 点平）</div>
                  <svg id="bzvLuckDeltaSvg" viewBox="0 0 920 ${compactViewport ? 62 : 76}" class="bzv-svg" role="img" aria-label="单年推升与回撤副图"></svg>
                </div>
              </div>
            </div>
            <div id="bzvLuckTooltip" class="bzv-tooltip bzv-hidden"></div>
            <div class="bzv-mobile-hint is-active" id="bzvLuckMobileHint">← 左右滑动看十年起伏 · 点大运标题可放大 →</div>
          </div>
          <div class="bzv-luck-footer">
            <span id="bzvLuckLegend"></span>
            <div class="bzv-stepper">
              <button type="button" class="bzv-btn" id="bzvPrevYearBtn">← 前一年</button>
              <span class="bzv-stepper-label" id="bzvStepperLabel"></span>
              <button type="button" class="bzv-btn" id="bzvNextYearBtn">后一年 →</button>
            </div>
          </div>
          <div id="bzvComparePanel" class="bzv-compare-panel bzv-hidden"></div>
        </div>
      </div>
    `;

    const rerender = () => renderLuckSection(container, data);
    if (uiState.luckZoomDecade !== null && (uiState.luckZoomDecade < 0 || uiState.luckZoomDecade >= model.decades.length)) {
      uiState.luckZoomDecade = null;
    }

    const visibleDecades = uiState.luckZoomDecade === null ? model.decades : [model.decades[uiState.luckZoomDecade]];
    const flatYears = [];
    visibleDecades.forEach(dc => { dc.years.forEach(yr => flatYears.push(yr)); });

    const trackEl = container.querySelector('#bzvLuckTrack');
    if (trackEl && trackEl.classList) {
      trackEl.classList.toggle('is-decade-zoom', uiState.luckZoomDecade !== null);
    }

    const zoomBackBtn = container.querySelector('#bzvZoomBackBtn');
    const zoomCurBtn = container.querySelector('#bzvZoomCurrentBtn');
    const scopeLabel = container.querySelector('#bzvLuckScopeLabel');
    const scopeHint = container.querySelector('#bzvLuckScopeHint');
    zoomBackBtn.hidden = uiState.luckZoomDecade === null;
    zoomBackBtn.onclick = () => {
      uiState.luckZoomDecade = null;
      rerender();
    };
    if (zoomCurBtn) {
      zoomCurBtn.hidden = uiState.luckZoomDecade !== null;
      zoomCurBtn.onclick = () => {
        const dcIdx = clamp(Number(uiState.selectedDecadeIndex) || 0, 0, model.decades.length - 1);
        uiState.luckZoomDecade = dcIdx;
        rerender();
      };
    }
    if (uiState.luckZoomDecade === null) {
      scopeLabel.textContent = `全盘总览（${model.decades.length}步大运）`;
      scopeHint.textContent = '点大运标题可放大十年 · 拖动图面可框选对比';
    } else {
      const zDc = model.decades[uiState.luckZoomDecade];
      const lbl = technical ? zDc.natalProLbl : zDc.natalStdLbl;
      scopeLabel.textContent = `${zDc.gz}大运（${lbl}）`;
      scopeHint.textContent = `${zDc.startYear}–${zDc.endYear} · ${zDc.startAge}–${zDc.endAge}岁`;
    }

    const wickBtn = container.querySelector('#bzvWickBtn');
    wickBtn.textContent = uiState.showWicks ? '包络：开' : '包络：关';
    wickBtn.onclick = () => {
      uiState.showWicks = !uiState.showWicks;
      rerender();
    };

    const compareBtn = container.querySelector('#bzvCompareToggleBtn');
    const isCmpOn = !!uiState.compare;
    compareBtn.textContent = isCmpOn ? '⇄ 退出对比' : '⇄ 跨年对比';
    compareBtn.classList.toggle('is-comparing', isCmpOn);
    compareBtn.onclick = () => {
      if (uiState.compare) {
        uiState.compare = null;
      } else {
        const minY = flatYears[0].y;
        const maxY = flatYears[flatYears.length - 1].y;
        const anchorY = uiState.selectedYear && uiState.selectedYear >= minY && uiState.selectedYear <= maxY
          ? uiState.selectedYear
          : model.currentYear;
        let defB = clamp(anchorY, minY + 1, maxY);
        let defA = clamp(defB - 8, minY, defB - 1);
        if (uiState.luckZoomDecade !== null) {
          defA = flatYears[Math.min(2, flatYears.length - 1)].y;
          defB = flatYears[Math.max(0, flatYears.length - 3)].y;
          if (defA >= defB && flatYears.length >= 2) {
            defA = flatYears[0].y;
            defB = flatYears[flatYears.length - 1].y;
          }
        }
        uiState.compare = { a: Math.min(defA, defB), b: Math.max(defA, defB) };
      }
      rerender();
    };

    const M = { left: 48, right: 66, top: 42, bottom: 34 };
    const W = 920, H = 342;
    const plotW = W - M.left - M.right;
    const plotH = H - M.top - M.bottom;
    const n = flatYears.length;
    const stepX = n > 1 ? plotW / (n - 1) : plotW;
    const xOf = idx => (n === 1 ? M.left + plotW / 2 : M.left + idx * stepX);

    const extVals = flatYears.flatMap(y => [y.level - y.bandDown * 0.6, y.level + y.bandUp * 0.6]);
    extVals.push(0);
    const rawMin = Math.min.apply(null, extVals);
    const rawMax = Math.max.apply(null, extVals);
    const rawSpan = Math.max(4, rawMax - rawMin);
    const pad = Math.max(0.9, rawSpan * 0.14);
    const yMin = rawMin - pad;
    const yMax = rawMax + pad;
    const yOf = val => M.top + ((yMax - val) / (yMax - yMin)) * plotH;
    const yZero = yOf(0);

    const mainSvg = container.querySelector('#bzvLuckMainSvg');
    bindLuckPointerEvents(mainSvg);

    const defs = svgEl('defs');
    const posGrad = svgEl('linearGradient', { id: 'bzvAreaPosGrad', x1: '0', y1: '0', x2: '0', y2: '1' });
    posGrad.appendChild(svgEl('stop', { offset: '0%', 'stop-color': P.pos, 'stop-opacity': '0.26' }));
    posGrad.appendChild(svgEl('stop', { offset: '100%', 'stop-color': P.pos, 'stop-opacity': '0.02' }));
    const negGrad = svgEl('linearGradient', { id: 'bzvAreaNegGrad', x1: '0', y1: '0', x2: '0', y2: '1' });
    negGrad.appendChild(svgEl('stop', { offset: '0%', 'stop-color': P.neg, 'stop-opacity': '0.02' }));
    negGrad.appendChild(svgEl('stop', { offset: '100%', 'stop-color': P.neg, 'stop-opacity': '0.26' }));
    const clipAbove = svgEl('clipPath', { id: 'bzvClipAboveZero' });
    clipAbove.appendChild(svgEl('rect', { x: M.left, y: M.top, width: plotW, height: Math.max(0, yZero - M.top) }));
    const clipBelow = svgEl('clipPath', { id: 'bzvClipBelowZero' });
    clipBelow.appendChild(svgEl('rect', { x: M.left, y: yZero, width: plotW, height: Math.max(0, M.top + plotH - yZero) }));
    defs.appendChild(posGrad);
    defs.appendChild(negGrad);
    defs.appendChild(clipAbove);
    defs.appendChild(clipBelow);
    mainSvg.appendChild(defs);

    const bandGroup = svgEl('g');
    let cursor = 0;
    visibleDecades.forEach((dc, dIdx) => {
      const len = dc.years.length;
      const xStart = cursor === 0 ? M.left : (xOf(cursor - 1) + xOf(cursor)) / 2;
      const xEnd = cursor + len >= n ? M.left + plotW : (xOf(cursor + len - 1) + xOf(cursor + len)) / 2;
      const bw = xEnd - xStart;

      const bandFill = dc.natalDir === 'positive'
        ? (dIdx % 2 === 0 ? 'rgba(37,111,84,0.055)' : 'rgba(37,111,84,0.028)')
        : (dc.natalDir === 'negative'
          ? (dIdx % 2 === 0 ? 'rgba(181,67,55,0.055)' : 'rgba(181,67,55,0.028)')
          : (dIdx % 2 === 0 ? 'rgba(156,114,47,0.05)' : 'rgba(156,114,47,0.025)'));

      bandGroup.appendChild(svgEl('rect', {
        x: xStart.toFixed(1), y: M.top, width: bw.toFixed(1), height: plotH, fill: bandFill
      }));
      if (cursor > 0) {
        bandGroup.appendChild(svgEl('line', {
          x1: xStart.toFixed(1), y1: M.top, x2: xStart.toFixed(1), y2: M.top + plotH,
          stroke: P.line, 'stroke-width': 1, opacity: 0.55
        }));
      }

      const cxBand = (xStart + xEnd) / 2;
      const statusDot = dc.natalDir === 'positive' ? P.pos : (dc.natalDir === 'negative' ? P.neg : P.mix);
      const dcLbl = technical ? dc.natalProLbl : dc.natalStdLbl;
      const hdr = svgEl('g', { style: uiState.luckZoomDecade === null ? 'cursor:pointer' : 'default' });
      hdr.appendChild(svgEl('title', {}, `${dc.gz}大运（${dcLbl}）\n${dc.startYear}–${dc.endYear} · ${dc.startAge}–${dc.endAge}岁\n点击放大该大运`));
      hdr.appendChild(svgEl('rect', {
        x: xStart.toFixed(1), y: 2, width: bw.toFixed(1), height: M.top - 4, fill: 'transparent'
      }));

      if (uiState.luckZoomDecade === null) {
        hdr.appendChild(svgEl('circle', {
          cx: (cxBand - 15).toFixed(1), cy: 14, r: 3.1, fill: statusDot
        }));
        hdr.appendChild(svgEl('text', {
          x: (cxBand + 5).toFixed(1), y: 18.5, 'text-anchor': 'middle', 'font-size': 12.5, 'font-weight': 700,
          fill: P.textDark, class: 'bzv-serif'
        }, dc.gz));
        hdr.appendChild(svgEl('text', {
          x: cxBand.toFixed(1), y: 33, 'text-anchor': 'middle', 'font-size': 10,
          fill: P.muted, class: 'bzv-tabular'
        }, `${dc.startAge}–${dc.endAge}岁`));
      } else {
        hdr.appendChild(svgEl('circle', {
          cx: (cxBand - 54).toFixed(1), cy: 14.5, r: 3.5, fill: statusDot
        }));
        hdr.appendChild(svgEl('text', {
          x: (cxBand + 6).toFixed(1), y: 19, 'text-anchor': 'middle', 'font-size': 13.5, 'font-weight': 700,
          fill: P.textDark, class: 'bzv-serif'
        }, `${dc.gz}大运（${dcLbl}）`));
        hdr.appendChild(svgEl('text', {
          x: cxBand.toFixed(1), y: 34, 'text-anchor': 'middle', 'font-size': 11,
          fill: P.muted, class: 'bzv-tabular'
        }, `${dc.startYear}–${dc.endYear} · ${dc.startAge}–${dc.endAge}岁`));
      }

      if (uiState.luckZoomDecade === null) {
        hdr.addEventListener('click', () => {
          uiState.luckZoomDecade = dc.index;
          if (uiState.compare && (uiState.compare.a < dc.startYear || uiState.compare.b > dc.endYear)) {
            uiState.compare = null;
          }
          if (uiState.selectedYear < dc.startYear || uiState.selectedYear > dc.endYear) {
            notifySelectYear(dc.years[0]);
          } else {
            rerender();
          }
        });
      }
      bandGroup.appendChild(hdr);
      cursor += len;
    });
    mainSvg.appendChild(bandGroup);

    const stepTick = rawSpan > 14 ? 4 : (rawSpan > 7 ? 2 : 1);
    const tickVals = [0];
    for (let t = stepTick; t <= yMax - 0.2; t += stepTick) tickVals.push(t);
    for (let t = -stepTick; t >= yMin + 0.2; t -= stepTick) tickVals.push(t);
    tickVals.sort((a, b) => b - a).forEach(val => {
      const y = yOf(val);
      const isZero = val === 0;
      mainSvg.appendChild(svgEl('line', {
        x1: M.left, y1: y.toFixed(1), x2: M.left + plotW, y2: y.toFixed(1),
        stroke: isZero ? P.textDark : P.line,
        'stroke-width': isZero ? 1.1 : 0.75,
        'stroke-dasharray': isZero ? '4 4' : 'none',
        opacity: isZero ? 0.42 : 0.55
      }));
      mainSvg.appendChild(svgEl('text', {
        x: M.left - 8, y: (y + 4).toFixed(1), 'text-anchor': 'end',
        'font-size': 11, fill: isZero ? P.textDark : P.muted, 'font-weight': isZero ? 600 : 400, class: 'bzv-tabular'
      }, val > 0 ? `+${val}` : `${val}`));
      if (isZero) {
        mainSvg.appendChild(svgEl('text', {
          x: M.left + plotW + 8, y: (y + 4).toFixed(1), 'text-anchor': 'start',
          'font-size': 11, fill: P.muted, 'font-weight': 500
        }, '起运基准'));
      }
    });

    const pts = flatYears.map((yr, idx) => ({ x: xOf(idx), y: yOf(yr.level), yr }));
    const lineD = monotonePath(pts);
    const areaD = `${lineD} L ${pts[pts.length - 1].x.toFixed(1)} ${yZero.toFixed(1)} L ${pts[0].x.toFixed(1)} ${yZero.toFixed(1)} Z`;

    mainSvg.appendChild(svgEl('path', { d: areaD, fill: 'url(#bzvAreaPosGrad)', 'clip-path': 'url(#bzvClipAboveZero)' }));
    mainSvg.appendChild(svgEl('path', { d: areaD, fill: 'url(#bzvAreaNegGrad)', 'clip-path': 'url(#bzvClipBelowZero)' }));

    if (uiState.showWicks && pts.length >= 2) {
      const upperPts = pts.map(p => ({ x: p.x, y: yOf(p.yr.level + p.yr.bandUp) }));
      const lowerPts = pts.map(p => ({ x: p.x, y: yOf(p.yr.level - p.yr.bandDown) }));
      const ribbonD = `${monotonePath(upperPts)} ${monotonePath(lowerPts.slice().reverse()).replace(/^M/, 'L')} Z`;
      mainSvg.appendChild(svgEl('path', {
        d: ribbonD, fill: P.gold, opacity: uiState.luckZoomDecade !== null ? 0.18 : 0.14, stroke: 'none'
      }));
    }

    mainSvg.appendChild(svgEl('path', {
      d: lineD, fill: 'none', stroke: P.textDark,
      'stroke-width': uiState.luckZoomDecade !== null ? 2.5 : 2.1,
      'stroke-linejoin': 'round', 'stroke-linecap': 'round'
    }));

    const nowY = model.currentYear;
    const idxNow = flatYears.findIndex(y => y.y === nowY);
    if (idxNow >= 0) {
      const xNow = xOf(idxNow);
      mainSvg.appendChild(svgEl('line', {
        x1: xNow.toFixed(1), y1: M.top, x2: xNow.toFixed(1), y2: M.top + plotH,
        stroke: P.gold, 'stroke-width': 1.1, 'stroke-dasharray': '3 3', opacity: 0.72
      }));
      const hideNowPill = uiState.compare && (Math.abs(uiState.compare.a - nowY) <= 4 || Math.abs(uiState.compare.b - nowY) <= 4);
      if (!hideNowPill) {
        mainSvg.appendChild(svgEl('rect', {
          x: (xNow - 21).toFixed(1), y: M.top + 3, width: 42, height: 16, rx: 8, fill: P.gold
        }));
        mainSvg.appendChild(svgEl('text', {
          x: xNow.toFixed(1), y: M.top + 14.5, 'text-anchor': 'middle',
          'font-size': 10, 'font-weight': 700, fill: '#fff'
        }, `${nowY} 今`));
      }
    }

    const dotsG = svgEl('g');
    pts.forEach((p, idx) => {
      const yr = p.yr;
      const isMixed = yr.d === 'm';
      const dotColor = yr.d === 'p' ? P.pos : (yr.d === 'n' ? P.neg : P.mix);

      if (uiState.luckZoomDecade !== null) {
        dotsG.appendChild(svgEl('circle', {
          cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: isMixed ? 4.8 : 4.2,
          fill: isMixed ? P.paper : dotColor, stroke: isMixed ? P.mix : P.paper, 'stroke-width': isMixed ? 2 : 1.2
        }));
        dotsG.appendChild(svgEl('text', {
          x: p.x.toFixed(1), y: M.top + plotH + 15, 'text-anchor': 'middle',
          'font-size': 11, 'font-weight': 600, fill: P.textDark, class: 'bzv-tabular'
        }, String(yr.y)));
        dotsG.appendChild(svgEl('text', {
          x: p.x.toFixed(1), y: M.top + plotH + 29, 'text-anchor': 'middle',
          'font-size': 11, fill: P.muted
        }, yr.gz));
      } else {
        const prevV = idx > 0 ? flatYears[idx - 1].level : yr.level;
        const nextV = idx < n - 1 ? flatYears[idx + 1].level : yr.level;
        const isTurn = (idx > 0 && idx < n - 1) &&
          ((yr.level > prevV && yr.level >= nextV) || (yr.level < prevV && yr.level <= nextV));
        if (isTurn || yr.y === nowY) {
          dotsG.appendChild(svgEl('circle', {
            cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: yr.y === nowY ? 4 : 2.7,
            fill: yr.y === nowY ? P.gold : (isMixed ? P.paper : dotColor),
            stroke: isMixed && yr.y !== nowY ? P.mix : P.paper,
            'stroke-width': isMixed ? 1.8 : 1.1
          }));
        }
        if (idx % 10 === 0 || idx === n - 1) {
          dotsG.appendChild(svgEl('text', {
            x: p.x.toFixed(1), y: M.top + plotH + 18, 'text-anchor': 'middle',
            'font-size': 11, fill: P.muted, class: 'bzv-tabular'
          }, String(yr.y)));
        }
      }
    });
    mainSvg.appendChild(dotsG);

    const activeIdx = Math.max(0, flatYears.findIndex(y => y.y === (uiState.hoverYear || uiState.selectedYear)));
    const actPt = pts[activeIdx] || pts[0];
    const crossLine = svgEl('line', {
      x1: actPt.x.toFixed(1), y1: M.top, x2: actPt.x.toFixed(1), y2: M.top + plotH,
      stroke: P.textDark, 'stroke-width': 1, 'stroke-dasharray': '4 3',
      opacity: uiState.compare ? 0 : 0.52
    });
    const focusRing = svgEl('circle', {
      cx: actPt.x.toFixed(1), cy: actPt.y.toFixed(1), r: 6.5,
      fill: 'none', stroke: P.gold, 'stroke-width': 2.2,
      opacity: uiState.compare ? 0 : 1
    });
    mainSvg.appendChild(crossLine);
    mainSvg.appendChild(focusRing);

    const deltaSvg = container.querySelector('#bzvLuckDeltaSvg');
    const dH = compactViewport ? 62 : 76;
    const dZero = compactViewport ? 34 : 46;
    const dTop = compactViewport ? 6 : 18;
    if (typeof deltaSvg.setAttribute === 'function') {
      deltaSvg.setAttribute('viewBox', `0 0 920 ${dH}`);
    }
    const maxStep = Math.max(1.2, Math.max.apply(null, flatYears.map(y => Math.abs(y.netStep))));
    if (!compactViewport) {
      deltaSvg.appendChild(svgEl('text', {
        x: M.left, y: 13, 'font-size': 11, 'font-weight': 600, fill: P.muted
      }, '单年涨跌（绿升 · 红降 · 点平）'));
    }
    const deltaCompareG = svgEl('g');
    deltaSvg.appendChild(deltaCompareG);
    deltaSvg.appendChild(svgEl('line', {
      x1: M.left, y1: dZero, x2: M.left + plotW, y2: dZero, stroke: P.line, 'stroke-width': 1
    }));
    const barW = clamp(stepX * 0.56, 3, 18);
    flatYears.forEach((yr, idx) => {
      const cxB = xOf(idx);
      const isAct = yr.y === (uiState.hoverYear || uiState.selectedYear);
      const mag = clamp((Math.abs(yr.netStep) / maxStep) * 22, 3, 22);
      if (yr.netStep > 0.08) {
        deltaSvg.appendChild(svgEl('rect', {
          x: (cxB - barW / 2).toFixed(1), y: (dZero - mag).toFixed(1), width: barW.toFixed(1), height: mag.toFixed(1), rx: 1.5,
          fill: P.pos, opacity: isAct ? 1 : 0.75
        }));
      } else if (yr.netStep < -0.08) {
        deltaSvg.appendChild(svgEl('rect', {
          x: (cxB - barW / 2).toFixed(1), y: dZero, width: barW.toFixed(1), height: mag.toFixed(1), rx: 1.5,
          fill: P.neg, opacity: isAct ? 1 : 0.75
        }));
      } else {
        deltaSvg.appendChild(svgEl('circle', {
          cx: cxB.toFixed(1), cy: dZero, r: 2.3, fill: P.mix, opacity: 0.85
        }));
      }
    });
    const deltaCross = svgEl('line', {
      x1: actPt.x.toFixed(1), y1: dTop, x2: actPt.x.toFixed(1), y2: dH - 4,
      stroke: P.textDark, 'stroke-width': 1, 'stroke-dasharray': '3 3',
      opacity: uiState.compare ? 0 : 0.5
    });
    deltaSvg.appendChild(deltaCross);

    const compareLayerG = svgEl('g');
    mainSvg.appendChild(compareLayerG);

    const tooltip = container.querySelector('#bzvLuckTooltip');
    function syncHoverUI(idx) {
      if (idx === null || idx === undefined) {
        tooltip.classList.add('bzv-hidden');
        const curIdx = Math.max(0, flatYears.findIndex(y => y.y === uiState.selectedYear));
        const pt = pts[curIdx] || pts[0];
        crossLine.setAttribute('x1', pt.x.toFixed(1));
        crossLine.setAttribute('x2', pt.x.toFixed(1));
        focusRing.setAttribute('cx', pt.x.toFixed(1));
        focusRing.setAttribute('cy', pt.y.toFixed(1));
        deltaCross.setAttribute('x1', pt.x.toFixed(1));
        deltaCross.setAttribute('x2', pt.x.toFixed(1));
        return;
      }
      const pt = pts[idx];
      if (!pt) return;
      const yr = pt.yr;
      crossLine.setAttribute('x1', pt.x.toFixed(1));
      crossLine.setAttribute('x2', pt.x.toFixed(1));
      crossLine.setAttribute('opacity', uiState.compare ? 0 : 0.52);
      focusRing.setAttribute('cx', pt.x.toFixed(1));
      focusRing.setAttribute('cy', pt.y.toFixed(1));
      focusRing.setAttribute('opacity', uiState.compare ? 0 : 1);
      deltaCross.setAttribute('x1', pt.x.toFixed(1));
      deltaCross.setAttribute('x2', pt.x.toFixed(1));

      const dirLbl = technical ? yr.proLbl : yr.stdLbl;
      const badgeCls = yr.d === 'p' ? 'bzv-dir-pos' : (yr.d === 'n' ? 'bzv-dir-neg' : 'bzv-dir-mix');
      const stepStr = `${yr.netStep >= 0 ? '+' : ''}${yr.netStep.toFixed(2)}`;
      const posL = technical ? yr.lines.posPro : yr.lines.posStd;
      const negL = technical ? yr.lines.negPro : yr.lines.negStd;

      tooltip.innerHTML = `
        <div class="bzv-tooltip-head">
          <span>${yr.y} ${esc(yr.gz)}（${yr.a}岁）</span>
          <span class="${badgeCls}">${esc(dirLbl)}</span>
        </div>
        <div class="bzv-tooltip-meta">水位 ${yr.level >= 0 ? '+' : ''}${yr.level.toFixed(2)}（本年 ${stepStr}）· ${esc(yr.decade.gz)}大运</div>
        ${posL[0] ? `<div class="bzv-tooltip-line bzv-dir-pos">+ ${esc(posL[0])}</div>` : ''}
        ${negL[0] ? `<div class="bzv-tooltip-line bzv-dir-neg">- ${esc(negL[0])}</div>` : ''}
      `;
      const box = mainSvg.getBoundingClientRect();
      const width = box.width || 800;
      const height = box.height || 300;
      const scrollEl = container.querySelector('#bzvLuckScroll');
      const stageEl = scrollEl && scrollEl.parentNode ? scrollEl.parentNode : null;
      const stageBox = stageEl && stageEl.getBoundingClientRect ? stageEl.getBoundingClientRect() : box;
      const stageW = stageBox.width || width;
      const scrollLeft = (scrollEl && scrollEl.scrollLeft) || 0;
      const visX = (pt.x / W) * width - scrollLeft;
      const relY = (pt.y / H) * height;
      const placeLeft = visX > stageW * 0.62;
      tooltip.style.left = placeLeft
        ? `${Math.max(8, visX - 238)}px`
        : `${Math.min(Math.max(8, stageW - 240), visX + 14)}px`;
      tooltip.style.top = `${clamp(relY - 34, 8, Math.max(12, height - 95))}px`;
      tooltip.classList.remove('bzv-hidden');
    }

    function renderCompareCard() {
      const panelEl = container.querySelector('#bzvComparePanel');
      if (!uiState.compare) {
        panelEl.classList.add('bzv-hidden');
        panelEl.innerHTML = '';
        return;
      }
      const yrA = allFlat.find(x => x.y === uiState.compare.a) || flatYears[0];
      const yrB = allFlat.find(x => x.y === uiState.compare.b) || flatYears[flatYears.length - 1];
      const diff = round2(yrB.level - yrA.level);
      const spanYears = yrB.y - yrA.y;
      const diffSign = diff >= 0 ? '+' : '';
      const diffTone = Math.abs(diff) < 0.35
        ? '与起点基本持平'
        : (diff > 0 ? '总体水位明显抬升' : '总体水位低于起点');
      const diffCls = Math.abs(diff) < 0.35 ? 'is-mix' : (diff > 0 ? 'is-pos' : 'is-neg');

      const subSlice = allFlat.filter(x => x.y >= yrA.y && x.y <= yrB.y);
      const peakYr = subSlice.reduce((best, cur) => (cur.level > best.level ? cur : best), subSlice[0]);
      const troughYr = subSlice.reduce((best, cur) => (cur.level < best.level ? cur : best), subSlice[0]);
      const optionsHtml = selectedVal => flatYears.map(y =>
        `<option value="${y.y}" ${y.y === selectedVal ? 'selected' : ''}>${y.y} ${y.gz}（${y.a}岁）</option>`
      ).join('');

      const renderCol = (tag, yr) => {
        const dirLbl = technical ? yr.proLbl : yr.stdLbl;
        const dcLbl = technical ? yr.decade.natalProLbl : yr.decade.natalStdLbl;
        const badgeCls = yr.d === 'p' ? 'bzv-dir-pos' : (yr.d === 'n' ? 'bzv-dir-neg' : 'bzv-dir-mix');
        const posArr = technical ? yr.lines.posPro : yr.lines.posStd;
        const negArr = technical ? yr.lines.negPro : yr.lines.negStd;
        const resArr = technical ? yr.lines.resPro : yr.lines.resStd;
        return `
          <div class="bzv-compare-col">
            <div class="bzv-compare-col-head">
              <div>
                <span class="bzv-compare-tag">${tag}</span>
                <strong class="bzv-serif bzv-tabular" style="margin-left:6px">${yr.y} ${esc(yr.gz)}（${yr.a}岁）</strong>
              </div>
              <span class="${badgeCls}" style="font-weight:700">${esc(dirLbl)} · ${esc(yr.tl)}</span>
            </div>
            <div class="bzv-compare-metrics">
              <span>累积水位 <strong>${yr.level >= 0 ? '+' : ''}${yr.level.toFixed(2)}</strong></span>
              <span>当年净变化 <strong>${yr.netStep >= 0 ? '+' : ''}${yr.netStep.toFixed(2)}</strong></span>
              <span>大运 ${esc(yr.decade.gz)}（${esc(dcLbl)}）</span>
            </div>
            <div class="bzv-compare-notes">
              ${posArr.map(x => `<p class="bzv-dir-pos">+ ${esc(x)}</p>`).join('')}
              ${negArr.map(x => `<p class="bzv-dir-neg">- ${esc(x)}</p>`).join('')}
              ${!posArr.length && !negArr.length && resArr.length ? `<p>• ${esc(resArr[0])}</p>` : ''}
            </div>
          </div>
        `;
      };

      panelEl.classList.remove('bzv-hidden');
      panelEl.innerHTML = `
        <div class="bzv-compare-head">
          <div class="bzv-compare-controls">
            <strong>跨年对比</strong>
            <label>起点 A <select id="bzvCmpSelectA">${optionsHtml(yrA.y)}</select></label>
            <span>→</span>
            <label>终点 B <select id="bzvCmpSelectB">${optionsHtml(yrB.y)}</select></label>
            <span class="bzv-compare-diff ${diffCls}">跨度 ${spanYears} 年 · ${diffTone}（${diffSign}${diff.toFixed(2)}）</span>
          </div>
          <div class="bzv-compare-extrema">
            区间峰值 <strong>${peakYr.y} ${esc(peakYr.gz)} (${peakYr.level >= 0 ? '+' : ''}${peakYr.level.toFixed(2)})</strong> ·
            谷底 <strong>${troughYr.y} ${esc(troughYr.gz)} (${troughYr.level >= 0 ? '+' : ''}${troughYr.level.toFixed(2)})</strong>
          </div>
        </div>
        <div class="bzv-compare-cols">${renderCol('A', yrA)}${renderCol('B', yrB)}</div>
      `;

      const selA = panelEl.querySelector('#bzvCmpSelectA');
      const selB = panelEl.querySelector('#bzvCmpSelectB');
      const syncFromSelect = () => {
        const va = Number(selA.value), vb = Number(selB.value);
        uiState.compare = { a: Math.min(va, vb), b: Math.max(va, vb) };
        rerender();
      };
      selA.onchange = syncFromSelect;
      selB.onchange = syncFromSelect;
    }

    function syncCompareUI() {
      compareLayerG.innerHTML = '';
      deltaCompareG.innerHTML = '';
      if (!uiState.compare) {
        renderCompareCard();
        return;
      }
      const idxA = flatYears.findIndex(y => y.y === uiState.compare.a);
      const idxB = flatYears.findIndex(y => y.y === uiState.compare.b);
      if (idxA < 0 || idxB < 0) {
        renderCompareCard();
        return;
      }
      const pA = pts[idxA];
      const pB = pts[idxB];
      const diff = round2(pB.yr.level - pA.yr.level);
      const cmpColor = Math.abs(diff) < 0.35 ? P.gold : (diff > 0 ? P.pos : P.neg);
      const xLeft = Math.min(pA.x, pB.x);
      const spanW = Math.max(2, Math.abs(pB.x - pA.x));

      compareLayerG.appendChild(svgEl('rect', {
        x: xLeft.toFixed(1), y: M.top, width: spanW.toFixed(1), height: plotH,
        fill: P.gold, opacity: 0.11, 'pointer-events': 'none'
      }));
      deltaCompareG.appendChild(svgEl('rect', {
        x: xLeft.toFixed(1), y: dTop, width: spanW.toFixed(1), height: Math.max(8, dH - dTop - 4),
        fill: P.gold, opacity: 0.14
      }));
      compareLayerG.appendChild(svgEl('line', {
        x1: pA.x.toFixed(1), y1: pA.y.toFixed(1),
        x2: pB.x.toFixed(1), y2: pB.y.toFixed(1),
        stroke: cmpColor, 'stroke-width': 2, 'stroke-dasharray': '5 4', 'pointer-events': 'none'
      }));

      [
        { pt: pA, tag: 'A', which: 'a' },
        { pt: pB, tag: 'B', which: 'b' }
      ].forEach(({ pt, tag, which }) => {
        compareLayerG.appendChild(svgEl('line', {
          x1: pt.x.toFixed(1), y1: M.top, x2: pt.x.toFixed(1), y2: M.top + plotH,
          stroke: P.textDark, 'stroke-width': 1.4, opacity: 0.65, 'pointer-events': 'none'
        }));
        deltaCompareG.appendChild(svgEl('line', {
          x1: pt.x.toFixed(1), y1: dTop, x2: pt.x.toFixed(1), y2: dH - 4,
          stroke: P.textDark, 'stroke-width': 1.3, opacity: 0.6
        }));
        compareLayerG.appendChild(svgEl('circle', {
          cx: pt.x.toFixed(1), cy: pt.y.toFixed(1), r: 6.5,
          fill: P.paper, stroke: cmpColor, 'stroke-width': 2.5, 'pointer-events': 'none'
        }));

        const close = Math.abs(pB.x - pA.x) < 88;
        const hy = (which === 'b' && close) ? M.top + 26 : M.top + 4;
        const label = `◂ ${tag} ${pt.yr.y} ▸`;
        const hw = 78;
        const hx = clamp(pt.x - hw / 2, M.left, M.left + plotW - hw);
        const hg = svgEl('g', {
          'data-handle': which,
          style: 'cursor:ew-resize; touch-action:none'
        });
        hg.appendChild(svgEl('rect', {
          x: hx.toFixed(1), y: hy, width: hw, height: 21, rx: 10.5,
          fill: P.textDark, stroke: P.paper, 'stroke-width': 1.4
        }));
        hg.appendChild(svgEl('text', {
          x: (hx + hw / 2).toFixed(1), y: hy + 14.2,
          'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700,
          fill: P.paper, class: 'bzv-tabular'
        }, label));
        compareLayerG.appendChild(hg);
      });

      const mx = (pA.x + pB.x) / 2;
      const my = (pA.y + pB.y) / 2;
      const arrow = Math.abs(diff) < 0.05 ? '→' : (diff > 0 ? '↑' : '↓');
      const callout = `${pA.yr.y}→${pB.yr.y}：${diff >= 0 ? '+' : ''}${diff.toFixed(2)} ${arrow}`;
      const cw = callout.length * 7.6 + 18;
      const cxBox = clamp(mx, M.left + cw / 2 + 4, M.left + plotW - cw / 2 - 4);
      const cyBox = clamp(my - 16, M.top + 40, M.top + plotH - 18);
      compareLayerG.appendChild(svgEl('rect', {
        x: (cxBox - cw / 2).toFixed(1), y: (cyBox - 12).toFixed(1),
        width: cw, height: 24, rx: 12,
        fill: P.paper, stroke: cmpColor, 'stroke-width': 1.6, 'pointer-events': 'none'
      }));
      compareLayerG.appendChild(svgEl('text', {
        x: cxBox.toFixed(1), y: (cyBox + 4).toFixed(1),
        'text-anchor': 'middle', 'font-size': 11.5, 'font-weight': 700,
        fill: cmpColor, class: 'bzv-tabular', 'pointer-events': 'none'
      }, callout));

      renderCompareCard();
    }

    mainSvg._bzvCtx = { M, W, H, plotW, plotH, n, stepX, flatYears, pts, syncHoverUI, syncCompareUI, rerender };

    container.querySelector('#bzvLuckLegend').textContent = '主线 = 累积走势 · 金带 = 波动包络 · 点选年份联动上方，或点「⇄ 跨年对比」拖动 A/B 游标';

    const selYearObj = flatYears.find(y => y.y === uiState.selectedYear) || flatYears[0];
    uiState.selectedYear = selYearObj.y;
    const globalIdx = allFlat.findIndex(y => y.y === selYearObj.y);

    const yrHead = `${selYearObj.y} ${selYearObj.gz} · ${selYearObj.a}岁`;
    const yrChg = `较前年${PREV_MAP[selYearObj.pv] || '待核'}`;
    container.querySelector('#bzvStepperLabel').innerHTML =
      `<span class="bzv-stepper-yr">${esc(yrHead)}</span><span class="bzv-stepper-sep"> · </span><span class="bzv-stepper-chg">${esc(yrChg)}</span>`;
    const prevBtn = container.querySelector('#bzvPrevYearBtn');
    const nextBtn = container.querySelector('#bzvNextYearBtn');
    prevBtn.disabled = globalIdx <= 0;
    nextBtn.disabled = globalIdx >= allFlat.length - 1;
    prevBtn.onclick = () => {
      if (globalIdx > 0) {
        uiState.compare = null;
        const target = allFlat[globalIdx - 1];
        if (uiState.luckZoomDecade !== null) uiState.luckZoomDecade = target.decadeIndex;
        notifySelectYear(target);
      }
    };
    nextBtn.onclick = () => {
      if (globalIdx < allFlat.length - 1) {
        uiState.compare = null;
        const target = allFlat[globalIdx + 1];
        if (uiState.luckZoomDecade !== null) uiState.luckZoomDecade = target.decadeIndex;
        notifySelectYear(target);
      }
    };

    syncCompareUI();

    const luckScrollEl = container.querySelector('#bzvLuckScroll');
    if (isCompactViewport() && luckScrollEl && actPt) {
      const centerLuckScroll = () => {
        if (luckScrollEl.scrollWidth > luckScrollEl.clientWidth) {
          const targetX = (actPt.x / W) * luckScrollEl.scrollWidth - luckScrollEl.clientWidth * 0.48;
          luckScrollEl.scrollLeft = clamp(Math.round(targetX), 0, luckScrollEl.scrollWidth - luckScrollEl.clientWidth);
        }
      };
      centerLuckScroll();
      if (typeof root.requestAnimationFrame === 'function') {
        root.requestAnimationFrame(centerLuckScroll);
      }
    }
  }

  function isLuckViewActive() {
    const doc = root.document;
    if (!doc) return false;
    const panel = doc.querySelector && doc.querySelector('[data-view-panel="luck"]');
    return !panel || panel.classList.contains('active');
  }

  function handleBaziView(detail) {
    const doc = root.document;
    if (!doc || !doc.getElementById) return;
    const snapshot = (detail && detail.snapshot) || lastSnapshot || root.currentBazi;
    lastSnapshot = snapshot || null;

    if (!snapshot || !snapshot.pillars || (detail && detail.reason === 'reset')) {
      luckJobToken++;
      uiState.chartKey = '';
      return;
    }

    const nextKey = chartFingerprint(snapshot);
    if (nextKey !== uiState.chartKey) {
      luckJobToken++;
      uiState.chartKey = nextKey;
      uiState.selectedNodeId = null;
      uiState.selectedSectorKey = null;
      uiState.selectedEdgeId = null;
      uiState.relZoomed = false;
      uiState.luckZoomDecade = null;
      uiState.hoverYear = null;
      uiState.compare = null;
    }

    const lc = (detail && detail.luckContext) || lastLuckContext;
    if (lc && lc.flowYear) {
      lastLuckContext = lc;
      const prevDecade = uiState.selectedDecadeIndex;
      uiState.selectedDecadeIndex = lc.luckIndex;
      uiState.selectedYear = lc.flowYear.year;
      if (uiState.luckZoomDecade !== null && lc.luckIndex !== prevDecade) {
        uiState.luckZoomDecade = lc.luckIndex;
      }
    }

    const relContainer = doc.getElementById('baziRelationVisual');
    if (relContainer) {
      renderRelationSection(relContainer, snapshot);
    }

    const luckContainer = doc.getElementById('baziLuckVisual');
    if (luckContainer && isLuckViewActive()) {
      renderLuckSectionAsync(luckContainer, snapshot);
    }
  }

  function mount() {
    if (mounted) return;
    mounted = true;
    const doc = root.document;
    let lastCompact = isCompactViewport();
    let resizeTimer = null;
    if (root && typeof root.addEventListener === 'function') {
      root.addEventListener('bazi:view', event => handleBaziView(event && event.detail));
      root.addEventListener('resize', () => {
        if (resizeTimer && typeof root.clearTimeout === 'function') root.clearTimeout(resizeTimer);
        const schedule = typeof root.setTimeout === 'function' ? root.setTimeout.bind(root) : setTimeout;
        resizeTimer = schedule(() => {
          const nextCompact = isCompactViewport();
          if (nextCompact !== lastCompact) {
            lastCompact = nextCompact;
            if (lastSnapshot) handleBaziView({ snapshot: lastSnapshot, reason: 'resize' });
          }
        }, 160);
      });
    }
    if (doc && doc.getElementById && root.currentBazi) {
      handleBaziView({ snapshot: root.currentBazi, reason: 'mount' });
    }
  }

  return {
    mount,
    handleBaziView,
    buildRelationModel,
    buildLuckModel,
    computeWeightedSectorShares,
    computeSectorVisualGeometry,
    computeStarWheelViewBox,
    resolveOutputAction,
    STEM_IMAGERY,
    renderDayMasterInkMotif,
    buildDisplayFlowEdges,
    computeMatrixPositions,
    buildPositionFlowEdges,
    computeCumulativeSeries: (luckModel) => luckModel,
    renderRelationSection,
    renderLuckSection,
    renderLuckSectionAsync,
    _state: uiState
  };
});
