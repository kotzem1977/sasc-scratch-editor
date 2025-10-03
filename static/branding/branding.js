(function () {
  // ---------- tab title ----------
  try { document.title = 'SASC LMS'; } catch (e) {}

  // helpers
  const $  = (s, r) => (r||document).querySelector(s);
  const $$ = (s, r) => Array.from((r||document).querySelectorAll(s));

  // ---------- put SASC logo at the FAR LEFT of the menu bar ----------
  function injectLogo() {
    // Try common class fragments for the menu bar container
    const bar =
      $('.gui_menu-bar') ||
      $('[class*="menu-bar"]') ||
      $('header [class]');
    if (!bar) return false;

    if (!$('#sascMenuLogo')) {
      const img = new Image();
      img.id = 'sascMenuLogo';
      img.className = 'sasc-menu-logo';
      img.alt = 'SA SchoolCoding';
      img.src = 'static/branding/sasc-logo.png';
      // insert as first child so it's left of globe/File
      bar.insertBefore(img, bar.firstChild || null);
    }
    return true;
  }

  // Try repeatedly while React mounts
  let tries = 0;
  const t = setInterval(() => {
    if (injectLogo() || ++tries > 60) clearInterval(t);
  }, 150);

  // ---------- Language allow-list (ONLY inside the language menu) ----------
  const ALLOWED = new Set([
    'Afrikaans',
    'English',
    'Deutsch',
    'isiXhosa',
    'isiZulu',
    'Sepedi',
    'Setswana'
  ]);
  const TOKENS = ['afrikaans','english','deutsch','xhosa','zulu','sepedi','setswana'];

  function isAllowedLabel(text) {
    if (!text) return false;
    const label = text.trim();
    if (ALLOWED.has(label)) return true;
    const low = label.toLowerCase();
    return TOKENS.some(tok => low.includes(tok));
  }

  // Detect if a given menu looks like the *language* menu
  function isLanguageMenu(menuEl) {
    if (!menuEl) return false;
    // Must be an ARIA menu with lots of items and contain several known language tokens
    const items = $$('[role="menuitemradio"], [role="menuitem"], li > button, .menu-item, button', menuEl);
    if (items.length < 10) return false;
    const joined = items.map(n => (n.textContent||'').toLowerCase()).join(' ');
    const hits = TOKENS.reduce((n,tok)=> n + (joined.includes(tok)?1:0), 0);
    return hits >= 2;
  }

  function filterLanguageMenu(menuEl) {
    const items = $$('[role="menuitemradio"], [role="menuitem"], li > button, .menu-item, button', menuEl);
    items.forEach(node => {
      const label = (node.textContent || '').trim();
      // Group headings or separators typically have very short labels; leave them alone
      if (!label || label.length <= 2) return;
      // Hide by default; show if allowed
      node.style.display = isAllowedLabel(label) ? '' : 'none';
    });
  }

  // Observe added menus; only process menus that look like the language menu
  const mo = new MutationObserver(muts => {
    muts.forEach(m => {
      m.addedNodes.forEach(n => {
        if (!(n instanceof HTMLElement)) return;
        // Check the node itself if it's a menu
        if (n.getAttribute && (n.getAttribute('role') === 'menu' || n.getAttribute('role') === 'listbox')) {
          if (isLanguageMenu(n)) filterLanguageMenu(n);
        }
        // … and any descendant menus
        $$('[role="menu"], [role="listbox"]', n).forEach(el => {
          if (isLanguageMenu(el)) filterLanguageMenu(el);
        });
      });
    });
  });
  mo.observe(document.body, { childList: true, subtree: true });

  // Also try right after clicks (menus typically open on click)
  ['click','pointerup'].forEach(ev => {
    document.addEventListener(ev, () => {
      setTimeout(() => {
        $$('[role="menu"], [role="listbox"]').forEach(el => {
          if (isLanguageMenu(el)) filterLanguageMenu(el);
        });
      }, 50);
    });
  });

  // Safety sweeps shortly after load
  window.addEventListener('load', () => {
    [300, 800, 1500, 3000].forEach(ms => {
      setTimeout(() => {
        $$('[role="menu"], [role="listbox"]').forEach(el => {
          if (isLanguageMenu(el)) filterLanguageMenu(el);
        });
      }, ms);
    });
  });
})();
