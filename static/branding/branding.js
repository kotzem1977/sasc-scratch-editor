(function () {
  // 1) Tab title
  try { document.title = 'SASC LMS'; } catch (e) {}

  // 2) Add the SASC badge overlay (once)
  try {
    if (!document.getElementById('sasc-brand-badge')) {
      var badge = document.createElement('div');
      badge.id = 'sasc-brand-badge';
      document.body.appendChild(badge);
    }
  } catch (e) {}

  // 3) Language menu filter
  // Keep these visible; hide all other language entries (NOT deleting them).
  var ALLOWED = new Set([
    'Afrikaans',
    'English',
    'Deutsch',
    'isiXhosa',
    'isiZulu',
    'Sepedi',
    'Setswana'
  ]);

  // Some builds render localized labels; allow English + common self-names too:
  var ALSO_MATCH_IF_CONTAINS = [
    'afrikaans', 'english', 'deutsch', 'xhosa', 'zulu', 'sepedi', 'setswana'
  ];

  function looksLikeLanguageMenu(menuEl) {
    if (!menuEl) return false;
    var txt = (menuEl.textContent || '').toLowerCase();
    // Heuristic: language menus are long and contain at least one of these markers
    var hasMarker = txt.includes('english') || txt.includes('afrikaans') || txt.includes('deutsch');
    return hasMarker || (txt.split('\n').length > 40); // lots of items
  }

  function shouldHideItem(text) {
    if (!text) return false;
    var label = text.trim();
    if (!label) return false;

    if (ALLOWED.has(label)) return false; // keep exact matches

    // If label contains any of our known self-names but isn’t exact, keep it
    var low = label.toLowerCase();
    for (var i=0; i<ALSO_MATCH_IF_CONTAINS.length; i++) {
      if (low.includes(ALSO_MATCH_IF_CONTAINS[i])) return false;
    }
    // Otherwise, hide it — but only if it actually looks like a language-y entry
    // (has letters and no menu control wording)
    if (/[a-z]/i.test(label) && !/search|clear|reset|back|help|about/i.test(label)) {
      return true;
    }
    return false;
  }

  function pruneMenu(menu) {
    var items = menu.querySelectorAll('[role="menuitemradio"], [role="menuitem"], li, button, .menu_item, .menu-item, [class*="menu-item"]');
    items.forEach(function (el) {
      var t = (el.textContent || '').trim();
      if (shouldHideItem(t)) {
        el.style.display = 'none';
      }
    });
  }

  // Observe new menus and prune eagerly
  var obs = new MutationObserver(function (muts) {
    muts.forEach(function (m) {
      m.addedNodes.forEach(function (node) {
        if (!(node instanceof HTMLElement)) return;
        // Check this node and any nested role="menu"
        var menus = [];
        if (node.getAttribute && node.getAttribute('role') === 'menu') menus.push(node);
        node.querySelectorAll && node.querySelectorAll('[role="menu"]').forEach(function (n){ menus.push(n); });
        menus.forEach(function(menu){
          if (looksLikeLanguageMenu(menu)) pruneMenu(menu);
        });
      });
    });
  });
  obs.observe(document.body, { childList: true, subtree: true });

  // Also prune on click & after a short delay (covers lazy-rendered menus)
  function sweep() {
    document.querySelectorAll('[role="menu"]').forEach(function(menu){
      if (looksLikeLanguageMenu(menu)) pruneMenu(menu);
    });
  }
  document.addEventListener('click', function(){
    setTimeout(sweep, 0);
    setTimeout(sweep, 150);
    setTimeout(sweep, 500);
  });
  window.addEventListener('load', function(){
    setTimeout(sweep, 500);
    setTimeout(sweep, 1200);
  });
})();
