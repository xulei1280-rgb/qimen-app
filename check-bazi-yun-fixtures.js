'use strict';
// Legal theoretical charts and one-condition counterexamples; no personal-event truth labels.
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const ctx={console};vm.createContext(ctx);
vm.runInContext(fs.readFileSync('qimen.js','utf8'),ctx);
vm.runInContext(fs.readFileSync('bazi-engine.js','utf8').replace('root.BaziEngine=api;','root.__yun={flow:interactionFlowAnalysis,context:buildTemporalPatternContext,core:outlookCore,compare:compareOutlookContexts,god:outlookGod,restricted:outlookRootRestricted};root.BaziEngine=api;'),ctx);
const E=ctx.BaziEngine,R=ctx.__yun,gz=vm.runInContext('GZ60',ctx),stems='甲乙丙丁戊己庚辛壬癸',branches='子丑寅卯辰巳午未申酉戌亥',months='寅卯辰巳午未申酉戌亥子丑';
function legal(p){for(const g of Object.values(p))assert.ok(gz.includes(g),'illegal sexagenary pair '+g+' in '+JSON.stringify(p));assert.equal(stems.indexOf(p.month[0]),(2*(stems.indexOf(p.year[0])%5)+2+months.indexOf(p.month[1]))%10);assert.equal(stems.indexOf(p.hour[0]),(2*(stems.indexOf(p.day[0])%5)+branches.indexOf(p.hour[1]))%10);}
const seeds=[{year:'辛亥',month:'戊戌',day:'乙亥',hour:'丁亥'},{year:'甲子',month:'戊辰',day:'壬申',hour:'壬寅'},{year:'戊寅',month:'戊午',day:'辛丑',hour:'壬辰'},{year:'庚申',month:'己卯',day:'壬子',hour:'辛亥'},{year:'癸丑',month:'甲寅',day:'丙午',hour:'壬辰'},{year:'乙丑',month:'甲申',day:'己丑',hour:'丁卯'},{year:'戊申',month:'戊午',day:'辛酉',hour:'壬辰'},{year:'甲子',month:'丙子',day:'壬子',hour:'戊申'},{year:'辛酉',month:'甲午',day:'甲辰',hour:'戊辰'},{year:'癸酉',month:'癸亥',day:'己酉',hour:'丙寅'}];
E.forEachLegalFourPillar((p,m)=>{if(m.ordinal%97===0)seeds.push(p)},{yearCycleCount:4,monthBranchCount:12,dayCycleCount:10,hourBranchCount:4});
const found={},records=[];
function save(name,condition,record){if(condition&&!found[name]){found[name]=record;records.push({name,...record})}}
function task(result,id,side){return result.review[side+'Tasks'].find(t=>t.id===id)}
let pairs=0;
for(const pillars of seeds){
 legal(pillars);const contexts=[];const analysis=E.analyzePattern({pillars,dayStem:pillars.day[0],time:pillars.year==='戊寅'&&pillars.day==='辛丑'?{used:{year:1998,month:6,day:23,hour:8,minute:24}}:undefined}),base=R.context(pillars.day[0],pillars,analysis),frozenUseful=JSON.stringify(analysis.useful);
 for(let i=0;i<60;i++){
  const luck=gz[i],current=R.context(pillars.day[0],{...pillars,luck},analysis),result=R.compare(base,current,analysis),record={pillars,luck},events=result.review.layerEvidence.flat();pairs++;
  contexts.push({luck,current,core:R.core(current,analysis)});
  const has=(id,test=()=>true)=>events.some(e=>e.ruleId===id&&test(e));
  // Independent policy table: gain/loss × useful/avoid × generation/control.
  for(const e of events.filter(e=>e.ruleId==='Y5-role-action'||e.ruleId==='Y5-role-root')){
   const before=e.before.map(f=>f.key),after=e.after.map(f=>f.key),gained=e.after.filter(f=>!before.includes(f.key)),lost=e.before.filter(f=>!after.includes(f.key));
   assert.ok((gained.length>0)!==(lost.length>0),'replacement actors are not two independent votes');
   const adverse=e.taskId.includes('忌'),control=e.ruleId==='Y5-role-action'&&e.taskId.includes('制');
   const beneficial=adverse===control;
   assert.equal(e.direction,(gained.length?beneficial:!beneficial)?'positive':'negative','Y5 action sign must follow the fixed role and actual gain/loss, independent of verdict labels');
  }
  if(result.direction==='mixed')for(const pos of result.evidence.filter(e=>e.direction==='positive'))for(const neg of result.evidence.filter(e=>e.direction==='negative'))assert.ok(pos.ruleId!==neg.ruleId||pos.taskId!==neg.taskId||JSON.stringify(pos.before)!==JSON.stringify(neg.before)||JSON.stringify(pos.after)!==JSON.stringify(neg.after),'one same-cause delta cannot manufacture mixed');
  for(const root of current.strengthScore.dimensions.roots.items||[])if(root.usable!==false&&!root.transformedAway&&!root.boundByCombine&&(root.attacks||[]).length&&(root.attacks||[]).every(a=>/刑|害|破/.test(a)))assert.equal(R.restricted(root),false,'nominal secondary relations alone do not remove an actual usable root');

  const protection=result.review.protectedDetermined;
  if(protection&&protection.decision==='preserved')assert.equal(result.direction,protection.direction,'lower or uncertified candidate cannot replace a determined result');
  save('protected-determined-against-lower-rule',protection&&protection.decision==='preserved'&&protection.candidateDirection&&protection.candidateDirection!==protection.direction&&protection.candidatePriority>=protection.oldPriority,{...record,oldDirection:protection&&protection.direction,candidateDirection:protection&&protection.candidateDirection,oldPriority:protection&&protection.oldPriority,candidatePriority:protection&&protection.candidatePriority});

  save('generate-primary',has('Y5-role-action',e=>e.level==='Y5-primary'&&e.taskId.includes('生喜用')),record);
  save('control-primary',has('Y5-role-action',e=>e.level==='Y5-primary'&&e.taskId.includes('制喜用')),record);
  save('promoted-primary-keeps-luck-guard',!!analysis.useful.decision.promotedPrimary?.length&&has('Y5-role-root',e=>e.level==='Y5-secondary-avoid'&&e.taskId.includes('喜用')),record);
  save('avoid-generated',has('Y5-role-action',e=>e.taskId.includes('生忌')),record);
  save('avoid-controlled',has('Y5-role-action',e=>e.taskId.includes('制忌')),record);
  save('medicine-restored',has('Y3-medicine',e=>e.direction==='positive'),record);
  save('medicine-damaged',has('Y3-medicine',e=>e.direction==='negative'),record);
  save('partial-medicine-not-cure',current.patternDisease.items.some(d=>d.status==='部分化解'&&d.medicines.some(m=>m.rank>0&&m.steps.some(s=>s.active))),record);
  const previous=gz[(i+59)%60],prior=R.context(pillars.day[0],{...pillars,luck:previous},analysis),transition=R.compare(prior,current,analysis),transitionRecord={...record,previous};
  save('required-path-rescued',transition.review.layerEvidence.flat().some(e=>e.ruleId==='Y3-required-path'&&e.direction==='positive'),transitionRecord);
  const left=task(transition,'handle-kill','before'),right=task(transition,'handle-kill','after');
  const activePaths=side=>transition.review[side+'Tasks'].filter(t=>['food-kill','kill-seal','blade-kill','hurt-kill'].includes(t.id)&&t.state===1).map(t=>t.id);
  save('alternate-killing-path',left&&right&&left.state===1&&right.state===1&&JSON.stringify(activePaths('before'))!==JSON.stringify(activePaths('after'))&&!transition.evidence.some(e=>e.taskId==='food-kill'&&e.direction==='negative'),transitionRecord);
  save('required-path-damaged',has('Y3-required-path',e=>e.direction==='negative'),record);
  save('required-path-rescued',has('Y3-required-path',e=>e.direction==='positive'),record);
  const roots=current.strengthScore.dimensions.roots.items||[],restricted=roots.filter(R.restricted),clean=roots.filter(r=>r.usable!==false&&!r.transformedAway&&!R.restricted(r));
  save('root-bound-with-alternative',restricted.length>0&&clean.length>0,record);
  save('root-bound-without-alternative',restricted.length>0&&!clean.length,record);
  save('nominal-harm-not-root-loss',roots.some(r=>r.usable!==false&&!r.transformedAway&&!r.boundByCombine&&(r.attacks||[]).length&&(r.attacks||[]).every(a=>/刑|害|破/.test(a))&&!R.restricted(r)),record);
  const gods=['比肩','劫财','正印','偏印','正财','偏财','正官','七杀','食神','伤官'].map(g=>R.god(current,[g]));
  save('internal-control-with-bridge',gods.some(g=>g.internal.some(x=>/有透清通根|另有未损根/.test(x))),record);
  save('internal-control-without-bridge',gods.some(g=>g.internal.length&&g.uncertain&&g.internal.some(x=>/未见可用通关/.test(x))),record);
  save('transformed-actor-alternate-demand',current.interactions.stemCombines.some(x=>x.active!==false&&x.effect==='transform')&&result.assessment==='determined'&&result.evidence.some(e=>e.before&&e.after&&e.direction!=='neutral'),record);
  save('independent-same-layer-conflict',result.direction==='mixed'&&result.evidence.some(e=>e.direction==='positive')&&result.evidence.some(e=>e.direction==='negative'),record);
  save('verified-continuity',result.direction==='neutral'&&result.evidence.every(e=>e.before&&e.after),record);
  save('Y8-actor-gap',result.assessment==='unsupported'&&result.residualCode&&result.missingFields.length&&result.knownFacts.length,record);
 }
 assert.equal(JSON.stringify(analysis.useful),frozenUseful,'temporal arbitration cannot change the original useful-role ledger');
 if(!found['alternate-killing-path']){
  function route(x,seal){
   const c=x.current,chain=seal?[{from:['七杀'],to:['正印','偏印'],action:'生'},{from:['正印','偏印'],to:['日主'],action:'生'}]:[{from:['食神'],to:['七杀'],action:'制'}];
   const steps=R.flow('',c.profiles,c.interactions,[],chain).steps;
   const god=R.god(c,seal?['正印','偏印']:['食神']);
   return god.usable&&!god.uncertain&&steps.length===chain.length&&steps.every(s=>s.active)?steps:null;
  }
  for(const a of contexts)for(const b of contexts){
   if(found['alternate-killing-path']||!route(a,false)||route(a,true)||route(b,false)||!route(b,true)||JSON.stringify([R.god(a.current,['七杀']).stems,R.god(a.current,['七杀']).dims])!==JSON.stringify([R.god(b.current,['七杀']).stems,R.god(b.current,['七杀']).dims]))continue;
   const r=R.compare(a.current,b.current,analysis);
   save('alternate-killing-path',!r.evidence.some(e=>e.taskId==='food-kill'&&e.direction==='negative'),{pillars,luck:b.luck,previous:a.luck,foodBefore:route(a,false),sealAfter:route(b,true),scope:'实际局部药路替代；不把可达链升级为整格或食杀轻重已定',killPressure:R.god(a.current,['七杀']).facts,unresolvedTasks:r.review.afterTasks.filter(t=>t.state===null).map(t=>t.id)});
  }
  const working=contexts.filter(x=>x.core.tasks.some(t=>t.id==='handle-kill'&&t.state===1));
  function paths(x){return x.core.tasks.filter(t=>['food-kill','kill-seal','blade-kill','hurt-kill'].includes(t.id)&&t.state===1).map(t=>t.id).join(',')}
  for(const a of working)for(const b of working){
   if(paths(a)===paths(b)||JSON.stringify([R.god(a.current,['七杀']).stems,R.god(a.current,['七杀']).dims])!==JSON.stringify([R.god(b.current,['七杀']).stems,R.god(b.current,['七杀']).dims]))continue;
   const r=R.compare(a.current,b.current,analysis);
   save('alternate-killing-path',!r.evidence.some(e=>e.taskId==='food-kill'&&e.direction==='negative'),{pillars,luck:b.luck,previous:a.luck,pathsBefore:paths(a),pathsAfter:paths(b),killPressure:R.god(a.current,['七杀']).facts});
  }
 }
}
// Threshold-only mutation starts with legal native facts and alters no actor, root or path.
const p=seeds[1],a=E.analyzePattern({pillars:p,dayStem:p.day[0]}),b=R.context(p.day[0],p,a),changed={...b,strength:b.strength==='强'?'偏弱':'强'},numeric=R.compare(b,changed,a);
assert.ok(['neutral','pending'].includes(numeric.direction),'threshold-only label changes cannot produce a directional verdict');
assert.ok(!numeric.review.layerEvidence.flat().some(e=>e.ruleId==='Y3-medicine'||e.ruleId==='Y3-required-path'||e.ruleId==='Y5-role-root'),'numeric label changes cannot create physical medicine/role changes');
const n=found['verified-continuity'];assert.ok(n,'need a real nonempty continuity witness');const na=E.analyzePattern({pillars:n.pillars,dayStem:n.pillars.day[0]}),nc=R.context(n.pillars.day[0],{...n.pillars,luck:n.luck},na),same=R.compare(nc,nc,na);assert.equal(same.direction,'neutral');assert.equal(E.evaluateLuckOutlook({pillars:p,dayStem:p.day[0]},'甲甲',null,[]).natal.assessment,'input-error');assert.equal(E.evaluateLuckOutlook({pillars:p,dayStem:p.day[0]},'甲子',null,[]).previous.direction,'unavailable');
// Temporal receiving guard: a real ordinary day combine remains a recipient; contest does not.
const receivingPillars={year:'癸酉',month:'癸亥',day:'己酉',hour:'丙寅'};legal(receivingPillars);
const receivingAnalysis=E.analyzePattern({pillars:receivingPillars,time:{used:{year:1993,month:11,day:24,hour:4,minute:11}}});
const originalMedicine=JSON.stringify(receivingAnalysis.patternDisease);
const receivingBase=R.context('己',{...receivingPillars,luck:'甲寅'},receivingAnalysis);
const receivingYear=R.context('己',{...receivingPillars,luck:'甲寅',flowYear:'辛丑'},receivingAnalysis,{outlookFlowYear:true});
assert.equal(receivingYear.interactions.dayMaster.effect,'daymaster-combine');assert.equal(receivingYear.interactions.dayMaster.usable,true);
assert.ok(receivingYear.interactions.stemCombines.some(x=>x.effect==='daymaster-combine'&&x.dayTransformQualification.eligible===false));
const receivingResult=R.compare(receivingBase,receivingYear,receivingAnalysis),support=receivingResult.review.checked.find(x=>x.subject==='承载不足实际扶身');
assert.ok(support.before.some(x=>x.left.text==='丙正印')&&support.after.some(x=>x.left.text==='丑藏己比肩'),'ordinary combine receives the real old/new support actors, not a fabricated transformed actor');
const contested=R.context('己',{...receivingPillars,luck:'甲寅',flowYear:'己亥'},receivingAnalysis,{outlookFlowYear:true});
assert.equal(contested.interactions.dayMaster.effect,'contest');assert.equal(contested.interactions.dayMaster.usable,false);
assert.ok(R.compare(receivingBase,contested,receivingAnalysis).review.layerEvidence.flat().some(e=>e.ruleId==='Y3-carry-support'&&e.direction==='negative'),'actual contest still restricts the support, unlike ordinary day combine');
assert.equal(JSON.stringify(receivingAnalysis.patternDisease),originalMedicine,'temporal receiving guard never edits natal medicine ranks');
const required=['protected-determined-against-lower-rule','generate-primary','control-primary','promoted-primary-keeps-luck-guard','avoid-generated','avoid-controlled','medicine-restored','medicine-damaged','partial-medicine-not-cure','alternate-killing-path','required-path-damaged','required-path-rescued','root-bound-with-alternative','root-bound-without-alternative','nominal-harm-not-root-loss','internal-control-with-bridge','internal-control-without-bridge','transformed-actor-alternate-demand','independent-same-layer-conflict','verified-continuity','Y8-actor-gap'];
const missing=required.filter(name=>!found[name]);
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify({pairs,legalCharts:seeds.length,found:records,missing,thresholdOnly:{pillars:p,direction:numeric.direction},invalidUnavailable:true},null,2));
assert.deepEqual(missing,[],'every requested minimal rule family needs a real legal witness');
console.log('Yun fixtures PASS:',required.length,'rule families + threshold-only / invalid / unavailable;',pairs,'legal temporal pairs');
