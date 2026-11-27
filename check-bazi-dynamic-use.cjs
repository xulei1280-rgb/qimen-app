// Compare the fixed Rule 1 cohort with the phase-one commit.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const { load } = require('./check-bazi-luck-state-change.cjs');

const baseline = 'bb71472e6a5ff4bc9283bacd5a80e14006975ce1';
const original = load();
const current = load();
const currentSource = fs.readFileSync(path.join(__dirname, 'bazi-engine.js'), 'utf8');
vm.runInContext(currentSource.replace('root.BaziEngine=api;', 'root.testRule1={context:buildTemporalPatternContext,compare:compareOutlookContexts};root.BaziEngine=api;'), current);
vm.runInContext(execFileSync('git', ['show', baseline + ':bazi-engine.js'], {
  cwd: __dirname, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024
}), original);

function profile(context, [year, month, day, hour, minute, gender], useTrueSolar = false) {
  return context.BaziEngine.createBaziProfile({
    input: { year, month, day, hour, minute }, gender, useTrueSolar, useDaylightSaving: false,
    location: useTrueSolar ? { name: '师宗', lng: 103.9936, lat: 24.8222 } :
      { name: '北京', lng: 116.4074, lat: 39.9042 }
  });
}

function decade(context, person, row, previousLuck, checkSingles = false) {
  const e = context.BaziEngine;
  const inputs = Array.from({ length: 10 }, (_, i) => {
    const year = row.startYear + i;
    const luckGz = i ? row.gz : previousLuck;
    return { year, gz: e.getFlowYearGZ(year), previous: luckGz ?
      { year: year - 1, gz: e.getFlowYearGZ(year - 1), luckGz } : null };
  });
  const batch = e.evaluateLuckOutlook(person, row.gz, previousLuck, inputs).years;
  if (checkSingles) {
    inputs.forEach((input, index) => {
      const single = e.evaluateLuckOutlook(person, row.gz, previousLuck, [input]).years[0];
      assert.deepEqual(single, batch[index], 'Single and batch differ in ' + input.year + ' ' + row.gz);
    });
  }
  return batch;
}

function years(context, person, count, singles = false) {
  const rows = context.getLuckData(person).rows.slice(0, count);
  return rows.flatMap((row, i) => decade(context, person, row, rows[i - 1]?.gz || null, singles)
    .map(year => ({ ...year, luck: row.gz })));
}

function entries(year) {
  return Array.from(year.actionLedger.filter(row => row.contribution > 0), row => ({
    rule: row.ruleId, task: row.taskId, side: row.side, weight: row.contribution,
    events: Array.from(row.ownedEventKeys || []).sort()
  })).sort((a, b) => b.weight - a.weight || JSON.stringify(a).localeCompare(JSON.stringify(b)));
}

function snapshot(year) {
  return {
    direction: year.effectiveRange.direction, pending: year.effectiveRange.pending,
    B: year.comprehensiveRange, W: year.wealthRange, total: year.effectiveRange,
    main: entries(year)
  };
}

function fixture(pillars) {
  const [year, month, day, hour] = pillars.split(' ');
  return { dayStem: day[0], pillars: { year, month, day, hour } };
}

function focus(context, pillars, luck, year) {
  const e = context.BaziEngine;
  return e.evaluateLuckOutlook(fixture(pillars), luck, null, [{ year, gz: e.getFlowYearGZ(year) }]).years[0];
}

function signedEntry(result, rule, side, task) {
  return entries(result).find(row => row.rule === rule && row.side === side && (!task || row.task === task));
}

