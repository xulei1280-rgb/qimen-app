// Local UI checks in isolated browser storage; no AI requests.
const assert=require('node:assert/strict');
const path=require('node:path'),os=require('node:os');
const {chromium,launchOptions,url}=require('./check-playwright-env.cjs');
(async()=>{
  const browser=await chromium.launch(launchOptions);
  try{
    const p=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[];
    p.on('pageerror',e=>errors.push(e.message));
    await p.route('**/api.deepseek.com/**',r=>r.abort());
    await p.goto(url('bazi.html'));
    assert.ok(await p.locator('#autoSaveBuild').isChecked());
    assert.equal(await p.locator('#useTrueSolar').isChecked(),false);
    assert.equal(await p.locator('#birthLocationDisplay').isVisible(),false);
    await p.locator('.options-label').click();assert.equal(await p.locator('#useTrueSolar').isChecked(),false,'label text does not toggle true solar');
    await p.locator('#useTrueSolar').check();
    assert.ok(await p.locator('#birthLocationDisplay').isVisible());
    const location=await p.locator('#birthLocationDisplay').innerText();
    await p.locator('#birthLocationDisplay').click();assert.ok(await p.locator('#locationPanel').isVisible());
    await p.locator('#useTrueSolar').uncheck();
    assert.equal(await p.locator('#birthLocationField').isVisible(),false);
    assert.equal(await p.locator('#locationPanel').isVisible(),false);
    assert.equal(await p.locator('#birthLocationDisplay').getAttribute('aria-expanded'),'false');
    assert.ok(!(await p.locator('#solarPreview').innerText()).includes('经纬'));
    assert.ok(await p.evaluate(()=>{const t=getUsedTime();return !t.enabled&&JSON.stringify(t.used)===JSON.stringify(t.input)}));
    await p.locator('#useTrueSolar').check();assert.equal(await p.locator('#birthLocationDisplay').innerText(),location);
    await p.locator('#useTrueSolar').uncheck();
    await p.screenshot({path:path.join(os.tmpdir(),'bazi-input-controls.png')});
    await p.locator('#btnBuild').click();
    assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem(BAZI_RECORDS)||'[]').length),1,'default saves built chart');
    await p.evaluate(()=>editCurrentBaziInput());
    assert.equal(await p.locator('#birthLocationField').isVisible(),false,'restored uncorrected chart hides address');
    await p.setViewportSize({width:390,height:844});
    await p.locator('#useTrueSolar').check();assert.ok(await p.locator('#birthLocationDisplay').isVisible());
    await p.locator('#useTrueSolar').uncheck();assert.equal(await p.locator('#birthLocationDisplay').isVisible(),false);
    assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await p.goto(url('index.html'));
    for(const width of [1440,1024,390,320]){
      await p.setViewportSize({width,height:1000});
      const dims=await p.locator('.qm-time-field input,.qm-time-field select').evaluateAll(els=>els.map(e=>({w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height})));
      assert.equal(dims.length,5);dims.forEach(d=>assert.ok(Math.abs(d.h-36)<1));
      assert.ok(Math.abs(dims[1].w-dims[2].w)<1,'month and day align');
      assert.ok(Math.abs(dims[3].w-dims[4].w)<1,'time fields equal width');
      assert.ok(await p.evaluate(()=>Math.abs(document.querySelector('.qm-time-grid').getBoundingClientRect().width-document.querySelector('.qm-date-grid').getBoundingClientRect().width)<1),'clock row aligns with date row');
      assert.ok(await p.evaluate(()=>[...document.querySelectorAll('.qm-time-field:has(select)')].every(f=>{const s=f.querySelector('span').getBoundingClientRect(),r=f.getBoundingClientRect();return document.elementFromPoint(s.x+s.width/2,s.y+s.height/2)===f.querySelector('select')&&document.elementFromPoint(r.right-4,r.y+r.height/2)===f.querySelector('select')})),'tapping unit/arrow hits the select');
      assert.deepEqual(await p.locator('.qm-time-field>span').allTextContents(),['年','月','日','时','分']);
      assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    }
    await p.locator('#year').fill('2026');await p.locator('#month').selectOption('11');await p.locator('#day').selectOption('2');await p.locator('#hour').selectOption('5');await p.locator('#minute').selectOption('31');
    assert.deepEqual(await p.evaluate(()=>getTimeInput()),{year:2026,month:11,day:2,hour:5,minute:31});
    await p.setViewportSize({width:1440,height:1000});
    await p.screenshot({path:path.join(os.tmpdir(),'qimen-input-controls.png')});
    assert.deepEqual(errors,[]);
    console.log('PASS input controls: Bazi correction defaults off/address toggle/auto-save; Qimen full-width grouped fields/tappable selects/visible units/unchanged input; desktop and mobile, no AI.');
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
