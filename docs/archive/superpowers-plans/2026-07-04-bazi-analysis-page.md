# Bazi Analysis Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a separate `bazi.html` page with Wenzhen-style data entry, Yunnan location search, true solar time correction, core Bazi analysis, AI follow-up context, and local saved records.

**Architecture:** Keep the existing `qimen.js` logic untouched and reuse its Ganzhi helpers from `bazi.html`. Replace the current rough `bazi.html` draft with a focused single-file static page because the current project is a static GitHub Pages app. Keep the Qimen page change minimal: one title-area link to the Bazi page.

**Tech Stack:** Static HTML/CSS/JavaScript, existing `qimen.js`, browser `localStorage`, DeepSeek chat completions API already used by `index.html`.

## Global Constraints

- Do not push Bazi work to GitHub until the user explicitly approves the finished feature.
- Do not change Qimen plate logic in `qimen.js`.
- First version supports public-calendar birth time only.
- Birthplace selector uses common Yunnan locations plus search matching, not province-city-district triple selection.
- Default locations: Yunnan Kunming, Qujing Qilin District, Shizong County, Luoping County, Luxi County, Luliang County.
- True solar time is checked by default and can be turned off.
- Bazi AI context stays with the current Bazi chart and may answer different topics for the same chart.
- Saved Bazi records include the chart, local calculated references, and AI conversation history.
- Visual style is light Wenzhen-like: light gray page, white cards, gold accents, black primary button, five-element colored stems/branches.
- Verification must include `node .\check-baselines.js`, inline script parsing for `index.html` and `bazi.html`, and the Wenzhen sample `1990-05-07 07:00` Qujing Qilin true-solar chart `庚午 辛巳 壬申 癸卯`.

---

## File Structure

- Modify `I:\奇门起盘分析\index.html`
  - Keep or refine the title-area `bazi.html` link only.
- Replace `I:\奇门起盘分析\bazi.html`
  - Owns all Bazi UI, Bazi-specific constants, location search, true solar preview, AI chat, and Bazi local record storage.
- Modify `I:\奇门起盘分析\ROLLBACK.md`
  - Add one backup entry before implementation.
- Create optional local validation script only if needed:
  - `I:\奇门起盘分析\check-bazi-sample.js`
  - Purpose: verify the Wenzhen sample. If inline PowerShell/Node is enough, skip the file.

---

### Task 1: Backup And Navigation Baseline

**Files:**
- Modify: `I:\奇门起盘分析\index.html`
- Modify: `I:\奇门起盘分析\ROLLBACK.md`
- Read: `I:\奇门起盘分析\docs\superpowers\specs\2026-07-04-bazi-analysis-page-design.md`

**Interfaces:**
- Consumes: existing `index.html` title area.
- Produces: `index.html` contains one visible link with `href="bazi.html"`.

- [ ] **Step 1: Create a rollback backup**

Run:

```powershell
$stamp=Get-Date -Format yyyyMMdd-HHmmss
$dest="I:\奇门起盘分析_回滚备份\backup-before-bazi-redesign-$stamp"
New-Item -ItemType Directory -Force -Path $dest | Out-Null
Copy-Item -LiteralPath "I:\奇门起盘分析\index.html" -Destination $dest
Copy-Item -LiteralPath "I:\奇门起盘分析\bazi.html" -Destination $dest -ErrorAction SilentlyContinue
Copy-Item -LiteralPath "I:\奇门起盘分析\qimen.js" -Destination $dest
Copy-Item -LiteralPath "I:\奇门起盘分析\ROLLBACK.md" -Destination $dest
Write-Output $dest
```

Expected: prints a backup path under `I:\奇门起盘分析_回滚备份`.

- [ ] **Step 2: Ensure Qimen page has only a lightweight Bazi entry**

In `index.html`, keep this link immediately below the title/subtitle:

```html
<a class="page-switch" href="bazi.html">八字分析 →</a>
```

Keep CSS minimal:

```css
.page-switch{
  display:inline-flex;
  align-items:center;
  gap:6px;
  margin-bottom:12px;
  padding:6px 12px;
  border:1px solid rgba(169,111,40,.34);
  border-radius:999px;
  background:rgba(255,253,247,.76);
  color:#70481a;
  text-decoration:none;
  font-size:12px;
  font-weight:bold;
  box-shadow:0 6px 16px rgba(61,42,18,.07);
}
.page-switch:hover{background:#fffaf0;border-color:var(--line-strong)}
```

- [ ] **Step 3: Add rollback note**

Append to `ROLLBACK.md`:

```markdown
## Bazi redesign backup

Backup before rebuilding the independent bazi page with Wenzhen-style entry:

`<backup path from Step 1>`
```

- [ ] **Step 4: Verify Qimen is not broken**

Run:

```powershell
node .\check-baselines.js
```

Expected:

```text
18 baselines ok
```

---

### Task 2: Rebuild `bazi.html` Layout And Form Shell

**Files:**
- Replace: `I:\奇门起盘分析\bazi.html`

