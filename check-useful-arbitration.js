// Behavioral checks for the useful-element decision contract.
// These are theoretical structure/evidence tests, not claims of predictive accuracy.
// No person's desired useful elements, income history, or desired strength label
// is an oracle here.  Load the actual browser engine rather than reimplement it.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const context = { console, Date, Math };
vm.createContext(context);
for (const file of ['qimen.js', 'bazi-engine.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, file), 'utf8'), context, { filename: file });
}
const E = context.BaziEngine;
assert.ok(E, 'The real BaziEngine must load');
const elements = ['木', '火', '土', '金', '水'];
const clone = value => JSON.parse(JSON.stringify(value));
const sorted = values => Array.from(values || []).sort();
const unique = values => Array.from(new Set(values));
let passed = 0;
const failures = [];
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('ok - ' + name);
  } catch (error) {
    failures.push(name + ': ' + error.message);
    console.error('not ok - ' + name + '\n  ' + error.message);
  }
}
function analyze(pillars, time) {
  const data = { pillars: clone(pillars), dayStem: pillars.day[0] };
  if (time) data.time = { used: clone(time) };
  return E.analyzePattern(data);
}
function at(time) {
  const pillars = E.buildPillars(time);
  return { pillars, analysis: analyze(pillars, time) };
}
function checkElementList(values, message) {
  assert.ok(Array.isArray(values), message + ' must be an array');
  assert.equal(new Set(values).size, values.length, message + ' must not duplicate elements');
  for (const element of values) assert.ok(elements.includes(element), message + ': invalid element ' + element);
}
function assertDecision(analysis, label) {
  const useful = analysis.useful;
  const decision = useful.decision;
  assert.ok(decision && decision.version, label + ': versioned decision is required');
  assert.ok(decision.priority && decision.priority.type && decision.priority.text, label + ': priority must explain the chosen route');
  assert.ok(Array.isArray(decision.routes) && decision.routes.length, label + ': routes must be exposed');
  assert.ok(Array.isArray(decision.primaryRouteIds), label + ': primary route IDs are required');
  assert.equal(unique(decision.routes.map(route => route.id)).length, decision.routes.length, label + ': route IDs must be unique');
  const statuses = ['selected', 'conditional', 'reference', 'rejected'];
  for (const route of decision.routes) {
    assert.ok(route.id && route.name && route.layer, label + ': routes need stable identity and a layer');
    assert.ok(statuses.includes(route.status), label + ': invalid route status ' + route.status);
    checkElementList(route.elements, label + '/' + route.id);
    assert.ok(Array.isArray(route.requirements) && Array.isArray(route.evidence), label + ': requirements/evidence must remain inspectable');
    assert.ok(route.reason && route.source, label + ': route needs a reason and source provenance');
    if (route.status === 'selected' || route.status === 'conditional') {
      assert.ok(route.evidence.length, label + ': active route cannot have empty evidence');
      assert.ok(route.requirements.length, label + ': active route needs explicit conditions');
    }
    if (route.status === 'conditional') {
      assert.ok(typeof route.benefit === 'string' && route.benefit.trim(), label + ': conditional use needs a concrete benefit');
      assert.ok(typeof route.risk === 'string' && route.risk.trim(), label + ': conditional use needs a concrete risk');
      assert.notEqual(route.benefit, route.risk, label + ': benefit/risk must not be the same placeholder');
    }
  }
  for (const id of decision.primaryRouteIds) {
    const route = decision.routes.find(item => item.id === id);
    assert.ok(route && route.status === 'selected', label + ': primaryRouteIds cannot point to an inactive route');
  }
  const conclusion = decision.conclusion;
  assert.ok(conclusion, label + ': explicit final conclusion is required');
  for (const key of ['primary', 'secondary', 'conditional', 'avoid', 'routeDependent']) checkElementList(conclusion[key], label + '/conclusion.' + key);
  assert.ok(conclusion.primary.length || conclusion.secondary.length, label + ': a selected or explicitly conditional conclusion must be stated');
  const favorable = unique(conclusion.primary.concat(conclusion.secondary));
  assert.ok(!favorable.some(element => conclusion.avoid.includes(element)), label + ': unconditional use and avoid cannot contradict each other');
  assert.ok(!conclusion.primary.some(element => conclusion.secondary.includes(element)), label + ': primary and secondary levels must not duplicate each other');
  assert.ok(!conclusion.routeDependent.some(element => favorable.includes(element) || conclusion.avoid.includes(element)), label + ': a separate interpretation cannot silently become default favorable or default taboo');
  for (const element of conclusion.primary) {
    assert.ok((decision.promotedPrimary || []).includes(element) || decision.routes.some(route => route.status === 'selected' && route.elements.includes(element)), label + ': primary element must come from a selected route or the secondary promotion');
  }
  assert.deepEqual(sorted(useful.primaryUse), sorted(conclusion.primary), label + ': primary display must derive from decision');
  assert.deepEqual(sorted(useful.secondaryUse), sorted(conclusion.secondary), label + ': secondary display must derive from decision');
  assert.deepEqual(sorted(useful.avoid), sorted(conclusion.avoid), label + ': avoid display must derive from decision');
  assert.deepEqual(sorted((useful.conditionalUse || []).map(item => item.element)), sorted(conclusion.conditional), label + ': conditional display must derive from decision');
  for (const element of favorable) assert.ok(useful.use.includes(element), label + ': compatibility use API lost a selected element');
  assert.ok(!useful.use.some(element => useful.avoid.includes(element)), label + ': compatibility API contradicts itself');
  for (const item of useful.conditionalUse || []) {
    assert.ok(item.benefit && item.risk, label + ': legacy conditional explanations must retain both sides');
    assert.ok(['有条件','喜中带忌'].includes(item.label), label + ': conditional display must distinguish pending restrictions from an effective two-sided action');
    assert.ok(decision.routes.some(route => route.status === 'conditional' && route.elements.includes(item.element)), label + ': conditional conclusion cannot be invented outside the route ledger');
    const entry = decision.elements.find(element => element.element === item.element);
    if (item.label === '喜中带忌' && entry) {
      assert.ok(entry.riskEntries.some(risk => risk.status === 'effective'), label + ': a mere possibility must not be described as an already-effective 忌 side');
    }
  }
  if (!analysis.specialPatternQualification) {
    assert.equal(decision.elements.length, 5, label + ': ordinary decisions must expose every element, including neutral and route-dependent ones');
    for (const item of decision.elements) {
      assert.ok(['use','conditional','route-dependent','avoid','neutral'].includes(item.decision), label + ': unknown element decision');
      assert.ok(Array.isArray(item.benefitEntries) && Array.isArray(item.riskEntries), label + ': benefits and risks need the same inspectable evidence ledger');
      for (const entry of item.benefitEntries) {
        assert.ok(entry.routeId && ['local','proposed','reference'].includes(entry.status) && entry.text, label + ': benefit needs a route, evidence status and explanation');
        assert.ok(Array.isArray(entry.evidence), label + ': benefit evidence must remain inspectable');
      }
      for (const entry of item.riskEntries) {
        assert.ok(entry.id && ['effective','potential'].includes(entry.status) && entry.text, label + ': risk must distinguish an effective adverse action from a possibility');
        assert.ok(Array.isArray(entry.evidence), label + ': risk evidence must remain inspectable');
      }
      if (item.benefitEntries.some(entry => entry.status === 'local' || entry.status === 'proposed')) {
        assert.ok(item.benefits.length, label + ': the element summary cannot omit an inspected local or proposed benefit');
      }
      if (item.decision === 'avoid') {
        assert.ok(item.riskEntries.some(entry => entry.status === 'effective'), label + ': a potential risk or unmet prerequisite alone cannot establish 忌');
        assert.ok(conclusion.avoid.includes(item.element), label + ': element and final avoid verdict must agree');
      }
      if (item.decision === 'route-dependent') {
        assert.ok(conclusion.routeDependent.includes(item.element), label + ': route-dependent assessment must remain visible without being merged into default use');
      }
    }
  }
}

