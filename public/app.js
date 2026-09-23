const form=document.querySelector('#enquiry');
const service=document.querySelector('#service');
document.querySelectorAll('[data-service]').forEach(link=>link.addEventListener('click',()=>{service.value=link.dataset.service}));
const menu=document.querySelector('.menu-toggle'),nav=document.querySelector('#main-nav');
menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!open));nav.classList.toggle('open',!open);menu.textContent=open?'☰':'×';});
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu?.setAttribute('aria-expanded','false');if(menu)menu.textContent='☰';}));
form?.addEventListener('submit',async event=>{event.preventDefault();const button=form.querySelector('button');button.disabled=true;const box=document.querySelector('#enquiry-error');box.textContent='';try{const d=new FormData(form);const headers={'Content-Type':'application/json','X-OYR-Request':'1'};const response=await fetch('/api/draft',{method:'POST',headers,body:JSON.stringify({enquiry:{name:d.get('name'),email:d.get('email'),serviceId:d.get('service'),length:d.get('length'),message:d.get('message')}})});const draft=await response.json();if(!response.ok)throw new Error(draft.error);if(draft.resumedExisting)sessionStorage.setItem('oyr-resumed-existing','1');location.href='/register';}catch(e){box.textContent=e.message||'Unable to start your application. Please try again.';button.disabled=false;}});
document.querySelector('#year').textContent=new Date().getFullYear();
async function loadReviews(){const box=document.querySelector('#review-list');if(!box)return;try{const r=await fetch('/api/reviews');const data=await r.json();if(data.items?.length)box.innerHTML=data.items.map(x=>`<article class="review-card"><span>${'★'.repeat(x.rating)}${'☆'.repeat(5-x.rating)}</span><p>“${String(x.comment).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}”</p><strong>${String(x.name).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</strong><small>${x.country?String(x.country).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])):''}</small></article>`).join('');}catch{}}
const reviewForm=document.querySelector('#review-form');reviewForm?.addEventListener('submit',async e=>{e.preventDefault();const button=reviewForm.querySelector('button'),msg=document.querySelector('#review-message');button.disabled=true;msg.textContent='';try{const body=Object.fromEntries(new FormData(reviewForm));body.rating=Number(body.rating);const r=await fetch('/api/reviews',{method:'POST',headers:{'Content-Type':'application/json','X-OYR-Request':'1'},body:JSON.stringify(body)});const data=await r.json();if(!r.ok)throw new Error(data.error);msg.textContent=data.message;reviewForm.reset();}catch(err){msg.textContent=err.message||'Unable to submit review.';}finally{button.disabled=false;}});
loadReviews();
async function loadPublicContact(){
  try {
    const response=await fetch('/api/public-config');
    if(!response.ok)return;
    const config=await response.json();
    const email=document.querySelector('#floating-email');
    const whatsapp=document.querySelector('#floating-whatsapp');
    if(config.contactEmail&&email){email.href=`mailto:${config.contactEmail}`;email.hidden=false;}
    const digits=String(config.whatsapp||'').replace(/\D/g,'');
    if(digits&&whatsapp){whatsapp.href=`https://wa.me/${digits}`;whatsapp.target='_blank';whatsapp.rel='noopener noreferrer';whatsapp.hidden=false;}
    const contact=document.querySelector('#business-contact');
    if(contact){contact.textContent=[config.contactEmail,config.businessAddress].filter(Boolean).join(' · ');contact.hidden=!contact.textContent;}
  }catch{}
}
loadPublicContact();
