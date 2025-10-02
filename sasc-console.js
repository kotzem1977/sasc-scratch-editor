(function(){
  const pre = document.getElementById('sasc-log');
  const box = document.getElementById('sasc-console');
  const out=(tag,msg)=>{
    const line=(tag?(`[${tag}] `):'')+msg;
    try{pre.textContent+=line+'\n'; pre.scrollTop=pre.scrollHeight;}catch(_){}
    console.log(line);
  };
  window.__sascLog=(m)=>out('',m);
  window.__sascTag=(t,m)=>out(t,m);

  document.getElementById('btn-clear').onclick=()=>{ pre.textContent='SASC clear\n'; };
  document.getElementById('btn-contrast').onclick=()=>{ 
    box.setAttribute('data-theme', box.getAttribute('data-theme')==='dark'?'light':'dark'); 
  };
  document.getElementById('btn-copy').onclick=async()=>{
    const txt = pre.textContent;
    try{ await navigator.clipboard.writeText(txt); __sascTag('SASC','log copied to clipboard'); }
    catch(e){ __sascTag('SASC','copy failed: '+(e&&e.message||e)); }
  };

  // Surface unhandled rejections to SASC
  window.addEventListener('unhandledrejection',e=>out('unhandledrejection',(e.reason&&(e.reason.stack||e.reason))));
})();
