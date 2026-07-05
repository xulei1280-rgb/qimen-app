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
  function assessStrength(dayStem,monthBranch,scores){
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
  function usefulElements(dayStem,strength){
    var dayWx=STEM_WX[dayStem],resource=Object.keys(gen).find(function(k){return gen[k]===dayWx}),officer=Object.keys(ctrl).find(function(k){return ctrl[k]===dayWx});
    if(strength.indexOf('弱')>=0)return {use:[resource,dayWx],avoid:[gen[dayWx],ctrl[dayWx]],why:'日主偏弱，先看印比扶身。'};
    if(strength.indexOf('强')>=0)return {use:[gen[dayWx],ctrl[dayWx],officer],avoid:[resource,dayWx],why:'日主偏强，先看泄耗制化。'};
    return {use:[gen[dayWx],ctrl[dayWx]],avoid:[resource],why:'日主接近中和，取流通与成事之气。'};
  }
  function patternName(dayStem,monthBranch){
    var main=(HIDDEN[monthBranch]||[])[0],god=main?tenGod(dayStem,main):'';
    if(!god)return '格局参考';
    if(god==='比肩')return '建禄格参考';
    if(god==='劫财')return '月刃格参考';
    return god+'格参考';
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
    var strength=assessStrength(dayStem,monthBranch,scores);
    var useful=usefulElements(dayStem,strength);
    var main=(HIDDEN[monthBranch]||[])[0],primary=patternName(dayStem,monthBranch),evidence=[];
    var stems=[pillars.year[0],pillars.month[0],pillars.day[0],pillars.hour[0]];
    var monthGod=main?tenGod(dayStem,main):'';
    var revealed=(HIDDEN[monthBranch]||[]).filter(function(s){return stems.indexOf(s)>=0});
    var roots=Object.keys(pillars).filter(function(k){return (HIDDEN[pillars[k][1]]||[]).indexOf(dayStem)>=0}).map(function(k){return ({year:'年支',month:'月支',day:'日支',hour:'时支'})[k]+pillars[k][1]});
    evidence.push('月令'+monthBranch+'本气'+(main||'无')+(monthGod?'为'+monthGod:'')+'，以月令定主格。');
    evidence.push('透干：'+(revealed.length?revealed.map(function(s){return s+tenGod(dayStem,s)}).join('、'):'月令藏干未明显透出')+'。');
    evidence.push('通根：'+(roots.length?dayStem+'见于'+roots.join('、'):'日主未见直接通根')+'。');
    evidence.push('旺衰：'+strength+'；五行计分 '+WUXING.map(function(w){return w+(scores[w]||0).toFixed(1)}).join('、')+'。');
    evidence.push('喜用：'+useful.use.join('、')+'；慎用：'+useful.avoid.join('、')+'；'+useful.why);
    var candidates=(HIDDEN[monthBranch]||[]).map(function(s){return tenGod(dayStem,s)+'格'}).filter(Boolean);
    return {primary:primary,pattern:primary,candidates:candidates,strength:strength,useful:useful,evidence:evidence};
  }

  var api={constants:{WUXING:WUXING,STEM_WX:STEM_WX,BRANCH_WX:BRANCH_WX,HIDDEN:HIDDEN,SHENSHA_RULES:SHENSHA_RULES},SHENSHA_RULES:SHENSHA_RULES,stemPolarity:stemPolarity,tenGod:tenGod,changsheng:changsheng,kongWang:kongWang,buildPillars:buildPillars,scoreWuxing:scoreWuxing,assessStrength:assessStrength,usefulElements:usefulElements,patternName:patternName,shenShaForPillar:shenShaForPillar,analyzePattern:analyzePattern};
  root.BaziEngine=api;
  if(root.window)root.window.BaziEngine=api; // window.BaziEngine
})(typeof globalThis!=='undefined'?globalThis:this);