// Both dates have exactly the same four pillars but occur at different depths
// within 未 month.  This isolates seasonal information without prescribing a
// real person's favorable elements or forcing a strong/weak result.
const earlyTime = { year: 1993, month: 7, day: 14, hour: 8, minute: 20 };
const lateTime = { year: 1933, month: 7, day: 29, hour: 8, minute: 20 };
const early = at(earlyTime);
const late = at(lateTime);
const noTime = analyze(early.pillars);

test('month-depth evidence reaches strength analysis without hard-coding a strength outcome', () => {
  assert.deepEqual(clone(early.pillars), clone(late.pillars), 'seasonal fixture must isolate identical four pillars');
  const a = early.analysis.strengthScore.seasonal;
  const b = late.analysis.strengthScore.seasonal;
  assert.ok(a && b && a.available && b.available, 'time-qualified strength must retain seasonal evidence');
  assert.equal(a.commander, '丁', 'early 未 month fixture has 丁司令');
  assert.equal(b.commander, '己', 'late 未 month fixture has 己司令');
  assert.notEqual(a.elapsedDays, b.elapsedDays, 'within-month depth must not be discarded');
  for (const item of [a, b]) {
    assert.ok(item.source && item.method && item.effect, 'seasonal interpretation needs provenance and an actual effect description');
    assert.ok(Array.isArray(item.evidence) && item.evidence.length, 'seasonal interpretation needs evidence');
    assert.ok(item.evidence.some(text => String(text).includes(item.commander)), 'seasonal evidence must identify the actual commander');
  }
  assert.notDeepEqual(clone(a.evidence), clone(b.evidence), 'same pillars must not erase different seasonal evidence');
  assert.ok(early.analysis.strengthScore.evidence.some(text => String(text).includes('丁')), 'commander must participate in the strength evidence actually consumed downstream');
  assert.ok(late.analysis.strengthScore.evidence.some(text => String(text).includes('己')), 'late commander must participate downstream too');
});

