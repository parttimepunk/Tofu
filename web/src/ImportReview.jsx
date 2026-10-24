import React,{useState} from 'react';
import CropEditor from './CropEditor.jsx';
import {describeMedia} from './media-types.mjs';
export default function ImportReview({files,onSave,onDone}){
 const [index,setIndex]=useState(0);
 const next=()=>{if(index+1<files.length)setIndex(index+1);else onDone();};
 return <ImportStep key={index} file={files[index]} index={index} total={files.length} onSave={async fields=>{await onSave(files[index],fields);next();}}/>;
}
function ImportStep({file,index,total,onSave}){
 const [title,setTitle]=useState(file.name.replace(/\.[^.]+$/,'')),[note,setNote]=useState(''),[saving,setSaving]=useState(false),[error,setError]=useState('');
 const image=describeMedia(file).kind==='image';
 const fields=<><small>Item {index+1} of {total} · Not saved yet</small><label>Title<input aria-label="Title" value={title} maxLength={300} onChange={e=>setTitle(e.target.value)}/></label><label>Notes<textarea aria-label="Notes" value={note} maxLength={12000} placeholder="What caught your eye?" onChange={e=>setNote(e.target.value)}/></label></>;
 async function save(crop){if(!title.trim())throw Error('Enter a title before saving.');await onSave({title:title.trim(),note,...(crop?{crop}:{})});}
 return <><div className="import-review-hint">Review before adding to your library. Cancel discards the remaining items.</div>{image?<CropEditor item={{}} sourceFile={file} onSave={save} saveLabel={index+1<total?'Save & Next':'Save to Library'}>{fields}</CropEditor>:<div className="item-form">{fields}<p>{file.name}</p>{error&&<p role="alert">{error}</p>}<button className="primary" disabled={saving} onClick={async()=>{setSaving(true);try{await save(null);}catch(e){setError(e.message);}finally{setSaving(false);}}}>{saving?'Saving…':index+1<total?'Save & Next':'Save to Library'}</button></div>}</>;
}
