// Isolated browser context: no user's records or AI requests.
const assert=require('node:assert/strict');
const {chromium,launchOptions,url}=require('./check-playwright-env.cjs');
(async()=>{
  const browser=await chromium.launch(launchOptions);
  try {
    const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/api.deepseek.com/**',r=>r.abort());
    await page.goto(process.argv[2]||url('ziwei.html'));
    const records=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('ziwei_records_v1')||'[]'));
    const submit=()=>page.locator('#birthForm button[type="submit"]').click();
    assert.ok(await page.locator('#personLabel').isVisible());
    assert.equal(await page.locator('#personLabel').evaluate(e=>!!e.closest('details')),false);
    assert.ok(await page.locator('input[name="timeBasis"][value="trueSolar"]').isVisible());
    assert.equal(await page.locator('input[name="timeBasis"]').first().evaluate(e=>!!e.closest('details')),false);
    await page.locator('input[name="timeBasis"][value="trueSolar"]').check();
    assert.ok(await page.locator('#locationTrigger').isVisible());
    await page.locator('input[name="timeBasis"][value="beijing"]').check();
    assert.equal(await page.locator('#locationTrigger').isVisible(),false);
    await page.locator('#personLabel').fill('测试甲');await submit();
    await page.waitForTimeout(100);
    let data=await records();assert.equal(data.length,1);assert.equal(data[0].title,'测试甲');
    const id=data[0].id,created=data[0].createdAt;
    await page.locator('#entryEdit').click();await page.locator('#birthTime').fill('11:00');await submit();
    data=await records();assert.equal(data.length,1);assert.equal(data[0].id,id);assert.equal(data[0].createdAt,created);assert.equal(data[0].localBirthData.birthTime,'11:00');
    // A legacy pure-natal answer is valid and must survive reopening and rename.
    await page.evaluate(()=>{const r=JSON.parse(localStorage.getItem('ziwei_records_v1'));r[0].aiHistory=[{id:'old-answer',question:'原问题',answer:'原回答',model:'test',createdAt:new Date().toISOString(),horoscopeSnapshot:null}];localStorage.setItem('ziwei_records_v1',JSON.stringify(r))});
    await page.reload();await page.locator('[data-open-record]').first().click();
    await page.locator('#entryEdit').click();await page.locator('#personLabel').fill('测试甲改名');await submit();
    data=await records();assert.equal(data[0].aiHistory.length,1);assert.equal(data[0].title,'测试甲改名');
    await page.locator('#entryEdit').click();await page.locator('#birthTime').fill('13:00');
    page.once('dialog',d=>d.dismiss());await submit();assert.equal((await records())[0].localBirthData.birthTime,'11:00');
    page.once('dialog',d=>d.accept());await submit();
    data=await records();assert.equal(data[0].id,id);assert.equal(data[0].aiHistory.length,0);assert.equal(data[0].localBirthData.birthTime,'13:00');
    // A failed write cannot overwrite the old saved chart or dismiss the edit form.
    await page.locator('#entryEdit').click();await page.locator('#birthTime').fill('15:00');
    await page.evaluate(()=>{window.realSet=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new Error('quota test')}});
    await submit();assert.equal((await records())[0].localBirthData.birthTime,'13:00');assert.ok(await page.locator('#birthTime').isVisible());
    await page.evaluate(()=>{Storage.prototype.setItem=window.realSet});
    await page.locator('#birthTime').fill('13:00');await submit();
    await page.locator('#newBirth').click();assert.equal((await records()).length,1);assert.ok(await page.locator('#personLabel').isVisible());
    assert.equal(await page.locator('#personLabel').inputValue(),'');
    await page.locator('#autoSaveBuild').uncheck();await page.locator('#personLabel').fill('测试乙');await submit();
    assert.equal((await records()).length,1,'unchecked new chart is preview only');
    assert.ok(await page.locator('#entrySave').isVisible());await page.locator('#entrySave').click();
    data=await records();assert.equal(data.length,2);assert.notEqual(data[0].id,id);assert.equal(data[0].title,'测试乙');
    await page.locator('#entryEdit').click();await page.locator('#birthTime').fill('16:00');await submit();
    assert.equal((await records()).length,2,'editing updates even when new-chart auto-save is unchecked');
    await page.locator('#newBirth').click();
    await page.setViewportSize({width:390,height:844});assert.ok(await page.locator('#personLabel').isVisible());
    assert.ok(await page.locator('input[name="timeBasis"][value="trueSolar"]').isVisible());
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await page.locator('[data-open-record="'+id+'"]').click();
    assert.ok(await page.locator('#newBirth').isVisible());assert.ok(await page.locator('#entryEdit').isVisible());
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    assert.deepEqual(errors,[]);
    console.log('PASS record flow: visible name, auto/manual save, stable record ID, rename keeps AI, confirmed chart replacement, quota rollback, new chart, legacy natal answer, mobile.');
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
