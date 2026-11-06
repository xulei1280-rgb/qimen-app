/* 紫微斗数 · 新手白话词典（ziwei-glossary.js）
 * 唯一词条来源：页面术语浮窗、「新手词典」、图层 ? 说明都读这里。
 * 释义取传统通行含义，只作中性说明，不作吉凶断语；「在你的盘上」一行只读现成盘面数据，不调用 AI。
 * 依赖 ziwei-premium.js 的纯函数（宫干飞化、三方四正），不改任何排盘与解盘逻辑。 */
(function (root, factory) {
  "use strict";
  const premium = root.ZiweiPremium || (typeof require === "function" ? require("./ziwei-premium.js") : null);
  const api = factory(root, premium);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZiweiGlossary = api;
  if (root.document && typeof root.document.getElementById === "function" && typeof root.addEventListener === "function") {
    if (root.document.readyState === "loading") root.document.addEventListener("DOMContentLoaded", () => api.mount());
    else api.mount();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (root, premium) {
  "use strict";

  const GROUPS = ["四化与飞化", "宫位", "主星", "辅星", "运限", "其他"];
  const HUA = { 禄: "化禄", 权: "化权", 科: "化科", 忌: "化忌" };
  const FLY = { 禄: "飞禄", 权: "飞权", 科: "飞科", 忌: "飞忌" };
  const BRIGHT = { 庙: "庙", 旺: "旺", 得: "得", 利: "利", 平: "平", 不: "不", 陷: "陷" };

  // [key, 分组, 白话释义, 别名]
  const RAW = [
    ["四化", "四化与飞化", "四化是禄、权、科、忌四种“变化”：由某个天干决定哪四颗星发生变化，用来看事情的顺利、掌控、名声与牵挂之处。", ["四化星"]],
    ["化禄", "四化与飞化", "化禄代表顺利、得到、机缘与资源，传统上看作“容易有收获、有人缘”的标记。", ["禄"]],
    ["化权", "四化与飞化", "化权代表掌控、能力与主动，传统上看作“能做主、有执行力”的标记，有时也伴随竞争与压力。", ["权"]],
    ["化科", "四化与飞化", "化科代表名声、贵人、条理与体面，传统上看作“有好口碑、遇事有人帮”的标记。", ["科"]],
    ["化忌", "四化与飞化", "化忌代表在意、执着、欠缺或阻碍，传统上是需要多留意、多花心力的地方；它不等于“一定不好”，也常是人生的重点所在。", ["忌"]],
    ["生年四化", "四化与飞化", "由出生年份的天干决定的四化，一出生就带着，传统上看作一生的底色与重点方向。", ["生年化禄", "生年化权", "生年化科", "生年化忌"]],
    ["宫干四化", "四化与飞化", "每个宫都有自己的天干，用这个天干再起一次四化，就是宫干四化（俗称“飞化”“飞星”），用来看这一宫的事会牵动到哪个领域。", ["宫干飞化", "飞化", "飞星", "四化飞星"]],
    ["飞禄", "四化与飞化", "某宫天干化出的“禄”落到另一宫：表示前者的好处、资源或心意流向后者，两件事之间有助力。", []],
    ["飞权", "四化与飞化", "某宫天干化出的“权”落到另一宫：表示前者对后者有推动、掌控或施压的作用。", []],
    ["飞科", "四化与飞化", "某宫天干化出的“科”落到另一宫：表示前者给后者带来调和、名声或贵人帮助。", []],
    ["飞忌", "四化与飞化", "某宫天干化出的“忌”落到另一宫：表示前者对后者特别在意、牵挂，或带去压力与课题，是飞化里最受重视的一条线。", []],
    ["自化", "四化与飞化", "某宫天干化出的星就在本宫里，叫自化。传统上解作这件事“自己生出变化、自己消耗”，力量较不稳定。", ["自禄", "自权", "自科", "自忌"]],
    ["大限四化", "四化与飞化", "用当前大限宫的天干起的四化，叠加在本命盘上，看这十年里哪些领域特别顺、特别要用力。", ["大限化忌", "限禄", "限权", "限科", "限忌"]],
    ["流年四化", "四化与飞化", "用当年年干起的四化，叠加在本命盘上，看这一年的顺利与牵挂之处。", ["流年化忌", "年禄", "年权", "年科", "年忌"]],
    ["三方四正连线", "四化与飞化", "金色线：把所选宫和它的对宫、两个三合宫连起来。这四个宫互相牵动，看任何一宫都要一起看。", []],
    ["生年四化连线", "四化与飞化", "从盘中心（出生年干）发出的四条箭头，指向生年化禄、化权、化科、化忌的星所在的宫。", []],
    ["宫干飞化连线", "四化与飞化", "从所选宫发出的箭头：用这一宫的天干起四化，箭头指向化出的星所在的宫；落回本宫画成小圈，就是自化。", []],
    ["大限·流年四化连线", "四化与飞化", "长虚线是当前大限的四化，点线是当年流年的四化，表示这段时期哪些宫被“点亮”或被牵动。需先在“运限”里固定日期。", ["大限·流年四化"]],

    ["十二宫", "宫位", "命盘分成十二个格子，每格代表人生的一个领域：自己、兄弟、伴侣、子女、钱财、健康、外出、朋友、事业、家宅、精神、父母。", []],
    ["命宫", "宫位", "代表你本人：性格、才能与一生的整体倾向，是看盘的起点。", ["命"]],
    ["兄弟宫", "宫位", "看兄弟姐妹、同辈与合作伙伴的关系。", ["兄弟"]],
    ["夫妻宫", "宫位", "看感情、伴侣与婚姻里的相处方式。", ["夫妻"]],
    ["子女宫", "宫位", "看子女、晚辈与学生，也关联合作与创造。", ["子女"]],
    ["财帛宫", "宫位", "看赚钱的方式、理财态度与用钱习惯。", ["财帛", "财帛位"]],
    ["疾厄宫", "宫位", "看身体与体质倾向，只作参考，不能代替医疗判断。", ["疾厄"]],
    ["迁移宫", "宫位", "看外出、远行、在外的表现与机遇；它是命宫的对宫。", ["迁移"]],
    ["仆役宫", "宫位", "也叫交友宫，看朋友、同事、下属与人际网络。", ["仆役", "交友宫", "交友"]],
    ["官禄宫", "宫位", "也叫事业宫，看事业、学业、工作方式与成就。", ["官禄", "官禄位", "事业宫"]],
    ["田宅宫", "宫位", "看住房、不动产与家庭环境，也代表“家”和积蓄的状态。", ["田宅"]],
    ["福德宫", "宫位", "看精神状态、兴趣嗜好与内心的满足感。", ["福德"]],
    ["父母宫", "宫位", "看父母、长辈与上司，也关联文书与学习。", ["父母"]],
    ["身宫", "宫位", "身宫会和某一宫重叠，代表后天越来越投入、越看重的领域，常说“命看先天，身看后天”。", ["身"]],
    ["来因宫", "宫位", "宫干与出生年干相同的那一宫，传统上看作这一生最核心的关注点（“因何而来”）。各派说法不完全相同。", []],
    ["三方四正", "宫位", "所选宫 + 对宫 + 两个三合宫（隔四格），这四个宫互相牵动，是看任何一宫的基本范围。", ["三方", "四正"]],
    ["本宫", "宫位", "正在看的这一宫本身。", []],
    ["对宫", "宫位", "和所选宫正对面的那一宫，两宫互相照应，看一宫时要连对宫一起看。", []],
    ["空宫", "宫位", "宫里没有十四主星就叫空宫，传统做法是借对宫的主星来参看，但力量相对弱一些。", ["借对宫主星", "借星", "空宫 · 借对宫主星"]],

    ["主星", "主星", "紫微斗数里最重要的十四颗星，决定一个宫的主要性质；其余星曜都在补充或修饰它们。", ["十四主星", "主曜", "命宫主星"]],
    ["紫微", "主星", "帝星，象征领导、尊贵与自尊，喜欢掌握局面、重视体面。", ["紫微星"]],
    ["天机", "主星", "智慧之星，象征思考、计划与变动，头脑灵活、善于筹划。", []],
    ["太阳", "主星", "象征光明、付出与名声，热情外向，乐于照顾别人。", []],
    ["武曲", "主星", "财星，象征财务、决断与执行，做事果断务实。", []],
    ["天同", "主星", "福星，象征享受、温和与知足，性情随和、重视生活品质。", []],
    ["廉贞", "主星", "象征原则、感情与复杂的心思，有两面性：能守规矩，也有冲劲。", []],
    ["天府", "主星", "库星，象征稳重、保守与积累，善于守成和管理。", []],
    ["太阴", "主星", "象征温柔、细腻与积蓄，也和母亲、女性长辈、房产有关。", []],
    ["贪狼", "主星", "象征欲望、才艺与交际，多才多艺、喜欢新鲜事物。", []],
    ["巨门", "主星", "象征口才、研究与是非，善于分析辩论，也容易有口舌。", []],
    ["天相", "主星", "印星，象征协调、服务与公正，乐于助人、重视形象。", []],
    ["天梁", "主星", "荫星，象征庇护、长者风范与化解，喜欢照顾人、讲道理。", []],
    ["七杀", "主星", "将星，象征开创、冲劲与独立，敢冲敢拼，变化较大。", []],
    ["破军", "主星", "象征破旧立新、消耗与改变，勇于开创，人生转折较多。", []],

    ["辅星", "辅星", "辅助主星的星曜，会加强或削弱主星的表现；杂曜是更小的星，多作补充参考。", ["辅曜", "杂曜", "辅星与杂曜", "关键辅曜"]],
    ["左辅", "辅星", "助力之星，象征同辈的帮助、合作与包容。", []],
    ["右弼", "辅星", "助力之星，和左辅相似，象征协助与人缘，偏向灵活变通。", []],
    ["文昌", "辅星", "文星，象征学业、考试、文书与条理。", []],
    ["文曲", "辅星", "文星，象征口才、才艺与感性表达。", []],
    ["天魁", "辅星", "贵人星，象征长辈、上级等“看得见”的提携。", []],
    ["天钺", "辅星", "贵人星，和天魁相对，象征暗中或意外的帮助。", []],
    ["禄存", "辅星", "象征稳定的财源与积蓄，偏保守守成。", []],
    ["天马", "辅星", "象征奔波、变动、出行与迁动。", []],
    ["擎羊", "辅星", "六煞之一，象征冲动、竞争与刚硬；用得好是魄力，用不好容易起冲突。", []],
    ["陀罗", "辅星", "六煞之一，象征拖延、纠缠与固执，事情容易反复。", []],
    ["火星", "辅星", "六煞之一，象征急躁与爆发，来得快、去得也快。", []],
    ["铃星", "辅星", "六煞之一，象征压抑、暗中的压力，影响较为持久。", []],
    ["地空", "辅星", "六煞之一，象征想法超脱、不落俗套，也代表计划落空。", []],
    ["地劫", "辅星", "六煞之一，象征波折与损耗，常和“破财、白忙”联系在一起。", []],

    ["运限", "运限", "随时间变化的运势：大限管十年，流年管一年，小限是另一种按年龄看的一年。", []],
    ["大限", "运限", "每十年换一个宫，作为那十年的“命宫”，用来看这十年的重点与环境。", ["大运"]],
    ["流年", "运限", "按每一年的干支看当年运势，流年命宫随年份在盘上移动。", ["流年命宫"]],
    ["小限", "运限", "另一种逐年运，按虚岁在十二宫中轮转，常和流年一起参看。", []],
    ["虚岁", "运限", "出生就算一岁，每过一个农历新年加一岁；紫微的运限按虚岁计算。", []],
    ["五行局", "运限", "由命宫干支推出（水二局、木三局、金四局、土五局、火六局），局数就是第一个大限开始的虚岁，也决定紫微星的位置。", ["水二局", "木三局", "金四局", "土五局", "火六局"]],
    ["长生十二神", "运限", "依五行局排出的十二个阶段（长生、沐浴、冠带、临官、帝旺、衰、病、死、墓、绝、胎、养），象征事物由生到衰的循环，作辅助参考。", ["长生"]],
    ["博士十二神", "运限", "随禄存排出的十二个小神（博士、力士、青龙、小耗、将军、奏书、飞廉、喜神、病符、大耗、伏兵、官府），多作小提示参考。", ["博士"]],
    ["将前十二神", "运限", "依出生年支排出的十二个小神（将星、攀鞍、岁驿、息神、华盖、劫煞、灾煞、天煞、指背、咸池、月煞、亡神），作辅助参考。", ["将前"]],
    ["岁前十二神", "运限", "依出生年支排出的十二个小神（岁建、晦气、丧门、贯索、官符、小耗、大耗、龙德、白虎、天德、吊客、病符），作辅助参考。", ["岁前"]],

    ["命主", "其他", "由命宫地支决定的一颗星，代表先天性格里起主导作用的力量。", []],
    ["身主", "其他", "由出生年支决定的一颗星，代表后天做事、待人的倾向。", []],
    ["亮度", "其他", "星曜在不同宫位的力量强弱，从强到弱大致是：庙、旺、得、利、平、不、陷。亮度越高，星的优点越容易发挥。", ["庙旺"]],
    ["庙", "其他", "亮度最高一级（入庙），星曜的性质发挥得最充分。", []],
    ["旺", "其他", "亮度很强，仅次于庙。", []],
    ["得", "其他", "亮度中上（得地），能正常发挥。", []],
    ["利", "其他", "亮度中等偏上，有利但不算强。", []],
    ["平", "其他", "亮度一般，力量平平。", []],
    ["不", "其他", "亮度偏弱（不得地），优点较难发挥。", []],
    ["陷", "其他", "亮度最弱（落陷），星曜的短处较容易显现，需要别的星配合。", []],
    ["真太阳时", "其他", "按出生地经度和日期修正后的“当地太阳时间”，可能和北京时间差几十分钟；靠近时辰交界时可能改变时辰。", []],
    ["北京时间", "其他", "直接用钟表上的时间起盘，不按出生地经度修正。", []],
    ["夏令时", "其他", "出生记录采用中国大陆1986至1991年夏令钟表时间时，先减去一小时，再按所选时间口径排盘；已自行减时的请勿重复勾选。", []],
    ["时辰", "其他", "古代把一天分成十二个时辰，每个约两小时（子、丑、寅……亥），紫微按出生时辰起盘。", []],
  ];

  const TERMS = Object.freeze(RAW.map(([key, group, text, aliases]) => Object.freeze({ key, group, text, aliases: Object.freeze([...aliases]) })));
  const BY_KEY = new Map(TERMS.map((term) => [term.key, term]));
  const LAYER_TERM = Object.freeze({ rel: "三方四正连线", birth: "生年四化连线", fly: "宫干飞化连线", luck: "大限·流年四化连线" });
  const SINGLE = new Set(["禄", "权", "科", "忌", "命", "身", ...Object.keys(BRIGHT)]);

  // 正文里自动识别的写法（单字的禄权科忌、亮度只在“徽标/小字”里识别，避免误标普通文字）
  const ALIAS = new Map();
  TERMS.forEach((term) => [term.key, ...term.aliases].forEach((word) => { if (!SINGLE.has(word) && !ALIAS.has(word)) ALIAS.set(word, term.key); }));
  const WORDS = [...ALIAS.keys()].filter((word) => !word.includes("连线")).sort((a, b) => b.length - a.length);
  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const WORD_RE = new RegExp(WORDS.map(escapeRe).join("|"), "g");
  const TOKEN_RE = /^[庙旺得利平不陷禄权科忌](?:\s*·\s*[庙旺得利平不陷禄权科忌])*$/;


  /* ---------- 白话含义规则表（传统通行含义，只说倾向，不下断语） ---------- */
  const PALACE_ORDER = ["命宫", "兄弟宫", "夫妻宫", "子女宫", "财帛宫", "疾厄宫", "迁移宫", "仆役宫", "官禄宫", "田宅宫", "福德宫", "父母宫"];
  const PALACE_TOPIC = Object.freeze({ 命宫: "自身性格与方向", 兄弟宫: "兄弟同辈与合作", 夫妻宫: "感情与伴侣", 子女宫: "子女晚辈", 财帛宫: "钱财", 疾厄宫: "身体健康", 迁移宫: "外出与在外发展", 仆役宫: "朋友人脉", 官禄宫: "工作学业", 田宅宫: "家庭与住房", 福德宫: "心情与精神生活", 父母宫: "父母长辈与上司" });
  const HUA_ROWS = {
    禄: ["你本人容易有人缘、有福气，做事较顺，也懂得享受", "和兄弟同辈、合作伙伴容易相处融洽，能互相帮衬", "感情上容易有缘分，和伴侣相处较和顺，也可能得到伴侣助力", "和子女晚辈缘分较好，合作与创作上容易有收获", "赚钱机会较多、财路较顺，也比较舍得花", "体质与心态偏宽松，懂得享受生活，需留意饮食起居别过量", "出门在外容易遇到机会和好人缘，适合向外发展", "朋友人脉多，容易得到朋友同事的帮忙", "工作学业上较顺，容易得到机会与回报", "和住房家宅缘分较好，家庭环境较安稳，利于积蓄", "心态较乐观，懂得享受，精神上容易满足", "和父母长辈、上司关系较融洽，容易得到照顾"],
    权: ["你本人主见强、有魄力，喜欢自己做主", "同辈之间容易有人较强势，合作时多讲分工与主导权", "感情里容易有一方较强势，相处中常碰到“谁说了算”的问题", "对子女晚辈容易管得较多，或晚辈个性较强", "理财有主见、敢于争取，赚钱上肯用力，也伴随竞争", "精力较旺，但容易逞强，需留意劳累", "在外表现积极，容易争取到地位与发言权", "在朋友同事中容易有影响力，或遇到较强势的朋友", "事业上有企图心与执行力，容易担当要职", "对家宅、置产有主导欲，愿意投入经营家庭", "内心好胜、要求高，想法多，不容易完全放松", "父母长辈或上司较有权威，管束可能较多"],
    科: ["你本人重视形象与条理，容易有好口碑", "同辈之间相处有礼，遇事能互相调和帮忙", "感情相处较讲道理、重体面，伴侣气质多较斯文", "子女晚辈多较乖巧、重学习，相处讲道理", "理财较有计划，收入偏稳定，钱财上重信誉", "身体有小状况时容易得到好的照顾与调理", "在外形象好，容易遇到贵人、得到好名声", "朋友多是有修养的人，人际关系较和谐", "工作学业上容易有好名声，得到认可与贵人提携", "家庭环境较整洁有序，居家氛围较安稳", "心态平和理性，重视精神生活与修养", "和长辈上司相处有礼，容易得到他们的提携"],
    忌: ["你对自己要求多、想得多，需留意别钻牛角尖", "和兄弟同辈、合作伙伴之间容易有牵挂或摩擦，需多沟通", "对感情容易特别在意、多牵挂，需留意相处与沟通方式", "容易为子女晚辈操心，在这方面多付出心力", "对钱容易焦虑、在意得失，需留意理财与开销", "容易为身体状况操心，需留意作息与保养（不能代替医疗判断）", "出门在外容易多波折或不安，需留意外出与变动", "容易为朋友人情付出较多，需留意人际中的是非与界限", "对工作学业特别执着，容易有压力，需注意节奏", "容易为家里、住房的事操心，需留意家宅与积蓄", "想法多、容易思虑过度，需留意情绪与休息", "和父母长辈、上司之间容易有牵挂或观念差异"],
  };
  const HUA_PALACE = Object.freeze(Object.fromEntries(Object.entries(HUA_ROWS).map(([label, rows]) => [label, Object.freeze(Object.fromEntries(PALACE_ORDER.map((name, i) => [name, rows[i]])))])));
  const FLY_VERB = Object.freeze({ 禄: (dst) => `容易给${dst}带来助力或收获`, 权: (dst) => `容易在${dst}上用力、想掌控`, 科: (dst) => `容易在${dst}上讲究分寸、得到帮助`, 忌: (dst) => `容易对${dst}特别在意、牵挂，或在这方面感到压力` });
  const SELF_VERB = Object.freeze({ 禄: "好处来得快也去得快，容易自得其乐", 权: "容易自己较劲，凡事亲力亲为", 科: "很看重形象与分寸，凡事想做得体面", 忌: "容易自己纠结、反复，付出多而回报不稳" });
  const STAR_TRAIT = Object.freeze({ 紫微: "有主见、重体面、想掌握局面", 天机: "头脑灵活、爱思考、多变动", 太阳: "热情外向、乐于付出", 武曲: "果断务实、重视实际成果", 天同: "随和知足、重视享受", 廉贞: "讲原则又重感情、心思较复杂", 天府: "稳重保守、善于守成积累", 太阴: "温柔细腻、重视积蓄与安全感", 贪狼: "多才多艺、爱交际、追求新鲜", 巨门: "善于分析表达、也容易有口舌是非", 天相: "协调稳妥、乐于服务、重形象", 天梁: "爱照顾人、讲原则、有长者风范", 七杀: "敢冲敢拼、独立、变化较大", 破军: "求新求变、敢于打破旧局" });
  const BRIGHT_NOTE = Object.freeze({ 庙: "这颗星在这里力量足，特质发挥得比较好", 旺: "这颗星在这里力量足，特质发挥得比较好", 得: "这颗星在这里能正常发挥", 利: "这颗星在这里能正常发挥", 平: "这颗星在这里发挥一般", 不: "这颗星在这里特质不易发挥，需要多下功夫", 陷: "这颗星在这里特质不易发挥，需要多下功夫" });
  const MEANING_NOTE = "规则按传统通行含义生成，仅供参考";
  const topicOf = (palaceName) => PALACE_TOPIC[palaceName] || palaceName;
  function huaMeaning(label, palaceName) { return (HUA_PALACE[label] && HUA_PALACE[label][palaceName]) || ""; }
  function flyMeaning(label, fromName, toName) {
    if (fromName === toName) return `这说明你在${topicOf(fromName)}方面${SELF_VERB[label]}`;
    return `这说明你在${topicOf(fromName)}方面的心思，${FLY_VERB[label](topicOf(toName))}`;
  }
  function starMeaning(star, palaceName) {
    const trait = STAR_TRAIT[star.name];
    if (!trait) return "";
    const note = BRIGHT_NOTE[star.brightness];
    return `这说明在${topicOf(palaceName)}上，容易表现出${trait}的一面${note ? `；${note}` : ""}`;
  }

  function get(key) { return BY_KEY.get(key) || null; }
  function resolve(word, mode) {
    const w = String(word || "").trim();
    if (ALIAS.has(w)) return ALIAS.get(w);
    if (HUA[w]) return mode === "fly" ? FLY[w] : HUA[w];
    if (BRIGHT[w]) return BRIGHT[w];
    return BY_KEY.has(w) ? w : null;
  }

  // 把一段文字切成 [{text, key}]；token=true 时按“庙 · 禄”这类徽标小字切分。
  function tokenize(text, options = {}) {
    const source = String(text || "");
    if (options.token && TOKEN_RE.test(source.trim())) {
      const out = [];
      source.split(/(\s*·\s*)/).forEach((part) => {
        if (!part) return;
        const key = part.includes("·") || !part.trim() ? null : resolve(part, options.mode);
        out.push(key ? { text: part, key } : { text: part });
      });
      return out;
    }
    const out = [];
    let last = 0;
    source.replace(WORD_RE, (match, offset) => {
      if (offset > last) out.push({ text: source.slice(last, offset) });
      out.push({ text: match, key: ALIAS.get(match) });
      last = offset + match.length;
      return match;
    });
    if (last < source.length) out.push({ text: source.slice(last) });
    return out;
  }

  /* ---------- 「在你的盘上」：只读盘面数据 ---------- */
  const pname = (name) => (String(name).endsWith("宫") ? String(name) : `${name}宫`);
  const starsOf = (p) => [...(p.majorStars || []), ...(p.minorStars || []), ...(p.adjectiveStars || [])];
  function findStar(palaces, name) {
    for (const palace of palaces) {
      const star = starsOf(palace).find((s) => s.name === name);
      if (star) return { palace, star };
    }
    return null;
  }
  function starText(star) {
    return [star.brightness, star.mutagen ? `化${star.mutagen}` : ""].filter(Boolean).join("，");
  }
  function palaceByKey(palaces, key) {
    const term = get(key);
    const names = term ? [term.key, ...term.aliases] : [key];
    return palaces.find((p) => names.includes(pname(p.name)) || names.includes(p.name)) || null;
  }
  function majorsText(palace) {
    return palace.majorStars.length ? palace.majorStars.map((s) => `${s.name}${s.brightness ? `（${s.brightness}）` : ""}`).join("、") : "空宫（借对宫主星）";
  }

  function chartLine(key, ctx = {}) {
    const snapshot = ctx.snapshot;
    if (!snapshot || !snapshot.natal || !premium) return "";
    const palaces = snapshot.natal.palaces;
    const at = (index) => palaces.find((p) => p.index === index);
    const sel = at(ctx.selected);
    const horo = ctx.horoscope;
    const table = ctx.stemTable;
    const birthStem = String(snapshot.calendar?.sexagenary || "").charAt(0);
    const label = key.length === 2 && (key[0] === "化" || key[0] === "飞") ? key[1] : "";
    const birthOf = (l) => { const star = snapshot.natal.birthMutagen[l]; const hit = star && findStar(palaces, star); return hit ? `${star}，在${pname(hit.palace.name)}` : ""; };
    const flyList = (p) => premium.flyingFrom(palaces, p.index, table);
    const flyText = (item) => `${item.star} → ${item.self ? "本宫（自化）" : pname(at(item.to).name)}`;
    const birthPalace = (l) => { const star = snapshot.natal.birthMutagen[l]; const hit = star && findStar(palaces, star); return hit ? pname(hit.palace.name) : ""; };
    const luckMeaning = (scope, title) => premium.mutagenTargets(palaces, scope.mutagen).filter((i) => i.label === "禄" || i.label === "忌").map((i) => `→ ${title}化${i.label}（${i.star}）入${pname(at(i.to).name)}：${huaMeaning(i.label, pname(at(i.to).name))}。`);

    if (key.startsWith("化") && label) {
      const lines = [`你的生年化${label}是${birthOf(label) || "—"}。`];
      const bp = birthPalace(label);
      if (bp) lines.push(`→ 化${label}在${bp}，这说明${huaMeaning(label, bp)}。`);
      if (sel) { const f = flyList(sel).find((i) => i.label === label); if (f) lines.push(`所选${pname(sel.name)}（${sel.heavenlyStem}干）飞${label}：${flyText(f)}。`, `→ ${flyMeaning(label, pname(sel.name), pname(at(f.to).name))}。`); }
      return lines.join("\n");
    }
    if (key.startsWith("飞") && label) {
      if (!sel) return "";
      const f = flyList(sel).find((i) => i.label === label);
      return f ? `${pname(sel.name)}（${sel.heavenlyStem}干）飞${label}${f.self ? "，落回本宫（自化）" : `入${pname(at(f.to).name)}`}：${f.star} 化${label}。\n→ ${flyMeaning(label, pname(sel.name), pname(at(f.to).name))}。` : "";
    }
    switch (key) {
      case "四化": case "生年四化": case "生年四化连线":
        return [`你的生年四化（${birthStem}干）：${premium.LABELS.map((l) => `${l} ${birthOf(l) || "—"}`).join("；")}。`,
          ...premium.LABELS.filter((l) => birthPalace(l)).map((l) => `→ 化${l}在${birthPalace(l)}：${huaMeaning(l, birthPalace(l))}。`)].join("\n");
      case "宫干四化": case "宫干飞化连线":
        return sel ? [`所选${pname(sel.name)}（${sel.heavenlyStem}干）：${flyList(sel).map((i) => `${i.label} ${flyText(i)}`).join("；")}。`,
          ...flyList(sel).filter((i) => i.label === "禄" || i.label === "忌").map((i) => `→ 飞${i.label}${i.self ? "落回本宫（自化）" : `入${pname(at(i.to).name)}`}（${i.star}）：${flyMeaning(i.label, pname(sel.name), pname(at(i.to).name))}。`)].join("\n") : "";
      case "自化": {
        const selfs = [], means = [];
        palaces.forEach((p) => flyList(p).filter((i) => i.self).forEach((i) => { selfs.push(`${pname(p.name)}自${i.label}（${i.star}）`); means.push(`→ ${pname(p.name)}自${i.label}：${flyMeaning(i.label, pname(p.name), pname(p.name))}。`); }));
        return selfs.length ? [`本盘的自化：${selfs.join("、")}。`, ...means].join("\n") : "本盘没有宫位自化。";
      }
      case "三方四正": case "三方四正连线": case "本宫": case "对宫": {
        if (!sel) return "";
        const r = premium.relationIndexes(palaces, sel.index);
        if (key === "对宫") return `所选${pname(sel.name)}的对宫是${pname(at(r.opposite).name)}。`;
        if (key === "本宫") return `现在看的本宫是${pname(sel.name)}（${sel.heavenlyStem}${sel.earthlyBranch}）。`;
        return `所选${pname(sel.name)}的三方四正：对宫${pname(at(r.opposite).name)}，三合${pname(at(r.wealth).name)}、${pname(at(r.career).name)}。`;
      }
      case "大限·流年四化连线": case "大限四化": case "流年四化": {
        if (!horo) return "先在“运限”里固定一个日期，就能看到这段时期的四化。";
        const list = (m) => premium.LABELS.map((l) => `${l} ${m[l] || "—"}`).join(" ");
        const d = `大限（${horo.decadal.heavenlyStem}干）：${list(horo.decadal.mutagen)}`;
        const y = `流年（${horo.yearly.heavenlyStem}干）：${list(horo.yearly.mutagen)}`;
        if (key === "大限四化") return [`${d}。`, ...luckMeaning(horo.decadal, "大限")].join("\n");
        if (key === "流年四化") return [`${y}。`, ...luckMeaning(horo.yearly, "流年")].join("\n");
        return [`${d}；${y}。`, ...luckMeaning(horo.decadal, "大限"), ...luckMeaning(horo.yearly, "流年")].join("\n");
      }
      case "十二宫": return `你的命宫在${snapshot.natal.soulPalace}，身宫在${snapshot.natal.bodyPalace}。`;
      case "身宫": { const p = palaces.find((x) => x.isBodyPalace); return p ? `你的身宫和${pname(p.name)}重叠（在${p.earthlyBranch}）。` : ""; }
      case "来因宫": { const p = palaces.find((x) => x.isOriginalPalace); return p ? `你的来因宫是${pname(p.name)}（${p.heavenlyStem}${p.earthlyBranch}，与年干${birthStem}相同）。` : ""; }
      case "空宫": { const list = palaces.filter((p) => !p.majorStars.length).map((p) => pname(p.name)); return list.length ? `本盘的空宫：${list.join("、")}。` : "本盘没有空宫。"; }
      case "主星": { const soul = palaces.find((p) => p.name === "命宫"); return soul ? `你的命宫主星：${majorsText(soul)}。` : ""; }
      case "大限": return horo ? `${horo.targetSolarDate}（虚岁 ${horo.nominalAge}）走 ${horo.decadal.ageRange[0]}–${horo.decadal.ageRange[1]} 岁大限，在${pname(at(horo.decadal.palaceIndex)?.name || "")}。` : "";
      case "流年": return horo ? `${horo.targetSolarDate} 所在流年为${horo.yearly.heavenlyStem}${horo.yearly.earthlyBranch}年，流年命宫在${pname(at(horo.yearly.palaceIndex)?.name || "")}。` : "";
      case "运限": case "虚岁": return horo ? `${horo.targetSolarDate} 时虚岁 ${horo.nominalAge}。` : "";
      case "小限": return sel && sel.ages && sel.ages.length ? `所选${pname(sel.name)}的小限虚岁：${sel.ages.slice(0, 6).join("、")}……` : "";
      case "五行局": {
        const first = [...palaces].sort((a, b) => a.decadal.range[0] - b.decadal.range[0])[0];
        return `你是${snapshot.natal.fiveElementsClass}，第一个大限从虚岁 ${first.decadal.range[0]} 岁开始（${pname(first.name)} ${first.decadal.range[0]}–${first.decadal.range[1]} 岁）。`;
      }
      case "命主": case "身主": return `你的命主是${snapshot.natal.soulStar}，身主是${snapshot.natal.bodyStar}。`;
      case "长生十二神": return sel ? `所选${pname(sel.name)}：长生十二神为“${sel.changsheng12 || "—"}”。` : "";
      case "博士十二神": return sel ? `所选${pname(sel.name)}：博士十二神为“${sel.boshi12 || "—"}”。` : "";
      case "将前十二神": return sel ? `所选${pname(sel.name)}：将前十二神为“${sel.jiangqian12 || "—"}”。` : "";
      case "岁前十二神": return sel ? `所选${pname(sel.name)}：岁前十二神为“${sel.suiqian12 || "—"}”。` : "";
      case "真太阳时": case "北京时间":
        return snapshot.input?.timeBasis === "trueSolar" ? "这张盘按真太阳时起盘。" : "这张盘按北京时间起盘。";
      case "时辰": return `这张盘的出生时辰：${snapshot.calendar?.timeLabel || "—"}。`;
      default: break;
    }
    const term = get(key);
    if (term && term.group === "宫位") {
      const p = palaceByKey(palaces, key);
      if (!p) return "";
      const name = pname(p.name);
      const lines = [`你的${name}在${p.heavenlyStem}${p.earthlyBranch}，主星：${majorsText(p)}。`];
      lines.push(`→ 这一宫管${topicOf(name)}。${p.majorStars.length ? p.majorStars.filter((s) => STAR_TRAIT[s.name]).map((s) => `${s.name}在这里，多表现为${STAR_TRAIT[s.name]}`).join("；") + "。" : "这里是空宫，可借对宫主星参看，力量相对弱一些。"}`);
      starsOf(p).filter((s) => s.mutagen && HUA_PALACE[s.mutagen]).forEach((s) => lines.push(`→ 生年化${s.mutagen}（${s.name}）在这里：${huaMeaning(s.mutagen, name)}。`));
      return lines.join("\n");
    }
    if (term && (term.group === "主星" || term.group === "辅星")) {
      const hit = findStar(palaces, key);
      if (!hit) return "这颗星在本盘里没有出现。";
      const extra = starText(hit.star);
      const name = pname(hit.palace.name);
      const lines = [`你的${key}在${name}${extra ? `（${extra}）` : ""}。`];
      const meaning = starMeaning(hit.star, name);
      if (meaning) lines.push(`→ ${meaning}。`);
      if (hit.star.mutagen && HUA_PALACE[hit.star.mutagen]) lines.push(`→ 它带生年化${hit.star.mutagen}，在${name}：${huaMeaning(hit.star.mutagen, name)}。`);
      return lines.join("\n");
    }
    if (BRIGHT[key]) {
      const list = [];
      palaces.forEach((p) => p.majorStars.forEach((s) => { if (s.brightness === key) list.push(`${s.name}（${pname(p.name)}）`); }));
      return list.length ? `本盘亮度为“${key}”的主星：${list.join("、")}。` : `本盘没有亮度为“${key}”的主星。`;
    }
    return "";
  }


  /* ---------- 白话读盘：直接复用浮窗的 chartLine，不另写一套文字 ---------- */
  function meaningItems(line) {
    return String(line || "").split("\n").filter((part) => part.startsWith("→")).map((part) => {
      const text = part.replace(/^→\s*/, "");
      const m = text.match(/[化飞自]([禄权科忌])/);
      return { text, label: m ? m[1] : "", kind: m ? { 禄: "lu", 权: "quan", 科: "ke", 忌: "ji" }[m[1]] : "" };
    });
  }
  function factOf(line) { return String(line || "").split("\n").filter((part) => !part.startsWith("→")).join(" "); }
  function plainModel(ctx = {}) {
    const snapshot = ctx.snapshot;
    if (!snapshot || !snapshot.natal) return [];
    const palaces = snapshot.natal.palaces;
    const at = (index) => palaces.find((p) => p.index === index);
    const horo = ctx.horoscope;
    const blocks = [];
    const birth = chartLine("生年四化", ctx);
    blocks.push({ id: "birth", title: "你天生的顺处和操心点", sub: `生年四化 · ${String(snapshot.calendar?.sexagenary || "").charAt(0)}干`, key: "生年四化", fact: factOf(birth), items: meaningItems(birth) });
    if (horo) {
      const d = chartLine("大限四化", ctx), y = chartLine("流年四化", ctx);
      blocks.push({ id: "decadal", title: "这十年", sub: `大限 ${horo.decadal.ageRange[0]}–${horo.decadal.ageRange[1]} 岁 · ${pname(at(horo.decadal.palaceIndex)?.name || "")}`, key: "大限四化", fact: factOf(d), items: meaningItems(d) });
      blocks.push({ id: "yearly", title: "今年", sub: `流年 ${horo.yearly.heavenlyStem}${horo.yearly.earthlyBranch} · 流年命宫在${pname(at(horo.yearly.palaceIndex)?.name || "")}`, key: "流年四化", fact: factOf(y), items: meaningItems(y) });
    } else {
      blocks.push({ id: "decadal", title: "这十年", sub: "尚未固定运限", key: "大限四化", fact: "", items: [], empty: "在“运限”里选一个日期后显示。" });
      blocks.push({ id: "yearly", title: "今年", sub: "尚未固定运限", key: "流年四化", fact: "", items: [], empty: "在“运限”里选一个日期后显示。" });
    }
    const sel = at(ctx.selected);
    if (sel) {
      const palaceLine = chartLine(pname(sel.name), ctx);
      const flyLine = chartLine("宫干飞化连线", ctx);
      blocks.push({ id: "palace", title: "你选中的这一宫", sub: `${pname(sel.name)} · ${sel.heavenlyStem}${sel.earthlyBranch}`, key: "宫干四化", fact: factOf(flyLine), items: [...meaningItems(palaceLine), ...meaningItems(flyLine)] });
    }
    return blocks;
  }

  function aiQuestion(key, line) {
    const term = get(key);
    const title = term ? term.key.replace(/连线$/, "") : key;
    return `请用白话结合我这张命盘，详细讲讲“${title}”是什么意思${line ? `（盘面：${line.split("\n")[0].replace(/。$/, "")}）` : ""}，它在我的盘上可能意味着什么？请保持中性、不要宿命化。`;
  }

  function search(query) {
    const q = String(query || "").trim();
    if (!q) return TERMS.slice();
    return TERMS.filter((t) => t.key.includes(q) || t.aliases.some((a) => a.includes(q)) || t.text.includes(q) || t.group.includes(q));
  }

  /* ---------------- 页面挂载 ---------------- */
  function mount() {
    const doc = root.document;
    const $ = (id) => doc.getElementById(id);
    const html = doc.documentElement;
    if (!$("chartGrid")) return;
    const view = { snapshot: null, horoscope: null, selected: null };
    const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c]);
    const motionOK = () => !(root.PremiumUI && !root.PremiumUI.motionOK());
    const stemTable = root.iztro && root.iztro.util ? (stem) => root.iztro.util.getMutagensByHeavenlyStem(stem) : undefined;
    const ctx = () => ({ snapshot: view.snapshot, horoscope: view.horoscope, selected: view.selected, stemTable });

    /* 1) 自动给术语加虚线下划线 */
    const ROOTS = [["zwPlain"], ["zwOverview"], ["palaceDetail"], ["zwFlyDetail", "fly"], ["zwLegend"], ["zwTimeline"], ["horoscopeSummary"], ["entrySummaryText"], ["horoscopeState"]];
    const SKIP = "button,a,input,textarea,select,option,label,summary,svg,script,style,.zw-term,.palace,[data-zw-noterm]";
    function annotate(container, mode) {
      if (!container) return;
      const walker = doc.createTreeWalker(container, root.NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach((node) => {
        const parent = node.parentElement;
        if (!parent || !node.nodeValue.trim() || parent.closest(SKIP)) return;
        const token = /^(SMALL|EM|I|B)$/.test(parent.tagName);
        const parts = tokenize(node.nodeValue, { token, mode });
        if (!parts.some((p) => p.key)) return;
        const frag = doc.createDocumentFragment();
        parts.forEach((p) => {
          if (!p.key) { frag.appendChild(doc.createTextNode(p.text)); return; }
          const span = doc.createElement("span");
          span.className = "zw-term";
          span.dataset.zwTerm = p.key;
          span.setAttribute("role", "button");
          span.setAttribute("tabindex", "0");
          span.setAttribute("aria-haspopup", "dialog");
          span.textContent = p.text;
          frag.appendChild(span);
        });
        node.parentNode.replaceChild(frag, node);
      });
    }
    let pending = 0;
    const annotateAll = () => { pending = 0; ROOTS.forEach(([id, mode]) => annotate($(id), mode)); };
    const schedule = () => { if (!pending) pending = root.requestAnimationFrame(annotateAll); };
    if (root.MutationObserver) {
      const mo = new root.MutationObserver(schedule);
      ROOTS.forEach(([id]) => { const el = $(id); if (el) mo.observe(el, { childList: true, subtree: true, characterData: true }); });
    }
    annotateAll();


    /* 白话读盘（本命页，命盘总览下方） */
    const plain = $("zwPlain");
    const plainOpen = {};
    const narrow = () => Boolean(root.matchMedia && root.matchMedia("(max-width: 760px)").matches);
    function renderPlain() {
      if (!plain) return;
      const blocks = plainModel(ctx());
      if (!blocks.length) { plain.hidden = true; plain.innerHTML = ""; return; }
      plain.querySelectorAll("details[data-plain]").forEach((d) => { plainOpen[d.dataset.plain] = d.open; });
      const isOpen = (b, i) => (b.id in plainOpen ? plainOpen[b.id] : !narrow() || i === 0);
      plain.innerHTML = `<header class="zw-plain-head"><div><small>不用懂术语也能看</small><h2 id="zwPlainTitle">白话读盘</h2></div><p>${esc(MEANING_NOTE)}</p></header>
        <div class="zw-plain-grid">${blocks.map((b, i) => `<details class="zw-plain-block" data-plain="${b.id}"${isOpen(b, i) ? " open" : ""}>
          <summary><span class="zw-plain-title">${esc(b.title)}</span><span class="zw-plain-sub">${esc(b.sub)}</span><button type="button" class="zw-help" data-zw-term="${esc(b.key)}" aria-label="${esc(b.key)}是什么意思">?</button></summary>
          ${b.items.length ? `<ul>${b.items.map((it) => `<li class="${it.kind ? `zw-k-${it.kind}` : "zw-plain-topic"}"><i aria-hidden="true">${esc(it.label || "·")}</i><span>${esc(it.text)}</span></li>`).join("")}</ul>` : `<p class="zw-plain-empty">${esc(b.empty || "—")}</p>`}
          ${b.fact ? `<p class="zw-plain-fact">盘面：${esc(b.fact)}</p>` : ""}
        </details>`).join("")}</div>`;
      plain.hidden = false;
    }
    if (plain) plain.addEventListener("toggle", (event) => { const d = event.target; if (d && d.dataset && d.dataset.plain) plainOpen[d.dataset.plain] = d.open; }, true);

    /* 2) 浮窗 */
    const pop = doc.createElement("div");
    pop.className = "zw-pop";
    pop.id = "zwTermPop";
    pop.setAttribute("role", "dialog");
    pop.setAttribute("aria-modal", "false");
    pop.setAttribute("aria-labelledby", "zwTermPopTitle");
    pop.hidden = true;
    doc.body.appendChild(pop);
    let trigger = null;
    const mobile = () => Boolean(root.matchMedia && root.matchMedia("(max-width: 760px)").matches);

    function mineHtml(line) {
      return `<div class="zw-pop-mine"><small>在你的盘上</small>${String(line).split("\n").map((part) => `<span class="${part.startsWith("→") ? "zw-mean" : "zw-fact"}">${esc(part)}</span>`).join("")}</div>`;
    }
    function renderCard(term, line, withAi) {
      return `<div class="zw-pop-head"><span class="zw-pop-group">${esc(term.group)}</span><strong id="zwTermPopTitle">${esc(term.key)}</strong>
          <button type="button" class="zw-pop-x" data-zw-pop-close aria-label="关闭">×</button></div>
        ${term.key === '夏令时' && root.BirthTime ? `<div class="zw-pop-text">${root.BirthTime.helpHtml}</div>` : `<p class="zw-pop-text">${esc(term.text)}</p>`}
        ${line ? `${mineHtml(line)}<p class="zw-pop-note">${MEANING_NOTE}</p>` : ""}
        <div class="zw-pop-actions">${withAi && term.key !== '夏令时' ? `<button type="button" class="zw-pop-ai" data-zw-ask="${esc(term.key)}">问 AI 详细讲讲</button>` : ""}<button type="button" class="zw-pop-dict" data-zw-dict="${esc(term.key)}">新手词典</button></div>`;
    }
    function place(anchor) {
      pop.classList.toggle("zw-pop-sheet", mobile());
      pop.style.left = pop.style.top = "";
      if (mobile() || !anchor) return;
      const r = anchor.getBoundingClientRect();
      const w = pop.offsetWidth, h = pop.offsetHeight;
      const vw = html.clientWidth, vh = root.innerHeight;
      let left = Math.min(Math.max(12, r.left + r.width / 2 - w / 2), vw - w - 12);
      let top = r.bottom + 8;
      if (top + h > vh - 12 && r.top - h - 8 > 12) top = r.top - h - 8;
      pop.style.left = `${Math.round(left + root.scrollX)}px`;
      pop.style.top = `${Math.round(top + root.scrollY)}px`;
    }
    function open(key, anchor) {
      const term = get(key);
      if (!term) return;
      if (trigger && trigger !== anchor) trigger.classList.remove("zw-term-on");
      trigger = anchor || null;
      if (trigger) trigger.classList.add("zw-term-on");
      pop.innerHTML = renderCard(term, chartLine(key, ctx()), Boolean(view.snapshot && $("aiQuestion")));
      pop.dataset.term = key;
      pop.hidden = false;
      place(anchor);
      pop.classList.remove("zw-pop-in");
      if (motionOK()) { void pop.offsetWidth; pop.classList.add("zw-pop-in"); }
      const first = pop.querySelector(".zw-pop-x");
      if (first) first.focus({ preventScroll: true });
    }
    function close(restore) {
      if (pop.hidden) return;
      pop.hidden = true;
      pop.classList.remove("zw-pop-in");
      if (trigger) { trigger.classList.remove("zw-term-on"); if (restore && trigger.isConnected) trigger.focus({ preventScroll: true }); }
      trigger = null;
    }

    function ask(key) {
      const q = $("aiQuestion");
      if (!q) return;
      const line = chartLine(key, ctx());
      close(false);
      closeDict(false);
      const tab = doc.querySelector('#zwTabs [data-zw-tab="ai"]');
      if (tab) tab.click();
      q.value = aiQuestion(key, line);
      q.dispatchEvent(new root.Event("input", { bubbles: true }));
      root.requestAnimationFrame(() => { q.scrollIntoView({ behavior: motionOK() ? "smooth" : "auto", block: "center" }); q.focus({ preventScroll: true }); });
    }

    /* 3) 新手词典 */
    const dlg = doc.createElement("div");
    dlg.className = "zw-dict";
    dlg.id = "zwDict";
    dlg.hidden = true;
    dlg.innerHTML = `<div class="zw-dict-scrim" data-zw-dict-close></div>
      <section class="zw-dict-panel" role="dialog" aria-modal="true" aria-labelledby="zwDictTitle">
        <header class="zw-dict-head"><div><small>看不懂就查这里</small><h2 id="zwDictTitle">新手词典</h2></div>
          <button type="button" class="zw-pop-x" data-zw-dict-close aria-label="关闭词典">×</button></header>
        <label class="zw-dict-search"><span class="sr-only">搜索术语</span><input id="zwDictSearch" type="search" placeholder="搜索：化忌、命宫、天机……" autocomplete="off"></label>
        <nav class="zw-dict-groups" aria-label="分组">${GROUPS.map((g) => `<button type="button" data-zw-dict-group="${g}">${g}</button>`).join("")}</nav>
        <div class="zw-dict-body" id="zwDictBody"></div>
      </section>`;
    doc.body.appendChild(dlg);
    const dictBody = dlg.querySelector("#zwDictBody");
    const dictSearch = dlg.querySelector("#zwDictSearch");
    let dictReturn = null;
    function renderDict() {
      const list = search(dictSearch.value);
      if (!list.length) { dictBody.innerHTML = '<p class="zw-dict-empty">没有找到，换个词试试。</p>'; return; }
      const withAi = Boolean(view.snapshot && $("aiQuestion"));
      dictBody.innerHTML = (view.snapshot ? `<p class="zw-pop-note zw-dict-note">“在你的盘上”的白话句：${MEANING_NOTE}。</p>` : "") + GROUPS.map((g) => {
        const items = list.filter((t) => t.group === g);
        if (!items.length) return "";
        return `<section class="zw-dict-sec" data-group="${g}"><h3>${g}</h3>${items.map((t) => {
          const line = chartLine(t.key, ctx());
          const alias = t.aliases.filter((a) => a.length > 1 && !a.includes("·")).slice(0, 3);
          return `<article class="zw-dict-item" id="zwDict-${encodeURIComponent(t.key)}" data-term="${esc(t.key)}"><h4>${esc(t.key)}${alias.length ? `<small>${esc(alias.join(" / "))}</small>` : ""}</h4><p>${esc(t.text)}</p>${line ? mineHtml(line) : ""}${withAi && line ? `<button type="button" class="zw-dict-ask" data-zw-ask="${esc(t.key)}">问 AI</button>` : ""}</article>`;
        }).join("")}</section>`;
      }).join("");
    }
    function openDict(focusKey) {
      close(false);
      dictReturn = doc.activeElement;
      if (focusKey) dictSearch.value = "";
      renderDict();
      dlg.hidden = false;
      html.classList.add("zw-dict-lock");
      if (motionOK()) { dlg.classList.remove("zw-dict-in"); void dlg.offsetWidth; dlg.classList.add("zw-dict-in"); }
      const target = focusKey && dictBody.querySelector(`[data-term="${root.CSS && root.CSS.escape ? root.CSS.escape(focusKey) : focusKey}"]`);
      if (target) { target.classList.add("zw-dict-hit"); target.scrollIntoView({ block: "center" }); target.setAttribute("tabindex", "-1"); target.focus({ preventScroll: true }); }
      else dictSearch.focus({ preventScroll: true });
    }
    function closeDict(restore) {
      if (dlg.hidden) return;
      dlg.hidden = true;
      html.classList.remove("zw-dict-lock");
      if (restore !== false && dictReturn && dictReturn.isConnected) dictReturn.focus({ preventScroll: true });
    }
    dictSearch.addEventListener("input", renderDict);

    /* 题头入口 + 图层 ? */
    const sub = doc.querySelector(".zw-top .sub") || doc.querySelector(".page-intro .sub");
    const infoBtn = $("zwInfoBtn");
    if (infoBtn && !$("zwDictBtn")) {
      const b = doc.createElement("button");
      b.type = "button";
      b.id = "zwDictBtn";
      b.className = "zw-dict-btn";
      b.dataset.zwDict = "";
      b.textContent = "新手词典";
      infoBtn.insertAdjacentElement("afterend", b);
    } else if (sub && !$("zwDictBtn")) sub.insertAdjacentHTML("beforeend", '<button type="button" id="zwDictBtn" class="zw-dict-btn" data-zw-dict="">新手词典</button>');

    /* 事件委托 */
    doc.addEventListener("click", (event) => {
      const t = event.target;
      const askBtn = t.closest("[data-zw-ask]");
      if (askBtn) { event.preventDefault(); ask(askBtn.dataset.zwAsk); return; }
      const dictBtn = t.closest("[data-zw-dict]");
      if (dictBtn) { event.preventDefault(); openDict(dictBtn.dataset.zwDict || ""); return; }
      if (t.closest("[data-zw-dict-close]")) { closeDict(); return; }
      if (t.closest("[data-zw-pop-close]")) { close(true); return; }
      const help = t.closest("[data-zw-term]");
      if (help && !pop.contains(help)) {
        event.preventDefault();
        event.stopPropagation();
        if (!pop.hidden && trigger === help) { close(false); return; }
        open(help.dataset.zwTerm, help);
        return;
      }
      if (!pop.hidden && !pop.contains(t)) close(false);
    }, true);
    doc.addEventListener("keydown", (event) => {
      const t = event.target;
      if ((event.key === "Enter" || event.key === " ") && t.classList && t.classList.contains("zw-term")) {
        event.preventDefault();
        open(t.dataset.zwTerm, t);
        return;
      }
      if (event.key === "Escape") {
        if (!pop.hidden) { event.stopImmediatePropagation(); event.preventDefault(); close(true); return; }
        if (!dlg.hidden) { event.stopImmediatePropagation(); event.preventDefault(); closeDict(); }
      }
      if (event.key === "Tab" && !dlg.hidden) {
        const f = Array.from(dlg.querySelectorAll("button,input")).filter((n) => n.offsetParent !== null);
        if (f.length && event.shiftKey && doc.activeElement === f[0]) { event.preventDefault(); f[f.length - 1].focus(); }
        else if (f.length && !event.shiftKey && doc.activeElement === f[f.length - 1]) { event.preventDefault(); f[0].focus(); }
      }
    }, true);
    dlg.addEventListener("click", (event) => {
      const g = event.target.closest("[data-zw-dict-group]");
      if (!g) return;
      const sec = dictBody.querySelector(`[data-group="${g.dataset.zwDictGroup}"]`);
      if (sec) sec.scrollIntoView({ behavior: motionOK() ? "smooth" : "auto", block: "start" });
    });
    root.addEventListener("resize", () => { if (!pop.hidden) place(trigger); });
    root.addEventListener("ziwei:view", (event) => {
      const d = event.detail || {};
      view.snapshot = d.snapshot || null;
      view.horoscope = d.horoscope || null;
      view.selected = d.selectedPalaceIndex;
      if (d.reason === "reset") { if (plain) { plain.hidden = true; plain.innerHTML = ""; } }
      else renderPlain();
      if (!pop.hidden && pop.dataset.term) {
        const key = pop.dataset.term;
        if (trigger && !trigger.isConnected) close(false);
        else { pop.innerHTML = renderCard(get(key), chartLine(key, ctx()), Boolean(view.snapshot && $("aiQuestion"))); place(trigger); }
      }
      schedule();
    });
  }

  return Object.freeze({ GROUPS, TERMS, LAYER_TERM, PALACE_TOPIC, HUA_PALACE, STAR_TRAIT, MEANING_NOTE, plainModel, meaningItems, huaMeaning, flyMeaning, starMeaning, get, resolve, tokenize, chartLine, aiQuestion, search, mount });
});
