import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
// Approved cinematic hero baseline at the start of this continuation.
const baseline='e6365b803a0be8c54929613c9f71ca380b9b7e02';
test('Approved cinematic hero markup, shared styles and media remain unchanged',async()=>{
  const original=path=>execFileSync('git',['show',`${baseline}:${path}`],{maxBuffer:50*1024*1024});
  const hero=html=>html.match(/<section class="hero hero-v2">[\s\S]*?<\/section>/)?.[0];
  assert.equal(hero(await readFile('public/index.html','utf8')),hero(original('public/index.html').toString()));
  for(const path of ['public/style.css','public/yacht.jpg','public/media/ocean-yacht-hero.mp4'])assert.deepEqual(await readFile(path),original(path),path);
});
