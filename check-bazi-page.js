const fs = require('fs');
{const readFileSync=fs.readFileSync;fs.readFileSync=function(){const out=readFileSync.apply(fs,arguments);return typeof out==='string'?out.replace(/\r\n/g,'\n'):out}} // 兼容 CRLF 检出
const crypto = require('crypto');
const vm = require('vm');

const html = fs.readFileSync('bazi.html', 'utf8');
assert(html.includes('src="deepseek-client.js?v=20260817.1"') && html.includes('DeepSeekClient.requestFinal({apiKey:key,messages:messages,maxTokens:16384'), 'Bazi AI should use the shared DeepSeek final-answer fallback');
assert(!html.includes("model:'deepseek-chat'"), 'Bazi AI should not use the retired non-thinking model alias');
assert(/href="index\.html">奇门<\/a>[\s\S]*href="bazi\.html" aria-current="page">八字<\/a>[\s\S]*href="liuyao\.html">六爻<\/a>[\s\S]*href="ziwei\.html">紫微<\/a>[\s\S]*href="daily\.html">日运<\/a>/.test(html), 'Bazi should expose the unified five-module navigation');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const patternSourceRoot = 'docs/codex/modules/pattern-sources';
const sourceManifest = fs.readFileSync(`${patternSourceRoot}/source-manifest.md`, 'utf8');
const sourceCrosswalk = fs.readFileSync(`${patternSourceRoot}/rule-crosswalk.md`, 'utf8');
const dailyRuleCrosswalk = fs.readFileSync(`${patternSourceRoot}/daily-rule-crosswalk.md`, 'utf8');
const patternBacklog = fs.readFileSync('docs/codex/modules/pattern-optimization-backlog.md', 'utf8');
const theoreticalBaselineDoc = fs.readFileSync('docs/codex/modules/pattern-theoretical-baseline.md', 'utf8');
const patternReviewPlan = fs.readFileSync('docs/codex/modules/pattern-review-plan-v1.md', 'utf8');
for (const [prefix, count] of [['A',3],['B',7],['C',6],['D',3],['E',3]]) {
  for (let index = 1; index <= count; index++) {
    const id = prefix + String(index).padStart(2, '0');
    assert(patternReviewPlan.includes('| ' + id + ' |'), `frozen review plan must retain task ${id}`);
  }
}
assert(fs.readFileSync('docs/codex/modules/pattern.md', 'utf8').includes('pattern-review-plan-v1.md') && fs.readFileSync('docs/codex/PROJECT-STATUS.md', 'utf8').includes('pattern-review-plan-v1.md'), 'module and handoff entry points must route future work to the frozen review plan');
const confirmationBiasPostmortem = fs.readFileSync('docs/codex/modules/pattern-confirmation-bias-postmortem.md', 'utf8');
assert(confirmationBiasPostmortem.includes('真人反馈只能提出待核') && confirmationBiasPostmortem.includes('不能成为格局、喜用、层次、行为或分数的真值标签') && confirmationBiasPostmortem.includes('食神制杀当前验真口径'), 'pattern module should preserve the confirmation-bias incident and permanent regression rules');
const patternPercentileDesign = fs.readFileSync('docs/codex/modules/pattern-percentile-design.md', 'utf8');
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
assert(sourceCrosswalk.includes('`ZP-CG-02` 食神制杀') && sourceCrosswalk.includes('食神、七杀俱有根气并透出或得月令') && sourceCrosswalk.includes('财星承食生杀'), 'food-control formation should have a source-linked strict rule and explicit counter-condition');
assert(theoreticalBaselineDoc.includes('ZP-TB-1984-2044-D11-H12-v13-review') && theoreticalBaselineDoc.includes('23,916') && theoreticalBaselineDoc.includes('不使用名人、朋友') && theoreticalBaselineDoc.includes('结构分直接分档'), 'the theoretical baseline document should freeze version, sample count, no-real-person boundary, and score-first grading contract');
assert(patternPercentileDesign.includes('PAT-LV-DESIGN-v1') && patternPercentileDesign.includes('518,400') && patternPercentileDesign.includes('causeId') && patternPercentileDesign.includes('numericOwner') && patternPercentileDesign.includes('10%') && patternPercentileDesign.includes('25%'), 'PAT-LV-DESIGN-v1 should document the legal universe, cause ownership, and audit-only candidate weights');
assert(sourceManifest.includes('《周易》') && sourceManifest.includes('不自动起卦') && dailyRuleCrosswalk.includes('`ZP-DAY-01`') && dailyRuleCrosswalk.includes('`ZP-DAY-03`') && dailyRuleCrosswalk.includes('`ZY-ACT-01`') && dailyRuleCrosswalk.includes('不预测事件'), 'daily V3 rules should be source-linked and keep Zhouyi as a bounded action layer');

[
  'id="personName"',
  'id="birthTimeDisplay"',
  'id="birthYearPicker"',
  'aria-label="滚动选择出生年份"',
  'oninput="syncBirthYearPicker();refreshBirthTimeDisplay()"',
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
  'function centerSelectedFortune',
  'function keepSelectedMonthVisible',
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
  'function syncBirthYearPicker',
  'function selectBirthYear',
  'centerYear+50',
  'centerYear-50',
  'function getLuckData',
  'function selectedLuckContextText',
  'function buildAiContextSnapshot',
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
  '结论 -> 依据 -> 可验证点',
].forEach((needle) => assert(html.includes(needle), `missing ${needle}`));

