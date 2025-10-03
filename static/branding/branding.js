/**
 * SASC branding tweaks
 *  - Clickable logo (left)
 *  - Hide/remove Sheep flags button
 *  - Prune language menu to whitelist
 */
(function () {
  const $  = (s, r) => (r||document).querySelector(s);
  const $$ = (s, r) => Array.from((r||document).querySelectorAll(s));

  // --- Config ---
  const TITLE = 'SASC LMS';
  const LOGO_URL = 'static/branding/sasc-logo.png';
  const LOGO_LINK = 'https://www.schoolcoding.co.za';
  const LANG_WHITELIST = [
    'Afrikaans','English','Deutsch','isiXhosa','isiZulu','Sepedi','Setswana'
  ];
  const norm = s => (s||'').toString().trim().toLowerCase();

  // ---------- page title ----------
  try { document.title = TITLE; } catch (e) {}

  // ---------- inject clickable logo ----------
  function injectLogo() {
    const bar = $('.gui_menu-bar') || $('[class*="menu-bar"]');
    if (!bar) return;
    let link = $('#sascMenuLogoLink');
    if (!link) {
      link = document.createElement('a');
      link.id = 'sascMenuLogoLink';
      link.href = LOGO_LINK;
      link.target = '_blank';
      link.rel = 'noopener';
      link.style.display = 'inline-flex';
      link.style.alignItems = 'center';
      const img = new Image();
      img.src = LOGO_URL;
      img.alt = 'SA SchoolCoding';
      img.className = 'sasc-menu-logo';
      link.appendChild(img);
      bar.insertBefore(link, bar.firstChild || null);
    }
  }

  // ---------- hide/remove Sheep flags button ----------
  function removeFlags(root=document) {
    // Kill anchor or button linking to flags.html
    $$('a[href*="flags.html"],button[onclick*="flags.html"]', root).forEach(el=>{
      el.remove();
    });
    // Kill sheep SVG asset
    $$('img[src*="6d026568fc8d1c2ccb6bfe7b5623c4ca.svg"]', root).forEach(el=>{
      const parent = el.closest('a,button') || el;
      parent.remove();
    });
  }

  // ---------- prune language menu ----------
  function isWhite(txt){ return LANG_WHITELIST.map(norm).includes(norm(txt)); }
  function pruneMenus(root=document){
    $$('select',root).forEach(sel=>{
      if(sel.options.length>=20){
        Array.from(sel.options).forEach(opt=>{
          if(!isWhite(opt.textContent)){ opt.remove(); }
        });
      }
    });
    $$('[role="menu"],[role="listbox"]',root).forEach(menu=>{
      $$('[role="menuitem"],[role="option"],li,button,a,div',menu).forEach(el=>{
        if(el.textContent && !isWhite(el.textContent)){ el.remove(); }
      });
    });
  }

  // Initial run
  injectLogo();
  removeFlags();
  pruneMenus();

  // Watch for re-renders
  const obs = new MutationObserver(()=>{ injectLogo(); removeFlags(); pruneMenus(); });
  obs.observe(document.documentElement,{childList:true,subtree:true});
})();
