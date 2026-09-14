// Detects a request that almost certainly did NOT come from a visitor's
// browser — a direct API hit (curl, a script, an audit-session verification
// step) rather than a page load through the live site. Used only to LABEL
// such traffic in the LLM usage report — it is deliberately still counted
// in every total, just broken out so audit/dev-testing cost doesn't read as
// real visitor demand for a tool nobody has actually opened.
//
// Narrower on purpose than metrics.js's BOT_UA (which also excludes real
// crawlers/uptime monitors from page-view counts): this only needs to catch
// the handful of HTTP clients a person or script actually uses to hit an
// API directly. A client this misses just stays unlabeled — same as today.
const TEST_CLIENT_UA = /curl|wget|python-requests|node-fetch|^axios|go-http|postman|insomnia|httpie|^okhttp/i;

function isTestClient(req) {
  const ua = (req && req.headers && req.headers['user-agent']) || '';
  return TEST_CLIENT_UA.test(ua);
}

module.exports = { isTestClient };
