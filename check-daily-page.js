const fs = require('fs');
const vm = require('vm');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const qimenSource = fs.readFileSync('qimen.js', 'utf8');
const baziSource = fs.readFileSync('bazi-engine.js', 'utf8');
const dailySource = fs.readFileSync('daily-engine.js', 'utf8');
const dailyHtml = fs.readFileSync('daily.html', 'utf8');
const context = { console, Date, Math, JSON };
vm.createContext(context);
vm.runInContext(qimenSource, context, { filename: 'qimen.js' });
vm.runInContext(baziSource, context, { filename: 'bazi-engine.js' });
vm.runInContext(dailySource, context, { filename: 'daily-engine.js' });

const engine = context.DailyFortuneEngine;
assert(engine && engine.version === 'DAILY-FORTUNE-2026.08-v3.1' && engine.outlookRevision === 'DAILY-FOCUS-2026.08-v3.1' && engine.promptVersion === 'DAILY-PROMPT-2026.08-v3.1' && engine.timelinePromptVersion === 'TIMELINE-PROMPT-2026.08-v2.1', 'daily engine should expose the V3.1 daily and timeline APIs');
assert(!dailySource.includes('evaluateLuckImpact'), 'flow day must not reuse the major-luck fifth-pillar evaluator');

const bazi = {
  person: '测试命主',
  gender: '男',
  pillars: { year: '庚午', month: '辛巳', day: '壬申', hour: '癸卯' },
  dayStem: '壬',
  dayElement: '水',
  strength: '中和',
  pattern: '参考格局',
  useful: { use: ['金', '水'], avoid: ['火'] },
  time: {
    used: { year: 1990, month: 5, day: 7, hour: 5, minute: 59 },
    input: { year: 1990, month: 5, day: 7, hour: 7, minute: 0 },
    enabled: true,
    location: { name: '云南省 曲靖市', lng: 103.805, lat: 25.4951 },
  },
};
const sourceRecord = { id: 'record-1', name: '测试命主 壬申日', bazi };
const profile = engine.profileFromBaziRecord(sourceRecord, '2026-08-16T01:00:00.000Z');
assert(profile.id.startsWith('daily-profile-') && profile.name === '测试命主', 'saved Bazi record should import as a stable daily profile');
assert(engine.profileFromBaziRecord({ ...sourceRecord, id: 'record-2', name: '另一标题' }, '2026-08-16T01:00:00.000Z').id === profile.id, 'same birth chart should map to one stable profile regardless of record title');

const original = JSON.stringify(bazi);
const refFacts = engine.buildDayFacts(bazi, '2000-01-01');
assert(refFacts.flowDay.gz === '戊午', `2000-01-01 should use the 戊午 reference day, got ${refFacts.flowDay.gz}`);
const facts = engine.buildDayFacts(bazi, '2026-08-16');
assert(facts.flowYear === 2026 && facts.temporal.some((item) => item.key === 'flowYear' && item.gz === '丙午'), 'daily facts should include the selected flow year');
assert(facts.temporal.some((item) => item.key === 'flowMonth' && item.gz === '丙申'), 'daily facts should include the flow month selected by its solar-term boundary');
assert(facts.backgroundRelations.some((item) => item.source === 'flowYear' && item.target === 'natalYear'), 'daily facts should preserve flow-year-to-natal background relations before applying the flow day');
assert(facts.flowDay && facts.flowDay.stemGod && facts.flowDay.branchGod, 'flow day should expose stem and branch ten-god facts');
assert(facts.temporalAnalysis && Array.isArray(facts.temporalAnalysis.effectiveRelations) && facts.temporalAnalysis.arbitration.ruleIds.includes('ZP-HC-04'), 'daily facts should include the shared arbitrated temporal interaction graph');
assert(facts.flowMonthBoundaryApproximate === false, 'daily facts should use the shared minute-calibrated flow-month boundary');
const beforeLiChun = engine.flowMonthForDate('2027-02-04', '壬');
assert(beforeLiChun.nearBoundary && beforeLiChun.nearestBoundary.boundaryKey === '2027-02-04' && beforeLiChun.nearestBoundary.startAt, 'the Lichun calendar day should warn about its exact boundary');
assert(JSON.stringify(bazi) === original, 'daily fact calculation must not mutate the natal chart');

