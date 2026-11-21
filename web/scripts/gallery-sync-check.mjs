// Tests the real sync module with a synthetic backend and isolated device stores.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const origin=process.env.TOFU_TEST_URL||'http://127.0.0.1:5186/';
const browser=await chromium.launch({headless:true,executablePath:process.env.TOFU_CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const uid='11111111-1111-4111-8111-111111111111',remote={version:0,document:{version:1,items:[],collections:[]}},assets=new Map();
const mock=`export function createClient(){return {auth:{onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}}},async getSession(){return {data:{session:{user:{id:'${uid}'},access_token:'synthetic'}}}},async getUser(){return {data:{user:{id:'${uid}'}}}}},from(){return {select(){return {async maybeSingle(){return {data:await window.syntheticBackend('read')}}}}}},storage:{from(){return {async upload(path,blob){return window.syntheticBackend('upload',{path,bytes:[...new Uint8Array(await blob.arrayBuffer())],mime:blob.type})},async createSignedUrl(path){return {data:{signedUrl:location.origin+'/synthetic-media/'+path}}}}}},async rpc(name,args){return window.syntheticBackend('rpc',args)}}}`;
async function device(){
 const context=await browser.newContext(),page=await context.newPage();
 await page.exposeFunction('syntheticBackend',async(action,value)=>{
  if(action==='read')return remote.version?structuredClone(remote):null;
  if(action==='upload'){assert.ok(value.path.startsWith(uid+'/'));assets.set(value.path,value);return {error:null};}
  if(action==='rpc'){assert.equal(value.expected_version,remote.version);remote.document=structuredClone(value.next_document);return {data:++remote.version,error:null};}
  throw Error('Unexpected synthetic operation');
 });
 await page.route('**/src/cloud.mjs*',async route=>{const response=await route.fetch();let body=await response.text();body=body.replace(/export const supabaseURL=[^;]+;/,"export const supabaseURL='https://synthetic.invalid';").replace(/export const supabaseKey=[^;]+;/,"export const supabaseKey='synthetic-public-key';");await route.fulfill({response,body});});
 await page.route('**/node_modules/.vite/deps/@supabase_supabase-js.js*',r=>r.fulfill({contentType:'application/javascript',body:mock}));
 await page.route('**/synthetic-media/**',r=>{const path=new URL(r.request().url()).pathname.slice('/synthetic-media/'.length),a=assets.get(path);return r.fulfill({status:a?200:404,contentType:a?.mime||'application/octet-stream',body:a?Buffer.from(a.bytes):'Missing'});});
 await page.goto(origin);await page.getByText('Your space for inspiration',{exact:true}).waitFor();return {page,context};
}
try{
 const a=await device();
 await a.page.evaluate(async()=>{
  const {newItem}=await import('/src/model.mjs'),{makeGallery}=await import('/src/gallery.mjs'),{putFiles,updateState}=await import('/src/storage.mjs');
  const images=[0,1,2].map(n=>newItem('image',{assetId:crypto.randomUUID(),thumbnailId:crypto.randomUUID(),fileName:`Image-${n}.png`,mime:'image/png',size:4,width:100,height:100}));
  const gallery=makeGallery(images,[],{title:'Synthetic synced gallery'});
  await putFiles(images.flatMap((i,n)=>[['local:'+i.assetId,new Blob(['img'+n],{type:'image/png'})],['local:'+i.thumbnailId,new Blob(['thm'+n],{type:'image/png'})]]));
  await updateState('local',s=>({...s,document:{...s.document,items:[gallery]}}));
 });
 const copied=await a.page.evaluate(async uid=>{const {enableSync}=await import('/src/cloud.mjs'),{readState,getFile}=await import('/src/storage.mjs'),{mediaIds}=await import('/src/gallery.mjs');await enableSync(uid,true);const s=await readState(uid),ids=mediaIds(s.document.items[0]);return {items:s.document.items.length,copied:await Promise.all(ids.map(async id=>(await getFile(uid,id))?.text()))};},uid);
 assert.equal(copied.items,1);assert.equal(copied.copied.length,6);assert.ok(copied.copied.every(Boolean));assert.equal(assets.size,6);assert.equal(remote.document.items[0].gallery.images.length,3);
 const b=await device();
 const downloaded=await b.page.evaluate(async uid=>{const {enableSync,mediaURL}=await import('/src/cloud.mjs'),{readState,getFile}=await import('/src/storage.mjs');await enableSync(uid,false);const s=await readState(uid),item=s.document.items[0],result=[];for(const image of item.gallery.images){if(await getFile(uid,image.assetId))throw Error('Device B must start without local originals');const r=await mediaURL(uid,{...item,...image});result.push(await(await fetch(r.url)).text());}return {count:s.document.items.length,result};},uid);
 assert.deepEqual(downloaded,{count:1,result:['img0','img1','img2']});
 const previous=remote.version;await b.page.evaluate(async uid=>{const {synchronize}=await import('/src/cloud.mjs');await synchronize(uid);},uid);assert.equal(remote.version,previous);assert.equal(assets.size,6);
 console.log('PASS: all six gallery media files copied to account and uploaded; isolated second device receives one gallery and retrieves every original; no-op resync is idempotent. Synthetic backend only.');
}finally{await browser.close()}