test('missing birth time is explicit evidence, not an invented monthly commander', () => {
  const seasonal = noTime.strengthScore.seasonal;
  assert.ok(seasonal && seasonal.available === false, 'no-time four-pillars analysis must be marked unavailable');
  assert.ok(!seasonal.commander, 'no-time analysis cannot invent a commander');
  assert.ok(seasonal.source && seasonal.method, 'missing time still needs provenance/method');
  assert.ok(Array.isArray(seasonal.missing) && seasonal.missing.length, 'the missing input must be named');
  assert.ok(Array.isArray(seasonal.evidence), 'evidence remains a stable array even when unavailable');
});

test('shared birth-profile API and direct analysis consume the same canonical decision', () => {
  const profile = E.createBaziProfile({ gender: '男', time: { used: clone(earlyTime) } });
  assert.deepEqual(clone(profile.pillars), clone(early.pillars), 'profile fixture must preserve the same computed four pillars');
  assert.ok(profile.useful.decision && early.analysis.useful.decision, 'both entry points must return structured decisions');
  assert.deepEqual(clone(profile.useful.decision), clone(early.analysis.useful.decision), 'shared profile generation must not apply a different useful-element policy');
  assert.deepEqual(clone(profile.patternAnalysis.useful), clone(profile.useful), 'profile summary must mirror full pattern analysis');
  assert.equal(profile.strength, profile.patternAnalysis.strength, 'profile strength must mirror full pattern analysis');
});

// Legal theoretical pillars: year/month obey 五虎遁 and day/hour obey 五鼠遁.
// Only the day branch changes in each rooted counterexample; an added natal
// root is a genuine counter-condition, not an expected real-life outcome.
const childPillars = { year: '丁巳', month: '丙午', day: '甲戌', hour: '庚午' };
const childRootedPillars = { ...childPillars, day: '甲寅' };
const killPillars = { year: '辛酉', month: '丁酉', day: '乙酉', hour: '辛巳' };
const killRootedPillars = { ...killPillars, day: '乙卯' };
const child = analyze(childPillars);
const childRooted = analyze(childRootedPillars);
const killing = analyze(killPillars);
const killingRooted = analyze(killRootedPillars);