**Interfaces:**
- Produces DOM IDs:
  - `personName`
  - `genderMale`
  - `genderFemale`
  - `birthTimeDisplay`
  - `timeEditor`
  - `birthYear`
  - `birthMonth`
  - `birthDay`
  - `birthHour`
  - `birthMinute`
  - `birthLocationDisplay`
  - `locationPanel`
  - `locationSearch`
  - `locationList`
  - `useTrueSolar`
  - `solarPreview`
  - `btnBuild`
  - `resultArea`

- [ ] **Step 1: Replace rough top form with Wenzhen-style entry card**

Use this structure in `bazi.html` body:

```html
<main class="page">
  <header class="top">
    <a class="back" href="index.html">← 奇门遁甲</a>
    <h1>八字分析</h1>
    <div class="sub">四柱排盘 · 格局喜用参考</div>
  </header>

  <section class="entry-card">
    <div class="field">
      <label for="personName">命主姓名</label>
      <input id="personName" type="text" value="测试" placeholder="姓名/标记">
    </div>

    <div class="field gender-field">
      <label>性别</label>
      <div class="segmented">
        <label><input id="genderMale" name="gender" type="radio" value="男" checked> 男</label>
        <label><input id="genderFemale" name="gender" type="radio" value="女"> 女</label>
      </div>
    </div>

    <div class="field">
      <label>出生时间</label>
      <button id="birthTimeDisplay" class="display-field" type="button" onclick="toggleTimeEditor()">1990年05月07日 07:00</button>
      <div id="timeEditor" class="editor-panel" hidden></div>
    </div>

    <div class="field">
      <label>出生地址</label>
      <button id="birthLocationDisplay" class="display-field" type="button" onclick="toggleLocationPanel()">云南省 曲靖市 麒麟区</button>
      <div id="locationPanel" class="editor-panel" hidden>
        <input id="locationSearch" type="search" placeholder="搜索昆明 / 麒麟 / 师宗 / 罗平 / 泸西 / 陆良" oninput="renderLocations()">
        <div id="locationList" class="location-list"></div>
      </div>
    </div>

    <div class="options">
      <label><input id="useTrueSolar" type="checkbox" checked onchange="refreshSolarPreview()"> 真太阳时</label>
    </div>

    <div id="solarPreview" class="solar-preview"></div>
    <button id="btnBuild" class="build-btn" onclick="buildBazi()">开始排盘</button>
  </section>

  <section id="resultArea" class="result-area"></section>
</main>
```

- [ ] **Step 2: Add light Wenzhen-style CSS**

Use these key styles:

```css
body{margin:0;background:#f2f2f4;color:#222;font-family:"Microsoft YaHei","PingFang SC",system-ui,sans-serif}
.page{max-width:960px;margin:0 auto;padding:28px 16px 44px}
.top{text-align:center;margin-bottom:18px}
.back{display:inline-flex;margin-bottom:10px;color:#8a6a2d;text-decoration:none;font-weight:bold}
h1{font-size:30px;margin:0;color:#222;letter-spacing:2px}
.sub{margin-top:6px;color:#888;font-size:14px}
.entry-card{max-width:640px;margin:0 auto 18px;background:#fff;border-radius:26px;padding:34px 42px;box-shadow:0 14px 50px rgba(20,20,20,.06)}
.field{display:grid;grid-template-columns:92px 1fr;align-items:center;gap:14px;margin-bottom:18px}
.field label{font-size:15px;color:#222}
.field input[type=text],.display-field{width:100%;min-height:38px;border:1px solid #ddd;border-radius:6px;background:#fff;color:#222;padding:0 14px;text-align:left;font-size:15px}
.segmented{display:flex;gap:26px;align-items:center}
.segmented input,.options input{accent-color:#b49350}
.editor-panel{grid-column:2;margin-top:8px;border:1px solid #e5e1d8;border-radius:14px;background:#fffdf8;padding:12px}
.options{display:flex;gap:24px;margin:10px 0 16px 106px;color:#333}
.solar-preview{margin-left:106px;color:#69727f;font-size:14px;line-height:1.8}
.build-btn{display:block;width:calc(100% - 106px);margin:28px 0 0 106px;border:0;border-radius:999px;background:#050505;color:#f4c879;min-height:58px;font-size:18px;font-weight:bold;cursor:pointer}
.result-area{max-width:920px;margin:0 auto}
@media(max-width:700px){
  .page{padding:18px 12px 34px}
  .entry-card{padding:24px 18px;border-radius:18px}
  .field{grid-template-columns:1fr;gap:8px}
  .editor-panel{grid-column:1}
  .options,.solar-preview,.build-btn{margin-left:0;width:100%}
}
```

- [ ] **Step 3: Verify HTML parses**

Run:

```powershell
@'
const fs = require('fs');
for (const file of ['index.html','bazi.html']) {
  const html = fs.readFileSync(file,'utf8');
  const scripts = [...html.matchAll(/<script(?:[^>]*)>([\s\S]*?)<\/script>/g)].map(m => m[1]).filter(Boolean);
  for (const s of scripts) new Function(s);
  console.log(file, 'inline scripts parse ok:', scripts.length);
}
'@ | node -
```

