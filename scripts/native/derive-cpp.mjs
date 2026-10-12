import {applyContracts} from './apply-contracts.mjs';
import {formatBundle} from './format-code.mjs';
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
 if(item.slug==='zipper'){
 const alternatives=path.join(import.meta.dirname,'cpp-alternatives','zipper');
 for(const section of ['starter','solution']) bundle[section]['zipper.hpp']=fs.readFileSync(path.join(alternatives,section,'zipper.hpp'),'utf8');
 const test=Object.keys(bundle.tests).find(f=>f.endsWith('.cpp'));
 const added=fs.readFileSync(path.join(alternatives,'tests.cpp'),'utf8');
 bundle.tests[test]='#include "zipper.hpp"\n'+bundle.tests[test].replace(/return 0;\s*}\s*$/,added+'\nreturn 0;\n}\n');
 bundle.learningNotes=['The exercise.h API keeps explicit C-compatible ownership. Returned zippers own independent snapshots; zipper_clone copies and zipper_free releases them. Plain struct assignment transfers ownership.', 'zipper.hpp is an idiomatic C++20 alternative: immutable shared_ptr nodes, optional navigation, safe ordinary value copies, and RAII. Edits preserve prior versions and share unchanged subtrees.'];
 }
 applyContracts(bundle);formatBundle(bundle);fs.writeFileSync(output,JSON.stringify(bundle));count++;
}
console.log(count+' portable C++ variants written');
