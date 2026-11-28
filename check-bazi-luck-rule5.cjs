const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');

const root = __dirname;
const baseline = 'e978a57';
const oldVersion = 'luck-outlook-20261128.7';
const version = 'luck-outlook-20261128.8';
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const json = JSON.stringify;
const same = (actual, expected, label) => assert.equal(json(actual), json(expected), label);
const frozen = (actual, expected) => json(actual)?.replaceAll(version, oldVersion) === json(expected);
const auditNames = 'annualFakeFollowQualification,buildTemporalPatternContext,compareOutlookContexts,' +
  'annualWealthActions,wealthChannelState,annualCoreQualification,settleAnnualLedger';
function load(source, current) {
  const context = vm.createContext({ BirthTime: require('./birth-time.js') });
  for (const file of ['qimen.js', 'china-locations.js', 'bazi-shensha.js']) vm.runInContext(read(file), context);
  const inject = (seam, replacement) => {
    assert(source.includes(seam), 'Audit seam ' + seam);
    source = source.replace(seam, replacement);
  };
  inject('root.BaziEngine=api;', 'root.audit={' + auditNames + (current ? ',annualRule5Enabled,annualRule5Paths,annualRule5Changes' : '') + '};root.BaziEngine=api;');
  inject('if(e.tomb)row.tomb=e.tomb;', 'auditW.set(row,wealthKeys.filter(function(k,i){return i===wealthKeys.indexOf(k)&&!priorWealthKeys.has(k);}));if(e.tomb)row.tomb=e.tomb;');
  inject('wealthKeys.forEach(function(k){wealthOwners.add(k);});',
    'var priorWealthKeys=new Set(wealthKeys.filter(function(k){return wealthOwners.has(k);}));wealthKeys.forEach(function(k){wealthOwners.add(k);});');
  inject('function settleAnnualLedger(annual,wealth,extra,current,options){',
    'var auditW=new WeakMap();function settleAnnualLedger(annual,wealth,extra,current,options){');
  inject('actionLedger:rows,wealthRange:W,comprehensiveRange:B', 'auditScenarios:contexts.map(function(x){return {' +
    'outputReady:x.context.wealthChannel?.outputReady,ledger:x.result.ledger,wealthKeys:x.result.ledger.map(function(row){return auditW.get(row)||[];})};}),' +
    'actionLedger:rows,wealthRange:W,comprehensiveRange:B');
  vm.runInContext(source, context);
  return { E: context.BaziEngine, ...context.audit };
}
const original = execFileSync('git', ['show', baseline + ':bazi-engine.js'], {
  cwd: root, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024
});
const source = read('bazi-engine.js');
const before = load(original, false), after = load(source, true), E = after.E;
const ganzhi = Array.from({ length: 60 }, (_, i) => '甲乙丙丁戊己庚辛壬癸'[i % 10] + '子丑寅卯辰巳午未申酉戌亥'[i % 12]);
const production = source.replace(original, '');
assert(!/\b(?:cohortIndex|fakeFollowLocks|birthDateLock)\b/i.test(production));
const pillar = '[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]';
assert(!new RegExp("['\"]" + pillar + "(?:[ ,/|·]*" + pillar + "){5}['\"]").test(production));
assert(read('bazi.html').includes('<script src="bazi-engine.js?v=luck-20261128.8"></script>'));

function profile(engine, [year, month, day, hour, minute, gender], solar) {
  return engine.createBaziProfile({ input: { year, month, day, hour, minute }, gender, useTrueSolar: solar,
    useDaylightSaving: false, location: solar ? { name: '师宗', lng: 103.9936, lat: 24.8222 } : { name: '北京', lng: 116.4074, lat: 39.9042 } });
}
function cycles(e, p, decades) {
  const start = e.luckStartInfo(p).startYear, direction = e.luckDirection(p);
  const month = ganzhi.indexOf(p.pillars.month);
  return Array.from({ length: decades }, (_, i) => {
    const luck = ganzhi[(month + direction * (i + 1) + 60) % 60];
    const prior = i ? ganzhi[(month + direction * i + 60) % 60] : null;
    return { luck, prior, years: Array.from({ length: 10 }, (_, j) => {
      const year = start + i * 10 + j, previousLuck = j ? luck : prior;
      return { year, gz: e.getFlowYearGZ(year), previous: previousLuck && {
        year: year - 1, gz: e.getFlowYearGZ(year - 1), luckGz: previousLuck
      } };
    }) };
  });
}
function contextFor(engine, p) {
  const analysis = engine.E.analyzePattern(p);
  const base = engine.buildTemporalPatternContext(p.pillars.day[0], p.pillars, analysis);
  const qualification = engine.annualFakeFollowQualification(base, analysis);
  return { analysis, base, qualification, family: base.regularPattern.authority.key };
}