assert(html.includes('<textarea id="aiQuestion" rows="2"') && html.includes('<textarea id="aiFollowupQuestion" rows="2"'), 'AI question inputs should support multi-line entry');
assert((html.match(/onkeydown="handleBaziAiKeydown/g) || []).length === 2, 'AI question inputs should support Ctrl/Cmd+Enter sending');
assert(html.includes('function autoGrowBaziAiTextarea') && html.includes('max=164') && html.includes('function resetBaziAiTextarea'), 'AI question inputs should auto-grow and reset after sending');
assert(html.includes('function showBaziAiPending') && html.includes('id="baziAiPending"') && html.includes('AI 正在分析 · 已用 '), 'Bazi AI should show an elapsed analysis status');
assert(/function analyzeBazi\(sourceId\)[\s\S]*?showBaziAiPending\(requestId\)[\s\S]*?clearBaziAiPending\(requestId\)/.test(html), 'Bazi AI pending status should start and stop with each request');

[
  'analysis_display_mode',
  'id="baziHistorySearch"',
  'id="baziHistorySort"',
  'function exportBaziRecords',
  'function importBaziRecords',
  'function baziChartFingerprint',
  'function setupBaziRecordMigration',
  'function migrateBaziRecordsToLocalServer',
  'function receiveBaziRecordMigration',
  'function finishBaziRecordMigration',
  'http://127.0.0.1:8082/bazi.html?receiveRecords=1',
  'var baziAiRequestSeq',
  'professional-only',
  'standard-only',
  'data-structure-mode-switch',
  'data-standard-copy',
  'data-professional-copy',
  'function standardStructureText',
  'function structureDetailBox',
].forEach((needle) => assert(html.includes(needle), `missing local UX safeguard ${needle}`));
['data-reading-guide="bazi-table"','data-reading-guide="bazi-structure"','这些专业词，用大白话怎么看','用普通话理解这张盘'].forEach((needle) => {
  assert(!html.includes(needle), `obsolete duplicate explanation should be removed: ${needle}`);
});
assert(!html.includes('slice(0,50)'), 'saved Bazi records must not be silently truncated');
['副星','星运','空亡','纳音','神煞'].forEach((label) => {
  assert(!html.includes(`<tr class="professional-only"><th class="row-label">${label}</th>`), `${label} should remain visible in standard mode`);
});

const qimenHtml = fs.readFileSync('index.html', 'utf8');
[
  'analysis_display_mode',
  'id="plateFreshness"',
  'function currentPlateInputFingerprint',
  'function markPlateDirty',
  'function ensureCurrentPlate',
  'var qimenAiRequestSeq',
  'plateData.gender',
  'plateData.currentCal',
  'professional-only',
  'standard-only',
  'data-reading-guide="qimen"',
  '用普通话看这个盘',
].forEach((needle) => assert(qimenHtml.includes(needle), `missing Qimen UX safeguard ${needle}`));
[
  'class="gz-table"',
  '<span class="info-label">旬首</span>',
  '<span class="info-label">局式</span>',
  '<span class="info-label">旬空</span>',
  '<span class="info-label">马星</span>',
  '<div class="legend"><h4>',
].forEach((needle) => assert(qimenHtml.includes(needle), `standard Qimen view should retain ${needle}`));
assert(/function useCurrentTime\(\)[\s\S]*?markPlateDirty\(\)/.test(qimenHtml), 'current-time shortcut should invalidate an existing plate');
[...qimenHtml.matchAll(/<script>([\s\S]*?)<\/script>/g)].forEach((match, index) => {
  new vm.Script(match[1], { filename: `index-inline-${index}.js` });
});

assert(!html.includes('sample-btn'), 'sample button should be removed');
assert(!html.includes('载入问真样本'), 'WenZhen sample loader button should be removed');
assert(!/DOMContentLoaded[\s\S]*loadSample\(\)/.test(html), 'opening bazi page should not auto-chart');
assert(!html.includes('data-view="history"'), 'save records should be a top-level tab, not a result tab');
assert(!html.includes('data-view-panel="history"'), 'save records should not live inside result detail panels');
const lifeNote = '计划抵达寻常，冒险改写人生；非凡，生于计划之外。';
assert(html.includes(`<p class="life-note">${lifeNote}</p>`) && html.indexOf('<h1>八字分析</h1>') < html.indexOf(lifeNote) && html.indexOf(lifeNote) < html.indexOf('id="homeTabs"'), 'the approved low-emphasis life note should appear below the Bazi page title and outside analysis results');
assert(/function showBaziHome\(name\)[\s\S]*data-home-panel/.test(html), 'top-level form/history navigation should exist');
assert(/function buildBazi\(\)[\s\S]*showBaziResult\(\)/.test(html), 'building a chart should enter the result layer');
assert(/function loadBaziRecord\(id\)[\s\S]*showBaziResult\(\)/.test(html), 'loading a saved record should enter the result layer');
assert(/function renderBazi\(data\)[\s\S]*currentBaziView='structure'/.test(html), 'newly rendered charts should default to structure view');
assert(html.includes('<button type="button" class="active" data-view="structure"'), 'structure tab should be active by default');
assert(html.includes('<div class="bazi-view active" data-view-panel="structure"'), 'structure panel should be visible by default');
assert(html.indexOf('<div class="bazi-tabs"') < html.indexOf('<section class="basic-dashboard"'), 'result tabs should appear before basic dashboard content');
assert(html.indexOf('<section class="basic-dashboard"') < html.indexOf('data-view-panel="structure"'), 'the summary and natal table must precede the detailed structure grid');
assert(/function switchBaziView\(name\)[\s\S]*renderPillarTable\(currentBazi,name==='luck'\)/.test(html), 'switching result views should retain the shared natal chart and add transit columns only for luck');
assert(!html.includes('luckStickyMount') && !html.includes('luck-sticky-context'), 'luck comparison should not add a sticky duplicate table that can flicker on mobile');
assert(html.includes('id="structureSummary"') && /function switchBaziView\(name\)[\s\S]*summary\.hidden=name!=='structure'/.test(html), 'day-master, pillar, strength, and useful summary cards should show only in the structure view');
assert(html.includes('.core-cards[hidden]{display:none!important}'), 'the structure-only summary must override the grid layout when a non-structure tab hides it');

[
  '出生组合',
  '格局喜用',
  '大运流年',
  'AI分析',
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
  '岁运判断',
  '结构完整度',
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
  '用户当前运势选择',
  '上轮本地上下文摘要',
  'luckSelection:cloneLuckSelection',
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
assert(html.includes('<script src="birth-time.js?v=20261107.1"></script>') && html.includes('<script src="bazi-engine.js?v=20261110.3-year-over-year"></script>'), 'bazi page should load the current bazi-engine.js asset revision');
const defaultFormMatch = html.match(/function resetBaziFormToNow\(\)[\s\S]*?\n}/);
assert(defaultFormMatch && defaultFormMatch[0].includes('var now=new Date()'), 'bazi default form should use open-time date');
assert(defaultFormMatch && !defaultFormMatch[0].includes('buildBazi()'), 'opening bazi page should not auto-build a chart');
[
  'window.BaziEngine',
  'function analyzePattern',
  'function shenShaForPillar',
  'function luckStartInfo',
  'function getFlowMonths',
  'SHENSHA_RULES',
].forEach((needle) => assert(engine.includes(needle), `engine missing ${needle}`));
const sample = qimen + `
function dayOfYear(y,m,d){var start=new Date(y,0,0);return Math.floor((new Date(y,m-1,d)-start)/86400000)}
function equationOfTimeMinutes(y,m,d,hour,minute){var n=dayOfYear(y,m,d),clock=(Number(hour)||0)+(Number(minute)||0)/60,gamma=2*Math.PI/365*(n-1+(clock-12)/24);return 229.18*(0.000075+0.001868*Math.cos(gamma)-0.032077*Math.sin(gamma)-0.014615*Math.cos(2*gamma)-0.040849*Math.sin(2*gamma))}
function addMinutes(t,mins){var dt=new Date(t.year,t.month-1,t.day,t.hour,t.minute+Math.round(mins));return {year:dt.getFullYear(),month:dt.getMonth()+1,day:dt.getDate(),hour:dt.getHours(),minute:dt.getMinutes()}}
function buildPillars(t){var dayDate=new Date(t.year,t.month-1,t.day);if(t.hour>=23)dayDate.setDate(dayDate.getDate()+1);var day=getDayGZ(dayDate.getFullYear(),dayDate.getMonth()+1,dayDate.getDate());return {year:getYearGZ(t.year,t.month,t.day),month:getMonthGZ(t.year,t.month,t.day),day:day,hour:getHourGZ(day,t.hour)}}
var input={year:1990,month:5,day:7,hour:7,minute:0};
var corr=(103.805-120)*4+equationOfTimeMinutes(1990,5,7,input.hour,input.minute);
var used=addMinutes(input,corr);
var wenZhenInput={year:1998,month:10,day:10,hour:1,minute:50};
var wenZhenUsed=addMinutes(wenZhenInput,(103.9936-120)*4+equationOfTimeMinutes(1998,10,10,wenZhenInput.hour,wenZhenInput.minute));
JSON.stringify({used:used,pillars:buildPillars(used),wenZhenUsed:wenZhenUsed,wenZhenPillars:buildPillars(wenZhenUsed)});
`;
const result = JSON.parse(vm.runInNewContext(sample, { Date, Math, JSON }));
assert(result.used.year === 1990 && result.used.month === 5 && result.used.day === 7, 'sample true-solar date changed');
assert(result.used.hour === 5 && Math.abs(result.used.minute - 59) <= 1, `sample true-solar time ${result.used.hour}:${result.used.minute} not close to 05:59`);
assert(JSON.stringify(result.pillars) === JSON.stringify({ year: '庚午', month: '辛巳', day: '壬申', hour: '癸卯' }), `sample pillars mismatch: ${JSON.stringify(result.pillars)}`);
assert(result.wenZhenUsed.hour === 0 && result.wenZhenUsed.minute === 59 && result.wenZhenPillars.hour === '丙子', `WenZhen reference true-solar time should remain in 子时, got ${JSON.stringify({used:result.wenZhenUsed,pillars:result.wenZhenPillars})}`);
assert(html.indexOf('class="entry-card"') < html.indexOf('id="resultArea"'), 'input form should sit above the always-visible result area as a collapsed editor');
assert(html.includes('<details id="entryPanel"'), 'input editor should be a collapsible details panel');
assert(html.includes('data-view="basic"'), 'result layer should expose a basic information tab');
assert(/function buildBazi\(\)[\s\S]*showBaziResult\(\)/.test(html), 'buildBazi should enter the result layer after charting');
assert(/function buildBazi\(\)[\s\S]*autoSaveBuild[\s\S]*saveBaziRecord/.test(html), 'buildBazi should auto-save when the checkbox is enabled');
assert(/id="autoSaveBuild" type="checkbox" checked/.test(html), 'auto-save should default on');
assert(/id="useTrueSolar" type="checkbox" onchange=/.test(html) && html.includes('时间校对：'), 'true solar correction should default off and have an explanatory label');
assert(html.includes('id="birthLocationField"') && html.includes('locationField.hidden=!enabled'), 'birth address should only be shown for true solar time');
assert(/function buildBazi\(\)[\s\S]*editingActiveRecord[\s\S]*saveBaziRecord/.test(html), 'editing a saved bazi should sync the saved record after rebuilding');
assert(html.includes('修改时间和地址') && html.includes('onclick="editCurrentBaziInput()"'), 'basic info should expose an edit time/location action');
assert(!html.includes('id="personName" type="text" value="测试"'), 'bazi name input should not default to 测试');
const aiPanelMatch = html.match(/function renderAiPanel\(\)[\s\S]*?function renderQuickAiQuestions/);
assert(aiPanelMatch && !aiPanelMatch[0].includes('historyList'), 'save records should not live inside AI panel');
assert(/@media\(max-width:520px\)[\s\S]*pillar-table-wrap \.pillar-table\{min-width:0;table-layout:fixed\}/.test(html), 'mobile pillar table should fit viewport instead of forcing horizontal scroll');
assert(/pillar-table tr:last-child th,\.pillar-table tr:last-child td\{vertical-align:top\}/.test(html), 'shensha row should align content to top');
assert(/@media\(max-width:520px\)[\s\S]*pillar-table tr:last-child td\{font-size:10px;line-height:1\.3;text-align:center\}/.test(html), 'mobile shensha cells should stay horizontally aligned with pillar columns');

const inlineScripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
const helpDocumentEvents={};
const scriptContext = {
  BirthTime: require('./birth-time.js'),
  console,
  Date,
  Math,
  JSON,
  prompt: () => '',
  confirm: () => true,
  localStorage: { getItem: () => null, setItem: () => {} },
  document: {
    addEventListener(type,handler) {(helpDocumentEvents[type]||(helpDocumentEvents[type]=[])).push(handler)},
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
vm.runInContext(engine.replace('root.BaziEngine=api;', 'root.__patternReview={flow:interactionFlowAnalysis,context:buildTemporalPatternContext,finalize:finalizePatternLevel,rooted:godRooted,qualify:qualifyComboFlows};root.BaziEngine=api;'), scriptContext, { filename: 'bazi-engine.js' });
inlineScripts.forEach((script, index) => vm.runInContext(script, scriptContext, { filename: `bazi-inline-${index}.js` }));
for(const [itemLeft,expected] of [[0,0],[360,260],[840,600]]){
  const track={scrollLeft:40,scrollWidth:880,clientWidth:280,clientLeft:2,getBoundingClientRect:()=>({left:25})};
  track.querySelector=()=>({getBoundingClientRect:()=>({left:27+itemLeft-track.scrollLeft,width:80})});
  scriptContext.centerSelectedFortune(track);
  assert(track.scrollLeft===expected, 'luck selector should center its selected card and clamp at either edge');
}
assert(scriptContext.recordPersonFromTitle({ name: '张黎 丁酉日', bazi: { person: '测试' } }) === '张黎', 'legacy saved record should derive person from title when bazi.person is default 测试');
assert(scriptContext.recordPersonFromTitle({ name: '事业盘 丁酉日', bazi: { person: '王五' } }) === '王五', 'saved record should keep explicit bazi.person');
assert(scriptContext.BaziEngine, 'BaziEngine should load in VM');
assert(typeof scriptContext.BaziEngine.analyzePattern === 'function', 'BaziEngine.analyzePattern should exist');
// PAT-215: predicates are frozen before implementation; no desired personal
// useful element, pattern grade or real-life outcome is an expected answer.
const inactiveGroupReview = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '壬申', month: '甲辰', day: '甲子', hour: '己巳' } });
assert(inactiveGroupReview.interactions.groups.some(x => x.complete && x.active === false), 'review fixture must retain its unsupported complete group');
assert(!inactiveGroupReview.monthCommand.groupStems.includes('癸'), 'an inactive water group cannot supply 癸 as a cleared month stem');
const lostRootReview = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '乙未', month: '己卯', day: '己亥', hour: '丁卯' } });
assert(lostRootReview.tenGodProfiles['偏印'].branchEntries.some(x => x.stem === '丁' && x.transformedAway && x.rootPower === 0), 'review fixture must keep the original but transformed-away 丁 record');
const alternateRootFlow = scriptContext.__patternReview.flow('杀印相生格', lostRootReview.tenGodProfiles, lostRootReview.interactions, []);
assert(alternateRootFlow.steps.some(x => x.active), 'excluding a lost root must preserve an existing valid alternative local path; this alone does not prove strict formation');
function assertReviewEndpoints(analysis) {
  if (analysis.specialPatternQualification) return; // Special checklists are not ordinary two-actor graph steps.
  (analysis.interactionFlow.steps || []).filter(x => x.active).forEach(x => {
    assert(x.left && x.right && x.left.usable !== false && x.right.usable !== false && !x.left.transformedAway && !x.right.transformedAway, 'active paths cannot use transformed-away or unusable endpoints');
  });
}
assertReviewEndpoints(lostRootReview);
assertReviewEndpoints({ interactionFlow: alternateRootFlow });
scriptContext.BaziEngine.forEachLegalFourPillar(pillars => assertReviewEndpoints(scriptContext.BaziEngine.analyzePattern({ pillars })), { yearCycleCount: 1, monthBranchCount: 12, dayCycleCount: 2, hourBranchCount: 2 });
const rootlessControlReview = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '甲申', month: '甲戌', day: '壬子', hour: '戊申' } });
assert(rootlessControlReview.tenGodProfiles['食神'].rootPower === 0, 'strict-root counterexample must actually lack food roots');
assert(!rootlessControlReview.comboPatterns.includes('食神制杀格'), 'visibility must not replace the independent root requirement');
const blockedControlReview = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '甲子', month: '己巳', day: '丁未', hour: '癸卯' } });
assert(!blockedControlReview.comboPatterns.includes('食神制杀格'), 'a blocked necessary control step cannot form the strict combination');
const blockedMedicineReview = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '甲子', month: '壬申', day: '己卯', hour: '甲子' } });
assert(!blockedMedicineReview.patternDisease.items.some(item => item.family === '官伤冲战' && item.status === '已解'), 'present medicine without its reachable treatment cannot fully solve a defect');
const ungroundedPairReview = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '甲子', month: '丁卯', day: '甲子', hour: '丁卯' } });
assert(!ungroundedPairReview.positivePhenomena.some(item => item.ruleId === 'ZP-ZX-01'), 'each positive-phenomenon element needs its own usable root, not two roots of the other element');
const nonBladeMonthReview = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '甲子', month: '丙寅', day: '丁卯', hour: '癸卯' } });
assert(nonBladeMonthReview.monthCommand.baseGod !== '劫财' && !nonBladeMonthReview.comboPatterns.includes('羊刃驾杀格'), 'revealed hidden peer cannot turn a non-blade month into strict blade qualification');
function assertLegalReviewPillars(pillars) {
  const stems = '甲乙丙丁戊己庚辛壬癸', branches = '子丑寅卯辰巳午未申酉戌亥', months = '寅卯辰巳午未申酉戌亥子丑';
  Object.values(pillars).forEach(gz => assert(gz.length === 2 && stems.indexOf(gz[0]) >= 0 && branches.indexOf(gz[1]) >= 0 && stems.indexOf(gz[0]) % 2 === branches.indexOf(gz[1]) % 2, `review pillar must be a legal sexagenary pair: ${gz}`));
  assert(stems.indexOf(pillars.month[0]) === (2 * (stems.indexOf(pillars.year[0]) % 5) + 2 + months.indexOf(pillars.month[1])) % 10, 'review month must obey the five-tiger rule');
  assert(stems.indexOf(pillars.hour[0]) === (2 * (stems.indexOf(pillars.day[0]) % 5) + branches.indexOf(pillars.hour[1])) % 10, 'review hour must obey the five-mouse rule');
}
const trueDayTransformPillars = { year: '己丑', month: '丁丑', day: '甲戌', hour: '己巳' };
const rootedDayTransformPillars = { ...trueDayTransformPillars, day: '甲辰' };
const selfBoostedDayTransformPillars = { year: '庚戌', month: '己丑', day: '甲午', hour: '庚午' };
[trueDayTransformPillars, rootedDayTransformPillars, selfBoostedDayTransformPillars].forEach(assertLegalReviewPillars);
const siblingRootPillars = { year: '壬子', month: '壬子', day: '甲午', hour: '甲子' };
assertLegalReviewPillars(siblingRootPillars);
const siblingRootReview = scriptContext.BaziEngine.analyzePattern({ pillars: siblingRootPillars });
assert(siblingRootReview.tenGodProfiles['偏印'].rootPower === 0 && siblingRootReview.tenGodProfiles['正印'].rootPower > 0, 'root-sharing positive must isolate revealed 壬 with only usable 癸 roots');
assert(scriptContext.__patternReview.rooted(siblingRootReview.tenGodProfiles, '偏印'), 'same-element opposite-polarity roots can support a visible god without changing the identity of the actor');
const removedSiblingRoots = JSON.parse(JSON.stringify(siblingRootReview.tenGodProfiles));
removedSiblingRoots['正印'].branchEntries = [];
assert(!scriptContext.__patternReview.rooted(removedSiblingRoots, '偏印') && removedSiblingRoots['偏印'].revealed > 0, 'removing only the sibling roots must restore rootless status; visibility alone remains insufficient');
// 丙年癸巳月、甲日戊辰时合法；癸印可达日主，辰有癸根，两寅保有甲根。
// 不用甲寅/己巳的候选：甲己合会绊住其拟作扶身的年干，不能当成承载正例。
const supportedWeakOutputPillars = { year: '丙寅', month: '癸巳', day: '甲寅', hour: '戊辰' };
const unsupportedWeakOutputPillars = { year: '丙子', month: '癸巳', day: '甲申', hour: '戊辰' };
[supportedWeakOutputPillars, unsupportedWeakOutputPillars].forEach(assertLegalReviewPillars);
const supportedWeakOutput = scriptContext.BaziEngine.analyzePattern({ pillars: supportedWeakOutputPillars });
const unsupportedWeakOutput = scriptContext.BaziEngine.analyzePattern({ pillars: unsupportedWeakOutputPillars });
assert(/弱/.test(supportedWeakOutput.strength) && supportedWeakOutput.carryingCapacity.tasks.output.strictFormationEligible && supportedWeakOutput.carryingCapacity.tasks.wealth.strictFormationEligible, 'capacity positive must retain a weak index but independently supported output and wealth tasks');
assert(!supportedWeakOutput.regularPattern.issues.some(issue => /偏弱.*泄身/.test(issue)) && !supportedWeakOutput.patternIssues.includes('财多身弱待扶'), 'a weak index cannot fabricate a carrying defect after the same task has passed');
assert(!unsupportedWeakOutput.carryingCapacity.tasks.output.strictFormationEligible && unsupportedWeakOutput.regularPattern.issues.some(issue => /偏弱.*泄身/.test(issue)) && !unsupportedWeakOutput.comboPatterns.includes('食神生财格'), 'the failed-task counterexample must still retain its actual carrying defect');
const trueDayTransformReview = scriptContext.BaziEngine.analyzePattern({ pillars: trueDayTransformPillars });
const rootedDayTransformReview = scriptContext.BaziEngine.analyzePattern({ pillars: rootedDayTransformPillars });
const selfBoostedDayTransformReview = scriptContext.BaziEngine.analyzePattern({ pillars: selfBoostedDayTransformPillars });
const dayPair = analysis => analysis.interactions.stemCombines.find(item => item.pair === '甲己' && item.effectiveDistance <= 1 && (item.left === 2 || item.right === 2));
assert(dayPair(rootedDayTransformReview).effect !== 'transform', 'ordinary target support must not erase a raw same-element root before strict day-master qualification');
assert(dayPair(selfBoostedDayTransformReview).effect !== 'transform', 'a day-master pair cannot add its own transformed qi to satisfy its formation threshold');
assert(dayPair(trueDayTransformReview).effect === 'transform' && trueDayTransformReview.specialPatterns.includes('化气格：甲己化土'), 'an independently supported rootless legal positive must still pass the shared transformation gate');
assert(dayPair(rootedDayTransformReview).dayTransformQualification.checks.filter(item => !item.met).map(item => item.id).join(',') === 'no-origin-root', 'root counterexample must isolate the raw-root veto while the other strict conditions pass');
assert(dayPair(selfBoostedDayTransformReview).dayTransformQualification.checks.filter(item => !item.met).map(item => item.id).join(',') === 'transform-force', 'self-boost counterexample must isolate insufficient pre-transform target strength');
const returnSealActors = { 七杀: { stemEntries: [{ position: 0, stem: '甲' }] }, 正印: { stemEntries: [{ position: 1, stem: '丙' }] } };
const reachableSealReturn = scriptContext.__patternReview.flow('杀印相生格', returnSealActors, { dayMaster: { position: 2, pillar: 'day', stem: '戊', usable: true } }, []);
const blockedSealReturn = scriptContext.__patternReview.flow('杀印相生格', returnSealActors, { dayMaster: { position: 2, pillar: 'day', stem: '戊', usable: true }, stemCombines: [{ left: 2, right: 3, effect: 'transform', active: true, text: '末段对象已改性' }] }, []);
assert(reachableSealReturn.steps.length === 2 && reachableSealReturn.steps.every(step => step.active), 'kill-seal strict flow must include the reachable seal-to-day return step');
assert(blockedSealReturn.steps.length === 2 && blockedSealReturn.steps[0].active && !blockedSealReturn.steps[1].active, 'a reachable killing-to-seal half-chain cannot hide a blocked return step');
// Operator unit, deliberately not a birth chart: two separate bridge actors at
// positions 0 and 3 cannot make a single transmission through unrelated ends.
const splitBridgeActors = {
  正财: { stemEntries: [{ position: 0, stem: '己' }] },
  正官: { stemEntries: [{ position: 3, stem: '辛' }], branchEntries: [{ position: 0, branch: '丑', stem: '辛', rootPower: 1 }] },
  正印: { branchEntries: [{ position: 3, branch: '亥', stem: '癸', rootPower: 1 }] },
};
const bridgeOperatorChains = [{ from: ['正财'], to: ['正官'], action: '生' }, { from: ['正官'], to: ['正印'], action: '生' }];
const splitBridgeFlow = scriptContext.__patternReview.flow('', splitBridgeActors, {}, [], bridgeOperatorChains);
assert(splitBridgeFlow.steps.some(step => !step.active) && splitBridgeFlow.continuity.length, 'individually reachable segments cannot fabricate a continuous transmission');
const connectedBridgeActors = JSON.parse(JSON.stringify(splitBridgeActors));
connectedBridgeActors.正官.stemEntries.push({ position: 1, stem: '辛' });
assert(scriptContext.__patternReview.flow('', connectedBridgeActors, {}, [], bridgeOperatorChains).steps.every(step => step.active), 'a genuine alternative bridge must restore the path without relaxing the reach model');
let reviewHoldoutCount = 0;
scriptContext.BaziEngine.forEachLegalFourPillar((pillars, meta) => {
  if (meta.yearIndex < 2 || meta.dayIndex < 30 || meta.hourIndex !== meta.dayIndex % 4) return;
  const natal = scriptContext.BaziEngine.analyzePattern({ pillars });
  const zero = scriptContext.__patternReview.context(pillars.day[0], pillars, natal);
  const before = { strength: natal.strength, profiles: natal.tenGodProfiles, regular: natal.regularPatternBackground || natal.regularPattern, issues: natal.patternIssues, flow: natal.interactionFlow, disease: natal.patternDisease, positive: natal.positivePhenomena, main: natal.mainPattern };
  const after = { strength: zero.strength, profiles: zero.profiles, regular: zero.regularPattern, issues: zero.patternIssues, flow: zero.interactionFlow, disease: zero.patternDisease, positive: zero.positivePhenomena, main: zero.rawMainPattern };
  assert(JSON.stringify(before) === JSON.stringify(after), `zero-temporal context must reproduce the natal facts, not a second rule set: ${meta.key}`);
  assertReviewEndpoints(natal);
  natal.patternDisease.items.filter(item => item.status === '已解').forEach(item => {
    assert(item.medicines.some(medicine => medicine.rank === 2 && medicine.steps && medicine.steps.length && medicine.steps.every(step => step.active)), `full resolution must retain its actual treatment proof: ${meta.key}/${item.family}`);
  });
  const main = natal.patternStructures.find(item => item.role === '主格');
  if (main && main.status === '已成' && !natal.specialPatternQualification) assert(!natal.patternDisease.partial.length && !natal.patternDisease.unresolved.length, `pure formation cannot contradict residual-disease settlement: ${meta.key}`);
  reviewHoldoutCount++;
}, { yearCycleCount: 4, monthBranchCount: 12, dayCycleCount: 60, hourBranchCount: 4, validateUnique: false });
assert(reviewHoldoutCount === 720, 'PAT-215 untouched legal holdout size changed');
console.log(`PAT-215 focused fact/zero-context checks passed (${reviewHoldoutCount} legal holdout cases)`);
// PAT-215-FOCUSED-END
assert(typeof scriptContext.BaziEngine.createBaziProfile === 'function' && typeof scriptContext.BaziEngine.buildBirthTime === 'function', 'BaziEngine should expose the shared birth-profile interface');
const linkedProfile = scriptContext.BaziEngine.createBaziProfile({
  person: '问真八字对照', gender: '男',
  input: { year: 1998, month: 10, day: 10, hour: 1, minute: 50 },
  location: { name: '云南省 曲靖市 师宗县', lng: 103.9936, lat: 24.8222 }, useTrueSolar: true,
});
assert(JSON.stringify(linkedProfile.time.used) === JSON.stringify({ year: 1998, month: 10, day: 10, hour: 0, minute: 59 }) && JSON.stringify(linkedProfile.pillars) === JSON.stringify({ year: '戊寅', month: '壬戌', day: '庚寅', hour: '丙子' }), `shared birth profile should keep the WenZhen fixture, got ${JSON.stringify(linkedProfile)}`);
const linkedStart = scriptContext.BaziEngine.luckStartInfo(linkedProfile);
assert(linkedStart.startYear === 2008 && linkedStart.startAge === 11, `shared birth profile should retain 2008 / 11岁 luck start, got ${JSON.stringify(linkedStart)}`);
assert(typeof scriptContext.BaziEngine.analyzeTemporalInteractions === 'function', 'BaziEngine should expose temporal interaction arbitration');
const contestedTemporal = scriptContext.BaziEngine.analyzeTemporalInteractions({ pillars: { year: '甲子', month: '己丑', day: '乙卯', hour: '甲辰' } }, [{ key: 'flowDay', label: '流日', gz: '己巳' }]);
assert(contestedTemporal.effectiveRelations.filter((item) => item.kind === 'stem-combine' && item.effect === 'contest').length === 2 && contestedTemporal.arbitration.decisions.some((item) => item.includes('争合受阻')), 'a temporal stem involved in two combinations should be retained as contested and never transformed exclusively');
const clashCombineTemporal = scriptContext.BaziEngine.analyzeTemporalInteractions({ pillars: { year: '甲寅', month: '乙丑', day: '丙午', hour: '丁酉' } }, [{ key: 'flowDay', label: '流日', gz: '戊子' }]);
assert(clashCombineTemporal.effectiveRelations.some((item) => item.type === '冲' && item.resolution === '冲合并见，合不解冲') && clashCombineTemporal.effectiveRelations.some((item) => item.type === '六合' && item.status === '合中逢冲'), 'a temporal clash and combine sharing one branch should both remain visible after arbitration');
const meetingSuppressesBreak = scriptContext.BaziEngine.analyzeTemporalInteractions({ pillars: { year: '甲寅', month: '乙卯', day: '丙丑', hour: '丁午' } }, [{ key: 'flowDay', label: '流日', gz: '戊辰' }]);
assert(meetingSuppressesBreak.groups.some((item) => item.name === '三会木局' && item.effective) && meetingSuppressesBreak.suppressedRelations.some((item) => item.type === '破' && item.suppressedBy === '三会木局'), 'a supported complete meeting should suppress a lower-order external break relation');
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
scriptContext.currentBazi.scores = scriptContext.BaziEngine.scoreWuxing(scriptContext.currentBazi.pillars);
scriptContext.currentBazi.relations = [];
const luckContext = scriptContext.getSelectedLuckContext(scriptContext.currentBazi);
assert(luckContext.years.length === 10, 'selected luck should expose 10 flow years');
assert(luckContext.months.length === 12, 'selected flow year should expose 12 flow months');
assert(luckContext.luck.rows.length === 10, 'luck selector should expose 10 decade luck periods');
assert(luckContext.luckRow && luckContext.flowYear, 'selected luck context should include luck/year');
assert(luckContext.flowMonth == null, 'flow month should be unselected by default');
assert(luckContext.months[0].term === '立春' && luckContext.months[0].dateLabel.includes('/'), 'flow months should be keyed by solar terms with Gregorian dates');
const forwardLuckChart = {
  person: '起运校验',
  gender: '男',
  pillars: { year: '庚午', month: '辛巳', day: '壬申', hour: '癸卯' },
  dayStem: '壬',
  dayElement: '水',
  time: { used: { year: 1990, month: 5, day: 7, hour: 5, minute: 59 }, input: { year: 1990, month: 5, day: 7, hour: 7, minute: 0 }, enabled: true, correction: -61, location: { name: '参考', lng: 103.805, lat: 25.4951 } },
};
const startInfo = scriptContext.BaziEngine.luckStartInfo(forwardLuckChart);
assert(startInfo.direction === '顺行' && startInfo.term === '芒种', `forward luck should start from next 芒种, got ${JSON.stringify(startInfo)}`);
assert(startInfo.startAgeExact > 10 && startInfo.startAge === 12 && startInfo.startYear === 2001, `minute-calibrated 30-day luck offset should enter after its eleventh elapsed year, got ${JSON.stringify(startInfo)}`);
const forwardLuck = scriptContext.getLuckData(forwardLuckChart, new Date(2026, 6, 9, 12));
assert(forwardLuck.startAge === 12 && scriptContext.luckStartYear(forwardLuckChart, forwardLuck.rows[0]) === 2001, 'luck start year should follow the exact term-to-birth duration');
const wenZhenLuckChart = {
  person: '问真八字对照',
  gender: '男',
  pillars: { year: '戊寅', month: '壬戌', day: '庚寅', hour: '丙子' },
  dayStem: '庚',
  dayElement: '金',
  time: { used: { year: 1998, month: 10, day: 10, hour: 0, minute: 59 }, input: { year: 1998, month: 10, day: 10, hour: 1, minute: 50 }, enabled: true, correction: -51, location: { name: '云南省 曲靖市 师宗县', lng: 103.9936, lat: 24.8222 } },
};
const wenZhenStart = scriptContext.BaziEngine.luckStartInfo(wenZhenLuckChart);
const wenZhenLuck = scriptContext.getLuckData(wenZhenLuckChart, new Date(2026, 7, 20, 12));
assert(wenZhenStart.direction === '顺行' && wenZhenStart.term === '立冬' && wenZhenStart.termAt === '1998-11-07T15:08:42.073Z', `WenZhen reference term should use the published 1998 立冬 moment, got ${JSON.stringify(wenZhenStart)}`);
assert(wenZhenLuck.startAge === 11 && scriptContext.luckStartYear(wenZhenLuckChart, wenZhenLuck.rows[0]) === 2008 && wenZhenLuck.rows[0].gz === '癸亥', `WenZhen reference first luck should be 2008 癸亥 at 11 sui, got ${JSON.stringify(wenZhenLuck.rows[0])}`);
const beforeLiChun = scriptContext.getInquiryTimeInfo(new Date(2026, 1, 4, 4, 1));
const afterLiChun = scriptContext.getInquiryTimeInfo(new Date(2026, 1, 4, 4, 3));
assert(beforeLiChun.flowYearNumber === 2025 && beforeLiChun.flowYearGz === '乙巳', `flow year before lichun mismatch: ${JSON.stringify(beforeLiChun)}`);
assert(afterLiChun.flowYearNumber === 2026 && afterLiChun.flowYearGz === '丙午', `flow year after lichun mismatch: ${JSON.stringify(afterLiChun)}`);
assert(scriptContext.BaziEngine.getFlowYearNumber({ year: 2026, month: 2, day: 4, hour: 4, minute: 1 }) === 2025, 'the minute before exact lichun should remain in the prior flow year');
assert(scriptContext.BaziEngine.getFlowYearNumber({ year: 2026, month: 2, day: 4, hour: 4, minute: 3 }) === 2026, 'the minute after exact lichun should enter the new flow year');
const flowMonths2026 = scriptContext.getFlowMonths(2026, '丁');
assert(flowMonths2026[0].term === '立春' && flowMonths2026[0].dateLabel === '2026/2/4' && flowMonths2026[0].localTimeLabel === '2026/2/4 04:01' && flowMonths2026[0].gz === '庚寅' && flowMonths2026[0].startAt && flowMonths2026[0].endAt, `flow month lichun mismatch: ${JSON.stringify(flowMonths2026[0])}`);
assert(flowMonths2026[11].term === '小寒' && flowMonths2026[11].dateLabel === '2027/1/5' && flowMonths2026[11].gz === '辛丑', `flow month xiaohan should cross Gregorian year: ${JSON.stringify(flowMonths2026[11])}`);
assert(scriptContext.BaziEngine.buildPillars({ year: 2026, month: 2, day: 4, hour: 4, minute: 1 }).month === '己丑' && scriptContext.BaziEngine.buildPillars({ year: 2026, month: 2, day: 4, hour: 4, minute: 3 }).month === '庚寅', 'Bazi pillars should share the exact flow-month boundary');
assert(scriptContext.BaziEngine.nearestMajorSolarTerm({ year: 2026, month: 2, day: 4, hour: 4, minute: 1 }).distanceHours < 2, 'near-boundary lookup should flag the lichun handoff');
assert(scriptContext.renderLuckPanel(scriptContext.currentBazi).includes('class="luck-selector"'), 'luck panel should render stacked selector');
assert(!scriptContext.renderLuckPanel(scriptContext.currentBazi).includes('class="luck-origin"'), 'luck panel should not repeat origin comparison');
const luckSelectorHtml = scriptContext.renderLuckSelector(scriptContext.currentBazi, luckContext);
assert(luckSelectorHtml.includes('fortune-scroll luck-scroll'), 'decade luck should keep its own horizontal scroll container');
assert(luckSelectorHtml.includes('fortune-scroll fortune-grid year-grid'), 'flow years should keep their own responsive scroll container');
assert(luckSelectorHtml.includes('fortune-scroll fortune-grid month-grid'), 'flow months should keep their own responsive scroll container');
assert(scriptContext.branchMainGod('丙','午') === '劫财' && scriptContext.branchMainGod('丙','寅') === '偏印', 'branch summary should derive the ten-god from the existing first hidden stem');
assert(luckSelectorHtml.includes('class="fortune-pillar"') && luckSelectorHtml.includes(luckContext.luckRow.stemGod) && luckSelectorHtml.includes(scriptContext.branchMainGod(scriptContext.currentBazi.dayStem,luckContext.luckRow.gz[1])), 'luck cells should expose the stem god and main-hidden-stem branch god');
assert(luckSelectorHtml.includes(luckContext.flowYear.stemGod) && luckSelectorHtml.includes(scriptContext.branchMainGod(scriptContext.currentBazi.dayStem,luckContext.flowYear.gz[1])), 'flow-year cells should expose the stem god and main-hidden-stem branch god');
assert(luckSelectorHtml.includes(luckContext.months[0].stemGod) && luckSelectorHtml.includes(scriptContext.branchMainGod(scriptContext.currentBazi.dayStem,luckContext.months[0].gz[1])), 'flow-month cells should expose the stem god and main-hidden-stem branch god');
assert(!/class="fortune-item month-item active"/.test(scriptContext.renderLuckSelector(scriptContext.currentBazi, luckContext)), 'month buttons should not be active by default');
assert(!scriptContext.renderPillarTable(scriptContext.currentBazi).includes('大运') && !scriptContext.renderPillarTable(scriptContext.currentBazi).includes('流年'), 'pillar table should show only natal pillars by default');
assert(scriptContext.renderPillarTable(scriptContext.currentBazi, true).includes('大运') && scriptContext.renderPillarTable(scriptContext.currentBazi, true).includes('流年'), 'pillar table should include luck/year only in luck view');
assert(scriptContext.renderPillarTable(scriptContext.currentBazi).includes('神煞'), 'pillar table should include shensha row');
scriptContext.luckSelection.month = 0;
const monthContext = scriptContext.getSelectedLuckContext(scriptContext.currentBazi);
assert(monthContext.flowMonth && !scriptContext.renderPillarTable(scriptContext.currentBazi).includes('流月'), 'pillar table should still hide flow month outside luck view');
assert(monthContext.flowMonth && scriptContext.renderPillarTable(scriptContext.currentBazi, true).includes('流月'), 'the luck comparison chart should add the selected flow-month column');
const aiPromptWithSelection = scriptContext.buildAiPrompt('看当前选择');
assert(aiPromptWithSelection.includes('用户当前运势选择'), 'AI prompt should include selected luck state');
assert(aiPromptWithSelection.includes(monthContext.luckRow.gz) && aiPromptWithSelection.includes(`${monthContext.flowYear.year} ${monthContext.flowYear.gz}`) && aiPromptWithSelection.includes(monthContext.flowMonth.gz), 'AI prompt should include selected luck/year/month stems');
assert(scriptContext.buildAiContextSnapshot(scriptContext.currentBazi).includes('用户当前运势选择'), 'AI context snapshot should preserve selected luck state for follow-ups');
scriptContext.luckSelection = { luck: 9, year: 9, month: 9 };
scriptContext.resetLuckSelection();
const resetContext = scriptContext.getSelectedLuckContext(scriptContext.currentBazi);
assert(resetContext.monthIndex == null && resetContext.luckRow.active && resetContext.flowYear.year === resetContext.luck.currentYear, 'reset should select current luck/year for each chart');
const referenceBazi = {
  person: '确认偏误匿名反例',
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
function withoutGodHighlight(markup){return markup.replace(/<span class="report-god" data-god-group="[^"]+">([^<]+)<\/span>/g,'$1');}
const conciseStructureText=withoutGodHighlight(conciseStructureHtml);
assert(conciseStructureHtml.includes('data-verdict="已破"') && conciseStructureText.includes('伤官格破格：伤官见官') && conciseStructureText.includes('伤官格：已破'), 'both display modes share the frozen broken verdict');
assert(!/结构分|评分维度|格局层次：|未损日主根[01]|变化前：|变化后：/.test(conciseStructureHtml), 'all expanded public structure excludes score tiers and internal logs');
const patternHeading=conciseStructureHtml.indexOf('<h3 class="report-heading">命格</h3>');
const natalConclusionHeading=conciseStructureHtml.indexOf('<h3 class="report-heading">本盘命格结论');
assert(conciseStructureHtml.includes('class="structure-report"') && patternHeading>=0 && patternHeading<natalConclusionHeading && natalConclusionHeading<conciseStructureHtml.indexOf('喜用参考'), 'the column grid presents the chart pattern, conclusion, and actual help');
assert(conciseStructureText.includes('表达和做事方式与规则要求冲突') && conciseStructureText.includes('官杀又带来规则与压力，自己难以同时应付') && !conciseStructureText.includes('已有缓解，尚未完全解除'), 'current-chart explanation must show actual conflict and residual instead of ideal personality');
assert(scriptContext.standardGodGroup('伤官')==='食伤' && scriptContext.standardGodGroup('劫财')==='比劫', 'standard labels retain the actual ten-god family');
assert(withoutGodHighlight(conciseStructureHtml).includes('木是印星，作用是制伤护身：印星（长辈、贵人、学历证书）帮你把才华用得更有章法') && withoutGodHighlight(conciseStructureHtml).includes('土是食伤，再添会加重官伤冲突：伤官已经顶撞管你的规矩') && withoutGodHighlight(conciseStructureHtml).includes('金是财星，作用是通关：你的才华（伤官）和管你的规矩（正官）容易顶撞，财（钱财、收入）在中间搭桥，先把才华变成收入，再用收入换来职位和别人的信任。求财时别丢了印星这层靠山。'), 'standard useful copy explains the chart-specific job and damage');
assert(!/出生月份的木（学业和贵人）|支撑|应少增|已有缓解，尚未完全解除/.test(conciseStructureHtml), 'standard tab removes mechanical translation and repeated tails');
{
  const modeCopy=scriptContext.modeCopy;
  scriptContext.modeCopy=standard=>standard;
  try {
    for(const [person,gender,year,month,day,hour,minute] of [['色魔','男',1993,11,24,5,2],['笠夏','男',1993,7,14,8,40],['小蔓','女',1998,6,23,9,30],['香肠','男',1993,12,13,8,5],['陈伟伟','男',2002,6,27,19,45]]){
      const data=scriptContext.BaziEngine.createBaziProfile({person,gender,input:{year,month,day,hour,minute},location:{name:'云南省曲靖市师宗县',lng:103.9936,lat:24.8222},useTrueSolar:true,useDaylightSaving:false});
      const copy=scriptContext.renderCoreCards(data)+scriptContext.renderStructure(data),view=scriptContext.standardStructureView(data),useful=scriptContext.usefulDecisionView(data);
      assert(!/接通|应少增|不单列|增援|印比|可能|看条件|不明确|分情况|分条件|取决于|尚未确认|变化前|变化后|格局层次/.test(copy), person+' standard summary and full card exclude banned wording');
      for(const item of view.support.slice(0,3))if(item.step&&useful.avoid.includes(scriptContext.standardActorElement(item.step.left)))assert(item.standard.includes('原局已有的')&&item.standard.includes('不宜再添'), person+' supporting taboo element must not imply adding more');
      assert(!view.support.some(item=>/同时也加重|不能消除自身/.test(item.standard)),person+' support entries keep limitations in the limits section');
      if(person==='笠夏')assert(view.limits.filter(item=>item.standard&&/身弱|自身力量不足/.test(item.standard)).length===1,'overlapping carrying limits are stated once');
      if(person==='陈伟伟')assert(copy.includes('<dt>主要受限：</dt><dd>无</dd>'),'formed blade shows an empty limits field directly');
    }
  } finally {scriptContext.modeCopy=modeCopy;}
}
const bladeBazi={...conciseReferenceBazi,pillars:{year:'壬午',month:'丙午',day:'丙寅',hour:'丁酉'},dayStem:'丙',dayElement:'火',time:{...conciseReferenceBazi.time,used:{year:2002,month:6,day:27,hour:18,minute:35}}};
const bladeStructure=scriptContext.renderStructure(bladeBazi);
assert(bladeStructure.includes('月刃格：已成') && bladeStructure.includes('月刃格成格：') && bladeStructure.includes('data-use-role="primary" data-element="水"'), 'formed blade keeps its actual verdict and water role');
const highlightedOfficer='<span class="report-god" data-god-group="官杀">官杀</span>';
assert(bladeStructure.includes('成格要'+highlightedOfficer+'有力约束')&&bladeStructure.includes('水是'+highlightedOfficer+'，作用是制刃'),'the same term has matching inline emphasis in the principle and this chart’s useful explanation');
assert(bladeStructure.includes('水（'+highlightedOfficer+'）能约束')&&bladeStructure.includes('土：<span class="report-god" data-god-group="食伤">食伤</span>生财'),'the chart verdict and its supporting evidence use the same inline emphasis');
const reviewedPatternNames = [
  '正官格','七杀格','正财格','偏财格','正印格','偏印格','食神格','伤官格','建禄格','月劫用事','月刃格',
  '杀印相生格','食神制杀格','伤官配印格','官印相生格','财官印相生格','伤官生财格','食神生财格','财滋弱杀格','羊刃驾杀格',
  '从格：从杀格','从格：从财格','从格：从儿格',
  '化气格：甲己化土','化气格：乙庚化金','化气格：丙辛化水','化气格：丁壬化木','化气格：戊癸化火',
  '专旺格：曲直格','专旺格：炎上格','专旺格：稼穑格','专旺格：从革格','专旺格：润下格',
];
for (const name of reviewedPatternNames) {
  const standard = scriptContext.publicPatternReading(name, false);
  const professional = scriptContext.publicPatternReading(name, true);
  assert(['正面特质','负面特质','一句话'].every(label => standard.includes('<dt>'+label+'：</dt>')), name+' should have its own complete plain-language traits');
  assert(/is-favorable"><dt>喜/.test(professional) && /is-unfavorable"><dt>忌/.test(professional), name+' should have its own favorable and unfavorable conditions');
}
for (const technical of [false, true]) {
  assert(new Set(reviewedPatternNames.map(name => scriptContext.publicPatternReading(name, technical))).size === 33, 'all reviewed names should have distinct readings in both modes');
}

const contextHelpContracts = {
  missing: '五行缺失不等于命里一定不好',
  strength: '旺衰不是命好命坏的评分',
  useful: '不等于数量越多越好',
  'main-pattern': '格局名称只说明命盘的主要作用路线',
  'current-luck': '不会把原局永久改成另一个层次',
  phenomenon: '不是医学诊断，也不等于固定性格',
  'positive-phenomenon': '不代表才华或成就必然兑现',
  interaction: '不能单独等同于结婚、破财、疾病',
  'special-pattern': '条件不足只能作为特殊结构线索',
  formation: '成而有瑕',
};
Object.entries(contextHelpContracts).forEach(([key, expected]) => {
  const tip = scriptContext.contextHelp(key);
  assert(tip.includes(`data-help="${key}"`) && tip.includes('class="explain-help-button"') && tip.includes(`aria-controls="explain-help-${key}"`) && tip.includes(`id="explain-help-${key}"`) && tip.includes('role="dialog"') && tip.includes('aria-label="关闭说明"') && tip.includes(expected), `${key} should expose its agreed question-mark explanation, got ${tip}`);
});
['function setHelpPopoverState','function closeAllHelpPopovers','function toggleHelpPopover','function closeHelpPopover','help-popover-open','explain-help-backdrop','max-height:calc(100dvh - 32px)','.explain-help:not(.is-open) .explain-help-popover'].forEach((needle) => assert(html.includes(needle), `mobile help dialog safeguard missing ${needle}`));
assert((html.match(/contextHelp\(/g)||[]).length===10,'all nine semantic context-help render calls plus declaration must survive');
assert(['missing','useful','formation','strength','current-luck','interaction'].every(key=>conciseStructureHtml.includes(`data-help="${key}"`)), 'current equivalent structure sections render all six unconditional explanations');
assert(conciseStructureHtml.includes('class="report-chart-note">五行齐全') && conciseStructureHtml.includes('data-help="missing"'), 'the distribution note retains contextual help');
const helpUsefulSection=conciseStructureHtml.split('data-help="useful"')[1].split('</section>')[0];
assert(helpUsefulSection.includes('主用：') && helpUsefulSection.includes('佐用：'), 'help remains beside the actual useful roles in both modes');
// Exercise the original common click/touch and keyboard dialog handling, not just helper markup.
{
  const doc=scriptContext.document,saved={querySelector:doc.querySelector,querySelectorAll:doc.querySelectorAll,body:doc.body};
  const helps=[];let focused=0,prevented=0,stopped=0;
  function help(){const flags=new Set(),attrs={},popover={setAttribute(k,v){attrs[k]=v}},button={setAttribute(k,v){attrs[k]=v},focus(){focused++},closest(){return h}},close={closest(){return h}};
    const h={flags,attrs,button,close,classList:{contains(k){return flags.has(k)},toggle(k,v){v?flags.add(k):flags.delete(k)}},querySelector(q){return q==='.explain-help-button'?button:q==='.explain-help-close'?close:popover},contains(x){return x===button||x===close}};helps.push(h);return h;}
  doc.querySelector=()=>helps.find(h=>h.flags.has('is-open'))||null;
  doc.querySelectorAll=()=>helps.filter(h=>h.flags.has('is-open'));
  const bodyFlags=new Set();doc.body={classList:{toggle(k,v){v?bodyFlags.add(k):bodyFlags.delete(k)}}};
  const a=help(),b=help(),event={preventDefault(){prevented++},stopPropagation(){stopped++}};
  scriptContext.toggleHelpPopover(event,a.button);
  assert(a.attrs['aria-expanded']==='true'&&a.attrs['aria-hidden']==='false'&&bodyFlags.has('help-popover-open'),'button click/touch opens an announced dialog and body safeguard');
  scriptContext.toggleHelpPopover(event,b.button);
  assert(a.attrs['aria-hidden']==='true'&&b.attrs['aria-expanded']==='true','opening another help closes the previous dialog');
  helpDocumentEvents.keydown.filter(fn=>String(fn).includes("event.key!=='Escape'")).forEach(fn=>fn({...event,key:'Escape'}));
  assert(b.attrs['aria-expanded']==='false'&&focused===1&&!bodyFlags.has('help-popover-open'),'Escape closes dialog and restores focus');
  scriptContext.toggleHelpPopover(event,a.button);scriptContext.closeHelpPopover(event,a.close);
  assert(focused===2&&a.attrs['aria-hidden']==='true','close/backdrop control restores focus');
  scriptContext.toggleHelpPopover(event,a.button);
  helpDocumentEvents.click.filter(fn=>String(fn).includes('open.contains')).forEach(fn=>fn({target:{}}));
  assert(a.attrs['aria-expanded']==='false'&&prevented===stopped,'outside click dismisses help and dialog controls stop propagation');
  Object.assign(doc,saved);
}

const usefulNoteHtml=scriptContext.publicUsefulRows(scriptContext.refreshPatternAnalysis(conciseReferenceBazi));
assert(usefulNoteHtml.includes('主用：')&&usefulNoteHtml.includes('佐用：')&&usefulNoteHtml.includes('忌：')&&!/<details|其他作用说明|独立作用/.test(usefulNoteHtml),'useful roles and sourced references are shown directly');
const patternSection=conciseStructureHtml.slice(patternHeading,conciseStructureHtml.indexOf('</section>',patternHeading));
assert(!/查看格局说明|成格与破格只说明|<details/.test(patternSection)&&patternSection.includes('格局喜忌')&&patternSection.includes('is-favorable')&&patternSection.includes('is-unfavorable'),'both modes show pattern guidance without a disclosure');
assert(patternSection.split('is-traits').length===2&&patternSection.indexOf('is-traits')>patternSection.indexOf('is-unfavorable'),'the shared traits appear once after the mode-specific guidance');
assert(!conciseStructureHtml.includes('本盘作用说明')&&conciseStructureHtml.includes('本盘取用以木（制伤护身）为主'),'the verdict links to this chart’s use choices without a separate redundant disclosure');
function assertUsefulRow(html,role,element,group,effect,technical){
  const row=html.split('data-use-role="'+role+'" data-element="'+element+'"')[1]?.split('</div>')[0];
  const label=row?.match(/<dt>(.*?)<\/dt>/)?.[1].replace(/<[^>]+>/g,'');
  const description=row?.match(/<dd>(.*?)<\/dd>/)?.[1];
  assert(label===({primary:'主用',secondary:'佐用',avoid:'忌'}[role]+'：'+element),element+' keeps only its role and element in the label');
  assert(description&&withoutGodHighlight(description).startsWith(element+'是'+group+'，'+(role==='avoid'?'再添会':'作用是')+(technical?effect:effect.replace(/^局部/,''))+(technical?'':'：')),element+' explains its ten-god group and effect in the description');
}
for(const technical of [false,true]){
  const rows=scriptContext.usefulRowsForMode(conciseReferenceBazi,technical);
  assertUsefulRow(rows,'primary','木','印星','制伤护身',technical);
  assertUsefulRow(rows,'secondary','金','财星','局部通关',technical);
  assertUsefulRow(rows,'secondary','火','比劫','扶身',technical);
  assertUsefulRow(rows,'avoid','土','食伤','加重官伤冲突',technical);
  const alternate=usefulNoteHtml.split(technical?'data-professional-copy>':'data-standard-copy>')[1].split('</div><div class="mode-copy')[0];
  assert(alternate.includes('<strong>调候参考 · <b class="public-use-choice wx-水">水</b></strong>'),'the sourced seasonal note identifies water in the heading in both modes');
  assert(alternate.includes('《穷通宝鉴·三夏丙火》')&&alternate.includes('壬透于时干，庚藏在日支申，己透于月干')&&alternate.includes('官杀'),'both modes tie the seasonal reference to actual natal placements and the remaining limit');
  assert(alternate.includes(technical?'壬水为用，取庚辅佐。':'可用壬水，配合庚金。'),'the seasonal source is quoted or explained for the current mode');
}
assert(!/格局层次|结构分|评分维度/.test(scriptContext.buildPatternContextText(conciseReferenceBazi)),'public context hides structural tiers and scores');
const usefulProof=scriptContext.publicUsefulEvidence(conciseReferenceBazi);
assert(usefulProof.金.includes('己伤官生申藏庚偏财') && !usefulProof.木.includes('己伤官生申藏庚偏财'), 'source evidence remains attached to its actual route');
assert(scriptContext.usefulAiInstruction().includes('不得把不同取法的候选五行合并') && scriptContext.usefulAiInstruction().includes('不能因为问财就把财星判为喜神'), 'AI preserves existing useful-role boundaries');
const legacyUsefulView=scriptContext.usefulDecisionView({useful:{primaryUse:['木'],secondaryUse:['火'],conditionalUse:[{element:'火',benefit:'legacy benefit',risk:'legacy risk'}],avoid:['土']}});
assert(legacyUsefulView.conditionalLabels.火==='喜中带忌' && legacyUsefulView.routeDependent.length===0, 'older useful records should retain their compatible labels without inventing a new route disagreement');
const promotedBazi=scriptContext.refreshPatternAnalysis({...referenceBazi,pillars:{year:'戊寅',month:'戊午',day:'辛丑',hour:'壬辰'},dayStem:'辛',dayElement:'金'});
for(const technical of [false,true]){
  const rows=scriptContext.usefulRowsForMode(promotedBazi,technical);
  assertUsefulRow(rows,'primary','金','比劫','扶身',technical);
  assertUsefulRow(rows,'primary','水','食伤','润泄',technical);
  const alternateText=scriptContext.usefulDisplayReason(promotedBazi,'木','other',technical);
  assert(alternateText.includes('壬伤官生辰藏乙偏财')&&alternateText.includes('寅藏甲正财制戊正印'),'the alternate wealth path retains its own local benefit and verified conflict');
}
const promotedDecision=promotedBazi.useful.decision;
assert(promotedDecision.promotedPrimary.join('、')==='金、水'&&promotedBazi.useful.primaryUse.join('、')==='金、水'&&!promotedBazi.useful.secondaryUse.length,'existing secondary choices fill an empty primary in the canonical result');
assert(promotedDecision.conclusion.conditional.join('、')==='金、水'&&promotedDecision.conditionalUse.some(x=>x.element==='水'&&x.label==='喜中带忌'&&x.risk.includes('制午藏丁七杀')),'promotion retains the evidence and limits of conditional choices');
const promotedCard=scriptContext.renderCoreCards(promotedBazi);
const promotedRows=scriptContext.publicUsefulRows(promotedBazi);
const promotedWoodNotes=[...withoutGodHighlight(promotedRows).matchAll(/<p class="public-use-reference"><strong>疏土参考 · <b class="public-use-choice wx-木">木<\/b><\/strong>\s*([^<]+)<\/p>/g)].map(match=>match[1]);
assert(promotedWoodNotes.length===2&&promotedWoodNotes.every(note=>note.startsWith('《穷通宝鉴·三夏辛金》论午月辛金：「若水土多见，见甲方妙。」')&&note.includes('木可以疏土，缓解土厚埋金')),'both modes should show the sourced earth-restraint reference next to the useful elements');
assert(promotedWoodNotes[0].includes('木也会牵制杀印相生格所用的印星')&&promotedWoodNotes[1].includes('壬伤官生辰藏乙偏财')&&promotedWoodNotes[1].includes('寅藏甲正财制戊正印'),'the reference keeps the original contact, local wealth benefit and seal constraint');
const promotedConclusion=withoutGodHighlight(scriptContext.renderStructure({...promotedBazi,scores:scriptContext.BaziEngine.scoreWuxing(promotedBazi.pillars)})).match(/<section class="report-section" data-verdict[^>]*>[\s\S]*?<\/section>/)?.[0]||'';
assert(promotedConclusion&&!promotedConclusion.includes('木可以疏土')&&!promotedConclusion.includes('《穷通宝鉴·三夏辛金》'),'the sourced wood reference belongs to useful elements, without repeating it in the natal conclusion');
const promotedWoodReview=promotedDecision.routes.find(route=>route.resourceRestraint)?.resourceRestraint;
assert(promotedWoodReview?.step.active&&promotedWoodReview.capacity==='conditional'&&promotedWoodReview.protectedPattern?.replaceable,'wood review must keep the effective contact, remaining capacity condition and surviving seal path separate');
assert(promotedCard.includes('core-use-primary')&&!promotedCard.includes('core-use-secondary')&&promotedRows.includes('data-use-role="primary" data-element="水"')&&withoutGodHighlight(promotedRows).includes('七杀（压力、对手）把压力转成靠山'),'both page surfaces use the promoted roles and the detailed rows explain the risk');
const coreExtras=scriptContext.renderCoreCards(conciseReferenceBazi).split('查看其他取用结论</summary>')[1].split('</details>')[0];
assert(coreExtras.includes('忌：')&&coreExtras.includes('取法差异：')&&!/主用|佐用/.test(coreExtras),'expanded card shows only complementary conclusions');
assert(scriptContext.renderCoreCards({...referenceBazi,useful:{primaryUse:[],secondaryUse:[]}}).includes('暂无取用结论'),'a chart without primary or secondary choices shows an empty state');
const alternateInjuryCases=[
  [{year:'乙丑',month:'甲申',day:'己丑',hour:'丁卯'},'伤官格已成','印星制伤护身',['火'],[]],
  [{year:'甲子',month:'戊辰',day:'丁卯',hour:'壬寅'},'伤官格待成','杂气多神并用',['火'],['土']],
  [{year:'辛酉',month:'丁午',day:'甲寅',hour:'丙戌'},'伤官格已破','官伤冲突未解',['水','木'],['金']],
];
for(const [pillars,title,reason,primary,secondary] of alternateInjuryCases){
  const data=scriptContext.refreshPatternAnalysis({pillars,dayStem:pillars.day[0]});
  const verdict=withoutGodHighlight(scriptContext.patternConclusionText(data,true));
  const choices=scriptContext.usefulDecisionView(data);
  assert(verdict.includes(title.replace('格','格：'))&&scriptContext.caseDisplayView(data).verdict===title.slice(3)&&!verdict.includes('己伤官制癸正官'), 'same named injury pattern must report this chart’s own verdict and basis: '+verdict);
  assert(choices.primary.join()===primary.join()&&choices.secondary.join()===secondary.join(), 'general 喜财／喜印 must not override the different chart’s actual engine selection');
}
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
const unsupportedFireGroupPattern = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '壬戌', month: '癸丑', day: '甲寅', hour: '庚午' }, dayStem: '甲' });
const effectiveFireGroupBazi = { person: 'theoretical group feedback', gender: '男', pillars: { year: '丙戌', month: '丁丑', day: '甲寅', hour: '丙午' }, dayStem: '甲', dayElement: '木', time: { used: { year: 1993, month: 1, day: 1, hour: 12, minute: 0 }, input: { year: 1993, month: 1, day: 1, hour: 12, minute: 0 }, enabled: false, correction: 0, location: { name: 'sample', lng: 120, lat: 30 } } };
const effectiveFireGroupPattern = scriptContext.BaziEngine.analyzePattern(effectiveFireGroupBazi);
assert(unsupportedFireGroupPattern.interactions.groups.some((x) => x.name === '三合火局' && !x.active) && unsupportedFireGroupPattern.strengthScore.dimensions.roots.items.some((x) => x.branch === '寅' && !x.transformedAway), `an unsupported complete group should remain pending and preserve the original root, got ${JSON.stringify({ groups: unsupportedFireGroupPattern.interactions.groups, roots: unsupportedFireGroupPattern.strengthScore.dimensions.roots.items })}`);
assert(effectiveFireGroupPattern.interactions.groups.some((x) => x.name === '三合火局' && x.active) && effectiveFireGroupPattern.strengthScore.dimensions.roots.items.some((x) => x.branch === '寅' && x.transformedAway && !x.usable), `an effective fire group should feed back into root availability instead of retaining the original wood root, got ${JSON.stringify({ groups: effectiveFireGroupPattern.interactions.groups, roots: effectiveFireGroupPattern.strengthScore.dimensions.roots.items })}`);
assert(effectiveFireGroupPattern.strengthScore.support < unsupportedFireGroupPattern.strengthScore.support && effectiveFireGroupPattern.carryingCapacity.strictFormationEligible === false && effectiveFireGroupPattern.carryingCapacity.damagedRootCount === 1, `group transformation should lower support and expose attributable carrying-capacity feedback, got ${JSON.stringify({ pending: unsupportedFireGroupPattern.strengthScore.support, effective: effectiveFireGroupPattern.strengthScore.support, capacity: effectiveFireGroupPattern.carryingCapacity })}`);
const transformedCombineScore = scriptContext.BaziEngine.strengthScore('甲', { year: '甲寅', month: '乙亥', day: '甲辰', hour: '丁酉' });
assert(transformedCombineScore.interactions.branchPairs.some((x) => x.type === '六合' && x.text.includes('寅亥') && x.effect === 'transform'), `a target supported by month qi and overall momentum should expose a transformation tendency, got ${JSON.stringify(transformedCombineScore.interactions.branchPairs)}`);
assert(transformedCombineScore.interactions.branchPairs.some((x) => x.type === '破' && x.text.includes('寅亥') && !x.active && x.status === '破受合制') && transformedCombineScore.dimensions.roots.items.filter((x) => x.branch === '寅' || x.branch === '亥').every((x) => !x.attacked), `a supported direct combine should suppress its lower-priority break before root scoring, got ${JSON.stringify({ pairs: transformedCombineScore.interactions.branchPairs, roots: transformedCombineScore.dimensions.roots.items })}`);
const interactionRuleBazi = { person: 'interaction sample', gender: '男', pillars: { year: '甲子', month: '乙丑', day: '丙午', hour: '丁酉' }, dayStem: '丙', dayElement: '火', time: { used: { year: 1993, month: 1, day: 1, hour: 18, minute: 0 }, input: { year: 1993, month: 1, day: 1, hour: 18, minute: 0 }, enabled: false, correction: 0, location: { name: 'sample', lng: 120, lat: 30 } } };
assert(scriptContext.interactionText(interactionRuleBazi).includes('合冲裁决：') && !scriptContext.interactionText(interactionRuleBazi).includes('ZP-HC-01') && scriptContext.interactionText(interactionRuleBazi).includes('冲合并见'), `structure view should render a readable arbitration conclusion without internal rule ids, got ${scriptContext.interactionText(interactionRuleBazi)}`);
assert(scriptContext.interactionText(interactionRuleBazi, true).includes('ZP-HC-01'), 'technical interaction context should retain arbitration rule ids');
assert(scriptContext.strengthEvidenceText(effectiveFireGroupBazi).includes('承载复核：严格成格承载入口未通过') && scriptContext.buildPatternContextText(effectiveFireGroupBazi).includes('已有救应') && scriptContext.buildPatternContextText(effectiveFireGroupBazi).includes('ZP-FB-01') === false, 'page and AI context should share the capacity conclusion while keeping the internal rule id out of visible reasoning');
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
const weakPublicUseful=scriptContext.publicUsefulRows(scriptContext.refreshPatternAnalysis(weakSeasonBazi));
assert(weakPublicUseful.includes('主用') && !weakPublicUseful.includes('月令用神（定格）'), 'structure view should show one concise final useful-element decision');
assert(['月令用神（定格）', '扶抑喜用', '调候神', '最终主用'].every((label) => scriptContext.usefulPriorityText(weakSeasonBazi, true).includes(label)), 'technical useful context should retain the detailed role split');
const extremeColdPattern = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '壬子', month: '癸亥', day: '丁酉', hour: '壬子' }, dayStem: '丁' });
assert(extremeColdPattern.useful.layers.tiaohou.priority === '主用', `water-heavy winter chart should elevate climate correction, got ${JSON.stringify(extremeColdPattern.useful.layers.tiaohou)}`);
assert(referencePattern.primary.includes('伤官'), `reference pattern should use month command, got ${referencePattern.primary}`);
assert(referencePattern.evidence.some((x) => x.includes('月令')), 'pattern evidence should include month command');
assert(referencePattern.evidence.some((x) => x.includes('透干')), 'pattern evidence should include revealed stems');
assert(referencePattern.evidence.some((x) => x.includes('通根')), 'pattern evidence should include roots');
assert(referencePattern.useful.use.length > 0, 'pattern analysis should include useful elements');
assert(referencePattern.mainPattern === '未见明确成格' && !referencePattern.comboPatterns.includes('食神制杀格'), `hidden food should not be promoted into a formed food-control main pattern, got ${JSON.stringify({ primary: referencePattern.primary, main: referencePattern.mainPattern, combos: referencePattern.comboPatterns })}`);
assert(referencePattern.comboClues.some((x) => x.name === '食神制杀线索参考' && x.text.includes('食神未透且未得月令') && x.text.includes('日主承泄任杀不足') && x.text.includes('官杀混杂未清')), `the old confirmation-bias case should list each failed food-control gate, got ${JSON.stringify(referencePattern.comboClues)}`);
assert(!referencePattern.comboClues.some((x) => x.name === '食伤分工参考') && referencePattern.comboClues.some((x) => x.name === '食伤混杂线索参考'), 'hidden food without a formed control route cannot receive a formed division-of-duty exemption; unusable roots must not be counted back as strong mixture');
assert(!referencePattern.interactionFlow.steps.some((x) => x.active && x.left && x.left.text.includes('食神') && x.right && x.right.text.includes('七杀')), `a hidden food-killing pair must not become an active main-pattern flow, got ${JSON.stringify(referencePattern.interactionFlow)}`);
assert(referencePattern.patternDisease.ruleId === 'ZP-NET-01' && referencePattern.patternDisease.items.every(x => x.status !== '已解' || x.medicines.some(m => m.rank === 2 && m.steps && m.steps.length && m.steps.every(s => s.active))), 'full resolution must have an actual treatment, not the old example answer');
assert(referencePattern.patternDisease.items.filter(x => x.medicines.some(m => /有根未透/.test(m.state))).every(x => x.status !== '已解'), 'hidden medicine can retain local benefit but cannot establish full rescue');
assert(!JSON.stringify(referencePattern.useful).includes('朋友分财'), 'conditional support must not invent friends or financial events');
scriptContext.refreshPatternAnalysis(referenceBazi);
assert(scriptContext.usefulPriorityText(referenceBazi, true).includes('有根未透'), 'the page should preserve rooted-hidden evidence from the refreshed canonical analysis');
assert(scriptContext.patternFactorText(referenceBazi).includes('病药净结算：') && /仍有残病|病点未解/.test(scriptContext.patternFactorText(referenceBazi)), `formation factors should show disease, medicine, effect, and residual disease, got ${scriptContext.patternFactorText(referenceBazi)}`);
assert(referencePattern.analysisMeta.engineVersion === 'BAZI-PATTERN-2026.11.07.1-review' && referencePattern.analysisMeta.ruleVersion === 'ZP-2026.11.07.1-review' && referencePattern.analysisMeta.baselineVersion === 'ZP-TB-1984-2044-D11-H12-v13-review' && referencePattern.analysisMeta.scoreModelVersion === 'ZP-SCORE-2026.07.15-v4' && referencePattern.analysisMeta.baselineScope.includes('单盘层次由结构分直接分档'), `pattern results should expose the current engine/rule/baseline/score versions and score-first scope, got ${JSON.stringify(referencePattern.analysisMeta)}`);
assert(Number.isInteger(referencePattern.patternRawScore) && referencePattern.patternRawScore >= 0 && referencePattern.patternRawScore <= 100 && typeof referencePattern.patternStructureScore === 'number' && referencePattern.natalPatternLevel.rawScore === referencePattern.patternStructureScore && referencePattern.natalPatternLevel.diagnosticPercentile === referencePattern.patternPercentile, `each natal chart should receive a bounded raw score, one-decimal structure score, and diagnostic-only percentile, got ${JSON.stringify({ score: referencePattern.patternRawScore, structureScore: referencePattern.patternStructureScore, percentile: referencePattern.patternPercentile, level: referencePattern.natalPatternLevel })}`);
const referenceScoreLedger = referencePattern.patternRawScoreBreakdown;
assert(referenceScoreLedger.modelVersion === referencePattern.analysisMeta.scoreModelVersion && referenceScoreLedger.method.includes('六维线性加权') && referenceScoreLedger.method.includes('格名文字不直接决定') && referenceScoreLedger.method.includes('不使用现实人物结果标签'), `raw score should expose the agreed authority score model and boundary, got ${JSON.stringify(referenceScoreLedger)}`);
assert(JSON.stringify(referenceScoreLedger.dimensions.map((x) => [x.key, x.weight])) === JSON.stringify([['potential',20],['formation',25],['flow',20],['clarity',15],['remedy',15],['balance',5]]) && referenceScoreLedger.dimensions.every((x) => typeof x.score === 'number' && typeof x.contribution === 'number' && x.evidence), `raw score should expose six attributable weighted dimensions with an independent classical-potential layer, got ${JSON.stringify(referenceScoreLedger.dimensions)}`);
assert(Math.abs(referenceScoreLedger.dimensions.reduce((sum, x) => sum + x.contribution, 0) - referenceScoreLedger.unroundedScore) < 0.001 && Math.round(referenceScoreLedger.unroundedScore) === referenceScoreLedger.score && referenceScoreLedger.totalWeight === 100, `dimension contributions should reproduce the final raw score, got ${JSON.stringify(referenceScoreLedger)}`);
const brokenMonthPatternScore = scriptContext.BaziEngine.patternStructureRawScore({
  regularPattern: {
    name: '伤官格', status: '已破', formed: false,
    authority: { ruleId: 'ZP-MG-06', source: '理论月令格测试' },
    checks: [
      { type: '立格', active: true, ruleId: 'ZP-MG-06-LG-1' },
      { type: '成格', active: true, ruleId: 'ZP-MG-06-CG-1' },
      { type: '成格', active: false, ruleId: 'ZP-MG-06-CG-2' },
    ],
  },
  patternStructures: [{ name: '伤官格', role: '命格主线', status: '已破', ruleId: 'ZP-MG-06' }],
  interactionFlow: { steps: [] },
  structuralClarity: { level: '浊', causeGroup: 'officer-output-conflict', numericOwner: 'disease' },
  patternDisease: { ruleId: 'ZP-NET-01', items: [{ family: '官伤冲战' }], solved: [], partial: [], unresolved: [{ family: '官伤冲战' }] },
  elementPhenomena: [], positivePhenomena: [],
});
const brokenMonthPotential = brokenMonthPatternScore.dimensions.find((item) => item.key === 'potential');
const brokenMonthFormation = brokenMonthPatternScore.dimensions.find((item) => item.key === 'formation');
assert(brokenMonthPotential.score === 70 && brokenMonthPotential.evidence.includes('理论上限') && brokenMonthFormation.score === 46, `an established month-command pattern should keep its B-tier ceiling while formation and remedy independently settle a direct break, got ${JSON.stringify(brokenMonthPatternScore.dimensions)}`);
const mixedRemedyPatternScore = scriptContext.BaziEngine.patternStructureRawScore({
  regularPattern: {
    name: '伤官格', status: '已破', formed: false,
    authority: { ruleId: 'ZP-MG-06', source: '理论病药比例测试' },
    checks: [{ type: '立格', active: true, ruleId: 'ZP-MG-06-LG-1' }],
  },
  patternStructures: [{ name: '伤官格', role: '命格主线', status: '已破', ruleId: 'ZP-MG-06' }],
  interactionFlow: { steps: [] }, structuralClarity: { level: '浊', causeGroup: 'mixed-disease', numericOwner: 'disease' },
  patternDisease: {
    ruleId: 'ZP-NET-01', items: [{ family: 'A' }, { family: 'B' }, { family: 'C' }, { family: 'D' }], solved: [],
    partial: [{ family: 'A' }, { family: 'B' }, { family: 'C' }], unresolved: [{ family: 'D' }],
  },
  elementPhenomena: [], positivePhenomena: [],
});
const mixedRemedy = mixedRemedyPatternScore.dimensions.find((item) => item.key === 'remedy');
assert(mixedRemedy.score === 46 && mixedRemedy.evidence.includes('残病强度5/8') && mixedRemedy.score > brokenMonthPatternScore.dimensions.find((item) => item.key === 'remedy').score, `partial medicine should improve only the treated share instead of collapsing every chart with one unresolved disease to 25, got ${JSON.stringify(mixedRemedy)}`);
const unverifiedPatternScore = scriptContext.BaziEngine.patternStructureRawScore({
  regularPattern: { name: '命格待判', status: '待成', formed: false, authority: { ruleId: 'ZP-MG-00', source: '理论未立格反例' }, checks: [] },
  patternStructures: [], interactionFlow: { steps: [] }, structuralClarity: { level: '待辨', causeGroup: 'pending', numericOwner: 'clarity' },
  patternDisease: { ruleId: 'ZP-NET-01', items: [], solved: [], partial: [], unresolved: [] }, elementPhenomena: [], positivePhenomena: [],
});
assert(unverifiedPatternScore.dimensions.find((item) => item.key === 'potential').score === 0, `a chart without an established month-command pattern must not receive ordinary-pattern potential, got ${JSON.stringify(unverifiedPatternScore.dimensions)}`);
const validateCauseOwnership = (score) => {
  const requiredFields = ['causeId','numericOwner','ruleId','evidence','share'];
  assert(score.causeAudit && score.causeAudit.valid && score.causeAudit.duplicateNumericOwners.length === 0 && score.causeAudit.missingMetadata.length === 0, `score ledger should pass its cause ownership audit, got ${JSON.stringify(score.causeAudit)}`);
  score.ledger.forEach((entry) => {
    assert(requiredFields.every((field) => Object.prototype.hasOwnProperty.call(entry, field) && entry[field] !== '' && entry[field] != null), `every score component should expose cause ownership metadata, got ${JSON.stringify(entry)}`);
    assert(entry.dimension === entry.numericOwner || (entry.share === 0 && entry.counted === false && entry.effectiveContribution === 0), `a cross-dimension explanation must be numerically neutral, got ${JSON.stringify(entry)}`);
  });
  score.dimensions.forEach((dimension) => {
    const ownerShare = dimension.components.filter((entry) => entry.numericOwner === dimension.key && entry.counted).reduce((sum, entry) => sum + entry.share, 0);
    assert(Math.abs(ownerShare - 100) < 1e-9, `${dimension.key} numeric-owner shares should total 100, got ${ownerShare}`);
  });
  const ownersByCause = {};
  score.ledger.filter((entry) => entry.counted && entry.share > 0).forEach((entry) => {
    ownersByCause[entry.causeId] = ownersByCause[entry.causeId] || new Set();
    ownersByCause[entry.causeId].add(entry.numericOwner);
  });
  assert(Object.values(ownersByCause).every((owners) => owners.size === 1), `one causeId must never have multiple numeric owners, got ${JSON.stringify(Object.entries(ownersByCause).map(([causeId, owners]) => [causeId, Array.from(owners)]))}`);
};
validateCauseOwnership(referenceScoreLedger);
const referenceActiveScoreSnapshot = JSON.stringify({ score: referencePattern.patternRawScore, modelVersion: referencePattern.patternRawScoreBreakdown.modelVersion, weights: referencePattern.patternRawScoreBreakdown.dimensions.map((item) => item.weight) });
const auditControlWeights = {potential:20,formation:25,flow:20,clarity:15,remedy:15,balance:5};
const auditCandidateWeights = {potential:10,formation:25,flow:25,clarity:15,remedy:20,balance:5};
const deduplicatedReferenceVector = scriptContext.BaziEngine.patternStructureRawScore(referencePattern, { weights: auditControlWeights, modelVersion: 'PAT-LV-DESIGN-v1-CAUSE-DEDUP-v1', deduplicateCauses: true, auditOnly: true });
const candidateReferenceScore = scriptContext.BaziEngine.reweightPatternScore(deduplicatedReferenceVector, auditCandidateWeights, 'PAT-LV-DESIGN-v1-CANDIDATE');
validateCauseOwnership(deduplicatedReferenceVector);
validateCauseOwnership(candidateReferenceScore);
const referenceDimensionScores = Object.fromEntries(deduplicatedReferenceVector.dimensions.map((item) => [item.key, item.score]));
const expectedReferenceDelta = -0.10 * referenceDimensionScores.potential + 0.05 * referenceDimensionScores.flow + 0.05 * referenceDimensionScores.remedy;
assert(Math.abs((candidateReferenceScore.unroundedScore - deduplicatedReferenceVector.unroundedScore) - expectedReferenceDelta) < 1e-9, `candidate reweighting should reuse one deduplicated vector and match the declared sensitivity formula, got ${JSON.stringify({ control: deduplicatedReferenceVector, candidate: candidateReferenceScore })}`);
assert(JSON.stringify({ score: referencePattern.patternRawScore, modelVersion: referencePattern.patternRawScoreBreakdown.modelVersion, weights: referencePattern.patternRawScoreBreakdown.dimensions.map((item) => item.weight) }) === referenceActiveScoreSnapshot, 'audit scoring must not mutate the active analysis object, score model, or 20/25/20/15/15/5 weights');
const exactTieRange = scriptContext.BaziEngine.percentileRangeFromHistogram(20, {10:2,20:4,30:4});
assert(exactTieRange.low === 20 && exactTieRange.midpoint === 40 && exactTieRange.high === 60 && exactTieRange.equalCount === 4 && exactTieRange.populationSize === 10 && exactTieRange.populationType === 'theoretical-legal-four-pillars', `exact tie ranges should retain unrounded low/mid/high positions, got ${JSON.stringify(exactTieRange)}`);
const theoreticalBaseline = scriptContext.BaziEngine.theoreticalBaseline;
assert(theoreticalBaseline.version === 'ZP-TB-1984-2044-D11-H12-v13-review' && theoreticalBaseline.scoreModelVersion === 'ZP-SCORE-2026.07.15-v4' && theoreticalBaseline.config.stepDays === 11 && theoreticalBaseline.config.hours.length === 12 && theoreticalBaseline.config.deduplicate === 'fourPillars' && theoreticalBaseline.config.trueSolarCorrection === false, `the frozen theoretical grid should expose its complete sampling contract, got ${JSON.stringify(theoreticalBaseline)}`);
assert(Object.values(theoreticalBaseline.histogram).reduce((sum, count) => sum + count, 0) === 23916 && theoreticalBaseline.stats.uniqueCount === 23916 && theoreticalBaseline.stats.scoreRange.min === 39 && theoreticalBaseline.stats.scoreRange.max === 89 && theoreticalBaseline.stats.quantiles.p20 === 49 && theoreticalBaseline.stats.quantiles.p80 === 73, 'v13 frozen histogram and quantiles must match the independently rebuilt final rule grid');
assert(JSON.stringify(theoreticalBaseline.stats.candidateGradeCounts) === JSON.stringify({偏高:11508,高:3251,顶级:911,中等:5792,偏低:2454}) && JSON.stringify(theoreticalBaseline.stats.gradeCounts) === JSON.stringify({偏高:11973,高:2854,顶级:843,中等:5792,偏低:2454}) && theoreticalBaseline.stats.gradePercentages.顶级 === 3.52, 'v13 candidate and hard-gated distributions must match the new grid; B1 remains historical only');
assert(JSON.stringify(scriptContext.BaziEngine.constants.THEORETICAL_LEVEL_BANDS.map((x) => [x.grade, x.min, x.max])) === JSON.stringify([['偏低',0,5],['中等',5,20],['偏高',20,80],['高',80,95],['顶级',95,100.1]]), `the five theoretical bands should remain frozen and public, got ${JSON.stringify(scriptContext.BaziEngine.constants.THEORETICAL_LEVEL_BANDS)}`);
assert([0,4.9,5,19.9,20,79.9,80,94.9,95,100].map((p) => scriptContext.BaziEngine.theoreticalGradeFromPercentile(p).grade).join(',') === '偏低,偏低,中等,中等,偏高,偏高,高,高,顶级,顶级', 'percentile boundaries should map deterministically to the agreed five public grades');
assert(JSON.stringify(scriptContext.BaziEngine.constants.STRUCTURE_SCORE_LEVEL_BANDS.map((x) => [x.grade,x.label,x.min,x.max])) === JSON.stringify([['偏低','不高于48分',0,48],['中等','高于48分且不高于52分',48,52],['偏高','高于52分且低于75分',52,75],['高','75分至不足78分',75,78],['顶级','78分及以上',78,100.1]]), `direct structure-score bands should remain explicit and versioned, got ${JSON.stringify(scriptContext.BaziEngine.constants.STRUCTURE_SCORE_LEVEL_BANDS)}`);
assert([48,48.1,52,52.1,52.9,74.9,75,77.9,78].map((score) => scriptContext.BaziEngine.structureGradeFromScore(score).grade).join(',') === '偏低,中等,中等,偏高,偏高,偏高,高,高,顶级', 'unrounded structure-score boundaries should map deterministically to the agreed five grades');
assert(scriptContext.BaziEngine.patternGradeIndexWithinGates(4, 1, 3) === 3 && scriptContext.BaziEngine.patternGradeIndexWithinGates(0, 1, 3) === 1 && scriptContext.BaziEngine.patternGradeIndexWithinGates(2, 1, 3) === 2, 'valid Zi Ping gates should clamp the candidate only after both bounds are established');
let reversedPatternGateFailed = false;
try { scriptContext.BaziEngine.patternGradeIndexWithinGates(2, 3, 1); } catch (error) { reversedPatternGateFailed = error.message.includes('下限不得高于上限'); }
assert(reversedPatternGateFailed, 'floorIndex > ceilingIndex must hard-fail instead of being silently normalized');
assert(scriptContext.BaziEngine.formatPatternPercentile(0) === '低于P0.1' && scriptContext.BaziEngine.formatPatternPercentile(100) === '高于P99.9' && scriptContext.BaziEngine.formatPatternPercentile(62.3) === 'P62.3', 'percentile endpoints should use friendly display text without changing numeric ranking');
assert(referencePattern.patternLevelHardGate.ruleIds.join(',') === 'ZP-LV-04,ZP-LV-05,ZP-LV-03,ZP-NET-01' && referencePattern.patternLevelHardGate.tiePolicy.includes('结构分') && referencePattern.patternLevelHardGate.tiePolicy.includes('百分位只作总体审计') && referencePattern.patternLevelCriteria.some((x) => x.name === '结构分档') && referencePattern.patternLevelCriteria.some((x) => x.name === '高档资格'), `each final grade should expose its direct score band and high/top qualification gates, got ${JSON.stringify(referencePattern.patternLevelHardGate)}`);
const unqualifiedHighCandidate = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '甲子', month: '丙寅', day: '己卯', hour: '甲子' }, dayStem: '己' });
assert(!unqualifiedHighCandidate.patternLevelHardGate.highEligible && unqualifiedHighCandidate.patternLevelIndex <= 2, 'an unqualified chart must not cross its high-grade ceiling; its pre-fix score is not an oracle');
const unqualifiedTopCandidate = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '甲子', month: '丙寅', day: '戊辰', hour: '乙卯' }, dayStem: '戊' });
assert(!unqualifiedTopCandidate.patternLevelHardGate.topEligible && unqualifiedTopCandidate.patternLevelIndex <= 3, 'a chart without strict top qualification cannot reach top, independently of its pre-fix score');
function reviewGradeFixture(status, tier) { return { regularPattern: { status, checks: [{ type: '成格', active: true }] }, patternLevelTieBreak: { tier, order: {} }, patternLevelMetrics: {}, patternLevelCriteria: [], natalPatternLevel: {} }; }
const highGateFixture = reviewGradeFixture('待成', 0), topGateFixture = reviewGradeFixture('已成', 1);
assert(scriptContext.__patternReview.finalize(highGateFixture, { unroundedScore: 79 }, 99).finalGrade === '偏高', 'synthetic score-first unit: high score alone cannot establish formation');
assert(scriptContext.__patternReview.finalize(topGateFixture, { unroundedScore: 79 }, 99).finalGrade === '高', 'synthetic score-first unit: ordinary formed status alone cannot establish strict top eligibility');
assert(crypto.createHash('sha256').update(JSON.stringify(theoreticalBaseline.histogram)).digest('hex') === '5d1f0f1ac65df54880dd0948dac3068adc1ed3f3049a5c8dd9de21919e811e47', 'the experimental B1 histogram hash must match its separate rebuilt baseline');
const miniatureBaselineA = scriptContext.BaziEngine.buildTheoreticalPatternBaseline({ start: '1984-02-04', endExclusive: '1984-03-04', stepDays: 11, hours: [0, 12] });
const miniatureBaselineB = scriptContext.BaziEngine.buildTheoreticalPatternBaseline({ start: '1984-02-04', endExclusive: '1984-03-04', stepDays: 11, hours: [0, 12] });
assert(miniatureBaselineA.uniqueCount === 6 && JSON.stringify(miniatureBaselineA.histogram) === JSON.stringify(miniatureBaselineB.histogram) && miniatureBaselineA.candidateGradeCounts && miniatureBaselineA.gradeCounts && miniatureBaselineA.scoreModelVersion === 'ZP-SCORE-2026.07.15-v4' && miniatureBaselineA.scope.includes('不含真人资料'), `the two-pass theoretical baseline generator should be deterministic, complete, and theoretical-only, got ${JSON.stringify(miniatureBaselineA)}`);
const miniatureFourPillarKeys = [];
const miniatureFourPillarMeta = scriptContext.BaziEngine.forEachLegalFourPillar((pillars, meta) => {
  assert(meta.key === [pillars.year,pillars.month,pillars.day,pillars.hour].join('|'), `generator key should match its direct pillars, got ${JSON.stringify({ pillars, meta })}`);
  miniatureFourPillarKeys.push(meta.key);
}, { yearCycleCount: 2, monthBranchCount: 3, dayCycleCount: 2, hourBranchCount: 3 });
assert(miniatureFourPillarMeta.generatedCount === 36 && miniatureFourPillarMeta.uniqueCount === 36 && miniatureFourPillarMeta.duplicateCount === 0 && new Set(miniatureFourPillarKeys).size === 36 && miniatureFourPillarKeys[0] === '甲子|丙寅|甲子|甲子' && miniatureFourPillarKeys.at(-1) === '乙丑|庚辰|乙丑|戊寅', `the direct four-pillar generator should apply five-tiger/five-mouse rules deterministically, got ${JSON.stringify(miniatureFourPillarMeta)}`);
const fullGeneratorMeta = scriptContext.BaziEngine.forEachLegalFourPillar(null);
assert(fullGeneratorMeta.version === 'ZP-LEGAL-4P-518400-v1' && fullGeneratorMeta.generatedCount === 518400 && fullGeneratorMeta.uniqueCount === 518400 && fullGeneratorMeta.duplicateCount === 0 && fullGeneratorMeta.invalidCount === 0 && fullGeneratorMeta.firstKey === '甲子|丙寅|甲子|甲子' && fullGeneratorMeta.lastKey === '癸亥|乙丑|癸亥|癸亥' && fullGeneratorMeta.equalWeight && fullGeneratorMeta.directFourPillars && !fullGeneratorMeta.usesCalendarDates && !fullGeneratorMeta.usesGender && !fullGeneratorMeta.usesLuck, `the legal population generator should cover exactly 518,400 unique equal-weight structures, got ${JSON.stringify(fullGeneratorMeta)}`);
const hashAuditText = (text) => crypto.createHash('sha256').update(text).digest('hex');
const miniaturePatternAuditOptions = { allowPartial: true, generator: { yearCycleCount: 2, monthBranchCount: 3, dayCycleCount: 2, hourBranchCount: 3 }, hashText: hashAuditText };
const miniaturePatternAuditA = scriptContext.BaziEngine.buildPatternLevelAudit(miniaturePatternAuditOptions);
const miniaturePatternAuditB = scriptContext.BaziEngine.buildPatternLevelAudit(miniaturePatternAuditOptions);
const migrationTotal = (matrix) => Object.values(matrix).reduce((sum, row) => sum + Object.values(row).reduce((rowSum, count) => rowSum + count, 0), 0);
const assertAuditModel = (model, expectedCount) => {
  assert(Object.values(model.histogram).reduce((sum, count) => sum + count, 0) === expectedCount && model.stats.populationSize === expectedCount && /^[a-f0-9]{64}$/.test(model.histogramSha256), `audit histogram should be complete and hashable, got ${JSON.stringify(model)}`);
  Object.entries(model.tieIntervals).forEach(([score, range]) => {
    assert(range.low <= range.midpoint && range.midpoint <= range.high && range.equalCount === model.histogram[score] && range.populationSize === expectedCount, `same-score interval should be exact and stable, got ${JSON.stringify({ score, range })}`);
  });
  assert(['P5','P20','P50','P80','P95'].every((name) => model.boundaries[name] && model.boundaries[name].at.group.count === model.histogram[model.boundaries[name].score]), `audit should expose all required percentile boundary groups, got ${JSON.stringify(model.boundaries)}`);
  assert(model.extrema.minimum.group.count === model.histogram[model.extrema.minimum.score] && model.extrema.maximum.group.count === model.histogram[model.extrema.maximum.score], `audit extrema should cover the entire min/max tie groups, got ${JSON.stringify(model.extrema)}`);
};
assert(miniaturePatternAuditA.version === 'PAT-LV-DESIGN-v1' && miniaturePatternAuditA.auditOnly && !miniaturePatternAuditA.frozen && !miniaturePatternAuditA.uiIntegrated && miniaturePatternAuditA.population.generatedCount === 36 && miniaturePatternAuditA.population.analysisPassCount === 36 && miniaturePatternAuditA.population.dimensionEvaluationCount === 36 && miniaturePatternAuditA.population.analysisPassesPerChart === 1 && miniaturePatternAuditA.population.dimensionEvaluationsPerChart === 1, `PAT-LV-DESIGN-v1 should analyze each direct chart and dimension vector exactly once, got ${JSON.stringify(miniaturePatternAuditA.population)}`);
assert(JSON.stringify(miniaturePatternAuditA.models.control.weights) === JSON.stringify({potential:20,formation:25,flow:20,clarity:15,remedy:15,balance:5}) && JSON.stringify(miniaturePatternAuditA.models.candidate.weights) === JSON.stringify({potential:10,formation:25,flow:25,clarity:15,remedy:20,balance:5}) && miniaturePatternAuditA.guardrails.ruleConditionsChanged === false && miniaturePatternAuditA.guardrails.activeWeightsChanged === false && miniaturePatternAuditA.guardrails.activeUiChanged === false && miniaturePatternAuditA.guardrails.weightsFrozen === false && miniaturePatternAuditA.guardrails.usesRealPersonFeedback === false, `audit should keep the active comparator and candidate separate without freezing or UI integration, got ${JSON.stringify(miniaturePatternAuditA.guardrails)}`);
assert(miniaturePatternAuditA.causeOwnership.valid && miniaturePatternAuditA.causeOwnership.duplicateNumericOwnerCount === 0 && miniaturePatternAuditA.causeOwnership.missingMetadataCount === 0 && miniaturePatternAuditA.sensitivity.formulaResidualMax === 0 && miniaturePatternAuditA.sensitivity.structureIdentityChanges.mainPattern === 0 && miniaturePatternAuditA.sensitivity.structureIdentityChanges.status === 0 && migrationTotal(miniaturePatternAuditA.sensitivity.candidateGradeMigration) === 36 && migrationTotal(miniaturePatternAuditA.sensitivity.finalGradeMigration) === 36, `miniature audit should preserve rule identities and account for every grade migration, got ${JSON.stringify(miniaturePatternAuditA.sensitivity)}`);
assertAuditModel(miniaturePatternAuditA.models.control, 36);
assertAuditModel(miniaturePatternAuditA.models.candidate, 36);
assert(JSON.stringify(miniaturePatternAuditA.models.control.histogram) === JSON.stringify(miniaturePatternAuditB.models.control.histogram) && JSON.stringify(miniaturePatternAuditA.models.candidate.histogram) === JSON.stringify(miniaturePatternAuditB.models.candidate.histogram) && miniaturePatternAuditA.models.control.histogramSha256 === miniaturePatternAuditB.models.control.histogramSha256 && miniaturePatternAuditA.models.candidate.histogramSha256 === miniaturePatternAuditB.models.candidate.histogramSha256, 'the same direct-pillar audit should be fully deterministic');
if (process.env.BAZI_FULL_PATTERN_BASELINE === '1') {
  const rebuiltBaseline = scriptContext.BaziEngine.buildTheoreticalPatternBaseline();
  const frozenGrades = ['偏低','中等','偏高','高','顶级'];
  const countsMatch = (actual, expected) => frozenGrades.every((grade) => actual[grade] === expected[grade]);
  assert(JSON.stringify(rebuiltBaseline.histogram) === JSON.stringify(theoreticalBaseline.histogram) && JSON.stringify(rebuiltBaseline.quantiles) === JSON.stringify(theoreticalBaseline.stats.quantiles) && countsMatch(rebuiltBaseline.candidateGradeCounts, theoreticalBaseline.stats.candidateGradeCounts) && countsMatch(rebuiltBaseline.gradeCounts, theoreticalBaseline.stats.gradeCounts), `full theoretical baseline rebuild should reproduce the frozen v9 constants, got ${JSON.stringify(rebuiltBaseline)}`);
  const fullPatternAudit = scriptContext.BaziEngine.buildPatternLevelAudit({ hashText: hashAuditText });
  assert(fullPatternAudit.population.fullUniverse && fullPatternAudit.population.generatedCount === 518400 && fullPatternAudit.population.uniqueCount === 518400 && fullPatternAudit.population.duplicateCount === 0 && fullPatternAudit.population.analysisPassCount === 518400 && fullPatternAudit.population.dimensionEvaluationCount === 518400, `full PAT-LV-DESIGN-v1 audit should cover all 518,400 structures exactly once, got ${JSON.stringify(fullPatternAudit.population)}`);
  assertAuditModel(fullPatternAudit.models.control, 518400);
  assertAuditModel(fullPatternAudit.models.candidate, 518400);
  assert(fullPatternAudit.causeOwnership.valid && fullPatternAudit.causeOwnership.evaluatedLedgers === 518400 && fullPatternAudit.causeOwnership.duplicateNumericOwnerCount === 0 && fullPatternAudit.causeOwnership.missingMetadataCount === 0 && fullPatternAudit.sensitivity.formulaResidualMax === 0 && migrationTotal(fullPatternAudit.sensitivity.candidateGradeMigration) === 518400 && migrationTotal(fullPatternAudit.sensitivity.finalGradeMigration) === 518400 && fullPatternAudit.sensitivity.structureIdentityChanges.mainPattern === 0 && fullPatternAudit.sensitivity.structureIdentityChanges.status === 0 && fullPatternAudit.hardGate.invalidIntervalCount === 0, `full audit should retain one numeric owner, one rule analysis, and complete migrations, got ${JSON.stringify({ cause: fullPatternAudit.causeOwnership, sensitivity: fullPatternAudit.sensitivity, gate: fullPatternAudit.hardGate })}`);
  const compactAuditGroup = (group) => group && ({ count: group.count, mainPatterns: group.mainPatterns, statuses: group.statuses, structureTypes: group.structureTypes, diseaseStates: group.diseaseStates, clarityLevels: group.clarityLevels });
  const compactAuditBoundaries = (boundaries) => Object.fromEntries(Object.entries(boundaries).map(([name, item]) => [name, { score: item.score, tieInterval: item.tieInterval, at: compactAuditGroup(item.at.group) }]));
  const compactAuditModel = (model) => ({ weights: model.weights, histogram: model.histogram, histogramSha256: model.histogramSha256, stats: model.stats, boundaries: compactAuditBoundaries(model.boundaries), extrema: { minimum: { score: model.extrema.minimum.score, group: compactAuditGroup(model.extrema.minimum.group) }, maximum: { score: model.extrema.maximum.score, group: compactAuditGroup(model.extrema.maximum.group) } }, candidateGradeCounts: model.candidateGradeCounts, candidateGradePercentages: model.candidateGradePercentages, finalGradeCounts: model.finalGradeCounts, finalGradePercentages: model.finalGradePercentages });
  const compactDelta = (delta) => ({ count: delta.count, min: delta.min, max: delta.max, mean: delta.mean, standardDeviation: delta.standardDeviation, skewness: delta.skewness });
  const sensitivitySummary = { candidateMinusControlFormula: fullPatternAudit.sensitivity.candidateMinusControlFormula, formulaResidualMax: fullPatternAudit.sensitivity.formulaResidualMax, unroundedDelta: compactDelta(fullPatternAudit.sensitivity.unroundedDelta), roundedScoreDelta: compactDelta(fullPatternAudit.sensitivity.roundedScoreDelta), activeV5ToDeduplicatedControlScoreDelta: compactDelta(fullPatternAudit.sensitivity.activeV5ToDeduplicatedControlScoreDelta), dimensionDistributions: fullPatternAudit.sensitivity.dimensionDistributions, dimensionToTotalPearson: fullPatternAudit.sensitivity.dimensionToTotalPearson, candidateGradeMigration: fullPatternAudit.sensitivity.candidateGradeMigration, finalGradeMigration: fullPatternAudit.sensitivity.finalGradeMigration, structureIdentityChanges: fullPatternAudit.sensitivity.structureIdentityChanges, flags: fullPatternAudit.sensitivity.flags };
  console.log(`PAT-LV-DESIGN-v1 report ${JSON.stringify({ version: fullPatternAudit.version, population: fullPatternAudit.population, versions: fullPatternAudit.versions, guardrails: fullPatternAudit.guardrails, causeOwnership: fullPatternAudit.causeOwnership, models: { candidate: compactAuditModel(fullPatternAudit.models.candidate), control: compactAuditModel(fullPatternAudit.models.control) }, sensitivity: sensitivitySummary, legacyComparator: fullPatternAudit.legacyComparator, hardGate: fullPatternAudit.hardGate, decision: fullPatternAudit.decision })}`);
}
assert(!referencePattern.mainPattern.includes('食神制杀'), 'a score cannot rescue the previously rejected strict food-control formation');
const referenceScoreText = '结构分：' + referencePattern.patternStructureScore.toFixed(1);
assert(scriptContext.patternLevelText(referenceBazi)===referencePattern.patternLevelGrade, 'the unused diagnostic helper retains the canonical internal grade');
assert(!scriptContext.patternLevelText(referenceBazi, true).includes('理论结构位置：') && !scriptContext.patternLevelText(referenceBazi, true).includes(referencePattern.patternPercentileText) && scriptContext.patternLevelText(referenceBazi, true).includes(referenceScoreText) && scriptContext.patternLevelText(referenceBazi, true).includes('评分维度：') && scriptContext.patternLevelText(referenceBazi, true).includes('ZP-SCORE-2026.07.15-v4'), 'technical level context must retain the canonical ledger without P position');
assert(referencePattern.natalPatternLevel.grade === referencePattern.patternLevelGrade && referencePattern.natalPatternLevel.scope === '原局结构固定结论' && referencePattern.realizationBoundary.localScope.length === 2 && referencePattern.realizationBoundary.text.includes('不代表人的价值'), `natal level and reality boundary should be explicit structured outputs, got ${JSON.stringify({ level: referencePattern.natalPatternLevel, boundary: referencePattern.realizationBoundary })}`);
const repeatedReferencePattern = scriptContext.BaziEngine.analyzePattern(referenceBazi);
assert(JSON.stringify({ grade: repeatedReferencePattern.patternLevelGrade, main: repeatedReferencePattern.mainPattern, disease: repeatedReferencePattern.patternDisease, useful: repeatedReferencePattern.useful }) === JSON.stringify({ grade: referencePattern.patternLevelGrade, main: referencePattern.mainPattern, disease: referencePattern.patternDisease, useful: referencePattern.useful }), 'the same pillars and rule version should return the same natal pattern result');
assert(scriptContext.buildPatternContextText(referenceBazi).includes('不承诺现实结果'), 'AI context should receive the same three-layer realization boundary as the page');
const killSealBazi = {
  person: '理论合成杀印病象样本',
  gender: '男',
  pillars: { year: '戊辰', month: '戊午', day: '辛卯', hour: '壬辰' },
  dayStem: '辛',
  dayElement: '金',
  time: { used: { year: 1988, month: 6, day: 5, hour: 0, minute: 0 }, input: { year: 1988, month: 6, day: 5, hour: 0, minute: 0 }, enabled: false, correction: 0, location: { name: '理论网格', lng: 120, lat: 30 } },
};
const killSealPattern = scriptContext.BaziEngine.analyzePattern(killSealBazi);
const clashedKillSeal = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '戊辰', month: '戊午', day: '辛卯', hour: '戊子' } });
assert(!clashedKillSeal.comboPatterns.includes('杀印相生格') && clashedKillSeal.comboClues.some(x => x.name === '杀印相生线索参考' && /冲/.test(x.text)), 'old kill-seal positive had its only killing root clashed; keep it as a negative and use a reachable positive separately');
assert(killSealPattern.primary.includes('七杀'), `month-command line should still be 七杀, got ${killSealPattern.primary}`);
assert(killSealPattern.comboPatterns.some((x) => x.includes('杀印相生')), `combo pattern should include 杀印相生, got ${killSealPattern.comboPatterns.join(',')}`);
assert(killSealPattern.useful.layers.pattern.use.includes('土'), 'kill-seal pattern should use resource/印 as pattern-use anchor');
assert(killSealPattern.patternLevel.includes('有力') && killSealPattern.patternLevel.includes('清纯'), 'pattern level should explain force, affection, purity, and rescue instead of grading by name alone');
assert(killSealPattern.factors.some((x) => x.text.includes('杀有印化')), `kill-seal chart should expose formation factor, got ${JSON.stringify(killSealPattern.factors)}`);
assert(killSealPattern.clarity.level === '较清' && killSealPattern.clarity.text.includes('杀印相生'), `kill-seal chart should expose clean structure, got ${JSON.stringify(killSealPattern.clarity)}`);
assert(killSealPattern.elementPhenomena.length === 1 && killSealPattern.elementPhenomena[0].name === '土厚埋金' && killSealPattern.elementPhenomena[0].status === '明显倾向', `earth-heavy weak metal should expose a bounded 土厚埋金 phenomenon, got ${JSON.stringify(killSealPattern.elementPhenomena)}`);
assert(killSealPattern.elementPhenomena[0].category === '五行气象与偏枯病象' && killSealPattern.elementPhenomena[0].termType === '五行气象与偏枯病象' && killSealPattern.elementPhenomena[0].sourceSystem === '结构诊断与校正层' && killSealPattern.elementPhenomena[0].target.role === '日主本体' && killSealPattern.elementPhenomena[0].ruleId === 'ZP-QX-001' && killSealPattern.elementPhenomena[0].ruleVersion === 'ZP-2026.11.07.1-review', `phenomenon should remain separate from the formal pattern and expose its type, object, source layer, rule, and version, got ${JSON.stringify(killSealPattern.elementPhenomena[0])}`);
assert(killSealPattern.elementPhenomena[0].evidence.some((x) => x.includes('土约占全局')) && killSealPattern.elementPhenomena[0].counterEvidence.length, 'phenomenon must expose quantitative evidence and retained counterevidence');
assert(killSealPattern.elementPhenomena[0].conclusion.includes('不作完全埋没论') && killSealPattern.elementPhenomena[0].behavior.includes('较可能') && killSealPattern.elementPhenomena[0].behavior.includes('不等同懒惰或嗜睡') && !killSealPattern.elementPhenomena[0].behavior.includes('一定'), `behavior outlet should remain probabilistic and non-medical, got ${JSON.stringify(killSealPattern.elementPhenomena[0])}`);
assert(killSealPattern.elementPhenomena[0].canonicalName === '土厚埋金' && killSealPattern.elementPhenomena[0].aliases.includes('土多埋金') && killSealPattern.elementPhenomena[0].severityRank === 2 && killSealPattern.elementPhenomena[0].severityBasis.includes('土势明显压过金') && killSealPattern.elementPhenomena[0].degreeBoundary.includes('未判为严重'), `phenomenon should expose canonical terminology and an attributable degree boundary, got ${JSON.stringify(killSealPattern.elementPhenomena[0])}`);
assert(killSealPattern.elementPhenomena[0].scope.includes('不作为正式命格') && killSealPattern.elementPhenomena[0].behaviorProfile.scene.includes('任务边界不清') && killSealPattern.elementPhenomena[0].behaviorProfile.counterCondition.includes('目标明确'), `phenomenon should expose scope and falsifiable behavior conditions, got ${JSON.stringify(killSealPattern.elementPhenomena[0])}`);
assert(scriptContext.BaziEngine.normalizePhenomenonName('土多埋金') === '土厚埋金' && scriptContext.BaziEngine.normalizePhenomenonName('金多土虚') === '金多土变', 'phenomenon aliases should normalize to one canonical term');
assert(killSealPattern.patternStructures.some((x) => x.name === '杀印相生格' && x.role === '主格' && x.status === '成而有瑕' && x.issues.includes('土厚埋金')), `buried-metal disease should retain kill-seal as main pattern while lowering its finish, got ${JSON.stringify(killSealPattern.patternStructures)}`);
const killSealStructure = scriptContext.renderStructure({ ...killSealBazi, scores: scriptContext.BaziEngine.scoreWuxing(killSealBazi.pillars), relations: [] });
assert(killSealStructure.includes('杀印相生格：成而有瑕')&&killSealStructure.includes('印土既有化杀功能')&&killSealStructure.includes('印土过重压住金的发挥'),'chart-specific copy retains seal function and earth obstruction in the same frozen verdict');
const killSealTraits=killSealStructure.match(/<dl class="pattern-reading is-traits">[\s\S]*?<\/dl>/)?.[0]||'';
assert(killSealTraits.includes('容易遇到贵人')&&killSealTraits.includes('遇事有贵人指点，也能把压力练成本事。')&&!killSealStructure.replace(killSealTraits,'').includes('容易遇到贵人'),'plain-language traits are shared without making them current-chart support');
const killSealPotentialDimension = killSealPattern.patternRawScoreBreakdown.dimensions.find((item) => item.key === 'potential');
assert(killSealPotentialDimension.components.length === 1 && killSealPotentialDimension.components[0].ruleId !== 'ZP-CG-02', `the synthetic kill-seal disease case must not acquire food-control potential from a hidden food clue, got ${JSON.stringify(killSealPotentialDimension)}`);
assert(killSealPattern.useful.primaryUse.join('、') === '金' && killSealPattern.useful.avoid.includes('土'), `excess seal-earth should stop being an incremental useful element, got ${JSON.stringify(killSealPattern.useful)}`);
assert(killSealPattern.useful.layers.pattern.why.includes('印土在格局中承担化杀功能') && killSealPattern.useful.layers.pattern.why.includes('不再把土列为增补用神'), `pattern-use should distinguish an existing seal function from further adding earth, got ${killSealPattern.useful.layers.pattern.why}`);
assert(killSealPattern.usePriority.type === '病药' && killSealPattern.usePriority.source === '气势病象' && killSealPattern.usePriority.conflicts.some((x) => x.element === '土' && x.decision === '不取'), `buried-metal disease should override ordinary pattern-use arbitration, got ${JSON.stringify(killSealPattern.usePriority)}`);
assert(killSealPattern.patternLevelGrade === '偏高' && killSealPattern.patternLevelHardGate.ceilingGrade === '偏高' && killSealPattern.patternLevelCriteria.some((x) => x.name === '气势病象' && x.result.includes('土厚埋金')), `buried-metal flaw should cap rather than repeatedly deduct the natal level, got ${JSON.stringify({ grade: killSealPattern.patternLevelGrade, gate: killSealPattern.patternLevelHardGate, criteria: killSealPattern.patternLevelCriteria })}`);
assert(killSealPattern.remedy.some((x) => x.title === '土厚埋金' && x.text.includes('土势过重')), `remedy should explain how an otherwise useful seal becomes excessive, got ${JSON.stringify(killSealPattern.remedy)}`);
assert(killSealPattern.clarity.text.includes('土厚埋金') && killSealPattern.clarity.text.includes('过量之土不再增'), `clarity should state the direct keep/remove conclusion, got ${JSON.stringify(killSealPattern.clarity)}`);
assert(killSealPattern.usePriority.text.includes('土厚埋金'), `kill-seal chart should expose phenomenon-first useful priority, got ${JSON.stringify(killSealPattern.usePriority)}`);
assert(killSealPattern.patternArbitration.mainPattern === '杀印相生格' && !killSealPattern.patternArbitration.candidates.some((x) => x.name === '食神制杀格'), `hidden food must remain a clue beside the formed kill-seal structure, got ${JSON.stringify(killSealPattern.patternArbitration)}`);
assert(killSealPattern.comboClues.some((x) => x.name === '食神制杀线索参考' && x.text.includes('食神未透且未得月令')) && killSealPattern.patternStructures.some((x) => x.name === '食神制杀线索参考' && x.role === '线索'), `theoretical kill-seal sample should retain food-control evidence only at clue level, got ${JSON.stringify(killSealPattern.patternStructures)}`);
assert(scriptContext.elementPhenomenonText(killSealBazi).includes('土厚埋金（明显倾向；程度：明显；置信：高）') && scriptContext.elementPhenomenonText(killSealBazi).includes('术语分类：五行气象与偏枯病象；常见异名：土多埋金') && scriptContext.elementPhenomenonText(killSealBazi).includes('程度依据：') && scriptContext.elementPhenomenonText(killSealBazi).includes('未判更重：') && scriptContext.elementPhenomenonText(killSealBazi).includes('相反条件：'), `structure view should render normalized terminology, degree evidence, boundary, and behavior conditions, got ${scriptContext.elementPhenomenonText(killSealBazi)}`);
assert(!scriptContext.elementPhenomenonText(killSealBazi).includes('ZP-QX-001'), 'visible phenomenon details should suppress internal rule ids');
assert(scriptContext.elementPhenomenonText(killSealBazi).includes('<details class="phenomenon-detail"><summary>完整判断依据</summary>'), 'structure view should collapse long phenomenon evidence instead of stretching the primary card');
const killSealPromptContext = scriptContext.buildPatternContextText(killSealBazi);
assert(killSealPromptContext.includes('气势病象：土厚埋金') && killSealPromptContext.includes('程度依据：') && killSealPromptContext.includes('反证：') && !killSealPromptContext.includes('ZP-QX-001') && !killSealPromptContext.includes('<details'), 'AI context should receive the structured phenomenon conclusion without rule ids or UI markup');
const secondaryAttackedRoot = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '戊戌', month: '己未', day: '辛未', hour: '戊戌' }, dayStem: '辛' });
assert(secondaryAttackedRoot.strengthScore.dimensions.roots.items.some(x => x.grade === '中气根' && x.usable && !x.attacks.includes('冲')) && !secondaryAttackedRoot.elementPhenomena.some(x => x.name === '土厚埋金'), 'secondary punishment/break must not erase a still-usable middle root and fabricate rootless burial');
const severeBuriedMetalPattern = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '戊辰', month: '戊午', day: '辛未', hour: '己丑' }, dayStem: '辛' });
assert(severeBuriedMetalPattern.elementPhenomena.some((x) => x.name === '土厚埋金' && x.status === '明确成立' && x.severity === '严重'), `an earth-dominant chart without usable metal roots or output should form severe 土厚埋金, got ${JSON.stringify(severeBuriedMetalPattern.elementPhenomena)}`);
assert(severeBuriedMetalPattern.elementPhenomena.some((x) => x.severityRank === 3 && x.degreeBoundary.includes('当前最高严重度')), `severe phenomena should expose the shared top-degree boundary, got ${JSON.stringify(severeBuriedMetalPattern.elementPhenomena)}`);
assert(!severeBuriedMetalPattern.useful.use.includes('水') && !severeBuriedMetalPattern.useful.use.includes('木') && severeBuriedMetalPattern.useful.avoid.includes('土'), 'severe buried metal must not invent an immediate water/wood outlet; independent peer risk may still qualify metal support');
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
  assert(phenomenon && phenomenon.ruleId === item.ruleId && phenomenon.ruleVersion === 'ZP-2026.11.07.1-review' && phenomenon.category === '五行气象与泄身反伤病象' && phenomenon.termType === '五行气象与偏枯病象' && phenomenon.status === '明确成立', `${item.name} should form only after the shared output-excess conditions are met and remain in the versioned phenomenon term layer, got ${JSON.stringify(result.elementPhenomena)}`);
  assert(phenomenon.target.role === '日主本体' && phenomenon.evidence.some((x) => x.includes('约占全局')) && phenomenon.counterEvidence.length, `${item.name} should expose its object, proportion evidence, and counterevidence, got ${JSON.stringify(phenomenon)}`);
  assert(phenomenon.severityRank === 3 && phenomenon.severityBasis && phenomenon.degreeBoundary.includes('当前最高严重度'), `${item.name} should use the shared severity scale and expose its basis, got ${JSON.stringify(phenomenon)}`);
  assert(phenomenon.behavior.includes('条件性行为倾向') && !phenomenon.behavior.includes('一定') && phenomenon.behaviorProfile.scene && phenomenon.behaviorProfile.observable && phenomenon.behaviorProfile.counterCondition, `${item.name} behavior should remain structured and conditional rather than deterministic, got ${JSON.stringify(phenomenon)}`);
  assert(item.primary.every((w) => result.useful.primaryUse.includes(w)) && result.useful.avoid.includes(item.avoid), `${item.name} should use the resource+self dual remedy and stop adding excessive output, got ${JSON.stringify(result.useful)}`);
  assert(result.usePriority.type === '病药' && result.usePriority.source === '气势病象' && result.usePriority.conflicts.some((x) => x.element === item.avoid && x.decision === '不取'), `${item.name} should override ordinary useful-element arbitration, got ${JSON.stringify(result.usePriority)}`);
  assert(result.remedy.some((x) => x.title === item.name && x.text.includes('先止泄身太过')) && result.clarity.text.includes(item.name), `${item.name} should feed the same conclusion into remedy and clarity, got ${JSON.stringify({ remedy: result.remedy, clarity: result.clarity })}`);
  assert(result.patternLevelCriteria.some((x) => x.name === '气势病象' && x.result.includes(item.name)), `${item.name} should enter attributable pattern-level criteria, got ${JSON.stringify(result.patternLevelCriteria)}`);
});
const resourceExcessCases = [
  { name: '木多火塞', ruleId: 'ZP-QX-002', pillars: { year: '甲寅', month: '乙卯', day: '丁酉', hour: '甲寅' }, primary: '火', avoid: '木', candidate: '金', reachable: false },
  { name: '火多土焦', ruleId: 'ZP-QX-003', pillars: { year: '丙午', month: '丁巳', day: '戊子', hour: '丙午' }, primary: '土', avoid: '火', candidate: '水', reachable: false },
  { name: '金多水浊', ruleId: 'ZP-QX-004', pillars: { year: '庚申', month: '辛酉', day: '壬午', hour: '庚申' }, primary: '水', avoid: '金', candidate: '火', reachable: true },
  { name: '水多木漂', ruleId: 'ZP-QX-005', pillars: { year: '壬子', month: '癸亥', day: '甲午', hour: '壬子' }, primary: '木', avoid: '水', candidate: '土', reachable: false },
];
const expectedPhenomenonNames = ['土厚埋金', '木多火塞', '火多土焦', '金多水浊', '水多木漂', '水多金沉', '木盛水缩', '火多木焚', '土多火晦', '金多土变'];
const coveredPhenomenonNames = [killSealPattern.elementPhenomena[0].name]
  .concat(resourceExcessCases.map((item) => item.name), outputExcessCases.map((item) => item.name));
