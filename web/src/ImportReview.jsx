import React,{useState} from 'react';
import CropEditor from './CropEditor.jsx';
import {validURL} from './model.mjs';
import {describeMedia} from './media-types.mjs';
export default function ImportReview({files,onSave,onDone,initialSource='',initialTitle=''}){
 const [index,setIndex]=useState(0);
 const next=()=>{if(index+1<files.length)setIndex(index+1);else onDone();};
 return <ImportStep key={index} file={files[index]} index={index} total={files.length} initialSource={initialSource} initialTitle={initialTitle} onSave={async fields=>{await onSave(files[index],fields);next();}}/>;
}
function ImportStep({file,index,total,onSave,initialSource,initialTitle}){
 const [title,setTitle]=useState(initialTitle?`${initialTitle} ${index+1}`:file.name.replace(/\.[^.]+$/,'')),[note,setNote]=useState(''),[source,setSource]=useState(initialSource),[saving,setSaving]=useState(false),[error,setError]=useState('');
 const image=describeMedia(file).kind==='image';
 const fields=<><small>Item {index+1} of {total} · Not saved yet</small><label>Title<input aria-label="Title" value={title} maxLength={300} onChange={e=>setTitle(e.target.value)}/></label><label>Notes<textarea aria-label="Notes" value={note} maxLength={12000} placeholder="What caught your eye?" onChange={e=>setNote(e.target.value)}/></label><label>Source link (optional)<input aria-label="Source link (optional)" type="url" inputMode="url" autoCapitalize="none" autoCorrect="off" placeholder="https://…" maxLength={4000} value={source} onChange={e=>{setSource(e.target.value);setError('');}}/></label><small>Keep the original post or website link. You can leave this blank.</small></>;
 async function save(crop){if(!title.trim())throw Error('Enter a title before saving.');const text=source.trim(),sourceURL=text?validURL(text):'';if(text&&!sourceURL)throw Error('Enter a valid http or https source link, or leave it blank.');await onSave({title:title.trim(),note,sourceURL,...(crop?{crop}:{})});}
 return <><div className="import-review-hint">Review before adding to your library. Cancel discards the remaining items.</div>{image?<CropEditor item={{}} sourceFile={file} onSave={save} saveLabel={index+1<total?'Save & Next':'Save to Library'}>{fields}</CropEditor>:<div className="item-form">{fields}<p>{file.name}</p>{error&&<p role="alert">{error}</p>}<button className="primary" disabled={saving} onClick={async()=>{setSaving(true);try{await save(null);}catch(e){setError(e.message);}finally{setSaving(false);}}}>{saving?'Saving…':index+1<total?'Save & Next':'Save to Library'}</button></div>}</>;
}
