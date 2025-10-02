// Minimal inline SVGs so sprite/backdrop do NOT require the network.
window.SASC_INLINE_ASSETS = {
  APPLE_SVG: `
<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <rect width="96" height="96" fill="none"/>
  <circle cx="48" cy="56" r="28" fill="#e53935"/>
  <path d="M48 20c6 0 10 5 10 10-6 0-10-5-10-10z" fill="#6d4c41"/>
  <path d="M48 20c-8 2-14 8-16 16 8-2 14-8 16-16z" fill="#4caf50"/>
  <circle cx="60" cy="48" r="4" fill="#bf2c2a"/>
</svg>`.trim(),

  SKY_SVG: `
<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#8ec5ff"/>
      <stop offset="100%" stop-color="#e3f3ff"/>
    </linearGradient>
  </defs>
  <rect width="480" height="360" fill="url(#sky)"/>
</svg>`.trim()
};
