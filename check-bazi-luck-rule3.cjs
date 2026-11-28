const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const { load } = require('./check-bazi-luck-state-change.cjs');

const baseline = '0d38b68';
const version = 'luck-outlook-20261128.6';
const oldVersion = 'luck-outlook-20261128.5';
const before = load();
const after = load();
const engine = path.join(__dirname,'bazi-engine.js');
const oldSource = execFileSync('git',['show',baseline+':bazi-engine.js'],{
  cwd:__dirname,encoding:'utf8',maxBuffer:4*1024*1024
});
const audit = 'root.rule3={recurrenceContact,annualRecurrence,yearLuckRelations,settleAnnualLedger,buildTemporalPatternContext};';
function withScenarioLedgers(source) {
  const seam='actionLedger:rows,wealthRange:W,comprehensiveRange:B';
  assert(source.includes(seam),'Annual scenario audit seam');
  return source.replace(seam,'scenarioLedgers:contexts.map(function(x){return x.result.ledger;}),'+seam);
}
vm.runInContext(withScenarioLedgers(oldSource),before);
vm.runInContext(withScenarioLedgers(fs.readFileSync(engine,'utf8')).replace('root.BaziEngine=api;',audit+'root.BaziEngine=api;'),after);
const E = after.BaziEngine;
const same = (a,b,label) => assert.equal(JSON.stringify(a),JSON.stringify(b),label);
const unchanged = (a,b,label) => assert.equal(JSON.stringify(a)?.replaceAll(version,oldVersion),JSON.stringify(b),label);
const ledgers = r => r.actionLedger.filter(x => x.contribution || x.wealthContribution || x.tomb);
const data = r => ({
  B:r.comprehensiveRange,W:r.wealthRange,net:r.effectiveRange,pending:r.effectiveRange.pending,
  scenarios:r.scenarios.map(x=>({B:x.B,W:x.W,net:x.appliedTotal,replacementStates:x.replacementStates,retainedRoots:x.retainedRoots})),
  rows:r.actionLedger.filter(x=>x.magnitude||x.contribution||x.wealthContribution||x.tomb||/^T-year-/.test(x.ruleId)).map(x=>({
    rule:x.ruleId,task:x.taskId,side:x.side,tier:x.magnitude,B:x.contribution,W:x.wealthContribution,
    actors:x.action,preMerge:x.eventKeys,postMerge:x.ownedEventKeys,mergedInto:x.mergedInto,
    mergedTomb:x.mergedTomb,tomb:x.tomb,exclusion:x.exclusion
  })),
  recurrence:r.recurrence
});
const rowYear = (year,prior) => ({year,gz:E.getFlowYearGZ(year),previous:prior&&{
  year:year-1,gz:E.getFlowYearGZ(year-1),luckGz:prior
}});
function profile(context,[year,month,day,hour,minute,gender],solar) {
  return context.BaziEngine.createBaziProfile({input:{year,month,day,hour,minute},gender,useTrueSolar:solar,useDaylightSaving:false,
    location:solar?{name:'师宗',lng:103.9936,lat:24.8222}:{name:'北京',lng:116.4074,lat:39.9042}});
}
function compareChart(input,decades,solar=false,singles=false) {
  const oldProfile = profile(before,input,solar), newProfile = profile(after,input,solar);
  same(newProfile,oldProfile,'Birth chart');
  const cycles = after.getLuckData(newProfile).rows.slice(0,decades);
  same(cycles,before.getLuckData(oldProfile).rows.slice(0,decades),'Decades');
  return cycles.flatMap((row,i) => {
    const prior=cycles[i-1]?.gz||null;
    const years=Array.from({length:10},(_,j)=>rowYear(row.startYear+j,j?row.gz:prior));
    const old=before.BaziEngine.evaluateLuckOutlook(oldProfile,row.gz,prior,years);
    const next=E.evaluateLuckOutlook(newProfile,row.gz,prior,years);
    assert.equal(next.ruleVersion,version);
    for (const field of ['natal','previous','wealth']) unchanged(next[field],old[field],'Four/five-pillar '+field);
    return next.years.map((current,j) => {
      if (singles) same(current,E.evaluateLuckOutlook(newProfile,row.gz,prior,[years[j]]).years[0],'Single/batch '+current.year);
      for (const field of ['increment','previousYear']) unchanged(current[field],old.years[j][field],field);
      return {before:old.years[j],after:current,luck:row.gz,pillars:newProfile.pillars};
    });
  });
}
const focus = [
  ['老王',[1994,7,29,10,0,'女'],false,[2030,2036,2037,2041,2042,2046]],
  ['小蔓',[1998,6,23,9,30,'女'],true,[2024,2027,2029,2032,2034,2038]],
  ['香肠',[1993,12,13,8,5,'男'],true,[2024,2030,2034,2038,2039,2042]]
];
const references=focus.map(([name,input,solar,years]) => {
  const all=compareChart(input,10,solar,true);
  assert.equal(all.length,100);
  return {name,rows:all.filter(r=>years.includes(r.after.year))};
});
const reference=(name,year)=>references.find(r=>r.name===name).rows.find(r=>r.after.year===year);
const ref=(name,year)=>reference(name,year).after;
const booked=(r,rule,amount)=>r.actionLedger.some(x =>
  x.ruleId===rule && (x.side==='negative'?-1:1)*x.contribution===amount);
