import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { load } from 'cheerio';
import { XMLParser } from 'fast-xml-parser';
import { curation, alternateSources } from '../research/curation.mjs';
import { root, readJSON, writeJSON, sha256, deduplicate, validateCorpus } from './lib.mjs';

const protocol = await readJSON('research/protocol.json');
const taxonomy = await readJSON('research/taxonomy.json');
const refresh = process.argv.includes('--refresh');
const discover = process.argv.includes('--discover');
const fullText = process.argv.includes('--full-text');
const requests = [], errors = [];
let lastRequest = 0;
await mkdir(new URL('.cache/sources/', root), { recursive: true });
async function request(url) {
  const file = new URL(`.cache/sources/${sha256(url)}.txt`, root);
  if (!refresh) {
    try {
      const text = await readFile(file, 'utf8');
      requests.push({url, cached:true, sha256:sha256(text)});
      return text;
    } catch (e) { if (e.code !== 'ENOENT') throw e; }
  }
  await new Promise(resolve => setTimeout(resolve, Math.max(0, 3100 - (Date.now() - lastRequest))));
  lastRequest = Date.now();
  let failure;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(25000), headers: { 'User-Agent':'AgentMemoryAtlas/1.0 (academic metadata research; single-threaded collection)' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      if (!text.trim()) throw new Error('Empty response');
      await writeFile(file, text);
      requests.push({url, cached:false, retrievedAt:new Date().toISOString(), sha256:sha256(text)});
      return text;
    } catch (e) { failure = e; if (attempt < 2) await new Promise(r => setTimeout(r, (attempt+1)*3500)); }
  }
  errors.push({url,error:String(failure)});
  throw new Error(`${url}: ${failure}`);
}
const parser = new XMLParser({ignoreAttributes:false, attributeNamePrefix:'@_', trimValues:true});
const array = (value) => value === undefined ? [] : Array.isArray(value) ? value : [value];
const clean = (text) => String(text || '').replace(/\s+/g, ' ').trim();
function parseAtom(xml) {
  const feed = parser.parse(xml).feed;
  if (!feed) throw new Error('Invalid arXiv Atom response');
  return array(feed.entry).map(p => ({
    id: clean(p.id).match(/(\d{4}\.\d{4,5})(?:v\d+)?$/)?.[1],
    version: clean(p.id).match(/v\d+$/)?.[0] || 'v1', title:clean(p.title),
    authors:array(p.author).map(a => clean(a.name)), abstract:clean(p.summary),
    published:clean(p.published).slice(0,10), updated:clean(p.updated).slice(0,10),
    doi:clean(p['arxiv:doi']), journalRef:clean(p['arxiv:journal_ref']),
    sourceUrl:clean(p.id).replace('http:','https:'), metadataSource:'arXiv Atom API'
  })).filter(p => p.id);
}
async function scrape(id) {
  const url = `https://arxiv.org/abs/${id}`;
  const html = await request(url), $ = load(html);
  const meta = (name) => $(`meta[name="${name}"]`).map((_,e) => $(e).attr('content')).get();
  const history = $('.submission-history').text();
  const version = $('[name="citation_arxiv_id"]').attr('content')?.match(/v\d+$/)?.[0]
    || [...history.matchAll(/\[v(\d+)\]/g)].at(-1)?.[0].replace(/[\[\]]/g,'') || 'v1';
  const published = meta('citation_date')[0]?.replaceAll('/','-');
  const abstractNode = $('blockquote.abstract').clone(); abstractNode.find('.descriptor').remove();
  const p = {id, version, title:clean(meta('citation_title')[0]), authors:meta('citation_author'),
    published, updated:meta('citation_online_date')[0]?.replaceAll('/','-') || published,
    abstract:clean(abstractNode.text()), doi:meta('citation_doi')[0] || '',
    journalRef:clean($('.jref').text()), sourceUrl:url, metadataSource:'arXiv abstract page'};
  if (!p.title || !p.authors.length || !p.abstract || !p.published) throw new Error(`Incomplete scraped metadata: ${id}`);
  return p;
}

