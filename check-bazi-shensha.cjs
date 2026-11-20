'use strict';
// Run from the repository root: node check-bazi-shensha.cjs
// Label expectations come from IMPLEMENTATION-SPEC.md.
process.env.TZ = 'Asia/Shanghai';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ctx = vm.createContext({
  console,
  document: { addEventListener() {}, querySelectorAll: () => [], getElementById: () => ({ value: '', style: {}, classList: { toggle() {}, add() {}, remove() {} } }) },
  localStorage: { getItem: () => null },
});
for (const file of ['qimen.js', 'birth-time.js', 'china-locations.js', 'bazi-shensha.js', 'bazi-engine.js', 'bazi-glossary.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, file), 'utf8'), ctx, { filename: file });
}
const html = fs.readFileSync(path.join(__dirname, 'bazi.html'), 'utf8');
for (const [, script] of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) vm.runInContext(script, ctx);
const engine = ctx.BaziEngine;
const glossary = ctx.BaziGlossary;
const originalColumns = ['year', 'month', 'day', 'hour'];
const transitColumns = ['luck', 'flowYear', 'flowMonth'];
const location = { name: '云南省 曲靖市 麒麟区', lng: 103.805, lat: 25.4951 };
const profile = (year, month, day, hour, gender) => engine.createBaziProfile({
  input: { year, month, day, hour, minute: 0 }, location, gender, useTrueSolar: false, useDaylightSaving: false
});
const chart = (four, gender = '男') => ({
  pillars: Object.fromEntries(four.split(' ').map((gz, index) => [originalColumns[index], gz])), gender
});
const a0 = chart('壬申 戊申 甲子 己巳');
const a1 = profile(1993, 7, 9, 12, '男');
const a2Male = profile(1991, 2, 4, 18, '男');
const a2Female = profile(1991, 2, 4, 18, '女');
assert.deepEqual(Object.values(a1.pillars), ['癸酉', '己未', '辛卯', '甲午']);
for (const a2 of [a2Male, a2Female]) assert.deepEqual(Object.values(a2.pillars), ['辛未', '庚寅', '乙巳', '乙酉']);

const expectedNames = [
  '天乙贵人 太极贵人 文昌贵人 天厨贵人 福星贵人 国印贵人 金舆 流霞 红艳 禄神 羊刃',
  '桃花 华盖 驿马 将星 劫煞 亡神 灾煞 元辰 红鸾 天喜 披麻 吊客 寡宿 孤辰',
  '天医 天德贵人 天德合 月德贵人 月德合 德秀贵人 童子煞 十恶大败 魁罡 阴差阳错 孤鸾 天赦日 词馆 学堂 血刃 空亡',
].join(' ').split(' ');
assert.equal(new Set(expectedNames).size, 41);
const positive = new Set(), negative = new Set();
let assertions = 0;
const marks = (data, column, gz = data.pillars[column]) => Array.from(engine.shenShaForPillar(data, gz, column));
function expect(data, column, gz, yes, no) {
  const actual = marks(data, column, gz);
  for (const [wanted, set, word] of [[yes, positive, 'expected'], [no, negative, 'excluded']]) {
    for (const name of wanted) {
      assert.equal(actual.includes(name), set === positive, column + ' ' + (gz || data.pillars[column]) + ' ' + word + ' ' + name + ' | ' + actual.join('、'));
      set.add(name);
      assertions++;
    }
  }
  assert.equal(new Set(actual).size, actual.length, 'duplicate markers');
  assert.ok(actual.every(name => expectedNames.includes(name)), 'only the 41 specified names');
  return actual;
}
function exact(data, column, gz, wanted) {
  const yes = wanted.split(' ');
  const no = expectedNames.filter(name => !yes.includes(name));
  return expect(data, column, gz, yes, no);
}
// A1 日柱的将星、学堂、血刃按批准口径移除。
const a1Expected = {
  year: '红艳 禄神 血刃',
  month: '华盖 吊客 寡宿 天德合 月德合 空亡',
  day: '天乙贵人 文昌贵人 天厨贵人 福星贵人 流霞 灾煞 童子煞 阴差阳错',
  hour: '天乙贵人 桃花 红鸾 披麻 天医 天德贵人 月德贵人 德秀贵人 童子煞 空亡',
};
const a0Expected = {
  year: '太极贵人 月德贵人 德秀贵人',
  month: '太极贵人 德秀贵人 天德合 词馆',
  day: '太极贵人 福星贵人 德秀贵人 童子煞 将星',
  hour: '天乙贵人 太极贵人 文昌贵人 天厨贵人 德秀贵人 劫煞 披麻 学堂',
};
const results = {};
for (const [id, data, expected] of [['A0', a0, a0Expected], ['A1', a1, a1Expected]]) {
  results[id] = Object.fromEntries(originalColumns.map(column => [column, exact(data, column, undefined, expected[column])]));
}
results.A1.flowYear2011 = exact(a1, 'flowYear', '辛卯', '天乙贵人 文昌贵人 天厨贵人 福星贵人 流霞 将星 灾煞');
results.A1.luck = exact(a1, 'luck', '丁巳', '天乙贵人 太极贵人 福星贵人 国印贵人 驿马 德秀贵人 学堂');
results.A0.flowYear = exact(a0, 'flowYear', '丙午', '太极贵人 红艳 灾煞 吊客 德秀贵人');
results.A0.luck = exact(a0, 'luck', '辛亥', '亡神 孤辰 德秀贵人 空亡');
assert.equal(engine.getFlowYearGZ(2011), '辛卯');
ctx.currentBazi = a1;
const rows = ctx.getLuckData(a1).rows;
const index = rows.findIndex(row => row.gz === '丁巳');
assert.ok(index >= 0);
ctx.luckSelection.luck = index;
const yearIndex = ctx.getSelectedLuckContext(a1).years.findIndex(row => row.year === 2011);
assert.ok(yearIndex >= 0);
ctx.luckSelection.year = yearIndex;
const selected = ctx.getSelectedLuckContext(a1);
assert.equal(selected.flowYear.gz, '辛卯');
assert.equal(selected.luckRow.gz, '丁巳');

for (const [id, data] of [['A2男', a2Male], ['A2女', a2Female]]) {
  results[id] = {
    year: expect(data, 'year', undefined, [], ['华盖']),
    month: expect(data, 'month', undefined, data.gender === '女' ? ['元辰', '羊刃'] : ['羊刃'], data.gender === '女' ? [] : ['元辰']),
    day: expect(data, 'day', undefined, ['驿马'], []),
  };
}
expect(a2Male, 'luck', '甲子', ['元辰'], []);
expect(a2Female, 'luck', '甲子', [], ['元辰']);
for (const [gender, yes, no] of [['男', '己未', '己巳'], ['女', '己巳', '己未']]) {
  const natal = chart('甲子 丙寅 甲子 甲子', gender);
  expect(natal, 'luck', yes, ['元辰'], []);
  expect(natal, 'luck', no, [], ['元辰']);
}

// Distinct source positions remain distinguishable when the branches or full pillars match.
const dual = chart('甲子 丙子 甲子 甲子');
for (const column of ['year', 'month', 'day', 'hour', 'luck']) expect(dual, column, '甲子', ['将星'], []);
const hua = chart('戊辰 壬戌 戊辰 戊午');
for (const column of ['year', 'day', 'flowMonth']) expect(hua, column, '戊辰', ['华盖'], []);
expect(chart('戊辰 壬戌 乙卯 戊午'), 'year', undefined, [], ['华盖']);
expect(chart('乙卯 壬戌 戊辰 戊午'), 'day', undefined, [], ['华盖']);
expect(chart('壬申 戊申 乙卯 己巳'), 'year', undefined, [], ['灾煞']);
expect(chart('壬午 戊申 丙寅 己巳'), 'year', undefined, [], ['驿马']);
expect(chart('壬申 戊申 丙寅 己巳'), 'year', undefined, ['驿马'], []);
expect(chart('壬申 戊申 丙寅 己巳'), 'day', undefined, ['驿马'], []);
expect(chart('辛酉 戊申 甲子 己巳'), 'year', undefined, ['桃花'], []);
expect(chart('辛酉 戊申 甲午 己巳'), 'day', undefined, ['桃花'], []);
expect(chart('辛酉 戊申 甲午 己巳'), 'year', undefined, [], ['桃花']);

// Day-only labels repeat neither into a natal sibling nor into any luck column.
for (const [name, day, month, miss] of [
  ['十恶大败', '甲辰', '甲子', '丙辰'],
  ['魁罡', '庚辰', '甲子', '甲辰'],
  ['阴差阳错', '辛卯', '己未', '乙卯'],
  ['孤鸾', '戊午', '己未', '甲午'],
  ['天赦日', '甲午', '己未', '戊午'],
]) {
  const natal = chart(['壬申', month, day, day].join(' '));
  expect(natal, 'day', undefined, [name], []);
  const repeats = chart(['壬申', day, day, day].join(' '));
  expect(repeats, 'month', undefined, [], [name]);
  expect(natal, 'hour', undefined, [], [name]);
  for (const column of transitColumns) expect(natal, column, day, [], [name]);
  expect(chart(['壬申', month, miss, day].join(' ')), 'day', undefined, [], [name]);
}
for (const [day, good, bad] of [
  ['戊寅', '丙寅', '丁巳'], ['甲午', '己未', '丙寅'],
  ['戊申', '戊申', '己未'], ['甲子', '甲子', '壬戌'],
]) {
  expect(chart(['壬申', good, day, day].join(' ')), 'day', undefined, ['天赦日'], []);
  expect(chart(['壬申', bad, day, day].join(' ')), 'day', undefined, [], ['天赦日']);
}

const branchPillars = Object.fromEntries('甲子 乙丑 丙寅 丁卯 戊辰 己巳 庚午 辛未 壬申 癸酉 甲戌 乙亥'.split(' ').map(gz => [gz[1], gz]));
for (const pair of '寅丑 卯未 辰寅 巳申 午卯 未酉 申辰 酉戌 戌巳 亥亥 子午 丑子'.split(' ')) {
  const [month, hit] = pair;
  const natal = chart(['壬申', branchPillars[month], '甲子', branchPillars[hit]].join(' '));
  for (const [column, gz] of [['hour', undefined], ...transitColumns.map(column => [column, branchPillars[hit]])]) expect(natal, column, gz, ['血刃'], []);
  for (const [branch, gz] of Object.entries(branchPillars)) {
    if (branch !== hit) expect(natal, 'luck', gz, [], ['血刃']);
  }
}
expect(chart('丙寅 丁酉 丙午 己巳'), 'luck', '乙丑', ['国印贵人'], []);
expect(chart('丙寅 丁酉 丙午 己巳'), 'luck', '壬申', [], ['国印贵人']);
expect(chart('壬申 丁酉 丙午 己巳'), 'flowYear', '乙丑', ['国印贵人'], []);
expect(chart('丙寅 丁酉 甲子 己巳'), 'flowMonth', '乙丑', ['国印贵人'], []);
expect(chart('壬申 丁酉 乙巳 己巳'), 'flowYear', '庚午', ['天厨贵人'], ['羊刃']);
expect(a1, 'flowMonth', '壬申', ['羊刃'], []);

for (const [month, he, de] of ['卯巳申', '午寅亥', '酉亥寅', '子申巳']) {
  const natal = chart(['壬申', branchPillars[month], '甲子', branchPillars[he]].join(' '));
  expect(natal, 'hour', undefined, ['天德合'], ['天德贵人']);
  expect(natal, 'luck', branchPillars[de], ['天德贵人'], ['天德合']);
  expect(natal, 'flowYear', '戊辰', [], ['天德合']);
}
for (const [year, school, hall] of [
  ['辛巳','巳','申'], ['己亥','亥','寅'], ['甲申','申','亥'], ['戊申','申','亥'], ['丙寅','寅','巳'],
]) {
  const natal = chart([year, branchPillars[hall], '甲子', branchPillars[school]].join(' '));
  expect(natal, 'year', undefined, [], ['学堂', '词馆']);
  expect(natal, 'hour', undefined, ['学堂'], ['词馆']);
  expect(natal, 'month', undefined, ['词馆'], ['学堂']);
  expect(natal, 'flowYear', branchPillars[school], ['学堂'], ['词馆']);
  expect(natal, 'luck', branchPillars[hall], ['词馆'], ['学堂']);
  expect(natal, 'flowMonth', '甲子', [], ['学堂', '词馆']);
}
const doubleNayin = chart('壬申 戊申 甲子 己巳');
expect(doubleNayin, 'hour', undefined, ['学堂', '文昌贵人'], []);
for (const [year, month, seasonOnly, nayinOnly, miss] of [
  ['壬申','戊申','甲子','庚午','戊辰'],
  ['戊辰','丁巳','辛未','庚午','甲子'],
  ['丙子','丁酉','丙寅','癸酉','庚午'],
  ['丙寅','庚子','丁卯','甲戌','甲子'],
  ['戊寅','丁酉','甲子','戊辰','庚午'],
]) {
  const natal=chart([year, month, seasonOnly, nayinOnly].join(' '));
  expect(natal, 'day', undefined, ['童子煞'], []);
  expect(natal, 'hour', undefined, ['童子煞'], []);
  expect(chart([year, month, seasonOnly, miss].join(' ')), 'hour', undefined, [], ['童子煞']);
  for (const column of ['year', 'month', ...transitColumns]) {
    expect(natal, column, seasonOnly, [], ['童子煞']);
    expect(natal, column, nayinOnly, [], ['童子煞']);
  }
}

expect(a0, 'luck', '乙丑', ['天喜'], []);
expect(a0, 'luck', '戊辰', ['金舆'], []);
expect(a1, 'flowMonth', '庚午', ['空亡'], []);
expect(a1, 'flowMonth', '辛卯', [], ['空亡']);
assert.equal(engine.kongWang('甲午'), '辰巳');
assert.equal(engine.kongWang('辛卯'), '午未');
assert.equal(assertions, 904, 'all 904 label assertions executed');
assert.deepEqual([...positive].sort(), [...expectedNames].sort(), 'all 41 positive fixtures executed');
assert.deepEqual([...negative].sort(), [...expectedNames].sort(), 'all 41 negative fixtures executed');

const luckContext = { ...selected, flowMonth: { gz: '庚午' } };
const glossaryCtx = { snapshot: a1, luckContext };
assert.match(glossary.chartLine('空亡', glossaryCtx), /日柱辛卯，旬空午未.*月支未.*时支午.*所选流月支午/);
assert.match(glossary.chartLine('本旬空亡', glossaryCtx), /时柱甲午空辰巳.*所选流年辛卯空午未/);
assert.match(glossary.chartLine('阴差阳错', glossaryCtx), /^日柱有阴差阳错。$/);
assert.match(glossary.chartLine('将星', glossaryCtx), /^所选流年有将星。$/);
assert.match(glossary.chartLine('血刃', glossaryCtx), /^年柱有血刃。$/);
assert.match(glossary.chartLine('学堂', glossaryCtx), /^所选大运有学堂。$/);
assert.match(glossary.chartLine('词馆', glossaryCtx), /未见词馆/);
assert.ok(a1.patternAnalysis.classifiedClues.misc.includes('阴差阳错'));
assert.ok(a1.relations.includes('桃花在午') && a1.relations.includes('华盖在未') && a1.relations.includes('日空 午'));
assert.ok(a2Female.relations.includes('驿马在巳'));
const mainTable = ctx.renderPillarTable(a1, true);
assert.match(mainTable, /本旬空亡<\/th><td>午未<\/td><td>子丑<\/td>/);
const saved = ctx.BaziEngine;
ctx.BaziEngine = undefined;
for (const data of [a0, a1, a2Male, a2Female]) {
  const columns = [...originalColumns.map(column => [column, data.pillars[column]]), ['luck', '丁巳'], ['flowYear', '辛卯'], ['flowMonth', '庚午']];
  for (const [column, gz] of columns) assert.equal(ctx.shenShaForPillar(data, gz, column), saved.shenShaForPillar(data, gz, column).join('<br>'), 'fallback ' + column);
}
ctx.BaziEngine = { ...saved, shenShaForPillar: undefined };
assert.equal(ctx.renderPillarTable(a1, true), mainTable, 'fallback markers in the complete table with fixed luck data');
assert.deepEqual(ctx.BaziShenSha.birthRelations(a1), a1.relations, 'fallback relation and AI facts');
console.log(JSON.stringify(results, null, 2));
console.log('PASS: 41 labels with positive and negative fixtures, ' + assertions + ' label assertions, A0/A1/A2, both void rules, glossary, context-aware summary and fallback parity.');