const net=r=>r.effectiveRange.guaranteed;
for (const [name,year,expected] of [
  ['老王',2030,-5],['老王',2036,-1],['老王',2037,0],['老王',2041,-4],['老王',2042,-1],['老王',2046,-2],
  ['小蔓',2024,3],['小蔓',2032,-4],['小蔓',2034,-4],['小蔓',2038,-1],
  ['香肠',2024,-1],['香肠',2030,2.5],['香肠',2034,-1],['香肠',2038,5],['香肠',2039,3.5],['香肠',2042,0.5]
]) assert.equal(net(ref(name,year)),expected,name+' '+year);
assert(ref('小蔓',2027).effectiveRange.pending);
const mixed2029=ref('小蔓',2029);
assert(mixed2029.effectiveRange.pending&&!mixed2029.recurrence.preMerge.length);
same(mixed2029.scenarios.map(x=>x.appliedTotal),[-1,1,3],'小蔓 2029 replacement scenarios');
assert.equal(mixed2029.wealthRange.guaranteed,0);
assert.equal(ref('香肠',2030).wealthRange.guaranteed,2);
assert.equal(ref('香肠',2039).wealthRange.guaranteed,-2);
assert.equal(ref('香肠',2042).wealthRange.guaranteed,-2);
assert(booked(ref('老王',2041),'Y3-medicine',-1));
assert(booked(ref('老王',2041),'T-year-tkdc',-3));
same(ref('老王',2041).actionLedger.find(x=>x.ruleId==='Y3-medicine'&&x.contribution).ownedEventKeys.map(JSON.parse),[
  ['negative','hour:巳藏丙:火','day:丙:火','扶'],
  ['negative','year:甲:木','day:丙:火','生']
],'老王 2041 medicine keeps its own actors');
const deeper=ref('老王',2041).recurrence.postMerge.find(x=>x.contribution===3);
same([deeper.action,deeper.rootPowerBefore,deeper.rootPowerAfter,deeper.supportBefore,deeper.supportAfter],
  [['flowYear:酉','luck:卯藏乙:木','branch-冲'],0.46,0.36,32.1,26],'老王 2041 new branch injury');
assert(booked(ref('小蔓',2032),'Y3-required-path',-2));
assert(booked(ref('老王',2046),'Y6-natal-climate',-1));
const dual=ref('香肠',2042).recurrence;
same(dual.scenes.map(s=>[s.pillar,s.stemAction]),[
  ['day',['day:戊:土','flowYear:壬:水','制']],['hour',['flowYear:壬:水','hour:丙:火','制']]
],'Dual-target stem details');
assert(dual.postMerge.filter(x=>x.contribution).length<=1);

