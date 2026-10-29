import {mkdir,readFile,writeFile,copyFile,readdir} from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {safariPostCapture} from '../web/src/safari-share.mjs';
export async function buildExtension({origin,out}){
 const u=new URL(origin);if(u.protocol!=='https:'||u.username||u.password||u.port||u.pathname!=='/'||u.search||u.hash)throw Error('Supply the HTTPS origin of your Tofu site.');
 origin=u.origin;await mkdir(out,{recursive:true});const src=new URL('./src/',import.meta.url);
 for(const name of await readdir(src))await copyFile(new URL(name,src),path.join(out,name));
 await writeFile(path.join(out,'config.mjs'),`export const TOFU_ORIGIN=${JSON.stringify(origin)};\n`);
 await writeFile(path.join(out,'page-capture.js'),`globalThis.TofuPostCapture = ${safariPostCapture.toString().replaceAll('Safari','your browser')};\n`);
 await copyFile(new URL('../web/public/icon-greige-192.png',import.meta.url),path.join(out,'icon.png'));
 await copyFile(new URL('./README.md',import.meta.url),path.join(out,'README.md'));
 await copyFile(new URL('../LICENSE',import.meta.url),path.join(out,'LICENSE'));
 const posts=['https://www.xiaohongshu.com/*','https://xiaohongshu.com/*','https://m.xiaohongshu.com/*'];
 const manifest={manifest_version:3,name:'Tofu Collector',version:'0.1.0',minimum_chrome_version:'120',description:'Collect complete Xiaohongshu post images and review them in your Tofu library.',permissions:['activeTab','scripting','storage'],host_permissions:[origin+'/*',...posts,'https://xhslink.com/*'],background:{service_worker:'background.mjs',type:'module'},action:{default_title:'Collect to Tofu',default_popup:'popup.html',default_icon:'icon.png'},icons:{192:'icon.png'},content_scripts:[{matches:[origin+'/*'],js:['tofu-bridge.js'],run_at:'document_idle'},{matches:posts,js:['page-capture.js','post-content.js'],run_at:'document_idle'}],content_security_policy:{extension_pages:"script-src 'self'; object-src 'none';"}};
 await writeFile(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));return manifest;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(!process.env.TOFU_SITE_URL||!process.argv[2])throw Error('Set TOFU_SITE_URL and supply an ignored output folder.');
 await buildExtension({origin:process.env.TOFU_SITE_URL,out:path.resolve(process.argv[2])});console.log('Built Tofu Collector. No cookies, login credentials or backend configuration included.');
}
