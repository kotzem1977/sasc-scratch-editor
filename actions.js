/* IDs and defaults */
const APPLE_MD5 = '3826a4091a33e4d26f87a2fac7cf796b.svg';
const SKY_MD5   = 'e7c147730f19d284bcd7b3f00af19bb6.svg';
const POP_MD5   = '83c36d806dc92327b9e7049a565c6bff.wav';

/* open GUI libraries by heuristics */
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

function openSpriteLibrary(){
  if (clickByAria('choose a sprite')) return __sascTag('ui','opened Sprite Library via aria-label');
  if (clickByTitle('sprite')) return __sascTag('ui','opened Sprite Library via title');
  if (clickByText('choose a sprite')) return __sascTag('ui','opened Sprite Library via text');
  __sascTag('ui','Sprite Library button not found');
}
function openBackdropLibrary(){
  if (clickByAria('choose a backdrop')) return __sascTag('ui','opened Backdrop Library via aria-label');
  if (clickByTitle('backdrop')) return __sascTag('ui','opened Backdrop Library via title');
  if (clickByText('choose a backdrop')) return __sascTag('ui','opened Backdrop Library via text');
  __sascTag('ui','Backdrop Library button not found');
}
function openCostumeLibrary(){
  if (clickByAria('choose a costume')) return __sascTag('ui','opened Costume Library via aria-label');
  if (clickByTitle('costume')) return __sascTag('ui','opened Costume Library via title');
  if (clickByText('choose a costume')) return __sascTag('ui','opened Costume Library via text');
  __sascTag('ui','Costume Library button not found');
}
function openSoundLibrary(){
  if (clickByAria('choose a sound')) return __sascTag('ui','opened Sound Library via aria-label');
  if (clickByTitle('sound')) return __sascTag('ui','opened Sound Library via title');
  if (clickByText('choose a sound')) return __sascTag('ui','opened Sound Library via text');
  __sascTag('ui','Sound Library button not found');
}

/* Add costume to a target without nuking its array; also set skin & costume.skinId to help thumbnails */
async function addCostumeToTarget(vm, target, name, md5ext, asset){
  await storeImageAsset(vm, asset);
  const model = costumeModel(name, md5ext);
  if(!target.sprite.costumes) target.sprite.costumes=[];
  target.sprite.costumes.push(model);
  const idx = target.sprite.costumes.length-1;
  target.setCostume(idx);

  const skinId = await applySkin(vm, target, asset);
  // help some builds/renderers: store skinId on the costume model
  try{
    const cos = target.sprite.costumes[idx];
    if (cos && skinId!=null) cos.skinId = skinId;
  }catch(_){}

  emitUi(vm);
}

/* Backdrop add (A: GUI, B: vm.addBackdrop, C/manual used by API) */
async function addBackdropSmart(name, md5ext){
  const vm = window.vm || await (window.bindVM? window.bindVM(6000):null);
  if(!vm?.runtime) throw new Error('vm missing');
  const stage = vm.runtime.getTargetForStage?.();
  if(!stage) throw new Error('No stage target');

  const asset = await fetchAsset(md5ext);

  const GUI = window.GUI;
  if(GUI?.handleBackdropUpload){
    try{
      await GUI.handleBackdropUpload(asset.blob, asset.isSVG?'image/svg+xml':'image/png');
      __sascTag('backdrop','added via GUI.handleBackdropUpload');
      return;
    }catch(e){ __sascTag('backdrop','GUI helper failed: '+(e&&e.message||e)); }
  }

  if(typeof vm.addBackdrop === 'function'){
    try{
      await storeImageAsset(vm, asset);
      await vm.addBackdrop(md5ext, costumeModel(name, md5ext));
      __sascTag('backdrop','added via vm.addBackdrop');
      emitUi(vm);
      return;
    }catch(e){ __sascTag('backdrop','vm.addBackdrop failed: '+(e&&e.message||e)); }
  }

  // Manual
  await addCostumeToTarget(vm, stage, name, md5ext, asset);
  __sascTag('backdrop','added via manual stage injection (file/md5)');
}

