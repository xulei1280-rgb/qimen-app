// Read-only coverage replay. These calendar fixtures contain no life-event answers.
const fs = require('fs');
const vm = require('vm');
const { execFileSync } = require('child_process');
const stems = '甲乙丙丁戊己庚辛壬癸';
const branches = '子丑寅卯辰巳午未申酉戌亥';
const GZ60 = Array.from({ length: 60 }, (_, i) => stems[i % 10] + branches[i % 12]);
const qimenSource = fs.readFileSync('qimen.js', 'utf8');
const baselineSource = fs.readFileSync('check-baselines.js', 'utf8').replace(/\r\n/g, '\n');
const fixtureMatch = baselineSource.match(/const cases = (\[[\s\S]*?\n\]);/);
if (!fixtureMatch) throw new Error('Cannot locate the existing calendar fixtures');
const fixtures = vm.runInNewContext(fixtureMatch[1]);

function replay(source) {
  const context = {};
  vm.createContext(context);
  vm.runInContext(qimenSource, context);
  vm.runInContext(source, context);
  const engine = context.BaziEngine;
  const stats = { total: 0, determined: 0, pending: 0, tendency: 0, assessments: {}, families: {}, causes: {} };
  for (const [, args] of fixtures) {
    for (const gender of ['男', '女']) {
      const used = Object.fromEntries(['year', 'month', 'day', 'hour', 'minute'].map((key, i) => [key, args[i]]));
      const pillars = engine.buildPillars(used);
      const chart = { pillars, dayStem: pillars.day[0], gender,
        time: { used } };
      const startYear = engine.luckStartInfo(chart).startYear;
      const direction = engine.luckDirection(chart);
      const monthIndex = GZ60.indexOf(pillars.month);
      let previous = null;
      for (let cycle = 0; cycle < 10; cycle++) {
        const gz = GZ60[(monthIndex + direction * (cycle + 1) + 60) % 60];
        const years = Array.from({ length: 10 }, (_, i) => {
          const year = startYear + cycle * 10 + i;
          return { year, gz: engine.getFlowYearGZ(year) };
        });
        const result = engine.evaluateLuckOutlook(chart, gz, previous, years);
        stats.ruleVersion = result.ruleVersion;
        const values = [result.natal, ...(previous ? [result.previous] : []),
          ...result.years.flatMap(year => [year.annual, year.increment])];
        for (const item of values) {
          stats.total++;
          const assessment=item.assessment||(item.direction==='pending'?'legacy-pending':'determined');
          stats.assessments[assessment]=(stats.assessments[assessment]||0)+1;
          const family = item.review?.afterRoute || 'unavailable';
          stats.families[family] ||= { total: 0, pending: 0 };
          stats.families[family].total++;
          if (item.direction !== 'pending') { stats.determined++; continue; }
          stats.pending++;
          stats.families[family].pending++;
          if (item.tendency) stats.tendency++;
          const causes = new Set(item.uncertainty.map(text => text.includes('空证据') ? '未识别主要任用'
            : text.includes('月令') ? '月令未定' : text.includes('共同参照') ? '参照未对齐' : text.split('：')[0]));
          for (const cause of causes) stats.causes[cause] = (stats.causes[cause] || 0) + 1;
        }
        previous = gz;
      }
    }
  }
  stats.causes = Object.fromEntries(Object.entries(stats.causes).sort((a, b) => b[1] - a[1]));
  return stats;
}

const report = { scope: '18 calendar fixtures, both genders, 10 chronological cycles, 10 years per cycle; coverage only, not predictive accuracy',
  current: replay(fs.readFileSync('bazi-engine.js', 'utf8')) };
if (process.argv[2]) {
  const ref = execFileSync('git', ['rev-parse', '--verify', process.argv[2] + '^{commit}'], { encoding: 'utf8' }).trim();
  report.baselineRef = ref;
  report.baseline = replay(execFileSync('git', ['show', ref + ':bazi-engine.js'], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 }));
}
console.log(JSON.stringify(report, null, 2));
