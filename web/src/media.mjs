import {newItem} from './model.mjs';
import {describeMedia} from './media-types.mjs';
import {putFiles} from './storage.mjs';
export async function importMedia(scope,files){
 const items=[];
 const batch=Array.from(files).map(file=>({file,...describeMedia(file)}));
 for(const entry of batch){
  const {kind,mime}=entry;
  const file=entry.file.type===mime?entry.file:new File([entry.file],entry.file.name,{type:mime,lastModified:entry.file.lastModified});
  const assetId=crypto.randomUUID(),i=newItem(kind,{assetId,title:file.name.replace(/\.[^.]+$/,''),fileName:file.name,mime:file.type,size:file.size});
  const entries=[[scope+':'+assetId,file]];
  if(kind==='image'){
   const u=URL.createObjectURL(file);
   try{const img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=u;});i.width=img.naturalWidth;i.height=img.naturalHeight;const scale=Math.min(1,600/i.width),c=document.createElement('canvas');c.width=Math.round(i.width*scale);c.height=Math.round(i.height*scale);c.getContext('2d').drawImage(img,0,0,c.width,c.height);const thumb=await new Promise(r=>c.toBlob(r,'image/jpeg',.8));if(thumb){i.thumbnailId=crypto.randomUUID();entries.push([scope+':'+i.thumbnailId,thumb]);}}catch{/* Original is retained even when a thumbnail cannot be decoded. */}finally{URL.revokeObjectURL(u);}
  }
  if(kind==='video'||kind==='audio'){
   const url=URL.createObjectURL(file),media=document.createElement(kind==='video'?'video':'audio');media.preload='metadata';media.muted=true;
   try{await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Metadata timeout')),5000);media.onloadedmetadata=()=>{clearTimeout(timer);resolve();};media.onerror=()=>{clearTimeout(timer);reject(Error('Metadata unavailable'));};media.src=url;});
    if(Number.isFinite(media.duration))i.duration=media.duration;
    if(kind==='video'){i.width=media.videoWidth;i.height=media.videoHeight;}
   }catch{/* Unsupported metadata never discards the original file. */}finally{media.removeAttribute('src');media.load();URL.revokeObjectURL(url);}
  }
  await putFiles(entries);items.push(i);
 }
 return items;
}