const zeros = Object.fromEntries(['newUnsignedKeyDup', 'newSameEventSignFlip', 'noNewEventDrift',
  'sameEventCoreConflict', 'outputDoubleBooked', 'erasedY4', 'satNeg', 'swallowedHighTier',
  'erasedPositiveTomb', 'scenarioAssumptions', 'w0Mismatch', 'frozenDrift'].map(name => [name, 0]));
const issues = {};
function count(name, failure, label) {
  if (!failure) return;
  zeros[name]++;
  const items = issues[name] ||= [];
  if (items.length < 30) items.push(label);
}
const frozenCounts = { natal: 0, fourFive: 0, increment: 0, previousYear: 0, nonTarget: 0, fakeFollow: 0,
  trueFollow: 0, xiaomanAndSausage: 0, wang: 0, wangDiagnostic: 0, temporaryFollow: 0, sameContext: 0 };
const oldDuplicates = { scenarios: 0, groups: 0, years: 0, wealthGroups: 0 };
const scenarioKey = s => json([s.branch || 'A', s.retainedRoots, s.replacementStates]);
const event = key => {
  const parts = JSON.parse(key);
  return ['positive', 'negative'].includes(parts[0]) ? json(parts.slice(1)) : json(parts);
};
const ownerId = row => json([row.ruleId, row.taskId, row.side, row.contribution, row.wealthContribution]);
const excess = /^(水多金沉|木盛水缩|火多木焚|土多火晦|金多土变)$/;
function ownership(scene, axis) {
  const owners = new Map();
  scene.ledger.forEach((row, index) => {
    if (!row[axis]) return;
    const keys = axis === 'contribution' ? row.ownedEventKeys : scene.wealthKeys[index];
    keys.forEach(k => {
      const key = event(k);
      if (!owners.has(key)) owners.set(key, []);
      owners.get(key).push(row);
    });
  });
  return owners;
}
const paid = rows => rows.filter(row => row.contribution || row.wealthContribution || row.tomb);
function auditYear(old, next, zero, label, seedYear) {
  const oldScenes = new Map(old.scenarios.map((s, i) => [scenarioKey(s), old.auditScenarios[i]]));
  count('scenarioAssumptions', !frozen(next.scenarios.map(scenarioKey), old.scenarios.map(scenarioKey)), label);
  count('w0Mismatch', !frozen(zero.effectiveRange, next.comprehensiveRange), label);
  let baselineYearDuplicate = false;
  next.scenarios.forEach((s, i) => {
    const oldScene = oldScenes.get(scenarioKey(s)), scene = next.auditScenarios[i];
    if (!oldScene) return;
    const labelHere = label + '/' + scenarioKey(s);
    let baselineGroups = 0;
    for (const axis of ['contribution', 'wealthContribution']) {
      const a = ownership(oldScene, axis), b = ownership(scene, axis);
      const groups = [...a.values()].filter(rows => rows.length > 1).length;
      if (axis === 'contribution') baselineGroups += groups;
      else if (seedYear) oldDuplicates.wealthGroups += groups;
      for (const [key, owners] of b) {
        if (owners.length < 2) continue;
        const oldOwners = (a.get(key) || []).map(ownerId).sort();
        const touched = json(oldOwners) !== json(owners.map(ownerId).sort());
        count('newUnsignedKeyDup', touched, labelHere + ' ' + axis + ' ' + key);
        count('newSameEventSignFlip', touched && new Set(owners.map(x => x.side)).size > 1, labelHere + ' ' + axis + ' ' + key);
      }
    }
    if (seedYear && baselineGroups) {
      oldDuplicates.scenarios++;
      oldDuplicates.groups += baselineGroups;
      baselineYearDuplicate = true;
    }
    const b = scene.ledger.filter(row => row.contribution);
    const positive = new Set(b.filter(row => row.side === 'positive').flatMap(row => row.ownedEventKeys.map(event)));
    count('sameEventCoreConflict', b.some(row => row.ruleId === 'Y3-dynamic-core-harm' &&
      row.ownedEventKeys.some(key => positive.has(event(key)))), labelHere);
    count('outputDoubleBooked', b.some(row => row.ruleId === 'Y3-dynamic-phenomenon' && excess.test(row.taskId)) &&
      b.some(row => /^Y4-(output|blade-outlet)/.test(row.ruleId)), labelHere);
    count('satNeg', next.annual.review.dynamicUse?.capacity?.saturated && b.some(row => row.side === 'negative' &&
      (row.ruleId === 'Y3-carry-support' || row.ruleId === 'Y3-replacement-medicine' && /^承载不足/.test(row.taskId) ||
        /满溢/.test(row.taskId))), labelHere);
    for (const row of paid(oldScene.ledger)) {
      if (row.tomb) {
        count('erasedPositiveTomb', row.tomb.parts.some(part => part.value > 0 &&
          !scene.ledger.some(nextRow => nextRow.tomb?.parts.some(p => json(p.key) === json(part.key) && p.value >= part.value))), labelHere);
      }
      if (!/^(Y[234]-|W-|LK-|T-year-)/.test(row.ruleId) || Math.max(row.contribution, row.wealthContribution) < 2) continue;
      const survives = scene.ledger.some(other => other.side === row.side && other.ruleId === row.ruleId && other.taskId === row.taskId &&
        other.contribution >= row.contribution && other.wealthContribution >= row.wealthContribution &&
        row.ownedEventKeys.every(key => other.ownedEventKeys.includes(key)));
      count('swallowedHighTier', !survives, labelHere + ' ' + row.ruleId + ' ' + row.taskId);
      count('erasedY4', !survives && /^Y4-(output|blade-outlet)/.test(row.ruleId), labelHere);
    }
  });
  if (baselineYearDuplicate) oldDuplicates.years++;
}
function summary(row, compact = false) {
  return { direction: row.annual.direction, uncertainty: row.annual.uncertainty,
    B: row.comprehensiveRange, W: row.wealthRange, effective: row.effectiveRange,
    scenarios: row.scenarios.map((s, i) => {
      const scene = row.auditScenarios[i];
      const ledger = scene.ledger.flatMap((entry, j) => {
        if (!entry.contribution && !entry.wealthContribution && !entry.tomb) return [];
        const { ruleId, taskId, side, contribution, wealthContribution, ownedEventKeys, tomb } = entry;
        return [{ ...(compact ? { ruleId, taskId, side, contribution, wealthContribution, ownedEventKeys, ...(tomb ? {
          tomb: tomb.parts.map(part => [part.key, part.value])
        } : {}) } : entry), ...(wealthContribution ? { ownedWealthKeys: scene.wealthKeys[j] } : {}) }];
      });
      const { ledger: branchLedger, ...scenario } = s;
      return { ...scenario, ledger, outputReady: scene.outputReady };
    }) };
}
const diagnosticYears = new Set([2042, 2047, 2048, 2049, 2051, 2094]);
const diagnosticFields = ['state', 'possibleStates', 'reason', 'conditions', 'counterEvidence'];
function wangAudit(old, next, year) {
  frozenCounts.wang++;
  if (!diagnosticYears.has(year)) return frozen(next, old);
  const oldTask = old.annual.review.afterTasks.find(task => task.id === 'hurt-seal');
  const tasks = next.annual.review.afterTasks;
  const task = tasks.find(item => item.id === 'hurt-seal');
  frozenCounts.wangDiagnostic++;
  assert.equal(oldTask.state, 1, 'Old matching task ' + year);
  assert.notEqual(task.state, 1, 'Incomplete matching ' + year);
  assert.match(task.reason, /同一印.*丙.*回生/, 'Missing return ' + year);
  const restored = { ...task };
  diagnosticFields.forEach(name => { restored[name] = oldTask[name]; });
  return frozen({ ...next, annual: { ...next.annual, review: { ...next.annual.review,
    afterTasks: tasks.map(item => item === task ? restored : item) } } }, old);
}

