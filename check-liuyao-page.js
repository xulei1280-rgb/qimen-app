const assert=require('assert');
const fs=require('fs');
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
    assert.strictEqual(JSON.stringify(plate),before,'关系分析不得修改盘面快照');
    if(line.hidden&&!hiddenGraphChecked){
      const hiddenRelation=engine.buildUseGodRelations({plate,useGod:{position:line.position,hidden:true}});
      assert.ok(hiddenRelation.focus.roles.includes('伏神'));
      assert.ok(hiddenRelation.nodes.some(node=>node.id==='line-'+line.position&&node.roles.includes('飞神')));
      assert.ok(!hiddenRelation.nodes.some(node=>node.kind==='change'),'伏神不应虚构变爻');
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

const html=fs.readFileSync('./liuyao.html','utf8');
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
assert.match(html,/function applyUseGodSuggestion\(\)/);
assert.match(html,/function updateUseGodSelection\(\)/);
assert.match(html,/系统建议，也可以手动纠错/);
assert.match(html,/手工选择参考表/);
assert.match(html,/旺衰用于后续判断，不用于反推用神身份/);
assert.match(html,/男问妻财，女问官鬼/);
assert.match(html,/用神选择必须明确写出爻位、六亲和干支/);
assert.match(html,/function renderUseGodRelations\(\)/);
assert.match(html,/LiuyaoEngine\.buildUseGodRelations/);
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
assert.match(html,/renderUseGodBox\(\)\+relationHtml\+renderUseGodReference\(\)/);
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
assert.match(html,/@media\(max-width:620px\)/);
assert.match(html,/min-height:44px/);
assert.match(html,/<script src="liuyao-engine\.js/);
[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].filter(match=>match[1].trim()).forEach(match=>new Function(match[1]));

const qimen=fs.readFileSync('./index.html','utf8');
const bazi=fs.readFileSync('./bazi.html','utf8');
assert.match(html,/href="index\.html">奇门<\/a><a href="bazi\.html">八字<\/a><a href="liuyao\.html" aria-current="page">六爻<\/a><a href="ziwei\.html">紫微<\/a><a href="daily\.html">日运<\/a>/);
assert.match(qimen,/href="ziwei\.html">紫微<\/a>/);
assert.match(bazi,/href="ziwei\.html">紫微<\/a>/);
assert.match(qimen,/href="daily\.html">日运<\/a>/);
assert.match(bazi,/href="daily\.html">日运<\/a>/);

console.log('liuyao page checks ok: 4096 inputs, 64 hexagrams, 8 pure najia fixtures');
