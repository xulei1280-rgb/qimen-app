const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createHash } = require('node:crypto');
const { execFileSync } = require('node:child_process');

const baseline = '924f029';
const oldVersion = 'luck-outlook-20261128.8';
const version = 'luck-outlook-20261128.9';
const read = file => fs.readFileSync(path.join(__dirname, file), 'utf8');
const historicalSource = () => execFileSync('git', ['show', baseline + ':bazi-engine.js'], {
  cwd: __dirname, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024
});
const normalize = value => JSON.stringify(value)?.replaceAll(version, oldVersion);
const equal = (a, b) => normalize(a) === normalize(b);

function load(source, current) {
  const seam = 'root.BaziEngine=api;';
  const ledgerSeam = 'actionLedger:rows,wealthRange:W,comprehensiveRange:B';
  assert(source.includes(seam), 'Bazi engine audit seam');
  assert(source.includes(ledgerSeam), 'Annual ledger audit seam');
  const context = vm.createContext({ BirthTime: require('./birth-time.js') });
  for (const file of ['qimen.js', 'china-locations.js', 'bazi-shensha.js']) vm.runInContext(read(file), context);
  const audit = 'buildTemporalPatternContext,interactionFlowAnalysis,annualActorKey' +
    (current ? ',annualNatalTransformRestored' : '');
  vm.runInContext(source.replace(seam, 'root.audit={' + audit + '};' + seam)
    .replace(ledgerSeam, 'scenarioLedgers:contexts.map(function(x){return x.result.ledger;}),' + ledgerSeam), context);
  return { E: context.BaziEngine, ...context.audit };
}

const cycle = Array.from({ length: 60 }, (_, i) =>
  '甲乙丙丁戊己庚辛壬癸'[i % 10] + '子丑寅卯辰巳午未申酉戌亥'[i % 12]);

function profile(E, [year, month, day, hour, minute, gender, solar = false]) {
  return E.createBaziProfile({
    input: { year, month, day, hour, minute }, gender, useTrueSolar: solar, useDaylightSaving: false,
    location: solar ? { name: '师宗', lng: 103.9936, lat: 24.8222 } : { name: '北京', lng: 116.4074, lat: 39.9042 }
  });
}

function* batches(E, p, decades) {
  const start = E.luckStartInfo(p).startYear, direction = E.luckDirection(p), month = cycle.indexOf(p.pillars.month);
  let prior = null;
  for (let i = 0; i < decades; i++) {
    const luck = cycle[(month + direction * (i + 1) + 60) % 60];
    const years = Array.from({ length: 10 }, (_, j) => {
      const year = start + i * 10 + j, luckGz = j ? luck : prior;
      return { year, gz: E.getFlowYearGZ(year), previous: luckGz && { year: year - 1, gz: E.getFlowYearGZ(year - 1), luckGz } };
    });
    yield { luck, prior, years };
    prior = luck;
  }
}

const net = (row, field = 'effectiveRange') => row[field].pending ? 'pending' : row[field].guaranteed;
const owned = row => row.scenarioLedgers.map(ledger => ledger.filter(e => e.ownedEventKeys?.length)
  .map(e => [e.ruleId, e.taskId, e.ownedEventKeys, e.contribution, e.wealthContribution]));
const tomb = row => new Set(row.scenarioLedgers.flatMap(ledger => ledger.flatMap(e =>
  (e.tomb?.parts || []).filter(p => p.value).map(p => JSON.stringify(p.key)))));
const expectedChanges = {
  B: ['#4/1996', '#4/2008', '#50/2018', '#64/2044', '#86/2013'],
  ownedOnly: ['#60/1965', '#64/2032', '#66/1996', '#96/2013'],
  diagnostic: ['#18/2013']
};
const classify = (before, after) => !equal(before.comprehensiveRange, after.comprehensiveRange) ? 'B'
  : !equal(owned(before), owned(after)) ? 'ownedOnly' : !equal(before, after) ? 'diagnostic' : 'same';

