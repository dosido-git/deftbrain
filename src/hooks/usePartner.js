import PARTNERS from '../data/partners.json';

// The partner a visit came through (owner, 2026-11-27: partner perks). A visit
// that starts on a partner's page (/for/<id>, or /for/<consortium>/<member>)
// keeps that partner for the rest of the tab's session, so the tools it opens
// can show the partner's own contacts and "Provided by" line. sessionStorage
// only, like the analytics landing path: nothing outlives the tab and nothing
// is sent anywhere.
const KEY = 'db-partner';
const has = (o, k) => Boolean(o) && Object.prototype.hasOwnProperty.call(o, k);

// Same rules as backend/lib/partners.js (scripts/check-partners.js compares
// them): a member inherits its consortium's record and overrides any of it.
// Returns the record even when retired, so the page can forward; callers that
// show partner content use partnerById, which drops retired ones.
export function resolvePartner(id) {
  const [parentId, memberId, extra] = String(id || '').split('/');
  if (extra !== undefined || !has(PARTNERS, parentId)) return null;
  const parent = PARTNERS[parentId];
  let p;
  if (memberId === undefined) p = { id: parentId, ...parent, isConsortium: has(parent, 'members') };
  else {
    if (parent.retired || !has(parent.members, memberId)) return null;
    const { members, ...base } = parent;
    p = { ...base, ...parent.members[memberId], id: `${parentId}/${memberId}`, parentId, edition: parent.edition || parent.name, retired: Boolean(parent.members[memberId].retired) };
  }
  // `contacts` is the list of people to reach; older records have one `help` line.
  const contacts = p.contacts || (p.help ? [{ label: p.help.text, phone: p.help.phone }] : []);
  return { ...p, contacts };
}

export function partnerById(id) {
  const p = resolvePartner(id);
  return p && !p.retired ? p : null;
}

export function rememberPartner(id) {
  try { if (partnerById(id)) sessionStorage.setItem(KEY, id); } catch (_) { /* private mode: no partner context */ }
}

// The partner this visit came through, as a request header for the server's
// cost-per-partner accounting (internal only; never shown to a partner).
export function partnerHeader() {
  let id = null;
  try { id = sessionStorage.getItem(KEY); } catch (_) { /* none */ }
  const p = partnerById(id);
  return p && !p.retired ? { 'X-DB-Partner': p.id } : {};
}

export function usePartner() {
  let id = null;
  try { id = sessionStorage.getItem(KEY); } catch (_) { /* none */ }
  return partnerById(id);
}
