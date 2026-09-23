import {HttpError,SERVICE_CONFIG} from './validation.js';
export function db(env){if(!env.DB)throw new HttpError(503,'Registration is temporarily unavailable. Your form has not been cleared. Please try again.');return env.DB;}
export function stmt(env,sql,...values){return db(env).prepare(sql).bind(...values);}
export async function seedServices(env){
 const active=SERVICE_CONFIG.map(s=>s.id);
 const writes=SERVICE_CONFIG.map(s=>stmt(env,'INSERT INTO services(id,name,active) VALUES(?,?,1) ON CONFLICT(id) DO UPDATE SET name=excluded.name,active=1',s.id,s.name));
 if(writes.length)await db(env).batch(writes);
 const marks=active.map(()=>'?').join(',');
 await stmt(env,`UPDATE services SET active=0 WHERE id NOT IN (${marks})`,...active).run();
}
export async function catalogue(env){await seedServices(env);return SERVICE_CONFIG.map(s=>({id:s.id,name:s.name,pricing:{mode:'CALCULATED',currency:'EUR'},options:[]}));}
const SERVICE_SURCHARGE={
 'new-registration':0,
 'ownership-transfer':35000,
 'modification-polish-registration':24900,
 'polish-deletion-certificate':24900,
 'duplicate-polish-registration':24900
};
export async function pricing(env,packageData){
 await seedServices(env);
 const p=typeof packageData==='string'?{serviceId:packageData}:packageData;
 const service=SERVICE_CONFIG.find(s=>s.id===p?.serviceId);
 if(!service)throw new HttpError(400,'Please choose an available registration service.');
 if(p.length==null)return {mode:'CALCULATED',currency:'EUR',serviceId:service.id,serviceName:service.name};
 const length=Number(p.length); if(!Number.isFinite(length)||length<1||length>24)throw new HttpError(400,'Polish registration pricing is configured for vessels up to 24 metres.');
 const base=length<=7?35000:length<=12?45000:55000;
 const serviceFee=SERVICE_SURCHARGE[service.id];
 const usage={PRIVATE:0,COMMERCIAL:25000,BAREBOAT:25000}[p.intendedUse];
 const radio={NONE:0,POLISH_MMSI:14900}[p.mmsi];
 const priority={STANDARD:0,FAST:5000,EXPRESS:9000}[p.priority];
 const delivery={REGISTERED_MAIL:1500,DHL_EXPRESS:5000}[p.delivery];
 if([serviceFee,usage,radio,priority,delivery].some(v=>v==null))throw new HttpError(400,'Please complete all registration options.');
 const items=[['Vessel length',base],['Service',serviceFee],['Usage',usage],['Polish MMSI radio license',radio],['Processing priority',priority],['Delivery',delivery]].map(([label,amountMinor])=>({label,amountMinor}));
 return {mode:'FIXED',amountMinor:items.reduce((n,x)=>n+x.amountMinor,0),currency:'EUR',serviceId:service.id,serviceName:service.name,items,capturedAt:new Date().toISOString()};
}
export async function hash(s){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',typeof s==='string'?new TextEncoder().encode(s):s))].map(x=>x.toString(16).padStart(2,'0')).join('');}
export const id=()=>crypto.randomUUID();
export const now=()=>new Date().toISOString();
export function randomToken(){return [...crypto.getRandomValues(new Uint8Array(32))].map(x=>x.toString(16).padStart(2,'0')).join('');}
export function reference(){const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';return 'OYR-'+[...crypto.getRandomValues(new Uint8Array(12))].map(b=>chars[b%32]).join('');}