Expected:

```text
index.html inline scripts parse ok: 1
bazi.html inline scripts parse ok: 1
```

---

### Task 3: Location Search And True Solar Time

**Files:**
- Modify: `I:\奇门起盘分析\bazi.html`

**Interfaces:**
- Produces:
  - `LOCATIONS: Array<{name:string, aliases:string[], lat:number, lng:number}>`
  - `selectedLocation`
  - `renderLocations(): void`
  - `selectLocation(index: number): void`
  - `refreshSolarPreview(): void`
  - `getInputTime(): {year:number,month:number,day:number,hour:number,minute:number}`
  - `getUsedTime(): {input: TimeObj, used: TimeObj, correction:number, enabled:boolean, location: LocationObj}`

- [ ] **Step 1: Add built-in Yunnan location data**

Add to `bazi.html` script:

```js
var LOCATIONS=[
  {name:'云南省 昆明市',aliases:['昆明','云南昆明','kunming'],lat:25.0389,lng:102.7183},
  {name:'云南省 曲靖市 麒麟区',aliases:['曲靖','麒麟','麒麟区','曲靖麒麟'],lat:25.4951,lng:103.8050},
  {name:'云南省 曲靖市 师宗县',aliases:['师宗','师宗县'],lat:24.8222,lng:103.9936},
  {name:'云南省 曲靖市 罗平县',aliases:['罗平','罗平县'],lat:24.8847,lng:104.3087},
  {name:'云南省 红河州 泸西县',aliases:['泸西','泸西县'],lat:24.5321,lng:103.7662},
  {name:'云南省 曲靖市 陆良县',aliases:['陆良','陆良县'],lat:25.0294,lng:103.6668}
];
var selectedLocation=LOCATIONS[1];
```

- [ ] **Step 2: Implement search rendering**

```js
function renderLocations(){
  var q=(document.getElementById('locationSearch').value||'').trim().toLowerCase();
  var list=LOCATIONS.map(function(loc,i){return {loc:loc,index:i}}).filter(function(item){
    if(!q)return true;
    return item.loc.name.toLowerCase().indexOf(q)>=0 || item.loc.aliases.some(function(a){return a.toLowerCase().indexOf(q)>=0});
  });
  document.getElementById('locationList').innerHTML=list.map(function(item){
    return '<button type="button" class="location-option" onclick="selectLocation('+item.index+')"><strong>'+item.loc.name+'</strong><span>东经'+item.loc.lng+' 北纬'+item.loc.lat+'</span></button>';
  }).join('') || '<div class="empty">没有匹配地点，可换关键词搜索</div>';
}
function selectLocation(index){
  selectedLocation=LOCATIONS[index]||LOCATIONS[1];
  document.getElementById('birthLocationDisplay').textContent=selectedLocation.name;
  document.getElementById('locationPanel').hidden=true;
  refreshSolarPreview();
}
```

Add CSS:

```css
.location-list{display:grid;gap:8px;margin-top:10px}
.location-option{display:flex;justify-content:space-between;gap:10px;align-items:center;border:1px solid #e6dcc8;border-radius:10px;background:#fff;padding:10px 12px;text-align:left;cursor:pointer}
.location-option:hover{border-color:#b49350;background:#fffaf0}
.location-option span{font-size:12px;color:#7a7166}
.empty{color:#888;font-size:13px;padding:8px}
```

- [ ] **Step 3: Implement time picker panel**

```js
function initTimeEditor(){
  var now={year:1990,month:5,day:7,hour:7,minute:0};
  document.getElementById('timeEditor').innerHTML=
    '<div class="time-grid">'+
    '<input id="birthYear" type="number" value="'+now.year+'" onchange="updateDays();refreshBirthTimeDisplay()">'+
    '<select id="birthMonth" onchange="updateDays();refreshBirthTimeDisplay()"></select>'+
    '<select id="birthDay" onchange="refreshBirthTimeDisplay()"></select>'+
    '<select id="birthHour" onchange="refreshBirthTimeDisplay()"></select>'+
    '<select id="birthMinute" onchange="refreshBirthTimeDisplay()"></select>'+
    '</div>';
  var m=document.getElementById('birthMonth'),h=document.getElementById('birthHour'),mi=document.getElementById('birthMinute');
  for(var i=1;i<=12;i++)m.innerHTML+='<option value="'+i+'">'+i+'月</option>';
  for(i=0;i<24;i++)h.innerHTML+='<option value="'+i+'">'+pad(i)+'时</option>';
  for(i=0;i<60;i++)mi.innerHTML+='<option value="'+i+'">'+pad(i)+'分</option>';
  m.value=now.month; h.value=now.hour; mi.value=now.minute; updateDays(now.day); refreshBirthTimeDisplay();
}
function updateDays(preferred){
  var y=parseInt(document.getElementById('birthYear').value)||1990;
  var m=parseInt(document.getElementById('birthMonth').value)||1;
  var d=document.getElementById('birthDay'),cur=preferred||parseInt(d.value)||1,max=new Date(y,m,0).getDate();
  d.innerHTML='';
  for(var i=1;i<=max;i++)d.innerHTML+='<option value="'+i+'">'+i+'日</option>';
  d.value=Math.min(cur,max);
}
function refreshBirthTimeDisplay(){
  var t=getInputTime();
  document.getElementById('birthTimeDisplay').textContent=t.year+'年'+pad(t.month)+'月'+pad(t.day)+'日 '+pad(t.hour)+':'+pad(t.minute);
  refreshSolarPreview();
}
function toggleTimeEditor(){
  var panel=document.getElementById('timeEditor');
  panel.hidden=!panel.hidden;
}
function toggleLocationPanel(){
  var panel=document.getElementById('locationPanel');
  panel.hidden=!panel.hidden;
  if(!panel.hidden)renderLocations();
}
```

