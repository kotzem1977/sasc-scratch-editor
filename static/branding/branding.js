(function () {
  // ---------- tab title ----------
  try { document.title = 'SASC LMS'; } catch(e) {}

  // Convenience
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }

  // ---------- put SASC logo at the FAR LEFT of the menu bar ----------
  function injectLogo() {
    // Try common class fragments for the menu bar container
    var bar = $('.gui_menu-bar, [class*="menu-bar"], [class*="menubar"], header[class]');
    if (!bar) return false;

    if (!$('#sascMenuLogo', bar)) {
      var img = new Image();
      img.id = 'sascMenuLogo';
      img.className = 'sasc-menu-logo';
      img.alt = 'SA SchoolCoding';
      img.src = 'static/branding/sasc-logo.png';
      // Insert as the FIRST child so it's left of globe/File
      bar.insertBefore(img, bar.firstChild);
    }
    return true;
  }

  // try immediately, and again as the app mounts
  var logoTries = 0;
  var logoTimer = setInterval(function () {
    if (injectLogo() || ++logoTries > 40) clearInterval(logoTimer);
  }, 150);

  // ---------- Language allow-list ----------
  var ALLOWED = new Set([
    'Afrikaans',
    'English',
    'Deutsch',
    'isiXhosa',
    'isiZulu',
    'Sepedi',
    'Setswana'
  ]);
  // Accept if the visible label contains these tokens (helps when names include extra text)
  var TOKENS = ['afrikaans','english','deutsch','xhosa','zulu','sepedi','setswana'];

  function looksLikeLanguageContainer(el) {
    if (!el) return false;
    var t = (el.textContent || '').toLowerCase();
    // Language lists are long and include at least a couple of the tokens
    var tokenHits = TOKENS.reduce((n, tok) => n + (t.includes(tok) ? 1 : 0), 0);
    return tokenHits >= 2 && t.length > 200;
  }

  function isAllowedLabel(text) {
    if (!text) return false;
    var trimmed = text.trim();
    if (ALLOWED.has(trimmed)) return true;
    var low = trimmed.toLowerCase();
    return TOKENS.some(tok => low.includes(tok));
  }

  // Hide everything in a menu/list except the allowed items
  function filterLanguagesIn(el) {
    if (!el) return;
    // Common item patterns in SheepTester/Scratch GUI menus
    var candidates = $all(
      `
      [role="menuitemradio"],
      [role="menuitem"],
      li > button,
      li > div,
      .menu-item,
      .language-option,
      button,
      div
      `,
      el
    );
    // First pass: detect if this really is the language list
    var joined = candidates.map(x => (x.textContent||'').trim()).join('\n').toLowerCase();
    var likely = joined.split('\n').filter(Boolean).length > 30 && TOKENS.some(tok => joined.includes(tok));
    if (!likely && !looksLikeLanguageContainer(el)) return;

    // Second pass: hide/show
    candidates.forEach(node => {
      var label = (node.textContent || '').trim();
      // Keep group headers short words like "Language" or separators as-is:
      var isGroupHeader = (!label || label.length <= 2);
      if (isGroupHeader) return;
      // Default hide
      node.style.display = 'none';
      // Show if allowed
      if (isAllowedLabel(label)) node.style.display = '';
    });
  }

  function sweepForLanguageMenus() {
    // Known containers that host menus/portals/popovers
    var containers = $all('[role="menu"], [role="listbox"], .menu, .menus, .popover, .ReactModalPortal, body');
    containers.forEach(filterLanguagesIn);
  }

  // Watch for menus opening
  var mo = new MutationObserver(function (muts) {
    muts.forEach(m => {
      m.addedNodes.forEach(n => {
        if (!(n instanceof HTMLElement)) return;
        // If any added subtree looks like a big language list, filter it
        if (looksLikeLanguageContainer(n)) filterLanguagesIn(n);
        // Also scan any role=menu descendants immediately
        $all('[role="menu"], [role="listbox"]', n).forEach(filterLanguagesIn);
      });
    });
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });

  // Also sweep on clicks (after the dropdown opens)
  ['click','pointerup'].forEach(ev =>
    document.addEventListener(ev, () => {
      setTimeout(sweepForLanguageMenus, 0);
      setTimeout(sweepForLanguageMenus, 120);
      setTimeout(sweepForLanguageMenus, 400);
    })
  );

  // And a few timed sweeps after load for good measure
  window.addEventListener('load', () => {
    [200, 800, 2000, 3500].forEach(ms => setTimeout(sweepForLanguageMenus, ms));
  });
})();
