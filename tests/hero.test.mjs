import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('Approved cinematic hero assets and markup remain present',async()=>{
  const html=await readFile('public/index.html','utf8');
  const css=await readFile('public/style.css','utf8');
  const video=await readFile('public/media/ocean-yacht-hero.mp4');
  const poster=await readFile('public/yacht.jpg');

  const hero=html.match(/<section class="hero hero-v2">[\s\S]*?<\/section>/)?.[0]||'';
  assert.ok(hero,'cinematic hero section is missing');
  assert.match(hero,/class="hero-video(?:\s[^\"]*)?"/,'hero video element is missing');
  assert.match(hero,/\/media\/ocean-yacht-hero\.mp4/,'approved hero video source is missing');
  assert.match(hero,/Registration,[\s\S]*worthy of the yacht\./,'approved restored hero headline is missing');
  assert.match(hero,/Start your registration/,'approved hero CTA is missing');
  assert.match(hero,/Explore the process/,'approved hero secondary action is missing');

  for(const selector of ['.hero-v2','.hero-media','.hero-video','.hero-wash','.hero-shell']){
    assert.ok(css.includes(selector),`required hero styling is missing: ${selector}`);
  }
  assert.ok(video.length>1024*1024,'hero video asset is unexpectedly small');
  assert.ok(poster.length>10000,'hero poster asset is unexpectedly small');
});