function pairedProfile(input,luck,year) {
  return Object.fromEntries([['before',before],['after',after]].map(([label,context])=>[
    label,context.BaziEngine.evaluateLuckOutlook(profile(context,input,false),luck,null,[rowYear(year)]).years[0]
  ]));
}
const summer2029=pairedProfile([1993,7,14,8,0,'男'],'乙卯',2029);
const wealthLock=summer2029.after;
assert(booked(wealthLock,'T-year-tkdc',-3));
assert(wealthLock.recurrence.postMerge.some(x=>x.contribution===3&&x.dualClash&&x.rootLoss==='luck:卯藏乙:木'));
assert(net(wealthLock)<=0);
assert.equal(wealthLock.wealthRange.guaranteed,0);
assert(wealthLock.wealth.reasons.some(x=>x.ruleId==='W-bridge-replacement'));
const pending2062=pairedProfile([1961,10,17,14,0,'男'],'戊子',2062);
const risk=pending2062.after;
assert(risk.effectiveRange.pending&&!risk.annual.amplitude.available&&risk.annual.amplitude.net===null);
assert(risk.annual.evidence.some(x=>x.recurrenceHint&&x.ruleId==='T-year-tkdc'&&x.direction==='negative'));
assert(!risk.recurrence.postMerge.some(x=>x.contribution),'Risk disclosure is independent of B');

const { recurrenceContact,annualRecurrence,yearLuckRelations,settleAnnualLedger,buildTemporalPatternContext }=after.rule3;
function fixture(text,luck,year) {
  const [yp,month,day,hour]=text.split(' ');
  const pillars={year:yp,month,day,hour};
  const person={pillars,dayStem:day[0]};
  const analysis=E.analyzePattern(person),flowYear=E.getFlowYearGZ(year);
  const background=buildTemporalPatternContext(day[0],{...pillars,luck},analysis);
  const current=buildTemporalPatternContext(day[0],{...pillars,luck,flowYear},analysis,{outlookFlowYear:true});
  const row=E.evaluateLuckOutlook(person,luck,null,[rowYear(year)]).years[0];
  const priorRow=before.BaziEngine.evaluateLuckOutlook(person,luck,null,[rowYear(year)]).years[0];
  return {analysis,pillars,background,current,row,priorRow};
}
const proofFor=(r,rule,side)=>r.recurrence?.preMerge.find(p=>p.ruleId===rule&&p.side===side);
const signs=(r,rule)=>r.actionLedger.filter(x=>x.ruleId===rule&&x.contribution).map(x=>x.side);

// 1. Captured disease and carrying effects survive recurrence without extra charges.
const controlled=ref('香肠',2039), dry=ref('老王',2046), loadYear=ref('小蔓',2034);
assert(controlled.recurrence.scenes.some(x=>x.ruleId==='T-year-same'));
assert(booked(controlled,'W-peer',-2)&&!signs(controlled,'T-year-same').length);
assert(booked(loadYear,'Y3-carry-load',-2)&&booked(loadYear,'Y3-earth-metal',-2));
for (const x of [dry,loadYear]) assert(!signs(x,'T-year-same').length);
const repeatedKilling=fixture('己酉 癸酉 己亥 戊辰','乙卯',2035);
assert(repeatedKilling.row.recurrence.scenes.some(x=>x.ruleId==='T-year-same'));
assert(yearLuckRelations(repeatedKilling.analysis,repeatedKilling.pillars,'乙卯','乙卯')
  .some(x=>x.ruleId==='T-year-same'&&x.direction==='negative'),'Legacy no-context signature');
const repeatedProof=proofFor(repeatedKilling.row,'T-year-same','negative');
assert(repeatedProof?.reach&&repeatedProof.capacityLoss&&repeatedProof.substitute===false,
  'A repeated 七杀 requires its own reachable action and actual harm');

// 2. Exact 击伤 and relief, including non-weak harm and a weak counterexample.
const dayInjury=fixture('甲午 庚午 甲辰 辛未','戊辰',1970), killed=dayInjury.row;
assert(proofFor(killed,'T-year-natal-tkdc','negative')?.capacityLoss,'Day-pillar killing has verified carrying loss');
const injured=fixture('己酉 辛未 辛丑 己亥','乙酉',2011);
assert(!/弱/.test(injured.analysis.strength));
const injury=proofFor(injured.row,'T-year-tkdc','negative');
assert(injury?.reach&&injury.activeRole&&injury.pathLost.length&&injury.substitute===false&&injury.tier===2);
const relieve=fixture('戊午 癸亥 己亥 癸酉','丙申',2010);
assert.match(relieve.analysis.strength,/弱/);
const relief=proofFor(relieve.row,'T-year-tkdc','positive');
assert(relief?.taboo&&relief.relieved&&relief.protectionIntact&&relief.capacityIntact,'Weak relief needs the exact relieved actor');
const weakened={...relieve.current,carryingCapacity:{...relieve.current.carryingCapacity,
  usableRootPower:relieve.background.carryingCapacity.usableRootPower-0.1}};
