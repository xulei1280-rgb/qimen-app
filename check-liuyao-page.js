const assert=require('assert');
const fs=require('fs');
{const readFileSync=fs.readFileSync;fs.readFileSync=function(){const out=readFileSync.apply(fs,arguments);return typeof out==='string'?out.replace(/\r\n/g,'\n'):out}} // 兼容 CRLF 检出

const engine=require('./liuyao-engine.js');
const deepseekClient=require('./deepseek-client.js');

const monthGZ='丙寅';
const dayGZ='甲子';
const codeLines=code=>code.split('').map(bit=>bit==='1'?7:8);
const plateForCode=code=>engine.buildPlate({lines:codeLines(code),monthGZ,dayGZ});

assert.throws(()=>engine.validateLines([7,7]),/六爻必须/);
assert.throws(()=>engine.validateLines([7,7,7,7,7,5]),/上爻只能/);
assert.deepStrictEqual(Array.from({length:8},(_,i)=>engine.drawLine(i)),[6,7,7,7,8,8,8,9]);
assert.strictEqual(typeof engine.buildUseGodRelations,'function');
assert.match(engine.relationVersion,/LIUYAO-RELATION/);
assert.strictEqual(typeof engine.buildUseGodAssessment,'function');
assert.match(engine.assessmentVersion,/LIUYAO-ASSESSMENT/);
assert.strictEqual(typeof engine.validateAiInterpretation,'function');
assert.strictEqual(typeof engine.validatePlateSnapshot,'function');
assert.deepStrictEqual(engine.constants.lifeStages,{金:{长生:'巳',帝旺:'酉',墓:'丑',绝:'寅'},木:{长生:'亥',帝旺:'卯',墓:'未',绝:'申'},水:{长生:'申',帝旺:'子',墓:'辰',绝:'巳'},火:{长生:'寅',帝旺:'午',墓:'戌',绝:'亥'},土:{长生:'申',帝旺:'子',墓:'辰',绝:'巳'}});

const pureFixtures={
  '111111':['甲子','甲寅','甲辰','壬午','壬申','壬戌'],
  '000000':['乙未','乙巳','乙卯','癸丑','癸亥','癸酉'],
  '100100':['庚子','庚寅','庚辰','庚午','庚申','庚戌'],
  '011011':['辛丑','辛亥','辛酉','辛未','辛巳','辛卯'],
  '010010':['戊寅','戊辰','戊午','戊申','戊戌','戊子'],
  '101101':['己卯','己丑','己亥','己酉','己未','己巳'],
  '001001':['丙辰','丙午','丙申','丙戌','丙子','丙寅'],
  '110110':['丁巳','丁卯','丁丑','丁亥','丁酉','丁未']
};
Object.entries(pureFixtures).forEach(([code,expected])=>{
  const plate=plateForCode(code);
  assert.deepStrictEqual(plate.lines.map(line=>line.original.stem+line.original.branch),expected,plate.primary.fullName+' 纳甲');
  assert.strictEqual(plate.palace.type,'本宫');
  assert.strictEqual(plate.palace.shi,6);
  assert.strictEqual(plate.palace.ying,3);
});

assert.strictEqual(Object.keys(engine.constants.hexagrams).length,64);
assert.strictEqual(Object.keys(engine.constants.palaces).length,64);
Object.keys(engine.constants.hexagrams).forEach(code=>{
  const plate=plateForCode(code);
  assert.strictEqual(plate.primary.code,code);
  assert.ok(plate.palace.name);
  assert.ok(plate.lines.some(line=>line.shi));
  assert.ok(plate.lines.some(line=>line.ying));
});

const xunVoid={甲子:'戌亥',甲戌:'申酉',甲申:'午未',甲午:'辰巳',甲辰:'寅卯',甲寅:'子丑'};
Object.entries(xunVoid).forEach(([day,voids])=>{
  assert.strictEqual(engine.buildPlate({lines:[7,7,7,7,7,7],monthGZ,dayGZ:day}).calendar.voidBranches.join(''),voids);
});

const spiritStart={甲:'青龙',乙:'青龙',丙:'朱雀',丁:'朱雀',戊:'勾陈',己:'螣蛇',庚:'白虎',辛:'白虎',壬:'玄武',癸:'玄武'};
Object.entries(spiritStart).forEach(([stem,spirit])=>{
  const validDay=engine.constants.gz60.find(item=>item[0]===stem);
  assert.strictEqual(engine.buildPlate({lines:[7,7,7,7,7,7],monthGZ,dayGZ:validDay}).lines[0].spirit,spirit);
});

['乾','坤','坎','离','震','巽','艮','兑','无妄','大壮'].forEach(name=>{
  const code=Object.keys(engine.constants.hexagrams).find(key=>engine.constants.hexagrams[key].name===name);
  assert.ok(plateForCode(code).tags.includes('六冲'),name+' 应为六冲');
});
['泰','否','豫','复','旅','节','困','贲'].forEach(name=>{
  const code=Object.keys(engine.constants.hexagrams).find(key=>engine.constants.hexagrams[key].name===name);
  assert.ok(plateForCode(code).tags.includes('六合'),name+' 应为六合');
});

