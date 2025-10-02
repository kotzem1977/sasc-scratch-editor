/* Asset and renderer helpers (thumbnails + skin updates kept intact) */
function md5FromMd5ext(md5ext){ return String(md5ext||'').slice(0,32); }
function extOf(md5ext){ const m=String(md5ext||'').split('.').pop()||''; return m.toLowerCase(); }
function isSvgExt(s){ return /\.svg$/i.test(s||''); }
function mimeFromExt(ext){
  if(ext==='svg')return'image/svg+xml'; if(ext==='png')return'image/png';
  if(ext==='jpg'||ext==='jpeg')return'image/jpeg'; if(ext==='gif')return'image/gif';
  if(ext==='wav')return'audio/wav'; if(ext==='mp3')return'audio/mpeg';
  return'application/octet-stream';
}

async function fetchAsset(md5ext){
  const ext = extOf(md5ext);
  const local = location.pathname.replace(/\/[^/]*$/,'/').replace(/\/$/,'') + '/static/assets/' + md5ext;
  async function read(res){
    const buf = await res.arrayBuffer();
    const blob = new Blob([buf], {type:mimeFromExt(ext)});
    const text = (ext==='svg') ? await (new Response(blob)).text() : null;
    return {buf, blob, text, ext, isSVG:(ext==='svg'), md5ext};
  }
  try { const r = await fetch(local, {cache:'no-store'}); if(r.ok) return read(r); } catch(_){}
  const cdn = 'https://assets.scratch.mit.edu/internalapi/asset/'+md5ext+'/get/';
  const r2 = await fetch(cdn, {cache:'no-store'});
  if(!r2.ok) throw new Error('CDN '+r2.status);
  return read(r2);
}

function costumeModel(name, md5ext){
  const assetId = md5FromMd5ext(md5ext);
  const svg = isSvgExt(md5ext);
  return {
    name: name || ('Costume '+md5ext.slice(0,6)),
    assetId, md5ext,
    dataFormat: svg?'svg':'png',
    rotationCenterX: 240, rotationCenterY: 180,
    ...(svg?{}:{bitmapResolution:2})
  };
}

function emitUi(vm){
  try{ vm.runtime.emit('PROJECT_CHANGED'); }catch(_){}
  try{ vm.runtime.emit('targetsUpdate'); }catch(_){}
  try{ vm.emit && vm.emit('targetsUpdate'); }catch(_){}
  try{ vm.runtime.requestTargetsUpdate && vm.runtime.requestTargetsUpdate(); }catch(_){}
  try{ vm.renderer && vm.renderer.draw && vm.renderer.draw(); }catch(_){}
  try{ vm.renderer && (vm.renderer.dirty = true); }catch(_){}
}

async function storeImageAsset(vm, asset){
  const storage = vm.runtime?.storage;
  if(!storage) throw new Error('No VM storage');
  const id = md5FromMd5ext(asset.md5ext);
  const type = asset.isSVG ? storage.AssetType.ImageVector : storage.AssetType.ImageBitmap;
  storage.createAsset(type, asset.ext, new Uint8Array(asset.buf), id);
  return id;
}

async function createSkinId(vm, asset){
  if(!vm.renderer) return null;
  if(asset.isSVG && vm.renderer.createSVGSkin){
    const svgText = asset.text ?? await (new Response(asset.blob)).text();
    return vm.renderer.createSVGSkin(svgText);
  }else if(!asset.isSVG && vm.renderer.createBitmapSkin){
    const bmp = await createImageBitmap(asset.blob);
    return vm.renderer.createBitmapSkin(bmp, 1);
  }
  return null;
}

async function applySkin(vm, target, asset){
  const skinId = await createSkinId(vm, asset);
  if(skinId!=null && target.drawableID!=null){
    vm.renderer.updateDrawableProperties(target.drawableID, {skinId});
  }
  return skinId;
}

/* Wait for a new sprite target after duplicate — fixes “duplicate ok but target not found” */
async function waitForNewSprite(vm, beforeIds, timeout=3000){
  const t0=performance.now();
  while(performance.now()-t0<timeout){
    const sprites=(vm.runtime.targets||[]).filter(t=>!t.isStage);
    const newer = sprites.find(t=>!beforeIds.includes(t.id));
    if(newer) return newer;
    await new Promise(r=>setTimeout(r,60));
  }
  return null;
}
