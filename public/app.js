const form=document.querySelector('#enquiry');
const service=document.querySelector('#service');
document.querySelectorAll('[data-service]').forEach(link=>link.addEventListener('click',()=>{service.value=link.dataset.service}));
const menu=document.querySelector('.menu-toggle'),nav=document.querySelector('#main-nav');
menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!open));nav.classList.toggle('open',!open);menu.textContent=open?'☰':'×';});
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu?.setAttribute('aria-expanded','false');if(menu)menu.textContent='☰';}));
form?.addEventListener('submit',async event=>{event.preventDefault();const button=form.querySelector('button');button.disabled=true;const box=document.querySelector('#enquiry-error');box.textContent='';try{const d=new FormData(form);const headers={'Content-Type':'application/json','X-OYR-Request':'1'};const response=await fetch('/api/draft',{method:'POST',headers,body:JSON.stringify({enquiry:{name:d.get('name'),email:d.get('email'),serviceId:d.get('service'),length:d.get('length'),message:d.get('message')}})});const draft=await response.json();if(!response.ok)throw new Error(draft.error);if(draft.resumedExisting)sessionStorage.setItem('oyr-resumed-existing','1');location.href='/register';}catch(e){box.textContent=e.message||'Unable to start your application. Please try again.';button.disabled=false;}});
document.querySelector('#year').textContent=new Date().getFullYear();
async function loadReviews(){const box=document.querySelector('#review-list');if(!box)return;try{const r=await fetch('/api/reviews');const data=await r.json();if(data.items?.length){box.hidden=false;box.innerHTML=data.items.map(x=>`<article class="review-card"><span>${'★'.repeat(x.rating)}${'☆'.repeat(5-x.rating)}</span><p>“${String(x.comment).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}”</p><strong>${String(x.name).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</strong><small>${x.country?String(x.country).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])):''}</small></article>`).join('')}else{box.hidden=false;box.innerHTML='<div class="review-empty"><span>★★★★★</span><p>Verified client experiences will appear here after moderation.</p></div>'}}catch{box.hidden=true;}}
const reviewForm=document.querySelector('#review-form');reviewForm?.addEventListener('submit',async e=>{e.preventDefault();const button=reviewForm.querySelector('button'),msg=document.querySelector('#review-message');button.disabled=true;msg.textContent='';try{const body=Object.fromEntries(new FormData(reviewForm));body.rating=Number(body.rating);const r=await fetch('/api/reviews',{method:'POST',headers:{'Content-Type':'application/json','X-OYR-Request':'1'},body:JSON.stringify(body)});const data=await r.json();if(!r.ok)throw new Error(data.error);msg.textContent=data.message;reviewForm.reset();}catch(err){msg.textContent=err.message||'Unable to submit review.';}finally{button.disabled=false;}});
loadReviews();
async function loadPublicContact(){try{const r=await fetch('/api/public-config');const c=await r.json();const email=document.querySelector('#floating-email'),wa=document.querySelector('#floating-whatsapp');if(c.contactEmail)email.href=`mailto:${c.contactEmail}`;if(c.whatsapp){const digits=String(c.whatsapp).replace(/\D/g,'');if(digits){wa.href=`https://wa.me/${digits}`;wa.target='_blank';wa.rel='noopener noreferrer';}}if(c.contactEmail||c.whatsapp){[email,wa].forEach(a=>{if(a.getAttribute('href')==='#contact')a.hidden=true;});}}catch{}}
loadPublicContact();


/* Cinematic hero playlist: buffered dual-video crossfade with cold-load protection. */
(function initHeroPlaylist(){
  const layers=[document.querySelector('.hero-video-a'),document.querySelector('.hero-video-b')];
  if(layers.some(v=>!v))return;
  const playlist=[
    '/media/hero-yacht-01.mp4',
    '/media/hero-yacht-02.mp4',
    '/media/hero-yacht-03.mp4'
  ];
  const fallback='/media/ocean-yacht-hero.mp4';
  const CROSSFADE_MS=1100;
  const LEAD_SECONDS=3;
  let active=0,index=0,transitioning=false;

  const load=(video,src)=>{
    if(video.dataset.src===src)return;
    video.dataset.src=src;
    video.preload='auto';
    video.src=src;
    video.load();
  };
  const nextSrc=()=>playlist[(index+1)%playlist.length];
  const prime=()=>load(layers[1-active],nextSrc());

  const waitUntilPlayable=video=>new Promise((resolve,reject)=>{
    if(video.readyState>=4)return resolve();
    let settled=false;
    const finish=ok=>{
      if(settled)return;
      settled=true;
      cleanup();
      ok?resolve():reject();
    };
    const ready=()=>finish(true);
    const bad=()=>finish(false);
    const cleanup=()=>{
      video.removeEventListener('canplaythrough',ready);
      video.removeEventListener('error',bad);
      clearTimeout(timer);
    };
    video.addEventListener('canplaythrough',ready,{once:true});
    video.addEventListener('error',bad,{once:true});
    const timer=setTimeout(()=>finish(video.readyState>=3),5000);
  });

  layers.forEach(video=>{
    video.preload='auto';
    video.addEventListener('error',()=>{
      if(video.dataset.src!==fallback){
        load(video,fallback);
        video.play().catch(()=>{});
      }
    });
  });

  async function advance(){
    if(transitioning)return;
    transitioning=true;
    const from=layers[active],to=layers[1-active];
    const target=nextSrc();
    load(to,target);
    try{
      await waitUntilPlayable(to);
      to.currentTime=0;
      await to.play();

      /* Do not fade away from the current clip until the incoming frame is rendering. */
      if(to.readyState<2)throw new Error('Incoming hero video has no rendered frame');
      to.classList.add('is-active');
      from.classList.remove('is-active');

      setTimeout(()=>{
        from.pause();
        from.currentTime=0;
        active=1-active;
        index=(index+1)%playlist.length;
        transitioning=false;
        prime();
      },CROSSFADE_MS);
    }catch{
      transitioning=false;
      load(to,fallback);
    }
  }

  layers.forEach(video=>video.addEventListener('timeupdate',()=>{
    if(video!==layers[active]||transitioning||!Number.isFinite(video.duration))return;
    if(video.duration-video.currentTime<=LEAD_SECONDS)advance();
  }));

  /* ended is only an emergency fallback; normal transitions happen while footage is still moving. */
  layers.forEach(video=>video.addEventListener('ended',()=>{
    if(video===layers[active]&&!transitioning)advance();
  }));

  const first=layers[0];
  first.preload='auto';
  first.play().catch(()=>{});
  prime();
})();
