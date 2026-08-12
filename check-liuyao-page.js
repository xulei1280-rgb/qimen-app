const assert=require('assert');
const fs=require('fs');
const engine=require('./liuyao-engine.js');

const monthGZ='丙寅';
const dayGZ='甲子';
const codeLines=code=>code.split('').map(bit=>bit==='1'?7:8);
const plateForCode=code=>engine.buildPlate({lines:codeLines(code),monthGZ,dayGZ});

assert.throws(()=>engine.validateLines([7,7]),/六爻必须/);
assert.throws(()=>engine.validateLines([7,7,7,7,7,5]),/上爻只能/);
assert.deepStrictEqual(Array.from({length:8},(_,i)=>engine.drawLine(i)),[6,7,7,7,8,8,8,9]);

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

let hiddenCount=0;
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
  });
}
assert.ok(hiddenCount>0,'应覆盖伏神');

const html=fs.readFileSync('./liuyao.html','utf8');
assert.match(html,/id="blankPlate"/);
assert.match(html,/id="resultArea" hidden/);
assert.match(html,/逐爻摇卦/);
assert.match(html,/一键成卦/);
assert.match(html,/手动录入/);
assert.match(html,/liuyao_records_v1/);
assert.match(html,/deepseek-v4-pro/);
assert.match(html,/requestId!==aiRequestSeq/);
assert.match(html,/已按保存快照打开，不重新计算历史盘/);
assert.match(html,/@media\(max-width:620px\)/);
assert.match(html,/min-height:44px/);
assert.match(html,/<script src="liuyao-engine\.js/);
[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].filter(match=>match[1].trim()).forEach(match=>new Function(match[1]));

const qimen=fs.readFileSync('./index.html','utf8');
const bazi=fs.readFileSync('./bazi.html','utf8');
assert.match(qimen,/href="liuyao\.html">六爻问事/);
assert.match(bazi,/href="liuyao\.html">六爻问事/);

console.log('liuyao page checks ok: 4096 inputs, 64 hexagrams, 8 pure najia fixtures');
