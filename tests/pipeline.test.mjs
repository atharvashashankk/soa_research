import test from 'node:test';
import {validateStorage,storageCategories} from '../research/storage.mjs';
import assert from 'node:assert/strict';
import { readJSON, validateCorpus, deduplicate, cosine, neighbors, clusterVectors, escapeHTML, analysisText, sha256 } from '../scripts/lib.mjs';
const papers=await readJSON('research/papers.json'),taxonomy=await readJSON('research/taxonomy.json'),protocol=await readJSON('research/protocol.json');
const projects=await readJSON('research/projects.json');
test('GitHub project catalog is separate and links to real research records',()=>{
  assert.equal(new Set(projects.map(p=>p.id)).size,projects.length);
  assert.ok(projects.some(p=>p.role==='memory layer'));
  assert.ok(projects.some(p=>p.role==='coding harness'));
  for(const project of projects){
    assert.match(project.repository,/^https:\/\/github\.com\/[^/]+\/[^/]+$/);
    assert.ok(project.evidenceUrl.startsWith('https://github.com/'));
    assert.ok(project.summary&&project.memoryUse&&project.fit&&project.boundary);
    assert.ok(project.tags.every(id=>taxonomy.some(t=>t.id===id)));
    assert.ok(project.paperIds.every(id=>papers.some(p=>p.id===id)));
  }
});
test('all papers have source-linked representation categories while exact formats stay evidence-based',()=>{
  validateStorage(papers);
  assert.deepEqual(storageCategories.map(c=>c.id),['notes','records','histories','graphs','banks','context','backends']);
  assert.ok(papers.every(p=>p.storageCategories.length>0));
  assert.deepEqual(papers.find(p=>p.id==='2606.23752').storageFormats,['md','json','jsonl']);
  assert.deepEqual(papers.find(p=>p.id==='2606.23752').storageCategories,['notes','records','histories']);
  assert.deepEqual(papers.find(p=>p.id==='2609.05510').storageCategories,['records','backends']);
  assert.equal(papers.filter(p=>p.storageFormats.includes('unspecified')).length,papers.length-4);
  const bad=structuredClone(papers);bad[0].storageFormats=['md'];bad[0].storageEvidence=[];
  assert.throws(()=>validateStorage(bad));
  const mismatched=structuredClone(papers);mismatched[0].storageCategories=['notes'];
  assert.throws(()=>validateStorage(mismatched));
});
test('published corpus is valid and meets the pilot without duplicates',()=>{
  assert.equal(validateCorpus(papers,taxonomy),true);assert.ok(papers.length>=protocol.pilotTarget);
  assert.equal(deduplicate(papers).length,papers.length);
  assert.ok(papers.every(p=>p.published<=protocol.cutoff&&p.published>=protocol.start));
});
test('invalid sources, missing evidence, and unknown categories are rejected',()=>{
  for(const mutate of [p=>p.sourceUrl='javascript:alert(1)',p=>p.evidenceLocator='',p=>p.categories=['invented'],p=>p.authors=[],p=>p.lifecycle.forget='',p=>p.scope='background']){
    const copy=structuredClone(papers);mutate(copy[0]);assert.throws(()=>validateCorpus(copy,taxonomy));
  }
});
test('versions and duplicate normalized titles deduplicate',()=>{
  const a={id:'2501.12345v1',title:'A Memory Method'},b={id:'2501.12345v2',title:'Revised Method'},c={id:'2502.23456',title:'A memory-method!'};
  assert.deepEqual(deduplicate([a,b,c]),[a]);
});
test('cosine handles orthogonal, identical, opposite and zero vectors',()=>{
  assert.equal(cosine([1,0],[1,0]),1);assert.equal(cosine([1,0],[0,1]),0);assert.equal(cosine([1,0],[-1,0]),-1);assert.equal(cosine([0,0],[1,0]),0);
  assert.throws(()=>cosine([1],[1,2]));
});
test('neighbors are ranked and never include the query paper',()=>{
  const rows=[{id:'a',categories:['context']},{id:'b',categories:['context']},{id:'c',categories:['skills']}];
  const results=neighbors(rows,[[1,0],[.9,.1],[0,1]],2);
  assert.equal(results.a[0].id,'b');assert.deepEqual(results.a[0].shared,['context']);assert.ok(results.a.every(p=>p.id!=='a'));assert.equal(results.a.length,2);
});
test('HTML escaping prevents source metadata becoming executable markup',()=>{
  assert.equal(escapeHTML('<img src="x" onerror="alert(1)">'), '&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;');
  assert.equal(escapeHTML("A & B's"),'A &amp; B&#39;s');
});
test('average-linkage grouping merges similar vectors and retains unrelated singletons',()=>{
  const records=[{id:'a'},{id:'b'},{id:'c'}],vectors=[[1,0],[.99,.01],[0,1]];
  const groups=clusterVectors(records,vectors,.9);assert.equal(groups.length,2);assert.deepEqual(groups[0].papers,['a','b']);assert.deepEqual(groups[1].papers,['c']);assert.ok(groups[0].cohesion>.9);assert.equal(groups[1].cohesion,null);
  assert.deepEqual(clusterVectors(records,vectors,.9),groups);
});
test('each source paper belongs to exactly one semantic group',async()=>{
  const similarity=await readJSON('research/similarity.json');const ids=similarity.clusters.flatMap(c=>c.papers);
  assert.equal(ids.length,papers.length);assert.equal(new Set(ids).size,papers.length);assert.ok(papers.every(p=>ids.includes(p.id)));
  assert.ok(similarity.clusters.every(c=>c.papers.includes(c.representative)&&(c.cohesion===null||c.cohesion>=protocol.similarity.clusterThreshold)));
});
test('semantic text omits unknown lifecycle rules and performance numbers',()=>{
  const input=analysisText(papers[0]);assert.ok(!input.includes('Not specified'));assert.ok(!input.includes(papers[0].title));assert.ok(input.includes(papers[0].representation));
});
test('checked-in analysis matches the exact current inputs and model configuration',async()=>{
  const similarity=await readJSON('research/similarity.json');
  const hash=sha256(JSON.stringify({ids:papers.map(p=>p.id),texts:papers.map(analysisText),config:protocol.similarity}));
  assert.equal(hash,similarity.inputHash);assert.equal(similarity.dimensions,384);assert.equal(similarity.metric,'cosine');
  for(const p of papers){const rows=similarity.neighbors[p.id];assert.equal(rows.length,Math.min(4,papers.length-1));assert.ok(rows.every(q=>q.id!==p.id&&Number.isFinite(q.score)));}
});
test('category membership exactly matches paper labels',async()=>{
  const similarity=await readJSON('research/similarity.json');
  for(const group of similarity.groups)assert.deepEqual(group.papers,papers.filter(p=>p.categories.includes(group.id)).map(p=>p.id));
});
test('provenance and publication status are evidence-linked',async()=>{
  const log=await readJSON('research/collection-log.json');assert.equal(log.count,papers.length);assert.ok(log.requests.length);
  assert.ok(log.requests.every(r=>/^https:/.test(r.url)&&r.sha256?.length===64));
  assert.ok(papers.every(p=>p.abstractHash?.length===64&&p.version.match(/^v\d+$/)));
  assert.ok(papers.filter(p=>p.publication!=='Preprint').every(p=>p.alternateSources.length));
  assert.ok(log.screening.some(s=>s.decision==='exclude'&&s.reason.includes('Clinical')));
});
test('screening ledger distinguishes decisions from unscreened discovery matches',async()=>{
  const ledger=await readJSON('research/screening-ledger.json');
  const candidates=await readJSON('research/candidates.json');
  const discovery=await readJSON('research/discovery-log.json');
  assert.equal(new Set(ledger.map(row=>row.id)).size,ledger.length);
  assert.equal(discovery.count,candidates.length);
  assert.ok(discovery.queryResults.every(row=>row.retrievedRaw-row.uniqueRetrieved===row.pageOverlap&&row.pages>0));
  assert.ok(candidates.every(candidate=>candidate.matchedQueries?.length>0));
  assert.ok(candidates.every(candidate=>ledger.some(row=>row.id===candidate.id)));
  assert.deepEqual(new Set(ledger.filter(row=>row.decision==='include').map(row=>row.id)),new Set(papers.map(p=>p.id)));
  assert.ok(ledger.every(row=>row.decision==='pending'||row.reason));
  assert.ok(ledger.filter(row=>row.decision==='pending').every(row=>!row.independentHumanReview));
});
test('claim and group review forms expose outstanding human checks',async()=>{
  const extraction=await readJSON('research/extraction-review.json');
  const groups=await readJSON('research/similarity-review.json');
  const similarity=await readJSON('research/similarity.json');
  assert.deepEqual(new Set(extraction.map(row=>row.id)),new Set(papers.map(p=>p.id)));
  assert.ok(extraction.every(row=>row.claims.summary.sourceUrl&&row.claims.summary.locator));
  assert.deepEqual(new Set(groups.map(row=>row.groupId)),new Set(similarity.clusters.map(c=>c.id)));
  assert.ok(groups.every(row=>row.humanReviewer===null));
});
test('sensitivity and citation provenance match the checked-in analysis',async()=>{
  const similarity=await readJSON('research/similarity.json');
  const sensitivity=await readJSON('research/similarity-sensitivity.json');
  const metadata=await readJSON('research/publication-metadata.json');
  const model=await readJSON('research/model-artifacts.json');
  assert.equal(sensitivity.inputHash,similarity.inputHash);
  assert.equal(sensitivity.results.find(row=>row.threshold===protocol.similarity.clusterThreshold).groups,similarity.clusters.length);
  assert.deepEqual(similarity.modelArtifacts,model);
  for(const [id,publication] of Object.entries(metadata)) {
    const paper=papers.find(p=>p.id===id);
    assert.ok(paper);
    assert.equal(paper.citationStatus,publication.citationStatus);
    if(publication.doi) assert.equal(paper.doi,publication.doi);
  }
});
