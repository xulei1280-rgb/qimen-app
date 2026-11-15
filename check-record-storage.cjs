'use strict';
// Isolated synthetic storage only; exercise each normal automatic-save entry.
const assert = require('node:assert/strict');
const {chromium, launchOptions, url} = require('./check-playwright-env.cjs');
const modules = [
  {page:'index.html', key:'qimen_auto_history', status:'#statusStrip', cast:p=>p.evaluate(()=>doPaiPan())},
  {page:'liuyao.html', key:'liuyao_records_v1', status:'#questionSummaryStatus', cast:p=>p.evaluate(()=>{document.getElementById('question').value='测试事项能否完成';finishCast('manual',[7,8,7,8,7,8],collectMeta())})},
  {page:'ziwei.html', key:'ziwei_records_v1', status:'#statusBanner', cast:p=>p.locator('#birthForm button[type="submit"]').click()},
];
async function run() {
  const browser = await chromium.launch(launchOptions);
  try {
    for (const mod of modules) {
      for (const raw of ['[{"id":"recognizable-old-record"}]BROKEN', '{"old":"recognizable-old-record"}', null, '', '[]']) {
        const context = await browser.newContext({timezoneId:'Asia/Shanghai'});
        try {
          const page = await context.newPage(), errors = [];
          page.on('pageerror', e=>errors.push(e.message));
          await page.route('**/*', route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
          await page.addInitScript(({key,raw})=>{if(raw!==null)localStorage.setItem(key,raw)}, {key:mod.key,raw});
          await page.goto(url(mod.page));
          // Count writes after initialization, including any refused direct mutation.
          await page.evaluate(key=>{
            window.recordWrites=0;
            const set=Storage.prototype.setItem;
            Storage.prototype.setItem=function(k,v){if(k===key)window.recordWrites++;return set.call(this,k,v)};
          },mod.key);
          await mod.cast(page);
          const corrupt = raw && raw!=='[]';
          if (corrupt) {
            assert.equal(await page.evaluate(key=>localStorage.getItem(key),mod.key),raw,mod.page+' preserves raw');
            assert.match(await page.locator(mod.status).textContent(),/停止写入.*保护原数据/);
            assert.doesNotMatch(await page.locator(mod.status).textContent(),/已.*保存|保存成功/);
            assert.equal(await page.evaluate(()=>window.recordWrites),0);
            if (mod.page==='index.html') {
              await page.evaluate(()=>{updateCurrentAutoHistory();setRecords(AUTO_HISTORY_STORAGE,[])});
              // Independent keys still work, including the shared Bazi store.
              for(const other of ['qimen_history','bazi_records']) {
                assert.equal(await page.evaluate(key=>setRecords(key,[]),other),true);
              }
            } else if(mod.page==='liuyao.html') {
              await page.evaluate(()=>{persistCurrent('questionSummaryStatus');exportRecords()});
              assert.match(await page.locator('#historyStatus').textContent(),/无法导出/);
              await page.evaluate(()=>{try{writeRecords([])}catch(e){}});
            } else {
              await mod.cast(page);
              assert.match(await page.locator(mod.status).textContent(),/停止写入/);
            }
            assert.equal(await page.evaluate(()=>window.recordWrites),0);
            assert.equal(await page.evaluate(key=>localStorage.getItem(key),mod.key),raw);
          } else {
            let rows = await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),mod.key);
            assert.equal(rows.length,1,mod.page+' empty/missing storage can save');
            const id=rows[0].id;
            // A complete saved record survives an ordinary second update/build.
            if(mod.page==='index.html')await page.evaluate(()=>updateCurrentAutoHistory());
            else if(mod.page==='liuyao.html')await page.evaluate(()=>persistCurrent());
            else {await page.locator('#entryEdit').click();await page.locator('#birthForm button[type="submit"]').click()}
            rows=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),mod.key);
            assert.equal(rows.length,1);assert.equal(rows[0].id,id);
          }
          assert.deepEqual(errors,[],mod.page+' page errors');
        } finally {await context.close()}
      }
    }
    // Each Qimen key must fail independently, even when writes precede a read.
    for(const key of ['qimen_history','bazi_records']) {
      const context=await browser.newContext();
      try {
        const page=await context.newPage();
        await page.goto(url('index.html'));
        await page.evaluate(key=>localStorage.setItem(key,'{"old":"retain-me"}'),key);
        assert.equal(await page.evaluate(key=>setRecords(key,[]),key),false);
        assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),'{"old":"retain-me"}');
        assert.equal(await page.evaluate(()=>setRecords(AUTO_HISTORY_STORAGE,[])),true);
      }finally{await context.close()}
    }
    console.log('PASS record protection: 3 modules × malformed/non-array/missing/empty/valid; normal auto-save, update, refusal, export refusal, Qimen key isolation.');
  } finally {await browser.close()}
}
module.exports=run;
if(require.main===module)run().catch(e=>{console.error(e);process.exitCode=1});
