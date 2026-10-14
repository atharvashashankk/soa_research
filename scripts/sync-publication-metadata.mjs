import {readJSON, writeJSON} from './lib.mjs';

const papers = await readJSON('research/papers.json');
const metadata = await readJSON('research/publication-metadata.json');
for (const paper of papers) {
  const published = metadata[paper.id];
  if (published?.doi) paper.doi = published.doi;
  paper.citationStatus = published?.citationStatus || 'preprint metadata only';
}
await writeJSON('research/papers.json',papers);
console.log('Publication metadata synchronized. Unknown DOIs remain empty.');
