(function(root,factory){
  var api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.DailyFortuneEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  'use strict';

  var ENGINE_VERSION='DAILY-FORTUNE-2026.08-v3.1';
  var OUTLOOK_REVISION='DAILY-FOCUS-2026.08-v3.1';
  var PROMPT_VERSION='DAILY-PROMPT-2026.08-v3.1';
  var TIMELINE_PROMPT_VERSION='TIMELINE-PROMPT-2026.08-v2.1';
  var STEMS='甲乙丙丁戊己庚辛壬癸';
  var BRANCHES='子丑寅卯辰巳午未申酉戌亥';
  var GZ60=Array.from({length:60},function(_,i){return STEMS[i%10]+BRANCHES[i%12]});
  var STEM_COMBINE={甲己:'合土',乙庚:'合金',丙辛:'合水',丁壬:'合木',戊癸:'合火'};
  var STEM_CLASH={甲庚:'冲',乙辛:'冲',丙壬:'冲',丁癸:'冲'};
  var BRANCH_RELATIONS={
    六合:['子丑','寅亥','卯戌','辰酉','巳申','午未'],
    冲:['子午','丑未','寅申','卯酉','辰戌','巳亥'],
    害:['子未','丑午','寅巳','卯辰','申亥','酉戌'],
    破:['子酉','丑辰','寅亥','卯午','巳申','未戌']
  };
  var PUNISH_PAIRS=['子卯','寅巳','巳申','寅申','丑戌','未戌','丑未'];
  var SELF_PUNISH='辰午酉亥';
  var DAY_GROUPS=[
    {members:'申子辰',name:'申子辰三合水局线索'},
    {members:'亥卯未',name:'亥卯未三合木局线索'},
    {members:'寅午戌',name:'寅午戌三合火局线索'},
    {members:'巳酉丑',name:'巳酉丑三合金局线索'},
    {members:'寅卯辰',name:'寅卯辰三会木局线索'},
    {members:'巳午未',name:'巳午未三会火局线索'},
    {members:'申酉戌',name:'申酉戌三会金局线索'},
    {members:'亥子丑',name:'亥子丑三会水局线索'}
  ];
  var GOD_THEMES={
    比肩:{domain:'分工与自主',meaning:'同类力量增强，重点是自己做主和同辈分工',action:'先定自己的责任范围，再协调别人',event:'分工、排期或同辈协作需要重新确认'},
    劫财:{domain:'资源协调',meaning:'多人争用同一份时间、预算或注意力',action:'先说清资源归属与交换条件',event:'共同支出、资源分配或协作条件出现调整'},
    食神:{domain:'表达与交付',meaning:'想法需要通过文字、作品、讲解或服务落地',action:'先完成可交付版本，再继续润色',event:'文稿、方案、内容或服务进入提交与反馈环节'},
    伤官:{domain:'变更与边界',meaning:'现有规则容易被质疑，做法也可能临时调整',action:'先确认允许改到哪里，再提出不同意见',event:'临时修改、规则异议或返工问题浮现'},
    偏财:{domain:'外部机会',meaning:'注意力转向客户、交易、临时资源和外部连接',action:'先核实条件与成本，再接临时机会',event:'临时合作、报价、采购或外部资源进入视野'},
    正财:{domain:'日常责任',meaning:'重点落在可核对的账目、进度和日常责任',action:'先把数字、期限和责任人对齐',event:'账目、付款、固定任务或生活安排需要确认'},
    七杀:{domain:'压力处置',meaning:'外部要求更硬，事情需要快速取舍和风险控制',action:'先处理有截止和后果的事项，避免硬碰硬',event:'催办、考核、突发任务或竞争压力需要回应'},
    正官:{domain:'规则推进',meaning:'流程、职责、审批和公开承诺成为重点',action:'按流程补齐依据，再推进正式事项',event:'审批、汇报、合同流程或职责交接进入节点'},
    偏印:{domain:'方案调整',meaning:'旧方法未必顺手，需要补信息或换一条路径',action:'先验证关键假设，再试用替代方案',event:'资料补充、工具更换或非常规方案需要评估'},
    正印:{domain:'学习与支持',meaning:'知识、凭据、支持资源和恢复条件更重要',action:'先补齐资料与支持，再承担新增任务',event:'学习、证照、文书或支持资源出现进展'}
  };
  var TARGET_SCOPES={year:'外部关系',month:'工作事务',day:'自身与核心关系',hour:'计划与后续安排',natalYear:'外部关系',natalMonth:'工作事务',natalDay:'自身与核心关系',natalHour:'计划与后续安排',luck:'十年阶段',flowYear:'年度阶段',flowMonth:'本月阶段',flowDay:'当天事务'};
  var DOMAIN_ACTIONS={
    财务:'先核对金额、对象和付款或回款时间',工作:'先核对负责人、交付物和截止时间',人际合作:'先核对分工、承诺和交换条件',
    亲密关系:'先确认双方理解和边界，不替对方下结论',学习文书:'先核对资料、版本和凭证',状态恢复:'减少新增负担，留出恢复时间',生活安排:'先核对时间、顺序和现实约束'
  };
  var WEAK_RELATIONS=['刑','害','破'];

  function getEngine(){
    if(!root.BaziEngine)throw new Error('缺少 BaziEngine');
    return root.BaziEngine;
  }
  function clone(value){return JSON.parse(JSON.stringify(value))}
  function pad(value){return String(value).padStart(2,'0')}
  function dateKey(value){
    if(typeof value==='string'){
      var match=value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if(!match)throw new Error('日期格式应为 YYYY-MM-DD');
      value={year:Number(match[1]),month:Number(match[2]),day:Number(match[3])};
    }else if(value instanceof Date)value={year:value.getFullYear(),month:value.getMonth()+1,day:value.getDate()};
    if(!value||!Number.isInteger(value.year)||!Number.isInteger(value.month)||!Number.isInteger(value.day))throw new Error('日期无效');
    var check=new Date(value.year,value.month-1,value.day,12);
    if(check.getFullYear()!==value.year||check.getMonth()+1!==value.month||check.getDate()!==value.day)throw new Error('日期无效');
    return value.year+'-'+pad(value.month)+'-'+pad(value.day);
  }
  function dateParts(value){
    var key=dateKey(value),parts=key.split('-').map(Number);
    return {year:parts[0],month:parts[1],day:parts[2]};
  }
  function dateValue(value){var t=dateParts(value);return new Date(t.year,t.month-1,t.day,12).getTime()}
  function chinaDateKey(value){
    var date=value instanceof Date?value:new Date(value),china=new Date(date.getTime()+8*3600000);
    return dateKey({year:china.getUTCFullYear(),month:china.getUTCMonth()+1,day:china.getUTCDate()});
  }
  function chinaNoonValue(value){var t=dateParts(value);return Date.UTC(t.year,t.month-1,t.day,4)}
  function addDays(value,days){
    var t=dateParts(value),date=new Date(t.year,t.month-1,t.day,12);
    date.setDate(date.getDate()+days);
    return dateKey(date);
  }
  function effectiveDateKey(calendarDate,time){
    var hour=Number(String(time||'00:00').split(':')[0]);
    return hour>=23?addDays(calendarDate,1):dateKey(calendarDate);
  }
  function orderedPair(a,b,order){return order.indexOf(a)<=order.indexOf(b)?a+b:b+a}
  function unique(values){return values.filter(function(value,index){return value&&values.indexOf(value)===index})}
  function simpleHash(text){
    var hash=2166136261;
    for(var i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619)}
    return (hash>>>0).toString(36);
  }
  function profileFingerprint(bazi){
    if(!bazi||!bazi.pillars||!bazi.time||!bazi.time.used)throw new Error('命主八字资料不完整');
    var p=bazi.pillars,t=bazi.time.used;
    return [bazi.gender||'',t.year,t.month,t.day,t.hour||0,t.minute||0,p.year,p.month,p.day,p.hour].join('|');
  }
  function recordPerson(item){
    var bazi=item&&item.bazi||{},person=String(bazi.person||'').trim();
    if(person&&person!=='测试')return person;
    return String(item&&item.name||'未命名').replace(/\s*[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]日\s*$/,'').trim()||'未命名';
  }
  function profileFromBaziRecord(item,importedAt){
    if(!item||!item.bazi)throw new Error('八字记录缺少盘面');
    var fingerprint=profileFingerprint(item.bazi);
    return {
      id:'daily-profile-'+simpleHash(fingerprint),
      name:recordPerson(item),
      fingerprint:fingerprint,
      sourceRecordId:String(item.id||''),
      importedAt:importedAt||new Date().toISOString(),
      bazi:clone(item.bazi)
    };
  }
  function stemRelations(a,b){
    var pair=orderedPair(a,b,STEMS),out=[];
    if(STEM_COMBINE[pair])out.push(STEM_COMBINE[pair]);
    if(STEM_CLASH[pair])out.push(STEM_CLASH[pair]);
    return out;
  }
  function branchRelations(a,b){
    var pair=orderedPair(a,b,BRANCHES),out=[];
    Object.keys(BRANCH_RELATIONS).forEach(function(name){if(BRANCH_RELATIONS[name].indexOf(pair)>=0)out.push(name)});
    if((a===b&&SELF_PUNISH.indexOf(a)>=0)||PUNISH_PAIRS.indexOf(pair)>=0)out.push('刑');
    return out;
  }
  function relationBetween(source,target){
    var stems=stemRelations(source.gz[0],target.gz[0]),branches=branchRelations(source.gz[1],target.gz[1]);
    if(!stems.length&&!branches.length)return null;
    return {source:source.key,target:target.key,sourceLabel:source.label,targetLabel:target.label,stem:stems,branch:branches,text:source.label+source.gz+' 与 '+target.label+target.gz+' '+stems.concat(branches).join('、')};
  }
  function layer(key,label,gz,dayStem,meta){
    var engine=getEngine(),constants=engine.constants,hidden=constants.HIDDEN[gz[1]]||[],mainHidden=hidden[0]||'';
    return Object.assign({
      key:key,label:label,gz:gz,
      stemElement:constants.STEM_WX[gz[0]],branchElement:constants.BRANCH_WX[gz[1]],
      stemGod:engine.tenGod(dayStem,gz[0]),branchGod:mainHidden?engine.tenGod(dayStem,mainHidden):'',mainHidden:mainHidden
    },meta||{});
  }
  function flowMonthForDate(targetDate,dayStem){
    var engine=getEngine(),t=dateParts(targetDate),flowYear=engine.getFlowYearNumber(t),months=engine.getFlowMonths(flowYear,dayStem).map(function(item){
      var parts=item.dateLabel.split('/').map(Number);
      return Object.assign({},item,{boundaryKey:dateKey({year:parts[0],month:parts[1],day:parts[2]})});
    }).sort(function(a,b){return Date.parse(a.startAt)-Date.parse(b.startAt)});
    var selected=months[0],next=null,targetValue=chinaNoonValue(targetDate);
    months.forEach(function(item){if(Date.parse(item.startAt)<=targetValue)selected=item});
    next=months.find(function(item){return Date.parse(item.startAt)>targetValue})||null;
    if(!next){
      var nextYearFirst=engine.getFlowMonths(flowYear+1,dayStem)[0],nextParts=nextYearFirst.dateLabel.split('/').map(Number);
      next=Object.assign({},nextYearFirst,{boundaryKey:dateKey({year:nextParts[0],month:nextParts[1],day:nextParts[2]})});
    }
    var nearest=[selected,next].filter(Boolean).sort(function(a,b){return Math.abs(Date.parse(a.startAt)-targetValue)-Math.abs(Date.parse(b.startAt)-targetValue)})[0];
    var nearBoundary=nearest&&chinaDateKey(nearest.startAt)===dateKey(targetDate);
    return {flowYear:flowYear,selected:selected,next:next,nearBoundary:!!nearBoundary,nearestBoundary:nearBoundary?nearest:null};
  }
  function majorLuckForYear(bazi,flowYear){
    var engine=getEngine(),info=engine.luckStartInfo(bazi),direction=engine.luckDirection(bazi),monthIndex=GZ60.indexOf(bazi.pillars.month),birthYear=bazi.time.used.year;
    if(monthIndex<0)return {direction:info.direction,startAge:info.startAge,virtualAge:flowYear-birthYear+1,current:null};
    var age=flowYear-birthYear+1,current=null,rows=[];
    for(var i=0;i<10;i++){
      var from=info.startAge+i*10,row={from:from,to:from+9,gz:GZ60[(monthIndex+direction*(i+1)+60)%60],startYear:birthYear+from-1};
      if(age>=row.from&&age<=row.to)current=row;
      rows.push(row);
    }
    return {direction:info.direction,startAge:info.startAge,virtualAge:age,current:current,rows:rows};
  }
  function dayCompletedGroups(dayLayer,others){
    var all=[dayLayer].concat(others),branches=all.map(function(item){return item.gz[1]});
    return DAY_GROUPS.filter(function(group){return group.members.indexOf(dayLayer.gz[1])>=0&&group.members.split('').every(function(branch){return branches.indexOf(branch)>=0})}).map(function(group){
      return {name:group.name,participants:all.filter(function(item){return group.members.indexOf(item.gz[1])>=0}).map(function(item){return item.label+item.gz[1]})};
    });
  }
  function natalLayers(bazi,dayStem){
    return [layer('natalYear','原局年柱',bazi.pillars.year,dayStem),layer('natalMonth','原局月柱',bazi.pillars.month,dayStem),layer('natalDay','原局日柱',bazi.pillars.day,dayStem),layer('natalHour','原局时柱',bazi.pillars.hour,dayStem)];
  }
  function buildDayFacts(bazi,targetDate){
    var engine=getEngine(),date=dateKey(targetDate),t=dateParts(date),dayStem=bazi&&bazi.dayStem||bazi&&bazi.pillars&&bazi.pillars.day&&bazi.pillars.day[0];
    if(!dayStem||!bazi.pillars||!bazi.time||!bazi.time.used)throw new Error('命主八字资料不完整');
    var currentPillars=engine.buildPillars({year:t.year,month:t.month,day:t.day,hour:12,minute:0});
    var monthContext=flowMonthForDate(date,dayStem),yearGz=engine.getFlowYearGZ(monthContext.flowYear),luck=majorLuckForYear(bazi,monthContext.flowYear);
    var natal=natalLayers(bazi,dayStem);
    var temporal=[];
    if(luck.current)temporal.push(layer('luck','大运',luck.current.gz,dayStem,{from:luck.current.from,to:luck.current.to,startYear:luck.current.startYear}));
    temporal.push(layer('flowYear','流年',yearGz,dayStem,{year:monthContext.flowYear}));
    temporal.push(layer('flowMonth','流月',monthContext.selected.gz,dayStem,{term:monthContext.selected.term,boundaryKey:monthContext.selected.boundaryKey}));
    var backgroundRelations=[];
    temporal.forEach(function(source,index){
      natal.concat(temporal.slice(0,index)).forEach(function(target){var found=relationBetween(source,target);if(found)backgroundRelations.push(found)});
    });
    var dayLayer=layer('flowDay','流日',currentPillars.day,dayStem,{date:date}),relations=[];
    natal.concat(temporal).forEach(function(target){var found=relationBetween(dayLayer,target);if(found)relations.push(found)});
    var temporalAnalysis=engine.analyzeTemporalInteractions(bazi,temporal.concat([dayLayer]));
    return {
      date:date,dayStem:dayStem,natal:natal,temporal:temporal,flowDay:dayLayer,
      flowYear:monthContext.flowYear,flowMonthBoundaryApproximate:false,
      nearBoundary:monthContext.nearBoundary,nearestBoundary:monthContext.nearestBoundary,
      luck:luck,backgroundRelations:backgroundRelations,dayRelations:relations,dayGroups:dayCompletedGroups(dayLayer,natal.concat(temporal)),temporalAnalysis:temporalAnalysis
    };
  }
  function patternOf(bazi){return bazi&&bazi.patternAnalysis||bazi||{}}
  function usefulOf(bazi){var pattern=patternOf(bazi);return bazi&&bazi.useful||pattern.useful||{}}
  function containsElement(items,element){return (items||[]).some(function(item){return typeof item==='string'?item===element:item&&item.element===element})}
  function godFamily(god){
    if(god==='比肩'||god==='劫财')return '比劫';if(god==='食神'||god==='伤官')return '食伤';if(god==='正财'||god==='偏财')return '财';if(god==='正官'||god==='七杀')return '官杀';if(god==='正印'||god==='偏印')return '印';return god||'';
  }
  function familyInText(family,text){
    var terms={财:/财/,官杀:/官|杀/,食伤:/食|伤/,印:/印|枭/,比劫:/比|劫|刃/};return !!(terms[family]&&terms[family].test(text||''));
  }
  function elementRole(bazi,element,god){
    var useful=usefulOf(bazi),pattern=patternOf(bazi),family=godFamily(god),main=pattern.mainPattern||pattern.pattern||'',disease=pattern.patternDisease||{},unresolved=JSON.stringify((disease.unresolved||[]).concat(disease.partial||[])),solved=JSON.stringify(disease.solved||[]),role={kind:'neutral',rank:0,label:'普通五行',reason:'未直接落入原局主用、慎用或病药重点'};
    if(containsElement(useful.primaryUse||useful.specific&&useful.specific.primary,element))role={kind:'support',rank:4,label:'原局主用',reason:'直接落入原局主用'};
    else if(containsElement(useful.secondaryUse||useful.specific&&useful.specific.secondary,element)||containsElement(useful.use,element))role={kind:'support',rank:3,label:'原局佐用',reason:'落入原局佐用或喜用参考'};
    if(containsElement(useful.conditionalUse,element))role={kind:'mixed',rank:2,label:'条件取用',reason:'原局对这一五行喜中带忌，需要条件成立'};
    if(containsElement(useful.avoid||useful.specific&&useful.specific.avoid,element))role={kind:'avoid',rank:4,label:'原局慎用',reason:'直接落入原局慎用'};
    if(familyInText(family,main)){role.rank=Math.max(role.rank,3);role.reason+='，并触及原局主格的'+family+'作用链'}
    if(familyInText(family,unresolved)){role.rank=Math.max(role.rank,4);role.disease=true;role.reason+='，同时触及尚未完全解决的病点'}
    if(familyInText(family,solved)){role.remedy=true;role.reason+='，与原局已识别的救应方向有关'}
    return role;
  }
  function relationType(item){return item.kind==='group'?item.name:(item.kind==='stem-combine'?'天干合':item.type||'关系')}
  function relationScope(item){
    if(item.kind==='group'||item.interactionKind==='group')return '多层联动';
    return TARGET_SCOPES[item.targetKey]||item.targetLabel||'相关事务';
  }
  function relationElement(item,constants){
    if(item.kind==='group')return item.element;
    if(item.kind==='stem-combine')return constants.STEM_WX[(item.targetGz||'')[0]];
    return constants.BRANCH_WX[(item.targetGz||'')[1]];
  }
  function relationEvidence(item){
    if(item.kind==='group')return item.participants.map(function(part){return part.label+part.gz}).join('、')+'组成'+item.name+'，裁决为“'+item.status+'”（'+item.ruleId+'）';
    return item.sourceLabel+item.sourceGz+'与'+item.targetLabel+item.targetGz+'见'+relationType(item)+'，裁决为“'+item.status+'”（'+item.ruleId+'）';
  }
  function relationDetail(item){return {text:relationEvidence(item),ruleId:item.ruleId,status:item.status,effective:!!item.effective,sourceKey:item.sourceKey,targetKey:item.targetKey||'',reason:item.suppressionReason||''}}
  function dedupeRelationDetails(items){
    var buckets={},order=[];(items||[]).forEach(function(item){
      var key=item.kind==='branch-relation'?['branch',item.type,(item.sourceGz||'')[1],(item.targetGz||'')[1],item.status,item.effective].join('|'):[item.kind,item.name||item.pair||item.type,item.status,item.effective,relationEvidence(item)].join('|');
      if(!buckets[key]){buckets[key]=[];order.push(key)}buckets[key].push(item);
    });
    return order.map(function(key){var group=buckets[key],first=group[0],detail=relationDetail(first);if(group.length<2||first.kind!=='branch-relation')return detail;var targets=unique(group.map(function(item){return item.targetLabel+item.targetGz}));detail.text=first.sourceLabel+first.sourceGz+'与'+targets.join('、')+'均见'+first.type+'，裁决为“'+first.status+'”（'+first.ruleId+'）';detail.targetKey=unique(group.map(function(item){return item.targetKey})).join(',');detail.reason=unique(group.map(function(item){return item.suppressionReason||''})).join('、');return detail});
  }
  function periodAligned(source,god,targetKey,analysis,contextLayers){
    var family=godFamily(god),sameTheme=(contextLayers||[]).some(function(item){return item.key!==source.key&&(godFamily(item.stemGod)===family||godFamily(item.branchGod)===family)});
    var sameTarget=(analysis&&analysis.effectiveRelations||[]).some(function(item){return item.sourceKey!==source.key&&targetKey&&(item.targetKey===targetKey||(item.targetKeys||[]).indexOf(targetKey)>=0)});
    return sameTheme||sameTarget;
  }
  function evidenceStrengthOf(candidate){return !candidate.weak&&candidate.alignment>=3&&!candidate.counter?'较强应事方向':(!candidate.weak&&candidate.alignment>=2?'参考应事方向':'行动提醒')}
  function domainStrengthOf(evidenceStrength){return evidenceStrength==='较强应事方向'?'明确落点':(evidenceStrength==='参考应事方向'?'参考落点':'仅行动提醒')}
  function defaultScope(level){return level==='year'?'年度阶段':(level==='month'?'本月阶段':'当天事务')}
  function lifeDomainFor(god,targetKey,level){
    if(god==='比肩'||god==='劫财')return '人际合作';
    if(god==='正财'||god==='偏财')return '财务';
    if(god==='正官'||god==='七杀')return '工作';
    if(god==='食神'||god==='伤官')return ['month','natalMonth','hour','natalHour','flowMonth'].indexOf(targetKey)>=0||(!targetKey&&level==='month')?'工作':'人际合作';
    if(god==='正印'||god==='偏印')return '学习文书';
    return '生活安排';
  }
  function focusFor(god,domain,targetKey){
    if(god==='正财')return ['month','natalMonth'].indexOf(targetKey)>=0?'付款、报销或带金额的责任安排':'付款、报销或日常账目';
    if(god==='偏财')return '报价、临时收入或外部资源';
    if(god==='正官')return '审批、职责或正式流程';
    if(god==='七杀')return '催办、考核或突发任务';
    if(god==='比肩')return '同辈分工或责任边界';
    if(god==='劫财')return '资源竞争、共同支出或协作条件';
    if(god==='食神')return domain==='工作'?'文稿、方案或服务交付':'沟通表达、意见反馈或相处边界';
    if(god==='伤官')return domain==='工作'?'临时修改、规则异议或返工':'不同意见、沟通方式或边界';
    if(god==='正印')return '资料、凭证或学习支持';
    if(god==='偏印')return '信息补充、工具或方案调整';
    return '时间、顺序和现实约束';
  }
  function secondaryDomainFor(candidate,domain,allCandidates){
    var targetKey=candidate.targetKey||'',god=candidate.god||'',secondary='';
    if(god==='劫财'&&(allCandidates||[]).some(function(item){return /^(正财|偏财)$/.test(item.god||'')&&item.alignment>=2}))secondary='财务';
    else if(['year','natalYear'].indexOf(targetKey)>=0&&domain!=='人际合作')secondary='人际合作';
    else if(['month','natalMonth'].indexOf(targetKey)>=0&&domain!=='工作')secondary='工作';
    else if(['day','natalDay'].indexOf(targetKey)>=0&&(candidate.kind==='relation'||candidate.landedByRelation)&&candidate.alignment>=2&&!candidate.weak&&(candidate.periodAligned||candidate.structuralRank>=3))secondary=/印/.test(god)&&candidate.direction==='caution'?'状态恢复':'亲密关系';
    else if(['hour','natalHour'].indexOf(targetKey)>=0&&['工作','学习文书','生活安排'].indexOf(domain)<0)secondary='生活安排';
    return secondary===domain?'':secondary;
  }
  function relationShort(candidate){
    var type=candidate.relationType||'',source=candidate.sourceGz||'',target=candidate.targetGz||'';
    if(!target)return type;
    if(type==='天干合')return source[0]+target[0]+'合';
    if(type==='六合')return source[1]+target[1]+'合';
    if(type==='冲'||WEAK_RELATIONS.indexOf(type)>=0)return source[1]+target[1]+type;
    return type;
  }
  function resolveLifeFocus(candidate,level,evidenceStrength,allCandidates){
    var weakOnly=candidate.weak&&evidenceStrength==='行动提醒',domain=weakOnly?'生活安排':lifeDomainFor(candidate.god,candidate.targetKey,level),scope=candidate.targetKey?(TARGET_SCOPES[candidate.targetKey]||candidate.targetLabel||'相关事务'):(candidate.relationType?relationScope(candidate):defaultScope(level)),focus=weakOnly?'时间、顺序和现实约束':focusFor(candidate.god,domain,candidate.targetKey),secondary=weakOnly?'':secondaryDomainFor(candidate,domain,allCandidates),sourceText=(candidate.sourceGz||'')+(candidate.sourceLabel||'当前周期'),trigger;
    if(candidate.targetLabel)trigger=sourceText+'的'+(candidate.god||'作用')+'通过'+relationShort(candidate)+'牵动'+candidate.targetLabel;
    else if(candidate.relationType)trigger=sourceText+'的'+(candidate.god||'作用')+'参与'+candidate.relationType;
    else trigger=sourceText+'的'+(candidate.god||'基础信号')+'提示'+focus;
    return {lifeDomain:domain,secondaryLifeDomain:secondary,scope:scope,focus:focus,domainStrength:domainStrengthOf(evidenceStrength),trigger:trigger,action:DOMAIN_ACTIONS[domain],eventText:'在'+scope+'，优先留意'+focus};
  }
  function decorateCandidate(candidate,level,allCandidates,contextCandidate){
    var evidenceStrength=evidenceStrengthOf(candidate),focus=resolveLifeFocus(contextCandidate||candidate,level,evidenceStrength,allCandidates),directionPrefix=candidate.direction==='opportunity'?'可承接：':'宜留意：';
    return Object.assign({},candidate,focus,{domain:focus.lifeDomain,evidenceStrength:evidenceStrength,outcome:directionPrefix+focus.lifeDomain+'的'+focus.focus+'；'+focus.action});
  }
  function candidateFromGod(bazi,source,part,contextLayers){
    var god=part==='stem'?source.stemGod:source.branchGod,element=part==='stem'?source.stemElement:source.branchElement,theme=GOD_THEMES[god]||{domain:'观察与记录',meaning:'当天没有单一主题可以独立定事',action:'按现实优先级推进',event:'日常安排需要确认'},role=elementRole(bazi,element,god),aligned=periodAligned(source,god,'',null,contextLayers),direction=role.kind==='support'?'opportunity':(role.kind==='avoid'?'caution':'mixed'),structural=role.rank>=3;
    return {id:['god',source.gz,part,god,role.kind].join(':'),mergeKey:['god',god,role.kind].join('|'),kind:'ten-god',domain:theme.domain,god:god,theme:theme,direction:direction,action:theme.action,trigger:source.gz+'的'+god+'把重心带到'+theme.domain,evidence:source.label+source.gz+'的'+(part==='stem'?'天干':'地支主气')+'为'+god+'（'+element+'），'+role.reason,ruleIds:['ZP-DAY-01'],structuralRank:role.rank,relationPriority:0,periodAligned:aligned,alignment:(structural?1:0)+(aligned?1:0),counter:role.kind==='mixed',weak:false,eventText:theme.event,outcome:(direction==='opportunity'?'可承接：':'宜留意：')+theme.action,score:role.rank*100+(aligned?20:0)+(part==='stem'?6:3),sourceLabel:source.label,sourceGz:source.gz,targetKey:'',targetLabel:'',targetGz:'',relationType:''};
  }
  function candidateFromRelation(bazi,source,item,analysis,contextLayers){
    var constants=getEngine().constants,type=relationType(item),scope=relationScope(item),god=item.kind==='stem-combine'?source.stemGod:source.branchGod,theme=GOD_THEMES[god]||GOD_THEMES[source.stemGod],element=relationElement(item,constants),role=elementRole(bazi,element,god),isClash=/冲/.test(type),isCombine=/合|会/.test(type),weak=WEAK_RELATIONS.some(function(name){return type.indexOf(name)>=0}),direction='mixed';
    if(isClash)direction=role.kind==='avoid'?'opportunity':'caution';else if(isCombine)direction=role.kind==='avoid'?'caution':(role.kind==='support'?'opportunity':'mixed');else direction='caution';
    var aligned=periodAligned(source,god,item.targetKey,analysis,contextLayers),structural=role.rank>=3||item.targetKey==='natalMonth'||item.targetKey==='natalDay'||item.targetKey==='month'||item.targetKey==='day',suppressedCounter=(analysis.suppressedRelations||[]).some(function(other){return other.sourceKey===source.key&&(other.targetKey===item.targetKey||other.suppressedBy===item.name)}),counter=!!(item.resolution||item.challenged||suppressedCounter||role.kind==='mixed');
    var relationKey=item.kind==='branch-relation'?[item.kind,type,(item.sourceGz||'')[1],(item.targetGz||'')[1],item.status].join('|'):[item.kind,type,item.name||item.pair||'',item.status].join('|');
    return {id:['relation',source.gz,type,item.targetKey||item.members,item.status].join(':'),mergeKey:relationKey,kind:'relation',interactionKind:item.kind,domain:scope,god:god,theme:theme,direction:direction,action:theme&&theme.action||'先核对现实条件',trigger:source.gz+'以'+type+'牵动'+scope,evidence:relationEvidence(item)+(role.rank?'；'+element+'为'+role.label:''),ruleIds:unique([item.ruleId,'ZP-DAY-02']),structuralRank:Math.max(role.rank,structural?2:0),relationPriority:item.priority||0,periodAligned:aligned,alignment:(structural?1:0)+1+(aligned?1:0),counter:counter,weak:weak,eventText:theme&&theme.event||'相关安排出现确认节点',outcome:'',score:Math.max(role.rank,structural?2:0)*100+(item.priority||0)+(aligned?20:0),sourceLabel:item.sourceLabel||source.label,sourceGz:item.sourceGz||source.gz,targetKey:item.targetKey||'',targetLabel:item.targetLabel||'',targetGz:item.targetGz||'',relationType:type};
  }
  function eventCandidate(candidate,level){
    if(level!=='day'||candidate.weak||candidate.alignment<2)return null;
    var strong=candidate.alignment>=3&&!candidate.counter,label=strong?'较强应事方向':'参考应事方向';
    return {level:label,domain:candidate.lifeDomain,scope:candidate.scope,focus:candidate.focus,text:candidate.eventText,basis:candidate.evidence,reverseCondition:candidate.counter?'若合冲裁决中的反向关系先发生，或现实中没有对应事务进入场，此方向自动降级。':'若现实中没有对应事务进入场，只保留为行动提醒，不据此补写事件。',ruleIds:candidate.ruleIds};
  }
  function mergedEventCandidates(candidates,level){
    var buckets={},order=[];(candidates||[]).forEach(function(candidate){
      var event=eventCandidate(candidate,level);if(!event)return;var key=event.domain;
      if(!buckets[key]){buckets[key]={event:event,scopes:[],focuses:[],basis:[],rules:[],counter:false};order.push(key)}
      var bucket=buckets[key];bucket.scopes.push(event.scope);bucket.focuses.push(event.focus);bucket.basis.push(event.basis);bucket.rules=bucket.rules.concat(event.ruleIds||[]);bucket.counter=bucket.counter||candidate.counter;
      if(event.level==='较强应事方向')bucket.event.level=event.level;
    });
    return order.slice(0,2).map(function(key){var bucket=buckets[key],event=bucket.event,scopes=unique(bucket.scopes),focuses=unique(bucket.focuses);return Object.assign({},event,{scope:scopes.join('、'),focus:focuses.join('；'),text:(scopes.length===1?'在'+scopes[0]+'，':'涉及'+scopes.join('、')+'，')+'优先留意'+focuses.join('，以及'),basis:unique(bucket.basis).slice(0,2).join('；'),ruleIds:unique(bucket.rules),reverseCondition:bucket.counter?'若合冲裁决中的反向关系先发生，或现实中没有对应事务进入场，此方向自动降级。':event.reverseCondition})});
  }
  function mergedOutcomes(candidates,direction){
    var buckets={},order=[];(candidates||[]).filter(function(item){return direction==='opportunity'?item.direction==='opportunity':item.direction!=='opportunity'}).forEach(function(item){var key=item.lifeDomain;if(!buckets[key]){buckets[key]={focuses:[],action:item.action};order.push(key)}buckets[key].focuses.push(item.focus)});
    return order.slice(0,4).map(function(key){return (direction==='opportunity'?'可承接：':'宜留意：')+key+'的'+unique(buckets[key].focuses).join('，以及')+'；'+buckets[key].action});
  }
  function interpretSource(bazi,source,analysis,options){
    options=options||{};analysis=analysis||{effectiveRelations:[],suppressedRelations:[],relations:[]};var level=options.level||'day',contextLayers=options.contextLayers||[],effective=(analysis.effectiveRelations||[]).filter(function(item){return item.sourceKey===source.key}),suppressed=(analysis.suppressedRelations||[]).filter(function(item){return item.sourceKey===source.key});
    var candidates=[candidateFromGod(bazi,source,'stem',contextLayers),candidateFromGod(bazi,source,'branch',contextLayers)].concat(effective.map(function(item){return candidateFromRelation(bazi,source,item,analysis,contextLayers)}));
    candidates.sort(function(a,b){if(b.score!==a.score)return b.score-a.score;return a.id.localeCompare(b.id,'zh-CN')});var candidateSeen={};candidates=candidates.filter(function(item){var key=item.mergeKey||item.id;if(candidateSeen[key])return false;candidateSeen[key]=true;return true});
    var rawPrimary=candidates[0],landing=rawPrimary.kind==='relation'?rawPrimary:(candidates.find(function(item){return item.kind==='relation'&&item.god===rawPrimary.god&&!item.weak})||candidates.find(function(item){return item.kind==='relation'&&item.god===rawPrimary.god})||rawPrimary),primaryContext=landing===rawPrimary?rawPrimary:Object.assign({},rawPrimary,{targetKey:landing.targetKey,targetLabel:landing.targetLabel,targetGz:landing.targetGz,relationType:landing.relationType,sourceLabel:landing.sourceLabel,sourceGz:landing.sourceGz,landedByRelation:true,alignment:Math.max(rawPrimary.alignment,landing.alignment)});
    var decorated=candidates.map(function(item){return decorateCandidate(item,level,candidates)}),primary=decorateCandidate(rawPrimary,level,candidates,primaryContext);decorated=decorated.map(function(item){return item.id===primary.id?primary:item});
    var secondary=decorated.filter(function(item){return item.id!==primary.id}),secondaryDomainCandidate=secondary.find(function(item){return item.lifeDomain!==primary.lifeDomain&&item.evidenceStrength!=='行动提醒'});if(!primary.secondaryLifeDomain&&secondaryDomainCandidate)primary.secondaryLifeDomain=secondaryDomainCandidate.lifeDomain;
    var secondarySeen={},secondarySignals=secondary.filter(function(item){if(item.lifeDomain===primary.lifeDomain||secondarySeen[item.lifeDomain])return false;secondarySeen[item.lifeDomain]=true;return true}).slice(0,6),events=mergedEventCandidates(decorated,level),topEvidence=unique([rawPrimary.evidence,landing!==rawPrimary?landing.evidence:''].concat(candidates.filter(function(item){return item.id!==rawPrimary.id&&item.id!==landing.id}).map(function(item){return item.evidence}))).slice(0,2),theme=rawPrimary.theme||GOD_THEMES[source.stemGod],secondaryThemeCandidate=secondary.find(function(item){return item.theme&&item.theme.domain!==theme.domain}),secondaryTheme=secondaryThemeCandidate&&secondaryThemeCandidate.theme;
    var evidenceStrength=primary.evidenceStrength,prefix=level==='year'?'这一年主要看':(level==='month'?'本月主要看':'今天主要看'),summary=prefix+primary.lifeDomain+(primary.secondaryLifeDomain?'，次看'+primary.secondaryLifeDomain:'')+'，落在'+primary.scope+'：'+primary.trigger+'，'+(level==='day'?'优先留意':'阶段上留意')+primary.focus+'；'+primary.action+'。';
    var opportunities=mergedOutcomes(decorated,'opportunity'),cautions=mergedOutcomes(decorated,'caution'),yiDirection=primary.direction==='opportunity'?(primary.counter?'先整后进':'宜进'):(primary.direction==='caution'?(primary.counter?'先整后进':'暂缓'):'宜守');
    var primarySignal={id:primary.id,domain:primary.lifeDomain,lifeDomain:primary.lifeDomain,secondaryLifeDomain:primary.secondaryLifeDomain,scope:primary.scope,focus:primary.focus,domainStrength:primary.domainStrength,direction:primary.direction,trigger:primary.trigger,action:primary.action,evidenceStrength:evidenceStrength,ruleIds:unique(primary.ruleIds.concat(['ZP-DAY-04'])),yiDirection:yiDirection},lifeFocus={lifeDomain:primary.lifeDomain,secondaryLifeDomain:primary.secondaryLifeDomain,scope:primary.scope,focus:primary.focus,domainStrength:primary.domainStrength},allDetails=dedupeRelationDetails((analysis.relations||[]).filter(function(item){return item.sourceKey===source.key}));
    return {lifeFocus:lifeFocus,primarySignal:primarySignal,eventCandidates:events,topEvidence:topEvidence,secondarySignals:secondarySignals.map(function(item){return {domain:item.lifeDomain,lifeDomain:item.lifeDomain,scope:item.scope,focus:item.focus,domainStrength:item.domainStrength,direction:item.direction,text:item.trigger+'；优先留意'+item.focus+'；'+item.action,evidence:item.evidence,ruleIds:unique(item.ruleIds.concat(['ZP-DAY-04']))}}),suppressedRelations:dedupeRelationDetails(suppressed),allRelations:allDetails,primaryTheme:{name:theme.domain,explanation:theme.meaning,landing:primary.trigger},secondaryTheme:secondaryTheme?{name:secondaryTheme.domain,explanation:secondaryTheme.meaning,landing:secondaryThemeCandidate.trigger}:null,summary:summary,themes:unique([primary.lifeDomain,primary.secondaryLifeDomain]).slice(0,2),opportunities:opportunities,cautions:cautions,evidence:unique(topEvidence.concat(allDetails.map(function(item){return item.text}))),limit:(level==='day'?'流日只作短期触发，不改写原局格局、喜用与大运结论。':'周期结论只表达阶段方向，不自动推断具体事件。')+' 易理方向为“'+yiDirection+'”，只作进退与次序提示，不自动起卦。'};
  }
  function buildOutlook(bazi,facts){return interpretSource(bazi,facts.flowDay,facts.temporalAnalysis,{level:'day',contextLayers:facts.temporal})}
  function snapshotTiming(targetDate,generatedAt){
    var generated=new Date(generatedAt),generatedKey=dateKey(generated),target=dateKey(targetDate);
    return target>generatedKey?'pre-day':(target<generatedKey?'retroactive':'same-day');
  }
  function buildSnapshot(profile,targetDate,generatedAt){
    if(!profile||!profile.bazi)throw new Error('请选择命主');
    generatedAt=generatedAt||new Date().toISOString();
    var facts=buildDayFacts(profile.bazi,targetDate);
    return {version:ENGINE_VERSION,outlookRevision:OUTLOOK_REVISION,profileId:profile.id,profileFingerprint:profile.fingerprint||profileFingerprint(profile.bazi),date:facts.date,generatedAt:generatedAt,timing:snapshotTiming(facts.date,generatedAt),facts:facts,outlook:buildOutlook(profile.bazi,facts)};
  }
  function upgradeDayRecord(day,profile,recomputedAt){
    if(!day||!day.snapshot||(day.snapshot.version===ENGINE_VERSION&&day.snapshot.outlookRevision===OUTLOOK_REVISION))return {changed:false,record:clone(day)};
    var out=clone(day),oldVersion=out.snapshot.version||'UNKNOWN',oldRevision=out.snapshot.outlookRevision||'UNKNOWN',originalGeneratedAt=out.snapshot.generatedAt||out.createdAt||recomputedAt||new Date().toISOString();
    out.snapshot=buildSnapshot(profile,out.date||out.snapshot.date,originalGeneratedAt);out.snapshot.recomputedAt=recomputedAt||new Date().toISOString();out.snapshot.recomputedFromVersion=oldVersion;out.snapshot.recomputedFromOutlookRevision=oldRevision;
    out.ai=(out.ai||[]).map(function(item){return Object.assign({},item,{engineStale:true,staleReason:oldVersion===ENGINE_VERSION?'日运现实落点规则已更新':'日运主判断已由 '+oldVersion+' 复算为 '+ENGINE_VERSION})});
    return {changed:true,record:out};
  }
  function classifyPeriod(bazi,source,analysis,options){
    var outlook=interpretSource(bazi,source,analysis,options),changes=[];
    if(options&&options.boundaryText){changes.push(options.boundaryText);outlook.evidence=unique(outlook.evidence.concat([options.boundaryText]))}
    var signals=[];if(outlook.eventCandidates.length)signals.push('变动');if(outlook.cautions.length)signals.push('注意');if(outlook.opportunities.length)signals.push('机会');if(!signals.length)signals.push('平稳');
    return Object.assign({},outlook,{signals:signals,strength:outlook.primarySignal.evidenceStrength==='行动提醒'?'一般':'重点',changes:changes});
  }
  function relationsFrom(source,targets){return targets.map(function(target){return relationBetween(source,target)}).filter(Boolean)}
  function periodNode(profile,level,periodKey,source,startAt,endAt,classification,extra){
    return Object.assign({profileId:profile.id,profileFingerprint:profile.fingerprint||profileFingerprint(profile.bazi),engineVersion:ENGINE_VERSION,outlookRevision:OUTLOOK_REVISION,level:level,periodKey:periodKey,startAt:startAt,endAt:endAt,gz:source.gz,stemGod:source.stemGod,branchGod:source.branchGod,signals:classification.signals,strength:classification.strength,themes:classification.themes,lifeFocus:classification.lifeFocus,primaryTheme:classification.primaryTheme,secondaryTheme:classification.secondaryTheme,primarySignal:classification.primarySignal,eventCandidates:classification.eventCandidates,topEvidence:classification.topEvidence,secondarySignals:classification.secondarySignals,suppressedRelations:classification.suppressedRelations,allRelations:classification.allRelations,opportunities:classification.opportunities,cautions:classification.cautions,changes:classification.changes,evidence:classification.evidence,summary:classification.summary,boundaryWarning:''},extra||{});
  }
  function buildTimelineYears(profile,referenceDate){
    if(!profile||!profile.bazi)throw new Error('请选择命主');
    var engine=getEngine(),bazi=profile.bazi,date=dateKey(referenceDate),t=dateParts(date),dayStem=bazi.dayStem||bazi.pillars.day[0],flowYear=engine.getFlowYearNumber({year:t.year,month:t.month,day:t.day,hour:12,minute:0}),luck=majorLuckForYear(bazi,flowYear),row=luck.current||luck.rows[0];
    if(!row)throw new Error('当前资料无法生成大运时间轴');
    var natal=natalLayers(bazi,dayStem),luckLayer=layer('luck','大运',row.gz,dayStem,{from:row.from,to:row.to,startYear:row.startYear});
    var years=[];
    for(var year=row.startYear;year<row.startYear+10;year++){
      var months=engine.getFlowMonths(year,dayStem),nextMonths=engine.getFlowMonths(year+1,dayStem),source=layer('flowYear','流年',engine.getFlowYearGZ(year),dayStem,{year:year}),layers=[luckLayer,source],analysis=engine.analyzeTemporalInteractions(bazi,layers),classification=classifyPeriod(bazi,source,analysis,{level:'year',contextLayers:[luckLayer]});
      years.push(periodNode(profile,'year','year:'+year,source,months[0].startAt,nextMonths[0].startAt,classification,{flowYear:year,age:year-bazi.time.used.year+1,current:year===flowYear,parent:{label:'大运',gz:row.gz,from:row.from,to:row.to,startYear:row.startYear}}));
    }
    return {referenceDate:date,currentFlowYear:flowYear,bigLuck:{gz:row.gz,from:row.from,to:row.to,startYear:row.startYear,endYear:row.startYear+9,direction:luck.direction,startAge:luck.startAge,approximateStart:true,current:!!luck.current},years:years};
  }
  function buildTimelineMonths(profile,flowYear){
    if(!profile||!profile.bazi)throw new Error('请选择命主');
    flowYear=Number(flowYear);if(!Number.isInteger(flowYear))throw new Error('流年无效');
    var engine=getEngine(),bazi=profile.bazi,dayStem=bazi.dayStem||bazi.pillars.day[0],natal=natalLayers(bazi,dayStem),luck=majorLuckForYear(bazi,flowYear),row=luck.current||luck.rows.find(function(item){return flowYear>=item.startYear&&flowYear<=item.startYear+9})||luck.rows[0],parents=[];
    if(row)parents.push(layer('luck','大运',row.gz,dayStem,{from:row.from,to:row.to,startYear:row.startYear}));
    var yearLayer=layer('flowYear','流年',engine.getFlowYearGZ(flowYear),dayStem,{year:flowYear});parents.push(yearLayer);
    return engine.getFlowMonths(flowYear,dayStem).map(function(item,index){
      var source=layer('flowMonth','流月',item.gz,dayStem,{term:item.term,startAt:item.startAt,endAt:item.endAt}),layers=parents.concat([source]),analysis=engine.analyzeTemporalInteractions(bazi,layers),classification=classifyPeriod(bazi,source,analysis,{level:'month',contextLayers:parents});
      return periodNode(profile,'month','month:'+flowYear+':'+pad(index+1),source,item.startAt,item.endAt,classification,{flowYear:flowYear,monthIndex:index,term:item.term,dateLabel:item.dateLabel,localTimeLabel:item.localTimeLabel,parent:{label:'流年',gz:yearLayer.gz,year:flowYear},boundaryWarning:item.term+'于 '+item.localTimeLabel+' 交节；交界前后两小时建议复核。'});
    });
  }
  function periodDateKeys(startAt,endAt){
    var start=dateKey(chinaDateKey(startAt)),end=dateKey(chinaDateKey(endAt)),out=[],cursor=start,guard=0,startValue=Date.parse(startAt),endValue=Date.parse(endAt);
    while(cursor<=end&&guard++<40){var noon=chinaNoonValue(cursor);if(noon>=startValue&&noon<endValue)out.push(cursor);cursor=addDays(cursor,1)}
    return out;
  }
  function weekdayLabel(value){var t=dateParts(value);return '日一二三四五六'[new Date(Date.UTC(t.year,t.month-1,t.day)).getUTCDay()]}
  function buildTimelineDays(profile,monthNode){
    if(!profile||!profile.bazi)throw new Error('请选择命主');
    if(!monthNode||monthNode.level!=='month'||!monthNode.startAt||!monthNode.endAt)throw new Error('流月节点无效');
    return periodDateKeys(monthNode.startAt,monthNode.endAt).map(function(date){
      var facts=buildDayFacts(profile.bazi,date),boundary=facts.nearBoundary&&facts.nearestBoundary?(facts.nearestBoundary.term+'于 '+facts.nearestBoundary.localTimeLabel+' 交节'):'';
      var classification=classifyPeriod(profile.bazi,facts.flowDay,facts.temporalAnalysis,{level:'day',boundaryText:boundary,contextLayers:facts.temporal}),outlook=buildOutlook(profile.bazi,facts);
      classification=Object.assign({},classification,outlook,{changes:classification.changes,evidence:unique(classification.evidence.concat(outlook.evidence)),signals:classification.signals,strength:classification.strength});
      return periodNode(profile,'day','day:'+date,facts.flowDay,new Date(chinaNoonValue(date)).toISOString(),new Date(chinaNoonValue(addDays(date,1))).toISOString(),classification,{date:date,weekday:'周'+weekdayLabel(date),flowYear:facts.flowYear,term:facts.temporal.find(function(item){return item.key==='flowMonth'}).term,parent:{label:'流月',gz:monthNode.gz,term:monthNode.term},summary:outlook.summary,boundaryWarning:boundary?(boundary+'；交界前后两小时建议复核。'):''});
    });
  }
  function timelineFactsHash(node){return simpleHash(JSON.stringify([ENGINE_VERSION,OUTLOOK_REVISION,node.level,node.periodKey,node.gz,node.signals,node.strength,node.themes,node.evidence,node.startAt,node.endAt]))}
  function buildTimelineAiPrompt(profile,node,children){
    if(!profile||!profile.bazi||!node)throw new Error('时间轴AI资料不完整');
    children=children||[];
    var levelLabel={year:'流年',month:'流月',day:'流日'}[node.level]||'周期',bazi=profile.bazi,childText=children.slice(0,32).map(function(item){return item.periodKey+' '+item.gz+'：'+item.signals.join('、')+'；'+item.summary}).join('\n');
    return '你是传统子平命理时间轴助手。固定干支事实不可改写，命理线索与现实事实必须分开，不得宣称科学因果。\n'+
      '回答结构固定为：周期判断 -> 盘面依据 -> 反向信号与不确定处 -> 现实提醒。不要给总分，不要恐吓，不要承诺具体事件一定发生。\n'+
      '分析层级：'+levelLabel+'；周期：'+node.periodKey+'；起止：'+node.startAt+' 至 '+node.endAt+'。\n'+
      '命主原局：'+[bazi.pillars.year,bazi.pillars.month,bazi.pillars.day,bazi.pillars.hour].join(' ')+'；日主 '+(bazi.dayStem||bazi.pillars.day[0])+'。\n'+
      '本地周期事实：'+node.gz+'；标记 '+node.signals.join('、')+'；强弱 '+node.strength+'；主题 '+(node.themes.join('、')||'未见突出主题')+'。\n'+
      '本地主判断（AI不得改写）：'+node.summary+'；易理行动方向 '+(node.primarySignal&&node.primarySignal.yiDirection||'宜守')+'。\n'+
      '本地核心依据：'+((node.topEvidence||node.evidence).join('；')||'未见突出合冲刑害破或喜忌触发')+'。\n'+
      (childText?'下级周期摘要（只含本地命理信号，不含任何日记正文）：\n'+childText:'当前没有下级周期摘要。')+'\n'+
      '隐私边界：本次内容不包含用户日记正文。';
  }
  function eventContext(calendarDate,time){
    var fortuneDate=effectiveDateKey(calendarDate,time),t=dateParts(fortuneDate),pillars=getEngine().buildPillars({year:t.year,month:t.month,day:t.day,hour:12,minute:0});
    return {calendarDate:dateKey(calendarDate),fortuneDate:fortuneDate,dayGz:pillars.day,shifted:fortuneDate!==dateKey(calendarDate)};
  }
  function buildAiPrompt(snapshot,entries,type){
    type=type||'review';entries=(entries||[]).filter(function(item){return item.includeInAi!==false});
    var facts=snapshot.facts,levels=facts.temporal.concat([facts.flowDay]).map(function(item){return item.label+' '+item.gz+'（'+item.stemGod+' / '+item.branchGod+'）'}).join('；');
    var backgroundText=(snapshot.outlook.allRelations||[]).filter(function(item){return item.sourceKey!=='flowDay'}).map(function(item){return item.text}).join('；')||'未见需要展开的阶段背景关系';
    var relationText=(snapshot.outlook.allRelations||[]).map(function(item){return item.text}).join('；')||'未见经过裁决仍有效的突出关系';
    var eventText=entries.map(function(item,index){
      var ctx=eventContext(snapshot.date,item.time);
      return (index+1)+'. '+(item.time||'未记时间')+'，'+(item.valence||'普通')+'，'+(item.category||'其他')+'；命理采用 '+ctx.fortuneDate+' '+ctx.dayGz+(ctx.shifted?'（23点后换日）':'')+'；事件：'+String(item.text||'').trim();
    }).join('\n');
    return '你是传统子平命理日运记录助手。文风可以直接，但必须把本地干支事实与推断分开，不得改写四柱、大运、流年、流月、流日，不得宣称命理已证明现实事件的科学因果。\n'+
      '回答结构固定为：今日断语 -> 盘面依据 -> 反向信号与不确定处 -> 现实提醒。不要给总分，不要恐吓。\n'+
      '模式：'+(type==='forecast'?'事前日运详解':(type==='retroactive'?'补看日运':'事后日记复盘'))+'\n'+
      '命主原局：'+facts.natal.map(function(item){return item.gz}).join(' ')+'；日主 '+facts.dayStem+'。\n'+
      '运势层级：'+levels+'。\n大运、流年、流月阶段背景：'+backgroundText+'。\n流日关系线索：'+relationText+'。\n'+
      '本地主判断（AI只解释，不得改写）：'+snapshot.outlook.summary+'\n核心依据：'+snapshot.outlook.topEvidence.join('；')+'\n边界：'+snapshot.outlook.limit+'\n'+
      (eventText?'用户明确选择发送的日记事件：\n'+eventText:'当前没有发送日记事件，只分析事前盘面。');
  }

  return {
    version:ENGINE_VERSION,outlookRevision:OUTLOOK_REVISION,promptVersion:PROMPT_VERSION,timelinePromptVersion:TIMELINE_PROMPT_VERSION,dateKey:dateKey,addDays:addDays,effectiveDateKey:effectiveDateKey,
    profileFingerprint:profileFingerprint,profileFromBaziRecord:profileFromBaziRecord,stemRelations:stemRelations,branchRelations:branchRelations,
    relationBetween:relationBetween,flowMonthForDate:flowMonthForDate,majorLuckForYear:majorLuckForYear,buildDayFacts:buildDayFacts,
    buildOutlook:buildOutlook,buildSnapshot:buildSnapshot,upgradeDayRecord:upgradeDayRecord,buildTimelineYears:buildTimelineYears,buildTimelineMonths:buildTimelineMonths,buildTimelineDays:buildTimelineDays,
    timelineFactsHash:timelineFactsHash,buildTimelineAiPrompt:buildTimelineAiPrompt,eventContext:eventContext,buildAiPrompt:buildAiPrompt
  };
});