assert(!annualRecurrence(relieve.background,weakened,relieve.analysis,relieve.row.annual)
  .proofs.some(x=>x.scene==='luck'&&x.side==='positive'),'The same taboo hit cannot excuse actual carrying damage');

// 3. A standalone 日犯岁君 is a clue. Day-pillar counter-clash keeps existing carrying damage.
const standaloneDayHit=fixture('庚戌 丙戌 丙寅 丁酉','甲申',1990), dayHit=standaloneDayHit.row;
assert.equal(net(dayHit),0);
assert(dayHit.actionLedger.some(x=>x.ruleId==='T-year-dayhit'&&!x.contribution));
const dayClash=ref('老王',2030);
assert(dayClash.recurrence.scenes.some(x=>x.pillar==='day'&&x.kind==='clash'&&x.stemAction[0]==='day:丙:火'));
assert(booked(dayClash,'Y3-carry-load',-2)&&booked(dayClash,'Y4-output-load',-2));

// 4. A branch part owned in the scenario stays owned at either recurrence tier.
const branchHarm=['flowYear:戌','luck:辰藏癸:水','branch-冲'];
const direct=['flowYear:庚:金','luck:甲:木','制'];
const tombGroup={id:'flowYear/luck|冲',keys:['flowYear','luck'],parts:[
  {key:['flowYear',branchHarm[1],'冲','暗伤'],value:-1,reason:'原有根失用'},
  {key:['luck','flowYear:戌藏辛:金','冲','冲开'],value:1,reason:'开财库'}
]};
const priority={ruleId:'Y3-medicine',taskId:'必要根受损',direction:'negative',text:'实伤',annualMagnitude:2,
  action:{sourceKeys:[branchHarm[0]],targetKeys:[branchHarm[1]],mediatorKeys:[],events:[branchHarm]}};
for (const tier of [1,2]) {
  const shared={scene:'luck',ruleId:'T-year-tkdc',key:JSON.stringify(direct),action:direct,side:'positive',
    tier,text:'冲克复核',aliases:[branchHarm],consequence:'同一根'};
  const result=settleAnnualLedger({evidence:[]},{entries:[]},[priority],{
    pillars:{day:'辛丑'},annualTomb:{groups:[tombGroup]}
  },{recurrence:{proofs:[shared]}});
  assert.equal(result.sums.B,-1);
  assert.equal(result.recurrenceActions[0].contribution,0);
  assert.equal(result.ledger[0].contribution,2);
  same(result.tombEntries[0].tomb.parts.map(p=>[p.value,p.coveredBy]),[[0,'Y3-medicine'],[1,null]],'Tomb overlap by action');
}
for (const tier of [1,2,3]) {
  const proof={scene:'luck',ruleId:'T-year-tkdc',key:JSON.stringify(branchHarm),action:branchHarm,
    side:'negative',tier,text:'冲克复核',aliases:[],consequence:branchHarm[1]};
  const context={pillars:{day:'辛丑'},annualTomb:{groups:[tombGroup]}};
  const result=settleAnnualLedger({evidence:[]},{entries:[]},[],context,{recurrence:{proofs:[proof]}});
  const qualifies=tier>=2;
  assert.equal(result.recurrenceActions[0].contribution,qualifies?tier:0);
  assert.equal(result.sums.B,qualifies?1-tier:0);
  same(result.tombEntries[0].tomb.parts.map(p=>[p.value,p.coveredBy]),
    [qualifies?[0,'T-year-tkdc']:[-1,null],[1,null]],'Only a booked Tier 2+ clash takes negative tomb ownership');
  const occupied=settleAnnualLedger({evidence:[]},{entries:[]},[priority],context,{recurrence:{proofs:[proof]}});
  assert.equal(occupied.recurrenceActions[0].coveredBy,'Y3-medicine');
  same(occupied.tombEntries[0].tomb.parts.map(p=>[p.value,p.coveredBy]),[[0,'Y3-medicine'],[1,null]],
    'Regular action owner keeps priority');
}
const multi=dual.scenes.map((s,i)=>({scene:s.pillar,ruleId:s.ruleId,action:s.stemAction,key:JSON.stringify(s.stemAction),
  tier:2,side:'negative',text:'测试受作用者 '+i,aliases:[],consequence:s.pillar}));
