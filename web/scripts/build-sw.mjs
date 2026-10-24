import {readdir,readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {loadEnv} from 'vite';
const env=loadEnv('production',process.cwd(),'VITE_');
const backend=env.VITE_SUPABASE_URL?new URL(env.VITE_SUPABASE_URL).origin:'';
if(backend&&!backend.startsWith('https://'))throw Error('Supabase URL must use HTTPS');
const websocket=backend.replace(/^https:/,'wss:');
const files=['/','/index.html','/manifest.webmanifest','/icon-greige-180.png','/icon-greige-192.png','/icon-greige-512.png',...(await readdir('dist/assets')).map(n=>'/assets/'+n)];
const hash=createHash('sha256');for(const f of files){hash.update(f);hash.update(await readFile('dist'+(f==='/'?'/index.html':f)));}const id=hash.digest('hex').slice(0,12);
await writeFile('dist/sw.js',`const CACHE='tofu-shell-${id}',FILES=${JSON.stringify(files)};
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('tofu-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin)return;
if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).then(r=>r.ok?r:caches.match('/index.html')).catch(()=>caches.match('/index.html')));return;}
if(FILES.includes(u.pathname))e.respondWith(caches.match(e.request,{ignoreVary:true}).then(r=>r||fetch(e.request)));});`);
const config={headers:[{source:'/(.*)',headers:[{key:'X-Content-Type-Options',value:'nosniff'},{key:'Referrer-Policy',value:'no-referrer'},{key:'X-Frame-Options',value:'DENY'},{key:'X-Robots-Tag',value:'noindex, nofollow'},{key:'Content-Security-Policy',value:`default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: ${backend}; media-src 'self' blob: ${backend}; connect-src 'self' ${backend} ${websocket}; object-src 'none'; base-uri 'self'; frame-ancestors 'none'`}]},{source:'/sw.js',headers:[{key:'Cache-Control',value:'no-cache'}]}]};
if(process.env.TOFU_SAFARI_SHORTCUT_PATH){
 await copyFile(process.env.TOFU_SAFARI_SHORTCUT_PATH,'dist/Save-to-Tofu.shortcut');
 config.headers.push({source:'/Save-to-Tofu.shortcut',headers:[{key:'Content-Type',value:'application/octet-stream'},{key:'Content-Disposition',value:'attachment; filename="Save to Tofu.shortcut"'},{key:'Cache-Control',value:'no-cache'}]});
}
await writeFile('dist/vercel.json',JSON.stringify(config,null,2));
console.log('Offline shell:',id,'Files:',files.length);

// Server runtime uses only public project configuration, never admin credentials.
await mkdir('dist/api',{recursive:true});await mkdir('dist/server',{recursive:true});
await copyFile('server/link-import.mjs','dist/server/link-import.mjs');
await writeFile('dist/api/import-link.mjs',"import {createHandler} from '../server/link-import.mjs';\nexport default {fetch:createHandler("+JSON.stringify({supabaseURL:env.VITE_SUPABASE_URL||'',publishableKey:env.VITE_SUPABASE_PUBLISHABLE_KEY||''})+")};\n");
