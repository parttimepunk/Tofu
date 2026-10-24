import {approveImports} from './import-review-helper.mjs';
// Browser plugin not available; isolated Playwright with generated fixtures only.
import {chromium} from 'playwright';
import {mkdir,readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
await mkdir('../outputs',{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.TOFU_CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const context=await browser.newContext({viewport:{width:1280,height:900}}),page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const url=process.env.TOFU_TEST_URL||'http://127.0.0.1:5182/';
try{
 await page.goto(url);assert.equal(await page.title(),'Tofu');await page.getByText('Your space for inspiration',{exact:true}).waitFor();
 await page.getByLabel('Media type').selectOption('video');
 const inputs=await Promise.all([['Type and Space.png','Drop Image.PNG',''],['Light Study.mp4','Drop Video.mp4','application/octet-stream'],['Soft Tone.wav','Drop Audio.wav','']].map(async([source,name,type])=>({name,type,bytes:[...await readFile('../web/tests/fixtures/'+source)]})));
 const transfer=await page.evaluateHandle(inputs=>{const dt=new DataTransfer();for(const f of inputs)dt.items.add(new File([new Uint8Array(f.bytes)],f.name,{type:f.type}));return dt;},inputs);
 await page.locator('.app').dispatchEvent('dragenter',{dataTransfer:transfer});await page.getByText('Drop into Tofu',{exact:true}).waitFor();
 await page.screenshot({path:'../outputs/Tofu-Drop-Preview.png'});
 await page.locator('.app').dispatchEvent('drop',{dataTransfer:transfer});await page.getByText('Review Import',{exact:true}).waitFor();await approveImports(page);await page.getByText('1 item saved locally.',{exact:true}).waitFor();
 assert.equal(await page.locator('.media-item').count(),3);assert.equal(await page.getByLabel('Media type').inputValue(),'all');
 for(const type of ['image','video','audio']){await page.getByLabel('Media type').selectOption(type);assert.equal(await page.locator('.media-item').count(),1);}
 await page.getByLabel('Media type').selectOption('all');await page.reload();await page.locator('.media-item').nth(2).waitFor();
 const persisted=await page.evaluate(async()=>{const db=await new Promise((res,rej)=>{const r=indexedDB.open('tofu-library-v1');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});return await new Promise((res,rej)=>{const r=db.transaction('files').objectStore('files').getAll();r.onsuccess=()=>res(r.result.map(b=>({size:b.size,type:b.type})));r.onerror=()=>rej(r.error);});});
 for(const mime of ['image/png','video/mp4','audio/wav'])assert.ok(persisted.some(f=>f.type===mime&&f.size>0),mime);
 await page.screenshot({path:'../outputs/Tofu-Drop-Imported.png'});
 const bad=await page.evaluateHandle(()=>{const d=new DataTransfer();d.items.add(new File(['test'],'unsupported.pdf',{type:'application/pdf'}));return d;});
 await page.locator('.app').dispatchEvent('drop',{dataTransfer:bad});await page.getByText(/not a supported image/).waitFor();assert.equal(await page.locator('.media-item').count(),3);
 const uri=await page.evaluateHandle(()=>{const d=new DataTransfer();d.setData('text/uri-list','file:///private/example.png');return d;});
 await page.locator('.app').dispatchEvent('drop',{dataTransfer:uri});await page.getByText(/This drag did not include a file/).waitFor();assert.equal(page.url(),url);
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({url,browser:'Isolated Chrome; Browser plugin not available',checks:['Page identity / meaningful UI / no framework overlay','Drag highlight visible','Mixed drop imports and resets filter','Image/video/audio classification with missing MIME','Original blobs and metadata survive reload','Unsupported files rejected without changing library','File URL without bytes explained without navigation','Mobile width has no horizontal overflow','No app console errors']},null,2));
}finally{await browser.close();}
