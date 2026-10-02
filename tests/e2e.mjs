import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir, access, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import AxeBuilder from '@axe-core/playwright';
import { root, readJSON } from '../scripts/lib.mjs';
const papers=await readJSON('research/papers.json'),taxonomy=await readJSON('research/taxonomy.json');
await mkdir(new URL('artifacts/',root),{recursive:true});
const tests=[];
let browser,processServer,base;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function check(name,fn){try{await fn();tests.push({name,status:'passed'});console.log(`PASS ${name}`);}catch(e){tests.push({name,status:'failed',error:String(e)});throw e;}}
async function launchServer(){
  processServer=spawn(process.execPath,[fileURLToPath(new URL('scripts/serve.mjs',root))],{env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe'],windowsHide:true});
  base=await new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>reject(new Error('Server startup timed out')),15000);
    processServer.stdout.on('data',chunk=>{const url=chunk.toString().match(/http:\/\/127\.0\.0\.1:\d+\//)?.[0];if(url){clearTimeout(timeout);resolve(url);}});
    processServer.on('error',reject);processServer.on('exit',code=>{clearTimeout(timeout);reject(new Error(`Server exited: ${code}`));});
  });
}
async function htmlFiles(dir){const out=[];for(const entry of await readdir(dir,{withFileTypes:true})){const url=new URL(entry.name+(entry.isDirectory()?'/':''),dir);if(entry.isDirectory())out.push(...await htmlFiles(url));else if(entry.name.endsWith('.html'))out.push(url);}return out;}
try{
  await launchServer();
  let executablePath=process.env.BROWSER_EXECUTABLE;
  if(!executablePath&&process.platform==='win32'){const chrome='C:/Program Files/Google/Chrome/Application/chrome.exe';try{await access(chrome);executablePath=chrome;}catch{}}
  browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{})});
  const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
  const page=await context.newPage(),errors=[],failedRequests=[];
  page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  page.on('requestfailed',r=>failedRequests.push({url:r.url(),failure:r.failure()?.errorText}));
  await check('desktop loads real data and all paper cards',async()=>{
    await page.goto(base);await page.locator('#search').waitFor({state:'visible'});await page.waitForFunction(()=>!document.getElementById('search').disabled);
    assert.equal(await page.locator('#paper-grid article:visible').count(),papers.length);assert.ok((await page.locator('h1').innerText()).includes('Memory in software development agents'));
    await page.screenshot({path:fileURLToPath(new URL('artifacts/desktop.png',root)),fullPage:false});
  });
  await check('search finds a title and an author',async()=>{
    await page.getByRole('searchbox',{name:'Search papers'}).fill('CTIM-Rover');assert.equal(await page.locator('#paper-grid article:visible').count(),1);
    await page.getByRole('searchbox',{name:'Search papers'}).fill(papers.find(p=>p.short==='ToM-SWE').authors[0]);assert.ok(await page.locator('#paper-grid article:visible').count()>0);
    await page.getByRole('button',{name:'Reset',exact:true}).click();
  });
  await check('storage category filter supports URL persistence and combined filters',async()=>{
    await page.getByLabel('Memory storage category').selectOption('histories');
    assert.equal(await page.locator('#paper-grid article:visible').count(),papers.filter(p=>p.storageCategories.includes('histories')).length);
    await page.reload();await page.waitForFunction(()=>!document.getElementById('storage').disabled);
    assert.equal(await page.locator('#storage').inputValue(),'histories');
    await page.getByLabel('Workflow stage').selectOption('plan');
    assert.equal(await page.locator('#paper-grid article:visible').count(),papers.filter(p=>p.storageCategories.includes('histories')&&p.stages.includes('plan')).length);
    await page.locator('#reset-filters').click();await page.getByLabel('Memory storage category').selectOption('backends');
    assert.equal(await page.locator('#paper-grid article:visible').count(),2);
    await page.locator('#reset-filters').click();
  });
  await check('storage browse pages and paper evidence are accessible through navigation',async()=>{
    await page.getByRole('link',{name:'Storage categories',exact:true}).click();
    assert.equal(await page.locator('.family-card').count(),7);
    await page.getByRole('link',{name:/Event & interaction histories/}).click();
    assert.ok((await page.locator('main').innerText()).includes('ESAA-Conversational'));
    await page.goto(`${base}papers/2606.23752.html`);
    assert.ok((await page.locator('#memory-storage').innerText()).includes('activity.jsonl'));
    assert.equal(await page.locator('#memory-storage .stage-list a').count(),3);
    await page.goto(base);await page.waitForFunction(()=>!document.getElementById('search').disabled);
  });
  await check('combined family, workflow, year, publication and setting filters',async()=>{
    const target=papers.find(p=>p.short==='ToM-SWE');
    await page.getByLabel('Memory family',{exact:true}).selectOption('collaboration');await page.getByLabel('Workflow stage').selectOption('plan');await page.getByLabel('Publication year').selectOption(String(target.year));await page.getByLabel('Publication status').selectOption(target.publication);await page.getByLabel('Agent setting').selectOption('multi-agent');
    const count=papers.filter(p=>p.categories.includes('collaboration')&&p.stages.includes('plan')&&p.year===target.year&&p.publication===target.publication&&p.setting==='multi-agent').length;
    assert.equal(await page.locator('#paper-grid article:visible').count(),count);assert.ok(page.url().includes('setting=multi-agent'));await page.reload();await page.waitForFunction(()=>!document.getElementById('search').disabled);assert.equal(await page.locator('#paper-grid article:visible').count(),count);
    await page.getByRole('button',{name:'Reset',exact:true}).click();
  });
  await check('empty results and reset recover the whole collection',async()=>{
    await page.getByRole('searchbox',{name:'Search papers'}).fill('zzzz-no-such-memory-method');assert.ok(await page.locator('#empty-state').isVisible());assert.ok(await page.locator('#export-filtered').isDisabled());
    await page.getByRole('button',{name:'Show all papers',exact:true}).click();assert.equal(await page.locator('#paper-grid article:visible').count(),papers.length);
    await page.getByLabel('Evidence depth').selectOption('full-text');assert.equal(await page.locator('#paper-grid article:visible').count(),papers.filter(p=>p.evidenceDepth==='full-text').length);await page.locator('#reset-filters').click();
  });
  await check('title and chronological sorting reorder results',async()=>{
    await page.getByLabel('Sort papers').selectOption('oldest');assert.equal(await page.locator('#paper-grid article:visible').first().getAttribute('data-paper-id'),[...papers].sort((a,b)=>a.published.localeCompare(b.published)||a.id.localeCompare(b.id))[0].id);
    await page.getByLabel('Sort papers').selectOption('title');assert.equal(await page.locator('#paper-grid article:visible').first().getAttribute('data-paper-id'),[...papers].sort((a,b)=>a.title.localeCompare(b.title))[0].id);
    await page.getByRole('button',{name:'Reset',exact:true}).click();
  });
  await check('reading list persists across reloads and can remove records',async()=>{
    await page.getByRole('button',{name:'Save CTIM-Rover to reading list',exact:true}).click();await page.locator('#saved-view').click();assert.equal(await page.locator('#paper-grid article:visible').count(),1);
    await page.reload();await page.waitForFunction(()=>!document.getElementById('search').disabled);assert.equal(await page.locator('#paper-grid article:visible').count(),1);
    await page.getByRole('button',{name:'Remove CTIM-Rover from reading list',exact:true}).click();assert.ok(await page.locator('#empty-state').isVisible());await page.locator('#empty-reset').click();
  });
  await check('filtered export downloads the selected records',async()=>{
    await page.getByRole('searchbox',{name:'Search papers'}).fill('CTIM-Rover');
    const event=page.waitForEvent('download');await page.locator('#export-filtered').click();const download=await event;
    assert.equal(download.suggestedFilename(),'agent-memory-atlas-selection.json');const exported=JSON.parse(await readFile(await download.path(),'utf8'));assert.equal(exported.length,1);assert.equal(exported[0].id,'2505.23422');
    await page.locator('#reset-filters').click();
  });
  await check('paper detail has linked evidence, lifecycle and real semantic neighbors',async()=>{
    await page.getByRole('link',{name:papers[0].title,exact:true}).click();assert.ok(page.url().endsWith(`/papers/${papers[0].id}.html`));
    assert.equal(await page.locator('.lifecycle>div').count(),4);assert.equal(await page.locator('.related-grid article').count(),4);
    assert.ok((await page.locator('.record-list').innerText()).includes('human review pending'));
    assert.equal(await page.getByRole('link',{name:'Read the source',exact:false}).getAttribute('href'),papers[0].sourceUrl);
    await page.getByRole('button',{name:'Save CTIM-Rover to reading list',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Remove CTIM-Rover from reading list',exact:true}).getAttribute('aria-pressed'),'true');
    await page.getByRole('button',{name:'Remove CTIM-Rover from reading list',exact:true}).click();
    await page.screenshot({path:fileURLToPath(new URL('artifacts/paper.png',root)),fullPage:true});
  });
  await check('citation copying works or displays an actionable fallback',async()=>{
    await page.getByRole('button',{name:'Copy BibTeX'}).click();await page.waitForFunction(()=>document.querySelector('.copy-status').textContent.length>0);assert.ok((await page.locator('.copy-status').innerText()).match(/copied|Select the citation/));
  });
  await check('category pages and deep filter links navigate correctly',async()=>{
    await page.getByRole('link',{name:'Memory families',exact:true}).click();assert.equal(await page.locator('main > .family-grid > .family-card').count(),taxonomy.length);
    await page.locator('.family-card[href="categories/context.html"]').click();const expected=papers.filter(p=>p.categories.includes('context')).length;assert.equal(await page.locator('.paper-grid article').count(),expected);
    await page.getByRole('link',{name:'Filter this family',exact:false}).click();await page.waitForFunction(()=>!document.getElementById('search').disabled);assert.equal(await page.locator('#paper-grid article:visible').count(),expected);
  });
  await check('findings page summarizes the collection with paper and primary-source links',async()=>{
    await page.getByRole('link',{name:'Findings',exact:true}).click();
    assert.ok(page.url().endsWith('/findings.html'));
    assert.equal(await page.locator('.finding-section').count(),7);
    assert.equal(await page.locator('.finding-section p:not(.finding-records)').count(),20);
    assert.ok(await page.locator('.finding-citations a[href^="https://"]').count()>20);
    await page.locator('.finding-records a[href="papers/2505.23422.html"]').first().click();
    assert.ok(page.url().endsWith('/papers/2505.23422.html'));
  });
  await check('methodology explains scope, limits and analysis',async()=>{
    await page.getByRole('link',{name:'Methodology',exact:true}).click();assert.equal(await page.locator('.method-body section').count(),6);assert.ok((await page.locator('#similarity').innerText()).includes('MiniLM'));assert.ok((await page.locator('#limits').innerText()).includes('not an exhaustive'));
  });
  await check('semantic group pages expose real memberships and clustering limits',async()=>{
    const similarity=await readJSON('research/similarity.json');await page.goto(`${base}categories.html#semantic-groups`);assert.equal(await page.locator('#semantic-groups .family-card').count(),similarity.clusters.length);
    await page.locator('#semantic-groups .family-card').first().click();assert.equal(await page.locator('.semantic-paper-grid article').count(),similarity.clusters[0].papers.length);assert.ok((await page.locator('.notice').innerText()).includes('human review pending'));
    await page.goto(`${base}methodology.html#similarity`);assert.ok((await page.locator('#similarity').innerText()).includes('average-linkage'));
  });
  await check('dataset JSON, CSV, citations and provenance all download',async()=>{
    for(const path of ['papers.json','papers.csv','papers.bib','similarity.json','collection-log.json','protocol.json']){
      const response=await context.request.get(`${base}data/${path}`);assert.equal(response.status(),200);assert.ok((await response.body()).length>0);
    }
    const event=page.waitForEvent('download');await page.locator('#downloads a[href="data/papers.json"]').click();const download=await event;assert.equal(JSON.parse(await readFile(await download.path(),'utf8')).length,papers.length);
  });
  await check('every generated HTML page and local link resolves under a Pages project prefix',async()=>{
    const files=await htmlFiles(new URL('dist/',root)),links=new Set();
    for(const file of files){
      const relative=file.href.slice(new URL('dist/',root).href.length),url=new URL('soa_research/'+relative,base);const response=await context.request.get(url.href);assert.equal(response.status(),200,relative);
      const $=load(await response.text());assert.equal($('h1').length,1,relative);
      for(const element of $('a[href],link[href],script[src]').toArray()){
        const target=$(element).attr('href')||$(element).attr('src');if(!target||target.startsWith('#')||/^https?:/.test(target))continue;
        const resolved=new URL(target,url);assert.ok(resolved.pathname.startsWith('/soa_research/'),`${relative}: escapes project prefix: ${target}`);links.add(resolved.href.split('#')[0]);
      }
    }
    for(const url of links){const response=await context.request.get(url);assert.equal(response.status(),200,url);}
  });
  await check('browser search and navigation work from a Pages project path',async()=>{
    await page.goto(`${base}soa_research/index.html?category=context`);await page.waitForFunction(()=>!document.getElementById('search').disabled);assert.equal(await page.locator('#paper-grid article:visible').count(),papers.filter(p=>p.categories.includes('context')).length);
    await page.getByRole('link',{name:'Read CAT / SWE-Compressor',exact:true}).click();assert.ok(page.url().includes('/soa_research/papers/'));await page.getByRole('link',{name:'Back to the collection',exact:false}).click();await page.waitForFunction(()=>!document.getElementById('search').disabled);assert.ok(page.url().includes('/soa_research/index.html'));
  });
  await check('keyboard search shortcut and focus are usable',async()=>{
    await page.locator('h1').click();await page.keyboard.press('/');assert.equal(await page.evaluate(()=>document.activeElement.id),'search');
  });
  await check('mobile collection, findings and detail layouts have no horizontal overflow',async()=>{
    await page.setViewportSize({width:390,height:844});await page.goto(base);await page.waitForFunction(()=>!document.getElementById('search').disabled);await page.evaluate(()=>document.fonts.ready);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));await page.screenshot({path:fileURLToPath(new URL('artifacts/mobile.png',root)),fullPage:false});
    await page.goto(`${base}findings.html`);await page.evaluate(()=>document.fonts.ready);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
    await page.screenshot({path:fileURLToPath(new URL('artifacts/mobile-findings.png',root)),fullPage:false});
    await page.goto(base);await page.waitForFunction(()=>!document.getElementById('search').disabled);
    await page.getByRole('searchbox',{name:'Search papers'}).fill('ToM-SWE');assert.equal(await page.locator('#paper-grid article:visible').count(),1);await page.getByRole('link',{name:papers.find(p=>p.short==='ToM-SWE').title,exact:true}).click();await page.evaluate(()=>document.fonts.ready);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
    await page.screenshot({path:fileURLToPath(new URL('artifacts/mobile-paper.png',root)),fullPage:true});
  });
  await check('small mobile and tablet remain within the viewport',async()=>{
    for(const width of [320,768]){await page.setViewportSize({width,height:900});await page.goto(base);await page.waitForFunction(()=>!document.getElementById('search').disabled);await page.evaluate(()=>document.fonts.ready);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),`Overflow at ${width}`);}
  });
  await check('a failed dataset request preserves static papers with an error message',async()=>{
    const failurePage=await context.newPage();await failurePage.route('**/data/papers.json',route=>route.fulfill({status:503,body:'Unavailable'}));await failurePage.goto(base);await failurePage.locator('#data-error').waitFor({state:'visible'});assert.equal(await failurePage.locator('#paper-grid article').count(),papers.length);assert.ok(await failurePage.getByRole('searchbox',{name:'Search papers'}).isDisabled());await failurePage.close();
  });
  await check('JavaScript-disabled readers can browse all paper and category pages',async()=>{
    const noJS=await browser.newContext({javaScriptEnabled:false});const p=await noJS.newPage();await p.goto(base);assert.equal(await p.locator('#paper-grid article').count(),papers.length);await p.getByRole('link',{name:papers[0].title,exact:true}).click();assert.equal(await p.locator('.lifecycle>div').count(),4);await noJS.close();
  });
  await check('site has no runtime external requests and works with external network blocked',async()=>{
    const offline=await browser.newContext();const p=await offline.newPage(),external=[];await p.route('**/*',route=>{const url=route.request().url();if(url.startsWith(base))return route.continue();external.push(url);return route.abort();});await p.goto(base);await p.waitForFunction(()=>!document.getElementById('search').disabled);await p.evaluate(()=>document.fonts.ready);assert.equal(external.length,0);await offline.close();
  });
  await check('WCAG accessibility audit passes collection, findings, detail, taxonomy and methodology',async()=>{
    await page.setViewportSize({width:1440,height:1000});
    for(const path of ['index.html','findings.html',`papers/${papers[0].id}.html`,'categories.html','methodology.html','storage.html','storage/histories.html']){
      await page.goto(base+path);await page.evaluate(()=>document.fonts.ready);
      const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
      await writeFile(new URL(`artifacts/accessibility-${path.replaceAll('/','-')}.json`,root),JSON.stringify(result,null,2));
      assert.deepEqual(result.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)})),[],path);
    }
  });
  await check('no console errors, uncaught errors or failed requests on successful flows',async()=>{assert.deepEqual(errors,[]);assert.deepEqual(failedRequests,[]);});
}catch(e){console.error(e);process.exitCode=1;}
finally{
  await writeFile(new URL('artifacts/e2e-report.json',root),JSON.stringify({testedAt:new Date().toISOString(),browser:'Chromium',paperCount:papers.length,tests,passed:tests.filter(t=>t.status==='passed').length,failed:tests.filter(t=>t.status==='failed').length},null,2));
  if(browser)await browser.close();if(processServer){processServer.kill();await sleep(100);}
}
