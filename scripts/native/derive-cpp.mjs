// Portable C implementations are valid C++20 implementations of the same exercise.
import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
const dir=path.resolve(import.meta.dirname,'../../content/katas/native'),coverage=JSON.parse(fs.readFileSync(path.join(dir,'coverage.json'),'utf8'));
let count=0;
for(const item of coverage.variants.filter(v=>v.language==='cpp')){
 const output=path.join(dir,item.slug+'-cpp.json');if(fs.existsSync(output)&&(!JSON.parse(fs.readFileSync(output,'utf8')).derivedFrom || JSON.parse(fs.readFileSync(output,'utf8')).cppAdapted))continue;
 const file=path.join(dir,item.slug+'-c.json');if(!fs.existsSync(file))continue;const source=JSON.parse(fs.readFileSync(file,'utf8'));
 const convert=(files)=>Object.fromEntries(Object.entries(files).map(([name,text])=>[name.replace(/\.c$/,'.cpp'),text]));
 const supportFiles=convert(JSON.parse(fs.readFileSync(path.join(dir,'support',source.support+'.json'),'utf8'))),support=createHash('sha256').update(JSON.stringify(supportFiles)).digest('hex');fs.writeFileSync(path.join(dir,'support',support+'.json'),JSON.stringify(supportFiles));
 const bundle={...source,support,language:'cpp',source:source.source+' (portable C++20 port)',starter:convert(source.starter),solution:convert(source.solution),tests:convert(source.tests),derivedFrom:'c'};
 fs.writeFileSync(output,JSON.stringify(bundle));count++;
}
console.log(count+' portable C++ variants written');
