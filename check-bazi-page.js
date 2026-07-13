const fs = require('fs');
const crypto = require('crypto');
const vm = require('vm');

const html = fs.readFileSync('bazi.html', 'utf8');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const patternSourceRoot = 'docs/codex/modules/pattern-sources';
const sourceManifest = fs.readFileSync(`${patternSourceRoot}/source-manifest.md`, 'utf8');
const sourceCrosswalk = fs.readFileSync(`${patternSourceRoot}/rule-crosswalk.md`, 'utf8');
const patternBacklog = fs.readFileSync('docs/codex/modules/pattern-optimization-backlog.md', 'utf8');
const theoreticalBaselineDoc = fs.readFileSync('docs/codex/modules/pattern-theoretical-baseline.md', 'utf8');
[
  '《子平真诠》',
  '《三命通会》',
  '《渊海子平》',
  '《滴天髓阐微》',
  '《穷通宝鉴》',
  '《神峰通考》',
  '《五行精纪》',
].forEach((title) => {
  assert(sourceManifest.includes(title), `pattern source manifest should include ${title}`);
  assert(sourceCrosswalk.includes(title), `pattern source crosswalk should include ${title}`);
});
for (let volume = 1; volume <= 12; volume += 1) {
  const file = `${patternSourceRoot}/texts/sanming-tonghui-vol-${String(volume).padStart(2, '0')}.wiki.txt`;
  assert(fs.existsSync(file) && fs.statSync(file).size > 80000, `三命通会 volume ${volume} should be archived`);
}
[
  ['yuanhai-ziping.wiki.txt', '==论月令=='],
  ['ditiansui-chanwei.wiki.txt', '===二十三、清气==='],
  ['qiongtong-baojian.wiki.txt', '=== 三冬甲木 ==='],
  ['wuxing-jingji.wiki.txt', '==《五行精紀》=='],
  ['mingli-zhengzong.wiki.txt', '欲知贵贱'],
].forEach(([name, marker]) => {
  const content = fs.readFileSync(`${patternSourceRoot}/texts/${name}`, 'utf8');
  assert(content.includes(marker), `${name} should contain its expected source marker`);
});
[
  ['ziping-zhenquan.pdf', '71402a780b0351b54edf121a51bc4a4a4ce5896496c35b954563ee06f1a6f620'],
  ['shenfeng-tongkao.pdf', '47b28d1034e372e52a4289c63607a8e8a11e8e80111dcdcfeeca72ea9d6c6c6d'],
].forEach(([name, expectedHash]) => {
  const content = fs.readFileSync(`${patternSourceRoot}/scans/${name}`);
  assert(content.subarray(0, 5).toString() === '%PDF-', `${name} should be a valid PDF snapshot`);
  assert(crypto.createHash('sha256').update(content).digest('hex') === expectedHash, `${name} source hash changed`);
});
assert(patternBacklog.includes('只使用可复算的理论命盘网格'), 'pattern validation should remain theoretical-only');
assert(!patternBacklog.includes('Elon Musk'), 'pattern validation backlog should not keep a real-person candidate');
assert(theoreticalBaselineDoc.includes('ZP-TB-1984-2044-D11-H12-v5') && theoreticalBaselineDoc.includes('23,916') && theoreticalBaselineDoc.includes('不使用名人、朋友'), 'the theoretical baseline document should freeze version, sample count, and no-real-person boundary');

[
  'id="personName"',
  'id="birthTimeDisplay"',
  'id="birthLocationDisplay"',
  'id="locationSearch"',
  'id="solarPreview"',
  'longitudeCorrection',
  'equationCorrection',
  '经度',
  '均时差',
  'id="autoSaveBuild"',
  'id="homeTabs"',
  'id="historyPanel"',
  'id="resultArea"',
  'class="pillar-stack-summary"',
  'class="bazi-tabs"',
  'class="basic-dashboard"',
  'data-view="structure"',
  'data-view="luck"',
  'data-view="ai"',
  'data-home-view="form"',
  'data-home-view="history"',
  'function switchBaziView',
  'function renderLuckPanel',
  'function renderLuckCard',
  'function luckStartYear',
  'function selectLuckPart',
  'function getSelectedLuckContext',
  'function getFlowMonths',
  'function resetLuckSelection',
  'function shenShaForPillar',
  'function renderLuckOrigin',
  'function renderLuckSelector',
  'function renderLuckDetail',
  'class="luck-overview"',
  'class="luck-rail"',
  'class="flow-year-strip"',
  'class="luck-detail"',
  'class="luck-selector"',
  'class="luck-detail-panel"',
  'function renderQuickAiQuestions',
  'function renderTenGodSummary',
  'function renderRelationPanel',
  'function getInquiryTimeInfo',
  'function getLuckData',
  'function editBaziRecord',
  'function deleteBaziRecord',
  'function deleteBaziAiTurn',
  'function rememberBaziAiFold',
  'function collapseAllBaziAi',
  'function editCurrentBaziInput',
  'function fillBaziFormFromData',
  'function normalizeSolarCorrectionData',
  'var aiCollapsed',
  'function syncActiveBaziRecord',
  'var activeBaziRecordId',
  'function renderAiHistoryHtml',
  'function checkBaziFactConflicts',
  'function renderReasoningBasis',
  'function buildBaziReport',
  'function exportBaziReport',
  'id="aiFollowupQuestion"',
  'id="btnAiFollowup"',
  'class="history-actions"',
  'class="ai-turn"',
  '<details class="ai-turn"',
  '<summary class="ai-turn-question">',
  'class="turn-toggle"',
  '一键收起',
  'class="turn-delete"',
  'updatedAt',
  '本地校验',
  '推理依据',
  '结论 -> 依据 -> 反证 -> 不确定处 -> 可验证点',
].forEach((needle) => assert(html.includes(needle), `missing ${needle}`));

assert(!html.includes('sample-btn'), 'sample button should be removed');
assert(!html.includes('载入问真样本'), 'WenZhen sample loader button should be removed');
assert(!/DOMContentLoaded[\s\S]*loadSample\(\)/.test(html), 'opening bazi page should not auto-chart');
assert(!html.includes('data-view="history"'), 'save records should be a top-level tab, not a result tab');
assert(!html.includes('data-view-panel="history"'), 'save records should not live inside result detail panels');
assert(/function showBaziHome\(name\)[\s\S]*data-home-panel/.test(html), 'top-level form/history navigation should exist');
assert(/function buildBazi\(\)[\s\S]*showBaziResult\(\)/.test(html), 'building a chart should enter the result layer');
assert(/function loadBaziRecord\(id\)[\s\S]*showBaziResult\(\)/.test(html), 'loading a saved record should enter the result layer');
assert(/function renderBazi\(data\)[\s\S]*currentBaziView='structure'/.test(html), 'newly rendered charts should default to structure view');
assert(html.includes('<button type="button" class="active" data-view="structure"'), 'structure tab should be active by default');
assert(html.includes('<div class="bazi-view active" data-view-panel="structure"'), 'structure panel should be visible by default');

[
  '基础排盘',
  '格局喜用',
  '大运流年',
  'AI断命',
  '通根',
  '透干',
  '主要格局',
  '特殊格局',
  '格局层次',
  '当前大运',
  '流年参考',
  '展开明细表',
  '原局对照',
  '运势选择',
  '详细信息',
  '命格层次',
  '事业方向',
  '财运方式',
  '感情婚姻',
  '十神分布',
  '地支关系',
  '导出报告',
  '天干关系',
  '关系细断',
  '当前参考年份',
  '本次问事时间',
  '当前农历',
  '节气切年',
  '当前流年参考',
  '大运表',
  '不要自行改写当前年份',
].forEach((needle) => assert(html.includes(needle), `missing stage2 text ${needle}`));

[
  '云南省 昆明市',
  '云南省 曲靖市 麒麟区',
  '云南省 曲靖市 师宗县',
  '云南省 曲靖市 罗平县',
].forEach((name) => assert(html.includes(name), `missing preset location ${name}`));

assert(!html.includes("preset:true,name:'云南省 红河州 泸西县'"), '泸西县 should not be a default preset');
assert(!html.includes("preset:true,name:'云南省 曲靖市 陆良县'"), '陆良县 should not be a default preset');
assert(html.includes('上海市'), 'location search should include Shanghai');
assert(html.includes('id="customLongitude"'), 'missing custom longitude fallback');

const qimen = fs.readFileSync('qimen.js', 'utf8');
const engine = fs.readFileSync('bazi-engine.js', 'utf8');
assert(html.includes('<script src="bazi-engine.js"></script>'), 'bazi page should load bazi-engine.js');
const defaultFormMatch = html.match(/function resetBaziFormToNow\(\)[\s\S]*?\n}/);
assert(defaultFormMatch && defaultFormMatch[0].includes('var now=new Date()'), 'bazi default form should use open-time date');
assert(defaultFormMatch && !defaultFormMatch[0].includes('buildBazi()'), 'opening bazi page should not auto-build a chart');
[
  'window.BaziEngine',
  'function analyzePattern',
  'function shenShaForPillar',
  'SHENSHA_RULES',
].forEach((needle) => assert(engine.includes(needle), `engine missing ${needle}`));
const sample = qimen + `
function dayOfYear(y,m,d){var start=new Date(y,0,0);return Math.floor((new Date(y,m-1,d)-start)/86400000)}
function equationOfTimeMinutes(y,m,d){var n=dayOfYear(y,m,d);var b=2*Math.PI*(n-81)/364;return 9.87*Math.sin(2*b)-7.53*Math.cos(b)-1.5*Math.sin(b)}
function addMinutes(t,mins){var dt=new Date(t.year,t.month-1,t.day,t.hour,t.minute+Math.round(mins));return {year:dt.getFullYear(),month:dt.getMonth()+1,day:dt.getDate(),hour:dt.getHours(),minute:dt.getMinutes()}}
function buildPillars(t){var dayDate=new Date(t.year,t.month-1,t.day);if(t.hour>=23)dayDate.setDate(dayDate.getDate()+1);var day=getDayGZ(dayDate.getFullYear(),dayDate.getMonth()+1,dayDate.getDate());return {year:getYearGZ(t.year,t.month,t.day),month:getMonthGZ(t.year,t.month,t.day),day:day,hour:getHourGZ(day,t.hour)}}
var input={year:1990,month:5,day:7,hour:7,minute:0};
var corr=(103.805-120)*4+equationOfTimeMinutes(1990,5,7);
var used=addMinutes(input,corr);
JSON.stringify({used:used,pillars:buildPillars(used)});
`;
const result = JSON.parse(vm.runInNewContext(sample, { Date, Math, JSON }));
assert(result.used.year === 1990 && result.used.month === 5 && result.used.day === 7, 'sample true-solar date changed');
assert(result.used.hour === 5 && Math.abs(result.used.minute - 59) <= 1, `sample true-solar time ${result.used.hour}:${result.used.minute} not close to 05:59`);
assert(JSON.stringify(result.pillars) === JSON.stringify({ year: '庚午', month: '辛巳', day: '壬申', hour: '癸卯' }), `sample pillars mismatch: ${JSON.stringify(result.pillars)}`);
assert(html.indexOf('class="entry-card"') < html.indexOf('id="resultArea"'), 'input form should sit above the always-visible result area as a collapsed editor');
assert(html.includes('<details id="entryPanel"'), 'input editor should be a collapsible details panel');
assert(html.includes('data-view="basic"'), 'result layer should expose a basic information tab');
assert(/function buildBazi\(\)[\s\S]*showBaziResult\(\)/.test(html), 'buildBazi should enter the result layer after charting');
assert(/function buildBazi\(\)[\s\S]*autoSaveBuild[\s\S]*saveBaziRecord/.test(html), 'buildBazi should auto-save when the checkbox is enabled');
assert(/function buildBazi\(\)[\s\S]*editingActiveRecord[\s\S]*saveBaziRecord/.test(html), 'editing a saved bazi should sync the saved record after rebuilding');
assert(html.includes('修改时间和地址') && html.includes('onclick="editCurrentBaziInput()"'), 'basic info should expose an edit time/location action');
assert(!html.includes('id="personName" type="text" value="测试"'), 'bazi name input should not default to 测试');
const aiPanelMatch = html.match(/function renderAiPanel\(\)[\s\S]*?function renderQuickAiQuestions/);
assert(aiPanelMatch && !aiPanelMatch[0].includes('historyList'), 'save records should not live inside AI panel');
assert(/@media\(max-width:520px\)[\s\S]*pillar-table-wrap \.pillar-table\{min-width:0;table-layout:fixed\}/.test(html), 'mobile pillar table should fit viewport instead of forcing horizontal scroll');
assert(/pillar-table tr:last-child th,\.pillar-table tr:last-child td\{vertical-align:top\}/.test(html), 'shensha row should align content to top');
assert(/@media\(max-width:520px\)[\s\S]*pillar-table tr:last-child td\{font-size:10px;line-height:1\.3;text-align:center\}/.test(html), 'mobile shensha cells should stay horizontally aligned with pillar columns');

const inlineScripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
const scriptContext = {
  console,
  Date,
  Math,
  JSON,
  prompt: () => '',
  confirm: () => true,
  localStorage: { getItem: () => null, setItem: () => {} },
  document: {
    addEventListener() {},
    querySelector: () => ({ value: '男' }),
    querySelectorAll: () => [],
    getElementById: () => ({
      value: '',
      checked: false,
      disabled: false,
      textContent: '',
      innerHTML: '',
      hidden: false,
      classList: { toggle() {}, add() {}, remove() {} },
      style: {},
      focus() {},
    }),
  },
};
vm.createContext(scriptContext);
vm.runInContext(qimen, scriptContext, { filename: 'qimen.js' });
vm.runInContext(engine, scriptContext, { filename: 'bazi-engine.js' });
inlineScripts.forEach((script, index) => vm.runInContext(script, scriptContext, { filename: `bazi-inline-${index}.js` }));
assert(scriptContext.recordPersonFromTitle({ name: '张黎 丁酉日', bazi: { person: '测试' } }) === '张黎', 'legacy saved record should derive person from title when bazi.person is default 测试');
assert(scriptContext.recordPersonFromTitle({ name: '事业盘 丁酉日', bazi: { person: '王五' } }) === '王五', 'saved record should keep explicit bazi.person');
assert(scriptContext.BaziEngine, 'BaziEngine should load in VM');
assert(typeof scriptContext.BaziEngine.analyzePattern === 'function', 'BaziEngine.analyzePattern should exist');
scriptContext.currentBazi = {
  person: '测试',
  gender: '男',
  pillars: { year: '癸酉', month: '癸亥', day: '丁酉', hour: '庚子' },
  dayStem: '丁',
  dayElement: '火',
  time: {
    used: { year: 1990, month: 5, day: 7, hour: 5, minute: 59 },
    input: { year: 1990, month: 5, day: 7, hour: 7, minute: 0 },
    enabled: true,
    correction: -61,
    location: { name: '云南省 曲靖市 麒麟区', lng: 103.805, lat: 25.4951 },
  },
};
const luckContext = scriptContext.getSelectedLuckContext(scriptContext.currentBazi);
assert(luckContext.years.length === 10, 'selected luck should expose 10 flow years');
assert(luckContext.months.length === 12, 'selected flow year should expose 12 flow months');
assert(luckContext.luck.rows.length === 10, 'luck selector should expose 10 decade luck periods');
assert(luckContext.luckRow && luckContext.flowYear, 'selected luck context should include luck/year');
assert(luckContext.flowMonth == null, 'flow month should be unselected by default');
assert(luckContext.months[0].term === '立春' && luckContext.months[0].dateLabel.includes('/'), 'flow months should be keyed by solar terms with Gregorian dates');
assert(scriptContext.renderLuckPanel(scriptContext.currentBazi).includes('class="luck-selector"'), 'luck panel should render stacked selector');
assert(!scriptContext.renderLuckPanel(scriptContext.currentBazi).includes('class="luck-origin"'), 'luck panel should not repeat origin comparison');
assert(scriptContext.renderLuckSelector(scriptContext.currentBazi, luckContext).includes('fortune-scroll luck-scroll'), 'decade luck can keep horizontal scroll when needed');
assert(scriptContext.renderLuckSelector(scriptContext.currentBazi, luckContext).includes('fortune-grid year-grid'), 'flow years should use fixed 10-cell grid');
assert(scriptContext.renderLuckSelector(scriptContext.currentBazi, luckContext).includes('fortune-grid month-grid'), 'flow months should use fixed 12-cell grid');
assert(!/class="fortune-item month-item active"/.test(scriptContext.renderLuckSelector(scriptContext.currentBazi, luckContext)), 'month buttons should not be active by default');
assert(!scriptContext.renderPillarTable(scriptContext.currentBazi).includes('大运') && !scriptContext.renderPillarTable(scriptContext.currentBazi).includes('流年'), 'pillar table should show only natal pillars by default');
assert(scriptContext.renderPillarTable(scriptContext.currentBazi, true).includes('大运') && scriptContext.renderPillarTable(scriptContext.currentBazi, true).includes('流年'), 'pillar table should include luck/year only in luck view');
assert(scriptContext.renderPillarTable(scriptContext.currentBazi).includes('神煞'), 'pillar table should include shensha row');
scriptContext.luckSelection.month = 0;
const monthContext = scriptContext.getSelectedLuckContext(scriptContext.currentBazi);
assert(monthContext.flowMonth && !scriptContext.renderPillarTable(scriptContext.currentBazi).includes('流月'), 'pillar table should still hide flow month outside luck view');
assert(monthContext.flowMonth && scriptContext.renderPillarTable(scriptContext.currentBazi, true).includes('流月'), 'pillar table should include flow month in luck view after month selection');
scriptContext.luckSelection = { luck: 9, year: 9, month: 9 };
scriptContext.resetLuckSelection();
const resetContext = scriptContext.getSelectedLuckContext(scriptContext.currentBazi);
assert(resetContext.monthIndex == null && resetContext.luckRow.active && resetContext.flowYear.year === resetContext.luck.currentYear, 'reset should select current luck/year for each chart');
const referenceBazi = {
  person: '签夏',
  gender: '男',
  pillars: { year: '癸酉', month: '己未', day: '丙申', hour: '壬辰' },
  dayStem: '丙',
  dayElement: '火',
  time: { used: { year: 1993, month: 7, day: 14, hour: 8, minute: 40 }, input: { year: 1993, month: 7, day: 14, hour: 8, minute: 40 }, enabled: false, correction: 0, location: { name: '参考', lng: 103.805, lat: 25.4951 } },
};
const referenceLuck = scriptContext.getLuckData(referenceBazi);
const referencePattern = scriptContext.BaziEngine.analyzePattern(referenceBazi);
const conciseReferenceBazi = { ...referenceBazi, scores: scriptContext.BaziEngine.scoreWuxing(referenceBazi.pillars), relations: [] };
const conciseStructureHtml = scriptContext.renderStructure(conciseReferenceBazi);
assert(['主要格局', '格局层次', '成格结论', '用神总论', '当前大运格局'].every((label) => conciseStructureHtml.includes(label)), `structure page should keep the direct conclusion cards, got ${conciseStructureHtml}`);
assert(!/ZP-[A-Z]/.test(conciseStructureHtml) && !conciseStructureHtml.includes('理论结构位置：') && !conciseStructureHtml.includes('<strong>格局状态</strong>') && !conciseStructureHtml.includes('<strong>格局成败</strong>') && !conciseStructureHtml.includes('<strong>成败因子</strong>') && !conciseStructureHtml.includes('<strong>干支提示</strong>'), 'structure page should suppress internal rule ids, score diagnostics, and duplicate cards');
assert(scriptContext.buildPatternContextText(conciseReferenceBazi).includes('ZP-MG-06') && scriptContext.buildPatternContextText(conciseReferenceBazi).includes('理论结构位置：'), 'AI context should retain the hidden technical rule and baseline evidence');
assert(typeof scriptContext.BaziEngine.strengthScore === 'function', 'BaziEngine should expose weighted strengthScore');
const referenceStrength = scriptContext.BaziEngine.assessStrength(referenceBazi.dayStem, referenceBazi.pillars, scriptContext.BaziEngine.scoreWuxing(referenceBazi.pillars));
assert(referenceStrength === '\u5f31' || referenceStrength === '\u504f\u5f31', `reference chart should be weak or slightly weak by weighted support model, got ${referenceStrength}`);
const strongSeasonBazi = {
  person: 'strong sample',
  gender: '\u7537',
  pillars: { year: '\u7678\u536f', month: '\u7532\u5bc5', day: '\u7532\u5bc5', hour: '\u4e59\u4ea5' },
  dayStem: '\u7532',
  dayElement: '\u6728',
  time: { used: { year: 1993, month: 3, day: 1, hour: 22, minute: 0 }, input: { year: 1993, month: 3, day: 1, hour: 22, minute: 0 }, enabled: false, correction: 0, location: { name: 'sample', lng: 120, lat: 30 } },
};
const strongScore = scriptContext.BaziEngine.strengthScore(strongSeasonBazi.dayStem, strongSeasonBazi.pillars);
assert(strongScore.support >= 65, `strong rooted chart should receive high support score, got ${strongScore.support}`);
assert(strongScore.dimensions && strongScore.dimensions.command && strongScore.dimensions.roots && strongScore.dimensions.momentum, 'strength score should expose 得令、得地、得势 dimensions');
assert(strongScore.evidence.some((x) => x.includes('得令')) && strongScore.evidence.some((x) => x.includes('得地')) && strongScore.evidence.some((x) => x.includes('得势')), `strength evidence should explain all three dimensions, got ${JSON.stringify(strongScore.evidence)}`);
assert(scriptContext.strengthEvidenceText(strongSeasonBazi).includes('得令') && scriptContext.strengthEvidenceText(strongSeasonBazi).includes('得地'), 'structure view should render the new strength evidence');
assert(scriptContext.BaziEngine.assessStrength(strongSeasonBazi.dayStem, strongSeasonBazi.pillars, scriptContext.BaziEngine.scoreWuxing(strongSeasonBazi.pillars)) === '\u5f3a', 'strong rooted chart should be classified as strong');
const calmRootsScore = scriptContext.BaziEngine.strengthScore('甲', { year: '甲寅', month: '甲寅', day: '甲寅', hour: '甲寅' });
const clashedRootsScore = scriptContext.BaziEngine.strengthScore('甲', { year: '甲寅', month: '甲寅', day: '甲寅', hour: '甲申' });
assert(clashedRootsScore.support < calmRootsScore.support, `clashed roots should contribute less support, got calm ${calmRootsScore.support} vs clashed ${clashedRootsScore.support}`);
assert(clashedRootsScore.dimensions.roots.items.some((x) => x.attacked), `clashed root evidence should mark attacked roots, got ${JSON.stringify(clashedRootsScore.dimensions.roots.items)}`);
const waterGroupScore = scriptContext.BaziEngine.strengthScore('甲', { year: '庚申', month: '壬子', day: '甲辰', hour: '戊午' });
assert(waterGroupScore.interactions.groups.some((x) => x.name === '三合水局' && x.complete), `complete 申子辰 should be recognized as a three-harmony water group, got ${JSON.stringify(waterGroupScore.interactions.groups)}`);
assert(waterGroupScore.dimensions.momentum.interactionAdjustment > 0, `resource-element harmony group should contribute to 得势, got ${JSON.stringify(waterGroupScore.dimensions.momentum)}`);
const harmedRootScore = scriptContext.BaziEngine.strengthScore('甲', { year: '甲卯', month: '甲寅', day: '甲子', hour: '甲辰' });
assert(harmedRootScore.interactions.branchPairs.some((x) => x.type === '害' && x.text.includes('卯辰')), `卯辰 should be exposed as a branch harm, got ${JSON.stringify(harmedRootScore.interactions.branchPairs)}`);
assert(harmedRootScore.dimensions.roots.items.some((x) => x.branch === '卯' && x.attacks.includes('害')), `harmed same-element root should record the attack type, got ${JSON.stringify(harmedRootScore.dimensions.roots.items)}`);
const contestedCombineScore = scriptContext.BaziEngine.strengthScore('己', { year: '己未', month: '甲寅', day: '己丑', hour: '丙午' });
assert(contestedCombineScore.interactions.stemCombines.length === 2 && contestedCombineScore.interactions.stemCombines.every((x) => x.status === '争合受阻' && x.effect === 'contest'), `two stems competing for the same combine should remain contested instead of transforming, got ${JSON.stringify(contestedCombineScore.interactions.stemCombines)}`);
const combineClashScore = scriptContext.BaziEngine.strengthScore('丙', { year: '甲子', month: '乙丑', day: '丙午', hour: '丁酉' });
assert(combineClashScore.interactions.branchPairs.some((x) => x.type === '六合' && x.status === '合中逢冲') && combineClashScore.interactions.branchPairs.some((x) => x.type === '冲' && x.active && x.resolution === '冲合并见，合不解冲'), `a combine sharing a branch with a clash should retain both relations and block silent transformation, got ${JSON.stringify(combineClashScore.interactions.branchPairs)}`);
const groupPriorityScore = scriptContext.BaziEngine.strengthScore('甲', { year: '庚申', month: '壬子', day: '甲辰', hour: '丁巳' });
assert(groupPriorityScore.interactions.groups.some((x) => x.name === '三合水局' && x.active && x.status === '成局有力'), `a supported complete three-harmony group should be effective, got ${JSON.stringify(groupPriorityScore.interactions.groups)}`);
assert(groupPriorityScore.interactions.branchPairs.filter((x) => x.left === 0 && x.right === 3).every((x) => !x.active && x.suppressedBy === '三合水局'), `the complete three-harmony group should outrank the overlapping combine, punishment, and break, got ${JSON.stringify(groupPriorityScore.interactions.branchPairs)}`);
const transformedCombineScore = scriptContext.BaziEngine.strengthScore('甲', { year: '甲寅', month: '乙亥', day: '甲辰', hour: '丁酉' });
assert(transformedCombineScore.interactions.branchPairs.some((x) => x.type === '六合' && x.text.includes('寅亥') && x.effect === 'transform'), `a target supported by month qi and overall momentum should expose a transformation tendency, got ${JSON.stringify(transformedCombineScore.interactions.branchPairs)}`);
assert(transformedCombineScore.interactions.branchPairs.some((x) => x.type === '破' && x.text.includes('寅亥') && !x.active && x.status === '破受合制') && transformedCombineScore.dimensions.roots.items.filter((x) => x.branch === '寅' || x.branch === '亥').every((x) => !x.attacked), `a supported direct combine should suppress its lower-priority break before root scoring, got ${JSON.stringify({ pairs: transformedCombineScore.interactions.branchPairs, roots: transformedCombineScore.dimensions.roots.items })}`);
const interactionRuleBazi = { person: 'interaction sample', gender: '男', pillars: { year: '甲子', month: '乙丑', day: '丙午', hour: '丁酉' }, dayStem: '丙', dayElement: '火', time: { used: { year: 1993, month: 1, day: 1, hour: 18, minute: 0 }, input: { year: 1993, month: 1, day: 1, hour: 18, minute: 0 }, enabled: false, correction: 0, location: { name: 'sample', lng: 120, lat: 30 } } };
assert(scriptContext.interactionText(interactionRuleBazi).includes('合冲裁决：') && !scriptContext.interactionText(interactionRuleBazi).includes('ZP-HC-01') && scriptContext.interactionText(interactionRuleBazi).includes('冲合并见'), `structure view should render a readable arbitration conclusion without internal rule ids, got ${scriptContext.interactionText(interactionRuleBazi)}`);
assert(scriptContext.interactionText(interactionRuleBazi, true).includes('ZP-HC-01'), 'technical interaction context should retain arbitration rule ids');
const weakSeasonBazi = {
  person: 'weak sample',
  gender: '\u7537',
  pillars: { year: '\u5e9a\u7533', month: '\u58ec\u5b50', day: '\u4e19\u7533', hour: '\u58ec\u5b50' },
  dayStem: '\u4e19',
  dayElement: '\u706b',
  time: { used: { year: 1993, month: 12, day: 1, hour: 0, minute: 0 }, input: { year: 1993, month: 12, day: 1, hour: 0, minute: 0 }, enabled: false, correction: 0, location: { name: 'sample', lng: 120, lat: 30 } },
};
const weakScore = scriptContext.BaziEngine.strengthScore(weakSeasonBazi.dayStem, weakSeasonBazi.pillars);
assert(weakScore.support < 30, `unsupported winter fire chart should receive low support score, got ${weakScore.support}`);
assert(scriptContext.BaziEngine.assessStrength(weakSeasonBazi.dayStem, weakSeasonBazi.pillars, scriptContext.BaziEngine.scoreWuxing(weakSeasonBazi.pillars)) === '\u5f31', 'unsupported winter fire chart should be classified as weak');
const weakWinterPattern = scriptContext.BaziEngine.analyzePattern(weakSeasonBazi);
assert(weakWinterPattern.useful.layers && weakWinterPattern.useful.layers.fuyi && weakWinterPattern.useful.layers.tiaohou && weakWinterPattern.useful.layers.pattern, 'useful elements should expose fuyi/tiaohou/pattern layers');
const winterTiaohou = weakWinterPattern.useful.validationLayers ? weakWinterPattern.useful.validationLayers.tiaohou : weakWinterPattern.useful.layers.tiaohou;
assert(winterTiaohou.use.includes('\u706b') && winterTiaohou.use.includes('\u6728'), 'winter chart should retain the cold-season fire/wood reference in its active layer or special-pattern validation background');
assert(Array.isArray(weakWinterPattern.useful.primaryUse) && Array.isArray(weakWinterPattern.useful.secondaryUse), 'useful elements should separate primary and secondary choices');
assert(!weakWinterPattern.useful.primaryUse.some((x) => weakWinterPattern.useful.avoid.includes(x)), `primary useful elements must not also appear as avoid, got ${JSON.stringify(weakWinterPattern.useful)}`);
assert(['得令', '得地', '得势'].every((label) => weakScore.evidence.some((x) => x.startsWith(label))), `strength evidence should expose qualitative 子平 dimensions, got ${JSON.stringify(weakScore.evidence)}`);
assert(!weakScore.evidence.some((x) => /\/40|\/100|\d+(?:\.\d+)?分/.test(x)), `displayed strength evidence should not present internal numeric thresholds as doctrine, got ${JSON.stringify(weakScore.evidence)}`);
assert(scriptContext.usefulPriorityText(weakSeasonBazi).includes('结论：主用') && !scriptContext.usefulPriorityText(weakSeasonBazi).includes('月令用神（定格）'), 'structure view should show one concise final useful-element decision');
assert(['月令用神（定格）', '扶抑喜用', '调候神', '最终主用'].every((label) => scriptContext.usefulPriorityText(weakSeasonBazi, true).includes(label)), 'technical useful context should retain the detailed role split');
const extremeColdPattern = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '壬子', month: '癸亥', day: '丁酉', hour: '壬子' }, dayStem: '丁' });
assert(extremeColdPattern.useful.layers.tiaohou.priority === '主用', `water-heavy winter chart should elevate climate correction, got ${JSON.stringify(extremeColdPattern.useful.layers.tiaohou)}`);
assert(referencePattern.primary.includes('伤官'), `reference pattern should use month command, got ${referencePattern.primary}`);
assert(referencePattern.evidence.some((x) => x.includes('月令')), 'pattern evidence should include month command');
assert(referencePattern.evidence.some((x) => x.includes('透干')), 'pattern evidence should include revealed stems');
assert(referencePattern.evidence.some((x) => x.includes('通根')), 'pattern evidence should include roots');
assert(referencePattern.useful.use.length > 0, 'pattern analysis should include useful elements');
assert(referencePattern.mainPattern === '食神制杀格' && referencePattern.comboPatterns.includes('食神制杀格'), `reference chart should retain the formed food-control route under its month-command injury pattern, got ${JSON.stringify({ primary: referencePattern.primary, main: referencePattern.mainPattern, combos: referencePattern.comboPatterns })}`);
assert(!referencePattern.patternIssues.some((x) => x.includes('食伤混杂')) && referencePattern.comboClues.some((x) => x.name === '食伤分工参考'), `month-command injury and hidden food with a separate killing-control duty should be treated as functional division, got ${JSON.stringify({ issues: referencePattern.patternIssues, clues: referencePattern.comboClues })}`);
assert(referencePattern.interactionFlow.steps.some((x) => x.active && x.left && x.left.text.includes('辰藏戊食神') && x.right && x.right.text.includes('壬七杀')), `flow selection should prefer the reachable same-pillar food-control relation over a same-branch hidden pair, got ${JSON.stringify(referencePattern.interactionFlow)}`);
assert(referencePattern.patternDisease.ruleId === 'ZP-NET-01' && referencePattern.patternDisease.items.length === 2 && referencePattern.patternDisease.partial.length === 2 && referencePattern.patternDisease.unresolved.length === 0, `the reference chart should deduplicate injury-officer and weak-output diseases, then recognize rooted-but-hidden medicine as partial rescue, got ${JSON.stringify(referencePattern.patternDisease)}`);
assert(referencePattern.patternLevelGrade === '高' && referencePattern.patternLevelHardGate.candidateGrade === '高' && !referencePattern.patternLevelHardGate.topEligible && referencePattern.patternLevelCriteria.some((x) => x.name === '病药净结算' && x.result.includes('部分化解2')), `partial medicine should retain its theoretical candidate without becoming top-eligible or stacking duplicate deductions, got ${JSON.stringify({ grade: referencePattern.patternLevelGrade, gate: referencePattern.patternLevelHardGate, criteria: referencePattern.patternLevelCriteria })}`);
assert(referencePattern.useful.conditionalUse.some((x) => x.element === '火' && x.risk.includes('分财')) && referencePattern.useful.secondaryUse.includes('火') && !referencePattern.useful.avoid.includes('火'), `weak fire should be a conditional helper with peer-wealth risk instead of a pure enemy element, got ${JSON.stringify(referencePattern.useful)}`);
assert(referencePattern.useful.specific.primary.some((x) => x.element === '木' && x.state === '有根未透') && scriptContext.usefulPriorityText(referenceBazi).includes('条件用神：火') && scriptContext.usefulPriorityText(referenceBazi, true).includes('有根未透'), `the page should keep conditional fire concise while technical context retains hidden medicine, got ${scriptContext.usefulPriorityText(referenceBazi)}`);
assert(scriptContext.patternFactorText(referenceBazi).includes('病药净结算：') && scriptContext.patternFactorText(referenceBazi).includes('仍有残病'), `formation factors should show disease, medicine, effect, and residual disease, got ${scriptContext.patternFactorText(referenceBazi)}`);
assert(referencePattern.analysisMeta.engineVersion === 'BAZI-PATTERN-2026.07.14.2' && referencePattern.analysisMeta.ruleVersion === 'ZP-2026.07.14.1' && referencePattern.analysisMeta.baselineVersion === 'ZP-TB-1984-2044-D11-H12-v5' && referencePattern.analysisMeta.scoreModelVersion === 'ZP-SCORE-2026.07.14-v2' && referencePattern.analysisMeta.baselineScope.includes('不使用真人结果标签'), `pattern results should expose the frozen engine/rule/baseline/score versions and theoretical-only scope, got ${JSON.stringify(referencePattern.analysisMeta)}`);
assert(Number.isInteger(referencePattern.patternRawScore) && referencePattern.patternRawScore >= 0 && referencePattern.patternRawScore <= 100 && typeof referencePattern.patternPercentile === 'number' && referencePattern.natalPatternLevel.percentile === referencePattern.patternPercentile, `each natal chart should receive a bounded structural raw score and stable theoretical percentile, got ${JSON.stringify({ score: referencePattern.patternRawScore, percentile: referencePattern.patternPercentile, level: referencePattern.natalPatternLevel })}`);
const referenceScoreLedger = referencePattern.patternRawScoreBreakdown;
assert(referenceScoreLedger.modelVersion === referencePattern.analysisMeta.scoreModelVersion && referenceScoreLedger.method.includes('六维线性加权') && referenceScoreLedger.method.includes('格名文字不直接决定') && referenceScoreLedger.method.includes('不使用现实人物结果标签'), `raw score should expose the agreed authority score model and boundary, got ${JSON.stringify(referenceScoreLedger)}`);
assert(JSON.stringify(referenceScoreLedger.dimensions.map((x) => [x.key, x.weight])) === JSON.stringify([['potential',20],['formation',25],['flow',20],['clarity',15],['remedy',15],['balance',5]]) && referenceScoreLedger.dimensions.every((x) => typeof x.score === 'number' && typeof x.contribution === 'number' && x.evidence), `raw score should expose six attributable weighted dimensions with an independent classical-potential layer, got ${JSON.stringify(referenceScoreLedger.dimensions)}`);
assert(Math.abs(referenceScoreLedger.dimensions.reduce((sum, x) => sum + x.contribution, 0) - referenceScoreLedger.unroundedScore) < 0.001 && Math.round(referenceScoreLedger.unroundedScore) === referenceScoreLedger.score && referenceScoreLedger.totalWeight === 100, `dimension contributions should reproduce the final raw score, got ${JSON.stringify(referenceScoreLedger)}`);
const theoreticalBaseline = scriptContext.BaziEngine.theoreticalBaseline;
assert(theoreticalBaseline.version === 'ZP-TB-1984-2044-D11-H12-v5' && theoreticalBaseline.scoreModelVersion === 'ZP-SCORE-2026.07.14-v2' && theoreticalBaseline.config.stepDays === 11 && theoreticalBaseline.config.hours.length === 12 && theoreticalBaseline.config.deduplicate === 'fourPillars' && theoreticalBaseline.config.trueSolarCorrection === false, `the frozen theoretical grid should expose its complete sampling contract, got ${JSON.stringify(theoreticalBaseline)}`);
assert(Object.values(theoreticalBaseline.histogram).reduce((sum, count) => sum + count, 0) === 23916 && theoreticalBaseline.stats.uniqueCount === 23916 && theoreticalBaseline.stats.scoreRange.min === 23 && theoreticalBaseline.stats.scoreRange.max === 89 && theoreticalBaseline.stats.quantiles.p20 === 34 && theoreticalBaseline.stats.quantiles.p80 === 75, `the frozen histogram and quantile boundaries should match the reproducible v5 baseline, got ${JSON.stringify(theoreticalBaseline.stats)}`);
assert(JSON.stringify(theoreticalBaseline.stats.candidateGradeCounts) === JSON.stringify({偏低:1117,中等:3944,偏高:13297,高:4345,顶级:1213}) && JSON.stringify(theoreticalBaseline.stats.gradeCounts) === JSON.stringify({偏低:1117,中等:3944,偏高:13869,高:3791,顶级:1195}) && theoreticalBaseline.stats.gradePercentages.顶级 === 5, `the frozen candidate and hard-gated grade distributions should match the full theoretical grid, got ${JSON.stringify(theoreticalBaseline.stats)}`);
assert(JSON.stringify(scriptContext.BaziEngine.constants.THEORETICAL_LEVEL_BANDS.map((x) => [x.grade, x.min, x.max])) === JSON.stringify([['偏低',0,5],['中等',5,20],['偏高',20,80],['高',80,95],['顶级',95,100.1]]), `the five theoretical bands should remain frozen and public, got ${JSON.stringify(scriptContext.BaziEngine.constants.THEORETICAL_LEVEL_BANDS)}`);
assert([0,4.9,5,19.9,20,79.9,80,94.9,95,100].map((p) => scriptContext.BaziEngine.theoreticalGradeFromPercentile(p).grade).join(',') === '偏低,偏低,中等,中等,偏高,偏高,高,高,顶级,顶级', 'percentile boundaries should map deterministically to the agreed five public grades');
assert(scriptContext.BaziEngine.formatPatternPercentile(0) === '低于P0.1' && scriptContext.BaziEngine.formatPatternPercentile(100) === '高于P99.9' && scriptContext.BaziEngine.formatPatternPercentile(62.3) === 'P62.3', 'percentile endpoints should use friendly display text without changing numeric ranking');
assert(referencePattern.patternLevelHardGate.ruleIds.join(',') === 'ZP-LV-01,ZP-LV-02,ZP-LV-03,ZP-NET-01' && referencePattern.patternLevelHardGate.tiePolicy.includes('不随机拆分') && referencePattern.patternLevelCriteria.some((x) => x.name === '理论分档') && referencePattern.patternLevelCriteria.some((x) => x.name === '子平硬门槛'), `each final grade should expose candidate band, hard gates, disease netting, and tie policy, got ${JSON.stringify(referencePattern.patternLevelHardGate)}`);
assert(crypto.createHash('sha256').update(JSON.stringify(theoreticalBaseline.histogram)).digest('hex') === '641a9bd954a5e310ab69c072b40b035feef0feb461805d7085e91030cc7bf4dd', 'the frozen theoretical histogram hash should not drift without a new baseline version');
const miniatureBaselineA = scriptContext.BaziEngine.buildTheoreticalPatternBaseline({ start: '1984-02-04', endExclusive: '1984-03-04', stepDays: 11, hours: [0, 12] });
const miniatureBaselineB = scriptContext.BaziEngine.buildTheoreticalPatternBaseline({ start: '1984-02-04', endExclusive: '1984-03-04', stepDays: 11, hours: [0, 12] });
assert(miniatureBaselineA.uniqueCount === 6 && JSON.stringify(miniatureBaselineA.histogram) === JSON.stringify(miniatureBaselineB.histogram) && miniatureBaselineA.candidateGradeCounts && miniatureBaselineA.gradeCounts && miniatureBaselineA.scoreModelVersion === 'ZP-SCORE-2026.07.14-v2' && miniatureBaselineA.scope.includes('不含真人资料'), `the two-pass theoretical baseline generator should be deterministic, complete, and theoretical-only, got ${JSON.stringify(miniatureBaselineA)}`);
if (process.env.BAZI_FULL_PATTERN_BASELINE === '1') {
  const rebuiltBaseline = scriptContext.BaziEngine.buildTheoreticalPatternBaseline();
  const frozenGrades = ['偏低','中等','偏高','高','顶级'];
  const countsMatch = (actual, expected) => frozenGrades.every((grade) => actual[grade] === expected[grade]);
  assert(JSON.stringify(rebuiltBaseline.histogram) === JSON.stringify(theoreticalBaseline.histogram) && JSON.stringify(rebuiltBaseline.quantiles) === JSON.stringify(theoreticalBaseline.stats.quantiles) && countsMatch(rebuiltBaseline.candidateGradeCounts, theoreticalBaseline.stats.candidateGradeCounts) && countsMatch(rebuiltBaseline.gradeCounts, theoreticalBaseline.stats.gradeCounts), `full theoretical baseline rebuild should reproduce the frozen v5 constants, got ${JSON.stringify(rebuiltBaseline)}`);
}
assert(!scriptContext.patternLevelText(referenceBazi).includes('理论结构位置：') && !scriptContext.patternLevelText(referenceBazi).includes('原始结构分') && !scriptContext.patternLevelText(referenceBazi).includes('ZP-') && scriptContext.patternLevelText(referenceBazi).startsWith(referencePattern.patternLevelGrade) && scriptContext.patternLevelText(referenceBazi).endsWith('理论位置：'+referencePattern.patternPercentileText), `the page level output should keep the direct grade, append only the friendly P position, and suppress internal scoring details, got ${scriptContext.patternLevelText(referenceBazi)}`);
assert(scriptContext.patternLevelText(referenceBazi, true).includes('理论结构位置：') && scriptContext.patternLevelText(referenceBazi, true).includes(referencePattern.patternPercentileText) && scriptContext.patternLevelText(referenceBazi, true).includes('评分维度：') && scriptContext.patternLevelText(referenceBazi, true).includes('ZP-SCORE-2026.07.14-v2'), `technical level context should retain the frozen percentile and multidimensional score ledger, got ${scriptContext.patternLevelText(referenceBazi, true)}`);
assert(referencePattern.natalPatternLevel.grade === referencePattern.patternLevelGrade && referencePattern.natalPatternLevel.scope === '原局结构固定结论' && referencePattern.realizationBoundary.localScope.length === 2 && referencePattern.realizationBoundary.text.includes('不代表人的价值'), `natal level and reality boundary should be explicit structured outputs, got ${JSON.stringify({ level: referencePattern.natalPatternLevel, boundary: referencePattern.realizationBoundary })}`);
const repeatedReferencePattern = scriptContext.BaziEngine.analyzePattern(referenceBazi);
assert(JSON.stringify({ grade: repeatedReferencePattern.patternLevelGrade, main: repeatedReferencePattern.mainPattern, disease: repeatedReferencePattern.patternDisease, useful: repeatedReferencePattern.useful }) === JSON.stringify({ grade: referencePattern.patternLevelGrade, main: referencePattern.mainPattern, disease: referencePattern.patternDisease, useful: referencePattern.useful }), 'the same pillars and rule version should return the same natal pattern result');
assert(scriptContext.buildPatternContextText(referenceBazi).includes('现实兑现边界：') && scriptContext.buildPatternContextText(referenceBazi).includes('不代表人的价值'), 'AI context should receive the same three-layer realization boundary as the page');
const killSealBazi = {
  person: '格局样本',
  gender: '男',
  pillars: { year: '戊寅', month: '戊午', day: '辛丑', hour: '壬辰' },
  dayStem: '辛',
  dayElement: '金',
  time: { used: { year: 1998, month: 6, day: 1, hour: 8, minute: 0 }, input: { year: 1998, month: 6, day: 1, hour: 8, minute: 0 }, enabled: false, correction: 0, location: { name: '参考', lng: 120, lat: 30 } },
};
const killSealPattern = scriptContext.BaziEngine.analyzePattern(killSealBazi);
assert(killSealPattern.primary.includes('七杀'), `month-command line should still be 七杀, got ${killSealPattern.primary}`);
assert(killSealPattern.comboPatterns.some((x) => x.includes('杀印相生')), `combo pattern should include 杀印相生, got ${killSealPattern.comboPatterns.join(',')}`);
assert(killSealPattern.useful.layers.pattern.use.includes('土'), 'kill-seal pattern should use resource/印 as pattern-use anchor');
assert(killSealPattern.patternLevel.includes('有力') && killSealPattern.patternLevel.includes('清纯'), 'pattern level should explain force, affection, purity, and rescue instead of grading by name alone');
assert(killSealPattern.factors.some((x) => x.text.includes('杀有印化')), `kill-seal chart should expose formation factor, got ${JSON.stringify(killSealPattern.factors)}`);
assert(killSealPattern.clarity.level === '较清' && killSealPattern.clarity.text.includes('杀印相生'), `kill-seal chart should expose clean structure, got ${JSON.stringify(killSealPattern.clarity)}`);
assert(killSealPattern.elementPhenomena.length === 1 && killSealPattern.elementPhenomena[0].name === '土厚埋金' && killSealPattern.elementPhenomena[0].status === '明显倾向', `earth-heavy weak metal should expose a bounded 土厚埋金 phenomenon, got ${JSON.stringify(killSealPattern.elementPhenomena)}`);
assert(killSealPattern.elementPhenomena[0].category === '五行气象与偏枯病象' && killSealPattern.elementPhenomena[0].termType === '五行气象与偏枯病象' && killSealPattern.elementPhenomena[0].sourceSystem === '结构诊断与校正层' && killSealPattern.elementPhenomena[0].target.role === '日主本体' && killSealPattern.elementPhenomena[0].ruleId === 'ZP-QX-001' && killSealPattern.elementPhenomena[0].ruleVersion === 'ZP-2026.07.14.1', `phenomenon should remain separate from the formal pattern and expose its type, object, source layer, rule, and version, got ${JSON.stringify(killSealPattern.elementPhenomena[0])}`);
assert(killSealPattern.elementPhenomena[0].evidence.some((x) => x.includes('土约占全局')) && killSealPattern.elementPhenomena[0].counterEvidence.some((x) => x.includes('余气根')) && killSealPattern.elementPhenomena[0].counterEvidence.some((x) => x.includes('壬水')), `phenomenon should expose quantitative evidence and chart-specific counterevidence, got ${JSON.stringify(killSealPattern.elementPhenomena[0])}`);
assert(killSealPattern.elementPhenomena[0].conclusion.includes('不作完全埋没论') && killSealPattern.elementPhenomena[0].behavior.includes('较可能') && killSealPattern.elementPhenomena[0].behavior.includes('不等同懒惰或嗜睡') && !killSealPattern.elementPhenomena[0].behavior.includes('一定'), `behavior outlet should remain probabilistic and non-medical, got ${JSON.stringify(killSealPattern.elementPhenomena[0])}`);
assert(killSealPattern.elementPhenomena[0].canonicalName === '土厚埋金' && killSealPattern.elementPhenomena[0].aliases.includes('土多埋金') && killSealPattern.elementPhenomena[0].severityRank === 2 && killSealPattern.elementPhenomena[0].severityBasis.includes('土势明显压过金') && killSealPattern.elementPhenomena[0].degreeBoundary.includes('未判为严重'), `phenomenon should expose canonical terminology and an attributable degree boundary, got ${JSON.stringify(killSealPattern.elementPhenomena[0])}`);
assert(killSealPattern.elementPhenomena[0].scope.includes('不作为正式命格') && killSealPattern.elementPhenomena[0].behaviorProfile.scene.includes('任务边界不清') && killSealPattern.elementPhenomena[0].behaviorProfile.counterCondition.includes('目标明确'), `phenomenon should expose scope and falsifiable behavior conditions, got ${JSON.stringify(killSealPattern.elementPhenomena[0])}`);
assert(scriptContext.BaziEngine.normalizePhenomenonName('土多埋金') === '土厚埋金' && scriptContext.BaziEngine.normalizePhenomenonName('金多土虚') === '金多土变', 'phenomenon aliases should normalize to one canonical term');
assert(killSealPattern.patternStructures.some((x) => x.name === '杀印相生格' && x.role === '主格' && x.status === '成而有瑕' && x.issues.includes('土厚埋金')), `buried-metal disease should retain kill-seal as main pattern while lowering its finish, got ${JSON.stringify(killSealPattern.patternStructures)}`);
const killSealPotentialDimension = killSealPattern.patternRawScoreBreakdown.dimensions.find((item) => item.key === 'potential');
assert(killSealPotentialDimension.score === 100 && killSealPotentialDimension.components.length === 1 && killSealPotentialDimension.components[0].ruleId === 'ZP-CG-01', `a separately scored elemental phenomenon may lower formation, balance, and the hard-gate ceiling, but must not also erase the already validated kill-seal potential, got ${JSON.stringify(killSealPotentialDimension)}`);
assert(killSealPattern.useful.primaryUse.join('、') === '金' && killSealPattern.useful.secondaryUse.join('、') === '水' && killSealPattern.useful.avoid.includes('土'), `excess seal-earth should stop being an incremental useful element, got ${JSON.stringify(killSealPattern.useful)}`);
assert(killSealPattern.useful.layers.pattern.why.includes('印土在格局中承担化杀功能') && killSealPattern.useful.layers.pattern.why.includes('不再把土列为增补用神'), `pattern-use should distinguish an existing seal function from further adding earth, got ${killSealPattern.useful.layers.pattern.why}`);
assert(killSealPattern.usePriority.type === '病药' && killSealPattern.usePriority.source === '气势病象' && killSealPattern.usePriority.conflicts.some((x) => x.element === '土' && x.decision === '不取'), `buried-metal disease should override ordinary pattern-use arbitration, got ${JSON.stringify(killSealPattern.usePriority)}`);
assert(killSealPattern.patternLevelGrade === '偏高' && killSealPattern.patternLevelHardGate.ceilingGrade === '偏高' && killSealPattern.patternLevelCriteria.some((x) => x.name === '气势病象' && x.result.includes('土厚埋金')), `buried-metal flaw should cap rather than repeatedly deduct the natal level, got ${JSON.stringify({ grade: killSealPattern.patternLevelGrade, gate: killSealPattern.patternLevelHardGate, criteria: killSealPattern.patternLevelCriteria })}`);
assert(killSealPattern.remedy.some((x) => x.title === '土厚埋金' && x.text.includes('土势过重')), `remedy should explain how an otherwise useful seal becomes excessive, got ${JSON.stringify(killSealPattern.remedy)}`);
assert(killSealPattern.clarity.text.includes('土厚埋金') && killSealPattern.clarity.text.includes('过量之土不再增'), `clarity should state the direct keep/remove conclusion, got ${JSON.stringify(killSealPattern.clarity)}`);
assert(killSealPattern.usePriority.text.includes('土厚埋金'), `kill-seal chart should expose phenomenon-first useful priority, got ${JSON.stringify(killSealPattern.usePriority)}`);
assert(killSealPattern.patternArbitration.mainPattern === '杀印相生格' && killSealPattern.patternArbitration.candidates.some((x) => x.name === '食神制杀格'), `multiple formed killing structures should enter one arbitration result, got ${JSON.stringify(killSealPattern.patternArbitration)}`);
assert(killSealPattern.patternArbitration.relations.some((x) => x.name === '食神制杀格' && x.type === '制化并见') && killSealPattern.patternStructures.some((x) => x.name === '食神制杀格' && x.role === '兼格' && x.relation.includes('印是否夺食')), `food-control and seal-transform paths should be retained as a conditional compatible structure, got ${JSON.stringify(killSealPattern.patternStructures)}`);
assert(scriptContext.elementPhenomenonText(killSealBazi).includes('土厚埋金（明显倾向；程度：明显；置信：中）') && scriptContext.elementPhenomenonText(killSealBazi).includes('术语分类：五行气象与偏枯病象；常见异名：土多埋金') && scriptContext.elementPhenomenonText(killSealBazi).includes('程度依据：') && scriptContext.elementPhenomenonText(killSealBazi).includes('未判更重：') && scriptContext.elementPhenomenonText(killSealBazi).includes('相反条件：'), `structure view should render normalized terminology, degree evidence, boundary, and behavior conditions, got ${scriptContext.elementPhenomenonText(killSealBazi)}`);
assert(!scriptContext.elementPhenomenonText(killSealBazi).includes('ZP-QX-001'), 'visible phenomenon details should suppress internal rule ids');
assert(scriptContext.elementPhenomenonText(killSealBazi).includes('<details class="phenomenon-detail"><summary>完整判断依据</summary>'), 'structure view should collapse long phenomenon evidence instead of stretching the primary card');
const killSealPromptContext = scriptContext.buildPatternContextText(killSealBazi);
assert(killSealPromptContext.includes('气势病象：土厚埋金') && killSealPromptContext.includes('程度依据：') && killSealPromptContext.includes('未判更重：') && killSealPromptContext.includes('ZP-QX-001（ZP-2026.07.14.1）') && !killSealPromptContext.includes('<details'), 'AI context should receive the complete structured and versioned phenomenon conclusion without UI markup');
const severeBuriedMetalPattern = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '戊戌', month: '己未', day: '辛未', hour: '戊戌' }, dayStem: '辛' });
assert(severeBuriedMetalPattern.elementPhenomena.some((x) => x.name === '土厚埋金' && x.status === '明确成立' && x.severity === '严重'), `an earth-dominant chart without usable metal roots or output should form severe 土厚埋金, got ${JSON.stringify(severeBuriedMetalPattern.elementPhenomena)}`);
assert(severeBuriedMetalPattern.elementPhenomena.some((x) => x.severityRank === 3 && x.degreeBoundary.includes('当前最高严重度')), `severe phenomena should expose the shared top-degree boundary, got ${JSON.stringify(severeBuriedMetalPattern.elementPhenomena)}`);
assert(severeBuriedMetalPattern.useful.primaryUse.join('、') === '金' && !severeBuriedMetalPattern.useful.secondaryUse.length && severeBuriedMetalPattern.useful.avoid.includes('土'), `severe buried metal should not invent absent water or wood as immediate useful support, got ${JSON.stringify(severeBuriedMetalPattern.useful)}`);
const strongRootEarthMetalPattern = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '庚申', month: '戊辰', day: '辛酉', hour: '己丑' }, dayStem: '辛' });
assert(!strongRootEarthMetalPattern.elementPhenomena.some((x) => x.name === '土厚埋金'), `earth presence should not bury metal when metal is equally strong and has usable roots, got ${JSON.stringify(strongRootEarthMetalPattern.elementPhenomena)}`);
const nearMissBuriedMetalPattern = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '戊寅', month: '己卯', day: '辛酉', hour: '壬辰' }, dayStem: '辛' });
assert(!nearMissBuriedMetalPattern.elementPhenomena.some((x) => x.name === '土厚埋金'), `earth that misses the dominance threshold should not be promoted to 土厚埋金, got ${JSON.stringify(nearMissBuriedMetalPattern.elementPhenomena)}`);
const outputExcessCases = [
  { name: '水多金沉', ruleId: 'ZP-QX-006', pillars: { year: '壬子', month: '癸亥', day: '辛子', hour: '戊子' }, primary: ['土', '金'], avoid: '水' },
  { name: '木盛水缩', ruleId: 'ZP-QX-007', pillars: { year: '甲寅', month: '乙卯', day: '壬卯', hour: '庚寅' }, primary: ['金', '水'], avoid: '木' },
  { name: '火多木焚', ruleId: 'ZP-QX-008', pillars: { year: '丙午', month: '丁子', day: '甲午', hour: '丙午' }, primary: ['水', '木'], avoid: '火' },
  { name: '土多火晦', ruleId: 'ZP-QX-009', pillars: { year: '戊辰', month: '己丑', day: '丁丑', hour: '戊辰' }, primary: ['木', '火'], avoid: '土' },
  { name: '金多土变', ruleId: 'ZP-QX-010', pillars: { year: '庚酉', month: '辛酉', day: '戊酉', hour: '丙酉' }, primary: ['火', '土'], avoid: '金' },
];
outputExcessCases.forEach((item) => {
  const result = scriptContext.BaziEngine.analyzePattern({ pillars: item.pillars, dayStem: item.pillars.day[0] });
  const phenomenon = result.elementPhenomena.find((x) => x.name === item.name);
  assert(phenomenon && phenomenon.ruleId === item.ruleId && phenomenon.ruleVersion === 'ZP-2026.07.14.1' && phenomenon.category === '五行气象与泄身反伤病象' && phenomenon.termType === '五行气象与偏枯病象' && phenomenon.status === '明确成立', `${item.name} should form only after the shared output-excess conditions are met and remain in the versioned phenomenon term layer, got ${JSON.stringify(result.elementPhenomena)}`);
  assert(phenomenon.target.role === '日主本体' && phenomenon.evidence.some((x) => x.includes('约占全局')) && phenomenon.counterEvidence.length, `${item.name} should expose its object, proportion evidence, and counterevidence, got ${JSON.stringify(phenomenon)}`);
  assert(phenomenon.severityRank === 3 && phenomenon.severityBasis && phenomenon.degreeBoundary.includes('当前最高严重度'), `${item.name} should use the shared severity scale and expose its basis, got ${JSON.stringify(phenomenon)}`);
  assert(phenomenon.behavior.includes('条件性行为倾向') && !phenomenon.behavior.includes('一定') && phenomenon.behaviorProfile.scene && phenomenon.behaviorProfile.observable && phenomenon.behaviorProfile.counterCondition, `${item.name} behavior should remain structured and conditional rather than deterministic, got ${JSON.stringify(phenomenon)}`);
  assert(item.primary.every((w) => result.useful.primaryUse.includes(w)) && result.useful.avoid.includes(item.avoid), `${item.name} should use the resource+self dual remedy and stop adding excessive output, got ${JSON.stringify(result.useful)}`);
  assert(result.usePriority.type === '病药' && result.usePriority.source === '气势病象' && result.usePriority.conflicts.some((x) => x.element === item.avoid && x.decision === '不取'), `${item.name} should override ordinary useful-element arbitration, got ${JSON.stringify(result.usePriority)}`);
  assert(result.remedy.some((x) => x.title === item.name && x.text.includes('先止泄身太过')) && result.clarity.text.includes(item.name), `${item.name} should feed the same conclusion into remedy and clarity, got ${JSON.stringify({ remedy: result.remedy, clarity: result.clarity })}`);
  assert(result.patternLevelCriteria.some((x) => x.name === '气势病象' && x.result.includes(item.name)), `${item.name} should enter attributable pattern-level criteria, got ${JSON.stringify(result.patternLevelCriteria)}`);
});
const resourceExcessCases = [
  { name: '木多火塞', ruleId: 'ZP-QX-002', pillars: { year: '甲寅', month: '乙卯', day: '丁酉', hour: '甲寅' }, primary: '火', avoid: '木' },
  { name: '火多土焦', ruleId: 'ZP-QX-003', pillars: { year: '丙午', month: '丁巳', day: '戊子', hour: '丙午' }, primary: '土', avoid: '火' },
  { name: '金多水浊', ruleId: 'ZP-QX-004', pillars: { year: '庚申', month: '辛酉', day: '壬午', hour: '庚申' }, primary: '水', avoid: '金' },
  { name: '水多木漂', ruleId: 'ZP-QX-005', pillars: { year: '壬子', month: '癸亥', day: '甲午', hour: '壬子' }, primary: '木', avoid: '水' },
];
resourceExcessCases.forEach((item) => {
  const result = scriptContext.BaziEngine.analyzePattern({ pillars: item.pillars, dayStem: item.pillars.day[0] });
  const phenomenon = result.elementPhenomena.find((x) => x.name === item.name);
  assert(phenomenon && phenomenon.ruleId === item.ruleId && phenomenon.ruleVersion === 'ZP-2026.07.14.1' && phenomenon.category === '五行气象与生扶太过病象' && phenomenon.status === '明显倾向', `${item.name} should require excessive resource, a weakly rooted recipient, and a versioned strict rule, got ${JSON.stringify(result.elementPhenomena)}`);
  assert(phenomenon.causalChain.includes('生扶太过') && phenomenon.counterEvidence.length && phenomenon.scope.includes('不作为正式命格'), `${item.name} should expose its resource-excess cause, counterevidence, and non-pattern boundary, got ${JSON.stringify(phenomenon)}`);
  assert(result.useful.primaryUse.includes(item.primary) && result.useful.avoid.includes(item.avoid) && result.usePriority.text.includes('生扶太过'), `${item.name} should restore recipient capacity and stop adding excessive resource, got ${JSON.stringify(result.useful)}`);
  assert(result.remedy.some((x) => x.title === item.name && x.text.includes('生扶作用')) && result.clarity.text.includes(item.name), `${item.name} should feed one direct conclusion into remedy and clarity, got ${JSON.stringify({ remedy: result.remedy, clarity: result.clarity })}`);
});
const rootedFireWithWood = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '甲寅', month: '乙卯', day: '丁巳', hour: '甲寅' }, dayStem: '丁' });
assert(!rootedFireWithWood.elementPhenomena.some((x) => x.name === '木多火塞'), `wood should remain usable resource when fire has a direct main root, got ${JSON.stringify(rootedFireWithWood.elementPhenomena)}`);
assert(scriptContext.BaziEngine.normalizePhenomenonName('火炎土燥') === '火多土焦' && scriptContext.BaziEngine.normalizePhenomenonName('水泛木浮') === '水多木漂', 'resource-excess aliases should normalize to one canonical professional term');
const earthDimsFireBazi = { person: '土多火晦样本', gender: '男', pillars: outputExcessCases.find((x) => x.name === '土多火晦').pillars, dayStem: '丁', dayElement: '火', time: { used: { year: 1997, month: 1, day: 8, hour: 8, minute: 0 }, input: { year: 1997, month: 1, day: 8, hour: 8, minute: 0 }, enabled: false, correction: 0, location: { name: 'sample', lng: 120, lat: 30 } } };
assert(scriptContext.elementPhenomenonText(earthDimsFireBazi).includes('土多火晦（明确成立；程度：严重；置信：') && scriptContext.elementPhenomenonText(earthDimsFireBazi).includes('辰丑湿土') && scriptContext.elementPhenomenonText(earthDimsFireBazi).includes('火少火晦'), `土多火晦 view should expose wet-earth evidence and its authority boundary, got ${scriptContext.elementPhenomenonText(earthDimsFireBazi)}`);
assert(scriptContext.buildPatternContextText(earthDimsFireBazi).includes('气势病象：土多火晦') && scriptContext.buildPatternContextText(earthDimsFireBazi).includes('ZP-QX-009'), 'AI context should receive the same 土多火晦 rule and evidence');
const trueFollowChildPattern = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '壬子', month: '癸亥', day: '辛亥', hour: '壬子' }, dayStem: '辛' });
assert(trueFollowChildPattern.specialPatterns.includes('从格：从儿格') && !trueFollowChildPattern.elementPhenomena.some((x) => x.name === '水多金沉'), `true 从儿格 should follow output rather than be misdiagnosed as 水多金沉, got ${JSON.stringify(trueFollowChildPattern)}`);
const normalOutputPattern = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '甲寅', month: '丙午', day: '甲寅', hour: '丁巳' }, dayStem: '甲' });
assert(!normalOutputPattern.elementPhenomena.some((x) => x.name === '火多木焚'), `strong rooted wood with usable fire output should remain normal 泄秀, got ${JSON.stringify(normalOutputPattern.elementPhenomena)}`);
const fireHeavyEarthDayPattern = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '丙午', month: '丁巳', day: '戊戌', hour: '丙午' }, dayStem: '戊' });
assert(!fireHeavyEarthDayPattern.elementPhenomena.some((x) => x.name === '土多火晦'), `fire-heavy earth-day chart should not reverse the affected object and be labeled 土多火晦, got ${JSON.stringify(fireHeavyEarthDayPattern.elementPhenomena)}`);
const foodKillRobbedBazi = {
  person: '食神制杀兼枭夺食样本',
  gender: '男',
  pillars: { year: '庚申', month: '丙寅', day: '甲子', hour: '壬申' },
  dayStem: '甲',
  dayElement: '木',
  time: { used: { year: 1993, month: 2, day: 1, hour: 22, minute: 0 }, input: { year: 1993, month: 2, day: 1, hour: 22, minute: 0 }, enabled: false, correction: 0, location: { name: 'sample', lng: 120, lat: 30 } },
};
const foodKillRobbedPattern = scriptContext.BaziEngine.analyzePattern(foodKillRobbedBazi);
assert(foodKillRobbedPattern.comboPatterns.some((x) => x.includes('食神制杀')), `combo pattern should include 食神制杀, got ${foodKillRobbedPattern.comboPatterns.join(',')}`);
assert(foodKillRobbedPattern.comboConflicts.some((x) => x.name === '枭神夺食'), `food-kill chart should expose 枭神夺食 conflict, got ${JSON.stringify(foodKillRobbedPattern.comboConflicts)}`);
assert(foodKillRobbedPattern.comboConflicts.some((x) => x.text.includes('削弱制杀')), `food-kill chart should explain the conflict weakens killing control, got ${JSON.stringify(foodKillRobbedPattern.comboConflicts)}`);
assert(foodKillRobbedPattern.patternStructures.some((x) => x.name.includes('食神制杀') && x.role === '主格' && x.status === '成而有瑕'), `food-kill structure should retain the main pattern and record 枭神夺食 damage, got ${JSON.stringify(foodKillRobbedPattern.patternStructures)}`);
assert(foodKillRobbedPattern.patternReasoning.formation.some((x) => x.includes('食神制杀')) && foodKillRobbedPattern.patternReasoning.damage.some((x) => x.includes('枭神夺食')), `food-kill reasoning should connect formation and damage, got ${JSON.stringify(foodKillRobbedPattern.patternReasoning)}`);
assert(['成：', '破：', '救：', '结论：'].every((x) => scriptContext.patternFactorText(foodKillRobbedBazi).includes(x)), `formation-factor view should render the complete reasoning chain, got ${scriptContext.patternFactorText(foodKillRobbedBazi)}`);
assert(foodKillRobbedPattern.patternArbitration.decision.includes('月令基础格须向外取用') && foodKillRobbedPattern.patternStructures.some((x) => x.name === '建禄格' && x.role === '命格基础'), `a complete external structure should outrank the underlying 建禄 base without deleting it, got ${JSON.stringify(foodKillRobbedPattern.patternArbitration)}`);
assert(foodKillRobbedPattern.useful.primaryUse.includes('火') && foodKillRobbedPattern.useful.primaryUse.includes('土') && !foodKillRobbedPattern.useful.primaryUse.includes('水') && foodKillRobbedPattern.useful.layers.pattern.why.includes('枭夺食'), `food-control damaged by owl should keep food and use wealth to rescue instead of adding more seal, got ${JSON.stringify(foodKillRobbedPattern.useful)}`);
assert(foodKillRobbedPattern.interactionFlow.steps.some((x) => x.action === '制' && x.status === '作用可达') && foodKillRobbedPattern.interactionFlow.sequence.some((x) => x.name === '枭神夺食' && x.verdict), `food-control with owl damage should expose the reachable control chain and break/rescue order, got ${JSON.stringify(foodKillRobbedPattern.interactionFlow)}`);
assert(foodKillRobbedPattern.useful.specific.primary.some((x) => x.tenGods.includes('食神')) && foodKillRobbedPattern.useful.specific.avoid.some((x) => x.tenGods.includes('偏印') && !x.tenGods.includes('正印')), `specific useful roles should avoid only owl rather than every seal sharing its element, got ${JSON.stringify(foodKillRobbedPattern.useful.specific)}`);
assert(!scriptContext.usefulPriorityText(foodKillRobbedBazi).includes('具体十神：') && scriptContext.usefulPriorityText(foodKillRobbedBazi, true).includes('具体十神：') && scriptContext.usefulPriorityText(foodKillRobbedBazi, true).includes('偏印'), 'technical useful context should retain stem and exact ten-god decisions without crowding the page');
const unformedFoodKillBazi = {
  person: '食神制杀线索样本',
  gender: '男',
  pillars: { year: '庚申', month: '甲寅', day: '甲子', hour: '壬申' },
  dayStem: '甲',
  dayElement: '木',
  time: { used: { year: 1993, month: 2, day: 1, hour: 22, minute: 0 }, input: { year: 1993, month: 2, day: 1, hour: 22, minute: 0 }, enabled: false, correction: 0, location: { name: 'sample', lng: 120, lat: 30 } },
};
const unformedFoodKillPattern = scriptContext.BaziEngine.analyzePattern(unformedFoodKillBazi);
assert(!unformedFoodKillPattern.comboPatterns.some((x) => x.includes('食神制杀')), `unrevealed food god should not form 食神制杀, got ${unformedFoodKillPattern.comboPatterns.join(',')}`);
assert(!unformedFoodKillPattern.mainPattern.includes('食神制杀'), `unformed food-kill clue should not become main pattern, got ${unformedFoodKillPattern.mainPattern}`);
assert(unformedFoodKillPattern.comboClues.some((x) => x.name.includes('食神制杀线索参考')), `unformed food-kill should be kept as a clue, got ${JSON.stringify(unformedFoodKillPattern.comboClues)}`);
assert(unformedFoodKillPattern.factors.some((x) => x.type === '参' && x.text.includes('不按食神制杀成格')), `unformed food-kill clue should explain condition basis, got ${JSON.stringify(unformedFoodKillPattern.factors)}`);
assert(!unformedFoodKillPattern.useful.layers.pattern.why.includes('食神制杀为主'), `unformed food-kill should not take pattern-use from 食神制杀, got ${unformedFoodKillPattern.useful.layers.pattern.why}`);
const hiddenRootsFoodKillBazi = {
  person: '食神制杀双根线索样本',
  gender: '男',
  pillars: { year: '戊申', month: '壬子', day: '甲寅', hour: '戊巳' },
  dayStem: '甲',
  dayElement: '木',
  time: { used: { year: 1993, month: 12, day: 1, hour: 10, minute: 0 }, input: { year: 1993, month: 12, day: 1, hour: 10, minute: 0 }, enabled: false, correction: 0, location: { name: 'sample', lng: 120, lat: 30 } },
};
const hiddenRootsFoodKillPattern = scriptContext.BaziEngine.analyzePattern(hiddenRootsFoodKillBazi);
assert(!hiddenRootsFoodKillPattern.comboPatterns.some((x) => x.includes('食神制杀')), `two hidden roots without reveal or month command should not form 食神制杀, got ${hiddenRootsFoodKillPattern.comboPatterns.join(',')}`);
assert(hiddenRootsFoodKillPattern.comboClues.some((x) => x.name === '食神制杀线索参考'), `two hidden roots should remain a food-kill clue, got ${JSON.stringify(hiddenRootsFoodKillPattern.comboClues)}`);
const distantFoodKillPattern = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '庚申', month: '壬子', day: '甲子', hour: '丙午' }, dayStem: '甲' });
assert(!distantFoodKillPattern.comboPatterns.some((x) => x.includes('食神制杀')), `distant food and killing without a direct relation should not form 食神制杀, got ${distantFoodKillPattern.comboPatterns.join(',')}`);
assert(distantFoodKillPattern.comboClues.some((x) => x.name === '食神制杀线索参考' && x.text.includes('位置承接不足')), `distant food-kill should explain the missing positional relation, got ${JSON.stringify(distantFoodKillPattern.comboClues)}`);
const financeOfficerSealBazi = {
  person: '财官印相生样本',
  gender: '女',
  pillars: { year: '辛酉', month: '己未', day: '甲子', hour: '癸亥' },
  dayStem: '甲',
  dayElement: '木',
  time: { used: { year: 1993, month: 7, day: 1, hour: 22, minute: 0 }, input: { year: 1993, month: 7, day: 1, hour: 22, minute: 0 }, enabled: false, correction: 0, location: { name: 'sample', lng: 120, lat: 30 } },
};
const financeOfficerSealPattern = scriptContext.BaziEngine.analyzePattern(financeOfficerSealBazi);
assert(financeOfficerSealPattern.mainPattern === '财官印相生格', `month-wealth chart with clear officer and seal chain should form 财官印相生, got ${financeOfficerSealPattern.mainPattern}`);
assert(financeOfficerSealPattern.patternStructures.some((x) => x.name === '财官印相生格' && x.role === '主格' && x.status === '已成' && x.ruleId === 'ZP-CG-05'), `formed finance-officer-seal chain should expose a traceable main structure, got ${JSON.stringify(financeOfficerSealPattern.patternStructures)}`);
assert(financeOfficerSealPattern.patternStructures.some((x) => x.name === '财官印相生格' && x.basis.includes('位置承接')), `formed finance-officer-seal chain should explain why its sequence is connected, got ${JSON.stringify(financeOfficerSealPattern.patternStructures)}`);
assert(financeOfficerSealPattern.patternArbitration.main && financeOfficerSealPattern.patternArbitration.main.anchored && financeOfficerSealPattern.patternArbitration.decision.includes('承接月令'), `month-anchored finance-officer-seal should outrank its regular wealth base with an explicit reason, got ${JSON.stringify(financeOfficerSealPattern.patternArbitration)}`);
assert(financeOfficerSealPattern.interactions.stemCombines.some((x) => x.pair === '甲己' && x.status === '日主合入'), `day-master combination should be distinguished from an ordinary binding combination, got ${JSON.stringify(financeOfficerSealPattern.interactions.stemCombines)}`);
assert(financeOfficerSealPattern.interactionFlow.steps.length === 2 && !financeOfficerSealPattern.interactionFlow.steps.some((x) => x.status === '合绊受阻'), `day-master combination should not falsely break the finance-officer-seal sequence, got ${JSON.stringify(financeOfficerSealPattern.interactionFlow)}`);
assert(scriptContext.interactionText(financeOfficerSealBazi).includes('干合：'), `structure view should render stem and branch interaction conclusions, got ${scriptContext.interactionText(financeOfficerSealBazi)}`);
assert(scriptContext.interactionText(financeOfficerSealBazi).includes('作用先后：') && scriptContext.interactionText(financeOfficerSealBazi).includes('财') && scriptContext.interactionText(financeOfficerSealBazi).includes('官'), `structure view should render the main-pattern action sequence, got ${scriptContext.interactionText(financeOfficerSealBazi)}`);
assert(financeOfficerSealPattern.useful.roles && financeOfficerSealPattern.useful.roles.monthCommandGod && financeOfficerSealPattern.useful.roles.patternGod && financeOfficerSealPattern.useful.roles.balanceGod && financeOfficerSealPattern.useful.roles.finalUseGod && financeOfficerSealPattern.useful.roles.avoidGod, 'useful strategy should separate month-command, pattern, balance, final-use, and avoid roles');
assert(financeOfficerSealPattern.useful.roles.monthCommandGod.tenGods.includes('正财'), `month-command useful role should retain the exact month god, got ${JSON.stringify(financeOfficerSealPattern.useful.roles.monthCommandGod)}`);
assert(['formed', 'power', 'affection', 'purity', 'rescue'].every((x) => Object.prototype.hasOwnProperty.call(financeOfficerSealPattern.patternLevelMetrics, x)), `pattern level should expose evidence dimensions, got ${JSON.stringify(financeOfficerSealPattern.patternLevelMetrics)}`);
assert(['月令用神（定格）', '格局用神', '相神', '扶抑喜用', '调候神', '最终主用', '忌神'].every((label) => scriptContext.usefulPriorityText(financeOfficerSealBazi, true).includes(label)), 'technical useful context should retain concept-safe role labels');
assert(financeOfficerSealPattern.useful.primaryUse.join('、') === '土、金、水' && financeOfficerSealPattern.useful.arbitration.type === '格局', `formed finance-officer-seal should keep the full pattern chain as the winning useful layer, got ${JSON.stringify(financeOfficerSealPattern.useful)}`);
assert(financeOfficerSealPattern.useful.arbitration.conflicts.some((x) => x.element === '土' && x.decision === '取') && scriptContext.usefulPriorityText(financeOfficerSealBazi, true).includes('取舍冲突：土（取'), `technical useful context should state why the pattern layer wins, got ${scriptContext.usefulPriorityText(financeOfficerSealBazi, true)}`);
assert(!financeOfficerSealPattern.useful.roles.joyGod.elements.some((x) => financeOfficerSealPattern.useful.roles.enemyGod.elements.includes(x)), `the same element must not be both joy and enemy after arbitration, got ${JSON.stringify(financeOfficerSealPattern.useful.roles)}`);
assert(financeOfficerSealPattern.useful.specific.primary.some((x) => x.tenGods.length === 1 && x.tenGods[0] === '正财') && financeOfficerSealPattern.useful.specific.primary.some((x) => x.tenGods.length === 1 && x.tenGods[0] === '正官') && financeOfficerSealPattern.useful.specific.primary.some((x) => x.tenGods.length === 1 && x.tenGods[0] === '正印'), `clear finance-officer-seal chain should select the exact revealed ten gods, got ${JSON.stringify(financeOfficerSealPattern.useful.specific.primary)}`);
assert(financeOfficerSealPattern.patternLevelCriteria.some((x) => x.name === '成格完整度' && x.result.includes('/')) && financeOfficerSealPattern.patternLevelCriteria.some((x) => x.name === '生克有情'), `pattern level should expose attributable condition results, got ${JSON.stringify(financeOfficerSealPattern.patternLevelCriteria)}`);
assert(!scriptContext.patternLevelText(financeOfficerSealBazi).includes('层次归因：') && scriptContext.patternLevelText(financeOfficerSealBazi, true).includes('层次归因：'), 'technical level context should retain attributable grading criteria without crowding the page');
assert(['高置信', '中置信', '参考'].includes(financeOfficerSealPattern.patternConfidence.level), `formed structure should expose a bounded confidence conclusion, got ${JSON.stringify(financeOfficerSealPattern.patternConfidence)}`);
assert(!scriptContext.patternBasisText(financeOfficerSealBazi).includes('ZP-MG-01') && scriptContext.patternBasisText(financeOfficerSealBazi).includes('财星当令') && scriptContext.patternBasisText(financeOfficerSealBazi, true).includes('《子平真诠》') && scriptContext.patternBasisText(financeOfficerSealBazi, true).includes('ZP-MG-01'), `page basis should stay readable while technical context retains authority and rule metadata, got ${scriptContext.patternBasisText(financeOfficerSealBazi)}`);
const financeOfficerSealClueBazi = {
  person: '财官印线索样本',
  gender: '女',
  pillars: { year: '戊丑', month: '己未', day: '甲子', hour: '戊亥' },
  dayStem: '甲',
  dayElement: '木',
  time: { used: { year: 1993, month: 7, day: 1, hour: 22, minute: 0 }, input: { year: 1993, month: 7, day: 1, hour: 22, minute: 0 }, enabled: false, correction: 0, location: { name: 'sample', lng: 120, lat: 30 } },
};
const financeOfficerSealCluePattern = scriptContext.BaziEngine.analyzePattern(financeOfficerSealClueBazi);
assert(financeOfficerSealCluePattern.mainPattern === '未见明确成格', `hidden finance-officer-seal chain should not become a main pattern, got ${financeOfficerSealCluePattern.mainPattern}`);
assert(financeOfficerSealCluePattern.comboClues.some((x) => x.name === '财官印相生线索参考' && x.text.includes('正官未透')), `hidden finance-officer-seal chain should state its missing conditions, got ${JSON.stringify(financeOfficerSealCluePattern.comboClues)}`);
assert(scriptContext.patternCandidates(financeOfficerSealClueBazi).includes('待成线索：财官印相生线索'), `main-pattern view should retain one concise unformed finance-officer-seal line, got ${scriptContext.patternCandidates(financeOfficerSealClueBazi)}`);
assert(financeOfficerSealCluePattern.patternConfidence.level === '参考', `unformed combination should remain reference confidence, got ${JSON.stringify(financeOfficerSealCluePattern.patternConfidence)}`);
const regularPatternCases = [
  { label: '财格', pillars: { year: '辛酉', month: '己未', day: '甲子', hour: '癸亥' }, name: '正财格', status: '已成' },
  { label: '官格', pillars: { year: '甲寅', month: '辛亥', day: '丁巳', hour: '甲寅' }, name: '正官格', status: '已成' },
  { label: '印格', pillars: { year: '庚申', month: '壬亥', day: '乙卯', hour: '甲寅' }, name: '正印格', status: '成而有瑕' },
  { label: '食神格', pillars: { year: '己丑', month: '癸巳', day: '甲寅', hour: '丙午' }, name: '食神格', status: '已破' },
  { label: '七杀格', pillars: { year: '戊寅', month: '戊午', day: '辛丑', hour: '壬辰' }, name: '七杀格', status: '已成' },
  { label: '伤官格', pillars: { year: '己丑', month: '丁午', day: '甲寅', hour: '丙戌' }, name: '伤官格', status: '成而有瑕' },
  { label: '建禄格', pillars: { year: '辛酉', month: '戊寅', day: '甲子', hour: '己丑' }, name: '建禄格', status: '已成' },
  { label: '月刃格', pillars: { year: '庚戌', month: '丁卯', day: '甲亥', hour: '甲寅' }, name: '月刃格', status: '已成' },
];
regularPatternCases.forEach((item) => {
  const result = scriptContext.BaziEngine.analyzePattern({ pillars: item.pillars, dayStem: item.pillars.day[0] });
  assert(result.regularPattern.name === item.name, `${item.label} should follow the month-command regular pattern, got ${result.regularPattern.name}`);
  assert(result.regularPattern.status === item.status, `${item.label} should return a direct formation status, got ${result.regularPattern.status}`);
  assert(result.regularPattern.authority && /^ZP-MG-\d{2}$/.test(result.regularPattern.authority.ruleId) && result.regularPattern.authority.ruleVersion && result.regularPattern.authority.framework.includes('子平真诠') && result.regularPattern.authority.principle.length > 0, `${item.label} should expose versioned authority rule metadata, got ${JSON.stringify(result.regularPattern.authority)}`);
  assert(result.regularPattern.checks.some((x) => x.type === '立格' && x.active) && result.regularPattern.checks.some((x) => x.type === '成格') && result.regularPattern.checks.some((x) => x.type === '破格') && result.regularPattern.checks.some((x) => x.type === '救应') && result.regularPattern.checks.every((x) => x.ruleId.startsWith(result.regularPattern.authority.ruleId+'-') && x.ruleVersion === result.regularPattern.authority.ruleVersion), `${item.label} should expose traceable formation, breaker, and rescue checks, got ${JSON.stringify(result.regularPattern.checks)}`);
  assert(['偏低', '中等', '偏高', '高', '顶级'].includes(result.patternLevelGrade), `${item.label} should return a unified five-grade level, got ${result.patternLevelGrade}`);
  assert(result.patternVerdict.startsWith(result.patternStructures.some((x) => x.role === '主格') ? result.patternStructures.find((x) => x.role === '主格').status : result.regularPattern.status), `${item.label} verdict should start with its direct status, got ${result.patternVerdict}`);
});
assert(scriptContext.patternFactorText({ pillars: regularPatternCases[0].pillars, dayStem: regularPatternCases[0].pillars.day[0] }).includes('条件核验：') && !scriptContext.patternFactorText({ pillars: regularPatternCases[0].pillars, dayStem: regularPatternCases[0].pillars.day[0] }).includes('ZP-MG-01-LG-1') && scriptContext.patternFactorText({ pillars: regularPatternCases[0].pillars, dayStem: regularPatternCases[0].pillars.day[0] }).includes('成格·'), 'readable formation factors should suppress internal rule ids');
assert(scriptContext.patternFactorText({ pillars: regularPatternCases[0].pillars, dayStem: regularPatternCases[0].pillars.day[0] }, true).includes('ZP-MG-01-LG-1'), 'technical formation context should retain traceable rule ids');
const graveRevealPattern = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '癸亥', month: '庚辰', day: '甲寅', hour: '丙午' }, dayStem: '甲' });
assert(graveRevealPattern.monthCommand.grave && graveRevealPattern.monthCommand.status === '杂气取清' && graveRevealPattern.monthCommand.primaryStem === '癸' && graveRevealPattern.monthCommand.primaryGod === '正印', `a single revealed hidden stem in a grave month should be selected cleanly, got ${JSON.stringify(graveRevealPattern.monthCommand)}`);
assert(graveRevealPattern.primary === '正印格' && graveRevealPattern.useful.roles.monthCommandGod.tenGods.includes('正印'), `the selected grave-month stem should drive the pattern and exact month-command role, got ${JSON.stringify({ primary: graveRevealPattern.primary, role: graveRevealPattern.useful.roles.monthCommandGod })}`);
assert(!graveRevealPattern.regularPattern.issues.some((x) => x.includes('财坏印')), `an unselected grave-month base stem should not be treated as a clear breaker, got ${JSON.stringify(graveRevealPattern.regularPattern)}`);
assert(scriptContext.stemRevealInfo({ pillars: { year: '癸亥', month: '庚辰', day: '甲寅', hour: '丙午' }, dayStem: '甲' }).includes('透干癸') && !scriptContext.stemRevealInfo({ pillars: { year: '癸亥', month: '庚辰', day: '甲寅', hour: '丙午' }, dayStem: '甲' }).includes('主气戊透出'), 'structure view should render the selected grave-month hidden stem rather than the fixed base stem');
const graveMeetingPattern = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '庚申', month: '庚辰', day: '甲午', hour: '壬子' }, dayStem: '甲' });
assert(graveMeetingPattern.monthCommand.status === '杂气取清' && graveMeetingPattern.monthCommand.groupStems.includes('癸') && graveMeetingPattern.monthCommand.primaryGod === '正印', `a completed grave-month meeting should select the matching hidden god, got ${JSON.stringify(graveMeetingPattern.monthCommand)}`);
assert(graveMeetingPattern.regularPattern.checks.some((x) => x.type === '成格' && x.label.includes('印星有根') && x.active), `a grave-month god selected by complete meeting should count as the active month command, got ${JSON.stringify(graveMeetingPattern.regularPattern.checks)}`);
const graveAmbiguousPattern = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '戊申', month: '庚辰', day: '甲寅', hour: '癸亥' }, dayStem: '甲' });
assert(graveAmbiguousPattern.monthCommand.ambiguous && graveAmbiguousPattern.monthCommand.selectedGods.includes('偏财') && graveAmbiguousPattern.monthCommand.selectedGods.includes('正印'), `multiple revealed grave-month gods should remain a compatible-use question, got ${JSON.stringify(graveAmbiguousPattern.monthCommand)}`);
assert(graveAmbiguousPattern.regularPattern.status === '待成' && graveAmbiguousPattern.patternBasis.includes('不强定单一格') && graveAmbiguousPattern.comboClues.some((x) => x.name === '杂气兼用线索参考'), `ambiguous grave-month use should not be forced into a formed pattern, got ${JSON.stringify(graveAmbiguousPattern)}`);
assert(scriptContext.patternCandidates({ pillars: { year: '戊申', month: '庚辰', day: '甲寅', hour: '癸亥' }, dayStem: '甲' }).includes('月令兼用：偏财、正印（待清）'), 'main-pattern view should expose unresolved grave-month compatible use');
const commanderCases = [
  { day: 6, stem: '乙', god: '劫财' },
  { day: 15, stem: '癸', god: '正印' },
  { day: 28, stem: '戊', god: '偏财' },
];
commanderCases.forEach((item) => {
  const result = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '庚申', month: '庚辰', day: '甲寅', hour: '丙午' }, dayStem: '甲', time: { used: { year: 2024, month: 4, day: item.day, hour: 12, minute: 0 } } });
  assert(result.monthCommand.commander && result.monthCommand.commander.stem === item.stem && result.monthCommand.primaryGod === item.god, `minute-calibrated human commander should select ${item.stem}${item.god} on April ${item.day}, got ${JSON.stringify(result.monthCommand)}`);
  assert(result.monthCommand.basis.includes('人元司令校验') && result.monthCommand.commander.termDate.includes('2024-04-04'), `commander evidence should retain its calibrated solar-term boundary, got ${JSON.stringify(result.monthCommand.commander)}`);
});
const killSealCandidates = scriptContext.patternCandidates(killSealBazi);
assert(killSealCandidates.includes('杀印相生'), `pattern candidate UI should show combo pattern, got ${killSealCandidates}`);
assert(killSealCandidates.includes('主格：杀印相生格') && killSealCandidates.includes('兼见：食神制杀格') && !killSealCandidates.includes('主次依据：'), `pattern candidate UI should show concise main and compatible structures without repeating arbitration prose, got ${killSealCandidates}`);
assert(!killSealCandidates.includes('、'), `pattern candidate UI should show only the main pattern, got ${killSealCandidates}`);
assert(!killSealCandidates.includes('用神') && !killSealCandidates.includes('忌神'), 'pattern candidates should not repeat useful/avoid elements');
assert(scriptContext.specialPatternText(killSealPattern).includes('未见明显从格/化格'), 'normal chart should state no obvious follow/transform pattern');
assert(scriptContext.publicPatternLevel('偏低') === '偏低' && scriptContext.publicPatternLevel('中等') === '中等' && scriptContext.publicPatternLevel('偏高') === '偏高' && scriptContext.publicPatternLevel('高') === '高' && scriptContext.publicPatternLevel('顶级') === '顶级' && scriptContext.publicPatternLevel('中下') === '中等' && scriptContext.publicPatternLevel('中高') === '高', 'public level labels should expose the agreed five grades directly while retaining legacy-record compatibility');
assert(scriptContext.patternLevelText(killSealBazi).includes('偏高：') && scriptContext.patternLevelText(killSealBazi).includes('气势病象') && !/[（(](?:蓄力|稳进|可展|发挥|拓展)档[）)]/.test(scriptContext.patternLevelText(killSealBazi)), 'pattern level should use the plain public grade while retaining its attributable reasoning');
assert(!html.includes('贵格杂格'), 'structure view should not classify shensha as noble/misc patterns');
assert(!html.includes('命格线索'), 'structure view should use direct 命格 label');
const officerMixedBazi = {
  person: '正官样本',
  gender: '女',
  pillars: { year: '癸酉', month: '癸亥', day: '丁酉', hour: '庚子' },
  dayStem: '丁',
  dayElement: '火',
  time: { used: { year: 1993, month: 11, day: 12, hour: 1, minute: 34 }, input: { year: 1993, month: 11, day: 12, hour: 1, minute: 34 }, enabled: false, correction: 0, location: { name: '参考', lng: 103.9936, lat: 24.8222 } },
};
const officerMixedPattern = scriptContext.BaziEngine.analyzePattern(officerMixedBazi);
assert(officerMixedPattern.primary === '正官格', `month-command pattern should be 正官格, got ${officerMixedPattern.primary}`);
assert(officerMixedPattern.patternBasis.includes('月令亥') && officerMixedPattern.patternBasis.includes('正官'), `pattern basis should explain month command, got ${officerMixedPattern.patternBasis}`);
assert(officerMixedPattern.patternState.includes('官杀混杂') && officerMixedPattern.patternState.includes('正官格不纯'), `pattern state should explain mixed official/killing, got ${officerMixedPattern.patternState}`);
assert(officerMixedPattern.patternLevel.includes('官杀混杂') && !officerMixedPattern.patternLevel.includes('层次偏高'), `mixed official pattern should not be simplified as high level, got ${officerMixedPattern.patternLevel}`);
assert(officerMixedPattern.mainPattern === '未见明确成格' && officerMixedPattern.patternIssues.some((x) => x.includes('官杀混杂')), `mixed official/killing should be a primary issue rather than a main pattern, got ${JSON.stringify(officerMixedPattern)}`);
assert(!officerMixedPattern.specialPatterns.some((x) => x.startsWith('从格：')), `mixed official chart with hidden resource should not be judged as a true follow pattern, got ${officerMixedPattern.specialPatterns.join(',')}`);
assert(scriptContext.patternStatusText(officerMixedBazi).includes('官杀混杂'), 'structure UI should expose pattern state');
assert(officerMixedPattern.patternVerdict.includes('已破') && officerMixedPattern.patternVerdict.includes('官杀混杂'), `mixed official chart should expose a direct failed-pattern verdict, got ${officerMixedPattern.patternVerdict}`);
assert(officerMixedPattern.useful.layers.pattern.why.includes('先清'), `mixed official chart pattern-use layer should explain clearing mixed officer/killing, got ${officerMixedPattern.useful.layers.pattern.why}`);
assert(officerMixedPattern.factors.some((x) => x.text.includes('官杀并见')), `mixed official chart should expose break factor, got ${JSON.stringify(officerMixedPattern.factors)}`);
assert(officerMixedPattern.clarity.level === '浊' && officerMixedPattern.clarity.text.includes('官杀并见'), `mixed official chart should expose 清浊去留, got ${JSON.stringify(officerMixedPattern.clarity)}`);
assert(officerMixedPattern.usePriority.text.includes('格局病药为先'), `mixed official chart should prioritize pattern remedy, got ${JSON.stringify(officerMixedPattern.usePriority)}`);
const hurtOfficerBazi = {
  person: '伤官见官样本',
  gender: '男',
  pillars: { year: '辛酉', month: '丙午', day: '甲辰', hour: '戊辰' },
  dayStem: '甲',
  dayElement: '木',
  time: { used: { year: 1993, month: 6, day: 1, hour: 8, minute: 0 }, input: { year: 1993, month: 6, day: 1, hour: 8, minute: 0 }, enabled: false, correction: 0, location: { name: 'sample', lng: 120, lat: 30 } },
};
const hurtOfficerPattern = scriptContext.BaziEngine.analyzePattern(hurtOfficerBazi);
assert(hurtOfficerPattern.primary.includes('伤官'), `month-command line should be 伤官, got ${hurtOfficerPattern.primary}`);
assert(hurtOfficerPattern.patternIssues.some((x) => x.includes('伤官见官')), `hurt-officer chart should flag 伤官见官 as a primary issue, got ${JSON.stringify(hurtOfficerPattern.patternIssues)}`);
assert(hurtOfficerPattern.patternVerdict.includes('待制'), `hurt-officer verdict should require 制化, got ${hurtOfficerPattern.patternVerdict}`);
assert(hurtOfficerPattern.remedy.some((x) => x.text.includes('印制伤') || x.text.includes('财星通关')), `hurt-officer chart should expose 病药通关, got ${JSON.stringify(hurtOfficerPattern.remedy)}`);
const noClearRescuePattern = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '辛酉', month: '丁午', day: '甲寅', hour: '丙戌' }, dayStem: '甲' });
const clearSealRescuePattern = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '辛酉', month: '丁午', day: '甲寅', hour: '壬子' }, dayStem: '甲' });
assert(clearSealRescuePattern.patternDisease.residualSeverity < noClearRescuePattern.patternDisease.residualSeverity && clearSealRescuePattern.patternLevelIndex >= noClearRescuePattern.patternLevelIndex, `adding a clear matching seal rescue should reduce residual disease and must not lower natal level, got ${JSON.stringify({ before: { level: noClearRescuePattern.patternLevelGrade, disease: noClearRescuePattern.patternDisease }, after: { level: clearSealRescuePattern.patternLevelGrade, disease: clearSealRescuePattern.patternDisease } })}`);
const noDiseaseScorePattern = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '戊申', month: '丁午', day: '辛酉', hour: '壬辰' }, dayStem: '辛' });
const scoreDimension = (result, key) => result.patternRawScoreBreakdown.dimensions.find((item) => item.key === key);
const traceablePotentialSource = (item) => item && /^ZP-(?:MG|CG|SP)-/.test(item.ruleId || '') && typeof item.pattern === 'string' && item.pattern.length > 0 && typeof item.tier === 'string' && item.tier.length > 0 && typeof item.sourceSystem === 'string' && item.sourceSystem.length > 0 && Array.isArray(item.source) && item.source.length > 0;
assert(scoreDimension(noDiseaseScorePattern, 'remedy').score === 80 && scoreDimension(clearSealRescuePattern, 'remedy').score === 80 && scoreDimension(noClearRescuePattern, 'remedy').score === 25, `no disease and fully solved disease should share the same remedy score while unresolved disease remains lower, got ${JSON.stringify({ none: scoreDimension(noDiseaseScorePattern, 'remedy'), solved: scoreDimension(clearSealRescuePattern, 'remedy'), unresolved: scoreDimension(noClearRescuePattern, 'remedy') })}`);
assert(scoreDimension(clearSealRescuePattern, 'clarity').score >= 50 && (scoreDimension(clearSealRescuePattern, 'clarity').evidence.includes('已由病药维度结算') || /^(清|较清)$/.test(clearSealRescuePattern.clarity.level)), `a disease-owned clarity defect should not be deducted twice across clarity and remedy dimensions, got ${JSON.stringify(scoreDimension(clearSealRescuePattern, 'clarity'))}`);
const strictInjurySealPattern = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '癸卯', month: '丁午', day: '甲寅', hour: '庚子' }, dayStem: '甲' });
assert(strictInjurySealPattern.mainPattern === '伤官配印格' && strictInjurySealPattern.patternStructures.some((x) => x.role === '主格' && x.status === '已成'), `only an established month-command injury-seal structure should qualify for the quality floor, got ${JSON.stringify(strictInjurySealPattern.patternStructures)}`);
assert(strictInjurySealPattern.interactionFlow.steps.every((x) => x.active) && /^(清|较清)$/.test(strictInjurySealPattern.clarity.level) && strictInjurySealPattern.comboConflicts.every((x) => x.name === '未见明显组合冲突'), `strict injury-seal quality should dynamically become clear after an active 印制伤 link passes and no direct breaker remains, got ${JSON.stringify({ flow: strictInjurySealPattern.interactionFlow, clarity: strictInjurySealPattern.clarity, conflicts: strictInjurySealPattern.comboConflicts })}`);
const strictInjuryPotential = scoreDimension(strictInjurySealPattern, 'potential');
assert(strictInjuryPotential.score >= 95 && strictInjuryPotential.components.length === 1 && strictInjurySealPattern.patternRawScoreBreakdown.ledger.filter((item) => item.dimension === 'potential').length === 1 && traceablePotentialSource(strictInjuryPotential.components[0]) && strictInjuryPotential.components[0].ruleId === 'ZP-CG-03' && strictInjuryPotential.components[0].pattern === strictInjurySealPattern.mainPattern && strictInjuryPotential.components[0].tier === 'S', `strict injury-seal should receive one traceable high classical-potential component from its validated main pattern, got ${JSON.stringify(strictInjuryPotential)}`);
const stackedInjuryAnalysis = JSON.parse(JSON.stringify(strictInjurySealPattern));
stackedInjuryAnalysis.patternStructures.push({ name: '食神生财格', ruleId: 'ZP-CG-09', ruleVersion: strictInjurySealPattern.analysisMeta.ruleVersion, role: '兼格', status: '已成', basis: 'synthetic non-main structure used only to verify non-stacking', conflicts: [] });
const stackedInjuryScore = scriptContext.BaziEngine.patternStructureRawScore(stackedInjuryAnalysis);
assert(stackedInjuryScore.dimensions.find((x) => x.key === 'potential').score === strictInjuryPotential.score && stackedInjuryScore.dimensions.find((x) => x.key === 'potential').components.length === 1, `only the arbitrated main pattern may contribute classical potential; compatible secondary names must not stack, got ${JSON.stringify(stackedInjuryScore.dimensions.find((x) => x.key === 'potential'))}`);
assert(scoreDimension(strictInjurySealPattern, 'formation').score >= 85 && strictInjurySealPattern.patternLevelQualityFloor === '' && strictInjurySealPattern.patternLevelHardGate.floorGrade === '中等' && strictInjurySealPattern.patternLevelHardGate.topEligible && strictInjurySealPattern.patternLevelHardGate.ceilingGrade === '顶级' && strictInjurySealPattern.patternLevelCriteria.some((x) => x.name === '伤官配印严检' && x.met) && strictInjurySealPattern.patternLevelTieBreak.tier === 2, `a strictly formed, dynamically clear injury-seal structure should obtain high classical potential and top eligibility without receiving a second noble-pattern floor, got ${JSON.stringify({ potential: strictInjuryPotential, floor: strictInjurySealPattern.patternLevelQualityFloor, grade: strictInjurySealPattern.patternLevelGrade, gate: strictInjurySealPattern.patternLevelHardGate, tieBreak: strictInjurySealPattern.patternLevelTieBreak, criteria: strictInjurySealPattern.patternLevelCriteria })}`);
assert(['有力', '有情', '源流贯通', '制化得宜', '去留得宜'].every((term) => strictInjurySealPattern.clarityConclusion.terms.includes(term)) && scriptContext.patternClarityText({ pillars: { year: '癸卯', month: '丁午', day: '甲寅', hour: '庚子' }, dayStem: '甲' }).includes('专业判断：'), `clarity should expose direct professional conclusions instead of only generic advice, got ${JSON.stringify(strictInjurySealPattern.clarityConclusion)}`);
const strictFoodWealthBazi = { pillars: { year: '甲寅', month: '丙巳', day: '甲寅', hour: '戊辰' }, dayStem: '甲' };
const strictFoodWealthPattern = scriptContext.BaziEngine.analyzePattern(strictFoodWealthBazi);
assert(strictFoodWealthPattern.mainPattern === '食神生财格' && strictFoodWealthPattern.patternStructures.some((x) => x.name === '食神生财格' && x.ruleId === 'ZP-CG-09' && x.status === '已成'), `rooted daymaster, clear food, and reachable wealth should form 食神生财, got ${JSON.stringify(strictFoodWealthPattern.patternStructures)}`);
assert(strictFoodWealthPattern.interactionFlow.steps.some((x) => x.from.includes('食神') && x.to.some((god) => god.includes('财')) && x.action === '生'), `食神生财 should expose a food-to-wealth action chain, got ${JSON.stringify(strictFoodWealthPattern.interactionFlow)}`);
const strictFoodWealthPotential = scoreDimension(strictFoodWealthPattern, 'potential');
assert(strictFoodWealthPotential.score >= 90 && strictFoodWealthPotential.components.length === 1 && traceablePotentialSource(strictFoodWealthPotential.components[0]) && strictFoodWealthPotential.components[0].ruleId === 'ZP-CG-09' && strictFoodWealthPotential.components[0].pattern === strictFoodWealthPattern.mainPattern && strictFoodWealthPotential.components[0].tier === 'S' && strictFoodWealthPattern.patternLevelTieBreak.tier === 2 && strictFoodWealthPattern.patternLevelCriteria.some((x) => x.name === '严格成格组合' && x.met), `strict 食神生财 should join the traceable high-quality combination tier, got ${JSON.stringify({ potential: strictFoodWealthPotential, tieBreak: strictFoodWealthPattern.patternLevelTieBreak, criteria: strictFoodWealthPattern.patternLevelCriteria })}`);
assert(strictFoodWealthPattern.patternDisease.items.length > 0 && strictFoodWealthPattern.patternDisease.items.every((x) => x.status === '已解') && !strictFoodWealthPattern.patternLevelHardGate.reasons.some((x) => x.includes('清浊未定') || x.includes('冲战明显')) && ['高','顶级'].includes(strictFoodWealthPattern.patternLevelHardGate.ceilingGrade), `fully solved food-wealth diseases must not cap the chart again through same-cause clarity, got ${JSON.stringify({ clarity: strictFoodWealthPattern.clarity, disease: strictFoodWealthPattern.patternDisease, gate: strictFoodWealthPattern.patternLevelHardGate })}`);
const weakFoodWealthPattern = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '壬子', month: '丙巳', day: '甲申', hour: '戊辰' }, dayStem: '甲' });
assert(!weakFoodWealthPattern.comboPatterns.includes('食神生财格') && weakFoodWealthPattern.comboClues.some((x) => x.name === '食神生财线索参考' && x.text.includes('承泄任财不足')), `food and wealth without daymaster capacity should remain a clue, got ${JSON.stringify({ formed: weakFoodWealthPattern.comboPatterns, clues: weakFoodWealthPattern.comboClues })}`);
assert(scoreDimension(weakFoodWealthPattern, 'potential').score < strictFoodWealthPotential.score && !scoreDimension(weakFoodWealthPattern, 'potential').components.some((x) => x.ruleId === 'ZP-CG-09'), `an unformed 食神生财 clue must not receive the established pattern's classical potential, got ${JSON.stringify(scoreDimension(weakFoodWealthPattern, 'potential'))}`);
const textOnlyNobleAnalysis = JSON.parse(JSON.stringify(weakFoodWealthPattern));
const originalWeakFoodPotential = scriptContext.BaziEngine.patternStructureRawScore(textOnlyNobleAnalysis).dimensions.find((x) => x.key === 'potential');
textOnlyNobleAnalysis.mainPattern = '伤官配印格';
const textOnlyNoblePotential = scriptContext.BaziEngine.patternStructureRawScore(textOnlyNobleAnalysis).dimensions.find((x) => x.key === 'potential');
assert(textOnlyNoblePotential.score === originalWeakFoodPotential.score && JSON.stringify(textOnlyNoblePotential.components) === JSON.stringify(originalWeakFoodPotential.components), `changing only a display pattern name must not create noble-pattern potential, got ${JSON.stringify({ before: originalWeakFoodPotential, after: textOnlyNoblePotential })}`);
const heavyKillPattern = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '庚午', month: '庚午', day: '甲戌', hour: '庚午' }, dayStem: '甲' });
assert(heavyKillPattern.tenGodTerms.some((x) => x.name === '杀重身轻' && x.status === '明确成立' && x.ruleId === 'ZP-TS-01') && heavyKillPattern.factors.some((x) => x.text.includes('杀重身轻')), `uncontrolled rooted killing against a weak daymaster should expose 杀重身轻 directly, got ${JSON.stringify(heavyKillPattern.tenGodTerms)}`);
const killWithSealPattern = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '庚申', month: '庚申', day: '甲子', hour: '壬子' }, dayStem: '甲' });
assert(!killWithSealPattern.tenGodTerms.some((x) => x.name === '杀重身轻'), `rooted and revealed seal-transform support should prevent a pure 杀重身轻 verdict, got ${JSON.stringify(killWithSealPattern.tenGodTerms)}`);
const unsupportedStrongPattern = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '甲子', month: '乙卯', day: '甲寅', hour: '丙午' }, dayStem: '甲' });
assert(unsupportedStrongPattern.tenGodTerms.some((x) => x.name === '身旺无依' && x.status === '明确成立') && unsupportedStrongPattern.positivePhenomena.some((x) => x.name === '食伤泄秀'), `strong output should distinguish 身旺无依 diagnosis from a simultaneously usable 食伤泄秀 outlet, got ${JSON.stringify({ terms: unsupportedStrongPattern.tenGodTerms, positive: unsupportedStrongPattern.positivePhenomena })}`);
const positivePhenomenonCases = [
  { name: '木火通明', pillars: { year: '甲寅', month: '丙寅', day: '乙卯', hour: '丁巳' } },
  { name: '金白水清', pillars: { year: '庚申', month: '壬申', day: '辛酉', hour: '癸亥' } },
  { name: '水木清华', pillars: { year: '壬子', month: '甲寅', day: '癸亥', hour: '乙卯' } },
];
positivePhenomenonCases.forEach((item) => {
  const bazi = { pillars: item.pillars, dayStem: item.pillars.day[0] };
  const result = scriptContext.BaziEngine.analyzePattern(bazi);
  const positive = result.positivePhenomena.find((x) => x.name === item.name);
  assert(positive && positive.status === '明确成立' && positive.evidence.length === 3 && positive.boundary && positive.ruleVersion === 'ZP-2026.07.14.1', `${item.name} should require season, visibility, roots, balance, and a stated counter-boundary, got ${JSON.stringify(result.positivePhenomena)}`);
  assert(scriptContext.positivePhenomenonText(bazi).includes(item.name) && scriptContext.positivePhenomenonText(bazi).includes('成立边界与来源') && scriptContext.positivePhenomenonContextText(bazi).includes(item.name) && !scriptContext.positivePhenomenonContextText(bazi).includes('<details'), `${item.name} should reach both the concise page card and complete AI context`);
  assert(!scriptContext.positivePhenomenonText(bazi).includes('ZP-ZX-'), 'visible positive-phenomenon details should suppress internal rule ids');
});
const strictKillSealPattern = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '戊申', month: '丁午', day: '辛酉', hour: '壬辰' }, dayStem: '辛' });
assert(strictKillSealPattern.mainPattern === '杀印相生格' && strictKillSealPattern.patternLevelTieBreak.tier === 2 && strictKillSealPattern.patternLevelTieBreak.label === '严格成格组合', `a clean kill-seal structure should share the strict-combination tie tier instead of relying on a hard-coded name rank, got ${JSON.stringify(strictKillSealPattern.patternLevelTieBreak)}`);
assert(strictKillSealPattern.patternLevelQualityFloor === '' && strictKillSealPattern.patternLevelHardGate.floorGrade === '中等' && strictKillSealPattern.patternLevelHardGate.topEligible && strictKillSealPattern.patternLevelGrade === '顶级' && strictKillSealPattern.patternLevelCriteria.some((x) => x.name === '严格成格组合' && x.met) && strictKillSealPattern.patternLevelCriteria.some((x) => x.name === '同分优先级' && x.result.includes('严格成格组合')), `strict kill-seal should reach top grade only after the percentile and strict top gates pass, without a second noble-pattern floor, got ${JSON.stringify({ floor: strictKillSealPattern.patternLevelQualityFloor, grade: strictKillSealPattern.patternLevelGrade, gate: strictKillSealPattern.patternLevelHardGate, criteria: strictKillSealPattern.patternLevelCriteria })}`);
const strictBladeKillBazi = { pillars: { year: '甲寅', month: '乙卯', day: '甲寅', hour: '庚戌' }, dayStem: '甲' };
const strictBladeKillPattern = scriptContext.BaziEngine.analyzePattern(strictBladeKillBazi);
assert(strictBladeKillPattern.regularPattern.name === '月刃格' && strictBladeKillPattern.mainPattern === '羊刃驾杀格' && strictBladeKillPattern.patternStructures.some((x) => x.name === '羊刃驾杀格' && x.role === '主格' && x.ruleId === 'ZP-CG-08'), `only a strong month-blade chart with clear reachable seven-killing should form 羊刃驾杀, got ${JSON.stringify(strictBladeKillPattern.patternStructures)}`);
assert(strictBladeKillPattern.interactionFlow.steps.some((x) => x.from.includes('七杀') && x.to.includes('劫财') && x.action === '制' && x.active) && strictBladeKillPattern.clarity.level === '较清' && strictBladeKillPattern.patternLevelTieBreak.tier === 2 && strictBladeKillPattern.patternLevelQualityFloor === '' && strictBladeKillPattern.patternLevelHardGate.floorGrade === '中等', `羊刃驾杀 should require a reachable 杀制刃 chain while its high potential is counted once rather than repeated through a quality floor, got ${JSON.stringify({ flow: strictBladeKillPattern.interactionFlow, clarity: strictBladeKillPattern.clarity, tieBreak: strictBladeKillPattern.patternLevelTieBreak, floor: strictBladeKillPattern.patternLevelQualityFloor })}`);
assert(strictBladeKillPattern.useful.specific.primary.some((x) => x.tenGods.length === 1 && x.tenGods[0] === '七杀') && strictBladeKillPattern.clarityConclusion && strictBladeKillPattern.clarityConclusion.conclusion.includes('已成') && scriptContext.patternClarityText(strictBladeKillBazi).includes('作用：') && !scriptContext.patternClarityText(strictBladeKillBazi).includes('受阻：未见') && !scriptContext.patternClarityText(strictBladeKillBazi).includes('救应：未见'), `formed 羊刃驾杀 should expose a direct conclusion without empty blocker or rescue boilerplate, got ${JSON.stringify({ useful: strictBladeKillPattern.useful, clarityConclusion: strictBladeKillPattern.clarityConclusion, text: scriptContext.patternClarityText(strictBladeKillBazi) })}`);
const unformedBladeKillPattern = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '甲寅', month: '乙卯', day: '甲寅', hour: '丙申' }, dayStem: '甲' });
assert(unformedBladeKillPattern.mainPattern !== '羊刃驾杀格' && unformedBladeKillPattern.comboClues.some((x) => x.name === '羊刃驾杀线索参考' && x.text.includes('七杀未透') && x.ruleId === 'ZP-CG-08'), `hidden killing or an active food-control route must leave 羊刃驾杀 as a clue, got ${JSON.stringify(unformedBladeKillPattern.comboClues)}`);
const wealthDamagesInjurySeal = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '癸卯', month: '丁午', day: '甲寅', hour: '己巳' }, dayStem: '甲' });
assert(wealthDamagesInjurySeal.comboConflicts.some((x) => x.name === '财坏印') && wealthDamagesInjurySeal.patternLevelQualityFloor === '' && wealthDamagesInjurySeal.patternLevelTieBreak.tier < 2 && wealthDamagesInjurySeal.patternLevelCriteria.some((x) => x.name === '伤官配印严检' && !x.met), `wealth damaging the seal must remove the injury-seal quality floor and strict-combination priority rather than treating every 伤官见印 as a贵格, got ${JSON.stringify({ conflicts: wealthDamagesInjurySeal.comboConflicts, floor: wealthDamagesInjurySeal.patternLevelQualityFloor, tieBreak: wealthDamagesInjurySeal.patternLevelTieBreak, criteria: wealthDamagesInjurySeal.patternLevelCriteria })}`);
assert(wealthDamagesInjurySeal.patternLevelIndex <= strictInjurySealPattern.patternLevelIndex, `adding a direct wealth-damages-seal breaker must not improve the natal level, got clean ${strictInjurySealPattern.patternLevelGrade} vs damaged ${wealthDamagesInjurySeal.patternLevelGrade}`);
assert(scoreDimension(wealthDamagesInjurySeal, 'potential').score < strictInjuryPotential.score && !scoreDimension(wealthDamagesInjurySeal, 'potential').components.some((x) => x.ruleId === 'ZP-CG-03') && !wealthDamagesInjurySeal.patternLevelHardGate.topEligible, `财坏印 must block the validated 伤官配印 potential instead of preserving a name-based noble bonus, got ${JSON.stringify({ potential: scoreDimension(wealthDamagesInjurySeal, 'potential'), gate: wealthDamagesInjurySeal.patternLevelHardGate })}`);
assert(scriptContext.comboConflictText({ pillars: { year: '癸卯', month: '丁午', day: '甲寅', hour: '己巳' }, dayStem: '甲' }).includes('贪财坏印（又称财坏印）'), 'the page should expose the mainstream professional name 贪财坏印 while preserving its normalized alias');
const wealthWeakBazi = {
  person: '财多身弱样本',
  gender: '男',
  pillars: { year: '戊辰', month: '戊辰', day: '甲申', hour: '戊巳' },
  dayStem: '甲',
  dayElement: '木',
  time: { used: { year: 1993, month: 4, day: 1, hour: 10, minute: 0 }, input: { year: 1993, month: 4, day: 1, hour: 10, minute: 0 }, enabled: false, correction: 0, location: { name: 'sample', lng: 120, lat: 30 } },
};
const wealthWeakPattern = scriptContext.BaziEngine.analyzePattern(wealthWeakBazi);
assert(wealthWeakPattern.patternIssues.some((x) => x.includes('财多身弱')), `weak wealth-heavy chart should flag 财多身弱 as a primary issue, got ${JSON.stringify(wealthWeakPattern.patternIssues)}`);
assert(wealthWeakPattern.useful.layers.pattern.why.includes('印比'), `wealth-heavy weak chart should use 印比 as the pattern anchor, got ${wealthWeakPattern.useful.layers.pattern.why}`);
assert(wealthWeakPattern.remedy.some((x) => x.text.includes('印比扶身')), `wealth-heavy weak chart should expose 印比扶身 remedy, got ${JSON.stringify(wealthWeakPattern.remedy)}`);
const wealthWeakNatalSnapshot = JSON.stringify({ grade: wealthWeakPattern.patternLevelGrade, index: wealthWeakPattern.patternLevelIndex, main: wealthWeakPattern.mainPattern, disease: wealthWeakPattern.patternDisease });
const helpfulLuckImpact = scriptContext.BaziEngine.evaluateLuckImpact(wealthWeakBazi.dayStem, '壬寅', wealthWeakPattern);
const harmfulLuckImpact = scriptContext.BaziEngine.evaluateLuckImpact(wealthWeakBazi.dayStem, '丙辰', wealthWeakPattern);
assert(JSON.stringify({ grade: wealthWeakPattern.patternLevelGrade, index: wealthWeakPattern.patternLevelIndex, main: wealthWeakPattern.mainPattern, disease: wealthWeakPattern.patternDisease }) === wealthWeakNatalSnapshot, 'evaluating helpful or harmful luck must not mutate the natal pattern level');
assert(helpfulLuckImpact.natalGrade === wealthWeakPattern.patternLevelGrade && helpfulLuckImpact.scope.includes('不改写原局') && ['运中补格', '发挥提升'].includes(helpfulLuckImpact.activationStatus), `luck output should separate natal grade from current activation, got ${JSON.stringify(helpfulLuckImpact)}`);
assert(helpfulLuckImpact.action === '提升' && helpfulLuckImpact.text.includes('当前大运壬寅'), `印比 current luck should raise a wealth-heavy weak chart, got ${JSON.stringify(helpfulLuckImpact)}`);
assert(harmfulLuckImpact.action === '下降' && harmfulLuckImpact.text.includes('当前大运丙辰'), `食财 current luck should lower a wealth-heavy weak chart, got ${JSON.stringify(harmfulLuckImpact)}`);
assert(helpfulLuckImpact.fromStatus !== helpfulLuckImpact.toStatus && helpfulLuckImpact.text.includes('格局状态由'), `helpful current luck should expose a direct formation-status transition, got ${JSON.stringify(helpfulLuckImpact)}`);
assert(harmfulLuckImpact.fromStatus === '已破' && harmfulLuckImpact.toStatus === '已破' && harmfulLuckImpact.text.includes('格局状态维持已破'), `a harmful current luck should retain a direct failed status when the natal pattern is already broken, got ${JSON.stringify(harmfulLuckImpact)}`);
assert(helpfulLuckImpact.conditionReview && helpfulLuckImpact.conditionReview.completed.some((x) => x.label.includes('身能任财')) && helpfulLuckImpact.toMain === '偏财格', `helpful luck should rerun the same formation checklist and state which missing condition it completes, got ${JSON.stringify(helpfulLuckImpact)}`);
assert(harmfulLuckImpact.conditionReview.formedAdded.includes('食神制杀格') && harmfulLuckImpact.conditionReview.effectiveAdded.length === 0 && harmfulLuckImpact.text.includes('不改原局主格'), `a non-month-anchored structure triggered only by luck should remain a timing clue, got ${JSON.stringify(harmfulLuckImpact)}`);
const halfWaterPattern = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '庚申', month: '壬子', day: '甲午', hour: '戊戌' }, dayStem: '甲' });
const completedWaterLuck = scriptContext.BaziEngine.evaluateLuckImpact('甲', '壬辰', halfWaterPattern);
assert(completedWaterLuck.text.includes('补成三合水局'), `current luck should explain when it completes a natal harmony group, got ${JSON.stringify(completedWaterLuck)}`);
const mixedOutputBazi = {
  person: '食伤混杂样本',
  gender: '男',
  pillars: { year: '壬子', month: '癸子', day: '庚申', hour: '甲申' },
  dayStem: '庚',
  dayElement: '金',
  time: { used: { year: 1993, month: 12, day: 1, hour: 12, minute: 0 }, input: { year: 1993, month: 12, day: 1, hour: 12, minute: 0 }, enabled: false, correction: 0, location: { name: 'sample', lng: 120, lat: 30 } },
};
const mixedOutputPattern = scriptContext.BaziEngine.analyzePattern(mixedOutputBazi);
assert(mixedOutputPattern.patternIssues.some((x) => x.includes('食伤混杂')), `mixed output chart should flag 食伤混杂 as a primary issue, got ${JSON.stringify(mixedOutputPattern.patternIssues)}`);
assert(mixedOutputPattern.patternVerdict.includes('待清'), `mixed output verdict should require clearing, got ${mixedOutputPattern.patternVerdict}`);
const followKillBazi = {
  person: '从杀样本',
  gender: '男',
  pillars: { year: '辛酉', month: '庚酉', day: '甲戌', hour: '庚午' },
  dayStem: '甲',
  dayElement: '木',
  time: { used: { year: 1993, month: 9, day: 1, hour: 12, minute: 0 }, input: { year: 1993, month: 9, day: 1, hour: 12, minute: 0 }, enabled: false, correction: 0, location: { name: 'sample', lng: 120, lat: 30 } },
};
const followKillPattern = scriptContext.BaziEngine.analyzePattern(followKillBazi);
assert(followKillPattern.specialPatterns.some((x) => x.includes('从杀格')), `unsupported heavy killing chart should form 从杀格, got ${followKillPattern.specialPatterns.join(',')}`);
assert(followKillPattern.mainPattern.includes('从杀格'), `true follow pattern should become main pattern, got ${followKillPattern.mainPattern}`);
assert(followKillPattern.patternArbitration.main.source === '特殊格局' && followKillPattern.patternStructures.some((x) => x.name.includes('从杀格') && x.role === '主格'), `a true special pattern should enter the same main-pattern arbitration and structure output, got ${JSON.stringify(followKillPattern.patternArbitration)}`);
assert(followKillPattern.useful.layers.pattern.why.includes('顺从'), `follow pattern use should follow the dominant force, got ${followKillPattern.useful.layers.pattern.why}`);
assert(!followKillPattern.useful.use.includes('木') && !followKillPattern.useful.use.includes('水'), `true follow-kill pattern should not mix ordinary 印比扶身 into total useful elements, got ${followKillPattern.useful.use.join(',')}`);
assert(followKillPattern.useful.avoid.includes('火'), `true follow-kill pattern should mark forceful 食伤 reversal as a break boundary, got ${JSON.stringify(followKillPattern.useful)}`);
const followKillPotential = scoreDimension(followKillPattern, 'potential');
assert(followKillPotential.score >= 90 && followKillPotential.components.length === 1 && followKillPotential.components[0].ruleId === 'ZP-SP-01' && followKillPotential.components[0].pattern === followKillPattern.mainPattern && followKillPotential.components[0].tier === 'S' && followKillPattern.patternStructures.some((x) => x.role === '主格' && x.ruleId === 'ZP-SP-01') && traceablePotentialSource(followKillPotential.components[0]), `a strictly validated follow pattern should receive one traceable high special-pattern potential component, got ${JSON.stringify(followKillPotential)}`);
assert(!followKillPattern.patternDisease.items.some((x) => x.family === '官杀承载不足' || x.family === '官杀去留') && !/^(浊|偏浊|不清|冲战)$/.test(followKillPattern.clarity.level) && scoreDimension(followKillPattern, 'remedy').score === scoreDimension(noDiseaseScorePattern, 'remedy').score, `true 从杀 must be judged in its follow-pattern context instead of being penalized again for ordinary weak-body or mixed-officer diseases, got ${JSON.stringify({ disease: followKillPattern.patternDisease, clarity: followKillPattern.clarity, remedy: scoreDimension(followKillPattern, 'remedy') })}`);
const followKillAiContext = scriptContext.buildPatternContextText(followKillBazi);
assert(followKillAiContext.includes('命格：从格：从杀格') && followKillAiContext.includes('扶抑用神：不单独取用；特殊格已严格成立') && followKillAiContext.includes('调候用神：不单独取用；特殊格已严格成立'), `AI context should identify the true special main pattern and keep ordinary balance/climate layers validation-only, got ${followKillAiContext}`);
assert(!followKillAiContext.includes('正官格（已破）') && !followKillAiContext.includes('官杀混杂待清') && !followKillAiContext.includes('日主弱，需印比化扶'), `AI context must not leak contradictory ordinary-pattern failure or strength advice after 从杀 strictly qualifies, got ${followKillAiContext}`);
const unsupportedFollowKillBazi = {
  person: '非当令从杀线索样本',
  gender: '男',
  pillars: { year: '庚巳', month: '庚巳', day: '甲戌', hour: '庚午' },
  dayStem: '甲',
  dayElement: '木',
  time: { used: { year: 1993, month: 5, day: 1, hour: 12, minute: 0 }, input: { year: 1993, month: 5, day: 1, hour: 12, minute: 0 }, enabled: false, correction: 0, location: { name: 'sample', lng: 120, lat: 30 } },
};
const unsupportedFollowKillPattern = scriptContext.BaziEngine.analyzePattern(unsupportedFollowKillBazi);
assert(!unsupportedFollowKillPattern.specialPatterns.some((x) => x.startsWith('从格：')), `non-month-command killing should not form 从杀格, got ${unsupportedFollowKillPattern.specialPatterns.join(',')}`);
assert(unsupportedFollowKillPattern.specialPatterns.some((x) => x.includes('假从杀倾向')), `non-month-command killing should remain a special-pattern clue, got ${unsupportedFollowKillPattern.specialPatterns.join(',')}`);
assert(!unsupportedFollowKillPattern.mainPattern.includes('从杀格'), `unformed follow-kill clue should not become main pattern, got ${unsupportedFollowKillPattern.mainPattern}`);
assert(!scoreDimension(unsupportedFollowKillPattern, 'potential').components.some((x) => /^ZP-SP-/.test(x.ruleId || '')), `an unformed follow clue must not receive special-pattern potential, got ${JSON.stringify(scoreDimension(unsupportedFollowKillPattern, 'potential'))}`);
const fakeFollowBazi = {
  person: '假从样本',
  gender: '男',
  pillars: { year: '辛酉', month: '庚酉', day: '甲子', hour: '庚午' },
  dayStem: '甲',
  dayElement: '木',
  time: { used: { year: 1993, month: 9, day: 1, hour: 12, minute: 0 }, input: { year: 1993, month: 9, day: 1, hour: 12, minute: 0 }, enabled: false, correction: 0, location: { name: 'sample', lng: 120, lat: 30 } },
};
const fakeFollowPattern = scriptContext.BaziEngine.analyzePattern(fakeFollowBazi);
assert(!fakeFollowPattern.specialPatterns.some((x) => x.startsWith('从格：')), `rooted chart should not be true follow pattern, got ${fakeFollowPattern.specialPatterns.join(',')}`);
assert(!scoreDimension(fakeFollowPattern, 'potential').components.some((x) => /^ZP-SP-/.test(x.ruleId || '') || /假从/.test(x.evidence || '')), `假从 may remain a clue but must contribute no special classical potential, got ${JSON.stringify(scoreDimension(fakeFollowPattern, 'potential'))}`);
const transformBazi = {
  person: '化气样本',
  gender: '女',
  pillars: { year: '甲卯', month: '壬卯', day: '丁亥', hour: '甲辰' },
  dayStem: '丁',
  dayElement: '火',
  time: { used: { year: 1993, month: 2, day: 10, hour: 8, minute: 0 }, input: { year: 1993, month: 2, day: 10, hour: 8, minute: 0 }, enabled: false, correction: 0, location: { name: 'sample', lng: 120, lat: 30 } },
};
const transformPattern = scriptContext.BaziEngine.analyzePattern(transformBazi);
assert(transformPattern.specialPatterns.some((x) => x.includes('丁壬化木')), `season-supported transform should form 丁壬化木, got ${transformPattern.specialPatterns.join(',')}`);
assert(transformPattern.mainPattern.includes('化气格'), `true transform should become main pattern, got ${transformPattern.mainPattern}`);
const transformPotential = scoreDimension(transformPattern, 'potential');
assert(transformPotential.score >= 90 && transformPotential.components.length === 1 && transformPotential.components[0].ruleId === 'ZP-SP-09' && transformPotential.components[0].pattern === transformPattern.mainPattern && transformPotential.components[0].tier === 'S' && transformPattern.patternStructures.some((x) => x.role === '主格' && x.ruleId === 'ZP-SP-09') && traceablePotentialSource(transformPotential.components[0]), `a true 化气 pattern should receive one traceable high special-pattern potential component, got ${JSON.stringify(transformPotential)}`);
assert(!transformPattern.elementPhenomena.some((x) => x.name === '木多火塞') && !/^(有瑕|浊|偏浊|不清|冲战)$/.test(transformPattern.clarity.level), `a true 丁壬化木 chart must be evaluated around transformed wood qi instead of inheriting fire-daymaster 木多火塞 or ordinary 印格 clarity penalties, got ${JSON.stringify({ phenomena: transformPattern.elementPhenomena, clarity: transformPattern.clarity })}`);
assert(transformPattern.useful.avoid.includes('火'), `丁壬化木 should expose restoration of the original fire qi as a transform-break boundary, got ${JSON.stringify(transformPattern.useful)}`);
const rootedTransformBazi = {
  person: '化气破根样本',
  gender: '女',
  pillars: { year: '甲寅', month: '壬寅', day: '丁午', hour: '甲辰' },
  dayStem: '丁',
  dayElement: '火',
  time: { used: { year: 1993, month: 2, day: 10, hour: 8, minute: 0 }, input: { year: 1993, month: 2, day: 10, hour: 8, minute: 0 }, enabled: false, correction: 0, location: { name: 'sample', lng: 120, lat: 30 } },
};
const rootedTransformPattern = scriptContext.BaziEngine.analyzePattern(rootedTransformBazi);
assert(!rootedTransformPattern.specialPatterns.some((x) => x.startsWith('化气格：')), `rooted day master should not form 化气格, got ${rootedTransformPattern.specialPatterns.join(',')}`);
assert(rootedTransformPattern.specialPatterns.some((x) => x.includes('丁壬化木未成倾向')), `rooted transform should remain a special-pattern clue, got ${rootedTransformPattern.specialPatterns.join(',')}`);
assert(!scoreDimension(rootedTransformPattern, 'potential').components.some((x) => /^ZP-SP-/.test(x.ruleId || '') || /化气/.test(x.evidence || '')), `假化 may remain a clue but must contribute no special classical potential, got ${JSON.stringify(scoreDimension(rootedTransformPattern, 'potential'))}`);
const oppositePolarityRootedTransformPattern = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '甲寅', month: '壬寅', day: '丁巳', hour: '甲辰' }, dayStem: '丁' });
assert(!oppositePolarityRootedTransformPattern.specialPatterns.some((x) => x.startsWith('化气格：')) && oppositePolarityRootedTransformPattern.specialPatterns.some((x) => x.includes('丁壬化木未成倾向')), `an opposite-polarity peer root such as 巳中丙 must also break 丁壬化木, got ${JSON.stringify(oppositePolarityRootedTransformPattern.specialPatterns)}`);

