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

[
  '基础排盘',
  '格局喜用',
  '大运流年',
  'AI断命',
  '通根',
  '透干',
  '格局候选',
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
assert(referencePattern.primary.includes('伤官'), `reference pattern should use month command, got ${referencePattern.primary}`);
assert(referencePattern.evidence.some((x) => x.includes('月令')), 'pattern evidence should include month command');
assert(referencePattern.evidence.some((x) => x.includes('透干')), 'pattern evidence should include revealed stems');
assert(referencePattern.evidence.some((x) => x.includes('通根')), 'pattern evidence should include roots');
assert(referencePattern.useful.use.length > 0, 'pattern analysis should include useful elements');
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
