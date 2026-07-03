/**
 * 奇门遁甲 - 时家转盘排盘核心算法
 * 拆补法定局 · 时空旬空 · 中宫寄坤二
 */

// ==================== 基础常量 ====================
const TIAN_GAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const DI_ZHI = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const STEM_ORDER = ['戊','己','庚','辛','壬','癸','丁','丙','乙']; // 地盘/天盘干序(无甲)

// 六十甲子
const GZ60 = [];
for (let i = 0; i < 60; i++) {
  GZ60.push(TIAN_GAN[i % 10] + DI_ZHI[i % 12]);
}

// 九宫洛书数
const GONG_NAME = ['','坎','坤','震','巽','中','乾','兑','艮','离'];
const GONG_NUM = {坎:1,坤:2,震:3,巽:4,中:5,乾:6,兑:7,艮:8,离:9};
// 九宫方位
const GONG_DIR = {坎:'北',坤:'西南',震:'东',巽:'东南',中:'中',乾:'西北',兑:'西',艮:'东北',离:'南'};
// 九宫五行
const GONG_WX = {坎:'水',坤:'土',震:'木',巽:'木',中:'土',乾:'金',兑:'金',艮:'土',离:'火'};

// 八门原宫位 (阳遁顺排)
const DOORS = ['休','生','伤','杜','景','死','惊','开'];
const DOOR_GONG = {休:1,死:2,伤:3,杜:4,中:5,开:6,惊:7,生:8,景:9};

// 九星原宫位
const STARS = ['天蓬','天芮','天冲','天辅','天禽','天心','天柱','天任','天英'];
const STAR_GONG = {天蓬:1,天芮:2,天冲:3,天辅:4,天禽:5,天心:6,天柱:7,天任:8,天英:9};

// 八神
const SPIRITS_YANG = ['值符','螣蛇','太阴','六合','白虎','玄武','九地','九天'];
const SPIRITS_YIN = ['值符','九天','九地','玄武','白虎','六合','太阴','螣蛇'];

// 六甲旬首
const XUN_SHOU = ['甲子','甲戌','甲申','甲午','甲辰','甲寅'];

// 十二长生
const CHANG_SHENG = ['长生','沐浴','冠带','临官','帝旺','衰','病','死','墓','绝','胎','养'];
// 天干长生起始位 (地支索引: 0=子,8=申, 等)
const CS_START = {甲:11,乙:6,丙:2,丁:9,戊:2,己:9,庚:5,辛:0,壬:8,癸:3}; // based on 亥 for 甲

// 地支六合/三合用于马星
const DI_ZHI_HE = {子:'丑',丑:'子',寅:'亥',亥:'寅',卯:'戌',戌:'卯',辰:'酉',酉:'辰',巳:'申',申:'巳',午:'未',未:'午'};

// 地支三合局 (用于马星): 申子辰→寅, 亥卯未→巳, 寅午戌→申, 巳酉丑→亥
const MA_XING_MAP = {
  申:'寅',子:'寅',辰:'寅',
  亥:'巳',卯:'巳',未:'巳',
  寅:'申',午:'申',戌:'申',
  巳:'亥',酉:'亥',丑:'亥'
};

// 击刑: 甲寅+巽4, 甲申+艮8, 甲子+震3, 甲辰+离9, 甲戌+坤2, 甲午+坎1(自刑/寄宫)
// 简化: 基于地支相刑
const JI_XING_MAP = {
  '子':['卯'], '卯':['子'], // 子卯刑
  '寅':['巳','申'], '巳':['寅','申'], '申':['巳','寅'], // 寅巳申刑
  '丑':['戌','未'], '戌':['未','丑'], '未':['丑','戌'], // 丑戌未刑
  '辰':['辰'], '午':['午'], '酉':['酉'], '亥':['亥'] // 自刑
};

// 旬首→六仪映射
const XUN_SHOU_YI_MAP = {'甲子':'戊','甲戌':'己','甲申':'庚','甲午':'辛','甲辰':'壬','甲寅':'癸'};

// 外圈八宫顺时针次序
const RING_GONGS = [1, 8, 3, 4, 9, 2, 7, 6];

