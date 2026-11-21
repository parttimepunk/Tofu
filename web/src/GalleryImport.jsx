import React,{useState,useEffect} from 'react';
import {ChevronLeft,ChevronRight,ArrowLeft,ArrowRight} from 'lucide-react';
import CropEditor from './CropEditor.jsx';
import {validURL} from './model.mjs';

function Preview({file}){
 const [url,setURL]=useState('');
 useEffect(()=>{const u=URL.createObjectURL(file);setURL(u);return()=>URL.revokeObjectURL(u);},[file]);
 return url?<img src={url} alt=""/>:null;
}
export default function GalleryImport({files,initialTitle,initialSource,onSave,onSaveSingle,onDone}){
 const [photos,setPhotos]=useState(()=>files.map((file,index)=>({file,id:index,crop:undefined})));
 const [active,setActive]=useState(0),[title,setTitle]=useState(initialTitle||files[0].name.replace(/\.[^.]+$/,'')),[note,setNote]=useState(''),[source,setSource]=useState(initialSource||''),[saving,setSaving]=useState(false),[error,setError]=useState('');
 // Append by File identity. Existing entries keep their order, crops and keys.
 useEffect(()=>{setPhotos(all=>{const known=new Set(all.map(p=>p.file));const added=files.filter(file=>!known.has(file));return added.length?[...all,...added.map(file=>({file,id:crypto.randomUUID(),crop:undefined}))]:all;});},[files]);
 const current=photos[active];
 function move(delta){const next=active+delta;if(next<0||next>=photos.length)return;setPhotos(all=>{const result=[...all];[result[active],result[next]]=[result[next],result[active]];return result;});setActive(next);}
 async function save(){
  if(saving)return;setError('');
  if(!title.trim()){setError('Enter a title before saving.');return;}
  const text=source.trim(),sourceURL=text?validURL(text):'';
  if(text&&!sourceURL){setError('Enter a valid http or https source link, or leave it blank.');return;}
  setSaving(true);try{if(photos.length===1)await onSaveSingle(photos[0].file,{title:title.trim(),note,sourceURL,...(photos[0].crop?{crop:photos[0].crop}:{})});else await onSave(photos.map(p=>p.file),{title:title.trim(),note,sourceURL},photos.map(p=>p.crop));onDone();}catch(e){setError(e.message);}finally{setSaving(false);}
 }
 return <div className="gallery-import">
  <div className="item-form">
   <small>{photos.length===1?'Item 1 of 1 · Not saved yet':`${photos.length} images · One gallery · Not saved yet`}</small><small>Drop more images into this window to add them before saving.</small>
   <label>Title<input aria-label="Title" maxLength={300} value={title} disabled={saving} onChange={e=>setTitle(e.target.value)}/></label>
   <label>Notes<textarea aria-label="Notes" maxLength={12000} value={note} disabled={saving} placeholder="What caught your eye?" onChange={e=>setNote(e.target.value)}/></label>
   <label>Source link (optional)<input aria-label="Source link (optional)" type="url" inputMode="url" autoCapitalize="none" autoCorrect="off" maxLength={4000} value={source} disabled={saving} placeholder="https://…" onChange={e=>setSource(e.target.value)}/></label>
   <div className="gallery-strip" aria-label="Gallery images">{photos.map((p,n)=><button key={p.id} disabled={saving} className={n===active?'selected':''} aria-label={`Edit image ${n+1}`} aria-pressed={n===active} onClick={()=>setActive(n)}><Preview file={p.file}/><span>{n===0?'Cover':n+1}</span></button>)}</div>
   <div className="gallery-controls"><button className="icon-button" aria-label="Previous image" disabled={saving||active===0} onClick={()=>setActive(active-1)}><ChevronLeft/></button><span aria-live="polite">Image {active+1} of {photos.length}</span><button className="icon-button" aria-label="Next image" disabled={saving||active===photos.length-1} onClick={()=>setActive(active+1)}><ChevronRight/></button></div>
   <div className="gallery-controls"><button className="text-button" disabled={saving||active===0} onClick={()=>move(-1)}><ArrowLeft size={16}/>Move earlier</button><button className="text-button" disabled={saving||active===photos.length-1} onClick={()=>move(1)}>Move later<ArrowRight size={16}/></button></div>
  </div>
  <fieldset className="gallery-crop" disabled={saving}><CropEditor key={current.id} item={{crop:current.crop}} sourceFile={current.file} showSave={false} onCropChange={crop=>setPhotos(all=>all.map(p=>p.id===current.id?{...p,crop}:p))}/></fieldset>
  <div className="item-form gallery-save">{error&&<p role="alert">{error}</p>}<small>The first image is the cover. Originals are preserved.</small><button className="primary" disabled={saving} onClick={save}>{saving?'Saving…':photos.length===1?'Save to Library':'Save Gallery to Library'}</button></div>
 </div>;
}