const matrix = {};
const annualRows = [];
const nextRows = new Map();
function compareSameContext(context, copy, q, label) {
  context.wealthChannel = after.wealthChannelState(context, q.analysis);
  copy.wealthChannel = after.wealthChannelState(copy, q.analysis);
  const steady = after.compareOutlookContexts(context, copy, q.analysis, true, true);
  const w = after.annualWealthActions(context, context, copy, q.analysis, null, true);
  const changes = after.annualRule5Changes(steady, context, context, copy);
  const settlement = after.settleAnnualLedger(steady, w, changes, copy);
  count('noNewEventDrift', settlement.sums.B !== 0 || settlement.sums.W !== 0 ||
    paid(settlement.ledger).some(row => row.contribution || row.wealthContribution), label);
  frozenCounts.sameContext++;
}
function compare(input, decades, label, solar = false, seedYear = false) {
  const p = profile(E, input, solar), oldProfile = profile(before.E, input, solar);
  same(p, oldProfile, label + ' profile');
  const q = contextFor(after, p);
  const eligible = after.annualRule5Enabled(q.base, q.analysis, q.qualification);
  const target = ['刃', '禄', '食', '伤'].includes(q.family);
  const batches = cycles(E, p, decades);
  same(batches, cycles(before.E, oldProfile, decades), label + ' luck boundaries');
  if (eligible) {
    const ctx = q.base, copy = after.buildTemporalPatternContext(p.dayStem, p.pillars, q.analysis);
    compareSameContext(ctx, copy, q, label + ' four pillars');
    const { luck, years } = batches[0], pillars = { ...p.pillars, luck, flowYear: years[0].gz };
    const temporal = () => after.buildTemporalPatternContext(p.dayStem, pillars, q.analysis, { outlookFlowYear: true });
    compareSameContext(temporal(), temporal(), q, label + ' six pillars');
  }
  for (const batch of batches) {
    const a = before.E.evaluateLuckOutlook(oldProfile, batch.luck, batch.prior, batch.years);
    const b = E.evaluateLuckOutlook(p, batch.luck, batch.prior, batch.years);
    const z = E.evaluateLuckOutlook(p, batch.luck, batch.prior, batch.years, { wealthExtraWeight: 0 });
    assert.equal(b.ruleVersion, version);
    for (const field of ['natal', 'previous', 'wealth']) {
      count('frozenDrift', !frozen(b[field], a[field]), label + ' ' + field);
      frozenCounts.fourFive++;
    }
    b.years.forEach((next, i) => {
      const old = a.years[i], zero = z.years[i], key = label + '/' + next.year;
      for (const field of ['increment', 'previousYear']) {
        count('frozenDrift', !frozen(next[field], old[field]), key + ' ' + field);
        if (field === 'increment' || next[field]) frozenCounts[field]++;
      }
      const temporary = ['#5/2039', '#5/2049'].includes(key);
      if (seedYear && !target) frozenCounts.nonTarget++;
      if (seedYear && old.fakeFollow?.type) frozenCounts.fakeFollow++;
      if (label === '#116') frozenCounts.trueFollow++;
      if (label === '小蔓' || label === '香肠') frozenCounts.xiaomanAndSausage++;
      if (temporary) frozenCounts.temporaryFollow++;
      if (label === '老王') count('frozenDrift', !wangAudit(old, next, next.year), key);
      else if (!eligible || temporary || label === '小蔓' || label === '香肠') count('frozenDrift', !frozen(next, old), key);
      auditYear(old, next, zero, key, seedYear);
      nextRows.set(key, { row: next, zero, old });
      if (seedYear) annualRows.push({ chart: label, year: next.year, family: q.family,
        rule5Enabled: eligible, before: summary(old, true), after: summary(next, true) });
    });
  }
}

