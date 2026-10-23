export const MAX_FILE_SIZE=50*1024*1024;
export const emptyDocument=()=>({version:1,items:[],collections:[]});
export const copy=x=>structuredClone(x);
export function stable(x){if(Array.isArray(x))return '['+x.map(v=>stable(v)??'null').join(',')+']';if(x&&typeof x==='object')return '{'+Object.keys(x).filter(k=>x[k]!==undefined).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}';return JSON.stringify(x);}
const equal=(a,b)=>stable(a)===stable(b);
export function validURL(s){try{const u=new URL(s);return ['https:','http:'].includes(u.protocol)?u.href:null;}catch{return null;}}
export function validate(doc){
  if(doc?.version!==1||!Array.isArray(doc.items)||!Array.isArray(doc.collections)||doc.items.length>10000)throw Error('This library is unsupported. Your stored data has been preserved.');
  for(const i of doc.items){const c=i.crop;if(c&&(!['x','y','w','h','sourceWidth','sourceHeight'].every(k=>Number.isFinite(c[k]))||c.x<0||c.y<0||c.w<=0||c.h<=0||c.x+c.w>1.000001||c.y+c.h>1.000001||c.sourceWidth<=0||c.sourceHeight<=0))throw Error('Invalid crop metadata. Writes are disabled.');}
  const ids=new Set();
  for(const i of doc.items){if(typeof i.id!=='string'||!i.id||ids.has(i.id)||typeof i.title!=='string'||!['image','video','audio','link','note'].includes(i.kind)||!Array.isArray(i.tags)||i.tags.some(t=>typeof t!=='string')||!Number.isFinite(i.order)||!Number.isFinite(Date.parse(i.createdAt))||typeof i.collection!=='string'||typeof i.note!=='string'||(i.sourceURL&&!validURL(i.sourceURL))||(i.assetId&&!/^[a-f0-9-]{36}$/i.test(i.assetId)))throw Error('Library metadata is invalid. Writes are disabled.');ids.add(i.id);}
  for(const i of doc.items){if(i.thumbnailId&&!/^[a-f0-9-]{36}$/i.test(i.thumbnailId))throw Error('Invalid thumbnail metadata.');if(!Number.isFinite(Date.parse(i.updatedAt))||(i.trashedAt&&!Number.isFinite(Date.parse(i.trashedAt))))throw Error('Invalid item dates.');}
  if(doc.collections.some(c=>typeof c!=='string'))throw Error('Invalid collections.');return doc;
}
export function newItem(kind,fields={}){const now=new Date().toISOString();return {id:crypto.randomUUID(),kind,title:kind==='note'?'Untitled Note':'Untitled',createdAt:now,updatedAt:now,order:Date.now(),note:'',sourceURL:'',collection:'',tags:[],favorite:false,trashedAt:null,...fields};}
export function mergeDocuments(base,local,remote){
  [base,local,remote].forEach(validate);
  const maps=[base,local,remote].map(d=>new Map(d.items.map(i=>[i.id,i])));const items=[];const conflicts=[];
  for(const id of new Set([...maps[1].keys(),...maps[2].keys()])){
    const [b,l,r]=maps.map(m=>m.get(id));
    if(equal(l,r)){if(l)items.push(copy(l));continue;}
    if(equal(l,b)){if(r)items.push(copy(r));continue;}
    if(equal(r,b)){if(l)items.push(copy(l));continue;}
    if(!b||!l||!r){conflicts.push(id);continue;}
    // Removing an item and concurrently editing it always requires review.
    const lRemoved=l.trashedAt!==b.trashedAt,rRemoved=r.trashedAt!==b.trashedAt;
    if((lRemoved||rRemoved)&&l.trashedAt!==r.trashedAt){conflicts.push(id);continue;}
    const merged={};let conflict=false;
    for(const key of new Set([...Object.keys(b),...Object.keys(l),...Object.keys(r)])){
      if(key==='updatedAt'){merged[key]=l[key]>r[key]?l[key]:r[key];continue;}
      if(equal(l[key],r[key])||equal(r[key],b[key]))merged[key]=copy(l[key]);
      else if(equal(l[key],b[key]))merged[key]=copy(r[key]);else conflict=true;
    }
    if(conflict)conflicts.push(id);else items.push(merged);
  }
  if(conflicts.length)throw Object.assign(Error('Sync paused: the same item changed on both devices. Export a backup and review the conflicting items.'),{conflicts});
  return validate({version:1,items,collections:[...new Set([...local.collections,...remote.collections])].sort()});
}
export function moveItem(doc,id,delta,collection=''){
 const ordered=doc.items.filter(i=>!i.trashedAt&&(!collection||i.collection===collection)).sort((a,b)=>a.order-b.order||a.id.localeCompare(b.id));const n=ordered.findIndex(i=>i.id===id),target=n+delta;if(n<0||target<0||target>=ordered.length)return doc;
 [ordered[n],ordered[target]]=[ordered[target],ordered[n]];const ranks=new Map(ordered.map((i,n)=>[i.id,n]));const now=new Date().toISOString();return {...doc,items:doc.items.map(i=>ranks.has(i.id)?{...i,order:ranks.get(i.id),updatedAt:now}:i)};
}
export function fromMac(doc){
 if(doc.version!==1||!Array.isArray(doc.items))throw Error('Unsupported Mac library.');
 const date=d=>typeof d==='number'?new Date((d+978307200)*1000).toISOString():new Date(d).toISOString();
 return validate({version:1,collections:doc.collections||[],items:doc.items.map(i=>newItem(i.kind,{id:i.id,title:i.title,note:i.note||'',sourceURL:i.sourceURL||'',collection:i.collection||'',tags:i.tags||[],favorite:!!i.isFavorite,trashedAt:i.trashedAt?date(i.trashedAt):null,createdAt:date(i.createdAt),updatedAt:date(i.updatedAt),order:i.creativeOrder||0,...(i.relativeFile?{macFile:i.relativeFile,fileName:i.relativeFile.split('/').pop()}:{}),width:i.width,height:i.height,duration:i.duration}))});
}
