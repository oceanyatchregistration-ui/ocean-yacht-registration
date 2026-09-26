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


/* Hero playlist: robust single-player sequencing. */
(function initHeroPlaylist(){
  const primary=document.querySelector('.hero-video-a');
  const secondary=document.querySelector('.hero-video-b');
  if(!primary)return;

  const playlist=[
    '/media/hero-yacht-01.mp4',
    '/media/hero-yacht-02.mp4',
    '/media/hero-yacht-03.mp4'
  ];
  let index=0;
  let switching=false;

  /* The second layer is intentionally retired: one media element avoids decoder/state
     races on cold loads while preserving the approved hero composition. */
  if(secondary){
    secondary.pause();
    secondary.removeAttribute('src');
    secondary.load();
    secondary.classList.remove('is-active');
    secondary.hidden=true;
  }

  primary.muted=true;
  primary.playsInline=true;
  primary.preload='auto';
  primary.classList.add('is-active');

  function sourceAt(i){return playlist[i%playlist.length]}

  function playIndex(i){
    if(switching)return;
    switching=true;
    index=(i+playlist.length)%playlist.length;
    const src=sourceAt(index);

    if(primary.dataset.playlistSrc!==src){
      primary.dataset.playlistSrc=src;
      primary.src=src;
      primary.load();
    }

    const start=()=>{
      primary.removeEventListener('canplay',start);
      primary.play()
        .catch(()=>{})
        .finally(()=>{switching=false});
    };

    if(primary.readyState>=3)start();
    else{
      primary.addEventListener('canplay',start,{once:true});
      /* Never leave the playlist permanently locked if a browser delays canplay. */
      window.setTimeout(()=>{
        if(!switching)return;
        primary.removeEventListener('canplay',start);
        primary.play().catch(()=>{}).finally(()=>{switching=false});
      },2500);
    }
  }

  primary.addEventListener('ended',()=>playIndex(index+1));

  /* If network buffering stalls, resume the same clip rather than changing layers. */
  primary.addEventListener('stalled',()=>{
    if(primary.paused&&!primary.ended)primary.play().catch(()=>{});
  });

  primary.addEventListener('error',()=>{
    switching=false;
    window.setTimeout(()=>playIndex(index+1),150);
  });

  /* Warm the browser cache for the next two clips without creating competing decoders. */
  playlist.slice(1).forEach(src=>{
    const link=document.createElement('link');
    link.rel='preload';
    link.as='video';
    link.href=src;
    document.head.appendChild(link);
  });

  primary.dataset.playlistSrc=playlist[0];
  if(primary.currentSrc&&!primary.currentSrc.endsWith(playlist[0])){
    primary.src=playlist[0];
    primary.load();
  }
  primary.play().catch(()=>{});
})();
