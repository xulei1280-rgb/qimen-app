const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const { load } = require('./check-bazi-luck-state-change.cjs');

const baseline = '07e2a96976d6b2532a0e2ef289672f51c342d848';
const version = 'luck-outlook-20261128.6';
const baselineVersion = 'luck-outlook-20261128.3';
const before = load();
const after = load();
function withScenarioLedgers(source) {
  const seam='actionLedger:rows,wealthRange:W,comprehensiveRange:B';
  assert(source.includes(seam),'Annual scenario audit seam');
  return source.replace(seam,'scenarioLedgers:contexts.map(function(x){return x.result.ledger;}),'+seam);
}
vm.runInContext(withScenarioLedgers(execFileSync('git', ['show', baseline + ':bazi-engine.js'], {
  cwd: __dirname, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024
})), before);
vm.runInContext(withScenarioLedgers(fs.readFileSync(path.join(__dirname, 'bazi-engine.js'), 'utf8')).replace(
  'root.BaziEngine=api;', 'root.rule2={decision:annualTombDecision,context:buildTemporalPatternContext,branch:branchInteractionChange,ledger:settleAnnualLedger,wealth:wealthChannelState};root.BaziEngine=api;'
), after);
const E = after.BaziEngine;
const same = (a, b, label) => assert.equal(JSON.stringify(a), JSON.stringify(b), label);
const baselineJson = item => JSON.stringify(item)?.replaceAll(version, baselineVersion);
function withoutOngoingHint({annual,recurrence,...row}) {
  const withoutHints=list=>list.filter(x=>x.ruleId!=='T-luck-recurrence');
  return {...row,annual:{...annual,evidence:withoutHints(annual.evidence),
    reservations:withoutHints(annual.reservations)}};
}

let seed = 20261126;
function rand(n) {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return Math.floor(seed * n / 2 ** 32);
}
function profile(context, [year, month, day, hour, minute, gender], solar = false) {
  return context.BaziEngine.createBaziProfile({
    input: { year, month, day, hour, minute }, gender, useTrueSolar: solar, useDaylightSaving: false,
    location: solar ? { name: '师宗', lng: 103.9936, lat: 24.8222 } : { name: '北京', lng: 116.4074, lat: 39.9042 }
  });
}
function rowYear(e, year, previous) {
  return { year, gz:e.getFlowYearGZ(year), previous: previous && {
    year:year - 1, gz:e.getFlowYearGZ(year - 1), luckGz:previous
  }};
}
function compareChart(input, decades, solar = false, singles = false) {
  const oldProfile = profile(before, input, solar);
  const newProfile = profile(after, input, solar);
  const cycles = after.getLuckData(newProfile).rows.slice(0, decades);
  same(cycles, before.getLuckData(oldProfile).rows.slice(0, decades), 'Decade boundaries');
  return cycles.flatMap((row, idx) => {
    const previous = cycles[idx - 1]?.gz || null;
    const inputs = Array.from({ length:10 }, (_, i) => rowYear(E, row.startYear + i, i ? row.gz : previous));
    const old = before.BaziEngine.evaluateLuckOutlook(oldProfile, row.gz, previous, inputs);
    const next = E.evaluateLuckOutlook(newProfile, row.gz, previous, inputs);
    assert.equal(next.ruleVersion, version);
    for (const field of ['natal','previous','wealth']) {
      assert.equal(baselineJson(next[field]), JSON.stringify(old[field]), 'Four/five-pillar snapshots: ' + field);
    }
    return next.years.map((year, i) => {
      if (singles) same(year, E.evaluateLuckOutlook(newProfile, row.gz, previous, [inputs[i]]).years[0], 'single vs batch');
      for (const field of ['increment','previousYear']) {
        assert.equal(baselineJson(year[field]), JSON.stringify(old.years[i][field]), 'Other comparison view: '+field);
      }
      return { before:old.years[i], after:year, luck:row.gz, pillars:newProfile.pillars };
    });
  });
}
function detail(year) {
  return {
    B:year.comprehensiveRange, W:year.wealthRange, total:year.effectiveRange,
    scenarios:year.scenarios.map(x => ({ B:x.B, W:x.W, net:x.appliedTotal })),
    ledger:year.actionLedger.filter(x => x.contribution || x.wealthContribution || x.tomb || x.mergedTomb).map(x => ({
      rule:x.ruleId, task:x.taskId, side:x.side, weight:x.magnitude, B:x.contribution, W:x.wealthContribution,
      owned:x.ownedEventKeys, exclusion:x.exclusion, mergedTomb:x.mergedTomb,
      tombMergedEvents:x.tombMergedEvents, tomb:x.tomb
    }))
  };
}
function probe(text, luck, year, weight) {
  const [yearPillar,month,day,hour] = text.split(' ');
  const pillars = {year:yearPillar,month,day,hour};
  const person = {pillars,dayStem:day[0]};
  const args = [person,luck,null,[rowYear(E,year,null)]];
  return E.evaluateLuckOutlook(...args,weight===undefined?undefined:{wealthExtraWeight:weight}).years[0];
}
const tombRows = result => result.actionLedger.filter(row => row.tomb);
const parts = result => tombRows(result).flatMap(row => row.tomb.parts);
const counted = (result, rule, side, tier) => result.actionLedger.some(row =>
  row.ruleId===rule&&row.side===side&&row.contribution===tier);
