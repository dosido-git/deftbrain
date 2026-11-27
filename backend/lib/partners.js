// Partner lookup for the server (owner, 2026-11-27: consortia). A partner id is
// either "<partner>" or "<consortium>/<member>". A member inherits its
// consortium's record (tools, intro, contacts, logo) and overrides any of it;
// it is shown with its own name, as part of the consortium's edition.
// src/hooks/usePartner.js resolves ids the same way for the browser;
// scripts/check-partners.js fails the push if the two ever disagree.
const PARTNERS = require('../../src/data/partners.json');

const has = (o, k) => Boolean(o) && Object.prototype.hasOwnProperty.call(o, k);

function resolvePartner(id) {
  const [parentId, memberId, extra] = String(id || '').split('/');
  if (extra !== undefined || !has(PARTNERS, parentId)) return null;
  const parent = PARTNERS[parentId];
  if (memberId === undefined) return { id: parentId, ...parent, isConsortium: has(parent, 'members') };
  if (parent.retired || !has(parent.members, memberId)) return null;
  const { members, ...base } = parent;
  const member = parent.members[memberId];
  return {
    ...base,
    ...member,
    id: `${parentId}/${memberId}`,
    parentId,
    edition: parent.edition || parent.name,
    retired: Boolean(member.retired),
  };
}

// Every id that has a page: partners, and each consortium's members.
function allPartnerIds() {
  const out = [];
  for (const [id, p] of Object.entries(PARTNERS)) {
    out.push(id);
    for (const m of Object.keys(p.members || {})) out.push(`${id}/${m}`);
  }
  return out;
}

// Websites allowed to show DeftBrain in a frame (partner build list E5): each
// active partner's or member's `embedOrigins`. Empty means no site may frame
// DeftBrain, which is how it has always been.
function embedOrigins() {
  const out = new Set();
  for (const id of allPartnerIds()) {
    const p = resolvePartner(id);
    if (p && !p.retired) for (const o of p.embedOrigins || []) out.add(o);
  }
  return [...out];
}

module.exports = { resolvePartner, allPartnerIds, embedOrigins, PARTNERS };
