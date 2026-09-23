import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const browser=await chromium.launch({headless:true,executablePath:process.env.OYR_BROWSER_EXECUTABLE||undefined,args:process.env.OYR_BROWSER_ARGS?JSON.parse(process.env.OYR_BROWSER_ARGS):[]});
const origin=process.env.OYR_TEST_ORIGIN||'http://127.0.0.1:5173';
await mkdir('work/qa',{recursive:true});
try {
  for (const width of [1440,768,390,320]) {
    const page=await browser.newPage({viewport:{width,height:900}});
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    const response=await page.goto(origin);
    assert.equal(response.status(),200);
    await page.waitForFunction(()=>document.querySelector('.service-row').style.opacity==='0');
    for(const selector of ['.proof-deck','.registry-course','.services-v3','.marine-feature-v3','.journey-v3','.pricing-v3','.contact-v3','.faq-v3','.closing-v3']){
      const section=page.locator(selector);
      await section.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1300);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`No overflow at ${width}: ${selector}`);
      assert.equal(await section.evaluate(el=>[...el.querySelectorAll('h2')].every(h=>getComputedStyle(h).opacity!=='0')),true);
      if(['.marine-feature-v3','.services-v3','.journey-v3'].includes(selector)) await section.screenshot({path:`work/qa/motion-${width}-${selector.slice(1)}.png`});
    }
    await page.locator('.service-row').nth(1).click();
    assert.equal(await page.locator('#service').inputValue(),'ownership-transfer');
    await page.locator('.faq-list summary').first().click();
    assert.equal(await page.locator('.faq-list details').first().getAttribute('open'),'');
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.waitForTimeout(100);
    assert.equal(await page.locator('.service-row').first().evaluate(el=>getComputedStyle(el).opacity),'1');
    assert.equal(await page.locator('.marine-image img').evaluate(el=>getComputedStyle(el).transform),'none');
    assert.equal(await page.locator('.marine-image img').evaluate(el=>el.complete&&el.naturalWidth>0),true);
    assert.deepEqual(errors,[]);
    await page.close();
    console.log(`Motion, image, interactions, reduced-motion and overflow checks passed at ${width}px`);
  }
  const page=await browser.newPage({javaScriptEnabled:false});
  await page.goto(origin);
  assert.equal(await page.locator('.service-row').first().evaluate(el=>getComputedStyle(el).opacity),'1');
  assert.equal(await page.locator('.closing-v3 h2').evaluate(el=>getComputedStyle(el).opacity),'1');
  console.log('No-JavaScript content fallback passed');
} finally {await browser.close();}
