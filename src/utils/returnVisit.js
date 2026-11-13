// Shared by the app and the static guide beacon. Only the comparison leaves
// the browser. Keep a bounded history of paths, without queries or fragments.
function recordPageRevisit(path) {
  try {
    const tabKey = 'db-revisit:' + path;
    const recorded = sessionStorage.getItem(tabKey);
    if (recorded !== null) return undefined;

    const key = 'db-page-history';
    const history = JSON.parse(localStorage.getItem(key) || '[]');
    const previous = history.includes(path);
    localStorage.setItem(key, JSON.stringify(history.filter(entry => entry !== path).slice(-199).concat(path)));
    sessionStorage.setItem(tabKey, previous ? '1' : '0');
    return previous || undefined;
  } catch (_) {
    return undefined;
  }
}

module.exports = { recordPageRevisit };