if (discover) {
  const candidates = [];
  for (const query of protocol.queries) {
    const date = ` AND submittedDate:[${protocol.start.replaceAll('-','')}0000 TO ${protocol.cutoff.replaceAll('-','')}2359]`;
    const url = `https://export.arxiv.org/api/query?search_query=${encodeURIComponent(query + date)}&start=0&max_results=100&sortBy=submittedDate&sortOrder=descending`;
    try { candidates.push(...parseAtom(await request(url)).map(p => ({...p,query,screening:'pending', reason:'Discovery match; not yet assessed for inclusion'}))); }
    catch (e) { console.error(e.message); }
  }
  const unique = deduplicate(candidates);
  await writeJSON('research/candidates.json', unique);
  await writeJSON('research/discovery-log.json',{ collectedAt:new Date().toISOString(), queries:protocol.queries, cutoff:protocol.cutoff, count:unique.length, requests, errors });
  if (!unique.length) throw new Error('Discovery produced no candidates; see discovery-log.json');
  console.log(`Discovered ${unique.length} unique candidates. Human screening is required before inclusion.`);
} else {
  let metadata = [];
  try {
    metadata = parseAtom(await request(`https://export.arxiv.org/api/query?id_list=${curation.map(p=>p.id).join(',')}&max_results=${curation.length}`));
  } catch (e) { console.warn('Atom API unavailable; using rate-limited primary-source pages:', e.message); }
  const papers = [];
  for (const curated of curation) {
    let p = metadata.find(m => m.id === curated.id);
    if (!p) p = await scrape(curated.id);
    if (p.published < protocol.start || p.published > protocol.cutoff) throw new Error(`${p.id}: outside collection date range`);
    const alternate = alternateSources[p.id];
    if (alternate) {
      const html = await request(alternate.verificationUrl || alternate.url);
      // Reject error pages and unrelated responses rather than marking a venue verified blindly.
      if (!html.toLowerCase().includes(curated.short.split(' ')[0].toLowerCase()) && !html.toLowerCase().includes(p.title.slice(0,24).toLowerCase())) {
        throw new Error(`Alternate publication could not be verified: ${alternate.url}`);
      }
    }
    let fullTextStatus = 'Not collected';
    if (fullText || curated.evidenceDepth==='full-text') {
      try {
        const html = await request(`https://arxiv.org/html/${p.id}${p.version}`);
        if (!html.includes('ltx_') || load(html)('section').length < 2) throw new Error('No structured paper HTML');
        fullTextStatus = curated.evidenceDepth==='full-text'?'HTML retrieved; cited section checked by agent':'HTML retrieved locally; extraction evidence remains abstract-based';
      } catch { fullTextStatus = 'HTML unavailable; use linked PDF for full-text review'; }
    }
    const { abstract, ...publicMetadata } = p;
    papers.push({...publicMetadata, ...curated,
      sourceUrl:`https://arxiv.org/abs/${p.id}${p.version}`, pdfUrl:`https://arxiv.org/pdf/${p.id}${p.version}`,
      evidenceUrl:`https://arxiv.org/${curated.evidencePath || 'abs'}/${p.id}${p.version}`,
      publication:alternate?.publication || 'Preprint', venue:alternate?.venue || 'arXiv', alternateSources:alternate ? [alternate] : [],
      year:Number(p.published.slice(0,4)), fullTextStatus,
      inclusionReason:'Explicit coding-agent memory method or memory evaluation with a software-development setting.',
      metadataCheckedAt:new Date().toISOString(), abstractHash:sha256(abstract)
    });
    console.log(`Collected ${p.id}: ${p.title}`);
  }
  const unique = deduplicate(papers);
  validateCorpus(unique, taxonomy);
  await writeJSON('research/papers.json', unique);
  await writeJSON('research/collection-log.json', {
    collectedAt:new Date().toISOString(), cutoff:protocol.cutoff, protocolVersion:protocol.version,
    count:unique.length, pilotTarget:protocol.pilotTarget, expansionTarget:protocol.expansionTarget,
    method:'Targeted search and primary-source metadata collection; curated initial collection, not exhaustive',
    requests, errors,
    screening:[...unique.map(p=>({id:p.id,decision:'include',reason:p.inclusionReason})),
      {id:'2609.19721',decision:'exclude',reason:'Clinical billing coding, not software development'},
      {id:'2604.27003',decision:'background',reason:'ALFWorld and BabyAI evaluation; no software-development connection established'},
      {id:'2512.18746',decision:'background',reason:'Abstract does not establish software-development evaluation; requires further screening'},
      {id:'2606.22417',decision:'exclude',reason:'Structural code retrieval without a substantive agent-memory management contribution in the abstract'},
      {id:'2609.11060',decision:'background',reason:'Uses a coding-agent harness for database and consulting tasks; no software-development evaluation established'},
      {id:'2407.16741',decision:'background',reason:'Platform architecture without a directly established memory contribution in the inspected source'},
      {id:'2510.04618',decision:'background',reason:'Agent and finance memory framework; explicit software-development evaluation not established by the abstract'}]
  });
  console.log(`Saved ${unique.length} primary-source records. Full abstracts are cached locally, not republished.`);
}