const reverse={...multi[0],side:'positive'};
const multiResult=settleAnnualLedger({evidence:[]},{entries:[]},[],{pillars:{day:'戊辰'}},
  {recurrence:{proofs:[...multi,reverse]}});
assert.equal(multiResult.sums.B,-2);
same(multiResult.recurrenceActions.map(x=>[x.scene,x.contribution,x.exclusion]),
  [['day',2,null],['hour',0,'same-year-tier'],['day',0,'same-action']],'Two targets preserve their proof without multiplying the tier');
const natalBranch=['flowYear:戌','month:辰藏癸:水','branch-冲'];
const natalPath=[natalBranch[1],'day:辛:金','扶'];
const natalTomb={id:'flowYear/month|冲',keys:['flowYear','month'],parts:[
  {key:['flowYear',natalBranch[1],'冲','暗伤'],value:-1,reason:'墓根受损'}
]};
const natalProof={scene:'month',ruleId:'T-year-natal-tkdc',key:JSON.stringify(natalBranch),action:natalBranch,
  side:'negative',text:'月支实损',aliases:[],consequence:natalBranch[1]};
for(const [tier,paths,expected] of [[1,[],0],[2,[],0],[2,[natalPath],2]]){
  const result=settleAnnualLedger({evidence:[]},{entries:[]},[],{pillars:{day:'辛丑'},annualTomb:{groups:[natalTomb]}},
    {recurrence:{proofs:[{...natalProof,tier,pathLost:paths}]}});
  assert.equal(result.recurrenceActions[0].contribution,expected);
  assert.equal(result.tombEntries[0].tomb.parts[0].value,-1);
  if(expected)assert(result.ledger.some(x=>x.ownedEventKeys.includes(JSON.stringify(['negative',...natalPath]))));
}

// 5. Idle repetition and an untriggered luck-clash remain neutral.
const idleYear=fixture('庚戌 丙戌 丙寅 丁酉','甲申',1986), idle=idleYear.row;
const ongoingYear=fixture('丙申 辛卯 己亥 甲戌','癸巳',2032), ongoing=ongoingYear.row;
assert.equal(net(idle),0);
assert.equal(net(ongoing),0);
assert(idle.recurrence.scenes.some(x=>x.kind==='same'&&x.pillar==='day')&&!idle.recurrence.preMerge.length);
assert(!ongoing.recurrence.scenes.length&&ongoing.recurrence.ongoing.some(x=>x.kind==='clash'));
assert(ongoing.annual.evidence.some(x=>x.ruleId==='T-luck-recurrence'&&x.direction==='neutral'));
for(const rows of [ongoing.actionLedger,ongoing.annual.amplitude.breakdown])
  assert(!rows.some(x=>x.ruleId==='T-luck-recurrence'));

let natal=0;
E.forEachLegalFourPillar((pillars,meta)=>{
  if (meta.yearIndex<2 || meta.dayIndex<30 || meta.hourIndex!==meta.dayIndex%4) return;
  same(E.analyzePattern({pillars}),before.BaziEngine.analyzePattern({pillars}),meta.key);
  natal++;
},{yearCycleCount:4,monthBranchCount:12,dayCycleCount:60,hourBranchCount:4,validateUnique:false});
assert.equal(natal,720);

