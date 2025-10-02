// Mount GUI and bind VM (robust fiber scan + store subscribe + observer)
(function mount(){
  try{
    const app=document.getElementById('app');
    const GUI=window.GUI;

    if(window.React && !window.react){ window.react=window.React; __sascTag('SASC','react alias set');}
    if(window.ReactDOM && !window['react-dom']){ window['react-dom']=window.ReactDOM; __sascTag('SASC','react-dom alias set');}
    if(window.Redux && !window.redux){ window.redux=window.Redux; __sascTag('SASC','redux alias set');}

    if(!GUI){ __sascTag('SASC','ERROR: window.GUI missing'); return; }
    if(typeof GUI.setAppElement==='function') GUI.setAppElement(app);
    if(typeof GUI.render==='function'){
      GUI.render(app);
      __sascTag('SASC','GUI mounted via GUI.render(app)');
    }else{
      let Wrapped=GUI.default||GUI.GUI||GUI;
      if(typeof GUI.AppStateHOC==='function') Wrapped=GUI.AppStateHOC(Wrapped);
      if(typeof GUI.ProjectLoaderHOC==='function') Wrapped=GUI.ProjectLoaderHOC(Wrapped);
      if(typeof GUI.HashParserHOC==='function') Wrapped=GUI.HashParserHOC(Wrapped);
      const props={isPlayerOnly:false,isFullScreen:false,canUseCloud:false,projectId:(location.hash&&/\d+/.test(location.hash))?undefined:'0'};
      const el=window.React.createElement(Wrapped,props);
      window.ReactDOM.render(el,app);
      __sascTag('SASC','GUI mounted via HashParser(ProjectLoader(AppState(GUI))) with projectId='+(props.projectId||'hash'));
    }
  }catch(e){ __sascTag('SASC','BOOT ERROR: '+(e&&e.message)); }
})();

(function(){
  function fiberKeyOf(n){ if(!n) return null; for(const k in n){ if(k.startsWith('__reactFiber$')||k.startsWith('__reactInternalInstance$')) return k; } return null; }
  function findAnyFiberNode(root){ if(!root) return null; const q=[root]; while(q.length){ const n=q.shift(); if(fiberKeyOf(n)) return n; if(n.shadowRoot) q.push(n.shadowRoot); if(n.childNodes) for(const c of n.childNodes) q.push(c); } return null; }
  function getReactFiberFromDom(node){ const k=fiberKeyOf(node); return k?node[k]:null; }
  function* walkFibers(root){ if(!root) return; const seen=new Set(), stack=[root]; while(stack.length){ const f=stack.pop(); if(!f||seen.has(f)) continue; seen.add(f); yield f; if(f.child) stack.push(f.child); if(f.sibling) stack.push(f.sibling); if(f.return&&!seen.has(f.return)) stack.push(f.return); } }
  function tryExtractStoreFromFiber(f){ try{ const n=f.stateNode; if(n?.store?.getState) return n.store; if(n?.props?.store?.getState) return n.props.store; }catch(_){ } return null; }
  function vmFromStore(store){ try{ const st=store.getState?.(); if(st?.vm?.runtime) return st.vm; if(st?.scratchGui?.vm?.runtime) return st.scratchGui.vm; if(st?.scratch?.vm?.runtime) return st.scratch.vm; }catch(_){ } return null; }

  let bound=false; let observer=null;

  async function bindVM(timeoutMs=15000){
    const t0=Date.now(), app=document.getElementById('app');

    function tryOnce(){
      const GUI=window.GUI||{}; const direct=window.vm||GUI.vm;
      if(direct?.runtime){ window.vm=direct; __sascTag('VM','ready (direct)'); return direct; }
      const host=findAnyFiberNode(app); if(!host) return null;
      const root=getReactFiberFromDom(host); if(!root) return null;
      for(const f of walkFibers(root)){
        const store=tryExtractStoreFromFiber(f);
        if(store){
          try{ const unsub=store.subscribe(()=>{ const v=vmFromStore(store); if(v?.runtime && !bound){ window.vm=v; bound=true; __sascTag('VM','ready (store subscribe)'); try{unsub();}catch(_){}}}); }catch(_){}
          const vNow=vmFromStore(store); if(vNow?.runtime){ window.vm=vNow; __sascTag('VM','ready (store immediate)'); return vNow; }
        }
        try{
          const props=f.memoizedProps||f.pendingProps||(f.stateNode&&f.stateNode.props);
          const state=f.memoizedState||(f.stateNode&&f.stateNode.state);
          for(const c of [props,state,f.stateNode,f]){
            if(!c || typeof c!=='object') continue;
            for(const k in c){ const v=c[k]; if(v && typeof v==='object' && v.runtime && v.runtime.targets){ window.vm=v; __sascTag('VM','ready (fiber props/state)'); return v; } }
          }
        }catch(_){}
      }
      return null;
    }
    if(!observer){
      observer=new MutationObserver(()=>{ if(bound) return; const v=tryOnce(); if(v){ bound=true; } });
      observer.observe(app,{childList:true,subtree:true});
    }
    while(Date.now()-t0<timeoutMs && !bound){
      const v=tryOnce(); if(v){ bound=true; return v; }
      await new Promise(r=>setTimeout(r,200));
      __sascLog('still waiting for VM…');
    }
    if(!bound) __sascLog('rebind: VM not found after fiber scan');
    return bound?window.vm:null;
  }

  window.bindVM = bindVM;

  // SASC buttons
  document.getElementById('btn-bind').onclick=()=>bindVM(10000);
})();
