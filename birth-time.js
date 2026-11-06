(function (root) {
  'use strict';

  // Mainland China, Beijing clock only. Source: https://data.iana.org/time-zones/tzdb/asia (Rule PRC).
  var periods = [
    [1986, 5, 4, 9, 14], [1987, 4, 12, 9, 13], [1988, 4, 17, 9, 11],
    [1989, 4, 16, 9, 17], [1990, 4, 15, 9, 16], [1991, 4, 14, 9, 15]
  ];

  function civilMs(t) {
    var date = new Date(0);
    date.setUTCFullYear(Number(t.year), Number(t.month) - 1, Number(t.day));
    date.setUTCHours(Number(t.hour), Number(t.minute) || 0, 0, 0);
    return date.getTime();
  }

  function shiftMinutes(t, minutes) {
    // UTC getters are calendar arithmetic here, not a conversion to the computer's time zone.
    var date = new Date(civilMs(t) + Math.round(minutes) * 60000);
    return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate(), hour: date.getUTCHours(), minute: date.getUTCMinutes() };
  }

  function daylightStatus(t) {
    var p = periods.find(function (row) { return row[0] === Number(t.year); });
    if (!p) return { applicable: false, missing: false, repeated: false };
    var ms = civilMs(t);
    var start = civilMs({ year: p[0], month: p[1], day: p[2], hour: 2 });
    var end = civilMs({ year: p[0], month: p[3], day: p[4], hour: 2 });
    return { applicable: ms >= start && ms < end, missing: ms >= start && ms < start + 3600000, repeated: ms >= end - 3600000 && ms < end };
  }

  function normalize(t, useDaylightSaving) {
    var status = daylightStatus(t);
    if (useDaylightSaving && (!status.applicable || status.missing)) {
      var error = new Error(status.missing
        ? '这一天钟表由02:00拨到03:00，夏令钟表没有02:00至02:59，请核对出生记录；若填的是已还原的标准时间，请取消夏令时。'
        : '该时间不在中国大陆1986至1991年夏令时适用时段，请取消夏令时。');
      error.code = status.missing ? 'DST_NONEXISTENT_TIME' : 'DST_OUTSIDE_PERIOD';
      throw error;
    }
    return { standard: useDaylightSaving ? shiftMinutes(t, -60) : t, daylightSaving: Boolean(useDaylightSaving), daylightSavingMinutes: useDaylightSaving ? -60 : 0 };
  }

  function hint(status) {
    if (status.missing) return '当天02:00至02:59为拨表跳过的时段，请核对填写的是钟表时间还是已还原的标准时间。';
    if (status.repeated) return '当天01:00至01:59出现两次：拨表前的夏令钟表时间请勾选，拨表后的标准时间不勾选。';
    return status.applicable ? '该日期处于中国大陆夏令时期间，填写当时钟表时间的请勾选；已减过一小时的不勾选。' : '';
  }

  var helpHtml = '<p>适用于中国大陆1986至1991年：出生记录若使用当时拨快一小时的夏令钟表时间，请勾选，系统会先减去一小时。已经自行还原的标准北京时间，请勿重复勾选。</p><ul>' +
    periods.map(function (p) { return '<li>' + p[0] + '年：' + p[1] + '月' + p[2] + '日至' + p[3] + '月' + p[4] + '日</li>'; }).join('') +
    '</ul><p>以上均为公历。开始日02:00拨到03:00，结束日02:00拨回01:00；切换当天按具体时刻判断。夏令时校正后，再按选择换算真太阳时。</p><p>港澳台、海外及其他历史时制不适用此表。</p>';

  var api = { shiftMinutes: shiftMinutes, daylightStatus: daylightStatus, normalize: normalize, hint: hint, helpHtml: helpHtml };
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.BirthTime = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