// Freeze the complete approved rows so historical suites can check their original
// pre-Batch-1 contracts and still reject any different change on these same years.
const approvedRows = new Map([
  ['#4/1996', '60d231590f54dea9d99f6d598679025407d521cce30b7a8c25881edeeb610c4e'],
  ['#4/2008', '89a21221f04da3da50ec1651a15b154f60496d7b90b0df28b7ea6df2be3c1d9f'],
  ['#18/2013', '66df835b6b1e87692dd1eb6b80adda1e0ac92142f1ae08d3659abb7a8710f43c'],
  ['#50/2018', '76523005c53cd40429c85ea0735ddc972695256e792abaf2977e23b572164bfc'],
  ['#60/1965', '2c54169211ba6507507fc0f1aed5d68049f201a99fd62c69ec3b6fcc98a6bcb3'],
  ['#64/2032', '6afaea71689a6ac518f5293b2c6ab05f7b8c09d18c2fcdee1ca5ded70f66a50a'],
  ['#64/2044', '7e47fba1b74c79454f230dbaa1782599b3b9f378473b237409125c783242e478'],
  ['#66/1996', 'dc980b40ee20205e625da1ff2bf53080f6e08ce596bf273481577d52064ac7b7'],
  ['#86/2013', 'daf7902c9a8d05f49cd7dcb1721e87b2202ab92bb5e5ca56ae9356b32f530c56'],
  ['#96/2013', '260f869122dacf1f3e85896934b55772fbc1f7660f6b52c8426515daaf7863d8']
]);
function assertApprovedRow(key, row) {
  const canonical = Object.fromEntries(Object.entries(row).map(([field, value]) => {
    if (field === 'auditScenarios') return ['scenarioLedgers', value.map(scene => scene.ledger)];
    if (field === 'auditLedgers') return ['scenarioLedgers', value];
    return [field, value];
  }));
  assert.equal(createHash('sha256').update(normalize(canonical)).digest('hex'), approvedRows.get(key), key + ' Batch 1 row');
}
function historicalYear(loadEngine = source => load(source, false).E) {
  let engine;
  return (key, row, profile, luck, prior, input) => {
    if (!approvedRows.has(key)) return row;
    assertApprovedRow(key, row);
    engine ||= loadEngine(historicalSource());
    const historical = engine.evaluateLuckOutlook(profile, luck, prior, [input]).years[0];
    return JSON.parse(JSON.stringify(historical).replaceAll(oldVersion, version));
  };
}

function duplicates(row, before) {
  const existing = new Set();
  function inspect(item, previous) {
    let dup = 0, flip = 0;
    item.scenarioLedgers.forEach((ledger, i) => {
      const seen = new Map();
      const scenario = item.scenarios[i];
      const relevant = JSON.stringify([scenario.branch, scenario.retainedRoots, scenario.replacementStates]);
      for (const action of ledger) {
        if (scenario.branch !== 'B' && action.action?.effect !== 'recurrence') continue;
        for (const key of action.ownedEventKeys || []) {
          const unsigned = JSON.stringify(JSON.parse(key).slice(1));
          if (seen.has(unsigned)) {
            const opposite = seen.get(unsigned) !== action.side;
            const signature = JSON.stringify([relevant, unsigned, action.ruleId, action.taskId, action.side, opposite]);
            if (previous) existing.add(signature);
            else if (!existing.delete(signature)) {
              dup++;
              if (opposite) flip++;
            }
          }
          seen.set(unsigned, action.side);
        }
      }
    });
    return [dup, flip];
  }
  inspect(before, true);
  return inspect(row, false);
}

function checkBoundary(after) {
  const natal = { year: '乙亥', month: '戊寅', day: '甲子', hour: '甲子' };
  const pillars = { ...natal, luck: '丁亥', flowYear: '乙巳' };
  const analysis = after.E.analyzePattern({ pillars: natal, dayStem: '甲' });
  const base = after.buildTemporalPatternContext('甲', natal, analysis);
  const current = after.buildTemporalPatternContext('甲', pillars, analysis, { outlookFlowYear: true, annualNatalTransformBase: base });
  const restored = after.annualNatalTransformRestored(base, pillars, current.interactions);
  const root = current.profiles['比肩'].branchEntries.find(e => e.pillar === 'month' && e.hiddenIndex === 0);
  const dayRoot = current.strengthScore.dimensions.roots.items.find(e => e.position === 'month');
  assert.deepEqual([restored, root.rootPower, root.boundByCombine, current.strengthScore.support],
    [null, 0.38, true, 44.7]);
  assert.deepEqual([dayRoot.rootPower, dayRoot.boundByCombine], [0.38, true]);
  console.log('PASS synthetic counterexample: restored=null, rootPower=0.38, boundByCombine=true, support=44.7');
}