Add CSS:

```css
.time-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}
.time-grid input,.time-grid select{min-width:0;border:1px solid #ddd;border-radius:8px;padding:8px;background:#fff}
@media(max-width:700px){.time-grid{grid-template-columns:repeat(2,1fr)}}
```

- [ ] **Step 4: Implement true solar preview**

```js
function pad(n){n=parseInt(n)||0;return(n<10?'0':'')+n}
function getInputTime(){
  return {
    year:parseInt(document.getElementById('birthYear').value)||1990,
    month:parseInt(document.getElementById('birthMonth').value)||1,
    day:parseInt(document.getElementById('birthDay').value)||1,
    hour:parseInt(document.getElementById('birthHour').value)||0,
    minute:parseInt(document.getElementById('birthMinute').value)||0
  };
}
function dayOfYear(y,m,d){var start=new Date(y,0,0);return Math.floor((new Date(y,m-1,d)-start)/86400000)}
function equationOfTimeMinutes(y,m,d){var n=dayOfYear(y,m,d);var b=2*Math.PI*(n-81)/364;return 9.87*Math.sin(2*b)-7.53*Math.cos(b)-1.5*Math.sin(b)}
function addMinutes(t,mins){var dt=new Date(t.year,t.month-1,t.day,t.hour,t.minute+Math.round(mins));return {year:dt.getFullYear(),month:dt.getMonth()+1,day:dt.getDate(),hour:dt.getHours(),minute:dt.getMinutes()}}
function formatTime(t){return t.year+'-'+pad(t.month)+'-'+pad(t.day)+' '+pad(t.hour)+':'+pad(t.minute)}
function formatOffset(mins){var sign=mins>=0?'+':'-';mins=Math.abs(Math.round(mins));return sign+Math.floor(mins/60)+'小时'+pad(mins%60)+'分'}
function getUsedTime(){
  var input=getInputTime();
  var enabled=document.getElementById('useTrueSolar').checked;
  var correction=(selectedLocation.lng-120)*4+equationOfTimeMinutes(input.year,input.month,input.day);
  return {input:input,used:enabled?addMinutes(input,correction):input,correction:correction,enabled:enabled,location:selectedLocation};
}
function refreshSolarPreview(){
  var data=getUsedTime();
  document.getElementById('solarPreview').innerHTML=data.enabled
    ? '真太阳时：'+formatTime(data.used)+'　校正 '+formatOffset(data.correction)+'<br>地址经纬：北纬'+data.location.lat+' 东经'+data.location.lng
    : '未启用真太阳时，将按输入时间排盘<br>地址经纬：北纬'+data.location.lat+' 东经'+data.location.lng;
}
```

- [ ] **Step 5: Verify Wenzhen sample time**

Run this inline check:

```powershell
@'
const fs = require('fs'), vm = require('vm');
const qimen = fs.readFileSync('qimen.js','utf8');
const code = qimen + `
function dayOfYear(y,m,d){var start=new Date(y,0,0);return Math.floor((new Date(y,m-1,d)-start)/86400000)}
function equationOfTimeMinutes(y,m,d){var n=dayOfYear(y,m,d);var b=2*Math.PI*(n-81)/364;return 9.87*Math.sin(2*b)-7.53*Math.cos(b)-1.5*Math.sin(b)}
function addMinutes(t,mins){var dt=new Date(t.year,t.month-1,t.day,t.hour,t.minute+Math.round(mins));return {year:dt.getFullYear(),month:dt.getMonth()+1,day:dt.getDate(),hour:dt.getHours(),minute:dt.getMinutes()}}
function buildPillars(t){var dayDate=new Date(t.year,t.month-1,t.day);if(t.hour>=23)dayDate.setDate(dayDate.getDate()+1);var day=getDayGZ(dayDate.getFullYear(),dayDate.getMonth()+1,dayDate.getDate());return {year:getYearGZ(t.year,t.month,t.day),month:getMonthGZ(t.year,t.month,t.day),day:day,hour:getHourGZ(day,t.hour)}}
var input={year:1990,month:5,day:7,hour:7,minute:0};
var corr=(103.805-120)*4+equationOfTimeMinutes(1990,5,7);
var used=addMinutes(input,corr);
JSON.stringify({used:used,pillars:buildPillars(used)});
`;
console.log(vm.runInNewContext(code,{Date,Math,JSON}));
'@ | node -
```