// Concentration alone opens a check. Use exactly the same actors on both
// sides and place the candidate on only one side, so no action can be minted.
const thresholdChart = fixture('辛酉 丁酉 戊子 庚申');
const thresholdAnalysis = current.BaziEngine.analyzePattern(thresholdChart);
const thresholdBase = current.testRule1.context(thresholdChart.dayStem, thresholdChart.pillars, thresholdAnalysis);
const qx = { ruleId: 'ZP-QX-010' };
const below = { ...thresholdBase, elementPhenomena: [] };
const above = { ...thresholdBase, elementPhenomena: [qx] };
const threshold = current.testRule1.compare(below, above, thresholdAnalysis, true);
assert(threshold.review.dynamicUse.phenomena.some(row => row.ruleId === qx.ruleId && row.after && !row.before));
assert(!threshold.review.layerEvidence.flat().some(row => row.ruleId === 'Y3-dynamic-phenomenon'));

const phenomenonCases = [
  ['001', '己卯 丁丑 庚申 丙戌', '戊寅', 1948],
  ['002', '甲申 甲戌 丁未 癸卯', '乙亥', 1955],
  ['003', '甲戌 丁卯 戊戌 庚申', '丙寅', 2006],
  ['004', '庚戌 辛巳 癸丑 己未', '庚辰', 1981],
  ['005', '壬子 壬子 甲申 乙亥', '癸亥', 2032],
  ['006', '壬午 壬子 庚子 丁丑', '癸丑', 1959],
  ['007', '壬午 癸卯 癸卯 甲寅', '乙巳', 2017],
  ['008', '丙午 癸巳 甲申 壬申', '甲午', 1978],
  ['009', '乙未 壬午 丙辰 己亥', '甲申', 2038],
  ['010', '辛酉 丁酉 戊子 庚申', '辛酉', 2028]
];
for (const [suffix, pillars, luck, year] of phenomenonCases) {
  const result = focus(current, pillars, luck, year);
  const candidate = result.annual.review.dynamicUse.phenomena.find(row => row.ruleId === 'ZP-QX-' + suffix);
  assert(candidate?.adverse, 'Both the diagnosis and the verified adverse action must pass for QX-' + suffix);
  assert(signedEntry(result, 'Y3-dynamic-phenomenon', 'negative')?.events.length, 'Physical ledger action missing for QX-' + suffix);
}

const overload = focus(current, '辛酉 丁酉 癸巳 癸亥', '乙未', 1999);
assert(overload.annual.review.dynamicUse.capacity.overloaded);
assert(signedEntry(overload, 'Y4-output-load', 'negative', '承泄失守'));
const saturation = focus(current, '庚戌 丙戌 丙寅 丁酉', '乙酉', 1978);
assert(saturation.annual.review.dynamicUse.capacity.saturated);
assert(!signedEntry(saturation, 'Y5-role-root', 'positive', '喜用火可用根透'));
assert(!entries(saturation).some(x => x.side === 'negative' && /满溢/.test(x.task)));
const protectedPath = focus(current, '乙未 壬午 丙辰 己亥', '甲申', 2038);
assert(signedEntry(protectedPath, 'Y3-path-touch', 'positive', '正印/偏印制伤官'));
assert(signedEntry(protectedPath, 'Y3-dynamic-phenomenon', 'negative', '土多火晦'));
assert(signedEntry(protectedPath, 'Y5-role-action', 'negative', '金制喜用木'));
const restoredClimate = focus(current, '丁未 乙巳 辛未 丙申', '甲辰', 1968);
assert(restoredClimate.annual.review.dynamicUse.climate.some(x => x.excess === '火' && x.before && !x.after));
assert(!restoredClimate.annual.review.dynamicUse.climate.some(x => x.independentReversal));
assert(signedEntry(restoredClimate, 'Y6-natal-climate', 'positive', '次级调候·水实际缓解'));

