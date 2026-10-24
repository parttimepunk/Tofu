import {chromium} from 'playwright';import assert from 'node:assert/strict';import {readFile,mkdir} from 'node:fs/promises';
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}),context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),errors=[];
page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(45000);
const bytes=await readFile('tests/fixtures/Shape Study.png'),id='00000000-0000-4000-8000-000000000001',exp=Math.floor(Date.now()/1000)+3600,enc=o=>Buffer.from(JSON.stringify(o)).toString('base64url'),token=enc({alg:'HS256',typ:'JWT'})+'.'+enc({sub:id,exp})+'.test',user={id,aud:'authenticated',email:'test@example.com'};
page.on('pageerror',e=>errors.push(e.message));let imageRequests=0;
await page.route(/^https:\/\/[^/]+\.supabase\.co\//,r=>r.fulfill({json:r.request().url().includes('/token')?{access_token:token,refresh_token:'synthetic-test',expires_at:exp,expires_in:3600,token_type:'bearer',user}:user}));
await page.route('**/api/import-link',r=>{imageRequests++;return r.fulfill({contentType:'image/png',body:bytes});});
const capture={title:'Safari test post',sourceURL:'https://www.xiaohongshu.com/explore/aaaaaaaaaaaaaaaaaaaaaaaa',images:Array.from({length:5},(_,i)=>'https://sns-webpic-qc.xhscdn.com/example/'+i),total:5};
try{
 await page.goto((process.env.TOFU_TEST_URL||'http://127.0.0.1:5188/')+'#collect='+encodeURIComponent(JSON.stringify(capture)));
 await page.getByRole('button',{name:'Sign In to Preview',exact:true}).click();assert.equal(imageRequests,0);
 await page.getByLabel('Email',{exact:true}).fill('test@example.com');await page.getByLabel('Password',{exact:true}).fill('synthetic-test-password');await page.getByRole('button',{name:'Sign In',exact:true}).click();
 await page.getByRole('button',{name:'Review 5 Selected Images',exact:true}).waitFor();assert.equal(imageRequests,5);assert.equal(await page.locator('.media-item').count(),0);assert.ok(!page.url().includes('#collect='));
 await page.getByRole('button',{name:'Review 5 Selected Images',exact:true}).click();await page.getByRole('button',{name:'Save & Next',exact:true}).waitFor();assert.equal(await page.getByLabel('Title',{exact:true}).inputValue(),'Safari test post 1');assert.equal(await page.getByLabel('Source link (optional)',{exact:true}).inputValue(),capture.sourceURL);
 await mkdir('../outputs',{recursive:true});await page.screenshot({path:'../outputs/Tofu-Safari-Share-Review.png'});
 await page.getByRole('button',{name:'Cancel',exact:true}).click();assert.equal(await page.locator('.media-item').count(),0);assert.deepEqual(errors,[]);
 console.log('PASS: Safari capture survives sign-in, five previews, cleared fragment, title/source prefilled, review then cancel without saving. Synthetic auth/images; no phone claim.');
}catch(error){await mkdir('../outputs',{recursive:true});await page.screenshot({path:'../outputs/Tofu-Safari-Share-Test-Failure.png'}).catch(()=>{});console.error('Isolated test page:',(await page.locator('body').innerText().catch(()=>'' )).slice(-2000));throw error;}finally{await browser.close();}
