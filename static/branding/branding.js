(function () {
  // Change tab title
  document.title = 'SASC LMS';

  // Add your visual badge overlay
  var badge = document.createElement('div');
  badge.id = 'sasc-brand-badge';
  document.body.appendChild(badge);

  // Limit the language menu: keep these labels, hide the rest (not deleted)
  // NOTE: This filters by the visible label text in the menu.
  var allowed = new Set([
    'Afrikaans',
    'English',
    'Deutsch',
    'isiXhosa',
    'isiZulu',
    'Sepedi',
    'Setswana'
  ]);

  function pruneMenu(menu) {
    var items = menu.querySelectorAll('[role="menuitemradio"], [role="menuitem"], li, button, .menu_item');
    items.forEach(function (el) {
      var t = (el.textContent || '').trim();
      // hide any item that looks like a language but isn't allowed
      // Keep non-language controls/search boxes automatically
      if (t && /[A-Za-z]/.test(t) && !allowed.has(t)) {
        el.style.display = 'none';
      }
    });
  }

  // Observe popover menus opening and prune when we detect a language list
  var obs = new MutationObserver(function (muts) {
    muts.forEach(function (m) {
      m.addedNodes.forEach(function (node) {
        if (!(node instanceof HTMLElement)) return;
        // Heuristics: Scratch/TW language menu is a large menu containing "English" in it
        var menu = node;
        if (menu.getAttribute && (menu.getAttribute('role') === 'menu' || menu.querySelector('[role="menu"]'))) {
          if (menu.getAttribute('role') !== 'menu') menu = menu.querySelector('[role="menu"]') || menu;
          var txt = (menu.textContent || '').toLowerCase();
          if (txt.includes('english')) {
            pruneMenu(menu);
          }
        }
      });
    });
  });
  obs.observe(document.body, { childList: true, subtree: true });

  // Also try pruning on clicks (in case menu is rendered outside the DOM subtree we first saw)
  document.addEventListener('click', function () {
    var menus = document.querySelectorAll('[role="menu"]');
    menus.forEach(function (menu) {
      var txt = (menu.textContent || '').toLowerCase();
      if (txt.includes('english')) pruneMenu(menu);
    });
  });
})();
