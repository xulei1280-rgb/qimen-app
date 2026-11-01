/* 六爻 · 用神对照库（liuyao-usegod.js）
 * 依据《增删卜易·用神章》与《卜筮正宗·黄金策》各章，把常见问题归类到用神六亲或世应。
 * 只负责“问的是什么 → 取哪一类用神”，不改装卦、不判断吉凶。
 * 三层：① 对照库关键词归类 → ② 引导问答（无需术语）→ ③ AI 建议（结构化 JSON，校验后由用户采纳）。 */
(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.LiuyaoUseGod=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  var VERSION='LIUYAO-USEGOD-2026.11.01-v1';
  var RELATIVES=['父母','兄弟','官鬼','妻财','子孙'];
  // 生用神者为原神，克用神者为忌神（《增删卜易·用神元神忌神仇神章》）
  var YUAN={父母:'官鬼',兄弟:'父母',官鬼:'妻财',妻财:'子孙',子孙:'兄弟'};
  var JI={父母:'妻财',兄弟:'官鬼',官鬼:'子孙',妻财:'兄弟',子孙:'父母'};
  var SRC={
    yong:'《增删卜易·用神章》',
    yuanji:'《增删卜易·用神元神忌神仇神章》',
    food:'《卜筮正宗·黄金策》“财为饮食”“子孙固为药，又为酒肉”',
    tianshi:'《增删卜易·天时章》',
    travel:'《卜筮正宗·黄金策·出行、行人》',
    lawsuit:'《卜筮正宗·黄金策·词讼》“欲定输赢，须详世应”',
    illness:'《增删卜易·疾病章》',
    shiying:'《增删卜易·世应章》',
    lost:'《卜筮正宗·黄金策·失物》'
  };
  function rel(value,extra){var target={kind:'relative',value:value};for(var key in extra)target[key]=extra[key];return target}
  function role(value,extra){var target={kind:'role',value:value};for(var key in extra)target[key]=extra[key];return target}

  /* ---------- 对照库：类目 ---------- */
  var CATEGORIES=[
    {id:'food',label:'饮食酒食',use:'妻财',target:rel('妻财'),plain:'吃的喝的是可受用之物，取妻财；子孙生财，又主酒肉，是原神（福神）。',source:SRC.food+'；'+SRC.yong+'“一切使用之财物”',examples:'喝酒、啤酒、吃饭、聚餐、外卖、请客、奶茶',note:'子孙为原神兼酒肉之象；兄弟为忌神（劫财，主饮食少进）。'},
    {id:'money',label:'求财 · 财物',use:'妻财',target:rel('妻财'),plain:'钱、收入、生意、货物都属财物，取妻财。',source:SRC.yong+'“占货财、珠宝、金银……一切使用之财物”',examples:'工资、奖金、回款、投资、彩票、红包、生意'},
    {id:'item',label:'得到某物',use:'妻财',target:rel('妻财'),plain:'想得到的一般物品属于“使用之财物、什物、器皿”，取妻财。',source:SRC.yong,examples:'快递、礼物、手机、首饰、买到某样东西'},
    {id:'house',label:'房屋 · 车辆 · 衣物',use:'父母',target:rel('父母'),plain:'房屋、车船、衣服是“庇护我身者”，取父母。',source:SRC.yong+'“宅舍、屋宇、舟车、衣服……一切庇护我身者”',examples:'买房、租房、搬家、买车、驾照'},
    {id:'document',label:'考试 · 文书 · 合同 · 消息',use:'父母',target:rel('父母'),plain:'考试文章、合同证件、票据和音信都取父母。',source:SRC.yong+'“章奏、文书、文章、文契”；《黄金策》“父动卦中，当有鱼书之寄”',examples:'考试、成绩、合同、签证、证书、车票、回消息',note:'问能否录取、上榜，另参官鬼（功名）。'},
    {id:'job',label:'工作 · 求职 · 官运',use:'官鬼',target:rel('官鬼'),plain:'功名、职位、官府都取官鬼；子孙克官，是忌神。',source:SRC.yong+'“占功名、官府……皆以官鬼爻为用神”',examples:'工作、offer、面试、升职、跳槽、转正、编制'},
    {id:'lawsuit',label:'官司 · 纠纷',use:'世爻（对方看应爻）',target:role('shi',{counter:'ying'}),plain:'官司输赢看世应：世为自己，应为对头；官鬼为问官。',source:SRC.lawsuit,examples:'官司、起诉、仲裁、纠纷'},
    {id:'weatherRain',label:'天气 · 下雨',use:'父母',target:rel('父母'),plain:'占雨以父母为用神。',source:SRC.tianshi+'“父母为雨神”',examples:'下雨、下雪、会不会淋雨'},
    {id:'weatherSun',label:'天气 · 放晴',use:'妻财',target:rel('妻财'),plain:'占晴以妻财为用神，子孙为日月星斗。',source:SRC.tianshi+'“妻财为晴神”',examples:'天晴、放晴、出太阳、天气好'},
    {id:'medicine',label:'医药 · 医生',use:'子孙',target:rel('子孙'),plain:'医药、医生取子孙，子孙又是解忧、制鬼之神。',source:SRC.yong+'“占医士、医药……皆以子孙爻为用神”',examples:'吃药、疗效、医生、治疗方案'},
    {id:'illnessSelf',label:'自己的疾病',use:'世爻',target:role('shi'),plain:'本人问自己的病，以世爻代表自己；药物、医生另看子孙。',source:SRC.illness+'；'+SRC.shiying,examples:'我的病、身体、康复'},
    {id:'pregnancy',label:'怀孕 · 生育',use:'子孙',target:rel('子孙'),plain:'子女胎孕取子孙。',source:SRC.yong+'“占子孙……凡在我子孙辈中”',examples:'怀孕、备孕、生孩子'},
    {id:'parents',label:'父母 · 长辈 · 师长',use:'父母',target:rel('父母'),plain:'父母、长辈、老师都取父母爻。',source:SRC.yong+'“凡在我父母之上……及师长”',examples:'父亲、母亲、爷爷、老师、岳父'},
    {id:'children',label:'子女 · 晚辈 · 宠物',use:'子孙',target:rel('子孙'),plain:'子女、晚辈、学生、宠物都取子孙爻。',source:SRC.yong+'“子孙、女婿、侄、甥、门徒……六畜禽兽”',examples:'儿子、女儿、学生、猫、狗'},
    {id:'peers',label:'兄弟 · 朋友 · 同事',use:'兄弟',target:rel('兄弟'),plain:'兄弟姐妹、朋友同辈取兄弟爻。',source:SRC.yong+'“兄弟、姐妹……及结拜弟兄”',examples:'哥哥、姐姐、朋友、同事、同学',note:'表兄弟野鹤验以应爻，姐丈妹夫以世爻。'},
    {id:'wife',label:'妻子 · 女友（男占女）',use:'妻财',target:rel('妻财',{affinity:'ying'}),plain:'男占妻妾、女友取妻财。',source:SRC.yong+'“占妻妾……皆以财爻为用神”',examples:'老婆、妻子、女朋友'},
    {id:'husband',label:'丈夫 · 男友（女占男）',use:'官鬼',target:rel('官鬼',{affinity:'ying'}),plain:'妻占夫、女占男友取官鬼。',source:SRC.yong+'“妻占夫……以官鬼爻为用神”',examples:'老公、丈夫、男朋友'},
    {id:'love',label:'感情 · 婚姻（对象未指明）',use:'男问妻财，女问官鬼',target:null,plain:'按传统，男问对象取妻财，女问对象取官鬼；性别不明先看应爻。',source:SRC.yong,examples:'对象、另一半、复合、姻缘、相亲'},
    {id:'boss',label:'领导 · 上司',use:'官鬼',target:rel('官鬼'),plain:'领导、上司属“拘束我身者”，取官鬼。',source:SRC.yong+'“一切拘束我身者是也”',examples:'领导、老板、上司'},
    {id:'other',label:'第三方 · 对方',use:'应爻',target:role('ying'),plain:'问不属六亲的对方或他人，以应爻代表对方。',source:SRC.shiying,examples:'他、她、对方、客户、邻居'},
    {id:'travel',label:'出行 · 归期（自己）',use:'世爻',target:role('shi'),plain:'自己出行、回家，以世爻代表自己；等别人回来按关系取用。',source:SRC.travel,examples:'出差、旅行、回家、航班'},
    {id:'lost',label:'失物',use:'妻财（证件父母、宠物子孙）',target:rel('妻财'),plain:'一般钱物取妻财，证件文书取父母，宠物取子孙。',source:SRC.lost+'；'+SRC.yong,examples:'钱包、手机、证件、宠物走失'},
    {id:'self',label:'自身运势 · 吉凶',use:'世爻',target:role('shi'),plain:'问自己顺不顺、吉凶，以世爻代表自己。',source:SRC.shiying,examples:'今天顺利吗、运气、平安'}
  ];
  var BY_ID={};CATEGORIES.forEach(function(item){BY_ID[item.id]=item});

  /* ---------- 关键词（口语、同义词） ---------- */
  var W={
    food:/喝.{0,3}酒|喝(?:一|两|几|点|上)?(?:杯|口|瓶|罐|扎|盅)|喝到|喝上|喝点|喝一杯|干杯|小酌|整两口|整一口|微醺|喝两口|啤酒|白酒|红酒|黄酒|洋酒|酒水|饮酒|酒局|酒席|喜酒|吃饭|吃到|吃上|吃顿|聚餐|饭局|宴席|宴请|请客|请吃|外卖|夜宵|宵夜|早餐|早饭|午饭|午餐|晚饭|晚餐|大餐|火锅|烧烤|零食|奶茶|咖啡|饮料|美食|好吃的|吃的|喝的|撸串|酒/,
    money:/钱|工资|薪资|薪水|奖金|收入|回款|货款|利润|收益|投资|理财|股票|基金|彩票|中奖|红包|报销|分红|生意|买卖|赚|发财|财运|借到|贷款|赔偿|涨薪|加薪/,
    house:/房子|房屋|房产|买房|租房|房租|住房|新房|搬家|装修|车子|车辆|买车|汽车|新车|衣服|雨伞/,
    document:/合同|协议|签约|文书|证件|证书|手续|批文|审批|通知书|录取|考试|考研|考公|考编|成绩|论文|签证|护照|车票|机票|门票|驾照|消息|回信|回复|信息|音信|申请/,
    job:/工作|offer|职位|岗位|升职|晋升|求职|入职|录用|跳槽|转正|面试|事业|上班|升迁|官运|当官|考核|编制|裁员|辞职/i,
    lawsuit:/官司|诉讼|起诉|仲裁|判决|被告|原告|上诉|纠纷|打赢/,
    pregnancy:/怀孕|有孕|备孕|生孩子|胎儿|生产|顺产|二胎/,
    item:/快递|包裹|东西|物品|手机|电脑|首饰|钱包|礼物|买到|抢到|拿到|得到|中签/,
    rain:/下雨|下雪|降雨|雨天|淋雨|暴雨|会不会雨|有雨/,
    sun:/天晴|晴天|放晴|出太阳|晴不晴|天气好/,
    weather:/天气/,
    travel:/出行|出差|旅行|旅游|出门|行程|航班|飞机|高铁|火车|自驾|出国|回家|回来|到家|回国|归期|到达/,
    self:/运势|运气|顺利|顺不顺|吉凶|平安|心情|状态|今天怎么样|好不好/
  };
  var PERSONS=[
    {cat:'parents',re:/父亲|母亲|爸爸|妈妈|老爸|老妈|爸|妈|父母|爷爷|奶奶|外公|外婆|姥姥|姥爷|长辈|老师|师父|师傅|岳父|岳母|公公|婆婆|叔叔|阿姨|舅舅|姑姑|伯伯/g},
    {cat:'children',re:/儿子|女儿|孩子|小孩|宝宝|子女|孙子|孙女|外孙|侄子|侄女|外甥|学生|徒弟|晚辈|女婿|宠物|猫咪|小猫|狗狗|小狗|猫|狗/g},
    {cat:'peers',re:/哥哥|弟弟|姐姐|妹妹|兄弟|姐妹|朋友|同事|同学|闺蜜|室友|合伙人|同行|竞争对手|对手/g},
    {cat:'wife',re:/老婆|妻子|媳妇|太太|女朋友|女友|未婚妻/g},
    {cat:'husband',re:/老公|丈夫|男朋友|男友|未婚夫/g},
    {cat:'love',re:/对象|另一半|喜欢的人|暗恋|心上人|相亲|复合|桃花|姻缘|婚姻|结婚|脱单/g},
    {cat:'boss',re:/领导|上司|老板|经理|主管/g}
  ];
  var WEAK_PERSON=/他|她|对方|客户|甲方|乙方|那个人|这个人|某人|房东|邻居/;
  var COMPANION=/(和|跟|与|同|陪|带|请|约|叫上|喊上)$/;

  function personHits(q){
    var hits=[];
    PERSONS.forEach(function(group){
      group.re.lastIndex=0;var match;
      while((match=group.re.exec(q))){
        var before=q.slice(Math.max(0,match.index-2),match.index);
        hits.push({cat:group.cat,word:match[0],index:match.index,companion:COMPANION.test(before)||/^(和|跟|与|同|陪|约)/.test(before.slice(-1))});
      }
    });
    // 去掉被更长词覆盖的短词（如“爸爸”里的“爸”）
    return hits.filter(function(hit){return !hits.some(function(other){return other!==hit&&other.word.length>hit.word.length&&other.index<=hit.index&&other.index+other.word.length>=hit.index+hit.word.length})});
  }
  function loveTarget(gender){
    if(gender==='男')return rel('妻财',{affinity:'ying'});
    if(gender==='女')return rel('官鬼',{affinity:'ying'});
    return role('ying');
  }
  function targetKey(target){return target?target.kind+':'+target.value:''}
  function finish(categoryId,target,reason,keyword){
    var category=BY_ID[categoryId]||null,out={};
    for(var key in target)out[key]=target[key];
    out.category=categoryId;out.categoryLabel=category?category.label:'';
    out.source=category?category.source:'';
    out.plain=category?category.plain:'';
    if(out.kind==='relative'){out.yuan=YUAN[out.value];out.ji=JI[out.value]}
    out.reason=reason||(category?category.plain:'');
    if(keyword)out.keyword=keyword;
    return {status:'matched',target:out};
  }
  function ambiguous(reason,start){return {status:'ambiguous',reason:reason,guideStart:start||'topic'}}

  /* ---------- 归类 ---------- */
  function classify(record){
    var q=String(record&&record.question||''),type=record&&record.questionType,asker=record&&record.asker||{},gender=asker.gender;
    var clean=q.replace(/酒店|酒吧街|饭店老板/g,'');
    var documentWords=/合同|协议|签约|文书|证件|证书|手续|批文|通知|录取|考试|申请|签证|车票|机票|房屋|房产|车辆|车子/;
    var moneyWords=/钱|财|收入|工资|薪资|奖金|回款|货款|欠款|利润|收益|投资|交易|生意|买卖|价格|分成|货物|物品|手机|首饰|钱包/;
    var childWords=/孩子|子女|宝宝|怀孕|胎儿|宠物|猫|狗|娱乐|休假/;
    var medicineWords=/这个药|医药|药物|药效|疗效|用药|吃药|喝药|中药|治疗方案|医生|医师|求医/;
    var healthWords=/生病|疾病|病情|症状|身体|健康|康复|痊愈|手术|住院|我的病|我这个病/;
    // 先辨问事目标和人物关系；多主体问题交给引导问答或人工确认。
    if(/欠.*钱|欠款|回款|货款|还钱|讨债|收款/.test(q))return finish('money',rel('妻财'),'问题核心是款项能否收回，先取妻财爻；债务人的身份另行参考。');
    if(type==='lost'){
      if(documentWords.test(q)||/身份证|驾照|护照|户口本|文件|衣服|雨伞/.test(q))return finish('lost',rel('父母'),'失物问题提到证件、文书、衣物、房屋或车辆，传统上先取父母爻。');
      if(/宠物|猫|狗|鸟|鱼/.test(q))return finish('lost',rel('子孙'),'寻找宠物，传统上先取子孙爻。');
      return finish('lost',rel('妻财'),'一般钱物、随身物品或货物失踪，传统上先取妻财爻。');
    }
    if(medicineWords.test(q)&&healthWords.test(q))return ambiguous('问题同时涉及病情和医药，需要确认问的是病人还是药/医生。','illness');
    if(medicineWords.test(q))return finish('medicine',rel('子孙'),'问题的核心是药物、疗效、治疗方案或求医，传统上先取子孙爻核对医药因素。');
    if(healthWords.test(q)){
      var subjects=q.match(/父亲|母亲|爸爸|妈妈|老爸|老妈|丈夫|老公|妻子|老婆|儿子|女儿|孩子|兄弟|姐妹|哥哥|弟弟|姐姐|妹妹|朋友|同事|爸|妈/g)||[];
      if(subjects.length>1||asker.mode!=='self')return ambiguous('病人身份不明确，需要确认问的是谁的病。','illness');
      if(subjects.length===1){
        if(!new RegExp('^(?:请问|想问|我想问|我想知道)?(?:我(?:的)?|家里(?:的)?)?'+subjects[0]+'(?:的)?(?:病|健康|身体|手术|住院|能否|能不能|能康复)').test(q))return ambiguous('句中提到'+subjects[0]+'，但看不出是谁生病。','illness');
        var subject=subjects[0],relative=/父|母|爸|妈/.test(subject)?'父母':(/儿子|女儿|孩子/.test(subject)?'子孙':(/丈夫|老公/.test(subject)?'官鬼':(/妻子|老婆/.test(subject)?'妻财':'兄弟')));
        var subjectCategory={父母:'parents',子孙:'children',官鬼:'husband',妻财:'wife',兄弟:'peers'}[relative];
        return finish(subjectCategory,rel(relative),'问的是'+subject+'的健康，先按其与求测人的关系取'+relative+'爻，而非将本人求测等同于本人患病。');
      }
      if(/他|她|对方|别人|患者|病人/.test(q))return ambiguous('问的是别人的病，需要确认与你的关系。','illness');
      if(asker.mode==='self')return finish('illnessSelf',role('shi'),'本人问自身疾病、健康或康复，先以世爻代表求测人；药物或医生另看子孙爻。');
      return ambiguous('病人身份不明确。','illness');
    }
    if(childWords.test(q)&&documentWords.test(q))return ambiguous('问题同时涉及孩子和考试/文书，需要确认问的是孩子本身还是文书结果。','topic');
    if(type&&type!=='other'){
      var typeResult=classifyByType(q,type,gender),text=classifyFreeText(clean,gender);
      if(text.objectCat&&TEXT_WINS[text.objectCat]){
        var typeLabel=TYPE_LABELS[type]||type;
        var hint=TYPE_HINTS[type];
        if(text.status!=='matched')return ambiguous(text.reason+'（所选问事类型为“'+typeLabel+'”，请点选确认问的是什么。）',text.guideStart);
        if(typeResult&&targetKey(typeResult.target)!==targetKey(text.target)&&hint&&hint.test(clean))return ambiguous('问题里既有“'+text.target.keyword+'”（'+text.target.categoryLabel+'），又有“'+clean.match(hint)[0]+'”（'+typeLabel+'），请点选确认主要问哪件事。','topic');
        var out=text.target;out.basis='text';
        selfAffinity(out,asker);
        if(typeResult&&targetKey(typeResult.target)!==targetKey(out)){
          out.conflict={typeId:type,typeLabel:typeLabel,textLabel:out.categoryLabel,textUse:out.kind==='relative'?out.value:roleName(out.value),typeUse:typeResult.target.kind==='relative'?typeResult.target.value:roleName(typeResult.target.value),typeTarget:typeResult.target,notice:'问题内容像“'+out.categoryLabel+'”，与所选类型“'+typeLabel+'”不一致，已按问题内容取'+(out.kind==='relative'?out.value:roleName(out.value))+'。'};
        }
        return {status:'matched',target:out};
      }
      if(typeResult)return typeResult;
    }
    var free=classifyFreeText(clean,gender);if(free.status==='matched'){free.target.basis='text';selfAffinity(free.target,asker)}return free;
  }

  // 按所选问事类型取用神（问题文字里没有更明确的事物时使用）。
  function classifyByType(q,type,gender){
    var documentWords=/合同|协议|签约|文书|证件|证书|手续|批文|通知|录取|考试|申请|签证|车票|机票|房屋|房产|车辆|车子/;
    var moneyWords=/钱|财|收入|工资|薪资|奖金|回款|货款|欠款|利润|收益|投资|交易|生意|买卖|价格|分成|货物|物品|手机|首饰|钱包/;
    var r=(function(){
    if(type==='love'){
      if(gender==='男')return finish('wife',rel('妻财',{affinity:'ying'}),'按传统纳甲惯例，男问感情对象先取妻财爻，并结合应爻核对对方。');
      if(gender==='女')return finish('husband',rel('官鬼',{affinity:'ying'}),'按传统纳甲惯例，女问感情对象先取官鬼爻，并结合应爻核对对方。');
      return finish('other',role('ying'),'未采用传统男女配偶星区分，先以应爻代表对方，再手动核对六亲。');
    }
    if(type==='career'){
      if(documentWords.test(q))return finish('document',rel('父母',{affinity:'shi'}),'问题重点是考试、录取、合同、证书或手续，先取父母爻。');
      if(/工资|薪资|奖金|收入|待遇/.test(q))return finish('money',rel('妻财',{affinity:'shi'}),'问题重点是工作带来的收入或待遇，先取妻财爻。');
      return finish('job',rel('官鬼',{affinity:'shi'}),'事业、岗位、职位和升迁问题，传统上先取官鬼爻。');
    }
    if(type==='wealth'){
      if(documentWords.test(q)&&!/钱|回款|利润|收益|交易/.test(q))return finish('document',rel('父母',{affinity:'shi'}),'问题重点落在合同、票据或产权手续，先取父母爻。');
      return finish('money',rel('妻财',{affinity:'shi'}),'钱财、交易、回款和收益问题，传统上先取妻财爻。');
    }
    if(type==='cooperation'){
      if(documentWords.test(q))return finish('document',rel('父母',{affinity:'ying'}),'合作问题重点是合同、协议或签约手续，先取父母爻。');
      if(moneyWords.test(q))return finish('money',rel('妻财',{affinity:'ying'}),'合作问题重点是回款、利润或分成，先取妻财爻。');
      return finish('other',role('ying'),'合作与谈判首先观察作为对方位置的应爻。');
    }
    if(type==='travel'){
      if(documentWords.test(q))return finish('document',rel('父母',{affinity:'shi'}),'出行问题重点是签证、票证、车辆或手续，先取父母爻。');
      return finish('travel',role('shi'),'一般出行与迁动先观察代表求测人的世爻，再结合动爻。');
    }
      return null;
    })();
    if(r){var label=TYPE_LABELS[type]||type;r.target.basis='type';r.target.typeId=type;r.target.reason='按所选问事类型“'+label+'”：'+r.target.reason}
    return r;
  }
  // 本人求测、问自己能否得到某物：同类六亲多现且旺衰排不出先后时，先看持世之爻。
  function selfAffinity(target,asker){if(target.kind==='relative'&&!target.affinity&&(!asker||asker.mode!=='other')&&/^(food|money|item|house)$/.test(target.category))target.affinity='shi'}
  function roleName(value){return value==='shi'?'世爻':(value==='ying'?'应爻':value)}
  // 问题文字里出现这些“想得到的东西/天时/官司”时，以问题内容为准，不被问事类型的默认用神覆盖。
  var TEXT_WINS={food:1,money:1,item:1,house:1,rain:1,sun:1,lawsuit:1,pregnancy:1};
  var TYPE_LABELS={career:'事业工作',wealth:'财运交易',love:'感情关系',cooperation:'合作谈判',travel:'出行迁动',lost:'寻找失物',other:'其他具体事项'};
  var TYPE_HINTS={career:/工作|offer|职位|岗位|升职|晋升|求职|入职|录用|跳槽|转正|面试|事业|上班|升迁|官运|考核|编制|裁员|辞职|领导|老板|公司|单位/i,wealth:null,love:/感情|对象|另一半|喜欢|暗恋|复合|桃花|姻缘|婚姻|结婚|脱单|男朋友|女朋友|男友|女友|老公|老婆|恋爱|表白/,cooperation:/合作|谈判|合伙|项目|签约|客户|甲方|乙方/,travel:/出行|出差|旅行|旅游|出门|行程|航班|飞机|高铁|火车|自驾|出国|回家|到家|回国/};
  // 选类型前的小提示：问题内容明显属于另一类时，建议改选的问事类型。
  var CATEGORY_TYPE={food:'other',money:'wealth',item:'other',house:'other',weatherRain:'other',weatherSun:'other',lawsuit:'other',pregnancy:'other'};
  function suggestType(question,type){
    if(!question||!type||type==='other'||type==='lost')return null;
    var r=classify({question:question,questionType:type,asker:{mode:'self'}});
    if(r.status!=='matched'||!r.target.conflict)return null;
    var to=CATEGORY_TYPE[r.target.category]||'other';if(to===type)return null;
    return {type:to,typeLabel:TYPE_LABELS[to],categoryLabel:r.target.categoryLabel,fromLabel:TYPE_LABELS[type]};
  }

  // “其他具体事项”：按对照库关键词归类。事物（想得到什么）优先；句中主语是某个亲友且与事物不同类时，交给引导问答。
  function classifyFreeText(q,gender){
    var objects=[
      ['rain',W.rain],['sun',W.sun],['lawsuit',W.lawsuit],['food',W.food],['money',W.money],['house',W.house],['document',W.document],['job',W.job],['pregnancy',W.pregnancy],['item',W.item]
    ],object=null;
    for(var i=0;i<objects.length;i++){var m=q.match(objects[i][1]);if(m){object={cat:objects[i][0],word:m[0]};break}}
    if(!object&&W.weather.test(q))return ambiguous('问的是天气，需要确认是问下雨还是放晴。','weather');
    var persons=personHits(q).filter(function(hit){return !hit.companion});
    var personTargets={};persons.forEach(function(hit){var t=hit.cat==='love'?loveTarget(gender):BY_ID[hit.cat].target;personTargets[targetKey(t)]={hit:hit,target:t}});
    var personKeys=Object.keys(personTargets);
    var objectCategory=object?BY_ID[object.cat==='rain'?'weatherRain':(object.cat==='sun'?'weatherSun':object.cat)]:null;
    if(object&&personKeys.length){
      var objectKey=targetKey(objectCategory.target);
      if(personKeys.length===1&&personKeys[0]===objectKey){var same=finish(objectCategory.id,objectCategory.target,objectCategory.plain+'（句中“'+object.word+'”）',object.word);same.objectCat=object.cat;return same}
      var who=persons.map(function(hit){return hit.word}).join('、');
      var amb=ambiguous('句中既有“'+who+'”，又有“'+object.word+'”，不确定问的是这个人还是这件事。','topic');amb.objectCat=object.cat;return amb;
    }
    if(object){var hit=finish(objectCategory.id,objectCategory.target,objectCategory.plain+'（句中“'+object.word+'”）',object.word);if(!(object.cat==='item'&&/^(?:拿到|得到|买到|抢到|东西)$/.test(object.word)))hit.objectCat=object.cat;return hit}
    if(personKeys.length>1)return ambiguous('句中提到多个人（'+persons.map(function(hit){return hit.word}).join('、')+'），需要确认问的是谁。','relation');
    if(personKeys.length===1){
      var only=personTargets[personKeys[0]],category=BY_ID[only.hit.cat];
      if(only.hit.cat==='love'){
        var lt=only.target,reason=lt.kind==='role'?'问感情对象但未指明性别，先以应爻代表对方。':(lt.value==='妻财'?'男问感情对象，按传统取妻财，并结合应爻。':'女问感情对象，按传统取官鬼，并结合应爻。');
        return finish(lt.kind==='role'?'other':(lt.value==='妻财'?'wife':'husband'),lt,reason+'（句中“'+only.hit.word+'”）',only.hit.word);
      }
      return finish(category.id,category.target,category.plain+'（句中“'+only.hit.word+'”）',only.hit.word);
    }
    if(WEAK_PERSON.test(q)){var weak=q.match(WEAK_PERSON)[0];return finish('other',role('ying'),'问题主要询问另一方，先以应爻代表对方。（句中“'+weak+'”）',weak)}
    var travel=q.match(W.travel);if(travel)return finish('travel',role('shi'),BY_ID.travel.plain+'（句中“'+travel[0]+'”）',travel[0]);
    var self=q.match(W.self);if(self)return finish('self',role('shi'),BY_ID.self.plain+'（句中“'+self[0]+'”）',self[0]);
    return {status:'none',reason:'对照库没有找到能确定用神的关键词。',guideStart:'topic'};
  }

  /* ---------- 引导问答：不需要术语，2–3 步 ---------- */
  function g(label,target,category,reason){return {label:label,target:target,category:category,reason:reason}}
  var GUIDE={
    topic:{title:'你问的主要是哪一类？',options:[
      {id:'self',label:'我自己的状态、顺不顺、吉凶',done:g('自身吉凶',role('shi'),'self','问自身状态与吉凶，以世爻代表自己。')},
      {id:'get',label:'能不能得到某样东西（钱、吃的喝的、物品…）',next:'thing'},
      {id:'person',label:'某个人的情况、态度或消息',next:'relation'},
      {id:'job',label:'工作、职位、升职、offer',done:g('工作',rel('官鬼'),'job','问工作职位取官鬼。')},
      {id:'doc',label:'考试、合同、证件、文书',done:g('文书',rel('父母'),'document','问考试文书取父母。')},
      {id:'ill',label:'疾病、身体、看病吃药',next:'illness'},
      {id:'trip',label:'出行，或等人回来',next:'trip'},
      {id:'lost',label:'找丢失的东西',next:'lostThing'},
      {id:'weather',label:'天气（下雨还是放晴）',next:'weather'},
      {id:'lawsuit',label:'官司、纠纷、和人相争',done:g('官司',role('shi',{counter:'ying'}),'lawsuit','官司看世应：世为自己，应为对方。')}
    ]},
    thing:{title:'想得到的是什么？',options:[
      {id:'money',label:'钱、收入、生意回报',done:g('钱财',rel('妻财'),'money','钱财取妻财。')},
      {id:'food',label:'吃的、喝的（饭、酒、外卖…）',done:g('饮食',rel('妻财'),'food','饮食取妻财，子孙为原神。')},
      {id:'item',label:'一般物品、快递、礼物',done:g('物品',rel('妻财'),'item','一般物品取妻财。')},
      {id:'house',label:'房子、车子、衣物',done:g('房车衣物',rel('父母'),'house','房屋车辆衣物取父母。')},
      {id:'paper',label:'证件、票据、合同、消息',done:g('文书',rel('父母'),'document','文书票据音信取父母。')},
      {id:'pet',label:'宠物',done:g('宠物',rel('子孙'),'children','宠物取子孙。')}
    ]},
    relation:{title:'这个人和你（求测人）是什么关系？',options:[
      {id:'elder',label:'父母、长辈、老师',done:g('长辈',rel('父母'),'parents','父母长辈师长取父母。')},
      {id:'junior',label:'子女、晚辈、学生、宠物',done:g('晚辈',rel('子孙'),'children','子女晚辈取子孙。')},
      {id:'peer',label:'兄弟姐妹、朋友、同事、同学',done:g('同辈',rel('兄弟'),'peers','兄弟朋友同辈取兄弟。')},
      {id:'partner',label:'伴侣、对象、喜欢的人',next:'partner'},
      {id:'boss',label:'领导、上司',done:g('领导',rel('官鬼'),'boss','领导上司取官鬼。')},
      {id:'stranger',label:'客户、对手、其他人',done:g('对方',role('ying'),'other','不属六亲的对方看应爻。')}
    ]},
    partner:{title:'对方是？',options:[
      {id:'female',label:'女性',done:g('女方',rel('妻财',{affinity:'ying'}),'wife','男占女、问女方取妻财。')},
      {id:'male',label:'男性',done:g('男方',rel('官鬼',{affinity:'ying'}),'husband','女占男、问男方取官鬼。')},
      {id:'neutral',label:'不按性别区分',done:g('对方',role('ying'),'other','不按性别区分时看应爻。')}
    ]},
    illness:{title:'问的是？',options:[
      {id:'mine',label:'我自己的病或身体',done:g('自己的病',role('shi'),'illnessSelf','本人疾病看世爻。')},
      {id:'drug',label:'药物、医生、治疗方案',done:g('医药',rel('子孙'),'medicine','医药医生取子孙。')},
      {id:'others',label:'别人的病',next:'relation'}
    ]},
    trip:{title:'具体是？',options:[
      {id:'me',label:'我自己出门顺不顺、能否回家',done:g('自己出行',role('shi'),'travel','自己出行看世爻。')},
      {id:'wait',label:'等别人回来或到达',next:'relation'}
    ]},
    lostThing:{title:'丢的是什么？',options:[
      {id:'goods',label:'钱包、手机、首饰等财物',done:g('财物',rel('妻财'),'lost','一般财物取妻财。')},
      {id:'papers',label:'证件、文件、衣物',done:g('证件',rel('父母'),'lost','证件文书衣物取父母。')},
      {id:'pet',label:'宠物',done:g('宠物',rel('子孙'),'lost','宠物取子孙。')}
    ]},
    weather:{title:'想知道的是？',options:[
      {id:'rain',label:'会不会下雨、下雪',done:g('下雨',rel('父母'),'weatherRain','占雨以父母为用神。')},
      {id:'sun',label:'会不会放晴、天气好不好',done:g('放晴',rel('妻财'),'weatherSun','占晴以妻财为用神。')}
    ]}
  };
  function guideStep(answers,start){
    var nodeId=start&&GUIDE[start]?start:'topic',path=[];answers=Array.isArray(answers)?answers:[];
    for(var i=0;i<answers.length;i++){
      var node=GUIDE[nodeId],option=node&&node.options.find(function(item){return item.id===answers[i]});
      if(!option)return {done:false,error:'无效的选项：'+answers[i],nodeId:nodeId,node:GUIDE[nodeId],path:path};
      path.push(option.label);
      if(option.done){
        var category=BY_ID[option.done.category],result=finish(option.done.category,option.done.target,category?category.plain:option.done.reason).target;
        result.guidePath=path.slice();
        return {done:true,target:result,path:path};
      }
      nodeId=option.next;
    }
    return {done:false,nodeId:nodeId,node:GUIDE[nodeId],path:path,step:path.length+1};
  }

  /* ---------- AI 建议：结构化 JSON，校验后才可采纳 ---------- */
  function buildAiMessages(input){
    input=input||{};
    var lines=(input.lines||[]).map(function(line){return line.label+'：'+line.relative+line.stemBranch+(line.shi?'（世）':line.ying?'（应）':'')+(line.hidden?'；伏神 '+line.hidden:'')}).join('\n');
    var table=CATEGORIES.map(function(item){return item.label+' → '+item.use}).join('；');
    var system='你是纳甲六爻的用神助手，只判断“这个问题应取哪一类用神”，不判断吉凶、不预测结果。依据《增删卜易·用神章》《卜筮正宗》：'+table+'。只输出一个 JSON 对象，不要任何其他文字：{"kind":"relative"或"role","value":"父母|兄弟|官鬼|妻财|子孙（kind=relative）或 shi|ying（kind=role）","reason":"不超过80字、给初学者看的中文理由"}。';
    var user='问题：'+String(input.question||'')+'\n问事类型：'+String(input.questionType||'')+'\n求测人：'+String(input.asker||'')+'\n本卦六爻（上爻在前）：\n'+lines;
    return [{role:'system',content:system},{role:'user',content:user}];
  }
  function parseAiSuggestion(text){
    var errors=[],raw=String(text==null?'':text).trim();
    raw=raw.replace(/^```(?:json)?\s*/i,'').replace(/```\s*$/,'').trim();
    var start=raw.indexOf('{'),end=raw.lastIndexOf('}');
    if(start<0||end<=start)return {valid:false,errors:['AI 没有返回 JSON']};
    var data;try{data=JSON.parse(raw.slice(start,end+1))}catch(error){return {valid:false,errors:['AI 返回的 JSON 无法解析']}}
    if(!data||typeof data!=='object'||Array.isArray(data))return {valid:false,errors:['AI 返回的不是对象']};
    var kind=String(data.kind||'').trim(),value=String(data.value||'').trim(),reason=String(data.reason||'').replace(/\s+/g,' ').trim();
    var roleAlias={'世':'shi','世爻':'shi','应':'ying','应爻':'ying'};
    if(roleAlias[value]){kind='role';value=roleAlias[value]}
    if(RELATIVES.indexOf(value)>=0&&!kind)kind='relative';
    if(kind!=='relative'&&kind!=='role')errors.push('kind 必须是 relative 或 role');
    if(kind==='relative'&&RELATIVES.indexOf(value)<0)errors.push('六亲必须是 父母/兄弟/官鬼/妻财/子孙 之一');
    if(kind==='role'&&value!=='shi'&&value!=='ying')errors.push('世应只能是 shi 或 ying');
    if(reason.length<4)errors.push('缺少理由');
    if(reason.length>160)reason=reason.slice(0,160)+'…';
    if(errors.length)return {valid:false,errors:errors};
    var target={kind:kind,value:value,reason:reason,category:'ai',categoryLabel:'AI 建议',source:'AI 建议（DeepSeek），需人工采纳'};
    if(kind==='relative'){target.yuan=YUAN[value];target.ji=JI[value]}
    return {valid:true,target:target,errors:[]};
  }

  return {
    version:VERSION,relatives:RELATIVES.slice(),yuan:YUAN,ji:JI,sources:SRC,categories:CATEGORIES,guide:GUIDE,
    classify:classify,guideStep:guideStep,buildAiMessages:buildAiMessages,parseAiSuggestion:parseAiSuggestion,personHits:personHits,suggestType:suggestType,typeLabels:TYPE_LABELS
  };
});