E.forEachLegalFourPillar((pillars, meta) => {
  if (meta.yearIndex < 2 || meta.dayIndex < 30 || meta.hourIndex !== meta.dayIndex % 4) return;
  same(E.analyzePattern({ pillars }), before.E.analyzePattern({ pillars }), meta.key);
  frozenCounts.natal++;
}, { yearCycleCount: 4, monthBranchCount: 12, dayCycleCount: 60, hourBranchCount: 4, validateUnique: false });
let seed = 20261126;
const rand = n => Math.floor((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) * n / 2 ** 32);
for (let i = 1; i <= 120; i++) {
  compare([1940 + rand(85), 1 + rand(12), 1 + rand(28), rand(24), rand(60), i % 2 ? '男' : '女'], 2, '#' + i, false, true);
}
compare([1994, 7, 29, 10, 0, '女'], 10, '老王');
compare([1998, 6, 23, 9, 30, '女'], 10, '小蔓', true);
compare([1993, 12, 13, 8, 5, '男'], 10, '香肠', true);
compare([1984, 12, 4, 7, 30, '男'], 3, '1984 食格');

function probe(key) {
  const found = nextRows.get(key);
  assert(found, key);
  const { row, zero, old } = found;
  matrix[key] = { ...summary(row), w0: zero.effectiveRange, recurrence: row.recurrence?.postMerge,
    tasks: row.annual.review.afterTasks.map(({ id, state, possibleStates, reason, physical }) =>
      ({ id, state, possibleStates, reason, physical })) };
  return { row, zero, old, tasks: Object.fromEntries(row.annual.review.afterTasks.map(task => [task.id, task])) };
}
for (const [key, B, W, weighted, recurrence] of [
  ['#55/2016', -3, -2, -3.5, 1], ['#69/2027', -3, 0, -3, 3]
]) {
  const { row, zero } = probe(key);
  same(row.scenarios.map(s => [s.B, s.W, s.evidenceMissing.B]), [[B, W, false]], key);
  assert.equal(row.scenarios[0].evidenceMissing.W, key.startsWith('#69'));
  assert.equal(row.effectiveRange.guaranteed, weighted, key);
  assert.equal(zero.effectiveRange.guaranteed, B, key);
  assert(row.recurrence.postMerge.some(action => action.contribution === recurrence && action.side === 'negative'), key);
  assert(row.annual.evidence.concat(row.annual.reservations).some(item => item.recurrenceHint), key + ' recurrence hint');
}
for (const key of ['#14/2023', '#38/2007', '#78/1968', '#78/1982', '#8/1981',
  '老王/2023', '老王/2052', '老王/2055', '老王/2073']) assert(probe(key).row.effectiveRange.pending, key);
