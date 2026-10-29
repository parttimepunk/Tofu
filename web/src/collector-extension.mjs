const channel='tofu-collector-v1';
export function connectCollector({onReady=()=>{},onCapture=()=>{},onWaiting=()=>{},target=window}={}){
 const requests=new Map();let waiting=null,disposed=false;
 const post=value=>target.postMessage({channel,...value},target.location.origin);
 function request(action,extra={},timeout=8000){const id=crypto.randomUUID();return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{requests.delete(id);reject(Error('The extension did not respond. Reload this Tofu tab and try again.'));},timeout);requests.set(id,{resolve,reject,timer});post({direction:'request',action,id,...extra});});}
 async function ping(){try{const r=await request('PING',{},4000);if(!disposed)onReady(Boolean(r.ok));}catch{if(!disposed)onReady(false);}}
 function listener(event){
  const m=event.data;if(event.source!==target||event.origin!==target.location.origin||m?.channel!==channel)return;
  if(m.direction==='ready'){ping();return;}
  if(m.direction==='response'){const q=requests.get(m.id);if(!q)return;clearTimeout(q.timer);requests.delete(m.id);m.result?.ok?q.resolve(m.result):q.reject(Error(m.result?.error||'Could not contact the extension.'));return;}
  if(m.direction==='capture'&&waiting===m.requestId){waiting=null;onWaiting(false);post({direction:'ack',id:m.id});onCapture(m.capture);}
 }
 target.addEventListener('message',listener);ping();
 return {
  async open(url){if(waiting)throw Error('A post is already open for collection. Cancel it before starting another.');const id=crypto.randomUUID();waiting=id;onWaiting(true);
   try{await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{requests.delete(id);reject(Error('Could not open the post. Reload Tofu and try again.'));},8000);requests.set(id,{resolve,reject,timer});post({direction:'request',action:'OPEN_POST',id,url});});}
   catch(e){post({direction:'request',action:'CANCEL',id:crypto.randomUUID(),requestId:id});waiting=null;onWaiting(false);throw e;}
  },
  async cancel(){try{if(waiting)await request('CANCEL',{requestId:waiting});}finally{waiting=null;onWaiting(false);}},
  dispose(){disposed=true;if(waiting)post({direction:'request',action:'CANCEL',id:crypto.randomUUID(),requestId:waiting});waiting=null;target.removeEventListener('message',listener);for(const q of requests.values()){clearTimeout(q.timer);q.reject(Error('Collection closed.'));}requests.clear();}
 };
}