Expected contains:

```json
"pillars":{"year":"庚午","month":"辛巳","day":"壬申","hour":"癸卯"}
```

---

### Task 4: Core Bazi Calculation And Result Rendering

**Files:**
- Modify: `I:\奇门起盘分析\bazi.html`
- Read: `I:\奇门起盘分析\qimen.js`

**Interfaces:**
- Produces:
  - `buildPillars(time): Pillars`
  - `calculateBazi(): BaziData`
  - `renderBazi(data: BaziData): void`
  - `renderPillarTable(data: BaziData): string`
  - `renderCoreCards(data: BaziData): string`

- [ ] **Step 1: Add Bazi constants**

```js
var WUXING=['木','火','土','金','水'];
var STEM_WX={甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'};
var BRANCH_WX={寅:'木',卯:'木',巳:'火',午:'火',辰:'土',戌:'土',丑:'土',未:'土',申:'金',酉:'金',亥:'水',子:'水'};
var HIDDEN={子:['癸'],丑:['己','癸','辛'],寅:['甲','丙','戊'],卯:['乙'],辰:['戊','乙','癸'],巳:['丙','戊','庚'],午:['丁','己'],未:['己','丁','乙'],申:['庚','壬','戊'],酉:['辛'],戌:['戊','辛','丁'],亥:['壬','甲']};
var NAYIN={甲子:'海中金',乙丑:'海中金',丙寅:'炉中火',丁卯:'炉中火',戊辰:'大林木',己巳:'大林木',庚午:'路旁土',辛未:'路旁土',壬申:'剑锋金',癸酉:'剑锋金',甲戌:'山头火',乙亥:'山头火',丙子:'涧下水',丁丑:'涧下水',戊寅:'城头土',己卯:'城头土',庚辰:'白蜡金',辛巳:'白蜡金',壬午:'杨柳木',癸未:'杨柳木',甲申:'泉中水',乙酉:'泉中水',丙戌:'屋上土',丁亥:'屋上土',戊子:'霹雳火',己丑:'霹雳火',庚寅:'松柏木',辛卯:'松柏木',壬辰:'长流水',癸巳:'长流水',甲午:'砂中金',乙未:'砂中金',丙申:'山下火',丁酉:'山下火',戊戌:'平地木',己亥:'平地木',庚子:'壁上土',辛丑:'壁上土',壬寅:'金箔金',癸卯:'金箔金',甲辰:'覆灯火',乙巳:'覆灯火',丙午:'天河水',丁未:'天河水',戊申:'大驿土',己酉:'大驿土',庚戌:'钗钏金',辛亥:'钗钏金',壬子:'桑柘木',癸丑:'桑柘木',甲寅:'大溪水',乙卯:'大溪水',丙辰:'沙中土',丁巳:'沙中土',戊午:'天上火',己未:'天上火',庚申:'石榴木',辛酉:'石榴木',壬戌:'大海水',癸亥:'大海水'};
var KONG_BY_XUN={0:'戌亥',1:'申酉',2:'午未',3:'辰巳',4:'寅卯',5:'子丑'};
```

- [ ] **Step 2: Add ten-god and strength helpers**

```js
function stemPolarity(s){return '甲丙戊庚壬'.indexOf(s)>=0?'阳':'阴'}
function tenGod(dayStem,stem){
  var dayWx=STEM_WX[dayStem], wx=STEM_WX[stem], same=stemPolarity(dayStem)===stemPolarity(stem);
  var gen={木:'火',火:'土',土:'金',金:'水',水:'木'};
  var ctrl={木:'土',土:'水',水:'火',火:'金',金:'木'};
  if(wx===dayWx)return same?'比肩':'劫财';
  if(wx===gen[dayWx])return same?'食神':'伤官';
  if(wx===ctrl[dayWx])return same?'偏财':'正财';
  if(ctrl[wx]===dayWx)return same?'七杀':'正官';
  if(gen[wx]===dayWx)return same?'偏印':'正印';
  return '';
}
function scoreWuxing(pillars){
  var scores={木:0,火:0,土:0,金:0,水:0};
  Object.keys(pillars).forEach(function(k){
    var gz=pillars[k],s=gz[0],b=gz[1];
    scores[STEM_WX[s]]+=1;
    (HIDDEN[b]||[]).forEach(function(h,i){scores[STEM_WX[h]]+=i===0?0.7:(i===1?0.25:0.15)});
  });
  return scores;
}
function assessStrength(dayStem,monthBranch,scores){
  var dayWx=STEM_WX[dayStem], gen={木:'火',火:'土',土:'金',金:'水',水:'木'};
  var resource=Object.keys(gen).find(function(k){return gen[k]===dayWx});
  var total=0; WUXING.forEach(function(w){total+=scores[w]});
  var value=(scores[dayWx]+(scores[resource]||0)*0.75)/total;
  if(BRANCH_WX[monthBranch]===dayWx)value+=0.12;
  if(BRANCH_WX[monthBranch]===resource)value+=0.08;
  if(value>=0.55)return '偏强';
  if(value>=0.43)return '中和偏强';
  if(value>=0.34)return '中和';
  if(value>=0.26)return '偏弱';
  return '弱';
}
```