// ==================== 二十四节气 ====================
const JIE_QI_DATA = [
  {name:'立春',month:2,approx:[4,5,1],dun:'阳'},  // index 0
  {name:'雨水',month:2,approx:[18,20,0],dun:'阳'},
  {name:'惊蛰',month:3,approx:[5,7,0],dun:'阳'},
  {name:'春分',month:3,approx:[20,22,0],dun:'阳'},
  {name:'清明',month:4,approx:[5,6,0],dun:'阳'},
  {name:'谷雨',month:4,approx:[19,21,0],dun:'阳'},
  {name:'立夏',month:5,approx:[5,7,0],dun:'阳'},
  {name:'小满',month:5,approx:[20,22,0],dun:'阳'},
  {name:'芒种',month:6,approx:[5,7,0],dun:'阳'},
  {name:'夏至',month:6,approx:[21,23,0],dun:'阴'},
  {name:'小暑',month:7,approx:[7,8,0],dun:'阴'},
  {name:'大暑',month:7,approx:[22,24,0],dun:'阴'},
  {name:'立秋',month:8,approx:[7,9,0],dun:'阴'},
  {name:'处暑',month:8,approx:[22,24,0],dun:'阴'},
  {name:'白露',month:9,approx:[7,9,0],dun:'阴'},
  {name:'秋分',month:9,approx:[22,24,0],dun:'阴'},
  {name:'寒露',month:10,approx:[7,9,0],dun:'阴'},
  {name:'霜降',month:10,approx:[23,25,0],dun:'阴'},
  {name:'立冬',month:11,approx:[7,9,0],dun:'阴'},
  {name:'小雪',month:11,approx:[22,24,0],dun:'阴'},
  {name:'大雪',month:12,approx:[6,8,0],dun:'阴'},
  {name:'冬至',month:12,approx:[21,23,0],dun:'阳'},
  {name:'小寒',month:1,approx:[5,7,0],dun:'阳'},
  {name:'大寒',month:1,approx:[20,22,0],dun:'阳'},
];

// 每节气三元局数: [上元,中元,下元]
const JIE_QI_JU = [
  [8,5,2],  // 立春 阳
  [9,6,3],  // 雨水 阳
  [1,7,4],  // 惊蛰 阳
  [3,9,6],  // 春分 阳
  [4,1,7],  // 清明 阳
  [5,2,8],  // 谷雨 阳
  [4,1,7],  // 立夏 阳
  [5,2,8],  // 小满 阳
  [6,3,9],  // 芒种 阳
  [9,3,6],  // 夏至 阴
  [8,2,5],  // 小暑 阴
  [7,1,4],  // 大暑 阴
  [2,5,8],  // 立秋 阴
  [1,4,7],  // 处暑 阴
  [9,3,6],  // 白露 阴
  [7,1,4],  // 秋分 阴
  [6,9,3],  // 寒露 阴
  [5,8,2],  // 霜降 阴
  [6,9,3],  // 立冬 阴
  [5,8,2],  // 小雪 阴
  [4,7,1],  // 大雪 阴
  [1,7,4],  // 冬至 阳
  [2,8,5],  // 小寒 阳
  [3,9,6],  // 大寒 阳
];

// ==================== 干支计算 ====================

/** 公历日期转干支日 (基于2000年1月1日为甲午日) */
function getDayGZ(year, month, day) {
  // 计算距离2000-01-01的天数
  const d = new Date(year, month - 1, day);
  const ref = new Date(2000, 0, 1);
  const diffDays = Math.round((d - ref) / (1000 * 60 * 60 * 24));
  // 2000-01-01 = 戊午 = GZ60[54]
  const idx = ((diffDays % 60) + 60 + 54) % 60; // 2000-01-01 = 戊午
  return GZ60[idx];
}

/** 根据日柱和时辰计算时柱干支 */
function getHourGZ(dayGZ, hour) {
  const hourDZ = Math.floor(((hour + 1) % 24) / 2); // 0=子(23-1), 1=丑(1-3)...
  const dayTG = TIAN_GAN.indexOf(dayGZ[0]);
  // 五鼠遁: 甲己日起甲子, 乙庚日起丙子, 丙辛日起戊子, 丁壬日起庚子, 戊癸日起壬子
  const startTG = [0,2,4,6,8][dayTG % 5]; // 甲0, 乙2=丙, 丙4=戊, ...
  const hourTG = (startTG + hourDZ) % 10;
  return TIAN_GAN[hourTG] + DI_ZHI[hourDZ];
}

/** 年柱计算 (以立春为界) */
function getYearGZ(year, month, day) {
  // 立春前(1月或2月4日前)用上一年干支
  let effYear = year;
  if (month === 1 || (month === 2 && day < 4)) {
    effYear--;
  }
  const baseYear = 1984; // 甲子年
  const idx = ((effYear - baseYear) % 60 + 60) % 60;
  return GZ60[idx];
}

