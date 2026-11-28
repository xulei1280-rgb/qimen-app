const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const { historicalYear } = require('./check-bazi-luck-calibration1.cjs');

const baseline = '87ed85d';
const previousVersion = 'luck-outlook-20261128.6';
const version = 'luck-outlook-20261128.9';
const root = __dirname;
const read = filename => fs.readFileSync(path.join(root, filename), 'utf8');
const source = read('bazi-engine.js');
const baselineSource = execFileSync('git', ['show', baseline + ':bazi-engine.js'], {
  cwd: root, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024
});
const audit = 'annualFakeFollowQualification,annualFollowType,annualFollowMerge,annualCoreQualification,' +
  'buildTemporalPatternContext,annualFollowState,annualFollowActions,settleAnnualLedger,annualRule5Enabled';
const showScenarios = 'actionLedger:rows,wealthRange:W,comprehensiveRange:B';
function load(code, auditNames) {
  const node = () => ({ value: '', checked: false, disabled: false, textContent: '', innerHTML: '', hidden: false,
    classList: { toggle() {}, add() {}, remove() {} }, style: {}, focus() {} });
  const context = vm.createContext({ BirthTime: require('./birth-time.js'),
    document: { addEventListener() {}, getElementById: node, querySelector: () => ({ value: '男' }), querySelectorAll: () => [] },
    localStorage: { getItem: () => null, setItem() {} } });
  for (const filename of ['qimen.js', 'china-locations.js', 'bazi-shensha.js']) vm.runInContext(read(filename), context);
  assert(code.includes(showScenarios), 'Annual ledger inspection seam');
  code = code.replace(showScenarios, 'auditLedgers:contexts.map(function(x){return x.result.ledger;}),' + showScenarios);
  if (auditNames) code = code.replace('root.BaziEngine=api;', 'root.rule4={' + auditNames + '};root.BaziEngine=api;');
  vm.runInContext(code, context);
  for (const script of read('bazi.html').matchAll(/<script>([\s\S]*?)<\/script>/g)) vm.runInContext(script[1], context);
  return context;
}
const before = load(baselineSource);
const after = load(source, audit);
const batch1Reference = historicalYear(source => load(source).BaziEngine);
const E = after.BaziEngine;
const rule = after.rule4;
assert(rule);
const json = item => JSON.stringify(item);
const plain = item => JSON.parse(json(item));
const same = (a, b, message) => assert.equal(json(a), json(b), message);
const frozen = (a, b) => json(a)?.replaceAll(version, previousVersion) === json(b);
const pillars = '[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]';
assert(!new RegExp("['\"]" + pillars + '(?:[ ,/|·]*' + pillars + '){5}' + "['\"]").test(source),
  'Production must contain no six-pillar fixture strings');
assert(!/\b(?:cohortIndex|fakeFollowLocks|birthDateLock)\b/i.test(source));
assert(read('bazi.html').includes('bazi-engine.js?v=luck-20261128.9'));

function profile(context, [year, month, day, hour, minute, gender], solar) {
  return context.BaziEngine.createBaziProfile({ input: { year, month, day, hour, minute }, gender,
    useTrueSolar: solar, useDaylightSaving: false, location: solar ? { name: '师宗', lng: 103.9936, lat: 24.8222 } :
      { name: '北京', lng: 116.4074, lat: 39.9042 } });
}
function qualification(data) {
  const analysis = E.analyzePattern(data);
  const base = rule.buildTemporalPatternContext(data.pillars.day[0], data.pillars, analysis);
  return { base, analysis, evidence: rule.annualFakeFollowQualification(base, analysis, true) };
}
const groups = {};
let natal = 0;
E.forEachLegalFourPillar((pillars, meta) => {
  if (meta.yearIndex < 2 || meta.dayIndex < 30 || meta.hourIndex !== meta.dayIndex % 4) return;
  const { analysis, evidence } = qualification({ pillars });
  same(analysis, before.BaziEngine.analyzePattern({ pillars }), meta.key);
  if (evidence.type) groups[evidence.type] = (groups[evidence.type] || 0) + 1;
  natal++;
}, { yearCycleCount: 4, monthBranchCount: 12, dayCycleCount: 60, hourBranchCount: 4, validateUnique: false });
assert.equal(natal, 720);
assert.deepEqual(groups, { 假从儿: 19, 假从财: 5, 假从杀: 3 });

