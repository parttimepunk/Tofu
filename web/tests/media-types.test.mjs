import test from 'node:test';
import assert from 'node:assert/strict';
import {describeMedia,droppedFiles} from '../src/media-types.mjs';
import {MAX_FILE_SIZE} from '../src/model.mjs';
test('missing MIME falls back to media extensions',()=>{
 for(const [name,type,kind,mime] of [['screen.PNG','','image','image/png'],['clip.MOV','application/octet-stream','video','video/quicktime'],['voice.m4a','','audio','audio/mp4'],['clip','video/mp4','video','video/mp4']])assert.deepEqual(describeMedia({name,type,size:12}),{kind,mime});
});
test('unsupported, empty and oversized files are rejected',()=>{
 assert.throws(()=>describeMedia({name:'doc.pdf',type:'application/pdf',size:10}),/not a supported/);
 assert.throws(()=>describeMedia({name:'screen.png',size:0}),/empty/);
 assert.throws(()=>describeMedia({name:'clip.mov',size:MAX_FILE_SIZE+1}),/50 MB/);
});
test('drop handles file lists and item fallback without text URLs',()=>{
 const f={name:'screen.png'};assert.deepEqual(droppedFiles({files:[f]}),[f]);
 assert.deepEqual(droppedFiles({items:[{kind:'string'},{kind:'file',getAsFile:()=>f},{kind:'file',getAsFile:()=>null}]}),[f]);
 assert.deepEqual(droppedFiles({files:[],items:[]}),[]);
});