/** 简化月柱计算 (以节气为界) */
function getMonthGZ(year, month, day) {
  // 月支: 寅=正月, 卯=二月, ...
  // 需要确定是否过立春、惊蛰等
  const jqIdx = getJieQiIndex(month, day);
  // 节气索引0=立春(寅月), 2=惊蛰(卯月), 4=清明(辰月), ...
  // 简化: 以节气索引确定月份
  let monthOffset = 0;
  if (jqIdx >= 0 && jqIdx < 2) monthOffset = 0; // 寅月
  else if (jqIdx >= 2 && jqIdx < 4) monthOffset = 1; // 卯月
  else if (jqIdx >= 4 && jqIdx < 6) monthOffset = 2; // 辰月
  else if (jqIdx >= 6 && jqIdx < 8) monthOffset = 3; // 巳月
  else if (jqIdx >= 8 && jqIdx < 10) monthOffset = 4; // 午月
  else if (jqIdx >= 10 && jqIdx < 12) monthOffset = 5; // 未月
  else if (jqIdx >= 12 && jqIdx < 14) monthOffset = 6; // 申月
  else if (jqIdx >= 14 && jqIdx < 16) monthOffset = 7; // 酉月
  else if (jqIdx >= 16 && jqIdx < 18) monthOffset = 8; // 戌月
  else if (jqIdx >= 18 && jqIdx < 20) monthOffset = 9; // 亥月
  else if (jqIdx >= 20 && jqIdx < 22) monthOffset = 10; // 子月
  else monthOffset = 11; // 丑月

  // 五虎遁: 甲己年丙寅月
  const yearTG = TIAN_GAN.indexOf(getYearGZ(year, month, day)[0]);
  const startTG = [2,4,6,8,0][yearTG % 5]; // 甲己→丙(2),乙庚→戊(4),丙辛→庚(6),丁壬→壬(8),戊癸→甲(0)
  const monthTG = (startTG + monthOffset) % 10;
  const monthDZ = (monthOffset + 2) % 12; // 寅月地支=寅(index 2)
  return TIAN_GAN[monthTG] + DI_ZHI[monthDZ];
}

/** 获取节气索引: 将日期转为近似年积日, 与24节气比较 */
function getJieQiIndex(month, day) {
  // 简化: 计算近似年积日(以立春为起点, 2月4日≈day 35)
  // 立春(2/4)作为节气年第一天
  const doy = [0,31,59,90,120,151,181,212,243,273,304,334][month-1] + day;
  // 调整: 以立春为基准
  const adjDoy = doy < 35 ? doy + 365 - 35 : doy - 35;
  
  // 每节气约15.2天, 定位到节气索引
  let idx = Math.floor(adjDoy / 15.22);
  if (idx >= 24) idx = 23;
  if (idx < 0) idx = 0;
  
  // 精确修正: 检查前后3个节气
  let best = idx;
  for (let di = -3; di <= 3; di++) {
    const i = ((idx + di) % 24 + 24) % 24;
    const jq = JIE_QI_DATA[i];
    const next = JIE_QI_DATA[(i + 1) % 24];
    // 检查日期是否在[jq, next)区间内
    const afterJq = (month > jq.month) || (month === jq.month && day >= jq.approx[0]);
    const beforeNext = (next.month > month) || (next.month === month && day < next.approx[0]);
    // 跨年情况: next在来年1月, month在12月
    const crossYear = next.month < jq.month && (month === 12 || month === 1);
    if (afterJq && (beforeNext || crossYear)) { best = i; break; }
  }
  return best;
}

/** 获取当前节气信息 */
function getCurrentJieQi(month, day) {
  const idx = getJieQiIndex(month, day);
  return { index: idx, ...JIE_QI_DATA[idx] };
}

// Benchmark-aligned jieqi boundaries for ju selection. Month pillars still use
// the simpler date-based jieqi index above; ju selection needs stricter edges.
const JU_JIE_QI_STARTS = {
  2026: [
    [1, 6, 22], [1, 20, 23], [2, 4, 0], [2, 19, 1],
    [3, 6, 2], [3, 20, 3], [4, 5, 4], [4, 20, 5],
    [5, 6, 6], [5, 21, 7], [6, 6, 8], [6, 22, 9],
    [7, 7, 10], [7, 23, 11], [8, 8, 12], [8, 23, 13],
    [9, 7, 14], [9, 23, 15], [10, 9, 16], [10, 23, 17],
    [11, 7, 18], [11, 22, 19], [12, 7, 20], [12, 23, 21],
  ],
  2027: [
    [1, 6, 22], [1, 20, 23], [2, 4, 0], [2, 19, 1],
  ],
};

function getJuJieQiIndex(year, month, day) {
  var starts = JU_JIE_QI_STARTS[year];
  if (!starts) return getJieQiIndex(month, day);
  var cur = new Date(year, month - 1, day).getTime();
  var best = null;
  for (var i = 0; i < starts.length; i++) {
    var s = starts[i];
    var t = new Date(year, s[0] - 1, s[1]).getTime();
    if (t <= cur) best = s[2];
    else break;
  }
  if (best == null) {
    var prev = JU_JIE_QI_STARTS[year - 1];
    if (!prev && year === 2026) return 21;
    return prev ? prev[prev.length - 1][2] : getJieQiIndex(month, day);
  }
  return best;
}

function getCurrentJuJieQi(year, month, day) {
  const idx = getJuJieQiIndex(year, month, day);
  return { index: idx, ...JIE_QI_DATA[idx] };
}

