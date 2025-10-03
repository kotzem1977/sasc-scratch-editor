/**
 * SASC branding tweaks:
 *  - Wrap logo in a link to schoolcoding.co.za (new tab)
 *  - Hide the "flags" button (the globe/URL settings that opens flags.html)
 *  - Keep working across re-renders (MutationObserver + periodic checks)
 */
(function () {
  // ---------- helpers ----------
  const $  = (s, r) => (r||document).querySelector(s);
  const $$ = (s, r) => Array.from((r||document).querySelectorAll(s));

  // ---------- page title ----------
  try { document.title = 'SASC LMS'; } catch (e) {}

  // ---------- inject clickable logo ----------
  function injectLogo() {
    // Try several likely selectors for the top bar
    const bar =
      $('.gui_menu-bar') ||
      $('[class*="menu-bar"]') ||
      $('header [class]') ||
      $('header');
    if (!bar) return false;

    // Ensure link wrapper exists and is first in the bar
    let link = $('#sascMenuLogoLink');
    if (!link) {
      link = document.createElement('a');
      link.id = 'sascMenuLogoLink';
      link.href = 'https://www.schoolcoding.co.za';
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
      img.src = 'static/branding/sasc-logo.png';
      link.appendChild(img);
      bar.insertBefore(link, bar.firstChild || null);
    } else {
      // move to the very start if something pushed it away
      if (bar.firstChild !== link) bar.insertBefore(link, bar.firstChild);
      // refresh href (just in case)
      link.href = 'https://www.schoolcoding.co.za';
      link.target = '_blank';
      link.rel = 'noopener';
    }
    return true;
  }

  // ---------- hide the flags button ----------
  function hideFlagsButton(root=document) {
    // 1) Anything linking to flags.html
    $$('a[href$="flags.html"], a[href*="flags.html"]', root).forEach(a => {
      a.style.display = 'none';
      a.setAttribute('aria-hidden', 'true');
      a.tabIndex = -1;
    });

    // 2) That known sheep asset icon next to the logo
    $$('img[src*="6d026568fc8d1c2ccb6bfe7b5623c4ca.svg"]', root).forEach(img => {
      const parent = img.closest('a,button,[role="button"]') || img;
      parent.style.display = 'none';
      parent.setAttribute('aria-hidden', 'true');
      parent.tabIndex = -1;
    });

    // 3) Anything with a tooltip/title like "URL settings"
    $$('a[title*="URL"], button[title*="URL"]', root).forEach(el => {
      if ((el.href || '').includes('flags.html')) {
        el.style.display = 'none';
        el.setAttribute('aria-hidden','true');
        el.tabIndex = -1;
      }
    });
  }

  // Initial runs
  injectLogo();
  hideFlagsButton();

  // Re-run as the SPA UI re-renders
  const obs = new MutationObserver(() => {
    injectLogo();
    hideFlagsButton();
  });
  obs.observe(document.documentElement, { childList: true, subtree: true });

  // Also retry a few times in case of async portal mounts
  [150, 400, 1000, 2000].forEach(ms => setTimeout(() => {
    injectLogo();
    hideFlagsButton();
  }, ms));
})();
