import {TOFU_ORIGIN} from './config.mjs';
import {postURL,noteID,checkedCapture,trustedTofuSender,liveJob} from './guards.mjs';
const key=id=>'job:'+id;
async function getJob(tab){const all=await chrome.storage.session.get(key(tab));const job=all[key(tab)];if(job&&!liveJob(job)){await chrome.storage.session.remove(key(tab));return null;}return job||null;}
async function cancel(returnTab,requestId){const all=await chrome.storage.session.get(null);for(const [k,j] of Object.entries(all))if(k.startsWith('job:')&&j.returnTab===returnTab&&j.requestId===requestId)await chrome.storage.session.remove(k);}
async function handle(message,sender){
 if(['PING','OPEN_POST','CANCEL'].includes(message?.type)){
  if(!trustedTofuSender(sender,TOFU_ORIGIN))throw Error('This Tofu site is not connected to the extension.');
  if(message.type==='PING')return {ok:true,version:chrome.runtime.getManifest().version};
  if(message.type==='CANCEL'){await cancel(sender.tab.id,message.requestId);return {ok:true};}
  const url=postURL(message.url);if(typeof message.requestId!=='string'||message.requestId.length>80)throw Error('Invalid collection request.');
  await cancel(sender.tab.id,message.requestId);
  // Record the job before navigation, so a fast page cannot ask before it exists.
  const tab=await chrome.tabs.create({url:'about:blank',active:true});
  await chrome.storage.session.set({[key(tab.id)]:{returnTab:sender.tab.id,requestId:message.requestId,url,expires:Date.now()+10*60*1000}});
  await chrome.tabs.update(tab.id,{url,active:true});
  chrome.tabs.sendMessage(tab.id,{type:'BEGIN'}).catch(()=>{});return {ok:true};
 }
 if(message?.type==='GET_JOB'||message?.type==='CAPTURE_JOB'){
  if(sender.frameId!==0||!Number.isInteger(sender.tab?.id))throw Error('Open the post in its main tab.');
  const job=await getJob(sender.tab.id);if(!job){if(message.type==='CAPTURE_JOB')throw Error('This collection was cancelled or expired. Start again from Tofu.');return {ok:true,job:null};}
  const url=new URL(sender.url);if(!['www.xiaohongshu.com','xiaohongshu.com','m.xiaohongshu.com'].includes(url.hostname)||url.protocol!=='https:')throw Error('Unsupported post page.');
  if(message.type==='GET_JOB')return {ok:true,job:{expectedID:noteID(job.url)}};
  postURL(sender.url,{short:false});const capture=checkedCapture(message.capture,job.url);
  if(noteID(capture.sourceURL)!==noteID(sender.url))throw Error('The page changed during collection.');
  const delivered=await chrome.tabs.sendMessage(job.returnTab,{type:'DELIVER_CAPTURE',requestId:job.requestId,capture});
  if(!delivered?.ok)throw Error('Tofu is no longer waiting. Return to Tofu and start again.');
  await chrome.storage.session.remove(key(sender.tab.id));await chrome.tabs.update(job.returnTab,{active:true});return {ok:true};
 }
 if(message?.type==='IMPORT_CAPTURE'){
  if(sender.url!==chrome.runtime.getURL('popup.html'))throw Error('Use the extension button to collect this page.');
  const capture=checkedCapture(message.capture);await chrome.tabs.create({url:TOFU_ORIGIN+'/#collect='+encodeURIComponent(JSON.stringify(capture)),active:true});return {ok:true};
 }
 throw Error('Unsupported collection request.');
}
chrome.runtime.onMessage.addListener((message,sender,respond)=>{handle(message,sender).then(respond,e=>respond({ok:false,error:e.message||'Collection failed. Nothing was saved.'}));return true;});
chrome.tabs.onRemoved.addListener(async id=>{await chrome.storage.session.remove(key(id));const all=await chrome.storage.session.get(null);for(const [k,j] of Object.entries(all))if(k.startsWith('job:')&&j.returnTab===id)await chrome.storage.session.remove(k);});