const assertStrictSpecialPattern = (label, result, ruleId) => {
  const qualification = result.specialPatternQualification;
  const potential = scoreDimension(result, 'potential');
  const remedy = scoreDimension(result, 'remedy');
  assert(qualification && qualification.ruleId === ruleId && qualification.status === '已成' && qualification.completion === 1 && result.mainPattern === qualification.name, `${label} should be the strictly qualified arbitrated main pattern under ${ruleId}, got ${JSON.stringify({ main: result.mainPattern, qualification })}`);
  assert(qualification.checks.length >= 4 && qualification.checks.every((check) => check.met && check.ruleId.startsWith(`${ruleId}-Q`) && typeof check.evidence === 'string' && check.evidence.length > 0) && qualification.evidence.length === qualification.checks.length, `${label} should expose a stable rule id and direct evidence for every satisfied qualification check, got ${JSON.stringify(qualification)}`);
  assert(potential.score >= 90 && potential.components.length === 1 && result.patternRawScoreBreakdown.ledger.filter((item) => item.dimension === 'potential').length === 1 && potential.components[0].ruleId === ruleId && potential.components[0].pattern === result.mainPattern && potential.components[0].tier === 'S' && traceablePotentialSource(potential.components[0]), `${label} should receive exactly one traceable special-pattern potential component, got ${JSON.stringify(potential)}`);
  assert(result.patternStructures.some((item) => item.role === '主格' && item.ruleId === ruleId && item.status === '已成') && result.patternDisease.items.length === 0 && result.elementPhenomena.length === 0 && remedy.score === scoreDimension(noDiseaseScorePattern, 'remedy').score && /^(清|较清)$/.test(result.clarity.level), `${label} should suppress ordinary-context disease deductions and be judged in its own clear special-pattern context, got ${JSON.stringify({ structures: result.patternStructures, disease: result.patternDisease, phenomena: result.elementPhenomena, remedy, clarity: result.clarity })}`);
  assert(result.patternConfidence.level === '高置信' && result.patternState.includes(result.mainPattern) && !/需印比化扶|宜泄耗制化|格已破/.test(result.patternState), `${label} should expose a special-pattern confidence and state without ordinary strength advice, got ${JSON.stringify({ confidence: result.patternConfidence, state: result.patternState })}`);
  assert(result.regularPattern.status === '仅作背景' && result.regularPattern.checks.length === 0 && result.patternStructures.some((item) => item.role === '月令背景' && item.status === '仅作背景'), `${label} should retain the monthly regular pattern only as a non-numeric background, got ${JSON.stringify({ regular: result.regularPattern, structures: result.patternStructures })}`);
  assert(result.remedy.length === 1 && result.remedy[0].title === '特殊格顺势' && result.patternReasoning.rescue.length === 0 && result.factors.every((item) => item.ruleId && item.type === '成'), `${label} should replace ordinary remedies, rescue chains, and formation factors with its own qualification context, got ${JSON.stringify({ remedy: result.remedy, reasoning: result.patternReasoning, factors: result.factors })}`);
  assert(!result.useful.use.some((element) => result.useful.avoid.includes(element)), `${label} should not expose the same element as both useful and avoid, got ${JSON.stringify(result.useful)}`);
  if (qualification.type === '专旺格') {
    const outlet = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }[qualification.target];
    assert(result.useful.use.includes(outlet), `${label} should retain its required 食伤泄秀 outlet ${outlet} in the useful list, got ${JSON.stringify(result.useful)}`);
  }
};
const assertRejectedSpecialPattern = (label, result) => {
  const potential = scoreDimension(result, 'potential');
  assert(!result.specialPatterns.some((item) => /^(从格：|化气格：|专旺格：)/.test(item)) && !result.specialPatternQualification, `${label} should fail strict special-pattern qualification, got ${JSON.stringify({ specialPatterns: result.specialPatterns, qualification: result.specialPatternQualification })}`);
  assert(!potential.components.some((item) => /^ZP-SP-/.test(item.ruleId || '')), `${label} must not receive special-pattern potential after qualification fails, got ${JSON.stringify(potential)}`);
};