const stats = Object.fromEntries([
  'nonFakeFollowDrift', 'fakeFollowLeakA', 'abSummedError', 'missingSwallowed', 'w0Mismatch',
  'unsignedKeyDup', 'sameEventSignFlip', 'swallowedHighTier', 'erasedPositiveTomb', 'noNewEventDrift',
  'changedSpecial', 'outputDoubleBooked', 'sameEventCoreConflict', 'erasedY4', 'satNeg'
].map(name => [name, 0]));
const issues = [];
function count(name, fails, label) {
  if (!fails) return;
  stats[name]++;
  if (issues.length < 100) issues.push({ name, label });
}
const unsigned = key => json(JSON.parse(key).slice(1));
const amounts = (rows, axis) => rows.reduce((sum, row) => sum +
  (row.side === 'negative' ? -1 : 1) * row[axis], 0);
const highTier = row => /^(Y[234]-|W-|LK-)/.test(row.ruleId) && Math.max(row.contribution, row.wealthContribution) >= 2;
const sameRow = (a,b) => a.ruleId === b.ruleId && a.taskId === b.taskId && a.side === b.side && a.text === b.text;
const outputExcess = /^(水多金沉|木盛水缩|火多木焚|土多火晦|金多土变)$/;
function positiveTombs(ledger) {
  return ledger.flatMap(row => (row.tomb?.parts || []).filter(p => p.value > 0).map(p => p.key));
}
function checkLedger(ledger, branch, review, label) {
  const booked = ledger.filter(row => row.contribution > 0);
  for (const row of booked) {
    const keys = row.ownedEventKeys.map(unsigned);
    if (branch === 'B' || row.action.effect === 'recurrence') {
      const duplicates = booked.filter(other => other !== row && other.ownedEventKeys.some(k => keys.includes(unsigned(k))));
      count('unsignedKeyDup', new Set(keys).size !== keys.length || duplicates.length > 0, label);
      count('sameEventSignFlip', duplicates.some(other => other.side !== row.side), label);
    }
    if (branch === 'B') assert([1, 2, 3].includes(row.contribution), label + ' B discrete tier');
    assert(!/^T-year-(fight|clash|harmony|dayhit)$/.test(row.ruleId), label + ' hints only');
  }
  const positive = new Set(booked.filter(row => row.side === 'positive').flatMap(row => row.ownedEventKeys.map(unsigned)));
  count('outputDoubleBooked', booked.some(row => row.ruleId === 'Y3-dynamic-phenomenon' && outputExcess.test(row.taskId)) &&
    booked.some(row => /^Y4-output(?:-load)?$/.test(row.ruleId)), label);
  count('sameEventCoreConflict', booked.some(row => row.ruleId === 'Y3-dynamic-core-harm' &&
    row.ownedEventKeys.some(key => positive.has(unsigned(key)))), label);
  count('satNeg', review?.dynamicUse?.capacity?.saturated && booked.some(row => row.side === 'negative' &&
    (row.ruleId === 'Y3-carry-support' || row.ruleId === 'Y3-replacement-medicine' && /^承载不足/.test(row.taskId) ||
      /满溢/.test(row.taskId))), label);
}
function inspect(old, next, historical, zero, q, label) {
  count('w0Mismatch', !frozen(zero.effectiveRange, next.comprehensiveRange), label);
  const active = !!q.evidence.type;
  if (!active) {
    const enabled=rule.annualRule5Enabled(q.base,q.analysis,q.evidence)&&!['#5/2039','#5/2049'].includes(label);
    count('nonFakeFollowDrift', !enabled&&!frozen(historical, old), label);
    count('changedSpecial', q.analysis.specialPatternQualification && !frozen(next, old), label);
    count('noNewEventDrift', !enabled&&!old.recurrence?.scenes?.length && !frozen(historical, old), label);
  } else {
    assert.equal(next.fakeFollow.type, q.evidence.type, label);
    const { byBranch, missingB, missingW, selectedBranch, selectedIndex } = next.wealthMerge;
    assert(byBranch.A && byBranch.B);
    assert(next.annual.label.includes(selectedBranch + ' 路'));
    const displayNotes = next.effectiveRange.pending ? next.annual.uncertainty : after.outlookDisplayView(next.annual).unresolvedNotes;
    assert(displayNotes.some(note => note.includes(selectedBranch + ' 路')), label + ' branch in displayed evidence');
    const html = after.renderOutlookBox('流年', next.annual);
    if (next.effectiveRange.pending) {
      assert(html.includes('data-standard-copy>待判</div>'), label + ' pending label');
      assert.match(html, /整体待判原因：<\/b>[^<]*[AB] 路/, label + ' pending reason and branch');
      if (next.wealthMerge.abDivergence) {
        assert.match(html, /整体待判原因：<\/b>[^<]*A 路[^<]*B 路/, label + ' both branches in pending reason');
      }
      const knownRisk = next.annual.evidence.some(e => e.direction === 'negative' && /^T-year-(same|clash|tkdc)$/.test(e.ruleId));
      if (!knownRisk) assert(html.includes('查看所选情景账本依据'), label + ' selected ledger disclosure');
    } else {
      assert(html.includes('data-branch-basis><b>情景归属：</b>' + after.esc(next.annual.basis) + '</p>'),
        label + ' settled branch attribution');
      assert(after.outlookDisplayView(next.annual).professionalLabel.includes(next.annual.basis.split('｜')[0]),
        label + ' professional branch label');
    }
    same(next.actionLedger, next.scenarios[selectedIndex].ledger, label + ' displayed scenario ledger');
    const effective = next.scenarios.filter(s => !s.missingB).map(s => s.B + (missingW.length ? 0 : 0.25 * s.W));
    if (effective.length && !missingB.length) {
      count('abSummedError', next.effectiveRange.min !== Math.min(...effective) ||
        next.effectiveRange.max !== Math.max(...effective), label);
    }
    count('missingSwallowed', missingB.length && (!next.effectiveRange.pending || !zero.effectiveRange.pending ||
      next.effectiveRange.reason !== 'missing-evidence' || zero.effectiveRange.reason !== 'missing-evidence') ||
      missingW.length && (!next.wealthMerge.wealthSkipped || !frozen(next.effectiveRange, next.comprehensiveRange) ||
        missingW.some(branch => !next.wealth.uncertainty.some(note => note.includes(branch + ' 路')))), label);
    for (const s of next.scenarios) {
      assert.equal(s.ledger.every(row => row.branch === s.branch), true, label + ' ledger attribution');
      assert.equal(s.missingB, s.evidenceMissing.B);
      assert.equal(s.missingW, s.evidenceMissing.W);
      count('abSummedError', amounts(s.ledger, 'contribution') !== s.B || amounts(s.ledger, 'wealthContribution') !== s.W, label);
      if (s.branch === 'B') {
        assert(next.scenarios.some(a => a.branch === 'A' && json(a.retainedRoots) === json(s.retainedRoots)), label + ' identical root assumption');
      } else {
        const forbidden = { 假从儿: '从儿格', 假从财: '从财格', 假从杀: '从杀格', 假从势: '从(?:财|杀|势)格' }[q.evidence.type];
        count('fakeFollowLeakA', s.ledger.some(row => row.contribution > 0 && row.coreGate &&
          new RegExp('从格：' + forbidden).test(row.coreGate.name)), label);
        const original = old.scenarios.find(x => json(x.retainedRoots) === json(s.retainedRoots) &&
          json(x.replacementStates) === json(s.replacementStates));
        if (original) {
          const prior = old.auditLedgers[original.id], ledger = s.ledger;
          for (const row of prior.filter(highTier)) {
            if (row.coreGate && new RegExp('从格：' + forbidden).test(row.coreGate.name)) continue;
            const lost = !ledger.some(next => sameRow(row, next) && next.contribution >= row.contribution &&
              next.wealthContribution >= row.wealthContribution);
            count('swallowedHighTier', lost, label + ' ' + row.ruleId + ' ' + row.taskId);
            count('erasedY4', lost && /^Y4-output/.test(row.ruleId), label);
          }
          count('erasedPositiveTomb', positiveTombs(prior).some(key =>
            !positiveTombs(ledger).some(next => json(next) === json(key))), label);
        }
      }
    }
  }
  for (const [index, ledger] of next.auditLedgers.entries()) {
    checkLedger(ledger, next.scenarios[index].branch, next.annual.review, label);
  }
}
function summary(row) {
  return { B: row.comprehensiveRange, W: row.wealthRange, effective: row.effectiveRange,
    pendingReason: row.effectiveRange.pending ? row.effectiveRange.reason : null, merge: row.wealthMerge,
    scenarios: row.scenarios, selectedLedger: row.fakeFollow ? row.actionLedger : undefined };
}
function compare(input, decades, label, solar = false, singles = false) {
  const p = profile(after, input, solar), old = profile(before, input, solar);
  same(p, old, label + ' profile');
  const q = qualification(p);
  const cycles = after.getLuckData(p).rows.slice(0, decades);
  same(cycles, before.getLuckData(old).rows.slice(0, decades), label + ' cycles');
  const rows = cycles.flatMap((cycle, i) => {
    const preceding = cycles[i - 1]?.gz || null;
    const years = Array.from({ length: 10 }, (_, j) => {
      const year = cycle.startYear + j, prior = j ? cycle.gz : preceding;
      return { year, gz: E.getFlowYearGZ(year), previous: prior && { year: year - 1, gz: E.getFlowYearGZ(year - 1), luckGz: prior } };
    });
    const a = before.BaziEngine.evaluateLuckOutlook(old, cycle.gz, preceding, years);
    const b = E.evaluateLuckOutlook(p, cycle.gz, preceding, years);
    const zero = E.evaluateLuckOutlook(p, cycle.gz, preceding, years, { wealthExtraWeight: 0 });
    assert.equal(b.ruleVersion, version);
    for (const field of ['natal', 'previous', 'wealth']) assert(frozen(b[field], a[field]), label + ' four/five-pillar ' + field);
    return b.years.map((row, j) => {
      if (singles) same(row, E.evaluateLuckOutlook(p, cycle.gz, preceding, [years[j]]).years[0], label + ' single/batch ' + row.year);
      for (const field of ['increment', 'previousYear']) assert(frozen(row[field], a.years[j][field]), label + ' ' + field);
      const key = label + '/' + row.year;
      const historical = batch1Reference(key, row, p, cycle.gz, preceding, years[j]);
      inspect(a.years[j], row, historical, zero.years[j], q, key);
      return { year: row.year, gz: row.gz, luck: cycle.gz, before: summary(a.years[j]), after: summary(row), w0: zero.years[j].effectiveRange };
    });
  });
  return { input, pillars: p.pillars, qualification: q.evidence, rows };
}

