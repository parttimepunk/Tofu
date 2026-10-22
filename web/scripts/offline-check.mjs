import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('../work/web',{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.TOFU_CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();
page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(45000);page.on('pageerror',e=>console.log('PAGE ERROR',e.message));page.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text());});page.on('requestfailed',r=>console.log('FAILED',r.url(),r.failure()?.errorText));
try{
 await page.goto(process.env.TOFU_TEST_URL||'http://127.0.0.1:5181/');await page.getByText('Your space for inspiration',{exact:true}).waitFor();
 await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
 await page.getByRole('button',{name:'Add to Tofu',exact:true}).first().click();await page.getByRole('button',{name:'Save Link',exact:true}).click();
 await page.getByLabel('Title',{exact:true}).fill('Offline Link');await page.getByLabel('Link',{exact:true}).fill('https://example.com/reference');await page.getByLabel('Notes',{exact:true}).fill('Link and notes only.');await page.getByRole('button',{name:'Save',exact:true}).click();
 await page.getByRole('button',{name:'example.com Link Offline Link example.com',exact:true}).waitFor();
 await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'example.com Link Offline Link example.com',exact:true}).waitFor();
 await page.getByRole('button',{name:'Add to Tofu',exact:true}).first().click();await page.getByRole('button',{name:'New Note',exact:true}).click();await page.getByLabel('Title',{exact:true}).fill('Created Offline');await page.getByLabel('Notes',{exact:true}).fill('Saved without a network.');await page.getByRole('button',{name:'Save',exact:true}).click();
 await page.getByRole('button',{name:/Created Offline/}).waitFor({state:'visible'});await page.reload({waitUntil:'domcontentloaded'});await page.getByRole('button',{name:/Created Offline/}).waitFor({state:'visible'});assert.ok(await page.getByRole('button',{name:/Created Offline/}).isVisible());
 await context.setOffline(false);await page.getByRole('button',{name:/Created Offline/}).waitFor({state:'visible'});await page.reload({waitUntil:'domcontentloaded'});await page.getByRole('button',{name:/Created Offline/}).waitFor({state:'visible'});assert.ok(await page.getByRole('button',{name:/Created Offline/}).isVisible());
 const checks=['Production service worker installs successfully.','App shell opens offline.','Saved link survives offline reload.','New note can be created and reopened offline.','Offline edits survive reconnect.'];
 await writeFile('../work/web/offline-checks.json',JSON.stringify({checks},null,2));console.log(JSON.stringify({passed:checks.length,checks},null,2));
}catch(e){console.log(await page.locator('body').innerText());console.log(await page.evaluate(async()=>({controller:!!navigator.serviceWorker.controller,caches:await caches.keys(),entries:await Promise.all((await caches.keys()).map(async k=>(await (await caches.open(k)).keys()).map(r=>r.url)))})));await page.screenshot({path:'../work/web/offline-failure.png'});throw e;}finally{await browser.close();}
