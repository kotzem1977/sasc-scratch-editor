/* ---------- imports from other modules ---------- */
/* expects asset-helpers.js + vm-binder.js loaded before this file */
const INLINE = window.SASC_INLINE_ASSETS || {};
const APPLE_MD5 = '3826a4091a33e4d26f87a2fac7cf796b.svg'; // kept for completeness
const SKY_MD5   = 'e7c147730f19d284bcd7b3f00af19bb6.svg';
const POP_MD5   = '83c36d806dc92327b9e7049a565c6bff.wav';

/* ---------- DOM helpers to open built-in GUI libraries (best effort) ---------- */
function clickByAria(text){ const n=[...document.querySelectorAll('[aria-label]')].find(e=>(e.getAttribute('aria-label')||'').toLowerCase().includes(text)); if(n){n.click(); return true;} return false; }
function clickByTitle(text){ const n=[...document.querySelectorAll('[title]')].find(e=>(e.getAttribute('title')||'').toLowerCase().includes(text)); if(n){n.click(); return true;} return false; }
function clickByText(text){
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_ELEMENT,null);
  let node; text=text.toLowerCase();
  while((node=walker.nextNode())){
    const t=(node.textContent||'').trim().toLowerCase();
    if(t && t.includes(text)){ node.click(); return true; }
  }
  return false;
}
function openSpriteLibrary(){ if (clickByAria('choose a sprite')) return __sascTag('ui','opened Sprite Library via aria-label'); if (clickByTitle('sprite')) return __sascTag('ui','opened Sprite Library via title'); if (clickByText('choose a sprite')) return __sascTag('ui','opened Sprite Library via text'); __sascTag('ui','Sprite Library button not found'); }
function openBackdropLibrary(){ if (clickByAria('choose a backdrop')) return __sascTag('ui','opened Backdrop Library via aria-label'); if (clickByTitle('backdrop')) return __sascTag('ui','opened Backdrop Library via title'); if (clickByText('choose a backdrop')) return __sascTag('ui','opened Backdrop Library via text'); __sascTag('ui','Backdrop Library button not found'); }
function openCostumeLibrary(){ if (clickByAria('choose a costume')) return __sascTag('ui','opened Costume Library via aria-label'); if (clickByTitle('costume')) return __sascTag('ui','opened Costume Library via title'); if (clickByText('choose a costume')) return __sascTag('ui','opened Costume Library via text'); __sascTag('ui','Costume Library button not found'); }
function openSoundLibrary(){ if (clickByAria('choose a sound')) return __sascTag('ui','opened Sound Library via aria-label'); if (clickByTitle('sound')) return __sascTag('ui','opened Sound Library via title'); if (clickByText('choose a sound')) return __sascTag('ui','opened Sound Library via text'); __sascTag('ui','Sound Library button not found'); }

/* ---------- Core helpers: store assets, create skins, update UI ---------- */
async function addCostumeToTarget(vm, target, name, asset){
  await storeImageAsset(vm, asset); // bytes into VM storage
  const md5ext = asset.md5ext || (md5FromMd5ext(asset.fakeId||'') + '.' + (asset.ext||'svg'));
  const model = costumeModel(name, md5ext);
  if(!target.sprite.costumes) target.sprite.costumes=[];
  target.sprite.costumes.push(model);
  const idx = target.sprite.costumes.length-1;
  target.setCostume(idx);

  const skinId = await applySkin(vm, target, asset);
  try{ const cos = target.sprite.costumes[idx]; if (cos && skinId!=null) cos.skinId = skinId; }catch(_){}
  emitUi(vm);
}