const followWealthPattern = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '己巳', month: '戊戌', day: '甲午', hour: '丙戌' }, dayStem: '甲' });
assertStrictSpecialPattern('从财格', followWealthPattern, 'ZP-SP-04');
assert(followWealthPattern.useful.use.includes('火') && followWealthPattern.useful.avoid.includes('金') && !followWealthPattern.clarityConclusion.remove.includes('食伤逆势'), `从财格 should keep 食伤生财 as useful, mark 官杀泄财 as a break boundary, and never describe 食伤 itself as breaking the pattern, got ${JSON.stringify({ useful: followWealthPattern.useful, clarity: followWealthPattern.clarityConclusion })}`);
const rootedFollowWealthPattern = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '己巳', month: '戊戌', day: '甲寅', hour: '丙戌' }, dayStem: '甲' });
assertRejectedSpecialPattern('日主有根的假从财', rootedFollowWealthPattern);
assertStrictSpecialPattern('从儿格', trueFollowChildPattern, 'ZP-SP-05');
const sealedFollowChildPattern = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '戊子', month: '癸亥', day: '辛亥', hour: '壬子' }, dayStem: '辛' });
assert(sealedFollowChildPattern.specialPatterns.some((item) => item.includes('假从儿倾向')), `an effective revealed seal should leave only a 假从儿 clue, got ${JSON.stringify(sealedFollowChildPattern.specialPatterns)}`);
assertRejectedSpecialPattern('印星逆制的假从儿', sealedFollowChildPattern);