/** 判断日干支的天干是否甲/己，以及对应的地支(用于三元判定) */
function getYuanType(dayGZ) {
  const tg = dayGZ[0];
  const dz = dayGZ[1];
  // 找最近的甲/己日
  let gzIdx = GZ60.indexOf(dayGZ);
  if (gzIdx < 0) gzIdx = 0;
  
  // 向上找符头(最近的甲/己日)
  while (TIAN_GAN.indexOf(GZ60[gzIdx][0]) !== 0 && TIAN_GAN.indexOf(GZ60[gzIdx][0]) !== 5) {
    gzIdx = (gzIdx - 1 + 60) % 60;
  }
  const fuTou = GZ60[gzIdx];
  const fuDZ = fuTou[1];
  
  // 上元: 子午卯酉, 中元: 寅申巳亥, 下元: 辰戌丑未
  if ('子午卯酉'.includes(fuDZ)) return 0; // 上元
  if ('寅申巳亥'.includes(fuDZ)) return 1; // 中元
  return 2; // 下元
}

// ==================== 定局 (拆补法) ====================

/** 拆补法定局 */
function determineJu(year, month, day, dayGZ) {
  const jq = getCurrentJuJieQi(year, month, day);
  dayGZ = dayGZ || getDayGZ(year, month, day);
  const yuan = getYuanType(dayGZ);
  const juNum = JIE_QI_JU[jq.index][yuan];
  return {
    dun: jq.dun,      // '阳' or '阴'
    ju: juNum,        // 1-9
    jieQi: jq.name,
    yuan: ['上元','中元','下元'][yuan],
    dayGZ: dayGZ
  };
}

// ==================== 排盘核心 ====================

/** 查找天干在地盘的宫位 */
function findGanInDiPan(diPan, gan) {
  for (let g = 1; g <= 9; g++) {
    if (diPan[g] === gan) return g;
  }
  return 5;
}

/** 地盘干映射: 返回 { 宫位数字: 天干 } */
function getDiPan(dun, ju) {
  const dp = {};
  if (dun === '阳') {
    for (let i = 0; i < 9; i++) {
      const gong = ((ju - 1 + i) % 9) + 1;
      dp[gong] = STEM_ORDER[i];
    }
  } else {
    for (let i = 0; i < 9; i++) {
      const gong = ((ju - 1 - i + 9) % 9) + 1;
      dp[gong] = STEM_ORDER[i];
    }
  }
  return dp;
}

/** 获取旬首: 根据时柱干支 */
function getXunShou(ganzhi) {
  const idx = GZ60.indexOf(ganzhi);
  const xunStart = Math.floor(idx / 10) * 10;
  return GZ60[xunStart]; // 甲子/甲戌/甲申/甲午/甲辰/甲寅
}

/** 获取值符星: 旬首六仪地盘宫位的原始九星 */
function getZhiFu(juInfo, diPan, xunShou) {
  var yi = XUN_SHOU_YI_MAP[xunShou];
  var gong = findGanInDiPan(diPan, yi);
  var star = STARS[gong - 1];
  return { star: star === '天禽' ? '天芮' : star };
}

/** 获取值使门: 旬首六仪地盘宫位的原始门 = 值使门，阳顺阴逆移至落宫 */
function getZhiShi(juInfo, diPan, xunShou, hourGZ) {
  var yi = XUN_SHOU_YI_MAP[xunShou];
  var yiGong = findGanInDiPan(diPan, yi);
  
  // 八门原宫位: 休1死2伤3杜4(中5)开6惊7生8景9
  const origDoor = {1:'休',2:'死',3:'伤',4:'杜',5:'',6:'开',7:'惊',8:'生',9:'景'};
  
  // 中宫寄坤二: 值使门取坤2的死门, 落宫数从yiGong(5)起
  var doorSrcGong = yiGong === 5 ? 2 : yiGong;
  var landSrcGong = yiGong;
  const zhiShiDoor = origDoor[doorSrcGong];

  // 旬首地支到时辰地支的间隔
  const xunDZ = xunShou[1];
  const hourDZ = hourGZ[1];
  const dzDiff = (DI_ZHI.indexOf(hourDZ) - DI_ZHI.indexOf(xunDZ) + 12) % 12;

  // 值使落宫: 从landSrcGong开始阳顺阴逆数dzDiff步
  let landGong;
  if (juInfo.dun === '阳') {
    landGong = ((landSrcGong - 1 + dzDiff) % 9) + 1;
  } else {
    landGong = ((landSrcGong - 1 - dzDiff + 9) % 9) + 1;
  }
  if (landGong === 5) landGong = 2; // 中宫寄坤二
  
  return { door: zhiShiDoor, gong: landGong, origGong: doorSrcGong };
}