assert(expectedPhenomenonNames.every((name) => coveredPhenomenonNames.includes(name)) && coveredPhenomenonNames.length === expectedPhenomenonNames.length, `phenomenon coverage should be rule-family based rather than tied to one discussed chart, got ${JSON.stringify(coveredPhenomenonNames)}`);
resourceExcessCases.forEach((item) => {
  const result = scriptContext.BaziEngine.analyzePattern({ pillars: item.pillars, dayStem: item.pillars.day[0] });
  const phenomenon = result.elementPhenomena.find((x) => x.name === item.name);
  assert(phenomenon && phenomenon.ruleId === item.ruleId && phenomenon.ruleVersion === 'ZP-2026.11.07.1-review' && phenomenon.category === '五行气象与生扶太过病象' && phenomenon.status === '明显倾向', `${item.name} should require excessive resource, a weakly rooted recipient, and a versioned strict rule, got ${JSON.stringify(result.elementPhenomena)}`);
  assert(phenomenon.causalChain.includes('生扶太过') && phenomenon.counterEvidence.length && phenomenon.scope.includes('不作为正式命格'), `${item.name} should expose its resource-excess cause, counterevidence, and non-pattern boundary, got ${JSON.stringify(phenomenon)}`);
  assert(result.useful.primaryUse.includes(item.primary) && result.useful.avoid.includes(item.avoid) && result.usePriority.text.includes('生扶太过'), `${item.name} should restore recipient capacity and stop adding excessive resource, got ${JSON.stringify(result.useful)}`);
  assert(result.remedy.some((x) => x.title === item.name && x.text.includes('生扶作用')) && result.clarity.text.includes(item.name), `${item.name} should feed one direct conclusion into remedy and clarity, got ${JSON.stringify({ remedy: result.remedy, clarity: result.clarity })}`);
  const review=result.useful.decision.routes.find(route=>route.resourceRestraint)?.resourceRestraint;
  assert(review?.element===item.candidate&&review.excess===item.avoid&&review.step.active===item.reachable&&review.source.includes('《滴天髓·反局》'), item.name+' must review the actual resource restraint and preserve whether it reaches');
  const note=withoutGodHighlight(scriptContext.caseAlternativeUseReading({useful:result.useful}));
  assert(note.includes(item.reachable?'午藏丁正财制辛正印':'本盘这条制约没有接上（根气受冲）')&&note.includes('《滴天髓·反局》'), item.name+' should display the applicable local evidence with its source');
});
const rootedFireWithWood = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '甲寅', month: '乙卯', day: '丁巳', hour: '甲寅' }, dayStem: '丁' });
assert(!rootedFireWithWood.elementPhenomena.some((x) => x.name === '木多火塞'), `wood should remain usable resource when fire has a direct main root, got ${JSON.stringify(rootedFireWithWood.elementPhenomena)}`);
assert(!rootedFireWithWood.useful.decision.routes.some(route=>route.resourceRestraint), 'ordinary resource support should not trigger a resource-excess restraint review');
assert(scriptContext.BaziEngine.normalizePhenomenonName('火炎土燥') === '火多土焦' && scriptContext.BaziEngine.normalizePhenomenonName('水泛木浮') === '水多木漂', 'resource-excess aliases should normalize to one canonical professional term');
const earthDimsFireBazi = { person: '土多火晦样本', gender: '男', pillars: outputExcessCases.find((x) => x.name === '土多火晦').pillars, dayStem: '丁', dayElement: '火', time: { used: { year: 1997, month: 1, day: 8, hour: 8, minute: 0 }, input: { year: 1997, month: 1, day: 8, hour: 8, minute: 0 }, enabled: false, correction: 0, location: { name: 'sample', lng: 120, lat: 30 } } };
assert(scriptContext.elementPhenomenonText(earthDimsFireBazi).includes('土多火晦（明确成立；程度：严重；置信：') && scriptContext.elementPhenomenonText(earthDimsFireBazi).includes('辰丑湿土') && scriptContext.elementPhenomenonText(earthDimsFireBazi).includes('火少火晦'), `土多火晦 view should expose wet-earth evidence and its authority boundary, got ${scriptContext.elementPhenomenonText(earthDimsFireBazi)}`);
assert(scriptContext.buildPatternContextText(earthDimsFireBazi).includes('气势病象：土多火晦') && !scriptContext.buildPatternContextText(earthDimsFireBazi).includes('ZP-QX-009'), 'AI context should receive the same 土多火晦 evidence without rule ids');
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
assert(foodKillRobbedPattern.monthCommand.baseGod === '比肩' && foodKillRobbedPattern.monthCommand.selectedGods.includes('食神') && foodKillRobbedPattern.patternArbitration.main.anchored, 'valid revealed food may change the month-command route, while the original 比肩 background stays available');
assert(foodKillRobbedPattern.useful.primaryUse.includes('火') && foodKillRobbedPattern.useful.conditionalUse.some(x => x.element === '土') && foodKillRobbedPattern.useful.decision.elements.find((x) => x.element === '土').riskEntries.some((x) => x.id === 'unconnected-pattern-remedy' && x.status === 'potential') && !foodKillRobbedPattern.useful.use.includes('水') && foodKillRobbedPattern.useful.layers.pattern.why.includes('枭夺食'), 'food-control should retain food; blocked wealth rescue must be conditional rather than an invented established remedy');
assert(foodKillRobbedPattern.interactionFlow.steps.some((x) => x.action === '制' && x.status === '作用可达') && foodKillRobbedPattern.interactionFlow.sequence.some((x) => x.name === '枭神夺食' && x.verdict), `food-control with owl damage should expose the reachable control chain and break/rescue order, got ${JSON.stringify(foodKillRobbedPattern.interactionFlow)}`);
assert(foodKillRobbedPattern.useful.specific.primary.some((x) => x.tenGods.includes('食神')) && foodKillRobbedPattern.useful.specific.avoid.some((x) => x.tenGods.includes('偏印') && !x.tenGods.includes('正印')), `specific useful roles should avoid only owl rather than every seal sharing its element, got ${JSON.stringify(foodKillRobbedPattern.useful.specific)}`);
assert(!scriptContext.publicUsefulRows(foodKillRobbedBazi).includes('具体十神：') && scriptContext.usefulPriorityText(foodKillRobbedBazi, true).includes('具体十神：') && scriptContext.usefulPriorityText(foodKillRobbedBazi, true).includes('偏印'), 'technical useful context should retain stem and exact ten-god decisions without crowding the page');
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
const weakCarrierFoodKillPattern = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '甲子', month: '戊辰', day: '壬申', hour: '甲辰' }, dayStem: '壬' });
assert(!weakCarrierFoodKillPattern.comboPatterns.includes('食神制杀格') && weakCarrierFoodKillPattern.comboClues.some((x) => x.name === '食神制杀线索参考' && x.text.includes('日主承泄任杀不足')), `clear food and killing still require day-master capacity, got ${JSON.stringify(weakCarrierFoodKillPattern.comboClues)}`);
const wealthDivertedFoodKillPattern = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '甲子', month: '丙寅', day: '壬申', hour: '戊申' }, dayStem: '壬' });
assert(!wealthDivertedFoodKillPattern.comboPatterns.includes('食神制杀格') && wealthDivertedFoodKillPattern.comboClues.some((x) => x.name === '食神制杀线索参考' && x.text.includes('财星承食生杀') && x.text.includes('贪生忘克')), `wealth that directly carries food into killing should block strict food-control formation, got ${JSON.stringify(wealthDivertedFoodKillPattern.comboClues)}`);
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
assert(financeOfficerSealPattern.patternStructures.some((x) => x.name === '财官印相生格' && x.role === '主格' && x.status === '成而有瑕' && x.ruleId === 'ZP-CG-05') && financeOfficerSealPattern.patternArbitration.main.netSettlement, 'reachable finance-officer-seal candidate must retain its net carrying defect, not claim pure formation');
assert(financeOfficerSealPattern.patternStructures.some((x) => x.name === '财官印相生格' && x.basis.includes('位置承接')), `formed finance-officer-seal chain should explain why its sequence is connected, got ${JSON.stringify(financeOfficerSealPattern.patternStructures)}`);
assert(financeOfficerSealPattern.patternArbitration.main && financeOfficerSealPattern.patternArbitration.main.anchored && financeOfficerSealPattern.patternArbitration.decision.includes('承接月令'), `month-anchored finance-officer-seal should outrank its regular wealth base with an explicit reason, got ${JSON.stringify(financeOfficerSealPattern.patternArbitration)}`);
assert(financeOfficerSealPattern.interactions.stemCombines.some((x) => x.pair === '甲己' && x.status === '日主合入'), `day-master combination should be distinguished from an ordinary binding combination, got ${JSON.stringify(financeOfficerSealPattern.interactions.stemCombines)}`);
assert(financeOfficerSealPattern.interactionFlow.steps.length === 3 && financeOfficerSealPattern.interactionFlow.steps.every(step => step.active) && financeOfficerSealPattern.interactionFlow.steps[2].to.includes('日主'), 'the full finance-officer-seal sequence must retain its actual return-to-day step; native day-master combine alone does not erase the recipient');
assert(scriptContext.interactionText(financeOfficerSealBazi).includes('干合：'), `structure view should render stem and branch interaction conclusions, got ${scriptContext.interactionText(financeOfficerSealBazi)}`);
assert(scriptContext.interactionText(financeOfficerSealBazi).includes('作用先后：') && scriptContext.interactionText(financeOfficerSealBazi).includes('财') && scriptContext.interactionText(financeOfficerSealBazi).includes('官'), `structure view should render the main-pattern action sequence, got ${scriptContext.interactionText(financeOfficerSealBazi)}`);
assert(financeOfficerSealPattern.useful.roles && financeOfficerSealPattern.useful.roles.monthCommandGod && financeOfficerSealPattern.useful.roles.patternGod && financeOfficerSealPattern.useful.roles.balanceGod && financeOfficerSealPattern.useful.roles.finalUseGod && financeOfficerSealPattern.useful.roles.avoidGod, 'useful strategy should separate month-command, pattern, balance, final-use, and avoid roles');
assert(financeOfficerSealPattern.useful.roles.monthCommandGod.tenGods.includes('正财'), `month-command useful role should retain the exact month god, got ${JSON.stringify(financeOfficerSealPattern.useful.roles.monthCommandGod)}`);
assert(['formed', 'power', 'affection', 'purity', 'rescue'].every((x) => Object.prototype.hasOwnProperty.call(financeOfficerSealPattern.patternLevelMetrics, x)), `pattern level should expose evidence dimensions, got ${JSON.stringify(financeOfficerSealPattern.patternLevelMetrics)}`);
assert(['月令用神（定格）', '格局用神', '相神', '扶抑喜用', '调候神', '最终主用', '忌神'].every((label) => scriptContext.usefulPriorityText(financeOfficerSealBazi, true).includes(label)), 'technical useful context should retain concept-safe role labels');
assert(financeOfficerSealPattern.useful.decision.routes.some(route => route.id === 'formed-pattern' && route.evidence.length) && financeOfficerSealPattern.useful.decision.primaryRouteIds.includes('seal-remedy'), 'an extant candidate route must be retained, but cannot outrank its unresolved carrying remedy just by name');
assert(scriptContext.usefulPriorityText(financeOfficerSealBazi, true).includes('财官印相生'), 'technical context must retain the candidate function even when its elements are not all selected for incremental use');
assert(!financeOfficerSealPattern.useful.roles.joyGod.elements.some((x) => financeOfficerSealPattern.useful.roles.enemyGod.elements.includes(x)), `the same element must not be both joy and enemy after arbitration, got ${JSON.stringify(financeOfficerSealPattern.useful.roles)}`);
const financeActors = financeOfficerSealPattern.useful.decision.routes.find(route => route.id === 'formed-pattern').actors;
assert(['正财','正官','正印'].every(god => financeActors.some(actor => actor.god === god)), 'actual finance/officer/seal actors must remain inspectable before element summarization, without forcing all three into recommended use');
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
  { label: '财格', pillars: { year: '甲子', month: '丙寅', day: '庚午', hour: '丙子' }, name: '偏财格' },
  { label: '官格', pillars: { year: '甲子', month: '丙寅', day: '己巳', hour: '甲子' }, name: '正官格' },
  { label: '印格', pillars: { year: '甲子', month: '丙寅', day: '丙寅', hour: '戊子' }, name: '偏印格' },
  { label: '食神格', pillars: { year: '甲子', month: '丙寅', day: '壬申', hour: '庚子' }, name: '食神格' },
  { label: '七杀格', pillars: { year: '甲子', month: '丙寅', day: '戊辰', hour: '壬子' }, name: '七杀格' },
  { label: '伤官格', pillars: { year: '甲子', month: '丙寅', day: '癸酉', hour: '壬子' }, name: '伤官格' },
  { label: '建禄格', pillars: { year: '甲子', month: '丙寅', day: '甲子', hour: '甲子' }, name: '建禄格' },
  { label: '月刃格', pillars: { year: '甲子', month: '丙寅', day: '乙丑', hour: '丙子' }, name: '月刃格' },
];
regularPatternCases.forEach((item) => {
  const result = scriptContext.BaziEngine.analyzePattern({ pillars: item.pillars, dayStem: item.pillars.day[0] });
  assert(result.regularPattern.name === item.name, `${item.label} should follow the month-command regular pattern, got ${result.regularPattern.name}`);
  assert(['已成','成而有瑕','待成','已破'].includes(result.regularPattern.status), `${item.label} must return a direct formation status from actual checks, not a pre-fix status label`);
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
const graveMeetingPattern = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '壬申', month: '甲辰', day: '甲子', hour: '壬申' }, dayStem: '甲' });
assert(graveMeetingPattern.interactions.groups.some(x => x.complete && x.active && x.element === '水') && graveMeetingPattern.monthCommand.status === '杂气取清' && graveMeetingPattern.monthCommand.groupStems.includes('癸') && graveMeetingPattern.monthCommand.primaryGod === '正印', `an effective completed grave-month meeting should select the matching hidden god, got ${JSON.stringify(graveMeetingPattern.monthCommand)}`);
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
assert(killSealCandidates.includes('主格：杀印相生格') && !killSealCandidates.includes('兼见：食神制杀格') && !killSealCandidates.includes('主次依据：'), `pattern candidate UI should keep hidden food at clue level instead of displaying a compatible formed pattern, got ${killSealCandidates}`);
assert(!killSealCandidates.includes('、'), `pattern candidate UI should show only the main pattern, got ${killSealCandidates}`);
assert(!killSealCandidates.includes('用神') && !killSealCandidates.includes('忌神'), 'pattern candidates should not repeat useful/avoid elements');
assert(scriptContext.specialPatternText(killSealPattern).includes('未见明显从格/化格'), 'normal chart should state no obvious follow/transform pattern');
assert(scriptContext.publicPatternLevel('偏低') === '偏低' && scriptContext.publicPatternLevel('中等') === '中等' && scriptContext.publicPatternLevel('偏高') === '偏高' && scriptContext.publicPatternLevel('高') === '高' && scriptContext.publicPatternLevel('顶级') === '顶级' && scriptContext.publicPatternLevel('中下') === '中等' && scriptContext.publicPatternLevel('中高') === '高', 'public level labels should expose the agreed five grades directly while retaining legacy-record compatibility');
assert(scriptContext.patternLevelText(killSealBazi)===killSealPattern.patternLevelGrade, 'the unused diagnostic helper retains the current internal grade');
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
assert(officerMixedPattern.useful.decision.routes.some((r) => r.id === 'seal-remedy' && r.applicable), 'mixed officer load must be assessed from actual disease and task evidence, not copied into a verified pattern-use layer');
assert(officerMixedPattern.factors.some((x) => x.text.includes('官杀并见')), `mixed official chart should expose break factor, got ${JSON.stringify(officerMixedPattern.factors)}`);
assert(officerMixedPattern.clarity.level === '浊' && officerMixedPattern.clarity.text.includes('官杀并见'), `mixed official chart should expose 清浊去留, got ${JSON.stringify(officerMixedPattern.clarity)}`);
assert(officerMixedPattern.useful.layers.tiaohou.priority === '主用' ? officerMixedPattern.useful.decision.primaryRouteIds.includes('climate') : officerMixedPattern.useful.arbitration.type === '病药' && officerMixedPattern.useful.decision.primaryRouteIds.includes('seal-remedy'), 'mixed officer load must preserve its remedy evidence while actual extreme climate can take priority; disease labels cannot mandate one route');
const hurtOfficerBazi = {
  person: '伤官见官样本',
  gender: '男',
  pillars: { year: '辛酉', month: '甲午', day: '甲辰', hour: '戊辰' },
  dayStem: '甲',
  dayElement: '木',
  time: { used: { year: 1993, month: 6, day: 1, hour: 8, minute: 0 }, input: { year: 1993, month: 6, day: 1, hour: 8, minute: 0 }, enabled: false, correction: 0, location: { name: 'sample', lng: 120, lat: 30 } },
};
const hurtOfficerPattern = scriptContext.BaziEngine.analyzePattern(hurtOfficerBazi);
assertLegalReviewPillars(hurtOfficerBazi.pillars); // 辛年午月为甲午；旧丙午既违五虎遁又把辛官合绊。
assert(hurtOfficerPattern.tenGodProfiles['正官'].revealed && hurtOfficerPattern.interactions.stemCombines.every(item => item.active === false || item.left !== 0 && item.right !== 0), 'the positive must actually retain its unbound revealed officer');
assert(hurtOfficerPattern.primary.includes('伤官'), `month-command line should be 伤官, got ${hurtOfficerPattern.primary}`);
assert(hurtOfficerPattern.patternIssues.some((x) => x.includes('伤官见官')), `hurt-officer chart should flag 伤官见官 as a primary issue, got ${JSON.stringify(hurtOfficerPattern.patternIssues)}`);
assert(hurtOfficerPattern.patternVerdict.includes('待制'), `hurt-officer verdict should require 制化, got ${hurtOfficerPattern.patternVerdict}`);
assert(hurtOfficerPattern.remedy.some((x) => x.text.includes('印制伤') || x.text.includes('财星通关')), `hurt-officer chart should expose 病药通关, got ${JSON.stringify(hurtOfficerPattern.remedy)}`);
const noClearRescuePattern = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '辛酉', month: '丁午', day: '甲寅', hour: '丙戌' }, dayStem: '甲' });
// 合法且独立满足根透、印制伤及印回生日主的正例；旧壬子例承载仍不足，不能称全解。
const injurySealPositiveBazi = { pillars: { year: '庚申', month: '己卯', day: '壬子', hour: '辛亥' }, dayStem: '壬' };
assertLegalReviewPillars(injurySealPositiveBazi.pillars);
const clearSealRescuePattern = scriptContext.BaziEngine.analyzePattern(injurySealPositiveBazi);
assert(clearSealRescuePattern.patternDisease.residualSeverity < noClearRescuePattern.patternDisease.residualSeverity && clearSealRescuePattern.patternLevelIndex >= noClearRescuePattern.patternLevelIndex, `adding a clear matching seal rescue should reduce residual disease and must not lower natal level, got ${JSON.stringify({ before: { level: noClearRescuePattern.patternLevelGrade, disease: noClearRescuePattern.patternDisease }, after: { level: clearSealRescuePattern.patternLevelGrade, disease: clearSealRescuePattern.patternDisease } })}`);
const noDiseaseScorePattern = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '戊申', month: '丁午', day: '辛酉', hour: '壬辰' }, dayStem: '辛' });
const scoreDimension = (result, key) => result.patternRawScoreBreakdown.dimensions.find((item) => item.key === key);
const traceablePotentialSource = (item) => item && /^ZP-(?:MG|CG|SP)-/.test(item.ruleId || '') && typeof item.pattern === 'string' && item.pattern.length > 0 && typeof item.tier === 'string' && item.tier.length > 0 && typeof item.sourceSystem === 'string' && item.sourceSystem.length > 0 && Array.isArray(item.source) && item.source.length > 0;
assert(scoreDimension(noDiseaseScorePattern, 'remedy').score === 80 && scoreDimension(clearSealRescuePattern, 'remedy').score === 80 && scoreDimension(noClearRescuePattern, 'remedy').score === 25, `no disease and fully solved disease should share the same remedy score while unresolved disease remains lower, got ${JSON.stringify({ none: scoreDimension(noDiseaseScorePattern, 'remedy'), solved: scoreDimension(clearSealRescuePattern, 'remedy'), unresolved: scoreDimension(noClearRescuePattern, 'remedy') })}`);
assert(scoreDimension(clearSealRescuePattern, 'clarity').score >= 50 && (scoreDimension(clearSealRescuePattern, 'clarity').evidence.includes('已由病药维度结算') || /^(清|较清)$/.test(clearSealRescuePattern.clarity.level)), `a disease-owned clarity defect should not be deducted twice across clarity and remedy dimensions, got ${JSON.stringify(scoreDimension(clearSealRescuePattern, 'clarity'))}`);
const strictInjurySealPattern = scriptContext.BaziEngine.analyzePattern(injurySealPositiveBazi);
assert(strictInjurySealPattern.mainPattern === '伤官配印格' && strictInjurySealPattern.patternStructures.some((x) => x.role === '主格' && x.status === '已成'), `only an established month-command injury-seal structure should qualify for the quality floor, got ${JSON.stringify(strictInjurySealPattern.patternStructures)}`);
assert(strictInjurySealPattern.interactionFlow.steps.every((x) => x.active) && /^(清|较清)$/.test(strictInjurySealPattern.clarity.level) && strictInjurySealPattern.comboConflicts.every((x) => x.name === '未见明显组合冲突'), `strict injury-seal quality should dynamically become clear after an active 印制伤 link passes and no direct breaker remains, got ${JSON.stringify({ flow: strictInjurySealPattern.interactionFlow, clarity: strictInjurySealPattern.clarity, conflicts: strictInjurySealPattern.comboConflicts })}`);
const strictInjuryPotential = scoreDimension(strictInjurySealPattern, 'potential');
assert(strictInjuryPotential.score >= 95 && strictInjuryPotential.components.length === 1 && strictInjurySealPattern.patternRawScoreBreakdown.ledger.filter((item) => item.dimension === 'potential').length === 1 && traceablePotentialSource(strictInjuryPotential.components[0]) && strictInjuryPotential.components[0].ruleId === 'ZP-CG-03' && strictInjuryPotential.components[0].pattern === strictInjurySealPattern.mainPattern && strictInjuryPotential.components[0].tier === 'S', `strict injury-seal should receive one traceable high classical-potential component from its validated main pattern, got ${JSON.stringify(strictInjuryPotential)}`);
const stackedInjuryAnalysis = JSON.parse(JSON.stringify(strictInjurySealPattern));
stackedInjuryAnalysis.patternStructures.push({ name: '食神生财格', ruleId: 'ZP-CG-09', ruleVersion: strictInjurySealPattern.analysisMeta.ruleVersion, role: '兼格', status: '已成', basis: 'synthetic non-main structure used only to verify non-stacking', conflicts: [] });
const stackedInjuryScore = scriptContext.BaziEngine.patternStructureRawScore(stackedInjuryAnalysis);
assert(stackedInjuryScore.dimensions.find((x) => x.key === 'potential').score === strictInjuryPotential.score && stackedInjuryScore.dimensions.find((x) => x.key === 'potential').components.length === 1, `only the arbitrated main pattern may contribute classical potential; compatible secondary names must not stack, got ${JSON.stringify(stackedInjuryScore.dimensions.find((x) => x.key === 'potential'))}`);
assert(scoreDimension(strictInjurySealPattern, 'formation').score >= 85 && strictInjurySealPattern.patternLevelQualityFloor === '' && strictInjurySealPattern.patternLevelHardGate.floorGrade === '偏低' && strictInjurySealPattern.patternLevelHardGate.topEligible && strictInjurySealPattern.patternLevelHardGate.ceilingGrade === '顶级' && strictInjurySealPattern.patternLevelCriteria.some((x) => x.name === '伤官配印严检' && x.met) && strictInjurySealPattern.patternLevelTieBreak.tier === 2, `a strictly formed, dynamically clear injury-seal structure should obtain high classical potential and top eligibility without receiving a second noble-pattern floor, got ${JSON.stringify({ potential: strictInjuryPotential, floor: strictInjurySealPattern.patternLevelQualityFloor, grade: strictInjurySealPattern.patternLevelGrade, gate: strictInjurySealPattern.patternLevelHardGate, tieBreak: strictInjurySealPattern.patternLevelTieBreak, criteria: strictInjurySealPattern.patternLevelCriteria })}`);
const deduplicatedStrictInjuryScore = scriptContext.BaziEngine.patternStructureRawScore(strictInjurySealPattern, { weights: auditControlWeights, deduplicateCauses: true, auditOnly: true });
validateCauseOwnership(deduplicatedStrictInjuryScore);
const deduplicatedStrictInjuryClarity = deduplicatedStrictInjuryScore.dimensions.find((item) => item.key === 'clarity');
assert(deduplicatedStrictInjuryClarity.score === 65 && deduplicatedStrictInjuryClarity.components.some((item) => item.counted && item.causeId.startsWith('clarity:base:injury-seal-purity')) && ['formation','flow','remedy'].every((owner) => deduplicatedStrictInjuryClarity.components.some((item) => item.numericOwner === owner && item.share === 0 && !item.counted)), `strict injury-seal purity derived from formation, flow, and residual disease should keep only an independent clarity base score, got ${JSON.stringify(deduplicatedStrictInjuryClarity)}`);
const rootlessKillingOldPositive = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '甲子', month: '丙寅', day: '甲子', hour: '庚午' } });
assert(!scriptContext.__patternReview.rooted(rootlessKillingOldPositive.tenGodProfiles, '七杀') && !rootlessKillingOldPositive.comboPatterns.includes('食神制杀格'), 'old positive had only visible 庚 and no metal root; preserve it as a root counterexample');
const strictFoodKillingPillars = { year: '甲子', month: '戊辰', day: '壬申', hour: '壬寅' };
assertLegalReviewPillars(strictFoodKillingPillars);
const strictFoodKillingPattern = scriptContext.BaziEngine.analyzePattern({ pillars: strictFoodKillingPillars });
assert(strictFoodKillingPattern.tenGodProfiles['食神'].revealed && strictFoodKillingPattern.tenGodProfiles['七杀'].revealed && scriptContext.__patternReview.rooted(strictFoodKillingPattern.tenGodProfiles, '食神') && scriptContext.__patternReview.rooted(strictFoodKillingPattern.tenGodProfiles, '七杀') && strictFoodKillingPattern.carryingCapacity.canCarryOutputKill, 'new positive must independently retain clear rooted food/killing and carrying evidence');
const removedKillingRoots = JSON.parse(JSON.stringify(strictFoodKillingPattern.tenGodProfiles));
['正官','七杀'].forEach(god => { if (removedKillingRoots[god]) removedKillingRoots[god].branchEntries = []; });
assert(scriptContext.__patternReview.qualify({details:[{name:'食神制杀格'}],clues:[]},removedKillingRoots,strictFoodKillingPattern.interactions).formed.length === 0, 'operator counterexample: removing only the killing root evidence must reject strict qualification despite unchanged revealed actors and interactions');
const deduplicatedStrictFoodKillingScore = scriptContext.BaziEngine.patternStructureRawScore(strictFoodKillingPattern, { weights: auditControlWeights, deduplicateCauses: true, auditOnly: true });
const deduplicatedStrictFoodKillingClarity = deduplicatedStrictFoodKillingScore.dimensions.find((item) => item.key === 'clarity');
validateCauseOwnership(deduplicatedStrictFoodKillingScore);
assert(strictFoodKillingPattern.mainPattern === '食神制杀格' && strictFoodKillingPattern.structuralClarity.causeGroup === 'food-killing-purity' && strictFoodKillingPattern.structuralClarity.level === '较清' && deduplicatedStrictFoodKillingClarity.score === 65 && deduplicatedStrictFoodKillingClarity.components.some((item) => item.counted && item.causeId.startsWith('clarity:base:food-killing-purity')), `strict food-killing should remove the same formation/flow/remedy-derived clarity increment, got ${JSON.stringify({ pattern: strictFoodKillingPattern.structuralClarity, score: deduplicatedStrictFoodKillingClarity })}`);
assert(['有力', '有情', '源流贯通', '制化得宜', '去留得宜'].every((term) => strictInjurySealPattern.clarityConclusion.terms.includes(term)) && scriptContext.patternClarityText(injurySealPositiveBazi).includes('专业判断：'), `clarity should expose direct professional conclusions instead of only generic advice, got ${JSON.stringify(strictInjurySealPattern.clarityConclusion)}`);
// 甲子年壬申月、庚日乙酉时；壬食/甲财各根透，食生财实际可达，承泄任财均通过。
const strictFoodWealthBazi = { pillars: { year: '甲子', month: '壬申', day: '庚寅', hour: '乙酉' }, dayStem: '庚' };
assertLegalReviewPillars(strictFoodWealthBazi.pillars);
const strictFoodWealthPattern = scriptContext.BaziEngine.analyzePattern(strictFoodWealthBazi);
assert(strictFoodWealthPattern.mainPattern === '食神生财格' && strictFoodWealthPattern.patternStructures.some((x) => x.name === '食神生财格' && x.ruleId === 'ZP-CG-09' && x.status === '已成'), `rooted daymaster, clear food, and reachable wealth should form 食神生财, got ${JSON.stringify(strictFoodWealthPattern.patternStructures)}`);
assert(strictFoodWealthPattern.interactionFlow.steps.some((x) => x.from.includes('食神') && x.to.some((god) => god.includes('财')) && x.action === '生'), `食神生财 should expose a food-to-wealth action chain, got ${JSON.stringify(strictFoodWealthPattern.interactionFlow)}`);
const strictFoodWealthPotential = scoreDimension(strictFoodWealthPattern, 'potential');
assert(strictFoodWealthPotential.score >= 90 && strictFoodWealthPotential.components.length === 1 && traceablePotentialSource(strictFoodWealthPotential.components[0]) && strictFoodWealthPotential.components[0].ruleId === 'ZP-CG-09' && strictFoodWealthPotential.components[0].pattern === strictFoodWealthPattern.mainPattern && strictFoodWealthPotential.components[0].tier === 'S' && strictFoodWealthPattern.patternLevelTieBreak.tier === 2 && strictFoodWealthPattern.patternLevelCriteria.some((x) => x.name === '严格成格组合' && x.met), `strict 食神生财 should join the traceable high-quality combination tier, got ${JSON.stringify({ potential: strictFoodWealthPotential, tieBreak: strictFoodWealthPattern.patternLevelTieBreak, criteria: strictFoodWealthPattern.patternLevelCriteria })}`);
assert(strictFoodWealthPattern.patternDisease.items.every((x) => x.status === '已解') && !strictFoodWealthPattern.patternLevelHardGate.reasons.some((x) => x.includes('清浊未定') || x.includes('冲战明显')) && ['高','顶级'].includes(strictFoodWealthPattern.patternLevelHardGate.ceilingGrade), `absent or solved diseases must not cap food-wealth through same-cause clarity, got ${JSON.stringify({ clarity: strictFoodWealthPattern.clarity, disease: strictFoodWealthPattern.patternDisease, gate: strictFoodWealthPattern.patternLevelHardGate })}`);
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
  assert(positive && positive.status === '明确成立' && positive.evidence.length === 3 && positive.boundary && positive.ruleVersion === 'ZP-2026.11.07.1-review', `${item.name} should require season, visibility, roots, balance, and a stated counter-boundary, got ${JSON.stringify(result.positivePhenomena)}`);
  assert(scriptContext.positivePhenomenonText(bazi).includes(item.name) && scriptContext.positivePhenomenonText(bazi).includes('成立边界与来源') && scriptContext.positivePhenomenonContextText(bazi).includes(item.name) && !scriptContext.positivePhenomenonContextText(bazi).includes('<details'), `${item.name} should reach both the concise page card and complete AI context`);
  assert(!scriptContext.positivePhenomenonText(bazi).includes('ZP-ZX-'), 'visible positive-phenomenon details should suppress internal rule ids');
});
const strictKillSealPattern = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '戊申', month: '丁午', day: '辛酉', hour: '壬辰' }, dayStem: '辛' });
assert(strictKillSealPattern.mainPattern === '杀印相生格' && strictKillSealPattern.patternLevelTieBreak.tier === 2 && strictKillSealPattern.patternLevelTieBreak.label === '严格成格组合', `a clean kill-seal structure should share the strict-combination tie tier instead of relying on a hard-coded name rank, got ${JSON.stringify(strictKillSealPattern.patternLevelTieBreak)}`);
for (const technical of [false, true]) {
  const cleanVerdict = scriptContext.patternConclusionText({ patternAnalysis: strictKillSealPattern }, technical);
  assert(cleanVerdict.includes(technical?'杀印相生格：已成':'主要配合已经接通') && !cleanVerdict.includes('土厚埋金'), 'a clean kill-seal chart must not inherit the buried-metal caveat');
}
assert(strictKillSealPattern.patternLevelQualityFloor === '' && strictKillSealPattern.patternLevelHardGate.floorGrade === '偏低' && strictKillSealPattern.patternLevelHardGate.topEligible && strictKillSealPattern.patternLevelGrade === '顶级' && strictKillSealPattern.patternLevelCriteria.some((x) => x.name === '严格成格组合' && x.met) && strictKillSealPattern.patternLevelCriteria.some((x) => x.name === '同分优先级' && x.result.includes('严格成格组合')), `strict kill-seal should reach top grade only after its direct score and strict top gates pass, without a second noble-pattern floor, got ${JSON.stringify({ floor: strictKillSealPattern.patternLevelQualityFloor, grade: strictKillSealPattern.patternLevelGrade, gate: strictKillSealPattern.patternLevelHardGate, criteria: strictKillSealPattern.patternLevelCriteria })}`);
const strictBladeKillBazi = { pillars: { year: '甲子', month: '丙子', day: '壬子', hour: '戊申' }, dayStem: '壬' };
assertLegalReviewPillars(strictBladeKillBazi.pillars);
const strictBladeKillPattern = scriptContext.BaziEngine.analyzePattern(strictBladeKillBazi);
assert(strictBladeKillPattern.regularPattern.name === '月刃格' && strictBladeKillPattern.mainPattern === '羊刃驾杀格' && strictBladeKillPattern.patternStructures.some((x) => x.name === '羊刃驾杀格' && x.role === '主格' && x.ruleId === 'ZP-CG-08'), `only a strong month-blade chart with clear reachable seven-killing should form 羊刃驾杀, got ${JSON.stringify(strictBladeKillPattern.patternStructures)}`);
assert(strictBladeKillPattern.interactionFlow.steps.some((x) => x.from.includes('七杀') && x.to.includes('劫财') && x.action === '制' && x.active) && strictBladeKillPattern.clarity.level === '较清' && strictBladeKillPattern.patternLevelTieBreak.tier === 2 && strictBladeKillPattern.patternLevelQualityFloor === '' && strictBladeKillPattern.patternLevelHardGate.floorGrade === '偏低', `羊刃驾杀 should require a reachable 杀制刃 chain while its high potential is counted once rather than repeated through a quality floor, got ${JSON.stringify({ flow: strictBladeKillPattern.interactionFlow, clarity: strictBladeKillPattern.clarity, tieBreak: strictBladeKillPattern.patternLevelTieBreak, floor: strictBladeKillPattern.patternLevelQualityFloor })}`);
assert(strictBladeKillPattern.useful.decision.routes.some(x => x.id === 'formed-pattern' && x.actors.some(a => a.god === '七杀')) && strictBladeKillPattern.clarityConclusion.conclusion.includes('已成') && scriptContext.patternClarityText(strictBladeKillBazi).includes('作用：') && !scriptContext.patternClarityText(strictBladeKillBazi).includes('受阻：未见') && !scriptContext.patternClarityText(strictBladeKillBazi).includes('救应：未见'), 'formed blade must retain its actual killing actor; an independently qualified extreme climate route need not rank it as the default primary');
const unformedBladeKillPillars = { year: '甲子', month: '丙子', day: '壬子', hour: '甲辰' };
assertLegalReviewPillars(unformedBladeKillPillars);
const unformedBladeKillPattern = scriptContext.BaziEngine.analyzePattern({ pillars: unformedBladeKillPillars });
assert(unformedBladeKillPattern.mainPattern !== '羊刃驾杀格' && unformedBladeKillPattern.comboClues.some((x) => x.name === '羊刃驾杀线索参考' && x.text.includes('七杀未透') && x.ruleId === 'ZP-CG-08'), `hidden killing or an active food-control route must leave 羊刃驾杀 as a clue, got ${JSON.stringify(unformedBladeKillPattern.comboClues)}`);
const wealthDamagePositiveBazi = { pillars: { year: '甲子', month: '丙寅', day: '癸酉', hour: '庚申' }, dayStem: '癸' };
assertLegalReviewPillars(wealthDamagePositiveBazi.pillars);
const wealthDamagesInjurySeal = scriptContext.BaziEngine.analyzePattern(wealthDamagePositiveBazi);
assert(!wealthDamagesInjurySeal.natalNoblePattern, 'wealth damaging the required seal must block the noble badge');
assert(wealthDamagesInjurySeal.comboConflicts.some((x) => x.name === '财坏印') && wealthDamagesInjurySeal.patternLevelQualityFloor === '' && wealthDamagesInjurySeal.patternLevelTieBreak.tier < 2 && wealthDamagesInjurySeal.patternLevelCriteria.some((x) => x.name === '伤官配印严检' && !x.met), `wealth damaging the seal must remove the injury-seal quality floor and strict-combination priority rather than treating every 伤官见印 as a贵格, got ${JSON.stringify({ conflicts: wealthDamagesInjurySeal.comboConflicts, floor: wealthDamagesInjurySeal.patternLevelQualityFloor, tieBreak: wealthDamagesInjurySeal.patternLevelTieBreak, criteria: wealthDamagesInjurySeal.patternLevelCriteria })}`);
assert(wealthDamagesInjurySeal.patternLevelIndex <= strictInjurySealPattern.patternLevelIndex, `adding a direct wealth-damages-seal breaker must not improve the natal level, got clean ${strictInjurySealPattern.patternLevelGrade} vs damaged ${wealthDamagesInjurySeal.patternLevelGrade}`);
assert(scoreDimension(wealthDamagesInjurySeal, 'potential').score < strictInjuryPotential.score && !scoreDimension(wealthDamagesInjurySeal, 'potential').components.some((x) => x.ruleId === 'ZP-CG-03') && !wealthDamagesInjurySeal.patternLevelHardGate.topEligible, `财坏印 must block the validated 伤官配印 potential instead of preserving a name-based noble bonus, got ${JSON.stringify({ potential: scoreDimension(wealthDamagesInjurySeal, 'potential'), gate: wealthDamagesInjurySeal.patternLevelHardGate })}`);
assert(scriptContext.comboConflictText(wealthDamagePositiveBazi).includes('贪财坏印（又称财坏印）'), 'the page should expose the mainstream professional name 贪财坏印 while preserving its normalized alias');
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
assert(wealthWeakPattern.useful.decision.routes.some((r) => r.id === 'seal-remedy' && r.applicable) && wealthWeakPattern.useful.layers.fuyi.use.length > 0, 'wealth-heavy weakness must retain actual carrying-remedy and balance evidence without claiming a formed pattern');
assert(wealthWeakPattern.remedy.some((x) => x.text.includes('印比扶身')), `wealth-heavy weak chart should expose 印比扶身 remedy, got ${JSON.stringify(wealthWeakPattern.remedy)}`);
const wealthWeakNatalSnapshot = JSON.stringify({ grade: wealthWeakPattern.patternLevelGrade, index: wealthWeakPattern.patternLevelIndex, main: wealthWeakPattern.mainPattern, disease: wealthWeakPattern.patternDisease });
const helpfulLuckImpact = scriptContext.BaziEngine.evaluateLuckImpact(wealthWeakBazi.dayStem, '壬寅', wealthWeakPattern);
const harmfulLuckImpact = scriptContext.BaziEngine.evaluateLuckImpact(wealthWeakBazi.dayStem, '丙辰', wealthWeakPattern);
assert(JSON.stringify({ grade: wealthWeakPattern.patternLevelGrade, index: wealthWeakPattern.patternLevelIndex, main: wealthWeakPattern.mainPattern, disease: wealthWeakPattern.patternDisease }) === wealthWeakNatalSnapshot, 'evaluating helpful or harmful luck must not mutate the natal pattern level');
assert(helpfulLuckImpact.natalGrade === wealthWeakPattern.patternLevelGrade && helpfulLuckImpact.scope.includes('不改写原局') && !helpfulLuckImpact.conditionReview.strictFormation, 'luck review preserves natal grade and cannot promise formation from favorable elements');
assert(helpfulLuckImpact.action === '维持' && helpfulLuckImpact.score === 0 && helpfulLuckImpact.scoreLedger.numericOwner === '未确认结构变化' && !helpfulLuckImpact.scoreLedger.elementCounted && helpfulLuckImpact.text.includes('当前大运壬寅'), 'two favorable elements without changed capacity or residual disease cannot raise the current grade');
assert(harmfulLuckImpact.action === '下降' && harmfulLuckImpact.text.includes('当前大运丙辰'), `食财 current luck should lower a wealth-heavy weak chart, got ${JSON.stringify(harmfulLuckImpact)}`);
assert(helpfulLuckImpact.fromStatus === helpfulLuckImpact.toStatus && helpfulLuckImpact.conditionReview.diseaseChanges.residualBefore === helpfulLuckImpact.conditionReview.diseaseChanges.residualAfter, 'unchanged residual disease must not fabricate a formation-status transition');
assert(harmfulLuckImpact.fromStatus === '已破' && harmfulLuckImpact.toStatus === '已破' && harmfulLuckImpact.text.includes('格局状态维持已破'), `a harmful current luck should retain a direct failed status when the natal pattern is already broken, got ${JSON.stringify(harmfulLuckImpact)}`);
assert(helpfulLuckImpact.conditionReview.regularPattern.checks.some((x) => x.label.includes('身能任财') && !x.active) && helpfulLuckImpact.conditionReview.patternDisease.partial.some((x) => x.family === '承载不足') && helpfulLuckImpact.toMain === helpfulLuckImpact.fromMain && helpfulLuckImpact.toStatus === '已破', 'a seal/root whose complete feedback still fails carrying remains an unformed wealth pattern, not an automatic improvement');
assert(!harmfulLuckImpact.conditionReview.formedAdded.includes('食神制杀格') && harmfulLuckImpact.conditionReview.effectiveAdded.length === 0 && harmfulLuckImpact.toMain === harmfulLuckImpact.fromMain, `luck must not promote a food-control structure that still fails the strict natal gates, got ${JSON.stringify(harmfulLuckImpact)}`);
const halfWaterPattern = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '庚申', month: '壬子', day: '甲午', hour: '戊戌' }, dayStem: '甲' });
const completedWaterLuck = scriptContext.BaziEngine.evaluateLuckImpact('甲', '壬辰', halfWaterPattern);
assert(completedWaterLuck.text.includes('补成三合水局') && completedWaterLuck.conditionReview.interactions.groups.some((x) => x.name === '三合水局' && x.active && x.challenged && x.status === '成局有瑕'), `current luck should explain a completed but externally clashed harmony group without calling it pure, got ${JSON.stringify(completedWaterLuck)}`);

