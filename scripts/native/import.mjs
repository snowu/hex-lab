import {applyContracts} from './apply-contracts.mjs';
import {formatBundle} from './format-code.mjs';
// Import pinned, MIT-licensed Exercism native exercise files. Missing ports remain explicit.
import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'../..'), ctx=vm.createContext({window:{}});vm.runInContext(fs.readFileSync(path.join(root,'content/katas/index.js'),'utf8'),ctx);
const required=ctx.window.KATAS.items, output=path.join(root,'content/katas/native'), coverage=[];
for(const lang of ['c','cpp','zig']){
 const source=process.env['EXERCISM_'+lang.toUpperCase()]||'/tmp/native-source-'+lang, ref=execFileSync('git',['rev-parse','HEAD'],{cwd:source,encoding:'utf8'}).trim();
 const license=fs.readFileSync(path.join(source,'LICENSE'),'utf8');fs.writeFileSync(path.join(output,'LICENSE-'+lang+'.txt'),license);
 for(const meta of required){
  const dir=['practice','concept'].map(kind=>path.join(source,'exercises',kind,meta.slug)).find(d=>fs.existsSync(path.join(d,'.meta/config.json')));
  if(!dir){coverage.push({slug:meta.slug,language:lang,status:'missing'});continue;}
  const config=JSON.parse(fs.readFileSync(path.join(dir,'.meta/config.json'),'utf8')), files=config.files, starter={},solution={},tests={};
  for(const name of files.solution||[]) if(fs.existsSync(path.join(dir,name))) starter[name]=fs.readFileSync(path.join(dir,name),'utf8');
  Object.assign(solution,starter);
  for(const name of files.example||files.exemplar||[]){const target=path.basename(name).replace(/^(example|exemplar)/,Object.keys(starter).find(f=>path.extname(f)===path.extname(name))?.replace(path.extname(name),'')||meta.slug.replaceAll('-','_'));solution[target]=fs.readFileSync(path.join(dir,name),'utf8');}
  for(const name of files.test||[]) tests[name]=fs.readFileSync(path.join(dir,name),'utf8').replace(/\bTEST_IGNORE\(\);/g,'/* All tests enabled by Dev Lab. */');
  const supportFiles={}; if(lang==='c'){for(const name of ['unity.c','unity.h','unity_internals.h']) supportFiles['test-framework/'+name]=fs.readFileSync(path.join(dir,'test-framework',name),'utf8');}
  if(lang==='cpp'){const framework=fs.existsSync(path.join(dir,'test'))?path.join(dir,'test'):path.join(source,'test');for(const name of fs.readdirSync(framework)) if(/\.(cpp|hpp)$/.test(name)) supportFiles['test/'+name]=fs.readFileSync(path.join(framework,name),'utf8');}
  const support=createHash('sha256').update(JSON.stringify(supportFiles)).digest('hex');fs.mkdirSync(path.join(output,'support'),{recursive:true});fs.writeFileSync(path.join(output,'support',support+'.json'),JSON.stringify(supportFiles)); const instructions=JSON.parse(fs.readFileSync(path.join(root,'content/katas/python',meta.slug+'.json'),'utf8')).instructions; const bundle={support,instructions,slug:meta.slug,language:lang,source:'exercism/'+lang,ref,license:'MIT',authors:config.authors||[],contributors:config.contributors||[],starter,solution,tests};
  applyContracts(bundle);formatBundle(bundle);fs.writeFileSync(path.join(output,meta.slug+'-'+lang+'.json'),JSON.stringify(bundle));coverage.push({slug:meta.slug,language:lang,status:'imported',ref});
 }
}
fs.writeFileSync(path.join(output,'coverage.json'),JSON.stringify({required:required.map(k=>k.slug),languages:['c','zig','cpp'],variants:coverage},null,2));
console.log(coverage.filter(c=>c.status==='imported').length+' imported; '+coverage.filter(c=>c.status==='missing').length+' require ports');