- [ ] **Step 3: Add pillar and Bazi calculation**

```js
function buildPillars(t){
  var dayDate=new Date(t.year,t.month-1,t.day);
  if(t.hour>=23)dayDate.setDate(dayDate.getDate()+1);
  var day=getDayGZ(dayDate.getFullYear(),dayDate.getMonth()+1,dayDate.getDate());
  return {
    year:getYearGZ(t.year,t.month,t.day),
    month:getMonthGZ(t.year,t.month,t.day),
    day:day,
    hour:getHourGZ(day,t.hour)
  };
}
function usefulElements(dayStem,strength){
  var dayWx=STEM_WX[dayStem], gen={木:'火',火:'土',土:'金',金:'水',水:'木'}, ctrl={木:'土',土:'水',水:'火',火:'金',金:'木'};
  var resource=Object.keys(gen).find(function(k){return gen[k]===dayWx});
  var officer=Object.keys(ctrl).find(function(k){return ctrl[k]===dayWx});
  if(strength.indexOf('弱')>=0)return {use:[resource,dayWx],avoid:[gen[dayWx],ctrl[dayWx]],why:'日主偏弱，先看印比扶身。'};
  if(strength.indexOf('强')>=0)return {use:[gen[dayWx],ctrl[dayWx],officer],avoid:[resource,dayWx],why:'日主偏强，先看泄耗制化。'};
  return {use:[gen[dayWx],ctrl[dayWx]],avoid:[resource],why:'日主接近中和，取流通与成事之气。'};
}
function calculateBazi(){
  var time=getUsedTime(),pillars=buildPillars(time.used),dayStem=pillars.day[0],scores=scoreWuxing(pillars);
  var strength=assessStrength(dayStem,pillars.month[1],scores);
  return {
    person:document.getElementById('personName').value.trim(),
    gender:document.querySelector('input[name="gender"]:checked').value,
    time:time,
    pillars:pillars,
    dayStem:dayStem,
    dayElement:STEM_WX[dayStem],
    scores:scores,
    strength:strength,
    useful:usefulElements(dayStem,strength)
  };
}
```

- [ ] **Step 4: Render core results**

```js
function buildBazi(){
  currentBazi=calculateBazi();
  aiHistory=[];
  renderBazi(currentBazi);
}
function renderBazi(data){
  document.getElementById('resultArea').innerHTML=
    '<div class="core-cards">'+renderCoreCards(data)+'</div>'+
    '<section class="result-card">'+renderPillarTable(data)+'</section>'+
    '<section class="result-card">'+renderStructure(data)+'</section>'+
    '<section class="result-card">'+renderAiPanel()+'</section>'+
    '<section class="result-card"><div class="section-title">保存记录</div><div id="historyList" class="history-list"></div></section>';
  renderHistory();
}
function renderCoreCards(data){
  var p=data.pillars;
  return [
    '<div class="core-card"><span>日主属性</span><strong class="wx-'+data.dayElement+'">'+data.dayStem+data.dayElement+'</strong><em>'+data.gender+' · '+(data.person||'未命名')+'</em></div>',
    '<div class="core-card"><span>四柱</span><strong>'+p.year+' '+p.month+' '+p.day+' '+p.hour+'</strong><em>'+(data.time.enabled?'以真太阳时排盘':'按输入时间排盘')+'</em></div>',
    '<div class="core-card"><span>旺衰参考</span><strong>'+data.strength+'</strong><em>月令 '+p.month[1]+'，'+BRANCH_WX[p.month[1]]+'气当令</em></div>',
    '<div class="core-card"><span>喜用参考</span><strong>'+data.useful.use.join('、')+'</strong><em>'+data.useful.why+'</em></div>'
  ].join('');
}
function renderPillarTable(data){
  var order=[['year','年柱'],['month','月柱'],['day','日柱'],['hour','时柱']];
  function cells(fn){return order.map(function(o){return '<td>'+fn(data.pillars[o[0]],o[0])+'</td>'}).join('')}
  return '<div class="section-title">四柱排盘</div><table class="pillar-table">'+
    '<tr><th></th>'+order.map(function(o){return '<th>'+o[1]+'</th>'}).join('')+'</tr>'+
    '<tr><th>主星</th>'+cells(function(gz,k){return k==='day'?'元男/元女':tenGod(data.dayStem,gz[0])})+'</tr>'+
    '<tr><th>天干</th>'+cells(function(gz){return '<strong class="wx-'+STEM_WX[gz[0]]+'">'+gz[0]+'</strong>'})+'</tr>'+
    '<tr><th>地支</th>'+cells(function(gz){return '<strong class="wx-'+BRANCH_WX[gz[1]]+'">'+gz[1]+'</strong>'})+'</tr>'+
    '<tr><th>藏干</th>'+cells(function(gz){return (HIDDEN[gz[1]]||[]).join(' ')})+'</tr>'+
    '<tr><th>副星</th>'+cells(function(gz){return (HIDDEN[gz[1]]||[]).map(function(s){return tenGod(data.dayStem,s)}).join('<br>')})+'</tr>'+
    '<tr><th>纳音</th>'+cells(function(gz){return NAYIN[gz]||''})+'</tr>'+
    '</table>';
}
function renderStructure(data){
  var bars=WUXING.map(function(w){
    var width=Math.min(100,Math.round(data.scores[w]*18));
    return '<div class="wx-row"><span>'+w+'</span><div><i style="width:'+width+'%"></i></div><em>'+data.scores[w].toFixed(1)+'</em></div>';
  }).join('');
  return '<div class="section-title">格局喜用参考</div>'+
    '<div class="structure-grid"><div>'+bars+'</div><div class="structure-note">'+
    '<p>日主 '+data.dayStem+data.dayElement+'，月令 '+data.pillars.month[1]+'，本地粗判为 '+data.strength+'。</p>'+
    '<p>喜用参考：'+data.useful.use.join('、')+'；慎用：'+data.useful.avoid.join('、')+'。</p>'+
    '<p>本地算法只给参考线索，格局层次和成败由 AI 结合问题继续细断。</p>'+
    '</div></div>';
}
```