const fifthPillarCombineBazi = { pillars: { year: '辛酉', month: '己丑', day: '丙申', hour: '乙未' }, dayStem: '丙' };
const fifthPillarCombinePattern = scriptContext.BaziEngine.analyzePattern(fifthPillarCombineBazi);
const fifthPillarCombineImpact = scriptContext.BaziEngine.evaluateLuckImpact('丙', '庚辰', fifthPillarCombinePattern);
const fifthPillarCombineReview = fifthPillarCombineImpact.conditionReview;
assert(fifthPillarCombineReview.ruleVersion === 'ZP-LUCK-2026.11.07-v2-review' && fifthPillarCombineReview.currentPillars.luck === '庚辰' && fifthPillarCombineReview.interactions.dynamicPosition === 4 && JSON.stringify(fifthPillarCombineReview.interactions.pillarKeys) === JSON.stringify(['year', 'month', 'day', 'hour', 'luck']), `PAT-202 should expose one ordered five-pillar review context, got ${JSON.stringify(fifthPillarCombineReview.interactions)}`);
assert(fifthPillarCombineReview.interactions.stemCombines.some((x) => x.pair === '乙庚' && x.left === 3 && x.right === 4 && x.involvesLuck && x.effect === 'transform' && x.target === '金') && fifthPillarCombineReview.interactions.branchPairs.some((x) => x.type === '六合' && x.left === 0 && x.right === 4 && x.involvesLuck && x.effect === 'transform' && x.target === '金'), `luck stem and branch must participate in the same combine/transformation arbitration as the natal pillars, got ${JSON.stringify(fifthPillarCombineReview.interactions)}`);

