export const storageFormats = [
  {id:'md',name:'.md — Markdown',kind:'File format',description:'Markdown files used for persistent notes, plans, handoffs, or execution traces.'},
  {id:'qmd',name:'.qmd — Quarto Markdown',kind:'File format',description:'Quarto Markdown documents. No verified examples in the current corpus.'},
  {id:'json',name:'.json — JSON',kind:'File format',description:'Structured JSON memory records or projected task state.'},
  {id:'jsonl',name:'.jsonl — JSON Lines',kind:'File format',description:'Append-only event logs with one JSON record per line.'},
  {id:'yaml',name:'.yaml / .yml — YAML',kind:'File format',description:'Structured contextual metadata stored in YAML files.'},
  {id:'txt',name:'.txt — Plain text',kind:'File format',description:'Plain-text memory files with an explicitly documented .txt extension.'},
  {id:'sqlite',name:'SQLite',kind:'Database',description:'SQLite-backed memory. The database filename extension is not assumed.'},
  {id:'unspecified',name:'Format not established',kind:'Unknown',description:'The reviewed evidence does not establish a memory serialization format or database backend.'}
];

export const storageCategories = [
  {id:'notes',name:'Notes & documents',kind:'Memory representation',description:'Written notes, documentation, reflections, or decision summaries retained for later use.'},
  {id:'records',name:'Structured records',kind:'Memory representation',description:'Typed facts, metadata, cards, objects, or question-answer records.'},
  {id:'histories',name:'Event & interaction histories',kind:'Memory representation',description:'Retained conversations, messages, actions, issue streams, or task trajectories.'},
  {id:'graphs',name:'Linked knowledge',kind:'Memory representation',description:'Explicit graphs or links connecting facts, artifacts, skills, or reasoning steps.'},
  {id:'banks',name:'Experience & skill banks',kind:'Memory representation',description:'Reusable lessons, strategies, procedures, or experiences collected across tasks.'},
  {id:'context',name:'Working context & summaries',kind:'Memory representation',description:'Current or compressed context preserved to continue work within or across sessions.'},
  {id:'backends',name:'Databases & search indexes',kind:'Named backend',description:'A named database or search index used to hold or retrieve memory.'}
];

// Interpretations of the source-linked representation field, kept explicit for review.
// These describe the form of memory; exact file formats are tracked separately below.
const categoryAssignments = {
  '2505.23422':['banks'],
  '2510.01003':['notes','histories','banks'],
  '2609.23570':['histories','banks'],
  '2606.28434':['histories','context'],
  '2509.25140':['banks'],
  '2608.06153':['graphs','banks'],
  '2608.13662':['records','graphs'],
  '2605.01567':['records','banks'],
  '2608.31057':['records','context'],
  '2602.21611':['records','banks'],
  '2608.20664':['records','histories'],
  '2507.06229':['records','histories','banks'],
  '2604.14004':['histories','banks'],
  '2605.25430':['banks'],
  '2601.07190':['notes','context'],
  '2604.23069':['histories','graphs'],
  '2512.22087':['histories','context'],
  '2512.10398':['notes','context'],
  '2510.21903':['records','context'],
  '2608.21867':['records','banks'],
  '2609.20130':['records','banks'],
  '2609.07357':['histories','banks'],
  '2609.05510':['records','backends'],
  '2608.20685':['records','graphs'],
  '2608.09181':['records'],
  '2608.06811':['records','histories'],
  '2608.04278':['graphs'],
  '2608.00122':['records','banks'],
  '2607.20972':['records'],
  '2607.14390':['notes','histories'],
  '2607.01916':['records','context'],
  '2606.23752':['notes','records','histories'],
  '2606.12329':['notes','histories'],
  '2606.08151':['records','graphs'],
  '2605.30842':['notes','context'],
  '2605.17444':['histories','banks'],
  '2605.14563':['notes'],
  '2605.08468':['histories','banks'],
  '2608.20342':['records','context'],
  '2604.27283':['records','banks'],
  '2608.24188':['context'],
  '2609.22114':['histories','context'],
  '2601.06789':['records','banks'],
  '2303.11366':['notes','histories'],
  '2308.00352':['records','histories'],
  '2407.15568':['records','banks'],
  '2507.00014':['histories','backends'],
  '2307.07924':['notes','histories'],
  '2405.15793':['histories','context'],
  '2508.00031':['notes','records']
};

const evidence = {
  '2508.00031': {formats:['md','yaml'],sourceUrl:'https://arxiv.org/html/2508.00031v1',locator:'Section 2.1: GCC File System',note:'The memory hierarchy uses main.md, commit.md, log.md, and metadata.yaml.'},
  '2606.23752': {formats:['md','json','jsonl'],sourceUrl:'https://arxiv.org/abs/2606.23752v1',locator:'Abstract',note:'The event store is activity.jsonl; projections include handoff.md, state.md, decisions.md, and tasks.json.'},
  '2609.05510': {formats:['sqlite'],sourceUrl:'https://arxiv.org/abs/2609.05510v1',locator:'Abstract',note:'Per-project long-term memory uses hybrid lexical-vector retrieval over SQLite; the database extension is not specified.'}
};

export function classifyStorage(paper) {
  const source=evidence[paper.id];
  const formats=source ? [...source.formats] : ['unspecified'];
  const storageCategoriesForPaper=categoryAssignments[paper.id];
  if(!storageCategoriesForPaper)throw new Error(`Storage categories need review: ${paper.id}`);
  return {...paper,storageFormats:formats,storageCategories:storageCategoriesForPaper,storageEvidence:source ? [{...source,reviewStatus:'Agent source-check complete; human review pending'}] : [],storageSearchText:[...formats.map(id=>storageFormats.find(f=>f.id===id).name),...storageCategoriesForPaper.map(id=>storageCategories.find(c=>c.id===id).name)].join(' ')};
}

export function validateStorage(papers) {
  const ids=new Set(storageFormats.map(f=>f.id));
  const categoryIds=new Set(storageCategories.map(c=>c.id));
  if(Object.keys(categoryAssignments).length!==papers.length)throw new Error('Storage category assignments do not cover the corpus');
  for(const p of papers) {
    if(!Array.isArray(p.storageFormats)||!p.storageFormats.length||new Set(p.storageFormats).size!==p.storageFormats.length||p.storageFormats.some(id=>!ids.has(id)))throw new Error(`Invalid storage formats: ${p.id}`);
    if(p.storageFormats.includes('unspecified')&&p.storageFormats.length!==1)throw new Error(`Mixed unknown storage format: ${p.id}`);
    if(!Array.isArray(p.storageCategories)||!p.storageCategories.length||new Set(p.storageCategories).size!==p.storageCategories.length||p.storageCategories.some(id=>!categoryIds.has(id)))throw new Error(`Invalid storage categories: ${p.id}`);
    if(JSON.stringify(p.storageCategories)!==JSON.stringify(categoryAssignments[p.id]))throw new Error(`Storage categories do not match reviewed assignments: ${p.id}`);
    if(!p.evidenceUrl?.startsWith('https://')||!p.evidenceLocator||!p.representation)throw new Error(`Missing representation evidence: ${p.id}`);
    for(const id of p.storageFormats.filter(id=>id!=='unspecified')) {
      if(!p.storageEvidence?.some(e=>e.formats.includes(id)&&e.sourceUrl.startsWith('https://')&&e.locator&&e.note))throw new Error(`Missing storage evidence: ${p.id}/${id}`);
    }
  }
}