async function addBackdropAsset(vm, name, asset){
  const stage = vm.runtime.getTargetForStage?.();
  if(!stage) throw new Error('No stage target');
  // Prefer GUI helper if present (but we already have a Blob)
  const GUI = window.GUI;
  if(GUI?.handleBackdropUpload){
    try{
      await GUI.handleBackdropUpload(asset.blob, asset.isSVG?'image/svg+xml':'image/png');
      __sascTag('backdrop','added via GUI.handleBackdropUpload');
      return;
    }catch(e){ __sascTag('backdrop','GUI helper failed: '+(e&&e.message||e)); }
  }
  // Manual: add costume model + skin to Stage
  await addCostumeToTarget(vm, stage, name, asset);
  __sascTag('backdrop','added via manual stage injection (file/md5/inline)');
}

/* Convert inline SVG text (or a picked file) into an “asset object” like fetchAsset returns */
async function makeSvgAssetFromText(svgText, md5hint='inline.svg'){
  const ext='svg', blob=new Blob([svgText], {type:'image/svg+xml'}), buf=await blob.arrayBuffer();
  return {buf, blob, text:svgText, ext, isSVG:true, md5ext:md5hint};
}
async function makeImageAssetFromFile(file){
  const ext=(file.name.split('.').pop()||'').toLowerCase();
  const buf=await file.arrayBuffer(); const blob=new Blob([buf], {type:mimeFromExt(ext)});
  const text=(ext==='svg')? await (new Response(blob)).text(): null;
  const fakeMd5=(crypto.randomUUID?crypto.randomUUID().replace(/-/g,'').slice(0,32):Date.now().toString(16).padEnd(32,'0'));
  return {buf, blob, text, ext, isSVG:(ext==='svg'), md5ext:fakemd5ext(fakeMd5, ext)};
}
function fakemd5ext(id, ext){ return (id||'').slice(0,32)+'.'+(ext||'svg'); }

/* ---------- Sprite creation paths ---------- */
async function createSpriteWithAsset(name, asset){
  const vm = window.vm || await (window.bindVM? window.bindVM(6000):null);
  if(!vm?.runtime) throw new Error('vm missing');

  // Try vm.addSprite if available
  if(typeof vm.addSprite === 'function'){
    try{
      await storeImageAsset(vm, asset);
      const md5ext = asset.md5ext || 'inline.svg';
      const spriteObj = {
        isStage:false, name: name || 'New Sprite',
        variables:{}, lists:{}, broadcasts:{}, blocks:{}, comments:{},
        currentCostume:0, costumes:[costumeModel(name, md5ext)], sounds:[],
        volume:100, layerOrder:1, visible:true, x:0, y:0, size:100, direction:90,
        draggable:false, rotationStyle:"all around"
      };
      const before=(vm.runtime.targets||[]).map(t=>t.id);
      const id = await vm.addSprite(JSON.stringify(spriteObj));
      let tgt=(vm.runtime.targets||[]).find(t=>t.id===id) || await waitForNewSprite(vm, before, 1500);
      if(!tgt) throw new Error('addSprite created but target not found');
      await addCostumeToTarget(vm, tgt, name, asset); // ensure skin/thumbnail is correct
      return tgt;
    }catch(e){ __sascTag('sprite','vm.addSprite failed: '+(e&&e.message||e)); }
  }

  // Fallback: duplicate the first sprite and swap
  const sprites=(vm.runtime.targets||[]).filter(t=>!t.isStage);
  if(sprites.length && typeof vm.duplicateSprite==='function'){
    const before=(vm.runtime.targets||[]).map(t=>t.id);
    const newId = await vm.duplicateSprite(sprites[0].id).catch(()=>null);
    let tgt=(vm.runtime.targets||[]).find(t=>t.id===newId) || await waitForNewSprite(vm, before, 2000);
    if(!tgt) throw new Error('duplicate ok but target not found');
    try{ await vm.renameSprite(tgt.id, name||'New Sprite'); }catch(_){ if(tgt.sprite) tgt.sprite.name=name||'New Sprite'; }
    await addCostumeToTarget(vm, tgt, name, asset);
    return tgt;
  }

  throw new Error('No sprite creation path available in this build');
}

