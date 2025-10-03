/**
 * SASC branding tweaks
 *  - Clickable logo (left)
 *  - Hide "flags" button (URL settings)
 *  - Prune language menu to a whitelist
 *  - Persist across SPA re-renders
 */
(function () {
  const $  = (s, r) => (r||document).querySelector(s);
  const $$ = (s, r) => Array.from((r||document).querySelectorAll(s));

  // --- Config ---
  const TITLE = 'SASC LMS';
  const LOGO_URL = 'static/branding/sasc-logo.png';
  const LOGO_LINK = 'https://www.schoolcoding.co.za';

  // Only these language display names should remain (case-insensitive match on text)
  const LANG_WHITELIST = [
    'Afrikaans',
    'English',
    'Deutsch',
    'isiXhosa',
    'isiZulu',
    'Sepedi',
    'Setswana'
  ];

  // Utilities
  const norm = s => (s||'').toString().trim().toLowerCase();

  // ---------- page title ----------
  try { document.title = TITLE; } catch (e) {}

  // ---------- inject clickable logo ----------
  function injectLogo() {
    const bar =
      $('.gui_menu-bar') ||
      $('[class*="menu-bar"]') ||
      $('header [class]') ||
      $('header');
    if (!bar) return false;

    let link = $('#sascMenuLogoLink');
    if (!link) {
      link = document.createElement('a');
      link.id = 'sascMenuLogoLink';
      link.href = LOGO_LINK;
      link.target = '_blank';
      link.rel = 'noopener';
      link.style.display = 'inline-flex';
      link.style.alignItems = 'center';
      link.style.textDecoration = 'none';
      link.style.cursor = 'pointer';

      const img = new Image();
      img.id = 'sascMenuLogo';
      img.className = 'sasc-menu-logo';
      img.alt = 'SA SchoolCoding';
      img.src = LOGO_URL;
      link.appendChild(img);
      bar.insertBefore(link, bar.firstChild || null);
    } else {
      if (bar.firstChild !== link) bar.insertBefore(link, bar.firstChild);
      link.href = LOGO_LINK;
    }
    return true;
  }

  // ---------- hide the flags button ----------
  function hideFlagsButton(root=document) {
    // links to flags.html
    $$('a[href$="flags.html"], a[href*="flags.html"]', root).forEach(a => {
      a.style.display = 'none';
      a.setAttribute('aria-hidden', 'true');
      a.tabIndex = -1;
    });

    // sheep icon near menu (known asset)
    $$('img[src*="6d026568fc8d1c2ccb6bfe7b5623c4ca.svg"]', root).forEach(img => {
      const parent = img.closest('a,button,[role="button"]') || img;
      parent.style.display = 'none';
      parent.setAttribute('aria-hidden', 'true');
      parent.tabIndex = -1;
    });

    // buttons titled like URL/flags
    $$('a[title*="URL"], button[title*="URL"]', root).forEach(el => {
      if ((el.href || '').includes('flags.html')) {
        el.style.display = 'none';
        el.setAttribute('aria-hidden','true');
        el.tabIndex = -1;
      }
    });
  }

  // ---------- prune language menu ----------
  function isWhitelistedLabel(text) {
    const t = norm(text);
    return LANG_WHITELIST.map(norm).includes(t);
  }

  function pruneSelect(select) {
    const options = Array.from(select.options || []);
    let changed = false;
    options.forEach(opt => {
      const txt = opt.textContent || opt.label || '';
      if (!isWhitelistedLabel(txt)) {
        opt.disabled = true;
        opt.hidden = true;
        opt.style.display = 'none';
        changed = true;
      }
    });
    if (changed) {
      // If current value disappeared, force English
      const curTxt = (select.selectedOptions[0] || {}).textContent || '';
      if (!isWhitelistedLabel(curTxt)) {
        const en = options.find(o => isWhitelistedLabel(o.textContent));
        if (en) select.value = en.value;
      }
    }
  }

  function pruneMenuList(root=document) {
    // Typical ARIA menus or listboxes
    $$('[role="menu"],[role="listbox"]', root).forEach(menu => {
      const items = $$('[role="menuitem"],[role="option"],li,button,a,div', menu);
      let any = false;
      items.forEach(el => {
        // Prefer text content
        const txt = (el.getAttribute('data-locale') || el.textContent || '').trim();
        if (!txt) return;
        // Only hide if it looks like a language list (more than ~10 items total)
        any = true;
        if (!isWhitelistedLabel(txt)) {
          el.style.display = 'none';
          el.setAttribute('aria-hidden','true');
          el.tabIndex = -1;
        }
      });
      if (any) {
        // Optional: compact spacing after hides
        menu.style.maxHeight = '50vh';
        menu.style.overflowY = 'auto';
      }
    });
  }

  function pruneLanguageUIs(root=document) {
    // 1) Native <select> (some builds use this)
    $$('select', root).forEach(sel => {
      // try to detect via nearby label or many known languages
      if (sel.options && sel.options.length >= 20) pruneSelect(sel);
    });

    // 2) Custom menus opened from the globe button
    pruneMenuList(root);
  }

  // Run now…
  injectLogo();
  hideFlagsButton();
  pruneLanguageUIs();

  // …and keep running as the SPA re-renders / menus open
  const obs = new MutationObserver(muts => {
    let rerun = false;
    for (const m of muts) {
      // If a menu/dropdown portal is added, re-prune
      if (m.addedNodes && m.addedNodes.length) { rerun = true; break; }
    }
    if (rerun) {
      injectLogo();
      hideFlagsButton();
      pruneLanguageUIs();
    }
  });
  obs.observe(document.documentElement, { childList: true, subtree: true });

  // Retry a few times for async mounts
  [150, 400, 1000, 2000].forEach(ms => setTimeout(() => {
    injectLogo();
    hideFlagsButton();
    pruneLanguageUIs();
  }, ms));
})();