/* Add sprite via three paths (A: vm.addSprite, B: duplicate+wait, C: local file) */
async function addSpriteFromMd5(name, md5ext){
  const vm = window.vm || await (window.bindVM? window.bindVM(6000):null);
  if(!vm?.runtime) throw new Error('vm missing');
  const asset = await fetchAsset(md5ext);

  // A: vm.addSprite
  if(typeof vm.addSprite === 'function'){
    try{
      await storeImageAsset(vm, asset);
      const spriteObj = {
        isStage:false,
        name: name || 'New Sprite',
        variables:{}, lists:{}, broadcasts:{}, blocks:{}, comments:{},
        currentCostume:0,
        costumes:[costumeModel(name, md5ext)],
        sounds:[],
        volume:100, layerOrder:1, visible:true, x:0, y:0, size:100, direction:90,
        draggable:false, rotationStyle:"all around"
      };
      const beforeIds=(vm.runtime.targets||[]).map(t=>t.id);
      const id = await vm.addSprite(JSON.stringify(spriteObj));
      // Find it either by returned id or by diff
      let tgt=(vm.runtime.targets||[]).find(t=>t.id===id);
      if(!tgt) tgt = await waitForNewSprite(vm, beforeIds, 1500);
      if(tgt){
        await addCostumeToTarget(vm, tgt, name, md5ext, asset); // ensures skin+thumbnail
        __sascTag('appleA','sprite created via vm.addSprite');
        return tgt;
      }
      __sascTag('appleA','created but target not found');
    }catch(e){ __sascTag('appleA','vm.addSprite failed: '+(e&&e.message||e)); }
  }

  // B: duplicate base
  const sprites = (vm.runtime.targets||[]).filter(t=>!t.isStage);
  if(sprites.length && typeof vm.duplicateSprite === 'function'){
    try{
      const before=(vm.runtime.targets||[]).map(t=>t.id);
      const newId = await vm.duplicateSprite(sprites[0].id);
      let tgt=(vm.runtime.targets||[]).find(t=>t.id===newId);
      if(!tgt) tgt = await waitForNewSprite(vm, before, 2000);
      if(!tgt) throw new Error('duplicate ok but target not found');
      try{ await vm.renameSprite(tgt.id, name||'New Sprite'); }catch(_){ if(tgt.sprite) tgt.sprite.name = name||'New Sprite'; }
      await addCostumeToTarget(vm, tgt, name, md5ext, asset);
      __sascTag('appleB','sprite created via duplicate+swap');
      return tgt;
    }catch(e){ __sascTag('appleB','failed: '+(e&&e.message||e)); }
  }

  __sascTag('appleC','no creation path available; try file path or Sprite Library');
}

/* File pickers for C paths */
function selectLocalImageFile(){
  return new Promise((resolve,reject)=>{
    const el = document.getElementById('file-image');
    el.value=''; el.onchange=async()=>{
      if(!el.files || !el.files[0]) return reject(new Error('no file'));
      const f=el.files[0], ext=(f.name.split('.').pop()||'').toLowerCase();
      const buf = await f.arrayBuffer();
      const blob = new Blob([buf], {type:mimeFromExt(ext)});
      const text = (ext==='svg') ? await (new Response(blob)).text() : null;
      resolve({buf, blob, text, ext, isSVG:(ext==='svg'),
               md5ext:(crypto.randomUUID?crypto.randomUUID().replace(/-/g,'').slice(0,32):Date.now().toString(16).padEnd(32,'0'))+'.'+ext});
    };
    el.click();
  });
}
function selectLocalSoundFile(){
  return new Promise((resolve,reject)=>{
    const el = document.getElementById('file-sound');
    el.value=''; el.onchange=async()=>{
      if(!el.files || !el.files[0]) return reject(new Error('no file'));
      const f=el.files[0], ext=(f.name.split('.').pop()||'').toLowerCase();
      const buf = await f.arrayBuffer();
      const blob = new Blob([buf], {type:mimeFromExt(ext)});
      resolve({buf, blob, text:null, ext, isSVG:false,
               md5ext:(crypto.randomUUID?crypto.randomUUID().replace(/-/g,'').slice(0,32):Date.now().toString(16).padEnd(32,'0'))+'.'+ext});
    };
    el.click();
  });
}

/* Public actions used by UI wiring */
window.SASC_ACTIONS = {
  openSpriteLibrary, openBackdropLibrary, openCostumeLibrary, openSoundLibrary,
  addBackdropSmart, addSpriteFromMd5,
  selectLocalImageFile, selectLocalSoundFile,
  APPLE_MD5, SKY_MD5, POP_MD5,
};
