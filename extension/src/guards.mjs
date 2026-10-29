const pageHosts=new Set(['www.xiaohongshu.com','xiaohongshu.com','m.xiaohongshu.com']);
export function postURL(value,{short=true}={}){
 const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.port)throw Error('Use a complete HTTPS Xiaohongshu post link.');
 if(!(short&&u.hostname==='xhslink.com')&&!(pageHosts.has(u.hostname)&&/^\/(explore|discovery\/item)\/[a-f0-9]{24}\/?$/.test(u.pathname)))throw Error('Open a specific Xiaohongshu post.');
 u.hash='';return u.href;
}
export function noteID(url){const u=new URL(postURL(url));return u.hostname==='xhslink.com'?null:u.pathname.split('/').filter(Boolean).pop();}
export function checkedCapture(value,expectedURL){
 if(!value||typeof value!=='object')throw Error('No post images were found.');
 const sourceURL=postURL(value.sourceURL,{short:false});
 if(expectedURL&&noteID(expectedURL)&&noteID(sourceURL)!==noteID(expectedURL))throw Error('This is a different post. Start again from Tofu.');
 if(!Number.isInteger(value.total)||value.total<1||value.total>30||!Array.isArray(value.images)||value.images.length!==value.total)throw Error('The complete image count could not be verified. Nothing was saved.');
 const images=value.images.map(raw=>{const u=new URL(raw);if(u.protocol!=='https:'||u.username||u.password||u.port||!(/^sns-(webpic|img)-(qc|hw|bd|qn)\.xhscdn\.com$/.test(u.hostname)||u.hostname==='ci.xiaohongshu.com'))throw Error('The post contains an unsupported image address.');return u.href;});
 if(new Set(images).size!==images.length)throw Error('Duplicate images prevented complete-gallery verification.');
 const capture={title:String(value.title||'Untitled post').slice(0,300),sourceURL,images,total:value.total};
 if(JSON.stringify(capture).length>60000)throw Error('This post is too large for one collection.');
 return capture;
}
export function trustedTofuSender(sender,origin){try{return sender.frameId===0&&Number.isInteger(sender.tab?.id)&&new URL(sender.url).origin===origin;}catch{return false;}}
export function liveJob(job,now=Date.now()){return Boolean(job&&job.expires>now&&job.expires<=now+10*60*1000&&Number.isInteger(job.returnTab));}