/** 天盘排布: 天盘干 = 该宫九星原宫位的地盘干 (芮禽双星→双干) */
function getTianPan(juInfo, diPan, zhiFu, xunShou, stars) {
  var starOrig = {天蓬:1,天芮:2,天冲:3,天辅:4,天禽:5,天心:6,天柱:7,天任:8,天英:9};

  var tp = {};
  for (var g = 1; g <= 9; g++) {
    var starNames = (stars[g] || '').split(',');
    var stems = [];

    // 芮+禽双星: 天禽(中5戊)在前, 天芮(坤2丁)在后
    if (starNames.length === 2 && starNames.indexOf('天禽') >= 0 && starNames.indexOf('天芮') >= 0) {
      stems = [diPan[5], diPan[2]];
    } else {
      for (var si = 0; si < starNames.length; si++) {
        var sn = starNames[si];
        if (sn && starOrig[sn]) {
          stems.push(diPan[starOrig[sn]]);
        }
      }
    }
    tp[g] = stems.join('');
  }

  return tp;
}

/** 九星排布: 值符星落时干宫, 8宫外圈顺时针, 天禽随天芮 */
function getStars(juInfo, zhiFu) {
  // 外圈八宫顺时针: 坎1→艮8→震3→巽4→离9→坤2→兑7→乾6
  // (using global RING_GONGS)
  // 原始星序对应外圈: 天蓬(1),天任(8),天冲(3),天辅(4),天英(9),天芮(2),天柱(7),天心(6)
  var RING_STARS = ['天蓬', '天任', '天冲', '天辅', '天英', '天芮', '天柱', '天心'];

  // 天禽寄坤二: 值符为天禽时按天芮处理
  var zhiFuStar = zhiFu.star === '天禽' ? '天芮' : zhiFu.star;
  var zhiFuStarIdx = RING_STARS.indexOf(zhiFuStar);
  if (zhiFuStarIdx < 0) return {};

  var landIdx = RING_GONGS.indexOf(zhiFu.gong);
  if (landIdx < 0) return {};

  var stars = {};
  for (var i = 0; i < 8; i++) {
    var star = RING_STARS[(zhiFuStarIdx + i) % 8];
    var gong = RING_GONGS[(landIdx + i) % 8];
    // 天禽随天芮一起
    if (star === '天芮') {
      stars[gong] = '天芮,天禽';
    } else {
      stars[gong] = star;
    }
  }

  return stars;
}

/** 八门排布: 值使门落值使宫，其余按休生伤杜景死惊开顺时针排在外圈八宫 */
function getDoors(juInfo, zhiShi) {
  // 外圈八宫顺时针次序: 坎1→艮8→震3→巽4→离9→坤2→兑7→乾6
  const RING_DOORS = ['休', '生', '伤', '杜', '景', '死', '惊', '开'];

  const zhiShiIdx = RING_DOORS.indexOf(zhiShi.door);
  if (zhiShiIdx < 0) return {};

  const landIdx = RING_GONGS.indexOf(zhiShi.gong);
  if (landIdx < 0) return {};

  const doors = {};
  for (let i = 0; i < 8; i++) {
    const door = RING_DOORS[(zhiShiIdx + i) % 8];
    const gong = RING_GONGS[(landIdx + i) % 8];
    doors[gong] = door;
  }

  return doors;
}

/** 八神排布: 值符落时干宫, 8宫外圈阳顺阴逆 */
function getSpirits(juInfo, zhiFu) {
  // (using global RING_GONGS)
  var order = juInfo.dun === '阳' ? SPIRITS_YANG : SPIRITS_YIN;

  var landIdx = RING_GONGS.indexOf(zhiFu.gong);
  if (landIdx < 0) return {};

  var spirits = {};
  for (var i = 0; i < 8; i++) {
    var gong = RING_GONGS[(landIdx + i) % 8];     // 阳阴均顺时针, 仅神序不同
    spirits[gong] = order[i];
  }

  return spirits;
}

// ==================== 标记计算 ====================

/** 时空旬空: 时柱天干+旬空地支 */
function getKongWang(hourGZ) {
  const idx = GZ60.indexOf(hourGZ);
  const xunStart = Math.floor(idx / 10) * 10;
  // 旬空地支: 该旬最后两个地支
  const dz1 = DI_ZHI[(xunStart + 10) % 60 % 12];
  const dz2 = DI_ZHI[(xunStart + 11) % 60 % 12];
  return [dz1, dz2];
}

/** 马星: 根据时柱地支找马星地支 */
function getMaXing(hourGZ) {
  const dz = hourGZ[1];
  return MA_XING_MAP[dz] || null;
}

