// Gallery metadata is an additive extension to v1 image items. Legacy single
// images remain unchanged; the first image is mirrored for cover-only clients.
export const GALLERY_LIMIT=100;
const mediaKeys=['assetId','thumbnailId','fileName','mime','size','width','height','crop'];
export function galleryImages(item){return item.gallery?.images||[item];}
export function mediaIds(item){return [...new Set(galleryImages(item).flatMap(i=>[i.assetId,i.thumbnailId]).filter(Boolean))];}
export function makeGallery(items,crops,fields={}){
 if(items.length<2||items.length>GALLERY_LIMIT||items.some(i=>i.kind!=='image'))throw Error('A gallery needs 2–100 images.');
 const images=items.map((i,n)=>Object.fromEntries(mediaKeys.filter(k=>(k==='crop'?crops[n]:i[k])!==undefined).map(k=>[k,k==='crop'?crops[n]:i[k]])));
 return {...items[0],...fields,...images[0],gallery:{version:1,images}};
}
export function withImageCrop(item,index,crop){
 if(!item.gallery)return {...item,crop};
 if(!Number.isInteger(index)||index<0||index>=item.gallery.images.length)throw Error('Image no longer available.');
 const images=item.gallery.images.map((i,n)=>n===index?{...i,crop}:i);
 return {...item,...(index===0?{crop}:{}),gallery:{version:1,images}};
}
