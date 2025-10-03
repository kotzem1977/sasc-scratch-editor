(function () {
  // 1) Tab title
  try { document.title = 'SASC LMS'; } catch (e) {}

  // 2) Add the SASC badge overlay as an IMG (reliable paths on GH Pages)
  try {
    if (!document.getElementById('sasc-brand-badge')) {
      var img = document.createElement('img');
      img.id = 'sasc-brand-badge';
      // RELATIVE path (works on /<user>/<repo>/)
      img.src = 'static/branding/sasc-logo.png';
      img.alt = 'SA SchoolCoding';
      document.body.appendChild(img);
    }
  } catch (e) {}

  // 3) Language menu filter (hide-all-then-allow some)
  var ALLOWED = new Set([
    'Afrikaans',
    'English',
    'Deutsch',
    'isiXhosa',
    'isiZulu',
    'Sepedi',
    'Setswana'
  ]);

  // Also keep these if we detect them (self-names / lowercases)
  var ALSO_MATCH_IF_CONTAINS = [
    'afrikaans','english','deutsch','xhosa','zulu','sepedi','setswana'
  ];

  // Heuristic: figure out which "menu" looks like languages
  function isLanguageMenu(el) {
    if (!el) return false;
    var txt = (el.textContent || '').toLowerCase();
    // language menus usually contain "english" or lots of items
    return txt.includes('english') || txt.split('\n').length > 40;
  }

  function isAllowedLabel(label) {
    if (!label) return false;
    var trimmed = label.trim();
    if (ALLOWED.has(trimmed)) return true;
    var low = trimmed.toLowerCase();
    for (var i=0; i<ALSO_MATCH_IF_CONTAINS.length; i++) {
      if (low.includes(ALSO_MATCH_IF_CONTAINS[i])) return true;
    }
    return false;
  }

  function hideAllThenAllow(menu) {
    // common item nodes: role menuitem*, li > button, button in menus, etc.
    var items = menu.querySelectorAll(
      '[role="menuitemradio"],[role="menuitem"],li > button,li,[class*="menu-item"],button'
    );
    items.forEach(function (el) {
      var t = (el.textContent || '').trim();
      // Hide everything by default
      el.style.display = 'none';
      // If allowed, show it
      if (isAllowedLabel(t)) {
        el.style.display = '';
      }
    });
  }

  // Sweep every time menus might (re)render
  function sweep() {
    // Try general menu containers
    document.querySelectorAll('[role="menu"], .menu, .popover, .ReactModalPortal, [class*="menu"]').forEach(function (menu) {
      try {
        if (isLanguageMenu(menu)) hideAllThenAllow(menu);
      } catch (e) {}
    });
  }

  // Observe DOM for new menus
  var obs = new MutationObserver(function (muts) {
    muts.forEach(function (m) {
      m.addedNodes.forEach(function (node) {
        if (!(node instanceof HTMLElement)) return;
        if (node.getAttribute && (node.getAttribute('role') === 'menu')) {
          if (isLanguageMenu(node)) hideAllThenAllow(node);
        }
        node.querySelectorAll && node.querySelectorAll('[role="menu"]').forEach(function (sub) {
          if (isLanguageMenu(sub)) hideAllThenAllow(sub);
        });
      });
    });
  });
  obs.observe(document.body, { childList: true, subtree: true });

  // Also sweep on clicks and shortly after load (covers lazy-rendered menus)
  document.addEventListener('click', function () {
    setTimeout(sweep, 0);
    setTimeout(sweep, 120);
    setTimeout(sweep, 400);
  });
  window.addEventListener('load', function(){
    setTimeout(sweep, 300);
    setTimeout(sweep, 1200);
  });
})();
