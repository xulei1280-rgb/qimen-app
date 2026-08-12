(function(root){
  'use strict';

  var VERSION='LIUYAO-NAJIA-2026.08.12-v1';
  var STEMS='甲乙丙丁戊己庚辛壬癸'.split('');
  var BRANCHES='子丑寅卯辰巳午未申酉戌亥'.split('');
  var ELEMENTS={子:'水',丑:'土',寅:'木',卯:'木',辰:'土',巳:'火',午:'火',未:'土',申:'金',酉:'金',戌:'土',亥:'水'};
  var GENERATES={木:'火',火:'土',土:'金',金:'水',水:'木'};
  var CONTROLS={木:'土',土:'水',水:'火',火:'金',金:'木'};
  var TRIGRAMS={
    '111':{name:'乾',image:'天',element:'金'},
    '000':{name:'坤',image:'地',element:'土'},
    '100':{name:'震',image:'雷',element:'木'},
    '011':{name:'巽',image:'风',element:'木'},
    '010':{name:'坎',image:'水',element:'水'},
    '101':{name:'离',image:'火',element:'火'},
    '001':{name:'艮',image:'山',element:'土'},
    '110':{name:'兑',image:'泽',element:'金'}
  };
  var TRIGRAM_CODE={乾:'111',坤:'000',震:'100',巽:'011',坎:'010',离:'101',艮:'001',兑:'110'};
  var NAJIA={
    乾:{inner:{stem:'甲',branches:'子寅辰'},outer:{stem:'壬',branches:'午申戌'}},
    坤:{inner:{stem:'乙',branches:'未巳卯'},outer:{stem:'癸',branches:'丑亥酉'}},
    震:{inner:{stem:'庚',branches:'子寅辰'},outer:{stem:'庚',branches:'午申戌'}},
    巽:{inner:{stem:'辛',branches:'丑亥酉'},outer:{stem:'辛',branches:'未巳卯'}},
    坎:{inner:{stem:'戊',branches:'寅辰午'},outer:{stem:'戊',branches:'申戌子'}},
    离:{inner:{stem:'己',branches:'卯丑亥'},outer:{stem:'己',branches:'酉未巳'}},
    艮:{inner:{stem:'丙',branches:'辰午申'},outer:{stem:'丙',branches:'戌子寅'}},
    兑:{inner:{stem:'丁',branches:'巳卯丑'},outer:{stem:'丁',branches:'亥酉未'}}
  };
  var SIX_SPIRITS='青龙朱雀勾陈螣蛇白虎玄武'.match(/青龙|朱雀|勾陈|螣蛇|白虎|玄武/g);
  var SPIRIT_START={甲:0,乙:0,丙:1,丁:1,戊:2,己:3,庚:4,辛:4,壬:5,癸:5};
  var CLASH={子:'午',午:'子',丑:'未',未:'丑',寅:'申',申:'寅',卯:'酉',酉:'卯',辰:'戌',戌:'辰',巳:'亥',亥:'巳'};
  var COMBINE={子:'丑',丑:'子',寅:'亥',亥:'寅',卯:'戌',戌:'卯',辰:'酉',酉:'辰',巳:'申',申:'巳',午:'未',未:'午'};
  var ADVANCE={亥:'子',寅:'卯',巳:'午',申:'酉',丑:'辰',辰:'未',未:'戌',戌:'丑'};
  var RETREAT={};
  Object.keys(ADVANCE).forEach(function(key){RETREAT[ADVANCE[key]]=key});
  var VOID_BY_XUN=['戌亥','申酉','午未','辰巳','寅卯','子丑'];
  var GZ60=[];
  for(var gi=0;gi<60;gi++)GZ60.push(STEMS[gi%10]+BRANCHES[gi%12]);

  var HEXAGRAM_LIST=[
    ['乾','乾','乾','乾为天'],['坤','坤','坤','坤为地'],['震','坎','屯','水雷屯'],['坎','艮','蒙','山水蒙'],
    ['乾','坎','需','水天需'],['坎','乾','讼','天水讼'],['坎','坤','师','地水师'],['坤','坎','比','水地比'],
    ['乾','巽','小畜','风天小畜'],['兑','乾','履','天泽履'],['乾','坤','泰','地天泰'],['坤','乾','否','天地否'],
    ['离','乾','同人','天火同人'],['乾','离','大有','火天大有'],['艮','坤','谦','地山谦'],['坤','震','豫','雷地豫'],
    ['震','兑','随','泽雷随'],['巽','艮','蛊','山风蛊'],['兑','坤','临','地泽临'],['坤','巽','观','风地观'],
    ['震','离','噬嗑','火雷噬嗑'],['离','艮','贲','山火贲'],['坤','艮','剥','山地剥'],['震','坤','复','地雷复'],
    ['震','乾','无妄','天雷无妄'],['乾','艮','大畜','山天大畜'],['震','艮','颐','山雷颐'],['巽','兑','大过','泽风大过'],
    ['坎','坎','坎','坎为水'],['离','离','离','离为火'],['艮','兑','咸','泽山咸'],['巽','震','恒','雷风恒'],
    ['艮','乾','遁','天山遁'],['乾','震','大壮','雷天大壮'],['坤','离','晋','火地晋'],['离','坤','明夷','地火明夷'],
    ['离','巽','家人','风火家人'],['兑','离','睽','火泽睽'],['艮','坎','蹇','水山蹇'],['坎','震','解','雷水解'],
    ['兑','艮','损','山泽损'],['震','巽','益','风雷益'],['乾','兑','夬','泽天夬'],['巽','乾','姤','天风姤'],
    ['坤','兑','萃','泽地萃'],['巽','坤','升','地风升'],['坎','兑','困','泽水困'],['巽','坎','井','水风井'],
    ['离','兑','革','泽火革'],['巽','离','鼎','火风鼎'],['震','震','震','震为雷'],['艮','艮','艮','艮为山'],
    ['艮','巽','渐','风山渐'],['兑','震','归妹','雷泽归妹'],['离','震','丰','雷火丰'],['艮','离','旅','火山旅'],
    ['巽','巽','巽','巽为风'],['兑','兑','兑','兑为泽'],['坎','巽','涣','风水涣'],['兑','坎','节','水泽节'],
    ['兑','巽','中孚','风泽中孚'],['艮','震','小过','雷山小过'],['离','坎','既济','水火既济'],['坎','离','未济','火水未济']
  ];
  var HEXAGRAMS={};
  HEXAGRAM_LIST.forEach(function(item,index){
    var code=TRIGRAM_CODE[item[0]]+TRIGRAM_CODE[item[1]];
    HEXAGRAMS[code]={number:index+1,name:item[2],fullName:item[3],symbol:String.fromCodePoint(0x4dc0+index),lower:item[0],upper:item[1]};
  });

  var PALACE_ELEMENTS={乾:'金',兑:'金',离:'火',震:'木',巽:'木',坎:'水',艮:'土',坤:'土'};
  var PALACE_TYPES=['本宫','一世','二世','三世','四世','五世','游魂','归魂'];
  var PALACE_FLIPS=[[],[0],[0,1],[0,1,2],[0,1,2,3],[0,1,2,3,4],[0,1,2,4],[4]];
  var PALACES={};
  Object.keys(TRIGRAM_CODE).forEach(function(name){
    var pure=(TRIGRAM_CODE[name]+TRIGRAM_CODE[name]).split('');
    PALACE_FLIPS.forEach(function(flips,index){
      var bits=pure.slice();
      flips.forEach(function(line){bits[line]=bits[line]==='1'?'0':'1'});
      var shi=index===0?6:(index<=5?index:(index===6?4:3));
      PALACES[bits.join('')]={name:name,element:PALACE_ELEMENTS[name],order:index,type:PALACE_TYPES[index],shi:shi,ying:shi<=3?shi+3:shi-3};
    });
  });

  var SIX_CLASH={乾:1,坤:1,坎:1,离:1,震:1,巽:1,艮:1,兑:1,无妄:1,大壮:1};
  var SIX_COMBINE={泰:1,否:1,豫:1,复:1,旅:1,节:1,困:1,贲:1};
  var RELATIVES=['兄弟','父母','子孙','妻财','官鬼'];
  var LINE_LABELS=['初爻','二爻','三爻','四爻','五爻','上爻'];

  function validateLines(lines){
    if(!Array.isArray(lines)||lines.length!==6)throw new Error('六爻必须按初爻到上爻提供六个结果');
    return lines.map(function(value,index){
      var number=Number(value);
      if([6,7,8,9].indexOf(number)<0)throw new Error(LINE_LABELS[index]+'只能是6、7、8、9');
      return number;
    });
  }

  function drawLine(randomValue){
    var value=randomValue;
    if(value==null){
      if(!root.crypto||typeof root.crypto.getRandomValues!=='function')throw new Error('当前浏览器不支持安全随机数，请改用手动录入');
      var buffer=new Uint32Array(1);
      root.crypto.getRandomValues(buffer);
      value=buffer[0];
    }
    if(!Number.isFinite(Number(value))||Number(value)<0)throw new Error('随机值必须是非负数字');
    var slot=Math.floor(Number(value))%8;
    return slot===0?6:(slot<=3?7:(slot<=6?8:9));
  }

  function relationFor(palaceElement,lineElement){
    if(palaceElement===lineElement)return '兄弟';
    if(GENERATES[palaceElement]===lineElement)return '子孙';
    if(GENERATES[lineElement]===palaceElement)return '父母';
    if(CONTROLS[palaceElement]===lineElement)return '妻财';
    if(CONTROLS[lineElement]===palaceElement)return '官鬼';
    return '';
  }

  function branchRelation(fromBranch,toBranch,fromLabel){
    var out=[],fromElement=ELEMENTS[fromBranch],toElement=ELEMENTS[toBranch];
    if(fromBranch===toBranch)out.push('临'+fromLabel);
    if(CLASH[fromBranch]===toBranch)out.push(fromLabel==='月'?'月破':fromLabel+'冲');
    if(COMBINE[fromBranch]===toBranch)out.push(fromLabel+'合');
    if(GENERATES[fromElement]===toElement)out.push(fromLabel+'生');
    else if(GENERATES[toElement]===fromElement)out.push('爻生'+fromLabel);
    if(CONTROLS[fromElement]===toElement)out.push(fromLabel+'克');
    else if(CONTROLS[toElement]===fromElement)out.push('爻克'+fromLabel);
    return out;
  }

  function changeRelations(originalBranch,changedBranch){
    var out=[],originalElement=ELEMENTS[originalBranch],changedElement=ELEMENTS[changedBranch];
    if(changedBranch===originalBranch)out.push('伏吟');
    if(CLASH[changedBranch]===originalBranch)out.push('回头冲');
    if(COMBINE[changedBranch]===originalBranch)out.push('化合');
    if(GENERATES[changedElement]===originalElement)out.push('回头生');
    if(CONTROLS[changedElement]===originalElement)out.push('回头克');
    if(ADVANCE[originalBranch]===changedBranch)out.push('化进');
    if(RETREAT[originalBranch]===changedBranch)out.push('化退');
    return out;
  }

  function lineNaJia(hexagram,lineIndex){
    var side=lineIndex<3?'inner':'outer';
    var trigram=lineIndex<3?hexagram.lower:hexagram.upper;
    var localIndex=lineIndex%3;
    var data=NAJIA[trigram][side];
    var branch=data.branches[localIndex];
    return {stem:data.stem,branch:branch,element:ELEMENTS[branch]};
  }

  function spiritsFor(dayStem){
    var start=SPIRIT_START[dayStem];
    if(start==null)throw new Error('无效日干：'+dayStem);
    return SIX_SPIRITS.map(function(_,index){return SIX_SPIRITS[(start+index)%6]});
  }

  function voidBranches(dayGZ){
    var index=GZ60.indexOf(dayGZ);
    if(index<0)throw new Error('无效日柱：'+dayGZ);
    return VOID_BY_XUN[Math.floor(index/10)].split('');
  }

  function hiddenSpirits(primary,palace,visibleRelatives){
    var pure=HEXAGRAMS[TRIGRAM_CODE[palace.name]+TRIGRAM_CODE[palace.name]];
    return LINE_LABELS.map(function(_,index){
      var najia=lineNaJia(pure,index);
      var relative=relationFor(palace.element,najia.element);
      return visibleRelatives.indexOf(relative)<0?{relative:relative,stem:najia.stem,branch:najia.branch,element:najia.element}:null;
    });
  }

  function chantTags(primary,changed,lines){
    if(!lines.some(function(line){return line.moving}))return [];
    var same=[],opposite=[];
    for(var i=0;i<6;i++){
      var a=lineNaJia(primary,i).branch,b=lineNaJia(changed,i).branch;
      same.push(a===b);
      opposite.push(CLASH[a]===b);
    }
    var tags=[];
    if(same.every(Boolean))tags.push('伏吟');
    else{
      if(same.slice(0,3).every(Boolean))tags.push('内卦伏吟');
      if(same.slice(3).every(Boolean))tags.push('外卦伏吟');
    }
    if(opposite.every(Boolean))tags.push('反吟');
    else{
      if(opposite.slice(0,3).every(Boolean))tags.push('内卦反吟');
      if(opposite.slice(3).every(Boolean))tags.push('外卦反吟');
    }
    return tags;
  }

  function buildPlate(input){
    input=input||{};
    var values=validateLines(input.lines);
    var monthGZ=String(input.monthGZ||'');
    var dayGZ=String(input.dayGZ||'');
    if(GZ60.indexOf(monthGZ)<0)throw new Error('无效月柱：'+monthGZ);
    if(GZ60.indexOf(dayGZ)<0)throw new Error('无效日柱：'+dayGZ);
    var primaryCode=values.map(function(value){return value===7||value===9?'1':'0'}).join('');
    var changedCode=values.map(function(value){
      var yang=value===7||value===9;
      return (value===6||value===9?!yang:yang)?'1':'0';
    }).join('');
    var primary=HEXAGRAMS[primaryCode],changed=HEXAGRAMS[changedCode],palace=PALACES[primaryCode];
    if(!primary||!changed||!palace)throw new Error('无法识别卦象');
    var spirits=spiritsFor(dayGZ[0]),voids=voidBranches(dayGZ);
    var monthBranch=monthGZ[1],dayBranch=dayGZ[1];
    var visibleRelatives=LINE_LABELS.map(function(_,index){
      return relationFor(palace.element,lineNaJia(primary,index).element);
    });
    var hidden=hiddenSpirits(primary,palace,visibleRelatives);
    var lines=values.map(function(value,index){
      var original=lineNaJia(primary,index),changedNajia=lineNaJia(changed,index),moving=value===6||value===9;
      var facts=[];
      if(voids.indexOf(original.branch)>=0)facts.push('旬空');
      facts=facts.concat(branchRelation(monthBranch,original.branch,'月'));
      facts=facts.concat(branchRelation(dayBranch,original.branch,'日'));
      var changes=moving?changeRelations(original.branch,changedNajia.branch):[];
      return {
        position:index+1,label:LINE_LABELS[index],value:value,
        yinYang:value===7||value===9?'阳':'阴',moving:moving,
        spirit:spirits[index],shi:palace.shi===index+1,ying:palace.ying===index+1,
        original:{stem:original.stem,branch:original.branch,element:original.element,relative:visibleRelatives[index]},
        changed:{stem:changedNajia.stem,branch:changedNajia.branch,element:changedNajia.element,relative:relationFor(palace.element,changedNajia.element)},
        hidden:hidden[index],facts:Array.from(new Set(facts)),changeFacts:changes
      };
    });
    var tags=[];
    if(SIX_CLASH[primary.name])tags.push('六冲');
    if(SIX_COMBINE[primary.name])tags.push('六合');
    if(palace.type==='游魂'||palace.type==='归魂')tags.push(palace.type);
    tags=tags.concat(chantTags(primary,changed,lines));
    return {
      version:VERSION,input:{lines:values.slice(),monthGZ:monthGZ,dayGZ:dayGZ},
      calendar:{monthGZ:monthGZ,monthBuild:monthBranch,dayGZ:dayGZ,dayBranch:dayBranch,voidBranches:voids},
      primary:Object.assign({code:primaryCode},primary),changed:Object.assign({code:changedCode},changed),
      palace:palace,tags:Array.from(new Set(tags)),lines:lines
    };
  }

  var api={
    version:VERSION,drawLine:drawLine,validateLines:validateLines,buildPlate:buildPlate,
    constants:{trigrams:TRIGRAMS,hexagrams:HEXAGRAMS,palaces:PALACES,relatives:RELATIVES,lineLabels:LINE_LABELS,gz60:GZ60}
  };
  root.LiuyaoEngine=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