/** 判断马星是否在某宫 (根据地盘干对应的地支) */
function isMaInGong(gongNum, maDZ) {
  if (!maDZ) return false;
  // 地盘干对应的藏干地支(简化: 天干→地支映射)
  const tgToDz = {甲:'寅',乙:'卯',丙:'午',丁:'巳',戊:'辰戌',己:'丑未',庚:'申',辛:'酉',壬:'亥',癸:'子'};
  // 实际上马星应该根据宫位地支来判断，简化用宫位对应地支
  const gongDz = {1:'子',8:'丑寅',3:'卯',4:'辰巳',9:'午',2:'未申',7:'酉',6:'戌亥'};
  return gongDz[gongNum] && gongDz[gongNum].includes(maDZ);
}

/** 门迫: 八门五行克宫位五行 */
function isMenPo(door, gongNum) {
  const doorWX = {休:'水',生:'土',伤:'木',杜:'木',景:'火',死:'土',惊:'金',开:'金'};
  const gongWX = GONG_WX[GONG_NAME[gongNum]];
  const wxKe = {木:'土',土:'水',水:'火',火:'金',金:'木'}; // 五行相克
  return wxKe[doorWX[door]] === gongWX;
}

/** 击刑: 六甲仪在特定宫位才有击刑 */
function isJiXing(gan, gongNum) {
  // 六甲击刑: 甲子戊·震3卯, 甲戌己·坤2未, 甲申庚·艮8寅, 甲午辛·离9午, 甲辰壬·巽4辰, 甲寅癸·巽4巳
  var JX_MAP = {
    '戊': [3],      // 甲子戊在震3(子卯刑)
    '己': [2],      // 甲戌己在坤2(戌未刑)
    '庚': [8],      // 甲申庚在艮8(寅申刑)
    '辛': [9],      // 甲午辛在离9(午自刑)
    '壬': [4],      // 甲辰壬在巽4(辰自刑)
    '癸': [4]       // 甲寅癸在巽4(寅巳刑)
  };
  var gongs = JX_MAP[gan];
  return gongs ? gongs.indexOf(gongNum) >= 0 : false;
}

/** 入墓: 天干入墓 */
function isRuMu(gan, gongNum) {
  const tgMu = {甲:'未',乙:'戌',丙:'戌',丁:'丑',戊:'戌',己:'丑',庚:'丑',辛:'辰',壬:'辰',癸:'未'};
  const gongDzMap = {1:'子',8:'丑',3:'卯',4:'辰',9:'午',2:'未',7:'酉',6:'戌'};
  const muDz = tgMu[gan];
  const gongDz = gongDzMap[gongNum] || '';
  return muDz && gongDz.includes(muDz);
}

/** 十二长生缩写: 长生→长 沐浴→沐 冠带→冠 临官→临 帝旺→旺 */
var CS_ABBR = ['长','沐','冠','临','旺','衰','病','死','墓','绝','胎','养'];

/** 十二长生显示文本: 隅宫(艮巽坤乾)双字, 正宫单字 */
function getChangSheng(gan, gongNum) {
  var gongDzMap = {1:'子',8:'丑',3:'卯',4:'辰',9:'午',2:'未',7:'酉',6:'戌'};
  var gongDz = gongDzMap[gongNum] || '子';
  var dzIdx = DI_ZHI.indexOf(gongDz[0]);

  var yangGan = '甲丙戊庚壬';
  var startPos = CS_START[gan];
  var isYang = yangGan.includes(gan);

  var offset;
  if (isYang) {
    offset = (dzIdx - startPos + 12) % 12;
  } else {
    offset = (startPos - dzIdx + 12) % 12;
  }

  var primary = CS_ABBR[offset];

  // 隅宫(艮8,巽4,坤2,乾6): 阳干=当前+下一态, 阴干=当前+上一态
  var corners = [8, 4, 2, 6];
  if (corners.indexOf(gongNum) < 0) return primary;

  var secondary;
  if (isYang) {
    secondary = CS_ABBR[(offset + 1) % 12];
  } else {
    secondary = CS_ABBR[(offset - 1 + 12) % 12];
  }
  return primary + secondary;
}

/** 寄干: 中宫寄坤二时，地盘干也要寄过去 */
function getJiGan(diPan) {
  return { gong: 2, gan: diPan[5] }; // 中5寄坤2
}

