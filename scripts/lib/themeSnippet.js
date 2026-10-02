// The one dark-mode switch every page ships, in <head> before any stylesheet,
// so a page paints in the visitor's theme from the first frame. It reads the
// same localStorage key src/hooks/useTheme.js writes ('app-theme'), so a
// choice made on any page (the React app's 🌙 button, or the static pages'
// toggle) holds on every other page until the visitor switches it back.
// With no saved choice it follows the device (prefers-color-scheme), which
// is also what useTheme falls back to.
//
// Generators interpolate THEME_SNIPPET; the hand-written pages
// (public/index.html, about.html, terms.html) carry a literal copy, and
// scripts/verify-build.js fails the build if a built page lacks THEME_MARKER.
//
// It also wires any [data-theme-toggle] button on the page: the static pages'
// header toggle, so a visitor who lands on a guide can switch there too.

const THEME_KEY = 'app-theme';

// verify-build.js looks for this in every built page: the storage key as a
// quoted string. Either quote style, because CRA's minifier rewrites
// public/index.html's inline script with double quotes.
const THEME_MARKER = /["']app-theme["']/;

function themeSnippet(indent = '  ') {
  const body = `<!-- Theme — the visitor's saved light/dark choice, before first paint.
     Canonical source: scripts/lib/themeSnippet.js (see there for why). -->
<script>
  (function () {
    var root = document.documentElement, theme;
    try { theme = localStorage.getItem('app-theme'); } catch (e) {}
    if (theme !== 'dark' && theme !== 'light') {
      theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    root.setAttribute('data-theme', theme);
    document.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('[data-theme-toggle]');
      if (!btn) return;
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('app-theme', next); } catch (e) {}
    });
  })();
</script>`;
  return body.split('\n').map((l, i) => (i === 0 || !l ? l : indent + l)).join('\n');
}

// The static pages' header button. Its icon is drawn by CSS from
// html[data-theme] (guide.css .theme-toggle), so it is right on first paint
// without any script touching it.
const THEME_TOGGLE_HTML =
  '<button type="button" class="theme-toggle" data-theme-toggle aria-label="Switch between light and dark mode" title="Switch between light and dark mode"></button>';

module.exports = { THEME_KEY, THEME_MARKER, themeSnippet, THEME_SNIPPET: themeSnippet('  '), THEME_TOGGLE_HTML };