assert.equal(probe('#61/1965').tasks['kill-blade'].state, 1);
const parallel = paid(probe('#15/1975').row.actionLedger);
assert(['positive', 'negative'].every(side => parallel.some(row =>
  row.ruleId === 'W-peer' && row.side === side && row.contribution === 2 && row.wealthContribution === 2)));
const mixed = probe('#61/1966').tasks;
assert.equal(mixed['officer-blade'].state, 1);
assert.equal(mixed['officer-kill-mixed'].state, -1);
const food = probe('1984 食格/2011'), foodEdge = 'year:甲:木>制>luck:戊:土';
same(food.tasks['food-kill'].physical.edges, [foodEdge], 'Food controls the same killing actor');
assert(food.tasks['food-kill'].state === 1 && food.tasks['food-kill'].physical.cleanRoots && food.tasks['food-kill'].physical.carrying);
assert.equal(food.row.actionLedger.filter(r => r.ruleId === 'Y3-core-gate' && r.taskId === '食神制杀格' &&
  r.contribution === 3 && ['year:甲:木', 'luck:戊:土'].every(actor => r.action.mediatorKeys.includes(actor))).length, 1);
assert(!food.row.actionLedger.some(r => r.ruleId === 'Y3-rule5-path' && r.taskId === 'handle-kill' && r.contribution));
const faction = probe('1984 食格/2006').tasks['food-kill'];
same(faction.physical.wealthSupportsKill, ['year:甲:木>生>flowYear:丙:火', 'flowYear:丙:火>生>luck:戊:土'], 'Wealth backs the same killing actor');
assert(faction.state !== 1 && !faction.physical.cleanRoots && !faction.physical.carrying);
const weakFood = probe('#5/2033').tasks['food-kill'];
assert(weakFood.state !== 1 && !weakFood.physical.carrying && weakFood.physical.edges.includes('hour:己:土>制>flowYear:癸:水'));
const cross = probe('#83/2021').tasks['food-kill'];
same(cross.physical.wealthSupportsKill, ['flowYear:辛:金>生>hour:壬:水', 'hour:壬:水>生>luck:乙:木'], 'Cross-family wealth backs the same killing actor');
assert.notEqual(cross.state, 1);
for (const [year, state, target] of [[1978,-1,'flowYear:戊:土'], [1980,0,'month:辰藏戊:土']]) {
  const { tasks } = probe('#57/' + year);
  const owl = tasks['owl-food'];
  assert.equal(owl.state, state);
  assert(owl.physical.edges.includes('luck:甲:木>制>' + target), String(year));
  assert.equal(owl.physical.edges.includes('flowYear:庚:金>制>luck:甲:木'), year === 1980);
  assert.notEqual(tasks['food-seal-tune'].state, 1);
}
for (const [year, value] of [[2030,-5],[2034,7],[2037,0],[2041,-4],[2067,4]]) {
  const { row, tasks } = probe('老王/' + year);
  assert.equal(row.effectiveRange.guaranteed, value);
  if (year === 2034) {
    assert.equal(tasks['hurt-seal'].state, 1);
    assert.equal(row.actionLedger.filter(r => r.ruleId === 'Y3-core-gate' && r.taskId === '伤官配印格' && r.contribution === 3).length, 1);
  }
  if (year === 2067) {
    assert.equal(tasks['hurt-seal'].state, null);
    const primary = { 子:'癸',丑:'己',寅:'甲',卯:'乙',辰:'戊',巳:'丙',午:'丁',未:'己',申:'庚',酉:'辛',戌:'戊',亥:'壬' };
    assert.equal(tasks['hurt-seal'].actorGroups.I.roots.filter(r => r.usable && !r.restricted && primary[r.branch] === r.stem).length, 0);
  }
}
for (const [year, value] of [[2042,-1],[2047,0],[2048,-1],[2049,-2],[2051,-1],[2094,0]]) {
  assert.equal(probe('老王/' + year).row.effectiveRange.guaranteed, value);
}
for (const [year, state] of [[1971,1],[1974,null],[1976,-1]]) assert.equal(probe('#120/' + year).tasks['hurt-seal'].state, state);
for (const [key, ...expected] of [
  ['#8/1976',['W-food',1]], ['#13/2001',['Y4-blade-outlet',2]], ['#38/1999',['W-food',2]],
  ['#39/2013',['Y4-output',2],['W-bridge',1]], ['#78/1976',['W-food',2]], ['#83/2021',['W-food',2],['W-peer',2]]
]) {
  const { row } = probe(key);
  assert.equal(row.auditScenarios[row.wealthMerge.selectedIndex].outputReady, true, key);
  expected.forEach(([rule, value]) => assert(row.actionLedger.some(r => r.ruleId === rule && r.side === 'positive' &&
    (rule.startsWith('W-') ? r.wealthContribution : r.contribution) === value), key + ' ' + rule));
}
for (const key of ['#7/1968','#7/1971','#8/1981','#13/2017','#38/2014','#39/2017','#39/2018',
  '#69/2027','#78/1968','#78/1982','#83/2009']) {
  const { row, old } = probe(key);
  assert(row.auditScenarios.every(s => s.outputReady === false), key);
  same(row.auditScenarios.map(s => paid(s.ledger).filter(r => r.wealthContribution && /^W-(food|peer)$/.test(r.ruleId))),
    old.auditScenarios.map(s => paid(s.ledger).filter(r => r.wealthContribution && /^W-(food|peer)$/.test(r.ruleId))), key + ' hidden food');
}
for (const key of ['#5/2039','#5/2049']) {
  const { row, old } = probe(key);
  assert(frozen(row, old), key);
  assert(row.actionLedger.some(r => r.ruleId === 'Y3-core-gate' && r.taskId === '从格：从儿格' && r.contribution === 3));
}
const reverse = probe('#53/1973').row.scenarios;
const tombParts = branch => reverse.filter(s => s.branch === branch).flatMap(s => s.ledger.flatMap(r => r.tomb?.parts || []));
assert(tombParts('A').some(x => x.value < 0 && tombParts('B').some(y =>
  y.value > 0 && json(x.key) === json(y.key) && json(x.physical) === json(y.physical))));