const transformedLuckSealBazi = { pillars: { year: '戊午', month: '丙午', day: '甲子', hour: '丁巳' }, dayStem: '甲' };
const transformedLuckSealImpact = scriptContext.BaziEngine.evaluateLuckImpact('甲', '癸酉', scriptContext.BaziEngine.analyzePattern(transformedLuckSealBazi));
const transformedLuckSealReview = transformedLuckSealImpact.conditionReview;
const transformedLuckStemPart = transformedLuckSealReview.strengthScore.parts.find((x) => x.label === '运干');
const transformedSealEntry = transformedLuckSealReview.profiles.正印 && transformedLuckSealReview.profiles.正印.stemEntries.find((x) => x.pillar === 'luck');
const transformedNatalWealthEntry = transformedLuckSealReview.profiles.偏财 && transformedLuckSealReview.profiles.偏财.stemEntries.find((x) => x.pillar === 'year');
assert(transformedLuckSealReview.interactions.stemCombines.some((x) => x.pair === '戊癸' && x.effect === 'transform' && x.target === '火' && x.involvesLuck) && transformedLuckStemPart.stemChange.effect === 'transform' && transformedLuckStemPart.stemChange.target === '火' && transformedLuckStemPart.originalRatio === 0.85 && transformedLuckStemPart.score === 0 && transformedSealEntry && !transformedSealEntry.usable && transformedNatalWealthEntry && !transformedNatalWealthEntry.usable && transformedLuckSealReview.profiles.正印.revealed === 0 && transformedLuckSealReview.profiles.偏财.revealed === 0 && transformedLuckSealReview.scores.水 < transformedLuckSealReview.rawScores.水 && transformedLuckSealReview.scores.土 < transformedLuckSealReview.rawScores.土 && transformedLuckSealReview.scores.火 > transformedLuckSealReview.rawScores.火, `both sides of a luck-triggered stem transformation must stop acting as their original revealed ten gods and must feed the effective element ledger, got ${JSON.stringify({ part: transformedLuckStemPart, seal: transformedLuckSealReview.profiles.正印, wealth: transformedLuckSealReview.profiles.偏财, raw: transformedLuckSealReview.rawScores, effective: transformedLuckSealReview.scores })}`);

