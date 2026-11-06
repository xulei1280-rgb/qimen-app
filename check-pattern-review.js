'use strict';
// PAT-215 reproducible diagnostics. No file writes, no personal-event truth labels.
const fs = require('fs');
const vm = require('vm');
const crypto = require('crypto');
const cp = require('child_process');
const assert = require('assert/strict');
const normalize = text => text.replace(/\r\n/g, '\n');
const source = normalize(fs.readFileSync('bazi-engine.js', 'utf8'));
const calendar = fs.readFileSync('qimen.js', 'utf8');
const hash = value => crypto.createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
function load(code) {
  const context = { console };
  vm.createContext(context);
  vm.runInContext(calendar, context, { filename: 'qimen.js' });
  vm.runInContext(code, context, { filename: 'bazi-engine.js' });
  return context.BaziEngine;
}
const current = load(source);
if (process.argv.includes('--baseline')) {
  const result = current.buildTheoreticalPatternBaseline();
  assert.equal(result.uniqueCount, 23916);
  assert.equal(JSON.stringify(result.histogram), JSON.stringify(current.theoreticalBaseline.histogram), 'rebuilt histogram must exactly match the shipped snapshot');
  for (const key of ['mean','standardDeviation','scoreRange','quantiles','candidateGradeCounts','gradeCounts','gradePercentages']) assert.equal(JSON.stringify(result[key]), JSON.stringify(current.theoreticalBaseline.stats[key]), 'rebuilt baseline statistic mismatch: ' + key);
  console.log(JSON.stringify({ ...result, histogramSha256: hash(result.histogram), engineSourceSha256: hash(source) }));
  process.exit(0);
}
const baseCommit = '8d73ad1fd331e14c93a93006e6c450a2f24b0e60';
const original = normalize(cp.execFileSync('git', ['show', baseCommit + ':bazi-engine.js'], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 }));
function replaceOnce(code, before, after) {
  assert.equal(code.split(before).length, 2, 'audit patch must have exactly one target: ' + before);
  return code.replace(before, after);
}
// B1 is deliberately ONLY these two fixes; later fact/theory changes remain
// combined in C, not falsely attributed to an independently isolated B2 stage.
let b1Source = replaceOnce(original, 'return grave&&group.complete&&group.members.indexOf(branch)>=0', 'return grave&&group.complete&&group.active&&group.members.indexOf(branch)>=0');
b1Source = replaceOnce(b1Source, 'var entryBlocked=a.usable===false||b.usable===false,', 'var entryBlocked=a.usable===false||b.usable===false||a.transformedAway||b.transformedAway,');
const engines = { A: load(original), B1: load(b1Source), C: current };
const grid = { yearCycleCount: 10, monthBranchCount: 12, dayCycleCount: 5, hourBranchCount: 2 };
const samples = [];
current.forEachLegalFourPillar(pillars => samples.push(JSON.parse(JSON.stringify(pillars))), grid);
assert.equal(samples.length, 1200);
const sorted = values => Array.from(values || []).sort();
function useful(result) {
  const u = result.useful, c = u.decision && u.decision.conclusion || {};
  return { primary: sorted(u.primaryUse), secondary: sorted(u.secondaryUse), conditional: sorted((u.conditionalUse || []).map(x => x.element)), reference: sorted(c.routeDependent), avoid: sorted(u.avoid) };
}
function disease(result) { return result.patternDisease.items.map(x => [x.family, x.status]).sort((a, b) => a[0].localeCompare(b[0])); }
function projection(result) { return { main: result.mainPattern, disease: disease(result), useful: useful(result), grade: result.patternLevelGrade, score: result.patternRawScoreBreakdown.unroundedScore }; }
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const changes = () => ({ main: 0, disease: 0, useful: 0, primary: 0, secondary: 0, conditional: 0, avoid: 0, useAvoidFlip: 0, grade: 0, score: 0, onlyGradeOrScore: 0, unchangedConclusion: 0, examples: [] });
const migrations = { A_B1: changes(), B1_C: changes(), A_C: changes() };
function accumulate(before, after, target, pillars) {
  const a = projection(before), b = projection(after);
  for (const key of ['main', 'disease', 'useful', 'grade', 'score']) if (!eq(a[key], b[key])) target[key]++;
  for (const key of ['primary', 'secondary', 'conditional', 'avoid']) if (!eq(a.useful[key], b.useful[key])) target[key]++;
  if (a.useful.primary.concat(a.useful.secondary).some(w => b.useful.avoid.includes(w)) || a.useful.avoid.some(w => b.useful.primary.concat(b.useful.secondary).includes(w))) target.useAvoidFlip++;
  if (eq(a.main, b.main) && eq(a.disease, b.disease) && eq(a.useful, b.useful)) {
    if (a.grade !== b.grade || a.score !== b.score) target.onlyGradeOrScore++;
    else target.unchangedConclusion++;
  }
  if (!eq(a, b) && target.examples.length < 3) target.examples.push({ pillars, before: a, after: b });
}
for (const pillars of samples) {
  const results = Object.fromEntries(Object.entries(engines).map(([key, engine]) => [key, engine.analyzePattern({ pillars })]));
  accumulate(results.A, results.B1, migrations.A_B1, pillars);
  accumulate(results.B1, results.C, migrations.B1_C, pillars);
  accumulate(results.A, results.C, migrations.A_C, pillars);
}
const perturbations = [
  ['carrying-root-low', 'exactRootPower>=1.4||(rootPower>=1.4&&support>=30)', 'exactRootPower>=1.33||(rootPower>=1.33&&support>=30)'],
  ['carrying-root-high', 'exactRootPower>=1.4||(rootPower>=1.4&&support>=30)', 'exactRootPower>=1.47||(rootPower>=1.47&&support>=30)'],
  ['transform-low', 'met:targetRatio>=0.42', 'met:targetRatio>=0.399'],
  ['transform-high', 'met:targetRatio>=0.42', 'met:targetRatio>=0.441'],
  ['child-output-low', 'output>=4&&outputPower>=0.45', 'output>=4&&outputPower>=0.4275'],
  ['child-output-high', 'output>=4&&outputPower>=0.45', 'output>=4&&outputPower>=0.4725'],
  ['dedicated-low', 'selfElementPower>=0.60', 'selfElementPower>=0.57'],
  ['dedicated-high', 'selfElementPower>=0.60', 'selfElementPower>=0.63']
];
const sensitivityGrid = { yearCycleCount: 5, monthBranchCount: 12, dayCycleCount: 2, hourBranchCount: 2 };
const sensitivitySamples = [];
current.forEachLegalFourPillar(pillars => sensitivitySamples.push(JSON.parse(JSON.stringify(pillars))), sensitivityGrid);
// Include independently reasoned positives/counters as boundary probes, never
// search a preferred output and call it an independent truth label.
for (const values of [['己丑','丁丑','甲戌','己巳'],['己丑','丁丑','甲辰','己巳'],['庚戌','己丑','甲午','庚午'],['乙卯','己卯','壬寅','丁未'],['丙寅','癸巳','甲寅','戊辰'],['丙子','癸巳','甲申','戊辰']]) sensitivitySamples.push(Object.fromEntries(['year','month','day','hour'].map((key, index) => [key, values[index]])));
const stableResults = sensitivitySamples.map(pillars => current.analyzePattern({ pillars }));
const sensitivity = [];
for (const [name, before, after] of perturbations) {
  const variant = load(replaceOnce(source, before, after));
  assert.equal(JSON.stringify(variant.constants.PATTERN_SCORE_DIMENSION_WEIGHTS), JSON.stringify(current.constants.PATTERN_SCORE_DIMENSION_WEIGHTS));
  assert.equal(JSON.stringify(variant.constants.STRUCTURE_SCORE_LEVEL_BANDS), JSON.stringify(current.constants.STRUCTURE_SCORE_LEVEL_BANDS));
  const result = changes();
  sensitivitySamples.forEach((pillars, index) => {
    const changed = variant.analyzePattern({ pillars });
    assert.equal(JSON.stringify(current.scoreWuxing(pillars)), JSON.stringify(variant.scoreWuxing(pillars)), 'perturbing qualifications cannot rewrite raw input energy');
    assert(!changed.useful.use.some(w => changed.useful.avoid.includes(w)), 'sensitivity variant cannot declare the same element unconditionally useful and avoided');
    accumulate(stableResults[index], changed, result, pillars);
  });
  sensitivity.push({ name, changedPredicate: after, ...result });
}
console.log(JSON.stringify({ version: 'PAT-215-AUDIT-20261107-v1', baseCommit, engineSourceSha256: hash(source), baselineASha256: hash(original), b1PatchSha256: hash(b1Source), migration: { grid, sampleCount: samples.length, stages: { A: 'original commit', B1: 'ONLY active-group and transformed-away endpoint fixes', C: 'remaining implementation consistency and theory corrections combined; no isolated B2 attribution' }, results: migrations }, sensitivity: { grid: sensitivityGrid, additionalBoundaryCases: 6, sampleCountPerVariant: sensitivitySamples.length, relativePerturbation: 'plus/minus 5 percent of each audited qualification threshold, one predicate per variant', results: sensitivity }, boundary: 'theoretical implementation migration and engineering-threshold sensitivity only; not real-life prediction accuracy or proof that a threshold is universally correct' }));
