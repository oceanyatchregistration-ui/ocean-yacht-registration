import {test} from 'node:test';
import assert from 'node:assert/strict';
import {storageConfigured,storagePut,storageExists,storageDelete,storageGet} from '../server/storage.js';

const env={SUPABASE_URL:'https://example.supabase.co',SUPABASE_SECRET_KEY:'sb_secret_test',SUPABASE_STORAGE_BUCKET:'registration-documents'};
const originalFetch=globalThis.fetch;
function mock(handler){globalThis.fetch=async(url,init={})=>handler(String(url),init);}
function restore(){globalThis.fetch=originalFetch;}

test('Supabase storage adapter keeps secret server-side and uses private object API',async(t)=>{
  t.after(restore); const seen=[];
  mock(async(url,init)=>{seen.push({url,init});return new Response(init.method==='HEAD'?null:'{}',{status:200});});
  assert.equal(storageConfigured(env),true);
  await storagePut(env,'applications/a/doc',new Uint8Array([1,2]),'application/pdf');
  assert.equal(await storageExists(env,'applications/a/doc'),true);
  await storageDelete(env,'applications/a/doc');
  await storageGet(env,'applications/a/doc');
  assert.match(seen[0].url,/\/storage\/v1\/object\/registration-documents\/applications\/a\/doc$/);
  assert.equal(seen[0].init.headers.Authorization,'Bearer sb_secret_test');
  assert.equal(seen[0].init.headers.apikey,'sb_secret_test');
  assert.equal(seen[1].init.method,'HEAD');
  assert.equal(seen[2].init.method,'DELETE');
  assert.deepEqual(JSON.parse(seen[2].init.body),{prefixes:['applications/a/doc']});
  assert.match(seen[3].url,/\/storage\/v1\/object\/authenticated\/registration-documents\/applications\/a\/doc$/);
});

test('Supabase storage adapter treats missing objects as unavailable',async(t)=>{
  t.after(restore);mock(async()=>new Response(null,{status:404}));
  assert.equal(await storageExists(env,'missing'),false);
  assert.equal(await storageGet(env,'missing'),null);
});