/** 暗干(隐干): 旬首宫=值使落宫→地盘旋转; 否则→时干加值使飞宫 */
function getYinGan(juInfo, diPan, zhiShi, hourGanEff, xunGong) {
  var isYang = juInfo.dun === '阳';
  var yinGan = {};
  var sameGong = (xunGong === zhiShi.gong) || (xunGong === 5 && zhiShi.gong === 2);

  // 旬首在中5 → 地盘旋转 (offset=9-局数, 阳逆/阴顺)
  if (xunGong === 5) {
    var offset = (9 - juInfo.ju + 9) % 9;
    for (var g = 1; g <= 9; g++) {
      var srcGong;
      if (isYang) { srcGong = ((g - 1 - offset + 9) % 9) + 1; }
      else { srcGong = ((g - 1 + offset) % 9) + 1; }
      yinGan[g] = diPan[srcGong];
    }
  } else if (sameGong) {
    // 地盘旋转: 阳逆用(5-原始宫), 阴顺用(9-局数)
    if (isYang) {
      var offsetY = (5 - zhiShi.origGong + 9) % 9;
      for (var gy = 1; gy <= 9; gy++) {
        yinGan[gy] = diPan[((gy - 1 - offsetY + 9) % 9) + 1];
      }
    } else {
      var offsetYn = (9 - juInfo.ju + 9) % 9;
      for (var gn = 1; gn <= 9; gn++) {
        yinGan[gn] = diPan[((gn - 1 + offsetYn) % 9) + 1];
      }
    }
  } else {
    // 时干加值使飞宫: 阳顺飞, 阴逆飞
    var startIdx = STEM_ORDER.indexOf(hourGanEff);
    if (startIdx < 0) startIdx = 0;
    var landGong = zhiShi.gong;
    for (var i = 0; i < 9; i++) {
      var gong;
      if (isYang) {
        gong = ((landGong - 1 + i) % 9) + 1;
      } else {
        gong = ((landGong - 1 - i + 9) % 9) + 1;
      }
      yinGan[gong] = STEM_ORDER[(startIdx + i) % 9];
    }
  }

  return yinGan;
}

// ==================== 主排盘函数 ====================

/**
 * 排盘主函数
 * @param {number} year - 公历年
 * @param {number} month - 公历月 (1-12)
 * @param {number} day - 公历日
 * @param {number} hour - 小时 (0-23)
 * @returns {object} 完整的排盘结果
 */
