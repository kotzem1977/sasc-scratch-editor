(function () {
  // ---------- tab title ----------
  try { document.title = 'SASC LMS'; } catch (e) {}

  const $  = (s, r) => (r||document).querySelector(s);
  const $$ = (s, r) => Array.from((r||document).querySelectorAll(s));

  // ---------- logo (same as before, kept) ----------
  function injectLogo() {
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
      bar.insertBefore(img, bar.firstChild || null);
    }
    return true;
  }

  let tries = 0;
  const t = setInterval(() => {
    if (injectLogo() || ++tries > 60) clearInterval(t);
  }, 150);

  // ---------- language allow-list ----------
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

  function isAllowed(text) {
    if (!text) return false;
    const label = text.trim();
    if (ALLOWED.has(label)) return true;
    const low = label.toLowerCase();
    return TOKENS.some(tok => low.includes(tok));
  }

  // Identify the language menu heuristically: lots of items + multiple known tokens
  function looksLikeLanguageMenu(menuEl) {
    const items = $$('[role="menuitemradio"], [role="menuitem"], li > button, .menu-item, button', menuEl);
    if (items.length < 10) return false;
    const joined = items.map(n => (n.textContent||'').toLowerCase()).join(' ');
    let hits = 0; TOKENS.forEach(tok => { if (joined.includes(tok)) hits++; });
    return hits >= 2;
  }

  function pruneMenu(menuEl) {
    const items = $$('[role="menuitemradio"], [role="menuitem"], li > button, .menu-item, button', menuEl);
    items.forEach(node => {
      const label = (node.textContent || '').trim();
      // Keep very short / divider-like entries
      if (!label || label.length <= 2) return;
      node.style.display = isAllowed(label) ? '' : 'none';
    });
  }

  // Observe ALL popups; only prune those that look like language menus
  const mo = new MutationObserver(muts => {
    muts.forEach(m => {
      m.addedNodes.forEach(n => {
        if (!(n instanceof HTMLElement)) return;
        if (n.getAttribute && (n.getAttribute('role') === 'menu' || n.getAttribute('role') === 'listbox')) {
          if (looksLikeLanguageMenu(n)) pruneMenu(n);
        }
        $$('[role="menu"], [role="listbox"]', n).forEach(el => {
          if (looksLikeLanguageMenu(el)) pruneMenu(el);
        });
      });
    });
  });
  mo.observe(document.body, { childList: true, subtree: true });

  // Also prune on every click—useful right after opening the globe menu
  const poke = () => {
    setTimeout(() => {
      $$('[role="menu"], [role="listbox"]').forEach(el => {
        if (looksLikeLanguageMenu(el)) pruneMenu(el);
      });
    }, 30);
  };
  ['click','pointerup','keydown'].forEach(ev => document.addEventListener(ev, poke, true));

  // Safety sweeps
  [200, 600, 1200, 2400, 4000].forEach(ms => setTimeout(poke, ms));
})();
