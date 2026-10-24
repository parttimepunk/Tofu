// Serialized into Apple's Run JavaScript on Webpage action. DOM only, no cookies.
export function safariPostCapture(){
 const page=new URL(location.href);
 if(!/^(www\.|m\.)?xiaohongshu\.com$/.test(page.hostname)||!/^\/(explore|discovery\/item)\/[a-f0-9]{24}\/?$/.test(page.pathname))throw Error('Open the full Xiaohongshu post in Safari, then Share → Save to Tofu.');
 const root=document.getElementById('noteContainer')||document.querySelector('.note-container, .note-detail, .note-view');
 if(!root)throw Error('The post images are not available on this page. Open the full post in Safari and sign in if required.');
 const images=[];
 for(const img of root.querySelectorAll('img')){
  for(const raw of [img.currentSrc,img.getAttribute('src'),img.getAttribute('data-src')]){
   if(!raw)continue;let u;try{u=new URL(raw,page);}catch{continue;}
   const content=/^sns-(webpic|img)-(qc|hw|bd|qn)\.xhscdn\.com$/.test(u.hostname)||u.hostname==='ci.xiaohongshu.com';
   if(!content||!/^https?:$/.test(u.protocol)||u.username||u.password||u.port||u.pathname.includes('/comment/'))continue;
   u.protocol='https:';if(!images.includes(u.href))images.push(u.href);break;
  }
 }
 const fraction=root.innerText.match(/(?:^|\s)\d+\s*\/\s*(\d+)(?:\s|$)/);
 const total=Number(root.querySelector('.swiper-pagination-total')?.textContent||fraction?.[1]);
 if(!Number.isInteger(total)||total<1||total>30||images.length!==total)throw Error('Not all post images could be verified. View every slide in Safari and try sharing again. Nothing was saved.');
 const title=document.getElementById('detail-title')?.textContent||root.querySelector('.note-title, .title')?.textContent||'Untitled post';
 return {title:title.trim().slice(0,300),sourceURL:page.href,images,total};
}
export function safariShareSource(destination){
 const target=new URL(destination);
 if(target.protocol!=='https:'||target.username||target.password||target.port||target.pathname!=='/'||target.search||target.hash)throw Error('Use the HTTPS origin of your Tofu installation.');
 // Let Shortcuts display thrown errors and stop; never feed an error object to Open URLs.
 return `const post = (${safariPostCapture.toString()})(); completion(${JSON.stringify(target.origin)} + '/#collect=' + encodeURIComponent(JSON.stringify(post)));`;
}
