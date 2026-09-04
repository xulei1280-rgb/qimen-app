(function(root){
  'use strict';

  var VERSION='LIUYAO-NAJIA-2026.08.12-v1';
  var RELATION_VERSION='LIUYAO-RELATION-2026.09.05-v2';
  var ASSESSMENT_VERSION='LIUYAO-ASSESSMENT-2026.09.05-v2';
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

  function relationNodeName(node){
    if(node.kind==='month'||node.kind==='day'||node.kind==='change')return node.label;
    var role=node.roles.indexOf('飞神')>=0?'飞神':(node.roles.indexOf('世爻')>=0?'世爻':(node.roles.indexOf('应爻')>=0?'应爻':'动爻'));
    return role+'（'+node.label+'）';
  }

  function relationsToFocus(node,focus){
    var out=[],sourceName=relationNodeName(node),calendarKind=node.kind==='month'?'月':(node.kind==='day'?'日':'');
    function add(type,term,label,fromId,toId,directional,evidence){
      out.push({type:type,term:term,label:label,fromId:fromId,toId:toId,directional:directional,evidence:evidence});
    }
    if(node.branch===focus.branch){
      var sameTerm=calendarKind?'临'+calendarKind:'同支';
      add('same',sameTerm,calendarKind?'用神临'+sourceName:'用神与'+sourceName+'同支',node.id,focus.id,false,'用神'+focus.branch+'与'+sourceName+node.branch+'地支相同');
    }
    if(CLASH[node.branch]===focus.branch){
      var clashTerm=node.kind==='month'?'月破':(node.kind==='day'?'日冲':'冲');
      add('clash',clashTerm,node.kind==='month'?'月建冲用神（月破）':(node.kind==='day'?'日辰冲用神（日冲）':sourceName+'与用神相冲'),node.id,focus.id,false,sourceName+node.branch+'与用神'+focus.branch+'地支相冲');
    }
    if(COMBINE[node.branch]===focus.branch){
      var combineTerm=calendarKind?calendarKind+'合':'合';
      add('combine',combineTerm,sourceName+'与用神六合',node.id,focus.id,false,sourceName+node.branch+'与用神'+focus.branch+'地支六合');
    }
    if(GENERATES[node.element]===focus.element){
      add('generate',calendarKind?calendarKind+'生':'生',sourceName+'生用神',node.id,focus.id,true,sourceName+node.branch+node.element+'生用神'+focus.branch+focus.element);
    }else if(GENERATES[focus.element]===node.element){
      add('generate',calendarKind?'爻生'+calendarKind:'生',calendarKind?'用神泄于'+sourceName:'用神生'+sourceName,focus.id,node.id,true,'用神'+focus.branch+focus.element+'生'+sourceName+node.branch+node.element+(calendarKind?'，表示用神向日月耗泄，不表示用神反制日月':''));
    }
    if(CONTROLS[node.element]===focus.element){
      add('control',calendarKind?calendarKind+'克':'克',sourceName+'克用神',node.id,focus.id,true,sourceName+node.branch+node.element+'克用神'+focus.branch+focus.element);
    }else if(CONTROLS[focus.element]===node.element){
      add('control',calendarKind?'爻克'+calendarKind:'克',calendarKind?'用神对'+sourceName+'呈耗力关系':'用神克'+sourceName,focus.id,node.id,true,'用神'+focus.branch+focus.element+'克'+sourceName+node.branch+node.element+(calendarKind?'，只记为用神耗力，不表示用神反制日月':''));
    }
    if(!out.length)add('none','无直接生克冲合',sourceName+'与用神无直接生克冲合',node.id,focus.id,false,sourceName+node.branch+node.element+'与用神'+focus.branch+focus.element+'之间没有生、克、冲、合或同支关系');
    return out;
  }

  function changeEdge(node,focus,originalBranch){
    var mappings={
      '伏吟':['same','用神变爻与原爻同支（伏吟）',false,node.id,focus.id],
      '回头冲':['clash','用神变爻回头冲原爻',false,node.id,focus.id],
      '化合':['combine','用神变爻与原爻化合',false,node.id,focus.id],
      '回头生':['generate','用神变爻回头生原爻',true,node.id,focus.id],
      '回头克':['control','用神变爻回头克原爻',true,node.id,focus.id],
      '化进':['advance','用神原爻化进',true,focus.id,node.id],
      '化退':['retreat','用神原爻化退',true,focus.id,node.id]
    };
    var relations=changeRelations(originalBranch,node.branch).map(function(term){
      var item=mappings[term];
      return {type:item[0],term:term,label:item[1],fromId:item[3],toId:item[4],directional:item[2],evidence:'用神原爻'+originalBranch+focus.element+'变为'+node.branch+node.element+'，引擎标记为“'+term+'”'};
    });
    if(!relations.length)relations.push({type:'none',term:'无直接生克冲合',label:'用神动变无已标记关系',fromId:focus.id,toId:node.id,directional:false,evidence:'用神原爻'+originalBranch+focus.element+'变为'+node.branch+node.element+'，未形成回头生克、冲合、伏吟或化进化退'});
    return {nodeId:node.id,relations:relations};
  }

  function buildUseGodRelations(input){
    input=input||{};
    var plate=input.plate,useGod=input.useGod||{};
    if(!plate||!Array.isArray(plate.lines)||plate.lines.length!==6||!plate.calendar)throw new Error('需要完整的六爻盘面快照');
    var position=Number(useGod.position),line=plate.lines.find(function(item){return item.position===position});
    if(!line)throw new Error('用神爻位必须是初爻到上爻');
    var hidden=!!useGod.hidden;
    if(hidden&&!line.hidden)throw new Error(line.label+'没有可用伏神');
    var item=hidden?line.hidden:line.original;
    if(!item||!ELEMENTS[item.branch])throw new Error('用神缺少有效纳甲地支');
    var focusRoles=hidden?['伏神']:[];
    if(!hidden){if(line.shi)focusRoles.push('世爻');if(line.ying)focusRoles.push('应爻');if(line.moving)focusRoles.push('动爻')}
    var focus={id:'use-god',kind:'useGod',label:'用神',position:position,lineLabel:line.label,hidden:hidden,roles:focusRoles,stem:item.stem,branch:item.branch,element:item.element,relative:item.relative,moving:!hidden&&line.moving,statuses:[]};
    if((plate.calendar.voidBranches||[]).indexOf(item.branch)>=0)focus.statuses.push({type:'void',term:'旬空',label:'用神旬空',evidence:'用神地支'+item.branch+'落在'+plate.calendar.dayGZ+'日所属旬空'+(plate.calendar.voidBranches||[]).join('')+'之中'});

    var monthBranch=plate.calendar.monthBuild||(plate.calendar.monthGZ||'')[1],dayBranch=plate.calendar.dayBranch||(plate.calendar.dayGZ||'')[1];
    if(!ELEMENTS[monthBranch]||!ELEMENTS[dayBranch])throw new Error('盘面快照缺少有效月建或日辰');
    var nodes=[
      {id:'month',kind:'month',label:'月建',roles:[],stem:(plate.calendar.monthGZ||'')[0]||'',branch:monthBranch,element:ELEMENTS[monthBranch],stemBranch:plate.calendar.monthGZ||monthBranch,moving:false},
      {id:'day',kind:'day',label:'日辰',roles:[],stem:(plate.calendar.dayGZ||'')[0]||'',branch:dayBranch,element:ELEMENTS[dayBranch],stemBranch:plate.calendar.dayGZ||dayBranch,moving:false}
    ];
    var lineNodes={};
    function addLineNode(sourceLine,role){
      if(!hidden&&sourceLine.position===position)return;
      var id='line-'+sourceLine.position,node=lineNodes[id];
      if(!node){
        node=lineNodes[id]={id:id,kind:'line',label:sourceLine.label,position:sourceLine.position,roles:[],stem:sourceLine.original.stem,branch:sourceLine.original.branch,element:sourceLine.original.element,relative:sourceLine.original.relative,stemBranch:sourceLine.original.stem+sourceLine.original.branch,moving:sourceLine.moving};
      }
      if(node.roles.indexOf(role)<0)node.roles.push(role);
    }
    plate.lines.forEach(function(sourceLine){if(sourceLine.shi)addLineNode(sourceLine,'世爻');if(sourceLine.ying)addLineNode(sourceLine,'应爻');if(sourceLine.moving)addLineNode(sourceLine,'动爻')});
    if(hidden)addLineNode(line,'飞神');

    if(!hidden&&line.moving){
      nodes.push({id:'use-god-change',kind:'change',label:'用神变爻',position:position,roles:['变爻'],stem:line.changed.stem,branch:line.changed.branch,element:line.changed.element,relative:line.changed.relative,stemBranch:line.changed.stem+line.changed.branch,moving:false});
    }
    var roleRank={'世爻':0,'应爻':1,'飞神':2,'动爻':3};
    Object.keys(lineNodes).map(function(id){return lineNodes[id]}).sort(function(a,b){
      var ar=Math.min.apply(null,a.roles.map(function(role){return roleRank[role]})),br=Math.min.apply(null,b.roles.map(function(role){return roleRank[role]}));
      return ar-br||b.position-a.position;
    }).forEach(function(node){nodes.push(node)});

    var edges=nodes.map(function(node){return node.kind==='change'?changeEdge(node,focus,item.branch):{nodeId:node.id,relations:relationsToFocus(node,focus)}});
    return {version:RELATION_VERSION,focus:focus,nodes:nodes,edges:edges};
  }

  function seasonalState(monthElement,element){
    if(monthElement===element)return '旺';
    if(GENERATES[monthElement]===element)return '相';
    if(GENERATES[element]===monthElement)return '休';
    if(CONTROLS[element]===monthElement)return '囚';
    return '死';
  }

  function actorRole(focusElement,element){
    if(GENERATES[element]===focusElement)return '原神';
    if(CONTROLS[element]===focusElement)return '忌神';
    var sourceElement=Object.keys(GENERATES).find(function(key){return GENERATES[key]===focusElement});
    var adverseElement=Object.keys(CONTROLS).find(function(key){return CONTROLS[key]===focusElement});
    if(CONTROLS[element]===sourceElement&&GENERATES[element]===adverseElement)return '仇神';
    if(element===focusElement)return '同类';
    if(GENERATES[focusElement]===element)return '泄神';
    return '旁神';
  }

  function buildUseGodAssessment(input){
    input=input||{};
    var plate=input.plate,relations=buildUseGodRelations(input),focus=relations.focus;
    var line=plate.lines.find(function(item){return item.position===focus.position});
    var monthBranch=plate.calendar.monthBuild||(plate.calendar.monthGZ||'')[1],dayBranch=plate.calendar.dayBranch||(plate.calendar.dayGZ||'')[1];
    var monthElement=ELEMENTS[monthBranch],dayElement=ELEMENTS[dayBranch],season=seasonalState(monthElement,focus.element),support=[],constraint=[],condition=[],timing=[],chains=[];
    var sourceElement=Object.keys(GENERATES).find(function(key){return GENERATES[key]===focus.element});
    var adverseElement=Object.keys(CONTROLS).find(function(key){return CONTROLS[key]===focus.element});
    var enemyElement=Object.keys(GENERATES).find(function(key){return GENERATES[key]===adverseElement});
    function uniquePush(list,text){if(text&&list.indexOf(text)<0)list.push(text)}
    function branchFacts(branch){
      var facts=[];
      if((plate.calendar.voidBranches||[]).indexOf(branch)>=0)facts.push('旬空');
      return facts.concat(branchRelation(monthBranch,branch,'月'),branchRelation(dayBranch,branch,'日')).filter(function(value,index,list){return list.indexOf(value)===index});
    }
    function recordFocusFact(term){
      var label='用神'+focus.lineLabel+' '+focus.stem+focus.branch+focus.element;
      if(term==='临月'||term==='临日'||term==='月生'||term==='日生')uniquePush(support,label+'得'+term);
      else if(term==='月克'||term==='日克'||term==='月破')uniquePush(constraint,label+'逢'+term);
      else if(term==='爻生月'||term==='爻生日')uniquePush(condition,label+(term==='爻生月'?'生月建':'生日辰')+'，只记为耗泄，不表示用神反制日月');
      else if(term==='爻克月'||term==='爻克日')uniquePush(condition,label+(term==='爻克月'?'克月建':'克日辰')+'，只记为耗力，不表示用神反制日月');
      else if(term==='日冲'){
        var focusStrong=season==='旺'||season==='相'||dayElement===focus.element||GENERATES[dayElement]===focus.element;
        if(!focus.hidden&&!line.moving&&focusStrong&&focusFacts.indexOf('月破')<0)uniquePush(condition,label+'得月日扶持而受日冲，按暗动条件看待');
        else if(!focus.hidden&&!line.moving)uniquePush(constraint,label+'休囚受日冲，按日破条件看待');
        else uniquePush(condition,label+'受日冲，仍须结合发动、旺衰与空破判断');
      }
      else if(term==='旬空')uniquePush(timing,label+'旬空，当前条件未实，待出空或冲空');
      else uniquePush(condition,label+'逢'+term);
    }
    var focusFacts=branchFacts(focus.branch);
    focusFacts.forEach(recordFocusFact);
    if(season==='旺'||season==='相')uniquePush(support,'用神'+focus.element+'在'+monthBranch+'月为'+season);
    else if(season==='囚'||season==='死')uniquePush(constraint,'用神'+focus.element+'在'+monthBranch+'月为'+season);
    else uniquePush(condition,'用神'+focus.element+'在'+monthBranch+'月为休');
    if(focusFacts.indexOf('月破')>=0)uniquePush(timing,'用神月破，先看出月、填实或逢合的条件');
    if(focusFacts.indexOf('日冲')>=0)uniquePush(timing,'用神受日冲，须结合旺衰分辨暗动或日破');

    var actors=[];
    function addActor(sourceLine,item,hidden){
      if(!hidden&&!focus.hidden&&sourceLine.position===focus.position)return;
      var facts=branchFacts(item.branch),actorSeason=seasonalState(monthElement,item.element),dayClash=CLASH[dayBranch]===item.branch,monthBroken=CLASH[monthBranch]===item.branch;
      var actorStrong=actorSeason==='旺'||actorSeason==='相'||dayElement===item.element||GENERATES[dayElement]===item.element;
      var actionState=hidden?'伏藏':(sourceLine.moving?'明动':(dayClash&&actorStrong&&!monthBroken?'暗动':(dayClash?'日破':'静爻')));
      var active=actionState==='明动'||actionState==='暗动',role=actorRole(focus.element,item.element),name=sourceLine.label+(hidden?'伏神':'')+' '+item.stem+item.branch+item.element;
      var changeFacts=hidden?[]:(sourceLine.moving?sourceLine.changeFacts.slice():[]),strong=actorStrong||changeFacts.indexOf('回头生')>=0||changeFacts.indexOf('化进')>=0;
      var adverseChange=changeFacts.some(function(term){return term==='回头克'||term==='回头冲'||term==='化退'}),delayed=facts.indexOf('旬空')>=0||facts.indexOf('月破')>=0,capacity='inactive',capacityReason='';
      if(hidden){capacity='conditional';capacityReason='伏藏不按明动爻直接作用'}
      else if(actionState==='日破'){capacity='powerless';capacityReason='日破，当前不进入直接作用层'}
      else if(!active){capacity='inactive';capacityReason='普通静爻只作结构背景'}
      else if(delayed){capacity='delayed';capacityReason='虽发动，但空破使作用待条件落实'}
      else if(adverseChange&&!strong){capacity='powerless';capacityReason='休囚且回头受制或化退，当前无力直接作用'}
      else if(strong&&!adverseChange){capacity='effective';capacityReason='发动且得月日或动变扶持'}
      else {capacity='conditional';capacityReason=adverseChange?'发动但回头受制或化退，作用需降级看待':'虽发动但未得日月或动变扶持'}
      var actor={id:(hidden?'hidden-':'line-')+sourceLine.position,position:sourceLine.position,lineLabel:sourceLine.label,hidden:hidden,relative:item.relative,stem:item.stem,branch:item.branch,element:item.element,role:role,seasonalState:actorSeason,actionState:actionState,active:active,capacity:capacity,capacityReason:capacityReason,facts:facts,changeFacts:changeFacts};
      actors.push(actor);
      if(capacity==='effective'&&role==='原神')uniquePush(support,name+actionState+'，原神生用神');
      if(capacity==='effective'&&role==='忌神')uniquePush(constraint,name+actionState+'，忌神克用神');
      if(capacity==='effective'&&role==='仇神')uniquePush(constraint,name+actionState+'，仇神克原神并生忌神');
      if(capacity==='effective'&&role==='同类')uniquePush(support,name+actionState+'，与用神同类相扶');
      if(capacity==='effective'&&role==='泄神')uniquePush(condition,name+actionState+'，为用神所生，存在耗泄条件');
      if(active&&capacity!== 'effective')uniquePush(condition,name+actionState+'，'+capacityReason+(role==='忌神'?'，忌神当前无力直接克用神':''));
      if(actionState==='日破')uniquePush(condition,name+'受日冲且未达旺相，按日破条件看待');
      if(facts.indexOf('旬空')>=0&&active)uniquePush(timing,name+'发动而旬空，作用可能待出空或冲空落实');
      if(facts.indexOf('月破')>=0&&active)uniquePush(timing,name+'发动而月破，作用受当月条件限制');
      if(hidden)uniquePush(condition,name+'伏藏，须结合飞神与提拔条件，不按明动爻直接作用');
      actor.changeFacts.forEach(function(term){
        if(term==='回头生'||term==='化进')uniquePush(role==='原神'?support:condition,name+term);
        else if(term==='回头克'||term==='回头冲'||term==='化退')uniquePush(role==='原神'?constraint:condition,name+term);
        else uniquePush(condition,name+term);
      });
    }
    plate.lines.forEach(function(sourceLine){
      addActor(sourceLine,sourceLine.original,false);
      if(sourceLine.hidden)addActor(sourceLine,sourceLine.hidden,true);
    });
    actors.sort(function(a,b){return a.position-b.position||(a.hidden?1:-1)});

    if(!focus.hidden&&line.moving){
      line.changeFacts.forEach(function(term){
        var text='用神'+focus.lineLabel+'发动'+term;
        if(term==='回头生'||term==='化进')uniquePush(support,text);
        else if(term==='回头克'||term==='回头冲'||term==='化退')uniquePush(constraint,text);
        else uniquePush(condition,text);
      });
      var changedFacts=branchFacts(line.changed.branch);
      if(changedFacts.indexOf('旬空')>=0){uniquePush(constraint,'用神变爻'+line.changed.stem+line.changed.branch+'化空');uniquePush(timing,'用神化空，待变爻出空或冲空再观察落实')}
      if(changedFacts.indexOf('月破')>=0){uniquePush(constraint,'用神变爻'+line.changed.stem+line.changed.branch+'化破');uniquePush(timing,'用神化破，待出月、填实或逢合再观察')}
    }

    var activeSources=actors.filter(function(actor){return actor.capacity==='effective'&&actor.role==='原神'}),activeAdverse=actors.filter(function(actor){return actor.capacity==='effective'&&actor.role==='忌神'}),activeEnemies=actors.filter(function(actor){return actor.capacity==='effective'&&actor.role==='仇神'});
    if(activeSources.length&&activeAdverse.length){
      activeAdverse.forEach(function(actor){
        var marker=actor.lineLabel+' '+actor.stem+actor.branch+actor.element;
        for(var ci=constraint.length-1;ci>=0;ci--)if(constraint[ci].indexOf(marker)>=0&&constraint[ci].indexOf('忌神克用神')>=0)constraint.splice(ci,1);
      });
      var chain='原神与忌神同动，构成忌神贪生原神、原神转生用神的连续相生条件';
      chains.push({type:'greed-generates-forgets-control',label:'贪生忘克条件',evidence:chain});uniquePush(support,chain);
    }
    if(activeEnemies.length){
      var enemyChain='仇神发动，形成克原神并生忌神的连续制约条件';
      chains.push({type:'enemy-supports-adverse',label:'仇神助忌',evidence:enemyChain});uniquePush(constraint,enemyChain);
    }
    if(focus.hidden){
      var flying=actors.find(function(actor){return !actor.hidden&&actor.position===focus.position});
      if(flying){
        if(GENERATES[flying.element]===focus.element)uniquePush(support,'飞神'+flying.stem+flying.branch+'生伏神用神');
        else if(CONTROLS[flying.element]===focus.element)uniquePush(constraint,'飞神'+flying.stem+flying.branch+'克伏神用神');
        else uniquePush(condition,'伏神用神与飞神'+flying.stem+flying.branch+'无直接生克，仍待提拔条件');
      }
    }

    var tendency=support.length&&constraint.length?'mixed':(support.length?'supported':(constraint.length?'constrained':'undetermined'));
    var tendencyLabel={mixed:'生扶与制约并见',supported:'生扶条件较清楚',constrained:'受制条件较明显',undetermined:'关键作用尚未充分发动'}[tendency];
    if(!timing.length)timing.push('本内核未形成可唯一定位的应期条件，不强行给出具体日期');
    var evidence=[],serial={useGod:0,support:0,constraint:0,condition:0,timing:0,priority:0},prefix={useGod:'U',support:'S',constraint:'C',condition:'N',timing:'T',priority:'P'};
    function addEvidence(kind,text){serial[kind]++;evidence.push({id:prefix[kind]+String(serial[kind]).padStart(2,'0'),kind:kind,text:text})}
    addEvidence('useGod','固定用神：'+focus.lineLabel+' '+(focus.hidden?'伏神 ':'')+focus.relative+' '+focus.stem+focus.branch+'（'+focus.element+'），月令状态为'+season);
    support.forEach(function(text){addEvidence('support',text)});
    constraint.forEach(function(text){addEvidence('constraint',text)});
    condition.forEach(function(text){addEvidence('condition',text)});
    timing.forEach(function(text){addEvidence('timing',text)});
    var priority=[
      '月建与日辰作为外部时令，可作用于动爻、静爻、变爻与伏神；卦爻不能反制日月。',
      '明动爻及符合旺相条件的日冲静爻可进入直接作用层；普通静爻只作结构背景。',
      '变爻只回头作用于本位动爻，不直接越位生克其他爻。',
      '旬空、月破不简单删除发动作用，改列为待出空、冲空、出月或填实的条件。'
    ];
    priority.forEach(function(text){addEvidence('priority',text)});
    return {version:ASSESSMENT_VERSION,ruleBasis:'增删卜易主线：月建、日辰、动变、用原忌仇与暗动；只输出传统事实倾向，不输出吉凶分数',focus:focus,seasonal:{monthBranch:monthBranch,monthElement:monthElement,state:season},roles:{sourceElement:sourceElement,adverseElement:adverseElement,enemyElement:enemyElement},actors:actors,chains:chains,arbitration:{tendency:tendency,label:tendencyLabel,support:support,constraint:constraint,conditions:condition},timingConditions:timing,priorityRules:priority,evidence:evidence};
  }

  function stableStringify(value){
    if(value===null||typeof value!=='object')return JSON.stringify(value);
    if(Array.isArray(value))return '['+value.map(stableStringify).join(',')+']';
    return '{'+Object.keys(value).sort().map(function(key){return JSON.stringify(key)+':'+stableStringify(value[key])}).join(',')+'}';
  }

  function validatePlateSnapshot(plate){
    try{
      if(!plate||!plate.input||!Array.isArray(plate.input.lines))return false;
      var rebuilt=buildPlate({lines:plate.input.lines,monthGZ:plate.input.monthGZ,dayGZ:plate.input.dayGZ});
      return stableStringify(rebuilt)===stableStringify(plate);
    }catch(error){return false}
  }

  function validateAiInterpretation(input){
    input=input||{};
    var text=String(input.answer||''),kernel=input.kernel||{},plate=input.plate,errors=[];
    if(!kernel.fixedUseGod||!kernel.assessment||!Array.isArray(kernel.evidenceCatalog)||!plate||!Array.isArray(plate.lines))throw new Error('AI 校验需要固定用神、规则内核、证据目录和盘面');
    var evidenceById={},validIds=new Set();kernel.evidenceCatalog.forEach(function(item){validIds.add(item.id);evidenceById[item.id]=String(item.text||'')});
    var references=Array.from(new Set(Array.from(text.matchAll(/\[([A-Z]\d{2})\]/g)).map(function(match){return match[1]})));
    var refusal='一个卦只能问同一件事，请重新起卦',normalized=text.trim().replace(/\s+/g,'').replace(/[!！。]+$/,'');
    if(normalized===refusal)return {valid:true,errors:[],references:[],topicRefusal:true};
    if(text.indexOf(refusal)>=0)errors.push('换题拒答必须是唯一内容，不得夹带盘面断语');
    var useGod=kernel.fixedUseGod;
    if(text.indexOf(useGod.lineLabel)<0||text.indexOf(useGod.relative)<0||text.indexOf(useGod.stemBranch)<0)errors.push('没有按冻结用神写明爻位、六亲和干支');
    if(text.indexOf(kernel.assessment.arbitration.label)<0)errors.push('没有采用内核的力量倾向');
    if(references.indexOf('U01')<0||references.length<3)errors.push('有效内核证据引用不足');
    var invalid=references.filter(function(id){return !validIds.has(id)});
    if(invalid.length)errors.push('引用了不存在的证据 '+invalid.join('、'));
    var factPattern=/用神|世爻|应爻|月建|日辰|本卦|变卦|初爻|二爻|三爻|四爻|五爻|上爻|兄弟|父母|子孙|妻财|官鬼|旬空|月破|日冲|回头生|回头克|回头冲|化进|化退|伏吟|六合|六冲|明动|暗动|静爻|动爻|日破|旺|相|休|囚|死/;
    var lineNames=['初爻','二爻','三爻','四爻','五爻','上爻'],relatives=['兄弟','父母','子孙','妻财','官鬼'],terms=['旬空','月破','日冲','回头生','回头克','回头冲','化进','化退','伏吟','六合','六冲','明动','暗动','静爻','动爻','日破'];
    text.split(/\n+/).map(function(part){return part.trim()}).filter(Boolean).forEach(function(paragraph){
      var plain=paragraph.replace(/^#{1,6}\s*/,'').replace(/^[-*•]\s*/,'');
      if(/^[^：:]{1,16}[：:]?$/.test(plain)&&!factPattern.test(plain))return;
      if(!factPattern.test(plain))return;
      var ids=Array.from(plain.matchAll(/\[([A-Z]\d{2})\]/g)).map(function(match){return match[1]}),known=ids.filter(function(id){return validIds.has(id)});
      if(!known.length){errors.push('含盘面事实的段落未附可核对证据编号');return}
      var cited=known.map(function(id){return evidenceById[id]}).join('；');
      lineNames.forEach(function(term){if(plain.indexOf(term)>=0&&cited.indexOf(term)<0)errors.push('爻位“'+term+'”与本段引用证据不匹配')});
      relatives.forEach(function(term){if(plain.indexOf(term)>=0&&cited.indexOf(term)<0)errors.push('六亲“'+term+'”与本段引用证据不匹配')});
      Array.from(plain.matchAll(/[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]/g)).map(function(match){return match[0]}).forEach(function(gz){if(cited.indexOf(gz)<0)errors.push('干支“'+gz+'”与本段引用证据不匹配')});
      terms.forEach(function(term){if(plain.indexOf(term)>=0&&cited.indexOf(term)<0)errors.push('关系“'+term+'”与本段引用证据不匹配')});
    });
    if(/[七八九十]爻/.test(text))errors.push('出现了盘面不存在的爻位');
    plate.lines.filter(function(line){return !line.moving}).forEach(function(line){
      var claim=new RegExp(line.label+'[^。；\\n]{0,12}(发动|为动爻)');
      var negative=new RegExp(line.label+'[^。；\\n]{0,12}(未发动|没有发动|不发动|并非动爻|为静爻)');
      if(claim.test(text)&&!negative.test(text))errors.push('把静爻'+line.label+'写成了动爻');
    });
    return {valid:errors.length===0,errors:Array.from(new Set(errors)),references:references};
  }

  var api={
    version:VERSION,relationVersion:RELATION_VERSION,assessmentVersion:ASSESSMENT_VERSION,drawLine:drawLine,validateLines:validateLines,buildPlate:buildPlate,validatePlateSnapshot:validatePlateSnapshot,buildUseGodRelations:buildUseGodRelations,buildUseGodAssessment:buildUseGodAssessment,validateAiInterpretation:validateAiInterpretation,
    constants:{trigrams:TRIGRAMS,hexagrams:HEXAGRAMS,palaces:PALACES,relatives:RELATIVES,lineLabels:LINE_LABELS,gz60:GZ60}
  };
  root.LiuyaoEngine=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
