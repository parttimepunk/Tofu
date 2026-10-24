import test from 'node:test';import assert from 'node:assert/strict';
import {linkRequest} from '../src/link-request.mjs';
const cloud={auth:{getSession:async()=>({data:{session:{access_token:'test-token'}}})}};
test('Safari Load failed is explained as a connection issue without a collector detour',async()=>{
 await assert.rejects(()=>linkRequest({}, {cloud,fetcher:async()=>{throw new TypeError('Load failed');}}),e=>/reach the Tofu link importer/.test(e.message)&&!e.collectFromPage);
});
test('session refresh failures are separate from platform access failures',async()=>{
 let fetched=false;await assert.rejects(()=>linkRequest({}, {cloud:{auth:{getSession:async()=>({error:Error('Load failed')})}},fetcher:async()=>{fetched=true;}}),/check your Tofu sign-in/);assert.equal(fetched,false);
});
test('only an inaccessible post or image suggests the collector',async()=>{
 for(const [code,collect] of [['POST_UNAVAILABLE',true],['AUTH_UNAVAILABLE',false]])await assert.rejects(()=>linkRequest({}, {cloud,fetcher:async()=>Response.json({error:'A clear explanation',code},{status:422})}),e=>e.message==='A clear explanation'&&e.collectFromPage===collect);
});
