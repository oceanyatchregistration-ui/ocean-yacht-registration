import {test} from 'node:test';
import assert from 'node:assert/strict';
import {safeEmail,submissionEmails,statusEmail} from '../server/email.js';
const config={APP_URL:'https://ocean.test/',ADMIN_EMAILS:'admin@example.test',RESEND_API_KEY:'test-only-key',EMAIL_FROM_ADDRESS:'Ocean <sender@example.test>'};
const application={reference:'OYR-ABCDEFGH2345',email:'customer@example.test',name:'<script>test</script>',vessel:'Test yacht',service:'Registration',status:'SUBMITTED',documents:1,pricing:{mode:'FIXED',currency:'EUR',amountMinor:61400,items:[{label:'Registration',amountMinor:61400}]}};
test('Confirmation and status messages escape input and contain tracking and booking details',()=>{
  const {customer,admin}=submissionEmails(config,application);
  assert.equal(customer.to,application.email);
  assert.ok(customer.html.includes('614.00'));
  assert.ok(customer.html.includes(application.reference));
  assert.ok(customer.html.includes('https://ocean.test/track'));
  assert.ok(!customer.html.includes('<script>'));
  assert.ok(admin.html.includes('/admin/applications/'+application.reference));
  const update=statusEmail(config,{...application,status:'UNDER_REVIEW'},'<img src=x>');
  assert.ok(!update.html.includes('<img'));
  assert.ok(update.html.includes('UNDER REVIEW'));
});
test('Email adapter sends configured payload and isolates provider failures',async()=>{
  const original=globalThis.fetch;let sent;
  try{
    globalThis.fetch=async(url,options)=>{sent={url,options};return new Response('{}',{status:200});};
    assert.deepEqual(await safeEmail({},submissionEmails(config,application).customer),{sent:false,reason:'not-configured'});
    assert.equal(sent,undefined);
    assert.deepEqual(await safeEmail(config,submissionEmails(config,application).customer),{sent:true});
    assert.equal(sent.url,'https://api.resend.com/emails');
    assert.deepEqual(JSON.parse(sent.options.body).to,[application.email]);
    globalThis.fetch=async()=>new Response('{}',{status:503});
    assert.deepEqual(await safeEmail(config,submissionEmails(config,application).customer),{sent:false,reason:'provider-error'});
  }finally{globalThis.fetch=original;}
});
