// Offline regression: node check-bazi-yun-regression.js [repo] [after.json] [before.json].
// Bulk output is opt-in; keep generated artifacts outside the repository.
process.env.TZ='Asia/Shanghai';
const fs=require('fs'),vm=require('vm'),path=require('path');
const assert=require('node:assert/strict');
const repo=path.resolve(process.argv[2]||__dirname);
const output=process.argv[3];
const beforeFile=process.argv[4];
const ctx={console,Date,Math,JSON,BirthTime:require(path.join(repo,'birth-time.js'))};
vm.createContext(ctx);
for(const file of ['qimen.js','bazi-engine.js'])vm.runInContext(fs.readFileSync(path.join(repo,file),'utf8'),ctx,{filename:file});
const E=ctx.BaziEngine, gz=vm.runInContext('GZ60',ctx);
const inputs=[['色魔','男',1993,11,24,5,2],['笠夏','男',1993,7,14,8,40],['小蔓','女',1998,6,23,9,30],['香肠','男',1993,12,13,8,5],['陈伟伟','男',2002,6,27,19,45]];
const report={engineSourceSha256:require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(repo,'bazi-engine.js'))).digest('hex'),engineVersion:'luck-outlook-20261108.3-mixed-copy',baseline:process.env.BASELINE_SHA||'unknown',timezone:'Asia/Shanghai',scope:'10 cycles, 10 assigned calendar flow years per cycle; no-previous unavailable excluded',charts:[]};
for(const [person,gender,year,month,day,hour,minute] of inputs){
 const input={year,month,day,hour,minute};
 const b=E.createBaziProfile({person,gender,input,location:{name:'云南省 曲靖市 师宗县',lng:103.9936,lat:24.8222},useTrueSolar:true,useDaylightSaving:false});
 const start=E.luckStartInfo(b),dir=E.luckDirection(b),mi=gz.indexOf(b.pillars.month),rows=[];
 const cycles=Array.from({length:10},(_,i)=>({index:i+1,gz:gz[(mi+dir*(i+1)+600)%60],startYear:start.startYear+i*10}));
 function add(kind,c,year,result){rows.push({kind,cycle:c.index,luck:c.gz,startYear:c.startYear,year:year||null,direction:result.direction,tendency:result.tendency||null,assessment:result.assessment||null,label:result.label,possibleDirections:result.possibleDirections||[],uncertainty:result.uncertainty||[],evidence:result.evidence||[],residualCode:result.residualCode||null,missingFields:result.missingFields||[],knownFacts:result.knownFacts||[],review:result.review||null});}
 for(let i=0;i<cycles.length;i++){
  const c=cycles[i],years=Array.from({length:10},(_,j)=>({year:c.startYear+j,gz:E.getFlowYearGZ(c.startYear+j)}));
  const o=E.evaluateLuckOutlook(b,c.gz,i?cycles[i-1].gz:null,years);
  add('natal',c,null,o.natal);if(i)add('previous',c,null,o.previous);
  for(const y of o.years){add('annual',c,y.year,y.annual);add('increment',c,y.year,y.increment);}
 }
 const summary={};for(const kind of ['natal','previous','annual','increment']){const r=rows.filter(x=>x.kind===kind);summary[kind]={total:r.length,unsupported:r.filter(x=>x.assessment==='unsupported').length,conditional:r.filter(x=>x.assessment==='conditional').length,pending:r.filter(x=>x.direction==='pending').length,determined:r.filter(x=>x.assessment==='determined').length,mixed:r.filter(x=>x.direction==='mixed').length,neutral:r.filter(x=>x.direction==='neutral').length};}
 const nearby=rows.filter(x=>x.year>=2024&&x.year<=2031);
 const item={frozen:JSON.parse(JSON.stringify(b)),person,gender,input,used:b.time.used,pillars:b.pillars,strength:b.strength,useful:b.patternAnalysis.useful,monthCommand:b.patternAnalysis.monthCommand,special:b.patternAnalysis.specialPatternQualification||null,start,cycles,summary,nearby:nearby.map(({review,...x})=>x),rows};
 report.charts.push(item);console.log(person,JSON.stringify(summary),'nearby unsupported',nearby.filter(x=>x.assessment==='unsupported').length+'/'+nearby.length);
}

