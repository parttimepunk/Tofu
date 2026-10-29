(()=>{
 let started=false,stopped=false,working=false,observer,timer,deadline;
 chrome.runtime.onMessage.addListener(m=>{if(m?.type==='BEGIN')start();});
 async function start(){
  if(started)return;const response=await chrome.runtime.sendMessage({type:'GET_JOB'}).catch(()=>null);if(!response?.job)return;started=true;
  const host=document.createElement('div');host.id='tofu-collector-status';const shadow=host.attachShadow({mode:'closed'});
  const panel=document.createElement('div');panel.style.cssText='position:fixed;right:20px;bottom:20px;z-index:2147483647;width:290px;padding:18px;border-radius:16px;background:#fcfcfc;color:#202020;box-shadow:0 8px 40px #0003;font:14px -apple-system,BlinkMacSystemFont,sans-serif;line-height:1.5';
  const title=document.createElement('strong');title.textContent='Collect to Tofu';const status=document.createElement('p');status.textContent='Waiting for the complete image gallery…';status.setAttribute('role','status');
  const retry=document.createElement('button');retry.textContent='Collect Now';retry.style.cssText='border:0;border-radius:8px;padding:10px 14px;background:#38755f;color:white;font:inherit;cursor:pointer';retry.onclick=()=>attempt(true);
  const close=document.createElement('button');close.textContent='Dismiss';close.style.cssText='border:0;background:none;padding:10px;color:#555;cursor:pointer';close.onclick=()=>{stopped=true;observer?.disconnect();clearTimeout(timer);host.remove();};
  panel.append(title,status,retry,close);shadow.append(panel);document.documentElement.append(host);
  deadline=setTimeout(()=>{observer?.disconnect();status.textContent='Sign in or view all image slides, then click Collect Now. Nothing has been saved.';},60000);
  async function attempt(manual=false){
   if(stopped||working)return;let capture;
   try{capture=globalThis.TofuPostCapture();if(response.job.expectedID&&new URL(capture.sourceURL).pathname.split('/').filter(Boolean).pop()!==response.job.expectedID)throw Error('This is a different post. Return to Tofu and start again.');}catch(e){if(manual)status.textContent=e.message;return;}
   working=true;retry.disabled=true;status.textContent='Sending image previews to Tofu…';
   const result=await chrome.runtime.sendMessage({type:'CAPTURE_JOB',capture}).catch(()=>({ok:false,error:'Could not reach Tofu. Return to Tofu and try again.'}));
   working=false;retry.disabled=false;if(result?.ok){stopped=true;observer?.disconnect();clearTimeout(deadline);status.textContent='Images sent to Tofu. Review before saving.';retry.hidden=true;}else{observer?.disconnect();clearTimeout(deadline);status.textContent=result?.error||'Collection failed. Nothing was saved.';}
  }
  observer=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(()=>attempt(),250);});const root=document.body||document.documentElement;observer.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['src','data-src'],characterData:true});attempt();
 }
 start();
})();
