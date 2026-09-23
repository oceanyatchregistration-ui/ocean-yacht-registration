import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';

// Approved cinematic hero baseline at the start of this continuation.
const baseline='e6365b803a0be8c54929613c9f71ca380b9b7e02';

test('Approved cinematic hero markup, shared styles and media remain unchanged',async()=>{
  const original=path=>execFileSync('git',['show',`${baseline}:${path}`],{maxBuffer:50*1024*1024});
  const hero=html=>html.match(/<section class="hero hero-v2">[\s\S]*?<\/section>/)?.[0];

  const currentHtml=await readFile('public/index.html','utf8');
  const baselineHtml=original('public/index.html').toString();
  assert.equal(hero(currentHtml),hero(baselineHtml),'hero markup');

  // style.css contains the approved hero styling but also the evolving below-fold
  // homepage. Protect only rules that can affect the hero instead of freezing the
  // entire shared stylesheet.
  const currentCss=await readFile('public/style.css','utf8');
  const baselineCss=original('public/style.css').toString();
  const heroSelectors=[...baselineCss.matchAll(/([^{}]*\b(?:hero|play-ring)\b[^{}]*)\{([^{}]*)\}/g)]
    .map(match=>match[0]);
  for(const rule of heroSelectors){
    assert.ok(currentCss.includes(rule),`approved hero style changed or removed: ${rule.slice(0,80)}`);
  }

  for(const path of ['public/yacht.jpg','public/media/ocean-yacht-hero.mp4']){
    assert.deepEqual(await readFile(path),original(path),path);
  }
});