test('strict special patterns keep ordinary balance and climate advice out of the selected result', () => {
  for (const [label, analysis, forbidden] of [
    ['从儿', child, ['水', '木']],
    ['从杀', killing, ['水', '木', '火']]
  ]) {
    const special = analysis.specialPatternQualification;
    assert.ok(special && special.status === '已成', label + ': fixture must strictly qualify, not merely resemble a special pattern');
    assert.ok(special.checks.length && special.checks.every(check => check.met), label + ': every qualification must be satisfied');
    assertDecision(analysis, label);
    assert.ok(!analysis.useful.use.some(element => forbidden.includes(element)), label + ': ordinary扶身/调候 cannot reverse a verified special context');
    assert.ok(!analysis.useful.decision.conclusion.conditional.some(element => forbidden.includes(element)), label + ': forbidden ordinary advice cannot re-enter as conditional use');
  }
});

test('root restrictions belong to their own special rule, not every following pattern', () => {
  assert.ok(childRooted.specialPatternQualification && childRooted.specialPatternQualification.ruleId === child.specialPatternQualification.ruleId, '从儿 cannot inherit the no-root veto from 从杀');
  assert.ok(!childRooted.specialPatternQualification.checks.some(check => check.id === 'no-root' || check.id === 'weak-support'), '从儿 must use its independent flow and reversal conditions');
  const sealReversal = analyze({...childPillars,hour:'壬申'});
  assert.ok(!sealReversal.specialPatternQualification || sealReversal.specialPatternQualification.ruleId !== child.specialPatternQualification.ruleId, 'effective seal reversal, not peer roots, blocks this following-output candidate');
  for (const [label, bare, rooted] of [['从杀', killing, killingRooted]]) {
    assert.ok(!rooted.specialPatternQualification || rooted.specialPatternQualification.ruleId !== bare.specialPatternQualification.ruleId, label + ': root counterexample must not retain the same strict qualification');
    assert.ok(rooted.carryingCapacity.usableRootCount > bare.carryingCapacity.usableRootCount, label + ': a real usable root must be reflected');
    assert.notDeepEqual(clone(rooted.carryingCapacity.tasks), clone(bare.carryingCapacity.tasks), label + ': changed root conditions must reach task evidence');
  }
});

test('a diagnostic keyword alone cannot merge 印制 and 财通 into selected useful elements', () => {
  const common = { monthBranch: '未', scores: { 木: 1, 火: 1, 土: 2, 金: 1, 水: 1 } };
  const plain = E.usefulElements('丙', '弱', { ...common, mainPattern: '' });
  const keywordOnly = E.usefulElements('丙', '弱', { ...common, mainPattern: '伤官见官' });
  assert.ok(plain.decision && keywordOnly.decision, 'both paths must use structured decisions');
  assert.deepEqual(clone(keywordOnly.decision.conclusion), clone(plain.decision.conclusion), 'a name is not evidence of a viable medicine route');
});

// A bounded legal theory grid is not a calibration population: no distribution
// or favored answer is prescribed.  It exercises all five day-master elements
// across seasons and requires self-consistent inspectable decisions.
const grid = [];
E.forEachLegalFourPillar((pillars, meta) => {
  if (meta.hourIndex === meta.dayIndex % 4) grid.push({ pillars: clone(pillars), analysis: analyze(pillars) });
}, { yearCycleCount: 2, monthBranchCount: 12, dayCycleCount: 10, hourBranchCount: 4, validateUnique: false });

test('decision and compatibility fields agree across the legal five-element theory grid', () => {
  assert.equal(grid.length, 240, 'bounded grid must stay small and cover every day stem and season');
  const dayElements = new Set(grid.map(item => E.constants.STEM_WX[item.pillars.day[0]]));
  assert.equal(dayElements.size, 5, 'all five day-master elements must be exercised');
  for (const item of grid) assertDecision(item.analysis, Object.values(item.pillars).join('/'));
});

test('an unselected wealth route cannot erase a restriction of the selected pattern route', () => {
  const result = analyze({year:'甲子',month:'己巳',day:'戊辰',hour:'壬子'});
  assert.ok(!result.comboPatterns.includes('杀印相生格'), 'the old fixture has a bound seal; a supposed pattern restriction cannot bypass its own formation failure');
  assert.ok(result.useful.decision.routes.some(route => route.id === 'wealth-flow' && route.status !== 'selected'));
  for (const entry of result.useful.decision.elements.filter(item => item.decision === 'avoid')) assert.ok(entry.riskEntries.some(risk => risk.status === 'effective' && risk.dominant), 'a veto needs its own effective dominant evidence, not a preferred pattern name');
});

