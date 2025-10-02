// Local-first asset hooks for internalapi/asset/*/get → /static/assets
(function(){
  const base=location.pathname.replace(/\/[^/]*$/,'/'); const repoRoot=base.replace(/\/$/,'');
  const toLocal=u=>{
    const m=u&&u.match(/internalapi\/asset\/([a-f0-9]{32}\.(?:sprite3|json|svg|png|gif|jpg|wav|mp3))\/get\/?/i);
    return m?(repoRoot+'/static/assets/'+m[1]):null;
  };
  const f=window.fetch;
  window.fetch=async function(i,init){
    const url=(typeof i==='string')?i:(i&&i.url);
    const local=toLocal(url);
    if(local){ try{ const r=await f(local,init); if(r&&r.ok) return r; }catch(_){ } }
    return f.apply(this,arguments);
  };
  const XO=XMLHttpRequest;
  window.XMLHttpRequest=function(){
    const x=new XO(); const _open=x.open; let original=null,method='GET';
    x.open=function(m,u){ method=m; original=u; const local=(typeof u==='string')?toLocal(u):null;
      if(local){ _open.call(x,m,local); const onload=()=>{ if(!(x.status>=200&&x.status<300)){ x.removeEventListener('load',onload); _open.call(x,method,original); x.send(); } };
        x.addEventListener('load',onload); return; }
      return _open.apply(x,arguments);
    };
    return x;
  };
  __sascTag('SASC','hooks installed (assets local-first with XHR fallback)');
})();