const climateChart = fixture('丁未 乙巳 辛未 丙申');
const climateAnalysis = current.BaziEngine.analyzePattern(climateChart);
assert.equal(climateAnalysis.useful.layers.tiaohou.climateTier, 'primary');
const climateBase = current.testRule1.context(climateChart.dayStem, climateChart.pillars, climateAnalysis);
// Cross under the concentration gate with all counter actors unchanged.
const mildClimate = { ...climateBase, scores: { ...climateBase.scores, 火: 0 } };
const retired = current.testRule1.compare(climateBase, mildClimate, climateAnalysis, true);
assert(retired.review.dynamicUse.climate.some(x => x.excess === '火' && x.before && !x.after));
assert(retired.review.dynamicUse.retiredClimate, 'Primary climate retired even when no new counter actor enters');
assert(!retired.review.layerEvidence.flat().some(x => x.ruleId === 'Y6-natal-climate' && x.direction === 'positive'));

const repairProbes = [];
function reviewProbe(index, pillars, luck, year, verify) {
  const result = focus(current, pillars, luck, year);
  verify(result);
  repairProbes.push({ index, year, luck, result: snapshot(result) });
}
reviewProbe(6, '庚戌 丙戌 丙寅 丁酉', '乙酉', 1978, result => {
  assert(result.annual.review.dynamicUse.capacity.saturated);
  assert(!signedEntry(result, 'Y3-replacement-medicine', 'negative'));
  assert(!signedEntry(result, 'Y3-carry-support', 'negative'));
  assert.equal(signedEntry(result, 'Y6-natal-climate', 'negative', '次级调候·火形成偏枯')?.weight, 1);
  assert.equal(result.effectiveRange.guaranteed, -1);
});
for (const [index, pillars, luck, dates, disease] of [
  [62, '己丑 壬申 辛巳 壬辰', '癸酉', [1956, 1957, 1958, 1961, 1964, 1965], '水多金沉'],
  [105, '丙戌 辛卯 乙巳 丙子', '壬辰', [2022], '火多木焚']
]) {
  for (const year of dates) reviewProbe(index, pillars, luck, year, result => {
    assert.equal(signedEntry(result, 'Y3-dynamic-phenomenon', 'positive', disease)?.weight, 2);
    assert(!entries(result).some(row => /^Y4-output(?:-load)?$/.test(row.rule)));
  });
}
reviewProbe(120, '己亥 壬申 辛未 乙未', '甲戌', 1979, result => {
  const event = ['luck:戌藏辛:金', 'flowYear:未藏乙:木', '制'];
  assert(signedEntry(result, 'Y3-remedy-touch', 'positive')?.events.includes(JSON.stringify(['positive', ...event])));
  assert(!entries(result).some(row => row.rule === 'Y3-dynamic-core-harm' &&
    row.events.includes(JSON.stringify(['negative', ...event]))));
});

for (const [index, pillars, luck, dates, net] of [
  [55, '丙戌 辛丑 戊午 戊午', '癸卯', [2021, 2025, 2028, 2030], -2],
  [41, '戊午 甲寅 丁巳 壬寅', '丙辰', [1992], -1],
  [26, '壬辰 乙巳 己未 辛未', '甲辰', [1956], -1]
]) {
  for (const year of dates) reviewProbe(index, pillars, luck, year, result => {
    assert(result.annual.review.dynamicUse.capacity.overloaded);
    assert.equal(signedEntry(result, 'Y4-output', 'negative')?.weight, 2, 'Retain the lost outlet in #' + index);
    assert(!signedEntry(result, 'Y4-output', 'positive'));
    assert.equal(result.effectiveRange.guaranteed, net);
  });
}
reviewProbe(120, '己亥 壬申 辛未 乙未', '甲戌', 1984, result => {
  assert(signedEntry(result, 'Y3-path-touch', 'positive', '正印/偏印制伤官'));
  assert(!signedEntry(result, 'Y3-dynamic-core-harm', 'negative', '食伤受印'));
  assert(!signedEntry(result, 'Y5-role-root', 'negative', '喜用土可用根透'));
  assert(signedEntry(result, 'Y3-dynamic-core-harm', 'negative', '比劫分财'));
});
reviewProbe(44, '戊申 己未 庚寅 丁亥', '戊午', 1975, result => {
  assert(signedEntry(result, 'Y3-dynamic-phenomenon', 'negative', '土厚埋金'));
  assert(!signedEntry(result, 'Y3-dynamic-core-harm', 'negative', '财印相战'));
});
reviewProbe(62, '己丑 壬申 辛巳 壬辰', '甲戌', 1969, result => {
  assert(signedEntry(result, 'Y3-dynamic-phenomenon', 'positive', '水多金沉'));
  assert(!signedEntry(result, 'Y4-output', 'negative'));
});
reviewProbe(57, '丙申 壬辰 丙辰 丙申', '甲午', 1974, result => {
  const harm = signedEntry(result, 'Y3-dynamic-core-harm', 'negative', '食伤受印');
  assert(harm?.events.some(x => x.includes(':甲:木')));
  const support = result.actionLedger.filter(x => x.action.effect === 'daymaster-capacity' && x.side === 'positive' && x.contribution > 0);
  assert(support.some(x => x.physicalCauses.includes('gain:luck:午藏丁:火')));
  assert(!support.some(x => x.physicalCauses.some(cause => /(?:luck|flowYear):甲:木/.test(cause))));
  assert(result.annual.review.replacementMedicine.some(row => row.after.elements.some(x => x.element === '木' && x.effective === null)));
});

