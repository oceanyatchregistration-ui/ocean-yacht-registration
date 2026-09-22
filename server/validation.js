export class HttpError extends Error { constructor(status,message){super(message);this.status=status;} }
export const STATES=['DRAFT','SUBMITTED','UNDER_REVIEW','ADDITIONAL_DOCUMENTS_REQUIRED','PROCESSING','COMPLETED','CANCELLED'];
export const TRANSITIONS={SUBMITTED:['UNDER_REVIEW','CANCELLED'],UNDER_REVIEW:['ADDITIONAL_DOCUMENTS_REQUIRED','PROCESSING','CANCELLED'],ADDITIONAL_DOCUMENTS_REQUIRED:['UNDER_REVIEW','CANCELLED'],PROCESSING:['ADDITIONAL_DOCUMENTS_REQUIRED','COMPLETED','CANCELLED'],COMPLETED:[],CANCELLED:[]};
export const DOCUMENT_TYPES=['Proof of ownership','Identity document','Existing registration','Vessel specification','Other supporting document'];
export const CONSENT_VERSION='oyr-registration-v1';
export const SERVICE_CONFIG=[
{id:'new-registration',name:'New Polish flag registration'},
{id:'ownership-transfer',name:'Change of ownership'},
{id:'modification-polish-registration',name:'Modification of Polish registration'},
{id:'polish-deletion-certificate',name:'Polish deletion certificate'},
{id:'duplicate-polish-registration',name:'Duplicate Polish registration'}
];
export function object(v){if(!v||typeof v!=='object'||Array.isArray(v))throw new HttpError(400,'Please provide valid form data.');return v;}
export function string(v,label,max=200,required=true){if(typeof v!=='string'){if(!required&&(v==null))return '';throw new HttpError(400,`${label} is required.`);}const s=v.trim();if((required&&!s)||s.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(s))throw new HttpError(400,`Please check ${label.toLowerCase()}.`);return s;}
export function email(v){const s=string(v,'Email',254).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))throw new HttpError(400,'Enter a valid email address.');return s;}
export function number(v,label,min,max,integer=false){const n=Number(v);if(v===''||v==null||!Number.isFinite(n)||n<min||n>max||(integer&&!Number.isInteger(n)))throw new HttpError(400,`Please check ${label.toLowerCase()}.`);return n;}
function choice(v,label,allowed){const s=string(v,label,40);if(!allowed.includes(s))throw new HttpError(400,`Choose a valid ${label.toLowerCase()}.`);return s;}
export function validateStep(step,data){const d=object(data);if(step==='package')return {
 serviceId:string(d.serviceId,'Service',60),
 length:number(d.length,'Vessel length',1,24),
 intendedUse:choice(d.intendedUse,'Intended use',['PRIVATE','COMMERCIAL','BAREBOAT']),
 mmsi:choice(d.mmsi,'Radio license',['NONE','POLISH_MMSI']),
 priority:choice(d.priority,'Processing priority',['STANDARD','FAST','EXPRESS']),
 delivery:choice(d.delivery,'Delivery method',['REGISTERED_MAIL','DHL_EXPRESS'])
};
if(step==='applicant')return {type:'INDIVIDUAL',name:string(d.name,'Full/legal name'),email:email(d.email),phone:string(d.phone,'Phone',40),address:string(d.address,'Address',300),city:string(d.city,'City',100),postalCode:string(d.postalCode,'Postal code',30,false),country:string(d.country,'Country',100)};
if(step==='yacht')return {name:string(d.name,'Vessel name',120),type:string(d.type,'Vessel type',80),builder:string(d.builder,'Builder',120,false),model:string(d.model,'Model',120,false),buildYear:d.buildYear?number(d.buildYear,'Build year',1800,new Date().getUTCFullYear()+1,true):null,identification:string(d.identification,'Hull identification',120,false),currentFlag:string(d.currentFlag,'Current flag/registration',180,false)};
throw new HttpError(400,'Unknown registration step.');}
export function validateApplication(payload){const p=object(payload);return {package:validateStep('package',p.package),applicant:validateStep('applicant',p.applicant),yacht:validateStep('yacht',p.yacht)};}
export function validateTransition(from,to){if(!TRANSITIONS[from]?.includes(to))throw new HttpError(409,'This status transition is not available. Refresh the application and try again.');}
export function validateFile(file,bytes){if(!file||typeof file.name!=='string'||!bytes.length||bytes.length>10*1024*1024)throw new HttpError(400,'Choose a file between 1 byte and 10 MB.');const allowed={'application/pdf':{ext:/\.pdf$/i,signature:[37,80,68,70,45]},'image/png':{ext:/\.png$/i,signature:[137,80,78,71,13,10,26,10]},'image/jpeg':{ext:/\.jpe?g$/i,signature:[255,216,255]}};const rule=allowed[file.type];if(!rule||!rule.ext.test(file.name)||!rule.signature.every((v,i)=>bytes[i]===v))throw new HttpError(400,'Only valid PDF, JPEG and PNG files are accepted.');return string(file.name.replaceAll('\\','/').split('/').pop(),'Filename',180);}