const references = [
  ['老王', [1994,7,29,10,0,'女'], false],
  ['小蔓', [1998,6,23,9,30,'女'], true],
  ['香肠', [1993,12,13,8,5,'男'], true]
].map(([name, input, solar]) => ({ name, ...compare(input, 10, name, solar, true) }));
assert(references.every(ref => ref.rows.length === 100 && ref.qualification.status === '排除'));

let seed = 20261126;
const rand = n => Math.floor((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) * n / 2 ** 32);
const charts = Array.from({ length: 120 }, (_, i) => {
  const index = i + 1;
  const input = [1940 + rand(85), 1 + rand(12), 1 + rand(28), rand(24), rand(60), i % 2 ? '女' : '男'];
  return { index, ...compare(input, 2, '#' + index) };
});
assert.equal(charts.reduce((n, chart) => n + chart.rows.length, 0), 2400);
const byType = Object.fromEntries(['假从财', '假从势', '假从儿', '假从杀'].map(type =>
  [type, charts.filter(chart => chart.qualification.type === type).map(chart => chart.index)]));
assert.deepEqual(byType, { 假从财: [9,89], 假从势: [53], 假从儿: [73], 假从杀: [] });
const sample = index => charts[index - 1];
const at = (index, year) => {
  const row = sample(index).rows.find(row => row.year === year);
  assert(row, '#' + index + '/' + year);
  return row;
};
const excludes = (index, id) => sample(index).qualification.checks.some(check => check.id === id && !check.met);
assert(excludes(13, 'no-fake-dominant-or-transform') && excludes(54, 'unassisted-command') && excludes(116, 'no-true-special'));
for (const index of [21,96]) assert(!sample(index).qualification.subtypes.假从儿 && sample(index).qualification.axes.wealth.share < 0.06);
for (const index of [23,81,91,105,111,119]) assert(['unassisted-month', 'root-power'].some(id => excludes(index, id)));
assert.equal(sample(116).rows.length, 20);
same(rule.annualFollowType(['假从儿', '假从财']), { status: '资格未决', type: null, candidates: ['假从儿','假从财'] }, 'Mutually exclusive types');
same(rule.annualFollowType(['假从财', '假从儿']), { status: '资格未决', type: null, candidates: ['假从财','假从儿'] }, 'Overlap is order independent');
for (const index of [9,53,73,89]) {
  const q = qualification(profile(after, sample(index).input, false));
  const state = rule.annualFollowState(q.base, q.evidence.type);
  const background = rule.annualFollowActions(state, state, state, { recurrence: null });
  count('noNewEventDrift', background.extra.length || background.wealth.entries.length, '#' + index + ' natal B');
}
const merge = (bases, wealth, weight, flags = []) => rule.annualFollowMerge(bases.map((B, i) => ({
  branch: i === bases.length - 1 ? 'B' : 'A', B, W: Array.isArray(wealth) ? wealth[i] : wealth,
  missingB: flags[i] === 'B', missingW: flags[i] === 'W'
})), weight);
const signChange = [merge([1,2], -16, 0), merge([1,2], -16, 0.25)];
same(signChange.map(x => x.combinedRange.guaranteed), [1,-2], 'Weight switch changes sign and both settle');
const weightedPending = [merge([2,4], -12, 0), merge([2,4], -12, 0.25)];
assert.equal(weightedPending[0].combinedRange.guaranteed, 2);
same([weightedPending[1].combinedRange.min, weightedPending[1].combinedRange.max, weightedPending[1].combinedRange.reason],
  [-1,1,'reversal-risk'], 'Weight induces cross-zero');
