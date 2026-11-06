'use strict';
// Historical-clock normalization and the two actual engines; no personal records or AI.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const time = require('./birth-time.js');
global.self = global;
const iztro = require('./vendor/iztro/2.5.8/iztro.min.js');
const ziwei = require('./ziwei-engine.js');
const context = vm.createContext({ console });
for (const file of ['qimen.js', 'birth-time.js', 'bazi-engine.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, file), 'utf8'), context, { filename: file });
}
const bazi = context.BaziEngine;
const plain = value => JSON.parse(JSON.stringify(value));
const clock = (year, month, day, hour, minute = 0) => ({ year, month, day, hour, minute });
const location = { name: 'test', lng: 103.9936, lat: 24.8222 };
const raw = clock(1990, 7, 1, 0, 30), standard = clock(1990, 6, 30, 23, 30);

function timezoneCase() {
  const corrected = bazi.createBaziProfile({ input: raw, location, useTrueSolar: true, useDaylightSaving: true });
  const manuallyCorrected = bazi.createBaziProfile({ input: standard, location, useTrueSolar: true });
  assert.deepEqual(plain(corrected.time.used), plain(manuallyCorrected.time.used));
  assert.deepEqual(plain(corrected.pillars), plain(manuallyCorrected.pillars));
  assert.deepEqual(plain(bazi.luckStartInfo(corrected)), plain(bazi.luckStartInfo(manuallyCorrected)));
  const noSolar = bazi.createBaziProfile({ input: raw, useTrueSolar: false, useDaylightSaving: true });
  assert.deepEqual(plain(noSolar.time.used), standard);
  assert.deepEqual(plain(noSolar.pillars), plain(bazi.buildPillars(standard)));
  assert.equal(noSolar.time.daylightSavingMinutes, -60);
  const original = bazi.createBaziProfile({ input: raw, useTrueSolar: false });
  assert.deepEqual(plain(original.time.used), raw, 'omitted DST must preserve the entered clock');
  // Reconstruct from the saved original input, never subtract from an already-corrected used time.
  const restored = bazi.createBaziProfile({ input: noSolar.time.input, useTrueSolar: noSolar.time.enabled, useDaylightSaving: noSolar.time.daylightSaving });
  assert.deepEqual(plain(restored.time.used), standard);
  const input = { date: '1990-07-01', time: '00:30', gender: 'male', useDaylightSaving: true };
  const zw = ziwei.buildNatal(input);
  assert.equal(zw.engineInput.solarDate, '1990-06-30');
  assert.equal(zw.effective.clockTime, '23:30');
  assert.deepEqual(zw.natal, ziwei.buildNatal({ date: '1990-06-30', time: '23:30', gender: 'male' }).natal);
  const both = ziwei.buildNatal({ ...input, timeBasis: 'trueSolar', longitude: location.lng, confirmedTimeShift: true });
  const manual = ziwei.buildNatal({ date: '1990-06-30', time: '23:30', gender: 'male', timeBasis: 'trueSolar', longitude: location.lng, confirmedTimeShift: true });
  assert.deepEqual(both.engineInput, manual.engineInput);
  assert.deepEqual(both.natal, manual.natal);
  return { bazi: plain(corrected.time.used), pillars: plain(corrected.pillars), luck: plain(bazi.luckStartInfo(corrected)), ziwei: both.engineInput };
}

if (process.argv.includes('--timezone-case')) {
  process.stdout.write(JSON.stringify(timezoneCase()));
} else {
  const periods = [[1986,5,4,9,14],[1987,4,12,9,13],[1988,4,17,9,11],[1989,4,16,9,17],[1990,4,15,9,16],[1991,4,14,9,15]];
  for (const [y, sm, sd, em, ed] of periods) {
    assert.equal(time.daylightStatus(clock(y, sm, sd, 1, 59)).applicable, false);
    assert.throws(() => time.normalize(clock(y, sm, sd, 1, 59), true), { code: 'DST_OUTSIDE_PERIOD' });
    assert.throws(() => time.normalize(clock(y, sm, sd, 2), true), { code: 'DST_NONEXISTENT_TIME' });
    assert.throws(() => time.normalize(clock(y, sm, sd, 2, 59), true), { code: 'DST_NONEXISTENT_TIME' });
    assert.deepEqual(time.normalize(clock(y, sm, sd, 3), true).standard, clock(y, sm, sd, 2));
    assert.deepEqual(time.normalize(clock(y, sm, sd, 2, 30), false).standard, clock(y, sm, sd, 2, 30));
    assert.deepEqual(time.normalize(clock(y, em, ed, 1, 30), true).standard, clock(y, em, ed, 0, 30));
    assert.deepEqual(time.normalize(clock(y, em, ed, 1, 30), false).standard, clock(y, em, ed, 1, 30));
    assert.equal(time.daylightStatus(clock(y, em, ed, 1, 59)).repeated, true);
    assert.throws(() => time.normalize(clock(y, em, ed, 2), true), { code: 'DST_OUTSIDE_PERIOD' });
    assert.throws(() => time.normalize(clock(y, 1, 1, 12), true), { code: 'DST_OUTSIDE_PERIOD' });
    assert.throws(() => ziwei.buildNatal({ date: `${y}-${sm}-${sd}`, time: '02:30', gender: 'male', useDaylightSaving: true }), { code: 'DST_NONEXISTENT_TIME' });
    assert.throws(() => bazi.buildBirthTime(clock(y, sm, sd, 2, 30), location, false, true), { code: 'DST_NONEXISTENT_TIME' });
  }
  assert.throws(() => time.normalize(clock(1992, 7, 1, 12), true), { code: 'DST_OUTSIDE_PERIOD' });
  assert.deepEqual(time.shiftMinutes(clock(1988, 3, 1, 0, 30), -60), clock(1988, 2, 29, 23, 30));
  assert.deepEqual(time.shiftMinutes(clock(1991, 1, 1, 0, 30), -60), clock(1990, 12, 31, 23, 30));
  assert.deepEqual(time.normalize(raw, true).standard, standard);
  const lunar = iztro.astro.bySolar('1990-7-1', 0, 'male', true, 'zh-CN').rawDates.lunarDate;
  const lunarChart = ziwei.buildNatal({ calendarType: 'lunar', lunarDate: { year: lunar.lunarYear, month: Math.abs(lunar.lunarMonth), day: lunar.lunarDay, isLeap: lunar.isLeap }, time: '00:30', gender: 'male', useDaylightSaving: true });
  assert.deepEqual(lunarChart.engineInput, ziwei.buildNatal({ date: '1990-07-01', time: '00:30', gender: 'male', useDaylightSaving: true }).engineInput);
  const outputs = ['Asia/Shanghai', 'UTC', 'America/New_York'].map(TZ => execFileSync(process.execPath, [__filename, '--timezone-case'], { env: { ...process.env, TZ }, encoding: 'utf8' }));
  assert.equal(outputs[0], outputs[1]);
  assert.equal(outputs[0], outputs[2]);
  console.log('birth-time checks passed: six-year transitions, both engines, lunar/cross-date, restoration, three time zones');
}
