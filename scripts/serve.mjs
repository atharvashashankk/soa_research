import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const base = resolve(fileURLToPath(new URL('../dist/',import.meta.url)));
const port = Number(process.env.PORT || 4173);
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.csv':'text/csv; charset=utf-8','.bib':'text/plain; charset=utf-8'};
export const server = createServer(async (req,res)=>{
  try {
    let pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    // Serve both root and an arbitrary project prefix for GitHub Pages E2E checks.
    if (pathname.startsWith('/soa_research/')) pathname = pathname.slice('/soa_research'.length);
    const target = resolve(base,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
    if (target!==base && !target.startsWith(base+sep)) {res.writeHead(403);res.end('Forbidden');return;}
    if (!(await stat(target)).isFile()) throw Object.assign(new Error('Not found'),{code:'ENOENT'});
    const content = await readFile(target);
    res.writeHead(200,{'Content-Type':types[extname(target)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(content);
  } catch(e) {
    res.writeHead(e.code==='ENOENT'?404:400,{'Content-Type':'text/plain; charset=utf-8'});res.end(e.code==='ENOENT'?'Not found':'Bad request');
  }
});
server.listen(port,'127.0.0.1',()=>console.log(`Research atlas: http://127.0.0.1:${server.address().port}/`));
for (const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>server.close(()=>process.exit(0)));
