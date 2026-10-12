import {newPage} from './helpers.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {loadDrills} from '../../scripts/lib-drills.mjs';
export default async function({url,browser,ok}) {
 const page=await newPage(browser);
 await page.addInitScript(() => localStorage.setItem('sil:mode', JSON.stringify('gamedev')));
 await page.goto(url+'#/lesson/gd-loop');
 const drill=page.locator('.ex').filter({has:page.locator('.dr-body')}).first();
 const samples={c:'// saved C draft\nint score = 4;',zig:'// saved Zig draft\nconst score = 5;',cpp:'// saved C++ draft\nint score = 6;'};
 for(const lang of Object.keys(samples)) {
  await drill.locator('[data-lang="'+lang+'"]').click();
  await drill.locator('.dfb summary').click();
  await drill.locator('.dpaste').fill(samples[lang]);
 }
 for(const lang of Object.keys(samples)) {
  await drill.locator('[data-lang="'+lang+'"]').click();
  ok(await drill.locator('.dpaste').inputValue()===samples[lang],lang+' drill draft survives language changes');
  const downloadPromise=page.waitForEvent('download');
  await drill.locator('.ddl').click();
  const download=await downloadPromise, downloaded=fs.readFileSync(await download.path(),'utf8');
  ok(downloaded.includes(samples[lang])&&downloaded.includes('// ---- tests: do not edit below this line ----'),lang+' single-file download preserves the edited draft and supplied tests');
 }
 await drill.locator('.dpass').click();
 ok(await drill.locator('.dpaste').inputValue()===samples.cpp,'draft survives marking a drill passed');
 await page.go(url,'#/game'); await page.go(url,'#/lesson/gd-loop');
 ok(await drill.locator('.dpaste').inputValue()===samples.cpp,'draft survives route changes');
 await page.reload(); await page.waitForSelector('.dpaste', {state:'attached'});
 ok(await drill.locator('.dpaste').inputValue()===samples.cpp,'draft survives reload');
 const fonts=await page.evaluate(()=>{
  const selectors=['h1','.ex-title','.ex-prompt','body'];
  return selectors.map(s=>getComputedStyle(document.querySelector(s)).fontFamily);
 });
 ok(new Set(fonts).size===1,'headers, descriptions and body use the same font');
 await page.setViewportSize({width:390,height:844});
 ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'lesson with local test tools fits mobile viewport');
 ok(page.errors.length===0,'draft and typography flow has no browser errors');
 await page.context().close();
 await testLocalReceipts({url,browser,ok});
}

// Exercise the downloaded combine:true packages, rather than synthesizing receipts.
async function testLocalReceipts({url,browser,ok}) {
 const page=await newPage(browser);
 const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'lesson drill receipts '));
 const drills=loadDrills();
 const zig=process.env.ZIG || (fs.existsSync('/tmp/native-zig/zig')?'/tmp/native-zig/zig':'zig');
 const run=(command,args,cwd)=>spawnSync(command,args,{cwd,encoding:'utf8',timeout:180000,maxBuffer:8*1024*1024,env:{...process.env,ZIG:zig}});
 try {
  await page.addInitScript(()=>localStorage.setItem('sil:mode',JSON.stringify('gamedev')));
  await page.goto(url+'#/lesson/gd-loop');
  const drill=page.locator('.ex').filter({has:page.locator('.dr-body')}).first();
  for(const language of ['c','zig','cpp']) {
   await drill.locator('[data-lang="'+language+'"]').click();
   ok(await drill.locator('.dpaste').isVisible(),language+' drill learner editor is visible without opening AI feedback');
   const pending=page.waitForEvent('download');
   await drill.locator('.native-runner-download').click();
   const download=await pending;
   const directory=path.join(temporary,language);fs.mkdirSync(directory);
   const extracted=run('python3',['-c','import sys,zipfile; z=zipfile.ZipFile(sys.argv[1]); assert z.testzip() is None; z.extractall(sys.argv[2])',await download.path(),directory]);
   assert.equal(extracted.status,0,extracted.stderr);
   const manifest=JSON.parse(fs.readFileSync(path.join(directory,'lab-manifest.json'),'utf8'));
   const id=manifest.exerciseId.replace(/^drill-/,''),sourceName=manifest.sourceNames[0];
   ok(manifest.combine===true&&manifest.language===language&&manifest.testNames.length===1,language+' drill ZIP includes its real combined-source runner configuration');
   const failed=run(process.execPath,['lab-test.mjs'],directory);
   assert(!failed.error,failed.error?.message);
   const reportPath=path.join(directory,'lab-results.json');
   const failure=JSON.parse(fs.readFileSync(reportPath,'utf8'));
   ok(failed.status!==0&&failure.status==='failed'&&failure.stage==='test',language+' downloaded starter compiles and fails real native tests');
   await drill.locator('.native-results input[type=file]').setInputFiles(reportPath);
   await drill.locator('.native-report-summary').waitFor();
   ok(await drill.locator('.native-record-result').count()===0&&(await drill.locator('.native-report-summary').textContent()).includes('Local tests failed'),language+' failed native starter receipt cannot record a local pass');
   const reference=drills[id][language].solution.replace(/\s+$/,'');
   fs.writeFileSync(path.join(directory,sourceName),reference);
   const passed=run(process.execPath,['lab-test.mjs'],directory);
   assert(!passed.error,passed.error?.message);assert.equal(passed.status,0,passed.stderr+'\n'+passed.stdout);
   const report=JSON.parse(fs.readFileSync(reportPath,'utf8'));
   ok(report.status==='passed'&&report.cases.length>0,language+' edited downloaded reference passes actual native tests');
   await drill.locator('.native-results input[type=file]').setInputFiles(reportPath);
   ok(await drill.locator('.native-record-result').isDisabled()&&await drill.locator('.native-load-source').isVisible(),language+' passing receipt requires loading its tested source before recording');
   await drill.locator('.native-load-source').click();
   ok(await drill.locator('.dpaste').inputValue()===reference&&!await drill.locator('.native-record-result').isDisabled(),language+' tested source loads into the editable drill and matches its receipt');
   await drill.locator('.native-record-result').click();
   ok(await page.evaluate(({id,language})=>JSON.parse(localStorage.getItem('sil:gd:kataEvidence'))?.['drill-'+id]?.[language]?.status==='passed',{id,language}),language+' local drill receipt is recorded per exercise and language');
   await drill.locator('[data-lang="'+(language==='c'?'zig':'c')+'"]').click();
   await drill.locator('[data-lang="'+language+'"]').click();
   ok(await drill.locator('.dpaste').inputValue()===reference,language+' imported tested source survives drill repaint');
   await page.reload();await drill.locator('.dpaste').waitFor();
   ok(await drill.locator('.dpaste').inputValue()===reference,language+' imported tested source persists after reload');
  }
  ok(page.errors.length===0,'real downloaded drill receipt flow has no browser errors');
 } finally {await page.context().close();fs.rmSync(temporary,{recursive:true,force:true});}
}