const weightedSettled = [merge([2,-1], 8, 0), merge([2,-1], 8, 0.25)];
assert(weightedSettled[0].combinedRange.pending && weightedSettled[0].abDivergence);
assert.equal(weightedSettled[1].combinedRange.guaranteed, 1);
const missing = [0, 0.25].map(weight => merge([2,0], 8, weight, [null,'B']));
for (const item of missing) {
  assert(item.combinedRange.pending && item.combinedRange.reason === 'missing-evidence');
  same(item.missingB, ['B'], 'Missing B attribution');
  same(item.scenarioTotals, [2,null], 'Unknown scenario has no numeric placeholder');
}
const missingWealth = merge([2,4], -12, 0.25, ['W']);
assert(missingWealth.wealthSkipped && missingWealth.combinedRange.guaranteed === 2);
same(missingWealth.missingW, ['A'], 'Missing W attribution');
assert(missingWealth.reasons.some(note => note.includes('A 路') && note.includes('缺 W')));
const sameSide = [[0,2], [-2,0]].map(B => merge(B, 0, 0.25));
assert(sameSide.every(x => x.combinedRange.guaranteed === 0 && !x.combinedRange.pending));
const bothReasons = merge([-1,2,1], 0, 0.25);
assert(bothReasons.abDivergence && bothReasons.internalCrossZero.includes('A') && bothReasons.reasons.length === 2);

