// Isolated browser storage; never reads the user's existing records or calls AI.
const assert = require('node:assert/strict');
const {chromium} = require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({channel:'msedge',headless:true});
  try {
    const page = await browser.newPage({viewport:{width:1440,height:1000}});
    const errors=[]; page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/api.deepseek.com/**',r=>r.abort());
    await page.goto(process.argv[2] || 'http://127.0.0.1:8084/ziwei.html');
    await page.evaluate(() => {
      const snapshot=ZiweiEngine.buildNatal({calendarType:'solar',date:'1993-07-14',time:'08:20',gender:'male',timeBasis:'beijing'});
      const horoscope=ZiweiEngine.getHoroscope(snapshot,'2026-11-02');
      const record={schemaVersion:1,id:'ui-test',title:'折叠删除测试',localBirthData:{solarDate:'1993-07-14',birthTime:'08:20',gender:'male',calendarType:'solar',timeBasis:'beijing'},natalSnapshot:snapshot,currentHoroscope:horoscope,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),aiHistory:[1,2].map(i=>({id:'turn-'+i,question:'测试问题 '+i,answer:'## 一句话总结\n测试回答 '+i,model:'test',createdAt:new Date().toISOString(),horoscopeSnapshot:horoscope}))};
      localStorage.setItem('ziwei_records_v1',JSON.stringify([record]));
    });
    await page.reload();
    async function openRecord() {
      const tab=page.locator('[data-zw-tab="records"]');
      if(await tab.isVisible()) await tab.click();
      assert.equal(await page.locator('#exportRecords, #importRecords').count(),0);
      await page.locator('[data-open-record="ui-test"]').click();
      await page.locator('[data-zw-tab="ai"]').click();
    }
    await openRecord();
    const savedBefore=await page.evaluate(()=>localStorage.getItem('ziwei_records_v1'));
    assert.ok(await page.locator('#aiStyle').isVisible());
    assert.equal(await page.locator('#aiPanel .rule-chip').count(),0,'remove model badge from header');
    const buttonColor=await page.locator('#openApiKey').evaluate(e=>getComputedStyle(e).backgroundColor);
    assert.notEqual(buttonColor,'rgba(0, 0, 0, 0)','API button needs visible fill');
    const usedPresets=new Set();
    for(const direction of ['comprehensive','natal','career','wealth','relationship','wellbeing','decadal','yearly']) {
      await page.locator('#aiMode').selectOption(direction);
      const questions=await page.locator('#aiPresetQuestions button').allTextContents();
      assert.equal(questions.length,6);
      for(const question of questions){assert.ok(!usedPresets.has(question));usedPresets.add(question)}
      await page.locator('#aiPresetQuestions button').nth(5).click();
      assert.equal(await page.locator('#aiQuestion').inputValue(),(await page.locator('#aiPresetQuestions button').nth(5).innerText())+'。');
    }
    assert.equal(await page.locator('#aiSettings').evaluate(e=>e.tagName),'DIV');
    assert.equal(await page.locator('#apiKey').isVisible(),false);
    await page.locator('#openApiKey').click();
    assert.ok(await page.locator('#apiKeyDialog').isVisible());
    await page.locator('#apiKey').fill('test-local-key');
    await page.locator('#saveApiKey').click();
    assert.equal(await page.locator('#apiKeyDialog').isVisible(),false);
    assert.equal(await page.evaluate(()=>localStorage.getItem('qimen_deepseek_api_key')),'test-local-key');
    await page.locator('#openApiKey').click();await page.keyboard.press('Escape');
    assert.equal(await page.locator('#apiKeyDialog').isVisible(),false);
    assert.equal(await page.locator('#openApiKey').evaluate(e=>e===document.activeElement),true);
    for(const style of ['detail','conclusion','palaces','timing','brief']) {
      await page.locator('#aiStyle').selectOption(style);
      const label=await page.locator('#aiStyle option:checked').innerText();
      assert.ok(label.length>0);
    }
    await page.locator('#aiMode').selectOption('career');
    assert.equal(await page.evaluate(()=>localStorage.getItem('ziwei_records_v1')),savedBefore,'settings must not recalculate or alter saved records');
    const first=page.locator('details[data-turn-id="turn-1"]');
    assert.equal(await first.getAttribute('open'),'');
    await first.locator('summary').focus(); await page.keyboard.press('Enter');
    await page.waitForTimeout(50);
    assert.equal(await first.getAttribute('open'),null);
    assert.equal(await first.locator('.turn-answer').isVisible(),false);
    await openRecord(); assert.equal(await first.getAttribute('open'),null,'fold survives rerender');
    page.once('dialog',d=>d.dismiss());
    await page.locator('[data-delete-turn="turn-2"]').click();
    assert.equal(await page.locator('details[data-turn-id]').count(),2,'cancel does not delete');
    await page.evaluate(()=>{window.originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new Error('quota test')}});
    page.once('dialog',d=>d.accept()); await page.locator('[data-delete-turn="turn-2"]').click();
    assert.equal(await page.locator('details[data-turn-id]').count(),2,'failed storage restores answer');
    await page.evaluate(()=>{Storage.prototype.setItem=window.originalSetItem});
    page.once('dialog',d=>d.accept()); await page.locator('[data-delete-turn="turn-2"]').click();
    assert.equal(await page.locator('details[data-turn-id]').count(),1);
    assert.equal(await first.getAttribute('open'),null,'deleting another answer keeps fold');
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('ziwei_records_v1'))[0].aiHistory.length),1);
    await page.reload(); await openRecord();
    assert.equal(await page.locator('details[data-turn-id]').count(),1,'deletion persisted');
    await page.setViewportSize({width:390,height:844});
    await page.locator('summary.turn-question').focus();await page.keyboard.press('Space');
    await page.waitForTimeout(50);
    assert.equal(await page.locator('.turn-answer').isVisible(),false);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    assert.ok(await page.locator('#aiMode').isVisible());
    await page.locator('#openApiKey').click();assert.ok(await page.locator('#apiKeyDialog').isVisible());
    assert.ok(await page.locator('#apiKeyDialog').evaluate(e=>e.getBoundingClientRect().width<=innerWidth));
    await page.locator('#closeApiKey').click();
    assert.deepEqual(errors,[]);
    console.log('PASS AI UI: keyboard fold/unfold, rerender state, cancel/delete/persist, quota rollback, removed import/export, mobile; no AI request.');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1});