const stats={
  years:0,changedB:0,changedW:0,changedPending:0,changedDirection:0,flips:0,
  unsignedKeyDup:0,sameEventSignFlip:0,swallowedHighTier:0,erasedPositiveTomb:0,
  noNewEventDrift:0,changedSpecial:0,outputDoubleBooked:0,sameEventCoreConflict:0,erasedY4:0,satNeg:0
};
const highTierChanges=[];
const counts={};
function count(name,items) {
  const current=counts[name] ||= {years:0,pillarSlots:0};
  current.years+=Number(items.length>0);
  current.pillarSlots+=items.length;
}
const signature=x=>JSON.stringify([x.ruleId,x.taskId,x.side,x.text]);
const unsigned=k=>JSON.stringify(JSON.parse(k).slice(1));
const positiveTomb=r=>r.actionLedger.flatMap(x=>(x.tomb?.parts||[]).filter(p=>p.value>0).map(p=>[p.key,p.value]));
const wealthOpening=r=>r.actionLedger.filter(x=>x.wealthContribution&&x.side==='positive'&&x.mergedTomb?.length)
  .map(x=>[x.ruleId,x.taskId,x.wealthContribution]);
const high=/^(Y[234]-|W-|LK-)/;
const recurrenceRule=/^T-year-(?:natal-)?(?:same|tkdc)$/;
const regularPaid=rows=>rows.filter(x=>!x.tomb&&!recurrenceRule.test(x.ruleId)&&(x.contribution||x.wealthContribution))
  .map(x=>[x.ruleId,x.taskId,x.side,x.magnitude,x.contribution,x.wealthContribution,x.ownedEventKeys]);