const crossZero = [at(89,1980), at(89,1981), at(73,2021)];
assert(crossZero.every(r => r.after.merge.abDivergence && r.after.effective.pending));
const branchB = row => row.after.scenarios.filter(s => s.branch === 'B');
const booked = (scenario, task) => scenario.ledger.some(row => row.taskId === task && row.contribution > 0);
const assertStrictPending = row => {
  assert.equal(row.after.merge.abDivergence, true);
  assert.equal(row.after.effective.pending, true);
  assert(row.after.effective.min < 0 && row.after.effective.max > 0);
};
const sealCounterexample = at(73,2020);
assert(branchB(sealCounterexample).some(s => booked(s, '实印转助日主') && booked(s, '助起微根')));
assertStrictPending(sealCounterexample);
const clashSurviving = at(9,1975);
assert(branchB(clashSurviving).some(s => booked(s, '助起微根')));
assertStrictPending(clashSurviving);
for (const year of [1981,1984]) {
  const opposed = at(9,year);
  assert.equal(opposed.after.effective.pending, true);
  assert.equal(opposed.after.effective.reason, 'reversal-risk');
  assert(branchB(opposed).every(s => !booked(s, '助起微根')));
}
const outnumbered = at(89,1968);
assert(branchB(outnumbered).every(s => !booked(s, '助起微根')));
assert(branchB(outnumbered).some(s => s.rootChanges.some(root => root.actor.startsWith('flowYear:申') &&
  root.attacks.includes('冲') && !root.booked)), '寅党多胜，申受冲');