const clash = engine.relationBetween({ key: 'flowDay', label: '流日', gz: '甲子' }, { key: 'natalDay', label: '原局日柱', gz: '庚午' });
assert(clash && clash.branch.includes('冲'), 'flow-day relation facts should include branch clashes');
assert(engine.branchRelations('子', '卯').includes('刑'), 'flow-day relation facts should include punishments');
assert(engine.branchRelations('未', '戌').includes('刑'), 'three-punishment pairs should use canonical branch ordering');
assert(engine.effectiveDateKey('2026-08-16', '22:59') === '2026-08-16', '22:59 should remain on the calendar day');
assert(engine.effectiveDateKey('2026-08-16', '23:00') === '2026-08-17', '23:00 should use the next fortune day');

const snapshot = engine.buildSnapshot(profile, '2026-08-16', '2026-08-15T10:00:00+08:00');
assert(snapshot.timing === 'pre-day' && snapshot.profileId === profile.id && snapshot.outlook.limit.includes('不改写原局格局'), 'snapshot should freeze a pre-day result with the short-term boundary');
assert(snapshot.outlook.primarySignal && snapshot.outlook.primarySignal.domain && snapshot.outlook.primarySignal.action && snapshot.outlook.primarySignal.ruleIds.length, 'V3.1 should expose one source-traceable primary signal');
assert(snapshot.outlook.lifeFocus && snapshot.outlook.lifeFocus.lifeDomain && snapshot.outlook.lifeFocus.scope && snapshot.outlook.lifeFocus.focus && snapshot.outlook.primarySignal.domain === snapshot.outlook.lifeFocus.lifeDomain, 'V3.1 should separate the real-life domain, affected scope, and concrete focus');
assert(snapshot.outlook.topEvidence.length <= 2 && snapshot.outlook.eventCandidates.length <= 2 && Array.isArray(snapshot.outlook.secondarySignals) && Array.isArray(snapshot.outlook.suppressedRelations), 'V3.1 should cap first-screen evidence and event candidates while retaining folded details');
assert(snapshot.outlook.primaryTheme.explanation && snapshot.outlook.primaryTheme.landing && snapshot.outlook.themes.length <= 2, 'the primary theme should explain its plain-language meaning and daily landing');
assert(/今天主要看.+，落在.+：.+，优先留意.+；.+。/.test(snapshot.outlook.summary) && !snapshot.outlook.summary.includes('今日动象偏重') && !snapshot.outlook.summary.includes('工作与日常秩序'), `the headline should combine the practical domain, scope, focus, and action, got ${snapshot.outlook.summary}`);
assert(/宜进|先整后进|宜守|暂缓/.test(snapshot.outlook.primarySignal.yiDirection) && snapshot.outlook.limit.includes('不自动起卦'), 'Zhouyi should only add a bounded action direction without generating a hexagram');
const mergedRelations = engine.buildSnapshot(profile, '2026-08-17').outlook.allRelations;
assert(mergedRelations.filter((item) => item.ruleId === 'ZP-HC-05' && item.status === '相害').length === 1 && mergedRelations.some((item) => item.text.includes('均见害')), 'the same branch action repeated across natal and temporal layers should merge into one relationship explanation');
const practicalDomainCases = { 比肩: '人际合作', 劫财: '人际合作', 食神: '人际合作', 伤官: '人际合作', 偏财: '财务', 正财: '财务', 七杀: '工作', 正官: '工作', 偏印: '学习文书', 正印: '学习文书' };
Object.entries(practicalDomainCases).forEach(([god, expected]) => {
  const outlook = engine.buildOutlook({ ...bazi, useful: { use: [], avoid: [] }, pattern: '', patternAnalysis: {} }, { flowDay: { key: 'flowDay', label: '流日', gz: '甲子', stemGod: god, branchGod: god, stemElement: '土', branchElement: '土' }, temporalAnalysis: { effectiveRelations: [], suppressedRelations: [], relations: [] }, temporal: [] });
  assert(outlook.lifeFocus.lifeDomain === expected, `${god} should map to ${expected}, got ${outlook.lifeFocus.lifeDomain}`);
});
const directDaySource = { key: 'flowDay', label: '流日', gz: '甲子', stemGod: '正印', branchGod: '正印', stemElement: '木', branchElement: '水' };
const directDayRelation = { kind: 'branch-relation', type: '冲', status: '相冲', priority: 60, ruleId: 'ZP-HC-04', sourceKey: 'flowDay', sourceLabel: '流日', sourceGz: '甲子', targetKey: 'day', targetLabel: '原局日柱', targetGz: '丙午', effective: true };
function directDayOutlook(useful) {
  return engine.buildOutlook({ ...bazi, useful, pattern: '', patternAnalysis: {} }, { flowDay: directDaySource, temporalAnalysis: { effectiveRelations: [directDayRelation], suppressedRelations: [], relations: [directDayRelation] }, temporal: [] });
}
assert(directDayOutlook({ use: [], avoid: [] }).lifeFocus.secondaryLifeDomain !== '亲密关系', 'a direct natal-day relation without independent structural or period corroboration must not imply an intimate relationship');
assert(directDayOutlook({ use: ['火'], avoid: [] }).lifeFocus.secondaryLifeDomain === '状态恢复', 'a corroborated cautious seal signal on the natal day may add recovery as a bounded secondary domain');
const moneyBazi = { ...bazi, pillars: { year: '甲寅', month: '辛未', day: '壬申', hour: '癸卯' } };
const moneyProfile = engine.profileFromBaziRecord({ id: 'money-record', name: '财务落点测试', bazi: moneyBazi });
const moneyOutlook = engine.buildSnapshot(moneyProfile, '2000-01-13').outlook;
assert(moneyOutlook.lifeFocus.lifeDomain === '财务' && moneyOutlook.lifeFocus.secondaryLifeDomain === '工作' && moneyOutlook.lifeFocus.scope === '工作事务', `庚午午未合 should land on finance inside work, got ${JSON.stringify(moneyOutlook.lifeFocus)}`);
assert(/付款|报销|金额/.test(moneyOutlook.lifeFocus.focus) && moneyOutlook.summary.includes('庚午流日的正财通过午未合牵动原局月柱') && !moneyOutlook.summary.includes('工作与日常秩序'), `庚午午未合 should explain its concrete financial landing, got ${moneyOutlook.summary}`);
assert(moneyOutlook.eventCandidates.filter((item) => item.domain === '财务').length === 1, 'same finance signal repeated through ten-god and relation evidence should merge into one event direction');
const sixtyOutlooks = Array.from({ length: 60 }, (_, index) => engine.buildSnapshot(profile, engine.addDays('2026-08-01', index)).outlook);
assert(new Set(sixtyOutlooks.map((item) => item.summary)).size >= 20 && new Set(sixtyOutlooks.map((item) => item.primarySignal.id)).size >= 20, 'sixty consecutive days should contain at least twenty evidence-driven headlines and primary signals');
assert(new Set(sixtyOutlooks.map((item) => [item.lifeFocus.lifeDomain, item.lifeFocus.scope, item.lifeFocus.focus].join('|'))).size >= 12 && sixtyOutlooks.every((item) => !item.summary.includes('工作与日常秩序')), 'sixty days should contain at least twelve practical domain-scope-focus combinations without pillar-location headlines');
assert(sixtyOutlooks.some((item) => item.primarySignal.evidenceStrength === '较强应事方向') && sixtyOutlooks.some((item) => item.primarySignal.evidenceStrength === '参考应事方向') && sixtyOutlooks.some((item) => item.primarySignal.evidenceStrength === '行动提醒' && item.eventCandidates.length === 0), 'event strength should distinguish strong, reference, and action-only days');
const avoidClash = engine.buildSnapshot(profile, '2026-08-06').outlook;
const usefulClash = engine.buildSnapshot(profile, '2026-08-08').outlook;
assert(avoidClash.primarySignal.direction === 'opportunity' && avoidClash.topEvidence[0].includes('见冲') && avoidClash.topEvidence[0].includes('火为原局慎用'), 'clashing a natal avoid element should be interpreted as a possible opening rather than an automatic bad event');
assert(usefulClash.secondarySignals.some((item) => item.direction === 'caution' && item.evidence.includes('见冲') && item.evidence.includes('金为原局')), 'clashing a natal useful element should point in the opposite, cautionary direction');
const weakOnly = engine.buildSnapshot(profile, '2026-09-02').outlook;
assert(weakOnly.primarySignal.ruleIds.includes('ZP-HC-06') && weakOnly.primarySignal.evidenceStrength === '行动提醒' && weakOnly.lifeFocus.lifeDomain === '生活安排' && weakOnly.lifeFocus.domainStrength === '仅行动提醒' && weakOnly.eventCandidates.length === 0, 'a single weak break relation should fall back to a life-arrangement action reminder');
const oldDay = { key: `${profile.id}|2026-08-16`, profileId: profile.id, date: '2026-08-16', snapshot: { version: 'DAILY-FORTUNE-2026.08-v3', generatedAt: '2026-08-15T10:00:00+08:00', date: '2026-08-16' }, entries: [{ id: 'event-old', category: '感情', text: '保留日记' }], entryRevision: 3, ai: [{ id: 'ai-old', promptVersion: 'DAILY-PROMPT-2026.08-v3', answer: '保留 AI 历史' }], createdAt: '2026-08-15T00:00:00.000Z' };
const migrated = engine.upgradeDayRecord(oldDay, profile, '2026-08-17T06:00:00.000Z');
assert(migrated.changed && migrated.record.snapshot.version === engine.version && migrated.record.snapshot.outlookRevision === engine.outlookRevision && migrated.record.snapshot.generatedAt === oldDay.snapshot.generatedAt && migrated.record.snapshot.recomputedFromVersion === oldDay.snapshot.version && migrated.record.snapshot.recomputedFromOutlookRevision === 'UNKNOWN' && migrated.record.snapshot.recomputedAt === '2026-08-17T06:00:00.000Z', 'V3 snapshots should recompute to V3.1 while preserving the original freeze time and recording provenance');
assert(migrated.record.entries[0].text === '保留日记' && migrated.record.entries[0].category === '感情' && migrated.record.entryRevision === 3 && migrated.record.ai[0].answer === '保留 AI 历史' && migrated.record.ai[0].engineStale, 'V3.1 migration should preserve diary categories and AI history while marking the old AI result stale');
const draftV31 = { ...oldDay, snapshot: { ...oldDay.snapshot, version: engine.version } };
assert(engine.upgradeDayRecord(draftV31, profile, '2026-08-17T06:05:00.000Z').changed, 'a draft V3.1 snapshot without the final practical-focus revision should recompute once');
const prompt = engine.buildAiPrompt(snapshot, [{ time: '23:10', valence: '坏事', category: '工作', text: '项目临时返工', includeInAi: true }], 'review');
assert(prompt.includes('大运、流年、流月阶段背景') && prompt.includes('2026-08-17') && prompt.includes('23点后换日') && prompt.includes('不得宣称命理已证明现实事件的科学因果'), 'review prompt should preserve hierarchical background, event timing, and causal limits');
assert(!engine.buildAiPrompt(snapshot, [{ text: '不发送', includeInAi: false }], 'review').includes('不发送'), 'AI prompt should include only explicitly selected diary entries');