const outputExcess=/^(水多金沉|木盛水缩|火多木焚|土多火晦|金多土变)$/;
function auditYear(old,r,pillars,luck,label) {
  const scenes=r.recurrence?.scenes||[], ongoing=r.recurrence?.ongoing||[], post=r.recurrence?.postMerge||[];
  const bookedRows=ledgers(r);
  const raw=Object.entries({...pillars,luck}).flatMap(([pillar,gz])=>{
    const kind=recurrenceContact(r.gz,gz);
    return kind?[{pillar,kind}]:[];
  });
  count('rawAnnual',raw);
  count('rawNatalClash',raw.filter(s=>s.kind==='clash'&&s.pillar!=='luck'));
  count('rawNatalSame',raw.filter(s=>s.kind==='same'&&s.pillar!=='luck'));
  count('annual',scenes);
  count('annualClash',scenes.filter(s=>s.kind==='clash'&&s.pillar!=='luck'));
  count('annualSame',scenes.filter(s=>s.kind==='same'&&s.pillar!=='luck'));
  count('luckYearClash',scenes.filter(s=>s.kind==='clash'&&s.pillar==='luck'));
  count('luckYearSame',scenes.filter(s=>s.kind==='same'&&s.pillar==='luck'));
  count('ongoingClash',ongoing.filter(s=>s.kind==='clash'));
  count('ongoingSame',ongoing.filter(s=>s.kind==='same'));
  for (const place of ['year','month','day','hour']) {
    count('annualClash.'+place,scenes.filter(s=>s.pillar===place&&s.kind==='clash'));
  }
  count('proved',scenes.filter(s=>post.some(p=>p.scene===s.pillar)));
  count('booked',scenes.filter(s=>post.some(p=>p.scene===s.pillar&&p.contribution)));
  count('provedLuckYearClash',scenes.filter(s=>s.kind==='clash'&&s.pillar==='luck'&&
    post.some(p=>p.scene===s.pillar)));
  count('provedNatalClash',scenes.filter(s=>s.kind==='clash'&&s.pillar!=='luck'&&
    post.some(p=>p.scene===s.pillar)));
  function changed(field){return JSON.stringify(old[field])!==JSON.stringify(r[field]);}
  stats.changedB+=Number(changed('comprehensiveRange'));
  stats.changedW+=Number(changed('wealthRange'));
  stats.changedPending+=Number(old.effectiveRange.pending!==r.effectiveRange.pending);
  stats.changedDirection+=Number(old.effectiveRange.direction!==r.effectiveRange.direction);
  stats.flips+=Number(net(old)*net(r)<0);
  if (!scenes.length&&(changed('effectiveRange')||changed('comprehensiveRange')||changed('wealthRange')||
    changed('scenarios')||changed('actionLedger')||changed('scenarioLedgers')||
    JSON.stringify(old.annual.amplitude.breakdown)!==JSON.stringify(r.annual.amplitude.breakdown))) stats.noNewEventDrift++;
  if (r.annual.review?.dynamicUse?.special&&JSON.stringify(ledgers(old))!==JSON.stringify(bookedRows)) stats.changedSpecial++;
  if (JSON.stringify(positiveTomb(r))!==JSON.stringify(positiveTomb(old))||
    JSON.stringify(wealthOpening(r))!==JSON.stringify(wealthOpening(old))) stats.erasedPositiveTomb++;
  const owners=new Map();
  for (const row of bookedRows) {
    if (!row.contribution&&!row.wealthContribution) continue;
    for (const key of row.ownedEventKeys) {
      const u=unsigned(key);
      if (!owners.has(u)) owners.set(u,[]);
      owners.get(u).push(row);
    }
  }
  same(r.scenarios.map(x=>[x.retainedRoots,x.replacementStates]),old.scenarios.map(x=>[x.retainedRoots,x.replacementStates]),
    label+' scenario assumptions');
  old.scenarioLedgers.forEach((rows,i)=>{
    const settlement=r.scenarioLedgers[i];
    same(regularPaid(settlement),regularPaid(rows),label+' regular paid rows, scenario '+i);
    const paid=settlement.filter(x=>x.contribution);
    for (const action of paid.filter(x=>x.action.effect==='recurrence')) {
      const keys=action.ownedEventKeys.map(unsigned);
      const duplicates=paid.filter(x=>x!==action&&x.ownedEventKeys.some(k=>keys.includes(unsigned(k))));
      stats.unsignedKeyDup+=Number(keys.length!==1||duplicates.length>0);
      stats.sameEventSignFlip+=Number(duplicates.some(x=>x.side!==action.side));
      assert([1,2,3].includes(action.contribution),label+' tier');
    }
    for (const x of rows.filter(x=>high.test(x.ruleId)&&Math.max(x.contribution,x.wealthContribution)>=2)) {
      const matching=settlement.filter(y=>signature(y)===signature(x));
      if (!matching.some(y=>y.contribution>=x.contribution&&y.wealthContribution>=x.wealthContribution)) {
        stats.swallowedHighTier++;
        highTierChanges.push({label,scenario:i,rule:x.ruleId,task:x.taskId,side:x.side,B:x.contribution,W:x.wealthContribution,
          matching:matching.map(y=>[y.contribution,y.wealthContribution,y.exclusion])});
        if (/^Y4-output/.test(x.ruleId)) stats.erasedY4++;
      }
    }
  });
  const main=bookedRows.filter(x=>x.contribution);
  if (main.some(x=>x.ruleId==='Y3-dynamic-phenomenon'&&outputExcess.test(x.taskId))&&
      main.some(x=>/^Y4-output(?:-load)?$/.test(x.ruleId))) stats.outputDoubleBooked++;
  if (main.some(x=>x.ruleId==='Y3-dynamic-core-harm'&&x.ownedEventKeys.some(k=>
    owners.get(unsigned(k)).some(y=>y.side==='positive')))) stats.sameEventCoreConflict++;
  if (r.annual.review?.dynamicUse?.capacity?.saturated&&main.some(x=>x.side==='negative'&&
    (x.ruleId==='Y3-carry-support'||x.ruleId==='Y3-replacement-medicine'&&/^承载不足/.test(x.taskId)||
    /满溢/.test(x.taskId)))) stats.satNeg++;
  assert(!r.actionLedger.some(x=>/^T-year-(fight|clash|harmony|dayhit)$/.test(x.ruleId)&&x.contribution),label+' hints only');
  for(const entries of [r.actionLedger,r.annual.amplitude.breakdown])
    assert(!entries.some(x=>x.ruleId==='T-luck-recurrence'),label+' ongoing hint stays out of ledger');
  stats.years++;
}
let seed=20261126;
function rand(n) {
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  return Math.floor(seed*n/2**32);
}
const rows=[];
const sampleProbes={};
const sampleExpectations={
  '3/1970':{net:1},'14/2024':{tier:3,root:'luck:戌藏辛:金'},'14/2011':{tier:3,root:'luck:酉藏辛:金'},
  '29/1968':{tier:3,root:'luck:寅藏甲:木'},'36/1978':{tier:3,root:'luck:子藏癸:水'},
  '98/2028':{tier:2,root:'luck:寅藏甲:木'}
};
for (let index=1;index<=120;index++) {
  const input=[1940+rand(85),1+rand(12),1+rand(28),rand(24),rand(60),index%2?'男':'女'];
  for (const r of compareChart(input,2)) {
    auditYear(r.before,r.after,r.pillars,r.luck,'#'+index+' '+r.after.year);
    const key=index+'/'+r.after.year;
    const record={index,input,pillars:r.pillars,year:r.after.year,luck:r.luck,before:data(r.before),after:data(r.after)};
    rows.push(record);
    const expected=sampleExpectations[key];
    if(!expected)continue;
    sampleProbes[key]=record;
    if(expected.root){
      assert(r.after.recurrence.preMerge.some(p=>p.ruleId==='T-year-tkdc'&&p.tier===expected.tier&&p.rootLoss===expected.root),key);
      assert(r.after.recurrence.postMerge.some(p=>p.contribution===expected.tier),key+' booked tier');
    }else{
      assert.equal(net(r.after),expected.net,key);
      assert(!r.after.recurrence.preMerge.length&&booked(r.after,'Y3-tomb',-1),key);
    }
    if(key==='14/2024'){
      assert(booked(r.after,'T-year-tkdc',-3)&&booked(r.after,'Y3-tomb',1));
      assert(r.after.actionLedger.some(x=>x.tomb?.parts.some(p=>p.coveredBy==='T-year-tkdc'&&p.value===0)));
    }
  }
}
assert.equal(stats.years,2400);
same(Object.keys(sampleProbes).sort(),Object.keys(sampleExpectations).sort(),'Named sample probes');
for (const [kind,years,pillarSlots] of [
  ['rawAnnual',507,544],['rawNatalClash',300,314],['rawNatalSame',111,114],
  ['luckYearClash',79,79],['luckYearSame',37,37],['ongoingClash',160,160],['ongoingSame',90,90]
]) assert.deepEqual(counts[kind],{years,pillarSlots},kind+' fixed cohort coverage');
const target=path.join(__dirname,'build','luck-rule3-20261128');
fs.mkdirSync(target,{recursive:true});
const probeComparisons=Object.fromEntries([
  ['controlled',reference('香肠',2039).before,controlled],
  ...Object.entries({uncheckedCandidate:repeatedKilling,nonWeakInjury:injured,dayInjury,
    tabooRelief:relieve,dayHit:standaloneDayHit,idle:idleYear,ongoing:ongoingYear})
    .map(([key,entry])=>[key,entry.priorRow,entry.row]),
  ['pending2062',pending2062.before,risk],['wealthReplacement2029',summer2029.before,wealthLock]
].map(([key,old,current])=>[key,{year:current.year,before:data(old),after:data(current)}]));
fs.writeFileSync(path.join(target,'annual-comparison.json'),JSON.stringify({
  version,baseline,seed:20261126,natal,stats,counts,highTierChanges,
  references:references.map(({name,rows})=>({name,rows:rows.map(r=>({
    year:r.after.year,luck:r.luck,pillars:r.pillars,before:data(r.before),after:data(r.after)
  }))})),
  probes:{controlled:data(controlled),uncheckedCandidate:data(repeatedKilling.row),nonWeakInjury:data(injured.row),
    dayInjury:data(killed),tabooRelief:{row:data(relieve.row),proof:relief},dayHit:data(dayHit),idle:data(idle),ongoing:data(ongoing),
    pending2062:data(risk),wealthReplacement2029:data(wealthLock)},probeComparisons,sampleProbes,rows
}));
console.log(JSON.stringify({stats,counts},null,2));
if(highTierChanges.length)console.log(JSON.stringify(highTierChanges));
for (const name of ['unsignedKeyDup','sameEventSignFlip','swallowedHighTier','erasedPositiveTomb','noNewEventDrift',
  'changedSpecial','outputDoubleBooked','sameEventCoreConflict','erasedY4','satNeg']) assert.equal(stats[name],0,name);
console.log('PASS 2,400 annual comparisons, 720 exact natal comparisons, 300 single/batch years and fixed probes');