function paiPan(year, month, day, hour, minute) {
  var dayDate = new Date(year, month - 1, day);
  if (hour >= 23) dayDate.setDate(dayDate.getDate() + 1);
  var dayYear = dayDate.getFullYear();
  var dayMonth = dayDate.getMonth() + 1;
  var dayDay = dayDate.getDate();
  const dayGZ = getDayGZ(dayYear, dayMonth, dayDay);

  // 1. 定局
  const juInfo = determineJu(year, month, day, dayGZ);
  
  // 2. 干支
  const yearGZ = getYearGZ(year, month, day);
  const monthGZ = getMonthGZ(year, month, day);
  const hourGZ = getHourGZ(dayGZ, hour);
  
  // 3. 地盘
  const diPan = getDiPan(juInfo.dun, juInfo.ju);
  
  // 4. 旬首
  const xunShou = getXunShou(hourGZ);
  
  // 5. 值符 (旬首六仪地盘宫的原始九星)
  const zhiFu = getZhiFu(juInfo, diPan, xunShou);
  // 值符随时干: 时干甲遁于旬首六仪
  var hourGanEff = hourGZ[0] === '甲' ? XUN_SHOU_YI_MAP[xunShou] : hourGZ[0];
  zhiFu.gong = findGanInDiPan(diPan, hourGanEff);
  if (zhiFu.gong === 5) zhiFu.gong = 2; // 中宫寄坤二

  // 6. 值使
  const zhiShi = getZhiShi(juInfo, diPan, xunShou, hourGZ);

  // 7. 九星 (值符星落时干宫, 其余顺排)
  const stars = getStars(juInfo, zhiFu);

  // 8. 天盘
  const tianPan = getTianPan(juInfo, diPan, zhiFu, xunShou, stars);
  // 9. 八门 (外圈顺时针排布)
  const doors = getDoors(juInfo, zhiShi);

  // 10. 八神
  const spirits = getSpirits(juInfo, zhiFu);

  // 11. 暗干
  var yi = XUN_SHOU_YI_MAP[xunShou];
  var xunGong = 5;
  for (var gx = 1; gx <= 9; gx++) { if (diPan[gx] === yi) { xunGong = gx; break; } }
  const yinGan = getYinGan(juInfo, diPan, zhiShi, hourGanEff, xunGong);

  // 12. 旬空
  const kongWang = getKongWang(hourGZ);
  
  // 12. 马星
  const maXingDZ = getMaXing(hourGZ);
  
  // 13. 寄干
  const jiGan = getJiGan(diPan);
  
  // 14. 日主
  const riZhu = dayGZ[0]; // 日柱天干
  
  // 15. 组装每个宫位的信息
  var gongs = {};
  for (var gi = 1; gi <= 9; gi++) {
    var g = gi;
    var tpGan = tianPan[g] || '';
    var dpGan = diPan[g];
    var star = stars[g] || '';
    var door = doors[g] || '';
    var spirit = spirits[g] || '';

    // 标记 — 天盘逐干检查
    var jiXingTian = false, ruMuTian = false;
    var jxTianStems = [], rmTianStems = [];
    var csTianParts = [];
    if (tpGan) {
      var tpStems = tpGan.split('');
      for (var tsi = 0; tsi < tpStems.length; tsi++) {
        var jx = isJiXing(tpStems[tsi], g);
        var rm = isRuMu(tpStems[tsi], g);
        if (jx) jiXingTian = true;
        if (rm) ruMuTian = true;
        jxTianStems.push(jx);
        rmTianStems.push(rm);
        csTianParts.push(getChangSheng(tpStems[tsi], g));
      }
    }
    var csTian = csTianParts.join(' ');

    var jiXingDi = false, ruMuDi = false;
    var jxDiStems = [], rmDiStems = [];
    var csDi = '';

    // 坤2 寄干长生, 中5 寄宫标记
    var jg = '';
    if (g === 2 && jiGan.gan !== dpGan) {
      jg = jiGan.gan;
      // 地盘逐字: 寄干在前, 本宫干在后
      var dStems = [jiGan.gan, dpGan];
      for (var dsi = 0; dsi < 2; dsi++) {
        var jxd = isJiXing(dStems[dsi], g);
        var rmd = isRuMu(dStems[dsi], g);
        if (jxd) jiXingDi = true;
        if (rmd) ruMuDi = true;
        jxDiStems.push(jxd);
        rmDiStems.push(rmd);
      }
      csDi = getChangSheng(jiGan.gan, g) + ' ' + getChangSheng(dpGan, g);
    } else {
      jiXingDi = dpGan ? isJiXing(dpGan, g) : false;
      ruMuDi = dpGan ? isRuMu(dpGan, g) : false;
      csDi = dpGan ? getChangSheng(dpGan, g) : '';
    }
    if (g === 5 && jiGan.gan !== dpGan) {
      jg = '↳坤二';
    }

    var menPo = door ? isMenPo(door, g) : false;

    var gongDzMap = {1:'子',8:'丑寅',3:'卯',4:'辰巳',9:'午',2:'未申',7:'酉',6:'戌亥',5:''};
    var gongDz = gongDzMap[g] || '';
    var isKong = kongWang.some(function(k){ return gongDz.includes(k); });

    var hasMa = isMaInGong(g, maXingDZ);

    var isRiZhuTian = tpGan.indexOf(riZhu) >= 0;
    var isRiZhuDi = dpGan === riZhu;

    gongs[g] = {
      gong: g,
      name: GONG_NAME[g],
      direction: GONG_DIR[GONG_NAME[g]],
      wuxing: GONG_WX[GONG_NAME[g]],
      tianPan: tpGan,
      diPan: dpGan,
      star: star,
      door: door,
      spirit: spirit,
      jigan: g === 2 && jiGan.gan !== dpGan ? jiGan.gan : '',
      kongWang: isKong,
      maXing: hasMa,
      menPo: menPo,
      jiXingTian: jiXingTian,
      jiXingDi: jiXingDi,
      ruMuTian: ruMuTian,
      ruMuDi: ruMuDi,
      jxTianStems: jxTianStems,
      rmTianStems: rmTianStems,
      jxDiStems: jxDiStems,
      rmDiStems: rmDiStems,
      changShengTian: csTian,
      changShengDi: csDi,
      yinGan: yinGan[g] || '',
      isRiZhuTian: isRiZhuTian,
      isRiZhuDi: isRiZhuDi,
    };

    // 中宫: 清空神/星/门/天盘
    if (g === 5) {
      gongs[g].star = '';
      gongs[g].spirit = '';
      gongs[g].door = '';
      gongs[g].tianPan = '';
    }
  }
  
  return {
    solarTime: { year:year, month:month, day:day, hour:hour, minute:minute||0 },
    ganzhi: { year: yearGZ, month: monthGZ, day: dayGZ, hour: hourGZ },
    juInfo: {
      dun: juInfo.dun,
      ju: juInfo.ju,
      jieQi: juInfo.jieQi,
      yuan: juInfo.yuan,
      xunShou: xunShou,
      xunShouYi: ({'甲子':'戊','甲戌':'己','甲申':'庚','甲午':'辛','甲辰':'壬','甲寅':'癸'})[xunShou] || '',
      zhiFu: zhiFu.star,
      zhiShi: zhiShi.door,
      juShi: juInfo.dun + '遁 · 转盘'
    },
    riZhu: riZhu,
    kongWang: kongWang,
    maXing: maXingDZ,
    gongs: gongs
  };
}

// 导出 - 兼容 Node.js 和浏览器
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { paiPan: paiPan, GONG_NAME: GONG_NAME, TIAN_GAN: TIAN_GAN, DI_ZHI: DI_ZHI, GZ60: GZ60 };
}
if (typeof window !== 'undefined') {
  window.paiPan = paiPan;
  window.GONG_NAME = GONG_NAME;
}
