(function(){
  const A = window.SASC_ACTIONS;

  // list targets
  document.getElementById('btn-targets').onclick=()=>{
    const vm=window.vm; if(!vm||!vm.runtime) return __sascTag('targets','VM not ready');
    const ts=vm.runtime.targets||[]; __sascLog('[targets] '+ts.length+' targets');
    ts.forEach(t=>__sascLog('- ['+(t.isStage?'STAGE':'SPRITE')+'] '+(t.getName?t.getName():t.sprite?.name||'(?)')));
  };

  // Library openers
  document.getElementById('btn-lib-sprite').onclick=A.openSpriteLibrary;
  document.getElementById('btn-lib-backdrop').onclick=A.openBackdropLibrary;
  document.getElementById('btn-lib-costume').onclick=A.openCostumeLibrary;
  document.getElementById('btn-lib-sound').onclick=A.openSoundLibrary;

  // Apple A/B/C
  document.getElementById('btn-apple-a').onclick=()=>A.addSpriteFromMd5('Apple (A)', A.APPLE_MD5);
  document.getElementById('btn-apple-b').onclick=()=>A.addSpriteFromMd5('Apple (B)', A.APPLE_MD5);
  document.getElementById('btn-apple-c').onclick=async()=>{
    const vm=window.vm || await (window.bindVM? window.bindVM(6000):null);
    if(!vm?.runtime) return __sascTag('appleC','vm missing');
    try{
      const asset = await A.selectLocalImageFile();
      // re-use the md5 path after generating a pseudo md5ext for local file
      // store, then create sprite
      // Build a quick “store + create” by temporarily stashing blob in cache:
      const id = await storeImageAsset(vm, asset);
      const md5ext = asset.md5ext;
      await A.addSpriteFromMd5('Apple (C: file)', md5ext);
    }catch(e){ __sascTag('appleC','file path failed: '+(e&&e.message||e)); }
  };

  // Backdrop A/B/C
  document.getElementById('btn-bg-a').onclick=()=>A.addBackdropSmart('Backdrop (A)', A.SKY_MD5);
  document.getElementById('btn-bg-b').onclick=()=>A.addBackdropSmart('Backdrop (B)', A.SKY_MD5);
  document.getElementById('btn-bg-c').onclick=async()=>{
    const vm=window.vm || await (window.bindVM? window.bindVM(6000):null);
    if(!vm?.runtime) return __sascTag('backdrop','vm missing');
    try{
      const asset = await A.selectLocalImageFile();
      await addBackdropSmart('Backdrop (C file)', asset.md5ext);
    }catch(e){ __sascTag('backdrop','C failed: '+(e&&e.message||e)); }
  };

  // Sound A/B/C
  document.getElementById('btn-snd-a').onclick=A.openSoundLibrary;
  document.getElementById('btn-snd-b').onclick=async()=>{
    try{
      // many builds block programmatic sounds — we attempt, else log + open library
      const vm=window.vm || await (window.bindVM? window.bindVM(6000):null);
      if(!vm?.runtime) return __sascTag('sound','vm missing');
      // Reuse old helper (addSoundToSelected) is intentionally omitted since most builds reject it.
      __sascTag('sound','programmatic sound add is restricted; opening library');
      A.openSoundLibrary();
    }catch(e){ __sascTag('sound','B failed: '+(e&&e.message||e)); }
  };
  document.getElementById('btn-snd-c').onclick=()=>{
    __sascTag('sound','Use the Sound Library or Sounds tab; direct file adds are restricted in this build');
    A.openSoundLibrary();
  };
})();
