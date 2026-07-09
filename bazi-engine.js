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
  function strengthScore(dayStem,pillars){
    var parts=[],support=0;
    function add(label,weight,ratio){
      var score=weight*ratio;
      support+=score;
      parts.push({label:label,weight:weight,score:Math.round(score*10)/10});
    }
    add('年干',STRENGTH_WEIGHTS.yearStem,supportRatio(dayStem,pillars.year[0]));
    add('月干',STRENGTH_WEIGHTS.monthStem,supportRatio(dayStem,pillars.month[0]));
    add('时干',STRENGTH_WEIGHTS.hourStem,supportRatio(dayStem,pillars.hour[0]));
    add('年支',STRENGTH_WEIGHTS.yearBranch,branchSupportRatio(dayStem,pillars.year[1]));
    add('月令',STRENGTH_WEIGHTS.monthBranch,branchSupportRatio(dayStem,pillars.month[1]));
    add('日支',STRENGTH_WEIGHTS.dayBranch,branchSupportRatio(dayStem,pillars.day[1]));
    add('时支',STRENGTH_WEIGHTS.hourBranch,branchSupportRatio(dayStem,pillars.hour[1]));
    return {support:Math.round(support*10)/10,total:100,parts:parts};
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
  function seasonTune(monthBranch){
    if('亥子丑'.indexOf(monthBranch)>=0)return {use:['火','木'],avoid:['水'],why:'冬令寒湿，先取火暖局，木助火源。'};
    if('巳午未'.indexOf(monthBranch)>=0)return {use:['水','金'],avoid:['火'],why:'夏令火燥，先取水润燥，金生水为源。'};
    if('申酉戌'.indexOf(monthBranch)>=0)return {use:['火','木'],avoid:['金'],why:'秋令金肃偏燥，取火炼金暖局，木引生机。'};
    if('寅卯辰'.indexOf(monthBranch)>=0)return {use:['火','土'],avoid:['木'],why:'春令木旺，取火泄秀，土承载成事。'};
    return {use:[],avoid:[],why:'调候不作首要。'};
  }
  function patternUseElements(dayWx,mainPattern){
    var resource=resourceElement(dayWx),output=gen[dayWx],wealth=ctrl[dayWx],officer=officerElement(dayWx);
    if(/从格：从杀格/.test(mainPattern))return {use:[officer,wealth],avoid:[resource,dayWx],why:'从杀成格，顺从官杀旺势，取财生杀，忌印比扶身破从。'};
    if(/从格：从财格/.test(mainPattern))return {use:[wealth,output],avoid:[resource,dayWx],why:'从财成格，顺从财势，取食伤生财，忌印比扶身破从。'};
    if(/从格：从儿格/.test(mainPattern))return {use:[output,wealth],avoid:[resource,dayWx],why:'从儿成格，顺从食伤泄秀，喜财星承接，忌印星回克食伤。'};
    if(/化气格/.test(mainPattern)){
      var transformed=(mainPattern.match(/化气格：..化([木火土金水])/)||[])[1];
      return {use:[transformed,resourceElement(transformed)],avoid:[officerElement(transformed)],why:'化气成格，顺化神旺势，忌克化神之气破化。'};
    }
    if(/专旺格/.test(mainPattern))return {use:[dayWx,resource],avoid:[officer,wealth],why:'专旺成格，顺日主一方旺势，忌官杀财星逆势破格。'};
    if(/伤官见官/.test(mainPattern))return {use:[resource,wealth],avoid:[output],why:'先看印星制伤、财星通关，避免伤官与官星直接相战。'};
    if(/财多身弱/.test(mainPattern))return {use:[resource,dayWx],avoid:[wealth,output],why:'财星太重而身弱，先取印比扶身承财。'};
    if(/食伤混杂/.test(mainPattern))return {use:[wealth,resource],avoid:[output],why:'食神伤官混杂，先看财星流通或印星制化，忌再增食伤。'};
    if(/杀印相生|官印相生/.test(mainPattern))return {use:[resource,dayWx],avoid:[wealth,output],why:'格局以印化官杀、生扶日主为核心。'};
    if(/食神制杀/.test(mainPattern))return {use:[output,resource],avoid:[wealth],why:'格局以食神制杀为主，兼看印星护身。'};
    if(/伤官配印/.test(mainPattern))return {use:[resource],avoid:[wealth],why:'格局以印制伤、护身清局为核心。'};
    if(/伤官生财/.test(mainPattern))return {use:[output,wealth],avoid:[resource],why:'格局以食伤生财、流通成事为核心。'};
    if(/财官印相生/.test(mainPattern))return {use:[wealth,officer,resource],avoid:[output],why:'格局重财官印顺生，忌食伤破官过重。'};
    if(/官杀混杂|杀重混官/.test(mainPattern))return {use:[resource,dayWx],avoid:[wealth,output],why:'先清官杀混杂，再取印比化杀扶身。'};
    return {use:[],avoid:[],why:'未见可单独定用的成格组合，先按扶抑与调候。'};
  }
  function usefulElements(dayStem,strength,context){
    context=context||{};
    var dayWx=STEM_WX[dayStem],resource=resourceElement(dayWx),output=gen[dayWx],wealth=ctrl[dayWx],officer=officerElement(dayWx);
    var fuyi;
    if(strength.indexOf('弱')>=0)fuyi={use:[resource,dayWx],avoid:[output,wealth],why:'日主偏弱，先看印比扶身。'};
    else if(strength.indexOf('强')>=0)fuyi={use:[output,wealth,officer],avoid:[resource,dayWx],why:'日主偏强，先看泄耗制化。'};
    else fuyi={use:[output,wealth],avoid:[resource],why:'日主接近中和，取流通与成事之气。'};
    var tiaohou=seasonTune(context.monthBranch||'');
    var pattern=patternUseElements(dayWx,context.mainPattern||'');
    var use=unique(pattern.use.concat(fuyi.use));
    if(strength.indexOf('弱')>=0){
      use=unique(use.concat(tiaohou.use.filter(function(w){return w===resource||w===dayWx})));
    }else{
      use=unique(use.concat(tiaohou.use));
    }
    var avoid=unique(pattern.avoid.concat(fuyi.avoid,tiaohou.avoid)).filter(function(w){return use.indexOf(w)<0});
    return {use:use,avoid:avoid,why:'扶抑：'+fuyi.why+' 调候：'+tiaohou.why+' 格局：'+pattern.why,layers:{fuyi:fuyi,tiaohou:tiaohou,pattern:pattern}};
  }
  function patternName(dayStem,monthBranch){
    var main=(HIDDEN[monthBranch]||[])[0],god=main?tenGod(dayStem,main):'';
    if(!god)return '命格待判';
    if(god==='比肩')return '建禄格';
    if(god==='劫财')return '月刃格';
    return god+'格';
  }
  function tenGodCounts(dayStem,pillars){
    var counts={};
    function addGod(g){if(g)counts[g]=(counts[g]||0)+1}
    ['year','month','hour'].forEach(function(k){addGod(tenGod(dayStem,pillars[k][0]))});
    Object.keys(pillars).forEach(function(k){(HIDDEN[pillars[k][1]]||[]).forEach(function(s){addGod(tenGod(dayStem,s))})});
    return counts;
  }
  function comboPatterns(monthGod,counts,context){
    var out=[];
    function has(name){return (counts[name]||0)>0}
    function add(name,score){if(!out.some(function(x){return x.name===name}))out.push({name:name,score:score})}
    var mixed=context&&context.mixed;
    var weak=context&&/弱/.test(context.strength||'');
    var wealth=(counts['正财']||0)+(counts['偏财']||0);
    var output=(counts['食神']||0)+(counts['伤官']||0);
    if(mixed&&monthGod==='正官')add('官杀混杂待清',96);
    if(monthGod==='伤官'&&has('正官'))add('伤官见官待制',94);
    if(weak&&wealth>=4)add('财多身弱待扶',92);
    if(monthGod==='七杀'&&(has('正印')||has('偏印')))add('杀印相生格',95);
    if((has('七杀')||monthGod==='七杀')&&has('食神'))add('食神制杀格',90);
    if(monthGod==='伤官'&&(has('正印')||has('偏印')))add('伤官配印格',88);
    if(monthGod==='正官'&&(has('正印')||has('偏印'))&&!mixed)add('官印相生格',86);
    if((has('正财')||has('偏财'))&&(has('正官')||has('七杀'))&&(has('正印')||has('偏印'))&&!mixed)add('财官印相生格',84);
    if((monthGod==='食神'||monthGod==='伤官')&&has('食神')&&has('伤官')&&output>=3)add('食伤混杂待清',89);
    if(monthGod==='伤官'&&(has('正财')||has('偏财')))add('伤官生财格',78);
    if((has('正财')||has('偏财'))&&(has('七杀')||monthGod==='七杀'))add('财滋弱杀格',72);
    return out.sort(function(a,b){return b.score-a.score}).map(function(x){return x.name});
  }
  function specialPatterns(dayStem,pillars,scores,counts,strength,roots){
    var out=[],dayWx=STEM_WX[dayStem],total=WUXING.reduce(function(sum,w){return sum+(scores[w]||0)},0)||1;
    var resource=resourceElement(dayWx),weighted=strengthScore(dayStem,pillars).support;
    var selfPower=((scores[dayWx]||0)+(scores[resource]||0)*0.65)/total;
    var killing=(counts['正官']||0)+(counts['七杀']||0),wealth=(counts['正财']||0)+(counts['偏财']||0),output=(counts['食神']||0)+(counts['伤官']||0);
    var supportGods=(counts['比肩']||0)+(counts['劫财']||0)+(counts['正印']||0)+(counts['偏印']||0);
    if(roots.length===0&&weighted<18&&supportGods===0){
      if(killing>=4)out.push('从格：从杀格');
      else if(wealth>=4)out.push('从格：从财格');
      else if(output>=4)out.push('从格：从儿格');
    }else if(roots.length===0&&weighted<30&&supportGods<=1){
      if(killing>=3)out.push('特殊线索参考：假从杀倾向');
      else if(wealth>=3)out.push('特殊线索参考：假从财倾向');
      else if(output>=3)out.push('特殊线索参考：假从儿倾向');
    }
    var selfElementPower=(scores[dayWx]||0)/total;
    if(weighted>=80&&selfElementPower>0.62&&BRANCH_WX[pillars.month[1]]===dayWx)out.push('专旺格：'+({木:'曲直格',火:'炎上格',土:'稼穑格',金:'从革格',水:'润下格'}[dayWx]||'专旺格'));
    else if(weighted>=68&&selfElementPower>0.5)out.push('特殊线索参考：假'+({木:'曲直',火:'炎上',土:'稼穑',金:'从革',水:'润下'}[dayWx]||'专旺')+'格倾向');
    var transform={甲己:'土',乙庚:'金',丙辛:'水',丁壬:'木',戊癸:'火'};
    Object.keys(transform).forEach(function(pair){
      var other=pair[0]===dayStem?pair[1]:(pair[1]===dayStem?pair[0]:'');
      if(other&&(pillars.month[0]===other||pillars.hour[0]===other)){
        if(BRANCH_WX[pillars.month[1]]===transform[pair])out.push('化气格：'+pair+'化'+transform[pair]);
        else out.push('特殊线索参考：'+pair+'化'+transform[pair]+'未成倾向');
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
    if(/杀印相生|食神制杀|伤官配印|官印相生|财官印相生/.test(mainPattern))return mainPattern.replace('格','')+'，结构闭环，层次偏高';
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
    if(/杀印相生|食神制杀|伤官配印|官印相生|财官印相生/.test(mainPattern))return '成格有力：结构闭环，但仍需看破格、清浊和大运是否承接。';
    if(/伤官生财|财滋弱杀/.test(mainPattern))return '有成格线索：可成事，但层次取决于流通、根气与忌神是否被制化。';
    if(mainPattern==='未见明确成格')return '未见明确成格：先按命格、扶抑、调候和大运细断。';
    return '格局状态需结合全盘细断。';
  }
  function trueSpecialPattern(specials){
    return ((specials||[]).find(function(x){return /^从格：|^化气格：|^专旺格：/.test(x)})||'');
  }
  function patternBasis(dayStem,monthBranch,monthGod){
    var main=(HIDDEN[monthBranch]||[])[0];
    return main?'月令'+monthBranch+'主气'+main+'为'+dayStem+'日主的'+monthGod+'，以月令定命格。':'月令主气待判，命格需结合全盘。';
  }
  function patternState(primary,monthGod,counts,strength,mainPattern,revealed){
    var out=[];
    var mixed=(counts['正官']||0)>0&&(counts['七杀']||0)>0;
    if(mixed)out.push(primary+'不纯，官杀混杂');
    else out.push(primary+'气较专');
    if(!revealed.length)out.push('月令主气未透，多看地支藏干与全盘流通');
    if(strength.indexOf('弱')>=0)out.push('日主'+strength+'，需印比化扶');
    else if(strength.indexOf('强')>=0)out.push('日主'+strength+'，宜泄耗制化');
    else out.push('日主'+strength+'，重在流通平衡');
    if(mainPattern&&mainPattern!=='未见明确成格')out.push('结构可看'+mainPattern);
    return out.join('，')+'。';
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
    var main=(HIDDEN[monthBranch]||[])[0],primary=patternName(dayStem,monthBranch),evidence=[];
    var stems=[pillars.year[0],pillars.month[0],pillars.day[0],pillars.hour[0]];
    var monthGod=main?tenGod(dayStem,main):'';
    var counts=tenGodCounts(dayStem,pillars);
    var revealed=(HIDDEN[monthBranch]||[]).filter(function(s){return stems.indexOf(s)>=0});
    var roots=Object.keys(pillars).filter(function(k){return (HIDDEN[pillars[k][1]]||[]).indexOf(dayStem)>=0}).map(function(k){return ({year:'年支',month:'月支',day:'日支',hour:'时支'})[k]+pillars[k][1]});
    evidence.push('月令'+monthBranch+'本气'+(main||'无')+(monthGod?'为'+monthGod:'')+'，以月令定主格。');
    evidence.push('透干：'+(revealed.length?revealed.map(function(s){return s+tenGod(dayStem,s)}).join('、'):'月令藏干未明显透出')+'。');
    evidence.push('通根：'+(roots.length?dayStem+'见于'+roots.join('、'):'日主未见直接通根')+'。');
    evidence.push('旺衰：'+strength+'；扶身权重 '+weightedStrength.support+'/100；五行计分 '+WUXING.map(function(w){return w+(scores[w]||0).toFixed(1)}).join('、')+'。');
    var candidates=(HIDDEN[monthBranch]||[]).map(function(s){return tenGod(dayStem,s)+'格'}).filter(Boolean);
    var mixed=(counts['正官']||0)>0&&(counts['七杀']||0)>0;
    var combos=comboPatterns(monthGod,counts,{mixed:mixed,strength:strength});
    var specials=specialPatterns(dayStem,pillars,scores,counts,strength,roots);
    var clues=classifiedClues({pillars:pillars,dayStem:dayStem});
    var trueSpecial=trueSpecialPattern(specials);
    var priorityCombo=(combos[0]&&/官杀混杂|伤官见官|财多身弱|食伤混杂/.test(combos[0]))?combos[0]:'';
    var mainPattern=(/^从格：|^专旺格：/.test(trueSpecial)?trueSpecial:'')||priorityCombo||trueSpecial||combos[0]||'未见明确成格';
    var useful=usefulElements(dayStem,strength,{pillars:pillars,monthBranch:monthBranch,monthGod:monthGod,mainPattern:mainPattern,counts:counts,scores:scores});
    evidence.push('喜用：'+useful.use.join('、')+'；慎用：'+useful.avoid.join('、')+'；'+useful.why);
    var level=patternLevel(mainPattern,monthGod,counts,strength,specials);
    var basis=patternBasis(dayStem,monthBranch,monthGod);
    var state=patternState(primary,monthGod,counts,strength,mainPattern,revealed);
    var verdict=patternVerdict(mainPattern,strength,specials);
    return {primary:primary,pattern:primary,patternBasis:basis,patternState:state,patternVerdict:verdict,candidates:candidates,comboPatterns:combos,mainPattern:mainPattern,patternLevel:level,specialPatterns:specials,classifiedClues:clues,strength:strength,strengthScore:weightedStrength,useful:useful,evidence:evidence};
  }

  var api={constants:{WUXING:WUXING,STEM_WX:STEM_WX,BRANCH_WX:BRANCH_WX,HIDDEN:HIDDEN,SHENSHA_RULES:SHENSHA_RULES},SHENSHA_RULES:SHENSHA_RULES,stemPolarity:stemPolarity,tenGod:tenGod,changsheng:changsheng,kongWang:kongWang,buildPillars:buildPillars,scoreWuxing:scoreWuxing,strengthScore:strengthScore,assessStrength:assessStrength,usefulElements:usefulElements,patternName:patternName,shenShaForPillar:shenShaForPillar,analyzePattern:analyzePattern};
  root.BaziEngine=api;
  if(root.window)root.window.BaziEngine=api; // window.BaziEngine
})(typeof globalThis!=='undefined'?globalThis:this);
