function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function configured(env){return Boolean(env.RESEND_API_KEY&&env.EMAIL_FROM_ADDRESS);}
async function send(env,{to,subject,html}){
 if(!configured(env))return {sent:false,reason:'not-configured'};
 const payload={from:env.EMAIL_FROM_ADDRESS,to:Array.isArray(to)?to:[to],subject,html};
 if(env.EMAIL_REPLY_TO)payload.reply_to=env.EMAIL_REPLY_TO;
 const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(payload)});
 if(!r.ok)throw new Error(`Email provider returned ${r.status}`);
 return {sent:true};
}
export async function safeEmail(env,message){try{return await send(env,message);}catch(e){console.error('OYR email delivery failed',{error:e?.message,subject:message.subject});return {sent:false,reason:'provider-error'};}}
export function submissionEmails(env,a){const appUrl=(env.APP_URL||'').replace(/\/$/,'');const track=appUrl?`${appUrl}/track`:'';const customer={to:a.email,subject:`Application received — ${a.reference}`,html:`<h1>Application received</h1><p>Thank you, ${esc(a.name)}. Your Ocean Yacht Registration application has been received.</p><p><strong>Reference:</strong> ${esc(a.reference)}</p><p><strong>Service:</strong> ${esc(a.service)}</p>${track?`<p>Track your application at <a href="${esc(track)}">${esc(track)}</a> using your reference and application email.</p>`:''}<p>We will contact you if further information is required.</p>`};
 const admins=(env.ADMIN_EMAILS||'').split(',').map(x=>x.trim()).filter(Boolean);const admin=admins.length?{to:admins,subject:`New application ${a.reference}`,html:`<h1>New application</h1><p><strong>Reference:</strong> ${esc(a.reference)}</p><p><strong>Applicant:</strong> ${esc(a.name)} (${esc(a.email)})</p><p><strong>Vessel:</strong> ${esc(a.vessel)}</p><p><strong>Service:</strong> ${esc(a.service)}</p>${appUrl?`<p><a href="${esc(appUrl+'/admin/applications/'+a.reference)}">Review application</a></p>`:''}`}:null;return {customer,admin};}
export function statusEmail(env,a,message){const appUrl=(env.APP_URL||'').replace(/\/$/,'');return {to:a.email,subject:`Application ${a.reference} — ${String(a.status).replaceAll('_',' ')}`,html:`<h1>Application update</h1><p>Your Ocean Yacht Registration application <strong>${esc(a.reference)}</strong> is now <strong>${esc(String(a.status).replaceAll('_',' '))}</strong>.</p>${message?`<p>${esc(message)}</p>`:''}${appUrl?`<p><a href="${esc(appUrl+'/track')}">Track your application</a></p>`:''}`};}
