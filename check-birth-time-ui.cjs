'use strict';
// Fresh browser storage only. All AI network requests are blocked.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium, launchOptions, url } = require('./check-playwright-env.cjs');
const artifactDir = process.env.UI_ARTIFACT_DIR;
if (artifactDir) fs.mkdirSync(artifactDir, { recursive: true });

async function setClock(page, kind, date, time) {
  if (kind === 'ziwei') {
    await page.locator('#solarDate').fill(date);
    await page.locator('#birthTime').fill(time);
  } else {
    if (!await page.locator('#birthYear').isVisible()) await page.locator('#birthTimeDisplay').click();
    const [year, month, day] = date.split('-').map(Number), [hour, minute] = time.split(':').map(Number);
    await page.locator('#birthYear').fill(String(year));
    for (const [id, value] of [['birthMonth', month], ['birthDay', day], ['birthHour', hour], ['birthMinute', minute]]) {
      await page.locator('#' + id).selectOption(String(value));
    }
  }
}
const records = (page, kind) => page.evaluate(key => JSON.parse(localStorage.getItem(key) || '[]'), kind === 'bazi' ? 'bazi_records' : 'ziwei_records_v1');
const submit = (page, kind) => page.locator(kind === 'bazi' ? '.build-btn' : '#birthForm button[type="submit"]').click();
const edit = (page, kind) => page.locator(kind === 'bazi' ? '#btnEditBazi' : '#entryEdit').click();
async function screenshot(page, name) {
  if (artifactDir) await page.screenshot({ path: path.join(artifactDir, name + '.png'), fullPage: false, animations: 'disabled' });
}

