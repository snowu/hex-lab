import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {spawnSync} from 'node:child_process';import {createHash}from'node:crypto';
const root=path.resolve(import.meta.dirname,'../..'),dir=path.join(root,'content/katas/native'),coverage=JSON.parse(fs.readFileSync(path.join(dir,'coverage.json'),'utf8')),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'catalog-native-'));
const compilers={c:process.env.CC||'cc',cpp:process.env.CXX||'c++',zig:process.env.ZIG||'zig'},filter=process.argv.slice(2).filter(a=>!a.startsWith('--')),objects=new Map();let failed=0,passed=0;
try {
for(const item of coverage.variants){if(filter.length&&!filter.includes(item.slug)&&!filter.includes(item.language))continue;if(item.status==='missing'){if(process.argv.includes('--require-all')){console.error('Missing '+item.slug+'/'+item.language);failed++;}continue;}
 const b=JSON.parse(fs.readFileSync(path.join(dir,item.slug+'-'+item.language+'.json'),'utf8')),support=JSON.parse(fs.readFileSync(path.join(dir,'support',b.support+'.json'),'utf8'));
 for(const variant of process.argv.includes('--solutions-only')?['solution']:['solution','starter']) {
 const work=path.join(tmp,item.slug,item.language,variant);fs.mkdirSync(work,{recursive:true});const files={...b[variant],...b.tests,...support};for(const [name,text]of Object.entries(files)){const file=path.join(work,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,text);}
 let r,compileFailure=false;
 if(item.language==='zig'){const test=Object.keys(b.tests).find(f=>f.endsWith('.zig'));r=spawnSync(compilers.zig,['test',test,'--cache-dir',path.join(tmp,'zcache'),'--global-cache-dir',path.join(tmp,'zglobal')],{cwd:work,encoding:'utf8',timeout:180000});compileFailure=/\.zig:\d+:\d+: error:/.test(r.stderr||'');}
 else {
 const compiler=compilers[item.language],extension=item.language==='c'?'.c':'.cpp',flags=[item.language==='c'?'-std=c17':'-std=c++20','-DEXERCISM_RUN_ALL_TESTS','-DUNITY_INCLUDE_DOUBLE','-DCATCH_CONFIG_NO_POSIX_SIGNALS','-O0'],sources=Object.keys(files).filter(f=>f.endsWith(extension)),library=[];
 for(const source of Object.keys(support).filter(f=>f.endsWith(extension))){const key=item.language+createHash('sha256').update(support[source]).update(b.support).digest('hex');let entry=objects.get(key);if(!entry){const object=path.join(tmp,key+'.o');const build=spawnSync(compiler,[...flags,'-c',source,'-o',object],{cwd:work,encoding:'utf8',timeout:120000});entry={object,build};objects.set(key,entry);}if(entry.build.status!==0){r=entry.build;compileFailure=true;break;}library.push(entry.object);}
 if(!r){r=spawnSync(compiler,[...flags,...sources.filter(s=>!Object.hasOwn(support,s)),...library,'-lm','-o','kata'],{cwd:work,encoding:'utf8',timeout:120000});compileFailure=r.status!==0;if(!compileFailure)r=spawnSync(path.join(work,'kata'),[],{cwd:work,encoding:'utf8',timeout:10000});}
 }
 // Imported upstream skeletons may be declarations-only; all original Dev Lab starters compile.
 const unexpected=variant==='solution'?r.status!==0:r.status===0||r.error?.code==='ETIMEDOUT'||(compileFailure&&!b.source.startsWith('exercism/'));
 if(!unexpected){passed++;console.log('PASS '+item.slug+'/'+item.language+'/'+variant);}else{failed++;console.log('FAIL '+item.slug+'/'+item.language+'/'+variant+' '+(r.error?.message||'')+'\n'+(r.stderr||r.stdout||'').slice(0,3500));}
 }
}
} finally { fs.rmSync(tmp,{recursive:true,force:true}); }console.log({passed,failed});if(failed)process.exit(1);
