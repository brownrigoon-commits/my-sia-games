(function(root){
 'use strict';
 const profiles={K:{font:38,words:18,chars:42,sentences:2},E1:{font:34,words:32,chars:68,sentences:3},E2:{font:30,words:48,chars:100,sentences:4},E3:{font:28,words:64,chars:140,sentences:5}};
 function profile(band='E1',level=1){const b=profiles[band]||profiles.E1,n=Math.max(1,Math.min(5,Number(level)||1));return {font:b.font-(n-1),words:b.words+(n-1)*5,chars:b.chars+(n-1)*12,sentences:b.sentences+(n>=4&&['E2','E3'].includes(band)?1:0),band,level:n};}
 function sentences(text,lang='en'){
  const parts=typeof Intl.Segmenter==='function'?[...new Intl.Segmenter(lang,{granularity:'sentence'}).segment(text)].map(s=>s.segment):String(text).match(/[^.!?。！？]+[.!?。！？]+["'”’]*\s*|[^.!?。！？]+$/gu)||[String(text)];
  const joined=[];for(const part of parts){if(lang==='en'&&joined.length&&/\b(?:Mr|Mrs|Ms|Dr|Prof)\.\s*$/i.test(joined.at(-1)))joined[joined.length-1]+=part;else joined.push(part);}return joined;
 }
 function paginate(paragraphs,band='E1',level=1,lang='en'){
  const cfg=profile(band,level),budget=lang==='ko'?cfg.chars:cfg.words,pages=[];let items=[],size=0,serial=0;
  const flush=()=>{if(items.length)pages.push({items,units:size});items=[];size=0;};
  paragraphs.forEach((p,i)=>{const text=typeof p==='string'?p:p.text,index=typeof p==='string'?i:p.index;
   for(const sentence of sentences(text,lang)){const units=lang==='ko'?(sentence.match(/[가-힣0-9]/g)||[]).length:(sentence.match(/[A-Za-z0-9’'-]+/g)||[]).length;
    if(items.length&&(size+units>budget||items.length>=cfg.sentences))flush();
    items.push({text:sentence,paragraph:index,sentence:serial++});size+=units;
   }
  });flush();return pages;
 }
 // A short passage can use larger type; long passages get more pages, never smaller type.
 function style(band,level,page){const cfg=profile(band,level),font=cfg.font+(page&&page.items.length<=2?2:0);return `--reading-font:${font}px;--reading-question:${Math.max(26,cfg.font-2)}px;--reading-option:${Math.max(24,cfg.font-4)}px`;}
 const E=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function prose(page){return page.items.map(item=>`<span class="reading-sentence">${E(item.text.trim())}</span>`).join(' ');}
 const api={profile,sentences,paginate,style,prose};root.SiaReadingLayout=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
