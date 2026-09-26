import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {getPlatformProxy} from 'wrangler';
import {readFile,readdir,mkdir,rm} from 'node:fs/promises';
import worker from '../dist/server/index.js';
let platform,env,app,reference,version,docId;
const origin='https://ocean.test';
const pdf=new TextEncoder().encode('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF');
const adminEmail='admin@example.com';
let adminCookie='';
async function call(path,{method='GET',body,cookie='',headers={}}={}){const h={origin,'x-oyr-request':'1',...headers};if(cookie)h.cookie=cookie;if(body&&!(body instanceof FormData))h['content-type']='application/json';const req=new Request(origin+path,{method,headers:h,body:body instanceof FormData?body:body?JSON.stringify(body):undefined});const res=await worker.fetch(req,env,{});const data=res.headers.get('content-type')?.includes('application/json')?await res.json():await res.text();return {status:res.status,data,headers:res.headers};}
async function draft(){const r=await call('/api/draft',{method:'POST'});assert.equal(r.status,201);return {cookie:r.headers.get('set-cookie').split(';')[0],data:r.data};}
async function fill(session){let r;const values={package:{serviceId:'new-registration',length:11,intendedUse:'PRIVATE',mmsi:'POLISH_MMSI',priority:'STANDARD',delivery:'REGISTERED_MAIL',price:1,status:'COMPLETED'},applicant:{name:'Workflow Test',email:'workflow@example.test',phone:'+44123456789',address:'1 Test Harbour',city:'Port Test',postalCode:'T1',country:'United Kingdom',role:'ADMIN'},yacht:{name:'Test Horizon',type:'Motor yacht',builder:'Test Builder',model:'18',buildYear:2022,identification:'TEST-18',beam:5.2,draft:1.8,placeOfBuild:'Gdansk'}};for(const [step,data] of Object.entries(values)){r=await call('/api/draft',{method:'PATCH',cookie:session.cookie,body:{step,data,version:session.data.version}});assert.equal(r.status,200);session.data=r.data;}const file=new FormData();file.set('type','Proof of ownership');file.set('file',new File([pdf],'ownership.pdf',{type:'application/pdf'}));r=await call('/api/draft/documents',{method:'POST',cookie:session.cookie,body:file});assert.equal(r.status,201);session.data=r.data;return session;}
before(async()=>{await mkdir('work',{recursive:true});platform=await getPlatformProxy({configPath:'wrangler.jsonc',persist:{path:'work/integration-db-'+Date.now()}});env=platform.env;env.ADMIN_EMAILS=adminEmail;env.TEST_ADMIN_AUTH='1';env.ADMIN_SESSION_SECRET='test-session-secret-that-is-at-least-32-characters-long';const files=(await readdir('drizzle')).filter(f=>f.endsWith('.sql')).sort();for(const file of files){const sql=await readFile('drizzle/'+file,'utf8');for(const part of sql.split('--> statement-breakpoint').map(x=>x.trim()).filter(Boolean))await env.DB.prepare(part).run();}});
after(async()=>{await platform?.dispose();});
test('Complete persisted workflow, privacy and authorization',async()=>{
assert.equal((await call('/api/admin/applications')).status,401);
assert.equal((await call('/api/test/admin-session',{method:'POST',body:{email:'stranger@example.test'}})).status,403);
const login=await call('/api/test/admin-session',{method:'POST',body:{email:adminEmail}});assert.equal(login.status,200);adminCookie=login.headers.get('set-cookie').split(';')[0];assert.match(login.headers.get('set-cookie'),/HttpOnly/);assert.match(login.headers.get('set-cookie'),/SameSite=Strict/);
const adminRegistry=await call('/api/admin/admins',{cookie:adminCookie});assert.equal(adminRegistry.status,200);assert.equal(adminRegistry.data.count,1);assert.equal(adminRegistry.data.items[0].email,adminEmail);
assert.equal((await call('/api/draft',{method:'POST',headers:{origin:'https://evil.test'}})).status,403);
app=await fill(await draft());docId=app.data.documents[0].id;
const other=await draft();assert.equal((await call('/api/draft/documents/'+docId,{method:'DELETE',cookie:other.cookie})).status,404);
assert.equal((await call('/api/admin/documents/'+docId)).status,401);
assert.equal((await call('/api/draft/submit',{method:'POST',cookie:app.cookie,body:{version:app.data.version,consent:false,consentVersion:'oyr-registration-v1'}})).status,400);
const invalidFile=new FormData();invalidFile.set('type','Other supporting document');invalidFile.set('file',new File(['<script>alert(1)</script>'],'fake.pdf',{type:'application/pdf'}));assert.equal((await call('/api/draft/documents',{method:'POST',cookie:app.cookie,body:invalidFile})).status,400);
const r=await call('/api/draft/submit',{method:'POST',cookie:app.cookie,body:{version:app.data.version,consent:true,consentVersion:'oyr-registration-v1',price:1,status:'COMPLETED',customerId:'attacker'}});assert.equal(r.status,201);assert.match(r.data.reference,/^C[0-9]{3,4}PL$/);assert.equal(r.data.reference,'C990PL');assert.equal(r.data.status,'SUBMITTED');assert.equal(r.data.pricing.mode,'FIXED');assert.equal(r.data.pricing.amountMinor,61400);assert.equal(r.data.pricing.currency,'EUR');reference=r.data.reference;
const again=await call('/api/draft/submit',{method:'POST',cookie:app.cookie,body:{}});assert.equal(again.data.reference,reference);
const row=await env.DB.prepare('SELECT * FROM applications WHERE reference=?').bind(reference).first();assert.equal(row.status,'SUBMITTED');assert.ok(row.customer_id);assert.ok(row.vessel_id);assert.ok(row.submitted_at);assert.ok(row.consent_at);assert.notEqual(row.id,reference);
assert.equal((await env.DB.prepare('SELECT count(*) AS n FROM application_status_history WHERE application_id=?').bind(row.id).first()).n,1);
assert.equal((await env.DB.prepare('SELECT count(*) AS n FROM notifications WHERE application_id=?').bind(row.id).first()).n,1);
const list=await call('/api/admin/applications',{cookie:adminCookie});assert.equal(list.status,200);assert.equal(list.data.items[0].reference,reference);
let detail=await call('/api/admin/applications/'+reference,{cookie:adminCookie});assert.equal(detail.data.customer.name,'Workflow Test');assert.equal(detail.data.vessel.name,'Test Horizon');assert.equal(detail.data.vessel.beam,5.2);assert.equal(detail.data.vessel.draft,1.8);assert.equal(detail.data.vessel.placeOfBuild,'Gdansk');assert.equal(detail.data.documents.length,1);version=detail.data.version;
const download=await call('/api/admin/documents/'+docId,{cookie:adminCookie});assert.equal(download.status,200);assert.match(download.headers.get('content-disposition'),/^attachment/);assert.match(download.data,/%PDF/);
assert.equal((await call('/api/admin/applications/'+reference+'/status',{method:'POST',cookie:adminCookie,body:{status:'COMPLETED',version}})).status,409);
assert.equal((await call('/api/admin/applications/'+reference+'/status',{method:'POST',cookie:adminCookie,body:{status:'UNDER_REVIEW',version,message:'Your documents are being reviewed.'}})).status,200);
assert.equal((await call('/api/admin/applications/'+reference+'/status',{method:'POST',cookie:adminCookie,body:{status:'PROCESSING',version,message:'stale'}})).status,409);
const track=await call('/api/track',{method:'POST',body:{reference,email:'workflow@example.test'}});assert.equal(track.data.application.status,'UNDER_REVIEW');assert.equal(track.data.application.history.length,2);assert.equal(track.data.application.history[1].message,'Your documents are being reviewed.');for(const forbidden of ['customer_id','vessel_id','storage_key','changedBy','actor','email','phone','address','identity'])assert.ok(!JSON.stringify(track.data).includes(forbidden),forbidden);
const bad=await call('/api/track',{method:'POST',body:{reference,email:'wrong@example.test'}});const missing=await call('/api/track',{method:'POST',body:{reference:'C9999PL',email:'wrong@example.test'}});assert.deepEqual(bad.data,missing.data);
await assert.rejects(()=>env.DB.prepare("UPDATE application_status_history SET to_status='COMPLETED' WHERE application_id=?").bind(row.id).run());
await assert.rejects(()=>env.DB.prepare('DELETE FROM application_status_history WHERE application_id=?').bind(row.id).run());
assert.equal((await call('/api/draft',{method:'PATCH',cookie:app.cookie,body:{step:'package',data:{},version}})).status,409);
const logout=await call('/api/admin/logout',{method:'POST',cookie:adminCookie});assert.equal(logout.status,200);assert.match(logout.headers.get('set-cookie'),/Max-Age=0/);assert.equal((await call('/api/admin/me',{cookie:'oyr_admin='})).status,401);
});
test('Server validates data, draft versions and upload limits',async()=>{const s=await draft();assert.equal((await call('/api/draft/submit',{method:'POST',cookie:s.cookie,body:{version:0,consent:true,consentVersion:'oyr-registration-v1'}})).status,400);assert.equal((await call('/api/draft',{method:'PATCH',cookie:s.cookie,body:{step:'package',version:0,data:{serviceId:'imaginary',length:18,intendedUse:'PRIVATE',mmsi:'NONE',priority:'STANDARD',delivery:'REGISTERED_MAIL'}}})).status,400);assert.equal((await call('/api/draft',{method:'PATCH',cookie:s.cookie,body:{step:'package',version:0,data:{serviceId:'new-registration',length:-1,intendedUse:'PRIVATE',mmsi:'NONE',priority:'STANDARD',delivery:'REGISTERED_MAIL'}}})).status,400);const r=await call('/api/draft',{method:'PATCH',cookie:s.cookie,body:{step:'package',version:0,data:{serviceId:'new-registration',length:18,intendedUse:'PRIVATE',mmsi:'NONE',priority:'STANDARD',delivery:'REGISTERED_MAIL'}}});assert.equal(r.status,200);assert.equal((await call('/api/draft',{method:'PATCH',cookie:s.cookie,body:{step:'package',version:0,data:{serviceId:'new-registration',length:19,intendedUse:'PRIVATE',mmsi:'NONE',priority:'STANDARD',delivery:'REGISTERED_MAIL'}}})).status,409);
const f=new FormData();f.set('type','Other supporting document');f.set('file',new File([new Uint8Array(10*1024*1024+1)],'large.pdf',{type:'application/pdf'}));assert.equal((await call('/api/draft/documents',{method:'POST',cookie:s.cookie,body:f})).status,400);
});
test('Tracking rate limit applies to unsuccessful attempts',async()=>{let last;for(let i=0;i<22;i++)last=await call('/api/track',{method:'POST',body:{reference:'C9998PL',email:'nobody@example.test'},headers:{'cf-connecting-ip':'192.0.2.2'}});assert.equal(last.status,429);});

