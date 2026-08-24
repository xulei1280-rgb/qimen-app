(function (root, factory) {
  const api = factory(
    root && root.iztro
      ? root.iztro
      : typeof module === "object" && module.exports
        ? require("./vendor/iztro/2.5.8/iztro.min.js")
        : null,
  );

  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.ZiweiEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (iztro) {
  "use strict";

  if (!iztro || !iztro.astro) throw new Error("IZTRO_ENGINE_NOT_LOADED");

  const ENGINE_VERSION = "2.5.8";
  const ENGINE_SHA256 = "4b8eca323e5d4291471567c62255a2166471c55c77ebe8f0d2d38240e69d12b1";
  const SOURCE_COMMIT = "9d39f1743bf31c2b3c635c9b9556215d9c90ee2c";
  const MUTAGEN_LABELS = ["禄", "权", "科", "忌"];
  const PROJECT_CONFIG = Object.freeze({
    yearDivide: "normal",
    horoscopeDivide: "normal",
    ageDivide: "normal",
    dayDivide: "forward",
    algorithm: "default",
  });

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
    return value;
  }

  const RULE_META = deepFreeze({
    schemaVersion: 1,
    engine: {
      name: "iztro",
      version: ENGINE_VERSION,
      sourceCommit: SOURCE_COMMIT,
      browserArtifactSha256: ENGINE_SHA256,
      license: "MIT",
      localOnly: true,
    },
    rules: {
      timezone: "Asia/Shanghai",
      defaultTimeBasis: "beijing_standard_time",
      trueSolarTime: "longitude_plus_equation_of_time; confirm when earthly-branch period changes",
      yearDivide: "lunar_new_year",
      horoscopeDivide: "lunar_new_year",
      nominalAge: "natural_year; target lunar year minus birth lunar year plus one",
      leapMonth: "days 1-15 use previous month; days 16-end use next month",
      ratHour: "early and late rat separated; late rat advances logical lunar day",
      timeBranchBoundary: "[00:00,01:00) early rat; [01:00,03:00) ox; then two-hour half-open intervals; [21:00,23:00) pig; [23:00,24:00) late rat",
      decadalStemMethod: "use natal palace heavenly stem; no direction-based re-layout",
      mutagenSystem: "iztro default based on Zi Wei Dou Shu Quan Shu",
      brightnessSystem: "iztro default",
      algorithm: "default; do not mix Zhongzhou tables",
    },
    notice: "项目规则选择，不代表唯一正统；传统术数不等于科学验证或权威结论。",
  });

  function engineError(code, message, details) {
    const error = new Error(message);
    error.code = code;
    if (details) error.details = details;
    return error;
  }

  function applyProjectConfig() {
    const current = iztro.astro.getConfig();
    if (Object.keys(current.mutagens || {}).length || Object.keys(current.brightness || {}).length) {
      throw engineError(
        "IZTRO_GLOBAL_TABLE_DRIFT",
        "检测到四化或亮度表被外部代码改写，已停止排盘以免混用规则。",
      );
    }
    iztro.astro.config(PROJECT_CONFIG);
    const applied = iztro.astro.getConfig();
    for (const [key, value] of Object.entries(PROJECT_CONFIG)) {
      if (applied[key] !== value) {
        throw engineError("IZTRO_CONFIG_MISMATCH", `项目规则 ${key} 未能固定。`);
      }
    }
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function parseDate(value, fieldName) {
    const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(String(value || "").trim());
    if (!match) throw engineError("INVALID_DATE", `${fieldName} 必须为 YYYY-MM-DD。`);
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const probe = new Date(Date.UTC(year, month - 1, day));
    if (
      probe.getUTCFullYear() !== year ||
      probe.getUTCMonth() !== month - 1 ||
      probe.getUTCDate() !== day
    ) {
      throw engineError("INVALID_DATE", `${fieldName} 不是有效日期。`);
    }
    return { year, month, day, text: `${year}-${pad(month)}-${pad(day)}` };
  }

  function parseTime(value) {
    const match = /^(\d{1,2}):(\d{2})$/.exec(String(value || "").trim());
    if (!match) throw engineError("INVALID_TIME", "出生时间必须为 HH:mm。 ");
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (hour > 23 || minute > 59) throw engineError("INVALID_TIME", "出生时间超出有效范围。 ");
    return { hour, minute, text: `${pad(hour)}:${pad(minute)}` };
  }

  function timeIndexFromHour(hour) {
    if (hour === 0) return 0;
    if (hour === 23) return 12;
    return Math.floor((hour + 1) / 2);
  }

  function normalizeGender(value) {
    if (value === "男" || value === "male") return "male";
    if (value === "女" || value === "female") return "female";
    throw engineError("INVALID_GENDER", "性别必须为男或女。 ");
  }

  function normalizeCalendarType(value) {
    if (value === "solar" || value === "lunar") return value;
    throw engineError("INVALID_CALENDAR_TYPE", "日期类型必须为公历或农历。 ");
  }

  function normalizeTimeBasis(value) {
    if (!value || value === "beijing" || value === "beijing_standard_time") return "beijing";
    if (value === "trueSolar" || value === "true_solar_time") return "trueSolar";
    throw engineError("INVALID_TIME_BASIS", "时间口径必须为北京时间或真太阳时。 ");
  }

  function parseLunarDate(value) {
    const lunar = value || {};
    const year = Number(lunar.year);
    const month = Number(lunar.month);
    const day = Number(lunar.day);
    if (!Number.isInteger(year) || year < 1900 || year > 2099) {
      throw engineError("INVALID_LUNAR_DATE", "农历年份须在 1900 至 2099 年之间。 ");
    }
    if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(day) || day < 1 || day > 30) {
      throw engineError("INVALID_LUNAR_DATE", "农历月日超出有效范围。 ");
    }
    return { year, month, day, isLeap: Boolean(lunar.isLeap), text: `${year}-${month}-${day}` };
  }

  function equationOfTimeMinutes(year, month, day) {
    // 固定评估口径采用 365 日近似年，闰年 2 月 29 日不额外累加日序。
    const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const dayNumber = monthDays.slice(0, month - 1).reduce((sum, value) => sum + value, 0) + day;
    const b = (2 * Math.PI * (dayNumber - 81)) / 364;
    return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
  }

  function trueSolarCorrection(solarDate, clock, longitude) {
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      throw engineError("INVALID_LONGITUDE", "经度必须在 -180 到 180 之间。 ");
    }
    const date = parseDate(solarDate, "换算后的公历日期");
    const correctionMinutes = (longitude - 120) * 4 + equationOfTimeMinutes(date.year, date.month, date.day);
    const inputMs = Date.UTC(date.year, date.month - 1, date.day, clock.hour, clock.minute);
    const corrected = new Date(inputMs + correctionMinutes * 60000);
    const effective = {
      date: `${corrected.getUTCFullYear()}-${pad(corrected.getUTCMonth() + 1)}-${pad(corrected.getUTCDate())}`,
      time: `${pad(corrected.getUTCHours())}:${pad(corrected.getUTCMinutes())}`,
      hour: corrected.getUTCHours(),
      minute: corrected.getUTCMinutes(),
    };
    const inputTimeIndex = timeIndexFromHour(clock.hour);
    const effectiveTimeIndex = timeIndexFromHour(effective.hour);
    return {
      method: "longitude_plus_equation_of_time",
      longitude,
      correctionMinutes: Math.round(correctionMinutes * 100) / 100,
      inputDateTime: `${date.text} ${clock.text}`,
      effectiveDateTime: `${effective.date} ${effective.time}`,
      solarDate: effective.date,
      clockTime: effective.time,
      timeIndex: effectiveTimeIndex,
      inputTimeIndex,
      crossesDate: date.text !== effective.date,
      crossesTimeBranch: inputTimeIndex !== effectiveTimeIndex,
      confirmationRequired: inputTimeIndex !== effectiveTimeIndex,
    };
  }

  function plainStar(star) {
    return {
      name: star.name,
      type: star.type || "",
      scope: star.scope || "origin",
      brightness: star.brightness || "",
      mutagen: star.mutagen || "",
    };
  }

  function plainPalace(palace) {
    return {
      index: palace.index,
      name: palace.name,
      isBodyPalace: Boolean(palace.isBodyPalace),
      isOriginalPalace: Boolean(palace.isOriginalPalace),
      heavenlyStem: palace.heavenlyStem,
      earthlyBranch: palace.earthlyBranch,
      majorStars: (palace.majorStars || []).map(plainStar),
      minorStars: (palace.minorStars || []).map(plainStar),
      adjectiveStars: (palace.adjectiveStars || []).map(plainStar),
      changsheng12: palace.changsheng12 || "",
      boshi12: palace.boshi12 || "",
      jiangqian12: palace.jiangqian12 || "",
      suiqian12: palace.suiqian12 || "",
      decadal: {
        range: [...palace.decadal.range],
        heavenlyStem: palace.decadal.heavenlyStem,
        earthlyBranch: palace.decadal.earthlyBranch,
      },
      ages: [...(palace.ages || [])],
    };
  }

  function collectMutagen(palaces) {
    const result = { 禄: "", 权: "", 科: "", 忌: "" };
    for (const palace of palaces) {
      for (const star of [...palace.majorStars, ...palace.minorStars, ...palace.adjectiveStars]) {
        if (MUTAGEN_LABELS.includes(star.mutagen)) result[star.mutagen] = star.name;
      }
    }
    return result;
  }

  function normalizeNatal(chart) {
    const palaces = chart.palaces.map(plainPalace);
    return {
      soulPalace: chart.earthlyBranchOfSoulPalace,
      bodyPalace: chart.earthlyBranchOfBodyPalace,
      soulStar: chart.soul,
      bodyStar: chart.body,
      fiveElementsClass: chart.fiveElementsClass,
      sign: chart.sign,
      zodiac: chart.zodiac,
      birthMutagen: collectMutagen(palaces),
      palaces,
    };
  }

  function natalCore(natal) {
    return {
      soulPalace: natal.soulPalace,
      bodyPalace: natal.bodyPalace,
      fiveElementsClass: natal.fiveElementsClass,
      birthMutagen: natal.birthMutagen,
      palaces: natal.palaces.map((palace) => ({
        index: palace.index,
        name: palace.name,
        isBodyPalace: palace.isBodyPalace,
        heavenlyStem: palace.heavenlyStem,
        earthlyBranch: palace.earthlyBranch,
        majorStars: palace.majorStars,
        minorStars: palace.minorStars,
        decadal: palace.decadal,
      })),
    };
  }

  function createChart(engineInput) {
    applyProjectConfig();
    return iztro.astro.bySolar(
      engineInput.solarDate,
      engineInput.timeIndex,
      engineInput.gender,
      true,
      "zh-CN",
    );
  }

  function preliminarySolarDate(calendarType, sourceDate, timeIndex, gender) {
    if (calendarType === "solar") return sourceDate.text;
    applyProjectConfig();
    try {
      return iztro.astro.byLunar(
        sourceDate.text,
        timeIndex,
        gender,
        sourceDate.isLeap,
        true,
        "zh-CN",
      ).solarDate;
    } catch (error) {
      throw engineError("INVALID_LUNAR_DATE", `无法换算该农历日期：${error.message}`);
    }
  }

  function buildNatal(input) {
    const value = input || {};
    const calendarType = normalizeCalendarType(value.calendarType || "solar");
    const gender = normalizeGender(value.gender);
    const clock = parseTime(value.time);
    const sourceDate = calendarType === "solar"
      ? parseDate(value.date, "出生日期")
      : parseLunarDate(value.lunarDate);
    const timeBasis = normalizeTimeBasis(value.timeBasis);
    const originalTimeIndex = timeIndexFromHour(clock.hour);
    const standardSolarDate = preliminarySolarDate(calendarType, sourceDate, originalTimeIndex, gender);
    let trueSolar = null;
    let effectiveSolarDate = standardSolarDate;
    let effectiveTime = clock.text;
    let effectiveTimeIndex = originalTimeIndex;

    if (timeBasis === "trueSolar") {
      trueSolar = trueSolarCorrection(standardSolarDate, clock, Number(value.longitude));
      if (trueSolar.confirmationRequired && !value.confirmedTimeShift) {
        throw engineError(
          "TIME_BRANCH_CONFIRMATION_REQUIRED",
          "真太阳时修正后跨越时辰，须确认后才能排盘。",
          trueSolar,
        );
      }
      effectiveSolarDate = trueSolar.solarDate;
      effectiveTime = trueSolar.clockTime;
      effectiveTimeIndex = trueSolar.timeIndex;
    }

    let chart;
    try {
      chart = createChart({ solarDate: effectiveSolarDate, timeIndex: effectiveTimeIndex, gender });
    } catch (error) {
      if (error.code) throw error;
      throw engineError("CHART_BUILD_FAILED", `排盘失败：${error.message}`);
    }
    const natal = normalizeNatal(chart);
    const snapshot = {
      schemaVersion: 1,
      ruleMeta: getRuleMeta(),
      input: {
        calendarType,
        sourceDate: calendarType === "solar"
          ? sourceDate.text
          : { year: sourceDate.year, month: sourceDate.month, day: sourceDate.day, isLeap: sourceDate.isLeap },
        clockTime: clock.text,
        gender,
        timeBasis,
        longitude: timeBasis === "trueSolar" ? Number(value.longitude) : null,
      },
      effective: {
        solarDate: effectiveSolarDate,
        clockTime: effectiveTime,
        timeIndex: effectiveTimeIndex,
        trueSolar,
      },
      engineInput: { solarDate: effectiveSolarDate, timeIndex: effectiveTimeIndex, gender },
      calendar: {
        solarDate: chart.solarDate,
        lunarDate: chart.lunarDate,
        lunarYear: chart.rawDates.lunarDate.lunarYear,
        lunarMonth: chart.rawDates.lunarDate.lunarMonth,
        lunarDay: chart.rawDates.lunarDate.lunarDay,
        isLeapMonth: Boolean(chart.rawDates.lunarDate.isLeap),
        sexagenary: chart.chineseDate,
        timeLabel: chart.time,
        timeRange: chart.timeRange,
      },
      natal,
      coreSignature: JSON.stringify(natalCore(natal)),
    };
    return deepFreeze(snapshot);
  }

  function normalizeScope(scope) {
    return {
      palaceIndex: scope.index,
      palaceName: scope.palaceNames[scope.index],
      heavenlyStem: scope.heavenlyStem,
      earthlyBranch: scope.earthlyBranch,
      palaceNames: [...scope.palaceNames],
      mutagen: Object.fromEntries(MUTAGEN_LABELS.map((label, index) => [label, scope.mutagen[index] || ""])),
      stars: (scope.stars || []).map((items) => items.map(plainStar)),
    };
  }

  function getHoroscope(snapshot, targetDate) {
    if (!snapshot || snapshot.schemaVersion !== 1 || !snapshot.engineInput || !snapshot.natal) {
      throw engineError("INVALID_NATAL_SNAPSHOT", "本命盘快照格式无效。 ");
    }
    if (snapshot.ruleMeta.engine.version !== ENGINE_VERSION || snapshot.ruleMeta.engine.browserArtifactSha256 !== ENGINE_SHA256) {
      throw engineError("SNAPSHOT_ENGINE_MISMATCH", "快照与当前固定引擎版本不一致。 ");
    }
    const target = parseDate(targetDate, "目标日期");
    const birth = parseDate(snapshot.effective.solarDate, "生效出生日期");
    const dateNumber = (date) => Date.UTC(date.year, date.month - 1, date.day);
    if (dateNumber(target) < dateNumber(birth)) {
      throw engineError("TARGET_BEFORE_BIRTH", "目标日期不能早于生效出生日期。", {
        targetDate: target.text,
        birthDate: birth.text,
      });
    }
    const before = JSON.stringify(snapshot);
    const chart = createChart(snapshot.engineInput);
    const regenerated = normalizeNatal(chart);
    if (JSON.stringify(natalCore(regenerated)) !== snapshot.coreSignature) {
      throw engineError("NATAL_SNAPSHOT_MISMATCH", "重新生成的本命盘与冻结快照不一致，已停止计算。 ");
    }
    let horoscope;
    try {
      horoscope = chart.horoscope(`${target.year}-${target.month}-${target.day}`, 6);
      if (!horoscope?.decadal || !horoscope?.yearly) throw new Error("引擎没有返回完整的大限与流年");
    } catch (error) {
      throw engineError("HOROSCOPE_BUILD_FAILED", `无法计算目标日期运限：${error.message}`);
    }
    const decadal = normalizeScope(horoscope.decadal);
    decadal.ageRange = [...chart.palaces[horoscope.decadal.index].decadal.range];
    const result = {
      schemaVersion: 1,
      targetDate: target.text,
      targetSolarDate: horoscope.solarDate,
      targetLunarDate: horoscope.lunarDate,
      nominalAge: horoscope.age.nominalAge,
      decadal,
      yearly: normalizeScope(horoscope.yearly),
    };
    if (JSON.stringify(snapshot) !== before) {
      throw engineError("NATAL_SNAPSHOT_MUTATED", "运限计算修改了本命盘快照。 ");
    }
    return deepFreeze(result);
  }

  function getRuleMeta() {
    return RULE_META;
  }

  return deepFreeze({ buildNatal, getHoroscope, getRuleMeta });
});
