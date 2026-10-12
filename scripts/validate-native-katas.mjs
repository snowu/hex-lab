import fs from 'node:fs';
import vm from 'node:vm';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const ctx=vm.createContext({window:{}});vm.runInContext(fs.readFileSync(new URL('../content/game-katas.js',import.meta.url),'utf8'),ctx);
vm.runInContext(fs.readFileSync(new URL('../content/game-debug-native.js',import.meta.url),'utf8'),ctx);
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'native-katas-')),requireAll=process.argv.includes('--require');let errors=0,count=0;
const compilers={c:process.env.CC||'cc',cpp:process.env.CXX||'c++',zig:process.env.ZIG||'zig'};
for(const [lang,compiler] of Object.entries(compilers)){
 const probe=spawnSync(compiler,[lang==='zig'?'version':'--version']);if(probe.error||probe.status!==0){if(requireAll){console.error('Missing '+compiler);errors++;}else console.warn('Skipping '+lang+': compiler unavailable');continue;}
 for(const k of ctx.window.GAME_KATAS)for(const which of ['solution','starter']){
 const dir=path.join(tmp,lang,k.id,which);fs.mkdirSync(dir,{recursive:true});const file=path.join(dir,k.id+'.'+(lang==='cpp'?'cpp':lang));const source=k.native[lang];fs.writeFileSync(file,source[which]+'\n'+source.tests+'\n');
 let result;if(lang==='zig') result=spawnSync(compiler,['test',file,'--cache-dir',path.join(tmp,'zcache'),'--global-cache-dir',path.join(tmp,'zglobal')],{encoding:'utf8',timeout:180000});else {const exe=path.join(dir,'kata'),build=spawnSync(compiler,[lang==='c'?'-std=c17':'-std=c++20','-Wall','-Wextra','-Wno-unused-parameter',file,'-lm','-o',exe],{encoding:'utf8',timeout:30000});if(build.status!==0){console.error(k.id+'/'+lang+' failed to compile '+which+'\n'+build.stderr);errors++;continue;}result=spawnSync(exe,[],{encoding:'utf8',timeout:5000});}
 if(which==='solution'&&result.status!==0||which==='starter'&&(result.error?.code==='ETIMEDOUT'||result.status===0||/\.zig:\d+:\d+: error:/.test(result.stderr||''))){console.error(k.id+'/'+lang+'/'+which+' unexpected result\n'+result.stderr);errors++;} count++;
 }
}
fs.rmSync(tmp,{recursive:true,force:true});if(errors)process.exit(1);console.log(count+' native starter/reference checks passed');
