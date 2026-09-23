import {spawn} from 'node:child_process';
const server=spawn(process.execPath,['--import','./scripts/local-env.mjs','scripts/test-server.mjs'],{stdio:['ignore','pipe','inherit']});
try{
  await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error('Acceptance server did not start within 30 seconds')),30000);
    server.once('exit',code=>{clearTimeout(timer);reject(new Error(`Acceptance server exited: ${code}`));});
    server.stdout.on('data',chunk=>{process.stdout.write(chunk);if(chunk.toString().includes('Acceptance server ready')){clearTimeout(timer);resolve();}});
  });
  const browser=spawn(process.execPath,['--import','./scripts/local-env.mjs','tests/browser.mjs'],{stdio:'inherit',env:{...process.env,OYR_TEST_ORIGIN:'http://127.0.0.1:5173'}});
  process.exitCode=await new Promise(resolve=>browser.on('exit',code=>resolve(code??1)));
}finally{server.kill('SIGTERM');}
