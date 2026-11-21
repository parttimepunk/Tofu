import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import {newItem,emptyDocument,validate,mergeDocuments} from '../src/model.mjs';
import {makeGallery,galleryImages,mediaIds,withImageCrop} from '../src/gallery.mjs';
import {fullCrop,fitRatio} from '../src/crop.mjs';
import {readState,updateState} from '../src/storage.mjs';
const image=(name='test.png')=>newItem('image',{assetId:crypto.randomUUID(),thumbnailId:crypto.randomUUID(),fileName:name,mime:'image/png',size:100,width:300,height:600});
const doc=item=>({...emptyDocument(),items:[item]});
test('a gallery stores one item with ordered originals and a shared title',()=>{
 const originals=[image('A.png'),image('B.png'),image('C.png')],crop=fitRatio(fullCrop(300,600),1);
 const gallery=makeGallery(originals,[crop,undefined,undefined],{title:'Shared',note:'One note',sourceURL:'https://example.com'});
 validate(doc(gallery));assert.equal(gallery.title,'Shared');assert.equal(galleryImages(gallery).length,3);
 assert.deepEqual(gallery.gallery.images.map(i=>i.fileName),['A.png','B.png','C.png']);assert.deepEqual(gallery.crop,crop);
 assert.equal(mediaIds(gallery).length,6);assert.ok(mediaIds(gallery).includes(originals[2].assetId));
});
test('legacy images and documents are unchanged',()=>{const i=image();assert.equal(validate(doc(i)).items[0],i);assert.deepEqual(galleryImages(i),[i]);assert.deepEqual(mediaIds(i),[i.assetId,i.thumbnailId]);});
test('per-image cropping preserves other pages and the cover mirror',()=>{
 const g=makeGallery([image(),image()],[undefined,undefined]);const crop=fitRatio(fullCrop(300,600),.8),updated=withImageCrop(g,1,crop);
 validate(doc(updated));assert.equal(updated.crop,undefined);assert.deepEqual(updated.gallery.images[1].crop,crop);assert.equal(g.gallery.images[1].crop,undefined);
 const cover=withImageCrop(updated,0,crop);validate(doc(cover));assert.deepEqual(cover.crop,cover.gallery.images[0].crop);assert.throws(()=>withImageCrop(cover,3,crop));
});
test('malformed galleries and unknown versions disable writes',()=>{
 const g=makeGallery([image(),image()],[undefined,undefined]);
 for(const bad of [{...g,gallery:{...g.gallery,version:2}},{...g,gallery:{version:1,images:[g.gallery.images[0]]}},{...g,gallery:{version:1,images:[g.gallery.images[0],g.gallery.images[0]]}},{...g,gallery:{version:1,images:[g.gallery.images[0],{...g.gallery.images[1],assetId:'../another-account'}]}},{...g,crop:fullCrop(300,600)}])assert.throws(()=>validate(doc(bad)));
});
test('gallery edits merge with independent shared notes and conflict on competing image changes',()=>{
 const g=makeGallery([image(),image()],[undefined,undefined]),c=fullCrop(300,600),cropped=withImageCrop(g,1,c);
 const merged=mergeDocuments(doc(g),doc(cropped),doc({...g,note:'Remote note'}));assert.equal(merged.items[0].note,'Remote note');assert.deepEqual(merged.items[0].gallery.images[1].crop,c);
 assert.throws(()=>mergeDocuments(doc(g),doc(cropped),doc(withImageCrop(g,1,fitRatio(c,1)))),e=>e.conflicts.includes(g.id));
});
test('invalid gallery writes preserve the stored gallery and account isolation',async()=>{
 const scope=crypto.randomUUID(),g=makeGallery([image(),image()],[undefined,undefined]);await updateState(scope,s=>({...s,document:doc(g)}));
 await assert.rejects(updateState(scope,s=>({...s,document:doc({...g,gallery:{version:99,images:[]}})})));
 assert.deepEqual((await readState(scope)).document,doc(g));assert.equal((await readState(crypto.randomUUID())).document.items.length,0);
});