test('an officer-load remedy records officer-to-seal and seal-to-day evidence, not a copied injury chain', () => {
  const result = analyze({year:'甲子',month:'丁卯',day:'庚辰',hour:'丙子'});
  const route = result.useful.decision.routes.find(item => item.id === 'seal-remedy');
  assert.ok(result.patternDisease.items.some(item => item.family === '官杀承载不足'));
  assert.ok(route.evidence.some(text => /七杀.*生.*印/.test(text)), 'actual killing-to-seal chain must be inspected');
  assert.ok(route.evidence.some(text => text.startsWith('印至日主：')), 'seal support cannot be inferred from killing-to-seal alone');
});

test('extreme climate needs cannot be silently erased by a generic weak-support remedy', () => {
  const result = analyze({year:'壬子',month:'壬子',day:'辛酉',hour:'壬辰'});
  assert.equal(result.useful.layers.tiaohou.priority, '主用');
  assert.ok(!result.elementPhenomena.length, 'fixture isolates climate from an independently verified element disease');
  assert.ok(result.useful.decision.primaryRouteIds.includes('climate'));
  const fire = result.useful.decision.elements.find(item => item.element === '火');
  assert.ok(fire.benefits.length && ['use','conditional'].includes(fire.decision));
  assert.ok(result.useful.use.includes('火'), 'an explicitly needed, unopposed climate element cannot vanish from the selected conclusion');
});

// These fixtures come from the legal theory generator, not from a person's
// reported income or a desired useful-element answer.  Their element roles
// differ from the motivating chart: for 癸 water, wealth is fire and peer is water.
const localWealthFixture = {year:'戊寅',month:'甲寅',day:'癸酉',hour:'丙辰'};
const localWealth = analyze(localWealthFixture);

test('an unselected reachable wealth function retains its local benefit in the element ledger', () => {
  const result = analyze({year:'甲子',month:'丙寅',day:'甲子',hour:'甲子'});
  const decision = result.useful.decision;
  const route = decision.routes.find(item => item.id === 'wealth-flow');
  assert.ok(route && route.active && !decision.primaryRouteIds.includes('wealth-flow'), 'fixture must isolate an inspected local function outside the selected anchor');
  const wealthElement = decision.elements.find(item => item.element === route.elements[0]);
  assert.ok(wealthElement.benefitEntries.some(entry => entry.routeId === 'wealth-flow' && entry.status === 'local' && entry.evidence.length), 'unselected is not equivalent to no benefit');
  assert.ok(wealthElement.benefits.length, 'the public summary ledger cannot retain only the competing risks');
});

test('potential wealth risks and strict carrying prerequisites do not independently establish taboo', () => {
  const decision = localWealth.useful.decision;
  const fire = decision.elements.find(item => item.element === '火');
  assert.ok(fire.riskEntries.some(entry => entry.status === 'potential'), 'fixture must exercise a real pending-use restriction');
  assert.ok(!fire.riskEntries.some(entry => entry.status === 'effective'), 'fixture must isolate potential restrictions from independently proven damage');
  assert.notEqual(fire.decision, 'avoid', 'an actual local benefit plus only potential risks is not enough to declare 忌');
  assert.ok(!decision.conclusion.avoid.includes('火'));
  const conditional = localWealth.useful.conditionalUse.find(item => item.element === '火');
  if (conditional) assert.equal(conditional.label, '有条件', 'potential risks must not be described as established 喜中带忌');
});

test('a local main-conflict remedy is considered before generic peer support, not before every route', () => {
  const decision = localWealth.useful.decision;
  const wealth = decision.routes.find(item => item.id === 'wealth-flow');
  assert.ok(localWealth.patternDisease.items.some(item => item.family === '官伤冲战'), 'fixture needs the actual conflict addressed by wealth flow');
  assert.equal(wealth.assessment, 'local', 'priority cannot come from a name or an unconnected wish');
  const pending = localWealth.patternDisease.items.some(item => item.family === '官伤冲战' && item.status !== '已解');
  assert.equal(wealth.priority, pending ? 'main-remedy' : 'pattern', 'pending treatment and maintaining an already-effective rescue have separate priorities');
  if (!pending) assert.ok(wealth.maintainsResolved && /维护既有功能/.test(wealth.intent), 'resolved is not forgotten: preserve medicine function without turning it into a prescription to add more');
  const noConflict = analyze({year:'甲子',month:'丙寅',day:'甲子',hour:'甲子'});
  const ordinaryWealth = noConflict.useful.decision.routes.find(item => item.id === 'wealth-flow');
  assert.ok(ordinaryWealth.active && !noConflict.patternDisease.items.some(item => item.family === '官伤冲战'));
  assert.notEqual(ordinaryWealth.priority, 'main-remedy', 'connectivity alone cannot promote every wealth path to a main remedy');
});