const additionalTransformSpecialCases = [
  { label: '甲己化土', ruleId: 'ZP-SP-06', pillars: { year: '戊戌', month: '己丑', day: '甲午', hour: '丙戌' } },
  { label: '乙庚化金', ruleId: 'ZP-SP-07', pillars: { year: '辛酉', month: '庚申', day: '乙巳', hour: '戊申' } },
  { label: '丙辛化水', ruleId: 'ZP-SP-08', pillars: { year: '壬子', month: '辛亥', day: '丙申', hour: '癸亥' } },
  { label: '戊癸化火', ruleId: 'ZP-SP-10', pillars: { year: '丁巳', month: '戊午', day: '癸巳', hour: '丙午' } },
];
additionalTransformSpecialCases.forEach((item) => {
  const result = scriptContext.BaziEngine.analyzePattern({ pillars: item.pillars, dayStem: item.pillars.day[0] });
  assertStrictSpecialPattern(item.label, result, item.ruleId);
});
assert(new Set(additionalTransformSpecialCases.map((item) => item.ruleId).concat(transformPattern.specialPatternQualification.ruleId)).size === 5, 'the four added 化气 cases plus the existing 丁壬化木 case should lock all five classical stem transformations');
const rootedTransformSpecialCases = [
  { label: '甲己化土见甲根', pillars: { year: '戊戌', month: '己丑', day: '甲寅', hour: '丙戌' } },
  { label: '乙庚化金见乙根', pillars: { year: '辛酉', month: '庚申', day: '乙卯', hour: '戊申' } },
  { label: '丙辛化水见丙根', pillars: { year: '壬子', month: '辛亥', day: '丙寅', hour: '癸亥' } },
  { label: '戊癸化火见癸根', pillars: { year: '丁巳', month: '戊午', day: '癸丑', hour: '丙午' } },
];
rootedTransformSpecialCases.forEach((item) => {
  const result = scriptContext.BaziEngine.analyzePattern({ pillars: item.pillars, dayStem: item.pillars.day[0] });
  assert(result.specialPatterns.some((text) => text.includes(`${item.label.slice(0, 4)}未成倾向`)), `${item.label} should retain only an unformed transformation clue, got ${JSON.stringify(result.specialPatterns)}`);
  assertRejectedSpecialPattern(item.label, result);
});
const contestedTransformPattern = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '甲戌', month: '己丑', day: '甲午', hour: '丙戌' }, dayStem: '甲' });
assert(contestedTransformPattern.interactions.stemCombines.some((item) => item.pair === '甲己' && item.effect === 'contest') && contestedTransformPattern.specialPatterns.some((item) => item.includes('甲己化土未成倾向')), `甲己争合 should block a supposedly exclusive transformation, got ${JSON.stringify({ combines: contestedTransformPattern.interactions.stemCombines, specialPatterns: contestedTransformPattern.specialPatterns })}`);
assertRejectedSpecialPattern('甲己争合', contestedTransformPattern);

