import {test} from 'node:test';
import assert from 'node:assert/strict';
import {pricing} from '../server/db.js';
const env={DB:{batch:async()=>[],prepare(){return {bind(){return this},run:async()=>({})}}}};
test('client-approved pricing matrix is authoritative',async()=>{
 const a=await pricing(env,{serviceId:'new-registration',length:11,intendedUse:'PRIVATE',mmsi:'POLISH_MMSI',priority:'STANDARD',delivery:'REGISTERED_MAIL'});
 assert.equal(a.amountMinor,61400);
 const b=await pricing(env,{serviceId:'ownership-transfer',length:6,intendedUse:'COMMERCIAL',mmsi:'NONE',priority:'EXPRESS',delivery:'DHL_EXPRESS'});
 assert.equal(b.amountMinor,109000);
 const c=await pricing(env,{serviceId:'duplicate-polish-registration',length:24,intendedUse:'BAREBOAT',mmsi:'POLISH_MMSI',priority:'FAST',delivery:'REGISTERED_MAIL'});
 assert.equal(c.amountMinor,126300);
});
test('renewal and unsupported vessel lengths are rejected',async()=>{
 await assert.rejects(()=>pricing(env,{serviceId:'new-registration',length:0.5,intendedUse:'PRIVATE',mmsi:'NONE',priority:'STANDARD',delivery:'REGISTERED_MAIL'}));
 await assert.rejects(()=>pricing(env,{serviceId:'registration-renewal',length:8,intendedUse:'PRIVATE',mmsi:'NONE',priority:'STANDARD',delivery:'REGISTERED_MAIL'}));
 await assert.rejects(()=>pricing(env,{serviceId:'new-registration',length:25,intendedUse:'PRIVATE',mmsi:'NONE',priority:'STANDARD',delivery:'REGISTERED_MAIL'}));
});
