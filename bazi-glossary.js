/* 八字术语卡：只读现成盘面，不参与排盘、格局、喜用或岁运判定。 */
(function (root, factory) {
  'use strict';
  const api = factory(root, root.BaziEngine || (typeof require === 'function' ? require('./bazi-engine.js') : null));
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.BaziGlossary = api;
  if (root.document && typeof root.addEventListener === 'function') {
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', api.mount);
    else api.mount();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root, engine) {
  'use strict';
  const GROUPS = ['十神', '盘面', '格局', '喜用', '作用关系', '病药清浊', '大运流年', '星运空亡纳音', '神煞'];
  const NOTE = '规则按传统通行含义生成，仅供参考';
  const RAW = [];
  const add = (group, rows) => rows.forEach(([key, text, aliases = []]) => RAW.push({ key, group, text, aliases }));
  add('十神', [
    ['日主', '日主是八字的中心，就是「你自己」这一头，其他十神都相对它来看。', ['元男', '元女']],
    ['比肩', '和你同类、同路的力量，传统上看作同辈帮扶、合伙与分担。'],
    ['劫财', '也是同类力量，只是更急、更争，传统上看作同辈争用资源、分走眼前机会。'],
    ['比劫', '比肩和劫财的合称，都是与你同类的人和力量。'],
    ['正印', '学问资历与稳妥的靠山，传统上看作学习、方法和能托住你的支持。'],
    ['偏印', '也是学问资历，路子更偏、更灵活，传统上看作自学、技艺和另类方法上的靠山。'],
    ['印星', '正印和偏印的合称，都指学问资历与靠山。'],
    ['食神', '稳定的才华与产出，传统上看作把本事变成成果，也带来从容。'],
    ['伤官', '更外放的才华与表达，传统上看作口才、创意和突破成规，也容易顶撞规矩。'],
    ['食伤', '食神和伤官的合称，都指才华、表达与产出。'],
    ['正财', '稳定的钱财与收入，传统上看作靠本业积累、能算清也能留住的资源。'],
    ['偏财', '机动的钱财与机会，传统上看作额外收入、经营和外来的资源。'],
    ['财星', '正财和偏财的合称，都指钱财与收入。'],
    ['正官', '事业和规矩，传统上看作职责、秩序和按规则把事情做成。', ['官星']],
    ['七杀', '更强的压力与约束，传统上看作挑战、魄力和必须扛住的责任。', ['偏官']],
    ['官杀', '正官和七杀的合称，都指事业、规矩与外来压力。']
  ]);
  add('盘面', [
    ['四柱', '年、月、日、时四组干支，是八字的基本盘面。'],
    ['年柱', '出生年份对应的一组天干地支。'], ['月柱', '按节气划分的出生月份对应的一组天干地支。'],
    ['日柱', '出生日期对应的一组天干地支，天干就是日主。'], ['时柱', '出生时辰对应的一组天干地支。'],
    ['天干', '每柱上面的字，用甲乙丙丁戊己庚辛壬癸表示。'],
    ['地支', '每柱下面的字，用子丑寅卯辰巳午未申酉戌亥表示。'],
    ['藏干', '地支里面所含的天干，按本气、中气、余气列出。'],
    ['主星', '本页主星是每柱天干相对日主的十神，日干标作自身。'],
    ['副星', '本页副星是各柱地支藏干相对日主的十神。'],
    ['五行', '木火土金水五类力量，是干支和喜用的基本分类。'],
    ['月令', '出生月份的地支，传统上当作当令的主气，是定格局的起点。'],
    ['透干', '月令或地支里的五行出现在天干上，力量更容易显出来。'],
    ['通根', '天干在地支里有同类根基，传统上看作这股力量站得住。'],
    ['根气', '天干在地支里的同类根基，传统上看作这股力量站得住的来源。'],
    ['旺衰', '看日主自身根基够不够承担财、官、产出和压力，不是命好命坏的评分。'],
    ['强', '日主自身很旺，是旺衰的一档，不是命好命坏的评分。'],
    ['偏强', '日主自身偏旺，是旺衰的一档。'], ['中和', '日主的生扶与消耗大致相当，是旺衰的一档。'],
    ['偏弱', '日主根基不足但仍有能用的根，是旺衰的一档。'], ['弱', '日主根基偏不足，是旺衰的一档。'],
    ['真太阳时', '按出生地经度和日期校正后的地方真太阳时，用来按当地日照口径排盘。'],
    ['夏令时', '出生记录采用中国大陆1986至1991年夏令钟表时间时，先减去一小时，再按所选时间口径排盘。']
  ]);
  add('格局', [
    ['格局', '八字的主要作用路线，说明力量主要从哪一条路走，不代表见到某个格名就一定富贵。', ['命格']],
    ['贵格', '本盘因特定贵人神煞作的标记，不是另套吉凶评分。'],
    ['从格', '日主自身根基很弱，整盘顺着一股专旺的力量走，而不是扶起日主，成立要求很严。'],
    ['化气格', '两个天干相合后，改看成新的五行主势，原日主不再另立，成立要求很严。'],
    ['专旺格', '日主与全局同一五行极旺，顺着这一势走，成立要求很严。'],
    ['已成', '主要条件成立。'], ['成而有瑕', '结构成立但仍有损伤或限制。'],
    ['待成', '关键条件不足，只保留原有方向。'], ['已破', '关键连接受损，缓解不足。'],
    ['成格', '一条格局路线的主要条件成立，具体状态以本盘结论为准。'],
    ['破格', '格局的关键连接受损，具体状态以本盘结论为准。'],
    ['正官格', '以事业和规矩为主线，看责任、秩序能否被自身承担。'],
    ['七杀格', '以更强的压力与约束为主线，看挑战能否被化解或转化。'],
    ['正财格', '以稳定的钱财和收入为主线，看资源能否留下、自身能否承担。'],
    ['偏财格', '以机动的钱财和机会为主线，看外来资源能否接住。'],
    ['正印格', '以学问资历和稳妥靠山为主线。'], ['偏印格', '以更灵活的学问资历、技艺和方法为主线。'],
    ['食神格', '以稳定的才华和产出为主线。'], ['伤官格', '以表达、创意和突破成规的才华为主线。'],
    ['建禄格', '月令给日主同类根基，力量要用到财、官或产出上，而不是继续堆积自身。'],
    ['月劫用事', '月令是劫财一类的同类力量，需要约束或出口。'],
    ['月刃格', '月令是羊刃，冲劲大，关键是这股冲劲有没有约束。', ['羊刃格']],
    ['杀印相生格', '压力先转成靠山，再由靠山扶住自身。'],
    ['食神制杀格', '用稳定产出来约束七杀的压力。'], ['伤官配印格', '用印星收住伤官，让才华有分寸，同时也扶身。'],
    ['官印相生格', '事业和规矩生出靠山，靠山再扶身。'], ['财官印相生格', '收入生事业、事业生靠山、靠山再扶身，一条链要接通。'],
    ['伤官生财格', '表达和才华先变成收入。'], ['食神生财格', '稳定产出变成收入。'],
    ['财滋弱杀格', '用财星补足偏弱的七杀，让约束保持适度。'],
    ['羊刃驾杀格', '强旺的自身与七杀互相制衡，让冲劲用在承担责任上。'],
    ['从格：从杀格', '整盘顺着官杀压力的主势走。', ['从杀格']],
    ['从格：从财格', '整盘顺着财星资源的主势走。', ['从财格']],
    ['从格：从儿格', '整盘顺着食伤产出的主势走。', ['从儿格', '从食伤格']],
    ['化气格：甲己化土', '甲己天干相合后，看成土的主势。', ['甲己化土']],
    ['化气格：乙庚化金', '乙庚天干相合后，看成金的主势。', ['乙庚化金']],
    ['化气格：丙辛化水', '丙辛天干相合后，看成水的主势。', ['丙辛化水']],
    ['化气格：丁壬化木', '丁壬天干相合后，看成木的主势。', ['丁壬化木']],
    ['化气格：戊癸化火', '戊癸天干相合后，看成火的主势。', ['戊癸化火']],
    ['专旺格：曲直格', '整盘顺着木的旺势走。', ['曲直格']],
    ['专旺格：炎上格', '整盘顺着火的旺势走。', ['炎上格']],
    ['专旺格：稼穑格', '整盘顺着土的旺势走。', ['稼穑格']],
    ['专旺格：从革格', '整盘顺着金的旺势走。', ['从革格']],
    ['专旺格：润下格', '整盘顺着水的旺势走。', ['润下格']]
  ]);
  add('喜用', [
    ['主用', '对本盘最要紧、优先保住的五行帮助。'], ['佐用', '辅助主用、补足配合的五行。'],
    ['忌', '本盘要少添的五行，再加会加重负担或破坏配合。', ['忌项']],
    ['喜用', '为本盘服务的取用总称，具体看主用、佐用和忌。'],
    ['用神', '为本盘服务的取用总称，具体看主用、佐用和忌。'],
    ['喜神', '现有取用里帮助用神、补足配合的角色。'], ['忌神', '现有取用里加重结构负担的角色。'],
    ['仇神', '现有取用里损害喜神或帮助忌神的角色。'],
    ['调候', '按出生季节的冷热燥湿做调节，只作参考，不改变主用、佐用、忌。'],
    ['通关', '两种互相顶牛的力量中间，用第三种力量把路接上。', ['通关参考']]
  ]);
  add('作用关系', [
    ['六合', '两地支相合，传统上看作牵绊、合作或合并成一股气。', ['合']],
    ['冲', '两支对冲，传统上看作冲突、触动或原有力量被撞开。'],
    ['刑', '地支间的刑伤关系，传统上辅助看根气受损。'],
    ['害', '地支间的暗耗关系，传统上辅助看根气受损。'],
    ['破', '地支间的破坏关系，传统上辅助看根气受损。'],
    ['三合', '三个地支组成同一五行的合局，具体成局状态以本盘已有结论为准。'],
    ['三会', '三个地支会成同一季节的五行主势，具体成局状态以本盘已有结论为准。'],
    ['半合', '三合只见其中两支，是合局的一半线索。'], ['半会', '三会只见其中两支，是会局的一半线索。'],
    ['天干合', '两个天干相合，具体合绊或合化状态以本盘已有结论为准。'],
    ['天干冲', '两个天干相冲，是天干间相互触动的关系。']
  ]);
  add('病药清浊', [
    ['病药', '「病」是卡住结构的问题，「药」是用来疏通或缓解的力量。'],
    ['清浊', '看有用的力量是否清楚、干扰是否被分开或化解。'],
    ['去留', '看现有结构中保留哪些力量、疏解哪些干扰。'],
    ['化神', '化气格天干相合后所看的新五行主势。']
  ]);
  add('大运流年', [
    ['大运', '约十年一步的运，看这十年哪些力量被引动或加重。'],
    ['流年', '一年一步的运，按所选年份的干支看被引动的力量。'],
    ['流月', '一月一步的运，按节气划分月份并看该月干支。'],
    ['岁运', '大运与流年的合称，把十年阶段和所选年份放在一起看。'],
    ['起运', '从出生到第一步大运开始的时间，本页按已有起运结果展示。'],
    ['岁运并临', '流年干支与大运干支相同，传统上看作这一年与所行大运同气、影响加重。'],
    ['日犯岁君', '日主去克流年天干，是传统岁运提示，不单独改变本页判定。'],
    ['变格', '这步运把月令里藏着的力量引出来，原来的格局路线被打乱。']
  ]);
  add('星运空亡纳音', [
    ['星运', '日主在十二地支上的阶段，辅助看这股气是生长、旺盛还是收敛，不是单独的吉凶评分。', ['长生十二宫']],
    ['长生', '气开始生长。'], ['沐浴', '气流动、不稳定。'],
    ['冠带', '气开始成形。'], ['临官', '气已能做事。'],
    ['帝旺', '气势最旺、力量最盛。'], ['衰', '气由盛转收。'],
    ['病', '气受阻、收敛。'], ['死', '这股气阶段性收尽。'],
    ['墓', '气收藏、入库。'], ['绝', '旧气已尽、等待新生。'],
    ['胎', '新气开始孕育。'], ['养', '气蓄势待发。'],
    ['本旬空亡', '排盘独立行按每列干支所属的旬，列出该旬所空的两个地支。'],
    ['空亡', '神煞行以原局日柱所属旬为基准。某柱或岁运的地支落入日旬所空的两支时才标记。', ['日空']],
    ['纳音', '一组干支合起来的传统五行别名。']
  ]);
  add('神煞', [
    ['天乙贵人', '传统上最看重的贵人标记，表示遇事容易得人帮衬'],
    ['太极贵人', '传统上看作悟性、钻研和喜欢追根问底的标记'],
    ['文昌贵人', '传统上看作文才、学习和考试文书上的帮助标记'],
    ['天厨贵人', '传统上看作衣食来源和受供养的标记'], ['福星贵人', '传统上看作福气、照应和生活上有人衬托的标记'],
    ['国印贵人', '以年干或日干查地支，丙见丑。传统上看作权柄、公信和职任印章一类的标记'],
    ['金舆', '传统上看作车马、配得上的待遇与安稳出行的标记'],
    ['流霞', '传统上看作血光、手术或面部损伤一类的提醒标记'],
    ['红艳', '传统上看作情感魅力与桃花性质的标记'], ['禄神', '传统上看作俸禄、本业收入的标记'],
    ['羊刃', '日主旺盛时的冲劲与锋芒的传统标记，看果断与约束'],
    ['桃花', '传统上看作魅力、人际吸引和感情机会的标记'], ['华盖', '年支和日支各查余柱，岁运也可命中。传统上看作孤高、才华和宗教礼法兴趣的标记'],
    ['驿马', '传统上看作奔走、出行、搬迁和变动的标记'], ['将星', '年支和日支各查余柱，岁运也可命中。传统上看作主持、决断和带头的标记'],
    ['劫煞', '传统上看作争夺、破耗和突发变故的提醒标记'], ['亡神', '年支和日支各查余柱，岁运也可命中。传统上看作耗散、迷失和计划落空的提醒标记'],
    ['灾煞', '传统上看作意外、冲撞类的提醒标记'], ['元辰', '依年干阴阳和性别选表，以年支查余柱及岁运。传统上看作意见不合、合作不顺的提醒标记'],
    ['红鸾', '传统上看作喜庆、感情和热闹事件的标记'], ['天喜', '传统上看作喜庆、感情和热闹事件的标记'],
    ['披麻', '传统上看作丧吊、孝服类的提醒标记'], ['吊客', '传统上看作丧吊、孝服类的提醒标记'],
    ['寡宿', '传统上看作孤独、孝服类的提醒标记'], ['孤辰', '与寡宿成对，以年支查余柱和岁运。传统上看作独处、少依靠的提醒标记'], ['天医', '传统上看作医药、治疗和照料的标记'],
    ['天德贵人', '按出生月份取的德星，传统上看作化解是非、减轻过错'],
    ['天德合', '依月令取天德，天干查五合，四仲月地支查六合。传统上作用同天德而稍轻'],
    ['月德贵人', '按出生月份三合局取的德星，传统上看作遇事多得宽待、平和化解'],
    ['月德合', '与月德贵人相合的天干，传统上作用同月德而稍轻'],
    ['德秀贵人', '以月令取德干和秀干，一柱见其中任一干即可标记，传统上看作品性端正、学业文采有成'],
    ['童子煞', '仅查原局日支和时支，符合月令季节口诀或年纳音口诀即可标记。传统上看作心性年轻、与小孩缘深的标记'],
    ['十恶大败', '某些日柱组合的传统凶忌名，多指钱财难聚的标记'],
    ['魁罡', '传统上看作刚强、果决、不容污的标记'], ['阴差阳错', '传统上看作阴阳搭配错位、事情容易别扭的标记'],
    ['孤鸾', '传统上看作婚姻感情上孤独或不合的提醒标记'], ['天赦日', '仅在原局日柱按季节标记，春戊寅、夏甲午、秋戊申、冬甲子。传统上看作宽宥、解困的日期标记'],
    ['词馆', '按年柱纳音五行查月、日、时及岁运地支。金申、木寅、水亥、土亥、火巳。传统上看作文才、学业的标记'],
    ['学堂', '按年柱纳音五行查月、日、时及岁运地支。金巳、木亥、水申、土申、火寅。传统上看作文才、学业的标记'], ['血刃', '以原局月支查四柱及岁运地支。传统上看作血光、刀针类的提醒标记']
  ].map(([key, text]) => [key, `${text}。`]));

  const NAYIN = '海中金 炉中火 大林木 路旁土 剑锋金 山头火 涧下水 城头土 白蜡金 杨柳木 泉中水 屋上土 霹雳火 松柏木 长流水 砂中金 山下火 平地木 壁上土 金箔金 覆灯火 天河水 大驿土 钗钏金 桑柘木 大溪水 沙中土 天上火 石榴木 大海水'.split(' ');
  RAW.find(t => t.key === '纳音').aliases = NAYIN;
  const TERMS = Object.freeze(RAW.map(t => Object.freeze({ ...t, aliases: Object.freeze(t.aliases) })));
  const BY_KEY = new Map(TERMS.map(t => [t.key, t]));
  const ALIAS = new Map();
  TERMS.forEach(t => [t.key, ...t.aliases].forEach(a => ALIAS.set(a, t.key)));
  const WORDS = [...ALIAS.keys()].filter(k => k.length > 1).sort((a, b) => b.length - a.length);
  const WORD_RE = new RegExp(WORDS.join('|'), 'g');
  function resolve(value) { return ALIAS.get(String(value || '').trim()) || null; }
  function get(key) { return BY_KEY.get(resolve(key)) || null; }
  function tokenize(text, options = {}) {
    const source = String(text || '');
    if (options.token) {
      return source.split(/([\s：:，、；·（）]+)/).filter(Boolean).flatMap(part => resolve(part) ? [{ text: part, key: resolve(part) }] : tokenize(part));
    }
    const out = []; let last = 0;
    source.replace(WORD_RE, (word, offset) => {
      if (offset > last) out.push({ text: source.slice(last, offset) });
      out.push({ text: word, key: resolve(word) }); last = offset + word.length; return word;
    });
    if (last < source.length) out.push({ text: source.slice(last) });
    return out;
  }
  const PILLARS = [['year', '年'], ['month', '月'], ['day', '日'], ['hour', '时']];
  const GODS = { 比劫: ['比肩', '劫财'], 印星: ['正印', '偏印'], 食伤: ['食神', '伤官'], 财星: ['正财', '偏财'], 官杀: ['正官', '七杀'] };
  const STAGES = '长生 沐浴 冠带 临官 帝旺 衰 病 死 墓 绝 胎 养'.split(' ');
  const element = stem => engine?.constants.STEM_WX[stem] || '';
  function nayin(gz) {
    const stems = '甲乙丙丁戊己庚辛壬癸', branches = '子丑寅卯辰巳午未申酉戌亥';
    const index = Array.from({ length: 60 }, (_, i) => stems[i % 10] + branches[i % 12]).indexOf(gz);
    return index < 0 ? '' : NAYIN[Math.floor(index / 2)];
  }
  function chartLine(value, ctx = {}) {
    const key = resolve(value), term = get(key), data = ctx.snapshot;
    if (!term || !data?.pillars) return '';
    const p = data.pillars, lc = ctx.luckContext;
    if (term.group === '神煞' || ['贵格', '本旬空亡', '空亡'].includes(key)) {
      const markers = root.BaziShenSha || (typeof module === 'object' && module.exports ? require('./bazi-shensha.js') : null);
      if (!markers) return '';
      const natal = PILLARS.map(([id, name]) => [id, name + '柱', p[id]]);
      const transit = [
        ['flowMonth', '所选流月', lc?.flowMonth?.gz],
        ['flowYear', '所选流年', lc?.flowYear?.gz],
        ['luck', '所选大运', lc?.luckRow?.gz]
      ].filter(([, , gz]) => gz);
      const columns = key === '贵格' ? natal : [...natal, ...transit];
      if (key === '本旬空亡') return columns.map(([, name, gz]) => `${name}${gz}空${markers.kongWang(gz)}`).join('、') + '。';
      const marked = columns.map(([id, name, gz]) => [name, gz, markers.forPillar(data, gz, id)]);
      if (key === '空亡') {
        const hits = marked.filter(([, , names]) => names.includes(key)).map(([name, gz]) => name.replace(/柱$/, '') + '支' + gz[1]);
        return `日柱${p.day}，旬空${markers.kongWang(p.day)}。${hits.length ? hits.join('、') + '落空亡' : '各列地支未落入日柱旬空'}。`;
      }
      const hits = marked.flatMap(([name, , names]) => names.filter(s => key === '贵格' ? /贵人/.test(s) : s === key).map(s => `${name}有${s}`));
      return hits.length ? hits.join('；') + '。' : `${transit.length && key !== '贵格' ? '四柱与所选岁运' : '四柱'}未见${key === '贵格' ? '贵人神煞标记' : key}。`;
    }
    if (!engine) return '';
    const a = data.patternAnalysis || {}, u = a.useful || data.useful || {};
    const conclusion = u.decision?.conclusion || {};
    const primary = a.primary || data.pattern || '', structures = a.patternStructures || [];
    const status = structures.find(s => s.name === primary)?.status || a.regularPattern?.status || a.patternVerdict || '未提供状态';
    const identity = `你的日主是${data.dayStem}${data.dayElement || element(data.dayStem)}，日主${data.strength || a.strength || '档位未提供'}。`;
    const summary = `本盘按${primary || '页面现有格局'}看，状态为${status}。`;
    if (key === '日主') return identity;
    if (term.group === '十神') {
      const gods = GODS[key] || [key], hits = [];
      PILLARS.forEach(([id, name]) => {
        const gz = p[id];
        if (id !== 'day' && gods.includes(engine.tenGod(data.dayStem, gz[0]))) hits.push(`${name}干${gz[0]}${element(gz[0])}（${engine.tenGod(data.dayStem, gz[0])}）`);
        (engine.constants.HIDDEN[gz[1]] || []).forEach(s => { if (gods.includes(engine.tenGod(data.dayStem, s))) hits.push(`${name}支藏${s}${element(s)}（${engine.tenGod(data.dayStem, s)}）`); });
      });
      return `${identity}${hits.length ? `${key}出现在${hits.join('、')}。` : `四柱天干和藏干里没有${key}。`}`;
    }
    if (term.group === '格局') {
      if (['格局', '已成', '成而有瑕', '待成', '已破', '成格', '破格'].includes(key)) return summary;
      if (['从格', '化气格', '专旺格'].includes(key)) {
        const hit = (a.specialPatterns || []).find(s => String(s.name || s).startsWith(key));
        return hit ? `${summary}已有特殊格标记：${hit.name || hit}。` : `本盘未按${key}成立。`;
      }
      const hit = structures.find(s => resolve(s.name) === key);
      return primary === key || resolve(primary) === key ? `本盘就是${key}，状态为${status}。` : hit ? `本盘有「${key}」结构，状态为${hit.status}；当前主线为${primary}。` : `本盘不是「${key}」，未按此格成立；当前主线为${primary || '未提供'}。`;
    }
    if (['强', '偏强', '中和', '偏弱', '弱', '旺衰'].includes(key)) return identity;
    if (key === '四柱') return `你的四柱是${PILLARS.map(([id]) => p[id]).join('、')}。`;
    const pillar = PILLARS.find(([, name]) => key === name + '柱');
    if (pillar) return `你的${key}是${p[pillar[0]]}。`;
    if (['天干', '地支', '藏干', '主星', '副星'].includes(key)) return PILLARS.map(([id, name]) => {
      const gz = p[id], hidden = engine.constants.HIDDEN[gz[1]] || [];
      const row = key === '天干' ? gz[0] : key === '地支' ? gz[1] : key === '藏干' ? hidden.join('、') : key === '主星' ? (id === 'day' ? '日主自身' : engine.tenGod(data.dayStem, gz[0])) : hidden.map(s => engine.tenGod(data.dayStem, s)).join('、');
      return `${name}柱${row}`;
    }).join('；') + '。';
    if (key === '五行') {
      if (!data.scores) return '本盘未提供五行分布。';
      const missing = Object.keys(data.scores).filter(k => data.scores[k] === 0);
      return `本盘五行分布：${Object.entries(data.scores).map(([k, v]) => `${k}${v}`).join('、')}。${missing.length ? `现成分布中未见${missing.join('、')}。` : '五行齐全。'}`;
    }
    if (key === '月令') return a.monthCommand ? `你的月令是${a.monthCommand.branch}，月令本气为${a.monthCommand.baseStem}${element(a.monthCommand.baseStem)}${a.monthCommand.baseGod}。` : `你的月令是${p.month[1]}。`;
    if (['透干', '通根', '根气'].includes(key)) return (a.evidence || []).filter(s => s.startsWith(key === '透干' ? '透干：' : '通根：')).join('\n') || `本盘未提供${key}条目。`;
    const role = { 主用: 'primary', 佐用: 'secondary', 忌: 'avoid' }[key];
    if (role) return `本盘${key}是${(conclusion[role] || u[{ primary: 'primaryUse', secondary: 'secondaryUse', avoid: 'avoid' }[role]] || []).join('、') || '未列出'}。` + (role === 'secondary' && conclusion.conditional?.length ? `其中${conclusion.conditional.join('、')}按已有条件使用。` : '');
    if (key === '喜用' || key === '用神') return ['主用', '佐用', '忌'].map(k => chartLine(k, ctx)).join('');
    if (['喜神', '忌神', '仇神'].includes(key)) {
      const row = u.roles?.[{ 喜神: 'joyGod', 忌神: 'avoidGod', 仇神: 'enemyGod' }[key]];
      return row?.elements?.length ? `本盘${key}：${row.elements.join('、')}（${(row.tenGods || []).join('、')}）。` : `本盘未列出${key}。`;
    }
    if (key === '调候') return `${u.layers?.tiaohou?.why || '本盘未提供调候参考。'}\n调候只作参考，不改变主用、佐用、忌。`;
    if (key === '通关') return `${u.decision?.priority?.text?.includes('通关') ? u.decision.priority.text : '本盘未提供通关参考。'}\n这里只复述取用参考，不改变主用、佐用、忌。`;
    if (term.group === '作用关系') {
      const i = a.interactions || {};
      const rows = key === '天干合' ? i.stemCombines || [] : key === '天干冲' ? (i.stemPairs || []).filter(r => /冲/.test(r.type || r.text)) : ['三合', '三会', '半合', '半会'].includes(key) ? (i.groups || []).filter(r => (r.name || '').startsWith(key)) : (i.branchPairs || []).filter(r => r.type === key || (key === '冲' && /冲/.test(r.type)));
      return rows.length ? rows.map(r => r.text || r.name).join('；') + '。' : `本盘四柱未见${key}关系。`;
    }
    if (key === '病药') return a.patternDisease?.text || '本盘未列出病药条目。';
    if (key === '清浊' || key === '去留') return a.clarity ? `本盘清浊为「${a.clarity.level}」：${a.clarity.text}` : '本盘未提供清浊去留条目。';
    if (key === '化神') return primary.startsWith('化气格：') ? `本盘化气条目：${primary}。` : '本盘未按化气格成立。';
    if (key === '星运' || STAGES.includes(key)) {
      const rows = PILLARS.map(([id, name]) => ({ name, stage: engine.changsheng(data.dayStem, p[id][1]) }));
      const hits = key === '星运' ? rows : rows.filter(r => r.stage === key);
      return hits.length ? `${hits.map(r => `${r.name}支${r.stage}`).join('，')}。` : `四柱未见${key}。`;
    }
    if (key === '纳音') return PILLARS.map(([id, name]) => `${name}柱${nayin(p[id])}`).join('，') + '。';
    if (key === '真太阳时') return data.time?.enabled ? `本盘启用真太阳时，采用${formatTime(data.time.used)}。` : '本盘未启用真太阳时，按输入时间口径排盘。';
    if (key === '夏令时') return data.time?.daylightSaving ? '本盘已按夏令时减去一小时，再按所选时间口径排盘。' : '本盘未启用夏令时校正。';
    if (term.group === '大运流年') {
      if (!lc) return '尚未选择大运流年，选择后显示现成盘面条目。';
      const decade = lc.luckRow ? `所选大运${lc.luckRow.gz}，${lc.luckRow.from}–${lc.luckRow.to}岁。` : '尚未选择大运。';
      const year = lc.flowYear ? `所选流年${lc.flowYear.year}年${lc.flowYear.gz}。` : '尚未选择流年。';
      if (key === '大运') return decade;
      if (key === '流年') return year;
      if (key === '流月') return lc.flowMonth ? `所选流月${lc.flowMonth.term}（${lc.flowMonth.dateLabel}），${lc.flowMonth.gz}。` : '尚未选择流月。';
      if (key === '岁运') return decade + year;
      if (key === '起运') return lc.luck ? `本盘${lc.luck.direction}，${lc.luck.startAge}岁起运，${lc.luck.startYear}年开始。` : '本盘未提供起运条目。';
      // Evidence is supplied by the page from its existing selected-year outlook, never re-evaluated here.
      const evidence = lc.evidence || [];
      if (key === '变格') return lc.patternShift?.text || (lc.patternShift?.kind ? `本段成格变格提示：${lc.patternShift.kind}。` : '本段无成格变格提示。');
      return evidence.filter(s => s.includes(key)).join('\n') || `所选流年没有${key}提示。`;
    }
    return '';
  }
  function formatTime(t) { return t ? `${t.year}-${t.month}-${t.day} ${t.hour}:${String(t.minute).padStart(2, '0')}` : '页面所示时间'; }
  function aiQuestion(key, line) {
    return `请用白话详细讲讲“${resolve(key) || key}”的传统含义${line ? `，结合我的盘面事实（${line.split('\n')[0]}）说明它在本盘中的作用` : ''}，请保持中性，不要宿命化，也不要把传统标记直接等同于具体事件。`;
  }
  function search(query) {
    const q = String(query || '').trim();
    return TERMS.filter(t => !q || [t.key, t.group, t.text, ...t.aliases].some(s => s.includes(q)));
  }
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
  function mineHtml(line) { return line ? `<div class="bz-pop-mine"><small>在你的盘上</small>${line.split('\n').map(s => `<span>${esc(s)}</span>`).join('')}</div>` : ''; }
  function renderCard(term, line, withAi) {
    return `<div class="bz-pop-head"><span class="bz-pop-group">${esc(term.group)}</span><strong id="bzTermPopTitle">${esc(term.key)}</strong><button type="button" class="bz-pop-x" data-bz-close aria-label="关闭术语卡">×</button></div><p class="bz-pop-text">${esc(term.text)}</p>${term.key === '夏令时' && root.BirthTime ? `<div class="bz-time-help">${root.BirthTime.helpHtml}</div>` : ''}${mineHtml(line)}<p class="bz-pop-note">${NOTE}</p><div class="bz-pop-actions">${withAi ? `<button type="button" data-bz-ask="${esc(term.key)}">问 AI 详细讲讲</button>` : ''}<button type="button" data-bz-dict="${esc(term.key)}">新手词典</button></div>`;
  }

  function mount() {
    const doc = root.document;
    if (!doc?.querySelector('.page-intro') || doc.getElementById('bzTermPop')) return;
    const view = { snapshot: root.currentBazi || null, luckContext: null };
    const motionOK = () => root.PremiumUI ? root.PremiumUI.motionOK() : !root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pop = doc.createElement('div');
    pop.id = 'bzTermPop'; pop.className = 'bz-pop'; pop.hidden = true;
    pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-labelledby', 'bzTermPopTitle');
    const scrim = doc.createElement('div');
    scrim.className = 'bz-pop-scrim'; scrim.hidden = true;
    scrim.setAttribute('data-bz-close', ''); scrim.setAttribute('aria-hidden', 'true');
    doc.body.appendChild(scrim);
    doc.body.appendChild(pop);
    const dlg = doc.createElement('div'); dlg.id = 'bzDict'; dlg.className = 'bz-dict'; dlg.hidden = true;
    dlg.innerHTML = `<div class="bz-dict-scrim" data-bz-dict-close></div>
      <section class="bz-dict-panel" role="dialog" aria-modal="true" aria-labelledby="bzDictTitle">
        <span class="bz-dict-grip" aria-hidden="true"></span>
        <header class="bz-dict-head"><div><small>看不懂就查这里</small><h2 id="bzDictTitle">新手词典</h2></div>
          <button type="button" class="bz-pop-x bz-dict-x" data-bz-dict-close aria-label="关闭词典">×</button></header>
        <div class="bz-dict-tools">
          <label class="bz-dict-search"><svg class="bz-lens" viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.6" cy="8.6" r="5.6" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="m13 13 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg><span class="bz-sr sr-only">搜索术语</span><input id="bzDictSearch" type="search" placeholder="正官、伤官格、天乙贵人……" autocomplete="off"><button type="button" class="bz-dict-clear" aria-label="清空搜索" hidden>×</button></label>
          <p class="bz-dict-count" aria-live="polite"></p>
        </div>
        <div class="bz-dict-main"><nav class="bz-dict-groups" aria-label="术语分组"></nav><div class="bz-dict-body" id="bzDictBody"></div></div>
        <p class="bz-dict-foot">${NOTE}</p>
      </section>`;
    doc.body.appendChild(dlg);
    const dictSearch = dlg.querySelector('input'), dictBody = dlg.querySelector('#bzDictBody');
    let trigger = null, dictReturn = null;
    const sub = doc.querySelector('.page-intro .sub');
    if (sub) sub.insertAdjacentHTML('afterend', `<button type="button" id="bzDictBtn" class="bz-dict-btn" data-bz-dict=""><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 5.2C8.4 4 6.3 3.6 3.5 3.8v11.4c2.8-.2 4.9.2 6.5 1.4m0-11.4c1.6-1.2 3.7-1.6 6.5-1.4v11.4c-2.8-.2-4.9.2-6.5 1.4m0-11.4v11.4" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg><span>新手词典</span><i>${TERMS.length} 条</i></button>`);
    function close(restore = false) {
      pop.hidden = scrim.hidden = true; trigger?.classList.remove('bz-term-on');
      if (restore && trigger?.isConnected) trigger.focus({ preventScroll: true });
      trigger = null;
    }
    function place() {
      if (pop.hidden) return;
      pop.style.left = pop.style.top = '';
      if (root.innerWidth <= 760) return;
      const r = trigger?.getBoundingClientRect();
      if (!r) return;
      const width = pop.offsetWidth, height = pop.offsetHeight;
      pop.style.left = `${Math.max(12, Math.min(r.left + r.width / 2 - width / 2, root.innerWidth - width - 12))}px`;
      pop.style.top = `${Math.max(12, Math.min(r.bottom + 8, root.innerHeight - height - 12))}px`;
    }
    function open(key, anchor) {
      const term = get(key); if (!term) return;
      root.closeAllHelpPopovers?.(); close(); trigger = anchor;
      trigger?.classList.add('bz-term-on'); pop.dataset.term = term.key;
      pop.innerHTML = renderCard(term, chartLine(term.key, view), !!view.snapshot);
      pop.hidden = scrim.hidden = false; place();
      if (motionOK()) pop.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 160 });
      pop.querySelector('button').focus({ preventScroll: true });
    }
    function closeDict(restore = true) {
      dlg.hidden = true; doc.documentElement.classList.remove('bz-dict-lock');
      if (restore && dictReturn?.isConnected) dictReturn.focus({ preventScroll: true });
    }
    const dictGroups = dlg.querySelector('.bz-dict-groups');
    const dictCount = dlg.querySelector('.bz-dict-count'), dictClear = dlg.querySelector('.bz-dict-clear');
    let dictGroup = '', dictOpen = null;
    const highlight = (value, query) => query ? String(value).split(query).map(esc).join(`<mark>${esc(query)}</mark>`) : esc(value);
    function renderDict() {
      const query = dictSearch.value.trim(), list = search(query);
      dictClear.hidden = !dictSearch.value;
      dictCount.innerHTML = `${query ? '找到' : '共'} <b>${list.length}</b> 条`;
      const tab = (group, count) => `<button type="button" data-bz-group="${esc(group)}"${dictGroup === group ? ' aria-current="true"' : ''}${count ? '' : ' aria-disabled="true"'}><span>${esc(group || '全部')}</span><i>${count}</i></button>`;
      dictGroups.innerHTML = tab('', list.length) + GROUPS.map(g => tab(g, list.filter(t => t.group === g).length)).join('');
      const withAi = !!view.snapshot;
      if (!list.length) {
        dictBody.innerHTML = '<div class="bz-dict-empty"><p class="bz-dict-empty-t">没有找到，换个词试试。</p><p class="bz-dict-empty-s">可以试试：<button type="button" class="bz-dict-try" data-bz-try="正官">正官</button><button type="button" class="bz-dict-try" data-bz-try="伤官格">伤官格</button><button type="button" class="bz-dict-try" data-bz-try="天乙贵人">天乙贵人</button></p></div>';
        return;
      }
      dictBody.innerHTML = (dictGroup ? [dictGroup] : GROUPS).map(g => {
        const items = list.filter(t => t.group === g);
        if (!items.length) return '';
        return `<section class="bz-dict-sec" data-group="${esc(g)}"><h3><span>${esc(g)}</span><i>${items.length}</i></h3>${items.map(t => {
          const expanded = dictOpen === t.key;
          const line = expanded ? chartLine(t.key, view) : '';
          return `<article class="bz-dict-item${expanded ? ' is-open' : ''}" data-term="${esc(t.key)}"><button type="button" class="bz-dict-row" aria-expanded="${expanded}"><span class="bz-dict-name">${highlight(t.key, query)}</span><span class="bz-dict-sum">${highlight(t.text, query)}</span><svg class="bz-chev" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>${expanded ? `<div class="bz-dict-detail">${line ? mineHtml(line) : ''}${withAi ? `<button type="button" class="bz-dict-ask" data-bz-ask="${esc(t.key)}">问 AI 详细讲讲</button>` : ''}</div>` : ''}</article>`;
        }).join('')}</section>`;
      }).join('');
    }
    function filterDict() {
      dictGroup = ''; dictOpen = null; renderDict(); dictBody.scrollTop = 0;
    }
    function dictClick(event) {
      const t = event.target, row = t.closest('.bz-dict-row');
      if (row) {
        const key = row.closest('[data-term]').dataset.term, top = dictBody.scrollTop;
        dictOpen = dictOpen === key ? null : key; renderDict(); dictBody.scrollTop = top;
        [...dictBody.querySelectorAll('[data-term]')].find(n => n.dataset.term === key)?.querySelector('button').focus({ preventScroll: true });
        return;
      }
      const group = t.closest('[data-bz-group]');
      if (group) {
        if (group.hasAttribute('aria-disabled')) return;
        dictGroup = group.getAttribute('data-bz-group'); dictOpen = null; renderDict(); dictBody.scrollTop = 0;
        [...dictGroups.querySelectorAll('button')].find(n => n.getAttribute('data-bz-group') === dictGroup)?.focus({ preventScroll: true });
        return;
      }
      const example = t.closest('[data-bz-try]');
      if (example || t.closest('.bz-dict-clear')) {
        dictSearch.value = example ? example.getAttribute('data-bz-try') : '';
        filterDict(); dictSearch.focus({ preventScroll: true });
      }
    }
    function openDict(key) {
      dictReturn = trigger || doc.activeElement; close(); root.closeAllHelpPopovers?.();
      dictSearch.value = ''; dictGroup = ''; dictOpen = key || null;
      renderDict(); dlg.hidden = false; doc.documentElement.classList.add('bz-dict-lock');
      const target = key && [...dictBody.querySelectorAll('[data-term]')].find(n => n.dataset.term === key);
      dictBody.scrollTop = 0;
      if (target) { dictBody.scrollTop = target.offsetTop - dictBody.clientHeight / 4; target.querySelector('button').focus({ preventScroll: true }); }
      else dictSearch.focus({ preventScroll: true });
    }
    function ask(key) {
      const line = chartLine(key, view); close(); closeDict(false);
      root.switchBaziView('ai'); const q = doc.getElementById('aiQuestion');
      if (!q) return;
      q.value = aiQuestion(key, line); q.dispatchEvent(new root.Event('input', { bubbles: true }));
      q.scrollIntoView({ block: 'center', behavior: motionOK() ? 'smooth' : 'auto' }); q.focus({ preventScroll: true });
    }
    const SKIP = 'button,a,input,textarea,select,option,script,style,svg,.explain-help,#aiResult,.bz-term,[data-bz-term]';
    function mark(el, key) {
      el.dataset.bzTerm = key; el.classList.add('bz-term'); el.setAttribute('role', 'button'); el.tabIndex = 0;
      el.setAttribute('aria-haspopup', 'dialog');
    }
    function annotate(container) {
      // Explicit cells allow single-character terms without marking ordinary prose.
      container.querySelectorAll('.report-god').forEach(el => { const key = resolve(el.textContent); if (key && !el.closest(SKIP)) mark(el, key); });
      container.querySelectorAll('.pillar-table tr').forEach(row => {
        const label = row.querySelector('.row-label')?.textContent;
        if (label === '星运') row.querySelectorAll('td').forEach(el => { const key = resolve(el.textContent); if (key && !el.dataset.bzTerm) mark(el, key); });
        if (label === '纳音') row.querySelectorAll('td').forEach(el => { if (!el.dataset.bzTerm) mark(el, '纳音'); });
      });
      const walker = doc.createTreeWalker(container, root.NodeFilter.SHOW_TEXT), nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(node => {
        const parent = node.parentElement;
        if (!parent || !node.nodeValue.trim() || parent.closest(SKIP)) return;
        const token = !!parent.closest('.relation-list .tag,.public-use-row dt,.core-use-label,.core-card>strong:not(.core-use-value)');
        let parts = tokenize(node.nodeValue, { token });
        if (parent.closest('.relation-list .tag') && !parts.some(p => p.key)) {
          const relation = node.nodeValue.match(/^[子丑寅卯辰巳午未申酉戌亥]{2}([合冲刑害破])/);
          if (relation) parts = [{ text: node.nodeValue, key: resolve(relation[1]) }];
        }
        if (!parts.some(p => p.key)) return;
        const fragment = doc.createDocumentFragment();
        parts.forEach(p => { if (!p.key) fragment.appendChild(doc.createTextNode(p.text)); else { const span = doc.createElement('span'); span.textContent = p.text; mark(span, p.key); fragment.appendChild(span); } });
        node.replaceWith(fragment);
      });
    }
    const ROOTS = '#structureSummary,.basic-dashboard .pillar-table-wrap,[data-view-panel="basic"],[data-view-panel="structure"],[data-view-panel="luck"],.options>label,.time-option>label,#solarPreview';
    let pending = false;
    function schedule() {
      if (pending) return; pending = true;
      root.requestAnimationFrame(() => { pending = false; doc.querySelectorAll(ROOTS).forEach(annotate); });
    }
    const observer = new root.MutationObserver(schedule);
    ['resultArea', 'entryPanel'].forEach(id => { const el = doc.getElementById(id); if (el) observer.observe(el, { childList: true, subtree: true, characterData: true }); });
    dictSearch.addEventListener('input', filterDict);
    dlg.addEventListener('click', dictClick);
    doc.addEventListener('click', event => {
      const t = event.target;
      const askBtn = t.closest('[data-bz-ask]'); if (askBtn) { event.preventDefault(); ask(askBtn.dataset.bzAsk); return; }
      const dictBtn = t.closest('[data-bz-dict]'); if (dictBtn) { event.preventDefault(); openDict(dictBtn.dataset.bzDict); return; }
      if (t.closest('[data-bz-dict-close]')) { closeDict(); return; }
      if (t.closest('[data-bz-close]')) { close(true); return; }
      if (t.closest('.explain-help-button')) { close(); return; }
      const term = t.closest('[data-bz-term]');
      if (term) { event.preventDefault(); event.stopPropagation(); if (!pop.hidden && trigger === term) close(); else open(term.dataset.bzTerm, term); return; }
      if (!pop.hidden && !pop.contains(t)) close();
    }, true);
    doc.addEventListener('keydown', event => {
      const t = event.target;
      if ((event.key === 'Enter' || event.key === ' ') && t.matches('.bz-term')) { event.preventDefault(); event.stopPropagation(); open(t.dataset.bzTerm, t); return; }
      if (event.key === 'Escape') {
        if (!pop.hidden) { event.preventDefault(); event.stopImmediatePropagation(); close(true); }
        else if (!dlg.hidden) { event.preventDefault(); event.stopImmediatePropagation(); closeDict(); }
      }
      const surface = !dlg.hidden ? dlg : !pop.hidden ? pop : null;
      if (event.key === 'Tab' && surface) {
        const focusable = [...surface.querySelectorAll('button,input')].filter(el => el.getClientRects().length);
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && (doc.activeElement === first || !focusable.includes(doc.activeElement))) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && (doc.activeElement === last || !focusable.includes(doc.activeElement))) { event.preventDefault(); first?.focus(); }
      }
    }, true);
    root.addEventListener('resize', place); root.addEventListener('scroll', place, true);
    root.addEventListener('bazi:view', event => {
      const previous = view.snapshot; Object.assign(view, event.detail);
      if (!pop.hidden) { if (!trigger?.isConnected || previous !== view.snapshot) close(); else { pop.innerHTML = renderCard(get(pop.dataset.term), chartLine(pop.dataset.term, view), !!view.snapshot); place(); } }
      if (!dlg.hidden) renderDict(); schedule();
    });
    root.dispatchBaziView?.('mount');
    schedule();
  }
  return Object.freeze({ GROUPS, TERMS, NOTE, get, resolve, tokenize, chartLine, aiQuestion, search, renderCard, mount });
});
