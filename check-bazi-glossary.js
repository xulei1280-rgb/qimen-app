'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const context = vm.createContext({ console });
for (const file of ['qimen.js', 'birth-time.js', 'bazi-shensha.js', 'bazi-engine.js', 'bazi-glossary.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, file), 'utf8'), context, { filename: file });
}
const g = context.BaziGlossary, e = context.BaziEngine;
assert.equal(require('./bazi-glossary.js').TERMS.length, g.TERMS.length, 'Node export');
assert.equal(new Set(g.TERMS.map(t => t.key)).size, g.TERMS.length, 'unique keys');
const forbidden = /可能|看条件|不明确|分情况|底气|上司|单位|管你的人/;
for (const t of g.TERMS) {
  assert.ok(g.GROUPS.includes(t.group), t.key + ' group');
  assert.ok(t.text.length > 5 && !forbidden.test(t.text), t.key + ' wording');
  for (const a of [t.key, ...t.aliases]) assert.equal(g.resolve(a), t.key, a + ' alias');
}
const source = fs.readFileSync(path.join(__dirname, 'bazi-glossary.js'), 'utf8');
assert.ok(!forbidden.test(source), 'glossary templates use approved wording');
const shenShaSource = fs.readFileSync(path.join(__dirname, 'bazi-shensha.js'), 'utf8');
const shenShaSection = shenShaSource.slice(shenShaSource.indexOf('function shenShaForPillar('), shenShaSource.indexOf('function birthRelations('));
const shenShaNames = [...shenShaSection.matchAll(/add\(out,'([^']+)'\)/g)].map(m => m[1]).filter(k => k !== '空亡');
assert.equal(shenShaNames.length, 45, '45 names in 神煞 group plus 空亡');
assert.deepEqual(Array.from(g.TERMS.filter(t => t.group === '神煞'), t => t.key).sort(), shenShaNames.sort());
for (const t of g.TERMS.filter(t => t.group === '神煞')) assert.ok(t.text.includes('传统') && !t.text.includes('不单独等于'), t.key + ' neutral marker');
const namedPatterns = g.TERMS.filter(t => t.group === '格局').slice(11);
assert.equal(namedPatterns.length, 33, '33 independently worded named patterns');
assert.equal(new Set(namedPatterns.map(t => t.text)).size, 33);
assert.ok(g.get('正官').text.startsWith('事业和规矩'));
for (const k of ['正印', '偏印', '印星']) assert.ok(g.get(k).text.includes('学问资历'));
assert.equal(g.resolve('剑锋金'), '纳音');
assert.equal(g.resolve('羊刃格'), '月刃格');
assert.equal(g.resolve('从食伤格'), '从格：从儿格');
assert.equal(g.resolve('不存在的术语'), null);
assert.ok(g.search('剑锋金').some(t => t.key === '纳音'));
assert.equal(g.search('神煞').filter(t => t.group === '神煞').length, 45);
for (const k of ['正官', '伤官', '七杀', '日主', '伤官格', '天乙贵人', '主用']) assert.ok(g.tokenize(k).some(t => t.key === k), k);
assert.equal(g.tokenize('伤官格')[0].key, '伤官格', 'longest match');
for (const s of ['配合', '顾忌', '生病', '药方', '强制', '忌冲合强弱衰病死药生制', '刑事伤害破坏']) assert.ok(g.tokenize(s).every(t => !t.key), s + ' prose protection');
for (const k of ['忌', '强', '弱', '衰', '病', '死', '墓', '绝', '胎', '养', '合', '冲', '刑', '害', '破']) assert.ok(g.tokenize(k, { token: true })[0].key, k + ' explicit token');
const d = e.createBaziProfile({ input: { year: 1993, month: 7, day: 14, hour: 8, minute: 40 }, useTrueSolar: false });
d.gender = '男'; d.patternAnalysis = e.analyzePattern(d);
const ctx = { snapshot: d };
const frozen = JSON.stringify(ctx);
assert.match(g.chartLine('日主', ctx), /丙火，日主(?:偏)?弱/);
assert.match(g.chartLine('正官', ctx), /年干癸/);
assert.match(g.chartLine('伤官格', ctx), /已破/);
assert.match(g.chartLine('主用', ctx), /木/);
assert.match(g.chartLine('佐用', ctx), /金、火/);
assert.match(g.chartLine('忌', ctx), /土/);
assert.match(g.chartLine('天乙贵人', ctx), /年柱/);
for (const n of ['剑锋金', '天上火', '山下火', '长流水']) assert.ok(g.chartLine('纳音', ctx).includes(n));
assert.match(g.chartLine('比肩', ctx), /没有比肩/);
assert.match(g.chartLine('正官格', ctx), /未按此格成立/);
assert.match(g.chartLine('从格', ctx), /未按从格成立/);
assert.match(g.chartLine('半合', ctx), /申辰/);
assert.match(g.chartLine('六合', ctx), /酉辰合金：合绊/);
assert.match(g.chartLine('冲', ctx), /未见/);
assert.match(g.chartLine('空亡', ctx), /辰巳.*时支辰/);
assert.match(g.chartLine('调候', ctx), /不改变主用、佐用、忌/);
for (const t of g.TERMS) {
  assert.ok(g.chartLine(t.key, ctx), t.key + ' chart coverage');
  assert.equal(g.chartLine(t.key, {}), '', t.key + ' no chart');
}
assert.equal(JSON.stringify(ctx), frozen, 'all glossary queries preserve chart and judgement data');
const lc = { luckRow: { gz: '乙卯', from: 34, to: 43 }, flowYear: { year: 2026, gz: '丙午' }, flowMonth: { term: '立春', dateLabel: '2/4', gz: '庚寅' }, evidence: ['已生成的日犯岁君提示'], patternShift: { kind: '待核结构' } };
assert.match(g.chartLine('流月', { ...ctx, luckContext: lc }), /立春.*庚寅/);
assert.equal(g.chartLine('日犯岁君', { ...ctx, luckContext: lc }), lc.evidence[0]);
assert.match(g.chartLine('岁运并临', { ...ctx, luckContext: lc }), /没有岁运并临提示/);
assert.match(g.chartLine('变格', { ...ctx, luckContext: lc }), /待核结构/);
assert.ok(g.aiQuestion('正官', g.chartLine('正官', ctx)).includes('年干癸'));
assert.ok(!g.renderCard(g.get('正官'), '', false).includes('在你的盘上'));
assert.ok(g.renderCard(g.get('正官'), g.chartLine('正官', ctx), true).includes('问 AI 详细讲讲'));
assert.ok(!g.renderCard(g.get('日主'), '<img src=x onerror=alert(1)>', true).includes('<img'), 'escape snapshot text');
const html = fs.readFileSync(path.join(__dirname, 'bazi.html'), 'utf8');
assert.ok(html.indexOf('src="bazi-glossary.js?v=shensha-20261122.2"') > html.indexOf('src="bazi-premium.js?'));
assert.ok(html.includes('bazi-premium.css?v=20261117.3'));
for (const reason of ['render', 'view', 'mode', 'reset']) assert.ok(html.includes(`dispatchBaziView('${reason}')`), reason + ' event');
assert.ok(html.includes("dispatchBaziView('luck-'+part)"));
assert.ok(html.includes("new CustomEvent('bazi:view',{detail:{snapshot:currentBazi,luckContext:luckContext,reason:reason}})"));
// Exercise the page bridge independently: previous-year comparisons must not leak into current facts.
let event;
const bridge = vm.createContext({
  window: { dispatchEvent(value) { event = value; } },
  CustomEvent: function (type, init) { this.type = type; this.detail = init.detail; },
  currentBazi: d,
  getSelectedLuckContext: () => ({ yearIndex: 0 }),
  selectedLuckOutlookCache: { value: { natal: { patternShift: { kind: '大运提示' } }, years: [{
    annual: { evidence: [{ text: '当前流年的岁运并临' }], patternShift: { kind: '年度提示' } },
    increment: { evidence: [{ text: '当前流年的日犯岁君' }] },
    previousYear: { evidence: [{ text: '上一年提示，不应混入' }], patternShift: { kind: '上一年结构' } }
  }] } }
});
vm.runInContext(html.slice(html.indexOf('function dispatchBaziView('), html.indexOf('function displayRole(')), bridge);
bridge.dispatchBaziView('test');
assert.equal(event.type, 'bazi:view');
assert.equal(event.detail.snapshot, d);
assert.equal(event.detail.luckContext.evidence.length, 2);
assert.equal(event.detail.luckContext.patternShift.kind, '年度提示');
assert.ok(event.detail.luckContext.evidence.every(t => !t.includes('上一年')));
bridge.currentBazi = null; bridge.dispatchBaziView('reset');
assert.equal(event.detail.snapshot, null); assert.equal(event.detail.luckContext, null);
const css = fs.readFileSync(path.join(__dirname, 'bazi-premium.css'), 'utf8');
assert.match(css, /\.bz-pop\{[^}]*z-index:80/);
console.log(`PASS bazi glossary: ${g.TERMS.length} entries; aliases, 33 named patterns, all 45 grouped shensha plus the distinct void entries, copy, chart facts, neutral absent states, short-word protection, read-only data, hooks and escaping.`);
