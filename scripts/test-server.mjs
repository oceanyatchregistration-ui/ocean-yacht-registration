// Disposable, loopback-only acceptance environment using the built production Worker.
// Uses real local D1/R2 bindings; never connects to the production database.
import http from 'node:http';
import {randomUUID} from 'node:crypto';
import {Readable} from 'node:stream';
import {readFile,readdir,rm} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import {getPlatformProxy} from 'wrangler';
import worker from '../dist/server/index.js';
const state=`work/browser-db-${randomUUID()}`;
const platform=await getPlatformProxy({configPath:'wrangler.jsonc',persist:{path:state}});
const env=platform.env;
for(const file of (await readdir('drizzle')).filter(x=>x.endsWith('.sql')).sort()){
  for(const sql of (await readFile('drizzle/'+file,'utf8')).split('--> statement-breakpoint').map(x=>x.trim()).filter(Boolean))await env.DB.prepare(sql).run();
}
const assets=resolve('public');
const types={html:'text/html',css:'text/css',js:'text/javascript',svg:'image/svg+xml',jpg:'image/jpeg',mp4:'video/mp4'};
env.ASSETS={async fetch(request){
  const path=resolve(assets,'.'+new URL(request.url).pathname);
  if(!path.startsWith(assets+sep))return new Response('Not found',{status:404});
  try{return new Response(await readFile(path),{headers:{'Content-Type':types[path.split('.').pop()]||'application/octet-stream'}});}catch{return new Response('Not found',{status:404});}
}};
const server=http.createServer(async(req,res)=>{
  try{
    const origin='http://127.0.0.1:5173';
    const init={method:req.method,headers:req.headers};
    if(!['GET','HEAD'].includes(req.method)){init.body=Readable.toWeb(req);init.duplex='half';}
    const response=await worker.fetch(new Request(origin+req.url,init),env,{waitUntil:p=>p.catch(console.error)});
    res.writeHead(response.status,Object.fromEntries(response.headers));
    if(response.body)Readable.fromWeb(response.body).pipe(res);else res.end();
  }catch(error){console.error(error);res.writeHead(500).end('Test server error');}
});
server.listen(5173,'127.0.0.1',()=>console.log('Acceptance server ready at http://127.0.0.1:5173'));
async function close(){server.closeAllConnections();await new Promise(r=>server.close(r));await platform.dispose();await rm(state,{recursive:true,force:true});process.exit(0);}
process.on('SIGTERM',close);process.on('SIGINT',close);
