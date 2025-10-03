/**
 * SASC branding + language menu filter (brute-force + resilient)
 * - Reinjects logo on rerenders
 * - Filters language menu every time it opens, and with periodic sweeps
 * - Works on minified SheepTester builds where roles/classes may differ
 */
(function () {
  // ---------- page title ----------
  try { document.title = 'SASC LMS'; } catch (e) {}

  // ---------- helpers ----------
  const $  = (s, r) => (r||document).querySelector(s);
  const $$ = (s, r) => Array.from((r||document).querySelectorAll(s));

  // ---------- logo ----------
  function injectLogo() {
    // Try several likely selectors for the top bar
    const bar =
      $('.gui_menu-bar') ||
      $('[class*="menu-bar"]') ||
      $('header [class]') ||
      $('header');
    if (!bar) return false;

    // Already present? ensure correct position (very first)
    const existing = $('#sascMenuLogo');
    if (existing && existing.parentElement === bar) {
      if (bar.firstChild !== existing) {
        bar.insertBefore(existing, bar.firstChild);
      }
      return true;
    }

    // Create it
    const img = new Image();
    img.id = 'sascMenuLogo';
    img.className = 'sasc-menu-logo';
    img.alt = 'SA SchoolCoding';
    img.src = 'static/branding/sasc-logo.png';
    // Insert as the very first element
    bar.insertBefore(img, bar.firstChild || null);
    return true;
  }

  // Keep trying to inject the logo (SPA re-renders, language switch, etc.)
  let logoTries = 0;
  const logoTimer = setInterval(() => {
    if (injectLogo() || ++logoTries > 120) clearInterval(logoTimer);
  }, 150);

  // Also re-inject on major DOM changes
  new MutationObserver(() => injectLogo())
    .observe(document.documentElement, {childList:true, subtree:true});

  // ---------- language filtering ----------
  // Labels we allow by human-readable name
  const ALLOWED_LABELS = new Set([
    'Afrikaans',
    'English',
    'Deutsch',
    'isiXhosa',
    'isiZulu',
    'Sepedi',
    'Setswana'
  ]);
  // Common locale codes to allow
  const ALLOWED_CODES = new Set([
    'af', 'af-za',
    'en', 'en-us', 'en-gb', 'en-za',
    'de', 'de-de',
    'xh', 'xh-za',
    'zu', 'zu-za',
    'nso', 'nso-za', 'nso_ZA', // Sepedi
    'nso_za',
    'nso-za',
    'tn', 'tn-za',            // Setswana
    'tsw', 'tsw-za'
  ]);
  // Fuzzy tokens as a last resort on textContent
  const TOKENS = ['afrikaans','english','deutsch','xhosa','zulu','sepedi','setswana'];

  const looksLikeLangMenu = (menuEl) => {
    // Heuristic: a menu/popover with many items, many contain short labels or language names
    const items = getMenuItems(menuEl);
    if (items.length < 10) return false;
    const joined = items.map(n => (n.textContent||'').toLowerCase()).join(' ');
    let hits = 0; TOKENS.forEach(tok => { if (joined.includes(tok)) hits++; });
    return hits >= 2;
  };

  function getMenuItems(root) {
    // Be very permissive about what counts as a "menu item"
    return $$(
      // reach/menu, headlessui, listbox, or generic buttons in popovers
      '[role="menuitemradio"], [role="menuitem"], [role="option"], li > button, li > a, .menu-item, button, a',
      root
    ).filter(n => {
      const txt = (n.textContent || '').trim();
      // Skip empty or purely decorative
      return txt && txt.length > 1;
    });
  }

  function nodeAllowedByAttrs(node) {
    const attrs = ['lang', 'data-lang', 'data-locale', 'data-value', 'value'];
    for (const a of attrs) {
      const v = (node.getAttribute && node.getAttribute(a)) || '';
      if (!v) continue;
      const low = v.toLowerCase();
      if (ALLOWED_CODES.has(low)) return true;
      // Codes like "de_DE"
      if (ALLOWED_CODES.has(low.replace('_','-'))) return true;
    }
    return false;
  }

  function nodeAllowedByText(node) {
    const label = (node.textContent || '').trim();
    if (ALLOWED_LABELS.has(label)) return true;
    const low = label.toLowerCase();
    return TOKENS.some(tok => low.includes(tok));
  }

  function pruneMenu(menuEl) {
    const items = getMenuItems(menuEl);
    items.forEach(node => {
      // Dividers or subheaders:
      const txt = (node.textContent || '').trim();
      if (!txt || txt.length <= 2) return;

      const ok = nodeAllowedByAttrs(node) || nodeAllowedByText(node);
      node.style.display = ok ? '' : 'none';
    });
  }

  function sweepAllOpenMenus() {
    // Look for likely flyouts/menus appended to body/portals
    const menus = $$('[role="menu"], [role="listbox"], .ReactModalPortal, .menu, .popover, .Popover, .Menu, .menu', document.body);
    menus.forEach(m => {
      try {
        if (looksLikeLangMenu(m)) pruneMenu(m);
      } catch (e) {}
    });
  }

  // Observe newly-added menus (portals)
  const menuObserver = new MutationObserver((muts) => {
    muts.forEach(m => {
      m.addedNodes.forEach(n => {
        if (!(n instanceof HTMLElement)) return;
        if (looksLikeLangMenu(n)) pruneMenu(n);
        // Also check descendants
        $$('[role="menu"], [role="listbox"]', n).forEach(el => {
          if (looksLikeLangMenu(el)) pruneMenu(el);
        });
      });
    });
  });
  menuObserver.observe(document.body, { childList: true, subtree: true });

  // Poke a few times after UI events (open globe menu etc.)
  const poke = () => {
    // Run a few delayed sweeps to catch animations/portals
    [30, 120, 300, 800, 1600].forEach(ms => setTimeout(sweepAllOpenMenus, ms));
  };
  ['click','pointerup','keydown','focusin'].forEach(ev =>
    document.addEventListener(ev, poke, true)
  );

  // Initial safety sweeps
  [300, 1000, 2500, 5000].forEach(ms => setTimeout(sweepAllOpenMenus, ms));
})();
