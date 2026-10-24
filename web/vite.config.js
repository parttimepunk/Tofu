import {defineConfig,loadEnv} from 'vite';
import react from '@vitejs/plugin-react';
import {Readable} from 'node:stream';
import {createHandler} from './server/link-import.mjs';
export default defineConfig(({mode})=>{const env=loadEnv(mode,process.cwd(),'VITE_');const handler=createHandler({supabaseURL:env.VITE_SUPABASE_URL,publishableKey:env.VITE_SUPABASE_PUBLISHABLE_KEY});
 const middleware=server=>{server.middlewares.use('/api/import-link',async(req,res)=>{try{const request=new Request('http://localhost/api/import-link',{method:req.method,headers:req.headers,...(req.method==='POST'?{body:Readable.toWeb(req),duplex:'half'}:{})});const response=await handler(request);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch{res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Link importer unavailable.'}));}});};
 return {plugins:[react(),{name:'tofu-link-import',configureServer:middleware,configurePreviewServer:middleware}],build:{outDir:'dist',sourcemap:false}};
});