test('an independent monthly interpretation is recorded without being unioned into default useful elements', () => {
  const result = analyze({year:'辛未',month:'乙未',day:'丙申',hour:'壬辰'});
  const decision = result.useful.decision;
  const monthly = decision.routes.find(item => item.id === 'monthly-bing-wei');
  assert.ok(monthly && monthly.evidence.some(text => text.includes('壬：透干')) && monthly.evidence.some(text => text.includes('庚：藏支有根')));
  assert.equal(monthly.assessment, 'reference');
  assert.equal(monthly.priority, 'reference');
  assert.ok(!decision.primaryRouteIds.includes(monthly.id));
  for (const element of monthly.elements) {
    const item = decision.elements.find(entry => entry.element === element);
    assert.ok(item.benefitEntries.some(entry => entry.routeId === monthly.id && entry.status === 'reference'), 'independent source evidence must not disappear');
    const solelyReference = !item.benefitEntries.some(entry => entry.status === 'local' || entry.status === 'proposed');
    if (solelyReference) assert.ok(!result.useful.use.includes(element), 'reference-only benefit cannot become default joy by taking a cross-method union');
  }
});

test('separate reference benefits cannot erase an effective pattern or element-disease restriction', () => {
  const protectedSeal = analyze({year:'甲子',month:'辛未',day:'丙寅',hour:'戊子'});
  assert.equal(protectedSeal.mainPattern, '伤官配印格', 'fixture must preserve a verified seal-based pattern');
  const metal = protectedSeal.useful.decision.elements.find(item => item.element === '金');
  assert.ok(metal.benefitEntries.some(entry => entry.status === 'reference'), 'the independent monthly reference must actually be present');
  assert.ok(!metal.riskEntries.some(entry => entry.status === 'effective'), 'the old fixture has 辛合丙: bound wealth cannot be fabricated into effective damage merely to oppose the monthly reference');
  if (metal.riskEntries.some(entry => entry.status === 'effective' && entry.dominant)) assert.ok(protectedSeal.useful.avoid.includes('金'), 'a reference cannot negate a qualified veto');
  const buried = analyze({year:'戊辰',month:'戊午',day:'辛未',hour:'己丑'});
  const phenomenon = buried.elementPhenomena.find(item => item.ruleId === 'ZP-QX-001');
  assert.ok(phenomenon, 'fixture must establish an actual excessive-earth disease');
  const earth = buried.useful.decision.elements.find(item => item.element === '土');
  assert.ok(earth.riskEntries.some(entry => entry.status === 'effective'));
  assert.ok(buried.useful.avoid.includes('土'), 'ordinary seal support cannot erase already-established excessive-earth harm');
});

test('secondary climate cannot silently erase the only selected pattern element', () => {
  const result = analyze({year:'甲子',month:'甲戌',day:'庚午',hour:'庚辰'});
  assert.equal(result.useful.layers.tiaohou.priority,'佐用');
  assert.ok(result.useful.use.length, 'a secondary climate constraint must not empty the selected strategy, even when upstream formation changes');
  const risk = result.useful.decision.elements.find(item => item.element === '金').riskEntries.find(item => item.id === 'climate-limitation');
  assert.ok(risk && risk.dominant === false);
});

test('bound or transformed injury-officer relations cannot be declared effective damage from distance alone', () => {
  for (const hour of ['癸丑','己未']) {
    const result = analyze({year:'甲子',month:'戊辰',day:'癸酉',hour});
    const wood = result.useful.decision.elements.find(item => item.element === '木');
    const risk = wood.riskEntries.find(item => item.id === 'unresolved-output-officer');
    assert.ok(!risk || risk.status === 'potential' && risk.dominant === false, 'blocked coexistence may disappear from active disease entirely; it cannot remain effective damage');
    if (risk) assert.ok(risk.evidence.some(text => /争合|合化|合绊/.test(text)), 'the blocking interaction must be visible in the evidence');
  }
});