const specialPillars = '甲午 丙寅 癸未 乙卯';
for (const [year, mode] of [[1992, 'follow-qualified'], [2000, 'recheck-first-stage']]) {
  const after = focus(current, specialPillars, '戊申', year);
  assert.equal(after.annual.review.dynamicUse.special, mode);
  assert.equal(JSON.stringify(snapshot(after)), JSON.stringify(snapshot(focus(original, specialPillars, '戊申', year))));
}
console.log('PASS Rule 1 paired cases, all ten excess patterns, capacity, climate and special-pattern boundaries');

let seed = 20261126;
function rand(n) {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return Math.floor(seed * n / 2 ** 32);
}

const references = [
  ['老王', [1994, 7, 29, 10, 0, '女'], false, 2037],
  ['小蔓', [1998, 6, 23, 9, 30, '女'], true, 2024],
  ['香肠', [1993, 12, 13, 8, 5, '男'], true, 2024]
];
const referenceResults = references.map(([name, input, solar, target]) => {
  const list = years(current, profile(current, input, solar), 10, true);
  assert.equal(list.length, 100);
  const focus = list.find(y => y.year === target);
  const previous = years(original, profile(original, input, solar), 10).find(y => y.year === target);
  if (name === '小蔓') {
    assert(signedEntry(focus, 'Y3-earth-wood', 'positive'));
    assert(!signedEntry(focus, 'Y3-dynamic-core-harm', 'negative', '财印相战'));
    repairProbes.push({ name, year: target, luck: focus.luck, result: snapshot(focus) });
  }
  return { name, target, luck: focus.luck, before: snapshot(previous), after: snapshot(focus), verifiedSingles: list.length };
});
const sample = profile(current, references[0][1]);
const version = current.BaziEngine.evaluateLuckOutlook(sample, '丁卯', null, []).ruleVersion;
const wang = referenceResults[0].after;
assert.equal(wang.total.guaranteed, 0, '老王 2037 净零');
assert.deepEqual(wang.main.map(x => [x.rule, x.side, x.weight]), [
  ['Y3-replacement-medicine', 'positive', 2],
  ['Y5-role-action', 'negative', 1],
  ['Y6-natal-climate', 'negative', 1]
]);