let hiddenCount=0,hiddenGraphChecked=false;
const relationTypes=new Set(),relationTerms=new Set();
const relationDirections={towardFocus:false,fromFocus:false,symmetric:false,multiple:false};
const assessmentCoverage={season:new Set(),role:new Set(),action:new Set(),tendency:new Set(),chain:new Set()};
for(let value=0;value<4096;value++){
  let n=value;
  const lines=[];
  for(let i=0;i<6;i++){lines.push([6,7,8,9][n%4]);n=Math.floor(n/4)}
  const plate=engine.buildPlate({lines,monthGZ,dayGZ});
  assert.strictEqual(plate.lines.length,6);
  assert.ok(plate.primary&&plate.changed&&plate.palace);
  assert.deepStrictEqual(plate.input.lines,lines);
  plate.lines.forEach((line,index)=>{
    assert.strictEqual(line.position,index+1);
    assert.ok(['兄弟','父母','子孙','妻财','官鬼'].includes(line.original.relative));
    if(line.hidden)hiddenCount++;
    const before=JSON.stringify(plate);
    const relation=engine.buildUseGodRelations({plate,useGod:{position:line.position,hidden:false}});
    assert.strictEqual(relation.focus.position,line.position);
    assert.strictEqual(relation.nodes.length,relation.edges.length);
    assert.strictEqual(new Set(relation.nodes.map(node=>node.id)).size,relation.nodes.length);
    relation.edges.forEach(edge=>{
      if(edge.relations.length>1)relationDirections.multiple=true;
      edge.relations.forEach(item=>{
        relationTypes.add(item.type);relationTerms.add(item.term);
        assert.match(item.label,/用神/,'关系文字必须明确指出用神方向');
        if(item.directional){
          if(item.toId===relation.focus.id)relationDirections.towardFocus=true;
          if(item.fromId===relation.focus.id)relationDirections.fromFocus=true;
        }else if(['clash','combine','same'].includes(item.type))relationDirections.symmetric=true;
      });
    });
    relation.focus.statuses.forEach(item=>relationTerms.add(item.term));
    const assessment=engine.buildUseGodAssessment({plate,useGod:{position:line.position,hidden:false}});
    assert.strictEqual(assessment.focus.position,line.position);
    assert.ok(assessment.evidence.some(item=>item.id==='U01'));
    assert.strictEqual(new Set(assessment.evidence.map(item=>item.id)).size,assessment.evidence.length);
    assert.ok(['mixed','supported','constrained','undetermined'].includes(assessment.arbitration.tendency));
    assert.ok(assessment.roles.sourceElement&&assessment.roles.adverseElement&&assessment.roles.enemyElement);
    assessmentCoverage.season.add(assessment.seasonal.state);
    assessmentCoverage.tendency.add(assessment.arbitration.tendency);
    assessment.actors.forEach(actor=>{assessmentCoverage.role.add(actor.role);assessmentCoverage.action.add(actor.actionState)});
    assessment.chains.forEach(chain=>assessmentCoverage.chain.add(chain.type));
    if(assessment.chains.some(chain=>chain.type==='greed-generates-forgets-control'))assessment.actors.filter(actor=>actor.role==='忌神'&&actor.capacity==='effective'&&!actor.deferred&&['明动','暗动'].includes(actor.actionState)).forEach(actor=>assert.ok(!assessment.arbitration.constraint.some(text=>text.includes(actor.lineLabel+' '+actor.stem+actor.branch+actor.element)&&text.includes('忌神克用神')),'原忌同为有效动爻时不应再重复计入该忌神直克'));
    assert.strictEqual(JSON.stringify(plate),before,'关系分析不得修改盘面快照');
    if(line.hidden&&!hiddenGraphChecked){
      const hiddenRelation=engine.buildUseGodRelations({plate,useGod:{position:line.position,hidden:true}});
      assert.ok(hiddenRelation.focus.roles.includes('伏神'));
      assert.ok(hiddenRelation.nodes.some(node=>node.id==='line-'+line.position&&node.roles.includes('飞神')));
      assert.ok(!hiddenRelation.nodes.some(node=>node.kind==='change'),'伏神不应虚构变爻');
      const hiddenAssessment=engine.buildUseGodAssessment({plate,useGod:{position:line.position,hidden:true}});
      assert.strictEqual(hiddenAssessment.focus.hidden,true);
      assert.ok(hiddenAssessment.actors.some(actor=>!actor.hidden&&actor.position===line.position),'伏神判断必须保留飞神');
      hiddenGraphChecked=true;
    }
  });
}
assert.ok(hiddenCount>0,'应覆盖伏神');
assert.ok(hiddenGraphChecked,'应覆盖伏神与飞神关系');
assert.ok(relationDirections.towardFocus,'应覆盖外部指向用神的生克关系');
assert.ok(relationDirections.fromFocus,'应覆盖用神指向外部的生克关系');
assert.ok(relationDirections.symmetric,'应覆盖冲合或同支的双向关系');
assert.ok(relationDirections.multiple,'应覆盖同一节点的多重关系');
['generate','control','clash','combine','same','advance','retreat','none'].forEach(type=>assert.ok(relationTypes.has(type),'应覆盖关系 '+type));
['月破','日冲','旬空','回头生','回头克','回头冲','化合','伏吟','化进','化退'].forEach(term=>assert.ok(relationTerms.has(term),'应覆盖关系标签 '+term));
assert.throws(()=>engine.buildUseGodRelations({plate:plateForCode('111111'),useGod:{position:0}}),/用神爻位/);
assert.deepStrictEqual([...assessmentCoverage.season].sort(),['休','囚','旺','死','相'].sort());
['原神','忌神','仇神','同类','泄神'].forEach(role=>assert.ok(assessmentCoverage.role.has(role),'应覆盖六爻角色 '+role));
['明动','暗动','静爻','伏藏'].forEach(action=>assert.ok(assessmentCoverage.action.has(action),'应覆盖作用状态 '+action));
['mixed','supported','constrained'].forEach(tendency=>assert.ok(assessmentCoverage.tendency.has(tendency),'应覆盖内核倾向 '+tendency));
['greed-generates-forgets-control','enemy-supports-adverse'].forEach(chain=>assert.ok(assessmentCoverage.chain.has(chain),'应覆盖作用链 '+chain));
const dayBrokenPlate=engine.buildPlate({lines:[7,7,7,7,7,7],monthGZ:'癸酉',dayGZ:'甲子'});
assert.ok(dayBrokenPlate.lines.some(line=>engine.buildUseGodAssessment({plate:dayBrokenPlate,useGod:{position:line.position}}).actors.some(actor=>actor.actionState==='日破')),'休囚静爻受日冲应标为日破');
assert.throws(()=>engine.buildUseGodAssessment({plate:plateForCode('111111'),useGod:{position:0}}),/用神爻位/);
const retreatAdversePlate=engine.buildPlate({lines:[7,7,9,8,8,8],monthGZ:'甲子',dayGZ:'甲子'});
const retreatAdverseAssessment=engine.buildUseGodAssessment({plate:retreatAdversePlate,useGod:{position:1}});
const retreatAdverseActor=retreatAdverseAssessment.actors.find(actor=>actor.position===3&&!actor.hidden);
assert.strictEqual(retreatAdversePlate.primary.fullName,'地天泰');
assert.strictEqual(retreatAdverseActor.role,'忌神');
assert.strictEqual(retreatAdverseActor.seasonalState,'囚');
assert.ok(retreatAdverseActor.changeFacts.includes('化退'));
assert.strictEqual(retreatAdverseActor.capacity,'powerless');
assert.ok(!retreatAdverseAssessment.arbitration.constraint.some(text=>text.includes('三爻')&&text.includes('忌神克用神')),'休囚化退的忌神不得直接计入制约');
assert.ok(retreatAdverseAssessment.arbitration.conditions.some(text=>text.includes('忌神当前无力直接克用神')));
const staticPowerPlate=engine.buildPlate({lines:[7,7,6,6,6,6],monthGZ:'丙寅',dayGZ:'甲子'});
const staticPowerAssessment=engine.buildUseGodAssessment({plate:staticPowerPlate,useGod:{position:3}});
const staticSource=staticPowerAssessment.actors.find(actor=>actor.position===1&&!actor.hidden);
assert.strictEqual(staticSource.role,'原神');
assert.strictEqual(staticSource.actionState,'旺相静爻');
assert.strictEqual(staticSource.capacity,'effective');
assert.ok(staticPowerAssessment.arbitration.support.some(text=>text.includes('初爻')&&text.includes('原神生用神')),'旺相静爻应能生扶休囚用神');
const movingPowerPlate=engine.buildPlate({lines:[9,7,6,6,6,6],monthGZ:'丙寅',dayGZ:'甲子'});
const movingPowerAssessment=engine.buildUseGodAssessment({plate:movingPowerPlate,useGod:{position:5}});
const weakMovingActor=movingPowerAssessment.actors.find(actor=>actor.position===3&&!actor.hidden);
assert.strictEqual(weakMovingActor.seasonalState,'死');
assert.strictEqual(weakMovingActor.actionState,'明动');
assert.strictEqual(weakMovingActor.capacity,'effective','休囚动爻未再受伤时仍保留作用');
const deferredPowerAssessment=engine.buildUseGodAssessment({plate:engine.buildPlate({lines:[6,6,6,6,6,6],monthGZ:'丙寅',dayGZ:'甲子'}),useGod:{position:1}});
const deferredActor=deferredPowerAssessment.actors.find(actor=>actor.position===5&&!actor.hidden);
assert.strictEqual(deferredActor.deferred,true);
assert.strictEqual(deferredActor.capacity,'effective','发动遇空破不得直接删除作用事实');
assert.ok(deferredPowerAssessment.timingConditions.some(text=>text.includes('待出空或冲空')));
assert.ok(deferredPowerAssessment.arbitration.support.some(text=>text.includes('用神初爻发动化帝旺')),'用神化帝旺应进入生扶证据');
const lifeEndAssessment=engine.buildUseGodAssessment({plate:engine.buildPlate({lines:[8,6,6,6,6,6],monthGZ:'丙寅',dayGZ:'甲子'}),useGod:{position:2}});
assert.ok(lifeEndAssessment.arbitration.constraint.some(text=>text.includes('用神二爻发动化绝')),'用神化绝应进入制约证据');
const controlledBirthAssessment=engine.buildUseGodAssessment({plate:engine.buildPlate({lines:[7,7,7,7,7,7],monthGZ:'乙酉',dayGZ:'丁巳'}),useGod:{position:5}});
assert.ok(controlledBirthAssessment.arbitration.conditions.some(text=>text.includes('临日辰长生')&&text.includes('论克不论生')),'长生与日克并见时不得单列生扶');
assert.ok(!controlledBirthAssessment.arbitration.support.some(text=>text.includes('临日辰长生')));
const movingGraveAssessment=engine.buildUseGodAssessment({plate:engine.buildPlate({lines:[9,6,6,6,6,6],monthGZ:'丙寅',dayGZ:'甲子'}),useGod:{position:4}});
assert.ok(movingGraveAssessment.arbitration.constraint.some(text=>text.includes('三爻 庚辰土为用神动墓')&&text.includes('用神本身休囚')),'有力动墓作用于休囚用神时应进入制约证据');
const qualifiedMovingGraveAssessment=engine.buildUseGodAssessment({plate:engine.buildPlate({lines:[6,6,6,6,6,6],monthGZ:'丙寅',dayGZ:'甲子'}),useGod:{position:3}});
assert.ok(qualifiedMovingGraveAssessment.arbitration.conditions.some(text=>text.includes('初爻 乙未土为用神动墓')&&text.includes('用神本身有气')),'用神有气时动墓只列待核条件');
assert.ok(!qualifiedMovingGraveAssessment.arbitration.constraint.some(text=>text.includes('动墓')),'动墓不得脱离用神强弱直接定性');
assert.ok(controlledBirthAssessment.priorityRules.some(text=>text.includes('三刑')&&text.includes('不用它单独改写力量倾向')),'三刑仅披露流派边界，不得自动定吉凶');
const brokenSourcePlate=engine.buildPlate({lines:[8,8,9,6,6,6],monthGZ:'丙寅',dayGZ:'甲子'});
const brokenSource=engine.buildUseGodAssessment({plate:brokenSourcePlate,useGod:{position:5}});
assert.strictEqual(brokenSource.actors.find(actor=>actor.position===3&&!actor.hidden).capacity,'powerless','囚金逢寅月破且无动变生扶，不得当有效原神');
assert.ok(!brokenSource.arbitration.support.some(text=>text.includes('三爻 丙申金')));
// 增删卜易第十章：巳月乙未日，大过之鼎，四爻亥水为用。
// 来源：https://zh.wikisource.org/zh-hans/增刪卜易/10 （仅核对传统规则，不将古籍结果当作前瞻命中率）
const rootPlate=engine.buildPlate({lines:[8,7,7,7,9,6],monthGZ:'己巳',dayGZ:'乙未'});
const rootAssessment=engine.buildUseGodAssessment({plate:rootPlate,useGod:{position:4}});
assert.strictEqual(rootPlate.primary.fullName,'泽风大过');
assert.strictEqual(rootPlate.changed.fullName,'火风鼎');
assert.strictEqual(rootAssessment.arbitration.decisiveRule,'weak-static-month-break-day-control');
assert.strictEqual(rootAssessment.arbitration.tendency,'constrained');
assert.strictEqual(rootAssessment.arbitration.support.length,0,'有根条件未满足，连续相生不得直接抵消月破日克');
assert.ok(rootAssessment.arbitration.conditions.some(text=>text.includes('连续相生')),'原有生扶事实保留为条件，不删除');
for(const calendar of [{monthGZ:'己巳',dayGZ:'甲子'},{monthGZ:'丙寅',dayGZ:'乙未'}]){
  const neighbor=engine.buildUseGodAssessment({plate:engine.buildPlate({lines:[8,7,7,7,9,6],...calendar}),useGod:{position:4}});
  assert.strictEqual(neighbor.arbitration.decisiveRule,null,'仅月破或仅日克不得泛化为无根');
}
// 跨十二月建和六十日辰验证空破、伏神及规则优先级的组合边界。
const calendarMonths=new Set(),calendarVoids=new Set();let calendarHiddenCount=0;
for(const month of engine.constants.gz60.slice(0,12))for(const day of engine.constants.gz60){
  calendarMonths.add(month[1]);
  for(const values of [[7,7,7,7,7,7],[6,6,6,6,6,6],[8,8,9,6,6,6],[8,7,7,7,9,6]]){
    const plate=engine.buildPlate({lines:values,monthGZ:month,dayGZ:day}),snapshot=JSON.stringify(plate);
    calendarVoids.add(plate.calendar.voidBranches.join(''));
    for(const row of plate.lines)for(const hidden of row.hidden?[false,true]:[false]){
      const assessment=engine.buildUseGodAssessment({plate,useGod:{position:row.position,hidden}});
      if(hidden){calendarHiddenCount++;assert.ok(!assessment.arbitration.support.concat(assessment.arbitration.constraint).some(text=>text.startsWith('用神'+row.label+'发动')),'伏神不得生成自身变爻断语')}
      for(const actor of assessment.actors.filter(actor=>actor.capacity==='powerless'))assert.ok(!assessment.arbitration.support.concat(assessment.arbitration.constraint).some(text=>text.includes(actor.lineLabel+' '+actor.stem+actor.branch+actor.element)&&/原神生用神|忌神克用神/.test(text)),'无力爻不得进入直接生克证据');
      for(const actor of assessment.actors.filter(actor=>actor.actionState==='暗动'))assert.strictEqual(actor.capacity,'effective','旺相受日冲的暗动爻不得被普通静爻空破规则删除');
      if(assessment.arbitration.decisiveRule)assert.strictEqual(assessment.arbitration.tendency,'constrained');
    }
    assert.strictEqual(JSON.stringify(plate),snapshot);
  }
}
assert.strictEqual(calendarMonths.size,12);assert.strictEqual(calendarVoids.size,6);assert.ok(calendarHiddenCount>0);
const calendarDirectionPlate=plateForCode('111111');
const calendarDirection=engine.buildUseGodRelations({plate:calendarDirectionPlate,useGod:{position:1}}).edges.find(edge=>edge.nodeId==='month').relations[0];
assert.strictEqual(calendarDirection.label,'用神泄于月建');
assert.match(calendarDirection.evidence,/不表示用神反制日月/);
assert.ok(!calendarDirection.label.includes('用神生月建'));
const intactSnapshot=plateForCode('111111');
assert.strictEqual(engine.validatePlateSnapshot(intactSnapshot),true);
const tamperedSnapshot=JSON.parse(JSON.stringify(intactSnapshot));tamperedSnapshot.lines[0].original.relative='官鬼';
assert.strictEqual(engine.validatePlateSnapshot(tamperedSnapshot),false,'被改写的历史盘面快照必须被拒绝');
const validatorPlate=plateForCode('111111');
const validatorAssessment=engine.buildUseGodAssessment({plate:validatorPlate,useGod:{position:1}});
const validatorLineEvidence=validatorPlate.lines.map((line,index)=>({id:'L'+String(index+1).padStart(2,'0'),text:line.label+'：'+line.original.relative+line.original.stem+line.original.branch+'（'+line.original.element+'），'+(line.moving?'明动、为动爻':'未发动、为静爻')}));
const validatorKernel={fixedUseGod:{lineLabel:validatorAssessment.focus.lineLabel,relative:validatorAssessment.focus.relative,stemBranch:validatorAssessment.focus.stem+validatorAssessment.focus.branch},assessment:validatorAssessment,evidenceCatalog:validatorAssessment.evidence.concat([{id:'B01',text:'本卦乾为天，变卦乾为天，六爻皆静'},{id:'B02',text:'世爻为上爻父母壬戌；应爻为三爻父母甲辰'}]).concat(validatorLineEvidence)};
const validAnswer=validatorAssessment.arbitration.label+'。\n固定用神为'+validatorKernel.fixedUseGod.lineLabel+validatorKernel.fixedUseGod.relative+validatorKernel.fixedUseGod.stemBranch+'。[U01]\n本卦乾为天。[B01]\n世爻为上爻父母壬戌。[B02]';
assert.strictEqual(engine.validateAiInterpretation({answer:validAnswer,kernel:validatorKernel,plate:validatorPlate}).valid,true);
assert.strictEqual(engine.validateAiInterpretation({answer:validAnswer+'\n二爻发动。[L02]',kernel:validatorKernel,plate:validatorPlate}).valid,false,'静爻不得被 AI 写成动爻');
assert.strictEqual(engine.validateAiInterpretation({answer:validAnswer+' [Z99]',kernel:validatorKernel,plate:validatorPlate}).valid,false,'AI 不得引用不存在的证据');
assert.strictEqual(engine.validateAiInterpretation({answer:'一个卦只能问同一件事，请重新起卦',kernel:validatorKernel,plate:validatorPlate}).valid,true,'换题拒答允许不附盘面证据');
assert.strictEqual(engine.validateAiInterpretation({answer:'一个卦只能问同一件事，请重新起卦。七爻发动且月建改为申。',kernel:validatorKernel,plate:validatorPlate}).valid,false,'拒答句不得被用来绕过盘面校验');
assert.strictEqual(engine.validateAiInterpretation({answer:validAnswer+'\n二爻官鬼甲寅。[L02]',kernel:validatorKernel,plate:validatorPlate}).valid,false,'六亲与所引证据不符必须拒绝');
assert.strictEqual(engine.validateAiInterpretation({answer:validAnswer+'\n二爻妻财乙卯。[L02]',kernel:validatorKernel,plate:validatorPlate}).valid,false,'干支与所引证据不符必须拒绝');
assert.strictEqual(engine.validateAiInterpretation({answer:validAnswer+'\n二爻妻财甲寅月破。[L02]',kernel:validatorKernel,plate:validatorPlate}).valid,false,'关系状态与所引证据不符必须拒绝');
assert.strictEqual(engine.validateAiInterpretation({answer:validAnswer+'\n二爻妻财甲寅为静爻。',kernel:validatorKernel,plate:validatorPlate}).valid,false,'含盘面事实的段落必须自带证据编号');
for(const wrong of ['世爻为三爻父母甲辰，应爻为上爻父母壬戌。[B02]','三爻持世。[B02]','世爻父母甲辰。[B02]','上爻父母甲辰，三爻父母壬戌。[B02]','二爻未发动。[L02]\n二爻发动。[L02]','这件事明天一定成功。','款项下周会到账。'])assert.strictEqual(engine.validateAiInterpretation({answer:validAnswer+'\n'+wrong,kernel:validatorKernel,plate:validatorPlate}).valid,false,'应拒绝错误对应或无条件预言：'+wrong);
assert.strictEqual(engine.validateAiInterpretation({answer:validAnswer+'\n不能保证一定成功，现实结果仍待验证。',kernel:validatorKernel,plate:validatorPlate}).valid,true,'不应把否定保证的措辞当作承诺');
assert.strictEqual(engine.validateAiInterpretation({answer:validAnswer+'\n不保证成功。',kernel:validatorKernel,plate:validatorPlate}).valid,true,'直接否定承诺应通过');
assert.strictEqual(engine.validateAiInterpretation({answer:validAnswer+'\n世爻为上爻父母壬戌，应爻为三爻父母甲辰。[B02]',kernel:validatorKernel,plate:validatorPlate}).valid,true,'正确世应对应必须通过');
const directionKernel={...validatorKernel,evidenceCatalog:validatorKernel.evidenceCatalog.concat([{id:'R01',text:'世爻克用神：世爻戌土克用神子水'}])};
assert.strictEqual(engine.validateAiInterpretation({answer:validAnswer+'\n用神克世爻。[R01]',kernel:directionKernel,plate:validatorPlate}).valid,false,'引用同一个关系编号仍不得反转生克方向');
assert.strictEqual(engine.validateAiInterpretation({answer:validAnswer+'\n世爻克用神。[R01]',kernel:directionKernel,plate:validatorPlate}).valid,true,'正确生克方向应通过');

