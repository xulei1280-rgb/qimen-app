'use strict';
// Offline markup/text audit. No browser, records, network or AI calls.
process.env.TZ='Asia/Shanghai';
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('node:assert/strict');
const output=process.argv[2];if(output)fs.mkdirSync(output,{recursive:true});
const fixed='2026-11-08T04:00:00+08:00';
class AuditDate extends Date{constructor(...args){super(...(args.length?args:[fixed]))}static now(){return new Date(fixed).getTime()}}
let mode='standard';const nodes={};
const context={console,Date:AuditDate,Math,JSON,BirthTime:require('./birth-time.js'),localStorage:{getItem(){return null},setItem(){}},prompt(){return ''},confirm(){return true},document:{body:{getAttribute(){return mode},setAttribute(k,v){mode=v},classList:{add(){},remove(){}}},addEventListener(){},querySelector(){return null},querySelectorAll(){return []},getElementById(id){return nodes[id]||(nodes[id]={value:id==='aiMode'?'detail':'',checked:false,innerHTML:'',hidden:false,style:{},classList:{toggle(){},add(){},remove(){}}})}}};
vm.createContext(context);
for(const file of ['qimen.js','bazi-engine.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
const html=fs.readFileSync('bazi.html','utf8');for(const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g))vm.runInContext(m[1],context);
function visible(markup,selected){
 const stack=[],out=[];
 for(const token of markup.match(/<[^>]*>|[^<]+/g)||[]){
  if(token.startsWith('</')){stack.pop();continue}
  if(token.startsWith('<')){
   const tag=(token.match(/^<([\w-]+)/)||[])[1];if(!tag)continue;
   const hidden=stack.some(Boolean)||(selected==='standard'?/professional-only/.test(token):/standard-only/.test(token));
   if(!/^(br|hr|img|input|meta|link|wbr)$/.test(tag)&&!token.endsWith('/>'))stack.push(hidden);
   continue;
  }
  if(!stack.some(Boolean))out.push(token);
 }
 return out.join(' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
}
function expandedArtifact(markup,selected){
 const expanded=markup.replace(/<details\b([^>]*)>/g,(all,attrs)=>/\bopen\b/.test(attrs)?all:'<details'+attrs+' open>');
 return '<!doctype html><meta charset="utf-8"><title>Offline expanded copy audit</title><style>.'+(selected==='standard'?'professional-only':'standard-only')+'{display:none!important}</style><body data-display-mode="'+selected+'">'+expanded.replace(/aria-hidden="true"/g,'aria-hidden="false"').replace(/class="explain-help /g,'class="explain-help is-open ')+'</body>';
}
const mechanical=/印比|增援|变化前|变化后|接通|已接通的这一段|应少增|不单列|增援增加|作用接通或增强|出生(?:月份|日期|年份|时刻)的[木火土金水]（/g;
const forbidden=/ZP-[A-Z0-9-]+|taskId|beforeTasks|afterTasks|possibleStates|共同任用需求|共同需求|旧路径须按|(?:carry|handle|food|hurt|officer|wealth|special|verified)-(?:wealth|output|officer|kill|seal|mixed|sharing|flow|reversal|continuity)|LK-\d+|Y[2-8]-[a-z-]+|可能|或许|看条件|不明确|分情况|分条件|取决于|尚未确认|暂缺整体结论|未定主用|无明确忌项|一部分|看情况|需结合全盘|未损日主根[01]|变化前：|变化后：|固定比例扶身指数|合会变气反馈|旧路径须按共同需求比较|格局层次：[偏中高顶]|结构分：|评分维度：|百分位[：位置]/g;
const inputs=[['色魔','男',1993,11,24,5,2],['笠夏','男',1993,7,14,8,40],['小蔓','女',1998,6,23,9,30],['香肠','男',1993,12,13,8,5],['陈伟伟','男',2002,6,27,19,45]];
const snapshots=[],errors=[];let scanned=0;
for(const key of ['missing','strength','useful','main-pattern','current-luck','phenomenon','positive-phenomenon','interaction','special-pattern','formation'])for(const selected of ['standard','professional'])audit('help/'+key+'/'+selected,visible(context.contextHelp(key),selected),selected==='standard');
function audit(label,text,isStandard){scanned++;const bad=text.match(forbidden)||[],terms=isStandard&&/structure|summary/.test(label)?text.match(mechanical)||[]:[];if(bad.length||terms.length)errors.push({label,bad,terms});}
for(const [person,gender,year,month,day,hour,minute] of inputs){
 const data=context.BaziEngine.createBaziProfile({person,gender,input:{year,month,day,hour,minute},location:{name:'云南省 曲靖市 师宗县',lng:103.9936,lat:24.8222},useTrueSolar:true,useDaylightSaving:false});
 const frozen=JSON.stringify(data);context.currentBazi=data;context.luckSelection={luck:null,year:null,month:null};context.selectedLuckOutlookCache=null;
 const luck=context.getLuckData(data,new AuditDate());const cycle=luck.rows.findIndex(r=>context.luckStartYear(data,r)<=2026&&context.luckStartYear(data,r)+10>2026);
 context.luckSelection={luck:cycle,year:2026-context.luckStartYear(data,luck.rows[cycle]),month:null};
 const ctx=context.getSelectedLuckContext(data),outlook=context.getSelectedLuckOutlook(data,ctx),view=context.caseDisplayView(data),parts={summary:context.renderCoreCards(data),basic:context.renderBasicInfo(data),structure:context.renderStructure(data),luck:context.renderLuckPanel(data),aiBasis:context.renderReasoningBasis(data)};
 for(const key of ['formation','useful','missing','strength','interaction','current-luck'])assert.ok(parts.structure.includes('data-help="'+key+'"'),'rendered page preserves '+key+' help');
 const verdicts={};
 for(const selected of ['standard','professional']){
  mode=selected;context.setDisplayMode(selected,false);
  verdicts[selected]={verdict:context.caseDisplayView(data).verdict,directions:[outlook.natal.direction,outlook.previous.direction,...outlook.years.flatMap(y=>[y.annual.direction,y.increment.direction])]};
  const row={person,mode:selected,verdict:verdicts[selected],html:parts,text:{},report:context.buildBaziReport(),prompt:context.buildAiPrompt('解释当前选中的年度与阶段，说明实际帮助和限制')};
  for(const [name,markup] of Object.entries(parts)){row.text[name]=visible(markup,selected);audit(person+'/'+selected+'/'+name,row.text[name],selected==='standard');}
  audit(person+'/'+selected+'/report',row.report,selected==='standard');
  if(person==='小蔓'&&selected==='professional')assert.ok(row.text.luck.includes('七杀压力的食神制杀或印化杀承接路径：原局有效，本期受破坏。')&&row.report.includes('七杀压力的食神制杀或印化杀承接路径：原局有效，本期受破坏。'),'actual Xiaoman page and export translate handle-kill by domain with its original transition');
  assert.ok(row.prompt.includes('禁止外显结构档位、结构分、评分权重或百分位'));assert.ok(row.prompt.includes('当前显示模式：'+selected));
  // Prompt facts are an internal machine context; visible-answer constraints are audited separately.
  assert.ok(!/层次高低|格局层次：|结构分：|评分维度：/.test(row.prompt),'prompt cannot solicit or publish tiers');
  snapshots.push(row);
  if(output){const base=path.join(output,person+'-'+selected);fs.writeFileSync(base+'-all-expanded.html',expandedArtifact(Object.values(parts).join('\n'),selected));fs.writeFileSync(base+'-visible.txt',Object.entries(row.text).map(([k,v])=>k+'\n'+v).join('\n\n'));fs.writeFileSync(base+'-report.txt',row.report);fs.writeFileSync(base+'-prompt.txt',row.prompt);}
 }
 assert.equal(JSON.stringify(verdicts.standard),JSON.stringify(verdicts.professional),'wording cannot change verdict/direction');
 assert.equal(JSON.stringify(data),frozen,'display never mutates natal facts');
 const dv=context.usefulDecisionView(data),original=data.useful.decision.conclusion;
 assert.ok(original.primary.length||!original.secondary.length,'secondary choices must fill an empty primary before rendering');
 for(const entry of data.useful.decision.elements){
  const role=dv.routeDependent.includes(entry.element)?'other':dv.avoid.includes(entry.element)?'avoid':dv.primary.includes(entry.element)?'primary':dv.secondary.includes(entry.element)?'secondary':null;
  if(!role)continue;
  const text=context.usefulDisplayReason(data,entry.element,role,true);
  if(role==='other'&&(entry.riskEntries||[]).some(r=>r.status==='effective'))assert.ok(text.includes('已落实制约')&&text.includes('不并入默认'),'effective adverse path must stay separate from local benefit');
  if(role==='other'&&(entry.benefitEntries||[]).some(b=>b.routeId==='wealth-flow'&&b.status==='local')){
   const route=data.useful.decision.routes.find(r=>r.id==='wealth-flow'),step=(route.steps||[]).find(s=>s.active);
   assert.ok(step&&text.includes(step.left.text+step.action+step.right.text),'wealth-flow claim must cite its actual actor pair, not a different wood-control-seal pair');
  }
  if(role==='other'&&entry.riskEntries.length&&entry.riskEntries.every(r=>r.status==='potential')&&entry.riskEntries.some(r=>r.id==='wealth-seal'))assert.ok(text.includes('潜在风险')&&text.includes('未判已坏印'),'potential risk cannot become effective damage');
 }

 for(const [key,field] of [['primary','primary'],['secondary','secondary'],['avoid','avoid'],['routeDependent','routeDependent']])assert.equal(JSON.stringify(dv[key]),JSON.stringify(original[field]||[]),'display must retain actual role sets');
}
// Same-pattern fixtures are legal five-tiger/five-rat charts; expected text follows independent state/path facts.
const counterparts=[{year:'丁巳',month:'辛亥',day:'己未',hour:'丁卯'},{year:'癸酉',month:'癸亥',day:'己酉',hour:'辛未'},{year:'甲子',month:'丙寅',day:'癸酉',hour:'壬子'},{year:'乙丑',month:'甲申',day:'己丑',hour:'丁卯'},{year:'辛酉',month:'甲午',day:'甲辰',hour:'戊辰'},{year:'庚申',month:'己卯',day:'壬子',hour:'辛亥'}].map(pillars=>context.refreshPatternAnalysis({pillars,dayStem:pillars.day[0]}));
for(const d of counterparts){const st='甲乙丙丁戊己庚辛壬癸',br='子丑寅卯辰巳午未申酉戌亥',mo='寅卯辰巳午未申酉戌亥子丑',p=d.pillars;assert.equal(st.indexOf(p.month[0]),(2*(st.indexOf(p.year[0])%5)+2+mo.indexOf(p.month[1]))%10);assert.equal(st.indexOf(p.hour[0]),(2*(st.indexOf(p.day[0])%5)+br.indexOf(p.hour[1]))%10);}
assert.equal(context.publicPatternName(counterparts[0]),context.publicPatternName(counterparts[1]),'wealth pair is the same actual principal pattern');assert.notEqual(context.caseDisplayView(counterparts[0]).verdict,context.caseDisplayView(counterparts[1]).verdict,'same wealth pattern has formed/broken contrast');
assert.ok(new Set(counterparts.map(d=>context.caseReadingText(d,true))).size===counterparts.length,'same family explanations must reflect actual distinct medicine/state');
for(const d of counterparts){const v=context.caseDisplayView(d);assert.equal(v.verdict,context.publicPatternMain(d).status);assert.ok(!context.caseReadingText(d,false,context.standardStructureView(d)).match(mechanical));}
// Optional original-source capture is reference-only; it never supplies expected new copy.
if(output){
 const originalDir=path.dirname(path.resolve(output)),oldPage=path.join(originalDir,'original-bazi.html'),oldEngine=path.join(originalDir,'original-bazi-engine.js');
 if(fs.existsSync(oldPage)&&fs.existsSync(oldEngine)){
  const old={console,Date:AuditDate,Math,JSON,BirthTime:require('./birth-time.js'),localStorage:context.localStorage,document:context.document,prompt:context.prompt,confirm:context.confirm};vm.createContext(old);
  vm.runInContext(fs.readFileSync('qimen.js','utf8'),old);vm.runInContext(fs.readFileSync(oldEngine,'utf8'),old);
  for(const m of fs.readFileSync(oldPage,'utf8').matchAll(/<script>([\s\S]*?)<\/script>/g))vm.runInContext(m[1],old);
  for(const [person,gender,year,month,day,hour,minute] of inputs){
   const d=old.BaziEngine.createBaziProfile({person,gender,input:{year,month,day,hour,minute},location:{name:'云南省 曲靖市 师宗县',lng:103.9936,lat:24.8222},useTrueSolar:true,useDaylightSaving:false});old.currentBazi=d;old.luckSelection={luck:null,year:null,month:null};
   const l=old.getLuckData(d,new AuditDate()),i=l.rows.findIndex(r=>old.luckStartYear(d,r)<=2026&&old.luckStartYear(d,r)+10>2026);old.luckSelection={luck:i,year:2026-old.luckStartYear(d,l.rows[i]),month:null};
   const parts=[old.renderBasicInfo(d),old.renderStructure(d),old.renderLuckPanel(d),old.renderReasoningBasis(d)].join('\n');
   for(const selected of ['standard','professional']){mode=selected;const base=path.join(output,person+'-'+selected+'-BEFORE');fs.writeFileSync(base+'-visible.txt',visible(parts,selected));fs.writeFileSync(base+'-all-expanded.html',expandedArtifact(parts,selected));fs.writeFileSync(base+'-report.txt',old.buildBaziReport());fs.writeFileSync(base+'-prompt.txt',old.buildAiPrompt('解释当前选择'));}
  }
 }
}
if(output)fs.writeFileSync(path.join(output,'copy-audit.json'),JSON.stringify({scanned,scope:'5 charts × 2 modes × (basic, structure, full luck, AI basis, report); all disclosures included. Prompt machine facts are retained; answer constraints audited separately. Browser layout not tested.',errors,samePatternFixtures:counterparts.map(d=>({pillars:d.pillars,verdict:context.caseDisplayView(d).verdict,reading:context.caseReadingText(d,true)}))},null,2));
assert.deepEqual(errors,[],'rendered visible copy audit');
console.log('Bazi display PASS:',scanned,'rendered sections/reports; 5 mode pairs / 10 prompts; role, freeze and same-pattern checks; no browser or AI requests');
