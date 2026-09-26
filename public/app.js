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


/* Cinematic hero playlist: deterministic dual-layer loop with seamless preloading. */
(function initHeroPlaylist(){
  const layers=[document.querySelector('.hero-video-a'),document.querySelector('.hero-video-b')];
  if(layers.some(v=>!v))return;

  const playlist=[
    '/media/hero-yacht-01.mp4',
    '/media/hero-yacht-02.mp4',
    '/media/hero-yacht-03.mp4'
  ];
  const CROSSFADE_MS=900;
  const TRANSITION_LEAD=2.25;
  let active=0;
  let index=0;
  let transitioning=false;

  function setSource(video,src){
    if(video.dataset.playlistSrc===src)return;
    video.dataset.playlistSrc=src;
    video.preload='auto';
    video.src=src;
    video.load();
  }

  function preloadNext(){
    const next=layers[1-active];
    setSource(next,playlist[(index+1)%playlist.length]);
  }

  function ready(video){
    if(video.readyState>=3)return Promise.resolve();
    return new Promise((resolve,reject)=>{
      let done=false;
      const finish=ok=>{
        if(done)return;
        done=true;
        cleanup();
        ok?resolve():reject(new Error('Hero video failed to buffer'));
      };
      const cleanup=()=>{
        video.removeEventListener('canplay',onReady);
        video.removeEventListener('playing',onReady);
        video.removeEventListener('error',onError);
        clearTimeout(timer);
      };
      const onReady=()=>finish(true);
      const onError=()=>finish(false);
      video.addEventListener('canplay',onReady,{once:true});
      video.addEventListener('playing',onReady,{once:true});
      video.addEventListener('error',onError,{once:true});
      const timer=setTimeout(()=>finish(video.readyState>=2),8000);
    });
  }

  async function advance(){
    if(transitioning)return;
    transitioning=true;

    const from=layers[active];
    const nextLayer=1-active;
    const to=layers[nextLayer];
    const nextIndex=(index+1)%playlist.length;

    setSource(to,playlist[nextIndex]);

    try{
      await ready(to);
      to.currentTime=0;
      await to.play();

      /* Wait for actual playback before exposing the incoming layer. */
      if(to.paused)throw new Error('Incoming hero video did not start');
      to.classList.add('is-active');
      from.classList.remove('is-active');

      window.setTimeout(()=>{
        from.pause();
        from.currentTime=0;
        active=nextLayer;
        index=nextIndex;
        transitioning=false;
        preloadNext();
      },CROSSFADE_MS);
    }catch{
      transitioning=false;
      /* Keep the current layer moving if the incoming clip cannot start yet. */
      if(from.paused&&!from.ended)from.play().catch(()=>{});
    }
  }

  layers.forEach(video=>{
    video.muted=true;
    video.playsInline=true;
    video.preload='auto';

    video.addEventListener('timeupdate',()=>{
      if(video!==layers[active]||transitioning||!Number.isFinite(video.duration)||video.duration<=0)return;
      if(video.duration-video.currentTime<=TRANSITION_LEAD)advance();
    });

    video.addEventListener('ended',()=>{
      if(video===layers[active])advance();
    });

    video.addEventListener('stalled',()=>{
      if(video===layers[active]&&video.paused&&!video.ended)video.play().catch(()=>{});
    });
  });

  /* Own the initial source as well; do not mix HTML <source> state with JS playlist state. */
  const first=layers[0];
  setSource(first,playlist[0]);
  first.classList.add('is-active');
  layers[1].classList.remove('is-active');

  ready(first)
    .then(()=>first.play())
    .then(preloadNext)
    .catch(()=>{ preloadNext(); });
})();