for (const [text,luck,year,actor,sign] of [
  ['丁卯 壬寅 乙酉 丙戌','甲辰',2009,'luck:辰藏戊:土',1],
  ['己丑 乙亥 丙辰 丁酉','丙子',1955,'flowYear:未藏己:土',-1],
  ['庚午 辛巳 丁巳 庚戌','己丑',2027,'luck:丑藏己:土',0]
]) {
  const result=probe(text,luck,year);
  assert(parts(result).some(x=>x.key[1]===actor&&x.key[3]==='土动'&&Math.sign(x.value)===sign));
  assert(!result.actionLedger.some(row=>row.ruleId==='T-natal-clash'&&row.contribution&&row.taskId.endsWith(':土')));
}
// The only visible metal is 庚, which must back 丑藏辛.
const goodWealth=probe('庚午 丁巳 丁巳 庚戌','己丑',2027);
const weakWealth=probe('庚申 辛酉 丁亥 庚戌','己丑',2027);
assert(parts(goodWealth).some(p=>p.key[1]==='luck:丑藏辛:金'&&p.key[3]==='冲开'&&p.value>0));
assert(parts(weakWealth).some(p=>p.key[1]==='luck:丑藏辛:金'&&p.key[3]==='冲开'&&p.value<0));
assert(goodWealth.actionLedger.some(r=>r.taskId==='冲开财库'&&r.wealthContribution===1&&r.contribution===0&&r.mergedTomb));
assert(!weakWealth.actionLedger.some(r=>r.taskId==='冲开财库'&&r.wealthContribution>0));
same(probe('庚午 丁巳 丁巳 庚戌','己丑',2027,0).effectiveRange,goodWealth.comprehensiveRange,'w=0 restores B');
const mixed=probe('丁亥 丁未 己酉 甲戌','乙巳',2021);
assert.equal(tombRows(mixed).length,1);
assert.equal(tombRows(mixed)[0].tomb.net,0);
assert(parts(mixed).some(p=>p.key[3]==='暗伤'&&p.value<0)&&parts(mixed).some(p=>p.key[3]==='冲开'&&p.value>0));
const shaped=probe('庚辰 戊寅 庚寅 壬午','己卯',1947);
const bound=probe('壬午 乙巳 庚申 丁丑','甲辰',1948);
assert(parts(shaped).some(p=>p.key[3]==='合化'));
assert(parts(bound).some(p=>p.key[3]==='合绊'&&p.reason.includes('合中逢冲')));
const punish=probe('甲戌 辛未 丙辰 癸巳','己丑',2021);
assert(tombRows(punish).some(r=>r.tomb.punishment)&&tombRows(punish).every(r=>r.contribution===0));

