// Birth-form presentation only. Calendar conversion uses the existing local iztro.
// Clock corrections belong to the existing engines, never to this control.
(function (root) {
  'use strict';
  const pad = n => String(n).padStart(2, '0');
  const dateText = d => `${d.year}-${pad(d.month)}-${pad(d.day)}`;
  function lunarFromSolar(date) {
    if (date.year < 1900 || date.year > 2100) throw new Error('该日期超出既有农历换算范围。');
    const raw = root.iztro.astro.bySolar(dateText(date), 0, '男', true, 'zh-CN').rawDates.lunarDate;
    if (raw.lunarYear < 1900 || raw.lunarYear > 2099) throw new Error('农历年份须在 1900 至 2099 年之间。');
    return { year: raw.lunarYear, month: Math.abs(raw.lunarMonth), day: raw.lunarDay, isLeap: Boolean(raw.isLeap) };
  }
  function solarFromLunar(date) {
    if (!Number.isInteger(date.year) || date.year < 1900 || date.year > 2099) throw new Error('农历年份须在 1900 至 2099 年之间。');
    const text = root.iztro.astro.byLunar(dateText(date), 0, '男', Boolean(date.isLeap), true, 'zh-CN').solarDate;
    const [year, month, day] = text.split('-').map(Number);
    const solar = { year, month, day }, check = lunarFromSolar(solar);
    if (check.year !== date.year || check.month !== date.month || check.day !== date.day || check.isLeap !== Boolean(date.isLeap)) {
      throw new Error('该农历日期或闰月不存在，请核对。');
    }
    return solar;
  }
  function create(onChange) {
    const el = id => document.getElementById(id);
    const year = el('birthYear'), month = el('birthMonth'), day = el('birthDay');
    const hour = el('birthHour'), minute = el('birthMinute'), leap = el('birthLeap');
    const radios = Array.from(document.querySelectorAll('input[name="calendarType"]'));
    let calendarType = 'solar';
    function options(select, count, first, label) {
      select.innerHTML = '';
      for (let n = first; n < first + count; n++) select.add(new Option(label(n), n));
    }
    options(month, 12, 1, n => n + '月');
    options(hour, 24, 0, n => pad(n) + '时');
    options(minute, 60, 0, n => pad(n) + '分');
    function sourceDate() {
      return { year: Number(year.value), month: Number(month.value), day: Number(day.value), isLeap: calendarType === 'lunar' && leap.checked };
    }
    function solarDate() {
      const d = sourceDate();
      if (!Number.isInteger(d.year) || d.year < 1 || d.year > 9999) throw new Error('请填写有效的出生年份。');
      if (calendarType === 'lunar') return solarFromLunar(d);
      const check = new Date(0);
      check.setUTCFullYear(d.year, d.month - 1, d.day);
      if (check.getUTCFullYear() !== d.year || check.getUTCMonth() + 1 !== d.month || check.getUTCDate() !== d.day) throw new Error('请核对出生日期。');
      return { year: d.year, month: d.month, day: d.day };
    }
    function updateDays(preferred) {
      const d = sourceDate(), wanted = preferred || d.day || 1;
      let max = 31, legalLeap = false;
      if (d.year >= 1 && d.year <= 9999) {
        if (calendarType === 'lunar') {
          try { solarFromLunar({ ...d, day: 1, isLeap: true }); legalLeap = true; } catch (_) { /* ordinary month */ }
          if (!legalLeap) leap.checked = false;
          try { solarFromLunar({ ...d, day: 30, isLeap: leap.checked }); max = 30; } catch (_) { max = 29; }
        } else {
          const end = new Date(0);
          end.setUTCFullYear(d.year, d.month, 0);
          max = end.getUTCDate();
        }
      }
      leap.disabled = !legalLeap;
      el('birthLeapLabel').hidden = calendarType !== 'lunar';
      options(day, max, 1, n => calendarType === 'lunar' ? ['初一','初二','初三','初四','初五','初六','初七','初八','初九','初十','十一','十二','十三','十四','十五','十六','十七','十八','十九','二十','廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'][n-1] : n + '日');
      day.value = Math.min(wanted, max);
      Array.from(month.options).forEach((option, i) => { option.textContent = calendarType === 'lunar' ? ['正月','二月','三月','四月','五月','六月','七月','八月','九月','十月','冬月','腊月'][i] : (i + 1) + '月'; });
    }
    function setDate(type, date, clock) {
      calendarType = type === 'lunar' ? 'lunar' : 'solar';
      el('birthDateError').textContent = '';
      radios.forEach(r => { r.checked = r.value === calendarType; });
      year.min = calendarType === 'lunar' ? '1900' : '1';
      year.max = calendarType === 'lunar' ? '2099' : '9999';
      year.value = date.year;
      month.value = date.month;
      leap.checked = Boolean(date.isLeap);
      updateDays(date.day);
      if (clock) { hour.value = clock.hour; minute.value = clock.minute; }
    }
    function switchCalendar(event) {
      const target = event.target.value;
      if (target === calendarType) return;
      try {
        const solar = solarDate();
        const date = target === 'lunar' ? lunarFromSolar(solar) : solar;
        setDate(target, date);
        onChange();
      } catch (error) {
        radios.forEach(r => { r.checked = r.value === calendarType; });
        el('birthDateError').textContent = error.message;
      }
    }
    radios.forEach(r => r.addEventListener('change', switchCalendar));
    [year, month, day, hour, minute, leap].forEach(input => input.addEventListener('input', () => {
      el('birthDateError').textContent = '';
      if (input === year || input === month || input === leap) updateDays();
      onChange();
    }));
    return {
      setDate, updateDays, sourceDate, solarDate,
      get calendarType() { return calendarType; },
      clock() { return { hour: Number(hour.value), minute: Number(minute.value) }; },
      inputTime() { return { ...solarDate(), ...this.clock() }; },
    };
  }
  root.BirthDateInput = { create, lunarFromSolar, solarFromLunar, dateText };
})(window);
