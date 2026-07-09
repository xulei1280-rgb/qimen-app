const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('bazi.html', 'utf8');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

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
assert(scriptContext.BaziEngine.assessStrength(strongSeasonBazi.dayStem, strongSeasonBazi.pillars, scriptContext.BaziEngine.scoreWuxing(strongSeasonBazi.pillars)) === '\u5f3a', 'strong rooted chart should be classified as strong');
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
assert(weakWinterPattern.useful.layers.tiaohou.use.includes('\u706b') && weakWinterPattern.useful.layers.tiaohou.use.includes('\u6728'), 'winter chart should carry cold-season tiaohou reference of fire and wood');
assert(referencePattern.primary.includes('伤官'), `reference pattern should use month command, got ${referencePattern.primary}`);
assert(referencePattern.evidence.some((x) => x.includes('月令')), 'pattern evidence should include month command');
assert(referencePattern.evidence.some((x) => x.includes('透干')), 'pattern evidence should include revealed stems');
assert(referencePattern.evidence.some((x) => x.includes('通根')), 'pattern evidence should include roots');
assert(referencePattern.useful.use.length > 0, 'pattern analysis should include useful elements');
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
assert(killSealPattern.patternLevel.includes('成格条件') || killSealPattern.patternLevel.includes('结构闭环'), 'pattern level should explain why the combo is formed');
assert(killSealPattern.factors.some((x) => x.text.includes('杀有印化')), `kill-seal chart should expose formation factor, got ${JSON.stringify(killSealPattern.factors)}`);
assert(killSealPattern.clarity.level === '较清' && killSealPattern.clarity.text.includes('杀印相生'), `kill-seal chart should expose clean structure, got ${JSON.stringify(killSealPattern.clarity)}`);
assert(killSealPattern.usePriority.text.includes('格局'), `kill-seal chart should expose useful priority, got ${JSON.stringify(killSealPattern.usePriority)}`);
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
const killSealCandidates = scriptContext.patternCandidates(killSealBazi);
assert(killSealCandidates.includes('杀印相生'), `pattern candidate UI should show combo pattern, got ${killSealCandidates}`);
assert(!killSealCandidates.includes('、'), `pattern candidate UI should show only the main pattern, got ${killSealCandidates}`);
assert(!killSealCandidates.includes('用神') && !killSealCandidates.includes('忌神'), 'pattern candidates should not repeat useful/avoid elements');
assert(scriptContext.specialPatternText(killSealPattern).includes('未见明显从格/化格'), 'normal chart should state no obvious follow/transform pattern');
assert(scriptContext.patternLevelText(killSealBazi).includes('层次偏高'), 'pattern level should describe high-level combo structure');
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
assert(officerMixedPattern.mainPattern.includes('官杀混杂') && !officerMixedPattern.mainPattern.includes('官印相生'), `mixed official/killing should be the main pattern warning, got ${officerMixedPattern.mainPattern}`);
assert(!officerMixedPattern.specialPatterns.some((x) => x.startsWith('从格：')), `mixed official chart with hidden resource should not be judged as a true follow pattern, got ${officerMixedPattern.specialPatterns.join(',')}`);
assert(scriptContext.patternStatusText(officerMixedBazi).includes('官杀混杂'), 'structure UI should expose pattern state');
assert(officerMixedPattern.patternVerdict && officerMixedPattern.patternVerdict.includes('待清'), `mixed official chart should expose a pattern verdict, got ${officerMixedPattern.patternVerdict}`);
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
assert(hurtOfficerPattern.mainPattern.includes('伤官见官'), `hurt-officer chart should flag 伤官见官, got ${hurtOfficerPattern.mainPattern}`);
assert(hurtOfficerPattern.patternVerdict.includes('待制'), `hurt-officer verdict should require 制化, got ${hurtOfficerPattern.patternVerdict}`);
assert(hurtOfficerPattern.remedy.some((x) => x.text.includes('印制伤') || x.text.includes('财星通关')), `hurt-officer chart should expose 病药通关, got ${JSON.stringify(hurtOfficerPattern.remedy)}`);
const wealthWeakBazi = {
  person: '财多身弱样本',
  gender: '男',
  pillars: { year: '戊辰', month: '戊辰', day: '甲申', hour: '己巳' },
  dayStem: '甲',
  dayElement: '木',
  time: { used: { year: 1993, month: 4, day: 1, hour: 10, minute: 0 }, input: { year: 1993, month: 4, day: 1, hour: 10, minute: 0 }, enabled: false, correction: 0, location: { name: 'sample', lng: 120, lat: 30 } },
};
const wealthWeakPattern = scriptContext.BaziEngine.analyzePattern(wealthWeakBazi);
assert(wealthWeakPattern.mainPattern.includes('财多身弱'), `weak wealth-heavy chart should flag 财多身弱, got ${wealthWeakPattern.mainPattern}`);
assert(wealthWeakPattern.useful.layers.pattern.why.includes('印比'), `wealth-heavy weak chart should use 印比 as the pattern anchor, got ${wealthWeakPattern.useful.layers.pattern.why}`);
assert(wealthWeakPattern.remedy.some((x) => x.text.includes('印比扶身')), `wealth-heavy weak chart should expose 印比扶身 remedy, got ${JSON.stringify(wealthWeakPattern.remedy)}`);
const mixedOutputBazi = {
  person: '食伤混杂样本',
  gender: '男',
  pillars: { year: '壬子', month: '癸子', day: '庚申', hour: '甲申' },
  dayStem: '庚',
  dayElement: '金',
  time: { used: { year: 1993, month: 12, day: 1, hour: 12, minute: 0 }, input: { year: 1993, month: 12, day: 1, hour: 12, minute: 0 }, enabled: false, correction: 0, location: { name: 'sample', lng: 120, lat: 30 } },
};
const mixedOutputPattern = scriptContext.BaziEngine.analyzePattern(mixedOutputBazi);
assert(mixedOutputPattern.mainPattern.includes('食伤混杂'), `mixed output chart should flag 食伤混杂, got ${mixedOutputPattern.mainPattern}`);
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
assert(followKillPattern.useful.layers.pattern.why.includes('顺从'), `follow pattern use should follow the dominant force, got ${followKillPattern.useful.layers.pattern.why}`);
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
const transformBazi = {
  person: '化气样本',
  gender: '女',
  pillars: { year: '甲寅', month: '壬寅', day: '丁卯', hour: '甲辰' },
  dayStem: '丁',
  dayElement: '火',
  time: { used: { year: 1993, month: 2, day: 10, hour: 8, minute: 0 }, input: { year: 1993, month: 2, day: 10, hour: 8, minute: 0 }, enabled: false, correction: 0, location: { name: 'sample', lng: 120, lat: 30 } },
};
const transformPattern = scriptContext.BaziEngine.analyzePattern(transformBazi);
assert(transformPattern.specialPatterns.some((x) => x.includes('丁壬化木')), `season-supported transform should form 丁壬化木, got ${transformPattern.specialPatterns.join(',')}`);
assert(transformPattern.mainPattern.includes('化气格'), `true transform should become main pattern, got ${transformPattern.mainPattern}`);
const staleOfficerMixedBazi = {
  ...officerMixedBazi,
  pattern: '正官格参考',
  patternAnalysis: { primary: '正官格参考', mainPattern: '官印相生格', patternLevel: '官印相生，结构闭环，层次偏高' },
};
assert(scriptContext.patternBasisText(staleOfficerMixedBazi).includes('月令亥'), 'saved records with stale patternAnalysis should refresh pattern basis');
assert(scriptContext.patternStatusText(staleOfficerMixedBazi).includes('官杀混杂'), 'saved records with stale patternAnalysis should refresh pattern state');
assert(!scriptContext.patternLevelText(staleOfficerMixedBazi).includes('层次偏高'), 'saved records with stale patternAnalysis should refresh pattern level');
const promptPatternContext = scriptContext.buildPatternContextText(staleOfficerMixedBazi);
assert(promptPatternContext.includes('命格：正官格'), 'AI prompt context should use refreshed primary pattern');
assert(promptPatternContext.includes('定格依据') && promptPatternContext.includes('月令亥'), 'AI prompt context should include pattern basis');
assert(promptPatternContext.includes('格局状态') && promptPatternContext.includes('官杀混杂'), 'AI prompt context should include pattern state');
assert(promptPatternContext.includes('格局层次') && !promptPatternContext.includes('层次偏高'), 'AI prompt context should include corrected pattern level');
assert(promptPatternContext.includes('病药通关'), 'AI prompt context should include remedy advice');
assert(promptPatternContext.includes('成败因子'), 'AI prompt context should include pattern formation factors');
assert(promptPatternContext.includes('清浊去留'), 'AI prompt context should include clarity and removal advice');
assert(promptPatternContext.includes('用神取舍'), 'AI prompt context should include useful priority');
assert(promptPatternContext.includes('组合冲突'), 'AI prompt context should include combo conflict analysis');
assert(html.includes('function remedyText'), 'structure UI should include remedy text helper');
assert(html.includes('function patternFactorText'), 'structure UI should include pattern factor helper');
assert(html.includes('function patternClarityText'), 'structure UI should include pattern clarity helper');
assert(html.includes('function usefulPriorityText'), 'structure UI should include useful priority helper');
assert(html.includes('function comboConflictText'), 'structure UI should include combo conflict helper');
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
