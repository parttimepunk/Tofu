import {createClient} from '@supabase/supabase-js';
import {readState,updateState,getFile,putFiles,backup} from './storage.mjs';
import {emptyDocument,mergeDocuments,stable,validate} from './model.mjs';
export const supabaseURL=import.meta.env.VITE_SUPABASE_URL||'';
export const supabaseKey=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY||'';
export const cloudConfigured=Boolean(supabaseURL&&supabaseKey);
export const cloud=cloudConfigured?createClient(supabaseURL,supabaseKey,{auth:{storageKey:'tofu.auth.v1',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
const bucket=()=>cloud.storage.from('tofu-media');
const path=(uid,id)=>`${uid}/${id}/original`;
export async function readCloud(client=cloud){const {data,error}=await client.from('tofu_sync_state').select('version,document').maybeSingle();if(error)throw error;return data?{version:data.version,document:validate(data.document)}:{version:0,document:emptyDocument()};}
const running=new Map();
export async function synchronize(scope){
 if(running.has(scope))return running.get(scope);
 const work=async()=>{
   const {data:{user},error}=await cloud.auth.getUser();if(error)throw error;if(!user||user.id!==scope)throw Error('Sign in again to sync this library.');
   const {data:{session}}=await cloud.auth.getSession();if(!session||session.user.id!==scope)throw Error('The signed-in account changed.');
   // Pin this operation to its original account even if the UI signs out or switches users.
   const client=createClient(supabaseURL,supabaseKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{headers:{Authorization:`Bearer ${session.access_token}`}}});
   for(let attempt=0;attempt<3;attempt++){
    const initial=await readState(scope);if(!initial.enabled)return;
    const remote=await readCloud(client);if(remote.version<initial.cloudVersion)throw Error('Cloud history changed unexpectedly. Sync is paused.');
    const merged=mergeDocuments(initial.baseline,initial.document,remote.document);
    const known=new Set(remote.document.items.flatMap(i=>[i.assetId,i.thumbnailId]).filter(Boolean));
    for(const i of merged.items){for(const id of [i.assetId,i.thumbnailId].filter(Boolean)){if(known.has(id))continue;const blob=await getFile(scope,id);if(!blob)throw Error(`The original file for “${i.title}” is missing locally. Sync is paused.`);const {error}=await client.storage.from('tofu-media').upload(path(scope,id),blob,{contentType:blob.type||i.mime||'application/octet-stream',upsert:false});if(error&&String(error.statusCode)!=='409')throw error;}}
    let accepted=remote;
    if(stable(merged)!==stable(remote.document)){
      const {data,error}=await client.rpc('tofu_save_snapshot',{expected_version:remote.version,next_document:merged});
      if(error?.code==='40001')continue;if(error)throw error;accepted={version:Number(data),document:merged};
    }
    const current=await readState(scope);if(!current.enabled)return;
    await updateState(scope,s=>({...s,document:mergeDocuments(initial.document,s.document,accepted.document),baseline:accepted.document,cloudVersion:accepted.version}));return accepted.version;
   }
   throw Error('Another device is updating this library. Please try Sync now again.');
 };
 // Web Locks serialize tabs; CAS still protects different devices/browsers.
 const operation=(navigator.locks?navigator.locks.request('tofu-sync',work):work()).finally(()=>running.delete(scope));running.set(scope,operation);return operation;
}
export async function enableSync(scope,copyLocal){
 await backup(scope);
 if(copyLocal){const guest=await readState('local');for(const i of guest.document.items){for(const id of [i.assetId,i.thumbnailId].filter(Boolean)){const blob=await getFile('local',id);if(blob)await putFiles([[scope+':'+id,blob]]);}}
 await updateState(scope,s=>({...s,document:mergeDocuments(emptyDocument(),s.document,guest.document)}));}
 await updateState(scope,s=>({...s,enabled:true}));return synchronize(scope);
}
export async function mediaURL(scope,item){const blob=await getFile(scope,item.assetId);if(blob)return {url:URL.createObjectURL(blob),local:true};if(scope==='local')throw Error('The original file is unavailable.');const {data,error}=await bucket().createSignedUrl(path(scope,item.assetId),3600);if(error)throw error;return {url:data.signedUrl,local:false};}
export async function keepBoth(scope){await backup(scope,'before-conflict-review');const remote=await readCloud();await updateState(scope,s=>{let ids;try{mergeDocuments(s.baseline,s.document,remote.document);return s;}catch(e){if(!e.conflicts)throw e;ids=new Set(e.conflicts);}const originals=s.document.items.filter(i=>ids.has(i.id));const safeLocal={...s.document,items:[...s.document.items.filter(i=>!ids.has(i.id)),...s.baseline.items.filter(i=>ids.has(i.id))]};const merged=mergeDocuments(s.baseline,safeLocal,remote.document);merged.items.push(...originals.map(i=>({...i,id:crypto.randomUUID(),title:i.title+' (local copy)'})));return {...s,document:merged,baseline:remote.document,cloudVersion:remote.version};});return synchronize(scope);}
