const DEFAULT_BUCKET='registration-documents';

function supabaseConfig(env){
  const url=(env.SUPABASE_URL||'').replace(/\/$/,'');
  const key=env.SUPABASE_SECRET_KEY||'';
  if(!url&&!key)return null;
  if(!url||!key)throw new Error('Supabase document storage is incompletely configured.');
  return {url,key,bucket:env.SUPABASE_STORAGE_BUCKET||DEFAULT_BUCKET};
}

function objectPath(bucket,key){
  return `${encodeURIComponent(bucket)}/${key.split('/').map(encodeURIComponent).join('/')}`;
}

function auth(key,extra={}){
  return {apikey:key,Authorization:`Bearer ${key}`,...extra};
}

async function supabaseRequest(env,path,init={}){
  const cfg=supabaseConfig(env);
  const res=await fetch(`${cfg.url}/storage/v1/${path}`,{...init,headers:auth(cfg.key,init.headers)});
  return res;
}

export function storageConfigured(env){return Boolean(supabaseConfig(env)||env.BUCKET);}

export async function storagePut(env,key,data,contentType){
  const cfg=supabaseConfig(env);
  if(!cfg){
    if(!env.BUCKET)throw new Error('Document storage is not configured.');
    await env.BUCKET.put(key,data,{httpMetadata:{contentType}});
    return;
  }
  const res=await supabaseRequest(env,`object/${objectPath(cfg.bucket,key)}`,{method:'POST',headers:{'Content-Type':contentType,'Cache-Control':'no-store'},body:data});
  if(!res.ok)throw new Error(`Supabase upload failed (${res.status}).`);
}

export async function storageExists(env,key){
  const cfg=supabaseConfig(env);
  if(!cfg)return Boolean(env.BUCKET&&await env.BUCKET.head(key));
  const res=await supabaseRequest(env,`object/${objectPath(cfg.bucket,key)}`,{method:'HEAD'});
  if(res.status===404)return false;
  if(!res.ok)throw new Error(`Supabase object check failed (${res.status}).`);
  return true;
}

export async function storageDelete(env,key){
  const cfg=supabaseConfig(env);
  if(!cfg){
    if(!env.BUCKET)throw new Error('Document storage is not configured.');
    await env.BUCKET.delete(key);
    return;
  }
  const res=await supabaseRequest(env,`object/${encodeURIComponent(cfg.bucket)}`,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({prefixes:[key]})});
  if(!res.ok&&res.status!==404)throw new Error(`Supabase delete failed (${res.status}).`);
}

export async function storageGet(env,key){
  const cfg=supabaseConfig(env);
  if(!cfg){
    if(!env.BUCKET)return null;
    const item=await env.BUCKET.get(key);
    if(!item)return null;
    return {body:item.body};
  }
  const res=await supabaseRequest(env,`object/authenticated/${objectPath(cfg.bucket,key)}`);
  if(res.status===404)return null;
  if(!res.ok)throw new Error(`Supabase download failed (${res.status}).`);
  return {body:res.body};
}
