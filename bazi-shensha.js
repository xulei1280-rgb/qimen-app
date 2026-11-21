(function(root){
  'use strict';
  var calendar=typeof module==='object'&&module.exports?require('./qimen.js'):null;
  var BRANCHES=calendar?calendar.DI_ZHI:DI_ZHI;
  var KONG_BY_XUN={0:'戌亥',1:'申酉',2:'午未',3:'辰巳',4:'寅卯',5:'子丑'};
  var combineStem={甲:'己',己:'甲',乙:'庚',庚:'乙',丙:'辛',辛:'丙',丁:'壬',壬:'丁',戊:'癸',癸:'戊'};
  function getGZ60(){return calendar?calendar.GZ60:GZ60}
  function has(map,key,value){return (map[key]||'').indexOf(value)>=0}
  function add(out,name){if(out.indexOf(name)<0)out.push(name)}

  var SHENSHA_RULES={
    tianyi:{甲:'丑未',戊:'丑未',庚:'丑未',乙:'子申',己:'子申',丙:'亥酉',丁:'亥酉',壬:'卯巳',癸:'卯巳',辛:'寅午'},
    taiji:{甲:'子午',乙:'子午',丙:'卯酉',丁:'卯酉',戊:'辰戌丑未',己:'辰戌丑未',庚:'寅亥',辛:'寅亥',壬:'巳申',癸:'巳申'},
    wenchang:{甲:'巳',乙:'午',丙:'申',丁:'酉',戊:'申',己:'酉',庚:'亥',辛:'子',壬:'寅',癸:'卯'},
    tianchu:{甲:'巳',乙:'午',丙:'巳',丁:'午',戊:'申',己:'酉',庚:'亥',辛:'子',壬:'寅',癸:'卯'},
    fuxing:{甲:'寅子',乙:'丑卯',丙:'寅子',丁:'亥',戊:'申',己:'未',庚:'午',辛:'巳',壬:'辰',癸:'丑卯'},
    guoyin:{甲:'戌',乙:'亥',丙:'丑',丁:'寅',戊:'丑',己:'寅',庚:'辰',辛:'巳',壬:'未',癸:'申'},
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
    guchen:{亥:'寅',子:'寅',丑:'寅',寅:'巳',卯:'巳',辰:'巳',巳:'申',午:'申',未:'申',申:'亥',酉:'亥',戌:'亥'},
    yuanshen:{子:'未',丑:'申',寅:'酉',卯:'戌',辰:'亥',巳:'子',午:'丑',未:'寅',申:'卯',酉:'辰',戌:'巳',亥:'午'},
    yuanshenYinMaleYangFemale:{子:'巳',丑:'午',寅:'未',卯:'申',辰:'酉',巳:'戌',午:'亥',未:'子',申:'丑',酉:'寅',戌:'卯',亥:'辰'},
    tianDe:{寅:'丁',卯:'申',辰:'壬',巳:'辛',午:'亥',未:'甲',申:'癸',酉:'寅',戌:'丙',亥:'乙',子:'巳',丑:'庚'},
    tianDeBranchCombine:{卯:'巳',午:'寅',酉:'亥',子:'申'},
    monthDeStem:{寅:'丙',午:'丙',戌:'丙',申:'壬',子:'壬',辰:'壬',亥:'甲',卯:'甲',未:'甲',巳:'庚',酉:'庚',丑:'庚'},
    dexiuStem:{寅:'丙丁戊癸',午:'丙丁戊癸',戌:'丙丁戊癸',申:'壬癸戊己丙辛甲己',子:'壬癸戊己丙辛甲己',辰:'壬癸戊己丙辛甲己',亥:'甲乙丁壬',卯:'甲乙丁壬',未:'甲乙丁壬',巳:'庚辛乙庚',酉:'庚辛乙庚',丑:'庚辛乙庚'},
    tongzi:{寅:'寅子',卯:'寅子',辰:'寅子',巳:'卯未辰',午:'卯未辰',未:'卯未辰',申:'寅子',酉:'寅子',戌:'寅子',亥:'卯未辰',子:'卯未辰',丑:'卯未辰'},
    tongziNayin:{金:'午卯',木:'午卯',水:'酉戌',火:'酉戌',土:'辰巳'},
    xuetang:{金:'巳',木:'亥',水:'申',土:'申',火:'寅'},
    zhengXuetang:{金:'辛巳',木:'己亥',水:'甲申',土:'戊申',火:'丙寅'},
    ciguan:{金:'申',木:'寅',水:'亥',土:'亥',火:'巳'},
    xueren:{寅:'丑',卯:'未',辰:'寅',巳:'申',午:'卯',未:'酉',申:'辰',酉:'戌',戌:'巳',亥:'亥',子:'午',丑:'子'},
    luowang:{戌:'亥',亥:'戌',辰:'巳',巳:'辰'},
    luowangNayin:{火:'戌亥',水:'辰巳',土:'辰巳'},
    shiling:['甲辰','乙亥','丙辰','丁酉','戊午','庚戌','庚寅','辛亥','壬寅','癸未'],
    tenBad:['甲辰','乙巳','丙申','丁亥','戊戌','己丑','庚辰','辛巳','壬申','癸亥'],
    kuigang:['庚辰','庚戌','壬辰','戊戌'],
    yinYangError:['丙子','丁丑','戊寅','辛卯','壬辰','癸巳','丙午','丁未','戊申','辛酉','壬戌','癸亥'],
    guluan:['乙巳','丁巳','辛亥','戊申','甲寅','壬子','丙午','戊午'],
    tianShe:{寅:'戊寅',卯:'戊寅',辰:'戊寅',巳:'甲午',午:'甲午',未:'甲午',申:'戊申',酉:'戊申',戌:'戊申',亥:'甲子',子:'甲子',丑:'甲子'}
  };

  var NAYIN_ELEMENTS='金火木土金火水土金木水土火木水金火木土金火水土金木水土火木水'; // 甲子起，每两个干支共一纳音

  function kongWang(gz){
    var idx=getGZ60().indexOf(gz);
    if(idx<0)return '';
    return KONG_BY_XUN[Math.floor(idx/10)]||'';
  }

  // 柱位由调用方传入。相同干支可同时出现在原局不同柱或岁运。
  function shenShaForPillar(data,gz,column){
    if(!gz||gz.length!==2)return [];
    var p=data.pillars,stem=p.day[0],yearStem=p.year[0],yearBranch=p.year[1],dayBranch=p.day[1],monthBranch=p.month[1];
    var targetStem=gz[0],branch=gz[1],rules=SHENSHA_RULES,out=[];
    var yearSource=column!=='year',daySource=column!=='day';
    var yearNayin=NAYIN_ELEMENTS[Math.floor(getGZ60().indexOf(p.year)/2)];
    var tianDe=rules.tianDe[monthBranch],monthDe=rules.monthDeStem[monthBranch];
    var yangMaleYinFemale=('甲丙戊庚壬'.indexOf(yearStem)>=0)===(data.gender!=='女');
    function fromYear(rule){return yearSource&&rule[yearBranch]===branch}
    function fromYearOrDay(rule){return fromYear(rule)||(daySource&&rule[dayBranch]===branch)}
    if(has(rules.tianyi,stem,branch)||has(rules.tianyi,yearStem,branch))add(out,'天乙贵人');
    if(has(rules.taiji,stem,branch)||has(rules.taiji,yearStem,branch))add(out,'太极贵人');
    if(rules.wenchang[stem]===branch||rules.wenchang[yearStem]===branch)add(out,'文昌贵人');
    if(rules.tianchu[stem]===branch||rules.tianchu[yearStem]===branch)add(out,'天厨贵人');
    if(has(rules.fuxing,stem,branch)||has(rules.fuxing,yearStem,branch))add(out,'福星贵人');
    if(rules.guoyin[stem]===branch||rules.guoyin[yearStem]===branch)add(out,'国印贵人');
    if(rules.jinyu[stem]===branch)add(out,'金舆');
    if(rules.liuxia[stem]===branch)add(out,'流霞');
    if(rules.hongyan[stem]===branch)add(out,'红艳');
    if(rules.lushen[stem]===branch)add(out,'禄神');
    if(rules.yangren[stem]===branch)add(out,'羊刃');
    if(fromYearOrDay(rules.peach))add(out,'桃花');
    if(fromYearOrDay(rules.huagai))add(out,'华盖');
    if(fromYearOrDay(rules.yima))add(out,'驿马');
    if(fromYearOrDay(rules.jiangxing))add(out,'将星');
    if(fromYearOrDay(rules.jiesha))add(out,'劫煞');
    if(fromYearOrDay(rules.wangshen))add(out,'亡神');
    if(fromYear(rules.zaisha))add(out,'灾煞');
    if(fromYear(yangMaleYinFemale?rules.yuanshen:rules.yuanshenYinMaleYangFemale))add(out,'元辰');
    if(fromYear(rules.hongluan))add(out,'红鸾');
    if(fromYear(rules.tianxi))add(out,'天喜');
    if(fromYear(rules.pima))add(out,'披麻');
    if(fromYear(rules.diaoke))add(out,'吊客');
    if(fromYear(rules.guasu))add(out,'寡宿');
    if(fromYear(rules.guchen))add(out,'孤辰');
    if(fromYearOrDay(rules.luowang))add(out,'天罗地网');
    if(BRANCHES[(BRANCHES.indexOf(monthBranch)+11)%12]===branch)add(out,'天医');
    if(tianDe===targetStem||tianDe===branch)add(out,'天德贵人');
    if(combineStem[tianDe]===targetStem||rules.tianDeBranchCombine[monthBranch]===branch)add(out,'天德合');
    if(monthDe===targetStem)add(out,'月德贵人');
    if(combineStem[monthDe]===targetStem)add(out,'月德合');
    if(has(rules.dexiuStem,monthBranch,targetStem))add(out,'德秀贵人');
    if((column==='day'||column==='hour')&&(has(rules.tongzi,monthBranch,branch)||has(rules.tongziNayin,yearNayin,branch)))add(out,'童子煞');
    if(column==='day'){
      if(has(rules.luowangNayin,yearNayin,branch)){
        if(yearNayin==='火')add(out,'天罗');
        else add(out,'地网');
      }
      if(rules.shiling.indexOf(gz)>=0)add(out,'十灵日');
      if(rules.tenBad.indexOf(gz)>=0)add(out,'十恶大败');
      if(rules.kuigang.indexOf(gz)>=0)add(out,'魁罡');
      if(rules.yinYangError.indexOf(gz)>=0)add(out,'阴差阳错');
      if(rules.guluan.indexOf(gz)>=0)add(out,'孤鸾');
      if(rules.tianShe[monthBranch]===gz)add(out,'天赦日');
    }
    if(yearSource&&rules.ciguan[yearNayin]===branch)add(out,'词馆');
    if(yearSource&&rules.xuetang[yearNayin]===branch){
      if(gz===rules.zhengXuetang[yearNayin])add(out,'正学堂');
      else add(out,'学堂');
    }
    if(rules.xueren[monthBranch]===branch)add(out,'血刃');
    if(kongWang(p.day).indexOf(branch)>=0)add(out,'空亡');
    return out;
  }

  function birthRelations(data){
    var pillars=data.pillars,arr=[],branches=[pillars.year[1],pillars.month[1],pillars.day[1],pillars.hour[1]],rel={'子丑':'六合','寅亥':'六合','卯戌':'六合','辰酉':'六合','巳申':'六合','午未':'六合','子午':'冲','丑未':'冲','寅申':'冲','卯酉':'冲','辰戌':'冲','巳亥':'冲'};
    for(var i=0;i<branches.length;i++)for(var j=i+1;j<branches.length;j++){
      var a=branches[i],b=branches[j],key=[a,b].sort(function(x,y){return BRANCHES.indexOf(x)-BRANCHES.indexOf(y)}).join('');
      if(rel[key])arr.push(a+b+rel[key]);
    }
    var dayVoids=[];
    Object.keys(pillars).forEach(function(column){
      var gz=pillars[column],branch=gz[1];
      shenShaForPillar(data,gz,column).forEach(function(name){
        if(name==='桃花'||name==='驿马'||name==='华盖')add(arr,name+'在'+branch);
        if(name==='空亡')add(dayVoids,branch);
      });
    });
    kongWang(pillars.day).split('').forEach(function(branch){if(dayVoids.indexOf(branch)>=0)arr.push('日空 '+branch)});
    return arr.length?arr:['暂无明显合冲空亡提示'];
  }

  var api={rules:SHENSHA_RULES,forPillar:shenShaForPillar,kongWang:kongWang,birthRelations:birthRelations};
  if(calendar)module.exports=api;
  else root.BaziShenSha=api;
})(typeof globalThis!=='undefined'?globalThis:this);
