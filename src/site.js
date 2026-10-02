(() => {
  'use strict';
  const storageKey = 'agent-memory-atlas:reading-list:v1';
  let saved = new Set();
  try { const value = JSON.parse(localStorage.getItem(storageKey) || '[]'); if (Array.isArray(value)) saved = new Set(value.filter(id => typeof id === 'string' && /^\d{4}\.\d{4,5}$/.test(id))); } catch { /* Private browsing may deny storage. */ }
  function updateSaveButtons() {
    document.querySelectorAll('[data-save]').forEach(button => {
      const isSaved = saved.has(button.dataset.save);
      button.setAttribute('aria-pressed',String(isSaved));
      const label = button.getAttribute('aria-label') || '';
      button.setAttribute('aria-label', label.replace(/^(Save|Remove)/,isSaved?'Remove':'Save').replace(/(to|from) reading list$/,isSaved?'from reading list':'to reading list'));
      if (!button.classList.contains('save-button')) button.textContent = isSaved ? 'Saved to reading list' : 'Save to reading list';
    });
    const counter = document.querySelector('#saved-count'); if (counter) counter.textContent = saved.size;
  }
  let onSave = () => {};
  document.addEventListener('click',async event => {
    const button = event.target.closest('[data-save]');
    if (button) {
      const id = button.dataset.save;
      if (saved.has(id)) saved.delete(id); else saved.add(id);
      try { localStorage.setItem(storageKey,JSON.stringify([...saved])); } catch { /* Keep a session-only reading list if storage is denied. */ }
      updateSaveButtons(); onSave();
    }
    const copy = event.target.closest('[data-copy-citation]');
    if (copy) {
      const status = document.querySelector('.copy-status');
      try { await navigator.clipboard.writeText(document.querySelector('.citation code').textContent); status.textContent='Citation copied.'; }
      catch { status.textContent='Copy unavailable. Select the citation text above to copy it.'; }
    }
  });
  window.addEventListener('storage',event=>{
    if(event.key!==storageKey)return;
    try { const value=JSON.parse(event.newValue||'[]'); saved=new Set(Array.isArray(value)?value.filter(id=>typeof id==='string'&&/^\d{4}\.\d{4,5}$/.test(id)):[]); } catch {saved=new Set();}
    updateSaveButtons();onSave();
  });
  updateSaveButtons();
  if (!document.body.dataset.collection) return;
  const $ = (id) => document.getElementById(id);
  const filters = ['category','storage','stage','year','publication','setting','evidence'];
  const cards = new Map([...document.querySelectorAll('[data-paper-id]')].map(card=>[card.dataset.paperId,card]));
  const controls = [...filters.map($),$('search'),$('sort'),$('all-view'),$('saved-view'),$('reset-filters'),$('empty-reset'),$('export-filtered')];
  controls.forEach(c=>c.disabled=true);
  let papers=[], view='all', filtered=[];
  function setFromURL() {
    const params=new URLSearchParams(location.search);
    $('search').value=params.get('q')||'';
    for (const f of filters) {
      const value=params.get(f)||'';
      $(f).value=[...$(f).options].some(o=>o.value===value)?value:'';
    }
    const sort=params.get('sort')||'newest';
    $('sort').value=['newest','oldest','title'].includes(sort)?sort:'newest';
    view=params.get('view')==='saved'?'saved':'all';
  }
  function render(syncURL=true) {
    const query=$('search').value.trim().toLocaleLowerCase();
    const values=Object.fromEntries(filters.map(f=>[f,$(f).value]));
    filtered=papers.filter(p=>
      (view!=='saved'||saved.has(p.id)) &&
      (!values.category||p.categories.includes(values.category)) &&
      (!values.storage||p.storageCategories.includes(values.storage)) &&
      (!values.stage||p.stages.includes(values.stage)) &&
      (!values.year||String(p.year)===values.year) &&
      (!values.publication||p.publication===values.publication) &&
      (!values.setting||p.setting===values.setting) &&
      (!values.evidence||p.evidenceDepth===values.evidence) &&
      (!query||[p.storageSearchText,p.title,p.short,p.summary,...p.authors,p.representation,...Object.values(p.lifecycle),p.evaluation,...p.categories,...p.stages].join(' ').toLocaleLowerCase().includes(query))
    );
    filtered.sort((a,b)=>$('sort').value==='title'?a.title.localeCompare(b.title):$('sort').value==='oldest'?a.published.localeCompare(b.published)||a.id.localeCompare(b.id):b.published.localeCompare(a.published)||a.id.localeCompare(b.id));
    const visible=new Set(filtered.map(p=>p.id));
    for(const [id,card] of cards)card.hidden=!visible.has(id);
    filtered.forEach(p=>$('paper-grid').appendChild(cards.get(p.id)));
    $('result-count').textContent=`Showing ${filtered.length} of ${papers.length} papers${view==='saved'?' · reading list':''}`;
    $('empty-state').hidden=filtered.length>0;
    $('paper-grid').hidden=filtered.length===0;
    $('all-view').setAttribute('aria-pressed',String(view==='all'));
    $('saved-view').setAttribute('aria-pressed',String(view==='saved'));
    $('export-filtered').disabled=filtered.length===0;
    if(syncURL) {
      const params=new URLSearchParams();
      if(query)params.set('q',$('search').value.trim());
      for(const [f,v]of Object.entries(values))if(v)params.set(f,v);
      if($('sort').value!=='newest')params.set('sort',$('sort').value);
      if(view==='saved')params.set('view','saved');
      history.replaceState(null,'',location.pathname+(params.size?'?'+params.toString():'')+location.hash);
    }
  }
  function reset(){filters.forEach(f=>$(f).value='');$('search').value='';$('sort').value='newest';view='all';render();}
  fetch(new URL('data/papers.json',document.baseURI))
    .then(response=>{if(!response.ok)throw new Error('Research data unavailable');return response.json();})
    .then(data=>{
      if(!Array.isArray(data)||!data.length||data.some(p=>!cards.has(p.id)))throw new Error('Research data does not match page');
      papers=data;setFromURL();controls.forEach(c=>c.disabled=false);render(false);
      filters.forEach(f=>$(f).addEventListener('change',()=>render()));
      $('search').addEventListener('input',()=>render());
      $('sort').addEventListener('change',()=>render());
      $('all-view').addEventListener('click',()=>{view='all';render();});
      $('saved-view').addEventListener('click',()=>{view='saved';render();});
      $('reset-filters').addEventListener('click',reset);$('empty-reset').addEventListener('click',reset);
      onSave=()=>render();
      window.addEventListener('popstate',()=>{setFromURL();render(false);});
      document.addEventListener('keydown',event=>{
        if(event.key==='/'&&!event.ctrlKey&&!event.metaKey&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){event.preventDefault();$('search').focus();}
      });
      $('export-filtered').addEventListener('click',()=>{
        const blob=new Blob([JSON.stringify(filtered,null,2)+'\n'],{type:'application/json'});
        const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='agent-memory-atlas-selection.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
      });
    })
    .catch(()=>{ $('data-error').hidden=false; controls.forEach(c=>c.disabled=true); });
})();