- [ ] **Step 5: Verify sample pillars in the UI**

Open local preview:

```text
http://192.168.0.8:8081/bazi.html
```

Click `开始排盘`.

Expected visible four pillars:

```text
庚午 辛巳 壬申 癸卯
```

---

### Task 5: AI Context And Saved Records

**Files:**
- Modify: `I:\奇门起盘分析\bazi.html`

**Interfaces:**
- Produces:
  - `aiHistory: Array<{q:string,a:string,t:string}>`
  - `buildAiPrompt(question: string): string`
  - `analyzeBazi(): Promise<void>`
  - `saveBaziRecord(): void`
  - `loadBaziRecord(id: string): void`
  - `renderHistory(): void`

- [ ] **Step 1: Add AI panel markup renderer**

```js
function renderAiPanel(){
  return '<div class="section-title">AI 深度分析</div>'+
    '<div class="ai-controls">'+
    '<input id="aiQuestion" placeholder="继续问这个八字：命格、事业、财运、感情、某年运势...">'+
    '<select id="aiMode"><option value="brief">简断</option><option value="detail">详断</option><option value="pattern">格局层次</option><option value="luck">大运流年思路</option><option value="conclusion">只看结论</option></select>'+
    '<button onclick="analyzeBazi()" id="btnAi">AI 分析</button>'+
    '<button onclick="saveBaziRecord()" id="btnSaveBazi">保存</button>'+
    '</div>'+
    '<div id="aiResult" class="ai-result">'+renderAiHistory()+'</div>';
}
function renderAiHistory(){
  if(!aiHistory.length)return '可以围绕同一八字连续追问不同主题。';
  return aiHistory.map(function(x){return '问：'+x.q+'（'+x.t+'）\\n'+x.a}).join('\\n\\n');
}
```

- [ ] **Step 2: Add AI prompt builder**

```js
function buildAiPrompt(question){
  var d=currentBazi,p=d.pillars,mode=document.getElementById('aiMode').value;
  var guide={brief:'简断，先给结论，再给关键依据。',detail:'详断，说明命格、格局、层次、用神、忌神和现实取向。',pattern:'重点分析命格格局、成格破格、层次高低和原因。',luck:'重点分析大运流年思路，但不要编造未提供的大运表。',conclusion:'只给结论和建议，300字以内。'};
  return '你是专业八字分析师。请基于四柱、月令、十神、五行流通、格局成败与喜忌分析，避免恐吓和绝对化。\\n'+
    '用户问题：'+question+'\\n'+
    '分析模式：'+guide[mode]+'\\n'+
    '命主：'+(d.person||'未命名')+'；性别：'+d.gender+'\\n'+
    '输入时间：'+formatTime(d.time.input)+'；排盘时间：'+formatTime(d.time.used)+'；真太阳时：'+(d.time.enabled?'启用，校正'+formatOffset(d.time.correction):'未启用')+'\\n'+
    '地点：'+d.time.location.name+'，东经'+d.time.location.lng+'，北纬'+d.time.location.lat+'\\n'+
    '四柱：年 '+p.year+'，月 '+p.month+'，日 '+p.day+'，时 '+p.hour+'\\n'+
    '日主：'+d.dayStem+d.dayElement+'；旺衰参考：'+d.strength+'\\n'+
    '五行分数：'+WUXING.map(function(w){return w+d.scores[w].toFixed(1)}).join('，')+'\\n'+
    '本地喜用参考：喜 '+d.useful.use.join('、')+'；慎 '+d.useful.avoid.join('、')+'\\n'+
    '请回答当前问题，可以结合此前对话，但不要被固定格式束缚。';
}
```

- [ ] **Step 3: Add AI request with current-chart context**

