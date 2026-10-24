const PAGE_HOSTS=new Set(['www.xiaohongshu.com','xiaohongshu.com','xhslink.com']);
export function checkedURL(value,kind='page'){
 let u;try{u=new URL(value);}catch{throw Error('Enter a complete HTTPS post link.');}
 if(u.protocol!=='https:'||u.port||u.username||u.password)throw Error('Only supported HTTPS links are accepted.');
 const media=/^sns-(webpic|img)-(qc|hw|bd|qn)\.xhscdn\.com$/.test(u.hostname)||u.hostname==='ci.xiaohongshu.com';
 if(kind==='image'?!media:!PAGE_HOSTS.has(u.hostname))throw Error(kind==='image'?'Unsupported image host.':'Currently supported: Xiaohongshu post links.');
 if(kind==='page'&&u.hostname!=='xhslink.com'&&!/^\/(explore|discovery\/item)\/[a-f0-9]{24}\/?$/.test(u.pathname))throw Error('Use a specific Xiaohongshu post link.');
 u.hash='';return u.href;
}
export async function readLimited(response,max){
 const length=Number(response.headers.get('content-length'));if(length>max)throw Error('The response is too large. Import the original file manually.');
 const reader=response.body?.getReader();if(!reader)throw Error('Empty response.');const parts=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max)throw Error('The response is too large. Import the original file manually.');parts.push(value);}}finally{await reader.cancel().catch(()=>{});}
 const bytes=new Uint8Array(size);let offset=0;for(const p of parts){bytes.set(p,offset);offset+=p.length;}return bytes;
}
export async function fetchAllowed(url,kind,fetcher=fetch){
 for(let i=0;i<4;i++){
  url=checkedURL(url,kind);const response=await fetcher(url,{redirect:'manual',signal:AbortSignal.timeout(15000),headers:{'User-Agent':'Mozilla/5.0','Accept':kind==='image'?'image/*':'text/html'}});
  if([301,302,303,307,308].includes(response.status)){const next=response.headers.get('location');if(!next)throw Error('Post redirect failed.');await response.body?.cancel();url=new URL(next,url).href;continue;}
  if(!response.ok)throw Error('The platform did not allow access. Open the post in your browser and use Collect from Page.');
  return {response,url};
 }
 throw Error('Too many redirects. Use the full post link.');
}
export function extractPost(html,sourceURL){
 const id=new URL(sourceURL).pathname.split('/').filter(Boolean).pop();
 const raw=html.match(/window\.__INITIAL_STATE__\s*=\s*([\s\S]*?)<\/script>/)?.[1]?.replace(/;\s*$/,'');
 if(!raw)throw Error('No complete image list was available. Open the post and use Collect from Page.');
 let state;try{state=JSON.parse(raw.replace(/"(?:\\.|[^"\\])*"|\bundefined\b/g,s=>s==='undefined'?'null':s));}catch{throw Error('The platform page format is not supported. No images were saved.');}
 const entry=state.note?.noteDetailMap?.[id],note=entry?.note||entry;
 if(!note||!Array.isArray(note.imageList)||!note.imageList.length)throw Error('This page requires a browser session or did not provide its images. Open the post and use Collect from Page.');
 if(note.type&&note.type!=='normal')throw Error('This post is not an image gallery. Save the link instead.');
 if(note.imageList.length>30)throw Error('This post has too many images for one import.');
 const images=note.imageList.map((i,index)=>{const formats=i.infoList||[];const url=formats.find(f=>f.imageScene==='WB_DFT')?.url||i.urlDefault||i.url||formats[0]?.url;return {url:checkedURL(url,'image'),position:index+1};});
 if(new Set(images.map(i=>i.url)).size!==images.length)throw Error('The returned image list was incomplete. No images were saved.');
 return {title:String(note.title||'Untitled post').slice(0,300),sourceURL,images,total:images.length,complete:true};
}
export function createHandler({supabaseURL='',publishableKey='',fetcher=fetch}={}){return async function(request){
 const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
 if(request.method!=='POST')return Response.json({error:'Use POST.'},{status:405,headers});
 try{
  if(!supabaseURL||!publishableKey)return Response.json({error:'Link import requires a configured cloud account on this installation.'},{status:503,headers});
  const bearer=request.headers.get('authorization')||'';if(!/^Bearer [A-Za-z0-9_.-]+$/.test(bearer))return Response.json({error:'Sign in to import images from a link.'},{status:401,headers});
  const auth=await fetcher(new URL('/auth/v1/user',supabaseURL),{headers:{apikey:publishableKey,Authorization:bearer},signal:AbortSignal.timeout(10000)});
  if(!auth.ok)return Response.json({error:'Sign in again to import images.'},{status:401,headers});
  await auth.body?.cancel();
  let body;try{body=JSON.parse(new TextDecoder().decode(await readLimited(request,32768)));}catch{throw Error('Invalid import request.');}
  if(body.action==='images'){
   const url=checkedURL(body.url);const {response,url:finalURL}=await fetchAllowed(url,'page',fetcher);const html=new TextDecoder().decode(await readLimited(response,3000000));
   return Response.json(extractPost(html,finalURL),{headers});
  }
  if(body.action==='image'){
   const {response}=await fetchAllowed(body.url,'image',fetcher),mime=(response.headers.get('content-type')||'').split(';')[0];
   if(!['image/jpeg','image/png','image/webp','image/avif','image/gif'].includes(mime))throw Error('The source did not return a supported image.');
   const bytes=await readLimited(response,3*1024*1024);return new Response(bytes,{headers:{...headers,'Content-Type':mime}});
  }
  throw Error('Unsupported import request.');
 }catch(e){return Response.json({error:e.name==='TimeoutError'?'The platform timed out. Please try again or collect from the open page.':e.message||'Import failed. No images were saved.'},{status:422,headers});}
};}