const boundVisibleStemBazi = { pillars: { year: '甲寅', month: '丙寅', day: '丙午', hour: '丁巳' }, dayStem: '丙' };
const boundVisibleStemPattern = scriptContext.BaziEngine.analyzePattern(boundVisibleStemBazi);
const boundVisibleStemSnapshot = JSON.stringify(boundVisibleStemPattern);
const boundVisibleStemReview = scriptContext.BaziEngine.evaluateLuckImpact('丙', '己丑', boundVisibleStemPattern).conditionReview;
const boundNatalWoodEntry = boundVisibleStemReview.profiles.偏印 && boundVisibleStemReview.profiles.偏印.stemEntries.find((x) => x.pillar === 'year');
assert(boundVisibleStemPattern.positivePhenomena.some((x) => x.name === '木火通明') && boundVisibleStemReview.interactions.stemCombines.some((x) => x.pair === '甲己' && x.involvesLuck && x.effect === 'bind') && boundNatalWoodEntry && !boundNatalWoodEntry.usable && !boundVisibleStemReview.positivePhenomena.some((x) => x.name === '木火通明') && JSON.stringify(boundVisibleStemPattern) === boundVisibleStemSnapshot, `a natal visible stem caught in a luck-pillar bind must stop supporting a current clear-phenomenon conclusion without rewriting the natal conclusion, got ${JSON.stringify({ natal: boundVisibleStemPattern.positivePhenomena, current: boundVisibleStemReview.positivePhenomena, entry: boundNatalWoodEntry })}`);

const contestedLuckWealthBazi = { pillars: { year: '壬子', month: '甲寅', day: '甲卯', hour: '癸亥' }, dayStem: '甲' };
const contestedLuckWealthPattern = scriptContext.BaziEngine.analyzePattern(contestedLuckWealthBazi);
const contestedLuckWealthImpact = scriptContext.BaziEngine.evaluateLuckImpact('甲', '己亥', contestedLuckWealthPattern);
const contestedLuckWealthEntry = contestedLuckWealthImpact.conditionReview.profiles.正财 && contestedLuckWealthImpact.conditionReview.profiles.正财.stemEntries.find((x) => x.pillar === 'luck');
assert(contestedLuckWealthImpact.conditionReview.interactions.stemCombines.filter((x) => x.involvesLuck && x.effect === 'contest').length === 2 && contestedLuckWealthEntry && !contestedLuckWealthEntry.usable && contestedLuckWealthEntry.effect === 'contest' && !contestedLuckWealthImpact.conditionReview.strictFormation && contestedLuckWealthImpact.toMain === contestedLuckWealthPattern.mainPattern, `a luck wealth stem caught in two competing combinations may remain a clue but cannot serve as clear outward use or create a formed pattern, got ${JSON.stringify(contestedLuckWealthImpact)}`);

const transformedLuckBranchBazi = { pillars: { year: '甲酉', month: '戊辰', day: '丙寅', hour: '己未' }, dayStem: '丙' };
const transformedLuckBranchImpact = scriptContext.BaziEngine.evaluateLuckImpact('丙', '庚午', scriptContext.BaziEngine.analyzePattern(transformedLuckBranchBazi));
const transformedLuckBranchReview = transformedLuckBranchImpact.conditionReview;
const transformedLuckBranchRoot = transformedLuckBranchReview.strengthScore.dimensions.roots.items.find((x) => x.position === 'luck');
const transformedLuckBranchProfile = transformedLuckBranchReview.profiles.劫财 && transformedLuckBranchReview.profiles.劫财.branchEntries.find((x) => x.pillar === 'luck');
assert(transformedLuckBranchReview.interactions.branchPairs.some((x) => x.type === '六合' && x.effect === 'transform' && x.target === '土' && x.involvesLuck) && transformedLuckBranchRoot && transformedLuckBranchRoot.transformedAway && transformedLuckBranchRoot.rootPower === 0 && transformedLuckBranchRoot.branchChange.kind === 'six-combine' && transformedLuckBranchProfile && transformedLuckBranchProfile.transformedAway && transformedLuckBranchProfile.rootPower === 0 && !transformedLuckBranchProfile.usable && transformedLuckBranchReview.scores.火 < transformedLuckBranchReview.rawScores.火 && transformedLuckBranchReview.scores.土 > transformedLuckBranchReview.rawScores.土, `a supported luck-branch six-combination must feed its transformed element into the element, root and ten-god ledgers instead of retaining the original full root, got ${JSON.stringify({ root: transformedLuckBranchRoot, profile: transformedLuckBranchProfile, raw: transformedLuckBranchReview.rawScores, effective: transformedLuckBranchReview.scores })}`);

const competingLuckGroupsBazi = { pillars: { year: '甲寅', month: '壬子', day: '甲卯', hour: '乙申' }, dayStem: '甲' };
const competingLuckGroupsReview = scriptContext.BaziEngine.evaluateLuckImpact('甲', '戊辰', scriptContext.BaziEngine.analyzePattern(competingLuckGroupsBazi)).conditionReview;
const acceptedMeetingGroup = competingLuckGroupsReview.interactions.groups.find((x) => x.name === '三会木局');
const suppressedHarmonyGroup = competingLuckGroupsReview.interactions.groups.find((x) => x.name === '三合水局');
assert(acceptedMeetingGroup && acceptedMeetingGroup.active && acceptedMeetingGroup.activatedByLuck && suppressedHarmonyGroup && !suppressedHarmonyGroup.active && suppressedHarmonyGroup.complete && suppressedHarmonyGroup.suppressedByGroup === '三会木局' && suppressedHarmonyGroup.status === '争局让位三会木局', `two complete groups sharing the luck branch cannot transform that branch into different elements at the same time; the lower-order group must explicitly yield, got ${JSON.stringify(competingLuckGroupsReview.interactions.groups)}`);

const fifthPillarWaterBazi = { pillars: { year: '庚申', month: '壬子', day: '甲申', hour: '壬子' }, dayStem: '甲' };
const fifthPillarWaterImpact = scriptContext.BaziEngine.evaluateLuckImpact('甲', '戊辰', scriptContext.BaziEngine.analyzePattern(fifthPillarWaterBazi));
const completedFifthWaterGroup = fifthPillarWaterImpact.conditionReview.interactions.groups.find((x) => x.name === '三合水局');
assert(completedFifthWaterGroup && completedFifthWaterGroup.complete && completedFifthWaterGroup.active && !completedFifthWaterGroup.challenged && completedFifthWaterGroup.activatedByLuck && completedFifthWaterGroup.positions.includes(4), `the luck branch should complete and transform a supported 申子辰 group only after all three branches are present, got ${JSON.stringify(fifthPillarWaterImpact.conditionReview.interactions.groups)}`);

const fifthPillarRootBazi = { pillars: { year: '甲子', month: '乙丑', day: '甲寅', hour: '辛丑' }, dayStem: '甲' };
const fifthPillarRootPattern = scriptContext.BaziEngine.analyzePattern(fifthPillarRootBazi);
const fifthPillarRootImpact = scriptContext.BaziEngine.evaluateLuckImpact('甲', '戊申', fifthPillarRootPattern);
const fifthPillarRootReview = fifthPillarRootImpact.conditionReview;
const natalDayRoot = fifthPillarRootPattern.strengthScore.dimensions.roots.items.find((x) => x.position === 'day');
const currentDayRoot = fifthPillarRootReview.strengthScore.dimensions.roots.items.find((x) => x.position === 'day');
assert(/弱/.test(fifthPillarRootReview.strength) && fifthPillarRootReview.strengthScore.support < fifthPillarRootPattern.strengthScore.support && fifthPillarRootReview.carryingCapacity.usableRootPower < fifthPillarRootPattern.carryingCapacity.usableRootPower, 'luck clash reduces actual root/support facts even when the strict gate was already failed; a threshold crossing is not required to expose damage');
assert(natalDayRoot.rootPower > currentDayRoot.rootPower && currentDayRoot.attacks.includes('冲') && currentDayRoot.attacks.includes('刑') && fifthPillarRootReview.interactions.branchPairs.some((x) => x.involvesLuck && x.type === '冲' && x.active), `the fifth pillar must reduce the attacked natal root through the arbitrated clash/punishment graph, got ${JSON.stringify({ natalDayRoot, currentDayRoot, pairs: fifthPillarRootReview.interactions.branchPairs })}`);

const fifthPillarSecondaryAttackBazi = { pillars: { year: '庚申', month: '丁丑', day: '乙卯', hour: '己巳' }, dayStem: '乙' };
const fifthPillarPunishment = scriptContext.BaziEngine.evaluateLuckImpact('乙', '壬子', scriptContext.BaziEngine.analyzePattern(fifthPillarSecondaryAttackBazi)).conditionReview;
const fifthPillarHarmBreak = scriptContext.BaziEngine.evaluateLuckImpact('乙', '戊辰', scriptContext.BaziEngine.analyzePattern(fifthPillarSecondaryAttackBazi)).conditionReview;
assert(fifthPillarPunishment.interactions.branchPairs.some((x) => x.type === '刑' && x.active && x.involvesLuck && x.left === 2 && x.right === 4) && fifthPillarPunishment.strengthScore.dimensions.roots.items.some((x) => x.position === 'day' && x.attacks.includes('刑')), `a luck 子 branch punishment of the natal 卯 day branch must reach that exact root calculation, got ${JSON.stringify(fifthPillarPunishment.interactions.branchPairs)}`);
assert(fifthPillarHarmBreak.interactions.branchPairs.some((x) => x.type === '害' && x.active && x.involvesLuck && x.left === 2 && x.right === 4) && fifthPillarHarmBreak.interactions.branchPairs.some((x) => x.type === '破' && x.active && x.involvesLuck && x.left === 1 && x.right === 4) && fifthPillarHarmBreak.strengthScore.dimensions.roots.items.some((x) => x.position === 'day' && x.attacks.includes('害')), `luck 辰 must harm the natal 卯 day branch and break the natal 丑 month branch at the exact endpoints, got ${JSON.stringify(fifthPillarHarmBreak.interactions.branchPairs)}`);

const luckFormsInjurySealBazi = { pillars: { year: '戊申', month: '乙卯', day: '壬子', hour: '甲辰' }, dayStem: '壬' };
assertLegalReviewPillars(luckFormsInjurySealBazi.pillars);
const luckFormsInjurySealPattern = scriptContext.BaziEngine.analyzePattern(luckFormsInjurySealBazi);
const luckFormsInjurySealSnapshot = JSON.stringify(luckFormsInjurySealPattern);
const luckFormsInjurySealImpact = scriptContext.BaziEngine.evaluateLuckImpact('壬', '辛亥', luckFormsInjurySealPattern);
const luckFormsInjurySealReview = luckFormsInjurySealImpact.conditionReview;
assert(!luckFormsInjurySealPattern.natalNoblePattern && !luckFormsInjurySealReview.natalNoblePattern,
  'a combination completed by current luck must not confer a natal noble badge');
const luckSealFlow = luckFormsInjurySealReview.interactionFlow.steps.find((x) => x.from.some((god) => god.includes('印')) && x.to.includes('伤官'));
assert(!luckFormsInjurySealPattern.comboPatterns.includes('伤官配印格') && luckFormsInjurySealPattern.comboClues.some((x) => x.name === '伤官配印线索参考') && luckFormsInjurySealReview.strictFormation && luckFormsInjurySealReview.effectiveAdded.includes('伤官配印格') && luckFormsInjurySealImpact.toMain === '伤官配印格' && luckFormsInjurySealImpact.toStatus === '已成' && luckFormsInjurySealImpact.activationStatus === '运中补格' && luckFormsInjurySealImpact.scoreLedger.numericOwner === '格局状态迁移' && !luckFormsInjurySealImpact.scoreLedger.elementCounted, `a complete reachable luck remedy may form 伤官配印 only in the current luck context and receive one terminal formation score, got ${JSON.stringify(luckFormsInjurySealImpact)}`);
assert(luckSealFlow && luckSealFlow.active && luckSealFlow.left.pillar === 'luck' && luckSealFlow.left.position === 4 && luckSealFlow.right.position === 1 && luckSealFlow.effectiveDistance === 1 && luckFormsInjurySealReview.clarityChange.direction === '改善' && JSON.stringify(luckFormsInjurySealPattern) === luckFormsInjurySealSnapshot, 'current formation uses the actual luck seal to month injury path without mutating natal analysis');

const luckDamagesSealBazi = { pillars: { year: '甲申', month: '丁卯', day: '壬子', hour: '庚子' }, dayStem: '壬' };
assertLegalReviewPillars(luckDamagesSealBazi.pillars);
const luckDamagesSealPattern = scriptContext.BaziEngine.analyzePattern(luckDamagesSealBazi);
const luckDamagesSealSnapshot = JSON.stringify(luckDamagesSealPattern);
const luckDamagesSealImpact = scriptContext.BaziEngine.evaluateLuckImpact('壬', '丙午', luckDamagesSealPattern);
const luckDamagesSealReview = luckDamagesSealImpact.conditionReview;
assert(luckDamagesSealPattern.mainPattern === '伤官配印格' && luckDamagesSealPattern.clarity.level === '较清' && luckDamagesSealReview.conflicts.some((x) => x.name === '财坏印') && luckDamagesSealReview.patternDisease.items.some((x) => x.family === '财印相战' && x.status !== '已解') && !luckDamagesSealReview.strictFormation && luckDamagesSealImpact.toMain === luckDamagesSealPattern.mainPattern && luckDamagesSealImpact.toStatus === '成而有瑕' && !/^(清|较清)$/.test(luckDamagesSealReview.clarity.level), `a luck wealth star that reaches and damages the seal must worsen the current disease/purity result instead of preserving strict 伤官配印, got ${JSON.stringify(luckDamagesSealImpact)}`);
assert(JSON.stringify(luckDamagesSealPattern) === luckDamagesSealSnapshot, 'a damaging luck review must not write its current disease or clarity back into the natal analysis');

const trueFollowKillLuckBazi = { pillars: { year: '辛酉', month: '辛酉', day: '甲戌', hour: '庚午' }, dayStem: '甲' };
const trueFollowKillLuckPattern = scriptContext.BaziEngine.analyzePattern(trueFollowKillLuckBazi);
const followKillInput=scriptContext.BaziEngine.createBaziProfile({input:{year:2008,month:12,day:3,hour:0,minute:30},useTrueSolar:false,useDaylightSaving:false});
const followKillPage=withoutGodHighlight(scriptContext.renderStructure(followKillInput));
const followKillConclusion=followKillPage.match(/<section class="report-section" data-verdict[^>]*>[\s\S]*?<\/section>/)?.[0]||'';
assert(followKillConclusion.split('<dt>成格依据：</dt><dd>亥月水旺，本盘的七杀成势，原局顺着水势取用。</dd>').length===3&&!/<dt>(?:已有根基|已有救应)：<\/dt><dd>无/.test(followKillConclusion),'both modes show the actual formation evidence rather than an empty rescue row');
const woodPatternInput=scriptContext.BaziEngine.createBaziProfile({input:{year:2003,month:4,day:1,hour:4,minute:30},useTrueSolar:false,useDaylightSaving:false});
const woodPatternPage=withoutGodHighlight(scriptContext.renderStructure(woodPatternInput));
const woodPatternConclusion=woodPatternPage.match(/<section class="report-section" data-verdict[^>]*>[\s\S]*?<\/section>/)?.[0]||'';
assert(woodPatternConclusion.split('<dt>成格依据：</dt><dd>甲木生于卯月，地支见寅、卯、辰，会成木方，原局木势集中。</dd>').length===3,'both modes explain the actual wood formation');
assert(woodPatternPage.includes('顺势取法参考 · <b class="public-use-choice wx-土">土</b>')&&woodPatternPage.includes('顺势取法参考 · <b class="public-use-choice wx-木">木</b>')&&woodPatternPage.includes('《滴天髓阐微·体用、独象》条件解释。食伤已有出口时可继续生财。财转生官杀逆局时不能采用。列为独立取法。'),'alternate references identify each element while preserving the source and conditions');
const trueFollowKillLuckSnapshot = JSON.stringify(trueFollowKillLuckPattern);
const brokenFollowKillLuck = scriptContext.BaziEngine.evaluateLuckImpact('甲', '壬寅', trueFollowKillLuckPattern);
assert(trueFollowKillLuckPattern.mainPattern === '从格：从杀格' && brokenFollowKillLuck.conditionReview.specialLost.includes('从格：从杀格') && !brokenFollowKillLuck.conditionReview.specialPatternQualification && brokenFollowKillLuck.conditionReview.strengthScore.dimensions.roots.items.some((x) => x.position === 'luck' && x.grade === '本气根') && brokenFollowKillLuck.toMain === trueFollowKillLuckPattern.mainPattern && brokenFollowKillLuck.toStatus === '已破' && brokenFollowKillLuck.activationStatus === '特殊格运中受损', 'lost special qualification must be explicit in the current period and cannot simultaneously be 运中补格');
assert(JSON.stringify(trueFollowKillLuckPattern) === trueFollowKillLuckSnapshot, 'breaking a true special pattern in luck must preserve its natal qualification and main-pattern result');

const fakeFollowLuckBazi = { pillars: { year: '庚午', month: '辛巳', day: '甲戌', hour: '庚午' }, dayStem: '甲' };
const fakeFollowLuckPattern = scriptContext.BaziEngine.analyzePattern(fakeFollowLuckBazi);
const fakeFollowLuckImpact = scriptContext.BaziEngine.evaluateLuckImpact('甲', '辛酉', fakeFollowLuckPattern);
const fakeFollowLuckReview = fakeFollowLuckImpact.conditionReview;
assert(!fakeFollowLuckPattern.specialPatternQualification && !fakeFollowLuckReview.specialPatternQualification && fakeFollowLuckReview.specialPatterns.length === 0 && fakeFollowLuckReview.currentMainPattern.indexOf('从格：') !== 0 && fakeFollowLuckReview.specialClues.some((x) => x.includes('假从杀倾向')) && fakeFollowLuckImpact.text.includes('假从杀倾向'), `more killing in luck must not bypass the missing month-command condition; the incomplete special-pattern result must remain an explicit clue, got ${JSON.stringify(fakeFollowLuckReview.specialCandidates)}`);

const diseaseComparisonBazi = { pillars: { year: '甲子', month: '己巳', day: '甲辰', hour: '戊巳' }, dayStem: '甲' };
const diseaseComparisonImpact = scriptContext.BaziEngine.evaluateLuckImpact('甲', '庚子', scriptContext.BaziEngine.analyzePattern(diseaseComparisonBazi));
const diseaseComparisonReview = diseaseComparisonImpact.conditionReview;
assert(!diseaseComparisonReview.interactions.stemCombines.some((x) => x.involvesLuck) && !diseaseComparisonReview.interactions.branchPairs.some((x) => x.involvesLuck) && diseaseComparisonReview.comparisonBaseline.patternDisease.residualSeverity === diseaseComparisonReview.patternDisease.residualSeverity && diseaseComparisonReview.diseaseChanges.improved.length === 0 && diseaseComparisonReview.diseaseChanges.worsened.length === 0 && diseaseComparisonReview.diseaseChanges.newActive.length === 0, `luck disease changes must compare the same full-interaction algorithm on four- and five-pillar contexts instead of attributing pre-existing natal combinations to the luck pillar, got ${JSON.stringify(diseaseComparisonReview.diseaseChanges)}`);

const lateRescueBazi = { pillars: { year: '壬申', month: '乙卯', day: '戊寅', hour: '己巳' }, dayStem: '戊' };
const lateRescueReview = scriptContext.BaziEngine.evaluateLuckImpact('戊', '壬辰', scriptContext.BaziEngine.analyzePattern(lateRescueBazi)).conditionReview;
const lateRescueSequence = lateRescueReview.interactionFlow.sequence.find((x) => x.name === '比劫夺财');
const lateRescueDisease = lateRescueReview.patternDisease.items.find((x) => x.family === '比劫分财');
assert(lateRescueSequence && lateRescueSequence.breaker.active && lateRescueSequence.rescue.active && lateRescueSequence.rescue.distance <= lateRescueSequence.breaker.distance && lateRescueSequence.verdict === '救应可先到' && lateRescueDisease.status === '已解', 'temporal effective distances are equal here; cannot call this a late-rescue counterexample');
const lateRescueOperator = scriptContext.__patternReview.flow('', {比肩:{stemEntries:[{position:1,stem:'戊'}]},偏财:{stemEntries:[{position:0,stem:'壬'}]},正官:{stemEntries:[{position:3,stem:'乙'}]}}, {}, [{name:'比劫夺财'}]);
assert(lateRescueOperator.sequence[0].breaker.distance === 1 && lateRescueOperator.sequence[0].rescue.distance === 2 && lateRescueOperator.sequence[0].verdict === '破格作用较近，救应稍迟', 'graph-only counterexample retains a genuinely more distant rescue; this is not a birth chart');

const halfGroupLuckBazi = { pillars: { year: '庚申', month: '戊寅', day: '乙丑', hour: '辛酉' }, dayStem: '乙' };
const halfGroupLuckPattern = scriptContext.BaziEngine.analyzePattern(halfGroupLuckBazi);
const halfGroupLuckImpact = scriptContext.BaziEngine.evaluateLuckImpact('乙', '壬子', halfGroupLuckPattern);
const halfGroupLuckReview = halfGroupLuckImpact.conditionReview;
assert(halfGroupLuckReview.interactions.groups.some((x) => x.members === '申子辰' && x.involvesLuck && !x.complete && !x.active && x.status === '线索') && !halfGroupLuckImpact.text.includes('补成三合水局'), `two branches may only remain a half-group clue and must not be promoted by display wording, got ${JSON.stringify(halfGroupLuckImpact)}`);
const repeatedFifthPillarReview = scriptContext.BaziEngine.evaluateLuckImpact('乙', '壬子', halfGroupLuckPattern);
scriptContext.BaziEngine.evaluateLuckImpact('乙', '戊辰', halfGroupLuckPattern);
assert(JSON.stringify(scriptContext.BaziEngine.evaluateLuckImpact('乙', '壬子', halfGroupLuckPattern)) === JSON.stringify(repeatedFifthPillarReview), 'fifth-pillar reviews must be deterministic and must not leak state across luck-call order');
const mixedOutputBazi = {
  person: '食伤混杂样本',
  gender: '男',
  pillars: { year: '壬子', month: '癸子', day: '庚申', hour: '甲申' },
  dayStem: '庚',
  dayElement: '金',
  time: { used: { year: 1993, month: 12, day: 1, hour: 12, minute: 0 }, input: { year: 1993, month: 12, day: 1, hour: 12, minute: 0 }, enabled: false, correction: 0, location: { name: 'sample', lng: 120, lat: 30 } },
};
const mixedOutputPattern = scriptContext.BaziEngine.analyzePattern(mixedOutputBazi);
assert(mixedOutputPattern.mainPattern === '从格：从儿格' && !mixedOutputPattern.patternIssues.some((x) => x.includes('食伤混杂')), 'strictly qualified follow-child context must not inherit ordinary mixed-output deductions');
assert(mixedOutputPattern.specialPatternQualification.checks.every(x => x.met) && !mixedOutputPattern.patternVerdict.includes('待清'), 'follow-child must be judged by its independent qualified food-wealth continuity, not an ordinary purity label');
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
const deduplicatedFollowKillScore = scriptContext.BaziEngine.patternStructureRawScore(followKillPattern, { weights: auditControlWeights, deduplicateCauses: true, auditOnly: true });
validateCauseOwnership(deduplicatedFollowKillScore);
const followQualificationCauseIds = followKillPattern.specialPatternQualification.checks.map((item) => `qualification:${item.ruleId}`);
followQualificationCauseIds.forEach((causeId) => {
  const entries = deduplicatedFollowKillScore.ledger.filter((item) => item.causeId === causeId);
  assert(entries.length >= 2 && entries.filter((item) => item.counted && item.share > 0).length === 1 && new Set(entries.map((item) => item.dimension)).size >= 2, `one special qualification cause should have one numeric owner while other dimensions stay explanatory, got ${JSON.stringify({ causeId, entries })}`);
});
assert(scoreDimension(followKillPattern, 'flow').score === 90 && deduplicatedFollowKillScore.dimensions.find((item) => item.key === 'flow').score === 50 && deduplicatedFollowKillScore.dimensions.find((item) => item.key === 'flow').components.some((item) => item.counted && item.causeId === 'flow:neutral:ZP-SP-01'), `follow-killing force and season qualifications are not an independent action chain and should be neutral only in the audit vector, got ${JSON.stringify(deduplicatedFollowKillScore.dimensions.find((item) => item.key === 'flow'))}`);
const strictFollowChildPattern = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '甲午', month: '丙寅', day: '癸未', hour: '乙卯' }, dayStem: '癸' });
const deduplicatedFollowChildScore = scriptContext.BaziEngine.patternStructureRawScore(strictFollowChildPattern, { weights: auditControlWeights, deduplicateCauses: true, auditOnly: true });
validateCauseOwnership(deduplicatedFollowChildScore);
const childOutletCheck = strictFollowChildPattern.specialPatternQualification.checks.find(x => x.id === 'child-has-child');
assert(strictFollowChildPattern.mainPattern === '从格：从儿格' && deduplicatedFollowChildScore.dimensions.find((item) => item.key === 'flow').score === 90 && deduplicatedFollowChildScore.ledger.some((item) => item.dimension === 'flow' && item.counted && item.sourceCheckId === 'child-has-child' && item.causeId === 'qualification:' + childOutletCheck.ruleId), `an independently verified 食伤生财 outlet should remain owned by flow instead of being neutralized, got ${JSON.stringify(deduplicatedFollowChildScore.dimensions.find((item) => item.key === 'flow'))}`);
const followKillAiContext = scriptContext.buildPatternContextText(followKillBazi);
assert(followKillAiContext.includes('命格：从格：从杀格') && !followKillAiContext.includes('扶抑用神') && !followKillAiContext.includes('调候用神'), `AI context should identify the true special main pattern and omit pre-arbitration balance/climate candidates, got ${followKillAiContext}`);
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
  pillars: { year: '乙卯', month: '己卯', day: '壬寅', hour: '丁未' },
  dayStem: '壬',
  dayElement: '水',
  time: { used: { year: 1993, month: 2, day: 10, hour: 8, minute: 0 }, input: { year: 1993, month: 2, day: 10, hour: 8, minute: 0 }, enabled: false, correction: 0, location: { name: 'sample', lng: 120, lat: 30 } },
};
const transformPattern = scriptContext.BaziEngine.analyzePattern(transformBazi);
assertLegalReviewPillars(transformBazi.pillars);
assert(transformPattern.specialPatterns.some((x) => x.includes('丁壬化木')), `season-supported transform should form 丁壬化木, got ${transformPattern.specialPatterns.join(',')}`);
assert(transformPattern.mainPattern.includes('化气格'), `true transform should become main pattern, got ${transformPattern.mainPattern}`);
const transformQuote = '化得真者只论化，化神还有几般话。';
assert(scriptContext.classicalTransformNote(transformPattern).includes(transformQuote) && scriptContext.classicalTransformNote(transformPattern).includes('《滴天髓阐微·化象》'), 'a strictly qualified transformation pattern should show the confirmed classical transformation line');
const transformPotential = scoreDimension(transformPattern, 'potential');
assert(transformPotential.score >= 90 && transformPotential.components.length === 1 && transformPotential.components[0].ruleId === 'ZP-SP-09' && transformPotential.components[0].pattern === transformPattern.mainPattern && transformPotential.components[0].tier === 'S' && transformPattern.patternStructures.some((x) => x.role === '主格' && x.ruleId === 'ZP-SP-09') && traceablePotentialSource(transformPotential.components[0]), `a true 化气 pattern should receive one traceable high special-pattern potential component, got ${JSON.stringify(transformPotential)}`);
assert(!transformPattern.elementPhenomena.some((x) => x.name === '木多火塞') && !/^(有瑕|浊|偏浊|不清|冲战)$/.test(transformPattern.clarity.level), `a true 丁壬化木 chart must be evaluated around transformed wood qi instead of inheriting fire-daymaster 木多火塞 or ordinary 印格 clarity penalties, got ${JSON.stringify({ phenomena: transformPattern.elementPhenomena, clarity: transformPattern.clarity })}`);
assert(transformPattern.useful.avoid.includes('金') && !transformPattern.useful.avoid.includes('火') && !transformPattern.useful.secondaryUse.includes('火'), '化木忌金逆制；火是化神的条件泄秀，不能因其也是丁原气一律作忌，也不能自动加为佐用');
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
assert(scriptContext.classicalTransformNote(rootedTransformPattern) === '', 'an incomplete or false transformation clue must not show the strict transformation classical line');
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
  assert(!result.natalNoblePattern || !/^ZP-SP-/.test(result.natalNoblePattern.ruleId), `${label} must not retain a rejected special noble badge`);
  assert(!result.specialPatterns.some((item) => /^(从格：|化气格：|专旺格：)/.test(item)) && !result.specialPatternQualification, `${label} should fail strict special-pattern qualification, got ${JSON.stringify({ specialPatterns: result.specialPatterns, qualification: result.specialPatternQualification })}`);
  assert(!potential.components.some((item) => /^ZP-SP-/.test(item.ruleId || '')), `${label} must not receive special-pattern potential after qualification fails, got ${JSON.stringify(potential)}`);
};

