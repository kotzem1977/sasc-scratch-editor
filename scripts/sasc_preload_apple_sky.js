/* --- SASC PRELOAD APPLE+SKY (idempotent) --- */
(function preloadAppleSky(){
  // You can set these dynamically at runtime via window.SASC_ASSETS too.
  // Fill with your real md5.exts when you have them.
  var DEFAULTS = {
    APPLE_SPRITE3: 'REPLACE_APPLE.sprite3', // e.g. 3826a4091a33e4d26f87a2fac7cf796b.sprite3
    SKY_PNG:       'REPLACE_SKY.png'        // e.g. b6c96d...something....png
  };

  var cfg = Object.assign({}, DEFAULTS, (window.SASC_ASSETS||{}));

  function whenVMReady(cb, timeoutMs){
    timeoutMs = timeoutMs || 15000;
    var t0 = Date.now();
    var tm = setInterval(function(){
      var GUI = window.GUI;
      var vm  = window.vm || (GUI && GUI.vm);
      if (vm && vm.runtime && vm.runtime.targets && vm.runtime.targets.length){
        clearInterval(tm); cb(vm); return;
      }
      if (Date.now() - t0 > timeoutMs) clearInterval(tm);
    }, 200);
  }

  function assetURL(md5ext){
    // Leverage your local-first hooks by pointing at /static/assets first
    var base = location.pathname.replace(/\/[^/]*$/, '/');
    return base.replace(/\/$/, '') + '/static/assets/' + md5ext;
  }

  async function addSpriteFromURL(url){
    var r = await fetch(url);
    if (!r.ok) throw new Error('sprite fetch ' + r.status);
    var ab = await r.arrayBuffer();

    var GUI = window.GUI;
    if (GUI && GUI.handleSpriteUpload && GUI.vm){
      await GUI.handleSpriteUpload(new Blob([ab], {type:'application/zip'}));
      return;
    }
    var vm = window.vm || (GUI && GUI.vm);
    if (!vm) throw new Error('VM missing');
    await vm.addSprite(new Uint8Array(ab));
  }

  async function addBackdropFromURL(url){
    var r = await fetch(url);
    if (!r.ok) throw new Error('backdrop fetch ' + r.status);
    var blob = await r.blob();

    var GUI = window.GUI;
    if (GUI && GUI.handleBackdropUpload && GUI.vm){
      await GUI.handleBackdropUpload(blob, 'image/png');
      return;
    }
    var vm = window.vm || (GUI && GUI.vm);
    if (!vm) throw new Error('VM missing');
    var stage = vm.runtime.getTargetForStage();
    if (!stage) throw new Error('No stage target');
    await vm.importSpriteCostume(blob, {targetId: stage.id}); // add as backdrop
  }

  whenVMReady(async function(){
    try{
      console.log('[SASC] Preloading Apple + Sky (local-first)…');
      await addSpriteFromURL(assetURL(cfg.APPLE_SPRITE3));
      await addBackdropFromURL(assetURL(cfg.SKY_PNG));
      console.log('[SASC] Apple + Sky loaded (local)');
    }catch(e1){
      console.warn('[SASC] Local preload failed; trying CDN fallback', e1);
      try{
        await addSpriteFromURL('https://assets.scratch.mit.edu/internalapi/asset/'+cfg.APPLE_SPRITE3+'/get/');
        await addBackdropFromURL('https://assets.scratch.mit.edu/internalapi/asset/'+cfg.SKY_PNG+'/get/');
        console.log('[SASC] Apple + Sky loaded (CDN)');
      }catch(e2){
        console.error('[SASC] Apple/Sky load failed (local+CDN)', e2);
      }
    }
  });
})();
 /* --- /SASC PRELOAD APPLE+SKY --- */