const {decision,context,branch,ledger:settleLedger,wealth}=after.rule2;
function tombContext(text,luck,year) {
  const [yearPillar,month,day,hour]=text.split(' ');
  const pillars={year:yearPillar,month,day,hour};
  const analysis=E.analyzePattern({pillars});
  const annual={...pillars,luck,flowYear:E.getFlowYearGZ(year)};
  const base=context(day[0],pillars,analysis);
  const plain=context(day[0],annual,analysis,{outlookFlowYear:true});
  const tomb=decision(base,plain,analysis);
  return {tomb,projected:context(day[0],annual,analysis,{outlookFlowYear:true,annualTomb:tomb}),analysis};
}
const doubleChen=tombContext('癸酉 甲子 戊辰 丙辰','庚申',2030);
same(doubleChen.tomb.open['flowYear:戌藏辛:金'],['day/flowYear','flowYear/hour'],'双辰冲戌 releases both clash pairs');
const doubleXu=tombContext('甲戌 丁卯 戊戌 庚申','丙寅',2000);
same(doubleXu.tomb.open['flowYear:辰藏乙:木'],['flowYear/year','day/flowYear'],'双戌冲辰 releases both clash pairs');
const weakTomb=tombContext('庚申 辛酉 丁亥 庚戌','己丑',2027);
assert(!weakTomb.tomb.open['luck:丑藏辛:金']);
assert(!wealth(weakTomb.projected,weakTomb.analysis).roots.some(r=>r.pillar==='luck'&&r.stem==='辛'));
const yangTomb=tombContext('庚午 丁巳 丁巳 庚戌','己丑',2027);
assert.match(yangTomb.projected.strength,/强/);
assert(yangTomb.projected.carryingCapacity.canCarryWealth);