function renderNobleFixture(pillars) {
  const engine = scriptContext.BaziEngine;
  return scriptContext.renderStructure({
    pillars, dayStem: pillars.day[0], dayElement: engine.constants.STEM_WX[pillars.day[0]],
    scores: engine.scoreWuxing(pillars), relations: []
  });
}
const nobleBadge = '<span class="pattern-noble">贵格</span>';
const damagedNoblePillars = { year: '甲子', month: '丙寅', day: '癸巳', hour: '辛酉' };
assertLegalReviewPillars(damagedNoblePillars);
const damagedNoblePattern = scriptContext.BaziEngine.analyzePattern({ pillars: damagedNoblePillars });
assert(damagedNoblePattern.mainPattern === '伤官配印格' && !damagedNoblePattern.natalNoblePattern &&
  !renderNobleFixture(damagedNoblePillars).includes(nobleBadge), 'a same-name damaged pattern must render without a noble badge');
assert(renderNobleFixture(injurySealPositiveBazi.pillars).includes('伤官配印格·' + nobleBadge),
  'strict injury-seal must render the noble badge alongside the main pattern');

const nobleInjuryWealthPillars = { year: '甲子', month: '丙寅', day: '癸酉', hour: '壬子' };
assertLegalReviewPillars(nobleInjuryWealthPillars);
const nobleInjuryWealth = scriptContext.BaziEngine.analyzePattern({ pillars: nobleInjuryWealthPillars });
assert(nobleInjuryWealth.natalNoblePattern?.ruleId === 'ZP-CG-06' && !nobleInjuryWealth.patternLevelHardGate.topEligible,
  'injury-to-wealth badge must be independent of the scoring system top-grade gate');

const nobleWealthOfficerPillars = { year: '甲子', month: '己巳', day: '壬子', hour: '己酉' };
const plainWealthPillars = { year: '甲子', month: '己巳', day: '丁卯', hour: '庚子' };
assertLegalReviewPillars(nobleWealthOfficerPillars);
assertLegalReviewPillars(plainWealthPillars);
const nobleWealthOfficerHtml = withoutGodHighlight(renderNobleFixture(nobleWealthOfficerPillars));
assert(nobleWealthOfficerHtml.includes('偏财格·' + nobleBadge) &&
  nobleWealthOfficerHtml.includes('本盘财旺生官。') && nobleWealthOfficerHtml.includes('财旺生官：财得令有根'),
  'a qualified wealth-to-officer pattern must retain its wealth name and explain the badge in both modes');
const plainWealthPattern = scriptContext.BaziEngine.analyzePattern({ pillars: plainWealthPillars });
assert(plainWealthPattern.regularPattern.status === '已成' && !renderNobleFixture(plainWealthPillars).includes(nobleBadge),
  'an established wealth pattern without a verified wealth-to-officer route must not show the badge');

const followWealthPattern = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '己巳', month: '戊戌', day: '甲午', hour: '丙戌' }, dayStem: '甲' });
assertStrictSpecialPattern('从财格', followWealthPattern, 'ZP-SP-04');
assert(followWealthPattern.natalNoblePattern?.ruleId === 'ZP-SP-04' && transformPattern.natalNoblePattern?.ruleId === 'ZP-SP-09',
  'true follow and transformation charts can earn a noble badge from natal evidence');
assert(followWealthPattern.useful.use.includes('火') && followWealthPattern.useful.avoid.includes('金') && !followWealthPattern.clarityConclusion.remove.includes('食伤逆势'), `从财格 should keep 食伤生财 as useful, mark 官杀泄财 as a break boundary, and never describe 食伤 itself as breaking the pattern, got ${JSON.stringify({ useful: followWealthPattern.useful, clarity: followWealthPattern.clarityConclusion })}`);
const rootedFollowWealthPattern = scriptContext.BaziEngine.analyzePattern({ pillars: { year: '己巳', month: '戊戌', day: '甲寅', hour: '丙戌' }, dayStem: '甲' });
assertRejectedSpecialPattern('日主有根的假从财', rootedFollowWealthPattern);
assertStrictSpecialPattern('从儿格', trueFollowChildPattern, 'ZP-SP-05');
const sealedFollowChildPillars = { year: '丁巳', month: '丙午', day: '甲戌', hour: '壬申' };
assertLegalReviewPillars(sealedFollowChildPillars);
const sealedFollowChildPattern = scriptContext.BaziEngine.analyzePattern({ pillars: sealedFollowChildPillars });
assert(sealedFollowChildPattern.tenGodProfiles['偏印'].revealed === 1 && scriptContext.__patternReview.flow('', sealedFollowChildPattern.tenGodProfiles, sealedFollowChildPattern.interactions, [], [{from:['正印','偏印'],to:['食神','伤官'],action:'制'}]).steps.some(x=>x.active) && !sealedFollowChildPattern.specialPatterns.some(item=>item.startsWith('从格：')), 'effective revealed seal reversal rejects true follow-child; a near-follow clue is optional, not a necessary failure label');
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
  assert(result.natalNoblePattern?.ruleId === item.ruleId, `${item.label} should receive the noble badge once strictly established`);
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
assert(promptPatternContext.includes('正官格：')&&promptPatternContext.includes('官杀去留'),'context retains refreshed pattern and actual conflicts');
assert(!/格局层次|层次归因|结构分：|评分维度|百分位/.test(promptPatternContext),'public/AI context excludes structural tiers');
assert(promptPatternContext.includes('已有救应')&&promptPatternContext.includes('病药通关')&&promptPatternContext.includes('原局取用'),'context retains actual rescue, residual and useful roles');
assert(scriptContext.currentLuckPatternText(referenceBazi).includes('当前大运')&&!scriptContext.currentLuckPatternText(referenceBazi).includes('层次'),'structure has only a current-luck entry, without duplicated outlook or grade');
assert(html.includes('function remedyText'), 'structure UI should include remedy text helper');
assert(html.includes('function elementPhenomenonText'), 'structure UI should include professional phenomenon text helper');
assert(html.includes('function elementPhenomenonContextText'), 'AI context should use the full plain-text phenomenon helper');
assert(html.includes('function patternFactorText'), 'structure UI should include pattern factor helper');
assert(html.includes('function patternClarityText'), 'structure UI should include pattern clarity helper');
assert(html.includes('function usefulPriorityText'), 'structure UI should include useful priority helper');
assert(html.includes('function comboConflictText'), 'structure UI should include combo conflict helper');
assert(html.includes('function currentLuckPatternText'), 'structure UI should include current-luck pattern conclusion helper');
assert(html.includes('function publicPatternLevel'), 'structure UI should include the agreed public level-label helper');
assert(html.includes('这是所选传统框架的结构解释，不承诺现实结果。'),'one public cultural boundary remains without a tier disclaimer');
const yiMaoLuck = referenceLuck.rows.find((r) => r.gz === '乙卯');
assert(referenceLuck.startAge === 4, `reference luck start age should use the exact term-to-birth duration, got ${referenceLuck.startAge}`);
assert(yiMaoLuck && scriptContext.luckStartYear(referenceBazi, yiMaoLuck) === 2026, `乙卯 luck should start in 2026, got ${yiMaoLuck && scriptContext.luckStartYear(referenceBazi, yiMaoLuck)}`);
const exactTermBazi = {
  person: '张黎',
  gender: '女',
  pillars: { year: '甲戌', month: '丙子', day: '壬午', hour: '丙午' },
  dayStem: '壬',
  dayElement: '水',
  time: { used: { year: 1994, month: 12, day: 22, hour: 12, minute: 44 }, input: { year: 1994, month: 12, day: 22, hour: 13, minute: 47 }, enabled: true, correction: -63, location: { name: '云南省 曲靖市 师宗县', lng: 103.9936, lat: 24.8222 } },
};
const exactTermLuck = scriptContext.getLuckData(exactTermBazi);
assert(exactTermLuck.startAge === 6, `minute-calibrated term gap should enter after the fifth elapsed year, got ${exactTermLuck.startAge}`);
assert(scriptContext.luckStartYear(exactTermBazi, exactTermLuck.rows[0]) === 1999, `minute-calibrated term gap should start first luck in 1999, got ${scriptContext.luckStartYear(exactTermBazi, exactTermLuck.rows[0])}`);
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

// New outlooks compare causal conditions, not the old clipped pattern-grade action.
const outlookEngine = scriptContext.BaziEngine;
const outlookConditionChart = {
  pillars: { year: '戊辰', month: '戊辰', day: '甲申', hour: '己巳' },
  dayStem: '甲', gender: '男',
  time: { used: { year: 1993, month: 4, day: 1, hour: 10, minute: 0 } },
}; // Synthetic condition combination, not a historical prediction record.
const outlookYearRows = Array.from({ length: 10 }, (_, index) => ({ year: 2020 + index, gz: outlookEngine.getFlowYearGZ(2020 + index) }));
const outlookInputSnapshot = JSON.stringify(outlookConditionChart);
const outlookHelp = outlookEngine.evaluateLuckOutlook(outlookConditionChart, '壬寅', '庚午', outlookYearRows);
// Legacy state-rank expectations are replaced by independently specified causal cases.
assert(outlookHelp.ruleVersion === 'luck-outlook-20261110.1-new-rule-first', 'the revised causal rules must be versioned');
assert(outlookHelp.natal.evidence.every(item => item.ruleId && item.source && Array.isArray(item.conditions)), 'every direction must carry its rule, source and actual conditions');
assert(outlookHelp.natal.evidence.every(item => item.kind !== 'useful' && !item.text.includes('已破转为')), 'rank or generic element changes must not create a direction');
const sameOutlook = outlookEngine.evaluateLuckOutlook(outlookConditionChart, '壬寅', '壬寅', []);
assert(sameOutlook.previous.direction === 'neutral' || sameOutlook.previous.direction === 'pending', 'identical states cannot create an improvement or deterioration');
const firstOutlook = outlookEngine.evaluateLuckOutlook(outlookConditionChart, '壬寅', null, []);
assert(firstOutlook.previous.label === '无上一柱可比较', 'the first luck must not default to neutral');

// Isolated theoretical ten-god conditions test branches without using personal event labels.
const coreContext = { GZ60: vm.runInContext('GZ60', scriptContext) };
vm.createContext(coreContext);
vm.runInContext(engine.replace('root.BaziEngine=api;', 'root.__outlookRules={core:outlookCore,compare:compareOutlookContexts,label:labelOutlook};root.BaziEngine=api;'), coreContext);
const rules = coreContext.__outlookRules;
function coreFixture(family, entries, strength='中和', rooted=true) {
  const profiles = {};
  const pillarsByPosition = ['year','month','day','hour','luck','flowYear'];
  Object.entries(entries).forEach(([god, p]) => {
    const position=p.position === undefined ? 1 : p.position;
    const rootPosition=p.command?1:position;
    const roots=Array.from({length:p.roots === undefined ? 1 : p.roots}, (_,i) => ({pillar:pillarsByPosition[(rootPosition+i)%6],position:(rootPosition+i)%6,stem:p.stem||'甲',branch:'辰',hiddenIndex:p.hiddenIndex||0,rootPower:1,usable:true,attacks:p.damaged?['冲']:[],transformedAway:false}));
    profiles[god]={monthCommand:!!p.command,stemEntries:p.clear===false?[]:[{pillar:pillarsByPosition[position],position,stem:p.stem||'甲',temporal:position>3,usable:p.usable!==false,effect:p.usable===false?'bind':'none'}],branchEntries:roots};
  });
  return {pillars:{year:'甲子',month:'戊辰',day:'甲寅',hour:'丙午'},profiles,scores:{木:20,火:20,土:20,金:20,水:20},strength,
    strengthScore:{dimensions:{roots:{items:rooted?[{pillar:'day',usable:true,attacked:false,changedByGroup:false,transformedAway:false}]:[]}}},
    regularPattern:{authority:{key:family},checks:[]},rawMainPattern:'理论'+family+'主线',interactions:{stemCombines:[],branchPairs:[]},patternDisease:{items:[]}};
}
const coreAnalysis={monthCommand:{ambiguous:false}};
assert(scriptContext.usefulAiInstruction().includes('格局通则不是本盘无救的判决') && scriptContext.usefulAiInstruction().includes('同五行根气支持不表示十神作用者可以互换') && scriptContext.usefulAiInstruction().includes('工程判据') && scriptContext.usefulAiInstruction().includes('继续增加同五行越多越好'), 'AI must preserve actual case/rescue, actor identity, engineering boundaries and maintenance-versus-increment distinctions');
function findTask(ctx,id,analysis=coreAnalysis) { return rules.core(ctx,analysis).tasks.find(item=>item.id===id); }
const mediatedOfficerPillars = {year:'癸丑',month:'甲寅',day:'丙午',hour:'壬辰'};
assertLegalReviewPillars(mediatedOfficerPillars);
const mediatedOfficerAnalysis = scriptContext.BaziEngine.analyzePattern({pillars:mediatedOfficerPillars});
const mediatedOfficerContext = scriptContext.__patternReview.context('丙',mediatedOfficerPillars,mediatedOfficerAnalysis);
assert(!mediatedOfficerAnalysis.patternIssues.includes('官杀混杂待清') && findTask(mediatedOfficerContext,'officer-kill-mixed',mediatedOfficerAnalysis).state === 0, 'natal and luck-route evaluation share a verified full officer/killing-seal-day mediation, not forced removal of one god');
const lostSealMediation = JSON.parse(JSON.stringify(mediatedOfficerContext));
lostSealMediation.profiles['偏印'].stemEntries = [];lostSealMediation.profiles['偏印'].revealed = 0;lostSealMediation.profiles['偏印'].monthCommand = false;
assert(findTask(lostSealMediation,'officer-kill-mixed',mediatedOfficerAnalysis).state !== 0, 'operator counterexample: losing the clear mediating seal cannot retain a solved mixed-officer result');
const protectedBase=coreFixture('官',{'比肩':{position:3},'正官':{position:2},'伤官':{position:0}});
const protectedSeal=coreFixture('官',{'比肩':{position:3},'正官':{position:2},'伤官':{position:0},'正印':{position:1}});
assert(findTask(protectedBase,'hurt-officer').state === -1, 'rooted clear hurt reaching the used officer is a real unresolved mechanism');
assert(findTask(protectedSeal,'hurt-officer').state === 0, 'rooted reachable seal with sufficient support must resolve that same officer-hurt mechanism');
const boundSeal=coreFixture('官',{'比肩':{position:3},'正官':{position:2},'伤官':{position:0},'正印':{position:1,usable:false}});
assert(findTask(boundSeal,'hurt-officer').state === -1, 'a bound seal cannot protect the officer just by existing');
const sealImprovement=rules.compare(protectedBase,protectedSeal,coreAnalysis);
assert(sealImprovement.evidence.some(x=>x.taskId==='hurt-officer'&&x.direction==='positive'), 'the rescue must yield its causal evidence without any formation-rank change');
const missingDisease=Object.assign({},protectedBase,{patternDisease:{items:[]}});
assert(!rules.compare(protectedBase,missingDisease,coreAnalysis).evidence.some(x=>x.direction==='positive'), 'a disappeared disease row with unchanged causes is not improvement');

const killHeavy=coreFixture('杀',{'比肩':{position:3},'食神':{position:0},'七杀':{position:1,command:true},'正财':{position:2}});
const foodHeavy=coreFixture('杀',{'比肩':{position:2},'食神':{position:1,command:true},'七杀':{position:0}});
assert(findTask(killHeavy,'food-kill').reason.includes('杀较重'), 'kill heavy / food light must ask for food, not generic seal help');
assert(findTask(foodHeavy,'food-kill').reason.includes('食较重'), 'food heavy / kill light must ask for kill or food adjustment, not more food');
const crossedPower=coreFixture('杀',{'比肩':{position:2},'食神':{position:1,roots:2},'七杀':{position:0,command:true}});
assert(findTask(crossedPower,'food-kill').state === null, 'crossed command/root advantages remain unconfirmed, without an invented ratio');
const crossedBlade=coreFixture('刃',{'比肩':{position:2,roots:2},'七杀':{position:1,command:true}});
assert(findTask(crossedBlade,'kill-blade').state===null && findTask(crossedBlade,'kill-blade').possibleStates.includes(0) && !findTask(crossedBlade,'kill-blade').possibleStates.includes(-1), 'unconfirmed blade/killing matching alone is an unresolved useful route, not an independent harmful mechanism');

const foodRobbed=coreFixture('杀',{'比肩':{position:3},'食神':{position:0},'七杀':{position:1},'偏印':{position:2}});
const foodSaved=coreFixture('杀',{'比肩':{position:3},'食神':{position:0},'七杀':{position:1},'偏印':{position:2},'正财':{position:3,command:true}});
assert(findTask(foodRobbed,'food-kill').state === -1, 'rooted accessible seal robbing required food must break its control route');
assert(findTask(foodSaved,'food-kill').counterEvidence.some(x=>x.includes('已结算救应')), 'actual wealth restraining seal must be evaluated before a blanket wealth-is-bad rule');

const matchingHurt=coreFixture('伤',{'比肩':{position:2},'伤官':{position:0,command:true},'正印':{position:1}},'偏弱');
const rootlessSeal=coreFixture('伤',{'比肩':{position:2},'伤官':{position:0,command:true},'正印':{position:1,roots:0}},'偏弱');
assert(findTask(matchingHurt,'hurt-seal').state === 1, 'strong rooted hurt, weak but rooted body and deep accessible seal support matching');
assert(findTask(rootlessSeal,'hurt-seal').state !== 1, 'visible rootless seal must not count as effective matching');
const excessSeal=coreFixture('伤',{'比肩':{position:3},'伤官':{position:0},'正印':{position:1,command:true},'正官':{position:2}},'强');
assert(findTask(excessSeal,'hurt-seal').state === -1, 'strong rooted body, lighter hurt and heavier seal are an excessive-control counterexample');

const weakWealth=coreFixture('财',{'比肩':{position:2},'正财':{position:1,command:true}},'偏弱');
const dividedWealth=coreFixture('财',{'比肩':{position:2,command:true,roots:2},'正财':{position:1}},'强');
assert(findTask(weakWealth,'wealth-sharing').state === 0, 'body support must not become automatic wealth theft');
assert(findTask(dividedWealth,'wealth-sharing').state === -1, 'rooted excessive peer reaching lighter wealth without rescue must remain a real counterexample');
const rootsOnlyWealth=coreFixture('财',{'比肩':{position:2,roots:2},'正财':{position:1}},'强');
assert(findTask(rootsOnlyWealth,'wealth-sharing').state===null, 'root counts alone cannot confirm dominance and turn peers into actual wealth theft');
const sharingWithOutlet=coreFixture('财',{'比肩':{position:2,roots:2},'正财':{position:1},'食神':{position:0}},'强');
assert(findTask(sharingWithOutlet,'output-wealth').state===1 && findTask(sharingWithOutlet,'wealth-sharing').state===0, 'a confirmed outlet accepting peers must settle sharing rescue before an uncertain peer/wealth balance');
assert(findTask(sharingWithOutlet,'wealth-sharing').counterEvidence.some(x=>x.includes('已核对有效')), 'sharing rescue must expose the already checked outlet conditions');
const rescuedSharing=rules.compare(rootsOnlyWealth,sharingWithOutlet,coreAnalysis);
assert(rescuedSharing.direction==='positive' && rescuedSharing.reservations.some(x=>x.taskId==='wealth-sharing'&&x.text.includes('各可行解释不改变')), 'a possible old sharing harm becoming resolved cannot reverse an independently confirmed outlet improvement');
assert(rules.compare(sharingWithOutlet,rootsOnlyWealth,coreAnalysis).direction==='negative', 'the same bounded-risk comparison must reverse when the two states swap');
const sharingWithBoundOutlet=coreFixture('财',{'比肩':{position:2,roots:2},'正财':{position:1},'食神':{position:0,usable:false}},'强');
const sharingWithUnconfirmedOutlet=coreFixture('财',{'比肩':{position:2,roots:2},'正财':{position:1},'食神':{position:0},'正印':{position:3,command:true}},'强');
for(const context of [sharingWithBoundOutlet,sharingWithUnconfirmedOutlet]) {
  assert(findTask(context,'output-wealth').state!==1 && findTask(context,'wealth-sharing').state===null, 'an unusable outlet or unconfirmed remedy cannot silently resolve sharing');
}
const sharingWithOfficer=coreFixture('财',{'比肩':{position:2,roots:2},'正财':{position:0},'正官':{position:1,roots:2,command:true}},'强');
const sharingWithBrokenOfficer=coreFixture('财',{'比肩':{position:2,roots:2},'正财':{position:0},'正官':{position:1,roots:2,command:true},'伤官':{position:3}},'强');
assert(findTask(sharingWithOfficer,'wealth-sharing').state===0 && findTask(sharingWithBrokenOfficer,'wealth-sharing').state===null, 'official rescue must be reachable and remain free of unresolved hurt, with no alternative earning outlet');
const noWealthUse=coreFixture('财',{'比肩':{position:2,roots:2}},'强');
assert(rules.compare(noWealthUse,rootsOnlyWealth,coreAnalysis).direction==='pending', 'a newly possible sharing harm may oppose confirmed carrying improvement and must still block a final direction');
const lightPrint=coreFixture('印',{'比肩':{position:2},'正印':{position:1},'正财':{position:0,command:true}},'偏弱');
const heavyPrint=coreFixture('印',{'比肩':{position:2},'正印':{position:1,command:true},'正财':{position:0}},'强');
assert(findTask(lightPrint,'wealth-tunes-seal').state === 0 && findTask(heavyPrint,'wealth-tunes-seal').state === 1, 'wealth tuning heavy print must be distinct from wealth hurting needed light print');

for (const family of ['官','财','印','食','杀','伤','刃','禄']) {
  const context=coreFixture(family,{'比肩':{position:2},'正财':{position:0},'正官':{position:1},'正印':{position:3},'食神':{position:1},'七杀':{position:0},'伤官':{position:3}});
  const core=rules.core(context,coreAnalysis);
  assert(core.tasks.length>0 && core.tasks.every(x=>x.ruleId&&x.source&&x.conditions.length), 'each month-command family needs actual source-bearing tasks: '+family);
}
const specialAnalysis={monthCommand:{ambiguous:false},specialPatternQualification:{name:'从格：从杀格',target:'金'}};
const specialFollowing=coreFixture('杀',{'七杀':{position:1,command:true}},'弱',false);
specialFollowing.currentSpecialDetail={name:'从格：从杀格',type:'从格',target:'金',flowChecks:[{label:'所从气势及出口',met:true}]};
const specialBroken=coreFixture('杀',{'七杀':{position:1,command:true},'比肩':{position:2},'正印':{position:3}},'中和',true);
assert(findTask(specialFollowing,'special-reversal',specialAnalysis).state===0 && findTask(specialBroken,'special-reversal',specialAnalysis).state===-1, 'special reversal needs the actual restored body root, not a qualification toggle');
const specialThresholdOnly=coreFixture('杀',{'七杀':{position:1,command:true}},'弱',false);
assert(findTask(specialThresholdOnly,'special-flow',specialAnalysis).state===null, 'qualification loss without physical counterevidence must remain pending');
const ordinaryCarry=coreFixture('财',{'比肩':{position:2},'正财':{position:1}},'中和');
const thresholdCarry=Object.assign({},ordinaryCarry,{strength:'偏弱'});
assert(rules.compare(ordinaryCarry,thresholdCarry,coreAnalysis).direction==='pending', 'a numerical strength/carrying change alone cannot decide the direction');

const pendingFood=rules.compare(killHeavy,crossedPower,coreAnalysis);
assert(pendingFood.direction==='pending' && pendingFood.uncertainty.some(x=>x.includes('食神制杀')), 'changed consequential unconfirmed food/kill balance has priority over mixed or favorable clues');
const brokenUnbalancedFood=coreFixture('食',{'比肩':{position:3},'食神':{position:1,command:true},'七杀':{position:0,roots:2},'正印':{position:2}},'中和');
assert(findTask(brokenUnbalancedFood,'food-kill').state===-1, 'a confirmed unrescued seal blocking food must still be settled when food/kill balance is unknown');
const foodWithoutKill=coreFixture('食',{'比肩':{position:3},'食神':{position:1},'正印':{position:2}},'中和');
assert(findTask(foodWithoutKill,'food-seal-tune').state===0 && findTask(foodWithoutKill,'food-seal-tune').applicable===false, 'food/kill balancing must not introduce a missing-kill uncertainty when killing is not actually usable');
const checkedIncompleteFood=coreFixture('食',{'比肩':{position:3},'食神':{position:1,command:true},'七杀':{position:0}},'弱');
assert(findTask(checkedIncompleteFood,'food-kill').state===0 && rules.compare(checkedIncompleteFood,checkedIncompleteFood,coreAnalysis).direction==='neutral', 'an actually connected, usable but incomplete path checked unchanged on both sides is not empty evidence');
const noUsablePath=coreFixture('食',{},'弱');
assert(rules.compare(noUsablePath,noUsablePath,coreAnalysis).direction==='pending', 'no usable participating path must still remain pending rather than defaulting to neutral');
// Other primary routes: an outlet/control needs an actual usable participant, with its counterexample beside it.
const externalUse={'比肩':{position:3},'正官':{position:2},'食神':{position:1},'正财':{position:0}};
const foodOutlet=coreFixture('食',externalUse,'强');
const foodBlocked=coreFixture('食',Object.assign({},externalUse,{'食神':{position:1,usable:false}}),'强');
assert(findTask(foodOutlet,'output-wealth').state===1 && findTask(foodBlocked,'output-wealth').state===0, 'food earning an outlet must be distinguished from the same food bound out of use');
const foodTransformed=coreFixture('食',externalUse,'强');
foodTransformed.profiles['食神'].stemEntries[0].usable=false;foodTransformed.profiles['食神'].stemEntries[0].effect='transform';
foodTransformed.profiles['食神'].branchEntries[0].transformedAway=true;foodTransformed.profiles['食神'].branchEntries[0].usable=false;
assert(rules.compare(foodOutlet,foodTransformed,coreAnalysis).direction==='pending', 'a used outlet transformed into another role requires a common reference, not automatic decline');
const bladeControl=coreFixture('刃',externalUse,'强');
const bladeBlocked=coreFixture('刃',Object.assign({},externalUse,{'正官':{position:2,usable:false}}),'强');
assert(findTask(bladeControl,'officer-blade').state===1 && findTask(bladeBlocked,'officer-blade').state===0, 'official control of blade needs a usable officer rather than a name');
const fortuneOutlet=coreFixture('禄',externalUse,'强');
const fortuneBlocked=coreFixture('禄',Object.assign({},externalUse,{'食神':{position:1,usable:false}}),'强');
assert(findTask(fortuneOutlet,'body-output').state===1 && findTask(fortuneBlocked,'body-output').state===0, 'lu taking output must lose that outlet when its participant is bound');
const damagedPrint=coreFixture('印',{'比肩':{position:2},'正印':{position:1,damaged:true}},'偏弱');
assert(findTask(damagedPrint,'seal-body').state===null, 'a surviving but entirely attacked root is a clue, not proof of fully effective body support');
assert(findTask(damagedPrint,'seal-body').possibleStates.includes(0) && findTask(damagedPrint,'seal-body').possibleStates.includes(1) && !findTask(damagedPrint,'seal-body').possibleStates.includes(-1), 'uncertain support without a damaging mechanism can be absent or effective, but cannot invent independent harm');
for(const relation of ['刑','害','破']) {
  const nominalRelation=coreFixture('印',{'比肩':{position:2},'正印':{position:1}},'偏弱');
  nominalRelation.profiles['正印'].branchEntries[0].attacks=[relation];
  assert(findTask(nominalRelation,'seal-body').state===1 && findTask(nominalRelation,'seal-body').conditions.some(x=>x.includes(relation)), 'a nominal '+relation+' must remain in evidence without disabling a still usable support root');
  nominalRelation.profiles['正印'].branchEntries[0].boundByCombine=true;
  assert(findTask(nominalRelation,'seal-body').state===null, 'actual binding must still restrict the root despite nominal relations being nondecisive');
}
const damagedSupportWithRisk=coreFixture('印',{'比肩':{position:2},'正印':{position:1,damaged:true},'正财':{position:0}},'偏弱');
assert(findTask(damagedSupportWithRisk,'seal-body').possibleStates.includes(-1), 'a real possible wealth/seal damaging mechanism must keep adverse outcomes available');
const conditionalSupport=rules.compare(damagedPrint,coreFixture('印',{'比肩':{position:2},'正印':{position:1}},'偏弱'),coreAnalysis);
assert(conditionalSupport.direction==='pending' && conditionalSupport.assessment==='conditional' && conditionalSupport.possibleDirections.includes('positive') && conditionalSupport.possibleDirections.includes('neutral') && !conditionalSupport.possibleDirections.includes('negative'), 'an uncertain support becoming usable provides one-way conditional improvement, not a guaranteed rise or invented reversal');
assert(rules.label(conditionalSupport,'previous').label==='可能上升' && conditionalSupport.summary.includes('学习与支持资源'), 'conditional directions need a concrete deciding condition in plain language');
const rootLostPrint=coreFixture('印',{'比肩':{position:2},'正印':{position:1,roots:0}},'偏弱');
assert(findTask(rootLostPrint,'seal-body').state===0, 'visible print with no usable root cannot independently supply effective support');
const supportedDay=coreFixture('印',{'比肩':{position:2,clear:false},'正印':{position:1}},'偏弱');
assert(findTask(supportedDay,'seal-body').state===1, 'the actual visible daymaster is the object of print support even without another visible peer');
const winterBase=Object.assign({},protectedBase,{pillars:Object.assign({},protectedBase.pillars,{month:'壬子'}),scores:{水:80,火:0,木:5,土:5,金:10}});
const sealWithClimateClue=Object.assign({},protectedSeal,{pillars:winterBase.pillars,scores:winterBase.scores});
const climateClueComparison=rules.compare(winterBase,sealWithClimateClue,coreAnalysis);
assert(climateClueComparison.direction==='positive' && !climateClueComparison.review.afterTasks.some(x=>x.id==='climate'&&x.state===-1), 'an element-ratio clue without actual climate actors cannot manufacture a contrary verdict or override confirmed protection');