```js
async function analyzeBazi(){
  if(!currentBazi)buildBazi();
  var q=(document.getElementById('aiQuestion').value||'').trim()||'请综合分析命格、格局、层次和喜用神。';
  var key=localStorage.getItem('qimen_deepseek_api_key')||prompt('请输入 DeepSeek API Key（只保存在本机浏览器）')||'';
  if(!key.trim())return;
  localStorage.setItem('qimen_deepseek_api_key',key.trim());
  var messages=[{role:'system',content:'你是专业八字分析师。基于四柱、月令、十神、五行流通、格局成败与喜忌分析。不同流派有分歧时说明为参考。'}];
  aiHistory.forEach(function(x){messages.push({role:'user',content:x.q});messages.push({role:'assistant',content:x.a})});
  messages.push({role:'user',content:buildAiPrompt(q)});
  var btn=document.getElementById('btnAi'),old=btn.textContent; btn.disabled=true; btn.textContent='分析中...';
  try{
    var resp=await fetch('https://api.deepseek.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+key.trim()},body:JSON.stringify({model:'deepseek-chat',messages:messages,max_tokens:1800,temperature:0.65})});
    var data=await resp.json();
    if(data.error)throw new Error(data.error.message||'AI 请求失败');
    var answer=data.choices[0].message.content.replace(/\*\*/g,'');
    aiHistory.push({q:q,a:answer,t:new Date().toLocaleTimeString()});
    document.getElementById('aiResult').textContent=renderAiHistory();
    document.getElementById('aiQuestion').value='';
  }catch(e){
    document.getElementById('aiResult').textContent='AI 分析失败：'+e.message;
  }
  btn.disabled=false; btn.textContent=old;
}
```

- [ ] **Step 4: Add local save/load**

```js
function getBaziRecords(){return JSON.parse(localStorage.getItem('bazi_records')||'[]')}
function setBaziRecords(items){localStorage.setItem('bazi_records',JSON.stringify(items.slice(0,50)))}
function saveBaziRecord(){
  if(!currentBazi)return;
  var items=getBaziRecords();
  items.unshift({id:Date.now().toString(36),name:(currentBazi.person||'未命名')+' '+currentBazi.pillars.day+'日',createdAt:new Date().toLocaleString(),bazi:currentBazi,aiHistory:aiHistory});
  setBaziRecords(items);
  renderHistory();
}
function renderHistory(){
  var box=document.getElementById('historyList');
  if(!box)return;
  var items=getBaziRecords();
  box.innerHTML=items.length?items.map(function(x){return '<button class="history-item" onclick="loadBaziRecord(\\''+x.id+'\\')"><span>'+x.name+'</span><em>'+x.createdAt+'</em></button>'}).join(''):'<div class="empty">暂无保存记录</div>';
}
function loadBaziRecord(id){
  var item=getBaziRecords().find(function(x){return x.id===id});
  if(!item)return;
  currentBazi=item.bazi;
  aiHistory=item.aiHistory||[];
  renderBazi(currentBazi);
}
```

- [ ] **Step 5: Verify AI context rules**

Manual test:

1. Open `bazi.html`.
2. Build sample chart.
3. Ask `先看命格层次`.
4. Ask `再看事业方向`.
5. Confirm the second answer can use first answer context and does not reject with Qimen's "一个盘只能问同一件事".

---

### Task 6: Final Verification And Local Preview

**Files:**
- Verify: `I:\奇门起盘分析\index.html`
- Verify: `I:\奇门起盘分析\bazi.html`
- Verify: `I:\奇门起盘分析\qimen.js`

**Interfaces:**
- Produces: local-only working Bazi feature. Do not push to GitHub.

- [ ] **Step 1: Run Qimen baseline tests**

```powershell
node .\check-baselines.js
```

Expected:

```text
18 baselines ok
```

- [ ] **Step 2: Parse inline scripts**

```powershell
@'
const fs = require('fs');
for (const file of ['index.html','bazi.html']) {
  const html = fs.readFileSync(file,'utf8');
  const scripts = [...html.matchAll(/<script(?:[^>]*)>([\s\S]*?)<\/script>/g)].map(m => m[1]).filter(Boolean);
  for (const s of scripts) new Function(s);
  console.log(file, 'inline scripts parse ok:', scripts.length);
}
'@ | node -
```

Expected:

```text
index.html inline scripts parse ok: 1
bazi.html inline scripts parse ok: 1
```

- [ ] **Step 3: Start or reuse local preview server**

```powershell
Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue
```

If no output:

```powershell
Start-Process -FilePath python -ArgumentList @('-m','http.server','8081','--bind','0.0.0.0') -WorkingDirectory 'I:\奇门起盘分析' -WindowStyle Hidden
```

Open on phone:

```text
http://192.168.0.8:8081/bazi.html
```

- [ ] **Step 4: Manual mobile checks**

Expected:

- First screen shows labeled Wenzhen-style entry card.
- User can pick/search the six Yunnan locations.
- True solar preview updates after changing location.
- Unchecking true solar changes preview and chart basis.
- Sample chart shows `庚午 辛巳 壬申 癸卯`.
- Qimen page can jump to Bazi page.
- Bazi page can return to Qimen page.

- [ ] **Step 5: Leave work local**

Run:

```powershell
git status --short
```

Expected: modified/untracked Bazi work is present locally unless the user explicitly asks to commit or push.