const timeline = engine.buildTimelineYears(profile, '2026-08-17');
assert(timeline.years.length === 10 && timeline.bigLuck.startYear === 2020 && timeline.bigLuck.endYear === 2029 && timeline.currentFlowYear === 2026, `timeline should expose the current complete major-luck decade, got ${JSON.stringify(timeline.bigLuck)}`);
assert(timeline.years.every((node) => node.level === 'year' && node.startAt && node.endAt && node.lifeFocus && node.primarySignal && node.topEvidence.length <= 2 && node.eventCandidates.length === 0), 'every flow-year node should reuse V3.1 practical focus while staying at stage direction rather than event prediction');
const timelineMonths = engine.buildTimelineMonths(profile, 2026);
assert(timelineMonths.length === 12 && timelineMonths[0].term === '立春' && timelineMonths[11].term === '小寒' && timelineMonths.every((node) => node.level === 'month' && node.boundaryWarning.includes('交节')), 'a flow year should expose twelve exact solar-term months');
const currentMonth = timelineMonths.find((node) => Date.parse(node.startAt) <= Date.parse('2026-08-17T04:00:00.000Z') && Date.parse(node.endAt) > Date.parse('2026-08-17T04:00:00.000Z'));
const timelineDays = engine.buildTimelineDays(profile, currentMonth);
assert(timelineDays.length >= 28 && timelineDays.length <= 32 && new Set(timelineDays.map((node) => node.date)).size === timelineDays.length, 'a flow month should expose every noon-attributed date exactly once');
assert(timelineDays.every((node) => node.level === 'day' && node.signals.length && (node.signals.includes('平稳') || node.evidence.length)), 'every marked day should expose a local rule and evidence');
const timelinePrompt = engine.buildTimelineAiPrompt(profile, timeline.years.find((node) => node.flowYear === 2026), timelineMonths);
assert(timelinePrompt.includes('下级周期摘要') && timelinePrompt.includes('本地主判断（AI不得改写）') && timelinePrompt.includes('不包含用户日记正文') && !timelinePrompt.includes('项目临时返工'), 'period AI should receive the fixed local judgment without diary prose');
assert(engine.timelineFactsHash(timeline.years[0]) === engine.timelineFactsHash(timeline.years[0]), 'timeline fact hashes should be deterministic');