test('Homepage intake resumes the existing draft and rejects invalid details',async()=>{
  const enquiry={name:'Intake Test',email:'INTAKE@example.test',serviceId:'ownership-transfer',length:8,message:'Existing vessel owner'};
  const created=await call('/api/draft',{method:'POST',body:{enquiry}});
  assert.equal(created.status,201);
  const cookie=created.headers.get('set-cookie').split(';')[0];
  assert.equal(created.data.payload.applicant.email,'intake@example.test');
  const resumed=await call('/api/draft',{method:'POST',cookie,body:{enquiry:{...enquiry,length:12,message:'Updated enquiry'}}});
  assert.equal(resumed.status,200);
  assert.equal(resumed.data.resumedExisting,true);
  assert.equal(resumed.data.payload.package.length,12);
  assert.equal(resumed.data.payload.enquiry.message,'Updated enquiry');
  assert.equal(resumed.data.pricing.amountMinor,81500);
  assert.equal((await call('/api/draft',{method:'POST',cookie,body:{enquiry:{...enquiry,length:25}}})).status,400);
  assert.equal((await call('/api/draft',{cookie})).data.payload.package.length,12);
});

test('Review moderation only publishes approved content and requires administrator access',async()=>{
  const review={name:'Review Test',country:'Test',rating:5,comment:'Review moderation acceptance check'};
  assert.equal((await call('/api/reviews',{method:'POST',body:review})).status,201);
  assert.equal((await call('/api/reviews')).data.items.length,0);
  assert.equal((await call('/api/admin/reviews')).status,401);
  const list=await call('/api/admin/reviews',{cookie:adminCookie});
  const id=list.data.items[0].id;
  assert.equal((await call('/api/admin/reviews/'+id,{method:'PATCH',body:{status:'APPROVED'}})).status,401);
  assert.equal((await call('/api/admin/reviews/'+id,{method:'PATCH',cookie:adminCookie,body:{status:'APPROVED'}})).status,200);
  const published=(await call('/api/reviews')).data.items;
  assert.equal(published.length,1);
  assert.equal(published[0].comment,review.comment);
  assert.equal(published[0].id,undefined);
  assert.equal((await call('/api/admin/reviews/'+id,{method:'PATCH',cookie:adminCookie,body:{status:'REJECTED'}})).status,200);
  assert.equal((await call('/api/reviews')).data.items.length,0);
  assert.equal((await call('/api/admin/reviews/'+id,{method:'DELETE',cookie:adminCookie})).status,200);
});