// Each Tier 2 rule keeps the B amount when its exact root loss overlaps a tomb part.
const lossActor='month:未藏乙:木', soilActor='luck:丑藏己:土';
for (const [ruleId,event,partKey] of [
  ...['Y3-core-gate','Y3-medicine','Y3-replacement-medicine','Y3-carry-support','Y3-dynamic-phenomenon',
    'Y4-output','Y4-output-load','LK-05'].map(rule => [rule,['luck:丑',lossActor,'branch-冲'],['luck',lossActor,'冲','暗伤']]),
  ['Y3-earth-metal',[soilActor,soilActor,'earth-buildup'],['month',soilActor,'冲','土动']]
]) {
  const group={id:'luck/month|冲',keys:['luck','month'],parts:[{key:partKey,value:-1,reason:'测试'}]};
  const entry={ruleId,taskId:ruleId,direction:'negative',annualMagnitude:2,
    action:{sourceKeys:[],mediatorKeys:[],targetKeys:[],effect:'test',events:[event]}};
  const result=settleLedger({evidence:[]},{entries:[]},[entry],{
    pillars:{day:'己酉'},annualTomb:{groups:[group]}
  });
  assert.equal(result.sums.B,-2,ruleId);
  assert.equal(result.ledger[0].contribution,2,ruleId);
  assert.equal(result.ledger[1].tomb.parts[0].coveredBy,ruleId);
  assert.equal(result.ledger[1].tomb.parts[0].value,0);
  assert.equal(group.parts[0].value,-1,'Tomb decision stays immutable across scenarios');
}
const closePillars={year:'壬午',month:'乙巳',day:'庚申',hour:'丁丑'};
const closeAnalysis=E.analyzePattern({pillars:closePillars});
const closeBase=context('庚',closePillars,closeAnalysis);
const closeYear={...closePillars,luck:'甲辰',flowYear:'戊子'};
const closeCtx=context('庚',closeYear,closeAnalysis,{outlookFlowYear:true});
const closeDecision=decision(closeBase,closeCtx,closeAnalysis);
assert.equal(branch('hour',closeCtx.interactions,true).retention,0.5);
const closeProjected=context('庚',closeYear,closeAnalysis,{outlookFlowYear:true,annualTomb:closeDecision});
same(closeProjected.profiles,closeCtx.profiles,'Closing does not apply retention twice');
const tiePillars={year:'己丑',month:'乙亥',day:'丙辰',hour:'丁酉'};
const tieAnalysis=E.analyzePattern({pillars:tiePillars});
const tieBase=context('丙',tiePillars,tieAnalysis);
const tieCtx=context('丙',{...tiePillars,luck:'丙子',flowYear:'乙未'},tieAnalysis,{outlookFlowYear:true});
const tie=decision(tieBase,tieCtx,tieAnalysis);
assert(tie.groups.some(g=>g.parts.some(p=>p.key[3]==='藏干未决')));
same(decision(tieBase,{...tieCtx,scores:{...tieCtx.scores,木:tieCtx.scores.木+0.01}},tieAnalysis),tie,'Near-tie score jitter');
const challengedPillars={year:'癸酉',month:'甲子',day:'戊辰',hour:'丙辰'};
const challengedAnalysis=E.analyzePattern({pillars:challengedPillars});
const challengedBase=context('戊',challengedPillars,challengedAnalysis);
const challengedYear={...challengedPillars,luck:'庚申',flowYear:'庚戌'};
const challenged=context('戊',challengedYear,challengedAnalysis,{outlookFlowYear:true});
const challengedGroup=branch('day',challenged.interactions,true);
assert(challengedGroup.relation.challenged&&challengedGroup.retention===0.5);
const challengedProjected=context('戊',challengedYear,challengedAnalysis,{
  outlookFlowYear:true,annualTomb:decision(challengedBase,challenged,challengedAnalysis)
});
same(challengedProjected.scores,challenged.scores,'Challenged group keeps its previously discounted scores');
console.log('PASS tomb fixtures: earth roles, Yang-backed wealth, multi-pair release, ledger priority, binding and punishment');
const refs = [
  ['老王',[1994,7,29,10,0,'女'],false,[2030,2037]],
  ['小蔓',[1998,6,23,9,30,'女'],true,[2024]],
  ['香肠',[1993,12,13,8,5,'男'],true,[2024,2030]]
];
const references = refs.map(([name, input, solar, focus]) => {
  const rows = compareChart(input, 10, solar, true);
  assert.equal(rows.length, 100);
  return { name, rows: rows.filter(x => focus.includes(x.after.year)).map(x => ({
    year:x.after.year, before:detail(x.before), after:detail(x.after), entries:x.after.actionLedger
  })) };
});
const [wang, man, sausage] = references;
assert.equal(wang.rows.find(x => x.year===2037).after.total.guaranteed, 0);
assert.equal(man.rows[0].after.total.guaranteed, 3);
assert.equal(sausage.rows.find(x => x.year===2024).after.total.guaranteed, -1);
assert(wang.rows.find(x => x.year===2030).entries.some(x => x.ruleId==='Y3-carry-load' && x.contribution===2));
assert(wang.rows.find(x => x.year===2030).entries.some(x => x.ruleId==='Y4-output-load' && x.contribution===2));
const sausage2030 = sausage.rows.find(x => x.year===2030);
assert(sausage2030.entries.some(x => x.ruleId==='W-food' && x.wealthContribution===2 &&
  x.action.route.includes('year:癸:水')));
same(sausage2030.after.W, sausage2030.before.W, 'Sausage 2030 keeps the existing wealth route');
assert(wealth(doubleChen.projected,doubleChen.analysis).roots.some(r=>r.pillar==='month'&&r.branch==='子'&&r.stem==='癸'),
  'Sausage 2030 keeps 子藏癸 usable behind the Tier 2 wealth route');

let natal = 0;
E.forEachLegalFourPillar((pillars, meta) => {
  if (meta.yearIndex<2 || meta.dayIndex<30 || meta.hourIndex!==meta.dayIndex%4) return;
  same(E.analyzePattern({ pillars }), before.BaziEngine.analyzePattern({ pillars }), meta.key);
  natal++;
}, { yearCycleCount:4, monthBranchCount:12, dayCycleCount:60, hourBranchCount:4, validateUnique:false });
assert.equal(natal,720);
console.log('PASS 720 exact natal comparisons and three reference charts (300 single/batch comparisons)');

