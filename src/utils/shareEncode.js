// Encodes a small JSON payload directly into a URL-safe string and back —
// used by The Final Word's share links (see TheFinalWord.js
// handleCreateShareLink and components/SharedVerdict.js) so a shared
// verdict needs no server-side storage at all. A prior version stored
// verdicts server-side (in memory, then in a JSON file) and both broke the
// same way: an id that resolved fine one moment 404'd the next once the
// backend process — or, in production, the whole container — cycled
// before the link was opened. A link that carries its own data can't go
// stale that way; it works for as long as the /verdict/:id route exists,
// full stop.
//
// btoa/atob only handle Latin1 strings, so JSON containing non-ASCII text
// (an accented name, a non-English verdict) is routed through
// TextEncoder/TextDecoder rather than the older escape/unescape trick —
// same result, without the deprecated APIs.
export function encodeSharePayload(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let binary = '';
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Returns the decoded object, or null if `str` isn't a payload this encoder
// produced (a stale link from the old server-side flow, a mistyped id, or
// simple garbage) — callers treat null as "not found," not as a crash.
export function decodeSharePayload(str) {
  try {
    const b64 = String(str || '').replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch (_) {
    return null;
  }
}