const html=fs.readFileSync('./liuyao.html','utf8');
const inferSource=(html.match(/function inferUseGodTarget\(record\)\{[\s\S]*?\n\}(?=\nfunction ruleSuggestedUseGod)/)||[])[0];
assert.ok(inferSource,'应能独立提取用神问题路由');
const useGodLib=require('./liuyao-usegod.js');
const inferUseGodTarget=new Function('LiuyaoUseGod',inferSource+';return inferUseGodTarget')(useGodLib);
assert.deepStrictEqual(inferUseGodTarget({question:'我的病能不能康复',questionType:'career',asker:{mode:'self',gender:'男'}}).value,'shi','本人问自身健康必须先取世爻，不受误选问事类型干扰');
assert.deepStrictEqual(inferUseGodTarget({question:'这个药的疗效如何',questionType:'other',asker:{mode:'self',gender:'男'}}).value,'子孙','问药物疗效时取子孙爻');
assert.strictEqual(inferUseGodTarget({question:'他的病能不能康复',questionType:'other',asker:{mode:'other',gender:'男'}}),null,'代录他人健康缺少关系时不得自动猜用神');
for(const [question,value] of [['我父亲的病能不能康复','父母'],['我女儿的病情会好吗','子孙'],['朋友欠我的钱能要回来吗','妻财'],['合同货款何时能收回','妻财']])assert.strictEqual(inferUseGodTarget({question,questionType:'other',asker:{mode:'self',gender:'男'}}).value,value,question);
for(const question of ['他的病能不能康复','朋友的父亲能康复吗','孩子考试能考上吗','我父亲手术后能康复吗，医生说要观察','我身体不好，妈妈很担心'])assert.strictEqual(inferUseGodTarget({question,questionType:'other',asker:{mode:'self',gender:'男'}}),null,'主体或目标有歧义时应人工确认：'+question);
const suggestionSource=html.match(/function ruleSuggestedUseGod\(\)\{[\s\S]*?\n\}(?=\nfunction suggestedUseGod)/)[0];
const resolveSource=html.match(/function resolveUseGodTarget\(target,meta\)\{[\s\S]*?\n\}(?=\nfunction inferUseGodTarget)/)[0];
const suggestForRecord=new Function('currentRecord','currentPlate','inferUseGodTarget','LiuyaoEngine',resolveSource+';'+suggestionSource+';return ruleSuggestedUseGod()');
const resolveForPlate=new Function('currentPlate','LiuyaoEngine',resolveSource+';return resolveUseGodTarget');
const debtRecord={question:'朋友欠我的钱能要回来吗',questionType:'other',asker:{mode:'self',gender:'男'}};
const debtChoice=suggestForRecord(debtRecord,validatorPlate,inferUseGodTarget,engine);
assert.strictEqual(debtChoice.relative,'妻财');assert.strictEqual(debtChoice.position,2);
const kernelSource=html.match(/function buildAiKernelContext\(selectedOverride\)\{[\s\S]*?\n\}(?=\nfunction aiPlateContext)/)[0];
const buildPageKernel=new Function('currentRecord','currentPlate','activeUseGod','LiuyaoEngine',kernelSource+';return buildAiKernelContext()');
assert.throws(()=>buildPageKernel(debtRecord,validatorPlate,()=>null,engine),/无法唯一定位用神/,'歧义候选必须阻止自动发起解读');
assert.strictEqual(buildPageKernel(debtRecord,validatorPlate,()=>debtChoice,engine).fixedUseGod.position,2,'修正后的用神必须进入真实 AI 上下文');
const historySource=html.match(/function renderAiHistory\(\)\{[\s\S]*?\n\}(?=\nfunction useGodSnapshotKey)/)[0];
const renderOldHistory=new Function('currentRecord','activeUseGod','useGodSnapshotKey','LiuyaoEngine','esc','nl','buildAiKernelContext',historySource+';return renderAiHistory()');
const oldHistoryHtml=renderOldHistory({aiHistory:[{question:'原问题',answer:'原始回答',kernelVersion:'LIUYAO-ASSESSMENT-2026.09.05-v3',useGodSnapshot:debtChoice}]},()=>debtChoice,()=> 'same-use-god',engine,String,String,()=>{throw new Error('旧版不应按新版重新背书')});
assert.match(oldHistoryHtml,/旧版规则解读/);assert.match(oldHistoryHtml,/原始回答/);
assert.match(html,/id="blankPlate"/);
assert.match(html,/id="resultArea" hidden/);
assert.match(html,/逐爻摇卦/);
assert.match(html,/一键成卦/);
assert.match(html,/手动录入/);
assert.match(html,/id="questionEditor"/);
assert.match(html,/id="questionSummary" class="question-summary" hidden/);
assert.match(html,/function renderQuestionSummary\(\)/);
assert.match(html,/function startNewCast\(\)/);
assert.match(html,/历史快照 · 不重新计算/);
assert.match(html,/id="reviewActionStatus"/);
assert.match(html,/setStatus\('aiStatus','AI 请求失败：'/);
assert.match(html,/\.grid\.has-plate/);
assert.match(html,/\.cast-methods button:nth-child\(3\)\{grid-column:1\/-1\}/);
assert.match(html,/\.time-row input\{min-width:0\}/);
assert.match(html,/id="plateRows"/);
assert.match(html,/data-focus="moving"/);
assert.match(html,/function setPlateFocus\(mode\)/);
assert.match(html,/function saveUseGod\(\)/);
assert.match(html,/function suggestedUseGod\(\)/);
assert.match(html,/function inferUseGodTarget\(record\)/);
assert.match(html,/function ruleSuggestedUseGod\(\)/);
assert.match(html,/function suggestedUseGod\(\)\{return ruleSuggestedUseGod\(\)\}/);
assert.doesNotMatch(html,/function aiSuggestedUseGod\(\)/);
assert.match(html,/function applyUseGodSuggestion\(\)/);
assert.match(html,/function updateUseGodSelection\(\)/);
assert.match(html,/手动指定用神所在爻/);
assert.match(html,/手工选择参考表/);
assert.match(html,/旺衰用于后续判断，不用于反推用神身份/);
assert.match(html,/男问妻财，女问官鬼/);
assert.match(html,/明确写出固定用神的爻位、六亲和干支/);
assert.match(html,/function renderUseGodRelations\(\)/);
assert.match(html,/LiuyaoEngine\.buildUseGodRelations/);
assert.match(html,/LiuyaoEngine\.buildUseGodAssessment/);
assert.match(html,/function buildAiKernelContext\(selectedOverride\)/);
assert.match(html,/function validateLiuyaoAiAnswer\(answer,kernel\)/);
assert.match(html,/LiuyaoEngine\.validateAiInterpretation/);
assert.match(html,/fixedUseGod/);
assert.match(html,/evidenceCatalog/);
assert.match(html,/初稿未通过盘面校验，正在纠正/);
assert.match(html,/kernelVersion:kernel\.assessment\.version/);
assert.match(html,/一个卦只能问同一件事，请重新起卦/);
assert.match(html,/function showUseGodRelation\(nodeId,index\)/);
assert.match(html,/id="relationMap"/);
assert.match(html,/建议用神 · 未确认/);
assert.match(html,/五、用神关系/);
assert.match(html,/历史初判（只读）/);
assert.match(html,/有历史初判/);
assert.match(html,/\.relation-orbit/);
assert.match(html,/class="relation-orbit-canvas"/);
assert.match(html,/以用神为中心，看清谁生谁克/);
assert.match(html,/箭头指向被生／被克者/);
assert.match(html,/marker-end=/);
assert.match(html,/marker-start=/);
assert.match(html,/function orbitPositions\(nodes\)/);
assert.match(html,/function centerRelationOrbit\(\)/);
assert.match(html,/function activateUseGodRelation\(event,nodeId,index\)/);
assert.match(html,/root\.dataset\.selectedNode===nodeId/);
assert.match(html,/delete root\.dataset\.selectedNode;setUseGodRelationHighlight\(''\);return/);
assert.match(html,/role="button" tabindex="0"/);
assert.match(html,/class="orbit-label-hit"/);
assert.match(html,/\.orbit-hit\{[^}]*stroke-width:52/);
assert.match(html,/左右滑动查看完整关系盘/);
assert.doesNotMatch(html,/class="relation-flow /);
assert.doesNotMatch(html,/class="relation-party /);
assert.match(html,/renderVerdict\(\)\+renderUseGodWhy\(\)\+/);
assert.doesNotMatch(html,/function freezeJudgment\(\)/);
assert.doesNotMatch(html,/function appendJudgment\(\)/);
assert.doesNotMatch(html,/id="judgmentTendency"/);
assert.doesNotMatch(html,/用神与初判留痕/);
assert.match(html,/function showTerm\(term,position,kind\)/);
assert.match(html,/id="termDialog"/);
assert.match(html,/function copySharePlate\(\)/);
assert.match(html,/function printCurrentPlate\(\)/);
assert.match(html,/@media print/);
assert.match(html,/id="historyTopic"/);
assert.match(html,/id="historyDateFrom"/);
assert.match(html,/id="historyPrimary"/);
assert.match(html,/id="historyMoving"/);
assert.match(html,/function resetHistoryFilters\(\)/);
assert.match(html,/id="questionTemplates"/);
assert.match(html,/function applyQuestionTemplate\(index\)/);
assert.match(html,/function questionScopeIssue\(question\)/);
assert.match(html,/id="questionScopeConfirm"/);
assert.match(html,/请先拆分问题，或确认仍然只问其中一件具体事情/);
assert.match(html,/建议按这五步读卦/);
assert.match(html,/function renderReadingGuide\(\)/);
assert.match(html,/function guideReading\(step\)/);
assert.match(html,/AI_QUICK_QUESTIONS/);
assert.match(html,/id="aiQuickQuestions"/);
assert.match(html,/function fillAiQuestion\(index\)/);
assert.match(html,/id="largeTextToggle"/);
assert.match(html,/function toggleLargeText\(\)/);
assert.match(html,/@media\(max-width:900px\) and \(orientation:portrait\)/);
assert.match(html,/@media\(max-width:900px\) and \(orientation:landscape\)/);
assert.doesNotMatch(html,/document\.body\.className=mode/);
assert.match(html,/liuyao_records_v1/);
assert.strictEqual(deepseekClient.MODEL,'deepseek-v4-flash');
assert.match(html,/src="deepseek-client\.js\?v=20260817\.1"/);
assert.match(html,/DeepSeekClient\.requestFinal\(\{apiKey:key,messages:messages,maxTokens:16384/);
assert.match(html,/requestId!==aiRequestSeq/);
assert.match(html,/useGodKeyAtStart=useGodSnapshotKey\(kernel\.fixedUseGod\)/);
assert.match(html,/useGodSnapshotKey\(activeUseGod\(\)\)!==useGodKeyAtStart/);
assert.match(html,/function saveUseGod\(\)[\s\S]{0,900}aiRequestSeq\+\+/);
assert.match(html,/证据编号已核对/);
assert.match(html,/基于旧用神/);
assert.match(html,/旧答待重验/);
assert.doesNotMatch(html,/assessmentSnapshot:kernel\.assessment/);
assert.match(html,/LiuyaoEngine\.validatePlateSnapshot\(record\.plateSnapshot\)/);
assert.match(html,/function validStoredUseGod\(record\)/);
assert.match(html,/if\(!Array\.isArray\(record\.aiHistory\)\)record\.aiHistory=\[\]/);
assert.match(fs.readFileSync('./liuyao-usegod.js','utf8'),/本人问自身疾病、健康或康复/);
assert.match(fs.readFileSync('./liuyao-usegod.js','utf8'),/medicineWords/);
assert.doesNotMatch(html,/暂按初爻到上爻列出第一个候选/);
assert.match(html,/confidence!==['"]高['"]/);
assert.match(html,/src="bazi-engine\.js\?v=20260905\.1"/);
assert.match(html,/@media\(max-width:620px\)/);
assert.match(html,/min-height:44px/);
assert.match(html,/<script src="liuyao-engine\.js\?v=20261101\.1/);
[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].filter(match=>match[1].trim()).forEach(match=>new Function(match[1]));

const qimen=fs.readFileSync('./index.html','utf8');
const bazi=fs.readFileSync('./bazi.html','utf8');
assert.match(html,/<nav class="top-row module-nav" aria-label="术数模块">\s*<a class="back page-switch" href="index\.html">奇门<\/a>\s*<a class="back page-switch" href="bazi\.html">八字<\/a>\s*<a class="back page-switch" href="liuyao\.html" aria-current="page">六爻<\/a>\s*<a class="back page-switch" href="ziwei\.html">紫微<\/a>\s*<a class="back page-switch" href="daily\.html">日运<\/a>/);
// 2026-11-01 墨金视觉与三步起卦流程：共用题头、铜钱摇卦、其他方式、换日开关、手机底部操作条
assert.match(html,/<link rel="stylesheet" href="premium-base\.css\?v=20261101\.2">/);
assert.match(html,/<link rel="stylesheet" href="liuyao-premium\.css\?v=20261101\.1">/);
assert.match(html,/<script src="premium-base\.js\?v=20261101\.2" defer><\/script>/);
assert.match(html,/<script src="liuyao-premium\.js\?v=20261101\.1" defer><\/script>/);
assert.match(html,/<header class="top">[\s\S]*class="appbar"[\s\S]*class="page-intro"/);
assert.match(html,/id="lySteps"[\s\S]*问事[\s\S]*摇卦[\s\S]*盘面与解读/);
assert.match(html,/id="coinTray"/);assert.match(html,/id="hexBuild"/);assert.match(html,/LiuyaoEngine\.tossLine\(\)/);
// 用户只需看阴阳与动静：界面不出现字/背文字
assert.match(html,/<b>○<\/b> 老阳 · 动　<b>×<\/b> 老阴 · 动/);
assert.match(html,/onclick="showOtherMethod\('coins'\)">逐爻录入<\/button>/);
assert.match(html,/<option value="7">少阳（静）<\/option><option value="8">少阴（静）<\/option><option value="9">老阳（动 ○）<\/option><option value="6">老阴（动 ×）<\/option>/);
{
  const visible=html.replace(/<script[\s\S]*?<\/script>/g,m=>m.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g,'')).replace(/face==='背'|face==='字'/g,'');
  assert.ok(!/[三两一]背|三字|几个背|字背|背字|>字<|>背</.test(visible),'界面不应出现字/背文字');
  assert.ok(!/coins\.join\(/.test(html),'界面不应展示铜钱字背序列');
  const tossSource=html.match(/var LINE_SHORT_LABELS=[^\n]*\nfunction tossText\(toss\)\{[^\n]*\}/)[0];
  const tossText=new Function(tossSource+';return tossText')();
  assert.strictEqual(tossText({coins:['字','背','背'],value:8}),'少阴（静）');
  assert.strictEqual(tossText({coins:['背','背','背'],value:9}),'老阳 ○（动）');
  assert.strictEqual(tossText({coins:['字','字','字'],value:6}),'老阴 ×（动）');
  assert.strictEqual(tossText({coins:['背','字','字'],value:7}),'少阳（静）');
}
assert.match(html,/data-other="hexagram"/);assert.match(html,/LiuyaoEngine\.linesFromHexagrams/);
assert.match(html,/梅花法 · 仅一动爻 · 非纳甲正法/);assert.match(html,/LiuyaoEngine\.meihuaCast/);
assert.match(html,/id="dayBoundary"[\s\S]*23:00 换日（子初，默认/);assert.match(html,/function computePillars\(time,boundary\)/);
assert.match(html,/if\(!castTimeEdited\)useCurrentTime\(\)/);assert.match(html,/id="castTimeInfo"/);
assert.match(html,/<details class="more-fields field full" id="moreFields">/);
assert.match(html,/id="lyDock"/);assert.match(html,/function updateFlow\(\)/);
assert.match(html,/class="m-change"/);
assert.match(html,/LiuyaoEngine\.rankUseGodCandidates/);assert.match(html,/野鹤另有经验/);
assert.match(html,/LiuyaoEngine\.upgradePlateTags/);
assert.match(html,/id:'B04'/);
for(const tag of ['卦变反吟','六合变六冲','六冲变六合','独发','三合水局','随鬼入墓','化空','化破','内卦伏吟','外卦反吟'])assert.ok(html.includes("'"+tag+"':"),'术语说明缺少 '+tag);
// 梅花时间起卦：农历月份可能为汉字（九月、冬月、腊月）
{
  const lunarSource=html.match(/function lunarNumber\(text\)\{[\s\S]*?\n\}/)[0];
  const lunarNumber=new Function(lunarSource+';return lunarNumber')();
  assert.deepStrictEqual(['九月','正月','冬月','腊月','十一月','闰四月','9','23','初三','十五','廿一','三十'].map(lunarNumber),[9,1,11,12,11,4,9,23,3,15,21,30]);
}
// ---------- 用神对照库 / 引导问答 / AI 建议（2026-11-01） ----------
{
  const U=require('./liuyao-usegod.js');
  const self={mode:'self',gender:'男'},selfF={mode:'self',gender:'女'};
  const expectations=[
    ['今晚还会喝到啤酒吗','other',self,'妻财','food'],
    ['今晚和朋友聚餐能吃到火锅吗','other',self,'妻财','food'],
    ['外卖什么时候能送到','other',self,'妻财','food'],
    ['这个月工资能按时发吗','other',self,'妻财','money'],
    ['这次投资能赚钱吗','other',self,'妻财','money'],
    ['快递今天能到吗','other',self,'妻财','item'],
    ['能拿到这个offer吗','other',self,'官鬼','job'],
    ['下周的面试能过吗','other',self,'官鬼','job'],
    ['这次考研能考上吗','other',self,'父母','document'],
    ['合同这周能签下来吗','other',self,'父母','document'],
    ['什么时候能买到房子','other',self,'父母','house'],
    ['明天会下雨吗','other',self,'父母','weatherRain'],
    ['周末会放晴吗','other',self,'妻财','weatherSun'],
    ['这场官司能赢吗','other',self,'shi','lawsuit'],
    ['今天顺利吗','other',self,'shi','self'],
    ['这周出差顺利吗','other',self,'shi','travel'],
    ['我妈身体好吗','other',self,'父母','parents'],
    ['我女儿的病情会好吗','other',self,'子孙','children'],
    ['老公今晚几点回家','other',self,'官鬼','husband'],
    ['女朋友会和我复合吗','other',self,'妻财','wife'],
    ['对象会和我复合吗','other',selfF,'官鬼','husband'],
    ['她喜欢我吗','other',self,'ying','other'],
    ['能顺利怀孕吗','other',self,'子孙','pregnancy'],
    ['这个药的疗效如何','other',self,'子孙','medicine'],
    ['朋友欠我的钱能要回来吗','other',self,'妻财','money'],
    ['钱包丢了能找回来吗','lost',self,'妻财','lost'],
    ['身份证丢了能找到吗','lost',self,'父母','lost'],
    ['今晚会有酒喝吗','other',self,'妻财','food']
  ];
  for(const [question,questionType,asker,value,category] of expectations){
    const result=U.classify({question,questionType,asker});
    assert.strictEqual(result.status,'matched','应能归类：'+question+' → '+JSON.stringify(result));
    assert.strictEqual(result.target.value,value,question);assert.strictEqual(result.target.category,category,question);
    assert.ok(result.target.reason&&result.target.source,'每条归类都要有白话理由和出处：'+question);
  }
  // 饮食：用神妻财，子孙为原神（《卜筮正宗·黄金策》“财为饮食”“子孙……又为酒肉”）
  const beer=U.classify({question:'今晚还会喝到啤酒吗',questionType:'other',asker:self}).target;
  assert.strictEqual(beer.yuan,'子孙');assert.strictEqual(beer.ji,'兄弟');assert.match(beer.source,/财为饮食/);assert.match(beer.source,/酒肉/);
  assert.strictEqual(U.categories.find(item=>item.id==='food').use,'妻财');
  for(const id of ['food','money','item','house','document','job','lawsuit','weatherRain','weatherSun','medicine','illnessSelf','pregnancy','parents','children','peers','wife','husband','love','boss','other','travel','lost','self'])assert.ok(U.categories.find(item=>item.id===id&&item.source&&item.plain&&item.use),'对照库缺少类目 '+id);
  // 歧义与无关键词：不得乱猜，交给引导问答
  for(const [question,start] of [['我爸今晚能喝到酒吗','topic'],['明天天气怎么样','weather'],['孩子考试能考上吗','topic'],['我想问一件事','topic'],['他的病能不能康复','illness']]){
    const result=U.classify({question,questionType:'other',asker:question.startsWith('他')?{mode:'other',gender:'男'}:self});
    assert.notStrictEqual(result.status,'matched','应交给引导问答：'+question);assert.strictEqual(result.guideStart,start,question);
  }
  assert.strictEqual(U.classify({question:'我和朋友去吃饭开心吗',questionType:'other',asker:self}).target.value,'妻财','“和朋友”是同伴，不改变饮食用神');
  // 引导问答：2–3 步得到用神
  const step1=U.guideStep([],'topic');assert.strictEqual(step1.done,false);assert.ok(step1.node.options.length>=8);
  for(const [answers,value,category] of [[['get','food'],'妻财','food'],[['self'],'shi','self'],[['person','elder'],'父母','parents'],[['person','partner','female'],'妻财','wife'],[['person','partner','male'],'官鬼','husband'],[['person','stranger'],'ying','other'],[['ill','drug'],'子孙','medicine'],[['trip','wait','peer'],'兄弟','peers'],[['weather','rain'],'父母','weatherRain'],[['lost','papers'],'父母','lost'],[['job'],'官鬼','job'],[['doc'],'父母','document']]){
    const result=U.guideStep(answers,'topic');assert.strictEqual(result.done,true,answers.join('>'));assert.strictEqual(result.target.value,value,answers.join('>'));assert.strictEqual(result.target.category,category);assert.deepStrictEqual(result.target.guidePath.length,answers.length);
  }
  assert.strictEqual(U.guideStep(['rain'],'weather').target.value,'父母','天气歧义可从“天气”一步开始');
  assert.ok(U.guideStep(['nope'],'topic').error,'无效选项要报错');
  // AI 建议：只接受合法 JSON 与合法六亲/世应
  const okAi=U.parseAiSuggestion('```json\n{"kind":"relative","value":"妻财","reason":"问能否喝到酒，酒食属可受用之物，取妻财。"}\n```');
  assert.strictEqual(okAi.valid,true);assert.strictEqual(okAi.target.value,'妻财');assert.strictEqual(okAi.target.yuan,'子孙');
  assert.strictEqual(U.parseAiSuggestion('{"kind":"role","value":"世爻","reason":"问自身吉凶看世爻"}').target.value,'shi');
  for(const bad of ['妻财','{"kind":"relative","value":"财爻","reason":"理由理由"}','{"kind":"role","value":"间爻","reason":"理由理由"}','{"kind":"relative","value":"官鬼"}','[1,2]','{bad json'])assert.strictEqual(U.parseAiSuggestion(bad).valid,false,'非法 AI 输出应被拒绝：'+bad);
  const msgs=U.buildAiMessages({question:'今晚还会喝到啤酒吗',questionType:'其他具体事项',asker:'本人',lines:[{label:'上爻',relative:'子孙',stemBranch:'癸酉',shi:true}]});
  assert.strictEqual(msgs.length,2);assert.match(msgs[0].content,/只输出一个 JSON/);assert.match(msgs[0].content,/饮食酒食 → 妻财/);assert.match(msgs[1].content,/今晚还会喝到啤酒吗/);
  // 落到盘面：坤为地之地水师，妻财只在五爻癸亥
  const beerPlate=engine.buildPlate({lines:[8,6,8,8,8,8],monthGZ:'戊戌',dayGZ:'己卯'});
  assert.match(beerPlate.primary.fullName||beerPlate.primary.name,/坤/);assert.match(beerPlate.changed.fullName||beerPlate.changed.name,/师/);
  const resolveBeer=resolveForPlate(beerPlate,engine);
  const beerChoice=resolveBeer(beer,{source:'用神对照库',origin:'library'});
  assert.strictEqual(beerChoice.relative,'妻财');assert.strictEqual(beerChoice.position,5);assert.strictEqual(beerChoice.stemBranch,'癸亥');assert.strictEqual(beerChoice.origin,'library');assert.match(beerChoice.why,/财为饮食/);
  assert.strictEqual(suggestForRecord({question:'今晚还会喝到啤酒吗',questionType:'other',asker:self},beerPlate,inferUseGodTarget,engine).position,5,'页面规则建议应直接定位五爻妻财');
  // 用神不上卦取伏神
  let hiddenCase=null;
  for(let mask=0;mask<64&&!hiddenCase;mask++){const lines=[0,1,2,3,4,5].map(i=>(mask>>i)&1?7:8);const plate=engine.buildPlate({lines,monthGZ:'戊戌',dayGZ:'己卯'});for(const relative of ['父母','兄弟','官鬼','妻财','子孙']){if(!plate.lines.some(l=>l.original.relative===relative)&&plate.lines.filter(l=>l.hidden&&l.hidden.relative===relative).length===1){hiddenCase={plate,relative};break}}}
  assert.ok(hiddenCase,'应能找到用神不上卦的样例');
  const hiddenChoice=resolveForPlate(hiddenCase.plate,engine)({kind:'relative',value:hiddenCase.relative,reason:'测试'},{origin:'guide',source:'引导问答'});
  assert.strictEqual(hiddenChoice.hidden,true);assert.strictEqual(hiddenChoice.relative,hiddenCase.relative);assert.match(hiddenChoice.reason,/用神不上卦/);
  // 页面：为什么取这个用神、来源、引导与 AI 入口
  assert.match(html,/<script src="liuyao-usegod\.js\?v=\d+\.\d+"><\/script>/);
  assert.match(html,/renderUseGodWhy\(\)\+/);
  assert.match(html,/为什么取这个用神：/);
  assert.match(html,/var USE_GOD_ORIGIN_LABELS=\{library:'对照库',type:'问事类型',guide:'引导问答',ai:'AI 建议',manual:'手动'\}/);
  assert.match(html,/function answerUseGodGuide\(id\)/);assert.match(html,/LiuyaoUseGod\.guideStep/);
  assert.match(html,/async function requestUseGodAi\(\)/);assert.match(html,/LiuyaoUseGod\.parseAiSuggestion/);
  assert.match(html,/未填写 DeepSeek API Key：可以继续用上面的问答，或在下方手动选择/);
  assert.match(html,/<span class="ug-ai-badge">AI 建议<\/span>/);assert.match(html,/onclick="adoptUseGodAi\(\)">采纳<\/button>/);
  assert.match(html,/selectionSource:selectionSource/);
  assert.doesNotMatch(html,/function suggestedUseGod\(\)\{[^}]*useGodAi/,'AI 建议不得自动成为用神，必须由用户采纳');

  // 问题内容优先于问事类型默认用神（用户反馈：选“事业工作”问喝啤酒被取成官鬼）
  const TYPES=['career','wealth','love','cooperation','travel','lost','other'];
  for(const q of ['今晚我还会喝啤酒吗','今晚还会喝到啤酒吗','今晚能喝点酒吗','周末能和朋友喝一杯吗','今晚能小酌两杯吗','今天还能喝上两口吗'])for(const type of TYPES)for(const gender of ['男','女','不透露']){
    const r=U.classify({question:q,questionType:type,asker:{mode:'self',gender}});
    assert.strictEqual(r.status,'matched',q+' / '+type+' 应能归类');
    assert.strictEqual(r.target.value,'妻财',q+' / '+type+' / '+gender+' 应取妻财');
    assert.strictEqual(r.target.category,type==='lost'?'lost':'food');
    if(type!=='lost'&&type!=='other'){
      const typeOnly=U.classify({question:'',questionType:type,asker:{mode:'self',gender}});
      const differs=typeOnly.status==='matched'&&(typeOnly.target.kind+typeOnly.target.value)!=='relative妻财';
      assert.strictEqual(!!r.target.conflict,differs,q+' / '+type+' / '+gender+' 冲突提示应与类型默认用神是否不同一致');
      if(differs){
        assert.strictEqual(r.target.conflict.notice,'问题内容像“饮食酒食”，与所选类型“'+U.typeLabels[type]+'”不一致，已按问题内容取妻财。');
        assert.strictEqual(r.target.conflict.typeTarget.basis,'type');assert.strictEqual(r.target.conflict.typeTarget.value,typeOnly.target.value);
      }
      assert.strictEqual(r.target.basis,'text');
    }
    // 理由、出处、原神忌神出自同一条目
    if(r.target.category==='food'){assert.match(r.target.reason,/取妻财/);assert.match(r.target.source,/财为饮食/);assert.strictEqual(r.target.yuan,'子孙');assert.strictEqual(r.target.ji,'兄弟');assert.doesNotMatch(r.target.reason,/官鬼|事业/)}
  }
  // 问题里没有更明确的事物：仍按问事类型，并注明来自问事类型
  const typeCases=[['career','这次面试能过吗','官鬼'],['career','今年能升职吗','官鬼'],['career','',"官鬼"],['wealth','这个月运气如何','妻财'],['love','我们还有可能吗','妻财','男'],['love','我们还有可能吗','官鬼','女'],['cooperation','这次谈判顺利吗','ying'],['travel','下周去上海顺利吗','shi'],['career','这次考试能过吗','父母']];
  for(const [type,q,want,gender='男'] of typeCases){
    const r=U.classify({question:q,questionType:type,asker:{mode:'self',gender}});
    assert.strictEqual(r.status,'matched',type+' '+q);assert.strictEqual(r.target.value,want,type+' '+q);assert.strictEqual(r.target.basis,'type');
    assert.ok(r.target.reason.startsWith('按所选问事类型“'+U.typeLabels[type]+'”：'),'类型兜底理由应注明来自问事类型：'+r.target.reason);assert.ok(!r.target.conflict);
    if(r.target.kind==='relative'){const cat=U.categories.find(c=>c.id===r.target.category);assert.strictEqual(r.target.source,cat.source);assert.strictEqual(r.target.yuan,U.yuan[want]);assert.strictEqual(r.target.ji,U.ji[want])}
  }
  // 事物与类型关键词并存（面试后喝酒）→ 交给引导问答；人物+饮食仍需确认
  assert.strictEqual(U.classify({question:'面试完能去喝酒吗',questionType:'career',asker:self}).status,'ambiguous');
  assert.strictEqual(U.classify({question:'我爸今晚能喝到酒吗',questionType:'career',asker:self}).status,'ambiguous');
  // 起卦前的类型提示
  assert.deepStrictEqual(U.suggestType('今晚我还会喝啤酒吗','career'),{type:'other',typeLabel:'其他具体事项',categoryLabel:'饮食酒食',fromLabel:'事业工作'});
  assert.strictEqual(U.suggestType('今晚我还会喝啤酒吗','other'),null);assert.strictEqual(U.suggestType('今晚我还会喝啤酒吗','wealth'),null);assert.strictEqual(U.suggestType('这次面试能过吗','career'),null);
  // 用户原盘：风火家人之水火既济（上爻老阳动），戊戌月庚辰日，事业工作 + 今晚我还会喝啤酒吗
  const jiaren=engine.buildPlate({lines:[7,8,7,8,7,9],monthGZ:'戊戌',dayGZ:'庚辰'});
  assert.match(jiaren.primary.fullName||jiaren.primary.name,/家人/);assert.match(jiaren.changed.fullName||jiaren.changed.name,/既济/);
  const jiarenRecord={question:'今晚我还会喝啤酒吗',questionType:'career',asker:{mode:'self',gender:'男'}};
  const jiarenPick=suggestForRecord(jiarenRecord,jiaren,inferUseGodTarget,engine);
  assert.ok(jiarenPick,'家人卦应能定位妻财');assert.strictEqual(jiarenPick.relative,'妻财');assert.strictEqual(jiarenPick.hidden,false);assert.strictEqual(jiarenPick.origin,'library');
  assert.strictEqual(jiarenPick.yuan,'子孙');assert.strictEqual(jiarenPick.ji,'兄弟');assert.match(jiarenPick.why,/财为饮食/);assert.doesNotMatch(jiarenPick.why,/事业|官鬼/);
  assert.match(jiarenPick.conflict.notice,/与所选类型“事业工作”不一致，已按问题内容取妻财/);assert.strictEqual(jiarenPick.conflict.typeUse,'官鬼');
  for(const type of ['other','wealth','love','travel','cooperation']){const p=suggestForRecord({...jiarenRecord,questionType:type},jiaren,inferUseGodTarget,engine);assert.ok(p,type);assert.strictEqual(p.relative,'妻财');assert.strictEqual(p.position,jiarenPick.position,'不同问事类型下同一饮食问题应落到同一爻：'+type)}
  const jiarenType=resolveForPlate(jiaren,engine)(U.classify(jiarenRecord).target.conflict.typeTarget,{source:'问事类型',origin:'type'});
  assert.strictEqual(jiarenType.relative,'官鬼');assert.strictEqual(jiarenType.hidden,true);assert.strictEqual(jiarenType.stemBranch,'辛酉');assert.strictEqual(jiarenType.origin,'type');assert.strictEqual(jiarenType.yuan,'妻财');assert.match(jiarenType.why,/按所选问事类型“事业工作”/);
  const careerOnly=suggestForRecord({question:'今年能升职吗',questionType:'career',asker:{mode:'self',gender:'男'}},jiaren,inferUseGodTarget,engine);
  assert.strictEqual(careerOnly.origin,'type');assert.strictEqual(careerOnly.source,'问事类型');
  // 页面：冲突提示、一键改按类型、起卦前提示
  assert.match(html,/function renderUseGodConflict\(confirmed,suggestion\)/);assert.match(html,/html\+=renderUseGodConflict\(confirmed,suggestion\);/);
  assert.match(html,/onclick="useTypeBasedUseGod\(\)">改按“/);assert.match(html,/confirmUseGodChoice\(resolved,'type'\)/);
  assert.match(html,/target\.basis==='type'\?\{source:'问事类型',origin:'type'\}/);
  assert.match(html,/<div id="typeHint" class="type-hint"/);assert.match(html,/LiuyaoUseGod\.suggestType\(/);assert.match(html,/function inspectQuestion\(\)\{\n  renderTypeHint\(\);/);
}
// 子时换日：0 点换日时 23 点后日辰不进位
{
  const computeSource=html.match(/function computePillars\(time,boundary\)\{[\s\S]*?\n\}/)[0];
  const hourSource=html.match(/function hourBranchOf\(hour\)\{[^\n]*\}/)[0];
  const fakeBazi={buildPillars:t=>({year:'丙午',month:'戊戌',day:t.hour>=23?'庚辰':'己卯',hour:'x'})};
  const computePillars=new Function('BaziEngine','LiuyaoEngine','HOUR_BRANCHES',hourSource+';'+computeSource+';return computePillars')(fakeBazi,engine,'子丑寅卯辰巳午未申酉戌亥');
  assert.strictEqual(computePillars({year:2026,month:11,day:1,hour:23,minute:30},'23').day,'庚辰');
  assert.strictEqual(computePillars({year:2026,month:11,day:1,hour:23,minute:30},'0').day,'己卯');
  assert.strictEqual(computePillars({year:2026,month:11,day:1,hour:23,minute:30},'0').hourBranch,'子');
  assert.strictEqual(computePillars({year:2026,month:11,day:1,hour:20,minute:30},'23').hourBranch,'戌');
}

assert.match(qimen,/href="ziwei\.html">紫微<\/a>/);
assert.match(bazi,/href="ziwei\.html">紫微<\/a>/);
assert.match(qimen,/href="daily\.html">日运<\/a>/);
assert.match(bazi,/href="daily\.html">日运<\/a>/);

// ---- 2026-11-01：反伏、冲合变化、三合、独发独静、随鬼入墓、旬空细分、用神两现、铜钱与梅花取卦 ----
// 来源：《增删卜易·反伏章》https://zh.wikisource.org/zh-hans/增刪卜易/25 ；《卜筮正宗·反吟卦定例》https://www.quanxue.cn/qt_mingxiang/boshi/boshi29.html
const tagsOf=(lines,monthGZ='庚申',dayGZ='癸巳')=>engine.buildPlate({lines,monthGZ,dayGZ});
const chantCases=[
  ['姤之恒',[8,7,7,7,9,9],'天风姤','雷风恒',['外卦伏吟'],['内卦伏吟','伏吟']],
  ['比之井',[8,6,6,8,7,8],'水地比','水风井',['内卦反吟'],['外卦伏吟','外卦反吟']],
  ['观之坤',[8,8,8,8,9,9],'风地观','坤为地',['外卦反吟'],['内卦伏吟','内卦反吟']],
  ['巽之观',[8,9,9,8,7,7],'巽为风','风地观',['内卦反吟'],['外卦伏吟','外卦反吟']],
  ['泰之乾',[7,7,7,6,6,6],'地天泰','乾为天',['六合变六冲'],['内卦伏吟','伏吟']],
  ['既济五爻动',[7,8,7,8,9,8],'水火既济','地火明夷',['独发'],['内卦伏吟','外卦伏吟','伏吟']],
  ['升之观',[8,9,9,8,6,6],'地风升','风地观',['反吟'],['内卦伏吟','外卦伏吟']],
  ['乾之坤',[9,9,9,9,9,9],'乾为天','坤为地',['卦变反吟','六冲变六冲'],['反吟','伏吟']],
  ['乾之姤',[9,7,7,7,7,7],'乾为天','天风姤',['内卦卦反吟','独发'],['外卦卦反吟']],
  ['否之泰（六合变六合）',[6,6,6,9,9,9],'天地否','地天泰',['六合变六合'],[]],
  ['乾之大壮',[7,7,7,7,9,9],'乾为天','雷天大壮',['六冲变六冲','外卦伏吟'],['伏吟']]
];
chantCases.forEach(([name,lines,primary,changed,must,mustNot])=>{
  const plate=tagsOf(lines);
  assert.strictEqual(plate.primary.fullName,primary,name+' 本卦');
  assert.strictEqual(plate.changed.fullName,changed,name+' 变卦');
  must.forEach(tag=>assert.ok(plate.tags.includes(tag),name+' 应有 '+tag+'，实际 '+plate.tags.join('、')));
  mustNot.forEach(tag=>assert.ok(!plate.tags.includes(tag),name+' 不应有 '+tag+'，实际 '+plate.tags.join('、')));
});
let falseChant=0;
for(let value=0;value<4096;value++){
  let n=value;const lines=[];for(let i=0;i<6;i++){lines.push([6,7,8,9][n%4]);n=Math.floor(n/4)}
  const plate=engine.buildPlate({lines,monthGZ,dayGZ});
  const innerMoved=lines.slice(0,3).some(v=>v===6||v===9),outerMoved=lines.slice(3).some(v=>v===6||v===9);
  if(plate.tags.some(tag=>/^内卦/.test(tag))&&!innerMoved)falseChant++;
  if(plate.tags.some(tag=>/^外卦/.test(tag))&&!outerMoved)falseChant++;
  if(!innerMoved&&!outerMoved)assert.ok(!plate.tags.some(tag=>/伏吟|反吟|变六|变卦六|独发|独静|随鬼|三合/.test(tag))||plate.tags.some(tag=>/^三合/.test(tag)||tag==='随鬼入墓'),'静卦不得出现动变标签');
  const moving=lines.filter(v=>v===6||v===9).length;
  assert.strictEqual(plate.tags.includes('独发'),moving===1);
  assert.strictEqual(plate.tags.includes('独静'),moving===5);
}
assert.strictEqual(falseChant,0,'内外卦反伏只看真正发动的那一半');
// 装卦不变：三个经典卦
const qian=engine.buildPlate({lines:[7,7,7,7,7,7],monthGZ:'丙寅',dayGZ:'甲子'});
assert.deepStrictEqual(qian.lines.map(l=>l.original.relative+l.original.stem+l.original.branch),['子孙甲子','妻财甲寅','父母甲辰','官鬼壬午','兄弟壬申','父母壬戌']);
assert.strictEqual(qian.palace.shi,6);assert.strictEqual(qian.palace.ying,3);
const gou=engine.buildPlate({lines:[8,7,7,7,7,7],monthGZ:'丙寅',dayGZ:'戊辰'});
assert.deepStrictEqual(gou.lines.map(l=>l.original.relative+l.original.stem+l.original.branch),['父母辛丑','子孙辛亥','兄弟辛酉','官鬼壬午','兄弟壬申','父母壬戌']);
assert.strictEqual(gou.palace.shi,1);assert.strictEqual(gou.palace.ying,4);assert.strictEqual(gou.lines[1].hidden.relative+gou.lines[1].hidden.stem+gou.lines[1].hidden.branch,'妻财甲寅');
const tai=engine.buildPlate({lines:[7,7,7,8,8,8],monthGZ:'丙寅',dayGZ:'庚午'});
assert.deepStrictEqual(tai.lines.map(l=>l.original.relative+l.original.stem+l.original.branch),['妻财甲子','官鬼甲寅','兄弟甲辰','兄弟癸丑','妻财癸亥','子孙癸酉']);
assert.strictEqual(tai.palace.shi,3);assert.strictEqual(tai.palace.ying,6);assert.strictEqual(tai.lines[1].hidden.relative+tai.lines[1].hidden.stem+tai.lines[1].hidden.branch,'父母乙巳');
// 派生标签可升级，旧快照（无 tagVersion、旧 tags）仍通过核对
const legacy=JSON.parse(JSON.stringify(engine.buildPlate({lines:[7,8,7,8,9,8],monthGZ,dayGZ})));
delete legacy.tagVersion;delete legacy.patterns;legacy.tags=['内卦伏吟'];
assert.ok(engine.validatePlateSnapshot(legacy),'旧快照的纳甲本体不变时应通过核对');
assert.ok(engine.upgradePlateTags(legacy));assert.ok(!legacy.tags.includes('内卦伏吟'));assert.strictEqual(legacy.tagVersion,engine.tagVersion);
const tampered=JSON.parse(JSON.stringify(engine.buildPlate({lines:[7,8,7,8,9,8],monthGZ,dayGZ})));tampered.lines[0].original.branch='午';
assert.ok(!engine.validatePlateSnapshot(tampered),'纳甲本体被改动仍须拒绝');
// 三合（《增删卜易·三合章》）
const sanheAll=tagsOf([9,9,9,9,9,9]);assert.ok(sanheAll.tags.includes('三合水局')&&sanheAll.tags.includes('三合火局'),'三爻动成局');
const sanhePending=engine.buildPlate({lines:[9,6,9,7,7,7],monthGZ:'丙寅',dayGZ:'甲子'});
assert.ok(!sanhePending.tags.some(tag=>/三合/.test(tag)),'只两爻动而第三支不在卦中，不作成局');
assert.ok(sanhePending.patterns.sanhe.some(item=>item.status==='pending'&&item.missing==='未'));
const sanheCal=engine.buildPlate({lines:[9,6,9,7,7,7],monthGZ:'丙寅',dayGZ:'己未'});
assert.ok(sanheCal.tags.includes('三合木局'),'日辰补凑第三支时成局');
const sanheTwoMoveOneStatic=engine.buildPlate({lines:[9,7,9,7,7,7],monthGZ:'丙寅',dayGZ:'甲子'});
assert.ok(!sanheTwoMoveOneStatic.tags.some(tag=>/三合/.test(tag))||sanheTwoMoveOneStatic.patterns.sanhe.every(item=>item.members.filter(m=>m.kind==='明动'||m.kind==='暗动').length>=2));
// 随鬼入墓：《增删卜易·随鬼入墓章》申月戊辰日同人之离、戌月甲寅日小过之旅（世旺皆非真入墓）
const ghost1=engine.buildPlate({lines:[7,8,7,7,9,7],monthGZ:'壬申',dayGZ:'戊辰'});
assert.strictEqual(ghost1.primary.fullName,'天火同人');assert.ok(ghost1.tags.includes('随鬼入墓'));assert.deepStrictEqual(ghost1.patterns.ghostGrave.kinds,['日墓']);
assert.ok(engine.buildUseGodAssessment({plate:ghost1,useGod:{position:3}}).arbitration.conditions.some(text=>text.includes('随鬼入墓')&&text.includes('不作真入墓')));
const ghost2=engine.buildPlate({lines:[8,8,7,9,8,6],monthGZ:'甲戌',dayGZ:'甲寅'});
assert.strictEqual(ghost2.primary.fullName,'雷山小过');assert.ok(ghost2.patterns.ghostGrave.kinds.includes('化墓'));
const ghostTrue=engine.buildPlate({lines:[7,8,7,7,7,7],monthGZ:'丙辰',dayGZ:'戊辰'});
if(ghostTrue.patterns.ghostGrave){const a=engine.buildUseGodAssessment({plate:ghostTrue,useGod:{position:3}});assert.ok(a.arbitration.constraint.concat(a.arbitration.conditions).some(text=>text.includes('随鬼入墓')))}
// 旬空细分（《增删卜易·旬空章》《卜筮正宗·旬空论》）
const cv=engine.classifyVoid;
assert.strictEqual(cv({branch:'亥',monthBranch:'子',dayBranch:'甲子'[1],dayGZ:'甲子'}).status,'不为空','旺不为空');
assert.ok(cv({branch:'亥',monthBranch:'午',dayBranch:'子',dayGZ:'甲子',moving:true}).notVoidReasons.includes('动不为空'));
assert.strictEqual(cv({branch:'戌',monthBranch:'辰',dayBranch:'子',dayGZ:'甲子'}).status,'真空','月破为空');
assert.ok(cv({branch:'戌',monthBranch:'卯',dayBranch:'子',dayGZ:'甲子'}).trueReasons.some(text=>text.includes('春土')),'春土为真空');
assert.ok(cv({branch:'申',monthBranch:'午',dayBranch:'子',dayGZ:'甲午'}).trueReasons.some(text=>text.includes('夏金')),'夏金为真空');
assert.ok(cv({branch:'寅',monthBranch:'酉',dayBranch:'子',dayGZ:'甲辰'}).trueReasons.some(text=>text.includes('秋木')),'秋木为真空');
assert.ok(cv({branch:'午',monthBranch:'子',dayBranch:'酉',dayGZ:'甲申'}).trueReasons.some(text=>text.includes('冬火')),'冬火为真空');
assert.ok(cv({branch:'亥',monthBranch:'午',dayBranch:'申',dayGZ:'甲子'}).notVoidReasons.includes('有日建生扶不为空'));
assert.ok(cv({branch:'亥',monthBranch:'午',dayBranch:'辰',dayGZ:'甲子',hidden:true,flyingControls:true}).trueReasons.includes('伏而被克为空'));
assert.ok(cv({branch:'亥',monthBranch:'亥',dayBranch:'辰',dayGZ:'甲子',hidden:true}).notVoidReasons.includes('伏而旺相不为空'));
const voidTiming=cv({branch:'亥',monthBranch:'午',dayBranch:'卯',dayGZ:'己卯'.replace('己卯','丁卯')});
assert.match(voidTiming.timing,/冲空：逢巳日/);assert.match(voidTiming.timing,/填实：逢亥日/);assert.match(voidTiming.timing,/甲戌日起/);
// 化空、化破也作用于原神、忌神等动爻
let sawChangeVoid=false,sawChangeBreak=false;
for(let value=0;value<4096&&!(sawChangeVoid&&sawChangeBreak);value+=3){
  let n=value;const lines=[];for(let i=0;i<6;i++){lines.push([6,7,8,9][n%4]);n=Math.floor(n/4)}
  const plate=engine.buildPlate({lines,monthGZ:'丙寅',dayGZ:'甲子'});
  plate.lines.forEach(line=>{const a=engine.buildUseGodAssessment({plate,useGod:{position:line.position}});a.actors.forEach(actor=>{if(actor.changeFacts.includes('化空')&&['原神','忌神'].includes(actor.role)){sawChangeVoid=true;assert.ok(a.arbitration.conditions.some(text=>text.includes(actor.lineLabel)&&text.includes('化空')))}if(actor.changeFacts.includes('化破'))sawChangeBreak=true})});
}
assert.ok(sawChangeVoid,'应覆盖原神或忌神化空');assert.ok(sawChangeBreak,'应覆盖动爻化破');
// 用神两现：旺>衰、动>静、不空破>空破、不伤>伤
const twin=engine.buildPlate({lines:[7,7,7,8,6,8],monthGZ:'丙寅',dayGZ:'庚午'});
const twinRank=engine.rankUseGodCandidates({plate:twin,candidates:[{position:1},{position:5}]});
assert.strictEqual(twinRank.ranked[0].moving,true,'同为旺衰时取动');
const twinTie=engine.rankUseGodCandidates({plate:tai,candidates:[{position:3},{position:4}]});
assert.ok(twinTie.tie&&twinTie.chosen===null,'条件全同不强行取舍');
// 铜钱：0..7 与字背三元组一一对应，几率 1/8、3/8、3/8、1/8
const tossCounts={6:0,7:0,8:0,9:0},seenTriples=new Set();
for(let i=0;i<8;i++){const t=engine.tossLine(i);assert.strictEqual(t.value,engine.drawLine(i));tossCounts[t.value]++;seenTriples.add(t.coins.join(''));assert.strictEqual(t.coins.filter(c=>c==='背').length,t.backs);assert.strictEqual(t.value,[6,7,8,9][t.backs])}
assert.deepStrictEqual(tossCounts,{6:1,7:3,8:3,9:1});assert.strictEqual(seenTriples.size,8);
assert.strictEqual(engine.tossLine(7).mark,'○');assert.strictEqual(engine.tossLine(0).mark,'×');
// 卦名直选与梅花取卦
assert.deepStrictEqual(engine.linesFromHexagrams('111000','111111'),[7,7,7,6,6,6]);
assert.deepStrictEqual(engine.linesFromHexagrams('111111'),[7,7,7,7,7,7]);
const mh=engine.meihuaCast({type:'time',yearBranchNumber:1,lunarMonth:1,lunarDay:1,hourBranchNumber:1});
assert.strictEqual(mh.upper,'离');assert.strictEqual(mh.lower,'震');assert.strictEqual(mh.movingLine,4);assert.strictEqual(mh.lines.filter(v=>v===6||v===9).length,1);
const mn=engine.meihuaCast({type:'number',first:8,second:16});assert.strictEqual(mn.upper,'坤');assert.strictEqual(mn.lower,'坤');assert.strictEqual(mn.movingLine,6);
assert.throws(()=>engine.meihuaCast({type:'number',first:0,second:3}),/正整数/);
// AI 校验认得新标签
assert.ok(/卦变反吟/.test(fs.readFileSync('./liuyao-engine.js','utf8')));

// 本卦结论（规则初断）：liuyao-verdict.js 决策表
{
  const V=require('./liuyao-verdict.js');
  const verdictOf=(lines,monthGZ,dayGZ,useGod,question,category)=>{const plate=engine.buildPlate({lines,monthGZ,dayGZ});const assessment=engine.buildUseGodAssessment({plate,useGod});return {plate,v:V.build({plate,assessment,useGod,question,category})}};
  // 决策表有序、编号唯一、标签齐全
  assert.deepStrictEqual(V.decisionTable.map(r=>r.id),['D1','D2','D3','D4','D5','D6','D7','D8','D9','D10','D11']);
  V.decisionTable.forEach(r=>{assert.ok(V.labels[r.tendency],r.id);assert.ok(r.when&&r.why,r.id)});
  // 1. 用户的啤酒盘：艮为山之山地剥，戊戌月庚辰日，五爻妻财丙子；月克日克入墓，三爻子孙申金动来生，四爻戌土暗动与原神同动
  const beer=verdictOf([8,8,9,8,8,7],'戊戌','庚辰',{position:5,hidden:false},'今晚我还会喝啤酒吗','food');
  assert.strictEqual(beer.plate.primary.fullName,'艮为山');assert.strictEqual(beer.plate.changed.fullName,'山地剥');
  assert.strictEqual(beer.v.rule,'D4');assert.strictEqual(beer.v.tendency,'strained');assert.strictEqual(beer.v.label,'受制较重，有一线转机');
  assert.strictEqual(beer.v.answer,'今晚想喝上啤酒不太容易；除非有人张罗、朋友相邀或心情放松的场合（三爻子孙发动来生妻财）。');
  assert.deepStrictEqual([beer.v.scores.root,beer.v.scores.move,beer.v.scores.total],[-5,3,-2]);
  assert.ok(beer.v.reasons.length>=2&&beer.v.reasons.length<=3);assert.match(beer.v.reasons[0].text,/日月都不帮/);assert.ok(beer.v.reasons.some(r=>/子孙丙申金明动/.test(r.text)));
  assert.ok(beer.v.items.some(i=>i.key==='chain'&&i.weight===1),'原神忌神同动应记为连续相生');assert.strictEqual(beer.v.items.find(i=>i.key==='adverse').weight,0);
  assert.ok(beer.v.timing.some(t=>/亥时（21–23点）、子时（23–1点）/.test(t)),'问今晚应给出当晚时辰线索');
  beer.v.items.forEach(i=>assert.match(i.source,/《增删卜易/,'每条依据都要有出处'));
  // 2. 明显有利：用神二爻寅木临寅月当令、子日生，静卦无伤 → 偏顺利
  const good=verdictOf([7,7,8,7,7,6],'甲寅','甲子',{position:2,hidden:false},'这笔钱能到吗','money');
  assert.strictEqual(good.v.rule,'D6');assert.strictEqual(good.v.label,'偏顺利');assert.strictEqual(good.v.scores.root,4);assert.match(good.v.answer,/拿到这笔钱的可能较大/);
  // 3. 明显不利：休囚静而月破日克（D1，引擎“无根”优先规则）
  const bad=verdictOf([6,8,9,6,6,6],'丙子','甲子',{position:2,hidden:false},'这次升职能成吗','job');
  assert.strictEqual(bad.v.rule,'D1');assert.strictEqual(bad.v.label,'偏不利');assert.ok(bad.v.items.some(i=>i.key==='monthBreak'));assert.ok(bad.v.timing.some(t=>/月破/.test(t)));
  // 4. 旬空：真空 → 偏不利（D2）；旺而空为假空，不扣分，仍偏顺利
  const trueVoid=verdictOf([6,6,6,6,6,6],'丁卯','辛未',{position:5,hidden:false},'这笔钱能到吗','money');
  assert.strictEqual(trueVoid.v.rule,'D2');assert.ok(trueVoid.v.items.some(i=>i.key==='trueVoid'&&i.weight===-2));
  const falseVoid=verdictOf([7,7,8,7,7,6],'甲寅','甲辰',{position:2,hidden:false},'这笔钱能到吗','money');
  assert.ok(falseVoid.v.items.some(i=>i.key==='falseVoid'&&i.weight===0));assert.strictEqual(falseVoid.v.tendency,'favorable');
  // 5. 伏神：用神不上卦扣分并给出提拔应期；伏而被克、日月不扶 → 偏不利
  const hidden=verdictOf([7,6,9,6,6,6],'癸酉','甲子',{position:3,hidden:true},'这笔钱能到吗','money');
  assert.ok(hidden.v.items.some(i=>i.key==='hidden'));assert.ok(hidden.v.items.some(i=>i.key==='flyingDown'));assert.strictEqual(hidden.v.tendency,'unfavorable');assert.ok(hidden.v.timing.some(t=>/伏神待提拔/.test(t)));
  const hiddenRescued=verdictOf([7,6,9,6,6,6],'戊辰','甲子',{position:3,hidden:true},'这笔钱能到吗','money');
  assert.strictEqual(hiddenRescued.v.rule,'D4');
  // 6. 生扶与制约都重而相抵 → 吉凶参半（D3），不硬下结论
  const mixed=verdictOf([6,6,6,6,6,6],'丁卯','癸卯',{position:5,hidden:false},'这笔钱能到吗','money');
  assert.strictEqual(mixed.v.rule,'D3');assert.strictEqual(mixed.v.label,'吉凶参半');assert.match(mixed.v.answer,/规则难下定论/);
  assert.ok(mixed.v.scores.positive>=3&&mixed.v.scores.negative<=-3&&Math.abs(mixed.v.scores.total)<=1);
  // 7. 同一变爻的回头生与化长生只计一次
  assert.strictEqual(mixed.v.items.filter(i=>i.key==='changeUp').length,1);
  // 8. 旺相静爻的忌神不算“同动”，不触发贪生忘克
  const staticAdverse=verdictOf([7,7,8,8,6,6],'甲寅','甲戌',{position:5,hidden:false},'这笔钱能到吗','money');
  assert.ok(!staticAdverse.v.items.some(i=>i.key==='chain'));
  // 9. 用神改了，结论跟着变：同一盘改按官鬼（上爻寅木）
  const byType=verdictOf([8,8,9,8,8,7],'戊戌','庚辰',{position:6,hidden:false},'今晚我还会喝啤酒吗','job');
  assert.notStrictEqual(byType.v.label,beer.v.label);assert.match(byType.v.focusName,/上爻官鬼丙寅/);
  // 页面：结论卡、用神条、盘面与关系图常显、依据明细与复盘默认折叠、对照库只在抽屉里
  assert.match(html,/<script src="liuyao-verdict\.js\?v=\d+\.\d+"><\/script>/);
  const plateBody=html.match(/function renderPlate\(\)\{[\s\S]*?\n\}/)[0];
  const order=['renderVerdict()','renderUseGodWhy()','id="plateRows"','relation-box">'+"'"+'+relationHtml','id="whyDetails"','id="aiBox"','id="reviewBox"'].map(token=>plateBody.indexOf(token));
  order.forEach((pos,index)=>assert.ok(pos>0,'renderPlate 缺少第 '+index+' 段'));
  for(let k=1;k<order.length;k++)assert.ok(order[k]>order[k-1],'页面顺序应为 结论→用神条→盘面→关系图→依据明细→AI→复盘');
  assert.match(plateBody,/<details class="why-details" id="whyDetails"><summary>[\s\S]*?为什么这么断/);assert.doesNotMatch(plateBody,/id="whyDetails" open/);
  assert.match(plateBody,/renderVerdictDetails\(\)\+renderUseGodAssessment\(\)\+renderReadingGuide\(\)/);
  assert.match(plateBody,/<details class="review-box" id="reviewBox"'\+\(currentRecord\.review&&currentRecord\.review\.status==='verified'\?' open':''\)/);
  assert.doesNotMatch(plateBody,/renderUseGodReference\(/,'对照库不再出现在主流程');
  assert.match(html,/<dialog id="useGodLibrary" class="ug-library"/);assert.match(html,/function pickUseGodCategory\(id\)[\s\S]*?closeUseGodLibrary\(\);[\s\S]*?confirmUseGodChoice\(resolved,'library-pick'\)/);
  assert.match(html,/function filterUseGodLibrary\(value\)/);assert.match(html,/id="btnUseGodLibrary" onclick="openUseGodLibrary\(\)"/);
  assert.match(html,/id="btnUseGodChange" aria-expanded=/);
  // 用神条上直接有「对照库」按钮（浏览模式，可只看不选），位于【改】之前；改面板内的「查对照库」保留
  assert.strictEqual((html.match(/id="btnUseGodLibraryStrip" onclick="openUseGodLibrary\(\)"/g)||[]).length,2,'已定/未定用神两种用神条都要有对照库按钮');
  assert.match(html,/us-lib" id="btnUseGodLibraryStrip"[^']*>对照库<\/button>'\+'<button type="button" class="us-btn us-change" id="btnUseGodChange"/);
  assert.match(html,/id="btnUseGodLibrary" onclick="openUseGodLibrary\(\)">查对照库<\/button>/);assert.match(html,/function toggleUseGodPanel\(\)/);
  assert.match(html,/html\+=renderUseGodBox\(\)\+'<\/div>';/,'手动选择仍可从用神条展开');
  assert.match(html,/useGodPanelOpen=false;currentRecord\.useGod=\{/);
  assert.match(html,/currentVerdict=computeVerdict\(useGod,currentUseGodAssessment\)/,'结论随当前用神重算');
  assert.match(html,/<span class="vd-badge"[^>]*>规则初断<\/span>/);assert.match(html,/primary\.textContent='看结论'/);
  // AI 深入解读：以规则初断和已定用神为前提
  assert.match(html,/<h3>深入解读<\/h3>/);assert.match(html,/evidence\.push\(\{id:'V01',kind:'verdict'/);assert.match(html,/ruleVerdict:kernel\.ruleVerdict\?/);
  assert.match(html,/请把 ruleVerdict 和已定用神当作前提/);assert.match(html,/不得推翻规则内核或另立用神/);
}
console.log('liuyao page checks ok: 4096 inputs, 64 hexagrams, 12 months x 60 days, hidden lines, rule priority, AI fact bindings, chant/sanhe/void/coin rules, use-god library/guide/AI, text-over-type priority, rule verdict + layout');
