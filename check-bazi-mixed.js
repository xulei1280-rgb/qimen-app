'use strict';
// Complete offline mixed readout audit; no network, AI, storage or browser calls.
process.env.TZ='Asia/Shanghai';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict'),crypto=require('crypto');
const defaultBefore=path.resolve(__dirname,'../bazi-yun-rules-20261108/pre-mixed-after.json');
const beforePath=process.argv[2]||(fs.existsSync(defaultBefore)?defaultBefore:null),output=process.argv[3];
const before=beforePath?JSON.parse(fs.readFileSync(beforePath,'utf8')):null;if(output)fs.mkdirSync(output,{recursive:true});
const ctx={console,Date,Math,JSON,BirthTime:require('./birth-time.js'),document:{addEventListener(){},body:{getAttribute(){return 'standard'}},querySelectorAll(){return []},getElementById(){return {value:'detail'}}},localStorage:{getItem(){return null},setItem(){}},confirm(){return true},prompt(){return ''}};vm.createContext(ctx);
for(const file of ['qimen.js','bazi-engine.js'])vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
for(const m of fs.readFileSync('bazi.html','utf8').matchAll(/<script>([\s\S]*?)<\/script>/g))vm.runInContext(m[1],ctx);
const E=ctx.BaziEngine,gz=vm.runInContext('GZ60',ctx),levels=['Y2','Y3','Y4','Y5-primary','Y5-secondary-avoid','Y6'];
// Standard copy may name terms (格局、主用、十神); it must not use mechanical role translations or hedges.
const mechanical=/出生(?:月份|日期|年份|时刻)的|这十年的|这一年的|作用接通或增强|应少增|原已选定|原已确认的帮助方向|主要帮助|补充帮助|不单列|未解瓶颈|以上结论只覆盖|不判断整体升降|尚待|尚缺|还缺|自身的同类支持|学习和支持|资源和机会|表达和产出|稳定产出|规则要求|外部压力（/g;
const forbidden=/可能|或许|看条件|不明确|分情况|分条件|取决于|尚未确认|暂缺整体结论|未定主用|无明确忌项|一部分|看情况|需结合全盘|未损日主根[01]|变化前：|变化后：|固定比例扶身指数|合会变气反馈|旧路径须按共同需求比较|结构分：|评分维度：|undefined|NaN/g;
function visible(markup,mode,expanded){let stack=[],out=[];for(const token of markup.match(/<[^>]*>|[^<]+/g)||[]){if(token.startsWith('</')){stack.pop();continue}if(token.startsWith('<')){const tag=(token.match(/^<([\w-]+)/)||[])[1];if(!tag)continue;const hidden=stack.some(Boolean)||(mode==='standard'?/professional-only/.test(token):/standard-only/.test(token))||(!expanded&&tag==='details'&&!/\bopen\b/.test(token));if(!/^(br|hr|img|input|meta|link|wbr)$/.test(tag)&&!token.endsWith('/>'))stack.push(hidden);continue}if(!stack.some(Boolean))out.push(token)}return out.join(' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\s+/g,' ').trim()}
function resolve(result,keys){return keys.reduce((obj,key)=>obj[key],result)}
function rank(e){const n=levels.indexOf(e.level);return n<0?levels.length:n}
const inputs=[['色魔','男',1993,11,24,5,2],['笠夏','男',1993,7,14,8,40],['小蔓','女',1998,6,23,9,30],['香肠','男',1993,12,13,8,5],['陈伟伟','男',2002,6,27,19,45]];
let total=0,rendered=0;const mixedRows=[],comparison=[],summaries=[],errors=[];
for(const [person,gender,year,month,day,hour,minute] of inputs){
 const b=E.createBaziProfile({person,gender,input:{year,month,day,hour,minute},location:{name:'云南省 曲靖市 师宗县',lng:103.9936,lat:24.8222},useTrueSolar:true,useDaylightSaving:false}),frozen=JSON.stringify(b),start=E.luckStartInfo(b),dir=E.luckDirection(b),mi=gz.indexOf(b.pillars.month),old=before&&before.charts.find(c=>c.person===person);let rowIndex=0,annual=0,all=0;
 if(old){assert.equal(frozen,JSON.stringify(old.frozen),'full natal profile frozen');assert.equal(JSON.stringify(start),JSON.stringify(old.start),'luck clock frozen');}
 function check(kind,cycle,luck,year,result){
  total++;const o=old&&old.rows[rowIndex++];if(o){assert.equal(JSON.stringify([kind,cycle,year||null]),JSON.stringify([o.kind,o.cycle,o.year]));assert.equal(result.direction,o.direction,'no direction changes for presentation focus');assert.equal(result.assessment,o.assessment);assert.equal(result.tendency||null,o.tendency||null);}
  const view=ctx.outlookDisplayView(result);assert.equal(view.direction,result.direction);comparison.push({person,cycle,luck,year:year||null,kind,beforeDirection:o&&o.direction,afterDirection:result.direction,beforeAssessment:o&&o.assessment,afterAssessment:result.assessment});
  if(result.direction!=='mixed')return;
  all++;if(kind==='annual')annual++;
  const snap=JSON.stringify(result),m=view.mixed;assert.ok(m&&m.benefit&&m.cost,'every mixed has a concrete pair');
  for(const [effect,sign] of [[m.benefit,'positive'],[m.cost,'negative']]){
   const e=result.evidence[effect.evidenceIndex];assert.equal(e.direction,sign);assert.equal(effect.ruleId,e.ruleId);assert.equal(effect.taskId,e.taskId);
   assert.equal(rank(e),Math.min(...result.evidence.filter(x=>x.direction===sign).map(rank)),'use highest adopted layer for that side, not lower reservations');
   assert.ok(effect.actorReferences.length,'an effect needs actual structured participants');
   for(const ref of effect.actorReferences){assert.equal(JSON.stringify(resolve(result,ref.path)),JSON.stringify(ref.actor),'actor trace resolves to the actual selected result');if(ref.path[0]==='evidence')assert.equal(ref.path[1],effect.evidenceIndex);else assert.equal(result.review[ref.path[1]][ref.path[2]].id,e.taskId,'legacy participant belongs to selected task');}
   assert.ok(effect.standard.length>effect.short.standard.length&&effect.professional.length>effect.short.professional.length,'concrete mechanism beyond a short label');
  }
  const focus=m.focus==='positive'?m.benefit:m.cost;assert.equal(rank(result.evidence[focus.evidenceIndex]),Math.min(rank(result.evidence[m.benefit.evidenceIndex]),rank(result.evidence[m.cost.evidenceIndex])));assert.equal(m.provenance.strengthDominance,false,'canonical ordering is not strength ranking');
  assert.equal(m.sameLayer,rank(result.evidence[m.benefit.evidenceIndex])===rank(result.evidence[m.cost.evidenceIndex]));
  assert.equal(JSON.stringify(ctx.outlookDisplayView(result).mixed),JSON.stringify(m),'deterministic selection');
  const card=ctx.renderOutlookBox(person+' '+luck+' '+(year||''),result),button=ctx.fortuneButton(String(year||cycle),'',luck,'','','year',0,false,'',result),text={};
  for(const mode of ['standard','professional']){
   const now=visible(card,mode,false),expanded=visible(card,mode,true),label=visible(button,mode,false),key=mode==='standard'?'standard':'professional';rendered++;
   assert.ok(now.includes(m.benefit[key])&&now.includes(m.cost[key]),'both concrete effects visible before opening any disclosure');
   assert.ok(label.includes(mode==='standard'?'有好有坏':'利弊并见'),'compact year card uses short mixed label; full effects live in the detail box');
   assert.ok(ctx.outlookContextText('测试比较',result,mode==='professional').includes(m.benefit[key])&&ctx.outlookContextText('测试比较',result,mode==='professional').includes(m.cost[key]),'report/prompt context shares both effects');
   const bad=expanded.match(forbidden)||[],terms=mode==='standard'?expanded.match(mechanical)||[]:[];if(bad.length||terms.length)errors.push({person,kind,cycle,year,mode,bad,terms});
   text[mode]={default:now,expanded,label};
  }
  assert.equal(JSON.stringify(result),snap,'presentation cannot mutate raw verdict/evidence');
  mixedRows.push({person,kind,cycle,luck,year:year||null,direction:result.direction,focus:m,text,card});
 }
 for(let i=0;i<10;i++){const luck=gz[(mi+dir*(i+1)+600)%60],previous=i?gz[(mi+dir*i+600)%60]:null,years=Array.from({length:10},(_,j)=>({year:start.startYear+i*10+j,gz:E.getFlowYearGZ(start.startYear+i*10+j)})),r=E.evaluateLuckOutlook(b,luck,previous,years);check('natal',i+1,luck,null,r.natal);if(i)check('previous',i+1,luck,null,r.previous);for(const y of r.years){check('annual',i+1,luck,y.year,y.annual);check('increment',i+1,luck,y.year,y.increment)}}
 assert.equal(JSON.stringify(b),frozen,'no natal mutations');summaries.push({person,beforeAnnualMixed:old?old.rows.filter(r=>r.kind==='annual'&&r.direction==='mixed').length:null,beforeAllMixed:old?old.rows.filter(r=>r.direction==='mixed').length:null,afterAnnualMixed:annual,afterAllMixed:all});
}
assert.equal(total,1095);assert.deepEqual(errors,[],'all mixed standard/professional copy must pass blacklist');
const changes=comparison.filter(r=>r.beforeDirection&&r.beforeDirection!==r.afterDirection),summary={total,mixed:mixedRows.length,renderedModePairs:rendered/2,renderedCards:rendered,directionChanges:changes.length,sameLayer:mixedRows.filter(r=>r.focus.sameLayer).length,crossLayer:mixedRows.filter(r=>!r.focus.sameLayer).length,counts:summaries,copyErrors:errors.length,comparedTo:beforePath,engineSourceSha256:crypto.createHash('sha256').update(fs.readFileSync('bazi-engine.js')).digest('hex')};
if(output){fs.writeFileSync(path.join(output,'mixed-summary.json'),JSON.stringify(summary,null,2));fs.writeFileSync(path.join(output,'mixed-readouts.json'),JSON.stringify(mixedRows,null,2));fs.writeFileSync(path.join(output,'round-direction-comparison.json'),JSON.stringify(comparison,null,2));fs.writeFileSync(path.join(output,'round-direction-changes.json'),JSON.stringify(changes,null,2));fs.writeFileSync(path.join(output,'mixed-copy-errors.json'),JSON.stringify(errors,null,2));
 for(const mode of ['standard','professional']){fs.writeFileSync(path.join(output,'mixed-'+mode+'.txt'),mixedRows.map(r=>r.person+' '+r.kind+' '+r.cycle+' '+r.luck+' '+(r.year||'')+'\n'+r.text[mode].default+'\n').join('\n'));fs.writeFileSync(path.join(output,'mixed-'+mode+'.html'),'<!doctype html><meta charset="utf-8"><style>.'+(mode==='standard'?'professional-only':'standard-only')+'{display:none!important}</style>'+mixedRows.map(r=>r.card).join('\n'));}}
console.log('Mixed readout PASS:',JSON.stringify(summary));
