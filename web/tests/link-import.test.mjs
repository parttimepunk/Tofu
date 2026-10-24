import test from 'node:test';import assert from 'node:assert/strict';
import {checkedURL,extractPost,fetchAllowed,readLimited,createHandler} from '../server/link-import.mjs';
const id='aaaaaaaaaaaaaaaaaaaaaaaa',page=`https://www.xiaohongshu.com/explore/${id}`,image='https://sns-webpic-qc.xhscdn.com/example/image.webp';
const html=n=>`<script>window.__INITIAL_STATE__=${JSON.stringify({note:{noteDetailMap:{[id]:{note:{type:'normal',title:'Test post',imageList:Array.from({length:n},(_,i)=>({urlDefault:image+i}))}}}}})}</script>`;
test('extracts the exact post gallery, not global image tags or cover',()=>{const r=extractPost(html(5)+'<img src="avatar.jpg">',page);assert.equal(r.total,5);assert.equal(r.complete,true);assert.equal(r.images[4].position,5);});
test('shell/cover-only pages fail rather than pretending full extraction',()=>{assert.throws(()=>extractPost('<meta property="og:image" content="x">',page),/complete image list/);assert.throws(()=>extractPost('<script>window.__INITIAL_STATE__={"login":{},"a":undefined}</script>',page),/browser session/);});
test('never executes page JavaScript',()=>{assert.throws(()=>extractPost('<script>window.__INITIAL_STATE__=(()=>{throw 1})()</script>',page),/format/);});
test('allowlist rejects arbitrary hosts, credentials, ports and nonpost paths',()=>{for(const u of ['http://www.xiaohongshu.com/explore/'+id,'https://127.0.0.1/','https://www.xiaohongshu.com.evil.example/explore/'+id,'https://u:p@www.xiaohongshu.com/explore/'+id,'https://www.xiaohongshu.com/'])assert.throws(()=>checkedURL(u));assert.throws(()=>checkedURL('https://example.com/a','image'));});
test('redirect destination is checked before fetching',async()=>{const calls=[];await assert.rejects(()=>fetchAllowed(page,'page',async u=>{calls.push(u);return new Response(null,{status:302,headers:{location:'https://127.0.0.1/secret'}});}),/supported/);assert.equal(calls.length,1);});
test('stream limit applies even without content length',async()=>{await assert.rejects(()=>readLimited(new Response('123456'),3),/too large/);});
test('auth failures do not fetch target pages',async()=>{let calls=0;const h=createHandler({supabaseURL:'https://example.supabase.co',publishableKey:'public-example',fetcher:async()=>{calls++;return new Response('',{status:401});}});const a=await h(new Request('https://tofu.example/api/import-link',{method:'POST',body:'{}'}));assert.equal(a.status,401);assert.equal(calls,0);const b=await h(new Request('https://tofu.example/api/import-link',{method:'POST',headers:{authorization:'Bearer test-token'},body:'{}'}));assert.equal(b.status,401);assert.equal(calls,1);});
test('authenticated extraction returns full list and image bytes use no cookies',async()=>{const calls=[];const h=createHandler({supabaseURL:'https://example.supabase.co',publishableKey:'public-example',fetcher:async(u,opts)=>{calls.push([String(u),opts]);return String(u).endsWith('/auth/v1/user')?Response.json({id:'test'}):new Response(html(5));}});const r=await h(new Request('https://tofu.example/api/import-link',{method:'POST',headers:{authorization:'Bearer test-token'},body:JSON.stringify({action:'images',url:page})}));assert.equal(r.status,200);assert.equal((await r.json()).images.length,5);assert.equal(calls[1][1].headers.Cookie,undefined);assert.equal(calls[1][1].headers.Authorization,undefined);});
test('image proxy returns bytes, rejects HTML and oversized images without forwarding credentials',async()=>{
 for(const [mime,length,status] of [['image/png','3',200],['text/html','3',422],['image/png','4000000',422]]){
  const h=createHandler({supabaseURL:'https://example.supabase.co',publishableKey:'public-example',fetcher:async(u,opts)=>{
   if(String(u).endsWith('/auth/v1/user'))return Response.json({id:'test'});
   assert.equal(opts.headers.Authorization,undefined);assert.equal(opts.headers.Cookie,undefined);
   return new Response('abc',{headers:{'Content-Type':mime,'Content-Length':length}});
  }});
  const r=await h(new Request('https://tofu.example/api/import-link',{method:'POST',headers:{authorization:'Bearer test-token'},body:JSON.stringify({action:'image',url:image})}));
  assert.equal(r.status,status);if(status===200)assert.equal(await r.text(),'abc');
 }
});
