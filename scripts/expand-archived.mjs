// Rebuild the October 2026 expansion from the saved arXiv Atom discovery round.
// The archive retains exact versioned metadata and abstracts without a fresh API request.
import {additionalCuration} from '../research/expansion-2026-10.mjs';
import {classifyStorage} from '../research/storage.mjs';
import {readJSON,writeJSON,sha256,validateCorpus,deduplicate} from './lib.mjs';

const papers=await readJSON('research/papers.json');
const candidates=await readJSON('research/candidates.json');
const protocol=await readJSON('research/protocol.json');
const taxonomy=await readJSON('research/taxonomy.json');
const log=await readJSON('research/collection-log.json');
const ledger=await readJSON('research/screening-ledger.json');
const candidateById=new Map(candidates.map(row=>[row.id,row]));
const paperById=new Map(papers.map(row=>[row.id,row]));
const ledgerById=new Map(ledger.map(row=>[row.id,row]));
for(const curated of additionalCuration){
  const source=candidateById.get(curated.id);
  if(!source||!source.abstract||!source.version||!source.sourceUrl)throw new Error(`Missing archived Atom source: ${curated.id}`);
  if(source.published<protocol.start||source.published>protocol.cutoff)throw new Error(`Outside cutoff: ${curated.id}`);
  if(!source.abstract.toLowerCase().match(/(coding|code|software|repository)/))throw new Error(`Software scope needs review: ${curated.id}`);
  const existing=paperById.get(curated.id);
  if(existing){
    if(existing.version!==source.version||existing.abstractHash!==sha256(source.abstract))throw new Error(`Source version changed: ${curated.id}`);
    continue;
  }
  const {abstract,query,screening,reason,matchedQueries,...metadata}=source;
  const paper=classifyStorage({...metadata,...curated,
    sourceUrl:source.sourceUrl,pdfUrl:`https://arxiv.org/pdf/${source.id}${source.version}`,
    evidenceUrl:source.sourceUrl,publication:'Preprint',venue:'arXiv',alternateSources:[],
    citationStatus:'preprint metadata only',year:Number(source.published.slice(0,4)),
    fullTextStatus:'Not collected',inclusionReason:'Explicit software-development agent memory method or memory evaluation in the archived primary-source abstract.',
    metadataCheckedAt:new Date().toISOString(),abstractHash:sha256(abstract)
  });
  papers.push(paper);
  log.screening.push({id:paper.id,decision:'include',reason:paper.inclusionReason});
  const row=ledgerById.get(paper.id);
  if(!row)throw new Error(`Missing screening-ledger candidate: ${paper.id}`);
  row.decision='include';row.reason=paper.inclusionReason;
  row.reviewer='Agent-assisted abstract screening';row.reviewedAt=new Date().toISOString();row.recordedAt=row.reviewedAt;
  row.evidenceUrl=source.sourceUrl;
  row.independentHumanReview=false;
  console.log(`Included ${paper.id}: ${paper.title}`);
}
if(papers.length>=250)throw new Error(`Expansion exceeds requested cap: ${papers.length}`);
if(deduplicate(papers).length!==papers.length)throw new Error('Duplicate paper in expansion');
validateCorpus(papers,taxonomy);
log.count=papers.length;
log.collectedAt=new Date().toISOString();
log.protocolVersion=protocol.version;
log.expansionTarget=protocol.expansionTarget;
log.method='Targeted primary-source collection plus reviewed additions from archived arXiv Atom discovery round; not exhaustive';
log.archivedExpansion={archive:'research/search-rounds/2026-10-03T21-10-47-474Z-candidates.json',date:'2026-10-13',count:additionalCuration.length,method:'Agent title/abstract screening and source-version-linked extraction; human review pending'};
await writeJSON('research/papers.json',papers);
await writeJSON('research/collection-log.json',log);
await writeJSON('research/screening-ledger.json',ledger);
console.log(`Saved ${papers.length} papers.`);
