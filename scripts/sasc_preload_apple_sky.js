/* --- SASC PRELOAD APPLE + SKY (idempotent) --- */
(function preloadAppleSky(){
  if (window.__sascPreloadInstalled) return;
  window.__sascPreloadInstalled = true;

  var DEFAULTS = {
    // If you have a real sprite bundle, set APPLE_SPRITE3 to "<md5>.sprite3".
    // Otherwise we can create a sprite from a PNG/JPG below via APPLE_PNG.
    APPLE_SPRITE3: null,
    APPLE_PNG:     null,  // e.g. "<md5>.png" under /static/assets/
    SKY_PNG:       null   // e.g. "<md5>.png" under /static/assets/
  };
  var CFG = Object.assign({}, DEFAULTS, (window.SASC_ASSETS || {}));

  function log(m){
    try{
      var p = document.querySelector('#sasc-console pre');
      if (p) p.textContent += m + '\n';
    }catch(_){}
    console.log('[SASC preload]', m);
  }

  function repoBase(){
    // /<user>/<repo>/.../index.html -> "/<user>/<repo>/"
    var base = location.pathname.replace(/\/[^/]*$/, '/');
    return base;
  }
  function localUrl(md5ext){
    return repoBase().replace(/\/$/, '') + '/static/assets/' + md5ext;
  }

  function whenVMReady(cb, timeoutMs){
    timeoutMs = timeoutMs || 15000;
    var t0 = Date.now();
    (function tick(){
      var GUI = window.GUI;
      var vm = window.vm || (GUI && GUI.vm);
      if (vm && vm.runtime && vm.runtime.targets && vm.runtime.targets.length){
        return cb(vm);
      }
      if (Date.now() - t0 > timeoutMs) {
        log('VM not ready after ' + timeoutMs + 'ms; continuing anyway');
        return cb(vm || null);
      }
      setTimeout(tick, 150);
    })();
  }

  async function addBackdropFromURL(url){
    var r = await fetch(url);
    if (!r.ok) throw new Error('backdrop fetch ' + r.status);
    var blob = await r.blob();               // image/*
    var GUI = window.GUI;
    if (GUI && GUI.handleBackdropUpload && GUI.vm){
      await GUI.handleBackdropUpload(blob, blob.type || 'image/png');
      return;
    }
    var vm = window.vm || (GUI && GUI.vm);
    if (!vm) throw new Error('VM missing for backdrop');
    // Fallback path (older builds):
    if (vm.loadBackdrop && vm.loadBackdropFromURL){
      await vm.loadBackdropFromURL(url);
      return;
    }
    // Last-ditch: treat as costume on stage (works in many builds)
    if (vm.addBackdrop){
      await vm.addBackdrop(blob);
      return;
    }
    log('No suitable backdrop importer found');
  }

  async function addSpriteFromURL(url){
    var r = await fetch(url);
    if (!r.ok) throw new Error('sprite fetch ' + r.status);
    var ext = (url.split('.').pop() || '').toLowerCase();
    var GUI = window.GUI;

    // Image → sprite
    if (/(png|jpg|jpeg|gif|svg)$/.test(ext)){
      var blob = await r.blob(); // image/*
      if (GUI && GUI.handleSpriteUpload && GUI.vm){
        await GUI.handleSpriteUpload(blob, blob.type || 'image/png');
        return;
      }
      var vm = window.vm || (GUI && GUI.vm);
      if (!vm) throw new Error('VM missing for sprite');
      // Best effort: add as costume to selected target
      if (vm.addCostume) {
        await vm.addCostume(blob);
        return;
      }
      log('No suitable sprite importer found (image fallback)');
      return;
    }

    // .sprite3 /.sprite2
    var ab = await r.arrayBuffer();
    if (GUI && GUI.handleSpriteUpload && GUI.vm){
      await GUI.handleSpriteUpload(new Blob([ab], {type:'application/zip'}));
      return;
    }
    var vm2 = window.vm || (GUI && GUI.vm);
    if (!vm2) throw new Error('VM missing for sprite');
    if (vm2.addSprite) {
      await vm2.addSprite(new Uint8Array(ab));
      return;
    }
    log('No suitable sprite importer found (.sprite3 fallback)');
  }

  whenVMReady(async function(){
    try{
      // SKY backdrop
      if (CFG.SKY_PNG){
        var skyURL = localUrl(CFG.SKY_PNG);
        log('Preload: adding Sky backdrop from ' + skyURL);
        await addBackdropFromURL(skyURL);
      }

      // APPLE sprite (prefer .sprite3; otherwise a PNG sprite)
      if (CFG.APPLE_SPRITE3) {
        var spr3URL = localUrl(CFG.APPLE_SPRITE3);
        log('Preload: adding Apple sprite3 from ' + spr3URL);
        await addSpriteFromURL(spr3URL);
      } else if (CFG.APPLE_PNG) {
        var appleURL = localUrl(CFG.APPLE_PNG);
        log('Preload: adding Apple PNG sprite from ' + appleURL);
        await addSpriteFromURL(appleURL);
      }

      log('Preload complete.');
    }catch(e){
      log('Preload error: ' + (e && e.message ? e.message : e));
      console.error(e);
    }
  });
})();