const sameDirection = at(73,2010);
assert(sameDirection.after.effective.guaranteed > 0);
const residual = at(53,1969);
assert(residual.after.scenarios.some(s => s.branch === 'B' &&
  s.rootChanges.some(root => root.before === 0.22 && root.after === 0.11 && !root.booked)));
const raised = at(53,1972);
assert(raised.after.scenarios.some(s => s.branch === 'B' && s.ledger.some(row => row.taskId === '助起微根' && row.side === 'negative' && row.contribution)));
const rootChart = profile(after, sample(9).input, false);
const rootYear = 2037;
const removed = E.evaluateLuckOutlook(rootChart, '辛酉', null, [{ year: rootYear, gz: E.getFlowYearGZ(rootYear) }]).years[0];
assert(removed.scenarios.some(s => s.branch === 'B' && s.rootChanges.some(root => root.before === 0.28 && root.after === 0 && root.booked) &&
  s.ledger.some(row => row.taskId === '去假成真' && row.contribution)));
const tomb = at(53,1973);
const tombParts = (branch) => tomb.after.scenarios.filter(s => s.branch === branch)
  .flatMap(s => s.ledger.flatMap(row => row.tomb?.parts || []));
const opposite = tombParts('A').find(a => a.value < 0 && tombParts('B').some(b => json(a.key) === json(b.key) && b.value > 0));
assert(opposite);
same(opposite.physical, tombParts('B').find(b => json(b.key) === json(opposite.key)).physical, 'One physical fact, opposing interpretations');
const child = profile(after, sample(73).input, false), childAnalysis = E.analyzePattern(child);
const fallback = [2004,2017].map(year => {
  const row = at(73,year);
  const context = rule.buildTemporalPatternContext(child.dayStem,
    { ...child.pillars, luck: row.luck, flowYear: row.gz }, childAnalysis, { outlookFlowYear: true });
  const raw = rule.annualCoreQualification(context);
  const filtered = rule.annualCoreQualification({ ...context, annualFollowRegular: ['从儿格'] });
  assert.equal(raw?.name, '从格：从儿格');
  assert.equal(filtered, null, 'Regular evidence determines whether the gate remains closed');
  assert(row.after.scenarios.filter(s => s.branch === 'A').every(s =>
    !s.ledger.some(row => row.coreGate?.name === '从格：从儿格' && row.contribution)));
  // Valid regular qualification must still be reached after the temporary hit.
  const regular = { ...context, strictFormation: true,
    structures: [{ role: '主格', ruleId: 'regular-probe', name: '常格测试' }],
    interactionFlow: { steps: [] }, carryingCapacity: { strictFormationEligible: true },
    regularPattern: { checks: [{ type: '成格', active: true }] },
    annualFollowRegular: ['从儿格'] };
  assert.equal(rule.annualCoreQualification(regular)?.id, 'regular-probe');
  return { year, raw: raw.name, regular: context.rawMainPattern, filtered, checkedFallback: 'regular-probe' };
});

const target = path.join(root, 'build', 'luck-rule4-20261128');
fs.mkdirSync(target, { recursive: true });
const probes = { signChange, weightedPending, weightedSettled, missing, missingWealth, sameSide, bothReasons,
  sameDirection, crossZero, sealCounterexample, residual, raised, removed: summary(removed), tomb, fallback };
fs.writeFileSync(path.join(target, 'annual-comparison.json'), json({
  version, baseline, seed: 20261126, natal, natalTypes: groups, byType, qualifiedYears: 80, stats, issues,
  references, charts, probes
}));
console.log(json({ natal, groups, byType, years: 2400, stats, issues }));
for (const [name, value] of Object.entries(stats)) assert.equal(value, 0, name);
console.log('PASS 2,400 annual comparisons, 720 exact natal comparisons, 300 single/batch years, 20 true-special years and fixed probes');
