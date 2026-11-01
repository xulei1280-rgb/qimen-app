/* 六爻「规则初断」：只用排盘引擎已经核对过的事实，按《增删卜易》旺衰先后给出倾向。不调用 AI。
 * 判断顺序（与 DECISION_TABLE 一致，逐条可在页面「为什么这么断」里看到）：
 *   1. 用神根基（日月为主）：月建、日辰对用神的生扶拱合或刑冲克害 → 根基分 R。
 *   2. 动变作用：有力的原神、忌神、同类，用神自身动变，伏藏，空亡 → 动变分 M。
 *   3. 按决策表从上到下取第一条命中的结论；生扶与制约都重而相抵时，只说“吉凶参半”。
 * 权重只是把古书“先后轻重”写成可检验的顺序，不是吉凶概率。
 */
(function(root,factory){
  var api=factory();
  root.LiuyaoVerdict=api;
  if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof self!=='undefined'?self:this,function(){
  'use strict';
  var VERSION='LIUYAO-VERDICT-2026.11.02-v1';
  var ELEMENTS={子:'水',丑:'土',寅:'木',卯:'木',辰:'土',巳:'火',午:'火',未:'土',申:'金',酉:'金',戌:'土',亥:'水'};
  var GENERATES={木:'火',火:'土',土:'金',金:'水',水:'木'};
  var CONTROLS={木:'土',土:'水',水:'火',火:'金',金:'木'};
  var CLASH={子:'午',午:'子',丑:'未',未:'丑',寅:'申',申:'寅',卯:'酉',酉:'卯',辰:'戌',戌:'辰',巳:'亥',亥:'巳'};
  var COMBINE={子:'丑',丑:'子',寅:'亥',亥:'寅',卯:'戌',戌:'卯',辰:'酉',酉:'辰',巳:'申',申:'巳',午:'未',未:'午'};
  var LIFE={金:{长生:'巳',帝旺:'酉',墓:'丑',绝:'寅'},木:{长生:'亥',帝旺:'卯',墓:'未',绝:'申'},水:{长生:'申',帝旺:'子',墓:'辰',绝:'巳'},火:{长生:'寅',帝旺:'午',墓:'戌',绝:'亥'},土:{长生:'申',帝旺:'子',墓:'辰',绝:'巳'}};
  var BRANCHES='子丑寅卯辰巳午未申酉戌亥'.split('');
  var HOURS={子:'23–1点',丑:'1–3点',寅:'3–5点',卯:'5–7点',辰:'7–9点',巳:'9–11点',午:'11–13点',未:'13–15点',申:'15–17点',酉:'17–19点',戌:'19–21点',亥:'21–23点'};
  var SRC={
    root:'《增删卜易·月将章》《日辰章》《旺相休囚章》：月建、日辰为用神之根，生扶拱合为有气，克冲为受伤',
    move:'《增删卜易·动静生克章》：动爻能生克静爻；《元神忌神衰旺章》：原神动来生为有救，忌神动来克为伤',
    chain:'《增删卜易·元神忌神衰旺章》：原神与忌神同动，忌神生原神、原神生用神，连续相生，反吉',
    change:'《增删卜易·动变生克冲合章》《进神退神章》：用神动化回头生、化进为增力，回头克冲、化退、化墓绝为减力',
    void:'《增删卜易·旬空章》：旺动不为空；休囚安静无生扶、月破为真空；待出空、冲空、填实',
    breakage:'《增删卜易·月破章》：月破静而无生扶，当月难成；出月、填实或逢合方有用',
    hidden:'《增删卜易·飞伏神章》：用神不上卦取伏神，伏而有气、得生扶或飞神空破冲开方能提拔',
    grave:'《增删卜易·墓库章》：用神休囚入墓，主困滞',
    timing:'《增删卜易·应期章》：用神休囚，应在生旺之日；空待出空冲空，破待填实出月'
  };
  var LABELS={favorable:'偏顺利',obstructed:'有阻但能成',strained:'受制较重，有一线转机',unfavorable:'偏不利',mixed:'吉凶参半',timing:'吉凶参半，看应期'};
  // 决策表：从上到下，取第一条命中的。R＝根基分，M＝动变分，T＝R+M，P＝生扶权重和，N＝制约权重和（负数）。
  var DECISION_TABLE=[
    {id:'D1',tendency:'unfavorable',when:'用神休囚安静，同时月破、日克（引擎判“无根”）',why:'《月破章》：休囚静而逢破又受日克，外来生扶难落实'},
    {id:'D2',tendency:'unfavorable',when:'用神真空，或用神动化回头克，且根基分 R ≤ 0',why:'《旬空章》《回头之克》：根基不足而空、化回头克，难以成事'},
    {id:'D3',tendency:'mixed',when:'生扶与制约都重（P ≥ 3 且 N ≤ −3）而总分 |T| ≤ 1',why:'证据相互抵消，不硬下结论'},
    {id:'D4',tendency:'strained',when:'R ≤ −3，但有有力的原神动生、回头生等救应（正向动变 ≥ 2）',why:'日月克而有救：受制较重，转机在救应之爻'},
    {id:'D5',tendency:'unfavorable',when:'R ≤ −3 且无救应',why:'日月俱伤而无救'},
    {id:'D6',tendency:'favorable',when:'R ≥ 2 且动变不受伤（M ≥ 0）',why:'日月生扶，动变不来伤'},
    {id:'D7',tendency:'obstructed',when:'R ≥ 2，动变有伤但总分 T ≥ 1',why:'用神有根，虽有阻力仍可成'},
    {id:'D8',tendency:'timing',when:'用神待出空或月破未解，而总分 T > −2',why:'事情暂未落实，以应期为关键'},
    {id:'D9',tendency:'obstructed',when:'T ≥ 2',why:'根基一般，靠动变生扶成事'},
    {id:'D10',tendency:'unfavorable',when:'T ≤ −2 且没有正向动变',why:'受制而无生扶'},
    {id:'D11',tendency:'mixed',when:'其余情况',why:'生扶与制约接近，或关键作用未发动'}
  ];
  function seasonalState(monthElement,element){
    if(monthElement===element)return '旺';
    if(GENERATES[monthElement]===element)return '相';
    if(GENERATES[element]===monthElement)return '休';
    if(CONTROLS[element]===monthElement)return '囚';
    return '死';
  }
  function stageOf(element,branch){var s=LIFE[element]||{};return Object.keys(s).find(function(k){return s[k]===branch})||''}
  var RELATIVE_HINT={子孙:'有人张罗、朋友相邀或心情放松的场合',父母:'长辈帮忙、消息或手续到位',兄弟:'同辈朋友出力',官鬼:'上级、规矩或场合推动',妻财:'钱物条件到位'};
  var ACT={food:null,money:'拿到这笔钱',item:'拿到东西',house:'把房车的事办成',document:'把文书、考试的事办成',job:'把工作的事办成',lawsuit:'在官司里占上风',weatherRain:'下雨',weatherSun:'放晴',medicine:'药、医见效',illnessSelf:'病情好转',pregnancy:'顺利怀上',parents:'长辈那边的事顺利',children:'孩子那边的事顺利',peers:'对方那边的事顺利',wife:'感情如愿',husband:'感情如愿',love:'感情如愿',boss:'上司那边的事顺利',other:'对方那边顺利',travel:'出行顺利',lost:'找回失物',self:'诸事顺利'};
  function phrase(question,category){
    var q=String(question||''),time=(q.match(/今晚|今夜|今天|明天|后天|这周|本周|下周|周末|这个月|本月|下个月|今年|明年|近期|最近/)||[''])[0];
    var act=ACT[category]||'把这件事办成',wish=!/^(weatherRain|weatherSun)$/.test(category);
    if(category==='food'){var obj=(q.match(/啤酒|白酒|红酒|黄酒|洋酒|酒|火锅|烧烤|外卖|奶茶|咖啡|饭|夜宵|宵夜/)||[''])[0];act=obj?(/喝|酒|奶茶|咖啡|饮/.test(q)&&!/吃/.test(q)?'喝上':'吃上')+obj:'有这口福'}
    return {time:time,act:act,wish:wish};
  }
  function nightHours(question){return /今晚|今夜|晚上|夜里|夜宵|宵夜/.test(question||'')?['酉','戌','亥','子']:(/今天|今日/.test(question||'')?BRANCHES:null)}

  function build(input){
    input=input||{};
    var plate=input.plate,a=input.assessment,useGod=input.useGod;
    if(!plate||!a||!useGod)return null;
    var focus=a.focus,line=plate.lines.find(function(l){return l.position===focus.position});
    var monthBranch=plate.calendar.monthBuild||(plate.calendar.monthGZ||'')[1],dayBranch=plate.calendar.dayBranch||(plate.calendar.dayGZ||'')[1];
    var mEl=ELEMENTS[monthBranch],dEl=ELEMENTS[dayBranch],el=focus.element,br=focus.branch,season=seasonalState(mEl,el);
    var name=focus.lineLabel+(focus.hidden?'伏神':'')+focus.relative+focus.stem+focus.branch+focus.element;
    var items=[];
    function add(group,weight,text,source,key){items.push({group:group,weight:weight,text:text,source:source,key:key||''})}
    // 1. 根基：月建
    var monthBroken=CLASH[monthBranch]===br,staticFocus=!focus.hidden&&!focus.moving;
    if(br===monthBranch)add('root',2,'用神临月建（'+monthBranch+'月），当令有气',SRC.root,'month+');
    else if(season==='旺')add('root',2,'用神'+el+'在'+monthBranch+'月当令（旺）',SRC.root,'month+');
    else if(season==='相')add('root',2,'月建'+monthBranch+mEl+'生用神'+el+'（相）',SRC.root,'month+');
    else if(season==='休')add('root',0,'用神'+el+'在'+monthBranch+'月为休，不得月令',SRC.root,'month0');
    else if(season==='囚')add('root',-1,'用神'+el+'在'+monthBranch+'月为囚',SRC.root,'month-');
    else add('root',-2,'月建'+monthBranch+mEl+'克用神'+el+'（死）',SRC.root,'month-');
    if(monthBroken)add('root',-2,'用神'+br+'被月建'+monthBranch+'冲破（月破）',SRC.breakage,'monthBreak');
    else if(COMBINE[monthBranch]===br)add('root',1,'月建'+monthBranch+'与用神'+br+'相合',SRC.root,'month+');
    var rootSoFar=items.reduce(function(s,i){return s+i.weight},0);
    // 日辰
    if(br===dayBranch)add('root',2,'用神临日辰（'+dayBranch+'日）',SRC.root,'day+');
    else if(GENERATES[dEl]===el)add('root',2,dayBranch+'日（'+dEl+'）生用神'+el,SRC.root,'day+');
    else if(dEl===el)add('root',1,dayBranch+'日与用神同属'+el+'，相扶',SRC.root,'day+');
    else if(CONTROLS[dEl]===el)add('root',-2,dayBranch+'日（'+dEl+'）克用神'+el,SRC.root,'day-');
    if(CLASH[dayBranch]===br){
      if(focus.moving)add('root',-1,'用神发动而逢日冲（冲散）',SRC.root,'day-');
      else if(!focus.hidden&&rootSoFar>0&&!monthBroken)add('root',1,'用神旺而逢日冲，为暗动',SRC.root,'day+');
      else add('root',-2,'用神休囚又逢日冲，为日破',SRC.root,'day-');
    }else if(COMBINE[dayBranch]===br)add('root',1,dayBranch+'日与用神'+br+'相合',SRC.root,'day+');
    var dayStage=stageOf(el,dayBranch),rootNow=items.reduce(function(s,i){return s+i.weight},0);
    if((dayStage==='墓'||dayStage==='绝')&&rootNow<=0)add('root',-1,'用神入'+dayBranch+'日之'+dayStage+(dayStage==='墓'?'，休囚入墓主困滞':'，休囚逢绝'),dayStage==='墓'?SRC.grave:SRC.root,'grave');
    // 2. 动变：有力的原神、忌神、同类（引擎已判断能否作用）
    var effective=(a.actors||[]).filter(function(x){return x.capacity==='effective'&&x.active});
    function actorName(x){return x.lineLabel+(x.hidden?'伏神':'')+x.relative+x.stem+x.branch+x.element}
    function weakened(x){return x.deferred&&!(x.voidStatus&&x.voidStatus.status==='不为空')}
    var sources=effective.filter(function(x){return x.role==='原神'}),adverse=effective.filter(function(x){return x.role==='忌神'});
    function moves(x){return x.actionState==='明动'||x.actionState==='暗动'}
    // 贪生忘克只在原神、忌神都真正发动（明动或暗动）时成立；旺相静爻不算“同动”。
    var chain=sources.some(function(x){return !weakened(x)&&moves(x)})&&adverse.some(moves);
    sources.forEach(function(x){add('move',weakened(x)?1:2,actorName(x)+x.actionState+'，原神来生用神'+(weakened(x)?'（逢空破，生力待填实）':''),SRC.move,'source')});
    adverse.forEach(function(x){var greedy=chain&&moves(x);add('move',greedy?0:(weakened(x)?-1:-2),actorName(x)+x.actionState+'，忌神克用神'+(greedy?'（与原神同动，转去生原神）':(weakened(x)?'（逢空破，克力暂虚）':'')),SRC.move,'adverse')});
    if(chain)add('move',1,'原神与忌神同动：忌神生原神、原神生用神，连续相生',SRC.chain,'chain');
    effective.filter(function(x){return x.role==='同类'}).forEach(function(x){add('move',1,actorName(x)+x.actionState+'，与用神同类相扶',SRC.move,'peer')});
    // 用神自身动变
    if(staticFocus===false&&!focus.hidden&&line&&line.moving){
      var cf=(line.changeFacts||[]).slice(),cs=stageOf(el,line.changed.branch);if(cs&&cf.indexOf('化'+cs)<0)cf.push('化'+cs);
      var W={回头生:2,化进:2,化长生:2,化帝旺:2,回头克:-3,回头冲:-2,化退:-2,化墓:-2,化绝:-2};
      // 同一变爻的“回头生/化长生”等只算一次：增力取最大一条，减力取最重一条，其余列为同一事实的别名。
      var ups=cf.filter(function(t){return W[t]>0}),downs=cf.filter(function(t){return W[t]<0});
      if(ups.length)add('move',2,'用神动而'+ups.join('、'),SRC.change,'changeUp');
      if(downs.length){var worst=downs.slice().sort(function(x,y){return W[x]-W[y]})[0];add('move',W[worst],'用神动而'+downs.join('、'),SRC.change,worst==='回头克'?'backControl':'changeDown')}
      if((plate.calendar.voidBranches||[]).indexOf(line.changed.branch)>=0)add('move',-1,'用神化空，变化暂未落实',SRC.void,'changeVoid');
      if(CLASH[monthBranch]===line.changed.branch)add('move',-1,'用神化破',SRC.breakage,'changeBreak');
    }
    // 动墓、三合（取引擎已核对的结论）
    var arb=a.arbitration||{};
    (arb.constraint||[]).forEach(function(t){if(/为用神动墓，且用神本身休囚/.test(t))add('move',-1,t.replace(/，列入制约$/,''),SRC.grave,'moveGrave')});
    (a.chains||[]).filter(function(c){return c.type==='san-he'&&!/待填实/.test(c.evidence)}).forEach(function(c){
      if(/生用神|用神成局/.test(c.evidence))add('move',2,c.evidence,SRC.move,'sanhe+');else if(/克用神/.test(c.evidence))add('move',-2,c.evidence,SRC.move,'sanhe-');
    });
    // 伏神
    if(focus.hidden){
      add('state',-1,'用神不上卦，伏于'+focus.lineLabel+'之下，事情尚未显露',SRC.hidden,'hidden');
      var flying=line&&line.original;
      if(flying&&GENERATES[flying.element]===el)add('state',1,'飞神'+flying.stem+flying.branch+'生伏神',SRC.hidden,'flyingUp');
      else if(flying&&CONTROLS[flying.element]===el)add('state',-1,'飞神'+flying.stem+flying.branch+'克伏神',SRC.hidden,'flyingDown');
    }
    // 旬空
    var focusVoid=(a.voidDetails||[]).find(function(v){return v.target==='用神'}),pending=false,trueVoid=false;
    if(focusVoid){
      if(focusVoid.status==='真空'){trueVoid=true;add('state',-2,'用神旬空为真空（'+focusVoid.trueReasons.join('、')+'）',SRC.void,'trueVoid')}
      else if(focusVoid.status==='待出空'){pending=true;add('state',-1,'用神旬空，眼下未落实，待出空或冲空',SRC.void,'pendingVoid')}
      else add('state',0,'用神旬空但'+focusVoid.notVoidReasons.join('、')+'，不作空论',SRC.void,'falseVoid');
    }
    if(monthBroken&&!trueVoid)pending=true;

    var R=items.filter(function(i){return i.group==='root'}).reduce(function(s,i){return s+i.weight},0);
    var M=items.filter(function(i){return i.group!=='root'}).reduce(function(s,i){return s+i.weight},0);
    var T=R+M,P=items.filter(function(i){return i.weight>0}).reduce(function(s,i){return s+i.weight},0),N=items.filter(function(i){return i.weight<0}).reduce(function(s,i){return s+i.weight},0);
    var rescue=items.filter(function(i){return i.group!=='root'&&i.weight>0}).reduce(function(s,i){return s+i.weight},0);
    var backControl=items.some(function(i){return i.key==='backControl'});
    var rule=null;
    function hit(id){rule=DECISION_TABLE.find(function(r){return r.id===id});return true}
    (arb.decisiveRule==='weak-static-month-break-day-control'&&hit('D1'))||
    ((trueVoid||backControl)&&R<=0&&hit('D2'))||
    (P>=3&&N<=-3&&Math.abs(T)<=1&&hit('D3'))||
    (R<=-3&&rescue>=2&&hit('D4'))||
    (R<=-3&&hit('D5'))||
    (R>=2&&M>=0&&hit('D6'))||
    (R>=2&&T>=1&&hit('D7'))||
    (pending&&T>-2&&hit('D8'))||
    (T>=2&&hit('D9'))||
    (T<=-2&&rescue===0&&hit('D10'))||
    hit('D11');
    var tendency=rule.tendency,label=LABELS[tendency];
    // 一句话回答
    var p=phrase(input.question,input.category),want=(p.wish?'想':'')+p.act,lead=p.time;
    var src=items.filter(function(i){return i.key==='source'})[0],sourceActor=sources[0];
    var rescueText=sourceActor?(RELATIVE_HINT[sourceActor.relative]||'有人相助')+'（'+sourceActor.lineLabel+sourceActor.relative+'发动来生'+focus.relative+'）':(items.some(function(i){return i.key==='changeUp'})?'事情自身出现转机（用神动化生旺）':'出现生扶用神的人或事');
    var answer={
      favorable:lead+p.act+'的可能较大。',
      obstructed:lead+p.act+'会有些波折，但多半能成。',
      strained:lead+want+'不太容易；除非'+rescueText+'。',
      unfavorable:lead+p.act+'的可能性偏小。',
      mixed:lead+p.act+'成与不成的依据都有，规则难下定论。',
      timing:lead+p.act+'眼下还没落实，关键看应期。'
    }[tendency];
    answer=answer.replace(/^([^\s])/,function(c){return c});
    // 关键理由：根基一句 + 最重的两条动变
    var rootItems=items.filter(function(i){return i.group==='root'&&i.weight!==0});
    var rootTone=R<=-3?'日月都不帮：':(R>=2?'日月扶持：':(R<0?'日月偏弱：':'日月平平：'));
    var reasons=[];
    if(rootItems.length)reasons.push({tone:R>=0?'support':'constraint',text:rootTone+rootItems.map(function(i){return i.text}).join('；')});
    else reasons.push({tone:'neutral',text:'日月对用神无明显生克（'+items.filter(function(i){return i.group==='root'}).map(function(i){return i.text}).join('；')+'）'});
    items.filter(function(i){return i.group!=='root'&&i.weight!==0}).sort(function(x,y){return Math.abs(y.weight)-Math.abs(x.weight)}).slice(0,2).forEach(function(i){reasons.push({tone:i.weight>0?'support':'constraint',text:i.text})});
    if(chain&&!reasons.some(function(r){return /连续相生/.test(r.text)}))reasons[reasons.length-1]={tone:'support',text:'原神与忌神同动：忌神生原神、原神生用神，连续相生'};
    if(reasons.length<2){var zero=items.filter(function(i){return i.group!=='root'})[0];reasons.push({tone:'neutral',text:zero?zero.text:'卦中没有能直接生克用神的动爻，以日月为主'})}
    // 应期线索
    var timing=[];
    if(R<0||focus.hidden){
      var helpers=BRANCHES.filter(function(b){return b===br||ELEMENTS[b]===el||GENERATES[ELEMENTS[b]]===el});
      timing.push('用神偏弱，多应在得生扶之日：逢'+helpers.join('、')+'日');
      var hours=nightHours(input.question);
      if(hours){var good=hours.filter(function(h){return helpers.indexOf(h)>=0});if(good.length)timing.push('问的是'+(p.time||'当天')+'，近应看时辰：'+good.map(function(h){return h+'时（'+HOURS[h]+'）'}).join('、'))}
    }else timing.push('用神有气，事多应在用神值日（逢'+br+'日）或合日（逢'+COMBINE[br]+'日）前后');
    (a.voidDetails||[]).filter(function(v){return v.target!=='用神'&&sources.some(function(x){return v.target.indexOf(x.lineLabel)===0})}).forEach(function(v){timing.push('原神'+v.target.replace(/\s+/g,'')+'逢旬空'+(v.status==='不为空'?'（'+v.notVoidReasons[0]+'，不影响生力），应期可参考：':'（'+v.status+'，生力待落实）：')+v.timing.replace(/^出空：[^；]*；/,''))});
    if(focusVoid&&focusVoid.status!=='不为空')timing.push('用神旬空：'+focusVoid.timing);
    if(monthBroken)timing.push('用神月破：出月，或逢'+br+'日填实、逢'+COMBINE[br]+'日相合之时');
    if(focus.hidden)timing.push('伏神待提拔：飞神被冲（逢'+CLASH[line.original.branch]+'日）或伏神值日（逢'+br+'日）');
    return {version:VERSION,tendency:tendency,label:label,rule:rule.id,ruleWhen:rule.when,ruleWhy:rule.why,answer:answer,reasons:reasons.slice(0,3),timing:timing.slice(0,3),items:items,scores:{root:R,move:M,total:T,positive:P,negative:N,rescue:rescue},focusName:name,disclaimer:'规则初断：只按传统纳甲规则把日月、动变、空破的先后轻重排出倾向，不是确定结果；可展开“为什么这么断”核对每一条。'};
  }
  return {version:VERSION,build:build,decisionTable:DECISION_TABLE,labels:LABELS,sources:SRC};
});
