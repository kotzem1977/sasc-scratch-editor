/* --- SASC PRELOAD APPLE + SKY (idempotent, local-only) --- */
(function preloadAppleSky(){
  if (window.__sascPreloadInstalled) return;
  window.__sascPreloadInstalled = true;

  var CFG = Object.assign({
    APPLE_SPRITE3: null,   // optional: <md5>.sprite3 if you ever mirror sprite3
    APPLE_PNG:     null,   // typical for our flow: <md5>.png|jpg|jpeg in /static/assets
    SKY_PNG:       null    // backdrop: <md5>.png|jpg|jpeg in /static/assets
  }, (window.SASC_ASSETS || {}));

  function log(m){
    try { const p = document.querySelector('#sasc-console pre'); if (p) p.textContent += m + '\n'; } catch(_){}
    console.log('[SASC preload]', m);
  }

  function whenVMReady(cb, timeoutMs){
    var t0 = Date.now(), to = timeoutMs || 20000;
    var iv = setInterval(function(){
      var GUI = window.GUI, vm = window.vm || (GUI && GUI.vm);
      if (vm && vm.runtime && vm.runtime.targets && vm.runtime.targets.length){
        clearInterval(iv); cb(vm); return;
      }
      if (Date.now() - t0 > to){ clearInterval(iv); log('VM not ready in time'); }
    }, 250);
  }

  async function addBackdropFromURL(vm, url){
    try{
      const r = await fetch(url); if (!r.ok) throw new Error('HTTP '+r.status);
      const blob = await r.blob();
      const m = /\.(\w+)$/.exec(url); const ext = (m && m[1]) ? m[1] : 'png';
      const md5ext = url.split('/').pop();
      await vm.addBackdrop(blob, {
        name: 'Sky',
        md5: md5ext,
        rotationCenterX: 240, rotationCenterY: 180,
        type: (blob.type || ('image/'+ext))
      });
      log('Backdrop added from ' + url);
    }catch(e){ log('Backdrop add error: ' + e); }
  }

  async function addSpriteFromURL(vm, url, name){
    try{
      const r = await fetch(url); if (!r.ok) throw new Error('HTTP '+r.status);
      const blob = await r.blob();
      const m = /\.(\w+)$/.exec(url); const ext = (m && m[1]) ? m[1].toLowerCase() : '';
      if (ext === 'sprite3'){
        await vm.addSprite(blob);
        log('Sprite .sprite3 added from ' + url);
        return;
      }
      // Build bitmap costume sprite from raw image
      const arrayBuf = await blob.arrayBuffer();
      const md5ext = url.split('/').pop();
      const costume = {
        name: name + '-costume',
        md5ext,
        dataFormat: (ext || 'png').toUpperCase(),
        rotationCenterX: 48, rotationCenterY: 48
      };
      await vm.addSprite2({
        name,
        isStage: false,
        visible: true,
        x: 0, y: 0, size: 100, direction: 90, draggable: false, rotationStyle: 'all around',
        costumes: [costume],
        sounds: []
      }, { zipSkinBuffers: { [md5ext]: new Uint8Array(arrayBuf) } });
      log('Sprite created from image ' + url);
    }catch(e){ log('Sprite add error: ' + e); }
  }

  whenVMReady(async function(vm){
    try{
      // Backdrop (Sky) first
      if (CFG.SKY_PNG) {
        const skyURL = (location.pathname.replace(/\/[^/]*$/, '') + '/static/assets/' + CFG.SKY_PNG).replace(/\/{2,}/g,'/');
        await addBackdropFromURL(vm, skyURL);
      } else {
        log('SKY_PNG not set; skipping backdrop');
      }

      // Apple next
      if (CFG.APPLE_SPRITE3) {
        const aURL = (location.pathname.replace(/\/[^/]*$/, '') + '/static/assets/' + CFG.APPLE_SPRITE3).replace(/\/{2,}/g,'/');
        await addSpriteFromURL(vm, aURL, 'Apple');
      } else if (CFG.APPLE_PNG) {
        const aURL = (location.pathname.replace(/\/[^/]*$/, '') + '/static/assets/' + CFG.APPLE_PNG).replace(/\/{2,}/g,'/');
        await addSpriteFromURL(vm, aURL, 'Apple');
      } else {
        log('APPLE_PNG/APPLE_SPRITE3 not set; skipping Apple');
      }
    }catch(e){
      log('Preload error: ' + e);
    }
  });
})();
