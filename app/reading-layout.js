(function(root){
 'use strict';
 const profiles={K:{font:38,words:18,chars:42,sentences:2},E1:{font:34,words:32,chars:68,sentences:3},E2:{font:30,words:48,chars:100,sentences:4},E3:{font:28,words:64,chars:140,sentences:5}};
 const SIZE_KEY='my-sia-reading-size-v1',factors=[.7,.85,1,1.15,1.3],labels=['작게','조금 작게','기본','조금 크게','크게'];let selected=0;
 const valid=n=>Number.isInteger(n)&&n>=-2&&n<=2;
 try{const saved=JSON.parse(root.localStorage?.getItem(SIZE_KEY)||'0');if(valid(saved))selected=saved;}catch{}
 const size=()=>selected;
 function setSize(n){if(!valid(n))return false;selected=n;try{root.localStorage?.setItem(SIZE_KEY,JSON.stringify(n));}catch{}return true;}
 function profile(band='E1',level=1,choice=selected){const b=profiles[band]||profiles.E1,n=Math.max(1,Math.min(5,Number(level)||1)),factor=factors[(valid(choice)?choice:0)+2],density=1/(factor*factor);return {font:Math.max(18,Math.round((b.font-(n-1))*factor)),words:Math.round((b.words+(n-1)*5)*density),chars:Math.round((b.chars+(n-1)*12)*density),sentences:Math.max(1,Math.round((b.sentences+(n>=4&&['E2','E3'].includes(band)?1:0))*density)),band,level:n,factor};}
 function sentences(text,lang='en'){
  const parts=typeof Intl.Segmenter==='function'?[...new Intl.Segmenter(lang,{granularity:'sentence'}).segment(text)].map(s=>s.segment):String(text).match(/[^.!?。！？]+[.!?。！？]+["'”’]*\s*|[^.!?。！？]+$/gu)||[String(text)];
  const joined=[];for(const part of parts){if(lang==='en'&&joined.length&&/\b(?:Mr|Mrs|Ms|Dr|Prof)\.\s*$/i.test(joined.at(-1)))joined[joined.length-1]+=part;else joined.push(part);}return joined;
 }
 function paginate(paragraphs,band='E1',level=1,lang='en',choice=selected){
  const cfg=profile(band,level,choice),budget=lang==='ko'?cfg.chars:cfg.words,pages=[];let items=[],size=0,serial=0;
  const flush=()=>{if(items.length)pages.push({items,units:size});items=[];size=0;};
  paragraphs.forEach((p,i)=>{const text=typeof p==='string'?p:p.text,index=typeof p==='string'?i:p.index;
   for(const sentence of sentences(text,lang)){const units=lang==='ko'?(sentence.match(/[가-힣0-9]/g)||[]).length:(sentence.match(/[A-Za-z0-9’'-]+/g)||[]).length;
    if(items.length&&(size+units>budget||items.length>=cfg.sentences))flush();
    items.push({text:sentence,paragraph:index,sentence:serial++});size+=units;
   }
  });flush();return pages;
 }
 // A short passage can use larger type; long passages get more pages, never smaller type.
 function style(band,level,page){const cfg=profile(band,level),base=profile(band,level,0),font=cfg.font+(page&&page.items.length<=2?Math.round(2*cfg.factor):0);return `--reading-font:${font}px;--reading-question:${Math.max(18,Math.round(Math.max(26,base.font-2)*cfg.factor))}px;--reading-option:${Math.max(18,Math.round(Math.max(24,base.font-4)*cfg.factor))}px`;}
 function pageAt(pages,anchor=0){const found=pages.findIndex(p=>p.items.some(x=>x.sentence===anchor));return found<0?0:found;}
 function controls(){return `<div class="reading-size-controls" role="group" aria-label="글자 크기"><span>글자 크기</span><button type="button" data-reading-size="${selected-1}" aria-label="글자 줄이기" ${selected===-2?'disabled':''}>가− <span>줄이기</span></button><output aria-live="polite">${labels[selected+2]}</output><button type="button" data-reading-size="${selected+1}" aria-label="글자 키우기" ${selected===2?'disabled':''}>가+ <span>키우기</span></button><button type="button" data-reading-size="0" aria-label="기본 크기로" ${selected===0?'disabled':''}>기본 크기</button></div>`;}
 const E=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function prose(page){return page.items.map(item=>`<span class="reading-sentence">${E(item.text.trim())}</span>`).join(' ');}
 const api={profile,sentences,paginate,style,prose,size,setSize,pageAt,controls};root.SiaReadingLayout=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
