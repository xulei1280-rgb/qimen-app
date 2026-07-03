const q = require('./qimen.js');

// All cases are Beijing-clock baselines from the reference app.
// Do not apply true-solar-time correction here.
const cases = [
  ['2026-02-04 23:30', [2026, 2, 4, 23, 30], { year: '\u4e19\u5348', month: '\u5e9a\u5bc5', day: '\u5e9a\u620c', hour: '\u4e19\u5b50', ju: 8, xun: '\u7532\u620c', zf: '\u5929\u82f1', zs: '\u666f' }],
  ['2026-02-05 00:30', [2026, 2, 5, 0, 30], { year: '\u4e19\u5348', month: '\u5e9a\u5bc5', day: '\u5e9a\u620c', hour: '\u4e19\u5b50', ju: 8, xun: '\u7532\u620c', zf: '\u5929\u82f1', zs: '\u666f' }],
  ['2026-03-05 05:20', [2026, 3, 5, 5, 20], { year: '\u4e19\u5348', month: '\u8f9b\u536f', day: '\u620a\u5bc5', hour: '\u4e59\u536f', ju: 3, xun: '\u7532\u5bc5', zf: '\u5929\u4efb', zs: '\u751f' }],
  ['2026-04-04 21:10', [2026, 4, 4, 21, 10], { year: '\u4e19\u5348', month: '\u8f9b\u536f', day: '\u620a\u7533', hour: '\u7678\u4ea5', ju: 6, xun: '\u7532\u5bc5', zf: '\u5929\u82ae', zs: '\u6b7b' }],
  ['2026-06-21 00:20', [2026, 6, 21, 0, 20], { year: '\u4e19\u5348', month: '\u7532\u5348', day: '\u4e19\u5bc5', hour: '\u620a\u5b50', ju: 6, xun: '\u7532\u7533', zf: '\u5929\u4efb', zs: '\u751f' }],
  ['2026-06-22 23:40', [2026, 6, 22, 23, 40], { year: '\u4e19\u5348', month: '\u7532\u5348', day: '\u620a\u8fb0', hour: '\u58ec\u5b50', ju: 9, xun: '\u7532\u8fb0', zf: '\u5929\u82ae', zs: '\u6b7b' }],
  ['2026-07-07 23:30', [2026, 7, 7, 23, 30], { year: '\u4e19\u5348', month: '\u4e59\u672a', day: '\u7678\u672a', hour: '\u58ec\u5b50', ju: 8, xun: '\u7532\u8fb0', zf: '\u5929\u8f85', zs: '\u675c' }],
  ['2026-07-08 00:30', [2026, 7, 8, 0, 30], { year: '\u4e19\u5348', month: '\u4e59\u672a', day: '\u7678\u672a', hour: '\u58ec\u5b50', ju: 8, xun: '\u7532\u8fb0', zf: '\u5929\u8f85', zs: '\u675c' }],
  ['2026-08-07 14:15', [2026, 8, 7, 14, 15], { year: '\u4e19\u5348', month: '\u4e19\u7533', day: '\u7678\u4e11', hour: '\u5df1\u672a', ju: 7, xun: '\u7532\u5bc5', zf: '\u5929\u82ae', zs: '\u6b7b' }],
  ['2026-09-07 23:50', [2026, 9, 7, 23, 50], { year: '\u4e19\u5348', month: '\u4e01\u9149', day: '\u4e59\u9149', hour: '\u4e19\u5b50', ju: 3, xun: '\u7532\u620c', zf: '\u5929\u82ae', zs: '\u6b7b' }],
  ['2026-12-21 23:20', [2026, 12, 21, 23, 20], { year: '\u4e19\u5348', month: '\u5e9a\u5b50', day: '\u5e9a\u5348', hour: '\u4e19\u5b50', ju: 7, xun: '\u7532\u620c', zf: '\u5929\u5fc3', zs: '\u5f00' }],
  ['2026-12-22 00:20', [2026, 12, 22, 0, 20], { year: '\u4e19\u5348', month: '\u5e9a\u5b50', day: '\u5e9a\u5348', hour: '\u4e19\u5b50', ju: 7, xun: '\u7532\u620c', zf: '\u5929\u5fc3', zs: '\u5f00' }],
  ['2026-01-05 01:10', [2026, 1, 5, 1, 10], { year: '\u4e59\u5df3', month: '\u5df1\u4e11', day: '\u5df1\u536f', hour: '\u4e59\u4e11', ju: 1, xun: '\u7532\u5b50', zf: '\u5929\u84ec', zs: '\u4f11' }],
  ['2026-05-05 10:05', [2026, 5, 5, 10, 5], { year: '\u4e19\u5348', month: '\u7678\u5df3', day: '\u5df1\u536f', hour: '\u5df1\u5df3', ju: 5, xun: '\u7532\u5b50', zf: '\u5929\u82ae', zs: '\u6b7b' }],
  ['2026-07-01 23:30', [2026, 7, 1, 23, 30], { year: '\u4e19\u5348', month: '\u7532\u5348', day: '\u4e01\u4e11', hour: '\u5e9a\u5b50', ju: 6, xun: '\u7532\u5348', zf: '\u5929\u51b2', zs: '\u4f24' }],
  ['2026-10-08 08:08', [2026, 10, 8, 8, 8], { year: '\u4e19\u5348', month: '\u620a\u620c', day: '\u4e59\u536f', hour: '\u5e9a\u8fb0', ju: 1, xun: '\u7532\u620c', zf: '\u5929\u82f1', zs: '\u666f' }],
  ['2026-11-07 18:18', [2026, 11, 7, 18, 18], { year: '\u4e19\u5348', month: '\u5df1\u4ea5', day: '\u4e59\u9149', hour: '\u4e59\u9149', ju: 9, xun: '\u7532\u7533', zf: '\u5929\u67f1', zs: '\u60ca' }],
  ['2027-02-03 23:30', [2027, 2, 3, 23, 30], { year: '\u4e19\u5348', month: '\u8f9b\u4e11', day: '\u7532\u5bc5', hour: '\u7532\u5b50', ju: 9, xun: '\u7532\u5b50', zf: '\u5929\u82f1', zs: '\u666f' }],
];

for (const [label, args, expected] of cases) {
  const r = q.paiPan(...args);
  const got = {
    year: r.ganzhi.year,
    month: r.ganzhi.month,
    day: r.ganzhi.day,
    hour: r.ganzhi.hour,
    ju: r.juInfo.ju,
    xun: r.juInfo.xunShou,
    zf: r.juInfo.zhiFu,
    zs: r.juInfo.zhiShi,
  };
  const bad = Object.keys(expected).filter((key) => got[key] !== expected[key]);
  if (bad.length) {
    console.error(label, got, 'expected', expected, 'bad', bad);
    process.exit(1);
  }
}

console.log('18 baselines ok');
