import {MAX_FILE_SIZE} from './model.mjs';

const extensions={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',webp:'image/webp',heic:'image/heic',heif:'image/heif',avif:'image/avif',tif:'image/tiff',tiff:'image/tiff',bmp:'image/bmp',svg:'image/svg+xml',mp4:'video/mp4',mov:'video/quicktime',m4v:'video/x-m4v',webm:'video/webm',mkv:'video/x-matroska',avi:'video/x-msvideo',mp3:'audio/mpeg',m4a:'audio/mp4',wav:'audio/wav',aif:'audio/aiff',aiff:'audio/aiff',aac:'audio/aac',ogg:'audio/ogg',oga:'audio/ogg',opus:'audio/ogg',flac:'audio/flac',caf:'audio/x-caf'};
export function describeMedia(file){
 const declared=(file.type||'').toLowerCase();
 const mime=/^(image|video|audio)\//.test(declared)?declared:extensions[file.name?.split('.').pop().toLowerCase()];
 if(!mime)throw Error(`“${file.name}” is not a supported image, video or audio file.`);
 if(!file.size)throw Error(`“${file.name}” is empty. Export the original file and try again.`);
 if(file.size>MAX_FILE_SIZE)throw Error(`“${file.name}” exceeds the current 50 MB per-file limit.`);
 return {kind:mime.split('/')[0],mime};
}

// Read synchronously during drop: browsers protect the transfer outside this event.
export function droppedFiles(transfer){
 const files=Array.from(transfer.files||[]);
 if(files.length)return files;
 return Array.from(transfer.items||[]).filter(i=>i.kind==='file').map(i=>i.getAsFile()).filter(Boolean);
}
