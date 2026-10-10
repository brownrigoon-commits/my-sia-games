(function(root){
 'use strict';
 const cacheKey=(id,v)=>id+'@'+v;
 // Retain only a child's work and measured times from retired content; never retain old prose or answer keys.
 function archiveRecord(s){return {id:s.id,seriesId:s.seriesId,catalogVersion:s.catalogVersion||'legacy',startedAt:s.startedAt,completedAt:s.completedAt,level:s.level,lang:s.lang,band:s.band,answers:s.answers||{},drawings:s.drawings||{},timings:s.timings||{},finalQuestionMs:s.finalQuestionMs||0,archivedAt:new Date().toISOString()};}
 function create(v){
  const mem={cache:new Map(),sessions:new Map(),archive:new Map()};let db=null;
  const ready=new Promise(resolve=>{try{const req=indexedDB.open('my-sia-story-data',2);req.onupgradeneeded=()=>{const d=req.result;for(const name of ['cache','sessions','archive'])if(!d.objectStoreNames.contains(name))d.createObjectStore(name,{keyPath:'id'});};req.onerror=req.onblocked=()=>resolve(false);req.onsuccess=()=>{db=req.result;db.onversionchange=()=>{db.close();db=null;};const tx=db.transaction(['cache','sessions','archive'],'readwrite');const caches=tx.objectStore('cache'),old=caches.openCursor();old.onsuccess=()=>{const c=old.result;if(!c)return;if(!String(c.key).endsWith('@'+v))c.delete();c.continue();};const sessions=tx.objectStore('sessions'),list=sessions.openCursor();list.onsuccess=()=>{const c=list.result;if(!c)return;const s=c.value;if(s.schemaVersion!==2||s.catalogVersion!==v){tx.objectStore('archive').put(archiveRecord(s));c.delete();}c.continue();};tx.oncomplete=()=>resolve(true);tx.onerror=tx.onabort=()=>{db.close();db=null;resolve(false);};};}catch{resolve(false);}});
  async function get(store,id){await ready;if(!db)return mem[store].get(id);return new Promise(resolve=>{try{const r=db.transaction(store).objectStore(store).get(id);r.onsuccess=()=>resolve(r.result||mem[store].get(id));r.onerror=()=>resolve(mem[store].get(id));}catch{resolve(mem[store].get(id));}});}
  async function put(store,value){mem[store].set(value.id,structuredClone(value));await ready;if(!db)return false;return new Promise(resolve=>{try{const tx=db.transaction(store,'readwrite');tx.objectStore(store).put(structuredClone(value));tx.oncomplete=()=>resolve(true);tx.onerror=tx.onabort=()=>resolve(false);}catch{resolve(false);}});}
  async function all(store){await ready;const entries=db?await new Promise(resolve=>{try{const r=db.transaction(store).objectStore(store).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>resolve([]);}catch{resolve([]);}}):[];const map=new Map(entries.map(s=>[s.id,s]));for(const [id,s]of mem[store])if(!map.has(id)||(map.get(id).updatedAt||'')<(s.updatedAt||''))map.set(id,s);return [...map.values()];}
  return {ready,get,put,all};
 }
 const api={cacheKey,archiveRecord,create};root.SiaStoryStore=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);