let total=0;
for(const c of report.charts){
 assert.equal(c.rows.length,219);
 for(const r of c.rows){
  total++;
  if(r.assessment==='determined'){
   assert.ok(r.evidence.length,'determined requires actual evidence');
   assert.ok(r.evidence.every(e=>e.ruleId&&e.before!==undefined&&e.after!==undefined),'evidence needs rule and before/after facts');
   if(r.direction==='mixed')assert.ok(r.evidence.some(e=>e.direction==='positive')&&r.evidence.some(e=>e.direction==='negative'),'mixed requires both independent directions');
   if(r.direction==='neutral')assert.ok(r.evidence.every(e=>e.ruleId==='Y7-continuity'||r.review.protectedDetermined&&e.ruleId==='LK-13'),'neutral requires continuity checks');
   if(r.direction==='positive'||r.direction==='negative')assert.ok(r.evidence.every(e=>e.direction===r.direction),'highest layer cannot contradict verdict');
  }else assert.ok(r.residualCode&&r.missingFields.length&&r.review.checked.length,'residual needs an explicit evidence gap');
 }
 const b=c.frozen,snapshot=JSON.stringify(b),cycle=c.cycles[2],years=[2024,2025,2026].map(year=>({year,gz:E.getFlowYearGZ(year)}));
 const first=E.evaluateLuckOutlook(b,cycle.gz,c.cycles[1].gz,years);
 assert.equal(JSON.stringify(E.evaluateLuckOutlook(b,cycle.gz,c.cycles[1].gz,years)),JSON.stringify(first),'repeatability');
 assert.equal(JSON.stringify(E.evaluateLuckOutlook(b,cycle.gz,null,years).natal),JSON.stringify(first.natal),'previous comparison cannot contaminate natal');
 assert.equal(JSON.stringify(E.evaluateLuckOutlook(b,cycle.gz,null,years).years),JSON.stringify(first.years),'previous comparison cannot contaminate annual/increment');
 const reverse=E.evaluateLuckOutlook(b,cycle.gz,c.cycles[1].gz,years.slice().reverse());
 assert.equal(JSON.stringify(reverse.years.slice().reverse()),JSON.stringify(first.years),'year order cannot contaminate comparisons');
 assert.equal(JSON.stringify(b),snapshot,'outlook must not mutate natal profile');
 assert.equal(E.evaluateLuckOutlook(b,cycle.gz,null,[]).previous.direction,'unavailable');
 assert.equal(E.evaluateLuckOutlook(b,'甲甲',null,[]).natal.assessment,'input-error');
 assert.equal(E.evaluateLuckOutlook(b,cycle.gz,null,[{year:2026,gz:'甲子'}]).years[0].annual.assessment,'input-error');
}
assert.equal(total,1095);
if(beforeFile){
 const before=JSON.parse(fs.readFileSync(beforeFile,'utf8')),comparisons=[],flips=[];
 for(const c of report.charts){
  const old=before.charts.find(x=>x.person===c.person);
  assert.equal(JSON.stringify(c.frozen),JSON.stringify(old.frozen),'FULL natal profile frozen: '+c.person);
  assert.equal(JSON.stringify(c.start),JSON.stringify(old.start),'luck start frozen');
  assert.equal(JSON.stringify(c.cycles),JSON.stringify(old.cycles),'cycle boundaries frozen');
  c.rows.forEach((r,i)=>{
   const a=old.rows[i];assert.equal(JSON.stringify([r.kind,r.cycle,r.year]),JSON.stringify([a.kind,a.cycle,a.year]));
   if(a.assessment==='determined'&&r.direction!==a.direction){assert.equal(r.review.protectedDetermined.decision,'higher-priority-override');assert.ok(r.review.protectedDetermined.certificate.every(e=>e.change.verifiedCompleteTransition&&e.beforeActors&&e.afterActors&&e.reason.includes('遗漏')),'Y7.4 requires higher-priority active-cause certificate');}
   const flip=a.assessment==='determined'&&a.direction!==r.direction||a.tendency==='positive'&&['negative','mixed'].includes(r.direction)||a.tendency==='negative'&&['positive','mixed'].includes(r.direction);
   const omission={ 'Y3-medicine':'旧任务未逐病读取固定 source 对应的 medicines.rank 与实际 active 整链变化', 'Y3-carry-support':'旧承载任务停在离散强弱状态，没有独立结算已可达的印比至日主作用', 'Y3-carry-load':'旧任务没有把本次真实负荷与未增的承接放在同一固定病族核对', 'Y3-earth-metal':'旧任务没有以原局已确认土厚埋金为锚核对本次金根、润泄与壅土作用', 'Y3-required-path':'旧格族任务没有固定原局这条已确认必要链的实际参与者', 'Y4-output':'旧刃禄任务仅检查官杀约束，漏掉日主已可达的食伤出口', 'Y4-blade-outlet':'旧刃禄任务未核验比劫至食伤的实际出口', 'Y5-role-root':'旧规则停在格族任务，没有调用冻结主佐忌角色的本期可用根透对照', 'Y5-role-action':'旧规则没有把冻结喜忌角色的这条具体生克链纳入覆盖裁决', 'Y7-continuity':'旧任务的不确定项未改变已逐项核验的同需求功能状态' };
   const explanation='旧'+(a.assessment==='determined'?'已确定方向':'未完成裁决的倾向')+' '+a.direction+'/'+a.tendency+' 采用：'+a.evidence.map(e=>e.ruleId+' '+e.text).join('；')+'。新裁决优先层与实际变化：'+r.evidence.map(e=>(e.level||'')+' '+e.ruleId+' '+e.text).join('；')+'。旧规则遗漏/边界：'+r.evidence.map(e=>omission[e.ruleId]||e.adoptedReason||e.text).join('；')+'；按上述实际最高层裁决，同因替代不作两票，未解原任务保留审计。';
   const item={person:c.person,input:c.input,used:c.used,pillars:c.pillars,...r,before:{direction:a.direction,tendency:a.tendency,assessment:a.assessment},flip:!!flip,explanation,legacyEvidence:a.evidence,justification:r.evidence.map(e=>({ruleId:e.ruleId,level:e.level,actors:e.actors,before:e.before,after:e.after,reason:e.adoptedReason||e.text}))};
   if(flip){assert.ok(item.justification.length,'every direction flip needs causal evidence');flips.push(item)}
   comparisons.push(item);
  });
 }
 if(output){
  const dir=path.dirname(path.resolve(output)),csv=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
  const keys=['person','cycle','luck','startYear','year','kind','oldDirection','oldTendency','oldAssessment','direction','tendency','assessment','ruleIds','level','actors','flip','explanation','reason','residualCode'];
  const lines=comparisons.map(r=>({...r,oldDirection:r.before.direction,oldTendency:r.before.tendency,oldAssessment:r.before.assessment,ruleIds:r.evidence.map(e=>e.ruleId).join(';'),level:r.evidence.map(e=>e.level).join(';'),actors:JSON.stringify(r.evidence.map(e=>e.actors)),reason:r.evidence.map(e=>e.text).join(';')}));
  fs.writeFileSync(path.join(dir,'comparison.csv'),keys.map(csv).join(',')+'\n'+lines.map(r=>keys.map(k=>csv(r[k])).join(',')).join('\n')+'\n');
  fs.writeFileSync(path.join(dir,'comparison.json'),JSON.stringify(comparisons));
  fs.writeFileSync(path.join(dir,'direction-flips.json'),JSON.stringify(flips));
  fs.writeFileSync(path.join(dir,'protected-determined-flips.json'),JSON.stringify(flips.filter(r=>r.before.assessment==='determined')));
  fs.writeFileSync(path.join(dir,'tendency-reversals.json'),JSON.stringify(flips.filter(r=>r.before.assessment!=='determined')));
  fs.writeFileSync(path.join(dir,'protected-determined-review.json'),JSON.stringify(comparisons.filter(r=>r.before.assessment==='determined').map(r=>({person:r.person,cycle:r.cycle,year:r.year,kind:r.kind,...r.review.protectedDetermined}))));
  fs.writeFileSync(path.join(dir,'focus-2024-2031.csv'),keys.map(csv).join(',')+'\n'+lines.filter(r=>r.year>=2024&&r.year<=2031).map(r=>keys.map(k=>csv(r[k])).join(',')).join('\n')+'\n');
 }
 console.log('Full frozen profiles, luck boundaries and 1095 aligned before/after rows PASS; explained flips:',flips.length);
}
if(output)fs.writeFileSync(output,JSON.stringify(report));
console.log('Yun evidence, deterministic order, input boundaries and mutation checks PASS:',total,'rows');


const residuals=report.charts.flatMap(c=>c.rows.filter(r=>r.assessment==='unsupported'));
console.log('Coverage:',1095-residuals.length,'/ 1095; residual unsupported/pending:',residuals.length,'; target <= 5');
if(residuals.length>5){console.error('FAIL coverage acceptance: retain actual Y8 gaps; coverage target remains unmet');process.exitCode=1;}