test('Admin pagination normalizes fractional and unbounded input',async()=>{
  for(const [page,expected] of [['1.5',1],['-2',1],['Infinity',10000],['abc',1]]){
    const response=await call('/api/admin/applications?page='+page,{cookie:adminCookie});
    assert.equal(response.status,200);
    assert.equal(response.data.page,expected);
  }
});

test('Concurrent submission commits once and emits one confirmation per recipient',async()=>{
  const session=await fill(await draft());
  const originalFetch=globalThis.fetch;
  const sent=[];
  env.RESEND_API_KEY='test-only-provider-key';env.EMAIL_FROM_ADDRESS='test@example.test';
  try{
    globalThis.fetch=async(url,options)=>{assert.equal(String(url),'https://api.resend.com/emails');sent.push(JSON.parse(options.body));return new Response('{}',{status:200});};
    const body={version:session.data.version,consent:true,consentVersion:'oyr-registration-v1'};
    const responses=await Promise.all([call('/api/draft/submit',{method:'POST',cookie:session.cookie,body}),call('/api/draft/submit',{method:'POST',cookie:session.cookie,body})]);
    assert.deepEqual(responses.map(r=>r.status).sort(),[200,201]);
    assert.equal(responses[0].data.reference,responses[1].data.reference);
    assert.equal(sent.length,2,'One customer confirmation and one admin notification');
    const row=await env.DB.prepare('SELECT id FROM applications WHERE reference=?').bind(responses[0].data.reference).first();
    assert.equal((await env.DB.prepare('SELECT count(*) AS n FROM application_status_history WHERE application_id=?').bind(row.id).first()).n,1);
  }finally{globalThis.fetch=originalFetch;delete env.RESEND_API_KEY;delete env.EMAIL_FROM_ADDRESS;}
});