test('wealth, output and officer carrying have independently explained conditions', () => {
  const statuses = new Set();
  for (const item of grid) {
    const tasks = item.analysis.carryingCapacity.tasks;
    assert.ok(tasks && tasks.wealth && tasks.output && tasks.officer, 'all three carrying tasks must be assessed independently');
    const conditionSets = [];
    for (const key of ['wealth', 'output', 'officer']) {
      const task = tasks[key];
      assert.ok(['supported', 'conditional', 'limited'].includes(task.status), key + ': task status must be explicit');
      statuses.add(task.status);
      assert.ok(Array.isArray(task.conditions) && task.conditions.length, key + ': task must expose its conditions');
      assert.ok(Array.isArray(task.evidence) && task.evidence.length, key + ': task needs actual evidence');
      assert.ok(Array.isArray(task.restrictions), key + ': restrictions must have stable array shape');
      for (const condition of task.conditions) {
        assert.ok(condition.id && typeof condition.passed === 'boolean' && condition.evidence, key + ': every condition needs identity, outcome and evidence');
      }
      conditionSets.push(JSON.stringify(clone(task.conditions)));
    }
    assert.equal(new Set(conditionSets).size, 3, 'three tasks cannot be aliases of one shared veto record');
  }
  assert.ok(statuses.size > 1, 'the grid must exercise actual conditional differences, not a universal status');
});

test('conditional use is a genuine two-sided effect, not synonymous with 成格', () => {
  const conditionalCases = grid.filter(item => item.analysis.useful.decision.conclusion.conditional.length);
  assert.ok(conditionalCases.length, 'the theory grid must exercise at least one two-sided use case');
  let localWithoutFormation = false;
  let conditionalOutsidePeerElement = false;
  for (const item of conditionalCases) {
    const analysis = item.analysis;
    const dayElement = E.constants.STEM_WX[item.pillars.day[0]];
    if (analysis.useful.decision.conclusion.conditional.some(element => element !== dayElement)) conditionalOutsidePeerElement = true;
    for (const route of analysis.useful.decision.routes.filter(route => route.status === 'conditional')) {
      assert.ok(route.benefit && route.risk && route.requirements.length && route.evidence.length, 'a conditional route cannot be just a softened label');
    }
    if (!analysis.specialPatternQualification && (!analysis.regularPattern || !analysis.regularPattern.formed)) localWithoutFormation = true;
  }
  assert.ok(localWithoutFormation, 'a documented local benefit must be representable without claiming a formed natal pattern');
  assert.ok(conditionalOutsidePeerElement, 'two-sided use must not be hard-coded only for the day-master/比劫 element');
});

test('luck evaluation does not rewrite natal decisions or retain previous-year effects', () => {
  const bazi = { pillars: clone(early.pillars), dayStem: early.pillars.day[0], time: { used: clone(earlyTime) }, patternAnalysis: early.analysis };
  const before = JSON.stringify(bazi);
  const first = E.evaluateLuckOutlook(bazi, '丙辰', '丁巳', [{ year: 2026, gz: '丙午' }]);
  E.evaluateLuckOutlook(bazi, '乙卯', '丙辰', [{ year: 2027, gz: '丁未' }]);
  const again = E.evaluateLuckOutlook(bazi, '丙辰', '丁巳', [{ year: 2026, gz: '丙午' }]);
  assert.equal(JSON.stringify(bazi), before, '岁运调用不得改写原局对象、快照或取用仲裁');
  assert.deepEqual(clone(again), clone(first), 'a previous temporal call cannot contaminate later identical evaluation');
});

if (failures.length) {
  console.error('\nUseful-element arbitration: ' + failures.length + ' failed, ' + passed + ' passed');
  process.exitCode = 1;
} else {
  console.log('\nUseful-element arbitration: ' + passed + ' behavioral groups passed (' + grid.length + ' legal theoretical cases)');
}