const stats = { years:0, withEvent:0, withoutEvent:0, changedB:0, changedW:0, changedPending:0,
  changedDirection:0, flips:0, positiveToNegative:0, negativeToPositive:0, netEntries:0, neutralEntries:0,
  wealthOpenPos:0, changedSpecial:0, outputDoubleBooked:0, sameEventCoreConflict:0, tombSwallowedHigh:0,
  tombUnsignedDuplicates:0, tombOppositeSigns:0, nonTombYearDrift:0, erasedY4:0, satNeg:0 };
const highRule = /^(Y3-(core-|medicine$|replacement-medicine$|carry-|dynamic-phenomenon$|earth-)|Y4-output|LK-)/;
const recurrenceRule = /^T-year-(?:natal-)?(?:same|tkdc)$/;
const unilateral = /^T-year-(?:fight|clash|harmony|dayhit)$/;
function checkNonTombRecurrence({before,after}, label) {
  same(after.wealthRange,before.wealthRange,label+' non-tomb wealth range');
  const regular=rows=>rows.filter(x=>!recurrenceRule.test(x.ruleId)&&
    (!unilateral.test(x.ruleId)||x.contribution||x.wealthContribution));
  const score=rows=>rows.filter(x=>recurrenceRule.test(x.ruleId))
    .reduce((n,x)=>n+(x.side==='negative'?-1:1)*x.contribution,0);
  same(after.scenarios.map(s=>[s.replacementStates,s.retainedRoots,s.W]),
    before.scenarios.map(s=>[s.replacementStates,s.retainedRoots,s.W]),label+' scenario assumptions and W');
  const expected=before.scenarioLedgers.map((old,i)=>{
    const current=after.scenarioLedgers[i];
    same(regular(current),regular(old),label+' regular ledger, scenario '+i);
    return before.scenarios[i].B+score(current)-score(old);
  });
  same(after.scenarios.map(s=>s.B),expected,label+' non-tomb scenario B');
  const B=after.comprehensiveRange;
  same([B.min,B.max],[Math.min(...expected),Math.max(...expected)],label+' non-tomb B range');
  const values=after.scenarios.map(s=>s.B+(after.wealthRange.pending?0:0.25*s.W));
  const missing=B.reason==='missing-evidence';
  if(missing&&before.comprehensiveRange.reason!=='missing-evidence') {
    assert(after.annual.evidence.some(x=>x.recurrenceHint&&x.direction==='negative')||
      before.scenarioLedgers.some((old,i)=>score(old)!==score(after.scenarioLedgers[i])),
    label+' new missing evidence needs a risk hint or a changed recurrence action');
  }
  assert.equal(B.pending,missing||B.min<0&&B.max>0,label+' non-tomb B pending');
  assert.equal(after.effectiveRange.pending,missing||Math.min(...values)<0&&Math.max(...values)>0,
    label+' non-tomb combined pending');
}
const outputExcess = /^(水多金沉|木盛水缩|火多木焚|土多火晦|金多土变)$/;
const probes = new Map([
  ['3/1970', row => {
    assert(!row.recurrence.preMerge.length);
    assert(counted(row,'Y3-tomb','negative',1));
    assert(parts(row).some(p=>p.value<0&&p.key[0]==='flowYear'&&p.key[1]==='luck:辰藏乙:木'));
    assert.equal(row.effectiveRange.guaranteed,1);
  }],
  ['14/2024', row => {
    assert(counted(row,'T-year-tkdc','negative',3));
    assert(counted(row,'Y3-tomb','positive',1));
    assert(parts(row).some(p=>p.coveredBy==='T-year-tkdc'&&p.value===0));
  }],
  ...['11/2023','20/1979','107/1970'].map(key => [key,row => {
    assert(counted(row,'T-natal-clash','negative',1));
    assert(!row.effectiveRange.pending);
  }]),
  ['27/1994', row => {
    assert(counted(row,'Y3-tomb','negative',1));
    assert.equal(row.effectiveRange.guaranteed,-1);
  }],
  ['101/1979', row => {
    assert(counted(row,'T-natal-clash','negative',1));
    assert(parts(row).some(p=>p.key[1]==='month:丑藏癸:水'&&p.key[3]==='藏干未决'));
    assert(!row.effectiveRange.pending);
  }],
  ['47/1976', row => {
    assert(row.actionLedger.some(r=>r.ruleId==='W-peer'&&r.side==='negative'&&r.wealthContribution===2));
    assert.equal(row.wealthRange.guaranteed,-2);
  }],
  ['54/2012', row => {
    assert(row.actionLedger.some(r=>r.ruleId==='W-peer'&&r.side==='negative'&&r.wealthContribution===2));
    assert(parts(row).some(p=>p.key[1]==='year:戌藏丁:火'&&p.key[3]==='冲开'&&p.value<0));
  }],
  ['92/2003', row => {
    assert(row.actionLedger.some(r=>r.taskId==='冲开财库'&&r.wealthContribution===1&&r.contribution===0));
    assert(parts(row).some(p=>p.key[1]==='day:丑藏癸:水'&&p.key[3]==='冲开'&&p.value===1));
  }]
]);
const checkedProbes = [];
const wealthOpenings = [];
const rows = [];
for (let index=1; index<=120; index++) {
  const input = [1940 + rand(85), 1 + rand(12), 1 + rand(28), rand(24), rand(60), index % 2 ? '男' : '女'];
  for (const row of compareChart(input, 2)) {
    const old = detail(row.before), next = detail(row.after);
    const ledger = next.ledger.filter(x => x.tomb);
    const ids = ledger.map(x => x.tomb.id);
    const label = '#' + index + ' ' + row.after.year;
    const probeKey = index + '/' + row.after.year;
    if (probes.has(probeKey)) {
      probes.get(probeKey)(row.after);
      checkedProbes.push(label);
    }
    assert.equal(new Set(ids).size, ids.length, 'One B row per connected tomb event');
    for (const entry of next.ledger) {
      if (entry.mergedTomb) {
        assert(entry.mergedTomb.every(id => ids.includes(id)));
        if (entry.B) assert(entry.owned.length, 'Require an independent event for residual B');
      }
    }
    const booked = next.ledger.filter(x=>x.B);
    const positiveEvents = new Set(booked.filter(x=>x.side==='positive').flatMap(x=>x.owned));
    if (booked.some(x=>x.rule==='Y3-dynamic-phenomenon'&&outputExcess.test(x.task))&&
        booked.some(x=>/^Y4-output(?:-load)?$/.test(x.rule))) stats.outputDoubleBooked++;
    if (booked.some(x=>x.rule==='Y3-dynamic-core-harm'&&x.owned.some(k=>
      positiveEvents.has(JSON.stringify(['positive',...JSON.parse(k).slice(1)]))))) stats.sameEventCoreConflict++;
    if (row.after.annual.review?.dynamicUse?.special&&JSON.stringify(next)!==JSON.stringify(old)) stats.changedSpecial++;
    const swallowed = row.after.actionLedger.filter(x=>highRule.test(x.ruleId)&&x.magnitude>=2&&x.mergedTomb?.length);
    stats.tombSwallowedHigh += swallowed.length;
    stats.erasedY4 += swallowed.filter(x=>/^Y4-output/.test(x.ruleId)).length;
    if (row.after.annual.review?.dynamicUse?.capacity?.saturated&&booked.some(x=>x.side==='negative'&&
      (x.rule==='Y3-carry-support'||x.rule==='Y3-replacement-medicine'&&/^承载不足/.test(x.task)||/满溢/.test(x.task)))) stats.satNeg++;
    const wonWealth = next.ledger.filter(x=>x.W>0&&x.side==='positive'&&x.mergedTomb?.length&&
      (x.task==='冲开财库'||/^W-(food|bridge)$/.test(x.rule)));
    if (wonWealth.length) {
      stats.wealthOpenPos++;
      wealthOpenings.push({index,year:row.after.year,entries:wonWealth.map(x=>[x.rule,x.task,x.W])});
    }
    const owners = new Map();
    function own(key,side) {
      const other=owners.get(key);
      if (other) {
        stats.tombUnsignedDuplicates++;
        if (other!==side) stats.tombOppositeSigns++;
      }
      owners.set(key,side);
    }
    for (const t of ledger) {
      for (const p of t.tomb.parts) {
        if (!p.value) continue;
        const key=JSON.stringify(p.key);
        own(key,p.value>0?'positive':'negative');
        const [source,actor,relation,effect]=p.key;
        for (const r of booked.filter(x=>!x.tomb)) {
          if (r.owned.some(k=>{
            const [,from,to,type]=JSON.parse(k);
            return to===actor&&(type==='branch-'+relation&&String(from).split(':')[0]===source||
              from===actor&&(type==='actor-availability'||type==='earth-buildup'&&effect==='土动'))||
              type==='daymaster-capacity'&&from===actor&&/^(冲开|土动)$/.test(effect);
          })) own(key,r.side);
        }
      }
      if (t.B) {
        const netKey=JSON.stringify([t.tomb.id,t.tomb.id,'tomb-net']);
        own(netKey,t.side);
        for (const r of booked.filter(x=>!x.tomb)) {
          if (r.owned.some(k=>JSON.stringify(JSON.parse(k).slice(1))===netKey)) own(netKey,r.side);
        }
      }
    }
    if (!ledger.length) {
      stats.withoutEvent++;
      if (!row.after.recurrence?.scenes.length) {
        if (baselineJson(withoutOngoingHint(row.after))!==baselineJson(withoutOngoingHint(row.before)))
          stats.nonTombYearDrift++;
      } else {
        checkNonTombRecurrence(row,label);
      }
    } else stats.withEvent++;
    stats.years++;
    stats.netEntries += ledger.length;
    stats.neutralEntries += ledger.filter(x => !x.B).length;
    if (JSON.stringify(old.B)!==JSON.stringify(next.B)) stats.changedB++;
    if (JSON.stringify(old.W)!==JSON.stringify(next.W)) stats.changedW++;
    if (old.total.pending!==next.total.pending) stats.changedPending++;
    if (old.total.direction!==next.total.direction) stats.changedDirection++;
    if (old.total.direction==='positive'&&next.total.direction==='negative') stats.positiveToNegative++;
    if (old.total.direction==='negative'&&next.total.direction==='positive') stats.negativeToPositive++;
    rows.push({ index, input, pillars:row.pillars, year:row.after.year, luck:row.luck, before:old, after:next });
  }
}
assert.equal(stats.years,2400);
assert.equal(checkedProbes.length,probes.size);
stats.flips=stats.positiveToNegative+stats.negativeToPositive;
for (const key of ['changedSpecial','outputDoubleBooked','sameEventCoreConflict','tombSwallowedHigh',
  'tombUnsignedDuplicates','tombOppositeSigns','nonTombYearDrift','erasedY4','satNeg']) assert.equal(stats[key],0,key);
assert(stats.wealthOpenPos>0,'The live cohort must book a qualified wealth-tomb opening');
console.log('PASS live Rule 1 and Rule 2 invariants across 2,400 years, including ' + checkedProbes.join(', '));
const target = path.join(__dirname, 'build', 'luck-rule2-20261128.2');
fs.mkdirSync(target, { recursive:true });
fs.writeFileSync(path.join(target, 'annual-comparison.json'), JSON.stringify({
  version, baseline, seed:20261126, natal, stats, checkedProbes, wealthOpenings, references, rows
}));
console.log(JSON.stringify({ stats, references:references.map(x=>[x.name,x.rows.map(r=>[r.year,r.after.total.guaranteed])]) }, null,2));
