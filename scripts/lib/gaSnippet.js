// The one Google Analytics tag every page ships. Generators interpolate
// GA_SNIPPET; the three hand-written pages (public/index.html, about.html,
// terms.html) carry a literal copy — scripts/verify-build.js fails the build
// if any built page loads gtag without GA_HOST_TEST below.
//
// Skips GA for the owner's own traffic, two ways:
//   1. Any host but deftbrain.com — localhost dev, `serve build` previews,
//      Railway preview URLs. Nothing to remember.
//   2. The db-operator flag (?operator=1 sets it, ?operator=0 clears it) —
//      for browsing the LIVE site. Same localStorage key src/utils/analytics.js
//      uses for first-party metrics. localStorage is per-origin, so set it
//      once on deftbrain.com and once on www.deftbrain.com if both are used.

const GA_ID = 'G-0MLY19QEW6';

// verify-build.js looks for GA_HOST_TEST in every built page. It's the
// regex+call only, not the whole `if`, because CRA minifies public/index.html's
// inline script (the `if (!…) return` gets rewritten, the regex literal doesn't).
const GA_HOST_TEST = "/(^|\\.)deftbrain\\.com$/.test(location.hostname)";
const GA_GUARD = `if (!${GA_HOST_TEST}) return;`;

function gaSnippet(indent = '  ') {
  const body = `<!-- Google tag (gtag.js) — skipped for owner/dev traffic.
     Canonical source: scripts/lib/gaSnippet.js (see there for why). -->
<script>
  (function () {
    try {
      var params = new URLSearchParams(window.location.search);
      var op = params.get('operator');
      if (op === '1') localStorage.setItem('db-operator', '1');
      else if (op === '0') localStorage.removeItem('db-operator');
      if (localStorage.getItem('db-operator') === '1') return;
    } catch (e) {}
    ${GA_GUARD}

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=${GA_ID}';
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', '${GA_ID}');
  })();
</script>`;
  return body.split('\n').map((l, i) => (i === 0 || !l ? l : indent + l)).join('\n');
}

module.exports = { GA_ID, GA_GUARD, GA_HOST_TEST, gaSnippet, GA_SNIPPET: gaSnippet('  ') };
