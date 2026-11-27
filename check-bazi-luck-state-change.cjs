// Run from any directory: node check-bazi-luck-state-change.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = __dirname;

function load() {
  const node = () => ({ value: '', checked: false, disabled: false, textContent: '', innerHTML: '', hidden: false,
    classList: { toggle() {}, add() {}, remove() {} }, style: {}, focus() {} });
  const c = { BirthTime: require('./birth-time.js'), console, Date, Math, JSON, prompt: () => '', confirm: () => true,
    localStorage: { getItem: () => null, setItem() {} },
    document: { addEventListener() {}, querySelector: () => ({ value: '男' }), querySelectorAll: () => [], getElementById: node } };
  vm.createContext(c);
  for (const f of ['qimen.js', 'china-locations.js', 'bazi-shensha.js', 'bazi-engine.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), c, { filename: f });
  }
  const html = fs.readFileSync(path.join(root, 'bazi.html'), 'utf8');
  for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) vm.runInContext(m[1], c);
  const doc = c.document;
  delete c.document; // Data checks must not mount UI or touch a real browser's storage.
  vm.runInContext(fs.readFileSync(path.join(root, 'bazi-visuals.js'), 'utf8'), c, { filename: 'bazi-visuals.js' });
  c.document = doc;
  assert(c.BaziEngine, 'load the real globalThis.BaziEngine export');
  return c;
}

const close = (a, b, message) => assert(Math.abs(a - b) < 1e-10, message || (a + ' != ' + b));
function row(side, weight, ruleId = 'Y5-role-root', causeKey = 'persistent-root') {
  return { side, ruleId, causeKey, contribution: weight, status: 'confirmed', exclusion: null, before: [], after: ['usable-root'] };
}
function result(direction, rows = [], extra = {}) {
  const sum = side => rows.filter(x => x.side === side).reduce((n, x) => n + x.contribution, 0);
  return { direction, label: direction, evidence: [], reservations: [], uncertainty: [],
    amplitude: { available: direction !== 'pending' && direction !== 'unavailable', positive: sum('positive'), negative: sum('negative'),
      breakdown: rows, missingFields: [], hasPending: false, strongTrigger: { positive: false, negative: false } }, ...extra };
}

function mockChart(c) {
  const elements = new Map();
  const wrappers = new Map();
  function node(tag) {
    const children = [], listeners = {}, classes = new Set();
    let html = '';
    return {
      tag, attrs: {}, children, style: {}, textContent: '',
      get innerHTML() { return html; },
      set innerHTML(value) {
        html = value;
        children.length = 0;
        for (const match of value.matchAll(/<button[^>]* id="([^"]+)"/g)) {
          const button = node('button');
          button.attrs.id = match[1];
          children.push(button);
        }
        for (const match of value.matchAll(/<select id="([^"]+)">[\s\S]*?<option value="(\d+)" selected>/g)) {
          const select = node('select');
          select.attrs.id = match[1];
          select.value = match[2];
          children.push(select);
        }
      },
      classList: {
        toggle(name, force) { if (force ?? !classes.has(name)) classes.add(name); else classes.delete(name); },
        add(name) { classes.add(name); },
        remove(name) { classes.delete(name); },
        contains(name) { return classes.has(name); }
      },
      setAttribute(key, value) { this.attrs[key] = value; },
      getAttribute(key) { return this.attrs[key]; },
      appendChild(child) { children.push(child); child.parentElement = this; },
      contains(target) { return target === this || children.some(child => child.contains(target)); },
      addEventListener(type, fn) { listeners[type] = fn; },
      dispatch(type, event) { if (listeners[type]) listeners[type](event); },
      focus() {},
      querySelector(key) { return children.find(child => '#' + child.attrs.id === key); },
      getBoundingClientRect() {
        const [, , width = 920, height = 342] = (this.attrs.viewBox || '').split(' ').map(Number);
        return { left: 0, top: 0, width, height };
      }
    };
  }
  c.document.createElementNS = (ns, tag) => node(tag);
  let markup = '';
  return {
    get innerHTML() { return markup; },
    set innerHTML(value) { markup = value; elements.clear(); wrappers.clear(); },
    querySelector(key) {
      if (!markup.includes(`id="${key.slice(1)}"`)) return null;
      if (!elements.has(key)) {
        const element = node(key);
        elements.set(key, element);
        const group = key.match(/^#bzv(Wick|FadeIn)(?:HelpBtn|Btn|Popover)$/)?.[1];
        if (group) {
          if (!wrappers.has(group)) wrappers.set(group, node('div'));
          wrappers.get(group).appendChild(element);
        }
      }
      return elements.get(key);
    }
  };
}