for (const key of ['小蔓/2029','香肠/2030','香肠/2039']) probe(key);

function auditCoverage(engine) {
  const fixtures = vm.runInNewContext(read('check-baselines.js').replace(/\r\n/g, '\n').match(/const cases = (\[[\s\S]*?\n\]);/)[1]);
  const stats = { total: 0, annual: 0, determined: 0, pending: 0, tendency: 0, assessments: {}, families: {}, causes: {} };
  for (const [, args] of fixtures) {
    for (const gender of ['男', '女']) {
      const used = Object.fromEntries(['year', 'month', 'day', 'hour', 'minute'].map((key, index) => [key, args[index]]));
      const pillars = engine.buildPillars(used);
      const chart = { pillars, dayStem: pillars.day[0], gender, time: { used } };
      for (const { luck, prior, years } of cycles(engine, chart, 10)) {
        // Match audit-bazi-luck.js: increment is counted, previousYear is omitted.
        const result = engine.evaluateLuckOutlook(chart, luck, prior, years.map(({ year, gz }) => ({ year, gz })));
        stats.total += 1 + Number(!!prior) + 2 * result.years.length;
        for (const { annual } of result.years) {
          stats.annual++;
          const family = stats.families[annual.review?.afterRoute || 'unavailable'] ||= { total: 0, pending: 0 };
          family.total++;
          stats.assessments[annual.assessment] = (stats.assessments[annual.assessment] || 0) + 1;
          if (annual.direction !== 'pending') { stats.determined++; continue; }
          stats.pending++;
          family.pending++;
          if (annual.tendency) stats.tendency++;
          const causes = new Set(annual.uncertainty.map(text => text.includes('空证据') ? '未识别主要任用'
            : text.includes('月令') ? '月令未定' : text.includes('共同参照') ? '参照未对齐' : text.split('：')[0]));
          for (const cause of causes) stats.causes[cause] = (stats.causes[cause] || 0) + 1;
        }
      }
    }
  }
  assert.equal(stats.total, 7884);
  assert.equal(stats.annual, 3600);
  stats.causes = Object.fromEntries(Object.entries(stats.causes).sort((a,b) => b[1] - a[1]));
  return stats;
}
const coverage = { before: auditCoverage(before.E), after: auditCoverage(E) };
const target = path.join(root, 'build', 'luck-rule5-20261128');
fs.mkdirSync(target, { recursive: true });
fs.writeFileSync(path.join(target, 'annual-comparison.json'), json({
  baseline, version, seed: 20261126, frozenCounts, oldDuplicates, zeros, issues, coverage, matrix, annualRows
}, null, 2));
console.log(json({ frozenCounts, oldDuplicates, zeros, issues, coverage }, null, 2));
assert.equal(annualRows.length, 2400);
same([oldDuplicates.scenarios, oldDuplicates.groups, oldDuplicates.years], [209, 470, 166], 'Frozen B-axis unsigned duplicates');
for (const [key, expected] of Object.entries({ natal: 720, nonTarget: 1420, fakeFollow: 80, trueFollow: 20,
  xiaomanAndSausage: 200, wang: 100, wangDiagnostic: 6, temporaryFollow: 2 })) assert.equal(frozenCounts[key], expected, key);
for (const [name, failures] of Object.entries(zeros)) assert.equal(failures, 0, name);