const stats = {
  years: 0, directionsBefore: {}, directionsAfter: {}, transitions: {},
  flips: 0, pendingEntered: 0, pendingCleared: 0, changedLedger: 0,
  changedWealth: 0, changedSpecial: 0, outputDoubleBooked: 0, sameEventCoreConflict: 0
};
const rows = [];
const exemplars = {};
const count = (obj, key) => { obj[key] = (obj[key] || 0) + 1; };
for (let index = 0; index < 120; index++) {
  const input = [1940 + rand(85), 1 + rand(12), 1 + rand(28), rand(24), rand(60), index % 2 ? '女' : '男'];
  const person = profile(current, input);
  const next = years(current, person, 2);
  const prior = years(original, profile(original, input), 2);
  assert.equal(next.length, 20);
  next.forEach((row, i) => {
    const old = prior[i];
    assert.equal(row.year, old.year);
    assert.equal(row.luck, old.luck);
    const before = snapshot(old), after = snapshot(row);
    const review = row.annual.review.dynamicUse;
    const changedLedger = JSON.stringify(before.main) !== JSON.stringify(after.main);
    const changedWealth = JSON.stringify(before.W) !== JSON.stringify(after.W);
    const outputExcess = after.main.some(x => x.rule === 'Y3-dynamic-phenomenon' &&
      /^(水多金沉|木盛水缩|火多木焚|土多火晦|金多土变)$/.test(x.task));
    if (outputExcess && after.main.some(x => /^Y4-output(?:-load)?$/.test(x.rule))) stats.outputDoubleBooked++;
    const positiveEvents = new Set(after.main.filter(x => x.side === 'positive').flatMap(x => x.events));
    if (after.main.some(x => x.rule === 'Y3-dynamic-core-harm' && x.events.some(event =>
      positiveEvents.has(JSON.stringify(['positive', ...JSON.parse(event).slice(1)]))))) stats.sameEventCoreConflict++;
    stats.years++;
    count(stats.directionsBefore, before.direction);
    count(stats.directionsAfter, after.direction);
    count(stats.transitions, before.direction + ' → ' + after.direction);
    if ((before.direction === 'positive' && after.direction === 'negative') ||
        (before.direction === 'negative' && after.direction === 'positive')) stats.flips++;
    if (!before.pending && after.pending) stats.pendingEntered++;
    if (before.pending && !after.pending) stats.pendingCleared++;
    if (changedLedger) stats.changedLedger++;
    if (changedWealth) stats.changedWealth++;
    if (review?.special && JSON.stringify(before) !== JSON.stringify(after)) stats.changedSpecial++;
    const record = { index: index + 1, input, pillars: Object.values(person.pillars), year: row.year, luck: row.luck, before, after };
    rows.push(record);
    for (const p of review?.phenomena || []) {
      if (p.adverse || p.relief) exemplars[p.ruleId] ??= { index: index + 1, year: row.year };
    }
    for (const key of ['saturated', 'overloaded']) {
      if (review?.capacity?.[key]) exemplars[key] ??= { index: index + 1, year: row.year };
    }
    if (review?.stoppedSupport?.length) exemplars.stoppedSupport ??= { index: index + 1, year: row.year };
    if (review?.special) exemplars[review.special] ??= { index: index + 1, year: row.year };
  });
}
assert.equal(stats.years, 2400);
assert.equal(stats.changedWealth, 0, 'Rule 1 must preserve the separate wealth range');
assert.equal(stats.changedSpecial, 0, 'Rule 1 must preserve phase-one decisions for true special patterns');
assert.equal(stats.outputDoubleBooked, 0, 'Output excess owns its axis for the year');
assert.equal(stats.sameEventCoreConflict, 0, 'A single action must not be both a remedy and core harm');
const target = path.join(__dirname, 'build', 'luck-rule1-20261128.3');
fs.mkdirSync(target, { recursive: true });
fs.writeFileSync(path.join(target, 'annual-comparison.json'), JSON.stringify({
  baseline, version, seed: 20261126, stats, exemplars, repairProbes, references: referenceResults, rows
}));
console.log(JSON.stringify({ stats, repairProbes: repairProbes.length, exemplars, references: referenceResults.map(x => ({
  name: x.name, target: x.target, luck: x.luck, net: x.after.total.guaranteed, singles: x.verifiedSingles
})) }, null, 2));