async function run() {
  const c = load(), visuals = c.BaziVisuals, level = visuals.computeAnnualLevel;
  const neutral = result('neutral'), pending = result('pending');
  const good = result('positive', [row('positive', 1)]), bad = result('negative', [row('negative', 1)]);
  const F = x => x / (1 + 0.12 * x);
  close(level(good).level, 0.55 * F(1));
  close(level(bad).level, -0.55 * F(1));
  assert.equal(level(neutral).level, 0);

  for (const direction of ['positive','mixed','negative']) {
    for (const [P, N] of [[1, 1], [1, 2], [2, 1], [0.35, 1.8]]) {
      const annual = result(direction, [row('positive', P), row('negative', N)]);
      const m = level(annual);
      assert(m.available);
      assert.equal(annual.direction, direction, 'C2 net force never changes the verdict');
      if(P === N) assert.equal(m.level, 0, 'C2 equal forces cancel for every directional verdict');
      const fp = F(P), fn = F(N);
      close(m.level, 0.55 * (fp - fn) / (1 + 0.35 * Math.min(fp, fn)));
      close(m.bandUp, 0.45 * fp);
      close(m.bandDown, 0.45 * fn);
    }
  }
  for (const missing of [pending, result('unavailable'), { direction: 'positive' },
    result('neutral', [row('positive', 1)])]) {
    const m = level(missing);
    assert(!m.available);
    assert.equal(m.level, null);
  }
  for (const value of [NaN, Infinity, -1]) {
    const invalid = result('positive', [row('positive', 1)]);
    invalid.amplitude.positive = value;
    assert(!level(invalid).available);
  }
  const pendingNeutral = result('neutral');
  pendingNeutral.amplitude.hasPending = true;
  assert(!level(pendingNeutral).available);

  const chart = (context, year, month, day, hour, minute = 0, opts = {}) => context.BaziEngine.createBaziProfile({
    input: { year, month, day, hour, minute }, gender: '男', useTrueSolar: false, ...opts
  });
  const fake = load(), data = chart(fake, 1960, 1, 1, 0);
  const rowFor = index => ({ index, gz: index ? '乙丑' : '甲子', from: index * 10 + 1, to: index * 10 + 10 });
  let numberOfDecades = 10, evaluated = 0;
  const bigger = result('positive', [row('positive', 2)]);
  const strongBad = result('negative', [row('negative', 8)]);
  const canceled = result('mixed', [row('positive', 1), row('negative', 1)]);
  const fixtureYears = [
    [pending, pending], [good, good], [bigger, bigger], [pending, pending], [pending, pending],
    [good, bad], [canceled, good], [strongBad, strongBad], [pending, pending], [bad, bad],
    [good, good], [pending, neutral], [neutral, pending], [neutral, neutral]
  ];
  fake.getLuckData = () => ({ rows: Array.from({ length: numberOfDecades }, (_, i) => rowFor(i)), currentYear: 2011 });
  fake.luckStartYear = (d, r) => 2000 + r.index * 10;
  fake.BaziEngine.evaluateLuckOutlook = (d, gz, prev, years) => {
    evaluated++;
    return {
      natal: neutral,
      years: years.map(y => {
        const [annual, wealth] = fixtureYears[y.year - 2000] || [neutral, pending];
        return { year: y.year, gz: y.gz, annual, wealth,
          previousYear: { direction: 'pending', get amplitude() { throw Error('previous event amplitude must not be read'); } } };
      })
    };
  };
  const model = fake.BaziVisuals.buildLuckModel(data);
  const byYear = year => model.allYears[year - 2000];
  assert.equal(model.allYears.length, 100);
  for (let i = 0; i < model.allYears.length; i++) {
    const yr = model.allYears[i], prev = model.allYears[i - 1];
    const [annual, wealth] = fixtureYears[i] || [neutral, pending];
    assert.equal(yr.annualImpulse, level(annual).level, 'the column and main use the full unrounded engine impulse');
    assert.equal(yr.wealthImpulse, level(wealth).level);
    assert.equal(yr.prevPlotLevel, prev?.plotLevel ?? 0);
    assert.equal(yr.prevWealthPlotLevel, prev?.wealthPlotLevel ?? 0);
    if (yr.available) {
      close(yr.plotLevel - yr.prevPlotLevel, yr.annualImpulse);
      assert.equal(yr.level, yr.plotLevel);
    } else {
      assert.equal(yr.level, null);
      assert.equal(yr.plotLevel, yr.prevPlotLevel);
    }
    assert.equal(yr.wealthLevel, yr.wealthImpulse);
    assert.equal(yr.wealthPlotLevel, yr.wealthAvailable ? yr.wealthImpulse : yr.prevWealthPlotLevel);
    assert.equal(yr.cumulativeHasPriorPending, i > 0);
  }
  assert.equal(byYear(2000).plotLevel, 0);
  assert.equal(byYear(2000).wealthPlotLevel, 0);
  assert(byYear(2002).annualImpulse > byYear(2001).annualImpulse);
  assert(byYear(2003).plotLevel > 0 && byYear(2008).plotLevel < 0);
  assert(byYear(2003).wealthPlotLevel > 0 && byYear(2008).wealthPlotLevel < 0);
  assert.equal(byYear(2010).prevPlotLevel, byYear(2009).plotLevel);
  assert.equal(byYear(2010).prevWealthPlotLevel, byYear(2009).wealthPlotLevel);
  assert.equal(byYear(2011).wealthAvailable, true, 'wealth can be known while the combined chart is pending');
  assert.equal(byYear(2012).available, true, 'the combined chart can be known while wealth is pending');

  const container = mockChart(fake), state = fake.BaziVisuals._state;
  const render = () => fake.BaziVisuals.renderLuckSection(container, data);
  const main = () => container.querySelector('#bzvLuckMainSvg');
  const delta = () => container.querySelector('#bzvLuckDeltaSvg');
  const wealthBtn = () => container.querySelector('#bzvWealthOverlayBtn');
  const wealthSvg = () => container.querySelector('#bzvLuckWealthSvg');
  const find = (svg, attribute, value) => svg.children.find(n => n.attrs[attribute] === String(value));
  const segment = (svg, year) => find(svg, 'data-year-segment', year)?.attrs;
  const descendants = node => node.children.flatMap(child => [child, ...descendants(child)]);
  function pendingAt(svg, year, expectedPoint) {
    const step = segment(svg, year), marker = find(svg, 'data-pending-year', year);
    assert(step && step['stroke-dasharray'] === '3 2.5' && step['stroke-opacity'] === '0.45' && step.y1 === step.y2,
      'pending has its own uniform dash and a horizontal hold in either display mode');
    assert(marker?.tag === 'circle' && marker.attrs.fill === '#faf5ea' && marker.attrs.stroke === step.stroke);
    assert.equal(Number(marker.attrs.r), Math.max(1.8, Math.min(svg._bzvCtx.stepX * 0.22, 3)));
    assert.equal(marker.attrs['stroke-opacity'], '0.58');
    assert.equal(marker.attrs['stroke-width'], '1.3');
    assert.match(marker.children.find(child => child.tag === 'title').textContent, /待判/);
    assert.equal(Number(marker.attrs.cy), expectedPoint.y);
  }
  function verifyAlignedCharts() {
    const { pts } = main()._bzvCtx;
    pts.forEach(p => {
      const column = find(delta(), p.yr.available ? 'data-year-bar' : 'data-pending-year', p.yr.y);
      const colX = column.attrs.cx ?? column.attrs.x;
      close(Number(colX) + Number(column.attrs.width ?? 0) / 2, p.x, 'columns align with single main plot');
    });
  }
  function verifyMainOnly() {
    const { pts } = main()._bzvCtx;
    pts.forEach(p => {
      if (!p.yr.available) {
        pendingAt(main(), p.yr.y, p);
        assert.equal(find(delta(), 'data-pending-year', p.yr.y)?.textContent, '×');
        assert.equal(find(delta(), 'data-year-bar', p.yr.y), undefined);
      } else {
        const i = p.yr.yearIndexInDecade, fades = state.firstDecadeFadeIn && p.yr.decadeIndex === 0;
        const stroke = segment(main(), p.yr.y);
        assert.equal(stroke['stroke-dasharray'], fades ? ['3 5', '5 4', '7 3', '10 2', 'none'][Math.floor(i / 2)] : 'none');
        assert.equal(Number(stroke['stroke-opacity']), fades ? Number((0.30 + 0.70 * i / 9).toFixed(2)) : 1);
        assert.equal(Number(find(delta(), 'data-year-bar', p.yr.y).attrs['data-annual-impulse']), p.yr.displayImpulse);
        if (p.yr.displayImpulse === 0) assert.equal(Number(stroke.y2), Number(stroke.y1));
      }
    });
    const svg = main();
    assert(!descendants(svg).some(node => 'data-pending-label' in node.attrs), 'no pending labels on the main curve');
    assert(!descendants(svg).some(node => /^[+-]?\d(?:\.\d+)?$/.test(node.textContent)), 'no vertical tick numbers');
    assert(descendants(svg).filter(node => node.tag === 'circle' && node.attrs.cy && Number(node.attrs.cy) >= svg._bzvCtx.M.top)
      .every(node => 'data-pending-year' in node.attrs || 'data-focus-ring' in node.attrs), 'no colored curve dots');
  }
  function verifyContinuousEnvelope() {
    const { pts } = main()._bzvCtx;
    const bands = descendants(main()).filter(node => node.attrs['data-amplitude-band'] === 'true');
    assert.equal(bands.length, 1);
    assert.equal(bands[0].tag, 'path');
    const { d } = bands[0].attrs;
    assert.equal((d.match(/M/g) || []).length, 1, 'envelope has one subpath');
    assert.match(d, / Z$/);
    const knots = Array.from(d.matchAll(/[MCL]([^MCLZ]+)/g), ([, coords]) => coords.trim().split(/[\s,]+/).slice(-2).map(Number));
    assert.equal(knots.length, 2 * pts.length);
    const pixelsPerLevel = (pts[1].y - pts[2].y) / (pts[2].yr.displayPlotLevel - pts[1].yr.displayPlotLevel);
    pts.forEach((pt, i) => {
      const upper = knots[i], lower = knots[knots.length - 1 - i];
      assert.equal(upper[0], Number(pt.x.toFixed(1)));
      assert.equal(lower[0], upper[0]);
      const before = pts.slice(0, i).findLast(p => p.yr.available);
      const after = pts.slice(i + 1).find(p => p.yr.available);
      for (const [field, edge, sign] of [['displayBandUp', upper, -1], ['displayBandDown', lower, 1]]) {
        let band = pt.yr[field];
        if (!pt.yr.available) {
          if (before && after) {
            const t = (pt.yr.y - before.yr.y) / (after.yr.y - before.yr.y);
            band = (1 - t) * before.yr[field] + t * after.yr[field];
          } else {
            band = 0.55 * ((before || after)?.yr[field] ?? 0);
          }
        }
        assert(Math.abs(edge[1] - (pt.y + sign * pixelsPerLevel * band)) <= 0.051, `envelope ${field} at ${pt.yr.y}`);
      }
    });
  }

  const timers = new Map(), docListeners = { click: new Set(), keydown: new Set() };
  let clock = 0, timerId = 0;
  fake.setTimeout = (fn, delay) => { timers.set(++timerId, { fn, at: clock + delay }); return timerId; };
  fake.clearTimeout = id => timers.delete(id);
  fake.document.addEventListener = (type, fn) => docListeners[type].add(fn);
  fake.document.removeEventListener = (type, fn) => docListeners[type].delete(fn);
  const dispatchDoc = (type, event) => docListeners[type].forEach(fn => fn(event));
  function advance(ms) {
    clock += ms;
    for (const [id, { fn, at }] of timers) {
      if (at > clock) continue;
      timers.delete(id);
      fn();
    }
  }
  render();
  assert.equal(wealthBtn(), null, 'standalone wealth toggle button removed');
  assert.equal(wealthSvg(), null, 'standalone wealth SVG chart removed');
  assert.match(container.innerHTML, /id="bzvLuckTrack"[\s\S]*id="bzvLuckMainSvg"[\s\S]*id="bzvLuckDeltaSvg"/);
  assert.doesNotMatch(container.innerHTML, /id="bzvWealthDetail"[^>]*bzv-hidden/);
  assert(!find(main(), 'data-wealth-overlay', true));
  const el = id => container.querySelector('#' + id);
  const toolbar = container.innerHTML.match(/<div class="bzv-toolbar">[\s\S]*?(?=<div class="bzv-luck-body")/)[0];
  assert.deepEqual([...toolbar.matchAll(/id="([^"]+)"/g)].map(m=>m[1]),
    ['bzvZoomBackBtn','bzvLuckScopeLabel','bzvLuckScopeHint','bzvWickBtn','bzvWickHelpBtn','bzvWickPopover','bzvFadeInBtn','bzvFadeInHelpBtn','bzvFadeInPopover']);
  assert.equal(el('bzvZoomCurrentBtn'), null);
  assert.equal(el('bzvCompareToggleBtn'), null);
  assert(el('bzvZoomBackBtn').hidden);
  assert.equal(el('bzvFadeInInfoBtn'), null);
  assert.equal(el('bzvFadeInExplain'), null);
  assert.equal(el('bzvFadeInBtn').textContent, '起步体感淡入：开');
  assert.equal(el('bzvFadeInBtn').attrs['aria-pressed'], 'true');
  assert.match(container.innerHTML, /「天时客观强弱」和「人在不同年纪的个人体感」是两层事。.*一键还原 100% 原始客观走势。/);
  for (const [id, label] of [['Wick', '包络开关说明'], ['FadeIn', '起步体感淡入说明']]) {
    assert.match(toolbar, new RegExp(`<div class="bzv-switch-help">\\s*<button[^>]+id="bzv${id}Btn"[^>]*></button>` +
      `\\s*<button[^>]+id="bzv${id}HelpBtn"[^>]+class="bzv-help-dot"[^>]+aria-label="${label}"[^>]+aria-controls="bzv${id}Popover"[^>]+aria-expanded="false">\\?</button>` +
      `\\s*<div id="bzv${id}Popover" class="bzv-help-popover" role="tooltip" hidden>`));
  }
  function verifyHelp(open = '') {
    for (const id of ['Wick', 'FadeIn']) {
      assert.equal(el(`bzv${id}Popover`).hidden, open !== id);
      assert.equal(el(`bzv${id}HelpBtn`).attrs['aria-expanded'], String(open === id));
    }
  }
  const hoverSwitch = (id, pointerType = 'mouse') => el(`bzv${id}Btn`).dispatch('pointerenter', { pointerType });
  const leaveSwitch = id => el(`bzv${id}Btn`).parentElement.dispatch('pointerleave');
  verifyHelp();
  hoverSwitch('Wick', 'touch');
  assert.equal(timers.size, 0);
  hoverSwitch('Wick');
  advance(499);
  verifyHelp();
  advance(1);
  verifyHelp('Wick');
  leaveSwitch('Wick');
  verifyHelp();
  hoverSwitch('FadeIn');
  advance(250);
  leaveSwitch('FadeIn');
  assert.equal(timers.size, 0);
  advance(500);
  verifyHelp();
  hoverSwitch('FadeIn');
  advance(500);
  verifyHelp('FadeIn');
  dispatchDoc('keydown', { key: 'Escape' });
  verifyHelp();
  el('bzvWickHelpBtn').onclick();
  dispatchDoc('click', { target: el('bzvWickPopover') });
  leaveSwitch('Wick');
  verifyHelp('Wick');
  el('bzvFadeInHelpBtn').onclick();
  verifyHelp('FadeIn');
  el('bzvFadeInHelpBtn').onclick();
  verifyHelp();
  el('bzvWickHelpBtn').onclick();
  dispatchDoc('click', { target: el('bzvLuckMainSvg') });
  verifyHelp();
  hoverSwitch('Wick');
  el('bzvWickBtn').onclick();
  assert.equal(el('bzvWickBtn').textContent, '包络：关');
  assert.equal(find(main(), 'data-amplitude-band', true), undefined);
  el('bzvWickBtn').onclick();
  el('bzvFadeInHelpBtn').onclick();
  const detachedPopover = el('bzvFadeInPopover');
  render();
  assert(detachedPopover.hidden);
  assert.equal(timers.size, 0);
  assert.equal(docListeners.click.size, 0);
  assert.equal(docListeners.keydown.size, 0);
  verifyHelp();
  verifyContinuousEnvelope();

  const objectiveFields = ['annualImpulse','level','plotLevel','prevPlotLevel','bandUp','bandDown'];
  const objectiveSnapshot = model.allYears.map(yr=>objectiveFields.map(k=>yr[k]));
  const fadedLevels = new Map();
  let faded = 0;
  for (const yr of main()._bzvCtx.flatYears) {
    const w = yr.decadeIndex === 0 ? (yr.yearIndexInDecade + 1) / 10 : 1;
    close(yr.displayPrevPlotLevel, faded);
    close(yr.displayImpulse, (yr.available ? yr.annualImpulse : 0) * w);
    close(yr.displayBandUp, yr.bandUp * w);
    close(yr.displayBandDown, yr.bandDown * w);
    faded += yr.displayImpulse;
    close(yr.displayPlotLevel, faded);
    assert.equal(yr.displayLevel, yr.available ? faded : null);
    fadedLevels.set(yr.y, yr.displayLevel);
  }
  const lineOn = find(main(), 'data-amplitude-band', true).attrs.d;
  el('bzvFadeInHelpBtn').onclick();
  el('bzvFadeInBtn').onclick();
  verifyHelp();
  assert.equal(el('bzvFadeInBtn').textContent, '起步体感淡入：关');
  for (const yr of main()._bzvCtx.flatYears) {
    assert.equal(yr.displayPlotLevel, yr.plotLevel);
    assert.equal(yr.displayPrevPlotLevel, yr.prevPlotLevel);
    assert.equal(yr.displayLevel, yr.level);
    assert.equal(yr.displayImpulse, yr.available ? yr.annualImpulse : 0);
    assert.equal(yr.displayBandUp, yr.bandUp);
    assert.equal(yr.displayBandDown, yr.bandDown);
  }
  assert.notEqual(find(main(), 'data-amplitude-band', true).attrs.d, lineOn);
  verifyContinuousEnvelope();
  verifyMainOnly();
  el('bzvFadeInBtn').onclick();
  assert.equal(fake.BaziVisuals.buildLuckModel(data), model);
  assert.deepEqual(model.allYears.map(yr=>objectiveFields.map(k=>yr[k])), objectiveSnapshot);
  verifyAlignedCharts();
  verifyMainOnly();
  assert.equal(segment(main(), 2005).y1, segment(main(), 2004).y2);

  state.selectedYear = 2005;
  render();
  const wealthDetail = () => container.querySelector('#bzvWealthDetail').innerHTML;
  const amplitudeDetail = () => container.querySelector('#bzvAmplitudeDetail').innerHTML;
  const tooltip = () => container.querySelector('#bzvLuckTooltip').innerHTML;
  const lockedWealth = wealthDetail(), lockedAmplitude = amplitudeDetail();
  assert.match(lockedAmplitude, /已知推动小计，累计含待判/);
  assert.match(lockedWealth, /2005.*当年财运净力度/s);
  assert.doesNotMatch(lockedWealth, /累计|均值/);
  main()._bzvCtx.syncHoverUI(5);
  assert.match(tooltip(), /2005.*已知推动小计，累计含待判/s);
  const target = main()._bzvCtx.pts[8];
  main().dispatch('pointermove', { clientX: target.x, clientY: target.y, pointerType: 'mouse' });
  assert.match(tooltip(), /2008.*当年状态 待判.*当年财运待判，未纳入财运加权/s);
  assert.equal(wealthDetail(), lockedWealth);
  assert.equal(amplitudeDetail(), lockedAmplitude);
  assert.equal(Number(find(main(), 'data-focus-ring', true).attrs.cx), Math.round(target.x * 10) / 10);
  main().dispatch('pointerleave');
  assert(el('bzvLuckTooltip').classList.contains('bzv-hidden'));
  assert.equal(wealthDetail(), lockedWealth);
  assert.equal(amplitudeDetail(), lockedAmplitude);
  let selected;
  fake.selectLuckYear = (decadeIndex, yearIndex) => { selected = [decadeIndex, yearIndex]; render(); };
  function pointer(year, pointerType = 'mouse') {
    const pt = main()._bzvCtx.pts.find(p=>p.yr.y===year);
    assert(pt, 'year visible: '+year);
    return {clientX:pt.x,clientY:pt.y,pointerType,pointerId:1,preventDefault(){}};
  }
  function clickYear(year, pointerType) {
    main().dispatch('pointerdown', pointer(year, pointerType));
    main().dispatch('pointerup');
  }
  function sweep(a,b) {
    main().dispatch('pointerdown', pointer(a));
    main().dispatch('pointermove', pointer(b));
    main().dispatch('pointerup');
  }
  function visibleRange() {
    const years = main()._bzvCtx.flatYears;
    return [years.length,years[0].y,years.at(-1).y];
  }
  clickYear(2008);
  assert.deepEqual(selected, [0, 8]);
  assert.equal(state.selectedYear, 2008);
  assert.deepEqual(visibleRange(), [30,2000,2029]);
  assert.equal(state.luckZoomDecade, null);
  assert.notEqual(wealthDetail(), lockedWealth);
  assert.notEqual(amplitudeDetail(), lockedAmplitude);
  assert.match(wealthDetail(), /2008.*当年财运待判，未纳入财运加权/s);
  el('bzvNextYearBtn').onclick();
  assert.match(wealthDetail(), /2009.*当年财运净力度/s);
  assert.match(amplitudeDetail(), /2009 双边力度来源/);

  const comparePanel = () => container.querySelector('#bzvComparePanel');
  const compareLink = () => descendants(main()).find(node => node.attrs['data-compare-link']);
  const comparison = (a, b) => { state.compare = { a, b }; render(); return comparePanel().innerHTML; };
  assert.match(comparison(2002, 2005), /含 2 个待判年份，完整累计升降未知.*完整区间峰谷未知/s);
  assert.equal(compareLink(), undefined);
  main()._bzvCtx.syncHoverUI(5);
  assert.match(tooltip(), /含 2 个待判年份，完整累计升降未知/);
  assert(descendants(main()).some(node => node.textContent.includes('含 2 个待判年份')));
  assert.match(comparison(2005, 2002), /含 2 个待判年份，完整累计升降未知/);
  const endpoints = comparison(2003, 2004);
  assert.match(endpoints, /起点 A.*终点 B.*含 2 个待判年份/s);
  assert.equal((endpoints.match(/当年待判/g) || []).length, 4);
  assert(descendants(main()).some(node => node.textContent.includes('A 2003 待判')));
  assert(descendants(main()).some(node => node.textContent.includes('B 2004 待判')));
  assert.match(comparison(2003, 2003), /含 1 个待判年份/);
  assert.match(comparison(2002, 2003), /含 1 个待判年份/);
  assert.match(comparison(2003, 2005), /含 2 个待判年份/);
  assert.match(comparison(2005, 2005), /已知累计变化 \+0.00/);
  assert.match(comparison(2005, 2007), /已知累计变化 -[0-9.]+.*区间峰值.*谷底/s);
  assert(compareLink());
  const selectA = comparePanel().querySelector('#bzvCmpSelectA'), selectB = comparePanel().querySelector('#bzvCmpSelectB');
  assert(selectA && selectB);
  selectA.value = '2007';
  selectB.value = '2005';
  selectA.onchange();
  assert.equal(state.compare.a, 2007);
  assert.equal(state.compare.b, 2005);
  const positiveDiff = (fadedLevels.get(2005) - fadedLevels.get(2007)).toFixed(2);
  assert(comparePanel().innerHTML.includes('已知累计变化 +' + positiveDiff));
  assert(compareLink());

  el('bzvFadeInBtn').onclick();
  const objectiveDiff = (byYear(2005).level - byYear(2007).level).toFixed(2);
  assert.notEqual(positiveDiff, objectiveDiff);
  assert(comparePanel().innerHTML.includes('已知累计变化 +' + objectiveDiff));
  el('bzvFadeInBtn').onclick();
  comparePanel().querySelector('#bzvCompareCloseBtn').onclick();
  assert.equal(state.compare, null);

  clickYear(2028);
  assert.deepEqual(visibleRange(), [30,2000,2029]);
  el('bzvNextYearBtn').onclick();
  assert.deepEqual(visibleRange(), [30,2000,2029]);
  el('bzvNextYearBtn').onclick();
  assert.deepEqual(visibleRange(), [30,2001,2030]);
  clickYear(2001);
  el('bzvPrevYearBtn').onclick();
  assert.deepEqual(visibleRange(), [30,2000,2029]);
  el('bzvZoomBackBtn').onclick();
  assert.deepEqual(visibleRange(), [100,2000,2099]);
  sweep(2020,2041);
  assert.deepEqual([state.compare.a,state.compare.b], [2020,2041]);
  assert.deepEqual(visibleRange(), [100,2000,2099]);
  el('bzvInlineCompareBtn').onclick();
  assert.equal(state.compare, null);
  clickYear(2050);
  assert.deepEqual(visibleRange(), [30,2036,2065]);
  clickYear(2056);
  assert.equal(state.selectedYear, 2056);
  assert.deepEqual(visibleRange(), [30,2036,2065]);
  sweep(2040,2059);
  assert.deepEqual([state.compare.a,state.compare.b], [2040,2059]);
  const handle = descendants(main()).find(node=>node.attrs['data-handle']==='a');
  main().dispatch('pointerdown',{ ...pointer(2040), target:{closest:()=>handle} });
  main().dispatch('pointermove',pointer(2041));
  main().dispatch('pointerup');
  assert.deepEqual([state.compare.a,state.compare.b], [2041,2059]);
  comparePanel().querySelector('#bzvCompareCloseBtn').onclick();
  el('bzvZoomBackBtn').onclick();
  clickYear(2095);
  assert.deepEqual(visibleRange(), [30,2070,2099]);
  el('bzvZoomBackBtn').onclick();
  descendants(main()).find(node=>node.attrs['data-decade-header']==='1').dispatch('click');
  assert.equal(main()._bzvCtx.flatYears.length, 10);
  assert.equal(state.luckZoomDecade, 1);
  assert.equal(state.luckWindow, null);
  assert.equal(main()._bzvCtx.flatYears[0].displayPlotLevel, fadedLevels.get(2010));
  assert.equal(segment(main(), 2010)['stroke-dasharray'], 'none');
  assert.notEqual(segment(main(), 2010).y1, segment(main(), 2010).y2);
  verifyAlignedCharts();
  verifyMainOnly();
  fake.innerWidth = 390;
  render();
  clickYear(2010, 'touch');
  assert.deepEqual(visibleRange(), [10,2010,2019]);
  assert.equal(el('bzvInlineCompareBtn').textContent, '与他年对比');
  el('bzvInlineCompareBtn').onclick();
  assert.deepEqual([state.compare.a,state.compare.b], [2010,2011]);
  assert.equal(el('bzvInlineCompareBtn').textContent, '退出对比');
  comparePanel().querySelector('#bzvCompareCloseBtn').onclick();
  assert.equal(state.compare, null);
  verifyAlignedCharts();
  verifyMainOnly();
  el('bzvZoomBackBtn').onclick();
  clickYear(2012, 'touch');
  assert.deepEqual(visibleRange(), [30,2000,2029]);
  verifyAlignedCharts();
  verifyMainOnly();
  assert.equal(evaluated, 10, 'overview, zoom, hover and comparison reuse the whole-cycle model');

  numberOfDecades++;
  const extended = fake.BaziVisuals.buildLuckModel(data);
  assert.equal(extended.allYears.length, 110);
  for (const [idx, yr] of model.allYears.entries()) {
    for (const field of ['annualImpulse','plotLevel','level','wealthImpulse','wealthPlotLevel','wealthLevel']) {
      assert.equal(extended.allYears[idx][field], yr[field], `adding a decade preserves ${field} at ${yr.y}`);
    }
  }

  const d = chart(c, 1961, 10, 17, 14);
  assert.equal(Object.values(d.pillars).join('/'), '辛丑/戊戌/癸未/己未');
  const entry = c.BaziEngine.evaluateLuckOutlook(d, '壬辰', null, [{ year: 2021, gz: '辛丑' }]).years[0];
  assert.equal(entry.wealth.direction, 'pending');
  assert.equal(entry.wealth.label, '财路待判');
  assert.equal(entry.wealth.amplitude.available, false);
  assert.equal(entry.wealth.amplitude.hasPending, true);
  assert(entry.wealth.uncertainty.length && entry.wealth.missingFields.length);

  const asyncCtx = load();
  asyncCtx.setTimeout = fn => { fn(); return 0; };
  asyncCtx.document.querySelector = sel => sel === '[data-view-panel="luck"]' ? { classList: { contains: () => true } } : { value: '男' };
  const asyncContainer = mockChart(asyncCtx);
  const asyncModel = await asyncCtx.BaziVisuals.renderLuckSectionAsync(asyncContainer, chart(asyncCtx, 1961, 10, 17, 14));
  assert(asyncModel && asyncContainer.querySelector('#bzvLuckMainSvg').children.length > 0);
  const syncModel = visuals.buildLuckModel(d);
  asyncModel.allYears.forEach((yr, idx) => {
    const sy = syncModel.allYears[idx];
    for (const field of ['annualImpulse','prevPlotLevel','plotLevel','level','wealthImpulse','wealthPlotLevel','wealthLevel','cumulativeHasPriorPending'])
      assert.equal(yr[field], sy[field], 'async and sync use the same accumulation');
  });

  // Existing five page fixtures use the same location and true-solar settings.
  const pageFixtures = [
    [1993,11,24,5,2,'男'], [1993,7,14,8,40,'男'], [1998,6,23,9,30,'女'],
    [1993,12,13,8,5,'男'], [2002,6,27,19,45,'男']
  ];
  const sampleCharts = pageFixtures.map(([y,m,day,h,min,gender]) => chart(c,y,m,day,h,min,{
    gender, location:{name:'云南省曲靖市师宗县',lng:103.9936,lat:24.8222}, useTrueSolar:true,useDaylightSaving:false
  })).concat(d);
  const stats = sampleCharts.map(person => {
    const { allYears } = visuals.buildLuckModel(person);
    assert.equal(allYears.length, 100);
    const {year,month,day,hour,minute} = person.time.input;
    return { input: [year,month,day,hour,minute].join('/'), gender: person.gender,
      years: allYears.length, combinedPending: allYears.filter(y=>!y.available).length,
      wealthPending: allYears.filter(y=>!y.wealthAvailable).length };
  });
  const totals = stats.reduce((sum,x)=>[sum[0]+x.years,sum[1]+x.combinedPending,sum[2]+x.wealthPending],[0,0,0]);
  assert.equal(totals[0], 600);
  console.table(stats);
  console.log(`600 years: combined pending ${totals[1]}, wealth pending ${totals[2]}`);

  // Stage 3 real-chart wealthExtraWeight=0 recovery + BOT #2/#3 UI integration tests.
  const real1993 = chart(c, 1993, 7, 14, 8, 0, {
    gender: '男', location: { name: '北京', lng: 116.4074, lat: 39.9042 }, useTrueSolar: false, useDaylightSaving: false
  });
  const merged1993 = visuals.buildLuckModel(real1993);
  const baseOnly1993 = visuals.buildLuckModel(real1993, { wealthExtraWeight: 0 });
  assert.equal(merged1993.allYears.length, 100);
  assert.equal(baseOnly1993.allYears.length, 100);
  let baseCheckCum = 0;
  for (const yr of baseOnly1993.allYears) {
    assert(yr.wealthMerge && yr.wealthMerge.weight === 0);
    if (!yr.baseRange.pending) {
      const g = yr.baseRange.guaranteed;
      const expectedAnn = { direction: yr.rawDir, uncertainty: [], amplitude: { available: true, positive: Math.max(0, g), negative: Math.max(0, -g), breakdown: [], hasPending: false } };
      const expectedStep = level(expectedAnn).level;
      close(yr.annualImpulse, expectedStep, 'weight=0 annual impulse equals base comprehensive impulse at ' + yr.y);
      baseCheckCum += expectedStep;
      close(yr.plotLevel, baseCheckCum, 'weight=0 cumulative plotLevel matches base accumulation at ' + yr.y);
    } else {
      assert(!yr.available);
    }
  }
  const y18m = merged1993.allYears.find(y => y.y === 2018), y18b = baseOnly1993.allYears.find(y => y.y === 2018);
  assert.equal(y18m.amplitude.net, y18b.amplitude.net - 0.5, '2018 applies the verified wealth loss at +25% weight');
  const y21m = merged1993.allYears.find(y => y.y === 2021);
  assert(y21m.bandUp > 0 && y21m.bandDown > 0, '2021 keeps both verified forces in the gold band');
  const r93Box = mockChart(c);
  visuals._state.selectedYear = 2021;
  visuals.renderLuckSection(r93Box, real1993);
  assert(r93Box.querySelector('#bzvAmplitudeDetail').innerHTML.includes(
    '助力 '+y21m.amplitude.positive.toFixed(2)+' / 阻力 '+y21m.amplitude.negative.toFixed(2)),
  'the curve detail reconciles to the booked positive and negative totals');

  const outlook = (person, luck, years) => c.BaziEngine.evaluateLuckOutlook(person, luck, null,
    years.map(year => ({ year, gz: c.BaziEngine.getFlowYearGZ(year) }))).years;
  const sameRoute=outlook({dayStem:'乙',pillars:{year:'丁卯',month:'壬寅',day:'乙酉',hour:'丙戌'}},'甲寅',[2009])[0];
  const wealthStep=sameRoute.wealth.amplitude.breakdown.find(r=>r.ruleId==='W-food');
  assert.equal(wealthStep.contribution,1);
  assert.equal(wealthStep.baseContribution,0);
  close(level(sameRoute.wealth).level,0.55/(1+0.12),'wealth compression uses the route’s own tier');
  close(level(sameRoute.annual).level,0.55*5.25/(1+0.12*5.25),'combined compression uses the deduplicated B and weighted W');
  const coreRow = (year, side) => year.actionLedger.find(r => r.ruleId==='Y3-core-gate'&&r.side===side&&r.contribution>0);
  const killing = chart(c,1988,11,3,19);
  const [opened, continuing, interrupted] = outlook(killing,'壬申',[1995,1996,1997]);
  assert.equal(coreRow(opened,'positive')?.contribution,3);
  assert.equal(coreRow(continuing,'positive')?.contribution,3);
  assert(coreRow(opened,'positive').recovery && !coreRow(continuing,'positive').recovery);
  assert.match(coreRow(opened,'positive').text,/恢复/);
  assert.doesNotMatch(coreRow(continuing,'positive').text,/恢复/);
  assert.equal(coreRow(interrupted,'positive'),undefined);
  assert.equal(continuing.actionLedger.filter(r=>r.contribution>0&&r.recovery).length,0,
    'a continuing rescue does not pay a second recovery bonus');
  assert.deepEqual(JSON.parse(JSON.stringify(coreRow(outlook(killing,'壬申',[1996])[0],'positive'))),
    JSON.parse(JSON.stringify(coreRow(continuing,'positive'))), 'isolated year and full-window recovery use the same clock');
  const broken=outlook(chart(c,1996,2,7,4),'辛亥',[2024])[0];
  assert.equal(coreRow(broken,'negative')?.contribution,3,'verified control-path loss earns symmetric tier 3');
  assert(level(opened.annual).level>0 && level(continuing.annual).level>0 && level(broken.annual).level<0);

  const [untouched]=outlook(chart(c,2000,1,1,12),'甲戌',[2005]);
  const [unconfirmed]=outlook(chart(c,1961,10,17,14),'戊子',[2002]);
  const touches=outlook(chart(c,1984,4,13,8),'己巳',[1996,1998]);
  assert(untouched.background.natalDiseases.length&&untouched.actionLedger.every(r=>r.contribution===0)&&
    level(untouched.annual).available);
  assert.equal(level(untouched.annual).level,0);
  assert.equal(unconfirmed.effectiveRange.reason,'missing-evidence');
  assert.equal(level(unconfirmed.annual).level,null);
  assert.deepEqual(touches.map(y=>y.actionLedger.find(r=>r.ruleId==='Y3-path-touch'&&r.contribution>0)?.contribution),[1,2]);
  for(const sign of [1,-1]){
    const slopes=[1,2,3].map(n=>level(result(sign>0?'positive':'negative',
      [row(sign>0?'positive':'negative',n)] )).level);
    assert(slopes.every(x=>Math.sign(x)===sign));
    assert(Math.abs(slopes[0])<Math.abs(slopes[1])&&Math.abs(slopes[1])<Math.abs(slopes[2]),
      'the existing compression preserves ordered, symmetric slope tiers');
  }

  const s3Ctx = load(), s3Chart = chart(s3Ctx, 1993, 7, 14, 8);
  const mergeFn = s3Ctx.BaziEngine.settleScenarioWealthMerge;
  const mkRng = (min, max, dir, pend = false) => ({
    min: pend ? null : min, max: pend ? null : max,
    guaranteed: pend ? null : (min > 0 ? min : max < 0 ? max : 0),
    direction: dir, possibleDirections: [], pending: pend,
    reason: pend ? 'missing-evidence' : (min !== max ? 'bounded-magnitude' : 'verified')
  });
  const mkScenarioYear = (year, gz, B, W, scenarios, note = '') => {
    const wm = mergeFn(B, W, scenarios, 0.25);
    const eff = wm.combinedRange;
    const net = eff.guaranteed;
    return {
      year, gz,
      comprehensiveRange: B, wealthRange: W, effectiveRange: eff, wealthMerge: wm,
      annual: {
        direction: eff.pending ? 'pending' : (net > 0 ? 'positive' : net < 0 ? 'negative' : 'neutral'),
        label: eff.pending ? '待判' : (net > 0 ? '偏吉' : '偏凶'),
        evidence: [], reservations: [],
        uncertainty: wm.reversalRisk ? ['可行情景在计入财运加权后出现涨跌反转，该年按综合待判处理'] : [],
        amplitude: {
          available: !eff.pending, positive: net == null ? 0 : Math.max(0, net), negative: net == null ? 0 : Math.max(0, -net),
          net, hasPending: eff.pending, missingFields: eff.pending ? [eff.reason] : [], breakdown: [], strongTrigger: { positive: false, negative: false }
        },
        wealthMerge: wm
      },
      wealth: {
        direction: W.direction, label: W.pending ? '财路待判' : (W.direction === 'positive' ? '财路助益' : '财路受限'),
        amplitude: {
          available: !W.pending, positive: W.guaranteed > 0 ? W.guaranteed : 0, negative: W.guaranteed < 0 ? -W.guaranteed : 0,
          net: W.guaranteed, hasPending: W.pending, missingFields: [], breakdown: []
        },
        reasons: [], uncertainty: W.pending ? ['当年财运待判，未纳入财运加权'] : [], note
      },
      previousYear: { direction: 'neutral' }
    };
  };
  s3Ctx.getLuckData = () => ({ rows: [{ index: 0, gz: '甲子', from: 1, to: 10 }], currentYear: 2001 });
  s3Ctx.luckStartYear = () => 2000;
  s3Ctx.BaziEngine.evaluateLuckOutlook = (d, gz, prev, years) => ({
    natal: neutral,
    years: years.map((y, idx) => {
      if (idx === 0) return mkScenarioYear(y.year, y.gz, mkRng(2, 2, 'positive'), mkRng(-3, -1, 'negative'), [{ B: 2, W: -1 }, { B: 2, W: -3 }]);
      if (idx === 1) return mkScenarioYear(y.year, y.gz, mkRng(0.5, 0.5, 'positive'), mkRng(-3, -1, 'negative'), [{ B: 0.5, W: -1 }, { B: 0.5, W: -3 }]);
      if (idx === 2) return mkScenarioYear(y.year, y.gz, mkRng(1, 1, 'positive'), mkRng(0, 0, 'pending', true), [{ B: 1, W: 0 }], '当年财运待判，未纳入财运加权。');
      if (idx === 3) return mkScenarioYear(y.year, y.gz, mkRng(1, 2, 'positive'), mkRng(1, 8, 'positive'), [{ B: 1, W: 8 }, { B: 2, W: 1 }]);
      if (idx === 4) return mkScenarioYear(y.year, y.gz, mkRng(0, 0, 'pending', true), mkRng(-1, -1, 'negative'), [{ B: 0, W: -1 }]);
      return mkScenarioYear(y.year, y.gz, mkRng(0, 0, 'neutral'), mkRng(0, 0, 'neutral'), [{ B: 0, W: 0 }]);
    })
  });
  const s3Box = mockChart(s3Ctx), s3Main = () => s3Box.querySelector('#bzvLuckMainSvg');
  const s3Detail = () => s3Box.querySelector('#bzvWealthDetail').innerHTML;
  s3Ctx.BaziVisuals._state.selectedYear = 2000;
  s3Ctx.BaziVisuals.renderLuckSection(s3Box, s3Chart);
  assert.match(s3Detail(), /基础推动 \+2\.00.*财运加权（25%）-0\.75.*已锁定区间 -3\.00~-1\.00.*合算推动区间 \+1\.25~\+1\.75（按最小确定幅度 \+1\.25 入账）/);
  assert.doesNotMatch(s3Detail(), /累计|均值/);
  s3Ctx.BaziVisuals._state.selectedYear = 2001;
  s3Ctx.BaziVisuals.renderLuckSection(s3Box, s3Chart);
  const revSeg = find(s3Main(), 'data-year-segment', 2001)?.attrs;
  const revMarker = find(s3Main(), 'data-pending-year', 2001);
  assert(revSeg && revSeg['stroke-dasharray'] !== 'none' && revSeg.y1 === revSeg.y2, 'BOT #3 reversal plots dashed horizontal hold');
  assert(revMarker && !find(s3Main(), 'data-pending-label', 2001));
  assert.match(revMarker.children.find(child => child.tag === 'title').textContent, /反转/);
  assert.match(s3Detail(), /基础综合推动.*财运加权.*反转风险/);
  s3Ctx.BaziVisuals._state.selectedYear = 2002;
  s3Ctx.BaziVisuals.renderLuckSection(s3Box, s3Chart);
  const skipSeg = find(s3Main(), 'data-year-segment', 2002)?.attrs;
  assert(skipSeg && skipSeg['stroke-dasharray'] === '5 4' && Number(skipSeg.y1) === Number(revSeg.y2), 'after pending hold, valid B year resumes from held height with its fade style');
  assert.match(s3Detail(), /当年财运待判，未纳入财运加权/);
  s3Ctx.BaziVisuals._state.selectedYear = 2003;
  s3Ctx.BaziVisuals.renderLuckSection(s3Box, s3Chart);
  assert.match(s3Detail(), /基础推动 \+2\.00.*财运加权（25%）\+0\.25.*已锁定区间 \+1\.00~\+8\.00/);
  for (const html of [s3Detail(),s3Box.querySelector('#bzvAmplitudeDetail').innerHTML]) {
    assert.match(html, /基础综合推动区间 \+1\.00~\+2\.00（按最小确定幅度 \+1\.00 入账）.*合算推动区间 \+2\.25~\+3\.00（按最小确定幅度 \+2\.25 入账）/);
  }
  close(s3Ctx.BaziVisuals.buildLuckModel(s3Chart).allYears[3].annualImpulse, 0.55 * (2.25 / (1 + 0.12 * 2.25)),
    'Codex #3 chart impulse uses conservative 2.25 total matching displayed detail');
  s3Ctx.BaziVisuals._state.selectedYear = 2004;
  s3Ctx.BaziVisuals.renderLuckSection(s3Box, s3Chart);
  assert.match(s3Detail(), /当年财运净力度 -[\d.]+（当年综合待判，未并入主线）/);
  assert.doesNotMatch(s3Detail(), /财路助阻相抵或持平/);

  console.log('PASS annual accumulation, strict pending, shared ranges, fade on/off, 30-year focus, inline and drag comparison, 390px state, weight=0 recovery, and extension stability');
  console.log('PASS continuous pending envelope, per-switch help, and hover-independent locked details');
}
if (require.main === module) {
  run().catch(err => { console.error(err); process.exitCode = 1; });
}
module.exports = { load, run };