(async () => {
  const browser = await chromium.launch(launchOptions);
  try {
    for (const kind of ['bazi', 'ziwei']) {
      const context = await browser.newContext({ timezoneId: 'Asia/Shanghai', viewport: { width: 1440, height: 1000 } });
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/api.deepseek.com/**', route => route.abort());
      await page.goto(url(kind + '.html'));
      const option = page.locator('#useDaylightSaving');
      assert.equal(await option.isChecked(), false);
      await setClock(page, kind, '1990-07-01', '00:30');
      await option.check();
      const preview = page.locator(kind === 'bazi' ? '#solarPreview' : '#daylightSavingPreview');
      assert.match(await preview.textContent(), /1990.*06.*30.*23:30/);
      await submit(page, kind);
      let rows = await records(page, kind);
      assert.equal(rows.length, 1);
      const id = rows[0].id;
      if (kind === 'bazi') {
        assert.deepEqual(rows[0].bazi.time.used, { year: 1990, month: 6, day: 30, hour: 23, minute: 30 });
        assert.equal(rows[0].bazi.time.daylightSaving, true);
      } else {
        assert.equal(rows[0].natalSnapshot.engineInput.solarDate, '1990-06-30');
        assert.equal(rows[0].natalSnapshot.effective.clockTime, '23:30');
      }
      // Re-edit and save the original clock; it must not lose another hour.
      await edit(page, kind);
      assert.equal(await option.isChecked(), true);
      // Both adjustments enabled: the existing solar-time preview/confirmation receives standard time.
      if (kind === 'bazi') await page.locator('#useTrueSolar').check();
      else {
        await page.locator('input[name="timeBasis"][value="trueSolar"]').check();
        await page.locator('#locationTrigger').click();
        await page.locator('#customLongitude').fill('103.9936');
        await page.locator('#useCustomLocation').click();
      }
      await submit(page, kind);
      if (kind === 'ziwei') {
        assert.equal(await page.locator('#timeConfirmDialog').isVisible(), true);
        assert.match(await page.locator('#inputDateTime').textContent(), /1990-06-30 23:30/);
        assert.match(await page.locator('#correctionNote').textContent(), /已先减去夏令时1小时/);
        await page.locator('#cancelTimeShift').click();
        assert.equal((await records(page, kind))[0].natalSnapshot.effective.clockTime, '23:30');
        await submit(page, kind);
        await page.locator('#confirmTimeShift').click();
      }
      rows = await records(page, kind);
      assert.equal(rows[0].id, id);
      assert.equal(kind === 'bazi' ? rows[0].bazi.time.used.hour : rows[0].natalSnapshot.effective.clockTime.slice(0, 2), kind === 'bazi' ? 22 : '22');
      await edit(page, kind);
      if (kind === 'bazi') await page.locator('#useTrueSolar').uncheck();
      else await page.locator('input[name="timeBasis"][value="beijing"]').check();
      await submit(page, kind);
      rows = await records(page, kind);
      assert.equal(rows[0].id, id);
      assert.equal(kind === 'bazi' ? rows[0].bazi.time.used.hour : rows[0].natalSnapshot.effective.clockTime, kind === 'bazi' ? 23 : '23:30');
      await edit(page, kind);
      await option.uncheck();
      await submit(page, kind);
      // Emulate a pre-DST record with an existing answer. Adding a default false must not invalidate it.
      await page.evaluate(kind => {
        const key = kind === 'bazi' ? 'bazi_records' : 'ziwei_records_v1';
        const rows = JSON.parse(localStorage.getItem(key));
        if (kind === 'bazi') {
          delete rows[0].bazi.time.daylightSaving;
          delete rows[0].bazi.time.standard;
          rows[0].aiHistory = [{ q: '旧问题', a: '旧回答', mode: 'brief', time: 'test' }];
        } else {
          delete rows[0].natalSnapshot.input.useDaylightSaving;
          delete rows[0].localBirthData.useDaylightSaving;
          rows[0].aiHistory = [{ id: 'old-answer', question: '旧问题', answer: '旧回答', model: 'test', createdAt: new Date().toISOString(), horoscopeSnapshot: null }];
        }
        localStorage.setItem(key, JSON.stringify(rows));
      }, kind);
      await page.reload();
      if (kind === 'bazi') {
        await page.getByRole('button', { name: '保存记录', exact: true }).click();
        await page.locator('button[onclick^="loadBaziRecord("]').first().click();
      } else await page.locator('[data-open-record]').first().click();
      await edit(page, kind);
      assert.equal(await option.isChecked(), false);
      await page.locator(kind === 'bazi' ? '#personName' : '#personLabel').fill('校时测试改名');
      await submit(page, kind);
      assert.equal((await records(page, kind))[0].aiHistory.length, 1);
      await edit(page, kind);
      await option.check();
      page.once('dialog', dialog => dialog.dismiss());
      await submit(page, kind);
      assert.equal((await records(page, kind))[0].aiHistory.length, 1);
      page.once('dialog', dialog => dialog.accept());
      await submit(page, kind);
      assert.equal((await records(page, kind))[0].aiHistory.length, 0);
      assert.equal((await records(page, kind))[0].id, id);
      await edit(page, kind);
      await setClock(page, kind, '1992-07-01', '12:00');
      assert.equal(await option.isChecked(), false);
      assert.equal(await option.isDisabled(), true);
      await setClock(page, kind, '1990-04-15', '02:30');
      await option.check();
      assert.match(await preview.textContent(), /没有02:00至02:59/);
      if (kind === 'bazi') page.once('dialog', dialog => dialog.accept());
      await submit(page, kind);
      assert.equal((await records(page, kind))[0].id, id);
      assert.equal(kind === 'bazi' ? (await records(page, kind))[0].bazi.time.input.month : (await records(page, kind))[0].natalSnapshot.input.sourceDate, kind === 'bazi' ? 7 : '1990-07-01');
      await setClock(page, kind, '1990-09-16', '01:30');
      assert.match(await preview.textContent(), /出现两次/);
      await setClock(page, kind, '1990-07-01', '00:30');
      if (kind === 'bazi') await page.locator('#birthTimeDisplay').click();
      else if (await page.locator('#statusBanner').isVisible()) await page.locator('#statusBanner').click();
      for (const width of [1440, 768, 390]) {
        await page.setViewportSize({ width, height: 1000 });
        await option.scrollIntoViewIfNeeded();
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${kind} ${width}px page overflow`);
        await screenshot(page, `${kind}-${width}-input`);
        const help = page.getByRole('button', { name: '夏令时适用时间说明', exact: true });
        await help.click();
        const popover = page.locator(kind === 'bazi' ? '#explain-help-daylight-saving' : '#zwTermPopTitle').first();
        await popover.waitFor({ state: 'visible' });
        const content = kind === 'bazi' ? popover : page.locator('[data-zw-pop-close]').locator('..').locator('..');
        assert.match(await content.textContent(), /1986年/);
        assert.match(await content.textContent(), /1991年/);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${kind} ${width}px help overflow`);
        await screenshot(page, `${kind}-${width}-help`);
        await page.keyboard.press('Escape');
        await popover.waitFor({ state: 'hidden' });
      }
      assert.deepEqual(errors, []);
      await context.close();
    }
    console.log('PASS birth-time UI: DST/cross-date, record restoration, legacy AI protection, rejected gap, date reset, existing help at 1440/768/390px');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
