import {TOFU_ORIGIN} from './config.mjs';
const status=document.querySelector('#status'),button=document.querySelector('#collect');
document.querySelector('#open').onclick=()=>chrome.tabs.create({url:TOFU_ORIGIN});
button.onclick=async()=>{
 button.disabled=true;status.textContent='Reading the current post…';
 try{
  const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
  if(!tab?.url||!/^https:\/\/(www\.|m\.)?xiaohongshu\.com\//.test(tab.url))throw Error('Open a full Xiaohongshu post in this browser first.');
  await chrome.scripting.executeScript({target:{tabId:tab.id},files:['page-capture.js']});
  const [result]=await chrome.scripting.executeScript({target:{tabId:tab.id},func:()=>{try{return {capture:globalThis.TofuPostCapture()};}catch(e){return {error:e.message};}}});
  if(result?.result?.error)throw Error(result.result.error);if(!result?.result?.capture)throw Error('Could not read this post.');
  const sent=await chrome.runtime.sendMessage({type:'IMPORT_CAPTURE',capture:result.result.capture});if(!sent?.ok)throw Error(sent?.error||'Could not open Tofu.');status.textContent='Opened in Tofu. Review before saving.';
 }catch(e){status.textContent=e.message||'Collection failed. Nothing was saved.';}finally{button.disabled=false;}
};
