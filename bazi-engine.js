(function(root){
  'use strict';

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
  var PATTERN_ENGINE_VERSION='BAZI-PATTERN-2026.07.14.2';
  var PATTERN_RULE_VERSION='ZP-2026.07.14.1';
  var THEORETICAL_BASELINE_VERSION='ZP-TB-1984-2044-D11-H12-v5';
  var PATTERN_SCORE_MODEL_VERSION='ZP-SCORE-2026.07.14-v2';
  var PATTERN_LEVELS=['偏低','中等','偏高','高','顶级'];
  var PATTERN_SCORE_DIMENSION_WEIGHTS={potential:20,formation:25,flow:20,clarity:15,remedy:15,balance:5};
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
  var THEORETICAL_BASELINE_CONFIG={start:'1984-02-04',endExclusive:'2044-02-04',stepDays:11,hours:[0,2,4,6,8,10,12,14,16,18,20,22],timezone:'Asia/Shanghai',referenceLongitude:120,trueSolarCorrection:false,deduplicate:'fourPillars'};
  var THEORETICAL_BASELINE_HISTOGRAM={23:9,24:18,25:1074,28:16,29:818,30:195,31:920,32:1,33:1356,34:654,35:541,36:110,37:2,38:5,39:434,40:76,41:84,42:17,43:184,44:27,45:12,46:75,47:149,48:58,49:167,50:47,51:177,52:44,53:906,54:636,55:505,56:63,57:513,58:657,59:296,60:94,61:368,62:1010,63:377,64:373,65:235,66:2253,67:614,68:188,69:206,70:41,71:513,72:788,73:199,74:253,75:2968,76:1001,77:66,78:84,79:17,80:182,81:27,83:133,84:18,86:756,87:183,89:123};
  var THEORETICAL_BASELINE_STATS={sampleCount:23916,uniqueCount:23916,duplicateCount:0,scoreRange:{min:23,max:89},mean:57.538133,standardDeviation:17.8332,quantiles:{p5:29,p20:34,p50:62,p80:75,p95:83},candidateGradeCounts:{偏低:1117,中等:3944,偏高:13297,高:4345,顶级:1213},gradeCounts:{偏低:1117,中等:3944,偏高:13869,高:3791,顶级:1195},gradePercentages:{偏低:4.67,中等:16.49,偏高:57.99,高:15.85,顶级:5},ruleVersion:'ZP-2026.07.14.1',engineVersion:'BAZI-PATTERN-2026.07.14.2',scoreModelVersion:'ZP-SCORE-2026.07.14-v2'};
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
    woodBlocksFire:{id:'ZP-QX-002',name:'木多火塞',aliases:['木多火炽'],category:'五行气象与生扶太过病象',type:'resourceExcess',target:'火',excess:'木',authority:'《渊海子平·论五行生克制化》“火赖木生，木多火炽”；《三命通会》以木多火塞校验印旺边界',definition:'木本能生火，但木势过重、火弱而缺少本根承接时，生扶转为壅塞，火难以舒展。',behavior:'信息、想法或准备材料不断增加而执行出口不足时，较容易反复筹备、启动偏慢；目标与截止条件清楚后会减轻。'},
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
    return {year:getYearGZ(t.year,t.month,t.day),month:getMonthGZ(t.year,t.month,t.day),day:day,hour:getHourGZ(day,t.hour)};
  }
  function scoreWuxing(pillars){
    var scores={木:0,火:0,土:0,金:0,水:0};
    Object.keys(pillars).forEach(function(k){
      var gz=pillars[k],s=gz[0],b=gz[1];
      scores[STEM_WX[s]]+=1;
      (HIDDEN[b]||[]).forEach(function(h,i){scores[STEM_WX[h]]+=i===0?0.7:(i===1?0.25:0.15)});
    });
    return scores;
  }
  var STRENGTH_WEIGHTS={yearStem:6,monthStem:10,hourStem:9,yearBranch:8,monthBranch:40,dayBranch:15,hourBranch:12};
  function hiddenRatios(count){
    if(count<=1)return [1];
    if(count===2)return [0.7,0.3];
    return [0.7,0.2,0.1];
  }
  function supportRatio(dayStem,stem){
    var dayWx=STEM_WX[dayStem],wx=STEM_WX[stem],resource=Object.keys(gen).find(function(k){return gen[k]===dayWx});
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
    return Object.keys(pillars).filter(function(k){return k!==key&&pillars[k][1]===BRANCH_CLASH[branch]}).length;
  }
  function branchesPunish(a,b,allBranches){
    if((a==='子'&&b==='卯')||(a==='卯'&&b==='子'))return true;
    if(a===b&&'辰午酉亥'.indexOf(a)>=0)return true;
    if(a!==b&&'寅巳申'.indexOf(a)>=0&&'寅巳申'.indexOf(b)>=0)return true;
    if(a!==b&&'丑未戌'.indexOf(a)>=0&&'丑未戌'.indexOf(b)>=0)return true;
    return false;
  }
  function branchAttackInfo(branch,pillars,key,interactions){
    var keys=['year','month','day','hour'],position=keys.indexOf(key),attackTypes=['冲','刑','害','破'],relations=[],suppressed=[];
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
  function rootEvidence(dayStem,pillars,interactions){
    var dayWx=STEM_WX[dayStem],labels={year:'年支',month:'月令',day:'日支',hour:'时支'},roots=[];
    Object.keys(pillars).forEach(function(k){
      var hidden=HIDDEN[pillars[k][1]]||[],idx=hidden.findIndex(function(s){return STEM_WX[s]===dayWx});
      if(idx<0)return;
      var grade=idx===0?'本气根':(idx===1?'中气根':'余气根');
      var attack=branchAttackInfo(pillars[k][1],pillars,k,interactions),suppressedText=attack.suppressed.length?'；另见'+attack.suppressed.join('、')+'，未按有效损根计':'';
      roots.push({position:k,branch:pillars[k][1],grade:grade,attacked:attack.reasons.length>0,attacks:attack.reasons,suppressedAttacks:attack.suppressed,text:labels[k]+pillars[k][1]+grade+(attack.reasons.length?'，受'+attack.reasons.join('、'):'')+suppressedText});
    });
    return roots;
  }
  function interactionAnalysis(pillars,scores){
    scores=scores||scoreWuxing(pillars);
    var keys=['year','month','day','hour'],stems=keys.map(function(k){return pillars[k][0]}),branches=keys.map(function(k){return pillars[k][1]});
    var total=WUXING.reduce(function(sum,w){return sum+(scores[w]||0)},0)||1,stemCombines=[],branchPairs=[],groups=[];
    function ratio(w){return (scores[w]||0)/total}
    function targetSupported(target,minRatio){
      var monthWx=BRANCH_WX[pillars.month[1]],targetRatio=ratio(target);
      return targetRatio>=minRatio&&(monthWx===target||gen[monthWx]===target||targetRatio>=0.4);
    }
    for(var i=0;i<4;i++)for(var j=i+1;j<4;j++){
      if(combineStem[stems[i]]===stems[j]){
        var pair=[stems[i],stems[j]].sort(function(a,b){return STEMS.indexOf(a)-STEMS.indexOf(b)}).join('');
        var target=({甲己:'土',乙庚:'金',丙辛:'水',丁壬:'木',戊癸:'火'})[pair]||'';
        stemCombines.push({left:i,right:j,pair:pair,target:target,distance:j-i,ruleId:'ZP-HC-01'});
      }
      if(BRANCH_CLASH[branches[i]]===branches[j])branchPairs.push({left:i,right:j,type:'冲',active:true,status:'相冲',priority:60,ruleId:'ZP-HC-04'});
      if(BRANCH_HARM[branches[i]]===branches[j])branchPairs.push({left:i,right:j,type:'害',active:true,status:'相害',priority:30,ruleId:'ZP-HC-05'});
      if(BRANCH_BREAK[branches[i]]===branches[j])branchPairs.push({left:i,right:j,type:'破',active:true,status:'相破',priority:20,ruleId:'ZP-HC-06'});
      if(branchesPunish(branches[i],branches[j],branches))branchPairs.push({left:i,right:j,type:'刑',active:true,status:'相刑',priority:40,ruleId:'ZP-HC-05'});
      var sixKey=branches[i]!==branches[j]&&Object.keys(SIX_COMBINE_TARGET).find(function(k){return k.indexOf(branches[i])>=0&&k.indexOf(branches[j])>=0});
      if(sixKey){
        var sixTarget=SIX_COMBINE_TARGET[sixKey];
        branchPairs.push({left:i,right:j,type:'六合',target:sixTarget,active:true,status:'待裁决',priority:50,ruleId:'ZP-HC-03'});
      }
    }
    var stemUse={};
    stemCombines.forEach(function(item){stemUse[item.left]=(stemUse[item.left]||0)+1;stemUse[item.right]=(stemUse[item.right]||0)+1});
    stemCombines.forEach(function(item){
      item.contested=stemUse[item.left]>1||stemUse[item.right]>1;
      var transform=!!(item.target&&targetSupported(item.target,0.3));
      if(item.contested){item.status='争合受阻';item.effect='contest';item.active=true}
      else if(transform){item.status='合化有据';item.effect='transform';item.active=true}
      else if(item.left===2||item.right===2){item.status='日主合入';item.effect='daymaster-combine';item.active=true}
      else if(item.distance===1){item.status='合绊';item.effect='bind';item.active=true}
      else{item.status='遥合';item.effect='clue';item.active=false}
      item.text=item.pair+(item.target?'化'+item.target:'')+'：'+item.status;
    });
    THREE_MEETINGS.concat(THREE_GROUPS).forEach(function(group){
      var members=group.members.split(''),positions=members.map(function(b){return branches.indexOf(b)}),present=members.filter(function(b){return branches.indexOf(b)>=0});
      if(present.length===3){
        var supported=BRANCH_WX[pillars.month[1]]===group.element||ratio(group.element)>=0.34;
        var externalClashes=branchPairs.filter(function(item){return item.type==='冲'&&((positions.indexOf(item.left)>=0&&positions.indexOf(item.right)<0)||(positions.indexOf(item.right)>=0&&positions.indexOf(item.left)<0))});
        var status=supported?(externalClashes.length?'成局有瑕':'成局有力'):(externalClashes.length?'成局受冲':'成局待验');
        groups.push({name:group.name,members:group.members,positions:positions,element:group.element,status:status,complete:true,active:supported,challenged:externalClashes.length>0,clashes:externalClashes.map(function(item){return branches[item.left]+branches[item.right]+'冲'}),priority:/三会/.test(group.name)?80:70,ruleId:/三会/.test(group.name)?'ZP-HC-02A':'ZP-HC-02B',text:group.name+'：'+status+(externalClashes.length?'（'+externalClashes.map(function(item){return branches[item.left]+branches[item.right]+'冲'}).join('、')+'）':'')});
      }else if(present.length===2){
        groups.push({name:group.name.replace('三','半'),members:group.members,positions:present.map(function(b){return branches.indexOf(b)}),element:group.element,status:'线索',complete:false,active:false,priority:10,ruleId:/三会/.test(group.name)?'ZP-HC-02A':'ZP-HC-02B',text:present.join('')+'见'+group.name.replace('三','半')+'线索'});
      }
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
    var arbitration={ruleIds:['ZP-HC-01','ZP-HC-02A','ZP-HC-02B','ZP-HC-03','ZP-HC-04','ZP-HC-05','ZP-HC-06'],principles:['先核天干是否专一合化，再辨争合妒合','完整三会、三合成局优先于单一六合，半会半合只作线索','合中逢冲时保留冲合并见，不以一字之合静默解冲','刑害破只按裁决后仍有效的关系反馈根气'],decisions:unique(decisions),text:decisions.length?unique(decisions).join('；'):'未见需要改变原始关系的合冲先后裁决'};
    return {natalStems:stems,natalBranches:branches,stemCombines:stemCombines,branchPairs:branchPairs,groups:groups,arbitration:arbitration};
  }
  function strengthScore(dayStem,pillars){
    var parts=[],support=0,interactions=interactionAnalysis(pillars);
    function add(label,weight,ratio,key){
      var attack=key?branchAttackInfo(pillars[key][1],pillars,key,interactions):{reasons:[],penalty:0};
      var adjusted=ratio*(1-attack.penalty);
      var score=weight*adjusted;
      support+=score;
      parts.push({label:label,weight:weight,score:Math.round(score*10)/10,ratio:Math.round(adjusted*100)/100,attacked:attack.reasons.length>0,attacks:attack.reasons});
    }
    add('年干',STRENGTH_WEIGHTS.yearStem,supportRatio(dayStem,pillars.year[0]));
    add('月干',STRENGTH_WEIGHTS.monthStem,supportRatio(dayStem,pillars.month[0]));
    add('时干',STRENGTH_WEIGHTS.hourStem,supportRatio(dayStem,pillars.hour[0]));
    add('年支',STRENGTH_WEIGHTS.yearBranch,branchSupportRatio(dayStem,pillars.year[1]),'year');
    add('月令',STRENGTH_WEIGHTS.monthBranch,branchSupportRatio(dayStem,pillars.month[1]),'month');
    add('日支',STRENGTH_WEIGHTS.dayBranch,branchSupportRatio(dayStem,pillars.day[1]),'day');
    add('时支',STRENGTH_WEIGHTS.hourBranch,branchSupportRatio(dayStem,pillars.hour[1]),'hour');
    var dayWx=STEM_WX[dayStem],resource=resourceElement(dayWx),interactionAdjustment=0;
    interactions.groups.filter(function(x){return x.complete&&x.active}).forEach(function(group){
      var factor=group.status==='成局有力'?1:0.5;
      if(group.element===dayWx)interactionAdjustment+=6*factor;
      else if(group.element===resource)interactionAdjustment+=4*factor;
    });
    support+=interactionAdjustment;
    var command=parts.find(function(x){return x.label==='月令'}),roots=rootEvidence(dayStem,pillars,interactions);
    var rootScore=parts.filter(function(x){return /支|月令/.test(x.label)&&x.label!=='月令'}).reduce(function(sum,x){return sum+x.score},0);
    var momentum=parts.filter(function(x){return /干/.test(x.label)}).reduce(function(sum,x){return sum+x.score},0);
    var rootState=!roots.length?'未见同类根气':(roots.some(function(x){return x.attacked})?'有根但受冲刑害破':'根气可用');
    var momentumState=momentum>=10?'天干印比帮扶有力':(momentum>0?'天干印比有助，但助力有限':'天干未见印比相助');
    var evidence=[
      '得令：'+(command.score>=20?'得令有力':(command.score>0?'月令有生扶':'月令不扶')),
      '得地：'+rootState+(roots.length?'（'+roots.map(function(x){return x.text}).join('、')+'）':''),
      '得势：'+momentumState+(interactionAdjustment?'，另有合会成局助势':'')
    ];
    var confidence=roots.some(function(x){return x.attacked})?'中':'高';
    return {support:Math.round(Math.min(100,support)*10)/10,total:100,parts:parts,dimensions:{command:{score:command.score,max:40},roots:{score:Math.round(rootScore*10)/10,items:roots},momentum:{score:Math.round(momentum*10)/10,interactionAdjustment:interactionAdjustment}},interactions:interactions,confidence:confidence,evidence:evidence};
  }
  function assessStrength(dayStem,pillarsOrMonthBranch,scores){
    if(pillarsOrMonthBranch&&typeof pillarsOrMonthBranch==='object'&&pillarsOrMonthBranch.month){
      var weighted=strengthScore(dayStem,pillarsOrMonthBranch),value=weighted.support;
      if(value>=65)return '强';
      if(value>=55)return '偏强';
      if(value>=42)return '中和';
      if(value>=30)return '偏弱';
      return '弱';
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
    var use=primary.slice(0,1),patternUse=unique(pattern.use||[]),restrained=unique(pattern.restrainedUse||[]),assistant=unique(patternUse.concat(primary.slice(1))).filter(function(w){return use.indexOf(w)<0&&restrained.indexOf(w)<0});
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
  function seasonTune(dayStem,monthBranch,scores){
    scores=scores||{};
    var total=WUXING.reduce(function(sum,w){return sum+(scores[w]||0)},0)||1;
    function ratio(w){return (scores[w]||0)/total}
    var dayWx=STEM_WX[dayStem],result={use:[],avoid:[],priority:'参考',condition:'未见明显寒暖燥湿偏枯',why:'调候不作首要。'};
    if('亥子丑'.indexOf(monthBranch)>=0){
      var cold=ratio('水')>=0.35&&ratio('火')<0.16;
      result={use:['火','木'],avoid:['水'],priority:cold?'主用':'佐用',condition:cold?'水旺火弱，寒湿偏重':'冬令但原局仍见暖气',why:(cold?'寒湿已成偏枯，火为调候主用，木作火源。':'冬令取火木作调候佐用，不越过格局与扶抑。')};
    }else if('巳午未'.indexOf(monthBranch)>=0){
      var hot=ratio('火')>=0.35&&ratio('水')<0.12;
      result={use:['水','金'],avoid:['火'],priority:hot?'主用':'佐用',condition:hot?'火旺水弱，燥热偏重':'夏令但原局仍有润气',why:(hot?'燥热已成偏枯，水为调候主用，金作水源。':'夏令取水金作调候佐用，不越过格局与扶抑。')};
    }else if('申酉戌'.indexOf(monthBranch)>=0){
      var dry=ratio('金')>=0.28&&ratio('水')<0.12;
      result={use:dayWx==='木'?['水','火']:['火','木'],avoid:['金'],priority:dry?'佐用':'参考',condition:dry?'金旺水弱，燥气明显':'秋令燥气未成偏枯',why:dry?'秋燥明显，以水润燥、火制金为调候辅助。':'秋令只保留火木调候参考。'};
    }else if('寅卯辰'.indexOf(monthBranch)>=0){
      var damp=ratio('木')>=0.3&&ratio('火')<0.12;
      result={use:['火','土'],avoid:['木'],priority:damp?'佐用':'参考',condition:damp?'木旺火弱，湿滞不化':'春令生发尚能流通',why:damp?'春木湿滞，取火发荣、土承载为调候辅助。':'春令只保留火土调候参考。'};
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
    var keys=['year','month','day','hour'];
    var earthStems=['year','month','hour'].filter(function(k){return STEM_WX[pillars[k][0]]==='土'});
    var earthBranches=keys.filter(function(k){return BRANCH_WX[pillars[k][1]]==='土'});
    var waterStems=['year','month','hour'].filter(function(k){return STEM_WX[pillars[k][0]]==='水'});
    var woodStems=['year','month','hour'].filter(function(k){return STEM_WX[pillars[k][0]]==='木'});
    var roots=weightedStrength&&weightedStrength.dimensions&&weightedStrength.dimensions.roots.items||rootEvidence(dayStem,pillars);
    var usableRoot=roots.some(function(item){return !item.attacked&&item.grade!=='余气根'});
    var constrainedRoot=!usableRoot;
    var seasonElement=BRANCH_WX[pillars.month[1]],seasonFeedsEarth=seasonElement==='火'||seasonElement==='土';
    var supportedEarth=earthStems.length>=1||earthBranches.length>=2;
    var qualifies=earthRatio>=0.42&&metalRatio<=0.2&&earthMetalRatio>=2.5&&constrainedRoot&&supportedEarth&&(seasonFeedsEarth||earthRatio>=0.48);
    if(!qualifies)return out;
    var severe=earthRatio>=0.62&&earthMetalRatio>=3.5&&!usableRoot&&!waterStems.length&&!woodStems.length;
    var obvious=earthRatio>=0.44&&earthMetalRatio>=2.8;
    var evidence=[
      '土约占全局'+Math.round(earthRatio*100)+'%，金约占'+Math.round(metalRatio*100)+'%，土势约为金的'+Math.round(earthMetalRatio*10)/10+'倍',
      (earthStems.length?'土在'+earthStems.map(function(k){return ({year:'年干',month:'月干',hour:'时干'})[k]+pillars[k][0]}).join('、')+'透出':'土虽未透干')+'，'+(earthBranches.length?earthBranches.map(function(k){return ({year:'年支',month:'月支',day:'日支',hour:'时支'})[k]+pillars[k][1]}).join('、')+'增土':'地支土气有限'),
      seasonFeedsEarth?pillars.month[1]+'月'+seasonElement+'气生扶或助旺土势':'月令未直接助土，但全局土势仍过重',
      dayStem+'金日主'+strength+'，'+(roots.length?roots.map(function(item){return item.text}).join('、'):'未见直接根气')
    ];
    var counterEvidence=[];
    if(roots.length)counterEvidence.push(dayStem+'金仍见'+roots.map(function(item){return item.text}).join('、'));
    if(waterStems.length)counterEvidence.push(waterStems.map(function(k){return pillars[k][0]+'水透'+({year:'年干',month:'月干',hour:'时干'})[k]}).join('、')+'，泄秀通道未绝');
    else if(water/total>=0.14)counterEvidence.push('原局水气尚存，可作润泄线索');
    if(woodStems.length)counterEvidence.push(woodStems.map(function(k){return pillars[k][0]+'木透'+({year:'年干',month:'月干',hour:'时干'})[k]}).join('、')+'，有疏土线索');
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
    var keys=['year','month','day','hour'],visibleKeys=['year','month','hour'],labels={year:'年',month:'月',day:'日',hour:'时'};
    var excessStems=visibleKeys.filter(function(k){return STEM_WX[pillars[k][0]]===rule.excess});
    var excessBranches=keys.filter(function(k){return BRANCH_WX[pillars[k][1]]===rule.excess});
    var peerStems=visibleKeys.filter(function(k){return STEM_WX[pillars[k][0]]===rule.target});
    var roots=weightedStrength&&weightedStrength.dimensions&&weightedStrength.dimensions.roots.items||rootEvidence(dayStem,pillars);
    var usableRoot=roots.some(function(item){return !item.attacked&&item.grade!=='余气根'});
    var mainRoot=roots.some(function(item){return !item.attacked&&item.grade==='本气根'});
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
    var keys=['year','month','day','hour'],visibleKeys=['year','month','hour'];
    var excessStems=visibleKeys.filter(function(k){return STEM_WX[pillars[k][0]]===rule.excess});
    var excessBranches=keys.filter(function(k){return BRANCH_WX[pillars[k][1]]===rule.excess});
    var peerStems=visibleKeys.filter(function(k){return STEM_WX[pillars[k][0]]===rule.target});
    var resource=resourceElement(rule.target),resourceStems=visibleKeys.filter(function(k){return STEM_WX[pillars[k][0]]===resource});
    var roots=weightedStrength&&weightedStrength.dimensions&&weightedStrength.dimensions.roots.items||rootEvidence(dayStem,pillars);
    var usableRoot=roots.some(function(item){return !item.attacked&&item.grade!=='余气根'}),constrainedRoot=!usableRoot;
    var seasonElement=BRANCH_WX[pillars.month[1]],seasonSupportsExcess=seasonElement===rule.excess;
    var supportedExcess=excessStems.length>=1||excessBranches.length>=2;
    var weakByEvidence=/弱/.test(strength)||targetRatio<=0.16;
    var qualifies=excessRatio>=0.42&&targetRatio<=0.23&&excessTargetRatio>=2.4&&constrainedRoot&&supportedExcess&&weakByEvidence&&(seasonSupportsExcess||excessRatio>=0.52);
    if(!qualifies)return out;
    var severe=excessRatio>=0.62&&excessTargetRatio>=3.5&&!usableRoot&&!peerStems.length;
    var obvious=excessRatio>=0.48&&excessTargetRatio>=2.8;
    var labels={year:'年',month:'月',day:'日',hour:'时'};
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
  function patternUseElements(dayWx,mainPattern){
    var resource=resourceElement(dayWx),output=gen[dayWx],wealth=ctrl[dayWx],officer=officerElement(dayWx);
    if(/从格：从(?:杀|官|官杀)格/.test(mainPattern))return {use:[officer,wealth],avoid:[resource,dayWx,output],why:'从官杀之势成格，顺从官杀旺势，取财生官杀，忌印比扶身及食伤逆制官杀破从。'};
    if(/从格：从财格/.test(mainPattern))return {use:[wealth,output],avoid:[resource,dayWx,officer],why:'从财成格，顺从财势，取食伤生财，忌印比扶身、比劫分财及官杀泄财破从。'};
    if(/从格：从儿格/.test(mainPattern))return {use:[output,wealth],avoid:[resource,dayWx],why:'从儿成格，顺从食伤泄秀，喜财星承接，忌印星回克食伤。'};
    if(/化气格/.test(mainPattern)){
      var transformed=(mainPattern.match(/化气格：..化([木火土金水])/)||[])[1];
      var transformUse=unique([transformed,resourceElement(transformed)]),transformAvoid=unique([officerElement(transformed)].concat(dayWx!==transformed&&transformUse.indexOf(dayWx)<0?[dayWx]:[]));
      return {use:transformUse,avoid:transformAvoid,why:'化气成格，顺化神旺势，兼取生助化神之气，忌克破化神或还原日主之气破化。'};
    }
    if(/专旺格/.test(mainPattern))return {use:[dayWx,resource,output],avoid:[officer,wealth],why:'专旺成格，顺日主一方旺势，兼取食伤泄秀出口，忌官杀财星逆势破格。'};
    if(/伤官见官/.test(mainPattern))return {use:[resource,wealth],avoid:[output],why:'先看印星制伤、财星通关，避免伤官与官星直接相战。'};
    if(/财多身弱/.test(mainPattern))return {use:[resource,dayWx],avoid:[wealth,output],why:'财星太重而身弱，先取印比扶身承财。'};
    if(/食伤混杂/.test(mainPattern))return {use:[wealth,resource],avoid:[output],why:'食神伤官混杂，先看财星流通或印星制化，忌再增食伤。'};
    if(/财官印相生/.test(mainPattern))return {use:[wealth,officer,resource],avoid:[output],why:'格局重财官印顺生，忌食伤破官过重。'};
    if(/杀印相生|官印相生/.test(mainPattern))return {use:[resource,dayWx],avoid:[wealth,output],why:'格局以印化官杀、生扶日主为核心。'};
    if(/食神制杀/.test(mainPattern))return {use:[output,resource],avoid:[wealth],why:'格局以食神制杀为主，兼看印星护身。'};
    if(/羊刃驾杀/.test(mainPattern))return {use:[officer,wealth],avoid:[resource,dayWx],why:'格局以七杀制刃为主，喜财生杀，忌印比再助羊刃。'};
    if(/伤官配印/.test(mainPattern))return {use:[resource],avoid:[wealth],why:'格局以印制伤、护身清局为核心。'};
    if(/食神生财/.test(mainPattern))return {use:[output,wealth],avoid:[resource],why:'格局以食神泄秀、生财承接为核心，忌枭印直接夺食。'};
    if(/伤官生财/.test(mainPattern))return {use:[output,wealth],avoid:[resource],why:'格局以食伤生财、流通成事为核心。'};
    if(/官杀混杂|杀重混官/.test(mainPattern))return {use:[resource,dayWx],avoid:[wealth,output],why:'先清官杀混杂，再取印比化杀扶身。'};
    return {use:[],avoid:[],why:'未见可单独定用的成格组合，先按扶抑与调候。'};
  }
  function applyPatternConflictUse(dayWx,pattern,arbitration){
    var main=arbitration&&arbitration.main,conflictNames=main&&main.conflicts?main.conflicts.map(function(x){return x.name}):[];
    if(/食神制杀/.test(main&&main.name||'')&&conflictNames.indexOf('枭神夺食')>=0){
      var resource=resourceElement(dayWx),output=gen[dayWx],wealth=ctrl[dayWx];
      pattern.use=unique(pattern.use.filter(function(w){return w!==resource}).concat([output,wealth]));
      pattern.avoid=unique(pattern.avoid.filter(function(w){return w!==wealth&&w!==resource}));
      pattern.specificUse=['食神','正财','偏财'];
      pattern.specificAvoid=['偏印'];
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
  function specificUsefulDecision(dayStem,primary,secondary,avoid,context,pattern){
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
    function active(god){var item=profiles[god]||{};return !!(item.revealed||item.monthCommand||item.roots)}
    function items(elements,preferredGods,role){
      return unique(elements).map(function(element){
        var possible=godNamesForElement(dayStem,element),chosen=preferredGods.filter(function(god){return possible.indexOf(god)>=0&&active(god)});
        var clearChosen=chosen.filter(function(god){var item=profiles[god]||{};return item.revealed||item.monthCommand});
        if(clearChosen.length)chosen=clearChosen;
        if(!chosen.length)chosen=possible.filter(active);
        if(!chosen.length)chosen=preferredGods.filter(function(god){return possible.indexOf(god)>=0});
        if(!chosen.length)chosen=possible;
        var present=chosen.some(active),clear=chosen.some(function(god){var item=profiles[god]||{};return item.revealed||item.monthCommand});
        var rooted=chosen.some(function(god){return ((profiles[god]||{}).roots||0)>0});
        return {element:element,tenGods:unique(chosen),stems:unique(STEMS.filter(function(stem){return chosen.indexOf(tenGod(dayStem,stem))>=0})),present:present,state:clear?'透清或得令':(rooted?'有根未透':(present?'原局有据':'待运补入')),role:role,reason:role==='主用'?'承接当前最高优先层':'结合原局根透与主格关系'};
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
  function usefulElements(dayStem,strength,context){
    context=context||{};
    var dayWx=STEM_WX[dayStem],resource=resourceElement(dayWx),output=gen[dayWx],wealth=ctrl[dayWx],officer=officerElement(dayWx);
    var phenomena=context.elementPhenomena||[],activePhenomenon=phenomena[0],earthBuriedMetal=phenomena.find(function(item){return item.ruleId==='ZP-QX-001'});
    var fuyi;
    if(strength.indexOf('弱')>=0)fuyi={use:[resource,dayWx],avoid:[output,wealth],why:'日主偏弱，先看印比扶身。'};
    else if(strength.indexOf('强')>=0)fuyi={use:[output,wealth,officer],avoid:[resource,dayWx],why:'日主偏强，先看泄耗制化。'};
    else fuyi={use:[output,wealth],avoid:[resource],why:'日主接近中和，取流通与成事之气。'};
    if(earthBuriedMetal){
      fuyi.use=unique(fuyi.use.filter(function(w){return w!=='土'}).concat(earthBuriedMetal.useCorrection.primary));
      fuyi.avoid=unique(fuyi.avoid.concat(earthBuriedMetal.useCorrection.restrain));
      fuyi.why='日主金气受厚土包裹，常规印比扶身须拆开判断：取金助身，印土已有且过量，不宜再增。';
    }else if(activePhenomenon){
      fuyi.use=activePhenomenon.useCorrection.primary.slice();
      fuyi.avoid=unique(fuyi.avoid.concat(activePhenomenon.useCorrection.restrain));
      fuyi.why=activePhenomenon.name+'显示'+(activePhenomenon.category==='五行气象与生扶太过病象'?'印星生扶太过':'食伤泄身太过')+'，先取'+activePhenomenon.useCorrection.primary.join('、')+'恢复日主承载，不再增加'+activePhenomenon.useCorrection.restrain.join('、')+'。';
    }
    var tiaohou=seasonTune(dayStem,context.monthBranch||'',context.scores||{});
    var pattern=patternUseElements(dayWx,context.mainPattern||'');
    if(!pattern.use.length&&context.regularPattern&&context.regularPattern.formed){
      pattern=regularPatternUseElements(dayWx,context.regularPattern);
    }else if(!pattern.use.length&&context.regularPattern){
      pattern.why=context.regularPattern.name+context.regularPattern.status+'，不另立格局用神；'+
        (context.regularPattern.rescues.length?'先落实'+context.regularPattern.rescues.join('、'):'先按扶抑承接月令主线')+'。';
    }
    pattern=applyPatternConflictUse(dayWx,pattern,context.patternArbitration);
    if(earthBuriedMetal){
      pattern.restrainedUse=unique((pattern.restrainedUse||[]).concat(earthBuriedMetal.useCorrection.restrain));
      pattern.why+=' 印土在格局中承担化杀功能，但原局已经过重并见'+earthBuriedMetal.name+'，只能认其已有功能，不再把土列为增补用神。';
    }else if(activePhenomenon){
      pattern.restrainedUse=unique((pattern.restrainedUse||[]).concat(activePhenomenon.useCorrection.restrain));
      pattern.why+=' 原局另见'+activePhenomenon.name+'，'+(activePhenomenon.category==='五行气象与生扶太过病象'?'印星虽有生扶功能但已经过量':'食伤虽可能承担泄秀或制化功能但已经过量')+'，只认其已有作用，不再追加'+activePhenomenon.useCorrection.restrain.join('、')+'。';
    }
    var special=/从格：|化气格：|专旺格/.test(context.mainPattern||'');
    if(special){
      var specialPrimary=unique(pattern.use),specialAvoid=unique(pattern.avoid);
      var validationLayers={fuyi:fuyi,tiaohou:tiaohou};
      var validationOnly={use:[],avoid:[],priority:'真假校验',why:'特殊格已严格成立，本层只保留为真假校验，不单独提出相反喜用。'};
      var specialRoles=buildUsefulRoles(dayStem,specialPrimary,[],specialAvoid,{tiaohou:validationOnly,pattern:pattern,fuyi:validationOnly,monthBranch:context.monthBranch,monthGod:context.monthGod,monthCommandStem:context.monthCommandStem});
      var specialKind=/化气格：/.test(context.mainPattern||'')?'化神':(/从格：/.test(context.mainPattern||'')?'所从之神':'旺神');
      function specialItem(element,label){return {element:element,tenGods:[label],stems:STEMS.filter(function(stem){return STEM_WX[stem]===element}),state:'特殊格语境'}}
      var specialSpecific={primary:specialPrimary.map(function(element,index){return specialItem(element,index===0?specialKind:'生助'+specialKind)}),secondary:[],avoid:specialAvoid.map(function(element){return specialItem(element,'破坏'+specialKind)})};
      specialRoles.monthCommandGod=usefulRole(dayStem,[]);
      specialRoles.patternGod.tenGods=[specialKind];
      specialRoles.assistantGod.tenGods=specialPrimary.length>1?['生助'+specialKind]:[];
      specialRoles.balanceGod=usefulRole(dayStem,[]);
      specialRoles.climateGod=usefulRole(dayStem,[]);
      specialRoles.finalUseGod.tenGods=[specialKind];
      specialRoles.useGod=specialRoles.finalUseGod;
      specialRoles.avoidGod.tenGods=specialAvoid.length?['破坏'+specialKind]:[];
      return {
        use:specialPrimary,
        avoid:specialAvoid,
        why:'格局：'+pattern.why+' 特殊格局成立，扶抑与调候仅作校验，不并入总用神。',
        primaryUse:specialPrimary,secondaryUse:[],roles:specialRoles,
        layers:{fuyi:Object.assign({},validationOnly),tiaohou:Object.assign({},validationOnly),pattern:pattern},validationLayers:validationLayers,specific:specialSpecific,
        arbitration:{type:'顺势',text:'特殊格局成立，格局顺势优先；扶抑与调候只作真假校验。',source:'格局',conflicts:[]}
      };
    }
    var allUse=unique(pattern.use.concat(fuyi.use));
    if(strength.indexOf('弱')>=0){
      allUse=unique(allUse.concat(tiaohou.use.filter(function(w){return w===resource||w===dayWx})));
    }else{
      allUse=unique(allUse.concat(tiaohou.use));
    }
    var phenomenonSecondary=[];
    if(activePhenomenon){
      allUse=unique(activePhenomenon.useCorrection.primary.concat(activePhenomenon.useCorrection.secondary));
      phenomenonSecondary=activePhenomenon.useCorrection.secondary.slice();
    }
    var avoidCandidates=unique(pattern.avoid.concat(fuyi.avoid,tiaohou.avoid,activePhenomenon?activePhenomenon.useCorrection.restrain.concat(activePhenomenon.useCorrection.avoid):[])).filter(function(w){return phenomenonSecondary.indexOf(w)<0});
    var disease=/官杀混杂|伤官见官|财多身弱|食伤混杂/.test(context.mainPattern||'')||!!activePhenomenon,primary,type,source,priorityText;
    if(earthBuriedMetal){primary=earthBuriedMetal.useCorrection.primary.slice();type='病药';source='气势病象';priorityText=earthBuriedMetal.name+'已达到'+earthBuriedMetal.status+'，先解除印土壅滞；格局中的印土认作已有功能，但不再追加。'}
    else if(activePhenomenon){primary=activePhenomenon.useCorrection.primary.slice();type='病药';source='气势病象';priorityText=activePhenomenon.name+'已达到'+activePhenomenon.status+'，'+(activePhenomenon.category==='五行气象与生扶太过病象'?'先处理印星生扶太过与承载不足':'先处理食伤泄身太过')+'，再判断原有格局作用能否承接。'}
    else if(pattern.use.length&&(disease||(context.patternArbitration&&context.patternArbitration.main))){primary=unique(pattern.use);type=disease?'病药':'格局';source='格局';priorityText=disease?'格局病药为先，先处理破格病点，再让扶抑与调候服从病药。':'格局主线已经成立，先守成格用神与相神。'}
    else if(/弱|强/.test(strength)){primary=unique(fuyi.use);type='扶抑';source='扶抑';priorityText='原局旺衰偏枯，先以扶抑取得承载能力。'}
    else if(tiaohou.priority==='主用'){primary=unique(tiaohou.use);type='调候';source='调候';priorityText='寒暖燥湿达到偏枯，调候提升为主用。'}
    else{primary=unique(fuyi.use);type='流通';source='扶抑';priorityText='原局不偏枯，取流通成事之气。'}
    var conditionalUse=[];
    var conflicts=allUse.filter(function(w){return avoidCandidates.indexOf(w)>=0}).map(function(w){
      var conditional=w===dayWx&&strength.indexOf('弱')>=0&&fuyi.use.indexOf(w)>=0&&primary.indexOf(w)<0;
      if(conditional)conditionalUse.push({element:w,benefit:'可扶助日主并增强行动承载',risk:'同类比劫同时可能分财，合作、朋友往来与现金边界须清楚'});
      return {element:w,decision:primary.indexOf(w)>=0?'取':(conditional?'条件取':'不取'),why:primary.indexOf(w)>=0?source+'层优先，保留为主用':(conditional?'扶抑层可助身发用，但格局或调候层同时见忌，属于喜中带忌，不作纯喜或纯忌':'非优先层虽提出喜用，但同时触及忌神，降为不取')};
    });
    if(earthBuriedMetal){
      conflicts.push({element:'土',decision:'不取',why:'印土虽能化杀生身，但原局已过量并形成'+earthBuriedMetal.name+'，由用转病，不宜再增'});
      phenomenonSecondary.forEach(function(w){conflicts.push({element:w,decision:'佐',why:'只作润泄佐用，须服从金日主承载，不作为首用'})});
    }else if(activePhenomenon){
      activePhenomenon.useCorrection.restrain.forEach(function(w){conflicts.push({element:w,decision:'不取',why:'该五行已形成'+activePhenomenon.name+'，'+(activePhenomenon.category==='五行气象与生扶太过病象'?'由正常生扶转为壅滞':'由正常泄秀转为泄身太过')+'，不宜再增'})});
    }
    var conditionalElements=conditionalUse.map(function(x){return x.element});
    var avoid=avoidCandidates.filter(function(w){return primary.indexOf(w)<0&&conditionalElements.indexOf(w)<0});
    var secondary=allUse.filter(function(w){return primary.indexOf(w)<0&&avoid.indexOf(w)<0});
    var arbitration={type:type,text:priorityText,source:source,conflicts:conflicts};
    var specific=specificUsefulDecision(dayStem,primary,secondary,avoid,context,pattern);
    return {use:unique(primary.concat(secondary)),primaryUse:primary,secondaryUse:secondary,conditionalUse:conditionalUse,avoid:avoid,roles:buildUsefulRoles(dayStem,primary,secondary,avoid,{tiaohou:tiaohou,pattern:pattern,fuyi:fuyi,monthBranch:context.monthBranch,monthGod:context.monthGod,monthCommandStem:context.monthCommandStem}),specific:specific,arbitration:arbitration,why:'主用：'+primary.join('、')+'；佐用：'+(secondary.join('、')||'无')+(conditionalUse.length?'（其中'+conditionalUse.map(function(x){return x.element+'喜中带忌'}).join('、')+'）':'')+'。 仲裁：'+type+'优先。 扶抑：'+fuyi.why+' 调候（'+tiaohou.priority+'）：'+tiaohou.why+' 格局：'+pattern.why,layers:{fuyi:fuyi,tiaohou:tiaohou,pattern:pattern}};
  }
  function solarTermDate(year,index){
    return new Date(Date.UTC(1900,0,6,2,5)+31556925974.7*(year-1900)+SOLAR_TERM_MINUTES[index]*60000);
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
    (interactions&&interactions.groups||[]).filter(function(group){return grave&&group.complete&&group.members.indexOf(branch)>=0}).forEach(function(group){
      var stem=hidden.find(function(item){return STEM_WX[item]===group.element});
      if(stem)groupStems.push(stem);
    });
    var clearStems=unique(revealed.concat(groupStems)),selected=grave&&clearStems.length?clearStems:[grave&&commander&&hidden.indexOf(commander.stem)>=0?commander.stem:baseStem];
    var ambiguous=grave&&selected.length>1,primaryStem=(ambiguous&&commander&&selected.indexOf(commander.stem)>=0?commander.stem:selected[0])||baseStem;
    var status=!grave?'本气主令':(!clearStems.length?(commander?'杂气按司令立主线':'杂气未透，以本气立主线'):(ambiguous?'杂气兼用待清':'杂气取清'));
    var basis;
    if(!grave)basis='月令'+branch+'以本气'+baseStem+'为主令。';
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
  function regularPatternAssessment(dayStem,pillars,monthGod,profiles,strength,monthCommand){
    var name=patternName(dayStem,pillars.month[1],monthCommand&&monthCommand.primaryStem),issues=[],rescues=[],basis=[],checks=[],formed=false,ready=false,authority=authorityRuleForGod(monthGod);
    if(name==='月劫用事')authority=authorityRuleForGod('比肩');
    var weak=/弱/.test(strength),strong=/强/.test(strength);
    var wealthForce=anyGodForce(profiles,['正财','偏财']),wealthClear=anyGodClear(profiles,['正财','偏财']);
    var officerForce=godForce(profiles,'正官'),officerClear=godClear(profiles,'正官');
    var sevenForce=godForce(profiles,'七杀'),sevenClear=godClear(profiles,'七杀');
    var sealForce=anyGodForce(profiles,['正印','偏印']),sealClear=anyGodClear(profiles,['正印','偏印']);
    var outputForce=anyGodForce(profiles,['食神','伤官']),outputClear=anyGodClear(profiles,['食神','伤官']);
    var foodForce=godForce(profiles,'食神'),foodClear=godClear(profiles,'食神');
    var hurtForce=godForce(profiles,'伤官'),hurtClear=godClear(profiles,'伤官');
    var biForce=anyGodForce(profiles,['比肩','劫财']),biClear=anyGodClear(profiles,['比肩','劫财']);
    var mixed=officerForce&&sevenForce;
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
      ready=wealthForce&&(wealthClear||officerClear||outputClear)&&(!weak||sealClear||biClear);
      check('立格','财星当令',true,'月令取'+monthGod);
      check('成格','财星有根或透清',wealthForce&&wealthClear,'财星须得令并能落实');
      check('成格','身能任财或有印比承财',!weak||sealClear||biClear,weak?'日主偏弱，须印比承接':'日主具承财条件');
      check('破格','比劫夺财而无官护',biForce&&!officerClear,'比劫有力时须见官星护财');
      check('救应','官护、食伤生财或印比扶身',officerClear||outputClear||sealClear||biClear,'按原局实际承接判断');
      if(weak&&!sealClear&&!biClear)add(issues,'日主偏弱，身不任财');
      if(biForce&&!officerClear)add(issues,'比劫有力，财星缺官护');
      if(officerClear)add(rescues,'官星护财');
      if(outputClear)add(rescues,'食伤生财');
      if(sealClear||biClear)add(rescues,'印比扶身承财');
    }else if(monthGod==='正官'){
      basis.push('正官当令');
      ready=officerForce&&!mixed&&(sealClear||wealthClear)&&(!weak||sealClear);
      check('立格','正官当令',true,'月令取正官');
      check('成格','官星有力而清',officerForce&&!mixed,'官杀不混方清');
      check('成格','财生或印护',sealClear||wealthClear,'正官喜财印相辅');
      check('破格','伤官见官、官杀混杂或官重身轻',hurtClear||mixed||(weak&&!sealClear),'见其一即损官格');
      check('救应','印护官生身或财星生官',sealClear||wealthClear,'须能落实到原局');
      if(mixed)add(issues,'官杀混杂，清浊未分');
      if(hurtClear)add(issues,'伤官见官');
      if(weak&&!sealClear)add(issues,'日主偏弱，官重身轻');
      if(sealClear)add(rescues,'印星化官生身');
      if(wealthClear)add(rescues,'财星生官');
    }else if(monthGod==='正印'||monthGod==='偏印'){
      basis.push('印星当令');
      ready=sealForce&&sealClear&&(officerClear||sevenClear||!strong);
      check('立格','印星当令',true,'月令取'+monthGod);
      check('成格','印星有根或透清',sealForce&&sealClear,'印须落实而非虚浮');
      check('成格','官杀生印或身印不过旺',officerClear||sevenClear||!strong,'身印过旺则须泄秀');
      check('破格','财坏印或身印壅滞',wealthClear||(strong&&!outputClear),'财印直接相战或身印过旺均损格');
      check('救应','官杀生印、护印或食伤泄秀',officerClear||sevenClear||biClear||outputClear,'随病取药');
      if(wealthClear)add(issues,'财星透出，存在财坏印');
      if(strong&&!outputClear)add(issues,'身印偏旺，缺少泄秀');
      if(officerClear||sevenClear)add(rescues,'官杀生印');
      if(biClear)add(rescues,'比劫护印制财');
      if(outputClear)add(rescues,'食伤泄秀');
    }else if(monthGod==='食神'){
      basis.push('食神当令');
      ready=foodForce&&foodClear&&!weak&&(wealthClear||sevenClear);
      check('立格','食神当令',true,'月令取食神');
      check('成格','食神有力而清',foodForce&&foodClear,'食神须得令落实');
      check('成格','身能任泄并有财杀承接',!weak&&(wealthClear||sevenClear),'食神生财或制杀方见作用');
      check('破格','枭神夺食或身弱泄过',godForce(profiles,'偏印')||weak,'枭强近食或身弱均损格');
      check('救应','财制枭、食神生财或制杀',wealthClear||sevenClear,'须见可用承接');
      if(weak)add(issues,'日主偏弱，食神泄身');
      if(godForce(profiles,'偏印'))add(issues,'枭神夺食');
      if(wealthClear)add(rescues,'食神生财，财可制枭');
      if(sevenClear)add(rescues,'食神制杀');
    }else if(monthGod==='七杀'){
      basis.push('七杀当令');
      ready=sevenForce&&!mixed&&(foodClear||sealClear)&&(!weak||sealClear);
      check('立格','七杀当令',true,'月令取七杀');
      check('成格','七杀有力',sevenForce,'杀须有根有气');
      check('成格','有制或有化',foodClear||sealClear,'食神制杀或印星化杀');
      check('破格','杀无制化、官杀混杂或杀重身轻',(!foodClear&&!sealClear)||mixed||(weak&&!sealClear),'七杀不可无制无化');
      check('救应','食神制杀或印星化杀',foodClear||sealClear,'制化须清而有力');
      if(mixed)add(issues,'官杀混杂');
      if(weak&&!sealClear)add(issues,'杀重身轻');
      if(foodClear)add(rescues,'食神制杀');
      if(sealClear)add(rescues,'印星化杀生身');
    }else if(monthGod==='伤官'){
      basis.push('伤官当令');
      ready=hurtForce&&hurtClear&&(wealthClear||sealClear);
      check('立格','伤官当令',true,'月令取伤官');
      check('成格','伤官有力而清',hurtForce&&hurtClear,'伤官须得令落实');
      check('成格','生财或配印',wealthClear||sealClear,'伤官须有去处');
      check('破格','无救的伤官见官或身弱泄身',officerClear&&!sealClear&&!wealthClear||weak&&!sealClear,'见官须有印制或财通关');
      check('救应','印制伤或财星通关',sealClear||wealthClear,'按原局生克先后判断');
      if(officerClear)add(issues,'伤官见官');
      if(weak&&!sealClear)add(issues,'日主偏弱，伤官泄身');
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
    ['year','month','hour'].forEach(function(k){addGod(tenGod(dayStem,pillars[k][0]))});
    Object.keys(pillars).forEach(function(k){(HIDDEN[pillars[k][1]]||[]).forEach(function(s){addGod(tenGod(dayStem,s))})});
    return counts;
  }
  function tenGodProfiles(dayStem,pillars,monthCommand){
    var profiles={};
    var order={year:0,month:1,day:2,hour:3};
    function ensure(g){
      if(!profiles[g])profiles[g]={count:0,revealed:0,roots:0,monthCommand:false,monthHidden:false,stemPositions:[],branchPositions:[],stemEntries:[],branchEntries:[]};
      return profiles[g];
    }
    ['year','month','hour'].forEach(function(k){
      var g=tenGod(dayStem,pillars[k][0]);
      if(g){ensure(g).count++;ensure(g).revealed++;ensure(g).stemPositions.push(order[k]);ensure(g).stemEntries.push({position:order[k],stem:pillars[k][0],pillar:k})}
    });
    Object.keys(pillars).forEach(function(k){
      (HIDDEN[pillars[k][1]]||[]).forEach(function(s,i){
        var g=tenGod(dayStem,s);
        if(!g)return;
        var item=ensure(g);
        item.count++;
        item.roots++;
        item.branchPositions.push(order[k]);
        item.branchEntries.push({position:order[k],stem:s,branch:pillars[k][1],pillar:k,hiddenIndex:i});
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
  function godsConnected(profiles,left,right,maxDistance){
    var a=godPositions(profiles,left),b=godPositions(profiles,right),limit=maxDistance==null?2:maxDistance;
    return a.some(function(x){return b.some(function(y){return Math.abs(x-y)<=limit})});
  }
  function godForce(profiles,name){
    var item=profiles[name]||{};
    return !!(item.revealed||item.monthCommand||item.roots>=2);
  }
  function godClear(profiles,name){
    var item=profiles[name]||{};
    return !!(item.revealed||item.monthCommand);
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
    var mixed=godClear(profiles,'正官')&&godClear(profiles,'七杀');
    var weak=context&&/弱/.test(context.strength||'');
    var strong=context&&/强/.test(context.strength||'');
    var canCarry=!weak||((context&&context.dayRootCount)||0)>=2||((context&&context.strengthSupport)||0)>=30;
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
    var hurtSealClose=godsConnected(profiles,['伤官'],['正印','偏印'],2);
    var bladeKillClose=godsConnected(profiles,['劫财'],['七杀'],2);
    if(mixed&&godForce(profiles,'正官')&&godForce(profiles,'七杀')&&monthGod==='正官')addCombo(out,'官杀混杂待清',96);
    else if(mixed&&monthGod==='正官')addComboClue(clues,'官杀混杂线索参考','官杀并见但一方根透不足，先作清浊线索，不直接按官杀混杂定格。');
    if(monthGod==='伤官'&&godClear(profiles,'正官'))addCombo(out,'伤官见官待制',94);
    else if(monthGod==='伤官'&&has('正官'))addComboClue(clues,'伤官见官线索参考','伤官当令而官星根透不足，先作见官线索，待岁运引动再论成败。');
    if(weak&&wealth>=4&&wealthForce)addCombo(out,'财多身弱待扶',92);
    else if(weak&&wealth>=3)addComboClue(clues,'财多身弱线索参考','财星数量偏多但根透条件不足，先作身财失衡线索。');
    if(monthGod==='七杀'&&sealForce&&sealClear)addCombo(out,'杀印相生格',95,'七杀当令，印星透出或得月令，杀有印化并能回生日主。');
    else if(monthGod==='七杀'&&(has('正印')||has('偏印')))addComboClue(clues,'杀印相生线索参考','七杀当令但印星未透且未得月令，不按杀印相生成格。');
    if(sevenForce&&foodForce&&(sevenClear||foodClear)&&foodKillClose)addCombo(out,'食神制杀格',90,'食神与七杀皆有根气，至少一方透出或得月令，且位置能够直接发生制杀关系。');
    else if(sevenActive&&foodActive)addComboClue(clues,'食神制杀线索参考','食神与七杀虽见，但根气、显现或位置承接不足，不按食神制杀成格。');
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
    var outputHasSeparateDuty=monthGod==='伤官'&&hurtClear&&foodForce&&sevenForce&&(sevenClear||foodClear)&&foodKillClose&&!foodClear;
    if((monthGod==='食神'||monthGod==='伤官')&&foodForce&&hurtForce&&output>=3&&!outputHasSeparateDuty)addCombo(out,'食伤混杂待清',89);
    else if(outputHasSeparateDuty)addComboClue(clues,'食伤分工参考','伤官当令承担月令主线，食神藏支另有制杀职责；主辅作用可分，不按食伤混杂重复扣分。');
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
    var resource=resourceElement(dayWx),weighted=strengthScore(dayStem,pillars).support;
    var rootLabels={year:'年支',month:'月支',day:'日支',hour:'时支'};
    var sameElementRoots=Object.keys(pillars).filter(function(k){
      return (HIDDEN[pillars[k][1]]||[]).some(function(stem){return STEM_WX[stem]===dayWx});
    }).map(function(k){
      var hidden=(HIDDEN[pillars[k][1]]||[]).filter(function(stem){return STEM_WX[stem]===dayWx});
      return rootLabels[k]+pillars[k][1]+'藏'+hidden.join('、');
    });
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
      var childChecks=[
        check('output-force','食伤成势',output>=4&&outputPower>=0.45,'食伤计数'+output+'，'+outputElement+'约占全局'+Math.round(outputPower*100)+'%'),
        check('output-month','食伤得令',BRANCH_WX[pillars.month[1]]===outputElement,pillars.month[1]+'月以'+BRANCH_WX[pillars.month[1]]+'为月令气'),
        check('no-seal-reversal','无有力印星逆制',!sealForce,'印星计数'+sealGods+(sealForce?'，已透、得令或成强根':'，未达有力反制')),
        check('child-has-child','食伤继续生财',wealth>=1&&wealthPower>=0.06,'财星计数'+wealth+'，'+wealthElement+'约占全局'+Math.round(wealthPower*100)+'%')
      ];
      if(allMet(childChecks))addTrue('从格：','从儿格',childChecks,[childChecks[0],childChecks[3]],outputElement);
      else if(output>=3&&outputPower>=0.35&&sealGods<=1)out.push('特殊线索参考：假从儿倾向（食伤势力、财星承接或印星反制条件未全合）。');
    }

    var selfElementPower=(scores[dayWx]||0)/total,outputElementForStrong=gen[dayWx],opposingElement=officerElement(dayWx);
    var outputRatio=(scores[outputElementForStrong]||0)/total,opposingRatio=(scores[opposingElement]||0)/total,branches=Object.keys(pillars).map(function(k){return pillars[k][1]});
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
      var transformPower=(scores[target]||0)/total,opposition=(scores[officerElement(target)]||0)/total;
      var contested=(interactions&&interactions.stemCombines||[]).some(function(item){return item.pair===pair&&item.effect==='contest'});
      if(other&&(pillars.month[0]===other||pillars.hour[0]===other)){
        var adjacentCombine=pillars.month[0]===other||pillars.hour[0]===other;
        var transformChecks=[
          check('adjacent-combine','日主与月干或时干专一相合',adjacentCombine&&!contested,'日主'+dayStem+'与'+other+(contested?'存在争合':(pillars.month[0]===other?'在月干相合':'在时干相合'))),
          check('transform-season','化神得令',BRANCH_WX[pillars.month[1]]===target,pillars.month[1]+'月以'+BRANCH_WX[pillars.month[1]]+'为月令气'),
          check('no-origin-root','日主无同类根气',sameElementRoots.length===0,sameElementRoots.length?'日主仍见同五行根气'+sameElementRoots.join('、'):'日主未见同五行根气'),
          check('transform-force','化神成势',transformPower>=0.42,target+'约占全局'+Math.round(transformPower*100)+'%'),
          check('no-transform-break','化神无强克破',opposition<0.18,officerElement(target)+'约占全局'+Math.round(opposition*100)+'%')
        ];
        if(allMet(transformChecks))addTrue('化气格：',pair+'化'+target,transformChecks,[transformChecks[0],transformChecks[1],transformChecks[3]],target);
        else out.push('特殊线索参考：'+pair+'化'+target+'未成倾向（月干专合、得令、无根、化神成势或无破条件未全）。');
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
  function comboConflictAnalysis(counts,patternNames,profiles){
    var out=[];
    var patternText=Array.isArray(patternNames)?patternNames.join('、'):(patternNames||'');
    function has(name){return (counts[name]||0)>0}
    function total(names){return names.reduce(function(sum,name){return sum+(counts[name]||0)},0)}
    var conflictRuleIds={枭神夺食:'ZP-BR-05',印制食伤:'ZP-BR-06',财坏印:'ZP-BR-07',比劫夺财:'ZP-BR-08',未见明显组合冲突:'ZP-BR-00'};
    function add(name,effect,text){out.push({name:name,displayName:name==='财坏印'?'贪财坏印':name,aliases:name==='财坏印'?['财坏印']:[],ruleId:conflictRuleIds[name]||'ZP-BR-00',ruleVersion:PATTERN_RULE_VERSION,effect:effect,text:text})}
    if(/食神制杀|食神生财/.test(patternText)&&godForce(profiles,'偏印')&&godsConnected(profiles,['偏印'],['食神'],2))add('枭神夺食',/食神制杀/.test(patternText)?'制杀受损':'生财受损','食神主线同时见有力且近贴的枭神夺食，食神受制会削弱'+(/食神制杀/.test(patternText)?'制杀':'生财')+'成格；需看财星制枭与食神根气。');
    if(/伤官生财/.test(patternText)&&anyGodForce(profiles,['正印','偏印'])&&godsConnected(profiles,['正印','偏印'],['伤官'],2))add('印制食伤','生财受阻','伤官生财同时见有力且近贴的印星，泄秀生财受阻；需看印星是护身还是过度夺秀。');
    if(/官印相生|杀印相生|伤官配印/.test(patternText)&&!(/财官印相生/.test(patternText))&&anyGodForce(profiles,['正财','偏财'])&&godsConnected(profiles,['正财','偏财'],['正印','偏印'],1))add('财坏印','印星受伤','官印、杀印或伤官配印结构中财印有力且紧贴，存在财坏印；需看比劫护印与财印去留。');
    if(anyGodForce(profiles,['正财','偏财'])&&anyGodForce(profiles,['比肩','劫财'])&&godsConnected(profiles,['正财','偏财'],['比肩','劫财'],2))add('比劫夺财','财星受分','财星与比劫皆有力且位置相近，财易被分夺；需看官杀制比劫或食伤生财承接。');
    if(!out.length)add('未见明显组合冲突','待运岁验证','未见直接破坏主格的组合冲突，重点看大运流年是否触发。');
    return out;
  }
  function interactionFlowAnalysis(mainPattern,profiles,interactions,conflicts){
    var chains=[];
    if(/财官印相生/.test(mainPattern))chains=[{from:['正财','偏财'],to:['正官'],action:'生'},{from:['正官'],to:['正印','偏印'],action:'生'}];
    else if(/杀印相生/.test(mainPattern))chains=[{from:['七杀'],to:['正印','偏印'],action:'生'}];
    else if(/官印相生/.test(mainPattern))chains=[{from:['正官'],to:['正印','偏印'],action:'生'}];
    else if(/羊刃驾杀/.test(mainPattern))chains=[{from:['七杀'],to:['劫财'],action:'制'}];
    else if(/食神制杀/.test(mainPattern))chains=[{from:['食神'],to:['七杀'],action:'制'}];
    else if(/伤官配印/.test(mainPattern))chains=[{from:['正印','偏印'],to:['伤官'],action:'制'}];
    else if(/伤官生财/.test(mainPattern))chains=[{from:['伤官'],to:['正财','偏财'],action:'生'}];
    else if(/食神生财/.test(mainPattern))chains=[{from:['食神'],to:['正财','偏财'],action:'生'}];
    function entries(names){
      return (names||[]).reduce(function(out,name){
        var item=profiles[name]||{};
        return out.concat((item.stemEntries||[]).map(function(x){return {god:name,position:x.position,kind:'干',text:x.stem+name}}),(item.branchEntries||[]).map(function(x){return {god:name,position:x.position,kind:'支',text:x.branch+'藏'+x.stem+name}}));
      },[]);
    }
    function step(from,to,action){
      var left=entries(from),right=entries(to),pairs=[];
      left.forEach(function(a){right.forEach(function(b){
        var distance=Math.abs(a.position-b.position);
        var boundRelations=(interactions.stemCombines||[]).filter(function(x){return x.active!==false&&/^(bind|transform|contest)$/.test(x.effect)&&((a.kind==='干'&&(x.left===a.position||x.right===a.position))||(b.kind==='干'&&(x.left===b.position||x.right===b.position)))});
        var damageRelations=(interactions.branchPairs||[]).filter(function(x){return x.active!==false&&/^(冲|刑|害|破)$/.test(x.type)&&((a.kind==='支'&&(x.left===a.position||x.right===a.position))||(b.kind==='支'&&(x.left===b.position||x.right===b.position)))});
        var bound=boundRelations.length>0,damaged=damageRelations.length>0;
        var remote=distance>2,sameHidden=distance===0&&a.kind==='支'&&b.kind==='支';
        var boundStatus=boundRelations.some(function(x){return x.effect==='contest'})?'争合受阻':(boundRelations.some(function(x){return x.effect==='transform'})?'合化改性':'合绊受阻');
        var damageStatus=damageRelations.length?'根气受'+unique(damageRelations.map(function(x){return x.type})).join('、'):'根气受损';
        var status=sameHidden?'同宫藏气待透':(bound?boundStatus:(remote?'隔位偏远':(damaged?damageStatus:'作用可达')));
        var active=!sameHidden&&!bound&&!remote&&!damaged;
        pairs.push({left:a,right:b,distance:distance,bound:bound,damaged:damaged,boundRelations:boundRelations.map(function(x){return x.text}),damageRelations:damageRelations.map(function(x){return x.text}),remote:remote,sameHidden:sameHidden,status:status,active:active});
      })});
      if(!pairs.length)return {from:from,to:to,action:action,status:'未接通',active:false,distance:null,text:from.join('/')+'与'+to.join('/')+'未形成可核验作用'};
      pairs.sort(function(a,b){
        if(a.active!==b.active)return a.active?-1:1;
        if(a.distance!==b.distance)return a.distance-b.distance;
        var aDirect=a.distance===0&&a.left.kind!==a.right.kind?0:1,bDirect=b.distance===0&&b.left.kind!==b.right.kind?0:1;
        return aDirect-bDirect;
      });
      var best=pairs[0];
      return {from:from,to:to,action:action,status:best.status,active:best.active,distance:best.distance,left:best.left,right:best.right,text:best.left.text+action+best.right.text+'：'+best.status};
    }
    var steps=chains.map(function(item){return step(item.from,item.to,item.action)}),sequence=[];
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
    return {steps:steps,sequence:sequence,verdict:verdict,interactionArbitration:interactions.arbitration,text:[verdict].concat(steps.map(function(x){return x.text}),sequence.map(function(x){return x.text})).join('；')+'。'};
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
  function conflictsForPattern(name,conflicts){
    return (conflicts||[]).filter(function(item){
      return (/食神制杀|食神生财/.test(name)&&item.name==='枭神夺食')||
        (/伤官生财/.test(name)&&item.name==='印制食伤')||
        (/(官印相生|杀印相生|伤官配印|财官印相生)/.test(name)&&item.name==='财坏印')||
        (/(财官印相生|伤官生财)/.test(name)&&item.name==='比劫夺财');
    });
  }
  function patternAnchoredToMonth(name,monthGod){
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
      candidates.push({name:item.name,ruleId:item.ruleId||comboRuleId(item.name),ruleVersion:item.ruleVersion||PATTERN_RULE_VERSION,source:'组合格',tier:tier,anchored:anchored,status:damage.length?'成而有瑕':'已成',basis:item.basis||'',score:item.score||0,conflicts:damage});
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
      return {
        name:item.name,ruleId:item.ruleId||comboRuleId(item.name),ruleVersion:item.ruleVersion||PATTERN_RULE_VERSION,
        role:issue?'病点':(item.name===mainPattern?'主格':(relation?relation.role:'兼格')),
        status:issue?'待治':(relatedConflicts.length?'成而有瑕':'已成'),
        basis:item.basis||'',
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
  function patternDiseaseAssessment(mainPattern,regular,issues,profiles,flow,conflicts,specialDetail){
    var activeConflictNames=(flow&&flow.sequence||[]).filter(function(item){return item.breaker&&item.breaker.active}).map(function(item){return item.name});
    var ordinaryRaw=unique((regular.issues||[]).concat(issues||[],(conflicts||[]).filter(function(item){return item.name!=='未见明显组合冲突'&&activeConflictNames.indexOf(item.name)>=0}).map(function(item){return item.name})));
    var ignored=specialDetail?ordinaryRaw.map(function(source){return {source:source,reason:specialDetail.name+'已严格成立，该普通格语境结论改由特殊格成立清单解释',numericOwner:'special-formation',ruleId:specialDetail.ruleId}}):[];
    var raw=specialDetail?[]:ordinaryRaw,items=[];
    function medicine(names,label){
      var clear=anyGodClear(profiles,names),force=anyGodForce(profiles,names);
      return {name:label,state:clear?'已透或得令':(force?'有根未透':'原局未见'),rank:clear?2:(force?1:0)};
    }
    function flowMedicine(pattern,label){
      var active=/食神制杀/.test(pattern)&&(flow&&flow.steps||[]).some(function(step){return step.active&&step.action==='制'&&step.from.indexOf('食神')>=0&&step.to.indexOf('七杀')>=0});
      return {name:label,state:active?'作用可达':'作用未接通',rank:active?2:0};
    }
    function add(family,name,source,medicines,note){
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
      else if(/官杀混杂/.test(source))add('官杀去留','官杀混杂',source,[],'须取清官杀主次，不因见印或见食便直接判为全解。');
      else if(/枭神夺食/.test(source))add('枭夺食','枭神夺食',source,[medicine(['正财','偏财'],'财星制枭')],'财须能直接制枭，不能仅以财星存在即全解。');
      else if(/财坏印/.test(source))add('财印相战','贪财坏印',source,[medicine(['比肩','劫财'],'比劫护印制财')],'只解除财印相战，不替代印星本身的根透。');
      else if(/比劫夺财/.test(source))add('比劫分财','比劫夺财',source,[medicine(['正官','七杀'],'官杀制比劫'),medicine(['食神','伤官'],'食伤生财')],'须看官杀或食伤是否真正承接财星。');
    });
    var solved=items.filter(function(item){return item.bestRank===2}),partial=items.filter(function(item){return item.bestRank===1}),unresolved=items.filter(function(item){return item.bestRank===0});
    var medicineText=items.map(function(item){var best=item.medicines.filter(function(m){return m.rank===item.bestRank}).map(function(m){return m.name+'（'+m.state+'）'}).join('、')||'未见对应药神';return item.name+'：'+item.status+'，'+best+'，'+item.residual;});
    return {ruleId:'ZP-NET-01',ruleVersion:PATTERN_RULE_VERSION,items:items,solved:solved,partial:partial,unresolved:unresolved,ignored:ignored,residualSeverity:unresolved.length*2+partial.length,text:items.length?medicineText.join('；'):(ignored.length?'普通格病点已转入特殊格成立语境，不参与重复扣分。':'未见需要重复结算的主要病点。')};
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
  function positivePhenomenaAnalysis(pillars,scores,strength,profiles,clarityConclusion,flow,conflicts,phenomena){
    scores=scores||{};
    var total=WUXING.reduce(function(sum,w){return sum+(scores[w]||0)},0)||1,keys=['year','month','day','hour'],out=[];
    function ratio(w){return (scores[w]||0)/total}
    function visibleStem(w){return keys.some(function(k){return STEM_WX[pillars[k][0]]===w})}
    function grounded(w){return keys.filter(function(k){return BRANCH_WX[pillars[k][1]]===w}).length}
    function blockedByDisease(elements){return (phenomena||[]).some(function(item){return elements.indexOf(item.target&&item.target.element)>=0||elements.indexOf(item.useCorrection&&item.useCorrection.restrain&&item.useCorrection.restrain[0])>=0})}
    function add(name,ruleId,definition,evidence,boundary,authority){out.push({name:name,ruleId:ruleId,ruleVersion:PATTERN_RULE_VERSION,status:'明确成立',definition:definition,evidence:evidence,boundary:boundary,authority:authority})}
    function pair(name,ruleId,a,b,months,blocked,definition,authority){
      var combined=ratio(a)+ratio(b),otherMax=Math.max.apply(null,WUXING.filter(function(w){return w!==a&&w!==b}).map(ratio));
      var qualifies=ratio(a)>=0.18&&ratio(b)>=0.18&&combined>=0.48&&visibleStem(a)&&visibleStem(b)&&grounded(a)+grounded(b)>=2&&months.indexOf(pillars.month[1])>=0&&otherMax<=0.34&&!blockedByDisease(blocked);
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
  function luckRecheck(dayStem,luckGz,analysis){
    if(!analysis.pillars||!analysis.tenGodProfiles||!analysis.tenGodCounts)return null;
    var profiles=JSON.parse(JSON.stringify(analysis.tenGodProfiles)),counts=Object.assign({},analysis.tenGodCounts),position=4;
    function ensure(god){if(!profiles[god])profiles[god]={count:0,revealed:0,roots:0,monthCommand:false,monthHidden:false,stemPositions:[],branchPositions:[],stemEntries:[],branchEntries:[]};return profiles[god]}
    var stem=luckGz[0],branch=luckGz[1],stemGod=tenGod(dayStem,stem),hidden=HIDDEN[branch]||[];
    if(stemGod){var stemItem=ensure(stemGod);stemItem.count++;stemItem.revealed++;stemItem.stemPositions.push(position);stemItem.stemEntries.push({position:position,stem:stem,pillar:'luck'});counts[stemGod]=(counts[stemGod]||0)+1}
    hidden.forEach(function(hiddenStem,index){var god=tenGod(dayStem,hiddenStem);if(!god)return;var item=ensure(god);item.count++;item.roots++;item.branchPositions.push(position);item.branchEntries.push({position:position,stem:hiddenStem,branch:branch,pillar:'luck',hiddenIndex:index});counts[god]=(counts[god]||0)+1});
    var dayWx=STEM_WX[dayStem],support=[dayWx,resourceElement(dayWx)],drain=[gen[dayWx],ctrl[dayWx],officerElement(dayWx)],luckElements=unique([STEM_WX[stem],BRANCH_WX[branch]]),strength=analysis.strength;
    if(/弱/.test(strength)&&luckElements.every(function(w){return support.indexOf(w)>=0}))strength='中和';
    else if(/强/.test(strength)&&luckElements.every(function(w){return drain.indexOf(w)>=0}))strength='中和';
    var monthCommand=analysis.monthCommand,monthGod=monthCommand&&monthCommand.ambiguous?'':monthCommand&&monthCommand.primaryGod;
    var regular=regularPatternAssessment(dayStem,analysis.pillars,monthCommand&&monthCommand.primaryGod,profiles,strength,monthCommand);
    var mixed=godClear(profiles,'正官')&&godClear(profiles,'七杀');
    var combos=comboPatterns(monthGod,counts,{mixed:mixed,strength:strength,profiles:profiles});
    var conflicts=comboConflictAnalysis(counts,combos.formed,profiles);
    var natalSpecial=(analysis.specialPatterns||[]).filter(function(x){return /^从格：|^化气格：|^专旺格：/.test(x)});
    var effectiveDetails=combos.details.filter(function(item){return (analysis.comboPatterns||[]).indexOf(item.name)>=0||patternAnchoredToMonth(item.name,monthGod)});
    var effectiveCombos={formed:effectiveDetails.map(function(x){return x.name}),details:effectiveDetails,clues:combos.clues};
    var arbitration=arbitratePatterns(regular,effectiveCombos,natalSpecial,conflicts,monthGod);
    var natalRegular=analysis.regularPatternBackground||analysis.regularPattern||{};
    var oldChecks=natalRegular.checks||[],newChecks=regular.checks||[];
    function changed(type,toActive){return newChecks.filter(function(item){var old=oldChecks.find(function(x){return x.type===item.type&&x.label===item.label});return item.type===type&&item.active===toActive&&(!old||old.active!==toActive)})}
    var completed=changed('成格',true),newBreakers=changed('破格',true),rescued=regular.status==='已破'?[]:changed('救应',true);
    var formedAdded=combos.formed.filter(function(name){return (analysis.comboPatterns||[]).indexOf(name)<0&&!/待清|待制|待扶/.test(name)});
    var effectiveAdded=formedAdded.filter(function(name){return patternAnchoredToMonth(name,monthGod)});
    var formedLost=(analysis.comboPatterns||[]).filter(function(name){return !/待清|待制|待扶/.test(name)&&combos.formed.indexOf(name)<0});
    return {regularPattern:regular,comboPatterns:combos.formed,conflicts:conflicts,arbitration:arbitration,completed:completed,newBreakers:newBreakers,rescued:rescued,formedAdded:formedAdded,effectiveAdded:effectiveAdded,formedLost:formedLost,strength:strength,profiles:profiles,counts:counts};
  }
  function evaluateLuckImpact(dayStem,luckGz,analysis){
    analysis=analysis||{};
    var recheck=luckRecheck(dayStem,luckGz,analysis);
    var useful=analysis.useful||{use:[],avoid:[]},stem=luckGz&&luckGz[0],branch=luckGz&&luckGz[1];
    var stemWx=STEM_WX[stem],branchWx=BRANCH_WX[branch],god=stem?tenGod(dayStem,stem):'';
    var elements=unique([stemWx,branchWx]),score=0,reasons=[];
    elements.forEach(function(w){
      if((useful.use||[]).indexOf(w)>=0){score++;reasons.push(w+'为喜用')}
      if((useful.avoid||[]).indexOf(w)>=0){score--;reasons.push(w+'为慎用')}
    });
    var diagnostic=analysis.diagnosticPattern||analysis.mainPattern||'';
    if(/财多身弱|杀重身轻/.test(diagnostic)&&(god==='正印'||god==='偏印'||god==='比肩'||god==='劫财')){score++;reasons.push(god+'扶身')}
    if(/食神制杀/.test(diagnostic)&&god==='偏印'){score--;reasons.push('偏印引动枭神夺食')}
    if(/官杀混杂|伤官见官/.test(diagnostic)&&(god==='正印'||god==='偏印')){score++;reasons.push('印星参与制化')}
    if(/官印相生|杀印相生|财官印相生/.test(diagnostic)&&(god==='正财'||god==='偏财')){score--;reasons.push('财星可能损印')}
    var interactions=analysis.interactions||{},natalStems=interactions.natalStems||[],natalBranches=interactions.natalBranches||[];
    var combineOther=combineStem[stem];
    if(combineOther&&natalStems.indexOf(combineOther)>=0){
      var pair=[stem,combineOther].sort(function(a,b){return STEMS.indexOf(a)-STEMS.indexOf(b)}).join('');
      var target=({甲己:'土',乙庚:'金',丙辛:'水',丁壬:'木',戊癸:'火'})[pair];
      if(target&&(useful.use||[]).indexOf(target)>=0){score++;reasons.push('大运天干合动'+target+'喜用')}
      else if(target&&(useful.avoid||[]).indexOf(target)>=0){score--;reasons.push('大运天干合动'+target+'忌神')}
      else reasons.push('大运天干与原局'+combineOther+'相合');
    }
    var roots=analysis.strengthScore&&analysis.strengthScore.dimensions&&analysis.strengthScore.dimensions.roots.items||[];
    var clashedRoots=roots.filter(function(item){return BRANCH_CLASH[item.branch]===branch});
    if(clashedRoots.length){score--;reasons.push('大运冲动'+clashedRoots.map(function(x){return x.text}).join('、'))}
    THREE_GROUPS.concat(THREE_MEETINGS).forEach(function(group){
      var natalCount=group.members.split('').filter(function(b){return natalBranches.indexOf(b)>=0}).length;
      var afterCount=group.members.split('').filter(function(b){return natalBranches.indexOf(b)>=0||b===branch}).length;
      if(natalCount<3&&afterCount===3){
        if((useful.use||[]).indexOf(group.element)>=0){score++;reasons.push('大运补成'+group.name+'，引动喜用'+group.element)}
        else if((useful.avoid||[]).indexOf(group.element)>=0){score--;reasons.push('大运补成'+group.name+'，引动忌神'+group.element)}
        else reasons.push('大运补成'+group.name);
      }
    });
    if(recheck){
      score+=Math.min(2,recheck.completed.length+recheck.rescued.length+recheck.effectiveAdded.length);
      score-=Math.min(2,recheck.newBreakers.length+recheck.formedLost.length);
      if(recheck.completed.length)reasons.push('补足'+recheck.completed.map(function(x){return x.label}).join('、'));
      if(recheck.rescued.length)reasons.push('落实'+recheck.rescued.map(function(x){return x.label}).join('、'));
      if(recheck.effectiveAdded.length)reasons.push('运中补成'+recheck.effectiveAdded.join('、'));
      var triggeredOnly=recheck.formedAdded.filter(function(name){return recheck.effectiveAdded.indexOf(name)<0});
      if(triggeredOnly.length)reasons.push('另触发'+triggeredOnly.join('、')+'线索，但不改原局主格');
      if(recheck.newBreakers.length)reasons.push('引发'+recheck.newBreakers.map(function(x){return x.label}).join('、'));
      if(recheck.formedLost.length)reasons.push('原有'+recheck.formedLost.join('、')+'受损');
    }
    score=Math.max(-2,Math.min(2,score));
    var base=PATTERN_LEVELS.indexOf(analysis.patternLevelGrade);
    if(base<0)base=1;
    var delta=score>=2?1:(score<=-2?-1:0),current=PATTERN_LEVELS[Math.max(0,Math.min(PATTERN_LEVELS.length-1,base+delta))];
    var action=delta>0?'提升':(delta<0?'下降':'维持');
    var main=(analysis.patternStructures||[]).find(function(item){return item.role==='主格'});
    var fromStatus=(main&&main.status)||(analysis.regularPattern&&analysis.regularPattern.status)||'待成';
    var toStatus=recheck&&recheck.arbitration.main?recheck.arbitration.main.status:(recheck&&recheck.regularPattern.status||fromStatus);
    var fromMain=analysis.mainPattern||'',toMain=recheck&&recheck.arbitration.mainPattern||fromMain;
    if(!recheck){
      toStatus=fromStatus;
      if(delta>0){if(fromStatus==='已破'||fromStatus==='待成')toStatus='成而有瑕';else if(fromStatus==='成而有瑕')toStatus='已成'}
      else if(delta<0){if(fromStatus==='已成')toStatus='成而有瑕';else if(fromStatus==='成而有瑕'||fromStatus==='待成')toStatus='已破'}
    }
    var mainText=fromMain&&toMain&&fromMain!==toMain?'，主格由'+fromMain+'转看'+toMain:'';
    var activationStatus=delta>0?(fromStatus!==toStatus?'运中补格':'发挥提升'):(delta<0?'当前受阻':'平运维持');
    return {gz:luckGz,score:score,delta:delta,action:action,grade:current,natalGrade:analysis.patternLevelGrade,currentGrade:current,activationStatus:activationStatus,scope:'只调整当前大运发挥，不改写原局结构层次',fromStatus:fromStatus,toStatus:toStatus,fromMain:fromMain,toMain:toMain,conditionReview:recheck,text:'当前大运'+luckGz+'（'+activationStatus+'）：格局状态'+(fromStatus===toStatus?'维持'+fromStatus:'由'+fromStatus+'转为'+toStatus)+mainText+'，层次'+action+'为'+current+'；'+(reasons.length?reasons.join('、'):'重新核验后未直接补足或破坏主格条件')+'。 原局层次保持'+analysis.patternLevelGrade+'不变。'};
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
      var regularScore=regularStatus==='已成'||regularStatus==='成而有瑕'?70:(regularStatus==='待成'?50:0);
      return {score:regularScore,tier:regularScore===70?'B':(regularScore===50?'基础':'未成立'),ruleId:regularRuleId,pattern:regularPattern,sourceSystem:'主流子平月令格局',source:[regular.authority&&regular.authority.source||'《子平真诠》月令立格与成败救应主线'],evidence:(entry?pattern+'未通过严格成立条件，退回':'')+regularPattern+regularStatus+'的月令常格基础层级'};
    }
    return {score:0,tier:'未成立',ruleId:ruleId,pattern:pattern,sourceSystem:'主流子平月令格局',source:[],evidence:'未见通过稳定规则验真的主格，不因显示名称取得古籍潜力'};
  }
  function patternStructureRawScore(analysis){
    var main=(analysis.patternStructures||[]).find(function(item){return item.role==='主格'}),regular=analysis.regularPattern||{},status=(main&&main.status)||regular.status||'待成';
    function clamp(value){return Math.max(0,Math.min(100,Math.round(value)))}
    function component(name,score,evidence,share,causeGroup){return {name:name,score:score,evidence:evidence,share:share==null?100:share,causeGroup:causeGroup}}
    function dimension(key,name,score,evidence,components){
      var weight=PATTERN_SCORE_DIMENSION_WEIGHTS[key],value=clamp(score);
      return {key:key,name:name,weight:weight,score:value,contribution:Math.round(value*weight)/100,evidence:evidence,components:components||[]};
    }

    var potential=classicalPatternPotential(analysis);
    var statusScore=status==='已成'?85:(status==='成而有瑕'?65:(status==='已破'?25:45));
    var statusEvidence=(main&&main.name)||regular.name||'未见明确主格';
    var checks=regular.checks||[],qualificationChecks=main&&main.qualification&&main.qualification.checks||[];
    var required=qualificationChecks.length?qualificationChecks.map(function(item){return {active:item.met,label:item.label}}):checks.filter(function(item){return item.type==='立格'||item.type==='成格'}),met=required.filter(function(item){return item.active}).length;
    var useCompletion=(qualificationChecks.length||(!main||main.name===regular.name))&&status!=='已破',completionScore=required.length?Math.round(met/required.length*100):50;
    var formationScore=useCompletion?(statusScore*0.65+completionScore*0.35):statusScore;

    var steps=analysis.interactionFlow&&analysis.interactionFlow.steps||[],active=steps.filter(function(item){return item.active}).length;
    var flowScore=steps.length?30+60*active/steps.length:50,flowEvidence=steps.length?(active+'/'+steps.length+'环节可达'):'未设置独立作用链，按中性值进入排序';

    var disease=analysis.patternDisease||{items:[],solved:[],partial:[],unresolved:[]},solved=(disease.solved||[]).length,partial=(disease.partial||[]).length,unresolved=(disease.unresolved||[]).length;
    var clarity=analysis.structuralClarity&&analysis.structuralClarity.level||analysis.clarity&&analysis.clarity.level||'待辨';
    var clarityObject=analysis.structuralClarity||analysis.clarity||{},clarityClaimedByDisease=!!((disease.items||[]).length&&clarityObject.numericOwner==='disease'&&/^(冲战|不清|偏浊|浊)$/.test(clarity));
    var clarityScore=clarityClaimedByDisease?50:{清:90,较清:80,可清:65,有瑕:50,冲战:30,不清:25,偏浊:25,浊:10,待清:40,待辨:45}[clarity];
    if(clarityScore==null)clarityScore=45;
    var clarityEvidence=clarity+(clarityClaimedByDisease?'；负面原因已由病药维度结算，本维按中性值处理':'');

    var remedyScore=unresolved?25:(partial?55:80),remedyEvidence=(disease.items||[]).length?('已解'+solved+'、部分'+partial+'、未解'+unresolved):'未见需要结算的主要病点';

    var phenomena=analysis.elementPhenomena||[],positive=analysis.positivePhenomena||[];
    var severityRank=phenomena.reduce(function(max,item){return Math.max(max,{轻度:1,明显:2,严重:3}[item.severity]||1)},0);
    var balanceScore=severityRank===3?10:(severityRank===2?30:(severityRank===1?45:(positive.length?75:60))),balanceEvidence=[];
    if(phenomena.length)balanceEvidence.push(phenomena.map(function(item){return item.name+'（'+item.severity+'）'}).join('、'));
    if(positive.length)balanceEvidence.push(positive.map(function(item){return item.name}).join('、'));
    if(!balanceEvidence.length)balanceEvidence.push('未见严格气势病象或清秀气象');

    var dimensions=[
      dimension('potential','古籍格局潜力',potential.score,potential.evidence,[Object.assign(component('主格古籍潜力',potential.score,potential.evidence,100,'classical-potential'),{ruleId:potential.ruleId,pattern:potential.pattern,tier:potential.tier,sourceSystem:potential.sourceSystem,source:potential.source})]),
      dimension('formation','成格完成度',formationScore,statusEvidence+(useCompletion?'；对应成立条件'+met+'/'+required.length:'；组合格已由独立入口验真'),useCompletion?[component('格局状态',statusScore,statusEvidence,65,'formation-status'),component('成立条件完成度',completionScore,met+'/'+required.length,35,'formation-checks')]:[component('主格状态',statusScore,statusEvidence,100,'formation-status')]),
      dimension('flow','作用链',flowScore,flowEvidence,[component('作用链可达度',clamp(flowScore),flowEvidence,100,'interaction-flow')]),
      dimension('clarity','清浊去留',clarityScore,clarityEvidence,[component('清浊',clarityScore,clarityEvidence,100,'clarity')]),
      dimension('remedy','病药净结算',remedyScore,remedyEvidence,[component('病药残余',clamp(remedyScore),remedyEvidence,100,'disease-net')]),
      dimension('balance','气势校正',balanceScore,balanceEvidence.join('；'),[
        component('气势病象',phenomena.length?balanceScore:60,phenomena.length?phenomena.map(function(item){return item.name+'（'+item.severity+'）'}).join('、'):'无',100,'element-phenomena'),
        component('清秀气象',!phenomena.length&&positive.length?75:60,positive.length?(positive.map(function(item){return item.name}).join('、')+(phenomena.length?'（有病象时不参与加分）':'')):(phenomena.length?'有病象时不以清秀气象抵消':'无'),100,'positive-phenomena')
      ])
    ];
    var unroundedScore=dimensions.reduce(function(sum,item){return sum+item.contribution},0),score=clamp(unroundedScore);
    var ledger=[];
    dimensions.forEach(function(item){
      (item.components||[]).forEach(function(entry){ledger.push(Object.assign({dimension:item.key,dimensionName:item.name,dimensionWeight:item.weight},entry))});
    });
    return {score:score,unroundedScore:Math.round(unroundedScore*100)/100,modelVersion:PATTERN_SCORE_MODEL_VERSION,totalWeight:100,dimensions:dimensions,ledger:ledger,breakdown:ledger,method:'六维线性加权：古籍格局潜力20%、成格完成度25%、作用链20%、清浊去留15%、病药净结算15%、气势调候校正5%；格名文字不直接决定分数，只有通过稳定规则验真的主格取得一份古籍潜力；流通、清浊和病药分别结算，子平硬门槛在百分位候选档之后独立裁决；不使用现实人物结果标签'};
  }
  function percentileFromHistogram(score,histogram){
    var keys=Object.keys(histogram||{}).map(Number).sort(function(a,b){return a-b}),total=keys.reduce(function(sum,key){return sum+(histogram[key]||0)},0);
    if(!total)return null;
    var below=keys.filter(function(key){return key<score}).reduce(function(sum,key){return sum+(histogram[key]||0)},0),equal=histogram[score]||0;
    return Math.round((below+equal/2)/total*1000)/10;
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
  function finalizePatternLevel(analysis,raw,percentile){
    var candidate=theoreticalGradeFromPercentile(percentile),candidateIndex=PATTERN_LEVELS.indexOf(candidate.grade);
    var main=(analysis.patternStructures||[]).find(function(item){return item.role==='主格'}),regular=analysis.regularPattern||{},status=(main&&main.status)||regular.status||'待成';
    var disease=analysis.patternDisease||{solved:[],partial:[],unresolved:[]},solved=(disease.solved||[]).length,partial=(disease.partial||[]).length,unresolved=(disease.unresolved||[]).length;
    var tie=analysis.patternLevelTieBreak||{tier:0,order:{}},order=tie.order||{},phenomena=analysis.elementPhenomena||[],severePhenomenon=phenomena.some(function(item){return item.severity==='严重'});
    var qualificationChecks=main&&main.qualification&&main.qualification.checks||[];
    var required=qualificationChecks.length?qualificationChecks.map(function(item){return {active:item.met,label:item.label}}):(regular.checks||[]).filter(function(item){return item.type==='立格'||item.type==='成格'}),met=required.filter(function(item){return item.active}).length;
    var established=status==='已成',flawed=status==='成而有瑕',broken=status==='已破';
    var flowGood=!!(analysis.interactionFlow&&analysis.interactionFlow.steps&&analysis.interactionFlow.steps.length&&analysis.interactionFlow.steps.every(function(item){return item.active}));
    var pure=!!(analysis.clarity&&/^(清|较清)$/.test(analysis.clarity.level));
    var strictQuality=tie.tier>=2,formationComplete=tie.tier===2||(required.length&&met===required.length),actionComplete=flowGood,topEligible=!!(strictQuality&&established&&formationComplete&&actionComplete&&pure&&!unresolved&&!partial&&!phenomena.length&&!(order.breakers||0));
    var floorIndex=0,ceilingIndex=4,gateReasons=[];
    if(strictQuality){floorIndex=1;gateReasons.push((/严格成立$/.test(tie.label)?tie.label:tie.label+'严格成立')+'，古籍潜力已进入原始排序，不再重复设置贵格抬档')}
    else if(established){floorIndex=1;gateReasons.push('常规格局已成，取得中等下限')}
    else if(flawed&&solved&&!partial&&!unresolved){floorIndex=1;gateReasons.push('成而有瑕但病点已获有效救应，已解部分不重复扣档')}

    if(topEligible)gateReasons.push('成格完整、作用可达、清纯无残病，具备顶级候选资格');
    else if(established){ceilingIndex=3;gateReasons.push('未同时通过顶级硬门槛，最高为高')}
    else if(flawed&&solved&&!unresolved){ceilingIndex=3;gateReasons.push('成而有瑕且见有效救应，最高为高')}
    else{ceilingIndex=2;gateReasons.push('未明确成格，最高为偏高')}

    if(unresolved){
      ceilingIndex=Math.min(ceilingIndex,broken?1:2);
      gateReasons.push('仍有'+unresolved+'项未解病点，只按残病限制上限');
    }else if(partial){
      ceilingIndex=Math.min(ceilingIndex,3);
      gateReasons.push('仍有'+partial+'项部分化解病点，不重复扣已解部分');
    }else if(solved){
      gateReasons.push('已有'+solved+'项病点完全化解，不再因原病压低层次');
    }
    if(severePhenomenon){ceilingIndex=Math.min(ceilingIndex,2);gateReasons.push('严重气势病象限制上限为偏高')}
    else if(phenomena.length){ceilingIndex=Math.min(ceilingIndex,3);gateReasons.push('气势病象只按实际程度限制上限')}
    var clarityObject=analysis.clarity||{},negativeClarity=/^(冲战|浊|偏浊|不清)$/.test(clarityObject.level||''),clarityOwnedByDisease=clarityObject.numericOwner==='disease'&&(disease.items||[]).length;
    if(negativeClarity&&(!clarityOwnedByDisease||unresolved||partial)){ceilingIndex=Math.min(ceilingIndex,2);gateReasons.push('清浊未定或冲战明显，暂不进入高档')}
    if(broken&&!solved&&!partial){ceilingIndex=Math.min(ceilingIndex,1);gateReasons.push('明确破格且未见有效救应，最高为中等')}
    floorIndex=Math.min(floorIndex,ceilingIndex);
    var finalIndex=Math.max(floorIndex,Math.min(candidateIndex,ceilingIndex)),grade=PATTERN_LEVELS[finalIndex],floor=PATTERN_LEVELS[floorIndex],ceiling=PATTERN_LEVELS[ceilingIndex];
    var decision={candidateGrade:candidate.grade,candidateBand:'P'+candidate.min+'-P'+Math.min(100,candidate.max),candidateIndex:candidateIndex,floorGrade:floor,ceilingGrade:ceiling,finalGrade:grade,finalIndex:finalIndex,topEligible:topEligible,reasons:gateReasons,ruleIds:['ZP-LV-01','ZP-LV-02','ZP-LV-03','ZP-NET-01'],tiePolicy:'同一原始分采用中位秩百分位，不随机拆分；子平硬门槛不同可以产生不同最终档位。'};
    var structuralText=(analysis.patternLevel||'').replace(/^(?:偏低|中等|偏高|高|顶级)：/,'');
    analysis.patternLevel=grade+'：理论候选'+candidate.grade+'（'+formatPatternPercentile(percentile)+'），经子平硬门槛裁定为'+grade+'；'+gateReasons.join('；')+'。 '+structuralText;
    analysis.patternLevelGrade=grade;
    analysis.patternLevelIndex=finalIndex;
    analysis.patternLevelQualityFloor='';
    analysis.patternLevelHardGate=decision;
    analysis.patternLevelMetrics.candidate=candidate.grade;
    analysis.patternLevelMetrics.hardGate=floor+'至'+ceiling;
    analysis.patternLevelCriteria.unshift({name:'理论分档',met:true,total:1,result:'原始结构分'+raw.score+'，'+formatPatternPercentile(percentile)+'，候选'+candidate.grade+'（'+decision.candidateBand+'）'});
    analysis.patternLevelCriteria.splice(1,0,{name:'子平硬门槛',met:true,total:1,result:'下限'+floor+'、上限'+ceiling+'，最终'+grade+'；'+gateReasons.join('；')});
    analysis.patternLevelCriteria.push({name:'同分边界',met:true,total:1,result:decision.tiePolicy});
    analysis.natalPatternLevel.grade=grade;
    analysis.natalPatternLevel.index=finalIndex;
    analysis.natalPatternLevel.text=analysis.patternLevel;
    analysis.natalPatternLevel.candidateGrade=candidate.grade;
    analysis.natalPatternLevel.floorGrade=floor;
    analysis.natalPatternLevel.ceilingGrade=ceiling;
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
      var analysis=analyzePattern({pillars:pillars,dayStem:pillars.day[0],time:{used:time}}),raw=analysis.patternRawScoreBreakdown,percentile=percentileFromHistogram(raw.score,histogram),candidate=theoreticalGradeFromPercentile(percentile),decision=finalizePatternLevel(analysis,raw,percentile);
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
    var scores=data.scores||scoreWuxing(pillars);
    var weightedStrength=strengthScore(dayStem,pillars);
    var strength=assessStrength(dayStem,pillars,scores);
    var interactions=weightedStrength.interactions||interactionAnalysis(pillars,scores);
    var monthCommand=monthCommandAnalysis(dayStem,pillars,interactions,data.time&&data.time.used);
    var main=monthCommand.primaryStem,monthGod=monthCommand.primaryGod,primary=patternName(dayStem,monthBranch,main),evidence=[];
    var counts=tenGodCounts(dayStem,pillars);
    var profiles=tenGodProfiles(dayStem,pillars,monthCommand);
    var elementPhenomena=[];
    var regular=regularPatternAssessment(dayStem,pillars,monthGod,profiles,strength,monthCommand);
    var revealed=monthCommand.revealedStems;
    var roots=Object.keys(pillars).filter(function(k){return (HIDDEN[pillars[k][1]]||[]).indexOf(dayStem)>=0}).map(function(k){return ({year:'年支',month:'月支',day:'日支',hour:'时支'})[k]+pillars[k][1]});
    evidence.push(monthCommand.basis);
    evidence.push('透干：'+(revealed.length?revealed.map(function(s){return s+tenGod(dayStem,s)}).join('、'):'月令藏干未明显透出')+'。');
    evidence.push('通根：'+(roots.length?dayStem+'见于'+roots.join('、'):'日主未见直接通根')+'。');
    evidence.push('旺衰：'+strength+'；以得令、得地、得势的分项证据综合校准。');
    weightedStrength.evidence.forEach(function(item){evidence.push(item+'。')});
    interactions.groups.filter(function(x){return x.complete}).forEach(function(item){evidence.push('合会：'+item.text+'。')});
    interactions.stemCombines.forEach(function(item){evidence.push('天干合：'+item.text+'。')});
    interactions.branchPairs.forEach(function(item){evidence.push('地支'+item.type+'：'+item.text+(item.active===false?'，此关系已降级':'')+'。')});
    if(interactions.arbitration)evidence.push('合冲先后：'+interactions.arbitration.text+'；规则 '+interactions.arbitration.ruleIds.join('、')+'。');
    var candidates=monthCommand.selectedStems.map(function(s){return patternName(dayStem,monthBranch,s)}).filter(Boolean);
    var mixed=godClear(profiles,'正官')&&godClear(profiles,'七杀');
    var comboResult=comboPatterns(monthCommand.ambiguous?'':monthGod,counts,{mixed:mixed,strength:strength,profiles:profiles,dayRootCount:roots.length,strengthSupport:weightedStrength.support});
    if(monthCommand.ambiguous)comboResult.clues.unshift({name:'杂气兼用线索参考',text:monthCommand.basis+' 条件未取清前不以其中一神强定成格。'});
    var combos=comboResult.formed,comboClues=comboResult.clues;
    var specials=specialPatterns(dayStem,pillars,scores,counts,strength,roots,interactions,profiles);
    elementPhenomena=elementPhenomenaAnalysis(dayStem,pillars,scores,strength,weightedStrength,specials);
    var clues=classifiedClues({pillars:pillars,dayStem:dayStem});
    var trueSpecial=trueSpecialPattern(specials);
    var specialDetail=trueSpecialDetail(specials);
    var patternIssues=combos.filter(function(name){return /待清|待制|待扶/.test(name)});
    var tenGodTerms=specialDetail?[]:tenGodDiagnostics(counts,profiles,strength,specials);
    tenGodTerms.forEach(function(item){if(patternIssues.indexOf(item.name)<0)patternIssues.push(item.name)});
    elementPhenomena.forEach(function(item){if(patternIssues.indexOf(item.name)<0)patternIssues.push(item.name)});
    if(specialDetail)patternIssues=[];
    var comboConflicts=comboConflictAnalysis(counts,combos,profiles);
    var arbitration=arbitratePatterns(regular,comboResult,specials,comboConflicts,monthCommand.ambiguous?'':monthGod);
    var mainPattern=arbitration.mainPattern;
    var interactionFlow=interactionFlowAnalysis(mainPattern,profiles,interactions,comboConflicts);
    if(specialDetail)interactionFlow=specialInteractionFlowAnalysis(specialDetail,interactions);
    var patternDisease=patternDiseaseAssessment(mainPattern,regular,patternIssues,profiles,interactionFlow,comboConflicts,specialDetail);
    var diagnosticPattern=[mainPattern].concat(patternIssues).join('；');
    var useful=usefulElements(dayStem,strength,{pillars:pillars,monthBranch:monthBranch,monthGod:monthGod,monthCommandStem:main,mainPattern:diagnosticPattern,patternArbitration:arbitration,regularPattern:regular,profiles:profiles,counts:counts,scores:scores,elementPhenomena:elementPhenomena,patternDisease:patternDisease});
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
    var positivePhenomena=specialDetail?[]:positivePhenomenaAnalysis(pillars,scores,strength,profiles,clarityConclusion,interactionFlow,comboConflicts,elementPhenomena);
    var confidence=patternConfidence(regular,structures,patternIssues,comboClues,clarity,specials);
    var levelResult=levelAssessment(mainPattern,regular,structures,patternIssues,clarity,interactionFlow,comboConflicts,elementPhenomena,patternDisease);
    var level=levelResult.text;
    var usePriority=useful.arbitration||usefulPriority(diagnosticPattern,strength,monthBranch,specials);
    var regularOutput=specialDetail?Object.assign({},regular,{status:'仅作背景',formed:false,basis:regular.name+'仅作月令背景，不参与'+specialDetail.name+'的成败与计分。',issues:[],rescues:[],checks:[],keep:'月令信息仅作真假校验背景',remove:'不按常格去留重复裁断'}):regular;
    var authorityBasis=specialDetail?specialContextAuthority(specialDetail):regular.authority;
    var publicPrimary=specialDetail?mainPattern:primary;
    var ordinaryContext=specialDetail?{primary:primary,regularPattern:regular,comboPatterns:combos,comboClues:comboClues,comboConflicts:comboConflicts,positivePhenomena:positivePhenomenaAnalysis(pillars,scores,strength,profiles,clarityConclusion,interactionFlow,comboConflicts,elementPhenomena)}:null;
    var result={analysisMeta:{engineVersion:PATTERN_ENGINE_VERSION,ruleVersion:PATTERN_RULE_VERSION,baselineVersion:THEORETICAL_BASELINE_VERSION,scoreModelVersion:PATTERN_SCORE_MODEL_VERSION,baselineScope:'固定理论时间网格，只比较同规则下结构相对位置，不使用真人结果标签'},realizationBoundary:{model:['原局潜力','行运激活','现实兑现'],localScope:['原局潜力','行运激活'],externalFactors:['家庭','教育','时代','国家与地区','行业环境','个人选择'],text:'格局层次表示命盘结构与行运承接，不代表人的价值，也不保证现实成就。'},natalPatternLevel:{grade:levelResult.grade,index:levelResult.index,text:levelResult.text,scope:'原局结构固定结论',ruleVersion:PATTERN_RULE_VERSION,baselineVersion:THEORETICAL_BASELINE_VERSION,scoreModelVersion:PATTERN_SCORE_MODEL_VERSION},primary:publicPrimary,pattern:publicPrimary,regularPrimary:specialDetail?primary:null,pillars:pillars,monthCommand:monthCommand,patternBasis:basis,authorityBasis:authorityBasis,patternState:state,patternConfidence:confidence,patternVerdict:verdict,patternReasoning:reasoningChain,patternDisease:patternDisease,patternArbitration:arbitration,candidates:candidates,regularPattern:regularOutput,regularPatternBackground:specialDetail?regular:null,ordinaryContext:ordinaryContext,comboPatterns:specialDetail?[]:combos,comboClues:specialDetail?[]:comboClues,patternStructures:structures,mainPattern:mainPattern,patternIssues:patternIssues,diagnosticPattern:diagnosticPattern,patternLevel:level,patternLevelGrade:levelResult.grade,patternLevelIndex:levelResult.index,patternLevelQualityFloor:levelResult.qualityFloor,patternLevelTieBreak:levelResult.tieBreak,patternLevelMetrics:levelResult.metrics,patternLevelCriteria:levelResult.criteria,remedy:remedy,factors:factors,clarity:clarity,structuralClarity:structuralClarity,clarityConclusion:clarityConclusion,comboConflicts:specialDetail?[]:comboConflicts,tenGodTerms:tenGodTerms,usePriority:usePriority,specialPatterns:specials,specialPatternDetails:(specials.details||[]),specialPatternQualification:specialDetail,classifiedClues:clues,elementPhenomena:elementPhenomena,positivePhenomena:positivePhenomena,interactions:interactions,interactionFlow:interactionFlow,strength:strength,strengthScore:weightedStrength,tenGodCounts:counts,tenGodProfiles:profiles,useful:useful,evidence:evidence};
    var raw=patternStructureRawScore(result),percentile=percentileFromHistogram(raw.score,THEORETICAL_BASELINE_HISTOGRAM);
    result.patternRawScore=raw.score;
    result.patternRawScoreBreakdown=raw;
    result.patternPercentile=percentile;
    result.patternPercentileText=formatPatternPercentile(percentile);
    result.natalPatternLevel.rawScore=raw.score;
    result.natalPatternLevel.percentile=percentile;
    result.natalPatternLevel.percentileText=result.patternPercentileText;
    finalizePatternLevel(result,raw,percentile);
    return result;
  }

  var api={constants:{WUXING:WUXING,STEM_WX:STEM_WX,BRANCH_WX:BRANCH_WX,HIDDEN:HIDDEN,SHENSHA_RULES:SHENSHA_RULES,AUTHORITY_PATTERN_RULES:AUTHORITY_PATTERN_RULES,CLASSICAL_PATTERN_POTENTIAL_RULES:CLASSICAL_PATTERN_POTENTIAL_RULES,SPECIAL_PATTERN_RULES:SPECIAL_PATTERN_RULES,PHENOMENON_RULES:PHENOMENON_RULES,THEORETICAL_BASELINE_CONFIG:THEORETICAL_BASELINE_CONFIG,THEORETICAL_LEVEL_BANDS:THEORETICAL_LEVEL_BANDS,PATTERN_SCORE_DIMENSION_WEIGHTS:PATTERN_SCORE_DIMENSION_WEIGHTS},SHENSHA_RULES:SHENSHA_RULES,stemPolarity:stemPolarity,tenGod:tenGod,changsheng:changsheng,kongWang:kongWang,buildPillars:buildPillars,scoreWuxing:scoreWuxing,strengthScore:strengthScore,assessStrength:assessStrength,usefulElements:usefulElements,patternName:patternName,normalizePhenomenonName:normalizePhenomenonName,shenShaForPillar:shenShaForPillar,analyzePattern:analyzePattern,evaluateLuckImpact:evaluateLuckImpact,patternStructureRawScore:patternStructureRawScore,percentileFromHistogram:percentileFromHistogram,formatPatternPercentile:formatPatternPercentile,theoreticalGradeFromPercentile:theoreticalGradeFromPercentile,buildTheoreticalPatternBaseline:buildTheoreticalPatternBaseline,theoreticalBaseline:{version:THEORETICAL_BASELINE_VERSION,scoreModelVersion:PATTERN_SCORE_MODEL_VERSION,config:THEORETICAL_BASELINE_CONFIG,histogram:THEORETICAL_BASELINE_HISTOGRAM,stats:THEORETICAL_BASELINE_STATS}};
  root.BaziEngine=api;
  if(root.window)root.window.BaziEngine=api; // window.BaziEngine
})(typeof globalThis!=='undefined'?globalThis:this);