const directionalSpecialCases = [
  { label: '曲直格', ruleId: 'ZP-SP-11', pillars: { year: '甲寅', month: '乙卯', day: '甲辰', hour: '丙寅' }, broken: { year: '甲寅', month: '乙卯', day: '甲辰', hour: '庚申' } },
  { label: '炎上格', ruleId: 'ZP-SP-12', pillars: { year: '丁巳', month: '丙午', day: '丙午', hour: '己未' }, broken: { year: '丁巳', month: '丙午', day: '丙午', hour: '癸未' } },
  { label: '稼穑格', ruleId: 'ZP-SP-13', pillars: { year: '戊戌', month: '己丑', day: '戊戌', hour: '辛丑' }, broken: { year: '戊戌', month: '己丑', day: '戊戌', hour: '乙未' } },
  { label: '从革格', ruleId: 'ZP-SP-14', pillars: { year: '庚申', month: '辛酉', day: '庚戌', hour: '壬申' }, broken: { year: '庚申', month: '辛酉', day: '庚戌', hour: '丙申' } },
  { label: '润下格', ruleId: 'ZP-SP-15', pillars: { year: '壬子', month: '癸亥', day: '壬子', hour: '乙丑' }, broken: { year: '壬子', month: '癸亥', day: '壬子', hour: '己丑' } },
];
directionalSpecialCases.forEach((item) => {
  const result = scriptContext.BaziEngine.analyzePattern({ pillars: item.pillars, dayStem: item.pillars.day[0] });
  assertStrictSpecialPattern(item.label, result, item.ruleId);
  const broken = scriptContext.BaziEngine.analyzePattern({ pillars: item.broken, dayStem: item.broken.day[0] });
  assertRejectedSpecialPattern(`受直接克破的${item.label}`, broken);
});
const staleOfficerMixedBazi = {
  ...officerMixedBazi,
  pattern: '正官格参考',
  patternAnalysis: { primary: '正官格参考', mainPattern: '官印相生格', patternLevel: '官印相生，结构闭环，层次偏高' },
};
assert(scriptContext.patternBasisText(staleOfficerMixedBazi, true).includes('月令亥'), 'saved records with stale patternAnalysis should refresh technical pattern basis');
assert(scriptContext.patternStatusText(staleOfficerMixedBazi).includes('官杀混杂'), 'saved records with stale patternAnalysis should refresh pattern state');
assert(!scriptContext.patternLevelText(staleOfficerMixedBazi).includes('层次偏高'), 'saved records with stale patternAnalysis should refresh pattern level');
const promptPatternContext = scriptContext.buildPatternContextText(staleOfficerMixedBazi);
assert(promptPatternContext.includes('命格：正官格'), 'AI prompt context should use refreshed primary pattern');
assert(promptPatternContext.includes('定格依据') && promptPatternContext.includes('月令亥'), 'AI prompt context should include pattern basis');
assert(promptPatternContext.includes('格局状态') && promptPatternContext.includes('官杀混杂'), 'AI prompt context should include pattern state');
assert(promptPatternContext.includes('格局层次') && !promptPatternContext.includes('层次偏高') && !/R[1-5]/.test(promptPatternContext), 'AI prompt context should use the same public Chinese grade without an extra internal code');
assert(promptPatternContext.includes('病药通关'), 'AI prompt context should include remedy advice');
assert(promptPatternContext.includes('成败因子'), 'AI prompt context should include pattern formation factors');
assert(promptPatternContext.includes('清浊去留'), 'AI prompt context should include clarity and removal advice');
assert(promptPatternContext.includes('用神取舍'), 'AI prompt context should include useful priority');
assert(promptPatternContext.includes('具体十神'), 'AI prompt context should include exact ten-god useful decisions');
assert(promptPatternContext.includes('组合冲突'), 'AI prompt context should include combo conflict analysis');
assert(promptPatternContext.includes('干支作用'), 'AI prompt context should include stem and branch interaction conclusions');
assert(promptPatternContext.includes('作用先后'), 'AI prompt context should include pattern action order');
assert(promptPatternContext.includes('层次归因'), 'AI prompt context should include attributable level criteria');
assert(promptPatternContext.includes('当前大运格局'), 'AI prompt context should include the current-luck impact on pattern level');
assert(scriptContext.currentLuckPatternText(referenceBazi).includes('当前大运'), 'structure view should calculate a current-luck pattern conclusion from the active chart');
assert(/层次(?:提升|下降|维持)为(?:偏低|中等|偏高|高|顶级)/.test(scriptContext.currentLuckPatternText(referenceBazi)) && !/[（(](?:蓄力|稳进|可展|发挥|拓展)档[）)]/.test(scriptContext.currentLuckPatternText(referenceBazi)), `current-luck level should use the same plain public Chinese grade, got ${scriptContext.currentLuckPatternText(referenceBazi)}`);
assert(html.includes('function remedyText'), 'structure UI should include remedy text helper');
assert(html.includes('function elementPhenomenonText'), 'structure UI should include professional phenomenon text helper');
assert(html.includes('function elementPhenomenonContextText'), 'AI context should use the full plain-text phenomenon helper');
assert(html.includes('function patternFactorText'), 'structure UI should include pattern factor helper');
assert(html.includes('function patternClarityText'), 'structure UI should include pattern clarity helper');
assert(html.includes('function usefulPriorityText'), 'structure UI should include useful priority helper');
assert(html.includes('function comboConflictText'), 'structure UI should include combo conflict helper');
assert(html.includes('function currentLuckPatternText'), 'structure UI should include current-luck pattern conclusion helper');
assert(html.includes('function publicPatternLevel'), 'structure UI should include the agreed public level-label helper');
assert(html.includes('格局层次表示命盘结构与行运承接，不代表人的价值') && html.includes('现实兑现边界：'), 'the page and AI context should expose the agreed realization boundary');
const yiMaoLuck = referenceLuck.rows.find((r) => r.gz === '乙卯');
assert(referenceLuck.startAge === 3, `reference luck start age should match WenZhen 3 sui, got ${referenceLuck.startAge}`);
assert(yiMaoLuck && scriptContext.luckStartYear(referenceBazi, yiMaoLuck) === 2025, `乙卯 luck should start in 2025, got ${yiMaoLuck && scriptContext.luckStartYear(referenceBazi, yiMaoLuck)}`);
const exactTermBazi = {
  person: '张黎',
  gender: '女',
  pillars: { year: '甲戌', month: '丙子', day: '壬午', hour: '丙午' },
  dayStem: '壬',
  dayElement: '水',
  time: { used: { year: 1994, month: 12, day: 22, hour: 12, minute: 44 }, input: { year: 1994, month: 12, day: 22, hour: 13, minute: 47 }, enabled: true, correction: -63, location: { name: '云南省 曲靖市 师宗县', lng: 103.9936, lat: 24.8222 } },
};
const exactTermLuck = scriptContext.getLuckData(exactTermBazi);
assert(exactTermLuck.startAge === 6, `exact term gap should be virtual 6 sui, got ${exactTermLuck.startAge}`);
assert(scriptContext.luckStartYear(exactTermBazi, exactTermLuck.rows[0]) === 1999, `exact term gap should start first luck in 1999, got ${scriptContext.luckStartYear(exactTermBazi, exactTermLuck.rows[0])}`);
scriptContext.currentBazi = referenceBazi;
scriptContext.resetLuckSelection();
const referencePillarTable = scriptContext.renderPillarTable(referenceBazi, true);
[
  '红鸾',
  '披麻',
  '天医',
  '天厨贵人',
  '福星贵人',
  '天德合',
  '月德合',
  '金舆',
  '流霞',
  '寡宿',
  '吊客',
  '十恶大败',
  '国印贵人',
  '亡神',
  '词馆',
  '德秀贵人',
  '童子煞',
].forEach((name) => assert(referencePillarTable.includes(name), `reference shensha should include ${name}`));
assert(scriptContext.branchPairRelation('寅','亥').includes('六合') && scriptContext.branchPairRelation('寅','亥').includes('破'), 'branch relation should preserve overlapping relations');
const harmlessFactCheck = scriptContext.checkBaziFactConflicts('四柱与月令看，日主偏弱，后续应看大运配合。');
assert(harmlessFactCheck.length === 0, `generic 四柱 wording should not be flagged: ${harmlessFactCheck.join(';')}`);
assert(scriptContext.formatSolarCorrection({
  correction: -63,
  longitudeCorrection: -64,
  equationCorrection: 1,
}) === '校正 -1小时03分 = 经度 -1小时04分 + 均时差 +0小时01分', 'solar correction breakdown should be explicit');
const legacySolarCorrection = scriptContext.formatSolarCorrection({
  correction: -70,
  input: { year: 1993, month: 7, day: 14, hour: 8, minute: 40 },
  used: { year: 1993, month: 7, day: 14, hour: 7, minute: 30 },
  location: { name: '云南省 曲靖市 师宗县', lng: 103.9936, lat: 24.8222 },
});
assert(!legacySolarCorrection.includes('NaN'), `legacy saved solar correction should not show NaN: ${legacySolarCorrection}`);
assert(legacySolarCorrection.includes('经度 -1小时04分'), `legacy saved solar correction should reconstruct longitude component: ${legacySolarCorrection}`);
scriptContext.aiHistory = [
  { q: '第一问', a: '答一', t: '10:00' },
  { q: '第二问', a: '答二', t: '10:01' },
  { q: '第三问', a: '答三', t: '10:02' },
];
scriptContext.aiCollapsed = { 0: true, 2: true };
scriptContext.deleteBaziAiTurn(1);
assert(scriptContext.aiHistory.length === 2, 'delete should remove only one AI turn');
assert(scriptContext.aiCollapsed[0] === true && scriptContext.aiCollapsed[1] === true && scriptContext.aiCollapsed[2] == null, 'delete should preserve and shift folded states');
scriptContext.collapseAllBaziAi();
assert(scriptContext.aiCollapsed[0] === true && scriptContext.aiCollapsed[1] === true, 'collapse all should fold every AI turn');

console.log('bazi page checks ok');
