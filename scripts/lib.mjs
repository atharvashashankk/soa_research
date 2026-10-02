import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
export const root = new URL('../', import.meta.url);
export const readJSON = async (path) => JSON.parse(await readFile(new URL(path, root), 'utf8'));
export async function writeJSON(path, value) {
  const file = new URL(path, root);
  await mkdir(new URL('./', file), { recursive: true });
  await writeFile(file, JSON.stringify(value, null, 2) + '\n');
}
export const sha256 = (value) => createHash('sha256').update(value).digest('hex');
export const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const normalizedTitle = (text) => text.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g, '');
export function deduplicate(papers) {
  const ids = new Set(), titles = new Set();
  return papers.filter(p => {
    const id = p.id.replace(/v\d+$/, ''), title = normalizedTitle(p.title);
    if (ids.has(id) || titles.has(title)) return false;
    ids.add(id); titles.add(title); return true;
  });
}
export function validateCorpus(papers, taxonomy) {
  if (!Array.isArray(papers) || !papers.length) throw new Error('Corpus must not be empty');
  const ids = new Set(), tags = new Set(taxonomy.map(t => t.id));
  const stages = new Set(['explore','plan','code','debug','test','review','reflect','maintain']);
  for (const p of papers) {
    if (!/^\d{4}\.\d{4,5}$/.test(p.id) || ids.has(p.id)) throw new Error(`Invalid/duplicate ID: ${p.id}`);
    ids.add(p.id);
    for (const k of ['title','short','summary','representation','published','version','sourceUrl','reviewStatus','inclusionReason','evidenceLocator','limitations']) {
      if (typeof p[k] !== 'string' || !p[k].trim()) throw new Error(`${p.id}: missing ${k}`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.published) || Number.isNaN(Date.parse(p.published))) throw new Error(`Invalid date: ${p.id}`);
    if (!Array.isArray(p.authors) || !p.authors.length) throw new Error(`Missing authors: ${p.id}`);
    if (!p.categories?.length || p.categories.some(c => !tags.has(c))) throw new Error(`Invalid categories: ${p.id}`);
    if (!p.stages?.length || p.stages.some(s => !stages.has(s))) throw new Error(`Invalid stages: ${p.id}`);
    for (const op of ['write','retrieve','update','forget']) if (!p.lifecycle?.[op]) throw new Error(`Missing lifecycle ${op}: ${p.id}`);
    for (const url of [p.sourceUrl, p.pdfUrl, p.evidenceUrl, ...(p.alternateSources || []).map(s => s.url)]) {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:') throw new Error(`Unsafe source URL: ${p.id}`);
    }
    if (p.scope !== 'main') throw new Error(`Background record in main corpus: ${p.id}`);
  }
  return true;
}
export function cosine(a, b) {
  if (a.length !== b.length) throw new Error('Vector dimensions must match');
  let dot = 0, aa = 0, bb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i]*b[i]; aa += a[i]*a[i]; bb += b[i]*b[i]; }
  return aa && bb ? Math.max(-1, Math.min(1, dot / Math.sqrt(aa*bb))) : 0;
}
export function neighbors(papers, vectors, count = 4) {
  return Object.fromEntries(papers.map((p, i) => [p.id,
    papers.map((q, j) => ({ id: q.id, score: cosine(vectors[i], vectors[j]), shared: p.categories.filter(t => q.categories.includes(t)) }))
      .filter(q => q.id !== p.id).sort((a,b) => b.score-a.score || a.id.localeCompare(b.id)).slice(0, count)
  ]));
}
export function analysisText(p) {
  return [p.summary, `Memory representation: ${p.representation}.`, ...Object.entries(p.lifecycle).filter(([,v]) => !v.startsWith('Not ')).map(([k,v]) => `${k}: ${v}.`), `Workflow: ${p.stages.join(', ')}.`].join(' ');
}
export function clusterVectors(papers,vectors,threshold=.64) {
  const scores=vectors.map(a=>vectors.map(b=>cosine(a,b)));
  let groups=papers.map((_,i)=>[i]);
  const average=(a,b)=>a.reduce((sum,i)=>sum+b.reduce((s,j)=>s+scores[i][j],0),0)/(a.length*b.length);
  while(groups.length>1){
    let best=-Infinity,pair;
    for(let a=0;a<groups.length;a++)for(let b=a+1;b<groups.length;b++){
      const score=average(groups[a],groups[b]);
      if(score>best){best=score;pair=[a,b];}
    }
    if(best<threshold)break;
    const [a,b]=pair;groups[a]=[...groups[a],...groups[b]].sort((i,j)=>papers[i].id.localeCompare(papers[j].id));groups.splice(b,1);
  }
  groups.sort((a,b)=>b.length-a.length||papers[a[0]].id.localeCompare(papers[b[0]].id));
  return groups.map((indices,k)=>{
    const representative=[...indices].sort((i,j)=>average([j],indices)-average([i],indices)||papers[i].id.localeCompare(papers[j].id))[0];
    let sum=0,count=0;for(let a=0;a<indices.length;a++)for(let b=a+1;b<indices.length;b++){sum+=scores[indices[a]][indices[b]];count++;}
    return {id:`group-${String(k+1).padStart(2,'0')}`,papers:indices.map(i=>papers[i].id),representative:papers[representative].id,cohesion:count?sum/count:null,reviewStatus:'Automatically proposed; human review pending'};
  });
}
