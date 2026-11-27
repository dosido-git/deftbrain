import PARTNERS from '../data/partners.json';

// The partner a visit came through (owner, 2026-11-27: partner perks). A visit
// that starts on a partner's page (/for/<id>) keeps that partner for the rest
// of the tab's session, so the tools it opens can show the partner's own
// contacts and "Provided by" line. sessionStorage only, like the analytics
// landing path: nothing outlives the tab and nothing is sent anywhere.
const KEY = 'db-partner';

export function partnerById(id) {
  if (!id || !Object.prototype.hasOwnProperty.call(PARTNERS, id)) return null;
  const p = PARTNERS[id];
  if (p.retired) return null;
  // `contacts` is the list of people to reach; older records have one `help` line.
  const contacts = p.contacts || (p.help ? [{ label: p.help.text, phone: p.help.phone }] : []);
  return { id, ...p, contacts };
}

export function rememberPartner(id) {
  try { if (partnerById(id)) sessionStorage.setItem(KEY, id); } catch (_) { /* private mode: no partner context */ }
}

export function usePartner() {
  let id = null;
  try { id = sessionStorage.getItem(KEY); } catch (_) { /* none */ }
  return partnerById(id);
}
