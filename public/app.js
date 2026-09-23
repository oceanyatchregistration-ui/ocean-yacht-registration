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
async function loadPublicContact(){try{const r=await fetch('/api/public-config');const c=await r.json();const email=document.querySelector('#floating-email'),wa=document.querySelector('#floating-whatsapp');if(c.contactEmail)email.href=`mailto:${c.contactEmail}`;if(c.whatsapp){const digits=String(c.whatsapp).replace(/\D/g,'');if(digits){wa.href=`https://wa.me/${digits}`;wa.target='_blank';wa.rel='noopener noreferrer';}}if(c.contactEmail||c.whatsapp){[email,wa].forEach(a=>{if(a.getAttribute('href')==='#contact')a.hidden=true;});}}catch{}}
loadPublicContact();


// Below-fold motion system. The locked hero is deliberately excluded.
if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  document.documentElement.classList.add('motion-ready');
  const groups=[
    ['.proof-grid > div','motion-scale'],
    ['#services .section-heading > *',''],
    ['.service-grid .service-card',''],
    ['.marine-grid .marine-image','motion-left'],
    ['.marine-grid > div:last-child','motion-right'],
    ['#journey .section-heading > *',''],
    ['.process-grid article',''],
    ['#pricing .section-heading > *',''],
    ['.price-grid article','motion-scale'],
    ['#pricing .addons','#pricing .pricing-note'],
    ['#reviews .section-heading > *',''],
    ['#review-list','.review-submit'],
    ['#contact .contact-grid > div','motion-left'],
    ['#contact #enquiry','motion-right'],
    ['#questions > div:first-child','motion-left'],
    ['#questions .faq-list','motion-right'],
    ['.closing > *','']
  ];
  const nodes=[];
  groups.forEach((group)=>{
    const selector=group[0],variant=group[1]||'';
    document.querySelectorAll(selector).forEach((el,index)=>{
      if(el.closest('.hero'))return;
      el.classList.add('motion-reveal');
      if(variant)el.classList.add(variant);
      el.style.setProperty('--motion-delay',Math.min(index,4)*75+'ms');
      nodes.push(el);
    });
  });
  const observer=new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  },{threshold:.12,rootMargin:'0px 0px -6% 0px'});
  nodes.forEach(el=>observer.observe(el));
}