/* ---------- Public actions (A/B use inline SVG; C uses real file bytes) ---------- */
async function addApple_A(){ // vm.addSprite preferred
  const asset = await makeSvgAssetFromText(INLINE.APPLE_SVG, 'apple-inline.svg');
  try{ await createSpriteWithAsset('Apple (A)', asset); __sascTag('appleA','sprite created'); }
  catch(e){ __sascTag('appleA','failed: '+(e&&e.message||e)); }
}
async function addApple_B(){ // duplicate+swap (still uses inline asset)
  const asset = await makeSvgAssetFromText(INLINE.APPLE_SVG, 'apple-inline.svg');
  try{ await createSpriteWithAsset('Apple (B)', asset); __sascTag('appleB','sprite created'); }
  catch(e){ __sascTag('appleB','failed: '+(e&&e.message||e)); }
}
async function addApple_C_File(){ // use user-picked file (no CDN)
  const vm=window.vm || await (window.bindVM? window.bindVM(6000):null);
  if(!vm?.runtime) return __sascTag('appleC','vm missing');
  const inp=document.getElementById('file-image');
  inp.value='';
  inp.onchange=async()=>{
    const f=inp.files && inp.files[0]; if(!f) return __sascTag('appleC','no file');
    try{
      const asset = await makeImageAssetFromFile(f);
      await createSpriteWithAsset('Apple (C file)', asset);
      __sascTag('appleC','sprite created from file');
    }catch(e){ __sascTag('appleC','file path failed: '+(e&&e.message||e)); }
  };
  inp.click();
}

/* Backdrops */
async function addBackdrop_A(){ // inline SVG → robust
  const vm=window.vm || await (window.bindVM? window.bindVM(6000):null);
  if(!vm?.runtime) return __sascTag('backdrop','vm missing');
  try{
    const asset = await makeSvgAssetFromText(INLINE.SKY_SVG, 'sky-inline.svg');
    await addBackdropAsset(vm, 'Backdrop (A)', asset);
  }catch(e){ __sascTag('backdrop','A failed: '+(e&&e.message||e)); }
}
async function addBackdrop_B(){ // also inline, same as A (kept as a separate button)
  const vm=window.vm || await (window.bindVM? window.bindVM(6000):null);
  if(!vm?.runtime) return __sascTag('backdrop','vm missing');
  try{
    const asset = await makeSvgAssetFromText(INLINE.SKY_SVG, 'sky-inline.svg');
    await addBackdropAsset(vm, 'Backdrop (B)', asset);
  }catch(e){ __sascTag('backdrop','B failed: '+(e&&e.message||e)); }
}
async function addBackdrop_C_File(){ // user file (no CDN)
  const vm=window.vm || await (window.bindVM? window.bindVM(6000):null);
  if(!vm?.runtime) return __sascTag('backdrop','vm missing');
  const inp=document.getElementById('file-image');
  inp.value='';
  inp.onchange=async()=>{
    const f=inp.files && inp.files[0]; if(!f) return __sascTag('backdrop','no file');
    try{
      const asset = await makeImageAssetFromFile(f);
      await addBackdropAsset(vm, 'Backdrop (C file)', asset);
    }catch(e){ __sascTag('backdrop','C failed: '+(e&&e.message||e)); }
  };
  inp.click();
}

/* Sounds — this build blocks programmatic sound adds; route to UI */
function addSound_A_OpenLibrary(){ openSoundLibrary(); }
function addSound_B_Md5(){ __sascTag('sound','programmatic sound add is restricted; opening library'); openSoundLibrary(); }
function addSound_C_File(){ __sascTag('sound','Use the Sound Library or Sounds tab; direct file adds are restricted in this build'); openSoundLibrary(); }

/* Expose */
window.SASC_ACTIONS = {
  // libraries
  openSpriteLibrary, openBackdropLibrary, openCostumeLibrary, openSoundLibrary,
  // apples
  addApple_A, addApple_B, addApple_C_File,
  // backdrops
  addBackdrop_A, addBackdrop_B, addBackdrop_C_File,
  // sounds
  addSound_A_OpenLibrary, addSound_B_Md5, addSound_C_File
};