let invalidDateRejected = false;
try { engine.dateKey('2026-02-30'); } catch (error) { invalidDateRejected = /日期无效/.test(error.message); }
assert(invalidDateRejected, 'invalid dates should be rejected');

assert(/href="index\.html">奇门<\/a><a href="bazi\.html">八字<\/a><a href="liuyao\.html">六爻<\/a><a href="ziwei\.html">紫微<\/a><a href="daily\.html" aria-current="page">日运<\/a>/.test(dailyHtml), 'daily page should expose the unified five-module navigation');
assert(dailyHtml.includes('id="profileCreateForm"') && dailyHtml.includes('onsubmit="createDailyProfile(event)"') && dailyHtml.includes('建立日运档案'), 'daily page should create a profile without leaving the module');
assert(dailyHtml.includes("DailyFortuneEngine.profileFromBaziRecord(record)") && dailyHtml.includes("BaziEngine.analyzePattern(bazi)"), 'direct profile creation should reuse the canonical Bazi and daily profile engines');
assert(!dailyHtml.includes('href="bazi.html">去八字页新增') && !dailyHtml.includes('href="bazi.html">建立第一位命主'), 'profile creation controls must not redirect to the Bazi page');
assert(dailyHtml.includes('不会写入或改动八字页的保存记录') && dailyHtml.includes('没有写入八字页'), 'direct profile creation should state its storage boundary');
assert(dailyHtml.includes('src="daily-engine.js?v=20260817.4"') && dailyHtml.includes('src="bazi-engine.js?v=20260817.2"') && dailyHtml.includes('src="deepseek-client.js?v=20260814.1"'), 'daily page should load the V3.1 fact engine and shared AI client');
assert(dailyHtml.includes('var DAILY_DB_VERSION=2') && dailyHtml.includes("db.createObjectStore('profiles'") && dailyHtml.includes("db.createObjectStore('days'") && dailyHtml.includes("db.createObjectStore('timelineAi'") && dailyHtml.includes("timelineAi.createIndex('profileId'"), 'daily page should keep profiles, days, and period AI in the version-two IndexedDB schema');
assert(dailyHtml.includes('DailyFortuneEngine.buildSnapshot(activeProfile,date,isoNow())') && dailyHtml.includes("if(!day){"), 'daily page should freeze a snapshot only when a day is first opened');
assert(dailyHtml.includes('entryRevision') && dailyHtml.includes('item.engineStale') && dailyHtml.includes('解释核心已升级'), 'daily page should version diary feedback, mark old engine results stale, and collapse them by default');
assert(dailyHtml.includes('if(!activeDay.firstEntryAt)activeDay.firstEntryAt=now') && dailyHtml.includes("if(activeDay.firstEntryAt)return 'retroactive'"), 'a day that ever had diary events must never return to pre-event forecast mode');
assert(dailyHtml.includes('仅勾选允许发送的当日事件会连同固定盘面事实发送给 DeepSeek') && dailyHtml.includes("localStorage.getItem(PRIVACY_ACK_STORAGE)"), 'daily page should disclose external AI transfer before sending diary events');
assert(dailyHtml.includes('maxTokens:4096') && dailyHtml.includes("activeDay.key!==requestKey") && dailyHtml.includes("activeDay.entryRevision!==requestRevision"), 'daily AI should be bounded and reject stale responses');
assert(dailyHtml.includes('version:3') && dailyHtml.includes('timelineAi:await storeAll(\'timelineAi\')') && dailyHtml.includes('[1,2,3].indexOf(parsed.version)') && dailyHtml.includes('API Key 未包含') && dailyHtml.includes('engineVersion:DailyFortuneEngine.version'), 'daily export should omit the API key, include timeline AI, and import V1/V2/V3 backups');
assert(dailyHtml.includes('function upgradeStoredDailySnapshots') && dailyHtml.includes('DailyFortuneEngine.upgradeDayRecord') && dailyHtml.includes('snapshot.outlookRevision===DailyFortuneEngine.outlookRevision') && dailyHtml.includes('var DAILY_DB_VERSION=2'), 'daily page should automatically run the pure snapshot migration without changing the IndexedDB schema');
assert(dailyHtml.includes('现实落点') && dailyHtml.includes('id="themePanel"') && dailyHtml.includes('主要看') && dailyHtml.includes('发生在哪') && dailyHtml.includes('具体留意') && dailyHtml.includes('id="meaningFold"') && dailyHtml.includes('id="topEvidenceList"') && dailyHtml.includes('id="eventCandidateList"') && dailyHtml.includes('id="relationFold"'), 'today view should lead with the practical domain, scope, and focus while folding abstract doctrine and full relationships');
assert(dailyHtml.includes('<option>人际合作</option>') && dailyHtml.includes('<option>亲密关系</option>') && dailyHtml.includes('<option>学习文书</option>') && dailyHtml.includes('<option>状态恢复</option>') && dailyHtml.includes('<option>生活安排</option>') && dailyHtml.includes("var LEGACY_EVENT_CATEGORIES={人际:'人际合作',感情:'亲密关系',健康:'状态恢复'}") && dailyHtml.includes("LEGACY_EVENT_CATEGORIES[item.category]||item.category||'其他'"), 'new diary entries should use the practical taxonomy while legacy labels map only when edited');
assert(dailyHtml.includes('id="todayTab"') && dailyHtml.includes('id="timelineTab"') && dailyHtml.includes('function switchDailyView') && dailyHtml.includes('function renderTimeline'), 'daily page should expose Today and Timeline views');
assert(dailyHtml.includes("DailyFortuneEngine.buildTimelineYears(activeProfile,localToday())") && dailyHtml.includes('DailyFortuneEngine.buildTimelineMonths') && dailyHtml.includes('DailyFortuneEngine.buildTimelineDays'), 'timeline rendering should lazily build year, month, and day levels');
assert(dailyHtml.includes('预测线索与实际日记同轴呈现') && dailyHtml.includes('事前信号') && dailyHtml.includes('实际记录') && dailyHtml.includes('function openTimelineDay'), 'timeline should distinguish predictions from actual diary facts and keep a route into the full day');
assert(dailyHtml.includes('不会发送任何日记正文') && dailyHtml.includes('DailyFortuneEngine.buildTimelineAiPrompt') && dailyHtml.includes('function generateTimelineDayAi'), 'period AI should exclude diary prose while daily AI keeps its dedicated opt-in path');
assert(dailyHtml.includes("timelineState.openYear===year?null:year") && dailyHtml.includes("timelineState.openMonth===periodKey?null:periodKey") && dailyHtml.includes('aria-expanded'), 'timeline should provide single-path accessible folding controls');
assert(dailyHtml.includes('本地分钟级节气公式') && dailyHtml.includes('交界前后两小时'), 'daily and timeline UI should disclose the minute-boundary precision policy');
assert((dailyHtml.match(/<h1>/g) || []).length === 1 && dailyHtml.includes('class="skip-link"') && dailyHtml.includes('@media(prefers-reduced-motion:reduce)'), 'daily page should keep one H1, a skip link, and reduced-motion support');
assert(dailyHtml.includes('grid-template-columns:repeat(5,minmax(0,1fr))'), 'daily mobile navigation should fit all five modules');
[...dailyHtml.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].filter((match) => match[1].trim()).forEach((match) => new Function(match[1]));
console.log('daily page checks ok');