function checkQinRoute(after, p, years) {
  const analysis = after.E.analyzePattern(p);
  const base = after.buildTemporalPatternContext(p.dayStem, p.pillars, analysis);
  for (const row of years) {
    const context = after.buildTemporalPatternContext(p.dayStem, { ...p.pillars, luck: '丙辰', flowYear: row.gz },
      analysis, { outlookFlowYear: true, annualNatalTransformBase: base });
    const step = after.interactionFlowAnalysis('', context.profiles, context.interactions, [], [{
      from: ['伤官'], to: ['正财'], action: '生', leftActor: 'luck:丙:火', rightActor: 'hour:戊:土'
    }], { exactMediator: true }).steps[0];
    assert(step?.active, '秦畅 丙辰 丙→时戊 ' + row.year);
    assert.deepEqual([after.annualActorKey(step.left), after.annualActorKey(step.right)], ['luck:丙:火', 'hour:戊:土']);
  }
}

function run() {
  const before = load(historicalSource(), false), after = load(read('bazi-engine.js'), true), { E } = after;
  checkBoundary(after);
  let natalCount = 0;
  E.forEachLegalFourPillar((pillars, meta) => {
    if (meta.yearIndex < 2 || meta.dayIndex < 30 || meta.hourIndex !== meta.dayIndex % 4) return;
    assert.equal(JSON.stringify(E.analyzePattern({ pillars })), JSON.stringify(before.E.analyzePattern({ pillars })), meta.key);
    natalCount++;
  }, { yearCycleCount: 4, monthBranchCount: 12, dayCycleCount: 60, hourBranchCount: 4, validateUnique: false });
  assert.equal(natalCount, 720);
  console.log('PASS 720 exact natal analyzePattern comparisons');

  const changes = { B: [], ownedOnly: [], diagnostic: [] };
  const zeros = { W: 0, flips: 0, w0Err: 0, fourFiveErr: 0, incErr: 0, prevErr: 0,
    unsignedKeyDup: 0, sameEventSignFlip: 0, erasedTomb: 0, fake: 0 };
  const check = (name, ok, key) => { if (!ok) { zeros[name]++; console.error(name, key); } };
  let cohortYears = 0;

  function compare(label, input, decades, cohort = false) {
    const p = profile(E, input);
    assert(equal(p, profile(before.E, input)), label + ' profile');
    const oldBatches = [...batches(before.E, p, decades)];
    const rows = new Map(), drift = [];
    for (const [i, { luck, prior, years }] of [...batches(E, p, decades)].entries()) {
      assert(equal({ luck, prior, years }, oldBatches[i]), label + ' luck boundaries');
      const a = before.E.evaluateLuckOutlook(p, luck, prior, years);
      const b = E.evaluateLuckOutlook(p, luck, prior, years);
      const z = cohort && E.evaluateLuckOutlook(p, luck, prior, years, { wealthExtraWeight: 0 });
      assert.equal(a.ruleVersion, oldVersion);
      assert.equal(b.ruleVersion, version);
      for (const field of ['natal', 'previous', 'wealth']) check('fourFiveErr', equal(a[field], b[field]), label + ' ' + field);
      b.years.forEach((next, j) => {
        const old = a.years[j], key = label + '/' + next.year;
        check('incErr', equal(old.increment, next.increment), key);
        check('prevErr', equal(old.previousYear, next.previousYear), key);
        if (!cohort) {
          rows.set(next.year, { next, old, luck });
          if (!equal(old.effectiveRange, next.effectiveRange) || !equal(old.comprehensiveRange, next.comprehensiveRange)) {
            drift.push([next.year, net(old), net(next)]);
          }
          return;
        }
        cohortYears++;
        check('W', equal(old.wealthRange, next.wealthRange), key);
        check('flips', !(['positive', 'negative'].includes(old.effectiveRange.direction) &&
          ['positive', 'negative'].includes(next.effectiveRange.direction) &&
          old.effectiveRange.direction !== next.effectiveRange.direction), key);
        check('w0Err', equal(z.years[j].effectiveRange, next.comprehensiveRange), key);
        const [dup, flip] = duplicates(next, old);
        check('unsignedKeyDup', !dup, key);
        check('sameEventSignFlip', !flip, key);
        const retained = tomb(next);
        check('erasedTomb', [...tomb(old)].every(event => retained.has(event)), key);
        check('fake', !(old.fakeFollow || next.fakeFollow) || equal(old, next), key);
        const category = classify(old, next);
        if (category !== 'same') {
          changes[category].push(key);
          if (approvedRows.has(key)) assertApprovedRow(key, next);
        }
        if (key === '#58/2014') assert.deepEqual([category, net(next, 'comprehensiveRange')], ['same', 0]);
      });
    }
    return { p, rows, drift };
  }

  const refs = [
    ['李云茂', [1994, 8, 5, 17, 30, '女', false], { 2026: -2, 2036: -4, 2044: 0 }, [[2026, 0, -2]]],
    ['秦畅', [1994, 2, 18, 3, 30, '女', false], {}, [
      [2001, -6.25, -3], [2009, -4, -1], [2013, -8.25, -4], [2023, -9, -8], [2035, -8.25, -8.25],
      [2037, -1.25, 5.5], [2053, -8.25, -6.25], [2062, -6, -3], [2080, -1.25, 6.5], [2081, -3.25, -5.5],
      [2082, -4.25, -1], [2083, -8, -7.5], [2084, -2.25, 0.75], [2085, -2.25, 4.5], [2087, -3.25, -5.75]
    ]],
    ['色魔', [1993, 11, 24, 4, 30, '男']],
    ['香肠', [1993, 12, 13, 8, 5, '男', true], { 2042: 0.5 }],
    ['老王', [1994, 7, 29, 10, 0, '女'], { 2067: 4 }],
    ['小蔓', [1998, 6, 23, 9, 30, '女', true], { 2029: 'pending' }],
    ['狼王', [1993, 11, 12, 2, 30, '男']],
    ['小宇', [1998, 10, 9, 23, 30, '男']],
    ['张黎', [1994, 12, 22, 11, 30, '女']]
  ];
  for (const [label, input, points = {}, expected = []] of refs) {
    const { p, rows, drift } = compare(label, input, 10);
    assert.equal(rows.size, 100, label);
    assert.deepEqual(drift, expected, label + ' exact range differences');
    for (const [year, value] of Object.entries(points)) assert.equal(net(rows.get(+year).next), value, label + '/' + year);
    if (label === '秦畅') {
      const decade = (start, luck) => Array.from({ length: 10 }, (_, i) => {
        const row = rows.get(start + i);
        assert.equal(row.luck, luck, label + '/' + (start + i));
        return row;
      });
      const ding = decade(2079, '丁巳').map(row => net(row.next));
      assert.deepEqual(ding, [-1.25, 6.5, -5.5, -1, -7.5, 0.75, 4.5, -4.25, -5.75, -0.25]);
      assert.equal(ding.reduce((a, b) => a + b, 0), -13.75);
      assert.equal(ding.filter(value => value > 0).length, 3);
      const bing = decade(2089, '丙辰');
      const values = bing.map(row => net(row.next));
      assert.equal(values.reduce((a, b) => a + b, 0), -5.75);
      assert.equal(values[4], 4);
      assert.equal(values[9], 2.5);
      checkQinRoute(after, p, bing.map(row => row.next));
    }
    console.log('PASS', label, '100 years,', drift.length, 'range differences');
  }

  let seed = 20261126;
  const rand = n => Math.floor((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) * n / 2 ** 32);
  for (let i = 1; i <= 120; i++) {
    compare('#' + i, [1940 + rand(85), 1 + rand(12), 1 + rand(28), rand(24), rand(60), i % 2 ? '男' : '女'], 2, true);
  }
  assert.equal(cohortYears, 2400);
  assert.deepEqual(changes, expectedChanges);
  assert(Object.values(zeros).every(count => count === 0), JSON.stringify(zeros));
  console.log('PASS 2,400 annual comparisons against ' + baseline, JSON.stringify(changes));
  console.log('PASS zero invariants', JSON.stringify(zeros));
}

if (require.main === module) run();
module.exports = { historicalYear };
