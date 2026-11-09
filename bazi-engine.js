(function(root){
  'use strict';
  var birthTime=root.BirthTime||(typeof module==='object'&&module.exports?require('./birth-time.js'):null);

  var STEMS='甲乙丙丁戊己庚辛壬癸'.split('');
  var BRANCHES='子丑寅卯辰巳午未申酉戌亥'.split('');
  var WUXING=['木','火','土','金','水'];
  var STEM_WX={甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'};
  var BRANCH_WX={寅:'木',卯:'木',巳:'火',午:'火',辰:'土',戌:'土',丑:'土',未:'土',申:'金',酉:'金',亥:'水',子:'水'};
  var HIDDEN={子:['癸'],丑:['己','癸','辛'],寅:['甲','丙','戊'],卯:['乙'],辰:['戊','乙','癸'],巳:['丙','戊','庚'],午:['丁','己'],未:['己','丁','乙'],申:['庚','壬','戊'],酉:['辛'],戌:['戊','辛','丁'],亥:['壬','甲']};
  var KONG_BY_XUN={0:'戌亥',1:'申酉',2:'午未',3:'辰巳',4:'寅卯',5:'子丑'};
  var gen={木:'火',火:'土',土:'金',金:'水',水:'木'};
  var ctrl={木:'土',土:'水',水:'火',火:'金',金:'木'};
  var combineStem={甲:'己',己:'甲',乙:'庚',庚:'乙',丙:'辛',辛:'丙',丁:'壬',壬:'丁',戊:'癸',癸:'戊'};
  var branchGroup={申:'申子辰',子:'申子辰',辰:'申子辰',寅:'寅午戌',午:'寅午戌',戌:'寅午戌',巳:'巳酉丑',酉:'巳酉丑',丑:'巳酉丑',亥:'亥卯未',卯:'亥卯未',未:'亥卯未'};
  var PATTERN_ENGINE_VERSION='BAZI-PATTERN-2026.11.07.1-review';
  var PATTERN_RULE_VERSION='ZP-2026.11.07.1-review';
  var USEFUL_DECISION_VERSION='ZP-USE-2026.11.09-v3';
  var THEORETICAL_BASELINE_VERSION='ZP-TB-1984-2044-D11-H12-v13-review';
  var PATTERN_SCORE_MODEL_VERSION='ZP-SCORE-2026.07.15-v4';
  var LUCK_RECHECK_VERSION='ZP-LUCK-2026.11.07-v2-review';
  var PATTERN_LEVELS=['偏低','中等','偏高','高','顶级'];
  var PATTERN_SCORE_DIMENSION_WEIGHTS={potential:20,formation:25,flow:20,clarity:15,remedy:15,balance:5};
  var PATTERN_LEVEL_AUDIT_VERSION='PAT-LV-DESIGN-v1';
  var LEGAL_FOUR_PILLAR_GENERATOR_VERSION='ZP-LEGAL-4P-518400-v1';
  var PATTERN_LEVEL_AUDIT_WEIGHTS={
    control:{potential:20,formation:25,flow:20,clarity:15,remedy:15,balance:5},
    candidate:{potential:10,formation:25,flow:25,clarity:15,remedy:20,balance:5}
  };
  var CLASSICAL_PATTERN_POTENTIAL_RULES={
    'ZP-CG-01':{tier:'S',score:100,sourceSystem:'主流子平月令格局',source:['《子平真诠》偏官篇','《渊海子平》杀印相生']},
    'ZP-CG-02':{tier:'S',score:100,sourceSystem:'主流子平月令格局',source:['《子平真诠》偏官篇','《三命通会》食神制杀']},
    'ZP-CG-03':{tier:'S',score:100,sourceSystem:'主流子平月令格局',source:['《子平真诠》伤官篇','《三命通会》卷六伤官']},
    'ZP-CG-04':{tier:'A',score:85,sourceSystem:'主流子平月令格局',source:['《子平真诠》正官、印绶篇','《三命通会》官印相生']},
    'ZP-CG-05':{tier:'S',score:100,sourceSystem:'主流子平月令格局',source:['《子平真诠》正官、建禄篇','《三命通会》财官印三奇']},
    'ZP-CG-06':{tier:'A',score:85,sourceSystem:'主流子平月令格局',source:['《子平真诠》伤官篇','《滴天髓阐微》八格正理']},
    'ZP-CG-08':{tier:'S',score:100,sourceSystem:'主流子平月令格局',source:['《子平真诠》阳刃篇','《三命通会》卷五阳刃']},
    'ZP-CG-09':{tier:'S',score:100,sourceSystem:'主流子平月令格局',source:['《渊海子平》食神生财','《滴天髓阐微》八格正理']}
  };
  var THEORETICAL_LEVEL_BANDS=[
    {grade:'偏低',min:0,max:5},
    {grade:'中等',min:5,max:20},
    {grade:'偏高',min:20,max:80},
    {grade:'高',min:80,max:95},
    {grade:'顶级',min:95,max:100.1}
  ];
  var STRUCTURE_SCORE_LEVEL_BANDS=[
    {grade:'偏低',label:'不高于48分',min:0,max:48},
    {grade:'中等',label:'高于48分且不高于52分',min:48,max:52},
    {grade:'偏高',label:'高于52分且低于75分',min:52,max:75},
    {grade:'高',label:'75分至不足78分',min:75,max:78},
    {grade:'顶级',label:'78分及以上',min:78,max:100.1}
  ];
  var THEORETICAL_BASELINE_CONFIG={start:'1984-02-04',endExclusive:'2044-02-04',stepDays:11,hours:[0,2,4,6,8,10,12,14,16,18,20,22],timezone:'Asia/Shanghai',referenceLongitude:120,trueSolarCorrection:false,deduplicate:'fourPillars'};
  var THEORETICAL_BASELINE_HISTOGRAM={"39":2,"40":36,"41":1,"42":168,"43":15,"44":241,"45":372,"46":720,"47":217,"48":692,"49":3447,"50":497,"51":749,"52":1744,"53":642,"54":681,"55":1944,"56":761,"57":480,"58":1218,"59":697,"60":335,"61":92,"62":1508,"63":30,"64":258,"65":39,"66":492,"67":224,"68":35,"69":237,"70":296,"71":168,"72":80,"73":157,"74":281,"75":2403,"76":512,"77":466,"78":72,"79":17,"80":25,"81":1,"82":11,"83":91,"84":14,"85":6,"86":348,"87":128,"89":266};
  var THEORETICAL_BASELINE_STATS={"sampleCount":23916,"uniqueCount":23916,"duplicateCount":0,"scoreRange":{"min":39,"max":89},"mean":59.006565,"standardDeviation":11.026705,"quantiles":{"p5":46,"p20":49,"p50":55,"p80":73,"p95":77},"candidateGradeCounts":{"偏高":11508,"高":3251,"顶级":911,"中等":5792,"偏低":2454},"gradeCounts":{"偏高":11973,"高":2854,"顶级":843,"中等":5792,"偏低":2454},"gradePercentages":{"偏低":10.26,"中等":24.22,"偏高":50.06,"高":11.93,"顶级":3.52},"ruleVersion":"ZP-2026.11.07.1-review","engineVersion":"BAZI-PATTERN-2026.11.07.1-review","scoreModelVersion":"ZP-SCORE-2026.07.15-v4"};
  var AUTHORITY_PATTERN_RULES={
    财:{id:'ZP-MG-01',gods:['正财','偏财'],principle:'财星当令，重在身能任财，并见食神生财或财生官护。',success:['身能任财','食伤生财','财生官'],breakers:['比劫夺财','身弱不任财'],rescues:['官星制比护财','印比扶身承财']},
    官:{id:'ZP-MG-02',gods:['正官'],principle:'正官当令，喜财生、印护，忌伤官与官杀混杂。',success:['财生官','官生印'],breakers:['伤官见官','官杀混杂','身弱官重'],rescues:['印制伤护官','去杀留官']},
    印:{id:'ZP-MG-03',gods:['正印','偏印'],principle:'印星当令，喜官杀生印与食伤泄秀，忌财星直接坏印。',success:['官杀生印','身印相停'],breakers:['财坏印','身印过旺'],rescues:['比劫制财护印','食伤泄秀']},
    食:{id:'ZP-MG-04',gods:['食神'],principle:'食神当令，喜生财或制杀，忌枭神夺食与身弱泄过。',success:['食神生财','食神制杀'],breakers:['枭神夺食','身弱泄身'],rescues:['财星制枭','印比扶身但不夺食']},
    杀:{id:'ZP-MG-05',gods:['七杀'],principle:'七杀当令，必须有制或有化，忌无制攻身与官杀混杂。',success:['食神制杀','杀印相生'],breakers:['杀无制化','官杀混杂','杀重身轻'],rescues:['食神制杀','印星化杀']},
    伤:{id:'ZP-MG-06',gods:['伤官'],principle:'伤官当令，须生财或配印，忌无救的伤官见官。',success:['伤官生财','伤官配印'],breakers:['伤官见官','身弱泄身'],rescues:['印制伤','财星通关']},
    禄:{id:'ZP-MG-07',gods:['比肩'],principle:'建禄月劫，月令本身无可顺用，须向外取财官食伤。',success:['官杀制比','食伤生财'],breakers:['印比成群','外局无可取'],rescues:['财官透清','食伤泄秀']},
    刃:{id:'ZP-MG-08',gods:['劫财'],principle:'月刃当令，以官杀制刃为先，忌无制与官杀混杂。',success:['官杀制刃'],breakers:['刃无制','制刃不清'],rescues:['官杀清透制刃']}
  };
  var COMBO_RULE_IDS={
    '官杀混杂待清':'ZP-BR-01','伤官见官待制':'ZP-BR-02','财多身弱待扶':'ZP-BR-03','食伤混杂待清':'ZP-BR-04',
    '杀印相生格':'ZP-CG-01','食神制杀格':'ZP-CG-02','伤官配印格':'ZP-CG-03','官印相生格':'ZP-CG-04','财官印相生格':'ZP-CG-05','伤官生财格':'ZP-CG-06','财滋弱杀格':'ZP-CG-07','羊刃驾杀格':'ZP-CG-08','食神生财格':'ZP-CG-09'
  };
  var SPECIAL_PATTERN_RULES={
    从杀格:{id:'ZP-SP-01',type:'从格',tier:'S',score:100,sourceSystem:'主流子平特殊格局',source:['《子平真诠》从格取势','《滴天髓阐微》从象、从势']},
    从财格:{id:'ZP-SP-04',type:'从格',tier:'S',score:100,sourceSystem:'主流子平特殊格局',source:['《子平真诠》从财','《滴天髓阐微》从财']},
    从儿格:{id:'ZP-SP-05',type:'从格',tier:'S',score:100,sourceSystem:'主流子平特殊格局',source:['《滴天髓阐微》从儿']},
    甲己化土:{id:'ZP-SP-06',type:'化气格',tier:'S',score:100,sourceSystem:'主流子平特殊格局',source:['《三命通会》化气十段锦','《子平真诠》化气']},
    乙庚化金:{id:'ZP-SP-07',type:'化气格',tier:'S',score:100,sourceSystem:'主流子平特殊格局',source:['《三命通会》化气十段锦','《子平真诠》化气']},
    丙辛化水:{id:'ZP-SP-08',type:'化气格',tier:'S',score:100,sourceSystem:'主流子平特殊格局',source:['《三命通会》化气十段锦','《子平真诠》化气']},
    丁壬化木:{id:'ZP-SP-09',type:'化气格',tier:'S',score:100,sourceSystem:'主流子平特殊格局',source:['《三命通会》化气十段锦','《子平真诠》化气']},
    戊癸化火:{id:'ZP-SP-10',type:'化气格',tier:'S',score:100,sourceSystem:'主流子平特殊格局',source:['《三命通会》化气十段锦','《子平真诠》化气']},
    曲直格:{id:'ZP-SP-11',type:'专旺格',tier:'S',score:100,sourceSystem:'主流子平特殊格局',source:['《三命通会》曲直仁寿格','《滴天髓阐微》独象']},
    炎上格:{id:'ZP-SP-12',type:'专旺格',tier:'S',score:100,sourceSystem:'主流子平特殊格局',source:['《三命通会》炎上格','《滴天髓阐微》独象']},
    稼穑格:{id:'ZP-SP-13',type:'专旺格',tier:'S',score:100,sourceSystem:'主流子平特殊格局',source:['《三命通会》稼穑格','《滴天髓阐微》独象']},
    从革格:{id:'ZP-SP-14',type:'专旺格',tier:'S',score:100,sourceSystem:'主流子平特殊格局',source:['《三命通会》从革格','《滴天髓阐微》独象']},
    润下格:{id:'ZP-SP-15',type:'专旺格',tier:'S',score:100,sourceSystem:'主流子平特殊格局',source:['《三命通会》润下格','《滴天髓阐微》独象']}
  };
  var PHENOMENON_RULES={
    earthBuriedMetal:{
      id:'ZP-QX-001',
      name:'土厚埋金',
      aliases:['土多埋金'],
      category:'五行气象与偏枯病象',
      type:'resourceExcess',target:'金',excess:'土',
      authority:'《滴天髓》反局“土重埋金”与徐大升五行生克制化“金赖土生，土多金埋”',
      definition:'土本能生金，但土势过重、金气弱而根受制时，生扶会转为包裹壅滞，使金难以显用。'
    },
    woodBlocksFire:{id:'ZP-QX-002',name:'木多火塞',aliases:['木多火熄'],category:'五行气象与生扶太过病象',type:'resourceExcess',target:'火',excess:'木',authority:'《滴天髓阐微·反局》原注母慈灭子、任氏相关制化解释；木多火塞为项目结构释义，不把木多火炽一概归为同义病象',definition:'木势过重、火弱而缺少本根承接时，按生扶太过作结构参考；木多或木火相生本身不是病象。',behavior:'这一结构不单独证明行动慢、性格或健康状态；相关现实表现只能另作观察，不由五行直接推出。'},
    fireScorchesEarth:{id:'ZP-QX-003',name:'火多土焦',aliases:['火炎土燥'],category:'五行气象与生扶太过病象',type:'resourceExcess',target:'土',excess:'火',authority:'《渊海子平·论五行生克制化》“土赖火生，火多土焦”；《三命通会》“火炎土燥则不能生物”',definition:'火本能生土，但火势过重、土少润泽且缺少本根承接时，生扶转为焦燥，土难以稳定承载。',behavior:'外界催动和任务热度持续过高时，较容易急于落地、耐心下降，基础维护被压缩；节奏降温并补足复盘后会减轻。'},
    metalMuddiesWater:{id:'ZP-QX-004',name:'金多水浊',aliases:[],category:'五行气象与生扶太过病象',type:'resourceExcess',target:'水',excess:'金',authority:'《渊海子平·论五行生克制化》“水赖金生，金多水浊”；《滴天髓阐微》以母多子病校验边界',definition:'金本能生水，但金势过重、水弱而流通不足时，生扶转为混浊，水难以清润周流。',behavior:'规则、标准或技术细节持续增加而自主流转空间不足时，较容易思路被框住、决策来回校验；允许试行和反馈后会减轻。'},
    waterFloatsWood:{id:'ZP-QX-005',name:'水多木漂',aliases:['水泛木浮'],category:'五行气象与生扶太过病象',type:'resourceExcess',target:'木',excess:'水',authority:'《渊海子平·论五行生克制化》“木赖水生，水多木漂”；《三命通会》水盛木漂流校验',definition:'水本能生木，但水势过重、木弱而根基不固时，生扶转为漂荡，木难以扎根伸展。',behavior:'信息、机会或情绪流动过多而方向未定时，较容易多线尝试、计划反复，稳定推进不足；固定优先级与落点后会减轻。'},
    waterSinksMetal:{id:'ZP-QX-006',name:'水多金沉',aliases:['水多金沈'],category:'五行气象与泄身反伤病象',type:'outputExcess',target:'金',excess:'水',authority:'《三命通会·元理赋》五行生克制化宜忌',definition:'金本能生水，但水势过重、金弱少根时，持续泄水会使金气下沉而难以收束。',behavior:'输出任务或外界需求持续且边界不清时，较容易因表达、思虑和事务消耗而难以收束，行动节奏可能被多线需求牵走。'},
    woodShrinksWater:{id:'ZP-QX-007',name:'木盛水缩',aliases:['木多水缩'],category:'五行气象与泄身反伤病象',type:'outputExcess',target:'水',excess:'木',authority:'《三命通会·元理赋》五行生克制化宜忌',definition:'水本能生木，但木势过盛、水弱少根时，水气被持续引泄而收缩。',behavior:'长期投入规划、创造或照料推进而缺少补充时，较容易出现多线付出、恢复不足，做事后段的持续性下降。'},
    fireBurnsWood:{id:'ZP-QX-008',name:'火多木焚',aliases:[],category:'五行气象与泄身反伤病象',type:'outputExcess',target:'木',excess:'火',authority:'《三命通会·元理赋》五行生克制化宜忌',definition:'木本能生火，但火势过旺、木弱少根时，木气被过度引燃而反受焚耗。',behavior:'表达、表现或推进强度持续过高时，较可能前段投入很快，后段续航不足；得到资源补充和明确节奏后会减轻。'},
    earthDimsFire:{id:'ZP-QX-009',name:'土多火晦',aliases:['土重晦火'],category:'五行气象与泄身反伤病象',type:'outputExcess',target:'火',excess:'土',authority:'《三命通会·元理赋》五行生克制化宜忌，《滴天髓》己土“火少火晦”校验湿土边界',definition:'火本能生土，但土势过重、火弱少根时，火气被持续泄耗；湿土尤易敛火晦光。',behavior:'落地事务、责任或准备工作持续堆积且缺少外部补充时，较可能热情表达受压、启动变慢，容易停在准备或恢复阶段。'},
    metalChangesEarth:{id:'ZP-QX-010',name:'金多土变',aliases:['金多土虚','金多土弱'],category:'五行气象与泄身反伤病象',type:'outputExcess',target:'土',excess:'金',authority:'《三命通会·元理赋》五行生克制化宜忌',definition:'土本能生金，但金势过重、土弱少根时，土气被持续泄化而失去稳定承载。',behavior:'规则化、技术性或交付型输出持续过强时，较容易忙于完成和修正细节，基础安排与休息恢复被挤压。'}
  };
  function phenomenonRuleByName(name){
    return Object.keys(PHENOMENON_RULES).map(function(key){return PHENOMENON_RULES[key]}).find(function(rule){return rule.name===name||rule.aliases.indexOf(name)>=0});
  }
  function normalizePhenomenonName(name){
    var rule=phenomenonRuleByName(name);
    return rule?rule.name:name;
  }
  function phenomenonDegree(severe,obvious,counterEvidence,severeBasis,obviousBasis,lightBasis){
    var severity=severe?'严重':(obvious?'明显':'轻度');
    var status=severe?'明确成立':(obvious?'明显倾向':'轻度倾向');
    var basis=severe?severeBasis:(obvious?obviousBasis:lightBasis);
    var boundary=severe?'已到当前最高严重度；若见有力根透或直接救应，应降级复核。':
      ((counterEvidence&&counterEvidence.length?'因'+counterEvidence[0]+'，':'仍有减轻条件，')+(obvious?'未判为严重。':'仅作轻度倾向。'));
    return {severity:severity,status:status,rank:severe?3:(obvious?2:1),basis:basis,boundary:boundary};
  }
  var SOLAR_TERM_MINUTES=[0,21208,42467,63836,85337,107014,128867,150921,173149,195551,218072,240693,263343,285989,308563,331033,353350,375494,397447,419210,440795,462224,483532,504758];
  var SOLAR_TERM_SOLVER_CORRECTION_MS=426000;
  var MONTH_START_TERM={寅:2,卯:4,辰:6,巳:8,午:10,未:12,申:14,酉:16,戌:18,亥:20,子:22,丑:0};
  var HUMAN_COMMAND={
    寅:[['戊',7],['丙',7],['甲',16]],卯:[['甲',10],['乙',20]],辰:[['乙',9],['癸',3],['戊',18]],
    巳:[['戊',7],['庚',7],['丙',16]],午:[['丙',10],['己',9],['丁',11]],未:[['丁',9],['乙',3],['己',18]],
    申:[['戊',7],['壬',7],['庚',16]],酉:[['庚',10],['辛',20]],戌:[['辛',9],['丁',3],['戊',18]],
    亥:[['戊',7],['甲',7],['壬',16]],子:[['壬',10],['癸',20]],丑:[['癸',9],['辛',3],['己',18]]
  };

  var SHENSHA_RULES={
    tianyi:{甲:'丑未',戊:'丑未',庚:'丑未',乙:'子申',己:'子申',丙:'亥酉',丁:'亥酉',壬:'卯巳',癸:'卯巳',辛:'寅午'},
    taiji:{甲:'子午',乙:'子午',丙:'卯酉',丁:'卯酉',戊:'辰戌丑未',己:'辰戌丑未',庚:'寅亥',辛:'寅亥',壬:'巳申',癸:'巳申'},
    wenchang:{甲:'巳',乙:'午',丙:'申',丁:'酉',戊:'申',己:'酉',庚:'亥',辛:'子',壬:'寅',癸:'卯'},
    tianchu:{甲:'巳',乙:'午',丙:'巳',丁:'午',戊:'申',己:'酉',庚:'亥',辛:'子',壬:'寅',癸:'卯'},
    fuxing:{甲:'寅子',乙:'丑卯',丙:'寅子',丁:'亥',戊:'申',己:'未',庚:'午',辛:'巳',壬:'辰',癸:'丑卯'},
    guoyin:{甲:'戌',乙:'亥',丙:'申',丁:'寅',戊:'丑',己:'寅',庚:'辰',辛:'巳',壬:'未',癸:'申'},
    jinyu:{甲:'辰',乙:'巳',丙:'未',丁:'申',戊:'未',己:'申',庚:'戌',辛:'亥',壬:'丑',癸:'寅'},
    liuxia:{甲:'酉',乙:'戌',丙:'未',丁:'申',戊:'巳',己:'午',庚:'辰',辛:'卯',壬:'亥',癸:'寅'},
    hongyan:{甲:'午',乙:'申',丙:'寅',丁:'未',戊:'辰',己:'辰',庚:'戌',辛:'酉',壬:'子',癸:'申'},
    lushen:{甲:'寅',乙:'卯',丙:'巳',丁:'午',戊:'巳',己:'午',庚:'申',辛:'酉',壬:'亥',癸:'子'},
    yangren:{甲:'卯',乙:'寅',丙:'午',丁:'巳',戊:'午',己:'巳',庚:'酉',辛:'申',壬:'子',癸:'亥'},
    peach:{申:'酉',子:'酉',辰:'酉',寅:'卯',午:'卯',戌:'卯',巳:'午',酉:'午',丑:'午',亥:'子',卯:'子',未:'子'},
    huagai:{申:'辰',子:'辰',辰:'辰',寅:'戌',午:'戌',戌:'戌',巳:'丑',酉:'丑',丑:'丑',亥:'未',卯:'未',未:'未'},
    yima:{申:'寅',子:'寅',辰:'寅',寅:'申',午:'申',戌:'申',巳:'亥',酉:'亥',丑:'亥',亥:'巳',卯:'巳',未:'巳'},
    jiangxing:{申:'子',子:'子',辰:'子',寅:'午',午:'午',戌:'午',巳:'酉',酉:'酉',丑:'酉',亥:'卯',卯:'卯',未:'卯'},
    jiesha:{申:'巳',子:'巳',辰:'巳',寅:'亥',午:'亥',戌:'亥',巳:'寅',酉:'寅',丑:'寅',亥:'申',卯:'申',未:'申'},
    wangshen:{寅:'巳',午:'巳',戌:'巳',申:'亥',子:'亥',辰:'亥',亥:'寅',卯:'寅',未:'寅',巳:'申',酉:'申',丑:'申'},
    zaisha:{寅:'子',午:'子',戌:'子',申:'午',子:'午',辰:'午',亥:'酉',卯:'酉',未:'酉',巳:'卯',酉:'卯',丑:'卯'},
    hongluan:{子:'卯',丑:'寅',寅:'丑',卯:'子',辰:'亥',巳:'戌',午:'酉',未:'申',申:'未',酉:'午',戌:'巳',亥:'辰'},
    tianxi:{子:'酉',丑:'申',寅:'未',卯:'午',辰:'巳',巳:'辰',午:'卯',未:'寅',申:'丑',酉:'子',戌:'亥',亥:'戌'},
    pima:{子:'酉',丑:'戌',寅:'亥',卯:'子',辰:'丑',巳:'寅',午:'卯',未:'辰',申:'巳',酉:'午',戌:'未',亥:'申'},
    diaoke:{子:'戌',丑:'亥',寅:'子',卯:'丑',辰:'寅',巳:'卯',午:'辰',未:'巳',申:'午',酉:'未',戌:'申',亥:'酉'},
    guasu:{亥:'戌',子:'戌',丑:'戌',寅:'丑',卯:'丑',辰:'丑',巳:'辰',午:'辰',未:'辰',申:'未',酉:'未',戌:'未'},
    yuanshen:{子:'未',丑:'申',寅:'酉',卯:'戌',辰:'亥',巳:'子',午:'丑',未:'寅',申:'卯',酉:'辰',戌:'巳',亥:'午'},
    tianDe:{寅:'丁',卯:'申',辰:'壬',巳:'辛',午:'亥',未:'甲',申:'癸',酉:'寅',戌:'丙',亥:'乙',子:'巳',丑:'庚'},
    monthDeStem:{寅:'丙',午:'丙',戌:'丙',申:'壬',子:'壬',辰:'壬',亥:'甲',卯:'甲',未:'甲',巳:'庚',酉:'庚',丑:'庚'},
    dexiuStem:{寅:'丙丁戊癸',午:'丙丁戊癸',戌:'丙丁戊癸',申:'壬癸戊己丙辛甲己',子:'壬癸戊己丙辛甲己',辰:'壬癸戊己丙辛甲己',亥:'甲乙丁壬',卯:'甲乙丁壬',未:'甲乙丁壬',巳:'庚辛乙庚',酉:'庚辛乙庚',丑:'庚辛乙庚'},
    tongzi:{寅:'寅子',卯:'寅子',辰:'寅子',巳:'卯未辰',午:'卯未辰',未:'卯未辰',申:'寅子',酉:'寅子',戌:'寅子',亥:'卯未辰',子:'卯未辰',丑:'卯未辰'},
    tenBad:['甲辰','乙巳','丙申','丁亥','戊戌','己丑','庚辰','辛巳','壬申','癸亥'],
    kuigang:['庚辰','庚戌','壬辰','戊戌'],
    yinYangError:['丙子','丁丑','戊寅','辛卯','壬辰','癸巳','丙午','丁未','戊申','辛酉','壬戌','癸亥'],
    guluan:['乙巳','丁巳','辛亥','戊申','甲寅','壬子','丙午'],
    tianShe:['戊寅','甲午','戊申','甲子']
  };

  function has(map,key,value){return ((map&&map[key])||'').indexOf(value)>=0}
  function add(out,name){if(name&&out.indexOf(name)<0)out.push(name)}
  function getGZ60(){return typeof GZ60!=='undefined'?GZ60:[]}

  function stemPolarity(s){return '甲丙戊庚壬'.indexOf(s)>=0?'阳':'阴'}
  function tenGod(dayStem,stem){
    var dayWx=STEM_WX[dayStem],wx=STEM_WX[stem],same=stemPolarity(dayStem)===stemPolarity(stem);
    if(!dayWx||!wx)return '';
    if(wx===dayWx)return same?'比肩':'劫财';
    if(wx===gen[dayWx])return same?'食神':'伤官';
    if(wx===ctrl[dayWx])return same?'偏财':'正财';
    if(ctrl[wx]===dayWx)return same?'七杀':'正官';
    if(gen[wx]===dayWx)return same?'偏印':'正印';
    return '';
  }
  function changsheng(stem,branch){
    if(typeof CS_START==='undefined'||typeof DI_ZHI==='undefined'||typeof CHANG_SHENG==='undefined')return '';
    var start=CS_START[stem],idx=DI_ZHI.indexOf(branch);
    if(start==null||idx<0)return '';
    var forward='甲丙戊庚壬'.indexOf(stem)>=0;
    var diff=forward?(idx-start+12)%12:(start-idx+12)%12;
    return CHANG_SHENG[diff];
  }
  function kongWang(gz){
    var idx=getGZ60().indexOf(gz);
    if(idx<0)return '';
    return KONG_BY_XUN[Math.floor(idx/10)]||'';
  }
  function buildPillars(t){
    var dayDate=new Date(t.year,t.month-1,t.day);
    if(t.hour>=23)dayDate.setDate(dayDate.getDate()+1);
    var day=getDayGZ(dayDate.getFullYear(),dayDate.getMonth()+1,dayDate.getDate());
    var flowYear=getFlowYearNumber(t),months=getFlowMonths(flowYear,day[0]),moment=timeValue(t),month=months[0];
    months.forEach(function(item){if(Date.parse(item.startAt)<=moment)month=item});
    return {year:getFlowYearGZ(flowYear),month:month.gz,day:day,hour:getHourGZ(day,t.hour)};
  }
  var MAJOR_SOLAR_TERMS=[
    {name:'立春',index:2},{name:'惊蛰',index:4},{name:'清明',index:6},
    {name:'立夏',index:8},{name:'芒种',index:10},{name:'小暑',index:12},
    {name:'立秋',index:14},{name:'白露',index:16},{name:'寒露',index:18},
    {name:'立冬',index:20},{name:'大雪',index:22},{name:'小寒',index:0,nextYear:true}
  ];
  function flowTermYear(flowYear,term){return flowYear+(term.nextYear?1:0)}
  function termDate(flowYear,term){return solarTermDate(flowTermYear(flowYear,term),term.index)}
  function timeValue(t){
    var hour=Number.isFinite(Number(t&&t.hour))?Number(t.hour):12,minute=Number.isFinite(Number(t&&t.minute))?Number(t.minute):0;
    return Date.UTC(t.year,t.month-1,t.day,hour-8,minute);
  }
  function chinaParts(date){
    var value=new Date(date.getTime()+8*3600000);
    return {year:value.getUTCFullYear(),month:value.getUTCMonth()+1,day:value.getUTCDate(),hour:value.getUTCHours(),minute:value.getUTCMinutes()};
  }
  function localTimeLabel(date){var p=chinaParts(date);return p.year+'/'+p.month+'/'+p.day+' '+String(p.hour).padStart(2,'0')+':'+String(p.minute).padStart(2,'0')}
  function getFlowYearNumber(t){
    return timeValue(t)<solarTermDate(t.year,2).getTime()?t.year-1:t.year;
  }
  function getFlowYearGZ(year){
    var gz=getGZ60();
    return gz[((year-1984)%60+60)%60]||'';
  }
  function luckDirection(data){
    var yangYear='甲丙戊庚壬'.indexOf(data.pillars.year[0])>=0;
    return ((data.gender==='男'&&yangYear)||(data.gender==='女'&&!yangYear))?1:-1;
  }
  function luckStartInfo(data){
    var used=data.time.used,dir=luckDirection(data);
    var birth=new Date(timeValue(used));
    var terms=[];
    for(var y=used.year-1;y<=used.year+1;y++){
      MAJOR_SOLAR_TERMS.forEach(function(t){var date=termDate(y,t),parts=chinaParts(date);terms.push({name:t.name,year:parts.year,month:parts.month,day:parts.day,date:date})});
    }
    terms.sort(function(a,b){return a.date-b.date});
    var target=null;
    terms.forEach(function(t){
      if(dir>0&&t.date>birth&&(!target||t.date<target.date))target=t;
      if(dir<0&&t.date<birth&&(!target||t.date>target.date))target=t;
    });
    var days=target?Math.abs(target.date-birth)/86400000:0;
    var exactAge=days/3;
    var elapsedYears=Math.max(1,Math.ceil(exactAge));
    return {direction:dir>0?'顺行':'逆行',term:target?target.name:'',termDate:target?{year:target.year,month:target.month,day:target.day}:null,termAt:target?target.date.toISOString():'',days:days,startAgeExact:Math.round(exactAge*100)/100,startAge:elapsedYears+1,startYear:used.year+elapsedYears,approximateStart:false};
  }
  function luckStartAge(data){return luckStartInfo(data).startAge}
  function getFlowMonths(year,dayStem){
    var yearGz=getFlowYearGZ(year),startStem=[2,4,6,8,0][STEMS.indexOf(yearGz[0])%5];
    var rows=MAJOR_SOLAR_TERMS.map(function(t,i){
      var date=termDate(year,t),parts=chinaParts(date),mgz=STEMS[(startStem+i)%10]+BRANCHES[(i+2)%12];
      return {month:i+1,term:t.name,dateLabel:parts.year+'/'+parts.month+'/'+parts.day,localTimeLabel:localTimeLabel(date),year:parts.year,gz:mgz,stemGod:tenGod(dayStem,mgz[0]),branchWx:BRANCH_WX[mgz[1]],startAt:date.toISOString()};
    });
    rows.forEach(function(item,index){item.endAt=index<rows.length-1?rows[index+1].startAt:termDate(year+1,MAJOR_SOLAR_TERMS[0]).toISOString()});
    return rows;
  }
  function nearestMajorSolarTerm(t){
    var moment=timeValue(t),items=[];
    for(var y=t.year-1;y<=t.year+1;y++)MAJOR_SOLAR_TERMS.forEach(function(term){var at=termDate(y,term);items.push({name:term.name,at:at.toISOString(),localTimeLabel:localTimeLabel(at),distanceHours:Math.abs(at.getTime()-moment)/3600000})});
    return items.sort(function(a,b){return a.distanceHours-b.distanceHours})[0]||null;
  }
  var NATAL_PILLAR_KEYS=['year','month','day','hour'];
  var PILLAR_META={
    year:{index:0,stemLabel:'年干',branchLabel:'年支',shortLabel:'年',temporal:false},
    month:{index:1,stemLabel:'月干',branchLabel:'月令',shortLabel:'月',temporal:false},
    day:{index:2,stemLabel:'日干',branchLabel:'日支',shortLabel:'日',temporal:false},
    hour:{index:3,stemLabel:'时干',branchLabel:'时支',shortLabel:'时',temporal:false},
    luck:{index:4,stemLabel:'运干',branchLabel:'运支',shortLabel:'运',temporal:true},
    flowYear:{index:5,stemLabel:'流年干',branchLabel:'流年支',shortLabel:'年运',temporal:true},
    flowMonth:{index:6,stemLabel:'流月干',branchLabel:'流月支',shortLabel:'月运',temporal:true},
    flowDay:{index:7,stemLabel:'流日干',branchLabel:'流日支',shortLabel:'日运',temporal:true}
  };
  var TEMPORAL_PILLAR_KEYS=['luck','flowYear','flowMonth','flowDay'];
  function orderedPillarKeys(pillars){
    var keys=NATAL_PILLAR_KEYS.filter(function(key){return pillars&&pillars[key]});
    TEMPORAL_PILLAR_KEYS.forEach(function(key){if(pillars&&pillars[key])keys.push(key)});
    return keys;
  }
  function visiblePillarKeys(pillars){
    return orderedPillarKeys(pillars).filter(function(key){return key!=='day'});
  }
  function scoreWuxing(pillars){
    var scores={木:0,火:0,土:0,金:0,水:0};
    orderedPillarKeys(pillars).forEach(function(k){
      var gz=pillars[k],s=gz[0],b=gz[1];
      scores[STEM_WX[s]]+=1;
      (HIDDEN[b]||[]).forEach(function(h,i){scores[STEM_WX[h]]+=i===0?0.7:(i===1?0.25:0.15)});
    });
    return scores;
  }
  var STRENGTH_WEIGHTS={yearStem:6,monthStem:10,hourStem:9,yearBranch:8,monthBranch:40,dayBranch:15,hourBranch:12,luckStem:9,luckBranch:12};
  function hiddenRatios(count){
    if(count<=1)return [1];
    if(count===2)return [0.7,0.3];
    return [0.7,0.2,0.1];
  }
  function supportRatio(dayStem,stem){
    return elementSupportRatio(dayStem,STEM_WX[stem]);
  }
  function elementSupportRatio(dayStem,wx){
    var dayWx=STEM_WX[dayStem],resource=Object.keys(gen).find(function(k){return gen[k]===dayWx});
    if(wx===dayWx)return 1;
    if(wx===resource)return 0.85;
    return 0;
  }
  function branchSupportRatio(dayStem,branch){
    var hidden=HIDDEN[branch]||[],ratios=hiddenRatios(hidden.length);
    return hidden.reduce(function(sum,s,i){return sum+supportRatio(dayStem,s)*(ratios[i]||0)},0);
  }
  var BRANCH_CLASH={子:'午',午:'子',丑:'未',未:'丑',寅:'申',申:'寅',卯:'酉',酉:'卯',辰:'戌',戌:'辰',巳:'亥',亥:'巳'};
  var BRANCH_HARM={子:'未',未:'子',丑:'午',午:'丑',寅:'巳',巳:'寅',卯:'辰',辰:'卯',申:'亥',亥:'申',酉:'戌',戌:'酉'};
  var BRANCH_BREAK={子:'酉',酉:'子',丑:'辰',辰:'丑',寅:'亥',亥:'寅',卯:'午',午:'卯',巳:'申',申:'巳',未:'戌',戌:'未'};
  var SIX_COMBINE_TARGET={'子丑':'土','寅亥':'木','卯戌':'火','辰酉':'金','巳申':'水','午未':'土'};
  var THREE_GROUPS=[{members:'申子辰',element:'水',name:'三合水局'},{members:'亥卯未',element:'木',name:'三合木局'},{members:'寅午戌',element:'火',name:'三合火局'},{members:'巳酉丑',element:'金',name:'三合金局'}];
  var THREE_MEETINGS=[{members:'寅卯辰',element:'木',name:'三会木局'},{members:'巳午未',element:'火',name:'三会火局'},{members:'申酉戌',element:'金',name:'三会金局'},{members:'亥子丑',element:'水',name:'三会水局'}];
  function branchClashCount(branch,pillars,key){
    return orderedPillarKeys(pillars).filter(function(k){return k!==key&&pillars[k][1]===BRANCH_CLASH[branch]}).length;
  }
  function branchesPunish(a,b,allBranches){
    if((a==='子'&&b==='卯')||(a==='卯'&&b==='子'))return true;
    if(a===b&&'辰午酉亥'.indexOf(a)>=0)return true;
    if(a!==b&&'寅巳申'.indexOf(a)>=0&&'寅巳申'.indexOf(b)>=0)return true;
    if(a!==b&&'丑未戌'.indexOf(a)>=0&&'丑未戌'.indexOf(b)>=0)return true;
    return false;
  }
  function branchAttackInfo(branch,pillars,key,interactions){
    var keys=interactions&&interactions.pillarKeys||orderedPillarKeys(pillars),position=keys.indexOf(key),attackTypes=['冲','刑','害','破'],relations=[],suppressed=[];
    if(interactions&&interactions.branchPairs){
      interactions.branchPairs.filter(function(item){return attackTypes.indexOf(item.type)>=0&&(item.left===position||item.right===position)}).forEach(function(item){
        if(item.active===false)suppressed.push(item.type+'（'+item.status+'）');
        else relations.push(item);
      });
    }else{
      var all=keys.map(function(k){return pillars[k][1]});
      keys.forEach(function(k,index){
        if(k===key)return;
        var other=pillars[k][1];
        if(BRANCH_CLASH[branch]===other)relations.push({left:position,right:index,type:'冲',active:true,status:'相冲'});
        if(BRANCH_HARM[branch]===other)relations.push({left:position,right:index,type:'害',active:true,status:'相害'});
        if(BRANCH_BREAK[branch]===other)relations.push({left:position,right:index,type:'破',active:true,status:'相破'});
        if(branchesPunish(branch,other,all))relations.push({left:position,right:index,type:'刑',active:true,status:'相刑'});
      });
    }
    var reasons=unique(relations.map(function(item){return item.type}));
    var penalty=(reasons.indexOf('冲')>=0?0.2:0)+(reasons.indexOf('刑')>=0?0.1:0)+(reasons.indexOf('害')>=0?0.08:0)+(reasons.indexOf('破')>=0?0.06:0);
    return {reasons:reasons,relations:relations,suppressed:unique(suppressed),penalty:Math.min(0.35,penalty)};
  }
  function branchGroupChange(key,interactions){
    var position=((interactions&&interactions.pillarKeys)||NATAL_PILLAR_KEYS).indexOf(key);
    if(position<0||!interactions)return null;
    return (interactions.groups||[]).filter(function(item){return item.complete&&item.active&&item.positions.indexOf(position)>=0}).sort(function(a,b){return b.priority-a.priority})[0]||null;
  }
  function rootEvidence(dayStem,pillars,interactions,options){
    var dayWx=STEM_WX[dayStem],roots=[],fullInteractionFeedback=!!(options&&options.fullInteractionFeedback);
    orderedPillarKeys(pillars).forEach(function(k){
      var hidden=HIDDEN[pillars[k][1]]||[],idx=hidden.findIndex(function(s){return STEM_WX[s]===dayWx});
      if(idx<0)return;
      var grade=idx===0?'本气根':(idx===1?'中气根':'余气根');
      var attack=branchAttackInfo(pillars[k][1],pillars,k,interactions),change=branchInteractionChange(k,interactions,fullInteractionFeedback),group=change&&change.kind==='group'?change.relation:null,changedByGroup=!!(group&&group.element!==dayWx),changedByInteraction=!!(change&&change.effect==='transform'&&change.element!==dayWx),boundByCombine=!!(change&&change.effect==='bind'),transformedAway=!!(changedByInteraction&&!change.challenged);
      var suppressedText=attack.suppressed.length?'；另见'+attack.suppressed.join('、')+'，未按有效损根计':'';
      var groupText=changedByGroup?'；随'+group.name+(group.challenged?'成局有瑕，原根减力':'变为'+group.element+'气，原根不再直接计用'):(changedByInteraction?'；随'+change.name+'变为'+change.element+'气，原根不再直接计用':(boundByCombine?'；受'+change.name+'，原根减力':''));
      var attacked=attack.reasons.length>0;
      var changeFactor=transformedAway?0:((changedByGroup||changedByInteraction)&&change.challenged?0.5:(boundByCombine?change.retention:1));
      var rootPower=(idx===0?1:(idx===1?0.6:0.3))*(1-attack.penalty)*changeFactor;
      roots.push({position:k,positionIndex:PILLAR_META[k].index,temporal:PILLAR_META[k].temporal,branch:pillars[k][1],grade:grade,rootPower:Math.round(rootPower*100)/100,exactStem:hidden[idx]===dayStem,attacked:attacked,attacks:attack.reasons,suppressedAttacks:attack.suppressed,changedByGroup:changedByGroup,changedByInteraction:changedByInteraction,boundByCombine:boundByCombine,transformedAway:transformedAway,group:group&&group.name||'',branchChange:change?{kind:change.kind,name:change.name,effect:change.effect,element:change.element,status:change.status}:null,usable:rootPower>0,text:PILLAR_META[k].branchLabel+pillars[k][1]+grade+(attack.reasons.length?'，受'+attack.reasons.join('、'):'')+groupText+suppressedText});
    });
    return roots;
  }
  function strictDayTransformQualification(dayStem,pillars,pair,target,combines){
    // Qualify from the unmodified chart. Feedback from the proposed transform
    // must not erase an origin root or manufacture its own target dominance.
    var rawScores=scoreWuxing(pillars),total=WUXING.reduce(function(sum,element){return sum+(rawScores[element]||0)},0)||1;
    var other=pair[0]===dayStem?pair[1]:(pair[1]===dayStem?pair[0]:''),dayElement=STEM_WX[dayStem],rawRoots=[];
    orderedPillarKeys(pillars).forEach(function(key){
      (HIDDEN[pillars[key][1]]||[]).forEach(function(stem){if(STEM_WX[stem]===dayElement)rawRoots.push({pillar:key,branch:pillars[key][1],stem:stem})});
    });
    var nativePairs=(combines||[]).filter(function(item){return item.pair===pair&&(item.left===2||item.right===2)&&item.effectiveDistance<=1&&['month','hour'].indexOf(item.left===2?item.rightKey:item.leftKey)>=0});
    var contested=nativePairs.some(function(item){return (combines||[]).some(function(candidate){return candidate!==item&&candidate.effectiveDistance<=1&&(candidate.left===item.left||candidate.right===item.left||candidate.left===item.right||candidate.right===item.right)})});
    var targetRatio=(rawScores[target]||0)/total,oppositionRatio=(rawScores[officerElement(target)]||0)/total;
    var checks=[
      {id:'adjacent-combine',label:'日主与月干或时干专一相合',met:!!other&&nativePairs.length>0&&!contested,evidence:contested?'月时近合存在竞争，不作专一真化':(nativePairs.length?'日主与月／时相合，未见近位竞争':'未见日主与月／时的专一近合')},
      {id:'transform-season',label:'化神得令',met:BRANCH_WX[pillars.month[1]]===target,evidence:pillars.month[1]+'月以'+BRANCH_WX[pillars.month[1]]+'为月令气'},
      {id:'no-origin-root',label:'日主无同类根气',met:rawRoots.length===0,evidence:rawRoots.length?'变气前仍有'+rawRoots.map(function(root){return ((PILLAR_META[root.pillar]||{}).branchLabel||root.pillar)+root.branch+'藏'+root.stem}).join('、'):'变气前地支未见日主同五行根气'},
      {id:'transform-force',label:'化神成势',met:targetRatio>=0.42,evidence:'变气前'+target+'约占全局'+Math.round(targetRatio*100)+'%，不使用合化新增量自证'},
      {id:'no-transform-break',label:'化神无强克破',met:oppositionRatio<0.18,evidence:'变气前'+officerElement(target)+'约占全局'+Math.round(oppositionRatio*100)+'%'}
    ];
    checks.forEach(function(item,index){item.ruleId='ZP-HC-01-DAY-Q'+(index+1);item.ruleVersion=PATTERN_RULE_VERSION});
    return {eligible:checks.every(function(item){return item.met}),pair:pair,target:target,rawRoots:rawRoots,rawTargetRatio:targetRatio,checks:checks,engineeringBoundary:'沿用本项目严格化气的无根、得令、42%成势及18%克破口径，不宣称是所有传统取法的唯一条件'};
  }
  function interactionAnalysis(pillars,scores){
    scores=scores||scoreWuxing(pillars);
    var keys=orderedPillarKeys(pillars),stems=keys.map(function(k){return pillars[k][0]}),branches=keys.map(function(k){return pillars[k][1]}),luckPosition=keys.indexOf('luck'),temporalPositions=keys.map(function(key,index){return PILLAR_META[key]&&PILLAR_META[key].temporal?index:-1}).filter(function(index){return index>=0});
    var total=WUXING.reduce(function(sum,w){return sum+(scores[w]||0)},0)||1,stemCombines=[],branchPairs=[],groups=[];
    function ratio(w){return (scores[w]||0)/total}
    function targetSupported(target,minRatio){
      var monthWx=BRANCH_WX[pillars.month[1]],targetRatio=ratio(target);
      return targetRatio>=minRatio&&(monthWx===target||gen[monthWx]===target||targetRatio>=0.4);
    }
    function relationMeta(left,right){
      var involvesLuck=left===luckPosition||right===luckPosition,involvesTemporal=temporalPositions.indexOf(left)>=0||temporalPositions.indexOf(right)>=0,distance=right-left;
      return {leftKey:keys[left],rightKey:keys[right],distance:distance,effectiveDistance:involvesTemporal?1:distance,involvesLuck:involvesLuck,involvesTemporal:involvesTemporal};
    }
    for(var i=0;i<keys.length;i++)for(var j=i+1;j<keys.length;j++){
      if(combineStem[stems[i]]===stems[j]){
        var pair=[stems[i],stems[j]].sort(function(a,b){return STEMS.indexOf(a)-STEMS.indexOf(b)}).join('');
        var target=({甲己:'土',乙庚:'金',丙辛:'水',丁壬:'木',戊癸:'火'})[pair]||'';
        stemCombines.push(Object.assign({left:i,right:j,pair:pair,target:target,ruleId:'ZP-HC-01'},relationMeta(i,j)));
      }
      if(BRANCH_CLASH[branches[i]]===branches[j])branchPairs.push(Object.assign({left:i,right:j,type:'冲',active:true,status:'相冲',priority:60,ruleId:'ZP-HC-04'},relationMeta(i,j)));
      if(BRANCH_HARM[branches[i]]===branches[j])branchPairs.push(Object.assign({left:i,right:j,type:'害',active:true,status:'相害',priority:30,ruleId:'ZP-HC-05'},relationMeta(i,j)));
      if(BRANCH_BREAK[branches[i]]===branches[j])branchPairs.push(Object.assign({left:i,right:j,type:'破',active:true,status:'相破',priority:20,ruleId:'ZP-HC-06'},relationMeta(i,j)));
      if(branchesPunish(branches[i],branches[j],branches))branchPairs.push(Object.assign({left:i,right:j,type:'刑',active:true,status:'相刑',priority:40,ruleId:'ZP-HC-05'},relationMeta(i,j)));
      var sixKey=branches[i]!==branches[j]&&Object.keys(SIX_COMBINE_TARGET).find(function(k){return k.indexOf(branches[i])>=0&&k.indexOf(branches[j])>=0});
      if(sixKey){
        var sixTarget=SIX_COMBINE_TARGET[sixKey];
        branchPairs.push(Object.assign({left:i,right:j,type:'六合',target:sixTarget,active:true,status:'待裁决',priority:50,ruleId:'ZP-HC-03'},relationMeta(i,j)));
      }
    }
    var stemUse={};
    stemCombines.filter(function(item){return item.effectiveDistance<=1}).forEach(function(item){stemUse[item.left]=(stemUse[item.left]||0)+1;stemUse[item.right]=(stemUse[item.right]||0)+1});
    stemCombines.forEach(function(item){
      item.contested=item.effectiveDistance<=1&&(stemUse[item.left]>1||stemUse[item.right]>1);
      var transform=!!(item.target&&targetSupported(item.target,0.3));
      var involvesDay=item.left===2||item.right===2;
      if(involvesDay)item.dayTransformQualification=strictDayTransformQualification(pillars.day[0],pillars,item.pair,item.target,stemCombines);
      if(item.effectiveDistance>1){item.status='隔位遥合';item.effect='clue';item.active=false}
      else if(item.contested){item.status='争合受阻';item.effect='contest';item.active=true}
      else if(transform&&(!involvesDay||item.dayTransformQualification.eligible)){item.status='合化有据';item.effect='transform';item.active=true}
      else if(involvesDay){item.status='日主合入';item.effect='daymaster-combine';item.active=true}
      else if(item.effectiveDistance===1){item.status='合绊';item.effect='bind';item.active=true}
      else{item.status='遥合';item.effect='clue';item.active=false}
      item.text=item.pair+(item.target?'化'+item.target:'')+'：'+item.status;
    });
    THREE_MEETINGS.concat(THREE_GROUPS).forEach(function(group){
      var members=group.members.split(''),present=members.filter(function(b){return branches.indexOf(b)>=0});
      var positions=keys.length>4?branches.map(function(branch,index){return members.indexOf(branch)>=0?index:-1}).filter(function(index){return index>=0}):members.map(function(b){return branches.indexOf(b)});
      var activatedByLuck=present.length===3&&members.some(function(member){return branches.slice(0,4).indexOf(member)<0})&&luckPosition>=0;
      var activatedByTemporal=present.length===3&&positions.some(function(position){return temporalPositions.indexOf(position)>=0});
      if(present.length===3){
        var supported=BRANCH_WX[pillars.month[1]]===group.element||ratio(group.element)>=0.34;
        var externalClashes=branchPairs.filter(function(item){return item.type==='冲'&&((positions.indexOf(item.left)>=0&&positions.indexOf(item.right)<0)||(positions.indexOf(item.right)>=0&&positions.indexOf(item.left)<0))});
        var status=supported?(externalClashes.length?'成局有瑕':'成局有力'):(externalClashes.length?'成局受冲':'成局待验');
        groups.push({name:group.name,members:group.members,positions:positions,element:group.element,status:status,complete:true,active:supported,challenged:externalClashes.length>0,activatedByLuck:activatedByLuck,activatedByTemporal:activatedByTemporal,involvesLuck:positions.indexOf(luckPosition)>=0,involvesTemporal:positions.some(function(position){return temporalPositions.indexOf(position)>=0}),monthSupported:BRANCH_WX[pillars.month[1]]===group.element,supportRatio:Math.round(ratio(group.element)*1000)/1000,clashes:externalClashes.map(function(item){return branches[item.left]+branches[item.right]+'冲'}),priority:/三会/.test(group.name)?80:70,ruleId:/三会/.test(group.name)?'ZP-HC-02A':'ZP-HC-02B',text:group.name+'：'+status+(externalClashes.length?'（'+externalClashes.map(function(item){return branches[item.left]+branches[item.right]+'冲'}).join('、')+'）':'')});
      }else if(present.length===2){
        var partialPositions=keys.length>4?positions:present.map(function(b){return branches.indexOf(b)});
        groups.push({name:group.name.replace('三','半'),members:group.members,positions:partialPositions,element:group.element,status:'线索',complete:false,active:false,activatedByLuck:false,activatedByTemporal:false,involvesLuck:partialPositions.indexOf(luckPosition)>=0,involvesTemporal:partialPositions.some(function(position){return temporalPositions.indexOf(position)>=0}),priority:10,ruleId:/三会/.test(group.name)?'ZP-HC-02A':'ZP-HC-02B',text:present.join('')+'见'+group.name.replace('三','半')+'线索'});
      }
    });
    var acceptedGroups=[];
    groups.filter(function(item){return item.complete&&item.active}).sort(function(a,b){
      if(b.priority!==a.priority)return b.priority-a.priority;
      if(!!b.monthSupported!==!!a.monthSupported)return b.monthSupported?1:-1;
      if(b.supportRatio!==a.supportRatio)return b.supportRatio-a.supportRatio;
      return a.name.localeCompare(b.name,'zh-CN');
    }).forEach(function(group){
      var winner=acceptedGroups.find(function(other){return (other.involvesLuck||group.involvesLuck)&&other.element!==group.element&&other.positions.some(function(position){return group.positions.indexOf(position)>=0})});
      if(winner){
        group.active=false;group.challenged=true;group.status='争局让位'+winner.name;group.suppressedByGroup=winner.name;group.text=group.name+'：'+group.status;
      }else acceptedGroups.push(group);
    });
    branchPairs.filter(function(item){return item.type==='六合'}).forEach(function(item){
      var group=groups.filter(function(groupItem){return groupItem.complete&&groupItem.active&&(groupItem.positions.indexOf(item.left)>=0||groupItem.positions.indexOf(item.right)>=0)}).sort(function(a,b){return b.priority-a.priority})[0];
      var clash=branchPairs.find(function(other){return other.type==='冲'&&(other.left===item.left||other.right===item.left||other.left===item.right||other.right===item.right)});
      var supported=targetSupported(item.target,0.3);
      if(group){item.active=false;item.effect='suppressed';item.status='让位'+group.name;item.suppressedBy=group.name}
      else if(clash){item.active=true;item.effect='bind';item.status='合中逢冲';item.blockedTransformation=true;item.resolution='冲合并见，合不解冲';clash.resolution='冲合并见，合不解冲'}
      else if(supported){item.active=true;item.effect='transform';item.status='合化倾向'}
      else{item.active=true;item.effect='bind';item.status='合绊'}
    });
    groups.filter(function(group){return group.complete&&group.active}).sort(function(a,b){return b.priority-a.priority}).forEach(function(group){
      branchPairs.filter(function(item){
        if(item.active===false||['刑','害','破'].indexOf(item.type)<0)return false;
        var leftIn=group.positions.indexOf(item.left)>=0,rightIn=group.positions.indexOf(item.right)>=0;
        return leftIn!==rightIn;
      }).forEach(function(item){
        item.active=false;
        item.status='受'+group.name+'制约';
        item.suppressedBy=group.name;
      });
    });
    branchPairs.filter(function(item){return item.type==='破'}).forEach(function(item){
      if(item.active===false)return;
      var directCombine=branchPairs.find(function(other){return other.type==='六合'&&((other.left===item.left&&other.right===item.right)||(other.left===item.right&&other.right===item.left))});
      if(directCombine&&directCombine.active&&directCombine.effect==='transform'){
        item.active=false;item.status='破受合制';item.suppressedBy=branches[directCombine.left]+branches[directCombine.right]+'六合';
      }
    });
    branchPairs.forEach(function(item){
      var pairText=branches[item.left]+branches[item.right];
      item.text=item.type==='六合'?pairText+'合'+item.target+'：'+item.status:pairText+item.type+'：'+item.status+(item.resolution?'（'+item.resolution+'）':'');
    });
    var decisions=[];
    stemCombines.filter(function(item){return item.contested}).forEach(function(item){decisions.push(item.text+'，不作专一合化')});
    groups.filter(function(item){return item.complete}).forEach(function(item){decisions.push(item.text)});
    branchPairs.filter(function(item){return item.suppressedBy||item.resolution||item.status==='合中逢冲'}).forEach(function(item){decisions.push(item.text+(item.suppressedBy&&item.status.indexOf(item.suppressedBy)<0?'，让位于'+item.suppressedBy:''))});
    var arbitration={ruleIds:['ZP-HC-01','ZP-HC-02A','ZP-HC-02B','ZP-HC-03','ZP-HC-04','ZP-HC-05','ZP-HC-06'],principles:['先核天干是否专一合化，再辨争合妒合','完整三会、三合成局优先于单一六合，半会半合只作线索','异气完整局共享同一支时先取三会、再取三合，并按得令与成势复核，其余降为争局线索','合中逢冲时保留冲合并见，不以一字之合静默解冲','刑害破只按裁决后仍有效的关系反馈根气'],decisions:unique(decisions),text:decisions.length?unique(decisions).join('；'):'未见需要改变原始关系的合冲先后裁决'};
    var dayState=stemInteractionChange(2,{stemCombines:stemCombines});
    var dayMaster={position:2,pillar:'day',stem:pillars.day[0],effect:dayState.effect,usable:dayState.effect==='daymaster-combine'||dayState.usable,receivingScope:'日主合入不等于原气已真化，受生末段另按有效合化／争合核对'};
    return {pillarKeys:keys,stems:stems,branches:branches,natalStems:stems.slice(0,4),natalBranches:branches.slice(0,4),dayMaster:dayMaster,dynamicPosition:luckPosition,dynamicPositions:temporalPositions,stemCombines:stemCombines,branchPairs:branchPairs,groups:groups,arbitration:arbitration};
  }
  function analyzeTemporalInteractions(bazi,layers){
    if(!bazi||!bazi.pillars)throw new Error('命主八字资料不完整');
    var sourceLayers=Array.isArray(layers)?layers:Object.keys(layers||{}).map(function(key){var value=layers[key];return typeof value==='string'?{key:key,gz:value}:Object.assign({key:key},value)});
    var layerMap={},pillars={year:bazi.pillars.year,month:bazi.pillars.month,day:bazi.pillars.day,hour:bazi.pillars.hour};
    sourceLayers.forEach(function(item){
      if(!item||TEMPORAL_PILLAR_KEYS.indexOf(item.key)<0||!/^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/.test(item.gz||''))return;
      pillars[item.key]=item.gz;layerMap[item.key]=item;
    });
    var temporalKeys=TEMPORAL_PILLAR_KEYS.filter(function(key){return pillars[key]});
    if(!temporalKeys.length)return {relations:[],effectiveRelations:[],suppressedRelations:[],groups:[],arbitration:{ruleIds:[],principles:[],decisions:[],text:'未提供时序干支'}};
    var raw=interactionAnalysis(pillars,scoreWuxing(pillars)),keys=raw.pillarKeys;
    function labelFor(key){
      if(layerMap[key]&&layerMap[key].label)return layerMap[key].label;
      return ({year:'原局年柱',month:'原局月柱',day:'原局日柱',hour:'原局时柱',luck:'大运',flowYear:'流年',flowMonth:'流月',flowDay:'流日'})[key]||key;
    }
    function endpoint(key){return {key:key,label:labelFor(key),gz:pillars[key],temporal:temporalKeys.indexOf(key)>=0}}
    function decoratePair(item,kind){
      var leftKey=keys[item.left],rightKey=keys[item.right],left=endpoint(leftKey),right=endpoint(rightKey),source=right.temporal?right:left,target=source===right?left:right;
      return Object.assign({},item,{kind:kind,leftEndpoint:left,rightEndpoint:right,sourceKey:source.key,sourceLabel:source.label,sourceGz:source.gz,targetKey:target.key,targetLabel:target.label,targetGz:target.gz,effective:item.active!==false&&item.effect!=='clue',suppressionReason:item.active===false?(item.suppressedBy||item.suppressedByGroup||item.status||'关系未通过裁决'):''});
    }
    function decorateGroup(item){
      var participantKeys=item.positions.map(function(position){return keys[position]}),sourceKey=participantKeys.filter(function(key){return temporalKeys.indexOf(key)>=0}).sort(function(a,b){return TEMPORAL_PILLAR_KEYS.indexOf(b)-TEMPORAL_PILLAR_KEYS.indexOf(a)})[0]||participantKeys[participantKeys.length-1];
      return Object.assign({},item,{kind:'group',participantKeys:participantKeys,participants:participantKeys.map(endpoint),sourceKey:sourceKey,sourceLabel:labelFor(sourceKey),sourceGz:pillars[sourceKey],targetKeys:participantKeys.filter(function(key){return key!==sourceKey}),effective:!!(item.complete&&item.active),suppressionReason:item.active===false&&item.complete?(item.suppressedByGroup||item.status||'完整会合未通过裁决'):''});
    }
    var stemRelations=raw.stemCombines.filter(function(item){return item.involvesTemporal}).map(function(item){return decoratePair(item,'stem-combine')});
    var branchRelations=raw.branchPairs.filter(function(item){return item.involvesTemporal}).map(function(item){return decoratePair(item,'branch-relation')});
    var groups=raw.groups.filter(function(item){return item.involvesTemporal}).map(decorateGroup);
    var relations=stemRelations.concat(branchRelations,groups),effective=relations.filter(function(item){return item.effective}),suppressed=relations.filter(function(item){return !item.effective&&(item.suppressionReason||item.suppressedBy||item.suppressedByGroup)});
    return {relations:relations,effectiveRelations:effective,suppressedRelations:suppressed,groups:groups,arbitration:raw.arbitration,pillarKeys:keys,ruleVersion:PATTERN_RULE_VERSION};
  }
  function stemInteractionChange(position,interactions){
    var relations=(interactions&&interactions.stemCombines||[]).filter(function(item){return item.active!==false&&(item.left===position||item.right===position)&&/^(transform|bind|contest|daymaster-combine)$/.test(item.effect)});
    if(!relations.length)return {effect:'none',usable:true,retention:1,target:'',relations:[]};
    var primary=relations.find(function(item){return item.effect==='contest'})||relations.find(function(item){return item.effect==='transform'})||relations.find(function(item){return item.effect==='daymaster-combine'})||relations[0];
    var retention=primary.effect==='contest'?0.35:(primary.effect==='transform'?0:0.5);
    return {effect:primary.effect,usable:false,retention:retention,target:primary.effect==='transform'?primary.target:'',relations:relations,text:relations.map(function(item){return item.text}).join('、')};
  }
  function branchInteractionChange(key,interactions,fullInteractionFeedback){
    var position=((interactions&&interactions.pillarKeys)||NATAL_PILLAR_KEYS).indexOf(key),group=branchGroupChange(key,interactions);
    if(group)return {kind:'group',effect:'transform',name:group.name,element:group.element,challenged:!!group.challenged,retention:group.challenged?0.5:0,status:group.status,relation:group};
    if(!fullInteractionFeedback||position<0)return null;
    var combines=(interactions&&interactions.branchPairs||[]).filter(function(item){return item.type==='六合'&&item.active!==false&&(item.left===position||item.right===position)&&/^(transform|bind)$/.test(item.effect)});
    if(!combines.length)return null;
    var relation=combines.find(function(item){return item.effect==='transform'})||combines[0];
    return {kind:'six-combine',effect:relation.effect,name:relation.text||'六合',element:relation.effect==='transform'?relation.target:'',challenged:!!relation.blockedTransformation,retention:relation.effect==='transform'?0:0.5,status:relation.status,relation:relation};
  }
  function effectiveWuxingScores(pillars,rawScores,interactions){
    var scores={木:rawScores.木||0,火:rawScores.火||0,土:rawScores.土||0,金:rawScores.金||0,水:rawScores.水||0},keys=orderedPillarKeys(pillars),transformedStemPositions={};
    (interactions.stemCombines||[]).filter(function(item){return item.active!==false&&item.effect==='transform'}).forEach(function(item){
      [item.left,item.right].forEach(function(position){
        if(transformedStemPositions[position])return;
        transformedStemPositions[position]=true;
        var original=STEM_WX[pillars[keys[position]][0]];
        scores[original]-=1;scores[item.target]+=1;
      });
    });
    keys.forEach(function(key){
      var change=branchInteractionChange(key,interactions,true);
      if(!change||change.effect!=='transform'||!change.element)return;
      var hidden=HIDDEN[pillars[key][1]]||[],weights=[0.7,0.25,0.15],factor=change.challenged?0.5:1,total=0;
      hidden.forEach(function(stem,index){var weight=(weights[index]||0)*factor;scores[STEM_WX[stem]]-=weight;total+=weight});
      scores[change.element]+=total;
    });
    WUXING.forEach(function(element){if(Math.abs(scores[element])<0.0000001)scores[element]=0;scores[element]=Math.max(0,scores[element])});
    return scores;
  }
  function strengthScore(dayStem,pillars,options){
    options=options||{};
    var parts=[],support=0,interactions=interactionAnalysis(pillars),dayWx=STEM_WX[dayStem],resource=resourceElement(dayWx),interactionAdjustment=0,hasLuck=!!pillars.luck,hasFlowYear=!!(options.outlookFlowYear&&pillars.flowYear),fullInteractionFeedback=hasLuck||!!options.fullInteractionFeedback,totalWeight=(hasLuck?121:100)+(hasFlowYear?21:0),weightScale=100/totalWeight;
    function add(label,weight,ratio,key,stemPosition){
      weight*=weightScale;
      var originalRatio=ratio,stemChange=fullInteractionFeedback&&stemPosition!=null?stemInteractionChange(stemPosition,interactions):null,branchChange=key?branchInteractionChange(key,interactions,fullInteractionFeedback):null;
      if(stemChange&&stemChange.effect==='transform')ratio=elementSupportRatio(dayStem,stemChange.target);
      else if(stemChange&&!stemChange.usable)ratio*=stemChange.retention;
      if(branchChange&&branchChange.effect==='transform'){
        var transformedRatio=branchChange.element===dayWx?1:(branchChange.element===resource?0.85:0),factor=branchChange.challenged?0.5:1;
        ratio=ratio*(1-factor)+transformedRatio*factor;
      }else if(branchChange&&branchChange.effect==='bind')ratio*=branchChange.retention;
      interactionAdjustment+=weight*(ratio-originalRatio);
      var attack=key?branchAttackInfo(pillars[key][1],pillars,key,interactions):{reasons:[],penalty:0};
      var adjusted=ratio*(1-attack.penalty);
      var score=weight*adjusted;
      support+=score;
      parts.push({label:label,weight:weight,score:Math.round(score*10)/10,ratio:Math.round(adjusted*100)/100,originalRatio:Math.round(originalRatio*100)/100,attacked:attack.reasons.length>0,attacks:attack.reasons,stemChange:stemChange&&stemChange.effect!=='none'?{effect:stemChange.effect,target:stemChange.target,status:stemChange.text,retention:stemChange.retention}:null,groupChange:branchChange?{kind:branchChange.kind,name:branchChange.name,element:branchChange.element,status:branchChange.status,retention:branchChange.retention,delta:Math.round(weight*(ratio-originalRatio)*10)/10}:null});
    }
    add('年干',STRENGTH_WEIGHTS.yearStem,supportRatio(dayStem,pillars.year[0]),null,0);
    add('月干',STRENGTH_WEIGHTS.monthStem,supportRatio(dayStem,pillars.month[0]),null,1);
    add('时干',STRENGTH_WEIGHTS.hourStem,supportRatio(dayStem,pillars.hour[0]),null,3);
    add('年支',STRENGTH_WEIGHTS.yearBranch,branchSupportRatio(dayStem,pillars.year[1]),'year');
    add('月令',STRENGTH_WEIGHTS.monthBranch,branchSupportRatio(dayStem,pillars.month[1]),'month');
    add('日支',STRENGTH_WEIGHTS.dayBranch,branchSupportRatio(dayStem,pillars.day[1]),'day');
    add('时支',STRENGTH_WEIGHTS.hourBranch,branchSupportRatio(dayStem,pillars.hour[1]),'hour');
    if(hasLuck){
      add('运干',STRENGTH_WEIGHTS.luckStem,supportRatio(dayStem,pillars.luck[0]),null,4);
      add('运支',STRENGTH_WEIGHTS.luckBranch,branchSupportRatio(dayStem,pillars.luck[1]),'luck');
    }
    if(hasFlowYear){
      add('流年干',STRENGTH_WEIGHTS.luckStem,supportRatio(dayStem,pillars.flowYear[0]),null,5);
      add('流年支',STRENGTH_WEIGHTS.luckBranch,branchSupportRatio(dayStem,pillars.flowYear[1]),'flowYear');
    }
    var command=parts.find(function(x){return x.label==='月令'}),roots=rootEvidence(dayStem,pillars,interactions,{fullInteractionFeedback:fullInteractionFeedback});
    var rootScore=parts.filter(function(x){return /支|月令/.test(x.label)&&x.label!=='月令'}).reduce(function(sum,x){return sum+x.score},0);
    var momentum=parts.filter(function(x){return /干/.test(x.label)}).reduce(function(sum,x){return sum+x.score},0);
    var rootState=!roots.length?'未见同类根气':(roots.some(function(x){return x.transformedAway})?'原根随合会变气':(roots.some(function(x){return x.attacked})?'有根但受冲刑害破':'根气可用'));
    var momentumState=momentum>=10?'天干印比帮扶有力':(momentum>0?'天干印比有助，但助力有限':'天干未见印比相助');
    var evidence=[
      '得令：'+(command.score>=20?'得令有力':(command.score>0?'月令有生扶':'月令不扶')),
      '得地：'+rootState+(roots.length?'（'+roots.map(function(x){return x.text}).join('、')+'）':''),
      '得势：'+momentumState+(interactionAdjustment?'；合会变气反馈'+(interactionAdjustment>0?'+':'')+Math.round(interactionAdjustment*10)/10:'')
    ];
    var commander=humanCommander(pillars.month[1],options.time),commanderElement=commander&&STEM_WX[commander.stem],seasonSupported=!!commander&&(commanderElement===dayWx||commanderElement===resource);
    var seasonal={available:!!commander,commander:commander&&commander.stem||'',elapsedDays:commander&&commander.elapsedDays,source:'项目采用的人元分野表（各家分日有异，不视为唯一古法）',method:commander&&commander.method||'缺少可对照的出生日期，未计算月内司令',effect:commander?(seasonSupported?'司令生扶日主':'司令不直接生扶日主'):'月内深浅未知',evidence:commander?['节后'+commander.elapsedDays+'日，'+commander.stem+'司令',commander.stem+'属'+commanderElement+'，'+(seasonSupported?'提供得时依据，但不抵消泄耗制或根损':'其职责须结合印比及泄耗制判断')]:[],missing:commander?[]:['可靠出生日期与时刻']};
    var value=Math.round(Math.max(0,Math.min(100,support))*10)/10,tendency=strengthBand(value),conflicts=[];
    if(value<42&&seasonSupported)conflicts.push('扶身指数偏弱，但当前司令提供生扶；不能把低指数等同完全失时无根');
    if(value>=55&&commander&&!seasonSupported)conflicts.push('扶身指数偏强，但司令不直接生扶；须辨根气与泄耗制是否形成出口');
    if(roots.some(function(x){return x.attacked||x.transformedAway}))conflicts.push('有效根气须按合冲裁决后的结果使用');
    // The numeric inventory is kept reproducible. Seasonal evidence is not an
    // uncalibrated bonus; it enters the separate task/route conditions below.
    var summary='固定比例扶身指数'+value+'，倾向'+tendency+'；'+seasonal.effect+'；'+rootState+'；'+momentumState+(conflicts.length?'。'+conflicts.join('；'):'');
    evidence=evidence.concat(seasonal.evidence.length?seasonal.evidence:['月内司令：缺少时间证据，不以月支本气冒充司令']);
    var confidence=!commander||conflicts.length?'中':'高';
    return {support:value,total:100,method:'固定比例扶身指标，不是五行物理能量或完整旺衰真值',seasonal:seasonal,assessment:{tendency:tendency,summary:summary,conflicts:conflicts,method:'指数、司令、有效根及透干分层；承载按具体任务判断'},scope:hasFlowYear?'大运与流年第五、六柱':(hasLuck?'当前大运第五柱':'原局四柱'),temporalPillar:hasFlowYear?'luck+flowYear':(hasLuck?'luck':''),parts:parts,dimensions:{command:{score:command.score,max:Math.round(STRENGTH_WEIGHTS.monthBranch*weightScale*10)/10},roots:{score:Math.round(rootScore*10)/10,items:roots},momentum:{score:Math.round(momentum*10)/10,interactionAdjustment:Math.round(interactionAdjustment*10)/10}},interactions:interactions,confidence:confidence,evidence:evidence};
  }
  function strengthBand(value){return value>=65?'强':value>=55?'偏强':value>=42?'中和':value>=30?'偏弱':'弱'}
  function assessStrength(dayStem,pillarsOrMonthBranch,scores,options){
    if(pillarsOrMonthBranch&&typeof pillarsOrMonthBranch==='object'&&pillarsOrMonthBranch.month){
      var weighted=strengthScore(dayStem,pillarsOrMonthBranch,options),value=weighted.support;
      return strengthBand(value);
    }
    var monthBranch=pillarsOrMonthBranch;
    var dayWx=STEM_WX[dayStem],resource=Object.keys(gen).find(function(k){return gen[k]===dayWx});
    var total=WUXING.reduce(function(sum,w){return sum+(scores[w]||0)},0)||1;
    var value=((scores[dayWx]||0)+(scores[resource]||0)*0.75)/total;
    if(BRANCH_WX[monthBranch]===dayWx)value+=0.12;
    if(BRANCH_WX[monthBranch]===resource)value+=0.08;
    if(value>=0.55)return '偏强';
    if(value>=0.43)return '中和偏强';
    if(value>=0.34)return '中和';
    if(value>=0.26)return '偏弱';
    return '弱';
  }
  function carryingCapacityFeedback(strength,weightedStrength,profiles,pillars){
    var roots=weightedStrength&&weightedStrength.dimensions&&weightedStrength.dimensions.roots.items||[];
    var usableRoots=roots.filter(function(item){return item.usable!==false&&!item.transformedAway}),cleanRoots=usableRoots.filter(function(item){return !item.attacked&&!item.changedByGroup}),partialRoots=usableRoots.filter(function(item){return item.attacked||item.changedByGroup}),rootPower=usableRoots.reduce(function(sum,item){return sum+(item.rootPower||0)},0),exactRootPower=usableRoots.filter(function(item){return item.exactStem}).reduce(function(sum,item){return sum+(item.rootPower||0)},0);
    var damagedRoots=roots.filter(function(item){return item.usable===false||item.transformedAway||item.attacked});
    var support=weightedStrength&&weightedStrength.support||0,weak=/弱/.test(strength),canCarry=!weak||exactRootPower>=1.4||(rootPower>=1.4&&support>=30);
    var reasons=[];
    if(cleanRoots.length)reasons.push('可用根气'+cleanRoots.map(function(item){return item.text}).join('、'));
    if(partialRoots.length)reasons.push('折损后尚存根力'+partialRoots.map(function(item){return item.text}).join('、'));
    if(!usableRoots.length)reasons.push('未见可直接承载的日主根气');
    var lostRoots=damagedRoots.filter(function(item){return item.usable===false||item.transformedAway});
    if(lostRoots.length)reasons.push('失用根气'+lostRoots.map(function(item){return item.text}).join('、'));
    reasons.push('扶身权重'+support);
    profiles=profiles||{};
    function force(names){return names.reduce(function(sum,name){var p=profiles[name]||{};return sum+(p.revealed||0)+(p.rootPower||0)+(p.monthCommand?1:0)},0)}
    var seal=force(['正印','偏印']),peer=force(['比肩','劫财']),wealth=force(['正财','偏财']),output=force(['食神','伤官']),officer=force(['正官','七杀']),seasonal=weightedStrength&&weightedStrength.seasonal||{},seasonSupported=seasonal.available&&seasonal.effect==='司令生扶日主';
    var taskProfiles=Object.assign({},profiles);
    if(pillars)taskProfiles['日主']={stemEntries:[{position:2,pillar:'day',stem:pillars.day[0],usable:true}]};
    function reaches(chains){return interactionFlowAnalysis('',taskProfiles,weightedStrength.interactions||{},[],chains).steps.every(function(step){return step.active})}
    var supportedAtDay=reaches([{from:['正印','偏印','比肩','劫财'],to:['日主'],action:'扶'}]);
    var sealTakesOfficer=reaches([{from:['正官','七杀'],to:['正印','偏印'],action:'生'},{from:['正印','偏印'],to:['日主'],action:'生'}]);
    var foodControlsOfficer=reaches([{from:['食神'],to:['七杀'],action:'制'}]);
    function task(id,load,mitigation,restriction){
      var conditions=[{id:'effective-root',passed:usableRoots.length>0,evidence:'有效同类根力'+Math.round(rootPower*100)/100},{id:'season-or-support',passed:!weak||seasonSupported||seal+peer>0,evidence:seasonal.effect||'月内深浅未知'},{id:id+'-outlet',passed:mitigation,evidence:restriction},{id:'strict-formation-gate',passed:canCarry,evidence:'保留旧保守成格入口；数值参数不代表现实能力'}];
      var supported=canCarry&&mitigation,status=supported?'supported':((usableRoots.length>0&&(seasonSupported||seal+peer>0))||mitigation?'conditional':'limited');
      return {status:status,load:load,conditions:conditions,evidence:conditions.map(function(c){return c.evidence}),restrictions:supported?[]:[restriction,'局部有作用不等于完整组合成格'],strictFormationEligible:supported};
    }
    var tasks={wealth:task('wealth',wealth,supportedAtDay||!weak,'任财须有可达印比承接；财是否转生过重官杀另验'),output:task('output',output,supportedAtDay||!weak,'承泄须有可达根源补充，食伤已有过重时不能再增'),officer:task('officer',officer,sealTakesOfficer||foodControlsOfficer||(!weak&&usableRoots.length>0),'任官杀须有可达印化或食制，十神数量之比不能代替制化')};
    return {ruleId:'ZP-CAP-02',ruleVersion:PATTERN_RULE_VERSION,canCarryWealth:canCarry,canCarryOutputKill:canCarry,strictFormationEligible:canCarry,tasks:tasks,engineeringBoundary:'1.4 根力与扶身指数门槛仅是严格成格的工程保守入口，不是命中不能承财或现实收入结论',usableRootCount:usableRoots.length,usableRootPower:Math.round(rootPower*100)/100,exactRootPower:Math.round(exactRootPower*100)/100,damagedRootCount:damagedRoots.length,support:support,status:canCarry?'严格成格承载入口通过':'严格成格承载入口未通过，局部作用另论',text:(canCarry?'保守成格入口通过，任财、承泄、任官杀仍须分别核对作用条件':'保守成格入口未通过，不据此否认局部通关、调候或得时作用')+'；'+reasons.join('；')+'；'+(seasonal.effect||'月内深浅未知')};
  }
  function unique(arr){
    return (arr||[]).filter(function(x,i,a){return x&&a.indexOf(x)===i});
  }
  function resourceElement(dayWx){return Object.keys(gen).find(function(k){return gen[k]===dayWx})}
  function officerElement(dayWx){return Object.keys(ctrl).find(function(k){return ctrl[k]===dayWx})}
  function godNamesForElement(dayStem,element){
    return unique(STEMS.filter(function(s){return STEM_WX[s]===element}).map(function(s){return tenGod(dayStem,s)}));
  }
  function usefulRole(dayStem,elements){
    elements=unique(elements||[]);
    return {elements:elements,tenGods:unique(elements.reduce(function(out,w){return out.concat(godNamesForElement(dayStem,w))},[]))};
  }
  function exactUsefulRole(dayStem,elements,gods){
    var role=usefulRole(dayStem,elements);
    role.tenGods=unique(gods||role.tenGods);
    return role;
  }
  function buildUsefulRoles(dayStem,primary,secondary,avoid,context){
    context=context||{};
    var tiaohou=context.tiaohou||{},pattern=context.pattern||{},fuyi=context.fuyi||{};
    var monthStem=context.monthCommandStem||(HIDDEN[context.monthBranch]||[])[0],monthElement=STEM_WX[monthStem],monthGod=context.monthGod||(monthStem?tenGod(dayStem,monthStem):'');
    var use=primary.slice(),patternUse=unique(pattern.use||[]),assistant=[];
    var joy=unique(secondary).filter(function(w){return use.indexOf(w)<0&&assistant.indexOf(w)<0});
    var enemy=[];
    if(avoid.length){
      var source=resourceElement(avoid[0]);
      if(source&&use.indexOf(source)<0&&assistant.indexOf(source)<0&&joy.indexOf(source)<0)enemy.push(source);
    }
    var finalUse=usefulRole(dayStem,use);
    return {
      monthCommandGod:exactUsefulRole(dayStem,monthElement?[monthElement]:[],monthGod?[monthGod]:[]),
      patternGod:usefulRole(dayStem,patternUse),
      assistantGod:usefulRole(dayStem,assistant),
      balanceGod:usefulRole(dayStem,fuyi.use||[]),
      climateGod:usefulRole(dayStem,tiaohou.use||[]),
      finalUseGod:finalUse,
      joyGod:usefulRole(dayStem,joy),
      avoidGod:usefulRole(dayStem,avoid),
      enemyGod:usefulRole(dayStem,enemy),
      useGod:finalUse
    };
  }
  function seasonTune(dayStem,monthBranch,scores,pillars,interactions){
    scores=scores||{};
    var total=WUXING.reduce(function(sum,w){return sum+(scores[w]||0)},0)||1;
    function ratio(w){return (scores[w]||0)/total}
    var dayWx=STEM_WX[dayStem],result={use:[],avoid:[],priority:'参考',condition:'未见明显寒暖燥湿偏枯',why:'调候不作首要。'};
    if('亥子丑'.indexOf(monthBranch)>=0){
      var cold=ratio('水')>=0.35&&ratio('火')<0.16;
      result={use:['火','木'],avoid:cold?['水']:[],priority:cold?'主用':'参考',condition:cold?'水旺火弱，寒湿偏重':'冬令但原局仍见暖气',why:(cold?'寒湿已成偏枯，火为调候需要，木作火源。':'冬令火木仅作季节参考，未见明显偏枯时不自动增列喜忌。')};
    }else if('巳午未'.indexOf(monthBranch)>=0){
      var hot=ratio('火')>=0.35&&ratio('水')<0.12;
      result={use:['水','金'],avoid:hot?['火']:[],priority:hot?'主用':'参考',condition:hot?'火旺水弱，燥热偏重':'夏令但原局仍有润气',why:(hot?'燥热已成偏枯，水为调候需要，金作水源。':'夏令水金仅作季节参考，原局已有润气时不自动增水、忌火。')};
    }else if('申酉戌'.indexOf(monthBranch)>=0){
      var dry=ratio('金')>=0.28&&ratio('水')<0.12;
      result={use:dry?['水','火']:[],avoid:dry?['金']:[],priority:dry?'佐用':'参考',condition:dry?'金旺水弱，燥气明显':'秋令燥气未成偏枯',why:dry?'秋燥明显，以水润燥、火制金为调候辅助，是否可用仍看结构。':'秋令未见燥气偏枯，不凭季节固定增列喜忌。'};
    }else if('寅卯辰'.indexOf(monthBranch)>=0){
      var damp=ratio('木')>=0.3&&ratio('火')<0.12;
      result={use:damp?['火','土']:[],avoid:damp?['木']:[],priority:damp?'佐用':'参考',condition:damp?'木旺火弱，湿滞不化':'春令生发尚能流通',why:damp?'春木湿滞，取火发荣、土承载为调候辅助，是否可用仍看结构。':'春令未见湿滞偏枯，不凭季节固定增列喜忌。'};
    }
    var candidate=result.priority==='主用',counterElement='亥子丑'.indexOf(monthBranch)>=0?'火':'水',counterUsable=false;
    if(pillars){
      var keys=orderedPillarKeys(pillars);
      var visible=keys.some(function(key){var state=interactions&&stemInteractionChange(PILLAR_META[key].index,interactions);return STEM_WX[pillars[key][0]]===counterElement&&(!state||state.usable!==false)});
      var rooted=keys.some(function(key){
        var change=interactions&&branchInteractionChange(key,interactions,true),attack=branchAttackInfo(pillars[key][1],pillars,key,interactions);
        return (HIDDEN[pillars[key][1]]||[]).some(function(stem){return STEM_WX[stem]===counterElement})&&!(change&&change.effect==='transform'&&change.element!==counterElement&&!change.challenged)&&attack.reasons.indexOf('冲')<0;
      });
      counterUsable=visible&&rooted;
    }
    result.qualification={ratioCandidate:candidate,season:monthBranch,counterElement:counterElement,counterUsable:counterUsable,requiresNatalContext:true,engineeringBoundary:'比例仅筛选候选；有效暖润根透为反证，不是现实气温或能量测量'};
    if(candidate&&(!pillars||counterUsable)){
      result.priority='参考';result.avoid=[];
      result.condition+='；'+(pillars?counterElement+'有可用根透，不作极端偏枯':'缺少干支作用证据，不能只按比例提升优先级');
      result.why='仅保留季节需求；比例候选未通过极端偏枯反证排除，不覆盖结构取用。';
    }
    return result;
  }
  function earthBuriedMetalPhenomenon(dayStem,pillars,scores,strength,weightedStrength){
    var out=[],rule=PHENOMENON_RULES.earthBuriedMetal,dayWx=STEM_WX[dayStem];
    if(dayWx!=='金')return out;
    scores=scores||scoreWuxing(pillars);
    var total=WUXING.reduce(function(sum,w){return sum+(scores[w]||0)},0)||1;
    var earth=(scores['土']||0),metal=(scores['金']||0),water=(scores['水']||0),wood=(scores['木']||0);
    var earthRatio=earth/total,metalRatio=metal/total,earthMetalRatio=metal?earth/metal:99;
    var keys=orderedPillarKeys(pillars),visibleKeys=visiblePillarKeys(pillars),stemLabels={year:'年干',month:'月干',hour:'时干',luck:'运干'},branchLabels={year:'年支',month:'月支',day:'日支',hour:'时支',luck:'运支'};
    var earthStems=visibleKeys.filter(function(k){return STEM_WX[pillars[k][0]]==='土'});
    var earthBranches=keys.filter(function(k){return BRANCH_WX[pillars[k][1]]==='土'});
    var waterStems=visibleKeys.filter(function(k){return STEM_WX[pillars[k][0]]==='水'});
    var woodStems=visibleKeys.filter(function(k){return STEM_WX[pillars[k][0]]==='木'});
    var roots=weightedStrength&&weightedStrength.dimensions&&weightedStrength.dimensions.roots.items||rootEvidence(dayStem,pillars);
    var usableRoot=roots.some(function(item){return item.usable!==false&&!item.transformedAway&&(item.rootPower||0)>0&&item.grade!=='余气根'});
    var constrainedRoot=!usableRoot;
    var seasonElement=BRANCH_WX[pillars.month[1]],seasonFeedsEarth=seasonElement==='火'||seasonElement==='土';
    var supportedEarth=earthStems.length>=1||earthBranches.length>=2;
    var qualifies=earthRatio>=0.42&&metalRatio<=0.2&&earthMetalRatio>=2.5&&constrainedRoot&&supportedEarth&&(seasonFeedsEarth||earthRatio>=0.48);
    if(!qualifies)return out;
    var severe=earthRatio>=0.62&&earthMetalRatio>=3.5&&!usableRoot&&!waterStems.length&&!woodStems.length;
    var obvious=earthRatio>=0.44&&earthMetalRatio>=2.8;
    var evidence=[
      '土约占全局'+Math.round(earthRatio*100)+'%，金约占'+Math.round(metalRatio*100)+'%，土势约为金的'+Math.round(earthMetalRatio*10)/10+'倍',
      (earthStems.length?'土在'+earthStems.map(function(k){return stemLabels[k]+pillars[k][0]}).join('、')+'透出':'土虽未透干')+'，'+(earthBranches.length?earthBranches.map(function(k){return branchLabels[k]+pillars[k][1]}).join('、')+'增土':'地支土气有限'),
      seasonFeedsEarth?pillars.month[1]+'月'+seasonElement+'气生扶或助旺土势':'月令未直接助土，但全局土势仍过重',
      dayStem+'金日主'+strength+'，'+(roots.length?roots.map(function(item){return item.text}).join('、'):'未见直接根气')
    ];
    var counterEvidence=[];
    if(roots.length)counterEvidence.push(dayStem+'金仍见'+roots.map(function(item){return item.text}).join('、'));
    if(waterStems.length)counterEvidence.push(waterStems.map(function(k){return pillars[k][0]+'水透'+stemLabels[k]}).join('、')+'，泄秀通道未绝');
    else if(water/total>=0.14)counterEvidence.push('原局水气尚存，可作润泄线索');
    if(woodStems.length)counterEvidence.push(woodStems.map(function(k){return pillars[k][0]+'木透'+stemLabels[k]}).join('、')+'，有疏土线索');
    if(!counterEvidence.length)counterEvidence.push('未见有力金根、透水泄秀或透木疏土的直接反证');
    var waterUsable=(waterStems.length||water/total>=0.14)&&strength!=='弱';
    var degree=phenomenonDegree(
      severe,
      obvious,
      counterEvidence,
      '土势占比与土金差距均极大，金无可用强根，也未见直接泄疏。',
      '土势明显压过金，月令或透藏继续助土，金根承载受限。',
      '土势已达到病象门槛，但金仍保留一定根透或泄疏条件。'
    );
    var confidence=counterEvidence.length>1?'中':'高';
    var behaviorProfile={
      scene:'任务边界不清、缺少外部截止时间时',
      trigger:'印土过重、金弱且泄秀不畅',
      observable:'较可能偏静内收、启动较慢，容易停留在准备、休息或停顿阶段',
      counterCondition:'目标明确、外部节奏稳定，或金水承接有效时，该倾向会减弱',
      confidence:confidence
    };
    out.push({
      ruleId:rule.id,
      ruleVersion:PATTERN_RULE_VERSION,
      name:rule.name,
      canonicalName:rule.name,
      aliases:rule.aliases.slice(),
      category:rule.category,
      termType:'五行气象与偏枯病象',
      sourceSystem:'结构诊断与校正层',
      scope:'只校正气势、喜用和层次，不作为正式命格名称',
      authority:rule.authority,
      definition:rule.definition,
      status:degree.status,
      severity:degree.severity,
      severityRank:degree.rank,
      severityBasis:degree.basis,
      degreeBoundary:degree.boundary,
      confidence:confidence,
      target:{element:'金',role:'日主本体',domains:['行动启动','表达输出','休息恢复']},
      evidence:evidence,
      counterEvidence:counterEvidence,
      conclusion:rule.name+'（'+degree.status+'）'+(severe?'，金气受困较重。':'，但仍有反证，不作完全埋没论。'),
      behavior:'缺少明确目标或外部节奏时，较可能偏静内收、启动较慢，容易停留在准备、休息或停顿阶段；这属于行为倾向，不等同懒惰或嗜睡。',
      behaviorProfile:behaviorProfile,
      activation:'金得根透可增强承载；水有根透可润泄；木能疏土但须先校验日主能否任财。',
      causalChain:[seasonFeedsEarth?'火土得势':'土势集中','印土过重',rule.name,'泄秀受阻'],
      useCorrection:{primary:['金'],secondary:waterUsable?['水']:[],restrain:['土'],conditional:['木'],avoid:['火']}
    });
    return out;
  }
  function resourceExcessPhenomenon(dayStem,pillars,scores,strength,weightedStrength){
    var dayWx=STEM_WX[dayStem],rule=Object.keys(PHENOMENON_RULES).map(function(key){return PHENOMENON_RULES[key]}).find(function(item){return item.type==='resourceExcess'&&item.target===dayWx&&item.id!=='ZP-QX-001'});
    if(!rule)return [];
    scores=scores||scoreWuxing(pillars);
    var total=WUXING.reduce(function(sum,w){return sum+(scores[w]||0)},0)||1;
    var targetScore=scores[rule.target]||0,excessScore=scores[rule.excess]||0;
    var targetRatio=targetScore/total,excessRatio=excessScore/total,excessTargetRatio=targetScore?excessScore/targetScore:99;
    var keys=orderedPillarKeys(pillars),visibleKeys=visiblePillarKeys(pillars),labels={year:'年',month:'月',day:'日',hour:'时',luck:'运'};
    var excessStems=visibleKeys.filter(function(k){return STEM_WX[pillars[k][0]]===rule.excess});
    var excessBranches=keys.filter(function(k){return BRANCH_WX[pillars[k][1]]===rule.excess});
    var peerStems=visibleKeys.filter(function(k){return STEM_WX[pillars[k][0]]===rule.target});
    var roots=weightedStrength&&weightedStrength.dimensions&&weightedStrength.dimensions.roots.items||rootEvidence(dayStem,pillars);
    var usableRoot=roots.some(function(item){return item.usable!==false&&!item.transformedAway&&(item.rootPower||0)>0&&item.grade!=='余气根'});
    var mainRoot=roots.some(function(item){return item.usable!==false&&!item.transformedAway&&(item.rootPower||0)>0&&item.grade==='本气根'});
    var seasonElement=BRANCH_WX[pillars.month[1]],seasonSupportsExcess=seasonElement===rule.excess;
    var weakByEvidence=/弱/.test(strength)||targetRatio<=0.24;
    var supportedExcess=excessStems.length>=1||excessBranches.length>=2;
    var qualifies=excessRatio>=0.4&&targetRatio<=0.24&&excessTargetRatio>=2.2&&!mainRoot&&supportedExcess&&weakByEvidence&&(seasonSupportsExcess||excessRatio>=0.5);
    if(!qualifies)return [];
    var severe=excessRatio>=0.62&&excessTargetRatio>=3.5&&!usableRoot&&!peerStems.length;
    var obvious=excessRatio>=0.47&&excessTargetRatio>=2.7;
    var evidence=[
      rule.excess+'约占全局'+Math.round(excessRatio*100)+'%，'+rule.target+'约占'+Math.round(targetRatio*100)+'%，'+rule.excess+'势约为'+rule.target+'的'+Math.round(excessTargetRatio*10)/10+'倍',
      (excessStems.length?rule.excess+'在'+excessStems.map(function(k){return labels[k]+'干'+pillars[k][0]}).join('、')+'透出':rule.excess+'虽未透干')+'，'+(excessBranches.length?excessBranches.map(function(k){return labels[k]+'支'+pillars[k][1]}).join('、')+'得地':'地支根气有限'),
      seasonSupportsExcess?pillars.month[1]+'月'+rule.excess+'气当令或得势':'月令不直接取'+rule.excess+'，但全局'+rule.excess+'势已达门槛',
      dayStem+rule.target+'日主'+strength+'，'+(roots.length?roots.map(function(item){return item.text}).join('、'):'未见直接根气')
    ];
    var counterEvidence=[];
    if(roots.length)counterEvidence.push(dayStem+rule.target+'仍见'+roots.map(function(item){return item.text}).join('、'));
    if(peerStems.length)counterEvidence.push(peerStems.map(function(k){return pillars[k][0]+rule.target+'透'+labels[k]+'干'}).join('、')+'，仍有比劫承接');
    if(!counterEvidence.length)counterEvidence.push('未见有力本根或比劫透干的直接反证');
    var degree=phenomenonDegree(
      severe,
      obvious,
      counterEvidence,
      rule.excess+'势占比与生扶差距均极大，'+rule.target+'无可用强根和比劫承接。',
      rule.excess+'势明显压过'+rule.target+'，月令或透藏继续助旺印气，日主承载受限。',
      rule.excess+'势已达到病象门槛，但'+rule.target+'仍保留一定根透承接。'
    );
    var confidence=counterEvidence.length>1?'中':'高',output=gen[rule.target],wealth=ctrl[rule.target];
    var behaviorProfile={
      scene:rule.excess+'气持续增加而'+rule.target+'缺少明确出口时',
      trigger:'印星过重、日主偏弱且无本气根承接',
      observable:rule.behavior,
      counterCondition:rule.target+'得本气根或比劫透出，并建立明确输出与落点时，该倾向会减弱',
      confidence:confidence
    };
    return [{
      ruleId:rule.id,ruleVersion:PATTERN_RULE_VERSION,name:rule.name,canonicalName:rule.name,aliases:rule.aliases.slice(),category:rule.category,authority:rule.authority,definition:rule.definition,
      termType:'五行气象与偏枯病象',sourceSystem:'结构诊断与校正层',scope:'只校正气势、喜用和层次，不作为正式命格名称',
      status:degree.status,severity:degree.severity,severityRank:degree.rank,severityBasis:degree.basis,degreeBoundary:degree.boundary,confidence:confidence,
      target:{element:rule.target,role:'日主本体',domains:['行动启动','稳定承载','方向落实']},evidence:evidence,counterEvidence:counterEvidence,
      conclusion:rule.name+'（'+degree.status+'）'+(severe?'，生扶反成壅滞较重。':'，但仍有反证，不作完全受困论。'),
      behavior:rule.behavior+' 这属于条件性行为倾向，不等同固定性格或健康诊断。',behaviorProfile:behaviorProfile,
      activation:rule.target+'得根透先增强承载；'+output+'作出口须防再泄弱身；'+wealth+'可制过量'+rule.excess+'，但须先校验日主能否任财。',
      causalChain:[rule.excess+'印星成势','生扶太过',rule.name,rule.target+'气受壅'],
      useCorrection:{primary:[rule.target],secondary:!/弱/.test(strength)?[output]:[],restrain:[rule.excess],conditional:[wealth],avoid:[rule.excess]}
    }];
  }
  function elementPhenomenaAnalysis(dayStem,pillars,scores,strength,weightedStrength,specials){
    if(trueSpecialPattern(specials))return [];
    var out=earthBuriedMetalPhenomenon(dayStem,pillars,scores,strength,weightedStrength).concat(resourceExcessPhenomenon(dayStem,pillars,scores,strength,weightedStrength));
    var dayWx=STEM_WX[dayStem],rule=Object.keys(PHENOMENON_RULES).map(function(key){return PHENOMENON_RULES[key]}).find(function(item){return item.type==='outputExcess'&&item.target===dayWx});
    if(!rule)return out;
    scores=scores||scoreWuxing(pillars);
    var total=WUXING.reduce(function(sum,w){return sum+(scores[w]||0)},0)||1;
    var targetScore=scores[rule.target]||0,excessScore=scores[rule.excess]||0;
    var targetRatio=targetScore/total,excessRatio=excessScore/total,excessTargetRatio=targetScore?excessScore/targetScore:99;
    var keys=orderedPillarKeys(pillars),visibleKeys=visiblePillarKeys(pillars);
    var excessStems=visibleKeys.filter(function(k){return STEM_WX[pillars[k][0]]===rule.excess});
    var excessBranches=keys.filter(function(k){return BRANCH_WX[pillars[k][1]]===rule.excess});
    var peerStems=visibleKeys.filter(function(k){return STEM_WX[pillars[k][0]]===rule.target});
    var resource=resourceElement(rule.target),resourceStems=visibleKeys.filter(function(k){return STEM_WX[pillars[k][0]]===resource});
    var roots=weightedStrength&&weightedStrength.dimensions&&weightedStrength.dimensions.roots.items||rootEvidence(dayStem,pillars);
    var usableRoot=roots.some(function(item){return item.usable!==false&&!item.transformedAway&&(item.rootPower||0)>0&&item.grade!=='余气根'}),constrainedRoot=!usableRoot;
    var seasonElement=BRANCH_WX[pillars.month[1]],seasonSupportsExcess=seasonElement===rule.excess;
    var supportedExcess=excessStems.length>=1||excessBranches.length>=2;
    var weakByEvidence=/弱/.test(strength)||targetRatio<=0.16;
    var qualifies=excessRatio>=0.42&&targetRatio<=0.23&&excessTargetRatio>=2.4&&constrainedRoot&&supportedExcess&&weakByEvidence&&(seasonSupportsExcess||excessRatio>=0.52);
    if(!qualifies)return out;
    var severe=excessRatio>=0.62&&excessTargetRatio>=3.5&&!usableRoot&&!peerStems.length;
    var obvious=excessRatio>=0.48&&excessTargetRatio>=2.8;
    var labels={year:'年',month:'月',day:'日',hour:'时',luck:'运'};
    var evidence=[
      rule.excess+'约占全局'+Math.round(excessRatio*100)+'%，'+rule.target+'约占'+Math.round(targetRatio*100)+'%，'+rule.excess+'势约为'+rule.target+'的'+Math.round(excessTargetRatio*10)/10+'倍',
      (excessStems.length?rule.excess+'在'+excessStems.map(function(k){return labels[k]+'干'+pillars[k][0]}).join('、')+'透出':rule.excess+'虽未透干')+'，'+(excessBranches.length?excessBranches.map(function(k){return labels[k]+'支'+pillars[k][1]}).join('、')+'得地':'地支根气有限'),
      seasonSupportsExcess?pillars.month[1]+'月'+rule.excess+'气当令或得势':'月令不直接取'+rule.excess+'，但全局'+rule.excess+'势已达门槛',
      dayStem+rule.target+'日主'+strength+'，'+(roots.length?roots.map(function(item){return item.text}).join('、'):'未见直接根气')
    ];
    if(rule.name==='土多火晦'){
      var wetEarth=keys.filter(function(k){return '辰丑'.indexOf(pillars[k][1])>=0}),dryEarth=keys.filter(function(k){return '未戌'.indexOf(pillars[k][1])>=0});
      evidence.push(wetEarth.length?'辰丑湿土见'+wetEarth.length+'处，兼有敛火晦光':'未见辰丑湿土，主要按土重泄火判断'+(dryEarth.length?'，另见未戌燥土'+dryEarth.length+'处':''));
    }
    var counterEvidence=[];
    if(roots.length)counterEvidence.push(dayStem+rule.target+'仍见'+roots.map(function(item){return item.text}).join('、'));
    if(peerStems.length)counterEvidence.push(peerStems.map(function(k){return pillars[k][0]+rule.target+'透'+labels[k]+'干'}).join('、')+'，仍有比劫承接');
    if(resourceStems.length)counterEvidence.push(resourceStems.map(function(k){return pillars[k][0]+resource+'透'+labels[k]+'干'}).join('、')+'，仍有印星补充');
    if(!counterEvidence.length)counterEvidence.push('未见有力本根、比劫透干或印星透干的直接反证');
    var degree=phenomenonDegree(
      severe,
      obvious,
      counterEvidence,
      rule.excess+'势占比与泄耗差距均极大，'+rule.target+'无可用强根和比劫承接。',
      rule.excess+'势明显压过'+rule.target+'，月令或透藏继续助泄，日主承载受限。',
      rule.excess+'势已达到病象门槛，但'+rule.target+'仍保留一定根透或印比承接。'
    );
    var confidence=counterEvidence.length>1?'中':'高';
    var behaviorProfile={
      scene:rule.excess+'气持续成势、事务或输出缺少边界时',
      trigger:rule.excess+'过旺、'+rule.target+'弱而根透承接不足',
      observable:rule.behavior,
      counterCondition:resource+'或'+rule.target+'得根透，且任务节奏清楚时，该倾向会减弱',
      confidence:confidence
    };
    out.push({
      ruleId:rule.id,ruleVersion:PATTERN_RULE_VERSION,name:rule.name,canonicalName:rule.name,aliases:rule.aliases.slice(),category:rule.category,authority:rule.authority,definition:rule.definition,
      termType:'五行气象与偏枯病象',sourceSystem:'结构诊断与校正层',scope:'只校正气势、喜用和层次，不作为正式命格名称',
      status:degree.status,severity:degree.severity,severityRank:degree.rank,severityBasis:degree.basis,degreeBoundary:degree.boundary,confidence:confidence,
      target:{element:rule.target,role:'日主本体',domains:['持续执行','表达输出','休息恢复']},
      evidence:evidence,counterEvidence:counterEvidence,
      conclusion:rule.name+'（'+degree.status+'）'+(severe?'，'+rule.target+'气泄耗较重。':'，但仍有反证，不作完全受损论。'),
      behavior:rule.behavior+' 这属于条件性行为倾向，不等同固定性格或健康诊断。',
      behaviorProfile:behaviorProfile,
      activation:resource+'既能生扶'+rule.target+'又能制约'+rule.excess+'，可作首要救应；'+rule.target+'比劫用于恢复承载，仍须结合原局根透。',
      causalChain:[rule.excess+'气成势','食伤泄身太过',rule.name,rule.target+'气受损'],
      useCorrection:{primary:[resource,rule.target],secondary:[],restrain:[rule.excess],conditional:[],avoid:[rule.excess]}
    });
    return out;
  }
  function patternUseElements(dayWx,mainPattern,context){
    var resource=resourceElement(dayWx),output=gen[dayWx],wealth=ctrl[dayWx],officer=officerElement(dayWx);
    if(/从格：从(?:杀|官|官杀)格/.test(mainPattern))return {use:[officer,wealth],avoid:[resource,dayWx,output],why:'从官杀之势成格，顺从官杀旺势，取财生官杀，忌印比扶身及食伤逆制官杀破从。'};
    if(/从格：从财格/.test(mainPattern))return {use:[wealth,output],avoid:[resource,dayWx,officer],why:'从财成格，顺从财势，取食伤生财，忌印比扶身、比劫分财及官杀泄财破从。'};
    if(/从格：从儿格/.test(mainPattern))return {use:[output,wealth],avoid:[resource],why:'从儿以食伤成势并继续生财为主；比劫可生食伤，不因日主有根或见比劫便破从。忌印星实际回克食伤，官杀起战另按作用检验。'};
    if(/化气格/.test(mainPattern)){
      var transformed=(mainPattern.match(/化气格：..化([木火土金水])/)||[])[1];
      var transformUse=[transformed],transformAvoid=[officerElement(transformed)];
      return {use:transformUse,avoid:transformAvoid,conditional:[{element:gen[transformed],benefit:'化神有余时泄秀',risk:'化神不足时再泄会破坏承接',requirements:['化神自身有余，且存在可达泄秀出口，不转生克破化神的一方']},{element:resourceElement(transformed),benefit:'化神不足时生助',risk:'化神已旺时再生会壅滞出口',requirements:['仅在化神需要生助且不堵泄秀出口时采用']}],why:'化气成立后先维护化神，不等于继续增加化神；化神有余取泄，不足取扶，生助与泄秀分条件，不固定并列为主喜。'};
    }
    if(/专旺格/.test(mainPattern))return {use:[output],avoid:[officer],conditional:[{element:wealth,benefit:'食伤已有出口时可继续生财',risk:'财转生官杀逆局时不能采用',requirements:['必须接通食伤至财，且不形成有效逆局官杀']},{element:dayWx,benefit:'维持旺神根源',risk:'已旺再增可能阻滞泄秀',requirements:['只在出口仍能承接时维持，不作无条件再增']}],why:'专旺已具旺势与泄秀出口，先保泄秀；财能承食伤时不一概忌财，须防其转生官杀逆局；印比也不因同类或生扶便无条件再增。'};
    if(/财官印相生/.test(mainPattern))return {use:[wealth,officer,resource],avoid:[output],why:'格局重财官印顺生，忌食伤破官过重。'};
    if(/杀印相生|官印相生/.test(mainPattern))return {use:[resource,dayWx],avoid:[wealth,output],why:'格局以印化官杀、生扶日主为核心。'};
    if(/食神制杀/.test(mainPattern))return {use:[output,resource],avoid:[wealth],why:'格局以食神制杀为主，兼看印星护身。'};
    if(/羊刃驾杀/.test(mainPattern))return {use:[officer,wealth],avoid:[resource,dayWx],why:'格局以七杀制刃为主，喜财生杀，忌印比再助羊刃。'};
    if(/伤官配印/.test(mainPattern))return {use:[resource],avoid:[wealth],why:'格局以印制伤、护身清局为核心。'};
    if(/食神生财/.test(mainPattern))return {use:[output,wealth],avoid:[resource],why:'格局以食神泄秀、生财承接为核心，忌枭印直接夺食。'};
    if(/伤官生财/.test(mainPattern))return {use:[output,wealth],avoid:[resource],why:'格局以食伤生财、流通成事为核心。'};
    return {use:[],avoid:[],why:'未见可单独定用的成格组合，先按扶抑与调候。'};
  }
  function applyPatternConflictUse(dayWx,pattern,arbitration,context){
    var main=arbitration&&arbitration.main,conflictNames=main&&main.conflicts?main.conflicts.map(function(x){return x.name}):[];
    if(/食神制杀/.test(main&&main.name||'')&&conflictNames.indexOf('枭神夺食')>=0){
      var resource=resourceElement(dayWx),output=gen[dayWx],wealth=ctrl[dayWx];
      pattern.use=unique(pattern.use.filter(function(w){return w!==resource}).concat([output,wealth]));
      pattern.avoid=unique(pattern.avoid.filter(function(w){return w!==wealth&&w!==resource}));
      pattern.specificUse=['食神','正财','偏财'];
      pattern.specificAvoid=['偏印'];
      var rescue=context&&context.interactions?interactionFlowAnalysis('',context.profiles||{},context.interactions,[],[{from:['正财','偏财'],to:['偏印'],action:'制'}]).steps[0]:null;
      pattern.proposedUse=rescue&&rescue.active?[]:[wealth];
      pattern.rescueStep=rescue;
      pattern.why='食神制杀已成而见枭夺食，先保食神，并以财制枭作救；印星不得再夺食，财亦不可过旺转生杀。';
    }
    return pattern;
  }
  function regularPatternUseElements(dayWx,regular){
    var resource=resourceElement(dayWx),output=gen[dayWx],wealth=ctrl[dayWx],officer=officerElement(dayWx),use=[],avoid=[];
    var issue=(regular.issues||[]).join('、'),rescue=(regular.rescues||[]).join('、'),key=regular.authority&&regular.authority.key;
    if(key==='财'){
      if(/身不任财/.test(issue))use=[resource,dayWx];
      else if(/比劫/.test(issue))use=[officer];
      else use=unique((/食伤/.test(rescue)?[output]:[]).concat(/官星/.test(rescue)?[officer]:[],/印比/.test(rescue)?[resource,dayWx]:[]));
      if(!use.length)use=[output,officer];
      if(/比劫/.test(issue))avoid=[dayWx];
    }else if(key==='官'){
      use=unique((/印/.test(rescue)?[resource]:[]).concat(/财/.test(rescue)?[wealth]:[]));
      if(!use.length)use=[resource,wealth];
      if(/伤官见官/.test(issue))avoid=[output];
    }else if(key==='印'){
      use=unique((/官杀/.test(rescue)?[officer]:[]).concat(/食伤/.test(rescue)?[output]:[],/比劫护印/.test(rescue)?[dayWx]:[]));
      if(!use.length)use=[officer,output];
      if(/财坏印/.test(issue))avoid=[wealth];
    }else if(key==='食'){
      use=[wealth];
      if(/食神制杀/.test(rescue))use.unshift(output);
      if(/枭神夺食/.test(issue))avoid=[resource];
    }else if(key==='杀'){
      use=unique((/食神制杀/.test(rescue)?[output]:[]).concat(/印星化杀/.test(rescue)?[resource]:[]));
      if(!use.length)use=[output,resource];
      if(/官杀混杂/.test(issue))avoid=[wealth];
    }else if(key==='伤'){
      use=unique((/印星/.test(rescue)?[resource]:[]).concat(/财/.test(rescue)?[wealth]:[]));
      if(!use.length)use=[wealth,resource];
      if(/伤官见官/.test(issue))avoid=[officer];
    }else if(key==='禄'){
      use=[officer,output,wealth];
      if(/印比偏重/.test(issue))avoid=[resource,dayWx];
    }else if(key==='刃'){
      use=[officer];
      if(/无官杀制刃/.test(issue))avoid=[resource,dayWx];
    }
    return {use:unique(use),avoid:unique(avoid),why:regular.name+regular.status+'，按成格条件与救应取'+(use.length?unique(use).join('、'):'待定')+'。',source:'月令格'};
  }
  function specificUsefulDecision(dayStem,primary,secondary,avoid,context,pattern,decision){
    var profiles=context.profiles||{},main=context.patternArbitration&&context.patternArbitration.mainPattern||context.mainPattern||'',monthGod=context.monthGod;
    var preferred=[];
    if(/财官印相生/.test(main))preferred=[monthGod,'正官','正印','偏印'];
    else if(/食神制杀/.test(main))preferred=['食神','正财','偏财'];
    else if(/杀印相生/.test(main))preferred=['正印','偏印','比肩'];
    else if(/官印相生/.test(main))preferred=['正印','偏印','正官'];
    else if(/羊刃驾杀/.test(main))preferred=['七杀','正财','偏财'];
    else if(/伤官配印/.test(main))preferred=['正印','偏印'];
    else if(/伤官生财/.test(main))preferred=['伤官','正财','偏财'];
    preferred=unique((pattern.specificUse||[]).concat(preferred));
    function active(god){var item=profiles[god]||{};return !!(item.revealed||item.monthCommand||(item.rootPower==null?item.roots:item.rootPower)>0)}
    function items(elements,preferredGods,role){
      return unique(elements).map(function(element){
        var possible=godNamesForElement(dayStem,element),chosen=preferredGods.filter(function(god){return possible.indexOf(god)>=0&&active(god)});
        var actors=(decision&&decision.routes||[]).reduce(function(out,route){return out.concat(route.actors||[])},[]).filter(function(actor){return possible.indexOf(actor.god)>=0});
        if(role!=='慎用'&&actors.length)chosen=unique(actors.map(function(actor){return actor.god}));
        var clearChosen=chosen.filter(function(god){var item=profiles[god]||{};return item.revealed||item.monthCommand});
        if(clearChosen.length)chosen=clearChosen;
        if(!chosen.length)chosen=possible.filter(active);
        if(!chosen.length)chosen=preferredGods.filter(function(god){return possible.indexOf(god)>=0});
        if(!chosen.length)chosen=possible;
        var present=chosen.some(active),clear=chosen.some(function(god){var item=profiles[god]||{};return item.revealed||item.monthCommand});
        var rooted=chosen.some(function(god){var item=profiles[god]||{};return (item.rootPower==null?(item.roots||0):item.rootPower)>0});
        return {element:element,tenGods:unique(chosen),stems:unique(STEMS.filter(function(stem){return chosen.indexOf(tenGod(dayStem,stem))>=0})),actors:actors,present:present,state:clear?'透清或得令':(rooted?'有根未透':(present?'原局有据':'待运补入')),role:role,reason:actors.length?'由已核作用对象归纳五行；不等于新增同五行都有效':(present?'原局根透候选；未据此认定完整作用':'补入候选须另验位置、承载及反作用')};
      });
    }
    var specificAvoid=unique(pattern.specificAvoid||[]),avoidItems=items(avoid,[], '慎用');
    specificAvoid.forEach(function(god){
      var element=STEM_WX[STEMS.find(function(stem){return tenGod(dayStem,stem)===god})];
      var existing=avoidItems.find(function(x){return x.element===element});
      if(existing){
        existing.tenGods=unique(specificAvoid.filter(function(item){return STEM_WX[STEMS.find(function(stem){return tenGod(dayStem,stem)===item})]===element}));
        existing.stems=STEMS.filter(function(stem){return existing.tenGods.indexOf(tenGod(dayStem,stem))>=0});
        existing.reason='高优先级格局仅针对'+existing.tenGods.join('、')+'，不扩大到同五行其他十神';
      }
      else avoidItems.push({element:element,tenGods:[god],stems:STEMS.filter(function(stem){return tenGod(dayStem,stem)===god}),present:active(god),role:'慎用',reason:'格局破坏点明确针对'+god});
    });
    return {primary:items(primary,preferred,'主用'),secondary:items(secondary,preferred,'佐用'),avoid:avoidItems};
  }
  function arbitrateUsefulRoutes(dayStem,strength,context,layers){
    var dayWx=STEM_WX[dayStem],resource=resourceElement(dayWx),output=gen[dayWx],wealth=ctrl[dayWx],officer=officerElement(dayWx),weak=/弱/.test(strength),profiles=context.profiles||{},pillars=context.pillars,interactions=context.interactions||(pillars?interactionAnalysis(pillars):null),routes=[],fuyi=layers.fuyi,climate=layers.tiaohou,pattern=layers.pattern;
    var diseases=context.patternDisease&&context.patternDisease.items||[],pending=diseases.filter(function(d){return d.status!=='已解'}),families=pending.map(function(d){return d.family}),phenomenon=(context.elementPhenomena||[])[0],main=context.patternArbitration&&context.patternArbitration.main;
    function present(names){return names.some(function(g){var p=profiles[g]||{};return (p.count||0)>0||(p.rootPower||0)>0||p.revealed||p.monthCommand})}
    function clear(names){return names.some(function(g){var p=profiles[g]||{};return !!(p.revealed||p.monthCommand)})}
    function link(name){var result=interactions?interactionFlowAnalysis(name,profiles,interactions,[]):null;return result&&result.steps||[]}
    function actionLink(from,to,action){var result=interactions?interactionFlowAnalysis('',profiles,interactions,[],[{from:from,to:to,action:action}]):null;return result&&result.steps[0]||null}
    function route(id,name,layer,elements,benefit,risk,requirements,evidence,source,status){var item={id:id,name:name,layer:layer,status:status||'reference',priority:layer==='扶抑'?'support':layer==='调候'?'climate':layer==='格局'?'pattern':'reference',assessment:'reference',elements:unique(elements),benefit:benefit,risk:risk,requirements:requirements||[],evidence:evidence||[],reason:'',source:source,ruleId:'ZP-USE-06'};routes.push(item);return item}
    var capacity=context.carryingCapacity||{},tasks=capacity.tasks||{},sealNames=['正印','偏印'],wealthNames=['正财','偏财'],officerNames=['正官','七杀'];
    var hurt=present(['伤官']),hasOutput=present(['食神','伤官']),hasWealth=present(wealthNames),hasOfficer=present(officerNames),hasSeal=present(sealNames);
    var sealNeed=families.indexOf('官伤冲战')>=0||families.indexOf('承载不足')>=0||families.indexOf('官杀承载不足')>=0;
    var treatHurt=families.indexOf('官伤冲战')>=0||(families.indexOf('承载不足')>=0&&hurt),treatOfficer=families.indexOf('官杀承载不足')>=0;
    var sealSteps=[];
    if(treatHurt)sealSteps=sealSteps.concat(link('伤官配印格'));
    if(treatOfficer){if(present(['七杀']))sealSteps=sealSteps.concat(link('杀印相生格'));if(present(['正官']))sealSteps=sealSteps.concat(link('官印相生格'))}
    var sealEntries=sealNames.reduce(function(out,name){var p=profiles[name]||{};return out.concat((p.stemEntries||[]).filter(function(e){return e.usable!==false}).map(function(e){return {position:e.position,text:e.stem+name,usable:true}}),(p.branchEntries||[]).filter(function(e){return e.rootPower>0&&!e.transformedAway}).map(function(e){return {position:e.position,text:e.branch+'藏'+e.stem+name,usable:(e.attacks||[]).indexOf('冲')<0}}))},[]);
    var sealSupport=sealEntries.some(function(e){return e.usable&&Math.abs(e.position-2)<=1}),sealSupportText=sealEntries.length?'印至日主：'+sealEntries.map(function(e){return e.text+'（'+(Math.abs(e.position-2)<=1?'近身':'隔位')+(e.usable?'':'、根受损')+'）'}).join('、'):'印至日主：原局未见有效印的根透承接';
    var wealthSteps=link(hurt?'伤官生财格':'食神生财格');
    var protectedOfficer=present(['正官']),transmission=interactions?interactionFlowAnalysis('',profiles,interactions,[],[{from:hurt?['伤官']:['食神'],to:wealthNames,action:'生'},{from:wealthNames,to:['正官'],action:'生'}]):{steps:[]};
    var officerSteps=transmission.steps.slice(1,2),transmissionActive=protectedOfficer&&transmission.steps.length===2&&transmission.steps.every(function(step){return step.active});
    var sealReachable=sealSteps.every(function(s){return s.active})&&sealSupport,wealthReachable=wealthSteps.some(function(s){return s.active}),officerReachable=officerSteps.some(function(s){return s.active});
    var mixed=assessOfficerMixture(profiles,interactions,pillars,capacity).unresolved,officerSealSteps=link('财官印相生格'),wealthMediated=officerSealSteps.length===3&&officerSealSteps.every(function(s){return s.active})&&!mixed;
    var harmfulSeal=!!(main&&(main.conflicts||[]).some(function(c){return c.name==='枭神夺食'}));
    var wealthSealAction=actionLink(wealthNames,sealNames,'制'),wealthKillingAction=actionLink(wealthNames,['七杀'],'生');
    var wealthHurtsSeal=hasSeal&&hasWealth&&wealthSealAction&&wealthSealAction.active&&!wealthMediated&&!harmfulSeal,killFed=clear(['七杀'])&&hasWealth&&wealthKillingAction&&wealthKillingAction.active;
    var support=route('balance','扶抑承载','扶抑',fuyi.use,fuyi.why,weak?'同类可能分财、增燥；印星亦须防过量壅滞':'泄耗制须有实际出口，不能见字便断吉',['生扶或泄耗须符合当前任务承载；根气按合冲后的有效状态使用'],context.weightedStrength&&context.weightedStrength.assessment?[context.weightedStrength.assessment.summary]:['沿用兼容扶身指标；没有日期时不推断司令'],'《滴天髓阐微》衰旺、中和；固定比例为项目指标');
    var sealName=treatHurt?(treatOfficer?'印制伤兼化官杀生身':'印制伤护身'):(treatOfficer?'印化官杀生身':'印星补充承载');
    var sealBenefit=(treatHurt?'印制伤须落实印至伤官，':'')+(treatOfficer?'官杀生印须落实官杀至印，':'')+'生身另核印至日主的近身承接；有根未透只认潜在作用';
    var sealRoute=route('seal-remedy',sealName,'病药',[resource],sealBenefit,wealthHurtsSeal?'财印近贴，印路有受制风险':'印过量会反夺食伤，不能无条件增印',['须有相应病点，分开核对所治病族的作用链及印至日主承接'].concat(hasSeal?(clear(sealNames)?[]:['印星须透清或由岁运接通']):['原局印不显，需补入有效印星']),sealSteps.map(function(s){return s.text}).concat([sealSupportText]), '《子平真诠》伤官、偏官、成败救应；《滴天髓阐微》通关',sealNeed?'conditional':'reference');
    sealRoute.applicable=sealNeed;sealRoute.active=hasSeal&&sealReachable;
    sealRoute.priority=sealNeed?'main-remedy':'reference';sealRoute.assessment=sealRoute.active?'local':(sealNeed?'proposed':'reference');
    var wealthRequirements=['通关须逐段核对食伤→财→所保官星，不把财的存在等同整链成立'];
    if(!hasOutput)wealthRequirements.push('须有实际食伤来源');
    if(!hasWealth)wealthRequirements.push('财星须补入并接通');
    if(hasOutput&&!wealthReachable)wealthRequirements.push('食伤至财的作用链须接通');
    if(protectedOfficer&&!officerReachable)wealthRequirements.push('财至所保官星的作用链须接通');
    if(tasks.wealth&&tasks.wealth.status!=='supported')wealthRequirements.push('承财仍有条件，局部通关不等于完整生财格');
    var wealthRisks=[];
    if(wealthHurtsSeal)wealthRisks.push('财印近贴，可能损伤印路');
    if(killFed)wealthRisks.push('财也可能转生七杀');
    if(mixed)wealthRisks.push('官杀同透尚未取清，不能把生官杀全当有利');
    if(weak&&(!tasks.wealth||tasks.wealth.status!=='supported'))wealthRisks.push('财有耗身一面，须看印比承接');
    var wealthRoute=route('wealth-flow','食伤生财／财通关','通关',[wealth],'财可承接食伤；食伤→财→所保官星接通时具有局部通关作用',wealthRisks.join('；')||'须防财过量及比劫争财',wealthRequirements,wealthSteps.concat(officerSteps).map(function(s){return s.text}), '《子平真诠》伤官、成败救应；《滴天髓阐微》源流、通关',hasOutput&&hasWealth?(wealthRisks.length||wealthRequirements.length>1?'conditional':'reference'):'reference');
    wealthRoute.applicable=hasOutput&&hasWealth;wealthRoute.active=wealthReachable;wealthRoute.transmissionActive=transmissionActive;
    wealthRoute.priority=transmissionActive&&families.indexOf('官伤冲战')>=0||wealthRoute.active&&families.indexOf('食伤去留')>=0?'main-remedy':'support';
    var wealthMaintainsRescue=wealthRoute.active&&diseases.some(function(disease){return disease.status==='已解'&&(disease.medicines||[]).some(function(medicine){return medicine.rank===2&&(/财星疏通食伤/.test(medicine.name)||transmissionActive&&/财星通关/.test(medicine.name))})});
    if(wealthMaintainsRescue)wealthRoute.priority='pattern';
    wealthRoute.maintainsResolved=wealthMaintainsRescue;
    wealthRoute.assessment=wealthRoute.active?'local':(wealthRoute.applicable?'proposed':'reference');
    var climateRoute=route('climate','寒暖燥湿校正','调候',climate.use,climate.why,'调候得用不等于十神全利；须同时核对泄耗制、生杀或坏印',climate.priority==='主用'?['须有当前季节与实际偏枯证据；采用时不得忽略十神负荷']:['未达明显偏枯，仅作季节参考'],[climate.condition], '《滴天髓阐微》寒暖、燥湿；seasonTune 比例为工程门槛',climate.priority==='主用'?'conditional':'reference');
    // A text-specific interpretation stays a separate reference, not a vote
    // added to the default five-element union.
    if(dayStem==='丙'&&context.monthBranch==='未'){
      var ren=profiles['七杀']||{},geng=profiles['偏财']||{};
      route('monthly-bing-wei','六月丙火分月取法','分月参考',['水','金'],'《穷通宝鉴》该节以壬为用、庚为辅，说明金水说法有独立出处，不只是求财标签', '原文亦论己土混壬等破点；壬为七杀，庚为偏财，不能扩大成所有金水出现都吉', ['按具体庚壬的根透、位置及原局承接判断，不覆盖默认格局取舍'],['壬：'+(ren.revealed?'透干':ren.rootPower?'藏支有根':'原局未见')+'；庚：'+(geng.revealed?'透干':geng.rootPower?'藏支有根':'原局未见')], '《穷通宝鉴》六月丙火，项目存档 qiongtong-baojian.wiki.txt 六月丙火节');
    }
    var patternRoute=route('formed-pattern','守成格主线','格局',pattern.use,pattern.why,'格局用神须与实际成格及破救条件一致',main?['必须维持已验真主格自身的成格条件与可达作用链']:['没有验真主格，不由诊断名称定用'],main?[main.name+'：'+main.status,main.basis||'']:[], '《子平真诠》月令、相神、成败救应',main?'conditional':'reference');
    sealRoute.steps=sealSteps;wealthRoute.steps=wealthSteps.concat(officerSteps);patternRoute.steps=main?link(main.name):[];
    [sealRoute,wealthRoute,patternRoute].forEach(function(r){
      r.actors=unique((r.steps||[]).filter(function(step){return step.active}).reduce(function(out,step){return out.concat([step.left,step.right])},[]).filter(function(actor){return actor&&r.elements.some(function(element){return godNamesForElement(dayStem,element).indexOf(actor.god)>=0})}).map(function(actor){return JSON.stringify(actor)})).map(function(actor){return JSON.parse(actor)});
      r.intent='维护既有功能；新增同五行仍须重新满足承接与反作用条件';
    });
    function patternRestriction(element,checkResourceRestraint){
      if(!main||(!checkResourceRestraint&&pattern.avoid.indexOf(element)<0))return null;
      var protectedFlow=link(main.name),targetGods=unique(protectedFlow.reduce(function(out,step){return out.concat(step.from||[],step.to||[])},[])).filter(function(god){return godNamesForElement(dayStem,ctrl[element]).indexOf(god)>=0});
      var damaging=actionLink(godNamesForElement(dayStem,element),targetGods,'制');
      // An element label is not proof of damage: only its controlling ten-god
      // relation to a necessary actor is eligible, never a favorable 生 relation.
      if(!damaging||!damaging.active||!damaging.left||!damaging.right)return null;
      var leftElement=STEM_WX[STEMS.find(function(stem){return tenGod(dayStem,stem)===damaging.left.god})],rightElement=STEM_WX[STEMS.find(function(stem){return tenGod(dayStem,stem)===damaging.right.god})];
      if(ctrl[leftElement]!==rightElement)return null;
      var remaining=Object.assign({},profiles),target=damaging.right,profile=Object.assign({},profiles[target.god]);
      var field=target.kind==='干'?'stemEntries':'branchEntries';
      profile[field]=(profile[field]||[]).filter(function(entry){return entry.position!==target.position});remaining[target.god]=profile;
      var fallback=interactionFlowAnalysis(main.name,remaining,interactions,[]).steps;
      var replaceable=fallback.length>0&&fallback.every(function(step){return step.active});
      return {protectedFunction:main.name,damage:damaging,replaceable:replaceable,dominant:!replaceable,withdrawal:'破坏作用受阻、药神先到，或存在不依赖受损对象的完整替代链时撤销否决'};
    }
    var selected,type,reason;
    if(phenomenon){selected=route('phenomenon-remedy',phenomenon.name+'对症取用','病药',phenomenon.useCorrection.primary,phenomenon.conclusion,'所忌已有实际病象，不能只认其某一生扶功能便继续增加',['须满足病象的比例、受损对象、根气及反证排除条件'],[phenomenon.evidence||phenomenon.conclusion], '沿用已验真的气势病象规则 '+phenomenon.ruleId);type='病药';reason=phenomenon.name+'已验真，先处理'+(phenomenon.category==='五行气象与生扶太过病象'?'生扶太过':'既有病点')+'，其他路线只在不加重该病点时参与'}
    else if(climate.priority==='主用'){selected=climateRoute;type='调候';reason='寒暖燥湿已达工程偏枯门槛，气候需要先进入实际取舍；承载与结构冲突逐元素保留，不由身弱标签静默排除'}
    else if(sealNeed&&(!wealthRoute.transmissionActive||families.indexOf('承载不足')>=0||treatOfficer)){selected=sealRoute;type='病药';reason='整体先兼顾未解病点与承载；对症通关另列条件取用，不因未选为主线便归忌'}
    else if(families.indexOf('官伤冲战')>=0&&wealthRoute.transmissionActive){selected=wealthRoute;type='病药';reason='官伤病点有局部通关路径，先按对症作用取舍，再分别核承载与反作用，不等于已完成救应或成格'}
    else if(main&&pattern.use.length){selected=patternRoute;type='格局';reason='已有验真主格，先守其作用链；扶抑与调候不另列互斥并集'}
    else{selected=support;type=/弱|强/.test(strength)?'扶抑':'流通';reason='没有可优先采用的验真成格或对症药路，按承载与流通取向处理'}
    selected.status='selected';selected.reason=reason;
    selected.assessment=selected===support?'proposed':selected===climateRoute?'local':selected===patternRoute?'local':selected.assessment;
    if(selected.id==='phenomenon-remedy'){selected.priority='main-remedy';selected.assessment='local'}
    routes.forEach(function(r){if(!r.reason)r.reason=r.status==='conditional'?'存在局部作用或替代取法，但条件、副作用未消除，不自动列入默认推荐':r.status==='reference'?'保留独立依据，未达到默认取用条件':'当前不取'});
    var primary=unique(selected.elements),secondary=[],conditionalUse=[],routeDependent=[],avoid=[],decisions=[];
    var monthlyRoute=routes.find(function(r){return r.id==='monthly-bing-wei'});
    var hurtOfficerStep=actionLink(['伤官'],['正官'],'制'),wealthSealStep=actionLink(wealthNames,sealNames,'制'),wealthKillingStep=actionLink(wealthNames,['七杀'],'生'),peerWealthStep=actionLink(['比肩','劫财'],wealthNames,'制');
    var unresolvedOutput=families.indexOf('官伤冲战')>=0&&clear(['伤官'])&&clear(['正官'])&&hurtOfficerStep&&hurtOfficerStep.active;
    var wealthLoadDisease=pending.some(function(d){return d.family==='承载不足'&&(d.source||[]).some(function(s){return /财多身弱|身不任财/.test(s)})});
    var peerDamage=families.indexOf('比劫分财')>=0&&anyGodForce(profiles,['比肩','劫财'])&&hasWealth&&peerWealthStep&&peerWealthStep.active;
    var sealDamage=wealthHurtsSeal&&clear(sealNames)&&sealNeed&&sealReachable&&wealthSealStep&&wealthSealStep.active;
    var killingDamage=killFed&&treatOfficer&&!sealReachable&&wealthKillingStep&&wealthKillingStep.active;
    function priorityFor(element){
      var relevant=routes.filter(function(r){return r.elements.indexOf(element)>=0&&(r.assessment==='local'||r.status==='selected')});
      if(relevant.some(function(r){return r.priority==='main-remedy'}))return 'main-remedy';
      if(relevant.some(function(r){return r.priority==='pattern'}))return 'pattern';
      if(relevant.some(function(r){return r.priority==='climate'}))return 'climate';
      return 'support';
    }
    WUXING.forEach(function(w){
      var benefitEntries=[],riskEntries=[],requirements=[];
      function benefit(r,status,text,evidence){
        benefitEntries.push({routeId:r.id,status:status,text:text||r.benefit,evidence:(evidence||r.evidence||[]).slice()});
      }
      function risk(id,status,text,evidence,dominant){
        riskEntries.push({id:id,status:status,text:text,evidence:evidence||[],dominant:!!dominant});
      }
      if(selected.elements.indexOf(w)>=0)benefit(selected,selected===patternRoute&&(pattern.proposedUse||[]).indexOf(w)>=0?'proposed':(selected.assessment==='local'?'local':'proposed'));
      if(main&&pattern.use.indexOf(w)>=0&&selected!==patternRoute)benefit(patternRoute,(pattern.proposedUse||[]).indexOf(w)>=0?'proposed':'local','原局格局中的功能／待接通救应：'+pattern.why);
      if(fuyi.use.indexOf(w)>=0&&selected!==support)benefit(support,'proposed');
      if(wealthRoute.elements.indexOf(w)>=0&&wealthRoute.active&&selected!==wealthRoute)benefit(wealthRoute,'local','已有局部可达作用：'+wealthRoute.benefit);
      if(w===resource&&sealNeed&&sealRoute.active&&selected!==sealRoute)benefit(sealRoute,'local');
      if(climate.priority==='主用'&&climate.use.indexOf(w)>=0&&selected!==climateRoute)benefit(climateRoute,'local');
      if(phenomenon&&phenomenon.useCorrection.secondary.indexOf(w)>=0)benefit(selected,'proposed','对症路线的润泄辅助');
      if(monthlyRoute&&monthlyRoute.elements.indexOf(w)>=0)benefit(monthlyRoute,'reference');
      var restriction=patternRestriction(w);
      if(phenomenon&&(phenomenon.useCorrection.conditional||[]).indexOf(w)>=0){
        var protectedPattern=restriction||patternRestriction(w,true);
        selected.resourceRestraint={
          element:w,excess:phenomenon.useCorrection.restrain[0],phenomenon:phenomenon.name,
          step:wealthSealStep,capacity:tasks.wealth&&tasks.wealth.status,
          protectedPattern:protectedPattern?{name:protectedPattern.protectedFunction,step:protectedPattern.damage,replaceable:protectedPattern.replaceable}:null,
          source:'《滴天髓·反局》'+(dayStem==='辛'&&context.monthBranch==='午'?'、《穷通宝鉴·三夏辛金》':'')
        };
      }
      if(restriction)risk('verified-pattern','effective','对'+restriction.protectedFunction+'必要对象有可达制约：'+restriction.damage.text,[restriction.damage.text,restriction.replaceable?'仍有完整替代链':'当前未见完整替代链',restriction.withdrawal],restriction.dominant&&selected!==climateRoute&&selected.id!=='phenomenon-remedy');
      else if(main&&pattern.avoid.indexOf(w)>=0)risk('pattern-boundary','potential','格局通则有制约提示，但未证明当前作用必然破坏必要功能',[pattern.why]);
      if(fuyi.avoid.indexOf(w)>=0&&!(selected===patternRoute&&primary.indexOf(w)>=0)&&!(phenomenon&&selected.elements.indexOf(w)>=0))risk('balance-load','potential',weak?'增加泄耗，须有相应承接；这不等于已有致害作用':'印比再增须看是否阻碍现有出口；不以数量直接判害',[fuyi.why]);
      if(climate.avoid.indexOf(w)>=0)risk(climate.priority==='主用'?'extreme-climate':'climate-limitation','effective','加重已识别的寒暖燥湿偏性',[climate.condition],climate.priority==='主用');
      if(phenomenon&&unique(phenomenon.useCorrection.restrain.concat(phenomenon.useCorrection.avoid)).indexOf(w)>=0)risk('verified-phenomenon','effective','增加后加重'+phenomenon.name,[phenomenon.conclusion],true);
      if(w===output&&families.indexOf('官伤冲战')>=0)risk('unresolved-output-officer',unresolvedOutput?'effective':'potential',unresolvedOutput?'未解的官伤冲突已有可达制官作用，当前不再增加伤官一方':'官伤关系尚受阻或未接通，不能仅按距离近认定已落实制官',hurtOfficerStep?[hurtOfficerStep.text]:[],!!unresolvedOutput);
      if(w===wealth){
        if((pattern.proposedUse||[]).indexOf(w)>=0)risk('unconnected-pattern-remedy','potential','财制枭救应尚未接通，补入后须先核对作用可达，再核财是否转生七杀',pattern.rescueStep?[pattern.rescueStep.text]:['未见直接财制枭作用']);
        if(wealthHurtsSeal)risk('wealth-seal',sealDamage?'effective':'potential',sealDamage?'财与必要印路近贴，已有伤印牵制':'财印近贴，须区分实际坏印与潜在冲突，不能见财便否决',sealRoute.evidence);
        if(killFed)risk('wealth-killing',killingDamage?'effective':'potential',killingDamage?'财生杀与未解的官杀承载病点相接':'财也可能生杀，须确认是否加重主要病点，不以相生关系自动判害',wealthRoute.evidence);
        if(mixed)risk('officer-selection','potential','官杀主次尚未取清，财路须明确所保对象',pending.filter(function(d){return d.family==='官杀去留'}).map(function(d){return d.name}));
        if(weak&&(!tasks.wealth||tasks.wealth.status!=='supported'))risk('wealth-carrying','potential','承财仍有使用条件；严格成格闸门未过不否认局部通关',tasks.wealth&&tasks.wealth.evidence||[]);
        if(wealthLoadDisease)risk('unresolved-wealth-load','effective','原局已有未解的财重承载病点，不能无条件再增财',pending.filter(function(d){return d.family==='承载不足'}).map(function(d){return d.name+'：'+d.status}),!wealthRoute.active);
      }
      if(w===resource&&wealthHurtsSeal)requirements.push('印路应处理财印牵制，潜在用药不等于已经完成救应');
      if(w===dayWx&&weak&&hasWealth&&present(['比肩','劫财'])&&godsConnected(profiles,['比肩','劫财'],wealthNames,2))risk('peer-wealth',peerDamage?'effective':'potential',peerDamage?'当前比劫分财病点未解，扶身与分财两面并存':'比劫近财存在取舍条件；不能由同类五行直接推断具体破财事件',pending.filter(function(d){return d.family==='比劫分财'}).map(function(d){return d.name+'：'+d.status}));
      if(w===officer&&weak&&hasOfficer&&!clear(sealNames))risk('officer-carrying','potential','官杀已有负荷，未见透印承接时不作无条件增补；条件不足不直接等于忌',tasks.officer&&tasks.officer.evidence||[]);
      var localBenefits=benefitEntries.filter(function(b){return b.status==='local'}),defaultBenefits=benefitEntries.filter(function(b){return b.status!=='reference'}),referenceBenefits=benefitEntries.filter(function(b){return b.status==='reference'});
      var dominant=riskEntries.some(function(r){return r.status==='effective'&&r.dominant});
      var climateCandidate=climate.priority==='主用'&&climate.use.indexOf(w)>=0;
      var targetedLocal=wealthRoute.active&&wealthRoute.priority==='main-remedy'&&wealthRoute.elements.indexOf(w)>=0;
      var recommended=primary.indexOf(w)>=0||((selected.layer==='病药'||selected.layer==='扶抑')&&fuyi.use.indexOf(w)>=0)||(phenomenon&&phenomenon.useCorrection.secondary.indexOf(w)>=0)||climateCandidate||targetedLocal;
      var decision,decisionReason;
      if(dominant){
        primary=primary.filter(function(x){return x!==w});avoid.push(w);decision='avoid';
        decisionReason='已有明确的守格、病点或气候制约；局部或其他取法的正向作用不能自动解除这一制约。';
      }else if(recommended&&defaultBenefits.length){
        if(riskEntries.length||targetedLocal&&selected!==wealthRoute){
          if(targetedLocal)requirements=requirements.concat(wealthRoute.requirements,['通关可属病药；局部可达不等于已经化解全部病点，不把印路与财路无条件叠加']);
          if(!requirements.length)requirements.push('在所列作用条件满足时使用，不把潜在风险当作已发生的损害');
          var effective=riskEntries.some(function(r){return r.status==='effective'}),label=effective?'喜中带忌':'有条件',priority=priorityFor(w);
          conditionalUse.push({element:w,label:label,priority:priority,benefit:defaultBenefits.map(function(b){return b.text}).join('；'),risk:riskEntries.map(function(r){return r.text}).join('；')||'局部收益不等于全局取用已无条件成立',requirements:unique(requirements)});
          primary=primary.filter(function(x){return x!==w});secondary.push(w);decision='conditional';
          var conditionalRoute=route('conditional-'+w,w+'的条件取用','条件取用',[w],conditionalUse[conditionalUse.length-1].benefit,conditionalUse[conditionalUse.length-1].risk,unique(requirements),benefitEntries.reduce(function(out,b){return out.concat(b.evidence)},[]).concat(riskEntries.reduce(function(out,r){return out.concat(r.evidence)},[])),'ZP-USE-09 同源利益、风险及条件分账','conditional');
          conditionalRoute.priority=priority;conditionalRoute.assessment=localBenefits.length?'local':'proposed';conditionalRoute.reason='按当前作用条件保留'+label+'，不等于所有取法同时采用';
        }else{if(primary.indexOf(w)<0)secondary.push(w);decision='use'}
        decisionReason='按同一套作用与风险证据取舍，不因日主同类或路线名称获得豁免。';
      }else if(localBenefits.length||referenceBenefits.length){
        routeDependent.push(w);decision='route-dependent';decisionReason='有未选作默认增补的局部作用或独立取法依据，单列其前提，不直接并入主喜或忌。';
      }else{decision='neutral';decisionReason='目前只有条件或风险提示，未成立明确喜用或致害结论。'}
      decisions.push({element:w,decision:decision,decisionReason:decisionReason,benefits:unique(benefitEntries.map(function(b){return b.text})),risks:unique(riskEntries.map(function(r){return r.text})),requirements:unique(requirements),benefitEntries:benefitEntries,riskEntries:riskEntries,priority:priorityFor(w)});
    });
    var priorityRanks={'main-remedy':0,pattern:1,climate:2,support:3,reference:4};
    secondary=unique(secondary).sort(function(a,b){return priorityRanks[priorityFor(a)]-priorityRanks[priorityFor(b)]});
    conditionalUse.sort(function(a,b){return secondary.indexOf(a.element)-secondary.indexOf(b.element)});
    if(selected===sealRoute&&wealthRoute.priority==='main-remedy'&&wealthRoute.active&&secondary.indexOf(wealth)>=0)reason=resource+'主要用于'+(treatHurt?'制伤护身':treatOfficer?'化官杀生身':'补充承载')+'；'+wealth+'有通关作用'+(secondary.indexOf(dayWx)>=0?'，'+dayWx+'作扶身辅助':'')+'，分别按条件使用。';
    var promotedPrimary=[];
    if(!primary.length&&secondary.length){
      promotedPrimary=secondary.slice();
      primary=secondary;
      secondary=[];
      reason=reason.replace(/[。；]+$/,'')+'。原裁决无主用，'+primary.join('、')+'由佐用升为主用，仍按各自条件采用。';
    }
    var conclusion={primary:primary,secondary:secondary,conditional:conditionalUse.map(function(c){return c.element}),routeDependent:unique(routeDependent),avoid:unique(avoid)};
    var priority={type:type,text:reason,source:selected.id==='phenomenon-remedy'?'气势病象':selected.layer};
    return {version:USEFUL_DECISION_VERSION,primaryRouteIds:[selected.id],priority:priority,routes:routes,conclusion:conclusion,promotedPrimary:promotedPrimary,elements:decisions,conditionalUse:conditionalUse,boundary:'默认取用不等于具体财运或健康结论；局部作用、完整成格与岁运激活分开判断；潜在风险与条件不足不直接等于忌'};
  }
  function usefulElements(dayStem,strength,context){
    context=context||{};
    var dayWx=STEM_WX[dayStem],resource=resourceElement(dayWx),output=gen[dayWx],wealth=ctrl[dayWx],officer=officerElement(dayWx);
    var phenomena=context.elementPhenomena||[],activePhenomenon=phenomena[0],earthBuriedMetal=phenomena.find(function(item){return item.ruleId==='ZP-QX-001'});
    var fuyi;
    if(strength.indexOf('弱')>=0)fuyi={use:[resource,dayWx],avoid:[output,wealth],why:'日主偏弱，先看印比扶身。'};
    else if(strength.indexOf('强')>=0)fuyi={use:[output,wealth,officer],avoid:[resource,dayWx],why:'日主偏强，先看泄耗制化。'};
    else fuyi={use:[output,wealth],avoid:[resource],why:'日主接近中和，取流通与成事之气。'};
    if(earthBuriedMetal){
      fuyi.use=unique(earthBuriedMetal.useCorrection.primary);
      fuyi.avoid=unique(fuyi.avoid.concat(earthBuriedMetal.useCorrection.restrain));
      fuyi.why='日主金气受厚土包裹，常规印比扶身须拆开判断：取金助身，印土已有且过量，不宜再增。';
    }else if(activePhenomenon){
      fuyi.use=activePhenomenon.useCorrection.primary.slice();
      fuyi.avoid=unique(fuyi.avoid.concat(activePhenomenon.useCorrection.restrain));
      fuyi.why=activePhenomenon.name+'显示'+(activePhenomenon.category==='五行气象与生扶太过病象'?'印星生扶太过':'食伤泄身太过')+'，先取'+activePhenomenon.useCorrection.primary.join('、')+'恢复日主承载，不再增加'+activePhenomenon.useCorrection.restrain.join('、')+'。';
    }
    var tiaohou=seasonTune(dayStem,context.monthBranch||'',context.scores||{},context.pillars,context.interactions);
    var verifiedMain=context.patternArbitration&&context.patternArbitration.main;
    var special=/从格：|化气格：|专旺格/.test(context.mainPattern||'');
    var pattern=patternUseElements(dayWx,special?context.mainPattern:(verifiedMain&&verifiedMain.name||''),context);
    if(!pattern.use.length&&context.regularPattern&&context.regularPattern.formed){
      pattern=regularPatternUseElements(dayWx,context.regularPattern);
    }else if(!pattern.use.length&&context.regularPattern){
      pattern.why=context.regularPattern.name+context.regularPattern.status+'，不另立格局用神；'+
        (context.regularPattern.rescues.length?'先落实'+context.regularPattern.rescues.join('、'):'先按扶抑承接月令主线')+'。';
    }
    pattern=applyPatternConflictUse(dayWx,pattern,context.patternArbitration,context);
    if(earthBuriedMetal){
      pattern.restrainedUse=unique((pattern.restrainedUse||[]).concat(earthBuriedMetal.useCorrection.restrain));
      pattern.why+=' 印土在格局中承担化杀功能，但原局已经过重并见'+earthBuriedMetal.name+'，只能认其已有功能，不再把土列为增补用神。';
    }else if(activePhenomenon){
      pattern.restrainedUse=unique((pattern.restrainedUse||[]).concat(activePhenomenon.useCorrection.restrain));
      pattern.why+=' 原局另见'+activePhenomenon.name+'，'+(activePhenomenon.category==='五行气象与生扶太过病象'?'印星虽有生扶功能但已经过量':'食伤虽可能承担泄秀或制化功能但已经过量')+'，只认其已有作用，不再追加'+activePhenomenon.useCorrection.restrain.join('、')+'。';
    }
    if(special){
      var specialPrimary=unique(pattern.use),specialAvoid=unique(pattern.avoid),specialCandidates=pattern.conditional||[],specialConditional=[],specialSecondary=[];
      var validationLayers={fuyi:fuyi,tiaohou:tiaohou};
      var validationOnly={use:[],avoid:[],priority:'真假校验',why:'特殊格已严格成立，本层只保留为真假校验，不单独提出相反喜用。'};
      var specialRoles=buildUsefulRoles(dayStem,specialPrimary,specialSecondary,specialAvoid,{tiaohou:validationOnly,pattern:pattern,fuyi:validationOnly,monthBranch:context.monthBranch,monthGod:context.monthGod,monthCommandStem:context.monthCommandStem});
      var specialKind=/化气格：/.test(context.mainPattern||'')?'化神':(/从格：/.test(context.mainPattern||'')?'所从之神':'旺神');
      function specialItem(element,label){return {element:element,tenGods:[label],stems:STEMS.filter(function(stem){return STEM_WX[stem]===element}),state:'特殊格语境'}}
      var specialSpecific={primary:specialPrimary.map(function(element){return specialItem(element,'维护顺势功能')}),secondary:specialSecondary.map(function(element){return specialItem(element,'条件性承接')}),avoid:specialAvoid.map(function(element){return specialItem(element,'破坏'+specialKind)})};
      specialRoles.monthCommandGod=usefulRole(dayStem,[]);
      specialRoles.patternGod.tenGods=[specialKind];
      specialRoles.assistantGod.tenGods=specialPrimary.length>1?['生助'+specialKind]:[];
      specialRoles.balanceGod=usefulRole(dayStem,[]);
      specialRoles.climateGod=usefulRole(dayStem,[]);
      specialRoles.finalUseGod.tenGods=[specialKind];
      specialRoles.useGod=specialRoles.finalUseGod;
      specialRoles.avoidGod.tenGods=specialAvoid.length?['破坏'+specialKind]:[];
      var specialDecision={version:USEFUL_DECISION_VERSION,primaryRouteIds:['strict-special'],priority:{type:'顺势',text:'严格特殊格按自身语境顺势取用，普通扶抑与调候只作真假校验',source:'特殊格'},routes:[{id:'strict-special',name:context.mainPattern,layer:'顺势',status:'selected',priority:'pattern',assessment:'local',elements:specialPrimary,benefit:pattern.why,risk:'逆势或破化会损伤严格成立条件',requirements:['全部 qualification 必要条件维持成立，不能被普通扶身建议破从或破化'],evidence:['严格特殊格成立；常格规则不参与并集'],reason:pattern.why,source:'现有严格特殊格 qualification'}],conclusion:{primary:specialPrimary,secondary:[],conditional:[],routeDependent:[],avoid:specialAvoid},elements:[],conditionalUse:[]};
      specialDecision.conclusion.secondary=specialSecondary;
      specialDecision.conclusion.conditional=specialSecondary;
      specialDecision.conclusion.routeDependent=unique(specialCandidates.map(function(item){return item.element})).filter(function(element){return specialPrimary.indexOf(element)<0&&specialAvoid.indexOf(element)<0});
      specialDecision.conditionalUse=specialConditional;
      specialCandidates.forEach(function(item){specialDecision.routes.push({id:'special-conditional-'+item.element,name:item.element+'条件承接',layer:'顺势',status:'reference',priority:'reference',assessment:'reference',elements:[item.element],benefit:item.benefit,risk:item.risk,requirements:item.requirements,evidence:[context.mainPattern+'已严格成立；本项为成立后的条件候选，不是已经有效的作用'],reason:'增补资格未独立满足前仅保留取法条件，不把互斥的扶与泄同时列为佐用',source:'《滴天髓阐微·体用、独象》条件解释'})});
      return {
        use:unique(specialPrimary.concat(specialSecondary)),
        avoid:specialAvoid,
        why:'格局：'+pattern.why+' 特殊格局成立，扶抑与调候仅作校验，不并入总用神。',
        primaryUse:specialPrimary,secondaryUse:specialSecondary,conditionalUse:specialConditional,decision:specialDecision,roles:specialRoles,
        layers:{fuyi:Object.assign({},validationOnly),tiaohou:Object.assign({},validationOnly),pattern:pattern},validationLayers:validationLayers,specific:specialSpecific,
        arbitration:{type:'顺势',text:'特殊格局成立，格局顺势优先；扶抑与调候只作真假校验。',source:'格局',conflicts:[]}
      };
    }
    var decision=arbitrateUsefulRoutes(dayStem,strength,context,{fuyi:fuyi,tiaohou:tiaohou,pattern:pattern});
    var primary=decision.conclusion.primary,secondary=decision.conclusion.secondary,conditionalUse=decision.conditionalUse,avoid=decision.conclusion.avoid;
    var conflicts=decision.elements.filter(function(item){return item.risks.length}).map(function(item){return {element:item.element,decision:{conditional:'条件取',use:'取',avoid:'不取','route-dependent':'取法有别',neutral:'未定'}[item.decision],why:(item.benefits.length?item.benefits.join('；')+'；':'')+'限制：'+item.risks.join('；')+'；'+item.decisionReason}});
    var arbitration=Object.assign({},decision.priority,{conflicts:conflicts});
    decision.priority=arbitration;
    var specific=specificUsefulDecision(dayStem,primary,secondary,avoid,context,pattern,decision);
    return {use:unique(primary.concat(secondary)),primaryUse:primary,secondaryUse:secondary,conditionalUse:conditionalUse,avoid:avoid,decision:decision,roles:buildUsefulRoles(dayStem,primary,secondary,avoid,{tiaohou:tiaohou,pattern:pattern,fuyi:fuyi,monthBranch:context.monthBranch,monthGod:context.monthGod,monthCommandStem:context.monthCommandStem}),specific:specific,arbitration:arbitration,why:'主用：'+(primary.join('、')||'无无条件主用')+'；佐用：'+(secondary.join('、')||'无')+(conditionalUse.length?'（其中'+conditionalUse.map(function(x){return x.element+x.label}).join('、')+'）':'')+'；忌：'+(avoid.join('、')||'无明确忌项')+(decision.conclusion.routeDependent.length?'；取法差异：'+decision.conclusion.routeDependent.join('、'):'')+'。'+arbitration.text,layers:{fuyi:fuyi,tiaohou:tiaohou,pattern:pattern}};
  }
  function normalizeDegree(value){return ((value%360)+360)%360}
  function solarLongitude(julianDay){
    var rad=Math.PI/180,tt=julianDay+69/86400,t=(tt-2451545)/36525;
    var meanLongitude=normalizeDegree(280.46646+36000.76983*t+0.0003032*t*t);
    var meanAnomaly=normalizeDegree(357.52911+35999.05029*t-0.0001537*t*t);
    var center=Math.sin(meanAnomaly*rad)*(1.914602-0.004817*t-0.000014*t*t)+Math.sin(2*meanAnomaly*rad)*(0.019993-0.000101*t)+Math.sin(3*meanAnomaly*rad)*0.000289;
    var omega=125.04-1934.136*t;
    return normalizeDegree(meanLongitude+center-0.00569-0.00478*Math.sin(omega*rad));
  }
  function solarTermDate(year,index){
    var target=normalizeDegree(285+index*15);
    var utc=Date.UTC(1900,0,6,2,5)+31556925974.7*(year-1900)+SOLAR_TERM_MINUTES[index]*60000;
    var jd=utc/86400000+2440587.5;
    for(var i=0;i<6;i++){
      var difference=normalizeDegree(solarLongitude(jd)-target+180)-180;
      jd-=difference/0.98564736;
    }
    return new Date((jd-2440587.5)*86400000+SOLAR_TERM_SOLVER_CORRECTION_MS);
  }
  function humanCommander(branch,time){
    if(!time||!time.year||!time.month||!time.day||MONTH_START_TERM[branch]==null)return null;
    var index=MONTH_START_TERM[branch],term=solarTermDate(time.year,index);
    var localUtc=Date.UTC(time.year,time.month-1,time.day,(time.hour||0)-8,time.minute||0),elapsed=(localUtc-term.getTime())/86400000;
    if(elapsed<0||elapsed>=32)return null;
    var stages=HUMAN_COMMAND[branch]||[],cursor=0,selected=stages[stages.length-1];
    for(var i=0;i<stages.length;i++){cursor+=stages[i][1];if(elapsed<cursor){selected=stages[i];break}}
    return {stem:selected[0],days:selected[1],elapsedDays:Math.floor(elapsed*10)/10,termDate:term.toISOString(),method:'节气分钟校准后按人元分野'};
  }
  function monthCommandAnalysis(dayStem,pillars,interactions,time){
    var branch=pillars.month[1],hidden=HIDDEN[branch]||[],baseStem=hidden[0]||'',grave='辰戌丑未'.indexOf(branch)>=0;
    var commander=humanCommander(branch,time);
    var visible=['year','month','hour'].map(function(key){return pillars[key][0]});
    var revealed=hidden.filter(function(stem){return visible.indexOf(stem)>=0});
    var groupStems=[];
    (interactions&&interactions.groups||[]).filter(function(group){return group.complete&&group.active&&group.members.indexOf(branch)>=0}).forEach(function(group){
      var stem=hidden.find(function(item){return STEM_WX[item]===group.element});
      if(stem)groupStems.push(stem);
    });
    revealed=revealed.filter(function(stem){return ['year','month','hour'].some(function(key){return pillars[key][0]===stem&&(!interactions||stemInteractionChange(PILLAR_META[key].index,interactions).usable!==false)})});
    var clearStems=unique(revealed.concat(groupStems)),selected=clearStems.length?clearStems:[grave&&commander&&hidden.indexOf(commander.stem)>=0?commander.stem:baseStem];
    var contrary=selected.some(function(a){return selected.some(function(b){return ctrl[STEM_WX[a]]===STEM_WX[b]&&!selected.some(function(bridge){return STEM_WX[bridge]===gen[STEM_WX[a]]&&gen[STEM_WX[bridge]]===STEM_WX[b]})})});
    var ambiguous=selected.length>1&&contrary,primaryStem=(commander&&selected.indexOf(commander.stem)>=0?commander.stem:selected[0])||baseStem;
    var status=!clearStems.length?(!grave?'本气主令':(commander?'杂气按司令立主线':'杂气未透，以本气立主线')):(ambiguous?'多神相制待清':(selected.length>1?'候选相生兼用':(grave?'杂气取清':(primaryStem===baseStem?'本气取用':'月令用神变化'))));
    var basis;
    if(!grave)basis='月令'+branch+'本气'+baseStem+'为提纲背景；'+(clearStems.length?'透干／有效会支候选'+selected.join('、')+'，'+status+'，各自成败另验作用链。':'未见有效透干或会支变化，仍以本气立主线。');
    else if(!clearStems.length)basis='月令'+branch+'属杂气，藏干未见透出或会支取清，'+(commander?'节后约'+commander.elapsedDays+'日由'+commander.stem+'司令，据此立主线。':'暂以本气'+baseStem+'立主线。');
    else basis='月令'+branch+'属杂气，'+(revealed.length?'透干'+revealed.join('、'):'')+(revealed.length&&groupStems.length?'，':'')+(groupStems.length?'会支取'+groupStems.join('、'):'')+(ambiguous?'；多神并用，须再辨有情无情。':'，取其清者为用。');
    if(commander)basis+=' 人元司令校验：'+commander.stem+'司令。';
    return {branch:branch,baseStem:baseStem,baseGod:baseStem?tenGod(dayStem,baseStem):'',grave:grave,revealedStems:revealed,groupStems:unique(groupStems),selectedStems:selected,selectedGods:selected.map(function(stem){return tenGod(dayStem,stem)}),primaryStem:primaryStem,primaryGod:primaryStem?tenGod(dayStem,primaryStem):'',ambiguous:ambiguous,status:status,basis:basis,commander:commander};
  }
  function patternName(dayStem,monthBranch,commandStem){
    var main=commandStem||(HIDDEN[monthBranch]||[])[0],god=main?tenGod(dayStem,main):'';
    if(!god)return '命格待判';
    if(god==='比肩')return main===(HIDDEN[monthBranch]||[])[0]?'建禄格':'月劫用事';
    if(god==='劫财')return main===(HIDDEN[monthBranch]||[])[0]?'月刃格':'月劫用事';
    return god+'格';
  }
  function authorityRuleForGod(god){
    var key=Object.keys(AUTHORITY_PATTERN_RULES).find(function(name){return AUTHORITY_PATTERN_RULES[name].gods.indexOf(god)>=0});
    var rule=key?AUTHORITY_PATTERN_RULES[key]:null;
    if(!rule)return {ruleId:'ZP-MG-00',ruleVersion:PATTERN_RULE_VERSION,framework:'主流子平月令立格',source:'主流子平月令取格；月令主气不足时保留待判',key:'待判',principle:'月令主气不足以建立常规格局。',success:[],breakers:[],rescues:[]};
    return {ruleId:rule.id,ruleVersion:PATTERN_RULE_VERSION,framework:'主流子平月令立格（《子平真诠》主线）',source:'《子平真诠》月令立格与成败救应主线，《三命通会》条件补充',key:key,principle:rule.principle,success:rule.success.slice(),breakers:rule.breakers.slice(),rescues:rule.rescues.slice()};
  }
  function regularPatternAssessment(dayStem,pillars,monthGod,profiles,strength,monthCommand,interactions,capacity){
    var name=patternName(dayStem,pillars.month[1],monthCommand&&monthCommand.primaryStem),issues=[],rescues=[],basis=[],checks=[],formed=false,ready=false,authority=authorityRuleForGod(monthGod);
    if(name==='月劫用事')authority=authorityRuleForGod('比肩');
    var weak=/弱/.test(strength),strong=/强/.test(strength);
    // 承载按任务核对；旺衰索引不是另一套能推翻同源承载证据的判决。
    function carries(task,fallback){return capacity&&capacity.tasks&&capacity.tasks[task]?capacity.tasks[task].strictFormationEligible:capacity?!!capacity[fallback]:!weak}
    var canCarryWealth=carries('wealth','canCarryWealth'),canCarryOutput=carries('output','canCarryOutputKill'),canCarryOfficer=carries('officer','canCarryOutputKill');
    var wealthForce=anyGodForce(profiles,['正财','偏财']),wealthClear=anyGodClear(profiles,['正财','偏财']);
    var officerForce=godForce(profiles,'正官'),officerClear=godClear(profiles,'正官');
    var sevenForce=godForce(profiles,'七杀'),sevenClear=godClear(profiles,'七杀');
    var sealForce=anyGodForce(profiles,['正印','偏印']),sealClear=anyGodClear(profiles,['正印','偏印']);
    var outputForce=anyGodForce(profiles,['食神','伤官']),outputClear=anyGodClear(profiles,['食神','伤官']);
    var foodForce=godForce(profiles,'食神'),foodClear=godClear(profiles,'食神');
    var hurtForce=godForce(profiles,'伤官'),hurtClear=godClear(profiles,'伤官');
    var biForce=anyGodForce(profiles,['比肩','劫财']),biClear=anyGodClear(profiles,['比肩','劫财']);
    var mixed=assessOfficerMixture(profiles,interactions,pillars,capacity).unresolved;
    function reaches(from,to,action){return interactionFlowAnalysis('',profiles,interactions||{},[],[{from:from,to:to,action:action||'制'}]).steps.some(function(step){return step.active})}
    var hurtOfficer=hurtClear&&officerClear&&reaches(['伤官'],['正官']);
    var wealthDamagesSeal=wealthClear&&sealForce&&reaches(['正财','偏财'],['正印','偏印']);
    var owlTakesFood=godForce(profiles,'偏印')&&reaches(['偏印'],['食神']);
    function add(arr,text){if(arr.indexOf(text)<0)arr.push(text)}
    var checkCounts={立格:0,成格:0,破格:0,救应:0};
    function check(type,label,active,evidence){
      var prefix={立格:'LG',成格:'CG',破格:'BR',救应:'RS'}[type]||'OT';
      checkCounts[type]=(checkCounts[type]||0)+1;
      checks.push({ruleId:authority.ruleId+'-'+prefix+'-'+checkCounts[type],ruleVersion:authority.ruleVersion,type:type,label:label,active:!!active,evidence:evidence||''});
    }
    if(monthCommand)basis.push(monthCommand.status+'，以'+(monthCommand.primaryStem||'月令主气')+(monthGod||'')+'立主线');
    if(monthGod==='正财'||monthGod==='偏财'){
      basis.push('财星当令');
      ready=wealthForce&&(wealthClear||officerClear||outputClear)&&canCarryWealth;
      check('立格','财星当令',true,'月令取'+monthGod);
      check('成格','财星有根或透清',wealthForce&&wealthClear,'财星须得令并能落实');
      check('成格','身能任财或有印比承财',canCarryWealth,capacity?capacity.text:'按承载条件判断');
      check('破格','比劫夺财而无官护',biForce&&!officerClear,'比劫有力时须见官星护财');
      check('救应','官护、食伤生财或印比扶身',officerClear||outputClear||sealClear||biClear,'按原局实际承接判断');
      if(!canCarryWealth)add(issues,'日主承载不足，身不任财');
      if(biForce&&!officerClear)add(issues,'比劫有力，财星缺官护');
      if(officerClear)add(rescues,'官星护财');
      if(outputClear)add(rescues,'食伤生财');
      if(sealClear||biClear)add(rescues,'印比扶身承财');
    }else if(monthGod==='正官'){
      basis.push('正官当令');
      ready=officerForce&&!mixed&&(sealClear||wealthClear)&&canCarryOfficer;
      check('立格','正官当令',true,'月令取正官');
      check('成格','官星有力而清',officerForce&&!mixed,'官杀不混方清');
      check('成格','财生或印护',sealClear||wealthClear,'正官喜财印相辅');
      check('破格','官伤实战、官杀未清或官重身轻',hurtOfficer||mixed||!canCarryOfficer,'兼见不直接当作受损，先核有效作用与任官承载');
      check('救应','印护官生身或财星生官',sealClear||wealthClear,'须能落实到原局');
      if(mixed)add(issues,'官杀混杂，清浊未分');
      if(hurtOfficer)add(issues,'伤官见官');
      if(!canCarryOfficer)add(issues,'日主承载不足，官重身轻');
      if(sealClear)add(rescues,'印星化官生身');
      if(wealthClear)add(rescues,'财星生官');
    }else if(monthGod==='正印'||monthGod==='偏印'){
      basis.push('印星当令');
      ready=sealForce&&sealClear&&(officerClear||sevenClear||!strong);
      check('立格','印星当令',true,'月令取'+monthGod);
      check('成格','印星有根或透清',sealForce&&sealClear,'印须落实而非虚浮');
      check('成格','官杀生印或身印不过旺',officerClear||sevenClear||!strong,'身印过旺则须泄秀');
      check('破格','财坏印或身印壅滞',wealthDamagesSeal||(strong&&!outputClear),'财须对必要印路有可达制约，不能仅以财透为破格');
      check('救应','官杀生印、护印或食伤泄秀',officerClear||sevenClear||biClear||outputClear,'随病取药');
      if(wealthDamagesSeal)add(issues,'财星作用可达，存在财坏印');
      if(strong&&!outputClear)add(issues,'身印偏旺，缺少泄秀');
      if(officerClear||sevenClear)add(rescues,'官杀生印');
      if(biClear)add(rescues,'比劫护印制财');
      if(outputClear)add(rescues,'食伤泄秀');
    }else if(monthGod==='食神'){
      basis.push('食神当令');
      ready=foodForce&&foodClear&&canCarryOutput&&(wealthClear||sevenClear);
      check('立格','食神当令',true,'月令取食神');
      check('成格','食神有力而清',foodForce&&foodClear,'食神须得令落实');
      check('成格','身能任泄并有财杀承接',canCarryOutput&&(wealthClear||sevenClear),'食神生财或制杀方见作用');
      check('破格','枭神夺食或身弱泄过',owlTakesFood||!canCarryOutput,'枭须实际作用于食神，泄过须核承泄任务');
      check('救应','财制枭、食神生财或制杀',wealthClear||sevenClear,'须见可用承接');
      if(!canCarryOutput)add(issues,'日主偏弱，食神泄身');
      if(owlTakesFood)add(issues,'枭神夺食');
      if(wealthClear)add(rescues,'食神生财，财可制枭');
      if(sevenClear)add(rescues,'食神制杀');
    }else if(monthGod==='七杀'){
      basis.push('七杀当令');
      ready=sevenForce&&!mixed&&(foodClear||sealClear)&&canCarryOfficer;
      check('立格','七杀当令',true,'月令取七杀');
      check('成格','七杀有力',sevenForce,'杀须有根有气');
      check('成格','有制或有化',foodClear||sealClear,'食神制杀或印星化杀');
      check('破格','杀无制化、官杀混杂或杀重身轻',(!foodClear&&!sealClear)||mixed||!canCarryOfficer,'七杀不可无制无化，任杀须核承载');
      check('救应','食神制杀或印星化杀',foodClear||sealClear,'制化须清而有力');
      if(mixed)add(issues,'官杀混杂');
      if(!canCarryOfficer)add(issues,'杀重身轻');
      if(foodClear)add(rescues,'食神制杀');
      if(sealClear)add(rescues,'印星化杀生身');
    }else if(monthGod==='伤官'){
      basis.push('伤官当令');
      ready=hurtForce&&hurtClear&&(wealthClear||sealClear);
      check('立格','伤官当令',true,'月令取伤官');
      check('成格','伤官有力而清',hurtForce&&hurtClear,'伤官须得令落实');
      check('成格','生财或配印',wealthClear||sealClear,'伤官须有去处');
      check('破格','官伤冲战或身弱泄身',hurtOfficer||!canCarryOutput,'见官冲战与承泄不足分别列病，救应程度由病药净结算决定，不据此声称无救');
      check('救应','印制伤或财星通关',sealClear||wealthClear,'按原局生克先后判断');
      if(hurtOfficer)add(issues,'伤官见官');
      if(!canCarryOutput)add(issues,'日主偏弱，伤官泄身');
      if(wealthClear)add(rescues,'伤官生财或财通关');
      if(sealClear)add(rescues,'印星制伤护身');
    }else if(monthGod==='比肩'||name==='月劫用事'){
      basis.push('建禄当令，月令本身不另取用');
      ready=!weak&&(officerClear||sevenClear||wealthClear||outputClear);
      check('立格','建禄月劫当令',true,'月令比肩主事');
      check('成格','日主有力并向外取用',!weak&&(officerClear||sevenClear||wealthClear||outputClear),'须取财官食伤成局');
      check('破格','印比成群而外局无可取',(!officerClear&&!sevenClear&&!wealthClear&&!outputClear)||(sealForce&&!outputClear&&!wealthClear),'旺而无泄制则滞');
      check('救应','官杀制比或食伤生财',officerClear||sevenClear||wealthClear||outputClear,'向外取用方成');
      if(!officerClear&&!sevenClear&&!wealthClear&&!outputClear)add(issues,'外局无财官食伤可取');
      if(sealForce&&!outputClear&&!wealthClear)add(issues,'印比偏重，流通不足');
      if(officerClear||sevenClear)add(rescues,'官杀制比护财');
      if(wealthClear||outputClear)add(rescues,'食伤生财，泄秀成事');
    }else if(monthGod==='劫财'){
      basis.push('月刃当令，须有官杀制刃');
      ready=strong&&!mixed&&(officerClear||sevenClear);
      check('立格','月刃当令',true,'月令劫财主事');
      check('成格','刃旺且官杀制刃清纯',strong&&!mixed&&(officerClear||sevenClear),'制刃须有力而不混');
      check('破格','刃无制或制刃不清',(!officerClear&&!sevenClear)||mixed,'无制或官杀混杂均损格');
      check('救应','官杀清透制刃',officerClear||sevenClear,'以制刃为先');
      if(!officerClear&&!sevenClear)add(issues,'无官杀制刃');
      if(mixed)add(issues,'官杀混杂，制刃不清');
      if(officerClear||sevenClear)add(rescues,'官杀制刃');
    }else{
      basis.push('月令主气不足以建立常规格局');
    }
    if(capacity&&(monthGod==='正财'||monthGod==='偏财')&&!canCarryWealth){
      var carryingCheck=checks.find(function(item){return item.type==='成格'&&/身能任财/.test(item.label)});
      if(carryingCheck){carryingCheck.active=false;carryingCheck.evidence=capacity.text}
      add(issues,'净承载不足，身不任财');ready=false;
    }
    var supportProfiles=Object.assign({},profiles,{'日主':{stemEntries:[{position:2,pillar:'day',stem:dayStem,usable:true}]}});
    function path(chains){return interactionFlowAnalysis('',supportProfiles,interactions||{},[],chains).steps.every(function(step){return step.active})}
    var sealToDay=path([{from:['正印','偏印'],to:['日主'],action:'生'}]);
    var officerToSeal=path([{from:['正官','七杀'],to:['正印','偏印'],action:'生'}]);
    var foodToWealth=reaches(['食神'],['正财','偏财'],'生'),foodToKill=reaches(['食神'],['七杀'],'制');
    var hurtToWealth=reaches(['伤官'],['正财','偏财'],'生'),sealToHurt=reaches(['正印','偏印'],['伤官'],'制');
    var wealthToOfficer=reaches(['正财','偏财'],['正官'],'生'),officerToPeer=reaches(['正官','七杀'],['比肩','劫财'],'制');
    var functional=true;
    if(monthGod==='正官')functional=wealthToOfficer||(officerToSeal&&sealToDay);
    else if(monthGod==='正印'||monthGod==='偏印')functional=sealToDay&&(officerToSeal||!strong||path([{from:['日主'],to:['食神','伤官'],action:'生'}]));
    else if(monthGod==='食神')functional=foodToWealth||foodToKill;
    else if(monthGod==='七杀')functional=foodToKill||(officerToSeal&&sealToDay);
    else if(monthGod==='伤官')functional=hurtToWealth||sealToHurt;
    else if(monthGod==='劫财')functional=officerToPeer;
    check('成格','必要作用实际接通',functional,'兼见或透清不代替承接；必要链受合绊、合化失用或有效冲击时不成立');
    ready=ready&&functional;
    var rescueTests=[[/印星制伤|印制伤/,sealToHurt],[/印星化官|印星化杀|官杀生印/,officerToSeal&&sealToDay],[/印比扶身/,sealToDay||path([{from:['比肩','劫财'],to:['日主'],action:'扶'}])],[/食神制杀/,foodToKill],[/伤官生财/,hurtToWealth],[/食神生财|食伤生财/,foodToWealth||hurtToWealth],[/财星生官/,wealthToOfficer],[/官星护财|官杀制刃|官杀制比/,officerToPeer]];
    rescues=rescues.filter(function(rescue){var matched=rescueTests.filter(function(test){return test[0].test(rescue)});return !matched.length||matched.some(function(test){return test[1]})});
    checks.filter(function(item){return item.type==='救应'}).forEach(function(item){item.active=item.active&&rescues.length>0;if(!item.active)item.evidence+='；当前未接通对应救应，不按出现药神即有效';});
    var severe=issues.length>0;
    var rescued=rescues.length>0;
    var status=ready?(severe?(rescued?'成而有瑕':'已破'):'已成'):(severe&&basis.length?'已破':'待成');
    if(monthCommand&&monthCommand.ambiguous){
      add(issues,'杂气多神并用，有情无情尚未取清');
      status='待成';
    }
    formed=status==='已成'||status==='成而有瑕';
    return {
      name:name,
      god:monthGod,
      status:status,
      formed:formed,
      basis:basis.join('；'),
      issues:issues,
      rescues:rescues,
      keep:rescues.length?rescues.join('、'):'保留月令主线，待配合条件成立',
      remove:issues.length?issues.join('、'):'未见必须去除的主要破格点',
      authority:authority,
      checks:checks
    };
  }
  function tenGodCounts(dayStem,pillars){
    var counts={};
    function addGod(g){if(g)counts[g]=(counts[g]||0)+1}
    visiblePillarKeys(pillars).forEach(function(k){addGod(tenGod(dayStem,pillars[k][0]))});
    orderedPillarKeys(pillars).forEach(function(k){(HIDDEN[pillars[k][1]]||[]).forEach(function(s){addGod(tenGod(dayStem,s))})});
    return counts;
  }
  function tenGodProfiles(dayStem,pillars,monthCommand,interactions,options){
    var profiles={},fullInteractionFeedback=!!(options&&options.fullInteractionFeedback);
    function ensure(g){
      if(!profiles[g]){
        profiles[g]={count:0,revealed:0,roots:0,rootPower:0,monthCommand:false,monthHidden:false,stemPositions:[],branchPositions:[],stemEntries:[],branchEntries:[]};
        if(fullInteractionFeedback)Object.assign(profiles[g],{rawCount:0,rawRevealed:0,rawRoots:0});
      }
      return profiles[g];
    }
    visiblePillarKeys(pillars).forEach(function(k){
      var g=tenGod(dayStem,pillars[k][0]),position=PILLAR_META[k].index,state=fullInteractionFeedback?stemInteractionChange(position,interactions):{effect:'none',usable:true,retention:1,target:'',relations:[]};
      if(g){
        var stemItem=ensure(g);if(fullInteractionFeedback){stemItem.rawCount++;stemItem.rawRevealed++}
        if(state.usable){stemItem.count++;stemItem.revealed++;stemItem.stemPositions.push(position)}
        var stemEntry={position:position,stem:pillars[k][0],pillar:k,temporal:PILLAR_META[k].temporal};
        if(fullInteractionFeedback)Object.assign(stemEntry,{usable:state.usable,effect:state.effect,target:state.target,retention:state.retention,relations:state.relations.map(function(item){return item.text})});
        stemItem.stemEntries.push(stemEntry);
      }
    });
    orderedPillarKeys(pillars).forEach(function(k){
      (HIDDEN[pillars[k][1]]||[]).forEach(function(s,i){
        var g=tenGod(dayStem,s);
        if(!g)return;
        var item=ensure(g);
        var attack=branchAttackInfo(pillars[k][1],pillars,k,interactions),change=branchInteractionChange(k,interactions,fullInteractionFeedback),group=change&&change.kind==='group'?change.relation:null,originalElement=STEM_WX[s],changedByGroup=!!(group&&group.element!==originalElement),changedByInteraction=!!(change&&change.effect==='transform'&&change.element!==originalElement),boundByCombine=!!(change&&change.effect==='bind'),retention=(changedByGroup||changedByInteraction)?(change.challenged?0.5:0):(boundByCombine?change.retention:1);
        var rootWeight=(i===0?1:(i===1?0.6:0.3))*(1-attack.penalty)*retention;
        if(fullInteractionFeedback){item.rawCount++;item.rawRoots++}
        if(!fullInteractionFeedback||rootWeight>0){item.count++;item.roots++;item.branchPositions.push(PILLAR_META[k].index)}
        item.rootPower+=rootWeight;
        var branchEntry={position:PILLAR_META[k].index,stem:s,branch:pillars[k][1],pillar:k,temporal:PILLAR_META[k].temporal,hiddenIndex:i,rootPower:Math.round(rootWeight*100)/100,attacks:attack.reasons,groupChange:group&&group.name||'',transformedAway:(changedByGroup||changedByInteraction)&&!change.challenged};
        if(fullInteractionFeedback)Object.assign(branchEntry,{usable:rootWeight>0,branchChange:change&&change.name||'',boundByCombine:boundByCombine});
        item.branchEntries.push(branchEntry);
        if(k==='month'){
          item.monthHidden=true;
        }
      });
    });
    var commanded=monthCommand&&monthCommand.selectedStems&&monthCommand.selectedStems.length?monthCommand.selectedStems:[(HIDDEN[pillars.month[1]]||[])[0]];
    commanded.forEach(function(stem){
      var god=stem?tenGod(dayStem,stem):'';
      if(god)ensure(god).monthCommand=true;
    });
    return profiles;
  }
  function godPositions(profiles,names){
    var out=[];
    (names||[]).forEach(function(name){
      var item=profiles[name]||{};
      out=out.concat(item.stemPositions||[],item.branchPositions||[]);
    });
    return out.filter(function(x,i,a){return a.indexOf(x)===i});
  }
  function godPositionEntries(profiles,names){
    var out=[];
    (names||[]).forEach(function(name){
      var item=profiles[name]||{};
      out=out.concat((item.stemEntries||[]).filter(function(entry){return entry.usable!==false}).map(function(entry){return {position:entry.position,pillar:entry.pillar||NATAL_PILLAR_KEYS[entry.position],temporal:!!entry.temporal}}),(item.branchEntries||[]).filter(function(entry){return entry.usable!==false}).map(function(entry){return {position:entry.position,pillar:entry.pillar||NATAL_PILLAR_KEYS[entry.position],temporal:!!entry.temporal}}));
    });
    return out;
  }
  function godsConnected(profiles,left,right,maxDistance){
    var a=godPositionEntries(profiles,left),b=godPositionEntries(profiles,right),limit=maxDistance==null?2:maxDistance;
    return a.some(function(x){return b.some(function(y){return (x.temporal||y.temporal?1:Math.abs(x.position-y.position))<=limit})});
  }
  function godForce(profiles,name){
    var item=profiles[name]||{};
    var rootPower=item.rootPower==null?(item.roots||0):item.rootPower;
    return !!(item.revealed||item.monthCommand||rootPower>=1.2);
  }
  function godClear(profiles,name){
    var item=profiles[name]||{};
    return !!(item.revealed||item.monthCommand);
  }
  // Visibility and roots are independent evidence. godForce intentionally also
  // admits visible local actors; strict named formations must not reuse that OR.
  function godRootEvidence(profiles,name){
    var families=[['比肩','劫财'],['正印','偏印'],['食神','伤官'],['正财','偏财'],['正官','七杀']];
    var family=families.find(function(names){return names.indexOf(name)>=0})||[name];
    return family.reduce(function(out,rootGod){return out.concat(((profiles[rootGod]||{}).branchEntries||[]).filter(function(entry){return entry.usable!==false&&!entry.transformedAway&&(entry.rootPower||0)>0}).map(function(entry){return Object.assign({rootGod:rootGod},entry)}))},[]);
  }
  function godRooted(profiles,name){
    // Sharing qi does not replace the actor or duplicate its counted strength.
    // For example visible 壬 can root in 子藏癸; its control actor remains 壬.
    return godRootEvidence(profiles,name).length>0;
  }
  function rootedClearGod(profiles,names){
    return names.some(function(name){return godClear(profiles,name)&&godRooted(profiles,name)});
  }
  function assessOfficerMixture(profiles,interactions,pillars,capacity){
    var coexist=godClear(profiles,'正官')&&godClear(profiles,'七杀');
    var rooted=godRooted(profiles,'正官')&&godRooted(profiles,'七杀');
    var treatmentProfiles=Object.assign({},profiles),steps=[];
    if(pillars&&interactions){
      treatmentProfiles['日主']={stemEntries:[{position:2,pillar:'day',stem:pillars.day[0],usable:true}]};
      steps=interactionFlowAnalysis('',treatmentProfiles,interactions,[],[
        {from:['正官'],to:['正印','偏印'],action:'生'},
        {from:['七杀'],to:['正印','偏印'],action:'生'},
        {from:['正印','偏印'],to:['日主'],action:'生'}
      ]).steps;
    }
    var mediated=coexist&&rooted&&rootedClearGod(profiles,['正印','偏印'])&&steps.length===3&&steps.every(function(step){return step.active})&&!!(capacity&&capacity.canCarryOutputKill);
    return {coexist:coexist,rooted:rooted,mediated:mediated,unresolved:coexist&&rooted&&!mediated,steps:steps,status:!coexist?'未同透':(!rooted?'官杀并见线索':(mediated?'官杀并见有印承接':'官杀并见，去留待清'))};
  }
  function anyGodForce(profiles,names){
    return names.some(function(name){return godForce(profiles,name)});
  }
  function anyGodClear(profiles,names){
    return names.some(function(name){return godClear(profiles,name)});
  }
  function comboRuleId(name){
    var direct=COMBO_RULE_IDS[name];
    if(direct)return direct;
    var base=(name||'').replace('线索参考','').replace('待清','').replace('待制','').replace('待扶','');
    return COMBO_RULE_IDS[base+'格']||'ZP-CL-00';
  }
  function addCombo(out,name,score,basis){
    if(!out.some(function(x){return x.name===name}))out.push({name:name,ruleId:comboRuleId(name),ruleVersion:PATTERN_RULE_VERSION,score:score,basis:basis||''})
  }
  function addComboClue(out,name,text){
    if(!out.some(function(x){return x.name===name}))out.push({name:name,ruleId:comboRuleId(name),ruleVersion:PATTERN_RULE_VERSION,text:text});
  }
  function comboPatterns(monthGod,counts,context){
    var out=[],clues=[],profiles=(context&&context.profiles)||{};
    function has(name){return (counts[name]||0)>0}
    var mixed=context&&context.officerAssessment?context.officerAssessment.unresolved:godClear(profiles,'正官')&&godClear(profiles,'七杀')&&godRooted(profiles,'正官')&&godRooted(profiles,'七杀');
    var weak=context&&/弱/.test(context.strength||'');
    var strong=context&&/强/.test(context.strength||'');
    var canCarry=context&&context.carryingCapacity?context.carryingCapacity.canCarryOutputKill:(!weak||((context&&context.dayRootCount)||0)>=2||((context&&context.strengthSupport)||0)>=30);
    var tasks=context&&context.carryingCapacity&&context.carryingCapacity.tasks;
    var canCarryWealth=tasks&&tasks.wealth?tasks.wealth.strictFormationEligible:canCarry;
    var wealth=(counts['正财']||0)+(counts['偏财']||0);
    var output=(counts['食神']||0)+(counts['伤官']||0);
    var sealForce=anyGodForce(profiles,['正印','偏印']);
    var wealthForce=anyGodForce(profiles,['正财','偏财']);
    var wealthClear=anyGodClear(profiles,['正财','偏财']);
    var sealClear=anyGodClear(profiles,['正印','偏印']);
    var officerForce=godForce(profiles,'正官');
    var officerClear=godClear(profiles,'正官');
    var sevenForce=godForce(profiles,'七杀');
    var foodForce=godForce(profiles,'食神');
    var hurtForce=godForce(profiles,'伤官');
    var sevenClear=godClear(profiles,'七杀');
    var foodClear=godClear(profiles,'食神');
    var hurtClear=godClear(profiles,'伤官');
    var foodActive=profiles['食神']&&profiles['食神'].count;
    var sevenActive=profiles['七杀']&&profiles['七杀'].count;
    var foodKillClose=godsConnected(profiles,['食神'],['七杀'],2);
    var foodWealthClose=godsConnected(profiles,['食神'],['正财','偏财'],2);
    var wealthKillClose=godsConnected(profiles,['正财','偏财'],['七杀'],2);
    var wealthDivertsFood=wealthForce&&wealthClear&&foodWealthClose&&wealthKillClose;
    var foodKillFormed=godRooted(profiles,'七杀')&&godRooted(profiles,'食神')&&sevenClear&&foodClear&&foodKillClose&&canCarry&&!mixed&&!wealthDivertsFood;
    var hurtSealClose=godsConnected(profiles,['伤官'],['正印','偏印'],2);
    var bladeKillClose=godsConnected(profiles,['劫财'],['七杀'],2);
    if(mixed&&officerForce&&sevenForce)addCombo(out,'官杀混杂待清',96,'正官、七杀同时透出或得月令且各有根气，须先辨清浊与去留。');
    else if(mixed)addComboClue(clues,'官杀混杂线索参考','正官、七杀同时显现，但一方根气不足，先作清浊线索，不直接按官杀混杂定论。');
    var hurtOfficerActs=context&&context.interactions&&interactionFlowAnalysis('',profiles,context.interactions,[],[{from:['伤官'],to:['正官'],action:'制'}]).steps.some(function(step){return step.active});
    if(monthGod==='伤官'&&godClear(profiles,'正官')&&hurtOfficerActs)addCombo(out,'伤官见官待制',94,'伤官与正官有可达制约，救应程度另按对应作用结算。');
    else if(monthGod==='伤官'&&has('正官'))addComboClue(clues,'伤官见官线索参考','伤官当令而官星根透不足，先作见官线索，待岁运引动再论成败。');
    if(weak&&wealth>=4&&wealthForce&&!canCarryWealth)addCombo(out,'财多身弱待扶',92);
    else if(weak&&wealth>=3&&!canCarryWealth)addComboClue(clues,'财多身弱线索参考','财星数量偏多但承财条件不足，先作身财失衡线索。');
    if(monthGod==='七杀'&&sealForce&&sealClear)addCombo(out,'杀印相生格',95,'七杀当令，印星透出或得月令，杀有印化并能回生日主。');
    else if(monthGod==='七杀'&&(has('正印')||has('偏印')))addComboClue(clues,'杀印相生线索参考','七杀当令但印星未透且未得月令，不按杀印相生成格。');
    if(foodKillFormed)addCombo(out,'食神制杀格',90,'食神、七杀俱有根气并透出或得月令，日主能够承泄任杀，官杀不混，食杀位置可直接承接，且未见财星承食生杀。');
    else if(sevenActive&&foodActive){
      var foodKillGaps=[];
      if(!godRooted(profiles,'食神'))foodKillGaps.push('食神根气不足');
      if(!godRooted(profiles,'七杀'))foodKillGaps.push('七杀根气不足');
      if(!foodClear)foodKillGaps.push('食神未透且未得月令');
      if(!sevenClear)foodKillGaps.push('七杀未透且未得月令');
      if(!canCarry)foodKillGaps.push('日主承泄任杀不足');
      if(mixed)foodKillGaps.push('官杀混杂未清');
      if(wealthDivertsFood)foodKillGaps.push('财星承食生杀，食神有贪生忘克风险');
      if(!foodKillClose)foodKillGaps.push('食杀位置承接不足');
      if(!foodKillGaps.length)foodKillGaps.push('制杀条件未完整闭合');
      addComboClue(clues,'食神制杀线索参考','食神与七杀虽见，但'+foodKillGaps.join('、')+'，不按食神制杀成格。');
    }
    if(monthGod==='伤官'&&sealForce&&sealClear&&hurtSealClose)addCombo(out,'伤官配印格',88,'伤官当令，印星有根透且与伤官位置可承接，形成印制伤、护身之用。');
    else if(monthGod==='伤官'&&(has('正印')||has('偏印'))){
      var hurtSealGaps=[];
      if(!sealClear)hurtSealGaps.push('印星未透且未得月令');
      if(!hurtSealClose)hurtSealGaps.push('印伤位置承接不足');
      if(!hurtSealGaps.length)hurtSealGaps.push('印星根气不足');
      addComboClue(clues,'伤官配印线索参考','伤官当令但'+hurtSealGaps.join('、')+'，不按伤官配印成格。');
    }
    if(monthGod==='正官'&&sealForce&&sealClear&&!mixed)addCombo(out,'官印相生格',86,'正官当令，印星透出或得月令，官有印承并回生日主。');
    else if(monthGod==='正官'&&(has('正印')||has('偏印'))&&!mixed)addComboClue(clues,'官印相生线索参考','正官当令但印星未透且未得月令，不按官印相生成格。');
    var wealthMonth=monthGod==='正财'||monthGod==='偏财';
    var financeOfficerSeal=wealthMonth&&has('正官')&&(has('正印')||has('偏印'));
    var financeFlowClose=godsConnected(profiles,['正财','偏财'],['正官'],2)&&godsConnected(profiles,['正官'],['正印','偏印'],2);
    if(financeOfficerSeal&&wealthForce&&officerForce&&sealForce&&officerClear&&sealClear&&financeFlowClose&&!mixed){
      addCombo(out,'财官印相生格',84,'月令财星为主，正官与印星俱有根透且位置承接，财生官、官生印、印生身链条可用。');
    }else if(financeOfficerSeal){
      var gaps=[];
      if(!officerClear)gaps.push('正官未透且未得月令');
      if(!sealClear)gaps.push('印星未透且未得月令');
      if(!financeFlowClose)gaps.push('财、官、印位置承接不足');
      if(mixed)gaps.push('官杀混杂');
      if(!gaps.length)gaps.push('财官印根气不足');
      addComboClue(clues,'财官印相生线索参考','月令财星为主，财官印链可见；'+gaps.join('、')+'，不按财官印相生成格。');
    }else if((has('正财')||has('偏财'))&&(has('正官')||has('七杀'))&&(has('正印')||has('偏印'))&&!mixed){
      addComboClue(clues,'财官印相生线索参考','财、官杀、印俱见，但月令不以财为主线，只作顺生结构线索。');
    }
    var outputHasSeparateDuty=monthGod==='伤官'&&hurtClear&&foodKillFormed;
    if((monthGod==='食神'||monthGod==='伤官')&&foodForce&&hurtForce&&output>=3&&!outputHasSeparateDuty)addCombo(out,'食伤混杂待清',89);
    else if(outputHasSeparateDuty)addComboClue(clues,'食伤分工参考','伤官当令承担月令主线，另有透出或得令的食神严格成立制杀作用；主辅职责可分，不按食伤混杂重复扣分。');
    else if((monthGod==='食神'||monthGod==='伤官')&&has('食神')&&has('伤官'))addComboClue(clues,'食伤混杂线索参考','食神伤官俱见但根透或数量不足，先作混杂线索。');
    if(monthGod==='食神'&&foodForce&&foodClear&&wealthForce&&wealthClear&&canCarry&&godsConnected(profiles,['食神'],['正财','偏财'],2))addCombo(out,'食神生财格',82,'食神当令且有根透，财星有根透并与食神位置承接，日主有根或印比承接，泄秀生财链条可用。');
    else if(monthGod==='食神'&&(has('正财')||has('偏财'))){
      var foodWealthGaps=[];
      if(!foodClear)foodWealthGaps.push('食神根透不足');
      if(!wealthClear)foodWealthGaps.push('财星未透且未得月令');
      if(!canCarry)foodWealthGaps.push('日主承泄任财不足');
      if(!godsConnected(profiles,['食神'],['正财','偏财'],2))foodWealthGaps.push('食神与财星位置承接不足');
      if(!foodWealthGaps.length)foodWealthGaps.push('食财力量未达成立条件');
      addComboClue(clues,'食神生财线索参考','食神当令并见财星，但'+foodWealthGaps.join('、')+'，不按食神生财成格。');
    }
    if(monthGod==='伤官'&&wealthForce&&wealthClear)addCombo(out,'伤官生财格',78,'伤官当令，财星透出或得月令，泄秀生财链条可用。');
    else if(monthGod==='伤官'&&(has('正财')||has('偏财')))addComboClue(clues,'伤官生财线索参考','伤官当令但财星未透且未得月令，不按伤官生财成格。');
    if(monthGod==='劫财'&&strong&&sevenForce&&sevenClear&&!mixed&&bladeKillClose&&!(foodClear&&foodKillClose))addCombo(out,'羊刃驾杀格',91,'月刃当令，日主与羊刃有力，七杀清透且位置可制刃；未见食神透清近贴制杀，形成以杀驾刃的制化结构。');
    else if(monthGod==='劫财'&&has('七杀')){
      var bladeKillGaps=[];
      if(!strong)bladeKillGaps.push('日主与羊刃承杀不足');
      if(!sevenClear)bladeKillGaps.push('七杀未透且未得月令');
      if(mixed)bladeKillGaps.push('官杀混杂');
      if(!bladeKillClose)bladeKillGaps.push('刃杀位置承接不足');
      if(foodClear&&foodKillClose)bladeKillGaps.push('食神透清近贴制杀，杀不专任驾刃');
      if(!bladeKillGaps.length)bladeKillGaps.push('杀刃力量未达清纯条件');
      addComboClue(clues,'羊刃驾杀线索参考','月刃与七杀俱见，但'+bladeKillGaps.join('、')+'，不按羊刃驾杀成格。');
    }
    if(wealthClear&&sevenForce&&sevenClear&&!mixed)addCombo(out,'财滋弱杀格',72,'财星与七杀皆清，财可生杀，作为辅助结构参考。');
    else if((has('正财')||has('偏财'))&&(has('七杀')||monthGod==='七杀'))addComboClue(clues,'财滋弱杀线索参考','财杀俱见但根透不足，只作财生杀线索。');
    out.sort(function(a,b){return b.score-a.score});
    return {formed:out.map(function(x){return x.name}),details:out,clues:clues};
  }
  function qualifyComboFlows(result,profiles,interactions){
    var requirements={
      '杀印相生格':[['七杀'],['正印','偏印']],
      '食神制杀格':[['食神'],['七杀']],
      '伤官配印格':[['伤官'],['正印','偏印']],
      '官印相生格':[['正官'],['正印','偏印']],
      '财官印相生格':[['正财','偏财'],['正官'],['正印','偏印']],
      '食神生财格':[['食神'],['正财','偏财']],
      '伤官生财格':[['伤官'],['正财','偏财']],
      '羊刃驾杀格':[['劫财'],['七杀']]
    };
    result.details=result.details.filter(function(item){
      var required=requirements[item.name];if(!required)return true;
      var missing=required.filter(function(names){return !rootedClearGod(profiles,names)});
      var flow=interactionFlowAnalysis(item.name,profiles,interactions,[]);
      var blocked=flow.steps.filter(function(step){return !step.active});
      item.qualification={rootedAndClear:!missing.length,rootEvidence:required.map(function(names){return {gods:names,evidence:names.map(function(name){return {god:name,clear:godClear(profiles,name),roots:godRootEvidence(profiles,name)}})}}),steps:flow.steps};
      if(!missing.length&&!blocked.length)return true;
      var gaps=missing.map(function(names){return names.join('/')+'未同时具备根气与透清'}).concat(blocked.map(function(step){return step.text}));
      addComboClue(result.clues,item.name.replace(/格$/,'')+'线索参考',gaps.join('；')+'；局部功能另论，不按严格组合成格。');
      return false;
    });
    result.formed=result.details.map(function(item){return item.name});
    return result;
  }
  function monthComboPatterns(command,counts,context){
    var result={formed:[],details:[],clues:[]};
    unique(command&&command.selectedGods||[]).forEach(function(god){
      var candidate=comboPatterns(god,counts,context);
      if(god==='劫财'&&command.baseGod!=='劫财'){
        candidate.details=candidate.details.filter(function(item){return item.name!=='羊刃驾杀格'});
        addComboClue(candidate.clues,'羊刃驾杀线索参考','月支本气不是劫财；藏干比劫透出只说明月令取用变化，不能代替月刃当令的资格。');
      }
      candidate.details.forEach(function(item){if(!result.details.some(function(old){return old.name===item.name}))result.details.push(item)});
      candidate.clues.forEach(function(item){if(!result.clues.some(function(old){return old.name===item.name}))result.clues.push(item)});
    });
    return qualifyComboFlows(result,context.profiles,context.interactions);
  }
  function tenGodDiagnostics(counts,profiles,strength,specials){
    var out=[],specialName=trueSpecialPattern(specials),trueSpecial=!!specialName;
    function add(name,ruleId,status,evidence,boundary,authority){out.push({name:name,ruleId:ruleId,ruleVersion:PATTERN_RULE_VERSION,status:status,evidence:evidence,boundary:boundary,authority:authority})}
    var weak=/弱/.test(strength),strong=/强/.test(strength);
    var killForce=godForce(profiles,'七杀'),foodForce=godForce(profiles,'食神'),sealForce=anyGodForce(profiles,['正印','偏印']);
    if(weak&&killForce&&!foodForce&&!sealForce&&!/^从格：从(?:杀|官|官杀)格/.test(specialName)){
      add('杀重身轻','ZP-TS-01','明确成立','日主'+strength+'，七杀有根气，未见有力食神制杀或印星化杀。','若食神或印星在原局有根透并能近贴作用，应改判为有制有化，不作纯粹杀重身轻。','《三命通会》“煞重身轻终身有损”；《滴天髓阐微》以杀强身弱须印化或食制校验');
    }
    var outputForce=anyGodForce(profiles,['食神','伤官']),wealthClear=anyGodClear(profiles,['正财','偏财']),officerClear=anyGodClear(profiles,['正官','七杀']),sealClear=anyGodClear(profiles,['正印','偏印']);
    if(strong&&outputForce&&!wealthClear&&!officerClear&&!sealClear&&!trueSpecial){
      add('身旺无依','ZP-TS-02','明确成立','日主'+strength+'且食伤有气，但财、官杀、印均未形成有根透的可承接主线，也未达到从格或专旺格条件。','若财官印任一方在原局有根透可用，或特殊格局严格成立，则不作身旺无依。','《渊海子平》“身旺无依”；《三命通会》伤官格以身旺而无财印官杀承接为无倚边界');
    }
    return out;
  }
  function specialRuleForLabel(label){
    var key=(label||'').replace(/^(?:从格：|化气格：|专旺格：)/,'');
    return SPECIAL_PATTERN_RULES[key]||null;
  }
  function trueSpecialDetail(specials){
    var name=trueSpecialPattern(specials);
    return ((specials&&specials.details)||[]).find(function(item){return item.name===name})||null;
  }
  function specialPatterns(dayStem,pillars,scores,counts,strength,roots,interactions,profiles){
    var out=[],dayWx=STEM_WX[dayStem],total=WUXING.reduce(function(sum,w){return sum+(scores[w]||0)},0)||1;
    out.details=[];
    var resource=resourceElement(dayWx),weighted=strengthScore(dayStem,pillars,{fullInteractionFeedback:true}).support;
    var rootLabels={year:'年支',month:'月支',day:'日支',hour:'时支'};
    var sameElementRoots=(roots||[]).filter(function(item){return typeof item==='string'||item.usable!==false&&!item.transformedAway}).map(function(item){return typeof item==='string'?item:item.text});
    var killing=(counts['正官']||0)+(counts['七杀']||0);
    var wealth=(counts['正财']||0)+(counts['偏财']||0),output=(counts['食神']||0)+(counts['伤官']||0),sealGods=(counts['正印']||0)+(counts['偏印']||0);
    var supportGods=(counts['比肩']||0)+(counts['劫财']||0)+sealGods;
    function check(id,label,met,evidence){return {id:id,label:label,met:!!met,evidence:evidence}}
    function addTrue(prefix,key,checks,flowChecks,target){
      var name=prefix+key,rule=SPECIAL_PATTERN_RULES[key];
      if(!rule)return;
      var originalFlow=flowChecks||checks;
      checks=checks.map(function(item,index){return Object.assign({},item,{ruleId:rule.id+'-Q'+(index+1)})});
      flowChecks=originalFlow.map(function(item){return checks.find(function(versioned){return versioned.id===item.id})||Object.assign({},item,{ruleId:rule.id+'-F'})});
      out.push(name);
      out.details.push({
        name:name,key:key,ruleId:rule.id,ruleVersion:PATTERN_RULE_VERSION,type:rule.type,status:'已成',tier:rule.tier,potentialScore:rule.score,
        sourceSystem:rule.sourceSystem,source:rule.source.slice(),target:target||'',checks:checks,flowChecks:flowChecks||checks,
        completion:checks.length?checks.filter(function(item){return item.met}).length/checks.length:0,
        evidence:checks.filter(function(item){return item.met}).map(function(item){return item.evidence}),
        counterEvidence:checks.filter(function(item){return !item.met}).map(function(item){return item.evidence})
      });
    }
    function allMet(checks){return checks.every(function(item){return item.met})}
    function followCandidate(name,count,element){
      var power=(scores[element]||0)/total;
      var checks=[
        check('no-root','日主无同类根气',sameElementRoots.length===0,sameElementRoots.length?'日主仍见同五行根气'+sameElementRoots.join('、'):'日主未见同五行根气'),
        check('weak-support','扶身不逆势',weighted<18&&supportGods===0,'扶身权重'+Math.round(weighted)+'，印比计数'+supportGods),
        check('force-count','所从之神成势',count>=4,'所从十神计数'+count),
        check('month-command','所从之神得令',BRANCH_WX[pillars.month[1]]===element,pillars.month[1]+'月以'+BRANCH_WX[pillars.month[1]]+'为月令气'),
        check('force-ratio','所从五行占优',power>=0.45,element+'约占全局'+Math.round(power*100)+'%')
      ];
      if(name==='从杀格'){
        var reverseOutput=(scores[gen[dayWx]]||0)/total;
        checks.push(check('no-output-reversal','无有力食伤逆制官杀',reverseOutput<0.25,gen[dayWx]+'约占全局'+Math.round(reverseOutput*100)+'%'));
      }
      if(allMet(checks))addTrue('从格：',name,checks,checks.slice(2),element);
      else if(sameElementRoots.length===0&&weighted<30&&supportGods<=1&&count>=3)out.push('特殊线索参考：'+({从杀格:'假从杀倾向',从财格:'假从财倾向'}[name])+'（月令、势力或扶身条件未全合）。');
      }
    followCandidate('从杀格',killing,officerElement(dayWx));
    if(!out.some(function(x){return /^从格：/.test(x)}))followCandidate('从财格',wealth,ctrl[dayWx]);
    if(!out.some(function(x){return /^从格：/.test(x)})){
      var outputElement=gen[dayWx],wealthElement=ctrl[dayWx],outputPower=(scores[outputElement]||0)/total,wealthPower=(scores[wealthElement]||0)/total;
      var sealForce=anyGodForce(profiles||{},['正印','偏印']);
      var childFlow=interactionFlowAnalysis('',profiles,interactions,[],[{from:['食神','伤官'],to:['正财','偏财'],action:'生'}]);
      var sealReverses=sealForce&&interactionFlowAnalysis('',profiles,interactions,[],[{from:['正印','偏印'],to:['食神','伤官'],action:'制'}]).steps.some(function(step){return step.active});
      var childProfiles=Object.assign({},profiles,{'日主':{stemEntries:[{position:2,pillar:'day',stem:dayStem,usable:true}]}});
      var officerAttack=interactionFlowAnalysis('',childProfiles,interactions,[],[{from:['正官','七杀'],to:['日主'],action:'制'}]).steps[0];
      var outputRescue=interactionFlowAnalysis('',childProfiles,interactions,[],[{from:['食神','伤官'],to:['正官','七杀'],action:'制'}]).steps[0];
      var officerReverses=anyGodForce(profiles,['正官','七杀'])&&officerAttack&&officerAttack.active&&!(outputRescue&&outputRescue.active&&outputRescue.distance<=officerAttack.distance);
      var childChecks=[
        check('output-force','食伤成势',output>=4&&outputPower>=0.45,'食伤计数'+output+'，'+outputElement+'约占全局'+Math.round(outputPower*100)+'%'),
        check('output-month','食伤或财星承势',BRANCH_WX[pillars.month[1]]===outputElement||BRANCH_WX[pillars.month[1]]===wealthElement,pillars.month[1]+'月以'+BRANCH_WX[pillars.month[1]]+'为月令气；不以日主无根为从儿资格'),
        check('no-seal-reversal','无有力印星逆制',!sealReverses,sealReverses?'印星有可达逆制食伤作用':'未见有效印星逆制食伤；比劫根气不单独否决从儿'),
        check('no-officer-reversal','无官杀逆制起战',!officerReverses,officerReverses?'官杀可达日主，顺泄链有逆制':'未见官杀逆制日主'),
        check('child-has-child','食伤继续生财',wealth>=1&&wealthPower>=0.06&&childFlow.steps.every(function(step){return step.active}),'财星计数'+wealth+'，'+wealthElement+'约占全局'+Math.round(wealthPower*100)+'%；'+childFlow.text)
      ];
      if(allMet(childChecks))addTrue('从格：','从儿格',childChecks,[childChecks[0],childChecks[4]],outputElement);
      else if(output>=3&&outputPower>=0.35&&sealGods<=1)out.push('特殊线索参考：假从儿倾向（食伤势力、财星承接或印星反制条件未全合）。');
    }

    var selfElementPower=(scores[dayWx]||0)/total,outputElementForStrong=gen[dayWx],opposingElement=officerElement(dayWx);
    var outputRatio=(scores[outputElementForStrong]||0)/total,opposingRatio=(scores[opposingElement]||0)/total,branches=orderedPillarKeys(pillars).map(function(k){return pillars[k][1]});
    var groupSets={木:['寅卯辰','亥卯未'],火:['巳午未','寅午戌'],金:['申酉戌','巳酉丑'],水:['亥子丑','申子辰']};
    function containsGroup(group){return group.split('').every(function(branch){return branches.indexOf(branch)>=0})}
    var directionalGroup=dayWx==='土'?branches.filter(function(branch){return '辰戌丑未'.indexOf(branch)>=0}).length>=3:(groupSets[dayWx]||[]).some(containsGroup);
    var strongName={木:'曲直格',火:'炎上格',土:'稼穑格',金:'从革格',水:'润下格'}[dayWx]||'专旺格';
    var strongChecks=[
      check('same-force','本气一方成势',(dayWx==='土'||weighted>=60)&&selfElementPower>=0.60,'扶身权重'+Math.round(weighted)+'，'+dayWx+'约占全局'+Math.round(selfElementPower*100)+'%'+(dayWx==='土'?'；稼穑以库土聚势验真，不沿用库间冲刑削根':'') ),
      check('season','本气得令',BRANCH_WX[pillars.month[1]]===dayWx,pillars.month[1]+'月以'+BRANCH_WX[pillars.month[1]]+'为月令气'),
      check('directional-group','方局完整',directionalGroup,'地支'+branches.join('')+(directionalGroup?'形成对应方局':'未形成完整对应方局')),
      check('no-opposition','无强力逆局',opposingRatio<0.12,opposingElement+'约占全局'+Math.round(opposingRatio*100)+'%'),
      check('outlet','化神泄秀有路',outputRatio>=0.06,outputElementForStrong+'约占全局'+Math.round(outputRatio*100)+'%')
    ];
    if(allMet(strongChecks))addTrue('专旺格：',strongName,strongChecks,[strongChecks[0],strongChecks[4]],dayWx);
    else if(weighted>=68&&selfElementPower>0.5)out.push('特殊线索参考：假'+strongName.replace('格','')+'格倾向');

    var transform={甲己:'土',乙庚:'金',丙辛:'水',丁壬:'木',戊癸:'火'};
    Object.keys(transform).forEach(function(pair){
      var other=pair[0]===dayStem?pair[1]:(pair[1]===dayStem?pair[0]:''),target=transform[pair];
      if(other&&(pillars.month[0]===other||pillars.hour[0]===other)){
        var transformQualification=strictDayTransformQualification(dayStem,pillars,pair,target,interactions&&interactions.stemCombines||[]),transformChecks=transformQualification.checks;
        if(allMet(transformChecks))addTrue('化气格：',pair+'化'+target,transformChecks,[transformChecks[0],transformChecks[1],transformChecks[3]],target);
        else out.push('特殊线索参考：'+pair+'化'+target+'未成倾向（月时专合、得令、原始无根、变气前成势或无破条件未全）。');
      }
    });
    return out;
  }
  function patternLevel(mainPattern,monthGod,counts,strength,specials){
    if(mainPattern==='未见明确成格')return '普通格局，需结合大运成败细断';
    if(/官杀混杂|杀重混官/.test(mainPattern))return mainPattern+'，官杀未清，日主'+strength+'，层次需看印比扶身、去留清浊与大运承接';
    if(/伤官见官/.test(mainPattern))return mainPattern+'，伤官与官星相战，层次先看印制、财通与行运解法';
    if(/财多身弱/.test(mainPattern))return mainPattern+'，财旺身弱，层次先看印比扶身与能否承财';
    if(/食伤混杂/.test(mainPattern))return mainPattern+'，食伤不清，层次先看去留、流通和制化';
    if(/杀印相生|食神制杀|伤官配印|官印相生|财官印相生|食神生财|羊刃驾杀/.test(mainPattern))return mainPattern.replace('格','')+'，结构闭环，层次偏高';
    if(/伤官生财|财滋弱杀/.test(mainPattern))return mainPattern.replace('格','')+'，有成事结构，层次中上';
    if((specials||[]).some(function(x){return /^从格：|^化气格：|^专旺格：/.test(x)}))return '特殊格局成立，层次需看真假与大运承接';
    return '格局未纯，层次需结合大运细断';
  }
  function patternVerdict(mainPattern,strength,specials){
    if((specials||[]).some(function(x){return /^从格：|^化气格：|^专旺格：/.test(x)}))return '特殊格局成格，需重点校验真假与行运承接。';
    if(/官杀混杂|杀重混官/.test(mainPattern))return '待清：官杀混杂，先看印化、去杀留官或去官留杀，未清前不按高格直断。';
    if(/伤官见官/.test(mainPattern))return '待制：伤官见官，先看印星制伤、财星通关或大运化解。';
    if(/财多身弱/.test(mainPattern))return '待扶：财多身弱，先看印比扶身，身能任财后再论财格成败。';
    if(/食伤混杂/.test(mainPattern))return '待清：食伤混杂，先看去留、流通和制化，未清前不按食伤成格直断。';
    if(/杀印相生|食神制杀|伤官配印|官印相生|财官印相生|食神生财|羊刃驾杀/.test(mainPattern))return '成格有力：结构闭环，但仍需看破格、清浊和大运是否承接。';
    if(/伤官生财|财滋弱杀/.test(mainPattern))return '有成格线索：可成事，但层次取决于流通、根气与忌神是否被制化。';
    if(mainPattern==='未见明确成格')return '未见明确成格：先按命格、扶抑、调候和大运细断。';
    return '格局状态需结合全盘细断。';
  }
  function dominantElementConflict(scores){
    var pairs=[
      {a:'水',b:'火',bridge:'木',name:'水火相战'},
      {a:'金',b:'木',bridge:'水',name:'金木相战'},
      {a:'木',b:'土',bridge:'火',name:'木土相战'},
      {a:'火',b:'金',bridge:'土',name:'火金相战'},
      {a:'土',b:'水',bridge:'金',name:'土水相战'}
    ];
    var total=WUXING.reduce(function(sum,w){return sum+(scores[w]||0)},0)||1;
    return pairs.find(function(p){return (scores[p.a]||0)/total>=0.24&&(scores[p.b]||0)/total>=0.24})||null;
  }
  function remedyAdvice(dayStem,pillars,scores,counts,mainPattern,phenomena){
    var out=[],dayWx=STEM_WX[dayStem],resource=resourceElement(dayWx),wealth=ctrl[dayWx];
    function add(title,text,use){out.push({title:title,text:text,use:use||[]})}
    if(/官杀混杂/.test(mainPattern))add('官杀混杂','先清官杀，取印化杀，或去杀留官、去官留杀；忌财再生杀。',[resource,dayWx]);
    if(/伤官见官/.test(mainPattern))add('伤官见官','先看印制伤，或以财星通关，避免食伤直冲官星。',[resource,wealth]);
    if(/财多身弱/.test(mainPattern))add('财多身弱','先用印比扶身，身能任财后再论财格成败。',[resource,dayWx]);
    if(/食伤混杂/.test(mainPattern))add('食伤混杂','先清食伤去留，或用财泄秀、印星制化。',[wealth,resource]);
    (phenomena||[]).forEach(function(item){
      if(item.ruleId==='ZP-QX-001')add(item.name,'印土虽能化杀生身，但原局土势过重已转成壅滞；先取金增强承载，水只作润泄佐用，木疏土须看日主能否任财。',item.useCorrection.primary.concat(item.useCorrection.secondary));
      else if(item.category==='五行气象与生扶太过病象')add(item.name,'印星虽有生扶作用，但原局已过量转成壅滞；先取'+item.useCorrection.primary.join('、')+'增强承载，'+item.useCorrection.conditional.join('、')+'制印须先校验日主能否承受。',item.useCorrection.primary);
      else if(item.category==='五行气象与泄身反伤病象')add(item.name,item.useCorrection.primary[0]+'可同时生扶'+item.target.element+'并制约过旺'+item.useCorrection.restrain[0]+'，'+item.target.element+'比劫用于恢复承载；先止泄身太过，再谈原格泄秀。',item.useCorrection.primary);
    });
    var conflict=dominantElementConflict(scores);
    if(conflict)add(conflict.name,conflict.name+'，取'+conflict.bridge+'作通关参考。',[conflict.bridge]);
    if(!out.length)add('病药待细分','未见特别突出的病药冲突，仍以扶抑、调候、格局层次为主。',[]);
    return out;
  }
  function trueSpecialPattern(specials){
    var details=((specials&&specials.details)||[]).slice();
    if(details.length){
      var priority={化气格:3,专旺格:2,从格:1};
      details.sort(function(a,b){return (priority[b.type]||0)-(priority[a.type]||0)});
      return details[0].name;
    }
    return ((specials||[]).find(function(x){return /^从格：|^化气格：|^专旺格：/.test(x)})||'');
  }
  function specialContextState(detail){
    if(!detail)return '';
    var mode=detail.type==='从格'?'顺从'+detail.target+'旺势':(detail.type==='化气格'?'顺从化神'+detail.target:'顺从'+detail.target+'一方专旺');
    return detail.name+'严格成立，'+mode+'；月令常格与普通旺衰只作验真背景，不再据此另提扶身、泄耗或常格救应。';
  }
  function specialContextRemedy(detail,useful){
    if(!detail)return [];
    var boundary=detail.name==='从格：从杀格'?'避免印比扶身或食伤逆制官杀破从':(detail.name==='从格：从财格'?'避免印比扶身、比劫分财或官杀泄财破从':(detail.name==='从格：从儿格'?'避免印星回克食伤，并保留财星承接':(detail.type==='化气格'?'避免还原日主或克破化神':'避免财官逆势克破旺神，并保留泄秀出口')));
    return [{title:'特殊格顺势',text:detail.name+'已通过全部成立条件；以'+detail.target+'势的连续与清纯为守成重点，'+boundary+'。',use:(useful&&useful.primaryUse||useful&&useful.use||[]).slice()}];
  }
  function specialContextFactors(detail){
    if(!detail)return [];
    return (detail.checks||[]).map(function(item){return {type:item.met?'成':'界',text:item.label+'：'+item.evidence+'。',ruleId:item.ruleId}});
  }
  function specialContextAuthority(detail){
    if(!detail)return null;
    return {ruleId:detail.ruleId,ruleVersion:PATTERN_RULE_VERSION,framework:'特殊格逐项验真、独立语境与顺势取用',principle:detail.name+'只有在全部成立条件与顺势链同时通过时才定格；常格成败、扶抑与病药只作真假边界，不重复裁断。',source:(detail.source||[]).join('；')};
  }
  function patternBasis(dayStem,monthBranch,monthGod,monthCommand){
    if(monthCommand){
      if(monthCommand.ambiguous)return monthCommand.basis+' 当前保留'+monthCommand.selectedGods.join('、')+'兼用线索，不强定单一格。';
      return monthCommand.basis+' '+monthCommand.primaryStem+'为'+dayStem+'日主的'+monthGod+'，据此定命格主线。';
    }
    var main=(HIDDEN[monthBranch]||[])[0];
    return main?'月令'+monthBranch+'主气'+main+'为'+dayStem+'日主的'+monthGod+'，以月令定命格。':'月令主气待判，命格需结合全盘。';
  }
  function patternState(primary,monthGod,counts,strength,mainPattern,revealed,mixed){
    var out=[];
    if(mixed)out.push(primary+'不纯，官杀混杂');
    else out.push(primary+'气较专');
    if(!revealed.length)out.push('月令藏干未透，多看地支会合与全盘流通');
    if(strength.indexOf('弱')>=0)out.push('日主'+strength+'，需印比化扶');
    else if(strength.indexOf('强')>=0)out.push('日主'+strength+'，宜泄耗制化');
    else out.push('日主'+strength+'，重在流通平衡');
    if(mainPattern&&mainPattern!=='未见明确成格')out.push('结构可看'+mainPattern);
    return out.join('，')+'。';
  }
  function patternFactors(dayStem,pillars,counts,strength,mainPattern,roots,revealed,comboClues){
    var out=[];
    function has(name){return (counts[name]||0)>0}
    function add(type,text){out.push({type:type,text:text})}
    if(revealed.length)add('成','月令藏干透出，格局有明线。');
    else add('待','月令藏干未透，重看会支、透干引动与大运。');
    if(roots.length)add('成','日主有根：'+roots.join('、')+'。');
    else add('待','日主未见直接通根，旺衰需看印比与月令。');
    if(/官杀混杂/.test(mainPattern))add('破','官杀并见，清浊未分，须去留或印化。');
    if(/伤官见官/.test(mainPattern))add('破','伤官冲官，须印制伤或财星通关。');
    if(/财多身弱/.test(mainPattern))add('破','财星偏重而身弱，先扶身再任财。');
    if(/食伤混杂/.test(mainPattern))add('破','食神伤官并杂，先辨去留与泄化。');
    if(/杀印相生/.test(mainPattern)&&has('七杀')&&(has('正印')||has('偏印')))add('成','杀有印化，形成杀印相生闭环。');
    if(/官印相生/.test(mainPattern)&&has('正官')&&(has('正印')||has('偏印')))add('成','官有印承，形成官印相生闭环。');
    if(/伤官配印/.test(mainPattern)&&has('伤官')&&(has('正印')||has('偏印')))add('成','伤官见印，有制化成格条件。');
    if(/食神制杀/.test(mainPattern)&&has('食神')&&has('七杀'))add('成','食神制杀，有制杀成权条件。');
    if(/羊刃驾杀/.test(mainPattern)&&has('劫财')&&has('七杀'))add('成','羊刃有七杀驾制，形成制刃成权条件。');
    if(/伤官生财/.test(mainPattern)&&has('伤官')&&(has('正财')||has('偏财')))add('成','伤官生财，有泄秀生财路径。');
    if(/食神生财/.test(mainPattern)&&has('食神')&&(has('正财')||has('偏财')))add('成','食神生财，食神泄秀并由财星承接。');
    (comboClues||[]).forEach(function(item){add('参',item.name+'：'+item.text)});
    return out;
  }
  function patternClarity(mainPattern,counts,strength,structures,flow,conflicts,diseaseNet,specialDetail){
    function has(name){return (counts[name]||0)>0}
    var main=(structures||[]).find(function(item){return item.role==='主格'}),status=(main&&main.status)||'待成';
    var flowGood=!!(flow&&flow.steps&&flow.steps.length&&flow.steps.every(function(item){return item.active}));
    var residual=(diseaseNet&&diseaseNet.partial||[]).concat(diseaseNet&&diseaseNet.unresolved||[]);
    var relevant=conflictsForPattern(mainPattern,conflicts),activeConflictNames=(flow&&flow.sequence||[]).filter(function(item){return item.breaker&&item.breaker.active}).map(function(item){return item.name});
    var activeConflict=relevant.some(function(item){return activeConflictNames.indexOf(item.name)>=0});
    var strict=status==='已成'&&flowGood&&!residual.length&&!activeConflict;
    if(specialDetail){
      var specialChecks=(specialDetail.checks||[]).every(function(item){return item.met});
      return {level:specialChecks&&flowGood?'清':'有瑕',text:specialDetail.name+(specialChecks&&flowGood?'严格条件齐备，顺势链完整，按特殊格自身语境论清。':'仍有特殊格条件或顺势链缺口，暂按有瑕论。'),causeGroup:'special-qualification',numericOwner:'clarity'};
    }
    if(/官杀混杂|杀重混官/.test(mainPattern)){
      return {level:'浊',text:'官杀并见，清浊未分；先看去杀留官、去官留杀，或以印化杀。',causeGroup:'officer-killing-mix',numericOwner:'disease'};
    }
    if(/伤官见官/.test(mainPattern)){
      return {level:'冲战',text:'伤官与官星相见，先看印制伤、财星通关，忌食伤再冲官。',causeGroup:'officer-output-conflict',numericOwner:'disease'};
    }
    if(/食伤混杂/.test(mainPattern)){
      return {level:'不清',text:'食神伤官并杂，先辨去留，喜财泄秀或印星制化。',causeGroup:'output-mix',numericOwner:'disease'};
    }
    if(/财多身弱/.test(mainPattern)){
      return {level:'偏浊',text:'财星偏重而日主'+strength+'，先扶身，身能任财后格局转清。',causeGroup:'carrying-capacity',numericOwner:'disease'};
    }
    if(/杀印相生/.test(mainPattern)&&has('七杀')&&(has('正印')||has('偏印'))){
      return {level:'较清',text:'杀印相生有闭环，杀有印化，清处在印能承杀、身能受生。'};
    }
    if(/官印相生/.test(mainPattern)&&has('正官')&&(has('正印')||has('偏印'))){
      return {level:'较清',text:'官印相生有闭环，官有印承，清处在官印顺生。'};
    }
    if(/羊刃驾杀/.test(mainPattern)&&has('劫财')&&has('七杀')){
      return {level:'较清',text:'羊刃驾杀以七杀制刃为清，清处在刃杀两停、七杀清专且日主能承。'};
    }
    if(/伤官配印/.test(mainPattern)&&has('伤官')&&(has('正印')||has('偏印'))){
      return {level:strict?'较清':'可清',text:strict?'伤官配印严检通过，印有根透、印伤作用可达且无残余破点，按较清论。':'伤官配印以印制伤为清，仍须核验印是否有力、财是否坏印及印伤作用是否可达。',causeGroup:'injury-seal-purity',numericOwner:'clarity'};
    }
    if(/食神制杀/.test(mainPattern)&&has('食神')&&has('七杀')){
      return {level:strict?'较清':'可清',text:strict?'食神制杀严检通过，食杀作用可达且无枭夺食或残病，按较清论。':'食神制杀以制杀为清，仍须核验食神是否有力、食杀是否相称且不被夺。',causeGroup:'food-killing-purity',numericOwner:'clarity'};
    }
    if(/食神生财/.test(mainPattern)&&has('食神')&&(has('正财')||has('偏财'))){
      return {level:'较清',text:'食神生财以食神清透、财星承接为清，成败看日主能否承泄任财且枭印不夺食。'};
    }
    return {level:'待辨',text:'清浊不取单点结论，需结合月令、透干、通根与大运去留。'};
  }
  function comboConflictAnalysis(counts,patternNames,profiles,interactions){
    var out=[];
    var patternText=Array.isArray(patternNames)?patternNames.join('、'):(patternNames||'');
    function has(name){return (counts[name]||0)>0}
    function total(names){return names.reduce(function(sum,name){return sum+(counts[name]||0)},0)}
    var conflictRuleIds={枭神夺食:'ZP-BR-05',印制食伤:'ZP-BR-06',财坏印:'ZP-BR-07',比劫夺财:'ZP-BR-08',未见明显组合冲突:'ZP-BR-00'};
    function add(name,effect,text){
      var pairs={枭神夺食:[['偏印'],['食神']],印制食伤:[['正印','偏印'],['伤官']],财坏印:[['正财','偏财'],['正印','偏印']],比劫夺财:[['比肩','劫财'],['正财','偏财']]},pair=pairs[name];
      var step=pair&&interactions?interactionFlowAnalysis('',profiles,interactions,[],[{from:pair[0],to:pair[1],action:'制'}]).steps[0]:null;
      if(pair&&(!step||!step.active))return;
      out.push({name:name,displayName:name==='财坏印'?'贪财坏印':name,aliases:name==='财坏印'?['财坏印']:[],ruleId:conflictRuleIds[name]||'ZP-BR-00',ruleVersion:PATTERN_RULE_VERSION,effect:effect,text:text,action:step});
    }
    if(/食神制杀|食神生财/.test(patternText)&&godForce(profiles,'偏印')&&godsConnected(profiles,['偏印'],['食神'],2))add('枭神夺食',/食神制杀/.test(patternText)?'制杀受损':'生财受损','食神主线同时见有力且近贴的枭神夺食，食神受制会削弱'+(/食神制杀/.test(patternText)?'制杀':'生财')+'成格；需看财星制枭与食神根气。');
    if(/伤官生财/.test(patternText)&&anyGodForce(profiles,['正印','偏印'])&&godsConnected(profiles,['正印','偏印'],['伤官'],2))add('印制食伤','生财受阻','伤官生财同时见有力且近贴的印星，泄秀生财受阻；需看印星是护身还是过度夺秀。');
    if(/官印相生|杀印相生|伤官配印/.test(patternText)&&!(/财官印相生/.test(patternText))&&anyGodForce(profiles,['正财','偏财'])&&godsConnected(profiles,['正财','偏财'],['正印','偏印'],1))add('财坏印','印星受伤','官印、杀印或伤官配印结构中财印有力且紧贴，存在财坏印；需看比劫护印与财印去留。');
    if(anyGodForce(profiles,['正财','偏财'])&&anyGodForce(profiles,['比肩','劫财'])&&godsConnected(profiles,['正财','偏财'],['比肩','劫财'],2))add('比劫夺财','财星受分','财星与比劫皆有力且位置相近，财易被分夺；需看官杀制比劫或食伤生财承接。');
    if(!out.length)add('未见明显组合冲突','待运岁验证','未见直接破坏主格的组合冲突，重点看大运流年是否触发。');
    return out;
  }
  function interactionFlowAnalysis(mainPattern,profiles,interactions,conflicts,explicitChains){
    var chains=[];
    if(/财官印相生/.test(mainPattern))chains=[{from:['正财','偏财'],to:['正官'],action:'生'},{from:['正官'],to:['正印','偏印'],action:'生'},{from:['正印','偏印'],to:['日主'],action:'生'}];
    else if(/杀印相生/.test(mainPattern))chains=[{from:['七杀'],to:['正印','偏印'],action:'生'},{from:['正印','偏印'],to:['日主'],action:'生'}];
    else if(/官印相生/.test(mainPattern))chains=[{from:['正官'],to:['正印','偏印'],action:'生'},{from:['正印','偏印'],to:['日主'],action:'生'}];
    else if(/羊刃驾杀/.test(mainPattern))chains=[{from:['七杀'],to:['劫财'],action:'制'}];
    else if(/食神制杀/.test(mainPattern))chains=[{from:['食神'],to:['七杀'],action:'制'}];
    else if(/伤官配印/.test(mainPattern))chains=[{from:['正印','偏印'],to:['伤官'],action:'制'}];
    else if(/伤官生财/.test(mainPattern))chains=[{from:['伤官'],to:['正财','偏财'],action:'生'}];
    else if(/食神生财/.test(mainPattern))chains=[{from:['食神'],to:['正财','偏财'],action:'生'}];
    if(explicitChains)chains=explicitChains;
    function entries(names){
      return (names||[]).reduce(function(out,name){
        var item=profiles[name]||(name==='日主'&&interactions.dayMaster?{stemEntries:[interactions.dayMaster]}:{});
        return out.concat((item.stemEntries||[]).map(function(x){return {god:name,position:x.position,pillar:x.pillar||NATAL_PILLAR_KEYS[x.position],temporal:!!x.temporal,kind:'干',usable:x.usable!==false,effect:x.effect||'none',text:x.stem+name}}),(item.branchEntries||[]).map(function(x){return {god:name,position:x.position,pillar:x.pillar||NATAL_PILLAR_KEYS[x.position],temporal:!!x.temporal,kind:'支',usable:x.usable!==false,transformedAway:!!x.transformedAway,boundByCombine:!!x.boundByCombine,branchChange:x.branchChange||'',text:x.branch+'藏'+x.stem+name}}));
      },[]);
    }
    function describePair(best,from,to,action){
      return {from:from,to:to,action:action,status:best.status,active:best.active,distance:best.distance,physicalDistance:best.physicalDistance,effectiveDistance:best.effectiveDistance,left:best.left,right:best.right,text:best.left.text+action+best.right.text+'：'+best.status};
    }
    function step(from,to,action,capture){
      var left=entries(from),right=entries(to),pairs=[];
      left.forEach(function(a){right.forEach(function(b){
        var physicalDistance=Math.abs(a.position-b.position),distance=a.temporal||b.temporal?1:physicalDistance;
        var boundRelations=(interactions.stemCombines||[]).filter(function(x){return x.active!==false&&(/^(bind|transform|contest)$/.test(x.effect)||(x.involvesLuck&&x.effect==='daymaster-combine'))&&((a.kind==='干'&&(x.left===a.position||x.right===a.position))||(b.kind==='干'&&(x.left===b.position||x.right===b.position)))});
        var damageRelations=(interactions.branchPairs||[]).filter(function(x){return x.active!==false&&/^(冲|刑|害|破)$/.test(x.type)&&((a.kind==='支'&&(x.left===a.position||x.right===a.position))||(b.kind==='支'&&(x.left===b.position||x.right===b.position)))});
        var entryBlocked=a.usable===false||b.usable===false||a.transformedAway||b.transformedAway,entryCombined=!!(a.boundByCombine||b.boundByCombine),bound=boundRelations.length>0||entryBlocked||entryCombined,damaged=damageRelations.some(function(relation){return relation.type==='冲'});
        var remote=distance>2,sameHidden=physicalDistance===0&&a.kind==='支'&&b.kind==='支';
        var entryTransformed=a.transformedAway||b.transformedAway||a.effect==='transform'||b.effect==='transform';
        var entryContested=a.effect==='contest'||b.effect==='contest';
        var boundStatus=entryContested||boundRelations.some(function(x){return x.effect==='contest'})?'争合受阻':(entryTransformed||boundRelations.some(function(x){return x.effect==='transform'})?'合化改性':'合绊受阻');
        var damageStatus=damageRelations.length?'根气受'+unique(damageRelations.map(function(x){return x.type})).join('、'):'根气受损';
        var status=sameHidden?'同宫藏气待透':(bound?boundStatus:(remote?'隔位偏远':(damaged?damageStatus:(damageRelations.length?'作用可达（刑害破次级提示）':'作用可达'))));
        var active=!sameHidden&&!bound&&!remote&&!damaged;
        pairs.push({left:a,right:b,distance:distance,physicalDistance:physicalDistance,effectiveDistance:distance,bound:bound,entryBlocked:entryBlocked,damaged:damaged,boundRelations:boundRelations.map(function(x){return x.text}),damageRelations:damageRelations.map(function(x){return x.text}),remote:remote,sameHidden:sameHidden,status:status,active:active});
      })});
      if(!pairs.length)return {from:from,to:to,action:action,status:'未接通',active:false,distance:null,text:from.join('/')+'与'+to.join('/')+'未形成可核验作用'};
      pairs.sort(function(a,b){
        if(a.active!==b.active)return a.active?-1:1;
        if(interactions.dynamicPosition>=0){
          var aTemporal=a.left.temporal||a.right.temporal,bTemporal=b.left.temporal||b.right.temporal;
          if(aTemporal!==bTemporal)return aTemporal?-1:1;
        }
        if(a.distance!==b.distance)return a.distance-b.distance;
        var aDirect=a.distance===0&&a.left.kind!==a.right.kind?0:1,bDirect=b.distance===0&&b.left.kind!==b.right.kind?0:1;
        return aDirect-bDirect;
      });
      if(capture)capture(pairs);
      return describePair(pairs[0],from,to,action);
    }
    var chainOptions=[],steps=chains.map(function(item,index){return step(item.from,item.to,item.action,function(pairs){chainOptions[index]=pairs.filter(function(pair){return pair.active})})}),sequence=[],continuity=[];
    function canContinue(left,right){
      if(left.god!==right.god)return false;
      // Same actor, or the same ten god's usable stem/root within the existing
      // reach model. Different bridge gods cannot be silently joined by element.
      return left.temporal||right.temporal||Math.abs(left.position-right.position)<=2;
    }
    function coherentPath(index,path){
      if(index===chains.length)return path;
      var options=chainOptions[index]||[];
      for(var optionIndex=0;optionIndex<options.length;optionIndex++){
        var option=options[optionIndex];
        var incompatible=path.some(function(prior,priorIndex){return chains[priorIndex].to.some(function(god){return chains[index].from.indexOf(god)>=0})&&!canContinue(prior.right,option.left)});
        if(incompatible)continue;
        var found=coherentPath(index+1,path.concat([option]));if(found)return found;
      }
      return null;
    }
    if(chains.length>1&&steps.every(function(item){return item.active})){
      var path=coherentPath(0,[]);
      if(path)steps=path.map(function(pair,index){var chain=chains[index];return describePair(pair,chain.from,chain.to,chain.action)});
      else{
        continuity.push('分段分别可达，但桥接对象未相续，不按完整链成立');
        var last=steps[steps.length-1];last.active=false;last.status='桥接对象未相续';last.text+='；'+continuity[0];
      }
    }
    var conflictRules={
      枭神夺食:{breakPair:[['偏印'],['食神'],'制'],rescuePair:[['正财','偏财'],['偏印'],'制']},
      财坏印:{breakPair:[['正财','偏财'],['正印','偏印'],'制'],rescuePair:[['比肩','劫财'],['正财','偏财'],'制']},
      印制食伤:{breakPair:[['正印','偏印'],['伤官'],'制'],rescuePair:[['正财','偏财'],['正印','偏印'],'制']},
      比劫夺财:{breakPair:[['比肩','劫财'],['正财','偏财'],'制'],rescuePair:[['正官','七杀'],['比肩','劫财'],'制']}
    };
    (conflicts||[]).forEach(function(item){
      var rule=conflictRules[item.name];if(!rule)return;
      var breaker=step(rule.breakPair[0],rule.breakPair[1],rule.breakPair[2]),rescue=step(rule.rescuePair[0],rule.rescuePair[1],rule.rescuePair[2]);
      var verdict=breaker.active?(rescue.active?(rescue.distance<=breaker.distance?'救应可先到':'破格作用较近，救应稍迟'):'破格已动，未见直接救应'):'破格关系受阻或偏远';
      sequence.push({name:item.name,breaker:breaker,rescue:rescue,verdict:verdict,text:item.name+'：'+verdict});
    });
    var activeCount=steps.filter(function(x){return x.active}).length;
    var verdict=!steps.length?'未建立固定作用链':(activeCount===steps.length?'主格作用链连贯':(activeCount?'主格部分接通，仍有受阻环节':'主格作用链未直接接通'));
    return {steps:steps,sequence:sequence,continuity:continuity,verdict:verdict,interactionArbitration:interactions.arbitration,text:[verdict].concat(steps.map(function(x){return x.text}),sequence.map(function(x){return x.text})).join('；')+'。'};
  }
  function specialInteractionFlowAnalysis(detail,interactions){
    var checks=detail&&detail.flowChecks||[];
    var steps=checks.map(function(item,index){
      return {from:[detail.key],to:[detail.target||detail.type],action:'顺势',status:item.met?'作用可达':'未接通',active:!!item.met,distance:index,text:item.label+'：'+item.evidence+'（'+(item.met?'作用可达':'未接通')+'）'};
    });
    var active=steps.filter(function(item){return item.active}).length;
    var verdict=!steps.length?'特殊格局未建立验真链':(active===steps.length?'特殊格局顺势链完整':(active?'特殊格局顺势链部分成立':'特殊格局顺势链未成立'));
    return {steps:steps,sequence:[],verdict:verdict,interactionArbitration:interactions&&interactions.arbitration,text:[verdict].concat(steps.map(function(item){return item.text})).join('；')+'。',specialRuleId:detail&&detail.ruleId||''};
  }
  function natalNoblePatternQualification(analysis){
    var main=analysis.patternStructures.find(function(item){return item.role==='主格'});
    var disease=analysis.patternDisease;
    if(!main||main.status!=='已成'||!/^(清|较清)$/.test(analysis.clarity.level)||
      disease.unresolved.length||disease.partial.length||analysis.elementPhenomena.length)return null;

    var special=analysis.specialPatternQualification,qualification=main.qualification;
    var steps=analysis.interactionFlow.steps;
    if(steps.length&&steps.every(function(step){return step.active})){
      if(special&&SPECIAL_PATTERN_RULES[special.key]&&special.ruleId===main.ruleId&&
        special.checks.length&&special.checks.every(function(check){return check.met})){
        return {ruleId:main.ruleId,mainRuleId:main.ruleId,name:main.name};
      }
      if(CLASSICAL_PATTERN_POTENTIAL_RULES[main.ruleId]&&qualification&&qualification.rootedAndClear){
        if(main.ruleId==='ZP-CG-03'){
          var profilesWithDay=Object.assign({},analysis.tenGodProfiles,{'日主':{stemEntries:[analysis.interactions.dayMaster]}});
          var support=interactionFlowAnalysis('',profilesWithDay,analysis.interactions,[],[
            {from:['正印','偏印'],to:['伤官'],action:'制'},
            {from:['正印','偏印'],to:['日主'],action:'生'}
          ]);
          if(!support.steps.every(function(step){return step.active}))return null;
        }
        return {ruleId:main.ruleId,mainRuleId:main.ruleId,name:main.name};
      }
    }

    // 《子平真诠·论财》：取原局财星当令、实际生官的一路。只裁决页面贵格资格。
    if(main.ruleId!=='ZP-MG-01')return null;
    var profiles=analysis.tenGodProfiles,tasks=analysis.carryingCapacity.tasks;
    var wealth=['正财','偏财'].filter(function(god){
      return godForce(profiles,god)&&godRooted(profiles,god);
    });
    var injury=profiles['伤官']||{};
    if(!wealth.length||!godForce(profiles,'正官')||!tasks.wealth.strictFormationEligible||
      !tasks.officer.strictFormationEligible||(injury.stemEntries||[]).length||
      godClear(profiles,'七杀'))return null;
    var step=interactionFlowAnalysis('',profiles,analysis.interactions,[],[
      {from:wealth,to:['正官'],action:'生'}
    ]).steps[0];
    if(!step.active)return null;
    return {ruleId:'ZP-NOBLE-01',mainRuleId:main.ruleId,name:'财旺生官',source:'《子平真诠·论财》',steps:[step]};
  }
  function conflictsForPattern(name,conflicts){
    return (conflicts||[]).filter(function(item){
      return (/食神制杀|食神生财/.test(name)&&item.name==='枭神夺食')||
        (/伤官生财/.test(name)&&item.name==='印制食伤')||
        (/(官印相生|杀印相生|伤官配印|财官印相生)/.test(name)&&item.name==='财坏印')||
        (/(财官印相生|伤官生财)/.test(name)&&item.name==='比劫夺财');
    });
  }
  function patternAnchoredToMonth(name,monthGod){
    if(Array.isArray(monthGod))return monthGod.some(function(god){return patternAnchoredToMonth(name,god)});
    if(/财官印相生/.test(name))return monthGod==='正财'||monthGod==='偏财';
    if(/杀印相生/.test(name))return monthGod==='七杀';
    if(/食神制杀/.test(name))return monthGod==='食神'||monthGod==='七杀';
    if(/伤官配印|伤官生财/.test(name))return monthGod==='伤官';
    if(/食神生财/.test(name))return monthGod==='食神';
    if(/羊刃驾杀/.test(name))return monthGod==='劫财';
    if(/官印相生/.test(name))return monthGod==='正官';
    return false;
  }
  function patternRelation(main,other){
    if(!main||!other||main===other)return {role:'主格',type:'同一结构',text:'同一结构'};
    if(/财官印相生/.test(main)&&/官印相生/.test(other))return {role:'辅助结构',type:'包含',text:'官印相生为财官印顺生链的一段'};
    if(/(杀印相生.*食神制杀|食神制杀.*杀印相生)/.test(main+' '+other))return {role:'兼格',type:'制化并见',text:'食制与印化并见，须辨印是否夺食'};
    if(/(伤官配印.*伤官生财|伤官生财.*伤官配印)/.test(main+' '+other))return {role:'兼格',type:'取用分途',text:'配印与生财并见，须辨财印是否相战'};
    return {role:'兼格',type:'并存',text:'另一路成格结构，按月令承接与破格点分主次'};
  }
  function arbitratePatterns(regular,comboResult,specials,conflicts,monthGod){
    var trueSpecial=trueSpecialPattern(specials),specialDetail=trueSpecialDetail(specials),candidates=[];
    (comboResult.details||[]).filter(function(item){return isPrincipalPattern(item.name)&&!/待清|待制|待扶/.test(item.name)}).forEach(function(item){
      var damage=conflictsForPattern(item.name,conflicts),anchored=patternAnchoredToMonth(item.name,monthGod);
      var baseNeedsOuter=/建禄|月刃|月劫/.test(regular.name),tier=anchored?4:(baseNeedsOuter?3:2);
      candidates.push({name:item.name,ruleId:item.ruleId||comboRuleId(item.name),ruleVersion:item.ruleVersion||PATTERN_RULE_VERSION,source:'组合格',tier:tier,anchored:anchored,status:damage.length?'成而有瑕':'已成',basis:item.basis||'',score:item.score||0,conflicts:damage,qualification:item.qualification});
    });
    if(regular.formed)candidates.push({name:regular.name,ruleId:regular.authority.ruleId,ruleVersion:regular.authority.ruleVersion,source:'月令格',tier:/建禄|月刃|月劫/.test(regular.name)?1:3,anchored:true,status:regular.status,basis:regular.basis,score:0,conflicts:[]});
    if(trueSpecial)candidates.push({name:trueSpecial,ruleId:specialDetail&&specialDetail.ruleId||'ZP-SP-00',ruleVersion:PATTERN_RULE_VERSION,source:'特殊格局',tier:5,anchored:true,status:'已成',basis:specialDetail&&specialDetail.evidence.length?specialDetail.evidence.join('；'):'特殊格局严格条件已满足',score:100,conflicts:[],qualification:specialDetail});
    candidates.sort(function(a,b){
      if(b.tier!==a.tier)return b.tier-a.tier;
      var statusRank={已成:2,成而有瑕:1};
      if((statusRank[b.status]||0)!==(statusRank[a.status]||0))return (statusRank[b.status]||0)-(statusRank[a.status]||0);
      return b.score-a.score;
    });
    var main=candidates[0]||null,relations=[];
    candidates.slice(1).forEach(function(item){var relation=patternRelation(main&&main.name,item.name);relations.push({name:item.name,role:item.source==='月令格'?'命格基础':relation.role,type:relation.type,text:relation.text})});
    var decision=main?(main.name+'定为主格：'+(main.source==='特殊格局'?'特殊格局成立，优先按顺势论。':(main.anchored?'承接月令且成格条件较完整。':'月令基础格须向外取用，此组合承担主要成格路径。'))):'未见满足条件的主格，保留月令待成主线。';
    return {mainPattern:main?main.name:'未见明确成格',main:main,candidates:candidates,relations:relations,decision:decision};
  }
  function patternStructures(mainPattern,comboResult,conflicts,arbitration){
    var details=(comboResult&&comboResult.details)||[];
    var clues=(comboResult&&comboResult.clues)||[];
    return details.map(function(item){
      var issue=/待清|待制|待扶/.test(item.name);
      var relatedConflicts=conflictsForPattern(item.name,conflicts);
      var relation=arbitration&&arbitration.relations.find(function(x){return x.name===item.name});
      var settled=arbitration&&(arbitration.candidates||[]).find(function(candidate){return candidate.name===item.name});
      return {
        name:item.name,ruleId:item.ruleId||comboRuleId(item.name),ruleVersion:item.ruleVersion||PATTERN_RULE_VERSION,
        role:issue?'病点':(item.name===mainPattern?'主格':(relation?relation.role:'兼格')),
        status:issue?'待治':(settled?settled.status:(relatedConflicts.length?'成而有瑕':'已成')),
        basis:item.basis||'',
        qualification:item.qualification,
        conflicts:relatedConflicts,
        relation:relation?relation.text:''
      };
    }).concat(clues.map(function(item){
        return {name:item.name,ruleId:item.ruleId||comboRuleId(item.name),ruleVersion:item.ruleVersion||PATTERN_RULE_VERSION,role:'线索',status:'待成',basis:item.text,conflicts:[]};
    }));
  }
  function applyPhenomenaToStructures(structures,phenomena){
    var earthBuriedMetal=(phenomena||[]).find(function(item){return item.ruleId==='ZP-QX-001'});
    var main=(structures||[]).find(function(item){return item.role==='主格'});
    if(earthBuriedMetal&&main&&/杀印相生|官印相生/.test(main.name)){
      if(main.status==='已成')main.status='成而有瑕';
      main.issues=unique((main.issues||[]).concat([earthBuriedMetal.name]));
      main.conflicts=(main.conflicts||[]).concat([{name:earthBuriedMetal.name,effect:'印重壅身',text:earthBuriedMetal.conclusion}]);
      main.basis+=(main.basis?'；':'')+'印星虽能化官杀，但土印过重并见'+earthBuriedMetal.name+'，成格有瑕';
    }
    (phenomena||[]).filter(function(item){return item.category==='五行气象与生扶太过病象'}).forEach(function(item){
      if(!main||/^从格：|^化气格：|^专旺格：/.test(main.name))return;
      if(main.status==='已成')main.status='成而有瑕';
      main.issues=unique((main.issues||[]).concat([item.name]));
      main.conflicts=(main.conflicts||[]).concat([{name:item.name,effect:'生扶太过',text:item.conclusion}]);
      main.basis+=(main.basis?'；':'')+'印星虽有生扶作用，但已见'+item.name+'，日主承载受壅，成格有瑕';
    });
    (phenomena||[]).filter(function(item){return item.category==='五行气象与泄身反伤病象'}).forEach(function(item){
      if(!main||/^从格：|^化气格：|^专旺格：/.test(main.name))return;
      if(main.status==='已成')main.status='成而有瑕';
      main.issues=unique((main.issues||[]).concat([item.name]));
      main.conflicts=(main.conflicts||[]).concat([{name:item.name,effect:'泄身太过',text:item.conclusion}]);
      main.basis+=(main.basis?'；':'')+'食伤一方虽能承担泄秀或制化，但已见'+item.name+'，日主承载不足，成格有瑕';
    });
    return structures;
  }
  function isPrincipalPattern(name){
    return /^(杀印相生格|食神制杀格|伤官配印格|官印相生格|财官印相生格|食神生财格|伤官生财格|羊刃驾杀格|从格：|化气格：|专旺格：)/.test(name||'');
  }
  function overallPatternVerdict(mainPattern,regular,structures,issues){
    var main=(structures||[]).find(function(item){return item.role==='主格'});
    if(main){
      var suffix=main.conflicts&&main.conflicts.length?'；破格点：'+main.conflicts.map(function(x){return x.name}).join('、'):'';
      var issueText=(issues||[]).length?'；主要病点：'+issues.join('、'):'';
      return main.status+'：'+main.name+'。'+(main.basis||regular.basis)+suffix+issueText+'。';
    }
    return regular.status+'：'+regular.name+'未立为主格。'+regular.basis+
      (regular.issues.length?'；未成或受损原因：'+regular.issues.join('、'):'')+
      (regular.rescues.length?'；救应：'+regular.rescues.join('、'):'')+'。';
  }
  function patternDiseaseAssessment(mainPattern,regular,issues,profiles,flow,conflicts,specialDetail,interactions,currentContext){
    var activeConflictNames=(flow&&flow.sequence||[]).filter(function(item){return item.breaker&&item.breaker.active}).map(function(item){return item.name});
    var ordinaryRaw=unique((regular.issues||[]).concat(issues||[],(conflicts||[]).filter(function(item){return item.name!=='未见明显组合冲突'&&activeConflictNames.indexOf(item.name)>=0}).map(function(item){return item.name})));
    var ignored=specialDetail?ordinaryRaw.map(function(source){return {source:source,reason:specialDetail.name+'已严格成立，该普通格语境结论改由特殊格成立清单解释',numericOwner:'special-formation',ruleId:specialDetail.ruleId}}):[];
    var raw=specialDetail?[]:ordinaryRaw,items=[];
    var treatmentChains={
      '印星制伤护官':[{from:['正印','偏印'],to:['伤官'],action:'制'}],
      '财星通关':[{from:['伤官'],to:['正财','偏财'],action:'生'},{from:['正财','偏财'],to:['正官'],action:'生'}],
      '印星生身':[{from:['正印','偏印'],to:['日主'],action:'生'}],
      '比劫扶身':[{from:['比肩','劫财'],to:['日主'],action:'扶'}],
      '印星化杀生身':[{from:['七杀'],to:['正印','偏印'],action:'生'},{from:['正印','偏印'],to:['日主'],action:'生'}],
      '财星疏通食伤':[{from:['食神','伤官'],to:['正财','偏财'],action:'生'}],
      '印星裁制食伤':[{from:['正印','偏印'],to:['食神','伤官'],action:'制'}],
      '财星制枭':[{from:['正财','偏财'],to:['偏印'],action:'制'}],
      '比劫护印制财':[{from:['比肩','劫财'],to:['正财','偏财'],action:'制'}],
      '官杀制比劫':[{from:['正官','七杀'],to:['比肩','劫财'],action:'制'}],
      '食伤生财':[{from:['比肩','劫财'],to:['食神','伤官'],action:'生'},{from:['食神','伤官'],to:['正财','偏财'],action:'生'}],
      '印化官杀':[{from:['正官'],to:['正印','偏印'],action:'生'},{from:['七杀'],to:['正印','偏印'],action:'生'},{from:['正印','偏印'],to:['日主'],action:'生'}]
    };
    var treatmentProfiles=Object.assign({},profiles),treatmentPillars=currentContext&&currentContext.pillars;
    if(treatmentPillars)treatmentProfiles['日主']={stemEntries:[{position:2,pillar:'day',stem:treatmentPillars.day[0],usable:true}]};
    function medicine(names,label){
      var present=(names||[]).some(function(name){return ((profiles[name]||{}).count||0)>0});
      var rooted=(names||[]).some(function(name){return godRooted(profiles,name)}),clear=anyGodClear(profiles,names);
      var treatment=treatmentChains[label]||[],steps=interactions&&treatment.length?interactionFlowAnalysis('',treatmentProfiles,interactions,[],treatment).steps:[];
      var reachable=steps.length===treatment.length&&steps.length>0&&steps.every(function(step){return step.active});
      var local=steps.some(function(step){return step.active});
      var qualifiedProfiles=Object.assign({},treatmentProfiles);
      names.forEach(function(name){if(!rootedClearGod(profiles,[name]))qualifiedProfiles[name]={}});
      var qualifiedSteps=interactions&&treatment.length?interactionFlowAnalysis('',qualifiedProfiles,interactions,[],treatment).steps:[];
      var full=reachable&&rootedClearGod(profiles,names)&&qualifiedSteps.length===treatment.length&&qualifiedSteps.every(function(step){return step.active});
      if(full)steps=qualifiedSteps;
      var rank=!present||!local?0:(full?2:1);
      return {name:label,state:!present?'未见可用药神':(rank===2?'根透与对应作用链均成立':(!reachable?'药神可见，但对应作用链未闭合':(!rooted?'作用可达但根气不足':(clear?'根透候选存在，但合格药神的整链未成立':'有根未透，仅作局部救应')))),rank:rank,steps:steps};
    }
    function flowMedicine(pattern,label){
      var steps=/食神制杀/.test(pattern)?(flow&&flow.steps||[]).filter(function(step){return step.active&&step.action==='制'&&step.from.indexOf('食神')>=0&&step.to.indexOf('七杀')>=0}):[];
      return {name:label,state:steps.length?'作用可达':'作用未接通',rank:steps.length?2:0,steps:steps};
    }
    function add(family,name,source,medicines,note){
      var sequenceName={枭夺食:'枭神夺食',财印相战:'财坏印',比劫分财:'比劫夺财',食伤受印:'印制食伤'}[family];
      var sequence=sequenceName&&(flow&&flow.sequence||[]).find(function(item){return item.name===sequenceName});
      var timelyRescue=sequence&&sequence.rescue&&sequence.rescue.active&&sequence.breaker&&sequence.breaker.distance!=null&&sequence.rescue.distance!=null&&sequence.rescue.distance<=sequence.breaker.distance;
      if(sequence&&sequence.breaker&&sequence.breaker.active&&!timelyRescue){
        var timingNote=sequence.rescue&&sequence.rescue.active?'，但救应晚于破格作用':'，但救应作用未接通';
        medicines=medicines.map(function(item){return item.rank===2?Object.assign({},item,{rank:1,state:item.state+timingNote}):item});
      }
      if(currentContext&&(family==='承载不足'||family==='官杀承载不足'||family==='官杀去留')&&currentContext.carryingCapacity&&!currentContext.carryingCapacity.canCarryOutputKill){
        medicines=medicines.map(function(item){return item.rank===2?Object.assign({},item,{rank:1,state:item.state+'，但净根力与扶身权重仍不足'}):item});
      }
      var best=Math.max.apply(null,medicines.map(function(item){return item.rank}).concat([0]));
      var existing=items.find(function(item){return item.family===family});
      var item={family:family,name:name,source:[source],medicines:medicines,bestRank:best,status:best===2?'已解':(best===1?'部分化解':'未解'),residual:best===2?'无残病':(best===1?'仍有残病':'病点未解'),note:note||''};
      if(!existing)items.push(item);
      else{
        existing.source=unique(existing.source.concat(source));
        existing.medicines=existing.medicines.concat(medicines).filter(function(value,index,array){return array.findIndex(function(other){return other.name===value.name&&other.state===value.state})===index});
        existing.bestRank=Math.max(existing.bestRank,best);
        existing.status=existing.bestRank===2?'已解':(existing.bestRank===1?'部分化解':'未解');
        existing.residual=existing.bestRank===2?'无残病':(existing.bestRank===1?'仍有残病':'病点未解');
      }
    }
    raw.forEach(function(source){
      if(/伤官见官/.test(source))add('官伤冲战','伤官见官',source,[medicine(['正印','偏印'],'印星制伤护官'),medicine(['正财','偏财'],'财星通关')],'只处理官伤冲战，不代替其他病点的救应。');
      else if(/日主偏弱.*(?:伤官|食神).*泄身|身不任财|财多身弱/.test(source))add('承载不足','日主承载不足',source,[medicine(['正印','偏印'],'印星生身'),medicine(['比肩','劫财'],'比劫扶身')],'同一身弱泄耗只结算一次，不按每个格名重复扣分。');
      else if(/杀重身轻|官重身轻/.test(source))add('官杀承载不足',source.replace(/待.*$/,''),source,[medicine(['正印','偏印'],'印星化杀生身'),medicine(['比肩','劫财'],'比劫扶身'),flowMedicine(mainPattern,'食神制杀')],'制杀只解除杀压，不能同时消除官伤冲战。');
      else if(/食伤混杂/.test(source))add('食伤去留','食伤混杂',source,[medicine(['正财','偏财'],'财星疏通食伤'),medicine(['正印','偏印'],'印星裁制食伤')],'食伤已有明确主辅分工时不进入此病点。');
      else if(/官杀混杂/.test(source))add('官杀去留','官杀混杂',source,[medicine(['正印','偏印'],'印化官杀')],'官杀并见与实质相战分开；印须承接官与杀并回生日主，承载不足仍保留残病。');
      else if(/枭神夺食/.test(source))add('枭夺食','枭神夺食',source,[medicine(['正财','偏财'],'财星制枭')],'财须能直接制枭，不能仅以财星存在即全解。');
      else if(/财坏印/.test(source))add('财印相战','贪财坏印',source,[medicine(['比肩','劫财'],'比劫护印制财')],'只解除财印相战，不替代印星本身的根透。');
      else if(/比劫夺财/.test(source))add('比劫分财','比劫夺财',source,[medicine(['正官','七杀'],'官杀制比劫'),medicine(['食神','伤官'],'食伤生财')],'须看官杀或食伤是否真正承接财星。');
    });
    var solved=items.filter(function(item){return item.bestRank===2}),partial=items.filter(function(item){return item.bestRank===1}),unresolved=items.filter(function(item){return item.bestRank===0});
    var medicineText=items.map(function(item){var best=item.medicines.filter(function(m){return m.rank===item.bestRank}).map(function(m){return m.name+'（'+m.state+'）'}).join('、')||'未见对应药神';return item.name+'：'+item.status+'，'+best+'，'+item.residual;});
    return {ruleId:'ZP-NET-01',ruleVersion:PATTERN_RULE_VERSION,items:items,solved:solved,partial:partial,unresolved:unresolved,ignored:ignored,residualSeverity:unresolved.length*2+partial.length,text:items.length?medicineText.join('；'):(ignored.length?'普通格病点已转入特殊格成立语境，不参与重复扣分。':'未见需要重复结算的主要病点。')};
  }
  function settlePatternNet(arbitration,regular,flow,disease,special){
    if(special)return;
    var main=arbitration&&arbitration.main;if(!main)return;
    var blocked=(flow.steps||[]).some(function(step){return !step.active}),residual=(disease.partial||[]).concat(disease.unresolved||[]);
    var answered=(main.conflicts||[]).every(function(conflict){return (disease.items||[]).some(function(item){return item.status==='已解'&&(item.source||[]).some(function(source){return source.indexOf(conflict.name)>=0})})});
    var eligible=main.source==='组合格'?!!main.qualification:(regular.checks||[]).filter(function(check){return check.type==='立格'||check.type==='成格'}).every(function(check){return check.active});
    if(main.status==='成而有瑕'&&(flow.steps||[]).length&&!blocked&&!residual.length&&answered&&eligible&&!(regular.issues||[]).some(function(issue){return /多神并用.*未取清/.test(issue)})){
      main.status='已成';
      main.netSettlement={blocked:false,residual:[],reason:'成立资格及必要链仍有效，原破坏已由对应药神全解；不把已解病点永久保留为有瑕'};
      if(main.source==='月令格')regular.status='已成';
    }
    if(main.status==='已成'&&(blocked||residual.length)){
      main.status='成而有瑕';
      main.netSettlement={blocked:blocked,residual:residual.map(function(item){return {family:item.family,status:item.status}}),reason:'候选成立不等于净结算无瑕；必要作用受阻或仍有残病时不输出纯粹已成'};
      if(main.source==='月令格')regular.status='成而有瑕';
    }
  }
  function patternReasoningChain(mainPattern,regular,structures,issues,conflicts,verdict,diseaseNet){
    var main=(structures||[]).find(function(item){return item.role==='主格'});
    var isSpecial=!!(main&&/^(?:从格：|化气格：|专旺格：)/.test(main.name));
    var formation=[];
    if(main)formation.push(main.name+'：'+(main.basis||regular.basis));
    else formation.push(regular.name+'：'+regular.basis);
    var damage=diseaseNet?diseaseNet.partial.concat(diseaseNet.unresolved).map(function(item){return item.name+'（'+item.residual+'）'}):unique((regular.issues||[]).concat(issues||[],(conflicts||[]).filter(function(x){return x.name!=='未见明显组合冲突'}).map(function(x){return x.name+'（'+x.effect+'）'})));
    var rescue=isSpecial?[]:unique((regular.rescues||[]).concat((structures||[]).reduce(function(out,item){return out.concat(item.rescues||[])},[]),diseaseNet?diseaseNet.items.filter(function(item){return item.bestRank>0}).map(function(item){return item.name+'：'+item.status}):[]));
    return {formation:formation,damage:damage,rescue:rescue,conclusion:verdict};
  }
  function levelAssessment(mainPattern,regular,structures,issues,clarity,flow,conflicts,phenomena,diseaseNet){
    var grades=PATTERN_LEVELS;
    var main=(structures||[]).find(function(item){return item.role==='主格'}),checks=regular.checks||[],qualificationChecks=main&&main.qualification&&main.qualification.checks||[];
    var required=qualificationChecks.length?qualificationChecks.map(function(item){return {active:item.met,label:item.label,type:'成格'}}):checks.filter(function(x){return x.type==='立格'||x.type==='成格'}),met=required.filter(function(x){return x.active}).length;
    var isSpecialMain=!!(main&&/^从格：|^化气格：|^专旺格：/.test(main.name));
    var breakers=isSpecialMain?[]:checks.filter(function(x){return x.type==='破格'&&x.active}),rescues=isSpecialMain?[]:checks.filter(function(x){return x.type==='救应'&&x.active});
    var formed=!!main||regular.formed,flowGood=flow&&flow.steps.length&&flow.steps.every(function(x){return x.active});
    var pure=clarity&&/^(清|较清)$/.test(clarity.level);
    var relevantConflicts=main?conflictsForPattern(main.name,conflicts):[];
    var activeConflictNames=(flow&&flow.sequence||[]).filter(function(item){return item.breaker&&item.breaker.active}).map(function(item){return item.name});
    var externalConflict=relevantConflicts.some(function(item){return activeConflictNames.indexOf(item.name)>=0});
    var highQualityCombination=main&&/^(杀印相生格|食神制杀格|伤官配印格|官印相生格|财官印相生格|食神生财格|羊刃驾杀格)$/.test(main.name);
    var unresolvedDisease=diseaseNet?diseaseNet.unresolved:[],partialDisease=diseaseNet?diseaseNet.partial:[];
    var strictHighQualityCombination=!!(highQualityCombination&&main.status==='已成'&&flowGood&&clarity&&/^(清|较清|可清)$/.test(clarity.level)&&!externalConflict&&!unresolvedDisease.length&&!partialDisease.length&&!(phenomena||[]).length);
    var strictInjurySeal=!!(main&&/伤官配印格/.test(main.name)&&strictHighQualityCombination);
    var strictSpecial=!!(isSpecialMain&&main.status==='已成'&&qualificationChecks.length&&qualificationChecks.every(function(item){return item.met})&&flowGood&&pure&&!unresolvedDisease.length&&!partialDisease.length&&!(phenomena||[]).length);
    var establishedMain=main?main.status==='已成':regular.status==='已成';
    var tieTier=strictSpecial?3:(strictHighQualityCombination?2:(establishedMain?1:0));
    var tieBreak={
      tier:tieTier,
      label:['待成或受损','普通成格','严格成格组合','特殊格局严格成立'][tieTier],
      reason:strictSpecial?'特殊格局已严格验真，优先于同分常规成格。':(strictHighQualityCombination?main.name+'严格成立，优先于同分普通成格，但不因格名直接顶档。':(tieTier===1?'常规格局已成，同分时仍低于严格成格组合。':'待成、成而有瑕或受损结构，不参与同分优先提升。')),
      order:{formation:met,formationTotal:required.length,flow:flowGood?1:0,purity:{清:3,较清:2,可清:1}[clarity&&clarity.level]||0,breakers:unresolvedDisease.length+partialDisease.length+(externalConflict?1:0)+(phenomena||[]).length,rescues:(diseaseNet?diseaseNet.solved.length+diseaseNet.partial.length:rescues.length)}
    };
    var idx,reasons=[],criteria=[];
    criteria.push({name:'成格完整度',met:met,total:required.length,result:met+'/'+required.length+'项满足'});
    criteria.push({name:'生克有情',met:flowGood,total:1,result:flow?flow.verdict:'待核'});
    criteria.push({name:'清纯程度',met:!!pure,total:1,result:clarity&&clarity.level||'待辨'});
    criteria.push({name:'破格程度',met:unresolvedDisease.length===0,total:1,result:isSpecialMain?'按特殊格成立清单与破格边界验真':(diseaseNet&&diseaseNet.items.length?('未解'+unresolvedDisease.length+'项、残留'+partialDisease.length+'项'):(breakers.length?breakers.map(function(x){return x.label}).join('、'):'未见常格破点'))});
    criteria.push({name:'救应有效',met:isSpecialMain||(diseaseNet?diseaseNet.solved.length>0:rescues.length>0),total:1,result:isSpecialMain?'特殊格顺势成立，不套用常格救应':(diseaseNet&&diseaseNet.items.length?('已解'+diseaseNet.solved.length+'项、部分化解'+partialDisease.length+'项'):(rescues.length?rescues.map(function(x){return x.label}).join('、'):'未见明确救应'))});
    if(diseaseNet&&diseaseNet.items.length)criteria.push({name:'病药净结算',met:unresolvedDisease.length===0,total:diseaseNet.items.length,result:'已解'+diseaseNet.solved.length+'、部分化解'+partialDisease.length+'、未解'+unresolvedDisease.length+'；'+diseaseNet.text});
    if(flow&&flow.interactionArbitration)criteria.push({name:'合冲先后',met:true,total:1,result:flow.interactionArbitration.text+'；规则 '+flow.interactionArbitration.ruleIds.join('、')});
    criteria.push({name:'同分优先级',met:tieTier>=2,total:3,result:tieBreak.label+'：'+tieBreak.reason});
    if(highQualityCombination)criteria.push({name:'严格成格组合',met:strictHighQualityCombination,total:1,result:strictHighQualityCombination?'成格完整、作用可达、清纯可用，未见直接破点':'需同时核验成格完整度、作用链、清浊、破格、救应与气势病象'});
    if(main&&/伤官配印格/.test(main.name))criteria.push({name:'伤官配印严检',met:strictInjurySeal,total:1,result:strictInjurySeal?'伤官当令、印有根透、印伤作用可达，未见财坏印、冲战或气势病象':'需同时核验印伤作用、财坏印、伤官见官、日主承载与气势病象'});
    if((phenomena||[]).length)criteria.push({name:'气势病象',met:false,total:1,result:phenomena.map(function(x){return x.name+'（'+x.severity+'）'}).join('、')});
    if(!formed)idx=regular.status==='已破'?0:1;
    else{
      idx=2;
      if(required.length&&met===required.length&&pure)idx=3;
      if(idx===3&&flowGood&&!externalConflict&&!breakers.length&&(isSpecialMain||rescues.length))idx=4;
      if(((main&&main.status==='成而有瑕')&&externalConflict)||unresolvedDisease.length)idx=Math.max(1,idx-1);
      if((phenomena||[]).length)idx=Math.max(formed?2:1,idx-1);
    }
    reasons.push((main?main.name:regular.name)+(main?main.status:regular.status));
    reasons.push('成格条件'+met+'/'+required.length);
    if(flow)reasons.push(flow.verdict);
    if(diseaseNet&&diseaseNet.items.length)reasons.push('病药净结算：'+diseaseNet.text);
    else if(!isSpecialMain){
      if((regular.issues||[]).length)reasons.push('破格点'+regular.issues.join('、'));
      if((issues||[]).length)reasons.push('结构病点'+issues.join('、'));
    }
    if(externalConflict)reasons.push('另见组合冲突');
    if((phenomena||[]).length)reasons.push('气势病象'+phenomena.map(function(x){return x.name+'（'+x.severity+'）'}).join('、'));
    if(strictHighQualityCombination)reasons.push(main.name+'严检通过，古籍潜力进入原始排序，不另设重复抬档');
    var metrics={formed:formed,power:met===required.length?'有力':'有力待补',affection:flowGood?'有情':'承接待验',purity:clarity&&clarity.level||'待验',rescue:isSpecialMain?'特殊格顺势，不套用常格救应':(diseaseNet&&diseaseNet.items.length?(diseaseNet.solved.length?'有效'+diseaseNet.solved.length+'项':'部分'+diseaseNet.partial.length+'项'):(regular.rescues.length?regular.rescues.join('、'):'无')),tieBreak:tieBreak.label};
    return {grade:grades[idx],index:idx,score:null,qualityFloor:'',tieBreak:tieBreak,criteria:criteria,metrics:metrics,text:grades[idx]+'：'+reasons.join('，')+'；有力：'+metrics.power+'；有情：'+metrics.affection+'；清纯：'+metrics.purity+'；救应：'+metrics.rescue+'；同分优先：'+tieBreak.label+'。'};
  }
  function directClarity(mainPattern,regular,current){
    if(current&&current.level!=='待辨')return current;
    var level=regular.status==='已成'?'清':(regular.status==='成而有瑕'?'有瑕':(regular.status==='已破'?'浊':'待清'));
    return {level:level,text:'结论：'+regular.name+regular.status+'；留：'+regular.keep+'；去：'+regular.remove+'；依据：'+regular.basis+'。'};
  }
  function patternClarityConclusion(mainPattern,regular,structures,clarity,flow,conflicts,diseaseNet,specialDetail){
    var main=(structures||[]).find(function(item){return item.role==='主格'}),status=(main&&main.status)||regular.status;
    var isSpecial=!!specialDetail;
    var related=main?conflictsForPattern(main.name,conflicts):[];
    var labelMap={清:'清纯可用',较清:'较清可用',可清:'可清待验',有瑕:'成而有瑕',冲战:'冲战待解',不清:'去留不清',偏浊:'偏浊待扶',浊:'浊而待清',待清:'待清',待辨:'待辨'};
    var clarityLabel=labelMap[(clarity&&clarity.level)||'待辨']||'待辨';
    var action=(flow&&flow.steps||[]).map(function(item){return item.text}).join('、')||'未建立固定主格作用链';
    var blockers=diseaseNet?diseaseNet.partial.concat(diseaseNet.unresolved).map(function(item){return item.name+'（'+item.residual+'）'}):unique((main&&main.issues||[]).concat(regular.issues||[],related.map(function(item){return item.name+'（'+item.effect+'）'})));
    var rescue=isSpecial?[]:unique((main&&main.rescues||[]).concat(regular.rescues||[],diseaseNet?diseaseNet.items.filter(function(item){return item.bestRank>0}).map(function(item){return item.name+'：'+item.status}):[]));
    var conclusion=status==='已成'&&clarityLabel==='清纯可用'?'已成且清纯可用':(status==='已成'?status+'，'+clarityLabel:(status+'，'+clarityLabel));
    var ruleIds=isSpecial?unique([specialDetail.ruleId].concat((specialDetail.checks||[]).map(function(item){return item.ruleId})).filter(Boolean)):unique([main&&main.ruleId,regular.authority&&regular.authority.ruleId,diseaseNet&&diseaseNet.ruleId].concat(related.map(function(item){return item.ruleId})).filter(Boolean));
    var steps=flow&&flow.steps||[],allActive=steps.length&&steps.every(function(item){return item.active}),noneActive=steps.length&&!steps.some(function(item){return item.active});
    var terms=[];
    function term(name){if(terms.indexOf(name)<0)terms.push(name)}
    if(/^(清|较清)$/.test((clarity&&clarity.level)||'')&&status==='已成')term('清纯');
    if(/官杀混杂|食伤混杂/.test(mainPattern)||related.length)term('混杂');
    if(/伤官见官/.test(mainPattern))term('两神相战');
    if(allActive){term('有力');term('有情');term('源流贯通')}
    else if(steps.length){term(noneActive?'无力':'有力待补');term('阻隔')}
    if(allActive&&/食神制杀|伤官配印|羊刃驾杀|杀印相生|官印相生/.test(mainPattern)&&!related.length)term('制化得宜');
    else if(/食神制杀|伤官配印|羊刃驾杀|杀印相生|官印相生/.test(mainPattern)&&related.length)term('制化两立');
    if(!blockers.length&&!related.length&&!/混杂|见官待制/.test(mainPattern)&&status!=='已破')term('去留得宜');
    else if(diseaseNet&&diseaseNet.partial.length&&!diseaseNet.unresolved.length)term('去留有余病');
    else term('去留不清');
    if(status==='成而有瑕')term('成而有瑕');
    if((flow&&flow.sequence||[]).some(function(item){return /救应可先到/.test(item.verdict)})){term('通关');term('败中有救')}
    var specialKeep=isSpecial?(specialDetail.target+'势为主，顺势取用'):'';
    var specialRemove=isSpecial?(specialDetail.name==='从格：从杀格'?'避免印比扶身或食伤逆制官杀破从':(specialDetail.name==='从格：从财格'?'避免印比扶身、比劫分财或官杀泄财破从':(specialDetail.name==='从格：从儿格'?'避免印星回克食伤，并保留财星承接':(specialDetail.type==='化气格'?'避免还原日主或克破化神':'避免克破旺神，并保留泄秀出口')))):'';
    var keepText=specialKeep||(diseaseNet&&diseaseNet.items.length?diseaseNet.items.filter(function(item){return item.bestRank>0}).map(function(item){return item.medicines.filter(function(m){return m.rank===item.bestRank}).map(function(m){return m.name}).join('、')}).filter(Boolean).join('、')||regular.keep:regular.keep);
    var removeText=specialRemove||(diseaseNet&&diseaseNet.items.length?diseaseNet.partial.concat(diseaseNet.unresolved).map(function(item){return item.name}).join('、')||'未见残余病点':regular.remove);
    return {
      conclusion:conclusion,
      clarity:clarityLabel,
      action:action,
      blockers:blockers,
      rescue:rescue,
      keep:keepText,
      remove:removeText,
      terms:terms,
      ruleIds:ruleIds,
      text:'结论：'+conclusion+'；专业判断：'+(terms.join('、')||'待辨')+'；作用：'+action+'；受阻：'+(blockers.length?blockers.join('、'):'未见直接破格点')+'；救应：'+(rescue.length?rescue.join('、'):'未见明确救应')+'；去留：留'+keepText+'，去'+removeText+'；依据：'+(clarity&&clarity.text||regular.basis)
    };
  }
  function positivePhenomenaAnalysis(pillars,scores,strength,profiles,clarityConclusion,flow,conflicts,phenomena,interactions){
    scores=scores||{};
    var total=WUXING.reduce(function(sum,w){return sum+(scores[w]||0)},0)||1,keys=orderedPillarKeys(pillars),out=[];
    function ratio(w){return (scores[w]||0)/total}
    function visibleStem(w){
      if(!interactions)return keys.some(function(k){return STEM_WX[pillars[k][0]]===w});
      return keys.some(function(k){
        var state=stemInteractionChange(PILLAR_META[k].index,interactions),original=STEM_WX[pillars[k][0]];
        if(state.effect==='transform')return state.target===w;
        return state.usable!==false&&original===w;
      });
    }
    function grounded(w){return keys.filter(function(k){
      var change=interactions&&branchInteractionChange(k,interactions,true);
      return BRANCH_WX[pillars[k][1]]===w&&!(change&&change.effect==='transform'&&change.element!==w&&!change.challenged);
    }).length}
    function blockedByDisease(elements){return (phenomena||[]).some(function(item){return elements.indexOf(item.target&&item.target.element)>=0||elements.indexOf(item.useCorrection&&item.useCorrection.restrain&&item.useCorrection.restrain[0])>=0})}
    function add(name,ruleId,definition,evidence,boundary,authority){out.push({name:name,ruleId:ruleId,ruleVersion:PATTERN_RULE_VERSION,status:'明确成立',definition:definition,evidence:evidence,boundary:boundary,authority:authority})}
    function pair(name,ruleId,a,b,months,blocked,definition,authority){
      var combined=ratio(a)+ratio(b),otherMax=Math.max.apply(null,WUXING.filter(function(w){return w!==a&&w!==b}).map(ratio));
      var qualifies=ratio(a)>=0.18&&ratio(b)>=0.18&&combined>=0.48&&visibleStem(a)&&visibleStem(b)&&grounded(a)>0&&grounded(b)>0&&months.indexOf(pillars.month[1])>=0&&otherMax<=0.34&&!blockedByDisease(blocked);
      if(qualifies)add(name,ruleId,definition,[a+'约占'+Math.round(ratio(a)*100)+'%，'+b+'约占'+Math.round(ratio(b)*100)+'%，两气合计约'+Math.round(combined*100)+'%',a+'、'+b+'均透干并在地支有承接，月令'+pillars.month[1]+'属于该气象得时范围','其余单一五行最高约'+Math.round(otherMax*100)+'%，未见直接破坏该气象的偏枯病象'],'若任一方只见孤透无根、被合冲严重，或第三方偏枯超过当前门槛，只保留线索，不输出规范名。',authority);
    }
    pair('木火通明','ZP-ZX-01','木','火','寅卯巳午',['木','火'],'木火相生且得时、透根承接，生发与表达能够相续。','《三命通会》木秀火明、木火通明；以金伤木、湿滞无焰为反证');
    pair('金白水清','ZP-ZX-02','金','水','申酉亥子',['金','水'],'金水相生而清，金能发源、水能流行，未被厚土浊水或寒湿阻断。','《三命通会》“水清金白秀丽堪夸”；《渊海子平》金白水清');
    pair('水木清华','ZP-ZX-03','水','木','亥子寅卯',['水','木'],'水木相生且清润有根，生发路径连续而不过漂缩。','《三命通会》水木清奇；以水泛木浮、木盛水缩为反证');
    var foodClear=godClear(profiles,'食神'),hurtClear=godClear(profiles,'伤官'),outputForce=anyGodForce(profiles,['食神','伤官']);
    var outputConflict=(conflicts||[]).some(function(item){return /枭神夺食|印制食伤/.test(item.name)});
    if(/强/.test(strength)&&outputForce&&foodClear!==hurtClear&&!outputConflict&&!(phenomena||[]).some(function(item){return item.category==='五行气象与泄身反伤病象'})){
      var outputName=foodClear?'食神':'伤官';
      add('食伤泄秀','ZP-ZX-04','日主有力，食伤一方清透有根并能作为有序出口，不见枭印近贴夺制或泄身反伤。',[ '日主'+strength+'，具备承泄基础',outputName+'有根透且食神、伤官未同时混强','未见枭神夺食、印制食伤或泄身反伤病象'],'若日主转弱、食伤混杂，或枭印近贴夺制，应降为泄身或混杂线索。','《滴天髓阐微》以秀气流行为用；《三命通会》食伤须身旺并辨财印承接');
    }
    return out;
  }
  function applyPhenomenaToClarity(clarity,phenomena){
    var earthBuriedMetal=(phenomena||[]).find(function(item){return item.ruleId==='ZP-QX-001'});
    var resourceExcess=(phenomena||[]).find(function(item){return item.category==='五行气象与生扶太过病象'});
    var outputExcess=(phenomena||[]).find(function(item){return item.category==='五行气象与泄身反伤病象'});
    if(!earthBuriedMetal&&!resourceExcess&&!outputExcess)return clarity;
    var level=clarity&&clarity.level==='清'?'较清':(clarity&&clarity.level||'有瑕'),extra='';
    if(earthBuriedMetal)extra='气势结论：'+earthBuriedMetal.conclusion+' 去留：印土功能保留，但过量之土不再增；以金承载，水作有条件润泄。';
    else if(resourceExcess)extra='气势结论：'+resourceExcess.conclusion+' 去留：印星原有生扶功能保留，但过量之'+resourceExcess.useCorrection.restrain.join('、')+'不再增；先以'+resourceExcess.useCorrection.primary.join('、')+'增强承载，再验有条件的制泄。';
    else extra='气势结论：'+outputExcess.conclusion+' 去留：食伤已有输出作用，但过量之'+outputExcess.useCorrection.restrain.join('、')+'不再增；先以'+outputExcess.useCorrection.primary.join('、')+'恢复承载。';
    return {level:level,text:(clarity&&clarity.text?clarity.text+' ':'')+extra};
  }
  function patternConfidence(regular,structures,issues,clues,clarity,specials){
    var main=(structures||[]).find(function(item){return item.role==='主格'});
    var specialDetail=trueSpecialDetail(specials);
    if(specialDetail){
      var qualified=(specialDetail.checks||[]).length>0&&(specialDetail.checks||[]).every(function(item){return item.met});
      if(main&&main.status==='已成'&&qualified&&clarity&&/^(清|较清)$/.test(clarity.level))return {level:'高置信',why:specialDetail.name+'的成立清单、顺势链与清纯度相互印证；普通格病象已转为真假边界，不重复判为受损待救。'};
      return {level:'中置信',why:'已进入'+specialDetail.name+'语境，但仍须复核特殊格成立清单、顺势链或清纯度。'};
    }
    var pendingSpecial=(specials||[]).some(function(item){return /倾向|未成|线索/.test(item)});
    var hasDamage=(issues||[]).length>0||(main&&main.conflicts&&main.conflicts.length>0)||regular.issues.length>0;
    if(main&&main.status==='已成'&&!hasDamage&&!pendingSpecial&&clarity&&/^(清|较清)$/.test(clarity.level)){
      return {level:'高置信',why:'月令主线、成格条件与清纯度相互印证，未见直接破格点。'};
    }
    if((main&&(main.status==='已成'||main.status==='成而有瑕'))||regular.formed){
      return {level:'中置信',why:hasDamage?'已见成格依据，但同时存在受损或待救条件。':'已见成格依据，仍需以透干、根气和行运继续校验。'};
    }
    return {level:'参考',why:(clues||[]).length||pendingSpecial?'只见组合或特殊格局线索，条件不足，不作成格定论。':'月令格尚未满足成格条件，保留为待成判断。'};
  }
  function compareLuckRoots(natalStrength,currentStrength){
    var before=natalStrength&&natalStrength.dimensions&&natalStrength.dimensions.roots.items||[],after=currentStrength&&currentStrength.dimensions&&currentStrength.dimensions.roots.items||[];
    function key(item){return item.position+'|'+item.branch}
    function usable(item){return !!(item&&item.usable!==false&&!item.transformedAway&&(item.rootPower||0)>0)}
    var gained=after.filter(function(item){return item.position==='luck'&&usable(item)}),lost=[],weakened=[],restored=[];
    before.forEach(function(item){
      var current=after.find(function(candidate){return key(candidate)===key(item)}),oldPower=item.rootPower||0,newPower=current&&current.rootPower||0;
      if(usable(item)&&!usable(current))lost.push({before:item,after:current||null});
      else if(newPower<oldPower-0.04)weakened.push({before:item,after:current});
      else if(newPower>oldPower+0.04)restored.push({before:item,after:current});
    });
    return {temporary:gained,gained:gained,lost:lost,weakened:weakened,restored:restored,supportBefore:natalStrength&&natalStrength.support||0,supportAfter:currentStrength&&currentStrength.support||0,supportDelta:Math.round(((currentStrength&&currentStrength.support||0)-(natalStrength&&natalStrength.support||0))*10)/10};
  }
  function compareLuckDiseases(natalDisease,currentDisease){
    var before=natalDisease&&natalDisease.items||[],after=currentDisease&&currentDisease.items||[],improved=[],worsened=[],newActive=[],resolved=[];
    function rank(item){return !item?0:(item.status==='未解'?2:(item.status==='部分化解'?1:0))}
    before.forEach(function(item){
      var current=after.find(function(candidate){return candidate.family===item.family});
      if(rank(current)<rank(item)){improved.push({before:item,after:current||null});if(!current||rank(current)===0)resolved.push({before:item,after:current||null})}
      else if(rank(current)>rank(item))worsened.push({before:item,after:current});
    });
    after.forEach(function(item){
      var old=before.find(function(candidate){return candidate.family===item.family});
      if(!old&&rank(item)>0)newActive.push(item);
    });
    return {improved:improved,worsened:worsened,newActive:newActive,resolved:resolved,residualBefore:natalDisease&&natalDisease.residualSeverity||0,residualAfter:currentDisease&&currentDisease.residualSeverity||0};
  }
  function buildTemporalPatternContext(dayStem,pillars,analysis,options){
    var rawScores=scoreWuxing(pillars),fullOptions={fullInteractionFeedback:true,outlookFlowYear:!!(options&&options.outlookFlowYear),time:analysis.analysisTime||null},weightedStrength=strengthScore(dayStem,pillars,fullOptions),strength=assessStrength(dayStem,pillars,rawScores,fullOptions),interactions=weightedStrength.interactions,scores=effectiveWuxingScores(pillars,rawScores,interactions);
    var monthCommand=analysis.monthCommand,monthGod=monthCommand&&monthCommand.primaryGod;
    var rawCounts=tenGodCounts(dayStem,pillars),profiles=tenGodProfiles(dayStem,pillars,monthCommand,interactions,fullOptions),counts={},rootDetails=weightedStrength.dimensions.roots.items||[];
    Object.keys(profiles).forEach(function(god){counts[god]=profiles[god].count||0});
    var carryingCapacity=carryingCapacityFeedback(strength,weightedStrength,profiles,pillars),officerAssessment=assessOfficerMixture(profiles,interactions,pillars,carryingCapacity),regular=regularPatternAssessment(dayStem,pillars,monthGod,profiles,strength,monthCommand,interactions,carryingCapacity);
    var mixed=officerAssessment.unresolved;
    var comboResult=monthComboPatterns(monthCommand,counts,{mixed:mixed,officerAssessment:officerAssessment,strength:strength,profiles:profiles,interactions:interactions,dayRootCount:rootDetails.filter(function(item){return item.usable!==false&&!item.transformedAway}).length,strengthSupport:weightedStrength.support,carryingCapacity:carryingCapacity});
    if(monthCommand&&monthCommand.ambiguous)comboResult.clues.unshift({name:'杂气兼用线索参考',ruleId:'ZP-MG-00',ruleVersion:PATTERN_RULE_VERSION,text:monthCommand.basis+' 条件未取清前不以其中一神强定成格。'});
    var dynamicSpecials=specialPatterns(dayStem,pillars,scores,counts,strength,rootDetails,interactions,profiles);
    var natalSpecialDetail=analysis.specialPatternQualification||null,natalSpecialName=natalSpecialDetail&&natalSpecialDetail.name||(/^从格：|^化气格：|^专旺格：/.test(analysis.mainPattern||'')?analysis.mainPattern:'');
    var currentSpecialDetail=natalSpecialName?((dynamicSpecials.details||[]).find(function(item){return item.name===natalSpecialName})||null):null;
    var currentSpecials=[];currentSpecials.details=[];
    if(currentSpecialDetail){currentSpecials.push(currentSpecialDetail.name);currentSpecials.details.push(currentSpecialDetail)}
    var specialLost=natalSpecialName&&!currentSpecialDetail?[natalSpecialName]:[];
    var introducedSpecials=(dynamicSpecials.details||[]).filter(function(item){return item.name!==natalSpecialName});
    var specialClues=dynamicSpecials.filter(function(item){return typeof item==='string'&&/倾向|线索|未成/.test(item)}).slice();
    introducedSpecials.forEach(function(item){specialClues.push('第五柱使'+item.name+'条件暂时齐备，但不得倒推改写原局特殊格，只保留行运线索。')});
    if(specialLost.length)specialClues.push(natalSpecialName+'在当前环境未通过全部验真条件，只判运中受损，不改写原局成立结论。');
    specialClues=unique(specialClues);
    var elementPhenomena=elementPhenomenaAnalysis(dayStem,pillars,scores,strength,weightedStrength,currentSpecials);
    var patternIssues=comboResult.formed.filter(function(name){return /待清|待制|待扶/.test(name)});
    var tenGodTerms=currentSpecialDetail?[]:tenGodDiagnostics(counts,profiles,strength,currentSpecials);
    tenGodTerms.forEach(function(item){if(patternIssues.indexOf(item.name)<0)patternIssues.push(item.name)});
    elementPhenomena.forEach(function(item){if(patternIssues.indexOf(item.name)<0)patternIssues.push(item.name)});
    if(currentSpecialDetail)patternIssues=[];
    var conflicts=comboConflictAnalysis(counts,comboResult.formed,profiles,interactions);
    var arbitration=arbitratePatterns(regular,comboResult,currentSpecials,conflicts,monthCommand.selectedGods),rawMainPattern=arbitration.mainPattern;
    var interactionFlow=currentSpecialDetail?specialInteractionFlowAnalysis(currentSpecialDetail,interactions):interactionFlowAnalysis(rawMainPattern,profiles,interactions,conflicts);
    var patternDisease=patternDiseaseAssessment(rawMainPattern,regular,patternIssues,profiles,interactionFlow,conflicts,currentSpecialDetail,interactions,{carryingCapacity:carryingCapacity,pillars:pillars});
    settlePatternNet(arbitration,regular,interactionFlow,patternDisease,currentSpecialDetail);
    var structures=patternStructures(rawMainPattern,comboResult,conflicts,arbitration);
    if(currentSpecialDetail){structures=[];structures.push({name:currentSpecialDetail.name,ruleId:currentSpecialDetail.ruleId,ruleVersion:PATTERN_RULE_VERSION,role:'主格',status:'已成',basis:currentSpecialDetail.evidence.join('；'),issues:[],rescues:[],conflicts:[],relation:'当前运顺势复核',qualification:currentSpecialDetail})}
    structures.unshift({name:regular.name,ruleId:regular.authority.ruleId,ruleVersion:regular.authority.ruleVersion,role:currentSpecialDetail?'月令背景':(rawMainPattern===regular.name?'主格':(regular.formed?'命格基础':'命格主线')),status:currentSpecialDetail?'仅作背景':regular.status,basis:currentSpecialDetail?(regular.name+'只作当前特殊格复核背景。'):regular.basis,issues:currentSpecialDetail?[]:regular.issues,rescues:currentSpecialDetail?[]:regular.rescues,conflicts:[],relation:currentSpecialDetail?'特殊格当前仍成立，不按常格重复裁断':''});
    structures=applyPhenomenaToStructures(structures,elementPhenomena);
    var claritySubject=rawMainPattern==='未见明确成格'?[rawMainPattern].concat(patternIssues).join('；'):rawMainPattern;
    var structuralClarity=directClarity(rawMainPattern,regular,patternClarity(claritySubject,counts,strength,structures,interactionFlow,conflicts,patternDisease,currentSpecialDetail));
    var clarity=applyPhenomenaToClarity(structuralClarity,elementPhenomena),clarityConclusion=patternClarityConclusion(rawMainPattern,regular,structures,clarity,interactionFlow,conflicts,patternDisease,currentSpecialDetail);
    var remedy=currentSpecialDetail?specialContextRemedy(currentSpecialDetail,analysis.useful):remedyAdvice(dayStem,pillars,scores,counts,[rawMainPattern].concat(patternIssues).join('；'),elementPhenomena);
    var positivePhenomena=currentSpecialDetail?[]:positivePhenomenaAnalysis(pillars,scores,strength,profiles,clarityConclusion,interactionFlow,conflicts,elementPhenomena,interactions);
    var currentMainStructure=structures.find(function(item){return item.role==='主格'}),currentStatus=currentMainStructure&&currentMainStructure.status||regular.status;
    var flowGood=!(interactionFlow.steps||[]).length||(interactionFlow.steps||[]).every(function(item){return item.active});
    var diseaseClear=!patternDisease.partial.length&&!patternDisease.unresolved.length,clarityGood=/^(清|较清)$/.test(clarity.level||'');
    if(currentStatus==='已成'&&(!flowGood||!diseaseClear||!clarityGood))currentStatus='成而有瑕';
    return {pillars:pillars,scores:scores,rawScores:rawScores,interactions:interactions,strengthScore:weightedStrength,strength:strength,carryingCapacity:carryingCapacity,profiles:profiles,counts:counts,rawCounts:rawCounts,regularPattern:regular,comboResult:comboResult,dynamicSpecials:dynamicSpecials,currentSpecials:currentSpecials,currentSpecialDetail:currentSpecialDetail,specialLost:specialLost,specialClues:specialClues,elementPhenomena:elementPhenomena,positivePhenomena:positivePhenomena,patternIssues:patternIssues,conflicts:conflicts,arbitration:arbitration,rawMainPattern:rawMainPattern,interactionFlow:interactionFlow,patternDisease:patternDisease,structures:structures,structuralClarity:structuralClarity,clarity:clarity,clarityConclusion:clarityConclusion,remedy:remedy,currentStatus:currentStatus,flowGood:flowGood,diseaseClear:diseaseClear,clarityGood:clarityGood,strictFormation:currentStatus==='已成'&&flowGood&&diseaseClear&&clarityGood};
  }
  function luckRecheck(dayStem,luckGz,analysis){
    if(!analysis||!analysis.pillars||!luckGz||luckGz.length<2)return null;
    var currentPillars={year:analysis.pillars.year,month:analysis.pillars.month,day:analysis.pillars.day,hour:analysis.pillars.hour,luck:luckGz};
    var current=buildTemporalPatternContext(dayStem,currentPillars,analysis),baseline=buildTemporalPatternContext(dayStem,analysis.pillars,analysis);
    var scores=current.scores,weightedStrength=current.strengthScore,strength=current.strength,interactions=current.interactions,counts=current.counts,profiles=current.profiles,carryingCapacity=current.carryingCapacity,regular=current.regularPattern,comboResult=current.comboResult,dynamicSpecials=current.dynamicSpecials,currentSpecialDetail=current.currentSpecialDetail,currentSpecials=current.currentSpecials,elementPhenomena=current.elementPhenomena,positivePhenomena=current.positivePhenomena,patternIssues=current.patternIssues,conflicts=current.conflicts,arbitration=current.arbitration,rawMainPattern=current.rawMainPattern,interactionFlow=current.interactionFlow,patternDisease=current.patternDisease,structures=current.structures,structuralClarity=current.structuralClarity,clarity=current.clarity,clarityConclusion=current.clarityConclusion,remedy=current.remedy;
    var monthCommand=analysis.monthCommand,monthGod=monthCommand&&monthCommand.ambiguous?'':monthCommand&&monthCommand.primaryGod;
    var natalSpecialName=analysis.specialPatternQualification&&analysis.specialPatternQualification.name||'',specialLost=baseline.currentSpecialDetail&&!current.currentSpecialDetail?[baseline.currentSpecialDetail.name]:[];
    var baselineSpecialNames=(baseline.dynamicSpecials.details||[]).map(function(item){return item.name}),specialClues=dynamicSpecials.filter(function(item){return typeof item==='string'&&/倾向|线索|未成/.test(item)}).slice();
    (dynamicSpecials.details||[]).filter(function(item){return item.name!==natalSpecialName&&baselineSpecialNames.indexOf(item.name)<0}).forEach(function(item){specialClues.push('第五柱使'+item.name+'条件暂时齐备，但不得倒推改写原局特殊格，只保留行运线索。')});
    if(specialLost.length)specialClues.push(specialLost[0]+'在当前大运未通过全部验真条件，只判运中受损，不改写原局成立结论。');
    specialClues=unique(specialClues);
    var oldChecks=baseline.regularPattern.checks||[],newChecks=regular.checks||[];
    function changed(type,toActive){return newChecks.filter(function(item){var old=oldChecks.find(function(x){return x.type===item.type&&x.label===item.label});return item.type===type&&item.active===toActive&&(!old||old.active!==toActive)})}
    var completedCandidates=changed('成格',true),newBreakers=changed('破格',true),rescueCandidates=regular.status==='已破'?[]:changed('救应',true);
    var baselineCombos=baseline.comboResult.formed||[],formedAdded=comboResult.formed.filter(function(name){return baselineCombos.indexOf(name)<0&&!/待清|待制|待扶/.test(name)});
    var formedLost=baselineCombos.filter(function(name){return !/待清|待制|待扶/.test(name)&&comboResult.formed.indexOf(name)<0});
    var currentStatus=current.currentStatus,strictFormation=current.strictFormation;
    var diseaseChanges=compareLuckDiseases(baseline.patternDisease,patternDisease),rootChanges=compareLuckRoots(baseline.strengthScore,weightedStrength);
    var natalMain=(analysis.patternStructures||[]).find(function(item){return item.role==='主格'}),fromStatus=natalMain&&natalMain.status||(analysis.regularPattern&&analysis.regularPattern.status)||'待成';
    var fromMain=analysis.mainPattern||'',algorithmOnlyMainChange=rawMainPattern!==fromMain&&rawMainPattern===baseline.rawMainPattern&&baseline.strictFormation;
    if(algorithmOnlyMainChange)strictFormation=false;
    var completed=strictFormation?completedCandidates:[],completionClues=strictFormation?[]:completedCandidates;
    var rescued=(strictFormation||diseaseChanges.residualAfter<diseaseChanges.residualBefore)?rescueCandidates:[],rescueClues=rescued.length?[]:rescueCandidates;
    var effectiveAdded=formedAdded.filter(function(name){return strictFormation&&name===rawMainPattern&&patternAnchoredToMonth(name,monthGod)});
    var acceptedMainPattern=fromMain,acceptedStatus=fromStatus;
    if(rawMainPattern===fromMain){
      acceptedMainPattern=fromMain;
      if(currentStatus!==baseline.currentStatus)acceptedStatus=currentStatus;
      else if(diseaseChanges.residualAfter>diseaseChanges.residualBefore||diseaseChanges.newActive.length)acceptedStatus=fromStatus==='已成'?'成而有瑕':((fromStatus==='成而有瑕'||fromStatus==='待成')?'已破':fromStatus);
    }else if(strictFormation&&rawMainPattern!==baseline.rawMainPattern){
      acceptedMainPattern=rawMainPattern;acceptedStatus=currentStatus;
    }else if(specialLost.length||formedLost.indexOf(fromMain)>=0)acceptedStatus='已破';
    else if(newBreakers.length)acceptedStatus=fromStatus==='已成'?'成而有瑕':regular.status;
    else if(currentStatus!==baseline.currentStatus){
      acceptedStatus=currentStatus;
    }
    var clarityRanks={清:5,较清:4,可清:3,有瑕:2,待清:1,待辨:1,偏浊:0,不清:0,冲战:0,浊:0};
    var oldClarity=baseline.clarity&&baseline.clarity.level||'待辨',clarityDelta=(clarityRanks[clarity.level]||0)-(clarityRanks[oldClarity]||0);
    var comparisonBaseline={strength:baseline.strength,strengthScore:baseline.strengthScore,carryingCapacity:baseline.carryingCapacity,regularPattern:baseline.regularPattern,comboPatterns:baselineCombos,rawMainPattern:baseline.rawMainPattern,currentStatus:baseline.currentStatus,strictFormation:baseline.strictFormation,patternDisease:baseline.patternDisease,clarity:baseline.clarity};
    return {ruleVersion:LUCK_RECHECK_VERSION,scope:'大运作为临时第五柱完整复核；原局月令、主格、百分位和层次不改写',pillars:currentPillars,currentPillars:currentPillars,scores:scores,rawScores:current.rawScores,interactions:interactions,strengthScore:weightedStrength,strength:strength,carryingCapacity:carryingCapacity,profiles:profiles,counts:counts,rawCounts:current.rawCounts,regularPattern:regular,comboPatterns:comboResult.formed,comboDetails:comboResult.details,comboClues:comboResult.clues,conflicts:conflicts,arbitration:arbitration,rawMainPattern:rawMainPattern,currentMainPattern:acceptedMainPattern,currentStatus:acceptedStatus,rawCurrentStatus:currentStatus,strictFormation:strictFormation,structures:structures,interactionFlow:interactionFlow,patternIssues:patternIssues,patternDisease:patternDisease,remedy:remedy,structuralClarity:structuralClarity,clarity:clarity,clarityConclusion:clarityConclusion,elementPhenomena:elementPhenomena,positivePhenomena:positivePhenomena,specialPatterns:currentSpecials,specialCandidates:dynamicSpecials,specialPatternQualification:currentSpecialDetail,specialLost:specialLost,specialClues:specialClues,completed:completed,completionClues:completionClues,newBreakers:newBreakers,rescued:rescued,rescueClues:rescueClues,formedAdded:formedAdded,effectiveAdded:effectiveAdded,formedLost:formedLost,rootChanges:rootChanges,diseaseChanges:diseaseChanges,clarityChange:{before:oldClarity,after:clarity.level,direction:clarityDelta>0?'改善':(clarityDelta<0?'转差':'维持')},comparisonBaseline:comparisonBaseline,fromStatus:fromStatus,fromMain:fromMain};
  }
  function evaluateLuckImpact(dayStem,luckGz,analysis){
    analysis=analysis||{};
    var recheck=luckRecheck(dayStem,luckGz,analysis);
    var useful=analysis.useful||{use:[],avoid:[]},stem=luckGz&&luckGz[0],branch=luckGz&&luckGz[1];
    var stemWx=STEM_WX[stem],branchWx=BRANCH_WX[branch],score=0,reasons=[],elements=[];
    if(recheck){
      var stemRelations=(recheck.interactions.stemCombines||[]).filter(function(item){return item.involvesLuck&&item.active!==false});
      var stemTransform=stemRelations.find(function(item){return item.effect==='transform'}),stemBlocked=stemRelations.some(function(item){return /^(bind|contest|daymaster-combine)$/.test(item.effect)});
      if(stemTransform)elements.push(stemTransform.target);else if(!stemBlocked)elements.push(stemWx);
      var luckGroup=(recheck.interactions.groups||[]).filter(function(item){return item.complete&&item.active&&item.involvesLuck}).sort(function(a,b){return b.priority-a.priority})[0];
      var branchTransform=(recheck.interactions.branchPairs||[]).find(function(item){return item.involvesLuck&&item.type==='六合'&&item.active!==false&&item.effect==='transform'});
      if(luckGroup&&!luckGroup.challenged)elements.push(luckGroup.element);else if(branchTransform)elements.push(branchTransform.target);else{elements.push(branchWx);if(luckGroup)elements.push(luckGroup.element)}
    }else elements=[stemWx,branchWx];
    elements=unique(elements);
    var elementScore=0,elementReasons=[],scoreLedger={numericOwner:'喜忌五行',structuralScore:0,elementScore:0};
    elements.forEach(function(w){
      if((useful.use||[]).indexOf(w)>=0){elementScore++;elementReasons.push(w+'为喜用')}
      if((useful.avoid||[]).indexOf(w)>=0){elementScore--;elementReasons.push(w+'为慎用')}
    });
    elementScore=Math.max(-2,Math.min(2,elementScore));scoreLedger.elementScore=elementScore;
    if(recheck){
      var outcomeStatusRank={已破:0,待成:1,成而有瑕:2,已成:3},fromRank=outcomeStatusRank[recheck.fromStatus],toRank=outcomeStatusRank[recheck.currentStatus],statusImproved=toRank>fromRank,statusWorsened=toRank<fromRank,mainChanged=recheck.currentMainPattern!==recheck.fromMain;
      var carryingBefore=recheck.comparisonBaseline&&recheck.comparisonBaseline.carryingCapacity&&recheck.comparisonBaseline.carryingCapacity.canCarryOutputKill,carryingAfter=recheck.carryingCapacity.canCarryOutputKill;
      var carryImproved=carryingAfter&&!carryingBefore,carryWorsened=!carryingAfter&&carryingBefore,diseaseImproved=recheck.diseaseChanges.residualAfter<recheck.diseaseChanges.residualBefore,diseaseWorsened=recheck.diseaseChanges.residualAfter>recheck.diseaseChanges.residualBefore||recheck.diseaseChanges.newActive.length>0;
      var decisivePositive=!!(!recheck.specialLost.length&&recheck.strictFormation&&(statusImproved||mainChanged||recheck.effectiveAdded.length)),decisiveNegative=!!(statusWorsened||recheck.specialLost.length||recheck.newBreakers.length||recheck.formedLost.length);
      var softPositive=!!(statusImproved||carryImproved||diseaseImproved||recheck.completed.length||recheck.rescued.length),softNegative=!!(carryWorsened||diseaseWorsened);
      var hasStructuralChange=decisivePositive||decisiveNegative||softPositive||softNegative,structuralScore=decisivePositive&&!decisiveNegative?2:(decisiveNegative&&!decisivePositive?-2:(softPositive&&!softNegative?1:(softNegative&&!softPositive?-1:0)));
      score=hasStructuralChange?structuralScore:0;
      scoreLedger={numericOwner:decisivePositive||decisiveNegative?'格局状态迁移':(statusImproved?'格局条件改善':(hasStructuralChange?'病药与承载净变化':'未确认结构变化')),structuralScore:structuralScore,elementScore:elementScore,elementCounted:false,reason:'喜忌五行只作方向参考，不据两个字抬降档；根气、承载、病药、救应与成格只按最末端有效结论结算一次'};
      if(elementReasons.length)reasons.push(elementReasons.join('、')+'（属性参考，不作为抬降档证据）');
      if(carryImproved)reasons.push('第五柱净根力使日主承载转为可用');
      if(carryWorsened)reasons.push('第五柱冲刑合会后日主承载转弱');
      if(diseaseImproved)reasons.push('病药复核后残病减轻');
      if(diseaseWorsened)reasons.push('病药复核后新增或加重残病');
      if(recheck.completed.length)reasons.push('补足'+recheck.completed.map(function(x){return x.label}).join('、'));
      if(recheck.rescued.length)reasons.push('落实'+recheck.rescued.map(function(x){return x.label}).join('、'));
      if(recheck.effectiveAdded.length)reasons.push('运中补成'+recheck.effectiveAdded.join('、'));
      var triggeredOnly=recheck.formedAdded.filter(function(name){return recheck.effectiveAdded.indexOf(name)<0});
      if(triggeredOnly.length)reasons.push('另触发'+triggeredOnly.join('、')+'候选，但完整条件未全过，只保留线索');
      if(recheck.completionClues.length)reasons.push('见'+recheck.completionClues.map(function(x){return x.label}).join('、')+'，但作用链、清浊或病药未全过');
      if(recheck.newBreakers.length)reasons.push('引发'+recheck.newBreakers.map(function(x){return x.label}).join('、'));
      if(recheck.formedLost.length)reasons.push('原有'+recheck.formedLost.join('、')+'受损');
      if(recheck.specialLost.length)reasons.push('当前运破坏'+recheck.specialLost.join('、')+'成立条件');
      if(recheck.specialClues.length)reasons.push(recheck.specialClues.map(function(item){return item.replace(/。$/,'')}).join('、'));
      recheck.interactions.groups.filter(function(item){return item.activatedByLuck&&item.active}).forEach(function(item){reasons.push('大运补成'+item.name+(item.challenged?'但成局有瑕':'') )});
      var luckRelations=(recheck.interactions.stemCombines||[]).concat(recheck.interactions.branchPairs||[]).filter(function(item){return item.involvesLuck});
      if(luckRelations.length)reasons.push('第五柱作用：'+luckRelations.map(function(item){return item.text}).join('、'));
      if(recheck.clarityChange.direction!=='维持')reasons.push('清浊由'+recheck.clarityChange.before+'转为'+recheck.clarityChange.after);
    }else{score=0;scoreLedger.elementCounted=false;if(elementReasons.length)reasons.push(elementReasons.join('、')+'（缺少作用复核，仅作属性参考）')}
    score=Math.max(-2,Math.min(2,score));
    var base=PATTERN_LEVELS.indexOf(analysis.patternLevelGrade);
    if(base<0)base=1;
    var delta=score>=2?1:(score<=-2?-1:0),current=PATTERN_LEVELS[Math.max(0,Math.min(PATTERN_LEVELS.length-1,base+delta))];
    var action=delta>0?'提升':(delta<0?'下降':'维持');
    var main=(analysis.patternStructures||[]).find(function(item){return item.role==='主格'});
    var fromStatus=(main&&main.status)||(analysis.regularPattern&&analysis.regularPattern.status)||'待成';
    var toStatus=recheck&&recheck.currentStatus||fromStatus;
    var fromMain=analysis.mainPattern||'',toMain=recheck&&recheck.currentMainPattern||fromMain;
    if(!recheck){
      toStatus=fromStatus;
      if(delta>0){if(fromStatus==='已破'||fromStatus==='待成')toStatus='成而有瑕';else if(fromStatus==='成而有瑕')toStatus='已成'}
      else if(delta<0){if(fromStatus==='已成')toStatus='成而有瑕';else if(fromStatus==='成而有瑕'||fromStatus==='待成')toStatus='已破'}
    }
    var mainText=fromMain&&toMain&&fromMain!==toMain?'，主格由'+fromMain+'转看'+toMain:'';
    var statusRank={已破:0,待成:1,成而有瑕:2,已成:3},statusImproved=(statusRank[toStatus]||0)>(statusRank[fromStatus]||0),statusWorsened=(statusRank[toStatus]||0)<(statusRank[fromStatus]||0);
    var activationStatus=recheck&&recheck.specialLost.length?'特殊格运中受损':(recheck&&recheck.strictFormation&&(statusImproved||fromMain!==toMain)?'运中补格':(statusImproved?'条件改善':(statusWorsened||delta<0?'当前受阻':(delta>0?'发挥提升':'平运维持'))));
    return {gz:luckGz,ruleVersion:LUCK_RECHECK_VERSION,score:score,scoreLedger:scoreLedger,delta:delta,action:action,grade:current,natalGrade:analysis.patternLevelGrade,currentGrade:current,activationStatus:activationStatus,scope:'只调整当前大运发挥，不改写原局结构层次',fromStatus:fromStatus,toStatus:toStatus,fromMain:fromMain,toMain:toMain,conditionReview:recheck,text:'当前大运'+luckGz+'（'+activationStatus+'）：格局状态'+(fromStatus===toStatus?'维持'+fromStatus:'由'+fromStatus+'转为'+toStatus)+mainText+'，层次'+action+'为'+current+'；'+(reasons.length?unique(reasons).join('、'):'第五柱完整复核后未直接补足或破坏主格条件')+'。 原局层次保持'+analysis.patternLevelGrade+'不变。'};
  }
  var LUCK_OUTLOOK_VERSION='luck-outlook-20261108.3-mixed-copy';
  function outlookPending(reason){
    return {direction:'pending',assessment:'input-error',summary:reason,evidence:[],reservations:[],uncertainty:[reason],life:[],basis:'资料校验未通过'};
  }
  var OUTLOOK_SOURCES={官:'215722',财:'215720',印:'215718',食:'215716',杀:'215714',伤:'215712',刃:'215710',禄:'215708'};
  function outlookRootRestricted(root){
    var attacks=root.attacks||[];
    // 刑害破 names alone do not establish loss of a usable root (任氏地支注).
    return !!root.boundByCombine||attacks.some(function(x){return /冲/.test(x)})||!!root.attacked&&!attacks.length;
  }
  function outlookGod(context,names){
    var stems=[],roots=[],rawStems=[],rawRoots=[],command=false;
    names.forEach(function(name){
      var profile=context.profiles[name]||{};
      rawStems=rawStems.concat(profile.stemEntries||[]);rawRoots=rawRoots.concat(profile.branchEntries||[]);
      stems=stems.concat((profile.stemEntries||[]).filter(function(x){return x.usable!==false&&x.effect!=='transform'&&x.effect!=='contest'}));
      var usable=(profile.branchEntries||[]).filter(function(x){return x.usable!==false&&!x.transformedAway&&(x.rootPower||0)>0});
      roots=roots.concat(usable);
      if(profile.monthCommand&&usable.some(function(x){return x.pillar==='month'}))command=true;
    });
    // 同气根沿用原局口径；根的阴阳来源不替换透干作用者，也不重复计根。
    var sharedRoots=names.reduce(function(out,name){return out.concat(godRootEvidence(context.profiles,name))},[]),rootKeys={};
    roots=sharedRoots.filter(function(root){var key=root.pillar+':'+root.stem;if(rootKeys[key])return false;rootKeys[key]=true;return true});
    sharedRoots.forEach(function(root){if(!rawRoots.some(function(item){return item.pillar===root.pillar&&item.stem===root.stem}))rawRoots.push(root)});
    if(names.indexOf('比肩')>=0&&!rawStems.some(function(x){return x.pillar==='day'})){
      var dayChange=stemInteractionChange(2,context.interactions),dayEntry={pillar:'day',position:2,stem:context.pillars.day[0],usable:dayChange.usable,effect:dayChange.effect,relations:dayChange.relations.map(function(x){return x.text})};
      rawStems.push(dayEntry);if(dayEntry.usable)stems.push(dayEntry);
    }
    var clean=roots.filter(function(x){return !outlookRootRestricted(x)}),main=clean.filter(function(x){return x.hiddenIndex===0});
    var clear=stems.length>0||command;
    var internal=[],limited=false;
    TEMPORAL_PILLAR_KEYS.filter(function(key){return context.pillars[key]}).forEach(function(key){
      var gz=context.pillars[key],stemWx=STEM_WX[gz[0]],branchStem=(HIDDEN[gz[1]]||[])[0],branchWx=STEM_WX[branchStem];
      var head=ctrl[stemWx]===branchWx,foot=ctrl[branchWx]===stemWx;
      if(!head&&!foot)return;
      var involved=head?roots.some(function(x){return x.pillar===key&&x.hiddenIndex===0}):stems.some(function(x){return x.pillar===key});
      if(!involved)return;
      var controller=head?stemWx:branchWx,bridge=gen[controller];
      var bridged=godNamesForElement(context.pillars.day[0],bridge).some(function(name){
        var p=context.profiles[name]||{};
        return (p.stemEntries||[]).some(function(x){return x.usable!==false&&x.effect!=='transform'&&x.effect!=='contest'})&&(p.branchEntries||[]).some(function(x){return x.usable!==false&&!x.transformedAway&&!outlookRootRestricted(x)&&x.rootPower>0});
      });
      var otherRoot=clean.some(function(x){return x.pillar!==key});
      internal.push((key==='luck'?'大运':'流年')+gz+(head?'盖头':'截脚')+'，所用'+(head?branchWx:stemWx)+(bridged?'有透清通根之'+bridge+'承接，继续核对主链':(otherRoot?'另有未损根，保留内部制约而不定整运凶':'未见可用通关或其他未损根，作用是否足够待核')));
      if(!bridged&&!otherRoot)limited=true;
    });
    return {names:names,stems:stems,roots:roots,command:command,clear:clear,present:stems.length>0||roots.length>0,
      usable:clear&&roots.length>0,dims:[command?1:0,main.length,clean.length,clear?1:0],
      uncertain:roots.length>0&&!clean.length||limited,
      facts:[names.join('/')+'：'+(clear?'透清或得令':'未透清')+'，可用根'+roots.length+'，未受冲绊本气根'+main.length].concat(rawStems.map(function(x){return ((PILLAR_META[x.pillar]||{}).stemLabel||'参与天干')+x.stem+'：'+(x.usable===false?'失用，'+({bind:'合绊',contest:'争合',transform:'合化改性','daymaster-combine':'日主合绊'}[x.effect]||'受制'):'可用')+(x.relations&&x.relations.length?'（'+x.relations.join('、')+'）':'')}),rawRoots.map(function(x){return ((PILLAR_META[x.pillar]||{}).branchLabel||'参与地支')+x.branch+'藏'+x.stem+'：'+(x.hiddenIndex===0?'本气':'余气')+(x.transformedAway?'已变气':(x.usable===false?'失根':(x.boundByCombine?'合绊余根':'可用根')))+(x.attacks&&x.attacks.length?'，'+x.attacks.join('、'):'')})),
      signature:JSON.stringify([command,stems.map(function(x){return [x.pillar,x.stem,x.effect||'none']}),roots.map(function(x){return [x.pillar,x.stem,x.hiddenIndex,!!x.boundByCombine,outlookRootRestricted(x)]}),internal]),internal:internal};
  }
  // These qualitative comparisons select a branch; they are not a fortune score.
  function outlookRelative(left,right){
    if(!left.usable||!right.usable||left.uncertain||right.uncertain)return null;
    var greater=false,less=false;
    left.dims.forEach(function(value,index){if(value>right.dims[index])greater=true;if(value<right.dims[index])less=true});
    if((greater||less)&&left.dims[0]===right.dims[0]&&left.dims[4]===right.dims[4])return null;
    return greater&&less?null:(greater?1:(less?-1:0));
  }
  function outlookLink(context,left,right){
    if(!left.present||!right.present)return 0;
    if(!left.usable||!right.clear)return 0;
    var pairs=[];
    left.stems.forEach(function(a){right.stems.forEach(function(b){
      if(a.pillar===b.pillar)return;
      var temporal=a.temporal||b.temporal,near=Math.abs(a.position-b.position)<=2;
      // A temporal stem needs its actual roots and a clear target, rather than a synthetic distance of 1.
      if(temporal?right.roots.length>0:near)pairs.push([a,b]);
    })});
    if(left.command&&right.stems.length)pairs.push([left.roots.find(function(x){return x.pillar==='month'}),right.stems[0]]);
    if(right.command&&left.stems.length)pairs.push([left.stems[0],right.roots.find(function(x){return x.pillar==='month'})]);
    if(!pairs.length)return 0;
    if(left.uncertain||right.uncertain)return null;
    return 1;
  }
  function outlookCore(context,analysis){
    var tasks=[],dayStem=context.pillars.day[0],family=context.regularPattern.authority.key;
    var groups={B:['比肩','劫财'],I:['正印','偏印'],W:['正财','偏财'],O:['正官'],K:['七杀'],F:['食神'],H:['伤官'],U:['食神','伤官']},g={};
    Object.keys(groups).forEach(function(key){g[key]=outlookGod(context,groups[key])});
    var supports={B:['I'],I:['O','K'],W:['U'],O:['W'],K:['W'],F:['B'],H:['B'],U:['B']};
    Object.keys(g).forEach(function(key){
      var incoming=supports[key].filter(function(from){return outlookLink(context,g[from],g[key])===1});
      g[key].dims.push(incoming.length?1:0);
      g[key].facts.push(incoming.length?'实际生扶来自'+incoming.map(function(x){return groups[x].join('/')}).join('、'):'未确认额外有效生扶');
      g[key].facts=g[key].facts.concat(g[key].internal);
      g[key].signature=JSON.stringify([g[key].signature,incoming.map(function(x){return g[x].names})]);
    });
    var dayRoots=(context.strengthScore.dimensions.roots.items||[]).filter(function(x){return x.usable!==false&&!x.transformedAway}),cleanDay=dayRoots.filter(function(x){return !outlookRootRestricted(x)&&!x.changedByGroup&&!x.changedByInteraction});
    var weak=/弱/.test(context.strength),strong=/强/.test(context.strength);
    var source={title:'《子平真诠》'+({官:'正官',财:'财',印:'印绶',食:'食神',杀:'偏官',伤:'伤官',刃:'阳刃',禄:'建禄月劫'}[family]||'行运')+'取运',url:'https://chinesebooks.github.io/yijingshuji/zipingzhenquan/'+(OUTLOOK_SOURCES[family]||'215729')+'.html'};
    function task(id,label,state,keys,reason,life,ruleId,counter){
      var conditions=unique(keys.reduce(function(out,key){return out.concat(g[key].facts)},[]).concat(reason));
      // Presentation-only actor snapshots; task states, signatures and arbitration do not read these.
      var actorGroups={};
      keys.forEach(function(key){
        function actor(x,kind){return {pillar:x.pillar,position:x.position,stem:x.stem,branch:x.branch||null,kind:kind,
          god:x.pillar==='day'&&kind==='干'?'日主':tenGod(dayStem,x.stem),text:(x.branch?x.branch+'藏':'')+x.stem+(x.pillar==='day'&&kind==='干'?'日主':tenGod(dayStem,x.stem)),
          usable:x.usable!==false&&!x.transformedAway,restricted:kind==='支'&&outlookRootRestricted(x)}}
        actorGroups[key]={names:g[key].names,command:g[key].command,usable:g[key].usable,uncertain:g[key].uncertain,
          stems:g[key].stems.map(function(x){return actor(x,'干')}),roots:g[key].roots.map(function(x){return actor(x,'支')})};
      });
      var taskSource=ruleId==='LK-10'?{title:(analysis.specialPatternQualification.source||['《滴天髓阐微》从象、化象与独象']).join('；'),url:'https://zh.wikisource.org/zh-hans/滴天髓阐微'}:source;
      // LK-03 checks a specific harmful mechanism; its rescue is neutral here, with benefits checked by the usable paths.
      tasks.push({id:id,label:label,state:state,actorGroups:actorGroups,possibleStates:state===null?(ruleId==='LK-03'?[-1,0]:[-1,0,1]):[state],ruleId:ruleId||'LK-02',source:taskSource,conditions:conditions,counterEvidence:counter||[],
        reason:reason,life:life||'相关发挥条件发生变化，仍需结合尚存的限制。',signature:JSON.stringify(keys.map(function(key){return g[key].signature}).concat(reason))});
    }
    function possibilities(item){return item.state===null?item.possibleStates:[item.state]}
    function uniqueStates(states){return states.filter(function(value,index){return states.indexOf(value)===index})}
    function settlePath(states,check){
      return uniqueStates(states.reduce(function(out,state){
        if(state!==1)return out.concat(state);
        return out.concat(possibilities(check));
      },[]));
    }
    function capacity(load){
      if(!load.present)return {state:0,reason:'未见当前所用的压力对象'};
      if(!load.usable)return {state:0,reason:'对象未透清得令或未通根，尚未建立实际任用，不据其存在新增承载压力'};
      if(load.uncertain)return {state:null,reason:'所用对象根气受冲绊或运柱内部制约，任用强度尚未确认'};
      var support=outlookLink(context,g.I,g.B)===1||g.B.usable&&cleanDay.length>0;
      if(!dayRoots.length&&!support)return {state:-1,reason:'任用对象存在，但日主无可用根且未见有效印比承接'};
      var loadBalance=outlookRelative(load,g.B);
      if(loadBalance===1&&!g.I.usable&&!strong)return {state:-1,reason:'所用压力的根令与生扶占优，未见可用印承接，日主尚难任用'};
      if(cleanDay.length&&(!weak||outlookLink(context,g.I,g.B)===1))return {state:1,reason:'日主有未损根，'+(!weak?'旺衰提示亦支持任用':'有可达之印承接压力生身')};
      if(weak&&!cleanDay.length&&outlookLink(context,g.I,g.B)!==1)return {state:-1,reason:'所用压力有根透，日主偏弱且根气受损，未见有效印承接'};
      return {state:0,reason:'有部分根气或扶身，但尚未补足此对象的任用条件'};
    }
    function breaker(bad,target,medicine){
      var link=outlookLink(context,g[bad],g[target]);
      if(link!==1)return link===0?{state:0,reason:'未形成对应破坏'}:{state:null,possibleStates:[-1,0],reason:'破坏因素有线索，根透或路径未确认'};
      if(medicine){
        var rescue=outlookLink(context,g[medicine],g[bad]);
        if(rescue===1){
          var balance=outlookRelative(g[medicine],g[bad]);
          if(balance===null||balance<0)return {state:null,possibleStates:[-1,0],reason:'救应可达，但尚不能确认足以制去破坏'};
          return {state:0,reason:groups[medicine].join('/')+'可达且根透不弱于破坏因素，已结算救应'};
        }
        if(rescue===null&&g[medicine].present)return {state:null,possibleStates:[-1,0],reason:'救应已有线索，是否有效尚未确认'};
      }
      return {state:-1,reason:groups[bad].join('/')+'有效作用于'+groups[target].join('/')+'，未见足够救应'};
    }
    function path(id,label,from,to,options){
      options=options||{};
      var keys=unique([from,to].concat(options.keys||[])),state=outlookLink(context,g[from],g[to]),reason=state===1?'根透与具体作用对象支持路径可达':(state===0?'当前未建立该路径':'根透或具体作用通路尚未确认'),counter=[];
      var connected=state===1&&options.enabled!==false,maybeAbsent=state===null,possible=state===null?[1]:[state];
      if(options.enabled===false)state=0,reason='当前所用分支不采用此路径';
      if(options.enabled===false)possible=[0];
      if(possible.indexOf(1)>=0&&options.condition){
        var check=options.condition();
        if(check.state===null&&!check.possibleStates)check.possibleStates=[-1,0,1];
        possible=settlePath(possible,check);reason+='；'+check.reason;
      }
      if(options.enabled!==false&&(state===1||state===null)&&options.breaks){
        options.breaks.forEach(function(item){
          var result=breaker(item[0],item[1],item[2]);counter.push(result.reason);
          possible=uniqueStates(possible.reduce(function(out,value){
            return out.concat(possibilities(result).map(function(breakState){return value===-1?-1:(breakState===-1?-1:value)}));
          },[]));
        });
      }
      if(maybeAbsent&&options.enabled!==false)possible=uniqueStates(possible.concat(0));
      state=possible.length===1?possible[0]:null;
      task(id,label,state,keys,reason+(counter.length?'；'+counter.join('；'):''),options.life,options.ruleId,counter);
      tasks[tasks.length-1].applicable=options.enabled!==false;
      tasks[tasks.length-1].examined=options.enabled!==false&&(connected||maybeAbsent);
      tasks[tasks.length-1].assessed=connected&&g[to].usable&&state!==null;
      tasks[tasks.length-1].possibleStates=possible;
      tasks[tasks.length-1].signature=JSON.stringify([tasks[tasks.length-1].signature,possible.slice().sort()]);
    }
    function carrying(id,label,key){
      var cap=capacity(g[key]);
      task(id,label,cap.state,[key,'B','I'],cap.reason+'；未损日主根'+cleanDay.length,'任务压力与自身根气、支持条件的匹配发生变化。','LK-05');
      tasks[tasks.length-1].examined=g[key].usable;
    }
    function foodKill(){
      path('food-kill','食神制杀及食杀轻重','F','K',{keys:['I','W','B'],ruleId:'LK-05',condition:function(){
        var balance=outlookRelative(g.F,g.K),cap=capacity(g.K);
        if(balance===null)return {state:null,possibleStates:cap.state===null?[-1,0,1]:uniqueStates([0,cap.state]),reason:'食杀根透优势交叉，轻重尚未确认'};
        if(balance!==0)return {state:0,reason:balance<0?'杀较重、食较轻，需要有效助食，不能只凭见食判制杀完成':'食较重、杀较轻，需要适当助杀或裁食，不能继续一律助食'};
        return {state:cap.state===1?1:cap.state,reason:'食杀各有可用根透且未见单方优势；'+cap.reason};
      },breaks:[['I','F','W']],life:'制约任务压力与表达产出的条件发生变化。'});
    }
    function killingSeal(){
      path('kill-seal','印化杀并承接生身','K','I',{keys:['W','B'],condition:function(){return {state:outlookLink(context,g.I,g.B),possibleStates:[0,1],reason:'另核印是否实际生身，不以印出现直接认化杀'}},breaks:[['W','I','B']]});
    }
    function hurtingSeal(){
      path('hurt-seal','伤官配印的实际制伤与护身','I','H',{keys:['B','W'],condition:function(){
        var balance=outlookRelative(g.H,g.I);
        if(!g.I.roots.some(function(x){return x.hiddenIndex===0&&!outlookRootRestricted(x)}))return {state:null,reason:'印有线索，但未确认深根足以配印'};
        if(balance===null)return {state:null,reason:'伤、印轻重依据交叉，不能仅见印即判助益'};
        if(strong&&balance<0)return {state:-1,reason:'身已有根且偏强，伤较轻而印占优，继续制伤会压低出口'};
        if(weak&&balance>=0&&dayRoots.length)return {state:1,reason:'伤有根透、身偏弱但有根承接、印有未损本气根，支持制伤护身'};
        return {state:null,reason:'尚未确认伤旺、身与印匹配，身强本身不作破格依据'};
      },breaks:[['W','I','B']],life:'表达产出与学习、支持资源之间的配合发生变化。'});
    }
    function wealthSharing(){
      if(!g.W.present||!g.B.present){task('wealth-sharing','比劫扶身与实际分财',0,['B','W','O','U'],'未见实际分财对象或参与者','','LK-03');return}
      var link=outlookLink(context,g.B,g.W),balance=outlookRelative(g.B,g.W),state=0,reason='未确认实际分财，不以见比劫直接设破点',counter=[];
      var officerBalance=outlookRelative(g.O,g.B),officerRescue=outlookLink(context,g.O,g.B)===1&&officerBalance!==null&&officerBalance>=0&&breaker('H','O','I').state===0;
      var outputRescue=tasks.some(function(x){return x.id==='output-wealth'&&x.state===1})&&outlookLink(context,g.B,g.U)===1;
      if(link===1&&(officerRescue||outputRescue)){
        reason=officerRescue?'官有实际制比劫路径且未留伤官破坏，分财先结算救应':'食伤实际承接比劫，生财路径的承载、破坏及救应已核对有效，分财先结算救应';
        counter.push(reason);
      }else if(link===1&&strong&&balance===1){
        state=-1;reason='身有根且偏强、比劫根透占优并可达财，财受有效分夺';
      }else if(link===1&&weak)reason='日主需承财支持，比劫先核扶身，不能同时自动认夺财';
      else if(link===1&&balance===null)state=null,reason='实际分财的轻重尚未确认';
      task('wealth-sharing','比劫扶身与实际分财',state,['B','W','O','U'],reason,'竞争、合作及资源分配上的矛盾发生变化。','LK-03',counter);
    }
    function outputWealth(){
      path('output-wealth','食伤生财的有效出口','U','W',{keys:['I','B'],condition:function(){return capacity(g.W)},breaks:[['I','U','W']],life:'表达产出转化为可利用资源的条件发生变化。'});
      wealthSharing();
    }
    function official(){
      carrying('carry-officer','任官的根气与支持条件','O');
      path('wealth-officer','财生官','W','O',{keys:['B','I'],condition:function(){return capacity(g.O)}});
      path('officer-seal','官印承接','O','I',{keys:['B','W'],condition:function(){return {state:outlookLink(context,g.I,g.B),possibleStates:[0,1],reason:'印须实际生身，普通佩印不一律忌财食伤'}}});
      if(g.H.present){
        var hit=breaker('H','O','I');
        if(hit.state===-1&&outlookLink(context,g.H,g.W)===1&&outlookLink(context,g.W,g.O)===1)hit={state:0,reason:'伤官有财通关生官，先结算实际通关'};
        task('hurt-officer','印制伤护官与财通关',hit.state,['H','O','I','W'],hit.reason,'工作职责与表达方式之间的协调条件发生变化。','LK-03');
      }
    }
    var special=analysis.specialPatternQualification;
    if(special&&context.currentSpecialDetail){
      var detail=context.currentSpecialDetail,targetGods=godNamesForElement(dayStem,detail.target),target=outlookGod(context,targetGods);
      var flow=!!(detail.flowChecks||[]).length&&detail.flowChecks.every(function(x){return x.met}),opposite=outlookGod(context,godNamesForElement(dayStem,officerElement(detail.target)));
      task('special-flow',detail.name+'的实际顺势与出口',flow&&target.usable&&!opposite.usable?1:null,[],flow?'逐项复核顺势链；'+target.facts.join('；'):'顺势链未完整确认','原有顺势条件与可用出口发生变化。','LK-10');
      tasks[tasks.length-1].signature=JSON.stringify([target.signature,opposite.signature,detail.flowChecks]);
      task('special-reversal','特殊路线的有效逆势',0,['I','B'],'未见已确认的有效逆势，不以资格保留新增正面证据','','LK-10');
    }else{
      if(special){
        var reversal=/从格|化气/.test(special.name)&&cleanDay.length>0;
        var opposite=outlookGod(context,godNamesForElement(dayStem,officerElement(special.target)));
        if(reversal||opposite.usable){
          var cause=reversal?'日主新增实际未损根，原有无根顺势条件被改变':opposite.facts.join('；')+'实际逆制所用气势';
          task('special-reversal',special.name+'的具体破坏',-1,['B','I'],cause,'原有顺势条件受到具体干扰，另核可用常格路径。','LK-10');
          task('special-flow',special.name+'的实际顺势与出口',0,[],cause+'；原顺势链不再作为已确认路径','','LK-10');
        }else{
          task('special-flow',special.name+'的阶段复核',null,[],'资格未通过但尚未找到足以裁决的具体破坏；不据资格开关判坏','','LK-10');
          task('special-reversal','特殊路线的有效逆势',null,['B','I'],'尚未确认具体破坏与救应','','LK-10');
        }
      }
      if(family==='官')official();
      else if(family==='财'){
        carrying('carry-wealth','任财的根气与支持条件','W');outputWealth();
        path('wealth-officer','财生官承接','W','O',{keys:['I','B'],condition:function(){return capacity(g.O)}});
        path('wealth-seal','财佩印的生身承接','I','B',{keys:['W'],enabled:weak,condition:function(){return capacity(g.W)},breaks:[['W','I','B']]});
        if(g.K.present){foodKill();killingSeal()}
      }else if(family==='印'){
        path('seal-body','印的实际生身支持','I','B',{keys:['W','U'],enabled:weak||!strong,breaks:[['W','I','B']]});
        path('seal-source','官杀生印','K','I',{keys:['O','W'],enabled:!strong,breaks:[['W','I','B']]});
        path('officer-seal','官印承接','O','I',{enabled:!strong,keys:['W'],breaks:[['W','I','B']]});
        path('body-output','身印旺时的食伤泄秀','B','U',{keys:['I','W'],enabled:strong,breaks:[['I','U','W']]});
        path('wealth-tunes-seal','印重时财调印','W','I',{keys:['B','U'],enabled:strong,condition:function(){var r=outlookRelative(g.I,g.W);return {state:r===null?null:(r>=0?1:-1),reason:r>=0?'印有根而财未占优，核对财调印':'财印轻重未确认或财过重，不能称作适量调印'}}});
      }else if(family==='食'){
        carrying('carry-output','承泄的根气与支持条件','U');outputWealth();foodKill();
        path('food-seal-tune','食过重时印的裁制','I','F',{keys:['K','B'],enabled:g.K.usable,condition:function(){var r=outlookRelative(g.F,g.K);return {state:r===1?1:(r===null?null:0),possibleStates:[0,1],reason:r===1?'食根透优势明确，印裁食与夺食分开':'未确认食过重，不把印直接当调节'}}});
        if(/弃食|杀印/.test(context.rawMainPattern))killingSeal();
      }else if(family==='杀'){
        foodKill();killingSeal();carrying('carry-kill','任杀与承泄的支持条件','K');
        path('blade-kill','刃当杀的实际平衡','K','B',{keys:['F','I'],condition:function(){var r=outlookRelative(g.B,g.K);return {state:r===null?null:(r===0?1:0),possibleStates:[0,1],reason:r===null?'刃杀轻重未确认':(r===0?'刃杀根透相互承接':'刃杀一方占优，须补不足或有效制化')}}});
      }else if(family==='伤'){
        carrying('carry-output','承泄的根气与支持条件','U');outputWealth();hurtingSeal();
        if(g.K.present){path('hurt-kill','伤官制杀','H','K',{keys:['W','I','B'],condition:function(){return capacity(g.K)},breaks:[['W','K','H']]});killingSeal()}
        if(g.O.present)official();
      }else if(family==='刃'){
        path('officer-blade','官制刃','O','B',{keys:['H','I'],breaks:[['H','O','I']]});
        path('kill-blade','杀制刃及轻重','K','B',{keys:['I','F'],condition:function(){var r=outlookRelative(g.K,g.B);return {state:r===null?null:(r===0?1:0),possibleStates:[0,1],reason:r===null?'刃杀轻重未确认':(r===0?'刃杀均有可用根透':'刃杀有偏重，须按所需补足或制化')}}});
      }else if(family==='禄'){
        outputWealth();foodKill();official();
        path('body-output','建禄月劫的食伤出口','B','U',{keys:['I','W'],condition:function(){return capacity(g.U)},breaks:[['I','U','W']]});
      }
      // 官杀兼见与实质混杂共用原局判据；普通见印仍不能冒充完整承接。
      if(g.O.usable&&g.K.usable){
        var state=-1,reason='官杀各有可用根透，未确认去留取清';
        if(outlookLink(context,g.F,g.K)===1||outlookLink(context,g.H,g.K)===1)state=null,reason='已有去留／制杀线索，是否只去其一仍须确认';
        if(assessOfficerMixture(context.profiles,context.interactions,context.pillars,context.carryingCapacity).mediated)state=0,reason='官杀分别至印、印至日主均接通且承载通过；兼见已有实际印化，不强制去一';
        task('officer-kill-mixed','官杀去留',state,['O','K','F','H','I','B'],reason,'工作要求与任务压力的主次协调发生变化。','LK-03');
      }
    }
    var month=context.pillars.month[1],elements=function(wx){return outlookGod(context,godNamesForElement(dayStem,wx))},fire=elements('火'),water=elements('水'),metal=elements('金'),wood=elements('木');
    var climate=seasonTune(dayStem,month,context.scores),cold='亥子丑'.indexOf(month)>=0,hot='巳午未'.indexOf(month)>=0,dry='申酉戌'.indexOf(month)>=0,damp='寅卯辰'.indexOf(month)>=0;
    var excess=cold?water:(hot?fire:(dry?metal:wood)),remedy=cold||damp?fire:water;
    if(excess.usable&&(excess.command||excess.dims[1]>1)&&!remedy.usable||climate.priority==='主用'){
      var affected=(cold||hot)&&STEM_WX[dayStem]===(cold?'火':'水')&&tasks.some(function(x){return x.state===-1&&x.ruleId==='LK-05'});
      var state=affected&&!remedy.usable&&excess.usable&&(excess.command||excess.dims[1]>1)?-1:null;
      task('climate','影响当前任用的寒暖燥湿',state,[],climate.condition+'；'+excess.facts.concat(remedy.facts).join('；')+(state===null?'；调节是否适量尚未确认':'；偏性有根令依据，未见有效调节'),'学习、表达或任务推进所需的配合条件受到气候偏性的牵制。','LK-05');
      tasks[tasks.length-1].source={title:'《子平真诠·用神配气候得失》',url:'https://chinesebooks.github.io/yijingshuji/zipingzhenquan/215740.html'};
      tasks[tasks.length-1].auxiliary=!affected;
      tasks[tasks.length-1].signature=JSON.stringify([excess.signature,remedy.signature,state]);
    }
    var killPaths=tasks.filter(function(x){return ['food-kill','kill-seal','blade-kill','hurt-kill'].indexOf(x.id)>=0});
    if(g.K.present&&killPaths.length){
      var working=killPaths.filter(function(x){return x.state===1}),state=working.length?1:(killPaths.some(function(x){return x.state===null})?null:(killPaths.some(function(x){return x.state===-1})?-1:0));
      task('handle-kill','食神制杀／印化杀等共同任用需求',state,['K','F','I','B','H'],working.length?'已确认'+working.map(function(x){return x.label}).join('、')+'可承接同一杀压；旧路径须按共同需求比较':killPaths.map(function(x){return x.label+'：'+x.reason}).join('；'),'处理任务压力的实际方式与支持条件发生变化。','LK-04',killPaths.reduce(function(out,x){return out.concat(x.counterEvidence)},[]));
      tasks[tasks.length-1].signature=JSON.stringify(killPaths.map(function(x){return x.signature}));
      var combined=[0];
      killPaths.forEach(function(path){combined=uniqueStates(combined.reduce(function(out,a){return out.concat(possibilities(path).map(function(b){return a===1||b===1?1:(a===-1||b===-1?-1:0)}))},[]))});
      tasks[tasks.length-1].possibleStates=combined;
      tasks[tasks.length-1].state=combined.length===1?combined[0]:null;
    }
    return {family:family,tasks:tasks,route:context.currentSpecialDetail?context.currentSpecialDetail.name:family};
  }
  function outlookDiseaseLife(family,better){
    var theme=/官杀.*承载/.test(family)?'工作职责、规则要求与承受能力之间的压力':(/承载/.test(family)?'任务与自身承受能力之间的压力':(/比劫分财/.test(family)?'竞争、合作及资源分配上的矛盾':(/财印/.test(family)?'资源投入与学习、支持条件之间的冲突':(/印/.test(family)?'学习及支持资源受到的牵制':(/食伤/.test(family)?'表达、产出及成果转化上的牵制':'相关事务中的矛盾')))));
    return theme+(better?'有所缓解。':'可能加重，需要更多精力协调。');
  }
  // Y1–Y8 are project arbitration policies; natal qualification and scores stay frozen.
  function settleTemporalOutlook(before,after,analysis,legacy){
    if(!analysis.useful)return legacy;
    var day=before.pillars.day[0],useful=analysis.useful||{},layers=[[],[],[],[],[],[]],checked=[],seen={};
    function actorKey(x){return [x.pillar,x.kind||'根',x.stem||x.text,x.god||''].join(':')}
    function element(ctx,wx){return outlookGod(ctx,godNamesForElement(day,wx))}
    function actors(ctx,wx){
      var g=element(ctx,wx);
      // Internal control without a bridge/other root does not become effective support.
      if(g.uncertain)return [];
      return g.stems.filter(function(x){return g.roots.length>0}).map(function(x){return Object.assign({kind:'干'},x)}).concat(g.roots.filter(function(x){return !outlookRootRestricted(x)}));
    }
    function facts(list){return list.map(function(x){return {key:actorKey(x),pillar:x.pillar,stem:x.stem||null,text:x.text||((x.branch||'')+'藏'+x.stem),kind:x.kind||'根'}})}
    function add(level,id,direction,subject,a,b,reason){
      var key=id+':'+direction+':'+JSON.stringify([a,b]);if(seen[key])return;seen[key]=true;
      var item={ruleId:id,taskId:subject,direction:direction,kind:'temporal-action',text:subject+'：'+reason,life:'',
        source:{title:'项目 Y1–Y8 岁运工程裁决政策',url:''},level:['Y2','Y3','Y4','Y5-primary','Y5-secondary-avoid','Y6'][level],actors:{before:a,after:b},before:a,after:b,
        adoptedReason:reason,excludedReason:'较低层不覆盖本层；同因作用只结算一次',conditions:[],counterEvidence:[]};
      layers[level].push(item);return item;
    }
    function difference(level,id,subject,a,b,sign){
      var ak=a.map(function(x){return x.key}),bk=b.map(function(x){return x.key}),lost=a.filter(function(x){return bk.indexOf(x.key)<0}),gained=b.filter(function(x){return ak.indexOf(x.key)<0});
      checked.push({subject:subject,before:a,after:b});
      if(gained.length&&lost.length){
        checked.push({subject:subject+'替代作用核验',before:a,after:b,reason:'同一任用需求仍有实际路径；替代演员不作为两个独立利弊，不按数量比较强弱'});
        return;
      }
      if(gained.length)add(level,id,sign>0?'positive':'negative',subject,a,b,'新增可用作用：'+gained.map(function(x){return x.text}).join('、'));
      if(lost.length)add(level,id,sign>0?'negative':'positive',subject,a,b,'原可用作用受限：'+lost.map(function(x){return x.text}).join('、'));
    }
    function flow(ctx,chains){
      var interactions=ctx.interactions,recipient=interactions.dayMaster;
      // 普通日主合入仍可受生；只在岁运受生末段沿用已有 receivingScope，不把合入擅判真化。
      if(recipient&&recipient.usable!==false&&recipient.effect==='daymaster-combine'&&chains.some(function(c){return c.to.indexOf('日主')>=0})){
        interactions=Object.assign({},interactions,{stemCombines:(interactions.stemCombines||[]).filter(function(c){return !(c.effect==='daymaster-combine'&&(c.leftKey==='day'||c.rightKey==='day')&&c.dayTransformQualification&&c.dayTransformQualification.eligible===false)})});
      }
      if(chains.length!==1)return interactionFlowAnalysis('',ctx.profiles,interactions,[],chains).steps;
      var chain=chains[0],steps=[];
      function entries(names){return names.reduce(function(out,name){
        var p=ctx.profiles[name]||(name==='日主'?{stemEntries:[ctx.interactions.dayMaster||{position:2,pillar:'day',stem:day,usable:true}]}:{});
        return out.concat((p.stemEntries||[]).map(function(x){return {god:name,stemEntries:[x],branchEntries:[]}}),(p.branchEntries||[]).map(function(x){return {god:name,stemEntries:[],branchEntries:[x]}}));
      },[])}
      // Enumerate concrete pairs through the existing reachability judge, so selecting
      // a new best actor never makes another still-active actor disappear.
      entries(chain.from).forEach(function(a){entries(chain.to).forEach(function(b){
        var profiles=Object.assign({},ctx.profiles);
        unique(chain.from.concat(chain.to)).forEach(function(name){profiles[name]={stemEntries:[],branchEntries:[]}});
        profiles[a.god]=a;profiles[b.god]=b;
        steps=steps.concat(interactionFlowAnalysis('',profiles,interactions,[],[{from:[a.god],to:[b.god],action:chain.action}]).steps);
      })});
      return steps;
    }
    function stepFacts(steps){return steps.filter(function(x){return x.active}).map(function(x){return {key:actorKey(x.left)+'>'+x.action+'>'+actorKey(x.right),text:x.text,left:x.left,right:x.right,active:true}})}
    function medicineFacts(item){return (item&&item.medicines||[]).filter(function(m){return m.rank>0}).reduce(function(out,m){return out.concat(stepFacts(m.steps||[]))},[]).filter(function(x,i,a){return a.findIndex(function(y){return x.key===y.key})===i})}
    var special=analysis.specialPatternQualification;
    if(special){
      var lt=legacy.review.beforeTasks.filter(function(t){return t.ruleId==='LK-10'}),rt=legacy.review.afterTasks.filter(function(t){return t.ruleId==='LK-10'});
      lt.forEach(function(a){var b=rt.find(function(t){return t.id===a.id});if(!b||a.state===null||b.state===null)return;
        if(a.state!==b.state)add(0,'Y2-special',b.state>a.state?'positive':'negative',b.label,a.conditions,b.conditions,b.reason);
      });
    }
    (analysis.patternDisease&&analysis.patternDisease.items||[]).forEach(function(anchor){
      function find(ctx){
        var found=(ctx.patternDisease.items||[]).find(function(x){return x.family===anchor.family&&(x.source||[]).some(function(s){return anchor.source.indexOf(s)>=0})});
        if(found)return found;
        // A renamed/absent diagnosis still rechecks the fixed natal medicines; it is never an automatic cure.
        var medicines=anchor.medicines.map(function(m){var steps=flow(ctx,m.steps||[]);return {name:m.name,steps:steps,rank:steps.some(function(x){return x.active})?1:0}});
        var rank=medicines.some(function(m){return m.rank>0})?1:0;
        return {family:anchor.family,source:anchor.source,status:rank?'部分化解':'未解',bestRank:rank,medicines:medicines,anchorRecheck:true};
      }
      var a=find(before),b=find(after),af=medicineFacts(a),bf=medicineFacts(b);
      function anchoredState(ctx,item){
        var steps=anchor.medicines.reduce(function(out,m){return out.concat(flow(ctx,m.steps||[]))},[]);
        var load=outlookGod(ctx,anchor.family==='官杀承载不足'?['正官','七杀']:['正财','偏财']);
        return {rank:item.bestRank,steps:steps.map(function(x){return {from:x.from,to:x.to,action:x.action,active:x.active}}),load:{usable:load.usable,uncertain:load.uncertain,actors:facts(load.stems),roots:facts(load.roots)}};
      }
      checked.push({subject:anchor.family+'药路与负荷逐项核验',before:anchoredState(before,a),after:anchoredState(after,b)});

      checked.push({subject:anchor.family,before:{status:a&&a.status,rank:a&&a.bestRank,steps:af},after:{status:b&&b.status,rank:b&&b.bestRank,steps:bf}});
      function medicineDemand(item){return {family:anchor.family,source:anchor.source,status:item.status,rank:item.bestRank,
        medicines:item.medicines.filter(function(m){return m.rank>0}).map(function(m){return {name:m.name,rank:m.rank,steps:(m.steps||[]).map(function(s){return {from:s.from,to:s.to,action:s.action,active:s.active}})}})}}
      if(a.bestRank>0&&b.bestRank>0&&af.length&&bf.length&&JSON.stringify(medicineDemand(a))===JSON.stringify(medicineDemand(b)))
        checked.push({subject:anchor.family+'同需求药路延续',before:medicineDemand(a),after:medicineDemand(b),physicalEvidence:{before:af,after:bf}});

      // Disappearance of a diagnostic is not proof of cure; demand actual chain changes.
      if(a&&b&&a.bestRank!==b.bestRank&&JSON.stringify(af)!==JSON.stringify(bf)){
        var medicineChange=add(1,'Y3-medicine',b.bestRank>a.bestRank?'positive':'negative',anchor.family,af,bf,'对应药路'+a.status+' → '+b.status+'；'+bf.map(function(x){return x.text}).join('；'));
        if(medicineChange)medicineChange.causalChange={family:anchor.family,source:anchor.source,beforeRank:a.bestRank,afterRank:b.bestRank,
          verifiedCompleteTransition:!a.anchorRecheck&&!b.anchorRecheck&&((a.bestRank===0&&b.bestRank===2)||(a.bestRank===2&&b.bestRank===0))};
      }else if(a&&b){
        var ar=af.map(function(x){return x.key}),br=bf.map(function(x){return x.key});
        // Replacing a path treating the same disease is not simultaneous gain and loss.
        if(!af.length&&bf.length)add(1,'Y3-medicine','positive',anchor.family,af,bf,'对应药路接通，'+b.status);
        else if(af.length&&!bf.length)add(1,'Y3-medicine','negative',anchor.family,af,bf,'原有效药路受阻，'+b.status);
        else if(JSON.stringify(ar)!==JSON.stringify(br))checked.push({subject:anchor.family+'替代药路',before:af,after:bf,reason:'同需求仍有药路，不凭演员替换判损益'});
      }
      if(/承载/.test(anchor.family)){
        var supportA=stepFacts(flow(before,[{from:['正印','偏印'],to:['日主'],action:'生'}])).concat(stepFacts(flow(before,[{from:['比肩','劫财'],to:['日主'],action:'扶'}])));
        var supportB=stepFacts(flow(after,[{from:['正印','偏印'],to:['日主'],action:'生'}])).concat(stepFacts(flow(after,[{from:['比肩','劫财'],to:['日主'],action:'扶'}])));
        // The day stem itself is not an extra supporter.
        supportA=supportA.filter(function(x){return x.left.pillar!=='day'||x.left.kind!=='干'});
        supportB=supportB.filter(function(x){return x.left.pillar!=='day'||x.left.kind!=='干'});
        if((analysis.elementPhenomena||[]).some(function(x){return x.name==='土厚埋金'})){
          // 印土既有化杀功能保留审计；新增同一印土的生身不抵销其壅身反作用。
          supportA=supportA.filter(function(x){return !/印/.test(x.left.god)});
          supportB=supportB.filter(function(x){return !/印/.test(x.left.god)});
        }
        if(!layers[1].some(function(x){return x.taskId===anchor.family}))difference(1,'Y3-carry-support',anchor.family+'实际扶身',supportA,supportB,1);
        var loadNames=anchor.family==='官杀承载不足'?['正官','七杀']:['正财','偏财'];
        var loadChain=anchor.family==='官杀承载不足'?[{from:loadNames,to:['日主'],action:'制'}]:[{from:['日主'],to:loadNames,action:'制'}];
        var loadA=stepFacts(flow(before,loadChain)),loadB=stepFacts(flow(after,loadChain));
        // Added load only harms when its corresponding carrying need remains unmet.
        if(!after.carryingCapacity.canCarryOutputKill&&JSON.stringify(supportA)===JSON.stringify(supportB))difference(1,'Y3-carry-load',anchor.family+'有效负荷',loadA,loadB,-1);
      }
    });
    (analysis.elementPhenomena||[]).filter(function(x){return x.name==='土厚埋金'}).forEach(function(anchor){
      ['金','水','土','火'].forEach(function(wx){
        var a=facts(actors(before,wx)),b=facts(actors(after,wx));
        // Water must actually receive metal; fire must actually feed earth.
        if(wx==='水'||wx==='火'){
          var from=wx==='水'?'金':'火',to=wx==='水'?'水':'土';
          function effective(ctx){return stepFacts(flow(ctx,[{from:godNamesForElement(day,from),to:godNamesForElement(day,to),action:'生'}]))}
          a=effective(before);b=effective(after);
        }
        difference(1,'Y3-earth-metal',anchor.name+'·'+wx,a,b,wx==='金'||wx==='水'?1:-1);
      });
    });
    // Verified natal main-chain participants are anchors, not a dictionary inferred from its name.
    (analysis.interactionFlow&&analysis.interactionFlow.steps||[]).filter(function(x){return x.active}).forEach(function(anchor){
      var a={active:flow(before,[anchor]).some(function(x){return x.active})},b={active:flow(after,[anchor]).some(function(x){return x.active})};
      checked.push({subject:'必要链 '+anchor.from+'→'+anchor.to,before:a,after:b});
      if(a.active!==b.active)add(1,'Y3-required-path',b.active?'positive':'negative',anchor.from.join('/')+anchor.action+anchor.to.join('/'),stepFacts(flow(before,[anchor])),stepFacts(flow(after,[anchor])),b.active?'原局必要链接通':'原局必要链受阻');
    });
    // 承泄与出口只按实际日主→食伤链；偏弱未新增承接时，泄身不作助力。
    var outputChain=[{from:['日主'],to:['食神','伤官'],action:'生'}];
    var supportChain=[{from:['正印','偏印'],to:['日主'],action:'生'}];
    var supportBefore=stepFacts(flow(before,supportChain)),supportAfter=stepFacts(flow(after,supportChain));
    if(/强/.test(analysis.strength||before.strength))difference(2,'Y4-output','实际食伤出口',stepFacts(flow(before,outputChain)),stepFacts(flow(after,outputChain)),1);
    else if(/弱/.test(analysis.strength||before.strength)&&JSON.stringify(supportBefore)===JSON.stringify(supportAfter))difference(2,'Y4-output-load','未增承接时的实际泄身',stepFacts(flow(before,outputChain)),stepFacts(flow(after,outputChain)),-1);
    if(before.carryingCapacity.canCarryOutputKill&&after.carryingCapacity.canCarryOutputKill){
      var outletA=stepFacts(flow(before,outputChain)),outletB=stepFacts(flow(after,outputChain));
      if(outletA.length&&outletB.length&&/强/.test(analysis.strength||before.strength))checked.push({subject:'承泄需求与有效出口延续',before:{canCarry:true,outletActive:true},after:{canCarry:true,outletActive:true},physicalEvidence:{before:outletA,after:outletB}});
    }
    // Existing determinate tasks remain the conventional structure layer, with real physical changes.
    legacy.evidence.filter(function(x){return x.direction==='positive'||x.direction==='negative'}).forEach(function(x){
      var a=legacy.review.beforeTasks.find(function(t){return t.id===x.taskId}),b=legacy.review.afterTasks.find(function(t){return t.id===x.taskId});
      if((a||b)&&(!a||!b||a.signature!==b.signature))layers[x.ruleId==='LK-10'?0:2].push(Object.assign({},x,{level:x.ruleId==='LK-10'?'Y2':'Y4',before:a||null,after:b||null,actors:{before:a?a.conditions:[],after:b?b.conditions:[]},adoptedReason:'既有已核验作用：'+x.text,excludedReason:'固定原局主病药或必要链优先；任务缺边仍保留已验真因果'}));
    });
    function usefulLayer(elements,level,sign){
      (elements||[]).forEach(function(wx){
        difference(level,'Y5-role-root',(sign>0?'喜用':'忌')+wx+'可用根透',facts(actors(before,wx)),facts(actors(after,wx)),sign);
        // Only concrete reachable one-step actions; no remote five-element-ring inference.
        ['木','火','土','金','水'].forEach(function(from){
          if(gen[from]!==wx&&ctrl[from]!==wx)return;
          var action=gen[from]===wx?'生':'制',chains=[{from:godNamesForElement(day,from),to:godNamesForElement(day,wx),action:action}];
          function active(ctx){
            var source=element(ctx,from),target=element(ctx,wx);
            if(!source.present||source.uncertain||!target.present||target.uncertain)return [];
            return stepFacts(flow(ctx,chains));
          }
          var a=active(before),b=active(after);
          // Control of an avoid actor requires a verified adverse role, not a generic counter-element.
          if(sign<0&&action==='制'&&!(useful.decision&&useful.decision.elements||[]).some(function(x){return x.element===wx&&(x.riskEntries||[]).some(function(r){return r.status==='effective'})}))return;
          difference(level,'Y5-role-action',from+action+(sign>0?'喜用':'忌')+wx,a,b,action==='生'?sign:-sign);
        });
      });
    }
    // 刃禄已确认偏强时，核验实际食伤出口，不要求先有官杀制刃。
    if(['刃','禄'].indexOf(before.regularPattern.authority.key)>=0&&/强/.test(analysis.strength||before.strength)&&!layers[2].some(function(x){return x.ruleId==='Y4-output'})){
      var outlet=[{from:['比肩','劫财'],to:['食神','伤官'],action:'生'}];
      difference(2,'Y4-blade-outlet','刃禄食伤出口',stepFacts(flow(before,outlet)),stepFacts(flow(after,outlet)),1);
    }
    // The natal priority fallback does not supply new evidence for a luck-period action.
    var promotedPrimary=useful.decision&&useful.decision.promotedPrimary||[];
    usefulLayer((useful.primaryUse||[]).filter(function(wx){return promotedPrimary.indexOf(wx)<0}),3,1);
    usefulLayer((useful.secondaryUse||[]).concat(promotedPrimary).filter(function(wx){
      var item=(useful.decision&&useful.decision.elements||[]).find(function(x){return x.element===wx});
      var ownSupport=wx===STEM_WX[day]&&element(after,wx).usable&&!element(after,wx).uncertain;
      return ownSupport||!item||!(item.requirements||[]).length||(useful.decision.routes||[]).some(function(r){return (r.elements||[]).indexOf(wx)>=0&&r.active&&r.steps&&r.steps.length&&interactionFlowAnalysis('',after.profiles,after.interactions,[],r.steps).steps.every(function(x){return x.active})});
    }),4,1);
    usefulLayer(useful.avoid,4,-1);
    legacy.review.beforeTasks.forEach(function(a){
      var b=legacy.review.afterTasks.find(function(t){return t.id===a.id});
      if(b&&a.state!==null&&a.state!==0&&a.state===b.state&&a.signature===b.signature)
        checked.push({subject:a.label,before:a.conditions,after:b.conditions});
    });
    var climate=useful.layers&&useful.layers.tiaohou;
    if(climate&&climate.priority==='主用'&&climate.qualification&&climate.qualification.ratioCandidate){
      (climate.use||[]).forEach(function(wx){difference(5,'Y6-natal-climate','原局'+climate.condition+'·'+wx,facts(actors(before,wx)),facts(actors(after,wx)),1)});
      (climate.avoid||[]).forEach(function(wx){difference(5,'Y6-natal-climate','原局偏性增援·'+wx,facts(actors(before,wx)),facts(actors(after,wx)),-1)});
    }
    var first=layers.findIndex(function(x){return x.length}),selected=first>=0?layers[first]:[],positive=selected.some(function(x){return x.direction==='positive'}),negative=selected.some(function(x){return x.direction==='negative'});
    var direction=positive&&negative?'mixed':(positive?'positive':(negative?'negative':null));
    if(!direction){
      // Continuity needs nonempty checked actors and states; empty evidence never becomes neutral.
      var stable=checked.filter(function(x){return JSON.stringify(x.before)===JSON.stringify(x.after)&&JSON.stringify(x.before)!=='[]'&&x.before!=null});
      var knownStable=stable.filter(function(x){return Array.isArray(x.before)?x.before.length:!!(x.before.steps&&x.before.steps.length||x.before.medicines&&x.before.medicines.length||x.before.active||x.before.canCarry&&x.before.outletActive)});
      if(knownStable.length&&!special&&!(analysis.monthCommand&&analysis.monthCommand.ambiguous)){
        direction='neutral';selected=[{ruleId:'Y7-continuity',source:{title:'项目 Y7 逐项延续核验',url:''},level:'Y7',taskId:'verified-continuity',direction:'neutral',kind:'stable',text:'已核验主线延续：'+knownStable.map(function(x){return x.subject}).join('、'),before:knownStable.map(function(x){return x.before}),after:knownStable.map(function(x){return x.after}),actors:{before:knownStable.map(function(x){return x.physicalEvidence?x.physicalEvidence.before:x.before}),after:knownStable.map(function(x){return x.physicalEvidence?x.physicalEvidence.after:x.after})},conditions:[],counterEvidence:[],life:'',adoptedReason:'同一角色的实际作用与可用状态逐项延续'}];
      }
    }
    var review=Object.assign({},legacy.review,{policyVersion:LUCK_OUTLOOK_VERSION,checkedLayers:['Y2','Y3','Y4','Y5-primary','Y5-secondary-avoid','Y6'],checked:checked,layerEvidence:layers,legacyDirection:legacy.direction,legacyTendency:legacy.tendency,legacyAssessment:legacy.assessment});
    // Y7.4: new coverage rules do not revoke a completed causal verdict by default.
    if(legacy.assessment==='determined'){
      var priority=function(e){return e.ruleId==='LK-10'?0:(e.ruleId==='LK-03'||e.ruleId==='LK-05'?1:2)};
      var oldPriority=Math.min.apply(null,legacy.evidence.filter(function(e){return e.direction!=='neutral'}).map(priority).concat([2]));
      review.protectedDetermined={direction:legacy.direction,candidateDirection:direction,candidatePriority:first,oldPriority:oldPriority,
        decision:'preserved',candidateEvidence:selected,oldEvidence:legacy.evidence,
        reason:'旧判 '+legacy.direction+'：'+legacy.evidence.map(function(e){return e.ruleId+' '+e.text}).join('；')+'。候选第'+first+'层：'+selected.map(function(e){return e.ruleId+' '+e.text}).join('；')+'。'+(first>=oldPriority?'候选不高于旧判第'+oldPriority+'层，不取代原净作用裁决。':'候选未证明同源病药在全失效与整链有效之间切换，不取代原净作用裁决。')};
      var certificate=first===1&&oldPriority>1&&selected.length&&selected.every(function(e){return e.ruleId==='Y3-medicine'&&e.causalChange&&e.causalChange.verifiedCompleteTransition});
      if(certificate&&direction!==legacy.direction){
        review.protectedDetermined.decision='higher-priority-override';
        review.protectedDetermined.certificate=selected.map(function(e){return {ruleId:e.ruleId,change:e.causalChange,beforeActors:e.before,afterActors:e.after,
          reason:'旧判仅结算常规格局任务：'+legacy.evidence.map(function(x){return x.text}).join('；')+'；遗漏固定原病 '+e.causalChange.family+' 的对应整链由 rank '+e.causalChange.beforeRank+' 转 '+e.causalChange.afterRank+'：'+e.text+'。Y3 先于旧 Y4。'}});
      }else{
      var oldEvidence=legacy.evidence.map(function(e){
        var a=legacy.review.beforeTasks.find(function(t){return t.id===e.taskId}),b=legacy.review.afterTasks.find(function(t){return t.id===e.taskId});
        return Object.assign({},e,{level:['Y2','Y3','Y4'][priority(e)],before:a||legacy.review.beforeTasks,after:b||legacy.review.afterTasks,
          actors:{before:a?a.conditions:legacy.review.beforeTasks.map(function(t){return t.conditions}),after:b?b.conditions:legacy.review.afterTasks.map(function(t){return t.conditions})},
          adoptedReason:'Y7.4 保留已确定的'+e.text});
      });
      return Object.assign({},legacy,{evidence:oldEvidence,review:review});
      }
    }
    if(!direction){
      var transforms=(after.interactions.stemCombines||[]).filter(function(x){return x.active!==false&&x.effect==='transform'});
      var replacement=checked.find(function(x){return /替代作用核验/.test(x.subject)&&Array.isArray(x.before)&&x.before.length&&Array.isArray(x.after)&&x.after.length});
      if(replacement)review.residualDetails={subject:replacement.subject,beforeActors:replacement.before,afterActors:replacement.after,
        obstruction:(after.interactions.stemCombines||[]).filter(function(x){return x.active!==false&&x.effect!=='transform'}).map(function(x){return {effect:x.effect,left:x.leftKey,right:x.rightKey,text:x.text}}),
        carryingBefore:before.carryingCapacity.canCarryOutputKill,carryingAfter:after.carryingCapacity.canCarryOutputKill};
      return Object.assign({},legacy,{assessment:'unsupported',direction:'pending',tendency:null,possibleDirections:[],
        residualCode:replacement?'Y8-REPLACEMENT-MEDICINE-STRENGTH':transforms.length?'Y8-TRANSFORM-CARRY-ACTOR':'Y8-ACTOR-PATH-GAP',
        missingFields:replacement?['同一承载需求下印生身与比劫扶身替代药路的药力对照']:transforms.length?['已变气日主的承载主体映射','变气后替代药路的可达作用者']:['可核验的必要角色或有效作用链'],
        checkedLayers:review.checkedLayers,knownFacts:[before.rawMainPattern,before.strength].concat(transforms.map(function(x){return x.text})).concat(replacement?replacement.before.map(function(x){return '原有效作用：'+x.text}).concat(replacement.after.map(function(x){return '现有效作用：'+x.text})):[]),review:review});
    }
    return Object.assign({},legacy,{direction:direction,tendency:null,assessment:'determined',possibleDirections:[direction],summary:'',evidence:selected,
      reservations:layers.slice(first+1).reduce(function(out,x){return out.concat(x)},[]).concat(legacy.reservations),life:[],basis:'固定原局角色；实际作用与病药优先裁决',review:review});
  }
  function compareOutlookContexts(before,after,analysis){
    var left=outlookCore(before,analysis),right=outlookCore(after,analysis),evidence=[],reservations=[],uncertainty=[],risks=[];
    var states={1:'有效',0:'未采用或尚待补足','-1':'存在未解破坏'},ids=unique(left.tasks.concat(right.tasks).map(function(x){return x.id}));
    function evidenceItem(task,direction,text,beforeTask){
      return {direction:direction,kind:task.ruleId==='LK-05'?'capacity':(task.ruleId==='LK-03'?'disease':'structure'),text:text,
        life:direction==='positive'?task.life.replace('发生变化。','得到改善。'):(direction==='negative'?task.life.replace('发生变化。','受到更多牵制。'):task.life),ruleId:task.ruleId,source:task.source,
        conditions:beforeTask?beforeTask.conditions.map(function(x){return '变化前：'+x}).concat(task.conditions.map(function(x){return '变化后：'+x})):task.conditions,
        counterEvidence:beforeTask?beforeTask.counterEvidence.map(function(x){return '变化前：'+x}).concat(task.counterEvidence.map(function(x){return '变化后：'+x})):task.counterEvidence,
        taskId:task.id};
    }
    function addRisk(a,b){
      var task=b||a;
      risks.push({task:task,before:a,after:b,message:task.label+'：轻重、任用或救应尚未确认；变化前：'+(a?a.reason:'未见对应实际作用')+'；变化后：'+(b?b.reason:'未见对应实际作用')});
    }
    ids.forEach(function(id){
      if(['food-kill','kill-seal','blade-kill','hurt-kill'].indexOf(id)>=0&&left.tasks.some(function(x){return x.id==='handle-kill'})&&right.tasks.some(function(x){return x.id==='handle-kill'}))return;
      var a=left.tasks.find(function(x){return x.id===id}),b=right.tasks.find(function(x){return x.id===id}),task=b||a;
      // Missing tasks are not vanished diseases. Only an explicit causal recheck may make them neutral.
      if(!a||!b){
        var existing=a||b;
        if(existing.state===0)return;
        if(existing.auxiliary){reservations.push(evidenceItem(existing,'neutral',existing.label+'：偏性只是校正线索，尚未证实改变当前主要任用；'+existing.reason));return}
        if(id==='climate'&&existing.state===-1){
          var other=a?after:before,month=other.pillars.month[1],dayStem=other.pillars.day[0];
          var warm=outlookGod(other,godNamesForElement(dayStem,'亥子丑寅卯辰'.indexOf(month)>=0?'火':'水'));
          if(warm.usable){
            uncertainty.push(task.label+'：调节对象出现，但适量与主要任用是否恢复仍需确认');
            reservations.push(evidenceItem(task,'neutral',task.label+'：不能仅凭补入调节五行宣布偏性已解'));
            return;
          }
        }
        if(!analysis.specialPatternQualification&&left.route===right.route){
          if(existing.state===null)addRisk(a,b);
          else {
            var direction=a?(existing.state>0?'negative':'positive'):(existing.state>0?'positive':'negative');
            evidence.push(evidenceItem(task,direction,task.label+'：'+(a?'原作用条件不再适用，已核对对应对象':'新增实际作用')+'；'+task.reason));
          }
        }else {uncertainty.push(task.label+'：路径转移或新增作用尚未建立可靠共同参照；'+existing.reason);reservations.push(evidenceItem(existing,'neutral',task.label+'：'+existing.reason))}
        return;
      }
      if(a.auxiliary&&b.auxiliary){reservations.push(evidenceItem(task,'neutral',task.label+'：未证实影响主要任用，作为辅助条件保留；'+task.reason));return}
      if(a.state===null||b.state===null){
        if(a.signature===b.signature)reservations.push(evidenceItem(task,'neutral',task.label+'：未定条件在两侧相同，不据此制造升降；'+task.reason));
        else addRisk(a,b);
        return;
      }
      if(a.applicable===false||b.applicable===false){
        if(a.applicable!==b.applicable)reservations.push(evidenceItem(task,'neutral',task.label+'：阶段用途改变，停止采用不等于所用因素遭破坏；方向另看实际任用与出口',a));
        return;
      }
      if(a.state===b.state)return;
      if((b.state<a.state?b:a).conditions.some(function(x){return /已变气|失用，合化改性/.test(x)})){
        uncertainty.push(task.label+'：所用因素合化改性，旧路径受限；变气后的替代任用尚未建立共同参照');
        reservations.push(evidenceItem(task,'neutral',task.label+'：不能仅据旧路径失用判整运下降',a));
        return;
      }
      // Numerical carrying switches alone cannot provide a direction.
      if(task.ruleId==='LK-05'&&id.indexOf('carry-')===0){
        var loadNames={'carry-wealth':['正财','偏财'],'carry-output':['食神','伤官'],'carry-officer':['正官'],'carry-kill':['七杀']}[id]||[];
        var physical=function(ctx){return JSON.stringify((ctx.strengthScore.dimensions.roots.items||[]).map(function(x){return [x.pillar||x.position,x.branch,x.usable,outlookRootRestricted(x),x.changedByGroup,x.changedByInteraction,x.boundByCombine,x.transformedAway]}).concat([outlookGod(ctx,['正印','偏印']).signature,outlookGod(ctx,['比肩','劫财']).signature,outlookGod(ctx,loadNames).signature]))};
        if(physical(before)===physical(after)){uncertainty.push(task.label+'：仅旺衰数值或阈值发生变化，不独立裁决方向');return}
      }
      var better=b.state>a.state;
      evidence.push(evidenceItem(task,better?'positive':'negative',task.label+'：'+states[a.state]+' → '+states[b.state]+'；变化前：'+a.reason+'；变化后：'+b.reason,a));
    });
    if(analysis.monthCommand&&analysis.monthCommand.ambiguous)uncertainty.push('原局月令取用未定，无法可靠归纳整体方向');
    var positive=evidence.some(function(x){return x.direction==='positive'}),negative=evidence.some(function(x){return x.direction==='negative'});
    var possibleDirections=[positive&&negative?'mixed':(positive?'positive':(negative?'negative':'neutral'))];
    risks.forEach(function(risk){
      // A disease can be active or resolved; its absence is not an independent benefit.
      var choices=function(task){return !task?[0]:(task.state===null?task.possibleStates:[task.state])};
      var outcomes=[],a=choices(risk.before),b=choices(risk.after);
      a.forEach(function(x){b.forEach(function(y){var p=positive||y>x,n=negative||y<x;outcomes.push(p&&n?'mixed':(p?'positive':(n?'negative':'neutral')))} )});
      possibleDirections=unique(possibleDirections.reduce(function(out,known){
        a.forEach(function(x){b.forEach(function(y){
          var p=known==='positive'||known==='mixed'||y>x,n=known==='negative'||known==='mixed'||y<x;
          out.push(p&&n?'mixed':(p?'positive':(n?'negative':'neutral')));
        })});return out;
      },[]));
      var stable=unique(outcomes).length===1,item=evidenceItem(risk.task,'neutral',risk.message+(stable?'；各可行解释不改变已确认方向':''),risk.after?risk.before:null);
      if(!risk.before||!risk.after){
        var prefix=risk.before?'变化前：':'变化后：';
        item.conditions=item.conditions.map(function(x){return prefix+x}).concat((risk.before?'变化后：':'变化前：')+'未见对应实际作用');
        item.counterEvidence=item.counterEvidence.map(function(x){return prefix+x});
      }
      reservations.push(item);
      if(!stable)uncertainty.push(risk.message);
    });
    var known=left.tasks.concat(right.tasks).some(function(x){return x.state!==null&&x.state!==0});
    var examined=left.tasks.concat(right.tasks).some(function(x){return x.examined||x.state!==null&&x.state!==0});
    // An adopted path may remain incomplete on both sides without being unexamined or empty evidence.
    if(!known&&!analysis.specialPatternQualification&&left.route===right.route)known=left.tasks.some(function(a){return a.assessed&&right.tasks.some(function(b){return b.id===a.id&&b.assessed&&a.signature===b.signature})});
    if(!known&&!evidence.length&&(!examined||!risks.length))uncertainty.push(examined?'主要任用条件已核对，但尚未确认整体作用':'尚未确认主要任用路径，不能把空证据当作持平');
    var direction=uncertainty.length?'pending':(positive&&negative?'mixed':(positive?'positive':(negative?'negative':'neutral')));
    if(direction==='neutral'){
      var checkedTasks=right.tasks.filter(function(x){return x.state!==null}),checked=checkedTasks.map(function(x){return x.label+'（'+states[x.state]+'）'});
      evidence.push({direction:'neutral',kind:'stable',text:'同一口径核对后主要条件延续：'+checked.join('、'),life:'阶段发挥条件大体延续，原有优势和限制仍需关注。',ruleId:'LK-13',source:checkedTasks.length?checkedTasks[0].source:{title:'项目四项比较定义',url:''},conditions:unique(checked.concat(checkedTasks.reduce(function(out,x){return out.concat(x.conditions)},[]))),counterEvidence:unique(checkedTasks.reduce(function(out,x){return out.concat(x.counterEvidence)},[]))});
    }
    if(direction==='mixed')reservations.push({direction:'neutral',kind:'mixed',text:'救应结算后独立关键利弊仍并存，不用总分抵消',ruleId:'LK-11',life:''});
    if(left.route!==right.route)reservations.push({direction:'neutral',kind:'structure',text:'阶段实际路线由'+left.route+'转为'+right.route+'；原局身份保持，不按格名排高低',life:'',ruleId:'LK-04'});
    // A provisional reading uses confirmed evidence only; uncertainty keeps the final verdict pending.
    var tendency=direction==='pending'&&risks.length&&uncertainty.every(function(x){return risks.some(function(r){return r.message===x})})?(positive&&negative?'mixed':(positive?'positive':(negative?'negative':null))):null;
    var hardGap=!!analysis.specialPatternQualification||uncertainty.some(function(x){return /共同参照|月令取用未定|仅旺衰数值/.test(x)});
    var assessment=direction!=='pending'?'determined':(examined&&!hardGap?'conditional':'unsupported');
    var focus=risks.length?risks[0].task.id:'';
    var subject=/^carry-/.test(focus)?'自身基础与可用支持能否承接当前压力':(/kill/.test(focus)?'任务压力能否得到有效承接':(/wealth|sharing/.test(focus)?'资源转化、分配与自身支持能否配合':(/seal/.test(focus)?'学习与支持资源能否有效发挥作用':(/output|food|hurt/.test(focus)?'表达产出能否得到有效承接':'主要助力能否形成实际作用'))));
    var summary=assessment==='conditional'?(positive&&negative?'已有独立助益与牵制，整体表现还取决于':(positive?'已有改善依据，整体表现还取决于':(negative?'已有受阻依据，整体表现还取决于':'整体表现取决于')))+subject+'。':(assessment==='unsupported'?'当前规则尚不足以归纳这个组合的整体方向。':'');
    return settleTemporalOutlook(before,after,analysis,{direction:direction,tendency:tendency,assessment:assessment,summary:summary,possibleDirections:assessment==='unsupported'?[]:possibleDirections,evidence:evidence,reservations:reservations,uncertainty:unique(uncertainty),life:unique(evidence.map(function(x){return x.life}).filter(Boolean)),basis:'实际任用路径、反证与救应结算',review:{beforeRoute:left.route,afterRoute:right.route,beforeTasks:left.tasks,afterTasks:right.tasks}});
  }
  function labelOutlook(result,kind){
    var labels={natal:{positive:'助益',neutral:'持平',negative:'受阻',mixed:'利弊并存',pending:'待判'},previous:{positive:'上升',neutral:'持平',negative:'下降',mixed:'利弊并存',pending:'待判'},annual:{positive:'偏吉',neutral:'平',negative:'偏凶',mixed:'吉凶并见',pending:'待判'},increment:{positive:'改善',neutral:'维持',negative:'拖累',mixed:'利弊并存',pending:'待判'}};
    var label=labels[kind][result.direction];
    if(result.direction==='pending'){
      if(result.assessment==='input-error')label='资料需核对';
      else if(result.assessment==='unsupported')label='暂缺整体结论';
      else if(result.assessment==='conditional'){
        label='分条件看';
        if(result.tendency==='positive')label=kind==='annual'?'已有有利因素':'已有改善因素';
        else if(result.tendency==='negative')label=kind==='annual'?'已有不利因素':'已有受阻因素';
        else if(result.tendency==='mixed')label=kind==='annual'?'已有吉凶并见':'已有利弊';
        else if(result.possibleDirections.length===2&&result.possibleDirections.indexOf('neutral')>=0){
          var possible={natal:{positive:'可能助益',negative:'可能受阻'},previous:{positive:'可能上升',negative:'可能下降'},annual:{positive:'可能偏吉',negative:'可能偏凶'},increment:{positive:'可能改善',negative:'可能拖累'}};
          var oneWay=result.possibleDirections.find(function(x){return x==='positive'||x==='negative'});
          if(oneWay)label=possible[kind][oneWay];
        }
      }
    }
    return Object.assign({},result,{label:label});
  }
  function evaluateLuckOutlook(bazi,luckGz,previousGz,flowYears){
    var valid=function(gz){return getGZ60().indexOf(gz)>=0},years=flowYears||[],out={ruleVersion:LUCK_OUTLOOK_VERSION,luckGz:luckGz,previousGz:previousGz||null,years:[]};
    var complete=bazi&&bazi.pillars&&NATAL_PILLAR_KEYS.every(function(key){return valid(bazi.pillars[key])})&&bazi.dayStem===bazi.pillars.day[0]&&valid(luckGz);
    var pending=outlookPending('四柱、日主或所选大运资料不完整');
    if(!complete){
      out.natal=labelOutlook(pending,'natal');out.previous=previousGz?labelOutlook(pending,'previous'):{label:'无上一柱可比较',direction:'unavailable',evidence:[],reservations:[],uncertainty:[],life:[]};
      out.years=years.map(function(year){return {year:year.year,gz:year.gz,annual:labelOutlook(pending,'annual'),increment:labelOutlook(pending,'increment')}});return out;
    }
    // Always rederive from the four natal pillars: saved or previous temporal results are not inputs.
    var natalPillars={year:bazi.pillars.year,month:bazi.pillars.month,day:bazi.pillars.day,hour:bazi.pillars.hour};
    var analysis=analyzePattern(Object.assign({},bazi,{pillars:natalPillars,scores:scoreWuxing(natalPillars)}));
    var base=buildTemporalPatternContext(bazi.dayStem,natalPillars,analysis),luckPillars=Object.assign({},natalPillars,{luck:luckGz}),luck=buildTemporalPatternContext(bazi.dayStem,luckPillars,analysis);
    out.natal=labelOutlook(compareOutlookContexts(base,luck,analysis),'natal');
    if(previousGz){
      out.previous=valid(previousGz)?labelOutlook(compareOutlookContexts(buildTemporalPatternContext(bazi.dayStem,Object.assign({},natalPillars,{luck:previousGz}),analysis),luck,analysis),'previous'):labelOutlook(outlookPending('上一柱大运干支无效'),'previous');
    }else out.previous={label:'无上一柱可比较',direction:'unavailable',evidence:[],reservations:[],uncertainty:[],life:[]};
    out.years=years.map(function(year){
      if(!Number.isInteger(year.year)||!valid(year.gz)||year.gz!==getFlowYearGZ(year.year))return {year:year.year,gz:year.gz,annual:labelOutlook(outlookPending('流年年份与干支不一致'),'annual'),increment:labelOutlook(outlookPending('流年年份与干支不一致'),'increment')};
      var current=buildTemporalPatternContext(bazi.dayStem,Object.assign({},luckPillars,{flowYear:year.gz}),analysis,{outlookFlowYear:true});
      return {year:year.year,gz:year.gz,annual:labelOutlook(compareOutlookContexts(base,current,analysis),'annual'),increment:labelOutlook(compareOutlookContexts(luck,current,analysis),'increment')};
    });
    return out;
  }
  function usefulPriority(mainPattern,strength,monthBranch,specials){
    if((specials||[]).some(function(x){return /^从格：|^化气格：|^专旺格：/.test(x)})){
      return {type:'顺势',text:'特殊格局成立时，先顺格局之势取用，再校验真假与行运承接。'};
    }
    if(/官杀混杂|伤官见官|财多身弱|食伤混杂/.test(mainPattern)){
      return {type:'病药',text:'格局病药为先，先处理破格点，再谈扶抑和调候。'};
    }
    if(/杀印相生|食神制杀|伤官配印|官印相生|财官印相生|食神生财|伤官生财|羊刃驾杀/.test(mainPattern)){
      return {type:'格局',text:'格局闭环为先，先守成格主线，再看调候和扶抑是否配合。'};
    }
    if(/弱|强/.test(strength)){
      return {type:'扶抑',text:'旺衰偏枯时，扶抑为先，再看格局是否承接。'};
    }
    if('亥子丑巳午未'.indexOf(monthBranch)>=0){
      return {type:'调候',text:'日主不偏枯而寒暖燥湿明显时，以调候校正格局取用。'};
    }
    return {type:'流通',text:'日主中和时，重在格局流通、清浊去留与成事路径。'};
  }
  function classicalPatternPotential(analysis){
    var main=(analysis.patternStructures||[]).find(function(item){return item.role==='主格'}),regular=analysis.regularPattern||{};
    var status=(main&&main.status)||regular.status||'待成',ruleId=(main&&main.ruleId)||(regular.authority&&regular.authority.ruleId)||'ZP-MG-00';
    var pattern=(main&&main.name)||regular.name||'未见明确主格',entry=CLASSICAL_PATTERN_POTENTIAL_RULES[ruleId],special=analysis.specialPatternQualification;
    var directBreak=!!(main&&(main.conflicts||[]).some(function(item){return /^ZP-BR-/.test(item.ruleId||'')}));
    if(special&&special.ruleId===ruleId){
      entry={tier:special.tier||'S',score:special.potentialScore||100,sourceSystem:special.sourceSystem,source:(special.source||[]).slice()};
    }
    if(entry&&status!=='已破'&&status!=='待成'&&!directBreak){
      return {score:entry.score,tier:entry.tier,ruleId:ruleId,pattern:pattern,sourceSystem:entry.sourceSystem,source:(entry.source||[]).slice(),evidence:pattern+status+'，已由 '+ruleId+' 的成立条件验真；本维只表达古籍结构上限，不重复计算流通、清浊、病药或气势病象'};
    }
    var regularRuleId=regular.authority&&regular.authority.ruleId||(/^ZP-MG-/.test(ruleId)?ruleId:'ZP-MG-00');
    if(/^ZP-MG-/.test(regularRuleId)){
      var regularStatus=regular.status||status,regularPattern=regular.name||pattern;
      var monthPatternEstablished=!/命格待判|未见明确/.test(regularPattern)&&(regular.checks||[]).some(function(item){return item.type==='立格'&&item.active});
      var regularScore=monthPatternEstablished?70:0;
      return {score:regularScore,tier:regularScore===70?'B':'未成立',ruleId:regularRuleId,pattern:regularPattern,sourceSystem:'主流子平月令格局',source:[regular.authority&&regular.authority.source||'《子平真诠》月令立格与成败救应主线'],evidence:(entry?pattern+'未通过严格成立条件，退回':'')+(monthPatternEstablished?(regularPattern+'已由月令立格；本维只表达常格理论上限，当前'+regularStatus+'另由成格与病药维度结算'):(regularPattern+'未通过月令立格，不取得常格潜力'))};
    }
    return {score:0,tier:'未成立',ruleId:ruleId,pattern:pattern,sourceSystem:'主流子平月令格局',source:[],evidence:'未见通过稳定规则验真的主格，不因显示名称取得古籍潜力'};
  }
  function patternStructureRawScore(analysis,options){
    options=options||{};
    var main=(analysis.patternStructures||[]).find(function(item){return item.role==='主格'}),regular=analysis.regularPattern||{},status=(main&&main.status)||regular.status||'待成';
    var dimensionKeys=['potential','formation','flow','clarity','remedy','balance'];
    function cloneWeights(input){
      var output={},total=0;
      dimensionKeys.forEach(function(key){
        var value=Number(input&&input[key]);
        if(!isFinite(value)||value<0)throw new Error('评分权重无效：'+key);
        output[key]=value;
        total+=value;
      });
      if(Math.abs(total-100)>1e-9)throw new Error('评分权重合计必须为100，当前为'+total);
      return output;
    }
    var weights=cloneWeights(options.weights||PATTERN_SCORE_DIMENSION_WEIGHTS),deduplicateCauses=!!options.deduplicateCauses;
    function clamp(value){return Math.max(0,Math.min(100,Math.round(value)))}
    function component(name,score,evidence,share,causeId,numericOwner,ruleId,extra){
      return Object.assign({name:name,score:clamp(score),evidence:evidence||'',share:share==null?100:share,causeId:causeId,numericOwner:numericOwner,ruleId:ruleId,causeGroup:causeId},extra||{});
    }
    function dimension(key,name,score,evidence,components){
      var weight=weights[key],value=clamp(score),output={key:key,name:name,weight:weight,score:value,contribution:Math.round(value*weight)/100,evidence:evidence,components:components||[]};
      var owners=output.components.filter(function(entry){return entry.numericOwner===key&&entry.share>0}),allocated=0;
      owners.forEach(function(entry,index){
        entry.counted=true;
        entry.effectiveContribution=index===owners.length-1?Math.round((output.contribution-allocated)*1000000)/1000000:Math.round(output.contribution*entry.share/100*1000000)/1000000;
        allocated+=entry.effectiveContribution;
      });
      output.components.forEach(function(entry){
        if(!entry.counted){entry.counted=false;entry.effectiveContribution=0}
      });
      return output;
    }

    var potential=classicalPatternPotential(analysis),mainRuleId=potential.ruleId||(main&&main.ruleId)||(regular.authority&&regular.authority.ruleId)||'ZP-MG-00';
    var intrinsicMain=analysis.patternArbitration&&analysis.patternArbitration.main;
    var scoringStatus=deduplicateCauses&&main&&intrinsicMain&&intrinsicMain.ruleId===main.ruleId?intrinsicMain.status:status;
    var statusScore=scoringStatus==='已成'?85:(scoringStatus==='成而有瑕'?65:(scoringStatus==='已破'?25:45));
    var statusEvidence=(main&&main.name)||regular.name||'未见明确主格';
    var checks=regular.checks||[],qualificationChecks=main&&main.qualification&&main.qualification.checks||[];
    var specialQualification=deduplicateCauses&&analysis.specialPatternQualification&&main&&main.ruleId===analysis.specialPatternQualification.ruleId?analysis.specialPatternQualification:null;
    var specialOwnedChecks={formation:[],flow:[],clarity:[]};
    function specialCheckOwner(item){
      var id=item&&item.id||'';
      if(id==='weak-support'||/^no-/.test(id))return 'clarity';
      if(id==='child-has-child'||id==='outlet')return 'flow';
      return 'formation';
    }
    if(specialQualification)(specialQualification.checks||[]).forEach(function(item){specialOwnedChecks[specialCheckOwner(item)].push(item)});
    var required=specialQualification?specialOwnedChecks.formation.map(function(item){return {active:item.met,label:item.label,ruleId:item.ruleId,id:item.id,evidence:item.evidence}}):(qualificationChecks.length?qualificationChecks.map(function(item){return {active:item.met,label:item.label,ruleId:item.ruleId,id:item.id,evidence:item.evidence}}):checks.filter(function(item){return item.type==='立格'||item.type==='成格'})),met=required.filter(function(item){return item.active}).length;
    var useCompletion=qualificationChecks.length||(!main||main.name===regular.name),completionScore=required.length?Math.round(met/required.length*100):50;
    var statusShare=scoringStatus==='已破'?0.5:0.65;
    var formationScore=useCompletion?(statusScore*statusShare+completionScore*(1-statusShare)):statusScore;

    var steps=analysis.interactionFlow&&analysis.interactionFlow.steps||[],active=steps.filter(function(item){return item.active}).length;
    var flowScore=steps.length?30+60*active/steps.length:50,flowEvidence=steps.length?(active+'/'+steps.length+'环节可达'):'未设置独立作用链，按中性值进入排序';
    if(specialQualification){
      active=specialOwnedChecks.flow.filter(function(item){return item.met}).length;
      flowScore=specialOwnedChecks.flow.length?30+60*active/specialOwnedChecks.flow.length:50;
      flowEvidence=specialOwnedChecks.flow.length?(active+'/'+specialOwnedChecks.flow.length+'项独立顺势环节可达'):'特殊格资格检查中未见独立顺势环节，本维按中性值处理';
    }

    var disease=analysis.patternDisease||{items:[],solved:[],partial:[],unresolved:[]},solved=(disease.solved||[]).length,partial=(disease.partial||[]).length,unresolved=(disease.unresolved||[]).length;
    var clarity=analysis.structuralClarity&&analysis.structuralClarity.level||analysis.clarity&&analysis.clarity.level||'待辨';
    var clarityObject=analysis.structuralClarity||analysis.clarity||{},clarityClaimedByDisease=!!((disease.items||[]).length&&clarityObject.numericOwner==='disease'&&/^(冲战|不清|偏浊|浊)$/.test(clarity));
    var strictDerivedClarity=deduplicateCauses&&!specialQualification&&/^(injury-seal-purity|food-killing-purity)$/.test(clarityObject.causeGroup||'')&&clarity==='较清';
    var clarityScore=clarityClaimedByDisease?50:{清:90,较清:80,可清:65,有瑕:50,冲战:30,不清:25,偏浊:25,浊:10,待清:40,待辨:45}[clarity];
    if(specialQualification){
      var clearMet=specialOwnedChecks.clarity.filter(function(item){return item.met}).length;
      clarityScore=specialOwnedChecks.clarity.length?30+60*clearMet/specialOwnedChecks.clarity.length:50;
    }else if(strictDerivedClarity)clarityScore=65;
    if(clarityScore==null)clarityScore=45;
    var clarityEvidence=clarity+(clarityClaimedByDisease?'；负面原因已由病药维度结算，本维按中性值处理':(specialQualification?'；只结算独立反从、反化与逆局检查，成立资格和顺势环节由各自维度结算':(strictDerivedClarity?'；较清增益来自成格、作用链与残病结果，审计中退回独立可清锚点':'')));

    var diseaseCount=(disease.items||[]).length,maxResidual=diseaseCount*2,residualSeverity=unresolved*2+partial;
    var remedyScore=diseaseCount?Math.round(80-55*residualSeverity/maxResidual):80,remedyEvidence=diseaseCount?('已解'+solved+'、部分'+partial+'、未解'+unresolved+'；残病强度'+residualSeverity+'/'+maxResidual):'未见需要结算的主要病点';

    var phenomena=analysis.elementPhenomena||[],positive=analysis.positivePhenomena||[];
    var severityRank=phenomena.reduce(function(max,item){return Math.max(max,{轻度:1,明显:2,严重:3}[item.severity]||1)},0);
    var balanceScore=severityRank===3?10:(severityRank===2?30:(severityRank===1?45:(positive.length?75:60))),balanceEvidence=[];
    if(phenomena.length)balanceEvidence.push(phenomena.map(function(item){return item.name+'（'+item.severity+'）'}).join('、'));
    if(positive.length)balanceEvidence.push(positive.map(function(item){return item.name}).join('、'));
    if(!balanceEvidence.length)balanceEvidence.push('未见严格气势病象或清秀气象');

    var requiredRuleIds=required.map(function(item){return item.ruleId}).filter(Boolean).sort();
    var diseaseFamilies=(disease.items||[]).map(function(item){return item.family||item.name}).filter(Boolean).sort();
    var diseaseCauseId='disease:'+(diseaseFamilies.length?diseaseFamilies.join('+'):'none');
    var phenomenonRuleIds=phenomena.map(function(item){return item.ruleId||item.name}).filter(Boolean).sort(),positiveRuleIds=positive.map(function(item){return item.ruleId||item.name}).filter(Boolean).sort();
    var phenomenonCauseId='phenomenon:'+(phenomenonRuleIds.length?phenomenonRuleIds.join('+'):'none'),positiveCauseId='positive:'+(positiveRuleIds.length?positiveRuleIds.join('+'):'none');
    function qualificationCause(item){return 'qualification:'+(item.ruleId||mainRuleId+':'+(item.id||item.label))}
    function shareAt(total,length,index){var base=total/length;return index===length-1?total-base*(length-1):base}
    var formationComponents;
    if(specialQualification){
      formationComponents=[component('格局状态',statusScore,statusEvidence,65,'formation:status:'+mainRuleId,'formation',mainRuleId)];
      specialOwnedChecks.formation.forEach(function(item,index){formationComponents.push(component('成立资格：'+item.label,item.met?100:0,item.evidence,shareAt(35,specialOwnedChecks.formation.length,index),qualificationCause(item),'formation',item.ruleId,{sourceCheckId:item.id}))});
      (specialQualification.checks||[]).filter(function(item){return specialCheckOwner(item)!=='formation'}).forEach(function(item){formationComponents.push(component('资格解释：'+item.label,item.met?100:0,item.evidence,0,qualificationCause(item),specialCheckOwner(item),item.ruleId,{sourceCheckId:item.id}))});
    }else{
      formationComponents=useCompletion?[
        component('格局状态',statusScore,statusEvidence,65,'formation:status:'+mainRuleId,'formation',mainRuleId),
        component('成立条件完成度',completionScore,met+'/'+required.length,35,'formation:checks:'+(requiredRuleIds.join('+')||mainRuleId),'formation',requiredRuleIds.join('+')||mainRuleId,{evidenceRuleIds:requiredRuleIds})
      ]:[component('主格状态',statusScore,statusEvidence,100,'formation:status:'+mainRuleId,'formation',mainRuleId)];
    }
    if(deduplicateCauses&&scoringStatus!==status&&phenomena.length){
      formationComponents.push(component('气势病象对状态的解释',statusScore,'显示状态'+status+'；气势病象数值只由气势校正维度结算',0,phenomenonCauseId,'balance',phenomenonRuleIds.join('+')||'ZP-QX-000'));
    }
    var flowComponents;
    if(specialQualification){
      flowComponents=specialOwnedChecks.flow.length?specialOwnedChecks.flow.map(function(item,index){return component('独立顺势：'+item.label,flowScore,item.evidence,shareAt(100,specialOwnedChecks.flow.length,index),qualificationCause(item),'flow',item.ruleId,{sourceCheckId:item.id})}):[component('特殊格独立顺势中性位',50,flowEvidence,100,'flow:neutral:'+mainRuleId,'flow','ZP-SCORE-FLOW-NEUTRAL')];
      (specialQualification.checks||[]).filter(function(item){return specialCheckOwner(item)!=='flow'}).forEach(function(item){flowComponents.push(component('顺势链资格解释：'+item.label,item.met?100:0,item.evidence,0,qualificationCause(item),specialCheckOwner(item),item.ruleId,{sourceCheckId:item.id}))});
    }else flowComponents=[component('作用链可达度',clamp(flowScore),flowEvidence,100,'flow:'+mainRuleId,'flow',mainRuleId)];
    var clarityComponents;
    if(specialQualification){
      clarityComponents=specialOwnedChecks.clarity.length?specialOwnedChecks.clarity.map(function(item,index){return component('独立清浊：'+item.label,clarityScore,item.evidence,shareAt(100,specialOwnedChecks.clarity.length,index),qualificationCause(item),'clarity',item.ruleId,{sourceCheckId:item.id})}):[component('特殊格独立清浊中性位',50,clarityEvidence,100,'clarity:neutral:'+mainRuleId,'clarity','ZP-SCORE-CLARITY-NEUTRAL')];
      (specialQualification.checks||[]).filter(function(item){return specialCheckOwner(item)!=='clarity'}).forEach(function(item){clarityComponents.push(component('清浊资格解释：'+item.label,item.met?100:0,item.evidence,0,qualificationCause(item),specialCheckOwner(item),item.ruleId,{sourceCheckId:item.id}))});
    }else if(clarityClaimedByDisease){
      clarityComponents=[
        component('病药归属后的清浊中性位',50,clarityEvidence,100,'clarity:neutral:disease-owned:'+mainRuleId,'clarity','ZP-SCORE-CLARITY-NEUTRAL'),
        component('病点清浊解释',50,clarityEvidence,0,diseaseCauseId,'remedy',disease.ruleId||'ZP-NET-01')
      ];
    }else if(strictDerivedClarity){
      clarityComponents=[
        component('独立去留基础',65,clarityEvidence,100,'clarity:base:'+(clarityObject.causeGroup||'strict')+':'+mainRuleId,'clarity',mainRuleId),
        component('成格状态解释',65,clarityEvidence,0,'formation:status:'+mainRuleId,'formation',mainRuleId),
        component('作用链解释',65,clarityEvidence,0,'flow:'+mainRuleId,'flow',mainRuleId),
        component('残病结果解释',65,clarityEvidence,0,diseaseCauseId,'remedy',disease.ruleId||'ZP-NET-01')
      ];
    }else{
      clarityComponents=[component('清浊',clarityScore,clarityEvidence,100,'clarity:'+(clarityObject.causeGroup||clarity||'pending')+':'+mainRuleId,'clarity',mainRuleId)];
    }
    var balanceComponents;
    if(phenomena.length){
      balanceComponents=[component('气势病象',balanceScore,phenomena.map(function(item){return item.name+'（'+item.severity+'）'}).join('、'),100,phenomenonCauseId,'balance',phenomenonRuleIds.join('+')||'ZP-QX-000',{evidenceRuleIds:phenomenonRuleIds})];
      if(positive.length)balanceComponents.push(component('清秀气象',60,positive.map(function(item){return item.name}).join('、')+'（有病象时不参与加分）',0,positiveCauseId,'balance',positiveRuleIds.join('+')||'ZP-ZX-00',{evidenceRuleIds:positiveRuleIds}));
    }else if(positive.length){
      balanceComponents=[component('清秀气象',75,positive.map(function(item){return item.name}).join('、'),100,positiveCauseId,'balance',positiveRuleIds.join('+')||'ZP-ZX-00',{evidenceRuleIds:positiveRuleIds})];
    }else{
      balanceComponents=[component('气势中性位',60,'未见严格气势病象或清秀气象',100,'balance:neutral','balance','ZP-SCORE-BALANCE-NEUTRAL')];
    }
    var dimensions=[
      dimension('potential','古籍格局潜力',potential.score,potential.evidence,[component('主格古籍潜力',potential.score,potential.evidence,100,'potential:'+mainRuleId,'potential',potential.ruleId,{pattern:potential.pattern,tier:potential.tier,sourceSystem:potential.sourceSystem,source:potential.source})]),
      dimension('formation','成格完成度',formationScore,statusEvidence+(useCompletion?'；对应成立条件'+met+'/'+required.length:'；组合格已由独立入口验真'),formationComponents),
      dimension('flow','作用链',flowScore,flowEvidence,flowComponents),
      dimension('clarity','清浊去留',clarityScore,clarityEvidence,clarityComponents),
      dimension('remedy','病药净结算',remedyScore,remedyEvidence,[component('病药残余',clamp(remedyScore),remedyEvidence,100,diseaseCauseId,'remedy',disease.ruleId||'ZP-NET-01')]),
      dimension('balance','气势校正',balanceScore,balanceEvidence.join('；'),balanceComponents)
    ];
    var unroundedScore=dimensions.reduce(function(sum,item){return sum+item.contribution},0),score=clamp(unroundedScore);
    var ledger=[];
    dimensions.forEach(function(item){
      (item.components||[]).forEach(function(entry){ledger.push(Object.assign({dimension:item.key,dimensionName:item.name,dimensionWeight:item.weight},entry))});
    });
    var missingMetadata=[],ownerShareViolations=[],nonOwnerShareViolations=[],ownersByCause={};
    ledger.forEach(function(entry){
      ['causeId','numericOwner','ruleId','evidence','share'].forEach(function(field){if(entry[field]==null||entry[field]==='')missingMetadata.push({dimension:entry.dimension,name:entry.name,field:field})});
      if(entry.dimension!==entry.numericOwner&&entry.share!==0)nonOwnerShareViolations.push({causeId:entry.causeId,dimension:entry.dimension,numericOwner:entry.numericOwner,share:entry.share});
      if(entry.counted&&entry.share>0){
        if(!ownersByCause[entry.causeId])ownersByCause[entry.causeId]={};
        ownersByCause[entry.causeId][entry.numericOwner]=true;
      }
    });
    dimensions.forEach(function(item){
      var share=(item.components||[]).filter(function(entry){return entry.numericOwner===item.key&&entry.counted}).reduce(function(sum,entry){return sum+entry.share},0);
      if(Math.abs(share-100)>1e-9)ownerShareViolations.push({dimension:item.key,share:share});
    });
    var duplicateNumericOwners=Object.keys(ownersByCause).filter(function(causeId){return Object.keys(ownersByCause[causeId]).length>1}).map(function(causeId){return {causeId:causeId,owners:Object.keys(ownersByCause[causeId])}});
    var causeAudit={valid:!missingMetadata.length&&!ownerShareViolations.length&&!nonOwnerShareViolations.length&&!duplicateNumericOwners.length,missingMetadata:missingMetadata,ownerShareViolations:ownerShareViolations,nonOwnerShareViolations:nonOwnerShareViolations,duplicateNumericOwners:duplicateNumericOwners};
    if(!causeAudit.valid)throw new Error('评分因果归属校验失败：'+JSON.stringify(causeAudit));
    var weightText=dimensionKeys.map(function(key){return key+weights[key]+'%'}).join('、');
    var method=options.auditOnly||deduplicateCauses||options.modelVersion?('六维线性加权（'+weightText+'）：格名文字不直接决定分数，只有通过稳定规则验真的主格取得一份古籍潜力；每个causeId仅允许一个numericOwner产生非零数值，其他维度只作中性解释；子平硬门槛在百分位候选档之后独立裁决；不使用现实人物结果标签'):'六维线性加权：古籍格局潜力20%、成格完成度25%、作用链20%、清浊去留15%、病药净结算15%、气势调候校正5%；格名文字不直接决定分数，只有通过稳定规则验真的主格取得一份古籍潜力；流通、清浊和病药分别结算，子平硬门槛在百分位候选档之后独立裁决；不使用现实人物结果标签';
    return {score:score,unroundedScore:Math.round(unroundedScore*100)/100,modelVersion:options.modelVersion||PATTERN_SCORE_MODEL_VERSION,totalWeight:100,weights:weights,dimensions:dimensions,ledger:ledger,breakdown:ledger,causeAudit:causeAudit,deduplicateCauses:deduplicateCauses,auditOnly:!!options.auditOnly,method:method};
  }
  function percentileFromHistogram(score,histogram){
    var keys=Object.keys(histogram||{}).map(Number).sort(function(a,b){return a-b}),total=keys.reduce(function(sum,key){return sum+(histogram[key]||0)},0);
    if(!total)return null;
    var below=keys.filter(function(key){return key<score}).reduce(function(sum,key){return sum+(histogram[key]||0)},0),equal=histogram[score]||0;
    return Math.round((below+equal/2)/total*1000)/10;
  }
  function percentileRangeFromHistogram(score,histogram){
    var keys=Object.keys(histogram||{}).map(Number).sort(function(a,b){return a-b}),total=keys.reduce(function(sum,key){return sum+(histogram[key]||0)},0);
    if(!total)return null;
    var below=0;
    keys.forEach(function(key){if(key<score)below+=histogram[key]||0});
    var equal=histogram[score]||0;
    return {low:100*below/total,midpoint:100*(below+equal/2)/total,high:100*(below+equal)/total,equalCount:equal,populationSize:total,populationType:'theoretical-legal-four-pillars'};
  }
  function reweightPatternScore(breakdown,weights,modelVersion){
    var keys=['potential','formation','flow','clarity','remedy','balance'],normalized={},total=0;
    keys.forEach(function(key){
      var value=Number(weights&&weights[key]);
      if(!isFinite(value)||value<0)throw new Error('评分权重无效：'+key);
      normalized[key]=value;
      total+=value;
    });
    if(Math.abs(total-100)>1e-9)throw new Error('评分权重合计必须为100，当前为'+total);
    var dimensions=(breakdown.dimensions||[]).map(function(item){
      var weight=normalized[item.key],contribution=Math.round(item.score*weight)/100,components=(item.components||[]).map(function(entry){return Object.assign({},entry,{counted:entry.numericOwner===item.key&&entry.share>0,effectiveContribution:0})});
      var owners=components.filter(function(entry){return entry.counted}),allocated=0;
      owners.forEach(function(entry,index){
        entry.effectiveContribution=index===owners.length-1?Math.round((contribution-allocated)*1000000)/1000000:Math.round(contribution*entry.share/100*1000000)/1000000;
        allocated+=entry.effectiveContribution;
      });
      return Object.assign({},item,{weight:weight,contribution:contribution,components:components});
    });
    var unroundedScore=dimensions.reduce(function(sum,item){return sum+item.contribution},0),ledger=[];
    dimensions.forEach(function(item){(item.components||[]).forEach(function(entry){ledger.push(Object.assign({dimension:item.key,dimensionName:item.name,dimensionWeight:item.weight},entry))})});
    return {score:Math.max(0,Math.min(100,Math.round(unroundedScore))),unroundedScore:Math.round(unroundedScore*100)/100,modelVersion:modelVersion,totalWeight:100,weights:normalized,dimensions:dimensions,ledger:ledger,breakdown:ledger,causeAudit:breakdown.causeAudit,deduplicateCauses:!!breakdown.deduplicateCauses,auditOnly:true,method:'PAT-LV-DESIGN-v1审计重加权；复用同一份已去重六维向量，不重新执行格局规则或维度锚点'};
  }
  function forEachLegalFourPillar(callback,options){
    options=options||{};
    var monthBranches='寅卯辰巳午未申酉戌亥子丑'.split(''),hourBranches=BRANCHES.slice();
    var yearCycleCount=options.yearCycleCount==null?60:options.yearCycleCount,monthBranchCount=options.monthBranchCount==null?12:options.monthBranchCount,dayCycleCount=options.dayCycleCount==null?60:options.dayCycleCount,hourBranchCount=options.hourBranchCount==null?12:options.hourBranchCount;
    function validCount(value,max,label){if(!Number.isInteger(value)||value<1||value>max)throw new Error(label+'枚举数无效：'+value);return value}
    validCount(yearCycleCount,60,'年柱');validCount(monthBranchCount,12,'月支');validCount(dayCycleCount,60,'日柱');validCount(hourBranchCount,12,'时支');
    var expectedCount=yearCycleCount*monthBranchCount*dayCycleCount*hourBranchCount,seen=options.validateUnique===false?null:new Set(),duplicateCount=0,invalidCount=0,firstKey='',lastKey='',ordinal=0;
    function cycle(index){return STEMS[index%10]+BRANCHES[index%12]}
    for(var yearIndex=0;yearIndex<yearCycleCount;yearIndex++){
      var year=cycle(yearIndex),yearStemIndex=yearIndex%10,monthStart=(2*(yearStemIndex%5)+2)%10;
      for(var monthIndex=0;monthIndex<monthBranchCount;monthIndex++){
        var month=STEMS[(monthStart+monthIndex)%10]+monthBranches[monthIndex];
        for(var dayIndex=0;dayIndex<dayCycleCount;dayIndex++){
          var day=cycle(dayIndex),dayStemIndex=dayIndex%10,hourStart=2*(dayStemIndex%5);
          for(var hourIndex=0;hourIndex<hourBranchCount;hourIndex++){
            var hour=STEMS[(hourStart+hourIndex)%10]+hourBranches[hourIndex],pillars={year:year,month:month,day:day,hour:hour},key=year+'|'+month+'|'+day+'|'+hour;
            if(!firstKey)firstKey=key;
            lastKey=key;
            if(seen){if(seen.has(key))duplicateCount++;else seen.add(key)}
            if(year.length!==2||month.length!==2||day.length!==2||hour.length!==2)invalidCount++;
            if(callback)callback(pillars,{key:key,ordinal:ordinal,yearIndex:yearIndex,monthIndex:monthIndex,dayIndex:dayIndex,hourIndex:hourIndex});
            ordinal++;
          }
        }
      }
    }
    var uniqueCount=seen?seen.size:ordinal-duplicateCount;
    if(ordinal!==expectedCount||uniqueCount!==expectedCount||duplicateCount||invalidCount)throw new Error('合法四柱全集生成失败：'+JSON.stringify({expectedCount:expectedCount,generatedCount:ordinal,uniqueCount:uniqueCount,duplicateCount:duplicateCount,invalidCount:invalidCount}));
    return {version:LEGAL_FOUR_PILLAR_GENERATOR_VERSION,formula:'60年柱×12月支×60日柱×12时支',theoreticalPopulationSize:518400,expectedCount:expectedCount,generatedCount:ordinal,uniqueCount:uniqueCount,duplicateCount:duplicateCount,invalidCount:invalidCount,firstKey:firstKey,lastKey:lastKey,equalWeight:true,directFourPillars:true,usesCalendarDates:false,usesGender:false,usesLuck:false,monthStemRule:'五虎遁',hourStemRule:'五鼠遁'};
  }
  function formatPatternPercentile(percentile){
    if(typeof percentile!=='number'||!isFinite(percentile))return '';
    if(percentile<=0)return '低于P0.1';
    if(percentile>=100)return '高于P99.9';
    return 'P'+percentile;
  }
  function theoreticalGradeFromPercentile(percentile){
    var value=typeof percentile==='number'?percentile:0;
    return THEORETICAL_LEVEL_BANDS.find(function(item){return value>=item.min&&value<item.max})||THEORETICAL_LEVEL_BANDS[THEORETICAL_LEVEL_BANDS.length-1];
  }
  function structureGradeFromScore(score){
    var value=typeof score==='number'&&isFinite(score)?score:0;
    if(value<=48)return STRUCTURE_SCORE_LEVEL_BANDS[0];
    if(value<=52)return STRUCTURE_SCORE_LEVEL_BANDS[1];
    if(value<75)return STRUCTURE_SCORE_LEVEL_BANDS[2];
    if(value<78)return STRUCTURE_SCORE_LEVEL_BANDS[3];
    return STRUCTURE_SCORE_LEVEL_BANDS[4];
  }
  function patternGradeIndexWithinGates(candidateIndex,floorIndex,ceilingIndex){
    if(!Number.isInteger(candidateIndex)||!Number.isInteger(floorIndex)||!Number.isInteger(ceilingIndex)||candidateIndex<0||candidateIndex>=PATTERN_LEVELS.length||floorIndex<0||ceilingIndex>=PATTERN_LEVELS.length)throw new Error('子平硬门槛索引无效：'+JSON.stringify({candidateIndex:candidateIndex,floorIndex:floorIndex,ceilingIndex:ceilingIndex}));
    if(floorIndex>ceilingIndex)throw new Error('子平硬门槛下限不得高于上限：'+JSON.stringify({candidateIndex:candidateIndex,floorIndex:floorIndex,ceilingIndex:ceilingIndex}));
    return Math.max(floorIndex,Math.min(candidateIndex,ceilingIndex));
  }
  function finalizePatternLevel(analysis,raw,percentile){
    var scoreValue=Math.round((raw&&typeof raw.unroundedScore==='number'?raw.unroundedScore:raw&&raw.score||0)*10)/10,candidate=structureGradeFromScore(scoreValue),candidateIndex=PATTERN_LEVELS.indexOf(candidate.grade);
    var main=(analysis.patternStructures||[]).find(function(item){return item.role==='主格'}),regular=analysis.regularPattern||{},status=(main&&main.status)||regular.status||'待成';
    var disease=analysis.patternDisease||{solved:[],partial:[],unresolved:[]},solved=(disease.solved||[]).length,partial=(disease.partial||[]).length,unresolved=(disease.unresolved||[]).length;
    var tie=analysis.patternLevelTieBreak||{tier:0,order:{}},order=tie.order||{},phenomena=analysis.elementPhenomena||[];
    var qualificationChecks=main&&main.qualification&&main.qualification.checks||[];
    var required=qualificationChecks.length?qualificationChecks.map(function(item){return {active:item.met,label:item.label}}):(regular.checks||[]).filter(function(item){return item.type==='立格'||item.type==='成格'}),met=required.filter(function(item){return item.active}).length;
    var established=status==='已成',flawed=status==='成而有瑕';
    var flowGood=!!(analysis.interactionFlow&&analysis.interactionFlow.steps&&analysis.interactionFlow.steps.length&&analysis.interactionFlow.steps.every(function(item){return item.active}));
    var pure=!!(analysis.clarity&&/^(清|较清)$/.test(analysis.clarity.level));
    var strictQuality=tie.tier>=2,formationComplete=tie.tier===2||(required.length&&met===required.length),actionComplete=flowGood;
    var highEligible=!!(strictQuality||established||(flawed&&solved&&!unresolved));
    var topEligible=!!(strictQuality&&established&&formationComplete&&actionComplete&&pure&&!unresolved&&!partial&&!phenomena.length&&!(order.breakers||0));
    var floorIndex=0,ceilingIndex=4,gateReasons=[];
    if(!highEligible)ceilingIndex=2;
    else if(!topEligible)ceilingIndex=3;
    if(candidateIndex<3)gateReasons.push('结构分已综合成格、清浊、破救与气势，不因同一病点重复降档');
    else if(!highEligible)gateReasons.push('未明确成格或有效救应，不取得高档资格，最高为偏高');
    else if(candidateIndex===4&&!topEligible)gateReasons.push('未同时通过严格成格、作用可达、清纯无残病等顶级资格，最高为高');
    if(candidateIndex>=3&&highEligible)gateReasons.push('已明确成格或见有效救应，取得高档资格');
    if(topEligible)gateReasons.push('成格完整、作用可达、清纯无残病，具备顶级资格');
    var finalIndex=patternGradeIndexWithinGates(candidateIndex,floorIndex,ceilingIndex),grade=PATTERN_LEVELS[finalIndex],floor=PATTERN_LEVELS[floorIndex],ceiling=PATTERN_LEVELS[ceilingIndex];
    var decision={candidateGrade:candidate.grade,candidateBand:candidate.label,candidateIndex:candidateIndex,floorGrade:floor,ceilingGrade:ceiling,finalGrade:grade,finalIndex:finalIndex,highEligible:highEligible,topEligible:topEligible,reasons:gateReasons,ruleIds:['ZP-LV-04','ZP-LV-05','ZP-LV-03','ZP-NET-01'],tiePolicy:'按未舍入结构分保留一位小数直接分档；理论百分位只作总体审计，不参与单盘定档。'};
    var structuralText=(analysis.patternLevel||'').replace(/^(?:偏低|中等|偏高|高|顶级)：/,'');
    analysis.patternLevel=grade+'：结构分'+scoreValue+'，直接候选'+candidate.grade+'；'+gateReasons.join('；')+'。 '+structuralText;
    analysis.patternLevelGrade=grade;
    analysis.patternLevelIndex=finalIndex;
    analysis.patternLevelQualityFloor='';
    analysis.patternLevelHardGate=decision;
    analysis.patternLevelMetrics.candidate=candidate.grade;
    analysis.patternLevelMetrics.hardGate=floor+'至'+ceiling;
    analysis.patternLevelCriteria.unshift({name:'结构分档',met:true,total:1,result:'结构分'+scoreValue+'，候选'+candidate.grade+'（'+decision.candidateBand+'）'});
    analysis.patternLevelCriteria.splice(1,0,{name:'高档资格',met:true,total:1,result:'上限'+ceiling+'，最终'+grade+'；'+gateReasons.join('；')});
    analysis.natalPatternLevel.grade=grade;
    analysis.natalPatternLevel.index=finalIndex;
    analysis.natalPatternLevel.text=analysis.patternLevel;
    analysis.natalPatternLevel.candidateGrade=candidate.grade;
    analysis.natalPatternLevel.floorGrade=floor;
    analysis.natalPatternLevel.ceilingGrade=ceiling;
    analysis.natalPatternLevel.rawScore=scoreValue;
    return decision;
  }
  function buildTheoreticalPatternBaseline(options){
    options=options||{};
    if(typeof getYearGZ==='undefined'||typeof getMonthGZ==='undefined'||typeof getDayGZ==='undefined'||typeof getHourGZ==='undefined')throw new Error('理论基准生成需要页面排盘历法函数。');
    var startText=options.start||THEORETICAL_BASELINE_CONFIG.start,endText=options.endExclusive||THEORETICAL_BASELINE_CONFIG.endExclusive,stepDays=options.stepDays||THEORETICAL_BASELINE_CONFIG.stepDays,hours=(options.hours||THEORETICAL_BASELINE_CONFIG.hours).slice(),deduplicate=options.deduplicate||THEORETICAL_BASELINE_CONFIG.deduplicate;
    var startParts=startText.split('-').map(Number),endParts=endText.split('-').map(Number),startValue=Date.UTC(startParts[0],startParts[1]-1,startParts[2]),endValue=Date.UTC(endParts[0],endParts[1]-1,endParts[2]);
    function eachUniqueSample(callback){
      var dateValue=startValue,seen={},sampleCount=0,duplicateCount=0;
      while(dateValue<endValue){
        var date=new Date(dateValue),year=date.getUTCFullYear(),month=date.getUTCMonth()+1,day=date.getUTCDate();
        hours.forEach(function(hour){
          var time={year:year,month:month,day:day,hour:hour,minute:0},pillars=buildPillars(time),key=[pillars.year,pillars.month,pillars.day,pillars.hour].join('|');
          sampleCount++;
          if(deduplicate==='fourPillars'&&seen[key]){duplicateCount++;return}
          seen[key]=true;
          callback(pillars,time,key);
        });
        dateValue+=stepDays*86400000;
      }
      return {sampleCount:sampleCount,uniqueCount:Object.keys(seen).length,duplicateCount:duplicateCount};
    }
    var histogram={},mainPatternCounts={};
    var sampleMeta=eachUniqueSample(function(pillars,time){
      var analysis=analyzePattern({pillars:pillars,dayStem:pillars.day[0],time:{used:time}}),raw=analysis.patternRawScore;
      histogram[raw]=(histogram[raw]||0)+1;
      mainPatternCounts[analysis.mainPattern]=(mainPatternCounts[analysis.mainPattern]||0)+1;
    });
    var candidateGradeCounts={},gradeCounts={};
    eachUniqueSample(function(pillars,time){
      var analysis=analyzePattern({pillars:pillars,dayStem:pillars.day[0],time:{used:time}}),raw=analysis.patternRawScoreBreakdown,percentile=percentileFromHistogram(raw.score,histogram),candidate=structureGradeFromScore(raw.unroundedScore),decision=finalizePatternLevel(analysis,raw,percentile);
      candidateGradeCounts[candidate.grade]=(candidateGradeCounts[candidate.grade]||0)+1;
      gradeCounts[decision.finalGrade]=(gradeCounts[decision.finalGrade]||0)+1;
    });
    var keys=Object.keys(histogram).map(Number).sort(function(a,b){return a-b}),total=sampleMeta.uniqueCount;
    function quantileScore(ratio){
      var threshold=total*ratio,cumulative=0;
      for(var i=0;i<keys.length;i++){cumulative+=histogram[keys[i]]||0;if(cumulative>=threshold)return keys[i]}
      return keys.length?keys[keys.length-1]:null;
    }
    var mean=keys.reduce(function(sum,key){return sum+key*(histogram[key]||0)},0)/(total||1);
    var variance=keys.reduce(function(sum,key){return sum+Math.pow(key-mean,2)*(histogram[key]||0)},0)/(total||1),gradePercentages={};
    PATTERN_LEVELS.forEach(function(grade){gradePercentages[grade]=Math.round(((gradeCounts[grade]||0)/(total||1))*10000)/100});
    return {version:options.version||THEORETICAL_BASELINE_VERSION,config:{start:startText,endExclusive:endText,stepDays:stepDays,hours:hours,timezone:THEORETICAL_BASELINE_CONFIG.timezone,referenceLongitude:THEORETICAL_BASELINE_CONFIG.referenceLongitude,trueSolarCorrection:false,deduplicate:deduplicate},sampleCount:sampleMeta.sampleCount,uniqueCount:sampleMeta.uniqueCount,duplicateCount:sampleMeta.duplicateCount,histogram:histogram,scoreRange:{min:keys[0],max:keys[keys.length-1]},mean:Math.round(mean*1000000)/1000000,standardDeviation:Math.round(Math.sqrt(variance)*1000000)/1000000,quantiles:{p5:quantileScore(0.05),p20:quantileScore(0.20),p50:quantileScore(0.50),p80:quantileScore(0.80),p95:quantileScore(0.95)},candidateGradeCounts:candidateGradeCounts,gradeCounts:gradeCounts,gradePercentages:gradePercentages,mainPatternCounts:mainPatternCounts,ruleVersion:PATTERN_RULE_VERSION,engineVersion:PATTERN_ENGINE_VERSION,scoreModelVersion:PATTERN_SCORE_MODEL_VERSION,scope:'纯理论合法时间网格；不含真人资料与现实成就标签'};
  }
  function roundedAuditNumber(value,digits){
    if(value==null||!isFinite(value))return null;
    var scale=Math.pow(10,digits==null?6:digits);
    return Math.round(value*scale)/scale;
  }
  function auditMoment(){return {count:0,sum:0,sumSquares:0,sumCubes:0,min:Infinity,max:-Infinity}}
  function addAuditMoment(moment,value,count){
    count=count==null?1:count;
    moment.count+=count;moment.sum+=value*count;moment.sumSquares+=value*value*count;moment.sumCubes+=value*value*value*count;
    moment.min=Math.min(moment.min,value);moment.max=Math.max(moment.max,value);
  }
  function auditMomentSummary(moment){
    if(!moment.count)return {count:0,min:null,max:null,mean:null,standardDeviation:null,skewness:null};
    var mean=moment.sum/moment.count,variance=Math.max(0,moment.sumSquares/moment.count-mean*mean),standardDeviation=Math.sqrt(variance);
    var third=moment.sumCubes/moment.count-3*mean*(moment.sumSquares/moment.count)+2*mean*mean*mean;
    return {count:moment.count,min:moment.min,max:moment.max,mean:roundedAuditNumber(mean,9),standardDeviation:roundedAuditNumber(standardDeviation,9),skewness:standardDeviation?roundedAuditNumber(third/Math.pow(standardDeviation,3),9):0};
  }
  function emptyPatternGradeCounts(){var output={};PATTERN_LEVELS.forEach(function(grade){output[grade]=0});return output}
  function emptyPatternMigration(){
    var output={};
    PATTERN_LEVELS.forEach(function(from){output[from]={};PATTERN_LEVELS.forEach(function(to){output[from][to]=0})});
    return output;
  }
  function incrementPatternMigration(matrix,from,to,count){matrix[from][to]+=(count==null?1:count)}
  function gradePercentagesFromCounts(counts,total){
    var output={};
    PATTERN_LEVELS.forEach(function(grade){output[grade]=roundedAuditNumber((counts[grade]||0)/(total||1)*100,6)});
    return output;
  }
  function histogramTieIntervals(histogram){
    var keys=Object.keys(histogram||{}).map(Number).sort(function(a,b){return a-b}),total=keys.reduce(function(sum,key){return sum+(histogram[key]||0)},0),below=0,output={};
    keys.forEach(function(key){
      var equal=histogram[key]||0;
      output[key]={low:100*below/total,midpoint:100*(below+equal/2)/total,high:100*(below+equal)/total,equalCount:equal,populationSize:total,populationType:'theoretical-legal-four-pillars'};
      below+=equal;
    });
    return output;
  }
  function histogramAuditStats(histogram){
    var keys=Object.keys(histogram||{}).map(Number).sort(function(a,b){return a-b}),moment=auditMoment(),total=0,largest={score:null,count:0};
    keys.forEach(function(key){var count=histogram[key]||0;total+=count;addAuditMoment(moment,key,count);if(count>largest.count)largest={score:key,count:count}});
    function quantile(ratio){
      var threshold=total*ratio,cumulative=0;
      for(var i=0;i<keys.length;i++){cumulative+=histogram[keys[i]]||0;if(cumulative>=threshold)return keys[i]}
      return keys.length?keys[keys.length-1]:null;
    }
    var summary=auditMomentSummary(moment);
    return {populationSize:total,scoreRange:{min:keys.length?keys[0]:null,max:keys.length?keys[keys.length-1]:null},mean:summary.mean,standardDeviation:summary.standardDeviation,skewness:summary.skewness,quantiles:{p5:quantile(0.05),p20:quantile(0.20),p50:quantile(0.50),p80:quantile(0.80),p95:quantile(0.95)},distinctScoreCount:keys.length,largestTieBucket:{score:largest.score,count:largest.count,percentage:roundedAuditNumber(largest.count/(total||1)*100,6)}};
  }
  function updatePatternScoreGroup(groups,score,analysis,key){
    if(!groups[score])groups[score]={count:0,mainPatterns:{},statuses:{},structureTypes:{},diseaseStates:{},clarityLevels:{},examples:[]};
    var group=groups[score],main=(analysis.patternStructures||[]).find(function(item){return item.role==='主格'}),status=(main&&main.status)||(analysis.regularPattern&&analysis.regularPattern.status)||'待成';
    var mainPattern=analysis.mainPattern||main&&main.name||'未见明确主格',structureType=analysis.specialPatternQualification?'严格特殊格':(analysis.patternLevelTieBreak&&analysis.patternLevelTieBreak.tier===2?'严格组合格':(status==='已成'?'普通已成':(status==='成而有瑕'?'成而有瑕':(status==='已破'?'已破':'条件不足线索'))));
    var disease=analysis.patternDisease||{items:[],solved:[],partial:[],unresolved:[]},diseaseState=(disease.unresolved||[]).length?'未解病点':((disease.partial||[]).length?'部分残病':((disease.items||[]).length?'病点全解':'无主要病点'));
    var clarity=analysis.structuralClarity&&analysis.structuralClarity.level||analysis.clarity&&analysis.clarity.level||'待辨';
    function count(map,name){map[name]=(map[name]||0)+1}
    group.count++;count(group.mainPatterns,mainPattern);count(group.statuses,status);count(group.structureTypes,structureType);count(group.diseaseStates,diseaseState);count(group.clarityLevels,clarity);
    if(group.examples.length<8)group.examples.push({key:key,mainPattern:mainPattern,status:status,structureType:structureType,diseaseState:diseaseState,clarity:clarity});
  }
  function compactPatternScoreGroup(group){
    if(!group)return null;
    return {count:group.count,mainPatterns:group.mainPatterns,statuses:group.statuses,structureTypes:group.structureTypes,diseaseStates:group.diseaseStates,clarityLevels:group.clarityLevels,examples:group.examples};
  }
  function buildPatternAuditModel(id,weights,histogram,scoreGroups,hashText){
    var keys=Object.keys(histogram).map(Number).sort(function(a,b){return a-b}),stats=histogramAuditStats(histogram),tieIntervals=histogramTieIntervals(histogram),boundaries={};
    [{name:'P5',ratio:0.05,key:'p5'},{name:'P20',ratio:0.20,key:'p20'},{name:'P50',ratio:0.50,key:'p50'},{name:'P80',ratio:0.80,key:'p80'},{name:'P95',ratio:0.95,key:'p95'}].forEach(function(item){
      var score=stats.quantiles[item.key],index=keys.indexOf(score);
      boundaries[item.name]={targetPercentile:item.ratio*100,score:score,tieInterval:tieIntervals[score],below:index>0?{score:keys[index-1],group:compactPatternScoreGroup(scoreGroups[keys[index-1]])}:null,at:{score:score,group:compactPatternScoreGroup(scoreGroups[score])},above:index>=0&&index<keys.length-1?{score:keys[index+1],group:compactPatternScoreGroup(scoreGroups[keys[index+1]])}:null};
    });
    var canonical={},candidateGradeCounts=emptyPatternGradeCounts(),finalGradeCounts=emptyPatternGradeCounts();
    keys.forEach(function(key){canonical[key]=histogram[key]});
    return {id:id,auditOnly:true,frozen:false,weights:Object.assign({},weights),histogram:canonical,histogramSha256:typeof hashText==='function'?hashText(JSON.stringify(canonical)):null,stats:stats,tieIntervals:tieIntervals,boundaries:boundaries,extrema:{minimum:{score:stats.scoreRange.min,group:compactPatternScoreGroup(scoreGroups[stats.scoreRange.min])},maximum:{score:stats.scoreRange.max,group:compactPatternScoreGroup(scoreGroups[stats.scoreRange.max])}},candidateGradeCounts:candidateGradeCounts,candidateGradePercentages:{},finalGradeCounts:finalGradeCounts,finalGradePercentages:{}};
  }
  function patternCorrelationAccumulator(){
    var dimensions={};['potential','formation','flow','clarity','remedy','balance'].forEach(function(key){dimensions[key]={sumX:0,sumXX:0,sumXY:0}});
    return {count:0,sumY:0,sumYY:0,dimensions:dimensions};
  }
  function addPatternCorrelation(accumulator,dimensions,total){
    accumulator.count++;accumulator.sumY+=total;accumulator.sumYY+=total*total;
    dimensions.forEach(function(item){var acc=accumulator.dimensions[item.key];acc.sumX+=item.score;acc.sumXX+=item.score*item.score;acc.sumXY+=item.score*total});
  }
  function finalizePatternCorrelations(accumulator){
    var output={},n=accumulator.count,denY=n*accumulator.sumYY-accumulator.sumY*accumulator.sumY;
    Object.keys(accumulator.dimensions).forEach(function(key){
      var item=accumulator.dimensions[key],numerator=n*item.sumXY-item.sumX*accumulator.sumY,denX=n*item.sumXX-item.sumX*item.sumX,denominator=Math.sqrt(Math.max(0,denX*denY));
      output[key]=denominator?roundedAuditNumber(numerator/denominator,9):null;
    });
    return output;
  }
  function legacySampleBucketMigration(fullHistogram){
    var oldHistogram=THEORETICAL_BASELINE_HISTOGRAM,total=Object.keys(oldHistogram).reduce(function(sum,key){return sum+(oldHistogram[key]||0)},0),matrix=emptyPatternMigration(),crossGradeCount=0,errorMoment=auditMoment(),maxAbsolute={score:null,count:0,oldMidpoint:null,fullMidpoint:null,difference:0};
    Object.keys(oldHistogram).map(Number).sort(function(a,b){return a-b}).forEach(function(score){
      var count=oldHistogram[score]||0,oldRange=percentileRangeFromHistogram(score,oldHistogram),fullRange=percentileRangeFromHistogram(score,fullHistogram),difference=fullRange.midpoint-oldRange.midpoint,oldGrade=theoreticalGradeFromPercentile(oldRange.midpoint).grade,fullGrade=theoreticalGradeFromPercentile(fullRange.midpoint).grade;
      addAuditMoment(errorMoment,difference,count);incrementPatternMigration(matrix,oldGrade,fullGrade,count);if(oldGrade!==fullGrade)crossGradeCount+=count;
      if(Math.abs(difference)>Math.abs(maxAbsolute.difference))maxAbsolute={score:score,count:count,oldMidpoint:oldRange.midpoint,fullMidpoint:fullRange.midpoint,difference:difference};
    });
    var summary=auditMomentSummary(errorMoment),absoluteSum=0;
    Object.keys(oldHistogram).map(Number).forEach(function(score){var oldRange=percentileRangeFromHistogram(score,oldHistogram),fullRange=percentileRangeFromHistogram(score,fullHistogram);absoluteSum+=Math.abs(fullRange.midpoint-oldRange.midpoint)*(oldHistogram[score]||0)});
    return {version:THEORETICAL_BASELINE_VERSION,sampleSize:total,comparison:'旧23,916分数桶的中位P值与518,400全集对照权重模型中同分数位置比较',meanSignedPercentileChange:summary.mean,meanAbsolutePercentileChange:roundedAuditNumber(absoluteSum/(total||1),9),maximumAbsoluteChange:{score:maxAbsolute.score,count:maxAbsolute.count,oldMidpoint:roundedAuditNumber(maxAbsolute.oldMidpoint,9),fullMidpoint:roundedAuditNumber(maxAbsolute.fullMidpoint,9),difference:roundedAuditNumber(maxAbsolute.difference,9)},crossCandidateGradeCount:crossGradeCount,crossCandidateGradePercentage:roundedAuditNumber(crossGradeCount/(total||1)*100,6),candidateGradeMigration:matrix};
  }
  function buildPatternLevelAudit(options){
    options=options||{};
    var generatorOptions=Object.assign({validateUnique:true},options.generator||{}),expectedCount=(generatorOptions.yearCycleCount==null?60:generatorOptions.yearCycleCount)*(generatorOptions.monthBranchCount==null?12:generatorOptions.monthBranchCount)*(generatorOptions.dayCycleCount==null?60:generatorOptions.dayCycleCount)*(generatorOptions.hourBranchCount==null?12:generatorOptions.hourBranchCount);
    var fullUniverse=expectedCount===518400;
    if(!fullUniverse&&!options.allowPartial)throw new Error('PAT-LV-DESIGN-v1正式审计必须运行518,400全集；缩小枚举仅限测试并需allowPartial=true');
    var controlWeights=Object.assign({},PATTERN_LEVEL_AUDIT_WEIGHTS.control),candidateWeights=Object.assign({},PATTERN_LEVEL_AUDIT_WEIGHTS.candidate);
    var controlScores=new Uint8Array(expectedCount),candidateScores=new Uint8Array(expectedCount),activeScores=new Uint8Array(expectedCount),controlUnrounded=new Float64Array(expectedCount),candidateUnrounded=new Float64Array(expectedCount),floorIndexes=new Uint8Array(expectedCount),ceilingIndexes=new Uint8Array(expectedCount);
    var controlHistogram={},candidateHistogram={},controlGroups={},candidateGroups={},dimensionHistograms={potential:{},formation:{},flow:{},clarity:{},remedy:{},balance:{}},controlCorrelation=patternCorrelationAccumulator(),candidateCorrelation=patternCorrelationAccumulator();
    var deltaMoment=auditMoment(),roundedDeltaMoment=auditMoment(),activeControlDeltaMoment=auditMoment(),deltaHistogram={},roundedDeltaHistogram={},formulaResidualMax=0,analysisPasses=0,dimensionEvaluations=0,topEligibleCount=0;
    var causeIds=new Set(),causeOwnerCounts={potential:0,formation:0,flow:0,clarity:0,remedy:0,balance:0},causeComponentCount=0,neutralExplanationCount=0;
    var generatorMeta=forEachLegalFourPillar(function(pillars,meta){
      var analysis=analyzePattern({pillars:pillars,dayStem:pillars.day[0]}),activeScore=analysis.patternRawScore,activeModelVersion=analysis.patternRawScoreBreakdown&&analysis.patternRawScoreBreakdown.modelVersion;
      analysisPasses++;
      if(activeModelVersion!==PATTERN_SCORE_MODEL_VERSION)throw new Error('现行评分模型在审计中发生变化：'+activeModelVersion);
      var vector=patternStructureRawScore(analysis,{weights:controlWeights,modelVersion:PATTERN_LEVEL_AUDIT_VERSION+'-CAUSE-DEDUP-v1',deduplicateCauses:true,auditOnly:true});
      dimensionEvaluations++;
      var control=reweightPatternScore(vector,controlWeights,PATTERN_LEVEL_AUDIT_VERSION+'-CONTROL-20-25-20-15-15-5'),candidate=reweightPatternScore(vector,candidateWeights,PATTERN_LEVEL_AUDIT_VERSION+'-CANDIDATE-10-25-25-15-20-5');
      if(analysis.patternRawScore!==activeScore||analysis.patternRawScoreBreakdown.modelVersion!==activeModelVersion)throw new Error('审计不得改写现行分析对象');
      controlScores[meta.ordinal]=control.score;candidateScores[meta.ordinal]=candidate.score;activeScores[meta.ordinal]=activeScore;controlUnrounded[meta.ordinal]=control.unroundedScore;candidateUnrounded[meta.ordinal]=candidate.unroundedScore;
      controlHistogram[control.score]=(controlHistogram[control.score]||0)+1;candidateHistogram[candidate.score]=(candidateHistogram[candidate.score]||0)+1;
      updatePatternScoreGroup(controlGroups,control.score,analysis,meta.key);updatePatternScoreGroup(candidateGroups,candidate.score,analysis,meta.key);
      vector.dimensions.forEach(function(item){dimensionHistograms[item.key][item.score]=(dimensionHistograms[item.key][item.score]||0)+1});
      addPatternCorrelation(controlCorrelation,vector.dimensions,control.unroundedScore);addPatternCorrelation(candidateCorrelation,vector.dimensions,candidate.unroundedScore);
      var byKey={};vector.dimensions.forEach(function(item){byKey[item.key]=item.score});
      var expectedDelta=(-10*byKey.potential+5*byKey.flow+5*byKey.remedy)/100,delta=roundedAuditNumber(candidate.unroundedScore-control.unroundedScore,9),residual=Math.abs(delta-expectedDelta);
      formulaResidualMax=Math.max(formulaResidualMax,residual);if(residual>1e-8)throw new Error('候选权重差值公式不成立：'+JSON.stringify({key:meta.key,delta:delta,expected:expectedDelta,dimensions:byKey}));
      var roundedDelta=candidate.score-control.score,activeControlDelta=control.score-activeScore;
      addAuditMoment(deltaMoment,delta);addAuditMoment(roundedDeltaMoment,roundedDelta);addAuditMoment(activeControlDeltaMoment,activeControlDelta);
      deltaHistogram[delta.toFixed(2)]=(deltaHistogram[delta.toFixed(2)]||0)+1;roundedDeltaHistogram[roundedDelta]=(roundedDeltaHistogram[roundedDelta]||0)+1;
      var gate=analysis.patternLevelHardGate||{},floorIndex=PATTERN_LEVELS.indexOf(gate.floorGrade),ceilingIndex=PATTERN_LEVELS.indexOf(gate.ceilingGrade);
      if(floorIndex<0||ceilingIndex<0||floorIndex>ceilingIndex)throw new Error('子平硬门槛区间无效：'+JSON.stringify({key:meta.key,gate:gate}));
      floorIndexes[meta.ordinal]=floorIndex;ceilingIndexes[meta.ordinal]=ceilingIndex;if(gate.topEligible)topEligibleCount++;
      vector.ledger.forEach(function(entry){causeComponentCount++;causeIds.add(entry.causeId);if(entry.counted)causeOwnerCounts[entry.numericOwner]++;else neutralExplanationCount++});
      if(typeof options.onProgress==='function'&&((meta.ordinal+1)%(options.progressEvery||10000)===0||meta.ordinal+1===expectedCount))options.onProgress({processed:meta.ordinal+1,total:expectedCount,percentage:roundedAuditNumber((meta.ordinal+1)/expectedCount*100,2)});
    },generatorOptions);
    if(fullUniverse&&(generatorMeta.firstKey!=='甲子|丙寅|甲子|甲子'||generatorMeta.lastKey!=='癸亥|乙丑|癸亥|癸亥'))throw new Error('合法四柱全集首尾键不符合五虎遁、五鼠遁约束：'+JSON.stringify({firstKey:generatorMeta.firstKey,lastKey:generatorMeta.lastKey}));
    var hashText=options.hashText,controlModel=buildPatternAuditModel('control-20-25-20-15-15-5',controlWeights,controlHistogram,controlGroups,hashText),candidateModel=buildPatternAuditModel('candidate-10-25-25-15-20-5',candidateWeights,candidateHistogram,candidateGroups,hashText);
    var candidateMigration=emptyPatternMigration(),finalMigration=emptyPatternMigration(),legacyCandidateMigration=emptyPatternMigration(),legacyFinalMigration=emptyPatternMigration(),legacyPercentileDelta=auditMoment(),legacyPercentileAbsoluteSum=0,legacyCandidateCross=0,legacyFinalCross=0;
    for(var index=0;index<expectedCount;index++){
      var controlRange=controlModel.tieIntervals[controlScores[index]],candidateRange=candidateModel.tieIntervals[candidateScores[index]],controlCandidate=structureGradeFromScore(controlUnrounded[index]).grade,candidateCandidate=structureGradeFromScore(candidateUnrounded[index]).grade;
      controlModel.candidateGradeCounts[controlCandidate]++;candidateModel.candidateGradeCounts[candidateCandidate]++;incrementPatternMigration(candidateMigration,controlCandidate,candidateCandidate);
      var controlCandidateIndex=PATTERN_LEVELS.indexOf(controlCandidate),candidateCandidateIndex=PATTERN_LEVELS.indexOf(candidateCandidate),floorIndex=floorIndexes[index],ceilingIndex=ceilingIndexes[index];
      var controlFinal=PATTERN_LEVELS[patternGradeIndexWithinGates(controlCandidateIndex,floorIndex,ceilingIndex)],candidateFinal=PATTERN_LEVELS[patternGradeIndexWithinGates(candidateCandidateIndex,floorIndex,ceilingIndex)];
      controlModel.finalGradeCounts[controlFinal]++;candidateModel.finalGradeCounts[candidateFinal]++;incrementPatternMigration(finalMigration,controlFinal,candidateFinal);
      var legacyRange=percentileRangeFromHistogram(activeScores[index],THEORETICAL_BASELINE_HISTOGRAM),legacyCandidate=theoreticalGradeFromPercentile(legacyRange.midpoint).grade,legacyCandidateIndex=PATTERN_LEVELS.indexOf(legacyCandidate),legacyFinal=PATTERN_LEVELS[patternGradeIndexWithinGates(legacyCandidateIndex,floorIndex,ceilingIndex)],percentileDelta=controlRange.midpoint-legacyRange.midpoint;
      incrementPatternMigration(legacyCandidateMigration,legacyCandidate,controlCandidate);incrementPatternMigration(legacyFinalMigration,legacyFinal,controlFinal);if(legacyCandidate!==controlCandidate)legacyCandidateCross++;if(legacyFinal!==controlFinal)legacyFinalCross++;
      addAuditMoment(legacyPercentileDelta,percentileDelta);legacyPercentileAbsoluteSum+=Math.abs(percentileDelta);
    }
    controlModel.candidateGradePercentages=gradePercentagesFromCounts(controlModel.candidateGradeCounts,expectedCount);candidateModel.candidateGradePercentages=gradePercentagesFromCounts(candidateModel.candidateGradeCounts,expectedCount);
    controlModel.finalGradePercentages=gradePercentagesFromCounts(controlModel.finalGradeCounts,expectedCount);candidateModel.finalGradePercentages=gradePercentagesFromCounts(candidateModel.finalGradeCounts,expectedCount);
    var dimensionSensitivity={},concentrationFlags=[];
    Object.keys(dimensionHistograms).forEach(function(key){
      var stats=histogramAuditStats(dimensionHistograms[key]);
      dimensionSensitivity[key]={histogram:dimensionHistograms[key],scoreRange:stats.scoreRange,mean:stats.mean,standardDeviation:stats.standardDeviation,distinctScoreCount:stats.distinctScoreCount,largestBucket:stats.largestTieBucket};
      if(stats.largestTieBucket.percentage>=50)concentrationFlags.push({dimension:key,reason:'单一数值桶占比达到或超过50%',bucket:stats.largestTieBucket});
    });
    var controlCorrelations=finalizePatternCorrelations(controlCorrelation),candidateCorrelations=finalizePatternCorrelations(candidateCorrelation),correlationFlags=[];
    [ {model:'control',values:controlCorrelations},{model:'candidate',values:candidateCorrelations} ].forEach(function(model){Object.keys(model.values).forEach(function(key){if(model.values[key]!=null&&Math.abs(model.values[key])>=0.9)correlationFlags.push({model:model.model,dimension:key,correlation:model.values[key],reason:'与总分绝对相关系数达到或超过0.90'})})});
    var legacySummary=auditMomentSummary(legacyPercentileDelta),deltaSummary=auditMomentSummary(deltaMoment),roundedDeltaSummary=auditMomentSummary(roundedDeltaMoment),activeControlSummary=auditMomentSummary(activeControlDeltaMoment);
    return {version:PATTERN_LEVEL_AUDIT_VERSION,status:'audit-candidate',auditOnly:true,frozen:false,uiIntegrated:false,scope:'纯理论合法四柱结构全集；只审计结构分分布与极值，不参与单盘层次定档',population:Object.assign({},generatorMeta,{populationType:'theoretical-legal-four-pillars',fullUniverse:fullUniverse,analysisPassesPerChart:analysisPasses/(expectedCount||1),analysisPassCount:analysisPasses,dimensionEvaluationsPerChart:dimensionEvaluations/(expectedCount||1),dimensionEvaluationCount:dimensionEvaluations}),versions:{engineVersion:PATTERN_ENGINE_VERSION,ruleVersion:PATTERN_RULE_VERSION,activeScoreModelVersion:PATTERN_SCORE_MODEL_VERSION,legacyBaselineVersion:THEORETICAL_BASELINE_VERSION,auditVersion:PATTERN_LEVEL_AUDIT_VERSION,generatorVersion:LEGAL_FOUR_PILLAR_GENERATOR_VERSION},guardrails:{ruleConditionsChanged:false,activeWeightsChanged:false,activeUiChanged:false,weightsFrozen:false,usesRealPersonFeedback:false,sameRuleAnalysisForBothWeights:true,activeAnalysisObjectMutated:false},causeOwnership:{version:PATTERN_LEVEL_AUDIT_VERSION+'-CAUSE-DEDUP-v1',valid:true,evaluatedLedgers:dimensionEvaluations,componentCount:causeComponentCount,distinctCauseIdCount:causeIds.size,neutralExplanationCount:neutralExplanationCount,numericOwnerComponentCounts:causeOwnerCounts,duplicateNumericOwnerCount:0,missingMetadataCount:0,policy:'同一causeId只允许一个numericOwner产生非零影响；气势状态归balance，特殊格资格按formation/flow/clarity独立职责拆分，严格组合由成格、作用链与残病派生的较清增益仅作零值解释'},models:{control:controlModel,candidate:candidateModel},sensitivity:{candidateMinusControlFormula:'-0.10*potential + 0.05*flow + 0.05*remedy',formulaResidualMax:roundedAuditNumber(formulaResidualMax,12),unroundedDelta:Object.assign(deltaSummary,{histogram:deltaHistogram}),roundedScoreDelta:Object.assign(roundedDeltaSummary,{histogram:roundedDeltaHistogram}),activeV5ToDeduplicatedControlScoreDelta:activeControlSummary,dimensionDistributions:dimensionSensitivity,dimensionToTotalPearson:{control:controlCorrelations,candidate:candidateCorrelations},candidateGradeMigration:candidateMigration,finalGradeMigration:finalMigration,structureIdentityChanges:{mainPattern:0,status:0,ruleResult:0},flags:{correlation:correlationFlags,concentration:concentrationFlags}},legacyComparator:{frozenSampleBucketMigration:legacySampleBucketMigration(controlHistogram),fullUniverseMigration:{comparison:'旧抽样百分位候选档与现行结构分直接分档的诊断比较',populationSize:expectedCount,percentileChange:{meanSigned:legacySummary.mean,meanAbsolute:roundedAuditNumber(legacyPercentileAbsoluteSum/(expectedCount||1),9),minimum:legacySummary.min,maximum:legacySummary.max,standardDeviation:legacySummary.standardDeviation},candidateGradeCrossCount:legacyCandidateCross,candidateGradeCrossPercentage:roundedAuditNumber(legacyCandidateCross/(expectedCount||1)*100,6),finalGradeCrossCount:legacyFinalCross,finalGradeCrossPercentage:roundedAuditNumber(legacyFinalCross/(expectedCount||1)*100,6),candidateGradeMigration:legacyCandidateMigration,finalGradeMigration:legacyFinalMigration}},hardGate:{policy:'先按未舍入结构分直接分档；高档须明确成格或有效救应，顶级须通过完整严格资格',topEligibleCount:topEligibleCount,invalidIntervalCount:0},decision:'结构分直接分档已经接入UI；理论百分位和全集结果仅保留为分布、极值与敏感性审计'};
  }
  function classifiedClues(data){
    var noble=[],misc=[];
    Object.keys(data.pillars).forEach(function(k){
      shenShaForPillar(data,data.pillars[k]).forEach(function(s){
        if(/贵人|天德|月德|国印|文昌|福星|太极|德秀|金舆/.test(s)){if(noble.indexOf(s)<0)noble.push(s)}
        if(/魁罡|金神|羊刃|孤鸾|阴差阳错|十恶大败|童子|空亡|华盖|驿马/.test(s)){if(misc.indexOf(s)<0)misc.push(s)}
      });
    });
    return {noble:noble,misc:misc};
  }
  function shenShaForPillar(data,gz){
    var stem=data.dayStem,yearStem=data.pillars.year[0],branch=gz[1],dayBranch=data.pillars.day[1],yearBranch=data.pillars.year[1],monthBranch=data.pillars.month[1],out=[];
    if(has(SHENSHA_RULES.tianyi,stem,branch)||has(SHENSHA_RULES.tianyi,yearStem,branch))add(out,'天乙贵人');
    if(has(SHENSHA_RULES.taiji,stem,branch)||has(SHENSHA_RULES.taiji,yearStem,branch))add(out,'太极贵人');
    if(SHENSHA_RULES.wenchang[stem]===branch||SHENSHA_RULES.wenchang[yearStem]===branch)add(out,'文昌贵人');
    if(SHENSHA_RULES.tianchu[stem]===branch||SHENSHA_RULES.tianchu[yearStem]===branch)add(out,'天厨贵人');
    if(has(SHENSHA_RULES.fuxing,stem,branch)||has(SHENSHA_RULES.fuxing,yearStem,branch))add(out,'福星贵人');
    if(SHENSHA_RULES.guoyin[stem]===branch||SHENSHA_RULES.guoyin[yearStem]===branch)add(out,'国印贵人');
    if(SHENSHA_RULES.jinyu[stem]===branch)add(out,'金舆');
    if(SHENSHA_RULES.liuxia[stem]===branch)add(out,'流霞');
    if(SHENSHA_RULES.hongyan[stem]===branch)add(out,'红艳');
    if(SHENSHA_RULES.lushen[stem]===branch)add(out,'禄神');
    if(SHENSHA_RULES.yangren[stem]===branch)add(out,'羊刃');
    if(SHENSHA_RULES.peach[dayBranch]===branch||SHENSHA_RULES.peach[yearBranch]===branch)add(out,'桃花');
    if(SHENSHA_RULES.huagai[dayBranch]===branch||SHENSHA_RULES.huagai[yearBranch]===branch)add(out,'华盖');
    if(SHENSHA_RULES.yima[dayBranch]===branch||SHENSHA_RULES.yima[yearBranch]===branch)add(out,'驿马');
    if(SHENSHA_RULES.jiangxing[dayBranch]===branch||SHENSHA_RULES.jiangxing[yearBranch]===branch)add(out,'将星');
    if(SHENSHA_RULES.jiesha[dayBranch]===branch||SHENSHA_RULES.jiesha[yearBranch]===branch)add(out,'劫煞');
    if(SHENSHA_RULES.wangshen[yearBranch]===branch)add(out,'亡神');
    if(SHENSHA_RULES.zaisha[yearBranch]===branch)add(out,'灾煞');
    if(SHENSHA_RULES.yuanshen[yearBranch]===branch)add(out,'元辰');
    if(SHENSHA_RULES.hongluan[yearBranch]===branch)add(out,'红鸾');
    if(SHENSHA_RULES.tianxi[yearBranch]===branch)add(out,'天喜');
    if(SHENSHA_RULES.pima[yearBranch]===branch)add(out,'披麻');
    if(SHENSHA_RULES.diaoke[yearBranch]===branch)add(out,'吊客');
    if(SHENSHA_RULES.guasu[yearBranch]===branch)add(out,'寡宿');
    if(BRANCHES[(BRANCHES.indexOf(monthBranch)+11)%12]===branch)add(out,'天医');
    if(SHENSHA_RULES.tianDe[monthBranch]===gz[0]||SHENSHA_RULES.tianDe[monthBranch]===branch)add(out,'天德贵人');
    if(SHENSHA_RULES.tianDe[monthBranch]&&combineStem[SHENSHA_RULES.tianDe[monthBranch]]===gz[0])add(out,'天德合');
    if(SHENSHA_RULES.monthDeStem[monthBranch]===gz[0])add(out,'月德贵人');
    if(SHENSHA_RULES.monthDeStem[monthBranch]&&combineStem[SHENSHA_RULES.monthDeStem[monthBranch]]===gz[0])add(out,'月德合');
    if((SHENSHA_RULES.dexiuStem[monthBranch]||'').indexOf(gz[0])>=0)add(out,'德秀贵人');
    if((SHENSHA_RULES.tongzi[monthBranch]||'').indexOf(branch)>=0)add(out,'童子煞');
    if(SHENSHA_RULES.tenBad.indexOf(gz)>=0&&data.pillars.day===gz)add(out,'十恶大败');
    if(SHENSHA_RULES.kuigang.indexOf(gz)>=0&&data.pillars.day===gz)add(out,'魁罡');
    if(SHENSHA_RULES.yinYangError.indexOf(gz)>=0&&data.pillars.day===gz)add(out,'阴差阳错');
    if(SHENSHA_RULES.guluan.indexOf(gz)>=0&&data.pillars.day===gz)add(out,'孤鸾');
    if(SHENSHA_RULES.tianShe.indexOf(gz)>=0)add(out,'天赦日');
    if(SHENSHA_RULES.wenchang[stem]===branch)add(out,'词馆');
    if(SHENSHA_RULES.wenchang[yearStem]===branch)add(out,'学堂');
    if(yearStem==='癸'&&(branch==='卯'||branch==='酉'))add(out,'血刃');
    if(kongWang(data.pillars.day).indexOf(branch)>=0)add(out,'空亡');
    return out;
  }
  function analyzePattern(data){
    var pillars=data.pillars,dayStem=data.dayStem||pillars.day[0],monthBranch=pillars.month[1];
    var rawScores=scoreWuxing(pillars),scores=rawScores;
    var strengthOptions={time:data.time&&data.time.used,fullInteractionFeedback:true};
    var weightedStrength=strengthScore(dayStem,pillars,strengthOptions);
    var strength=strengthBand(weightedStrength.support);
    var interactions=weightedStrength.interactions||interactionAnalysis(pillars,scores);
    scores=effectiveWuxingScores(pillars,rawScores,interactions);
    var monthCommand=monthCommandAnalysis(dayStem,pillars,interactions,data.time&&data.time.used);
    var main=monthCommand.primaryStem,monthGod=monthCommand.primaryGod,primary=patternName(dayStem,monthBranch,main),evidence=[];
    var counts=tenGodCounts(dayStem,pillars);
    var profiles=tenGodProfiles(dayStem,pillars,monthCommand,interactions,strengthOptions);
    counts={};Object.keys(profiles).forEach(function(god){counts[god]=profiles[god].count||0});
    var elementPhenomena=[];
    var revealed=monthCommand.revealedStems;
    var rootDetails=weightedStrength.dimensions.roots.items||[],roots=rootDetails.filter(function(item){return item.usable!==false&&!item.transformedAway}).map(function(item){return item.text});
    var carryingCapacity=carryingCapacityFeedback(strength,weightedStrength,profiles,pillars);
    var officerAssessment=assessOfficerMixture(profiles,interactions,pillars,carryingCapacity);
    var regular=regularPatternAssessment(dayStem,pillars,monthGod,profiles,strength,monthCommand,interactions,carryingCapacity);
    evidence.push(monthCommand.basis);
    evidence.push('透干：'+(revealed.length?revealed.map(function(s){return s+tenGod(dayStem,s)}).join('、'):'月令藏干未明显透出')+'。');
    evidence.push('通根：'+(roots.length?dayStem+'见于'+roots.join('、'):'日主未见直接通根')+'。');
    evidence.push('旺衰：'+strength+'；以得令、得地、得势的分项证据综合校准。');
    weightedStrength.evidence.forEach(function(item){evidence.push(item+'。')});
    evidence.push('承载复核：'+carryingCapacity.text+'。');
    interactions.groups.filter(function(x){return x.complete}).forEach(function(item){evidence.push('合会：'+item.text+'。')});
    interactions.stemCombines.forEach(function(item){evidence.push('天干合：'+item.text+'。')});
    interactions.branchPairs.forEach(function(item){evidence.push('地支'+item.type+'：'+item.text+(item.active===false?'，此关系已降级':'')+'。')});
    if(interactions.arbitration)evidence.push('合冲先后：'+interactions.arbitration.text+'；规则 '+interactions.arbitration.ruleIds.join('、')+'。');
    var candidates=monthCommand.selectedStems.map(function(s){return patternName(dayStem,monthBranch,s)}).filter(Boolean);
    var mixed=officerAssessment.unresolved;
    var comboResult=monthComboPatterns(monthCommand,counts,{mixed:mixed,officerAssessment:officerAssessment,strength:strength,profiles:profiles,interactions:interactions,dayRootCount:roots.length,strengthSupport:weightedStrength.support,carryingCapacity:carryingCapacity});
    if(monthCommand.ambiguous)comboResult.clues.unshift({name:'杂气兼用线索参考',text:monthCommand.basis+' 条件未取清前不以其中一神强定成格。'});
    var combos=comboResult.formed,comboClues=comboResult.clues;
    var specials=specialPatterns(dayStem,pillars,scores,counts,strength,rootDetails,interactions,profiles);
    elementPhenomena=elementPhenomenaAnalysis(dayStem,pillars,scores,strength,weightedStrength,specials);
    var clues=classifiedClues({pillars:pillars,dayStem:dayStem});
    var trueSpecial=trueSpecialPattern(specials);
    var specialDetail=trueSpecialDetail(specials);
    var patternIssues=combos.filter(function(name){return /待清|待制|待扶/.test(name)});
    var tenGodTerms=specialDetail?[]:tenGodDiagnostics(counts,profiles,strength,specials);
    tenGodTerms.forEach(function(item){if(patternIssues.indexOf(item.name)<0)patternIssues.push(item.name)});
    elementPhenomena.forEach(function(item){if(patternIssues.indexOf(item.name)<0)patternIssues.push(item.name)});
    if(specialDetail)patternIssues=[];
    var comboConflicts=comboConflictAnalysis(counts,combos,profiles,interactions);
    var arbitration=arbitratePatterns(regular,comboResult,specials,comboConflicts,monthCommand.selectedGods);
    var mainPattern=arbitration.mainPattern;
    var interactionFlow=interactionFlowAnalysis(mainPattern,profiles,interactions,comboConflicts);
    if(specialDetail)interactionFlow=specialInteractionFlowAnalysis(specialDetail,interactions);
    var patternDisease=patternDiseaseAssessment(mainPattern,regular,patternIssues,profiles,interactionFlow,comboConflicts,specialDetail,interactions,{carryingCapacity:carryingCapacity,pillars:pillars});
    settlePatternNet(arbitration,regular,interactionFlow,patternDisease,specialDetail);
    var diagnosticPattern=[mainPattern].concat(patternIssues).join('；');
    var useful=usefulElements(dayStem,strength,{pillars:pillars,monthBranch:monthBranch,monthGod:monthGod,monthCommandStem:main,mainPattern:diagnosticPattern,patternArbitration:arbitration,regularPattern:regular,profiles:profiles,counts:counts,scores:scores,elementPhenomena:elementPhenomena,patternDisease:patternDisease,weightedStrength:weightedStrength,carryingCapacity:carryingCapacity,interactions:interactions});
    if(specialDetail)evidence.push('特殊格语境：'+specialDetail.name+'已逐项验真；普通旺衰与月令常格只作真假边界，不转成扶身、泄耗或常格救应建议。');
    evidence.push('喜用：'+useful.use.join('、')+'；慎用：'+useful.avoid.join('、')+'；'+useful.why);
    var remedy=specialDetail?specialContextRemedy(specialDetail,useful):remedyAdvice(dayStem,pillars,scores,counts,diagnosticPattern,elementPhenomena);
    var basis=specialDetail?(specialDetail.name+'已通过'+specialDetail.checks.length+'项成立条件，按'+specialDetail.type+'独立语境取用；月令常格仅保留为背景。'):patternBasis(dayStem,monthBranch,monthGod,monthCommand);
    var state=specialDetail?specialContextState(specialDetail):(patternState(primary,monthGod,counts,strength,diagnosticPattern,revealed,mixed)+' 命格主线判定：'+regular.name+regular.status+'。'+(elementPhenomena.length?' 气势病象：'+elementPhenomena.map(function(item){return item.conclusion}).join('、'):''));
    var factors=specialDetail?specialContextFactors(specialDetail):patternFactors(dayStem,pillars,counts,strength,diagnosticPattern,roots,revealed,comboClues);
    tenGodTerms.forEach(function(item){factors.push({type:'破',text:item.name+'（'+item.status+'）：'+item.evidence+' 边界：'+item.boundary})});
    var structures=patternStructures(mainPattern,comboResult,comboConflicts,arbitration);
    if(specialDetail)structures=[];
    if(trueSpecial&&!structures.some(function(item){return item.name===trueSpecial}))structures.unshift({name:trueSpecial,ruleId:specialDetail&&specialDetail.ruleId||'ZP-SP-00',ruleVersion:PATTERN_RULE_VERSION,role:'主格',status:'已成',basis:specialDetail&&specialDetail.evidence.length?specialDetail.evidence.join('；'):'特殊格局严格条件已满足',issues:[],rescues:[],conflicts:[],relation:'顺势取用',qualification:specialDetail});
    structures.unshift({name:regular.name,ruleId:regular.authority.ruleId,ruleVersion:regular.authority.ruleVersion,role:specialDetail?'月令背景':(mainPattern===regular.name?'主格':(regular.formed?'命格基础':'命格主线')),status:specialDetail?'仅作背景':regular.status,basis:specialDetail?(regular.name+'仅作月令背景，不参与'+specialDetail.name+'的成败与计分。'):regular.basis,issues:specialDetail?[]:regular.issues,rescues:specialDetail?[]:regular.rescues,conflicts:[],relation:specialDetail?'特殊格成立后不按普通格语境重复裁断':''});
    structures=applyPhenomenaToStructures(structures,elementPhenomena);
    var verdict=overallPatternVerdict(mainPattern,regular,structures,patternIssues);
    var reasoningChain=patternReasoningChain(mainPattern,regular,structures,patternIssues,comboConflicts,verdict,patternDisease);
    var claritySubject=mainPattern==='未见明确成格'?diagnosticPattern:mainPattern;
    var structuralClarity=directClarity(mainPattern,regular,patternClarity(claritySubject,counts,strength,structures,interactionFlow,comboConflicts,patternDisease,specialDetail));
    var clarity=applyPhenomenaToClarity(structuralClarity,elementPhenomena);
    var clarityConclusion=patternClarityConclusion(mainPattern,regular,structures,clarity,interactionFlow,comboConflicts,patternDisease,specialDetail);
    var positivePhenomena=specialDetail?[]:positivePhenomenaAnalysis(pillars,scores,strength,profiles,clarityConclusion,interactionFlow,comboConflicts,elementPhenomena,interactions);
    var confidence=patternConfidence(regular,structures,patternIssues,comboClues,clarity,specials);
    var levelResult=levelAssessment(mainPattern,regular,structures,patternIssues,clarity,interactionFlow,comboConflicts,elementPhenomena,patternDisease);
    var level=levelResult.text;
    var usePriority=useful.arbitration||usefulPriority(diagnosticPattern,strength,monthBranch,specials);
    var regularOutput=specialDetail?Object.assign({},regular,{status:'仅作背景',formed:false,basis:regular.name+'仅作月令背景，不参与'+specialDetail.name+'的成败与计分。',issues:[],rescues:[],checks:[],keep:'月令信息仅作真假校验背景',remove:'不按常格去留重复裁断'}):regular;
    var authorityBasis=specialDetail?specialContextAuthority(specialDetail):regular.authority;
    var publicPrimary=specialDetail?mainPattern:primary;
    var ordinaryContext=specialDetail?{primary:primary,regularPattern:regular,comboPatterns:combos,comboClues:comboClues,comboConflicts:comboConflicts,positivePhenomena:positivePhenomenaAnalysis(pillars,scores,strength,profiles,clarityConclusion,interactionFlow,comboConflicts,elementPhenomena)}:null;
    var result={analysisMeta:{engineVersion:PATTERN_ENGINE_VERSION,ruleVersion:PATTERN_RULE_VERSION,baselineVersion:THEORETICAL_BASELINE_VERSION,scoreModelVersion:PATTERN_SCORE_MODEL_VERSION,baselineScope:'固定理论时间网格只用于分布与极值审计；单盘层次由结构分直接分档，不使用真人结果标签'},realizationBoundary:{model:['原局潜力','行运激活','现实兑现'],localScope:['原局潜力','行运激活'],externalFactors:['家庭','教育','时代','国家与地区','行业环境','个人选择'],text:'格局层次表示命盘结构与行运承接，不代表人的价值，也不保证现实成就。'},natalPatternLevel:{grade:levelResult.grade,index:levelResult.index,text:levelResult.text,scope:'原局结构固定结论',ruleVersion:PATTERN_RULE_VERSION,baselineVersion:THEORETICAL_BASELINE_VERSION,scoreModelVersion:PATTERN_SCORE_MODEL_VERSION},primary:publicPrimary,pattern:publicPrimary,regularPrimary:specialDetail?primary:null,pillars:pillars,monthCommand:monthCommand,patternBasis:basis,authorityBasis:authorityBasis,patternState:state,patternConfidence:confidence,patternVerdict:verdict,patternReasoning:reasoningChain,patternDisease:patternDisease,patternArbitration:arbitration,candidates:candidates,regularPattern:regularOutput,regularPatternBackground:specialDetail?regular:null,ordinaryContext:ordinaryContext,comboPatterns:specialDetail?[]:combos,comboClues:specialDetail?[]:comboClues,patternStructures:structures,mainPattern:mainPattern,patternIssues:patternIssues,diagnosticPattern:diagnosticPattern,patternLevel:level,patternLevelGrade:levelResult.grade,patternLevelIndex:levelResult.index,patternLevelQualityFloor:levelResult.qualityFloor,patternLevelTieBreak:levelResult.tieBreak,patternLevelMetrics:levelResult.metrics,patternLevelCriteria:levelResult.criteria,remedy:remedy,factors:factors,clarity:clarity,structuralClarity:structuralClarity,clarityConclusion:clarityConclusion,comboConflicts:specialDetail?[]:comboConflicts,tenGodTerms:tenGodTerms,usePriority:usePriority,specialPatterns:specials,specialPatternDetails:(specials.details||[]),specialPatternQualification:specialDetail,classifiedClues:clues,elementPhenomena:elementPhenomena,positivePhenomena:positivePhenomena,interactions:interactions,interactionFlow:interactionFlow,strength:strength,strengthScore:weightedStrength,carryingCapacity:carryingCapacity,tenGodCounts:counts,tenGodProfiles:profiles,useful:useful,evidence:evidence};
    result.analysisTime=strengthOptions.time||null;
    result.natalNoblePattern=natalNoblePatternQualification(result);
    var raw=patternStructureRawScore(result),percentile=percentileFromHistogram(raw.score,THEORETICAL_BASELINE_HISTOGRAM);
    result.patternRawScore=raw.score;
    result.patternRawScoreBreakdown=raw;
    result.patternStructureScore=Math.round(raw.unroundedScore*10)/10;
    result.patternPercentile=percentile;
    result.patternPercentileText=formatPatternPercentile(percentile);
    result.natalPatternLevel.rawScore=result.patternStructureScore;
    result.natalPatternLevel.diagnosticPercentile=percentile;
    finalizePatternLevel(result,raw,percentile);
    return result;
  }

  // Shared birth-profile entry point.  Both the Bazi page and any caller that
  // creates a saved profile use the same true-solar correction and analysis.
  function birthDayOfYear(y,m,d){return Math.floor((Date.UTC(y,m-1,d)-Date.UTC(y,0,0))/86400000)}
  function birthEquationOfTimeMinutes(y,m,d,hour,minute){
    var n=birthDayOfYear(y,m,d),clock=(Number(hour)||0)+(Number(minute)||0)/60;
    var gamma=2*Math.PI/365*(n-1+(clock-12)/24);
    return 229.18*(0.000075+0.001868*Math.cos(gamma)-0.032077*Math.sin(gamma)-0.014615*Math.cos(2*gamma)-0.040849*Math.sin(2*gamma));
  }
  function addBirthMinutes(t,mins){var dt=new Date(Date.UTC(t.year,t.month-1,t.day,t.hour,t.minute+Math.round(mins)));return {year:dt.getUTCFullYear(),month:dt.getUTCMonth()+1,day:dt.getUTCDate(),hour:dt.getUTCHours(),minute:dt.getUTCMinutes()}}
  function buildBirthTime(input,location,enabled,useDaylightSaving){
    var t={year:Number(input.year),month:Number(input.month),day:Number(input.day),hour:Number(input.hour),minute:Number(input.minute)||0};
    var normalized=birthTime?birthTime.normalize(t,useDaylightSaving):{standard:t,daylightSaving:false,daylightSavingMinutes:0};
    if(useDaylightSaving&&!birthTime)throw new Error('时间校正模块未加载，请刷新后重试。');
    var standard=normalized.standard;
    var loc=location||{},lng=Number(loc.lng),safeLocation={name:loc.name||'自定义地点',lng:Number.isFinite(lng)?lng:120,lat:loc.lat==null?null:Number(loc.lat)};
    var longitudeCorrection=(safeLocation.lng-120)*4,equationCorrection=birthEquationOfTimeMinutes(standard.year,standard.month,standard.day,standard.hour,standard.minute),correction=longitudeCorrection+equationCorrection;
    return {input:t,standard:standard,daylightSaving:normalized.daylightSaving,daylightSavingMinutes:normalized.daylightSavingMinutes,used:enabled===false?standard:addBirthMinutes(standard,correction),correction:correction,longitudeCorrection:longitudeCorrection,equationCorrection:equationCorrection,enabled:enabled!==false,location:safeLocation};
  }
  function birthRelations(pillars){
    var arr=[],branches=[pillars.year[1],pillars.month[1],pillars.day[1],pillars.hour[1]],rel={'子丑':'六合','寅亥':'六合','卯戌':'六合','辰酉':'六合','巳申':'六合','午未':'六合','子午':'冲','丑未':'冲','寅申':'冲','卯酉':'冲','辰戌':'冲','巳亥':'冲'};
    for(var i=0;i<branches.length;i++)for(var j=i+1;j<branches.length;j++){
      var a=branches[i],b=branches[j],key=[a,b].sort(function(x,y){return BRANCHES.indexOf(x)-BRANCHES.indexOf(y)}).join('');
      if(rel[key])arr.push(a+b+rel[key]);
    }
    var db=pillars.day[1],peach={申:'酉',子:'酉',辰:'酉',寅:'卯',午:'卯',戌:'卯',巳:'午',酉:'午',丑:'午',亥:'子',卯:'子',未:'子'},hua={申:'辰',子:'辰',辰:'辰',寅:'戌',午:'戌',戌:'戌',巳:'丑',酉:'丑',丑:'丑',亥:'未',卯:'未',未:'未'},ma={申:'寅',子:'寅',辰:'寅',寅:'申',午:'申',戌:'申',巳:'亥',酉:'亥',丑:'亥',亥:'巳',卯:'巳',未:'巳'};
    branches.forEach(function(b){if(b===peach[db])arr.push('桃花在'+b);if(b===ma[db])arr.push('驿马在'+b);if(b===hua[db])arr.push('华盖在'+b)});
    kongWang(pillars.day).split('').forEach(function(k){if(branches.indexOf(k)>=0)arr.push('日空 '+k)});
    return arr.length?arr:['暂无明显合冲空亡提示'];
  }
  function createBaziProfile(options){
    options=options||{};
    var time=options.time||buildBirthTime(options.input||{},options.location,options.useTrueSolar,options.useDaylightSaving),pillars=buildPillars(time.used),dayStem=pillars.day[0],scores=scoreWuxing(pillars),strength=assessStrength(dayStem,pillars,scores);
    var data={person:(options.person||'').trim(),gender:options.gender==='女'?'女':'男',time:time,pillars:pillars,dayStem:dayStem,dayElement:STEM_WX[dayStem],scores:scores,strength:strength,useful:usefulElements(dayStem,strength),pattern:patternName(dayStem,pillars.month[1]),relations:birthRelations(pillars)};
    data.patternAnalysis=analyzePattern(data);
    data.strength=data.patternAnalysis.strength;
    data.useful=data.patternAnalysis.useful;
    data.pattern=data.patternAnalysis.primary;
    return data;
  }

  var api={constants:{WUXING:WUXING,STEM_WX:STEM_WX,BRANCH_WX:BRANCH_WX,HIDDEN:HIDDEN,SHENSHA_RULES:SHENSHA_RULES,MAJOR_SOLAR_TERMS:MAJOR_SOLAR_TERMS,AUTHORITY_PATTERN_RULES:AUTHORITY_PATTERN_RULES,CLASSICAL_PATTERN_POTENTIAL_RULES:CLASSICAL_PATTERN_POTENTIAL_RULES,SPECIAL_PATTERN_RULES:SPECIAL_PATTERN_RULES,PHENOMENON_RULES:PHENOMENON_RULES,THEORETICAL_BASELINE_CONFIG:THEORETICAL_BASELINE_CONFIG,THEORETICAL_LEVEL_BANDS:THEORETICAL_LEVEL_BANDS,STRUCTURE_SCORE_LEVEL_BANDS:STRUCTURE_SCORE_LEVEL_BANDS,PATTERN_SCORE_DIMENSION_WEIGHTS:PATTERN_SCORE_DIMENSION_WEIGHTS,PATTERN_LEVEL_AUDIT_VERSION:PATTERN_LEVEL_AUDIT_VERSION,LEGAL_FOUR_PILLAR_GENERATOR_VERSION:LEGAL_FOUR_PILLAR_GENERATOR_VERSION,PATTERN_LEVEL_AUDIT_WEIGHTS:PATTERN_LEVEL_AUDIT_WEIGHTS},SHENSHA_RULES:SHENSHA_RULES,stemPolarity:stemPolarity,tenGod:tenGod,changsheng:changsheng,kongWang:kongWang,buildPillars:buildPillars,buildBirthTime:buildBirthTime,createBaziProfile:createBaziProfile,getFlowYearNumber:getFlowYearNumber,getFlowYearGZ:getFlowYearGZ,luckDirection:luckDirection,luckStartInfo:luckStartInfo,luckStartAge:luckStartAge,getFlowMonths:getFlowMonths,nearestMajorSolarTerm:nearestMajorSolarTerm,scoreWuxing:scoreWuxing,strengthScore:strengthScore,assessStrength:assessStrength,usefulElements:usefulElements,patternName:patternName,normalizePhenomenonName:normalizePhenomenonName,shenShaForPillar:shenShaForPillar,analyzePattern:analyzePattern,analyzeTemporalInteractions:analyzeTemporalInteractions,evaluateLuckImpact:evaluateLuckImpact,evaluateLuckOutlook:evaluateLuckOutlook,patternStructureRawScore:patternStructureRawScore,reweightPatternScore:reweightPatternScore,percentileFromHistogram:percentileFromHistogram,percentileRangeFromHistogram:percentileRangeFromHistogram,formatPatternPercentile:formatPatternPercentile,theoreticalGradeFromPercentile:theoreticalGradeFromPercentile,structureGradeFromScore:structureGradeFromScore,patternGradeIndexWithinGates:patternGradeIndexWithinGates,forEachLegalFourPillar:forEachLegalFourPillar,buildPatternLevelAudit:buildPatternLevelAudit,buildTheoreticalPatternBaseline:buildTheoreticalPatternBaseline,theoreticalBaseline:{version:THEORETICAL_BASELINE_VERSION,scoreModelVersion:PATTERN_SCORE_MODEL_VERSION,config:THEORETICAL_BASELINE_CONFIG,histogram:THEORETICAL_BASELINE_HISTOGRAM,stats:THEORETICAL_BASELINE_STATS}};
  root.BaziEngine=api;
  if(root.window)root.window.BaziEngine=api; // window.BaziEngine
})(typeof globalThis!=='undefined'?globalThis:this);