const foodToSeal=coreFixture('杀',{'七杀':{position:1},'正印':{position:2},'比肩':{position:3}},'中和');
assert(findTask(foodToSeal,'kill-seal').state===1 && findTask(foodToSeal,'handle-kill').state===1, 'a reachable seal feeding rooted body provides an alternative solution to the same killing pressure');
assert(!rules.compare(foodRobbed,foodToSeal,coreAnalysis).evidence.some(x=>x.taskId==='food-kill'&&x.direction==='negative'), 'an effective replacement route must not be punished for the vanished name of the former route');
const mixedHurt=coreFixture('伤',{'比肩':{position:3},'伤官':{position:0},'正印':{position:1,command:true},'正官':{position:2}},'强');
assert(rules.compare(matchingHurt,mixedHurt,coreAnalysis).direction==='mixed', 'a new effective officer route and excessive suppression of used hurt are independent opposing consequences');
const hiddenOfficer=coreFixture('伤',{'比肩':{position:2},'伤官':{position:0,command:true},'正印':{position:1},'正官':{position:3,clear:false,damaged:true}},'偏弱');
const damagedOfficer=coreFixture('伤',{'比肩':{position:2},'伤官':{position:0,command:true},'正印':{position:1},'正官':{position:3,damaged:true}},'偏弱');
assert(findTask(hiddenOfficer,'carry-officer').state===0 && rules.compare(matchingHurt,hiddenOfficer,coreAnalysis).direction==='neutral', 'an unexposed non-command officer is not a newly used load; its damaged hidden root alone must not block otherwise unchanged main use');
assert(findTask(damagedOfficer,'carry-officer').state===null && rules.compare(matchingHurt,damagedOfficer,coreAnalysis).direction==='pending', 'a clear rooted officer whose only root is attacked remains a consequential unknown');
const mixedWithUnknownKill=coreFixture('伤',{'比肩':{position:3},'伤官':{position:0},'正印':{position:1,command:true},'正官':{position:2},'七杀':{position:0,damaged:true}},'强');
const mixedWithRisk=rules.compare(matchingHurt,mixedWithUnknownKill,coreAnalysis);
assert(findTask(mixedWithUnknownKill,'handle-kill').state===1 && mixedWithRisk.direction==='mixed', 'a clean same-element officer root also supports killing; its damaged own-polarity root cannot fabricate an unknown or erase independent mixed effects');
const mixedWithRemovedRisk=rules.compare(mixedWithUnknownKill,matchingHurt,coreAnalysis);
assert(mixedWithRemovedRisk.direction==='mixed', 'the same new or removed nondecisive unknown must preserve mixed effects on reversed comparison');
// Both water-polarity roots are now actually damaged: no clean sibling can
// silently defeat this independent consequential-uncertainty scenario.
const uncertainMixedBase=coreFixture('伤',{'比肩':{position:3},'伤官':{position:0},'正印':{position:1,command:true},'正官':{position:2,damaged:true},'七杀':{position:0,damaged:true}},'强');
const improvedButUncertain=coreFixture('伤',{'比肩':{position:3},'伤官':{position:0},'正印':{position:1},'正官':{position:2,damaged:true},'七杀':{position:0,damaged:true}},'弱');
const noConfirmedDirection=rules.compare(uncertainMixedBase,improvedButUncertain,coreAnalysis);
assert(noConfirmedDirection.direction==='pending' && !noConfirmedDirection.tendency, 'a numerical strong-to-weak change with only uncertain paths must not fabricate a confirmed partial direction');
// 去掉已确认的官杀并用破点有确定改善面；原先受损根路的其他得失仍不能定。
const improvingWithRisk=rules.compare(uncertainMixedBase,matchingHurt,coreAnalysis);
assert(improvingWithRisk.direction==='pending' && improvingWithRisk.tendency==='positive', 'confirmed improvement plus consequential unknowns may offer a provisional tendency while keeping the verdict pending');
assert(improvingWithRisk.assessment==='conditional' && rules.label(improvingWithRisk,'previous').label==='已有改善因素' && improvingWithRisk.summary.includes('整体表现还取决于'), 'partial improvement must not claim an overall rise when consequential uncertainty remains');
const worseningWithRisk=rules.compare(matchingHurt,uncertainMixedBase,coreAnalysis);
assert(worseningWithRisk.tendency==='negative' && rules.label(worseningWithRisk,'previous').label==='已有受阻因素', 'reversing the comparison must reverse the confirmed partial effect');
assert(!rules.compare(mixedWithUnknownKill,matchingHurt,{monthCommand:{ambiguous:true}}).tendency && !rules.compare(ordinaryCarry,thresholdCarry,coreAnalysis).tendency, 'month-use ambiguity and numerical threshold changes cannot manufacture provisional directions');
const addedActualUnknown=rules.compare(matchingHurt,uncertainMixedBase,coreAnalysis),removedActualUnknown=rules.compare(uncertainMixedBase,matchingHurt,coreAnalysis);
assert(addedActualUnknown.reservations.some(x=>x.taskId==='handle-kill'&&x.conditions.includes('变化前：未见对应实际作用')) && removedActualUnknown.reservations.some(x=>x.taskId==='handle-kill'&&x.conditions.includes('变化后：未见对应实际作用')), 'new or removed genuine unknowns expose the actual missing side, not an imaginary missing sibling root');

for(const specialType of ['化气格','专旺格']) {
  const name=specialType==='化气格'?'化气格：甲己化土':'专旺格：曲直格';
  const target=specialType==='化气格'?'土':'木';
  const analysis={monthCommand:{ambiguous:false},specialPatternQualification:{name,type:specialType,target,source:['项目既有严格资格及《滴天髓阐微》对应篇']}};
  const following=coreFixture('财',specialType==='化气格'?{'正财':{position:1,command:true}}:{'比肩':{position:1,command:true}},'中和',false);
  following.currentSpecialDetail={name,type:specialType,target,flowChecks:[{label:'资格后的顺势链',met:true}]};
  assert(findTask(following,'special-flow',analysis).state===1, specialType+' needs rooted clear target beyond the qualification switch');
  const qualifiedButRootless=coreFixture('财',specialType==='化气格'?{'正财':{position:1,roots:0}}:{'比肩':{position:1,roots:0}},'中和',false);
  qualifiedButRootless.currentSpecialDetail=following.currentSpecialDetail;
  assert(findTask(qualifiedButRootless,'special-flow',analysis).state===null, specialType+' must not turn a qualification flag into confirmed flow without roots');
  const broken=coreFixture('财',{'正官':{position:1,command:true},'比肩':{position:2}},'中和',specialType==='化气格');
  assert(findTask(broken,'special-reversal',analysis).state===-1, specialType+' loss needs actual restored origin root or effective opposition');
}
const footLimited=coreFixture('财',{'比肩':{position:2,stem:'甲'},'偏财':{position:4,stem:'戊',hiddenIndex:2}},'中和');
footLimited.pillars.luck='戊寅';footLimited.profiles['偏财'].branchEntries[0].branch='寅';
assert(findTask(footLimited,'carry-wealth').state===null && findTask(footLimited,'carry-wealth').conditions.some(x=>x.includes('截脚')), 'internal restraint of the sole rooted temporal wealth requires review, without a fixed penalty');
const footBridged=coreFixture('财',{'比肩':{position:2,stem:'甲'},'偏财':{position:4,stem:'戊',hiddenIndex:2},'食神':{position:0,stem:'丙',hiddenIndex:1}},'中和');
footBridged.pillars.luck='戊寅';footBridged.profiles['偏财'].branchEntries[0].branch='寅';footBridged.profiles['食神'].branchEntries[0].branch='寅';
assert(findTask(footBridged,'carry-wealth').state===1 && findTask(footBridged,'carry-wealth').conditions.some(x=>x.includes('透清通根之火承接')), 'rooted clear fire can bridge wood restraining temporal earth; the pillar name alone is not bad');
assert(rules.label({direction:'mixed'},'annual').label==='吉凶并见' && rules.label({direction:'mixed'},'increment').label==='利弊并存', 'annual overall and annual increment must use their respective mixed labels');
assert(!engine.includes('function outlookElements(') && !engine.includes('var ranks={已破:0'), 'the old generic element and rank direction shortcuts must be removed');
const missingOutlook = outlookEngine.evaluateLuckOutlook({ pillars: { day: '甲子' }, dayStem: '甲' }, '壬寅', null, outlookYearRows);
assert(missingOutlook.natal.direction === 'pending' && missingOutlook.natal.assessment==='input-error' && missingOutlook.years.every((year) => year.annual.label === '资料需核对'), 'missing natal inputs need a specific input issue, never a neutral or directional verdict');
const mismatchedOutlook = outlookEngine.evaluateLuckOutlook(outlookConditionChart, '壬寅', 'not-a-pillar', [{ year: 2026, gz: '甲子' }]);
assert(mismatchedOutlook.previous.label === '资料需核对' && mismatchedOutlook.years[0].annual.label === '资料需核对', 'invalid previous luck or mismatched annual stem-branch must remain explicit input issues');
assert(JSON.stringify(outlookConditionChart) === outlookInputSnapshot, 'outlook evaluation must not mutate its chart');
const staleScoreChart = Object.assign({}, outlookConditionChart, { scores: { 木:100,火:100,土:0,金:0,水:100 }, patternAnalysis: { mainPattern:'stale' } });
assert(JSON.stringify(outlookEngine.evaluateLuckOutlook(staleScoreChart, '壬寅', '庚午', outlookYearRows)) === JSON.stringify(outlookHelp), 'saved scores or saved analysis must not become the natal comparison baseline');
const natalBeforeOutlook = JSON.stringify(outlookEngine.analyzePattern(wenZhenLuckChart));
const realChartOutlook = outlookEngine.evaluateLuckOutlook(wenZhenLuckChart, '甲子', '癸亥', outlookYearRows);
assert(realChartOutlook.years.length === 10 && JSON.stringify(outlookEngine.analyzePattern(wenZhenLuckChart)) === natalBeforeOutlook, 'a real calendar reference should expose ten annual results without changing its natal analysis');
vm.runInContext('GZ60', scriptContext).forEach((gz) => {
  const reviewed = outlookEngine.evaluateLuckOutlook(wenZhenLuckChart, gz, '癸亥', [{ year: 2026, gz: '丙午' }]);
  assert(!/undefined|NaN/.test(JSON.stringify(reviewed)) && ['偏吉','平','偏凶','吉凶并见','可能偏吉','可能偏凶','已有有利因素','已有不利因素','已有吉凶并见','分条件看','暂缺整体结论'].includes(reviewed.years[0].annual.label), `complete calendar chart should produce finite, explicit evidence or a stated uncertainty for ${gz}`);
  if(reviewed.years[0].annual.direction==='pending')assert(reviewed.years[0].annual.uncertainty.length>0, 'pending needs the actual missing condition');
  const reversed = outlookEngine.evaluateLuckOutlook(wenZhenLuckChart, '癸亥', gz, []);
  const opposite = { positive:'negative', negative:'positive', neutral:'neutral', mixed:'mixed', pending:'pending' };
  assert(reversed.previous.direction === opposite[reviewed.previous.direction], `swapping the same two independent luck states must reverse improvement/deterioration for ${gz}`);
});
const annualWeighted = outlookEngine.strengthScore('甲', Object.assign({}, outlookConditionChart.pillars, { luck: '壬寅', flowYear: '丙午' }), { outlookFlowYear: true });
assert(annualWeighted.parts.some((item) => item.label === '流年干') && annualWeighted.parts.some((item) => item.label === '流年支') && Math.abs(annualWeighted.parts.reduce((sum, item) => sum + item.weight, 0) - 100) < 0.00001, 'annual carrying review must include both annual components on a normalized scale');
const legacyWeighted = outlookEngine.strengthScore('甲', Object.assign({}, outlookConditionChart.pillars, { luck: '壬寅', flowYear: '丙午' }));
assert(!legacyWeighted.parts.some((item) => item.label === '流年干'), 'the new annual weight option must not silently change existing strength callers');

scriptContext.currentBazi = wenZhenLuckChart;
scriptContext.restoreLuckSelection({ luck: 1, year: 0, month: null });
const selectedOutlookContext = scriptContext.getSelectedLuckContext(wenZhenLuckChart);
const selectedOutlook = scriptContext.getSelectedLuckOutlook(wenZhenLuckChart, selectedOutlookContext);
const summaryBeforeMonth = JSON.stringify(selectedOutlook);
const selectedOutlookHtml = scriptContext.renderLuckDetail(wenZhenLuckChart, selectedOutlookContext);
assert(selectedOutlookHtml.includes('本运对原局') && selectedOutlookHtml.includes('较上一运') && selectedOutlookHtml.includes('年度综合') && selectedOutlookHtml.includes('该流年对本运的影响'), 'detail must expose all four comparison scopes');
{ // Standard year card rows: 比上一年 (hidden when the two years' labels disagree) then 在这步大运的十年中; professional keeps 比这十年平常 only when the engine has a conclusion.
  const std=[...selectedOutlookHtml.matchAll(/data-standard-copy>((?:(?!<\/div>)[\s\S])*)<\/div>/g)].map(m=>m[1]).join('\n');
  assert(selectedOutlook.years[0].previousYear, 'first year of a later decade compares with last year under the previous decade');
  assert(/在这步大运的十年中：(顺|平稳|有起有落|难)，[^<]*的一年</.test(std) && (!std.includes('比上一年：') || std.indexOf('比上一年：') < std.indexOf('在这步大运的十年中：')), 'standard rows: 比上一年 above 在这步大运的十年中');
  assert(!/比上一年：(更顺|更难|差不多|有升有降)</.test(selectedOutlookHtml) && !selectedOutlookHtml.includes('比这十年大运的常态') && !/比这十年平常：(当前作用重点|待判|暂缺)/.test(selectedOutlookHtml), 'new wording only; no odd no-conclusion rows');
  assert(!/>[^<]*年比这十年平常</.test(selectedOutlookHtml), 'comparison card renamed');
  const ctxV = { yearIndex: 1, luckIndex: 1, luck: selectedOutlookContext.luck, flowYear: selectedOutlookContext.years[1] };
  for (const [now, prev, dir, want] of [['positive','positive','negative','没去年那么顺'],['negative','negative','positive','比去年轻松一些'],['positive','negative','negative',''],['negative','negative','negative','比去年更难'],['mixed','mixed','neutral','和去年差不多']]) {
    const fake = { natal: selectedOutlook.natal, years: [{ annual: { direction: prev, evidence: [], reservations: [] } }, { annual: { direction: now, evidence: [], reservations: [] }, previousYear: { direction: dir, evidence: [], reservations: [] } }] };
    assert(scriptContext.outlookYearVsLastText(wenZhenLuckChart, ctxV, fake) === want, 'year-vs-last wording '+now+'/'+prev+'/'+dir);
  }
  scriptContext.restoreLuckSelection({ luck: 0, year: 0, month: null });
  const firstCtx = scriptContext.getSelectedLuckContext(wenZhenLuckChart), firstHtml = scriptContext.renderLuckDetail(wenZhenLuckChart, firstCtx);
  assert(!scriptContext.getSelectedLuckOutlook(wenZhenLuckChart, firstCtx).years[0].previousYear && !firstHtml.includes('比上一年：'), 'the very first year has no previous year row');
  scriptContext.restoreLuckSelection({ luck: 1, year: 0, month: null });
}
assert(selectedOutlookHtml.includes('交运边界年份') && selectedOutlookHtml.includes('以交运日期为界'), 'the first selected year must disclose the boundary-year scope');
assert((scriptContext.renderLuckSelector(wenZhenLuckChart, selectedOutlookContext).match(/fortune-outcome/g) || []).length === 10, 'each annual button should expose a textual outcome');
scriptContext.luckSelection.month = 3;
assert(JSON.stringify(scriptContext.getSelectedLuckOutlook(wenZhenLuckChart, scriptContext.getSelectedLuckContext(wenZhenLuckChart))) === summaryBeforeMonth, 'month selection must not change any luck or annual verdict');
scriptContext.luckSelection.year = 4;
const changedYearOutlook = scriptContext.getSelectedLuckOutlook(wenZhenLuckChart, scriptContext.getSelectedLuckContext(wenZhenLuckChart));
assert(JSON.stringify(changedYearOutlook.natal) === JSON.stringify(selectedOutlook.natal) && JSON.stringify(changedYearOutlook.previous) === JSON.stringify(selectedOutlook.previous), 'year selection must not change either decade comparison');
const selectedOutlookText = scriptContext.selectedLuckContextText(wenZhenLuckChart);
assert(selectedOutlookText.includes('本运对原局 ' + scriptContext.outlookDisplayView(selectedOutlook.natal).label) && selectedOutlookText.includes('较上一运 ' + scriptContext.outlookDisplayView(selectedOutlook.previous).label) && selectedOutlookText.includes('年度综合 ' + scriptContext.outlookDisplayView(selectedOutlook.years[4].annual).label) && selectedOutlookText.includes('AI只解释依据，不改写标签'), 'AI context must carry the same selected labels and rule authority as the page');
scriptContext.restoreLuckSelection({ luck: 0, year: 0, month: null });
const firstSelectionContext = scriptContext.getSelectedLuckContext(wenZhenLuckChart);
assert(scriptContext.getSelectedLuckOutlook(wenZhenLuckChart, firstSelectionContext).previous.label === '无上一柱可比较', 'selection restores must compare to chronology, not the last clicked luck');
const otherChart = Object.assign({}, wenZhenLuckChart, { pillars: { year: '庚午', month: '辛巳', day: '壬申', hour: '癸卯' }, dayStem: '壬' });
const otherOutlook = scriptContext.getSelectedLuckOutlook(otherChart, scriptContext.getSelectedLuckContext(otherChart));
assert(otherOutlook !== selectedOutlook && JSON.stringify(scriptContext.getSelectedLuckOutlook(wenZhenLuckChart, selectedOutlookContext)) === summaryBeforeMonth, 'single-entry cache must not leak across charts or restore a wrong luck');
const hostileOutlookBox = scriptContext.renderOutlookBox('<img src=x>', { label: '待判', direction: 'pending', evidence: [{ direction: 'neutral', text: '<script>x</script>' }], reservations: [], uncertainty: [], life: [] });
assert(!hostileOutlookBox.includes('<script>') && hostileOutlookBox.includes('&lt;img'), 'new evidence rendering must escape labels and prose');
assert(selectedOutlookHtml.includes('<summary>前后比较细节</summary>') && selectedOutlookHtml.includes('<summary>关系与时间口径</summary>'), 'full reasoning and repeated technical context should be collapsed by default');
const conciseOutlookBox=scriptContext.renderOutlookBox('较上一运',rules.label(improvingWithRisk,'previous'));
assert(conciseOutlookBox.includes('助力倾向')&&conciseOutlookBox.includes('data-assessment="conditional"')&&!/取决于|变化前：|尚未确认/.test(conciseOutlookBox),'compatibility conditional output keeps its tendency and evidence limits, with no debug prose');
const conditionalAiContext=scriptContext.outlookContextText('较上一运',rules.label(improvingWithRisk,'previous'));
assert(conditionalAiContext.includes('助力倾向')&&!/变化前：|变化后：|取决于/.test(conditionalAiContext),'AI-facing public reading shares the same tendency without console logs; full uncertainty remains in engine review');
assert(rules.compare(noUsablePath,noUsablePath,coreAnalysis).assessment==='unsupported' && rules.label(rules.compare(noUsablePath,noUsablePath,coreAnalysis),'previous').label==='暂缺整体结论', 'a genuine rule-coverage gap cannot masquerade as conditional analysis or a neutral verdict');
const loadedOutlookEngine=scriptContext.BaziEngine;
scriptContext.BaziEngine=undefined;scriptContext.selectedLuckOutlookCache=null;
const unavailableEngineOutlook=scriptContext.getSelectedLuckOutlook(wenZhenLuckChart,firstSelectionContext);
assert(unavailableEngineOutlook.natal.assessment==='engine-error' && unavailableEngineOutlook.natal.label==='暂无法计算' && unavailableEngineOutlook.natal.summary.includes('刷新'), 'engine load failure needs a recovery instruction, not a metaphysical verdict');
scriptContext.BaziEngine=loadedOutlookEngine;scriptContext.selectedLuckOutlookCache=null;

async function checkBaziRecordActions() {
  // Exercise the real controller/storage functions without a network request or user records.
  const nodes=new Map(),storage=new Map(),alerts=[],confirmations=[];
  let allowConfirm=true,failWrites=false,failReads=false,apiKey='test-key',requests=0;
  const node=id=>{
    if(!nodes.has(id))nodes.set(id,{value:'',checked:false,hidden:false,disabled:false,innerHTML:'',textContent:'',style:{},
      classList:{toggle(){},add(){},remove(){}},focus(){},scrollIntoView(){},remove(){},
      querySelector(){return this.innerHTML.includes('class="fact-check"')?{}:null}});
    return nodes.get(id);
  };
  scriptContext.document={getElementById:node,querySelectorAll:()=>[],querySelector:()=>({value:'男'})};
  scriptContext.window={scrollTo(){},matchMedia:()=>({matches:true})};
  scriptContext.localStorage={getItem(key){if(failReads)throw new Error('storage denied');return storage.get(key)||null},setItem(key,value){if(failWrites)throw new Error('quota');storage.set(key,String(value))}};
  scriptContext.alert=message=>alerts.push(message);
  scriptContext.confirm=message=>{confirmations.push(message);return allowConfirm};
  scriptContext.getApiKey=()=>apiKey;
  scriptContext.setInterval=()=>1;scriptContext.clearInterval=()=>{};
  const profile=name=>scriptContext.BaziEngine.createBaziProfile({person:name,gender:'男',input:{year:1998,month:10,day:10,hour:1,minute:50},useTrueSolar:false});
  let nextChart=profile('记录甲');
  scriptContext.calculateBazi=()=>JSON.parse(JSON.stringify(nextChart));
  scriptContext.currentBazi=null;scriptContext.activeBaziRecordId=null;scriptContext.aiHistory=[];
  scriptContext.editingActiveRecord=false;scriptContext.baziRecordSaveFailed=false;
  node('aiMode').value='brief';node('btnAi').textContent='AI 分析';node('btnAiFollowup').textContent='继续问';
  const records=()=>JSON.parse(storage.get(scriptContext.BAZI_RECORDS)||'[]');
  const saved=id=>records().find(item=>item.id===id);

  node('autoSaveBuild').checked=true;
  assert(scriptContext.buildBazi()===true && records().length===1 && node('btnSaveChart').hidden, 'successful build auto-save must hide the redundant manual save entry');
  const firstId=scriptContext.activeBaziRecordId;
  const emptyPanel=scriptContext.renderAiPanel();
  assert(!emptyPanel.includes('id="btnSaveBazi"') && emptyPanel.includes('id="aiFollowup" hidden') && emptyPanel.includes('id="aiHistoryTools" hidden'), 'before the first answer, redundant AI save and continuation tools must not clutter the panel');
  node('autoSaveBuild').checked=false;
  scriptContext.newBaziChart();nextChart=profile('记录乙');scriptContext.buildBazi();
  assert(records().length===1 && !scriptContext.activeBaziRecordId && !node('btnSaveChart').hidden, 'unchecked charting must retain manual save without creating a record');
  allowConfirm=false;scriptContext.newBaziChart();
  assert(scriptContext.currentBazi.person==='记录乙', 'canceling new must preserve an unsaved chart');
  allowConfirm=true;
  assert(scriptContext.saveBaziRecord() && records().length===2 && node('btnSaveChart').hidden, 'manual save must remain available and hide only after success');
  const secondId=scriptContext.activeBaziRecordId;
  assert(secondId!==firstId && scriptContext.saveBaziRecord() && records().length===2, 'saving again must update the same record');

  scriptContext.newBaziChart();nextChart=profile('记录丙');scriptContext.buildBazi();
  node('aiQuestion').value='首问';apiKey='';
  await scriptContext.analyzeBazi();
  assert(records().length===2, 'canceling API-key entry must not generate an empty AI record');
  apiKey='test-key';
  let finish;
  scriptContext.DeepSeekClient={requestFinal:()=>{requests++;return new Promise(resolve=>{finish=resolve})}};
  const firstAnswer=scriptContext.analyzeBazi(),thirdId=scriptContext.activeBaziRecordId;
  assert(records().length===3 && saved(thirdId).aiHistory.length===0 && scriptContext.baziAiPendingRequest, 'valid AI start must save an unchecked chart before requesting an answer');
  assert(node('aiFollowup').hidden && !node('aiResult').hidden && node('btnNewBazi').disabled, 'first-request loading must remain visible while continuation stays hidden');
  scriptContext.newBaziChart();scriptContext.editCurrentBaziInput();scriptContext.loadBaziRecord(firstId);scriptContext.deleteBaziRecord(thirdId);
  assert(scriptContext.activeBaziRecordId===thirdId && records().length===3, 'new, edit, load and active deletion must not steal or discard an in-flight answer');
  node('aiQuestion').value='还没发送的新问题';
  finish({answer:'第一条模拟回答'});await firstAnswer;
  assert(saved(thirdId).aiHistory.length===1 && records().length===3 && !node('aiFollowup').hidden && !node('btnNewBazi').disabled, 'the answer must attach to the same record and reveal continuation');
  assert(node('aiQuestion').value==='还没发送的新问题', 'a newly composed draft must survive completion of the preceding request');
  scriptContext.DeepSeekClient={requestFinal:async()=>{requests++;return {answer:'第二条模拟回答'}}};
  node('aiFollowupQuestion').value='追问';await scriptContext.analyzeBazi('aiFollowupQuestion');
  assert(saved(thirdId).aiHistory.length===2 && records().length===3 && saved(firstId).aiHistory.length===0, 'follow-up must append without duplicating or contaminating other records');

  const created=saved(thirdId).createdTs,confirmationCount=confirmations.length;
  scriptContext.editCurrentBaziInput();nextChart=JSON.parse(JSON.stringify(scriptContext.currentBazi));nextChart.person='记录丙改名';scriptContext.buildBazi();
  assert(saved(thirdId).aiHistory.length===2 && saved(thirdId).createdTs===created && confirmations.length===confirmationCount, 'name-only edits must preserve answers and creation time without a destructive confirmation');
  const customTitleItems=records();customTitleItems.find(item=>item.id===thirdId).name='自定义保存标题';storage.set(scriptContext.BAZI_RECORDS,JSON.stringify(customTitleItems));
  scriptContext.syncActiveBaziRecord();assert(saved(thirdId).name==='自定义保存标题', 'automatic conversation saves must retain a custom record title');
  scriptContext.editCurrentBaziInput();nextChart=scriptContext.BaziEngine.createBaziProfile({person:'记录丙改名',gender:'男',input:{year:1998,month:10,day:10,hour:2,minute:50},useTrueSolar:false});
  allowConfirm=false;
  assert(scriptContext.buildBazi()===false && scriptContext.aiHistory.length===2 && saved(thirdId).aiHistory.length===2, 'canceling birth replacement must leave both live and stored answers intact');
  allowConfirm=true;scriptContext.buildBazi();
  assert(scriptContext.activeBaziRecordId===thirdId && saved(thirdId).aiHistory.length===0 && saved(thirdId).createdTs===created, 'confirmed birth replacement must update the same record and clear only its old answers');

  scriptContext.newBaziChart();nextChart=profile('记录丁');scriptContext.buildBazi();
  failWrites=true;const beforeRequests=requests;node('aiQuestion').value='保存失败前的首问';
  await scriptContext.analyzeBazi();
  assert(requests===beforeRequests && scriptContext.baziRecordSaveFailed && !node('btnSaveChart').hidden && records().length===3, 'failed initial persistence must retain recovery and avoid a paid request whose record cannot be created');
  failWrites=false;assert(scriptContext.saveBaziRecord(), 'manual retry must recover initial save failure');
  const fourthId=scriptContext.activeBaziRecordId;
  scriptContext.DeepSeekClient={requestFinal:async()=>{requests++;failWrites=true;return {answer:'保存失败仍保留的模拟回答'}}};
  await scriptContext.analyzeBazi();
  assert(scriptContext.aiHistory.length===1 && saved(fourthId).aiHistory.length===0 && !node('btnSaveChart').hidden, 'failed answer persistence must retain the visible answer and a retry entry');
  assert(scriptContext.buildBaziReport().includes('保存失败仍保留的模拟回答'), 'report export must still recover an answer that could not be persisted');
  allowConfirm=false;scriptContext.newBaziChart();assert(scriptContext.aiHistory.length===1, 'unsaved answers must not disappear when new is canceled');
  failWrites=false;allowConfirm=true;scriptContext.saveBaziRecord();scriptContext.loadBaziRecord(fourthId);
  assert(scriptContext.aiHistory.length===1 && !scriptContext.renderAiPanel().includes('id="aiFollowup" hidden'), 'reopening the saved record must restore its conversation and follow-up entry');
  scriptContext.deleteBaziAiTurn(0);
  assert(saved(fourthId).aiHistory.length===0 && node('aiFollowup').hidden && node('aiHistoryTools').hidden, 'deleting the final answer must also hide continuation and empty history controls');

  scriptContext.newBaziChart();nextChart=profile('记录戊');scriptContext.buildBazi();
  scriptContext.DeepSeekClient={requestFinal:async()=>{requests++;throw new Error('模拟请求失败')}};
  await scriptContext.analyzeBazi();
  assert(scriptContext.aiHistory.length===0 && !node('aiResult').hidden && node('aiFollowup').hidden && node('aiResult').innerHTML.includes('模拟请求失败'), 'first-request failure must show the error without a fake answer or continuation entry');
  const goodRaw=storage.get(scriptContext.BAZI_RECORDS);storage.set(scriptContext.BAZI_RECORDS,'{broken');
  assert(!scriptContext.saveBaziRecord() && storage.get(scriptContext.BAZI_RECORDS)==='{broken', 'invalid existing storage must never be replaced by an automatically created record');
  storage.set(scriptContext.BAZI_RECORDS,goodRaw);
  failReads=true;assert(!scriptContext.saveBaziRecord() && storage.get(scriptContext.BAZI_RECORDS)===goodRaw, 'denied record reads must report failure and preserve stored data');failReads=false;
  const requestsBeforeKeyFailure=requests;
  scriptContext.getApiKey=()=>{throw new Error('key storage denied')};await scriptContext.analyzeBazi();
  assert(requests===requestsBeforeKeyFailure && alerts.some(text=>text.includes('API Key')), 'API-key storage failure must be visible and must not issue a request');
  assert(alerts.length>0 && saved(firstId) && saved(secondId), 'recovery messages must be surfaced while earlier records remain intact');
}
checkBaziRecordActions().then(()=>console.log('bazi page checks ok (including luck outlooks and record/AI actions)')).catch(error=>{console.error(error);process.exitCode=1});

// Conditional help cards must follow actual analyzed facts, and disappear without those facts.
const conditionalHelpSeen=new Set();
for(const source of [referenceBazi,conciseReferenceBazi,killSealBazi,transformBazi,...positivePhenomenonCases]){
  const d=scriptContext.refreshPatternAnalysis({...conciseReferenceBazi,pillars:source.pillars,dayStem:source.pillars.day[0]});
  const rendered=scriptContext.renderStructure(d),a=d.patternAnalysis;
  for(const [field,key] of [['elementPhenomena','phenomenon'],['positivePhenomena','positive-phenomenon'],['specialPatterns','special-pattern']]){
    assert(rendered.includes(`data-help="${key}"`)===!!(a[field]||[]).length,`${key} card and explanation follow actual conditional facts`);
    if((a[field]||[]).length)conditionalHelpSeen.add(key);
    if((a[field]||[]).length)assert(rendered.indexOf(`data-help="${key}"`)>rendered.indexOf('完整作用依据'), 'conditional help is in the reachable full-basis disclosure');
  }
}
assert(scriptContext.outlookTaskMeaning('handle-kill')==='七杀压力的食神制杀或印化杀承接路径','structured handle-kill translation must explain the specific domain rather than raw internal task label');

assert(conditionalHelpSeen.size===3,'real analyzed fixtures must exercise all three conditional help cards');
