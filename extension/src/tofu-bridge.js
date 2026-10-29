(()=>{
 const channel='tofu-collector-v1';let pending=null;
 const post=value=>window.postMessage({channel,...value},location.origin);
 window.addEventListener('message',async event=>{
  const m=event.data;if(event.source!==window||event.origin!==location.origin||m?.channel!==channel||m.direction!=='request'||!['PING','OPEN_POST','CANCEL'].includes(m.action))return;
  if(m.action==='OPEN_POST')pending=m.id;
  if(m.action==='CANCEL'&&pending===m.requestId)pending=null;
  try{const result=await chrome.runtime.sendMessage({type:m.action,url:m.url,requestId:m.action==='OPEN_POST'?m.id:m.requestId});post({direction:'response',id:m.id,result});}catch{post({direction:'response',id:m.id,result:{ok:false,error:'The extension was updated. Reload this Tofu tab and try again.'}});}
 });
 chrome.runtime.onMessage.addListener((m,_sender,respond)=>{
  if(m?.type!=='DELIVER_CAPTURE')return;
  if(pending!==m.requestId){respond({ok:false});return;}
  const id=crypto.randomUUID();let timer;
  const listener=event=>{if(event.source===window&&event.origin===location.origin&&event.data?.channel===channel&&event.data.direction==='ack'&&event.data.id===id){clearTimeout(timer);window.removeEventListener('message',listener);pending=null;respond({ok:true});}};
  window.addEventListener('message',listener);timer=setTimeout(()=>{window.removeEventListener('message',listener);respond({ok:false});},2000);
  post({direction:'capture',id,requestId:m.requestId,capture:m.capture});return true;
 });
 post({direction:'ready'});
})();
